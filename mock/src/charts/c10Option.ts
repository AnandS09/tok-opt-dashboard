/**
 * The ECharts option of C10 (spec 6.3, design-tokens 3.2 "C10"): the
 * InfraVana frontier as a step line in the accent, every grey Today option as
 * a solid reference line in its rank's grey that ends in its rank's marker (or,
 * in the speed view, as a marker at its own speed), and a ring at the visitor's
 * own setting. Pure: it reads `C10Data` and `Results`, never the page.
 */
import { LineChart, ScatterChart } from "echarts/charts";
import type { LineSeriesOption, ScatterSeriesOption } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import { fmtTokens, fmtTokensSig } from "../shared/format";
import { baseOption, tooltipChrome } from "./base";
import type { C10Data, TodayMark } from "./c10Data";
import { qualityLine } from "./comparison";
import { esc, fmtBudget } from "./format";
import { INFRAVANA_LABEL, TODAY_LABEL } from "./labels";
import { textWidth } from "./measure";
import { optionStyle } from "./patterns";
import { PROVENANCE_TEXT, dashOf } from "./provenanceStyle";
import type { Tokens } from "./tokens";
import type { Dims } from "./useEChart";
import { wrapText } from "./wrap";

use([LineChart, ScatterChart, GridComponent, TooltipComponent]);

/** Size in pixels of a Today marker, of a point on the frontier and of the ring at the visitor's setting. */
export const MARKER_SIZE = 10;
/** The comparator's marker: a thin vertical tick, a shape no option uses, echoing its bar in C1, C3 and C5. */
export const TICK_SIZE: [number, number] = [4, 14];
export const POINT_SIZE = 8;
export const RING_SIZE = 14;

/** Below this chart width the end labels give way to the key. */
export const NARROW = 600;

export const CURRENT_LABEL = "Your setting";

/** Axis titles, in plain words; higher is stricter on both axes. */
export const AXIS_TITLE = {
  quality: "Quality floor you accept (composite score; higher is stricter)",
  speed: "Speed you need (tokens a second per user; higher is stricter)",
} as const;

/** A data item with the text its tooltip shows. */
interface Tipped {
  value: number[];
  tip: string;
  [key: string]: unknown;
}

/** Marker shape of a Today mark: a thin tick (a `rect` of `TICK_SIZE`) for the comparator, the rank's shape for an option. */
export function markerOf(mark: TodayMark): "circle" | "rect" | "triangle" | "diamond" {
  return mark.rank === null ? "rect" : optionStyle(mark.rank).marker;
}

/** Size of a Today mark's marker: the tick for the comparator, `MARKER_SIZE` for an option. */
export function markerSizeOf(mark: TodayMark): number | [number, number] {
  return mark.rank === null ? TICK_SIZE : MARKER_SIZE;
}

/** Width in pixels of a Today mark's marker. */
function markerWidthOf(mark: TodayMark): number {
  const size = markerSizeOf(mark);
  return typeof size === "number" ? size : size[0];
}

/** Grey of a Today mark: the first grey for the comparator, the rank's grey for an option. */
export function greyOf(mark: TodayMark, t: Tokens): string {
  return mark.rank === null ? t.today1 : t[optionStyle(mark.rank).fill];
}

/** A Today mark's name as the chart writes it: the comparator is named as the Today it is measured against. */
export function markName(mark: TodayMark): string {
  return mark.rank === null ? `${TODAY_LABEL}: ${mark.alt.label}` : mark.alt.label;
}

/** The marks drawn as horizontal reference lines: all of them in the quality view, those without a speed in the speed view. */
export function lineMarks(data: C10Data): TodayMark[] {
  return data.view === "quality" ? data.today : data.today.filter((m) => m.speed === null);
}

/** The marks drawn as points at their own speed (speed view only). */
export function pointMarks(data: C10Data): TodayMark[] {
  return data.view === "speed" ? data.today.filter((m) => m.speed !== null) : [];
}

/** Round a ceiling up to 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8 or 10 times a power of ten. */
export function niceCeil(v: number): number {
  if (!(v > 0)) return 1;
  const m = 10 ** Math.floor(Math.log10(v));
  for (const k of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (k * m >= v * (1 - 1e-12)) return k * m;
  return 10 * m;
}

/** The x range: the data with a small margin, on whole numbers. */
export function xRange(data: C10Data): { min: number; max: number } {
  const xs = [
    ...data.frontier.points.map((p) => p.threshold),
    data.frontier.current_threshold,
    ...data.today.flatMap((m) => (m.speed === null ? [] : [m.speed])),
  ];
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  const pad = Math.max(1, (hi - lo) * 0.05);
  return { min: Math.floor(lo - pad), max: Math.ceil(hi + pad) };
}

/** The y ceiling: room above the highest figure drawn. */
export function yMax(data: C10Data): number {
  const ys = [...data.frontier.points.map((p) => p.infravana_tokens), ...data.today.map((m) => m.tokens)];
  return niceCeil(Math.max(...ys) * 1.08);
}

/**
 * Vertical offsets in pixels that keep labels of the given heights apart, each
 * as close to its own centre as the others allow, inside [0, limit].
 */
export function spreadLabels(centres: number[], heights: number[], gap: number, limit: number): number[] {
  const order = centres.map((_, i) => i).sort((a, b) => centres[a] - centres[b]);
  const placed = new Array<number>(centres.length).fill(0);
  let floor = 0;
  for (const i of order) {
    const top = Math.max(floor, centres[i] - heights[i] / 2);
    placed[i] = top + heights[i] / 2;
    floor = top + heights[i] + gap;
  }
  // If the last label runs past the bottom, pull the stack back up.
  let ceiling = limit;
  for (const i of [...order].reverse()) {
    const bottom = placed[i] + heights[i] / 2;
    if (bottom > ceiling) placed[i] -= bottom - ceiling;
    ceiling = placed[i] - heights[i] / 2 - gap;
  }
  return placed.map((p, i) => p - centres[i]);
}

/** Width of the column the end labels sit in. */
function labelColumn(width: number): number {
  return Math.round(Math.min(220, Math.max(140, width * 0.26)));
}

/** The tooltip of a Today mark. */
function todayTip(mark: TodayMark, data: C10Data): string {
  const lines = [
    `<strong>${esc(markName(mark))}</strong>`,
    `${fmtTokensSig(mark.tokens)} tokens a quarter for ${fmtBudget(data.budget_usd)}`,
    esc(qualityLine(mark.alt)),
  ];
  if (data.view === "speed") {
    lines.push(mark.speed === null ? "No speed data for this option" : `${Math.round(mark.speed)} tokens a second per user, the slowest offer it buys`);
  }
  lines.push(`Source: ${PROVENANCE_TEXT[data.view === "speed" && mark.speed !== null ? "modelled" : mark.alt.provenance].toLowerCase()}`);
  return lines.join("<br/>");
}

/** The end label of a reference line: its name, then what it buys. */
export function endLabelLines(mark: TodayMark, column: number, t: Tokens): { text: string; style: "v" | "sub" }[] {
  return [
    ...wrapText(markName(mark), column, t.fontSm, t.weightBold, t.fontSans).map((text) => ({ text, style: "v" as const })),
    { text: `${fmtTokensSig(mark.tokens)} tokens`, style: "sub" as const },
  ];
}

export function buildParetoOption(data: C10Data, size: "stage" | "thumb", t: Tokens, dims: Dims): EChartsCoreOption {
  const stage = size === "stage";
  const narrow = dims.width < NARROW;
  const x = xRange(data);
  const ymax = yMax(data);
  const column = labelColumn(dims.width);
  const labelled = stage && !narrow && data.view === "quality";
  const lines = lineMarks(data);

  const grid = stage
    ? { left: 56, right: labelled ? column + t.space3 + t.space2 : 24, top: 28, bottom: 56 }
    : { left: 4, right: 4, top: 6, bottom: 6 };
  const plotHeight = Math.max(1, dims.height - grid.top - grid.bottom);
  const pixelOf = (tokens: number) => plotHeight * (1 - tokens / ymax);

  // End labels of the reference lines, moved apart where the lines are close together.
  const labelLines = lines.map((m) => endLabelLines(m, column, t));
  const heights = labelLines.map((l) => l.reduce((h, line) => h + (line.style === "v" ? t.lineSm : t.lineXs), 0));
  const offsets = labelled
    ? spreadLabels(lines.map((m) => pixelOf(m.tokens)), heights, t.space1, plotHeight)
    : lines.map(() => 0);
  const rich = {
    v: { color: t.text, fontSize: t.fontSm, lineHeight: t.lineSm, fontWeight: t.weightBold },
    sub: { color: t.textSecondary, fontSize: t.fontXs, lineHeight: t.lineXs },
  };

  const series: (LineSeriesOption | ScatterSeriesOption)[] = [];
  const base = { silent: !stage, emphasis: { disabled: true }, clip: false };

  // The visitor's setting: a thin drop line to the ring, so its place on the axis can be read.
  if (data.current_tokens !== null) {
    const cx = data.frontier.current_threshold;
    series.push({
      ...base,
      type: "line",
      name: `${CURRENT_LABEL} (drop line)`,
      symbol: "none",
      z: 1,
      lineStyle: { color: t.borderStrong, width: t.separatorWidth, type: "solid" },
      data: [[cx, 0], [cx, ymax]],
    } as LineSeriesOption);
  }

  // Today as reference lines: solid, because a dash means provenance.
  lines.forEach((mark, i) => {
    const colour = greyOf(mark, t);
    const end: Tipped = {
      value: [x.max, mark.tokens],
      tip: todayTip(mark, data),
      symbol: markerOf(mark),
      symbolSize: markerSizeOf(mark),
      // Lines close in height would stack their markers at the right edge, so each stands a marker's width further in.
      symbolOffset: [-i * (MARKER_SIZE + 4), 0],
      itemStyle: { color: colour, borderColor: t.surface, borderWidth: t.savingsOutlineWidth, opacity: 1 },
      label: {
        show: labelled,
        position: "right",
        align: "left",
        distance: t.space2,
        // The label follows its marker, so it is moved back to the shared column.
        // A narrower marker (the comparator's tick) puts the label's start closer: add the difference back.
        offset: [i * (MARKER_SIZE + 4) + (MARKER_SIZE - markerWidthOf(mark)) / 2, offsets[i]],
        formatter: () => labelLines[i].map((l) => `{${l.style}|${l.text}}`).join("\n"),
        rich,
      },
    };
    series.push({
      ...base,
      type: "line",
      name: markName(mark),
      z: 2,
      lineStyle: { color: colour, width: t.todayLineWidth, type: "solid" },
      itemStyle: { color: colour },
      data: [{ value: [x.min, mark.tokens], symbol: "none" }, end],
    } as unknown as LineSeriesOption);
  });

  // Today as points at their own speed (speed view).
  for (const mark of pointMarks(data)) {
    const colour = greyOf(mark, t);
    series.push({
      ...base,
      type: "scatter",
      name: markName(mark),
      symbol: markerOf(mark),
      symbolSize: markerSizeOf(mark),
      symbolKeepAspect: true,
      z: 4,
      itemStyle: { color: colour, borderColor: t.surface, borderWidth: t.savingsOutlineWidth, opacity: 1 },
      data: [{ value: [mark.speed as number, mark.tokens], tip: todayTip(mark, data) }],
    } as unknown as ScatterSeriesOption);
  }

  // InfraVana: the step line of the non-dominated points. A step at the start of each run drops after a
  // point, so a point is the last setting at which the line is that high.
  const points = data.frontier.points;
  const dash = dashOf(data.provenance, t);
  // The line's name goes beside the first point, on the side where no Today line runs within the label's height:
  // below by default, above when a reference line runs just below the point; when both sides are crowded,
  // on the side with the larger gap to the nearest line.
  const labelHeight = t.lineSm + t.space1 + 2;
  const firstY = points.length > 0 ? pixelOf(points[0].infravana_tokens) : 0;
  const linesPx = lines.map((m) => pixelOf(m.tokens));
  const gapBelow = Math.min(plotHeight - firstY, ...linesPx.filter((y) => y >= firstY - 2).map((y) => y - firstY));
  const gapAbove = Math.min(firstY, ...linesPx.filter((y) => y < firstY - 2).map((y) => firstY - y));
  const infravanaLabelAbove = gapBelow < labelHeight + 2 && gapAbove > gapBelow;
  if (points.length > 0) {
    series.push({
      ...base,
      type: "line",
      name: INFRAVANA_LABEL,
      step: "start",
      symbol: "none",
      z: 3,
      lineStyle: { color: t.accentStrong, width: t.frontierLineWidth, type: dash ?? "solid" },
      data: [[x.min, points[0].infravana_tokens], ...points.map((p) => [p.threshold, p.infravana_tokens])],
    } as LineSeriesOption);
    series.push({
      ...base,
      type: "scatter",
      name: `${INFRAVANA_LABEL} (points)`,
      symbol: "circle",
      symbolSize: POINT_SIZE,
      z: 5,
      itemStyle: { color: t.accentStrong, borderColor: t.surface, borderWidth: t.separatorWidth, opacity: 1 },
      label: {
        show: stage,
        position: infravanaLabelAbove ? "top" : "bottom",
        distance: t.space1,
        align: "left",
        color: t.accentStrong,
        fontSize: t.fontSm,
        fontWeight: t.weightBold,
        // On the chart's ground, so a Today line behind the text does not strike it through.
        backgroundColor: t.surface,
        padding: [1, 3],
        formatter: (p: { dataIndex: number }) => (p.dataIndex === 0 ? INFRAVANA_LABEL : ""),
      },
      data: points.map((p) => ({
        value: [p.threshold, p.infravana_tokens],
        tip: [
          `<strong>${esc(INFRAVANA_LABEL)}</strong>`,
          `${fmtTokensSig(p.infravana_tokens)} tokens a quarter for ${fmtBudget(data.budget_usd)}`,
          `${data.view === "quality" ? "Quality floor" : "Speed"} ${Math.round(p.threshold)}${data.view === "quality" ? "" : " tokens a second per user"} or better`,
          `Source: ${PROVENANCE_TEXT[data.provenance].toLowerCase()}`,
        ].join("<br/>"),
      })),
    } as unknown as ScatterSeriesOption);
  }

  // The ring at the visitor's own setting, on the step line's height there.
  if (data.current_tokens !== null) {
    series.push({
      ...base,
      type: "scatter",
      name: CURRENT_LABEL,
      symbol: "circle",
      symbolSize: RING_SIZE,
      z: 6,
      itemStyle: { color: t.surface, borderColor: t.text, borderWidth: t.provenanceWidth, opacity: 1 },
      // The name sits at the top of the setting's rule, above the plot, not on a data line: the label is lifted
      // from the ring by the ring's own distance from the top of the plot.
      label: {
        show: stage,
        position: "top",
        distance: t.space1,
        offset: [0, -pixelOf(data.current_tokens)],
        color: t.text,
        fontSize: t.fontXs,
        fontWeight: t.weightBold,
        backgroundColor: t.surface,
        padding: [1, 3],
        formatter: () => CURRENT_LABEL,
      },
      data: [
        {
          value: [data.frontier.current_threshold, data.current_tokens],
          tip: [
            `<strong>${CURRENT_LABEL}</strong>`,
            `${data.view === "quality" ? "Quality floor" : "Speed"} ${Math.round(data.frontier.current_threshold)}${data.view === "quality" ? "" : " tokens a second per user"}`,
            `${fmtTokensSig(data.current_tokens)} tokens a quarter with ${INFRAVANA_LABEL}`,
          ].join("<br/>"),
        },
      ],
    } as unknown as ScatterSeriesOption);
  }

  return {
    ...baseOption(t, stage),
    grid,
    tooltip: stage
      ? {
          ...tooltipChrome(t),
          trigger: "item",
          formatter: (params: unknown) => {
            const d = (params as { data?: { tip?: string } }).data;
            return d?.tip ?? "";
          },
        }
      : undefined,
    xAxis: {
      type: "value",
      min: x.min,
      max: x.max,
      show: stage,
      name: stage ? AXIS_TITLE[data.view] : undefined,
      nameLocation: "middle",
      nameGap: 34,
      nameTextStyle: { color: t.textSecondary, fontSize: t.fontXs },
      axisLabel: { color: t.textSecondary, fontSize: t.fontXs, hideOverlap: true, formatter: (v: number) => String(Math.round(v)) },
      axisLine: { lineStyle: { color: t.borderStrong } },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: ymax,
      show: stage,
      axisLabel: { color: t.textSecondary, fontSize: t.fontXs, formatter: (v: number) => (v === 0 ? "0" : fmtTokens(v)) },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: t.grid } },
    },
    series,
  };
}

/** Width of the widest end label, for the checks. */
export function widestEndLabel(data: C10Data, t: Tokens, column: number): number {
  return Math.max(
    0,
    ...lineMarks(data).flatMap((m) =>
      endLabelLines(m, column, t).map((l) => textWidth(l.text, l.style === "v" ? t.fontSm : t.fontXs, t.weightBold, t.fontSans)),
    ),
  );
}
