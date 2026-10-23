import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { tokensBoughtCaption } from "../charts/c5TokensBought";
import { HeadlineStrip } from "../components/HeadlineStrip";
import { TradeoffControls } from "../components/TradeoffControls";
import { LATENCY_LABEL } from "../components/format";
import { compute, g1Headline } from "../compute";
import type { GoalView, Results, Scenario, Tables } from "../contract";
import { fmtMultiple } from "../shared/format";
import { loadFixtureScenario, loadFixtureTables, restoreFetch } from "../test/fixtures";
import { computeForView, withView } from "./stage";
import {
  clampStep,
  computeTradeoff,
  floorsText,
  tradeoffFigures,
  tradeoffLevels,
  tradeoffView,
  type TradeoffLevels,
} from "./tradeoff";

let tables: Tables;
let s1: Scenario;
let s2: Scenario;
let levels: TradeoffLevels;

beforeAll(async () => {
  tables = await loadFixtureTables();
  s1 = await loadFixtureScenario("s1");
  s2 = await loadFixtureScenario("s2");
  restoreFetch();
  levels = tradeoffLevels(s1, tables, { comparator: null });
});

const view = (goal: "G1" | "G2" | "G3" | "G4", qualityStep: number, speedStep: number) => ({
  goal,
  comparator: null,
  qualityStep,
  speedStep,
});

/** G4's two calls at the given steps, as the page makes them. */
function g4(scenario: Scenario, qualityStep: number, speedStep: number) {
  return computeTradeoff(withView(scenario, view("G4", qualityStep, speedStep), tables), tables);
}

/** The hero as the page draws it in G4, as markup. */
function heroMarkup(scenario: Scenario, qualityStep: number, speedStep: number): string {
  const calls = g4(scenario, qualityStep, speedStep);
  const traded = calls.traded as Results;
  const goalView: GoalView = {
    goal: "G4",
    solve: null,
    stale: false,
    error: null,
    tradeoff: tradeoffView(calls, tradeoffLevels(scenario, tables, { comparator: null }), { qualityStep, speedStep }),
  };
  return renderToStaticMarkup(
    createElement(HeadlineStrip, {
      goal: "G4",
      results: traded,
      scenario: withView(scenario, view("G4", qualityStep, speedStep), tables),
      goalView,
      comparator: { value: traded.comparator, onChange: () => {} },
      onSteps: () => {},
      contactUrl: "#contact",
    }),
  );
}

/** The text of the two side blocks of a hero's markup: [Today's, InfraVana's]. */
function sidesOf(markup: string): string[] {
  const text = (m: string) => m.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return [...markup.matchAll(/<div class="hero__side[^"]*">(.*?)<\/div>/g)].map((m) => text(m[1]));
}

describe("the positions of the two G4 controls", () => {
  it("start at the visitor's own setting and follow the data", () => {
    expect(levels.quality.length).toBeGreaterThan(1);
    expect(levels.quality[0].floors).toEqual(compute(s1, tables).quality_floor_by_workload);
    expect(levels.speed.map((l) => l.latency_class)).toEqual(["interactive", "standard", "batch"]);
    expect(levels.speedReason).toBeNull();
    const floors = levels.quality.map((l) => Math.min(...Object.values(l.floors)));
    expect([...floors].sort((a, b) => b - a)).toEqual(floors);
    expect(new Set(floors).size).toBe(floors.length);
  });

  it("hold a step past the last position to the last one", () => {
    expect(clampStep(99, levels.quality)).toBe(levels.quality.length - 1);
    expect(clampStep(-3, levels.quality)).toBe(0);
    expect(clampStep(1, levels.speed)).toBe(1);
  });

  it("offer the speed control no step past 0, and give the reason, when no proprietary offer has speed data", () => {
    const noSpeed: Tables = {
      ...tables,
      model_offers: tables.model_offers.map((o) => ({ ...o, tok_s_per_user: null, p95_ttft_ms: null })),
    };
    const l = tradeoffLevels(s1, noSpeed, { comparator: null });
    expect(l.speed).toHaveLength(1);
    expect(l.speedReason).toMatch(/no proprietary offer has speed data/i);
    const view = tradeoffView(computeTradeoff(withView(s1, { goal: "G4", comparator: null, qualityStep: 1, speedStep: 2 }, noSpeed), noSpeed), l, {
      qualityStep: 1,
      speedStep: 0,
    });
    expect(view.invented).toBe(false);
    // The control is drawn disabled and says why; with speed data it is enabled.
    const drawn = (v: typeof view) => renderToStaticMarkup(createElement(TradeoffControls, { view: v, onSteps: () => {} }));
    const fieldsets = [...drawn(view).matchAll(/<fieldset[^>]*>/g)].map((m) => m[0]);
    expect(fieldsets).toHaveLength(2);
    expect(fieldsets[0]).not.toContain("disabled");
    expect(fieldsets[1]).toContain("disabled");
    expect(drawn(view)).toContain(l.speedReason as string);
    const withSpeed = tradeoffView(g4(s1, 0, 0), levels, { qualityStep: 0, speedStep: 0 });
    expect([...drawn(withSpeed).matchAll(/<fieldset[^>]*>/g)].some((m) => m[0].includes("disabled"))).toBe(false);
  });
});

describe("spec 6.2 acceptance (1): while G4 is active its controls recompute every chart", () => {
  it("a step down changes what C1, C3 and C5 read, and only on the InfraVana side", () => {
    const own = g4(s1, 0, 0).traded as Results;
    for (const [q, s] of [
      [1, 0],
      [0, 1],
      [2, 2],
    ]) {
      const traded = g4(s1, q, s).traded as Results;
      expect(traded.allocation.infravana).not.toEqual(own.allocation.infravana);
      expect(traded.cost_per_mtok.by_model_class).not.toEqual(own.cost_per_mtok.by_model_class);
      expect(traded.tokens_bought.infravana_tokens).toBeGreaterThan(own.tokens_bought.infravana_tokens);
      expect(traded.allocation.today).toEqual(own.allocation.today);
    }
  });

  it("the page's results are the trade-off call, not the untraded one", () => {
    const calls = g4(s1, 1, 1);
    expect(calls.traded).not.toBeNull();
    expect(calls.traded).not.toEqual(calls.untraded);
  });
});

describe("spec 6.2 acceptance (4): after leaving G4, G1's headline and C1 equal their earlier values", () => {
  it("a step left in the view changes nothing in G1, G2 or G3", () => {
    const before = computeForView(withView(s1, view("G1", 0, 0), tables), tables);
    for (const goal of ["G1", "G2", "G3"] as const) {
      const scenario = withView(s1, view(goal, 3, 2), tables);
      expect(scenario.tradeoff).toBeUndefined();
      expect(scenario.goal).toBe(goal === "G1" ? undefined : goal);
      const after = computeForView(scenario, tables);
      expect(after.headline).toEqual(before.headline);
      expect(after.allocation).toEqual(before.allocation);
    }
  });

  it("G4 itself leaves the untraded call equal to G1's", () => {
    const g1 = computeForView(withView(s1, view("G1", 0, 0), tables), tables);
    expect(g4(s1, 3, 2).untraded).toEqual(g1);
  });
});

describe("spec 6.2 acceptance (5): C5's multiple label equals the tab's multiple, G4 linear at the relaxed plan", () => {
  it("the caption states the relaxed plan's linear multiple and says it is at the trade-off you chose", () => {
    for (const scenario of [s1, s2]) {
      const calls = g4(scenario, 2, 1);
      const traded = calls.traded as Results;
      const goalView: GoalView = {
        goal: "G4",
        solve: null,
        stale: false,
        error: null,
        tradeoff: tradeoffView(calls, tradeoffLevels(scenario, tables, { comparator: null }), { qualityStep: 2, speedStep: 1 }),
      };
      const caption = tokensBoughtCaption(traded, goalView);
      expect(caption).toContain(`${fmtMultiple(traded.headline.tokens_multiple)} as many`);
      expect(caption).toContain("at the trade-off you chose");
      // Not the untraded multiple.
      expect(fmtMultiple(traded.headline.tokens_multiple)).not.toBe(fmtMultiple(calls.untraded.headline.tokens_multiple));
    }
  });

  it("G1's caption has no trade-off label", () => {
    const own = compute(s1, tables);
    expect(tokensBoughtCaption(own, { goal: "G1", solve: null, stale: false, error: null })).not.toContain("trade-off");
  });
});

describe("spec 6.2 acceptance (6): the G4 hero shows both sides' floors and speeds, InfraVana's from infravana_side", () => {
  it("states Today's floors and speed and, apart from them, the InfraVana side's", () => {
    for (const [q, s] of [
      [0, 0],
      [1, 0],
      [0, 2],
      [2, 1],
    ]) {
      const calls = g4(s1, q, s);
      const side = (calls.traded as Results).infravana_side;
      const [today, infravana] = sidesOf(heroMarkup(s1, q, s));
      expect(infravana).toContain(`Quality at least ${floorsText(side.quality_floor_by_workload)}`);
      expect(infravana).toContain(`answers ${LATENCY_LABEL[side.latency_class]}`);
      expect(today).toContain(`Quality at least ${floorsText(calls.untraded.quality_floor_by_workload)}`);
      expect(today).toContain(`answers ${LATENCY_LABEL[s1.latency_class]}`);
    }
  });

  it("shows the two sides different floors after a quality step and different speeds after a speed step", () => {
    const [todayQ, infraQ] = sidesOf(heroMarkup(s1, 1, 0));
    expect(infraQ).not.toBe(todayQ);
    const [todayS, infraS] = sidesOf(heroMarkup(s1, 0, 1));
    expect(infraS).not.toBe(todayS);
  });

  it("states two numbers: the G1 saving and the extra the give-up buys", () => {
    const calls = g4(s1, 1, 1);
    const figures = tradeoffFigures(calls.untraded, calls.traded as Results);
    expect(figures.ownSaving).toBe(g1Headline(compute(s1, tables)).saved_usd);
    expect(figures.extraSaving).toBeGreaterThan(0);
    expect(figures.extraSaving).toBeCloseTo(g1Headline(calls.traded as Results).saved_usd - figures.ownSaving, 6);
  });

  it("marks the G4 hero with the invented-data source line and lists the invented rows as modelled in the sources table (spec 9 acceptance 2)", () => {
    const markup = heroMarkup(s1, 1, 1);
    expect(markup).toContain("Source:");
    expect(markup).toContain("invented placeholder data");
    expect(markup).toContain("Where these numbers come from");
    expect(markup).toContain("Invented speeds and batch or flex prices");
    expect(markup).toContain("Modelled");
    expect(markup).not.toContain("prov-badge");
  });
});

describe("spec 6.2 acceptance (8): infravana_side and Today", () => {
  it("with no trade-off equals the Today-side floors and latency class", () => {
    for (const scenario of [s1, s2]) {
      const r = compute(scenario, tables);
      expect(r.infravana_side).toEqual({
        quality_floor_by_workload: r.quality_floor_by_workload,
        latency_class: scenario.latency_class,
      });
      const zero = g4(scenario, 0, 0).traded as Results;
      expect(zero.infravana_side).toEqual(r.infravana_side);
    }
  });

  it("with a quality step only infravana_side's floors change, and Today equals the untraded call", () => {
    const calls = g4(s1, 2, 0);
    const traded = calls.traded as Results;
    expect(traded.infravana_side.latency_class).toBe(calls.untraded.infravana_side.latency_class);
    expect(traded.infravana_side.quality_floor_by_workload).not.toEqual(calls.untraded.infravana_side.quality_floor_by_workload);
    expect(traded.quality_floor_by_workload).toEqual(calls.untraded.quality_floor_by_workload);
    expect(traded.allocation.today).toEqual(calls.untraded.allocation.today);
    expect(traded.allocation.total_usd).toBe(calls.untraded.allocation.total_usd);
    expect(traded.today_alternatives).toEqual(calls.untraded.today_alternatives);
    expect(traded.tokens_bought.today_tokens).toBe(calls.untraded.tokens_bought.today_tokens);
  });
});
