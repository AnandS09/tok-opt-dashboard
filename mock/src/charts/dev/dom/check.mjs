/**
 * Development check, not part of the app (the app never imports it): mounts
 * the real app in a DOM, opens the first example and confirms that C1, C5 and
 * C3 each draw a non-empty canvas with a non-zero size.
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
 * It runs the app twice: once as it is (must pass), once with a fault put
 * into C3's option builder by a transform (must fail), so a pass is never vacuous.
 * Exit code 0 only when the first passes and the second fails.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../..");
const IDS = ["C1", "C5", "C3"];
// The page lists the charts in registry order.

// ---------------------------------------------------------------------------
// Parent: build the app twice, run each build in a child process
// ---------------------------------------------------------------------------

/** The first statements of C3's option builder: the fault is put in front of them. */
const FAULT_SITE = "const cmp = comparisonOf(results);\n  const sides = sidesOf(cmp);\n  const rows = shownRows(results, cmp);";

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

async function buildApp(outFile, withFault) {
  const { build } = await import(pathToFileURL(path.join(root, "node_modules/vite/dist/node/index.js")).href);
  const mutation = {
    name: "put-a-fault-in-c3",
    enforce: "pre",
    transform(code, id) {
      if (!withFault || !id.endsWith("charts/c3CostPerMtok.tsx")) return null;
      if (!code.includes(FAULT_SITE)) throw new Error("check.mjs: C3's option builder changed; update FAULT_SITE in check.mjs");
      return { code: code.replace(FAULT_SITE, `throw new Error("negative control");\n  ${FAULT_SITE}`), map: null };
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
    for (const [name, withFault] of [["as-is", false], ["fault-in-c3", true]]) {
      const out = path.join(tmp, `${name}.mjs`);
      await buildApp(out, withFault);
      const run = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--child", out], {
        env: { ...process.env, DOM_CHECK_JSDOM: jsdom },
        encoding: "utf8",
      });
      outcomes[name] = run;
      console.log(`--- ${name} (exit ${run.status})\n${run.stdout}${run.stderr && !run.stdout ? run.stderr : ""}`);
    }
    const good = outcomes["as-is"].status === 0;
    const controlRed = outcomes["fault-in-c3"].status === 1;
    console.log(`as-is passes: ${good ? "yes" : "NO"}; negative control fails: ${controlRed ? "yes" : "NO"}`);
    console.log(good && controlRed ? "ALL OK" : "FAILED");
    process.exit(good && controlRed ? 0 : 1);
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

  const dom = new JSDOM('<!doctype html><html lang="en"><head><title>t</title></head><body><div id="root"></div></body></html>', {
    url: "http://localhost:5173/",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const doc = window.document;

  // jsdom drops clamp() declarations and does not resolve var(), so both are
  // evaluated here, with the viewport below, before the text becomes a <style>.
  const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "");
  const tokensText = strip(fs.readFileSync(path.join(root, "src/styles/tokens.css"), "utf8"));
  const compareText = strip(fs.readFileSync(path.join(root, "src/styles/compare.css"), "utf8"));
  const tokenMap = {};
  for (const text of [tokensText, compareText]) {
    const block = /:root\s*\{([\s\S]*?)\n\}/.exec(text)[1];
    for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) tokenMap[m[1]] = m[2].trim();
  }
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
  for (const f of ["tokens.css", "app.css", "compare.css"]) {
    const style = doc.createElement("style");
    style.textContent = evalClamp(resolveVars(strip(fs.readFileSync(path.join(root, "src/styles", f), "utf8"))));
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
    const body = fs.readFileSync(file, "utf8");
    return { ok: true, status: 200, statusText: "OK", text: async () => body, json: async () => JSON.parse(body), headers: { get: () => null } };
  };

  // Element sizes from the layout model.
  const layout = makeLayout(window);
  const HE = window.HTMLElement.prototype;
  const dims = (el) => {
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
    for (const el of doc.querySelectorAll('[style*="var("]')) {
      const custom = (name) => {
        for (let n = el; n && n.style; n = n.parentElement) {
          const v = n.style.getPropertyValue(name);
          if (v) return v;
        }
        return tokenMap[name];
      };
      const resolve = (text) => text.replace(/var\((--[\w-]+)\)/g, (_, n) => resolve(custom(n) ?? ""));
      const h = el.style.height;
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

  const cards = [...doc.querySelectorAll(".chart-card")];
  const stage = Object.fromEntries(cards.map((card, i) => [IDS[i] ?? `#${i}`, chartState(card)]));
  const drawn = (s) => !!s && !s.alert && s.canvases.length > 0 && s.canvases.every((c) => c.w > 0 && c.h > 0 && c.draws > 0);
  let failed = 0;
  if (cards.length !== IDS.length) {
    failed++;
    console.log(`FAIL expected ${IDS.length} chart cards, found ${cards.length}`);
  }
  for (const id of IDS) {
    const pass = drawn(stage[id]);
    if (!pass) failed++;
    console.log(`${pass ? "PASS" : "FAIL"} ${id}: ${JSON.stringify(stage[id])}`);
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
