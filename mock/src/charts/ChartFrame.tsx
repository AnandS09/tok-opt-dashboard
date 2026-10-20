import type { CSSProperties, ReactNode } from "react";
import type { Provenance } from "../contract";
import { PROVENANCE_TEXT } from "./format";
import { useEChart } from "./useEChart";
import type { OptionBuilder } from "./useEChart";

/** One series (or part of one) whose provenance may need a badge. */
export interface BadgeItem {
  series: string;
  /** The part of the series this applies to, e.g. a segment or model class. */
  part?: string;
  provenance: Provenance;
}

/** Plain table behind the chart, for screen readers (spec 10). */
export interface DataTableSpec {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
}

/**
 * Groups the non-measured items by series and provenance, one badge each.
 * A measured item gets no badge (spec 9, contract `Provenance`).
 */
export function badgeLabels(items: BadgeItem[]): string[] {
  const groups = new Map<string, { series: string; provenance: Provenance; parts: string[] }>();
  for (const item of items) {
    if (item.provenance === "measured") continue;
    const key = `${item.series}|${item.provenance}`;
    const group = groups.get(key) ?? { series: item.series, provenance: item.provenance, parts: [] };
    if (item.part !== undefined && !group.parts.includes(item.part)) group.parts.push(item.part);
    groups.set(key, group);
  }
  return [...groups.values()].map(
    (g) =>
      `${g.series}${g.parts.length > 0 ? ` (${g.parts.join(", ")})` : ""}: ${PROVENANCE_TEXT[g.provenance]}`,
  );
}

const srOnly: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const badgeStyle: CSSProperties = {
  display: "inline-block",
  padding: "2px var(--space-2)",
  border: "1px solid var(--color-border-strong)",
  borderRadius: "var(--radius-pill)",
  background: "var(--color-surface-muted)",
  color: "var(--color-text-secondary)",
  fontSize: "var(--font-size-xs)",
  lineHeight: "var(--line-height-tight)",
};

interface ChartFrameProps {
  size: "stage" | "thumb";
  ariaLabel: string;
  build: OptionBuilder;
  badges: BadgeItem[];
  table: DataTableSpec;
  /** One short line above the chart, stage only (for example the latency target). */
  subtitle?: string;
  /** Always shown, above the chart (the C5 delta label). */
  header?: ReactNode;
  /** Stage only: content under the chart and above the badges, given the chart's pixel size (C1's label list). */
  renderList?: (width: number, height: number) => ReactNode;
}

/**
 * The shared chrome of every chart component: the canvas container, the
 * provenance badges (stage only), a hidden data table for screen readers, and
 * the thumb rules (non-interactive, nothing but the picture).
 */
export function ChartFrame({ size, ariaLabel, build, badges, table, subtitle, header, renderList }: ChartFrameProps) {
  const stage = size === "stage";
  const { ref, error, size: chartSize } = useEChart(build);
  const badgeTexts = stage ? badgeLabels(badges) : [];

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: stage ? "var(--space-2)" : 0,
        width: "100%",
        height: stage ? "100%" : undefined,
        fontFamily: "var(--font-sans)",
        color: "var(--color-text)",
      }}
    >
      {header}
      {stage && subtitle ? (
        <p style={{ margin: 0, fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
          {subtitle}
        </p>
      ) : null}
      <div
        ref={ref}
        role="img"
        aria-label={ariaLabel}
        style={{
          width: "100%",
          flex: stage ? "1 1 auto" : undefined,
          minHeight: stage ? 280 : undefined,
          aspectRatio: stage ? undefined : "16 / 9",
          pointerEvents: stage ? undefined : "none",
        }}
      />
      {error ? (
        <p role="alert" style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>
          This chart could not be drawn. {error}
        </p>
      ) : null}
      {stage && renderList ? renderList(chartSize.width, chartSize.height) : null}
      {badgeTexts.length > 0 ? (
        <ul
          aria-label="Data provenance"
          style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", margin: 0, padding: 0, listStyle: "none" }}
        >
          {badgeTexts.map((text) => (
            <li key={text} style={badgeStyle}>
              {text}
            </li>
          ))}
        </ul>
      ) : null}
      {stage ? (
        <table style={srOnly}>
          <caption>{table.caption}</caption>
          <thead>
            <tr>
              {table.headers.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
