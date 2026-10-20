import type { SavingsSource } from "../contract";

/** Series names and brand spelling shared by the charts (UI copy follows the live site). */
export const BRAND = "InfraVana";
export const TODAY_LABEL = "Today";
export const INFRAVANA_LABEL = `With ${BRAND}`;

/**
 * The one name of a savings segment, used on the bar, in the tooltip, in the
 * badge and in the CSV (design-tokens 3a). Compute's own label is not shown.
 */
export const SAVINGS_LABEL: Record<SavingsSource, string> = {
  arbitrage: "Saved: better price",
  routing: "Saved: cheaper models",
};
