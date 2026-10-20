import type {
  AllocationSegment,
  Provenance,
  SavingsSegment,
  SpendSegment,
} from "../contract";
import { channelLabel, selfHostLabel } from "../shared/format";
import { worstProvenance } from "./format";
import { SAVINGS_LABEL } from "./labels";

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
  kind: "provider" | "hardware" | "savings" | "other";
  provenance: Provenance;
  /** Labels of the segments folded into this one; empty if it stands alone. */
  members: string[];
}

/**
 * Spend segments drawn per bar, "Other" included. Today: four segments plus
 * "Other providers", so segments fold only when there are more than five.
 * InfraVana: three plus "Other", so more than four.
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
 * order; only when there are more than the bar allows, the smallest fold into
 * "Other". A narrow segment is never folded; the tooltip and the screen-reader table name it.
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

  const planned: PlannedSegment[] = kept.map((s) => ({
    label: spendLabel(s),
    usd: s.usd,
    tone: "spend",
    kind: s.kind,
    provenance: s.provenance,
    members: [],
  }));
  if (folded.length > 0) {
    planned.push({
      label: OTHER_LABEL[side],
      usd: folded.reduce((sum, s) => sum + s.usd, 0),
      tone: "spend",
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
      kind: "savings",
      provenance: s.provenance,
      members: [],
    });
  }
  return planned;
}
