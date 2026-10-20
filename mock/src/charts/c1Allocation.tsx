import { useCallback } from "react";
import { BarChart } from "echarts/charts";
import type { BarSeriesOption } from "echarts/charts";
import { GridComponent, MarkLineComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import type {
  AllocationResult,
  AllocationSegment,
  ChartDef,
  ChartProps,
  Provenance,
  Results,
  SavingsSegment,
  SpendSegment,
} from "../contract";
import { baseOption, tooltipChrome } from "./base";
import { ChartFrame } from "./ChartFrame";
import type { BadgeItem } from "./ChartFrame";
import {
  esc,
  fmtPct,
  fmtUsd,
  fmtUsdFull,
  PROVENANCE_TEXT,
  toCsvText,
  worstProvenance,
} from "./format";
import { BRAND, INFRAVANA_LABEL, TODAY_LABEL } from "./labels";
import { crossHatch, dots, hatch } from "./patterns";
import type { Tokens } from "./tokens";
import type { Dims } from "./useEChart";

use([BarChart, GridComponent, MarkLineComponent, TooltipComponent]);

// ---------------------------------------------------------------------------
// Planning: which segments are drawn (design-tokens 3 and 3a)
// ---------------------------------------------------------------------------

type Side = "today" | "infravana";
type Tone = "spend" | "arbitrage" | "routing";

/** A segment as drawn: possibly several small ones folded into "Other". */
export interface PlannedSegment {
  label: string;
  usd: number;
  tone: Tone;
  /** Position in the pattern ladder of its side (spend segments only). */
  slot: number;
  kind: "provider" | "hardware" | "savings" | "other";
  provenance: Provenance;
  /** Labels of the segments folded into this one; empty if it stands alone. */
  members: string[];
}

/** Spend segments drawn per bar, "Other" included (design-tokens 3, 3a). */
const MAX_SPEND_SEGMENTS: Record<Side, number> = { today: 5, infravana: 4 };
/** A spend segment under this share of the bar is too narrow to read; it joins "Other". */
const MIN_SHARE = 0.03;
const OTHER_LABEL: Record<Side, string> = { today: "Other providers", infravana: "Other" };

const isSavings = (s: AllocationSegment): s is SavingsSegment => s.kind === "savings";
const isSpend = (s: AllocationSegment): s is SpendSegment => s.kind !== "savings";

/**
 * Turns one bar's segments into the segments drawn. Spend segments keep their
 * order; when there are too many, or one is too narrow to label, the smallest
 * fold into "Other". Savings segments are never folded and come last:
 * arbitrage, then routing, so both bars end at the same total.
 */
export function planBar(segments: AllocationSegment[], side: Side): PlannedSegment[] {
  const total = segments.reduce((sum, s) => sum + s.usd, 0);
  const spend = segments.filter(isSpend);
  const savings = segments
    .filter(isSavings)
    .sort((a, b) => Number(a.savings_source === "routing") - Number(b.savings_source === "routing"));

  const max = MAX_SPEND_SEGMENTS[side];
  let kept = spend;
  let folded: SpendSegment[] = [];
  if (spend.length > max) {
    const largest = new Set([...spend].sort((a, b) => b.usd - a.usd).slice(0, max - 1));
    kept = spend.filter((s) => largest.has(s));
    folded = spend.filter((s) => !largest.has(s));
  }
  const narrow = kept.filter((s) => total > 0 && s.usd / total < MIN_SHARE);
  // One narrow segment on its own keeps its own name; its label goes outside the bar.
  if (narrow.length > 1 || (narrow.length === 1 && folded.length > 0)) {
    folded = [...folded, ...narrow];
    kept = kept.filter((s) => !narrow.includes(s));
  }

  const planned: PlannedSegment[] = kept.map((s, i) => ({
    label: s.label,
    usd: s.usd,
    tone: "spend",
    slot: i,
    kind: s.kind,
    provenance: s.provenance,
    members: [],
  }));
  if (folded.length > 0) {
    planned.push({
      label: OTHER_LABEL[side],
      usd: folded.reduce((sum, s) => sum + s.usd, 0),
      tone: "spend",
      slot: Number.MAX_SAFE_INTEGER,
      kind: "other",
      provenance: worstProvenance(folded.map((s) => s.provenance)),
      members: folded.map((s) => s.label),
    });
  }
  for (const s of savings) {
    planned.push({
      label: s.label,
      usd: s.usd,
      tone: s.savings_source,
      slot: 0,
      kind: "savings",
      provenance: s.provenance,
      members: [],
    });
  }
  return planned;
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

type ItemStyle = NonNullable<BarSeriesOption["itemStyle"]>;

/** Fill, outline and pattern of one segment (design-tokens 3 and 3a). */
function segmentStyle(seg: PlannedSegment, side: Side, t: Tokens): ItemStyle {
  const edge = { borderColor: t.separator, borderWidth: 1 };
  if (seg.tone === "arbitrage" || seg.tone === "routing") {
    // Hollow: surface fill, accent-strong outline and pattern.
    return {
      color: t.surface,
      borderColor: t.accentStrong,
      borderWidth: 1.5,
      decal: seg.tone === "arbitrage" ? hatch(t.accentStrong) : dots(t.accentStrong),
    };
  }
  const isOther = seg.kind === "other";
  if (side === "today") {
    const slot = Math.min(isOther ? 4 : seg.slot, 4);
    switch (slot) {
      case 0:
        return { ...edge, color: t.today1 };
      case 1:
        return { ...edge, color: t.today2 };
      case 2:
        return { ...edge, color: t.today3, decal: hatch(t.separator) };
      case 3:
        return { ...edge, color: t.today4, decal: dots(t.separator) };
      default:
        return { ...edge, color: t.today2, decal: crossHatch(t.separator) };
    }
  }
  const slot = Math.min(isOther ? 3 : seg.slot, 3);
  switch (slot) {
    case 0:
      return { ...edge, color: t.accent };
    case 1:
      return { ...edge, color: t.accent, decal: hatch(t.separator) };
    case 2:
      return { ...edge, color: t.accent, decal: dots(t.separator) };
    default:
      return { ...edge, color: t.accent, decal: crossHatch(t.separator) };
  }
}

function segmentText(seg: PlannedSegment): string {
  const name =
    seg.tone === "arbitrage"
      ? "Saved: provider arbitrage"
      : seg.tone === "routing"
        ? "Saved: routing"
        : seg.label;
  return `${name}\n${fmtUsd(seg.usd)}`;
}

/** Rough pixel width of a 12px label chip, for deciding inside or outside the bar. */
function labelWidth(text: string): number {
  return Math.max(...text.split("\n").map((line) => line.length)) * 6.6 + 14;
}

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

/** Height of a two-line label chip, and the gap kept between stacked chips. */
const LABEL_HEIGHT = 34;
/** Stacking tiers allowed for labels outside a bar, so they stay on the canvas. */
const MAX_TIERS = 2;

interface LabelPlace {
  position: "inside" | "top" | "bottom";
  /** Vertical offset in pixels, away from the bar. */
  offset: number;
}

/**
 * Decides where each segment's label goes. A label sits inside its segment
 * when it fits. Otherwise it goes outside the bar, above it (spend) or below
 * it (savings on the InfraVana bar), and is raised a tier when it would
 * overlap its neighbour, so no label is ever dropped (design-tokens 3a).
 */
function placeLabels(
  bar: PlannedSegment[],
  side: Side,
  plotWidth: number,
  axisMax: number,
): LabelPlace[] {
  const places: LabelPlace[] = bar.map(() => ({ position: "inside", offset: 0 }));
  const outside: { index: number; left: number; right: number; position: "top" | "bottom" }[] = [];
  let start = 0;
  bar.forEach((seg, index) => {
    const width = (plotWidth * seg.usd) / axisMax;
    const need = labelWidth(segmentText(seg));
    if (width < need) {
      const centre = start + width / 2;
      const position = side === "infravana" && seg.kind === "savings" ? "bottom" : "top";
      outside.push({ index, left: centre - need / 2, right: centre + need / 2, position });
    }
    start += width;
  });
  // Below the bar there is room for one row of labels; whatever does not fit
  // there joins the labels above the bar.
  const stack = (items: typeof outside, position: "top" | "bottom", tiers: number): typeof outside => {
    const tierRight: number[] = [];
    const spill: typeof outside = [];
    for (const label of [...items].sort((x, y) => x.left - y.left)) {
      let tier = tierRight.findIndex((right) => label.left >= right + 4);
      if (tier === -1 && tierRight.length < tiers) tier = tierRight.length;
      if (tier === -1) {
        if (position === "bottom") {
          spill.push(label);
          continue;
        }
        tier = tiers - 1;
      }
      tierRight[tier] = label.right;
      places[label.index] = { position, offset: tier * (LABEL_HEIGHT + 2) };
    }
    return spill;
  };
  const spilled = stack(outside.filter((o) => o.position === "bottom"), "bottom", 1);
  stack([...outside.filter((o) => o.position === "top"), ...spilled], "top", MAX_TIERS);
  return places;
}

const GRID_STAGE = { left: 124, right: 28, top: 36, bottom: 40 };
const GRID_THUMB = { left: 4, right: 4, top: 6, bottom: 6 };

/** The ECharts option for C1. Pure: tokens and pixel size in, option out. */
export function buildAllocationOption(
  results: Results,
  size: "stage" | "thumb",
  t: Tokens,
  dims: Dims,
): EChartsCoreOption {
  const stage = size === "stage";
  const a: AllocationResult = results.allocation;
  const today = planBar(a.today, "today");
  const infravana = planBar(a.infravana, "infravana");
  const barTotal = (segs: PlannedSegment[]) => segs.reduce((sum, s) => sum + s.usd, 0);
  const axisMax = Math.max(barTotal(today), barTotal(infravana), a.budget_usd) * 1.04;
  const grid = stage ? GRID_STAGE : GRID_THUMB;
  const plotWidth = Math.max(0, dims.width - grid.left - grid.right);

  const all: { seg: PlannedSegment; side: Side }[] = [
    ...today.map((seg) => ({ seg, side: "today" as const })),
    ...infravana.map((seg) => ({ seg, side: "infravana" as const })),
  ];

  const placed = {
    today: placeLabels(today, "today", plotWidth, axisMax),
    infravana: placeLabels(infravana, "infravana", plotWidth, axisMax),
  };
  const series: BarSeriesOption[] = all.map(({ seg, side }, index) => {
    const place = placed[side][side === "today" ? index : index - today.length];
    const item: BarSeriesOption = {
      type: "bar",
      name: seg.label,
      stack: "total",
      barWidth: "46%",
      silent: !stage,
      emphasis: { disabled: true },
      itemStyle: segmentStyle(seg, side, t),
      data: side === "today" ? [seg.usd, null] : [null, seg.usd],
      label: {
        show: stage,
        position: place.position,
        offset: [0, place.position === "bottom" ? place.offset : -place.offset],
        formatter: segmentText(seg),
        color: t.text,
        fontSize: 12,
        lineHeight: 15,
        backgroundColor: t.surface,
        borderRadius: 2,
        padding: [2, 5],
      },
    };
    if (index === 0) {
      item.markLine = {
        silent: true,
        symbol: "none",
        animation: false,
        lineStyle: { color: t.text, width: 1.5, type: "solid" },
        label: {
          show: stage,
          position: "start",
          formatter: `Budget ${fmtUsd(a.budget_usd)}`,
          color: t.text,
          fontWeight: "bold",
          fontSize: 12,
        },
        data: [{ xAxis: a.budget_usd }],
      };
    }
    return item;
  });

  const rich = (color: string, bold: boolean) => ({
    color,
    fontSize: 13,
    fontWeight: bold ? ("bold" as const) : ("normal" as const),
    lineHeight: 18,
  });

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
            const share = barTotal(bar) > 0 ? (seg.usd / barTotal(bar)) * 100 : 0;
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
      axisLabel: { color: t.textSecondary, fontSize: 12, formatter: (v: number) => fmtUsd(v) },
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
        margin: 12,
        formatter: (value: string) =>
          value === INFRAVANA_LABEL
            ? `{inf|${value}}\n{sub|${fmtUsd(barTotal(infravana))} total}`
            : `{today|${value}}\n{sub|${fmtUsd(barTotal(today))} total}`,
        rich: {
          today: rich(t.text, true),
          inf: rich(t.accentStrong, true),
          sub: rich(t.textSecondary, false),
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
  const total = fmtUsd(a.total_usd);
  const budget = fmtUsd(a.budget_usd);
  if (Math.round(pct) <= 0) {
    return `With ${BRAND} the same ${total} of work costs about the same, against a ${budget} budget.`;
  }
  const arbitrage = savingsOf(a, "arbitrage");
  const routing = savingsOf(a, "routing");
  const parts: string[] = [];
  if (arbitrage.length === 1) parts.push(`${fmtUsd(arbitrage[0].usd)} from a better price for the same model`);
  if (routing.length === 1) parts.push(`${fmtUsd(routing[0].usd)} from moving work to cheaper models and hardware`);
  const detail = arbitrage.length <= 1 && routing.length <= 1 && parts.length > 0 ? `: ${parts.join(" and ")}` : "";
  return `The same ${total} of work costs ${fmtPct(pct)} less with ${BRAND}${detail}, against a ${budget} budget.`;
}

const ALLOCATION_HOW_COMPUTED =
  "Both bars show the same piece of work: what your current usage would cost this quarter. " +
  "The top bar splits that cost by who you pay today: a seat plan, an API provider, a cloud platform, or hardware you run yourself. " +
  `The ${BRAND} bar buys the same work from the cheapest options that still meet your quality and speed targets. ` +
  "The two hollow, patterned blocks at its end are money you no longer need to spend. " +
  "The first is a better price for the same model from a different seller, and the second is moving some work to cheaper models or hardware. " +
  "The vertical line is your budget. Small items are combined into Other. " +
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

function badgeItems(results: Results): BadgeItem[] {
  const a = results.allocation;
  const sides: [string, AllocationSegment[]][] = [
    [TODAY_LABEL, a.today],
    [INFRAVANA_LABEL, a.infravana],
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
