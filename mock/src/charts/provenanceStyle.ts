import type { Provenance } from "../contract";
import type { Tokens } from "./tokens";

/**
 * How provenance is drawn on a mark (design-tokens 3.3, spec 9): the
 * perimeter says it. Measured is a plain separator; modelled is dashed;
 * vendor-reported is dotted. A pattern never carries provenance, and line
 * series that are Today's stay solid because dashes mean provenance.
 */
export interface Outline {
  borderColor: string;
  borderWidth: number;
  /** "solid" or an ECharts dash array. */
  borderType: "solid" | number[];
}

/** The dash array of a provenance, or null when it is drawn solid. */
export function dashOf(p: Provenance, t: Tokens): number[] | null {
  if (p === "modelled") return t.dashModelled;
  if (p === "vendor_reported") return t.dashVendor;
  return null;
}

/**
 * The perimeter of a filled bar or segment (`hollow` false) or of a hollow
 * savings segment (`hollow` true). The light dashes read against the fill;
 * where the fill shows through the gaps it reads against the paper, so the
 * edge looks perforated.
 */
export function outlineOf(p: Provenance, hollow: boolean, t: Tokens): Outline {
  const dash = dashOf(p, t);
  if (hollow) {
    return {
      borderColor: dash ? t.provenanceOnHollow : t.positive,
      borderWidth: t.savingsOutlineWidth,
      borderType: dash ?? "solid",
    };
  }
  return dash
    ? { borderColor: t.provenanceOnFill, borderWidth: t.provenanceWidth, borderType: dash }
    : { borderColor: t.separator, borderWidth: t.separatorWidth, borderType: "solid" };
}

/** Provenance in words, for badges, tooltips and tables. */
export const PROVENANCE_TEXT: Record<Provenance, string> = {
  measured: "Measured",
  modelled: "Modelled",
  vendor_reported: "Vendor-reported",
};
