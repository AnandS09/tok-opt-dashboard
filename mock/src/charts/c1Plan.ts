import type { BarSeriesOption } from "echarts/charts";
import type {
  AllocationSegment,
  Provenance,
  SavingsSegment,
  SpendSegment,
} from "../contract";
import { channelLabel, fmtUsd, selfHostLabel } from "../shared/format";
import { PROVENANCE_TEXT, worstProvenance } from "./format";
import { SAVINGS_LABEL } from "./labels";
import { crossHatch, dots, hatch } from "./patterns";
import { borderSpec, provenanceBorder } from "./provenanceStyle";
import type { ColourKey, Tokens } from "./tokens";

type ItemStyle = NonNullable<BarSeriesOption["itemStyle"]>;

// ---------------------------------------------------------------------------
// Planning: which segments are drawn (design-tokens 3 and 3a)
// ---------------------------------------------------------------------------

export type Side = "today" | "infravana";
export type Tone = "spend" | "arbitrage" | "routing";

/** A segment as drawn: possibly several small ones folded into "Other". */
export interface PlannedSegment {
  label: string;
  usd: number;
  tone: Tone;
  /** Position in the pattern ladder of its side (spend segments only). */
  slot: number;
  kind: "provider" | "hardware" | "savings" | "other";
  provenance: Provenance;
  /** Labels of the segments folded into this one; empty if it stands alone. */
  members: string[];
}

/**
 * Spend segments drawn per bar, "Other" included (design-tokens 3, 3a). Today:
 * four slots plus the "Other providers" slot, so segments fold only when there
 * are more than five. InfraVana: three slots plus "Other", so more than four.
 */
const MAX_SPEND_SEGMENTS: Record<Side, number> = { today: 5, infravana: 4 };
const OTHER_LABEL: Record<Side, string> = { today: "Other providers", infravana: "Other" };

export const isSavings = (s: AllocationSegment): s is SavingsSegment => s.kind === "savings";
export const isSpend = (s: AllocationSegment): s is SpendSegment => s.kind !== "savings";

/**
 * The label of a spend segment (design-tokens 3a): a provider by its
 * capitalised channel or vendor name, self-hosted hardware as "Self-host ·"
 * and the hardware name. The compute engine's raw ids never reach the chart.
 */
export function spendLabel(s: SpendSegment): string {
  return s.kind === "hardware" ? selfHostLabel(s.label) : channelLabel(s.label);
}

/**
 * Turns one bar's segments into the segments drawn. Spend segments keep their
 * order; only when there are more than the slots allow, the smallest fold into
 * "Other". A narrow segment is never folded: its label goes outside the bar.
 * Savings segments come last, arbitrage then routing, so both bars end at the
 * same total, and carry the one name of `SAVINGS_LABEL`.
 */
export function planBar(segments: AllocationSegment[], side: Side): PlannedSegment[] {
  const spend = segments.filter(isSpend);
  const savings = segments
    .filter(isSavings)
    .sort((a, b) => Number(a.savings_source === "routing") - Number(b.savings_source === "routing"));

  const max = MAX_SPEND_SEGMENTS[side];
  let kept = spend;
  let folded: SpendSegment[] = [];
  if (spend.length > max) {
    const largest = new Set([...spend].sort((a, b) => b.usd - a.usd).slice(0, max - 1));
    kept = spend.filter((s) => largest.has(s));
    folded = spend.filter((s) => !largest.has(s));
  }

  const planned: PlannedSegment[] = kept.map((s, i) => ({
    label: spendLabel(s),
    usd: s.usd,
    tone: "spend",
    slot: i,
    kind: s.kind,
    provenance: s.provenance,
    members: [],
  }));
  if (folded.length > 0) {
    planned.push({
      label: OTHER_LABEL[side],
      usd: folded.reduce((sum, s) => sum + s.usd, 0),
      tone: "spend",
      slot: Number.MAX_SAFE_INTEGER,
      kind: "other",
      provenance: worstProvenance(folded.map((s) => s.provenance)),
      members: folded.map(spendLabel),
    });
  }
  for (const s of savings) {
    planned.push({
      label: SAVINGS_LABEL[s.savings_source],
      usd: s.usd,
      tone: s.savings_source,
      slot: 0,
      kind: "savings",
      provenance: s.provenance,
      members: [],
    });
  }
  return planned;
}


// ---------------------------------------------------------------------------
// Look of a segment (design-tokens 3, 3a, 3b), as token names
// ---------------------------------------------------------------------------

export type PatternKind = "hatch" | "dots" | "cross";

/** Fill and pattern of a segment, by token name, shared by the bars and the label-list swatches. */
export interface SegmentLook {
  fill: ColourKey;
  pattern?: { kind: PatternKind; colour: ColourKey };
  /** A savings segment: white inside, drawn with the accent-strong outline. */
  hollow: boolean;
}

export function segmentLook(seg: PlannedSegment, side: Side): SegmentLook {
  if (seg.tone === "arbitrage" || seg.tone === "routing") {
    return {
      fill: "surface",
      hollow: true,
      pattern: { kind: seg.tone === "arbitrage" ? "hatch" : "dots", colour: "accentStrong" },
    };
  }
  const isOther = seg.kind === "other";
  const ladder: PatternKind[] = ["hatch", "dots", "cross"];
  if (side === "today") {
    const slot = Math.min(isOther ? 4 : seg.slot, 4);
    const fills: ColourKey[] = ["today1", "today2", "today3", "today4", "today2"];
    return {
      fill: fills[slot],
      hollow: false,
      pattern: slot >= 2 ? { kind: ladder[slot - 2], colour: "separator" } : undefined,
    };
  }
  const slot = Math.min(isOther ? 3 : seg.slot, 3);
  return {
    fill: "accent",
    hollow: false,
    pattern: slot >= 1 ? { kind: ladder[slot - 1], colour: "separator" } : undefined,
  };
}

const PATTERN_FILL = { hatch, dots, cross: crossHatch };

/** Fill, border and pattern of one segment for ECharts. The border carries provenance; the pattern stays inside. */
export function segmentStyle(seg: PlannedSegment, side: Side, t: Tokens): ItemStyle {
  const look = segmentLook(seg, side);
  return {
    color: t[look.fill],
    ...provenanceBorder(seg.provenance, look.hollow, t),
    ...(look.pattern ? { decal: PATTERN_FILL[look.pattern.kind](t[look.pattern.colour]) } : {}),
  };
}

/** Border of the swatch or bar part as token names, for callers that resolve them as CSS properties. */
export function segmentBorderSpec(seg: PlannedSegment, side: Side) {
  return borderSpec(seg.provenance, segmentLook(seg, side).hollow);
}

/** Lines of a segment's chip: its name, its amount, and, when not measured, its provenance (design-tokens 3b, 3c). */
export function chipLines(seg: PlannedSegment): string[] {
  const lines = [seg.label, fmtUsd(seg.usd)];
  if (seg.provenance !== "measured") lines.push(PROVENANCE_TEXT[seg.provenance]);
  return lines;
}

/** Chip text as ECharts rich text: name and amount in the main style, provenance in the secondary one. */
export function chipText(seg: PlannedSegment): string {
  return chipLines(seg)
    .map((line, i) => (i === 2 ? `{prov|${line}}` : `{main|${line}}`))
    .join("\n");
}
