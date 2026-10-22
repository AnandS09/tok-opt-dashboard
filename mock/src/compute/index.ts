/**
 * The compute engine (spec 7.2): `compute(scenario, tables) -> results`.
 *
 * Pure and deterministic: the result depends only on the two arguments, and
 * neither is modified. Every figure on the Infravana side is derived from
 * the CSV rows through this function; nothing here hard-codes a saving.
 *
 * `compute` prices the scenario's `baseline` state. For a scaling scenario
 * (`target` present), `scenarioAtTarget` gives the same scenario with the
 * target as its state, so the before/after view is two calls to `compute`.
 */

import type {
  ModelTier,
  PatternId,
  Results,
  Scenario,
  Tables,
  TodayAlternative,
} from "../contract";
import { runEngine } from "./core";
import { type WorkloadDemand } from "./demand";
import {
  applicablePatterns,
  compositeScores,
  deriveBestSingle,
  orderOptions,
  popularityRanks,
  typicalPattern,
} from "./patterns";
import { TOKENS_PER_MTOK, worstProvenance } from "./pricing";
import { addToClass, computeToday, emptyClassTotals, type TodayResult } from "./today";

export { computeCore, type CoreResults } from "./core";
export { benefitHeadcount } from "./headcount";
export { frontier, solveAtBudget } from "./solve";

/** The scenario with its `target` state as the state to price, or null without one. */
export function scenarioAtTarget(scenario: Scenario): Scenario | null {
  if (scenario.target === undefined) return null;
  const { target, ...rest } = scenario;
  return { ...rest, baseline: target };
}

/** Every Today option's figures for the scenario's workloads (spec 6.1, 7.4). */
function describeOptions(
  demand: readonly WorkloadDemand[],
  scenario: Scenario,
  tables: Tables,
  budgetUsd: number,
  comparator: { id: PatternId; today: TodayResult },
): TodayAlternative[] {
  const typical = typicalPattern(tables, scenario.stage_today);
  const applicable = applicablePatterns(tables, demand);
  if (!applicable.some((a) => a.pattern.pattern_id === typical.pattern_id)) {
    // Throws the error that names the pattern and the workload with no rows.
    computeToday(demand, scenario, tables, typical.pattern_id);
  }

  const bestSinglePattern = tables.buying_patterns.find((p) => p.kind === "best_single") ?? null;
  const bestSingle = bestSinglePattern === null ? null : deriveBestSingle(bestSinglePattern, demand, tables);
  const bestSingleId = bestSingle === null || bestSinglePattern === null ? null : bestSinglePattern.pattern_id;

  const known = new Set(applicable.map((a) => a.pattern.pattern_id));
  if (bestSingleId !== null) known.add(bestSingleId);
  if (!known.has(comparator.id)) {
    throw new Error(
      `scenario comparator "${comparator.id}" is not a Today option with rows for every workload in the mix`,
    );
  }

  const { order, grey } = orderOptions(
    applicable.map((a) => a.pattern),
    bestSingleId === null ? null : bestSinglePattern,
    typical.pattern_id,
    comparator.id,
    popularityRanks(tables, scenario.stage_today),
  );

  const scores = compositeScores(tables);
  const demandTokens = demand.reduce((sum, d) => sum + d.tokens_in + d.tokens_out, 0);
  const alternatives = order.map((id): TodayAlternative => {
    const pattern = tables.buying_patterns.find((p) => p.pattern_id === id);
    if (pattern === undefined) throw new Error(`buying_patterns.csv: pattern "${id}" does not exist`);
    const today = id === comparator.id ? comparator.today : computeToday(demand, scenario, tables, id);

    let weighted = 0;
    let scored = 0;
    let meetsFloors = true;
    for (const d of demand) {
      for (const m of today.models_by_workload.get(d.workload_id) ?? []) {
        const score = scores.get(`${m.model_id}|${d.workload_id}`);
        if (score === undefined || score < d.quality_floor) meetsFloors = false;
        if (score !== undefined) {
          const tokens = (d.tokens_in + d.tokens_out) * m.share;
          weighted += tokens * score;
          scored += tokens;
        }
      }
    }

    const byClass = emptyClassTotals();
    for (const line of today.lines) {
      const model = tables.models.find((m) => m.model_id === line.model_id);
      if (model === undefined) throw new Error(`models.csv: model "${line.model_id}" does not exist`);
      addToClass(byClass, model.tier, line.usd, line.tokens, "vendor_reported");
    }
    const pricePerMtok = (tier: ModelTier): number | null =>
      byClass[tier].tokens > 0 ? byClass[tier].usd / (byClass[tier].tokens / TOKENS_PER_MTOK) : null;

    return {
      pattern_id: id,
      label: pattern.label,
      kind: pattern.kind,
      detail:
        pattern.kind === "best_single" && bestSingle !== null
          ? `${bestSingle.offer.model_id} via ${bestSingle.offer.channel} (${bestSingle.offer.region})`
          : null,
      is_typical: id === typical.pattern_id,
      is_grey: grey.has(id),
      total_usd: today.total_usd,
      tokens_at_budget: today.total_usd > 0 ? (demandTokens * budgetUsd) / today.total_usd : 0,
      quality_score: scored > 0 ? weighted / scored : null,
      meets_floors: meetsFloors,
      provenance: worstProvenance(...today.segments.map((s) => s.provenance)),
      usd_per_mtok_by_class: {
        frontier: pricePerMtok("frontier"),
        mid: pricePerMtok("mid"),
        small: pricePerMtok("small"),
      },
    };
  });
  return alternatives;
}

export function compute(scenario: Scenario, tables: Tables): Results {
  const run = runEngine(scenario, tables);
  return {
    ...run.results,
    today_alternatives: describeOptions(run.demand, scenario, tables, run.budgetUsd, {
      id: run.results.comparator,
      today: run.today,
    }),
  };
}
