/**
 * Spec 7.2 step 3: what the same workload costs with Infravana.
 *
 * Reading of the spec chosen for the mock (conservative): Infravana never
 * changes the user's model_mix tier shares, and every dollar it saves comes
 * from one of two data-driven sources.
 *
 *   (a) Provider arbitrage. The proprietary traffic keeps the model that
 *       today's baseline buys, and each such model is bought through its
 *       cheapest channel among the token-priced rows of model_offers.csv.
 *   (b) Routing. Up to `open_weight_share` of a workload's tokens moves to
 *       the cheapest eligible open-weight model, bought through a hosted
 *       channel or self-hosted on an allowed hardware tier. Eligible means
 *       the model's composite quality for the workload meets the floor in
 *       effect and it can be bought (a throughput row meets the latency
 *       class). The share is spread over the tiers that have an eligible
 *       open-weight model, in proportion to their mix share; it is never
 *       more than the share asked for, and traffic that cannot go open stays
 *       on today's model. A move is made only when it costs less than the
 *       proprietary traffic it replaces.
 *   Seats: where today's seat spend for a workload is lower than buying its
 *   tokens per token, Infravana keeps the seat plan for that workload, so
 *   arbitrage is never negative and routing is never inflated by it.
 *
 * Tier rerouting (moving traffic to a cheaper tier because quality permits)
 * is not implemented.
 *
 * Simplifications, all deliberate:
 *   - Capacity is assumed unlimited. Self-hosted cost per million tokens is
 *     what one GPU-hour buys at its best eligible throughput point, with no
 *     idle time, GPU count or provisioning. Spec 7.2's capacity-constrained
 *     LP is not needed under this assumption.
 *   - Proprietary models carry no throughput data, so the latency class does
 *     not gate them. A hosted open-weight offer is gated on the model having
 *     a qualifying throughput row on any hardware, because the host chooses
 *     the hardware; the Hardware knob (`tiers_allowed`) limits self-hosting
 *     only.
 *   - Self-hosted cost is one rate per million tokens over input and output
 *     together, since the curves carry a single `tok_s_per_gpu`.
 *   - A routed unit's commit discount is tested against that unit's own
 *     spend, which can understate sharing of a commitment between units.
 */

import type {
  ModelRow,
  ModelTier,
  Provenance,
  Scenario,
  SpendSegment,
  Tables,
  ThroughputCurveRow,
} from "../contract";
import { TIERS } from "../data/schema";
import type { WorkloadDemand } from "./demand";
import {
  SECONDS_PER_HOUR,
  SpendBook,
  TOKENS_PER_MTOK,
  cheapestOffer,
  committedCostUsd,
  isTokenPriced,
  worstProvenance,
  type TokenPricedOffer,
} from "./pricing";
import {
  addToClass,
  emptyClassTotals,
  type ClassTotals,
  type ModelShare,
  type TodayResult,
} from "./today";

const COMPOSITE_PREFIX = "composite:";
/** Price pages feed both the channel prices and the hourly hardware prices. */
const PRICE_PROVENANCE: Provenance = "vendor_reported";

export interface InfravanaPlan {
  /** Total Infravana spend, USD per quarter. */
  spend_usd: number;
  /** Spend if every token stayed on today's models, bought through the cheapest channels. */
  proprietary_only_usd: number;
  /** Spend segments only; savings are derived by the caller. */
  segments: SpendSegment[];
  /** Worst provenance of the routed options (`vendor_reported` when nothing is routed). */
  routing_provenance: Provenance;
  by_class: ClassTotals;
  /** Tokens (in plus out) moved to open-weight models. */
  routed_tokens: number;
}

interface Volume {
  tokensIn: number;
  tokensOut: number;
}

interface RoutedOption {
  usd: number;
  offerId: string;
  modelId: string;
  /** Tokens (in plus out) this option carries. */
  tokens: number;
  label: string;
  kind: SpendSegment["kind"];
  provenance: Provenance;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function planInfravana(
  demand: readonly WorkloadDemand[],
  today: TodayResult,
  scenario: Scenario,
  tables: Tables,
): InfravanaPlan {
  const modelById = new Map<string, ModelRow>(tables.models.map((m) => [m.model_id, m]));
  const tierOf = (modelId: string): ModelTier => {
    const model = modelById.get(modelId);
    if (model === undefined) throw new Error(`models.csv: model "${modelId}" does not exist`);
    return model.tier;
  };

  const threshold = tables.manifest.parameters.latency_classes[scenario.latency_class];
  const meetsLatency = (row: ThroughputCurveRow): boolean =>
    row.tok_s_per_user >= threshold.min_tok_s_per_user &&
    (threshold.max_p95_ttft_ms === null || row.p95_ttft_ms <= threshold.max_p95_ttft_ms);

  const allowedHardware = new Set(
    scenario.tiers_allowed === "all"
      ? tables.hardware.map((h) => h.hw_id)
      : scenario.tiers_allowed,
  );
  const hardwareById = new Map(tables.hardware.map((h) => [h.hw_id, h]));

  const composite = new Map<string, number>();
  for (const row of tables.quality) {
    if (row.benchmark.startsWith(COMPOSITE_PREFIX)) {
      composite.set(`${row.model_id}|${row.benchmark.slice(COMPOSITE_PREFIX.length)}`, row.score);
    }
  }

  const offersByModel = new Map<string, TokenPricedOffer[]>();
  const selfHostable = new Set<string>();
  for (const offer of [...tables.model_offers].sort((a, b) => a.offer_id.localeCompare(b.offer_id))) {
    if (offer.channel === "self-host") {
      selfHostable.add(offer.model_id);
    } else if (isTokenPriced(offer)) {
      const list = offersByModel.get(offer.model_id) ?? [];
      list.push(offer);
      offersByModel.set(offer.model_id, list);
    }
  }

  // Latency-qualifying throughput rows per open model, by hardware.
  const qualifyingRows = tables.throughput_curves.filter(meetsLatency);
  const hostedLatencyOk = new Set(qualifyingRows.map((r) => r.model_id));

  /** Best self-host cost per million tokens for a model on the allowed tiers. */
  const selfHostBest = (modelId: string): { hwId: string; usdPerMtok: number; provenance: Provenance } | null => {
    let best: { hwId: string; usdPerMtok: number; provenance: Provenance; concurrency: number } | null = null;
    for (const row of qualifyingRows) {
      if (row.model_id !== modelId || !allowedHardware.has(row.hw_id)) continue;
      const hardware = hardwareById.get(row.hw_id);
      if (hardware === undefined) continue;
      const usdPerMtok = hardware.usd_per_hr / ((row.tok_s_per_gpu * SECONDS_PER_HOUR) / TOKENS_PER_MTOK);
      const better =
        best === null ||
        usdPerMtok < best.usdPerMtok ||
        (usdPerMtok === best.usdPerMtok &&
          (row.hw_id < best.hwId || (row.hw_id === best.hwId && row.concurrency < best.concurrency)));
      if (better) {
        best = {
          hwId: row.hw_id,
          usdPerMtok,
          provenance: worstProvenance(row.provenance, PRICE_PROVENANCE),
          concurrency: row.concurrency,
        };
      }
    }
    return best === null ? null : { hwId: best.hwId, usdPerMtok: best.usdPerMtok, provenance: best.provenance };
  };

  // ---- Which open-weight models can be bought at all ---------------------
  const selfHostCache = new Map<string, ReturnType<typeof selfHostBest>>();
  const selfHostFor = (modelId: string) => {
    if (!selfHostCache.has(modelId)) selfHostCache.set(modelId, selfHostBest(modelId));
    return selfHostCache.get(modelId) ?? null;
  };
  const buyable = (modelId: string): boolean =>
    (hostedLatencyOk.has(modelId) && (offersByModel.get(modelId)?.length ?? 0) > 0) ||
    (selfHostable.has(modelId) && selfHostFor(modelId) !== null);
  const eligibleOpen = (model: ModelRow, workloadId: string, floor: number): boolean => {
    if (model.license !== "open" || !buyable(model.model_id)) return false;
    const score = composite.get(`${model.model_id}|${workloadId}`);
    return score !== undefined && score >= floor;
  };

  const mix = scenario.model_mix;
  const requestedOpen = clamp01(mix.open_weight_share);

  // ---- Proprietary side: volumes and the cheapest channel per model ------
  const channelFor = (modelId: string, v: Volume) => {
    const offers = offersByModel.get(modelId) ?? [];
    const best = cheapestOffer(offers, v.tokensIn, v.tokensOut);
    if (best === null) {
      throw new Error(`model_offers.csv: model "${modelId}" has no token-priced offer to buy it through`);
    }
    return best;
  };
  const proprietaryCost = (modelId: string, v: Volume): number =>
    v.tokensIn + v.tokensOut > 0 ? channelFor(modelId, v).usd : 0;

  // Seats: compare each seat row's spend with its tokens bought per token at
  // the model's cheapest channel (average rate over the model's full volume).
  const fullVolume = new Map<string, Volume>();
  const addTo = (map: Map<string, Volume>, modelId: string, tokensIn: number, tokensOut: number): void => {
    const v = map.get(modelId) ?? { tokensIn: 0, tokensOut: 0 };
    v.tokensIn = Math.max(0, v.tokensIn + tokensIn);
    v.tokensOut = Math.max(0, v.tokensOut + tokensOut);
    map.set(modelId, v);
  };
  for (const d of demand) {
    for (const m of today.models_by_workload.get(d.workload_id) ?? []) {
      addTo(fullVolume, m.model_id, d.tokens_in * m.share, d.tokens_out * m.share);
    }
  }
  const perTokenRate = new Map<string, number>();
  for (const [modelId, v] of fullVolume) {
    const tokens = v.tokensIn + v.tokensOut;
    perTokenRate.set(modelId, tokens > 0 ? proprietaryCost(modelId, v) / tokens : 0);
  }

  const proprietaryVolume = new Map<string, Volume>();
  const keptSeats: { modelId: string; tokens: number; parts: { label: string; usd: number }[] }[] = [];
  /** Per workload, the fraction of its tokens that is not on a kept seat plan. */
  const routableFraction = new Map<string, number>();
  const keptKeys = new Set<string>();
  const isKeptSeat = (workloadId: string, m: ModelShare): boolean =>
    keptKeys.has(`${workloadId}|${m.model_id}`);
  for (const d of demand) {
    let routable = 0;
    for (const m of today.models_by_workload.get(d.workload_id) ?? []) {
      const tokens = (d.tokens_in + d.tokens_out) * m.share;
      const seatUsd = m.seat_parts?.reduce((sum, part) => sum + part.usd, 0);
      if (m.seat_parts !== undefined && seatUsd !== undefined && seatUsd < tokens * (perTokenRate.get(m.model_id) ?? 0)) {
        keptSeats.push({ modelId: m.model_id, tokens, parts: m.seat_parts });
        keptKeys.add(`${d.workload_id}|${m.model_id}`);
      } else {
        addTo(proprietaryVolume, m.model_id, d.tokens_in * m.share, d.tokens_out * m.share);
        routable += m.share;
      }
    }
    routableFraction.set(d.workload_id, routable);
  }
  const keptSeatUsd = keptSeats.reduce((sum, k) => sum + k.parts.reduce((a, p) => a + p.usd, 0), 0);

  let proprietaryOnly = keptSeatUsd;
  for (const [modelId, v] of proprietaryVolume) proprietaryOnly += proprietaryCost(modelId, v);

  // ---- Routing: open-weight units, accepted only when they save money ----
  const routed: RoutedOption[] = [];
  for (const d of demand) {
    const routable = routableFraction.get(d.workload_id) ?? 0;
    if (!(routable > 0)) continue;

    // Spread the requested open share over the tiers that have an eligible
    // open-weight model for this workload, in proportion to their mix share.
    const eligibleByTier = new Map<ModelTier, ModelRow[]>();
    let capacity = 0;
    for (const tier of TIERS) {
      const models = tables.models.filter(
        (m) => m.tier === tier && eligibleOpen(m, d.workload_id, d.quality_floor),
      );
      if (models.length > 0 && mix[tier] > 0) {
        eligibleByTier.set(tier, models);
        capacity += mix[tier];
      }
    }
    if (!(capacity > 0)) continue;
    const moveFraction = Math.min(1, requestedOpen / capacity);

    for (const [tier, models] of eligibleByTier) {
      const unitShare = mix[tier] * moveFraction * routable;
      if (!(unitShare > 0)) continue;
      const tokensIn = d.tokens_in * unitShare;
      const tokensOut = d.tokens_out * unitShare;

      let best: RoutedOption | null = null;
      for (const model of models) {
        const options: RoutedOption[] = [];
        if (hostedLatencyOk.has(model.model_id)) {
          for (const offer of offersByModel.get(model.model_id) ?? []) {
            options.push({
              usd: committedCostUsd(offer, tokensIn, tokensOut),
              offerId: offer.offer_id,
              modelId: model.model_id,
              tokens: tokensIn + tokensOut,
              label: offer.channel,
              kind: "provider",
              provenance: PRICE_PROVENANCE,
            });
          }
        }
        const hosted = selfHostable.has(model.model_id) ? selfHostFor(model.model_id) : null;
        if (hosted !== null) {
          options.push({
            usd: ((tokensIn + tokensOut) / TOKENS_PER_MTOK) * hosted.usdPerMtok,
            offerId: `self-host:${model.model_id}:${hosted.hwId}`,
            modelId: model.model_id,
            tokens: tokensIn + tokensOut,
            label: hosted.hwId,
            kind: "hardware",
            provenance: hosted.provenance,
          });
        }
        for (const option of options) {
          if (
            best === null ||
            option.usd < best.usd ||
            (option.usd === best.usd && option.offerId < best.offerId)
          ) {
            best = option;
          }
        }
      }
      if (best === null) continue;

      // True saving of moving this unit: proprietary cost before minus after.
      // The unit's tokens come only from shares that are not on a kept seat.
      const removals = (today.models_by_workload.get(d.workload_id) ?? [])
        .filter((m) => !isKeptSeat(d.workload_id, m))
        .map((m) => ({
          modelId: m.model_id,
          tokensIn: (tokensIn * m.share) / routable,
          tokensOut: (tokensOut * m.share) / routable,
        }));
      let before = 0;
      let after = 0;
      for (const r of removals) {
        const v = proprietaryVolume.get(r.modelId) ?? { tokensIn: 0, tokensOut: 0 };
        before += proprietaryCost(r.modelId, v);
        after += proprietaryCost(r.modelId, {
          tokensIn: Math.max(0, v.tokensIn - r.tokensIn),
          tokensOut: Math.max(0, v.tokensOut - r.tokensOut),
        });
      }
      if (best.usd < before - after) {
        for (const r of removals) addTo(proprietaryVolume, r.modelId, -r.tokensIn, -r.tokensOut);
        routed.push(best);
      }
    }
  }

  // ---- Assemble spend, segments and per-class unit prices ----------------
  const book = new SpendBook();
  const byClass = emptyClassTotals();
  let spend = keptSeatUsd;

  for (const kept of keptSeats) {
    for (const part of kept.parts) book.add(part.label, "provider", part.usd, PRICE_PROVENANCE);
    addToClass(
      byClass,
      tierOf(kept.modelId),
      kept.parts.reduce((sum, part) => sum + part.usd, 0),
      kept.tokens,
      PRICE_PROVENANCE,
    );
  }
  for (const [modelId, v] of proprietaryVolume) {
    if (v.tokensIn + v.tokensOut <= 0) continue;
    const { offer, usd } = channelFor(modelId, v);
    book.add(offer.channel, "provider", usd, PRICE_PROVENANCE);
    addToClass(byClass, tierOf(modelId), usd, v.tokensIn + v.tokensOut, PRICE_PROVENANCE);
    spend += usd;
  }
  let routingProvenance: Provenance = PRICE_PROVENANCE;
  let routedTokens = 0;
  for (const option of routed) {
    book.add(option.label, option.kind, option.usd, option.provenance);
    addToClass(byClass, tierOf(option.modelId), option.usd, option.tokens, option.provenance);
    routingProvenance = worstProvenance(routingProvenance, option.provenance);
    routedTokens += option.tokens;
    spend += option.usd;
  }

  return {
    spend_usd: spend,
    proprietary_only_usd: proprietaryOnly,
    segments: book.segments(),
    routing_provenance: routingProvenance,
    by_class: byClass,
    routed_tokens: routedTokens,
  };
}
