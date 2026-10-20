import type { AllocationResult, Results } from "../contract";
import { fmtUsd } from "../shared/format";
import { chipLines, planBar } from "./c1Plan";
import type { PlannedSegment, Side } from "./c1Plan";
import { textWidth } from "./measure";
import type { Tokens } from "./tokens";

/**
 * Geometry of chart C1: where the bars are, and where each segment's label
 * goes (design-tokens 3e). Pure: a result, the tokens and the chart size in,
 * rectangles in canvas pixels out. The option builder draws from it, and the
 * render check measures the drawn svg against it.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A vertical leader line at `x` from y = `from` (the chip edge) to y = `to` (the bar edge). */
export interface Leader {
  x: number;
  from: number;
  to: number;
}

export type Placement =
  /** The chip sits inside its segment. */
  | { mode: "inside"; chip: Rect }
  /** The chip sits outside the bar, joined to its segment by a leader line. */
  | {
      mode: "outside";
      chip: Rect;
      position: "top" | "bottom";
      /** Horizontal shift in pixels that keeps the chip on the canvas. */
      dx: number;
      /** Distance in pixels the chip is raised above (or lowered below) the nearest tier. */
      lift: number;
      leader: Leader;
    }
  /** No chip is drawn; the segment is named in the label list under the chart. */
  | { mode: "list"; tooSmall: boolean };

export interface BarLayout {
  side: Side;
  row: 0 | 1;
  segs: PlannedSegment[];
  /** The bar's rectangle (the whole plot width is the axis, the bar ends at its total). */
  bar: Rect;
  /** Left edge and width of each segment, in canvas pixels. */
  left: number[];
  width: number[];
  placements: Placement[];
  total: number;
}

export interface Layout {
  narrow: boolean;
  grid: { left: number; right: number; top: number; bottom: number };
  plotWidth: number;
  plotHeight: number;
  axisMax: number;
  today: BarLayout;
  infravana: BarLayout;
  budget: { x: number; align: "left" | "center" | "right"; rect: Rect; text: string };
}

/** Share of a category's height the bar fills (the series `barWidth`). */
export const BAR_SHARE = 0.46;
/** Grid of the wide layout (design-tokens 3e). The narrow layout takes its side margins from `--space-2`. */
const GRID_WIDE = { left: 124, right: 28, top: 60, bottom: 40 };
const GRID_NARROW_BOTTOM = 40;
/** The gap ECharts leaves between a budget label and the top of the plot. */
export const BUDGET_LABEL_DISTANCE = 5;

/** Chip size in pixels: its widest line plus padding, and its lines times the line height. */
export function chipSize(seg: PlannedSegment, t: Tokens): { w: number; h: number } {
  const [padV, padH] = t.chipPadding;
  const lines = chipLines(seg);
  const widest = Math.max(...lines.map((l) => textWidth(l, t.fontXs, t.weightRegular, t.fontSans)));
  return { w: widest + 2 * padH, h: lines.length * t.lineXs + 2 * padV };
}

function overlaps(a: Rect, b: Rect, gap: number): boolean {
  return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
}

const leaderRect = (l: Leader): Rect => ({ x: l.x - 0.5, y: Math.min(l.from, l.to), w: 1, h: Math.abs(l.to - l.from) });

export function layoutAllocation(results: Results, t: Tokens, dims: { width: number; height: number }): Layout {
  const a: AllocationResult = results.allocation;
  const narrow = dims.width < t.narrowWidth;
  const sides: [Side, PlannedSegment[]][] = [
    ["today", planBar(a.today, "today")],
    ["infravana", planBar(a.infravana, "infravana")],
  ];
  const totals = sides.map(([, segs]) => segs.reduce((sum, s) => sum + s.usd, 0));
  const axisMax = Math.max(...totals, a.budget_usd) * 1.04;

  // ECharts shrinks the plot when a tick label of the x axis would run past the canvas, which would move
  // every segment. So the side margins of the narrow layout are never less than half the widest tick
  // label (the axis maximum bounds every tick label), and the layout keeps to the 8px of design-tokens 3e
  // wherever that is enough.
  const halfLabel = (text: string) => Math.ceil(textWidth(text, t.fontXs, t.weightRegular, t.fontSans) / 2);
  const grid = narrow
    ? {
        left: Math.max(t.space2, halfLabel(fmtUsd(0))),
        right: Math.max(t.space2, halfLabel(fmtUsd(axisMax))),
        // Room above the plot for the budget label.
        top: BUDGET_LABEL_DISTANCE + t.lineXs + t.space1,
        bottom: GRID_NARROW_BOTTOM,
      }
    : GRID_WIDE;
  const plotWidth = Math.max(0, dims.width - grid.left - grid.right);
  const plotHeight = Math.max(0, dims.height - grid.top - grid.bottom);
  const band = plotHeight / 2;
  const half = (band * BAR_SHARE) / 2;

  // The budget label ECharts draws above the line (centred, or turned to stay on the canvas).
  const budgetText = `Budget ${fmtUsd(a.budget_usd)}`;
  const budgetW = textWidth(budgetText, t.fontXs, t.weightBold, t.fontSans);
  const bx = grid.left + (plotWidth * a.budget_usd) / axisMax;
  const align = bx + budgetW / 2 > dims.width ? "right" : bx - budgetW / 2 < 0 ? "left" : "center";
  const budgetRect: Rect = {
    x: align === "center" ? bx - budgetW / 2 : align === "right" ? bx - budgetW : bx,
    y: grid.top - BUDGET_LABEL_DISTANCE - t.lineXs,
    w: budgetW,
    h: t.lineXs,
  };

  const bars: BarLayout[] = sides.map(([side, segs], i) => {
    const row = i as 0 | 1;
    const centre = grid.top + band * (row + 0.5);
    const left: number[] = [];
    const width: number[] = [];
    let start = 0;
    for (const seg of segs) {
      left.push(grid.left + start);
      const w = (plotWidth * seg.usd) / axisMax;
      width.push(w);
      start += w;
    }
    return {
      side,
      row,
      segs,
      bar: { x: grid.left, y: centre - half, w: (plotWidth * totals[i]) / axisMax, h: half * 2 },
      left,
      width,
      placements: [],
      total: totals[i],
    };
  });

  // Obstacles every outside chip must avoid: both bars, the budget label, and chips and leaders already placed.
  const obstacles: Rect[] = [bars[0].bar, bars[1].bar, budgetRect];
  const leaders: Rect[] = [];
  const canvas: Rect = { x: 0, y: 0, w: dims.width, h: dims.height };

  for (const bar of bars) {
    const tierStep = Math.max(...bar.segs.map((s) => chipSize(s, t).h)) + t.space1;
    bar.segs.forEach((seg, i) => {
      const chipBox = chipSize(seg, t);
      const w = bar.width[i];
      const mid = bar.left[i] + w / 2;
      // 1. Inside, if the chip fits the segment (less 4px) and the bar's height.
      if (chipBox.w <= w - t.space1 && chipBox.h <= bar.bar.h) {
        const chip = { x: mid - chipBox.w / 2, y: bar.bar.y + (bar.bar.h - chipBox.h) / 2, w: chipBox.w, h: chipBox.h };
        obstacles.push(chip);
        bar.placements.push({ mode: "inside", chip });
        return;
      }
      // 2. Too narrow to see: the label list names it.
      if (w < t.minSegmentWidth) {
        bar.placements.push({ mode: "list", tooSmall: true });
        return;
      }
      // 3. Wide layout only: outside the bar with a leader, in the first free tier.
      if (!narrow) {
        const position = bar.side === "infravana" && seg.kind === "savings" ? "bottom" : "top";
        const tiers = position === "bottom" ? 1 : Math.max(1, Math.round(t.labelTiers));
        for (let tier = 0; tier < tiers; tier++) {
          const lift = tier * tierStep;
          const x0 = Math.min(Math.max(mid - chipBox.w / 2, 0), Math.max(0, dims.width - chipBox.w));
          const y =
            position === "top"
              ? bar.bar.y - t.space2 - lift - chipBox.h
              : bar.bar.y + bar.bar.h + t.space2 + lift;
          const chip: Rect = { x: x0, y, w: chipBox.w, h: chipBox.h };
          const leader: Leader =
            position === "top"
              ? { x: mid, from: y + chipBox.h, to: bar.bar.y }
              : { x: mid, from: y, to: bar.bar.y + bar.bar.h };
          const inside = chip.x >= canvas.x && chip.y >= canvas.y && chip.x + chip.w <= canvas.w && chip.y + chip.h <= canvas.h;
          const free =
            !obstacles.some((o) => o !== bar.bar && overlaps(chip, o, t.space1)) &&
            !leaders.some((l) => overlaps(chip, l, 0)) &&
            !obstacles.some((o) => o !== bars[0].bar && o !== bars[1].bar && overlaps(leaderRect(leader), o, 0));
          if (inside && free) {
            obstacles.push(chip);
            leaders.push(leaderRect(leader));
            bar.placements.push({ mode: "outside", chip, position, dx: x0 - (mid - chipBox.w / 2), lift, leader });
            return;
          }
        }
      }
      // 4. Anything else: the label list.
      bar.placements.push({ mode: "list", tooSmall: false });
    });
  }

  return {
    narrow,
    grid,
    plotWidth,
    plotHeight,
    axisMax,
    today: bars[0],
    infravana: bars[1],
    budget: { x: bx, align, rect: budgetRect, text: budgetText },
  };
}
