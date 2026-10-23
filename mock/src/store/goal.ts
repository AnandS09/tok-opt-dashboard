/**
 * The goal tabs (spec 6.2, R-6): their names, the figure each tab shows under
 * its name, and the hooks that run the G2 and G3 solves on the solver worker.
 * The sentences spec 5.2 asks for in G2 and G3 are in `shared/goalNotice.ts`.
 *
 * Every tab is always shown and always enabled. The tab bar needs every goal's
 * figure up front, so all four goals are worked out whichever tab is active:
 * G1 and G4 with `compute()`, G2 and G3 on the worker. When the mix has no
 * team work, G3 cannot be solved; it shows a labelled placeholder instead.
 *
 * The active tab itself lives in the stage state and the page address
 * (`store/stage.ts`, `store/hash.ts`); this file adds what the tabs need on top.
 */
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { g1Headline, goalAvailability, SolveClient, solvedHeadline, type SolveSnapshot } from "../compute";
import type { GoalId, GoalView, Scenario, SolveAxis, SolveResult, Tables } from "../contract";
import { USERS_RANGE } from "../data/ranges";
import { fmtMultiple, fmtPct, fmtUsdSig } from "../shared/format";
import { solvedNotice } from "../shared/goalNotice";
import { computeForView, withView } from "./stage";
import { clampStep, computeTradeoff, tradeoffFigures, tradeoffLevels } from "./tradeoff";

/** The tabs in the order the page shows them (spec 4, 6.2). */
export const GOAL_ORDER: readonly GoalId[] = ["G1", "G2", "G3", "G4"];

export interface GoalTabInfo {
  id: GoalId;
  /** The tab's full name (spec 6.2). */
  label: string;
  /** The name on a phone, where the four tabs share one row (spec 15.6). */
  short: string;
  /** What the hero says the tab holds still, for the hero's lead line. */
  lead: string;
}

export const GOAL_TABS: Record<GoalId, GoalTabInfo> = {
  G1: { id: "G1", label: "Less money for the same AI", short: "Less money", lead: "For the same AI work" },
  G2: { id: "G2", label: "More AI for the same money", short: "More AI", lead: "Same people, same budget" },
  G3: {
    id: "G3",
    label: "More people for the same money",
    short: "More people",
    lead: "Same work per person, same budget",
  },
  G4: { id: "G4", label: "Accept a trade-off", short: "Trade-off", lead: "If you accept less quality or speed" },
};

/**
 * The figures G3 shows when the mix has no team work (spec 6.2 G3, 10, 15.6).
 * They are placeholders, not results: no `compute()` or solve path reads this
 * constant, only the G3 tab and the G3 hero, and both print `PLACEHOLDER_TAG`
 * beside them.
 */
export const G3_PLACEHOLDER = {
  /** "N times the people for your budget". */
  multiple: 1.6,
  /** The head-counts the hero prints beside it, with and without InfraVana. */
  infravana_people: 80,
  today_people: 50,
} as const;

/** The word that labels a placeholder figure wherever one is shown. */
export const PLACEHOLDER_TAG = "Placeholder";

/** The sentence under a placeholder hero: what the figures are and why they are not worked out. */
export const PLACEHOLDER_NOTE =
  "Placeholder figures: your answers include no team work, so these are not worked out from your numbers.";

/** A multiple in words, "1.4 times": the hero and the tabs say "times", the charts say "x". */
export function timesText(multiple: number): string {
  return `${fmtMultiple(multiple).slice(0, -1)} times`;
}

/**
 * The tab a key moves to from `active` (spec 6.2: tabs have arrow-key movement), or
 * null for a key the tab bar leaves alone. All four tabs can be chosen, so no tab
 * is skipped; the arrows wrap, Home goes to the first and End to the last.
 */
export function tabForKey(active: GoalId, key: string): GoalId | null {
  const at = GOAL_ORDER.indexOf(active);
  const n = GOAL_ORDER.length;
  if (key === "ArrowRight") return GOAL_ORDER[(at + 1) % n];
  if (key === "ArrowLeft") return GOAL_ORDER[(at - 1 + n) % n];
  if (key === "Home") return GOAL_ORDER[0];
  if (key === "End") return GOAL_ORDER[n - 1];
  return null;
}

/** The reason G3 cannot be worked out for these answers (no team work), else null. The tab is still chosen; it shows a placeholder. */
export function g3PlaceholderReason(scenario: Scenario, tables: Tables): string | null {
  try {
    return goalAvailability(scenario, tables).G3;
  } catch {
    // A scenario the engine cannot read leaves every tab as it is; the page shows the engine's own error.
    return null;
  }
}

/** The solve axis a tab uses, or null for a tab that is not solved (G1, G4). */
export function solveAxisOf(goal: GoalId): SolveAxis | null {
  return goal === "G2" ? "intensity" : goal === "G3" ? "users" : null;
}

// ---------------------------------------------------------------------------
// What each tab shows under its name
// ---------------------------------------------------------------------------

/** What one tab shows under its name. */
export interface TabFigure {
  text: string;
  /** True for the G3 placeholder: the tab prints `PLACEHOLDER_TAG` beside the text. */
  placeholder: boolean;
  /** True while the figure is still being worked out (no earlier value to show). */
  pending: boolean;
  /** True while the value on show is the previous one, awaiting a new one. */
  stale: boolean;
}

const WORKING = "Working it out";
const UNAVAILABLE = "Not available";

const shown = (text: string, stale = false): TabFigure => ({ text, placeholder: false, pending: false, stale });

/** G1's figure: the saving as a percent, the same one the G1 hero states ("47% lower cost"). */
export function g1FigureText(savedPct: number): string {
  return Math.round(savedPct) > 0 ? `${fmtPct(savedPct)} lower cost` : "About the same cost";
}

/** G4's figure: the extra saving the largest give-up buys, as the G4 hero states it ("Up to $12K more saved"). */
export function g4FigureText(extraSaving: number): string {
  return extraSaving > 0 ? `Up to ${fmtUsdSig(extraSaving)} more saved` : "No extra saving";
}

/** G2's or G3's figure from a finished solve, the multiple the hero states ("1.8 times the AI work"), or a short form of the sentence that replaces it. */
export function solvedFigureText(goal: "G2" | "G3", scenario: Scenario, solve: SolveResult): string {
  const notice = solvedNotice(solve, "");
  if (notice !== null) {
    if (notice.kind === "capped") return `More than ${USERS_RANGE.max.toLocaleString("en-US")} people`;
    if (notice.kind === "no_volume") return "No volume fits the budget";
    return "Budget over ten times the work";
  }
  const { multiple } = solvedHeadline(scenario, solve);
  return `${timesText(multiple)} the ${goal === "G2" ? "AI work" : "people"}`;
}

/** The scenario as the visitor's own plan: no goal and no trade-off (spec 6.2: G1 to G3 always use the own floors and speed). */
function ownScenario(scenario: Scenario): Scenario {
  const { goal, tradeoff, ...own } = scenario;
  void goal;
  void tradeoff;
  return own;
}

/**
 * The figures of the two tabs that `compute()` answers at once. G4's is taken
 * at the largest give-up (spec 6.2, 15.6): both stepped controls at their last
 * position, the same extra saving the G4 hero states there. Null for a figure
 * the engine cannot work out for these answers.
 */
export function computedFigures(
  scenario: Scenario,
  tables: Tables,
): { g1: string | null; g4: string | null; g4Extra: number | null } {
  const own = ownScenario(scenario);
  let g1: string | null = null;
  try {
    g1 = g1FigureText(g1Headline(computeForView(own, tables)).saved_pct);
  } catch {
    // Left null: the tab says "Not available" and the page shows the engine's own error.
  }
  let g4: string | null = null;
  let g4Extra: number | null = null;
  try {
    const levels = tradeoffLevels(own, tables, { comparator: null });
    const steps = {
      qualityStep: clampStep(Number.MAX_SAFE_INTEGER, levels.quality),
      speedStep: clampStep(Number.MAX_SAFE_INTEGER, levels.speed),
    };
    const calls = computeTradeoff(withView(own, { goal: "G4", comparator: null, ...steps }, tables), tables);
    if (calls.traded !== null) {
      g4Extra = tradeoffFigures(calls.untraded, calls.traded).extraSaving;
      g4 = g4FigureText(g4Extra);
    }
  } catch {
    // As above.
  }
  return { g1, g4, g4Extra };
}

// ---------------------------------------------------------------------------
// The solves, on the worker
// ---------------------------------------------------------------------------

const IDLE: SolveSnapshot = { status: "idle", result: null, stale: false, error: null };
const NO_SUBSCRIBE = () => () => {};
const NO_SNAPSHOT = () => IDLE;

interface AxisSolveInput {
  /** The axis to solve, or null for none (no request is made and nothing is reported). */
  axis: SolveAxis | null;
  /** The scenario with the view folded in, as the page holds it before any throttling. */
  scenario: Scenario | null;
  tables: Tables | null;
  /** False while the page is not showing the tabs, so no solve starts for nobody. */
  enabled: boolean;
}

/** The latest solve of one axis, as the page reads it. */
export interface AxisSolve {
  solve: SolveResult | null;
  /** True while `solve` belongs to an earlier input than the page now shows. */
  stale: boolean;
  error: string | null;
}

/**
 * Runs the solve of one axis on its own worker client. A request starts 150 ms
 * after the last change; until its answer arrives the previous value is
 * reported with `stale` set, so the page dims it. A value that belongs to the
 * other axis is never reported: it is not this axis's number.
 */
function useAxisSolve({ axis, scenario, tables, enabled }: AxisSolveInput): AxisSolve {
  // The client is made in an effect and disposed in its cleanup, so a StrictMode
  // remount builds a fresh one; nothing reads it while it is disposed.
  const [client, setClient] = useState<SolveClient | null>(null);
  useEffect(() => {
    if (!tables) return;
    const made = new SolveClient({ tables });
    setClient(made);
    return () => {
      made.dispose();
    };
  }, [tables]);

  const subscribe = useMemo(() => (client ? client.subscribe : NO_SUBSCRIBE), [client]);
  const getSnapshot = useMemo(() => (client ? client.getSnapshot : NO_SNAPSHOT), [client]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, NO_SNAPSHOT);

  const key = useMemo(
    () => (axis !== null && scenario !== null && enabled ? JSON.stringify([scenario, axis]) : null),
    [axis, scenario, enabled],
  );

  // The key last sent to the client. Until the effect below has sent the current one, the
  // value on screen belongs to an earlier input and counts as stale.
  const [sent, setSent] = useState<string | null>(null);
  useEffect(() => {
    if (client === null || key === null || axis === null || scenario === null) return;
    client.request(scenario, axis);
    setSent(key);
    // `key` stands for `scenario` and `axis`: it changes exactly when either does.
  }, [client, key]);

  if (axis === null) return { solve: null, stale: false, error: null };
  const matching = snapshot.result !== null && snapshot.result.axis === axis ? snapshot.result : null;
  const awaiting = key !== null && (sent !== key || snapshot.status === "solving" || snapshot.status === "idle");
  return {
    solve: matching,
    stale: matching !== null && (snapshot.stale || awaiting),
    error: snapshot.status === "error" && sent === key ? snapshot.error : null,
  };
}

interface GoalSolveInput {
  goal: GoalId;
  scenario: Scenario | null;
  tables: Tables | null;
  enabled: boolean;
}

/**
 * Runs the solve of the active tab (G2 or G3) on the worker and reports it as
 * a `GoalView`. G3 with no team work has nothing to solve: it reports no
 * solve and the reason as its `error`, which the charts show in place of
 * volumes; the hero shows the placeholder figure instead.
 */
export function useGoalSolve({ goal, scenario, tables, enabled }: GoalSolveInput): GoalView {
  const placeholder = goal === "G3" && scenario && tables ? g3PlaceholderReason(scenario, tables) : null;
  const solved = useAxisSolve({
    axis: placeholder === null ? solveAxisOf(goal) : null,
    scenario,
    tables,
    enabled,
  });
  if (placeholder !== null) return { goal, solve: null, stale: false, error: placeholder };
  return { goal, ...solved };
}

interface GoalFiguresInput {
  /** The scenario as the stage holds it. Its goal and trade-off are ignored: each figure is that goal's own. */
  scenario: Scenario;
  tables: Tables;
  enabled: boolean;
}

/** One solved tab's figure from its solve, or a stand-in while the solve is on its way or has failed. */
function solvedFigure(goal: "G2" | "G3", scenario: Scenario, view: AxisSolve): TabFigure {
  if (view.solve === null) {
    return view.error !== null
      ? shown(UNAVAILABLE)
      : { text: WORKING, placeholder: false, pending: true, stale: false };
  }
  return shown(solvedFigureText(goal, scenario, view.solve), view.stale);
}

/**
 * The figure under each of the four tabs (spec 15.6). G1 and G4 come from
 * `compute()`; G2 and G3 from their own solves, started whichever tab is
 * active, so every figure is there before its tab is chosen. G3 with no team
 * work is the labelled placeholder and is never solved.
 */
export function useGoalFigures({ scenario, tables, enabled }: GoalFiguresInput): Record<GoalId, TabFigure> {
  // The tabs follow the visitor's own plan, so choosing a tab or moving a G4 step never restarts a solve.
  const key = JSON.stringify(ownScenario(scenario));
  const own = useMemo(() => ownScenario(scenario), [key]);
  const computed = useMemo(() => computedFigures(own, tables), [own, tables]);
  const placeholder = useMemo(() => g3PlaceholderReason(own, tables), [own, tables]);

  const intensity = useAxisSolve({ axis: "intensity", scenario: own, tables, enabled });
  const users = useAxisSolve({ axis: placeholder === null ? "users" : null, scenario: own, tables, enabled });

  return {
    G1: shown(computed.g1 ?? UNAVAILABLE),
    G2: solvedFigure("G2", own, intensity),
    G3:
      placeholder !== null
        ? { text: `${timesText(G3_PLACEHOLDER.multiple)} the people`, placeholder: true, pending: false, stale: false }
        : solvedFigure("G3", own, users),
    G4: shown(computed.g4 ?? UNAVAILABLE),
  };
}
