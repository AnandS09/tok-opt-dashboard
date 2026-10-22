import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Scenario, Tables } from "../contract";
import { clone, loadFixtureScenario, loadFixtureTables, restoreFetch } from "../test/fixtures";
import { compute } from "../compute";
import {
  COMPANIES,
  companyOf,
  hasBasis,
  lowerFirst,
  selectedWorkloads,
  setBudget,
  setCompany,
  setCustomers,
  setSpeed,
  setUsers,
  setWorkloads,
  stepsFor,
  withCurrent,
  withCustomers,
} from "./intake";

afterEach(restoreFetch);

let s1: Scenario;
let tables: Tables;
beforeAll(async () => {
  tables = await loadFixtureTables();
  s1 = await loadFixtureScenario("s1");
  restoreFetch();
});

describe("the intake setters clamp to the spec 5.2 ranges", () => {
  it("setUsers: -5, 0 and 0.4 give 1; 73.6 rounds to 74; 1e9 gives 10,000", () => {
    const users = (n: number) => setUsers(s1, n).baseline.users;
    expect([-5, 0, 0.4, 73.6, 1e9].map(users)).toEqual([1, 1, 1, 74, 10_000]);
  });

  it("setCustomers: -5, 0 and 0.4 give 1; 73.6 rounds to 74; 1e9 gives 10,000,000", () => {
    const customers = (n: number) => setCustomers(s1, n).baseline.customers;
    expect([-5, 0, 0.4, 73.6, 1e9].map(customers)).toEqual([1, 1, 1, 74, 10_000_000]);
  });

  it("setBudget: -1, 0 and 999 give $1,000; 1e9 gives $100,000,000; in-range values pass through", () => {
    const budget = (n: number) => setBudget(s1, n).baseline.budget_usd_per_quarter;
    expect([-1, 0, 999, 1e9].map(budget)).toEqual([1_000, 1_000, 1_000, 100_000_000]);
    expect(budget(1_000)).toBe(1_000);
    expect(budget(100_000_000)).toBe(100_000_000);
    expect(budget(25_000)).toBe(25_000);
  });

  it("a setter changes only its own field and does not modify the scenario it was given", () => {
    const before = clone(s1);
    const next = setUsers(s1, 73);
    expect(s1).toEqual(before);
    expect(next.baseline.budget_usd_per_quarter).toBe(s1.baseline.budget_usd_per_quarter);
    expect(next.workload_mix).toEqual(s1.workload_mix);
  });
});

describe("stepsFor (spec 4.3: each step appears only under its condition)", () => {
  it("shows team size only for a type that offers employee work, and customers only for customer work", () => {
    const steps = (id: Parameters<typeof companyOf>[0]) => stepsFor(companyOf(id), tables);
    expect(steps("chip")).toEqual(["company", "work", "users", "budget", "speed"]);
    expect(steps("enterprise")).toEqual(["company", "work", "users", "budget", "speed"]);
    expect(steps("ai_first")).toEqual(["company", "work", "customers", "budget", "speed"]);
    expect(steps("software")).toEqual(["company", "work", "users", "customers", "budget", "speed"]);
    expect(steps("telecom")).toEqual(["company", "work", "users", "customers", "budget", "speed"]);
  });

  it("always starts with company then work, and ends with budget then speed, for every type", () => {
    for (const company of COMPANIES) {
      const steps = stepsFor(company, tables);
      expect(steps.slice(0, 2)).toEqual(["company", "work"]);
      expect(steps.slice(-2)).toEqual(["budget", "speed"]);
    }
  });
});

describe("setWorkloads", () => {
  it("splits the share evenly within each basis, so the employee shares sum to 1 and the customer shares sum to 1", () => {
    const s = setWorkloads(s1, ["software_design", "support", "customer_service", "product_ai", "ops_agents"], tables);
    expect(s.workload_mix).toEqual({
      software_design: 1 / 3,
      support: 1 / 3,
      ops_agents: 1 / 3,
      customer_service: 0.5,
      product_ai: 0.5,
    });
  });

  it("with one workload keeps that workload's own default model mix", () => {
    const s = setWorkloads(s1, ["software_design"], tables);
    expect(s.workload_mix).toEqual({ software_design: 1 });
    expect(s.model_mix).toEqual({ frontier: 0.6, mid: 0.3, small: 0.1, open_weight_share: 0.2 });
  });

  it("blends the model mixes of the picked workloads by their shares, and the tier shares still sum to 1", () => {
    const s = setWorkloads(s1, ["software_design", "hardware_design"], tables);
    expect(s.model_mix.frontier).toBeCloseTo(0.65, 12);
    expect(s.model_mix.mid).toBeCloseTo(0.3, 12);
    expect(s.model_mix.small).toBeCloseTo(0.05, 12);
    expect(s.model_mix.open_weight_share).toBeCloseTo(0.15, 12);
    const mixed = setWorkloads(s1, ["software_design", "support", "customer_service", "product_ai", "ops_agents"], tables);
    expect(mixed.model_mix.frontier + mixed.model_mix.mid + mixed.model_mix.small).toBeCloseTo(1, 9);
  });

  it("weights each picked workload by its share of the whole mix when blending model mixes", () => {
    // Employee work: software_design and support at 0.5 each; customer work: customer_service at 1. Total share 2.
    // Weights 0.25, 0.25, 0.5. Frontier shares are 0.6, 0.2 and 0.2.
    const s = setWorkloads(s1, ["software_design", "support", "customer_service"], tables);
    expect(s.workload_mix).toEqual({ software_design: 0.5, support: 0.5, customer_service: 1 });
    expect(s.model_mix.frontier).toBeCloseTo(0.25 * 0.6 + 0.25 * 0.2 + 0.5 * 0.2, 12);
    expect(s.model_mix.open_weight_share).toBeCloseTo(0.25 * 0.2 + 0.25 * 0.4 + 0.5 * 0.5, 12);
  });

  it("an empty pick, or ids that are not workloads, leave the scenario as it is", () => {
    expect(setWorkloads(s1, [], tables)).toBe(s1);
    expect(setWorkloads(s1, ["no_such_workload"], tables)).toBe(s1);
  });

  it("selectedWorkloads lists the workloads with a positive share in workloads.csv order, and hasBasis reads them", () => {
    const s = { ...s1, workload_mix: { support: 0.5, software_design: 0.5, product_ai: 0, research: 0 } };
    expect(selectedWorkloads(s, tables)).toEqual(["software_design", "support"]);
    expect(hasBasis(s, tables, "employee")).toBe(true);
    expect(hasBasis(s, tables, "customer")).toBe(false);
  });
});

describe("setCompany", () => {
  it.each(COMPANIES.map((c) => [c.id, c] as const))("%s: its stage, all its workloads, and customers only when it has customer work", (_id, company) => {
    const s = setCompany(s1, company, tables);
    expect(s.stage_today).toBe(company.stage);
    expect(Object.keys(s.workload_mix).sort()).toEqual([...company.workloads].sort());
    const customerWork = hasBasis(s, tables, "customer");
    if (customerWork) expect(s.baseline.customers).toBe(company.defaultCustomers);
    else expect("customers" in s.baseline).toBe(false);
    // Team size, budget and speed are kept.
    expect(s.baseline.users).toBe(s1.baseline.users);
    expect(s.baseline.budget_usd_per_quarter).toBe(s1.baseline.budget_usd_per_quarter);
    expect(s.latency_class).toBe(s1.latency_class);
  });

  it.each(COMPANIES.map((c) => [c.id, c] as const))("%s: the scenario it starts from computes, with a saving that is never negative", (_id, company) => {
    const r = compute(setCompany(s1, company, tables), tables);
    expect(r.allocation.total_usd).toBeGreaterThan(0);
    expect(r.headline.cost_savings_pct).toBeGreaterThanOrEqual(0);
    expect(r.today_alternatives.filter((a) => a.is_grey).length).toBeGreaterThan(0);
  });

  it("switching from a type with customers to one without drops the customer count", () => {
    const withCustomers = setCompany(s1, companyOf("software"), tables);
    expect(withCustomers.baseline.customers).toBe(50_000);
    const without = setCompany(withCustomers, companyOf("chip"), tables);
    expect("customers" in without.baseline).toBe(false);
  });

  it("does not modify the scenario it was given", () => {
    const before = clone(s1);
    setCompany(s1, companyOf("telecom"), tables);
    expect(s1).toEqual(before);
  });
});

describe("small helpers", () => {
  it("withCurrent adds the current value in order when it is not a preset, and leaves the presets alone when it is", () => {
    expect(withCurrent([25, 50, 100], 30)).toEqual([25, 30, 50, 100]);
    expect(withCurrent([25, 50, 100], 500)).toEqual([25, 50, 100, 500]);
    expect(withCurrent([25, 50, 100], 1)).toEqual([1, 25, 50, 100]);
    expect(withCurrent([25, 50, 100], 50)).toEqual([25, 50, 100]);
  });

  it("lowerFirst lowers a leading capital but keeps an acronym", () => {
    expect(lowerFirst("Software engineering")).toBe("software engineering");
    expect(lowerFirst("AI features in the product")).toBe("AI features in the product");
    expect(lowerFirst("")).toBe("");
  });

  it("setSpeed changes only the latency class", () => {
    const s = setSpeed(s1, "batch");
    expect(s.latency_class).toBe("batch");
    expect({ ...s, latency_class: s1.latency_class }).toEqual(s1);
  });
});

describe("withCustomers", () => {
  it("gives customer work added after the questions a customer count, and leaves a set count alone", async () => {
    const s2 = await loadFixtureScenario("s2");
    restoreFetch();
    expect(s2.baseline.customers).toBeUndefined();
    const customerWork = tables.workloads.find((w) => w.basis === "customer")!.workload_id;
    const added = withCustomers(setWorkloads(s2, [customerWork], tables), tables);
    expect(added.baseline.customers).toBe(50_000);
    expect(compute(added, tables).tokens_bought.demand_tokens).toBeGreaterThan(0);
    expect(withCustomers(setCustomers(added, 7), tables).baseline.customers).toBe(7);
    expect(withCustomers(s2, tables)).toBe(s2);
  });
});
