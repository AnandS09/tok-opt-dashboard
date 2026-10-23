// Development tool, not part of the app. Applies one source mutant at a time to
// the working tree, runs src/store/goal.test.ts, restores the file and reports
// whether the tests failed (CAUGHT) or not (MISSED). Run from mock/:
//   node docs/build-v04/final/mutants.mjs
// Every file is restored in a `finally`; check `git status` afterwards.
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const MUTANTS = [
  ["a tab is disabled", "src/components/GoalTabs.tsx", "tabIndex={selected ? 0 : -1}", "tabIndex={selected ? 0 : -1}\n              disabled={id === \"G3\"}"],
  ["a tab is aria-disabled", "src/components/GoalTabs.tsx", "tabIndex={selected ? 0 : -1}", "tabIndex={selected ? 0 : -1}\n              aria-disabled={id === \"G3\"}"],
  ["two pickers in G1", "src/components/HeadlineStrip.tsx", "lead: !short && savedPct > 0 ? GOAL_TABS.G1.lead : null,", "lead: !short && savedPct > 0 ? <>{GOAL_TABS.G1.lead} {picker}</> : null,"],
  ["no picker in G2 and G3 lead", "src/components/HeadlineStrip.tsx", "{GOAL_TABS[goal].lead}, measured against {picker}", "{GOAL_TABS[goal].lead}, measured against {String(Boolean(picker))}"],
  ["G2/G3 tab figure off by 0.1", "src/store/goal.ts", "const { multiple } = solvedHeadline(scenario, solve);", "const multiple = solvedHeadline(scenario, solve).multiple + 0.1;"],
  ["G1 tab figure off by one point", "src/store/goal.ts", "return Math.round(savedPct) > 0 ? `${fmtPct(savedPct)} lower cost`", "return Math.round(savedPct) > 0 ? `${fmtPct(savedPct + 1)} lower cost`"],
  ["G4 tab figure at step 0 instead of the largest", "src/store/goal.ts", "qualityStep: clampStep(Number.MAX_SAFE_INTEGER, levels.quality),", "qualityStep: 0,"],
  ["G4 tab figure ignores the speed step", "src/store/goal.ts", "speedStep: clampStep(Number.MAX_SAFE_INTEGER, levels.speed),", "speedStep: 0,"],
  ["G3 never a placeholder", "src/store/goal.ts", "return goalAvailability(scenario, tables).G3;", "return null;"],
  ["G3 placeholder tab drops its label", "src/store/goal.ts", "? { text: `${timesText(G3_PLACEHOLDER.multiple)} the people`, placeholder: true,", "? { text: `${timesText(G3_PLACEHOLDER.multiple)} the people`, placeholder: false,"],
  ["compute path reads the placeholder", "src/compute/goals.ts", "export const COVERAGE_MESSAGE_ABOVE = 10;", "export const COVERAGE_MESSAGE_ABOVE = 10;\n// G3_PLACEHOLDER"],
  ["the arrow skips G3", "src/store/goal.ts", "if (key === \"ArrowRight\") return GOAL_ORDER[(at + 1) % n];", "if (key === \"ArrowRight\") return GOAL_ORDER[(at + 1 + (GOAL_ORDER[(at + 1) % n] === \"G3\" ? 1 : 0)) % n];"],
  ["the line loses its bold name", "src/components/ComparatorSelect.tsx", "<strong>{picked.label}</strong> {whatItIs", "{picked.label} {whatItIs"],
  ["the control is not described by the line", "src/components/ComparatorSelect.tsx", "aria-describedby={describedBy}", "aria-describedby={undefined}"],
  ["old Compared with label returns", "src/components/ComparatorSelect.tsx", "<span className=\"comparator\" data-slot=\"comparator\">", "<span className=\"comparator\" data-slot=\"comparator\"><label>Compared with</label>"],
  ["the typical buyer line claims it for any option", "src/components/ComparatorSelect.tsx", "if (picked.is_typical) return", "if (true) return"],
  ["the chosen option reads with its mark", "src/components/ComparatorSelect.tsx", "{a.is_typical && a.pattern_id !== value ?", "{a.is_typical ?"],
  ["hero shows the picked label wrongly", "src/components/ComparatorSelect.tsx", "{picked?.label ?? value}", "{value}"],
  ["a tab is missing its short name", "src/components/GoalTabs.tsx", "<span className=\"goal-tabs__short\">{GOAL_TABS[id].short}</span>", ""],
  ["phone short names changed", "src/store/goal.ts", "short: \"More people\"", "short: \"People\""],
  ["tabs follow the goal (a G4 step changes the figure)", "src/store/goal.ts", "const { goal, tradeoff, ...own } = scenario;", "const { goal, ...own } = scenario;"],
];

const run = () => spawnSync("npx", ["vitest", "run", "src/store/goal.test.ts"], { cwd: ROOT, encoding: "utf8" });
let missed = 0;
for (const [name, file, from, to] of MUTANTS) {
  const path = `${ROOT}/${file}`;
  const original = fs.readFileSync(path, "utf8");
  if (!original.includes(from)) {
    console.log(`SKIP ${name}: text not found in ${file}`);
    missed += 1;
    continue;
  }
  try {
    fs.writeFileSync(path, original.replace(from, to));
    const out = run();
    const failed = out.status !== 0;
    const failing = (out.stdout.match(/^\s+× .*/gm) ?? []).length;
    console.log(`${failed ? "CAUGHT" : "MISSED"} ${name} (${failing} failing tests, exit ${out.status})`);
    if (!failed) missed += 1;
  } finally {
    fs.writeFileSync(path, original);
  }
}
console.log(missed === 0 ? "ALL MUTANTS CAUGHT" : `${missed} NOT CAUGHT`);
