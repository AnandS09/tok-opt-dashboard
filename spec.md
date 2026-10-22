# Infravana Inference Playground: UI Spec (draft v0.4, NOT FROZEN)

Status: MVP draft v0.4, **NOT FROZEN**. v0.4 adds section 15, the requirements for your twelve visual and flow asks of 2026-10-22. Every design slot in it is pending your pick from the boards in mock/docs/design-v0.4/, and nothing in section 15 is built until you have chosen the designs, approved the spec and frozen it. Builds on [intent.md](intent.md). v0.3 folds in your decisions of 2026-10-21: the guided intake is the front door and the language-model layer is parked for a later version (Appendix A); the page takes the Research Note design language; charts sit on a carousel stage; every chart compares several "Today" options; goal tabs, an iso-cost Pareto chart and benefit boxes are added; the provenance rules of section 9 are restored.

Tags used in this document:

| Tag | Meaning |
|---|---|
| **[ASSUMPTION]** | My default where you were silent. Bootstrap-grade (section 12). |
| **BD-n** | A bootstrap decision: a default chosen to keep moving, revisited before go-live (section 12). |
| **[REQUIREMENT]** | Follows from something you already decided, or something the spec already promised. |
| **[PROPOSED]** | Drafted for v0.3 and not yet confirmed by you. Every one is repeated in "Questions for you" (12.4). |
| **P-n** | One of ten v0.3 proposals (P-1 to P-10). Each is tagged where it sits; the ones you have answered are now BD entries. |
| **[OPEN]** | Not known yet. Settled by you, by data or by a measurement, never filled in by a guess. |
| **[v0.4 DRAFT, supersedes ...]** | A clause changed in place by a v0.4 ask. The wording it replaces is kept verbatim in Appendix A.7, so it can be restored if you decline the ask. Not final until the spec is frozen. |
| **R-n** | One of the twelve v0.4 requirements, one per ask (section 15). |
| **[F]** | A number from report spec-feasibility-001 (2026-10-21), **measured on the invented placeholder data** by running `compute()` at commit `9813032`. The structure carries over to real data; the sizes do not. |

Most section numbers keep their v0.2 meaning, so code comments that cite "spec 7.2" or "spec 9" stay valid. New material sits in new subsections and in the appendix. These v0.2 sections changed meaning; build step 1 (section 11) updates the code comments and docs that cite them:

| v0.2 section | What it meant in v0.2 | Where that is in v0.3 |
|---|---|---|
| 4.1 | The album: filmstrip, live thumbnails, headline strip | 4.1 is the carousel stage; thumbnails live in its grid view; the hero is in 4.2 and 6.2 |
| 5 (budget range) | Budget $1K to $10M | 5.2: $1K to $100M |
| 6 (caption) | A one-sentence takeaway under each chart title | 6.4 benefit boxes; the sentence is the chart's accessible name only |
| 7.1 | The LLM call and its `verdict` rule | 7.1 is a stub kept for citations; the text is in Appendix A.2 |
| 10 | Prompt states, including Loading | Appendix A.5; section 10 now holds the intake and page states |
| 11 | Build order, step 1 the static mock | 11 is the v0.3 order; v0.2 steps 1 to 3 are built |
| 12 | Unnumbered subsections | Numbered 12.1 to 12.4; BD-n ids unchanged |
| 14 | v0.2 design language (`#fafafa`, white cards, Arial) | Research Note; the v0.2 text is replaced, not parked |

Each new or changed requirement is written as **Requirement / Why / Data and compute / Acceptance**.

## What changed in v0.4

Your twelve asks of 2026-10-22 on the running playground, with the process you set: "Before you start on an implementation sprint, I would like you to first show me images of what you propose to do. The selected design becomes part of the spec." Each ask is one requirement in section 15. Clauses the asks change are edited in place and tagged; the replaced wording is in Appendix A.7. Your answers of 2026-10-22 on asks 2, 9, 10, 11 and 12 are folded in and recorded in 12.5, which also lists the questions still open.

| Ask | Requirement | Clauses changed in place |
|---|---|---|
| 1 | R-1: an icon on "I sell AI compute" | 4.3 table |
| 2 | R-2: "Step n" with no total, and a progress rule already partly filled on step 1 | 4.3 requirement, acceptance (6) |
| 3 | R-3: the live estimate uses the visitor's own answers only | 4.3 requirement, data, live estimate, acceptance (5) |
| 4 | R-4: preset marks that never crowd | 5.1 (pointer only) |
| 5 | R-5: the editable sentence redesigned | 14.3 sentence |
| 6 | R-6: goal tabs that stand out; all four shown | 6.2, 10 |
| 7 | R-7: "Compared with" explained on the page | 6.1 |
| 8 | R-8: a chart index that never wraps | 4, 4.1 |
| 9 | R-9: no ordinal numbers on charts: titles, index, grid view | 4, 4.1, 14, 14.3 |
| 10 | R-10: provenance in a collapsed "Sources" table under each chart; no badge boxes or outlines | 6.3, 7.3, 9, 14.3, 14.4, BD-9, BD-11 |
| 11 | R-11: solid colour fills, no patterns; Today options in distinct hues | 6, 6.1, 14, 14.1, 14.4 |
| 12 | R-12: calm chrome, vivid and hopeful chart marks | 14, 14.1, 14.3, 14.5 |

## What changed in v0.3

| # | Item (your words or answer, or a proposal) | Where it lands |
|---|---|---|
| T | Theme: "go with Research Note style. Lets document in the spec." | 14 |
| R1 | "The current layout of the intake with Asymmetrical boxes needs to be made proper"; then "I need to see renders of this to make a choice. Why don't the design expert weigh in on this" | 4.3, BD-18 |
| R2 | Team size "more continuous yet clickable", not a 4-option box; then "Team size, customers and budget (Recommended)" | 5.1, 5.2, BD-12 |
| R3 | Carousel: one chart in focus, choose which, smooth transition | 4.1 |
| R4 | "Add more comparison points" to every chart | 6.1 |
| R5 | Tabs: less money for same AI, more AI for same money, more users for same money, take a performance hit | 6.2 |
| R6 | "Some sort of pareto chart at iso cost" | 6.3 (C10) |
| B | Replace the thin caption line with highlighted benefit boxes; then "Two or three numbers per chart (Recommended)" | 6.4, BD-14 |
| A1 | Front door: "Guided intake for the first cut, the llm layer comes in a later version" | 1, 4.3, 7.1, 8, Appendix A (closes P-10) |
| A2 | Today alternatives: "Each major API vendor, Other ways to buy, Best single option" | 6.1 |
| A3 | "put upto four most popular options as grey and infravana one"; then "Let the data decide, no named defaults" | 6.1, BD-13 |
| A4 | Reframe if results are equivalent, else separate optimisation; measured not equivalent, then "Yes, separate optimisations (Recommended)" | 6.2, BD-15 |
| A5 | Pareto axes: "Both, with a switch" | 6.3 |
| A6 | Give-up tab: "User chooses each separately" | 6.2 G4 |
| A7 | Chart picker: "Both" (numbered index plus thumbnail grid) | 4.1 |
| A8 | Provenance: "Restore the full spec rules" | 9, 14.4 |
| A9 | Tier moves: "No, keep the conservative rule" | 7.2, BD-8 |
| A10 | Speed data: "Extend placeholders, labelled invented (Recommended)", with five guardrails | BD-11, 6.2, 6.3, 7.4 |
| A11 | Fonts: "Self-host in the repo (Recommended)" | 13, 14.2, BD-16 |
| A12 | Branch: "Commit straight onto intake-v2" (local only) | 11, BD-17 |
| P-1 to P-10 | Proposals: P-1, P-2, P-5, P-6, P-7, P-9 and P-10 now decided; P-3, P-4 and P-8 tagged where they sit | 4.3, 5.2, 6.2; open ones in 12.4 |
| D | Build-time defaults the spec never recorded (amber notices, brand spelling, routing rule, badges, examples) | 12.3, BD-6 to BD-10 |
| N | Every number from the feasibility study, attributed | tagged [F] throughout |
| V | Fixes from review review-spec-001: C1 and C3 carry the extra Today options, G4 and C5 rules, build step 0 | 6.1 to 6.4, 11, 12.4 |

## 1. What we're building, in one paragraph

A single-page playground. A guided intake asks a few one-click questions (company type, the work, team size, customers, budget, speed) and fills one structured **Scenario**, with a live estimate beside the questions. The answers then become one editable sentence. The page shows a headline result per **goal tab**, **benefit boxes**, and a **stage** that holds one chart at a time from a fixed registry, picked from a numbered index or a thumbnail grid. Everything is computed in the browser from CSV data. Every input recomputes locally. Every chart in the v0.3 set contrasts up to four grey **"Today"** options (6.1 says how each chart draws them) (how companies typically buy inference now) with one **"With Infravana"** result (better channels for the same models, plus routing the open-weight share to cheaper hardware). There is no language-model call in v0.3. The v0.2 paragraph, which described the typed prompt, is kept in Appendix A.1.

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

In v0.3 both are reached through the intake or the example chips (BD-10), not a prompt.

## 4. Page layout

Top to bottom: header; the guided intake (4.3) until it is answered, then the editable sentence with a collapsed "Fine-tune the assumptions" panel (4.2, 5); the goal tabs and hero result (6.2); the stage (4.1) with its benefit boxes (6.4); the footer.

```
+-----------------------------------------------------------------------+
| [logo] Title                                            [Assumptions] |
+-----------------------------------------------------------------------+
| We are a software company with [50] people, [$100K] a quarter, ...    |
| > Fine-tune the assumptions                                           |
+-----------------------------------------------------------------------+
| [Less money] [More AI] [More people] [Accept a trade-off]  goal tabs  |
| HERO  $X less each quarter than <named Today>    [Talk to us]         |
| Compared with: [Typical API buyer  v]                                 |
+-----------------------------------------------------------------------+
| Where the money goes | What the budget buys | ...          [Grid view]|
| <  Where the money goes                                             > |
|    [ $X saved vs ... ] [ $X from channels ] [ $X from routing ]       |
|    STAGE: one chart, large                                            |
|    Source: ... Note: invented placeholders.  [How is this worked out?]|
+-----------------------------------------------------------------------+
| Footer: placeholder notice, data version, provenance legend           |
+-----------------------------------------------------------------------+
```

**[v0.4 DRAFT, supersedes the numbered index and the "Figure 1." title of this sketch; R-8, R-9.]** The places of the goal tabs, the "Compared with" control and the sentence are pending their designs (R-5 to R-7).

### 4.1 The stage (the album, reworked as a carousel)

- **Requirement [v0.4 DRAFT, supersedes "numbered, titled index"; R-8, R-9].** One chart is in focus at a time. The visitor picks it from a **titled index** (default) that never wraps to a second line (R-8), or from a **grid of live thumbnails** behind a "Grid view" button. Arrows, keyboard and swipe move between charts with a smooth transition.
- **Why.** You asked for "carousel like where one chart is in focus at a time", and "Both" for the picker. The stacked cards of commit 8e00537 replaced the v0.2 album; this restores it in a simpler form.
- **Data and compute.** None new. Every chart renders from the same `Results`.

| v0.2 album rule | v0.3 | Status |
|---|---|---|
| One chart fills the stage | Same | Kept |
| Filmstrip of live thumbnails under the stage | **[v0.4 DRAFT, supersedes the numbered index whose numbers matched the "Figure n." titles; R-8, R-9]** A one-line index of chart titles ("Where the money goes", "What the budget buys", ...) with no numbers, since the charts are independent and of equal priority (your answer of 2026-10-22), active item marked with `aria-current`. It never wraps to a second line; how it holds more titles than fit is the design chosen for R-8. | Changed |
| Grid view as a "contact sheet" | The live thumbnails live here. Click one to bring it into focus and close the grid. Render only thumbnails in view and throttle redraws while a control is dragged. | Kept, now the only home of thumbnails |
| Order fixed by registry priority (C1, C5, C3, then extras the LLM chose) | Registry order. The v0.3 set is C1, C5, C3, C10 **[ASSUMPTION]**; others join as they are built (11). | Changed: no LLM selection |
| Arrows, left/right keys, swipe, click a thumbnail | Same, plus click an index item. Left and right wrap at the ends **[ASSUMPTION]**. | Kept |
| URL hash `#slide=C2` | The hash holds `slide`, `goal`, `cmp=<pattern_id>` (omitted for the default) and, in G4, `q=<step>&s=<step>`; loading the hash restores each. C10 adds `c10=speed` when the speed view is on **[ASSUMPTION]**. (P-8) | Extended |
| Short cross-fade; respect `prefers-reduced-motion` | A short slide plus cross-fade, timed by a motion token (14.5); 0 ms under `prefers-reduced-motion`. The new chart's title is announced. | Kept |
| Headline strip pinned above the stage | Goal tabs, hero and comparator selector stay above the stage on every chart | Kept |
| Mobile: full-width swipe, dots plus thumbnail drawer, knobs in a bottom sheet | Below 600px: full-width stage with swipe; the index collapses to the focused chart's title, for example "What the budget buys", with no position count, and opens the full list **[v0.4 DRAFT, supersedes the "2 / 4" count; R-9]**; the grid view becomes two columns; fine-tune stays a collapsed panel | Changed |
| Fullscreen for presenting **[ASSUMPTION]** | Same | Kept |

- **Acceptance.** (1) Only one chart canvas is interactive at a time. (2) Each of arrow button, left/right key, swipe, index click and grid click reaches every chart. (3) Loading `#slide=C3` opens C3. (4) With reduced motion set, a change of chart has no animation. (5) **[v0.4 DRAFT, supersedes "At 375px the index fits one line"; R-8]** At every width R-8 tests, with all ten registry charts (C1 to C10) in the index, the index takes one line and the page does not scroll sideways. (6) An `aria-live="polite"` region holds the focused chart's title, and its text changes on every change of chart. (7) Loading `#slide=C1&goal=G4&cmp=<id>&q=<n>&s=<n>` restores the chart, tab, comparator and both G4 steps.

### 4.2 Other rules

- Once the intake is answered it becomes one editable sentence ("We are a software company with 50 people ..."). Each blank is a control from 5.1 or a list. Changing a blank recomputes the page. This replaces the v0.2 locked prompt and "Understood" strip, which are kept in Appendix A.3.
- The hero shows the active goal tab's headline (6.2), names the Today it is measured against, and keeps a "Talk to us about your numbers" call to action. This is the thing people screenshot.
- Both sides use the same quality floor and speed, stated under the hero (section 9). G4 is the one labelled exception (6.2).
- **Acceptance.** (1) Every blank of the sentence is a focusable control. (2) Changing any blank changes the `Scenario` with no reload. In G1 the hero updates within one frame; in G2 and G3 the previous value dims at once and the solved value replaces it within 0.5 s of the last change (6.2). (3) The hero names the comparator by its label.

### 4.3 The guided intake (the front door)

- **Requirement [REQUIREMENT].** The intake is the first thing a visitor sees. It asks the steps below one at a time, shows "Step n" with a progress rule and never the total (**[v0.4 DRAFT, supersedes "Step n of N"; R-2]**; on step 1 the rule is already partly filled, with one step's share of the longest path), lets the visitor go back or click an earlier answer to change it, and shows a live estimate beside the questions, computed from the visitor's own answers only (**[v0.4 DRAFT, supersedes the estimate computed from the example scenario; R-3]**).
- **Why.** Your decision: "Guided intake for the first cut, the llm layer comes in a later version". It is built (commit 62d75f2) but the spec never described it.
- **Data and compute.** Each answer writes into the one `Scenario`; nothing in the intake is a second source of truth. **[v0.4 DRAFT, supersedes "The estimate is one `compute()` call after each answer"; R-3]** Once the answers R-3 names are in, the estimate is one `compute()` call after each answer, on a scenario built from the visitor's answers and the defaults of section 5 only.

| Step | Question | Shown when | Input | Writes |
|---|---|---|---|---|
| Company type | What kind of company are you? | Always | 5 options: AI-first startup, Software or internet company, Traditional enterprise, Telecom or national cloud, Chip or hardware design company. A quieter final row "I sell AI compute (cloud or GPU provider)" goes to contact (BD-18) and carries an icon drawn like the five company icons **[v0.4 DRAFT, supersedes the row without an icon; R-1]**. | `stage_today` (api or platform per type), the type's workloads, their blended `model_mix`, default customers |
| Work | What do you use AI for? | Always | Multi-select of the type's workloads, Continue | `workload_mix` (even split within each basis) |
| Team size | How many people on your team will use AI? | The type offers employee work | 5.1 control | `baseline.users` |
| Customers | How many customers (or subscribers) use your AI? | The type offers customer work | 5.1 control | `baseline.customers` |
| Budget | What is your AI budget each quarter? | Always | 5.1 control | `baseline.budget_usd_per_quarter` |
| Speed | How fast do answers need to come back? | Always | 3 options: interactive, standard, batch | `latency_class` |

- **Live estimate [v0.4 DRAFT, supersedes "It is hidden on step 1 and appears from step 2 (BD-18)"; R-3].** A margin note (14.3) with Today, With InfraVana and "You save", per quarter, measured against the typical buyer for the stage (6.1). It is hidden on step 1. From step 2 it shows no figure until the visitor has answered the steps R-3 names, and every figure it shows is computed from the visitor's own answers only, never from the example scenario the intake starts from. The saving steps with scale: S1 on the API stage saves 20.00% at 0.5 to 7.3 users and 29.57% from 50 users [F], because commit minimums are met only at volume. That is real behaviour, not a bug.
- **Layout (BD-18, closes P-1).** All options of a step are equal in width and height and align on one grid; before v0.3 five company cards wrapped as three plus two with an empty cell. You asked the designer to decide from renders, and the study in `mock/docs/theme-options/intake-studies/README.md` recommends "A. Ruled list of equal rows": one full-width row per option, equal row heights, the same pattern on phones, and "I sell AI compute" as a quieter last row under the same rule that does not pose as a kind of buyer.
- **Acceptance.** (1) Every step in the table appears only under its condition. (2) **[v0.4 DRAFT, supersedes "Every answer changes the estimate"; R-3]** Once the estimate shows figures (R-3), every answer changes it within one frame of the click. (3) At 375, 768 and 1280px every option in a step has the same width and height and the same left edge (a layout test reads their bounding boxes). (4) No step leaves an empty cell in its last row. (5) **[v0.4 DRAFT, supersedes "from step 2 it is present"; R-3]** On step 1 the estimate panel is absent from the page; from step 2 it shows no figure until the answers R-3 names are in, then figures that pass R-3's acceptance. (6) **[v0.4 DRAFT, supersedes the "Step 1" and "Step n of N" labels; R-2]** On every step the label matches "Step n", with n the step's position for the chosen type (1 before a type is chosen), and never contains "of" or a total; the progress rule's filled share on step 1 is greater than zero.

## 5. Knobs

All knobs are controlled inputs bound to one `Scenario` object. Moving a knob re-runs the pure compute function (section 7) and re-renders. No network calls.

Since commit 8e00537 the knobs live in two places: the blanks of the sentence (company type, work, team size, customers, budget, speed) and a collapsed "Fine-tune the assumptions" panel (the rest). Defaults come from the intake answers, not a prompt.

| Knob | Control | Range and default | Notes |
|---|---|---|---|
| Users / workflows | Continuous but clickable (5.1) | 1 to 10,000 (5.2). Default from the intake. | The people / workflows toggle of v0.2 is not built; demand uses people. |
| Budget | Continuous but clickable (5.1), per quarter | $1K to $100M (5.2, BD-12; was $10M). Default from the intake. | Per quarter, with a month/year display toggle. |
| Where you are today | Segmented control: **Seats** (per-user subscriptions) / **API** (pay-as-you-go on one provider) / **Platform** (Bedrock, Azure or similar with committed capacity) | Set by the company type (4.3). | Sets the typical-buyer Today (6.1). The most important knob for how credible the comparison is. |
| Hardware tiers | Multi-select checkboxes grouped as GPU (H100, H200, B200, B300, MI300X, MI325X, MI355X...) and Accelerator (d-Matrix, Rebellions...) | Default: all available in the CSV. | Options come from the CSV, never hard-coded. Disabling tiers shrinks Infravana's search space and shows the effect. |
| Model mix | Two sliders: frontier / mid / small share (sums to 100%), and proprietary / open-weight share | Default from the intake's workloads. | Proprietary is priced per token via API. Open-weight can run on the GPU and accelerator tiers. See 7.2. A promise of "up to X% open-weight" must use `effective_open_share`: S2 asked for 1.0 gets the same result as 0.4 [F]. |
| Workload mix | Stacked slider over workload types (software design, hardware design, support, ...) | From the workload-profile CSV. | Each type carries its own tokens/user/day and quality floor. Employee and customer work have separate sliders. |
| Latency target | Dropdown: interactive (p95 TTFT and tok/s/user), standard, batch | Default: interactive. | Maps to a point on the interactivity axis. |
| Quality floor | Slider over a benchmark score | Default: per workload type. | Models below the floor are excluded from routing. |
| Reset | Button | Restores the intake answers. | |

When a knob change makes the scenario infeasible (budget too low for the workload at the quality floor), the page shows an inline "Budget covers only X% of this workload" state rather than empty charts.

### 5.1 Continuous but clickable inputs

- **Requirement (BD-12, BD-18).** Team size, customers and budget each use a log-scale slider with clickable preset marks and a typed number field. Team size and customers keep today's presets as marks (for example 25, 50, 100, 500 people for small-team types and 100, 500, 1,000, 5,000 for large ones). Budget marks are one per decade ($10K, $100K, $1M, $10M), because the old four would sit about 6% apart on a $1K to $100M log track (BD-18). The typed field accepts forms such as "2500", "20M" or "$1.5m". On tracks narrower than 640px the marks become a row of 44px buttons under the slider (BD-18). Clicking a mark sets that value; dragging or typing sets any value in range.
- **v0.4.** R-4 adds a spacing rule for the preset marks of all three sliders. The mark placement above, and acceptance (5) below, may change with the design chosen for ask 4; until then they stand.
- **Why.** You asked for team size "more continuous yet clickable", then chose "Team size, customers and budget (Recommended)". A log scale fits a 1 to 10,000 range in one track.
- **Data and compute.** None new. Dragging recomputes on a throttle, as in 4.1.
- **Acceptance.** (1) A preset mark sets the exact preset value. (2) Typing 73 gives 73. (3) Keyboard arrows step the value, and Page Up/Down jump between marks. (4) The slider, the field and the sentence blank always show the same value. (5) Below a 640px track width the marks render as 44px-high buttons in a row; at 640px and above they sit under the track at their values. (6) Typing "20M" in the budget field sets $20,000,000.

### 5.2 Ranges and clamping

| Input | v0.2 range | v0.3 range | Tag |
|---|---|---|---|
| Users | 1 to 10,000 | Same | Kept |
| Budget per quarter | $1K to $10M | $1K to $100M, log scale | Decided (BD-12) |
| Customers | Not set | 1 to 10,000,000, log scale; presets run 10,000 to 5,000,000 | **[ASSUMPTION]**, 12.4 |

- **The mismatch (why the budget range grew).** Today costs about $2,000 per user per quarter in S1, so 10,000 users cost $19.9M to $20.0M a quarter, twice the old $10M maximum (coverage 0.50). At 1 user with a $10M budget the coverage is 5,000x, a meaningless "headroom" figure [F]. The $100M maximum fits 10,000 users; it makes the headroom problem larger, hence the next rule.
- **Coverage display, P-3 [PROPOSED].** Above 10x, show "Your budget is more than ten times this work" instead of a multiple. The rule covers every budget multiple on the page: the coverage figure, the G2 and G3 headlines (6.2) and C5's multiple label. The 10x threshold is my default.
- **G3 cap [PROPOSED].** G3's solved head-count never exceeds the users range: above 10,000 people G3 shows "Your budget covers more than 10,000 people, the most this page models" instead of a figure.
- **Clamping, P-4 [REQUIREMENT].** The parser and every control clamp users, budget and customers to the ranges above. v0.2 section 8 promised clamping; the code does not do it. The parser today accepts users of −5 and a budget of −1 [F].
- **Acceptance.** (1) Parsing a scenario with users −5 gives users 1; budget −1 gives $1K; users 1e9 gives 10,000. (2) Typing a value out of range snaps to the nearest bound on blur. (3) At 1 user and the $100M budget, in every tab, no figure (coverage, G2, G3, C5 label) shows a multiple above 10x, and G3 never reports more than 10,000 people. (4) Parsing customers −5 gives 1 and customers 1e9 gives 10,000,000; the customers slider spans 1 to 10,000,000 on a log track.

## 6. Chart registry (fixed set)

Each chart has a fixed data contract and a fixed rendering. Adding a chart is a code change. In v0.3 no language model selects charts: the stage shows the v0.3 set in registry order (4.1). The column "When the LLM selects it" applies when the parked layer returns (Appendix A).

The three metric families from the intent doc are throughput p95, cost in dollars, and quality on benchmarks.

| ID | Chart | Type | Shows | Primary metric | When the LLM selects it |
|---|---|---|---|---|---|
| C1 | **Budget allocation, today vs Infravana** | Two stacked horizontal bars, same total, segmented by provider/channel and hardware tier. The Infravana bar also marks savings from provider arbitrage separately from savings from routing. | Where each dollar goes | Cost | Always (anchor chart). |
| C2 | **Efficiency frontier** | Line chart with Pareto lines per hardware class. X = tok/s/user, Y = tok/s per $ (or per GPU toggle). Infravana blended frontier drawn on top. | Why heterogeneous wins | Throughput p95 | Any time hardware or tier is mentioned. Default on. |
| C3 | **Cost per million tokens** | Grouped bars by model class, today vs Infravana | Unit economics at the chosen latency target | Cost | Always. |
| C4 | **Quality vs cost** | Scatter. X = $/Mtok (log), Y = benchmark score. Floor line on top. Infravana routes shown as arrows from today's choice. | What you give up (nothing, ideally) | Quality | When the prompt mentions open-weight, mid-tier or quality trade-offs. |
| C5 | **Tokens bought for the budget** | Bar pair plus a delta label; in v0.3 up to four grey bars plus one (6.1), at the active tab's volume (6.2) | "Same budget, N times the tokens" | Throughput and cost | Always. Its multiple is the active tab's (6.2). |
| C6 | **Workload routing map** | Sankey: workload types to model classes to hardware tiers | How Infravana places work | Cost, quality | When the prompt lists multiple workload types. |
| C7 | **Before / after scaling** | Paired panels showing C1 at scenario A and scenario B, with a delta table | Plan for growth | Cost | When the prompt gives two states (S2). |
| C8 | **Budget sensitivity** | Line. X = budget, Y = covered workload %, today vs Infravana | Where the budget breaks | Cost | When the prompt asks how much to spend. |
| C9 | **p95 latency by tier** | Box or bar per hardware tier at the chosen load | Whether the cheap tier is also fast enough | Throughput p95 | When latency or SLA is mentioned. |
| C10 | **Iso-cost frontier (new)** | Step line at a fixed budget. A switch picks X = quality floor or X = speed per user; Y = tokens a quarter the budget buys (6.3) | What you can buy if you accept less quality or speed | Cost, quality, throughput | v0.3 set; with the LLM layer, always. |

Selection rules:

- When the LLM layer returns: C1, C3 and C5 are mandatory. The LLM adds 1 to 3 more, for a total of 4 to 6.
- The "case study" requirement in the intent doc (frontier-heavy, mixed, open vs proprietary) is handled by a **case-study selector** above the grid, with presets that set the model-mix knobs and re-render. It is not extra charts. **[ASSUMPTION]**
- Visual rules follow the `dataviz` skill: Infravana is one consistent accent colour, "today" providers take the Today slot colours of the palette chosen for R-11 and R-12 **[v0.4 DRAFT, supersedes "neutral greys"]**, and every chart carries direct labels. The visible one-sentence takeaway is replaced by benefit boxes (6.4); the sentence stays as the chart's accessible name and table caption.

### 6.1 The comparison set: several Today options, one InfraVana bar

- **Requirement.** Every chart in the v0.3 set shows every grey Today option, **up to four**, against **one InfraVana bar**, drawn as the table "How each chart draws them" says.
  - **The candidates** (your answer): the typical buyer for the stage; the other ways to buy (seats, pay-as-you-go API, cloud platform); each major API vendor bought end to end; best single option.
  - **Which ones (BD-13).** "Let the data decide, no named defaults": the default greys are up to four, taken in popularity-rank order from a rank the data supplies per stage (`pattern_popularity.csv`, 7.4 **[PROPOSED]**; placeholder ranks in the mock, invented and labelled), so the grey order can differ between the seats, api and platform stages. The typical buyer is the one fixed member; the data decides the rest. The typical buyer is the `way_to_buy` pattern whose `stage` equals `stage_today`; it is never listed twice. If it does not rank in the top four, it takes the fourth slot so the four-grey limit holds **[ASSUMPTION]**.
  - **Best single option.** A selectable extra comparator that shows its own paired InfraVana result (BD-13). It is the cheapest single **proprietary** offer that meets every floor in the mix; open-weight hosted offers are not considered **[PROPOSED]**, as the S1 example below and the feasibility numbers assume. When best single option is the comparator, it replaces the lowest-ranked grey that is not the typical buyer; the grey count never exceeds four.
  - **One named comparator [REQUIREMENT].** The InfraVana bar is always measured against one named Today, the comparator. The hero, the benefit boxes and every chart name it.
  - **A page-wide "Compared with" selector [PROPOSED].** It defaults to the typical buyer, and changing it recomputes InfraVana against the new comparator on every chart and tab. Where it sits, and the one-line explanation beside it, are set by R-7 **[v0.4 DRAFT, supersedes "It sits above the stage"]**.
  - **Quality beside cost (BD-13).** Every Today bar shows its quality score next to its cost. The score is the token-weighted mean of the composite scores of the models it buys, plus a mark when it misses any workload floor **[ASSUMPTION]** (the measure is mine).
- **Why.** You asked to "Add more comparison points", naming "Where the money goes" (C1) as the example and adding "similar comments for other charts"; then "put upto four most popular options as grey and infravana one", and "Let the data decide, no named defaults". Under the conservative routing rule (BD-8) InfraVana keeps the comparator's model mix, so each Today implies a different InfraVana result. On S1 [F]:

| S1 Today option | Today | InfraVana against it | Saving |
|---|---|---|---|
| Typical buyer (API) | 100,012.50 | 70,440.09 | 29.57% |
| Way to buy: seats | 99,317.62 | 70,440.09 | 29.08% |
| Way to buy: platform | 95,691.96 | 70,440.09 | 26.39% |
| Vendor 1 end to end, direct (picks mid_a) | 20,002.50 | 14,613.02 | 26.94% |
| Vendor 2 end to end, direct (frontier_b) | 60,007.50 | 43,948.24 | 26.76% |
| Vendor 2 end to end, Bedrock | 58,287.29 | 43,948.24 | 24.60% |
| Best single option (mid_a on EC2, US East) | 16,562.07 | 14,613.02 | 11.77% |

  So a single InfraVana bar has to be defined against one named Today. Some grey bars are cheaper than InfraVana-against-typical because they buy cheaper, lower-scoring models: frontier_b scores 86.3 to 88.3 and mid_a 80.9 to 82.0, against 90.9 to 92.4 for frontier_a and workload floors of 65 to 79 [F]. Best single option undercuts it most (16,562 against 70,440, 4.3 times cheaper) [F], which is why it is a selectable comparator rather than a default bar, and why quality sits beside every bar.
- **How each chart draws them [PROPOSED].**

| Chart | Comparator Today and InfraVana | Each other grey Today option | Why |
|---|---|---|---|
| C1 | Two bars, each segmented by channel, as now | **[v0.4 DRAFT, supersedes the patterned option bars; R-11]** An unsegmented total bar with a solid fill, a direct label and its quality score. Each option bar takes the fill of its option slot from the chosen palette, never one used by the comparator's channel segments | C1 colours its Today segments with the same greys, so several segmented Today bars would collide [F]; unsegmented bars avoid that |
| C3 | Grouped bars per model class, as now | A marker per model class where that option has a price; none where it has none | Bars for 6 or 7 Today options would mean 18 to 21 bars with many empty cells [F] |
| C5 | One bar each | One bar each, with a direct label and its quality score | One value per bar, so it fits [F] |
| C10 | The InfraVana line | One reference per grey option (6.3) | |

  Four greys is a hard limit. **[v0.4 DRAFT, supersedes "slots 3 and 4 need the restored patterns"; R-11]** The four slots are told apart by solid fills that differ in hue and lightness, from the palette chosen for R-11 and R-12, behind direct labels. "Grey" stays the name of a Today slot whatever its colour (15).
- **Data and compute.** See 7.4: a `buying_patterns.csv` with a pattern per Today option, a `pattern_id` column replacing the three-value `stage` key of `baseline_providers.csv`, a pricing rule (list or commit) per pattern instead of `stage_today === "platform"`, best single option derived in compute rather than typed, and `Results.today_alternatives[]` so one call returns every shown Today with its total and its price per model class (for the C3 markers). That is up to seven extra `computeToday` calls inside `compute()`, which now takes 0.137 to 0.192 ms per call (review-w0-001, measured on placeholder data; 0.104 ms before the alternatives [F]). Per-stage ranks come from `pattern_popularity.csv` (7.4).
- **Acceptance.** (1) No chart shows more than four greys. (2) The typical buyer is always present, and the others follow the `popularity_rank` order for the visitor's stage; changing a rank in `pattern_popularity.csv` changes the set with no code change. (3) Every InfraVana number on the page names the same comparator. (4) Picking a comparator changes the hero, boxes and charts to that pairing, and S1 against vendor 2 direct shows 60,007.50 against 43,948.24 on placeholder data. (5) Every grey bar shows a quality figure. (6) **[v0.4 DRAFT, supersedes the patterned option bars; R-11]** C1 shows one unsegmented, solid-filled, labelled bar per grey option other than the comparator, and no fill appears both on a comparator channel segment and on an option bar; C3 shows one marker per such option per priced class. (7) The chosen comparator stays the same after switching tab, switching chart and reloading the URL. (8) A pattern other than `kind = best_single` (which is derived, not read from rows) with no `baseline_providers.csv` rows for the visitor's workloads is absent from the selector and the grey set, and the next by rank takes its slot. (9) With best single option as comparator, there are still at most four greys and the typical buyer is one of them. (10) Best single option is always a proprietary offer: on S1 with software engineering as the only work, it is never an open-weight offer such as open_x via neocloud. (11) With ranks that differ by stage, S1 at stage seats and at stage api shows different greys.

### 6.2 Goal tabs G1 to G4

- **Requirement.** Four tabs above the hero choose how the result is framed. **[v0.4 DRAFT, supersedes the tab group as built, with G3 greyed out; R-6]** All four are always shown, and the group reads as the main control of the result, not as background text. Each tab states which compute function produced its headline (in its "How is this worked out?" drawer). The tab is stored in the URL (`goal=G2`). P-8 [PROPOSED] covers the set, the order and the URL; the separate-optimisation rule is decided (BD-15).
- **Why.** You asked for tabs: "Some other executive might llike more users for the same money or they can take a performance hit (slower model) and save even more etc." Your rule: reframe if the results are equivalent, otherwise a separate optimisation. **They are not equivalent in general [F]:** the three views agree to 4 decimals on the four shipped scenarios, but drift by 0.5% to 11% where volume crosses a commit minimum (S2 at a $30K budget: 1.4628 claimed, 1.3002 solved), by about 3.5% with customer workloads (1.4115 against 1.4613), and by under 1% for seats. **So G2 and G3 are separate optimisations**, which you chose: "Yes, separate optimisations (Recommended)" (BD-15).

| Tab | Definition | Headline | Compute function | Acceptance |
|---|---|---|---|---|
| G1 Less money for the same AI | The visitor's volume, priced both ways | "$X less each quarter than <comparator>" and the % | `compute()` as today | Headline = sum of C1 savings segments; S1 shows 29.57% on placeholder data |
| G2 More AI for the same money | Same people and customers. Scale the token intensity of **all** workloads, employee and customer, until each side's spend reaches the budget, as the measured G2 did **[ASSUMPTION]** | "N times the AI work for your budget" | `solveAtBudget(scenario, tables, "intensity")` | No scanned scale above the result has spend at or below the budget; S2 at $30K gives about 1.30, not 1.46 [F]; S1 at 5,000 people and $90M gives about 1.42 (solver acceptance below) |
| G3 More people for the same money | Same work per person. Scale **employee workloads only** until each side's spend reaches the budget; customers stay fixed | "N times the people for your budget" | `solveAtBudget(scenario, tables, "users")` | Customers unchanged in the solved scenario; S1 with 10,000 customers gives about 1.46 [F]. **[v0.4 DRAFT, supersedes "Disabled, with a one-line reason, when the mix has no employee work"; R-6]** In the mock it can always be chosen; when the mix has no employee work it shows a labelled placeholder figure (10). Capped at the users range (5.2) |
| G4 Accept a trade-off | Two separate stepped controls: a quality step and a speed step. Today does not change | Two numbers: the saving at your own floors (the G1 figure) and the extra saving bought by the give-up, with both sides' floors and speeds stated beside them | Two `compute()` calls: one at your own floors, one with `tradeoff`; Today comes from the untraded call **[PROPOSED]** | Each step down never raises InfraVana spend; Today is identical at every step and equals the untraded call's; the first number equals G1's; the floors and speed shown for InfraVana are `infravana_side`'s |

- **`solveAtBudget` [PROPOSED].** Spend is not monotone in volume (a commit minimum can make spend fall as volume rises [F]), so the solver scans rather than inverting a formula.
  - **Ceiling from the budget.** For each side, S_max = 2 × budget ÷ that side's linear spend at the current volume. The users range does not set the ceiling; G3's result is capped afterwards (5.2).
  - **Geometric scan.** Scan s from 0.01 to S_max in 1% multiplicative steps (s × 1.01 each step: about 1,400 points from 0.01 to 10,000, fewer for a smaller S_max). Return the largest scanned s with spend ≤ budget, then bisect between it and the next scanned point to 0.1%. A build may instead jump between the `min_commit_usd` breakpoints, if it returns the same result.
  - **Cost and latency [PROPOSED].** About 1,400 points per side. Through the public `compute()`, which now also builds the Today alternatives, a call takes 0.137 to 0.192 ms and the S2 solve about 0.54 s, over target (review-w0-001, measured on placeholder data); the 0.104 ms of [F] predates the alternatives. So the solver calls the internal core that skips the alternatives (7.4), and the 0.5 s target applies to the solve through that core; the core's own per-call time is not yet measured. The G2 and G3 solves run off the main thread (a web worker), start after a 150 ms debounce **[ASSUMPTION]**, and show the previous value dimmed until the new one arrives. The target is the solved value within 0.5 s of the last change. The "within one frame" promise of 4.2 applies to G1 only.
  - **Headline.** The InfraVana scale divided by the Today scale.
  - **Acceptance.** (1) No scanned s above the result has spend ≤ budget. (2) S1 at 5,000 people and a $90M budget gives G2 about 1.42, not 1.0. Today is about $2,000.25 and InfraVana about $1,408.80 per person per quarter at that scale; both figures were measured on placeholder data in review-spec-002's re-run of the feasibility scripts. (3) S1 at 1 user and $100M returns a finite G2, shows the coverage message of 5.2, and G3 shows the 10,000-people message. (4) Each solve, run through the internal core, finishes within 0.5 s on S1, S2 and hardware_heavy, and the main thread never blocks for more than one frame while it runs. (5) `compute()`'s signature and its results on the default scenarios are unchanged by the core.
- **C5 follows the tab [PROPOSED].** C5's bars and its multiple use the active tab's own figure: in G1 the linear tokens bought (`1/(1 − saving)`, from the same saving as the G1 headline); in G2 and G3 the solved volumes; in G4 the G1 linear figure at the relaxed plan, labelled "at the trade-off you chose". One chart states one multiple per tab. Grey options other than the comparator are not solved: their bars always use `today_alternatives[].tokens_at_budget` (linear), and in G2 and G3 each carries the label "Estimated at its average price", so a reader can see the two bases. The current hero line "N times the AI work for the same money" is the G1 multiple; it moves to G2 and uses the solved figure.
- **G4 in plain words [PROPOSED].**
  - **Quality step.** Acts on the open-weight share only (BD-8): 13% to 21% of tokens at defaults on S1 and S2, and 2.5% on hardware_heavy [F]. It snaps to the composite scores in `quality.csv`: 5 to 9 distinct levels per scenario. On S1 the lowest step saves up to 7.8% more (InfraVana 70,440 at default floors, 64,957 at the lowest) [F].
  - **Speed step.** Lets a proprietary offer move to its own batch or flex price tier, and the open-weight share to slower, cheaper hardware rows. The same model at the same quality is not a model or tier move, so this is consistent with the conservative rule (BD-8). On current data, with open-weight rows only, the step is worth at most 0.094% (S2: 49,555.12 to 49,508.65) [F]. It becomes meaningful with the extended invented rows (BD-11). Its steps are the latency classes plus the speed points those rows add; the exact list is set when the rows exist.
  - **Exception to section 9.** G4 is the one place where the two sides use different floors and speeds, because you chose to give something up. Its headline therefore states both sides' floors and speeds beside the two numbers.
  - **Scope.** `tradeoff` applies only while G4 is active; G1 to G3 and their charts always use the visitor's own floor and speed.
  - **Two calls [PROPOSED].** G4 runs `compute()` twice: once at your own floors and speed, once with `tradeoff`. Inside `compute()`, `Scenario.tradeoff` changes the InfraVana plan only, never Today. Today's figures come from the untraded call. `Results` gains `infravana_side: {quality_floor_by_workload, latency_class}`; it equals the Today-side values when there is no trade-off, so the hero reads both sides' floors and speeds from `Results`.
  - The large G4 saving would come from moving traffic between model tiers, which you declined.
- **Data and compute.** New `solveAtBudget`; `Scenario` gains `goal` and `tradeoff`; `model_offers.csv` gains `price_tier` (7.4). G1 stays one call.
- **Acceptance (all tabs).** (1) Switching tabs changes the hero, its drawer, the benefit boxes and C5; while G4 is active its controls recompute every chart **[ASSUMPTION]**. (2) Reloading with `goal=G3` opens G3. (3) Each drawer names its function. (4) After leaving G4, G1's headline and C1 equal their values before G4 was opened. (5) In each tab, C5's multiple label equals that tab's multiple (G1 linear, G2 and G3 solved, G4 linear at the relaxed plan). (6) In G4 the hero shows both sides' floors and speeds, the InfraVana ones read from `infravana_side`. (8) With no trade-off, `infravana_side` equals the Today-side floors and latency class; with a quality step, only `infravana_side.quality_floor_by_workload` changes and Today's figures equal the untraded call's. (7) In G2 and G3 every grey bar other than the comparator shows "Estimated at its average price"; in G1 and G4 no bar shows it.

### 6.3 C10: iso-cost Pareto chart

- **Requirement.** A new registry entry. Hold the budget fixed. X is a threshold the visitor would accept; Y is the tokens a quarter that budget buys with InfraVana. A switch picks **quality versus volume** (X = quality floor) or **speed versus volume** (X = minimum tokens/s per user). Quality is the default view **[ASSUMPTION]**, because it is the one with real shape on current data.
- **Why.** You asked for "Some sort of pareto chart at iso cost", with "Both, with a switch".
- **How each point is derived.** One `compute()` call per threshold: set the floor (or the speed class threshold), read `tokens_bought.infravana_tokens`. In the quality view, X is a single global floor that replaces every workload's own floor; the marked "current setting" is the lowest of the visitor's workload floors. A new `frontier(scenario, tables, axis, thresholds[])` returns the points, because `Results` has no sweep [F]. Thresholds are the distinct composite scores (quality) or the distinct `tok_s_per_user` values (speed). The speed sweep includes the batch or flex move of 7.2. Only points not beaten on both axes are drawn, as a step line.
- **How Today is drawn.** One horizontal reference line per grey Today option (up to four, 6.1), at the tokens its budget buys, since the threshold never changes Today. In the speed view, once the invented proprietary speed rows exist (BD-11), each Today is drawn as a point at its own speed instead **[ASSUMPTION]**.
- **What current data gives [F].** Quality view: 5 to 9 real steps, with Y up to 1.5 times Today's on S1. Speed view: 16 to 28 points but flat within 0.2% to 1.5% and then one cliff, and Today has no speed value at all. Not credible as is.
- **When the speed view is available.** The C10 speed view and the G4 speed step are enabled only when at least one proprietary offer has speed data (BD-11 rows or real); otherwise they are disabled with a reason.
- **Data it needs to be credible.** Per-channel speed (tok/s per user and p95 TTFT) for proprietary offers; batch or flex price tiers; capacity or GPU-count limits, so a higher speed actually costs more (the engine assumes unlimited capacity); finer concurrency points than the current six (1, 8, 32, 64, 128, 256). The invented rows of BD-11 cover the first two; the last two are a question (12.4).
- **Acceptance.** (1) Every point equals a direct `compute()` at that threshold. (2) Y never rises as the threshold tightens. (3) The marker for the current setting sits at the lowest of the visitor's workload floors (78 on S1 at defaults). (4) **[v0.4 DRAFT, supersedes "carries the provenance badge"; R-10]** The speed view's Sources table lists the invented rows as modelled, and the invented-data source line is present (BD-11). (5) The switch state is in the URL (`c10=speed`). (6) With no proprietary speed rows loaded, the speed switch is disabled and shows its reason.

### 6.4 Benefit boxes

- **Requirement (BD-14).** The thin caption sentence under each figure title ("This work costs $X a quarter today and ...") is replaced by 2 or 3 boxes. Each box is a number, a short label and the named comparator ("vs typical API buyer"). Every number is derived from that chart's data in `Results`; none is typed. No box in any tab equals that tab's headline.
- **Why.** You asked for "highlighted benefits, maybe boxes", then chose "Two or three numbers per chart (Recommended)". Naming the comparator keeps each claim honest under 6.1.
- **Contents per chart [ASSUMPTION]** (the rule is decided; this table is mine). The headlines are: G1 the total saving and its %; G2 and G3 their multiples; G4 the G1 saving and the extra saving. No box below uses any of those numbers, so none repeats the headline in any tab:

| Chart | Box 1 | Box 2 | Box 3 | Box 4 | Same in every tab? |
|---|---|---|---|---|---|
| C1 | Saved through better channels (arbitrage), $ a quarter | Saved through routing, $ a quarter | Saving per head, $ a quarter (per team member, or per customer when the mix has no team work) | Saving per million tokens | Yes; in G4 all reflect the give-up |
| C5 | Tokens a quarter with InfraVana, at the tab's volume | Share of the work the budget covers | Extra tokens over the comparator, at the tab's volume | | Values follow the tab (6.2) |
| C3 | Price per million tokens, largest model class, both sides | Largest drop by class | Blended price per million tokens over all classes, both sides | | Yes |
| C10 | Volume at your current setting | Volume at the lowest step | Extra volume over the comparator at your current setting | | Yes |

- **Which boxes show [PROPOSED].** Candidates are taken in column order and the first three that survive are shown. A box whose value is zero is hidden.
- **Backstop rule.** Evaluated per active tab; a box equal to the hero's headline number is dropped; a chart then shows its remaining boxes, minimum one. A chart shows fewer than two boxes only when no other candidate is nonzero, which keeps your "Two or three" rule otherwise.
- **Data and compute [PROPOSED].** `ChartDef` gains `benefits(results, context) -> {value, label, comparator}[]`, where `context` (type `BenefitContext`) holds `scenario`, the active `goal`, `solve` (the `solveAtBudget` result, or null), `frontier` (the `frontier` result, or null) and `headcount` (the people or customer count the per-head boxes use, or null when the mix has no team work and no customers). `Results` alone does not carry these, so the boxes of the table above need the context. `caption` stays as the accessible name.
- **Acceptance.** (1) Every box names a comparator. (2) In each of G1 to G4, no box number equals any number in that tab's headline. (3) A code search finds no literal savings figure in box code. (4) Styled per 14.3. (5) On S1 with the open-weight share set to 0, in G1, C1 hides the $0 routing box, drops the arbitrage box (it equals the headline) and shows saving per head and saving per million tokens. (6) No box ever shows a zero value. (7) No chart shows more than three boxes.

## 7. Mechanics: from inputs to charts

### 7.1 One LLM call, structured output

Parked for a later version; the v0.2 text is in Appendix A.2 intact. In v0.3 the guided intake (4.3) fills the `scenario` member of that JSON directly, and the `Scenario` type keeps its shape. The `verdict`, `charts`, `missing` and `narrative` members belong to the parked call; the example scenario files still carry them.

### 7.2 Compute engine (pure functions, runs in the browser)

`compute(scenario, tables) -> results`. It is deterministic, has no side effects, and is unit-testable against fixtures.

1. **Demand.** `tokens/quarter = users x workload_mix x tokens_per_user_per_day(type) x working_days`, split into input and output tokens, from the workload-profile CSV. Customer workloads scale with `customers`, not `users`.
2. **Today (baseline).** The persona is a company new to AI that is scaling from vendor options for individuals and small teams towards platforms that serve at scale. The "Where you are today" knob picks the stage, and each stage has a defined buying pattern in `baseline_providers.csv`:
   - **Seats:** per-user subscriptions. Cost is `users x seat price`, with a usage cap that pushes heavy users to API overage.
   - **API:** pay-as-you-go list price from a single provider, one model family per workload.
   - **Platform:** the same models through a cloud platform (Bedrock, Azure and similar), at list or provisioned-throughput pricing, with one provider and no cross-provider arbitrage.
   The baseline is a documented typical-buyer config, not the cheapest possible one. The assumptions panel states it, and the baseline definition is a CSV, so it can be tightened later without code changes. v0.3 adds more buying patterns beside the three stages (6.1, 7.4).
3. **With Infravana.** For each workload type, choose among all allowed offers that satisfy the quality floor and latency target, and pick the cheapest subject to capacity. Start with greedy-by-cost-per-token and swap to a small LP if capacity constraints bind. There are two sources of gain, and the UI keeps them visible as separate segments in C1:
   - **Provider arbitrage for proprietary models.** The same model is sold through several channels (direct API, Bedrock, Azure and so on) at different list prices, commitment discounts and regional prices. Infravana's gain here is the better deal across them. It does not change the model.
   - **Routing to cheaper models and hardware.** Where quality permits, move a share of traffic to mid-tier or open-weight models served on heterogeneous GPU and accelerator tiers.
   **As built (BD-8):** InfraVana never changes the comparator's tier shares; routing acts only on the open-weight share; moving traffic to a cheaper tier is not implemented. In G4 and in the C10 speed view only, a proprietary offer may move to its own batch or flex price tier (same model, same quality; 6.2, 6.3) **[PROPOSED]**. Capacity is unlimited, so "subject to capacity" and the LP are not implemented either [F].
4. **Budget.** If cost exceeds budget, report the covered fraction. If under budget, report the remaining headroom and the extra tokens it buys (C5). The budget never changes the InfraVana plan, only tokens bought and coverage [F]; no copy may say InfraVana "optimises to your budget". G2 and G3 solve against the budget separately (6.2).
5. **Chart series.** Each chart's data is a view over `results`.

Credibility rules:

- The S2 story is "same frontier models through a better channel, plus routing what can move to cheaper models and hardware." The engine shows those as separate segments instead of claiming blanket hardware savings. Provider arbitrage needs real price data per channel (see `model_offers.csv`), so it is only as credible as that file.
- Every "Infravana" number must come from the CSVs through `compute()`. No hard-coded multipliers. If a stakeholder wants a fixed "Infravana is 40% cheaper" claim, that belongs in marketing copy, not in a chart that looks measured.
- Every InfraVana number names the Today it is measured against (6.1).

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
| `workloads.csv` | `workload_id, label, tok_in_per_user_day, tok_out_per_user_day, quality_floor, default_model_mix, basis (employee/customer)` |
| `baseline_providers.csv` | `stage (seats/api/platform), workload_id, offer_id or plan_id, share_default` (defines "today" for each stage); v0.3 replaces `stage` with `pattern_id` (7.4) |
| `case_studies.csv` | `case_id, label, model_mix_json, description` (drives the presets) |
| `manifest.json` | file versions, row counts, checksums, `generated_at` |

Provenance **[v0.4 DRAFT, supersedes the badges; R-10]**: every series whose provenance is not `measured` has a row, "modelled" or "vendor-reported", in its chart's collapsed Sources table, as section 9 says (BD-9), with a link to its source where the data holds one. A series with no row is measured, and a non-measured series is never left out. The `provenance` columns are unchanged. The contract gains an optional `source_url` column on `hardware.csv` and `seat_plans.csv`, the two files that feed a chart series and hold no address today (`hardware.csv` has the text column `hr_price_source`); `model_offers.csv`, `buying_patterns.csv` and `quality.csv` keep their `source_url` and `throughput_curves.csv` its `run_url`. Every address in the current fixtures is the invented placeholder address, so no real source exists yet.

Loading: fetch all CSVs once at page load, parse with a streaming parser in a web worker, validate against schemas (fail loudly with a friendly banner if a column is missing), and hold them in memory. Throughput curves are the largest file. Expect tens of thousands of rows at most, which is fine in memory. **[ASSUMPTION]**

### 7.4 v0.3 changes to the contract, compute and CSVs

The CSV schema is the most expensive thing to change later (12.3), so these need a check with the backend owner. Column names below are proposals.

| Area | Change | For |
|---|---|---|
| `buying_patterns.csv` (new) | `pattern_id, label, kind (way_to_buy/vendor_end_to_end/best_single), stage (seats/api/platform or empty), vendor, pricing_rule (list/commit), source_url, as_of`. A `best_single` row has no baseline rows; compute derives it from proprietary offers only (6.1). Popularity is not held here. | 6.1 |
| `pattern_popularity.csv` (new) **[PROPOSED]** | `pattern_id, stage, popularity_rank, popularity_source`: one integer rank per pattern per visitor `stage` (seats/api/platform); lower is more popular; ties broken by `pattern_id`; a pattern with no rank for the visitor's stage is never a default grey. `pattern_id` is a foreign key to `buying_patterns.csv`. In the mock the ranks are invented, labelled, and differ between stages. | 6.1 |
| `baseline_providers.csv` | `stage` becomes `pattern_id` (foreign key to `buying_patterns.csv`); rows per workload for each pattern | 6.1 |
| `model_offers.csv` | New `price_tier (standard/batch/flex)` and `provenance` columns; per-offer speed columns `tok_s_per_user, p95_ttft_ms` (or rows in `throughput_curves.csv` keyed by `offer_id`) | 6.2 G4, 6.3, BD-11 |
| `throughput_curves.csv` | Optional `offer_id`; finer concurrency points | 6.3 |
| Capacity (open) | GPU-count or capacity limits per hardware row, if the speed view is to be credible | 6.3, 12.4 |
| Fixtures | Invented proprietary speed and batch or flex rows under the five guardrails of BD-11; invented per-stage ranks in `pattern_popularity.csv`, labelled | BD-11, 6.1 |
| Contract `Stage` | Stays `seats/api/platform` for the intake. New `PatternId` (string from data) replaces the fixed enum wherever a Today is chosen | 6.1 |
| Contract `Scenario` | Adds `comparator: PatternId` (default: typical pattern for `stage_today`), `goal: "G1"/"G2"/"G3"/"G4"`, `tradeoff?: {quality_step, speed_step}` (read only while `goal` is G4, and applied to the InfraVana plan only) | 6.1, 6.2 |
| Contract `Results` | Adds `comparator`, and `today_alternatives[]`: `{pattern_id, label, total_usd, tokens_at_budget, usd_per_mtok_by_class, quality_score, meets_floors, provenance}`; adds `infravana_side: {quality_floor_by_workload, latency_class}`, equal to the Today side without a trade-off (6.2) **[PROPOSED]** | 6.1, 6.2 |
| Contract `ChartDef` | Adds `benefits(results, context)`, with `BenefitContext = {scenario, goal, solve, frontier, headcount}` (6.4) **[PROPOSED]**; `caption` becomes the accessible name only | 6.4 |
| Compute | `compute(scenario, tables)` stays the one public pure function, unchanged in signature. Inside it, an internal core (for example `computeCore(scenario, tables, options)`) does the work and can skip the Today alternatives; `solveAtBudget` and `frontier` call the core, not `compute()` **[PROPOSED]**. `computeToday(demand, scenario, tables, patternId)`; pricing rule read from the pattern, not `stage_today === "platform"`; `solveAtBudget(scenario, tables, axis: "users" or "intensity")`; `frontier(scenario, tables, axis, thresholds[])`; clamping in the parser | 6.1 to 6.3, 5.2 |
| Checks | A script fails if any proprietary speed or batch-price row lacks the placeholder marker (BD-11); `check-demand.mjs` keeps asserting the default numbers are unchanged | BD-11 |

## 8. Guardrails and budget

Parked for a later version with the prompt; the v0.2 text is in Appendix A.4 intact. One promise from it still applies in v0.3: numbers are clamped to knob ranges (layer 4), now required in 5.2 (P-4). With no language-model call there is no per-visitor query budget to enforce.

## 9. Trust and transparency

- **Sources table [v0.4 DRAFT, supersedes the provenance badges and line styles; R-10].** Under each chart a collapsed "Sources" disclosure, like "Fine-tune the assumptions", opens a table with one row per series or group that is *vendor-reported* or *modelled*, and a link to its source where the data holds one. A series with no row is *measured* (a run with a link). No badge box, outline or line style carries provenance.
- **Assumptions panel** listing defaults the LLM filled in, plus the baseline definition, the $/GPU-hr sources and the data version. In v0.3 it lists the intake's defaults (for example customers per company type) instead.
- **"How this is computed"** drawer per chart, with a Download CSV link for exactly the rows the chart uses.
- Both sides of every comparison use the same quality floor and latency target. The UI states them next to the headline. G4 is the one labelled exception, because you chose to give something up; it states both sides' floors and speeds (6.2) **[PROPOSED]**.
- **Restored in v0.3, reversed by v0.4 asks [v0.4 DRAFT, supersedes the restored badges, outlines and patterns; R-10, R-11].** In v0.3 you chose "Restore the full spec rules". Your v0.4 asks 10 and 11 and your answers of 2026-10-22 remove the badges, the dashed and dotted outlines and the patterns, and keep the information in a collapsed Sources table under each chart (R-10, R-11, 12.5).
- Every chart carries a source line, and any chart that uses invented speed or batch rows also says "Source: invented placeholder data" (BD-11).
- **Acceptance.** (1) Every chart in the v0.3 set renders a source line under its canvas. (2) **[v0.4 DRAFT, supersedes "and the provenance badge"; R-10]** With BD-11 rows loaded, the G4 view and the C10 speed view each show "Source: invented placeholder data" and a Sources table listing the invented rows as modelled; the G1 view shows neither the invented source line nor the invented rows. (3) The footer text contains "invented" whenever BD-11 rows are loaded. (4) **[v0.4 DRAFT, supersedes "shows its badge and dashed outline"; R-10]** A modelled series has a row in its chart's Sources table and no dashed outline.

## 10. States and edge cases

The prompt states of v0.2 (Initial, Loading, Rejected by screen, Attempts exhausted, LLM error) are in Appendix A.5 intact.

| State | Behaviour |
|---|---|
| Intake not started | Step 1 with no estimate panel (BD-18), and the example chips (BD-10). |
| No work picked | Continue is disabled and the estimate says "Pick at least one kind of work". |
| Infeasible budget | Inline banner with the covered fraction. Charts still render. |
| Budget far above the work | The coverage message of 5.2 instead of a multiple. |
| G3 with no employee work | **[v0.4 DRAFT, supersedes the disabled tab; R-6]** In the mock the tab can be chosen and shows a labelled placeholder figure. Wherever a later build cannot offer a tab, it looks as R-6 says, with the reason "Your answers include no team work" **[ASSUMPTION]**. |
| Comparator has no rows for this mix | It is left out of the selector and the grey set; the next by popularity fills the slot. `kind = best_single` is derived, not read from rows, so this rule never removes it. |
| Speed data missing | The C10 speed view and the G4 speed step are enabled only when at least one proprietary offer has speed data (BD-11 rows or real); otherwise they are disabled with a reason. |
| Missing data for a selected tier | The tier is greyed out in the knob with a tooltip. |
| Mobile | See 4.1: swipeable stage, collapsed index, two-column grid view, fine-tune collapsed. |
| Accessibility | Keyboard-operable controls and stage (arrow keys, index items and thumbnails focusable, `aria-current` on the active one), new chart title announced on change, a data table behind each chart, WCAG AA contrast checked on real token values (see 14). |

- **Acceptance.** (1) Removing every `baseline_providers.csv` row of one pattern (other than `best_single`) for the visitor's workloads drops it from the selector and the grey set, and the next ranked pattern appears. (2) With no proprietary speed rows loaded, the G4 speed step and the C10 speed switch are disabled and each shows its reason; loading one such row enables both. (3) **[v0.4 DRAFT, supersedes "G3 is disabled and shows its reason"; R-6]** With no employee work, in the mock G3 can be chosen and its hero carries the placeholder label of R-6.

## 11. Suggested build order

Built in the mock so far: v0.2 steps 1 to 3 (fixtures, `compute()` with checks, controls with a live headline, charts C1, C3, C5), then the guided intake (62d75f2) and stacked charts (8e00537). Commits for this build go straight onto branch `intake-v2`, local only, no push and no PR; parallel workers use separate git worktrees merged into `intake-v2` (BD-17). The v0.3 order:

0. **Contract and data foundation [PROPOSED].** Lands alone, as one commit on `intake-v2`, before any parallel work starts: `PatternId`; `Scenario.comparator`, `goal` and `tradeoff`; `Results.comparator`, `today_alternatives[]` and `infravana_side`; `ChartDef.benefits(results, context)` with `BenefitContext`; `buying_patterns.csv` and `pattern_popularity.csv` plus the `baseline_providers.csv` `pattern_id` migration with loader and schema validation; `computeToday(…, patternId)` with the per-pattern pricing rule; parser clamping and the range constants; the internal compute core; and stub signatures for `solveAtBudget` and `frontier`. Acceptance: the type-check passes, `check-demand.mjs` reports the default numbers unchanged, and no later step edits these types' shapes.

After step 0, steps 1 to 4 and step 6 can run in parallel worktrees **[PROPOSED]**. Step 5 starts once step 2 has specified the patterns (14.4). Step 6's C5 change lands after step 5. Steps 7 to 10 each start after the steps they name.

1. **Citation update.** Update the code comments and docs that cite a v0.2 section whose meaning changed (the header table): `mock/README.md` (build step 1 of section 11), `src/contract.ts` (lines citing 4.1, 6 and 14, and 7.1), `src/components/HeadlineStrip.tsx` (4.1), `src/components/Skeleton.tsx` (10), `src/charts/dev/renderCheck.ts` (5, budget range), `mock/docs/design-tokens.md` (14) and `mock/public/data/README.md` (7.1). Acceptance: a case-insensitive scan of `mock/` for "spec 4.1", "spec 5", "spec 6", "spec 7.1", "spec 10", "section 11" and "spec 14" finds only citations whose text matches v0.3.
2. Research Note tokens, self-hosted fonts and type (14), with the restored provenance marks specified by the designer (14.4).
3. Intake layout (4.3, BD-18), continuous inputs (5.1), ranges and clamping (5.2).
4. The stage carousel, index, grid view, URL hash and phone layout (4.1).
5. The comparison set: grey options in C1, C3 and C5, the comparator selector, quality beside each bar (6.1), with fixtures, after step 2's pattern specification.
6. `solveAtBudget` (in a worker) and goal tabs G1 to G3 (6.2); its C5 change (C5 following the tab) lands after step 5.
7. Benefit boxes (6.4), after steps 5 and 6.
8. Invented speed and batch rows, the `price_tier` column and their check script (BD-11), then G4 (6.2), after step 6.
9. `frontier()` and C10 (6.3), after steps 5 and 8.
10. The rest of v0.2: C2, C4, C9, then C6, C7, C8, case-study presets, provenance and assumptions panels.
11. Later version: the language-model layer of Appendix A (schema, guardrail prompt, repair path, an offline eval set of about 50 prompts).

## 12. Decisions and remaining open questions

### 12.1 Resolved (from your replies to v0.1)

| # | Question | Decision | Where it landed |
|---|---|---|---|
| 1 | Frontend stack | Embedded in the Infravana site, no framework preference, use a standard lightweight setup. | Section 13 |
| 2 | S2 story | Clients buy proprietary models through channels like Bedrock and Azure, so Infravana's gain there is a better deal across channels (provider arbitrage), plus routing to cheaper models and hardware. | 7.2, `model_offers.csv` |
| 3 | What is "today" | A company new to AI scaling from per-user vendor options to platforms that serve at scale. Modelled as three stages: Seats, API, Platform. | 5 (new knob), 7.2 |
| 4 | Accelerator data | Assume measured. The CSV says `modelled` where it isn't, and the UI badges only those. | 7.3 |
| 5 | Rejected prompts | Forgiven, with a cap of 5 screening attempts. The classifier is cheap, so this is affordable. | 8 (parked, Appendix A.4) |
| 6 | Identity | Accepted as a bootstrap decision (BD-1): anonymous token plus a generous per-IP ceiling, not IP alone. | 8, BD-1 (parked, Appendix A) |
| 7 | Chart density | Replaced by the photo-album layout, so the chart count matters less. In v0.3 the album is the carousel stage. | 4.1 |

### 12.2 Resolved in v0.3 (your answers of 2026-10-21)

| # | Question | Decision | Where it landed |
|---|---|---|---|
| 8 | Front door | Guided intake for the first cut; the language-model layer comes in a later version | 1, 4.3, Appendix A |
| 9 | Theme | Research Note | 14 |
| 10 | Today alternatives | Each major API vendor, other ways to buy, best single option; up to four most popular as grey, plus InfraVana | 6.1 |
| 11 | Reframe or separate optimisation | Reframe if equivalent, else separate. Measured: not equivalent. Then "Yes, separate optimisations (Recommended)" | 6.2, BD-15 |
| 12 | Pareto axes | Both, with a switch | 6.3 |
| 13 | Give-up tab | Speed and quality chosen separately | 6.2 G4 |
| 14 | Chart picker | Both: numbered index and thumbnail grid | 4.1 |
| 15 | Provenance | Restore the full spec rules | 9, 14.4 |
| 16 | Tier moves | No, keep the conservative rule | 7.2, BD-8 |
| 17 | Speed demo data | Extend placeholders, labelled invented, with five guardrails | BD-11 |
| 18 | Continuous inputs | "Team size, customers and budget (Recommended)"; budget up to $100M a quarter | 5.1, 5.2, BD-12 |
| 19 | Which Today bars | "Let the data decide, no named defaults" | 6.1, BD-13 |
| 20 | Benefit boxes | "Two or three numbers per chart (Recommended)": named comparator, from the chart's data, never the hero's number | 6.4, BD-14 |
| 21 | Fonts | "Self-host in the repo (Recommended)" | 13, 14.2, BD-16 |
| 22 | Where build commits go | "Commit straight onto intake-v2" (local only) | 11, BD-17 |
| 23 | Intake layout | "I need to see renders of this to make a choice. Why don't the design expert weigh in on this": the designer's recommendation applies | 4.3, 5.1, BD-18 |
| 24 | Parking the prompt layer (P-10) | "Guided intake for the first cut, the llm layer comes in a later version" | Appendix A |

### 12.3 Bootstrap decisions (MVP defaults, to be revisited)

We are sprinting to an MVP and the backend doesn't exist yet. Each item below is a **default chosen to keep moving, not a final decision**. All of them get a review at production hardening and again before going live. Nothing here should be treated as agreed with the backend owner until that review. Each is logged with an ID (`BD-n`) so the review can walk the list.

| ID | Topic | MVP default | Why it's safe to defer | Revisit when |
|---|---|---|---|---|
| BD-1 | Identity and enforcement of the 5-screen and 1-extract caps | Parked with the language-model layer; the v0.2 row is in Appendix A.6 intact. | No language-model call in v0.3. | When the layer returns. |
| BD-2 | Ownership and freshness of `model_offers.csv` and `seat_plans.csv` | Static CSV snapshots checked in with an `as_of` date per row. The footer shows "Prices as of {date}". No named owner yet. | The CSV schema is the contract, so a live feed can replace the snapshot without UI changes. | Backend lands. Needs an owner and an update cadence before go-live. |
| BD-3 | Baseline pricing realism | Seats and API stages use list price. The Platform stage applies a modest typical commit discount read from the `commit_discount_pct` column, not from code. The value is a placeholder, and the assumptions panel states it. | The number lives in data, so changing it is a CSV edit. | Before go-live, with real customer pricing evidence. |
| BD-4 | Embedding mechanism | A static bundle mounted at `/playground` on the existing site. An iframe is the fallback if the site's CSS clashes. | A route and an iframe wrap the same bundle, so switching costs little. | Before go-live, when the site's real structure is known. |
| BD-5 | Prices and discounts shown as facts | Every price on screen shows its `as_of` date and source link, and the assumptions panel lists the baseline definition. | It costs little now and protects credibility if a number turns out stale. | Ongoing. |
| BD-6 | Notice colour | Amber family (`#fff6dd`, `#6b4a00`, `#a07a1a`) for state banners only, never charts. Fallback: white banner, dark border, icon. | Reversible; one token group. | Your sign-off. |
| BD-7 | Brand spelling | UI copy writes "InfraVana", as the live site does; the spec, files and code keep "Infravana". | Copy only. | Your sign-off. |
| BD-8 | Conservative routing rule | InfraVana never changes the tier shares. Savings come from the cheapest channel per proprietary model (arbitrage) and the cheapest eligible hardware or channel for the open-weight share (routing). No tier moves; capacity unlimited. | Least flattering reading of 7.2; needs no invented reroute share. You confirmed it on 2026-10-21 for v0.3. | When real data and a rule for a reroute share exist. |
| BD-9 | Badging | **[v0.4 DRAFT, supersedes "is badged"; R-10]** Every non-measured series has a row in its chart's collapsed Sources table (R-10), following section 9 over 7.3. | Display only. | Your answer of 2026-10-22 (12.5). |
| BD-10 | Examples | The mock loads the S1 example on start, and the example chips open their scenario directly instead of filling a prompt box. The intake now sits in front. | Reversible once a prompt flow exists. | When the layer returns. |
| BD-11 | Invented speed and batch rows | Fixtures gain invented proprietary speed and batch or flex price rows, under five guardrails: (1) every invented row carries the placeholder source address (`https://example.invalid/placeholder-invented-data/...`) and `provenance=modelled`, and the data README lists exactly which rows are invented; (2) a check script fails if any proprietary speed or batch-price row lacks the placeholder marker; (3) the rows, and the batch or flex move they allow (7.2), act only on the G4 tab and the C10 speed view, so the default tab's numbers do not change; (4) any chart that uses them lists them in its Sources table and shows a "Source: invented placeholder data" line, and the footer says so **[v0.4 DRAFT, supersedes "shows the provenance badge"; R-10, 12.5]**; (5) the same columns are listed (7.4) as inputs the real backend must supply. | The rows are labelled, checked and fenced off from the default view. | When the backend supplies real rows. |
| BD-12 | Continuous inputs | "Team size, customers and budget (Recommended)": all three use the log slider with clickable presets and a typed number (5.1). Budget runs to $100M a quarter so 10,000 users fit (5.2). | Control and range only; compute unchanged. | Customers range is my default (5.2, 12.4). |
| BD-13 | Today set | "Let the data decide, no named defaults": up to four greys in `popularity_rank` order from the data (invented, labelled ranks in the mock); the typical buyer for the stage always present as the comparator; best single option a selectable extra comparator with its own paired InfraVana result; quality shown beside every Today bar (6.1). | The ranking lives in data. | When the backend names a real popularity source. |
| BD-14 | Benefit boxes | "Two or three numbers per chart (Recommended)": each naming its comparator, derived from that chart's data, never repeating the hero headline (6.4). | Display only. | Contents per chart reviewed at build. |
| BD-15 | Goal tabs G2 and G3 | "Yes, separate optimisations (Recommended)", computed by `solveAtBudget` (6.2). | One function; the tabs read its result. | If prices stop stepping with volume, the views converge anyway. |
| BD-16 | Fonts | "Self-host in the repo (Recommended)": Newsreader and Hanken Grotesk ship with the bundle; no third-party requests (13, 14.2). | Swapping the source is a CSS change. | Licence check before go-live (12.4). |
| BD-17 | Build commits | "Commit straight onto intake-v2": local only, no push, no PR; step 0 lands alone, then parallel workers in separate worktrees merged into `intake-v2` (11). | Local history only. | Before anything is published. |
| BD-18 | Intake layout and controls | "I need to see renders of this to make a choice. Why don't the design expert weigh in on this". The designer recommends (`mock/docs/theme-options/intake-studies/README.md`): a ruled list of equal rows, with "I sell AI compute" as a quieter final row; a log slider with clickable preset marks plus a typed number for team size, customers and budget. The designer's own product choices, which you may overrule: budget marks one per decade; the empty step-1 estimate hidden; on narrow tracks the marks become a row of buttons. | Layout and copy only. | If you overrule any of the three product choices (12.4). |

Earlier **[ASSUMPTION]** tags in this document are also bootstrap-grade, and the same review applies to them.

The most expensive of these to change later is the **CSV schema** in section 7.3, because the backend will be built against it. That is the one place worth a deliberate check with the backend owner before they start.

### 12.4 Questions for you

Only points you have not answered are listed. Closed by your answers on 2026-10-21, now decisions: P-1 (BD-18), P-2 (BD-12), P-5 and P-6 (BD-13), P-7 (BD-14), P-9 (BD-11), P-10 (12.2 row 24), G2 and G3 as separate optimisations (BD-15), fonts (BD-16), commits (BD-17). Each item below goes ahead as written unless you say otherwise. **v0.4:** items 1 (patterns), 5 (where the selector sits) and 19 (G3 disabled) are changed by v0.4 asks; the questions on them are in 12.5.

**Rulings that close contradictions [PROPOSED].**

1. **Extra Today options in C1 and C3.** In C1 each grey option other than the comparator is an unsegmented total bar with a pattern, a direct label and its quality score; the comparator and InfraVana bars stay segmented by channel. In C3 each other option is a marker per model class where it has a price. Each C1 option bar takes a pattern reserved for its option rank, never one of the comparator's channel patterns; the designer sets them. (6.1, 14.4)
2. **G4 speed step and the C10 speed view.** In G4 and in the C10 speed view only, a proprietary offer may move to its own batch or flex price tier: same model, same quality, so not a model or tier move under BD-8. The quality step acts on the open-weight share only. (6.2, 6.3, 7.2)
3. **G4 and section 9.** G4 is the labelled exception to section 9's rule that both sides use the same floor; its headline shows the saving at your own floors and the extra saving bought by the give-up, with both sides' floors and speeds beside them. (6.2, 9)
4. **C5 follows the tab.** C5's bars and multiple use the active tab's own figure: G1 linear, G2 and G3 solved, G4 the linear figure at the relaxed plan. Other grey options are never solved; in G2 and G3 their bars are labelled "Estimated at its average price". (6.2)
5. **Page-wide "Compared with" selector**, default the typical buyer, recomputing every chart and tab. (6.1)
6. **Budget multiples.** The 10x coverage rule covers G2, G3 and C5 as well, and G3 is capped at 10,000 people with a message. (5.2)
7. **Build order.** The contract and data foundation (step 0) lands alone before any parallel work. Step 5 waits for step 2's pattern specification, and step 6's C5 change lands after step 5. (11)
8. **P-8, the tabs.** Four tabs in this order, the tab in the URL, each naming its compute function. (6.2)
9. **The solver.** The ceiling comes from the budget (2 × budget ÷ the side's linear spend), the scan is geometric in 1% steps, and the solve runs in a worker with the previous value dimmed, within 0.5 s. The "within one frame" promise applies to G1 only. (6.2, 4.2)
10. **Which benefit boxes show.** C1, C3 and C10 get further candidate boxes; zero-valued boxes are hidden; the first three survivors show. (6.4)
11. **Popularity per stage.** Ranks live in a separate `pattern_popularity.csv` (`pattern_id, stage, popularity_rank, popularity_source`), one per pattern per stage, so the grey order can differ by stage. (6.1, 7.4)
12. **Benefit context.** `ChartDef.benefits(results, context)`, with the scenario, the active goal, the solve result, the frontier result and the head count in `context`. (6.4, 7.4)
13. **Best single option is proprietary only.** Open-weight hosted offers are not considered. (6.1)
14. **Internal compute core.** `compute()` stays the one public pure function; the solver and the frontier use an internal core that skips the Today alternatives, and the 0.5 s target applies to the solve through that core. (6.2, 7.4)
15. **G4 as two calls.** One `compute()` at your own floors and one with the trade-off; Today from the untraded call; `tradeoff` changes the InfraVana plan only; `Results.infravana_side` holds the InfraVana floors and speed. (6.2, 7.4)

**My defaults [ASSUMPTION].**

16. **G2 scope.** G2 scales the intensity of all workloads, employee and customer, as the measured G2 did; G3 scales employee workloads only. (6.2)
17. **Customers range** 1 to 10,000,000 on a log scale; today's presets run 10,000 to 5,000,000. (5.2)
18. **Rules adopted to close ambiguities:**
    - `solveAtBudget` scans in 1% steps up to the range limit, then bisects to 0.1%.
    - The typical buyer is the `way_to_buy` pattern for the stage, and it takes the fourth slot if it ranks lower.
    - Best single option as comparator replaces the lowest-ranked other grey.
    - `popularity_rank` is per stage, with ties broken by `pattern_id`.
    - `tradeoff` applies only in G4.
    - C10's quality X is one global floor, marked at your lowest workload floor.
    - The speed views are enabled only with proprietary speed data.
    - A box equal to the headline is dropped (minimum one).
    - The URL holds `slide`, `goal`, `cmp`, the G4 steps and `c10`.
    - The solver waits for a 150 ms debounce before it starts.
    - The new box candidates are saving per head and saving per million tokens (C1), the blended price over all classes (C3), and the extra volume over the comparator at your setting (C10).

    (4.1, 6.1 to 6.4, 7.4)
19. **Charts and tabs:**
    - The quality score is the token-weighted composite score plus a mark when a floor is missed.
    - The benefit-box contents per chart are in the 6.4 table.
    - In the C10 speed view, Today appears as points once speed rows exist.
    - C10 opens on the quality view.
    - Tabs change the hero, boxes and C5, while G4 recomputes every chart.
    - G3 is disabled without team work.
    - The stage set is C1, C5, C3 and C10, and the arrows wrap at the ends.

    (4.1, 6.1 to 6.4)
20. **The designer's three product choices (BD-18).** Budget marks are one per decade, the step-1 estimate is hidden, and the marks become buttons on narrow tracks. Overrule any of them if you wish. (4.3, 5.1)

**Open questions.**

21. **P-3, coverage threshold.** Is 10x the right threshold? (5.2)
22. **P-4, clamping.** Clamp silently, or also show a clamped value as "assumed"? (5.2)
23. **Popularity source.** What real source should the backend use for `popularity_rank`? (6.1)
24. **What "Each major API vendor" means when bought end to end.** Is it each vendor's cheapest model that meets every floor, or each vendor's frontier model?
    - With the cheapest model, vendor 1 buys mid_a, at S1 20,002.50 [F].
    - With the frontier model, vendor 1 equals the typical API bar.

    (6.1)
25. **Cheaper grey bars.** Some grey bars cost less than InfraVana and are shown with their lower quality beside them (vendor 1 and vendor 2 end to end on S1 [F]). Are you comfortable with that, or should a floor rule exclude them? (6.1)
26. **Batch prices in G1.** Once real batch prices exist, should the intake's "batch" answer use them in G1? Under BD-11 the invented rows stay out of it. (6.2)
27. **Credible speed view.** Should the engine gain capacity or GPU-count limits and finer concurrency points? (6.3, 7.4)
28. **Accent and font licences.** Research Note deepens the accent to `#466577` from the logo sample `#5f7a89`. Does the brand owner accept that? And are the Newsreader and Hanken Grotesk licences cleared for self-hosting? (14)
29. **Product name.** The theme screenshots title the page "AI Budget Playground", while the spec calls it "Infravana Inference Playground". Which name ships? (14)
30. **Sign-off** on BD-6 (amber notices), BD-7 (brand spelling), BD-9 (badging) and BD-10 (examples). (12.3)

### 12.5 v0.4: your answers and the questions still open

**Resolved by your answers of 2026-10-22.** Each reverses something decided earlier; the clauses are edited in place and the v0.3 wording is in Appendix A.7.

| Ask | Your answer | What it reverses | Where |
|---|---|---|---|
| 2 | "just show a slightly increased bar wrt 6 steps and don't spell how many steps", then keep "Step n": the label reads "Step 1", "Step 2" and so on with no total, and the progress rule is already partly filled on step 1 (1 of 6) | 4.3 acceptance (6): "Step 1" before a type is chosen, "Step n of N" after | R-2, 4.3 |
| 9 | No ordinal numbers anywhere: not in the figure titles, not on the index, not in the grid view, because the charts are independent and of equal priority | The "Figure n." titles of the Research Note theme (14.3) and the numbered index of your answer "Both" (12.2 row 14) | R-9, 4.1, 14, 14.3 |
| 10 | Keep the information, which is the data's source of truth, in a collapsed disclosure under each chart, like "Fine-tune the assumptions", holding a table with a row per box, its provenance and a link to the source where one exists; the boxes and the dashed and dotted outlines go; no address is invented | Your v0.3 "Restore the full spec rules" for badges and outlines (12.2 row 15), BD-9, and guardrail (4) of BD-11 | R-10, 7.3, 9, 14.4, BD-9, BD-11 |
| 11, 12 | Today options may take distinct hues; the charts are the selling data and should look colourful, impressive and hopeful; the chrome stays calm; the designer proposes, you choose | The patterns of "Restore the full spec rules" (12.2 row 15) and the greys for Today (14, 14.1, section 6) | R-11, R-12, 6, 6.1, 14, 14.1, 14.4 |

**Open questions.** Each goes ahead on the default shown, tagged where it sits, unless you say otherwise.

1. **R-3, which answers come first.** Default **[ASSUMPTION]**: the estimate shows figures once the head-count steps the type asks (team size, customers, or both) and the budget are answered. So on most paths figures first appear on the speed step. On the v0.3 rules none of the three figures depends on the budget (7.2 step 4), so they could appear after the head count alone. Which do you want?
2. **R-3, speed before it is answered.** Default **[ASSUMPTION]**: until speed is answered the estimate prices interactive speed, the section 5 default, and says so under its figures. Waiting for speed would mean no figures during the intake at all, because speed is the last step.
3. **R-3, the panel before the figures.** Default **[ASSUMPTION]**: from step 2 the panel is present with one line naming the answers still needed, not hidden. Continue on the value a control showed when the step opened counts as an answer.
4. **R-1, the compute-seller row.** Default **[ASSUMPTION]**: it gains an icon and keeps the quieter treatment of BD-18.
5. **R-4, scope and gap.** Default **[ASSUMPTION]**: the no-crowding rule covers all three sliders (team size, customers, budget), with at least 8px between neighbouring marks. If the chosen design drops marks, the preset lists of 5.1 change with it.
6. **R-5, baseline tolerance.** Default **[ASSUMPTION]**: every blank's text sits within 1px of the sentence's baseline.
7. **R-6, G3 in the mock.** Default **[ASSUMPTION]**: with no team work G3 can be chosen and shows a labelled placeholder figure, whose value is **[OPEN]** and comes with the chosen design; meanwhile C5 and the benefit boxes show the G1 figures. This reverses "G3 is disabled without team work" (6.2, 10, 12.4 item 19).
8. **R-6, how prominent the tabs are.** Default **[ASSUMPTION]**: one row at 768px and wider, each tab at least 44px high, the selected tab marked by a fill and a cue that is not colour.
9. **R-7, the explanation line.** Default **[ASSUMPTION]**: "Your savings are measured against this way of buying today. Pick another to compare with it." Where the control sits comes with the chosen design; this replaces "It sits above the stage" (6.1, 12.4 item 5).
10. **R-8, how many charts and which widths.** The registry table lists ten charts (C1 to C10), so the index is tested with ten. Default **[ASSUMPTION]**: the unbuilt charts are stood in by their registry names, at 600, 768, 1024, 1280 and 1920px.
11. **R-10, details of the Sources table.** Defaults **[ASSUMPTION]**: the disclosure is labelled "Sources"; measured series get no row, so a chart with only measured series has no disclosure; a row whose data holds several addresses lists each; the placeholder address `https://example.invalid/...` counts as no source and reads "placeholder, no source yet".
12. **R-11, how different two fills must be.** Default **[ASSUMPTION]**: at least 10 in CIEDE2000 between any two fills in one chart, and Today hues at least 30 degrees from the accent's. The largest number of fills one chart needs is **[OPEN]** until it is counted on the fixtures.
13. **R-12, how the palette is checked.** Defaults **[ASSUMPTION]**: every chart fill has more chroma than every chrome token; at least two hues beyond the accent, the notice amber not counted; InfraVana keeps the accent hue, its value open with the brand owner (12.4 item 28).
14. **Corners and shadows.** Default **[ASSUMPTION]**: corner radii follow the chosen designs (14.3 acceptance (5)); the no-shadow rule (14.3 acceptance (4)) stays unless a board you choose shows shadows.

## 13. Stack for embedding

The current infravana.ai page is a single static HTML file (it appears to be served behind Cloudflare, judging by the email-protection script, which I haven't confirmed). There is no existing framework to match, so I'd pick the lightest setup that gives us what the spec needs.

| Concern | Recommendation | Why |
|---|---|---|
| App | React + TypeScript, built with Vite | Standard, small, and easy to hire for. The stage, knobs and live thumbnails are all component-shaped. |
| Charts | Apache ECharts, imported per-chart (tree-shaken) | Covers every type in the registry, including line with Pareto step lines, log-axis scatter, bar and Sankey, plus built-in accessibility and tooltips. The lighter alternative is Recharts plus `d3-sankey`, which is simpler but gives us less for C2 and C6. |
| State | One `Scenario` object in a small store (Zustand or a reducer) | Every knob writes to it, and `compute()` reads from it. |
| CSV | PapaParse in a web worker | Keeps parsing off the main thread. |
| Fonts | Newsreader and Hanken Grotesk files self-hosted in the repo and served with the bundle (BD-16) | The page is embedded in your site and makes no third-party requests. |
| Compute | Plain TypeScript, pure functions, no framework | Unit-testable against the S1 and S2 fixtures. |
| LLM calls (parked, Appendix A) | A thin edge function holds the API key and enforces the counters | The key cannot live in the browser. This is the one backend touchpoint, and it is just a proxy with the contract in section 8. |
| Hosting | Static bundle at `/playground` on the existing site | Simplest. A web component or iframe is only worth it if the site's own CSS would clash with the app's. |

## 14. Design language: Research Note

The page reads as a published research note: warm paper, serif figure titles, sourced figures with no figure numbers (**[v0.4 DRAFT, supersedes "numbered and sourced figures"]**, R-9), structure drawn by rules instead of cards and shadows. You chose it on 2026-10-21. Source of every value below: `mock/docs/theme-options/source/d1-research-note.css`; contrast figures from `mock/docs/theme-options/contrast-tables.md` (WCAG 2.x, table d1) unless marked otherwise. The brief stands: the page must not look AI-generated and should look like a leading-edge infrastructure startup. The option's named risk is that it is calm rather than "leading edge" and can read as a blog. v0.4 asks 11 and 12 address that risk (R-11, R-12).

What it keeps from v0.2: the steel-blue logo, unedited; the accent for InfraVana, with Today's colours taken from the palette chosen for R-11 and R-12 (**[v0.4 DRAFT, supersedes "greys for Today"]**); the accent used for "With InfraVana" and nowhere else; the footer line "Illustrative figures only. Prices and savings are placeholders, not quotes."; light mode only **[ASSUMPTION]**.

### 14.1 Palette

**[v0.4 DRAFT: this table is superseded once you choose a palette for R-11 and R-12.]** It is the v0.3 palette. The chosen board's token table will replace it here, and this table will then move to Appendix A.7. Until then its values stand, except the Today row below.

| Role | Token | Value | Contrast (d1 table) |
|---|---|---|---|
| Page (warm paper), chart ground | `--color-bg` | `#f6f4ef` | Body text 15.53:1 |
| Surface | `--color-surface` | `#fbfaf6` | Body text 16.34:1 |
| Muted panel | `--color-surface-muted` | `#eeebe3` | Secondary text 5.78:1 (lowest text pair) |
| Text | `--color-text` | `#1c1c1a` | 15.53:1 on page; focus ring 15.53:1 |
| Secondary text, axis ticks | `--color-text-secondary` | `#5c5a55` | 6.27:1 on page, 6.60:1 on surface |
| Rules | `--color-border` | `#d6d1c7` | Decorative |
| Input and chip borders | `--color-border-strong` | `#8a867f` | 3.47:1 on surface, 3.30:1 on page (lowest border pair) |
| Accent, InfraVana fills | `--color-accent` | `#466577` | Mark 5.64:1 on chart ground; label on it 5.93:1 |
| Accent text, thin lines | `--color-accent-strong` | `#3d5a6b` | 6.65:1 on chart ground, 7.00:1 on surface |
| Primary button | `--color-accent-deep` / hover `--color-accent-hover` | `#2f4856` / `#233843` | Label 9.21:1 |
| Selected option background | `--color-accent-soft` | `#e8ebea` | Accent text 6.09:1, body 14.23:1 |
| Saved money only | `--color-positive` / fill `--color-saved` | `#1f6b5e` / `#dcebe5` | Figure 5.75:1 on page; label on fill 13.86:1 |
| Today options, slots 1 to 4 | `--color-today-1` to `-4` | **[OPEN]** from the palette chosen for R-11 and R-12 **[v0.4 DRAFT, supersedes the two greys]** | Measured on the chosen values (R-11) |
| Notices (BD-6) | notice bg / text / border | `#fff6dd` / `#6b4a00` / `#a07a1a` | Text 7.48:1; border 3.61:1 on page |

- The accent `#466577` is the logo hue deepened (hue 202°, saturation 26%); the logo-sampled `#5f7a89` of `mock/docs/design-tokens.md` is superseded for the theme, pending the brand owner (12.4).
- **[v0.4 DRAFT, supersedes the two-grey rule and its patterns; R-11]** v0.3 had only two distinct greys, 1.41:1 apart, which is why it needed patterns. v0.4 removes the patterns: the Today slots take solid fills in distinct hues, differing in hue and lightness (your answer of 2026-10-22), neighbouring parts keep separators, and every part keeps its direct label. Every InfraVana series still carries a direct label.

### 14.2 Type

- **Hosting (BD-16).** Both fonts are self-hosted in the repo ("Self-host in the repo (Recommended)"), not loaded from Google Fonts, so the embedded page makes no third-party requests. Their licence files ship beside them; the licence terms are still to be checked (12.4).
- **Acceptance (BD-16).** Loading the page makes zero requests to an origin other than the page's own; both font files load from the bundle.
- **Headings, figure titles, the estimate figures and the hero figure:** Newsreader (serif), weight 500. Hero figure 3.6rem (2.3rem under 600px); intake title 2.6rem; figure titles 1.85rem.
- **Body and UI:** Hanken Grotesk, falling back to Arial.
- **Figures:** tabular, lining numerals, as in v0.2. Serif text at small sizes needs care; keep serif at 1.1rem and above.

### 14.3 Shape and page patterns

- **Corners and depth:** 2px corners everywhere, no shadows. Sections sit on the paper between 1px ink rules, not in cards.
- **Header:** title in Newsreader, italic tagline, a 1px ink rule below; the logo has no plate.
- **Intake:** step labels in small capitals with tracking; a 2px progress rule; options on the surface with a 1px rule, selected or hovered option in white with an accent-strong border; equal rows per BD-18.
- **Estimate:** a margin note with one vertical ink rule at its left; italic serif title. Under 600px it moves above the questions with a top rule.
- **Sentence [v0.4 DRAFT, superseded by the design chosen for R-5].** Until a design is chosen, large serif with blanks underlined in accent-strong. R-5 sets the rules the chosen design must meet.
- **Hero:** a double rule above, italic lead, large serif figure.
- **Figures [v0.4 DRAFT, supersedes the "Figure n." label and the matching index number; R-9].** Each chart shows its title alone, with no "Figure n." label, and a 1px ink rule above. Each ends with a source-and-note line: "Source: InfraVana cost model on illustrative price tables. Note: all figures are invented placeholders, not quotes." Under it sits the collapsed Sources disclosure of R-10.
- **Benefit boxes (6.4):** to be drawn by the designer in this language (for example a ruled row of figures with serif numbers and a small comparator line), not as shadowed cards.
- **Notices:** amber family (BD-6), chrome only.
- **Acceptance (14.1 to 14.3).** (1) A test reads every token of 14.1 from the computed styles of the page and finds it equal to the table value. (2) **[v0.4 DRAFT, supersedes "Each figure title's number equals its index number"; R-9]** Each figure title's text equals its index item's text in 4.1, and neither contains a figure number. (3) The hero's top border computes to `3px double`. (4) No element on the page has a non-`none` box shadow. (5) **[v0.4 DRAFT, supersedes "2px or 0"; R-5, R-6, R-12]** Every corner radius computes to a value in the radius tokens of the design in force: 2px or 0 until the designs for R-5, R-6 and R-12 are chosen.

### 14.4 Chart series and provenance marks [REQUIREMENT]

**[v0.4 DRAFT, supersedes 14.4 as written in v0.3: the badges, the dashed and dotted outlines, the series patterns and their acceptance; R-10, R-11. The v0.3 text is in Appendix A.7.]**

- **Requirement.** Chart series are solid fills and solid lines, told apart by hue and lightness and by direct labels (R-11), in the palette chosen for R-12. Provenance is kept in a collapsed Sources table under each chart (R-10), not shown by badges, outlines or line styles. In line charts no dash or dot style carries provenance **[ASSUMPTION]**.
- **Why.** Your v0.4 asks reverse the v0.3 restoration: "They look ugly. If they serve no purpose, then lets remove them." (ask 10) and "The bars are hideous with the pattern fill." (ask 11). Your answers of 2026-10-22 keep the information in the Sources table and let Today options take distinct hues (12.5).
- **Acceptance.** The acceptance lists of R-10 and R-11.

### 14.5 Motion, contrast and charts

- **Motion:** calm, nothing decorative. One fade token drives the carousel transition (4.1) and drops to 0 ms under `prefers-reduced-motion`.
- **Contrast [v0.4 DRAFT, supersedes "on the d1 values, 0 failures across 32 pairs"; R-11, R-12].** Every text pair passes 4.5:1 and every mark and border 3:1 on the values of the palette in force (the d1 values until a palette is chosen for R-12, then the chosen board's), with 0 failures, in a contrast table that covers every pair, including every pair of chart fills that touch. Any new token is added to the table before it ships.
- **Charts:** follow the `dataviz` skill: direct labels over legends, no chartjunk. Chart code reads colours from CSS variables, never copied hex.

## 15. v0.4 visual and flow revision

Your twelve asks of 2026-10-22, one requirement each (R-1 to R-12). They are the requirements side only. Each has a design slot that waits for your pick from the designer's boards in mock/docs/design-v0.4/, named by ask number and option letter (for example 5B). When you pick, the slot's board id is filled in and the chosen design becomes part of this spec. You set the order: images first, iterate on the design, freeze the spec, then implement. Nothing in this section is built before the freeze.

How to read it:

- Each requirement is written as **Ask / Requirement / Why / Data and compute / Selected design / Acceptance**. Every acceptance item is a test or a measured render: a script that reads the rendered page's computed styles, bounding boxes or text, or the chart option objects.
- "The three test widths" means 375, 768 and 1280px, as in 4.3 acceptance (3).
- "Grey" stays the name of a Today option slot (1 to 4) everywhere in this spec, whatever colour R-11 and R-12 give it.
- Where an ask reverses something you decided earlier, the clause is edited in place and tagged, and its v0.3 wording is in Appendix A.7. Your answers of 2026-10-22 settle the reversals of asks 2, 9, 10, 11 and 12; 12.5 records them.
- Where you were silent, my default is tagged **[ASSUMPTION]** and repeated in 12.5. Anything not known yet is **[OPEN]**.

### 15.1 R-1: an icon on "I sell AI compute"

- **Ask.** "On the first page, the "I sell AI compute" has no icon"
- **Requirement [REQUIREMENT].** On step 1 the row "I sell AI compute (cloud or GPU provider)" carries one icon, drawn in the same set as the five company icons: the same rendered size (28 by 28px in the build now), the same stroke width and colour token, in the same column position. The row stays the last one, stays a link to contact, and keeps the quieter treatment of BD-18 unless the chosen design changes it **[ASSUMPTION]**. The icon is decorative: it is hidden from assistive technology and the row's accessible name does not change. The icon's shape is the design choice.
- **Why.** It is the only row on step 1 without an icon, so it reads as unfinished.
- **Data and compute.** None.
- Selected design: pending, options in mock/docs/design-v0.4/ board for ask 1. Board id: 1? (fill in the letter you pick, for example 1B).
- **Acceptance.** (1) At the three test widths, the row holds exactly one icon whose rendered width and height equal those of the company icons, and whose computed stroke width and stroke colour equal theirs. (2) The icon's left edge equals the company icons' left edge (a layout test reads their bounding boxes). (3) The icon is `aria-hidden="true"`, and the row's accessible name is "I sell AI compute (cloud or GPU provider)". (4) The row is the last item of step 1 and links to the contact address.

### 15.2 R-2: "Step n" with no total, and a rule partly filled on step 1

- **Ask.** "There is step 1, not step X of 5 -- the second slide has it but this does not"
- **Your answer (2026-10-22).** "just show a slightly increased bar wrt 6 steps and don't spell how many steps", then, the same day, keep "Step n".
- **Requirement [REQUIREMENT].** Every step shows the label "Step n" ("Step 1", "Step 2" and so on), with no "of N" and no total anywhere on the intake. n is the step's position among the steps shown for the chosen type, and 1 before a type is chosen. The progress rule of 4.3 stays. On step 1 it is already partly filled, with one step's share of the longest path, 1 of N_max, so the page does not look unstarted. N_max is the largest number of steps any company type shows, computed from the step rules of 4.3 over every type in the data, never typed: 6 on the current data (a type that offers both team work and customer work shows 6 steps, the others 5). Once a type is chosen the rule fills n of that type's own N. The rule's accessible value names no total either **[ASSUMPTION]**.
- **Why.** You saw that step 1 was the only step without "of N", and chose to drop the total on every step instead of adding it to step 1. In v0.3 step 1 read "Step 1" and the others "Step n of N" (Appendix A.7).
- **Data and compute.** None. N comes from the existing step rules.
- Selected design: pending, options in mock/docs/design-v0.4/ board for ask 2. Board id: 2? (fill in the letter you pick).
- **Acceptance.** (1) On every step the label's text matches "Step n", with n as above, and never contains "of" or a total. (2) Before a type is chosen the progress rule's filled share equals 1 over N_max, where the test computes N_max as the largest step count over all company types in the data (6 on the current fixtures), and is greater than zero. (3) After a type is chosen, on step n the rule's filled share equals n over N, with N the number of rows of 4.3's table shown for that type. (4) No text or accessible name on the intake states the number of steps.

### 15.3 R-3: a live estimate from the visitor's own answers only

- **Ask.** "Why does the second page and some other pages has "your estimate, per quarter" ? They haven't given any numbers yet -- how is that even computed?"
- **Requirement [REQUIREMENT].** Every figure the live estimate shows is computed from the visitor's own answers only, plus the defaults section 5 names (all hardware tiers, the quality floor per workload type, the model mix from the type's workloads). No figure may come from the example scenario the intake starts from.
  - **Answers needed before any figure appears [ASSUMPTION].** The company type, the work, every head-count step the type shows, and the budget. So figures appear once team size or customers (whichever the type asks; both when it asks both) and the budget are answered.
  - **What counts as answered [ASSUMPTION].** The visitor has left the step by Continue or by clicking a preset, including Continue on the value the control showed when the step opened.
  - **Before the figures [ASSUMPTION].** From step 2 the panel holds no figure, only one line that names the answers still needed, for example "Your estimate appears once you have told us your team size and budget."
  - **Speed [ASSUMPTION].** Speed is the last step, so it is not answered when the figures first appear. Until it is, the estimate prices interactive speed, the section 5 default, and says so in one line under its figures.
  - Changing an earlier answer recomputes the estimate within one frame (4.3 acceptance (2)).
- **Why.** In the build the estimate is computed from the example scenario the intake starts from ($100K a quarter, 50 people), not from the visitor's answers. At step 4 of the screenshots you reviewed it showed Today $103K, With InfraVana $57.6K and You save 44% before you had typed a budget. That is a defect, not a styling issue: it shows a saving for numbers the visitor never gave. Note for the default: on the v0.3 rules none of the three figures depends on the budget. The budget never changes the InfraVana plan, only tokens bought and coverage (7.2 step 4), and in the build at commit af6e563 the Today and InfraVana cost code does not read the budget either. The default still waits for the budget because the panel reads as the estimate for the visitor's budget; showing the figures after the head count alone is the alternative in 12.5.
- **Data and compute.** No new data and no new compute function. The intake already keeps a list of answered steps; it builds the estimate's scenario from those answers and the section 5 defaults instead of from the example scenario. `compute()` is unchanged.
- Selected design: pending, options in mock/docs/design-v0.4/ board for ask 3. Board id: 3? (fill in the letter you pick).
- **Acceptance.** (1) On step 1 the panel is absent (4.3 acceptance (5)). (2) From step 2 until the needed answers are in, the panel's text contains no digit and no currency sign, and its one line names exactly the answers still missing. (3) Run the intake twice, starting once from S1 and once from hardware_heavy, with the same answers: every figure the panel shows is identical in both runs. (4) Once the needed answers are in, Today equals, to the cent, `compute()` on a scenario the test builds from those answers and the section 5 defaults alone. (5) Before speed is answered a line under the figures names the speed it assumes; once speed is answered the line is gone. (6) Going back and changing an answer changes the figures within one frame.

### 15.4 R-4: preset marks that never crowd

- **Ask.** ""How many customers use your AI?" -- the tab points on this page seem to crowd up. Possible to design this better?"
- **Requirement [REQUIREMENT, scope ASSUMPTION].** On every log slider of the intake and the fine-tune panel (team size, customers, budget; you named customers, the rule covers all three **[ASSUMPTION]**), no two preset marks overlap or sit closer than 8px **[ASSUMPTION]**, for every company type's presets, at every width the intake is tested at. Each mark's clickable box stays at least 44px high (5.1), and clicking a mark still sets its exact value (5.1 acceptance (1)). Whether the marks stay at their track positions, become a row of buttons at every width, or are fewer, is the design choice. If the chosen design drops marks, the preset lists of 5.1 change with it, and 12.5 records that.
- **Why.** On the customers step the marks 10,000, 50,000, 200,000 and 1,000,000 sit at their log positions on a 1 to 10,000,000 track. 50,000 and 200,000 are 0.671 and 0.757 of the track width along, so 8.6% of the width apart: 55px on a 640px track (computed for this spec from the log positions). In the build their buttons touch.
- **Data and compute.** None, unless the chosen design changes the preset lists.
- Selected design: pending, options in mock/docs/design-v0.4/ board for ask 4. Board id: 4? (fill in the letter you pick).
- **Acceptance.** (1) For every company type and each of the team size, customers and budget controls, at the three test widths, a layout test reads the bounding box of every mark and finds no two overlapping and every gap between neighbours at least 8px. (2) Every mark's clickable box is at least 44px high. (3) 5.1 acceptance (1) to (4) and (6) pass. (4) 5.1 acceptance (5) passes, or is replaced by the placement rule of the chosen design when the design is written in.

### 15.5 R-5: the editable sentence

- **Ask.** "On the final page -- the fill in the blanks section is ugly, please make it aesthetically pleasing."
- **Requirement [REQUIREMENT].** The sentence of 4.2 keeps its words, its blanks and its behaviour (4.2 acceptance (1) to (3)); its look is the chosen design. Whatever the design, it meets these rules: (a) every blank (company type, team size, customers, budget, work, speed) renders alike, with the same computed font family, size, weight, colour and height, whether it is a list or the work button; (b) each blank's text sits on the sentence's baseline, within 1px **[ASSUMPTION]**; (c) every blank shows that it can be changed without hover or focus, by a visible mark (underline, border or caret, as designed) at 3:1 or more against its ground; (d) no blank's value is split across two lines, and no blank runs outside the sentence's box.
- **Why.** v0.3 set only "large serif with blanks underlined in accent-strong" (14.3, A.7). The build draws the blanks as native lists styled as underlined text, plus one button for the work, so they do not match. The rules above are the parts of "pleasing" a test can hold; the rest is your pick of board.
- **Data and compute.** None.
- Selected design: pending, options in mock/docs/design-v0.4/ board for ask 5. Board id: 5? (fill in the letter you pick).
- **Acceptance.** (1) At the three test widths, every blank's computed font family, size, weight, colour and box height are equal. (2) Every blank's text baseline is within 1px of the baseline of the sentence text beside it. (3) Every blank's change mark has 3:1 or more contrast against its ground, with no hover or focus. (4) At the three test widths, no blank has two line boxes and no blank's bounding box lies outside the sentence's. (5) 4.2 acceptance (1) to (3) pass.

### 15.6 R-6: goal tabs that stand out, all four shown

- **Ask.** "Final page : The tab group "less money for same AI", "More AI for same money" etc. Make it visually stand out please. It feels like background text. Moreover, "More people for same money" is greyed out. This is a mock, you can put place holder number and show the design."
- **Requirement [REQUIREMENT].**
  - **All four tabs are always shown**, in the order of 6.2, in one row at 768px and wider **[ASSUMPTION]**.
  - **They stand out.** The tab group is the most prominent control between the sentence and the stage. Floors a test can hold **[ASSUMPTION]**: each tab is at least 44px high; each label is at least the body text size and has 4.5:1 or more against its own background in every state; the selected tab has a fill and at least one cue that is not colour (weight, rule or border), with its label at 4.5:1 or more; an unselected tab has a visible boundary at 3:1 or more against the page. The rest is the chosen design.
  - **In the mock every tab can be chosen.** When the mix has no employee work, G3 still opens, with its hero and drawer, and shows a placeholder figure with a label beside it, for example "Placeholder: your answers include no team work, so this number is invented to show the design" **[ASSUMPTION]**. The figure's value is **[OPEN]**, set with the chosen design. It lives in one labelled constant, is marked as invented placeholder data like every mock figure, and no `compute()` path reads it. While the placeholder shows, C5 and the benefit boxes show the G1 figures **[ASSUMPTION]**.
  - **What a tab that cannot be chosen looks like.** Wherever a later build cannot offer a tab, the tab stays in its place at the same size; its label keeps 4.5:1 contrast, so it is not greyed out; it carries a visible mark that it is unavailable, as the chosen design draws it; it stays focusable with `aria-disabled="true"`, so keyboard and screen-reader users reach it; its one-line reason is its accessible description and shows on hover and on focus. Choosing it does not change the active tab. In the mock no tab is in this state.
- **Why.** "It feels like background text", and "More people for same money" is greyed out. In the build a tab that cannot be chosen is a disabled button (out of the keyboard order, drawn faint), with its reason printed under the tabs. G3 is disabled when the mix has no employee work (6.2, 10); this ask reverses that for the mock, so 12.5 asks you to confirm.
- **Data and compute.** One labelled placeholder constant in the mock **[ASSUMPTION]**. No compute change: the tab-state rule no longer disables G3 in the mock.
- Selected design: pending, options in mock/docs/design-v0.4/ board for ask 6. Board id: 6? (fill in the letter you pick).
- **Acceptance.** (1) At 768 and 1280px the four tabs render in one row (their bounding boxes share a top) in the order G1, G2, G3, G4. (2) Every tab is at least 44px high; every label is at least the body text size and has 4.5:1 or more against its background in every state; the selected tab's computed fill differs from the unselected tabs' and its computed font weight or border differs too. (3) Every unselected tab's boundary has 3:1 or more against the page. (4) In the mock, with AI-first startup (customer work only), clicking G3 selects it, the URL holds `goal=G3`, and the hero shows a figure with the placeholder label beside it. (5) A code search finds the placeholder value in one constant only, and no `compute()` path reads it. (6) A tab forced into the cannot-be-chosen state in a test keeps its position and size, has `aria-disabled="true"`, is reachable by keyboard, has its reason as its accessible description, keeps 4.5:1 label contrast, and clicking it leaves the active tab unchanged.

### 15.7 R-7: what "Compared with" does, said on the page

- **Ask.** "What is the "Compared with" dropdown doing here -- please explain"
- **What it does, in plain words.** Every saving on the page is the difference between two prices for the same work: what it costs bought one way today, and what it costs with InfraVana. "Compared with" picks which way of buying today. It starts on the way most companies at your stage buy, marked "typical for you" (in the screenshots you reviewed, Pay-as-you-go API). If you pick another, such as one vendor bought end to end or the cheapest single offer that meets your quality floors, that option becomes the baseline: the headline, the benefit boxes and every chart are measured against it, and it is the Today bar that C1 draws in detail. InfraVana's own figure can change too, because InfraVana keeps the model mix of the option it is compared with (BD-8): on S1 placeholder data InfraVana costs 70,440.09 against the typical buyer and 14,613.02 against vendor 1 end to end (6.1). It never changes your answers.
- **Requirement [REQUIREMENT].** The control stays: you asked what it does, not to remove it. The page explains it where it sits: one line beside or under the control, visible without hover, that says what it does. Default wording **[ASSUMPTION]**: "Your savings are measured against this way of buying today. Pick another to compare with it." Its label, its place and how it groups with the hero are the chosen design. The behaviour of 6.1 does not change.
- **Why.** The label alone did not say what the control does.
- **Data and compute.** None.
- Selected design: pending, options in mock/docs/design-v0.4/ board for ask 7. Board id: 7? (fill in the letter you pick).
- **Acceptance.** (1) The control's accessible description (`aria-describedby`) is the explanation line, and the line is visible at the three test widths with no hover or focus. (2) The line has 4.5:1 or more against its ground. (3) 6.1 acceptance (3), (4) and (7) pass.

### 15.8 R-8: a chart index that never wraps

- **Ask.** "The figures tab is wrapping over. This is not a good design, please move to a better design of tab overflow"
- **Requirement [REQUIREMENT].** The chart index of 4.1 never wraps to a second line, at any width. At 600px and wider it holds every chart the registry will hold: C1 to C10, ten entries, not only the four built now (C1, C5, C3, C10). Below 600px the phone form of 4.1 applies and also takes one line. Every chart stays reachable from the index by pointer and by keyboard, the active item is always fully in view, and the page never scrolls sideways. The overflow mechanism (a scrolling strip, a "More" list, fewer titles in view, or another) is the design choice.
- **Why.** You saw it wrap, and six more charts (C2, C4, C6 to C9) will join it.
- **Data and compute.** None.
- Selected design: pending, options in mock/docs/design-v0.4/ board for ask 8. Board id: 8? (fill in the letter you pick).
- **Acceptance.** (1) With ten entries (the built charts' titles, and the registry names of section 6 standing in for the unbuilt ones **[ASSUMPTION]**), at 600, 768, 1024, 1280 and 1920px **[ASSUMPTION]**, every index item in view shares one top coordinate. (2) Each of the ten charts can be reached from the index by pointer, and by keyboard alone. (3) After every change of chart, the active item's bounding box lies inside the index's visible box. (4) At each of those widths and at 375px the page's scroll width equals the viewport width. (5) At 375px the phone form renders on one line. (6) The active item carries `aria-current` (4.1).

### 15.9 R-9: no ordinal numbers on charts

- **Ask.** "No need to add Figure1, Figure 2, .. just the text is fine"
- **Your answer (2026-10-22).** The numbers on the chart index go too. Numbers belong to sequenced or ranked things; the charts are independent and of equal priority, so no ordinal numbers anywhere: not in the figure titles, not on the index, not in the grid view.
- **Requirement [REQUIREMENT].** No chart title, index item, grid view thumbnail, announcement or other copy gives a chart an ordinal or a position number. Each chart shows its title text alone. In particular: no "Figure n." label; no number before an index item; no number on a grid view thumbnail; no "2 / 4" count in the phone index of 4.1, which shows the focused chart's title instead; and the live region of 4.1, which announces "Figure n of N: title" in the build, announces the title alone. Copy that refers to a chart by number names it by its title instead, for example the G1 drawer, which says "the two "Saved" parts of Figure 1" in the build. The registry ids (C1 to C10) stay internal and never show on the page.
- **Why.** Your words and your answer. This reverses the "Figure n." titles of the Research Note theme you chose (14.3) and the numbered index of your answer "Both" for the chart picker (12.2 row 14); your answer of 2026-10-22 settles both (12.5).
- **Data and compute.** None. Chart titles do not change.
- Selected design: pending, options in mock/docs/design-v0.4/ board for ask 9. Board id: 9? (fill in the letter you pick).
- **Acceptance.** (1) In every tab and on every chart, at the three test widths, a test of the rendered page finds no visible text and no accessible name that matches "Figure" followed by a number, case-insensitive. (2) No index item, phone index button or grid view thumbnail has visible text or an accessible name that contains a digit or matches "n / N", given chart titles that contain no digit. (3) Each chart's heading text equals its registry title, and each index item's and each thumbnail's text equals its chart's title. (4) The live region's text changes on every change of chart (4.1 acceptance (6)) and equals the new chart's title. (5) No visible text contains a registry id (C1 to C10). (6) Every chart still ends with the source-and-note line of 14.3.

### 15.10 R-10: provenance in a collapsed Sources table

- **Ask.** "What is the purpose of boxes like these, "VENDOR-REPORTED · TODAY: BEST SINGLE OPTION: AWS EC2" ? They look ugly. If they serve no purpose, then lets remove them."
- **What the boxes were for.** They are the provenance badges of 14.4. Each says whether a series' prices are vendor-reported (dotted outline) or modelled (dashed outline), so that nothing that was not measured can read as measured (section 9). You asked for them in v0.3 ("Restore the full spec rules").
- **Your answer (2026-10-22).** The boxes are the source of truth of the data, so the information stays, hidden the way "Fine-tune the assumptions" is hidden; the boxes and the dashed and dotted outlines go.
- **Requirement [REQUIREMENT].**
  - **Gone.** Every badge box and every dashed and dotted provenance outline, in every chart.
  - **A collapsed "Sources" disclosure** under each chart that has at least one non-measured series, built the same way as "Fine-tune the assumptions" (a disclosure that is closed on load and opens in place). The label "Sources" is my wording **[ASSUMPTION]**.
  - **Its table.** One row for each thing that is a box today: each series or group the boxes cover, one row per provenance and group. Columns: what the row covers (the series or group and its parts); its provenance, "Vendor-reported" or "Modelled"; and its source. The source cell is a hyperlink to the source address held in the data for that row's data rows. Where the rows behind it hold several distinct addresses, the cell lists each **[ASSUMPTION]**.
  - **No invented addresses.** Every address in the current fixtures is the invented placeholder address `https://example.invalid/placeholder-invented-data/...` (BD-11), or empty, or the text "INVENTED PLACEHOLDER" in `hardware.csv`. A source cell with no real address, including one that holds only the placeholder address, reads "placeholder, no source yet" and is not a link. No address is typed in code.
  - **Measured series** get no row, as they had no box **[ASSUMPTION]**. A chart whose series are all measured has no Sources disclosure.
  - Where invented rows are drawn (BD-11), the table lists them as modelled, and the visible "Source: invented placeholder data" line stays.
- **Why.** You find the boxes ugly; you also said the information they carry is the data's source of truth, so it moves out of sight instead of being deleted. This reverses your v0.3 choice for badges and outlines and changes guardrail (4) of BD-11; your answer of 2026-10-22 settles it (12.5).
- **Data and compute.** The data contract gains an optional `source_url` column on `hardware.csv` and `seat_plans.csv`, the two files that feed a chart series and hold no address today (7.3). `model_offers.csv`, `buying_patterns.csv` and `quality.csv` keep their `source_url`, and `throughput_curves.csv` its `run_url`. The `provenance` columns stay in the CSVs and in `Results` (7.3, 7.4). No compute change; the table is a view over the rows each chart already uses.
- Selected design: pending, options in mock/docs/design-v0.4/ board for ask 10. Board id: 10? (fill in the letter you pick).
- **Acceptance.** (1) In every chart, in every tab and in both C10 views, no element has a dashed or dotted computed border style, and no chart series option sets a dashed or dotted border or line type for provenance. (2) Outside the Sources disclosure and the "How is this worked out?" drawer, no element of a chart contains the words "vendor-reported" or "modelled" (any case). (3) On load every Sources disclosure is closed, and opening it shows its table without a page reload. (4) The table has one row per provenance and group of the chart's non-measured series, and each row's provenance cell reads "Vendor-reported" or "Modelled" as the data says. (5) Every source link's address is read from a data row, and a code search finds no source address literal in chart code. (6) On the current fixtures no source cell is a link, and every source cell reads "placeholder, no source yet". (7) Giving one fixture row a real `source_url` turns that row's source cell into a link to it, with no code change; changing one series' `provenance` from measured to modelled adds a row, with no code change. (8) A chart whose series are all measured has no Sources disclosure. (9) With BD-11 rows loaded, the G4 view and the C10 speed view list the invented rows as modelled and show "Source: invented placeholder data". (10) The loader accepts `hardware.csv` and `seat_plans.csv` with and without `source_url`.

### 15.11 R-11: solid colour fills, no patterns

- **Ask.** "The bars are hideous with the pattern fill. Can we not do a different color fill, which goes with the design language."
- **Your answer (2026-10-22).** Today options may take distinct hues; the charts should look colourful, and the designer proposes the colours for you to choose from.
- **Requirement [REQUIREMENT].** No bar or bar segment in any chart has a pattern fill (hatch, dots, cross-hatch or any other decal). Bars are solid fills from the palette chosen for R-12, told apart by hue and lightness, and every bar and segment keeps its direct label (6, 14.5). In particular:
  - each Today option slot (1 to 4) has its own hue and keeps it on every chart, in every tab and after a reload;
  - InfraVana keeps the accent family, and no Today fill uses the accent hue;
  - saved money keeps a role of its own (the green of 14.1, or the chosen palette's equivalent);
  - neighbouring segments of a stacked bar are separated by a rule or a gap;
  - every pair of fills drawn in the same chart differs by at least 10 in CIEDE2000 colour difference **[ASSUMPTION]**;
  - every fill has 3:1 or more against the chart ground, and every label drawn on a fill 4.5:1 or more;
  - the markers of C3 and C10 keep their shapes per option and take their slot's fill.
  The largest number of distinct fills any one chart needs (C1, with the comparator's channel segments, the InfraVana segments, the saved parts and up to three option bars) is **[OPEN]**. It is counted on the fixtures before the palette is chosen, and the chosen palette must cover it.
- **Why.** The patterns existed only because the v0.3 palette had two distinct greys, 1.41:1 apart, for four Today slots (14.1). Distinct hues remove the need. This reverses the patterns of your v0.3 "Restore the full spec rules" and the greys for Today of 14; your answer of 2026-10-22 settles both (12.5).
- **Data and compute.** None.
- Selected design: pending, options in mock/docs/design-v0.4/ board for ask 11. Board id: 11? (fill in the letter you pick; the boards for asks 11 and 12 may be one choice).
- **Acceptance.** (1) In every tab and in both C10 views, a test of every chart's option object finds no decal on any series or data item, no pattern or image fill, and the chart library's automatic decal off. (2) A test computes the CIEDE2000 difference between every pair of fill tokens one chart uses and finds every pair at 10 or more. (3) Every fill has 3:1 or more against the chart ground, and every label on a fill 4.5:1 or more. (4) In a render of each chart, the number of direct labels equals the number of bars and segments drawn. (5) Each Today option's fill token is the same on C1, C3, C5 and C10, after switching tab and after a reload. (6) The four Today slot tokens have four distinct hues, none within 30 degrees of the accent's hue **[ASSUMPTION]**. (7) Every stacked bar shows a rule or gap of at least 1px between neighbouring segments.

### 15.12 R-12: calm chrome, vivid and hopeful chart marks

- **Ask.** "Extending 11. The whole site, feels mono-chromatic today .. Its mostly pastel and dull. I do appreciate properly used muted color. The idea of using pastel colors is to look classy, not dead. Please work on the visual design wrt this and make the webpage attractive yet classy."
- **Your answer (2026-10-22).** The charts are the selling data for InfraVana. Today they look muted and mushed into the background. For the visitor they should be visually attractive, impress them, make them think InfraVana knows what it is doing, and evoke positive, hopeful emotions. The designer decides which colours to propose; you choose among the options.
- **Requirement [REQUIREMENT].** The whole page takes a revised palette, which you choose from the designer's boards for ask 12. The page chrome (paper, type, rules, controls) stays calm and classy; the chart marks carry the most chroma on the page and are clearly its most vivid elements, in a warm and hopeful register. Muted means refined, not dull. In checkable terms:
  - **Marks most vivid.** The CIE LCh chroma of every chart series fill is higher than the chroma of every chrome token (surfaces, text, rules, borders, buttons, selected states); the notice amber of BD-6 is left out because it appears only in banners **[ASSUMPTION]**.
  - **More than one hue.** At least two hues beyond the accent, each with a named role in the palette table, and each role listing the page elements it applies to; the notice amber does not count **[ASSUMPTION]**.
  - **Contrast.** Every text pair at 4.5:1 or more and every mark and border at 3:1 or more, in a contrast table for the chosen values with 0 failures (14.5).
  - **Brand.** The logo unedited; InfraVana keeps the accent hue; the accent's value changes only with the brand owner's answer (12.4 item 28) **[ASSUMPTION]**.
  - **Tokens.** Chart code and styles read every colour from tokens (14.5).
  - **The table.** Once you choose, the chosen board's token table replaces the 14.1 table, and the v0.3 table moves to Appendix A.7.
  "Warm and hopeful" and "attractive yet classy" are your choice of board, not a number this spec sets.
- **Why.** Your words and your answer. The v0.3 page is warm paper, ink, one steel-blue accent `#466577` and one green (14.1), with greys for Today, and the theme's own named risk was that it is calm rather than "leading edge" (14).
- **Data and compute.** None.
- Selected design: pending, options in mock/docs/design-v0.4/ board for ask 12. Board id: 12? (fill in the letter you pick).
- **Acceptance.** (1) 14.3 acceptance (1) passes on the new 14.1 table: every token read from the page's computed styles equals its table value. (2) A test computes the CIE LCh chroma of every token and finds the lowest chroma among chart series fills above the highest among chrome tokens, the notice amber left out. (3) A test counts the hue roles in the palette table and finds at least two whose hue differs from the accent's by at least 30 degrees **[ASSUMPTION]**, neither of them the notice amber. (4) For each hue role, every page element the table lists for it computes to that role's token. (5) The contrast table covers every token pair the page draws and has 0 failures. (6) A code search of `mock/src` finds no colour literal outside the token files.

## Appendix A. Parked for a later version

The language-model layer, moved here intact from v0.2 by your decision ("the llm layer comes in a later version"). The text below is unchanged. References inside it to sections and to "the album" are v0.2 references. A.7 is different: it holds the v0.3 wording that the v0.4 draft replaced.

### A.1 v0.2 section 1: What we're building, in one paragraph

A single-page playground. The user types one natural-language prompt describing their company, budget and workloads. A cheap classifier screens the prompt (up to 5 attempts). One full LLM call then turns an accepted prompt into a structured **Scenario**: it extracts the knob values and picks which charts to show from a fixed registry. The page renders those charts as an **album** (one large chart at a time, with a filmstrip of thumbnails), driven entirely by CSV data in the browser. The user changes knobs (users, budget, hardware tier, model mix) and every slide recomputes locally with no further LLM calls. Every chart contrasts **"Today"** (how a growing company typically buys inference now) against **"With Infravana"** (smarter provider and hardware routing across API platforms, GPU and accelerator classes).

### A.2 v0.2 section 7.1: One LLM call, structured output

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

### A.3 v0.2 section 4.2: prompt rules

- The prompt box locks after an accepted prompt. A short line says "Adjust the knobs to explore." A rejected prompt leaves it open until the attempt cap (section 8).
- The "Understood" strip shows what the LLM extracted, with assumed values marked, so the user can see misreads. It is read-only. Corrections happen through knobs.

### A.4 v0.2 section 8: Guardrails and budget

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

### A.5 v0.2 section 10: prompt states

| State | Behaviour |
|---|---|
| Initial | Prompt box, three example chips (S1, S2, and a hardware-heavy example). Clicking a chip fills the box but doesn't submit. |
| Loading | Skeleton dashboard, "Reading your scenario...". Target under 5 seconds. |
| Rejected by screen | One-line reason, example prompt, "N of 5 attempts left". The box stays open and no album is shown. |
| Attempts exhausted | The box locks with a message. The example chips remain, so the user can still open a preset scenario. **[ASSUMPTION]** |
| LLM error or timeout in stage 2 | Offer "Use a default scenario" (S1 preset) so the user gets an album without a second extract call. **[ASSUMPTION]** |

### A.6 v0.2 BD-1

| ID | Topic | MVP default | Why it's safe to defer | Revisit when |
|---|---|---|---|---|
| BD-1 | Identity and enforcement of the 5-screen and 1-extract caps | Accepted as recommended in section 8: an anonymous first-party token carries the counters, with a generous per-IP ceiling (about 30 screens and 10 extract calls a day) as a backstop. **MVP adds a global daily spend ceiling on the edge function as a kill switch**, since there is no real backend to catch abuse. | Only the edge function changes. The UI contract (`429` with a `reason`) stays the same. | Backend lands, and before go-live. Decide on login or email capture then. |

### A.7 v0.3 wording superseded by the v0.4 draft

Moved here verbatim from v0.3, so that any v0.4 ask you decline can be restored word for word. Each item names the clause and the requirement that replaced it. Section and item numbers inside the quotes are v0.3 references.

**A.7.1 Section 4 page sketch, the index and figure title lines (R-8, R-9).**

```text
| 1 Where the money goes | 2 What the budget buys | 3 ... |  [Grid view]|
| <  Figure 1. Where the money goes                                   > |
```

**A.7.2 4.1 Requirement (R-8, R-9).**

```text
- **Requirement.** One chart is in focus at a time. The visitor picks it from a **numbered, titled index** (default) or from a **grid of live thumbnails** behind a "Grid view" button. Arrows, keyboard and swipe move between charts with a smooth transition.
```

**A.7.3 4.1 table, the index row (R-8, R-9).**

```text
| Filmstrip of live thumbnails under the stage | A one-line numbered index ("1 Where the money goes", "2 ..."), active item marked with `aria-current`. Numbers match the "Figure n." titles (14.3). | Changed |
```

**A.7.4 4.1 table, the mobile row (R-9).**

```text
Below 600px: full-width stage with swipe; the index collapses to "2 / 4 What the budget buys" that opens the full list;
```

**A.7.5 4.1 Acceptance (5) (R-8).**

```text
(5) At 375px the index fits one line and the page does not scroll sideways.
```

**A.7.6 4.3 Requirement (R-2, R-3).**

```text
- **Requirement [REQUIREMENT].** The intake is the first thing a visitor sees. It asks the steps below one at a time, shows "Step n of N" with a progress rule (N counts the steps shown for the chosen company type, and before step 1 the label reads "Step 1"), lets the visitor go back or click an earlier answer to change it, and shows a live estimate beside the questions.
```

**A.7.7 4.3 Data and compute (R-3).**

```text
The estimate is one `compute()` call after each answer.
```

**A.7.8 4.3 table, the company type row with the compute-seller row (R-1).**

```text
| Company type | What kind of company are you? | Always | 5 options: AI-first startup, Software or internet company, Traditional enterprise, Telecom or national cloud, Chip or hardware design company. A quieter final row "I sell AI compute (cloud or GPU provider)" goes to contact (BD-18). |
```

**A.7.9 4.3 Live estimate (R-3).**

```text
- **Live estimate.** A margin note (14.3) with Today, With InfraVana and "You save", per quarter, measured against the typical buyer for the stage (6.1). It is hidden on step 1 and appears from step 2 (BD-18).
```

**A.7.10 4.3 Acceptance (2) (R-3).**

```text
(2) Every answer changes the estimate within one frame of the click.
```

**A.7.11 4.3 Acceptance (5) and (6) (R-2, R-3).**

```text
(5) On step 1 the estimate panel is absent from the page; from step 2 it is present. (6) The step label reads "Step 1" before a type is chosen and "Step n of N" after, with N equal to the number of rows of the table shown for that type.
```

**A.7.12 Section 6 selection rules, the dataviz bullet (R-11).**

```text
- Visual rules follow the `dataviz` skill: Infravana is one consistent accent colour, "today" providers are neutral greys, and every chart carries direct labels.
```

**A.7.13 6.1 the "Compared with" selector placement (R-7).**

```text
  - **A page-wide "Compared with" selector [PROPOSED].** It sits above the stage, defaults to the typical buyer, and changing it recomputes InfraVana against the new comparator on every chart and tab.
```

**A.7.14 6.1 How each chart draws them, the C1 row (R-11).**

```text
| C1 | Two bars, each segmented by channel, as now | An unsegmented total bar with a pattern, a direct label and its quality score. Each option bar takes one pattern reserved for its option rank, never one used by the comparator's channel segments **[PROPOSED]**; the designer sets the patterns (14.4) |
```

**A.7.15 6.1 the four-grey limit and patterns (R-11).**

```text
  Four greys is a hard limit. In Research Note the four grey slots have only two distinct values (14.1), so slots 3 and 4 need the restored patterns (14.4).
```

**A.7.16 6.1 Acceptance (6) (R-11).**

```text
(6) C1 shows one unsegmented, patterned, labelled bar per grey option other than the comparator, and no pattern appears both on a comparator channel segment and on an option bar;
```

**A.7.17 6.2 Requirement, the tab group (R-6).**

```text
- **Requirement.** Four tabs above the hero choose how the result is framed.
```

**A.7.18 6.2 table, G3 acceptance cell (R-6).**

```text
Disabled, with a one-line reason, when the mix has no employee work (10) **[ASSUMPTION]**.
```

**A.7.19 6.3 Acceptance (4) (R-10).**

```text
(4) The speed view carries the provenance badge and the invented-data source line (BD-11).
```

**A.7.20 7.3 Provenance paragraph (R-10).**

```text
Provenance: every series whose provenance is not `measured` is badged "modelled" or "vendor-reported", as section 9 says (BD-9). v0.2 said "no badge means measured"; that still holds, but a badge is never skipped for a non-measured series.
```

**A.7.21 Section 9, the provenance badges bullet (R-10).**

```text
- **Provenance badges** on every series: *measured* (a run with a link), *modelled*, or *vendor-reported*. Mixed charts show both with different line styles.
```

**A.7.22 Section 9, the "Restored in full" bullet (R-10, R-11).**

```text
- **Restored in full [REQUIREMENT].** You chose "Restore the full spec rules": badges, dashed (modelled) and dotted (vendor-reported) outlines, and series patterns, all of which commit 8e00537 removed. The designer specifies them on the Research Note values during the build (14.4).
```

**A.7.23 Section 9 Acceptance (2) and (4) (R-10).**

```text
(2) With BD-11 rows loaded, the G4 view and the C10 speed view each show "Source: invented placeholder data" and the provenance badge; the G1 view does not. (3) The footer text contains "invented" whenever BD-11 rows are loaded. (4) A modelled series shows its badge and dashed outline (14.4).
```

**A.7.24 Section 10, the G3 state row (R-6).**

```text
| G3 with no employee work | The tab is shown disabled with "Your answers include no team work" **[ASSUMPTION]**. |
```

**A.7.25 Section 10 Acceptance (3) (R-6).**

```text
(3) With no employee work, G3 is disabled and shows its reason.
```

**A.7.26 BD-9 row (R-10).**

```text
| BD-9 | Badging | Every non-measured series is badged, following section 9 over 7.3. | Display only. | Your sign-off. |
```

**A.7.27 BD-11 guardrail (4) (R-10).**

```text
(4) any chart that uses them shows the provenance badge and a "Source: invented placeholder data" line, and the footer says so;
```

**A.7.28 Section 14 intro, "numbered and sourced figures" (R-9).**

```text
warm paper, serif figure titles, numbered and sourced figures, structure drawn by rules
```

**A.7.29 Section 14 "What it keeps", greys for Today (R-11, R-12).**

```text
What it keeps from v0.2: the steel-blue logo, unedited; greys for Today and the accent for InfraVana;
```

**A.7.30 14.1 table, the Today greys row (R-11).**

```text
| Today greys, slots 1 to 4 | `--color-today-1` to `-4` | `#2a2a28`, `#43413d`, `#43413d`, `#2a2a28` | Marks 13.08:1 and 9.26:1; labels on them 13.77:1 and 9.75:1 |
```

**A.7.31 14.1 bullets on the greys (R-11).**

```text
- Greys differ from the accent in lightness: 2.32:1 (today-1) and 1.64:1 (today-2) [d1 table]. Every InfraVana series still carries a direct label.
- Only two distinct greys exist, and they are close to each other: 1.41:1 (computed for this spec with the same WCAG formula, not in the d1 table). Neighbouring Today parts therefore need separators and patterns (14.4).
```

**A.7.32 14.3 Sentence (R-5).**

```text
- **Sentence:** large serif with blanks underlined in accent-strong.
```

**A.7.33 14.3 Figures (R-9, R-10).**

```text
- **Figures:** each chart is "Figure n." (italic, secondary) plus its title, with a 1px ink rule above. Each ends with a source-and-note line: "Source: InfraVana cost model on illustrative price tables. Note: all figures are invented placeholders, not quotes." The figure number matches the index number (4.1).
```

**A.7.34 14.3 Acceptance (2) and (5) (R-9, R-12).**

```text
(2) Each figure title's number equals its index number in 4.1. (3) The hero's top border computes to `3px double`. (4) No element on the page has a non-`none` box shadow. (5) Every corner radius computes to 2px or 0.
```

**A.7.35 14.4 in full, as written in v0.3 (R-10, R-11).**

```text
- **Requirement.** During the build the designer specifies, on the Research Note values, the provenance and series rules you restored: provenance badges; a dashed outline for modelled and a dotted outline for vendor-reported parts; series patterns (hatch, dots, cross-hatch) for Today slots and InfraVana segments; and solid lines only between Today series in line charts, since dash style means provenance. In C1 the designer also sets which patterns are reserved for option bars, one per option rank, kept apart from those of the comparator's channel segments (6.1).
- **Starting point.** The rules removed in commit 8e00537, in `mock/docs/design-tokens.md` as it stood before that commit (sections 3 to 3e: Today slots and patterns, InfraVana segments, perforated provenance borders, label chips, label list). Their colours and ratios were cut for the old palette, so every ratio must be re-measured on the d1 values.
- **Why it is needed here.** With two distinct greys at 1.41:1, slots 3 and 4 of 6.1 cannot be told apart by colour, so patterns are the cue, behind direct labels.
- **Acceptance.** (1) A d1 contrast table covers every new pair (pattern on fill, dashed border on fill and on page). (2) A modelled series in any chart shows its dashed outline and badge. (3) Four Today bars are distinguishable in greyscale print.
```

**A.7.36 14.5 Contrast, the d1 contrast acceptance (R-12).**

```text
- **Contrast:** every text pair passes 4.5:1 and every mark and border 3:1 on the d1 values, 0 failures across 32 pairs. Any new token is added to the table before it ships.
```
