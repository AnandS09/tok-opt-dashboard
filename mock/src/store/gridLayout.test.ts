import { describe, expect, it } from "vitest";
import {
  allowedColumns,
  balancedGrid,
  CHART_GRID_DESKTOP,
  CHART_GRID_PHONE,
  fillsEveryRow,
  type GridSpec,
} from "./gridLayout";

/** The page's content width at 1280px (`--page-max-width`), at 768px and at 375px. */
const W1280 = 1040;
const W768 = 768 - 32;
const W375 = 375 - 32;

/** Independent reference: lay the tiles out row by row and list each row's occupied tracks. */
function rowsOf(count: number, wide: number, columns: number): number[][] | null {
  const rows: number[][] = [];
  let row: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const span = i < wide ? 2 : 1;
    if (span > columns) return null;
    if (row.reduce((a, b) => a + b, 0) + span > columns) return null; // would leave an empty track
    row.push(span);
    if (row.reduce((a, b) => a + b, 0) === columns) {
      rows.push(row);
      row = [];
    }
  }
  return row.length === 0 ? rows : null;
}

/** Independent reference for the rule: the best of every (columns, wide) pair that fills. */
function reference(count: number, width: number, spec: GridSpec) {
  const widest = Math.min(spec.maxColumns, Math.max(spec.minColumns, Math.floor(width / spec.minCell)));
  const options: { columns: number; wide: number; rows: number }[] = [];
  for (let columns = spec.minColumns; columns <= widest; columns += 1) {
    for (let wide = 0; wide <= count; wide += 1) {
      const rows = rowsOf(count, wide, columns);
      if (rows) options.push({ columns, wide, rows: rows.length });
    }
  }
  const fewestRows = Math.min(...options.map((o) => o.rows));
  const atFewest = options.filter((o) => o.rows === fewestRows);
  const fewestWide = Math.min(...atFewest.map((o) => o.wide));
  return atFewest.filter((o) => o.wide === fewestWide);
}

describe("allowed columns come from the width (spec 15.13 rule 2)", () => {
  it("is the width over the cell, rounded down, kept inside the grid's range", () => {
    expect(allowedColumns(W1280, CHART_GRID_DESKTOP)).toBe(4);
    expect(allowedColumns(W768, CHART_GRID_DESKTOP)).toBe(3);
    expect(allowedColumns(480, CHART_GRID_DESKTOP)).toBe(2);
    expect(allowedColumns(300, CHART_GRID_DESKTOP)).toBe(2); // never below the minimum
    expect(allowedColumns(5000, CHART_GRID_DESKTOP)).toBe(4); // never above the maximum
    expect(allowedColumns(W375, CHART_GRID_PHONE)).toBe(2);
  });
});

describe("the chart grid at 1280px (spec 15.13 rule 5)", () => {
  const cases: [number, number, number][] = [
    // count, columns, wide
    [4, 4, 0],
    [5, 3, 1],
    [6, 3, 0],
    [7, 4, 1],
    [9, 3, 0],
    [10, 4, 2],
  ];
  it.each(cases)("%i tiles: %i columns, %i wide", (count, columns, wide) => {
    const layout = balancedGrid(count, W1280, CHART_GRID_DESKTOP);
    expect(layout.columns).toBe(columns);
    expect(layout.wide).toBe(wide);
    expect(layout.rows * columns).toBe(count + wide);
  });
});

describe("the chart grid on a phone (spec 15.13 rule 5)", () => {
  for (let count = 1; count <= 12; count += 1) {
    it(`${count} tiles: 2 columns, ${count % 2} wide`, () => {
      const layout = balancedGrid(count, W375, CHART_GRID_PHONE);
      expect(layout.columns).toBe(2);
      expect(layout.wide).toBe(count % 2);
    });
  }
});

describe("the rule at 768px, where three columns fit", () => {
  it("uses three columns where they fill and two where they cannot", () => {
    expect(balancedGrid(6, W768, CHART_GRID_DESKTOP)).toMatchObject({ columns: 3, wide: 0 });
    expect(balancedGrid(9, W768, CHART_GRID_DESKTOP)).toMatchObject({ columns: 3, wide: 0 });
    expect(balancedGrid(5, W768, CHART_GRID_DESKTOP)).toMatchObject({ columns: 3, wide: 1 });
    expect(balancedGrid(4, W768, CHART_GRID_DESKTOP)).toMatchObject({ columns: 2, wide: 0 });
    // Two wide tiles cannot sit in a three-column row, so ten tiles use two columns, not three.
    expect(balancedGrid(10, W768, CHART_GRID_DESKTOP)).toMatchObject({ columns: 2, wide: 0 });
    expect(balancedGrid(7, W768, CHART_GRID_DESKTOP)).toMatchObject({ columns: 2, wide: 1 });
  });
});

describe("the rule for every count and width", () => {
  const widths = [480, 560, 700, W768, 900, 1000, W1280, 1400];
  const specs: [string, GridSpec][] = [
    ["desktop", CHART_GRID_DESKTOP],
    ["phone", CHART_GRID_PHONE],
    ["answer grid", { minCell: 300, minColumns: 1, maxColumns: 3 }],
    ["benefit boxes", { minCell: 192, minColumns: 2, maxColumns: 3 }],
  ];
  for (const [name, spec] of specs) {
    it(`${name}: every row is full, the layout is the reference's, wide tiles are as few as they can be`, () => {
      for (const width of widths) {
        for (let count = 1; count <= 30; count += 1) {
          const layout = balancedGrid(count, width, spec);
          const where = `${name} count ${count} width ${width}`;
          expect(fillsEveryRow(count, layout.wide, layout.columns), where).toBe(true);
          expect(layout.columns, where).toBeGreaterThanOrEqual(spec.minColumns);
          expect(layout.columns, where).toBeLessThanOrEqual(allowedColumns(width, spec));
          expect(rowsOf(count, layout.wide, layout.columns)?.length, where).toBe(layout.rows);
          const best = reference(count, width, spec);
          expect(
            best.some((o) => o.columns === layout.columns && o.wide === layout.wide && o.rows === layout.rows),
            where,
          ).toBe(true);
          // No smaller k fills the same number of columns.
          for (let wide = 0; wide < layout.wide; wide += 1) {
            expect(fillsEveryRow(count, wide, layout.columns), `${where} wide ${wide}`).toBe(false);
          }
        }
      }
    });
  }

  it("never takes more rows than the plain grid of the same width and never fewer than the tiles allow", () => {
    for (let count = 1; count <= 30; count += 1) {
      const layout = balancedGrid(count, W1280, CHART_GRID_DESKTOP);
      expect(layout.rows).toBeLessThanOrEqual(Math.ceil(count / 2));
      expect(layout.rows).toBeGreaterThanOrEqual(Math.ceil(count / 4));
    }
  });
});

describe("fillsEveryRow", () => {
  it("rejects a half-empty last row and a wide tile that would leave a gap", () => {
    expect(fillsEveryRow(5, 0, 3)).toBe(false);
    expect(fillsEveryRow(5, 1, 3)).toBe(true);
    expect(fillsEveryRow(7, 2, 3)).toBe(false); // the second wide tile starts on the last track
    expect(fillsEveryRow(10, 2, 4)).toBe(true);
    expect(fillsEveryRow(3, 0, 1)).toBe(true);
  });
});
