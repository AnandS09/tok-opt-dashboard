import { useCallback } from "react";
import { BarChart, ScatterChart } from "echarts/charts";
import type { BarSeriesOption, ScatterSeriesOption } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import type { ChartDef, ChartProps, CostPerMtokRow, ModelTier, Provenance, Results } from "../contract";
import { baseOption, tooltipChrome } from "./base";
import { costPerMtokBenefits } from "./benefits";
import { C3Key } from "./C3Key";
import { ChartFigure } from "./ChartFigure";
import { LATENCY_LABEL } from "../components/format";
import { comparisonOf, qualityText } from "./comparison";
import type { Comparison } from "./comparison";
import { esc, fmtUsdPerMtok, pricesTogether, toCsvText } from "./format";
import { BRAND, INFRAVANA_LABEL, MODEL_CLASS_NAME, TODAY_LABEL } from "./labels";
import { textWidth } from "./measure";
import { optionStyle } from "./patterns";
import type { ProvenancePart } from "./ProvenanceNotes";
import { PROVENANCE_TEXT, outlineOf } from "./provenanceStyle";
import type { Tokens } from "./tokens";
import type { Dims } from "./useEChart";

use([BarChart, ScatterChart, GridComponent, TooltipComponent]);

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

/** The two grouped bars: the comparator's name carries the Today it is measured against. */
function sidesOf(cmp: Comparison): { key: SideKey; name: string }[] {
  return [
    { key: "today", name: `${TODAY_LABEL}: ${cmp.label}` },
    { key: "infravana", name: INFRAVANA_LABEL },
  ];
}

/** The classes some option has a price in, so that its marker has a place to stand. */
function optionPriced(cmp: Comparison, cls: ModelTier): boolean {
  return cmp.options.some((o) => o.alt.usd_per_mtok_by_class[cls] !== null);
}

/**
 * The classes drawn: those priced on either side or holding an option's
 * marker. A class only InfraVana buys (work routed to open models) stays, so
 * the chart never hides where the routed work is priced.
 */
function shownRows(results: Results, cmp: Comparison): CostPerMtokRow[] {
  return results.cost_per_mtok.by_model_class.filter(
    (r) => r.today_usd_per_mtok !== null || r.infravana_usd_per_mtok !== null || optionPriced(cmp, r.model_class),
  );
}

/** Horizontal room kept free of markers at each edge of a class band. */
const BAND_EDGE = 8;
const MARKER_SIZE = 12;
const BAR_WIDTH_PCT = 30;
/** Narrower bars on a phone leave the markers room beside the pair. */
const BAR_WIDTH_PCT_NARROW = 20;
/** and a wider gap, so a value label wider than its bar does not touch the bar beside it. */
const BAR_GAP_PCT_NARROW = 60;
/** A bar never grows past this many pixels, so a chart with one class does not draw two slabs. */
const BAR_MAX_PX = 96;
const BAR_GAP_PCT = 12;

/** The ECharts option for C3: grouped bars by model class, the comparator next to InfraVana, and a marker per priced class for each other option. */
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
  const narrow = dims.width < 600;
  const colour: Record<SideKey, string> = { today: t.today1, infravana: t.accent };

  const grid = stage ? { left: 64, right: 24, top: 28, bottom: 40 } : { left: 4, right: 4, top: 6, bottom: 6 };

  const barPct = narrow ? BAR_WIDTH_PCT_NARROW : BAR_WIDTH_PCT;
  const gapPct = narrow ? BAR_GAP_PCT_NARROW : BAR_GAP_PCT;
  const bars: BarSeriesOption[] = sides.map(({ key, name }) => ({
    type: "bar",
    name,
    barWidth: `${barPct}%`,
    barMaxWidth: BAR_MAX_PX,
    barGap: `${gapPct}%`,
    silent: !stage,
    emphasis: { disabled: true },
    // The series colour is what the legend swatch takes; the outline of each bar is set per item below.
    itemStyle: { color: colour[key] },
    // A null stays null: ECharts draws no bar for it, never a bar at zero.
    data: rows.map((r) => {
      const value = valueOf(r, key);
      if (value === null) return null;
      const o = outlineOf(provenanceOf(r, key), false, t);
      return {
        value,
        itemStyle: { color: colour[key], borderColor: o.borderColor, borderWidth: o.borderWidth, borderType: o.borderType },
      };
    }),
    label: {
      show: stage,
      position: "top",
      fontSize: t.fontXs,
      color: key === "infravana" ? t.accentStrong : t.text,
      fontWeight: key === "infravana" ? t.weightBold : undefined,
      lineHeight: t.lineXs,
      formatter: (p) => fmtUsdPerMtok(Number(p.value)),
    },
  }));

  // Markers stand to the right of the bar pair, spread so that two options with close prices do not coincide.
  const plotWidth = Math.max(0, dims.width - grid.left - grid.right);
  const band = rows.length > 0 ? plotWidth / rows.length : plotWidth;
  const barPx = Math.min((band * barPct) / 100, BAR_MAX_PX);
  const pairHalf = (barPx * (2 + gapPct / 100)) / 2;
  const room = band / 2 - (narrow ? 2 : BAND_EDGE);
  const first = Math.min(pairHalf + (narrow ? 8 : MARKER_SIZE), room);
  const priceWidth = Math.max(
    0,
    ...cmp.options.flatMap((o) =>
      Object.values(o.alt.usd_per_mtok_by_class).flatMap((p) => (p === null ? [] : [textWidth(fmtUsdPerMtok(p), t.fontXs, t.weightRegular, t.fontSans)])),
    ),
  );
  // Each marker carries its price above it when the markers can be spaced a price apart (the tooltip carries it otherwise).
  // The first label is centred on its marker, so the marker starts far enough from the bar pair that the label clears the bar's edge.
  const labelStep = Math.ceil(priceWidth) + t.space1;
  const clearOfBar = pairHalf + Math.ceil(priceWidth / 2) + t.space1;
  const roomStepFrom = (from: number) => (cmp.options.length > 1 ? (room - from) / (cmp.options.length - 1) : Infinity);
  const priced = stage && !narrow && clearOfBar <= room && roomStepFrom(Math.max(first, clearOfBar)) >= labelStep;
  const start = priced ? Math.max(first, clearOfBar) : first;
  const roomStep = roomStepFrom(start);
  const step = cmp.options.length > 1 ? Math.max(0, Math.min(priced ? labelStep : narrow ? MARKER_SIZE : 20, roomStep)) : 0;

  const markers: ScatterSeriesOption[] = cmp.options.map((o, i) => {
    const style = optionStyle(o.rank);
    return {
      type: "scatter",
      name: o.alt.label,
      symbol: style.marker,
      symbolSize: MARKER_SIZE,
      symbolKeepAspect: true,
      symbolOffset: [start + i * step, 0],
      z: 5,
      silent: !stage,
      emphasis: { disabled: true },
      // A scatter point is drawn at 80% opacity by default, which would not be the token colour.
      itemStyle: { color: t[style.fill], borderColor: t.surface, borderWidth: t.savingsOutlineWidth, opacity: 1 },
      label: {
        show: priced,
        position: "top",
        distance: t.space1,
        color: t.textSecondary,
        fontSize: t.fontXs,
        formatter: (p) => fmtUsdPerMtok(Number((p.value as number[])[1])),
      },
      // A class where the option has no price has no point, so no marker is drawn there.
      data: rows.flatMap((r, k) => {
        const price = o.alt.usd_per_mtok_by_class[r.model_class];
        return price === null ? [] : [[k, price]];
      }),
    };
  });

  return {
    ...baseOption(t, stage),
    grid,
    tooltip: stage
      ? {
          ...tooltipChrome(t),
          trigger: "item",
          formatter: (params: unknown) => {
            const p = params as { seriesType: string; dataIndex: number; seriesIndex: number; value: unknown };
            if (p.seriesType === "scatter") {
              const option = cmp.options[p.seriesIndex - sides.length];
              const k = Array.isArray(p.value) ? Number(p.value[0]) : -1;
              const row = rows[k];
              const price = row && option ? option.alt.usd_per_mtok_by_class[row.model_class] : null;
              if (!row || !option || price === null) return "";
              return [
                `<strong>${esc(classLabel(row))}</strong> (${esc(TODAY_LABEL)}: ${esc(option.alt.label)})`,
                `${fmtUsdPerMtok(price)} per million tokens`,
                esc(qualityText(option.alt)),
                `Source: ${PROVENANCE_TEXT[option.alt.provenance].toLowerCase()}`,
              ].join("<br/>");
            }
            const row = rows[p.dataIndex];
            const side = sides[p.seriesIndex];
            if (!row || !side) return "";
            const value = valueOf(row, side.key);
            if (value === null) return "";
            return [
              `<strong>${esc(classLabel(row))}</strong> (${esc(side.name)})`,
              `${fmtUsdPerMtok(value)} per million tokens`,
              `Source: ${PROVENANCE_TEXT[provenanceOf(row, side.key)].toLowerCase()}`,
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
    series: [...bars, ...markers],
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
  "Each shape beside a pair marks another way companies buy today, where that way buys models of this size; there is no shape where it buys none. " +
  "All prices here are illustrative.";

/** Header first, then one row per bar and one per marker drawn; a class with no value has no row for it. */
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

/** Where each drawn series comes from, for the badges under the chart. */
export function costPerMtokParts(results: Results): ProvenancePart[] {
  const cmp = comparisonOf(results);
  const [today, infravana] = sidesOf(cmp);
  const parts: ProvenancePart[] = [];
  for (const r of shownRows(results, cmp)) {
    // Which class a provenance belongs to matters: a small bar can only be told apart by its badge.
    if (r.today_usd_per_mtok !== null)
      parts.push({ group: today.name, part: classLabel(r), provenance: r.today_provenance });
    if (r.infravana_usd_per_mtok !== null)
      parts.push({ group: infravana.name, part: classLabel(r), provenance: r.infravana_provenance });
  }
  for (const o of cmp.options) {
    parts.push({ group: "Other Today options", part: o.alt.label, provenance: o.alt.provenance });
  }
  return parts;
}

export function CostPerMtokChart({ results, size }: ChartProps) {
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
