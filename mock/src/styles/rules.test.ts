import { describe, expect, it } from "vitest";
import { filesUnder, mockFile } from "../test/cssTokens";

/**
 * Where the palette's tokens may be used (spec 15.10 to 15.12, 14.5): searches
 * of the source for what must not be there.
 */

const SOURCE = filesUnder("src", /\.(ts|tsx|css|mjs)$/);

describe("code searches of mock/src", () => {
  it("finds no colour literal outside tokens.css (spec 15.12 acceptance 6)", () => {
    const literal = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(/;
    const found = SOURCE.filter(([file]) => file !== "src/styles/tokens.css").flatMap(([file, text]) => {
      const lines = text.split("\n");
      return lines.flatMap((line, i) => (literal.test(line) ? [`${file}:${i + 1}: ${line.trim().slice(0, 100)}`] : []));
    });
    expect(found).toEqual([]);
  });

  it("finds --color-text-disabled only in :disabled rules (spec 15.12 acceptance 4)", () => {
    const offenders: string[] = [];
    for (const [file, css] of SOURCE.filter(([f]) => f.endsWith(".css") && f !== "src/styles/tokens.css")) {
      for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if ((m[2] as string).includes("--color-text-disabled") && !(m[1] as string).includes(":disabled")) offenders.push(`${file}: ${(m[1] as string).trim()}`);
      }
    }
    const elsewhere = SOURCE.filter(([f]) => !f.endsWith(".css") && /color-text-disabled|textDisabled/.test(mockFile(f))).map(([f]) => f);
    expect(offenders).toEqual([]);
    // Chart code never reads it.
    expect(elsewhere.filter((f) => f.startsWith("src/charts/") && !f.includes("/dev/") && !f.endsWith(".test.ts"))).toEqual([]);
  });

  it("finds --color-section in no chart (spec 15.12 acceptance 5)", () => {
    const chartFiles = SOURCE.filter(([f]) => (f.startsWith("src/charts/") && !f.includes("/dev/") && !f.endsWith(".test.ts")) || ["src/styles/compare.css", "src/styles/c10.css"].includes(f));
    expect(chartFiles.length).toBeGreaterThan(10);
    expect(chartFiles.filter(([, text]) => /--color-section|\bsection\b:\s*"--/.test(text)).map(([f]) => f)).toEqual([]);
  });

  it("finds no address literal in chart code (spec 15.10 acceptance 5)", () => {
    const chartFiles = SOURCE.filter(([f]) => f.startsWith("src/charts/") && !f.includes("/dev/") && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"));
    expect(chartFiles.length).toBeGreaterThan(10);
    expect(chartFiles.filter(([, text]) => /https?:\/\/|example\.invalid|placeholder-invented-data/.test(text)).map(([f]) => f)).toEqual([]);
  });

  it("finds no decal, pattern or dash in chart code (spec 15.11 acceptance 1)", () => {
    const chartFiles = SOURCE.filter(([f]) => f.startsWith("src/charts/") && !f.includes("/dev/") && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"));
    const found = chartFiles.flatMap(([file, text]) =>
      text.split("\n").flatMap((line, i) => (/\bdecal|decalOf|dashArray|borderType:\s*(?!"solid")\S|type:\s*"(dashed|dotted)"|dashModelled|dashVendor/.test(line) ? [`${file}:${i + 1}: ${line.trim()}`] : [])),
    );
    expect(found).toEqual([]);
  });
});
