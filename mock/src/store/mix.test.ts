import { describe, expect, it } from "vitest";
import { rebalance, sameShares } from "./mix";

/** A small deterministic generator, so the property cases are the same on every run. */
function lcg(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const sum = (shares: Record<string, number>, keys: string[]) =>
  Math.round(keys.reduce((total, k) => total + (shares[k] ?? 0) * 100, 0));

describe("rebalance", () => {
  const keys = ["a", "b", "c"];

  it("sets the changed share and spreads the rest in proportion to the others' current shares", () => {
    expect(rebalance({ a: 0.5, b: 0.3, c: 0.2 }, keys, "a", 0.4)).toEqual({ a: 0.4, b: 0.36, c: 0.24 });
  });

  it("spreads the rest equally when the others are all zero", () => {
    expect(rebalance({ a: 1, b: 0, c: 0 }, keys, "a", 0.4)).toEqual({ a: 0.4, b: 0.3, c: 0.3 });
  });

  it("gives the others nothing when the changed share is 1, and everything to them when it is 0", () => {
    expect(rebalance({ a: 0.5, b: 0.3, c: 0.2 }, keys, "a", 1)).toEqual({ a: 1, b: 0, c: 0 });
    expect(rebalance({ a: 0.5, b: 0.3, c: 0.2 }, keys, "a", 0)).toEqual({ a: 0, b: 0.6, c: 0.4 });
  });

  it("clamps a value outside 0..1 and rounds to a whole percentage point", () => {
    expect(rebalance({ a: 0.5, b: 0.5 }, ["a", "b"], "a", 1.7)).toEqual({ a: 1, b: 0 });
    expect(rebalance({ a: 0.5, b: 0.5 }, ["a", "b"], "a", -0.3)).toEqual({ a: 0, b: 1 });
    expect(rebalance({ a: 0.5, b: 0.5 }, ["a", "b"], "a", 0.334)).toEqual({ a: 0.33, b: 0.67 });
  });

  it("with only one key the share is 1 whatever was asked", () => {
    expect(rebalance({ a: 0.2 }, ["a"], "a", 0.2)).toEqual({ a: 1 });
  });

  it("treats a missing share as zero", () => {
    expect(rebalance({ a: 1 }, keys, "a", 0.4)).toEqual({ a: 0.4, b: 0.3, c: 0.3 });
  });

  it("does not modify the shares it was given", () => {
    const shares = { a: 0.5, b: 0.3, c: 0.2 };
    rebalance(shares, keys, "b", 0.9);
    expect(shares).toEqual({ a: 0.5, b: 0.3, c: 0.2 });
  });

  it("always sums to exactly 100 percentage points with no negative share, and the changed share is what was asked (property, 2,000 cases)", () => {
    const random = lcg(20261021);
    for (let i = 0; i < 2000; i++) {
      const n = 2 + Math.floor(random() * 4);
      const ks = Array.from({ length: n }, (_, j) => `k${j}`);
      // A random starting split in whole percentage points.
      const cuts = Array.from({ length: n - 1 }, () => Math.floor(random() * 101)).sort((x, y) => x - y);
      const points = [...cuts, 100].map((c, j) => c - (j === 0 ? 0 : (cuts[j - 1] as number)));
      const shares = Object.fromEntries(ks.map((k, j) => [k, (points[j] as number) / 100]));
      const changed = ks[Math.floor(random() * n)] as string;
      const value = random();
      const out = rebalance(shares, ks, changed, value);
      expect(sum(out, ks), JSON.stringify({ shares, changed, value })).toBe(100);
      for (const k of ks) {
        expect(out[k] as number, JSON.stringify({ shares, changed, value, k })).toBeGreaterThanOrEqual(0);
        expect(Math.abs((out[k] as number) * 100 - Math.round((out[k] as number) * 100))).toBeLessThan(1e-9);
      }
      expect(out[changed]).toBe(Math.round(value * 100) / 100);
    }
  });
});

describe("sameShares", () => {
  it("is true when every share agrees to within half a percentage point, and false beyond it", () => {
    const keys = ["a", "b"];
    expect(sameShares({ a: 0.5, b: 0.5 }, { a: 0.504, b: 0.496 }, keys)).toBe(true);
    expect(sameShares({ a: 0.5, b: 0.5 }, { a: 0.51, b: 0.49 }, keys)).toBe(false);
    expect(sameShares({ a: 0.5, b: 0.5 }, { a: 0.5, b: 0.49 }, keys)).toBe(false);
  });

  it("treats a missing share as zero", () => {
    expect(sameShares({ a: 0.5 }, { a: 0.5, b: 0 }, ["a", "b"])).toBe(true);
    expect(sameShares({ a: 0.5 }, { a: 0.5, b: 0.2 }, ["a", "b"])).toBe(false);
  });
});
