import { describe, expect, it } from "vitest";
import {
  BUDGET_USD_PER_QUARTER_RANGE as BUDGET,
  CUSTOMERS_RANGE as CUSTOMERS,
  USERS_RANGE as USERS,
  type Range,
} from "../data/ranges";
import { BUDGET_MARKS } from "./intake";
import {
  SLIDER_STEPS,
  adjacentMark,
  clampTyped,
  positionToValue,
  syncPosition,
  valueToFraction,
  valueToPosition,
} from "./logScale";

const RANGES: [string, Range][] = [
  ["users", USERS],
  ["customers", CUSTOMERS],
  ["budget", BUDGET],
];

describe("valueToFraction", () => {
  it("is 0 at the range minimum and 1 at the maximum", () => {
    for (const [, r] of RANGES) {
      expect(valueToFraction(r.min, r)).toBe(0);
      expect(valueToFraction(r.max, r)).toBe(1);
    }
  });

  it("is logarithmic: each decade is an equal share of the track", () => {
    expect(valueToFraction(10, USERS)).toBeCloseTo(0.25, 12); // 1 decade of 4
    expect(valueToFraction(100, USERS)).toBeCloseTo(0.5, 12);
    expect(valueToFraction(1e4, CUSTOMERS)).toBeCloseTo(4 / 7, 12); // 4 decades of 7
    expect(valueToFraction(1e5, BUDGET)).toBeCloseTo(0.4, 12); // 2 decades of 5
    expect(valueToFraction(1e7, BUDGET)).toBeCloseTo(0.8, 12);
  });

  it("clamps values outside the range instead of leaving the track", () => {
    expect(valueToFraction(0, USERS)).toBe(0);
    expect(valueToFraction(-5, USERS)).toBe(0);
    expect(valueToFraction(999, BUDGET)).toBe(0);
    expect(valueToFraction(1e8 * 10, BUDGET)).toBe(1);
    expect(valueToFraction(1e9, USERS)).toBe(1);
  });

  it("is 0 for a range with no width", () => {
    expect(valueToFraction(5, { min: 5, max: 5 })).toBe(0);
  });
});

describe("valueToPosition", () => {
  it("maps the edge values the reviewer pinned (1, 10, 73, 10,000, 1e7, 1e8, 0, -5) on the users track", () => {
    const at = (v: number) => valueToPosition(v, USERS);
    expect([1, 10, 73, 10_000, 1e7, 1e8, 0, -5].map(at)).toEqual([0, 25, 47, 100, 100, 100, 0, 0]);
  });

  it("puts 1e7 at the top of the customers track, and 1 to 73 at the bottom of the budget track", () => {
    expect(valueToPosition(1e7, CUSTOMERS)).toBe(100);
    expect(valueToPosition(1e8, CUSTOMERS)).toBe(100);
    expect(valueToPosition(10, CUSTOMERS)).toBe(14);
    expect([1, 10, 73].map((v) => valueToPosition(v, BUDGET))).toEqual([0, 0, 0]);
    expect(valueToPosition(1e7, BUDGET)).toBe(80);
    expect(valueToPosition(1e8, BUDGET)).toBe(100);
  });

  it("honours a custom number of steps", () => {
    expect(valueToPosition(100, USERS, 10)).toBe(5);
    expect(valueToPosition(USERS.max, USERS, 10)).toBe(10);
  });
});

describe("positionToValue", () => {
  it("gives the range minimum at position 0 and the maximum exactly at the last step", () => {
    for (const [, r] of RANGES) {
      expect(positionToValue(0, r)).toBe(r.min);
      expect(positionToValue(SLIDER_STEPS, r)).toBe(r.max);
    }
  });

  it("treats positions outside 0..steps as the nearest end", () => {
    expect(positionToValue(-3, USERS)).toBe(1);
    expect(positionToValue(140, USERS)).toBe(10_000);
    expect(positionToValue(-3, BUDGET)).toBe(1_000);
    expect(positionToValue(140, BUDGET)).toBe(100_000_000);
    expect(positionToValue(-1, CUSTOMERS)).toBe(1);
    expect(positionToValue(101, CUSTOMERS)).toBe(10_000_000);
  });

  it("lands on round values: two significant figures from 10 up", () => {
    expect(positionToValue(50, USERS)).toBe(100);
    expect(positionToValue(99, USERS)).toBe(9_100);
    expect(positionToValue(50, CUSTOMERS)).toBe(3_200);
    expect(positionToValue(99, CUSTOMERS)).toBe(8_500_000);
    expect(positionToValue(1, BUDGET)).toBe(1_100);
    expect(positionToValue(50, BUDGET)).toBe(320_000);
    expect(positionToValue(99, BUDGET)).toBe(89_000_000);
    for (const [, r] of RANGES) {
      for (let p = 1; p < SLIDER_STEPS; p++) {
        const v = positionToValue(p, r);
        if (v >= 10) {
          const unit = 10 ** (Math.floor(Math.log10(v)) - 1);
          expect(v % unit, `position ${p} gave ${v}`).toBe(0);
        } else {
          expect(Number.isInteger(v), `position ${p} gave ${v}`).toBe(true);
        }
      }
    }
  });

  it("never decreases as the position rises, and stays inside the range", () => {
    for (const [name, r] of RANGES) {
      let previous = -Infinity;
      for (let p = 0; p <= SLIDER_STEPS; p++) {
        const v = positionToValue(p, r);
        expect(v, `${name} position ${p}`).toBeGreaterThanOrEqual(previous);
        expect(v).toBeGreaterThanOrEqual(r.min);
        expect(v).toBeLessThanOrEqual(r.max);
        previous = v;
      }
    }
  });

  it("never rounds past the maximum of a range whose maximum is not a round number", () => {
    // 9,460^(9999/10000) is 9,451, which two-figure rounding would take to 9,500, above the maximum.
    const odd: Range = { min: 1, max: 9_460 };
    expect(positionToValue(9_999, odd, 10_000)).toBe(9_460);
    for (let p = 0; p <= 10_000; p += 97) {
      expect(positionToValue(p, odd, 10_000)).toBeLessThanOrEqual(odd.max);
    }
  });

  it("gives the budget track a distinct value at every position", () => {
    const values = Array.from({ length: SLIDER_STEPS + 1 }, (_, p) => positionToValue(p, BUDGET));
    expect(new Set(values).size).toBe(SLIDER_STEPS + 1);
  });
});

describe("round trips between value and position", () => {
  it("every position's value maps to a position that gives the same value back", () => {
    for (const [name, r] of RANGES) {
      for (let p = 0; p <= SLIDER_STEPS; p++) {
        const v = positionToValue(p, r);
        const back = valueToPosition(v, r);
        expect(positionToValue(back, r), `${name} position ${p} value ${v}`).toBe(v);
      }
    }
  });

  it("the preset marks that sit on the grid round-trip exactly (budget decades, users 25 and 100)", () => {
    for (const mark of BUDGET_MARKS) {
      expect(positionToValue(valueToPosition(mark, BUDGET), BUDGET)).toBe(mark);
    }
    expect(valueToPosition(25, USERS)).toBe(35);
    expect(positionToValue(35, USERS)).toBe(25);
    expect(positionToValue(valueToPosition(100, USERS), USERS)).toBe(100);
  });

  it("budget marks sit at 20, 40, 60 and 80 on the track", () => {
    expect(BUDGET_MARKS.map((m) => valueToPosition(m, BUDGET))).toEqual([20, 40, 60, 80]);
  });

  it("a mark between grid values (50, 500 people) still shows its own exact value, not the grid's neighbour", () => {
    // Positions 42 and 67 mean 48 and 480; the thumb must not claim those for 50 and 500.
    expect(positionToValue(valueToPosition(50, USERS), USERS)).toBe(48);
    expect(positionToValue(valueToPosition(500, USERS), USERS)).toBe(480);
    expect(syncPosition(valueToPosition(50, USERS), 50, USERS)).toBe(42);
  });
});

describe("syncPosition", () => {
  it("keeps the position the visitor moved to while it still means the value", () => {
    // Positions 0 to 6 all mean 1 person: an arrow press on 1 must not snap back to 0.
    expect(positionToValue(3, USERS)).toBe(1);
    expect(syncPosition(3, 1, USERS)).toBe(3);
    for (const [name, r] of RANGES) {
      for (let p = 0; p <= SLIDER_STEPS; p++) {
        expect(syncPosition(p, positionToValue(p, r), r), `${name} position ${p}`).toBe(p);
      }
    }
  });

  it("moves the thumb to the value's own position when the value came from elsewhere", () => {
    expect(syncPosition(10, 73, USERS)).toBe(47);
    expect(syncPosition(0, USERS.max, USERS)).toBe(100);
    expect(syncPosition(100, 1, USERS)).toBe(0);
  });

  it("walking the thumb with arrow presses from the minimum reaches the maximum through many distinct values", () => {
    for (const [r, start, minDistinct] of [
      [USERS, 1, 80],
      [BUDGET, 1_000, 100],
    ] as const) {
      let position = valueToPosition(start, r);
      let value: number = start;
      const seen = new Set([value]);
      for (let press = 0; press < SLIDER_STEPS; press++) {
        position = Math.min(SLIDER_STEPS, position + 1);
        value = positionToValue(position, r);
        position = syncPosition(position, value, r);
        seen.add(value);
      }
      expect(value).toBe(r.max);
      expect(seen.size).toBeGreaterThanOrEqual(minDistinct);
    }
  });
});

describe("clampTyped", () => {
  it("passes an in-range value through with no limit, including both bounds exactly", () => {
    for (const [, r] of RANGES) {
      expect(clampTyped(r.min, r)).toEqual({ value: r.min, limit: null });
      expect(clampTyped(r.max, r)).toEqual({ value: r.max, limit: null });
    }
    expect(clampTyped(73, USERS)).toEqual({ value: 73, limit: null });
  });

  it("snaps a value below the range to the minimum and says it hit the minimum", () => {
    expect(clampTyped(0, USERS)).toEqual({ value: 1, limit: "min" });
    expect(clampTyped(-5, USERS)).toEqual({ value: 1, limit: "min" });
    expect(clampTyped(0, CUSTOMERS)).toEqual({ value: 1, limit: "min" });
    expect(clampTyped(999, BUDGET)).toEqual({ value: 1_000, limit: "min" });
  });

  it("snaps a value above the range to the maximum and says it hit the maximum", () => {
    expect(clampTyped(10_001, USERS)).toEqual({ value: 10_000, limit: "max" });
    expect(clampTyped(10_000_001, CUSTOMERS)).toEqual({ value: 10_000_000, limit: "max" });
    expect(clampTyped(100_000_001, BUDGET)).toEqual({ value: 100_000_000, limit: "max" });
    expect(clampTyped(5e8, BUDGET)).toEqual({ value: 100_000_000, limit: "max" });
  });
});

describe("adjacentMark (Page Up and Page Down)", () => {
  const MARKS = [25, 50, 100, 500];

  it("Page Up goes to the next mark above, or the range maximum when there is none", () => {
    const up = (v: number) => adjacentMark(v, MARKS, 1, USERS);
    expect([1, 25, 40, 500, 600, 10_000].map(up)).toEqual([25, 50, 50, 10_000, 10_000, 10_000]);
  });

  it("Page Down goes to the next mark below, or the range minimum when there is none", () => {
    const down = (v: number) => adjacentMark(v, MARKS, -1, USERS);
    expect([1, 25, 40, 500, 600, 10_000].map(down)).toEqual([1, 1, 25, 100, 500, 500]);
  });

  it("never returns the value itself when a mark equals it", () => {
    expect(adjacentMark(50, MARKS, 1, USERS)).toBe(100);
    expect(adjacentMark(50, MARKS, -1, USERS)).toBe(25);
  });

  it("does not depend on the order the marks are given in, and does not reorder the caller's array", () => {
    const shuffled = [500, 25, 100, 50];
    const copy = [...shuffled];
    expect(adjacentMark(40, shuffled, 1, USERS)).toBe(50);
    expect(adjacentMark(40, shuffled, -1, USERS)).toBe(25);
    expect(adjacentMark(600, shuffled, -1, USERS)).toBe(500);
    expect(shuffled).toEqual(copy);
  });

  it("ignores a mark outside the range", () => {
    expect(adjacentMark(600, [25, 20_000], 1, USERS)).toBe(10_000);
    expect(adjacentMark(10, [0, 5_000], -1, USERS)).toBe(1);
  });

  it("walks the budget decade marks", () => {
    const up = (v: number) => adjacentMark(v, BUDGET_MARKS, 1, BUDGET);
    const down = (v: number) => adjacentMark(v, BUDGET_MARKS, -1, BUDGET);
    expect([1_000, 50_000, 1e7, 1e8].map(up)).toEqual([10_000, 100_000, 1e8, 1e8]);
    expect([1_000, 50_000, 1e7, 1e8].map(down)).toEqual([1_000, 10_000, 1_000_000, 1e7]);
  });
});
