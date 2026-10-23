/**
 * The balanced-grid rule (spec 15.13, board 09), as pure functions. A grid is
 * given its item count, its container width and its cell rules; it gets back
 * the number of columns and how many of the first items are wide (two columns).
 *
 * 1. Every row is full: no row, the last included, has an empty track.
 * 2. The columns allowed come from the width: at most the container width
 *    over the minimum cell width (rounded down), at least the grid's minimum.
 * 3. Of the allowed counts, the one that gives the fewest rows wins; on a tie,
 *    the one that needs the fewest wide cells.
 * 4. Where a count does not divide the items, the first k items span two
 *    columns, the smallest k that fills every row. Wide cells are packed in
 *    order from the start, so a count whose wide cells would leave a gap in a
 *    row (two wide cells in a three-column grid) is not a candidate.
 */

export interface GridSpec {
  /** Narrowest a cell may be, in pixels. */
  minCell: number;
  minColumns: number;
  maxColumns: number;
}

export interface GridLayout {
  columns: number;
  /** The first `wide` items span two columns. */
  wide: number;
  rows: number;
}

/** The chart grid view: 240px cells and 2 to 4 columns on desktop (15.13). */
export const CHART_GRID_DESKTOP: GridSpec = { minCell: 240, minColumns: 2, maxColumns: 4 };
/** The chart grid view under 600px: 160px cells, always 2 columns (15.13). */
export const CHART_GRID_PHONE: GridSpec = { minCell: 160, minColumns: 2, maxColumns: 2 };

/** The widest column count the container allows, kept inside the grid's own range. */
export function allowedColumns(width: number, spec: GridSpec): number {
  const fit = Math.floor(width / spec.minCell);
  return Math.min(spec.maxColumns, Math.max(spec.minColumns, fit));
}

/**
 * True when `count` items, the first `wide` of them two columns wide, laid out
 * in order in `columns` columns, fill every row exactly.
 */
export function fillsEveryRow(count: number, wide: number, columns: number): boolean {
  let used = 0;
  for (let i = 0; i < count; i += 1) {
    const span = i < wide ? 2 : 1;
    if (span > columns || used + span > columns) return false;
    used = (used + span) % columns;
  }
  return used === 0;
}

/** The smallest number of wide items that fills every row of `columns` columns, or null if none does. */
function fewestWide(count: number, columns: number): number | null {
  for (let wide = 0; wide <= count; wide += 1) {
    if (fillsEveryRow(count, wide, columns)) return wide;
  }
  return null;
}

/** The layout of `count` items in a container `width` pixels wide. */
export function balancedGrid(count: number, width: number, spec: GridSpec): GridLayout {
  const widest = allowedColumns(width, spec);
  if (count <= 0) return { columns: spec.minColumns, wide: 0, rows: 0 };
  let best: GridLayout | null = null;
  for (let columns = spec.minColumns; columns <= widest; columns += 1) {
    const wide = fewestWide(count, columns);
    if (wide === null) continue;
    const rows = (count + wide) / columns;
    if (best === null || rows < best.rows || (rows === best.rows && wide < best.wide)) {
      best = { columns, wide, rows };
    }
  }
  // Two columns always fill (one wide item first when the count is odd), so a range that starts at two always has a layout.
  return best ?? { columns: spec.minColumns, wide: 0, rows: Math.ceil(count / spec.minColumns) };
}
