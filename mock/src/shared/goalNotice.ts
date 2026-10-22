/**
 * The sentences a solved goal tab (G2, G3) shows in place of its figure
 * (spec 5.2). Neutral on purpose, like `format.ts`: the hero and chart C5 both
 * read it, so they cannot disagree about when a figure is replaced.
 */
import { COVERAGE_MESSAGE_ABOVE } from "../compute/goals";
import type { SolveResult } from "../contract";
import { USERS_RANGE } from "../data/ranges";

/** Spec 5.2 P-3: shown instead of a multiple when the budget covers more than ten times the work. */
export const COVERAGE_MESSAGE = "Your budget is more than ten times this work";

/** Spec 5.2 G3 cap: shown instead of a head-count above the users range. */
export const PEOPLE_CAP_MESSAGE = `Your budget covers more than ${USERS_RANGE.max.toLocaleString("en-US")} people, the most this page models`;

export interface SolvedNotice {
  kind: "capped" | "no_volume" | "coverage";
  text: string;
}

/**
 * The sentence a solved tab shows in place of its figure, or null when the
 * figure can be shown. The people cap comes first (G3), then a side with no
 * volume that fits (a fixed seat fee above the budget), then a budget of more
 * than ten times the work (spec 5.2).
 */
export function solvedNotice(solve: SolveResult, comparatorLabel: string): SolvedNotice | null {
  if (solve.axis === "users" && solve.capped_at_users_max) return { kind: "capped", text: PEOPLE_CAP_MESSAGE };
  const today = solve.today_scale === 0;
  const infravana = solve.infravana_scale === 0;
  if (today || infravana) {
    const who = today && infravana ? "either side" : today ? comparatorLabel : "InfraVana";
    return { kind: "no_volume", text: `Your budget is below the fixed fees of ${who}, so no AI work fits in it` };
  }
  if (solve.today_scale > COVERAGE_MESSAGE_ABOVE) return { kind: "coverage", text: COVERAGE_MESSAGE };
  return null;
}
