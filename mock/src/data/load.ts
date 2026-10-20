/**
 * Data loader (spec 7.3): fetches the nine CSVs and `manifest.json` under a
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
  CaseStudyRow,
  HardwareRow,
  Manifest,
  ModelOfferRow,
  ModelRow,
  QualityRow,
  ScenarioResponse,
  SeatPlanRow,
  Tables,
  ThroughputCurveRow,
  WorkloadRow,
} from "../contract";
import {
  BASELINE_PROVIDERS,
  CASE_STUDIES,
  HARDWARE,
  LATENCY_CLASSES,
  MODEL_OFFERS,
  MODELS,
  QUALITY,
  SEAT_PLANS,
  THROUGHPUT_CURVES,
  WORKLOADS,
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

  const shareSums = new Map<string, number>();
  t.baseline_providers.forEach((r, i) => {
    const file = BASELINE_PROVIDERS.file;
    need(file, "workload_id", i, r.workload_id, ids.workloads, WORKLOADS.file);
    if ((r.offer_id === null) === (r.plan_id === null)) {
      throw new Error(`${file}: columns "offer_id" and "plan_id" on line ${lineOf(i)}: fill exactly one`);
    }
    if (r.stage === "seats") {
      if (r.plan_id === null) throw new Error(`${file}: column "plan_id" on line ${lineOf(i)} is required for stage seats`);
      need(file, "plan_id", i, r.plan_id, ids.plans, SEAT_PLANS.file);
    } else {
      if (r.offer_id === null) throw new Error(`${file}: column "offer_id" on line ${lineOf(i)} is required for stage ${r.stage}`);
      need(file, "offer_id", i, r.offer_id, ids.offers, MODEL_OFFERS.file);
    }
    const key = `${r.stage}|${r.workload_id}`;
    shareSums.set(key, (shareSums.get(key) ?? 0) + r.share_default);
  });
  for (const [key, sum] of shareSums) {
    if (Math.abs(sum - 1) > SHARE_SUM_TOLERANCE) {
      const [stage, workload] = key.split("|");
      throw new Error(
        `${BASELINE_PROVIDERS.file}: column "share_default" for stage ${stage} and workload ${workload} sums to ${sum}, not 1`,
      );
    }
  }
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
    baseline_providers: rows[7] as BaselineProviderRow[],
    case_studies: rows[8] as CaseStudyRow[],
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
  return parseScenarioResponse(file, json, hardwareIds);
}
