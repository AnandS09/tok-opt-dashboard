/**
 * Reads what a visitor types into a number box (spec 5.1): "2500", "1,500",
 * "20M", "$1.5m", "20 thousand". Pure, with no React.
 */

const MULTIPLIER: Record<string, number> = {
  k: 1e3,
  thousand: 1e3,
  m: 1e6,
  million: 1e6,
  b: 1e9,
  billion: 1e9,
};

// sign, optional "$", digits (plain, or grouped as 1,500), optional fraction, optional suffix.
const FORM = /^([+-]?)\s*\$?\s*(\d{1,3}(?:,\d{3})+|\d+)?(\.\d+)?\s*(k|m|b|thousand|million|billion)?$/;

/**
 * The whole number the text stands for, or null when it is not a number.
 * A negative, zero or fractional value is still a number (it is rounded to
 * the nearest whole number, and the caller clamps it to its range); a comma
 * only counts as a thousands separator ("1,5" is rejected, not read as 15).
 */
export function parseNumber(text: string): number | null {
  const m = FORM.exec(text.trim().toLowerCase());
  if (m === null) return null;
  const [, sign, whole, fraction, suffix] = m;
  if (whole === undefined && fraction === undefined) return null;
  const magnitude = Number(`${(whole ?? "0").replace(/,/g, "")}${fraction ?? ""}`) * (suffix ? MULTIPLIER[suffix] : 1);
  if (!Number.isFinite(magnitude)) return null;
  const signed = sign === "-" ? -magnitude : magnitude;
  // Adding 0 turns -0 (from "-0.2") into 0.
  return Math.round(signed) + 0;
}
