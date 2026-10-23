import { useCallback } from "react";
import { BarChart } from "echarts/charts";
import type { BarSeriesOption } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import type { ChartDef, ChartProps, CostPerMtokRow, Provenance, Results } from "../contract";
import { baseOption, tooltipChrome } from "./base";
import { costPerMtokBenefits } from "./benefits";
import { C3Key } from "./C3Key";
import { ChartFigure } from "./ChartFigure";
import { LATENCY_LABEL } from "../components/format";
import { comparisonOf, qualityText } from "./comparison";
import type { Comparison } from "./comparison";
import { esc, fmtUsdPerMtok, pricesTogether, toCsvText } from "./format";
import { BRAND, INFRAVANA_LABEL, MODEL_CLASS_NAME, TODAY_LABEL } from "./labels";
import { optionStyle } from "./patterns";
import type { ProvenancePart } from "./ProvenanceNotes";
import { OTHER_TODAY_GROUP, firstAddress, infravanaParts, todayParts } from "./sourceParts";
import type { Tokens } from "./tokens";
import type { Dims } from "./useEChart";

use([BarChart, GridComponent, TooltipComponent]);

type SideKey = "today" | "infravana";

function valueOf(row: CostPerMtokRow, side: SideKey): number | null {
  return side === "today" ? row.today_usd_per_mtok : row.infravana_usd_per_mtok;
}

function provenanceOf(row: CostPerMtokRow, side: SideKey): Provenance {
  return side === "today" ? row.today_provenance : row.infravana_provenance;
}

/** Category label: the class name in plain words. */
function classLabel(row: CostPerMtokRow): string {
  return `${MODEL_CLASS_NAME[row.model_class]} models`;
}

/** The two compared bars: the comparator's name carries the Today it is measured against. */
function sidesOf(cmp: Comparison): { key: SideKey; name: string }[] {
  return [
    { key: "today", name: `${TODAY_LABEL}: ${cmp.label}` },
    { key: "infravana", name: INFRAVANA_LABEL },
  ];
}

/** True when some option has a price in this class, so that its bar has a place to stand. */
function optionPriced(cmp: Comparison, cls: CostPerMtokRow["model_class"]): boolean {
  return cmp.options.some((o) => o.alt.usd_per_mtok_by_class[cls] !== null);
}

/**
 * The classes drawn: those priced on either side or holding an option's bar. A
 * class only InfraVana buys (work routed to open models) stays, so the chart
 * never hides where the routed work is priced.
 */
function shownRows(results: Results, cmp: Comparison): CostPerMtokRow[] {
  return results.cost_per_mtok.by_model_class.filter(
    (r) => r.today_usd_per_mtok !== null || r.infravana_usd_per_mtok !== null || optionPriced(cmp, r.model_class),
  );
}

/** A bar is this share of the width of its class (spec 15.11). */
export const BAR_WIDTH_PCT = 13;
/** and never wider than this many pixels, so a chart with one class does not draw slabs. */
export const BAR_MAX_PX = 44;
/** Gap between bars of one group, as a share of a bar. */
const BAR_GAP_PCT = 18;
/** Chart width under which the value labels turn on their side, because five bars are narrower than a price. */
const NARROW_WIDTH = 600;

/**
 * The ECharts option for C3: for each model class an equal group of bars on
 * one baseline, the comparator, InfraVana and each other Today option, so
 * prices compare by length. Every bar is a solid fill of its own hue (spec 15.11).
 */
export function buildCostPerMtokOption(
  results: Results,
  size: "stage" | "thumb",
  t: Tokens,
  dims: Dims,
): EChartsCoreOption {
  const stage = size === "stage";
  const cmp = comparisonOf(results);
  const sides = sidesOf(cmp);
  const rows = shownRows(results, cmp);
  const narrow = dims.width < NARROW_WIDTH;
  const colour: Record<SideKey, string> = { today: t.today1, infravana: t.accent };

  // Rotated labels on a phone stand taller than a line of text, so the plot starts lower.
  const grid = stage ? { left: 64, right: 24, top: narrow ? 52 : 28, bottom: 40 } : { left: 4, right: 4, top: 6, bottom: 6 };

  /** The price above a bar; on a phone it is turned to read upward, so five neighbours do not collide. */
  const valueLabel = (colourOf: string, weight: number | undefined) => ({
    show: stage,
    position: "top" as const,
    distance: t.space1,
    fontSize: t.fontXs,
    color: colourOf,
    fontWeight: weight,
    lineHeight: t.lineXs,
    ...(narrow ? { rotate: 90, align: "left" as const, verticalAlign: "middle" as const } : {}),
    formatter: (p: { value?: unknown }) => fmtUsdPerMtok(Number(p.value)),
  });

  const common = {
    type: "bar" as const,
    barWidth: `${BAR_WIDTH_PCT}%`,
    barMaxWidth: BAR_MAX_PX,
    barGap: `${BAR_GAP_PCT}%`,
    silent: !stage,
    emphasis: { disabled: true },
  };

  const bars: BarSeriesOption[] = sides.map(({ key, name }) => ({
    ...common,
    name,
    itemStyle: { color: colour[key] },
    // A null stays null: ECharts draws no bar for it, never a bar at zero.
    data: rows.map((r) => valueOf(r, key)),
    label: valueLabel(key === "infravana" ? t.accentStrong : t.text, key === "infravana" ? t.weightBold : undefined),
  }));

  // Every other Today option is a bar on the same baseline, in its own hue, where it has a price in the class.
  const optionBars: BarSeriesOption[] = cmp.options.map((o) => ({
    ...common,
    name: o.alt.label,
    itemStyle: { color: t[optionStyle(o.rank).fill] },
    data: rows.map((r) => o.alt.usd_per_mtok_by_class[r.model_class]),
    label: valueLabel(t.textSecondary, undefined),
  }));

  return {
    ...baseOption(t, stage),
    grid,
    tooltip: stage
      ? {
          ...tooltipChrome(t),
          trigger: "item",
          formatter: (params: unknown) => {
            const p = params as { dataIndex: number; seriesIndex: number };
            const row = rows[p.dataIndex];
            if (!row) return "";
            const side = sides[p.seriesIndex];
            if (side) {
              const value = valueOf(row, side.key);
              if (value === null) return "";
              return [
                `<strong>${esc(classLabel(row))}</strong> (${esc(side.name)})`,
                `${fmtUsdPerMtok(value)} per million tokens`,
              ].join("<br/>");
            }
            const option = cmp.options[p.seriesIndex - sides.length];
            const price = option ? option.alt.usd_per_mtok_by_class[row.model_class] : null;
            if (!option || price === null) return "";
            return [
              `<strong>${esc(classLabel(row))}</strong> (${esc(TODAY_LABEL)}: ${esc(option.alt.label)})`,
              `${fmtUsdPerMtok(price)} per million tokens`,
              esc(qualityText(option.alt)),
            ].join("<br/>");
          },
        }
      : undefined,
    xAxis: {
      type: "category",
      data: rows.map((r) => r.model_class),
      show: stage,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: t.borderStrong } },
      axisLabel: {
        interval: 0,
        margin: t.space3,
        color: t.text,
        fontSize: t.fontSm,
        lineHeight: t.lineSm,
        formatter: (_value: string, index: number) => (rows[index] ? classLabel(rows[index]) : ""),
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      show: stage,
      axisLabel: { color: t.textSecondary, fontSize: t.fontXs, formatter: (v: number) => (v === 0 ? "$0" : fmtUsdPerMtok(v)) },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: t.grid } },
    },
    series: [...bars, ...optionBars],
  };
}

/**
 * One sentence from Results: the comparator's and InfraVana's price for every
 * class both sides have a value for. It names the comparator and makes no
 * claim about direction, so it cannot disagree with the headline.
 */
export function costPerMtokCaption(results: Results): string {
  const cmp = comparisonOf(results);
  const both = results.cost_per_mtok.by_model_class.filter(
    (r) => r.today_usd_per_mtok !== null && r.infravana_usd_per_mtok !== null,
  );
  if (both.length === 0) return "There is no model size with a price on both sides to compare.";
  // Every price of the sentence has the same number of decimals.
  const price = pricesTogether(both.flatMap((r) => [r.today_usd_per_mtok ?? 0, r.infravana_usd_per_mtok ?? 0]));
  const buyer = cmp.comparator ? `with ${cmp.label}` : "today";
  const parts = both.map(
    (r) =>
      `${price(r.today_usd_per_mtok ?? 0)} ${buyer} and ${price(r.infravana_usd_per_mtok ?? 0)} with ${BRAND} for ${MODEL_CLASS_NAME[r.model_class].toLowerCase()} models`,
  );
  return `A million tokens costs ${parts.join(", ")}.`;
}

const COST_HOW_COMPUTED =
  "This is the price of a million tokens (the small pieces of text that models read and write), grouped by size of model: flagship, mid-size and small. " +
  "For each group it shows what you pay with the way of buying the page compares against, next to what the same work costs with " +
  `${BRAND}, with answers needed just as fast on both sides. ` +
  "Each further bar in a group is another way companies buy today, where that way buys models of this size; there is no bar where it buys none. " +
  "All prices here are illustrative.";

/** Header first, then one row per bar drawn; a class with no value has no row for it. */
export function costPerMtokCsv(results: Results): string {
  const cmp = comparisonOf(results);
  const sides = sidesOf(cmp);
  const rows: (string | number | null)[][] = [];
  for (const r of results.cost_per_mtok.by_model_class) {
    for (const { key, name } of sides) {
      const value = valueOf(r, key);
      if (value === null) continue;
      rows.push([r.model_class, name, value, provenanceOf(r, key)]);
    }
  }
  for (const o of cmp.options) {
    for (const r of results.cost_per_mtok.by_model_class) {
      const price = o.alt.usd_per_mtok_by_class[r.model_class];
      if (price === null) continue;
      rows.push([r.model_class, `${TODAY_LABEL}: ${o.alt.label}`, price, o.alt.provenance]);
    }
  }
  return toCsvText(["model_class", "series", "usd_per_mtok", "provenance"], rows);
}

/**
 * Where each drawn series comes from, for the "Where these numbers come from"
 * table. A size class stands for several segments of the bars of C1, so its
 * address is that of the first segment on its side with the same provenance.
 */
export function costPerMtokParts(results: Results): ProvenancePart[] {
  const cmp = comparisonOf(results);
  const [today, infravana] = sidesOf(cmp);
  const todaySegments = todayParts(results);
  const infravanaSegments = infravanaParts(results);
  const parts: ProvenancePart[] = [];
  for (const r of shownRows(results, cmp)) {
    if (r.today_usd_per_mtok !== null) {
      parts.push({
        group: today.name,
        part: classLabel(r),
        provenance: r.today_provenance,
        source_url: cmp.comparator?.source_url ?? firstAddress(todaySegments, r.today_provenance),
      });
    }
    if (r.infravana_usd_per_mtok !== null) {
      parts.push({
        group: infravana.name,
        part: classLabel(r),
        provenance: r.infravana_provenance,
        source_url: firstAddress(infravanaSegments, r.infravana_provenance),
      });
    }
  }
  for (const o of cmp.options) {
    parts.push({ group: OTHER_TODAY_GROUP, part: o.alt.label, provenance: o.alt.provenance, source_url: o.alt.source_url });
  }
  return parts;
}

export function CostPerMtokChart({ results, size, goalView }: ChartProps) {
  const build = useCallback(
    (tokens: Tokens, dims: Dims) => buildCostPerMtokOption(results, size, tokens, dims),
    [results, size],
  );
  const speed = LATENCY_LABEL[results.cost_per_mtok.latency_class];
  const cmp = comparisonOf(results);
  const sides = sidesOf(cmp);
  const rows = shownRows(results, cmp).flatMap((r) => [
    ...sides.map(({ key, name }) => {
      const value = valueOf(r, key);
      return [classLabel(r), name, value === null ? "not used" : fmtUsdPerMtok(value)];
    }),
    ...cmp.options.map((o) => {
      const price = o.alt.usd_per_mtok_by_class[r.model_class];
      return [classLabel(r), `${TODAY_LABEL}: ${o.alt.label}`, price === null ? "not used" : fmtUsdPerMtok(price)];
    }),
  ]);
  return (
    <ChartFigure
      size={size}
      header={size === "stage" ? <C3Key results={results} /> : undefined}
      parts={costPerMtokParts(results)}
      invented={goalView?.tradeoff?.invented}
      ariaLabel={costPerMtokCaption(results)}
      build={build}
      subtitle={`With answers needed ${speed}`}
      table={{
        caption: `Price per million tokens by model size, with answers needed ${speed}.`,
        headers: ["Model size", "Series", "Dollars per million tokens"],
        rows,
      }}
    />
  );
}

export const costPerMtokChart: ChartDef = {
  id: "C3",
  title: "Price per million tokens, by model size",
  caption: costPerMtokCaption,
  howComputed: COST_HOW_COMPUTED,
  toCsv: costPerMtokCsv,
  benefits: costPerMtokBenefits,
  Component: CostPerMtokChart,
};
