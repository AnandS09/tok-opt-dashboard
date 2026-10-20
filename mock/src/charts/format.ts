import type { Provenance } from "../contract";

/** Scales n to a unit with three significant digits, e.g. 99318 -> "99.3K". */
function scaled(n: number, units: readonly [number, string][]): string {
  const abs = Math.abs(n);
  for (let i = 0; i < units.length; i++) {
    const [size, suffix] = units[i];
    if (abs >= size) {
      const value = Number((n / size).toPrecision(3));
      // 999.6K rounds to 1000K: step up to the next unit instead.
      if (Math.abs(value) >= 1000 && i > 0) continue;
      return `${value}${suffix}`;
    }
  }
  return String(Math.round(n));
}

const USD_UNITS: readonly [number, string][] = [
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];
const TOKEN_UNITS: readonly [number, string][] = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];

/** Compact dollars: $99.3K, $1.2M, $850. */
export function fmtUsd(n: number): string {
  return `${n < 0 ? "-" : ""}$${scaled(Math.abs(n), USD_UNITS)}`;
}

/** Whole dollars with thousands separators: $99,318. */
export function fmtUsdFull(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/** Price per million tokens: $18.50, $0.021. */
export function fmtUsdPerMtok(n: number): string {
  return `$${n < 0.1 ? n.toFixed(3) : n.toFixed(2)}`;
}

/** Compact token counts: 4.9B, 820M. */
export function fmtTokens(n: number): string {
  return scaled(n, TOKEN_UNITS);
}

/** "2.4x", same convention as the headline strip. */
export function fmtMultiple(n: number): string {
  return `${n >= 10 ? Math.round(n) : n.toFixed(1)}x`;
}

/** Whole percent, same rounding as the headline strip. */
export function fmtPct(n: number): string {
  return `${Math.round(n)}%`;
}

export function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
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
