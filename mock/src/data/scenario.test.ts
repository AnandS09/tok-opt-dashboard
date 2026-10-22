import { afterEach, describe, expect, it } from "vitest";
import { loadScenario } from "./load";
import { parseScenarioResponse, type KnownIds } from "./scenario";
import { clone, fixtureText, restoreFetch, serveFixtures } from "../test/fixtures";

afterEach(restoreFetch);

const KNOWN: KnownIds = { hardwareIds: new Set(), patternIds: new Set() };

type Json = Record<string, any>;

/** The s1 fixture as plain JSON, with its baseline (and target, customers) edited. */
function s1Json(edit: (scenario: Json) => void): Json {
  const json = JSON.parse(fixtureText("scenarios/s1.json")) as Json;
  edit(json.scenario);
  return json;
}

const parse = (json: unknown) => parseScenarioResponse("scenarios/test.json", json, KNOWN).scenario;

describe("spec 5.2 clamping through the scenario parser", () => {
  it("users -5 gives 1, users 0 gives 1, users 1e9 gives 10,000", () => {
    expect(parse(s1Json((s) => (s.baseline.users = -5))).baseline.users).toBe(1);
    expect(parse(s1Json((s) => (s.baseline.users = 0))).baseline.users).toBe(1);
    expect(parse(s1Json((s) => (s.baseline.users = 1e9))).baseline.users).toBe(10_000);
  });

  it("budget -1 gives $1,000, budget 0 gives $1,000, budget 1e12 gives $100,000,000", () => {
    expect(parse(s1Json((s) => (s.baseline.budget_usd_per_quarter = -1))).baseline.budget_usd_per_quarter).toBe(1_000);
    expect(parse(s1Json((s) => (s.baseline.budget_usd_per_quarter = 0))).baseline.budget_usd_per_quarter).toBe(1_000);
    expect(parse(s1Json((s) => (s.baseline.budget_usd_per_quarter = 1e12))).baseline.budget_usd_per_quarter).toBe(
      100_000_000,
    );
  });

  it("customers -5 gives 1 and customers 1e9 gives 10,000,000", () => {
    expect(parse(s1Json((s) => (s.baseline.customers = -5))).baseline.customers).toBe(1);
    expect(parse(s1Json((s) => (s.baseline.customers = 1e9))).baseline.customers).toBe(10_000_000);
  });

  it("clamps the target state the same way", () => {
    const s = parse(
      s1Json((sc) => {
        sc.target = { users: -5, budget_usd_per_quarter: 1e12, customers: 1e9 };
      }),
    );
    expect(s.target).toEqual({ users: 1, budget_usd_per_quarter: 100_000_000, customers: 10_000_000 });
  });

  it("leaves in-range values, and both bounds, exactly as given", () => {
    const check = (users: number, budget: number, customers: number) => {
      const s = parse(
        s1Json((sc) => {
          sc.baseline = { users, budget_usd_per_quarter: budget, customers };
        }),
      );
      expect(s.baseline).toEqual({ users, budget_usd_per_quarter: budget, customers });
    };
    check(73, 25_000, 4_321);
    check(1, 1_000, 1);
    check(10_000, 100_000_000, 10_000_000);
  });

  it("adds no customers field when the file has none", () => {
    const s = parse(s1Json(() => {}));
    expect("customers" in s.baseline).toBe(false);
  });

  it("clamps through loadScenario too, not only the parser function", async () => {
    const edited = clone(JSON.parse(fixtureText("scenarios/s1.json")) as Json);
    edited.scenario.baseline.users = -5;
    edited.scenario.baseline.budget_usd_per_quarter = -1;
    serveFixtures({ "scenarios/s1.json": JSON.stringify(edited) });
    const { scenario } = await loadScenario("data", "s1");
    expect(scenario.baseline.users).toBe(1);
    expect(scenario.baseline.budget_usd_per_quarter).toBe(1_000);
  });

  it("still rejects a value that is not a number, naming the field", () => {
    expect(() => parse(s1Json((s) => (s.baseline.users = "50")))).toThrow(/baseline\.users.*a number/);
    expect(() => parse(s1Json((s) => (s.baseline.budget_usd_per_quarter = null)))).toThrow(
      /baseline\.budget_usd_per_quarter.*a number/,
    );
  });
});

describe("the other scenario fields the parser checks", () => {
  it("accepts a G4 trade-off of whole steps from 0, and a known goal", () => {
    const s = parse(
      s1Json((sc) => {
        sc.goal = "G4";
        sc.tradeoff = { quality_step: 3, speed_step: 0 };
      }),
    );
    expect(s.goal).toBe("G4");
    expect(s.tradeoff).toEqual({ quality_step: 3, speed_step: 0 });
  });

  it.each([[-1], [1.5], ["2"]])("rejects a trade-off step of %j, naming the field", (step) => {
    expect(() => parse(s1Json((sc) => (sc.tradeoff = { quality_step: step, speed_step: 0 })))).toThrow(
      /tradeoff\.quality_step/,
    );
  });

  it("rejects an unknown goal, naming the allowed ones", () => {
    expect(() => parse(s1Json((sc) => (sc.goal = "G9")))).toThrow(/scenario\.goal.*G1, G2, G3, G4/);
  });

  it("accepts a comparator that is a known pattern and rejects one that is not", () => {
    const known: KnownIds = { hardwareIds: new Set(), patternIds: new Set(["api", "seats"]) };
    const withComparator = (id: string) => s1Json((sc) => (sc.comparator = id));
    expect(parseScenarioResponse("x.json", withComparator("api"), known).scenario.comparator).toBe("api");
    expect(() => parseScenarioResponse("x.json", withComparator("nope"), known)).toThrow(
      /scenario\.comparator.*a pattern_id in buying_patterns\.csv, got "nope"/,
    );
  });
});
