import type { LatencyClass, Stage } from "../contract";

const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export const fmtInt = (n: number): string => integer.format(n);

export const STAGE_LABEL: Record<Stage, string> = {
  seats: "Per-seat plans",
  api: "Pay as you go",
  platform: "Cloud contract",
};

export const STAGE_HINT: Record<Stage, string> = {
  seats: "A monthly subscription per person",
  api: "Paying one provider for what you use",
  platform: "A cloud platform with reserved capacity",
};

export const LATENCY_LABEL: Record<LatencyClass, string> = {
  interactive: "instantly, like a chat",
  standard: "within a few seconds",
  batch: "overnight",
};

/** Plain-language list: "a, b and c". */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
