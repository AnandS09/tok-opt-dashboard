/**
 * The G4 tab's state (spec 6.2, "G4 in plain words"): the positions of its two
 * stepped controls, the two `compute()` calls behind its hero, and the figures
 * the hero states. Pure functions, no React, so a test can call them directly.
 *
 * The positions are read from the engine rather than listed here: each step is
 * one `compute()` at that step, and `infravana_side` says which floors and
 * speed it planned at. A step past the last position changes nothing in the
 * engine (it stops at the lowest score and at the batch class), so a list ends
 * where `infravana_side` stops changing.
 */
import { g1Headline, speedUnavailableReason } from "../compute";
import type { Results, Scenario, Tables, TradeoffLevel, TradeoffView } from "../contract";
import type { HashFields } from "./hash";
import { computeForView, withView } from "./stage";

/** More than the data can hold; a runaway list would only mean the engine never stops stepping. */
const MAX_LEVELS = 16;

type ViewFields = Pick<HashFields, "comparator">;

function levelAt(scenario: Scenario, tables: Tables, view: ViewFields, step: number, speed: boolean): TradeoffLevel {
  const stepped = withView(
    scenario,
    { goal: "G4", comparator: view.comparator, qualityStep: speed ? 0 : step, speedStep: speed ? step : 0 },
    tables,
  );
  const side = computeForView(stepped, tables).infravana_side;
  return { step, floors: side.quality_floor_by_workload, latency_class: side.latency_class };
}

function sameFloors(a: Record<string, number>, b: Record<string, number>): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k]);
}

export interface TradeoffLevels {
  quality: TradeoffLevel[];
  speed: TradeoffLevel[];
  /** Null while at least one proprietary offer has speed data (spec 6.3, 10). */
  speedReason: string | null;
}

/**
 * The positions of the two controls for these answers. Step 0 is no give-up.
 * With no speed data the speed control has step 0 only and `speedReason` says why.
 */
export function tradeoffLevels(scenario: Scenario, tables: Tables, view: ViewFields): TradeoffLevels {
  const speedReason = speedUnavailableReason(tables);

  const quality = [levelAt(scenario, tables, view, 0, false)];
  for (let step = 1; step < MAX_LEVELS; step += 1) {
    const next = levelAt(scenario, tables, view, step, false);
    if (sameFloors(next.floors, quality[quality.length - 1].floors)) break;
    quality.push(next);
  }

  const speed = [levelAt(scenario, tables, view, 0, true)];
  if (speedReason === null) {
    for (let step = 1; step < MAX_LEVELS; step += 1) {
      const next = levelAt(scenario, tables, view, step, true);
      if (next.latency_class === speed[speed.length - 1].latency_class) break;
      speed.push(next);
    }
  }
  return { quality, speed, speedReason };
}

/** Holds a step read from the address, or from a stale choice, to a position the control has. */
export function clampStep(step: number, levels: readonly TradeoffLevel[]): number {
  return Math.max(0, Math.min(Math.trunc(step), levels.length - 1));
}

export interface TradeoffCalls {
  /** The call at the visitor's own floors and speed: the G1 result (spec 6.2 "Two calls"). */
  untraded: Results;
  /** The call with the trade-off; null when it failed. */
  traded: Results | null;
  error: string | null;
}

/**
 * G4's two calls. `scenario` already carries the goal and the trade-off (as
 * `withView` leaves it). The untraded call is the scenario without either, so
 * it is the call G1 makes and Today's figures come from it.
 */
export function computeTradeoff(scenario: Scenario, tables: Tables): TradeoffCalls {
  const { goal, tradeoff, ...own } = scenario;
  void goal;
  void tradeoff;
  const untraded = computeForView(own, tables);
  try {
    return { untraded, traded: computeForView(scenario, tables), error: null };
  } catch (error) {
    return { untraded, traded: null, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Everything `GoalView.tradeoff` carries, from the two calls and the positions. */
export function tradeoffView(
  calls: TradeoffCalls,
  levels: TradeoffLevels,
  steps: { qualityStep: number; speedStep: number },
): TradeoffView {
  return {
    untraded: calls.untraded,
    qualityStep: steps.qualityStep,
    speedStep: steps.speedStep,
    qualityLevels: levels.quality,
    speedLevels: levels.speed,
    speedReason: levels.speedReason,
    // The G4 view offers the speed rows, so it names them as invented whether or not a step uses them (spec 9, acceptance 2).
    invented: levels.speedReason === null,
    error: calls.error,
  };
}

/** The two figures of the G4 hero, in dollars a quarter (spec 6.2 G4). */
export interface TradeoffFigures {
  /** The saving at the visitor's own floors: the G1 figure. */
  ownSaving: number;
  /** What the give-up adds on top of it; never negative. */
  extraSaving: number;
}

export function tradeoffFigures(untraded: Results, traded: Results): TradeoffFigures {
  const own = g1Headline(untraded).saved_usd;
  const relaxed = g1Headline(traded).saved_usd;
  return { ownSaving: own, extraSaving: Math.max(0, relaxed - own) };
}

/** "78", or "72 to 79" when the workloads have different floors. */
export function floorsText(floors: Record<string, number>): string {
  const values = Object.values(floors);
  if (values.length === 0) return "none";
  const low = Math.min(...values);
  const high = Math.max(...values);
  const text = (n: number) => String(Math.round(n * 10) / 10);
  return low === high ? text(low) : `${text(low)} to ${text(high)}`;
}
