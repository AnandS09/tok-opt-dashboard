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
import { layoutAllocation } from "../c1Layout";
import type { Rect } from "../c1Layout";
import { C1LabelList } from "../c1LabelList";
import { buildCostPerMtokOption } from "../c3CostPerMtok";
import { buildTokensBoughtOption } from "../c5TokensBought";
import { fmtMultiple, fmtPct, fmtTokens, fmtTokensSig, fmtUsd, fmtUsdSig } from "../../shared/format";
import { PROVENANCE_TEXT } from "../format";
import { INFRAVANA_LABEL, SAVINGS_LABEL, TODAY_LABEL } from "../labels";
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

/** C1: segment names, provenance borders and the budget halo, in the drawing and the CSV. */
function checkAllocation(
  results: Results,
  size: "stage" | "thumb",
  svg: string,
  t: Tokens,
  dims: Dims,
  problems: string[],
  label: string,
): void {
  const where = `${label} C1 ${size}`;
  const a = results.allocation;
  const planned = [...planBar(a.today, "today"), ...planBar(a.infravana, "infravana")];
  if (size === "stage") {
    const texts = textsOf(svg);
    const drawn = new Set(texts);
    const layout = layoutAllocation(results, t, dims);
    const placements = [...layout.today.placements, ...layout.infravana.placements];
    for (const [i, seg] of planned.entries()) {
      const chip = placements[i].mode !== "list";
      // A segment with a chip has its label drawn; one without is named by the label list instead. Two
      // bars can share a name, so compare how many times the name is drawn with how many chips carry it.
      const withChip = planned.filter((p, k) => p.label === seg.label && placements[k].mode !== "list").length;
      const times = texts.filter((x) => x === seg.label).length;
      if (times !== withChip) problems.push(`${where}: "${seg.label}" is drawn ${times} times for ${withChip} chips`);
      if (/^[a-z]/.test(seg.label)) problems.push(`${where}: label "${seg.label}" starts in lower case (a raw id)`);
      if (seg.kind === "hardware" && !seg.label.startsWith("Self-host · "))
        problems.push(`${where}: hardware label "${seg.label}" lacks the "Self-host · " prefix`);
      if (seg.tone !== "spend" && seg.label !== SAVINGS_LABEL[seg.tone])
        problems.push(`${where}: savings segment named "${seg.label}", expected "${SAVINGS_LABEL[seg.tone]}"`);
      if (chip && seg.provenance !== "measured" && !drawn.has(PROVENANCE_TEXT[seg.provenance]))
        problems.push(`${where}: no provenance line drawn for "${seg.label}"`);
    }
    if (![...drawn].some((x) => x.startsWith("Budget "))) problems.push(`${where}: no budget label`);
    // Both bar names are drawn, beside the bars (wide) or above them (narrow).
    for (const name of [TODAY_LABEL, INFRAVANA_LABEL]) {
      if (!drawn.has(name)) problems.push(`${where}: no "${name}" title or axis label drawn`);
    }
  }
  // Each non-measured segment has a dashed or dotted border; the budget line has its halo.
  const dashes = (svg.match(/stroke-dasharray="/g) ?? []).length;
  const marked = planned.filter((seg) => seg.provenance !== "measured").length;
  if (dashes < marked) problems.push(`${where}: ${dashes} dashed borders for ${marked} non-measured segments`);
  if (marked === 0 && dashes > 0) problems.push(`${where}: dashed borders drawn although every segment is measured`);
  for (const width of [t.budgetHaloWidth, t.budgetLineWidth]) {
    if (!new RegExp(`stroke-width="${width}"`).test(svg)) problems.push(`${where}: no budget stroke of width ${width}`);
  }
  if (!svg.includes(`stroke="${t.budgetHalo}"`)) problems.push(`${where}: budget halo colour not drawn`);
}


// ---------------------------------------------------------------------------
// C1 geometry, read back from the drawn svg (design-tokens 3d and 3e)
// ---------------------------------------------------------------------------

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function translateOf(attrs: string): [number, number] {
  const m = /translate\((-?[\d.]+)[ ,](-?[\d.]+)\)/.exec(attrs);
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
}

function attr(attrs: string, name: string): string | undefined {
  return new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attrs)?.[1];
}

/**
 * Chip rectangles as drawn: the rounded-corner paths filled with the chip
 * colour. A rounded rectangle is the only path of that fill with arc commands.
 */
export function chipRectsOf(svg: string, t: Tokens): Rect[] {
  const rects: Rect[] = [];
  // Pattern tiles use arcs too (the dots), so only shapes outside <pattern> blocks count.
  for (const m of svg.replace(/<pattern[\s\S]*?<\/pattern>/g, "").matchAll(/<path d="([^"]*)"([^>]*)>/g)) {
    if (!m[1].includes("A") || attr(m[2], "fill")?.toLowerCase() !== t.chip.toLowerCase()) continue;
    const xs: number[] = [];
    const ys: number[] = [];
    for (const cmd of m[1].matchAll(/([MLA])([^MLAZ]*)/g)) {
      const n = cmd[2].trim().split(/[ ,]+/).map(Number);
      xs.push(n[n.length - 2]);
      ys.push(n[n.length - 1]);
    }
    const [tx, ty] = translateOf(m[2]);
    const x = Math.min(...xs) + tx;
    const y = Math.min(...ys) + ty;
    rects.push({ x, y, w: Math.max(...xs) + tx - x, h: Math.max(...ys) + ty - y });
  }
  return rects;
}

/** Straight two-point paths drawn with a stroke colour and width (a missing width attribute means 1). */
export function linesOf(svg: string, stroke: string, width: number): Segment[] {
  const out: Segment[] = [];
  for (const m of svg.replace(STYLE_BLOCK, "").matchAll(/<path d="M(-?[\d.]+) (-?[\d.]+)L(-?[\d.]+) (-?[\d.]+)"([^>]*)>/g)) {
    if (attr(m[5], "stroke")?.toLowerCase() !== stroke.toLowerCase()) continue;
    if (Math.abs(Number(attr(m[5], "stroke-width") ?? 1) - width) > 0.001) continue;
    out.push({ x1: Number(m[1]), y1: Number(m[2]), x2: Number(m[3]), y2: Number(m[4]) });
  }
  return out;
}

const apart = (a: Rect, b: Rect) => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;

/**
 * Checks the drawn C1 against the design rules, from the svg alone plus the
 * layout's bar positions: no two chips overlap, none leaves the canvas, every
 * chip outside a bar has exactly one leader of the leader colour that runs
 * from the bar edge to the chip's near edge and crosses no chip, the layout's
 * chips are the chips drawn (so its text measuring is the drawn one), and the
 * budget halo and line share a centre.
 */
export function checkAllocationGeometry(results: Results, svg: string, t: Tokens, dims: Dims, where: string): string[] {
  const problems: string[] = [];
  const layout = layoutAllocation(results, t, dims);
  const chips = chipRectsOf(svg, t);

  for (let i = 0; i < chips.length; i++) {
    for (let j = i + 1; j < chips.length; j++) {
      if (!apart(chips[i], chips[j])) problems.push(`${where}: chips ${i} and ${j} overlap`);
    }
    const c = chips[i];
    if (c.x < -0.01 || c.y < -0.01 || c.x + c.w > dims.width + 0.01 || c.y + c.h > dims.height + 0.01)
      problems.push(`${where}: chip ${i} leaves the canvas (${c.x.toFixed(1)}, ${c.y.toFixed(1)}, ${c.w.toFixed(1)} x ${c.h.toFixed(1)} in ${dims.width} x ${dims.height})`);
  }

  // The chips the layout decided are the chips drawn.
  const placements = [layout.today, layout.infravana].flatMap((bar) => bar.placements);
  const modelChips = placements.flatMap((p) => (p.mode === "list" ? [] : [p.chip]));
  if (chips.length !== modelChips.length) problems.push(`${where}: ${chips.length} chips drawn, layout has ${modelChips.length}`);
  for (const m of modelChips) {
    const near = chips.some((c) => [c.x - m.x, c.y - m.y, c.w - m.w, c.h - m.h].every((d) => Math.abs(d) <= 1.5));
    if (!near) problems.push(`${where}: layout chip at ${m.x.toFixed(1)},${m.y.toFixed(1)} is not drawn`);
  }

  // Leaders: one per outside chip, in the leader colour, joining the bar edge to the chip's near edge.
  const outside = placements.flatMap((p) => (p.mode === "outside" ? [p] : []));
  // The axis line shares the leader colour (both alias the strong border), so leave out lines as tall as the plot.
  const leaders = linesOf(svg, t.chartLeader, t.leaderWidth).filter(
    (l) => Math.abs(l.x1 - l.x2) < 0.01 && Math.abs(l.y2 - l.y1) < layout.plotHeight - 1,
  );
  if (leaders.length !== outside.length) problems.push(`${where}: ${leaders.length} leaders for ${outside.length} outside labels`);
  for (const p of outside) {
    // Match by position: the leader's x (lines snap by up to half a pixel) and one end on this bar edge.
    const mine = leaders.filter(
      (l) => Math.abs(l.x1 - p.leader.x) <= 0.6 && [l.y1, l.y2].some((y) => Math.abs(y - p.leader.to) <= 1.5),
    );
    if (mine.length !== 1) {
      problems.push(`${where}: ${mine.length} leaders at x ${p.leader.x.toFixed(1)}, expected 1`);
      continue;
    }
    const l = mine[0];
    const [lo, hi] = [Math.min(l.y1, l.y2), Math.max(l.y1, l.y2)];
    const ends = [lo, hi];
    const drawn = chips.find((c) => Math.abs(c.x - p.chip.x) <= 1.5 && Math.abs(c.y - p.chip.y) <= 1.5);
    const chipEdge = p.position === "top" ? p.chip.y + p.chip.h : p.chip.y;
    const barEdge = p.leader.to;
    if (!ends.some((y) => Math.abs(y - chipEdge) <= 1.5)) problems.push(`${where}: leader at x ${l.x1} does not touch its chip's near edge`);
    if (!ends.some((y) => Math.abs(y - barEdge) <= 1.5)) problems.push(`${where}: leader at x ${l.x1} does not reach the bar edge`);
    if (drawn && (l.x1 < drawn.x || l.x1 > drawn.x + drawn.w)) problems.push(`${where}: leader at x ${l.x1} is outside its chip's width`);
    for (const c of chips) {
      if (c === drawn) continue;
      if (l.x1 > c.x && l.x1 < c.x + c.w && hi > c.y && lo < c.y + c.h) problems.push(`${where}: leader at x ${l.x1} crosses a chip`);
    }
  }

  // The budget label sits where the layout expects, on the canvas, clear of every chip.
  const budgetText = [...svg.matchAll(/<text([^>]*)>(Budget [^<]*)<\/text>/g)][0];
  if (!budgetText) problems.push(`${where}: no budget label drawn`);
  else {
    const attrs = budgetText[1];
    const [tx, ty] = translateOf(attrs);
    const anchor = attr(attrs, "text-anchor") ?? "middle";
    const x = tx + Number(attr(attrs, "x") ?? 0);
    const w = layout.budget.rect.w;
    const drawn: Rect = {
      x: anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2,
      y: ty + Number(attr(attrs, "y") ?? 0) - t.lineXs / 2,
      w,
      h: t.lineXs,
    };
    const m = layout.budget.rect;
    if (Math.abs(drawn.x - m.x) > 2.5 || Math.abs(drawn.y - m.y) > 2.5)
      problems.push(`${where}: budget label drawn at ${drawn.x.toFixed(1)},${drawn.y.toFixed(1)}, layout expects ${m.x.toFixed(1)},${m.y.toFixed(1)}`);
    if (drawn.x < -0.01 || drawn.y < -0.01 || drawn.x + drawn.w > dims.width + 0.01) problems.push(`${where}: budget label leaves the canvas`);
    for (const c of chips) if (!apart(drawn, c)) problems.push(`${where}: a chip overlaps the budget label`);
  }

  // Budget halo and line share one centre, and both span the plot.
  const halo = linesOf(svg, t.budgetHalo, t.budgetHaloWidth);
  const line = linesOf(svg, t.budgetLine, t.budgetLineWidth);
  if (halo.length !== 1 || line.length !== 1) problems.push(`${where}: ${halo.length} halo and ${line.length} line paths, expected 1 each`);
  else if (Math.abs(halo[0].x1 - line[0].x1) > 0.01) problems.push(`${where}: halo centre ${halo[0].x1} and line centre ${line[0].x1} differ`);

  return problems;
}

/**
 * Proves the geometry checks can fail: draws C1 for `results`, expects no
 * problem, then applies each deliberate break to the svg and expects one.
 * A break that has nothing to act on in this drawing (no leader in the
 * narrow layout, say) is left out of `applied`. Returns the checks that did
 * not behave, and the breaks that were applied.
 */
export function selfTestGeometryChecks(results: Results, t: Tokens, dims: Dims): { fails: string[]; applied: string[] } {
  const svg = renderSvg(buildAllocationOption(results, "stage", t, dims), dims);
  const fails: string[] = [];
  const clean = checkAllocationGeometry(results, svg, t, dims, "clean");
  if (clean.length > 0) fails.push(`the unbroken drawing reports problems: ${clean[0]}`);
  const chips = [...svg.matchAll(/<path d="([^"]*A[^"]*)" transform="translate\(([-\d.]+) ([-\d.]+)\)"/g)];
  // The first real leader: a two-point path in the leader colour that is shorter than the plot is tall
  // (the axis line has the same colour and spans it).
  const plotHeight = layoutAllocation(results, t, dims).plotHeight;
  const leaderTag = [...svg.matchAll(/<path d="M(-?[\d.]+) (-?[\d.]+)L(-?[\d.]+) (-?[\d.]+)"([^>]*)><\/path>/g)].find(
    (m) => attr(m[5], "stroke")?.toLowerCase() === t.chartLeader.toLowerCase() && Math.abs(Number(m[4]) - Number(m[2])) < plotHeight - 1,
  )?.[0];
  const breaks: [string, (s: string) => string][] = [
    ["two chips overlapping", (s) => (chips.length < 2 ? s : s.replace(chips[1][0], chips[1][0].replace(`translate(${chips[1][2]} ${chips[1][3]})`, `translate(${chips[0][2]} ${chips[0][3]})`)))],
    ["a chip off the canvas", (s) => (chips.length < 1 ? s : s.replace(chips[0][0], chips[0][0].replace(`translate(${chips[0][2]} ${chips[0][3]})`, `translate(${chips[0][2]} -400)`)))],
    ["a leader removed", (s) => (leaderTag ? s.replace(leaderTag, "") : s)],
    ["a leader in the wrong colour", (s) => (leaderTag ? s.replace(leaderTag, leaderTag.replace(/stroke="[^"]*"/, `stroke="${t.today1}"`)) : s)],
    ["the halo off the line's centre", (s) => s.replace(/(<path d="M)(-?[\d.]+)( [-\d.]+L)(-?[\d.]+)([^>]*stroke-width="6")/, (_m, a, x, b, x2, c) => `${a}${Number(x) + 0.5}${b}${Number(x2) + 0.5}${c}`)],
  ];
  const applied: string[] = [];
  for (const [name, apply] of breaks) {
    const broken = apply(svg);
    if (broken === svg) continue;
    applied.push(name);
    if (checkAllocationGeometry(results, broken, t, dims, name).length === 0) fails.push(`break "${name}" went unnoticed`);
  }
  return { fails, applied };
}

/** The label list names exactly the segments the layout gave no chip, in the layout's words. */
function checkLabelList(results: Results, t: Tokens, dims: Dims, where: string): string[] {
  const problems: string[] = [];
  const layout = layoutAllocation(results, t, dims);
  const listed = [layout.today, layout.infravana].flatMap((bar) =>
    bar.segs.flatMap((seg, i) => {
      const p = bar.placements[i];
      return p.mode === "list" ? [{ seg, tooSmall: p.tooSmall }] : [];
    }),
  );
  const html = renderToStaticMarkup(createElement(C1LabelList, { results, tokens: t, dims, idPrefix: "check" }));
  if (listed.length === 0) {
    if (html !== "") problems.push(`${where}: a label list is drawn although every segment has a chip`);
    return problems;
  }
  if ((html.match(/<li[ >]/g) ?? []).length !== listed.length)
    problems.push(`${where}: ${(html.match(/<li[ >]/g) ?? []).length} list entries for ${listed.length} segments without a chip`);
  if ((html.match(/too small to draw/g) ?? []).length !== listed.filter((e) => e.tooSmall).length)
    problems.push(`${where}: "too small to draw" does not match the segments under the minimum width`);
  if ((html.match(/<svg/g) ?? []).length !== listed.length) problems.push(`${where}: a list entry lacks its swatch`);
  for (const { seg } of listed) {
    const name = seg.label.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    if (!html.includes(name)) problems.push(`${where}: list lacks "${seg.label}"`);
    if (seg.provenance !== "measured" && !html.includes(PROVENANCE_TEXT[seg.provenance]))
      problems.push(`${where}: list entry "${seg.label}" lacks its provenance`);
  }
  return problems;
}

/**
 * The narrow layout's bar titles, read back from the svg: "Today" in the text
 * colour, "With InfraVana" in accent-strong, each total in the secondary text
 * colour, every piece in the token font family at the token size. zrender
 * reads a text colour from `fill`, so an option written with `color` draws the
 * default dark colour and font; only the svg shows that.
 */
export function checkNarrowTitles(results: Results, svg: string, t: Tokens, dims: Dims, where: string): string[] {
  const layout = layoutAllocation(results, t, dims);
  if (!layout.narrow) return [];
  const problems: string[] = [];
  const family = (t.fontSans).replace(/["']/g, "");
  const pieces = [...svg.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)].map((m) => ({
    content: m[2],
    fill: attr(m[1], "fill")?.toLowerCase(),
    family: /font-family:([^;]*);/.exec(m[1])?.[1].replace(/&quot;|["']/g, "").trim(),
    size: Number(/font-size:([\d.]+)px/.exec(m[1])?.[1]),
  }));
  const expect = (content: (c: string) => boolean, name: string, fill: string, size: number) => {
    const found = pieces.filter((p) => content(p.content));
    if (found.length !== 1) {
      problems.push(`${where}: ${found.length} "${name}" title pieces drawn, expected 1`);
      return;
    }
    const p = found[0];
    if (p.fill !== fill.toLowerCase()) problems.push(`${where}: "${name}" drawn in ${p.fill}, expected ${fill}`);
    if (p.family !== family) problems.push(`${where}: "${name}" drawn in font "${p.family}", expected "${family}"`);
    if (p.size !== size) problems.push(`${where}: "${name}" drawn at ${p.size}px, expected ${size}px`);
  };
  expect((c) => c === TODAY_LABEL, TODAY_LABEL, t.text, t.fontSm);
  expect((c) => c === INFRAVANA_LABEL, INFRAVANA_LABEL, t.accentStrong, t.fontSm);
  const totals = pieces.filter((p) => /^\s*\u00b7\s*\$.* total$/.test(p.content));
  if (totals.length !== 2) problems.push(`${where}: ${totals.length} title totals drawn, expected 2`);
  for (const p of totals) {
    if (p.fill !== t.textSecondary.toLowerCase()) problems.push(`${where}: title total drawn in ${p.fill}, expected ${t.textSecondary}`);
    if (p.family !== family) problems.push(`${where}: title total drawn in font "${p.family}", expected "${family}"`);
    if (p.size !== t.fontXs) problems.push(`${where}: title total drawn at ${p.size}px, expected ${t.fontXs}px`);
  }
  return problems;
}

/**
 * Proves the title check can fail: draws C1 narrow, expects no problem, then
 * restyles pieces of the svg one way at a time (the InfraVana name in the
 * text colour, a total in the text colour, the default font, the wrong size)
 * and expects a problem for each.
 */
export function selfTestNarrowTitles(results: Results, t: Tokens, dims: Dims): { fails: string[]; applied: string[] } {
  const svg = renderSvg(buildAllocationOption(results, "stage", t, dims), dims);
  const fails: string[] = [];
  const clean = checkNarrowTitles(results, svg, t, dims, "clean");
  if (clean.length > 0) fails.push(`the unbroken drawing reports problems: ${clean[0]}`);
  const tag = (content: RegExp) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].find((m) => content.test(m[1]))?.[0];
  const inf = tag(/^With /);
  const total = tag(/total$/);
  const edit = (el: string | undefined, f: (e: string) => string): ((s: string) => string) => (s) => (el ? s.replace(el, f(el)) : s);
  const breaks: [string, (s: string) => string][] = [
    ["the InfraVana title in the text colour", edit(inf, (e) => e.replace(/fill="[^"]*"/, `fill="${t.text}"`))],
    ["a total in the text colour", edit(total, (e) => e.replace(/fill="[^"]*"/, `fill="${t.text}"`))],
    ["a title in the default font", edit(inf, (e) => e.replace(/font-family:[^;]*;/, "font-family:sans-serif;"))],
    ["a title at the wrong size", edit(total, (e) => e.replace(/font-size:[\d.]+px/, "font-size:20px"))],
  ];
  const applied: string[] = [];
  for (const [name, apply] of breaks) {
    const broken = apply(svg);
    if (broken === svg) continue;
    applied.push(name);
    if (checkNarrowTitles(results, broken, t, dims, name).length === 0) fails.push(`break "${name}" went unnoticed`);
  }
  return { fails, applied };
}

/** The compact formatters at the edges of their units: roundings that reach 1000 move to the next unit, never "1000". */
export function checkFormatters(): string[] {
  const cases: [string, string, string][] = [
    ["fmtUsd(999.6)", fmtUsd(999.6), "$1K"],
    ["fmtUsdSig(999.6)", fmtUsdSig(999.6), "$1.00K"],
    ["fmtTokens(999.6)", fmtTokens(999.6), "1K"],
    ["fmtTokensSig(999.6)", fmtTokensSig(999.6), "1.00K"],
    ["fmtUsd(999.4)", fmtUsd(999.4), "$999"],
    ["fmtUsdSig(999.4)", fmtUsdSig(999.4), "$999"],
    ["fmtUsd(999500)", fmtUsd(999500), "$1M"],
    ["fmtUsdSig(999600)", fmtUsdSig(999600), "$1.00M"],
    ["fmtUsd(999600000)", fmtUsd(999600000), "$1B"],
    ["fmtTokensSig(999600000000)", fmtTokensSig(999600000000), "1.00T"],
    ["fmtUsd(0.4)", fmtUsd(0.4), "$0.4"],
    ["fmtUsd(0)", fmtUsd(0), "$0"],
    ["fmtUsdSig(1250000)", fmtUsdSig(1250000), "$1.25M"],
    ["fmtUsd(-999.6)", fmtUsd(-999.6), "-$1K"],
  ];
  return cases.filter(([, got, want]) => got !== want).map(([name, got, want]) => `formatter ${name} is "${got}", expected "${want}"`);
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
  if (def.id === "C5" && Math.round(results.headline.tokens_multiple * 10) / 10 > 1 && !stage.includes("favours InfraVana"))
    problems.push(`${where} stage: delta label lacks the favours marker text`);
}

/** Runs every check on one `Results`. `tokens` must be the real token values. */
export function runChartChecks(label: string, results: Results, tokens: Tokens): CheckReport {
  const problems: string[] = [];
  const notes: string[] = [];

  problems.push(...checkFormatters().map((p) => `${label} ${p}`));
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
      if (def.id === "C1") {
        checkAllocation(results, size, svg, tokens, dims, problems, `${label} ${dims.width}`);
        if (size === "stage") {
          problems.push(...checkAllocationGeometry(results, svg, tokens, dims, where));
          problems.push(...checkNarrowTitles(results, svg, tokens, dims, where));
          problems.push(...checkLabelList(results, tokens, dims, where));
        }
      }
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
