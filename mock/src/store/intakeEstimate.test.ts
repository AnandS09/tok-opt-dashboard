import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { compute } from "../compute";
import type { Scenario, Tables } from "../contract";
import { clone, loadFixtureScenario, loadFixtureTables, restoreFetch } from "../test/fixtures";
import {
  beginIntake,
  BUDGET_MARKS,
  COMPANIES,
  companyOf,
  estimateBasisLine,
  estimateFigures,
  estimateScenario,
  INTAKE_DEFAULTS,
  kindsOfWork,
  maxSteps,
  setBudget,
  setCustomers,
  setSpeed,
  setUsers,
  setWorkloads,
  stepProgress,
  stepsFor,
  type Company,
  type CompanyType,
} from "./intake";

afterEach(restoreFetch);

let tables: Tables;
let starts: Record<string, Scenario>;
beforeAll(async () => {
  tables = await loadFixtureTables();
  const s1 = await loadFixtureScenario("s1");
  const s2 = await loadFixtureScenario("s2");
  const hw = await loadFixtureScenario("hardware_heavy");
  restoreFetch();
  // A start that differs from the others in every field the intake does not ask for.
  const odd: Scenario = {
    ...clone(s1),
    baseline: { users: 9_999, budget_usd_per_quarter: 7_000_000, customers: 3 },
    named_models: ["opus", "fable"],
    tiers_allowed: [tables.hardware[0].hw_id],
    quality_floor: 91,
    unit: "workflows",
    comparator: "seats",
    goal: "G4",
    tradeoff: { quality_step: 2, speed_step: 1 },
    latency_class: "batch",
    stage_today: "seats",
  };
  starts = { s1, s2, hardware_heavy: hw, odd };
});

/** The answers a visitor gives a type: what the page does on each click (Intake.tsx), applied to a starting scenario. */
function answerAs(start: Scenario, company: Company, answers: { users?: number; customers?: number; budget: number; speed?: "interactive" | "standard" | "batch" }): Scenario {
  let s = beginIntake(start, company, tables);
  if (answers.users !== undefined) s = setUsers(s, answers.users);
  if (answers.customers !== undefined) s = setCustomers(s, answers.customers);
  s = setBudget(s, answers.budget);
  if (answers.speed) s = setSpeed(s, answers.speed);
  return s;
}

describe("R-3: the estimate is worked out from the visitor's answers and the defaults only (spec 15.3)", () => {
  it.each(COMPANIES.map((c) => [c.id, c] as const))("%s: the same answers give the same figures from every starting scenario", (_id, company) => {
    const answers = { users: 120, customers: 200_000, budget: 150_000 };
    const figures = Object.fromEntries(Object.entries(starts).map(([name, s]) => [name, estimateFigures(answerAs(s, company, answers), tables)]));
    for (const name of Object.keys(starts)) expect(figures[name], `from ${name}`).toEqual(figures.s1);
    expect(figures.s1.today).toBeGreaterThan(0);
  });

  it("the same holds at the other end of the answers (1 person, 1 customer, $1K, batch)", () => {
    const answers = { users: 1, customers: 1, budget: 1_000, speed: "batch" as const };
    for (const company of COMPANIES) {
      const first = estimateFigures(answerAs(starts.s1, company, answers), tables);
      for (const [name, s] of Object.entries(starts)) expect(estimateFigures(answerAs(s, company, answers), tables), `${company.id} from ${name}`).toEqual(first);
    }
  });

  it("the estimate of the raw starting scenario is not independent of it (what the old panel showed), so the test above can fail", () => {
    // The old panel computed the starting scenario itself after the type was picked. Different starts give different figures.
    const company = companyOf("software");
    const raw = (s: Scenario) => compute(setWorkloads({ ...s, baseline: { ...s.baseline, customers: 200_000 } }, company.workloads, tables), tables).allocation.total_usd;
    expect(raw(starts.s1)).not.toBe(raw(starts.odd));
  });

  it("Today equals, to the cent, compute() on a scenario written out from the answers and the section 5 defaults alone", () => {
    const company = companyOf("software");
    const s = answerAs(starts.hardware_heavy, company, { users: 120, customers: 200_000, budget: 150_000 });
    const byHand: Scenario = {
      baseline: { users: 120, budget_usd_per_quarter: 150_000, customers: 200_000 },
      workload_mix: { software_design: 1 / 3, support: 1 / 3, ops_agents: 1 / 3, customer_service: 0.5, product_ai: 0.5 },
      model_mix: setWorkloads(starts.s1, company.workloads, tables).model_mix,
      named_models: [],
      stage_today: "api",
      tiers_allowed: "all",
      latency_class: "interactive",
      unit: "people",
    };
    const results = compute(byHand, tables);
    const figures = estimateFigures(s, tables);
    expect(Math.round(figures.today * 100)).toBe(Math.round(results.allocation.total_usd * 100));
    expect(figures.today).toBe(results.allocation.total_usd);
    const saved = (results.allocation.total_usd * results.headline.cost_savings_pct) / 100;
    expect(figures.withInfravana).toBe(results.allocation.total_usd - saved);
    expect(figures.savedPct).toBe(results.headline.cost_savings_pct);
  });

  it("a budget moves none of the three figures, from $1K to $100M, on every type", () => {
    for (const company of COMPANIES) {
      const base = estimateFigures(answerAs(starts.s1, company, { users: 120, customers: 200_000, budget: 1_000 }), tables);
      for (const budget of [...BUDGET_MARKS, 150_000, 100_000_000]) {
        expect(estimateFigures(answerAs(starts.s1, company, { users: 120, customers: 200_000, budget }), tables), `${company.id} at ${budget}`).toEqual(base);
      }
    }
  });

  it("each answer changes it: team size, customers and work (once there is a figure to change)", () => {
    const company = companyOf("software");
    const at = (users: number, customers: number) => estimateFigures(answerAs(starts.s1, company, { users, customers, budget: 100_000 }), tables).today;
    expect(at(120, 200_000)).not.toBe(at(121, 200_000));
    expect(at(120, 200_000)).not.toBe(at(120, 200_001));
    const base = answerAs(starts.s1, company, { users: 120, customers: 200_000, budget: 100_000 });
    const fewer = setWorkloads(base, ["software_design", "customer_service"], tables);
    expect(estimateFigures(fewer, tables).today).not.toBe(estimateFigures(base, tables).today);
  });

  it("estimateScenario names every field, so a field of the starting scenario cannot reach it", () => {
    const company = companyOf("software");
    const s = answerAs(starts.odd, company, { users: 120, customers: 200_000, budget: 150_000 });
    const e = estimateScenario(s);
    expect(Object.keys(e).sort()).toEqual(["baseline", "latency_class", "model_mix", "named_models", "stage_today", "tiers_allowed", "unit", "workload_mix"]);
    expect(e).toMatchObject({ named_models: [], tiers_allowed: "all", unit: "people", latency_class: "interactive" });
    expect(e.quality_floor).toBeUndefined();
    expect(e.comparator).toBeUndefined();
    expect(e.goal).toBeUndefined();
    expect(e.tradeoff).toBeUndefined();
    expect(e.target).toBeUndefined();
  });

  it("a type without customer work has no customer count in the estimate's scenario", () => {
    const s = answerAs(starts.s2, companyOf("chip"), { users: 40, budget: 100_000 });
    expect("customers" in estimateScenario(s).baseline).toBe(false);
  });
});

describe("beginIntake: a picked type starts from the intake's own defaults (spec 15.3)", () => {
  it.each(COMPANIES.map((c) => [c.id, c] as const))("%s: team size, budget and speed are the intake's, whatever the page started from", (_id, company) => {
    for (const start of Object.values(starts)) {
      const s = beginIntake(start, company, tables);
      expect(s.baseline.users).toBe(INTAKE_DEFAULTS.users);
      expect(s.baseline.budget_usd_per_quarter).toBe(INTAKE_DEFAULTS.budget_usd_per_quarter);
      expect(s.latency_class).toBe(INTAKE_DEFAULTS.latency_class);
      expect(s.stage_today).toBe(company.stage);
      expect(Object.keys(s.workload_mix).sort()).toEqual([...company.workloads].sort());
    }
  });
});

describe("R-2: the step label and the rule (spec 15.2)", () => {
  const types = COMPANIES.map((c) => [c.id, c] as const);

  it("before a type is chosen the label is 'Step 1', with no total, and the rule is one step of the longest path", () => {
    const p = stepProgress(null, "company", tables);
    expect(p.label).toBe("Step 1");
    expect(p.label).not.toMatch(/of/);
    expect(p.value / p.max).toBeCloseTo(1 / 6, 12);
  });

  it("N_max is computed from the step rules, and is 6 on the current fixtures", () => {
    expect(maxSteps(tables)).toBe(Math.max(...COMPANIES.map((c) => stepsFor(c, tables).length)));
    expect(maxSteps(tables)).toBe(6);
  });

  it.each(types)("%s: from step 2 the label is 'Step n of N' and the rule is n over N, for every step", (_id, company) => {
    const steps = stepsFor(company, tables);
    steps.forEach((step, i) => {
      const p = stepProgress(company, step, tables);
      expect(p.label).toBe(`Step ${i + 1} of ${steps.length}`);
      expect(p.value / p.max).toBeCloseTo((i + 1) / steps.length, 12);
    });
  });

  it("a software company has 6 steps and an AI-first startup 5 (no team-size step)", () => {
    const n = (id: CompanyType) => stepsFor(companyOf(id), tables).length;
    expect([n("software"), n("ai_first")]).toEqual([6, 5]);
    expect(stepProgress(companyOf("ai_first"), "work", tables).label).toBe("Step 2 of 5");
    expect(stepProgress(companyOf("software"), "work", tables).label).toBe("Step 2 of 6");
  });
});

describe("the line under the estimate figures (spec 15.3)", () => {
  it("names the head counts and the kinds of work, in the board's form", () => {
    const company = companyOf("software");
    const s = answerAs(starts.s1, company, { users: 120, customers: 200_000, budget: 150_000 });
    expect(estimateBasisLine(s, company, tables)).toBe(
      "Worked out from your answers: 120 people, 200,000 customers, 5 kinds of work, at typical use per person and per customer.",
    );
  });

  it("leaves out a part the type does not ask, and uses the type's word for its customers", () => {
    const ai = companyOf("ai_first");
    expect(estimateBasisLine(answerAs(starts.s1, ai, { customers: 200_000, budget: 1e5 }), ai, tables)).toBe(
      "Worked out from your answers: 200,000 customers, 2 kinds of work, at typical use per customer.",
    );
    const chip = companyOf("chip");
    expect(estimateBasisLine(answerAs(starts.s1, chip, { users: 1, budget: 1e5 }), chip, tables)).toBe(
      "Worked out from your answers: 1 person, 2 kinds of work, at typical use per person.",
    );
    const telecom = companyOf("telecom");
    expect(estimateBasisLine(answerAs(starts.s1, telecom, { users: 500, customers: 200_000, budget: 1e5 }), telecom, tables)).toContain("200,000 subscribers");
  });

  it("kindsOfWork is singular for one", () => {
    expect([kindsOfWork(1), kindsOfWork(2), kindsOfWork(5)]).toEqual(["1 kind", "2 kinds", "5 kinds"]);
  });
});
