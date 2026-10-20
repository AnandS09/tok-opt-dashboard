/**
 * Design tokens for chart code. ECharts draws to canvas, which cannot resolve
 * `var()`, so colours are read from the CSS custom properties at draw time
 * with getComputedStyle. The tokens stay the single source (design-tokens.md,
 * section 6); no colour value is written in chart code.
 */

export interface Tokens {
  surface: string;
  separator: string;
  text: string;
  textSecondary: string;
  border: string;
  borderStrong: string;
  grid: string;
  accent: string;
  accentStrong: string;
  today1: string;
  today2: string;
  today3: string;
  today4: string;
  fontSans: string;
}

/** Custom property behind each token. */
const TOKEN_VARS: Record<keyof Tokens, string> = {
  surface: "--color-surface",
  separator: "--color-series-separator",
  text: "--color-text",
  textSecondary: "--color-text-secondary",
  border: "--color-border",
  borderStrong: "--color-border-strong",
  grid: "--color-grid",
  accent: "--color-accent",
  accentStrong: "--color-accent-strong",
  today1: "--color-today-1",
  today2: "--color-today-2",
  today3: "--color-today-3",
  today4: "--color-today-4",
  fontSans: "--font-sans",
};

/**
 * Reads every token from `el` (the document root by default). Throws when a
 * token is undefined, so a missing stylesheet is reported rather than drawn
 * as ECharts' default colours.
 */
export function readTokens(el: Element = document.documentElement): Tokens {
  const style = getComputedStyle(el);
  const out = {} as Tokens;
  const missing: string[] = [];
  for (const key of Object.keys(TOKEN_VARS) as (keyof Tokens)[]) {
    const value = style.getPropertyValue(TOKEN_VARS[key]).trim();
    if (value === "") missing.push(TOKEN_VARS[key]);
    out[key] = value;
  }
  if (missing.length > 0) {
    throw new Error(`Design tokens not defined: ${missing.join(", ")}`);
  }
  return out;
}
