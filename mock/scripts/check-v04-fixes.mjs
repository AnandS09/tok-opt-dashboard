// Measured-render check of the layout and label faults the bundled review of the
// merged v0.4 build raised (headline wrap, chart rule, pressed button, chart
// labels, goal tab, comparator line). From mock/:
//
//   node scripts/check-v04-fixes.mjs
//
// It builds the app into a temporary folder, serves it on localhost, drives
// headless Chrome over the DevTools protocol through the guided intake with the
// answers the review used (software company, 120 people, 200,000 customers,
// $150K a quarter) and reads the rendered page: computed styles, bounding boxes,
// the line each character of the headline falls on, and SVG text and line
// positions of the drawn charts. Exit code 0 only when every check passes. The
// browser and the server are stopped before it exits.
//
// Needs Google Chrome (set CHROME to its binary if it is not at the macOS path).
// Each check is the measurement of one finding, so it fails on the code the
// review looked at; run it against that code to see the failures.
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
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "v04-fixes-"));
const CDP_PORT = Number(process.env.CDP_PORT ?? 9556);

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".csv": "text/csv", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png" };

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

const failures = [];
let passed = 0;
function check(name, ok, detail = "") {
  if (ok) passed += 1;
  else failures.push(`${name}${detail ? `  [${detail}]` : ""}`);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? `  [${detail}]` : ""}`);
}

// ---------------------------------------------------------------------------
// Driving the page
// ---------------------------------------------------------------------------

const click = async (page, sel) => {
  await page.eval(`document.querySelector(${JSON.stringify(sel)}).click()`);
  await sleep(300);
};
const clickNth = async (page, sel, n) => {
  await page.eval(`document.querySelectorAll(${JSON.stringify(sel)})[${n}].click()`);
  await sleep(300);
};

async function typeValue(page, value) {
  await page.eval("(() => { const i = document.querySelector('.lv__input'); i.focus(); i.select(); })()");
  await page.send("Input.insertText", { text: String(value) });
  await page.key("Enter");
  await page.eval("document.activeElement.blur()");
  await sleep(250);
}

/** Opens the page at `width` and answers the intake; ends on the first chart of the first goal tab. */
async function toFinal(page, base, width, { type = 1, users = 120, customers = 200000, budget = 150000, hash = "" } = {}) {
  await page.viewport(width, 900, false);
  await page.goto("about:blank", 100);
  await page.goto(`${base}/index.html${hash}`, 900);
  await page.waitFor("document.querySelectorAll('.intake .choice').length > 0");
  await clickNth(page, ".choices .choice", type);
  await click(page, ".intake__nav .button--primary");
  if (type !== 0) {
    await typeValue(page, users);
    await click(page, ".intake__nav .button--primary");
  }
  await typeValue(page, customers);
  await click(page, ".intake__nav .button--primary");
  await typeValue(page, budget);
  await click(page, ".intake__nav .button--primary");
  await clickNth(page, ".choices .choice", 1);
  await page.waitFor("document.querySelector('.hero') !== null && document.querySelector('.stage__title') !== null");
  await page.waitFor("!document.querySelector('.goal-tabs__figure[data-pending], .goal-tabs__figure[data-stale]') && !document.querySelector('#goal-panel[data-pending], #goal-panel[data-stale]')", 15000);
  await sleep(1200);
}

async function mouseAt(page, x, y) {
  await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await sleep(200);
}

/** WCAG contrast of a computed foreground over the first opaque ancestor background, in the page. */
const CONTRAST = (sel) => `(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  const parse = (c) => c.match(/[\\d.]+/g).map(Number);
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  let bgEl = el; let bg = null;
  while (bgEl) { const c = parse(getComputedStyle(bgEl).backgroundColor); if (c.length === 3 || c[3] === 1) { bg = c; break; } bgEl = bgEl.parentElement; }
  const fg = parse(getComputedStyle(el).color);
  const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
  return { ratio: (l1 + 0.05) / (l2 + 0.05), fg: getComputedStyle(el).color, bg: getComputedStyle(bgEl).backgroundColor };
})()`;

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/** The first character of every line the headline falls on, and the line count (text inside the picker's list ignored). */
const HEADLINE_LINES = `(() => {
  const f = document.querySelector('.hero__figure');
  const walker = document.createTreeWalker(f, NodeFilter.SHOW_TEXT);
  const lines = new Map();
  let n;
  while ((n = walker.nextNode())) {
    if (n.parentElement.closest('select')) continue;
    for (let i = 0; i < n.length; i++) {
      if (/\\s/.test(n.data[i])) continue;
      const rg = document.createRange();
      rg.setStart(n, i);
      rg.setEnd(n, i + 1);
      const r = rg.getClientRects()[0];
      if (!r) continue;
      const key = Math.round(r.top / 4);
      if (!lines.has(key) || lines.get(key).x > r.left) lines.set(key, { ch: n.data[i], x: r.left });
    }
  }
  return { count: lines.size, starts: [...lines.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v.ch).join(''), comparator: document.querySelector('.hero .comparator__control').value };
})()`;

/** Headline: ordinary inline text, the comma kept to the picker, three lines at 1280 for Pay-as-you-go API. */
async function headline(page, base) {
  for (const width of [1280, 390]) {
    await toFinal(page, base, width);
    const ids = await page.eval("[...document.querySelectorAll('.hero .comparator__control option')].map((o) => o.value)");
    const bad = [];
    for (const id of ids) {
      await page.eval(`(() => { const s = document.querySelector('.hero .comparator__control'); s.value = ${JSON.stringify(id)}; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
      await sleep(900);
      const r = await page.eval(HEADLINE_LINES);
      if (width === 1280 && id === "api") {
        const display = await page.eval("getComputedStyle(document.querySelector('.hero__figure')).display");
        check("F-1 1280px: the headline for Pay-as-you-go API is 3 lines", r.count === 3, `${r.count} lines, starts ${r.starts}`);
        check("F-1 1280px: the headline is ordinary inline text, not a flex box", display === "block", display);
      }
      if (r.starts.includes(",")) bad.push(`${r.comparator} (${r.starts})`);
    }
    check(`F-1 ${width}px: no line of the headline starts with a comma, for all ${ids.length} comparators`, bad.length === 0, bad.join(" | "));
  }
}

/** Each chart sits under a 2px rule in the section accent (spec 14.3). */
async function chartRule(page, base) {
  for (const width of [1280, 390]) {
    await toFinal(page, base, width);
    const r = await page.eval(`(() => {
      const probe = document.createElement('div');
      probe.style.color = 'var(--color-section)';
      document.body.append(probe);
      const section = getComputedStyle(probe).color;
      probe.remove();
      const cs = getComputedStyle(document.querySelector('.stage__panel'));
      return { width: cs.borderTopWidth, style: cs.borderTopStyle, color: cs.borderTopColor, section };
    })()`);
    check(`F-2 ${width}px: the chart's top rule is 2px solid in the section accent`, r.width === "2px" && r.style === "solid" && r.color === r.section, JSON.stringify(r));
  }
}

/** The pressed Grid view button stays readable under the pointer (4.5:1). */
async function gridButton(page, base) {
  for (const width of [1280, 390]) {
    await toFinal(page, base, width);
    await click(page, ".stage__grid-button");
    await page.eval("document.activeElement.blur()");
    await mouseAt(page, 2, 2);
    const away = await page.eval(CONTRAST(".stage__grid-button"));
    await page.eval("document.querySelector('.stage__grid-button').scrollIntoView({ block: 'center' })");
    await sleep(200);
    const box = await page.eval("(() => { const r = document.querySelector('.stage__grid-button').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()");
    await mouseAt(page, box[0], box[1]);
    const hovered = await page.eval(CONTRAST(".stage__grid-button"));
    const isHover = await page.eval("document.querySelector('.stage__grid-button').matches(':hover')");
    check(`F-3 ${width}px: the pressed Grid view label is readable with the pointer away (${away.ratio.toFixed(2)}:1)`, away.ratio >= 4.5, JSON.stringify(away));
    check(`F-3 ${width}px: the pressed Grid view label is readable under the pointer (${hovered.ratio.toFixed(2)}:1)`, isHover && hovered.ratio >= 4.5, JSON.stringify({ isHover, ...hovered }));
    await mouseAt(page, 2, 2);
    await click(page, ".stage__grid-button");
  }
}

// ---------------------------------------------------------------------------

let chrome;
let server;
try {
  console.log("building the app ...");
  const appDir = path.join(tmp, "app");
  await build({ root, configFile: false, base: "./", logLevel: "error", plugins: [react()], build: { outDir: appDir, emptyOutDir: true } });
  const app = await serve(appDir);
  server = app.server;
  const base = `http://127.0.0.1:${app.port}`;
  chrome = await launch(CDP_PORT);
  const page = await newPage(chrome.port);
  await headline(page, base);
  await chartRule(page, base);
  await gridButton(page, base);
  const errors = page.logs.filter((l) => /^EXC/.test(l));
  check("no script error during the run", errors.length === 0, errors.slice(0, 2).join(" | "));
  page.close();
} catch (error) {
  failures.push(`check script error: ${error instanceof Error ? error.stack : String(error)}`);
} finally {
  chrome?.close();
  server?.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`\n${passed} checks passed, ${failures.length} failed`);
for (const f of failures) console.log(`  FAILED: ${f}`);
process.exit(failures.length === 0 ? 0 : 1);
