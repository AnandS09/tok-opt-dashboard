/**
 * Unit conversions, offer pricing and provenance helpers shared by the
 * compute modules. Pure functions only.
 */

import type { ModelOfferRow, Provenance, SpendSegment } from "../contract";

export const TOKENS_PER_MTOK = 1_000_000;
export const SECONDS_PER_HOUR = 3_600;
/** `commit_discount_pct` is a percent: 10 means 10%. */
export const PERCENT = 100;

/** An offer that has a token price on both directions (every non-self-host row). */
export type TokenPricedOffer = ModelOfferRow & {
  usd_per_mtok_in: number;
  usd_per_mtok_out: number;
};

/** A null price means "no token price", never zero (see `ModelOfferRow`). */
export function isTokenPriced(offer: ModelOfferRow): offer is TokenPricedOffer {
  return offer.usd_per_mtok_in !== null && offer.usd_per_mtok_out !== null;
}

/**
 * True for the list price every default view buys at. Batch and flex rows are
 * the same model at a cheaper, slower price and only the G4 speed step and the
 * C10 speed view may use them (spec 6.2, 6.3, 12 BD-11), so every other
 * reader of `model_offers` filters on this.
 */
export function isStandardTier(offer: ModelOfferRow): boolean {
  return offer.price_tier === "standard";
}

/** USD at list price for `tokensIn` input and `tokensOut` output tokens. */
export function listCostUsd(offer: TokenPricedOffer, tokensIn: number, tokensOut: number): number {
  return (
    (tokensIn * offer.usd_per_mtok_in + tokensOut * offer.usd_per_mtok_out) / TOKENS_PER_MTOK
  );
}

/**
 * USD with the offer's commit discount. The discount is available only when
 * the list-price spend at this offer reaches `min_commit_usd` (an empty
 * minimum means always). It prices every channel Infravana can buy through
 * and Today's platform stage, the only Today stage with a commit discount
 * (spec 12 BD-3). Today's seats and api stages use `listCostUsd`.
 */
export function committedCostUsd(
  offer: TokenPricedOffer,
  tokensIn: number,
  tokensOut: number,
): number {
  const list = listCostUsd(offer, tokensIn, tokensOut);
  const meetsMinimum = offer.min_commit_usd === null || list >= offer.min_commit_usd;
  return meetsMinimum ? list * (1 - offer.commit_discount_pct / PERCENT) : list;
}

/** Cheapest committed cost over `offers`; ties go to the lower offer_id. */
export function cheapestOffer(
  offers: readonly TokenPricedOffer[],
  tokensIn: number,
  tokensOut: number,
): { offer: TokenPricedOffer; usd: number } | null {
  let best: { offer: TokenPricedOffer; usd: number } | null = null;
  for (const offer of offers) {
    const usd = committedCostUsd(offer, tokensIn, tokensOut);
    if (
      best === null ||
      usd < best.usd ||
      (usd === best.usd && offer.offer_id < best.offer.offer_id)
    ) {
      best = { offer, usd };
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Provenance and segments
// ---------------------------------------------------------------------------

const PROVENANCE_RANK: Record<Provenance, number> = {
  measured: 0,
  vendor_reported: 1,
  modelled: 2,
};

/** Worst of several provenances (see `Provenance` in contract.ts). */
export function worstProvenance(...values: Provenance[]): Provenance {
  let worst: Provenance = "measured";
  for (const value of values) {
    if (PROVENANCE_RANK[value] > PROVENANCE_RANK[worst]) worst = value;
  }
  return worst;
}

/** `{ source_url }` for a non-empty address, else nothing, so a series with no address carries no key. */
export function withSource(url: string | null | undefined): { source_url?: string } {
  return url ? { source_url: url } : {};
}

/** Collects spend by (kind, label), merging repeats. */
export class SpendBook {
  private readonly entries = new Map<string, SpendSegment>();

  /** `sourceUrl` is the address of the row priced; the first non-empty one of a merged segment is kept. */
  add(label: string, kind: SpendSegment["kind"], usd: number, provenance: Provenance, sourceUrl?: string | null): void {
    const key = `${kind}|${label}`;
    const existing = this.entries.get(key);
    if (existing === undefined) {
      this.entries.set(key, { label, kind, usd, provenance, ...withSource(sourceUrl) });
    } else {
      existing.usd += usd;
      existing.provenance = worstProvenance(existing.provenance, provenance);
      if (!existing.source_url && sourceUrl) existing.source_url = sourceUrl;
    }
  }

  /** Largest spend first; equal spend ordered by label, so output is stable. */
  segments(): SpendSegment[] {
    return [...this.entries.values()]
      .filter((segment) => segment.usd > 0)
      .sort((a, b) => b.usd - a.usd || a.label.localeCompare(b.label))
      .map((segment) => ({ ...segment }));
  }
}
