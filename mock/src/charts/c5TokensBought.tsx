import { useCallback } from "react";
import { BarChart } from "echarts/charts";
import type { BarSeriesOption } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import type { ChartDef, ChartProps, Results } from "../contract";
import { baseOption, tooltipChrome } from "./base";
import { ChartFrame } from "./ChartFrame";
import { fmtMultiple, fmtTokens, fmtTokensSig, fmtUsd, fmtUsdSig } from "../shared/format";
import { esc, toCsvText } from "./format";
import { BRAND, INFRAVANA_LABEL, TODAY_LABEL } from "./labels";
import type { Tokens } from "./tokens";
import type { Dims } from "./useEChart";

use([BarChart, GridComponent, TooltipComponent]);

/** The ECharts option for C5: one bar per side, tokens bought for the budget. */
export function buildTokensBoughtOption(
  results: Results,
  size: "stage" | "thumb",
  t: Tokens,
  _dims: Dims,
): EChartsCoreOption {
  const stage = size === "stage";
  const b = results.tokens_bought;
  const sides = [
    { name: TODAY_LABEL, tokens: b.today_tokens },
    { name: INFRAVANA_LABEL, tokens: b.infravana_tokens },
  ];
  const bars: BarSeriesOption = {
    type: "bar",
    barWidth: "42%",
    silent: !stage,
    emphasis: { disabled: true },
    data: [
      { value: b.today_tokens, itemStyle: { color: t.today2 } },
      { value: b.infravana_tokens, itemStyle: { color: t.accent } },
    ],
    label: {
      show: stage,
      position: "top",
      color: t.text,
      fontSize: t.fontSm,
      lineHeight: t.lineSm,
      fontWeight: t.weightBold,
      formatter: (p) => `${fmtTokens(Number(p.value))} tokens`,
    },
  };
  return {
    ...baseOption(t, stage),
    grid: stage ? { left: 56, right: 24, top: 36, bottom: 36 } : { left: 4, right: 4, top: 6, bottom: 6 },
    tooltip: stage
      ? {
          ...tooltipChrome(t),
          trigger: "item",
          formatter: (params: unknown) => {
            const side = sides[(params as { dataIndex: number }).dataIndex];
            if (!side) return "";
            return [
              `<strong>${esc(side.name)}</strong>`,
              `${fmtTokens(side.tokens)} tokens a quarter for ${fmtUsd(b.budget_usd)}`,
            ].join("<br/>");
          },
        }
      : undefined,
    xAxis: {
      type: "category",
      data: sides.map((s) => s.name),
      show: stage,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: t.borderStrong } },
      axisLabel: {
        interval: 0,
        margin: t.space3,
        formatter: (value: string) => (value === INFRAVANA_LABEL ? `{inf|${value}}` : `{today|${value}}`),
        rich: {
          today: { color: t.text, fontSize: t.fontSm, lineHeight: t.lineSm, fontWeight: t.weightBold },
          inf: { color: t.accentStrong, fontSize: t.fontSm, lineHeight: t.lineSm, fontWeight: t.weightBold },
        },
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      show: stage,
      axisLabel: { color: t.textSecondary, fontSize: t.fontXs, formatter: (v: number) => fmtTokens(v) },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: t.grid } },
    },
    series: [bars],
  };
}

/**
 * One sentence from Results. The multiple is the headline's, so the caption
 * and the headline strip always say the same thing.
 */
export function tokensBoughtCaption(results: Results): string {
  const b = results.tokens_bought;
  const multiple = results.headline.tokens_multiple;
  const budget = fmtUsdSig(b.budget_usd);
  // Dollar figures and token counts all carry three significant digits.
  const tokens = fmtTokensSig;
  const shown = fmtMultiple(multiple);
  const ratio =
    shown === "1.0x"
      ? "about the same number"
      : multiple > 1
        ? `${shown} as many`
        : `${shown.slice(0, -1)} times the tokens`;
  return `The same ${budget} budget buys ${tokens(b.today_tokens)} tokens a quarter today and ${tokens(b.infravana_tokens)} with ${BRAND}, ${ratio}.`;
}

const TOKENS_HOW_COMPUTED =
  "This is how much work the same budget pays for. " +
  "Today, the budget buys tokens (the small pieces of text that models read and write) at the prices of your current set-up. " +
  `With ${BRAND}, the same budget buys tokens from the cheapest options that still meet your quality and speed targets. ` +
  "Every price comes from the data files, and in this mock all of it is illustrative.";

/** Header first, then the two bars and the delta label. */
export function tokensBoughtCsv(results: Results): string {
  const b = results.tokens_bought;
  return toCsvText(
    ["series", "measure", "value", "provenance"],
    [
      [TODAY_LABEL, "tokens_per_quarter", b.today_tokens, b.provenance.today],
      [INFRAVANA_LABEL, "tokens_per_quarter", b.infravana_tokens, b.provenance.infravana],
      [INFRAVANA_LABEL + " vs " + TODAY_LABEL, "tokens_multiple", results.headline.tokens_multiple, null],
    ],
  );
}

export function TokensBoughtChart({ results, size }: ChartProps) {
  const build = useCallback(
    (tokens: Tokens, dims: Dims) => buildTokensBoughtOption(results, size, tokens, dims),
    [results, size],
  );
  const b = results.tokens_bought;
  return (
    <ChartFrame
      size={size}
      ariaLabel={tokensBoughtCaption(results)}
      build={build}
      table={{
        caption: `Tokens bought a quarter for a ${fmtUsd(b.budget_usd)} budget.`,
        headers: ["Series", "Tokens a quarter"],
        rows: [
          [TODAY_LABEL, fmtTokens(b.today_tokens)],
          [INFRAVANA_LABEL, fmtTokens(b.infravana_tokens)],
        ],
      }}
    />
  );
}

export const tokensBoughtChart: ChartDef = {
  id: "C5",
  title: "How much AI work the budget buys",
  caption: tokensBoughtCaption,
  howComputed: TOKENS_HOW_COMPUTED,
  toCsv: tokensBoughtCsv,
  Component: TokensBoughtChart,
};
