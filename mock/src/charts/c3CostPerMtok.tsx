import { useCallback } from "react";
import { BarChart } from "echarts/charts";
import type { BarSeriesOption } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import type { ChartDef, ChartProps, CostPerMtokRow, Provenance, Results } from "../contract";
import { baseOption, tooltipChrome } from "./base";
import { ChartFrame } from "./ChartFrame";
import { LATENCY_LABEL } from "../components/format";
import { esc, fmtUsdPerMtok, pricesTogether, toCsvText } from "./format";
import { BRAND, INFRAVANA_LABEL, TODAY_LABEL } from "./labels";
import type { Tokens } from "./tokens";
import type { Dims } from "./useEChart";

use([BarChart, GridComponent, LegendComponent, TooltipComponent]);

type SideKey = "today" | "infravana";

const SIDES: { key: SideKey; name: string }[] = [
  { key: "today", name: TODAY_LABEL },
  { key: "infravana", name: INFRAVANA_LABEL },
];

function valueOf(row: CostPerMtokRow, side: SideKey): number | null {
  return side === "today" ? row.today_usd_per_mtok : row.infravana_usd_per_mtok;
}

function provenanceOf(row: CostPerMtokRow, side: SideKey): Provenance {
  return side === "today" ? row.today_provenance : row.infravana_provenance;
}

const CLASS_NAME: Record<CostPerMtokRow["model_class"], string> = {
  frontier: "Flagship",
  mid: "Mid-size",
  small: "Small",
};

/** Category label: the class name in plain words. */
function classLabel(row: CostPerMtokRow): string {
  return `${CLASS_NAME[row.model_class]} models`;
}

/** The classes drawn: those priced on both sides, else those priced on either (never an empty group). */
function shownRows(results: Results): CostPerMtokRow[] {
  const rows = results.cost_per_mtok.by_model_class;
  const both = rows.filter((r) => r.today_usd_per_mtok !== null && r.infravana_usd_per_mtok !== null);
  return both.length > 0 ? both : rows.filter((r) => r.today_usd_per_mtok !== null || r.infravana_usd_per_mtok !== null);
}

/** The ECharts option for C3: grouped bars by model class, today next to InfraVana. */
export function buildCostPerMtokOption(
  results: Results,
  size: "stage" | "thumb",
  t: Tokens,
  _dims: Dims,
): EChartsCoreOption {
  const stage = size === "stage";
  const rows = shownRows(results);
  const colour: Record<SideKey, string> = { today: t.today2, infravana: t.accent };

  const series: BarSeriesOption[] = SIDES.map(({ key, name }) => {
    return {
      type: "bar",
      name,
      barWidth: "30%",
      barGap: "12%",
      silent: !stage,
      emphasis: { disabled: true },
      itemStyle: { color: colour[key] },
      // A null stays null: ECharts draws no bar for it, never a bar at zero.
      data: rows.map((r) => {
        const value = valueOf(r, key);
        return value === null
          ? null
          : { value, itemStyle: { color: colour[key] } };
      }),
      label: {
        show: stage,
        position: "top",
        fontSize: t.fontXs,
        color: t.text,
        lineHeight: t.lineXs,
        formatter: (p) => fmtUsdPerMtok(Number(p.value)),
      },
    };
  });

  return {
    ...baseOption(t, stage),
    grid: stage ? { left: 64, right: 24, top: 48, bottom: 40 } : { left: 4, right: 4, top: 6, bottom: 6 },
    legend: stage
      ? { top: 0, right: 0, itemWidth: 12, itemHeight: 12, textStyle: { color: t.text, fontSize: t.fontSm }, selectedMode: false }
      : undefined,
    tooltip: stage
      ? {
          ...tooltipChrome(t),
          trigger: "item",
          formatter: (params: unknown) => {
            const p = params as { dataIndex: number; seriesIndex: number };
            const row = rows[p.dataIndex];
            const side = SIDES[p.seriesIndex];
            if (!row || !side) return "";
            const value = valueOf(row, side.key);
            if (value === null) return "";
            return [
              `<strong>${esc(classLabel(row))}</strong> (${esc(side.name)})`,
              `${fmtUsdPerMtok(value)} per million tokens`,
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
    series,
  };
}

/**
 * One sentence from Results: today's and InfraVana's price for every class
 * both sides have a value for. Makes no claim about direction, so it cannot
 * disagree with the headline.
 */
export function costPerMtokCaption(results: Results): string {
  const both = results.cost_per_mtok.by_model_class.filter(
    (r) => r.today_usd_per_mtok !== null && r.infravana_usd_per_mtok !== null,
  );
  if (both.length === 0) return "There is no model size with a price on both sides to compare.";
  // Every price of the sentence has the same number of decimals.
  const price = pricesTogether(both.flatMap((r) => [r.today_usd_per_mtok ?? 0, r.infravana_usd_per_mtok ?? 0]));
  const parts = both.map(
    (r) =>
      `${price(r.today_usd_per_mtok ?? 0)} today and ${price(r.infravana_usd_per_mtok ?? 0)} with ${BRAND} for ${CLASS_NAME[r.model_class].toLowerCase()} models`,
  );
  return `A million tokens costs ${parts.join(", ")}.`;
}

const COST_HOW_COMPUTED =
  "This is the price of a million tokens (the small pieces of text that models read and write), grouped by size of model: flagship, mid-size and small. " +
  "For each group it shows what you pay today next to what the same work costs with " +
  `${BRAND}, with answers needed just as fast on both sides. ` +
  "Only the model sizes your team uses are shown. Every price comes from the data files, and in this mock all of it is illustrative.";

/** Header first, then one row per bar drawn; a class with no value on a side has no row for it. */
export function costPerMtokCsv(results: Results): string {
  const rows: (string | number | null)[][] = [];
  for (const r of results.cost_per_mtok.by_model_class) {
    for (const { key, name } of SIDES) {
      const value = valueOf(r, key);
      if (value === null) continue;
      rows.push([r.model_class, name, value, provenanceOf(r, key)]);
    }
  }
  return toCsvText(["model_class", "series", "usd_per_mtok", "provenance"], rows);
}

export function CostPerMtokChart({ results, size }: ChartProps) {
  const build = useCallback(
    (tokens: Tokens, dims: Dims) => buildCostPerMtokOption(results, size, tokens, dims),
    [results, size],
  );
  const speed = LATENCY_LABEL[results.cost_per_mtok.latency_class];
  const rows = shownRows(results).flatMap((r) =>
    SIDES.map(({ key, name }) => {
      const value = valueOf(r, key);
      return [classLabel(r), name, value === null ? "not used" : fmtUsdPerMtok(value)];
    }),
  );
  return (
    <ChartFrame
      size={size}
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
  Component: CostPerMtokChart,
};
