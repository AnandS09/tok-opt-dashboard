import type { GoalId, Results, SolveResult } from "../contract";

/**
 * The figures C5 draws for its two compared bars, and how its other grey
 * bars are to be read (spec 6.2, "C5 follows the tab").
 */
export interface C5Figures {
  /** Tokens a quarter at the comparator's bar. */
  comparatorTokens: number;
  /** Tokens a quarter at InfraVana's bar. */
  infravanaTokens: number;
  /** InfraVana's tokens over the comparator's: the one multiple the chart states. */
  multiple: number;
  /**
   * True when the compared bars use solved volumes (G2, G3) while every other
   * grey bar stays at its average price: each of those then carries the label
   * "Estimated at its average price" so a reader can see the two bases.
   */
  estimateOthers: boolean;
  /** A label for the bars' basis ("at the trade-off you chose"), or null. */
  note: string | null;
}

/** The label of a grey bar that is not solved (spec 6.2, acceptance 7). */
export const ESTIMATED_LABEL = "Estimated at its average price";

/**
 * Where C5's compared bars take their numbers. This is the one place that
 * knows about goal tabs: until the tabs exist the page calls it with no
 * goal, which is G1, the linear tokens the budget buys (`1 / (1 - saving)`).
 * The tab step replaces it with the active tab's figures: the solved volumes
 * in G2 and G3, the linear figure at the relaxed plan in G4.
 */
export function c5Figures(results: Results, goal: GoalId = "G1", solve: SolveResult | null = null): C5Figures {
  const linear = {
    comparatorTokens: results.tokens_bought.today_tokens,
    infravanaTokens: results.tokens_bought.infravana_tokens,
    multiple: results.headline.tokens_multiple,
  };
  if ((goal === "G2" || goal === "G3") && solve) {
    return {
      comparatorTokens: solve.today_tokens,
      infravanaTokens: solve.infravana_tokens,
      multiple: solve.multiple,
      estimateOthers: true,
      note: null,
    };
  }
  if (goal === "G4") return { ...linear, estimateOthers: false, note: "at the trade-off you chose" };
  return { ...linear, estimateOthers: goal === "G2" || goal === "G3", note: null };
}
