import type { Tokens } from "./tokens";

/** True when the visitor asked for less motion (design tokens, motion). */
function prefersReducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Options every chart shares: the font, and a short draw-in animation at
 * stage size only (thumbnails redraw as knobs move, so they never animate).
 */
export function baseOption(tokens: Tokens, stage: boolean) {
  return {
    animation: stage && !prefersReducedMotion(),
    animationDuration: 180,
    textStyle: { fontFamily: tokens.fontSans },
  };
}

/** Tooltip chrome shared by the stage charts. */
export function tooltipChrome(tokens: Tokens) {
  return {
    confine: true,
    backgroundColor: tokens.surface,
    borderColor: tokens.border,
    borderWidth: 1,
    padding: [8, 10],
    textStyle: { color: tokens.text, fontFamily: tokens.fontSans, fontSize: 12 },
  };
}
