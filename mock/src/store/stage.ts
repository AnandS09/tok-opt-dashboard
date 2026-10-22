/**
 * State of the stage (spec 4.1): which chart is in focus and the page-wide
 * view fields that the address also holds (goal tab, comparator, G4 steps,
 * C10 view). They are kept apart from the `Scenario` because the address
 * restores them before the scenario is loaded; `withView` folds them into the
 * scenario that `compute()` reads.
 *
 * The pure address functions are in `./hash.ts`; this file adds the reducer
 * and the one hook that keeps the address and the state in step.
 */
import { useEffect, useReducer, type Dispatch } from "react";
import { compute } from "../compute";
import type { ChartDef, ChartId, GoalId, GoalView, PatternId, Results, Scenario, Tables } from "../contract";
import {
  hasStageFields,
  parseHash,
  serialiseHash,
  type C10View,
  type HashFields,
} from "./hash";

/** Which way the stage slid last, for the transition: a jump (index or grid click) fades only. */
export type StageDirection = "none" | "next" | "prev" | "jump";

export interface StageState {
  view: HashFields;
  direction: StageDirection;
}

export type StageAction =
  | { type: "slide_set"; slide: ChartId; direction: StageDirection }
  | { type: "goal_set"; goal: GoalId }
  | { type: "comparator_set"; comparator: PatternId | null }
  | { type: "steps_set"; qualityStep?: number; speedStep?: number }
  | { type: "c10_set"; c10: C10View }
  /** The address changed from outside (a pasted link, the back button). */
  | { type: "hash_loaded"; fields: HashFields };

export function initialStageState(hash: string): StageState {
  return { view: parseHash(hash), direction: "none" };
}

export function stageReducer(state: StageState, action: StageAction): StageState {
  switch (action.type) {
    case "slide_set":
      return { view: { ...state.view, slide: action.slide }, direction: action.direction };
    case "goal_set":
      return { ...state, view: { ...state.view, goal: action.goal } };
    case "comparator_set":
      return { ...state, view: { ...state.view, comparator: action.comparator } };
    case "steps_set":
      return {
        ...state,
        view: {
          ...state.view,
          qualityStep: action.qualityStep ?? state.view.qualityStep,
          speedStep: action.speedStep ?? state.view.speedStep,
        },
      };
    case "c10_set":
      return { ...state, view: { ...state.view, c10: action.c10 } };
    case "hash_loaded":
      return { view: action.fields, direction: "jump" };
  }
}

/**
 * The chart in focus: the one the view names, else the first one shown (a
 * hash naming a chart that is not shown opens the first). Null when nothing is shown.
 */
export function activeIndex(slides: readonly ChartDef[], slide: ChartId | null): number {
  if (slides.length === 0) return -1;
  const at = slides.findIndex((def) => def.id === slide);
  return at < 0 ? 0 : at;
}

/** The index of the slide a step of `delta` from `from` reaches, wrapping at the ends (spec 4.1). */
export function wrapIndex(from: number, delta: number, count: number): number {
  return count <= 0 ? -1 : (((from + delta) % count) + count) % count;
}

/**
 * The scenario with the view's goal, comparator and G4 steps filled in, for
 * `compute()`. A field at its default is left off, so with the default view the
 * scenario is returned unchanged. A comparator that is not a Today option in
 * the data is ignored rather than allowed to make `compute()` throw.
 */
export function withView(
  scenario: Scenario,
  view: Pick<HashFields, "goal" | "comparator" | "qualityStep" | "speedStep">,
  tables: Tables,
): Scenario {
  const known = view.comparator !== null && tables.buying_patterns.some((p) => p.pattern_id === view.comparator);
  const next: Scenario = { ...scenario };
  if (view.goal !== "G1") next.goal = view.goal;
  if (known && view.comparator !== null) next.comparator = view.comparator;
  if (view.goal === "G4") next.tradeoff = { quality_step: view.qualityStep, speed_step: view.speedStep };
  return next;
}

/**
 * `compute()` for the page: if the scenario names a comparator that is not an
 * option the engine can offer for the mix and floors in effect (the best single
 * option once no proprietary offer meets every floor, or a pattern with no rows
 * for a workload), the page falls back to the default comparator, the typical
 * buyer, instead of failing. The stored choice stays in the view state, so it
 * applies again if the visitor changes the inputs back. `compute()`'s own
 * signature and results are unchanged; a failure that has nothing to do with the
 * comparator is thrown again by the second call.
 */
export function computeForView(scenario: Scenario, tables: Tables): Results {
  try {
    return compute(scenario, tables);
  } catch (error) {
    if (scenario.comparator === undefined) throw error;
    const { comparator, ...withoutChoice } = scenario;
    void comparator;
    return compute(withoutChoice, tables);
  }
}

/**
 * What a later unit's control needs to read and change the view. The stage
 * slots (`components/StageSlots.tsx`) receive it, so a control needs nothing
 * else from `App.tsx`.
 */
export interface StageSlotContext {
  view: HashFields;
  scenario: Scenario;
  tables: Tables;
  results: Results;
  /** The active tab and, in G2 and G3, its solve (spec 6.2); charts that follow the tab read it. */
  goalView: GoalView;
  setGoal: (goal: GoalId) => void;
  /** Null selects the default, the typical buyer for the stage. */
  setComparator: (comparator: PatternId | null) => void;
  setSteps: (steps: { qualityStep?: number; speedStep?: number }) => void;
  setC10: (c10: C10View) => void;
}

/** The stage state, started from the page address as it is when the page opens. */
export function useStageState() {
  return useReducer(stageReducer, window.location.hash, initialStageState);
}

/**
 * Keeps the page address and the stage state in step.
 *
 * - While `shownSlide` is non-null (the stage is on screen) every change of
 *   the view is written to the address with `replaceState`, so the back button
 *   is not filled with one entry per chart. Before that the address is left
 *   alone, so a hash that arrives with the page survives until the data loads.
 * - An address that changes by hand (a pasted link) is read back into the state.
 *   One that names no stage field, such as `#contact`, is ignored.
 */
export function useStageHash(view: HashFields, shownSlide: ChartId | null, dispatch: Dispatch<StageAction>) {
  useEffect(() => {
    if (shownSlide === null) return;
    const next = serialiseHash({ ...view, slide: shownSlide });
    if (window.location.hash !== next) {
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${next}`);
    }
  }, [shownSlide, view]);

  useEffect(() => {
    const onHashChange = () => {
      if (hasStageFields(window.location.hash)) {
        dispatch({ type: "hash_loaded", fields: parseHash(window.location.hash) });
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [dispatch]);
}
