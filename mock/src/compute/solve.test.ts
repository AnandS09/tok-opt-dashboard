import { beforeAll, describe, expect, it } from "vitest";
import type { Results, Scenario, SolveAxis, SolveResult, Tables } from "../contract";
import { USERS_RANGE } from "../data/ranges";
import {
  clone,
  infravanaSpend,
  loadFixtureScenario,
  loadFixtureTables,
  restoreFetch,
  withBaseline,
} from "../test/fixtures";
import {
  COVERAGE_MESSAGE_ABOVE,
  c5Figures,
  compute,
  g1Headline,
  goalAvailability,
  solveAtBudget,
  solveGoal,
  solvedHeadline,
} from "./index";
import { hasEmployeeWork } from "./solve";

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

// ---------------------------------------------------------------------------
// An independent solver, written from the spec 6.2 wording and built on the
// public compute() (not on computeCore), so the solver under test is checked
// against a second reading of the spec rather than against itself.
// ---------------------------------------------------------------------------

interface Spend {
  today: number;
  infravana: number;
}

/** Both sides' spend at scale k of the volume, through the public compute(). */
function spendFn(scenario: Scenario, axis: SolveAxis): (k: number) => Spend {
  const cache = new Map<number, Spend>();
  return (k) => {
    const known = cache.get(k);
    if (known !== undefined) return known;
    const at =
      axis === "intensity"
        ? {
            scenario,
            tables: {
              ...tables,
              workloads: tables.workloads.map((w) => ({
                ...w,
                tok_in_per_user_day: w.tok_in_per_user_day * k,
                tok_out_per_user_day: w.tok_out_per_user_day * k,
              })),
            },
          }
        : { scenario: withBaseline(scenario, scenario.baseline.users * k, scenario.baseline.budget_usd_per_quarter, scenario.baseline.customers), tables };
    const r = compute(at.scenario, at.tables);
    const spend = { today: r.allocation.total_usd, infravana: infravanaSpend(r) };
    cache.set(k, spend);
    return spend;
  };
}

/** Spec 6.2: ceiling 2 x budget / linear spend; 1% geometric scan from 0.01; largest scanned fit; bisect to 0.1%. */
function specSolve(spendAt: (k: number) => number, budget: number): number | null {
  const ceiling = (2 * budget) / spendAt(1);
  let lo = 0; // 0 means no scanned scale fits yet
  let hi = 0; // 0 means no miss has followed the last fit
  for (let s = 0.01; s <= ceiling; s *= 1.01) {
    if (spendAt(s) <= budget) {
      lo = s;
      hi = 0;
    } else if (lo > 0 && hi === 0) hi = s;
  }
  if (lo === 0) return null;
  if (hi === 0) return lo;
  while ((hi - lo) / lo > 0.001) {
    const mid: number = (lo + hi) / 2;
    if (spendAt(mid) <= budget) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** Spec 6.2 acceptance (1): no scanned scale above `scale` has spend within the budget. */
function noScannedScaleAbove(spendAt: (k: number) => number, budget: number, scale: number): boolean {
  const ceiling = (2 * budget) / spendAt(1);
  for (let s = 0.01; s <= ceiling; s *= 1.01) {
    if (s > scale * 1.0000001 && spendAt(s) <= budget) return false;
  }
  return true;
}

const solve = (scenario: Scenario, axis: SolveAxis) => solveAtBudget(scenario, tables, axis);

const MIX_WITH_CUSTOMERS = (): Scenario => ({
  ...withBaseline(s1, 50, 100_000, 10_000),
  workload_mix: { ...s1.workload_mix, customer_service: 0.5, product_ai: 0.5 },
});
const CUSTOMER_ONLY = (): Scenario => ({
  ...withBaseline(s1, 50, 100_000, 10_000),
  workload_mix: { customer_service: 0.5, product_ai: 0.5 },
});

// ---------------------------------------------------------------------------
// Spec 6.2 acceptance cases
// ---------------------------------------------------------------------------

describe("solveAtBudget: the spec 6.2 acceptance cases", () => {
  it("(2) S1 at 5,000 people and $90M: G2 is about 1.42, not 1.0", () => {
    const g2 = solve(withBaseline(s1, 5000, 90e6), "intensity");
    expect(g2.multiple).toBeCloseTo(1.42, 2);
    expect(Math.abs(g2.multiple - 1)).toBeGreaterThan(0.3);
    expect(g2.capped_at_users_max).toBe(false);
  });

  it("(2) S1 at 5,000 people and $90M: G3 is also about 1.42 and sets the cap flag, with the true head-counts", () => {
    const g3 = solve(withBaseline(s1, 5000, 90e6), "users");
    expect(g3.multiple).toBeCloseTo(1.42, 2);
    expect(g3.capped_at_users_max).toBe(true);
    // The scales are the solved ones, never clamped to the users range.
    expect(g3.today_scale * 5000).toBeCloseTo(44_968, -1);
    expect(g3.infravana_scale * 5000).toBeCloseTo(63_860, -1);
    expect(g3.today_scale * 5000).toBeGreaterThan(USERS_RANGE.max);
  });

  it("S1 at 5,000 people and $16M: the flag is set when only InfraVana's head-count is above the users range", () => {
    const g3 = solve(withBaseline(s1, 5000, 16e6), "users");
    expect(g3.multiple).toBeCloseTo(1.42, 2);
    expect(g3.capped_at_users_max).toBe(true);
    expect(g3.today_scale * 5000).toBeLessThan(USERS_RANGE.max); // 7,996 people
    expect(g3.infravana_scale * 5000).toBeGreaterThan(USERS_RANGE.max); // 11,355 people
    expect(g3.today_scale * 5000).toBeCloseTo(7_996, -1);
    expect(g3.infravana_scale * 5000).toBeCloseTo(11_355, -1);
    expect(solve(withBaseline(s1, 5000, 16e6), "intensity").capped_at_users_max).toBe(false);
  });

  it("(3) S1 at 1 user and $100M: G2 and G3 are finite; only G3 sets the cap flag, with true head-counts", () => {
    const one = withBaseline(s1, 1, 100e6);
    const g2 = solve(one, "intensity");
    expect(Number.isFinite(g2.multiple)).toBe(true);
    expect(g2.multiple).toBeGreaterThan(1);
    expect(g2.capped_at_users_max).toBe(false);
    const g3 = solve(one, "users");
    expect(Number.isFinite(g3.multiple)).toBe(true);
    expect(g3.capped_at_users_max).toBe(true);
    expect(g3.today_scale).toBeGreaterThan(USERS_RANGE.max);
    expect(g3.infravana_scale).toBeGreaterThan(USERS_RANGE.max);
    expect(g3.infravana_scale * 1).toBeCloseTo(70_958, -1);
  });

  it("S2 at a $30K budget: G2 and G3 are about 1.30, not the linear 1.46", () => {
    const low = withBaseline(s2, s2.baseline.users, 30_000);
    const g2 = solve(low, "intensity");
    const g3 = solve(low, "users");
    expect(g2.multiple).toBeCloseTo(1.3, 2);
    expect(g3.multiple).toBeCloseTo(1.3, 2);
    expect(compute(low, tables).headline.tokens_multiple).toBeCloseTo(1.4628, 3); // what G1's linear rule claims
    expect(Math.abs(g2.multiple - 1.4628)).toBeGreaterThan(0.1);
    expect(g3.capped_at_users_max).toBe(false);
  });

  it("the solved volumes' tokens are the demand at that scale, and their ratio is the multiple's basis", () => {
    const g2 = solve(withBaseline(s2, s2.baseline.users, 30_000), "intensity");
    const demand = compute(withBaseline(s2, s2.baseline.users, 30_000), tables).tokens_bought.demand_tokens;
    expect(g2.today_tokens).toBeCloseTo(demand * g2.today_scale, -2);
    expect(g2.infravana_tokens).toBeCloseTo(demand * g2.infravana_scale, -2);
    expect(g2.multiple).toBe(g2.infravana_scale / g2.today_scale);
  });
});

describe("solveAtBudget: the axes", () => {
  it("G2 scales all workloads, G3 only the employee workloads: with 10,000 customers G3 is about 1.46 and G2 is lower", () => {
    const s = MIX_WITH_CUSTOMERS();
    const g3 = solve(s, "users");
    const g2 = solve(s, "intensity");
    expect(g3.multiple).toBeCloseTo(1.46, 1);
    expect(g2.multiple).toBeLessThan(g3.multiple - 0.02);
    expect(g2.multiple).toBeCloseTo(1.41, 1);

    // Tokens: employee work scales with the solved scale, customer work stays fixed (G3), or both scale (G2).
    const tokens = (basis: "employee" | "customer") => {
      const total = (scenario: Scenario) =>
        compute(scenario, tables).tokens_bought.demand_tokens;
      const onlyBasis = {
        ...s,
        workload_mix: Object.fromEntries(
          Object.entries(s.workload_mix).filter(([id]) => tables.workloads.find((w) => w.workload_id === id)?.basis === basis),
        ),
      };
      return total(onlyBasis);
    };
    const employee = tokens("employee");
    const customer = tokens("customer");
    expect(employee).toBeGreaterThan(0);
    expect(customer).toBeGreaterThan(0);
    expect(g3.infravana_tokens).toBeCloseTo(g3.infravana_scale * employee + customer, -3);
    expect(g3.today_tokens).toBeCloseTo(g3.today_scale * employee + customer, -3);
    expect(g2.infravana_tokens).toBeCloseTo(g2.infravana_scale * (employee + customer), -3);
    expect(g2.today_tokens).toBeCloseTo(g2.today_scale * (employee + customer), -3);
  });

  it("with no customers in the mix the two axes solve the same scale", () => {
    const g2 = solve(s1, "intensity");
    const g3 = solve(s1, "users");
    expect(g3.today_scale).toBeCloseTo(g2.today_scale, 9);
    expect(g3.infravana_scale).toBeCloseTo(g2.infravana_scale, 9);
  });

  it("G3 is unavailable, with a reason, for a mix with no team work; solveAtBudget throws for it; G2 still solves", () => {
    const customers = CUSTOMER_ONLY();
    expect(hasEmployeeWork(customers, tables)).toBe(false);
    expect(goalAvailability(customers, tables).G3).toMatch(/customer-facing only/);
    expect(goalAvailability(customers, tables).G2).toBeNull();
    expect(() => solve(customers, "users")).toThrow(/no employee work/);
    expect(Number.isFinite(solve(customers, "intensity").multiple)).toBe(true);
  });

  it("G3 is available, with no reason, when the mix has team work, with or without customers", () => {
    expect(goalAvailability(s1, tables)).toEqual({ G2: null, G3: null });
    expect(goalAvailability(MIX_WITH_CUSTOMERS(), tables)).toEqual({ G2: null, G3: null });
  });

  it("a workload with a zero share does not count as team work", () => {
    const zero: Scenario = { ...CUSTOMER_ONLY(), workload_mix: { software_design: 0, customer_service: 1 } };
    expect(hasEmployeeWork(zero, tables)).toBe(false);
    expect(goalAvailability(zero, tables).G3).not.toBeNull();
  });

  it("a G4 trade-off on the scenario does not change either solve (G1 to G3 use the visitor's own floors and speed)", () => {
    const traded: Scenario = { ...s1, goal: "G4", tradeoff: { quality_step: 3, speed_step: 1 } };
    expect(solve(traded, "intensity")).toEqual(solve(s1, "intensity"));
    expect(solve(traded, "users")).toEqual(solve(s1, "users"));
  });

  it("a budget below the seat fees fits no volume on Today's side: scale 0, tokens 0, multiple Infinity; G3 still solves", () => {
    const seats: Scenario = { ...withBaseline(s1, 100, 10_000), stage_today: "seats" };
    const g2 = solve(seats, "intensity");
    expect(g2.today_scale).toBe(0);
    expect(g2.today_tokens).toBe(0);
    expect(g2.infravana_scale).toBeGreaterThan(0);
    expect(g2.infravana_tokens).toBeGreaterThan(0);
    expect(g2.multiple).toBe(Infinity);
    const g3 = solve(seats, "users");
    expect(g3.today_scale).toBeGreaterThan(0);
    expect(Number.isFinite(g3.multiple)).toBe(true);
  });

  it("a budget that buys under a hundredth of the volume still solves, from scales below the scan start", () => {
    const tiny = withBaseline(s1, 10_000, 1_000);
    const g2 = solve(tiny, "intensity");
    expect(g2.today_scale).toBeGreaterThan(0);
    expect(g2.today_scale).toBeLessThan(0.01);
    expect(g2.infravana_scale).toBeLessThan(0.01);
    expect(g2.multiple).toBeGreaterThan(1);
    expect(spendFn(tiny, "intensity")(g2.infravana_scale).infravana).toBeLessThanOrEqual(1_000);
  });
});

describe("solveAtBudget: inputs it refuses", () => {
  it.each([[0], [-5], [NaN], [Infinity]])("a budget of %s throws, naming the budget", (budget) => {
    expect(() => solve(withBaseline(s1, 50, budget), "intensity")).toThrow(/budget must be a positive number/);
  });

  it("a scenario with no demand throws, naming that there is nothing to scale", () => {
    expect(() => solve(withBaseline(s1, 0, 100_000), "intensity")).toThrow(/no spend/);
  });

  it("does not modify the scenario or the tables", () => {
    const scenario = clone(s1);
    const rows = clone(tables.workloads);
    solve(scenario, "intensity");
    solve(scenario, "users");
    expect(scenario).toEqual(s1);
    expect(tables.workloads).toEqual(rows);
  });
});

// ---------------------------------------------------------------------------
// Spec 6.2 acceptance (1): the scan, against a second reading of the spec
// ---------------------------------------------------------------------------

describe("solveAtBudget: the scan (spec 6.2 acceptance 1)", () => {
  const CASES: [string, () => Scenario][] = [
    ["S1 default", () => s1],
    ["S2 default", () => s2],
    ["hardware_heavy default", () => hardwareHeavy],
    ["S1 5,000 people $90M", () => withBaseline(s1, 5000, 90e6)],
    ["S1 5,000 people $16M", () => withBaseline(s1, 5000, 16e6)],
    ["S1 1 user $100M", () => withBaseline(s1, 1, 100e6)],
    ["S2 $30K", () => withBaseline(s2, s2.baseline.users, 30_000)],
    ["S1 seats $50K", () => ({ ...withBaseline(s1, s1.baseline.users, 50_000), stage_today: "seats" })],
    ["S1 with 10,000 customers", MIX_WITH_CUSTOMERS],
    ["S2 5 people $20K", () => withBaseline(s2, 5, 20_000)],
  ];

  it.each(CASES)("%s: no side's solved scale has spend above the budget, and no scanned scale above it fits", (_name, build) => {
    const scenario = build();
    const budget = scenario.baseline.budget_usd_per_quarter;
    for (const axis of ["intensity", "users"] as const) {
      const result = solve(scenario, axis);
      const spend = spendFn(scenario, axis);
      for (const side of ["today", "infravana"] as const) {
        const scale = side === "today" ? result.today_scale : result.infravana_scale;
        if (scale > 0) {
          expect(spend(scale)[side], `${axis} ${side} spend at the solved scale`).toBeLessThanOrEqual(budget * (1 + 1e-9));
        }
        expect(
          noScannedScaleAbove((k) => spend(k)[side], budget, scale),
          `${axis} ${side}: a scanned scale above ${scale} has spend within the budget`,
        ).toBe(true);
      }
    }
  }, 60_000);

  it.each([
    ["S1 default", () => s1],
    ["S2 default", () => s2],
    ["S2 $30K", () => withBaseline(s2, s2.baseline.users, 30_000)],
    ["S1 5,000 people $90M", () => withBaseline(s1, 5000, 90e6)],
    ["S1 seats $50K", () => ({ ...withBaseline(s1, s1.baseline.users, 50_000), stage_today: "seats" }) as Scenario],
  ] as [string, () => Scenario][])("%s: both sides' scales equal an independent solver written from the spec wording", (_name, build) => {
    const scenario = build();
    const budget = scenario.baseline.budget_usd_per_quarter;
    for (const axis of ["intensity", "users"] as const) {
      const result = solve(scenario, axis);
      const spend = spendFn(scenario, axis);
      const today = specSolve((k) => spend(k).today, budget) ?? 0;
      const infravana = specSolve((k) => spend(k).infravana, budget) ?? 0;
      expect(result.today_scale, `${axis} Today`).toBeCloseTo(today, 9);
      expect(result.infravana_scale, `${axis} InfraVana`).toBeCloseTo(infravana, 9);
      expect(Math.abs(result.today_scale - today)).toBeLessThanOrEqual(today * 1e-9);
      expect(Math.abs(result.infravana_scale - infravana)).toBeLessThanOrEqual(infravana * 1e-9);
    }
  }, 60_000);

  it("spend is not monotone in volume (a commit minimum can make it fall), so the solver does not stop at the first scale that misses", () => {
    // Find, on S1, a volume where InfraVana's spend falls as volume rises, and set the budget between the two spends:
    // the scale just before the fall misses the budget and the scale just after it fits.
    const spend = spendFn(s1, "users");
    let peak = 0;
    let dip = 0;
    for (let k = 0.02; k < 1; k *= 1.01) {
      const previous = k / 1.01;
      if (spend(k).infravana < spend(previous).infravana) {
        peak = previous;
        dip = k;
        break;
      }
    }
    expect(dip, "the placeholder data has a commit-minimum dip in InfraVana's spend below the current volume").toBeGreaterThan(0);
    const budget = (spend(peak).infravana + spend(dip).infravana) / 2;
    expect(spend(peak).infravana).toBeGreaterThan(budget);
    expect(spend(dip).infravana).toBeLessThan(budget);

    const scenario = withBaseline(s1, s1.baseline.users, budget);
    for (const axis of ["users", "intensity"] as const) {
      const result = solve(scenario, axis);
      expect(result.infravana_scale, axis).toBeGreaterThanOrEqual(dip * (1 - 1e-9));
      expect(spendFn(scenario, axis)(result.infravana_scale).infravana).toBeLessThanOrEqual(budget * (1 + 1e-9));
    }
  }, 30_000);

  it("a result is refined past the scan's 1% grid: it is not itself a scanned point", () => {
    const result = solve(withBaseline(s2, s2.baseline.users, 30_000), "intensity");
    const onGrid = (x: number) => {
      const n = Math.log(x / 0.01) / Math.log(1.01);
      return Math.abs(n - Math.round(n)) < 1e-6;
    };
    expect(onGrid(result.infravana_scale) && onGrid(result.today_scale)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Spec 6.2 acceptance (4): one generous timing bound
// ---------------------------------------------------------------------------

describe("solveAtBudget: timing", () => {
  it("each solve on S1, S2 and hardware_heavy finishes inside a generous bound (spec target 0.5 s; bound 3 s)", () => {
    const worst = { ms: 0, which: "" };
    for (const [name, s] of [["S1", s1], ["S2", s2], ["hardware_heavy", hardwareHeavy]] as const) {
      for (const axis of ["intensity", "users"] as const) {
        const start = performance.now();
        solve(s, axis);
        const ms = performance.now() - start;
        if (ms > worst.ms) {
          worst.ms = ms;
          worst.which = `${name} ${axis}`;
        }
      }
    }
    expect(worst.ms, `slowest solve: ${worst.which}`).toBeLessThan(3_000);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// The goals module (goals.ts)
// ---------------------------------------------------------------------------

describe("default scenarios reproduce G1 (g1Headline)", () => {
  // The placeholder fixtures' default numbers, asserted by scripts/check-demand.mjs.
  const DEFAULTS: [string, () => Scenario, number, number][] = [
    ["S1", () => s1, 100_012.5, 70_440.09],
    ["S2", () => s2, 72_487.61, 49_555.12],
    ["hardware_heavy", () => hardwareHeavy, 88_987.5, 70_289.28],
  ];

  it.each(DEFAULTS)("%s: the saving is today's cost less InfraVana's, in dollars, percent and linear multiple", (_n, build, today, infravana) => {
    const r = compute(build(), tables);
    expect(r.allocation.total_usd).toBeCloseTo(today, 2);
    expect(infravanaSpend(r)).toBeCloseTo(infravana, 2);
    const g1 = g1Headline(r);
    expect(g1.goal).toBe("G1");
    expect(g1.saved_usd).toBeCloseTo(today - infravana, 2);
    expect(g1.saved_pct).toBeCloseTo((100 * (today - infravana)) / today, 2);
    expect(g1.linear_multiple).toBeCloseTo(today / infravana, 4);
    expect(g1.comparator).toBe(r.comparator);
    expect(g1.over_ten_times).toBe(false);
  });

  it("S1 saves 29.57 percent, and the headline dollars are the sum of the C1 savings segments", () => {
    const r = compute(s1, tables);
    const g1 = g1Headline(r);
    expect(g1.saved_pct).toBeCloseTo(29.57, 2);
    const segments = r.allocation.infravana.filter((s) => s.kind === "savings").reduce((sum, s) => sum + s.usd, 0);
    expect(g1.saved_usd).toBe(segments);
    expect(g1.linear_multiple).toBeCloseTo(1 / (1 - g1.saved_pct / 100), 9);
  });

  it("coverage is how many times the work Today's budget covers; above 10 times the page shows a message, not a multiple", () => {
    expect(COVERAGE_MESSAGE_ABOVE).toBe(10);
    const normal = g1Headline(compute(s1, tables));
    expect(normal.coverage).toBeCloseTo(1, 2);
    expect(normal.over_ten_times).toBe(false);
    const rich = g1Headline(compute(withBaseline(s1, 1, 100e6), tables));
    expect(rich.coverage).toBeGreaterThan(10_000);
    expect(rich.over_ten_times).toBe(true);
  });
});

describe("g1Headline: the ten-times message", () => {
  it("applies strictly above 10 times: exactly 10 shows the multiple, just above shows the message", () => {
    const r = compute(s1, tables);
    const demand = r.tokens_bought.demand_tokens;
    const at = (times: number) => ({ ...r, tokens_bought: { ...r.tokens_bought, today_tokens: demand * times } });
    expect(g1Headline(at(10)).coverage).toBe(10);
    expect(g1Headline(at(10)).over_ten_times).toBe(false);
    expect(g1Headline(at(10.0001)).over_ten_times).toBe(true);
    expect(g1Headline(at(9.9999)).over_ten_times).toBe(false);
  });
});

describe("solvedHeadline", () => {
  const base: SolveResult = {
    axis: "users",
    today_scale: 2,
    infravana_scale: 3,
    multiple: 1.5,
    today_tokens: 200,
    infravana_tokens: 300,
    capped_at_users_max: false,
  };

  it("G3 carries the true head-counts: the solved scale times the people, not clamped", () => {
    const result = solve(withBaseline(s1, 5000, 90e6), "users");
    const h = solvedHeadline(withBaseline(s1, 5000, 90e6), result);
    expect(h.goal).toBe("G3");
    expect(h.today_people).toBeCloseTo(44_968, -1);
    expect(h.infravana_people).toBeCloseTo(63_860, -1);
    expect(h.capped_at_users_max).toBe(true);
    expect(h.multiple).toBe(result.multiple);
    expect(h.solve).toBe(result);
  });

  it("G2 has no head-counts and never reports the cap, even if the solve says so", () => {
    const h = solvedHeadline(s1, { ...base, axis: "intensity", capped_at_users_max: true });
    expect(h.goal).toBe("G2");
    expect(h.today_people).toBeNull();
    expect(h.infravana_people).toBeNull();
    expect(h.capped_at_users_max).toBe(false);
  });

  it("the ten-times message applies strictly above 10 times the current volume", () => {
    expect(solvedHeadline(s1, { ...base, today_scale: 10 }).over_ten_times).toBe(false);
    expect(solvedHeadline(s1, { ...base, today_scale: 10.000001 }).over_ten_times).toBe(true);
    expect(solvedHeadline(s1, { ...base, today_scale: 10 }).coverage).toBe(10);
  });

  it("flags a side whose solved scale is 0", () => {
    const seats: Scenario = { ...withBaseline(s1, 100, 10_000), stage_today: "seats" };
    const h = solvedHeadline(seats, solve(seats, "intensity"));
    expect(h.no_volume_fits).toEqual({ today: true, infravana: false });
    expect(h.over_ten_times).toBe(false);
    expect(solvedHeadline(s1, { ...base, today_scale: 0, infravana_scale: 0 }).no_volume_fits).toEqual({
      today: true,
      infravana: true,
    });
    expect(solvedHeadline(s1, base).no_volume_fits).toEqual({ today: false, infravana: false });
  });

  it("solveGoal solves the axis of its goal: G2 intensity, G3 users", () => {
    const s = withBaseline(s1, 5000, 90e6);
    expect(solveGoal(s, tables, "G2").solve).toEqual(solve(s, "intensity"));
    expect(solveGoal(s, tables, "G3").solve).toEqual(solve(s, "users"));
  });
});

describe("c5Figures (C5 follows the tab)", () => {
  const withTradeoff = (): Scenario => ({ ...s2, goal: "G4", tradeoff: { quality_step: 3, speed_step: 1 } });

  it("G1: the linear tokens bought, the multiple is 1 / (1 - saving), grey options are not labelled estimated", () => {
    const r = compute(s2, tables);
    const f = c5Figures("G1", r, null);
    expect(f.basis).toBe("linear");
    expect(f.today_tokens).toBe(r.tokens_bought.today_tokens);
    expect(f.infravana_tokens).toBe(r.tokens_bought.infravana_tokens);
    expect(f.multiple).toBeCloseTo(r.headline.tokens_multiple, 12);
    expect(f.multiple).toBeCloseTo(1 / (1 - r.headline.cost_savings_pct / 100), 9);
    expect(f.extra_tokens).toBe(f.infravana_tokens - f.today_tokens);
    expect(f.at_tradeoff).toBe(false);
    expect(f.options.length).toBeGreaterThan(0);
    expect(f.options.every((o) => o.estimated_at_average_price === false)).toBe(true);
  });

  it("G1 ignores a solve it is handed", () => {
    const r = compute(s2, tables);
    expect(c5Figures("G1", r, solve(s2, "intensity"))).toEqual(c5Figures("G1", r, null));
  });

  it("G2 and G3: the solved volumes and multiple; grey options stay linear and are labelled estimated", () => {
    const low = withBaseline(s2, s2.baseline.users, 30_000);
    const r = compute(low, tables);
    for (const [goal, axis] of [["G2", "intensity"], ["G3", "users"]] as const) {
      const solved = solve(low, axis);
      const f = c5Figures(goal, r, solved);
      expect(f.basis).toBe("solved");
      expect(f.today_tokens).toBe(solved.today_tokens);
      expect(f.infravana_tokens).toBe(solved.infravana_tokens);
      expect(f.multiple).toBeCloseTo(solved.multiple, 12);
      expect(f.multiple).not.toBeCloseTo(r.headline.tokens_multiple, 1);
      expect(f.extra_tokens).toBe(solved.infravana_tokens - solved.today_tokens);
      const linear = new Map(r.today_alternatives.map((a) => [a.pattern_id, a.tokens_at_budget]));
      expect(f.options.length).toBeGreaterThan(0);
      for (const o of f.options) {
        expect(o.estimated_at_average_price).toBe(true);
        expect(o.tokens).toBe(linear.get(o.pattern_id));
      }
    }
  });

  it("the options are the grey Today options other than the comparator, in result order", () => {
    const r: Results = compute({ ...s1, comparator: "vendor2_direct" }, tables);
    const f = c5Figures("G1", r, null);
    const expected = r.today_alternatives.filter((a) => a.is_grey && a.pattern_id !== "vendor2_direct").map((a) => a.pattern_id);
    expect(f.options.map((o) => o.pattern_id)).toEqual(expected);
    expect(f.options.map((o) => o.pattern_id)).not.toContain("vendor2_direct");
    expect(f.options.map((o) => o.pattern_id)).not.toContain("best_single");
  });

  it("G4: linear figures at the relaxed plan, labelled as at the trade-off", () => {
    const r = compute(withTradeoff(), tables);
    const f = c5Figures("G4", r, null);
    expect(f.basis).toBe("linear");
    expect(f.at_tradeoff).toBe(true);
    expect(f.infravana_tokens).toBe(r.tokens_bought.infravana_tokens);
    expect(f.options.every((o) => o.estimated_at_average_price === false)).toBe(true);
    expect(f.capped_at_users_max).toBe(false);
  });

  it("G3 carries the cap flag from the solve, and G2 never does", () => {
    const big = withBaseline(s1, 5000, 90e6);
    const r = compute(big, tables);
    expect(c5Figures("G3", r, solve(big, "users")).capped_at_users_max).toBe(true);
    expect(c5Figures("G2", r, solve(big, "intensity")).capped_at_users_max).toBe(false);
    expect(c5Figures("G2", r, { ...solve(big, "users") }).capped_at_users_max).toBe(false);
    const small = compute(s2, tables);
    expect(c5Figures("G3", small, solve(s2, "users")).capped_at_users_max).toBe(false);
  });

  it("G2 and G3 without the solve throw, naming the goal", () => {
    const r = compute(s1, tables);
    expect(() => c5Figures("G2", r, null)).toThrow(/goal "G2".*needs the solveAtBudget result/);
    expect(() => c5Figures("G3", r, null)).toThrow(/goal "G3".*needs the solveAtBudget result/);
  });

  it("the multiple is Infinity when only Today buys nothing, and 1 when neither buys anything", () => {
    const r = compute(s1, tables);
    const none: SolveResult = {
      axis: "intensity",
      today_scale: 0,
      infravana_scale: 1,
      multiple: Infinity,
      today_tokens: 0,
      infravana_tokens: 5,
      capped_at_users_max: false,
    };
    expect(c5Figures("G2", r, none).multiple).toBe(Infinity);
    expect(c5Figures("G2", r, { ...none, infravana_tokens: 0, infravana_scale: 0 }).multiple).toBe(1);
  });
});
