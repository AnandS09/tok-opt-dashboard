/**
 * The `BenefitContext` the benefit boxes read (spec 6.4), built from what the
 * stage already holds. The goal is the scenario's own (`withView` writes the
 * active tab into it; absent means G1). `solve` and `frontier` are passed in
 * by the caller: the stage passes the active goal tab's solve result (null in G1
 * and while a solve is on its way) and null for the frontier until C10 supplies
 * it; a boxes chart on a solved tab with no solve falls back to the linear figures.
 */

import { benefitHeadcount } from "../compute";
import type { BenefitContext, FrontierResult, Scenario, SolveResult, Tables } from "../contract";

export function benefitContext(
  scenario: Scenario,
  tables: Tables,
  solve: SolveResult | null,
  frontier: FrontierResult | null,
): BenefitContext {
  return {
    scenario,
    goal: scenario.goal ?? "G1",
    solve,
    frontier,
    headcount: benefitHeadcount(scenario, tables),
  };
}
