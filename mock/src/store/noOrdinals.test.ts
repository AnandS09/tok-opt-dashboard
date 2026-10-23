/**
 * Code search for spec 15.9: nothing in the page's source gives a chart an
 * ordinal. The copy and the style sheets are searched (not tests, not the
 * development checks, which name the old text to forbid it).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "dev" ? [] : files(path);
    return /\.(tsx?|css)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name) ? [path] : [];
  });
}

const sources = files(SRC).map((path) => ({ name: relative(SRC, path), text: readFileSync(path, "utf8") }));

describe("no ordinal numbers on charts (spec 15.9)", () => {
  it("finds the source files it is meant to search", () => {
    expect(sources.length).toBeGreaterThan(50);
    expect(sources.some((s) => s.name.endsWith("Stage.tsx"))).toBe(true);
    expect(sources.some((s) => s.name.endsWith("app.css"))).toBe(true);
  });

  it("has no 'Figure' followed by a number or a template for one, in code or copy", () => {
    const hits = sources.filter((s) => /(^|[^\w-])figure\s*(\d|\$\{)/i.test(s.text)).map((s) => s.name);
    expect(hits).toEqual([]);
  });

  it("has no CSS that generates a figure number", () => {
    const hits = sources
      .filter((s) => /counter\(fig\)|counter-increment:\s*fig|counter-reset:\s*fig|--figure-number/.test(s.text))
      .map((s) => s.name);
    expect(hits).toEqual([]);
    const generated = sources.filter((s) => /content:\s*"Figure/i.test(s.text)).map((s) => s.name);
    expect(generated).toEqual([]);
  });

  it("has no 'n / N' position count in the stage's components", () => {
    const stage = sources.filter((s) => /(ChartIndex|GridView|Stage)\.tsx$/.test(s.name));
    expect(stage).toHaveLength(3);
    for (const s of stage) expect(s.text, s.name).not.toMatch(/\{\s*(active|index|i)\s*\+\s*1\s*\}/);
  });
});
