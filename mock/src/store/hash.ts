/**
 * The page address after the `#` (spec 4.1, row "URL hash"): pure parse and
 * serialise functions with no React and no `window`, so a test can call them
 * directly.
 *
 *   #slide=C2&goal=G4&cmp=<pattern_id>&q=<step>&s=<step>&c10=speed
 *
 * `cmp` is left out for the default comparator (the typical buyer), `q` and
 * `s` appear only in the G4 tab, and `c10=speed` only when the speed view of
 * C10 is on. The hash is the whole state: a field that is absent reads as its
 * default, so a link with only `slide=C3` opens C3 on the default tab.
 */
import type { ChartId, GoalId, PatternId } from "../contract";

/** Which axis the C10 chart plots (spec 6.3). */
export type C10View = "quality" | "speed";

/** Everything the address holds. */
export interface HashFields {
  /** The chart in focus; null until one is known. */
  slide: ChartId | null;
  goal: GoalId;
  /** A `buying_patterns.csv` pattern id; null is the default, the typical buyer for the stage. */
  comparator: PatternId | null;
  /** G4 step of the quality give-up (spec 6.2). */
  qualityStep: number;
  /** G4 step of the speed give-up (spec 6.2). */
  speedStep: number;
  c10: C10View;
}

export const DEFAULT_FIELDS: HashFields = {
  slide: null,
  goal: "G1",
  comparator: null,
  qualityStep: 0,
  speedStep: 0,
  c10: "quality",
};

/** The largest step a hash may name; a value past it reads as unusable and falls back to 0. */
const MAX_STEP = 99;

const KEYS = ["slide", "goal", "cmp", "q", "s", "c10"] as const;

const CHART_ID = /^C(?:10|[1-9])$/;
const GOAL_ID = /^G[1-4]$/;
const WHOLE_NUMBER = /^\d{1,3}$/;

function paramsOf(hash: string): URLSearchParams {
  return new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
}

function stepOf(raw: string | null): number {
  if (raw === null || !WHOLE_NUMBER.test(raw)) return 0;
  const n = Number(raw);
  return n <= MAX_STEP ? n : 0;
}

/**
 * True when the hash names at least one stage field. A hash such as
 * `#contact` names none and must not reset the page.
 */
export function hasStageFields(hash: string): boolean {
  const params = paramsOf(hash);
  return KEYS.some((key) => params.has(key));
}

/**
 * Reads a hash (with or without the leading `#`). A field that is missing or
 * unusable (an unknown chart id, a step that is not a whole number) takes its
 * default; unknown keys are ignored.
 */
export function parseHash(hash: string): HashFields {
  const params = paramsOf(hash);
  const slide = params.get("slide");
  const goal = params.get("goal");
  const cmp = params.get("cmp");
  return {
    slide: slide !== null && CHART_ID.test(slide) ? (slide as ChartId) : DEFAULT_FIELDS.slide,
    goal: goal !== null && GOAL_ID.test(goal) ? (goal as GoalId) : DEFAULT_FIELDS.goal,
    comparator: cmp !== null && cmp.trim() !== "" ? cmp.trim() : DEFAULT_FIELDS.comparator,
    qualityStep: stepOf(params.get("q")),
    speedStep: stepOf(params.get("s")),
    c10: params.get("c10") === "speed" ? "speed" : "quality",
  };
}

/**
 * The hash for a set of fields, with the leading `#`. Fields at their default
 * are left out as the spec says: `cmp` when null, `q` and `s` outside G4,
 * `c10` unless speed. An empty result is just `#`.
 */
export function serialiseHash(fields: HashFields): string {
  const parts: string[] = [];
  if (fields.slide !== null) parts.push(`slide=${encodeURIComponent(fields.slide)}`);
  parts.push(`goal=${encodeURIComponent(fields.goal)}`);
  if (fields.comparator !== null) parts.push(`cmp=${encodeURIComponent(fields.comparator)}`);
  if (fields.goal === "G4") {
    parts.push(`q=${fields.qualityStep}`, `s=${fields.speedStep}`);
  }
  if (fields.c10 === "speed") parts.push("c10=speed");
  return `#${parts.join("&")}`;
}
