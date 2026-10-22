import { describe, expect, it } from "vitest";
import { parseNumber } from "./parseNumber";

describe("parseNumber: the forms a visitor types (spec 5.1)", () => {
  it.each([
    ["2500", 2500],
    ["73", 73],
    ["10000", 10_000],
    ["100000000", 100_000_000],
    ["1,500", 1500],
    ["1,000,000,000", 1_000_000_000],
    ["20M", 20_000_000],
    ["20m", 20_000_000],
    ["20 M", 20_000_000],
    ["$1.5m", 1_500_000],
    ["$ 20M", 20_000_000],
    ["1.5k", 1500],
    ["1.5K", 1500],
    ["20 thousand", 20_000],
    ["1.5 million", 1_500_000],
    ["2 billion", 2_000_000_000],
    ["3b", 3_000_000_000],
    ["1.5B", 1_500_000_000],
    [".5m", 500_000],
    ["  42  ", 42],
  ])("reads %j as %i", (text, expected) => {
    expect(parseNumber(text)).toBe(expected);
  });

  it("reads a decimal as the nearest whole number", () => {
    expect(parseNumber("999.6")).toBe(1000);
    expect(parseNumber("1,500.5")).toBe(1501);
    expect(parseNumber("73.4")).toBe(73);
  });
});

describe("parseNumber: negative, zero and tiny values are numbers, left for the caller to clamp", () => {
  it("keeps a negative", () => {
    expect(parseNumber("-5")).toBe(-5);
    expect(parseNumber("-$5")).toBe(-5);
    expect(parseNumber("-1.5k")).toBe(-1500);
  });

  it("keeps zero", () => {
    expect(parseNumber("0")).toBe(0);
    expect(parseNumber("0k")).toBe(0);
  });

  it("turns a negative that rounds to zero into +0, never -0", () => {
    const r = parseNumber("-0.2");
    expect(r).not.toBeNull();
    expect(Object.is(r, 0)).toBe(true);
    expect(Object.is(parseNumber("-0"), 0)).toBe(true);
  });
});

describe("parseNumber: text that is not a number gives null", () => {
  it.each([
    [""],
    ["   "],
    ["hello"],
    ["abc123"],
    ["12abc"],
    ["k"],
    ["M"],
    ["$"],
    ["-"],
    ["."],
    ["1."],
    ["1e3"],
    ["1e7"],
    ["NaN"],
    ["Infinity"],
    ["$-5"],
    ["1 000"],
    ["20 million dollars"],
  ])("rejects %j", (text) => {
    expect(parseNumber(text)).toBeNull();
  });

  it("rejects a comma that is not a thousands separator, rather than reading '1,5' as 15", () => {
    expect(parseNumber("1,5")).toBeNull();
    expect(parseNumber("1,50")).toBeNull();
    expect(parseNumber("1,5000")).toBeNull();
    expect(parseNumber("12,34,567")).toBeNull();
    expect(parseNumber(",500")).toBeNull();
  });

  it("rejects a number too large to hold, rather than returning Infinity", () => {
    expect(parseNumber("9".repeat(400))).toBeNull();
  });
});
