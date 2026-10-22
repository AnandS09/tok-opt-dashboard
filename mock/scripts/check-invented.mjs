// Checks the invented proprietary speed and batch or flex price rows of
// `model_offers.csv` against the five guardrails of spec 12 BD-11.
//
//   node scripts/check-invented.mjs              check mock/public/data
//   node scripts/check-invented.mjs <data dir>   check another copy of the data
//   node scripts/check-invented.mjs --self-test  also prove each rule fails on a mutant
//
// Run from mock/. Exits 1 and prints one line per problem on any failure.
//
// An "invented row" is a `model_offers.csv` row with a speed value or a price
// tier other than `standard`. Rules, each named in the messages:
//   marker    an invented row has the placeholder source address and provenance=modelled
//   scope     only proprietary models have invented rows
//   readme    the data README lists exactly the invented rows
//   speed     speed columns are both filled or both empty; a batch or flex row has speed
//   shape     standard rows meet `interactive`, flex meets `standard` only, batch meets
//             neither, and a batch or flex price is under the model's cheapest standard price
//   today     no baseline row buys a batch or flex offer (the rows cannot move a default view)
//   manifest  the manifest's row count and checksum match the file
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const PLACEHOLDER = "https://example.invalid/placeholder-invented-data/";
const README_HEADING = "## Invented speed and batch rows (BD-11)";
const PRICE_TIERS = ["standard", "batch", "flex"];
const NEW_COLUMNS = ["price_tier", "provenance", "tok_s_per_user", "p95_ttft_ms"];

const here = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = path.join(here, "..", "public", "data");

const readCsv = (dir, file) =>
  Papa.parse(readFileSync(path.join(dir, file), "utf8"), { header: true, dynamicTyping: false, skipEmptyLines: true });
const filled = (value) => value !== undefined && value !== null && String(value).trim() !== "";

/** Returns one message per problem; empty when the data is clean. */
function check(dir) {
  const problems = [];
  const fail = (rule, message) => problems.push(`[${rule}] ${message}`);

  const offersParsed = readCsv(dir, "model_offers.csv");
  for (const column of NEW_COLUMNS) {
    if (!offersParsed.meta.fields.includes(column)) fail("columns", `model_offers.csv has no "${column}" column`);
  }
  if (problems.length > 0) return problems;
  const offers = offersParsed.data;
  const manifest = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const proprietary = new Set(
    readCsv(dir, "models.csv").data.filter((m) => m.license === "proprietary").map((m) => m.model_id),
  );
  const classes = manifest.parameters.latency_classes;
  const meets = (row, name) =>
    Number(row.tok_s_per_user) >= classes[name].min_tok_s_per_user &&
    (classes[name].max_p95_ttft_ms === null || Number(row.p95_ttft_ms) <= classes[name].max_p95_ttft_ms);

  const invented = offers.filter((o) => o.price_tier !== "standard" || filled(o.tok_s_per_user) || filled(o.p95_ttft_ms));

  for (const o of offers) {
    if (!PRICE_TIERS.includes(o.price_tier)) fail("columns", `${o.offer_id}: price_tier "${o.price_tier}" is not one of ${PRICE_TIERS.join(", ")}`);
    if (filled(o.tok_s_per_user) !== filled(o.p95_ttft_ms)) fail("speed", `${o.offer_id}: fill both speed columns or neither`);
    if (o.price_tier !== "standard" && !filled(o.tok_s_per_user)) fail("speed", `${o.offer_id}: a ${o.price_tier} row has no speed data`);
  }

  for (const o of invented) {
    if (!String(o.source_url).startsWith(PLACEHOLDER)) {
      fail("marker", `${o.offer_id}: source_url "${o.source_url}" is not under ${PLACEHOLDER}`);
    }
    if (o.provenance !== "modelled") fail("marker", `${o.offer_id}: provenance is "${o.provenance}", not "modelled"`);
    if (!proprietary.has(o.model_id)) fail("scope", `${o.offer_id}: model ${o.model_id} is not proprietary, so it may carry no invented speed or tier`);
  }

  // README lists exactly the invented rows.
  const readme = readFileSync(path.join(dir, "README.md"), "utf8");
  const start = readme.indexOf(README_HEADING);
  if (start < 0) {
    fail("readme", `README.md has no "${README_HEADING}" section`);
  } else {
    const rest = readme.slice(start + README_HEADING.length);
    const end = rest.search(/\n## /);
    const section = end < 0 ? rest : rest.slice(0, end);
    const listed = new Set();
    for (const line of section.split("\n")) {
      const match = /^\|\s*`([a-z0-9_]+)`\s*\|/.exec(line);
      if (match !== null && match[1] !== "offer_id") listed.add(match[1]);
    }
    const actual = new Set(invented.map((o) => o.offer_id));
    for (const id of actual) if (!listed.has(id)) fail("readme", `${id} is invented but not listed in the README`);
    for (const id of listed) if (!actual.has(id)) fail("readme", `${id} is listed in the README but is not an invented row`);
  }

  // Shape: the three classes admit different rows, and cheaper means slower.
  const cheapest = new Map();
  for (const o of offers) {
    if (o.price_tier !== "standard" || !filled(o.usd_per_mtok_in)) continue;
    const best = cheapest.get(o.model_id) ?? { in: Infinity, out: Infinity };
    cheapest.set(o.model_id, { in: Math.min(best.in, Number(o.usd_per_mtok_in)), out: Math.min(best.out, Number(o.usd_per_mtok_out)) });
  }
  for (const o of invented) {
    if (!filled(o.tok_s_per_user)) continue;
    if (o.price_tier === "standard" && !meets(o, "interactive")) fail("shape", `${o.offer_id}: a standard row must meet the interactive class`);
    if (o.price_tier === "flex" && !(meets(o, "standard") && !meets(o, "interactive"))) fail("shape", `${o.offer_id}: a flex row must meet the standard class but not interactive`);
    if (o.price_tier === "batch" && meets(o, "standard")) fail("shape", `${o.offer_id}: a batch row must not meet the standard class`);
    const floor = cheapest.get(o.model_id);
    if (o.price_tier !== "standard" && floor !== undefined) {
      if (!(Number(o.usd_per_mtok_in) < floor.in && Number(o.usd_per_mtok_out) < floor.out)) {
        fail("shape", `${o.offer_id}: a ${o.price_tier} price must be under the cheapest standard price of ${o.model_id}`);
      }
    }
  }

  // No Today row may buy a batch or flex offer.
  const tierOf = new Map(offers.map((o) => [o.offer_id, o.price_tier]));
  for (const row of readCsv(dir, "baseline_providers.csv").data) {
    if (filled(row.offer_id) && tierOf.get(row.offer_id) !== "standard") {
      fail("today", `baseline_providers.csv buys ${row.offer_id} for ${row.pattern_id} / ${row.workload_id}, which is not a standard-tier offer`);
    }
  }

  // Manifest.
  const entry = manifest.files["model_offers.csv"];
  const bytes = readFileSync(path.join(dir, "model_offers.csv"));
  if (entry === undefined) fail("manifest", "manifest.json has no model_offers.csv entry");
  else {
    if (entry.row_count !== offers.length) fail("manifest", `row_count is ${entry.row_count}, the file has ${offers.length} rows`);
    const sum = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
    if (entry.checksum !== sum) fail("manifest", `checksum is ${entry.checksum}, the file's is ${sum}`);
    if (entry.placeholder !== true) fail("manifest", "model_offers.csv is not marked placeholder: true");
  }
  if (manifest.placeholder !== true) fail("manifest", "manifest.json is not marked placeholder: true");
  return problems;
}

// ---------------------------------------------------------------------------
// Self-test: each rule must fail on a mutant, and the clean copy must pass.
// ---------------------------------------------------------------------------

/** Rewrites the manifest's entry for model_offers.csv so a CSV mutant isolates its own rule. */
function refreshManifest(dir) {
  const file = path.join(dir, "manifest.json");
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  const bytes = readFileSync(path.join(dir, "model_offers.csv"));
  manifest.files["model_offers.csv"].row_count = readCsv(dir, "model_offers.csv").data.length;
  manifest.files["model_offers.csv"].checksum = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
  writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
}

function mutateOffers(dir, change) {
  const parsed = readCsv(dir, "model_offers.csv");
  const rows = change(parsed.data) ?? parsed.data;
  writeFileSync(path.join(dir, "model_offers.csv"), Papa.unparse(rows, { columns: parsed.meta.fields, newline: "\n" }) + "\n");
  refreshManifest(dir);
}

const MUTANTS = [
  ["a batch row loses its placeholder source", /\[marker\] frontier_a_direct_global_batch/, (d) =>
    mutateOffers(d, (rows) => { rows.find((r) => r.offer_id === "frontier_a_direct_global_batch").source_url = ""; })],
  ["a flex row points at a real-looking address", /\[marker\] mid_a_direct_global_flex/, (d) =>
    mutateOffers(d, (rows) => { rows.find((r) => r.offer_id === "mid_a_direct_global_flex").source_url = "https://vendor.example.com/pricing"; })],
  ["a speed row is relabelled vendor_reported", /\[marker\] frontier_b_ec2_useast: provenance/, (d) =>
    mutateOffers(d, (rows) => { rows.find((r) => r.offer_id === "frontier_b_ec2_useast").provenance = "vendor_reported"; })],
  ["a new batch row without marker or README entry", /\[marker\] mid_a_bedrock_useast_batch: source_url[\s\S]*\[readme\] mid_a_bedrock_useast_batch is invented/, (d) =>
    mutateOffers(d, (rows) => {
      rows.push({ ...rows.find((r) => r.offer_id === "mid_a_bedrock_useast"), offer_id: "mid_a_bedrock_useast_batch", usd_per_mtok_in: "1", usd_per_mtok_out: "5", price_tier: "batch", tok_s_per_user: "10", p95_ttft_ms: "30000", source_url: "", provenance: "vendor_reported" });
    })],
  ["an open-weight row gets a speed", /\[scope\] open_x_neocloud_useast/, (d) =>
    mutateOffers(d, (rows) => { Object.assign(rows.find((r) => r.offer_id === "open_x_neocloud_useast"), { tok_s_per_user: "90", p95_ttft_ms: "300", provenance: "modelled" }); })],
  ["a README entry is removed", /\[readme\] mid_a_ec2_useast_batch is invented but not listed/, (d) => {
    const file = path.join(d, "README.md");
    writeFileSync(file, readFileSync(file, "utf8").split("\n").filter((l) => !l.startsWith("| `mid_a_ec2_useast_batch`")).join("\n"));
  }],
  ["a README entry names a row that is not invented", /\[readme\] open_y_selfhost_any is listed/, (d) => {
    const file = path.join(d, "README.md");
    writeFileSync(file, readFileSync(file, "utf8").replace("| `mid_a_ec2_useast_batch` |", "| `open_y_selfhost_any` | batch | x | 1 | 1 | 1 |\n| `mid_a_ec2_useast_batch` |"));
  }],
  ["a flex row is as slow as a batch row", /\[shape\] frontier_a_direct_global_flex/, (d) =>
    mutateOffers(d, (rows) => { Object.assign(rows.find((r) => r.offer_id === "frontier_a_direct_global_flex"), { tok_s_per_user: "5", p95_ttft_ms: "60000" }); })],
  ["a batch price is not under the standard price", /\[shape\] frontier_b_direct_global_batch/, (d) =>
    mutateOffers(d, (rows) => { rows.find((r) => r.offer_id === "frontier_b_direct_global_batch").usd_per_mtok_in = "9"; })],
  ["a batch row has no speed", /\[speed\] frontier_a_ec2_useast_batch/, (d) =>
    mutateOffers(d, (rows) => { Object.assign(rows.find((r) => r.offer_id === "frontier_a_ec2_useast_batch"), { tok_s_per_user: "", p95_ttft_ms: "" }); })],
  ["a baseline row buys a batch offer", /\[today\] baseline_providers\.csv buys frontier_a_direct_global_batch/, (d) => {
    const parsed = readCsv(d, "baseline_providers.csv");
    parsed.data.find((r) => r.offer_id === "frontier_a_direct_global").offer_id = "frontier_a_direct_global_batch";
    writeFileSync(path.join(d, "baseline_providers.csv"), Papa.unparse(parsed.data, { columns: parsed.meta.fields, newline: "\n" }) + "\n");
  }],
  ["the manifest checksum is stale", /\[manifest\] checksum/, (d) => {
    const file = path.join(d, "manifest.json");
    const manifest = JSON.parse(readFileSync(file, "utf8"));
    manifest.files["model_offers.csv"].checksum = "sha256:00";
    writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
  }],
];

function selfTest(dir) {
  let failures = 0;
  const base = check(dir);
  if (base.length > 0) {
    console.log(`self-test: the unmutated data already fails:\n  ${base.join("\n  ")}`);
    return 1;
  }
  console.log("self-test: unmutated data passes");
  for (const [name, expected, mutate] of MUTANTS) {
    const copy = mkdtempSync(path.join(tmpdir(), "check-invented-"));
    try {
      cpSync(dir, copy, { recursive: true });
      mutate(copy);
      const found = check(copy);
      const caught = found.length > 0 && expected.test(found.join("\n"));
      if (!caught) failures += 1;
      console.log(`  ${caught ? "caught " : "MISSED "} ${name}${caught ? "" : `\n     got: ${found.join(" | ") || "no problems"}`}`);
    } finally {
      rmSync(copy, { recursive: true, force: true });
    }
  }
  console.log(`self-test: ${MUTANTS.length - failures} of ${MUTANTS.length} mutants caught`);
  return failures === 0 ? 0 : 1;
}

const args = process.argv.slice(2);
const runSelfTest = args.includes("--self-test");
const dir = args.find((a) => !a.startsWith("--")) ?? DEFAULT_DIR;
const problems = check(dir);
if (problems.length > 0) {
  console.log(`check-invented: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
const rows = readCsv(dir, "model_offers.csv").data;
const inventedCount = rows.filter((o) => o.price_tier !== "standard" || filled(o.tok_s_per_user)).length;
console.log(`check-invented: ok (${inventedCount} invented rows of ${rows.length}, all with the placeholder marker and listed in the README)`);
if (runSelfTest) process.exit(selfTest(dir));
