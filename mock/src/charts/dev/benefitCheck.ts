/**
 * Development check for the benefit boxes, not part of the app. `runCheck.ts`
 * calls it with the text of `styles/benefits.css` and with each case's
 * boxes. It covers what a unit test on the box values cannot:
 *
 *   - the markup of `BenefitBoxes`: one `li` per box carrying the printed
 *     number, the label and the comparator, and the chart's caption kept as
 *     the accessible name of the group (a label that resolves to it), or drawn
 *     in full when there are no boxes;
 *   - the stylesheet follows spec 14.3: no shadow, 2px or square corners, only
 *     tokens (no colour literal, no font literal), a ruled row and no fill.
 *
 * `benefitSelfTests` breaks each rule on purpose and requires the check to
 * report it, so a pass is never vacuous.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BenefitBoxes } from "../../components/BenefitBoxes";
import type { BenefitBox } from "../../contract";
import { formatBenefitValue } from "../benefits";

const decode = (s: string): string =>
  s.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** What is wrong with the markup of the boxes of one chart. */
export function benefitMarkupProblems(boxes: BenefitBox[], caption: string, where: string): string[] {
  return markupProblemsOf(renderToStaticMarkup(createElement(BenefitBoxes, { boxes, caption })), boxes, caption, where);
}

function markupProblemsOf(html: string, boxes: BenefitBox[], caption: string, where: string): string[] {
  const problems: string[] = [];
  if (boxes.length === 0) {
    if (!html.includes(decode(caption)) && !html.includes(caption)) problems.push(`${where}: no boxes and the caption is not drawn`);
    if (html.includes("sr-only")) problems.push(`${where}: no boxes, yet the caption is hidden`);
    return problems;
  }
  const items = [...html.matchAll(/<li[^>]*class="benefit-box"[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
  if (items.length !== boxes.length) problems.push(`${where}: ${boxes.length} boxes but ${items.length} list items`);
  boxes.forEach((box, i) => {
    const text = decode(items[i] ?? "");
    for (const part of [formatBenefitValue(box), box.label, box.comparator]) {
      if (!text.includes(part)) problems.push(`${where}: box ${i + 1} does not print "${part}"`);
    }
  });
  const labelled = /role="group"[^>]*aria-labelledby="([^"]+)"|aria-labelledby="([^"]+)"[^>]*role="group"/.exec(html);
  const id = labelled?.[1] ?? labelled?.[2];
  if (!id) problems.push(`${where}: the group has no aria-labelledby`);
  else {
    const named = new RegExp(`<p id="${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*class="[^"]*sr-only[^"]*"[^>]*>([\\s\\S]*?)</p>`).exec(html);
    if (!named) problems.push(`${where}: aria-labelledby points at nothing hidden-but-readable`);
    else if (decode(named[1]) !== caption) problems.push(`${where}: the accessible name is not the caption`);
  }
  return problems;
}

/** What breaks spec 14.3 in the stylesheet of the boxes. */
export function benefitStyleProblems(cssText: string): string[] {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const problems: string[] = [];
  if (!css.includes(".benefit-box")) problems.push("benefits.css: no .benefit-box rule");
  if (/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(css)) problems.push("benefits.css: a colour literal (use a token)");
  for (const m of css.matchAll(/box-shadow\s*:\s*([^;]+);/g)) {
    if (m[1].trim() !== "none") problems.push(`benefits.css: box-shadow ${m[1].trim()}`);
  }
  for (const m of css.matchAll(/border-radius\s*:\s*([^;]+);/g)) {
    if (!/^(0|2px|var\(--radius-(sm|md|lg)\))$/.test(m[1].trim())) problems.push(`benefits.css: border-radius ${m[1].trim()}`);
  }
  for (const m of css.matchAll(/font-family\s*:\s*([^;]+);/g)) {
    if (!/^var\(--font-(display|sans)\)$/.test(m[1].trim())) problems.push(`benefits.css: font-family ${m[1].trim()}`);
  }
  if (/background(-color|-image)?\s*:/.test(css)) problems.push("benefits.css: a fill behind a box (14.3 draws rules, not cards)");
  if (!/border-top:\s*1px solid var\(--color-border\)/.test(css)) problems.push("benefits.css: no 1px rule above the row");
  if (!/font-family:\s*var\(--font-display\)/.test(css)) problems.push("benefits.css: the number is not in the serif");
  return problems;
}

const SAMPLE: BenefitBox[] = [
  { value: 19012, unit: "usd", label: "saved a quarter", comparator: "vs Pay-as-you-go API" },
  { value: 3.7, unit: "usd_per_mtok", label: "saved per million tokens", comparator: "vs Pay-as-you-go API" },
];

/** Each rule broken on purpose; returns the breaks the check did not catch. */
export function benefitSelfTests(cssText: string): string[] {
  const missed: string[] = [];
  const mustFail = (name: string, problems: string[]) => {
    if (problems.length === 0) missed.push(`benefit self-test not caught: ${name}`);
  };
  if (benefitStyleProblems(cssText).length > 0) missed.push("benefit self-test: the real stylesheet already fails");
  if (benefitMarkupProblems(SAMPLE, "Caption.", "sample").length > 0) missed.push("benefit self-test: the sample markup already fails");
  const withRule = (rule: string) => `${cssText}\n${rule}`;
  mustFail("shadow", benefitStyleProblems(withRule(".benefit-box { box-shadow: 0 1px 3px black; }")));
  mustFail("round corners", benefitStyleProblems(withRule(".benefit-box { border-radius: 8px; }")));
  mustFail("hex colour", benefitStyleProblems(withRule(".benefit-box__value { color: #123456; }")));
  mustFail("font literal", benefitStyleProblems(withRule(".benefit-box__value { font-family: Georgia; }")));
  mustFail("card fill", benefitStyleProblems(withRule(".benefit-box { background: var(--color-surface); }")));
  mustFail("no top rule", benefitStyleProblems(cssText.replace(/border-top:\s*1px solid var\(--color-border\)/g, "border-top: 0")));
  // The markup check must see a box that prints the wrong thing, a lost list item and a caption that is not the name.
  const html = renderToStaticMarkup(createElement(BenefitBoxes, { boxes: SAMPLE, caption: "Caption." }));
  mustFail("markup: wrong caption expected", markupProblemsOf(html, SAMPLE, "Another caption.", "x"));
  mustFail("markup: comparator missing", markupProblemsOf(html.replace(/vs Pay-as-you-go API/g, ""), SAMPLE, "Caption.", "x"));
  mustFail("markup: label missing", markupProblemsOf(html.replace("saved a quarter", "x"), SAMPLE, "Caption.", "x"));
  mustFail("markup: a list item lost", markupProblemsOf(html.replace(/<li[\s\S]*?<\/li>/, ""), SAMPLE, "Caption.", "x"));
  mustFail("markup: no aria-labelledby", markupProblemsOf(html.replace(/aria-labelledby="[^"]*"/, ""), SAMPLE, "Caption.", "x"));
  mustFail("markup: caption drawn visibly instead of named", markupProblemsOf(html.replace("sr-only chart-card__caption", "chart-card__caption"), SAMPLE, "Caption.", "x"));
  mustFail("markup: no boxes and no caption", markupProblemsOf("<div></div>", [], "Caption.", "x"));
  return missed;
}
