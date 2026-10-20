import type { HardwareClass, LatencyClass, Stage } from "../contract";

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});
const usdFull = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export const fmtUsd = (n: number): string => usdCompact.format(n);
export const fmtUsdFull = (n: number): string => usdFull.format(n);
export const fmtInt = (n: number): string => integer.format(n);
export const fmtPercent = (share: number): string => `${Math.round(share * 100)}%`;

/** "2.4x": one decimal, and no trailing ".0" noise below ten. */
export const fmtMultiple = (n: number): string => `${n >= 10 ? Math.round(n) : n.toFixed(1)}x`;

/** Hardware ids have no label column, so show the id in capitals with spaces. */
export const hwLabel = (hwId: string): string => hwId.replace(/_/g, " ").toUpperCase();

export const STAGE_LABEL: Record<Stage, string> = {
  seats: "Seats",
  api: "API",
  platform: "Platform",
};

export const STAGE_HINT: Record<Stage, string> = {
  seats: "Per-user subscriptions",
  api: "Pay-as-you-go on one provider",
  platform: "A cloud platform with committed capacity",
};

export const LATENCY_LABEL: Record<LatencyClass, string> = {
  interactive: "Interactive",
  standard: "Standard",
  batch: "Batch",
};

export const HARDWARE_CLASS_LABEL: Record<HardwareClass, string> = {
  gpu: "GPU",
  accelerator: "Accelerator",
};

/** Plain-language list: "a, b and c". */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
