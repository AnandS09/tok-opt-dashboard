import type { Tokens } from "./tokens";

/**
 * Options every chart shares: the font, and a short draw-in animation at
 * stage size only (thumbnails redraw as knobs move, so they never animate).
 * The duration is the `--duration-fade` token, which the stylesheet sets to
 * zero for visitors who asked for less motion.
 */
export function baseOption(t: Tokens, stage: boolean) {
  return {
    animation: stage && t.durationFade > 0,
    animationDuration: t.durationFade,
    textStyle: { fontFamily: t.fontSans },
  };
}

/** Tooltip chrome shared by the stage charts. */
export function tooltipChrome(t: Tokens) {
  return {
    confine: true,
    // White on the paper, with a border that reads as an edge. ECharts adds a
    // shadow and a 4px radius of its own, so both are reset here (spec 14.3).
    backgroundColor: t.surfaceRaised,
    borderColor: t.borderStrong,
    borderWidth: 1,
    extraCssText: "box-shadow: none; border-radius: var(--radius-sm);",
    padding: [t.space2, t.space3],
    textStyle: { color: t.text, fontFamily: t.fontSans, fontSize: t.fontXs },
  };
}
