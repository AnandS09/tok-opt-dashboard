import type { Provenance } from "../contract";
import { fmtUsd, fmtUsdSig } from "../shared/format";

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

const SUFFIX_SIZE: Record<string, number> = { "": 1, K: 1e3, M: 1e6, B: 1e9 };

/**
 * A budget as written in a caption or on the budget line. A round budget is
 * written short ("$1M", "$100K"), as the visitor typed it; a budget that the
 * short form would round ($999,500 is not "$1M") keeps three significant digits.
 */
export function fmtBudget(n: number): string {
  const short = fmtUsd(n);
  const m = /^\$(\d+(?:\.\d+)?)([KMB]?)$/.exec(short);
  const exact = m !== null && Math.abs(Number(m[1]) * SUFFIX_SIZE[m[2]] - n) <= Math.abs(n) * 1e-9;
  return exact ? short : fmtUsdSig(n);
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
