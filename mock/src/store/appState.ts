import type { Scenario, ScenarioResponse, Tables } from "../contract";
import { withCustomers } from "./intake";

/** Everything the page holds. One `scenario` object is what all knobs write to (spec 5). */
export interface AppState {
  tables: Tables | null;
  tablesError: string | null;
  /** The scenario response as loaded: what was "understood", and what Reset restores. */
  response: ScenarioResponse | null;
  /** The live scenario, edited by the knobs. */
  scenario: Scenario | null;
  /** Which example is loaded (or loading). */
  exampleId: string | null;
  loadingExample: boolean;
  exampleError: string | null;
}

export type AppAction =
  | { type: "tables_loaded"; tables: Tables }
  | { type: "tables_failed"; message: string }
  | { type: "example_loading"; exampleId: string }
  | { type: "example_loaded"; exampleId: string; response: ScenarioResponse }
  | { type: "example_failed"; message: string }
  | { type: "scenario_edited"; update: (scenario: Scenario) => Scenario }
  /** A sentence answer: applied to the live scenario and to what Reset restores, so Undo keeps it. */
  | { type: "answer_edited"; update: (scenario: Scenario) => Scenario }
  | { type: "scenario_reset" }
  /** The guided questions are answered: their scenario becomes what Reset restores, no example is active. */
  | { type: "scenario_committed"; answered: string[] };

export const initialState: AppState = {
  tables: null,
  tablesError: null,
  response: null,
  scenario: null,
  exampleId: null,
  loadingExample: false,
  exampleError: null,
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "tables_loaded":
      return { ...state, tables: action.tables, tablesError: null };
    case "tables_failed":
      return { ...state, tablesError: action.message };
    case "example_loading":
      return { ...state, exampleId: action.exampleId, loadingExample: true, exampleError: null };
    case "example_loaded":
      return {
        ...state,
        exampleId: action.exampleId,
        loadingExample: false,
        exampleError: null,
        response: action.response,
        scenario: clone(action.response.scenario),
      };
    case "example_failed":
      return { ...state, loadingExample: false, exampleError: action.message };
    case "scenario_edited":
      return state.scenario && state.tables
        ? { ...state, scenario: withCustomers(action.update(state.scenario), state.tables) }
        : state;
    case "answer_edited":
      return state.scenario && state.response && state.tables
        ? {
            ...state,
            scenario: withCustomers(action.update(state.scenario), state.tables),
            response: { ...state.response, scenario: withCustomers(action.update(state.response.scenario), state.tables) },
          }
        : state;
    case "scenario_reset":
      return state.response ? { ...state, scenario: clone(state.response.scenario) } : state;
    case "scenario_committed":
      return state.response && state.scenario
        ? {
            ...state,
            exampleId: null,
            response: {
              ...state.response,
              scenario: clone(state.scenario),
              missing: state.response.missing.filter((m) => !action.answered.includes(m)),
            },
          }
        : state;
  }
}
