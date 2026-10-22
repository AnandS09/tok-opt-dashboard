/**
 * Column contracts for the eleven CSVs (spec 7.3, mock/public/data/README.md).
 * A table is valid when its header row has exactly these columns and every
 * cell has the kind declared here. A trailing `?` marks a column that may be
 * empty (parsed as `null`).
 */

import type {
  CurveProvenance,
  HardwareClass,
  LatencyClass,
  ModelLicense,
  ModelTier,
  GoalId,
  OfferChannel,
  PatternKind,
  PricingRule,
  Stage,
  Verdict,
  WorkloadBasis,
} from "../contract";

export type ColumnKind = "string" | "number" | "string?" | "number?";

export interface TableSpec {
  file: string;
  columns: Readonly<Record<string, ColumnKind>>;
  /** Allowed values for enumerated text columns. */
  enums?: Readonly<Record<string, readonly string[]>>;
}

export const STAGES = ["seats", "api", "platform"] as const satisfies readonly Stage[];
export const TIERS = ["frontier", "mid", "small"] as const satisfies readonly ModelTier[];
export const LICENSES = ["proprietary", "open"] as const satisfies readonly ModelLicense[];
export const HARDWARE_CLASSES = ["gpu", "accelerator"] as const satisfies readonly HardwareClass[];
export const CHANNELS = [
  "direct",
  "bedrock",
  "ec2",
  "neocloud",
  "self-host",
] as const satisfies readonly OfferChannel[];
export const CURVE_PROVENANCES = ["measured", "modelled"] as const satisfies readonly CurveProvenance[];
export const LATENCY_CLASSES = ["interactive", "standard", "batch"] as const satisfies readonly LatencyClass[];
export const VERDICTS = ["ok", "off_topic", "unsafe", "unclear"] as const satisfies readonly Verdict[];
export const WORKLOAD_BASES = ["employee", "customer"] as const satisfies readonly WorkloadBasis[];
export const DEMAND_UNITS = ["people", "workflows"] as const;
export const PATTERN_KINDS = ["way_to_buy", "vendor_end_to_end", "best_single"] as const satisfies readonly PatternKind[];
export const PRICING_RULES = ["list", "commit"] as const satisfies readonly PricingRule[];
export const GOALS = ["G1", "G2", "G3", "G4"] as const satisfies readonly GoalId[];

const SEAT_CAP_PATTERN = /cap_mtok_per_user_month=(\d+(?:\.\d+)?)/;

/**
 * Reads the usage cap (million tokens per user per month) from a seat plan's
 * `included_usage_note`, following the convention documented on
 * `SeatPlanRow` in contract.ts. Null when the note carries no cap.
 */
export function seatCapMtokPerUserMonth(note: string): number | null {
  const match = SEAT_CAP_PATTERN.exec(note);
  return match === null ? null : Number(match[1]);
}

export const HARDWARE: TableSpec = {
  file: "hardware.csv",
  columns: {
    hw_id: "string",
    vendor: "string",
    class: "string",
    usd_per_hr: "number",
    hr_price_source: "string",
    power_kw: "number",
  },
  enums: { class: HARDWARE_CLASSES },
};

export const THROUGHPUT_CURVES: TableSpec = {
  file: "throughput_curves.csv",
  columns: {
    model_id: "string",
    hw_id: "string",
    precision: "string",
    concurrency: "number",
    tok_s_per_user: "number",
    tok_s_per_gpu: "number",
    p95_ttft_ms: "number",
    p95_tok_latency_ms: "number",
    provenance: "string",
    run_url: "string?",
  },
  enums: { provenance: CURVE_PROVENANCES },
};

export const MODELS: TableSpec = {
  file: "models.csv",
  columns: {
    model_id: "string",
    family: "string",
    tier: "string",
    license: "string",
    vendor: "string",
  },
  enums: { tier: TIERS, license: LICENSES },
};

export const MODEL_OFFERS: TableSpec = {
  file: "model_offers.csv",
  columns: {
    offer_id: "string",
    model_id: "string",
    channel: "string",
    region: "string",
    usd_per_mtok_in: "number?",
    usd_per_mtok_out: "number?",
    commit_discount_pct: "number",
    min_commit_usd: "number?",
    provisioned_usd_per_hr: "number?",
    source_url: "string",
    as_of: "string",
  },
  enums: { channel: CHANNELS },
};

export const SEAT_PLANS: TableSpec = {
  file: "seat_plans.csv",
  columns: {
    plan_id: "string",
    vendor: "string",
    usd_per_user_month: "number",
    included_usage_note: "string",
    overage_model_id: "string?",
  },
};

export const QUALITY: TableSpec = {
  file: "quality.csv",
  columns: {
    model_id: "string",
    benchmark: "string",
    score: "number",
    source_url: "string",
  },
};

export const WORKLOADS: TableSpec = {
  file: "workloads.csv",
  columns: {
    workload_id: "string",
    label: "string",
    tok_in_per_user_day: "number",
    tok_out_per_user_day: "number",
    quality_floor: "number",
    default_model_mix: "string",
    basis: "string",
  },
  enums: { basis: WORKLOAD_BASES },
};

export const BUYING_PATTERNS: TableSpec = {
  file: "buying_patterns.csv",
  columns: {
    pattern_id: "string",
    label: "string",
    kind: "string",
    stage: "string?",
    vendor: "string?",
    pricing_rule: "string",
    source_url: "string",
    as_of: "string",
  },
  enums: { kind: PATTERN_KINDS, stage: STAGES, pricing_rule: PRICING_RULES },
};

export const PATTERN_POPULARITY: TableSpec = {
  file: "pattern_popularity.csv",
  columns: {
    pattern_id: "string",
    stage: "string",
    popularity_rank: "number",
    popularity_source: "string",
  },
  enums: { stage: STAGES },
};

export const BASELINE_PROVIDERS: TableSpec = {
  file: "baseline_providers.csv",
  columns: {
    pattern_id: "string",
    workload_id: "string",
    offer_id: "string?",
    plan_id: "string?",
    share_default: "number",
  },
};

export const CASE_STUDIES: TableSpec = {
  file: "case_studies.csv",
  columns: {
    case_id: "string",
    label: "string",
    model_mix_json: "string",
    description: "string",
  },
};
