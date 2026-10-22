/**
 * The `BenefitContext` the benefit boxes read (spec 6.4), built from what the
 * stage already holds. The goal is the scenario's own (`withView` writes the
 * active tab into it; absent means G1). `solve` and `frontier` are passed in
 * by the caller: the stage passes null until the goal tabs and C10 supply
 * their results, and a boxes chart on a solved tab then falls back to the
 * linear figures.
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
