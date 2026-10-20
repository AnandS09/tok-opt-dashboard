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
    backgroundColor: t.surface,
    borderColor: t.border,
    borderWidth: 1,
    padding: [t.space2, t.space3],
    textStyle: { color: t.text, fontFamily: t.fontSans, fontSize: t.fontXs },
  };
}
