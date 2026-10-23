import type { Results, TodayAlternative } from "../contract";
import { TODAY_LABEL } from "./labels";
import { MAX_OPTIONS } from "./patterns";

/** One grey Today option other than the comparator, with the rank that fixes its pattern and marker. */
export interface OptionBar {
  alt: TodayAlternative;
  /** 1 to 4, counted over the other grey options in the order of `Results.today_alternatives`. */
  rank: number;
}

/** The comparison set a chart draws (spec 6.1), read entirely from `Results`. */
export interface Comparison {
  /** The Today the InfraVana figures are measured against; null only if `Results` omits it. */
  comparator: TodayAlternative | null;
  /** Its label, or "Today" if it is missing. */
  label: string;
  /** The other grey options, at most four, in popularity order. */
  options: OptionBar[];
}

/**
 * Which Today options become grey marks (spec 6.1): the comparator, which
 * every chart draws as its Today, and every other option the engine marked
 * `is_grey`. Nothing here names a vendor or a way to buy; a different
 * comparator or stage gives a different set with no code change.
 */
export function comparisonOf(results: Results): Comparison {
  const alts = results.today_alternatives;
  const comparator = alts.find((a) => a.pattern_id === results.comparator) ?? null;
  const options = alts
    .filter((a) => a.is_grey && a.pattern_id !== results.comparator)
    .slice(0, MAX_OPTIONS)
    .map((alt, i) => ({ alt, rank: i + 1 }));
  return { comparator, label: comparator?.label ?? TODAY_LABEL, options };
}

/** A quality score as shown: "quality 91", or "quality n/a" when there is no demand to weight it by. */
export function qualityText(alt: TodayAlternative): string {
  // A no-break space keeps the word and its figure on one line when a label wraps.
  return alt.quality_score === null ? "quality\u00a0n/a" : `quality\u00a0${Math.round(alt.quality_score)}`;
}

/** The mark for an option that buys a model below one of the workload floors in effect. */
export const BELOW_FLOOR = "below your quality floor";

/** "quality 91", plus the unmet-floor mark when the option misses a floor. */
export function qualityLine(alt: TodayAlternative): string {
  return alt.meets_floors ? qualityText(alt) : `${qualityText(alt)}, ${BELOW_FLOOR}`;
}

/**
 * Height of the stage for a chart drawn as horizontal bars: the default for
 * two, room for each further bar. On a phone the row name sits above a
 * full-width bar (two lines of text over a bar 24px thick), so each row is
 * 84px (spec 15.11). `plotMargins` is the chart's own top and bottom margin on
 * a phone, which the 84px rows are added to.
 */
export function barRowsHeight(results: Results, phone = false, plotMargins = 70): number {
  const rows = 2 + comparisonOf(results).options.length;
  // On a phone the height is the chart's own top and bottom margins plus 84px a row, so each row is exactly 84px.
  return Math.max(320, phone ? plotMargins + PHONE_ROW_PX * rows : 70 + 54 * rows);
}

/** Height of one bar row on a phone (spec 15.11). */
export const PHONE_ROW_PX = 84;
