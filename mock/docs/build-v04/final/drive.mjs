/**
 * Measured-render check for the goal tab bar (spec 15.6, R-6) and the
 * comparator in the headline (spec 15.7, R-7). Development tool, not part of
 * the app. It drives the real page in headless Chrome and reads computed
 * styles, bounding boxes and text.
 *
 *   cd mock && npx vite --port 4571 &        (the page to measure)
 *   node docs/build-v04/final/drive.mjs                     checks, then negative controls
 *   node docs/build-v04/final/drive.mjs --shots             also writes the screenshots in this folder
 *
 * Needs `playwright-core` (not a dependency of the project; point PW_TOOLS at a
 * folder that has it) and Google Chrome (CHROME_PATH). BASE_URL names the page.
 *
 * Every check has an id naming the acceptance item it measures. After the
 * clean run it applies each entry of MUTANTS (a style or script that breaks
 * one rule on the live page) and requires the check named for it to fail, so a
 * pass is never vacuous. Exit code 0 only when the clean run passes and every
 * mutant is caught.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(process.env.PW_TOOLS ?? "/tmp/chief-of-staff/d26f8e29-56a6-44f7-9519-76527d652972/themes/tools/");
const { chromium } = require("playwright-core");
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:4571/";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SHOTS = process.argv.includes("--shots");

/** One broken rule per entry: `css` is added to the page, `script` runs in it; `expect` is the check id that must then fail. */
const MUTANTS = [
  { name: "unequal tab widths", width: 1280, css: ".goal-tabs__list{grid-template-columns:2fr 1fr 1fr 1fr}", expect: "15.6(1)" },
  { name: "one tab lower than the others", width: 1280, css: ".goal-tabs__tab:nth-child(3){margin-top:6px}", expect: "15.6(1)" },
  { name: "tabs wrap to two rows on a phone", width: 375, css: ".goal-tabs__list{grid-template-columns:1fr 1fr}", expect: "15.6(1)" },
  { name: "phone tab keeps its figure", width: 375, css: ".goal-tabs__figure{display:block}", expect: "15.6(2)" },
  { name: "desktop tab loses its figure", width: 1280, css: ".goal-tabs__figure{display:none}", expect: "15.6(2)" },
  { name: "chosen tab edge is 1px", width: 1280, css: '.goal-tabs__tab[aria-selected="true"]{border-top-width:1px}', expect: "15.6(3)" },
  { name: "chosen tab is not the panel's colour", width: 1280, css: '.goal-tabs__tab[aria-selected="true"]{background:var(--color-surface-muted)}', expect: "15.6(3)" },
  { name: "chosen tab has a line under it", width: 1280, css: '.goal-tabs__tab[aria-selected="true"]{border-bottom:1px solid var(--color-border-strong)}', expect: "15.6(3)" },
  { name: "an inactive tab is the panel's colour", width: 1280, css: '.goal-tabs__tab[aria-selected="false"]:nth-child(2){background:var(--color-surface)}', expect: "15.6(3)" },
  { name: "panel has a double border", width: 1280, css: ".goal-section .hero{border:3px double var(--color-text)}", expect: "15.6(4)" },
  { name: "panel has no fill", width: 1280, css: ".goal-section .hero{background:transparent}", expect: "15.6(4)" },
  { name: "a tab is aria-disabled", width: 1280, script: () => document.querySelectorAll('[role="tab"]')[2].setAttribute("aria-disabled", "true"), expect: "15.6(5)" },
  { name: "a tab is disabled", width: 1280, script: () => document.querySelectorAll('[role="tab"]')[2].setAttribute("disabled", ""), expect: "15.6(5)" },
  { name: "a tab uses the disabled text colour", width: 1280, css: ".goal-tabs__tab:nth-child(3){color:var(--color-text-disabled)}", expect: "15.6(5)" },
  { name: "chosen tab floats above the panel", width: 1280, css: ".goal-tabs__list{margin-bottom:12px}", expect: "15.6(3)" },
  { name: "comparator underline is 1px", width: 1280, css: ".comparator__control{border-bottom-width:1px}", expect: "15.7(1)" },
  { name: "a second list control in the headline", width: 1280, script: () => document.querySelector("#goal-panel .hero__figure").insertAdjacentHTML("beforeend", '<select aria-label="Compared with"><option>x</option></select>'), expect: "15.7(1)" },
  { name: "a detached Compared with label returns", width: 1280, script: () => document.querySelector("#goal-panel").insertAdjacentHTML("afterend", '<label>Compared with <select><option>x</option></select></label>'), expect: "15.7(2)" },
  { name: "the line under the headline is hidden", width: 768, css: ".hero__compare{display:none}", expect: "15.7(3)" },
  { name: "the line is not the control's description", width: 1280, script: () => document.querySelector("#goal-panel select").removeAttribute("aria-describedby"), expect: "15.7(3)" },
];

const results = [];
let currentMutant = null;
function check(id, ok, detail) {
  results.push({ id, ok, detail, mutant: currentMutant });
  if (!currentMutant) console.log(`${ok ? "PASS" : "FAIL"} ${id} ${detail}`);
}

/** Opens the page at `width`, opens the first example (50 people, $100K a quarter) and waits until every tab has its figure. */
async function open(browser, width, hash = "") {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 200));
  });
  await page.goto(BASE + hash);
  await page.waitForSelector("button.chip");
  await page.click("button.chip >> nth=0");
  await settled(page);
  page.errors = errors;
  return page;
}

/** Waits until the tabs hold no pending figure and the panel is neither dimmed nor waiting. */
async function settled(page) {
  await page.waitForSelector(".goal-tabs__list");
  await page.waitForFunction(
    () =>
      !document.querySelector(".goal-tabs__figure[data-pending], .goal-tabs__figure[data-stale]") &&
      !document.querySelector("#goal-panel[data-pending], #goal-panel[data-stale]") &&
      document.querySelector(".goal-tabs__figure")?.textContent,
    null,
    { timeout: 15000 },
  );
  await page.mouse.move(2, 2);
  await page.waitForTimeout(250);
}

async function mutate(page, mutant) {
  if (mutant.css) await page.addStyleTag({ content: mutant.css });
  if (mutant.script) await page.evaluate(mutant.script);
  await page.waitForTimeout(100);
}

/** Computed colours of tokens, as the page resolves them. */
async function tokens(page) {
  return page.evaluate(() => {
    const read = (name) => {
      const probe = document.createElement("div");
      probe.style.color = `var(${name})`;
      document.body.append(probe);
      const rgb = getComputedStyle(probe).color;
      probe.remove();
      return rgb;
    };
    return {
      surface: read("--color-surface"),
      accentDeep: read("--color-accent-deep"),
      disabled: read("--color-text-disabled"),
    };
  });
}

/** Everything the 15.6 layout items read, in one pass over the page. */
async function readBar(page) {
  return page.evaluate(() => {
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
    };
    const css = (el) => getComputedStyle(el);
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    const list = document.querySelector('[role="tablist"]');
    const panel = document.querySelector("#goal-panel");
    const shown = (el) => !!el && css(el).display !== "none" && el.getBoundingClientRect().width > 0;
    return {
      list: rect(list),
      panel: rect(panel),
      panelStyle: {
        bg: css(panel).backgroundColor,
        widths: ["Top", "Right", "Bottom", "Left"].map((s) => css(panel)[`border${s}Width`]),
        styles: ["Top", "Right", "Bottom", "Left"].map((s) => css(panel)[`border${s}Style`]),
      },
      tabs: tabs.map((tab) => {
        const long = tab.querySelector(".goal-tabs__long");
        const short = tab.querySelector(".goal-tabs__short");
        const figure = tab.querySelector(".goal-tabs__figure");
        const c = css(tab);
        return {
          rect: rect(tab),
          selected: tab.getAttribute("aria-selected") === "true",
          disabled: tab.disabled || tab.hasAttribute("disabled"),
          ariaDisabled: tab.getAttribute("aria-disabled"),
          bg: c.backgroundColor,
          color: c.color,
          childColors: [...tab.querySelectorAll("*")].map((el) => css(el).color),
          top: { width: c.borderTopWidth, color: c.borderTopColor },
          bottomWidth: c.borderBottomWidth,
          longText: shown(long) ? long.textContent : null,
          shortText: shown(short) ? short.textContent : null,
          figureText: shown(figure) ? figure.textContent : null,
          text: tab.innerText,
        };
      }),
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    };
  });
}

const GOALS = [
  { id: "G1", long: "Less money for the same AI", short: "Less money" },
  { id: "G2", long: "More AI for the same money", short: "More AI" },
  { id: "G3", long: "More people for the same money", short: "More people" },
  { id: "G4", long: "Accept a trade-off", short: "Trade-off" },
];

async function barChecks(page, width, tk) {
  const bar = await readBar(page);
  const w = `${width}px`;
  // (1) one top coordinate, equal widths, together filling the bar's width.
  const tops = bar.tabs.map((t) => t.rect.top);
  const widths = bar.tabs.map((t) => t.rect.width);
  const span = bar.tabs[3].rect.right - bar.tabs[0].rect.left;
  check(
    "15.6(1)",
    bar.tabs.length === 4 &&
      Math.max(...tops) - Math.min(...tops) < 0.5 &&
      Math.max(...widths) - Math.min(...widths) < 0.5 &&
      Math.abs(span - bar.list.width) < 1.5,
    `${w}: tops ${tops.map((t) => t.toFixed(1))}, widths ${widths.map((t) => t.toFixed(1))}, span ${span.toFixed(1)} of ${bar.list.width.toFixed(1)}`,
  );
  // (2) label and figure at 1280, short label and no figure at 375.
  const phone = width < 600;
  const shownOk = bar.tabs.every((t, i) =>
    phone
      ? t.shortText === GOALS[i].short && t.longText === null && t.figureText === null && !/\d/.test(t.text)
      : t.longText === GOALS[i].long && t.shortText === null && !!t.figureText && t.figureText.length > 0,
  );
  check("15.6(2)", shownOk, `${w}: ${bar.tabs.map((t) => JSON.stringify(t.text.replace(/\s+/g, " "))).join(" | ")}`);
  // (3) the chosen tab: 3px deep-accent top edge, the panel's colour, no bottom border; the others differ and the tab touches the panel.
  const chosen = bar.tabs.filter((t) => t.selected);
  const others = bar.tabs.filter((t) => !t.selected);
  const c = chosen[0];
  check(
    "15.6(3)",
    chosen.length === 1 &&
      c.top.width === "3px" &&
      c.top.color === tk.accentDeep &&
      c.bg === bar.panelStyle.bg &&
      c.bottomWidth === "0px" &&
      others.every((t) => t.bg !== bar.panelStyle.bg) &&
      Math.abs(c.rect.bottom - (bar.panel.top + 1)) < 0.6,
    `${w}: top ${c.top.width} ${c.top.color} (deep accent ${tk.accentDeep}), bg ${c.bg} vs panel ${bar.panelStyle.bg}, bottom border ${c.bottomWidth}, tab bottom ${c.rect.bottom.toFixed(1)} vs panel top ${bar.panel.top.toFixed(1)}, others differ ${others.every((t) => t.bg !== bar.panelStyle.bg)}`,
  );
  // (4) the hero panel: 1px border, the surface background, no double border.
  check(
    "15.6(4)",
    bar.panelStyle.widths.every((x) => x === "1px") &&
      bar.panelStyle.styles.every((s) => s === "solid") &&
      bar.panelStyle.bg === tk.surface,
    `${w}: panel borders ${bar.panelStyle.widths} ${bar.panelStyle.styles}, bg ${bar.panelStyle.bg} (surface ${tk.surface})`,
  );
  // (5) every tab enabled, none in the disabled text colour.
  check(
    "15.6(5)",
    bar.tabs.every((t) => !t.disabled && t.ariaDisabled !== "true" && t.color !== tk.disabled && !t.childColors.includes(tk.disabled)),
    `${w}: disabled ${bar.tabs.map((t) => t.disabled || t.ariaDisabled)}`,
  );
  check("page does not scroll sideways", bar.scrollWidth <= bar.innerWidth, `${w}: scrollWidth ${bar.scrollWidth}, viewport ${bar.innerWidth}`);
}

async function headlineChecks(page, width) {
  const w = `${width}px`;
  const read = await page.evaluate(() => {
    const panel = document.querySelector("#goal-panel");
    const selects = [...panel.querySelectorAll("select")];
    const select = selects[0];
    const line = panel.querySelector(".hero__compare");
    const shown = (el) => !!el && getComputedStyle(el).display !== "none" && el.getBoundingClientRect().height > 0;
    const named = [...document.querySelectorAll('[aria-label="Compared with"], label')].filter(
      (el) => el.getAttribute("aria-label") === "Compared with" || /compared with/i.test(el.textContent ?? ""),
    );
    const strong = line?.firstElementChild;
    return {
      selectCount: selects.length,
      selected: select?.selectedOptions[0]?.textContent,
      border: select ? getComputedStyle(select).borderBottomWidth : null,
      namedCount: named.length,
      oldClass: !!document.querySelector(".compare-select"),
      lineShown: shown(line),
      lineStrong: strong?.tagName === "STRONG" ? strong.textContent : null,
      lineStartsWith: line?.textContent.startsWith(strong?.textContent ?? "\u0000"),
      lineId: line?.id,
      describedBy: select?.getAttribute("aria-describedby"),
      selectInHeadline: !!select && !!select.closest(".hero__lead, .hero__figure"),
    };
  });
  check(
    "15.7(1)",
    read.selectCount === 1 && read.selectInHeadline && !!read.selected && read.selected === read.lineStrong && read.border === "3px",
    `${w}: ${read.selectCount} list control(s) in the headline, selected "${read.selected}", bottom border ${read.border}`,
  );
  check("15.7(2)", read.namedCount === 1 && !read.oldClass, `${w}: ${read.namedCount} control(s) named Compared with, old detached select present: ${read.oldClass}`);
  check(
    "15.7(3)",
    read.lineShown && !!read.lineStrong && read.lineStrong === read.selected && read.lineStartsWith && !!read.lineId && read.lineId === read.describedBy,
    `${w}: line shown ${read.lineShown}, bold "${read.lineStrong}", described-by ${read.describedBy} (line id ${read.lineId})`,
  );
}

/** Chooses a goal tab and waits for the panel to settle. */
async function chooseGoal(page, goal) {
  await page.click(`#goal-tab-${goal}`);
  await settled(page);
}

async function heroText(page) {
  return page.evaluate(() => document.querySelector("#goal-panel").innerText.replace(/\s+/g, " "));
}

async function run(browser) {
  // Layout and headline items at the test widths, on the first example.
  for (const width of [1280, 375]) {
    const page = await open(browser, width);
    const tk = await tokens(page);
    for (const goal of GOALS) {
      await chooseGoal(page, goal.id);
      if (goal.id === "G1" || goal.id === "G4") {
        await barChecks(page, width, tk);
        await headlineChecks(page, width);
      }
    }
    check("no console errors", page.errors.length === 0, `${width}px: ${page.errors.slice(0, 2)}`);
    await page.close();
  }
  {
    const page = await open(browser, 768);
    await headlineChecks(page, 768);
    await page.close();
  }

  // 15.6 (7): each tab's figure equals the headline figure of its goal once every solve has finished.
  {
    const page = await open(browser, 1280);
    const figures = () => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[role="tab"]')].map((t) => [t.id.slice(-2), t.querySelector(".goal-tabs__figure").textContent])));
    const before = await figures();
    for (const id of ["G1", "G2", "G3"]) {
      await chooseGoal(page, id);
      const hero = await heroText(page);
      check("15.6(7)", hero.includes(before[id]), `${id}: tab "${before[id]}", hero "${hero.slice(0, 110)}"`);
    }
    await chooseGoal(page, "G4");
    for (let i = 0; i < 2; i++) {
      await page.locator("fieldset.steps").nth(i).locator("input[type=radio]").last().click({ force: true });
      await page.waitForTimeout(500);
    }
    await settled(page);
    const g4 = await page.evaluate(() => document.querySelector("#goal-panel .hero__extra strong")?.textContent ?? "");
    const stated = /^(.*) more$/.exec(g4)?.[1];
    check("15.6(7)", stated !== undefined && before.G4 === `Up to ${stated} more saved`, `G4: tab "${before.G4}", hero extra "${g4}" at the largest give-up`);
    const after = await figures();
    check("15.6(7)", JSON.stringify(after) === JSON.stringify(before), `figures unchanged by choosing tabs and steps: ${JSON.stringify(after)}`);
    await page.close();
  }

  // 15.6 (6): AI-first startup (no team work), choosing G3 selects it, puts goal=G3 in the address and labels the placeholder.
  {
    const page = await open(browser, 1280);
    await page.selectOption(".answers select.answer__value >> nth=0", "ai_first");
    await settled(page);
    await page.click("#goal-tab-G3");
    await page.waitForTimeout(400);
    const read = await page.evaluate(() => {
      const tab = document.querySelector("#goal-tab-G3");
      const flag = (el) => (el ? getComputedStyle(el).display !== "none" && el.getBoundingClientRect().width > 0 : false);
      return {
        selected: tab.getAttribute("aria-selected"),
        hash: location.hash,
        tabFlag: flag(tab.querySelector(".goal-tabs__flag")) ? tab.querySelector(".goal-tabs__flag").textContent : null,
        heroFlag: flag(document.querySelector("#goal-panel .hero__flag")) ? document.querySelector("#goal-panel .hero__flag").textContent : null,
        disabled: tab.disabled,
        heroNote: document.querySelector("#goal-panel .hero__note")?.textContent,
      };
    });
    check(
      "15.6(6)",
      read.selected === "true" && /(^|[#&])goal=G3(&|$)/.test(read.hash) && read.tabFlag === "Placeholder" && read.heroFlag === "Placeholder" && !read.disabled,
      `AI-first: G3 selected ${read.selected}, address ${read.hash}, tab label ${read.tabFlag}, hero label ${read.heroFlag}`,
    );
    check("15.6(6) note", /Placeholder figures: your answers include no team work/.test(read.heroNote ?? ""), `hero note: ${read.heroNote}`);
    await page.close();
  }

  // 15.7 (4): the headline control carries 6.1 acceptance (3), (4) and (7).
  {
    const page = await open(browser, 1280);
    const VENDOR = "vendor2_direct";
    const label = "Placeholder vendor 2, end to end, direct";
    await page.selectOption("#goal-panel select", VENDOR);
    await settled(page);
    const named = async () => {
      const hero = await heroText(page);
      const boxes = await page.evaluate(() => [...document.querySelectorAll(".benefit-boxes__comparator, .benefit-box__comparator, [class*=benefit] [class*=comparator]")].map((el) => el.textContent));
      return { hero, boxes };
    };
    let n = await named();
    check("15.7(4) hero", n.hero.includes(label) && (await page.evaluate(() => location.hash)).includes(`cmp=${VENDOR}`), `after the pick: hero names it, address ${await page.evaluate(() => location.hash)}`);
    check("15.7(4) boxes", n.boxes.length > 0 && n.boxes.every((t) => t.includes(label)), `boxes: ${JSON.stringify(n.boxes)}`);
    const figures = await page.evaluate(() => document.body.textContent);
    // The to-the-cent figures (60,007.50 and 43,948.24) are asserted from compute() in src/store/goal.test.ts; here the page shows them rounded.
    check("15.7(4) figures", figures.includes("Placeholder vendor 2, end to end, direct") && figures.includes("$60,008"), "the first example's chart table shows $60,008 for vendor 2 direct");
    for (const id of ["G2", "G3", "G4", "G1"]) {
      await chooseGoal(page, id);
      const value = await page.evaluate(() => document.querySelector("#goal-panel select").value);
      check("15.7(4) tab", value === VENDOR, `after choosing ${id} the headline control still shows ${value}`);
    }
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(600);
    check("15.7(4) chart", (await page.evaluate(() => document.querySelector("#goal-panel select").value)) === VENDOR, "after switching chart the control still shows vendor 2 direct");
    const hash = await page.evaluate(() => location.hash);
    await page.close();
    const again = await open(browser, 1280, hash);
    check("15.7(4) reload", (await again.evaluate(() => document.querySelector("#goal-panel select").value)) === VENDOR, `after reloading ${hash} the control shows vendor 2 direct`);
    await again.close();
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  await run(browser);
  const clean = results.filter((r) => !r.mutant);
  const failed = clean.filter((r) => !r.ok);
  console.log(`clean run: ${clean.length - failed.length} of ${clean.length} checks pass`);

  // Negative controls: each breaks one rule on the live page and must fail the check named for it.
  let caught = 0;
  for (const mutant of MUTANTS) {
    currentMutant = mutant.name;
    const page = await open(browser, mutant.width);
    const tk = await tokens(page);
    await mutate(page, mutant);
    const before = results.length;
    if (mutant.expect.startsWith("15.6")) await barChecks(page, mutant.width, tk);
    else await headlineChecks(page, mutant.width);
    const failedIds = results.slice(before).filter((r) => !r.ok).map((r) => r.id);
    const ok = failedIds.includes(mutant.expect);
    if (ok) caught += 1;
    console.log(`${ok ? "CAUGHT" : "MISSED"} ${mutant.name} (${mutant.expect}; failed: ${failedIds.join(", ") || "none"})`);
    await page.close();
  }
  currentMutant = null;

  if (SHOTS) await shots(browser);
  await browser.close();
  console.log(`negative controls: ${caught} of ${MUTANTS.length} caught`);
  const good = failed.length === 0 && caught === MUTANTS.length;
  console.log(good ? "ALL OK" : "FAILED");
  process.exit(good ? 0 : 1);
}

/** The screenshots the report compares with boards 06 and 07: each tab chosen with a long headline, and the headline, at 1280 and 390. */
async function shots(browser) {
  const LONG = "vendor2_bedrock";
  for (const [name, width] of [["1280", 1280], ["390", 390]]) {
    const page = await open(browser, width);
    await page.selectOption("#goal-panel select", LONG);
    await settled(page);
    for (const goal of GOALS) {
      await chooseGoal(page, goal.id);
      await page.locator(".goal-section").screenshot({ path: path.join(here, `tabs-${goal.id}-long-${name}.png`) });
    }
    await chooseGoal(page, "G1");
    await page.selectOption("#goal-panel select", "api");
    await settled(page);
    await page.locator(".goal-section").screenshot({ path: path.join(here, `headline-${name}.png`) });
    await page.close();

    const placeholder = await open(browser, width);
    await placeholder.selectOption(".answers select.answer__value >> nth=0", "ai_first");
    await settled(placeholder);
    await chooseGoal(placeholder, "G3");
    await placeholder.locator(".goal-section").screenshot({ path: path.join(here, `tabs-G3-placeholder-${name}.png`) });
    await placeholder.close();
  }
}

await main();
