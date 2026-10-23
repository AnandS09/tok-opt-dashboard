/**
 * Spec 15.6 (R-6, the goal tab bar) and 15.7 (R-7, the comparator in the
 * headline): what the tabs show, what the hero says beside them, the
 * placeholder G3, and the one list control in the headline. The tests draw the
 * real `GoalSlot` (tabs, panel and picker) to markup, from the real compute
 * and solve functions on the fixture data. The layout items (equal widths, a
 * 3px edge, no line under the chosen tab, the phone row) are measured in a
 * real browser by `docs/build-v04/final/drive.mjs`.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { GoalSlot } from "../components/StageSlots";
import { compute, goalAvailability, solveAtBudget } from "../compute";
import type { GoalId, GoalView, Results, Scenario, Tables } from "../contract";
import { fmtPct, fmtUsdSig } from "../shared/format";
import { FITS_WITH_US_ONLY, NEEDS_BUDGET } from "../shared/goalNotice";
import { beginIntake, companyOf, setBudget, setCustomers, setSpeed, setUsers } from "./intake";
import { loadFixtureScenario, loadFixtureTables, restoreFetch } from "../test/fixtures";
import {
  computedFigures,
  G3_PLACEHOLDER,
  tabFigures,
  tabPlan,
  tabSolveAxes,
  g1FigureText,
  g3PlaceholderReason,
  g4FigureText,
  GOAL_ORDER,
  GOAL_TABS,
  PLACEHOLDER_TAG,
  solvedFigureText,
  tabForKey,
  timesText,
} from "./goal";
import { DEFAULT_FIELDS, type HashFields } from "./hash";
import { computeForView, withEffectiveComparator, withView, type StageSlotContext } from "./stage";
import { clampStep, computeTradeoff, tradeoffLevels, tradeoffView } from "./tradeoff";

let tables: Tables;
const scenarios = {} as Record<"s1" | "s2" | "hardware_heavy", Scenario>;
/** S1 with only customer-facing work: there are no people to scale, so G3 shows its placeholder. */
let customerOnly: Scenario;

beforeAll(async () => {
  tables = await loadFixtureTables();
  for (const id of ["s1", "s2", "hardware_heavy"] as const) scenarios[id] = await loadFixtureScenario(id);
  restoreFetch();
  customerOnly = {
    ...scenarios.s1,
    baseline: { ...scenarios.s1.baseline, customers: 20_000 },
    workload_mix: { customer_service: 0.5, product_ai: 0.5 },
  };
});

const NAMES = ["s1", "s2", "hardware_heavy"] as const;

/** What the stage hands the goal slot, as the page builds it for `goal`. */
function contextFor(base: Scenario, goal: GoalId, patch: Partial<HashFields> = {}): StageSlotContext {
  const view: HashFields = { ...DEFAULT_FIELDS, goal, ...patch };
  const scenario = withEffectiveComparator(withView(base, view, tables), tables);
  let results: Results;
  let goalView: GoalView = { goal, solve: null, stale: false, error: null };
  if (goal === "G4") {
    const calls = computeTradeoff(scenario, tables);
    results = calls.traded ?? calls.untraded;
    const levels = tradeoffLevels(base, tables, { comparator: view.comparator });
    goalView = {
      ...goalView,
      tradeoff: tradeoffView(calls, levels, { qualityStep: view.qualityStep, speedStep: view.speedStep }),
    };
  } else {
    results = computeForView(scenario, tables);
    const reason = g3PlaceholderReason(scenario, tables);
    if (goal === "G3" && reason !== null) goalView = { ...goalView, error: reason };
    else if (goal === "G2" || goal === "G3") {
      goalView = { ...goalView, solve: solveAtBudget(scenario, tables, goal === "G2" ? "intensity" : "users") };
    }
  }
  return {
    view,
    scenario,
    tables,
    results,
    goalView,
    setGoal: () => {},
    setComparator: () => {},
    setSteps: () => {},
    setC10: () => {},
  };
}

function slotMarkup(base: Scenario, goal: GoalId, patch: Partial<HashFields> = {}): string {
  return renderToStaticMarkup(createElement(GoalSlot, { ctx: contextFor(base, goal, patch), contactUrl: "#contact" }));
}

const plain = (markup: string) => markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** The hero panel's markup out of the slot's. */
function heroOf(markup: string): string {
  const start = markup.indexOf('<section class="hero card"');
  return markup.slice(start, markup.indexOf("</section>", start));
}

/** The text a tab shows under its name, by goal. */
function figureOf(markup: string, goal: GoalId): string {
  const tab = new RegExp(`<button id="goal-tab-${goal}".*?</button>`).exec(markup)?.[0] ?? "";
  const figure = /<span class="goal-tabs__figure"[^>]*>(.*?)<\/span>(?:<\/span>)?<\/button>/.exec(tab)?.[1] ?? "";
  return plain(figure);
}

describe("R-6 acceptance (1) and (5): four equal tabs, all enabled", () => {
  it("draws one tablist of four tabs, none disabled, one selected and in the tab order", () => {
    for (const id of NAMES) {
      for (const goal of GOAL_ORDER) {
        const markup = slotMarkup(scenarios[id], goal);
        expect([...markup.matchAll(/role="tab"/g)]).toHaveLength(4);
        expect(markup).toContain('role="tablist"');
        expect(markup).not.toMatch(/\sdisabled(=|\s|>)/);
        expect(markup).not.toContain("aria-disabled");
        const tabs = [...markup.matchAll(/<button id="goal-tab-(G\d)"[^>]*>/g)];
        expect(tabs.map((m) => m[1])).toEqual([...GOAL_ORDER]);
        expect(tabs.filter((m) => m[0].includes('aria-selected="true"')).map((m) => m[1])).toEqual([goal]);
        expect(tabs.filter((m) => m[0].includes('tabindex="0"')).map((m) => m[1])).toEqual([goal]);
      }
    }
  });

  it("gives every tab its long name, its phone name and a figure", () => {
    const markup = slotMarkup(scenarios.s1, "G1");
    for (const goal of GOAL_ORDER) {
      const tab = new RegExp(`<button id="goal-tab-${goal}".*?</button>`).exec(markup)?.[0] ?? "";
      expect(tab).toContain(`<span class="goal-tabs__long">${GOAL_TABS[goal].label}</span>`);
      expect(tab).toContain(`<span class="goal-tabs__short">${GOAL_TABS[goal].short}</span>`);
      expect(tab).toContain('class="goal-tabs__figure"');
    }
    // The short names are the spec's (15.6), not derived.
    expect(GOAL_ORDER.map((g) => GOAL_TABS[g].short)).toEqual(["Less money", "More AI", "More people", "Trade-off"]);
  });

  it("puts the kicker over the bar", () => {
    expect(plain(slotMarkup(scenarios.s1, "G1"))).toMatch(/^What matters most to you\?/);
  });

  it("moves between tabs with the arrows, Home and End, wrapping and never skipping a tab", () => {
    expect(tabForKey("G1", "ArrowRight")).toBe("G2");
    expect(tabForKey("G2", "ArrowRight")).toBe("G3");
    expect(tabForKey("G3", "ArrowRight")).toBe("G4");
    expect(tabForKey("G4", "ArrowRight")).toBe("G1");
    expect(tabForKey("G1", "ArrowLeft")).toBe("G4");
    expect(tabForKey("G3", "ArrowLeft")).toBe("G2");
    expect(tabForKey("G3", "Home")).toBe("G1");
    expect(tabForKey("G2", "End")).toBe("G4");
    expect(tabForKey("G2", "ArrowDown")).toBeNull();
    expect(tabForKey("G2", "a")).toBeNull();
  });
});

describe("R-6 acceptance (7): each tab's figure equals the headline figure of its goal", () => {
  it("G1: the tab says the percent the hero says", () => {
    for (const id of NAMES) {
      const results = compute(scenarios[id], tables);
      const saved = Math.round(results.headline.cost_savings_pct);
      const markup = slotMarkup(scenarios[id], "G1");
      const tab = figureOf(markup, "G1");
      expect(tab, id).toBe(computedFigures(scenarios[id], tables).g1);
      if (saved > 0) {
        expect(tab).toBe(`${saved}% lower cost`);
        expect(plain(heroOf(markup))).toContain(`${saved}% lower cost`);
      } else {
        expect(tab).toBe("About the same cost");
        expect(plain(heroOf(markup))).toContain("About the same cost");
      }
    }
  });

  it("G2 and G3: the tab says the multiple the hero's headline says", () => {
    for (const id of NAMES) {
      for (const goal of ["G2", "G3"] as const) {
        const scenario = scenarios[id];
        const solve = solveAtBudget(scenario, tables, goal === "G2" ? "intensity" : "users");
        const word = goal === "G2" ? "AI work" : "people";
        const expected = `${timesText(solve.multiple)} the ${word}`;
        expect(solvedFigureText(goal, scenario, solve), `${id} ${goal}`).toBe(expected);
        // The hero's figure, drawn from the same solve, begins with the tab's text.
        const hero = plain(heroOf(slotMarkup(scenario, goal)));
        expect(hero, `${id} ${goal}`).toContain(`${expected} for your budget`);
      }
    }
  });

  it("G4: the tab says the extra saving the hero states at the largest give-up", () => {
    for (const id of NAMES) {
      const scenario = scenarios[id];
      const levels = tradeoffLevels(scenario, tables, { comparator: null });
      const steps = { qualityStep: levels.quality.length - 1, speedStep: levels.speed.length - 1 };
      const tab = figureOf(slotMarkup(scenario, "G4"), "G4");
      expect(tab, id).toBe(computedFigures(scenario, tables).g4);
      const hero = heroOf(slotMarkup(scenario, "G4", steps));
      const stated = /<strong>([^<]*) more<\/strong>/.exec(hero)?.[1];
      if (stated !== undefined) expect(tab, id).toBe(`Up to ${stated} more saved`);
      else expect(tab, id).toBe("No extra saving");
    }
  });

  it("G4's figure is the saving of both controls at their last step, taken from compute()", () => {
    const scenario = scenarios.s1;
    const levels = tradeoffLevels(scenario, tables, { comparator: null });
    const steps = {
      qualityStep: clampStep(1000, levels.quality),
      speedStep: clampStep(1000, levels.speed),
    };
    expect(steps.qualityStep).toBeGreaterThan(0);
    expect(steps.speedStep).toBeGreaterThan(0);
    const own = compute(scenario, tables);
    const traded = computeForView(withView(scenario, { ...DEFAULT_FIELDS, goal: "G4", ...steps }, tables), tables);
    const sum = (r: Results) => r.allocation.infravana.reduce((t, s) => (s.kind === "savings" ? t + s.usd : t), 0);
    const extra = sum(traded) - sum(own);
    expect(extra).toBeGreaterThan(0);
    expect(computedFigures(scenario, tables).g4).toBe(g4FigureText(extra));
    expect(g4FigureText(extra)).toBe(`Up to ${fmtUsdSig(extra)} more saved`);
  });

  it("a tab's figure does not depend on which tab is chosen or on the G4 steps", () => {
    const base = scenarios.s1;
    const g4 = withView(base, { ...DEFAULT_FIELDS, goal: "G4", qualityStep: 2, speedStep: 1 }, tables);
    expect(computedFigures(g4, tables)).toEqual(computedFigures(base, tables));
    const g2 = withView(base, { ...DEFAULT_FIELDS, goal: "G2" }, tables);
    expect(computedFigures(g2, tables)).toEqual(computedFigures(base, tables));
    const figures = new Set(GOAL_ORDER.map((g) => figureOf(slotMarkup(base, g), "G1")));
    expect(figures.size).toBe(1);
  });

  it("states a percent with the shared percent formatter and a multiple in words", () => {
    expect(g1FigureText(46.6)).toBe(`${fmtPct(46.6)} lower cost`);
    expect(g1FigureText(0.2)).toBe("About the same cost");
    expect(timesText(1.84)).toBe("1.8 times");
    expect(timesText(12.4)).toBe("12 times");
    expect(g4FigureText(0)).toBe("No extra saving");
  });

  it("shows a short form of the sentence that replaces a G2 or G3 figure", () => {
    const solve = solveAtBudget(scenarios.s1, tables, "users");
    expect(solvedFigureText("G3", scenarios.s1, { ...solve, capped_at_users_max: true })).toBe("More than 10,000 people");
    expect(solvedFigureText("G2", scenarios.s1, { ...solve, axis: "intensity", today_scale: 11 })).toBe("Budget over ten times the work");
    expect(solvedFigureText("G2", scenarios.s1, { ...solve, axis: "intensity", today_scale: 0 })).toBe(FITS_WITH_US_ONLY);
    expect(solvedFigureText("G2", scenarios.s1, { ...solve, axis: "intensity", today_scale: 0, infravana_scale: 0 })).toBe(NEEDS_BUDGET);
  });
});

describe("G3 when no head count fits the comparator's budget (the review's answers: software company, 120 people, 200,000 customers, $150K)", () => {
  let review: Scenario;
  beforeAll(() => {
    let s = beginIntake(scenarios.s1, companyOf("software"), tables);
    s = setSpeed(setBudget(setCustomers(setUsers(s, 120), 200_000), 150_000), "standard");
    review = s;
  });

  it("is a result that says what is true and what to change, with the hero's lead, figure and both sides", () => {
    const solve = solveAtBudget(review, tables, "users");
    expect(solve.today_scale).toBe(0);
    expect(solve.infravana_scale).toBeGreaterThan(0);
    const markup = slotMarkup(review, "G3");
    const hero = heroOf(markup);
    // The tab and the hero's figure line say the same words, and neither is a bare "no".
    expect(solvedFigureText("G3", review, solve)).toBe(FITS_WITH_US_ONLY);
    expect(hero).toContain('<p class="hero__lead">');
    expect(/<p class="hero__figure[^"]*"[^>]*>(.*?)<\/p>/.exec(hero)?.[1]).toContain(FITS_WITH_US_ONLY);
    // InfraVana's side has a figure (66 people of the 120 asked about); the comparator's side says none fits.
    const people = Math.round(solve.infravana_scale * review.baseline.users);
    expect(plain(hero)).toContain(`${people} people with InfraVana`);
    expect(plain(hero)).toMatch(/No team size fits with .*Pay-as-you-go API/);
    // The reason is the customers' work, not "fixed fees", and the old dead-end wording is gone from the page.
    expect(plain(hero).replace(/&#x27;/g, "'")).toContain("the rest of this work (your customers' work and fixed fees) already costs more than your budget");
    expect(markup).not.toContain("No volume fits");
    expect(markup).not.toContain("below the fixed fees");
  });

  it("says Needs a larger budget when neither side fits", () => {
    const solve = { ...solveAtBudget(review, tables, "users"), infravana_scale: 0 };
    expect(solvedFigureText("G3", review, solve)).toBe(NEEDS_BUDGET);
  });
});

describe("R-6 acceptance (7) across scenarios and comparators: every tab's figure is its hero's figure", () => {
  /** The four tab figures as the page makes them, with the solves run to completion. */
  function tabs(base: Scenario, goal: GoalId, patch: Partial<HashFields>) {
    const ctx = contextFor(base, goal, patch);
    const plan = tabPlan(ctx.scenario, tables);
    const axes = tabSolveAxes(plan.placeholder);
    const finished = (axis: "intensity" | "users" | null) => ({ solve: axis === null ? null : solveAtBudget(plan.own, tables, axis), stale: false, error: null });
    return tabFigures(plan.own, plan.computed, plan.placeholder, finished(axes.intensity), finished(axes.users));
  }

  /** Two comparators other than the default, so the figures cannot match by coincidence of the default. */
  const otherComparators = (base: Scenario): string[] => {
    const r = contextFor(base, "G1").results;
    return r.today_alternatives.filter((a) => a.pattern_id !== r.comparator).slice(0, 2).map((a) => a.pattern_id);
  };

  const bases = (): [string, Scenario][] => [
    ["s1", scenarios.s1],
    ["s2", scenarios.s2],
    ["hardware_heavy", scenarios.hardware_heavy],
    ["review answers", (() => {
      let s = beginIntake(scenarios.s1, companyOf("software"), tables);
      s = setSpeed(setBudget(setCustomers(setUsers(s, 120), 200_000), 150_000), "standard");
      return s;
    })()],
  ];

  it("G1, G2, G3 and G4 equal their heroes for every scenario, the default comparator and two others", () => {
    for (const [name, base] of bases()) {
      for (const comparator of [null, ...otherComparators(base)]) {
        const patch: Partial<HashFields> = comparator === null ? {} : { comparator };
        const label = `${name} ${comparator ?? "default"}`;
        const figs = tabs(base, "G1", patch);
        // G1: the percent (or "about the same") is in the hero's text.
        expect(plain(heroOf(slotMarkup(base, "G1", patch))), `${label} G1`).toContain(figs.G1.text);
        // G2 and G3: the multiple (or the sentence that replaces it) is the hero's figure line.
        for (const goal of ["G2", "G3"] as const) {
          const hero = heroOf(slotMarkup(base, goal, patch));
          const figure = plain(/<p class="hero__figure[^"]*"[^>]*>(.*?)<\/p>/.exec(hero)?.[1] ?? "");
          const tab = figs[goal].text;
          expect(figure === tab || figure === `${tab} for your budget`, `${label} ${goal}: tab "${tab}", hero "${figure}"`).toBe(true);
        }
        // G4: the extra saving at the largest give-up.
        const levels = tradeoffLevels(base, tables, { comparator: comparator ?? null });
        const steps = { qualityStep: levels.quality.length - 1, speedStep: levels.speed.length - 1 };
        const hero4 = heroOf(slotMarkup(base, "G4", { ...patch, ...steps }));
        const stated = /<strong>([^<]*) more<\/strong>/.exec(hero4)?.[1];
        expect(figs.G4.text, `${label} G4`).toBe(stated !== undefined ? `Up to ${stated} more saved` : "No extra saving");
      }
    }
  });

  it("G2's tab reads the intensity solve and G3's the users solve, so the two differ where the solves do", () => {
    // On the review's answers the two solves differ (G2 1.9 times, G3 has no head count for the comparator).
    const review = bases()[3][1];
    const figs = tabs(review, "G1", {});
    expect(figs.G2.text).toMatch(/times the AI work$/);
    expect(figs.G3.text).toBe(FITS_WITH_US_ONLY);
    // Handing each tab the other's solve changes its figure, so a tab that reads the wrong axis cannot pass the test above.
    const plan = tabPlan(contextFor(review, "G1").scenario, tables);
    const intensity = { solve: solveAtBudget(plan.own, tables, "intensity"), stale: false, error: null };
    const users = { solve: solveAtBudget(plan.own, tables, "users"), stale: false, error: null };
    expect(tabFigures(plan.own, plan.computed, null, users, intensity).G2.text).not.toBe(figs.G2.text);
    expect(tabFigures(plan.own, plan.computed, null, users, intensity).G3.text).not.toBe(figs.G3.text);
  });

  it("solves G2 on intensity and G3 on users up front, and G3 not at all behind the placeholder", () => {
    expect(tabSolveAxes(null)).toEqual({ intensity: "intensity", users: "users" });
    expect(tabSolveAxes("no team work")).toEqual({ intensity: "intensity", users: null });
  });
});

describe("R-6 acceptance (6): G3 can always be chosen, and shows a labelled placeholder with no team work", () => {
  it("finds no team work in a customer-only mix, and team work in the three example scenarios", () => {
    expect(g3PlaceholderReason(customerOnly, tables)).toBe(goalAvailability(customerOnly, tables).G3);
    expect(g3PlaceholderReason(customerOnly, tables)).not.toBeNull();
    for (const id of NAMES) expect(g3PlaceholderReason(scenarios[id], tables), id).toBeNull();
  });

  it("labels the tab's figure and the hero's figure as a placeholder", () => {
    const markup = slotMarkup(customerOnly, "G3");
    expect(figureOf(markup, "G3")).toBe(`${timesText(G3_PLACEHOLDER.multiple)} the people ${PLACEHOLDER_TAG}`);
    const hero = heroOf(markup);
    expect(hero).toContain(`<span class="hero__flag">${PLACEHOLDER_TAG}</span>`);
    expect(plain(hero)).toContain("Placeholder figures: your answers include no team work");
    expect(plain(hero)).toContain(`${timesText(G3_PLACEHOLDER.multiple)} the people for your budget`);
    expect(hero).toContain('data-placeholder="true"');
    // The tab is selected, not disabled.
    expect(markup).toMatch(/<button id="goal-tab-G3"[^>]*aria-selected="true"/);
    expect(markup).not.toMatch(/\sdisabled(=|\s|>)/);
  });

  it("labels G3's tab as a placeholder from the other tabs too, and no other tab", () => {
    for (const goal of ["G1", "G2", "G4"] as const) {
      const markup = slotMarkup(customerOnly, goal);
      expect(figureOf(markup, "G3")).toContain(PLACEHOLDER_TAG);
      for (const other of GOAL_ORDER.filter((g) => g !== "G3")) expect(figureOf(markup, other)).not.toContain(PLACEHOLDER_TAG);
      expect(heroOf(markup)).not.toContain("hero__flag");
    }
  });

  it("shows no placeholder anywhere when the mix has team work", () => {
    for (const id of NAMES) {
      for (const goal of GOAL_ORDER) {
        const markup = slotMarkup(scenarios[id], goal);
        expect(markup, `${id} ${goal}`).not.toContain("goal-tabs__flag");
        expect(markup, `${id} ${goal}`).not.toContain("hero__flag");
        expect(markup, `${id} ${goal}`).not.toContain("data-placeholder");
      }
    }
  });

  it("keeps the placeholder constant out of every compute, solve and chart path", () => {
    const sources = import.meta.glob("../**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
    const readers = Object.entries(sources)
      .filter(([, text]) => text.includes("G3_PLACEHOLDER"))
      .map(([path]) => path.replace(/^\.\.?\//, "store/").replace(/^store\/(components|charts|compute)\//, "$1/"))
      .sort();
    // Only the constant's own file and the hero read it; nothing under compute/ or charts/ does.
    expect(readers.filter((p) => /^(compute|charts)\//.test(p))).toEqual([]);
    expect(readers.some((p) => p.endsWith("components/HeadlineStrip.tsx"))).toBe(true);
    expect(readers.some((p) => p.endsWith("goal.ts"))).toBe(true);
  });

  it("leaves the G1, G2 and G4 figures of the same answers as they are", () => {
    const withTeam = computedFigures(scenarios.s1, tables);
    const noTeam = computedFigures(customerOnly, tables);
    expect(noTeam.g1).not.toBeNull();
    expect(noTeam.g4).not.toBeNull();
    // The placeholder never leaks into a figure that is worked out.
    expect(String(noTeam.g1) + String(noTeam.g4)).not.toContain(String(G3_PLACEHOLDER.multiple));
    expect(withTeam.g1).not.toBeNull();
  });
});

describe("R-6 acceptance (4): the hero is the panel under the tab bar", () => {
  it("is the tabpanel the tabs control, labelled by the chosen tab", () => {
    for (const goal of GOAL_ORDER) {
      const markup = slotMarkup(scenarios.s1, goal);
      const hero = heroOf(markup);
      expect(hero).toContain('id="goal-panel"');
      expect(hero).toContain('role="tabpanel"');
      expect(hero).toContain(`aria-labelledby="goal-tab-${goal}"`);
      expect([...markup.matchAll(/aria-controls="goal-panel"/g)]).toHaveLength(4);
    }
  });
});

describe("R-7 acceptance (1) to (3): the comparator is the one list control of the headline", () => {
  const cases: [string, (typeof NAMES)[number] | "customerOnly", GoalId][] = [];
  for (const id of NAMES) for (const goal of GOAL_ORDER) cases.push([`${id} ${goal}`, id, goal]);
  cases.push(["customer-only G3 placeholder", "customerOnly", "G3"]);

  it.each(cases)("%s: one select, named Compared with, showing the comparator's label", (_name, which, goal) => {
    const ctx = contextFor(which === "customerOnly" ? customerOnly : scenarios[which], goal);
    const markup = renderToStaticMarkup(createElement(GoalSlot, { ctx, contactUrl: "#contact" }));
    const hero = heroOf(markup);
    expect([...hero.matchAll(/<select\b/g)]).toHaveLength(1);
    expect([...markup.matchAll(/<select\b/g)]).toHaveLength(1);
    expect(hero).toMatch(/<select[^>]*aria-label="Compared with"/);
    // The old detached control is gone: no label element and no second control carries the name.
    expect(markup).not.toMatch(/<label[^>]*>\s*Compared with/);
    expect([...markup.matchAll(/Compared with/g)]).toHaveLength(1);
    const label = ctx.results.today_alternatives.find((a) => a.pattern_id === ctx.results.comparator)?.label as string;
    expect(hero).toContain(`<span class="comparator__text">${label}</span>`);
    // The chosen option's text is the label alone.
    expect(hero).toContain(`<option value="${ctx.results.comparator}" selected="">${label}</option>`);
  });

  it("holds the picker in the headline text itself: in the figure in G1 and G4, in the lead line in G2 and G3", () => {
    const inFigure = (goal: GoalId) => {
      const hero = heroOf(slotMarkup(scenarios.s1, goal));
      const figure = /<p class="hero__figure[^"]*"[^>]*>(.*?)<\/p>/.exec(hero)?.[1] ?? "";
      const lead = /<p class="hero__lead">(.*?)<\/p>/.exec(hero)?.[1] ?? "";
      return { figure: figure.includes("<select"), lead: lead.includes("<select") };
    };
    expect(inFigure("G1")).toEqual({ figure: true, lead: false });
    expect(inFigure("G4")).toEqual({ figure: true, lead: false });
    expect(inFigure("G2")).toEqual({ figure: false, lead: true });
    expect(inFigure("G3")).toEqual({ figure: false, lead: true });
  });

  it("keeps the comma after the picker inside one unbreakable span, so it cannot start a line of its own", () => {
    // A budget under what the work costs today gives the long headline: "Your $X covers N% of this work with <picker>, M% with InfraVana".
    const short: Scenario = { ...scenarios.s1, baseline: { ...scenarios.s1.baseline, budget_usd_per_quarter: 60_000 } };
    const hero = heroOf(slotMarkup(short, "G1"));
    const figure = /<p class="hero__figure[^"]*"[^>]*>(.*?)<\/p>/.exec(hero)?.[1] ?? "";
    expect(plain(figure)).toMatch(/covers \d+% of this work with .*, .* with InfraVana/);
    expect(figure).toMatch(/<span class="hero__keep"><span class="comparator"[\s\S]*<\/span>,<\/span>/);
    // That headline is ordinary inline text; only the "than <comparator>" form has the flex tail.
    expect(hero).not.toContain("hero__figure--versus");
    expect(heroOf(slotMarkup(scenarios.s1, "G1"))).toContain("hero__figure--versus");
  });

  it("lists every comparator the results offer, with the typical buyer marked while another is chosen", () => {
    const ctx = contextFor(scenarios.s1, "G1");
    const markup = slotMarkup(scenarios.s1, "G1");
    const options = [...heroOf(markup).matchAll(/<option value="([^"]*)"[^>]*>([^<]*)<\/option>/g)];
    expect(options.map((o) => o[1])).toEqual(ctx.results.today_alternatives.map((a) => a.pattern_id));
    expect(options.filter((o) => o[2].includes("typical for you"))).toHaveLength(0);
    const other = ctx.results.today_alternatives.find((a) => a.pattern_id !== ctx.results.comparator && a.kind !== "best_single");
    const picked = slotMarkup(scenarios.s1, "G1", { comparator: other?.pattern_id as string });
    const typical = ctx.results.today_alternatives.find((a) => a.is_typical) as { pattern_id: string; label: string };
    expect(picked).toContain(`>${typical.label} (typical for you)</option>`);
  });

  it("writes the line under the headline with the comparator in bold, as the control's description", () => {
    for (const goal of GOAL_ORDER) {
      const markup = slotMarkup(scenarios.s1, goal);
      const hero = heroOf(markup);
      const describedBy = /<select[^>]*aria-describedby="([^"]+)"/.exec(hero)?.[1];
      expect(describedBy, goal).toBeDefined();
      const line = new RegExp(`<p id="${describedBy}" class="hero__compare"><strong>([^<]*)</strong>(.*?)</p>`).exec(hero);
      expect(line, goal).not.toBeNull();
      const label = /<span class="comparator__text">([^<]*)<\/span>/.exec(hero)?.[1];
      expect(line?.[1]).toBe(label);
      expect(plain(line?.[0] ?? "")).toBe(
        `${label} is the way a company like yours most often buys AI today. Every saving on this page is measured against it; pick another way to buy in the headline to compare against that instead.`,
      );
    }
  });

  it("says what a chosen option is when it is not the typical buyer, and what best single option is", () => {
    const ctx = contextFor(scenarios.s1, "G1");
    const vendor = ctx.results.today_alternatives.find((a) => !a.is_typical && a.kind !== "best_single") as { pattern_id: string; label: string };
    const typical = ctx.results.today_alternatives.find((a) => a.is_typical) as { label: string };
    const other = plain(/<p id="[^"]+" class="hero__compare">.*?<\/p>/.exec(heroOf(slotMarkup(scenarios.s1, "G1", { comparator: vendor.pattern_id })))?.[0] ?? "");
    expect(other.startsWith(`${vendor.label} is not the way a company like yours most often buys AI today; that is ${typical.label}.`)).toBe(true);
    const best = plain(/<p id="[^"]+" class="hero__compare">.*?<\/p>/.exec(heroOf(slotMarkup(scenarios.s1, "G1", { comparator: "best_single" })))?.[0] ?? "");
    expect(best).toContain("Best single option is the cheapest single offer that meets your quality and speed");
  });

  it("S1 against vendor 2 direct shows 60,007.50 against 43,948.24 (6.1 acceptance 4, through the headline's choice)", () => {
    // A pick in the headline is stored as the view's comparator; withView puts it in the scenario compute() reads.
    const results = computeForView(withView(scenarios.s1, { ...DEFAULT_FIELDS, comparator: "vendor2_direct" }, tables), tables);
    expect(results.comparator).toBe("vendor2_direct");
    expect(results.allocation.total_usd.toFixed(2)).toBe("60007.50");
    const infravana = results.allocation.infravana.filter((s) => s.kind !== "savings").reduce((t, s) => t + s.usd, 0);
    expect(infravana.toFixed(2)).toBe("43948.24");
  });

  it("names the same comparator in the headline for every tab after a pick (R-7 acceptance 4, the markup half)", () => {
    for (const goal of GOAL_ORDER) {
      const markup = slotMarkup(scenarios.s1, goal, { comparator: "vendor2_direct" });
      const hero = heroOf(markup);
      expect(hero, goal).toContain('<span class="comparator__text">Placeholder vendor 2, end to end, direct</span>');
      expect(hero, goal).toMatch(/<option value="vendor2_direct" selected="">/);
    }
  });
});
