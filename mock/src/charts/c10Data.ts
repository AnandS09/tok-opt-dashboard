/**
 * The numbers behind C10 (spec 6.3), with no drawing: the frontier of the
 * view in focus, the visitor's own setting on it, and where each grey Today
 * option stands. `c10Pareto.tsx` draws them; the benefit boxes read them.
 */
import type {
  BenefitBox,
  BenefitContext,
  FrontierAxis,
  FrontierPoint,
  FrontierResult,
  PatternId,
  Provenance,
  Results,
  Scenario,
  Tables,
  TodayAlternative,
} from "../contract";
import { deriveDemand } from "../compute/demand";
import { frontier, frontierAvailability, frontierThresholds } from "../compute";
import { deriveBestSingle, patternById, rowsForPattern } from "../compute/patterns";
import { comparisonOf } from "./comparison";
import type { OptionBar } from "./comparison";

/** Which axis C10 plots; the same words as the hash field `c10`. */
export type C10View = FrontierAxis;

/**
 * The view that is drawn: the one asked for, except that the speed view falls
 * back to quality while no proprietary offer has speed data (spec 6.3, 10).
 */
export function effectiveView(requested: C10View, tables: Tables): C10View {
  return requested === "speed" && frontierAvailability(tables).speed !== null ? "quality" : requested;
}

/** The reason the speed view cannot be offered, or null when it can. */
export function speedViewReason(tables: Tables): string | null {
  return frontierAvailability(tables).speed;
}

/** The frontier of one view: one engine run per distinct threshold of the axis (spec 6.3). */
export function frontierForView(scenario: Scenario, tables: Tables, view: C10View): FrontierResult {
  return frontier(scenario, tables, view, frontierThresholds(scenario, tables, view));
}

/**
 * What the budget buys at a setting on the axis, read off the step line: the
 * tokens of the first point whose threshold is at least `threshold`, since a
 * stricter setting never buys more and every threshold at which the plan can
 * change is a point of the sweep. Null when no point is that strict.
 */
export function tokensAtThreshold(points: readonly FrontierPoint[], threshold: number): number | null {
  const at = points.find((p) => p.threshold >= threshold);
  return at === undefined ? null : at.infravana_tokens;
}

/**
 * The speed a Today option can promise, in tokens a second per user: the
 * slowest offer it buys. Null when any part of what it buys has no speed
 * data (a seat plan, a self-hosted model, an offer with an empty speed).
 */
export function todaySpeed(scenario: Scenario, tables: Tables, patternId: PatternId): number | null {
  const demand = deriveDemand(scenario, tables);
  const pattern = patternById(tables, patternId);
  const rows =
    pattern.kind === "best_single"
      ? (deriveBestSingle(pattern, demand, tables)?.rows ?? null)
      : rowsForPattern(tables, patternId, demand);
  if (rows === null || rows.length === 0) return null;
  let slowest = Infinity;
  for (const row of rows) {
    const offer = row.offer_id === null ? undefined : tables.model_offers.find((o) => o.offer_id === row.offer_id);
    if (offer === undefined || offer.tok_s_per_user === null) return null;
    slowest = Math.min(slowest, offer.tok_s_per_user);
  }
  return Number.isFinite(slowest) ? slowest : null;
}

/** One grey Today option as C10 draws it. */
export interface TodayMark {
  alt: TodayAlternative;
  /** 1 to 4 for an option; null for the comparator, whose marker is a circle. */
  rank: number | null;
  /** Tokens a quarter its budget buys; the threshold never changes it. */
  tokens: number;
  /** Where it stands on the speed axis; null in the quality view and where it has no speed data. */
  speed: number | null;
}

/** Everything C10 draws for one view. */
export interface C10Data {
  view: C10View;
  frontier: FrontierResult;
  /** The step line's height at the visitor's setting; null if no point is that strict. */
  current_tokens: number | null;
  /** The comparator first, then the other greys in rank order. */
  today: TodayMark[];
  budget_usd: number;
  /** Provenance of the InfraVana line: the engine's in the quality view, modelled in the speed view (invented speed rows). */
  provenance: Provenance;
}

/** The Today marks of `results`: the comparator, then each other grey (spec 6.1). */
export function todayMarks(results: Results, scenario: Scenario | null, tables: Tables | null, view: C10View): TodayMark[] {
  const cmp = comparisonOf(results);
  const mark = (alt: TodayAlternative, rank: number | null): TodayMark => ({
    alt,
    rank,
    tokens: alt.tokens_at_budget,
    speed: view === "speed" && scenario !== null && tables !== null ? todaySpeed(scenario, tables, alt.pattern_id) : null,
  });
  return [
    ...(cmp.comparator ? [mark(cmp.comparator, null)] : []),
    ...cmp.options.map((o: OptionBar) => mark(o.alt, o.rank)),
  ];
}

export function c10Data(results: Results, scenario: Scenario, tables: Tables, requested: C10View): C10Data {
  const view = effectiveView(requested, tables);
  const fr = frontierForView(scenario, tables, view);
  return {
    view,
    frontier: fr,
    current_tokens: tokensAtThreshold(fr.points, fr.current_threshold),
    today: todayMarks(results, scenario, tables, view),
    budget_usd: results.tokens_bought.budget_usd,
    provenance: view === "speed" ? "modelled" : results.tokens_bought.provenance.infravana,
  };
}

/**
 * Spec 6.4 benefit boxes of C10, in candidate order: the volume at the
 * visitor's setting, the volume at the lowest (most relaxed) step, and the
 * extra volume over the comparator at the setting. Everything is read from
 * `context.frontier`, so the boxes follow the view C10 shows. An extra volume
 * that is not positive is left out rather than shown as a loss named "extra".
 */
export function c10Benefits(results: Results, context: BenefitContext): BenefitBox[] {
  const fr = context.frontier;
  if (fr === null || fr.points.length === 0) return [];
  const cmp = comparisonOf(results);
  const comparator = `vs ${cmp.label}`;
  const boxes: BenefitBox[] = [];
  const current = tokensAtThreshold(fr.points, fr.current_threshold);
  const lowest = fr.points[0].infravana_tokens;
  const setting = fr.axis === "quality" ? "your quality floor" : "your speed";
  if (current !== null) {
    boxes.push({ value: current, unit: "tokens", label: `Tokens a quarter at ${setting}`, comparator });
  }
  boxes.push({
    value: lowest,
    unit: "tokens",
    label: fr.axis === "quality" ? "Tokens a quarter at the lowest quality step" : "Tokens a quarter at the lowest speed step",
    comparator,
  });
  if (current !== null && cmp.comparator !== null) {
    const extra = current - cmp.comparator.tokens_at_budget;
    if (extra > 0) {
      boxes.push({ value: extra, unit: "tokens", label: `Extra tokens a quarter at ${setting}`, comparator });
    }
  }
  return boxes.filter((b) => Number.isFinite(b.value));
}
