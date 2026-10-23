import { beforeAll, describe, expect, it } from "vitest";
import type { EChartsCoreOption } from "echarts/core";
import { c5Figures } from "../compute/goals";
import { compute } from "../compute";
import type { Results, Scenario, SolveResult, Tables } from "../contract";
import { loadFixtureScenario, loadFixtureTables, restoreFetch } from "../test/fixtures";
import { fmtUsdSig } from "../shared/format";
import { realTokens } from "../test/cssTokens";
import { buildAllocationOption } from "./c1Allocation";
import { buildCostPerMtokOption } from "./c3CostPerMtok";
import { buildTokensBoughtOption } from "./c5TokensBought";
import { comparisonOf } from "./comparison";
import { MAX_OPTIONS } from "./patterns";
import {
  dataOf,
  designTableProblems,
  noPatternOrDashProblems,
  renderSvg,
  seriesOf,
  structureProblemsC1,
  structureProblemsC3,
  structureProblemsC5,
  styleOf,
  tooltipProblems,
} from "./dev/renderCheck";
import type { Obj } from "./dev/renderCheck";
import type { Dims } from "./useEChart";

/**
 * Spec 15.11 acceptance (1) to (9) for C1, C3 and C5, on the options the real
 * builders return with the real token values, and the same rules proved to
 * fail on broken options. (C10 is drawn and checked by the render check; its
 * rules are read there from the drawn option and SVG.)
 */

const t = realTokens();
const WIDE: Dims = { width: 1280, height: 480 };
const PHONE: Dims = { width: 390, height: 700 };

let tables: Tables;
let s1: Scenario;
let s2: Scenario;
beforeAll(async () => {
  tables = await loadFixtureTables();
  s1 = await loadFixtureScenario("s1");
  s2 = await loadFixtureScenario("s2");
  restoreFetch();
});

const stages = ["seats", "api", "platform"] as const;
const resultsAt = (scenario: Scenario, stage: (typeof stages)[number], comparator?: string): Results =>
  compute({ ...scenario, stage_today: stage, ...(comparator ? { comparator } : {}) }, tables);

const solve = (r: Results): SolveResult => ({
  axis: "intensity",
  today_scale: 1,
  infravana_scale: 1.2,
  multiple: 1.2,
  today_tokens: r.tokens_bought.today_tokens,
  infravana_tokens: r.tokens_bought.infravana_tokens,
  capped_at_users_max: false,
});

/** Every option the three charts draw for one `Results`, at stage size on a desktop and on a phone, and as a thumbnail. */
function drawings(r: Results): { where: string; option: EChartsCoreOption; svg: string; dims: Dims; stage: boolean; chart: "C1" | "C3" | "C5" }[] {
  const out: { where: string; option: EChartsCoreOption; svg: string; dims: Dims; stage: boolean; chart: "C1" | "C3" | "C5" }[] = [];
  for (const [dims, size] of [[WIDE, "stage"], [PHONE, "stage"], [{ width: 240, height: 135 }, "thumb"]] as const) {
    const make: [typeof out[number]["chart"], EChartsCoreOption][] = [
      ["C1", buildAllocationOption(r, size, t, dims)],
      ["C3", buildCostPerMtokOption(r, size, t, dims)],
      ["C5", buildTokensBoughtOption(r, size, t, dims)],
    ];
    for (const [chart, option] of make) out.push({ where: `${chart} ${size} ${dims.width}`, option, svg: renderSvg(option, dims), dims, stage: size === "stage", chart });
  }
  return out;
}

describe("no pattern, decal, dash or dot in any chart option (spec 15.11 acceptance 1, 15.10 acceptance 1)", () => {
  it.each(stages)("C1, C3 and C5 at stage %s, on a desktop, a phone and as thumbnails", (stage) => {
    for (const scenario of [s1, s2]) {
      for (const d of drawings(resultsAt(scenario, stage))) {
        expect(noPatternOrDashProblems(d.option, d.svg, d.where), d.where).toEqual([]);
        // The chart library's automatic decal is off: no aria block turns it on.
        expect(JSON.stringify(d.option)).not.toMatch(/"decal"/);
      }
    }
  });

  it("holds under every comparator and in every tab of C5", () => {
    const base = resultsAt(s1, "api");
    for (const alt of base.today_alternatives) {
      const r = resultsAt(s1, "api", alt.pattern_id);
      for (const d of drawings(r)) expect(noPatternOrDashProblems(d.option, d.svg, d.where), `${alt.pattern_id} ${d.where}`).toEqual([]);
    }
    for (const goal of ["G1", "G2", "G3", "G4"] as const) {
      const option = buildTokensBoughtOption(base, "stage", t, WIDE, c5Figures(goal, base, goal === "G2" || goal === "G3" ? solve(base) : null));
      expect(noPatternOrDashProblems(option, renderSvg(option, WIDE), `C5 ${goal}`)).toEqual([]);
    }
  });

  it("finds a decal, a dashed border, a dashed line, a dash array or a pattern in a broken option", () => {
    expect(noPatternOrDashProblems({ series: [{ itemStyle: { decal: { symbol: "rect" } } }] } as EChartsCoreOption, null, "x")).not.toEqual([]);
    expect(noPatternOrDashProblems({ series: [{ itemStyle: { borderType: [6, 3] } }] } as EChartsCoreOption, null, "x")).not.toEqual([]);
    expect(noPatternOrDashProblems({ series: [{ lineStyle: { type: "dotted" } }] } as EChartsCoreOption, null, "x")).not.toEqual([]);
    expect(noPatternOrDashProblems({ series: [{ itemStyle: { dashArrayX: [1, 2] } }] } as EChartsCoreOption, null, "x")).not.toEqual([]);
    expect(noPatternOrDashProblems({}, '<svg><pattern id="a"/></svg>', "x")).not.toEqual([]);
    expect(noPatternOrDashProblems({}, '<svg><path stroke-dasharray="2 2"/></svg>', "x")).not.toEqual([]);
  });
});

describe("the Today roles (spec 15.11 acceptance 2)", () => {
  /** The fill of every series, by name, for each chart. */
  const fillsOf = (r: Results): Record<string, Record<string, string>> => {
    const cmp = comparisonOf(r);
    const names = [`Today: ${cmp.label}`, "With InfraVana", ...cmp.options.map((o) => o.alt.label)];
    const c1 = seriesOf(buildAllocationOption(r, "stage", t, WIDE)).filter((s) => s.type !== "custom");
    const c3 = seriesOf(buildCostPerMtokOption(r, "stage", t, WIDE));
    const c5Data = dataOf(seriesOf(buildTokensBoughtOption(r, "stage", t, WIDE))[0] as Obj);
    const out: Record<string, Record<string, string>> = { C1: {}, C3: {}, C5: {} };
    // C1: the comparator's segments, then InfraVana's, then the saved block, then one bar per option.
    const first = c1.map((s) => (dataOf(s).findIndex((d) => d !== null)));
    c1.forEach((s, i) => {
      const row = first[i] as number;
      const name = names[row] as string;
      if (s.name !== "Saved") out.C1[name] = String(styleOf(dataOf(s)[row] as Obj).color);
    });
    c3.forEach((s, i) => (out.C3[names[i] as string] = String(styleOf(s).color)));
    c5Data.forEach((d, i) => (out.C5[names[i] as string] = String(styleOf(d).color)));
    return out;
  };

  it.each(stages)("the comparator is today1 and option k is today(k+1) in C1, C3 and C5 at stage %s", (stage) => {
    const r = resultsAt(s1, "api");
    void stage;
    const cmp = comparisonOf(resultsAt(s1, stage));
    const fills = fillsOf(resultsAt(s1, stage));
    const comparatorName = `Today: ${cmp.label}`;
    for (const chart of ["C1", "C3", "C5"] as const) {
      expect(fills[chart]?.[comparatorName], `${chart} comparator`).toBe(t.today1);
      expect(fills[chart]?.["With InfraVana"], `${chart} InfraVana`).toBe(t.accent);
      cmp.options.forEach((o, k) => {
        expect(fills[chart]?.[o.alt.label], `${chart} option ${k + 1}`).toBe([t.today2, t.today3, t.today4][k]);
      });
    }
    void r;
  });

  it("the colours do not change with the tab, or after a reload", () => {
    const r = resultsAt(s1, "api");
    const before = fillsOf(r);
    // After a reload the page computes the same Results again from the same address.
    expect(fillsOf(resultsAt(s1, "api"))).toEqual(before);
    // C5 in every tab keeps its colours.
    const colours = (goal: "G1" | "G2" | "G3" | "G4") =>
      dataOf(seriesOf(buildTokensBoughtOption(r, "stage", t, WIDE, c5Figures(goal, r, goal === "G2" || goal === "G3" ? solve(r) : null)))[0] as Obj).map((d) => styleOf(d).color);
    for (const goal of ["G2", "G3", "G4"] as const) expect(colours(goal)).toEqual(colours("G1"));
  });

  it("a different comparator takes today1 and the old one drops to an option colour", () => {
    const base = resultsAt(s1, "api");
    const other = base.today_alternatives.find((a) => a.pattern_id !== base.comparator && a.is_grey);
    expect(other).toBeDefined();
    const r = resultsAt(s1, "api", other?.pattern_id);
    const fills = fillsOf(r);
    expect(fills.C1?.[`Today: ${other?.label}`]).toBe(t.today1);
    expect(Object.values(fills.C1 ?? {}).filter((c) => c === t.today1)).toHaveLength(1);
  });

  it("the option table: three option hues after the comparator's, at most three options, no pattern", () => {
    expect(designTableProblems()).toEqual([]);
    expect(MAX_OPTIONS).toBe(3);
    for (const stage of stages) expect(comparisonOf(resultsAt(s1, stage)).options.length).toBeLessThanOrEqual(MAX_OPTIONS);
  });
});

describe("bars, gaps and the saving (spec 15.11 acceptance 3 and 4)", () => {
  it.each(stages)("C1 at stage %s: barWidth 24, no border, a 2px paper gap on each boundary, one Saved block that equals both savings", (stage) => {
    const r = resultsAt(s1, stage);
    const option = buildAllocationOption(r, "stage", t, WIDE);
    const series = seriesOf(option);
    const bars = series.filter((s) => s.type !== "custom");
    expect(t.barThickness).toBe(24);
    expect(t.separatorWidth).toBe(2);
    for (const s of bars) {
      expect(s.barWidth).toBe(24);
      for (const d of dataOf(s)) {
        if (!d) continue;
        const style = styleOf(d);
        expect(style.borderWidth ?? 0).toBe(0);
        expect(style.decal).toBeUndefined();
      }
    }
    // The gaps: one series, a rectangle 2px wide in the paper colour on each boundary of a bar of several segments.
    const gaps = series.filter((s) => s.type === "custom");
    const segmented = new Set(bars.flatMap((s) => dataOf(s).map((d, row) => (d ? row : -1)).filter((row) => row >= 0)).filter((row) => bars.filter((s) => dataOf(s)[row]).length > 1));
    expect(gaps.length).toBe(segmented.size > 0 ? 1 : 0);
    const saved = bars.filter((s) => s.name === "Saved");
    expect(saved).toHaveLength(1);
    const total = r.allocation.infravana.filter((s) => s.kind === "savings").reduce((sum, s) => sum + s.usd, 0);
    const value = Number(dataOf(saved[0] as Obj).find((d) => d !== null)?.value);
    expect(value).toBeCloseTo(total, 6);
    expect(structureProblemsC1(r, option, t, "C1", WIDE)).toEqual([]);
  });

  it.each(stages)("C1 at stage %s draws the block as 'Saved $X' with the sum of both savings, and the row says '$X saved'", (stage) => {
    const r = resultsAt(s1, stage);
    const total = r.allocation.infravana.filter((s) => s.kind === "savings").reduce((sum, s) => sum + s.usd, 0);
    const svg = renderSvg(buildAllocationOption(r, "stage", t, WIDE), WIDE);
    const texts = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
    expect(texts).toContain(`Saved ${fmtUsdSig(total)}`);
    expect(texts.some((x) => x.includes(`${fmtUsdSig(total)} saved`))).toBe(true);
  });

  it("C5 bars are 24px with no border at stage size", () => {
    const r = resultsAt(s1, "api");
    const option = buildTokensBoughtOption(r, "stage", t, WIDE);
    expect((seriesOf(option)[0] as Obj).barWidth).toBe(24);
    expect(structureProblemsC5(r, option, renderSvg(option, WIDE), "stage", false, "C5", t, WIDE)).toEqual([]);
  });

  it("the y axis rule is hidden and the budget line is 1px in secondary ink", () => {
    const r = resultsAt(s1, "api");
    const option = buildAllocationOption(r, "stage", t, WIDE) as Obj;
    expect(((option.yAxis as Obj).axisLine as Obj).show).toBe(false);
    const line = ((seriesOf(option as EChartsCoreOption)[0] as Obj).markLine as Obj).data as Obj[];
    expect((line[0]?.lineStyle as Obj).width).toBe(1);
    expect((line[0]?.lineStyle as Obj).color).toBe(t.textSecondary);
  });
});

describe("the price chart (spec 15.11 acceptance 5)", () => {
  it.each(stages)("at stage %s every Today option and InfraVana is a bar on one category axis, at most 44px, 13% of the class", (stage) => {
    const r = resultsAt(s1, stage);
    const option = buildCostPerMtokOption(r, "stage", t, WIDE);
    const series = seriesOf(option);
    expect(series).toHaveLength(2 + comparisonOf(r).options.length);
    for (const s of series) {
      expect(s.type).toBe("bar");
      expect(s.barWidth).toBe("13%");
      expect(s.barMaxWidth).toBe(44);
    }
    expect(((option as Obj).xAxis as Obj).type).toBe("category");
    expect(structureProblemsC3(r, option, t, "C3")).toEqual([]);
  });
});

describe("the phone (spec 15.11 acceptance 7)", () => {
  it.each(stages)("at 390px C1 and C5 hide the y axis labels and draw each row name above its bar, rows of 84px, at stage %s", (stage) => {
    const r = resultsAt(s1, stage);
    const c1 = buildAllocationOption(r, "stage", t, PHONE);
    const c5 = buildTokensBoughtOption(r, "stage", t, PHONE);
    for (const option of [c1, c5]) {
      expect((((option as Obj).yAxis as Obj).axisLabel as Obj).show).toBe(false);
    }
    expect(structureProblemsC1(r, c1, t, "C1 phone", PHONE)).toEqual([]);
    expect(structureProblemsC5(r, c5, renderSvg(c5, PHONE), "stage", false, "C5 phone", t, PHONE)).toEqual([]);
    // Each row's name sits at [0, -4] above its bar, and the name is drawn.
    const cmp = comparisonOf(r);
    const svg = renderSvg(c1, PHONE);
    for (const name of [cmp.label, "With InfraVana", ...cmp.options.map((o) => o.alt.label)]) {
      for (const word of name.split(" ").slice(0, 2)) expect(svg).toContain(word.replace(/&/g, "&amp;"));
    }
  });

  it("a wide chart keeps the row names on the axis", () => {
    const r = resultsAt(s1, "api");
    expect((((buildAllocationOption(r, "stage", t, WIDE) as Obj).yAxis as Obj).axisLabel as Obj).show).not.toBe(false);
  });
});

describe("labels on a fill reach 4.5:1 (spec 15.11 acceptance 9)", () => {
  it("in C1 at every stage and width", () => {
    for (const stage of stages) {
      const r = resultsAt(s1, stage);
      for (const dims of [WIDE, { width: 760, height: 400 }]) {
        expect(structureProblemsC1(r, buildAllocationOption(r, "stage", t, dims), t, "C1", dims).filter((p) => p.includes(":1,"))).toEqual([]);
      }
    }
  });
});

describe("no tooltip names a provenance (spec 15.10 acceptance 2)", () => {
  it("in C1, C3 or C5 on any item", () => {
    const r = resultsAt(s1, "seats");
    for (const d of drawings(r).filter((x) => x.stage)) expect(tooltipProblems(d.option, d.where)).toEqual([]);
  });
});

describe("the same rules fail on a broken option", () => {
  const r = () => resultsAt(s1, "api");
  const map = (option: EChartsCoreOption, change: (s: Obj, i: number) => Obj): EChartsCoreOption =>
    ({ ...(option as Obj), series: seriesOf(option).map(change) }) as EChartsCoreOption;

  it("C1: an option bar in the comparator's colour, a 58% bar, an ink outline, two saved blocks", () => {
    const res = r();
    const good = buildAllocationOption(res, "stage", t, WIDE);
    const lastOption = seriesOf(good).filter((s) => s.type !== "custom").length - 1;
    const row = dataOf(seriesOf(good)[lastOption] as Obj).findIndex((d) => d !== null);
    expect(structureProblemsC1(res, good, t, "C1", WIDE)).toEqual([]);
    const recolour = map(good, (s, i) => (i === lastOption ? { ...s, data: dataOf(s).map((d, k) => (k === row && d ? { ...d, itemStyle: { ...styleOf(d), color: t.today1 } } : d)) } : s));
    expect(structureProblemsC1(res, recolour, t, "C1", WIDE)).not.toEqual([]);
    expect(structureProblemsC1(res, map(good, (s, i) => (i === 0 ? { ...s, barWidth: "58%" } : s)), t, "C1", WIDE)).not.toEqual([]);
    expect(
      structureProblemsC1(res, map(good, (s, i) => (i === 0 ? { ...s, data: dataOf(s).map((d) => (d ? { ...d, itemStyle: { ...styleOf(d), borderColor: t.text, borderWidth: 1.5 } } : d)) } : s)), t, "C1", WIDE),
    ).not.toEqual([]);
    const saved = seriesOf(good).find((s) => s.name === "Saved") as Obj;
    expect(structureProblemsC1(res, { ...(good as Obj), series: [...seriesOf(good), saved] } as EChartsCoreOption, t, "C1", WIDE)).not.toEqual([]);
  });

  it("C3: a marker series, the wrong width, an option in the comparator's colour", () => {
    const res = r();
    const good = buildCostPerMtokOption(res, "stage", t, WIDE);
    expect(structureProblemsC3(res, good, t, "C3")).toEqual([]);
    expect(structureProblemsC3(res, map(good, (s, i) => (i === 2 ? { ...s, type: "scatter" } : s)), t, "C3")).not.toEqual([]);
    expect(structureProblemsC3(res, map(good, (s) => ({ ...s, barMaxWidth: 96 })), t, "C3")).not.toEqual([]);
    expect(structureProblemsC3(res, map(good, (s, i) => (i === 2 ? { ...s, itemStyle: { color: t.today1 } } : s)), t, "C3")).not.toEqual([]);
  });

  it("C5: a patterned bar, an outlined bar, bars of 58%", () => {
    const res = r();
    const good = buildTokensBoughtOption(res, "stage", t, WIDE);
    const svg = renderSvg(good, WIDE);
    expect(structureProblemsC5(res, good, svg, "stage", false, "C5", t, WIDE)).toEqual([]);
    const withData = (change: (d: Obj, i: number) => Obj) => map(good, (s) => ({ ...s, data: dataOf(s).map((d, i) => (d ? change(d, i) : d)) }));
    expect(structureProblemsC5(res, withData((d, i) => (i === 1 ? { ...d, itemStyle: { ...styleOf(d), decal: { symbol: "rect" } } } : d)), svg, "stage", false, "C5", t, WIDE)).not.toEqual([]);
    expect(structureProblemsC5(res, withData((d, i) => (i === 0 ? { ...d, itemStyle: { ...styleOf(d), borderWidth: 2 } } : d)), svg, "stage", false, "C5", t, WIDE)).not.toEqual([]);
    expect(structureProblemsC5(res, map(good, (s) => ({ ...s, barWidth: "58%" })), svg, "stage", false, "C5", t, WIDE)).not.toEqual([]);
  });
});
