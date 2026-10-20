import type { Tables } from "../contract";

/**
 * The `as_of` dates of the price rows (spec 12, BD-2). One date when every row
 * agrees, otherwise the range, so the footer never claims fresher prices
 * than the oldest row.
 */
export function priceDates(tables: Tables): { oldest: string; newest: string; label: string } {
  const dates = tables.model_offers.map((o) => o.as_of).filter(Boolean).sort();
  if (dates.length === 0) return { oldest: "", newest: "", label: "not stated" };
  const oldest = dates[0];
  const newest = dates[dates.length - 1];
  return { oldest, newest, label: oldest === newest ? oldest : `${oldest} to ${newest}` };
}
