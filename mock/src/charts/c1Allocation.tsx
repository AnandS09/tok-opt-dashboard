import { useCallback } from "react";
import { BarChart } from "echarts/charts";
import type { BarSeriesOption } from "echarts/charts";
import { GridComponent, MarkLineComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import type {
  AllocationResult,
  ChartDef,
  ChartProps,
  Provenance,
  Results,
  SavingsSegment,
} from "../contract";
import { fmtPct, fmtUsd, fmtUsdFull, fmtUsdSig } from "../shared/format";
import { baseOption, tooltipChrome } from "./base";
import { allocationBenefits } from "./benefits";
import { isSavings, planBar } from "./c1Plan";
import type { PlannedSegment } from "./c1Plan";
import { ChartFigure } from "./ChartFigure";
import { BELOW_FLOOR, barRowsHeight, comparisonOf, qualityText } from "./comparison";
import type { Comparison, OptionBar } from "./comparison";
import { esc, fmtBudget, toCsvText } from "./format";
import { BRAND, INFRAVANA_LABEL, TODAY_LABEL } from "./labels";
import { textWidth } from "./measure";
import {
  CHANNEL_PATTERNS,
  INFRAVANA_PATTERNS,
  SAVINGS_PATTERNS,
  TODAY_FILL_ALTERNATION,
  decalOf,
  optionDecal,
  optionStyle,
} from "./patterns";
import type { Decal } from "./patterns";
import type { ProvenancePart } from "./ProvenanceNotes";
import { PROVENANCE_TEXT, outlineOf } from "./provenanceStyle";
import type { Outline } from "./provenanceStyle";
import type { Tokens } from "./tokens";
import type { Dims } from "./useEChart";
import { wrapText } from "./wrap";

use([BarChart, GridComponent, MarkLineComponent, TooltipComponent]);

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

/** One drawn block: a channel segment, a savings segment or a whole option bar. */
interface Piece {
  row: number;
  label: string;
  usd: number;
  fill: string;
  textColor: string;
  decal: Decal | undefined;
  outline: Outline;
  hollow: boolean;
  provenance: Provenance;
  seg: PlannedSegment | null;
  option: OptionBar | null;
}

function piecesOf(results: Results, cmp: Comparison, t: Tokens): Piece[] {
  const a = results.allocation;
  const pieces: Piece[] = [];
  planBar(a.today, "today").forEach((seg, i) => {
    pieces.push({
      row: 0,
      label: seg.label,
      usd: seg.usd,
      fill: t[TODAY_FILL_ALTERNATION[i % 2]],
      textColor: t.patternOnFill,
      decal: decalOf(CHANNEL_PATTERNS[Math.min(i, CHANNEL_PATTERNS.length - 1)], t.patternOnFill),
      outline: outlineOf(seg.provenance, false, t),
      hollow: false,
      provenance: seg.provenance,
      seg,
      option: null,
    });
  });
  const planned = planBar(a.infravana, "infravana");
  planned
    .filter((seg) => seg.tone === "spend")
    .forEach((seg, i) => {
      pieces.push({
        row: 1,
        label: seg.label,
        usd: seg.usd,
        fill: t.accent,
        textColor: t.patternOnFill,
        decal: decalOf(INFRAVANA_PATTERNS[Math.min(i, INFRAVANA_PATTERNS.length - 1)], t.patternOnFill),
        outline: outlineOf(seg.provenance, false, t),
        hollow: false,
        provenance: seg.provenance,
        seg,
        option: null,
      });
    });
  // The savings segments are hollow: a pale fill needs its outline for an edge (1.12:1 against the paper).
  for (const seg of planned.filter((s) => s.tone !== "spend" && s.usd > 0)) {
    pieces.push({
      row: 1,
      label: seg.label,
      usd: seg.usd,
      fill: t.saved,
      textColor: t.text,
      decal: decalOf(SAVINGS_PATTERNS[seg.tone === "arbitrage" ? "arbitrage" : "routing"], t.patternOnSaved),
      outline: outlineOf(seg.provenance, true, t),
      hollow: true,
      provenance: seg.provenance,
      seg,
      option: null,
    });
  }
  cmp.options.forEach((o, i) => {
    pieces.push({
      row: 2 + i,
      label: o.alt.label,
      usd: o.alt.total_usd,
      fill: t[optionStyle(o.rank).fill],
      textColor: t.patternOnFill,
      decal: optionDecal(o.rank, t),
      outline: outlineOf(o.alt.provenance, false, t),
      hollow: false,
      provenance: o.alt.provenance,
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
  if (p.option) return "Another way to buy the same work today, shown for comparison.";
  const seg = p.seg;
  if (!seg) return "";
  switch (seg.tone) {
    case "arbitrage":
      return "Not spent: the same model bought from a seller with a better price.";
    case "routing":
      return "Not spent: some work moved to cheaper models or hardware that are still good enough.";
    default:
      if (seg.kind === "other") return `Combined: ${seg.members.join(", ")}.`;
      return seg.kind === "hardware" ? "Spent on hardware you run yourself." : "Spent with this provider or plan.";
  }
}

const GRID_THUMB = { left: 4, right: 4, top: 6, bottom: 6 };

/** Smallest of 1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8 x 10^n at or above `x`, so the axis ends on a round number. */
function niceCeil(x: number): number {
  if (x <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(x));
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((m) => m * p >= x) ?? 10;
  return step * p;
}

/** Horizontal room of a chip around its text: 4px each side (design-tokens 3.6). */
const CHIP_PAD_X = 4;
const CHIP_PAD_Y = 2;
const CHIP_RADIUS = 2;

/** Left margin of the plot, which holds the row names. */
function labelColumn(width: number): number {
  const narrow = width < NARROW_WIDTH;
  return Math.round(Math.min(narrow ? 128 : 220, Math.max(narrow ? 96 : 150, width * (narrow ? 0.34 : 0.26))));
}

/** The text of an option bar's end label: quality, cost and the floor mark. */
function optionLabels(o: OptionBar): string[] {
  const q = qualityText(o.alt);
  const usd = fmtUsd(o.alt.total_usd);
  const mark = o.alt.meets_floors ? "" : " · below floor";
  return [`${q} · ${usd}${mark}`];
}

/** The ECharts option for C1. Pure: tokens and pixel size in, option out. */
export function buildAllocationOption(
  results: Results,
  size: "stage" | "thumb",
  t: Tokens,
  dims: Dims,
): EChartsCoreOption {
  const stage = size === "stage";
  const a: AllocationResult = results.allocation;
  const cmp = comparisonOf(results);
  const rows = rowsOf(cmp);
  const pieces = piecesOf(results, cmp, t);
  const narrow = dims.width < NARROW_WIDTH;
  const saved = pieces.filter((p) => p.hollow).reduce((sum, p) => sum + p.usd, 0);
  const spent = a.total_usd - saved;
  const extent = Math.max(a.total_usd, a.budget_usd, ...cmp.options.map((o) => o.alt.total_usd));
  const axisMax = niceCeil(extent);
  const left = stage ? labelColumn(dims.width) + t.space3 : GRID_THUMB.left;
  // Option labels sit right of their bar, or right of the budget line when the line is in the way, so the
  // margin holds the longest of them: a label never moves between rows.
  const optionLabelPx = narrow ? 0 : Math.max(0, ...cmp.options.map((o) => textWidth(optionLabels(o)[0], t.fontXs, t.weightBold, t.fontSans)));
  const right = stage ? 24 + (optionLabelPx > 0 ? Math.ceil(optionLabelPx) + t.space2 : 0) : GRID_THUMB.right;
  const grid = stage ? { left, right, top: 36, bottom: 28 } : GRID_THUMB;
  const plotWidth = Math.max(0, dims.width - left - right);
  const pxPer = plotWidth / axisMax;

  /** The longest label that fits inside a piece, on its chip: "Name $X", then "$X", then none. */
  const fit = (p: Piece): string => {
    if (narrow) return "";
    const room = p.usd * pxPer - 2 * t.space1 - 2 * CHIP_PAD_X;
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
  const budgetClips =
    left + a.budget_usd * pxPer + textWidth(budgetText, t.fontXs, t.weightRegular, t.fontSans) / 2 > dims.width - t.space1;

  const series: BarSeriesOption[] = pieces.map((p, index) => {
    const item: BarSeriesOption = {
      type: "bar",
      name: p.label,
      stack: "total",
      barWidth: "58%",
      silent: !stage,
      emphasis: { disabled: true },
      data: rows.map((_, r) =>
        r === p.row
          ? {
              value: p.usd,
              itemStyle: {
                color: p.fill,
                decal: p.decal,
                borderColor: p.outline.borderColor,
                borderWidth: p.outline.borderWidth,
                borderType: p.outline.borderType,
              },
            }
          : null,
      ),
    };
    if (stage && p.option) {
      // An option bar is one block: its quality and cost sit right of it, beside the bar rather than in a legend.
      // Right of the bar; when the budget line is in the way it starts right of the line, still in its own row.
      const [full] = optionLabels(p.option);
      item.label = {
        // On a narrow chart the cost and quality go under the row name instead, where there is room for both.
        show: !narrow,
        position: "right",
        offset: [pastBudgetLine(p.usd, full), 0],
        formatter: full,
        color: t.text,
        fontSize: t.fontXs,
        fontWeight: t.weightBold,
        backgroundColor: t.surface,
      };
    } else {
      // Inside a patterned block the name sits on a chip of the block's own fill, so text never crosses a pattern.
      const text = stage ? fit(p) : "";
      item.label = {
        show: text !== "",
        position: "inside",
        formatter: text,
        color: p.textColor,
        fontSize: t.fontXs,
        fontWeight: t.weightBold,
        backgroundColor: p.fill,
        padding: [CHIP_PAD_Y, CHIP_PAD_X],
        borderRadius: CHIP_RADIUS,
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
            // Solid: a dash in a chart means provenance (design-tokens 3.6).
            lineStyle: { color: t.budgetLine, width: t.budgetLineWidth, type: "solid" },
            label: {
              show: true,
              position: "start",
              // Centred on the line, but ending at it when centring would run past the right edge of the chart.
              align: budgetClips ? "right" : "center",
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
      return `{inf|${INFRAVANA_LABEL}}\n{sub|${fmtUsdSig(spent)} cost}`;
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

  const rich = (color: string) => ({
    color,
    fontSize: t.fontSm,
    fontWeight: t.weightBold,
    lineHeight: t.lineSm,
  });

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
            lines.push(`Source: ${PROVENANCE_TEXT[p.provenance].toLowerCase()}`);
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
      axisLine: { lineStyle: { color: t.borderStrong } },
      axisLabel: {
        margin: t.space3,
        interval: 0,
        formatter: (_value: string, index: number) => rowLabel(index),
        rich: {
          today: rich(t.text),
          inf: rich(t.accentStrong),
          opt: rich(t.text),
          sub: { color: t.textSecondary, fontSize: t.fontXs, lineHeight: t.lineXs },
        },
      },
    },
    series,
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
  `The ${BRAND} bar buys the same work for less, and the two pale blocks at its end are the money you no longer spend. ` +
  "One comes from buying the same model at a better price. " +
  "The other comes from moving some work to cheaper open models or hardware, only where they meet your minimum quality and response speed. " +
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

/** The name of the comparator's bar: "Today: Pay-as-you-go API". */
export function comparatorBar(cmp: Comparison): string {
  return `${TODAY_LABEL}: ${cmp.label}`;
}

/** Where each drawn part comes from, for the badges under the chart. */
export function allocationParts(results: Results): ProvenancePart[] {
  const a = results.allocation;
  const cmp = comparisonOf(results);
  const parts: ProvenancePart[] = [];
  for (const s of planBar(a.today, "today")) {
    parts.push({ group: comparatorBar(cmp), part: s.label, provenance: s.provenance });
  }
  for (const s of planBar(a.infravana, "infravana")) {
    parts.push({ group: INFRAVANA_LABEL, part: s.label, provenance: s.provenance });
  }
  for (const o of cmp.options) {
    parts.push({ group: "Other Today options", part: o.alt.label, provenance: o.alt.provenance });
  }
  return parts;
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
      phoneHeight={barRowsHeight(results, true)}
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
