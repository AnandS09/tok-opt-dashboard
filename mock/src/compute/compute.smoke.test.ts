import { afterEach, expect, it, vi } from "vitest";
import { loadScenario, loadTables } from "../data/load";
import { compute } from "./index";

// Every fixture file, read as text at build time, so the test needs no
// filesystem types and no server.
const FILES = import.meta.glob("../../public/data/**/*.{csv,json}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function serveFixtures(): void {
  vi.stubGlobal("fetch", async (url: string) => {
    const text = FILES[`../../public/data/${url.replace(/^data\//, "")}`];
    return text === undefined
      ? { ok: false, status: 404, text: async () => "" }
      : { ok: true, status: 200, text: async () => text };
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

it("computes the default S1 numbers from the fixture files", async () => {
  serveFixtures();
  const tables = await loadTables("data");
  const { scenario } = await loadScenario("data", "s1");
  const results = compute(scenario, tables);

  const infravanaSpend = results.allocation.infravana
    .filter((segment) => segment.kind !== "savings")
    .reduce((sum, segment) => sum + segment.usd, 0);
  expect(results.allocation.total_usd).toBeCloseTo(100012.5, 2);
  expect(infravanaSpend).toBeCloseTo(70440.09, 2);
  expect(results.comparator).toBe("api");
});
