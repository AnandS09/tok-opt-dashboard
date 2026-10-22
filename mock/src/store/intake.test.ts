import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Scenario, Tables } from "../contract";
import { clone, loadFixtureScenario, loadFixtureTables, restoreFetch } from "../test/fixtures";
import { setBudget, setCustomers, setUsers, stepsFor, companyOf, COMPANIES } from "./intake";

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
