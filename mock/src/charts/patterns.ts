import type { ColourKey } from "./tokens";

/**
 * What a Today option looks like in every chart (spec 6.1, 15.11). Marks are
 * solid fills told apart by hue and lightness and by direct labels; nothing is
 * hatched, outlined or dashed anywhere (spec 14.4). The palette has four
 * Today colours (spec 14.1): the comparator takes the darkest, `today1`
 * (wine), and the other options take `today2` to `today4` (brick, sienna,
 * ochre) in rank order. An option keeps its colour in every chart: the bars of
 * C1, C3 and C5 and the lines and markers of C10.
 */

/** What one option rank (1 to 3) looks like in every chart. */
export interface OptionStyle {
  fill: ColourKey;
  /** The ECharts symbol of its end marker in C10. */
  marker: "circle" | "rect" | "triangle";
}

/** Option ranks 1 to 3 in order. A rank beyond the table has no colour of its own and is not drawn. */
export const OPTION_STYLES: OptionStyle[] = [
  { fill: "today2", marker: "circle" },
  { fill: "today3", marker: "rect" },
  { fill: "today4", marker: "triangle" },
];

/**
 * At most three options besides the comparator: four Today bars in all, the
 * cap of spec 6.1, which is as many as the palette has colours for (spec 12.5,
 * open item 3). The engine already holds the grey set to four including the
 * comparator, so this only makes the chart code enforce the same limit.
 */
export const MAX_OPTIONS = OPTION_STYLES.length;

export function optionStyle(rank: number): OptionStyle {
  const style = OPTION_STYLES[rank - 1];
  if (style === undefined) throw new Error(`Option rank ${rank} has no colour: the palette holds ${MAX_OPTIONS} option colours`);
  return style;
}
