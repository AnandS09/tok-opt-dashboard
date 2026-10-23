import "../styles/compare.css";
import type { CSSProperties } from "react";
import type { Results } from "../contract";
import { comparisonOf } from "./comparison";
import { INFRAVANA_LABEL, TODAY_LABEL } from "./labels";
import { optionStyle } from "./patterns";

/** The custom property each Today colour and the accent are read from, for the swatches. */
const FILL_VAR: Record<string, string> = {
  today1: "var(--color-today-1)",
  today2: "var(--color-today-2)",
  today3: "var(--color-today-3)",
  today4: "var(--color-today-4)",
};

/**
 * The key of C3 (stage size only): what each bar stands for. Every series is a
 * bar, so every swatch is a bar swatch (spec 15.11). It is HTML beside the
 * canvas rather than the chart's own legend, which stretches every icon to one box.
 */
export function C3Key({ results }: { results: Results }) {
  const cmp = comparisonOf(results);
  const item = (key: string, fill: string, label: string) => (
    <li key={key} className="chart-key__item">
      <span className="chart-key__swatch chart-key__swatch--bar" style={{ background: fill } as CSSProperties} aria-hidden="true" />
      {label}
    </li>
  );
  return (
    <ul className="chart-key" aria-label="Key to the bars">
      {item("comparator", FILL_VAR.today1, `${TODAY_LABEL}: ${cmp.label}`)}
      {item("infravana", "var(--color-accent)", INFRAVANA_LABEL)}
      {cmp.options.map((o) => item(o.alt.pattern_id, FILL_VAR[optionStyle(o.rank).fill], o.alt.label))}
    </ul>
  );
}
