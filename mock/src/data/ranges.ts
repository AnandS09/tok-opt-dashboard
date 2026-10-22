/**
 * Input ranges (spec 5.2). The scenario parser clamps to these, and so can
 * every control, so the page and the parser can never disagree.
 */

export interface Range {
  min: number;
  max: number;
}

/** People using AI at work. */
export const USERS_RANGE: Range = { min: 1, max: 10_000 };

/** Customers (or subscribers) using AI in the product. */
export const CUSTOMERS_RANGE: Range = { min: 1, max: 10_000_000 };

/** Quarterly AI budget in USD: $1K to $100M. */
export const BUDGET_USD_PER_QUARTER_RANGE: Range = { min: 1_000, max: 100_000_000 };

/**
 * Snaps `value` to the nearest bound of `range` (spec 5.2): zero, negative
 * and too-small values give `min`, too-large values give `max`.
 */
export function clampToRange(value: number, range: Range): number {
  return Math.min(range.max, Math.max(range.min, value));
}
