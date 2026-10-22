import { textWidth } from "./measure";

/**
 * Breaks `text` at spaces into lines no wider than `maxWidth` pixels, for an
 * axis label that must stay in its column. A single word wider than the
 * column is left whole.
 */
export function wrapText(text: string, maxWidth: number, sizePx: number, weight: number, family: string): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line === "" ? word : `${line} ${word}`;
    if (line !== "" && textWidth(next, sizePx, weight, family) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line !== "") lines.push(line);
  return lines;
}
