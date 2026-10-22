import { afterEach, describe, expect, it, vi } from "vitest";
import { benefitHeadcount, compute, solveAtBudget } from "../compute";
import { g1Headline, solvedHeadline } from "../compute/goals";
import type { BenefitBox, BenefitContext, GoalId, Results, Scenario, SolveResult, Tables } from "../contract";
import { loadScenario, loadTables } from "../data/load";
import { fmtMultiple, fmtPct, fmtUsdSig } from "../shared/format";
import { MAX_BOXES, formatBenefitValue, headlineNumbers, selectBoxes } from "./benefits";
import { chartRegistry } from "./registry";

const FILES = import.meta.glob("../../public/data/**/*.{csv,json}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

// The sources under test, read as text, so the test needs no filesystem types.
const SOURCES = import.meta.glob("./benefits.ts", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

afterEach(() => {
  vi.unstubAllGlobals();
});

async function load(): Promise<{ tables: Tables; scenarios: Record<string, Scenario> }> {
  vi.stubGlobal("fetch", async (url: string) => {
    const text = FILES[`../../public/data/${url.replace(/^data\//, "")}`];
    return text === undefined
      ? { ok: false, status: 404, text: async () => "" }
      : { ok: true, status: 200, text: async () => text };
  });
  const tables = await loadTables("data");
  const scenarios: Record<string, Scenario> = {};
  for (const id of ["s1", "s2", "hardware_heavy"]) {
    const { scenario } = await loadScenario("data", id);
    // A scaling example is shown at its target size.
    scenarios[id] = scenario.target ? { ...scenario, baseline: scenario.target } : scenario;
  }
  // Two variants that make the rules bite: no open-weight share (the routing box is zero, the arbitrage box is the whole
  // saving) and one person with a very large budget (the budget covers more than ten times the work).
  scenarios.s1_open0 = { ...scenarios.s1, model_mix: { ...scenarios.s1.model_mix, open_weight_share: 0 } };
  scenarios.s1_oversized = { ...scenarios.s1, baseline: { users: 1, budget_usd_per_quarter: 1e8 } };
  return { tables, scenarios };
}

function contextFor(scenario: Scenario, tables: Tables, goal: GoalId, solve: SolveResult | null): BenefitContext {
  return { scenario: { ...scenario, goal }, goal, solve, frontier: null, headcount: benefitHeadcount(scenario, tables) };
}

/** G2 and G3 with the real solver; G1 and G4 need none. */
function solveFor(scenario: Scenario, tables: Tables, goal: GoalId): SolveResult | null {
  if (goal !== "G2" && goal !== "G3") return null;
  return solveAtBudget({ ...scenario, goal }, tables, goal === "G2" ? "intensity" : "users");
}

const GOALS: GoalId[] = ["G1", "G2", "G3", "G4"];

interface Case {
  label: string;
  results: Results;
  context: BenefitContext;
}

/** Every scenario, tab and comparator the page can show, with the context each one hands the boxes. */
function allCases(): Promise<Case[]> {
  cached ??= buildCases();
  return cached;
}
let cached: Promise<Case[]> | undefined;

// The solves for G2 and G3 over every comparator take a few seconds, so they are built once.
vi.setConfig({ testTimeout: 120000 });

async function buildCases(): Promise<Case[]> {
  const { tables, scenarios } = await load();
  const cases: Case[] = [];
  for (const [id, base] of Object.entries(scenarios)) {
    const first = compute(base, tables);
    for (const alt of first.today_alternatives) {
      for (const goal of GOALS) {
        const scenario: Scenario = {
          ...base,
          goal,
          comparator: alt.pattern_id,
          ...(goal === "G4" ? { tradeoff: { quality_step: 2, speed_step: 1 } } : {}),
        };
        const results = compute(scenario, tables);
        cases.push({
          label: `${id} ${goal} vs ${alt.pattern_id}`,
          results,
          context: contextFor(scenario, tables, goal, solveFor(scenario, tables, goal)),
        });
      }
    }
  }
  return cases;
}

const boxesOf = (c: Case): { chart: string; boxes: BenefitBox[] }[] =>
  chartRegistry.map((def) => ({ chart: def.id, boxes: def.benefits(c.results, c.context) }));

describe("benefit boxes", () => {
  it("every box names the comparator of its Results (acceptance 1)", async () => {
    for (const c of await allCases()) {
      const label = c.results.today_alternatives.find((a) => a.pattern_id === c.results.comparator)?.label;
      expect(label, c.label).toBeTruthy();
      for (const { chart, boxes } of boxesOf(c)) {
        for (const box of boxes) expect(box.comparator, `${c.label} ${chart}`).toBe(`vs ${label}`);
      }
    }
  });

  it("no box reads the same as a number of the tab's headline (acceptance 2)", async () => {
    // The headline is rebuilt here from goals.ts, not from headlineNumbers.
    for (const c of await allCases()) {
      const printed: string[] = [];
      if (c.context.goal === "G2" || c.context.goal === "G3") {
        printed.push(`multiple ${fmtMultiple(solvedHeadline(c.context.scenario, c.context.solve as SolveResult).multiple)}`);
      } else {
        const g1 = g1Headline(c.results);
        printed.push(`usd ${fmtUsdSig(g1.saved_usd)}`, `percent ${fmtPct(g1.saved_pct)}`, `multiple ${fmtMultiple(g1.linear_multiple)}`);
      }
      for (const { chart, boxes } of boxesOf(c)) {
        for (const box of boxes) expect(printed, `${c.label} ${chart} ${box.label}`).not.toContain(`${box.unit} ${formatBenefitValue(box)}`);
      }
    }
  });

  it("drops a box that equals the headline of a solved tab (acceptance 2, G2 and G3)", async () => {
    const { tables, scenarios } = await load();
    for (const goal of ["G2", "G3"] as const) {
      const scenario = { ...scenarios.s1, goal };
      const results = compute(scenario, tables);
      const solve = solveFor(scenario, tables, goal) as SolveResult;
      const context = contextFor(scenario, tables, goal, solve);
      const headline = headlineNumbers(results, context);
      expect(headline[0]).toEqual({ unit: "multiple", value: solve.multiple });
      expect(headline).toContainEqual({ unit: "multiple", value: solve.infravana_scale });
      expect(headline).toContainEqual({ unit: "percent", value: solve.infravana_scale * 100 });
      const repeat: BenefitBox = { value: solve.multiple, unit: "multiple", label: "times the work", comparator: "vs x" };
      const other: BenefitBox = { value: solve.multiple + 1, unit: "multiple", label: "other", comparator: "vs x" };
      expect(selectBoxes([repeat, other], headline)).toEqual([other]);
    }
  });

  it("on a solved tab, no box restates a scale the hero states, as a multiple or a percentage (acceptance 2)", async () => {
    const { tables, scenarios } = await load();
    for (const id of ["s1", "s2"] as const) {
      for (const goal of ["G2", "G3"] as const) {
        const scenario = { ...scenarios[id], goal };
        const results = compute(scenario, tables);
        const solve = solveFor(scenario, tables, goal) as SolveResult;
        const context = contextFor(scenario, tables, goal, solve);
        // What the hero states, written out here from the solve (not read back from headlineNumbers).
        const stated = [solve.multiple, solve.today_scale, solve.infravana_scale].flatMap((v) => [
          { unit: "multiple" as const, value: v },
          { unit: "percent" as const, value: v * 100 },
        ]);
        for (const def of chartRegistry) {
          for (const box of def.benefits(results, context)) {
            expect(stated.some((h) => h.unit === box.unit && formatBenefitValue(h) === formatBenefitValue(box)), `${id} ${goal} ${def.id}: ${box.label}`).toBe(false);
          }
        }
      }
    }
  });

  it("derives every number from Results: changing the savings changes the boxes (acceptance 3)", async () => {
    const { tables, scenarios } = await load();
    const scenario = scenarios.s1;
    const results = compute(scenario, tables);
    const context = contextFor(scenario, tables, "G1", null);
    const doubled: Results = {
      ...results,
      allocation: {
        ...results.allocation,
        infravana: results.allocation.infravana.map((s) => (s.kind === "savings" ? { ...s, usd: s.usd * 2 } : s)),
      },
    };
    const c1 = chartRegistry.find((d) => d.id === "C1")!;
    const before = c1.benefits(results, context);
    const after = c1.benefits(doubled, context);
    expect(after.length).toBeGreaterThan(0);
    for (const [i, box] of after.entries()) expect(box.value).toBeCloseTo(before[i].value * 2, 6);
    // C5 and C3 follow their own parts of Results.
    const c5 = chartRegistry.find((d) => d.id === "C5")!;
    expect(c5.benefits(results, context)[0].value).toBe(results.tokens_bought.infravana_tokens);
    const c3 = chartRegistry.find((d) => d.id === "C3")!;
    const frontierRow = results.cost_per_mtok.by_model_class.find((r) => r.today_usd_per_mtok !== null && r.infravana_usd_per_mtok !== null)!;
    expect(c3.benefits(results, context)[0].value).toBe(frontierRow.infravana_usd_per_mtok);
  });

  it("has no numeric literal other than the unit constants in its source (acceptance 3)", () => {
    const source = SOURCES["./benefits.ts"];
    expect(source).toBeTruthy();
    const allowed = new Set(["0", "1", "3", "100", "1e6"]);
    expect(numericLiterals(source).filter((n) => !allowed.has(n))).toEqual([]);
  });

  it("on S1 with no open-weight share, in G1, C1 shows saving per head and per million tokens only (acceptance 5)", async () => {
    const { tables, scenarios } = await load();
    const scenario: Scenario = { ...scenarios.s1, model_mix: { ...scenarios.s1.model_mix, open_weight_share: 0 } };
    const results = compute(scenario, tables);
    const arbitrage = results.allocation.infravana.filter((s) => s.kind === "savings" && s.savings_source === "arbitrage");
    const routing = results.allocation.infravana.filter((s) => s.kind === "savings" && s.savings_source === "routing");
    expect(routing.reduce((n, s) => n + s.usd, 0)).toBe(0);
    // The arbitrage box would equal the headline saving.
    expect(arbitrage.reduce((n, s) => n + s.usd, 0)).toBeCloseTo(g1Headline(results).saved_usd, 6);
    const boxes = chartRegistry.find((d) => d.id === "C1")!.benefits(results, contextFor(scenario, tables, "G1", null));
    expect(boxes.map((b) => b.label)).toEqual(["saved per team member a quarter", "saved per million tokens"]);
    expect(boxes[0].value).toBeCloseTo(g1Headline(results).saved_usd / scenario.baseline.users, 6);
  });

  it("computes each box from the same Results by its own rule (acceptance 3)", async () => {
    const { tables, scenarios } = await load();
    const byId = (id: string) => chartRegistry.find((d) => d.id === id)!;
    const savings = (r: Results, source?: string) =>
      r.allocation.infravana.reduce((n, s) => (s.kind === "savings" && (!source || s.savings_source === source) ? n + s.usd : n), 0);
    // C1 on S1 with no open-weight share: per head and per million tokens, from the segments and the demand.
    const open0 = scenarios.s1_open0;
    const r0 = compute(open0, tables);
    const c1 = byId("C1").benefits(r0, contextFor(open0, tables, "G1", null));
    expect(c1[0].value).toBeCloseTo(savings(r0) / open0.baseline.users, 6);
    expect(c1[1].unit).toBe("usd_per_mtok");
    expect(c1[1].value).toBeCloseTo(savings(r0) / (r0.tokens_bought.demand_tokens / 1e6), 6);
    // C1 on S2: both sources, then per head.
    const r2 = compute(scenarios.s2, tables);
    const c1s2 = byId("C1").benefits(r2, contextFor(scenarios.s2, tables, "G1", null));
    expect(c1s2[0].value).toBeCloseTo(savings(r2, "arbitrage"), 6);
    expect(c1s2[1].value).toBeCloseTo(savings(r2, "routing"), 6);
    // C3 on S2: the biggest drop by class and the blended prices.
    const rows = r2.cost_per_mtok.by_model_class.filter((r) => r.today_usd_per_mtok !== null && r.infravana_usd_per_mtok !== null);
    const drops = rows.map((r) => (1 - r.infravana_usd_per_mtok! / r.today_usd_per_mtok!) * 100);
    const c3 = byId("C3").benefits(r2, contextFor(scenarios.s2, tables, "G1", null));
    expect(c3[1].value).toBeCloseTo(Math.max(...drops), 6);
    const mtok = r2.tokens_bought.demand_tokens / 1e6;
    expect(c3[2].value).toBeCloseTo((r2.allocation.total_usd - savings(r2)) / mtok, 6);
    expect(c3[2].label).toContain(`$${(r2.allocation.total_usd / mtok).toFixed(2)}`);
    // C5 on S2: tokens, the share of the work, and the extra tokens.
    const c5 = byId("C5").benefits(r2, contextFor(scenarios.s2, tables, "G1", null));
    expect(c5[1].value).toBeCloseTo((r2.tokens_bought.infravana_tokens / r2.tokens_bought.demand_tokens) * 100, 6);
    expect(c5[2].value).toBeCloseTo(r2.tokens_bought.infravana_tokens - r2.tokens_bought.today_tokens, 3);
  });

  it("shows no share of the work above ten times the work, where the page states a message (spec 5.2)", async () => {
    const { tables, scenarios } = await load();
    const scenario = scenarios.s1_oversized;
    const results = compute(scenario, tables);
    expect(results.tokens_bought.today_tokens / results.tokens_bought.demand_tokens).toBeGreaterThan(10);
    const boxes = chartRegistry.find((d) => d.id === "C5")!.benefits(results, contextFor(scenario, tables, "G1", null));
    expect(boxes.length).toBeGreaterThan(0);
    expect(boxes.filter((b) => b.unit === "percent")).toEqual([]);
  });

  it("divides by customers when the mix has no team work", async () => {
    const { tables, scenarios } = await load();
    const scenario: Scenario = {
      ...scenarios.s1,
      workload_mix: { customer_service: 1 },
      baseline: { users: 50, budget_usd_per_quarter: 100000, customers: 4000 },
    };
    const results = compute(scenario, tables);
    const context = contextFor(scenario, tables, "G1", null);
    expect(context.headcount).toBe(4000);
    const labels = chartRegistry.find((d) => d.id === "C1")!.benefits(results, context).map((b) => b.label);
    expect(labels).toContain("saved per customer a quarter");
    expect(labels).not.toContain("saved per team member a quarter");
  });

  it("never shows a zero or a value that prints as zero (acceptance 6)", async () => {
    for (const c of await allCases()) {
      for (const { chart, boxes } of boxesOf(c)) {
        for (const box of boxes) {
          expect(box.value, `${c.label} ${chart}`).toBeGreaterThan(0);
          expect(formatBenefitValue(box), `${c.label} ${chart}`).toMatch(/[1-9]/);
        }
      }
    }
    const headline = [{ unit: "multiple" as const, value: 99 }];
    const zero: BenefitBox = { value: 0, unit: "usd", label: "zero", comparator: "vs x" };
    const prints0: BenefitBox = { value: 0.0004, unit: "usd_per_mtok", label: "prints zero", comparator: "vs x" };
    const negative: BenefitBox = { value: -3, unit: "usd", label: "negative", comparator: "vs x" };
    const real: BenefitBox = { value: 5, unit: "usd", label: "real", comparator: "vs x" };
    expect(selectBoxes([zero, prints0, negative, null, real], headline)).toEqual([real]);
  });

  it("shows at least one and at most three boxes per chart (acceptance 7)", async () => {
    expect(MAX_BOXES).toBe(3);
    for (const c of await allCases()) {
      for (const { chart, boxes } of boxesOf(c)) {
        // A chart is empty only when no candidate is non-zero: C1 when the comparator leaves nothing to save.
        if (boxes.length === 0) {
          expect(chart, c.label).toBe("C1");
          expect(c.results.allocation.infravana.some((s) => s.kind === "savings" && s.usd > 0), c.label).toBe(false);
        }
        expect(boxes.length, `${c.label} ${chart}`).toBeLessThanOrEqual(3);
      }
    }
    const many = Array.from({ length: 6 }, (_, i): BenefitBox => ({ value: i + 1, unit: "usd", label: `b${i}`, comparator: "vs x" }));
    expect(selectBoxes(many, [])).toHaveLength(3);
  });

  it("falls back to the linear figures while a solved tab has no solve yet", async () => {
    const { tables, scenarios } = await load();
    const scenario = { ...scenarios.s1, goal: "G2" as const };
    const results = compute(scenario, tables);
    const boxes = chartRegistry.find((d) => d.id === "C5")!.benefits(results, contextFor(scenario, tables, "G2", null));
    expect(boxes[0].value).toBe(results.tokens_bought.infravana_tokens);
  });

  it("C5 follows the solved volumes on G2 and G3", async () => {
    const { tables, scenarios } = await load();
    for (const goal of ["G2", "G3"] as const) {
      const scenario = { ...scenarios.s2, goal };
      const results = compute(scenario, tables);
      const solve = solveFor(scenario, tables, goal) as SolveResult;
      const boxes = chartRegistry.find((d) => d.id === "C5")!.benefits(results, contextFor(scenario, tables, goal, solve));
      expect(boxes[0].value).toBe(solve.infravana_tokens);
      expect(boxes.find((b) => b.label === "more tokens a quarter")?.value).toBeCloseTo(solve.infravana_tokens - solve.today_tokens, 3);
    }
  });
});

/** Numeric literals of a TypeScript source, outside comments and strings. */
function numericLiterals(source: string): string[] {
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/`(?:\\.|[^`\\])*`/g, "``")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/\/(?:\\.|[^/\\\n])+\/[a-z]*/g, "//");
  return [...code.matchAll(/(?<![\w.$])(\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?)(?![\w.])/gi)].map((m) => m[1]);
}
