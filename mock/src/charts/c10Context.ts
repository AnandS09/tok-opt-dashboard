import { createContext } from "react";
import type { Scenario, Tables } from "../contract";
import type { C10View } from "./c10Data";

/**
 * What C10 needs besides `Results`: the scenario and tables its frontier is
 * swept over, and the view (quality or speed) the page address holds. Every
 * other chart draws from `Results` alone, so these arrive through a context the
 * stage provides rather than through the props all charts share.
 */
export interface C10Inputs {
  scenario: Scenario;
  tables: Tables;
  /** The view asked for; `effectiveView` says which one is drawn. */
  view: C10View;
  setView: (view: C10View) => void;
}

export const C10Context = createContext<C10Inputs | null>(null);
