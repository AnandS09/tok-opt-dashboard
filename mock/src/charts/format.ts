import type { Provenance } from "../contract";

/** Price per million tokens: $18.50, $0.021. */
export function fmtUsdPerMtok(n: number): string {
  return `$${n < 0.1 ? n.toFixed(3) : n.toFixed(2)}`;
}

/**
 * Prices per million tokens of one caption with one number of decimals, enough
 * that the smallest non-zero price keeps two significant digits and none is
 * written as zero: $12.47 and $0.44, or $12.47 and $0.034.
 */
export function pricesTogether(values: number[]): (n: number) => string {
  const smallest = Math.min(...values.filter((v) => v > 0));
  const decimals = Number.isFinite(smallest) ? Math.min(6, Math.max(2, 1 - Math.floor(Math.log10(smallest)))) : 2;
  return (n) => `$${n.toFixed(decimals)}`;
}

/** Escapes text for the HTML strings ECharts tooltips accept. */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

const PROVENANCE_RANK: Record<Provenance, number> = {
  measured: 0,
  vendor_reported: 1,
  modelled: 2,
};

/** Badge text of spec 9. */
export const PROVENANCE_TEXT: Record<Provenance, string> = {
  measured: "measured",
  modelled: "modelled",
  vendor_reported: "vendor-reported",
};

/** Worst of several provenances: a part is measured only if all inputs are. */
export function worstProvenance(values: Provenance[]): Provenance {
  return values.reduce<Provenance>(
    (worst, p) => (PROVENANCE_RANK[p] > PROVENANCE_RANK[worst] ? p : worst),
    "measured",
  );
}

// ---------------------------------------------------------------------------
// CSV (RFC 4180)
// ---------------------------------------------------------------------------

export type CsvCell = string | number | null;

function csvField(cell: CsvCell): string {
  if (cell === null) return "";
  const text = String(cell);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Header row first, CRLF line breaks, fields quoted only when they need it. */
export function toCsvText(header: string[], rows: CsvCell[][]): string {
  return [header, ...rows].map((row) => row.map(csvField).join(",")).join("\r\n");
}
