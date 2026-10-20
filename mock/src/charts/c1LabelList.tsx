import type { CSSProperties } from "react";
import type { Results } from "../contract";
import { fmtUsd } from "../shared/format";
import { layoutAllocation } from "./c1Layout";
import type { BarLayout } from "./c1Layout";
import { segmentBorderSpec, segmentLook } from "./c1Plan";
import type { PlannedSegment } from "./c1Plan";
import { PROVENANCE_TEXT } from "./format";
import { INFRAVANA_LABEL, TODAY_LABEL } from "./labels";
import { COLOUR_VARS, NUMBER_VARS } from "./tokens";
import type { ColourKey, Tokens } from "./tokens";

/** The label list of design-tokens 3e: names the segments the chart could not label with a chip. */

const colourVar = (key: ColourKey) => `var(${COLOUR_VARS[key]})`;
const DASH_VARS = { dashModelled: "var(--chart-dash-modelled)", dashVendor: "var(--chart-dash-vendor)" } as const;

/** 16px x 12px swatch with the segment's own fill, pattern and perimeter (the same rule the bar uses). */
function Swatch({ seg, side, id }: { seg: PlannedSegment; side: BarLayout["side"]; id: string }) {
  const look = segmentLook(seg, side);
  const border = segmentBorderSpec(seg, side);
  const patternColour = look.pattern ? colourVar(look.pattern.colour) : "none";
  const stroke: CSSProperties = {
    stroke: colourVar(border.colour),
    strokeWidth: `var(${NUMBER_VARS[border.width]})`,
    strokeDasharray: border.dash === "solid" ? "none" : DASH_VARS[border.dash],
  };
  return (
    <svg
      viewBox="0 0 16 12"
      focusable="false"
      style={{ width: "var(--space-4)", height: "var(--space-3)", flex: "none", display: "block" }}
    >
      {look.pattern ? (
        <defs>
          {look.pattern.kind === "hatch" ? (
            <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <line x1="0" y1="0" x2="0" y2="5" style={{ stroke: patternColour, strokeWidth: 1.5 }} />
            </pattern>
          ) : look.pattern.kind === "dots" ? (
            <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1" style={{ fill: patternColour }} />
            </pattern>
          ) : (
            <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: patternColour, strokeWidth: 1 }} />
              <line x1="0" y1="0" x2="6" y2="0" style={{ stroke: patternColour, strokeWidth: 1 }} />
            </pattern>
          )}
        </defs>
      ) : null}
      <rect x="1" y="1" width="14" height="10" style={{ fill: colourVar(look.fill) }} />
      {look.pattern ? <rect x="1" y="1" width="14" height="10" fill={`url(#${id})`} /> : null}
      <rect x="1" y="1" width="14" height="10" fill="none" style={stroke} />
    </svg>
  );
}

interface C1LabelListProps {
  results: Results;
  tokens: Tokens;
  /** Pixel size of the chart canvas, which decides what the chart can label itself. */
  dims: { width: number; height: number };
  idPrefix: string;
}

/**
 * Entries per bar for the segments without a chip, or null when the chart
 * labelled every segment itself. Stage only; the hidden table still carries
 * every segment, so the list is hidden from screen readers to avoid a repeat.
 */
export function C1LabelList({ results, tokens, dims, idPrefix }: C1LabelListProps) {
  const layout = layoutAllocation(results, tokens, dims);
  const groups = [layout.today, layout.infravana]
    .map((bar) => ({
      bar,
      entries: bar.segs.flatMap((seg, i) => {
        const place = bar.placements[i];
        return place.mode === "list" ? [{ seg, tooSmall: place.tooSmall, index: i }] : [];
      }),
    }))
    .filter((g) => g.entries.length > 0);
  if (groups.length === 0) return null;
  const id = idPrefix.replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <div
      aria-hidden="true"
      data-label-list=""
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        fontSize: "var(--font-size-xs)",
        lineHeight: "var(--line-height-tight)",
        color: "var(--color-text)",
      }}
    >
      {groups.map(({ bar, entries }) => (
        <div key={bar.side}>
          <p
            style={{
              margin: 0,
              fontWeight: "var(--font-weight-bold)",
              color: bar.side === "today" ? "var(--color-text)" : "var(--color-accent-strong)",
            }}
          >
            {bar.side === "today" ? TODAY_LABEL : INFRAVANA_LABEL}
          </p>
          <ul
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-1) var(--space-3)",
              margin: 0,
              padding: 0,
              listStyle: "none",
            }}
          >
            {entries.map(({ seg, tooSmall, index }) => (
              <li key={index} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
                <Swatch seg={seg} side={bar.side} id={`${id}-${bar.side}-${index}`} />
                <span>
                  {seg.label} {"·"} {fmtUsd(seg.usd)}
                  {seg.provenance !== "measured" ? (
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {" · "}
                      {PROVENANCE_TEXT[seg.provenance]}
                    </span>
                  ) : null}
                  {tooSmall ? " (too small to draw)" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
