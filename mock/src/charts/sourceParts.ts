/**
 * The provenance parts every chart hands to its "Where these numbers come
 * from" table (spec 15.10): the comparator's segments, InfraVana's segments
 * and sources of saving, and the other Today options, each with the address of
 * its data row. All of it is read from `Results`; no address is written here.
 */
import type { Provenance, Results } from "../contract";
import { isSavings, isSpend, spendLabel } from "./c1Plan";
import { comparisonOf } from "./comparison";
import type { Comparison } from "./comparison";
import { INFRAVANA_LABEL, SAVINGS_LABEL, TODAY_LABEL } from "./labels";
import type { ProvenancePart } from "./ProvenanceNotes";

/** The group name of the other Today options. */
export const OTHER_TODAY_GROUP = "Other Today options";

/** The name of the comparator's bar: "Today: Pay-as-you-go API". */
export function comparatorBar(cmp: Comparison): string {
  return `${TODAY_LABEL}: ${cmp.label}`;
}

/** The comparator's spend segments, as the data holds them (a segment folded into "Other" is still named). */
export function todayParts(results: Results): ProvenancePart[] {
  const cmp = comparisonOf(results);
  return results.allocation.today
    .filter(isSpend)
    .map((s) => ({ group: comparatorBar(cmp), part: spendLabel(s), provenance: s.provenance, source_url: s.source_url }));
}

/** InfraVana's spend segments, then each source of saving that is not zero. */
export function infravanaParts(results: Results): ProvenancePart[] {
  const a = results.allocation;
  return [
    ...a.infravana
      .filter(isSpend)
      .map((s) => ({ group: INFRAVANA_LABEL, part: spendLabel(s), provenance: s.provenance, source_url: s.source_url })),
    ...a.infravana
      .filter(isSavings)
      .filter((s) => s.usd > 0)
      .map((s) => ({ group: INFRAVANA_LABEL, part: SAVINGS_LABEL[s.savings_source], provenance: s.provenance, source_url: s.source_url })),
  ];
}

/** Each other Today option, with its pattern's address. */
export function optionParts(results: Results, part = (label: string) => label): ProvenancePart[] {
  return comparisonOf(results).options.map((o) => ({
    group: OTHER_TODAY_GROUP,
    part: part(o.alt.label),
    provenance: o.alt.provenance,
    source_url: o.alt.source_url,
  }));
}

/** The address of the first of `parts` with this provenance, for a part that stands for several segments. */
export function firstAddress(parts: ProvenancePart[], provenance: Provenance): string | null {
  return parts.find((p) => p.provenance === provenance && p.source_url)?.source_url ?? null;
}
