import { useState, type ReactNode } from "react";
import { BRAND } from "../charts/labels";
import { comparisonOf } from "../charts/comparison";
import { COVERAGE_MESSAGE_ABOVE, g1Headline, solvedHeadline } from "../compute";
import type { GoalId, GoalView, Results, Scenario } from "../contract";
import { fmtMultiple, fmtPct, fmtUsd, fmtUsdSig } from "../shared/format";
import { COVERAGE_MESSAGE, solvedNotice } from "../shared/goalNotice";
import { GOAL_TABS } from "../store/goal";
import { fmtInt } from "./format";
import { Drawer } from "./Drawer";
import { GOAL_PANEL_ID, goalTabId } from "./GoalTabs";

interface HeadlineStripProps {
  goal: GoalId;
  results: Results;
  /** The scenario `results` was computed from; G3 turns its solved scale into people. */
  scenario: Scenario;
  /** The solve of the active tab (G2, G3); ignored in the other tabs. */
  goalView: GoalView;
  contactUrl: string;
}

/** What the hero shows for the active tab. */
interface HeroContent {
  /** The italic line above the figure; null for none. */
  lead: string | null;
  /** The headline, or what stands in for it. */
  figure: string;
  /** The end of the G1 sentence that names the Today it is measured against ("than <label>"). */
  versus: string | null;
  stats: ReactNode[];
  /** An extra line under the stats (the spec 5.2 coverage message in G1). */
  note: string | null;
  tone: "saving" | "plain" | "quiet";
  /** True while a solved tab has no value yet: the figure is a placeholder. */
  pending: boolean;
  /** True while the value on show is the previous one, awaiting a new one. */
  stale: boolean;
}

const PENDING_FIGURE = "Working out your numbers";

/** A multiple in words, "1.4 times": the hero says "times", the charts say "x". */
function times(multiple: number): string {
  return `${fmtMultiple(multiple).slice(0, -1)} times`;
}

/** G1: the saving in money, at the visitor's own volume (spec 6.2). */
function g1Content(results: Results, label: string): HeroContent {
  const g1 = g1Headline(results);
  const savedPct = Math.round(g1.saved_pct);
  // One rounding rule (nearest percent), so a shortfall that displays as 100% is not one.
  const { demand_tokens, today_tokens, infravana_tokens } = results.tokens_bought;
  const todayPct = Math.round((today_tokens / demand_tokens) * 100);
  const infravanaPct = Math.min(100, Math.round((infravana_tokens / demand_tokens) * 100));
  const short = todayPct < 100;

  let figure: string;
  let versus: string | null = null;
  if (short) {
    const withUs = infravanaPct < 100 ? `${fmtPct(infravanaPct)} with ${BRAND}` : `all of it with ${BRAND}`;
    figure = `Your ${fmtUsd(results.allocation.budget_usd)} covers ${fmtPct(todayPct)} of this work with ${label}, ${withUs}`;
  } else if (savedPct > 0) {
    figure = `${fmtUsdSig(g1.saved_usd)} less each quarter`;
    versus = `than ${label}`;
  } else {
    figure = "About the same cost";
    versus = `as ${label}`;
  }

  const stats: ReactNode[] = [];
  if (savedPct > 0) {
    if (short) {
      stats.push(
        <>
          <strong>{fmtUsdSig(g1.saved_usd)}</strong> less to do all of it
        </>,
      );
    }
    stats.push(
      <>
        <strong>{fmtPct(savedPct)}</strong> lower cost
      </>,
    );
  }
  return {
    lead: !short && savedPct > 0 ? GOAL_TABS.G1.lead : null,
    figure,
    versus,
    stats,
    note: g1.over_ten_times ? COVERAGE_MESSAGE : null,
    tone: !short && savedPct > 0 ? "saving" : "plain",
    pending: false,
    stale: false,
  };
}

/** G2 and G3: the solved multiple, or the sentence that stands in for it (spec 5.2, 6.2). */
function solvedContent(goal: "G2" | "G3", scenario: Scenario, view: GoalView, label: string): HeroContent {
  // The comparator is named in the lead line, so every state of the tab has the same lines.
  const lead = `${GOAL_TABS[goal].lead}, measured against ${label}`;
  if (view.solve === null) {
    // Same lines as the finished headline (the figure's box, the comparator line, the stats with
    // their words), so the figure arriving moves nothing below it.
    const waiting = [
      goal === "G2" ? `… your current AI work with ${BRAND}` : `… people with ${BRAND}`,
      `… with ${label}`,
    ];
    return {
      lead,
      figure: view.error ? "This figure could not be worked out" : PENDING_FIGURE,
      versus: null,
      stats: view.error ? [] : waiting,
      note: view.error,
      tone: "quiet",
      pending: view.error === null,
      stale: false,
    };
  }
  const notice = solvedNotice(view.solve, label);
  if (notice !== null) {
    return {
      lead,
      figure: notice.text,
      versus: null,
      stats: [],
      note: null,
      tone: "quiet",
      pending: false,
      stale: view.stale,
    };
  }
  const headline = solvedHeadline(scenario, view.solve);
  const stats: ReactNode[] = [];
  if (goal === "G2") {
    const { today_scale, infravana_scale } = view.solve;
    // A coverage above ten times is never written as a figure (spec 5.2).
    if (today_scale <= COVERAGE_MESSAGE_ABOVE && infravana_scale <= COVERAGE_MESSAGE_ABOVE) {
      stats.push(
        <>
          <strong>{fmtMultiple(infravana_scale)}</strong> your current AI work with {BRAND}
        </>,
        <>
          <strong>{fmtMultiple(today_scale)}</strong> with {label}
        </>,
      );
    }
  } else if (headline.infravana_people !== null && headline.today_people !== null) {
    stats.push(
      <>
        <strong>{fmtInt(Math.round(headline.infravana_people))}</strong> people with {BRAND}
      </>,
      <>
        <strong>{fmtInt(Math.round(headline.today_people))}</strong> with {label}
      </>,
    );
  }
  return {
    lead,
    figure: `${times(headline.multiple)} the ${goal === "G2" ? "AI work" : "people"} for your budget`,
    versus: null,
    stats,
    note: null,
    tone: "saving",
    pending: false,
    stale: view.stale,
  };
}

function contentFor(goal: GoalId, results: Results, scenario: Scenario, view: GoalView): HeroContent {
  const label = comparisonOf(results).label;
  if (goal === "G2" || goal === "G3") return solvedContent(goal, scenario, view, label);
  return g1Content(results, label);
}

/** The compute function and the plain account each tab's drawer gives (spec 6.2: every drawer names its function). */
function explanation(goal: GoalId, label: string): { fn: string; body: string[] } {
  switch (goal) {
    case "G2":
      return {
        fn: 'solveAtBudget(scenario, tables, "intensity")',
        body: [
          `Your people and customers stay as they are. The solver makes every kind of work, for staff and for customers, heavier or lighter by the same factor until each side's quarterly spend reaches your budget. The figure is the factor reached with ${BRAND} divided by the factor reached with ${label}.`,
          "Spend does not always rise smoothly with volume, because a committed-spend discount can start part-way up. So the solver tries factors in 1% steps and keeps the largest one that fits, then refines it to 0.1%.",
          "It runs in the background, starts 150 milliseconds after your last change, and shows the previous figure dimmed until the new one arrives.",
        ],
      };
    case "G3":
      return {
        fn: 'solveAtBudget(scenario, tables, "users")',
        body: [
          `Work per person stays as it is, and so do your customers. The solver changes only the number of people doing staff work until each side's quarterly spend reaches your budget. The figure is the head-count reached with ${BRAND} divided by the head-count reached with ${label}.`,
          "It tries head-counts in 1% steps and keeps the largest that fits, then refines it to 0.1%. This page models up to 10,000 people, so a larger result is shown as a message instead.",
          "It runs in the background, starts 150 milliseconds after your last change, and shows the previous figure dimmed until the new one arrives.",
        ],
      };
    case "G4":
      return { fn: "compute(scenario, tables)", body: ["The trade-off controls arrive in a later step."] };
    default:
      return {
        fn: "compute(scenario, tables)",
        body: [
          `Both sides price the same work at the same minimum quality and response speed. The saving is the two "Saved" parts of Figure 1 added together, the better price through other channels and the cheaper place to run each model, measured against ${label}. The percentage is that saving over what ${label} costs.`,
          "It is one calculation in your browser, so it updates as you type.",
        ],
      };
  }
}

/**
 * The hero result (spec 4.2, 6.2): the headline of the active goal tab and
 * the Today it is measured against. In G1 it is the saving in money (and, when
 * the budget does not cover the work, how much of it the budget covers); in G2
 * and G3 it is the solved multiple, shown dimmed while a new value is on its
 * way. It is the panel the goal tabs control, and its "How is this headline
 * worked out?" drawer names the compute function behind it. Work is moved only
 * to models that meet the quality and speed asked for (spec 9).
 */
export function HeadlineStrip({ goal, results, scenario, goalView, contactUrl }: HeadlineStripProps) {
  const [how, setHow] = useState(false);
  const label = comparisonOf(results).label;
  const hero = contentFor(goal, results, scenario, goalView);
  const account = explanation(goal, label);
  const figureClass = [
    "hero__figure",
    hero.tone === "saving" ? "hero__figure--saving" : "",
    hero.tone === "quiet" ? "hero__figure--quiet" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className="hero card"
      id={GOAL_PANEL_ID}
      role="tabpanel"
      aria-labelledby={goalTabId(goal)}
      data-goal={goal}
      data-stale={hero.stale ? "true" : undefined}
      data-pending={hero.pending ? "true" : undefined}
    >
      {hero.lead !== null ? <p className="hero__lead">{hero.lead}</p> : null}
      <p className={figureClass} aria-live="polite" aria-busy={hero.stale || hero.pending}>
        {hero.figure}
        {hero.versus !== null ? <span className="hero__than"> {hero.versus}</span> : null}
      </p>
      {hero.stats.length > 0 ? (
        <ul className="hero__stats">
          {hero.stats.map((stat, i) => (
            <li key={i}>{stat}</li>
          ))}
        </ul>
      ) : null}
      {hero.note !== null ? <p className="hero__note">{hero.note}</p> : null}
      <p className="hero__basis">
        {BRAND} moves work only to models that meet your minimum quality and response speed.
      </p>
      <div className="hero__actions">
        <a className="button button--primary" href={contactUrl}>
          Talk to us about your numbers
        </a>
        <button type="button" className="link-button hero__how" aria-haspopup="dialog" onClick={() => setHow(true)}>
          How is this headline worked out?
        </button>
      </div>
      {how ? (
        <Drawer title="How this headline is worked out" onClose={() => setHow(false)}>
          <p>
            <strong>{GOAL_TABS[goal].label}.</strong> Compute function: <code>{account.fn}</code>
          </p>
          {account.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Drawer>
      ) : null}
    </section>
  );
}
