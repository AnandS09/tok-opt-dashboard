/**
 * Helpers for share controls that must keep summing to 1 (spec 5: model mix
 * and workload mix). Pure functions over plain records.
 */

const STEP = 100; // shares are kept to whole percentage points

function toPoints(share: number): number {
  return Math.round(Math.min(1, Math.max(0, share)) * STEP);
}

/**
 * Set one share and spread the remainder over the others in proportion to
 * their current shares (equally when they are all zero). The result sums to
 * exactly 1 and every value is a whole percentage point.
 */
export function rebalance(
  shares: Record<string, number>,
  keys: string[],
  changed: string,
  value: number,
): Record<string, number> {
  const points: Record<string, number> = {};
  for (const k of keys) points[k] = toPoints(shares[k] ?? 0);
  const target = toPoints(value);
  const others = keys.filter((k) => k !== changed);
  if (others.length === 0) return { [changed]: 1 };

  const remainder = STEP - target;
  const otherTotal = others.reduce((sum, k) => sum + points[k], 0);
  const next: Record<string, number> = { [changed]: target };

  let assigned = 0;
  others.forEach((k, i) => {
    if (i === others.length - 1) {
      next[k] = remainder - assigned;
      return;
    }
    const share =
      otherTotal > 0
        ? Math.round((points[k] / otherTotal) * remainder)
        : Math.round(remainder / others.length);
    next[k] = Math.min(share, remainder - assigned);
    assigned += next[k];
  });

  const out: Record<string, number> = {};
  for (const k of keys) out[k] = next[k] / STEP;
  return out;
}

/** True when two share records agree to within half a percentage point. */
export function sameShares(
  a: Record<string, number>,
  b: Record<string, number>,
  keys: string[],
): boolean {
  return keys.every((k) => Math.abs((a[k] ?? 0) - (b[k] ?? 0)) < 0.005);
}
