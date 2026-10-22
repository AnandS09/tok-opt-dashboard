/**
 * The goal tabs (spec 6.2): their names, which of them can be chosen, and the
 * hook that runs the G2 and G3 solves on the solver worker. The sentences spec
 * 5.2 asks for in G2 and G3 are in `shared/goalNotice.ts`.
 *
 * The active tab itself lives in the stage state and the page address
 * (`store/stage.ts`, `store/hash.ts`); this file adds what the tabs need on top.
 */
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { goalAvailability, SolveClient, type SolveSnapshot } from "../compute";
import type { GoalId, GoalView, Scenario, SolveAxis, Tables } from "../contract";

/** The tabs in the order the page shows them (spec 4, 6.2). */
export const GOAL_ORDER: readonly GoalId[] = ["G1", "G2", "G3", "G4"];

export interface GoalTabInfo {
  id: GoalId;
  /** The tab's full name (spec 6.2). */
  label: string;
  /** What the hero says the tab holds still, for the hero's lead line. */
  lead: string;
}

export const GOAL_TABS: Record<GoalId, GoalTabInfo> = {
  G1: { id: "G1", label: "Less money for the same AI", lead: "For the same AI work" },
  G2: { id: "G2", label: "More AI for the same money", lead: "Same people, same budget" },
  G3: { id: "G3", label: "More people for the same money", lead: "Same work per person, same budget" },
  G4: { id: "G4", label: "Accept a trade-off", lead: "If you accept less quality or speed" },
};

export interface GoalTabState {
  disabled: boolean;
  /** The one-line reason a tab is disabled, else null. */
  reason: string | null;
}

/** Which tabs can be chosen for the scenario (G3 needs employee work; G4 is always open, its speed control carries its own reason). */
export function goalTabStates(scenario: Scenario, tables: Tables): Record<GoalId, GoalTabState> {
  let g3: string | null = null;
  try {
    g3 = goalAvailability(scenario, tables).G3;
  } catch {
    // A scenario the engine cannot read leaves every tab as it is; the page shows the engine's own error.
  }
  const state = (reason: string | null): GoalTabState => ({ disabled: reason !== null, reason });
  return {
    G1: state(null),
    G2: state(null),
    G3: state(g3),
    G4: state(null),
  };
}

/** The solve axis a tab uses, or null for a tab that is not solved (G1, G4). */
export function solveAxisOf(goal: GoalId): SolveAxis | null {
  return goal === "G2" ? "intensity" : goal === "G3" ? "users" : null;
}

const IDLE: SolveSnapshot = { status: "idle", result: null, stale: false, error: null };
const NO_SUBSCRIBE = () => () => {};
const NO_SNAPSHOT = () => IDLE;

interface GoalSolveInput {
  goal: GoalId;
  /** The scenario with the view folded in, as the page holds it before any throttling. */
  scenario: Scenario | null;
  tables: Tables | null;
  /** False while the page is not showing the tabs, so no solve starts for nobody. */
  enabled: boolean;
}

/**
 * Runs the solve of the active tab (G2 or G3) on the worker and reports it as
 * a `GoalView`. A request starts 150 ms after the last change; until its
 * answer arrives the previous value is reported with `stale` set, so the page
 * dims it. A value that belongs to the other axis is never reported: it is
 * not this tab's number.
 */
export function useGoalSolve({ goal, scenario, tables, enabled }: GoalSolveInput): GoalView {
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

  const axis = solveAxisOf(goal);
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

  if (axis === null) return { goal, solve: null, stale: false, error: null };
  const matching = snapshot.result !== null && snapshot.result.axis === axis ? snapshot.result : null;
  const awaiting = key !== null && (sent !== key || snapshot.status === "solving" || snapshot.status === "idle");
  return {
    goal,
    solve: matching,
    stale: matching !== null && (snapshot.stale || awaiting),
    error: snapshot.status === "error" && sent === key ? snapshot.error : null,
  };
}
