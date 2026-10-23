import { useCallback } from "react";
import { BarChart, CustomChart } from "echarts/charts";
import type { BarSeriesOption, CustomSeriesOption } from "echarts/charts";
import { GridComponent, MarkLineComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import type {
  AllocationResult,
  ChartDef,
  ChartProps,
  Results,
  SavingsSegment,
} from "../contract";
import { fmtPct, fmtUsd, fmtUsdFull, fmtUsdSig } from "../shared/format";
import { baseOption, tooltipChrome } from "./base";
import { allocationBenefits } from "./benefits";
import { foldSlivers, isSavings, planBar } from "./c1Plan";
import type { PlannedSegment } from "./c1Plan";
import { ChartFigure } from "./ChartFigure";
import { BELOW_FLOOR, barRowsHeight, comparisonOf, qualityText } from "./comparison";
import type { Comparison, OptionBar } from "./comparison";
import { labelColourOn } from "./contrast";
import { esc, fmtBudget, toCsvText } from "./format";
import { BRAND, INFRAVANA_LABEL, TODAY_LABEL } from "./labels";
import { textWidth } from "./measure";
import { optionStyle } from "./patterns";
import type { ProvenancePart } from "./ProvenanceNotes";
import { comparatorBar, infravanaParts, optionParts, todayParts } from "./sourceParts";
import type { Tokens } from "./tokens";
import type { Dims } from "./useEChart";
import { wrapText } from "./wrap";

use([BarChart, CustomChart, GridComponent, MarkLineComponent, TooltipComponent]);

/** A bar's share of its row in a thumbnail, which is too small for a bar of fixed thickness. */
const THUMB_BAR_SHARE = 0.58;

/** The name of the series that draws the paper gaps between neighbouring segments. */
export const GAP_SERIES = "Segment gaps";

/** The plot's top and bottom margins in the stage grid (the budget label above, the axis labels below). */
const C1_PHONE_MARGINS = 36 + 28;

export { planBar } from "./c1Plan";
export type { PlannedSegment } from "./c1Plan";

// ---------------------------------------------------------------------------
// Rows and pieces: what is drawn (spec 6.1, design-tokens 3.2)
// ---------------------------------------------------------------------------

/** Chart width under which segment names are left to the tooltip and the table (design-tokens 3.6). */
export const NARROW_WIDTH = 600;

/** The bars, top to bottom: the comparator, InfraVana, then each other grey option by rank. */
interface Row {
  key: string;
  kind: "comparator" | "infravana" | "option";
  option: OptionBar | null;
}

function rowsOf(cmp: Comparison): Row[] {
  return [
    { key: "comparator", kind: "comparator", option: null },
    { key: "infravana", kind: "infravana", option: null },
    ...cmp.options.map((o) => ({ key: o.alt.pattern_id, kind: "option" as const, option: o })),
  ];
}

/** The name of the one saving block (spec 15.11): "Saved", with its figure. */
export const SAVED_LABEL = "Saved";

/** One drawn block: a channel segment, the one saving block or a whole option bar. */
interface Piece {
  row: number;
  label: string;
  usd: number;
  fill: string;
  textColor: string;
  /** True for the saving block, which is money not spent. */
  saved: boolean;
  seg: PlannedSegment | null;
  option: OptionBar | null;
  /** The tooltip sentence of the saving block, which names its two sources. */
  note?: string;
}

/** The paper label on a fill where paper reaches 4.5:1, else the ink (spec 15.11). */
function labelOn(fill: string, t: Tokens): string {
  return labelColourOn(fill, t.labelPaper, t.text);
}

/**
 * The blocks, in drawing order. Every segment of the comparator takes
 * `today1` and every InfraVana spend segment takes `accent`: segments of one
 * bar are told apart by their direct labels and the paper gap between them,
 * and no fill of a comparator segment appears on an option bar (spec 6.1
 * acceptance 6). The InfraVana bar ends in one saving block, whatever the
 * number of sources behind it (spec 15.11).
 */
function piecesOf(results: Results, cmp: Comparison, t: Tokens, pxPerUsd: number): Piece[] {
  const a = results.allocation;
  const pieces: Piece[] = [];
  for (const seg of foldSlivers(planBar(a.today, "today"), pxPerUsd, MIN_BLOCK_PX)) {
    pieces.push({ row: 0, label: seg.label, usd: seg.usd, fill: t.today1, textColor: labelOn(t.today1, t), saved: false, seg, option: null });
  }
  const planned = foldSlivers(planBar(a.infravana, "infravana"), pxPerUsd, MIN_BLOCK_PX);
  for (const seg of planned.filter((s) => s.tone === "spend")) {
    pieces.push({ row: 1, label: seg.label, usd: seg.usd, fill: t.accent, textColor: labelOn(t.accent, t), saved: false, seg, option: null });
  }
  const savings = planned.filter((s) => s.tone !== "spend" && s.usd > 0);
  if (savings.length > 0) {
    const parts = savings.map(
      (s) => `${fmtUsdSig(s.usd)} ${s.tone === "arbitrage" ? "from better prices for the same models" : "from moving work to cheaper models and hardware"}`,
    );
    pieces.push({
      row: 1,
      label: SAVED_LABEL,
      usd: savings.reduce((sum, s) => sum + s.usd, 0),
      fill: t.saved,
      textColor: labelOn(t.saved, t),
      saved: true,
      seg: savings[0] ?? null,
      option: null,
      note: `Not spent: ${parts.join(" and ")}.`,
    });
  }
  cmp.options.forEach((o, i) => {
    pieces.push({
      row: 2 + i,
      label: o.alt.label,
      usd: o.alt.total_usd,
      fill: t[optionStyle(o.rank).fill],
      textColor: labelOn(t[optionStyle(o.rank).fill], t),
      saved: false,
      seg: null,
      option: o,
    });
  });
  return pieces;
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

function explain(p: Piece): string {
  if (p.note) return p.note;
  if (p.option) return "Another way to buy the same work today, shown for comparison.";
  const seg = p.seg;
  if (!seg) return "";
  if (seg.kind === "other") return `Combined: ${seg.members.join(", ")}.`;
  const base = seg.kind === "hardware" ? "Spent on hardware you run yourself." : "Spent with this provider or plan.";
  // A segment too narrow to draw as a block of its own is part of this one; its name is kept here.
  return seg.members.length > 0 ? `${base} Includes ${seg.members.join(", ")}.` : base;
}

const GRID_THUMB = { left: 4, right: 4, top: 6, bottom: 6 };

/** Smallest of 1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8 x 10^n at or above `x`, so the axis ends on a round number. */
function niceCeil(x: number): number {
  if (x <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(x));
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((m) => m * p >= x) ?? 10;
  return step * p;
}

/** Left margin of the plot, which holds the row names. */
function labelColumn(width: number): number {
  const narrow = width < NARROW_WIDTH;
  return Math.round(Math.min(narrow ? 128 : 220, Math.max(narrow ? 96 : 150, width * (narrow ? 0.34 : 0.26))));
}

/** The parts of an option bar's end label: quality, cost and the floor mark. */
function optionLabelParts(o: OptionBar): { quality: string; cost: string; mark: string } {
  return {
    quality: qualityText(o.alt),
    cost: fmtUsd(o.alt.total_usd),
    mark: o.alt.meets_floors ? "" : " · below floor",
  };
}

/** The end label of an option bar as plain text, for measuring and for the check. */
export function optionLabelText(o: OptionBar): string {
  const p = optionLabelParts(o);
  return `${p.quality} · ${p.cost}${p.mark}`;
}

/** A block drawn narrower than this many pixels is folded into its neighbour: a sliver reads as a rendering fault. */
export const MIN_BLOCK_PX = 8;

/** Where the plot sits and how far a dollar goes in it, at one size. Shared by the drawing and by its check. */
function plotScale(results: Results, size: "stage" | "thumb", t: Tokens, dims: Dims) {
  const stage = size === "stage";
  const cmp = comparisonOf(results);
  const narrow = dims.width < NARROW_WIDTH;
  const extent = Math.max(results.allocation.total_usd, results.allocation.budget_usd, ...cmp.options.map((o) => o.alt.total_usd));
  const axisMax = niceCeil(extent);
  // On a phone the row name goes above its bar and the bar takes the full width (spec 15.11).
  const above = stage && narrow;
  const left = above ? t.space2 : stage ? labelColumn(dims.width) + t.space3 : GRID_THUMB.left;
  // Option labels sit right of their bar, or right of the budget line when the line is in the way, so the
  // margin holds the longest of them: a label never moves between rows.
  const optionLabelPx = narrow ? 0 : Math.max(0, ...cmp.options.map((o) => textWidth(optionLabelText(o), t.fontXs, t.weightBold, t.fontSans)));
  const right = stage ? 24 + (optionLabelPx > 0 ? Math.ceil(optionLabelPx) + t.space2 : 0) : GRID_THUMB.right;
  const plotWidth = Math.max(0, dims.width - left - right);
  return { stage, narrow, above, axisMax, left, right, pxPer: plotWidth / axisMax };
}

/** The segments of the comparator's bar and of InfraVana's as drawn at this size: slivers folded into a neighbour. */
export function drawnBars(results: Results, size: "stage" | "thumb", t: Tokens, dims: Dims): { today: PlannedSegment[]; infravana: PlannedSegment[] } {
  const { pxPer } = plotScale(results, size, t, dims);
  const a = results.allocation;
  return {
    today: foldSlivers(planBar(a.today, "today"), pxPer, MIN_BLOCK_PX),
    infravana: foldSlivers(planBar(a.infravana, "infravana"), pxPer, MIN_BLOCK_PX),
  };
}

/** The ECharts option for C1. Pure: tokens and pixel size in, option out. */
export function buildAllocationOption(
  results: Results,
  size: "stage" | "thumb",
  t: Tokens,
  dims: Dims,
): EChartsCoreOption {
  const a: AllocationResult = results.allocation;
  const cmp = comparisonOf(results);
  const rows = rowsOf(cmp);
  const { stage, narrow, above, axisMax, left, right, pxPer } = plotScale(results, size, t, dims);
  const pieces = piecesOf(results, cmp, t, pxPer);
  const saved = pieces.filter((p) => p.saved).reduce((sum, p) => sum + p.usd, 0);
  const spent = a.total_usd - saved;
  const grid = stage ? { left, right, top: 36, bottom: 28 } : GRID_THUMB;

  /** The longest label that fits inside a piece, on its chip: "Name $X", then "$X", then none. */
  const fit = (p: Piece): string => {
    if (narrow) return "";
    const room = p.usd * pxPer - 2 * t.space1;
    const money = fmtUsdSig(p.usd);
    const tries = [`${p.label} ${money}`, `${p.label.replace(/^Saved: /, "")} ${money}`, money];
    return tries.find((text) => textWidth(text, t.fontXs, t.weightBold, t.fontSans) <= room) ?? "";
  };

  /** How far right of its bar's end a label must start to clear the budget line, in pixels (0 when the line is not in the way). */
  const pastBudgetLine = (end: number, text: string): number => {
    const start = end * pxPer;
    const stop = start + t.space2 + textWidth(text, t.fontXs, t.weightBold, t.fontSans);
    const budgetX = a.budget_usd * pxPer;
    return budgetX >= start && budgetX <= stop + t.space2 ? budgetX + t.space2 - start : 0;
  };

  const budgetText = `Budget ${fmtBudget(a.budget_usd)}`;
  const budgetHalf = textWidth(budgetText, t.fontXs, t.weightRegular, t.fontSans) / 2;
  const budgetClips = left + a.budget_usd * pxPer + budgetHalf > dims.width - t.space1;
  // With the row names above the bars the plot starts at the left edge, so a small budget puts the line there.
  const budgetClipsLeft = left + a.budget_usd * pxPer - budgetHalf < t.space1;

  const series: BarSeriesOption[] = pieces.map((p, index) => {
    const item: BarSeriesOption = {
      type: "bar",
      name: p.label,
      stack: "total",
      // A bar of fixed weight at stage size, so five rows read as lines with air between them, not a wall (spec 15.11).
      barWidth: stage ? t.barThickness : `${THUMB_BAR_SHARE * 100}%`,
      silent: !stage,
      emphasis: { disabled: true },
      data: rows.map((_, r) =>
        r === p.row
          ? {
              value: p.usd,
              // No outline: the gap between neighbours is painted over the bars below (spec 15.11).
              itemStyle: { color: p.fill },
            }
          : null,
      ),
    };
    if (stage && p.option) {
      // An option bar is one block: its quality and cost sit right of it, beside the bar rather than in a legend.
      // Right of the bar; when the budget line is in the way it starts right of the line, still in its own row.
      const parts = optionLabelParts(p.option);
      item.label = {
        // On a narrow chart the cost and quality go under the row name instead, where there is room for both.
        show: !narrow,
        position: "right",
        offset: [pastBudgetLine(p.usd, optionLabelText(p.option)), 0],
        // The quality is in secondary ink, the cost bold (spec 15.11).
        formatter: `{q|${parts.quality} \u00b7 }{v|${parts.cost}}{q|${parts.mark}}`,
        rich: {
          q: { color: t.textSecondary, fontSize: t.fontXs, fontWeight: t.weightRegular },
          v: { color: t.text, fontSize: t.fontXs, fontWeight: t.weightBold },
        },
        backgroundColor: t.surface,
      };
    } else {
      // A solid fill needs no chip: the label sits straight on it, in the colour that reads on that fill.
      const text = stage ? fit(p) : "";
      item.label = {
        show: text !== "",
        position: "inside",
        formatter: text,
        color: p.textColor,
        fontSize: t.fontXs,
        fontWeight: t.weightBold,
      };
    }
    if (index === 0 && stage) {
      item.markLine = {
        silent: true,
        // Under the bars (series z 2): the line shows between them and never crosses a label or a fill.
        z: 1,
        symbol: "none",
        animation: false,
        data: [
          {
            xAxis: a.budget_usd,
            lineStyle: { color: t.budgetLine, width: t.budgetLineWidth, type: "solid" },
            label: {
              show: true,
              position: "start",
              // Centred on the line, but ending at it when centring would run past the right edge of the chart, and starting at it past the left edge.
              align: budgetClips ? "right" : budgetClipsLeft ? "left" : "center",
              formatter: budgetText,
              color: t.textSecondary,
              fontSize: t.fontXs,
            },
          },
        ],
      };
    }
    return item;
  });

  /** Row names: bold for the two bars that are compared, plain for the other options, a cost line under the first two. */
  const columnPx = labelColumn(dims.width);
  const rowLabel = (index: number): string => {
    const row = rows[index];
    if (!row) return "";
    const wrap = (text: string, weight: number) => wrapText(text, columnPx, t.fontSm, weight, t.fontSans);
    const subLines = (text: string) =>
      wrapText(text, columnPx, t.fontXs, t.weightRegular, t.fontSans).map((l) => `{sub|${l}}`);
    if (row.kind === "infravana") {
      // The saving is named on the row, in the saving colour, whatever the width of its block (spec 15.11).
      const cost = `${fmtUsdSig(spent)} cost`;
      return saved > 0 ? `{inf|${INFRAVANA_LABEL}}\n{sub|${cost} \u00b7 }{sav|${fmtUsdSig(saved)} saved}` : `{inf|${INFRAVANA_LABEL}}\n{sub|${cost}}`;
    }
    if (row.kind === "comparator") {
      const mark = cmp.comparator && !cmp.comparator.meets_floors ? ", below floor" : "";
      const quality = cmp.comparator ? ` · ${qualityText(cmp.comparator)}${mark}` : "";
      const lines = wrap(`${TODAY_LABEL}: ${cmp.label}`, t.weightBold).map((l) => `{today|${l}}`);
      return [...lines, ...subLines(`${fmtUsdSig(a.total_usd)} cost${quality}`)].join("\n");
    }
    const name = wrap(row.option?.alt.label ?? "", t.weightBold).map((l) => `{opt|${l}}`);
    if (narrow && row.option) {
      const alt = row.option.alt;
      const mark = alt.meets_floors ? "" : ", below floor";
      name.push(...subLines(`${fmtUsdSig(alt.total_usd)} cost · ${qualityText(alt)}${mark}`));
    }
    return name.join("\n");
  };

  /** Bold for the two bars that are compared (spec 15.11), regular for the other options. */
  const rich = (color: string, weight: number = t.weightBold) => ({
    color,
    fontSize: t.fontSm,
    fontWeight: weight,
    lineHeight: t.lineSm,
  });
  const richText = {
    today: rich(t.text),
    inf: rich(t.accentStrong),
    opt: rich(t.text, t.weightRegular),
    sub: { color: t.textSecondary, fontSize: t.fontXs, lineHeight: t.lineXs },
    sav: { color: t.positive, fontSize: t.fontXs, fontWeight: t.weightBold, lineHeight: t.lineXs },
  };

  // Phones: each row's name and figures sit above a full-width bar, on the label of the row's first block (spec 15.11).
  if (above) {
    const aboveText = (row: Row): string => {
      if (row.kind === "infravana") {
        const cost = `${fmtUsdSig(spent)} cost`;
        return saved > 0 ? `{inf|${INFRAVANA_LABEL}}\n{sub|${cost} \u00b7 }{sav|${fmtUsdSig(saved)} saved}` : `{inf|${INFRAVANA_LABEL}}\n{sub|${cost}}`;
      }
      if (row.kind === "comparator") {
        const quality = cmp.comparator ? ` \u00b7 ${qualityText(cmp.comparator)}${cmp.comparator.meets_floors ? "" : ", below floor"}` : "";
        return `{today|${TODAY_LABEL}: ${cmp.label}}\n{sub|${fmtUsdSig(a.total_usd)} cost${quality}}`;
      }
      const alt = row.option?.alt;
      return alt ? `{opt|${alt.label}}\n{sub|${fmtUsdSig(alt.total_usd)} cost \u00b7 ${qualityText(alt)}${alt.meets_floors ? "" : ", below floor"}}` : "";
    };
    rows.forEach((row, r) => {
      const first = pieces.findIndex((p) => p.row === r);
      const item = series[first];
      if (!item) return;
      item.label = {
        show: true,
        position: [0, -4],
        align: "left",
        verticalAlign: "bottom",
        formatter: aboveText(row),
        rich: richText,
        // The row's name sits on the chart ground, so the budget line, which runs behind the bars, never strikes through it.
        backgroundColor: t.surface,
        padding: [0, 4, 2, 0],
      };
    });
  }

  /**
   * Neighbouring segments of one bar are parted by a gap of the separator width in the paper colour, 2px by
   * default (spec 15.11): a rectangle drawn on each boundary, over the bars and centred on the boundary, so every
   * segment keeps its exact value and the bar its exact length, and nothing is outlined.
   */
  const boundaries: [number, number][] = [];
  rows.forEach((_, r) => {
    let at = 0;
    const inRow = pieces.filter((q) => q.row === r);
    inRow.forEach((q, k) => {
      at += q.usd;
      if (k < inRow.length - 1) boundaries.push([at, r]);
    });
  });
  const gaps: CustomSeriesOption[] =
    boundaries.length === 0
      ? []
      : [
          {
            type: "custom",
            name: GAP_SERIES,
            silent: true,
            z: 3,
            animation: false,
            data: boundaries,
            encode: { x: 0, y: 1 },
            renderItem: (_params, api) => {
              const [x, y] = api.coord([Number(api.value(0)), Number(api.value(1))]) as [number, number];
              const band = (api.size?.([0, 1]) as number[])[1] as number;
              // The bar's thickness: the token at stage size, a share of the row in a thumbnail (as the bars are).
              const bar = stage ? t.barThickness : band * THUMB_BAR_SHARE;
              return {
                type: "rect",
                shape: { x: x - t.separatorWidth / 2, y: y - bar / 2, width: t.separatorWidth, height: bar },
                style: { fill: t.separator },
                silent: true,
              };
            },
          },
        ];

  return {
    ...baseOption(t, stage),
    grid,
    tooltip: stage
      ? {
          ...tooltipChrome(t),
          trigger: "item",
          formatter: (params: unknown) => {
            const p = pieces[(params as { seriesIndex: number }).seriesIndex];
            if (!p) return "";
            const name = p.row === 0 ? `${TODAY_LABEL}: ${cmp.label}` : p.row === 1 ? INFRAVANA_LABEL : TODAY_LABEL;
            const lines = [`<strong>${esc(p.label)}</strong> (${esc(name)})`, `${fmtUsdFull(p.usd)} a quarter`];
            if (p.option) {
              lines.push(esc(qualityText(p.option.alt)));
              if (!p.option.alt.meets_floors) lines.push(`Misses ${BELOW_FLOOR}`);
            }
            lines.push(esc(explain(p)));
            return lines.join("<br/>");
          },
        }
      : undefined,
    xAxis: {
      type: "value",
      min: 0,
      max: axisMax,
      show: stage,
      axisLabel: {
        color: t.textSecondary,
        fontSize: t.fontXs,
        hideOverlap: true,
        formatter: (v: number) => fmtUsd(v),
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: t.grid } },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: rows.map((r) => r.key),
      show: stage,
      axisTick: { show: false },
      // No y axis rule: the bars start on one edge and need no fence (spec 15.11).
      axisLine: { show: false },
      axisLabel: {
        show: !above,
        margin: t.space3,
        interval: 0,
        formatter: (_value: string, index: number) => rowLabel(index),
        rich: richText,
      },
    },
    series: [...series, ...gaps],
  };
}

// ---------------------------------------------------------------------------
// Caption, explanation, CSV
// ---------------------------------------------------------------------------

function savingsOf(a: AllocationResult, source: "arbitrage" | "routing"): SavingsSegment[] {
  return a.infravana.filter(isSavings).filter((s) => s.savings_source === source && s.usd > 0);
}

/**
 * One sentence from Results. It names the Today it is measured against (the
 * comparator) and quotes the total, the headline's saving and the two
 * savings segments, all present in Results.
 */
export function allocationCaption(results: Results): string {
  const a = results.allocation;
  const cmp = comparisonOf(results);
  const pct = results.headline.cost_savings_pct;
  const arbitrage = savingsOf(a, "arbitrage");
  const routing = savingsOf(a, "routing");
  const detailed = arbitrage.length <= 1 && routing.length <= 1;
  // Every dollar figure of the sentence has three significant digits, whatever its size.
  const usd = fmtUsdSig;
  const total = usd(a.total_usd);
  const buyer = cmp.comparator ? `with ${cmp.label}` : "today";
  if (Math.round(pct) <= 0) {
    return `This work costs ${total} a quarter ${buyer}, and about the same with ${BRAND}.`;
  }
  const parts: string[] = [];
  if (arbitrage.length === 1) parts.push(`${usd(arbitrage[0].usd)} from a better price for the same model`);
  if (routing.length === 1) parts.push(`${usd(routing[0].usd)} from moving work to cheaper models and hardware`);
  const detail = detailed && parts.length > 0 ? `: ${parts.join(" and ")}` : "";
  return `This work costs ${total} a quarter ${buyer}, and ${fmtPct(pct)} less with ${BRAND}${detail}.`;
}

const ALLOCATION_HOW_COMPUTED =
  "Every bar covers the same work: what all your AI use costs in a quarter. " +
  "The top bar is the way of buying that the page compares against, split by who you pay: a seat plan, a pay-as-you-go provider, a cloud platform, or hardware you run yourself. " +
  `The ${BRAND} bar buys the same work for less, and the green block at its end, "Saved", is the money you no longer spend. ` +
  "Part of it comes from buying the same model at a better price. " +
  "The rest comes from moving some work to cheaper open models or hardware, only where they meet your minimum quality and response speed. " +
  "Hover a block to see the two parts. " +
  "Each bar below is another way companies buy the same work today, with a quality score beside its cost, because a cheaper way may buy weaker models. " +
  "The line is your budget. All prices here are illustrative.";

/** Header first, then exactly the segments drawn (small ones as one "Other" row), the option bars and the budget marker. */
export function allocationCsv(results: Results): string {
  const a = results.allocation;
  const cmp = comparisonOf(results);
  const rows: (string | number | null)[][] = [];
  const quality = cmp.comparator?.quality_score ?? null;
  for (const [bar, segs, q] of [
    [comparatorBar(cmp), planBar(a.today, "today"), quality],
    [INFRAVANA_LABEL, planBar(a.infravana, "infravana"), null],
  ] as const) {
    for (const s of segs) {
      rows.push([
        bar,
        s.label,
        s.kind,
        s.tone === "spend" ? null : s.tone,
        s.usd,
        s.provenance,
        s.members.length > 0 ? s.members.join("; ") : null,
        q,
      ]);
    }
  }
  for (const o of cmp.options) {
    rows.push([`${TODAY_LABEL}: ${o.alt.label}`, o.alt.label, "option", null, o.alt.total_usd, o.alt.provenance, null, o.alt.quality_score]);
  }
  rows.push([null, "Budget", "budget", null, a.budget_usd, null, null, null]);
  return toCsvText(
    ["bar", "segment", "kind", "savings_source", "usd", "provenance", "includes", "quality_score"],
    rows,
  );
}

export { comparatorBar } from "./sourceParts";

/** Where each drawn part comes from, for the "Where these numbers come from" table. */
export function allocationParts(results: Results): ProvenancePart[] {
  return [...todayParts(results), ...infravanaParts(results), ...optionParts(results)];
}

// ---------------------------------------------------------------------------
// Component and registry entry
// ---------------------------------------------------------------------------

export function AllocationChart({ results, size, goalView }: ChartProps) {
  const build = useCallback(
    (tokens: Tokens, dims: Dims) => buildAllocationOption(results, size, tokens, dims),
    [results, size],
  );
  const a = results.allocation;
  const cmp = comparisonOf(results);
  const rows = [
    ...planBar(a.today, "today").map((s) => [comparatorBar(cmp), s.label, fmtUsdFull(s.usd)]),
    ...planBar(a.infravana, "infravana").map((s) => [INFRAVANA_LABEL, s.label, fmtUsdFull(s.usd)]),
    ...cmp.options.map((o) => [
      `${TODAY_LABEL}: ${o.alt.label}`,
      `${o.alt.label} (${qualityText(o.alt)}${o.alt.meets_floors ? "" : `, ${BELOW_FLOOR}`})`,
      fmtUsdFull(o.alt.total_usd),
    ]),
  ];
  return (
    <ChartFigure
      size={size}
      height={barRowsHeight(results)}
      phoneHeight={barRowsHeight(results, true, C1_PHONE_MARGINS)}
      parts={allocationParts(results)}
      invented={goalView?.tradeoff?.invented}
      ariaLabel={allocationCaption(results)}
      build={build}
      table={{
        caption: `Where the budget goes, with ${cmp.label}, ${INFRAVANA_LABEL} and other ways to buy, in dollars a quarter. Budget: ${fmtUsdFull(a.budget_usd)}.`,
        headers: ["Bar", "Segment", "Dollars a quarter"],
        rows,
      }}
    />
  );
}

export const allocationChart: ChartDef = {
  id: "C1",
  title: "Where the money goes",
  caption: allocationCaption,
  howComputed: ALLOCATION_HOW_COMPUTED,
  toCsv: allocationCsv,
  benefits: allocationBenefits,
  Component: AllocationChart,
};
