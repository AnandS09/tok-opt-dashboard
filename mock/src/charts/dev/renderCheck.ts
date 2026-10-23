/**
 * Development check for the charts, not part of the app (the app never
 * imports it). Given a `Results` and a set of tokens it renders every
 * registered chart server-side and returns what is wrong, if anything.
 *
 * Checks, per chart: the ECharts option draws to SVG without NaN or
 * undefined; every colour in the drawing is a token value; the caption is one
 * sentence that quotes only numbers present in Results and agrees with the
 * headline; the CSV is well-formed RFC 4180 with the plotted rows; the React
 * markup carries a provenance badge for every series at stage size, with the
 * source line, and nothing but the picture at thumb size.
 *
 * The comparison set (spec 6.1) has its own checks: C1 draws one unsegmented,
 * patterned bar per grey option and no pattern is shared with the comparator's
 * segments; C3 draws a marker per priced class and none elsewhere; C5 labels
 * its grey bars; provenance is drawn as a dashed or dotted outline; the
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
import { allocationCsv, buildAllocationOption, comparatorBar, planBar } from "../c1Allocation";
import { C3Key } from "../C3Key";
import { buildCostPerMtokOption, costPerMtokParts } from "../c3CostPerMtok";
import { ESTIMATED_LABEL } from "../c5TokensBought";
import { c5Figures } from "../../compute/goals";
import { buildTokensBoughtOption } from "../c5TokensBought";
import { comparisonOf } from "../comparison";
import { fmtMultiple, fmtPct, fmtTokensSig, fmtUsdSig } from "../../shared/format";
import { fmtUsdPerMtok } from "../format";
import { INFRAVANA_LABEL } from "../labels";
import { textWidth } from "../measure";
import { CHANNEL_PATTERNS, INFRAVANA_PATTERNS, OPTION_STYLES, SAVINGS_PATTERNS, decalOf, optionStyle } from "../patterns";
import { ProvenanceNotes } from "../ProvenanceNotes";
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
const styleOf = (d: Obj | null): Obj => ((d?.itemStyle as Obj | undefined) ?? {}) as Obj;
export const sameDash = (a: unknown, b: number[]): boolean =>
  Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);

/** The provenance a drawn outline stands for, read back from its dash array. */
function provenanceOfBorder(style: Obj, t: Tokens): Provenance | null {
  if (sameDash(style.borderType, t.dashModelled)) return "modelled";
  if (sameDash(style.borderType, t.dashVendor)) return "vendor_reported";
  return style.borderType === "solid" ? "measured" : null;
}

type PieceKind = "channel" | "infravana" | "savings" | "option";

/** The pieces C1 draws, in series order: the row each sits in and the provenance its outline must say. */
function c1Expected(results: Results): { row: number; provenance: Provenance; kind: PieceKind }[] {
  const a = results.allocation;
  const cmp = comparisonOf(results);
  const out: { row: number; provenance: Provenance; kind: PieceKind }[] = [];
  for (const s of planBar(a.today, "today")) out.push({ row: 0, provenance: s.provenance, kind: "channel" });
  const planned = planBar(a.infravana, "infravana");
  for (const s of planned.filter((x) => x.tone === "spend")) out.push({ row: 1, provenance: s.provenance, kind: "infravana" });
  for (const s of planned.filter((x) => x.tone !== "spend" && x.usd > 0)) {
    out.push({ row: 1, provenance: s.provenance, kind: "savings" });
  }
  cmp.options.forEach((o, i) => out.push({ row: 2 + i, provenance: o.alt.provenance, kind: "option" }));
  return out;
}

/**
 * C1's structure (spec 6.1, design-tokens 3): the comparator and InfraVana
 * bars are segmented (InfraVana with one hollow block per savings source);
 * each grey option is one unsegmented bar with a reserved pattern; no pattern
 * is shared between a channel segment and an option bar; every outline says
 * its provenance; and there are at most four greys. Works on an option, so a
 * self-test can hand it a broken one.
 */
export function structureProblemsC1(results: Results, option: EChartsCoreOption, t: Tokens, where: string): string[] {
  const problems: string[] = [];
  const cmp = comparisonOf(results);
  const expected = c1Expected(results);
  const series = seriesOf(option);
  if (series.length !== expected.length) {
    problems.push(`${where}: ${series.length} series drawn, expected ${expected.length} (segments plus one bar per option)`);
  }
  const rowsDrawn = ((option as Obj).yAxis as Obj | undefined)?.data as unknown[] | undefined;
  if ((rowsDrawn?.length ?? 0) !== 2 + cmp.options.length) {
    problems.push(`${where}: ${rowsDrawn?.length ?? 0} rows, expected ${2 + cmp.options.length}`);
  }
  if (results.today_alternatives.filter((x) => x.is_grey).length > 4) problems.push(`${where}: more than four grey options in Results`);

  const channelDecals = new Set<string>();
  const optionDecals: string[] = [];
  series.forEach((s, i) => {
    const want = expected[i];
    if (!want) return;
    const items = dataOf(s);
    const filled = items.map((d, r) => (d ? r : -1)).filter((r) => r >= 0);
    if (filled.length !== 1 || filled[0] !== want.row) {
      problems.push(`${where}: series ${i} has data in rows [${filled.join(",")}], expected only row ${want.row}`);
    }
    const style = styleOf(items[want.row] ?? null);
    const found = provenanceOfBorder(style, t);
    if (found !== want.provenance) problems.push(`${where}: series ${i} (${want.kind}) outline reads ${found}, its data is ${want.provenance}`);
    const decal = style.decal === undefined ? "P1" : JSON.stringify(style.decal);
    if (want.kind === "option") {
      if (style.decal === undefined) problems.push(`${where}: option bar ${i} has no pattern`);
      optionDecals.push(decal);
    } else {
      channelDecals.add(decal);
    }
  });
  for (const d of optionDecals) {
    if (channelDecals.has(d)) problems.push(`${where}: an option bar shares its pattern with a channel segment`);
  }
  if (new Set(optionDecals).size !== optionDecals.length) problems.push(`${where}: two option bars share a pattern`);
  // An option's label stays to the right of its own bar (design-tokens 3.2), never above it between two rows.
  expected.forEach((e, i) => {
    if (e.kind !== "option") return;
    const label = (series[i]?.label ?? {}) as Obj;
    if (label.show !== false && label.position !== "right") {
      problems.push(`${where}: option label of series ${i} is placed "${String(label.position)}", not to the right of its bar`);
    }
  });
  // Each option's pattern comes from its rank, so it keeps one identity across charts.
  cmp.options.forEach((o, i) => {
    const want = JSON.stringify(decalOf(optionStyle(o.rank).pattern, t.patternOnFill));
    const idx = expected.findIndex((e) => e.kind === "option" && e.row === 2 + i);
    const got = JSON.stringify(styleOf(dataOf(series[idx] ?? {})[2 + i]).decal);
    if (got !== want) problems.push(`${where}: option rank ${o.rank} does not carry its reserved pattern`);
  });
  // The channel patterns follow design-tokens 3.2 by position: the comparator's, then InfraVana's, then savings'.
  const patternAt = (kind: PieceKind, n: number): string | undefined => {
    const idxs = expected.map((e, i) => (e.kind === kind ? i : -1)).filter((i) => i >= 0);
    const i = idxs[n];
    const row = i === undefined ? -1 : expected[i].row;
    return i === undefined ? undefined : JSON.stringify(styleOf(dataOf(series[i] ?? {})[row]).decal);
  };
  const first = (k: PieceKind) => expected.filter((e) => e.kind === k).length;
  for (let n = 0; n < Math.min(first("channel"), CHANNEL_PATTERNS.length); n++) {
    if (patternAt("channel", n) !== JSON.stringify(decalOf(CHANNEL_PATTERNS[n], t.patternOnFill))) {
      problems.push(`${where}: comparator segment ${n + 1} is not ${CHANNEL_PATTERNS[n]}`);
    }
  }
  for (let n = 0; n < Math.min(first("infravana"), INFRAVANA_PATTERNS.length); n++) {
    if (patternAt("infravana", n) !== JSON.stringify(decalOf(INFRAVANA_PATTERNS[n], t.patternOnFill))) {
      problems.push(`${where}: InfraVana segment ${n + 1} is not ${INFRAVANA_PATTERNS[n]}`);
    }
  }
  const planned = planBar(results.allocation.infravana, "infravana").filter((x) => x.tone !== "spend" && x.usd > 0);
  planned.forEach((seg, n) => {
    const key = seg.tone === "arbitrage" ? SAVINGS_PATTERNS.arbitrage : SAVINGS_PATTERNS.routing;
    if (patternAt("savings", n) !== JSON.stringify(decalOf(key, t.patternOnSaved))) {
      problems.push(`${where}: the ${seg.tone} savings block is not ${key} in the saved-money colour`);
    }
  });
  return problems;
}

/** C3's structure: grouped bars for the comparator and InfraVana, and a marker only where an option has a price. */
export function structureProblemsC3(
  results: Results,
  option: EChartsCoreOption,
  t: Tokens,
  where: string,
  svg?: string,
): string[] {
  const problems: string[] = [];
  const cmp = comparisonOf(results);
  const series = seriesOf(option);
  const classes = (((option as Obj).xAxis as Obj).data as string[]) ?? [];
  if (series.length !== 2 + cmp.options.length) problems.push(`${where}: ${series.length} series, expected ${2 + cmp.options.length}`);
  const [today, infra] = series;
  if (today?.type !== "bar" || infra?.type !== "bar") problems.push(`${where}: the comparator and InfraVana are not bars`);
  cmp.options.forEach((o, i) => {
    const s = series[2 + i];
    if (!s || s.type !== "scatter") {
      problems.push(`${where}: option ${o.alt.label} is not a marker series`);
      return;
    }
    if (s.symbol !== optionStyle(o.rank).marker) problems.push(`${where}: option rank ${o.rank} marker is ${String(s.symbol)}`);
    // The marker's fill is the rank's fill from design-tokens 3.2 (T2, T1, T2, T1), the same identity as its bar.
    const wantFill = DESIGN_OPTIONS[o.rank - 1]?.fill as "today1" | "today2" | undefined;
    if (wantFill && styleOf(s).color !== t[wantFill]) {
      problems.push(`${where}: option rank ${o.rank} marker is filled ${String(styleOf(s).color)}, design-tokens 3.2 says ${t[wantFill]} (${wantFill})`);
    }
    const points = (s.data as number[][]) ?? [];
    type Cls = "frontier" | "mid" | "small";
    const expected = classes.filter((c) => o.alt.usd_per_mtok_by_class[c as Cls] !== null);
    if (points.length !== expected.length) {
      problems.push(`${where}: option ${o.alt.label} has ${points.length} markers, expected ${expected.length} (one per priced class)`);
    }
    for (const [k, v] of points) {
      const price = o.alt.usd_per_mtok_by_class[classes[k] as Cls];
      if (price === null || price === undefined) problems.push(`${where}: marker for ${o.alt.label} in ${classes[k]}, where it has no price`);
      else if (price !== v) problems.push(`${where}: marker for ${o.alt.label} in ${classes[k]} at ${v}, its price is ${price}`);
    }
  });
  // Marker shapes are pairwise distinct as configured and as drawn (one option, one identity), whatever the table says.
  const symbols = series.slice(2).map((s) => String(s.symbol));
  if (new Set(symbols).size !== symbols.length) problems.push(`${where}: two option markers share a shape [${symbols.join(", ")}]`);
  if (svg) {
    const shapes = drawnMarkerShapes(svg);
    const ids = [...shapes.keys()];
    for (let a = 0; a < ids.length; a++) {
      for (let b = a + 1; b < ids.length; b++) {
        if ([...shapes.get(ids[a])!].some((d) => shapes.get(ids[b])!.has(d))) {
          problems.push(`${where}: option markers of series ${ids[a]} and ${ids[b]} are drawn with the same shape`);
        }
      }
    }
    // A marker that carries a price label draws it: one label per marker.
    series.slice(2).forEach((s, i) => {
      const label = (s.label ?? {}) as Obj;
      if (label.show === true) {
        const text = textsOf(svg);
        const prices = ((s.data as number[][]) ?? []).map((p) => fmtUsdPerMtok(p[1]));
        for (const price of prices) {
          if (!text.includes(price)) problems.push(`${where}: option ${cmp.options[i]?.alt.label} has no price label ${price} beside its marker`);
        }
      }
    });
  }
  // The compared bars take the same colour in every chart: grey 1 and the accent.
  const compared: [Obj | undefined, string, string][] = [
    [today, t.today1, "comparator"],
    [infra, t.accent, "InfraVana"],
  ];
  for (const [s, colour, name] of compared) {
    if (styleOf(s ?? null).color !== colour) problems.push(`${where}: the ${name} bars are not in their token colour`);
  }
  return problems;
}

/** The path of each drawn option marker (chart series 2 and up), by series index. Bars are series 0 and 1. */
export function drawnMarkerShapes(svg: string): Map<number, Set<string>> {
  const out = new Map<number, Set<string>>();
  for (const m of svg.matchAll(/<path d="([^"]*)"[^>]*ecmeta_series_index="(\d+)"[^>]*ecmeta_ssr_type="chart"/g)) {
    const series = Number(m[2]);
    if (series < 2) continue;
    if (!out.has(series)) out.set(series, new Set());
    out.get(series)!.add(m[1]);
  }
  return out;
}

/** C5's structure: one bar for the comparator, one for InfraVana and one per option, and the label of the basis. */
export function structureProblemsC5(
  results: Results,
  option: EChartsCoreOption,
  svg: string,
  size: "stage" | "thumb",
  estimate: boolean,
  where: string,
): string[] {
  const problems: string[] = [];
  const cmp = comparisonOf(results);
  const bars = dataOf(seriesOf(option)[0] ?? {});
  if (bars.length !== 2 + cmp.options.length) problems.push(`${where}: ${bars.length} bars, expected ${2 + cmp.options.length}`);
  cmp.options.forEach((o, i) => {
    const v = (bars[2 + i] as Obj | undefined)?.value;
    if (v !== o.alt.tokens_at_budget) problems.push(`${where}: bar ${o.alt.label} is ${String(v)}, its tokens at budget are ${o.alt.tokens_at_budget}`);
  });
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

/** C1: plain segment names and the budget label, as drawn. */
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
    for (const bar of [comparatorBar(cmp), "With InfraVana"]) {
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
    const markers = cmp.options.reduce(
      (n, o) => n + Object.values(o.alt.usd_per_mtok_by_class).filter((v) => v !== null).length,
      0,
    );
    const expected = bars + markers;
    if (rows.length - 1 !== expected) problems.push(`${where}: ${rows.length - 1} rows, expected ${expected}`);
  }
  if (def.id === "C5") {
    const expected = 3 + comparisonOf(results).options.length;
    if (rows.length - 1 !== expected) problems.push(`${where}: ${rows.length - 1} rows, expected ${expected}`);
  }
  notes.push(`${label} ${def.id} csv: ${rows.length - 1} rows x ${width} columns`);
}

function checkMarkup(def: ChartDef, results: Results, problems: string[], label: string): void {
  const stage = renderToStaticMarkup(createElement(def.Component, { results, size: "stage" }));
  const thumb = renderToStaticMarkup(createElement(def.Component, { results, size: "thumb" }));
  const where = `${label} ${def.id}`;
  if (!stage.includes('role="img"')) problems.push(`${where} stage: no role="img" container`);
  if (!thumb.includes('role="img"')) problems.push(`${where} thumb: no role="img" container`);
  if (thumb.includes("<table") || thumb.includes("<ul")) problems.push(`${where} thumb: list or table present`);
  if (!thumb.includes("pointer-events:none")) problems.push(`${where} thumb: not marked non-interactive`);
  // Badges and the source line (spec 9, design-tokens 3.4 and 3.5): every series says where it comes from.
  problems.push(...badgeProblems(stage, thumb, expectedProvenances(def.id, results), where));
  if (def.id === "C3") problems.push(...keyProblems(results, stage, where));
  if (def.id === "C3") {
    // A bar's badge names the model class it belongs to (design-tokens 3.4).
    for (const part of costPerMtokParts(results)) {
      if (part.group !== "Other Today options" && part.part === "") problems.push(`${where}: a ${part.provenance} badge for ${part.group} names no model class`);
      if (part.part !== "" && !stage.includes(part.part)) problems.push(`${where}: no badge names "${part.part}"`);
    }
  }
}

/** Badges and the source line in a chart's markup: one per provenance drawn, none on a thumbnail, no invented badge without invented rows. */
function badgeProblems(stage: string, thumb: string, expected: Provenance[], where: string): string[] {
  const problems: string[] = [];
  for (const p of expected) {
    if (!stage.includes(`prov-badge--${p}`)) problems.push(`${where} stage: no ${p} badge for a ${p} series`);
  }
  if (!stage.includes("<b>Source:</b>")) problems.push(`${where} stage: no "Source:" line`);
  if (thumb.includes("prov-badge") || thumb.includes("Source:")) problems.push(`${where} thumb: badges or source line present`);
  if (stage.includes("prov-badge--invented")) problems.push(`${where} stage: an invented-placeholder badge, but no invented rows are drawn`);
  return problems;
}

/**
 * The provenances of everything a chart draws, so each can be required to
 * have its badge: segments and options read from `Results`, and for C3 the
 * rows the chart shows (it leaves out a class priced on one side when others
 * are priced on both).
 */
function expectedProvenances(id: ChartId, results: Results): Provenance[] {
  const cmp = comparisonOf(results);
  const found: Provenance[] = cmp.options.map((o) => o.alt.provenance);
  if (id === "C1") {
    const a = results.allocation;
    found.push(...planBar(a.today, "today").map((x) => x.provenance), ...planBar(a.infravana, "infravana").map((x) => x.provenance));
  } else if (id === "C3") {
    found.push(...costPerMtokParts(results).map((x) => x.provenance));
  } else {
    found.push(results.tokens_bought.provenance.today, results.tokens_bought.provenance.infravana);
  }
  return [...new Set(found)];
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
      if (def.id === "C1") checkAllocation(results, size, svg, problems, `${label} ${dims.width}`);
      if (def.id === "C1") problems.push(...structureProblemsC1(results, option, tokens, where));
      if (def.id === "C3") problems.push(...structureProblemsC3(results, option, tokens, where, svg));
      if (def.id === "C1" && size === "stage") problems.push(...budgetLabelProblems(svg, dims, tokens, where));
      if (def.id === "C5") problems.push(...structureProblemsC5(results, option, svg, size, false, where));
      if (size === "stage" && (def.id === "C1" || def.id === "C5")) checkComparisonTexts(results, svg, problems, where);
      const patterns = (svg.match(/<pattern/g) ?? []).length;
      const texts = (svg.match(/<text/g) ?? []).length;
      notes.push(`${where}: ${svg.length} chars, ${colours.size} token colours, ${hoverOnly.size} hover-only, ${patterns} patterns, ${texts} text nodes`);
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
  // The narrow layouts too: a phone is where the label moves under the bar's name.
  for (const dims of STAGE_SIZES) {
  for (const goal of ["G1", "G2", "G3", "G4"] as const) {
    const where = `${label} C5 ${goal} ${dims.width}`;
    const figures = c5Figures(goal, results, goal === "G2" || goal === "G3" ? solve : null);
    const option = buildTokensBoughtOption(results, "stage", tokens, dims, figures);
    const svg = renderSvg(option, dims);
    const estimate = goal === "G2" || goal === "G3";
    problems.push(...structureProblemsC5(results, option, svg, "stage", estimate, where));
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
 * Breaks each comparison-set rule on purpose and requires the check to say
 * so, so a pass is never vacuous. `results` is a scenario with several grey
 * options (S1 at stage seats or api). Each entry of the report's problems is
 * a mutant the check failed to catch.
 */
export function runSelfTests(tokens: Tokens, results: Results): CheckReport {
  const problems: string[] = [];
  const notes: string[] = [];
  const dims: Dims = { width: 760, height: 400 };
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
  const c1Clean = structureProblemsC1(results, c1, tokens, "c1");
  const c1Series = seriesOf(c1);
  const firstOption = c1Series.length - cmp.options.length;
  expect(
    "option bar takes a channel pattern",
    structureProblemsC1(results, withSeries(c1, c1Series.map((s, i) => (i === firstOption ? restyled(s, 2, { decal: decalOf("P2", tokens.patternOnFill) }) : s))), tokens, "c1"),
    c1Clean,
  );
  expect(
    "two options share a pattern",
    structureProblemsC1(results, withSeries(c1, c1Series.map((s, i) => (i === firstOption + 1 ? restyled(s, 3, { decal: styleOf(dataOf(c1Series[firstOption])[2]).decal }) : s))), tokens, "c1"),
  );
  expect(
    "option bar drawn without a pattern",
    structureProblemsC1(results, withSeries(c1, c1Series.map((s, i) => (i === firstOption ? restyled(s, 2, { decal: undefined }) : s))), tokens, "c1"),
  );
  expect(
    "option bar split into two segments",
    structureProblemsC1(results, withSeries(c1, [...c1Series, c1Series[c1Series.length - 1]]), tokens, "c1"),
  );
  const modelled = c1Expected(results).findIndex((e) => e.provenance === "modelled");
  if (modelled >= 0) {
    expect(
      "modelled part drawn with a solid outline",
      structureProblemsC1(results, withSeries(c1, c1Series.map((s, i) => (i === modelled ? restyled(s, c1Expected(results)[i].row, { borderType: "solid" }) : s))), tokens, "c1"),
    );
  }
  const vendor = c1Expected(results).findIndex((e) => e.provenance === "vendor_reported");
  if (vendor >= 0) {
    expect(
      "vendor-reported part drawn dashed instead of dotted",
      structureProblemsC1(results, withSeries(c1, c1Series.map((s, i) => (i === vendor ? restyled(s, c1Expected(results)[i].row, { borderType: tokens.dashModelled }) : s))), tokens, "c1"),
    );
  }

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

  // C3
  const c3 = buildCostPerMtokOption(results, "stage", tokens, dims);
  const c3Clean = structureProblemsC3(results, c3, tokens, "c3");
  const c3Series = seriesOf(c3);
  const withPoints = c3Series.findIndex((s, i) => i >= 2 && ((s.data as number[][]) ?? []).length > 0);
  if (withPoints >= 0) {
    const pts = (c3Series[withPoints].data as number[][]).map(([k, v], i) => (i === 0 ? [k, v + 1] : [k, v]));
    expect("C3 marker at the wrong price", structureProblemsC3(results, withSeries(c3, c3Series.map((s, i) => (i === withPoints ? { ...s, data: pts } : s))), tokens, "c3"), c3Clean);
    const dropped = (c3Series[withPoints].data as number[][]).slice(1);
    expect("C3 marker missing where the option has a price", structureProblemsC3(results, withSeries(c3, c3Series.map((s, i) => (i === withPoints ? { ...s, data: dropped } : s))), tokens, "c3"));
  }
  const classes = ((c3 as Obj).xAxis as Obj).data as string[];
  const gap = cmp.options.map((o, i) => ({ o, i })).find(({ o }) => classes.some((c) => o.alt.usd_per_mtok_by_class[c as "frontier" | "mid" | "small"] === null));
  if (gap) {
    const k = classes.findIndex((c) => gap.o.alt.usd_per_mtok_by_class[c as "frontier" | "mid" | "small"] === null);
    const s = c3Series[2 + gap.i];
    expect("C3 marker drawn where the option has no price", structureProblemsC3(results, withSeries(c3, c3Series.map((x, i) => (i === 2 + gap.i ? { ...x, data: [...((s.data as number[][]) ?? []), [k, 1]] } : x))), tokens, "c3"));
  }

  // C5
  const solve = sampleSolve(results);
  const g2 = buildTokensBoughtOption(results, "stage", tokens, dims, c5Figures("G2", results, solve));
  const g2svg = renderSvg(g2, dims);
  expect("C5 labels missing in G2", structureProblemsC5(results, g2, g2svg.split(ESTIMATED_LABEL).join(""), "stage", true, "c5"), structureProblemsC5(results, g2, g2svg, "stage", true, "c5"));
  const g1 = buildTokensBoughtOption(results, "stage", tokens, dims, c5Figures("G1", results, null));
  expect("C5 label drawn in G1", structureProblemsC5(results, g1, `${renderSvg(g1, dims)}<text>${ESTIMATED_LABEL}</text>`, "stage", false, "c5"));

  // The budget label, the narrow C5 label, marker shapes and the design table
  {
    const edge = niceStep(Math.max(results.allocation.total_usd, ...cmp.options.map((o) => o.alt.total_usd)) * 1.5);
    const atEdge: Results = { ...results, allocation: { ...results.allocation, budget_usd: edge } };
    // On a phone the margin right of the plot is 24px, less than half the label: the label must end at the line.
    const phone: Dims = { width: 340, height: 400 };
    const svgEdge = renderSvg(buildAllocationOption(atEdge, "stage", tokens, phone), phone);
    const clean = budgetLabelProblems(svgEdge, phone, tokens, "budget");
    if (clean.length > 0) problems.push(`self-test budget label: clipped when the line is at the plot edge: ${clean[0]}`);
    expect("budget label centred on a line at the edge", budgetLabelProblems(svgEdge.replace(/(text-anchor=")end("[^>]*>Budget )/, "$1middle$2"), phone, tokens, "budget"), clean);
  }
  {
    const narrow: Dims = { width: 340, height: 300 };
    const figures = c5Figures("G2", results, sampleSolve(results));
    const g2narrow = buildTokensBoughtOption(results, "stage", tokens, narrow, figures);
    const svgNarrow = renderSvg(g2narrow, narrow);
    const clean = structureProblemsC5(results, g2narrow, svgNarrow, "stage", true, "c5 narrow");
    expect("C5 narrow drops the Estimated label", structureProblemsC5(results, g2narrow, svgNarrow.replace(/Estimated at its|average price/g, "x"), "stage", true, "c5 narrow"), clean);
    expect("C5 bar label in two significant digits", structureProblemsC5(results, g2narrow, svgNarrow.replace(/(\d+\.\d\d)(B|M|T)/g, (_m, n: string, u: string) => `${Number(n).toFixed(1)}${u}`), "stage", true, "c5 narrow"));
  }
  {
    const c3b = buildCostPerMtokOption(results, "stage", tokens, dims);
    const ser = seriesOf(c3b);
    expect("C3 option markers all drawn in one grey", structureProblemsC3(results, withSeries(c3b, ser.map((x, i) => (i >= 2 ? { ...x, itemStyle: { ...((x.itemStyle as Obj | undefined) ?? {}), color: tokens.today2 } } : x))), tokens, "c3"));
    expect("two C3 option markers share a shape", structureProblemsC3(results, withSeries(c3b, ser.map((x, i) => (i === 3 ? { ...x, symbol: ser[2].symbol } : x))), tokens, "c3"));
    const svgC3 = renderSvg(c3b, dims);
    const shapes = drawnMarkerShapes(svgC3);
    const [first, second] = [...shapes.keys()];
    const firstD = [...(shapes.get(first) ?? [])][0];
    const secondD = [...(shapes.get(second) ?? [])][0];
    if (firstD && secondD) {
      expect("two C3 option markers drawn with one shape", structureProblemsC3(results, c3b, tokens, "c3", svgC3.split(secondD).join(firstD)));
    }
    const key = renderToStaticMarkup(createElement(C3Key, { results }));
    const keyClean = keyProblems(results, key, "key");
    expect("C3 key draws the comparator as a marker shape", keyProblems(results, key.replace("chart-key__swatch--bar", "chart-key__swatch--rect"), "key"), keyClean);
    expect("C3 key draws an option as a bar", keyProblems(results, key.replace(/chart-key__swatch--(circle|rect|triangle|diamond)/, "chart-key__swatch--bar"), "key"));
    expect("C3 key shows two options with one shape", keyProblems(results, key.replace(/(chart-key__swatch--)(triangle|diamond)/, "$1circle"), "key"));
  }
  expect("option label above its bar", structureProblemsC1(results, withSeries(c1, c1Series.map((x, i) => (i === firstOption ? { ...x, label: { ...(x.label as Obj), position: "top" } } : x))), tokens, "c1"));
  {
    const saved = OPTION_STYLES[3].marker;
    OPTION_STYLES[3].marker = "circle";
    const found = designTableProblems();
    OPTION_STYLES[3].marker = saved;
    expect("rank 4 marker edited to a circle", found);
    const savedP = OPTION_STYLES[0].pattern;
    OPTION_STYLES[0].pattern = "P7";
    const foundP = designTableProblems();
    OPTION_STYLES[0].pattern = savedP;
    expect("ranks 1 and 2 patterns swapped", foundP);
  }

  // The selector
  expect(
    "selector missing an alternative",
    selectorProblems("mutant", { ...results, today_alternatives: results.today_alternatives.filter((a) => a.kind !== "best_single") }),
    selectorProblems("select", results),
  );

  // Badges and the invented badge
  const parts: ProvenancePart[] = [
    { group: "Today", part: "", provenance: "vendor_reported" },
    { group: "With InfraVana", part: "Routing", provenance: "modelled" },
  ];
  const markup = (invented: boolean, list: ProvenancePart[] = parts) => renderToStaticMarkup(createElement(ProvenanceNotes, { size: "stage", parts: list, invented }));
  const noThumb = renderToStaticMarkup(createElement(ProvenanceNotes, { size: "thumb", parts }));
  expect("modelled badge missing", badgeProblems(markup(false, parts.slice(0, 1)), noThumb, ["vendor_reported", "modelled"], "badges"), badgeProblems(markup(false), noThumb, ["vendor_reported", "modelled"], "badges"));
  expect("invented badge without invented rows", badgeProblems(markup(true), noThumb, ["vendor_reported", "modelled"], "badges"));
  const invented = markup(true);
  if (!invented.includes("prov-badge--invented") || !invented.includes("invented placeholder data")) {
    problems.push("self-test invented: the invented badge or its source line is not drawn when the chart uses invented rows");
  }
  const measured = markup(false, [{ group: "Today", part: "", provenance: "measured" }]);
  if (!measured.includes("prov-badge--measured")) problems.push("self-test measured: no badge for a measured series");
  return { problems, notes };
}

/**
 * The comparator picker in the headline (spec 6.1, 15.7): a select named
 * "Compared with" that lists every comparator `today_alternatives` offers (the
 * derived best single option included), shows the one in effect as selected
 * with the label alone as its text, marks the typical buyer while another is
 * chosen, draws the chosen name beside it, and reports its choice through
 * `onChange` and keeps no state of its own.
 */
export function selectorProblems(name: string, results: Results): string[] {
  const problems: string[] = [];
  const markup = renderToStaticMarkup(createElement(ComparatorSelect, { results, value: selectedComparator(results, null), onChange: () => undefined }));
  const where = `${name} comparator select`;
  if (!/<select[^>]*\saria-label="Compared with"/.test(markup)) return [`${where}: no select named "Compared with"`];
  const chosen = results.today_alternatives.find((a) => a.pattern_id === results.comparator);
  const drawn = /<span class="comparator__text">([^<]*)<\/span>/.exec(markup)?.[1];
  if (chosen && drawn !== chosen.label) problems.push(`${where}: the headline name reads "${drawn}", not the comparator's label "${chosen.label}"`);
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
    // The chosen option's text is its label alone; the typical buyer is marked while another is chosen.
    const isChosen = alt.pattern_id === results.comparator;
    if (opt && isChosen && opt[3] !== alt.label) problems.push(`${where}: the chosen option reads "${opt[3]}", not its label alone`);
    if (opt && !isChosen && alt.is_typical !== opt[3].includes("typical")) problems.push(`${where}: the typical-buyer mark is wrong on ${alt.pattern_id}`);
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

/**
 * The identity table of design-tokens 3.1 and 3.2, written out here on purpose:
 * the code's own table is what the drawings are built from, so a check against
 * it alone cannot see a wrong edit of it. Ranks 1 to 4: fill, pattern, marker.
 */
const DESIGN_OPTIONS = [
  { fill: "today2", pattern: "P6", marker: "circle" },
  { fill: "today1", pattern: "P7", marker: "rect" },
  { fill: "today2", pattern: "P8", marker: "triangle" },
  { fill: "today1", pattern: "P9", marker: "diamond" },
];

/** The pattern and marker tables against design-tokens 3.2. */
export function designTableProblems(): string[] {
  const problems: string[] = [];
  DESIGN_OPTIONS.forEach((want, i) => {
    const got = OPTION_STYLES[i];
    if (!got || got.fill !== want.fill || got.pattern !== want.pattern || got.marker !== want.marker) {
      problems.push(`option rank ${i + 1} is ${JSON.stringify(got)}, design-tokens 3.2 says ${JSON.stringify(want)}`);
    }
  });
  if (OPTION_STYLES.length !== DESIGN_OPTIONS.length) problems.push(`${OPTION_STYLES.length} option ranks, design-tokens 3.2 has ${DESIGN_OPTIONS.length}`);
  if (CHANNEL_PATTERNS.join() !== "P1,P1,P2,P3,P4") problems.push(`channel patterns are ${CHANNEL_PATTERNS.join()}, design-tokens 3.2 says P1,P1,P2,P3,P4`);
  if (INFRAVANA_PATTERNS.join() !== "P1,P2,P3,P4") problems.push(`InfraVana patterns are ${INFRAVANA_PATTERNS.join()}, design-tokens 3.2 says P1,P2,P3,P4`);
  if (SAVINGS_PATTERNS.arbitrage !== "P2" || SAVINGS_PATTERNS.routing !== "P3") problems.push("savings patterns are not P2 (better price) and P3 (cheaper models)");
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
 * The key of C3 (stage markup): the comparator and InfraVana are wide bar
 * swatches, each option is a swatch in its own marker's shape, and no two
 * swatches share a shape, so an option can never read as the comparator.
 */
export function keyProblems(results: Results, markup: string, where: string): string[] {
  const problems: string[] = [];
  const cmp = comparisonOf(results);
  const shapes = [...markup.matchAll(/chart-key__swatch chart-key__swatch--(\w+)/g)].map((m) => m[1]);
  const bars = shapes.slice(0, 2);
  const markers = shapes.slice(2);
  if (bars.join() !== "bar,bar") problems.push(`${where} key: the comparator and InfraVana swatches are [${bars.join(", ")}], not bars`);
  if (markers.length !== cmp.options.length) problems.push(`${where} key: ${markers.length} marker swatches for ${cmp.options.length} options`);
  if (markers.includes("bar")) problems.push(`${where} key: a marker is drawn as a bar swatch`);
  if (new Set(markers).size !== markers.length) problems.push(`${where} key: two option swatches share a shape [${markers.join(", ")}]`);
  cmp.options.forEach((o, i) => {
    if (markers[i] !== optionStyle(o.rank).marker) problems.push(`${where} key: option ${o.alt.label} swatch is ${markers[i]}, its marker is ${optionStyle(o.rank).marker}`);
  });
  for (const name of [`Today: ${cmp.label}`, INFRAVANA_LABEL, ...cmp.options.map((o) => o.alt.label)]) {
    if (!markup.includes(name.replace(/&/g, "&amp;"))) problems.push(`${where} key: no entry for "${name}"`);
  }
  return problems;
}
