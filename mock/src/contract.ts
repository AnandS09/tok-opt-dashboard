/**
 * Shared contract for the static mock (spec.md v0.2). TYPES ONLY, no logic.
 *
 * Three parts of the app meet at this file:
 *   - compute engine : (Scenario, Tables) -> Results         (spec 7.2)
 *   - charts         : Results -> ChartDef / React component (spec 6)
 *   - album shell    : consumes ChartDef[] from charts/registry.ts (spec 4.1)
 *
 * It is the interface between them, so a change here changes all three.
 *
 * All fixture data behind these types is INVENTED PLACEHOLDER DATA.
 *
 * CSV row conventions (spec 7.3):
 *   - Field names equal the CSV column names exactly.
 *   - Rows are typed as they look AFTER parsing with PapaParse
 *     `{ header: true, dynamicTyping: true, skipEmptyLines: true }`:
 *     numeric columns are `number`, and an empty cell becomes `null`
 *     (so only columns that may legitimately be empty are `| null`).
 *   - JSON-in-a-cell columns (`model_mix_json`, `default_model_mix`) stay
 *     `string` here; the text is JSON of the type named in the comment.
 *   - Dates (`as_of`, `generated_at`) are ISO-8601 strings.
 */

import type { ComponentType } from "react";

// ---------------------------------------------------------------------------
// Shared enumerations
// ---------------------------------------------------------------------------

/** Spec 5 / 7.1 `stage_today`, and `baseline_providers.csv` `stage`. */
export type Stage = "seats" | "api" | "platform";

/** Spec 7.3 `models.csv` `tier`; also the "model class" of chart C3 (spec 6). */
export type ModelTier = "frontier" | "mid" | "small";

/** Spec 7.3 `models.csv` `license`. */
export type ModelLicense = "proprietary" | "open";

/** Spec 7.3 `hardware.csv` `class`. */
export type HardwareClass = "gpu" | "accelerator";

/** Spec 7.3 `model_offers.csv` `channel`. */
export type OfferChannel =
  | "direct"
  | "bedrock"
  | "azure"
  | "neocloud"
  | "self-host";

/** Spec 7.1 `latency_class`. */
export type LatencyClass = "interactive" | "standard" | "batch";

/** Spec 7.1 `unit`. */
export type DemandUnit = "people" | "workflows";

/** Spec 7.1 `verdict`. */
export type Verdict = "ok" | "off_topic" | "unsafe" | "unclear";

/** Spec 6 chart registry ids. */
export type ChartId =
  | "C1"
  | "C2"
  | "C3"
  | "C4"
  | "C5"
  | "C6"
  | "C7"
  | "C8"
  | "C9";

/**
 * Spec 9 provenance values. The throughput CSV only ever carries `measured`
 * or `modelled` (spec 7.3, see CurveProvenance); `vendor_reported` exists for
 * result series built from vendor price pages (spec 9).
 *
 * Badge rule: every series whose provenance is not `measured` is badged, with
 * the text "modelled" or "vendor-reported". Only a `measured` series is
 * unbadged. This follows spec 9 (a badge for each value) over spec 7.3 ("no
 * badge means measured", which would let a vendor-reported series read as
 * measured). It is a bootstrap default to be revisited.
 *
 * Reducing several provenances to one ("worst of the parts"): `modelled`
 * beats `vendor_reported`, which beats `measured`. So a series is `measured`
 * only if every input to it is measured.
 */
export type Provenance = "measured" | "modelled" | "vendor_reported";

/** Spec 7.3 `throughput_curves.csv` `provenance` column. */
export type CurveProvenance = "measured" | "modelled";

// ---------------------------------------------------------------------------
// CSV row types (spec 7.3), one per file
// ---------------------------------------------------------------------------

/** Spec 7.3 `hardware.csv`. */
export interface HardwareRow {
  hw_id: string;
  vendor: string;
  class: HardwareClass;
  usd_per_hr: number;
  hr_price_source: string;
  power_kw: number;
}

/** Spec 7.3 `throughput_curves.csv`. One row per concurrency point of a sweep. */
export interface ThroughputCurveRow {
  model_id: string;
  hw_id: string;
  precision: string;
  concurrency: number;
  tok_s_per_user: number;
  tok_s_per_gpu: number;
  p95_ttft_ms: number;
  p95_tok_latency_ms: number;
  provenance: CurveProvenance;
  /** Link to the run; null when the row has no run to link. */
  run_url: string | null;
}

/** Spec 7.3 `models.csv`. */
export interface ModelRow {
  model_id: string;
  family: string;
  tier: ModelTier;
  license: ModelLicense;
  vendor: string;
}

/** Spec 7.3 `model_offers.csv`. One row per way to buy a model. */
export interface ModelOfferRow {
  offer_id: string;
  model_id: string;
  channel: OfferChannel;
  region: string;
  /**
   * USD per million input tokens. Null for `self-host` rows, which have no
   * token price: cost them from `hardware.usd_per_hr` and the
   * `throughput_curves.tok_s_per_gpu` of the model on that hardware. Never
   * treat null as 0.
   */
  usd_per_mtok_in: number | null;
  /** USD per million output tokens. Null for `self-host` rows (see above). */
  usd_per_mtok_out: number | null;
  /** Percent, e.g. 10 means 10%. Use 0 when there is no discount. */
  commit_discount_pct: number;
  /** Empty (null) when there is no minimum commitment. */
  min_commit_usd: number | null;
  /** Empty (null) when the offer has no provisioned-throughput pricing. */
  provisioned_usd_per_hr: number | null;
  source_url: string;
  /** ISO date the price was captured (spec 12 BD-2, BD-5). */
  as_of: string;
}

/**
 * Spec 7.3 `seat_plans.csv` (the "Seats" stage).
 *
 * Convention for the usage cap that spec 7.2 (Seats) needs but 7.3 has no
 * column for: `included_usage_note` begins with `cap_mtok_per_user_month=N`
 * (N a number, million tokens per user per month), optionally preceded by a
 * bracketed tag such as `[placeholder] `. Tokens above the cap are billed on
 * `overage_model_id` at direct list price. A numeric column in the CSV schema
 * would replace this convention.
 */
export interface SeatPlanRow {
  plan_id: string;
  vendor: string;
  usd_per_user_month: number;
  included_usage_note: string;
  /** Model that heavy users overflow to on API pricing; null if none. */
  overage_model_id: string | null;
}

/**
 * Spec 7.3 `quality.csv`: benchmark scores, one row per model and benchmark.
 * The spec's "derived composite_score per workload type" is NOT a column.
 * It is stored as precomputed rows: one per model and workload, whose
 * `benchmark` value starts with the prefix `composite:`. Readers must filter
 * on that prefix to tell composite rows from raw benchmark rows, and the
 * engine reads the composite rows rather than recomputing them.
 */
export interface QualityRow {
  model_id: string;
  benchmark: string;
  score: number;
  source_url: string;
}

/** Spec 7.3 `workloads.csv`. */
export interface WorkloadRow {
  workload_id: string;
  label: string;
  tok_in_per_user_day: number;
  tok_out_per_user_day: number;
  /** Benchmark score floor for this workload type (spec 5 "Quality floor"). */
  quality_floor: number;
  /** JSON text of a ModelMix. */
  default_model_mix: string;
}

/**
 * Spec 7.3 `baseline_providers.csv`: defines "today" for each stage.
 * Exactly one of `offer_id` / `plan_id` is non-null: `plan_id` for stage
 * `seats`, `offer_id` for `api` and `platform` (spec 7.2 step 2).
 */
export interface BaselineProviderRow {
  stage: Stage;
  workload_id: string;
  offer_id: string | null;
  plan_id: string | null;
  /** Share of the workload's traffic bought this way, 0..1. */
  share_default: number;
}

/** Spec 7.3 `case_studies.csv`. Drives the case-study presets (spec 6). */
export interface CaseStudyRow {
  case_id: string;
  label: string;
  /** JSON text of a ModelMix. */
  model_mix_json: string;
  description: string;
}

/**
 * Spec 7.3 `manifest.json` ("file versions, row counts, checksums,
 * generated_at"). The spec fixes only those four notions, not the key names;
 * the names below are this contract's choice and match
 * `public/data/manifest.json`.
 */
export interface Manifest {
  data_version: string;
  generated_at: string;
  /** True when the whole data set is invented placeholder data. */
  placeholder?: boolean;
  /** Human-readable notice for the footer when `placeholder` is true. */
  notice?: string;
  /** Numeric inputs to `compute()` that are not in any CSV (spec 7.2 step 1). */
  parameters: {
    /** Working days per quarter, for demand = users x tokens/day x days. */
    working_days_per_quarter: number;
    /** Converts monthly seat prices and usage caps to a quarter. */
    months_per_quarter: number;
    /**
     * Maps each `LatencyClass` to a point on the interactivity axis (spec 5
     * "Latency target"). A throughput point qualifies when its
     * `tok_s_per_user` is at least `min_tok_s_per_user` and, when
     * `max_p95_ttft_ms` is not null, its `p95_ttft_ms` is at most that.
     */
    latency_classes: Record<
      LatencyClass,
      { min_tok_s_per_user: number; max_p95_ttft_ms: number | null }
    >;
  };
  files: Record<
    string,
    {
      version: string;
      row_count: number;
      checksum: string;
      placeholder?: boolean;
    }
  >;
}

/** All parsed tables, the `tables` argument of `compute(scenario, tables)` (spec 7.2). */
export interface Tables {
  hardware: HardwareRow[];
  throughput_curves: ThroughputCurveRow[];
  models: ModelRow[];
  model_offers: ModelOfferRow[];
  seat_plans: SeatPlanRow[];
  quality: QualityRow[];
  workloads: WorkloadRow[];
  baseline_providers: BaselineProviderRow[];
  case_studies: CaseStudyRow[];
  manifest: Manifest;
}

// ---------------------------------------------------------------------------
// Scenario (spec 7.1)
// ---------------------------------------------------------------------------

/** Spec 7.1 `scenario.baseline` and `scenario.target`. */
export interface ScenarioState {
  users: number;
  budget_usd_per_quarter: number;
}

/**
 * Spec 7.1 `model_mix` and spec 5 "Model mix" knob.
 * `frontier + mid + small` sums to 1. The 7.1 example omits `small`; it is
 * required here and is 0 when the example's two shares already sum to 1.
 * `open_weight_share` is an independent 0..1 proprietary/open split.
 */
export interface ModelMix {
  frontier: number;
  mid: number;
  small: number;
  open_weight_share: number;
}

/**
 * Spec 7.1 `scenario` object: the single object all knobs bind to (spec 5)
 * and the first argument of `compute()` (spec 7.2).
 */
export interface Scenario {
  /** Always present. */
  baseline: ScenarioState;
  /** Present only for scaling prompts (S2); its presence triggers chart C7. */
  target?: ScenarioState;
  /** Keys are `workload_id`s from workloads.csv; values sum to 1. */
  workload_mix: Record<string, number>;
  model_mix: ModelMix;
  /** Free-text model names the user mentioned, e.g. ["opus", "fable"]. */
  named_models: string[];
  /** Spec 5 "Where you are today". */
  stage_today: Stage;
  /** `"all"` or a list of `hw_id`s from hardware.csv. */
  tiers_allowed: "all" | string[];
  latency_class: LatencyClass;
  unit: DemandUnit;
  /**
   * Spec 5 "Quality floor" knob (not in the 7.1 JSON). A benchmark score applied to every
   * workload type, same scale as `QualityRow.score` and
   * `WorkloadRow.quality_floor`. When absent, each workload uses its own
   * `quality_floor` from workloads.csv. Both sides of every comparison use
   * the same floor (spec 9).
   */
  quality_floor?: number;
}

/**
 * Spec 7.1 whole stage-2 LLM response: the verdict envelope around a
 * Scenario. `verdict` lives here, not on Scenario (spec 7.1 JSON shape).
 * If `verdict !== "ok"` no dashboard renders (spec 7.1 behaviour).
 */
export interface ScenarioResponse {
  verdict: Verdict;
  /** Shown only if verdict != ok. */
  reason_for_user: string;
  scenario: Scenario;
  /**
   * Chart ids picked by the LLM (spec 6 selection rules). May name ids that
   * have no entry in the chart registry. The album shell skips those ids and
   * counts only registered charts in the filmstrip and its "n/N" label.
   */
  charts: ChartId[];
  /** Fields the user did not state, filled with CSV-backed defaults. */
  missing: string[];
  /** Two-sentence plain-English summary. */
  narrative: string;
}

// ---------------------------------------------------------------------------
// Results (spec 7.2 step 5; consumed by charts C1, C3, C5 of spec 6)
// ---------------------------------------------------------------------------

/**
 * Provenance of the two sides of a comparison, so a modelled series can be
 * badged (spec 9). A side's value is the worst of the provenances of its
 * parts (see `Provenance`). Chart code badges a side whenever it is not
 * `measured`. Parts carry their own `provenance` where a side is made of
 * segments or rows, so a mixed side can badge each part.
 */
export interface SideProvenance {
  today: Provenance;
  infravana: Provenance;
}

/** Spec 6 C1: where savings on the Infravana bar come from (spec 7.2 step 3). */
export type SavingsSource = "arbitrage" | "routing";

/**
 * A segment of a C1 bar that is money actually spent.
 * `kind` says what `label` names:
 *   - `provider`: anything priced per token: an API channel (offer channel
 *     `direct`, `bedrock`, `azure` or `neocloud`) or a seat plan vendor,
 *     labelled by channel or vendor name (e.g. "Bedrock", "neocloud").
 *   - `hardware`: only offer channel `self-host`, which is costed from
 *     hardware prices rather than token prices, labelled by hardware id
 *     (e.g. "h200").
 */
export interface SpendSegment {
  label: string;
  kind: "provider" | "hardware";
  usd: number;
  /** Provenance of the data behind this spend. */
  provenance: Provenance;
}

/**
 * A segment of the Infravana C1 bar that is money no longer needed for the
 * same work, so both bars keep the same total (spec 6 C1). `arbitrage` is a
 * better deal on the same proprietary model; `routing` is moving traffic to
 * cheaper models or hardware.
 */
export interface SavingsSegment {
  label: string;
  kind: "savings";
  usd: number;
  savings_source: SavingsSource;
  /** Provenance of the data behind this saving. */
  provenance: Provenance;
}

export type AllocationSegment = SpendSegment | SavingsSegment;

/** Spec 6 C1: budget allocation, today vs Infravana (two stacked bars). */
export interface AllocationResult {
  /**
   * Quarterly USD: today's cost of the workload. Both bars total this: the
   * `usd` of every segment in `today` sums to it, and so does every segment
   * in `infravana` (its spend segments plus its savings segments). It is not
   * the budget, which can be higher or lower.
   */
  total_usd: number;
  /** The scenario's quarterly budget, for a reference marker on the bars. */
  budget_usd: number;
  /** Today bar: spend segments only. */
  today: SpendSegment[];
  /** Infravana bar: spend segments, then savings segments. */
  infravana: AllocationSegment[];
  /** Worst of the segment provenances on each side. */
  provenance: SideProvenance;
}

/** One group of C3's grouped bars: a model class, today vs Infravana. */
export interface CostPerMtokRow {
  model_class: ModelTier;
  /** USD per million tokens; null if the scenario uses no model of this class. */
  today_usd_per_mtok: number | null;
  infravana_usd_per_mtok: number | null;
  /** Provenance of today's value. `measured` when the value is null (nothing to badge). */
  today_provenance: Provenance;
  /** Provenance of Infravana's value. `measured` when the value is null. */
  infravana_provenance: Provenance;
}

/** Spec 6 C3: cost per million tokens by model class, at the latency target. */
export interface CostPerMtokResult {
  /** The latency target both sides were computed at (spec 6 C3, spec 9). */
  latency_class: LatencyClass;
  /**
   * Always exactly three rows, in the order frontier, mid, small, with null
   * values for a class the scenario does not use.
   */
  by_model_class: CostPerMtokRow[];
  /** Worst of the row provenances on each side. */
  provenance: SideProvenance;
}

/** Spec 6 C5: tokens bought for the budget (bar pair plus delta label). */
export interface TokensBoughtResult {
  /** The quarterly budget both sides spend. */
  budget_usd: number;
  /**
   * Tokens per quarter the workload needs (spec 7.2 step 1). A side's
   * covered fraction is its tokens divided by this; above 1 means headroom.
   * The "Budget covers only X%" banner (spec 5) uses the Today side:
   * X = today_tokens / demand_tokens, shown when that is below 1.
   */
  demand_tokens: number;
  /** Tokens per quarter the budget buys today. */
  today_tokens: number;
  /** Tokens per quarter the same budget buys with Infravana. */
  infravana_tokens: number;
  provenance: SideProvenance;
}

/**
 * Spec 4.1 headline strip numbers ("Same budget: 2.4x tokens | -38% cost").
 * Derived from the series of C1 and C5 by the compute engine.
 */
export interface Headline {
  /** Infravana tokens divided by today tokens: 2.4 means "2.4x the tokens". */
  tokens_multiple: number;
  /**
   * The sum of the Infravana savings segments in C1 divided by
   * `allocation.total_usd`, times 100: 38 means "-38% cost". Never negative.
   */
  cost_savings_pct: number;
}

/**
 * Output of `compute(scenario, tables)` (spec 7.2): exactly what charts C1,
 * C3 and C5 (spec 6) and the headline strip (spec 4.1) need. Charts C2, C4
 * and C6 to C9 add their own fields in later build steps.
 */
export interface Results {
  headline: Headline;
  /** Spec 6 C1. */
  allocation: AllocationResult;
  /** Spec 6 C3. */
  cost_per_mtok: CostPerMtokResult;
  /** Spec 6 C5. */
  tokens_bought: TokensBoughtResult;
  /**
   * The quality floor in effect per workload, for display next to the
   * headline (spec 9). Keys are `workload_id`s; each value is
   * `scenario.quality_floor` if set, else that workload's own
   * `quality_floor` from workloads.csv.
   */
  quality_floor_by_workload: Record<string, number>;
  /**
   * The share of all demanded tokens (0 to 1) that Infravana actually moved
   * to open-weight models. It never exceeds the scenario's
   * `model_mix.open_weight_share`, and is lower when a workload has no
   * eligible open-weight model or when moving a share would not save money,
   * so the page can say "0.4 asked, 0.3 possible". Always set by
   * `compute()`.
   */
  effective_open_share: number;
  /**
   * The `workload_id`s (in workloads.csv order, only those in the scenario's
   * mix) whose baseline model scores below the quality floor in effect, so
   * the floor shown next to the headline is one Today itself does not meet.
   * A baseline model with no composite score for the workload also counts.
   * Empty when every baseline model meets its floor. Always set by
   * `compute()`.
   */
  floor_unmet_workloads: string[];
}

// ---------------------------------------------------------------------------
// Chart registry types (spec 6, spec 4.1 "Thumbnails are live")
// ---------------------------------------------------------------------------

/**
 * Props of every chart component. `stage` is the large interactive render;
 * `thumb` is the small non-interactive filmstrip render of the same
 * component (spec 4.1).
 */
export interface ChartProps {
  results: Results;
  size: "stage" | "thumb";
}

/**
 * One registry entry (spec 6). Album order is the order of the array in
 * charts/registry.ts (spec 4.1: fixed by registry priority, not LLM order).
 */
export interface ChartDef {
  id: ChartId;
  title: string;
  /** One-sentence takeaway shown as the stage caption (spec 6, 14). */
  caption: (results: Results) => string;
  /**
   * Short plain-language explanation for the "How this is computed" drawer
   * (spec 4.1, 9). Static text; no jargon (spec 3).
   */
  howComputed: string;
  /**
   * CSV text (header row first, RFC 4180 quoting) of exactly the rows this
   * chart plots, for the "Download CSV" link (spec 4.1, 9).
   */
  toCsv: (results: Results) => string;
  Component: ComponentType<ChartProps>;
}
