import type { ReactNode } from "react";
import { useEChart } from "./useEChart";
import type { OptionBuilder } from "./useEChart";

/** Plain table behind the chart, for screen readers (spec 10). */
export interface DataTableSpec {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
}

interface ChartFrameProps {
  size: "stage" | "thumb";
  ariaLabel: string;
  build: OptionBuilder;
  table: DataTableSpec;
  /** One short line above the chart, stage only (for example the speed setting). */
  subtitle?: string;
  /** Always shown, above the chart (the C5 delta label). */
  header?: ReactNode;
}

/**
 * The shared chrome of every chart component: the canvas container and a
 * hidden data table for screen readers. At thumb size it is nothing but the
 * picture.
 */
export function ChartFrame({ size, ariaLabel, build, table, subtitle, header }: ChartFrameProps) {
  const stage = size === "stage";
  const { ref, error } = useEChart(build);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: stage ? "var(--space-2)" : 0,
        width: "100%",
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
          height: stage ? "var(--chart-stage-height)" : undefined,
          aspectRatio: stage ? undefined : "16 / 9",
          pointerEvents: stage ? undefined : "none",
        }}
      />
      {error ? (
        <p role="alert" style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>
          This chart could not be drawn. {error}
        </p>
      ) : null}
      {stage ? (
        // A <table> ignores width and overflow, so the hiding goes on a wrapper; otherwise the page scrolls sideways.
        <div className="sr-only">
          <table>
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
        </div>
      ) : null}
    </div>
  );
}
