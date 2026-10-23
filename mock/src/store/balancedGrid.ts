/**
 * The balanced-grid rule (spec 15.13): every row of a grid is full. Pure
 * functions with no React, so the rule is tested alone and every grid that
 * follows it gets its columns and wide cells from the same place.
 */

export interface GridSpec {
  /** The grid's minimum cell width in px. */
  minCellWidth: number;
  /** Fewest columns the grid may have. */
  minColumns: number;
  /** Most columns the grid may have. */
  maxColumns: number;
}

export interface GridLayout {
  columns: number;
  /** How many of the first items span two columns. */
  wide: number;
  rows: number;
  /** The column span of each item, 1 or 2, in order. */
  spans: number[];
}

/** The answer grid: cells need about 300px, so 3 columns on desktop and 1 on a phone (spec 15.5). */
export const ANSWER_GRID: GridSpec = { minCellWidth: 300, minColumns: 1, maxColumns: 3 };

/** True when the first `wide` of `count` items, spanning two columns, leave no hole in any row of `columns`. */
function packs(count: number, wide: number, columns: number): boolean {
  let used = 0;
  for (let i = 0; i < count; i++) {
    const span = i < wide ? 2 : 1;
    // A full row restarts at 0, so an item that does not fit would move down and leave a hole.
    if (used + span > columns) return false;
    used += span;
    if (used === columns) used = 0;
  }
  return used === 0;
}

/**
 * The layout of `count` items in a container `containerWidth` px wide.
 *
 *  1. The allowed column counts run from the grid's minimum to
 *     floor(width / minimum cell width), at most the grid's maximum.
 *  2. For each allowed count the rows are full only if the items, with some of
 *     them spanning two columns, fill them: the smallest number of wide cells
 *     is the one that makes `count + wide` a multiple of the columns.
 *  3. Choose the count with the fewest rows; on a tie the one with the fewest
 *     wide cells (then the one with more columns).
 *  4. The wide cells are the first items, in order.
 */
export function balancedGrid(count: number, containerWidth: number, spec: GridSpec): GridLayout {
  const allowed = Math.max(spec.minColumns, Math.min(spec.maxColumns, Math.floor(containerWidth / spec.minCellWidth)));
  let best: GridLayout | null = null;
  for (let columns = spec.minColumns; columns <= allowed; columns++) {
    const wide = columns === 1 ? 0 : (columns - (count % columns)) % columns;
    // A wide cell is an item, so there cannot be more wide cells than items.
    if (wide > count || !packs(count, wide, columns)) continue;
    const rows = Math.ceil((count + wide) / columns);
    const better =
      best === null ||
      rows < best.rows ||
      (rows === best.rows && wide < best.wide) ||
      (rows === best.rows && wide === best.wide && columns > best.columns);
    if (better) best = { columns, wide, rows, spans: [] };
  }
  const chosen = best ?? { columns: spec.minColumns, wide: 0, rows: Math.ceil(count / spec.minColumns), spans: [] };
  return { ...chosen, spans: Array.from({ length: count }, (_, i) => (i < chosen.wide ? 2 : 1)) };
}

export interface CellPlace {
  span: number;
  /** The cell ends its row, so it takes no rule on its right. */
  endsRow: boolean;
  /** The cell is in the last row, so it takes no rule below. */
  lastRow: boolean;
}

/** Where each cell sits, so the rules between cells can be drawn only between them. */
export function placeCells(layout: GridLayout): CellPlace[] {
  const places: CellPlace[] = [];
  let column = 0;
  let row = 0;
  for (const span of layout.spans) {
    column += span;
    places.push({ span, endsRow: column >= layout.columns, lastRow: row === layout.rows - 1 });
    if (column >= layout.columns) {
      column = 0;
      row += 1;
    }
  }
  return places;
}
