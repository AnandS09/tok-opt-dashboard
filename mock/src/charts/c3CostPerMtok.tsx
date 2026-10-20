import { useCallback } from "react";
import { BarChart } from "echarts/charts";
import type { BarSeriesOption } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import type { ChartDef, ChartProps, CostPerMtokRow, Provenance, Results } from "../contract";
import { baseOption, tooltipChrome } from "./base";
import { ChartFrame } from "./ChartFrame";
import type { BadgeItem } from "./ChartFrame";
import { capitalize, esc, fmtUsdPerMtok, PROVENANCE_TEXT, toCsvText } from "./format";
import { BRAND, INFRAVANA_LABEL, TODAY_LABEL } from "./labels";
import type { Tokens } from "./tokens";
import type { Dims } from "./useEChart";

use([BarChart, GridComponent, TooltipComponent]);

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

/** Category label: the class name, plus a note when a side has no value (absent, never zero). */
function classLabel(row: CostPerMtokRow): string {
  const name = capitalize(row.model_class);
  const today = row.today_usd_per_mtok === null;
  const infravana = row.infravana_usd_per_mtok === null;
  if (today && infravana) return `${name}\n(not used here)`;
  if (today) return `${name}\n(no ${TODAY_LABEL.toLowerCase()} value)`;
  if (infravana) return `${name}\n(no ${BRAND} value)`;
  return name;
}

/** The ECharts option for C3: grouped bars by model class, today next to InfraVana. */
export function buildCostPerMtokOption(
  results: Results,
  size: "stage" | "thumb",
  t: Tokens,
  _dims: Dims,
): EChartsCoreOption {
  const stage = size === "stage";
  const rows = results.cost_per_mtok.by_model_class;
  const colour: Record<SideKey, string> = { today: t.today1, infravana: t.accent };
  const maxValue = Math.max(0, ...rows.flatMap((r) => [r.today_usd_per_mtok ?? 0, r.infravana_usd_per_mtok ?? 0]));

  const series: BarSeriesOption[] = SIDES.map(({ key, name }) => {
    // The side's name is written once, on its first bar, as a direct label.
    const firstIndex = rows.findIndex((r) => valueOf(r, key) !== null);
    return {
      type: "bar",
      name,
      barWidth: "30%",
      barGap: "12%",
      silent: !stage,
      emphasis: { disabled: true },
      itemStyle: { color: colour[key], borderColor: t.separator, borderWidth: 1 },
      data: rows.map((r) => valueOf(r, key)),
      label: {
        show: stage,
        position: "top",
        fontSize: 12,
        color: t.text,
        lineHeight: 16,
        formatter: (p) => {
          const value = fmtUsdPerMtok(Number(p.value));
          if (p.dataIndex !== firstIndex) return value;
          return key === "infravana" ? `{inf|With\n${BRAND}}\n${value}` : `{today|${TODAY_LABEL}}\n${value}`;
        },
        rich: {
          today: { color: t.text, fontWeight: "bold", fontSize: 12, lineHeight: 16 },
          inf: { color: t.accentStrong, fontWeight: "bold", fontSize: 12, lineHeight: 16 },
        },
      },
    };
  });

  return {
    ...baseOption(t, stage),
    grid: stage ? { left: 64, right: 24, top: 56, bottom: 52 } : { left: 4, right: 4, top: 6, bottom: 6 },
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
              `<strong>${esc(capitalize(row.model_class))} models</strong> (${esc(side.name)})`,
              `${fmtUsdPerMtok(value)} per million tokens`,
              `At the ${esc(results.cost_per_mtok.latency_class)} latency target`,
              `Data: ${PROVENANCE_TEXT[provenanceOf(row, side.key)]}`,
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
        margin: 10,
        color: t.text,
        fontSize: 13,
        lineHeight: 18,
        formatter: (_value: string, index: number) => (rows[index] ? classLabel(rows[index]) : ""),
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: maxValue > 0 ? maxValue * 1.25 : 1,
      show: stage,
      axisLabel: { color: t.textSecondary, fontSize: 12, formatter: (v: number) => fmtUsdPerMtok(v) },
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
  const { latency_class, by_model_class } = results.cost_per_mtok;
  const both = by_model_class.filter(
    (r) => r.today_usd_per_mtok !== null && r.infravana_usd_per_mtok !== null,
  );
  if (both.length === 0) {
    return `At the ${latency_class} latency target there is no model class with a price on both sides to compare.`;
  }
  const parts = both.map(
    (r) =>
      `${fmtUsdPerMtok(r.today_usd_per_mtok ?? 0)} today and ${fmtUsdPerMtok(r.infravana_usd_per_mtok ?? 0)} with ${BRAND} for ${r.model_class} models`,
  );
  return `At the ${latency_class} latency target, a million tokens costs ${parts.join(", ")}.`;
}

const COST_HOW_COMPUTED =
  "This is the price of a million tokens (the small pieces of text that models read and write), grouped by size of model: frontier, mid and small. " +
  "For each group it shows what you pay today next to what the same work costs with " +
  `${BRAND}, at the same speed target on both sides. ` +
  "A group your scenario does not use is left out of the chart rather than shown as zero. " +
  "Every price comes from the data files, and in this mock all of it is invented placeholder data.";

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

function badgeItems(results: Results): BadgeItem[] {
  const items: BadgeItem[] = [];
  for (const r of results.cost_per_mtok.by_model_class) {
    for (const { key, name } of SIDES) {
      if (valueOf(r, key) === null) continue;
      items.push({ series: name, part: capitalize(r.model_class), provenance: provenanceOf(r, key) });
    }
  }
  return items;
}

export function CostPerMtokChart({ results, size }: ChartProps) {
  const build = useCallback(
    (tokens: Tokens, dims: Dims) => buildCostPerMtokOption(results, size, tokens, dims),
    [results, size],
  );
  const { latency_class, by_model_class } = results.cost_per_mtok;
  const rows = by_model_class.flatMap((r) =>
    SIDES.map(({ key, name }) => {
      const value = valueOf(r, key);
      return [
        capitalize(r.model_class),
        name,
        value === null ? "not used" : fmtUsdPerMtok(value),
        value === null ? "" : PROVENANCE_TEXT[provenanceOf(r, key)],
      ];
    }),
  );
  return (
    <ChartFrame
      size={size}
      ariaLabel={costPerMtokCaption(results)}
      build={build}
      badges={badgeItems(results)}
      subtitle={`Cost per million tokens at the ${latency_class} latency target`}
      table={{
        caption: `Cost per million tokens by model class, at the ${latency_class} latency target.`,
        headers: ["Model class", "Series", "Dollars per million tokens", "Data"],
        rows,
      }}
    />
  );
}

export const costPerMtokChart: ChartDef = {
  id: "C3",
  title: "Cost per million tokens",
  caption: costPerMtokCaption,
  howComputed: COST_HOW_COMPUTED,
  toCsv: costPerMtokCsv,
  Component: CostPerMtokChart,
};
