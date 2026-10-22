import { useCallback, useMemo, type CSSProperties } from "react";
import { BarChart } from "echarts/charts";
import type { BarSeriesOption } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import type { ChartDef, ChartProps, GoalView, Provenance, Results } from "../contract";
import { baseOption, tooltipChrome } from "./base";
import { c5Figures, COVERAGE_MESSAGE_ABOVE } from "../compute/goals";
import type { C5Figures } from "../compute/goals";
import { ChartFigure } from "./ChartFigure";
import { BELOW_FLOOR, barRowsHeight, comparisonOf, qualityText } from "./comparison";
import type { Comparison, OptionBar } from "./comparison";
import { fmtMultiple, fmtTokens, fmtTokensSig, fmtUsd } from "../shared/format";
import { solvedNotice } from "../shared/goalNotice";
import "../styles/goals.css";
import { esc, fmtBudget, toCsvText } from "./format";
import { BRAND, INFRAVANA_LABEL, TODAY_LABEL } from "./labels";
import { textWidth } from "./measure";
import { decalOf, optionDecal, optionStyle } from "./patterns";
import type { ProvenancePart } from "./ProvenanceNotes";
import { PROVENANCE_TEXT, outlineOf } from "./provenanceStyle";
import type { Tokens } from "./tokens";
import type { Dims } from "./useEChart";
import { wrapText } from "./wrap";

use([BarChart, GridComponent, TooltipComponent]);

/** The label of a grey bar that is not solved (spec 6.2, acceptance 7). */
export const ESTIMATED_LABEL = "Estimated at its average price";

/** What the chart says while a solve for the tab has not produced a value yet. */
const PENDING_TEXT = "Working out the volumes your budget buys";

/** A multiple as C5 states it: above ten times it is not given as a figure (spec 5.2). */
function multipleText(multiple: number): string {
  return multiple > COVERAGE_MESSAGE_ABOVE ? `more than ${COVERAGE_MESSAGE_ABOVE}x` : fmtMultiple(multiple);
}

/** The note under the compared bars in G4, whose figures are at the relaxed plan. */
const TRADEOFF_NOTE = "at the trade-off you chose";

/** True when `bar` is a grey option the figures mark as estimated at its average price. */
function isEstimated(figures: C5Figures, bar: { kind: string; key: string }): boolean {
  return bar.kind === "option" && (figures.options.find((o) => o.pattern_id === bar.key)?.estimated_at_average_price ?? false);
}

/** The bars, top to bottom: the comparator, InfraVana, then each other grey option by rank. */
interface Bar {
  key: string;
  kind: "comparator" | "infravana" | "option";
  name: string;
  tokens: number;
  provenance: Provenance;
  option: OptionBar | null;
}

function barsOf(results: Results, cmp: Comparison, figures: C5Figures): Bar[] {
  const b = results.tokens_bought;
  return [
    {
      key: "comparator",
      kind: "comparator",
      name: `${TODAY_LABEL}: ${cmp.label}`,
      tokens: figures.today_tokens,
      provenance: b.provenance.today,
      option: null,
    },
    {
      key: "infravana",
      kind: "infravana",
      name: INFRAVANA_LABEL,
      tokens: figures.infravana_tokens,
      provenance: b.provenance.infravana,
      option: null,
    },
    // Other grey options are never solved: their bars are the budget over their average price.
    ...cmp.options.map((o) => ({
      key: o.alt.pattern_id,
      kind: "option" as const,
      name: o.alt.label,
      tokens: o.alt.tokens_at_budget,
      provenance: o.alt.provenance,
      option: o,
    })),
  ];
}

/** Width of the row-name column. */
function labelColumn(width: number): number {
  const narrow = width < 600;
  return Math.round(Math.min(narrow ? 128 : 220, Math.max(narrow ? 96 : 150, width * (narrow ? 0.34 : 0.26))));
}

/**
 * The ECharts option for C5: one bar for the comparator, one for InfraVana
 * and one for each other grey option, tokens bought for the budget. `figures`
 * is where the two compared bars take their numbers (see `c5Figures` in compute/goals.ts).
 */
export function buildTokensBoughtOption(
  results: Results,
  size: "stage" | "thumb",
  t: Tokens,
  dims: Dims,
  figures: C5Figures = c5Figures("G1", results, null),
): EChartsCoreOption {
  const stage = size === "stage";
  const b = results.tokens_bought;
  const cmp = comparisonOf(results);
  const bars = barsOf(results, cmp, figures);
  const narrow = dims.width < 600;
  const column = labelColumn(dims.width);

  /** The quality line of a grey bar and the multiple line of InfraVana's: beside the bar when there is room, under its name when not. */
  const detailLines = (bar: Bar): string[] => {
    if (bar.kind === "infravana") {
      const multiple = `${multipleText(figures.multiple)} as many${narrow ? "" : ` as ${cmp.label}`}`;
      return figures.at_tradeoff ? [multiple, TRADEOFF_NOTE] : [multiple];
    }
    const alt = bar.kind === "comparator" ? cmp.comparator : (bar.option?.alt ?? null);
    if (!alt) return [];
    const mark = alt.meets_floors ? "" : narrow ? ", below floor" : `, ${BELOW_FLOOR}`;
    return [`${qualityText(alt)}${mark}`];
  };

  /** The right-hand label of a bar, as lines. On a narrow chart it is the figure alone, so the bars keep their width. */
  const labelLines = (bar: Bar): { text: string; style: "v" | "inf" | "sub" }[] => {
    const main = {
      text: narrow ? fmtTokensSig(bar.tokens) : `${fmtTokensSig(bar.tokens)} tokens`,
      style: bar.kind === "infravana" ? ("inf" as const) : ("v" as const),
    };
    return narrow ? [main] : [main, ...detailLines(bar).map((text) => ({ text, style: "sub" as const }))];
  };

  const labelWidth = Math.max(
    0,
    ...bars.flatMap((bar) =>
      labelLines(bar).map((l) => textWidth(l.text, l.style === "sub" ? t.fontXs : t.fontSm, t.weightBold, t.fontSans)),
    ),
  );
  const left = stage ? column + t.space3 : 4;
  const right = stage ? Math.ceil(labelWidth) + t.space3 : 4;
  const grid = stage ? { left, right, top: 12, bottom: 28 } : { left: 4, right: 4, top: 6, bottom: 6 };

  const rich = {
    v: { color: t.text, fontSize: t.fontSm, lineHeight: t.lineSm, fontWeight: t.weightBold },
    inf: { color: t.accentStrong, fontSize: t.fontSm, lineHeight: t.lineSm, fontWeight: t.weightBold },
    sub: { color: t.textSecondary, fontSize: t.fontXs, lineHeight: t.lineXs },
  };
  const richLabel = (bar: Bar) =>
    labelLines(bar)
      .map((l) => `{${l.style}|${l.text}}`)
      .join("\n");

  const data = bars.map((bar) => {
    const o = outlineOf(bar.provenance, false, t);
    const style =
      bar.kind === "comparator"
        ? { color: t.today1, decal: undefined }
        : bar.kind === "infravana"
          ? { color: t.accent, decal: decalOf("P1", t.patternOnFill) }
          : bar.option
            ? { color: t[optionStyle(bar.option.rank).fill], decal: optionDecal(bar.option.rank, t) }
            : { color: t.today2, decal: undefined };
    return {
      value: bar.tokens,
      itemStyle: { ...style, borderColor: o.borderColor, borderWidth: o.borderWidth, borderType: o.borderType },
    };
  });

  const series: BarSeriesOption = {
    type: "bar",
    barWidth: "58%",
    silent: !stage,
    emphasis: { disabled: true },
    data,
    label: {
      show: stage,
      position: "right",
      formatter: (p) => richLabel(bars[p.dataIndex]),
      rich,
    },
  };

  return {
    ...baseOption(t, stage),
    grid,
    tooltip: stage
      ? {
          ...tooltipChrome(t),
          trigger: "item",
          formatter: (params: unknown) => {
            const bar = bars[(params as { dataIndex: number }).dataIndex];
            if (!bar) return "";
            const lines = [
              `<strong>${esc(bar.name)}</strong>`,
              `${fmtTokensSig(bar.tokens)} tokens a quarter for ${fmtBudget(b.budget_usd)}`,
            ];
            const alt = bar.kind === "comparator" ? cmp.comparator : (bar.option?.alt ?? null);
            if (alt) {
              lines.push(esc(qualityText(alt)));
              if (!alt.meets_floors) lines.push(`Misses ${BELOW_FLOOR}`);
            }
            if (isEstimated(figures, bar)) lines.push(ESTIMATED_LABEL);
            lines.push(`Source: ${PROVENANCE_TEXT[bar.provenance].toLowerCase()}`);
            return lines.join("<br/>");
          },
        }
      : undefined,
    xAxis: {
      type: "value",
      min: 0,
      show: stage,
      axisLabel: { color: t.textSecondary, fontSize: t.fontXs, hideOverlap: true, formatter: (v: number) => fmtTokens(v) },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: t.grid } },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: bars.map((x) => x.key),
      show: stage,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: t.borderStrong } },
      axisLabel: {
        interval: 0,
        margin: t.space3,
        formatter: (_value: string, index: number) => {
          const bar = bars[index];
          if (!bar) return "";
          const style = bar.kind === "infravana" ? "inf" : "v";
          const lines = wrapText(bar.name, column, t.fontSm, t.weightBold, t.fontSans).map((l) => `{${style}|${l}}`);
          const sub = [
            ...(narrow ? detailLines(bar) : []),
            ...(isEstimated(figures, bar) ? [ESTIMATED_LABEL] : []),
          ];
          for (const text of sub) {
            lines.push(...wrapText(text, column, t.fontXs, t.weightBold, t.fontSans).map((l) => `{sub|${l}}`));
          }
          return lines.join("\n");
        },
        rich,
      },
    },
    series: [series],
  };
}

/**
 * What chart C5 draws for a tab (spec 6.2, "C5 follows the tab"): the figures
 * of the tab, a sentence that replaces them (the spec 5.2 messages, a solve
 * still on its way, a solve that failed) and whether the figures are the
 * previous value awaiting a new one.
 */
export interface C5State {
  /** The figures to draw; null in G2 and G3 until the solve has produced a value. */
  figures: C5Figures | null;
  /** A sentence shown in place of the chart, or null when the chart is shown. */
  notice: string | null;
  /** True in G2 and G3 while no solve has produced a value yet (and none has failed). */
  pending: boolean;
  stale: boolean;
}

export function c5StateOf(results: Results, view: GoalView | undefined): C5State {
  const goal = view?.goal ?? "G1";
  if (goal !== "G2" && goal !== "G3") {
    return { figures: c5Figures(goal, results, null), notice: null, pending: false, stale: false };
  }
  if (!view || view.solve === null) {
    const failed = view?.error ?? null;
    const text = failed ? `These volumes could not be worked out: ${failed}` : PENDING_TEXT;
    return { figures: null, notice: text, pending: failed === null, stale: false };
  }
  const notice = solvedNotice(view.solve, comparisonOf(results).label);
  // The coverage message replaces the headline multiple, not the bars: they are still true.
  const replaces = notice !== null && notice.kind !== "coverage";
  return {
    figures: c5Figures(goal, results, view.solve),
    notice: replaces ? notice.text : null,
    pending: false,
    stale: view.stale,
  };
}

/**
 * One sentence from Results. The multiple is the tab's own (spec 6.2): the
 * linear one in G1, so the caption and the headline strip say the same
 * thing, the solved one in G2 and G3. It names the Today it is measured against.
 */
export function tokensBoughtCaption(results: Results, goalView?: GoalView): string {
  const b = results.tokens_bought;
  const cmp = comparisonOf(results);
  const state = c5StateOf(results, goalView);
  if (state.notice !== null && !state.pending) return `${state.notice}.`;
  const budget = fmtBudget(b.budget_usd);
  const buyer = cmp.comparator ? `with ${cmp.label}` : "today";
  const basis =
    goalView?.goal === "G3"
      ? ", counting the most people each budget covers"
      : goalView?.goal === "G2"
        ? ", counting the most AI work each budget covers"
        : "";
  const sentence = (todayTokens: string, infravanaTokens: string, ratio: string) =>
    `The same ${budget} budget buys ${todayTokens} tokens a quarter ${buyer} and ${infravanaTokens} with ${BRAND}, ${ratio}${basis}.`;
  // While the volumes are being worked out the sentence keeps its shape, with the figures left blank, so the page below it does not move.
  if (state.figures === null) return sentence("\u2026", "\u2026", "\u2026 times as many");
  const figures = state.figures;
  const multiple = figures.multiple;
  // Dollar figures and token counts all carry three significant digits.
  const shown = multipleText(multiple);
  const ratio =
    shown === "1.0x"
      ? "about the same number"
      : multiple > COVERAGE_MESSAGE_ABOVE
        ? `${shown.slice(0, -1)} times as many`
        : multiple > 1
          ? `${shown} as many`
          : `${shown.slice(0, -1)} times the tokens`;
  return sentence(fmtTokensSig(figures.today_tokens), fmtTokensSig(figures.infravana_tokens), ratio);
}

const TOKENS_HOW_COMPUTED =
  "This is how much work the same budget pays for. " +
  "The first bar is the way of buying that the page compares against: the budget buys tokens (the small pieces of text that models read and write) at its prices. " +
  `With ${BRAND}, it buys the same models at a better price, and moves some work to cheaper open models ` +
  "that meet your minimum quality and response speed. " +
  "Each grey bar below is another way companies buy today, drawn at that way's average price, with a quality score beside it, because a cheaper way may buy weaker models. " +
  "On the tabs for more AI or more people, the first two bars are volumes worked out for each budget: the most AI work, or the most people, each side's budget can pay for. " +
  "All prices here are illustrative.";

/** Header first, then the compared bars, the delta label and each option bar. */
export function tokensBoughtCsv(results: Results): string {
  const b = results.tokens_bought;
  const cmp = comparisonOf(results);
  const rows: (string | number | null)[][] = [
    [`${TODAY_LABEL}: ${cmp.label}`, "tokens_per_quarter", b.today_tokens, b.provenance.today, cmp.comparator?.quality_score ?? null],
    [INFRAVANA_LABEL, "tokens_per_quarter", b.infravana_tokens, b.provenance.infravana, null],
    [INFRAVANA_LABEL + " vs " + TODAY_LABEL, "tokens_multiple", results.headline.tokens_multiple, null, null],
    ...cmp.options.map((o) => [
      `${TODAY_LABEL}: ${o.alt.label}`,
      "tokens_per_quarter",
      o.alt.tokens_at_budget,
      o.alt.provenance,
      o.alt.quality_score,
    ]),
  ];
  return toCsvText(["series", "measure", "value", "provenance", "quality_score"], rows);
}

/** Where each drawn bar comes from, for the badges under the chart. */
export function tokensBoughtParts(results: Results): ProvenancePart[] {
  const b = results.tokens_bought;
  const cmp = comparisonOf(results);
  return [
    { group: `${TODAY_LABEL}: ${cmp.label}`, part: "", provenance: b.provenance.today },
    { group: INFRAVANA_LABEL, part: "", provenance: b.provenance.infravana },
    ...cmp.options.map((o) => ({ group: "Other Today options", part: o.alt.label, provenance: o.alt.provenance })),
  ];
}

export function TokensBoughtChart({ results, size, goalView }: ChartProps) {
  const state = useMemo(() => c5StateOf(results, goalView), [results, goalView]);
  // Until a solve has produced a value the chart is built from the linear figures and hidden behind its notice.
  const figures = useMemo(() => state.figures ?? c5Figures("G1", results, null), [state.figures, results]);
  const build = useCallback(
    (tokens: Tokens, dims: Dims) => buildTokensBoughtOption(results, size, tokens, dims, figures),
    [results, size, figures],
  );
  const b = results.tokens_bought;
  const cmp = comparisonOf(results);
  const bars = barsOf(results, cmp, figures);
  const height = barRowsHeight(results);
  // The "Estimated at its average price" line wraps to two more lines under a row name on a phone: give those rows room.
  // Counted from the goal, not the figures, so the box is the same before the solve answers.
  const estimatedRows = goalView?.goal === "G2" || goalView?.goal === "G3" ? figures.options.length : 0;
  const phoneHeight = barRowsHeight(results, true) + estimatedRows * 44;
  const covered = state.notice !== null;
  return (
    // The same box in every state, so a solve in progress never moves the page: the notice sits over the chart's own area.
    <div
      className="chart-solve chart-figure"
      style={{ "--figure-height": `${height}px`, "--figure-height-phone": `${phoneHeight}px` } as CSSProperties}
      data-covered={covered ? "true" : undefined}
      data-stale={state.stale ? "true" : undefined}
      aria-busy={state.stale || state.figures === null ? true : undefined}
    >
      <ChartFigure
        size={size}
        height={height}
        phoneHeight={phoneHeight}
        parts={tokensBoughtParts(results)}
        ariaLabel={tokensBoughtCaption(results, goalView)}
        build={build}
        table={{
          caption: `Tokens bought a quarter for a ${fmtUsd(b.budget_usd)} budget.`,
          headers: ["Series", "Tokens a quarter"],
          rows: covered
            ? [[state.notice ?? "", ""]]
            : bars.map((bar) => [
                bar.name,
                `${fmtTokensSig(bar.tokens)}${isEstimated(figures, bar) ? ` (${ESTIMATED_LABEL.toLowerCase()})` : ""}`,
              ]),
        }}
      />
      {covered && size === "stage" ? (
        <p className="chart-solve__notice" role="status">
          {state.notice}
        </p>
      ) : null}
    </div>
  );
}

export const tokensBoughtChart: ChartDef = {
  id: "C5",
  title: "How much AI work the budget buys",
  caption: tokensBoughtCaption,
  howComputed: TOKENS_HOW_COMPUTED,
  toCsv: tokensBoughtCsv,
  // Benefit boxes (spec 6.4) are built in a later step.
  benefits: (_results, _context) => [],
  Component: TokensBoughtChart,
};
