import type { PatternId, Results, TodayAlternative } from "../contract";

/**
 * Helpers for the "Compared with" selector (spec 6.1). The choice itself is
 * part of the page's view state (`store/stage.ts`, address key `cmp`) and is
 * folded into `Scenario.comparator` by `withView`, so `compute()` returns the
 * figures for it. Nothing here holds state or calls `compute()`.
 *
 * A null choice means no choice: the engine's default, the typical buyer for
 * the stage (`Results.comparator` when the scenario names none).
 */

/**
 * The comparators a visitor can pick for this `Results`: every entry of
 * `today_alternatives`, in the engine's order, the derived best single option
 * included. An option the scenario's mix has no baseline rows for is not in
 * the list, because the engine leaves it out (spec 10).
 */
export function comparatorOptions(results: Results): TodayAlternative[] {
  return results.today_alternatives;
}

/**
 * The id the selector shows as chosen: the stored choice if it is still
 * offered, else the comparator these `Results` were computed with.
 */
export function selectedComparator(results: Results, choice: PatternId | null): PatternId {
  const offered = comparatorOptions(results).some((a) => a.pattern_id === choice);
  return choice !== null && offered ? choice : results.comparator;
}

/**
 * The choice to store when the visitor picks `id`: null for the typical buyer
 * (so the choice follows the stage and the address stays short), else the id.
 */
export function choiceFor(results: Results, id: PatternId): PatternId | null {
  const typical = comparatorOptions(results).find((a) => a.is_typical);
  return typical?.pattern_id === id ? null : id;
}
