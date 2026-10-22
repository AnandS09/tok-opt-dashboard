import { afterEach, vi } from "vitest";
import type { Scenario, Tables } from "../contract";
import { loadScenario, loadTables } from "../data/load";

/**
 * Test helpers: the real fixture files behind a stubbed `fetch`, so a test
 * loads exactly what the page loads, or loads the same files with one line
 * changed (to prove the loader fails loudly) without touching the fixtures.
 */

// Every fixture file, read as text at build time (the harness of
// compute.smoke.test.ts), keyed "../../public/data/<name>".
const FILES = import.meta.glob("../../public/data/**/*.{csv,json}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** The raw text of a fixture file, by its name under `public/data` ("buying_patterns.csv", "scenarios/s1.json"). */
export function fixtureText(name: string): string {
  const text = FILES[`../../public/data/${name}`];
  if (text === undefined) throw new Error(`test helper: no fixture file "${name}"`);
  return text;
}

/**
 * Stubs `fetch` to serve the fixture files, with `overrides` (file name to
 * replacement text, or null for "not found") replacing the named files. Undo
 * with `restoreFetch`.
 */
export function serveFixtures(overrides: Readonly<Record<string, string | null>> = {}): void {
  vi.stubGlobal("fetch", async (url: string) => {
    const name = url.replace(/^data\//, "");
    const text = name in overrides ? overrides[name] : FILES[`../../public/data/${name}`];
    return text === undefined || text === null
      ? { ok: false, status: 404, text: async () => "" }
      : { ok: true, status: 200, text: async () => text };
  });
}

export function restoreFetch(): void {
  vi.unstubAllGlobals();
}

/** Registers the per-test `fetch` clean-up; call once at the top of a test file that uses `serveFixtures`. */
export function cleanUpFetchAfterEach(): void {
  afterEach(restoreFetch);
}

/** The fixtures as the loader returns them, optionally with files replaced. */
export async function loadFixtureTables(overrides: Readonly<Record<string, string | null>> = {}): Promise<Tables> {
  serveFixtures(overrides);
  return loadTables("data");
}

/** A fixture scenario (`"s1"`, `"s2"`, `"hardware_heavy"`), as the parser returns it. */
export async function loadFixtureScenario(
  id: "s1" | "s2" | "hardware_heavy",
  overrides: Readonly<Record<string, string | null>> = {},
): Promise<Scenario> {
  serveFixtures(overrides);
  return (await loadScenario("data", id)).scenario;
}

/** A deep copy that a test may edit freely. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}

/** The data lines of a CSV text (header excluded). */
export function csvDataLines(text: string): string[] {
  return text.trimEnd().split("\n").slice(1);
}

/** Returns `text` with its first data line that starts with `prefix` replaced by `replacement`. */
export function replaceCsvLine(text: string, prefix: string, replacement: string): string {
  const lines = text.trimEnd().split("\n");
  const index = lines.findIndex((line, i) => i > 0 && line.startsWith(prefix));
  if (index < 0) throw new Error(`test helper: no line starting "${prefix}"`);
  lines[index] = replacement;
  return `${lines.join("\n")}\n`;
}

/** Returns `text` with `line` added at the end. */
export function appendCsvLine(text: string, line: string): string {
  return `${text.trimEnd()}\n${line}\n`;
}

/** The 1-based line number in the file (header = line 1) of the first data line starting with `prefix`. */
export function csvLineNumber(text: string, prefix: string): number {
  const index = text.trimEnd().split("\n").findIndex((line, i) => i > 0 && line.startsWith(prefix));
  if (index < 0) throw new Error(`test helper: no line starting "${prefix}"`);
  return index + 1;
}

/** InfraVana's spend in a result: every allocation segment except the savings ones. */
export function infravanaSpend(results: { allocation: { infravana: { kind: string; usd: number }[] } }): number {
  return results.allocation.infravana.filter((s) => s.kind !== "savings").reduce((sum, s) => sum + s.usd, 0);
}

/** `scenario` with its people, budget and (when given) customers replaced. */
export function withBaseline(scenario: Scenario, users: number, budgetUsd: number, customers?: number): Scenario {
  return {
    ...scenario,
    baseline: {
      ...scenario.baseline,
      users,
      budget_usd_per_quarter: budgetUsd,
      ...(customers === undefined ? {} : { customers }),
    },
  };
}
