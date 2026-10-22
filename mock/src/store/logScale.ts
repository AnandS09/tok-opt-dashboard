import { clampToRange, type Range } from "../data/ranges";

/**
 * The log scale behind the intake sliders (spec 5.1): value to slider
 * position and back, clamping a typed value, and the preset mark a Page Up or
 * Page Down press jumps to. Pure functions with no React, so each can be
 * tested alone.
 */

/** Slider positions 0..100: about 10% along four decades per arrow press, so keyboard use is practical. */
export const SLIDER_STEPS = 100;

/** Where a value sits on the log track, from 0 (the range minimum) to 1 (the maximum). Out-of-range values clamp. */
export function valueToFraction(value: number, range: Range): number {
  const v = clampToRange(value, range);
  if (range.max <= range.min) return 0;
  return Math.log(v / range.min) / Math.log(range.max / range.min);
}

/** The whole slider position (0 to `steps`) nearest a value. */
export function valueToPosition(value: number, range: Range, steps: number = SLIDER_STEPS): number {
  return Math.round(valueToFraction(value, range) * steps);
}

/** Two significant figures from 10 up, whole numbers below it, so dragging lands on round values. */
function roundNicely(v: number): number {
  if (v < 10) return Math.round(v);
  const unit = 10 ** (Math.floor(Math.log10(v)) - 1);
  return Math.round(v / unit) * unit;
}

/**
 * The whole-number value at a slider position. Position 0 gives the range
 * minimum and `steps` gives the maximum exactly; positions between give a
 * rounded value inside the range.
 */
export function positionToValue(position: number, range: Range, steps: number = SLIDER_STEPS): number {
  if (position <= 0) return range.min;
  if (position >= steps) return range.max;
  const raw = range.min * (range.max / range.min) ** (position / steps);
  return clampToRange(roundNicely(raw), range);
}

/**
 * The position the thumb should show for `value`. Near the low end several
 * positions round to the same value, so the position the visitor has just
 * moved to is kept while it still means `value`; any other value moves the
 * thumb to its own position. Without this, an arrow press on 1 would never
 * leave 1.
 */
export function syncPosition(position: number, value: number, range: Range, steps: number = SLIDER_STEPS): number {
  return positionToValue(position, range, steps) === value ? position : valueToPosition(value, range, steps);
}

/** What a typed value became after clamping, and which bound (if any) it was snapped to. */
export interface Clamped {
  value: number;
  limit: "min" | "max" | null;
}

/** Snaps a typed value to the range (spec 5.2) and says which bound it hit. */
export function clampTyped(value: number, range: Range): Clamped {
  if (value < range.min) return { value: range.min, limit: "min" };
  if (value > range.max) return { value: range.max, limit: "max" };
  return { value, limit: null };
}

/**
 * The preset mark a Page Down (`-1`) or Page Up (`1`) press jumps to from
 * `value`: the next mark below or above it, or the range bound when there is
 * none. Marks may be given in any order.
 */
export function adjacentMark(value: number, marks: readonly number[], direction: 1 | -1, range: Range): number {
  const sorted = [...marks].sort((a, b) => a - b);
  if (direction > 0) return sorted.find((m) => m > value && m <= range.max) ?? range.max;
  return [...sorted].reverse().find((m) => m < value && m >= range.min) ?? range.min;
}
