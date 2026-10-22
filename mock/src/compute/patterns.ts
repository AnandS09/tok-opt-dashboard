/**
 * Spec 6.1 and 7.4: the Today options. Which buying patterns apply to a
 * scenario, which one is the typical buyer, how the best single option is
 * derived, and which options are the grey bars. Pure functions over the
 * tables; nothing here names a pattern, vendor or model.
 */

import type {
  BaselineProviderRow,
  BuyingPatternRow,
  PatternId,
  Scenario,
  Tables,
} from "../contract";
import type { WorkloadDemand } from "./demand";
import {
  committedCostUsd,
  isStandardTier,
  isTokenPriced,
  listCostUsd,
  type TokenPricedOffer,
} from "./pricing";

const COMPOSITE_PREFIX = "composite:";

/** The most grey Today options a chart shows (spec 6.1). */
export const MAX_GREY_OPTIONS = 4;

/** A pattern that applies to the scenario, with the baseline rows that define it. */
export interface PatternRows {
  pattern: BuyingPatternRow;
  rows: BaselineProviderRow[];
}

/** composite score by `model_id|workload_id` (the `composite:` rows of quality.csv). */
export function compositeScores(tables: Tables): Map<string, number> {
  const scores = new Map<string, number>();
  for (const row of tables.quality) {
    if (row.benchmark.startsWith(COMPOSITE_PREFIX)) {
      scores.set(`${row.model_id}|${row.benchmark.slice(COMPOSITE_PREFIX.length)}`, row.score);
    }
  }
  return scores;
}

/** The pattern a row of buying_patterns.csv names, or an error naming the file. */
export function patternById(tables: Tables, patternId: PatternId): BuyingPatternRow {
  const pattern = tables.buying_patterns.find((p) => p.pattern_id === patternId);
  if (pattern === undefined) {
    throw new Error(`buying_patterns.csv: pattern "${patternId}" does not exist`);
  }
  return pattern;
}

/** The typical buyer for a stage: the way_to_buy pattern whose `stage` equals it. */
export function typicalPattern(tables: Tables, stage: Scenario["stage_today"]): BuyingPatternRow {
  const pattern = tables.buying_patterns.find((p) => p.kind === "way_to_buy" && p.stage === stage);
  if (pattern === undefined) {
    throw new Error(`buying_patterns.csv: no way_to_buy pattern for stage "${stage}"`);
  }
  return pattern;
}

/** The baseline rows of a pattern for the demanded workloads, or null if one workload has none. */
export function rowsForPattern(
  tables: Tables,
  patternId: PatternId,
  demand: readonly WorkloadDemand[],
): BaselineProviderRow[] | null {
  const rows: BaselineProviderRow[] = [];
  for (const d of demand) {
    const forWorkload = tables.baseline_providers.filter(
      (r) => r.pattern_id === patternId && r.workload_id === d.workload_id,
    );
    if (forWorkload.length === 0) return null;
    rows.push(...forWorkload);
  }
  return rows;
}

/** Every non-derived pattern that has rows for every demanded workload (spec 6.1 acceptance 8). */
export function applicablePatterns(tables: Tables, demand: readonly WorkloadDemand[]): PatternRows[] {
  const applicable: PatternRows[] = [];
  for (const pattern of tables.buying_patterns) {
    if (pattern.kind === "best_single") continue;
    const rows = rowsForPattern(tables, pattern.pattern_id, demand);
    if (rows !== null) applicable.push({ pattern, rows });
  }
  return applicable;
}

/**
 * The best single option (spec 6.1): the cheapest one token-priced offer of
 * a proprietary model that every demanded workload can use, meaning the
 * model's composite score meets that workload's floor in effect. All tokens
 * go through that offer, priced by the pattern's own rule. Open-weight
 * models are left out: spec 6.1's example and the feasibility figures are
 * proprietary offers, and an open-weight hosted offer is something
 * InfraVana's routing buys, not a way Today buys. Returns synthetic baseline
 * rows for it, or null when no single offer meets every floor.
 */
export function deriveBestSingle(
  pattern: BuyingPatternRow,
  demand: readonly WorkloadDemand[],
  tables: Tables,
): { rows: BaselineProviderRow[]; offer: TokenPricedOffer } | null {
  if (demand.length === 0) return null;
  const scores = compositeScores(tables);
  const proprietary = new Set(
    tables.models.filter((m) => m.license === "proprietary").map((m) => m.model_id),
  );
  const tokensIn = demand.reduce((sum, d) => sum + d.tokens_in, 0);
  const tokensOut = demand.reduce((sum, d) => sum + d.tokens_out, 0);
  const price = pattern.pricing_rule === "commit" ? committedCostUsd : listCostUsd;

  let best: { offer: TokenPricedOffer; usd: number } | null = null;
  for (const offer of tables.model_offers) {
    if (!isTokenPriced(offer) || !isStandardTier(offer) || !proprietary.has(offer.model_id)) continue;
    const meetsEveryFloor = demand.every((d) => {
      const score = scores.get(`${offer.model_id}|${d.workload_id}`);
      return score !== undefined && score >= d.quality_floor;
    });
    if (!meetsEveryFloor) continue;
    const usd = price(offer, tokensIn, tokensOut);
    if (best === null || usd < best.usd || (usd === best.usd && offer.offer_id < best.offer.offer_id)) {
      best = { offer, usd };
    }
  }
  if (best === null) return null;
  const { offer } = best;
  return {
    offer,
    rows: demand.map((d) => ({
      pattern_id: pattern.pattern_id,
      workload_id: d.workload_id,
      offer_id: offer.offer_id,
      plan_id: null,
      share_default: 1,
    })),
  };
}

/** Popularity rank by pattern for one stage (spec 7.4); a pattern with no row is unranked. */
export function popularityRanks(tables: Tables, stage: Scenario["stage_today"]): Map<PatternId, number> {
  const ranks = new Map<PatternId, number>();
  for (const row of tables.pattern_popularity) {
    if (row.stage === stage) ranks.set(row.pattern_id, row.popularity_rank);
  }
  return ranks;
}

/** Popularity order: lower rank first, ties by pattern_id; unranked patterns come last. */
function byPopularity(ranks: ReadonlyMap<PatternId, number>) {
  return (a: BuyingPatternRow, b: BuyingPatternRow): number =>
    (ranks.get(a.pattern_id) ?? Infinity) - (ranks.get(b.pattern_id) ?? Infinity) ||
    a.pattern_id.localeCompare(b.pattern_id);
}

/**
 * The display order of the Today options and which of them are grey (spec 6.1).
 *
 *   - The default greys are the patterns ranked for the visitor's stage, in
 *     popularity order, at most four. The typical buyer is always one of them, never listed twice: if
 *     it does not rank in the top four it takes the fourth slot, and an
 *     unranked typical buyer is still included.
 *   - A comparator that is not already grey (a lower-ranked pattern, or the
 *     best single option) replaces the lowest-ranked grey that is neither
 *     the typical buyer nor the comparator, so there are never more than four.
 *   - Unranked patterns are never default greys.
 *
 * Returns the ids in display order (greys, then the other applicable
 * patterns by popularity with unranked last, then `best_single` if present)
 * and the set of grey ids.
 */
export function orderOptions(
  applicable: readonly BuyingPatternRow[],
  bestSingle: BuyingPatternRow | null,
  typicalId: PatternId,
  comparatorId: PatternId,
  ranks: ReadonlyMap<PatternId, number>,
): { order: PatternId[]; grey: Set<PatternId> } {
  const byRank = byPopularity(ranks);
  const ranked = applicable.filter((p) => ranks.has(p.pattern_id)).sort(byRank);
  let greys = ranked.slice(0, MAX_GREY_OPTIONS).map((p) => p.pattern_id);
  if (!greys.includes(typicalId)) {
    greys = [...greys.slice(0, MAX_GREY_OPTIONS - 1), typicalId];
  }
  if (!greys.includes(comparatorId)) {
    if (greys.length >= MAX_GREY_OPTIONS) {
      const dropAt = greys.map((id, i) => (id === typicalId ? -1 : i)).filter((i) => i >= 0).pop();
      if (dropAt !== undefined) greys.splice(dropAt, 1);
    }
    greys.push(comparatorId);
  }

  const greySet = new Set(greys);
  const rest = applicable
    .filter((p) => !greySet.has(p.pattern_id))
    .sort(byRank)
    .map((p) => p.pattern_id);
  const order = [...greys, ...rest];
  if (bestSingle !== null && !greySet.has(bestSingle.pattern_id)) order.push(bestSingle.pattern_id);
  return { order, grey: greySet };
}
