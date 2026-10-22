import { beforeAll, describe, expect, it } from "vitest";
import type { Scenario, Tables } from "../contract";
import { compute } from "../compute";
import { loadFixtureScenario, loadFixtureTables, restoreFetch } from "../test/fixtures";
import { computeForView, withView } from "./stage";

let tables: Tables;
let s1: Scenario;

beforeAll(async () => {
  tables = await loadFixtureTables();
  s1 = await loadFixtureScenario("s1");
  restoreFetch();
});

const view = (comparator: string | null) => ({ goal: "G1" as const, comparator, qualityStep: 0, speedStep: 0 });

describe("the page's compute call with a stored comparator", () => {
  it("lets compute() throw for best single option at a floor no proprietary offer meets (the crash path)", () => {
    const scenario = withView({ ...s1, quality_floor: 93 }, view("best_single"), tables);
    expect(scenario.comparator).toBe("best_single");
    expect(() => compute(scenario, tables)).toThrow(/best_single/);
  });

  it("falls back to the default comparator, with the option absent and no error, at floor 93", () => {
    const scenario = withView({ ...s1, quality_floor: 93 }, view("best_single"), tables);
    const results = computeForView(scenario, tables);
    const plain = compute({ ...s1, quality_floor: 93 }, tables);
    expect(results.comparator).toBe(plain.comparator);
    expect(results.today_alternatives.some((a) => a.pattern_id === "best_single")).toBe(false);
    expect(results).toEqual(plain);
  });

  it("keeps the choice when it is still offered, and applies it again once the floor is lowered", () => {
    const low = computeForView(withView({ ...s1, quality_floor: 80 }, view("best_single"), tables), tables);
    expect(low.comparator).toBe("best_single");
    const high = computeForView(withView({ ...s1, quality_floor: 93 }, view("best_single"), tables), tables);
    expect(high.comparator).not.toBe("best_single");
    const back = computeForView(withView({ ...s1, quality_floor: 80 }, view("best_single"), tables), tables);
    expect(back.comparator).toBe("best_single");
  });

  it("falls back for any stored comparator that stops being an applicable option", () => {
    // vendor2_direct loses its baseline rows, so it is no Today option for the mix.
    const patched: Tables = {
      ...tables,
      baseline_providers: tables.baseline_providers.filter((r) => r.pattern_id !== "vendor2_direct"),
    };
    const scenario = withView(s1, view("vendor2_direct"), patched);
    expect(scenario.comparator).toBe("vendor2_direct");
    expect(() => compute(scenario, patched)).toThrow(/vendor2_direct/);
    const results = computeForView(scenario, patched);
    expect(results.comparator).not.toBe("vendor2_direct");
    expect(results.today_alternatives.some((a) => a.pattern_id === "vendor2_direct")).toBe(false);
  });

  it("does not change a default result", () => {
    expect(computeForView(s1, tables)).toEqual(compute(s1, tables));
    expect(computeForView(withView(s1, view("vendor2_direct"), tables), tables).comparator).toBe("vendor2_direct");
  });

  it("still throws an error that has nothing to do with the comparator", () => {
    const broken = { ...s1, workload_mix: { not_a_workload: 1 } };
    expect(() => computeForView({ ...broken, comparator: "api" }, tables)).toThrow();
    expect(() => computeForView(broken, tables)).toThrow();
  });
});
