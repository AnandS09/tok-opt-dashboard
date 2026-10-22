/**
 * SAMPLE DATA, INVENTED, NOT MEASURED. Typed `Results` objects for working on
 * the charts without the compute engine. The app never imports this file.
 * Every figure here is made up and consistent only with itself.
 */
import type { Results } from "../../contract";

/** Typical case: three spend channels per side, both savings sources, every class used. */
export const sampleResults: Results = {
  headline: { tokens_multiple: 2, cost_savings_pct: 48.34 },
  allocation: {
    total_usd: 99300,
    budget_usd: 100000,
    today: [
      { label: "Bedrock", kind: "provider", usd: 52000, provenance: "vendor_reported" },
      { label: "Direct API", kind: "provider", usd: 30300, provenance: "vendor_reported" },
      { label: "AWS EC2", kind: "provider", usd: 17000, provenance: "vendor_reported" },
    ],
    infravana: [
      { label: "Bedrock", kind: "provider", usd: 30000, provenance: "vendor_reported" },
      { label: "Neocloud", kind: "provider", usd: 12300, provenance: "vendor_reported" },
      { label: "h200", kind: "hardware", usd: 9000, provenance: "modelled" },
      { label: "Provider arbitrage", kind: "savings", usd: 21000, savings_source: "arbitrage", provenance: "vendor_reported" },
      { label: "Routing", kind: "savings", usd: 27000, savings_source: "routing", provenance: "modelled" },
    ],
    provenance: { today: "vendor_reported", infravana: "modelled" },
  },
  cost_per_mtok: {
    latency_class: "interactive",
    by_model_class: [
      { model_class: "frontier", today_usd_per_mtok: 18.5, infravana_usd_per_mtok: 14.2, today_provenance: "vendor_reported", infravana_provenance: "vendor_reported" },
      { model_class: "mid", today_usd_per_mtok: 4.2, infravana_usd_per_mtok: 2.1, today_provenance: "vendor_reported", infravana_provenance: "modelled" },
      { model_class: "small", today_usd_per_mtok: 0.9, infravana_usd_per_mtok: 0.034, today_provenance: "vendor_reported", infravana_provenance: "modelled" },
    ],
    provenance: { today: "vendor_reported", infravana: "modelled" },
  },
  tokens_bought: {
    budget_usd: 100000,
    demand_tokens: 5.2e9,
    today_tokens: 4.9e9,
    infravana_tokens: 9.8e9,
    provenance: { today: "vendor_reported", infravana: "modelled" },
  },
  quality_floor_by_workload: { software_design: 70 },
  effective_open_share: 0.3,
  floor_unmet_workloads: [],
  comparator: "api",
  today_alternatives: [
    {
      pattern_id: "api",
      label: "Pay-as-you-go API",
      kind: "way_to_buy",
      detail: null,
      is_typical: true,
      is_grey: true,
      total_usd: 99300,
      tokens_at_budget: 4.9e9,
      quality_score: 91.2,
      meets_floors: true,
      provenance: "vendor_reported",
      usd_per_mtok_by_class: { frontier: 18.5, mid: 4.2, small: 0.9 },
    },
    {
      pattern_id: "vendor2_direct",
      label: "Vendor 2, end to end, direct",
      kind: "vendor_end_to_end",
      detail: null,
      is_typical: false,
      is_grey: true,
      total_usd: 60000,
      tokens_at_budget: 8.1e9,
      quality_score: 86.9,
      meets_floors: true,
      provenance: "vendor_reported",
      usd_per_mtok_by_class: { frontier: 11.1, mid: null, small: null },
    },
    {
      pattern_id: "best_single",
      label: "Best single option",
      kind: "best_single",
      detail: "model_x via channel_y (region_z)",
      is_typical: false,
      is_grey: false,
      total_usd: 17000,
      tokens_at_budget: 28.6e9,
      quality_score: 81.4,
      meets_floors: false,
      provenance: "vendor_reported",
      usd_per_mtok_by_class: { frontier: null, mid: 3.1, small: null },
    },
  ],
};

/**
 * Stress case: seven spend channels on the Today bar (folding into "Other"),
 * a narrow segment, a class the scenario does not use, one class present on
 * one side only, a label that needs CSV quoting, and measured provenance
 * (so no badge is expected).
 */
export const sampleResultsEdge: Results = {
  headline: { tokens_multiple: 1.04, cost_savings_pct: 3.2 },
  allocation: {
    total_usd: 250000,
    budget_usd: 180000,
    today: [
      { label: "Provider A", kind: "provider", usd: 90000, provenance: "measured" },
      { label: 'Provider "B", Inc.', kind: "provider", usd: 60000, provenance: "measured" },
      { label: "Provider C", kind: "provider", usd: 40000, provenance: "measured" },
      { label: "Provider D", kind: "provider", usd: 25000, provenance: "measured" },
      { label: "Provider E", kind: "provider", usd: 20000, provenance: "measured" },
      { label: "Provider F", kind: "provider", usd: 10000, provenance: "measured" },
      { label: "Provider G", kind: "provider", usd: 5000, provenance: "measured" },
    ],
    infravana: [
      { label: "Provider A", kind: "provider", usd: 150000, provenance: "measured" },
      { label: "Provider C", kind: "provider", usd: 90000, provenance: "measured" },
      { label: "h100", kind: "hardware", usd: 2000, provenance: "measured" },
      { label: "Routing", kind: "savings", usd: 8000, savings_source: "routing", provenance: "measured" },
    ],
    provenance: { today: "measured", infravana: "measured" },
  },
  cost_per_mtok: {
    latency_class: "batch",
    by_model_class: [
      { model_class: "frontier", today_usd_per_mtok: 12, infravana_usd_per_mtok: 11.5, today_provenance: "measured", infravana_provenance: "measured" },
      { model_class: "mid", today_usd_per_mtok: 3, infravana_usd_per_mtok: null, today_provenance: "measured", infravana_provenance: "measured" },
      { model_class: "small", today_usd_per_mtok: null, infravana_usd_per_mtok: null, today_provenance: "measured", infravana_provenance: "measured" },
    ],
    provenance: { today: "measured", infravana: "measured" },
  },
  tokens_bought: {
    budget_usd: 180000,
    demand_tokens: 9e9,
    today_tokens: 6.5e9,
    infravana_tokens: 6.76e9,
    provenance: { today: "measured", infravana: "measured" },
  },
  quality_floor_by_workload: { support: 60 },
  effective_open_share: 0,
  floor_unmet_workloads: [],
  comparator: "only",
  today_alternatives: [
    {
      pattern_id: "only",
      label: "The only option",
      kind: "way_to_buy",
      detail: null,
      is_typical: true,
      is_grey: true,
      total_usd: 250000,
      tokens_at_budget: 6.5e9,
      quality_score: null,
      meets_floors: true,
      provenance: "measured",
      usd_per_mtok_by_class: { frontier: 12, mid: 3, small: null },
    },
  ],
};
