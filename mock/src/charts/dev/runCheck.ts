/**
 * Node entry of the chart render check, not part of the app. `runCheck.mjs`
 * bundles this file with Vite, then runs it. It builds the design tokens from
 * the stylesheet, loads the fixture tables from `public/data` and runs
 * `runChartChecks` on the sample results and on every shipped scenario, and
 * `runBudgetChecks` over the budget range. Exit code 0 only if nothing is
 * reported.
 *
 *   node src/charts/dev/runCheck.mjs        (from mock/)
 */
import fs from "node:fs";
import path from "node:path";
import { benefitHeadcount, compute, scenarioAtTarget } from "../../compute";
import { loadScenario, loadTables } from "../../data/load";
import type { Results } from "../../contract";
import { chartRegistry } from "../registry";
import { tokensFrom } from "../tokens";
import type { Tokens } from "../tokens";
import { runBudgetChecks, runChartChecks, runComparatorChecks, runSelfTests, selectorProblems } from "./renderCheck";
import { runC10Checks, runC10SelfTests } from "./c10Check";
import { benefitMarkupProblems, benefitSelfTests, benefitStyleProblems } from "./benefitCheck";
import { sampleResults, sampleResultsEdge } from "./sampleResults";

const mockRoot = process.env.MOCK_ROOT ?? process.cwd();
const dataDir = path.join(mockRoot, "public/data");

/** Every `--name: value;` of the token stylesheet, with `var()` resolved. */
function readTokens(): Tokens {
  const vars: Record<string, string> = {};
  for (const file of ["tokens.css"]) {
    const css = fs.readFileSync(path.join(mockRoot, "src/styles", file), "utf8");
    for (const m of css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].replace(/\/\*.*?\*\//g, "").trim();
  }
  const resolve = (v: string): string => v.replace(/var\((--[a-z0-9-]+)\)/g, (_, n) => resolve(vars[n] ?? ""));
  return tokensFrom((p) => (vars[p] === undefined ? "" : resolve(vars[p])));
}

// The loader fetches; serve the fixture files from disk.
(globalThis as unknown as { fetch: unknown }).fetch = async (url: string) => {
  const file = path.join(dataDir, url.replace(/^.*?data\//, ""));
  if (!fs.existsSync(file)) return { ok: false, status: 404, text: async () => "" };
  const body = fs.readFileSync(file, "utf8");
  return { ok: true, status: 200, text: async () => body, json: async () => JSON.parse(body) };
};

const tokens = readTokens();
const tables = await loadTables("http://x/data");
const verbose = process.env.VERBOSE !== undefined;

let bad = 0;
const show = (label: string, report: { problems: string[]; notes: string[] }) => {
  console.log(`== ${label}: ${report.problems.length === 0 ? "OK" : `${report.problems.length} problem(s)`}`);
  for (const p of report.problems) console.log(`  PROBLEM ${p}`);
  if (verbose) for (const n of report.notes) console.log(`  ${n}`);
  bad += report.problems.length;
};

const cases: [string, Results][] = [
  ["sample", sampleResults],
  ["sample-edge", sampleResultsEdge],
];
const scenarios = ["s1", "s2", "hardware_heavy"];
for (const id of scenarios) {
  const resp = await loadScenario("http://x/data", id);
  cases.push([id, compute(resp.scenario, tables)]);
  for (const stage of ["seats", "api", "platform"] as const) {
    cases.push([`${id}-${stage}`, compute({ ...resp.scenario, stage_today: stage }, tables)]);
  }
  const at = scenarioAtTarget(resp.scenario);
  if (at) cases.push([`${id}-target`, compute(at, tables)]);
}

for (const id of scenarios) {
  const resp = await loadScenario("http://x/data", id);
  runBudgetChecks(resp.scenario, tables, tokens, id).forEach((r, i) => show(`${id}-budget#${i}`, r));
}
for (const [label, results] of cases) {
  show(label, runChartChecks(label, results, tokens));
  if (!label.startsWith("sample") && verbose) {
    for (const d of chartRegistry) console.log(`  ${d.id} caption: ${d.caption(results)}`);
  }
}
for (const id of scenarios) {
  const resp = await loadScenario("http://x/data", id);
  const base = compute(resp.scenario, tables);
  show(`${id}-c10`, runC10Checks(id, resp.scenario, tables, base, tokens));
  for (const stage of ["seats", "api", "platform"] as const) {
    const sc = { ...resp.scenario, stage_today: stage };
    show(`${id}-${stage}-c10`, runC10Checks(`${id}-${stage}`, sc, tables, compute(sc, tables), tokens));
  }
  // Every comparator, so the Today lines follow the choice; and the G4 tab, whose trade-off the frontier ignores.
  for (const alt of base.today_alternatives) {
    const sc = { ...resp.scenario, comparator: alt.pattern_id };
    show(`${id}-${alt.pattern_id}-c10`, runC10Checks(`${id}-${alt.pattern_id}`, sc, tables, compute(sc, tables), tokens));
  }
  const g4 = { ...resp.scenario, goal: "G4" as const, tradeoff: { quality_step: 2, speed_step: 1 } };
  show(`${id}-g4-c10`, runC10Checks(`${id}-g4`, g4, tables, compute(g4, tables), tokens));
}
for (const id of scenarios) {
  const resp = await loadScenario("http://x/data", id);
  show(`${id}-comparators`, runComparatorChecks(`${id}`, resp.scenario, tables, tokens));
}
const s1 = await loadScenario("http://x/data", "s1");
for (const id of scenarios) {
  const resp = await loadScenario("http://x/data", id);
  show(`${id}-selector`, { problems: selectorProblems(id, compute(resp.scenario, tables)), notes: [] });
}
show("c10-self-tests", runC10SelfTests({ ...s1.scenario, stage_today: "seats" }, tables, compute({ ...s1.scenario, stage_today: "seats" }, tables), tokens));
// Benefit boxes: the markup of every chart's boxes on every shipped scenario and stage, and the stylesheet.
const benefitCss = fs.readFileSync(path.join(mockRoot, "src/styles/benefits.css"), "utf8");
show("benefit-style", { problems: benefitStyleProblems(benefitCss), notes: [] });
show("benefit-self-tests", { problems: benefitSelfTests(benefitCss), notes: [] });
for (const id of scenarios) {
  const resp = await loadScenario("http://x/data", id);
  for (const stage of ["seats", "api", "platform"] as const) {
    const scenario = { ...resp.scenario, stage_today: stage };
    const results = compute(scenario, tables);
    const context = { scenario, goal: "G1" as const, solve: null, frontier: null, headcount: benefitHeadcount(scenario, tables) };
    const problems = chartRegistry.flatMap((d) =>
      benefitMarkupProblems(d.benefits(results, context), d.caption(results), `${id}-${stage} ${d.id}`),
    );
    show(`${id}-${stage}-benefit-markup`, { problems, notes: [] });
  }
}
show("self-tests", runSelfTests(tokens, compute({ ...s1.scenario, stage_today: "seats" }, tables)));
console.log(bad === 0 ? "ALL OK" : `FAILED ${bad}`);
process.exit(bad === 0 ? 0 : 1);
