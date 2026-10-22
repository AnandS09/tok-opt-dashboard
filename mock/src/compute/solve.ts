/**
 * Spec 6.2 and 6.3: the two functions that sweep the engine, `solveAtBudget`
 * and `frontier`. Both call the internal core, not `compute()`.
 */

import type {
  FrontierAxis,
  FrontierPoint,
  FrontierResult,
  Scenario,
  SolveAxis,
  SolveResult,
  Tables,
} from "../contract";
import { USERS_RANGE } from "../data/ranges";
import { computeCore } from "./core";
import { SpeedInfeasibleError } from "./infravana";
import { NoBestSingleError } from "./today";
import { compositeScores } from "./patterns";
import { speedUnavailableReason } from "./tradeoff";

/** The scan starts here: one hundredth of the current volume. */
export const SCAN_START = 0.01;
/** Each scanned scale is the one before times this: 1 percent steps. */
export const SCAN_STEP = 1.01;
/** The bisection stops when the bracket is this fraction of its lower end: 0.1 percent. */
export const BISECT_TOLERANCE = 0.001;
/** The ceiling is this many budgets over a side's linear spend at the current volume. */
export const CEILING_BUDGETS = 2;
/**
 * Where the downward search gives up. Reached only if a side's spend still
 * exceeds the budget at one billionth of the current volume.
 */
const MIN_SCALE = 1e-9;

/** True when the scenario's workload mix has employee work, so the `users` axis has something to scale. */
export function hasEmployeeWork(scenario: Scenario, tables: Tables): boolean {
  return tables.workloads.some(
    (w) => w.basis === "employee" && (scenario.workload_mix[w.workload_id] ?? 0) > 0,
  );
}

/** Both sides' spend, and the tokens demanded, at one scale of the volume. */
interface Evaluation {
  today_usd: number;
  infravana_usd: number;
  demand_tokens: number;
}

/**
 * `tables` with every workload's tokens per user per day multiplied by `k`
 * (spec 6.2 G2: employee and customer work alike). Only `workloads` is new.
 */
function withIntensity(tables: Tables, k: number): Tables {
  return {
    ...tables,
    workloads: tables.workloads.map((w) => ({
      ...w,
      tok_in_per_user_day: w.tok_in_per_user_day * k,
      tok_out_per_user_day: w.tok_out_per_user_day * k,
    })),
  };
}

/**
 * The scenario and tables at scale `k` of the volume: `intensity` scales the
 * tokens per user of all workloads, `users` scales the head-count, which
 * moves employee workloads only (customer workloads follow `customers`).
 */
function scaled(
  scenario: Scenario,
  tables: Tables,
  axis: SolveAxis,
  k: number,
): { scenario: Scenario; tables: Tables } {
  if (axis === "intensity") return { scenario, tables: withIntensity(tables, k) };
  return {
    scenario: { ...scenario, baseline: { ...scenario.baseline, users: scenario.baseline.users * k } },
    tables,
  };
}

/** A scale within the budget and the first scanned scale above it that is not (null when none follows). */
interface Bracket {
  lo: number;
  hi: number | null;
}

/**
 * Geometric scan from SCAN_START to the ceiling. `lo` is the largest scale
 * seen within the budget, `hi` the first scanned scale after it that is not.
 * Spend is not monotone in volume, so every scanned point is tested rather
 * than stopping at the first miss. Null when no scanned point fits.
 */
function scanUp(spendAt: (scale: number) => number, budgetUsd: number, ceiling: number): Bracket | null {
  let found: Bracket | null = null;
  for (let s = SCAN_START; s <= ceiling; s *= SCAN_STEP) {
    if (spendAt(s) <= budgetUsd) found = { lo: s, hi: null };
    else if (found !== null && found.hi === null) found = { lo: found.lo, hi: s };
  }
  return found;
}

/**
 * Spec 6.2 has no rule for a budget that buys under one hundredth of the
 * current volume (or a ceiling below SCAN_START), so the scan continues
 * downward in the same 1 percent steps until a scale fits. Null when even
 * MIN_SCALE does not fit, which happens when a side has a cost that does not
 * shrink with the volume (the per-person fee of a seat plan against the
 * `intensity` axis) and the budget is below it.
 */
function scanDown(spendAt: (scale: number) => number, budgetUsd: number): Bracket | null {
  if (spendAt(MIN_SCALE) > budgetUsd) return null;
  let above = SCAN_START;
  for (let s = SCAN_START / SCAN_STEP; s >= MIN_SCALE; s /= SCAN_STEP) {
    if (spendAt(s) <= budgetUsd) return { lo: s, hi: above };
    above = s;
  }
  return { lo: MIN_SCALE, hi: above };
}

/**
 * The largest scanned scale whose spend is within the budget, refined by
 * bisection against the next scanned point (spec 6.2).
 *
 * @param spendAt This side's spend at a scale.
 * @param budgetUsd The quarterly budget.
 * @param linearSpendUsd This side's spend at scale 1, which sets the ceiling.
 * @returns The scale, or 0 when no volume fits (see `scanDown`).
 */
function solveSide(
  spendAt: (scale: number) => number,
  budgetUsd: number,
  linearSpendUsd: number,
): number {
  const ceiling = (CEILING_BUDGETS * budgetUsd) / linearSpendUsd;
  const bracket = scanUp(spendAt, budgetUsd, ceiling) ?? scanDown(spendAt, budgetUsd);
  if (bracket === null) return 0;
  let lo = bracket.lo;
  // A result at the top of the scan has no scanned point above it to bisect against.
  if (bracket.hi === null) return lo;
  let hi = bracket.hi;
  while ((hi - lo) / lo > BISECT_TOLERANCE) {
    const mid = (lo + hi) / 2;
    if (spendAt(mid) <= budgetUsd) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
 * Spec 6.2 `solveAtBudget`: the largest volume at which each side's spend
 * stays within the budget, for one axis.
 *
 *   - `intensity` (goal G2): scale the tokens per user per day of all
 *     workloads, employee and customer.
 *   - `users` (goal G3): scale the head-count, so employee workloads only;
 *     customers stay fixed. The scales, tokens and `multiple` are the true
 *     solved ones, never clamped; `capped_at_users_max` is true whenever
 *     either side's solved head-count (its scale times the scenario's
 *     people) is above the users range (spec 5.2), and the page shows the
 *     "more than 10,000 people" message in place of the figure.
 *
 * Each side has its own ceiling, twice the budget over that side's linear
 * spend at the current volume. The scan is geometric from 0.01 in 1 percent
 * steps and returns the largest scanned scale within the budget, bisected
 * against the next scanned point to 0.1 percent. The scenario's own floors
 * and speed apply on both sides: any G4 trade-off is ignored. It solves the
 * `baseline` state.
 *
 * A side's scale is 0 when no volume fits its budget: a seat plan's
 * per-person fee does not shrink with the `intensity` axis, so a budget below
 * it fits nothing. Its tokens are then 0, and `multiple` is `Infinity` when
 * only Today is at 0 (1 when both are).
 *
 * Throws if there is no demand to scale, if the budget is not positive, or
 * for the `users` axis if the mix has no employee work (the page disables
 * G3 then, see `goalAvailability`).
 */
export function solveAtBudget(scenario: Scenario, tables: Tables, axis: SolveAxis): SolveResult {
  const budgetUsd = scenario.baseline.budget_usd_per_quarter;
  if (!(budgetUsd > 0) || !Number.isFinite(budgetUsd)) {
    throw new Error(`solveAtBudget: the budget must be a positive number, got ${budgetUsd}`);
  }
  if (axis === "users" && !hasEmployeeWork(scenario, tables)) {
    throw new Error('solveAtBudget(axis "users"): the workload mix has no employee work to scale');
  }

  // G1 to G3 always use the visitor's own floors and speed (spec 6.2).
  const { tradeoff: _ignored, ...own } = scenario;

  // Both sides come from one engine run, so a scale tested for one side is
  // free for the other: the two scans share the same geometric grid.
  const evaluations = new Map<number, Evaluation>();
  const evaluate = (scale: number): Evaluation => {
    const known = evaluations.get(scale);
    if (known !== undefined) return known;
    const at = scaled(own, tables, axis, scale);
    const core = computeCore(at.scenario, at.tables);
    const evaluation = {
      today_usd: core.allocation.total_usd,
      infravana_usd: core.allocation.infravana
        .filter((segment) => segment.kind !== "savings")
        .reduce((sum, segment) => sum + segment.usd, 0),
      demand_tokens: core.tokens_bought.demand_tokens,
    };
    evaluations.set(scale, evaluation);
    return evaluation;
  };

  const current = evaluate(1);
  if (!(current.today_usd > 0) || !(current.infravana_usd > 0)) {
    throw new Error("solveAtBudget: the scenario has no spend at its current volume, so there is nothing to scale");
  }

  const todayScale = solveSide((s) => evaluate(s).today_usd, budgetUsd, current.today_usd);
  const infravanaScale = solveSide((s) => evaluate(s).infravana_usd, budgetUsd, current.infravana_usd);

  // Only the flag carries the cap: clamping the scales would distort the multiple.
  const cap = USERS_RANGE.max / own.baseline.users;
  const capped = axis === "users" && (todayScale > cap || infravanaScale > cap);

  const tokensAt = (scale: number): number => (scale > 0 ? evaluate(scale).demand_tokens : 0);
  return {
    axis,
    today_scale: todayScale,
    infravana_scale: infravanaScale,
    multiple: todayScale > 0 ? infravanaScale / todayScale : infravanaScale > 0 ? Infinity : 1,
    today_tokens: tokensAt(todayScale),
    infravana_tokens: tokensAt(infravanaScale),
    capped_at_users_max: capped,
  };
}

/** Which frontier axes can be shown, and why not (a one-line reason, else null). */
export interface FrontierAvailability {
  quality: string | null;
  speed: string | null;
}

/**
 * Spec 6.3: the quality view is always available; the speed view needs at
 * least one proprietary offer with speed data (`speedUnavailableReason`).
 */
export function frontierAvailability(tables: Tables): FrontierAvailability {
  return { quality: null, speed: speedUnavailableReason(tables) };
}

/** Workloads that carry demand in the scenario's mix. */
function workloadsInMix(scenario: Scenario, tables: Tables) {
  const used = tables.workloads.filter((w) => (scenario.workload_mix[w.workload_id] ?? 0) > 0);
  return used.length > 0 ? used : tables.workloads.filter((w) => w.workload_id in scenario.workload_mix);
}

/** The visitor's current setting on an axis: the lowest workload floor, or the latency class's minimum speed. */
function currentThreshold(scenario: Scenario, tables: Tables, axis: FrontierAxis): number {
  if (axis === "speed") {
    return tables.manifest.parameters.latency_classes[scenario.latency_class].min_tok_s_per_user;
  }
  const floors = workloadsInMix(scenario, tables).map((w) => scenario.quality_floor ?? w.quality_floor);
  return floors.length > 0 ? Math.min(...floors) : (scenario.quality_floor ?? 0);
}

/**
 * The thresholds spec 6.3 sweeps, ascending: the distinct composite scores of
 * the scenario's workloads (quality), or the distinct `tok_s_per_user` values
 * of the proprietary offers that carry speed data and of the throughput rows
 * (speed).
 */
export function frontierThresholds(scenario: Scenario, tables: Tables, axis: FrontierAxis): number[] {
  const values = new Set<number>();
  if (axis === "quality") {
    const workloads = new Set(workloadsInMix(scenario, tables).map((w) => w.workload_id));
    for (const [key, score] of compositeScores(tables)) {
      if (workloads.has(key.slice(key.indexOf("|") + 1))) values.add(score);
    }
  } else {
    const proprietary = new Set(
      tables.models.filter((m) => m.license === "proprietary").map((m) => m.model_id),
    );
    for (const o of tables.model_offers) {
      if (proprietary.has(o.model_id) && o.tok_s_per_user !== null) values.add(o.tok_s_per_user);
    }
    for (const row of tables.throughput_curves) values.add(row.tok_s_per_user);
  }
  return [...values].sort((a, b) => a - b);
}

/**
 * Spec 6.3 `frontier`: tokens a quarter the budget buys with InfraVana at
 * each threshold, for one axis. Each point is one engine run, so a point
 * equals a direct `computeCore()` at that threshold.
 *
 *   - `quality`: one global floor replaces every workload's floor
 *     (`Scenario.quality_floor`, so each point equals `compute()` on that
 *     scenario). The speed stays the scenario's.
 *   - `speed`: the minimum tokens a second per user. It replaces the latency
 *     class for the InfraVana plan with no limit on time to first token, so
 *     offers slower than it cannot be used, and a proprietary model may move
 *     to its own batch or flex tier (spec 7.2 step 3; see `EngineOptions`). A
 *     threshold at which some model the visitor buys has no offer fast enough
 *     has no plan and gives no point. Floors stay the scenario's.
 *
 * The scenario's own floors and speed apply on the axis not swept, and any G4
 * trade-off is ignored, as in `solveAtBudget`. Only points not beaten on both
 * axes are returned (no other point has a threshold at least as high and at
 * least as many tokens, with one strictly more), ordered by threshold. Higher
 * is stricter on both axes, so with a monotone engine the tokens never rise as
 * the threshold tightens, and the filter makes that hold regardless.
 * `current_threshold` marks the visitor's own setting and need not be a point.
 *
 * Throws for the speed axis while `frontierAvailability` gives a reason, and
 * for a threshold that is not a finite number.
 */
export function frontier(
  scenario: Scenario,
  tables: Tables,
  axis: FrontierAxis,
  thresholds: readonly number[],
): FrontierResult {
  const unavailable = frontierAvailability(tables)[axis];
  if (unavailable !== null) throw new Error(`frontier(axis "${axis}"): ${unavailable}`);
  const bad = thresholds.find((t) => !Number.isFinite(t));
  if (bad !== undefined) throw new Error(`frontier(axis "${axis}"): threshold ${bad} is not a finite number`);

  const { tradeoff: _ignored, ...own } = scenario;
  const tokensAt = (threshold: number): number | null => {
    try {
      const core =
        axis === "quality"
          ? computeCore({ ...own, quality_floor: threshold }, tables)
          : computeCore(own, tables, { min_tok_s_per_user: threshold });
      return core.tokens_bought.infravana_tokens;
    } catch (error) {
      // A global floor above every model of the comparator's kind leaves no plan at that threshold, as a speed no offer meets does.
      if (error instanceof SpeedInfeasibleError || error instanceof NoBestSingleError) return null;
      throw error;
    }
  };

  const swept: FrontierPoint[] = [];
  for (const threshold of [...new Set(thresholds)].sort((a, b) => a - b)) {
    const tokens = tokensAt(threshold);
    if (tokens !== null) swept.push({ threshold, infravana_tokens: tokens });
  }

  // From the strictest threshold down, keep a point only if it buys more than every stricter one.
  const kept: FrontierPoint[] = [];
  let best = -Infinity;
  for (let i = swept.length - 1; i >= 0; i--) {
    const point = swept[i] as FrontierPoint;
    if (point.infravana_tokens > best) {
      kept.push(point);
      best = point.infravana_tokens;
    }
  }
  return { axis, points: kept.reverse(), current_threshold: currentThreshold(scenario, tables, axis) };
}
