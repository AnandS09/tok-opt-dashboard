/**
 * Formatters that more than one part of the app must agree on. The headline
 * strip, the chart captions and the chart labels all write the same numbers
 * and names, so the rules live here once instead of being copied: a copy that
 * drifts would make a caption disagree with the headline above it.
 *
 * Neutral on purpose: imports nothing from the charts or the shell.
 */

/** "2.4x": one decimal below ten, whole number from ten up. */
export function fmtMultiple(n: number): string {
  return `${n >= 10 ? Math.round(n) : n.toFixed(1)}x`;
}

/** A value already in percent (24.3) as a whole percent: "24%". */
export function fmtPct(pct: number): string {
  return `${Math.round(pct)}%`;
}

/** A share between 0 and 1 (0.243) as a whole percent: "24%". */
export function fmtShare(share: number): string {
  return fmtPct(share * 100);
}

/** Hardware ids whose display name is not just the id in capitals. */
const HW_NAMES: Record<string, string> = {
  dmatrix_corsair: "d-Matrix Corsair",
  rebellions_rebel: "Rebellions Rebel",
};

/** Hardware ids have no label column: a known name, else the id in capitals ("mi355x" -> "MI355X"). */
export function hwLabel(hwId: string): string {
  return HW_NAMES[hwId] ?? hwId.replace(/_/g, " ").toUpperCase();
}

/** Plain names for the buying channels in model_offers.csv. */
const CHANNEL_NAMES: Record<string, string> = {
  direct: "Direct from the model maker",
  ec2: "AWS EC2",
  bedrock: "AWS Bedrock",
  neocloud: "Specialist GPU cloud",
  "self-host": "Your own hardware",
};

/** A channel or vendor name for display: a known plain name, else first letter capitalised. */
export function channelLabel(name: string): string {
  return CHANNEL_NAMES[name] ?? (name.length === 0 ? name : name[0].toUpperCase() + name.slice(1));
}

/** Plain names for the regions in model_offers.csv; "global" and "any" name no place worth stating. */
const REGION_NAMES: Record<string, string> = {
  useast: "US East",
  euwest: "EU West",
};

/** A region for display ("US East"), or null for an offer that is not tied to one ("global", "any", empty). */
export function regionLabel(region: string): string | null {
  if (region === "" || region === "global" || region === "any") return null;
  return REGION_NAMES[region] ?? region.replace(/_/g, " ");
}

/** The words for one offer: "Mid-tier model A on AWS EC2 (US East)", from the model's family and the channel and region names. */
export function offerLabel(family: string, channel: string, region: string): string {
  const where = regionLabel(region);
  return `${family} on ${channelLabel(channel)}${where === null ? "" : ` (${where})`}`;
}

/** Label of a self-hosted hardware segment: "Own hardware (MI355X)". */
export function selfHostLabel(hwId: string): string {
  return `Own hardware (${hwLabel(hwId)})`;
}

// ---------------------------------------------------------------------------
// Compact dollars and token counts
// ---------------------------------------------------------------------------

type Units = readonly (readonly [number, string])[];

/** Largest unit first. */
const USD_UNITS: Units = [
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];
const TOKEN_UNITS: Units = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];

/** A number below 1000 at three significant digits ("5.27", "12.3", "257"), keeping trailing zeros if asked. */
function threeSignificant(v: number, keepZeros: boolean): string {
  if (v === 0) return "0";
  if (v >= 999.5) return String(Math.round(v));
  const text = v.toPrecision(3);
  return keepZeros ? text : String(Number(text));
}

/**
 * Compact form of a non-negative number at three significant digits, in the
 * largest unit that keeps it at or above 1. A value that rounds up to 1000 of
 * a unit moves to the next larger unit ("999.6K" is written "1.00M"), and a
 * non-zero value is never written as zero: below the smallest unit it keeps
 * its three significant digits.
 */
function compact(abs: number, units: Units, keepZeros: boolean): string {
  let i = units.findIndex(([size]) => abs >= size);
  if (i === -1) return threeSignificant(abs, keepZeros);
  if (i > 0 && Number((abs / units[i][0]).toPrecision(3)) >= 1000) i -= 1;
  const [size, suffix] = units[i];
  return `${threeSignificant(abs / size, keepZeros)}${suffix}`;
}

function signed(n: number, body: (abs: number) => string, prefix: string): string {
  return `${n < 0 ? "-" : ""}${prefix}${body(Math.abs(n))}`;
}

/** Compact dollars for labels and axes: $99.3K, $1.25M, $999, trailing zeros dropped ($100K). */
export function fmtUsd(n: number): string {
  return signed(n, (abs) => compact(abs, USD_UNITS, false), "$");
}

/**
 * Compact dollars for captions: always three significant digits, so two
 * figures of one sentence have the same precision ($19.0K, $10.5K, $100K,
 * $1.00M), and a saving next to a budget a hundred times larger is still
 * shown with its digits.
 */
export function fmtUsdSig(n: number): string {
  return signed(n, (abs) => compact(abs, USD_UNITS, true), "$");
}

/** Whole dollars with thousands separators: $99,318. */
export function fmtUsdFull(n: number): string {
  const whole = Math.round(Math.abs(n));
  return `${n < 0 && whole > 0 ? "-" : ""}$${whole.toLocaleString("en-US")}`;
}

/** Compact token counts for labels and axes: 4.9B, 820M, trailing zeros dropped. */
export function fmtTokens(n: number): string {
  return signed(n, (abs) => compact(abs, TOKEN_UNITS, false), "");
}

/** Compact token counts for captions, always three significant digits: 8.02B, 11.4B, 100M. */
export function fmtTokensSig(n: number): string {
  return signed(n, (abs) => compact(abs, TOKEN_UNITS, true), "");
}
