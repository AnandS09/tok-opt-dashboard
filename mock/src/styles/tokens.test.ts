import { describe, expect, it } from "vitest";
import { MARK_CONTRAST, TEXT_CONTRAST, contrastRatio, labelColourOn } from "../charts/contrast";
import { azureTable, mockFile, realVariables, repoFile } from "../test/cssTokens";

/**
 * Spec 14.1, 14.5 and 15.12: the Azure palette in `tokens.css`. The oracle is
 * the palette's own generated file (`palette/generated/tokens.css`, block AZ,
 * which the spec says the table is copied from) and its `checks.md`, plus the
 * table of spec 14.1 itself. Every contrast is computed here from the real
 * token values, never taken from a document.
 */

const vars = realVariables();
const table = azureTable();

describe("the colour tokens equal the Azure table (spec 14.1, 15.12 acceptance 1)", () => {
  it("reads the twenty-six colour tokens the palette generates (its five violet presets are not the presets of board 04)", () => {
    expect(Object.keys(table).length).toBe(26);
  });

  it.each(Object.entries(table))("%s is %s", (name, hex) => {
    expect(vars[name]?.toLowerCase()).toBe(hex);
  });

  it("agrees with the table printed in spec 14.1, row by row", () => {
    const spec = repoFile("spec.md");
    const section = spec.slice(spec.indexOf("### 14.1 Palette"), spec.indexOf("### 14.2 Type"));
    const rows = section.split("\n").filter((l) => l.startsWith("| ") && l.includes("`#"));
    let checked = 0;
    for (const row of rows) {
      const cells = row.split("|").map((c) => c.trim());
      const names = [...(cells[2] ?? "").matchAll(/`(--[\w-]+)`/g)].map((m) => m[1] as string);
      const hexes = [...(cells[3] ?? "").matchAll(/`(#[0-9a-f]{6})`/gi)].map((m) => (m[1] as string).toLowerCase());
      // A row of presets or the notice family names fewer tokens than values; the generated file covers those.
      // (The page and chart ground row names two tokens that share one value.)
      if (names.length === 0 || (hexes.length !== 1 && names.length !== hexes.length) || names.some((n) => n.startsWith("--color-preset"))) continue;
      names.forEach((name, i) => {
        expect(vars[name]?.toLowerCase(), `spec 14.1 row "${cells[1]}": ${name}`).toBe(hexes[hexes.length === 1 ? 0 : i]);
        checked++;
      });
    }
    expect(checked).toBeGreaterThanOrEqual(20);
  });

  it("the notice family is the generated one", () => {
    for (const name of ["--color-notice-bg", "--color-notice-text", "--color-notice-border"]) {
      expect(vars[name]?.toLowerCase()).toBe(table[name]);
    }
  });
});

// ---------------------------------------------------------------------------
// Contrast
// ---------------------------------------------------------------------------

/** The gated pairs of spec 14.1 by token name: text 4.5:1, marks and borders 3:1 (spec 14.5). */
const PAIRS: { fg: string; bg: string; need: number; what: string }[] = [
  ...["--color-bg", "--color-surface", "--color-surface-muted", "--color-accent-soft"].flatMap((bg) => [
    { fg: "--color-text", bg, need: TEXT_CONTRAST, what: "body text" },
    { fg: "--color-text-secondary", bg, need: TEXT_CONTRAST, what: "secondary text" },
  ]),
  ...["--color-bg", "--color-surface", "--color-accent-soft"].map((bg) => ({ fg: "--color-accent-strong", bg, need: TEXT_CONTRAST, what: "InfraVana text" })),
  ...["--color-bg", "--color-surface"].map((bg) => ({ fg: "--color-positive", bg, need: TEXT_CONTRAST, what: "saving figure" })),
  ...["--color-bg", "--color-surface"].map((bg) => ({ fg: "--color-section", bg, need: TEXT_CONTRAST, what: "section label" })),
  { fg: "--color-label-on-comparator", bg: "--color-accent-deep", need: TEXT_CONTRAST, what: "label on the primary button" },
  { fg: "--color-label-on-comparator", bg: "--color-accent-hover", need: TEXT_CONTRAST, what: "label on the hovered button" },
  { fg: "--color-label-on-comparator", bg: "--color-today-1", need: TEXT_CONTRAST, what: "label inside the comparator bar" },
  { fg: "--color-label-on-comparator", bg: "--color-accent", need: TEXT_CONTRAST, what: "label inside the InfraVana bar" },
  { fg: "--color-text", bg: "--color-saved", need: TEXT_CONTRAST, what: "label inside the saved block" },
  { fg: "--color-notice-text", bg: "--color-notice-bg", need: TEXT_CONTRAST, what: "notice text" },
  ...["--color-accent", "--color-saved", "--color-today-1", "--color-today-2", "--color-today-3", "--color-today-4"].flatMap((fg) =>
    ["--color-bg", "--color-surface"].map((bg) => ({ fg, bg, need: MARK_CONTRAST, what: "a chart fill on its ground" })),
  ),
  ...["--color-bg", "--color-surface"].flatMap((bg) => [
    { fg: "--color-accent-strong", bg, need: MARK_CONTRAST, what: "InfraVana frontier line and points" },
    { fg: "--color-text-secondary", bg, need: MARK_CONTRAST, what: "budget line" },
    { fg: "--color-border-strong", bg, need: MARK_CONTRAST, what: "input, chip and axis border" },
    { fg: "--color-section", bg, need: MARK_CONTRAST, what: "section rule" },
  ]),
  { fg: "--color-accent-strong", bg: "--color-accent-soft", need: MARK_CONTRAST, what: "selected-row edge" },
  { fg: "--color-accent-deep", bg: "--color-bg", need: MARK_CONTRAST, what: "chosen tab and primary button" },
  { fg: "--color-text", bg: "--color-bg", need: MARK_CONTRAST, what: "focus ring" },
  { fg: "--color-notice-border", bg: "--color-bg", need: MARK_CONTRAST, what: "notice border on paper" },
  { fg: "--color-notice-border", bg: "--color-notice-bg", need: MARK_CONTRAST, what: "notice border on its fill" },
];

describe("contrast, computed from the real token values (spec 14.5)", () => {
  it.each(PAIRS.map((p) => [`${p.what}: ${p.fg} on ${p.bg}`, p] as const))("%s", (_name, p) => {
    const fg = vars[p.fg];
    const bg = vars[p.bg];
    expect(fg, p.fg).toBeDefined();
    expect(bg, p.bg).toBeDefined();
    expect(contrastRatio(fg as string, bg as string)).toBeGreaterThanOrEqual(p.need);
  });

  it("every gated pair of checks.md (section AZ) whose colours are tokens passes, and its ratio is the one printed", () => {
    const checks = mockFile("docs/design-v0.4/palette/generated/checks.md");
    const az = checks.slice(checks.indexOf("## AZ: Azure"), checks.indexOf("## AG:"));
    const tokenValues = new Set(Object.values(vars).map((v) => v.toLowerCase()));
    let gated = 0;
    for (const row of az.split("\n").filter((l) => /^\| (text|mark) \|/.test(l))) {
      const cells = row.split("|").map((c) => c.trim());
      const [fg, bg] = [cells[3], cells[4]].map((c) => /`(#[0-9a-f]{6})`/i.exec(c ?? "")?.[1]?.toLowerCase() ?? "");
      const printed = Number(cells[5]);
      const need = Number(cells[6]);
      // The notice and wash pairs and the preset ticks are not all tokens: only pairs of two tokens are gated here.
      if (!tokenValues.has(fg) || !tokenValues.has(bg)) continue;
      const ratio = contrastRatio(fg, bg);
      expect(ratio, `${cells[2]}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(need);
      expect(Math.abs(ratio - printed), `${cells[2]} prints ${printed}`).toBeLessThan(0.01);
      gated++;
    }
    expect(gated).toBeGreaterThanOrEqual(40);
  });

  it("the C10 wash is 10% of the accent over the paper, and the frontier text reaches 4.5:1 on it", () => {
    const channel = (hex: string, i: number) => Number.parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16);
    const wash = `#${[0, 1, 2]
      .map((i) => Math.round(channel(vars["--color-bg"] as string, i) * 0.9 + channel(vars["--color-accent"] as string, i) * 0.1).toString(16).padStart(2, "0"))
      .join("")}`;
    expect(contrastRatio(vars["--color-accent-strong"] as string, wash)).toBeGreaterThanOrEqual(TEXT_CONTRAST);
  });

  it("a label on any chart fill is paper where paper reaches 4.5:1, else ink, and always reaches 4.5:1", () => {
    const paper = vars["--color-label-on-comparator"] as string;
    const ink = vars["--color-text"] as string;
    for (const fill of ["--color-accent", "--color-saved", "--color-today-1", "--color-today-2", "--color-today-3", "--color-today-4"]) {
      const colour = labelColourOn(vars[fill] as string, paper, ink);
      expect(contrastRatio(colour, vars[fill] as string), `${fill} label ${colour}`).toBeGreaterThanOrEqual(TEXT_CONTRAST);
      if (contrastRatio(paper, vars[fill] as string) >= TEXT_CONTRAST) expect(colour).toBe(paper);
    }
  });
});

// ---------------------------------------------------------------------------
// Chroma (spec 15.12 acceptance 3)
// ---------------------------------------------------------------------------

/** Absolute OKLCH chroma of a `#rrggbb` colour. */
function oklchChroma(hex: string): number {
  const lin = [0, 2, 4].map((i) => {
    const c = Number.parseInt(hex.slice(1 + i, 3 + i), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const [r, g, b] = lin;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return Math.hypot(a, bb);
}

describe("the absolute chroma rule (spec 15.12 acceptance 3)", () => {
  const fills = ["--color-accent", "--color-saved", "--color-today-1", "--color-today-2", "--color-today-3", "--color-today-4"];
  const chrome = [
    "--color-bg",
    "--color-surface",
    "--color-surface-muted",
    "--color-grid",
    "--color-border",
    "--color-border-strong",
    "--color-text",
    "--color-text-secondary",
    "--color-text-disabled",
    "--color-accent-soft",
    "--color-section",
    "--color-notice-bg",
    "--color-notice-text",
    "--color-notice-border",
  ];
  const chromaOf = (name: string) => oklchChroma(vars[name] as string);

  it("InfraVana is the most vivid chart fill", () => {
    for (const name of fills.filter((n) => n !== "--color-accent")) expect(chromaOf("--color-accent"), name).toBeGreaterThan(chromaOf(name));
  });

  it("every other mark is capped at 0.88 times InfraVana's chroma", () => {
    for (const name of fills.filter((n) => n !== "--color-accent")) expect(chromaOf(name), name).toBeLessThanOrEqual(0.88 * chromaOf("--color-accent") + 1e-4);
  });

  it("every chart fill is more vivid than every chrome token", () => {
    const least = Math.min(...fills.map(chromaOf));
    for (const name of chrome) expect(chromaOf(name), name).toBeLessThan(least);
  });

  it("the figures of the spec: InfraVana 0.142, saved 0.099, chrome 0.007 to 0.09", () => {
    expect(chromaOf("--color-accent")).toBeCloseTo(0.142, 3);
    expect(chromaOf("--color-saved")).toBeCloseTo(0.099, 3);
    expect(chromaOf("--color-bg")).toBeCloseTo(0.007, 3);
  });
});
