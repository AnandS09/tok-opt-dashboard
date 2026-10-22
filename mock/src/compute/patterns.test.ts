import { beforeAll, describe, expect, it } from "vitest";
import type { Results, Scenario, Stage, Tables } from "../contract";
import {
  clone,
  infravanaSpend,
  loadFixtureScenario,
  loadFixtureTables,
  restoreFetch,
} from "../test/fixtures";
import { compute } from "./index";

/**
 * Spec 6.1 and 7.4 through the public compute(): which Today options are
 * grey, in what order, and how the best single option is derived. Tables are
 * edited in memory (never the fixture files) to build the cases the fixtures
 * do not contain.
 */

const STAGES: Stage[] = ["seats", "api", "platform"];

let base: Tables;
let s1: Scenario;

beforeAll(async () => {
  base = await loadFixtureTables();
  s1 = await loadFixtureScenario("s1");
  restoreFetch();
});

const greys = (r: Results): string[] => r.today_alternatives.filter((a) => a.is_grey).map((a) => a.pattern_id);
const ids = (r: Results): string[] => r.today_alternatives.map((a) => a.pattern_id);
const at = (stage: Stage, extra: Partial<Scenario> = {}): Scenario => ({ ...s1, stage_today: stage, ...extra });

/** A copy of the tables whose pattern_popularity rows for `stage` are replaced by `ranks` (pattern id to rank). */
function ranked(stage: Stage, ranks: Record<string, number>): Tables {
  const t = clone(base);
  t.pattern_popularity = [
    ...t.pattern_popularity.filter((r) => r.stage !== stage),
    ...Object.entries(ranks).map(([pattern_id, popularity_rank]) => ({
      pattern_id,
      stage,
      popularity_rank,
      popularity_source: "test",
    })),
  ];
  return t;
}

describe("the typical buyer (spec 6.1)", () => {
  it.each(STAGES)("at stage %s it is the way_to_buy pattern of that stage, listed once, and grey", (stage) => {
    const r = compute(at(stage), base);
    const typical = r.today_alternatives.filter((a) => a.is_typical);
    expect(typical.map((a) => a.pattern_id)).toEqual([stage]);
    expect(typical[0]?.kind).toBe("way_to_buy");
    expect(typical[0]?.is_grey).toBe(true);
    expect(r.comparator).toBe(stage);
    expect(new Set(ids(r)).size).toBe(ids(r).length);
  });

  it("is never listed twice, whatever the ranks or the comparator", () => {
    for (const stage of STAGES) {
      for (const comparator of ids(compute(at(stage), base))) {
        const r = compute(at(stage, { comparator }), base);
        expect(new Set(ids(r)).size, `${stage} vs ${comparator}`).toBe(ids(r).length);
        expect(r.today_alternatives.filter((a) => a.is_typical)).toHaveLength(1);
      }
    }
  });

  it("takes the fourth grey slot when it does not rank in the top four", () => {
    // api ranked sixth at stage api.
    const t = ranked("api", { vendor2_direct: 1, platform: 2, seats: 3, vendor1_direct: 4, vendor2_bedrock: 5, api: 6 });
    expect(greys(compute(at("api"), t))).toEqual(["vendor2_direct", "platform", "seats", "api"]);
  });

  it("stays grey, with four greys, when it ranks outside the top four and another option is the comparator", () => {
    for (const stage of STAGES) {
      // Push the typical buyer down to rank 9; every other ranked pattern moves up.
      const ranks: Record<string, number> = {};
      let next = 1;
      const current = base.pattern_popularity
        .filter((r) => r.stage === stage)
        .sort((a, b) => a.popularity_rank - b.popularity_rank);
      for (const row of current) ranks[row.pattern_id] = row.pattern_id === stage ? 9 : next++;
      const t = ranked(stage, ranks);
      for (const comparator of Object.keys(ranks).filter((id) => id !== stage)) {
        const r = compute(at(stage, { comparator }), t);
        expect(greys(r), `${stage} vs ${comparator}`).toHaveLength(4);
        expect(greys(r), `${stage} vs ${comparator}`).toContain(stage);
        expect(greys(r), `${stage} vs ${comparator}`).toContain(comparator);
      }
    }
  });

  it("is still included when it has no rank at all", () => {
    const t = ranked("api", { vendor2_direct: 1, platform: 2, seats: 3, vendor1_direct: 4, vendor2_bedrock: 5 });
    const r = compute(at("api"), t);
    expect(greys(r)).toEqual(["vendor2_direct", "platform", "seats", "api"]);
    expect(r.today_alternatives.find((a) => a.pattern_id === "api")?.is_typical).toBe(true);
  });

  it("is the only grey when nothing is ranked for the stage", () => {
    const r = compute(at("api"), ranked("api", {}));
    expect(greys(r)).toEqual(["api"]);
  });
});

describe("popularity order per stage (spec 6.1 acceptance 2 and 11, spec 7.4)", () => {
  it("the grey options follow the fixture's ranks, and differ between the seats, api and platform stages", () => {
    const seats = greys(compute(at("seats"), base));
    const api = greys(compute(at("api"), base));
    const platform = greys(compute(at("platform"), base));
    expect(seats).toEqual(["seats", "vendor1_direct", "api", "vendor2_direct"]);
    expect(api).toEqual(["api", "vendor2_direct", "platform", "seats"]);
    expect(platform).toEqual(["platform", "vendor2_bedrock", "api", "vendor2_direct"]);
    expect(seats).not.toEqual(api);
    expect(api).not.toEqual(platform);
    expect(seats).not.toEqual(platform);
  });

  it("the displayed order is the grey options in popularity order, then the others", () => {
    const r = compute(at("api"), base);
    expect(ids(r)).toEqual([
      "api",
      "vendor2_direct",
      "platform",
      "seats",
      "vendor1_direct",
      "vendor2_bedrock",
      "best_single",
    ]);
  });

  it("an unranked pattern is listed after the ranked ones, and the best single option comes last", () => {
    // At stage seats vendor2_bedrock has no rank: it follows platform (rank 5).
    expect(ids(compute(at("seats"), base))).toEqual([
      "seats",
      "vendor1_direct",
      "api",
      "vendor2_direct",
      "platform",
      "vendor2_bedrock",
      "best_single",
    ]);
  });

  it("changing a rank in the data changes the set with no code change", () => {
    const before = greys(compute(at("api"), base));
    const t = ranked("api", { api: 1, vendor1_direct: 2, platform: 3, seats: 4, vendor2_direct: 5, vendor2_bedrock: 6 });
    const after = greys(compute(at("api"), t));
    expect(after).toEqual(["api", "vendor1_direct", "platform", "seats"]);
    expect(after).not.toEqual(before);
  });

  it("another stage's ranks do not affect this stage", () => {
    const t = ranked("seats", { vendor2_bedrock: 1, seats: 2 });
    expect(greys(compute(at("api"), t))).toEqual(greys(compute(at("api"), base)));
  });

  it("ties in rank are broken by pattern_id, not by row order", () => {
    // platform and vendor2_direct tie at rank 2. In the file vendor2_direct comes first; by id, platform does.
    const t = ranked("api", { api: 1, vendor2_direct: 2, platform: 2, seats: 4, vendor1_direct: 5, vendor2_bedrock: 6 });
    expect(t.pattern_popularity.filter((r) => r.stage === "api").map((r) => r.pattern_id).indexOf("vendor2_direct")).toBeLessThan(
      t.pattern_popularity.filter((r) => r.stage === "api").map((r) => r.pattern_id).indexOf("platform"),
    );
    expect(greys(compute(at("api"), t))).toEqual(["api", "platform", "vendor2_direct", "seats"]);
  });

  it("a three-way tie is ordered by pattern_id", () => {
    const t = ranked("api", { api: 1, vendor2_direct: 3, platform: 3, seats: 3, vendor1_direct: 6, vendor2_bedrock: 7 });
    expect(greys(compute(at("api"), t))).toEqual(["api", "platform", "seats", "vendor2_direct"]);
  });
});

describe("unranked patterns are never a default grey (spec 7.4)", () => {
  it("vendor2_bedrock has no rank at stage seats, so it is not grey there but is still listed", () => {
    const r = compute(at("seats"), base);
    expect(base.pattern_popularity.some((p) => p.pattern_id === "vendor2_bedrock" && p.stage === "seats")).toBe(false);
    const bedrock = r.today_alternatives.find((a) => a.pattern_id === "vendor2_bedrock");
    expect(bedrock?.is_grey).toBe(false);
  });

  it("removing a pattern's rank takes it out of the greys, and the next by rank takes its slot", () => {
    const t = ranked("api", { api: 1, platform: 3, seats: 4, vendor1_direct: 5, vendor2_bedrock: 6 }); // vendor2_direct unranked
    const r = compute(at("api"), t);
    expect(greys(r)).toEqual(["api", "platform", "seats", "vendor1_direct"]);
    expect(r.today_alternatives.find((a) => a.pattern_id === "vendor2_direct")?.is_grey).toBe(false);
  });

  it("the best single option is never a default grey, at any stage", () => {
    for (const stage of STAGES) {
      expect(compute(at(stage), base).today_alternatives.find((a) => a.pattern_id === "best_single")?.is_grey).toBe(false);
    }
  });

  it("a pattern with no baseline rows for the visitor's workloads is absent, and the next by rank takes its slot (acceptance 8)", () => {
    const t = clone(base);
    t.baseline_providers = t.baseline_providers.filter(
      (r) => !(r.pattern_id === "vendor1_direct" && r.workload_id === "hardware_design"),
    );
    const r = compute(at("seats"), t);
    expect(ids(r)).not.toContain("vendor1_direct");
    expect(greys(r)).toEqual(["seats", "api", "vendor2_direct", "platform"]);
  });
});

describe("a typical buyer that cannot price the work fails loudly", () => {
  it("names the pattern and the workload with no baseline rows, instead of dropping the typical buyer", () => {
    const t = clone(base);
    t.baseline_providers = t.baseline_providers.filter((r) => !(r.pattern_id === "api" && r.workload_id === "hardware_design"));
    expect(() => compute(at("api"), t)).toThrow('baseline_providers.csv: no rows for pattern "api" and workload "hardware_design"');
  });
});

describe("at most four greys (spec 6.1 acceptance 1 and 9)", () => {
  it("is exactly four by default at every stage", () => {
    for (const stage of STAGES) expect(greys(compute(at(stage), base))).toHaveLength(4);
  });

  it("never exceeds four whichever option is the comparator, and the comparator and the typical buyer are both grey", () => {
    for (const stage of STAGES) {
      for (const comparator of ids(compute(at(stage), base))) {
        const r = compute(at(stage, { comparator }), base);
        expect(greys(r), `${stage} vs ${comparator}`).toHaveLength(4);
        expect(r.comparator).toBe(comparator);
        expect(r.today_alternatives.find((a) => a.pattern_id === comparator)?.is_grey).toBe(true);
        expect(r.today_alternatives.find((a) => a.is_typical)?.is_grey).toBe(true);
      }
    }
  });

  it("a comparator swap replaces the lowest-ranked grey that is not the typical buyer", () => {
    // Stage api greys are api, vendor2_direct, platform, seats: seats is the lowest-ranked non-typical.
    expect(greys(compute(at("api", { comparator: "vendor1_direct" }), base))).toEqual([
      "api",
      "vendor2_direct",
      "platform",
      "vendor1_direct",
    ]);
    expect(greys(compute(at("api", { comparator: "best_single" }), base))).toEqual([
      "api",
      "vendor2_direct",
      "platform",
      "best_single",
    ]);
  });

  it("a comparator that is already grey changes nothing about the set", () => {
    const set = (r: Results) => new Set(greys(r));
    expect(set(compute(at("api", { comparator: "platform" }), base))).toEqual(set(compute(at("api"), base)));
  });

  it("the comparator's Today is that pattern's total, and InfraVana is measured against it", () => {
    for (const comparator of ids(compute(s1, base))) {
      const r = compute({ ...s1, comparator }, base);
      const alt = r.today_alternatives.find((a) => a.pattern_id === comparator);
      expect(r.allocation.total_usd).toBe(alt?.total_usd);
    }
  });

  it("S1 against vendor 2 direct is 60,007.50 against 43,948.24 (spec 6.1 acceptance 4)", () => {
    const r = compute({ ...s1, comparator: "vendor2_direct" }, base);
    expect(r.allocation.total_usd).toBeCloseTo(60_007.5, 2);
    expect(infravanaSpend(r)).toBeCloseTo(43_948.24, 2);
  });

  it("an unknown comparator throws, naming it", () => {
    expect(() => compute({ ...s1, comparator: "no_such_pattern" }, base)).toThrow(/no_such_pattern/);
  });
});

describe("the S1 Today options table of spec 6.1, recomputed through compute()", () => {
  // [option, Today, InfraVana against it, saving percent], as the spec table lists them on placeholder data.
  const TABLE: [string, number, number, number][] = [
    ["api", 100_012.5, 70_440.09, 29.57],
    ["seats", 99_317.62, 70_440.09, 29.08],
    ["platform", 95_691.96, 70_440.09, 26.39],
    ["vendor1_direct", 20_002.5, 14_613.02, 26.94],
    ["vendor2_direct", 60_007.5, 43_948.24, 26.76],
    ["vendor2_bedrock", 58_287.29, 43_948.24, 24.6],
    ["best_single", 16_562.07, 14_613.02, 11.77],
  ];

  it.each(TABLE)("%s: Today %f, InfraVana %f, saving %f percent", (comparator, today, infravana, saving) => {
    const r = compute({ ...s1, comparator }, base);
    // Within a cent: 58,287.285 is the exact value of the Bedrock row.
    expect(Math.abs(r.allocation.total_usd - today)).toBeLessThan(0.006);
    expect(Math.abs(infravanaSpend(r) - infravana)).toBeLessThan(0.006);
    expect(r.headline.cost_savings_pct).toBeCloseTo(saving, 2);
  });

  it("every Today option's own total matches the table, whichever option is the comparator", () => {
    const r = compute(s1, base);
    for (const [id, today] of TABLE) {
      const alt = r.today_alternatives.find((a) => a.pattern_id === id);
      expect(Math.abs((alt?.total_usd ?? NaN) - today), id).toBeLessThan(0.006);
    }
  });

  it("InfraVana buys the same plan against the three stages: it keeps the comparator's tier shares (conservative routing, BD-8)", () => {
    const spends = ["api", "seats", "platform"].map((c) => infravanaSpend(compute({ ...s1, comparator: c }, base)));
    expect(new Set(spends.map((x) => x.toFixed(6))).size).toBe(1);
  });

  it("every Today option shows a quality figure inside the ranges the spec quotes, and meets the default floors", () => {
    const r = compute(s1, base);
    const quality = (id: string) => r.today_alternatives.find((a) => a.pattern_id === id);
    for (const a of r.today_alternatives) {
      expect(a.quality_score, a.pattern_id).not.toBeNull();
      expect(a.meets_floors, a.pattern_id).toBe(true);
    }
    // Spec 6.1: frontier_b scores 86.3 to 88.3, mid_a 80.9 to 82.0, frontier_a 90.9 to 92.4.
    expect(quality("vendor2_direct")?.quality_score).toBeGreaterThanOrEqual(86.3);
    expect(quality("vendor2_direct")?.quality_score).toBeLessThanOrEqual(88.3);
    expect(quality("vendor1_direct")?.quality_score).toBeGreaterThanOrEqual(80.9);
    expect(quality("vendor1_direct")?.quality_score).toBeLessThanOrEqual(82.0);
    expect(quality("api")?.quality_score).toBeGreaterThanOrEqual(90.9);
    expect(quality("api")?.quality_score).toBeLessThanOrEqual(92.4);
  });

  it("marks an option that misses a workload floor: at floor 85 the mid-tier vendor option does, the frontier ones do not", () => {
    const r = compute({ ...s1, quality_floor: 85 }, base);
    const meets = (id: string) => r.today_alternatives.find((a) => a.pattern_id === id)?.meets_floors;
    expect(meets("vendor1_direct")).toBe(false);
    expect(meets("best_single")).toBe(true); // the best single option is chosen to meet every floor
    expect(meets("api")).toBe(true);
  });
});

describe("the best single option (spec 6.1)", () => {
  const best = (r: Results) => r.today_alternatives.find((a) => a.pattern_id === "best_single");
  const modelOf = (detail: string | null): string => (detail ?? "").split(" ")[0] ?? "";
  const licenseOf = (t: Tables, modelId: string) => t.models.find((m) => m.model_id === modelId)?.license;

  it("is derived from the data: on S1 it is mid_a on EC2 US East at 16,562.07, as in spec 6.1", () => {
    const b = best(compute(s1, base));
    expect(b?.detail).toBe("mid_a via ec2 (useast)");
    expect(b?.total_usd).toBeCloseTo(16_562.07, 2);
    expect(b?.kind).toBe("best_single");
    expect(b?.is_typical).toBe(false);
  });

  it("InfraVana against it is 14,613.02 (spec 6.1)", () => {
    const r = compute({ ...s1, comparator: "best_single" }, base);
    expect(r.allocation.total_usd).toBeCloseTo(16_562.07, 2);
    expect(infravanaSpend(r)).toBeCloseTo(14_613.02, 2);
  });

  it("with software engineering as the only work it is mid_a on EC2 at 18,387.81, never an open-weight offer", () => {
    const b = best(compute({ ...s1, workload_mix: { software_design: 1 } }, base));
    expect(b?.detail).toBe("mid_a via ec2 (useast)");
    expect(b?.total_usd).toBeCloseTo(18_387.81, 2);
    expect(licenseOf(base, modelOf(b?.detail ?? null))).toBe("proprietary");
  });

  it("stays proprietary even when every open-weight offer is made far cheaper", () => {
    const t = clone(base);
    const open = new Set(t.models.filter((m) => m.license === "open").map((m) => m.model_id));
    for (const o of t.model_offers) {
      if (open.has(o.model_id) && o.usd_per_mtok_in !== null) {
        o.usd_per_mtok_in = 1e-6;
        o.usd_per_mtok_out = 1e-6;
      }
    }
    const b = best(compute({ ...s1, workload_mix: { software_design: 1 } }, t));
    expect(licenseOf(t, modelOf(b?.detail ?? null))).toBe("proprietary");
    expect(b?.detail).toBe("mid_a via ec2 (useast)");
  });

  it("follows the data: a proprietary offer made nearly free becomes the best single option", () => {
    const t = clone(base);
    const offer = t.model_offers.find((o) => o.offer_id === "frontier_a_direct_global");
    if (offer === undefined) throw new Error("fixture offer missing");
    offer.usd_per_mtok_in = 0.001;
    offer.usd_per_mtok_out = 0.001;
    const b = best(compute(s1, t));
    expect(b?.detail).toBe("frontier_a via direct (global)");
    expect(b?.total_usd).toBeLessThan(100);
  });

  it("follows the data the other way: making the usual winner dear moves it to another offer", () => {
    const t = clone(base);
    const offer = t.model_offers.find((o) => o.offer_id === "mid_a_ec2_useast");
    if (offer === undefined) throw new Error("fixture offer missing");
    offer.usd_per_mtok_in = 500;
    offer.usd_per_mtok_out = 500;
    const b = best(compute(s1, t));
    expect(b?.detail).not.toBe("mid_a via ec2 (useast)");
    expect(licenseOf(t, modelOf(b?.detail ?? null))).toBe("proprietary");
  });

  it("only offers a model whose score meets every workload's floor: raising the floor moves it up a tier", () => {
    const low = best(compute({ ...s1, quality_floor: 70 }, base));
    const high = best(compute({ ...s1, quality_floor: 85 }, base));
    // At floor 85 the mid-tier proprietary model (scores 80.9 to 82.0) no longer qualifies.
    expect(modelOf(high?.detail ?? null)).not.toBe("mid_a");
    expect(high?.total_usd).toBeGreaterThan(low?.total_usd ?? Infinity);
  });

  it("is absent when no single offer meets every floor, and compute does not throw", () => {
    const r = compute({ ...s1, quality_floor: 99 }, base);
    expect(best(r)).toBeUndefined();
    expect(ids(r)).not.toContain("best_single");
  });

  it("does not depend on the order of the rows in model_offers", () => {
    const t = clone(base);
    t.model_offers.reverse();
    const forward = best(compute(s1, base));
    const reversed = best(compute(s1, t));
    expect(reversed?.detail).toBe(forward?.detail);
    expect(reversed?.total_usd).toBe(forward?.total_usd);
  });

  it("with two offers at exactly the same price the choice does not depend on row order", () => {
    const t = clone(base);
    const original = t.model_offers.find((o) => o.offer_id === "mid_a_ec2_useast");
    if (original === undefined) throw new Error("fixture offer missing");
    t.model_offers.push({ ...original, offer_id: "mid_a_ec2_twin", region: "twin" });
    const u = clone(t);
    u.model_offers.reverse();
    expect(best(compute(s1, t))?.detail).toBe(best(compute(s1, u))?.detail);
  });
});
