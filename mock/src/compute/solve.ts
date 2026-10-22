/**
 * Spec 6.2 and 6.3: the two functions that sweep `compute()`. They exist as
 * typed stubs so later build steps share one signature; each throws until
 * its step implements it.
 */

import type {
  FrontierAxis,
  FrontierResult,
  Scenario,
  SolveAxis,
  SolveResult,
  Tables,
} from "../contract";

/**
 * Spec 6.2 `solveAtBudget`: the largest volume (scaling every workload's
 * token intensity, or employee workloads only) at which each side's spend
 * stays within the budget. Not implemented yet.
 */
export function solveAtBudget(_scenario: Scenario, _tables: Tables, axis: SolveAxis): SolveResult {
  throw new Error(`solveAtBudget(axis "${axis}") is not implemented yet (spec 11 step 6)`);
}

/**
 * Spec 6.3 `frontier`: tokens a quarter the budget buys with InfraVana at
 * each threshold of the quality floor or the speed per user. Not implemented
 * yet.
 */
export function frontier(
  _scenario: Scenario,
  _tables: Tables,
  axis: FrontierAxis,
  _thresholds: readonly number[],
): FrontierResult {
  throw new Error(`frontier(axis "${axis}") is not implemented yet (spec 11 step 9)`);
}
