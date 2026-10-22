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
  AllocationSegment,
  CostPerMtokRow,
  ModelTier,
  PatternId,
  Provenance,
  Results,
  SavingsSegment,
  Scenario,
  SideProvenance,
  Tables,
  TodayAlternative,
} from "../contract";
import { TIERS } from "../data/schema";
import { deriveDemand, type WorkloadDemand } from "./demand";
import { planInfravana } from "./infravana";
import {
  applicablePatterns,
  compositeScores,
  deriveBestSingle,
  orderOptions,
  typicalPattern,
} from "./patterns";
import { PERCENT, TOKENS_PER_MTOK, worstProvenance } from "./pricing";
import {
  addToClass,
  computeToday,
  emptyClassTotals,
  type ClassTotals,
  type TodayResult,
} from "./today";

export { frontier, solveAtBudget } from "./solve";

/** Half a cent: a smaller difference is rounding, not a saving. */
const SAVINGS_TOLERANCE_USD = 0.005;

const ARBITRAGE_LABEL = "Provider arbitrage";
const ROUTING_LABEL = "Routing";

/** The scenario with its `target` state as the state to price, or null without one. */
export function scenarioAtTarget(scenario: Scenario): Scenario | null {
  if (scenario.target === undefined) return null;
  const { target, ...rest } = scenario;
  return { ...rest, baseline: target };
}

function worstOf(values: Provenance[]): Provenance {
  return worstProvenance(...values);
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
  const demand = deriveDemand(scenario, tables);
  const comparatorId = scenario.comparator ?? typicalPattern(tables, scenario.stage_today).pattern_id;
  const today = computeToday(demand, scenario, tables, comparatorId);
  const plan = planInfravana(demand, today, scenario, tables);

  const totalUsd = today.total_usd;
  const budgetUsd = scenario.baseline.budget_usd_per_quarter;
  const demandTokens = demand.reduce((sum, d) => sum + d.tokens_in + d.tokens_out, 0);

  // Both bars total today's cost. Infravana keeps today's buying when it
  // finds nothing cheaper, so the headline can never claim a negative saving.
  const savingsUsd = totalUsd - plan.spend_usd;
  const found = savingsUsd > SAVINGS_TOLERANCE_USD;
  const infravanaSpendUsd = found ? plan.spend_usd : totalUsd;
  const arbitrageUsd = found
    ? Math.min(savingsUsd, Math.max(0, totalUsd - plan.proprietary_only_usd))
    : 0;
  const routingUsd = found ? savingsUsd - arbitrageUsd : 0;

  const arbitrage: SavingsSegment = {
    label: ARBITRAGE_LABEL,
    kind: "savings",
    usd: arbitrageUsd,
    savings_source: "arbitrage",
    provenance: "vendor_reported",
  };
  const routing: SavingsSegment = {
    label: ROUTING_LABEL,
    kind: "savings",
    usd: routingUsd,
    savings_source: "routing",
    provenance: found ? plan.routing_provenance : "vendor_reported",
  };
  const infravanaSegments: AllocationSegment[] = [
    ...(found ? plan.segments : today.segments.map((s) => ({ ...s }))),
    arbitrage,
    routing,
  ];

  const allocationProvenance: SideProvenance = {
    today: worstOf(today.segments.map((s) => s.provenance)),
    infravana: worstOf(infravanaSegments.filter((s) => s.usd > 0).map((s) => s.provenance)),
  };

  // Tokens bought: the budget buys tokens at each side's average price. Under
  // this linear rule tokens_multiple equals 1 / (1 - savings fraction), so
  // the two headline numbers are the same fact stated twice.
  const tokensFor = (spendUsd: number): number =>
    spendUsd > 0 ? (demandTokens * budgetUsd) / spendUsd : 0;
  const todayTokens = tokensFor(totalUsd);
  const infravanaTokens = tokensFor(infravanaSpendUsd);

  // Cost per million tokens by model class.
  const todayByClass: ClassTotals = emptyClassTotals();
  for (const line of today.lines) {
    const model = tables.models.find((m) => m.model_id === line.model_id);
    if (model === undefined) throw new Error(`models.csv: model "${line.model_id}" does not exist`);
    addToClass(todayByClass, model.tier, line.usd, line.tokens, "vendor_reported");
  }
  const infravanaByClass = found ? plan.by_class : todayByClass;
  const unitPrice = (totals: ClassTotals[ModelTier]): number | null =>
    totals.tokens > 0 ? totals.usd / (totals.tokens / TOKENS_PER_MTOK) : null;
  const byModelClass: CostPerMtokRow[] = TIERS.map((tier) => {
    const t = todayByClass[tier];
    const i = infravanaByClass[tier];
    const todayPrice = unitPrice(t);
    const infravanaPrice = unitPrice(i);
    return {
      model_class: tier,
      today_usd_per_mtok: todayPrice,
      infravana_usd_per_mtok: infravanaPrice,
      today_provenance: todayPrice === null ? "measured" : t.provenance,
      infravana_provenance: infravanaPrice === null ? "measured" : i.provenance,
    };
  });
  const costProvenance: SideProvenance = {
    today: worstOf(byModelClass.map((r) => r.today_provenance)),
    infravana: worstOf(byModelClass.map((r) => r.infravana_provenance)),
  };

  const qualityFloorByWorkload: Record<string, number> = {};
  for (const id of Object.keys(scenario.workload_mix)) {
    const workload = tables.workloads.find((w) => w.workload_id === id);
    if (workload === undefined) throw new Error(`workload_mix names "${id}", which is not in workloads.csv`);
    qualityFloorByWorkload[id] = scenario.quality_floor ?? workload.quality_floor;
  }

  // A baseline model with no composite score for its workload counts as unmet.
  const composite = compositeScores(tables);
  const floorUnmet = demand
    .filter((d) =>
      (today.models_by_workload.get(d.workload_id) ?? []).some((m) => {
        const score = composite.get(`${m.model_id}|${d.workload_id}`);
        return score === undefined || score < d.quality_floor;
      }),
    )
    .map((d) => d.workload_id);

  return {
    headline: {
      tokens_multiple: todayTokens > 0 ? infravanaTokens / todayTokens : 1,
      cost_savings_pct: totalUsd > 0 ? ((arbitrageUsd + routingUsd) / totalUsd) * PERCENT : 0,
    },
    allocation: {
      total_usd: totalUsd,
      budget_usd: budgetUsd,
      today: today.segments,
      infravana: infravanaSegments,
      provenance: allocationProvenance,
    },
    cost_per_mtok: {
      latency_class: scenario.latency_class,
      by_model_class: byModelClass,
      provenance: costProvenance,
    },
    tokens_bought: {
      budget_usd: budgetUsd,
      demand_tokens: demandTokens,
      today_tokens: todayTokens,
      infravana_tokens: infravanaTokens,
      provenance: allocationProvenance,
    },
    quality_floor_by_workload: qualityFloorByWorkload,
    effective_open_share: found && demandTokens > 0 ? plan.routed_tokens / demandTokens : 0,
    floor_unmet_workloads: floorUnmet,
    comparator: comparatorId,
    today_alternatives: describeOptions(demand, scenario, tables, budgetUsd, { id: comparatorId, today }),
  };
}
