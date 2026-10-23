# Fixture data for the static mock

**Everything in this folder is invented placeholder data.** None of it is measured, quoted or taken from a vendor, a benchmark or a price page. Model names are generic on purpose ("Frontier model A", "Open-weight model X"), so no number here belongs to a real product. Hardware names are real hardware classes because the Hardware knob lists them, but every number attached to them (price, power, throughput, latency) is made up. `manifest.json` carries `"placeholder": true` and the same warning. Do not present any of it as measured data (spec 7.2, 9).

Files follow the column contracts of spec section 7.3. Empty cells mean "no value". Ids are lower-case snake case.

## Files and columns

| File | Rows | Columns (exactly the header row) |
|---|---|---|
| `hardware.csv` | 9 | `hw_id, vendor, class, usd_per_hr, hr_price_source, power_kw, source_url` (`source_url` optional) |
| `throughput_curves.csv` | 216 | `model_id, hw_id, precision, concurrency, tok_s_per_user, tok_s_per_gpu, p95_ttft_ms, p95_tok_latency_ms, provenance, run_url` |
| `models.csv` | 7 | `model_id, family, tier, license, vendor` |
| `model_offers.csv` | 32 | `offer_id, model_id, channel, region, usd_per_mtok_in, usd_per_mtok_out, commit_discount_pct, min_commit_usd, provisioned_usd_per_hr, source_url, as_of, price_tier, provenance, tok_s_per_user, p95_ttft_ms` |
| `seat_plans.csv` | 2 | `plan_id, vendor, usd_per_user_month, included_usage_note, overage_model_id, source_url` (`source_url` optional) |
| `quality.csv` | 77 | `model_id, benchmark, score, source_url` |
| `workloads.csv` | 8 | `workload_id, label, tok_in_per_user_day, tok_out_per_user_day, quality_floor, default_model_mix, basis` |
| `buying_patterns.csv` | 7 | `pattern_id, label, kind, stage, vendor, pricing_rule, source_url, as_of` |
| `pattern_popularity.csv` | 17 | `pattern_id, stage, popularity_rank, popularity_source` |
| `baseline_providers.csv` | 48 | `pattern_id, workload_id, offer_id, plan_id, share_default` |
| `case_studies.csv` | 3 | `case_id, label, model_mix_json, description` |
| `manifest.json` | n/a | `data_version`, `generated_at`, `placeholder`, `notice`, `parameters` (`working_days_per_quarter`, `months_per_quarter`, `latency_classes`), `files` (version, row count, sha-256 per file) |
| `scenarios/s1.json`, `scenarios/s2.json`, `scenarios/hardware_heavy.json` | n/a | The whole stage-2 response of spec A.2 (the parked language-model call; 7.1 is its stub) (`verdict, reason_for_user, scenario, charts, missing, narrative`). `s1` and `s2` are the two prompts in `intent.md`. `hardware_heavy` is a third example for the prompt "We are a 50-person chip design company with a budget of $100K per quarter. Most of our AI work, about 80 percent, is hardware design, with some software tooling. Show me how to spend it." (the prompt text lives in `mock/src/store/examples.ts`; the envelope has no prompt field). Brand spelling in the narratives is "InfraVana", the UI-copy default. |

Spec 7.3 lists `offer_id or plan_id` as one column of `baseline_providers.csv`. It is split into two columns, `offer_id` and `plan_id`, and exactly one of them is filled per row: `plan_id` for the `seats` pattern on employee workloads, `offer_id` for every other pattern and for customer workloads in every pattern (nobody buys seats for customers, so the seats pattern's customer rows repeat the api offer). Spec 7.4 replaces the v0.2 `stage` column with `pattern_id`, a foreign key to `buying_patterns.csv`; the pattern ids `seats`, `api` and `platform` carry the three v0.2 stages unchanged. The `(...)` value lists in the spec's column names (for example `class (gpu/accelerator)`) are the allowed values, not part of the column name.

Source addresses (spec 7.3, 15.10): every series a chart draws can point at the page its numbers come from, and the "Where these numbers come from" table under each chart links to it. The address is read from the `source_url` column of the row that feeds the series (`hardware.csv`, `seat_plans.csv`, `model_offers.csv`, `buying_patterns.csv`; `throughput_curves.csv` keeps `run_url`). `source_url` in `hardware.csv` and `seat_plans.csv` is an optional column: the loader accepts a file with it or without it, and an empty cell means "no address". Every address in these fixtures is the invented placeholder address `https://example.invalid/placeholder-invented-data/...`, so the table says "placeholder, no source yet" beside each link. Replacing one with a real address changes that link and drops the words, with no code change.

## Foreign keys

| From | To |
|---|---|
| `throughput_curves.model_id` | `models.model_id` (open-weight models only) |
| `throughput_curves.hw_id` | `hardware.hw_id` |
| `model_offers.model_id` | `models.model_id` |
| `seat_plans.overage_model_id` | `models.model_id` |
| `quality.model_id` | `models.model_id` |
| `quality.benchmark` = `composite:<workload_id>` | `workloads.workload_id` |
| `baseline_providers.pattern_id` | `buying_patterns.pattern_id` (never the `best_single` pattern, which has no rows). For a `vendor_end_to_end` pattern every row's offer must belong to a model whose `models.vendor` equals the pattern's `vendor`. |
| `pattern_popularity.pattern_id` | `buying_patterns.pattern_id` (never the `best_single` pattern, which is derived and never ranked) |
| `baseline_providers.workload_id` | `workloads.workload_id` |
| `baseline_providers.offer_id` | `model_offers.offer_id` |
| `baseline_providers.plan_id` | `seat_plans.plan_id` |
| `workloads.default_model_mix`, `case_studies.model_mix_json` | JSON of a model mix (`frontier, mid, small, open_weight_share`; the first three sum to 1) |
| `scenarios/*.json` `workload_mix` keys, `tiers_allowed` | `workloads.workload_id`, `hardware.hw_id` (or `"all"`) |
| `scenarios/*.json` `named_models` | None. Free text, the names the prompt used. See Conventions. |

## Conventions the files rely on (where spec 7.3 is silent)

| Topic | Convention |
|---|---|
| `family` | Holds the display name of the model (there is no label column). |
| `workloads.basis` | `employee` or `customer`. Employee work scales with the scenario's `users`; customer work (AI in a product sold to customers) scales with the optional `customers` count on the scenario state, and its two token columns are per customer per day. `workload_mix` shares sum to 1 within each basis. A scenario with no customer workloads computes exactly as before the column existed. |
| Self-host pricing | Rows with `channel = self-host` and `region = any` have empty token prices. Their cost is derived from `hardware.usd_per_hr` and `throughput_curves.tok_s_per_gpu`. |
| `min_commit_usd` | Dollars per quarter. Empty means no minimum. |
| `provisioned_usd_per_hr` | Left empty everywhere. The schema has no capacity column to pair it with, so it cannot be used yet. |
| `price_tier` | `standard`, `batch` or `flex` (spec 7.4). `standard` is the list price every default view buys at: Today, the best single option, InfraVana's arbitrage and routing. A `batch` or `flex` row is the same model at a cheaper, slower price and is read only by the G4 speed step and the C10 speed view (BD-11), so no default number moves. No `baseline_providers.csv` row may name one. Self-host rows are `standard`. |
| `tok_s_per_user`, `p95_ttft_ms` on `model_offers.csv` | Speed one user sees through the offer (spec 7.4), both filled or both empty. Filled for the 22 proprietary offers listed under "Invented speed and batch rows (BD-11)" and empty everywhere else (open-weight offers take their speed from `throughput_curves.csv`). An empty speed never gates an offer, except that a `batch` or `flex` row without speed data can never be used. A row meets a latency class (`manifest.json`) when both limits hold. |
| `provenance` on `model_offers.csv` | The weakest provenance of any value on the row: `modelled` for the 22 rows that carry invented speed values or a batch or flex price, `vendor_reported` for the other ten (the price page the real column would come from). The engine reads it only where it reads the speed columns (G4 speed step, C10 speed view), so a view built from `standard` prices alone keeps its `vendor_reported` badge. |
| `concurrency` | Concurrent requests per GPU replica. `tok_s_per_user` is `tok_s_per_gpu / concurrency`. |
| `quality.csv` rows | Readers must filter on the `composite:` prefix: a row is a composite if and only if `benchmark` starts with `composite:`, and every other row is a raw benchmark score. Averaging or plotting all rows of a model together would count the composites twice. Raw rows (`bench_code`, `bench_reasoning`, `bench_domain`) plus one row per model and workload named `composite:<workload_id>`, the precomputed weighted mean of the three raw rows. Weights over (code, reasoning, domain): software_design .6/.3/.1, hardware_design .2/.4/.4, support .1/.3/.6, research .1/.6/.3, customer_service .1/.3/.6, product_ai .4/.4/.2, documents .1/.4/.5, ops_agents .5/.3/.2. `workloads.quality_floor` is on the composite scale. |
| Seat plans | `included_usage_note` starts with `[placeholder] cap_mtok_per_user_month=N;`. Per user, tokens (in plus out) above N million a month are billed at the direct list price of `overage_model_id`, in the workload's own in/out proportion. |
| `baseline_providers` shares | `share_default` sums to 1 per pattern and workload. The `seats` pattern: per-user cost is `users x workload share x plan price x 3 months`, plus overage. The `api` pattern: one provider (Placeholder vendor 1, direct channel). The `platform` pattern: Bedrock only, with the offer's `commit_discount_pct` applied when the list-price spend at that offer reaches its `min_commit_usd` (an empty minimum means always), and at list price below it (BD-3). Whether a pattern applies the commit discount is its `pricing_rule` in `buying_patterns.csv` (`commit` does, `list` does not); the three stages are `seats` list, `api` list and `platform` commit, so only the platform stage applies a commit discount. |
| `buying_patterns` | One row per Today option (spec 6.1, 7.4). `kind` is `way_to_buy` (the three stages, each the typical buyer for its `stage`), `vendor_end_to_end` (one vendor's models bought through one channel, empty `stage`, every baseline row an offer of that vendor's models) or `best_single` (no baseline rows; the engine derives it as the cheapest single token-priced offer of a proprietary model that meets every workload floor in effect, priced by the row's `pricing_rule`; open-weight models are never the best single option). Exactly one `way_to_buy` pattern exists per stage. |
| `pattern_popularity` | One row per pattern per stage (spec 7.4): how popular the pattern is among visitors whose `stage_today` is `stage`. `popularity_rank` is a whole number from 1, lower is more popular, ties are broken by `pattern_id`; a pattern with no row for a stage is never a default grey option for that stage; the `best_single` pattern has no rows. |
| `working_days_per_quarter` | 63, in `manifest.json` `parameters`. Spec 7.2 step 1 needs it and no CSV carries it. A quarter is 3 months for seat prices. |
| Workloads outside a scenario's mix | Present in `workloads.csv` and `baseline_providers.csv` so the Workload mix knob and the guided questions can use them. S1 only uses software and hardware design. The four workloads added for the guided questions (customer_service, product_ai, documents, ops_agents) are in no scenario file. |
| Scenario fields | `named_models` in `s2.json` is `["opus", "fable"]`, the free-text names the prompt used, lower case, as the contract says. They are not ids in `models.csv`, they map to no row, and the engine ignores `named_models` for pricing (the model mix drives it). `s1` and `hardware_heavy` have no `target`; `s2` has one. S1 `stage_today` is `api` and S2 is `platform`, the values the guided intake sets for each company type (spec 4.3, 5). Both leave `tiers_allowed` as `"all"`. |
| What the scenarios infer or assume | S1: the prompt gives users, budget and the two workload types only. `workload_mix` (60/40), `model_mix`, `stage_today`, `tiers_allowed` and `latency_class` are assumed and all listed in `missing`. S1 `model_mix` is the `software_design` default from `workloads.csv`, the workload with the larger share, not a blend. A 60/40 blend of the two workloads' defaults would be 0.64 / 0.30 / 0.06 / 0.16. `hardware_heavy`: same company, budget and assumptions as S1, but the prompt states the workload split, so `workload_mix` (hardware_design 0.8, software_design 0.2) is not in `missing`; its other fields and its `missing` list (`model_mix`, `stage_today`, `tiers_allowed`, `latency_class`) follow S1. Its `model_mix` is the `hardware_design` default from `workloads.csv` (0.7 / 0.3 / 0 / 0.1), the larger-share workload, by the same rule as S1. S2: the prompt gives the two states and says "Opus and Fable heavy" and "a mixture of open weight and proprietary". Frontier-heavy is inferred from that. The exact shares (0.7 frontier, 0.3 mid, 0 small, 0.4 open-weight share) are assumed, and `model_mix` is listed in `missing` for that reason. S2 `workload_mix`, `stage_today`, `tiers_allowed` and `latency_class` are assumed too. |
| Provenance | Every throughput row and every `model_offers.csv` row that carries invented speed or a batch or flex price is `provenance = modelled` (see "Invented speed and batch rows (BD-11)"). Every throughput row's `run_url` is empty, because no run exists. Text columns that can carry a source (`hr_price_source`, `source_url`, `vendor`, the seat-plan note, the case-study description) say "placeholder" or point at `example.invalid`, a reserved domain that never resolves. `throughput_curves.csv`, `baseline_providers.csv` and `workloads.csv` have no text column that can carry the label, so they are covered by `manifest.json` (`placeholder: true`, per file and overall) and this file. |

## Where each invented number's range comes from

Nothing below was measured. Each range was picked to look plausible and to keep the S1 baselines near the budget.

| Numbers | Range used | How it was chosen |
|---|---|---|
| `hardware.usd_per_hr` | 2.10 to 7.20 | Newer and larger parts cost more per hour, inside the rough range of public GPU rental prices. Not copied from any list. |
| `hardware.power_kw` | 0.45 to 1.40 | Newer parts draw more. Invented. |
| Capacity of one GPU on Open-weight model X | 2,400 tok/s at saturation on `h100`, from 1.0x to 3.9x that on other parts (0.9x for the accelerators on model X, see below) | A single invented base value times an invented per-hardware multiplier. Smaller models are faster: it is multiplied by 1.6 (Y), 2.5 (Z) and 3.5 (S). Accelerator multipliers are 1.5 (d-Matrix) and 1.1 (Rebellions), further scaled by 0.85 (X), 1.0 (Y), 1.05 (Z) and 1.10 (S), because accelerators are invented to suit small models better. |
| Throughput shape | `tok_s_per_user = capacity / (concurrency + c_half)`, `tok_s_per_gpu = tok_s_per_user x concurrency`, `c_half` 3 to 18 | A saturating curve, so per-user speed falls, per-GPU throughput rises then flattens (last step under 7%). The accelerators have a small `c_half` (3 and 5, against 14 to 18 for the GPUs), so they scale less with batch size. That gives the cost per Mtok (`usd_per_hr / (tok_s_per_gpu x 3600 / 1e6)`) a shape the spec's story needs and no more: an accelerator is cheapest at low concurrency, a GPU (`mi355x`) is cheapest at high concurrency, and the crossover moves with model size (between concurrency 8 and 32 for model X, between 128 and 256 for model S). No accelerator is cheapest everywhere and neither has the lowest hourly price. These orderings are invented and must not be read as a result. `tok_s_per_user` is rounded to 0.01 and `tok_s_per_gpu` to 0.1. |
| `p95_ttft_ms` | 23 to 2,405 | A base time per model (380, 180, 80, 45 ms) divided by the square root of the hardware multiplier, times `1 + 0.02 x concurrency`. |
| `p95_tok_latency_ms` | `1000 / tok_s_per_user x 1.4` | A fixed tail factor of 1.4 on the per-token time. |
| Frontier model A prices | direct 10 / 50, Bedrock 10.4 / 52 (11.0 / 55 in EU), EC2 9.2 / 46 (9.8 / 49 in EU) USD per Mtok in / out | Channels differ by a few percent. Commit discount 0, 8 and 12 percent. |
| Frontier model B prices | direct 6 / 30, Bedrock 6.2 / 31, EC2 5.6 / 28 (5.9 / 29.5 in EU) | Same pattern. Commit discount 0, 6 and 10 percent. |
| Mid-tier model A prices | direct 2 / 10, Bedrock 2.1 / 10.5, EC2 1.8 / 9 | Same pattern. |
| Open-weight hosted prices | X 0.70 / 2.10 and 0.90 / 2.70, Y 0.30 / 0.90 and 0.40 / 1.20, Z 0.08 / 0.24, S 0.04 / 0.12 | Roughly proportional to the model's size. |
| `commit_discount_pct`, `min_commit_usd` | 0 to 12 percent, 10,000 to 40,000 USD a quarter | Modest, per BD-3. Chosen below the S1 budget so the commit is reachable. |
| Latency classes (`manifest.json` `parameters.latency_classes`) | interactive: at least 50 tok/s per user and p95 TTFT at most 600 ms. standard: at least 20 tok/s per user and TTFT at most 1,500 ms. batch: no minimum (0) and no TTFT limit (`null`). | Read off the invented curves, whose range is 8.6 to 3,465 tok/s per user and 23 to 2,405 ms TTFT. A curve row meets a class when both limits hold. Interactive keeps 162 of the 216 rows, standard 203, batch all 216. The highest concurrency a model and hardware pair can run at while meeting the class ranges from 8 to 256 for interactive (model X on `h100` reaches 8, on `b300` 64) and from 64 to 256 for standard, so the class changes which tiers and how much load are feasible without ruling out any pair outright. 50 tok/s is the interactivity point the spec cites for InferenceX (section 2); the other numbers are invented round values, not a standard. |
| Seat plans | 120 and 25 USD per user month, caps of 10 and 4 million tokens | Chosen so the Seats baseline for S1 lands near the budget. |
| Benchmark scores | 46 to 93 on a 0 to 100 scale | Frontier models high, small models low. Three invented benchmarks, no real benchmark names. |
| Quality floors | 78 (software), 79 (hardware), 65 (support), 74 (research), 66 (customer service), 75 (product AI), 77 (documents), 72 (ops agents) | Chosen to give a mixed routing outcome: frontier and mid-tier models pass everywhere, open-weight model X passes for software, support and research but not hardware, open-weight model Y passes support only, and the two small open-weight models pass no workload. Of the added workloads, model X passes all four and model Y passes customer service and ops agents. The floors set how much traffic can move to cheaper models, so they influence any routing gain the engine reports. |
| Tokens per user per day | software 2.65M in / 175K out, hardware 2.0M in / 130K out, support 0.6M / 50K, research 1.0M / 80K, documents 1.2M / 60K, ops agents 1.5M / 100K. Per customer per day: customer service 2,000 / 200, product AI 3,000 / 300 | Agent-style, input-heavy work. Only the demand scale was sized, so that the three S1 baselines land near 100,000 USD a quarter. The per-customer values were sized so 50,000 customers cost roughly 19,000 USD (customer service, Mid-tier model A direct) and 85,000 USD (product AI, Frontier model B direct) a quarter on the API baseline, inside the budget choices. No price, throughput or demand value was chosen to produce a particular saving for Infravana; the quality floors above are the one choice that shapes routing, and they are disclosed there. |

## Invented in the v0.3 foundation step

Everything below is invented placeholder data, like the rest of the folder. The pattern rows carry the placeholder source address `https://example.invalid/placeholder-invented-data/patterns/<pattern_id>` and the `as_of` date 2026-10-21. `manifest.json` `data_version` is `0.3.1-placeholder` (`0.3.0-placeholder` until the speed and batch rows below were added); `buying_patterns.csv` and `pattern_popularity.csv` carry `0.3.0-placeholder`, `model_offers.csv` carries `0.3.1-placeholder`, `baseline_providers.csv` carries `0.2.0-placeholder`, every other file keeps `0.1.0-placeholder`.

**`buying_patterns.csv`, all seven rows.** The labels are invented and no row describes a real vendor or market share.

| `pattern_id` | `kind` | `stage` | `pricing_rule` | What it is |
|---|---|---|---|---|
| `seats` | `way_to_buy` | `seats` | `list` | The v0.2 Seats stage, unchanged |
| `api` | `way_to_buy` | `api` | `list` | The v0.2 API stage, unchanged |
| `platform` | `way_to_buy` | `platform` | `commit` | The v0.2 Platform stage, unchanged |
| `vendor1_direct` | `vendor_end_to_end` | empty | `list` | Placeholder vendor 1's models bought direct |
| `vendor2_direct` | `vendor_end_to_end` | empty | `list` | Placeholder vendor 2's models bought direct |
| `vendor2_bedrock` | `vendor_end_to_end` | empty | `commit` | Placeholder vendor 2's models bought through Bedrock |
| `best_single` | `best_single` | empty | `commit` | Derived by the engine, no baseline rows |

**`pattern_popularity.csv`, all 17 rows.** Every rank and its source label `INVENTED PLACEHOLDER: not a survey or market-share figure` is invented. The ranks differ by stage on purpose, so the default grey options differ between stages. `vendor2_bedrock` has no row for the `seats` stage, so it is never a default grey for a seats visitor.

| Stage | Rank 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| `seats` | `seats` | `vendor1_direct` | `api` | `vendor2_direct` | `platform` | none |
| `api` | `api` | `vendor2_direct` | `platform` | `seats` | `vendor1_direct` | `vendor2_bedrock` |
| `platform` | `platform` | `vendor2_bedrock` | `api` | `vendor2_direct` | `seats` | `vendor1_direct` |

**`baseline_providers.csv`, 48 rows.** The first 24 rows are the v0.2 rows with `stage` renamed to `pattern_id` (`seats`, `api`, `platform`, eight workloads each). The last 24 rows are invented: three vendor patterns (`vendor1_direct`, `vendor2_direct`, `vendor2_bedrock`) by eight workloads, `share_default` 1.0. Each row names the offer of the vendor's cheapest model, ranked by list price at that channel, whose composite score meets the workload's `quality_floor`. That gives `mid_a_direct_global` for `vendor1_direct`, `frontier_b_direct_global` for `vendor2_direct` and `frontier_b_bedrock_useast` for `vendor2_bedrock`, on every workload.

On scenario S1 (the three v0.2 Today totals are unchanged) the new patterns come to 20,002.50 (`vendor1_direct`), 60,007.50 (`vendor2_direct`), 58,287.28 (`vendor2_bedrock`) and 16,562.07 for the derived best single option (Mid-tier model A on EC2, US East, with its commit discount), as a check on the rows, not values the UI may hard-code.

## Invented speed and batch rows (BD-11)

Everything below is invented, like the rest of the folder. These are exactly the rows of `model_offers.csv` that carry a speed value or a `batch` or `flex` price, and `mock/scripts/check-invented.mjs` fails if this list and the file disagree, or if any of them lacks the placeholder source address `https://example.invalid/placeholder-invented-data/...` or `provenance = modelled` (spec 12 BD-11, guardrails 1 and 2). They act only on the G4 speed step and the speed view of C10 (guardrail 3); a chart that uses them shows the provenance badge and "Source: invented placeholder data" (guardrail 4); the same columns are the inputs the real backend must supply (spec 7.4, guardrail 5).

**Speed of the twelve existing proprietary rows (`price_tier = standard`, prices unchanged).** Every one meets the `interactive` class (at least 50 tok/s per user, p95 TTFT at most 600 ms), so the default view is consistent with the speeds it never reads. The cheaper channels are the slower ones. Invented, not a measurement.

| `offer_id` | `price_tier` | `tok_s_per_user` | `p95_ttft_ms` |
|---|---|---|---|
| `frontier_a_direct_global` | standard | 85 | 320 |
| `frontier_a_bedrock_useast` | standard | 80 | 360 |
| `frontier_a_bedrock_euwest` | standard | 72 | 420 |
| `frontier_a_ec2_useast` | standard | 64 | 480 |
| `frontier_a_ec2_euwest` | standard | 58 | 540 |
| `frontier_b_direct_global` | standard | 110 | 250 |
| `frontier_b_bedrock_useast` | standard | 104 | 280 |
| `frontier_b_ec2_useast` | standard | 88 | 340 |
| `frontier_b_ec2_euwest` | standard | 76 | 400 |
| `mid_a_direct_global` | standard | 150 | 180 |
| `mid_a_bedrock_useast` | standard | 140 | 210 |
| `mid_a_ec2_useast` | standard | 120 | 260 |

**Ten new rows.** Each copies its base offer's model, channel and region, with the price, discount, speed and `as_of` (2026-10-21) invented. A flex row is 65 to 70 percent of its base price and meets the `standard` class (at least 20 tok/s, TTFT at most 1,500 ms) but not `interactive`. A batch row is 50 percent of its base price and meets the `batch` class only (about 5 to 14 tok/s, TTFT 20 to 50 seconds). Batch rows on Bedrock and EC2 carry their base offer's commit discount and minimum.

| `offer_id` | `price_tier` | Base offer | USD per Mtok in / out | `tok_s_per_user` | `p95_ttft_ms` |
|---|---|---|---|---|---|
| `frontier_a_direct_global_flex` | flex | `frontier_a_direct_global` | 6.5 / 32.5 | 34 | 1100 |
| `frontier_a_direct_global_batch` | batch | `frontier_a_direct_global` | 5 / 25 | 7 | 40000 |
| `frontier_a_bedrock_useast_batch` | batch | `frontier_a_bedrock_useast` | 5.2 / 26 | 6 | 45000 |
| `frontier_a_ec2_useast_batch` | batch | `frontier_a_ec2_useast` | 4.6 / 23 | 5 | 50000 |
| `frontier_b_direct_global_flex` | flex | `frontier_b_direct_global` | 4.2 / 21 | 42 | 900 |
| `frontier_b_direct_global_batch` | batch | `frontier_b_direct_global` | 3 / 15 | 9 | 30000 |
| `frontier_b_ec2_useast_batch` | batch | `frontier_b_ec2_useast` | 2.8 / 14 | 6 | 40000 |
| `mid_a_direct_global_flex` | flex | `mid_a_direct_global` | 1.4 / 7 | 60 | 700 |
| `mid_a_direct_global_batch` | batch | `mid_a_direct_global` | 1 / 5 | 14 | 20000 |
| `mid_a_ec2_useast_batch` | batch | `mid_a_ec2_useast` | 0.9 / 4.5 | 10 | 25000 |

Why these numbers: a speed give-up needs something cheaper to give speed up for, so the discounts are round invented values (30 to 50 percent below the base price), and the speeds are chosen only so the three latency classes each admit a different set of rows. No price or speed was tuned to reach a particular saving; the saving a speed step shows is whatever these rows give. The engine assumes unlimited capacity, so a faster tier is never limited by supply (spec 6.3 "Data it needs to be credible").

## Reference check for scenario S1

Computed from these rows alone (50 users, 60 percent software and 40 percent hardware design, 63 working days), with the conventions above. These are a check on the sizing, not values the UI may hard-code.

| Stage | USD per quarter |
|---|---|
| Seats | 99,318 |
| API | 100,012 |
| Platform | 95,692 |
