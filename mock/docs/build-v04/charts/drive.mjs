// Real-Chrome driver for the charts unit of the v0.4 build (spec 15.10 to 15.12). Not a gate: it needs
// playwright-core and Chrome, which the project does not depend on, so it is kept here beside the screenshots it makes.
//
//   PLAYWRIGHT_CORE=<dir that resolves playwright-core> [CHROME=<path to Chrome>] node drive.mjs <mock-root> <out-dir>
//
// Run `npm run build` in <mock-root> first. It serves mock/dist through request interception (no server is
// started), opens the first example at a device pixel ratio of 1, and
//   1. takes the screenshots of the result: C1, C3, C5 and C10 at 1280, the first chart at 390, and the disclosure open;
//   2. measures the renders from the canvas pixels: bar thickness, the paper gap between segments, the C3 bar width,
//      the C10 line widths;
//   3. reads the page's computed styles: the colour tokens against the Azure table, no dashed or dotted border in any
//      chart, the disclosure closed on load and its layout at 1280 and 375.
// It prints one line per measurement, PASS or FAIL, and exits 1 if any failed.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const [, , mockRoot = process.cwd(), outDir = "."] = process.argv;
const root = path.resolve(mockRoot);
fs.mkdirSync(outDir, { recursive: true });
const { chromium } = createRequire(path.join(process.env.PLAYWRIGHT_CORE ?? root, "noop.js"))("playwright-core");
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DIST = path.join(root, "dist");
const ORIGIN = "http://app.local";

/** The Azure table (spec 14.1), read from the palette's generated file. */
const azure = (() => {
  const css = fs.readFileSync(path.join(root, "docs/design-v0.4/palette/generated/tokens.css"), "utf8");
  const block = /html\[data-pal="AZ"\]\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
  const out = {};
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) if (!m[1].startsWith("--color-preset-")) out[m[1]] = m[2].trim().toLowerCase();
  return out;
})();
const rgbOf = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

let bad = 0;
const check = (ok, what) => {
  if (!ok) bad++;
  console.log(`${ok ? "PASS" : "FAIL"} ${what}`);
};
const near = (a, b, tol) => a !== undefined && Math.abs(a - b) <= tol;

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".csv": "text/csv", ".woff2": "font/woff2", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };
async function serve(page) {
  await page.route(`${ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());
    const rel = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const file = path.join(DIST, rel);
    if (!file.startsWith(DIST) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ status: 200, contentType: MIME[path.extname(file)] ?? "application/octet-stream", body: fs.readFileSync(file) });
  });
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

async function open(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror ${e.message}`));
  page.on("console", (m) => (m.type() === "error" ? errors.push(`console ${m.text().slice(0, 200)}`) : null));
  await serve(page);
  await page.goto(`${ORIGIN}/index.html`);
  await page.waitForSelector("button.chip");
  await page.click("button.chip >> nth=0");
  await page.waitForSelector(".chart-card canvas");
  await page.waitForTimeout(900);
  return { page, errors };
}

async function next(page) {
  await page.click('button[aria-label="Next chart"]');
  await page.waitForTimeout(700);
}

/**
 * Runs of one colour along a column or a row of the chart canvas: {from, to, size}. The canvas is transparent where nothing is
 * drawn, so a pixel counts by its alpha when its colour is `hex` (within a few levels), and an edge that falls between two
 * pixels still adds up to the true size. A run is the stretch of pixels that count at all, with its covered size.
 */
function clusters(page, hex, axis, at) {
  return page.evaluate(
    ([rgb, ax, pos]) => {
      const canvas = document.querySelector(".chart-card canvas");
      const w = canvas.width;
      const h = canvas.height;
      const data = canvas.getContext("2d").getImageData(0, 0, w, h).data;
      const n = ax === "col" ? h : w;
      const cover = (i) => {
        const x = ax === "col" ? pos : i;
        const y = ax === "col" ? i : pos;
        const o = (y * w + x) * 4;
        const near = Math.abs(data[o] - rgb[0]) <= 8 && Math.abs(data[o + 1] - rgb[1]) <= 8 && Math.abs(data[o + 2] - rgb[2]) <= 8;
        return near ? data[o + 3] / 255 : 0;
      };
      const out = [];
      let from = -1;
      let sum = 0;
      for (let i = 0; i <= n; i++) {
        const c = i < n ? cover(i) : 0;
        if (c > 0.02) {
          if (from < 0) from = i;
          sum += c;
        } else if (from >= 0) {
          out.push({ from, to: i - 1, size: Math.round(sum * 100) / 100 });
          from = -1;
          sum = 0;
        }
      }
      return out;
    },
    [rgbOf(hex), axis, at],
  );
}

/** The thickest cluster of `hex` over several lines, so a label crossing one line does not fool the measurement. */
async function thickest(page, hex, axis, positions) {
  let best = null;
  for (const at of positions) for (const c of await clusters(page, hex, axis, at)) if (!best || c.size > best.size) best = { ...c, at };
  return best;
}

/** The most common cluster size over many lines (for a thin line crossed at many places). */
async function modal(page, hex, axis, positions, max) {
  const sizes = [];
  for (const at of positions) for (const c of await clusters(page, hex, axis, at)) if (c.size <= max) sizes.push(Math.round(c.size));
  const count = (v) => sizes.filter((s) => s === v).length;
  return sizes.sort((a, b) => count(b) - count(a))[0];
}

const lines = (from, to, step) => Array.from({ length: Math.ceil((to - from) / step) }, (_, i) => from + i * step);

async function canvasSize(page) {
  return page.evaluate(() => {
    const c = document.querySelector(".chart-card canvas");
    return { w: c.width, h: c.height };
  });
}

// ---------------------------------------------------------------------------
// 1280
// ---------------------------------------------------------------------------
{
  const { page, errors } = await open(1280, 1000);
  const card = page.locator(".chart-card");
  const tok = (name) => azure[name];

  // Tokens: every colour of the table against the computed styles of the page.
  const computed = await page.evaluate((names) => Object.fromEntries(names.map((n) => [n, getComputedStyle(document.documentElement).getPropertyValue(n).trim().toLowerCase()])), Object.keys(azure));
  const wrong = Object.entries(azure).filter(([n, v]) => computed[n] !== v);
  check(wrong.length === 0, `${Object.keys(azure).length} colour tokens equal the Azure table in the computed styles${wrong.length ? `: ${wrong.map(([n, v]) => `${n} ${computed[n]} != ${v}`).join("; ")}` : ""}`);

  // C1: bar thickness per row.
  const size = await canvasSize(page);
  const cols = lines(250, size.w - 330, 3);
  const thickness = {};
  for (const [name, token] of [["comparator", "--color-today-1"], ["InfraVana", "--color-accent"], ["saved", "--color-saved"], ["option 1", "--color-today-2"], ["option 2", "--color-today-3"], ["option 3", "--color-today-4"]]) {
    thickness[name] = await thickest(page, tok(token), "col", cols);
  }
  console.log(`     C1 thickness at 1280: ${Object.entries(thickness).map(([n, c]) => `${n} ${c?.size}`).join(", ")}`);
  check(Object.values(thickness).every((c) => near(c?.size, 24, 1.1)), `C1: every bar is 24px thick at 1280 (${Object.values(thickness).map((c) => c?.size).join(", ")})`);
  await card.screenshot({ path: path.join(outDir, "c1-1280.png") });

  // The disclosure: closed on load, its summary, and open at 1280.
  const closed = await page.evaluate(() => {
    const d = document.querySelector(".chart-card details.sources");
    return { open: d?.open, summary: d?.querySelector("summary")?.textContent };
  });
  check(closed.open === false && closed.summary === "Where these numbers come from", `C1: the disclosure is closed on load and reads "${closed.summary}"`);
  await page.click(".chart-card details.sources > summary");
  await page.waitForTimeout(200);
  const open1280 = await page.evaluate(() => {
    const t = document.querySelector(".chart-card .sources__table");
    return {
      heads: [...t.querySelectorAll("thead th")].map((x) => x.textContent),
      rows: t.querySelectorAll("tbody tr").length,
      links: [...t.querySelectorAll("a")].map((a) => a.getAttribute("href")),
      notes: t.querySelectorAll(".sources__note").length,
    };
  });
  check(open1280.heads.join("|") === "Bar or group|Covers|Basis|Source" && open1280.rows >= 3, `C1 at 1280: the open disclosure is a table with ${open1280.heads.join(", ")} and ${open1280.rows} rows`);
  check(open1280.links.length > 0 && open1280.links.every((h) => new URL(h).hostname.endsWith(".invalid")) && open1280.notes === open1280.links.length, `C1 at 1280: ${open1280.links.length} Price list links, each followed by the placeholder words (${open1280.notes})`);
  await card.screenshot({ path: path.join(outDir, "c1-1280-sources-open.png") });
  await page.click(".chart-card details.sources > summary");

  // Computed borders: nothing dashed or dotted in any chart or either C10 view.
  const dashed = async (label) => {
    const found = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll(".chart-card, .chart-card *")) {
        const cs = getComputedStyle(el);
        for (const side of ["top", "right", "bottom", "left"]) {
          const s = cs.getPropertyValue(`border-${side}-style`);
          if (s === "dashed" || s === "dotted") out.push(`${s} ${el.className || el.tagName}`);
        }
        if (cs.outlineStyle === "dashed" || cs.outlineStyle === "dotted") out.push(`outline ${el.className || el.tagName}`);
      }
      return out;
    });
    check(found.length === 0, `${label}: no element has a dashed or dotted border${found.length ? `: ${found.join(", ")}` : ""}`);
  };
  await dashed("C1");

  // C5.
  await next(page);
  {
    const s = await canvasSize(page);
    const c5 = await thickest(page, tok("--color-today-1"), "col", lines(250, s.w - 300, 3));
    check(near(c5?.size, 24, 1.1), `C5: the comparator bar is ${c5?.size}px thick at 1280 (spec: 24)`);
    await card.screenshot({ path: path.join(outDir, "c5-1280.png") });
    await dashed("C5");
  }

  // C3: every Today option and InfraVana is a bar, on one baseline, at most 44px wide.
  await next(page);
  {
    const s = await canvasSize(page);
    // The baseline is the lowest row where every bar still stands: scan up from the axis for the first row all five colours cross.
    const names = [["comparator", "--color-today-1"], ["InfraVana", "--color-accent"], ["option 1", "--color-today-2"], ["option 2", "--color-today-3"], ["option 3", "--color-today-4"]];
    const widths = {};
    for (let y = s.h - 40; y > s.h - 120 && Object.keys(widths).length < names.length; y -= 4) {
      for (const [name, token] of names) {
        if (widths[name]) continue;
        const c = (await clusters(page, tok(token), "row", y)).filter((x) => x.size > 4).sort((a, b) => b.size - a.size)[0];
        if (c) widths[name] = c.size;
      }
    }
    console.log(`     C3 bar widths at 1280: ${Object.entries(widths).map(([n, w]) => `${n} ${w}`).join(", ")}`);
    check(Object.keys(widths).length === names.length && Object.values(widths).every((w) => w <= 45.1), `C3: every Today option and InfraVana is a bar of at most 44px (${Object.values(widths).join(", ")})`);
    await card.screenshot({ path: path.join(outDir, "c3-1280.png") });
    await dashed("C3");
  }

  // C10, quality then speed: the frontier is a 3px line and a Today line 2px.
  await next(page);
  {
    const s = await canvasSize(page);
    const xs = lines(90, s.w - 290, 4);
    const frontier = await modal(page, tok("--color-accent-strong"), "col", xs, 5);
    check(frontier === 3, `C10: the frontier line is ${frontier}px thick (spec: 3)`);
    // Today lines measured one colour at a time at their thickest. Two of them lie within a pixel of each other (the data), and
    // the one drawn later covers part of the first, so the check is that none is thicker than 2px and at least two are 2px.
    const todays = [];
    for (const name of ["--color-today-1", "--color-today-2", "--color-today-3", "--color-today-4"]) {
      const best = await thickest(page, tok(name), "col", xs.filter((_, i) => i % 3 === 0));
      todays.push(best?.size);
    }
    console.log(`     C10 Today line thickness by colour (thickest run): ${todays.join(", ")}`);
    check(todays.every((v) => v === undefined || v <= 2.2) && todays.filter((v) => near(v, 2, 0.3)).length >= 2, `C10: no Today line is thicker than 2px and the clear ones are 2px (${todays.join(", ")})`);
    await card.screenshot({ path: path.join(outDir, "c10-1280.png") });
    await dashed("C10 quality");
    await page.click('.c10-switch input[value="speed"]');
    await page.waitForTimeout(700);
    await dashed("C10 speed");
    const speedRows = await page.evaluate(() => {
      const d = document.querySelector(".chart-card details.sources");
      d.open = true;
      const rows = [...d.querySelectorAll("tbody tr")].map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent));
      d.open = false;
      return rows;
    });
    check(speedRows.some((r) => (r[1] ?? "").includes("Invented speeds and batch or flex prices") && r[2] === "Modelled"), "C10 speed view: the table lists the invented rows as modelled");
    check(((await page.locator(".chart-card .chart-source").textContent()) ?? "").includes("invented placeholder data"), 'C10 speed view: the source line says "invented placeholder data"');
    await card.screenshot({ path: path.join(outDir, "c10-1280-speed.png") });
  }
  check(errors.length === 0, `no console errors at 1280 (${errors.length})`);
  await page.close();
}

// ---------------------------------------------------------------------------
// The paper gap: the comparator "Seats" is two wide segments of one colour, so the gap between them is measured alone
// ---------------------------------------------------------------------------
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await serve(page);
  await page.goto(`${ORIGIN}/index.html#cmp=seats`);
  await page.waitForSelector("button.chip");
  await page.click("button.chip >> nth=0");
  await page.waitForSelector(".chart-card canvas");
  await page.waitForTimeout(900);
  const hex = azure["--color-today-1"];
  const size = await canvasSize(page);
  const bar = await thickest(page, hex, "col", lines(250, size.w - 330, 3));
  // A row near the top of the bar, clear of its labels.
  const y = bar.from + 3;
  const runsAlong = (await clusters(page, hex, "row", y)).filter((c) => c.to - c.from > 20).sort((a, b) => a.from - b.from);
  const share = (x) =>
    page.evaluate(
      ([px, py, rgb, ground]) => {
        const d = document.querySelector(".chart-card canvas").getContext("2d").getImageData(px, py, 1, 1).data;
        const span = rgb.map((v, i) => v - ground[i]);
        const t = [0, 1, 2].reduce((a, i) => a + (d[i] - ground[i]) * span[i], 0) / span.reduce((a, v) => a + v * v, 0);
        return Math.max(0, Math.min(1, t));
      },
      [x, y, rgbOf(hex), rgbOf(azure["--color-bg"])],
    );
  if (runsAlong.length >= 2) {
    // Each edge pixel is a mix of the segment colour and the paper; its share of the colour says how far the segment reaches into it.
    const end = runsAlong[0].to + 1 + (await share(runsAlong[0].to + 1));
    const start = runsAlong[1].from - (await share(runsAlong[1].from - 1));
    const gap = Math.round((start - end) * 10) / 10;
    check(near(gap, 2, 0.35), `C1: the paper gap between the two segments of the comparator bar is ${gap}px (spec: 2)`);
  } else {
    check(false, `C1: the comparator bar has ${runsAlong.length} wide segments, expected two`);
  }
  await page.close();
}

// ---------------------------------------------------------------------------
// 390 and 375
// ---------------------------------------------------------------------------
{
  const { page, errors } = await open(390, 900);
  const card = page.locator(".chart-card");
  const s = await canvasSize(page);
  const xs = lines(40, s.w - 40, 7);
  const bars = {};
  for (const [name, token] of [["comparator", "--color-today-1"], ["InfraVana", "--color-accent"], ["option 1", "--color-today-2"], ["option 2", "--color-today-3"], ["option 3", "--color-today-4"]]) {
    bars[name] = await thickest(page, azure[token], "col", xs);
  }
  check(Object.values(bars).every((c) => near(c?.size, 24, 1.1)), `C1 at 390: every bar is 24px thick (${Object.values(bars).map((c) => c?.size).join(", ")})`);
  // The comparator bar spans the canvas: full width, from the 8px margin to the 24px right margin.
  const mid = Math.round((bars.comparator.from + bars.comparator.to) / 2);
  const run = (await clusters(page, azure["--color-today-1"], "row", mid)).sort((a, b) => b.to - b.from - (a.to - a.from))[0];
  check(run !== undefined && run.from <= 12 && run.to - run.from >= s.w * 0.55, `C1 at 390: the comparator bar starts at the left margin (${run?.from}) and runs ${run ? run.to - run.from : 0}px of ${s.w}`);
  // Rows are 84px apart.
  const tops = Object.values(bars).map((c) => c.from).sort((a, b) => a - b);
  const spacing = tops.slice(1).map((v, i) => v - tops[i]);
  check(spacing.length >= 3 && spacing.every((d) => Math.abs(d - 84) <= 3), `C1 at 390: rows are ${spacing.join(", ")}px apart (spec: 84)`);
  await card.screenshot({ path: path.join(outDir, "c1-390.png") });
  const scroll = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, view: window.innerWidth }));
  check(scroll.doc === scroll.view, `390: the page's scroll width ${scroll.doc} equals the viewport ${scroll.view}`);
  check(errors.length === 0, `no console errors at 390 (${errors.length})`);
  await page.close();
}
{
  const { page } = await open(375, 900);
  await page.click(".chart-card details.sources > summary");
  await page.waitForTimeout(200);
  const m = await page.evaluate(() => {
    const t = document.querySelector(".chart-card .sources__table");
    return {
      tableWidth: Math.round(t.getBoundingClientRect().width),
      display: getComputedStyle(t.querySelector("td")).display,
      blocks: t.querySelectorAll("tbody tr").length,
      doc: document.documentElement.scrollWidth,
      view: window.innerWidth,
    };
  });
  check(m.display === "block" && m.tableWidth <= m.view && m.doc === m.view, `C1 at 375: the open disclosure is ${m.blocks} stacked blocks (cells ${m.display}), ${m.tableWidth}px wide in a ${m.view}px viewport, page scroll width ${m.doc}`);
  await page.locator(".chart-card").screenshot({ path: path.join(outDir, "c1-375-sources-open.png") });
  await page.close();
}
await browser.close();
console.log(bad === 0 ? "ALL OK" : `FAILED: ${bad}`);
process.exit(bad === 0 ? 0 : 1);
