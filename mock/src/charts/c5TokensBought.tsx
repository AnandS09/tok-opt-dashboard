import { useCallback } from "react";
import { BarChart } from "echarts/charts";
import type { BarSeriesOption } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import type { ChartDef, ChartProps, Results } from "../contract";
import { baseOption, tooltipChrome } from "./base";
import { Favours } from "../components/Favours";
import { ChartFrame } from "./ChartFrame";
import type { BadgeItem } from "./ChartFrame";
import { fmtMultiple, fmtTokens, fmtTokensSig, fmtUsd, fmtUsdSig } from "../shared/format";
import { esc, PROVENANCE_TEXT, toCsvText } from "./format";
import { filledStyle } from "./provenanceStyle";
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
    { name: TODAY_LABEL, tokens: b.today_tokens, provenance: b.provenance.today },
    { name: INFRAVANA_LABEL, tokens: b.infravana_tokens, provenance: b.provenance.infravana },
  ];
  const bars: BarSeriesOption = {
    type: "bar",
    barWidth: "42%",
    silent: !stage,
    emphasis: { disabled: true },
    data: [
      { value: b.today_tokens, itemStyle: filledStyle(t.today1, b.provenance.today, t) },
      { value: b.infravana_tokens, itemStyle: filledStyle(t.accent, b.provenance.infravana, t) },
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
              `Data: ${PROVENANCE_TEXT[side.provenance]}`,
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
      max: Math.max(b.today_tokens, b.infravana_tokens) * 1.2,
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
  "The label shows how many times as many tokens that is. A dashed outline on a bar marks a figure that comes from a model, and a dotted outline marks one reported by a vendor. " +
  "Every price comes from the data files, and in this mock all of it is invented placeholder data.";

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

/** The delta label: the shared "favours InfraVana" marker (check mark, colour and hidden text) around the multiple. */
function DeltaLabel({ results, stage }: { results: Results; stage: boolean }) {
  const multiple = results.headline.tokens_multiple;
  // Decided on the number as displayed ("1.0x" is no change), as the headline strip does.
  const shown = Math.round(multiple * 10) / 10;
  return (
    <p
      style={{
        margin: 0,
        fontSize: stage ? "var(--font-size-xl)" : "var(--font-size-sm)",
        fontWeight: "var(--font-weight-bold)",
        fontVariantNumeric: "tabular-nums lining-nums",
      }}
    >
      <Favours favoursInfravana={shown > 1} noChange={shown === 1}>
        {fmtMultiple(multiple)} tokens
      </Favours>
    </p>
  );
}

function badgeItems(results: Results): BadgeItem[] {
  const b = results.tokens_bought;
  return [
    { series: TODAY_LABEL, provenance: b.provenance.today },
    { series: INFRAVANA_LABEL, provenance: b.provenance.infravana },
  ];
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
      badges={badgeItems(results)}
      header={<DeltaLabel results={results} stage={size === "stage"} />}
      table={{
        caption: `Tokens bought a quarter for a ${fmtUsd(b.budget_usd)} budget.`,
        headers: ["Series", "Tokens a quarter", "Data"],
        rows: [
          [TODAY_LABEL, fmtTokens(b.today_tokens), PROVENANCE_TEXT[b.provenance.today]],
          [INFRAVANA_LABEL, fmtTokens(b.infravana_tokens), PROVENANCE_TEXT[b.provenance.infravana]],
        ],
      }}
    />
  );
}

export const tokensBoughtChart: ChartDef = {
  id: "C5",
  title: "Tokens bought for the budget",
  caption: tokensBoughtCaption,
  howComputed: TOKENS_HOW_COMPUTED,
  toCsv: tokensBoughtCsv,
  Component: TokensBoughtChart,
};
