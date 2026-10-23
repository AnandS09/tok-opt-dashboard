import { describe, expect, it } from "vitest";
import { DEFAULT_FIELDS, parseHash, serialiseHash } from "./hash";

/** Spec 4.1 and 6.3 acceptance (5): the address holds the chart, the tab, the comparator, the G4 steps and C10's view, and loading it restores them. */

describe("the address", () => {
  it("writes c10=speed only for the speed view, and loads it back", () => {
    const speed = serialiseHash({ ...DEFAULT_FIELDS, slide: "C10", c10: "speed" });
    expect(speed).toContain("c10=speed");
    expect(parseHash(speed).c10).toBe("speed");
    expect(parseHash(speed).slide).toBe("C10");
    expect(serialiseHash({ ...DEFAULT_FIELDS, slide: "C10", c10: "quality" })).not.toContain("c10=");
    expect(parseHash("#slide=C10&c10=nonsense").c10).toBe("quality");
  });

  it("round-trips every field", () => {
    const fields = { slide: "C3", goal: "G4", comparator: "vendor2_direct", qualityStep: 2, speedStep: 1, c10: "speed" } as const;
    expect(parseHash(serialiseHash(fields))).toEqual(fields);
  });
});
