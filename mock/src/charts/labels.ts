import type { ModelTier, SavingsSource } from "../contract";

/** Series names and brand spelling shared by the charts (UI copy follows the live site). */
export const BRAND = "InfraVana";
export const TODAY_LABEL = "Today";
export const INFRAVANA_LABEL = `With ${BRAND}`;

/**
 * The one name of a savings segment, used on the bar, in the tooltip, in the
 * sources table and in the CSV (design-tokens 3a). Compute's own label is not shown.
 */
export const SAVINGS_LABEL: Record<SavingsSource, string> = {
  arbitrage: "Saved: better price",
  routing: "Saved: cheaper models",
};

/** Plain name of a model class, as the charts and the benefit boxes write it. */
export const MODEL_CLASS_NAME: Record<ModelTier, string> = {
  frontier: "Flagship",
  mid: "Mid-size",
  small: "Small",
};
