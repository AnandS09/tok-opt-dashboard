import type { BarSeriesOption } from "echarts/charts";

type DecalObject = Exclude<
  NonNullable<NonNullable<BarSeriesOption["itemStyle"]>["decal"]>,
  "none"
>;

/**
 * Fill patterns (ECharts decals) that stand in for colour where the design
 * tokens ask for a second cue: hatch, dots, cross-hatch. Each takes the colour
 * the pattern is drawn in, already read from the tokens.
 */

/** Diagonal hatch. */
export function hatch(color: string): DecalObject {
  return {
    symbol: "rect",
    symbolSize: 1,
    color,
    dashArrayX: [[1, 0]],
    dashArrayY: [2, 5],
    rotation: -Math.PI / 4,
  };
}

/** Dots on a staggered grid. */
export function dots(color: string): DecalObject {
  return {
    symbol: "circle",
    symbolSize: 0.7,
    color,
    dashArrayX: [
      [8, 8],
      [0, 8, 8, 0],
    ],
    dashArrayY: [6, 0],
    rotation: 0,
  };
}

/** Cross-hatch: a diagonal grid of fine lines. */
export function crossHatch(color: string): DecalObject {
  return {
    symbol: "rect",
    symbolSize: 1,
    color,
    dashArrayX: [
      [1, 0],
      [1, 7],
    ],
    dashArrayY: [1, 0, 6, 0],
    rotation: Math.PI / 4,
  };
}
