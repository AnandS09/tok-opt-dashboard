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
import type { ChartDef, ChartId, Results } from "../../contract";
import { allocationCsv, buildAllocationOption, planBar } from "../c1Allocation";
import { buildCostPerMtokOption } from "../c3CostPerMtok";
import { buildTokensBoughtOption } from "../c5TokensBought";
import {
  fmtMultiple,
  fmtPct,
  fmtTokens,
  fmtUsd,
  fmtUsdFull,
  fmtUsdPerMtok,
  PROVENANCE_TEXT,
} from "../format";
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

const STAGE_DIMS: Dims = { width: 760, height: 380 };
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

/** The ways a number of Results may legitimately be written in a caption. */
function spellings(n: number): string[] {
  return [fmtUsd(n), fmtUsdFull(n), fmtUsdPerMtok(n), fmtTokens(n), fmtMultiple(n), fmtPct(n), String(n)].map((s) =>
    s.replace("$", ""),
  );
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

function checkCaption(def: ChartDef, results: Results, problems: string[], label: string): void {
  const caption = def.caption(results);
  const where = `${label} ${def.id} caption`;
  if (/NaN|undefined|Infinity/.test(caption)) problems.push(`${where}: contains NaN, undefined or Infinity: ${caption}`);
  if (!/[.]$/.test(caption)) problems.push(`${where}: does not end with a full stop: ${caption}`);
  if (/[.]\s+[A-Z]/.test(caption)) problems.push(`${where}: more than one sentence: ${caption}`);
  const known = new Set(numbersIn(results).flatMap(spellings));
  for (const match of caption.match(/\$?\d[\d,]*(?:\.\d+)?[KMBT]?x?%?/g) ?? []) {
    if (!known.has(match.replace("$", ""))) problems.push(`${where}: quotes ${match}, not a number in Results`);
  }
  if (def.id === "C1" && Math.round(results.headline.cost_savings_pct) > 0) {
    if (!caption.includes(fmtPct(results.headline.cost_savings_pct)))
      problems.push(`${where}: does not state the headline saving ${fmtPct(results.headline.cost_savings_pct)}`);
  }
  if (def.id === "C5" && fmtMultiple(results.headline.tokens_multiple) !== "1.0x") {
    if (!caption.includes(fmtMultiple(results.headline.tokens_multiple)))
      problems.push(`${where}: does not state the headline multiple ${fmtMultiple(results.headline.tokens_multiple)}`);
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
  if (thumb.includes("<table") || thumb.includes("<ul")) problems.push(`${where} thumb: badges or table present`);
  if (!thumb.includes("pointer-events:none")) problems.push(`${where} thumb: not marked non-interactive`);

  // Provenance badges: one per non-measured side at stage, none when every side is measured.
  const badgeBlock = /<ul[^>]*>[\s\S]*?<\/ul>/.exec(stage)?.[0] ?? "";
  const badges = [...badgeBlock.matchAll(/<li[^>]*>([^<]*)<\/li>/g)].map((m) => m[1]);
  const provenance =
    def.id === "C1"
      ? results.allocation.provenance
      : def.id === "C5"
        ? results.tokens_bought.provenance
        : results.cost_per_mtok.provenance;
  let expected = 0;
  for (const [side, series] of [
    ["today", "Today"],
    ["infravana", "With InfraVana"],
  ] as const) {
    const value = provenance[side];
    if (value === "measured") continue;
    expected++;
    const text = PROVENANCE_TEXT[value];
    if (!badges.some((b) => b.startsWith(series) && b.endsWith(`: ${text}`)))
      problems.push(`${where} stage: ${series} is ${text} but has no badge for it`);
  }
  if (expected === 0 && badges.length > 0) problems.push(`${where} stage: badge shown although every series is measured`);
  if (def.id === "C5" && results.headline.tokens_multiple > 1 && !stage.includes("favours InfraVana"))
    problems.push(`${where} stage: delta label lacks the favours marker text`);
}

/** Runs every check on one `Results`. `tokens` must be the real token values. */
export function runChartChecks(label: string, results: Results, tokens: Tokens): CheckReport {
  const problems: string[] = [];
  const notes: string[] = [];

  const ids = chartRegistry.map((c) => c.id).join(",");
  if (ids !== "C1,C5,C3") problems.push(`registry order is ${ids}, expected C1,C5,C3`);

  const allowed = new Set(Object.values(tokens).map((v) => v.toLowerCase()));
  for (const def of chartRegistry) {
    if (def.title.trim() === "" || def.howComputed.trim() === "") problems.push(`${def.id}: empty title or howComputed`);
    const build = BUILDERS[def.id];
    if (!build) {
      problems.push(`${def.id}: no option builder known to this check`);
      continue;
    }
    for (const size of ["stage", "thumb"] as const) {
      const where = `${label} ${def.id} ${size}`;
      let svg = "";
      try {
        svg = renderSvg(build(results, size, tokens, size === "stage" ? STAGE_DIMS : THUMB_DIMS), size === "stage" ? STAGE_DIMS : THUMB_DIMS);
      } catch (e) {
        problems.push(`${where}: draw threw ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }
      if (!svg.startsWith("<svg")) problems.push(`${where}: output is not an svg`);
      if (/NaN|undefined|Infinity/.test(svg)) problems.push(`${where}: svg contains NaN, undefined or Infinity`);
      const colours = new Set((svg.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).map((c) => c.toLowerCase()));
      for (const c of colours) if (!allowed.has(c)) problems.push(`${where}: colour ${c} is not a token value`);
      const patterns = (svg.match(/<pattern/g) ?? []).length;
      const texts = (svg.match(/<text/g) ?? []).length;
      notes.push(`${where}: ${svg.length} chars, ${colours.size} token colours, ${patterns} patterns, ${texts} text nodes`);
      if (size === "thumb" && texts > 0) problems.push(`${where}: thumb draws ${texts} text nodes, expected none`);
      if (size === "stage" && texts === 0) problems.push(`${where}: stage draws no text`);
    }
    checkCaption(def, results, problems, label);
    checkCsv(def, results, problems, notes, label);
    checkMarkup(def, results, problems, label);
  }
  return { problems, notes };
}
