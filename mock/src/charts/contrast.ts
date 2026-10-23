/**
 * WCAG 2.x contrast of two `#rrggbb` colours, for chart code and for the tests
 * that gate the palette (spec 14.5: text 4.5:1, marks and borders 3:1, computed
 * from the real token values, never eyeballed).
 */

/** Relative luminance of a `#rrggbb` colour (WCAG 2.x). */
export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Not a #rrggbb colour: "${hex}"`);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = Number.parseInt((m[1] as string).slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio of two colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Text on any fill needs this ratio; marks and borders on the ground need 3 (spec 14.5). */
export const TEXT_CONTRAST = 4.5;
export const MARK_CONTRAST = 3;

/**
 * The colour of a label drawn on `fill`: the paper where paper reaches 4.5:1
 * on that fill, otherwise the ink (palette README 2.6). When neither does, the
 * one with the higher ratio.
 */
export function labelColourOn(fill: string, paper: string, ink: string): string {
  if (contrastRatio(fill, paper) >= TEXT_CONTRAST) return paper;
  return contrastRatio(fill, ink) > contrastRatio(fill, paper) ? ink : paper;
}
