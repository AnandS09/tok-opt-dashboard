import { afterEach, expect, it, vi } from "vitest";
import { loadScenario, loadTables } from "../data/load";
import { compute, computeCore } from "./index";

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

async function loadS1() {
  serveFixtures();
  const tables = await loadTables("data");
  const { scenario } = await loadScenario("data", "s1");
  return { tables, scenario };
}

const greys = (r: ReturnType<typeof compute>) =>
  r.today_alternatives.filter((a) => a.is_grey).map((a) => a.pattern_id);

it("ranks Today options per stage, so the grey options differ by stage", async () => {
  const { tables, scenario } = await loadS1();
  expect(greys(compute({ ...scenario, stage_today: "seats" }, tables))).not.toEqual(
    greys(compute({ ...scenario, stage_today: "api" }, tables)),
  );
});

it("derives the best single option from proprietary offers only", async () => {
  const { tables, scenario } = await loadS1();
  const best = compute({ ...scenario, workload_mix: { software_design: 1 } }, tables)
    .today_alternatives.find((a) => a.pattern_id === "best_single");
  expect(best?.detail).toMatch(/^mid_a /);
});

it("computeCore is compute without the Today options", async () => {
  const { tables, scenario } = await loadS1();
  const { today_alternatives, ...rest } = compute(scenario, tables);
  expect(today_alternatives.length).toBeGreaterThan(0);
  expect(computeCore(scenario, tables)).toEqual(rest);
});

it("applies a G4 trade-off to the InfraVana side only", async () => {
  const { tables, scenario } = await loadS1();
  const own = compute({ ...scenario, goal: "G4" }, tables);
  const traded = compute({ ...scenario, goal: "G4", tradeoff: { quality_step: 3, speed_step: 1 } }, tables);
  expect(traded.allocation.today).toEqual(own.allocation.today);
  expect(traded.quality_floor_by_workload).toEqual(own.quality_floor_by_workload);
  expect(own.infravana_side.quality_floor_by_workload).toEqual(own.quality_floor_by_workload);
  expect(traded.infravana_side.quality_floor_by_workload.software_design).toBeLessThan(78);
  expect(traded.infravana_side.latency_class).toBe("standard");
});
