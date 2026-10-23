import { describe, expect, it } from "vitest";
import { ANSWER_GRID, balancedGrid, placeCells, type GridSpec } from "./balancedGrid";

/** The chart grid of spec 15.13: 240px cells, 2 to 4 columns on desktop; 160px cells, 2 columns on phones. */
const CHART_DESKTOP: GridSpec = { minCellWidth: 240, minColumns: 2, maxColumns: 4 };
const CHART_PHONE: GridSpec = { minCellWidth: 160, minColumns: 2, maxColumns: 2 };

describe("balancedGrid: the results spec 15.13 lists for the chart grid", () => {
  it.each([
    [4, 4, 0],
    [5, 3, 1],
    [6, 3, 0],
    [7, 4, 1],
    [9, 3, 0],
    [10, 4, 2],
  ])("desktop, %i charts: %i columns, %i wide", (count, columns, wide) => {
    const layout = balancedGrid(count, 1040, CHART_DESKTOP);
    expect([layout.columns, layout.wide]).toEqual([columns, wide]);
  });

  it("phone: an even count gives 2 columns and no wide cell, an odd count 2 columns with 1 wide", () => {
    for (let count = 2; count <= 12; count++) {
      const layout = balancedGrid(count, 343, CHART_PHONE);
      expect([layout.columns, layout.wide]).toEqual([2, count % 2]);
    }
  });
});

describe("balancedGrid: the answer grid (spec 15.5)", () => {
  it("six answers are 3 x 2 with no wide cell at 1040px, five are 3 columns with Company wide", () => {
    expect(balancedGrid(6, 1040, ANSWER_GRID)).toMatchObject({ columns: 3, wide: 0, rows: 2 });
    expect(balancedGrid(5, 1040, ANSWER_GRID)).toMatchObject({ columns: 3, wide: 1, rows: 2, spans: [2, 1, 1, 1, 1] });
  });

  it("a phone is one column for any number of answers", () => {
    for (const count of [5, 6]) {
      expect(balancedGrid(count, 343, ANSWER_GRID)).toMatchObject({ columns: 1, wide: 0, rows: count });
      expect(balancedGrid(count, 375, ANSWER_GRID)).toMatchObject({ columns: 1, wide: 0, rows: count });
    }
  });

  it("the columns follow the width: floor(width / 300), at most 3", () => {
    expect(balancedGrid(6, 599, ANSWER_GRID).columns).toBe(1);
    expect(balancedGrid(6, 600, ANSWER_GRID).columns).toBe(2);
    expect(balancedGrid(6, 899, ANSWER_GRID).columns).toBe(2);
    expect(balancedGrid(6, 900, ANSWER_GRID).columns).toBe(3);
    expect(balancedGrid(6, 5000, ANSWER_GRID).columns).toBe(3);
    // Twelve answers would fit 4 columns if the grid allowed them; it allows 3 at most (spec 15.5).
    expect(balancedGrid(12, 5000, ANSWER_GRID)).toMatchObject({ columns: 3, rows: 4 });
    expect(ANSWER_GRID).toEqual({ minCellWidth: 300, minColumns: 1, maxColumns: 3 });
  });
});

describe("balancedGrid: rule 1, every row is full", () => {
  const specs: GridSpec[] = [CHART_DESKTOP, CHART_PHONE, ANSWER_GRID, { minCellWidth: 192, minColumns: 1, maxColumns: 4 }];
  it("for every item count and width, the cells fill every row exactly, with the wide cells first", () => {
    for (const spec of specs) {
      for (let count = 1; count <= 24; count++) {
        for (const width of [160, 343, 375, 600, 768, 900, 1040, 1280]) {
          const layout = balancedGrid(count, width, spec);
          const where = `${count} items, ${width}px, spec ${JSON.stringify(spec)}`;
          expect(layout.spans, where).toHaveLength(count);
          // Spans add up to whole rows: no half-empty last row.
          expect(layout.spans.reduce((a, b) => a + b, 0) % layout.columns, where).toBe(0);
          expect(layout.rows * layout.columns, where).toBe(count + layout.wide);
          // The wide cells are the first items.
          expect(layout.spans.filter((s) => s === 2), where).toHaveLength(layout.wide);
          expect(layout.spans.slice(0, layout.wide).every((s) => s === 2), where).toBe(true);
          // No cell is pushed to the next row, which would leave a hole.
          const places = placeCells(layout);
          let used = 0;
          for (const p of places) {
            expect(used + p.span, where).toBeLessThanOrEqual(layout.columns);
            used = (used + p.span) % layout.columns;
          }
          expect(used, where).toBe(0);
        }
      }
    }
  });

  /** An independent search: every column count and every wide count, packed cell by cell. */
  function oracle(count: number, width: number, spec: GridSpec) {
    const allowed = Math.max(spec.minColumns, Math.min(spec.maxColumns, Math.floor(width / spec.minCellWidth)));
    let best: { columns: number; wide: number; rows: number } | null = null;
    for (let columns = spec.minColumns; columns <= allowed; columns++) {
      for (let wide = 0; wide <= count; wide++) {
        if (wide > 0 && columns < 2) continue;
        let used = 0;
        let rows = 1;
        let ok = true;
        for (let i = 0; i < count && ok; i++) {
          const span = i < wide ? 2 : 1;
          if (used + span > columns) ok = false; // would leave a hole
          used += span;
          if (used === columns && i < count - 1) {
            used = 0;
            rows++;
          }
        }
        if (!ok || used !== columns) continue;
        const better =
          best === null || rows < best.rows || (rows === best.rows && wide < best.wide) || (rows === best.rows && wide === best.wide && columns > best.columns);
        if (better) best = { columns, wide, rows };
        break; // the smallest wide count that fills the rows
      }
    }
    return best;
  }

  it("rules 2 to 4: it picks what an independent search over every column and wide count picks (fewest rows, then fewest wide cells)", () => {
    for (const spec of specs) {
      for (let count = 2; count <= 24; count++) {
        for (const width of [160, 343, 600, 768, 900, 1040, 1280]) {
          const expected = oracle(count, width, spec);
          if (expected === null) continue; // no count packs: the function falls back to the minimum columns
          const got = balancedGrid(count, width, spec);
          expect({ columns: got.columns, wide: got.wide, rows: got.rows }, `${count} items, ${width}px, ${JSON.stringify(spec)}`).toEqual(expected);
        }
      }
    }
  });
});

describe("placeCells", () => {
  it("marks the cells that end a row and the cells of the last row, so rules are drawn only between neighbours", () => {
    const five = placeCells(balancedGrid(5, 1040, ANSWER_GRID));
    expect(five.map((c) => c.endsRow)).toEqual([false, true, false, false, true]);
    expect(five.map((c) => c.lastRow)).toEqual([false, false, true, true, true]);
    const phone = placeCells(balancedGrid(5, 343, ANSWER_GRID));
    expect(phone.every((c) => c.endsRow)).toBe(true);
    expect(phone.map((c) => c.lastRow)).toEqual([false, false, false, false, true]);
  });
});
