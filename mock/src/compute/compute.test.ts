import { beforeAll, describe, expect, it } from "vitest";
import type { Results, Scenario, Tables } from "../contract";
import {
  clone,
  infravanaSpend,
  loadFixtureScenario,
  loadFixtureTables,
  restoreFetch,
  withBaseline,
} from "../test/fixtures";
import { benefitHeadcount, compute, computeCore, scenarioAtTarget } from "./index";

let tables: Tables;
let s1: Scenario;
let s2: Scenario;
let hardwareHeavy: Scenario;

beforeAll(async () => {
  tables = await loadFixtureTables();
  s1 = await loadFixtureScenario("s1");
  s2 = await loadFixtureScenario("s2");
  hardwareHeavy = await loadFixtureScenario("hardware_heavy");
  restoreFetch();
});

/** Freezes a value and everything inside it, so any write to it throws in strict mode. */
function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const inner of Object.values(value)) deepFreeze(inner);
  }
  return value;
}

const allScenarios = (): [string, Scenario][] => [
  ["S1", s1],
  ["S2", s2],
  ["hardware_heavy", hardwareHeavy],
  ["S1 at stage seats", { ...s1, stage_today: "seats" }],
  ["S1 against vendor 2 direct", { ...s1, comparator: "vendor2_direct" }],
  ["S2 in G4 with a trade-off", { ...s2, goal: "G4", tradeoff: { quality_step: 2, speed_step: 1 } }],
];

// ---------------------------------------------------------------------------
// Purity and determinism (spec 7.2: "deterministic, has no side effects")
// ---------------------------------------------------------------------------

describe("compute() is pure", () => {
  it.each([0, 1, 2, 3, 4, 5])("scenario %i: runs on deeply frozen inputs without writing to them", (index) => {
    const [, scenario] = allScenarios()[index] as [string, Scenario];
    const frozenTables = deepFreeze(clone(tables));
    const frozenScenario = deepFreeze(clone(scenario));
    expect(() => compute(frozenScenario, frozenTables)).not.toThrow();
    expect(() => computeCore(frozenScenario, frozenTables)).not.toThrow();
  });

  it("leaves both arguments equal to what they were", () => {
    for (const [name, scenario] of allScenarios()) {
      const t = clone(tables);
      const s = clone(scenario);
      compute(s, t);
      expect(s, name).toEqual(scenario);
      expect(t, name).toEqual(tables);
    }
  });

  it("gives the same result when called twice, and when other calls come between", () => {
    for (const [name, scenario] of allScenarios()) {
      const first = compute(scenario, tables);
      compute(s2, tables);
      compute({ ...scenario, stage_today: "platform", comparator: undefined }, tables);
      expect(compute(scenario, tables), name).toEqual(first);
    }
  });

  it("returns fresh objects: editing one result does not change the next", () => {
    const a = compute(s1, tables);
    a.allocation.total_usd = -1;
    a.today_alternatives.length = 0;
    a.allocation.today.length = 0;
    const b = compute(s1, tables);
    expect(b.allocation.total_usd).toBeCloseTo(100_012.5, 2);
    expect(b.today_alternatives.length).toBeGreaterThan(0);
    expect(b.allocation.today.length).toBeGreaterThan(0);
  });

  it("is independent of the key order of the scenario's workload_mix", () => {
    const reordered: Scenario = {
      ...s1,
      workload_mix: Object.fromEntries(Object.entries(s1.workload_mix).reverse()),
    };
    expect(compute(reordered, tables)).toEqual(compute(s1, tables));
  });
});

// ---------------------------------------------------------------------------
// The default numbers (mock/scripts/check-demand.mjs)
// ---------------------------------------------------------------------------

describe("the default scenarios give the pinned numbers", () => {
  it.each([
    ["S1", () => s1, 100_012.5, 70_440.09, 8_023_050_000],
    ["S2", () => s2, 72_487.61, 49_555.12, 6_457_500_000],
    ["hardware_heavy", () => hardwareHeavy, 88_987.5, 70_289.28, 7_147_350_000],
  ] as [string, () => Scenario, number, number, number][])("%s", (_name, build, today, infravana, demandTokens) => {
    const r = compute(build(), tables);
    expect(r.allocation.total_usd).toBeCloseTo(today, 2);
    expect(infravanaSpend(r)).toBeCloseTo(infravana, 2);
    expect(r.tokens_bought.demand_tokens).toBeCloseTo(demandTokens, -1);
    expect(r.allocation.budget_usd).toBe(build().baseline.budget_usd_per_quarter);
    // Both bars are drawn to the same total: spend plus the savings segments is Today's cost.
    const infravanaTotal = r.allocation.infravana.reduce((sum, s) => sum + s.usd, 0);
    expect(infravanaTotal).toBeCloseTo(r.allocation.total_usd, 6);
    // Under the linear rule the multiple is 1 / (1 - saving).
    expect(r.headline.tokens_multiple).toBeCloseTo(r.allocation.total_usd / infravanaSpend(r), 9);
    expect(r.headline.cost_savings_pct).toBeCloseTo((100 * (today - infravana)) / today, 2);
  });

  it("S1 saves 29.57 percent and its default comparator is the pay-as-you-go API", () => {
    const r = compute(s1, tables);
    expect(r.headline.cost_savings_pct).toBeCloseTo(29.57, 2);
    expect(r.comparator).toBe("api");
  });

  it("InfraVana never costs more than Today, so the headline never claims a negative saving", () => {
    for (const [name, scenario] of allScenarios()) {
      const r = compute(scenario, tables);
      expect(infravanaSpend(r), name).toBeLessThanOrEqual(r.allocation.total_usd + 1e-9);
      expect(r.headline.cost_savings_pct, name).toBeGreaterThanOrEqual(0);
    }
  });

  it("every InfraVana figure comes from the rows: halving every proprietary price roughly halves Today's cost and moves InfraVana's", () => {
    const cheap = clone(tables);
    for (const o of cheap.model_offers) {
      if (o.usd_per_mtok_in !== null) o.usd_per_mtok_in /= 2;
      if (o.usd_per_mtok_out !== null) o.usd_per_mtok_out /= 2;
    }
    const base = compute(s1, tables);
    const half = compute(s1, cheap);
    expect(half.allocation.total_usd).toBeLessThan(base.allocation.total_usd * 0.6);
    expect(infravanaSpend(half)).toBeLessThan(infravanaSpend(base) * 0.9);
  });
});

// ---------------------------------------------------------------------------
// infravana_side (spec 6.2 G4 "Two calls")
// ---------------------------------------------------------------------------

describe("infravana_side", () => {
  it("equals the Today side with no trade-off: same floors, same speed", () => {
    for (const [name, scenario] of [
      ["S1", s1],
      ["S2", s2],
      ["hardware_heavy", hardwareHeavy],
    ] as const) {
      const r = compute(scenario, tables);
      expect(r.infravana_side.quality_floor_by_workload, name).toEqual(r.quality_floor_by_workload);
      expect(r.infravana_side.latency_class, name).toBe(r.cost_per_mtok.latency_class);
      expect(r.infravana_side.latency_class, name).toBe(scenario.latency_class);
    }
  });

  it("equals the Today side in G4 with both steps at 0", () => {
    const r = compute({ ...s1, goal: "G4", tradeoff: { quality_step: 0, speed_step: 0 } }, tables);
    expect(r.infravana_side.quality_floor_by_workload).toEqual(r.quality_floor_by_workload);
    expect(r.infravana_side.latency_class).toBe(r.cost_per_mtok.latency_class);
    expect(r).toEqual(compute(s1, tables));
  });

  it("ignores a trade-off while the goal is not G4", () => {
    for (const goal of ["G1", "G2", "G3", undefined] as const) {
      const traded: Scenario = { ...s1, tradeoff: { quality_step: 3, speed_step: 2 } };
      if (goal !== undefined) traded.goal = goal;
      expect(compute(traded, tables), String(goal)).toEqual(compute(s1, tables));
    }
  });

  it("differs with a trade-off in G4: lower floors and a slower class on the InfraVana side only", () => {
    const base = compute(s1, tables);
    const traded = compute({ ...s1, goal: "G4", tradeoff: { quality_step: 3, speed_step: 1 } }, tables);
    for (const id of Object.keys(base.quality_floor_by_workload)) {
      expect(traded.infravana_side.quality_floor_by_workload[id]).toBeLessThan(base.quality_floor_by_workload[id] as number);
    }
    expect(traded.infravana_side.latency_class).toBe("standard");
    // Today's side is exactly the untraded call's.
    expect(traded.quality_floor_by_workload).toEqual(base.quality_floor_by_workload);
    expect(traded.cost_per_mtok.latency_class).toBe("interactive");
    expect(traded.allocation.today).toEqual(base.allocation.today);
    expect(traded.allocation.total_usd).toBe(base.allocation.total_usd);
    expect(traded.floor_unmet_workloads).toEqual(base.floor_unmet_workloads);
    expect(traded.comparator).toBe(base.comparator);
    expect(traded.today_alternatives).toEqual(base.today_alternatives);
  });

  it("a quality step alone changes only the floors; a speed step alone changes only the speed", () => {
    const base = compute(s1, tables);
    const quality = compute({ ...s1, goal: "G4", tradeoff: { quality_step: 2, speed_step: 0 } }, tables);
    expect(quality.infravana_side.latency_class).toBe(base.infravana_side.latency_class);
    expect(quality.infravana_side.quality_floor_by_workload.software_design).toBeLessThan(78);
    const speed = compute({ ...s1, goal: "G4", tradeoff: { quality_step: 0, speed_step: 1 } }, tables);
    expect(speed.infravana_side.quality_floor_by_workload).toEqual(base.infravana_side.quality_floor_by_workload);
    expect(speed.infravana_side.latency_class).toBe("standard");
  });

  it("the speed step stops at batch, and each quality step lowers the floor until the lowest score", () => {
    const stepped = (quality_step: number, speed_step: number) =>
      compute({ ...s1, goal: "G4", tradeoff: { quality_step, speed_step } }, tables);
    expect(stepped(0, 2).infravana_side.latency_class).toBe("batch");
    expect(stepped(0, 9).infravana_side.latency_class).toBe("batch");
    let previous = 78;
    let lowest = 0;
    for (let step = 1; step <= 12; step++) {
      const floor = stepped(step, 0).infravana_side.quality_floor_by_workload.software_design as number;
      expect(floor).toBeLessThanOrEqual(previous);
      if (step <= 3) expect(floor).toBeLessThan(previous);
      previous = floor;
      lowest = floor;
    }
    expect(stepped(30, 0).infravana_side.quality_floor_by_workload.software_design).toBe(lowest);
  });

  it("each step down never raises InfraVana's spend, and Today never changes", () => {
    const base = compute(s1, tables);
    let previous = infravanaSpend(base);
    for (let q = 0; q <= 6; q++) {
      for (let sp = 0; sp <= 2; sp++) {
        const r = compute({ ...s1, goal: "G4", tradeoff: { quality_step: q, speed_step: sp } }, tables);
        expect(r.allocation.total_usd, `q${q} s${sp}`).toBe(base.allocation.total_usd);
        expect(infravanaSpend(r), `q${q} s${sp}`).toBeLessThanOrEqual(infravanaSpend(base) + 1e-9);
      }
      const atQ = infravanaSpend(compute({ ...s1, goal: "G4", tradeoff: { quality_step: q, speed_step: 0 } }, tables));
      expect(atQ, `quality step ${q}`).toBeLessThanOrEqual(previous + 1e-9);
      previous = atQ;
    }
  });
});

// ---------------------------------------------------------------------------
// computeCore
// ---------------------------------------------------------------------------

describe("computeCore equals compute() on every shared field", () => {
  it.each([0, 1, 2, 3, 4, 5])("scenario %i", (index) => {
    const [name, scenario] = allScenarios()[index] as [string, Scenario];
    const full = compute(scenario, tables);
    const core = computeCore(scenario, tables);
    const { today_alternatives, ...shared } = full;
    expect(today_alternatives.length, name).toBeGreaterThan(0);
    expect(core, name).toEqual(shared);
    expect(Object.keys(core).sort(), name).toEqual(Object.keys(shared).sort());
    expect("today_alternatives" in core, name).toBe(false);
  });

  it("does not read the popularity ranks, which only order the Today options", () => {
    const t = clone(tables);
    t.pattern_popularity = [];
    expect(computeCore(s1, t)).toEqual(computeCore(s1, tables));
  });
});

// ---------------------------------------------------------------------------
// Small neighbours of compute() in the foundation
// ---------------------------------------------------------------------------

describe("scenarioAtTarget", () => {
  it("is null without a target, and otherwise the same scenario with the target as its state", () => {
    expect(scenarioAtTarget(s1)).toBeNull();
    const at = scenarioAtTarget(s2);
    expect(at).not.toBeNull();
    expect(at?.baseline).toEqual(s2.target);
    expect(at?.target).toBeUndefined();
    expect(at?.workload_mix).toEqual(s2.workload_mix);
  });

  it("prices the target state: S2 at its target costs more than at its baseline", () => {
    const at = scenarioAtTarget(s2) as Scenario;
    expect(compute(at, tables).allocation.total_usd).toBeGreaterThan(compute(s2, tables).allocation.total_usd);
  });
});

describe("benefitHeadcount (the count the per-head boxes divide by)", () => {
  it("is the people when the mix has team work", () => {
    expect(benefitHeadcount(s1, tables)).toBe(50);
    expect(benefitHeadcount(withBaseline(s1, 73, 100_000, 5_000), tables)).toBe(73);
  });

  it("is the customers when the mix has customer work only, and null when there is no customer count", () => {
    const customers: Scenario = { ...withBaseline(s1, 50, 100_000, 5_000), workload_mix: { customer_service: 1 } };
    expect(benefitHeadcount(customers, tables)).toBe(5_000);
    const noCount: Scenario = { ...withBaseline(s1, 50, 100_000), workload_mix: { customer_service: 1 } };
    expect(benefitHeadcount(noCount, tables)).toBeNull();
  });

  it("prefers the people when the mix has both", () => {
    const both: Scenario = {
      ...withBaseline(s1, 50, 100_000, 5_000),
      workload_mix: { software_design: 0.5, customer_service: 0.5 },
    };
    expect(benefitHeadcount(both, tables)).toBe(50);
  });
});

describe("the results' shape stays whole", () => {
  it("compute() carries every Results member", () => {
    const r: Results = compute(s1, tables);
    expect(Object.keys(r).sort()).toEqual(
      [
        "allocation",
        "comparator",
        "cost_per_mtok",
        "effective_open_share",
        "floor_unmet_workloads",
        "headline",
        "infravana_side",
        "quality_floor_by_workload",
        "today_alternatives",
        "tokens_bought",
      ].sort(),
    );
  });
});
