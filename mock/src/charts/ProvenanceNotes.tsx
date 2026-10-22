import "../styles/compare.css";
import type { Provenance } from "../contract";
import { PROVENANCE_TEXT } from "./provenanceStyle";

/** One drawn series or part, with where its data comes from. */
export interface ProvenancePart {
  /** The bar or group it belongs to, as named on the chart ("Today", "With InfraVana", "Other Today options"). */
  group: string;
  /** The segment or option, when the group has several; empty when the group is the part. */
  part: string;
  provenance: Provenance;
}

export interface BadgeSpec {
  provenance: Provenance;
  group: string;
  parts: string[];
}

const ORDER: Provenance[] = ["measured", "vendor_reported", "modelled"];

/**
 * One badge per provenance and group, in a fixed order, each listing the
 * parts it applies to (spec 9, design-tokens 3.4). Every provenance gets a
 * badge, so no series can read as more certain than it is.
 */
export function badgesOf(parts: ProvenancePart[]): BadgeSpec[] {
  const out: BadgeSpec[] = [];
  for (const provenance of ORDER) {
    for (const part of parts.filter((p) => p.provenance === provenance)) {
      let badge = out.find((b) => b.provenance === provenance && b.group === part.group);
      if (!badge) {
        badge = { provenance, group: part.group, parts: [] };
        out.push(badge);
      }
      if (part.part !== "" && !badge.parts.includes(part.part)) badge.parts.push(part.part);
    }
  }
  return out;
}

/** "Modelled · With InfraVana: Own hardware (MI355X) / Saved: better price". */
export function badgeText(b: BadgeSpec): string {
  // Labels hold commas ("vendor 2, end to end"), so parts are told apart by a slash.
  const what = b.parts.length > 0 ? `${b.group}: ${b.parts.join(" / ")}` : b.group;
  return `${PROVENANCE_TEXT[b.provenance]} · ${what}`;
}

/** The source line of design-tokens 3.5. */
export const SOURCE_DEFAULT = {
  source: "InfraVana cost model on illustrative price tables.",
  note: "all figures are invented placeholders, not quotes.",
};
export const SOURCE_INVENTED = { source: "invented placeholder data.", note: null };

interface ProvenanceNotesProps {
  size: "stage" | "thumb";
  parts: ProvenancePart[];
  /** True when the chart draws the invented speed or batch rows (BD-11): adds that badge and its source line. */
  invented?: boolean;
}

/**
 * The badges and source line under a chart, stage size only (a thumbnail is
 * nothing but the picture). The "Source:" line is drawn here, so a chart
 * carries it wherever it is mounted (spec 9, acceptance 1).
 */
export function ProvenanceNotes({ size, parts, invented = false }: ProvenanceNotesProps) {
  if (size !== "stage") return null;
  const badges = badgesOf(parts);
  const source = invented ? SOURCE_INVENTED : SOURCE_DEFAULT;
  return (
    <div className="chart-notes">
      <ul className="chart-notes__badges" aria-label="Where each series comes from">
        {badges.map((b) => (
          <li key={`${b.provenance}|${b.group}`} className={`prov-badge prov-badge--${b.provenance}`}>
            {badgeText(b)}
          </li>
        ))}
        {invented ? (
          <li key="invented" className="prov-badge prov-badge--invented">
            Invented placeholder
          </li>
        ) : null}
      </ul>
      <p className="chart-source">
        <b>Source:</b> {source.source}
        {source.note ? (
          <>
            {" "}
            <b>Note:</b> {source.note}
          </>
        ) : null}
      </p>
    </div>
  );
}
