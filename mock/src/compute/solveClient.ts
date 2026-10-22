/**
 * The page's side of the solver worker (spec 6.2): a request starts after a
 * 150 ms debounce, a newer request cancels the one before it, and while a
 * new value is on its way the previous one is reported as stale so the page
 * can show it dimmed. The solve itself never runs on the calling thread.
 *
 * The snapshot object keeps its identity until something changes, so the
 * client plugs into `useSyncExternalStore(client.subscribe, client.getSnapshot)`.
 */

import type { Scenario, SolveAxis, SolveResult, Tables } from "../contract";
import type { SolveWorkerRequest, SolveWorkerResponse } from "./solveProtocol";

/** Spec 6.2: a solve starts this long after the last change [ASSUMPTION]. */
export const SOLVE_DEBOUNCE_MS = 150;

/** The worker as the client uses it, so a test can stand in for a real `Worker`. */
export interface SolveWorkerHandle {
  post(request: SolveWorkerRequest): void;
  /** Stops the worker at once, abandoning any solve it is running. */
  terminate(): void;
  /** Registers the one listener for responses and for a failure of the worker itself. */
  listen(onResponse: (response: SolveWorkerResponse) => void, onFailure: (message: string) => void): void;
}

/** The module worker that runs `solveAtBudget`. Vite bundles it from this exact call shape. */
function createModuleWorker(): SolveWorkerHandle {
  const worker = new Worker(new URL("./solveWorker.ts", import.meta.url), { type: "module" });
  return {
    post: (request) => worker.postMessage(request),
    terminate: () => worker.terminate(),
    listen: (onResponse, onFailure) => {
      worker.onmessage = (event: MessageEvent<SolveWorkerResponse>) => onResponse(event.data);
      worker.onerror = (event) => onFailure(event.message || "the solver worker failed");
    },
  };
}

export interface SolveSnapshot {
  /** `idle` before any request; `solving` from a request until its result; `ready`; `error`. */
  status: "idle" | "solving" | "ready" | "error";
  /** The latest solved value, or null before the first one arrives. */
  result: SolveResult | null;
  /** True when `result` belongs to an earlier request than the current one (show it dimmed). */
  stale: boolean;
  /** The failure message when `status` is `error`, else null. */
  error: string | null;
}

export interface SolveClientOptions {
  tables: Tables;
  /** Creates the worker; defaults to the module worker. */
  createWorker?: () => SolveWorkerHandle;
  /** Debounce in milliseconds; defaults to `SOLVE_DEBOUNCE_MS`. */
  debounceMs?: number;
}

const IDLE: SolveSnapshot = { status: "idle", result: null, stale: false, error: null };

export class SolveClient {
  private tables: Tables;
  private readonly createWorker: () => SolveWorkerHandle;
  private readonly debounceMs: number;

  private worker: SolveWorkerHandle | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private sequence = 0;
  /** The id of the request the worker is running, if any. */
  private inFlight: number | null = null;
  /** The key of the latest request, so a repeat of it is ignored. */
  private requestedKey: string | null = null;
  private snapshot: SolveSnapshot = IDLE;
  private readonly listeners = new Set<() => void>();
  private disposed = false;

  constructor(options: SolveClientOptions) {
    this.tables = options.tables;
    this.createWorker = options.createWorker ?? createModuleWorker;
    this.debounceMs = options.debounceMs ?? SOLVE_DEBOUNCE_MS;
  }

  /** The current state. The same object is returned until the state changes. */
  getSnapshot = (): SolveSnapshot => this.snapshot;

  /** Calls `listener` after every change of the snapshot; returns the function that stops it. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Asks for a solve of `scenario` on `axis`. It starts after the debounce; a
   * request made before then replaces this one, and one made while it runs
   * stops the worker and starts again, so only the latest request is ever
   * answered. Repeating the latest request changes nothing.
   */
  request(scenario: Scenario, axis: SolveAxis): void {
    if (this.disposed) return;
    const key = JSON.stringify([scenario, axis]);
    if (key === this.requestedKey) return;
    this.requestedKey = key;

    this.clearTimer();
    this.cancelInFlight();
    this.sequence += 1;
    const id = this.sequence;
    this.publish({ status: "solving", result: this.snapshot.result, stale: this.snapshot.result !== null, error: null });
    this.timer = setTimeout(() => {
      this.timer = null;
      this.dispatch(id, scenario, axis);
    }, this.debounceMs);
  }

  /**
   * Replaces the tables. The pending and running requests are dropped and the
   * value shown becomes stale; call `request` again to solve against the new tables.
   */
  setTables(tables: Tables): void {
    if (this.disposed) return;
    this.tables = tables;
    this.clearTimer();
    this.stopWorker();
    this.requestedKey = null;
    this.publish({ status: "idle", result: this.snapshot.result, stale: this.snapshot.result !== null, error: null });
  }

  /** Stops the timer and the worker. The client ignores every later call. */
  dispose(): void {
    this.disposed = true;
    this.clearTimer();
    this.stopWorker();
    this.listeners.clear();
  }

  private dispatch(id: number, scenario: Scenario, axis: SolveAxis): void {
    try {
      if (this.worker === null) {
        const worker = this.createWorker();
        worker.listen(
          (response) => this.onResponse(response),
          (message) => this.onFailure(message),
        );
        worker.post({ type: "init", tables: this.tables });
        this.worker = worker;
      }
      this.inFlight = id;
      this.worker.post({ type: "solve", id, scenario, axis });
    } catch (error) {
      this.onFailure(error instanceof Error ? error.message : String(error));
    }
  }

  private onResponse(response: SolveWorkerResponse): void {
    // An answer to a request the page has since replaced is dropped.
    if (response.id !== this.inFlight) return;
    this.inFlight = null;
    if (response.type === "result") {
      this.publish({ status: "ready", result: response.result, stale: false, error: null });
    } else {
      this.requestedKey = null;
      this.publish({ status: "error", result: this.snapshot.result, stale: this.snapshot.result !== null, error: response.message });
    }
  }

  private onFailure(message: string): void {
    this.stopWorker();
    this.requestedKey = null;
    this.publish({ status: "error", result: this.snapshot.result, stale: this.snapshot.result !== null, error: message });
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  /** A running solve cannot be interrupted, so cancelling it means ending the worker; the next request starts a fresh one. */
  private cancelInFlight(): void {
    if (this.inFlight !== null) this.stopWorker();
  }

  private stopWorker(): void {
    this.worker?.terminate();
    this.worker = null;
    this.inFlight = null;
  }

  private publish(next: SolveSnapshot): void {
    this.snapshot = next;
    for (const listener of [...this.listeners]) listener();
  }
}
