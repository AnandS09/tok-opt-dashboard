import { beforeAll, describe, expect, it } from "vitest";
import { compute } from "../compute";
import type { Results, Scenario, Tables } from "../contract";
import { beginIntake, companyOf, setBudget, setCustomers, setSpeed, setUsers } from "../store/intake";
import { loadFixtureScenario, loadFixtureTables, restoreFetch } from "../test/fixtures";
import { realTokens } from "../test/cssTokens";
import { allocationCsv, buildAllocationOption, drawnBars, MIN_BLOCK_PX } from "./c1Allocation";
import { foldSlivers, planBar, type PlannedSegment } from "./c1Plan";
import { seriesOf } from "./dev/renderCheck";
import { worstProvenance } from "./format";
import type { Dims } from "./useEChart";

/**
 * A spend segment too narrow to read as a block is folded into its neighbour in the
 * drawing of C1 (a 2px sliver between two paper gaps looked like a rendering fault), and
 * stays named in the tooltip, the screen-reader table and the sources.
 */

const t = realTokens();
const WIDE: Dims = { width: 1280, height: 480 };
const PHONE: Dims = { width: 390, height: 700 };

const seg = (label: string, usd: number, tone: PlannedSegment["tone"] = "spend"): PlannedSegment => ({
  label,
  usd,
  tone,
  kind: tone === "spend" ? "provider" : "savings",
  provenance: "modelled",
  members: [],
});

describe("foldSlivers", () => {
  it("leaves a bar alone when every block is wide enough", () => {
    const planned = [seg("A", 100), seg("B", 50), seg("Saved", 40, "arbitrage")];
    expect(foldSlivers(planned, 1, 8)).toEqual(planned);
  });

  it("folds a narrow block into the one before it, keeping the total and the name", () => {
    const out = foldSlivers([seg("A", 100), seg("B", 3), seg("Saved", 40, "arbitrage")], 1, 8);
    expect(out.map((s) => [s.label, s.usd])).toEqual([["A", 103], ["Saved", 40]]);
    expect(out[0]?.members).toEqual(["B"]);
  });

  it("folds a narrow first block into the one after it", () => {
    const out = foldSlivers([seg("A", 3), seg("B", 100)], 1, 8);
    expect(out.map((s) => [s.label, s.usd, s.members])).toEqual([["B", 103, ["A"]]]);
  });

  it("never folds a saving, and folds nothing out of a bar with one spend block", () => {
    const only = [seg("A", 2), seg("Saved", 1, "routing")];
    expect(foldSlivers(only, 1, 8)).toEqual(only);
  });

  it("measures in pixels: the same dollars fold on a narrow plot and stand on a wide one", () => {
    const planned = [seg("A", 1000), seg("B", 20)];
    expect(foldSlivers(planned, 0.2, 8)).toHaveLength(1);
    expect(foldSlivers(planned, 1, 8)).toHaveLength(2);
  });

  it("keeps the worst provenance and every folded name", () => {
    const a = seg("A", 100);
    const b = { ...seg("B", 1), provenance: "vendor_reported" as const };
    const c = seg("C", 1);
    const out = foldSlivers([a, b, c], 1, 8);
    expect(out).toHaveLength(1);
    expect(out[0]?.members).toEqual(["B", "C"]);
    expect(out[0]?.usd).toBe(102);
    expect(out[0]?.provenance).toBe(worstProvenance(["modelled", "vendor_reported", "modelled"]));
  });
});

describe("the sliver of the review (software company, 120 people, 200,000 customers, $150K a quarter)", () => {
  let tables: Tables;
  let results: Results;
  beforeAll(async () => {
    tables = await loadFixtureTables();
    const s1: Scenario = await loadFixtureScenario("s1");
    restoreFetch();
    let s = beginIntake(s1, companyOf("software"), tables);
    s = setSpeed(setBudget(setCustomers(setUsers(s, 120), 200_000), 150_000), "standard");
    results = compute(s, tables);
  });

  it("has an InfraVana channel segment under the minimum width in the data", () => {
    const own = planBar(results.allocation.infravana, "infravana").find((s) => s.label.startsWith("Own hardware"));
    expect(own).toBeDefined();
    expect((own?.usd ?? 0) / results.allocation.total_usd).toBeLessThan(0.02);
  });

  it.each([
    ["1280", WIDE],
    ["390", PHONE],
  ])("draws one channel block and one Saved block for InfraVana at %s, and names the folded segment in its tooltip", (_name, dims) => {
    const option = buildAllocationOption(results, "stage", t, dims);
    const bars = seriesOf(option).filter((s) => s.type !== "custom");
    const inRow = (row: number) => bars.filter((s) => (s.data as unknown[])[row] != null);
    expect(inRow(1).map((s) => s.name)).toEqual(["AWS EC2", "Saved"]);
    expect(drawnBars(results, "stage", t, dims).infravana.filter((s) => s.tone === "spend")).toHaveLength(1);
    // Every drawn block is at least MIN_BLOCK_PX wide, so no sliver is left between two gaps.
    const gaps = seriesOf(option).find((s) => s.type === "custom");
    expect((gaps?.data as unknown[]).length).toBe(1);
    const tip = (option as { tooltip: { formatter: (p: unknown) => string } }).tooltip.formatter({ seriesIndex: bars.indexOf(inRow(1)[0] as (typeof bars)[number]) });
    expect(tip).toContain("Includes Own hardware (MI355X)");
    expect(MIN_BLOCK_PX).toBeGreaterThanOrEqual(8);
  });

  it("keeps the folded segment in the screen-reader data (the CSV), by name", () => {
    expect(allocationCsv(results)).toContain("Own hardware (MI355X)");
  });
});
