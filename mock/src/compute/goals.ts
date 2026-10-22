/**
 * Spec 6.2 goal tabs: the headline numbers for G1 to G3 as the goal table
 * defines them, which tabs are available, and the figures chart C5 shows on
 * each tab ("C5 follows the tab"). Pure functions over `Results` and
 * `SolveResult`; the page decides wording and formatting.
 */

import type { GoalId, PatternId, Results, Scenario, SolveResult, Tables } from "../contract";
import { solveAtBudget, hasEmployeeWork } from "./solve";

/** Spec 5.2 P-3: above this many times the work, a budget is shown as a message, not a multiple. */
export const COVERAGE_MESSAGE_ABOVE = 10;

/** Why G3 is disabled when the workload mix has no employee work (spec 6.2 G3). */
export const NO_EMPLOYEE_WORK_REASON = "This work is customer-facing only, so there are no people to scale.";

/** G1 "Less money for the same AI": the visitor's volume, priced both ways. */
export interface G1Headline {
  goal: "G1";
  /** Quarterly dollars saved: the sum of the C1 savings segments. */
  saved_usd: number;
  /** The same saving as a percent of Today's cost (`Results.headline.cost_savings_pct`). */
  saved_pct: number;
  /** The linear tokens multiple, 1 / (1 - saving fraction) (`Results.headline.tokens_multiple`). */
  linear_multiple: number;
  /** The Today option every figure is measured against. */
  comparator: PatternId;
  /**
   * How many times the visitor's work the budget covers on Today's side
   * (`tokens_bought.today_tokens` over `demand_tokens`).
   */
  coverage: number;
  /** True when `coverage` is above 10, so the page shows the message instead of a multiple (spec 5.2). */
  over_ten_times: boolean;
}

/** G2 and G3: the solved multiple, with the volumes behind it. */
export interface SolvedHeadline {
  goal: "G2" | "G3";
  /** InfraVana's solved scale over Today's: "N times the AI work (or people) for your budget". */
  multiple: number;
  solve: SolveResult;
  /**
   * G3 only: the head-count each side's budget covers (the solved scale times
   * the scenario's people). Null for G2, where the people do not change.
   */
  today_people: number | null;
  infravana_people: number | null;
  /**
   * How many times the current volume Today's budget buys (`solve.today_scale`),
   * so the page can apply the ten-times message of spec 5.2.
   */
  coverage: number;
  /** True when `coverage` is above 10. */
  over_ten_times: boolean;
  /**
   * True for a side whose solved scale is 0: no volume fits its budget (a seat
   * plan's per-person fee alone exceeds it). `multiple` is then `Infinity` when
   * only Today is true, and the page says so instead of showing a multiple.
   */
  no_volume_fits: { today: boolean; infravana: boolean };
  /**
   * G3 only: true when the head-count hit the users range (`solve.capped_at_users_max`),
   * so the page shows the "more than 10,000 people" message instead of a figure.
   */
  capped_at_users_max: boolean;
}

/** Which of the solved tabs can be shown, and why not (a one-line reason, else null). */
export interface GoalAvailability {
  G2: string | null;
  G3: string | null;
}

/** One grey Today option's bar in C5. */
export interface C5Option {
  pattern_id: PatternId;
  /** Tokens a quarter the budget buys at the option's average price (always linear, spec 6.2). */
  tokens: number;
  /** True in G2 and G3, where the page labels the bar "Estimated at its average price". */
  estimated_at_average_price: boolean;
}

/** What chart C5 draws on a tab (spec 6.2 "C5 follows the tab"). */
export interface C5Figures {
  goal: GoalId;
  /** `linear` in G1 and G4 (budget over average price), `solved` in G2 and G3. */
  basis: "linear" | "solved";
  today_tokens: number;
  infravana_tokens: number;
  /** InfraVana's tokens over Today's: the one multiple C5 states on this tab. */
  multiple: number;
  /** InfraVana's tokens less the comparator's (Today's), at the tab's volume. */
  extra_tokens: number;
  /** True in G4, where the figures are the linear ones at the relaxed plan ("at the trade-off you chose"). */
  at_tradeoff: boolean;
  /** The grey options other than the comparator, in the order of `Results.today_alternatives`. */
  options: C5Option[];
}

/** The savings segments' total, which is the G1 headline (spec 6.2). */
function savedUsd(results: Results): number {
  return results.allocation.infravana.reduce(
    (sum, segment) => (segment.kind === "savings" ? sum + segment.usd : sum),
    0,
  );
}

/** G1's headline numbers from one `compute()` result at the visitor's own volume. */
export function g1Headline(results: Results): G1Headline {
  const demand = results.tokens_bought.demand_tokens;
  const coverage = demand > 0 ? results.tokens_bought.today_tokens / demand : 0;
  return {
    goal: "G1",
    saved_usd: savedUsd(results),
    saved_pct: results.headline.cost_savings_pct,
    linear_multiple: results.headline.tokens_multiple,
    comparator: results.comparator,
    coverage,
    over_ten_times: coverage > COVERAGE_MESSAGE_ABOVE,
  };
}

/**
 * G2's and G3's headline from a solve of the matching axis: `intensity` for
 * G2, `users` for G3. `scenario` supplies the head-count for G3's people.
 */
export function solvedHeadline(scenario: Scenario, solve: SolveResult): SolvedHeadline {
  const goal = solve.axis === "intensity" ? "G2" : "G3";
  const people = (scale: number): number | null =>
    goal === "G3" ? scale * scenario.baseline.users : null;
  return {
    goal,
    multiple: solve.multiple,
    solve,
    today_people: people(solve.today_scale),
    infravana_people: people(solve.infravana_scale),
    coverage: solve.today_scale,
    over_ten_times: solve.today_scale > COVERAGE_MESSAGE_ABOVE,
    no_volume_fits: { today: solve.today_scale === 0, infravana: solve.infravana_scale === 0 },
    capped_at_users_max: goal === "G3" && solve.capped_at_users_max,
  };
}

/** Solves the axis of `goal` (G2 or G3) and returns its headline. Blocks for the length of the solve. */
export function solveGoal(scenario: Scenario, tables: Tables, goal: "G2" | "G3"): SolvedHeadline {
  return solvedHeadline(scenario, solveAtBudget(scenario, tables, goal === "G2" ? "intensity" : "users"));
}

/** Which solved tabs the scenario can show. G3 is disabled when the mix has no employee work. */
export function goalAvailability(scenario: Scenario, tables: Tables): GoalAvailability {
  return { G2: null, G3: hasEmployeeWork(scenario, tables) ? null : NO_EMPLOYEE_WORK_REASON };
}

/**
 * C5's figures for a tab (spec 6.2). `results` is the `compute()` result C5
 * is drawn from: the visitor's own plan for G1, G2 and G3, and the relaxed
 * plan for G4 (the page's second call, with the trade-off). `solve` is the
 * result for the active axis, needed in G2 and G3 and ignored otherwise.
 *
 * In G1 and G4 the figures are the linear tokens bought; in G2 and G3 they
 * are the solved volumes. Grey options other than the comparator are never
 * solved: their bars always use `tokens_at_budget`.
 */
export function c5Figures(goal: GoalId, results: Results, solve: SolveResult | null): C5Figures {
  const solved = goal === "G2" || goal === "G3";
  if (solved && solve === null) {
    throw new Error(`c5Figures(goal "${goal}") needs the solveAtBudget result for that tab`);
  }
  const todayTokens = solved && solve !== null ? solve.today_tokens : results.tokens_bought.today_tokens;
  const infravanaTokens =
    solved && solve !== null ? solve.infravana_tokens : results.tokens_bought.infravana_tokens;
  return {
    goal,
    basis: solved ? "solved" : "linear",
    today_tokens: todayTokens,
    infravana_tokens: infravanaTokens,
    multiple: todayTokens > 0 ? infravanaTokens / todayTokens : infravanaTokens > 0 ? Infinity : 1,
    extra_tokens: infravanaTokens - todayTokens,
    at_tradeoff: goal === "G4",
    options: results.today_alternatives
      .filter((a) => a.is_grey && a.pattern_id !== results.comparator)
      .map((a) => ({
        pattern_id: a.pattern_id,
        tokens: a.tokens_at_budget,
        estimated_at_average_price: solved,
      })),
  };
}
