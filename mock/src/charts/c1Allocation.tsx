import { useCallback, useId } from "react";
import { BarChart } from "echarts/charts";
import type { BarSeriesOption } from "echarts/charts";
import { GraphicComponent, GridComponent, MarkLineComponent, TooltipComponent } from "echarts/components";
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
import { BAR_SHARE, BUDGET_LABEL_DISTANCE, layoutAllocation } from "./c1Layout";
import type { Layout, Placement } from "./c1Layout";
import { isSavings, planBar, segmentStyle } from "./c1Plan";
import type { PlannedSegment, Side } from "./c1Plan";
import { C1LabelList } from "./c1LabelList";
import { ChartFrame } from "./ChartFrame";
import type { BadgeItem } from "./ChartFrame";
import { esc, PROVENANCE_TEXT, toCsvText } from "./format";
import { BRAND, INFRAVANA_LABEL, TODAY_LABEL } from "./labels";
import { chipText } from "./c1Plan";
import { readTokens } from "./tokens";
import type { Tokens } from "./tokens";
import type { Dims } from "./useEChart";

use([BarChart, GraphicComponent, GridComponent, MarkLineComponent, TooltipComponent]);

export { planBar } from "./c1Plan";
export type { PlannedSegment } from "./c1Plan";

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

function explain(seg: PlannedSegment): string {
  switch (seg.tone) {
    case "arbitrage":
      return "Money no longer needed: the same proprietary model bought through a cheaper channel.";
    case "routing":
      return "Money no longer needed: some work moved to cheaper models or hardware that still meet the quality floor.";
    default:
      if (seg.kind === "other") return `Combined: ${seg.members.join(", ")}.`;
      return seg.kind === "hardware"
        ? "Spent on self-hosted hardware."
        : "Spent with this provider or plan.";
  }
}

const GRID_THUMB = { left: 4, right: 4, top: 6, bottom: 6 };

/** ECharts label options for one segment, from where the layout put its chip. */
function labelOption(seg: PlannedSegment, place: Placement | undefined, stage: boolean, t: Tokens) {
  const rich = {
    main: { color: t.text, fontSize: t.fontXs, lineHeight: t.lineXs },
    prov: { color: t.textSecondary, fontSize: t.fontXs, lineHeight: t.lineXs },
  };
  const base = {
    formatter: chipText(seg),
    color: t.text,
    fontSize: t.fontXs,
    lineHeight: t.lineXs,
    backgroundColor: t.chip,
    borderRadius: t.chipRadius,
    padding: t.chipPadding,
    rich,
  };
  if (!stage || !place || place.mode === "list") return { ...base, show: false };
  if (place.mode === "inside") return { ...base, show: true, position: "inside" as const };
  return {
    ...base,
    show: true,
    position: place.position,
    distance: t.space2,
    offset: [place.dx, place.position === "bottom" ? place.lift : -place.lift],
  };
}

/** Titles above the bars in the narrow layout: "Today · $100K total", the name bold and the total secondary. */
function narrowTitles(layout: Layout, t: Tokens) {
  return [layout.today, layout.infravana].map((bar) => ({
    type: "text",
    silent: true,
    x: layout.grid.left,
    y: bar.bar.y - t.space1,
    style: {
      text: `{name|${bar.side === "today" ? TODAY_LABEL : INFRAVANA_LABEL}}{total| \u00b7 ${fmtUsd(bar.total)} total}`,
      fill: t.text,
      fontFamily: t.fontSans,
      fontSize: t.fontSm,
      textVerticalAlign: "bottom",
      rich: {
        name: {
          color: bar.side === "today" ? t.text : t.accentStrong,
          fontSize: t.fontSm,
          fontWeight: t.weightBold,
          lineHeight: t.lineSm,
        },
        total: { color: t.textSecondary, fontSize: t.fontXs, lineHeight: t.lineXs },
      },
    },
  }));
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
  const layout = layoutAllocation(results, t, dims);
  const grid = stage ? layout.grid : GRID_THUMB;
  const today = layout.today;
  const infravana = layout.infravana;
  const axisMax = layout.axisMax;

  const all: { seg: PlannedSegment; side: Side; place: Placement | undefined }[] = [
    ...today.segs.map((seg, i) => ({ seg, side: "today" as const, place: today.placements[i] })),
    ...infravana.segs.map((seg, i) => ({ seg, side: "infravana" as const, place: infravana.placements[i] })),
  ];

  const series: BarSeriesOption[] = all.map(({ seg, side, place }, index) => {
    const item: BarSeriesOption = {
      type: "bar",
      name: seg.label,
      stack: "total",
      barWidth: `${BAR_SHARE * 100}%`,
      silent: !stage,
      emphasis: { disabled: true },
      itemStyle: segmentStyle(seg, side, t),
      data: side === "today" ? [seg.usd, null] : [null, seg.usd],
      label: labelOption(seg, place, stage, t),
    };
    if (index === 0) {
      // Two items at the budget: a halo underneath, then the line on top
      // (design-tokens 3d). The halo is silent and has no label.
      item.markLine = {
        silent: true,
        symbol: "none",
        animation: false,
        data: [
          {
            xAxis: a.budget_usd,
            lineStyle: { color: t.budgetHalo, width: t.budgetHaloWidth, type: "solid" },
            label: { show: false },
          },
          {
            xAxis: a.budget_usd,
            lineStyle: { color: t.budgetLine, width: t.budgetLineWidth, type: "solid" },
            label: {
              show: stage,
              position: "start",
              align: layout.budget.align,
              distance: BUDGET_LABEL_DISTANCE,
              formatter: layout.budget.text,
              color: t.budgetLine,
              fontWeight: t.weightBold,
              fontSize: t.fontXs,
              lineHeight: t.lineXs,
            },
          },
        ],
      };
    }
    return item;
  });

  const rich = (color: string, bold: boolean) => ({
    color,
    fontSize: t.fontSm,
    fontWeight: bold ? t.weightBold : t.weightRegular,
    lineHeight: t.lineSm,
  });

  // Leader lines for chips outside a bar (design-tokens 3e): a vertical line from the middle of the
  // chip's near edge to the bar edge at the segment's midpoint, no end marker.
  const leaders = stage
    ? [today, infravana].flatMap((bar) =>
        bar.placements.flatMap((p) =>
          p.mode === "outside"
            ? [
                {
                  type: "line",
                  silent: true,
                  z: 1,
                  shape: { x1: p.leader.x, y1: p.leader.from, x2: p.leader.x, y2: p.leader.to },
                  style: { stroke: t.chartLeader, lineWidth: t.leaderWidth },
                },
              ]
            : [],
        ),
      )
    : [];

  return {
    ...baseOption(t, stage),
    grid: { ...grid, containLabel: false },
    tooltip: stage
      ? {
          ...tooltipChrome(t),
          trigger: "item",
          formatter: (params: unknown) => {
            const p = params as { seriesIndex: number };
            const entry = all[p.seriesIndex];
            if (!entry) return "";
            const { seg, side } = entry;
            const bar = side === "today" ? today : infravana;
            const share = bar.total > 0 ? (seg.usd / bar.total) * 100 : 0;
            return [
              `<strong>${esc(seg.label)}</strong> (${esc(side === "today" ? TODAY_LABEL : INFRAVANA_LABEL)})`,
              `${fmtUsdFull(seg.usd)} a quarter, ${fmtPct(share)} of the bar`,
              esc(explain(seg)),
              `Data: ${PROVENANCE_TEXT[seg.provenance]}`,
            ].join("<br/>");
          },
        }
      : undefined,
    xAxis: {
      type: "value",
      min: 0,
      max: axisMax,
      show: stage,
      axisLabel: { color: t.textSecondary, fontSize: t.fontXs, formatter: (v: number) => fmtUsd(v) },
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
      axisLine: { lineStyle: { color: t.borderStrong } },
      axisLabel: {
        show: !layout.narrow,
        margin: t.space3,
        formatter: (value: string) =>
          value === INFRAVANA_LABEL
            ? `{inf|${value}}\n{sub|${fmtUsd(infravana.total)} total}`
            : `{today|${value}}\n{sub|${fmtUsd(today.total)} total}`,
        rich: {
          today: rich(t.text, true),
          inf: rich(t.accentStrong, true),
          sub: { color: t.textSecondary, fontSize: t.fontXs, fontWeight: t.weightRegular, lineHeight: t.lineXs },
        },
      },
    },
    graphic: stage ? [...leaders, ...(layout.narrow ? narrowTitles(layout, t) : [])] : undefined,
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
  const budget = usd(a.budget_usd);
  if (Math.round(pct) <= 0) {
    return `With ${BRAND} the same ${total} of work costs about the same, against a ${budget} budget.`;
  }
  const parts: string[] = [];
  if (arbitrage.length === 1) parts.push(`${usd(arbitrage[0].usd)} from a better price for the same model`);
  if (routing.length === 1) parts.push(`${usd(routing[0].usd)} from moving work to cheaper models and hardware`);
  const detail = detailed && parts.length > 0 ? `: ${parts.join(" and ")}` : "";
  return `The same ${total} of work costs ${fmtPct(pct)} less with ${BRAND}${detail}, against a ${budget} budget.`;
}

const ALLOCATION_HOW_COMPUTED =
  "Both bars show the same piece of work: what your current usage would cost this quarter. " +
  "The top bar splits that cost by who you pay today: a seat plan, an API provider, a cloud platform, or hardware you run yourself. " +
  `The ${BRAND} bar buys the same work from the cheapest options that still meet your quality and speed targets. ` +
  "The two hollow, patterned blocks at its end are money you no longer need to spend. " +
  "The first is a better price for the same model from a different seller, and the second is moving some work to cheaper models or hardware. " +
  "The vertical line is your budget. When there are many items, the smallest are combined into Other. " +
  "A dashed outline marks figures that come from a model, and a dotted outline marks figures reported by a vendor. " +
  "Every price comes from the data files, and in this mock all of it is invented placeholder data.";

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

/** One badge item per drawn segment, named exactly as the bar names it. */
function badgeItems(results: Results): BadgeItem[] {
  const a = results.allocation;
  const sides: [string, PlannedSegment[]][] = [
    [TODAY_LABEL, planBar(a.today, "today")],
    [INFRAVANA_LABEL, planBar(a.infravana, "infravana")],
  ];
  const items: BadgeItem[] = [];
  for (const [series, segs] of sides) {
    for (const s of segs) items.push({ series, part: s.label, provenance: s.provenance });
  }
  return items;
}

export function AllocationChart({ results, size }: ChartProps) {
  const build = useCallback(
    (tokens: Tokens, dims: Dims) => buildAllocationOption(results, size, tokens, dims),
    [results, size],
  );
  const listId = useId();
  const a = results.allocation;
  const rows = [
    ...planBar(a.today, "today").map((s) => [TODAY_LABEL, s.label, fmtUsdFull(s.usd), PROVENANCE_TEXT[s.provenance]]),
    ...planBar(a.infravana, "infravana").map((s) => [
      INFRAVANA_LABEL,
      s.label,
      fmtUsdFull(s.usd),
      PROVENANCE_TEXT[s.provenance],
    ]),
  ];
  return (
    <ChartFrame
      size={size}
      ariaLabel={allocationCaption(results)}
      build={build}
      badges={badgeItems(results)}
      renderList={(width, height) => {
        // The list names the segments the chart could not label; it needs the chart's pixel size and the tokens.
        try {
          return width > 0 ? <C1LabelList results={results} tokens={readTokens()} dims={{ width, height }} idPrefix={listId} /> : null;
        } catch {
          return null;
        }
      }}
      table={{
        caption: `Budget allocation, ${TODAY_LABEL.toLowerCase()} and ${INFRAVANA_LABEL}, in dollars a quarter. Budget: ${fmtUsdFull(a.budget_usd)}.`,
        headers: ["Bar", "Segment", "Dollars a quarter", "Data"],
        rows,
      }}
    />
  );
}

export const allocationChart: ChartDef = {
  id: "C1",
  title: "Budget allocation, today vs " + BRAND,
  caption: allocationCaption,
  howComputed: ALLOCATION_HOW_COMPUTED,
  toCsv: allocationCsv,
  Component: AllocationChart,
};
