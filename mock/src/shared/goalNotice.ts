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
  /** The sentence in full: in the hero when it stands in for the figure, and in chart C5. */
  text: string;
  /** The short form a tab shows under its name, and the hero's figure line, when there is no multiple. */
  short: string;
}

/** What a tab says when no volume fits one side's budget: what to change, never a bare "no". */
export const NEEDS_BUDGET = "Needs a larger budget";
export const FITS_WITH_US_ONLY = "Fits your budget with InfraVana only";

/**
 * The sentence a solved tab shows in place of its figure, or null when the
 * figure can be shown. The people cap comes first (G3), then a side with no
 * volume that fits (a fixed seat fee above the budget), then a budget of more
 * than ten times the work (spec 5.2).
 */
export function solvedNotice(solve: SolveResult, comparatorLabel: string): SolvedNotice | null {
  if (solve.axis === "users" && solve.capped_at_users_max) {
    return { kind: "capped", text: PEOPLE_CAP_MESSAGE, short: `More than ${USERS_RANGE.max.toLocaleString("en-US")} people` };
  }
  const today = solve.today_scale === 0;
  const infravana = solve.infravana_scale === 0;
  if (today || infravana) {
    const who = today && infravana ? "either side" : today ? comparatorLabel : "InfraVana";
    // Only the comparator's side has none: the sentence says that InfraVana's side fits (the hero shows its figure).
    const short = today && !infravana ? FITS_WITH_US_ONLY : NEEDS_BUDGET;
    // The people axis keeps the customers' work fixed, so what stands in the way there is that work and the fixed fees, not the people.
    const reason =
      solve.axis === "users"
        ? `With ${who}, the rest of this work (your customers' work and fixed fees) already costs more than your budget, so no number of people fits`
        : `Your budget is below the fixed fees of ${who}, so no AI work fits in it`;
    return { kind: "no_volume", text: reason, short };
  }
  if (solve.today_scale > COVERAGE_MESSAGE_ABOVE) return { kind: "coverage", text: COVERAGE_MESSAGE, short: "Budget over ten times the work" };
  return null;
}
