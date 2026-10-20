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
  Provenance,
  Results,
  SavingsSegment,
  Scenario,
  SideProvenance,
  Tables,
} from "../contract";
import { TIERS } from "../data/schema";
import { deriveDemand } from "./demand";
import { planInfravana } from "./infravana";
import { PERCENT, TOKENS_PER_MTOK, worstProvenance } from "./pricing";
import { addToClass, computeToday, emptyClassTotals, type ClassTotals } from "./today";

/** Half a cent: a smaller difference is rounding, not a saving. */
const SAVINGS_TOLERANCE_USD = 0.005;

const COMPOSITE_PREFIX = "composite:";

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

export function compute(scenario: Scenario, tables: Tables): Results {
  const demand = deriveDemand(scenario, tables);
  const today = computeToday(demand, scenario, tables);
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
  const composite = new Map<string, number>();
  for (const row of tables.quality) {
    if (row.benchmark.startsWith(COMPOSITE_PREFIX)) {
      composite.set(`${row.model_id}|${row.benchmark.slice(COMPOSITE_PREFIX.length)}`, row.score);
    }
  }
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
  };
}
