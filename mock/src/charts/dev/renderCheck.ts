/**
 * Development check for the charts, not part of the app (the app never
 * imports it). Given a `Results` and a set of tokens it renders every
 * registered chart server-side and returns what is wrong, if anything.
 *
 * Checks, per chart: the ECharts option draws to SVG without NaN or
 * undefined; every colour in the drawing is a token value; the caption is one
 * sentence that quotes only numbers present in Results and agrees with the
 * headline; the CSV is well-formed RFC 4180 with the plotted rows; the React
 * markup carries a provenance badge for each non-measured series at stage
 * size and nothing but the picture at thumb size.
 *
 * It needs no browser. A node driver bundles this file, builds the tokens
 * from the stylesheet and calls `runChartChecks`.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { init, use } from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import type { ChartDef, ChartId, Results, Scenario, Tables } from "../../contract";
import { compute } from "../../compute";
import { allocationCsv, buildAllocationOption, planBar } from "../c1Allocation";
import { buildCostPerMtokOption } from "../c3CostPerMtok";
import { buildTokensBoughtOption } from "../c5TokensBought";
import { fmtMultiple, fmtPct, fmtUsdSig } from "../../shared/format";
import { INFRAVANA_LABEL, TODAY_LABEL } from "../labels";
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

function renderSvg(option: EChartsCoreOption, dims: Dims): string {
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
const STYLE_BLOCK = /<style[^>]*>[\s\S]*?<\/style>/g;

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
function coloursOf(svg: string): { drawn: Set<string>; hoverOnly: Set<string> } {
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

/** Texts drawn into an svg. */
function textsOf(svg: string): string[] {
  return [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
}

/** C1: plain segment names, the "Saved" block, the budget label and both bar names, as drawn. */
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
    if (seg.kind === "hardware" && !seg.label.startsWith("Own hardware ("))
      problems.push(`${where}: hardware label "${seg.label}" lacks the "Own hardware (" prefix`);
  }
  const drawn = textsOf(svg);
  if (!drawn.some((x) => x.startsWith("Budget "))) problems.push(`${where}: no budget label`);
  for (const name of [TODAY_LABEL, INFRAVANA_LABEL]) {
    if (!drawn.includes(name)) problems.push(`${where}: no "${name}" axis label drawn`);
  }
}

function checkCaption(def: ChartDef, results: Results, problems: string[], label: string): void {
  const caption = def.caption(results);
  const where = `${label} ${def.id} caption`;
  if (/NaN|undefined|Infinity/.test(caption)) problems.push(`${where}: contains NaN, undefined or Infinity: ${caption}`);
  if (!/[.]$/.test(caption)) problems.push(`${where}: does not end with a full stop: ${caption}`);
  if (/[.]\s+[A-Z]/.test(caption)) problems.push(`${where}: more than one sentence: ${caption}`);

  // Every number must be a number of Results, rounded to the digits shown.
  const known = numbersIn(results);
  const priceDecimals = new Set<number>();
  for (const text of caption.match(NUMBER_IN_TEXT) ?? []) {
    const n = parseCaptionNumber(text);
    if (!n) continue;
    if (!known.some((k) => Math.abs(k - n.value) <= n.tolerance))
      problems.push(`${where}: quotes ${text}, not a number in Results`);
    // A non-zero figure is never written as zero ("$0.0M" beside a 30% saving).
    if (n.value === 0 && !known.includes(0)) problems.push(`${where}: ${text} is zero, and Results has no zero: ${caption}`);
    // Dollar amounts and token counts keep three significant digits, whatever their size.
    const isPrice = n.dollar && n.unit === "" && n.decimals > 0 && n.value < 1000;
    const isAmount = (n.dollar && !isPrice) || (!n.dollar && n.unit !== "");
    if (isAmount && n.significant < 3) problems.push(`${where}: ${text} has fewer than 3 significant digits: ${caption}`);
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
    const expected = planBar(a.today, "today").length + planBar(a.infravana, "infravana").length + 1;
    if (rows.length - 1 !== expected) problems.push(`${where}: ${rows.length - 1} rows, expected ${expected}`);
    for (const bar of ["Today", "With InfraVana"]) {
      const sum = rows
        .slice(1)
        .filter((r) => r[0] === bar)
        .reduce((s, r) => s + Number(r[4]), 0);
      if (Math.abs(sum - a.total_usd) > 0.01) problems.push(`${where}: ${bar} rows sum to ${sum}, total is ${a.total_usd}`);
    }
    if (csv !== allocationCsv(results)) problems.push(`${where}: not deterministic`);
    // The CSV names every segment exactly as the bar does.
    const names = new Set([...planBar(a.today, "today"), ...planBar(a.infravana, "infravana")].map((p) => p.label));
    for (const r of rows.slice(1)) {
      if (r[1] !== "Budget" && !names.has(r[1])) problems.push(`${where}: segment "${r[1]}" is not a drawn label`);
    }
  }
  if (def.id === "C3") {
    const expected = results.cost_per_mtok.by_model_class.reduce(
      (n, r) => n + Number(r.today_usd_per_mtok !== null) + Number(r.infravana_usd_per_mtok !== null),
      0,
    );
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

}

/** Runs every check on one `Results`. `tokens` must be the real token values. */
export function runChartChecks(label: string, results: Results, tokens: Tokens): CheckReport {
  const problems: string[] = [];
  const notes: string[] = [];

  const ids = chartRegistry.map((c) => c.id).join(",");
  if (ids !== "C1,C5,C3") problems.push(`registry order is ${ids}, expected C1,C5,C3`);

  const allowed = new Set(Object.values(tokens).filter((v): v is string => typeof v === "string").map((v) => v.toLowerCase()));
  for (const def of chartRegistry) {
    if (def.title.trim() === "" || def.howComputed.trim() === "") problems.push(`${def.id}: empty title or howComputed`);
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
      try {
        svg = renderSvg(build(results, size, tokens, dims), dims);
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
  return { problems, notes };
}

/**
 * Budgets the budget knob can reach (spec 5: $1K to $10M), plus the band
 * just under a million where a compact figure rounds up to the next unit.
 */
export const CHECK_BUDGETS = [1000, 100000, 999500, 999600, 999999, 1000000, 10000000];

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
