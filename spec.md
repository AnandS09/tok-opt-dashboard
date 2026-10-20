# Infravana Inference Playground: UI Spec (draft v0.2)

Status: MVP draft. Builds on [intent.md](intent.md). v0.2 folds in your answers to the v0.1 open questions and changes the chart presentation to a photo-album layout (section 4). Items marked **[ASSUMPTION]** are my decisions where the intent doc was silent. Section 12 holds the bootstrap decisions (`BD-n`): defaults chosen to keep the MVP moving, all to be revisited at production hardening and before going live.

## 1. What we're building, in one paragraph

A single-page playground. The user types one natural-language prompt describing their company, budget and workloads. A cheap classifier screens the prompt (up to 5 attempts). One full LLM call then turns an accepted prompt into a structured **Scenario**: it extracts the knob values and picks which charts to show from a fixed registry. The page renders those charts as an **album** (one large chart at a time, with a filmstrip of thumbnails), driven entirely by CSV data in the browser. The user changes knobs (users, budget, hardware tier, model mix) and every slide recomputes locally with no further LLM calls. Every chart contrasts **"Today"** (how a growing company typically buys inference now) against **"With Infravana"** (smarter provider and hardware routing across API platforms, GPU and accelerator classes).

## 2. What we take from SemiAnalysis (InferenceX / TCO model)

Sources: [InferenceX dashboard](https://inferencex.semianalysis.com), [InferenceX repo](https://github.com/SemiAnalysisAI/InferenceX), [AI Cloud TCO Model](https://semianalysis.com/ai-cloud-tco-model/), and a [third-party summary of the metrics](https://aiwiki.ai/wiki/inferencex). I could not load the dashboard pages themselves, so chart details below come from those summaries and should be checked against the live site before we copy anything visually.

| SemiAnalysis idea | How we use it |
|---|---|
| **Throughput vs interactivity curves.** X is per-user tokens/s, Y is tokens/s per GPU. Each hardware and software config is a sweep over concurrency, and the Pareto frontier is the line. | Our hero "efficiency frontier" chart (C2). Same axes, same Pareto-line convention, so it reads as familiar to this audience. |
| **Cost per million tokens at a fixed interactivity point** (they use 50 tok/s/user), computed from measured throughput and $/GPU-hr from a TCO model. | Our cost engine. We convert a throughput curve plus $/hr into $/Mtok at the user's latency target. The user's SLA knob replaces their fixed 50 tok/s. |
| **Metric set:** throughput/GPU, P99 TTFT, $/Mtok, energy/token, tokens per provisioned MW. | We keep throughput, p95 latency and $/Mtok. Energy and MW are optional "advanced" metrics, off by default. |
| **Publish the method.** Open data, open code, every run linked. | Every chart has a "How this is computed" drawer and a "Download data" link. This is what makes the Infravana advantage credible rather than a sales claim. |
| **TCO from capex, power, colo, cost of capital.** | We don't rebuild TCO. The backend ships a `$/accelerator-hr` column. We just label its source. |

**Gap to flag:** InferenceX covers NVIDIA and AMD. d-Matrix, Rebellions and similar accelerators are not in it, so the backend must supply equivalent throughput-curve CSVs for them. If that data is modelled rather than measured, the UI must say so (section 9).

## 3. Users and scenarios

Primary user: an engineering or finance lead deciding how to spend an inference budget. Not an ML infra expert, so the UI avoids jargon in labels and puts it in tooltips.

Two canonical scenarios from the intent doc become our acceptance cases:

- **S1 "Allocate":** 50 people, $100K/quarter, mixed software and hardware design workflows. Output: budget allocation today vs with Infravana.
- **S2 "Scale":** 50 to 100 people, $100K to $200K/quarter, Opus and Fable heavy, considering an open-weight/proprietary mix. Output: the same charts, plus a before/after comparison.

## 4. Page layout

### 4.1 The album

Charts are presented like a photo album, not a grid. One chart ("the photo") fills the stage. A filmstrip of live thumbnails sits beneath it. Knobs stay docked beside it, so turning a knob updates the stage and every thumbnail at once.

```
+-----------------------------------------------------------------------+
| [logo] Infravana Playground                       [assumptions] [data] |
+-----------------------------------------------------------------------+
| Prompt (locked after accept)   "I lead a company of 50 people ..."     |
| Understood: 50 people | $100K/qtr | sw 60% hw 40% | stage: API | p95   |
+--------------------+--------------------------------------------------+
| KNOBS              | HEADLINE   Same budget: 2.4x tokens | -38% cost    |
|  Users / workflows |--------------------------------------------------|
|  Budget  $/qtr     |                                                  |
|  Where you are     |   <                                          >   |
|   today            |            STAGE: one chart, large               |
|  Hardware tiers    |                                                  |
|  Model mix         |   Caption: one-sentence takeaway for this chart  |
|  Workload mix      |   [How computed]  [Download CSV]  [Fullscreen]   |
|  Latency target    |--------------------------------------------------|
|  Quality floor     |  FILMSTRIP  (live thumbnails, active one framed) |
|  Case study:       |  [C1*] [C5] [C3] [C2] [C4] [C7]      [Grid view] |
|   (frontier/mixed/ |   1/6                                            |
|    open)           |                                                  |
|  [Reset]           |                                                  |
+--------------------+--------------------------------------------------+
| Footer: data version, provenance legend (measured / modelled)         |
+-----------------------------------------------------------------------+
```

Album behaviour:

- **Order is a story arc, fixed by registry priority, not LLM order:** where the money goes (C1), what it buys (C5), unit economics (C3), then the supporting evidence the LLM selected. The page is stable between runs.
- **Navigation:** arrow buttons, left/right keys, swipe on touch, click a thumbnail. The active slide is reflected in the URL hash (`#slide=C2`) so a link opens the same chart.
- **Thumbnails are live,** the same chart component rendered small and non-interactive, so they visibly change as knobs move. Render only thumbnails in view, and throttle redraws while a slider is being dragged.
- **Grid view** toggles the filmstrip into a "contact sheet" of all slides at once, for when the user wants to compare charts side by side. This covers the main weakness of an album, which is that you only see one chart at a time.
- **Headline strip stays pinned above the stage** on every slide, so the key numbers are never off screen.
- **Mobile:** the stage goes full width with swipe, the filmstrip becomes dots plus a thumbnail drawer, and knobs collapse into a bottom sheet.
- **Motion:** a short cross-fade between slides. Respect `prefers-reduced-motion`.
- **Presentation use:** a Fullscreen button hides the rails and shows stage plus caption, for sharing in a meeting. **[ASSUMPTION]**

### 4.2 Other rules

- The prompt box locks after an accepted prompt. A short line says "Adjust the knobs to explore." A rejected prompt leaves it open until the attempt cap (section 8).
- The "Understood" strip shows what the LLM extracted, with assumed values marked, so the user can see misreads. It is read-only. Corrections happen through knobs.
- The headline strip has two or three numbers that update live as knobs move. This is the thing people screenshot.

## 5. Knobs

All knobs are controlled inputs bound to one `Scenario` object. Moving a knob re-runs the pure compute function (section 7) and re-renders. No network calls.

| Knob | Control | Range and default | Notes |
|---|---|---|---|
| Users / workflows | Number input plus toggle (people / concurrent workflows) | 1 to 10,000. Default from prompt. | The toggle changes how demand is derived (section 7.1). |
| Budget | Number input, per quarter | $1K to $10M. Default from prompt. | Per quarter, with a month/year display toggle. |
| Where you are today | Segmented control: **Seats** (per-user subscriptions) / **API** (pay-as-you-go on one provider) / **Platform** (Bedrock, Azure or similar with committed capacity) | Inferred from company size in the prompt (small team: Seats, mid: API, large: Platform). | Sets the "Today" baseline (section 7.2). The most important knob for how credible the comparison is. |
| Hardware tiers | Multi-select checkboxes grouped as GPU (H100, H200, B200, B300, MI300X, MI325X, MI355X...) and Accelerator (d-Matrix, Rebellions...) | Default: all available in the CSV. | Options come from the CSV, never hard-coded. Disabling tiers shrinks Infravana's search space and shows the effect. |
| Model mix | Two sliders: frontier / mid / small share (sums to 100%), and proprietary / open-weight share | Default from prompt, else the workflow-type default. | Proprietary is priced per token via API. Open-weight can run on the GPU and accelerator tiers. See 7.2. |
| Workload mix | Stacked slider over workload types (software design, hardware design, support, ...) | From the workload-profile CSV. | Each type carries its own tokens/user/day and quality floor. |
| Latency target | Dropdown: interactive (p95 TTFT and tok/s/user), standard, batch | Default: interactive. | Maps to a point on the interactivity axis. |
| Quality floor | Slider over a benchmark score | Default: per workload type. | Models below the floor are excluded from routing. |
| Reset | Button | Restores the LLM-extracted values. | |

When a knob change makes the scenario infeasible (budget too low for the workload at the quality floor), the page shows an inline "Budget covers only X% of this workload" state rather than empty charts.

## 6. Chart registry (fixed set)

The LLM picks from this list by ID and never invents a chart. Each chart has a fixed data contract and a fixed rendering. Adding a chart is a code change, not a prompt change.

The three metric families from the intent doc are throughput p95, cost in dollars, and quality on benchmarks.

| ID | Chart | Type | Shows | Primary metric | When the LLM selects it |
|---|---|---|---|---|---|
| C1 | **Budget allocation, today vs Infravana** | Two stacked horizontal bars, same total, segmented by provider/channel and hardware tier. The Infravana bar also marks savings from provider arbitrage separately from savings from routing. | Where each dollar goes | Cost | Always (anchor chart). |
| C2 | **Efficiency frontier** | Line chart with Pareto lines per hardware class. X = tok/s/user, Y = tok/s per $ (or per GPU toggle). Infravana blended frontier drawn on top. | Why heterogeneous wins | Throughput p95 | Any time hardware or tier is mentioned. Default on. |
| C3 | **Cost per million tokens** | Grouped bars by model class, today vs Infravana | Unit economics at the chosen latency target | Cost | Always. |
| C4 | **Quality vs cost** | Scatter. X = $/Mtok (log), Y = benchmark score. Floor line on top. Infravana routes shown as arrows from today's choice. | What you give up (nothing, ideally) | Quality | When the prompt mentions open-weight, mid-tier or quality trade-offs. |
| C5 | **Tokens bought for the budget** | Bar pair plus a delta label | "Same budget, N times the tokens" | Throughput and cost | Always. Drives the headline strip. |
| C6 | **Workload routing map** | Sankey: workload types to model classes to hardware tiers | How Infravana places work | Cost, quality | When the prompt lists multiple workload types. |
| C7 | **Before / after scaling** | Paired panels showing C1 at scenario A and scenario B, with a delta table | Plan for growth | Cost | When the prompt gives two states (S2). |
| C8 | **Budget sensitivity** | Line. X = budget, Y = covered workload %, today vs Infravana | Where the budget breaks | Cost | When the prompt asks how much to spend. |
| C9 | **p95 latency by tier** | Box or bar per hardware tier at the chosen load | Whether the cheap tier is also fast enough | Throughput p95 | When latency or SLA is mentioned. |

Selection rules:

- C1, C3 and C5 are mandatory. The LLM adds 1 to 3 more, for a total of 4 to 6.
- The "case study" requirement in the intent doc (frontier-heavy, mixed, open vs proprietary) is handled by a **case-study selector** above the grid, with presets that set the model-mix knobs and re-render. It is not extra charts. **[ASSUMPTION]**
- Visual rules follow the `dataviz` skill: Infravana is one consistent accent colour, "today" providers are neutral greys, and every chart carries a direct takeaway sentence as its subtitle.

## 7. Mechanics: from prompt to charts

### 7.1 One LLM call, structured output

After the stage 1 screen (section 8) accepts a prompt, the stage 2 call does extraction and chart selection, and re-checks the verdict as defence in depth. It returns JSON validated against a schema. The model sees only the prompt and a short catalogue (workload type names, hardware tier names, stage names, chart IDs), not the data.

```json
{
  "verdict": "ok | off_topic | unsafe | unclear",
  "reason_for_user": "string, shown only if verdict != ok",
  "scenario": {
    "baseline": { "users": 50, "budget_usd_per_quarter": 100000 },
    "target":   { "users": 100, "budget_usd_per_quarter": 200000 },
    "workload_mix": { "software_design": 0.6, "hardware_design": 0.4 },
    "model_mix": { "frontier": 0.7, "mid": 0.3, "open_weight_share": 0.4 },
    "named_models": ["opus", "fable"],
    "stage_today": "seats | api | platform",
    "tiers_allowed": "all | [ids]",
    "latency_class": "interactive | standard | batch",
    "unit": "people | workflows"
  },
  "charts": ["C1", "C3", "C5", "C2", "C7"],
  "missing": ["fields the user did not state, filled with defaults"],
  "narrative": "two sentence plain-English summary"
}
```

Behaviour:

- `baseline` is always present. `target` is present only for scaling prompts (S2) and triggers C7.
- Anything the user didn't state is filled with a CSV-backed default and listed in `missing`, which the summary strip shows as "assumed".
- If `verdict` is anything but `ok`, no dashboard renders. The UI shows the reason and an example prompt.
- The schema is enforced with tool-use or structured output, and the client re-validates. A malformed response gets one client-side repair attempt without a second LLM call (clamp, default, drop unknown chart IDs). If that fails, fall back to the default scenario with C1, C3, C5 and show the unparsed-prompt notice.

### 7.2 Compute engine (pure functions, runs in the browser)

`compute(scenario, tables) -> results`. It is deterministic, has no side effects, and is unit-testable against fixtures.

1. **Demand.** `tokens/quarter = users x workload_mix x tokens_per_user_per_day(type) x working_days`, split into input and output tokens, from the workload-profile CSV.
2. **Today (baseline).** The persona is a company new to AI that is scaling from vendor options for individuals and small teams towards platforms that serve at scale. The "Where you are today" knob picks the stage, and each stage has a defined buying pattern in `baseline_providers.csv`:
   - **Seats:** per-user subscriptions. Cost is `users x seat price`, with a usage cap that pushes heavy users to API overage.
   - **API:** pay-as-you-go list price from a single provider, one model family per workload.
   - **Platform:** the same models through a cloud platform (Bedrock, Azure and similar), at list or provisioned-throughput pricing, with one provider and no cross-provider arbitrage.
   The baseline is a documented typical-buyer config, not the cheapest possible one. The assumptions panel states it, and the baseline definition is a CSV, so it can be tightened later without code changes.
3. **With Infravana.** For each workload type, choose among all allowed offers that satisfy the quality floor and latency target, and pick the cheapest subject to capacity. Start with greedy-by-cost-per-token and swap to a small LP if capacity constraints bind. There are two sources of gain, and the UI keeps them visible as separate segments in C1:
   - **Provider arbitrage for proprietary models.** The same model is sold through several channels (direct API, Bedrock, Azure and so on) at different list prices, commitment discounts and regional prices. Infravana's gain here is the better deal across them. It does not change the model.
   - **Routing to cheaper models and hardware.** Where quality permits, move a share of traffic to mid-tier or open-weight models served on heterogeneous GPU and accelerator tiers.
4. **Budget.** If cost exceeds budget, report the covered fraction. If under budget, report the remaining headroom and the extra tokens it buys (C5).
5. **Chart series.** Each chart's data is a view over `results`.

Credibility rules:

- The S2 story is "same frontier models through a better channel, plus routing what can move to cheaper models and hardware." The engine shows those as separate segments instead of claiming blanket hardware savings. Provider arbitrage needs real price data per channel (see `model_offers.csv`), so it is only as credible as that file.
- Every "Infravana" number must come from the CSVs through `compute()`. No hard-coded multipliers. If a stakeholder wants a fixed "Infravana is 40% cheaper" claim, that belongs in marketing copy, not in a chart that looks measured.

### 7.3 Data (CSV contracts)

The backend is out of scope. These are the files the UI needs. Each file ships with a `data_version` and `generated_at` header row or a sidecar `manifest.json`.

| File | Key columns |
|---|---|
| `hardware.csv` | `hw_id, vendor, class (gpu/accelerator), usd_per_hr, hr_price_source, power_kw` |
| `throughput_curves.csv` | `model_id, hw_id, precision, concurrency, tok_s_per_user, tok_s_per_gpu, p95_ttft_ms, p95_tok_latency_ms, provenance (measured/modelled), run_url` |
| `models.csv` | `model_id, family, tier (frontier/mid/small), license (proprietary/open), vendor` |
| `model_offers.csv` | One row per way to buy a model: `offer_id, model_id, channel (direct/bedrock/azure/neocloud/self-host), region, usd_per_mtok_in, usd_per_mtok_out, commit_discount_pct, min_commit_usd, provisioned_usd_per_hr, source_url, as_of` |
| `seat_plans.csv` | `plan_id, vendor, usd_per_user_month, included_usage_note, overage_model_id` (for the "Seats" stage) |
| `quality.csv` | `model_id, benchmark, score, source_url` plus a derived `composite_score` per workload type |
| `workloads.csv` | `workload_id, label, tok_in_per_user_day, tok_out_per_user_day, quality_floor, default_model_mix` |
| `baseline_providers.csv` | `stage (seats/api/platform), workload_id, offer_id or plan_id, share_default` (defines "today" for each stage) |
| `case_studies.csv` | `case_id, label, model_mix_json, description` (drives the presets) |
| `manifest.json` | file versions, row counts, checksums, `generated_at` |

Provenance: we assume all throughput data is measured. If a row is modelled, the backend sets `provenance=modelled` and the UI shows a badge on that series. No badge means measured.

Loading: fetch all CSVs once at page load, parse with a streaming parser in a web worker, validate against schemas (fail loudly with a friendly banner if a column is missing), and hold them in memory. Throughput curves are the largest file. Expect tens of thousands of rows at most, which is fine in memory. **[ASSUMPTION]**

## 8. Guardrails and budget

**Two budgets, not one.** The "one query per user" rule applies to the expensive step, the full extraction call. Screening is a separate, cheap step with its own cap of **5 attempts**.

| Step | Model | Cost | Cap |
|---|---|---|---|
| Stage 1: screen | Smallest available model, classification only, ~300 tokens in, a few tokens out | Negligible | 5 attempts per user, each rejected quickly |
| Stage 2: extract and select | A mid-size model, ~1 to 2K tokens in, under 500 out | The real cost | **1 per user** |

Your read is right: a classifier is cheap, so forgiving rejected prompts is affordable. Stage 1 returns `ok`, `off_topic`, `unsafe` or `unclear`. Only `ok` proceeds to stage 2. The user sees a one-line reason and an example prompt, plus "N of 5 attempts left". After the fifth rejection the box locks.

**Filtering un-related, malicious or profane queries.** Four layers, cheapest first:

1. **Client pre-check, no LLM:** length limits (e.g. 20 to 1,500 characters), strip control characters, a lightweight profanity and obvious-injection pattern list. Rejected prompts here don't use an attempt.
2. **Stage 1 classifier:** off-topic means not about inference spend or planning. Unsafe means abuse, malicious or profane. Unclear means too thin to extract anything. The system prompt treats the user text as data, never as instructions.
3. **Stage 2 re-checks independently.** Its schema still carries a `verdict`, so an injection that fools the cheap classifier has to fool a second, different prompt too.
4. **Schema validation of the output:** chart IDs must be in the registry, numbers are clamped to knob ranges, and the schema allows no free-form actions. Even a successful injection can only choose among predetermined charts and clamped numbers, so the blast radius is small by construction.

**Identity and enforcement.** Counters can't live only in the browser, since that is trivially bypassed. The enforcement is a backend or edge concern, so here is the contract the UI needs. It is a layered approach, because IP alone is a poor fit for this audience:

- **IP alone is risky.** Your target users are companies of 50 to 100 people, often behind one shared office IP. A strict per-IP limit would lock out colleagues after the first person tries it, and a VPN bypasses it anyway.
- **Bootstrap decision BD-1 (accepted for MVP, revisit before go-live):** an anonymous first-party token (cookie plus local storage) carries the real 5 and 1 counters. A generous per-IP ceiling (say 30 screens and 10 full calls per day) sits behind it to stop scripted abuse without blocking an office. Optional later: asking for an email or login unlocks one more query, which doubles as lead capture.
- The UI sends the token on each call. The server returns `429` with `reason: screens_exhausted | extract_used | ip_limited`, and the UI renders a matching message, with the knobs still fully usable if a scenario already exists.

## 9. Trust and transparency

- **Provenance badges** on every series: *measured* (a run with a link), *modelled*, or *vendor-reported*. Mixed charts show both with different line styles.
- **Assumptions panel** listing defaults the LLM filled in, plus the baseline definition, the $/GPU-hr sources and the data version.
- **"How this is computed"** drawer per chart, with a Download CSV link for exactly the rows the chart uses.
- Both sides of every comparison use the same quality floor and latency target. The UI states them next to the headline.

## 10. States and edge cases

| State | Behaviour |
|---|---|
| Initial | Prompt box, three example chips (S1, S2, and a hardware-heavy example). Clicking a chip fills the box but doesn't submit. |
| Loading | Skeleton dashboard, "Reading your scenario...". Target under 5 seconds. |
| Rejected by screen | One-line reason, example prompt, "N of 5 attempts left". The box stays open and no album is shown. |
| Attempts exhausted | The box locks with a message. The example chips remain, so the user can still open a preset scenario. **[ASSUMPTION]** |
| LLM error or timeout in stage 2 | Offer "Use a default scenario" (S1 preset) so the user gets an album without a second extract call. **[ASSUMPTION]** |
| Infeasible budget | Inline banner with the covered fraction. Charts still render. |
| Missing data for a selected tier | The tier is greyed out in the knob with a tooltip. |
| Mobile | See 4.1: swipeable stage, dots plus thumbnail drawer, knobs in a bottom sheet. |
| Accessibility | Keyboard-operable knobs and album (arrow keys, focusable thumbnails with `aria-current`), caption announced on slide change, a data table behind each chart, WCAG AA contrast checked on real token values (see 14). |

## 11. Suggested build order

1. Static mock of the album layout (stage, filmstrip, knob rail, headline strip) with fixture CSVs for S1, and charts C1, C3, C5.
2. `compute()` with unit tests that replay S1 and S2 fixtures and check totals.
3. Knobs wired to `compute()`, with the live headline strip.
4. C2, C4, C9 (the SemiAnalysis-style frontier and quality charts).
5. LLM call: schema, guardrail prompt, repair path, and an offline eval set of about 50 prompts (good, off-topic, injection, profane, vague).
6. C6, C7, C8, case-study presets, provenance and assumptions panels, and mobile layout.

## 12. Decisions and remaining open questions

### Resolved (from your replies to v0.1)

| # | Question | Decision | Where it landed |
|---|---|---|---|
| 1 | Frontend stack | Embedded in the Infravana site, no framework preference, use a standard lightweight setup. | Section 13 |
| 2 | S2 story | Clients buy proprietary models through channels like Bedrock and Azure, so Infravana's gain there is a better deal across channels (provider arbitrage), plus routing to cheaper models and hardware. | 7.2, `model_offers.csv` |
| 3 | What is "today" | A company new to AI scaling from per-user vendor options to platforms that serve at scale. Modelled as three stages: Seats, API, Platform. | 5 (new knob), 7.2 |
| 4 | Accelerator data | Assume measured. The CSV says `modelled` where it isn't, and the UI badges only those. | 7.3 |
| 5 | Rejected prompts | Forgiven, with a cap of 5 screening attempts. The classifier is cheap, so this is affordable. | 8 |
| 6 | Identity | Accepted as a bootstrap decision (BD-1): anonymous token plus a generous per-IP ceiling, not IP alone. | 8, BD-1 |
| 7 | Chart density | Replaced by the photo-album layout, so the chart count matters less. | 4.1 |

### Bootstrap decisions (MVP defaults, to be revisited)

We are sprinting to an MVP and the backend doesn't exist yet. Each item below is a **default chosen to keep moving, not a final decision**. All of them get a review at production hardening and again before going live. Nothing here should be treated as agreed with the backend owner until that review. Each is logged with an ID (`BD-n`) so the review can walk the list.

| ID | Topic | MVP default | Why it's safe to defer | Revisit when |
|---|---|---|---|---|
| BD-1 | Identity and enforcement of the 5-screen and 1-extract caps | Accepted as recommended in section 8: an anonymous first-party token carries the counters, with a generous per-IP ceiling (about 30 screens and 10 extract calls a day) as a backstop. **MVP adds a global daily spend ceiling on the edge function as a kill switch**, since there is no real backend to catch abuse. | Only the edge function changes. The UI contract (`429` with a `reason`) stays the same. | Backend lands, and before go-live. Decide on login or email capture then. |
| BD-2 | Ownership and freshness of `model_offers.csv` and `seat_plans.csv` | Static CSV snapshots checked in with an `as_of` date per row. The footer shows "Prices as of {date}". No named owner yet. | The CSV schema is the contract, so a live feed can replace the snapshot without UI changes. | Backend lands. Needs an owner and an update cadence before go-live. |
| BD-3 | Baseline pricing realism | Seats and API stages use list price. The Platform stage applies a modest typical commit discount read from the `commit_discount_pct` column, not from code. The value is a placeholder, and the assumptions panel states it. | The number lives in data, so changing it is a CSV edit. | Before go-live, with real customer pricing evidence. |
| BD-4 | Embedding mechanism | A static bundle mounted at `/playground` on the existing site. An iframe is the fallback if the site's CSS clashes. | A route and an iframe wrap the same bundle, so switching costs little. | Before go-live, when the site's real structure is known. |
| BD-5 | Prices and discounts shown as facts | Every price on screen shows its `as_of` date and source link, and the assumptions panel lists the baseline definition. | It costs little now and protects credibility if a number turns out stale. | Ongoing. |

Earlier **[ASSUMPTION]** tags in this document are also bootstrap-grade, and the same review applies to them.

The most expensive of these to change later is the **CSV schema** in section 7.3, because the backend will be built against it. That is the one place worth a deliberate check with the backend owner before they start.

## 13. Stack for embedding

The current infravana.ai page is a single static HTML file (it appears to be served behind Cloudflare, judging by the email-protection script, which I haven't confirmed). There is no existing framework to match, so I'd pick the lightest setup that gives us what the spec needs.

| Concern | Recommendation | Why |
|---|---|---|
| App | React + TypeScript, built with Vite | Standard, small, and easy to hire for. The album, knobs and live thumbnails are all component-shaped. |
| Charts | Apache ECharts, imported per-chart (tree-shaken) | Covers every type in the registry, including line with Pareto step lines, log-axis scatter, bar and Sankey, plus built-in accessibility and tooltips. The lighter alternative is Recharts plus `d3-sankey`, which is simpler but gives us less for C2 and C6. |
| State | One `Scenario` object in a small store (Zustand or a reducer) | Every knob writes to it, and `compute()` reads from it. |
| CSV | PapaParse in a web worker | Keeps parsing off the main thread. |
| Compute | Plain TypeScript, pure functions, no framework | Unit-testable against the S1 and S2 fixtures. |
| LLM calls | A thin edge function holds the API key and enforces the counters | The key cannot live in the browser. This is the one backend touchpoint, and it is just a proxy with the contract in section 8. |
| Hosting | Static bundle at `/playground` on the existing site | Simplest. A web component or iframe is only worth it if the site's own CSS would clash with the app's. |

## 14. Design language

What I found on infravana.ai: a minimal, centred, light page. Background `#fafafa`, text `#222`, Arial, the logo above a plain heading, and muted grey for secondary text. There is little else to inherit, so this section proposes tokens that extend that look rather than copying a design system. **The logo colours below are estimated by eye, not sampled, so confirm them with whoever owns the brand before they ship.**

- **Logo:** a steel-blue, glossy node-and-ring figure on white, with a matching steel-blue wordmark. It is the one real brand colour on the site.
- **Surfaces:** background `#fafafa`, cards white with a 1px light-grey border and very soft shadow, generous whitespace. No dark mode in v1. **[ASSUMPTION]**
- **Text:** `#222` primary, roughly 60 to 70% opacity for secondary, as on the current page.
- **Accent:** steel blue taken from the logo (about `#5b7a94`, to be confirmed). This is the "With Infravana" colour on every chart, used consistently and nowhere else.
- **"Today" series:** neutral greys, so Infravana is the only coloured element. Where several "today" providers need separating, use grey tints plus pattern or direct labels, not extra hues.
- **Type:** system sans stack starting with Arial to match the current page, with tabular numerals for all figures. Large headline numbers, small plain-language captions.
- **Album chrome:** thin frame around the stage like a mounted print, a rounded filmstrip with the active thumbnail outlined in the accent, quiet arrows. Calm motion, nothing decorative.
- **Charts:** follow the `dataviz` skill: direct labels over legends, one takeaway sentence per chart, no chartjunk.
- **Contrast:** every text and chart-colour pair gets checked against WCAG AA with the real values (the `wcag-contrast-verification` skill) before we call the palette final. Steel blue on `#fafafa` for thin lines and small text is the pair most likely to need darkening.
