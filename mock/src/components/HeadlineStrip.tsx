import { useId, useState, type ReactNode } from "react";
import { BRAND } from "../charts/labels";
import { comparisonOf } from "../charts/comparison";
import { chartRegistry } from "../charts/registry";
import { COVERAGE_MESSAGE_ABOVE, g1Headline, solvedHeadline } from "../compute";
import { ProvenanceNotes } from "../charts/ProvenanceNotes";
import type { GoalId, GoalView, PatternId, Results, Scenario, TradeoffView } from "../contract";
import { fmtMultiple, fmtPct, fmtUsd, fmtUsdSig } from "../shared/format";
import { COVERAGE_MESSAGE, solvedNotice } from "../shared/goalNotice";
import { G3_PLACEHOLDER, GOAL_TABS, PLACEHOLDER_NOTE, PLACEHOLDER_TAG, timesText } from "../store/goal";
import { floorsText, tradeoffFigures } from "../store/tradeoff";
import { ComparatorLine, ComparatorSelect } from "./ComparatorSelect";
import { fmtInt, LATENCY_LABEL } from "./format";
import { Drawer } from "./Drawer";
import { GOAL_PANEL_ID, goalTabId } from "./GoalTabs";
import { TradeoffControls } from "./TradeoffControls";

/** The comparator picker the headline holds (spec 15.7): the choice shown and how a pick is reported. */
export interface HeadlineComparator {
  value: PatternId;
  onChange: (id: PatternId) => void;
}

interface HeadlineStripProps {
  goal: GoalId;
  results: Results;
  /** The scenario `results` was computed from; G3 turns its solved scale into people. */
  scenario: Scenario;
  /** The solve of the active tab (G2, G3); ignored in the other tabs. */
  goalView: GoalView;
  /** The comparator picker drawn inside the headline, with the line under it. */
  comparator: HeadlineComparator;
  /** True in G3 when the mix has no team work: the hero shows the labelled placeholder figure (spec 6.2, 10). */
  placeholder?: boolean;
  /** Moves a G4 step; only the G4 tab reads it. */
  onSteps: (steps: { qualityStep?: number; speedStep?: number }) => void;
  contactUrl: string;
}

/** What the hero shows for the active tab. */
interface HeroContent {
  /** The italic line above the figure; null for none. */
  lead: ReactNode;
  /** The headline, or what stands in for it. */
  figure: ReactNode;
  /** The end of the G1 sentence that names the Today it is measured against ("than <comparator picker>"). */
  versus: ReactNode;
  stats: ReactNode[];
  /** An extra line under the stats (the spec 5.2 coverage message in G1). */
  note: string | null;
  tone: "saving" | "plain" | "quiet";
  /** True while a solved tab has no value yet: the figure is a placeholder. */
  pending: boolean;
  /** True while the value on show is the previous one, awaiting a new one. */
  stale: boolean;
  /** G4 only: the second number, under the figure. */
  extra?: ReactNode;
  /** G4 only: both sides' floors and speeds, read from the two calls. */
  sides?: ReactNode;
  /** G4 only: the trade-off the hero is showing. */
  tradeoff?: TradeoffView;
  /** G3 only: the figures are the labelled placeholder (spec 6.2, 10), not worked out from the answers. */
  placeholder?: boolean;
}

const PENDING_FIGURE = "Working out your numbers";

/** The title of the chart whose "Saved" block is the G1 headline; a chart is named by its title, never by a number (spec 15.9). */
const C1_TITLE = chartRegistry.find((def) => def.id === "C1")?.title ?? "Where the money goes";

/**
 * G1: the saving in money, at the visitor's own volume (spec 6.2). Its figure
 * always names the Today it is measured against, so the comparator picker
 * (`picker`, spec 15.7) stands in the figure in every G1 form.
 */
function g1Content(results: Results, picker: ReactNode): HeroContent {
  const g1 = g1Headline(results);
  const savedPct = Math.round(g1.saved_pct);
  // One rounding rule (nearest percent), so a shortfall that displays as 100% is not one.
  const { demand_tokens, today_tokens, infravana_tokens } = results.tokens_bought;
  const todayPct = Math.round((today_tokens / demand_tokens) * 100);
  const infravanaPct = Math.min(100, Math.round((infravana_tokens / demand_tokens) * 100));
  const short = todayPct < 100;

  let figure: ReactNode;
  let versus: ReactNode = null;
  if (short) {
    const withUs = infravanaPct < 100 ? `${fmtPct(infravanaPct)} with ${BRAND}` : `all of it with ${BRAND}`;
    figure = (
      <>
        Your {fmtUsd(results.allocation.budget_usd)} covers {fmtPct(todayPct)} of this work with{" "}
        <span className="hero__keep">{picker},</span> {withUs}
      </>
    );
  } else if (savedPct > 0) {
    figure = `${fmtUsdSig(g1.saved_usd)} less each quarter`;
    versus = <>than {picker}</>;
  } else {
    figure = "About the same cost";
    versus = <>as {picker}</>;
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
function solvedContent(
  goal: "G2" | "G3",
  scenario: Scenario,
  view: GoalView,
  label: string,
  picker: ReactNode,
  placeholder: boolean,
): HeroContent {
  // The comparator picker stands in the lead line, so every state of the tab has the same lines
  // and the headline holds exactly one list control (spec 15.7).
  const lead = (
    <>
      {GOAL_TABS[goal].lead}, measured against {picker}
    </>
  );
  if (placeholder) {
    // G3 with no team work: the labelled placeholder (spec 6.2, 10). Nothing here is worked out.
    return {
      lead,
      figure: (
        <>
          {timesText(G3_PLACEHOLDER.multiple)} the people for your budget{" "}
          <span className="hero__flag">{PLACEHOLDER_TAG}</span>
        </>
      ),
      versus: null,
      stats: [
        <>
          <strong>{fmtInt(G3_PLACEHOLDER.infravana_people)}</strong> people with {BRAND}
        </>,
        <>
          <strong>{fmtInt(G3_PLACEHOLDER.today_people)}</strong> with {label}
        </>,
      ],
      note: PLACEHOLDER_NOTE,
      tone: "saving",
      pending: false,
      stale: false,
      placeholder: true,
    };
  }
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
    figure: `${timesText(headline.multiple)} the ${goal === "G2" ? "AI work" : "people"} for your budget`,
    versus: null,
    stats,
    note: null,
    tone: "saving",
    pending: false,
    stale: view.stale,
  };
}

/** What the steps chosen give up, in words. */
function giveUpWords(trade: TradeoffView): string {
  const quality = trade.qualityStep > 0;
  const speed = trade.speedStep > 0;
  return quality && speed ? "quality and speed" : quality ? "quality" : "speed";
}

/**
 * G4: two numbers (spec 6.2), the saving at the visitor's own floors, which is
 * the G1 figure from the untraded call, and the extra saving the give-up buys,
 * with both sides' floors and speeds beside them. This is the one place the two
 * sides differ (spec 9), so it says so.
 */
function g4Content(results: Results, scenario: Scenario, trade: TradeoffView, picker: ReactNode): HeroContent {
  const label = comparisonOf(trade.untraded).label;
  // The picker stands in the G1 figure here, so the lead below names the comparator as plain text.
  const own = g1Content(trade.untraded, picker);
  const relaxed = trade.error === null ? results : trade.untraded;
  const { extraSaving } = tradeoffFigures(trade.untraded, relaxed);
  const chosen = trade.qualityStep > 0 || trade.speedStep > 0;

  let extra: ReactNode;
  if (trade.error !== null) extra = `This trade-off could not be worked out: ${trade.error}`;
  else if (extraSaving > 0 && chosen) {
    extra = (
      <>
        <strong>{fmtUsdSig(extraSaving)} more</strong> each quarter by giving up {giveUpWords(trade)}
      </>
    );
  } else if (chosen) extra = "These steps add no saving for this work.";
  else extra = "Choose a step below to see what giving up quality or speed would add.";

  const todaySide = { floors: trade.untraded.quality_floor_by_workload, speed: scenario.latency_class };
  const side = relaxed.infravana_side;
  const sideText = (floors: Record<string, number>, speed: keyof typeof LATENCY_LABEL) => (
    <>
      Quality at least {floorsText(floors)}, answers {LATENCY_LABEL[speed]}
    </>
  );
  const sides = (
    <dl className="hero__sides" aria-label="The quality and speed each side is held to">
      <div className="hero__side">
        <dt>{label}</dt>
        <dd>{sideText(todaySide.floors, todaySide.speed)}</dd>
      </div>
      <div className="hero__side hero__side--infravana">
        <dt>{BRAND}</dt>
        <dd>{sideText(side.quality_floor_by_workload, side.latency_class)}</dd>
      </div>
    </dl>
  );
  return {
    ...own,
    lead: `At your own quality and speed, measured against ${label}`,
    extra,
    sides,
    tradeoff: trade,
  };
}

function contentFor(
  goal: GoalId,
  results: Results,
  scenario: Scenario,
  view: GoalView,
  picker: ReactNode,
  placeholder: boolean,
): HeroContent {
  const label = comparisonOf(results).label;
  if (goal === "G2" || goal === "G3") return solvedContent(goal, scenario, view, label, picker, placeholder && goal === "G3");
  if (goal === "G4" && view.tradeoff) return g4Content(results, scenario, view.tradeoff, picker);
  return g1Content(results, picker);
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
      return {
        fn: "compute(scenario, tables), twice",
        body: [
          `One call prices your work at your own quality and speed. That is the first figure, and it is the same one the first tab gives. A second call lets ${BRAND} accept the lower quality and slower speed you chose, and the second figure is how much more that saves. ${label} is priced once, at your own quality and speed, so it does not change as you move the steps.`,
          "The quality step lowers the score each kind of work has to reach, one score of the benchmark table at a time. It only moves the share of work you allow on open models. The speed step lets a model be bought at its slower, cheaper batch or flex price, and lets open models run on slower hardware.",
          "This is the one tab where the two sides are held to different quality and speed, because you chose to give something up. Each side's floors are shown under the figures.",
          "The speed and batch-price rows this uses are invented placeholder data.",
        ],
      };
    default:
      return {
        fn: "compute(scenario, tables)",
        body: [
          `Both sides price the same work at the same minimum quality and response speed. The saving is what the chart "${C1_TITLE}" shows as "Saved", the better price through other channels and the cheaper place to run each model, measured against ${label}. The percentage is that saving over what ${label} costs.`,
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
export function HeadlineStrip({
  goal,
  results,
  scenario,
  goalView,
  comparator,
  placeholder = false,
  onSteps,
  contactUrl,
}: HeadlineStripProps) {
  const [how, setHow] = useState(false);
  const compareLineId = useId();
  const label = comparisonOf(results).label;
  const picker = (
    <ComparatorSelect
      results={results}
      value={comparator.value}
      onChange={comparator.onChange}
      describedBy={compareLineId}
    />
  );
  const hero = contentFor(goal, results, scenario, goalView, picker, placeholder);
  const account = explanation(goal, label);
  const figureClass = [
    "hero__figure",
    hero.tone === "saving" ? "hero__figure--saving" : "",
    hero.tone === "quiet" ? "hero__figure--quiet" : "",
    hero.versus !== null ? "hero__figure--versus" : "",
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
      data-placeholder={hero.placeholder ? "true" : undefined}
    >
      {hero.lead !== null ? <p className="hero__lead">{hero.lead}</p> : null}
      <p className={figureClass} aria-live="polite" aria-busy={hero.stale || hero.pending}>
        {hero.figure}
        {hero.versus !== null ? <span className="hero__than"> {hero.versus}</span> : null}
      </p>
      <ComparatorLine results={results} value={comparator.value} id={compareLineId} />
      {hero.stats.length > 0 ? (
        <ul className="hero__stats">
          {hero.stats.map((stat, i) => (
            <li key={i}>{stat}</li>
          ))}
        </ul>
      ) : null}
      {hero.extra ? <p className="hero__extra">{hero.extra}</p> : null}
      {hero.sides}
      {hero.tradeoff ? <TradeoffControls view={hero.tradeoff} onSteps={onSteps} /> : null}
      {hero.note !== null ? <p className="hero__note">{hero.note}</p> : null}
      <p className="hero__basis">
        {hero.tradeoff
          ? `In this tab only, ${BRAND} is held to the lower quality and speed you chose, and ${label} is not.`
          : `${BRAND} moves work only to models that meet your minimum quality and response speed.`}
      </p>
      {hero.tradeoff?.invented ? (
        <ProvenanceNotes
          size="stage"
          invented
          parts={[
            { group: label, part: "", provenance: results.tokens_bought.provenance.today },
            { group: BRAND, part: "", provenance: results.tokens_bought.provenance.infravana },
          ]}
        />
      ) : null}
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
