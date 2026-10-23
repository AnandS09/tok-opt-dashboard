/**
 * Development check for the charts, not part of the app (the app never
 * imports it). Given a `Results` and a set of tokens it renders every
 * registered chart server-side and returns what is wrong, if anything.
 *
 * Checks, per chart: the ECharts option draws to SVG without NaN or
 * undefined; every colour in the drawing is a token value; the caption is one
 * sentence that quotes only numbers present in Results and agrees with the
 * headline; the CSV is well-formed RFC 4180 with the plotted rows; the React
 * markup carries the closed "Where these numbers come from" disclosure and the
 * source line at stage size, and nothing but the picture at thumb size.
 *
 * The chart styling rules of spec 15.10 and 15.11 have their own checks, each
 * read from the drawn option or the drawn SVG: no decal, pattern, dash or dot
 * anywhere; the comparator in `today1` and option k in the colour of rank k;
 * bars 24px thick with a 2px paper gap between segments and no other border;
 * one labelled "Saved" block in C1; every Today option a bar in C3; the row
 * name above a full-width bar on a phone; every label drawn on a fill at
 * 4.5:1 or more against it; no provenance word outside the disclosure. The
 * comparator and quality marks follow `Results`, never a name in the code.
 * `runSelfTests` breaks each of these on purpose and requires the check to fail.
 *
 * It needs no browser. `runCheck.mjs` bundles this file, builds the tokens
 * from the stylesheets and calls `runChartChecks` and the others.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { init, use } from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import type { ChartDef, ChartId, Provenance, Results, Scenario, SolveResult, Tables } from "../../contract";
import { ComparatorSelect } from "../../components/ComparatorSelect";
import { compute } from "../../compute";
import { choiceFor, selectedComparator } from "../../store/comparator";
import { allocationCsv, buildAllocationOption, planBar } from "../c1Allocation";
import { isSavings, isSpend, spendLabel } from "../c1Plan";
import { C3Key } from "../C3Key";
import { BAR_MAX_PX, BAR_WIDTH_PCT, buildCostPerMtokOption } from "../c3CostPerMtok";
import { ESTIMATED_LABEL } from "../c5TokensBought";
import { c5Figures } from "../../compute/goals";
import { buildTokensBoughtOption } from "../c5TokensBought";
import { comparisonOf } from "../comparison";
import { TEXT_CONTRAST, contrastRatio } from "../contrast";
import { fmtMultiple, fmtPct, fmtTokensSig, fmtUsdSig } from "../../shared/format";
import { INFRAVANA_LABEL, MODEL_CLASS_NAME, SAVINGS_LABEL } from "../labels";
import { textWidth } from "../measure";
import { MAX_OPTIONS, OPTION_STYLES } from "../patterns";
import { MODELLED_SOURCE, NO_ADDRESS, PLACEHOLDER_NOTE, PRICE_LIST, PROVENANCE_TEXT, ProvenanceNotes } from "../ProvenanceNotes";
import type { ProvenancePart } from "../ProvenanceNotes";
import { chartRegistry } from "../registry";
import type { Tokens } from "../tokens";
import type { Dims } from "../useEChart";

use([SVGRenderer]);

type Builder = (results: Results, size: "stage" | "thumb", t: Tokens, dims: Dims) => EChartsCoreOption;

const BUILDERS: Partial<Record<ChartId, Builder>> = {
  C1: buildAllocationOption,
  C5: buildTokensBoughtOption,
  C3: buildCostPerMtokOption,
};

/** Chart sizes the stage is checked at: a phone, the narrow-layout limit's neighbour, and the desktop stage. */
export const STAGE_SIZES: Dims[] = [
  { width: 340, height: 300 },
  { width: 560, height: 340 },
  { width: 760, height: 380 },
];
const THUMB_DIMS: Dims = { width: 200, height: 112 };

export interface CheckReport {
  problems: string[];
  notes: string[];
}

export function renderSvg(option: EChartsCoreOption, dims: Dims): string {
  const chart = init(null, undefined, { renderer: "svg", ssr: true, width: dims.width, height: dims.height });
  try {
    chart.setOption(option);
    return chart.renderToSVGString();
  } finally {
    chart.dispose();
  }
}

/** Every finite number anywhere in a value. */
function numbersIn(value: unknown, out: number[] = []): number[] {
  if (typeof value === "number" && Number.isFinite(value)) out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => numbersIn(v, out));
  else if (value !== null && typeof value === "object") Object.values(value).forEach((v) => numbersIn(v, out));
  return out;
}

const UNIT_SIZE: Record<string, number> = { "": 1, K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
const NUMBER_IN_TEXT = /\$?\d[\d,]*(?:\.\d+)?[KMBT]?x?%?/g;
const NUMBER_PARTS = /^(\$?)(\d[\d,]*(?:\.(\d+))?)([KMBT]?)(x?)(%?)$/;

/** A number as written in a caption: its value, how far a rounding to its last digit can move it, and its shape. */
function parseCaptionNumber(text: string) {
  const m = NUMBER_PARTS.exec(text);
  if (!m) return null;
  const decimals = m[3]?.length ?? 0;
  const unit = UNIT_SIZE[m[4]];
  return {
    value: Number.parseFloat(m[2].replace(/,/g, "")) * unit,
    tolerance: 0.5 * 10 ** -decimals * unit * 1.0001,
    dollar: m[1] === "$",
    unit: m[4],
    decimals,
    /** Significant digits as written: "19.0" is 3, "0.0" is 0, "100" is 3. */
    significant: m[2].replace(/[,.]/g, "").replace(/^0+/, "").length,
  };
}

/** Minimal RFC 4180 reader, to check the writer against something independent of it. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r" && text[i + 1] === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
    } else field += c;
  }
  row.push(field);
  rows.push(row);
  return rows;
}

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const RGB = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/g;

/** The stylesheet zrender's server-side renderer adds to every svg (animation and hover rules). */
export const STYLE_BLOCK = /<style[^>]*>[\s\S]*?<\/style>/g;

function toHex(r: string, g: string, b: string): string {
  return `#${[r, g, b].map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Every colour a drawing uses, written as hex or as a functional rgb or rgba
 * notation, returned as lower-case hex (a colour with an alpha below 1 is
 * returned in its original notation, so it never matches a token).
 *
 * The stylesheet block is left out of `drawn` on purpose. zrender's
 * server-side renderer writes a lightened copy of every fill into its hover
 * rules, whether or not the chart disables emphasis; the live canvas chart has
 * `emphasis.disabled` and never draws them. Those colours are returned
 * separately as `hoverOnly`, so a colour that appears only there is reported
 * in the notes, and any colour drawn on a shape is still checked.
 */
export function coloursOf(svg: string): { drawn: Set<string>; hoverOnly: Set<string> } {
  const read = (text: string) => {
    const out = new Set<string>();
    for (const m of text.match(HEX) ?? []) out.add(m.toLowerCase());
    for (const m of text.matchAll(RGB)) {
      out.add(m[4] !== undefined && Number(m[4]) < 1 ? m[0] : toHex(m[1], m[2], m[3]));
    }
    return out;
  };
  const styles = (svg.match(STYLE_BLOCK) ?? []).join("\n");
  const drawn = read(svg.replace(STYLE_BLOCK, ""));
  const hoverOnly = new Set([...read(styles)].filter((c) => !drawn.has(c)));
  return { drawn, hoverOnly };
}

/** The texts of an svg read as running text: a label that wraps over several lines reads as one phrase. */
const joinedText = (svg: string): string => textsOf(svg).join(" ");
const countOf = (text: string, phrase: string): number => text.split(phrase).length - 1;

/** Texts drawn into an svg. */
export function textsOf(svg: string): string[] {
  return [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
}

/** Series of an ECharts option, as the loosely typed objects the builders return. */
export type Obj = Record<string, unknown>;
export const seriesOf = (option: EChartsCoreOption): Obj[] => ((option as Obj).series as Obj[]) ?? [];
export const dataOf = (s: Obj): (Obj | null)[] => (s.data as (Obj | null)[]) ?? [];
export const styleOf = (d: Obj | null): Obj => ((d?.itemStyle as Obj | undefined) ?? {}) as Obj;

// ---------------------------------------------------------------------------
// The one table the roles are checked against, written out here on purpose
// ---------------------------------------------------------------------------

/**
 * The identity of each option rank (spec 15.11), written out here on purpose:
 * the code's own table is what the drawings are built from, so a check
 * against it alone cannot see a wrong edit of it. The comparator is `today1`.
 */
const DESIGN_OPTIONS = [
  { fill: "today2", marker: "circle" },
  { fill: "today3", marker: "rect" },
  { fill: "today4", marker: "triangle" },
] as const;

/** The colour of option rank k: `today(k+1)` (spec 15.11). */
const rankFill = (t: Tokens, rank: number): string => t[DESIGN_OPTIONS[rank - 1].fill];

/** The option table against the spec: three option colours after the comparator's, no pattern, at most three options. */
export function designTableProblems(): string[] {
  const problems: string[] = [];
  DESIGN_OPTIONS.forEach((want, i) => {
    const got = OPTION_STYLES[i];
    if (!got || got.fill !== want.fill || got.marker !== want.marker) {
      problems.push(`option rank ${i + 1} is ${JSON.stringify(got)}, spec 15.11 says ${JSON.stringify(want)}`);
    }
  });
  if (OPTION_STYLES.length !== DESIGN_OPTIONS.length) problems.push(`${OPTION_STYLES.length} option ranks, spec 15.11 has ${DESIGN_OPTIONS.length}`);
  if (MAX_OPTIONS !== 3) problems.push(`MAX_OPTIONS is ${MAX_OPTIONS}: four Today bars in all are the cap of spec 6.1, and the palette has four Today colours`);
  if (OPTION_STYLES.some((s) => Object.keys(s).some((k) => k === "pattern"))) problems.push("an option style names a pattern");
  return problems;
}

/** A value anywhere in an option, visited with the key it sits under. */
function walk(value: unknown, visit: (key: string, v: unknown, path: string) => void, path = ""): void {
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, visit, `${path}[${i}]`));
  else if (value !== null && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      visit(k, v, `${path}.${k}`);
      walk(v, visit, `${path}.${k}`);
    }
  }
}

/**
 * Spec 15.10 and 15.11: no pattern, decal, dash or dot anywhere. In the option
 * no `decal`, no `aria.decal`, no `borderType` or line `type` other than solid,
 * no dash array; in the drawing no `<pattern>` and no `stroke-dasharray`.
 */
export function noPatternOrDashProblems(option: EChartsCoreOption, svg: string | null, where: string): string[] {
  const problems: string[] = [];
  walk(option, (key, v, path) => {
    if (key === "decal" && v !== undefined) problems.push(`${where}: a decal at ${path}`);
    if (key === "borderType" && v !== "solid") problems.push(`${where}: borderType ${JSON.stringify(v)} at ${path}`);
    if (key === "type" && path.includes("lineStyle") && v !== "solid") problems.push(`${where}: line type ${JSON.stringify(v)} at ${path}`);
    if (key === "dashArrayX" || key === "dashArrayY") problems.push(`${where}: a dash array at ${path}`);
  });
  if (svg !== null) {
    if (/<pattern/.test(svg)) problems.push(`${where}: the drawing holds a <pattern>`);
    if (/stroke-dasharray/.test(svg)) problems.push(`${where}: the drawing holds a dashed stroke`);
  }
  return problems;
}

/** A drawn bar block has no border and no outline of any kind (spec 15.11): the gap between segments is a rectangle of its own. */
function borderProblems(style: Obj, where: string): string[] {
  const problems: string[] = [];
  if (typeof style.borderWidth === "number" && style.borderWidth > 0) problems.push(`${where}: a border ${style.borderWidth}px wide in ${String(style.borderColor)}`);
  if (style.borderType !== undefined && style.borderType !== "solid") problems.push(`${where}: a border drawn ${JSON.stringify(style.borderType)}`);
  return problems;
}

/**
 * The paper gaps between neighbouring segments (spec 15.11): one rectangle on each boundary of a bar of several segments,
 * `separatorWidth` wide, in the paper colour (`separator`), as tall as the bar, centred on the boundary. The series is run
 * through a stand-in for the library's drawing context, so the shapes it would draw are read, not assumed.
 */
function gapProblems(expected: Expected[], series: Obj[], t: Tokens, stage: boolean, where: string): string[] {
  const problems: string[] = [];
  const rows = [...new Set(expected.map((e) => e.row))];
  const wanted: [number, number][] = [];
  for (const r of rows) {
    const inRow = expected.filter((e) => e.row === r);
    let at = 0;
    inRow.forEach((e, k) => {
      at += e.usd;
      if (k < inRow.length - 1) wanted.push([at, r]);
    });
  }
  const gap = series.find((s) => s.type === "custom");
  if (wanted.length === 0) {
    if (gap) problems.push(`${where}: a gap series, but no bar has two segments`);
    return problems;
  }
  if (!gap) return [`${where}: no gap series, and ${wanted.length} boundaries between segments`];
  const data = dataOf(gap) as unknown as number[][];
  if (data.length !== wanted.length || data.some((d, i) => Math.abs((d[0] as number) - (wanted[i] as [number, number])[0]) > 1e-6 * Math.max(1, (d[0] as number)) || d[1] !== (wanted[i] as [number, number])[1])) {
    problems.push(`${where}: the gaps are at ${JSON.stringify(data)}, the segments end at ${JSON.stringify(wanted)}`);
  }
  const render = gap.renderItem as ((params: unknown, api: unknown) => Obj) | undefined;
  if (typeof render !== "function") return [...problems, `${where}: the gap series draws nothing`];
  const PX = 0.002;
  const ROW = 60;
  data.slice(0, 1).forEach((d) => {
    const api = {
      value: (i: number) => (d as number[])[i],
      coord: (v: number[]) => [(v[0] as number) * PX, (v[1] as number) * ROW + ROW / 2],
      size: () => [0, ROW],
    };
    const drawn = render({}, api);
    const shape = (drawn.shape ?? {}) as Obj;
    const style = (drawn.style ?? {}) as Obj;
    const centre = (d[0] as number) * PX;
    if (drawn.type !== "rect") problems.push(`${where}: a gap is drawn as a ${String(drawn.type)}`);
    if (shape.width !== t.separatorWidth) problems.push(`${where}: a gap is ${String(shape.width)}px wide, the separator is ${t.separatorWidth}px`);
    if (style.fill !== t.separator) problems.push(`${where}: a gap is filled ${String(style.fill)}, the paper is ${t.separator}`);
    if (Math.abs(Number(shape.x) + Number(shape.width) / 2 - centre) > 1e-9) problems.push(`${where}: a gap is not centred on its boundary`);
    if (stage && shape.height !== t.barThickness) problems.push(`${where}: a gap is ${String(shape.height)}px tall, the bar is ${t.barThickness}px`);
    const barCentre = (d[1] as number) * ROW + ROW / 2;
    if (Math.abs(Number(shape.y) + Number(shape.height) / 2 - barCentre) > 1e-9) problems.push(`${where}: a gap is not centred on its bar`);
  });
  return problems;
}

// ---------------------------------------------------------------------------
// C1
// ---------------------------------------------------------------------------

type PieceKind = "channel" | "infravana" | "saved" | "option";

interface Expected {
  row: number;
  kind: PieceKind;
  fill: string;
  usd: number;
  /** The paper or ink the label inside must be, by contrast. */
}

/** The blocks C1 draws, in series order, from `Results` and the spec's role table. */
function c1Expected(results: Results, t: Tokens): Expected[] {
  const a = results.allocation;
  const cmp = comparisonOf(results);
  const out: Expected[] = [];
  for (const s of planBar(a.today, "today")) out.push({ row: 0, kind: "channel", fill: t.today1, usd: s.usd });
  const planned = planBar(a.infravana, "infravana");
  for (const s of planned.filter((x) => x.tone === "spend")) out.push({ row: 1, kind: "infravana", fill: t.accent, usd: s.usd });
  const saved = planned.filter((x) => x.tone !== "spend" && x.usd > 0);
  if (saved.length > 0) out.push({ row: 1, kind: "saved", fill: t.saved, usd: saved.reduce((sum, s) => sum + s.usd, 0) });
  cmp.options.forEach((o, i) => out.push({ row: 2 + i, kind: "option", fill: rankFill(t, o.rank), usd: o.alt.total_usd }));
  return out;
}

/** The ink or paper a label may be, whichever reaches 4.5:1 on its fill (spec 15.11). */
function labelProblems(label: Obj | undefined, fill: string, where: string): string[] {
  if (!label || label.show === false) return [];
  const colour = label.color;
  if (typeof colour !== "string") return [`${where}: a label with no colour`];
  const ratio = contrastRatio(colour, fill);
  return ratio >= TEXT_CONTRAST ? [] : [`${where}: label ${colour} on ${fill} is ${ratio.toFixed(2)}:1, needs ${TEXT_CONTRAST}`];
}

/**
 * C1's structure (spec 6.1, 15.10, 15.11): the comparator and InfraVana bars
 * are segmented (InfraVana ending in one block named "Saved" worth both
 * savings); each grey option is one unsegmented bar in its rank's solid
 * colour; the comparator is `today1` and InfraVana the accent; bars are
 * `barThickness` thick, outlined by nothing, with a paper gap of
 * `separatorWidth` on each boundary; the y axis has no rule; on a phone the
 * row name sits above the bar. Works on an option, so a self-test can hand it a
 * broken one.
 */
export function structureProblemsC1(results: Results, option: EChartsCoreOption, t: Tokens, where: string, dims?: Dims): string[] {
  const problems: string[] = [];
  const cmp = comparisonOf(results);
  const expected = c1Expected(results, t);
  const series = seriesOf(option);
  const y = ((option as Obj).yAxis ?? {}) as Obj;
  const stage = y.show !== false;
  const narrow = stage && dims !== undefined && dims.width < 600;
  const pieces = series.filter((s) => s.type !== "custom");
  if (pieces.length !== expected.length) {
    problems.push(`${where}: ${pieces.length} bar series drawn, expected ${expected.length} (segments, one saved block, one bar per option)`);
  }
  problems.push(...gapProblems(expected, series, t, stage, where));
  const rowsDrawn = y.data as unknown[] | undefined;
  if ((rowsDrawn?.length ?? 0) !== 2 + cmp.options.length) {
    problems.push(`${where}: ${rowsDrawn?.length ?? 0} rows, expected ${2 + cmp.options.length}`);
  }
  if (results.today_alternatives.filter((x) => x.is_grey).length > 4) problems.push(`${where}: more than four grey options in Results`);
  if (cmp.options.length > MAX_OPTIONS) problems.push(`${where}: ${cmp.options.length} options, at most ${MAX_OPTIONS}`);

  pieces.forEach((s, i) => {
    const want = expected[i];
    if (!want) return;
    const items = dataOf(s);
    const filled = items.map((d, r) => (d ? r : -1)).filter((r) => r >= 0);
    if (filled.length !== 1 || filled[0] !== want.row) {
      problems.push(`${where}: series ${i} has data in rows [${filled.join(",")}], expected only row ${want.row}`);
    }
    const style = styleOf(items[want.row] ?? null);
    if (style.color !== want.fill) problems.push(`${where}: series ${i} (${want.kind}) is filled ${String(style.color)}, the spec says ${want.fill}`);
    if (style.decal !== undefined) problems.push(`${where}: series ${i} (${want.kind}) has a decal`);
    problems.push(...borderProblems(style, `${where}: series ${i}`));
    if (stage && s.barWidth !== t.barThickness) problems.push(`${where}: series ${i} is ${String(s.barWidth)} thick, bars are ${t.barThickness}px`);
    if (want.kind === "saved") {
      if (s.name !== "Saved") problems.push(`${where}: the saving block is named "${String(s.name)}", not "Saved"`);
      if (Math.abs(Number(items[want.row]?.value) - want.usd) > 1e-6) {
        problems.push(`${where}: the saving block is ${String(items[want.row]?.value)}, the two savings sum to ${want.usd}`);
      }
    }
    if (want.kind === "option") {
      const label = (s.label ?? {}) as Obj;
      // The end label is rich text: the quality in secondary ink, the cost bold in ink (spec 15.11).
      const lr = (label.rich ?? {}) as Record<string, Obj>;
      if (!narrow && label.show !== false && (lr.q?.color !== t.textSecondary || lr.q?.fontWeight !== t.weightRegular || lr.v?.fontWeight !== t.weightBold || lr.v?.color !== t.text)) {
        problems.push(`${where}: the end label of series ${i} is not the quality in secondary ink and the cost in bold`);
      }
      // An option's label stays to the right of its own bar, never above it between two rows (on a phone the row name goes above instead).
      if (!narrow && label.show !== false && label.position !== "right") {
        problems.push(`${where}: option label of series ${i} is placed "${String(label.position)}", not to the right of its bar`);
      }
    } else if (!narrow) {
      problems.push(...labelProblems((s.label ?? {}) as Obj, want.fill, `${where}: series ${i}`));
    }
  });
  // The role table: the comparator's fill is on no option bar, and option fills differ (spec 6.1 acceptance 6, 15.11).
  const optionFills = expected.filter((e) => e.kind === "option").map((e) => e.fill);
  if (optionFills.includes(t.today1)) problems.push(`${where}: an option bar takes the comparator's colour`);
  if (new Set(optionFills).size !== optionFills.length) problems.push(`${where}: two option bars share a colour`);
  if (expected.filter((e) => e.kind === "saved").length > 1) problems.push(`${where}: more than one saving block`);

  if (stage) {
    if (((y.axisLine ?? {}) as Obj).show !== false) problems.push(`${where}: the y axis draws a rule`);
    const axisLabel = (y.axisLabel ?? {}) as Obj;
    // Only the two compared bars have bold row names; the other options are plain (spec 15.11).
    const rows = (axisLabel.rich ?? {}) as Record<string, Obj>;
    if (rows.today?.fontWeight !== t.weightBold || rows.inf?.fontWeight !== t.weightBold) problems.push(`${where}: the names of the compared bars are not bold`);
    if (rows.opt?.fontWeight !== t.weightRegular) problems.push(`${where}: the names of the other options are ${String(rows.opt?.fontWeight)}, not regular`);
    if (narrow) {
      if (axisLabel.show !== false) problems.push(`${where}: the row names stay on the y axis on a phone`);
      rowsDrawn?.forEach((_, r) => {
        const first = expected.findIndex((e) => e.row === r);
        const label = (pieces[first]?.label ?? {}) as Obj;
        const at = label.position;
        if (!Array.isArray(at) || at[0] !== 0 || at[1] !== -4) problems.push(`${where}: row ${r} has no name above its bar (label at ${JSON.stringify(at)})`);
      });
    } else if (axisLabel.show === false) problems.push(`${where}: the row names are hidden on a wide chart`);
    // The budget line: 1px, secondary ink.
    const line = ((pieces[0]?.markLine as Obj | undefined)?.data as Obj[] | undefined)?.[0];
    const ls = ((line?.lineStyle ?? {}) as Obj);
    if (!line) problems.push(`${where}: no budget line`);
    else if (ls.color !== t.budgetLine || ls.width !== t.budgetLineWidth) problems.push(`${where}: the budget line is ${String(ls.color)} at ${String(ls.width)}px, not ${t.budgetLine} at ${t.budgetLineWidth}px`);
  }
  return problems;
}

// ---------------------------------------------------------------------------
// C3
// ---------------------------------------------------------------------------

/**
 * C3's structure (spec 15.11): every Today option and InfraVana a bar series on
 * one category axis, in equal groups; the comparator `today1`, InfraVana the
 * accent, each option the colour of its rank; bars 13% of the class width and
 * at most 44px; a price only where an option has one.
 */
export function structureProblemsC3(results: Results, option: EChartsCoreOption, t: Tokens, where: string): string[] {
  const problems: string[] = [];
  const cmp = comparisonOf(results);
  const series = seriesOf(option);
  const classes = (((option as Obj).xAxis as Obj).data as string[]) ?? [];
  if (series.length !== 2 + cmp.options.length) problems.push(`${where}: ${series.length} series, expected ${2 + cmp.options.length}`);
  series.forEach((s, i) => {
    if (s.type !== "bar") problems.push(`${where}: series ${i} is a ${String(s.type)}, every Today option and InfraVana is a bar`);
    if (s.barWidth !== `${BAR_WIDTH_PCT}%`) problems.push(`${where}: series ${i} is ${String(s.barWidth)} wide, bars are ${BAR_WIDTH_PCT}% of the class`);
    if (s.barMaxWidth !== BAR_MAX_PX) problems.push(`${where}: series ${i} is at most ${String(s.barMaxWidth)}px, bars are at most ${BAR_MAX_PX}px`);
    if (s.symbol !== undefined) problems.push(`${where}: series ${i} has a marker symbol`);
    if (styleOf(s as Obj).borderWidth) problems.push(`${where}: series ${i} has a border`);
  });
  const [today, infra] = series;
  const compared: [Obj | undefined, string, string][] = [
    [today, t.today1, "comparator"],
    [infra, t.accent, "InfraVana"],
  ];
  for (const [s, colour, name] of compared) {
    if (styleOf(s ?? null).color !== colour) problems.push(`${where}: the ${name} bars are not in their token colour`);
  }
  type Cls = "frontier" | "mid" | "small";
  cmp.options.forEach((o, i) => {
    const s = series[2 + i];
    if (!s) return;
    const want = rankFill(t, o.rank);
    if (styleOf(s).color !== want) problems.push(`${where}: option rank ${o.rank} is filled ${String(styleOf(s).color)}, the spec says ${want}`);
    const values = (s.data as (number | null)[]) ?? [];
    classes.forEach((c, k) => {
      const price = o.alt.usd_per_mtok_by_class[c as Cls];
      const drawn = values[k] ?? null;
      if (price === null && drawn !== null) problems.push(`${where}: a bar for ${o.alt.label} in ${c}, where it has no price`);
      if (price !== null && drawn !== price) problems.push(`${where}: the bar for ${o.alt.label} in ${c} is ${String(drawn)}, its price is ${price}`);
    });
  });
  const fills = series.map((s) => String(styleOf(s).color));
  if (new Set(fills).size !== fills.length) problems.push(`${where}: two series share a colour [${fills.join(", ")}]`);
  return problems;
}

// ---------------------------------------------------------------------------
// C5
// ---------------------------------------------------------------------------

/** C5's structure: one bar for the comparator, one for InfraVana and one per option, solid, 24px, and the label of the basis. */
export function structureProblemsC5(
  results: Results,
  option: EChartsCoreOption,
  svg: string,
  size: "stage" | "thumb",
  estimate: boolean,
  where: string,
  t?: Tokens,
  dims?: Dims,
): string[] {
  const problems: string[] = [];
  const cmp = comparisonOf(results);
  const s0 = seriesOf(option)[0] ?? {};
  const bars = dataOf(s0);
  if (bars.length !== 2 + cmp.options.length) problems.push(`${where}: ${bars.length} bars, expected ${2 + cmp.options.length}`);
  cmp.options.forEach((o, i) => {
    const v = (bars[2 + i] as Obj | undefined)?.value;
    if (v !== o.alt.tokens_at_budget) problems.push(`${where}: bar ${o.alt.label} is ${String(v)}, its tokens at budget are ${o.alt.tokens_at_budget}`);
  });
  if (t) {
    const fills = [t.today1, t.accent, ...cmp.options.map((o) => rankFill(t, o.rank))];
    bars.forEach((b, i) => {
      const style = styleOf(b);
      if (style.color !== fills[i]) problems.push(`${where}: bar ${i} is filled ${String(style.color)}, the spec says ${fills[i]}`);
      if (style.decal !== undefined) problems.push(`${where}: bar ${i} has a decal`);
      if (style.borderWidth) problems.push(`${where}: bar ${i} has a border`);
    });
    if (size === "stage" && s0.barWidth !== t.barThickness) problems.push(`${where}: bars are ${String(s0.barWidth)} thick, not ${t.barThickness}px`);
    const y = ((option as Obj).yAxis ?? {}) as Obj;
    if (size === "stage") {
      if (((y.axisLine ?? {}) as Obj).show !== false) problems.push(`${where}: the y axis draws a rule`);
      const narrow = dims !== undefined && dims.width < 600;
      const shown = ((y.axisLabel ?? {}) as Obj).show;
      if (narrow && shown !== false) problems.push(`${where}: the row names stay on the y axis on a phone`);
      if (narrow && !Array.isArray(((s0.label ?? {}) as Obj).position)) problems.push(`${where}: the row names are not above their bars on a phone`);
      if (!narrow && shown === false) problems.push(`${where}: the row names are hidden on a wide chart`);
    }
  }
  if (size === "stage") {
    // Read as running text, so the label counts when a narrow column wraps it over several lines.
    const text = joinedText(svg);
    const count = countOf(text, ESTIMATED_LABEL);
    const wanted = estimate ? cmp.options.length : 0;
    if (count !== wanted) problems.push(`${where}: "${ESTIMATED_LABEL}" drawn ${count} times, expected ${wanted}`);
    // One figure, one form: a bar is labelled with the three-significant-digit figure of the caption and the table.
    for (const b of bars) {
      const v = Number((b as Obj | null)?.value);
      if (Number.isFinite(v) && !text.includes(fmtTokensSig(v))) problems.push(`${where}: no label "${fmtTokensSig(v)}" for a bar of ${v}`);
    }
  }
  return problems;
}

/** What a C1 or C5 stage drawing must say whatever the data: the compared rows and a quality line per grey bar. */
function checkComparisonTexts(results: Results, svg: string, problems: string[], where: string): void {
  const cmp = comparisonOf(results);
  const drawn = textsOf(svg);
  const has = (needle: string) => drawn.some((x) => x.includes(needle));
  // A long label wraps over several lines in a narrow column, so each of its words must be drawn.
  const all = ` ${drawn.join(" ")} `;
  const named = (label: string) => label.split(" ").every((w) => all.includes(w));
  if (!has("Today:") || !named(cmp.label)) problems.push(`${where}: no row named for the comparator "${cmp.label}"`);
  if (!has(INFRAVANA_LABEL)) problems.push(`${where}: no "${INFRAVANA_LABEL}" row label drawn`);
  for (const o of cmp.options) {
    if (!named(o.alt.label)) problems.push(`${where}: option "${o.alt.label}" has no label`);
  }
  // A quality figure beside every grey bar, and the mark where a floor is missed.
  const greys = [cmp.comparator, ...cmp.options.map((o) => o.alt)].filter((x) => x !== null);
  const quality = drawn.filter((x) => x.includes("quality")).length;
  if (quality < greys.length) problems.push(`${where}: ${quality} quality figures drawn for ${greys.length} grey bars`);
  for (const alt of greys) {
    if (!alt.meets_floors && !drawn.some((x) => /below (your quality )?floor/.test(x))) {
      problems.push(`${where}: ${alt.label} misses a floor and no mark says so`);
    }
  }
}

/** C1: plain segment names, the budget label and the saving, as drawn. */
function checkAllocation(
  results: Results,
  size: "stage" | "thumb",
  svg: string,
  problems: string[],
  label: string,
): void {
  if (size !== "stage") return;
  const where = `${label} C1 ${size}`;
  const a = results.allocation;
  const planned = [...planBar(a.today, "today"), ...planBar(a.infravana, "infravana")];
  for (const seg of planned) {
    if (/^[a-z]/.test(seg.label)) problems.push(`${where}: label "${seg.label}" starts in lower case (a raw id)`);
    if (seg.kind === "hardware" && !seg.label.startsWith("Own hardware (")) {
      problems.push(`${where}: hardware label "${seg.label}" lacks the "Own hardware (" prefix`);
    }
  }
  const drawn = textsOf(svg);
  if (!drawn.some((x) => x.startsWith("Budget "))) problems.push(`${where}: no budget label`);
  // The saving is named in the saving colour's row label, as "$X saved", whatever the width of its block.
  const saved = a.infravana.filter(isSavings).reduce((sum, s) => sum + s.usd, 0);
  if (saved > 0 && !drawn.some((x) => x.includes(`${fmtUsdSig(saved)} saved`))) {
    problems.push(`${where}: the row of ${INFRAVANA_LABEL} does not say "${fmtUsdSig(saved)} saved"`);
  }
}

function checkCaption(def: ChartDef, results: Results, problems: string[], label: string): void {
  const caption = def.caption(results);
  const where = `${label} ${def.id} caption`;
  if (/NaN|undefined|Infinity/.test(caption)) problems.push(`${where}: contains NaN, undefined or Infinity: ${caption}`);
  if (!/[.]$/.test(caption)) problems.push(`${where}: does not end with a full stop: ${caption}`);
  if (/[.]\s+[A-Z]/.test(caption)) problems.push(`${where}: more than one sentence: ${caption}`);

  // The caption names the comparator by its label (spec 6.1); a label may hold a digit ("vendor 2"), which is a name, not a figure.
  const cmp = comparisonOf(results);
  if (cmp.comparator && def.id !== "C3" && !caption.includes(cmp.label)) problems.push(`${where}: does not name the comparator "${cmp.label}": ${caption}`);
  if (cmp.comparator && def.id === "C3" && results.cost_per_mtok.by_model_class.some((r) => r.today_usd_per_mtok !== null && r.infravana_usd_per_mtok !== null) && !caption.includes(cmp.label))
    problems.push(`${where}: does not name the comparator "${cmp.label}": ${caption}`);
  let figures = caption;
  for (const alt of results.today_alternatives) figures = figures.split(alt.label).join("");

  // Every number must be a number of Results, rounded to the digits shown.
  const known = numbersIn(results);
  const priceDecimals = new Set<number>();
  for (const text of figures.match(NUMBER_IN_TEXT) ?? []) {
    const n = parseCaptionNumber(text);
    if (!n) continue;
    if (!known.some((k) => Math.abs(k - n.value) <= n.tolerance))
      problems.push(`${where}: quotes ${text}, not a number in Results`);
    // A non-zero figure is never written as zero ("$0.0M" beside a 30% saving).
    if (n.value === 0 && !known.includes(0)) problems.push(`${where}: ${text} is zero, and Results has no zero: ${caption}`);
    // Dollar amounts and token counts keep three significant digits, whatever their size.
    const isPrice = n.dollar && n.unit === "" && n.decimals > 0 && n.value < 1000;
    const isAmount = (n.dollar && !isPrice) || (!n.dollar && n.unit !== "");
    // An exact figure needs no more digits than it has ("$1M" for a budget of 1,000,000 loses nothing);
    // the rule is there to stop a rounding that hides magnitude ("$1.0M" for 1,049,000, "$0.0M").
    const exact = known.some((k) => Math.abs(k - n.value) <= Math.abs(k) * 1e-9);
    if (isAmount && n.significant < 3 && !exact) problems.push(`${where}: ${text} has fewer than 3 significant digits and is not exact: ${caption}`);
    if (isPrice) {
      if (n.significant < 2) problems.push(`${where}: price ${text} has fewer than 2 significant digits: ${caption}`);
      priceDecimals.add(n.decimals);
    }
  }
  // Prices of one caption share their number of decimals.
  if (priceDecimals.size > 1) problems.push(`${where}: prices mix decimals: ${caption}`);
  if (def.id === "C1") {
    // Each saving of the sentence is stated with its own digits.
    const a = results.allocation;
    const of = (source: string) => a.infravana.filter((x) => x.kind === "savings" && x.savings_source === source);
    const detailed = of("arbitrage").length <= 1 && of("routing").length <= 1;
    for (const source of ["arbitrage", "routing"] as const) {
      const segs = of(source);
      if (detailed && segs.length === 1 && segs[0].usd > 0 && Math.round(results.headline.cost_savings_pct) > 0 && !caption.includes(fmtUsdSig(segs[0].usd)))
        problems.push(`${where}: the ${source} saving ${fmtUsdSig(segs[0].usd)} is not stated in the caption: ${caption}`);
    }
  }

  if (def.id === "C1" && Math.round(results.headline.cost_savings_pct) > 0) {
    if (!caption.includes(fmtPct(results.headline.cost_savings_pct)))
      problems.push(`${where}: does not state the headline saving ${fmtPct(results.headline.cost_savings_pct)}`);
  }
  if (def.id === "C5") {
    const shown = fmtMultiple(results.headline.tokens_multiple);
    if (shown !== "1.0x" && !caption.includes(shown.slice(0, -1)))
      problems.push(`${where}: does not state the headline multiple ${shown}`);
    if (shown !== "1.0x" && results.headline.tokens_multiple < 1 && /\d+(?:\.\d+)?x as many/.test(caption))
      problems.push(`${where}: a multiple below 1 is worded "as many": ${caption}`);
  }
}

function checkCsv(def: ChartDef, results: Results, problems: string[], notes: string[], label: string): void {
  const where = `${label} ${def.id} csv`;
  const csv = def.toCsv(results);
  if (/NaN|undefined|Infinity/.test(csv)) problems.push(`${where}: contains NaN, undefined or Infinity`);
  const rows = parseCsv(csv);
  const width = rows[0]?.length ?? 0;
  if (rows.length < 2) problems.push(`${where}: no data rows`);
  rows.forEach((r, i) => {
    if (r.length !== width) problems.push(`${where}: row ${i + 1} has ${r.length} fields, header has ${width}`);
  });
  if (/[^\r]\n/.test(csv) || csv.startsWith("\n")) problems.push(`${where}: a line break that is not CRLF`);
  if (def.id === "C1") {
    const a = results.allocation;
    const cmp = comparisonOf(results);
    const expected = planBar(a.today, "today").length + planBar(a.infravana, "infravana").length + cmp.options.length + 1;
    if (rows.length - 1 !== expected) problems.push(`${where}: ${rows.length - 1} rows, expected ${expected}`);
    for (const bar of [`Today: ${cmp.label}`, "With InfraVana"]) {
      const sum = rows
        .slice(1)
        .filter((r) => r[0] === bar)
        .reduce((s, r) => s + Number(r[4]), 0);
      if (Math.abs(sum - a.total_usd) > 0.01) problems.push(`${where}: ${bar} rows sum to ${sum}, total is ${a.total_usd}`);
    }
    if (csv !== allocationCsv(results)) problems.push(`${where}: not deterministic`);
    // The CSV names every segment exactly as the bar does.
    const names = new Set([...planBar(a.today, "today"), ...planBar(a.infravana, "infravana")].map((p) => p.label));
    for (const o of cmp.options) names.add(o.alt.label);
    for (const r of rows.slice(1)) {
      if (r[1] !== "Budget" && !names.has(r[1])) problems.push(`${where}: segment "${r[1]}" is not a drawn label`);
    }
  }
  if (def.id === "C3") {
    const cmp = comparisonOf(results);
    const bars = results.cost_per_mtok.by_model_class.reduce(
      (n, r) => n + Number(r.today_usd_per_mtok !== null) + Number(r.infravana_usd_per_mtok !== null),
      0,
    );
    const options = cmp.options.reduce(
      (n, o) => n + Object.values(o.alt.usd_per_mtok_by_class).filter((v) => v !== null).length,
      0,
    );
    const expected = bars + options;
    if (rows.length - 1 !== expected) problems.push(`${where}: ${rows.length - 1} rows, expected ${expected}`);
  }
  if (def.id === "C5") {
    const expected = 3 + comparisonOf(results).options.length;
    if (rows.length - 1 !== expected) problems.push(`${where}: ${rows.length - 1} rows, expected ${expected}`);
  }
  notes.push(`${label} ${def.id} csv: ${rows.length - 1} rows x ${width} columns`);
}

// ---------------------------------------------------------------------------
// The "Where these numbers come from" disclosure (spec 15.10)
// ---------------------------------------------------------------------------

/** Text of markup with its entities decoded. */
const decode = (s: string): string =>
  s.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

export interface TableRow {
  group: string;
  covers: string;
  basis: string;
  sourceHtml: string;
}

/** The rows of the sources table in a chart's markup. */
export function sourceTableRows(markup: string): TableRow[] {
  const table = /<table class="sources__table">[\s\S]*?<\/table>/.exec(markup)?.[0] ?? "";
  const body = /<tbody>([\s\S]*)<\/tbody>/.exec(table)?.[1] ?? "";
  return [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((tr) => {
    const cells = [...(tr[1] as string).matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1] as string);
    return { group: decode(cells[0] ?? ""), covers: decode(cells[1] ?? ""), basis: decode(cells[2] ?? ""), sourceHtml: cells[3] ?? "" };
  });
}

/** The addresses of the links in a Source cell. */
const hrefsOf = (html: string): string[] => [...html.matchAll(/<a href="([^"]*)"/g)].map((m) => (m[1] as string).replace(/&amp;/g, "&"));

interface WantRow {
  group: string;
  provenance: Provenance;
  covers: string[];
  urls: string[];
}

/** The rows the table must hold, worked out from `Results` by a route of its own (spec 15.10: one per provenance and group, non-measured only). */
function expectedSourceRows(id: ChartId, results: Results): WantRow[] {
  const cmp = comparisonOf(results);
  const a = results.allocation;
  const parts: { group: string; part: string; provenance: Provenance; url: string | null }[] = [];
  const todayName = `Today: ${cmp.label}`;
  if (id === "C3") {
    const cmpUrl = cmp.comparator?.source_url ?? null;
    const first = (segs: { provenance: Provenance; source_url?: string | null }[], p: Provenance) => segs.find((s) => s.provenance === p && s.source_url)?.source_url ?? null;
    const shown = results.cost_per_mtok.by_model_class.filter(
      (r) =>
        r.today_usd_per_mtok !== null ||
        r.infravana_usd_per_mtok !== null ||
        cmp.options.some((o) => o.alt.usd_per_mtok_by_class[r.model_class] !== null),
    );
    const infraSegs = [...a.infravana.filter(isSpend), ...a.infravana.filter(isSavings).filter((s) => s.usd > 0)];
    for (const r of shown) {
      const name = `${MODEL_CLASS_NAME[r.model_class]} models`;
      if (r.today_usd_per_mtok !== null) parts.push({ group: todayName, part: name, provenance: r.today_provenance, url: cmpUrl ?? first(a.today.filter(isSpend), r.today_provenance) });
      if (r.infravana_usd_per_mtok !== null) parts.push({ group: INFRAVANA_LABEL, part: name, provenance: r.infravana_provenance, url: first(infraSegs, r.infravana_provenance) });
    }
  } else {
    for (const s of a.today.filter(isSpend)) parts.push({ group: todayName, part: spendLabel(s), provenance: s.provenance, url: s.source_url ?? null });
    for (const s of a.infravana.filter(isSpend)) parts.push({ group: INFRAVANA_LABEL, part: spendLabel(s), provenance: s.provenance, url: s.source_url ?? null });
    for (const s of a.infravana.filter(isSavings).filter((x) => x.usd > 0)) {
      parts.push({ group: INFRAVANA_LABEL, part: SAVINGS_LABEL[s.savings_source], provenance: s.provenance, url: s.source_url ?? null });
    }
  }
  for (const o of cmp.options) parts.push({ group: "Other Today options", part: o.alt.label, provenance: o.alt.provenance, url: o.alt.source_url ?? null });

  const rows: WantRow[] = [];
  for (const provenance of ["vendor_reported", "modelled"] as const) {
    for (const group of [...new Set(parts.filter((p) => p.provenance === provenance).map((p) => p.group))]) {
      const inRow = parts.filter((p) => p.provenance === provenance && p.group === group);
      rows.push({
        group,
        provenance,
        covers: [...new Set(inRow.map((p) => p.part))],
        urls: provenance === "vendor_reported" ? [...new Set(inRow.flatMap((p) => (p.url ? [p.url] : [])))] : [],
      });
    }
  }
  return rows;
}

/**
 * The disclosure in a chart's stage markup (spec 15.10): closed, between the
 * canvas and the source line, summary "Where these numbers come from", four
 * column headings, one row per provenance and group of the non-measured series,
 * links read from the data and the words beside a placeholder address; and no
 * provenance word anywhere outside it. A thumbnail has none.
 */
export function sourcesProblems(stage: string, thumb: string, want: WantRow[] | null, where: string): string[] {
  const problems: string[] = [];
  const details = /<details class="sources"([^>]*)>([\s\S]*?)<\/details>/.exec(stage);
  if (!details) return [`${where} stage: no "Where these numbers come from" disclosure`];
  if (/\sopen/.test(details[1] as string)) problems.push(`${where} stage: the disclosure is open on load`);
  if (!/<summary>Where these numbers come from<\/summary>/.test(details[2] as string)) problems.push(`${where} stage: the summary does not read "Where these numbers come from"`);
  const at = (needle: string) => stage.indexOf(needle);
  if (!(at('role="img"') < at("<details") && at("<details") < at('class="chart-source"'))) {
    problems.push(`${where} stage: the disclosure is not between the chart canvas and the source line`);
  }
  if (!stage.includes("<b>Source:</b>")) problems.push(`${where} stage: no "Source:" line`);
  const headings = [...(details[2] as string).matchAll(/<th scope="col">([^<]*)<\/th>/g)].map((m) => m[1]);
  const rows = sourceTableRows(stage);
  if (rows.length > 0 && headings.join("|") !== "Bar or group|Covers|Basis|Source") problems.push(`${where} stage: the headings are [${headings.join(", ")}]`);
  // No provenance word outside the disclosure (and the drawer, which is not in a chart).
  const outside = decode(stage.replace(/<details class="sources"[\s\S]*?<\/details>/, "").replace(/<table[\s\S]*?<\/table>/g, ""));
  if (/vendor[-_ ]reported|modelled/i.test(outside)) problems.push(`${where} stage: a provenance word outside the disclosure`);
  if (/prov-badge|chart-notes__badges/.test(stage)) problems.push(`${where} stage: a provenance badge`);
  if (thumb.includes("sources") || thumb.includes("Source:")) problems.push(`${where} thumb: the disclosure or the source line is present`);

  if (want !== null) {
    if (rows.length !== want.length) problems.push(`${where} stage: ${rows.length} rows, expected ${want.length}`);
    want.forEach((w, i) => {
      const row = rows[i];
      if (!row) return;
      if (row.group !== w.group) problems.push(`${where} row ${i + 1}: group "${row.group}", expected "${w.group}"`);
      if (row.basis !== PROVENANCE_TEXT[w.provenance]) problems.push(`${where} row ${i + 1}: basis "${row.basis}", expected "${PROVENANCE_TEXT[w.provenance]}"`);
      const covers = row.covers.split("; ");
      for (const c of w.covers) if (!covers.includes(c)) problems.push(`${where} row ${i + 1}: does not cover "${c}"`);
      if (w.provenance === "modelled") {
        if (decode(row.sourceHtml) !== MODELLED_SOURCE) problems.push(`${where} row ${i + 1}: modelled source reads "${decode(row.sourceHtml)}"`);
        if (hrefsOf(row.sourceHtml).length > 0) problems.push(`${where} row ${i + 1}: a modelled row carries a link`);
      } else {
        const hrefs = hrefsOf(row.sourceHtml);
        if (hrefs.join("|") !== w.urls.join("|")) problems.push(`${where} row ${i + 1}: links [${hrefs.join(", ")}], the data holds [${w.urls.join(", ")}]`);
        if (w.urls.length === 0 && decode(row.sourceHtml) !== NO_ADDRESS) problems.push(`${where} row ${i + 1}: no address in the data, and the row reads "${decode(row.sourceHtml)}"`);
        const text = decode(row.sourceHtml);
        if (w.urls.length > 0 && !text.includes(PRICE_LIST)) problems.push(`${where} row ${i + 1}: no "${PRICE_LIST}" link`);
        // The words follow a link exactly when its address is the invented placeholder (a `.invalid` host).
        const placeholders = w.urls.filter((u) => new URL(u).hostname.endsWith(".invalid")).length;
        const noted = text.split(PLACEHOLDER_NOTE).length - 1;
        if (noted !== placeholders) problems.push(`${where} row ${i + 1}: "${PLACEHOLDER_NOTE}" appears ${noted} times for ${placeholders} placeholder addresses`);
      }
    });
  }
  return problems;
}

function checkMarkup(def: ChartDef, results: Results, problems: string[], label: string): void {
  const stage = renderToStaticMarkup(createElement(def.Component, { results, size: "stage" }));
  const thumb = renderToStaticMarkup(createElement(def.Component, { results, size: "thumb" }));
  const where = `${label} ${def.id}`;
  if (!stage.includes('role="img"')) problems.push(`${where} stage: no role="img" container`);
  if (!thumb.includes('role="img"')) problems.push(`${where} thumb: no role="img" container`);
  if (thumb.includes("<table") || thumb.includes("<ul")) problems.push(`${where} thumb: list or table present`);
  if (!thumb.includes("pointer-events:none")) problems.push(`${where} thumb: not marked non-interactive`);
  // The disclosure and the source line (spec 15.10): every non-measured series says where it comes from.
  problems.push(...sourcesProblems(stage, thumb, def.id === "C10" ? null : expectedSourceRows(def.id, results), where));
  if (def.id === "C3") problems.push(...keyProblems(results, stage, where));
}

/** Runs every check on one `Results`. `tokens` must be the real token values. */
export function runChartChecks(label: string, results: Results, tokens: Tokens): CheckReport {
  const problems: string[] = [];
  const notes: string[] = [];

  problems.push(...designTableProblems());
  const ids = chartRegistry.map((c) => c.id).join(",");
  if (ids !== "C1,C5,C3,C10") problems.push(`registry order is ${ids}, expected C1,C5,C3,C10`);

  const allowed = new Set(Object.values(tokens).filter((v): v is string => typeof v === "string").map((v) => v.toLowerCase()));
  for (const def of chartRegistry) {
    if (def.title.trim() === "" || def.howComputed.trim() === "") problems.push(`${def.id}: empty title or howComputed`);
    // C10 draws from the scenario and the tables as well, so `runC10Checks` draws it; the text checks run here.
    if (def.id === "C10") {
      checkCaption(def, results, problems, label);
      checkCsv(def, results, problems, notes, label);
      checkMarkup(def, results, problems, label);
      continue;
    }
    const build = BUILDERS[def.id];
    if (!build) {
      problems.push(`${def.id}: no option builder known to this check`);
      continue;
    }
    const drawings: { size: "stage" | "thumb"; dims: Dims }[] = [
      ...STAGE_SIZES.map((dims) => ({ size: "stage" as const, dims })),
      { size: "thumb", dims: THUMB_DIMS },
    ];
    for (const { size, dims } of drawings) {
      const where = `${label} ${def.id} ${size} ${dims.width}`;
      let svg = "";
      let option: EChartsCoreOption = {};
      try {
        option = build(results, size, tokens, dims);
        svg = renderSvg(option, dims);
      } catch (e) {
        problems.push(`${where}: draw threw ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }
      if (!svg.startsWith("<svg")) problems.push(`${where}: output is not an svg`);
      if (/NaN|undefined|Infinity/.test(svg)) problems.push(`${where}: svg contains NaN, undefined or Infinity`);
      const { drawn: colours, hoverOnly } = coloursOf(svg);
      for (const c of colours) if (!allowed.has(c)) problems.push(`${where}: colour ${c} is not a token value`);
      // A token colour drawn with transparency is not that token's colour. zrender's svg writes the
      // alpha of a colour as a separate attribute, so the colour alone looks like the token.
      for (const m of svg.replace(STYLE_BLOCK, "").matchAll(/\s(?:fill-|stroke-)?opacity="([\d.]+)"/g)) {
        if (Number(m[1]) < 1) problems.push(`${where}: a shape is drawn with opacity ${m[1]}`);
      }
      problems.push(...noPatternOrDashProblems(option, svg, where));
      if (def.id === "C1") checkAllocation(results, size, svg, problems, `${label} ${dims.width}`);
      if (def.id === "C1") problems.push(...structureProblemsC1(results, option, tokens, where, dims));
      if (def.id === "C3") problems.push(...structureProblemsC3(results, option, tokens, where));
      if (def.id === "C1" && size === "stage") problems.push(...budgetLabelProblems(svg, dims, tokens, where));
      if (def.id === "C5") problems.push(...structureProblemsC5(results, option, svg, size, false, where, tokens, dims));
      if (size === "stage" && (def.id === "C1" || def.id === "C5")) checkComparisonTexts(results, svg, problems, where);
      if (size === "stage") problems.push(...tooltipProblems(option, where));
      const texts = (svg.match(/<text/g) ?? []).length;
      notes.push(`${where}: ${svg.length} chars, ${colours.size} token colours, ${hoverOnly.size} hover-only, ${texts} text nodes`);
      if (size === "thumb" && texts > 0) problems.push(`${where}: thumb draws ${texts} text nodes, expected none`);
      if (size === "stage" && texts === 0) problems.push(`${where}: stage draws no text`);
    }
    checkCaption(def, results, problems, label);
    checkCsv(def, results, problems, notes, label);
    checkMarkup(def, results, problems, label);
  }
  problems.push(...checkC5Bases(results, tokens, label));
  return { problems, notes };
}

/**
 * No tooltip names a provenance (spec 15.10 acceptance 2): the tooltip
 * formatter is run on every series and item, and none of its text holds
 * "vendor-reported" or "modelled".
 */
export function tooltipProblems(option: EChartsCoreOption, where: string): string[] {
  const tooltip = ((option as Obj).tooltip ?? {}) as Obj;
  const format = tooltip.formatter as ((p: unknown) => string) | undefined;
  if (typeof format !== "function") return [];
  const problems: string[] = [];
  seriesOf(option).forEach((s, seriesIndex) => {
    const items = dataOf(s);
    items.forEach((d, dataIndex) => {
      let text = "";
      try {
        text = format({ seriesIndex, dataIndex, data: d, value: (d as Obj | null)?.value ?? d, seriesType: s.type, name: s.name });
      } catch {
        return;
      }
      if (/vendor[-_ ]reported|modelled|Source:/i.test(text)) problems.push(`${where}: the tooltip of series ${seriesIndex} item ${dataIndex} names a provenance: ${decode(text)}`);
    });
  });
  return problems;
}

/** A solve result to stand in for the goal tabs' solver, which this check does not run. */
function sampleSolve(results: Results): SolveResult {
  return {
    axis: "intensity",
    today_scale: 1,
    infravana_scale: 1.2,
    multiple: 1.2,
    today_tokens: results.tokens_bought.today_tokens,
    infravana_tokens: results.tokens_bought.infravana_tokens * 0.9,
    capped_at_users_max: false,
  };
}

/**
 * C5 states its basis (spec 6.2, acceptance 7): in G2 and G3 every grey bar
 * other than the comparator says "Estimated at its average price"; in G1 and
 * G4 none does; in G4 the compared bars say "at the trade-off you chose".
 */
function checkC5Bases(results: Results, tokens: Tokens, label: string): string[] {
  const problems: string[] = [];
  const solve = sampleSolve(results);
  // The narrow layouts too: a phone is where the label moves above the bar.
  for (const dims of STAGE_SIZES) {
    for (const goal of ["G1", "G2", "G3", "G4"] as const) {
      const where = `${label} C5 ${goal} ${dims.width}`;
      const figures = c5Figures(goal, results, goal === "G2" || goal === "G3" ? solve : null);
      const option = buildTokensBoughtOption(results, "stage", tokens, dims, figures);
      const svg = renderSvg(option, dims);
      const estimate = goal === "G2" || goal === "G3";
      problems.push(...structureProblemsC5(results, option, svg, "stage", estimate, where, tokens, dims));
      const bars = dataOf(seriesOf(option)[0] ?? {});
      if (estimate && (bars[1] as Obj | undefined)?.value !== solve.infravana_tokens) {
        problems.push(`${where}: InfraVana bar is not the solved volume`);
      }
      const tradeoff = joinedText(svg).includes("at the trade-off you chose");
      if (goal === "G4" && !tradeoff) problems.push(`${where}: no trade-off label`);
      if (goal !== "G4" && tradeoff) problems.push(`${where}: a trade-off label outside G4`);
    }
  }
  return problems;
}

/**
 * Budgets sampled from what the budget knob can reach (spec 5.2: $1K to
 * $100M), plus the bands just under a million and just under a hundred
 * million where a compact figure rounds up to the next unit.
 */
export const CHECK_BUDGETS = [1000, 100000, 999500, 999600, 999999, 1000000, 10000000, 99999500, 100000000];

/**
 * Runs the full check on `scenario` at each of `CHECK_BUDGETS`, through the
 * real engine. The captions at these budgets must state every saving with its
 * digits and never write a non-zero figure as zero.
 */
export function runBudgetChecks(scenario: Scenario, tables: Tables, tokens: Tokens, name: string): CheckReport[] {
  return CHECK_BUDGETS.map((budget) => {
    const at: Scenario = { ...scenario, baseline: { ...scenario.baseline, budget_usd_per_quarter: budget } };
    const results = compute(at, tables);
    const label = `${name}-budget-${budget}`;
    const report = runChartChecks(label, results, tokens);
    for (const def of chartRegistry) {
      if (def.id === "C1" || def.id === "C5") report.notes.push(`${label} ${def.id} caption: ${def.caption(results)}`);
    }
    return report;
  });
}

/**
 * The comparison set follows `Results` and nothing else (spec 6.1): for every
 * comparator the engine offers, the charts draw that comparator, and a
 * different comparator or stage gives different bars with no code change.
 */
export function runComparatorChecks(name: string, scenario: Scenario, tables: Tables, tokens: Tokens): CheckReport {
  const problems: string[] = [];
  const notes: string[] = [];
  const base = compute(scenario, tables);
  const drawnRows = new Map<string, string>();
  for (const alt of base.today_alternatives) {
    const results = compute({ ...scenario, comparator: alt.pattern_id }, tables);
    const label = `${name}-comparator-${alt.pattern_id}`;
    if (results.comparator !== alt.pattern_id) problems.push(`${label}: Results.comparator is ${results.comparator}`);
    const report = runChartChecks(label, results, tokens);
    problems.push(...report.problems);
    const dims: Dims = { width: 760, height: 400 };
    const svg = renderSvg(buildAllocationOption(results, "stage", tokens, dims), dims);
    const row = textsOf(svg).filter((x) => !x.includes("quality") && !x.includes("cost")).slice(0, 3).join(" ");
    drawnRows.set(alt.pattern_id, row);
    if (!alt.label.split(" ").every((w) => row.includes(w))) problems.push(`${label}: C1 comparator row reads "${row}", not "${alt.label}"`);
    const cmp = comparisonOf(results);
    if (cmp.options.some((o) => o.alt.pattern_id === alt.pattern_id)) problems.push(`${label}: the comparator is also drawn as an option`);
    // The comparator takes the darkest Today colour whichever pattern it is, and an option's colour follows its rank (spec 15.11).
    const colourOf = (id: string): string | undefined => {
      const s = seriesOf(buildCostPerMtokOption(results, "stage", tokens, dims));
      const names = [`Today: ${cmp.label}`, INFRAVANA_LABEL, ...cmp.options.map((o) => o.alt.label)];
      const i = names.findIndex((n) => n === id);
      return i < 0 ? undefined : (styleOf(s[i] ?? null).color as string | undefined);
    };
    if (colourOf(`Today: ${cmp.label}`) !== tokens.today1) problems.push(`${label}: the comparator is not drawn in today1`);
    notes.push(`${label}: greys ${[alt.pattern_id, ...cmp.options.map((o) => o.alt.pattern_id)].join(", ")}`);
  }
  if (new Set(drawnRows.values()).size < Math.min(2, drawnRows.size)) problems.push(`${name}: the comparator row does not change with the comparator`);
  // Ranks per stage live in data, so the grey set differs between stages (spec 6.1, acceptance 11).
  const sets = (["seats", "api", "platform"] as const).map((stage) =>
    comparisonOf(compute({ ...scenario, stage_today: stage, comparator: undefined }, tables)).options.map((o) => o.alt.pattern_id).join(","),
  );
  notes.push(`${name}: option sets by stage seats, api, platform: ${sets.join(" | ")}`);
  if (new Set(sets).size < 2) problems.push(`${name}: the option set is the same at every stage: ${sets.join(" | ")}`);
  return { problems, notes };
}

/** The next round number (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8 x 10^n) at or above x, as the C1 axis ends on. */
function niceStep(x: number): number {
  const p = 10 ** Math.floor(Math.log10(x));
  return ([1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((m) => m * p >= x) ?? 10) * p;
}

/** A copy of an option whose series list is replaced, for the self-tests. */
function withSeries(option: EChartsCoreOption, series: Obj[]): EChartsCoreOption {
  return { ...(option as Obj), series } as EChartsCoreOption;
}

/** One data item of a series with its item style changed. */
function restyled(s: Obj, row: number, change: Obj): Obj {
  const items = dataOf(s).map((d, i) => (i === row && d ? { ...d, itemStyle: { ...styleOf(d), ...change } } : d));
  return { ...s, data: items };
}

/**
 * Breaks each comparison-set and styling rule on purpose and requires the
 * check to say so, so a pass is never vacuous. `results` is a scenario with
 * several grey options (S1 at stage seats or api). Each entry of the report's
 * problems is a mutant the check failed to catch.
 */
export function runSelfTests(tokens: Tokens, results: Results): CheckReport {
  const problems: string[] = [];
  const notes: string[] = [];
  const dims: Dims = { width: 760, height: 400 };
  const phone: Dims = { width: 340, height: 600 };
  const expect = (name: string, found: string[], clean: string[] = []) => {
    if (clean.length > 0) problems.push(`self-test ${name}: the unbroken version already reports ${clean.length} problem(s): ${clean[0]}`);
    if (found.length === 0) problems.push(`self-test ${name}: the broken version was not caught`);
    else notes.push(`self-test ${name}: caught (${found[0]})`);
  };
  const cmp = comparisonOf(results);
  if (cmp.options.length < 2) {
    problems.push("self-tests need a Results with at least two grey options");
    return { problems, notes };
  }

  // C1
  const c1 = buildAllocationOption(results, "stage", tokens, dims);
  const c1Clean = structureProblemsC1(results, c1, tokens, "c1", dims);
  const c1Series = seriesOf(c1);
  const expected = c1Expected(results, tokens);
  const firstOption = expected.findIndex((e) => e.kind === "option");
  const savedAt = expected.findIndex((e) => e.kind === "saved");
  const c1Problems = (series: Obj[]) => structureProblemsC1(results, withSeries(c1, series), tokens, "c1", dims);
  const map = (change: (s: Obj, i: number) => Obj) => c1Series.map(change);
  expect("option bar takes the comparator's colour", c1Problems(map((s, i) => (i === firstOption ? restyled(s, 2, { color: tokens.today1 }) : s))), c1Clean);
  expect("two options share a colour", c1Problems(map((s, i) => (i === firstOption + 1 ? restyled(s, 3, { color: styleOf(dataOf(c1Series[firstOption])[2]).color }) : s))));
  expect("an option carries a decal", c1Problems(map((s, i) => (i === firstOption ? restyled(s, 2, { decal: { symbol: "rect" } }) : s))));
  const barSeries = c1Series.filter((s) => s.type !== "custom");
  expect("option bar split into two segments", c1Problems([...barSeries, barSeries[barSeries.length - 1] as Obj, ...c1Series.filter((s) => s.type === "custom")]));
  expect("a comparator segment drawn in another hue", c1Problems(map((s, i) => (i === 0 ? restyled(s, 0, { color: tokens.accent }) : s))));
  expect("a bar is 58% of the row, not 24px", c1Problems(map((s, i) => (i === 0 ? { ...s, barWidth: "58%" } : s))));
  expect("a segment is outlined in ink", c1Problems(map((s, i) => (i === 0 ? restyled(s, 0, { borderColor: tokens.text, borderWidth: 1.5, borderType: "solid" }) : s))));
  expect("a segment is parted by a border in paper, as the gap was once drawn", c1Problems(map((s, i) => (i === 0 ? restyled(s, 0, { borderColor: tokens.separator, borderWidth: 2, borderType: "solid" }) : s))));
  expect("a segment has a dashed border", c1Problems(map((s, i) => (i === 0 ? restyled(s, 0, { borderType: [6, 3] }) : s))));
  const gapAt = c1Series.findIndex((s) => s.type === "custom");
  const withGap = (change: (g: Obj) => Obj) => c1Problems(map((s, i) => (i === gapAt ? change(s) : s)));
  const drawnBy = (patch: { width?: number; fill?: string; height?: number; type?: string; dx?: number; dy?: number }) => (_p: unknown, api: { coord: (v: number[]) => number[]; size: (v: number[]) => number[]; value: (i: number) => number }) => {
    const [x, y] = api.coord([api.value(0), api.value(1)]) as [number, number];
    const width = patch.width ?? tokens.separatorWidth;
    const height = patch.height ?? tokens.barThickness;
    return { type: patch.type ?? "rect", shape: { x: x - width / 2 + (patch.dx ?? 0), y: y - height / 2 + (patch.dy ?? 0), width, height }, style: { fill: patch.fill ?? tokens.separator } };
  };
  if (gapAt >= 0) {
    // The stand-in drawing the right gap passes, so the mutants below fail for their own fault and not for the stand-in.
    const control = withGap((g) => ({ ...g, renderItem: drawnBy({}) }));
    if (control.length > 0) problems.push(`self-test gap control: a correctly drawn gap reports ${control[0]}`);
    expect("the gap is 1px, not 2px", withGap((g) => ({ ...g, renderItem: drawnBy({ width: 1 }) })));
    expect("the gap is 4px", withGap((g) => ({ ...g, renderItem: drawnBy({ width: 4 }) })));
    expect("the gap is in ink", withGap((g) => ({ ...g, renderItem: drawnBy({ fill: tokens.text }) })));
    expect("the gap is shorter than the bar", withGap((g) => ({ ...g, renderItem: drawnBy({ height: 20 }) })));
    expect("the gap is off its boundary", withGap((g) => ({ ...g, renderItem: drawnBy({ dx: 3 }) })));
    expect("the gap is off its bar", withGap((g) => ({ ...g, renderItem: drawnBy({ dy: 5 }) })));
    expect("a gap is a circle", withGap((g) => ({ ...g, renderItem: drawnBy({ type: "circle" }) })));
    expect("a gap is at the wrong boundary", withGap((g) => ({ ...g, data: (dataOf(g) as unknown as number[][]).map((d, k) => (k === 0 ? [(d[0] as number) * 0.9, d[1]] : d)) })));
    expect("a gap is missing", withGap((g) => ({ ...g, data: (dataOf(g) as unknown as number[][]).slice(1) })));
  }
  expect("the gap series is gone", c1Problems(c1Series.filter((s) => s.type !== "custom")));
  if (savedAt >= 0) {
    expect("the saving is two blocks", c1Problems([...c1Series, { ...c1Series[savedAt] }]));
    expect("the saving block is renamed", c1Problems(map((s, i) => (i === savedAt ? { ...s, name: "Saved: better price" } : s))));
    expect("the saving block is the wrong size", c1Problems(map((s, i) => (i === savedAt ? { ...s, data: dataOf(s).map((d) => (d ? { ...d, value: Number(d.value) * 0.5 } : d)) } : s))));
    expect("a label on the saving fill is paper", c1Problems(map((s, i) => (i === savedAt ? { ...s, label: { ...(s.label as Obj), color: tokens.labelPaper } } : s))));
  }
  const axisRich = (change: (r: Record<string, Obj>) => Record<string, Obj>) => {
    const yAxis = (c1 as Obj).yAxis as Obj;
    const label = yAxis.axisLabel as Obj;
    return structureProblemsC1(results, { ...(c1 as Obj), yAxis: { ...yAxis, axisLabel: { ...label, rich: change(label.rich as Record<string, Obj>) } } } as EChartsCoreOption, tokens, "c1", dims);
  };
  expect("every row name is bold", axisRich((r) => ({ ...r, opt: { ...(r.opt as Obj), fontWeight: tokens.weightBold } })));
  expect("the compared pair is not bold", axisRich((r) => ({ ...r, today: { ...(r.today as Obj), fontWeight: tokens.weightRegular } })));
  expect("the whole end label is bold ink", c1Problems(map((x, i) => (i === firstOption ? { ...x, label: { ...(x.label as Obj), rich: { q: { ...((x.label as Obj).rich as Record<string, Obj>).q, fontWeight: tokens.weightBold, color: tokens.text }, v: ((x.label as Obj).rich as Record<string, Obj>).v } } } : x))));
  expect("option label above its bar", c1Problems(map((x, i) => (i === firstOption ? { ...x, label: { ...(x.label as Obj), position: "top" } } : x))));
  expect("the y axis draws a rule", structureProblemsC1(results, { ...(c1 as Obj), yAxis: { ...((c1 as Obj).yAxis as Obj), axisLine: { show: true } } } as EChartsCoreOption, tokens, "c1", dims));
  expect("the budget line is 1.5px ink", structureProblemsC1(results, withSeries(c1, map((s, i) => (i === 0 ? { ...s, markLine: { data: [{ lineStyle: { color: tokens.text, width: 1.5 } }] } } : s))), tokens, "c1", dims));
  const c1Phone = buildAllocationOption(results, "stage", tokens, phone);
  const c1PhoneClean = structureProblemsC1(results, c1Phone, tokens, "c1 phone", phone);
  expect(
    "phone: the row names stay on the y axis",
    structureProblemsC1(results, { ...(c1Phone as Obj), yAxis: { ...((c1Phone as Obj).yAxis as Obj), axisLabel: { show: true } } } as EChartsCoreOption, tokens, "c1 phone", phone),
    c1PhoneClean,
  );
  expect(
    "phone: a row name is not above its bar",
    structureProblemsC1(results, withSeries(c1Phone, seriesOf(c1Phone).map((s, i) => (i === 0 ? { ...s, label: { ...(s.label as Obj), position: "inside" } } : s))), tokens, "c1 phone", phone),
  );
  // The drawing rules: a dash, a decal or a pattern anywhere.
  const dashClean = noPatternOrDashProblems(c1, renderSvg(c1, dims), "c1");
  if (dashClean.length > 0) problems.push(`self-test no-dash: the unbroken C1 reports ${dashClean[0]}`);
  expect("a pattern in the drawing", noPatternOrDashProblems(c1, `${renderSvg(c1, dims)}<pattern id="p"></pattern>`, "c1"));
  expect("a dashed stroke in the drawing", noPatternOrDashProblems(c1, `${renderSvg(c1, dims)}<path stroke-dasharray="6 3"/>`, "c1"));
  expect("a dashed line series", noPatternOrDashProblems({ series: [{ lineStyle: { type: "dashed" } }] } as EChartsCoreOption, null, "line"));
  expect("a dotted border", noPatternOrDashProblems({ series: [{ itemStyle: { borderType: "dotted" } }] } as EChartsCoreOption, null, "border"));
  expect("automatic decal on", noPatternOrDashProblems({ aria: { decal: { show: true } } } as EChartsCoreOption, null, "aria"));
  // A tooltip that names a provenance.
  expect(
    "a tooltip names a provenance",
    tooltipProblems({ ...(c1 as Obj), tooltip: { formatter: () => "Source: modelled" } } as EChartsCoreOption, "c1"),
    tooltipProblems(c1, "c1"),
  );

  // C1 texts: the unmet-floor mark and the quality figures are drawn from Results.
  const below: Results = {
    ...results,
    today_alternatives: results.today_alternatives.map((a) => (a.pattern_id === cmp.options[0].alt.pattern_id ? { ...a, meets_floors: false } : a)),
  };
  const marked = renderSvg(buildAllocationOption(below, "stage", tokens, dims), dims);
  const markedProblems: string[] = [];
  checkComparisonTexts(below, marked, markedProblems, "marked");
  if (markedProblems.length > 0) problems.push(`self-test below-floor mark: not drawn when a floor is missed: ${markedProblems[0]}`);
  const unmarked: string[] = [];
  checkComparisonTexts(below, marked.replace(/ · below floor/g, "").replace(/, below floor/g, ""), unmarked, "unmarked");
  expect("below-floor mark removed from the drawing", unmarked);
  const renamed: Results = { ...results, today_alternatives: results.today_alternatives.map((a) => (a.pattern_id === results.comparator ? { ...a, label: "Zeta buying route" } : a)) };
  const renamedSvg = renderSvg(buildAllocationOption(renamed, "stage", tokens, dims), dims);
  if (!textsOf(renamedSvg).some((x) => x.includes("Zeta"))) problems.push("self-test rename: the comparator row does not follow its label in Results");
  const stale: string[] = [];
  checkComparisonTexts(renamed, renderSvg(buildAllocationOption(results, "stage", tokens, dims), dims), stale, "stale");
  expect("comparator row not following its label", stale);
  const savedSvg = renderSvg(c1, dims);
  const savedLine: string[] = [];
  checkAllocation(results, "stage", savedSvg.replace(/ saved</g, "<"), savedLine, "unsaved");
  expect("the row loses its saved figure", savedLine);

  // C3
  const c3 = buildCostPerMtokOption(results, "stage", tokens, dims);
  const c3Clean = structureProblemsC3(results, c3, tokens, "c3");
  const c3Series = seriesOf(c3);
  const c3Problems = (series: Obj[]) => structureProblemsC3(results, withSeries(c3, series), tokens, "c3");
  expect("an option is a scatter marker", c3Problems(c3Series.map((s, i) => (i === 2 ? { ...s, type: "scatter", symbol: "circle" } : s))), c3Clean);
  expect("an option is drawn in the comparator's colour", c3Problems(c3Series.map((s, i) => (i === 2 ? { ...s, itemStyle: { color: tokens.today1 } } : s))));
  expect("an option bar is the wrong price", c3Problems(c3Series.map((s, i) => (i === 2 ? { ...s, data: ((s.data as (number | null)[]) ?? []).map((v) => (v === null ? v : v + 1)) } : s))));
  expect("bars are 30% wide", c3Problems(c3Series.map((s, i) => (i === 0 ? { ...s, barWidth: "30%" } : s))));
  expect("bars may be 96px", c3Problems(c3Series.map((s, i) => (i === 0 ? { ...s, barMaxWidth: 96 } : s))));
  expect("a bar has a border", c3Problems(c3Series.map((s, i) => (i === 1 ? { ...s, itemStyle: { ...(s.itemStyle as Obj), borderWidth: 1.5 } } : s))));
  const classes = ((c3 as Obj).xAxis as Obj).data as string[];
  const gap = cmp.options.map((o, i) => ({ o, i })).find(({ o }) => classes.some((c) => o.alt.usd_per_mtok_by_class[c as "frontier" | "mid" | "small"] === null));
  if (gap) {
    const k = classes.findIndex((c) => gap.o.alt.usd_per_mtok_by_class[c as "frontier" | "mid" | "small"] === null);
    expect(
      "a bar is drawn where an option has no price",
      c3Problems(c3Series.map((s, i) => (i === 2 + gap.i ? { ...s, data: ((s.data as (number | null)[]) ?? []).map((v, j) => (j === k ? 1 : v)) } : s))),
    );
  }

  // C5
  const solve = sampleSolve(results);
  const g2 = buildTokensBoughtOption(results, "stage", tokens, dims, c5Figures("G2", results, solve));
  const g2svg = renderSvg(g2, dims);
  expect("C5 labels missing in G2", structureProblemsC5(results, g2, g2svg.split(ESTIMATED_LABEL).join(""), "stage", true, "c5", tokens, dims), structureProblemsC5(results, g2, g2svg, "stage", true, "c5", tokens, dims));
  const g1 = buildTokensBoughtOption(results, "stage", tokens, dims, c5Figures("G1", results, null));
  expect("C5 label drawn in G1", structureProblemsC5(results, g1, `${renderSvg(g1, dims)}<text>${ESTIMATED_LABEL}</text>`, "stage", false, "c5", tokens, dims));
  const g1Series = seriesOf(g1);
  const c5With = (change: (s: Obj) => Obj) => structureProblemsC5(results, withSeries(g1, g1Series.map(change)), renderSvg(g1, dims), "stage", false, "c5", tokens, dims);
  expect("C5 an option bar is the comparator's colour", c5With((s) => ({ ...s, data: dataOf(s).map((d, i) => (i === 2 ? { ...d, itemStyle: { color: tokens.today1 } } : d)) })));
  expect("C5 a bar carries a pattern", c5With((s) => ({ ...s, data: dataOf(s).map((d, i) => (i === 1 ? { ...d, itemStyle: { ...styleOf(d), decal: { symbol: "rect" } } } : d)) })));
  expect("C5 a bar is outlined", c5With((s) => ({ ...s, data: dataOf(s).map((d, i) => (i === 0 ? { ...d, itemStyle: { ...styleOf(d), borderWidth: 1.5 } } : d)) })));
  expect("C5 bars are 58% of the row", c5With((s) => ({ ...s, barWidth: "58%" })));
  {
    const g1Phone = buildTokensBoughtOption(results, "stage", tokens, phone, c5Figures("G1", results, null));
    const cleanPhone = structureProblemsC5(results, g1Phone, renderSvg(g1Phone, phone), "stage", false, "c5 phone", tokens, phone);
    expect(
      "C5 phone: the row names stay on the y axis",
      structureProblemsC5(results, { ...(g1Phone as Obj), yAxis: { ...((g1Phone as Obj).yAxis as Obj), axisLabel: { show: true } } } as EChartsCoreOption, renderSvg(g1Phone, phone), "stage", false, "c5 phone", tokens, phone),
      cleanPhone,
    );
  }

  // The budget label, the narrow C5 label, marker shapes and the design table
  {
    const edge = niceStep(Math.max(results.allocation.total_usd, ...cmp.options.map((o) => o.alt.total_usd)) * 1.5);
    const atEdge: Results = { ...results, allocation: { ...results.allocation, budget_usd: edge } };
    // On a phone the margin right of the plot is 24px, less than half the label: the label must end at the line.
    const narrowDims: Dims = { width: 340, height: 400 };
    const svgEdge = renderSvg(buildAllocationOption(atEdge, "stage", tokens, narrowDims), narrowDims);
    const clean = budgetLabelProblems(svgEdge, narrowDims, tokens, "budget");
    if (clean.length > 0) problems.push(`self-test budget label: clipped when the line is at the plot edge: ${clean[0]}`);
    expect("budget label centred on a line at the edge", budgetLabelProblems(svgEdge.replace(/(text-anchor=")end("[^>]*>Budget )/, "$1middle$2"), narrowDims, tokens, "budget"), clean);
  }
  {
    const narrow: Dims = { width: 340, height: 300 };
    const figures = c5Figures("G2", results, sampleSolve(results));
    const g2narrow = buildTokensBoughtOption(results, "stage", tokens, narrow, figures);
    const svgNarrow = renderSvg(g2narrow, narrow);
    const clean = structureProblemsC5(results, g2narrow, svgNarrow, "stage", true, "c5 narrow", tokens, narrow);
    expect("C5 narrow drops the Estimated label", structureProblemsC5(results, g2narrow, svgNarrow.replace(/Estimated at its|average price/g, "x"), "stage", true, "c5 narrow", tokens, narrow), clean);
    expect("C5 bar label in two significant digits", structureProblemsC5(results, g2narrow, svgNarrow.replace(/(\d+\.\d\d)(B|M|T)/g, (_m, n: string, u: string) => `${Number(n).toFixed(1)}${u}`), "stage", true, "c5 narrow", tokens, narrow));
  }
  {
    const key = renderToStaticMarkup(createElement(C3Key, { results }));
    const keyClean = keyProblems(results, key, "key");
    expect("C3 key draws the comparator as a marker shape", keyProblems(results, key.replace("chart-key__swatch--bar", "chart-key__swatch--rect"), "key"), keyClean);
    expect("C3 key draws an option as a marker", keyProblems(results, key.replace(/chart-key__swatch--bar/g, "chart-key__swatch--circle"), "key"));
    expect("C3 key omits an option", keyProblems(results, key.replace(new RegExp(`<li[^>]*>(?:(?!<li)[\\s\\S])*?${cmp.options[0].alt.label.replace(/[()]/g, ".")}</li>`), ""), "key"));
  }
  {
    const saved = OPTION_STYLES[2].marker;
    OPTION_STYLES[2].marker = "circle";
    const found = designTableProblems();
    OPTION_STYLES[2].marker = saved;
    expect("rank 3 marker edited to a circle", found);
    const savedFill = OPTION_STYLES[0].fill;
    OPTION_STYLES[0].fill = "today3";
    const foundFill = designTableProblems();
    OPTION_STYLES[0].fill = savedFill;
    expect("rank 1 takes rank 2's colour", foundFill);
  }

  // The selector
  expect(
    "selector missing an alternative",
    selectorProblems("mutant", { ...results, today_alternatives: results.today_alternatives.filter((a) => a.kind !== "best_single") }),
    selectorProblems("select", results),
  );

  // The disclosure
  const c1Def = chartRegistry.find((d) => d.id === "C1") as ChartDef;
  const stageMarkup = renderToStaticMarkup(createElement(c1Def.Component, { results, size: "stage" }));
  const thumbMarkup = renderToStaticMarkup(createElement(c1Def.Component, { results, size: "thumb" }));
  const want = expectedSourceRows("C1", results);
  const sourcesClean = sourcesProblems(stageMarkup, thumbMarkup, want, "sources");
  if (sourcesClean.length > 0) problems.push(`self-test sources: the unbroken C1 reports ${sourcesClean[0]}`);
  const swap = (from: string | RegExp, to: string) => sourcesProblems(stageMarkup.replace(from, to), thumbMarkup, want, "sources");
  expect("the disclosure is open on load", swap('<details class="sources">', '<details class="sources" open="">'));
  expect("the summary is renamed", swap("Where these numbers come from", "Sources"));
  expect("a column heading is lost", swap('<th scope="col">Basis</th>', ""));
  expect("a column is renamed", swap("Bar or group", "Series"));
  expect("a row is lost", swap(/<tr><td class="sources__group">[^]*?<\/tr>/, ""));
  expect("a basis is wrong", swap(">Vendor-reported<", ">Measured<"));
  expect("a modelled word outside the disclosure", swap(/<p class="chart-source">/, '<p class="chart-source">modelled '));
  expect("a badge comes back", swap('<div class="chart-notes">', '<div class="chart-notes"><ul class="chart-notes__badges"></ul>'));
  expect("a link is lost", swap(/<a href="[^"]*"[^>]*>/, "<a>"));
  expect("a link points at an address the data does not hold", swap(/<a href="[^"]*"/, '<a href="https://invented.example/x"'));
  expect("the placeholder words are dropped", swap(new RegExp(`<em class="sources__note"> ${PLACEHOLDER_NOTE}</em>`), ""));
  expect("the placeholder words are shown for a real address", swap(/<a href="https:\/\/example\.invalid[^"]*"/, '<a href="https://prices.example.test/real"'));
  expect("the disclosure sits under the source line", sourcesProblems(stageMarkup.replace(/(<details class="sources"[\s\S]*?<\/details>)(<p class="chart-source">[\s\S]*?<\/p>)/, "$2$1"), thumbMarkup, want, "sources"));
  expect("a thumbnail carries the disclosure", sourcesProblems(stageMarkup, stageMarkup, want, "sources"));
  const parts: ProvenancePart[] = [
    { group: "Today", part: "Direct", provenance: "vendor_reported", source_url: "https://prices.example.test/real" },
    { group: "With InfraVana", part: "Routing", provenance: "modelled" },
  ];
  const real = renderToStaticMarkup(createElement(ProvenanceNotes, { size: "stage", parts }));
  if (real.includes(PLACEHOLDER_NOTE)) problems.push("self-test sources: a real address is followed by the placeholder words");
  if (!real.includes('<a href="https://prices.example.test/real"')) problems.push("self-test sources: a real address is not the link's target");
  const invented = renderToStaticMarkup(createElement(ProvenanceNotes, { size: "stage", parts, invented: true }));
  if (!invented.includes("Invented speeds and batch or flex prices") || !invented.includes("invented placeholder data")) {
    problems.push("self-test sources: the invented rows and their source line are not drawn when the chart uses invented rows");
  }
  if (renderToStaticMarkup(createElement(ProvenanceNotes, { size: "stage", parts })).includes("Invented speeds")) {
    problems.push("self-test sources: the invented row is drawn without invented rows");
  }
  const measured = renderToStaticMarkup(createElement(ProvenanceNotes, { size: "stage", parts: [{ group: "Today", part: "", provenance: "measured" }] }));
  if (measured.includes("<table")) problems.push("self-test sources: a measured series has a row");
  return { problems, notes };
}

/**
 * The "Compared with" selector (spec 6.1): a labelled select that lists every
 * comparator `today_alternatives` offers (the derived best single option
 * included), shows the one in effect as selected, marks the typical buyer, and
 * reports its choice through `onChange` and keeps no state of its own.
 */
export function selectorProblems(name: string, results: Results): string[] {
  const problems: string[] = [];
  const markup = renderToStaticMarkup(createElement(ComparatorSelect, { results, value: selectedComparator(results, null), onChange: () => undefined }));
  const where = `${name} comparator select`;
  const id = /<select[^>]*\sid="([^"]+)"/.exec(markup)?.[1];
  if (!id) return [`${where}: no select element`];
  if (!new RegExp(`<label[^>]*for="${id.replace(/[:]/g, "\\$&")}"[^>]*>Compared with</label>`).test(markup)) {
    problems.push(`${where}: the select is not labelled "Compared with" through for/id`);
  }
  const options = [...markup.matchAll(/<option value="([^"]*)"([^>]*)>([^<]*)<\/option>/g)];
  const offered = results.today_alternatives.map((a) => a.pattern_id);
  if (options.map((o) => o[1]).join("|") !== offered.join("|")) {
    problems.push(`${where}: lists [${options.map((o) => o[1]).join(", ")}], today_alternatives offers [${offered.join(", ")}]`);
  }
  const selected = options.filter((o) => /selected/.test(o[2])).map((o) => o[1]);
  if (selected.length !== 1 || selected[0] !== results.comparator) {
    problems.push(`${where}: selected [${selected.join(", ")}], expected [${results.comparator}]`);
  }
  for (const alt of results.today_alternatives) {
    const opt = options.find((o) => o[1] === alt.pattern_id);
    if (opt && !opt[3].includes(alt.label)) problems.push(`${where}: option ${alt.pattern_id} reads "${opt[3]}", not its label "${alt.label}"`);
    if (opt && alt.is_typical !== opt[3].includes("typical")) problems.push(`${where}: the typical-buyer mark is wrong on ${alt.pattern_id}`);
  }
  if (!results.today_alternatives.some((a) => a.kind === "best_single")) problems.push(`${where}: no best single option to list`);
  // A stored choice is shown, a choice no longer offered falls back to the engine's, and the typical buyer is stored as no choice.
  const other = results.today_alternatives.find((a) => a.pattern_id !== results.comparator);
  if (other) {
    if (selectedComparator(results, other.pattern_id) !== other.pattern_id) problems.push(`${where}: a stored choice is not shown as selected`);
    const shown = renderToStaticMarkup(createElement(ComparatorSelect, { results, value: other.pattern_id, onChange: () => undefined }));
    if (!new RegExp(`<option value="${other.pattern_id}"[^>]*selected`).test(shown)) problems.push(`${where}: the markup does not show the chosen value`);
    if (selectedComparator(results, "not-offered") !== results.comparator) problems.push(`${where}: a choice that is not offered did not fall back`);
    if (choiceFor(results, other.pattern_id) !== other.pattern_id) problems.push(`${where}: a picked non-typical option is not stored`);
  }
  const typical = results.today_alternatives.find((a) => a.is_typical);
  if (typical && choiceFor(results, typical.pattern_id) !== null) problems.push(`${where}: picking the typical buyer is not stored as no choice`);
  return problems;
}

/** The budget label stays inside the chart: whichever side of the line it sits on, none of its text is cut. */
export function budgetLabelProblems(svg: string, dims: Dims, t: Tokens, where: string): string[] {
  const m = /<text[^>]*text-anchor="(\w+)"[^>]*transform="translate\(([\d.-]+) [\d.-]+\)"[^>]*>(Budget [^<]*)<\/text>/.exec(svg);
  if (!m) return [`${where}: no budget label`];
  const [, anchor, xText, text] = m;
  const x = Number(xText);
  const w = textWidth(text, t.fontXs, t.weightRegular, t.fontSans);
  const left = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  const right = left + w;
  return left < 0 || right > dims.width
    ? [`${where}: the budget label "${text}" runs from ${left.toFixed(0)} to ${right.toFixed(0)} px in a chart ${dims.width} px wide`]
    : [];
}

/**
 * The key of C3 (stage markup): every series is a bar, so every swatch is a
 * bar swatch (spec 15.11), one per entry, in the colour of its series.
 */
export function keyProblems(results: Results, markup: string, where: string): string[] {
  const problems: string[] = [];
  const cmp = comparisonOf(results);
  const shapes = [...markup.matchAll(/chart-key__swatch chart-key__swatch--(\w+)/g)].map((m) => m[1]);
  if (shapes.length !== 2 + cmp.options.length) problems.push(`${where} key: ${shapes.length} swatches for ${2 + cmp.options.length} entries`);
  if (shapes.some((s) => s !== "bar")) problems.push(`${where} key: a swatch is not a bar [${shapes.join(", ")}]`);
  for (const name of [`Today: ${cmp.label}`, INFRAVANA_LABEL, ...cmp.options.map((o) => o.alt.label)]) {
    if (!markup.includes(name.replace(/&/g, "&amp;"))) problems.push(`${where} key: no entry for "${name}"`);
  }
  const vars = [...markup.matchAll(/background:var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]);
  const want = ["--color-today-1", "--color-accent", ...cmp.options.map((o) => `--color-today-${o.rank + 1}`)];
  if (vars.join() !== want.join()) problems.push(`${where} key: swatch colours are [${vars.join(", ")}], expected [${want.join(", ")}]`);
  return problems;
}
