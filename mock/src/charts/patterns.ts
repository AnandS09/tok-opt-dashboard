import type { ColourKey, Tokens } from "./tokens";

/**
 * The pattern library of design-tokens 3.1, as ECharts `decal` objects. A
 * pattern sits inside a fill and is told apart from its neighbours by
 * geometry, never by colour, so four Today bars stay distinguishable in
 * greyscale (spec 14.4). The pattern colour is passed in, read from a token.
 *
 * The channel set (P1 to P5) and the option set (P6 to P9) share no pattern,
 * so a comparator channel segment and an option bar never look alike
 * (spec 6.1, acceptance 6).
 */
export type PatternKey = "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7" | "P8" | "P9" | "P10";

/** The subset of an ECharts decal the patterns use. */
export interface Decal {
  symbol: string;
  symbolSize: number;
  color: string;
  dashArrayX: (number | number[])[];
  dashArrayY: number | number[];
  rotation: number;
}

const QUARTER = Math.PI / 4;

type Geometry = Omit<Decal, "color">;

const GEOMETRY: Record<Exclude<PatternKey, "P1">, Geometry> = {
  P2: { symbol: "rect", symbolSize: 1, dashArrayX: [[1, 0]], dashArrayY: [2, 5], rotation: -QUARTER },
  P3: { symbol: "circle", symbolSize: 0.7, dashArrayX: [[6, 6], [0, 6, 6, 0]], dashArrayY: [5, 0], rotation: 0 },
  P4: { symbol: "rect", symbolSize: 1, dashArrayX: [[1, 0], [1, 6]], dashArrayY: [1, 0, 6, 0], rotation: QUARTER },
  P5: { symbol: "rect", symbolSize: 1, dashArrayX: [[1, 0]], dashArrayY: [1, 4], rotation: 0 },
  P6: { symbol: "rect", symbolSize: 1, dashArrayX: [[1, 0]], dashArrayY: [3, 7], rotation: Math.PI / 2 },
  P7: { symbol: "rect", symbolSize: 1, dashArrayX: [[1, 0], [1, 9]], dashArrayY: [1, 0, 9, 0], rotation: 0 },
  P8: { symbol: "triangle", symbolSize: 0.9, dashArrayX: [[10, 10], [0, 10, 10, 0]], dashArrayY: [10, 0], rotation: 0 },
  P9: { symbol: "diamond", symbolSize: 0.9, dashArrayX: [[10, 6]], dashArrayY: [10, 0], rotation: 0 },
  P10: { symbol: "rect", symbolSize: 1, dashArrayX: [[1, 0]], dashArrayY: [6, 6], rotation: QUARTER },
};

/** The decal of a pattern in `color`; undefined for P1, which is a plain fill. */
export function decalOf(key: PatternKey, color: string): Decal | undefined {
  return key === "P1" ? undefined : { ...GEOMETRY[key], color };
}

export const PATTERN_NAME: Record<PatternKey, string> = {
  P1: "solid",
  P2: "hatch",
  P3: "dots",
  P4: "cross-hatch",
  P5: "fine lines",
  P6: "vertical bars",
  P7: "square grid",
  P8: "triangles",
  P9: "diamonds",
  P10: "wide bands",
};

// ---------------------------------------------------------------------------
// Assignment (design-tokens 3.2)
// ---------------------------------------------------------------------------

/** Today greys alternate between neighbours: grey 1, grey 2, grey 1 and so on. */
export const TODAY_FILL_ALTERNATION: ColourKey[] = ["today1", "today2"];

/** C1 comparator bar: the pattern of its nth channel segment (up to five). */
export const CHANNEL_PATTERNS: PatternKey[] = ["P1", "P1", "P2", "P3", "P4"];

/** C1 InfraVana bar: the pattern of its nth spend segment (up to four, the fourth being "Other"). */
export const INFRAVANA_PATTERNS: PatternKey[] = ["P1", "P2", "P3", "P4"];

/** Savings segments are hollow; each source has its own pattern, drawn in the saved-money colour. */
export const SAVINGS_PATTERNS = { arbitrage: "P2", routing: "P3" } as const;

/** What one option rank (1 to 4) looks like in every chart (design-tokens 3.2, "One option, one identity"). */
export interface OptionStyle {
  fill: ColourKey;
  pattern: PatternKey;
  /** The ECharts symbol of its C3 marker. */
  marker: "circle" | "rect" | "triangle" | "diamond";
}

/** Option ranks 1 to 4 in order; a rank beyond the table has no identity and is not drawn. */
export const OPTION_STYLES: OptionStyle[] = [
  { fill: "today2", pattern: "P6", marker: "circle" },
  { fill: "today1", pattern: "P7", marker: "rect" },
  { fill: "today2", pattern: "P8", marker: "triangle" },
  { fill: "today1", pattern: "P9", marker: "diamond" },
];

export const MAX_OPTIONS = OPTION_STYLES.length;

export function optionStyle(rank: number): OptionStyle {
  return OPTION_STYLES[rank - 1];
}

/** Decal of an option rank's bar fill, in the on-fill pattern colour. */
export function optionDecal(rank: number, t: Tokens): Decal | undefined {
  return decalOf(optionStyle(rank).pattern, t.patternOnFill);
}
