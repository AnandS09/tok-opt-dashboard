/**
 * Shared contract for the static mock (spec.md v0.3). TYPES ONLY, no logic.
 *
 * Three parts of the app meet at this file:
 *   - compute engine : (Scenario, Tables) -> Results         (spec 7.2)
 *   - charts         : Results -> ChartDef / React component (spec 6)
 *   - stage shell    : consumes ChartDef[] from charts/registry.ts (spec 4.1)
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

/**
 * Spec 4.3 / 5 / A.2 `stage_today`, and `buying_patterns.csv` `stage` (the stage a
 * `way_to_buy` pattern is the typical buyer for). It stays a three-value
 * enum for the intake (spec 7.4).
 */
export type Stage = "seats" | "api" | "platform";

/**
 * Spec 6.1, 7.4: the id of a row of `buying_patterns.csv`. A string that
 * comes from data, not a fixed enum, so a new Today option is a CSV row.
 */
export type PatternId = string;

/** Spec 7.4 `buying_patterns.csv` `kind`. */
export type PatternKind = "way_to_buy" | "vendor_end_to_end" | "best_single";

/**
 * Spec 7.4 `buying_patterns.csv` `pricing_rule`: `list` prices at the offer's
 * list price, `commit` applies the offer's `commit_discount_pct` when the
 * list-price spend at that offer reaches its `min_commit_usd` (spec 12 BD-3).
 */
export type PricingRule = "list" | "commit";

/** Spec 6.2 goal tabs: G1 less money, G2 more AI, G3 more people, G4 trade-off. */
export type GoalId = "G1" | "G2" | "G3" | "G4";

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
  | "ec2"
  | "neocloud"
  | "self-host";

/** Spec 4.3 (speed step) and A.2 `latency_class`. */
export type LatencyClass = "interactive" | "standard" | "batch";

/**
 * `workloads.csv` `basis`: what a workload's demand scales with. `employee`
 * work scales with `ScenarioState.users`, `customer` work (AI in a product
 * sold to customers) with `ScenarioState.customers`.
 */
export type WorkloadBasis = "employee" | "customer";

/** Spec A.2 `unit` (the parked language-model call; 7.1 keeps the `Scenario` shape). */
export type DemandUnit = "people" | "workflows";

/** Spec A.2 `verdict` (the parked language-model call; the guided intake of 4.3 always yields `ok`). */
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
  | "C9"
  | "C10";

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
  /** For `customer` rows the two token columns are per customer per day, not per user. */
  basis: WorkloadBasis;
}

/**
 * Spec 7.3 / 7.4 `baseline_providers.csv`: what each buying pattern buys for
 * each workload. A row has exactly one of `offer_id` / `plan_id`: `plan_id`
 * names a seat plan, `offer_id` a per-token offer (spec 7.2 step 2). A
 * pattern with `kind = best_single` has no rows (compute derives it).
 */
export interface BaselineProviderRow {
  /** Foreign key to `buying_patterns.csv`. Replaces the v0.2 `stage` column. */
  pattern_id: PatternId;
  workload_id: string;
  offer_id: string | null;
  plan_id: string | null;
  /** Share of the workload's traffic bought this way, 0..1. */
  share_default: number;
}

/**
 * Spec 7.4 `buying_patterns.csv`: one row per Today option (spec 6.1).
 *
 *   - `way_to_buy` patterns carry the `stage` they are the typical buyer for
 *     (one per stage); `vendor_end_to_end` patterns have an empty stage and
 *     name their `vendor` (every offer in their baseline rows is a model of
 *     that vendor); the `best_single` row has no baseline rows.
 *   - Popularity is not here: it differs by the visitor's stage, so it lives
 *     in `pattern_popularity.csv` (`PatternPopularityRow`).
 */
export interface BuyingPatternRow {
  pattern_id: PatternId;
  label: string;
  kind: PatternKind;
  stage: Stage | null;
  vendor: string | null;
  pricing_rule: PricingRule;
  source_url: string;
  /** ISO date the pattern was captured (spec 12 BD-2, BD-5). */
  as_of: string;
}

/**
 * Spec 7.4 `popularity_rank`: one integer rank per pattern per stage. Row
 * (`pattern_id`, `stage`) says how popular the pattern is among visitors
 * whose `stage_today` is `stage`; lower is more popular, ties are broken by
 * `pattern_id`. A pattern with no row for a stage is never a default grey
 * option for that stage. The mock's ranks are invented, labelled in
 * `popularity_source`.
 */
export interface PatternPopularityRow {
  pattern_id: PatternId;
  stage: Stage;
  /** A whole number from 1. */
  popularity_rank: number;
  popularity_source: string;
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
  buying_patterns: BuyingPatternRow[];
  pattern_popularity: PatternPopularityRow[];
  baseline_providers: BaselineProviderRow[];
  case_studies: CaseStudyRow[];
  manifest: Manifest;
}

// ---------------------------------------------------------------------------
// Scenario (spec 7.1 stub; the JSON it keeps the shape of is in spec A.2)
// ---------------------------------------------------------------------------

/** Spec A.2 `scenario.baseline` and `scenario.target`. */
export interface ScenarioState {
  users: number;
  budget_usd_per_quarter: number;
  /** Customers using AI in the product; absent means none. Scales `customer` workloads only. */
  customers?: number;
}

/**
 * Spec A.2 `model_mix` and spec 5 "Model mix" knob.
 * `frontier + mid + small` sums to 1. The A.2 example omits `small`; it is
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
 * Spec 7.1 / A.2 `scenario` object: the single object all knobs bind to (spec 5)
 * and the first argument of `compute()` (spec 7.2).
 */
export interface Scenario {
  /** Always present. */
  baseline: ScenarioState;
  /** Present only for scaling prompts (S2); its presence triggers chart C7. */
  target?: ScenarioState;
  /**
   * Keys are `workload_id`s from workloads.csv. Values sum to 1 within each
   * `basis`: employee shares split the users, customer shares the customers.
   */
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
   * Spec 5 "Quality floor" knob (not in the A.2 JSON). A benchmark score applied to every
   * workload type, same scale as `QualityRow.score` and
   * `WorkloadRow.quality_floor`. When absent, each workload uses its own
   * `quality_floor` from workloads.csv. Both sides of every comparison use
   * the same floor (spec 9).
   */
  quality_floor?: number;
  /**
   * Spec 6.1: the Today option InfraVana is measured against, a
   * `buying_patterns.csv` `pattern_id`. Absent means the typical buyer for
   * `stage_today` (the `way_to_buy` pattern whose `stage` equals it).
   */
  comparator?: PatternId;
  /** Spec 6.2: the active goal tab. Absent means `G1`. */
  goal?: GoalId;
  /**
   * Spec 6.2 G4: the give-up the visitor accepts. It is read only while
   * `goal` is `G4`, and `compute()` applies it to the InfraVana plan only;
   * Today never changes. Step 0 of each control means no give-up; each
   * further step gives up one more level (see `Tradeoff`).
   */
  tradeoff?: Tradeoff;
}

/**
 * Spec 6.2 G4 `tradeoff`: two separate stepped controls, whole numbers from 0.
 *
 *   - `quality_step`: InfraVana's quality floor for each workload drops to
 *     the next lower distinct composite score of `quality.csv` for that
 *     workload, `quality_step` times (it stops at the lowest score). It acts
 *     on the open-weight share only (spec 12 BD-8).
 *   - `speed_step`: InfraVana's latency class moves down the list
 *     interactive, standard, batch, `speed_step` times (it stops at batch).
 *     Moving a proprietary offer to a batch or flex price tier waits for the
 *     speed rows of spec 12 BD-11.
 */
export interface Tradeoff {
  quality_step: number;
  speed_step: number;
}

/**
 * Spec A.2 whole stage-2 LLM response (parked; the example scenario files
 * still carry it): the verdict envelope around a Scenario. `verdict` lives
 * here, not on Scenario (spec A.2 JSON shape). If `verdict !== "ok"` no
 * dashboard renders (spec A.2 behaviour).
 */
export interface ScenarioResponse {
  verdict: Verdict;
  /** Shown only if verdict != ok. */
  reason_for_user: string;
  scenario: Scenario;
  /**
   * Chart ids picked by the LLM (spec 6 selection rules). May name ids that
   * have no entry in the chart registry. The stage shell skips those ids and
   * counts only registered charts in the index and its "n / N" label (spec 4.1).
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
 *     `direct`, `bedrock`, `ec2` or `neocloud`) or a seat plan vendor,
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
 * Spec 4.2 / 6.2 hero numbers ("Same budget: 2.4x tokens | -38% cost").
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
 * C3 and C5 (spec 6) and the hero (spec 4.2, 6.2) need. Charts C2, C4
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
  /**
   * Spec 6.1: the Today option every other figure in this `Results` is
   * measured against: `scenario.comparator`, else the typical buyer for
   * `stage_today`. The hero, the benefit boxes and every chart name it.
   */
  comparator: PatternId;
  /**
   * The floors and speed InfraVana was planned at. With no trade-off
   * (`goal` not `G4`, or both steps 0) they equal the Today-side values
   * `quality_floor_by_workload` and `scenario.latency_class`. In G4 the page
   * calls `compute()` twice, once at the visitor's own floors and once with
   * the trade-off, takes Today from the first call and shows both sides'
   * floors and speeds from the two calls (spec 6.2, 9).
   */
  infravana_side: InfravanaSide;
  /**
   * Spec 6.1, 7.4: every Today option that applies to the scenario's
   * workloads, in display order: the grey options first (`is_grey`, at most
   * four, in popularity order for `stage_today` with the typical buyer always among them, and
   * the comparator among them when it is not one by rank), then the rest by
   * popularity (unranked last), then the derived best single option. The
   * comparator itself is one of the entries. An option appears only if its
   * pattern has baseline rows for every workload in the mix.
   */
  today_alternatives: TodayAlternative[];
}

/** The quality floors and latency class the InfraVana side was planned at (spec 6.2 G4). */
export interface InfravanaSide {
  /** Keys are `workload_id`s, as in `Results.quality_floor_by_workload`. */
  quality_floor_by_workload: Record<string, number>;
  latency_class: LatencyClass;
}

/** One Today option in `Results.today_alternatives` (spec 6.1, 7.4). */
export interface TodayAlternative {
  pattern_id: PatternId;
  label: string;
  kind: PatternKind;
  /**
   * For the derived `best_single` option, the offer it picked in plain
   * ids (for example "mid_a via ec2 (useast)"); null for every other kind.
   */
  detail: string | null;
  /** True for the typical buyer for `stage_today`, listed once. */
  is_typical: boolean;
  /** True when this option is a grey bar by default or by being the comparator. */
  is_grey: boolean;
  /** Quarterly USD this option costs for the whole workload. */
  total_usd: number;
  /**
   * Tokens per quarter the budget buys at this option's average price:
   * demand tokens times budget divided by `total_usd` (0 when the cost is 0).
   */
  tokens_at_budget: number;
  /**
   * Token-weighted mean composite quality score of the models this option
   * buys, over all workloads; null when there is no demand.
   */
  quality_score: number | null;
  /** False when any model it buys scores below a workload's floor in effect (or has no score). */
  meets_floors: boolean;
  /** Worst provenance of the data behind this option's spend. */
  provenance: Provenance;
  /** USD per million tokens by model class, null where the option buys none of that class (C3 markers). */
  usd_per_mtok_by_class: Record<ModelTier, number | null>;
}

// ---------------------------------------------------------------------------
// Solver and frontier results (spec 6.2, 6.3)
// ---------------------------------------------------------------------------

/** Spec 6.2 `solveAtBudget` axis: scale all token intensity, or employee workloads only. */
export type SolveAxis = "intensity" | "users";

/** Spec 6.2 `solveAtBudget` result: each side's solved scale and tokens, at the budget. */
export interface SolveResult {
  axis: SolveAxis;
  /** Largest scale of the volume at which Today's spend stays within the budget. */
  today_scale: number;
  /** Same for InfraVana. */
  infravana_scale: number;
  /** `infravana_scale / today_scale`: "N times the AI work (or people) for your budget". */
  multiple: number;
  /** Tokens a quarter at the solved scale, each side. */
  today_tokens: number;
  infravana_tokens: number;
  /** True when the solved head-count was capped at the users range (spec 5.2, G3 only). */
  capped_at_users_max: boolean;
}

/** Spec 6.3 `frontier` axis: quality floor, or minimum tokens per second per user. */
export type FrontierAxis = "quality" | "speed";

/** One non-dominated point of the iso-cost frontier (spec 6.3). */
export interface FrontierPoint {
  /** The quality floor or minimum tok/s per user at this point. */
  threshold: number;
  /** Tokens a quarter the budget buys with InfraVana at this threshold. */
  infravana_tokens: number;
}

/** Spec 6.3 `frontier` result. */
export interface FrontierResult {
  axis: FrontierAxis;
  /** Points not beaten on both axes, ordered by threshold. */
  points: FrontierPoint[];
  /** The visitor's current setting on the axis (lowest workload floor, or the latency class's minimum speed). */
  current_threshold: number;
}

// ---------------------------------------------------------------------------
// Chart registry types (spec 6, spec 4.1 grid view of live thumbnails)
// ---------------------------------------------------------------------------

/**
 * Props of every chart component. `stage` is the large interactive render;
 * `thumb` is the small non-interactive grid-view render of the same
 * component (spec 4.1).
 */
export interface ChartProps {
  results: Results;
  size: "stage" | "thumb";
  /**
   * The goal tab the chart is drawn for (spec 6.2). Only a chart whose figures
   * change with the tab reads it (C5); the others ignore it. Absent means G1.
   */
  goalView?: GoalView;
}

/**
 * The active goal tab and, in G2 and G3, the state of its solve (spec 6.2).
 * `solve` is the latest result for the tab's own axis, or null while none has
 * arrived; `stale` is true while it belongs to an earlier input than the page
 * now shows, so a chart can dim it.
 */
export interface GoalView {
  goal: GoalId;
  solve: SolveResult | null;
  stale: boolean;
  /** The solver's failure message, or null. */
  error: string | null;
}

/**
 * One registry entry (spec 6). Stage order is the order of the array in
 * charts/registry.ts (spec 4.1: registry order, no language-model selection).
 */
export interface ChartDef {
  id: ChartId;
  title: string;
  /**
   * One-sentence takeaway: the chart's accessible name and table caption
   * (spec 6.4). The benefit boxes replace it on the page once they are built.
   */
  caption: (results: Results, goalView?: GoalView) => string;
  /**
   * Short plain-language explanation for the "How this is computed" drawer
   * (spec 9). Static text; no jargon (spec 3).
   */
  howComputed: string;
  /**
   * CSV text (header row first, RFC 4180 quoting) of exactly the rows this
   * chart plots, for the "Download CSV" link (spec 9).
   */
  toCsv: (results: Results) => string;
  /**
   * Spec 6.4 benefit boxes, in candidate order (the page shows the first
   * three that are non-zero and differ from the active tab's headline). Every
   * number is derived from `results` and `context`; none is typed. `caption`
   * stays as the chart's accessible name.
   */
  benefits: (results: Results, context: BenefitContext) => BenefitBox[];
  Component: ComponentType<ChartProps>;
}

/**
 * What the benefit boxes need besides `Results` (spec 6.4): the scenario,
 * the active goal tab and, for that tab, its solved volumes or frontier.
 */
export interface BenefitContext {
  scenario: Scenario;
  /** The active goal tab. */
  goal: GoalId;
  /** The `solveAtBudget` result for the active tab (G2 and G3), else null. */
  solve: SolveResult | null;
  /** The `frontier` result C10 shows, else null. */
  frontier: FrontierResult | null;
  /**
   * The count the per-head boxes divide by: the team's people when the mix
   * has employee work, else the customers when it has customer work, null
   * when neither count applies. See `benefitHeadcount` in compute.
   */
  headcount: number | null;
}

/** How a `BenefitBox.value` is to be formatted. */
export type BenefitUnit = "usd" | "usd_per_mtok" | "tokens" | "multiple" | "percent";

/** One spec 6.4 benefit box: a number, a short label and the named comparator. */
export interface BenefitBox {
  value: number;
  unit: BenefitUnit;
  label: string;
  /** The comparator's label, for example "vs Pay-as-you-go API". */
  comparator: string;
}
