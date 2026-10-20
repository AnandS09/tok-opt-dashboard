import type { LatencyClass, ModelMix, Scenario, Tables } from "../contract";

/**
 * The four plain questions of the guided start, and the editable sentence
 * that replaces them once answered. Each answer writes straight into the one
 * `Scenario` the rest of the page computes from; nothing here is a second
 * source of truth.
 */

export const TEAM_SIZES = [25, 50, 100, 500];
export const BUDGETS = [50_000, 100_000, 200_000, 500_000];
export const SPEEDS: LatencyClass[] = ["interactive", "standard", "batch"];
/** The "a mix of these" answer to "what is the work": an even split over every workload. */
export const MIX = "mix";

export type QuestionId = "users" | "budget" | "work" | "speed";
export const QUESTIONS: QuestionId[] = ["users", "budget", "work", "speed"];

/** A list of preset values, with the current value added in order when it is not one of them. */
export function withCurrent(values: number[], current: number): number[] {
  return values.includes(current) ? values : [...values, current].sort((a, b) => a - b);
}

export function setUsers(s: Scenario, users: number): Scenario {
  return { ...s, baseline: { ...s.baseline, users } };
}

export function setBudget(s: Scenario, budget: number): Scenario {
  return { ...s, baseline: { ...s.baseline, budget_usd_per_quarter: budget } };
}

export function setSpeed(s: Scenario, latency_class: LatencyClass): Scenario {
  return { ...s, latency_class };
}

/** The single workload the team does, or `MIX` when the work is split. */
export function workOf(s: Scenario): string {
  const ids = Object.keys(s.workload_mix).filter((id) => (s.workload_mix[id] ?? 0) > 0);
  return ids.length === 1 ? ids[0] : MIX;
}

function parseMix(json: string): ModelMix | null {
  try {
    const m = JSON.parse(json) as Partial<ModelMix>;
    return typeof m.frontier === "number" &&
      typeof m.mid === "number" &&
      typeof m.small === "number" &&
      typeof m.open_weight_share === "number"
      ? { frontier: m.frontier, mid: m.mid, small: m.small, open_weight_share: m.open_weight_share }
      : null;
  } catch {
    return null;
  }
}

/** One workload at 100% with that workload's usual model mix, or an even split that keeps the current mix. */
export function setWork(s: Scenario, work: string, tables: Tables): Scenario {
  if (work === MIX) {
    const share = 1 / tables.workloads.length;
    return { ...s, workload_mix: Object.fromEntries(tables.workloads.map((w) => [w.workload_id, share])) };
  }
  const row = tables.workloads.find((w) => w.workload_id === work);
  const mix = row ? parseMix(row.default_model_mix) : null;
  return { ...s, workload_mix: { [work]: 1 }, model_mix: mix ?? s.model_mix };
}
