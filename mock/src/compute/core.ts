/**
 * The engine behind `compute()` (spec 7.2): demand, Today under the
 * comparator, InfraVana's plan and the three charts' series, without the
 * list of other Today options. Pure and deterministic; neither argument is
 * modified. Every InfraVana figure is derived from the CSV rows; nothing
 * here hard-codes a saving.
 */

import type {
  AllocationSegment,
  CostPerMtokRow,
  ModelTier,
  Provenance,
  Results,
  SavingsSegment,
  Scenario,
  SideProvenance,
  Tables,
} from "../contract";
import { TIERS } from "../data/schema";
import { deriveDemand, type WorkloadDemand } from "./demand";
import { planInfravana } from "./infravana";
import { compositeScores, typicalPattern } from "./patterns";
import { PERCENT, TOKENS_PER_MTOK, worstProvenance } from "./pricing";
import { tradedInputs, type EngineOptions } from "./tradeoff";
import {
  addToClass,
  computeToday,
  emptyClassTotals,
  type ClassTotals,
  type TodayResult,
} from "./today";

/** Half a cent: a smaller difference is rounding, not a saving. */
const SAVINGS_TOLERANCE_USD = 0.005;

const ARBITRAGE_LABEL = "Provider arbitrage";
const ROUTING_LABEL = "Routing";

/** `Results` without `today_alternatives`. */
export type CoreResults = Omit<Results, "today_alternatives">;

/** One engine run: its results and the inputs `compute()` reuses for the Today options. */
export interface EngineRun {
  results: CoreResults;
  demand: WorkloadDemand[];
  /** Today under the comparator. */
  today: TodayResult;
  budgetUsd: number;
}

function worstOf(values: Provenance[]): Provenance {
  return worstProvenance(...values);
}

export function runEngine(scenario: Scenario, tables: Tables, options?: EngineOptions): EngineRun {
  const demand = deriveDemand(scenario, tables);
  const comparatorId = scenario.comparator ?? typicalPattern(tables, scenario.stage_today).pattern_id;
  const today = computeToday(demand, scenario, tables, comparatorId);
  // A G4 trade-off acts on the InfraVana plan only; Today and the floors
  // shown against it never change (spec 6.2).
  const traded = tradedInputs(scenario, demand, tables, options);
  const plan = planInfravana(traded.demand, today, traded.scenario, tables, traded.speed);

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
    // A batch or flex move (G4 speed step, speed view) is priced from modelled rows.
    provenance: found ? plan.proprietary_provenance : "vendor_reported",
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
  const infravanaFloorByWorkload: Record<string, number> = {};
  for (const id of Object.keys(scenario.workload_mix)) {
    const workload = tables.workloads.find((w) => w.workload_id === id);
    if (workload === undefined) throw new Error(`workload_mix names "${id}", which is not in workloads.csv`);
    const floor = scenario.quality_floor ?? workload.quality_floor;
    qualityFloorByWorkload[id] = floor;
    infravanaFloorByWorkload[id] = traded.floorFor(id, floor);
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

  const results: CoreResults = {
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
    infravana_side: {
      quality_floor_by_workload: infravanaFloorByWorkload,
      latency_class: traded.scenario.latency_class,
    },
  };
  return { results, demand, today, budgetUsd };
}

/**
 * The engine without the Today options: everything `compute()` returns
 * except `today_alternatives`. It is the call the solver and the frontier
 * make many times (spec 6.2, 6.3), so it skips pricing every Today option.
 * `options` is for the frontier's speed axis; `compute()` never passes it.
 */
export function computeCore(scenario: Scenario, tables: Tables, options?: EngineOptions): CoreResults {
  return runEngine(scenario, tables, options).results;
}
