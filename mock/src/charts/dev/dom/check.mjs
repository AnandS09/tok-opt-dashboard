/**
 * Development check, not part of the app (the app never imports it): mounts
 * the real app in a DOM, opens the first example and, driving the stage
 * carousel slide by slide, confirms that C1, C5 and C3 each draw a non-empty
 * canvas with a non-zero size; then picks another comparator in the
 * "Compared with" select and confirms the figures change and every chart still draws.
 *
 * Why it exists: `renderCheck.ts` renders to a string on the server, so it
 * never runs an effect, never runs React StrictMode (which `npm run dev` uses
 * and a production build does not), and never creates a canvas chart. A fault
 * that only shows once the page runs in a browser passes it. This check runs
 * `src/main.tsx` as written: StrictMode, the fetch of the data files, every
 * effect, ECharts' canvas renderer, ResizeObserver and IntersectionObserver.
 *
 * What is stubbed, because jsdom has no layout engine and no canvas:
 *   - element sizes come from `layout.mjs`, a small model of the page's own
 *     stylesheet (block, flex, grid, aspect-ratio, percentage heights);
 *   - ResizeObserver reports every size change, as a browser does;
 *   - IntersectionObserver reports every element as visible;
 *   - the canvas 2D context records how many drawing calls it received.
 *
 * It needs jsdom, which the project does not depend on. Install it anywhere
 * outside the repo and point this script at it:
 *
 *   mkdir /tmp/jsdom-for-check && cd /tmp/jsdom-for-check && npm install jsdom
 *   JSDOM_DIR=/tmp/jsdom-for-check node src/charts/dev/dom/check.mjs   (from mock/)
 *
 * It also reads the benefit boxes of each chart (spec 6.4, 14.3): one to
 * three boxes, each with a non-zero printed number, a label and a comparator
 * line, the caption as the accessible name, no shadow or round corner; and,
 * under another comparator, that every box names the one the selector shows.
 *
 * And the chart rules of spec 15.10 to 15.12, read from the mounted page's
 * computed styles: every colour token of 14.1 equals the Azure table value
 * (read from `docs/design-v0.4/palette/generated/tokens.css`, block AZ); no
 * element of a chart has a dashed or dotted computed border or a provenance
 * badge; each chart's "Where these numbers come from" disclosure is closed on
 * load, sits between the canvas and the source line, and opened shows the four
 * headings and one row per non-measured group, with links read from the data
 * (`--sources-real` serves one row with a real address and requires the link to
 * follow it and the placeholder words to go); and no provenance word outside it.
 *
 * It runs the app once as it is (must pass), then once per entry of `FAULTS`
 * with that fault put into the source by a transform (each must fail), so a
 * pass is never vacuous. Exit code 0 only when the first passes and all the
 * others fail.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../..");
const IDS = ["C1", "C5", "C3", "C10"];
/** The real-address run gives every offer row a real address in place of the placeholder one. */
const REAL_PREFIX = "https://prices.example.test/real/";
const REAL_FROM = "https://example.invalid/placeholder-invented-data/offers/";
/** The Azure colour table of spec 14.1, read from the generated palette file (block AZ), not typed here. */
const AZURE_TOKENS = (() => {
  const css = fs.readFileSync(path.join(root, "docs/design-v0.4/palette/generated/tokens.css"), "utf8");
  const block = /html\[data-pal="AZ"\]\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
  const out = {};
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) if (!m[1].startsWith("--color-preset-")) out[m[1]] = m[2].trim().toLowerCase();
  return out;
})();
/** Every address a data row holds, so a link can be checked to have been read from one. */
const DATA_ADDRESSES = (() => {
  const out = new Set();
  for (const f of ["hardware.csv", "seat_plans.csv", "model_offers.csv", "buying_patterns.csv", "quality.csv"]) {
    for (const m of fs.readFileSync(path.join(root, "public/data", f), "utf8").matchAll(/https?:\/\/[^,\s]+/g)) out.add(m[0]);
  }
  return out;
})();
// The page lists the charts in registry order.

// ---------------------------------------------------------------------------
// Parent: build the app twice, run each build in a child process
// ---------------------------------------------------------------------------

/** The first statements of C3's option builder: the fault is put in front of them. */
const FAULT_SITE = "const cmp = comparisonOf(results);\n  const sides = sidesOf(cmp);\n  const rows = shownRows(results, cmp);";

/**
 * Negative controls: each rewrites one line of the app and must make this check fail.
 * `file` is the end of the module's path, `from` the exact text replaced.
 */
const FAULTS = [
  {
    name: "fault-in-c3",
    file: "charts/c3CostPerMtok.tsx",
    from: FAULT_SITE,
    to: `throw new Error("negative control");\n  ${FAULT_SITE}`,
  },
  {
    name: "no-benefit-boxes",
    file: "components/StageSlots.tsx",
    from: "const boxes = attempt(() => def.benefits(results, context), []);",
    to: "const boxes = [];",
  },
  {
    name: "box-without-comparator",
    file: "charts/benefits.ts",
    from: "return `vs ${comparisonOf(results).label}`;",
    to: 'return "";',
  },
  {
    name: "four-boxes",
    file: "charts/benefits.ts",
    from: "export const MAX_BOXES = 3;",
    to: "export const MAX_BOXES = 4;",
  },
  {
    name: "caption-lost",
    file: "components/BenefitBoxes.tsx",
    from: "aria-labelledby={captionId}",
    to: "",
  },
  {
    name: "box-shadow",
    file: "components/BenefitBoxes.tsx",
    from: '<ul className="benefit-boxes__list">',
    to: '<ul className="benefit-boxes__list" style={{ boxShadow: "0 1px 3px black" }}>',
  },
  // Spec 15.10 to 15.12: each rule of the disclosure and the palette is broken once and must turn the run red.
  { name: "disclosure-open", file: "charts/ProvenanceNotes.tsx", from: '<details className="sources">', to: '<details className="sources" open>' },
  { name: "summary-renamed", file: "charts/ProvenanceNotes.tsx", from: "<summary>Where these numbers come from</summary>", to: "<summary>Sources</summary>" },
  { name: "badge-returns", file: "charts/ProvenanceNotes.tsx", from: '<div className="chart-notes">', to: '<div className="chart-notes"><span className="prov-badge" />' },
  { name: "dashed-border", file: "charts/ProvenanceNotes.tsx", from: '<p className="chart-source">', to: '<p className="chart-source" style={{ borderTopStyle: "dashed" }}>' },
  { name: "provenance-word-outside", file: "charts/ProvenanceNotes.tsx", from: "<b>Source:</b> {source.source}", to: "<b>Source:</b> modelled {source.source}" },
  { name: "link-address-typed-in-code", file: "charts/ProvenanceNotes.tsx", from: "<a href={link.url} rel=", to: '<a href="https://invented.example/x" rel=' },
  { name: "placeholder-words-dropped", file: "charts/ProvenanceNotes.tsx", from: '{link.placeholder ? <em className="sources__note"> {PLACEHOLDER_NOTE}</em> : null}', to: "{null}" },
  { name: "colour-token-edited", env: { DOM_CHECK_TOKEN_FAULT: "1" } },
  { name: "chart-on-muted-ground", env: { DOM_CHECK_GROUND_FAULT: "1" } },
];

function findJsdom() {
  const candidates = [process.env.JSDOM_DIR, root].filter(Boolean);
  for (const dir of candidates) {
    try {
      return createRequire(path.join(dir, "noop.js")).resolve("jsdom");
    } catch {}
    try {
      // JSDOM_DIR may be the jsdom package itself.
      if (fs.existsSync(path.join(dir, "package.json")) && JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).name === "jsdom") {
        return createRequire(path.join(dir, "noop.js")).resolve(dir);
      }
    } catch {}
  }
  return null;
}

async function buildApp(outFile, fault) {
  const { build } = await import(pathToFileURL(path.join(root, "node_modules/vite/dist/node/index.js")).href);
  const mutation = {
    name: "put-a-fault-in",
    enforce: "pre",
    transform(code, id) {
      if (!fault || !fault.file || !id.endsWith(fault.file)) return null;
      if (!code.includes(fault.from)) throw new Error(`check.mjs: ${fault.file} changed; update the "${fault.name}" fault in check.mjs`);
      return { code: code.replace(fault.from, fault.to), map: null };
    },
  };
  await build({
    root,
    logLevel: "error",
    mode: "development",
    publicDir: false,
    plugins: [mutation],
    build: {
      ssr: path.join(root, "src/main.tsx"),
      outDir: path.dirname(outFile),
      emptyOutDir: false,
      minify: false,
      target: "node22",
      rollupOptions: { output: { entryFileNames: path.basename(outFile), format: "es" } },
    },
    ssr: { noExternal: true },
    define: { "process.env.NODE_ENV": JSON.stringify("development") },
  });
}

async function parent() {
  const jsdom = findJsdom();
  if (!jsdom) {
    console.error("jsdom not found. Install it outside the repo and set JSDOM_DIR; see the top of this file.");
    process.exit(2);
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dom-check-"));
  try {
    const outcomes = {};
    for (const [name, fault] of [["as-is", null], ...FAULTS.map((f) => [f.name, f])]) {
      const out = path.join(tmp, `${name}.mjs`);
      await buildApp(out, fault);
      const run = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--child", out], {
        env: { ...process.env, DOM_CHECK_JSDOM: jsdom, ...(fault?.env ?? {}) },
        encoding: "utf8",
      });
      outcomes[name] = run;
      console.log(`--- ${name} (exit ${run.status})\n${run.stdout}${run.stderr && !run.stdout ? run.stderr : ""}`);
      if (!fault) {
        // The same build with one fixture row given a real address: its link follows it and drops the placeholder words (spec 15.10 acceptance 6).
        const real = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--child", out, "--sources-real"], {
          env: { ...process.env, DOM_CHECK_JSDOM: jsdom },
          encoding: "utf8",
        });
        outcomes.real = real;
        console.log(`--- one fixture row with a real address (exit ${real.status})\n${real.stdout}${real.stderr && !real.stdout ? real.stderr : ""}`);
        // The same build opened on the address of C10's speed view (spec 6.3, acceptance 5: a reload honours it).
        const reload = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--child", out, "--reload"], {
          env: { ...process.env, DOM_CHECK_JSDOM: jsdom, DOM_CHECK_HASH: "#slide=C10&goal=G1&c10=speed" },
          encoding: "utf8",
        });
        outcomes.reload = reload;
        console.log(`--- reload on #slide=C10&c10=speed (exit ${reload.status})\n${reload.stdout}${reload.stderr && !reload.stdout ? reload.stderr : ""}`);
      }
    }
    const good = outcomes["as-is"].status === 0 && outcomes.reload.status === 0 && outcomes.real.status === 0;
    const red = FAULTS.map((f) => [f.name, outcomes[f.name].status === 1]);
    const controlsRed = red.every(([, r]) => r);
    console.log(`as-is, reload and real-address runs pass: ${good ? "yes" : "NO"}; negative controls that fail: ${red.map(([n, r]) => `${n} ${r ? "yes" : "NO"}`).join(", ")}`);
    console.log(good && controlsRed ? "ALL OK" : "FAILED");
    process.exit(good && controlsRed ? 0 : 1);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Child: one browser-like page, one build of the app
// ---------------------------------------------------------------------------

async function child(bundle) {
  const { makeLayout, VIEWPORT } = await import("./layout.mjs");
  const { JSDOM } = createRequire(import.meta.url)(process.env.DOM_CHECK_JSDOM);

  // `--reload` opens the page on the address of C10's speed view, as a reload of it would.
  const startHash = process.env.DOM_CHECK_HASH ?? "";
  const dom = new JSDOM('<!doctype html><html lang="en"><head><title>t</title></head><body><div id="root"></div></body></html>', {
    url: `http://localhost:5173/${startHash}`,
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const doc = window.document;

  // jsdom drops clamp() declarations and does not resolve var(), so both are
  // evaluated here, with the viewport below, before the text becomes a <style>.
  // `colour-token-edited` negative control: the accent token is changed in the stylesheet the page loads.
  const faulty = (t) => (process.env.DOM_CHECK_TOKEN_FAULT ? t.replace(/(--color-accent:\s*)#[0-9a-f]{6}/, "$1" + "#" + "0066b0") : t);
  const strip = (t) => faulty(t).replace(/\/\*[\s\S]*?\*\//g, "");
  const tokensText = strip(fs.readFileSync(path.join(root, "src/styles/tokens.css"), "utf8"));
  const rootBlock = /:root\s*\{([\s\S]*?)\n\}/.exec(tokensText)[1];
  const tokenMap = {};
  for (const m of rootBlock.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) tokenMap[m[1]] = m[2].trim();
  const resolveVars = (t) => {
    let out = t;
    for (let i = 0; i < 8 && /var\(/.test(out); i++) out = out.replace(/var\((--[\w-]+)\)/g, (_, n) => tokenMap[n] ?? "");
    return out;
  };
  const evalClamp = (t) =>
    t.replace(/clamp\(([^()]*)\)/g, (_, args) => {
      const v = args.split(",").map((a) => (a.trim().endsWith("vh") ? (parseFloat(a) / 100) * VIEWPORT.h : parseFloat(a)));
      return `${Math.min(Math.max(v[1], v[0]), v[2])}px`;
    });
  for (const f of ["tokens.css", "app.css", "intake.css", "stage.css", "compare.css", "c10.css"]) {
    const style = doc.createElement("style");
    style.textContent = evalClamp(resolveVars(strip(fs.readFileSync(path.join(root, "src/styles", f), "utf8"))));
    doc.head.appendChild(style);
  }
  // `chart-on-muted-ground` negative control: a chart card is given the muted fill, which marks fall below 3:1 on.
  if (process.env.DOM_CHECK_GROUND_FAULT) {
    const style = doc.createElement("style");
    style.textContent = ".chart-card { background: " + tokenMap["--color-surface-muted"] + "; }";
    doc.head.appendChild(style);
  }

  // Globals the app and ECharts read.
  process.env.NODE_ENV = "development";
  for (const key of Object.getOwnPropertyNames(window)) {
    if (key in globalThis) continue;
    try {
      Object.defineProperty(globalThis, key, { configurable: true, get: () => window[key], set: (v) => (window[key] = v) });
    } catch {}
  }
  for (const key of ["window", "document", "navigator", "location", "history", "HTMLElement", "Element", "Node", "Event", "CustomEvent", "KeyboardEvent", "MouseEvent", "PointerEvent", "HTMLCanvasElement", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"]) {
    const value = key === "getComputedStyle" || key.endsWith("AnimationFrame") ? window[key].bind(window) : window[key];
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  globalThis.self = window;
  window.devicePixelRatio = globalThis.devicePixelRatio = 2;

  const logs = [];
  for (const level of ["error", "warn"]) {
    console[level] = (...a) => logs.push(`${level}: ${a.map((x) => (x instanceof Error ? x.message : String(x))).join(" ")}`);
  }
  window.addEventListener("error", (e) => logs.push(`window error: ${e.message}`));

  // The dev server serves public/ at the site root.
  const pub = path.join(root, "public");
  globalThis.fetch = window.fetch = async (url) => {
    const file = path.join(pub, decodeURIComponent(new URL(String(url), "http://localhost:5173/").pathname));
    if (!fs.existsSync(file)) return { ok: false, status: 404, statusText: "Not Found", text: async () => "", json: async () => ({}) };
    let body = fs.readFileSync(file, "utf8");
    // `--sources-real`: the first direct offer carries a real address, as a data update would give it.
    if (process.argv.includes("--sources-real") && file.endsWith("model_offers.csv")) body = body.split(REAL_FROM).join(REAL_PREFIX);
    return { ok: true, status: 200, statusText: "OK", text: async () => body, json: async () => JSON.parse(body), headers: { get: () => null } };
  };

  // Element sizes from the layout model.
  const layout = makeLayout(window);
  const HE = window.HTMLElement.prototype;
  const dims = (el) => {
    resolveInlineVars();
    layout.run();
    return layout.sizeOf(el);
  };
  for (const [prop, axis] of [["clientWidth", "w"], ["clientHeight", "h"], ["offsetWidth", "w"], ["offsetHeight", "h"]]) {
    Object.defineProperty(HE, prop, { configurable: true, get() { return Math.round(dims(this)[axis]); } });
  }
  HE.getBoundingClientRect = function () {
    const s = dims(this);
    return { x: 0, y: 0, left: 0, top: 0, width: s.w, height: s.h, right: s.w, bottom: s.h, toJSON() {} };
  };
  HE.getClientRects = function () {
    return [this.getBoundingClientRect()];
  };

  // Canvas 2D context that counts drawing calls.
  const DRAW = new Set(["fill", "stroke", "fillText", "strokeText", "drawImage", "fillRect", "strokeRect"]);
  const draws = new WeakMap();
  window.HTMLCanvasElement.prototype.getContext = function (type) {
    if (type !== "2d") return null;
    if (this.__ctx) return this.__ctx;
    const canvas = this;
    const ctx = new Proxy({}, {
      get(t, k) {
        if (k === "canvas") return canvas;
        if (k === "measureText") return (text) => ({ width: String(text).length * 6.5 });
        if (k === "createLinearGradient" || k === "createRadialGradient") return () => ({ addColorStop() {} });
        if (k === "createPattern") return () => ({ setTransform() {} });
        if (k === "getImageData") return () => ({ data: new Uint8ClampedArray(4) });
        if (k in t) return t[k];
        return () => {
          if (DRAW.has(k)) draws.set(canvas, (draws.get(canvas) ?? 0) + 1);
        };
      },
      set(t, k, v) {
        t[k] = v;
        return true;
      },
    });
    this.__ctx = ctx;
    return ctx;
  };

  // Observers.
  const observed = new Set();
  class RO {
    constructor(cb) { this.cb = cb; this.entries = new Set(); }
    observe(el) { const e = { el, ro: this, last: null }; this.entries.add(e); observed.add(e); }
    unobserve(el) { for (const e of this.entries) if (e.el === el) { this.entries.delete(e); observed.delete(e); } }
    disconnect() { for (const e of this.entries) observed.delete(e); this.entries.clear(); }
  }
  class IO {
    constructor(cb) { this.cb = cb; }
    observe(el) { setTimeout(() => this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }]), 0); }
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = globalThis.ResizeObserver = RO;
  window.IntersectionObserver = globalThis.IntersectionObserver = IO;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // The layout model reads computed styles, where jsdom leaves var() unresolved: resolve the inline ones, as a browser does.
  function resolveInlineVars() {
    for (const el of [...doc.querySelectorAll("[style]")].filter((e) => e.getAttribute("style").includes("var("))) {
      const custom = (name) => {
        for (let n = el; n && n.style; n = n.parentElement) {
          const v = n.style.getPropertyValue(name);
          if (v) return v;
        }
        return tokenMap[name];
      };
      const resolve = (text) => text.replace(/var\((--[\w-]+)\)/g, (_, n) => resolve(custom(n) ?? ""));
      // jsdom's style object drops a var() height, so read it from the attribute.
      const h = /(?:^|;)\s*height:\s*([^;]+)/.exec(el.getAttribute("style") ?? "")?.[1]?.trim();
      if (h && h.includes("var(")) el.style.height = resolve(h);
    }
    // compare.css: .chart-figure { --chart-stage-height: var(--figure-height) } for the chart inside it.
    for (const fig of doc.querySelectorAll(".chart-figure")) {
      const h = fig.style.getPropertyValue("--figure-height");
      const holder = fig.querySelector('[role="img"]');
      if (holder && h) holder.style.height = h;
    }
  }
  // Let React and timers run, then deliver ResizeObserver notifications for
  // sizes that changed, until nothing changes. A loop that never ends is a fault.
  async function settle(label) {
    for (let round = 0; round < 40; round++) {
      await sleep(30);
      resolveInlineVars();
      layout.run();
      const fire = [];
      for (const e of observed) {
        if (!e.el.isConnected) continue;
        const s = layout.sizeOf(e.el);
        if (!e.last || e.last.w !== s.w || e.last.h !== s.h) {
          e.last = { w: s.w, h: s.h };
          fire.push(e);
        }
      }
      if (fire.length === 0 && round > 2) return;
      const byRo = new Map();
      for (const e of fire) byRo.set(e.ro, [...(byRo.get(e.ro) ?? []), { target: e.el, contentRect: { width: e.last.w, height: e.last.h } }]);
      for (const [ro, entries] of byRo) ro.cb(entries, ro);
    }
    logs.push(`error: ${label}: sizes still changing after 40 rounds (resize feedback loop)`);
  }

  /** The rows of the open or closed sources table of the chart on the stage: [group, covers, basis, source cell]. */
  const sourceRows = () =>
    [...doc.querySelectorAll(".chart-card .sources__table tbody tr")].map((tr) => {
      const cells = [...tr.querySelectorAll("td")];
      return { group: cells[0]?.textContent ?? "", covers: cells[1]?.textContent ?? "", basis: cells[2]?.textContent ?? "", cell: cells[3] };
    });

  // Mount the real entry point.
  await import(pathToFileURL(path.resolve(bundle)).href);
  await settle("load");

  function chartState(box) {
    const canvases = [...box.querySelectorAll("canvas")];
    const alert = box.querySelector('[role="alert"]');
    return {
      box: layout.sizeOf(box),
      canvases: canvases.map((c) => ({ w: c.width, h: c.height, draws: draws.get(c) ?? 0 })),
      alert: alert ? alert.textContent : null,
    };
  }

  // The intake shows first; an example chip opens a scenario, and with it the three charts.
  const chip = doc.querySelector("button.chip");
  if (!chip) {
    console.log("FAIL no example chip on the page");
    process.exit(1);
  }
  chip.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await settle("open example");
  await sleep(400);
  await settle("after example");

  // The page shows one chart at a time (spec 4.1): drive each slide with the Next arrow, in registry order.
  const click = (el) => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  if (process.argv.includes("--sources-real")) {
    // One row of data given a real address: its link follows it, with no code change (spec 15.10 acceptance 6).
    let bad = 0;
    const check = (ok, what) => {
      if (!ok) bad++;
      console.log(`${ok ? "PASS" : "FAIL"} ${what}`);
    };
    const details = doc.querySelector(".chart-card details.sources");
    details.open = true;
    const rows = sourceRows();
    const comparator = rows.find((r) => r.group.startsWith("Today:"));
    const others = rows.find((r) => r.group === "Other Today options");
    const hrefs = (r) => [...(r?.cell?.querySelectorAll("a") ?? [])].map((a) => a.getAttribute("href"));
    check(hrefs(comparator).length > 0 && hrefs(comparator).every((h) => h.startsWith(REAL_PREFIX)), `the comparator row's links follow the data: ${JSON.stringify(hrefs(comparator))}`);
    check(!(comparator?.cell?.textContent ?? "").includes("placeholder, no source yet"), "the comparator row drops \"placeholder, no source yet\" for a real address");
    check(hrefs(others).length > 0 && (others?.cell?.textContent ?? "").includes("placeholder, no source yet"), "a row whose addresses are still placeholders keeps the words");
    const errs = logs.filter((l) => !/Not implemented/.test(l) && (l.startsWith("error:") || l.startsWith("window error:")));
    check(errs.length === 0, `no console errors (${errs.length})`);
    console.log(bad === 0 ? "ALL OK" : `FAILED: ${bad}`);
    window.close();
    process.exit(bad === 0 ? 0 : 1);
  }
  if (process.argv.includes("--reload")) {
    // Opened on the speed view's address: C10 is in focus, the speed option is the checked one, the invented-data line is shown.
    let bad = 0;
    const check = (ok, what) => {
      if (!ok) bad++;
      console.log(`${ok ? "PASS" : "FAIL"} ${what}`);
    };
    const checked = [...doc.querySelectorAll('.c10-switch input[type="radio"]')].find((r) => r.checked);
    check(/(?:^|[#&])slide=C10(?:&|$)/.test(window.location.hash), `the address still names C10: ${window.location.hash}`);
    check(checked?.value === "speed", `the checked switch option is "${checked?.value}", expected "speed"`);
    check(/(?:^|&)c10=speed/.test(window.location.hash), "the address keeps c10=speed");
    check(sourceRows().some((r) => r.covers.includes("Invented speeds and batch or flex prices") && r.basis === "Modelled"), "the speed view's table lists the invented rows as modelled");
    check((doc.querySelector(".chart-source")?.textContent ?? "").includes("invented placeholder data"), "the source line says invented placeholder data");
    const state = chartState(doc.querySelector(".chart-card"));
    check(state.canvases.length > 0 && state.canvases.every((c) => c.w > 0 && c.h > 0 && c.draws > 0) && !state.alert, `the chart is drawn: ${JSON.stringify(state)}`);
    const errs = logs.filter((l) => !/Not implemented/.test(l) && (l.startsWith("error:") || l.startsWith("window error:")));
    check(errs.length === 0, `no console errors (${errs.length})`);
    console.log(bad === 0 ? "ALL OK" : `FAILED: ${bad}`);
    window.close();
    process.exit(bad === 0 ? 0 : 1);
  }
  const slideId = () => /(?:^|[#&])slide=([^&]+)/.exec(window.location.hash)?.[1] ?? null;
  let failed = 0;
  const stage = {};
  const drawn = (s) => !!s && !s.alert && s.canvases.length > 0 && s.canvases.every((c) => c.w > 0 && c.h > 0 && c.draws > 0);
  /** Reads the one chart on the stage: exactly one card, and its state. */
  const readSlide = (id) => {
    const cards = [...doc.querySelectorAll(".chart-card")];
    if (cards.length !== 1) {
      failed++;
      console.log(`FAIL ${id}: expected one chart card on the stage, found ${cards.length}`);
    }
    if (slideId() !== id) {
      failed++;
      console.log(`FAIL ${id}: the address names slide ${slideId()}`);
    }
    return cards[0] ? chartState(cards[0]) : null;
  };
  /**
   * The benefit boxes of the chart on the stage (spec 6.4, 14.3): one to three, each with a printed number that is not
   * zero, a label and a comparator line, the caption kept as the accessible name, and no shadow or round corner.
   * Returns what is wrong, and the comparator names, so a later step can compare them with the selector.
   */
  const readBoxes = (id) => {
    const slot = doc.querySelector('[data-slot="benefit-boxes"]');
    const items = slot ? [...slot.querySelectorAll("li.benefit-box")] : [];
    const problems = [];
    if (items.length < 1 || items.length > 3) problems.push(`${items.length} boxes`);
    const comparators = [];
    for (const li of items) {
      const [v, l, c] = [".benefit-box__value", ".benefit-box__label", ".benefit-box__comparator"].map(
        (q) => li.querySelector(q)?.textContent?.trim() ?? "",
      );
      if (!/[1-9]/.test(v)) problems.push(`value "${v}"`);
      if (!l) problems.push("a box has no label");
      if (!/^vs \S/.test(c)) problems.push(`comparator "${c}"`);
      comparators.push(c.replace(/^vs /, ""));
    }
    const group = slot?.querySelector('[role="group"]');
    const labelledBy = group?.getAttribute("aria-labelledby");
    if (!(labelledBy && doc.getElementById(labelledBy)?.textContent?.trim())) problems.push("the caption is not the accessible name");
    for (const el of slot ? [...slot.querySelectorAll("*")] : []) {
      const cs = window.getComputedStyle(el);
      if (cs.boxShadow && cs.boxShadow !== "none") problems.push(`box-shadow ${cs.boxShadow} on ${el.className || el.tagName}`);
      if (cs.borderRadius && !/^(0|0px|2px)$/.test(cs.borderRadius)) problems.push(`border-radius ${cs.borderRadius} on ${el.className || el.tagName}`);
    }
    const boxFailed = problems.length > 0;
    if (boxFailed) failed++;
    console.log(`${boxFailed ? "FAIL" : "PASS"} ${id} benefit boxes: ${items.length} shown${boxFailed ? `; ${problems.join("; ")}` : ""}`);
    return comparators;
  };
  /**
   * Spec 15.10 and 15.11 on the chart on the stage, from the mounted page: no dashed or dotted border and no badge on any element
   * of the card; the sources disclosure closed on load, between the canvas and the source line, with its summary text; opened,
   * the four headings and a row per non-measured group, every link read from a data row and followed by the placeholder words
   * exactly when its address is the placeholder; and no provenance word outside the disclosure.
   */
  const chartRules = (id) => {
    const card = doc.querySelector(".chart-card");
    const problems = [];
    if (!card) return;
    if (card.querySelector(".prov-badge, .chart-notes__badges")) problems.push("a provenance badge");
    for (const el of card.querySelectorAll("*")) {
      const cs = window.getComputedStyle(el);
      for (const side of ["top", "right", "bottom", "left"]) {
        const style = cs.getPropertyValue(`border-${side}-style`);
        if (style === "dashed" || style === "dotted") problems.push(`${style} border-${side} on ${el.className || el.tagName}`);
      }
    }
    const details = [...card.querySelectorAll("details.sources")];
    if (details.length !== 1) problems.push(`${details.length} disclosures`);
    const d = details[0];
    if (d) {
      if (d.open) problems.push("the disclosure is open on load");
      if (d.querySelector("summary")?.textContent !== "Where these numbers come from") problems.push(`the summary reads "${d.querySelector("summary")?.textContent}"`);
      const canvas = card.querySelector('[role="img"]');
      const source = card.querySelector(".chart-source");
      const before = (a, b) => !!a && !!b && !!(a.compareDocumentPosition(b) & window.Node.DOCUMENT_POSITION_FOLLOWING);
      if (!before(canvas, d) || !before(d, source)) problems.push("the disclosure is not between the canvas and the source line");
      d.open = true;
      const heads = [...d.querySelectorAll("thead th")].map((th) => th.textContent);
      if (heads.join("|") !== "Bar or group|Covers|Basis|Source") problems.push(`headings [${heads.join(", ")}]`);
      const rows = sourceRows();
      if (rows.length === 0) problems.push("no rows");
      for (const r of rows) {
        const links = [...r.cell.querySelectorAll("a")];
        if (r.basis === "Vendor-reported" && !links.every((a) => DATA_ADDRESSES.has(a.getAttribute("href")))) problems.push(`a link in "${r.group}" is not an address of a data row`);
        const placeholders = links.filter((a) => new URL(a.getAttribute("href")).hostname.endsWith(".invalid")).length;
        const noted = r.cell.querySelectorAll(".sources__note").length;
        if (r.basis === "Vendor-reported" && placeholders !== noted) problems.push(`"${r.group}": ${noted} placeholder notes for ${placeholders} placeholder links`);
        if (r.basis === "Modelled" && links.length > 0) problems.push(`a modelled row "${r.group}" carries a link`);
      }
      d.open = false;
    }
    const copy = card.cloneNode(true);
    for (const el of copy.querySelectorAll(".sources, .sr-only")) el.remove();
    if (/vendor[-_ ]reported|modelled/i.test(copy.textContent ?? "")) problems.push("a provenance word outside the disclosure");
    if (problems.length > 0) failed++;
    console.log(`${problems.length > 0 ? "FAIL" : "PASS"} ${id} chart rules (spec 15.10, 15.11)${problems.length > 0 ? `: ${problems.join("; ")}` : ""}`);
  };
  /**
   * Spec 15.11 acceptance 8: the computed background of every chart container, thumbnail and grid tile is `--color-bg` or
   * `--color-surface`. The ground of a chart is the first ancestor with a background of its own; one with none lets the page's
   * show through, which is the body's.
   */
  const toHex = (rgb) => {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(rgb);
    if (!m || (m[4] !== undefined && Number(m[4]) === 0)) return null;
    return "#" + [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("");
  };
  const groundOf = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const hex = toHex(window.getComputedStyle(n).backgroundColor);
      if (hex) return hex;
    }
    return null;
  };
  const groundRules = (label) => {
    const allowed = [AZURE_TOKENS["--color-bg"], AZURE_TOKENS["--color-surface"]];
    const holders = [...doc.querySelectorAll('[role="img"]')];
    const wrong = holders.map((h) => [h, groundOf(h)]).filter(([, g]) => !allowed.includes(g));
    const ok = holders.length > 0 && wrong.length === 0;
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"} ${label}: ${holders.length} chart containers sit on --color-bg or --color-surface${wrong.length ? `; on ${wrong.map(([, g]) => g).join(", ")}` : ""}`);
  };
  /** Spec 15.12 acceptance 1 and 14.3 acceptance 1: every colour token of 14.1 read from the page's computed styles equals its Azure table value. */
  const tokenRules = () => {
    const cs = window.getComputedStyle(doc.documentElement);
    const wrong = Object.entries(AZURE_TOKENS)
      .filter(([name, want]) => cs.getPropertyValue(name).trim().toLowerCase() !== want)
      .map(([name, want]) => `${name} is "${cs.getPropertyValue(name).trim()}", the table says ${want}`);
    const missing = Object.keys(AZURE_TOKENS).length < 20;
    if (wrong.length > 0 || missing) failed++;
    console.log(`${wrong.length > 0 || missing ? "FAIL" : "PASS"} colour tokens: ${Object.keys(AZURE_TOKENS).length} read from the computed styles${wrong.length > 0 ? `; ${wrong.join("; ")}` : ""}`);
  };
  for (let i = 0; i < IDS.length; i++) {
    if (i > 0) {
      const next = doc.querySelector('button[aria-label="Next chart"]');
      if (!next) {
        failed++;
        console.log("FAIL no Next chart button");
        break;
      }
      click(next);
      await settle(`next to ${IDS[i]}`);
      await sleep(300);
      await settle(`after next to ${IDS[i]}`);
    }
    stage[IDS[i]] = readSlide(IDS[i]);
    readBoxes(IDS[i]);
    chartRules(IDS[i]);
    groundRules(`${IDS[i]} stage`);
  }
  tokenRules();
  {
    // The grid view's thumbnails: open it, read the grounds, close it again.
    const gridButton = doc.querySelector("button.stage__grid-button");
    if (gridButton) {
      click(gridButton);
      await settle("grid view");
      groundRules("grid view tiles");
      click(gridButton);
      await settle("grid view closed");
    }
  }
  for (const id of IDS) {
    const pass = drawn(stage[id]);
    if (!pass) failed++;
    console.log(`${pass ? "PASS" : "FAIL"} ${id}: ${JSON.stringify(stage[id])}`);
  }

  // C10 (the last slide here): the switch changes the view, the address follows, and the speed view carries its provenance notes (spec 6.3).
  {
    const radios = [...doc.querySelectorAll('.c10-switch input[type="radio"]')];
    const quality = radios.find((r) => r.value === "quality");
    const speed = radios.find((r) => r.value === "speed");
    const ok = (cond, what) => {
      if (!cond) failed++;
      console.log(`${cond ? "PASS" : "FAIL"} C10 ${what}`);
    };
    ok(radios.length === 2 && quality?.checked && speed && !speed.disabled, "opens on quality, with the speed option enabled");
    ok(!/c10=/.test(window.location.hash), `the default view is not in the address (${window.location.hash})`);
    ok(!sourceRows().some((r) => r.covers.includes("Invented speeds and batch or flex prices")), "the quality view lists no invented rows");
    if (speed) {
      click(speed);
      await settle("c10 speed");
      await sleep(300);
      await settle("after c10 speed");
      ok(/(?:^|&)c10=speed/.test(window.location.hash), `the address has c10=speed (${window.location.hash})`);
      ok(sourceRows().some((r) => r.covers.includes("Invented speeds and batch or flex prices") && r.basis === "Modelled"), "the speed view's table lists the invented rows as modelled");
      ok((doc.querySelector(".chart-source")?.textContent ?? "").includes("invented placeholder data"), "the speed view's source line says invented placeholder data");
      ok(drawn(chartState(doc.querySelector(".chart-card"))), "the speed view draws a canvas");
      click(doc.querySelector('.c10-switch input[value="quality"]'));
      await settle("c10 quality");
      await sleep(300);
      await settle("after c10 quality");
      ok(!/c10=/.test(window.location.hash), `switching back clears c10 (${window.location.hash})`);
      ok(drawn(chartState(doc.querySelector(".chart-card"))), "the quality view draws a canvas again");
    }
  }

  // The "Compared with" selector sits in the comparator slot, and picking another comparator changes the figures (spec 4.1, 6.1).
  const select = doc.querySelector('[data-slot="comparator"] select');
  if (!select) {
    failed++;
    console.log("FAIL no Compared with select in the comparator slot");
  } else {
    const before = doc.querySelector(".chart-card__caption")?.textContent ?? "";
    const other = [...select.options].find((o) => o.value !== select.value);
    select.value = other.value;
    select.dispatchEvent(new window.Event("change", { bubbles: true }));
    await settle("comparator change");
    await sleep(400);
    await settle("after comparator change");
    const after = doc.querySelector(".chart-card__caption")?.textContent ?? "";
    const hashed = decodeURIComponent(window.location.hash).includes(`cmp=${other.value}`);
    const ok = after !== before && hashed;
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"} comparator: ${select.value} chosen; caption changed: ${after !== before}; address has cmp: ${hashed}`);
    // Every chart still draws under the new comparator. The stage is on the last chart, so Next wraps to the first.
    for (let i = 0; i < IDS.length; i++) {
      click(doc.querySelector('button[aria-label="Next chart"]'));
      await settle(`next to ${IDS[i]} under the new comparator`);
      await sleep(300);
      await settle(`after next to ${IDS[i]} under the new comparator`);
      const state = readSlide(IDS[i]);
      const pass = drawn(state);
      if (!pass) failed++;
      console.log(`${pass ? "PASS" : "FAIL"} ${IDS[i]} under the new comparator`);
      // Every box names the comparator the selector now shows.
      const chosen = select.options[select.selectedIndex].textContent;
      const names = readBoxes(`${IDS[i]} (new comparator)`);
      const named = names.length > 0 && names.every((n) => n && chosen.includes(n));
      if (!named) failed++;
      console.log(`${named ? "PASS" : "FAIL"} ${IDS[i]} boxes name "${chosen}": ${JSON.stringify(names)}`);
    }
  }
  const messages = logs.filter((l) => !/Not implemented/.test(l));
  console.log(`console errors and warnings: ${messages.length}`);
  for (const l of messages.slice(0, 3)) console.log(`  ${l.slice(0, 300)}`);
  const bad = messages.some((l) => l.startsWith("error:") || l.startsWith("window error:"));
  if (bad) failed++;
  console.log(failed === 0 ? "ALL OK" : `FAILED: ${failed}`);
  window.close();
  process.exit(failed === 0 ? 0 : 1);
}

if (process.argv[2] === "--child") await child(process.argv[3]);
else await parent();
