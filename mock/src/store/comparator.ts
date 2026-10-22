import { useSyncExternalStore } from "react";
import type { PatternId, Results, TodayAlternative } from "../contract";

/**
 * The visitor's choice of comparator (spec 6.1, "Compared with"): which Today
 * option every InfraVana figure is measured against. It is the only thing
 * this module holds. The page is meant to copy the choice into
 * `Scenario.comparator` and recompute; nothing in here calls `compute()`.
 *
 * `null` means no choice: the engine's default, the typical buyer for the
 * stage (`Results.comparator` when the scenario names none).
 */
let chosen: PatternId | null = null;
const listeners = new Set<() => void>();

export function getComparator(): PatternId | null {
  return chosen;
}

/** Sets the choice (or clears it with null) and tells every subscriber. */
export function setComparator(id: PatternId | null): void {
  if (id === chosen) return;
  chosen = id;
  for (const listener of [...listeners]) listener();
}

export function subscribeComparator(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The choice as a hook: re-renders when `setComparator` changes it. */
export function useComparator(): PatternId | null {
  return useSyncExternalStore(subscribeComparator, getComparator, getComparator);
}

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
