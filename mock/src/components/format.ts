import type { HardwareClass, LatencyClass, Stage } from "../contract";

const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export const fmtInt = (n: number): string => integer.format(n);

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
