/**
 * Development check for C10, not part of the app. It draws the chart for a
 * scenario, in each view and at each size, and checks spec 6.3's acceptance
 * items against what is drawn, using numbers it gets by its own route:
 *
 *   (1) every point equals a direct engine run at its threshold;
 *   (2) the height never rises as the threshold tightens;
 *   (3) the marker for the current setting sits at the lowest of the visitor's
 *       workload floors (78 on S1 at defaults), at the height the engine gives there;
 *   (4) the speed view carries the provenance badge and the invented-data source line;
 *   (5) the switch state is in the address (`c10=speed`);
 *   (6) with no proprietary speed rows the speed switch is disabled and says why.
 *
 * and the drawing rules of design-tokens 3.2 (Today as solid reference lines
 * ending in the rank's marker, InfraVana as a step line whose dash is its
 * provenance) and that the end labels do not overlap or leave the canvas.
 * `runC10SelfTests` breaks each rule on purpose and requires a check to say so.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { EChartsCoreOption } from "echarts/core";
import type { Results, Scenario, Tables } from "../../contract";
import { benefitHeadcount, compute, computeCore } from "../../compute";
import type { BenefitBox } from "../../contract";
import { paretoBenefits } from "../benefits";
import { fmtTokensSig } from "../../shared/format";
import { parseHash, serialiseHash, DEFAULT_FIELDS } from "../../store/hash";
import type { HashFields } from "../../store/hash";
import { c10Data, speedViewReason } from "../c10Data";
import type { C10View } from "../c10Data";
import { C10Context } from "../c10Context";
import { ParetoChart } from "../c10Pareto";
import {
  CURRENT_LABEL,
  MARKER_SIZE,
  buildParetoOption,
  endLabelLines,
  lineMarks,
  markName,
  pointMarks,
} from "../c10Option";
import { comparisonOf } from "../comparison";
import { INFRAVANA_LABEL } from "../labels";
import { dashOf } from "../provenanceStyle";
import type { Tokens } from "../tokens";
import type { Dims } from "../useEChart";
import { STYLE_BLOCK, coloursOf, dataOf, renderSvg, sameDash, seriesOf, textsOf } from "./renderCheck";
import type { CheckReport, Obj } from "./renderCheck";

/** Sizes C10 is drawn at: a phone, a narrow desktop, the wide stage, and a thumbnail. */
const SIZES: { size: "stage" | "thumb"; dims: Dims }[] = [
  { size: "stage", dims: { width: 340, height: 360 } },
  { size: "stage", dims: { width: 560, height: 380 } },
  { size: "stage", dims: { width: 760, height: 400 } },
  { size: "stage", dims: { width: 1100, height: 400 } },
  { size: "thumb", dims: { width: 200, height: 112 } },
];

export interface C10Case {
  scenario: Scenario;
  tables: Tables;
  results: Results;
  tokens: Tokens;
  view: C10View;
}

const near = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/** The visitor's own setting on an axis, worked out from the tables alone. */
function expectedCurrent(c: C10Case): number {
  if (c.view === "speed") return c.tables.manifest.parameters.latency_classes[c.scenario.latency_class].min_tok_s_per_user;
  const inMix = new Set(Object.entries(c.scenario.workload_mix).filter(([, share]) => share > 0).map(([id]) => id));
  return Math.min(...c.tables.workloads.filter((w) => inMix.has(w.workload_id)).map((w) => c.scenario.quality_floor ?? w.quality_floor));
}

/** What the budget buys with InfraVana at a threshold, from a direct engine run; null where no plan exists. */
function direct(c: C10Case, threshold: number): number | null {
  const { tradeoff: _ignored, ...own } = c.scenario;
  void _ignored;
  try {
    return c.view === "quality"
      ? compute({ ...own, quality_floor: threshold }, c.tables).tokens_bought.infravana_tokens
      : computeCore(own, c.tables, { min_tok_s_per_user: threshold }).tokens_bought.infravana_tokens;
  } catch {
    return null;
  }
}

/** The slowest offer a Today option buys, from the baseline rows alone; undefined for the derived best single option. */
function expectedSpeed(c: C10Case, patternId: string): number | null | undefined {
  const pattern = c.tables.buying_patterns.find((p) => p.pattern_id === patternId);
  if (!pattern || pattern.kind === "best_single") return undefined;
  const inMix = new Set(Object.entries(c.scenario.workload_mix).filter(([, share]) => share > 0).map(([id]) => id));
  const rows = c.tables.baseline_providers.filter((r) => r.pattern_id === patternId && inMix.has(r.workload_id));
  const speeds = rows.map((r) => c.tables.model_offers.find((o) => o.offer_id === r.offer_id)?.tok_s_per_user ?? null);
  return rows.length === 0 || speeds.some((s) => s === null) ? null : Math.min(...(speeds as number[]));
}

const pointsOf = (option: EChartsCoreOption, name: string): number[][] =>
  seriesOf(option)
    .filter((s) => s.name === name)
    .flatMap((s) => dataOf(s).map((d) => (Array.isArray(d) ? d : ((d as Obj).value as number[]))));

/** The three boxes of spec 6.4 for C10, each against a direct engine run and the comparator's own figure. */
export function c10BoxProblems(c: C10Case, boxes: BenefitBox[], where: string): string[] {
  const problems: string[] = [];
  const fr = c10Data(c.results, c.scenario, c.tables, c.view).frontier;
  const comparator = comparisonOf(c.results).comparator;
  const current = direct(c, expectedCurrent(c));
  const lowest = direct(c, fr.points[0]?.threshold ?? NaN);
  const want = [current, lowest, current !== null && comparator ? current - comparator.tokens_at_budget : null].filter(
    (v): v is number => v !== null && v > 0,
  );
  if (boxes.length > 3) problems.push(`${where}: ${boxes.length} boxes, at most 3`);
  if (boxes.length !== want.length) problems.push(`${where}: ${boxes.length} boxes, expected ${want.length}`);
  boxes.forEach((b, i) => {
    if (want[i] === undefined || !near(b.value, want[i])) problems.push(`${where}: box ${i + 1} is ${b.value}, a direct run gives ${want[i]}`);
    if (b.unit !== "tokens") problems.push(`${where}: box ${i + 1} has unit ${b.unit}`);
    if (b.comparator !== `vs ${comparator?.label}`) problems.push(`${where}: box ${i + 1} names "${b.comparator}", not the comparator`);
    if (b.value <= 0) problems.push(`${where}: box ${i + 1} is not positive`);
  });
  return problems;
}

/** The boxes the stage would show, from the frontier of the view. */
function boxesOf(c: C10Case): BenefitBox[] {
  const frontier = c10Data(c.results, c.scenario, c.tables, c.view).frontier;
  return paretoBenefits(c.results, {
    scenario: c.scenario,
    goal: c.scenario.goal ?? "G1",
    solve: null,
    frontier,
    headcount: benefitHeadcount(c.scenario, c.tables),
  });
}

/** Spec 6.3 acceptance (1) to (3), the Today lines and the line style, read from the drawn option. */
export function c10OptionProblems(c: C10Case, option: EChartsCoreOption, where: string): string[] {
  const problems: string[] = [];
  const t = c.tokens;
  const dots = pointsOf(option, `${INFRAVANA_LABEL} (points)`);
  if (dots.length === 0) problems.push(`${where}: no frontier points are drawn`);

  // (1) Every point equals a direct engine run at its threshold.
  for (const [x, y] of dots) {
    const want = direct(c, x);
    if (want === null) problems.push(`${where}: a point at ${x} has no plan in a direct run`);
    else if (!near(y, want)) problems.push(`${where}: (1) point at ${x} draws ${y}, a direct run gives ${want}`);
  }
  // (2) Never higher as the threshold tightens, on the points and on the line.
  const line = seriesOf(option).find((s) => s.name === INFRAVANA_LABEL);
  const linePts = pointsOf(option, INFRAVANA_LABEL);
  for (const pts of [dots, linePts]) {
    for (let i = 1; i < pts.length; i++) {
      if (pts[i][0] < pts[i - 1][0]) problems.push(`${where}: (2) thresholds run backwards at ${pts[i][0]}`);
      if (pts[i][1] > pts[i - 1][1]) problems.push(`${where}: (2) the height rises from ${pts[i - 1][1]} to ${pts[i][1]} as the threshold tightens to ${pts[i][0]}`);
    }
  }
  // Only points no stricter point beats are drawn (spec 6.3): a point as high as the next, stricter one is beaten.
  for (let i = 1; i < dots.length; i++) {
    if (dots[i][1] >= dots[i - 1][1] && dots[i][1] <= dots[i - 1][1] * (1 + 1e-9))
      problems.push(`${where}: (2) the point at ${dots[i - 1][0]} is beaten by the stricter one at ${dots[i][0]} at the same height ${dots[i][1]}, and is drawn`);
  }
  if (linePts.length !== dots.length + 1 || dots.some((d, i) => !near(d[0], linePts[i + 1]?.[0]) || !near(d[1], linePts[i + 1]?.[1])))
    problems.push(`${where}: the step line does not run through the points`);
  if (!line || (line as Obj).step !== "start") problems.push(`${where}: the InfraVana line is not a step line`);
  // The step is as high at the left edge as at the first point: nothing is bought above the most relaxed setting.
  if (linePts.length > 1 && !near(linePts[0][1], linePts[1][1])) problems.push(`${where}: the line starts at a different height from its first point`);

  // (3) The ring for the current setting.
  const ring = pointsOf(option, CURRENT_LABEL);
  const current = expectedCurrent(c);
  const at = direct(c, current);
  const ringed = at !== null && dots.some((d) => d[0] >= current);
  if (ringed && ring.length !== 1) problems.push(`${where}: (3) ${ring.length} markers for the current setting, expected 1`);
  else if (ringed) {
    if (!near(ring[0][0], current)) problems.push(`${where}: (3) the marker is at ${ring[0][0]}, the lowest workload ${c.view === "quality" ? "floor" : "speed"} is ${current}`);
    if (!near(ring[0][1], at)) problems.push(`${where}: (3) the marker is at height ${ring[0][1]}, a direct run at ${current} gives ${at}`);
  } else if (ring.length !== 0) problems.push(`${where}: (3) a marker is drawn where no point is as strict as the setting`);

  // Line style: the dash of the InfraVana line is its provenance; Today lines are solid.
  const provenance = c.view === "speed" ? "modelled" : c.results.tokens_bought.provenance.infravana;
  const dash = dashOf(provenance, t);
  const style = ((line as Obj | undefined)?.lineStyle ?? {}) as Obj;
  if (dash === null ? style.type !== "solid" : !sameDash(style.type, dash))
    problems.push(`${where}: the InfraVana line is drawn ${JSON.stringify(style.type)} for ${provenance} data`);
  if (style.color !== t.accentStrong || style.width !== t.frontierLineWidth) problems.push(`${where}: the InfraVana line is not ${t.accentStrong} at ${t.frontierLineWidth}px`);

  // Today: one reference line per grey in the quality view; in the speed view a marker at its own speed.
  const cmp = comparisonOf(c.results);
  const greys = [...(cmp.comparator ? [{ alt: cmp.comparator, rank: null as number | null }] : []), ...cmp.options.map((o) => ({ alt: o.alt, rank: o.rank as number | null }))];
  if (greys.length > 4 + 1) problems.push(`${where}: ${greys.length} greys`);
  const design = [
    { fill: t.today2, marker: "circle" },
    { fill: t.today1, marker: "rect" },
    { fill: t.today2, marker: "triangle" },
    { fill: t.today1, marker: "diamond" },
  ];
  for (const g of greys) {
    const name = g.rank === null ? `Today: ${g.alt.label}` : g.alt.label;
    const wantFill = g.rank === null ? t.today1 : design[g.rank - 1].fill;
    const wantMarker = g.rank === null ? "circle" : design[g.rank - 1].marker;
    const speed = c.view === "speed" ? expectedSpeed(c, g.alt.pattern_id) : null;
    const drawnAsPoint = c.view === "speed" && speed !== null && speed !== undefined;
    const s = seriesOf(option).filter((x) => x.name === name);
    if (s.length !== 1) {
      problems.push(`${where}: ${s.length} series for ${name}, expected 1`);
      continue;
    }
    const pts = pointsOf(option, name);
    if (drawnAsPoint) {
      if (s[0].type !== "scatter" || pts.length !== 1) problems.push(`${where}: ${name} is not one marker in the speed view`);
      else if (!near(pts[0][0], speed as number) || !near(pts[0][1], g.alt.tokens_at_budget))
        problems.push(`${where}: ${name} is at (${pts[0][0]}, ${pts[0][1]}), expected (${speed}, ${g.alt.tokens_at_budget})`);
      if (s[0].symbol !== wantMarker) problems.push(`${where}: ${name} marker is ${String(s[0].symbol)}, design says ${wantMarker}`);
      if (((s[0].itemStyle ?? {}) as Obj).color !== wantFill) problems.push(`${where}: ${name} is not its rank's grey`);
      continue;
    }
    if (c.view === "speed" && speed === undefined && pts.length === 1) continue; // best single option: its speed is derived, not read here
    const ls = (s[0].lineStyle ?? {}) as Obj;
    if (s[0].type !== "line" || pts.length !== 2) problems.push(`${where}: ${name} is not a reference line`);
    else {
      if (!near(pts[0][1], g.alt.tokens_at_budget) || !near(pts[1][1], g.alt.tokens_at_budget))
        problems.push(`${where}: ${name} is drawn at ${pts[0][1]} to ${pts[1][1]}, it buys ${g.alt.tokens_at_budget}`);
      if (pts[0][0] === pts[1][0]) problems.push(`${where}: ${name} has no length`);
    }
    if (ls.type !== "solid") problems.push(`${where}: ${name} is drawn ${JSON.stringify(ls.type)}; a dash means provenance, so Today lines are solid`);
    if (ls.color !== wantFill || ls.width !== t.todayLineWidth) problems.push(`${where}: ${name} is not ${wantFill} at ${t.todayLineWidth}px`);
    const end = dataOf(s[0])[1] as Obj | null;
    if (!end || end.symbol !== wantMarker || end.symbolSize !== MARKER_SIZE) problems.push(`${where}: ${name} does not end in a ${wantMarker} marker of ${MARKER_SIZE}px`);
  }
  return problems;
}

/** Texts and positions of an svg: the translate of each `<text>`. */
function placedTexts(svg: string): { text: string; x: number; y: number }[] {
  return [...svg.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)].flatMap((m) => {
    const at = /transform="translate\(([\d.-]+) ([\d.-]+)\)"/.exec(m[1]);
    if (!at) return [];
    const dy = / y="([\d.-]+)"/.exec(m[1]);
    return [{ x: Number(at[1]), y: Number(at[2]) + (dy ? Number(dy[1]) : 0), text: m[2].replace(/&quot;/g, '"').replace(/&amp;/g, "&") }];
  });
}

/** What is drawn: token colours only, no opacity, no NaN, text at stage size and none on a thumbnail, end labels apart and inside. */
export function c10SvgProblems(c: C10Case, svg: string, size: "stage" | "thumb", dims: Dims, where: string): string[] {
  const problems: string[] = [];
  const t = c.tokens;
  if (!svg.startsWith("<svg")) problems.push(`${where}: output is not an svg`);
  if (/NaN|undefined|Infinity/.test(svg)) problems.push(`${where}: svg contains NaN, undefined or Infinity`);
  const allowed = new Set(Object.values(t).filter((v): v is string => typeof v === "string").map((v) => v.toLowerCase()));
  // A clip path is a rectangle that hides, never a drawn colour.
  for (const colour of coloursOf(svg.replace(/<clipPath[\s\S]*?<\/clipPath>/g, "")).drawn) if (!allowed.has(colour)) problems.push(`${where}: colour ${colour} is not a token value`);
  for (const m of svg.replace(STYLE_BLOCK, "").matchAll(/\s(?:fill-|stroke-)?opacity="([\d.]+)"/g)) {
    if (Number(m[1]) < 1) problems.push(`${where}: a shape is drawn with opacity ${m[1]}`);
  }
  const texts = textsOf(svg);
  if (size === "thumb" && texts.length > 0) problems.push(`${where}: thumb draws ${texts.length} text nodes, expected none`);
  if (size === "stage" && texts.length === 0) problems.push(`${where}: stage draws no text`);
  if (size === "stage" && !texts.includes(INFRAVANA_LABEL)) problems.push(`${where}: the InfraVana line is not labelled`);

  // End labels (wide quality view): one per reference line, apart from each other, inside the canvas.
  if (size === "stage" && dims.width >= 600 && c.view === "quality") {
    const column = Math.round(Math.min(220, Math.max(140, dims.width * 0.26)));
    const wanted = lineMarks(c10Data(c.results, c.scenario, c.tables, c.view)).flatMap((m) => endLabelLines(m, column, t).map((l) => l.text));
    const placed = placedTexts(svg).filter((p) => wanted.includes(p.text));
    for (const text of new Set(wanted)) {
      if (!placed.some((p) => p.text === text)) problems.push(`${where}: end label text "${text}" is not drawn`);
    }
    if (placed.length > 0 && Math.max(...placed.map((p) => p.x)) - Math.min(...placed.map((p) => p.x)) > 2)
      problems.push(`${where}: the end labels are not in one column (x from ${Math.min(...placed.map((p) => p.x))} to ${Math.max(...placed.map((p) => p.x))})`);
    const sorted = [...placed].sort((a, b) => a.y - b.y);
    for (let i = 1; i < sorted.length; i++) {
      if (Math.abs(sorted[i].x - sorted[i - 1].x) < 2 && sorted[i].y - sorted[i - 1].y < t.lineXs - 1)
        problems.push(`${where}: end labels "${sorted[i - 1].text}" and "${sorted[i].text}" are ${(sorted[i].y - sorted[i - 1].y).toFixed(1)}px apart`);
    }
    for (const p of placed) if (p.y < 0 || p.y > dims.height) problems.push(`${where}: end label "${p.text}" is outside the chart`);
  }
  return problems;
}

/** The markup of the stage chart with the inputs C10 reads, and the switch it carries. */
export function c10Markup(c: Pick<C10Case, "scenario" | "tables" | "results">, view: C10View, size: "stage" | "thumb" = "stage"): string {
  return renderToStaticMarkup(
    createElement(
      C10Context.Provider,
      { value: { scenario: c.scenario, tables: c.tables, view, setView: () => undefined } },
      createElement(ParetoChart, { results: c.results, size }),
    ),
  );
}

/** Acceptance (4) and (6), and the key, read from markup. `hasSpeed` says whether the tables carry speed data. */
export function c10MarkupProblems(markup: string, view: C10View, hasSpeed: boolean, reason: string | null, where: string): string[] {
  const problems: string[] = [];
  const radios = [...markup.matchAll(/<input[^>]*type="radio"[^>]*>/g)].map((m) => m[0]);
  if (radios.length !== 2) problems.push(`${where}: ${radios.length} switch options, expected 2`);
  const speed = radios.find((r) => r.includes('value="speed"')) ?? "";
  const quality = radios.find((r) => r.includes('value="quality"')) ?? "";
  // The view in force is the one checked; asking for speed without speed data shows quality.
  const shown: C10View = view === "speed" && hasSpeed ? "speed" : "quality";
  if (!(shown === "speed" ? speed : quality).includes("checked")) problems.push(`${where}: the ${shown} option is not the checked one`);
  if ((shown === "speed" ? quality : speed).includes("checked")) problems.push(`${where}: the other option is also checked`);
  // (6) No speed data: the speed option is disabled and the reason is on the page.
  if (!hasSpeed) {
    if (!/\sdisabled/.test(speed)) problems.push(`${where}: (6) the speed option is not disabled although no offer has speed data`);
    // The words on the page, not only the tooltip attribute.
    const at = markup.indexOf('class="c10-switch__reason">');
    if (reason === null || at < 0 || !markup.startsWith(reason, at + 'class="c10-switch__reason">'.length)) problems.push(`${where}: (6) the reason the speed view is off is not shown`);
  } else {
    if (/\sdisabled/.test(speed)) problems.push(`${where}: the speed option is disabled although speed data exists`);
    if (reason !== null) problems.push(`${where}: a reason is shown although speed data exists`);
  }
  // (4) The speed view carries the provenance badge and the invented-data source line.
  const invented = markup.includes("prov-badge--invented");
  const inventedSource = markup.includes("<b>Source:</b> invented placeholder data.");
  if (shown === "speed") {
    if (!markup.includes("prov-badge--modelled")) problems.push(`${where}: (4) the speed view has no modelled badge`);
    if (!invented) problems.push(`${where}: (4) the speed view has no invented-placeholder badge`);
    if (!inventedSource) problems.push(`${where}: (4) the speed view does not say "Source: invented placeholder data."`);
  } else {
    if (invented || inventedSource) problems.push(`${where}: the quality view claims invented data`);
    if (!markup.includes("<b>Source:</b>")) problems.push(`${where}: no source line`);
  }
  return problems;
}

/** Acceptance (5): the address holds the view, and loading it restores the view. */
export function c10AddressProblems(
  serialise: (f: HashFields) => string = serialiseHash,
  parse: (h: string) => HashFields = parseHash,
): string[] {
  const problems: string[] = [];
  const speed = serialise({ ...DEFAULT_FIELDS, slide: "C10", c10: "speed" });
  if (!/(^|[#&])c10=speed(&|$)/.test(speed)) problems.push(`(5) the address of the speed view is ${speed}, with no c10=speed`);
  if (parse(speed).c10 !== "speed") problems.push(`(5) ${speed} does not load as the speed view`);
  if (parse(speed).slide !== "C10") problems.push(`(5) ${speed} does not load as C10`);
  const quality = serialise({ ...DEFAULT_FIELDS, slide: "C10", c10: "quality" });
  if (quality.includes("c10=")) problems.push(`(5) the default view is written into the address: ${quality}`);
  if (parse(quality).c10 !== "quality") problems.push(`(5) ${quality} does not load as the quality view`);
  if (parse("#slide=C10&c10=nonsense").c10 !== "quality") problems.push("(5) an unknown c10 value does not fall back to quality");
  return problems;
}

/** Every C10 check for one scenario at every size, in each view the tables allow. */
export function runC10Checks(label: string, scenario: Scenario, tables: Tables, results: Results, tokens: Tokens): CheckReport {
  const problems: string[] = [];
  const notes: string[] = [];
  const reason = speedViewReason(tables);
  const views: C10View[] = reason === null ? ["quality", "speed"] : ["quality"];
  for (const view of views) {
    const c: C10Case = { scenario, tables, results, tokens, view };
    const data = c10Data(results, scenario, tables, view);
    notes.push(
      `${label} C10 ${view}: ${data.frontier.points.length} points, current ${data.frontier.current_threshold} -> ${data.current_tokens === null ? "none" : fmtTokensSig(data.current_tokens)}, greys ${data.today.map((m) => m.alt.pattern_id).join(", ")}`,
    );
    for (const { size, dims } of SIZES) {
      const where = `${label} C10 ${view} ${size} ${dims.width}`;
      let option: EChartsCoreOption = {};
      let svg = "";
      try {
        option = buildParetoOption(data, size, tokens, dims);
        svg = renderSvg(option, dims);
      } catch (e) {
        problems.push(`${where}: draw threw ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }
      problems.push(...c10OptionProblems(c, option, where), ...c10SvgProblems(c, svg, size, dims, where));
    }
    problems.push(...c10MarkupProblems(c10Markup(c, view), view, reason === null, reason, `${label} C10 ${view} markup`));
    problems.push(...c10BoxProblems(c, boxesOf(c), `${label} C10 ${view} boxes`));
    // Without a frontier there are no boxes, and the stage does not invent any.
    if (paretoBenefits(results, { scenario, goal: "G1", solve: null, frontier: null, headcount: null }).length !== 0) problems.push(`${label} C10 ${view}: boxes without a frontier`);
    const thumb = c10Markup(c, view, "thumb");
    if (thumb.includes("<input") || thumb.includes("Source:")) problems.push(`${label} C10 ${view} thumb: switch or source line present`);
    if (pointMarks(data).length + lineMarks(data).length !== data.today.length) problems.push(`${label} C10 ${view}: a Today option is neither a line nor a point`);
  }
  // A view asked for that the data cannot give: the speed switch is off and quality is shown.
  if (reason !== null) problems.push(...c10MarkupProblems(c10Markup({ scenario, tables, results }, "speed"), "speed", false, reason, `${label} C10 speed-asked-without-data`));
  // The same tables with every speed value removed.
  const bare: Tables = { ...tables, model_offers: tables.model_offers.map((o) => ({ ...o, tok_s_per_user: null, p95_ttft_ms: null })) };
  const bareReason = speedViewReason(bare);
  if (bareReason === null) problems.push(`${label} C10: tables without speed data still offer the speed view`);
  problems.push(
    ...c10MarkupProblems(c10Markup({ scenario, tables: bare, results }, "quality"), "quality", false, bareReason, `${label} C10 no-speed-data`),
    ...c10MarkupProblems(c10Markup({ scenario, tables: bare, results }, "speed"), "speed", false, bareReason, `${label} C10 no-speed-data asked for speed`),
  );
  return { problems, notes };
}

/**
 * Breaks each rule on purpose and requires a check to say so. Each problem of
 * the report is a mutant that was not caught.
 */
export function runC10SelfTests(scenario: Scenario, tables: Tables, results: Results, tokens: Tokens): CheckReport {
  const problems: string[] = [];
  const notes: string[] = [];
  const dims: Dims = { width: 1100, height: 400 };
  const expect = (name: string, found: string[], clean: string[] = []) => {
    if (clean.length > 0) problems.push(`C10 self-test ${name}: the unbroken version reports ${clean.length} problem(s): ${clean[0]}`);
    if (found.length === 0) problems.push(`C10 self-test ${name}: the broken version was not caught`);
    else notes.push(`C10 self-test ${name}: caught (${found[0]})`);
  };
  const edit = (option: EChartsCoreOption, name: string, change: (s: Obj) => Obj): EChartsCoreOption =>
    ({ ...(option as Obj), series: seriesOf(option).map((s) => (s.name === name ? change(s) : s)) }) as EChartsCoreOption;
  const mapData = (s: Obj, f: (d: unknown, i: number, all: unknown[]) => unknown): Obj => ({ ...s, data: dataOf(s).map(f) });
  const withValue = (d: unknown, value: number[]): unknown => (Array.isArray(d) ? value : { ...(d as Obj), value });
  const valueOf = (d: unknown): number[] => (Array.isArray(d) ? d : ((d as Obj).value as number[]));

  for (const view of ["quality", "speed"] as const) {
    if (view === "speed" && speedViewReason(tables) !== null) continue;
    const c: C10Case = { scenario, tables, results, tokens, view };
    const data = c10Data(results, scenario, tables, view);
    const option = buildParetoOption(data, "stage", tokens, dims);
    const clean = c10OptionProblems(c, option, view);
    const dots = `${INFRAVANA_LABEL} (points)`;
    const last = data.frontier.points.length - 1;
    const v = (name: string) => `${view}: ${name}`;
    expect(v("(1) a point is 1% off its direct value"), c10OptionProblems(c, edit(option, dots, (s) => mapData(s, (d, i) => (i === 0 ? withValue(d, [valueOf(d)[0], valueOf(d)[1] * 1.01]) : d))), view), clean);
    expect(v("(1) a point is at the wrong threshold"), c10OptionProblems(c, edit(option, dots, (s) => mapData(s, (d, i) => (i === 0 ? withValue(d, [valueOf(d)[0] + 0.5, valueOf(d)[1]]) : d))), view));
    expect(v("(2) the height rises at the strictest point"), c10OptionProblems(c, edit(option, dots, (s) => mapData(s, (d, i) => (i === last ? withValue(d, [valueOf(d)[0], valueOf(dataOf(s)[0])[1] * 1.05]) : d))), view));
    expect(v("(2) the points run in reverse"), c10OptionProblems(c, edit(option, dots, (s) => ({ ...s, data: [...dataOf(s)].reverse() })), view));
    expect(v("(3) the marker is at the highest threshold"), c10OptionProblems(c, edit(option, CURRENT_LABEL, (s) => mapData(s, (d) => withValue(d, [data.frontier.points[last].threshold, valueOf(d)[1]]))), view));
    expect(v("(3) the marker is at the wrong height"), c10OptionProblems(c, edit(option, CURRENT_LABEL, (s) => mapData(s, (d) => withValue(d, [valueOf(d)[0], valueOf(d)[1] * 0.97]))), view));
    expect(v("(3) there is no marker"), c10OptionProblems(c, edit(option, CURRENT_LABEL, (s) => ({ ...s, data: [] })), view));
    expect(v("the InfraVana line is solid whatever its provenance"), c10OptionProblems(c, edit(option, INFRAVANA_LABEL, (s) => ({ ...s, lineStyle: { ...(s.lineStyle as Obj), type: "solid" } })), view));
    expect(v("the InfraVana line is not a step"), c10OptionProblems(c, edit(option, INFRAVANA_LABEL, (s) => ({ ...s, step: undefined })), view));
    const cmp = comparisonOf(results);
    const boxes = boxesOf(c);
    const cleanBoxes = c10BoxProblems(c, boxes, view);
    expect(v("(6.4) a box is 1% off its direct value"), c10BoxProblems(c, boxes.map((b, i) => (i === 0 ? { ...b, value: b.value * 1.01 } : b)), view), cleanBoxes);
    expect(v("(6.4) a box names no comparator"), c10BoxProblems(c, boxes.map((b, i) => (i === 1 ? { ...b, comparator: "" } : b)), view));
    expect(v("(6.4) four boxes"), c10BoxProblems(c, [...boxes, boxes[0]], view));
    expect(v("(6.4) the boxes are in the wrong order"), c10BoxProblems(c, [...boxes].reverse(), view));
    const some = cmp.options[0];
    const someName = some.alt.label;
    if (view === "quality") {
      expect(v("a Today line is dashed"), c10OptionProblems(c, edit(option, someName, (s) => ({ ...s, lineStyle: { ...(s.lineStyle as Obj), type: [6, 3] } })), view));
      expect(v("a Today line is at the wrong height"), c10OptionProblems(c, edit(option, someName, (s) => mapData(s, (d) => withValue(d, [valueOf(d)[0], valueOf(d)[1] * 1.1]))), view));
      expect(v("a Today line has the wrong marker"), c10OptionProblems(c, edit(option, someName, (s) => mapData(s, (d, i) => (i === 1 ? { ...(d as Obj), symbol: "pin" } : d))), view));
      // A line dropped from the chart.
      expect(v("a Today line is missing"), c10OptionProblems(c, { ...(option as Obj), series: seriesOf(option).filter((s) => s.name !== someName) } as EChartsCoreOption, view));
    } else {
      const point = data.today.find((m) => m.speed !== null && m.rank !== null);
      if (point) {
        const name = markName(point);
        expect(v("a Today marker is at the wrong speed"), c10OptionProblems(c, edit(option, name, (s) => mapData(s, (d) => withValue(d, [valueOf(d)[0] + 5, valueOf(d)[1]]))), view));
      }
    }
    // End labels piled on one another (wide quality view).
    if (view === "quality") {
      const svg = renderSvg(option, dims);
      const cleanSvg = c10SvgProblems(c, svg, "stage", dims, view);
      const marks = lineMarks(data);
      if (marks.length >= 2) {
        // Move every label to the same line by editing the svg: the second text of each label takes the first's y.
        const placed = placedTexts(svg);
        const first = placed.find((p) => endLabelLines(marks[0], 220, tokens).some((l) => l.text === p.text));
        const squashed = svg.replace(/<text([^>]*)transform="translate\(([\d.-]+) ([\d.-]+)\)"([^>]*)>([^<]*)<\/text>/g, (m, a, x, _y, b, text: string) =>
          marks.slice(1).some((mk) => endLabelLines(mk, 220, tokens).some((l) => l.text === text.replace(/&amp;/g, "&"))) && first
            ? `<text${a}transform="translate(${x} ${first.y})"${b}>${text}</text>`
            : m,
        );
        expect(v("end labels sit on top of each other"), c10SvgProblems(c, squashed, "stage", dims, view), cleanSvg);
      }
      expect(v("a colour that is not a token"), c10SvgProblems(c, svg.replace(new RegExp(tokens.accentStrong.replace("#", "#?"), "gi"), "#123456"), "stage", dims, view));
    }
  }

  // Markup: (4) and (6).
  const reason = speedViewReason(tables);
  const hasSpeed = reason === null;
  const speedMarkup = c10Markup({ scenario, tables, results }, "speed");
  const qualityMarkup = c10Markup({ scenario, tables, results }, "quality");
  const cleanQ = c10MarkupProblems(qualityMarkup, "quality", hasSpeed, reason, "q");
  expect("quality markup", [...c10MarkupProblems(qualityMarkup.replace(/<input[^>]*value="quality"[^>]*>/, (tag) => tag.replace(/\schecked=""/, "")), "quality", hasSpeed, reason, "q")], cleanQ);
  if (hasSpeed) {
    const cleanS = c10MarkupProblems(speedMarkup, "speed", hasSpeed, reason, "s");
    expect("(4) the speed view has no invented badge", c10MarkupProblems(speedMarkup.replace(/prov-badge--invented/g, "prov-badge--x"), "speed", hasSpeed, reason, "s"), cleanS);
    expect("(4) the speed view has the default source line", c10MarkupProblems(speedMarkup.replace("invented placeholder data.", "InfraVana cost model on illustrative price tables."), "speed", hasSpeed, reason, "s"));
    expect("(4) the speed view has no modelled badge", c10MarkupProblems(speedMarkup.replace(/prov-badge--modelled/g, "prov-badge--x"), "speed", hasSpeed, reason, "s"));
    expect("the quality view claims invented data", c10MarkupProblems(qualityMarkup.replace("<b>Source:</b>", "<b>Source:</b> invented placeholder data."), "quality", hasSpeed, reason, "q"));
    expect("the speed option is disabled with speed data", c10MarkupProblems(speedMarkup.replace(/<input([^>]*value="speed")/, "<input disabled=\"\"$1"), "speed", hasSpeed, reason, "s"));
  }
  const bare: Tables = { ...tables, model_offers: tables.model_offers.map((o) => ({ ...o, tok_s_per_user: null, p95_ttft_ms: null })) };
  const bareReason = speedViewReason(bare);
  const bareMarkup = c10Markup({ scenario, tables: bare, results }, "quality");
  const cleanBare = c10MarkupProblems(bareMarkup, "quality", false, bareReason, "b");
  expect("(6) the speed option is not disabled without speed data", c10MarkupProblems(bareMarkup.replace(/\sdisabled=""/g, ""), "quality", false, bareReason, "b"), cleanBare);
  expect("(6) the reason is not shown without speed data", c10MarkupProblems(bareMarkup.split(bareReason ?? "").join(""), "quality", false, bareReason, "b"));
  expect("(6) the speed view is drawn without speed data", c10MarkupProblems(c10Markup({ scenario, tables: bare, results }, "speed").replace(/checked=""/, ""), "speed", false, bareReason, "b"));

  // (5) The address.
  const cleanAddress = c10AddressProblems();
  expect("(5) the address leaves c10 out", c10AddressProblems((f) => serialiseHash({ ...f, c10: "quality" })), cleanAddress);
  expect("(5) the address ignores c10 when loading", c10AddressProblems(serialiseHash, (h) => ({ ...parseHash(h), c10: "quality" })));
  expect("(5) the address writes the default view", c10AddressProblems((f) => `${serialiseHash(f)}&c10=${f.c10}`));
  return { problems, notes };
}
