// Negative controls for the intake checks: each mutant puts one fault into a scratch copy of the
// source, and the check that guards the requirement must fail on it. A mutant that survives
// means the check proves nothing for that requirement.
//
//   node docs/build-v04/intake/mutants.mjs            (from mock/; needs Chrome for the browser mutants)
//
// "unit" mutants run vitest on the copy; "browser" mutants start a dev server on the copy and run
// drive.mjs against it. The real tree is never touched. Exit code 0 only if every mutant is caught.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mock = path.resolve(here, "../../..");

/** [id, kind, requirement, file, from, to] */
const MUTANTS = [
  // balanced grid (spec 15.13)
  ["G1", "unit", "15.13 rule 3: pick the count with the MOST rows", "src/store/balancedGrid.ts", "rows < best.rows ||", "rows > best.rows ||"],
  ["G2", "unit", "15.13 rule 4: wide cells go to the LAST items", "src/store/balancedGrid.ts", "(_, i) => (i < chosen.wide ? 2 : 1)", "(_, i) => (i >= count - chosen.wide ? 2 : 1)"],
  ["G3", "unit", "15.5: the answer grid allows 4 columns", "src/store/balancedGrid.ts", "minColumns: 1, maxColumns: 3 }", "minColumns: 1, maxColumns: 4 }"],
  ["G4", "unit", "15.13: no packing check, so a wide cell can leave a hole", "src/store/balancedGrid.ts", "if (wide > count || !packs(count, wide, columns)) continue;", "if (wide > count) continue;"],
  // R-3 estimate
  ["E1", "unit", "15.3: the estimate reads the starting scenario's hardware tiers", "src/store/intake.ts", 'tiers_allowed: "all",\n    unit: "people",', 'tiers_allowed: s.tiers_allowed,\n    unit: "people",'],
  ["E2", "unit", "15.3: the estimate reads the starting scenario's quality floor", "src/store/intake.ts", "    named_models: [],\n    tiers_allowed", "    named_models: [],\n    quality_floor: s.quality_floor,\n    tiers_allowed"],
  ["E3", "unit", "15.3: a picked type keeps the starting scenario's team size", "src/store/intake.ts", "      users: INTAKE_DEFAULTS.users,\n", ""],
  ["E4", "unit", "15.3: a picked type keeps the starting scenario's speed", "src/store/intake.ts", "    latency_class: INTAKE_DEFAULTS.latency_class,\n    baseline: {", "    baseline: {"],
  ["E5", "unit", "15.3: Today is the budget", "src/store/intake.ts", "    today: allocation.total_usd,", "    today: s.baseline.budget_usd_per_quarter,"],
  ["E6", "unit", "15.3: the line under the figures leaves out the kinds of work", "src/store/intake.ts", "  parts.push(`${kindsOfWork(selectedWorkloads(s, tables).length)} of work`);\n", ""],
  // R-2 step label
  ["S1", "unit", "15.2: the rule on step 1 is empty (the v0.3 rule)", "src/store/intake.ts", 'return { label: "Step 1", value: 1, max: maxSteps(tables) };', 'return { label: "Step 1", value: 0, max: maxSteps(tables) };'],
  ["S2", "unit", "15.2: no 'of N' after a type is chosen (the v0.3 label)", "src/store/intake.ts", "label: `Step ${n} of ${steps.length}`", "label: `Step ${n}`"],
  ["S3", "unit", "15.2: N_max is the smallest step count, not the largest", "src/store/intake.ts", "return Math.max(...COMPANIES.map((c) => stepsFor(c, tables).length));", "return Math.min(...COMPANIES.map((c) => stepsFor(c, tables).length));"],
  // R-4 presets
  ["P1", "unit", "15.4: the preset hues cycle after three, not four", "src/components/LogSlider.tsx", "(index % 4) + 1", "(index % 3) + 1"],
  ["P2", "unit", "15.4: coral changed in tokens.css", "src/styles/tokens.css", "--color-preset-2: #cc675c;", "--color-preset-2: #cc675d;"],
  ["P3", "unit", "15.4: the selected tint is 20%, not the board's 16%", "src/styles/intake.css", "color-mix(in srgb, var(--lv-hue) 16%", "color-mix(in srgb, var(--lv-hue) 20%"],
  // R-1, R-2, R-3, R-4, R-5, R-13 in the browser
  ["B1", "browser", "15.1: the compute seller's row has no icon", "src/components/Intake.tsx", '            <Icon shape="provider" />\n', ""],
  ["B2", "browser", "15.1: the parenthesis stays in the label", "src/components/Intake.tsx", 'label: "I sell AI compute",', 'label: "I sell AI compute (cloud or GPU provider)",'],
  ["B3", "browser", "15.2: the rule on step 1 is empty in the page", "src/components/Intake.tsx", '<progress className="intake__progress" value={progress.value}', '<progress className="intake__progress" value={info ? progress.value : 0}'],
  ["B4", "browser", "15.3: the estimate shows from step 2", "src/components/Intake.tsx", 'const ESTIMATE_STEPS: StepId[] = ["budget", "speed"];', 'const ESTIMATE_STEPS: StepId[] = ["work", "users", "customers", "budget", "speed"];'],
  ["B5", "browser", "15.3: a picked type keeps the starting scenario's speed", "src/store/intake.ts", "    latency_class: INTAKE_DEFAULTS.latency_class,\n    baseline: {", "    baseline: {"],
  ["B6", "browser", "15.3: Today is the budget", "src/store/intake.ts", "    today: allocation.total_usd,", "    today: s.baseline.budget_usd_per_quarter,"],
  ["B7", "browser", "15.4: the preset's top edge is 4px", "src/styles/intake.css", "border-top: 6px solid var(--lv-hue);", "border-top: 4px solid var(--lv-hue);"],
  ["B8", "browser", "15.4: each tick takes the next preset's hue", "src/components/LogSlider.tsx", '["--lv-hue" as string]: presetHue(i) }}\n            />', '["--lv-hue" as string]: presetHue(i + 1) }}\n            />'],
  ["B9", "browser", "15.4: the preset row sits below the track", "src/styles/intake.css", ".lv__presets {\n  margin-bottom: var(--space-2);", ".lv__presets {\n  order: 5;\n  margin-bottom: var(--space-2);"],
  ["B10", "browser", "15.4: the selected preset has no check mark", "src/components/LogSlider.tsx", "{m === value ? (", "{false ? ("],
  ["B11", "browser", "15.5: the answer grid has at most 2 columns", "src/store/balancedGrid.ts", "minColumns: 1, maxColumns: 3 }", "minColumns: 1, maxColumns: 2 }"],
  ["B12", "browser", "15.5: no cell is wide, so five answers wrap with a hole", "src/store/balancedGrid.ts", "(_, i) => (i < chosen.wide ? 2 : 1)", "() => 1"],
  ["B13", "browser", "15.13: the company rows are not equal height", "src/styles/intake.css", "  grid-auto-rows: 1fr;\n", ""],
  ["B14", "browser", "15.5: the values run outside their cells on a phone", "src/styles/intake.css", "    width: 5.5rem;\n  }", "    width: 12rem;\n  }"],
];

const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const picked = MUTANTS.filter(([id]) => only.length === 0 || only.includes(id));

function copyTree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "intake-mutant-"));
  for (const item of ["src", "public", "index.html", "package.json", "tsconfig.json", "tsconfig.node.json", "vite.config.ts", "vitest.config.ts"]) {
    fs.cpSync(path.join(mock, item), path.join(dir, item), { recursive: true });
  }
  fs.mkdirSync(path.join(dir, "docs/design-v0.4/palette/generated"), { recursive: true });
  fs.cpSync(path.join(mock, "docs/design-v0.4/palette/generated/tokens.css"), path.join(dir, "docs/design-v0.4/palette/generated/tokens.css"));
  fs.mkdirSync(path.join(dir, "docs/build-v04/intake"), { recursive: true });
  fs.cpSync(path.join(here, "drive.mjs"), path.join(dir, "docs/build-v04/intake/drive.mjs"));
  fs.symlinkSync(fs.realpathSync(path.join(mock, "node_modules")), path.join(dir, "node_modules"));
  return dir;
}

function apply(dir, file, from, to) {
  const p = path.join(dir, file);
  const text = fs.readFileSync(p, "utf8");
  if (!text.includes(from)) throw new Error(`mutant text not found in ${file}: ${from}`);
  fs.writeFileSync(p, text.replace(from, to));
}

const run = (cmd, args, opts) =>
  new Promise((resolve) => {
    const child = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => resolve({ code, out }));
  });

let nextPort = 5600;
async function caught([id, kind, what, file, from, to]) {
  const dir = copyTree();
  try {
    apply(dir, file, from, to);
    if (kind === "unit") {
      const r = await run(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "src/store", "src/components"], { cwd: dir });
      const failed = /Tests\s+(\d+) failed/.exec(r.out);
      return { id, what, caught: r.code !== 0, detail: failed ? `${failed[1]} tests fail` : "no failing test" };
    }
    const port = nextPort++;
    const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], { cwd: dir, stdio: "ignore" });
    try {
      for (let i = 0; i < 100; i++) {
        try {
          await fetch(`http://127.0.0.1:${port}/`);
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 100));
        }
      }
      const r = await run(process.execPath, ["docs/build-v04/intake/drive.mjs", `http://127.0.0.1:${port}/`], { cwd: dir });
      const failed = r.out.split("\n").filter((l) => l.startsWith("FAIL")).map((l) => l.slice(6, 40).trim());
      return { id, what, caught: r.code !== 0, detail: failed.length ? `${failed.length} checks fail, first: ${failed[0]}` : "all checks pass" };
    } finally {
      server.kill();
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// The unit mutants run one at a time; the browser mutants three at a time.
const results = [];
const queue = [...picked];
async function worker() {
  while (queue.length) {
    const m = queue.shift();
    const r = await caught(m);
    results.push(r);
    console.log(`${r.caught ? "CAUGHT  " : "SURVIVED"} ${r.id.padEnd(4)} ${r.what}  (${r.detail})`);
  }
}
const unit = picked.filter((m) => m[1] === "unit");
const browser = picked.filter((m) => m[1] === "browser");
queue.length = 0;
queue.push(...unit);
await worker();
queue.push(...browser);
await Promise.all([worker(), worker(), worker()]);

const survived = results.filter((r) => !r.caught);
console.log(`\n${results.length - survived.length} of ${results.length} mutants caught`);
process.exit(survived.length ? 1 : 0);
