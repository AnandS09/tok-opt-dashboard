/**
 * Data loader (spec 7.3): fetches the eleven CSVs and `manifest.json` under a
 * base URL, parses them with PapaParse, and validates headers, cell kinds
 * and foreign keys. Every failure throws an Error whose message names the
 * file and, where there is one, the column (spec 7.3 "fail loudly").
 *
 * The CSV rows come back typed as the contract describes: numeric columns
 * are numbers and an empty cell is `null`.
 */

import Papa from "papaparse";
import type {
  BaselineProviderRow,
  BuyingPatternRow,
  CaseStudyRow,
  HardwareRow,
  Manifest,
  ModelOfferRow,
  ModelRow,
  PatternPopularityRow,
  QualityRow,
  ScenarioResponse,
  SeatPlanRow,
  Tables,
  ThroughputCurveRow,
  WorkloadRow,
} from "../contract";
import {
  BASELINE_PROVIDERS,
  BUYING_PATTERNS,
  CASE_STUDIES,
  HARDWARE,
  LATENCY_CLASSES,
  MODEL_OFFERS,
  MODELS,
  PATTERN_POPULARITY,
  QUALITY,
  SEAT_PLANS,
  THROUGHPUT_CURVES,
  WORKLOADS,
  STAGES,
  seatCapMtokPerUserMonth,
  type TableSpec,
} from "./schema";
import { parseScenarioResponse } from "./scenario";

const MANIFEST_FILE = "manifest.json";
const COMPOSITE_PREFIX = "composite:";
/** Tolerance for "shares sum to 1" checks on CSV-stored decimals. */
const SHARE_SUM_TOLERANCE = 1e-6;

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path}`;
}

async function fetchText(baseUrl: string, path: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(joinUrl(baseUrl, path));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${path}: could not be fetched (${reason})`);
  }
  if (!response.ok) {
    throw new Error(`${path}: could not be fetched (HTTP ${response.status})`);
  }
  return response.text();
}

// ---------------------------------------------------------------------------
// CSV parsing and per-cell validation
// ---------------------------------------------------------------------------

type RawRow = Record<string, unknown>;

/** Line number in the file for a data row index (the header is line 1). */
const lineOf = (index: number): number => index + 2;

function parseTable<T>(spec: TableSpec, text: string): T[] {
  const { file } = spec;
  const parsed = Papa.parse<RawRow>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    delimiter: ",",
  });

  const firstError = parsed.errors[0];
  if (firstError !== undefined) {
    const where = firstError.row === undefined ? "" : ` (line ${lineOf(firstError.row)})`;
    throw new Error(`${file}: ${firstError.message}${where}`);
  }

  const header = parsed.meta.fields ?? [];
  for (const column of Object.keys(spec.columns)) {
    if (!header.includes(column)) {
      throw new Error(`${file}: column "${column}" is missing from the header row`);
    }
  }
  for (const column of header) {
    if (!(column in spec.columns)) {
      throw new Error(`${file}: column "${column}" is not part of the expected columns`);
    }
  }

  parsed.data.forEach((row, index) => {
    for (const [column, kind] of Object.entries(spec.columns)) {
      const value = row[column];
      const where = `${file}: column "${column}" on line ${lineOf(index)}`;
      if (value === null || value === undefined) {
        if (!kind.endsWith("?")) throw new Error(`${where} is empty`);
        continue;
      }
      if (kind.startsWith("number")) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
          throw new Error(`${where} must be a number, got ${JSON.stringify(value)}`);
        }
      } else if (typeof value !== "string") {
        throw new Error(`${where} must be text, got ${JSON.stringify(value)}`);
      }
      const allowed = spec.enums?.[column];
      if (allowed !== undefined && !allowed.includes(value as string)) {
        throw new Error(`${where} must be one of ${allowed.join(", ")}, got "${String(value)}"`);
      }
    }
  });

  return parsed.data as unknown as T[];
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseManifest(text: string): Manifest {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${MANIFEST_FILE}: not valid JSON (${reason})`);
  }
  const fail = (field: string, expected: string): never => {
    throw new Error(`${MANIFEST_FILE}: field "${field}" must be ${expected}`);
  };
  if (!isRecord(json)) return fail("(root)", "an object");
  if (typeof json.data_version !== "string") fail("data_version", "text");
  if (typeof json.generated_at !== "string") fail("generated_at", "text");
  const parameters = json.parameters;
  if (!isRecord(parameters)) return fail("parameters", "an object");
  for (const key of ["working_days_per_quarter", "months_per_quarter"]) {
    const value = parameters[key];
    if (typeof value !== "number" || !(value > 0)) fail(`parameters.${key}`, "a positive number");
  }
  const classes = parameters.latency_classes;
  if (!isRecord(classes)) return fail("parameters.latency_classes", "an object");
  for (const name of LATENCY_CLASSES) {
    const entry = classes[name];
    if (!isRecord(entry)) return fail(`parameters.latency_classes.${name}`, "an object");
    if (typeof entry.min_tok_s_per_user !== "number") {
      fail(`parameters.latency_classes.${name}.min_tok_s_per_user`, "a number");
    }
    if (entry.max_p95_ttft_ms !== null && typeof entry.max_p95_ttft_ms !== "number") {
      fail(`parameters.latency_classes.${name}.max_p95_ttft_ms`, "a number or null");
    }
  }
  if (!isRecord(json.files)) return fail("files", "an object");
  return json as unknown as Manifest;
}

// ---------------------------------------------------------------------------
// Cross-table validation
// ---------------------------------------------------------------------------

/** Parses a JSON-in-a-cell model mix and checks it has the four numeric shares. */
function checkModelMixCell(file: string, column: string, line: number, text: string): void {
  const where = `${file}: column "${column}" on line ${line}`;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(`${where} is not valid JSON`);
  }
  if (!isRecord(value)) throw new Error(`${where} must be a JSON object`);
  for (const key of ["frontier", "mid", "small", "open_weight_share"]) {
    if (typeof value[key] !== "number") {
      throw new Error(`${where} needs a numeric "${key}"`);
    }
  }
}

function validateReferences(t: Tables): void {
  const ids = {
    hardware: new Set(t.hardware.map((r) => r.hw_id)),
    models: new Set(t.models.map((r) => r.model_id)),
    offers: new Set(t.model_offers.map((r) => r.offer_id)),
    plans: new Set(t.seat_plans.map((r) => r.plan_id)),
    workloads: new Set(t.workloads.map((r) => r.workload_id)),
  };

  const need = (
    file: string,
    column: string,
    index: number,
    value: string,
    target: Set<string>,
    targetName: string,
  ): void => {
    if (!target.has(value)) {
      throw new Error(
        `${file}: column "${column}" on line ${lineOf(index)} refers to "${value}", which is not in ${targetName}`,
      );
    }
  };

  const duplicate = (file: string, column: string, values: string[]): void => {
    const seen = new Set<string>();
    values.forEach((value, index) => {
      if (seen.has(value)) {
        throw new Error(`${file}: column "${column}" on line ${lineOf(index)} repeats "${value}"`);
      }
      seen.add(value);
    });
  };
  duplicate(HARDWARE.file, "hw_id", t.hardware.map((r) => r.hw_id));
  duplicate(MODELS.file, "model_id", t.models.map((r) => r.model_id));
  duplicate(MODEL_OFFERS.file, "offer_id", t.model_offers.map((r) => r.offer_id));
  duplicate(SEAT_PLANS.file, "plan_id", t.seat_plans.map((r) => r.plan_id));
  duplicate(WORKLOADS.file, "workload_id", t.workloads.map((r) => r.workload_id));

  t.throughput_curves.forEach((r, i) => {
    need(THROUGHPUT_CURVES.file, "model_id", i, r.model_id, ids.models, MODELS.file);
    need(THROUGHPUT_CURVES.file, "hw_id", i, r.hw_id, ids.hardware, HARDWARE.file);
    if (!(r.tok_s_per_gpu > 0)) {
      throw new Error(
        `${THROUGHPUT_CURVES.file}: column "tok_s_per_gpu" on line ${lineOf(i)} must be above 0`,
      );
    }
  });

  t.model_offers.forEach((r, i) => {
    need(MODEL_OFFERS.file, "model_id", i, r.model_id, ids.models, MODELS.file);
    const selfHost = r.channel === "self-host";
    for (const column of ["usd_per_mtok_in", "usd_per_mtok_out"] as const) {
      const value = r[column];
      if (selfHost && value !== null) {
        throw new Error(
          `${MODEL_OFFERS.file}: column "${column}" on line ${lineOf(i)} must be empty for a self-host row`,
        );
      }
      if (!selfHost && value === null) {
        throw new Error(
          `${MODEL_OFFERS.file}: column "${column}" on line ${lineOf(i)} must have a price for channel "${r.channel}"`,
        );
      }
    }
    // Speed (spec 7.4): both columns or neither, positive, and never on a row
    // costed from hardware (its speed comes from throughput_curves.csv).
    if ((r.tok_s_per_user === null) !== (r.p95_ttft_ms === null)) {
      throw new Error(
        `${MODEL_OFFERS.file}: columns "tok_s_per_user" and "p95_ttft_ms" on line ${lineOf(i)}: fill both or neither`,
      );
    }
    for (const column of ["tok_s_per_user", "p95_ttft_ms"] as const) {
      const value = r[column];
      if (value !== null && !(value > 0)) {
        throw new Error(`${MODEL_OFFERS.file}: column "${column}" on line ${lineOf(i)} must be above 0`);
      }
    }
    if (selfHost && (r.price_tier !== "standard" || r.tok_s_per_user !== null)) {
      throw new Error(
        `${MODEL_OFFERS.file}: columns "price_tier" and "tok_s_per_user" on line ${lineOf(i)} must be "standard" and empty for a self-host row`,
      );
    }
  });

  t.seat_plans.forEach((r, i) => {
    if (r.overage_model_id !== null) {
      need(SEAT_PLANS.file, "overage_model_id", i, r.overage_model_id, ids.models, MODELS.file);
    }
    if (seatCapMtokPerUserMonth(r.included_usage_note) === null) {
      throw new Error(
        `${SEAT_PLANS.file}: column "included_usage_note" on line ${lineOf(i)} has no cap_mtok_per_user_month=N`,
      );
    }
  });

  t.quality.forEach((r, i) => {
    need(QUALITY.file, "model_id", i, r.model_id, ids.models, MODELS.file);
    if (r.benchmark.startsWith(COMPOSITE_PREFIX)) {
      need(
        QUALITY.file,
        "benchmark",
        i,
        r.benchmark.slice(COMPOSITE_PREFIX.length),
        ids.workloads,
        WORKLOADS.file,
      );
    }
  });

  t.workloads.forEach((r, i) =>
    checkModelMixCell(WORKLOADS.file, "default_model_mix", lineOf(i), r.default_model_mix),
  );
  t.case_studies.forEach((r, i) =>
    checkModelMixCell(CASE_STUDIES.file, "model_mix_json", lineOf(i), r.model_mix_json),
  );

  validateBuyingPatterns(t);

  const patternById = new Map(t.buying_patterns.map((p) => [p.pattern_id, p]));
  const patternIds = new Set(patternById.keys());
  const vendorOfModel = new Map(t.models.map((m) => [m.model_id, m.vendor]));
  const tierByOffer = new Map(t.model_offers.map((o) => [o.offer_id, o.price_tier]));
  const modelVendorByOffer = new Map(t.model_offers.map((o) => [o.offer_id, vendorOfModel.get(o.model_id)]));
  const customerWorkloads = new Set(t.workloads.filter((w) => w.basis === "customer").map((w) => w.workload_id));
  const shareSums = new Map<string, number>();
  t.baseline_providers.forEach((r, i) => {
    const file = BASELINE_PROVIDERS.file;
    need(file, "pattern_id", i, r.pattern_id, patternIds, BUYING_PATTERNS.file);
    const pattern = patternById.get(r.pattern_id) as BuyingPatternRow;
    if (pattern.kind === "best_single") {
      throw new Error(
        `${file}: column "pattern_id" on line ${lineOf(i)} names "${r.pattern_id}", a best_single pattern, which has no rows (compute derives it)`,
      );
    }
    need(file, "workload_id", i, r.workload_id, ids.workloads, WORKLOADS.file);
    if ((r.offer_id === null) === (r.plan_id === null)) {
      throw new Error(`${file}: columns "offer_id" and "plan_id" on line ${lineOf(i)}: fill exactly one`);
    }
    // Seat plans exist only in the seats pattern, and nobody buys seats for
    // customers: customer workloads are bought per token in every pattern.
    if (pattern.stage === "seats" && !customerWorkloads.has(r.workload_id)) {
      if (r.plan_id === null) throw new Error(`${file}: column "plan_id" on line ${lineOf(i)} is required for pattern ${r.pattern_id}`);
      need(file, "plan_id", i, r.plan_id, ids.plans, SEAT_PLANS.file);
    } else {
      if (r.offer_id === null) {
        throw new Error(`${file}: column "offer_id" on line ${lineOf(i)} is required for pattern ${r.pattern_id} and customer workloads`);
      }
      need(file, "offer_id", i, r.offer_id, ids.offers, MODEL_OFFERS.file);
      // Today buys at list price; batch and flex rows belong to InfraVana's G4 speed step only (BD-11).
      if (tierByOffer.get(r.offer_id) !== "standard") {
        throw new Error(
          `${file}: column "offer_id" on line ${lineOf(i)} names "${r.offer_id}", which is not a standard-tier offer`,
        );
      }
      // A vendor end-to-end pattern buys only that vendor's models.
      if (pattern.kind === "vendor_end_to_end") {
        const vendor = modelVendorByOffer.get(r.offer_id);
        if (vendor !== pattern.vendor) {
          throw new Error(
            `${file}: column "offer_id" on line ${lineOf(i)} buys "${r.offer_id}", a model of vendor "${vendor}", but pattern ${r.pattern_id} is an end-to-end pattern of vendor "${pattern.vendor}"`,
          );
        }
      }
    }
    const key = `${r.pattern_id}|${r.workload_id}`;
    shareSums.set(key, (shareSums.get(key) ?? 0) + r.share_default);
  });
  for (const [key, sum] of shareSums) {
    if (Math.abs(sum - 1) > SHARE_SUM_TOLERANCE) {
      const [pattern, workload] = key.split("|");
      throw new Error(
        `${BASELINE_PROVIDERS.file}: column "share_default" for pattern ${pattern} and workload ${workload} sums to ${sum}, not 1`,
      );
    }
  }
}

/** Structure of buying_patterns.csv (spec 7.4): ids, one typical buyer per stage, rank labelling. */
function validateBuyingPatterns(t: Tables): void {
  const file = BUYING_PATTERNS.file;
  const seen = new Set<string>();
  t.buying_patterns.forEach((p, i) => {
    const where = `${file}: column`;
    if (seen.has(p.pattern_id)) {
      throw new Error(`${where} "pattern_id" on line ${lineOf(i)} repeats "${p.pattern_id}"`);
    }
    seen.add(p.pattern_id);
    if (p.kind === "way_to_buy" && p.stage === null) {
      throw new Error(`${where} "stage" on line ${lineOf(i)} is required for a way_to_buy pattern`);
    }
    if (p.kind !== "way_to_buy" && p.stage !== null) {
      throw new Error(`${where} "stage" on line ${lineOf(i)} must be empty for a ${p.kind} pattern`);
    }
    if (p.kind === "vendor_end_to_end" && p.vendor === null) {
      throw new Error(`${where} "vendor" on line ${lineOf(i)} is required for a vendor_end_to_end pattern`);
    }
  });
  for (const stage of STAGES) {
    const typical = t.buying_patterns.filter((p) => p.kind === "way_to_buy" && p.stage === stage);
    if (typical.length !== 1) {
      throw new Error(`${file}: column "stage" needs exactly one way_to_buy pattern for stage "${stage}", found ${typical.length}`);
    }
  }
  if (t.buying_patterns.filter((p) => p.kind === "best_single").length > 1) {
    throw new Error(`${file}: column "kind" has more than one best_single pattern`);
  }

  // Popularity: one rank per pattern per stage, only for patterns that have rows.
  const popFile = PATTERN_POPULARITY.file;
  const kindOf = new Map(t.buying_patterns.map((p) => [p.pattern_id, p.kind]));
  const ranked = new Set<string>();
  t.pattern_popularity.forEach((r, i) => {
    const where = `${popFile}: column`;
    const kind = kindOf.get(r.pattern_id);
    if (kind === undefined) {
      throw new Error(`${where} "pattern_id" on line ${lineOf(i)} refers to "${r.pattern_id}", which is not in ${file}`);
    }
    if (kind === "best_single") {
      throw new Error(`${where} "pattern_id" on line ${lineOf(i)} names the best_single pattern, which is derived and never ranked`);
    }
    if (!Number.isInteger(r.popularity_rank) || r.popularity_rank < 1) {
      throw new Error(`${where} "popularity_rank" on line ${lineOf(i)} must be a whole number from 1`);
    }
    const key = `${r.pattern_id}|${r.stage}`;
    if (ranked.has(key)) {
      throw new Error(`${where} "stage" on line ${lineOf(i)} ranks "${r.pattern_id}" twice for stage "${r.stage}"`);
    }
    ranked.add(key);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches and validates every table under `baseUrl` (a folder URL such as
 * `"/data"`), returning the typed `Tables` for `compute()`.
 */
export async function loadTables(baseUrl: string): Promise<Tables> {
  const specs = [
    HARDWARE,
    THROUGHPUT_CURVES,
    MODELS,
    MODEL_OFFERS,
    SEAT_PLANS,
    QUALITY,
    WORKLOADS,
    BUYING_PATTERNS,
    PATTERN_POPULARITY,
    BASELINE_PROVIDERS,
    CASE_STUDIES,
  ];
  const [manifestText, ...csvTexts] = await Promise.all([
    fetchText(baseUrl, MANIFEST_FILE),
    ...specs.map((spec) => fetchText(baseUrl, spec.file)),
  ]);
  const rows = specs.map((spec, i) => parseTable<unknown>(spec, csvTexts[i] as string));

  const tables: Tables = {
    hardware: rows[0] as HardwareRow[],
    throughput_curves: rows[1] as ThroughputCurveRow[],
    models: rows[2] as ModelRow[],
    model_offers: rows[3] as ModelOfferRow[],
    seat_plans: rows[4] as SeatPlanRow[],
    quality: rows[5] as QualityRow[],
    workloads: rows[6] as WorkloadRow[],
    buying_patterns: rows[7] as BuyingPatternRow[],
    pattern_popularity: rows[8] as PatternPopularityRow[],
    baseline_providers: rows[9] as BaselineProviderRow[],
    case_studies: rows[10] as CaseStudyRow[],
    manifest: parseManifest(manifestText),
  };
  validateReferences(tables);
  return tables;
}

/**
 * Fetches `scenarios/<id>.json` under `baseUrl` and validates it as a spec
 * 7.1 stage-2 response.
 */
export async function loadScenario(baseUrl: string, id: string): Promise<ScenarioResponse> {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new Error(`scenario id "${id}" may only contain letters, digits, "_" and "-"`);
  }
  const file = `scenarios/${id}.json`;
  const text = await fetchText(baseUrl, file);
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${file}: not valid JSON (${reason})`);
  }
  // hardware.csv is needed only to check an explicit `tiers_allowed` list.
  const listsHardware =
    isRecord(json) && isRecord(json.scenario) && Array.isArray(json.scenario.tiers_allowed);
  const hardwareIds = listsHardware
    ? new Set(
        parseTable<HardwareRow>(HARDWARE, await fetchText(baseUrl, HARDWARE.file)).map((h) => h.hw_id),
      )
    : new Set<string>();
  // buying_patterns.csv is needed only to check an explicit `comparator`.
  const namesComparator = isRecord(json) && isRecord(json.scenario) && json.scenario.comparator !== undefined;
  const patternIds = namesComparator
    ? new Set(
        parseTable<BuyingPatternRow>(BUYING_PATTERNS, await fetchText(baseUrl, BUYING_PATTERNS.file)).map(
          (p) => p.pattern_id,
        ),
      )
    : new Set<string>();
  return parseScenarioResponse(file, json, { hardwareIds, patternIds });
}
