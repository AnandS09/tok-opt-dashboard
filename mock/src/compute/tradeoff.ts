/**
 * Spec 6.2 G4: the give-up the visitor accepts, applied to the InfraVana
 * plan only. Today, and the floors and speed shown against it, never change.
 */

import type { LatencyClass, Scenario, Tables } from "../contract";
import { LATENCY_CLASSES } from "../data/schema";
import type { WorkloadDemand } from "./demand";
import { compositeScores } from "./patterns";

/** The inputs the InfraVana plan is made from, after any G4 trade-off. */
export interface TradedInputs {
  /** Demand with each workload's floor stepped down. */
  demand: WorkloadDemand[];
  /** The scenario with its latency class stepped down. */
  scenario: Scenario;
  /** The floor InfraVana uses for a workload whose floor in effect is `floor`. */
  floorFor: (workloadId: string, floor: number) => number;
}

/**
 * Applies `scenario.tradeoff` while `scenario.goal` is `G4`; otherwise (or
 * with both steps 0) returns the inputs unchanged, so the InfraVana side
 * equals the Today side.
 *
 * Quality step k: the floor drops to the k-th next lower distinct composite
 * score that `quality.csv` holds for that workload, stopping at the lowest.
 * Speed step k: the latency class moves k places down the list
 * interactive, standard, batch, stopping at batch.
 */
export function tradedInputs(
  scenario: Scenario,
  demand: readonly WorkloadDemand[],
  tables: Tables,
): TradedInputs {
  const tradeoff = scenario.goal === "G4" ? scenario.tradeoff : undefined;
  const qualityStep = tradeoff?.quality_step ?? 0;
  const speedStep = tradeoff?.speed_step ?? 0;

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

  return {
    demand: demand.map((d) => ({ ...d, quality_floor: floorFor(d.workload_id, d.quality_floor) })),
    scenario: latency === scenario.latency_class ? scenario : { ...scenario, latency_class: latency },
    floorFor,
  };
}
