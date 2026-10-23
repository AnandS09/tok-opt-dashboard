import "../styles/compare.css";
import type { Provenance } from "../contract";

/** One drawn series or part, with where its data comes from. */
export interface ProvenancePart {
  /** The bar or group it belongs to, as named on the chart ("Today", "With InfraVana", "Other Today options"). */
  group: string;
  /** What the part covers: the segment, the option or the size class. Empty when the group is the part. */
  part: string;
  provenance: Provenance;
  /**
   * The address of the data row behind the part (spec 15.10), read from the
   * rows' `source_url` columns. Null or absent when the row holds none.
   */
  source_url?: string | null;
}

/** Provenance in words, for the Basis column. */
export const PROVENANCE_TEXT: Record<Provenance, string> = {
  measured: "Measured",
  modelled: "Modelled",
  vendor_reported: "Vendor-reported",
};

/** The text of a modelled row's Source column (spec 15.10). */
export const MODELLED_SOURCE = "InfraVana cost model (no external source)";
/** What a row says when a vendor-reported series has no address in the data at all. */
export const NO_ADDRESS = "No source address in the data";
/** Said beside a link whose address is the invented placeholder address. */
export const PLACEHOLDER_NOTE = "placeholder, no source yet";
/** The label of a link to a price page. */
export const PRICE_LIST = "Price list";
/** Shown under the heading of a chart whose every series is measured. */
export const ALL_MEASURED = "Every series in this chart is measured, so none needs a row here.";
/** What a group with no named part covers. */
export const WHOLE_GROUP = "Everything drawn for it";
/** The one row added when the chart draws the invented speed and batch-price rows (BD-11). */
export const INVENTED_ROW = {
  group: "Speed and batch-price rows",
  covers: "Invented speeds and batch or flex prices",
  source: "Invented placeholder data (no external source)",
};

/** One link of a Source cell. */
export interface SourceLink {
  url: string;
  /** True when the address is the invented placeholder address, which is not a real page. */
  placeholder: boolean;
  /** The parts that cite it, for a row whose parts cite different addresses. */
  names: string[];
}

/** One row of the table: a provenance and a group, with what it covers and where it comes from. */
export interface SourceRow {
  group: string;
  covers: string[];
  provenance: Provenance;
  /** Vendor-reported rows only: one link per distinct address; empty when the data holds none. */
  links: SourceLink[];
  /** Set when the Source cell is plain text (a modelled row, the invented row). */
  text: string | null;
}

/** The two provenances that get a row. A series with no row is measured (spec 9). */
const ROW_ORDER: Provenance[] = ["vendor_reported", "modelled"];

/**
 * True for an address that is not a real page: the invented placeholder
 * address of the fixtures, which sits on the reserved `.invalid` top-level
 * domain (RFC 2606). Nothing here names the placeholder address itself.
 */
export function isPlaceholderAddress(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().endsWith(".invalid");
  } catch {
    return false;
  }
}

/** True for an address a link may point at: an absolute http or https URL. */
export function isLinkable(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * One row per provenance and group of the chart's non-measured series, in a
 * fixed order (vendor-reported, then modelled; groups in the order the chart
 * draws them), each listing what it covers and, for a vendor-reported row, the
 * addresses its parts cite (spec 15.10). A measured part has no row. `invented`
 * adds the row that names the invented speed and batch-price rows (BD-11).
 */
export function sourceRowsOf(parts: ProvenancePart[], invented = false): SourceRow[] {
  const rows: SourceRow[] = [];
  for (const provenance of ROW_ORDER) {
    const inRow = new Map<string, ProvenancePart[]>();
    for (const part of parts.filter((p) => p.provenance === provenance)) {
      inRow.set(part.group, [...(inRow.get(part.group) ?? []), part]);
    }
    for (const [group, members] of inRow) {
      const covers = [...new Set(members.map((m) => (m.part === "" ? WHOLE_GROUP : m.part)))];
      const links: SourceLink[] = [];
      if (provenance === "vendor_reported") {
        for (const m of members) {
          if (!m.source_url) continue;
          const name = m.part === "" ? group : m.part;
          const existing = links.find((l) => l.url === m.source_url);
          if (existing) existing.names.push(name);
          else links.push({ url: m.source_url, placeholder: isPlaceholderAddress(m.source_url), names: [name] });
        }
      }
      rows.push({ group, covers, provenance, links, text: provenance === "modelled" ? MODELLED_SOURCE : null });
    }
  }
  if (invented) {
    rows.push({
      group: INVENTED_ROW.group,
      covers: [INVENTED_ROW.covers],
      provenance: "modelled",
      links: [],
      text: INVENTED_ROW.source,
    });
  }
  return rows;
}

/** The source line of design-tokens 3.5. */
export const SOURCE_DEFAULT = {
  source: "InfraVana cost model on illustrative price tables.",
  note: "all figures are invented placeholders, not quotes.",
};
export const SOURCE_INVENTED = { source: "invented placeholder data.", note: null };

/** The Source cell of one row. */
function SourceCell({ row }: { row: SourceRow }) {
  if (row.text !== null) return <>{row.text}</>;
  if (row.links.length === 0) return <>{NO_ADDRESS}</>;
  // Several addresses in one row: each link says which part it is for.
  const named = row.links.length > 1;
  return (
    <>
      {row.links.map((link, i) => (
        <span key={link.url} className="sources__link">
          {i > 0 ? "; " : null}
          {isLinkable(link.url) ? (
            <a href={link.url} rel="noreferrer noopener">
              {PRICE_LIST}
              {named ? ` (${link.names.join(", ")})` : ""}
            </a>
          ) : (
            <>
              {PRICE_LIST}
              {named ? ` (${link.names.join(", ")})` : ""}
            </>
          )}
          {link.placeholder ? <em className="sources__note"> {PLACEHOLDER_NOTE}</em> : null}
        </span>
      ))}
    </>
  );
}

interface ProvenanceNotesProps {
  size: "stage" | "thumb";
  parts: ProvenancePart[];
  /** True when the chart draws the invented speed or batch rows (BD-11): adds their row and the invented source line. */
  invented?: boolean;
}

/**
 * Under a chart, stage size only (a thumbnail is nothing but the picture): the
 * closed "Where these numbers come from" disclosure (spec 15.10) and the
 * source line. The disclosure is built like "Fine-tune the assumptions": a
 * `<details>` that opens a table with one row per vendor-reported or modelled
 * series or group. No badge, outline or line style carries provenance.
 */
export function ProvenanceNotes({ size, parts, invented = false }: ProvenanceNotesProps) {
  if (size !== "stage") return null;
  const rows = sourceRowsOf(parts, invented);
  const source = invented ? SOURCE_INVENTED : SOURCE_DEFAULT;
  return (
    <div className="chart-notes">
      <details className="sources">
        <summary>Where these numbers come from</summary>
        {rows.length === 0 ? (
          <p className="sources__empty">{ALL_MEASURED}</p>
        ) : (
          <table className="sources__table">
            <thead>
              <tr>
                <th scope="col">Bar or group</th>
                <th scope="col">Covers</th>
                <th scope="col">Basis</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.provenance}|${row.group}`}>
                  <td className="sources__group">{row.group}</td>
                  <td>{row.covers.join("; ")}</td>
                  <td>{PROVENANCE_TEXT[row.provenance]}</td>
                  <td>
                    <SourceCell row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </details>
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
