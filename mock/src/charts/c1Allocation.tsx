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
  Results,
  SavingsSegment,
} from "../contract";
import { fmtPct, fmtUsd, fmtUsdFull, fmtUsdSig } from "../shared/format";
import { baseOption, tooltipChrome } from "./base";
import { isSavings, planBar } from "./c1Plan";
import type { PlannedSegment } from "./c1Plan";
import { ChartFrame } from "./ChartFrame";
import { esc, toCsvText } from "./format";
import { BRAND, INFRAVANA_LABEL, TODAY_LABEL } from "./labels";
import { textWidth } from "./measure";
import type { Tokens } from "./tokens";
import type { Dims } from "./useEChart";

use([BarChart, GridComponent, MarkLineComponent, TooltipComponent]);

export { planBar } from "./c1Plan";
export type { PlannedSegment } from "./c1Plan";

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

function explain(seg: PlannedSegment): string {
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
const SAVED_LABEL = "Saved";

/** Smallest of 1, 2, 2.5, 5 x 10^n at or above `x`, so the axis ends on a round number. */
function niceCeil(x: number): number {
  if (x <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(x));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * p >= x) ?? 10;
  return step * p;
}

/** The drawn pieces of one bar: spend segments, then (With bar only) one "Saved" block. */
interface Piece {
  label: string;
  usd: number;
  color: string;
  textColor: string;
  border: string;
  borderWidth: number;
  seg: PlannedSegment | null;
}

function piecesOf(a: AllocationResult, t: Tokens): { today: Piece[]; infravana: Piece[]; saved: number } {
  const today = planBar(a.today, "today").map((seg, i) => ({
    label: seg.label,
    usd: seg.usd,
    color: i % 2 === 0 ? t.today3 : t.today1,
    textColor: t.surface,
    border: t.separator,
    borderWidth: t.separatorWidth,
    seg,
  }));
  const planned = planBar(a.infravana, "infravana");
  const infravana: Piece[] = planned
    .filter((seg) => seg.tone === "spend")
    .map((seg, i) => ({
      label: seg.label,
      usd: seg.usd,
      color: i % 2 === 0 ? t.accent : t.accentStrong,
      textColor: t.surface,
      border: t.separator,
      borderWidth: t.separatorWidth,
      seg,
    }));
  const saved = planned.filter((seg) => seg.tone !== "spend").reduce((sum, seg) => sum + seg.usd, 0);
  // The light fill alone is too faint against the card (1.48:1); the accent-strong outline gives the edge.
  if (saved > 0) {
    infravana.push({
      label: SAVED_LABEL,
      usd: saved,
      color: t.saved,
      textColor: t.text,
      border: t.accentStrong,
      borderWidth: t.savingsOutlineWidth,
      seg: null,
    });
  }
  return { today, infravana, saved };
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
  const { today, infravana, saved } = piecesOf(a, t);
  const spent = a.total_usd - saved;
  const axisMax = niceCeil(Math.max(a.total_usd, a.budget_usd));
  const grid = stage ? { left: 8, right: 24, top: 36, bottom: 8, containLabel: true } : GRID_THUMB;
  // Plot width is approximate (containLabel takes the axis labels off it), close enough to decide label fit.
  const plotWidth = Math.max(0, dims.width - 150);
  const pxPer = plotWidth / axisMax;

  /** The longest label that fits inside a piece: "Name $X", then "$X", then none. */
  const fit = (p: Piece): string => {
    const room = p.usd * pxPer - 2 * t.space2;
    const full = `${p.label} ${fmtUsdSig(p.usd)}`;
    if (textWidth(full, t.fontSm, t.weightBold, t.fontSans) <= room) return full;
    const short = fmtUsdSig(p.usd);
    return textWidth(short, t.fontSm, t.weightBold, t.fontSans) <= room ? short : "";
  };

  /** True when a label right of the With bar would sit on the budget line; it then goes above its block. */
  const crossesBudget = (text: string): boolean => {
    const start = a.total_usd * pxPer;
    const end = start + t.space2 + textWidth(text, t.fontSm, t.weightBold, t.fontSans);
    return a.budget_usd * pxPer >= start && a.budget_usd * pxPer <= end + t.space2;
  };

  const all = [
    ...today.map((p) => ({ p, side: "today" as const })),
    ...infravana.map((p) => ({ p, side: "infravana" as const })),
  ];

  const series: BarSeriesOption[] = all.map(({ p, side }, index) => {
    const inside = stage ? fit(p) : "";
    // "Saved" keeps its name: when it does not fit inside the block, it goes to the right of the bar.
    const outside = stage && p.seg === null && !inside.startsWith(SAVED_LABEL);
    const text = outside ? `${SAVED_LABEL} ${fmtUsdSig(p.usd)}` : inside;
    const item: BarSeriesOption = {
      type: "bar",
      name: p.label,
      stack: "total",
      barWidth: "46%",
      silent: !stage,
      emphasis: { disabled: true },
      itemStyle: { color: p.color, borderColor: p.border, borderWidth: p.borderWidth },
      data: side === "today" ? [p.usd, null] : [null, p.usd],
      label: {
        show: text !== "",
        position: outside ? (crossesBudget(text) ? "top" : "right") : "inside",
        formatter: text,
        color: outside ? t.text : p.textColor,
        fontSize: t.fontSm,
        fontWeight: t.weightBold,
      },
    };
    if (index === 0 && stage) {
      item.markLine = {
        silent: true,
        symbol: "none",
        animation: false,
        data: [
          // A surface-colour halo first: the dark line alone is 1.26:1 on today-1.
          {
            xAxis: a.budget_usd,
            lineStyle: { color: t.surface, width: t.budgetHaloWidth, type: "solid" },
            label: { show: false },
          },
          {
            xAxis: a.budget_usd,
            lineStyle: { color: t.budgetLine, width: t.budgetLineWidth, type: [4, 4] },
            label: {
              show: true,
              position: "start",
              formatter: `Budget ${fmtUsd(a.budget_usd)}`,
              color: t.textSecondary,
              fontSize: t.fontXs,
            },
          },
        ],
      };
    }
    return item;
  });

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
            const entry = all[(params as { seriesIndex: number }).seriesIndex];
            if (!entry) return "";
            const { p, side } = entry;
            const name = side === "today" ? TODAY_LABEL : INFRAVANA_LABEL;
            const lines = [`<strong>${esc(p.label)}</strong> (${esc(name)})`, `${fmtUsdFull(p.usd)} a quarter`];
            if (p.seg) lines.push(esc(explain(p.seg)));
            else lines.push("Money you no longer need to spend for the same work.");
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
      data: [TODAY_LABEL, INFRAVANA_LABEL],
      show: stage,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        margin: t.space3,
        formatter: (value: string) =>
          value === INFRAVANA_LABEL
            ? `{inf|${value}}\n{sub|${fmtUsdSig(spent)} cost}`
            : `{today|${value}}\n{sub|${fmtUsdSig(a.total_usd)} cost}`,
        rich: {
          today: rich(t.text),
          inf: rich(t.accentStrong),
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
  return a.infravana.filter(isSavings).filter((s) => s.savings_source === source);
}

/**
 * One sentence from Results. It quotes the total, the budget, the headline's
 * saving and the two savings segments, all present in Results.
 */
export function allocationCaption(results: Results): string {
  const a = results.allocation;
  const pct = results.headline.cost_savings_pct;
  const arbitrage = savingsOf(a, "arbitrage");
  const routing = savingsOf(a, "routing");
  const detailed = arbitrage.length <= 1 && routing.length <= 1;
  // Every dollar figure of the sentence has three significant digits, whatever its size.
  const usd = fmtUsdSig;
  const total = usd(a.total_usd);
  if (Math.round(pct) <= 0) {
    return `This work costs ${total} a quarter today, and about the same with ${BRAND}.`;
  }
  const parts: string[] = [];
  if (arbitrage.length === 1) parts.push(`${usd(arbitrage[0].usd)} from a better price for the same model`);
  if (routing.length === 1) parts.push(`${usd(routing[0].usd)} from moving work to cheaper models and hardware`);
  const detail = detailed && parts.length > 0 ? `: ${parts.join(" and ")}` : "";
  return `This work costs ${total} a quarter today, and ${fmtPct(pct)} less with ${BRAND}${detail}.`;
}

const ALLOCATION_HOW_COMPUTED =
  "Both bars cover the same work: what your team's AI use costs in a quarter. " +
  "The top bar splits today's cost by who you pay: a seat plan, a pay-as-you-go provider, a cloud platform, or hardware you run yourself. " +
  `The ${BRAND} bar buys the same work from the cheapest options that still meet your quality and speed needs, ` +
  "and the light block at its end is the money you no longer spend. " +
  "Part of it comes from buying the same model at a better price, and part from moving some work to cheaper models or hardware. " +
  "The dashed line is your budget. All prices here are illustrative."

/** Header first, then exactly the segments drawn (small ones as one "Other" row) and the budget marker. */
export function allocationCsv(results: Results): string {
  const a = results.allocation;
  const rows: (string | number | null)[][] = [];
  for (const [bar, segs] of [
    [TODAY_LABEL, planBar(a.today, "today")],
    [INFRAVANA_LABEL, planBar(a.infravana, "infravana")],
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
      ]);
    }
  }
  rows.push([null, "Budget", "budget", null, a.budget_usd, null, null]);
  return toCsvText(["bar", "segment", "kind", "savings_source", "usd", "provenance", "includes"], rows);
}

// ---------------------------------------------------------------------------
// Component and registry entry
// ---------------------------------------------------------------------------

export function AllocationChart({ results, size }: ChartProps) {
  const build = useCallback(
    (tokens: Tokens, dims: Dims) => buildAllocationOption(results, size, tokens, dims),
    [results, size],
  );
  const a = results.allocation;
  const rows = [
    ...planBar(a.today, "today").map((s) => [TODAY_LABEL, s.label, fmtUsdFull(s.usd)]),
    ...planBar(a.infravana, "infravana").map((s) => [INFRAVANA_LABEL, s.label, fmtUsdFull(s.usd)]),
  ];
  return (
    <ChartFrame
      size={size}
      ariaLabel={allocationCaption(results)}
      build={build}
      table={{
        caption: `Where the budget goes, ${TODAY_LABEL.toLowerCase()} and ${INFRAVANA_LABEL}, in dollars a quarter. Budget: ${fmtUsdFull(a.budget_usd)}.`,
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
  Component: AllocationChart,
};
