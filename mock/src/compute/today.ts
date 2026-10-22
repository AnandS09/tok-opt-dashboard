/**
 * Spec 7.2 step 2: what the workload costs today, under one buying pattern
 * (spec 6.1). The pattern's rows in `baseline_providers.csv` say what it
 * buys for each workload, and its `pricing_rule` in `buying_patterns.csv`
 * says how a per-token offer is priced:
 *
 *   plan rows   : users x seat price x months, plus the tokens above the
 *                 plan's usage cap billed at the overage model's direct list
 *                 price (always list price).
 *   offer rows  : tokens at the offer's price, at list price for rule `list`
 *                 and with the offer's commit discount for rule `commit`
 *                 (spec 12 BD-3). Only `commit` applies `commit_discount_pct`.
 *
 * Prices come from vendor price pages, so every Today segment is
 * `vendor_reported`.
 */

import type {
  BaselineProviderRow,
  ModelOfferRow,
  ModelTier,
  PatternId,
  PricingRule,
  Provenance,
  Scenario,
  SeatPlanRow,
  SpendSegment,
  Tables,
} from "../contract";
import { seatCapMtokPerUserMonth } from "../data/schema";
import type { WorkloadDemand } from "./demand";
import { deriveBestSingle, patternById, rowsForPattern } from "./patterns";
import {
  TOKENS_PER_MTOK,
  SpendBook,
  committedCostUsd,
  isStandardTier,
  isTokenPriced,
  listCostUsd,
  worstProvenance,
  type TokenPricedOffer,
} from "./pricing";

const TODAY_PROVENANCE: Provenance = "vendor_reported";

/** The model a baseline row buys, and the share of a workload's tokens it carries. */
export interface ModelShare {
  model_id: string;
  share: number;
  /**
   * Set for seat rows only: what today's seat spend on this share is, split
   * the way it appears in the Today bar. Infravana keeps the seats where
   * they cost less than buying the same tokens per token.
   */
  seat_parts?: { label: string; usd: number }[];
}

/** Spend and tokens on one model, for the per-class unit price of C3. */
export interface TodayLine {
  model_id: string;
  usd: number;
  tokens: number;
}

/** The best single option has no offer that meets every floor in effect (spec 6.1). */
export class NoBestSingleError extends Error {
  constructor(readonly patternId: PatternId) {
    super(`buying_patterns.csv: no single offer meets every quality floor, so "${patternId}" has no result`);
    this.name = "NoBestSingleError";
  }
}

export interface TodayResult {
  total_usd: number;
  segments: SpendSegment[];
  lines: TodayLine[];
  /** Per workload, the models today's baseline buys, for the Infravana side. */
  models_by_workload: Map<string, ModelShare[]>;
}

export type ClassTotals = Record<ModelTier, { usd: number; tokens: number; provenance: Provenance }>;

export function emptyClassTotals(): ClassTotals {
  const empty = () => ({ usd: 0, tokens: 0, provenance: "measured" as Provenance });
  return { frontier: empty(), mid: empty(), small: empty() };
}

export function addToClass(
  totals: ClassTotals,
  tier: ModelTier,
  usd: number,
  tokens: number,
  provenance: Provenance,
): void {
  const entry = totals[tier];
  entry.usd += usd;
  entry.tokens += tokens;
  entry.provenance = worstProvenance(entry.provenance, provenance);
}

/** Cheapest direct-channel token-priced offer of a model for a given in/out split. */
function directOffer(tables: Tables, modelId: string, tokensIn: number, tokensOut: number): TokenPricedOffer {
  let best: TokenPricedOffer | null = null;
  let bestUsd = Infinity;
  for (const offer of tables.model_offers) {
    if (offer.model_id !== modelId || offer.channel !== "direct" || !isStandardTier(offer) || !isTokenPriced(offer)) continue;
    const usd = (tokensIn * offer.usd_per_mtok_in + tokensOut * offer.usd_per_mtok_out) / TOKENS_PER_MTOK;
    if (usd < bestUsd) {
      best = offer;
      bestUsd = usd;
    }
  }
  if (best === null) {
    throw new Error(`model_offers.csv: model "${modelId}" has no direct offer to bill seat overage at`);
  }
  return best;
}

function seatPlan(tables: Tables, planId: string): SeatPlanRow {
  const plan = tables.seat_plans.find((p) => p.plan_id === planId);
  if (plan === undefined) {
    throw new Error(`seat_plans.csv: plan "${planId}" named in baseline_providers.csv does not exist`);
  }
  return plan;
}

function offerById(tables: Tables, offerId: string): TokenPricedOffer {
  const offer: ModelOfferRow | undefined = tables.model_offers.find((o) => o.offer_id === offerId);
  if (offer === undefined || !isTokenPriced(offer)) {
    throw new Error(`model_offers.csv: offer "${offerId}" named in baseline_providers.csv has no token price`);
  }
  return offer;
}

/**
 * Prices the workload under the buying pattern `patternId`. A `best_single`
 * pattern has no rows: its offer is derived from the demand and the tables.
 *
 * `_scenario` is part of the signature of spec 7.4 and is unused until the
 * G4 trade-off (spec 6.2) needs it; demand already carries the floors.
 */
export function computeToday(
  demand: readonly WorkloadDemand[],
  _scenario: Scenario,
  tables: Tables,
  patternId: PatternId,
): TodayResult {
  const pattern = patternById(tables, patternId);
  if (pattern.kind === "best_single") {
    const derived = deriveBestSingle(pattern, demand, tables);
    if (derived === null) {
      throw new NoBestSingleError(patternId);
    }
    return computeTodayFromRows(demand, tables, derived.rows, pattern.pricing_rule, patternId);
  }
  const rows = rowsForPattern(tables, patternId, demand);
  if (rows === null) {
    const missing = demand.find((d) => rowsForPattern(tables, patternId, [d]) === null);
    throw new Error(
      `baseline_providers.csv: no rows for pattern "${patternId}" and workload "${missing?.workload_id ?? ""}"`,
    );
  }
  return computeTodayFromRows(demand, tables, rows, pattern.pricing_rule, patternId);
}

function computeTodayFromRows(
  demand: readonly WorkloadDemand[],
  tables: Tables,
  patternRows: readonly BaselineProviderRow[],
  pricingRule: PricingRule,
  patternId: PatternId,
): TodayResult {
  const { months_per_quarter: months } = tables.manifest.parameters;
  const book = new SpendBook();
  const lines: TodayLine[] = [];
  const modelsByWorkload = new Map<string, ModelShare[]>();
  /** Api and platform tokens per baseline offer, priced together below. */
  const offerVolume = new Map<string, { offer: TokenPricedOffer; tokensIn: number; tokensOut: number }>();

  const noteModel = (
    workloadId: string,
    modelId: string,
    share: number,
    seatParts?: { label: string; usd: number }[],
  ): void => {
    const list = modelsByWorkload.get(workloadId) ?? [];
    const existing = list.find((m) => m.model_id === modelId);
    if (existing === undefined) {
      list.push(seatParts === undefined ? { model_id: modelId, share } : { model_id: modelId, share, seat_parts: seatParts });
    } else {
      existing.share += share;
      if (seatParts !== undefined) existing.seat_parts = [...(existing.seat_parts ?? []), ...seatParts];
    }
    modelsByWorkload.set(workloadId, list);
  };

  for (const d of demand) {
    const rows = patternRows.filter((r) => r.workload_id === d.workload_id);
    if (rows.length === 0) {
      throw new Error(
        `baseline_providers.csv: no rows for pattern "${patternId}" and workload "${d.workload_id}"`,
      );
    }
    for (const row of rows) {
      const tokensIn = d.tokens_in * row.share_default;
      const tokensOut = d.tokens_out * row.share_default;

      if (row.plan_id !== null) {
        const plan = seatPlan(tables, row.plan_id);
        const cap = seatCapMtokPerUserMonth(plan.included_usage_note);
        if (cap === null) {
          throw new Error(`seat_plans.csv: plan "${plan.plan_id}" has no cap_mtok_per_user_month=N in included_usage_note`);
        }
        if (plan.overage_model_id === null) {
          throw new Error(`seat_plans.csv: plan "${plan.plan_id}" has no overage_model_id`);
        }
        const seatUsers = d.users * row.share_default;
        const perUserMtok = (d.tokens_in_per_user + d.tokens_out_per_user) / TOKENS_PER_MTOK;
        const overageMtok = Math.max(0, perUserMtok - cap * months);
        const inFraction = d.tokens_in_per_user / (d.tokens_in_per_user + d.tokens_out_per_user);
        const overage = directOffer(tables, plan.overage_model_id, inFraction, 1 - inFraction);
        const overageUsdPerUser =
          overageMtok *
          (inFraction * overage.usd_per_mtok_in + (1 - inFraction) * overage.usd_per_mtok_out);

        const feeUsd = seatUsers * plan.usd_per_user_month * months;
        const overageUsd = seatUsers * overageUsdPerUser;
        book.add(plan.vendor, "provider", feeUsd, TODAY_PROVENANCE);
        book.add(overage.channel, "provider", overageUsd, TODAY_PROVENANCE);
        lines.push({
          model_id: plan.overage_model_id,
          usd: feeUsd + overageUsd,
          tokens: tokensIn + tokensOut,
        });
        noteModel(d.workload_id, plan.overage_model_id, row.share_default, [
          { label: plan.vendor, usd: feeUsd },
          { label: overage.channel, usd: overageUsd },
        ]);
      } else if (row.offer_id !== null) {
        const offer = offerById(tables, row.offer_id);
        const entry = offerVolume.get(offer.offer_id) ?? { offer, tokensIn: 0, tokensOut: 0 };
        entry.tokensIn += tokensIn;
        entry.tokensOut += tokensOut;
        offerVolume.set(offer.offer_id, entry);
        noteModel(d.workload_id, offer.model_id, row.share_default);
      }
    }
  }

  for (const { offer, tokensIn, tokensOut } of offerVolume.values()) {
    const usd =
      pricingRule === "commit"
        ? committedCostUsd(offer, tokensIn, tokensOut)
        : listCostUsd(offer, tokensIn, tokensOut);
    book.add(offer.channel, "provider", usd, TODAY_PROVENANCE);
    lines.push({ model_id: offer.model_id, usd, tokens: tokensIn + tokensOut });
  }

  const segments = book.segments();
  return {
    total_usd: segments.reduce((sum, s) => sum + s.usd, 0),
    segments,
    lines,
    models_by_workload: modelsByWorkload,
  };
}
