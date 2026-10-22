/**
 * Spec 6.2 G4: the give-up the visitor accepts, applied to the InfraVana
 * plan only. Today, and the floors and speed shown against it, never change.
 */

import type { LatencyClass, Scenario, Tables } from "../contract";
import { LATENCY_CLASSES } from "../data/schema";
import type { WorkloadDemand } from "./demand";
import { compositeScores } from "./patterns";

/**
 * Why the speed step and the speed view cannot be offered when no proprietary
 * offer carries speed data (spec 6.3, 10).
 */
export const NO_SPEED_DATA_REASON =
  "No proprietary offer has speed data, so there is nothing to trade speed for.";

/**
 * Null when at least one proprietary offer has speed data (the BD-11 rows or
 * real ones), else the reason the G4 speed step and the C10 speed view are
 * unavailable (spec 6.3, 10). The page reads this to disable them; `compute()`
 * ignores a speed step while it is unavailable.
 */
export function speedUnavailableReason(tables: Tables): string | null {
  const proprietary = new Set(
    tables.models.filter((m) => m.license === "proprietary").map((m) => m.model_id),
  );
  const hasData = tables.model_offers.some(
    (o) => proprietary.has(o.model_id) && o.tok_s_per_user !== null,
  );
  return hasData ? null : NO_SPEED_DATA_REASON;
}

/**
 * What the InfraVana plan must deliver on speed when it is bought under a
 * speed requirement. Without one (`undefined`) the plan buys the standard
 * price tier and the latency class gates open-weight rows only.
 */
export interface SpeedRequirement {
  /** Tokens a second one user must see, at least. */
  min_tok_s_per_user: number;
  /** Longest p95 time to first token in milliseconds; null for no limit. */
  max_p95_ttft_ms: number | null;
  /**
   * True for G4, where the visitor gives speed up: every standard offer stays
   * available whatever its speed, so a step down only adds options and never
   * raises spend. False for the frontier's speed axis, where each threshold is
   * a demand: an offer slower than it cannot be used.
   */
  keep_standard: boolean;
}

/** Inputs of the engine beyond the scenario, for the frontier's speed axis (spec 6.3, 7.4). */
export interface EngineOptions {
  /**
   * Demand at least this many tokens a second per user from every proprietary
   * and open-weight option, with no limit on time to first token, and let a
   * proprietary model move to its own batch or flex tier (spec 7.2 step 3).
   * Replaces the scenario's latency class for the InfraVana plan.
   */
  min_tok_s_per_user?: number;
}

/** The inputs the InfraVana plan is made from, after any G4 trade-off. */
export interface TradedInputs {
  /** Demand with each workload's floor stepped down. */
  demand: WorkloadDemand[];
  /** The scenario with its latency class stepped down. */
  scenario: Scenario;
  /** The floor InfraVana uses for a workload whose floor in effect is `floor`. */
  floorFor: (workloadId: string, floor: number) => number;
  /** The speed requirement the plan is bought under; undefined when it has none. */
  speed?: SpeedRequirement;
}

/**
 * Applies `scenario.tradeoff` while `scenario.goal` is `G4`; otherwise (or
 * with both steps 0) returns the inputs unchanged, so the InfraVana side
 * equals the Today side.
 *
 * Quality step k: the floor drops to the k-th next lower distinct composite
 * score that `quality.csv` holds for that workload, stopping at the lowest.
 * Speed step k: the latency class moves k places down the list
 * interactive, standard, batch, stopping at batch, and the plan is bought
 * under that class as a `SpeedRequirement`: open-weight work may move to
 * slower, cheaper hardware rows, and a proprietary model may move to its own
 * batch or flex price tier. A speed step has no effect while
 * `speedUnavailableReason` is not null.
 *
 * `options.min_tok_s_per_user` replaces the speed requirement (the frontier's
 * speed axis).
 */
export function tradedInputs(
  scenario: Scenario,
  demand: readonly WorkloadDemand[],
  tables: Tables,
  options?: EngineOptions,
): TradedInputs {
  const tradeoff = scenario.goal === "G4" ? scenario.tradeoff : undefined;
  const qualityStep = tradeoff?.quality_step ?? 0;
  const speedStep = speedUnavailableReason(tables) === null ? (tradeoff?.speed_step ?? 0) : 0;

  const scores = compositeScores(tables);
  const floorFor = (workloadId: string, floor: number): number => {
    if (qualityStep <= 0) return floor;
    const lower = [
      ...new Set(
        [...scores]
          .filter(([key, score]) => key.endsWith(`|${workloadId}`) && score < floor)
          .map(([, score]) => score),
      ),
    ].sort((a, b) => b - a);
    return lower.length === 0 ? floor : (lower[Math.min(qualityStep, lower.length) - 1] as number);
  };

  const classIndex = LATENCY_CLASSES.indexOf(scenario.latency_class);
  const latency: LatencyClass =
    LATENCY_CLASSES[Math.min(LATENCY_CLASSES.length - 1, classIndex + Math.max(0, speedStep))] ??
    scenario.latency_class;

  let speed: SpeedRequirement | undefined;
  if (options?.min_tok_s_per_user !== undefined) {
    speed = { min_tok_s_per_user: options.min_tok_s_per_user, max_p95_ttft_ms: null, keep_standard: false };
  } else if (speedStep > 0) {
    const limits = tables.manifest.parameters.latency_classes[latency];
    speed = {
      min_tok_s_per_user: limits.min_tok_s_per_user,
      max_p95_ttft_ms: limits.max_p95_ttft_ms,
      keep_standard: true,
    };
  }

  return {
    demand: demand.map((d) => ({ ...d, quality_floor: floorFor(d.workload_id, d.quality_floor) })),
    scenario: latency === scenario.latency_class ? scenario : { ...scenario, latency_class: latency },
    floorFor,
    speed,
  };
}
