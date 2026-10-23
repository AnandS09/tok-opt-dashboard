// Measured-render check of the stage (spec 15.8 contents column, 15.9 no ordinal
// numbers, 15.13 balanced chart grid, and 4.1 reachability). From mock/:
//
//   node scripts/check-stage-render.mjs
//
// It builds the app and a grid-only harness page (src/charts/dev/stage/) into a
// temporary folder, serves them on localhost, drives headless Chrome over the
// DevTools protocol and reads the rendered page's computed styles, bounding
// boxes, text and accessible names. Exit code 0 only when every check passes.
// The browser and the two servers are stopped before it exits.
//
// Needs Google Chrome (set CHROME to its binary if it is not at the macOS path).
// To show a check can fail, change the source (for example the column's width in
// styles/stage.css, or the rule in store/gridLayout.ts) and run it again.
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import react from "@vitejs/plugin-react";
import { launch, newPage, sleep } from "./lib/cdp.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stage-check-"));
const CDP_PORT = Number(process.env.CDP_PORT ?? 9555);

// ---------------------------------------------------------------------------
// Build and serve
// ---------------------------------------------------------------------------

async function buildInto(outDir, input) {
  await build({
    root,
    configFile: false,
    base: "./",
    logLevel: "error",
    plugins: [react()],
    build: { outDir, emptyOutDir: true, rollupOptions: input ? { input } : undefined },
  });
}

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".csv": "text/csv",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function serve(dir) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    let file = path.join(dir, decodeURIComponent(url.pathname));
    if (url.pathname.endsWith("/")) file = path.join(file, "index.html");
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404).end("not found");
        return;
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" }).end(data);
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })));
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

const failures = [];
let passed = 0;
function check(name, ok, detail = "") {
  if (ok) passed += 1;
  else failures.push(`${name}${detail ? `  [${detail}]` : ""}`);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? `  [${detail}]` : ""}`);
}

// ---------------------------------------------------------------------------
// What the spec fixes
// ---------------------------------------------------------------------------

/** Registry title of each built chart, by id (the titles of board 08). */
const BUILT = {
  C1: "Where the money goes",
  C5: "How much AI work the budget buys",
  C3: "Price per million tokens, by model size",
  C10: "What you can buy if you accept less",
};
const TITLES = [
  ...Object.values(BUILT),
  "Efficiency frontier",
  "Quality against cost",
  "Where each kind of work runs",
  "How far the budget goes",
  "Response time by hardware tier",
  "Before and after growth",
];
/** The three test widths of spec 15 and the page's content width at each (`--page-max-width` 1040, 16px gutters). */
const WIDTHS = [
  { viewport: 1280, content: 1040, phone: false },
  { viewport: 768, content: 736, phone: false },
  { viewport: 375, content: 343, phone: true },
];

/** Independent statement of the balanced-grid rule (spec 15.13), by exhaustive search. */
function referenceGrid(count, width, phone) {
  const spec = phone ? { cell: 160, min: 2, max: 2 } : { cell: 240, min: 2, max: 4 };
  const widest = Math.min(spec.max, Math.max(spec.min, Math.floor(width / spec.cell)));
  const options = [];
  for (let columns = spec.min; columns <= widest; columns++) {
    for (let wide = 0; wide <= count; wide++) {
      let used = 0;
      let ok = true;
      for (let i = 0; i < count && ok; i++) {
        const span = i < wide ? 2 : 1;
        if (used + span > columns) ok = false;
        else used = (used + span) % columns;
      }
      if (ok && used === 0) options.push({ columns, wide, rows: (count + wide) / columns });
    }
  }
  const rows = Math.min(...options.map((o) => o.rows));
  const fewest = options.filter((o) => o.rows === rows);
  const wide = Math.min(...fewest.map((o) => o.wide));
  return fewest.filter((o) => o.wide === wide);
}

// ---------------------------------------------------------------------------
// In-page helpers (strings evaluated in the page)
// ---------------------------------------------------------------------------

const PAGE = {
  title: "document.querySelector('.stage__title')?.textContent ?? null",
  live: "document.querySelector('.stage [aria-live=polite]')?.textContent ?? null",
  hash: "location.hash",
  // Everything a visitor can read or hear: rendered text, generated content, accessible names.
  readable: `(() => {
    const out = [document.body.innerText];
    for (const el of document.querySelectorAll('*')) {
      for (const pseudo of ['::before', '::after']) {
        const c = getComputedStyle(el, pseudo).content;
        if (c && c !== 'none' && c !== 'normal') out.push(c.replace(/^"|"$/g, ''));
      }
      for (const attr of ['aria-label', 'title', 'alt']) if (el.getAttribute(attr)) out.push(el.getAttribute(attr));
      if (el.classList.contains('sr-only')) out.push(el.textContent);
    }
    return out.join('\\n');
  })()`,
  noSideScroll: "document.documentElement.scrollWidth <= document.documentElement.clientWidth && document.body.scrollWidth <= document.documentElement.clientWidth",
};

async function openApp(page, base, w, hash = "#slide=C3") {
  await page.viewport(w.viewport, 900, w.phone);
  // A fresh load every time: a navigation that changes only the hash would keep the last run's state.
  await page.goto("about:blank", 100);
  await page.goto(`${base}/index.html${hash}`, 1000);
  await page.waitFor("[...document.querySelectorAll('button.chip')].some(b => b.textContent.includes('50 people'))");
  await page.eval("[...document.querySelectorAll('button.chip')].find(b => b.textContent.includes('50 people')).click()");
  const ready = await page.waitFor("document.querySelector('.stage__title') !== null");
  await sleep(500);
  return ready;
}

const click = async (page, sel) => {
  await page.eval(`document.querySelector(${JSON.stringify(sel)}).click()`);
  await sleep(300);
};

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/** Spec 15.8, desktop. */
async function contentsColumn(page, base) {
  const w = WIDTHS[0];
  check("15.8 setup: the page opens at 1280", await openApp(page, base, w));

  const nav = "document.querySelector('.chart-index')";
  const width = await page.eval(`${nav}.getBoundingClientRect().width`);
  const track = await page.eval("getComputedStyle(document.querySelector('.stage__layout')).gridTemplateColumns.split(' ')[0]");
  check("15.8 (1) the column computes to 16rem (256px) at 1280", Math.abs(width - 256) < 0.6 && track === "256px", `nav ${width}px, track ${track}`);

  // Scroll by the stage's height, then to the middle and the end of the stage: the column stays in view.
  const stageH = await page.eval("document.querySelector('.stage').getBoundingClientRect().height");
  await page.eval(`window.scrollTo(0, ${stageH})`);
  await sleep(200);
  const afterHeight = await page.eval(`(() => { const r = ${nav}.getBoundingClientRect(); return [r.top, r.bottom, innerHeight]; })()`);
  check("15.8 (1) after scrolling by the stage's height the column is still in the viewport", afterHeight[1] > 0 && afterHeight[0] < afterHeight[2], JSON.stringify(afterHeight));
  // Half of the slack between the stage and the column (at most 200px): the column can only be held while the stage is taller than it is.
  await page.eval(`(() => {
    const slack = document.querySelector('.stage').getBoundingClientRect().height - ${nav}.getBoundingClientRect().height;
    window.scrollTo(0, document.querySelector('.stage').getBoundingClientRect().top + scrollY + Math.max(1, Math.min(200, slack / 2)));
  })()`);
  await sleep(200);
  const mid = await page.eval(`(() => { const r = ${nav}.getBoundingClientRect(); return [r.top, r.bottom, innerHeight]; })()`);
  check("15.8 (1) part-way down the stage the column is in view, held at the top", mid[0] >= 0 && mid[0] < 40 && mid[1] <= mid[2], JSON.stringify(mid));
  await page.eval("window.scrollTo(0, 0)");

  const heading = await page.eval("document.querySelector('.chart-index__heading')?.innerText.replace(/\\s+/g, ' ').trim()");
  check("15.8 (2) the heading shows Charts and the count", /^charts\s*10$/i.test(heading ?? ""), String(heading));
  const items = await page.eval(`[...document.querySelectorAll('.chart-index__item')].map((b) => ({
    title: b.querySelector('.chart-index__title')?.textContent,
    glyph: !!b.querySelector('svg.chart-glyph'),
    name: (b.getAttribute('aria-label') ?? b.textContent),
    current: b.getAttribute('aria-current'),
    bg: getComputedStyle(b).backgroundColor,
    bl: getComputedStyle(b).borderLeftWidth,
  }))`);
  check("15.8 (2) one item per listed chart, ten", items.length === 10, String(items.length));
  check("15.8 (2) each item has a glyph and a title", items.every((i) => i.glyph && i.title), "");
  check("15.8 (2) no item has a digit", items.every((i) => !/\d/.test(i.name)), JSON.stringify(items.filter((i) => /\d/.test(i.name)).map((i) => i.name)));
  check("15.9 (3) each item's title is its registry title, in order", JSON.stringify(items.map((i) => i.title)) === JSON.stringify(TITLES), JSON.stringify(items.map((i) => i.title)));

  const soft = await page.eval(`(() => { const d = document.createElement('div'); d.style.background = 'var(--color-accent-soft)'; document.body.append(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; })()`);
  const current = items.filter((i) => i.current === "true");
  check("15.8 (3) exactly one item has aria-current", current.length === 1);
  check("15.8 (3) the item in focus has the --color-accent-soft background and a 3px left border", current.length === 1 && current[0].bg === soft && current[0].bl === "3px", JSON.stringify(current[0]));
  const others = items.filter((i) => i.current !== "true");
  check("15.8 (3) no other item has the fill or a 3px edge", others.every((i) => i.bg !== soft && i.bl !== "3px"), JSON.stringify(others.find((i) => i.bg === soft || i.bl === "3px")));

  // (4) every built chart by pointer, then by keyboard alone.
  for (const [id, title] of Object.entries(BUILT)) {
    await click(page, `.chart-index__item[data-chart="${id}"]`);
    check(`15.8 (4) pointer: the column opens ${id}`, (await page.eval(PAGE.title)) === title && (await page.eval(PAGE.hash)).includes(`slide=${id}`), String(await page.eval(PAGE.title)));
  }
  const ids = Object.keys(BUILT);
  for (let j = 0; j < ids.length; j++) {
    await page.eval("document.querySelector('.chart-index__item').focus()");
    for (let k = 0; k < j; k++) await page.key("Tab");
    await page.key("Enter");
    await sleep(400);
    check(`15.8 (4) keyboard: Tab ${j} times then Enter opens ${ids[j]}`, (await page.eval(PAGE.title)) === BUILT[ids[j]], String(await page.eval(PAGE.title)));
  }
  // A chart not built yet is listed but does nothing and is announced as unavailable.
  const before = await page.eval(PAGE.title);
  await click(page, '.chart-index__item[data-chart="C2"]');
  check("15.8 a planned chart in the list is inert and announced", (await page.eval(PAGE.title)) === before && (await page.eval("document.querySelector('.chart-index__item[data-chart=\"C2\"]').getAttribute('aria-disabled')")) === "true");

  // (5) grid view hides the column.
  await click(page, ".stage__grid-button");
  check("15.8 (5) with the grid view open the column is not displayed", (await page.eval("document.querySelector('.chart-index') === null || document.querySelector('.chart-index').offsetParent === null")) === true);
  const full = await page.eval("[document.querySelector('.grid-view').getBoundingClientRect().width, document.querySelector('.stage').getBoundingClientRect().width]");
  check("15.8 (5) the grid has the stage's full width", Math.abs(full[0] - full[1]) < 1, JSON.stringify(full));
  await click(page, ".stage__grid-button");
  check("15.8 closing the grid brings the column back", (await page.eval("document.querySelector('.chart-index') !== null")) === true);

  // Arrows, keys and the hash still reach and restore every chart.
  await click(page, ".chart-index__item[data-chart=\"C1\"]");
  const seen = [await page.eval(PAGE.live)];
  for (const id of ["C5", "C3", "C10", "C1"]) {
    await click(page, "[aria-label='Next chart']");
    check(`4.1 (2) the next arrow reaches ${id}`, (await page.eval(PAGE.title)) === BUILT[id]);
    seen.push(await page.eval(PAGE.live));
  }
  await page.eval("document.activeElement.blur()");
  await page.key("ArrowLeft");
  await sleep(400);
  check("4.1 (2) the left key steps back (and wraps)", (await page.eval(PAGE.title)) === BUILT.C10);
  seen.push(await page.eval(PAGE.live));
  await page.key("ArrowRight");
  await sleep(400);
  seen.push(await page.eval(PAGE.live));
  check("15.9 (4) the live region holds the new chart's title alone, and changes with every chart", seen.every((s, i) => i === 0 || s !== seen[i - 1]) && seen.every((s) => TITLES.includes(s)), JSON.stringify(seen));
  await page.eval("location.hash = '#slide=C5&goal=G2'");
  await sleep(900);
  check("4.1 (3) the hash restores the chart and the tab", (await page.eval(PAGE.title)) === BUILT.C5 && (await page.eval(PAGE.hash)).includes("goal=G2"), String(await page.eval(PAGE.hash)));
}

/** Spec 15.8 on a phone, and swipe. */
async function phonePicker(page, base) {
  const w = WIDTHS[2];
  check("15.8 setup: the page opens at 375", await openApp(page, base, w));
  const rects = await page.eval(`(() => {
    const t = document.querySelector('.chart-index__toggle').getBoundingClientRect();
    const g = document.querySelector('.stage__grid-button').getBoundingClientRect();
    return { toggle: [t.top, t.bottom, t.left, t.right], grid: [g.top, g.bottom, g.left, g.right], buttons: document.querySelectorAll('.chart-index__toggle').length };
  })()`);
  check("15.8 (6) a single picker button and a Grid view button share one row", rects.buttons === 1 && Math.abs(rects.toggle[0] - rects.grid[0]) < 2 && Math.abs(rects.toggle[1] - rects.grid[1]) < 2 && rects.toggle[3] <= rects.grid[2], JSON.stringify(rects));
  const shows = await page.eval("document.querySelector('.chart-index__toggle').textContent.trim()");
  check("15.8 (6) the picker shows the focused chart's title and a glyph, with no digit", shows === BUILT.C3 && !/\d/.test(shows) && (await page.eval("!!document.querySelector('.chart-index__toggle svg.chart-glyph')")), shows);
  await click(page, ".chart-index__toggle");
  const open = await page.eval(`[...document.querySelectorAll('.chart-index__list--menu .chart-index__item')].map(b => [b.querySelector('.chart-index__title').textContent, b.offsetParent !== null, b.getBoundingClientRect().right <= innerWidth])`);
  check("15.8 (6) opening the picker lists every chart, visible and inside the screen", open.length === 10 && open.every((o) => o[1] && o[2]) && JSON.stringify(open.map((o) => o[0])) === JSON.stringify(TITLES), JSON.stringify(open.filter((o) => !o[1] || !o[2])));
  check("15.8 (7) no sideways scroll with the picker open", await page.eval(PAGE.noSideScroll));
  await page.eval("document.querySelector('.chart-index__list--menu .chart-index__item[data-chart=\"C10\"]').click()");
  await sleep(400);
  check("15.8 (4) the picker opens a chart", (await page.eval(PAGE.title)) === BUILT.C10);
  check("15.8 (6) choosing closes the list", (await page.eval("document.querySelector('.chart-index__list--menu').hidden")) === true);
  // Swipe on the figure.
  const box = await page.eval("(() => { const r = document.querySelector('.stage__panel').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()");
  await page.eval(`window.scrollTo(0, ${box[1] - 20 + (await page.eval("scrollY"))})`);
  await sleep(200);
  const y = 120;
  await page.swipe(330, y, 40);
  await sleep(500);
  check("4.1 (2) a swipe left reaches the next chart (wrapping)", (await page.eval(PAGE.title)) === BUILT.C1, String(await page.eval(PAGE.title)));
}

/** Spec 15.9: no ordinal in any tab, chart or width. */
async function noOrdinals(page, base) {
  const goals = ["G1", "G2", "G3", "G4"];
  for (const w of WIDTHS) {
    await openApp(page, base, w);
    const problems = [];
    let reads = 0;
    for (const goal of goals) {
      for (const id of Object.keys(BUILT)) {
        await page.eval(`location.hash = '#slide=${id}&goal=${goal}'`);
        await sleep(goal === "G1" ? 450 : 800);
        const text = await page.eval(PAGE.readable);
        reads += 1;
        if (/figure\s*\d/i.test(text)) problems.push(`${goal}/${id}: ${text.match(/.{0,20}figure\s*\d.{0,20}/i)?.[0]}`);
        if (/\bC(10|[1-9])\b/.test(text)) problems.push(`${goal}/${id}: registry id ${text.match(/.{0,20}\bC(10|[1-9])\b.{0,20}/)?.[0]}`);
        if ((await page.eval(PAGE.title)) !== BUILT[id]) problems.push(`${goal}/${id}: heading ${await page.eval(PAGE.title)}`);
      }
    }
    check(`15.9 (1)(5) ${w.viewport}px: no 'Figure n', no registry id in any of ${reads} tab and chart views`, problems.length === 0, problems.slice(0, 3).join(" | "));
    // Grid view and the picker or column: no digit in a name, no "n / N".
    await page.eval("location.hash = '#slide=C1&goal=G1'");
    await sleep(500);
    await click(page, ".stage__grid-button");
    const tiles = await page.eval(`[...document.querySelectorAll('.grid-view__cell')].map((li) => {
      const t = li.querySelector('.grid-view__title').textContent;
      const b = li.querySelector('button.grid-view__item');
      return { title: t, name: b ? b.textContent : li.querySelector('.grid-view__item').textContent, label: b?.getAttribute('aria-label') ?? '' };
    })`);
    check(`15.9 (2)(3) ${w.viewport}px: ten grid tiles, each titled with its registry title and no digit in its name`, tiles.length === 10 && JSON.stringify(tiles.map((t) => t.title)) === JSON.stringify(TITLES) && tiles.every((t) => !/\d/.test(t.name + t.label)), JSON.stringify(tiles.filter((t) => /\d/.test(t.name)).map((t) => t.name)));
    const gridText = await page.eval(PAGE.readable);
    check(`15.9 (1) ${w.viewport}px: no 'Figure n' with the grid view open`, !/figure\s*\d/i.test(gridText));
    check(`15.8 (7) ${w.viewport}px: the page does not scroll sideways, grid view open`, await page.eval(PAGE.noSideScroll));
    await click(page, ".stage__grid-button");
    check(`15.8 (7) ${w.viewport}px: the page does not scroll sideways, chart in focus`, await page.eval(PAGE.noSideScroll));
    const position = await page.eval("document.querySelector('.chart-index__toggle, .chart-index__heading')?.innerText ?? ''");
    check(`15.9 (2) ${w.viewport}px: the column heading or picker shows no 'n / N'`, !/\d+\s*\/\s*\d+/.test(position), position);
    const others = await page.eval("document.querySelectorAll('.chart-index__item').length");
    check(`15.8 ${w.viewport}px: ${w.phone ? "the list is inside the picker" : "the column lists ten charts"}`, others === 10);
  }
}

/** The grid rows of whatever `.grid-view` the page shows. */
const MEASURE_GRID = `(() => {
  const ul = document.querySelector('.grid-view');
  const u = ul.getBoundingClientRect();
  const cells = [...ul.querySelectorAll(':scope > li')].map((li) => {
    const r = li.getBoundingClientRect();
    const th = li.querySelector('.grid-view__thumb')?.getBoundingClientRect();
    return { top: Math.round(r.top), left: r.left, right: r.right, width: r.width, thumbW: th?.width ?? 0, thumbH: th?.height ?? 0,
             takeaway: li.querySelector('.grid-view__takeaway')?.textContent.trim() ?? null };
  });
  return { left: u.left, right: u.right, width: u.width, tracks: getComputedStyle(ul).gridTemplateColumns.split(' ').length, cells };
})()`;

function judgeGrid(label, m, count, phone) {
  const rows = new Map();
  for (const c of m.cells) rows.set(c.top, [...(rows.get(c.top) ?? []), c]);
  const full = [...rows.values()].every((row) => {
    const l = Math.min(...row.map((c) => c.left));
    const r = Math.max(...row.map((c) => c.right));
    return Math.abs(l - m.left) < 1.5 && Math.abs(r - m.right) < 1.5;
  });
  check(`15.13 (1) ${label}: every row of ${rows.size} spans the full grid width`, m.cells.length === count && full, JSON.stringify([...rows.values()].map((r) => r.length)));
  const ref = referenceGrid(count, m.width, phone);
  check(`15.13 (2) ${label}: ${m.tracks} columns, the rule gives ${ref[0].columns}`, ref.some((o) => o.columns === m.tracks), JSON.stringify(ref));
  const normal = (m.width - (m.tracks - 1) * (m.cells.length > 1 ? gapOf(m) : 0)) / m.tracks;
  const wide = m.cells.map((c) => c.width > normal * 1.5);
  const k = wide.filter(Boolean).length;
  check(`15.13 (3) ${label}: ${k} wide tiles, the first ${k} in order, as few as the rule allows (${ref[0].wide})`, k === ref[0].wide && wide.every((w, i) => w === i < k), JSON.stringify(wide));
  return { normal, k };
}
function gapOf(m) {
  // The gap between the first two cells of one row.
  const first = m.cells[0];
  const next = m.cells.find((c) => c.top === first.top && c.left > first.left + 1);
  return next ? next.left - first.right : 0;
}

async function grids(page, appBase, harnessBase) {
  // The product's own grid: ten tiles at the three widths (spec 15.13 acceptance (4) for the count it makes).
  for (const w of WIDTHS) {
    await openApp(page, appBase, w, "#slide=C1");
    await click(page, ".stage__grid-button");
    await sleep(900);
    const m = await page.eval(MEASURE_GRID);
    const { normal } = judgeGrid(`product, ten tiles, ${w.viewport}px`, m, 10, w.phone);
    if (w.viewport === 1280) {
      check("15.13 rule 5 (1280px, ten tiles): 4 columns with 2 wide", m.tracks === 4 && m.cells.filter((c) => c.width > normal * 1.5).length === 2);
      // (5) a wide chart tile's thumbnail is the size of a normal tile's, and its takeaway is present.
      const wideThumb = m.cells[0], normalThumb = m.cells[2];
      check("15.13 (5) a wide tile's picture is the size of a normal tile's", Math.abs(wideThumb.thumbW - normalThumb.thumbW) < 1 && Math.abs(wideThumb.thumbH - normalThumb.thumbH) < 1, JSON.stringify([wideThumb.thumbW, wideThumb.thumbH, normalThumb.thumbW, normalThumb.thumbH]));
      check("15.13 (5) a wide tile shows its takeaway", m.cells.slice(0, 2).every((c) => (c.takeaway ?? "").length > 20) && m.cells.slice(2).every((c) => c.takeaway === null), JSON.stringify(m.cells.map((c) => c.takeaway?.slice(0, 20) ?? null)));
    }
  }
  // Other counts, in the harness.
  const counts = [4, 5, 6, 7, 9, 10];
  const spec = { 1280: { 4: [4, 0], 5: [3, 1], 6: [3, 0], 7: [4, 1], 9: [3, 0], 10: [4, 2] } };
  for (const w of WIDTHS) {
    for (const n of counts) {
      await page.viewport(w.viewport, 900, w.phone);
      await page.goto(`${harnessBase}/gridHarness.html?n=${n}&w=${w.content}`, 600);
      const ready = await page.waitFor("document.querySelectorAll('.grid-view > li').length > 0", 8000);
      await sleep(400);
      if (!ready) {
        check(`15.13 ${n} tiles at ${w.viewport}px: harness loads`, false, "no grid");
        continue;
      }
      const m = await page.eval(MEASURE_GRID);
      const label = `${n} tiles, ${w.viewport}px`;
      const { k } = judgeGrid(label, m, n, w.phone);
      if (w.viewport === 1280) {
        const [c, wd] = spec[1280][n];
        check(`15.13 (4) ${label}: rule 5 gives ${c} columns with ${wd} wide`, m.tracks === c && k === wd, `${m.tracks} columns, ${k} wide`);
      }
      if (w.phone) check(`15.13 (4) ${label}: 2 columns, ${n % 2} wide`, m.tracks === 2 && k === n % 2, `${m.tracks} columns, ${k} wide`);
      if (m.cells.some((c) => c.width > 0) && k > 0) {
        const wide = m.cells[0];
        const normalCell = m.cells.find((c) => c.width < wide.width * 0.75);
        if (normalCell) check(`15.13 (5) ${label}: a wide tile's picture matches a normal tile's`, Math.abs(wide.thumbW - normalCell.thumbW) < 1 && Math.abs(wide.thumbH - normalCell.thumbH) < 1, JSON.stringify([wide.thumbW, normalCell.thumbW]));
      }
    }
  }
}

// ---------------------------------------------------------------------------

const only = process.argv[2] ?? "all";
let chrome;
const servers = [];
try {
  console.log("building the app and the grid harness ...");
  const appDir = path.join(tmp, "app");
  const harnessDir = path.join(tmp, "harness");
  await buildInto(appDir);
  await buildInto(harnessDir, path.join(root, "src/charts/dev/stage/gridHarness.html"));
  // The harness build keeps its folder structure under the output folder; find the page.
  const found = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(d, e.name));
      else if (e.name === "gridHarness.html") found.push(path.relative(harnessDir, path.join(d, e.name)));
    }
  })(harnessDir);
  if (found.length === 0) throw new Error("the harness page was not built");
  const app = await serve(appDir);
  const harness = await serve(harnessDir);
  servers.push(app.server, harness.server);
  const appBase = `http://127.0.0.1:${app.port}`;
  const harnessBase = `http://127.0.0.1:${harness.port}/${path.dirname(found[0])}`;

  chrome = await launch(CDP_PORT);
  const page = await newPage(chrome.port);
  if (only === "all" || only === "column") await contentsColumn(page, appBase);
  if (only === "all" || only === "phone") await phonePicker(page, appBase);
  if (only === "all" || only === "ordinals") await noOrdinals(page, appBase);
  if (only === "all" || only === "grid") await grids(page, appBase, harnessBase);
  const errors = page.logs.filter((l) => /^EXC|^error/.test(l));
  check("no script error or console error during the run", errors.length === 0, errors.slice(0, 2).join(" | "));
  page.close();
} catch (error) {
  failures.push(`check script error: ${error instanceof Error ? error.stack : String(error)}`);
} finally {
  chrome?.close();
  for (const s of servers) s.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`\n${passed} checks passed, ${failures.length} failed`);
for (const f of failures) console.log(`  FAILED: ${f}`);
process.exit(failures.length === 0 ? 0 : 1);
