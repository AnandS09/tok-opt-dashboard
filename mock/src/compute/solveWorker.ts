/**
 * The solver web worker (spec 6.2): runs `solveAtBudget` off the main
 * thread. Start it through `SolveClient`, not directly.
 */

import { createSolveHandler, type SolveWorkerRequest, type SolveWorkerResponse } from "./solveProtocol";

/** The part of the worker global scope this file uses (the DOM lib types `self` as a window). */
interface WorkerScope {
  onmessage: ((event: MessageEvent<SolveWorkerRequest>) => void) | null;
  postMessage(message: SolveWorkerResponse): void;
}

const scope = self as unknown as WorkerScope;
const handle = createSolveHandler();

scope.onmessage = (event) => {
  const response = handle(event.data);
  if (response !== null) scope.postMessage(response);
};
