import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { presetHue } from "./LogSlider";

/**
 * The four preset hues of spec 15.4 (board 04). The board's figures are
 * recomputed here from the four hex values, the page colour and the ink of the
 * Azure palette (spec 14.1), and from the one rule the selected tint follows.
 */

const read = (rel: string) => fs.readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const tokensCss = read("../styles/tokens.css");
const intakeCss = read("../styles/intake.css");
/** The Azure block of the generated palette: the colour source of spec 14.1. */
const azure = /html\[data-pal="AZ"\]\s*\{([^}]*)\}/.exec(read("../../docs/design-v0.4/palette/generated/tokens.css"))![1];
const token = (css: string, name: string): string => new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)![1].toLowerCase();

const HEX = ["#316a23", "#cc675c", "#736dc3", "#883871"];
const rgbOf = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex: string) => {
  const [r, g, b] = rgbOf(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
/** `share` of `top` over `bottom`, in sRGB, as color-mix(in srgb, top share%, bottom) computes it, rounded to a byte. */
function mix(top: string, bottom: string, share: number): string {
  const t = rgbOf(top);
  const b = rgbOf(bottom);
  return "#" + t.map((v, i) => Math.round(v * share + b[i] * (1 - share)).toString(16).padStart(2, "0")).join("");
}

// CIEDE2000 between two sRGB colours (D65), as the palette's colour.py computes it for normal vision.
function lab(hex: string): [number, number, number] {
  const [r, g, b] = rgbOf(hex).map(lin);
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
function deltaE2000(h1: string, h2: string): number {
  const [L1, a1, b1] = lab(h1);
  const [L2, a2, b2] = lab(h2);
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const ap1 = (1 + G) * a1;
  const ap2 = (1 + G) * a2;
  const Cp1 = Math.hypot(ap1, b1);
  const Cp2 = Math.hypot(ap2, b2);
  const hp = (b: number, a: number) => ((Math.atan2(b, a) / rad) + 360) % 360;
  const hp1 = Cp1 === 0 ? 0 : hp(b1, ap1);
  const hp2 = Cp2 === 0 ? 0 : hp(b2, ap2);
  const dLp = L2 - L1;
  const dCp = Cp2 - Cp1;
  let dhp = hp2 - hp1;
  if (Cp1 * Cp2 === 0) dhp = 0;
  else if (dhp > 180) dhp -= 360;
  else if (dhp < -180) dhp += 360;
  const dHp = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dhp / 2) * rad);
  const Lb = (L1 + L2) / 2;
  const Cpb = (Cp1 + Cp2) / 2;
  let hb = hp1 + hp2;
  if (Cp1 * Cp2 === 0) hb = hp1 + hp2;
  else if (Math.abs(hp1 - hp2) <= 180) hb /= 2;
  else hb = (hb + (hb < 360 ? 360 : -360)) / 2;
  const T = 1 - 0.17 * Math.cos((hb - 30) * rad) + 0.24 * Math.cos(2 * hb * rad) + 0.32 * Math.cos((3 * hb + 6) * rad) - 0.2 * Math.cos((4 * hb - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hb - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cpb ** 7 / (Cpb ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2);
  const Sc = 1 + 0.045 * Cpb;
  const Sh = 1 + 0.015 * Cpb * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

describe("R-4: the four preset hues (spec 15.4)", () => {
  it("tokens.css holds the four hues of board 04, in order, as --color-preset-1 to -4", () => {
    expect([1, 2, 3, 4].map((n) => token(tokensCss, `--color-preset-${n}`))).toEqual(HEX);
  });

  it("a preset takes its hue by index, in order, and the order cycles after four", () => {
    expect([0, 1, 2, 3, 4, 5].map(presetHue)).toEqual([
      "var(--color-preset-1)",
      "var(--color-preset-2)",
      "var(--color-preset-3)",
      "var(--color-preset-4)",
      "var(--color-preset-1)",
      "var(--color-preset-2)",
    ]);
  });

  it("tick and edge on the page: 5.95, 3.38, 4.07 and 6.71 to 1 (board 04), from the hex values and the page colour", () => {
    const page = token(azure, "--color-bg");
    expect(HEX.map((h) => contrast(h, page).toFixed(2))).toEqual(["5.95", "3.38", "4.07", "6.71"]);
    // Every mark and edge is at least 3:1, the floor for a graphical mark.
    for (const h of HEX) expect(contrast(h, page)).toBeGreaterThanOrEqual(3);
  });

  it("the selected tint is 16% of the hue over white, and the ink on it gives 13.45, 14.21, 14.06 and 13.22 to 1 (board 04)", () => {
    // The page rule (intake.css) says how the tint is made; the figures follow from it.
    const rule = /\.lv__mark\[aria-pressed="true"\]\s*\{[^}]*background:\s*color-mix\(in srgb,\s*var\(--lv-hue\)\s*(\d+)%,\s*var\(--color-surface-raised\)\)/.exec(intakeCss);
    expect(rule, "the selected-preset rule in intake.css").not.toBeNull();
    const share = Number(rule![1]) / 100;
    const white = token(tokensCss, "--color-surface-raised");
    const ink = token(azure, "--color-text");
    expect(share).toBe(0.16);
    expect(HEX.map((h) => contrast(ink, mix(h, white, share)).toFixed(2))).toEqual(["13.45", "14.21", "14.06", "13.22"]);
    for (const h of HEX) expect(contrast(ink, mix(h, white, share))).toBeGreaterThanOrEqual(4.5);
  });

  it("the presets are at least 23.3 apart (CIEDE2000, normal vision), and the pairs match the board's table", () => {
    const pairs: [number, number, number][] = [
      [0, 1, 54.0],
      [0, 2, 49.4],
      [0, 3, 62.9],
      [1, 2, 34.9],
      [1, 3, 28.9],
      [2, 3, 23.3],
    ];
    for (const [i, j, board] of pairs) expect(deltaE2000(HEX[i], HEX[j]).toFixed(1), `${i} vs ${j}`).toBe(board.toFixed(1));
    expect(Math.min(...pairs.map(([i, j]) => deltaE2000(HEX[i], HEX[j])))).toBeGreaterThanOrEqual(23.3 - 0.05);
  });

  it("no preset is the InfraVana azure or the saved teal, and each is at least 14.6 from every chart fill", () => {
    const fills = ["--color-accent", "--color-saved", "--color-today-1", "--color-today-2", "--color-today-3", "--color-today-4"].map((n) => token(azure, n));
    expect(HEX).not.toContain(token(azure, "--color-accent"));
    expect(HEX).not.toContain(token(azure, "--color-saved"));
    for (const h of HEX) for (const f of fills) expect(deltaE2000(h, f), `${h} vs ${f}`).toBeGreaterThanOrEqual(14.6 - 0.05);
  });
});
