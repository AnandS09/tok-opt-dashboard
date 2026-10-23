import fs from "node:fs";
import { tokensFrom } from "../charts/tokens";
import type { Tokens } from "../charts/tokens";

/**
 * Test helper: the design tokens as the stylesheet gives them, read from
 * `src/styles/tokens.css` as text with `var()` aliases resolved, so a test can
 * build chart options or gate the palette from the real token values with no
 * browser. `file` is a path or URL.
 */

const read = (file: string | URL): string => fs.readFileSync(file, "utf8");

/** Every `--name: value;` of the first `:root` block, comments removed, `var()` resolved. */
export function cssVariables(css: string): Record<string, string> {
  const root = /:root\s*\{([\s\S]*?)\n\}/.exec(css.replace(/\/\*[\s\S]*?\*\//g, ""))?.[1] ?? "";
  const raw: Record<string, string> = {};
  for (const m of root.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) raw[m[1] as string] = (m[2] as string).trim();
  const resolve = (value: string, depth = 0): string =>
    depth > 8 ? value : value.replace(/var\((--[\w-]+)\)/g, (_, name: string) => resolve(raw[name] ?? "", depth + 1));
  return Object.fromEntries(Object.entries(raw).map(([name, value]) => [name, resolve(value)]));
}

const TOKENS_CSS = new URL("../styles/tokens.css", import.meta.url);

/** The variables of the real `tokens.css`. */
export function realVariables(): Record<string, string> {
  return cssVariables(read(TOKENS_CSS));
}

/** The chart `Tokens` built from the real `tokens.css`. */
export function realTokens(): Tokens {
  const vars = realVariables();
  return tokensFrom((property) => vars[property] ?? "");
}

/** The text of a file under `mock/`, by path from `mock/`. */
export function mockFile(relative: string): string {
  return read(new URL(`../../${relative}`, import.meta.url));
}

/** The text of a file at the repository root. */
export function repoFile(relative: string): string {
  return read(new URL(`../../../${relative}`, import.meta.url));
}

/** The palette's own generated token block for Azure, `--color-*` entries other than the presets (spec 14.1). */
export function azureTable(): Record<string, string> {
  const css = mockFile("docs/design-v0.4/palette/generated/tokens.css");
  const block = /html\[data-pal="AZ"\]\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (!(m[1] as string).startsWith("--color-preset-")) out[m[1] as string] = (m[2] as string).trim().toLowerCase();
  }
  return out;
}

/** Every file of `dir` (under `mock/`) whose name matches, recursively, as [path from `mock/`, text]. */
export function filesUnder(dir: string, match: RegExp): [string, string][] {
  const out: [string, string][] = [];
  const walk = (relative: string): void => {
    for (const entry of fs.readdirSync(new URL(`../../${relative}`, import.meta.url), { withFileTypes: true })) {
      const next = `${relative}/${entry.name}`;
      if (entry.isDirectory()) walk(next);
      else if (match.test(entry.name)) out.push([next, mockFile(next)]);
    }
  };
  walk(dir);
  return out;
}
