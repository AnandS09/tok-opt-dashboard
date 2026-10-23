// Measured-render checks and screenshots for the v0.4 intake (spec 15.1 to 15.5, 15.13).
//
// A headless Chrome is driven over the DevTools protocol (Node 22's built-in WebSocket, no
// dependencies). Every acceptance item below reads computed styles, bounding boxes or text from
// the running page, so it is a measurement and not a reading of the source. From mock/:
//
//   npx vite --port 5391 --strictPort --host 127.0.0.1 &        # the dev server (stop it afterwards)
//   node docs/build-v04/intake/drive.mjs http://127.0.0.1:5391/ [--shots]
//
// Exit code 0 only if every check passes. With --shots the screenshots are written next to this file.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, "../../../public/data/scenarios");
const base = process.argv[2];
const SHOTS = process.argv.includes("--shots");
if (!base) throw new Error("usage: node drive.mjs <baseUrl> [--shots]");

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9500 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-intake-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--hide-scrollbars",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ],
  { stdio: "ignore" },
);

/**
 * The scenario file the page starts from. "odd" is S1 with every field the intake does not ask for
 * changed: team size, budget, customers, speed, how the company buys, hardware tiers, quality floor,
 * named models and unit.
 */
function scenarioJson(name) {
  if (name !== "odd") return fs.readFileSync(path.join(dataDir, `${name}.json`), "utf8");
  const s = JSON.parse(fs.readFileSync(path.join(dataDir, "s1.json"), "utf8"));
  Object.assign(s.scenario, {
    baseline: { users: 9999, budget_usd_per_quarter: 7000000, customers: 3 },
    named_models: ["opus", "fable"],
    tiers_allowed: ["h100"],
    quality_floor: 80,
    unit: "workflows",
    latency_class: "batch",
    stage_today: "seats",
  });
  return JSON.stringify(s);
}

// A run that stops on an error must not leave a browser behind.
process.on("exit", () => {
  try {
    chrome.kill("SIGKILL");
    fs.rmSync(profile, { recursive: true, force: true });
  } catch {
    /* already gone */
  }
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function connect() {
  for (let i = 0; i < 100; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = targets.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await sleep(100);
  }
  throw new Error("chrome did not start");
}

const ws = new WebSocket(await connect());
await new Promise((r) => (ws.onopen = r));
let nextId = 0;
const pending = new Map();
const pageErrors = [];
let intercept = null; // scenario file served in place of s1.json, or null
ws.onmessage = async (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (msg.method === "Runtime.exceptionThrown") {
    pageErrors.push(msg.params.exceptionDetails.text + " " + (msg.params.exceptionDetails.exception?.description ?? ""));
  } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    pageErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(" "));
  } else if (msg.method === "Fetch.requestPaused") {
    const { requestId, request } = msg.params;
    if (intercept && /scenarios\/s1\.json/.test(request.url)) {
      const body = Buffer.from(scenarioJson(intercept)).toString("base64");
      send("Fetch.fulfillRequest", {
        requestId,
        responseCode: 200,
        responseHeaders: [{ name: "Content-Type", value: "application/json" }],
        body,
      }).catch(() => {});
    } else {
      send("Fetch.continueRequest", { requestId }).catch(() => {});
    }
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, (msg) => (msg.error ? reject(new Error(method + ": " + msg.error.message)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error("eval: " + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text) + "\n" + expression);
  return r.result.value;
};
const waitFor = async (expression, label, ms = 15000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await evaluate(expression)) return;
    await sleep(50);
  }
  throw new Error("timeout waiting for " + label);
};

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------
const results = [];
function check(id, ok, detail = "") {
  results.push({ id, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${id}${detail ? "  " + detail : ""}`);
}
const near = (a, b, tol = 0.6) => Math.abs(a - b) <= tol;

// ---------------------------------------------------------------------------
// Page helpers
// ---------------------------------------------------------------------------
let view = { w: 0, h: 0, dpr: 1 };
async function setViewport(w, h = 1500, dpr = 1) {
  view = { w, h, dpr };
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: dpr, mobile: w < 600 });
}

const HELPERS = `
  window.__r = (el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  window.__q = (s, root) => (root || document).querySelector(s);
  window.__qa = (s, root) => [...(root || document).querySelectorAll(s)];
  window.__cs = (el, p) => getComputedStyle(el)[p];
  window.__choice = (text) => __qa('.choices .choice').find((e) => e.querySelector('.choice__label') && e.querySelector('.choice__label').textContent.trim() === text);
`;

async function open(w, { scenario = null, dpr = 1, h = 1500 } = {}) {
  intercept = scenario;
  await setViewport(w, h, dpr);
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Page.navigate", { url: base });
  await waitFor(`!!document.querySelector(".intake .choice")`, "the first question");
  await evaluate(HELPERS);
  await evaluate("document.fonts.ready.then(() => true)");
  await sleep(150);
}

const TITLES = {
  company: "What kind of company are you?",
  work: "What do you use AI for?",
  users: "How many people on your team will use AI?",
  customers: "How many customers use your AI?",
  budget: "What is your AI budget each quarter?",
  speed: "How fast do answers need to come back?",
};
const titleIs = (t) => waitFor(`__q('.intake__title') && __q('.intake__title').textContent === ${JSON.stringify(t)}`, "title " + t);
async function chooseCompany(name, nextStep = "work") {
  await evaluate(`__choice(${JSON.stringify(name)}).click()`);
  await titleIs(TITLES[nextStep]);
}
async function cont(nextStep) {
  await evaluate(`__q('.intake__nav .button--primary').click()`);
  await titleIs(TITLES[nextStep]);
}
async function key(k, code, vk) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk });
}
async function typeValue(text) {
  // Blur first: focusing a field that already has focus would not select its text again.
  await evaluate(`__q('.lv__input').blur(); __q('.lv__input').focus()`);
  await send("Input.insertText", { text });
  await key("Enter", "Enter", 13);
  await sleep(60);
}
const readout = () => evaluate(`__q('.lv__input').value`);
const rangeValueText = () => evaluate(`__q('.lv__range').getAttribute('aria-valuetext')`);

/** Walks a company type through to the step `to`, leaving the first-seen defaults on every slider. */
const PATHS = {
  "Software or internet company": ["work", "users", "customers", "budget", "speed"],
  "AI-first startup": ["work", "customers", "budget", "speed"],
};
async function walkTo(company, to) {
  const steps = PATHS[company];
  await chooseCompany(company, steps[0]);
  for (let i = 0; i < steps.indexOf(to); i++) await cont(steps[i + 1]);
}

async function shot(name, selector) {
  if (!SHOTS || (view.w !== 1280 && view.w !== 390)) return;
  const box = await evaluate(`(() => { const e = __q(${JSON.stringify(selector)}); e.scrollIntoView({ block: "start" }); const r = __r(e); return { x: r.l + scrollX, y: r.t + scrollY, w: r.w, h: r.h }; })()`);
  await sleep(250);
  const { data } = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: Math.max(0, box.x - 12), y: Math.max(0, box.y - 12), width: Math.min(view.w, box.w + 24), height: box.h + 24, scale: 1 },
  });
  const file = `${view.w}-${name}.png`;
  // Only the two board widths are kept as screenshots.
  if (view.w !== 1280 && view.w !== 390) return;
  fs.writeFileSync(path.join(here, file), Buffer.from(data, "base64"));
  console.log("saved", file);
}

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};
const HUES = ["#316a23", "#cc675c", "#736dc3", "#883871"].map(rgb);

await send("Page.enable");
await send("Runtime.enable");
await send("Fetch.enable", { patterns: [{ urlPattern: "*scenarios/s1.json*" }] });

// ===========================================================================
// 15.1 R-1 and 15.13: step 1, the six rows, at the three test widths
// ===========================================================================
for (const w of [375, 390, 768, 1280]) {
  await open(w, { dpr: w < 600 ? 2 : 1 });
  const rows = await evaluate(`__qa('.choices .choice').map((e) => ({
    tag: e.tagName, href: e.getAttribute('href'), last: e === __qa('.choices .choice').at(-1),
    icons: __qa('svg', e).length,
    icon: (() => { const i = __q('svg.choice__icon', e); if (!i) return null; const r = __r(i); const cs = getComputedStyle(i); return { w: r.w, h: r.h, l: r.l, stroke: cs.stroke, sw: cs.strokeWidth, hidden: i.getAttribute('aria-hidden') }; })(),
    label: (() => { const l = __q('.choice__label', e); return { l: __r(l).l, weight: __cs(l, 'fontWeight'), text: l.textContent.trim() }; })(),
    hint: (() => { const l = __q('.choice__hint', e); return l ? { l: __r(l).l, text: l.textContent.trim() } : null; })(),
    box: __r(e), cols: __cs(e, 'gridTemplateColumns')
  }))`);
  const five = rows.slice(0, 5);
  const six = rows[5];
  check(`15.1(1) @${w} the sixth row holds one icon equal to the five (size, stroke width, stroke colour)`,
    rows.length === 6 && six.icons === 1 && five.every((r) => r.icon && near(r.icon.w, six.icon.w, 0.01) && near(r.icon.h, six.icon.h, 0.01) && r.icon.sw === six.icon.sw && r.icon.stroke === six.icon.stroke),
    `${six.icon && `${six.icon.w}x${six.icon.h} stroke ${six.icon.sw} ${six.icon.stroke}`}`);
  check(`15.1(2) @${w} icon, label, hint and arrow column share the other rows' edges`,
    five.every((r) => near(r.icon.l, six.icon.l, 0.5) && near(r.label.l, six.label.l, 0.5) && near(r.hint.l, six.hint.l, 0.5) && near(r.box.l, six.box.l, 0.5) && near(r.box.r, six.box.r, 0.5) && r.cols === six.cols),
    `row columns ${six.cols}`);
  check(`15.1(3) @${w} label weight equals the others; hint text exact`,
    five.every((r) => r.label.weight === six.label.weight) && six.hint.text === "Cloud or GPU provider: talk to us about selling through InfraVana" && six.label.text === "I sell AI compute",
    `weight ${six.label.weight}`);
  check(`15.1(4) / 4.3(3) @${w} every row has the same width, height and left edge`,
    rows.every((r) => near(r.box.w, rows[0].box.w, 0.5) && near(r.box.h, rows[0].box.h, 0.5) && near(r.box.l, rows[0].box.l, 0.5)),
    `${rows[0].box.w.toFixed(1)} x ${rows[0].box.h.toFixed(1)}`);
  check(`15.1(5) @${w} icon aria-hidden, row last, a link to the contact address`,
    six.icon.hidden === "true" && six.last && six.tag === "A" && six.href === "#contact", `${six.tag} ${six.href}`);
  await shot("step1-company", ".intake");
}

// ===========================================================================
// 15.2 R-2: the step label and the rule, both types, every step
// ===========================================================================
const sectionToken = async () => evaluate(`getComputedStyle(document.documentElement).getPropertyValue('--color-section').trim()`);
const labelState = () =>
  evaluate(`(() => { const l = __q('.intake__step'); const p = __q('.intake__progress'); const cs = getComputedStyle(l); return { text: l.firstChild.textContent, color: cs.color, value: p.value, max: p.max, h: __r(p).h }; })()`);
{
  await open(1280);
  const first = await labelState();
  check("15.2(1) before a type is chosen the label is exactly 'Step 1' with no 'of'", first.text === "Step 1" && !/of/.test(first.text), JSON.stringify(first.text));
  const seen = {};
  for (const company of Object.keys(PATHS)) {
    await open(1280);
    const steps = PATHS[company];
    await chooseCompany(company, steps[0]);
    const list = [];
    for (let i = 0; i < steps.length; i++) {
      list.push(await labelState());
      if (i < steps.length - 1) await cont(steps[i + 1]);
    }
    seen[company] = list;
  }
  const nOf = (company) => seen[company].length + 1; // plus the company step
  const nMax = Math.max(...Object.values(seen).map((l) => l.length + 1));
  check("15.2(2) after a type is chosen, step n (n >= 2) reads 'Step n of N' with N the number of steps of that type",
    Object.keys(seen).every((c) => seen[c].every((s, i) => s.text === `Step ${i + 2} of ${nOf(c)}`)),
    Object.keys(seen).map((c) => `${c}: ${seen[c].map((s) => s.text).join(" | ")}`).join("  //  "));
  check("15.2 N is 6 for a software company and 5 for an AI-first startup", nOf("Software or internet company") === 6 && nOf("AI-first startup") === 5);
  check("15.2(3) step 1: rule filled to 1/N_max; step n of N: n/N",
    near(first.value / first.max, 1 / nMax, 1e-9) && Object.keys(seen).every((c) => seen[c].every((s, i) => near(s.value / s.max, (i + 2) / nOf(c), 1e-9))),
    `step 1 ${first.value}/${first.max}, N_max ${nMax}`);
  const token = await sectionToken();
  const expected = await evaluate(`(() => { const p = document.createElement('i'); p.style.color = ${token ? `'var(--color-section)'` : `'var(--color-accent-strong)'`}; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; })()`);
  check(
    token ? "15.2(4) the label's computed colour is --color-section" : "15.2(4) PENDING MERGE: --color-section is not in tokens.css on this branch; the label uses the accent fallback",
    first.color === expected,
    `label ${first.color}, expected ${expected}${token ? "" : " (accent-strong)"}`,
  );
  check("15.2 open: the rule is 3px (board 02 README), not 2px (spec 14.3)", first.h === 3, `${first.h}px`);
  for (const w of [1280, 390]) {
    await open(w, { dpr: w < 600 ? 2 : 1 });
    await chooseCompany("Software or internet company");
    await shot("step2-work-software", ".intake");
  }
}

// ===========================================================================
// 15.3 R-3: the estimate
// ===========================================================================
const panel = () => evaluate(`!!__q('.estimate')`);
const figures = () =>
  evaluate(`(() => { const e = __q('.estimate'); if (!e) return null; return { dd: __qa('.estimate__figures dd', e).map((x) => x.textContent), dt: __qa('.estimate__figures dt', e).map((x) => x.textContent), basis: (__q('.estimate__basis', e) || {}).textContent || '' }; })()`);

async function typeStep(valueText) {
  await typeValue(valueText);
}

async function runIntake(company, answers) {
  // Types the same answers into whichever scenario the page started from; returns the panel at each step.
  const out = {};
  await chooseCompany(company, PATHS[company][0]);
  out.work = await panel();
  await cont(PATHS[company][1]);
  for (const step of PATHS[company].slice(1)) {
    out[step + "Panel"] = await panel();
    if (step === "users") {
      await typeStep(answers.users);
      await cont(PATHS[company][PATHS[company].indexOf(step) + 1]);
    } else if (step === "customers") {
      await typeStep(answers.customers);
      await cont(PATHS[company][PATHS[company].indexOf(step) + 1]);
    } else if (step === "budget") {
      await typeStep(answers.budget);
      out.budget = await figures();
      await cont("speed");
      out.speed = await figures();
      out.speedAnchor = await evaluate("1");
    }
  }
  return out;
}

{
  await open(1280);
  const software = "Software or internet company";
  const answers = { users: "120", customers: "200000", budget: "150000" };
  const run1 = await runIntake(software, answers);
  check("15.3(1) no estimate panel on step 2 or on the team and customer steps",
    run1.work === false && run1.usersPanel === false && run1.customersPanel === false, JSON.stringify({ work: run1.work, users: run1.usersPanel, customers: run1.customersPanel }));
  await open(1280);
  check("15.3(1) no estimate panel on step 1", (await panel()) === false);
  check("15.3(2) the budget step and the speed step show three figures and the 'Worked out from your answers' line with the head counts and kinds of work",
    [run1.budget, run1.speed].every((f) => f && f.dd.length === 3 && f.dt.join() === "Today,With InfraVana,You save" && f.basis.startsWith("Worked out from your answers:") && f.basis.includes("120 people") && f.basis.includes("200,000 customers") && f.basis.includes("5 kinds of work")),
    run1.budget && run1.budget.basis);
  check("15.3 the figures on the speed step equal those on the budget step (default speed until answered)", JSON.stringify(run1.budget) === JSON.stringify(run1.speed));

  // (3) independence: the same answers from three different starting scenarios (the page opens on s1; the file is swapped).
  const runs = {};
  const STARTS = ["s1", "hardware_heavy", "s2", "odd"];
  for (const start of STARTS) {
    await open(1280, { scenario: start === "s1" ? null : start });
    const r = await runIntake(software, answers);
    runs[start] = r.budget;
  }
  const same = (runsOf) => STARTS.every((s) => JSON.stringify(runsOf[s]) === JSON.stringify(runsOf.s1));
  check("15.3(3) the same answers give identical figures from S1, hardware_heavy, S2 and an odd start (other team size, budget, speed, tiers, floor, named models)",
    same(runs), JSON.stringify(STARTS.map((s) => runs[s].dd.join(" / "))));
  const aiRuns = {};
  for (const start of STARTS) {
    await open(1280, { scenario: start === "s1" ? null : start });
    const r = await runIntake("AI-first startup", { customers: "200000", budget: "150000" });
    aiRuns[start] = r.budget;
  }
  check("15.3(3) the same holds for the five-step type", same(aiRuns) && aiRuns.s1.basis.includes("200,000 customers") && !aiRuns.s1.basis.includes("people"), aiRuns.s1.basis);

  // (5) moving the budget leaves the figures unchanged
  await open(1280);
  await walkTo(software, "budget");
  const before = await figures();
  const afterMoves = [];
  for (let i = 0; i < 4; i++) {
    await evaluate(`__qa('.lv__mark')[${i}].click()`);
    await sleep(80);
    afterMoves.push(await figures());
  }
  await typeValue("20M");
  afterMoves.push(await figures());
  await evaluate(`(() => { const r = __q('.lv__range'); r.focus(); })()`);
  await key("ArrowRight", "ArrowRight", 39);
  afterMoves.push(await figures());
  check("15.3(5) moving the budget (four presets, a typed 20M, an arrow key) leaves the three figures unchanged",
    afterMoves.every((f) => f.dd.join() === before.dd.join()), `${before.dd.join(" / ")}`);

  // (6) placement
  for (const [w, label] of [[375, "above"], [390, "above"], [1280, "right"]]) {
    await open(w, { dpr: w < 600 ? 2 : 1 });
    await walkTo(software, "budget");
    const pos = await evaluate(`({ e: __r(__q('.estimate')), m: __r(__q('.intake__main')) })`);
    const ok = w < 600 ? pos.e.b <= pos.m.t + 0.5 : pos.e.l >= pos.m.r - 0.5;
    check(`15.3(6) @${w} the panel lies ${label} the question`, ok, `panel ${JSON.stringify([pos.e.l, pos.e.t, pos.e.r, pos.e.b].map(Math.round))} question ${JSON.stringify([pos.m.l, pos.m.t, pos.m.r, pos.m.b].map(Math.round))}`);
    await shot("step5-budget-software", ".intake");
  }
}

// ===========================================================================
// 15.4 R-4 and 5.1: presets on the team, customers and budget steps
// ===========================================================================
const sliderSteps = [
  ["users", "team", "Software or internet company"],
  ["customers", "customers", "Software or internet company"],
  ["budget", "budget", "Software or internet company"],
];
const mx = (a) => Math.max(...a);
for (const w of [375, 390, 768, 1280]) {
  for (const [step, name, company] of sliderSteps) {
    await open(w, { dpr: w < 600 ? 2 : 1 });
    await walkTo(company, step);
    const m = await evaluate(`(() => {
      const b = __qa('.lv__mark'); const t = __qa('.lv__tick'); const range = __q('.lv__range'); const rr = __r(range);
      return {
        buttons: b.map((e) => ({ r: __r(e), top: __cs(e, 'borderTopWidth'), topColor: __cs(e, 'borderTopColor'), color: __cs(e, 'color'), text: e.textContent, pressed: e.getAttribute('aria-pressed'), bl: __cs(e, 'borderLeftWidth'), bb: __cs(e, 'borderBottomWidth'), br: __cs(e, 'borderRightWidth'), blc: __cs(e, 'borderLeftColor'), weight: __cs(e, 'fontWeight'), check: !!__q('.lv__check', e), overflow: e.scrollWidth > e.clientWidth + 1 })),
        ticks: t.map((e) => ({ r: __r(e), bg: __cs(e, 'backgroundColor') })),
        range: rr, ink: getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim()
      };
    })()`);
    const bs = m.buttons;
    check(`15.4(1) @${w} ${name}: preset buttons are one row above the track, equal width and height`,
      bs.length === 4 && bs.every((b) => b.r.b <= m.range.t + 0.5 && near(b.r.t, bs[0].r.t, 0.5) && near(b.r.w, bs[0].r.w, 0.6) && near(b.r.h, bs[0].r.h, 0.6)),
      `${bs.length} buttons, ${bs[0].r.w.toFixed(1)} x ${bs[0].r.h.toFixed(1)}, row bottom ${mx(bs.map((b) => b.r.b)).toFixed(0)} <= track top ${m.range.t.toFixed(0)}`);
    check(`15.4(2) @${w} ${name}: each button's top border is 6px in the tick's colour; the four hues are green, coral, periwinkle, plum`,
      bs.every((b, i) => b.top === "6px" && b.topColor === m.ticks[i].bg && b.topColor === HUES[i]), bs.map((b) => b.topColor).join(" "));
    const f = await evaluate(`(() => { const t = __qa('.lv__tick').map((e) => parseFloat(e.style.left)); return t; })()`);
    const R = { users: [1, 1e4], customers: [1, 1e7], budget: [1e3, 1e8] }[step];
    const expectX = (v) => m.range.l + 11 + (Math.log(v / R[0]) / Math.log(R[1] / R[0])) * (m.range.w - 22);
    const presets = { users: [25, 50, 100, 500], customers: [10000, 50000, 200000, 1000000], budget: [1e4, 1e5, 1e6, 1e7] }[step];
    check(`15.4(3) @${w} ${name}: each tick's centre is at its preset's value on the log track, within 1px`,
      m.ticks.every((t, i) => near((t.r.l + t.r.r) / 2, expectX(presets[i]), 1)),
      m.ticks.map((t, i) => `${(((t.r.l + t.r.r) / 2) - expectX(presets[i])).toFixed(2)}`).join(" ") + " px off");
    const sel = bs.filter((b) => b.pressed === "true");
    const others = bs.filter((b) => b.pressed !== "true");
    check(`15.4(4) @${w} ${name}: value text in ink; the selected button alone has a 3px own-colour border, a check mark and a bold label`,
      bs.every((b) => b.color === rgb(inkHex(m.ink))) && sel.length === 1 && sel[0].bl === "3px" && sel[0].bb === "3px" && sel[0].br === "3px" && sel[0].blc === HUES[bs.indexOf(sel[0])] && sel[0].check && Number(sel[0].weight) >= 700 &&
        others.every((b) => b.bl === "1px" && !b.check && Number(b.weight) < 600),
      `ink ${m.ink}, selected ${sel.map((b) => b.text).join()}`);
    check(`15.4 @${w} ${name}: no preset label overflows its button`, bs.every((b) => !b.overflow), bs.map((b) => b.text).join(" | "));
  }
}
function inkHex(h) {
  return h.startsWith("#") ? h : "#1c1c1a";
}

// 5.1 acceptance (1) to (4) and (6), on the three steps
{
  await open(1280);
  await walkTo("Software or internet company", "users");
  // (1) a preset sets the exact preset value
  const expectPreset = { users: ["25", "50", "100", "500"], customers: ["10,000", "50,000", "200,000", "1,000,000"], budget: ["10,000", "100,000", "1,000,000", "10,000,000"] };
  const ok1 = [];
  for (const step of ["users", "customers", "budget"]) {
    for (let i = 0; i < 4; i++) {
      await evaluate(`__qa('.lv__mark')[${i}].click()`);
      await sleep(60);
      ok1.push((await readout()) === expectPreset[step][i]);
    }
    if (step !== "budget") await cont(step === "users" ? "customers" : "budget");
  }
  check("5.1(1) clicking a preset sets that exact value on the team, customers and budget steps (12 clicks)", ok1.every(Boolean), ok1.map(Number).join(""));
  // (6) typing 20M
  await typeValue("20M");
  check("5.1(6) typing '20M' in the budget field sets 20,000,000", (await readout()) === "20,000,000" && (await rangeValueText()) === "$20,000,000 a quarter", await rangeValueText());
  await typeValue("$1.5m");
  check("5.1 typing '$1.5m' sets 1,500,000", (await readout()) === "1,500,000", await readout());
  // typing out of range snaps
  await typeValue("999999999999");
  check("5.2(2) a value past the range snaps to the bound and says so", (await readout()) === "100,000,000" && /most this page models/.test(await evaluate(`__q('.lv__note').textContent`)), await evaluate(`__q('.lv__note').textContent`));
  // (2) typing 73 gives 73 on the team step
  await evaluate(`__qa('.intake__back')[0].click()`);
  await titleIs(TITLES.customers);
  await evaluate(`__qa('.intake__back')[0].click()`);
  await titleIs(TITLES.users);
  await typeValue("73");
  check("5.1(2) typing 73 on the team step gives 73", (await readout()) === "73" && (await rangeValueText()) === "73 people", await rangeValueText());
  // (3) arrows step, Page Up and Page Down jump between marks (marks 25, 50, 100, 500)
  await evaluate(`__q('.lv__range').focus()`);
  const before = await readout();
  await key("ArrowRight", "ArrowRight", 39);
  const afterArrow = await readout();
  check("5.1(3) an arrow key steps the value", Number(afterArrow.replace(/,/g, "")) > Number(before), `${before} -> ${afterArrow}`);
  await key("PageUp", "PageUp", 33);
  const up = await readout();
  await key("PageUp", "PageUp", 33);
  const up2 = await readout();
  await key("PageDown", "PageDown", 34);
  const down = await readout();
  check("5.1(3) Page Up and Page Down jump between preset marks", up === "100" && up2 === "500" && down === "100", `${up} ${up2} ${down}`);
  // thumb geometry: a click at the position the ticks assume lands on that position
  const g = await evaluate(`(() => { const r = __r(__q('.lv__range')); return { l: r.l, w: r.w, t: r.t, h: r.h }; })()`);
  const landed = [];
  for (const p of [25, 50, 75]) {
    const x = g.l + 11 + (p / 100) * (g.w - 22);
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y: g.t + g.h / 2, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y: g.t + g.h / 2, button: "left", clickCount: 1 });
    await sleep(60);
    landed.push(Number(await evaluate(`__q('.lv__range').value`)));
  }
  check("15.4(3) the thumb travel the ticks assume (11px in from each end) is the real one: clicks at 25, 50 and 75 land there", landed.join() === "25,50,75", landed.join());
}

// ===========================================================================
// 15.5 R-5, 4.2 and 15.13: the answer grid on the final page
// ===========================================================================
async function finish(company, w) {
  await open(w, { dpr: w < 600 ? 2 : 1 });
  await walkTo(company, "speed");
  await evaluate(`__qa('.choices .choice')[0].click()`);
  await waitFor(`!!__q('.answers')`, "the answer grid");
  await waitFor(`!!__q('.hero')`, "the hero");
  await evaluate("document.fonts.ready.then(() => true)");
  await sleep(300);
}
const gridState = () =>
  evaluate(`(() => {
    const g = __q('.answers'); const cells = __qa('.answer', g);
    return {
      cols: __cs(g, 'gridTemplateColumns').split(' ').length, colsCss: __cs(g, 'gridTemplateColumns'), box: __r(g),
      cells: cells.map((c) => {
        const v = __q('.answer__value', c); const l = __q('.answer__label', c);
        const cr = __r(c); const vr = __r(v);
        const cs = getComputedStyle(v);
        const canvas = document.createElement('canvas').getContext('2d'); canvas.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
        const shown = v.tagName === 'SELECT' ? v.options[v.selectedIndex].text : v.textContent;
        return { label: l.textContent, r: cr, value: v.tagName, shown, vr, focusable: v.tabIndex >= 0 && !v.disabled, textW: canvas.measureText(shown).width, inner: v.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), caretIn: !!__q('.answer__caret', c) };
      })
    };
  })()`);

for (const [company, n, labels] of [
  ["Software or internet company", 6, ["Company", "Team", "Customers", "Budget a quarter", "Work", "Answers needed"]],
  ["AI-first startup", 5, ["Company", "Customers", "Budget a quarter", "Work", "Answers needed"]],
]) {
  for (const w of [1280, 768, 390, 375]) {
    await finish(company, w);
    const g = await gridState();
    const tops = [...new Set(g.cells.map((c) => Math.round(c.r.t)))];
    const rowsOf = tops.map((t) => g.cells.filter((c) => Math.round(c.r.t) === t));
    const tag = `@${w} ${n} answers`;
    check(`15.5 ${tag}: every cell has a label and a value, in the order of the spec`, g.cells.length === n && g.cells.map((c) => c.label).join("|") === labels.join("|"), g.cells.map((c) => c.label).join("|"));
    check(`15.5(4) ${tag}: every value is a focusable control`, g.cells.every((c) => c.focusable), g.cells.map((c) => c.value).join());
    check(`15.5(5) ${tag}: cells in a row have the same height, and no value runs outside its cell`,
      rowsOf.every((row) => row.every((c) => near(c.r.h, row[0].r.h, 0.5))) &&
        g.cells.every((c) => c.vr.l >= c.r.l - 0.5 && c.vr.r <= c.r.r + 0.5 && c.textW <= c.inner + 0.5),
      g.cells.map((c) => `${c.shown}: ${c.textW.toFixed(0)}/${c.inner.toFixed(0)}`).join("  "));
    if (w === 1280) {
      if (n === 6) {
        check("15.5(1) @1280 six answers: 3 columns, 2 rows, no wide cell", g.cols === 3 && tops.length === 2 && rowsOf.every((r) => r.length === 3) && g.cells.every((c) => near(c.r.w, g.cells[0].r.w, 1)), `${g.colsCss}; rows ${rowsOf.map((r) => r.length)}`);
      } else {
        const [first, second] = rowsOf;
        check("15.5(2) @1280 five answers: Company spans two columns (2 + 1), then a row of 3", g.cols === 3 && tops.length === 2 && first.length === 2 && second.length === 3 && first[0].label === "Company" && near(first[0].r.w, 2 * second[0].r.w, 1) && near(first[1].r.w, second[0].r.w, 1), `${g.colsCss}; rows ${rowsOf.map((r) => r.length)}; company ${first[0].r.w.toFixed(0)} vs ${second[0].r.w.toFixed(0)}`);
      }
    }
    if (w === 768) {
      check(`R-13 @768 ${n} answers: two columns, every row full`, g.cols === 2 && rowsOf.every((r, i) => r.reduce((a, c) => a + c.r.w, 0) >= g.box.w - 2), `${g.colsCss}; rows ${rowsOf.map((r) => r.length)}`);
    }
    if (w < 600) {
      check(`15.5(3) @${w}: one column, one row per answer`, g.cols === 1 && tops.length === n && g.cells.every((c) => near(c.r.l, g.cells[0].r.l, 0.5) && near(c.r.w, g.cells[0].r.w, 0.5)), `${g.colsCss}; ${tops.length} rows`);
    }
    await shot(`final-answers-${n}`, ".situation");
  }
}

// 15.5(6) and 4.2(2): changing a value recomputes the page, no reload
{
  await finish("Software or internet company", 1280);
  await evaluate(`window.__marker = 1; window.__before = __q('.hero').textContent`);
  await evaluate(`(() => { const s = __qa('.answer__value').find((e) => e.getAttribute('aria-labelledby') && e.tagName === 'SELECT' && e.closest('.answer').querySelector('.answer__label').textContent === 'Budget a quarter'); s.value = '500000'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await sleep(700);
  const changed = await evaluate(`({ same: window.__marker === 1, before: window.__before, after: __q('.hero').textContent })`);
  check("15.5(6) changing the budget cell recomputes the page with no reload (the hero text changed, the page did not reload)", changed.same && changed.before !== changed.after, `${changed.before.slice(0, 60)} -> ${changed.after.slice(0, 60)}`);
  // the cell shows what the slider set (5.1(4)): finish with 73 people and read the grid
  await open(1280);
  await walkTo("Software or internet company", "users");
  await typeValue("73");
  await cont("customers");
  await cont("budget");
  await typeValue("20M");
  await cont("speed");
  await evaluate(`__qa('.choices .choice')[0].click()`);
  await waitFor(`!!__q('.answers')`, "the grid");
  const shown = await evaluate(`__qa('.answer').map((c) => c.querySelector('select, button').tagName === 'SELECT' ? c.querySelector('select').options[c.querySelector('select').selectedIndex].text : c.querySelector('button').textContent)`);
  check("5.1(4) the answer grid shows the values typed in the field: 73 people and $20M", shown[1] === "73 people" && shown[3] === "$20M", shown.join(" | "));
}

// 15.13: the intake choice lists (work, speed) are one column of equal rows at the three widths
for (const w of [375, 768, 1280]) {
  await open(w, { dpr: w < 600 ? 2 : 1 });
  await chooseCompany("Software or internet company");
  const work = await evaluate(`__qa('.choices .choice').map((e) => __r(e))`);
  await cont("users");
  await cont("customers");
  await cont("budget");
  await cont("speed");
  const speed = await evaluate(`__qa('.choices .choice').map((e) => __r(e))`);
  for (const [name, rows] of [["work", work], ["speed", speed]]) {
    check(`4.3(3) / 15.13 @${w} ${name} step: every option has the same width, height and left edge, in one column`,
      rows.length >= 3 && rows.every((r) => near(r.w, rows[0].w, 0.5) && near(r.h, rows[0].h, 0.5) && near(r.l, rows[0].l, 0.5)), `${rows.length} rows ${rows[0].w.toFixed(0)} x ${rows[0].h.toFixed(0)}`);
  }
  await shot("step6-speed-software", ".intake");
}

// A five-step type, one screenshot per step (the others are shared with the software run)
for (const w of [1280, 390]) {
  await open(w, { dpr: w < 600 ? 2 : 1 });
  await chooseCompany("AI-first startup");
  await shot("ai-step2-work", ".intake");
  await cont("customers");
  await shot("ai-step3-customers", ".intake");
  await cont("budget");
  await shot("ai-step4-budget", ".intake");
  await cont("speed");
  await shot("ai-step5-speed", ".intake");
}
for (const w of [1280, 390]) {
  await open(w, { dpr: w < 600 ? 2 : 1 });
  await chooseCompany("Software or internet company");
  await cont("users");
  await shot("step3-team-software", ".intake");
  await cont("customers");
  await shot("step4-customers-software", ".intake");
}

check("no uncaught page error or console error in the whole run", pageErrors.length === 0, pageErrors.slice(0, 3).join(" || "));

chrome.kill();
fs.rmSync(profile, { recursive: true, force: true });
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} of ${results.length} checks pass`);
if (failed.length) {
  console.log("FAILED:\n" + failed.map((f) => " - " + f.id + "  " + f.detail).join("\n"));
  process.exitCode = 1;
}
process.exit(process.exitCode ?? 0);
