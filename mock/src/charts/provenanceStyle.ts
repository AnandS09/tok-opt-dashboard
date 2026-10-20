import type { BarSeriesOption } from "echarts/charts";
import type { Provenance } from "../contract";
import type { ColourKey, NumberKey, Tokens } from "./tokens";

type ItemStyle = NonNullable<BarSeriesOption["itemStyle"]>;

/**
 * The perimeter cue for provenance as token names, so the bars (resolved from
 * the tokens read at draw time) and the label-list swatches (resolved as CSS
 * custom properties) are drawn from one rule (design-tokens 3b).
 */
export interface BorderSpec {
  colour: ColourKey;
  width: NumberKey;
  dash: "solid" | "dashModelled" | "dashVendor";
}

/**
 * Measured keeps the plain separator (or the solid outline of a hollow
 * savings segment); modelled is dashed and vendor-reported dotted, in white
 * on a filled bar and accent-strong on a hollow one. Patterns stay inside the
 * bar, so the two never compete.
 */
export function borderSpec(provenance: Provenance, hollow: boolean): BorderSpec {
  if (provenance === "measured") {
    return hollow
      ? { colour: "accentStrong", width: "savingsOutlineWidth", dash: "solid" }
      : { colour: "separator", width: "separatorWidth", dash: "solid" };
  }
  const dash = provenance === "modelled" ? "dashModelled" : "dashVendor";
  return hollow
    ? { colour: "provenanceOnHollow", width: "savingsOutlineWidth", dash }
    : { colour: "provenanceOnFill", width: "provenanceWidth", dash };
}

/** Border of a bar part, resolved for ECharts. */
export interface BorderStyle {
  borderColor: string;
  borderWidth: number;
  borderType: "solid" | number[];
}

export function provenanceBorder(provenance: Provenance, hollow: boolean, t: Tokens): BorderStyle {
  const spec = borderSpec(provenance, hollow);
  return {
    borderColor: t[spec.colour],
    borderWidth: t[spec.width],
    borderType: spec.dash === "solid" ? "solid" : t[spec.dash],
  };
}

/** A solid fill with the provenance border, for bars without a pattern. */
export function filledStyle(color: string, provenance: Provenance, t: Tokens): ItemStyle {
  return { color, ...provenanceBorder(provenance, false, t) };
}
