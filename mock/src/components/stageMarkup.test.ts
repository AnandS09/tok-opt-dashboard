/**
 * Server-rendered markup of the contents column, the phone picker and the grid
 * view (spec 15.8, 15.9, 15.13). Layout and computed styles are measured in a
 * browser by `scripts/check-stage-render.mjs`; these tests hold what the markup
 * itself says: the items, their names, the numbers that must not be there.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { chartRegistry } from "../charts/registry";
import { compute } from "../compute";
import type { Results } from "../contract";
import { listCharts } from "../store/chartListing";
import { loadFixtureScenario, loadFixtureTables, restoreFetch } from "../test/fixtures";
import { Column, Picker } from "./ChartIndex";
import { GridView } from "./GridView";

let results: Results;

beforeAll(async () => {
  const tables = await loadFixtureTables();
  const s1 = await loadFixtureScenario("s1");
  restoreFetch();
  results = compute(s1, tables);
});

const listed = listCharts(chartRegistry, chartRegistry);
const noop = () => {};

const text = (html: string) =>
  html
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function items(html: string, tag: "li"): string[] {
  return [...html.matchAll(new RegExp(`<${tag}[ >][\\s\\S]*?</${tag}>`, "g"))].map((m) => m[0]);
}

function column(active: number): string {
  return renderToStaticMarkup(
    createElement(Column, { charts: listed, active, onPick: noop, gridOpen: false, onGrid: noop, gridButton: null }),
  );
}

function picker(active: number): string {
  return renderToStaticMarkup(
    createElement(Picker, { charts: listed, active, onPick: noop, gridOpen: false, onGrid: noop, gridButton: null }),
  );
}

describe("the contents column (spec 15.8)", () => {
  it("has the heading Charts with the count and one item per listed chart", () => {
    const html = column(0);
    expect(html).toMatch(/<h2[^>]*class="chart-index__heading"[^>]*>\s*<span>Charts<\/span><span[^>]*>10<\/span>/);
    expect(items(html, "li")).toHaveLength(10);
  });

  it("gives each item a glyph of its form and its title, with no digit and no id", () => {
    const rows = items(column(0), "li");
    rows.forEach((row, i) => {
      expect(row).toContain('class="chart-glyph chart-index__glyph"');
      expect(row).toContain(`data-form="${listed[i].glyph}"`);
      const title = row.match(/<span class="chart-index__title">([^<]*)<\/span>/)?.[1];
      expect(title).toBe(listed[i].title);
      expect(text(row)).not.toMatch(/\d/);
      expect(text(row)).not.toMatch(/\bC\d+\b/);
    });
  });

  it("marks the chart in focus with aria-current and no other item", () => {
    for (let active = 0; active < chartRegistry.length; active += 1) {
      const rows = items(column(active), "li");
      const current = rows.flatMap((row, i) => (row.includes('aria-current="true"') ? [i] : []));
      expect(current).toEqual([active]);
    }
  });

  it("lists the charts not built yet as inert, announced items", () => {
    const rows = items(column(0), "li");
    rows.forEach((row, i) => {
      const planned = listed[i].state === "planned";
      expect(row.includes('aria-disabled="true"'), listed[i].id).toBe(planned);
      expect(row.includes("planned, not built yet"), listed[i].id).toBe(planned);
    });
  });

  it("has the Grid view button under the list", () => {
    const html = column(0);
    expect(html.lastIndexOf("Grid view")).toBeGreaterThan(html.lastIndexOf("</ol>"));
  });
});

describe("the phone picker (spec 15.8)", () => {
  it("shows the focused chart's title and glyph with Grid view beside it and the full list behind it", () => {
    const html = picker(2);
    const row = html.match(/<div class="chart-index__row">[\s\S]*?<\/div><button[\s\S]*?<\/button><\/div>/)?.[0] ?? "";
    expect(row).toContain("Grid view");
    expect(row).toMatch(/class="chart-index__toggle"[^>]*aria-expanded="false"/);
    expect(row).toContain(listed[2].title);
    expect(items(html, "li")).toHaveLength(10);
  });

  it("has no position count and no digit in the picker or the list", () => {
    for (let active = 0; active < chartRegistry.length; active += 1) {
      const html = picker(active);
      expect(text(html)).not.toMatch(/\d/);
      expect(html).not.toMatch(/\d\s*\/\s*\d/);
    }
  });

  it("keeps the list closed until the picker opens it", () => {
    expect(picker(0)).toMatch(/<ol[^>]*\bhidden\b/);
  });
});

function grid(charts = listed, active = 0): string {
  return renderToStaticMarkup(
    createElement(GridView, {
      charts,
      slides: chartRegistry,
      results,
      goalView: { goal: "G1", solve: null, stale: false, error: null },
      active,
      onPick: noop,
    }),
  );
}

describe("the grid view (spec 15.9, 15.13)", () => {
  it("has one tile per listed chart, titled with the registry title", () => {
    const html = grid();
    const tiles = items(html, "li").filter((li) => li.includes('class="grid-view__cell'));
    expect(tiles).toHaveLength(10);
    tiles.forEach((tile, i) => {
      expect(tile.match(/<span class="grid-view__title">([^<]*)<\/span>/)?.[1]).toBe(listed[i].title);
    });
  });

  it("gives every built chart a button named by its title alone, with no digit, and the rest a stand-in tile", () => {
    const html = grid();
    const buttons = [...html.matchAll(/<button[^>]*class="grid-view__item"[^>]*>([\s\S]*?)<\/button>/g)];
    expect(buttons).toHaveLength(chartRegistry.length);
    buttons.forEach((b, i) => {
      expect(text(b[1])).toBe(chartRegistry[i].title);
      expect(text(b[1])).not.toMatch(/\d/);
    });
    expect([...html.matchAll(/Planned chart/g)]).toHaveLength(10 - chartRegistry.length);
    expect(html).toContain("grid-view__cell--planned");
  });

  it("makes the first two tiles of ten wide, as the column count and the rule give", () => {
    const html = grid();
    expect(html).toMatch(/data-columns="4"/);
    expect(html).toMatch(/data-wide="2"/);
    const tiles = items(html, "li").filter((li) => li.includes('class="grid-view__cell'));
    expect(tiles.map((t) => t.includes("grid-view__cell--wide"))).toEqual([
      true,
      true,
      ...Array<boolean>(8).fill(false),
    ]);
  });

  it("shows the takeaway beside a wide tile's picture and not beside a normal tile's", () => {
    const tiles = items(grid(), "li").filter((li) => li.includes('class="grid-view__cell'));
    tiles.forEach((tile, i) => {
      const has = tile.includes("grid-view__takeaway");
      expect(has, listed[i].id).toBe(i < 2);
    });
    // The takeaway is the chart's accessible-name sentence.
    expect(text(tiles[0])).toContain(chartRegistry[0].caption(results).slice(0, 40));
  });

  it("leaves the wide tile's takeaway out of the button, so the tile's name stays the title", () => {
    const tile = items(grid(), "li")[0];
    const button = tile.match(/<button[\s\S]*?<\/button>/)?.[0] ?? "";
    expect(button).not.toContain("takeaway");
    expect(text(button)).toBe(chartRegistry[0].title);
  });

  it("makes every other count follow the rule at the unmeasured (1280px page) width", () => {
    const expected: [number, string, string][] = [
      [4, "4", "0"],
      [5, "3", "1"],
      [6, "3", "0"],
      [7, "4", "1"],
      [9, "3", "0"],
    ];
    for (const [count, columns, wide] of expected) {
      const some = listed.slice(0, count);
      const html = grid(some);
      expect(html, `${count}`).toContain(`data-columns="${columns}"`);
      expect(html, `${count}`).toContain(`data-wide="${wide}"`);
    }
  });
});

describe("no ordinal numbers in the stage's text (spec 15.9)", () => {
  it("has no 'Figure n' in the column, the picker or the grid", () => {
    for (const html of [column(0), picker(0), grid()]) {
      expect(text(html)).not.toMatch(/figure\s*\d/i);
    }
  });
});
