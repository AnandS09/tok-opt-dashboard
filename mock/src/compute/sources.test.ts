import { beforeAll, describe, expect, it } from "vitest";
import type { Results, Scenario, Tables } from "../contract";
import { clone, loadFixtureScenario, loadFixtureTables, restoreFetch } from "../test/fixtures";
import { compute } from "./index";

/**
 * Spec 15.10: every series' provenance part carries the address of the data
 * row it is priced from, so the "Where these numbers come from" table can link
 * to it. The address is read from the rows' `source_url` columns; compute adds
 * no figure and no address of its own.
 */

let base: Tables;
let s1: Scenario;

beforeAll(async () => {
  base = await loadFixtureTables();
  s1 = await loadFixtureScenario("s1");
  restoreFetch();
});

const REAL = "https://prices.example.test/real";
const at = (stage: Scenario["stage_today"]): Scenario => ({ ...s1, stage_today: stage });

/** `tables` with every address column emptied, as a file with no addresses would load. */
function withoutAddresses(tables: Tables): Tables {
  const t = clone(tables);
  for (const o of t.model_offers) o.source_url = "";
  for (const p of t.buying_patterns) p.source_url = "";
  for (const h of t.hardware) h.source_url = null;
  for (const p of t.seat_plans) p.source_url = null;
  return t;
}

/** The results with every `source_url` key removed, to compare two runs on their figures alone. */
function figuresOf(results: Results): unknown {
  return JSON.parse(JSON.stringify(results, (key, value) => (key === "source_url" ? undefined : value)));
}

describe("the comparator's segments", () => {
  it("carry the address of the offer row they are priced from (stage api)", () => {
    const r = compute(at("api"), base);
    const rowsOf = new Set(base.model_offers.filter((o) => o.channel === "direct").map((o) => o.source_url));
    const direct = r.allocation.today.find((s) => s.label === "direct");
    expect(direct?.source_url).toBeTruthy();
    expect(rowsOf.has(direct?.source_url ?? "")).toBe(true);
  });

  it("carry the seat plan's own address for the plan segment and the offer's for the overage channel (stage seats)", () => {
    const t = clone(base);
    for (const p of t.seat_plans) p.source_url = `${REAL}/${p.plan_id}`;
    const r = compute(at("seats"), t);
    const plan = r.allocation.today.find((s) => t.seat_plans.some((p) => p.vendor === s.label));
    expect(plan?.source_url).toMatch(/^https:\/\/prices\.example\.test\/real\/seat_/);
    const overage = r.allocation.today.find((s) => s.kind === "provider" && s !== plan);
    expect(overage?.source_url).toContain("placeholder-invented-data/offers/");
  });

  it("follow a changed address with no code change, and carry no key when the row holds none", () => {
    const t = clone(base);
    for (const o of t.model_offers) o.source_url = REAL;
    const withReal = compute(at("api"), t);
    expect(withReal.allocation.today.every((s) => s.source_url === REAL)).toBe(true);
    const bare = compute(at("api"), withoutAddresses(base));
    for (const s of bare.allocation.today) expect("source_url" in s).toBe(false);
  });
});

describe("InfraVana's segments and savings", () => {
  it("a self-hosted segment carries the hardware row's address", () => {
    const t = clone(base);
    for (const h of t.hardware) h.source_url = `${REAL}/${h.hw_id}`;
    const r = compute(s1, t);
    const hardware = r.allocation.infravana.filter((s) => s.kind === "hardware");
    expect(hardware.length).toBeGreaterThan(0);
    for (const s of hardware) expect(s.source_url).toBe(`${REAL}/${s.label}`);
  });

  it("the two savings cite the rows that carry most of them", () => {
    const r = compute(s1, base);
    const saved = r.allocation.infravana.filter((s) => s.kind === "savings" && s.usd > 0);
    expect(saved.length).toBeGreaterThan(0);
    for (const s of saved) expect(s.source_url).toContain("placeholder-invented-data/");
    const bare = compute(s1, withoutAddresses(base));
    for (const s of bare.allocation.infravana) expect("source_url" in s).toBe(false);
  });

  it("a provider segment carries an offer's address", () => {
    const r = compute(s1, base);
    const offers = new Set(base.model_offers.map((o) => o.source_url));
    const providers = r.allocation.infravana.filter((s) => s.kind === "provider");
    expect(providers.length).toBeGreaterThan(0);
    for (const s of providers) expect(offers.has(s.source_url ?? "")).toBe(true);
  });
});

describe("the other Today options", () => {
  it("each carries its pattern's address from buying_patterns.csv", () => {
    const r = compute(s1, base);
    for (const a of r.today_alternatives) {
      const pattern = base.buying_patterns.find((p) => p.pattern_id === a.pattern_id);
      expect(a.source_url).toBe(pattern?.source_url);
    }
  });
});

describe("addresses add no figure", () => {
  it.each(["seats", "api", "platform"] as const)("stage %s: the figures equal those of the same tables with no addresses", (stage) => {
    expect(figuresOf(compute(at(stage), base))).toEqual(figuresOf(compute(at(stage), withoutAddresses(base))));
  });
});
