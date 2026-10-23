import { beforeAll, describe, expect, it } from "vitest";
import { compute } from "../compute";
import type { Results, Scenario, Tables } from "../contract";
import { beginIntake, companyOf, setBudget, setCustomers, setSpeed, setUsers } from "../store/intake";
import { loadFixtureScenario, loadFixtureTables, restoreFetch } from "../test/fixtures";
import { realTokens } from "../test/cssTokens";
import { c10Data, type C10View } from "./c10Data";
import { hits, placeNameLabel, stepPath, type LabelObstacles } from "./c10Label";
import { buildParetoOption } from "./c10Option";
import { nameLabelProblems } from "./dev/c10Check";
import { renderSvg } from "./dev/renderCheck";
import type { Dims } from "./useEChart";

/**
 * The frontier's name ("With InfraVana" in C10) is written where no line touches it: the
 * placement rules on their own, and the drawn svg of the review's scenario read back for lines
 * through the text, in both views at the stage widths of 1280 and 390.
 */

const t = realTokens();

describe("placeNameLabel", () => {
  const empty: LabelObstacles = {
    frontier: stepPath([[0, 50], [200, 50], [200, 80]]),
    frontierWidth: 3,
    setting: null,
    todayLines: [],
    todayWidth: 2,
    squares: [],
    plotWidth: 400,
    plotHeight: 200,
  };

  it("draws the frontier as ECharts steps it: vertical at the start of each interval", () => {
    expect(stepPath([[0, 10], [5, 20], [9, 30]])).toEqual([[0, 10], [0, 20], [5, 20], [5, 30], [9, 30]]);
  });

  it("puts the name under the first flat run that is long enough, clear of every line", () => {
    const spot = placeNameLabel(empty, 100, 16, 4, 3);
    expect(spot?.hits).toBe(0);
    // Under the run at y=50, not on it.
    expect(spot?.rect.y0).toBeGreaterThan(50 + 1.5);
  });

  it("slides past the setting's drop line", () => {
    const o: LabelObstacles = { ...empty, setting: { x: 40, y: 50, ring: 7 } };
    const spot = placeNameLabel(o, 100, 16, 4, 3);
    expect(spot?.hits).toBe(0);
    expect(hits(spot!.rect, o, 3)).toBe(0);
    expect(spot!.rect.x0).toBeGreaterThan(40);
  });

  it("goes above the run when a Today line runs just below it", () => {
    const o: LabelObstacles = { ...empty, todayLines: [60] };
    const spot = placeNameLabel(o, 100, 16, 4, 3);
    expect(spot?.hits).toBe(0);
    expect(spot!.rect.y1).toBeLessThan(50);
  });

  it("returns the least crowded spot, with its count, when every spot is crowded", () => {
    const o: LabelObstacles = { ...empty, todayLines: [30, 45, 62, 80, 100, 120, 140, 160, 180] };
    const spot = placeNameLabel(o, 100, 16, 4, 3);
    expect(spot?.hits).toBeGreaterThan(0);
  });

  it("counts a line through the text and not one that only passes near it", () => {
    const o: LabelObstacles = { ...empty, frontier: stepPath([[0, 10], [300, 10]]) };
    expect(hits({ x0: 20, x1: 120, y0: 8, y1: 24 }, o, 3)).toBe(1);
    expect(hits({ x0: 20, x1: 120, y0: 20, y1: 36 }, o, 3)).toBe(0);
  });
});

describe("the review's scenario (software company, 120 people, 200,000 customers, $150K a quarter)", () => {
  let tables: Tables;
  let scenario: Scenario;
  let results: Results;
  beforeAll(async () => {
    tables = await loadFixtureTables();
    const s1: Scenario = await loadFixtureScenario("s1");
    restoreFetch();
    let s = beginIntake(s1, companyOf("software"), tables);
    s = setSpeed(setBudget(setCustomers(setUsers(s, 120), 200_000), 150_000), "standard");
    scenario = s;
    results = compute(s, tables);
  });

  const widths: [string, Dims][] = [
    ["1280", { width: 1040, height: 400 }],
    ["390", { width: 358, height: 360 }],
  ];
  const views: C10View[] = ["quality", "speed"];

  it.each(views.flatMap((view) => widths.map(([name, dims]) => [view, name, dims] as const)))("%s view at %s: no line crosses the name", (view, _name, dims) => {
    const data = c10Data(results, scenario, tables, view);
    const svg = renderSvg(buildParetoOption(data, "stage", t, dims), dims);
    expect(svg).toContain("With InfraVana");
    expect(nameLabelProblems(svg, t, `${view} ${dims.width}`)).toEqual([]);
  });

  it("finds a line through the name in a drawing that has one", () => {
    const data = c10Data(results, scenario, tables, "speed");
    const dims: Dims = { width: 1040, height: 400 };
    const svg = renderSvg(buildParetoOption(data, "stage", t, dims), dims);
    // Move the text onto the frontier's first step.
    const frontier = new RegExp(`<path d="(M[^"]*)"[^>]*stroke="${t.accentStrong}"[^>]*stroke-width="3"`).exec(svg)?.[1] ?? "";
    const [px, py] = (frontier.match(/-?[\d.]+/g) ?? []).map(Number);
    const moved = svg.replace(/(<text[^>]*?transform=")translate\([\d.-]+ [\d.-]+\)("[^>]*>With InfraVana<)/, `$1translate(${px} ${py})$2`);
    expect(nameLabelProblems(moved, t, "moved")).not.toEqual([]);
  });
});
