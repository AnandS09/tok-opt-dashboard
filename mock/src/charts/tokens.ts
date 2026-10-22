/**
 * Design tokens for chart code. ECharts draws to canvas, which cannot resolve
 * `var()`, so colours, stroke sizes, type sizes and timings are read from the
 * CSS custom properties at draw time with getComputedStyle. The tokens stay
 * the single source (styles/tokens.css, spec 14); no colour, stroke, font or
 * font size is written in chart code, so a change of theme is a change of
 * stylesheet only.
 */

/** Colour and font-family tokens, kept as the text the stylesheet gives. */
export type ColourKey =
  | "surface"
  | "surfaceRaised"
  | "separator"
  | "text"
  | "textSecondary"
  | "border"
  | "borderStrong"
  | "grid"
  | "accent"
  | "accentStrong"
  | "saved"
  | "positive"
  | "today1"
  | "today2"
  | "today3"
  | "today4"
  | "budgetLine"
  | "patternOnFill"
  | "patternOnSaved"
  | "provenanceOnFill"
  | "provenanceOnHollow";

/** Single-number tokens: pixel sizes, weights, milliseconds and counts. */
export type NumberKey =
  | "separatorWidth"
  | "savingsOutlineWidth"
  | "budgetLineWidth"
  | "provenanceWidth"
  | "fontXs"
  | "fontSm"
  | "weightRegular"
  | "weightBold"
  | "lineHeightTight"
  | "durationFade"
  | "space1"
  | "space2"
  | "space3";

/** Dash-array tokens ("6 3"), read as numbers: the outline dashes that mean provenance. */
export type DashKey = "dashModelled" | "dashVendor";

export type Tokens = Record<ColourKey, string> &
  Record<NumberKey, number> &
  Record<DashKey, number[]> & {
    fontSans: string;
    /** Line height in pixels of the two chart text sizes: ceil(size x line-height-tight). */
    lineXs: number;
    lineSm: number;
  };

/**
 * Custom property behind each colour token. `surface` is the chart's own
 * ground, the colour behind and between marks and under label chips and the
 * text drawn on dark fills; in the Research Note theme that is the paper
 * (`--color-bg`), so a chart carries no box of its own (spec 14.1).
 */
export const COLOUR_VARS: Record<ColourKey, string> = {
  surface: "--color-chart-ground",
  surfaceRaised: "--color-surface-raised",
  separator: "--color-series-separator",
  text: "--color-text",
  textSecondary: "--color-text-secondary",
  border: "--color-border",
  borderStrong: "--color-border-strong",
  grid: "--color-grid",
  accent: "--color-accent",
  accentStrong: "--color-accent-strong",
  saved: "--color-saved",
  positive: "--color-positive",
  today1: "--color-today-1",
  today2: "--color-today-2",
  today3: "--color-today-3",
  today4: "--color-today-4",
  budgetLine: "--color-budget-line",
  patternOnFill: "--color-pattern-on-fill",
  patternOnSaved: "--color-pattern-on-saved",
  provenanceOnFill: "--color-provenance-on-fill",
  provenanceOnHollow: "--color-provenance-on-hollow",
};

/** Custom property behind each number token. */
export const NUMBER_VARS: Record<NumberKey, string> = {
  separatorWidth: "--chart-separator-width",
  savingsOutlineWidth: "--chart-savings-outline-width",
  budgetLineWidth: "--chart-budget-line-width",
  provenanceWidth: "--chart-provenance-width",
  fontXs: "--font-size-xs",
  fontSm: "--font-size-sm",
  weightRegular: "--font-weight-regular",
  weightBold: "--font-weight-bold",
  lineHeightTight: "--line-height-tight",
  durationFade: "--duration-fade",
  space1: "--space-1",
  space2: "--space-2",
  space3: "--space-3",
};

/** Custom property behind each dash-array token. */
export const DASH_VARS: Record<DashKey, string> = {
  dashModelled: "--chart-dash-modelled",
  dashVendor: "--chart-dash-vendor",
};

const OTHER_VARS = {
  fontSans: "--font-sans",
};

/** Every custom property the charts read, for callers that supply their own values. */
export const TOKEN_PROPERTIES: string[] = [
  ...Object.values(COLOUR_VARS),
  ...Object.values(NUMBER_VARS),
  ...Object.values(DASH_VARS),
  ...Object.values(OTHER_VARS),
];

/**
 * Parses one number: "1.5px" -> 1.5, "180ms" -> 180, "0.75rem" -> 0.75 x the
 * root font size in pixels, "6" -> 6.
 */
function parseNumber(property: string, text: string, rootFontPx: number): number {
  const m = /^(-?\d*\.?\d+)\s*(px|rem|ms|s)?$/.exec(text.trim());
  if (!m) throw new Error(`Design token ${property} is not a number: "${text}"`);
  const value = Number.parseFloat(m[1]);
  if (m[2] === "rem") return value * rootFontPx;
  if (m[2] === "s") return value * 1000;
  return value;
}

/** Parses a dash array: "6 3" -> [6, 3]. */
function parseDash(property: string, text: string): number[] {
  const parts = text.trim().split(/[\s,]+/).map(Number);
  if (parts.length === 0 || parts.some((n) => !Number.isFinite(n) || n < 0)) {
    throw new Error(`Design token ${property} is not a dash array: "${text}"`);
  }
  return parts;
}

/**
 * Builds the tokens from a lookup of custom property name to its computed
 * value. Throws, naming every property, when any is undefined, so a missing
 * stylesheet is reported rather than drawn in ECharts' default colours.
 * `rootFontPx` converts rem sizes (the type tokens are rem).
 */
export function tokensFrom(lookup: (property: string) => string, rootFontPx = 16): Tokens {
  const missing = TOKEN_PROPERTIES.filter((p) => lookup(p).trim() === "");
  if (missing.length > 0) throw new Error(`Design tokens not defined: ${missing.join(", ")}`);
  const get = (p: string) => lookup(p).trim();

  const colours = {} as Record<ColourKey, string>;
  for (const key of Object.keys(COLOUR_VARS) as ColourKey[]) colours[key] = get(COLOUR_VARS[key]);
  const numbers = {} as Record<NumberKey, number>;
  for (const key of Object.keys(NUMBER_VARS) as NumberKey[]) {
    numbers[key] = parseNumber(NUMBER_VARS[key], get(NUMBER_VARS[key]), rootFontPx);
  }
  const dashes = {} as Record<DashKey, number[]>;
  for (const key of Object.keys(DASH_VARS) as DashKey[]) dashes[key] = parseDash(DASH_VARS[key], get(DASH_VARS[key]));
  return {
    ...colours,
    ...numbers,
    ...dashes,
    fontSans: get(OTHER_VARS.fontSans),
    lineXs: Math.ceil(numbers.fontXs * numbers.lineHeightTight),
    lineSm: Math.ceil(numbers.fontSm * numbers.lineHeightTight),
  };
}

/** Reads every token from `el` (the document root by default) with getComputedStyle. */
export function readTokens(el: Element = document.documentElement): Tokens {
  const style = getComputedStyle(el);
  const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  return tokensFrom((property) => style.getPropertyValue(property), Number.isFinite(root) ? root : 16);
}
