/**
 * The messages between the page and the solver worker (spec 6.2: the G2 and
 * G3 solves run off the main thread), and the handler the worker runs. The
 * handler is a plain function so it can run without a worker.
 */

import type { Scenario, SolveAxis, SolveResult, Tables } from "../contract";
import { solveAtBudget } from "./solve";

export type SolveWorkerRequest =
  /** Hands the worker the tables once, so a solve request carries only the scenario. */
  | { type: "init"; tables: Tables }
  | { type: "solve"; id: number; scenario: Scenario; axis: SolveAxis };

export type SolveWorkerResponse =
  | { type: "result"; id: number; result: SolveResult }
  | { type: "error"; id: number; message: string };

/**
 * A handler holding the tables it was last given. `init` returns null; a
 * `solve` returns its result, or an error response when no tables arrived
 * yet or the solve threw.
 */
export function createSolveHandler(): (request: SolveWorkerRequest) => SolveWorkerResponse | null {
  let tables: Tables | null = null;
  return (request) => {
    if (request.type === "init") {
      tables = request.tables;
      return null;
    }
    if (tables === null) {
      return { type: "error", id: request.id, message: "the solver worker has no tables yet" };
    }
    try {
      return { type: "result", id: request.id, result: solveAtBudget(request.scenario, tables, request.axis) };
    } catch (error) {
      return { type: "error", id: request.id, message: error instanceof Error ? error.message : String(error) };
    }
  };
}
