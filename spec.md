# Infravana Inference Playground: UI Spec (draft v0.4, NOT FROZEN)

Status: MVP draft v0.4, **NOT FROZEN**. v0.4 adds section 15: the requirements for your twelve visual and flow asks of 2026-10-22 and your balanced-grid rule, written against the designs you chose on 2026-10-23 from the boards in mock/docs/design-v0.4/, and the Azure palette. It is ready for your freeze decision. Nothing in section 15 is built until you have frozen and approved the spec. Builds on [intent.md](intent.md). v0.3 folds in your decisions of 2026-10-21: the guided intake is the front door and the language-model layer is parked for a later version (Appendix A); the page takes the Research Note design language; charts sit on a carousel stage; every chart compares several "Today" options; goal tabs, an iso-cost Pareto chart and benefit boxes are added; the provenance rules of section 9 are restored.

Tags used in this document:

| Tag | Meaning |
|---|---|
| **[ASSUMPTION]** | My default where you were silent. Bootstrap-grade (section 12). |
| **BD-n** | A bootstrap decision: a default chosen to keep moving, revisited before go-live (section 12). |
| **[REQUIREMENT]** | Follows from something you already decided, or something the spec already promised. |
| **[PROPOSED]** | Drafted for v0.3 and not yet confirmed by you. Every one is repeated in "Questions for you" (12.4). |
| **P-n** | One of ten v0.3 proposals (P-1 to P-10). Each is tagged where it sits; the ones you have answered are now BD entries. |
| **[OPEN]** | Not known yet. Settled by you, by data or by a measurement, never filled in by a guess. |
| **[v0.4 DRAFT, supersedes ...]** | A clause changed in place by v0.4. The wording it replaces is kept verbatim in Appendix A.7, so it can be restored. Not final until the spec is frozen. |
| **R-n** | One of the thirteen v0.4 requirements (section 15): one per ask, plus R-13, the balanced-grid rule. |
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

Your twelve asks of 2026-10-22, your answers of the same day, and two rounds of boards, closed by your choices of 2026-10-23. Each ask is one requirement in section 15, and your balanced-grid rule is R-13. Each requirement names the chosen board. Clauses that v0.4 changes are edited in place and tagged; the replaced wording is in Appendix A.7. 12.5 records your answers, the "rest are all ok" reading to confirm at freeze, and what is still open.

| Ask | Requirement and chosen design | Clauses changed in place |
|---|---|---|
| 1 | R-1: the "I sell AI compute" row drawn like the others, with an icon (board 1) | 4.3 table and layout, BD-18 |
| 2 | R-2: "Step 1", then "Step n of N"; the rule already at 1/6 on step 1 (board 2) | 4.3 requirement, acceptance (6) |
| 3 | R-3: the estimate first appears on the budget step, from your own answers (board 3) | 4.3 requirement, data, live estimate, acceptance (2) and (5), BD-18 |
| 4 | R-4: a row of preset buttons above the slider in four hues, with matching ticks (4B) | 5.1, BD-18 |
| 5 | R-5: the sentence becomes a balanced answer grid (5B) | 4.2, 14.3 |
| 6 | R-6: a tab bar of four equal tabs with figures; the hero a framed panel (6B) | 6.2, 10, 14.3 |
| 7 | R-7: "Compared with" moves into the headline (board 7) | 4.1, 6.1 |
| 8 | R-8: a contents column, a picker on phones (8C) | 4, 4.1, 10 |
| 9 | R-9: no ordinal numbers anywhere (board 9) | 4, 4.1, 14, 14.3 |
| 10 | R-10: a closed "Where these numbers come from" table replaces the boxes and outlines (board 10) | 6.3, 7.3, 9, 14.3, 14.4, BD-9, BD-11 |
| 11 | R-11: solid hues, no patterns, and the chart styling rules (Azure) | 6, 6.1, 6.2, 7.2, 14.1, 14.4 |
| 12 | R-12: the Azure palette: calm chrome, InfraVana the most vivid mark (Azure) | 14, 14.1, 14.3, 14.5, BD-6 |
| (9) | R-13: balanced grids everywhere (board 9) | 4.1 |

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

**[v0.4 DRAFT, supersedes the numbered index and the "Figure 1." title of this sketch; R-8, R-9.]** The sketch predates the v0.4 designs. The chart index is now a contents column beside the stage (R-8), the goal tabs a tab bar over a framed result panel (R-6), "Compared with" a picker inside the headline (R-7), and the sentence an answer grid (R-5). The boards named in section 15 are the visual source.

### 4.1 The stage (the album, reworked as a carousel)

- **Requirement [v0.4 DRAFT, supersedes "numbered, titled index"; R-8, R-9].** One chart is in focus at a time. The visitor picks it from a **contents column** beside the stage (a picker on phones, R-8) or from a **grid of live thumbnails** behind a "Grid view" button. Arrows, keyboard and swipe move between charts with a smooth transition.
- **Why.** You asked for "carousel like where one chart is in focus at a time", and "Both" for the picker. The stacked cards of commit 8e00537 replaced the v0.2 album; this restores it in a simpler form.
- **Data and compute.** None new. Every chart renders from the same `Results`.

| v0.2 album rule | v0.3 | Status |
|---|---|---|
| One chart fills the stage | Same | Kept |
| Filmstrip of live thumbnails under the stage | **[v0.4 DRAFT, supersedes the numbered index whose numbers matched the "Figure n." titles; R-8, R-9]** A contents column, 16rem wide, that stays in view while the page scrolls: "Charts" with the count, then one ruled item per chart with a glyph of its form and its title, with no numbers. The item in focus is marked with `aria-current`, the soft accent fill and a 3px accent edge. | Changed |
| Grid view as a "contact sheet" | The live thumbnails live here. Click one to bring it into focus and close the grid. Render only thumbnails in view and throttle redraws while a control is dragged. **[v0.4 DRAFT, adds the balanced grid and the hidden column; R-8, R-13]** Opening it hides the contents column and gives the grid the full width; the tiles follow the balanced-grid rule, with wide tiles where the count needs them. | Kept, now the only home of thumbnails |
| Order fixed by registry priority (C1, C5, C3, then extras the LLM chose) | Registry order. The v0.3 set is C1, C5, C3, C10 **[ASSUMPTION]**; others join as they are built (11). | Changed: no LLM selection |
| Arrows, left/right keys, swipe, click a thumbnail | Same, plus click an index item. Left and right wrap at the ends **[ASSUMPTION]**. | Kept |
| URL hash `#slide=C2` | The hash holds `slide`, `goal`, `cmp=<pattern_id>` (omitted for the default) and, in G4, `q=<step>&s=<step>`; loading the hash restores each. C10 adds `c10=speed` when the speed view is on **[ASSUMPTION]**. (P-8) | Extended |
| Short cross-fade; respect `prefers-reduced-motion` | A short slide plus cross-fade, timed by a motion token (14.5); 0 ms under `prefers-reduced-motion`. The new chart's title is announced. | Kept |
| Headline strip pinned above the stage | Goal tabs, hero and comparator selector stay above the stage on every chart **[v0.4 DRAFT: the tabs are a tab bar over a framed result panel, and the comparator is a picker inside the headline; R-6, R-7]** | Kept |
| Mobile: full-width swipe, dots plus thumbnail drawer, knobs in a bottom sheet | Below 600px: full-width stage with swipe; the contents column becomes one picker showing the focused chart's title and glyph, with "Grid view" beside it, that opens the full list, with no position count **[v0.4 DRAFT, supersedes the "2 / 4" count; R-8, R-9]**; the grid view becomes two columns; fine-tune stays a collapsed panel | Changed |
| Fullscreen for presenting **[ASSUMPTION]** | Same | Kept |

- **Acceptance.** (1) Only one chart canvas is interactive at a time. (2) Each of arrow button, left/right key, swipe, index click and grid click reaches every chart. (3) Loading `#slide=C3` opens C3. (4) With reduced motion set, a change of chart has no animation. (5) **[v0.4 DRAFT, supersedes "At 375px the index fits one line"; R-8]** At 375px the phone picker and "Grid view" share one row; at 1280px the contents column holds every listed chart; at every test width the page does not scroll sideways. (6) An `aria-live="polite"` region holds the focused chart's title, and its text changes on every change of chart. (7) Loading `#slide=C1&goal=G4&cmp=<id>&q=<n>&s=<n>` restores the chart, tab, comparator and both G4 steps.

### 4.2 Other rules

- **[v0.4 DRAFT, supersedes the editable sentence; R-5]** Once the intake is answered it becomes an answer grid: one cell per answer (Company, Team, Customers, Budget a quarter, Work, Answers needed), each a small-capitals label over its value, balanced by R-13. Each cell is a control from 5.1 or a list. Changing a cell recomputes the page. This replaces the v0.2 locked prompt and "Understood" strip, which are kept in Appendix A.3. "The sentence" and "a blank" elsewhere in this spec mean the answer grid and a cell.
- The hero shows the active goal tab's headline (6.2), names the Today it is measured against, and keeps a "Talk to us about your numbers" call to action. This is the thing people screenshot.
- Both sides use the same quality floor and speed, stated under the hero (section 9). G4 is the one labelled exception (6.2).
- **Acceptance.** (1) **[v0.4 DRAFT, supersedes "blank of the sentence"; R-5]** Every cell of the answer grid is a focusable control. (2) Changing any blank changes the `Scenario` with no reload. In G1 the hero updates within one frame; in G2 and G3 the previous value dims at once and the solved value replaces it within 0.5 s of the last change (6.2). (3) The hero names the comparator by its label.

### 4.3 The guided intake (the front door)

- **Requirement [REQUIREMENT].** The intake is the first thing a visitor sees. It asks the steps below one at a time, shows "Step n of N" with a progress rule (N counts the steps shown for the chosen company type, and before step 1 the label reads "Step 1"; **[v0.4 DRAFT, supersedes the empty rule on step 1; R-2]** on step 1 the rule is already filled to 1/6, one step of the longest path), lets the visitor go back or click an earlier answer to change it, and shows a live estimate beside the questions, computed from the visitor's own answers only (**[v0.4 DRAFT, supersedes the estimate computed from the example scenario; R-3]**).
- **Why.** Your decision: "Guided intake for the first cut, the llm layer comes in a later version". It is built (commit 62d75f2) but the spec never described it.
- **Data and compute.** Each answer writes into the one `Scenario`; nothing in the intake is a second source of truth. **[v0.4 DRAFT, supersedes "The estimate is one `compute()` call after each answer"; R-3]** From the budget step, once the head-count steps are answered, the estimate is one `compute()` call after each answer, on a scenario built from the visitor's answers and the defaults of section 5 only.

| Step | Question | Shown when | Input | Writes |
|---|---|---|---|---|
| Company type | What kind of company are you? | Always | 5 options: AI-first startup, Software or internet company, Traditional enterprise, Telecom or national cloud, Chip or hardware design company. A final row "I sell AI compute", with the hint "Cloud or GPU provider: talk to us about selling through InfraVana", goes to contact (BD-18); it is drawn like the other five, with a server-rack icon **[v0.4 DRAFT, supersedes the quieter row without an icon; R-1]**. | `stage_today` (api or platform per type), the type's workloads, their blended `model_mix`, default customers |
| Work | What do you use AI for? | Always | Multi-select of the type's workloads, Continue | `workload_mix` (even split within each basis) |
| Team size | How many people on your team will use AI? | The type offers employee work | 5.1 control | `baseline.users` |
| Customers | How many customers (or subscribers) use your AI? | The type offers customer work | 5.1 control | `baseline.customers` |
| Budget | What is your AI budget each quarter? | Always | 5.1 control | `baseline.budget_usd_per_quarter` |
| Speed | How fast do answers need to come back? | Always | 3 options: interactive, standard, batch | `latency_class` |

- **Live estimate [v0.4 DRAFT, supersedes "It is hidden on step 1 and appears from step 2 (BD-18)"; R-3].** A margin note (14.3) with Today, With InfraVana and "You save", per quarter, measured against the typical buyer for the stage (6.1). It is absent on step 1, step 2 and the head-count steps, and first appears on the budget step once the head-count steps are answered. Every figure in it is computed from the visitor's own answers only, never from the example scenario the intake starts from, and one line under the figures says what they are worked out from (R-3). The saving steps with scale: S1 on the API stage saves 20.00% at 0.5 to 7.3 users and 29.57% from 50 users [F], because commit minimums are met only at volume. That is real behaviour, not a bug.
- **Layout (BD-18, closes P-1).** All options of a step are equal in width and height and align on one grid; before v0.3 five company cards wrapped as three plus two with an empty cell. You asked the designer to decide from renders, and the study in `mock/docs/theme-options/intake-studies/README.md` recommends "A. Ruled list of equal rows": one full-width row per option, equal row heights, the same pattern on phones, and "I sell AI compute" as the last row under the same rule. **[v0.4 DRAFT, supersedes "a quieter last row"; R-1]** It is drawn like the other rows, with an icon, a bold label and a hint.
- **Acceptance.** (1) Every step in the table appears only under its condition. (2) **[v0.4 DRAFT, supersedes "Every answer changes the estimate"; R-3]** Once the estimate shows figures (R-3), every answer changes it within one frame of the click. (3) At 375, 768 and 1280px every option in a step has the same width and height and the same left edge (a layout test reads their bounding boxes). (4) No step leaves an empty cell in its last row. (5) **[v0.4 DRAFT, supersedes "from step 2 it is present"; R-3]** The estimate panel is absent on step 1, step 2 and every head-count step, and present from the budget step. (6) **[v0.4 DRAFT, supersedes the empty rule on step 1; R-2]** The step label reads "Step 1" before a type is chosen and "Step n of N" after, with N equal to the number of rows of the table shown for that type; on step 1 the progress rule is filled to 1 over the largest step count of any type.

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

- **Requirement (BD-12, BD-18).** Team size, customers and budget each use a log-scale slider with clickable preset marks and a typed number field. Team size and customers keep today's presets as marks (for example 25, 50, 100, 500 people for small-team types and 100, 500, 1,000, 5,000 for large ones). Budget marks are one per decade ($10K, $100K, $1M, $10M), because the old four would sit about 6% apart on a $1K to $100M log track (BD-18). The typed field accepts forms such as "2500", "20M" or "$1.5m". **[v0.4 DRAFT, supersedes the marks under the track and the buttons on narrow tracks; R-4]** At every width the presets are a labelled row of equal buttons above the slider, each with its own hue as a 6px top edge, and the track keeps a tick at each preset's value in the same hue. Clicking a mark sets that value; dragging or typing sets any value in range.
- **Why.** You asked for team size "more continuous yet clickable", then chose "Team size, customers and budget (Recommended)". A log scale fits a 1 to 10,000 range in one track.
- **Data and compute.** None new. Dragging recomputes on a throttle, as in 4.1.
- **Acceptance.** (1) A preset mark sets the exact preset value. (2) Typing 73 gives 73. (3) Keyboard arrows step the value, and Page Up/Down jump between marks. (4) The slider, the field and the sentence blank always show the same value. (5) **[v0.4 DRAFT, supersedes the width-dependent placement; R-4]** At every width the presets render as one row of equal buttons above the track, and R-4's acceptance passes. (6) Typing "20M" in the budget field sets $20,000,000.

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
| C1 | **Budget allocation, today vs Infravana** | Two stacked horizontal bars, same total, segmented by provider/channel and hardware tier. **[v0.4 DRAFT, supersedes the separate saving segments; R-11]** The Infravana bar ends in one labelled saving block; its tooltip and the benefit boxes split it into provider arbitrage and routing. | Where each dollar goes | Cost | Always (anchor chart). |
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
- Visual rules follow the `dataviz` skill: Infravana is one consistent accent colour, "today" providers take the Today colours of the Azure palette (14.1, R-11) **[v0.4 DRAFT, supersedes "neutral greys"]**, and every chart carries direct labels. The visible one-sentence takeaway is replaced by benefit boxes (6.4); the sentence stays as the chart's accessible name and table caption.

### 6.1 The comparison set: several Today options, one InfraVana bar

- **Requirement.** Every chart in the v0.3 set shows every grey Today option, **up to four**, against **one InfraVana bar**, drawn as the table "How each chart draws them" says.
  - **The candidates** (your answer): the typical buyer for the stage; the other ways to buy (seats, pay-as-you-go API, cloud platform); each major API vendor bought end to end; best single option.
  - **Which ones (BD-13).** "Let the data decide, no named defaults": the default greys are up to four, taken in popularity-rank order from a rank the data supplies per stage (`pattern_popularity.csv`, 7.4 **[PROPOSED]**; placeholder ranks in the mock, invented and labelled), so the grey order can differ between the seats, api and platform stages. The typical buyer is the one fixed member; the data decides the rest. The typical buyer is the `way_to_buy` pattern whose `stage` equals `stage_today`; it is never listed twice. If it does not rank in the top four, it takes the fourth slot so the four-grey limit holds **[ASSUMPTION]**.
  - **Best single option.** A selectable extra comparator that shows its own paired InfraVana result (BD-13). It is the cheapest single **proprietary** offer that meets every floor in the mix; open-weight hosted offers are not considered **[PROPOSED]**, as the S1 example below and the feasibility numbers assume. When best single option is the comparator, it replaces the lowest-ranked grey that is not the typical buyer; the grey count never exceeds four.
  - **One named comparator [REQUIREMENT].** The InfraVana bar is always measured against one named Today, the comparator. The hero, the benefit boxes and every chart name it.
  - **A page-wide "Compared with" selector [PROPOSED].** It defaults to the typical buyer, and changing it recomputes InfraVana against the new comparator on every chart and tab. **[v0.4 DRAFT, supersedes "It sits above the stage"; R-7]** It is the comparator's name in the headline, a picker with a caret and an underline, with one plain line under the headline saying what it means.
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
| C1 | Two bars, each segmented by channel, as now | **[v0.4 DRAFT, supersedes the patterned option bars; R-11]** An unsegmented total bar with the solid fill of its option slot (brick, sienna, ochre in rank order; 14.1), a direct label and its quality score; no fill is shared with the comparator's channel segments | C1 colours its Today segments with the same greys, so several segmented Today bars would collide [F]; unsegmented bars avoid that |
| C3 | Grouped bars per model class, as now | **[v0.4 DRAFT, supersedes the markers; R-11]** A bar per model class where that option has a price, on the same baseline as InfraVana, in equal bar groups; none where it has none | With at most four Today options the groups stay readable; markers made a staircase (palette README, fault 14) |
| C5 | One bar each | One bar each, with a direct label and its quality score | One value per bar, so it fits [F] |
| C10 | The InfraVana line | One reference per grey option (6.3) | |

  Four greys is a hard limit. **[v0.4 DRAFT, supersedes "slots 3 and 4 need the restored patterns"; R-11]** The four slots are told apart by the Azure Today ladder (comparator wine, then brick, sienna and ochre; 14.1), behind direct labels. "Grey" stays the name of a Today slot whatever its colour (15). The code allows four options besides the comparator; 12.5 asks which way that is resolved.
- **Data and compute.** See 7.4: a `buying_patterns.csv` with a pattern per Today option, a `pattern_id` column replacing the three-value `stage` key of `baseline_providers.csv`, a pricing rule (list or commit) per pattern instead of `stage_today === "platform"`, best single option derived in compute rather than typed, and `Results.today_alternatives[]` so one call returns every shown Today with its total and its price per model class (for the C3 markers). That is up to seven extra `computeToday` calls inside `compute()`, which now takes 0.137 to 0.192 ms per call (review-w0-001, measured on placeholder data; 0.104 ms before the alternatives [F]). Per-stage ranks come from `pattern_popularity.csv` (7.4).
- **Acceptance.** (1) No chart shows more than four greys. (2) The typical buyer is always present, and the others follow the `popularity_rank` order for the visitor's stage; changing a rank in `pattern_popularity.csv` changes the set with no code change. (3) Every InfraVana number on the page names the same comparator. (4) Picking a comparator changes the hero, boxes and charts to that pairing, and S1 against vendor 2 direct shows 60,007.50 against 43,948.24 on placeholder data. (5) Every grey bar shows a quality figure. (6) **[v0.4 DRAFT, supersedes the patterned option bars and the C3 markers; R-11]** C1 shows one unsegmented, solid-filled, labelled bar per grey option other than the comparator, and no fill appears both on a comparator channel segment and on an option bar; C3 shows one bar per such option per priced class, on the same baseline as InfraVana. (7) The chosen comparator stays the same after switching tab, switching chart and reloading the URL. (8) A pattern other than `kind = best_single` (which is derived, not read from rows) with no `baseline_providers.csv` rows for the visitor's workloads is absent from the selector and the grey set, and the next by rank takes its slot. (9) With best single option as comparator, there are still at most four greys and the typical buyer is one of them. (10) Best single option is always a proprietary offer: on S1 with software engineering as the only work, it is never an open-weight offer such as open_x via neocloud. (11) With ranks that differ by stage, S1 at stage seats and at stage api shows different greys.

### 6.2 Goal tabs G1 to G4

- **Requirement.** Four tabs above the hero choose how the result is framed. **[v0.4 DRAFT, supersedes the tab group as built, with G3 greyed out; R-6]** They are a tab bar of four equal tabs, each showing its goal's figure, with the chosen tab joined to a framed result panel. All four are always shown and enabled. Each tab states which compute function produced its headline (in its "How is this worked out?" drawer). The tab is stored in the URL (`goal=G2`). P-8 [PROPOSED] covers the set, the order and the URL; the separate-optimisation rule is decided (BD-15).
- **Why.** You asked for tabs: "Some other executive might llike more users for the same money or they can take a performance hit (slower model) and save even more etc." Your rule: reframe if the results are equivalent, otherwise a separate optimisation. **They are not equivalent in general [F]:** the three views agree to 4 decimals on the four shipped scenarios, but drift by 0.5% to 11% where volume crosses a commit minimum (S2 at a $30K budget: 1.4628 claimed, 1.3002 solved), by about 3.5% with customer workloads (1.4115 against 1.4613), and by under 1% for seats. **So G2 and G3 are separate optimisations**, which you chose: "Yes, separate optimisations (Recommended)" (BD-15).

| Tab | Definition | Headline | Compute function | Acceptance |
|---|---|---|---|---|
| G1 Less money for the same AI | The visitor's volume, priced both ways | "$X less each quarter than <comparator>" and the % | `compute()` as today | Headline = C1's "Saved" block, the sum of the arbitrage and routing savings **[v0.4 DRAFT, supersedes "sum of C1 savings segments"; R-11]**; S1 shows 29.57% on placeholder data |
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
- **Acceptance.** (1) Every point equals a direct `compute()` at that threshold. (2) Y never rises as the threshold tightens. (3) The marker for the current setting sits at the lowest of the visitor's workload floors (78 on S1 at defaults). (4) **[v0.4 DRAFT, supersedes "carries the provenance badge"; R-10]** The speed view's "Where these numbers come from" table lists the invented rows as modelled, and the invented-data source line is present (BD-11). (5) The switch state is in the URL (`c10=speed`). (6) With no proprietary speed rows loaded, the speed switch is disabled and shows its reason.

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
3. **With Infravana.** For each workload type, choose among all allowed offers that satisfy the quality floor and latency target, and pick the cheapest subject to capacity. Start with greedy-by-cost-per-token and swap to a small LP if capacity constraints bind. There are two sources of gain, and the UI keeps them visible separately: C1 shows one labelled saving block whose tooltip, with the benefit boxes, gives each source **[v0.4 DRAFT, supersedes "as separate segments in C1"; R-11]**:
   - **Provider arbitrage for proprietary models.** The same model is sold through several channels (direct API, Bedrock, Azure and so on) at different list prices, commitment discounts and regional prices. Infravana's gain here is the better deal across them. It does not change the model.
   - **Routing to cheaper models and hardware.** Where quality permits, move a share of traffic to mid-tier or open-weight models served on heterogeneous GPU and accelerator tiers.
   **As built (BD-8):** InfraVana never changes the comparator's tier shares; routing acts only on the open-weight share; moving traffic to a cheaper tier is not implemented. In G4 and in the C10 speed view only, a proprietary offer may move to its own batch or flex price tier (same model, same quality; 6.2, 6.3) **[PROPOSED]**. Capacity is unlimited, so "subject to capacity" and the LP are not implemented either [F].
4. **Budget.** If cost exceeds budget, report the covered fraction. If under budget, report the remaining headroom and the extra tokens it buys (C5). The budget never changes the InfraVana plan, only tokens bought and coverage [F]; no copy may say InfraVana "optimises to your budget". G2 and G3 solve against the budget separately (6.2).
5. **Chart series.** Each chart's data is a view over `results`.

Credibility rules:

- The S2 story is "same frontier models through a better channel, plus routing what can move to cheaper models and hardware." The engine keeps those separate, in C1's saving tooltip and the benefit boxes (R-11), instead of claiming blanket hardware savings **[v0.4 DRAFT, supersedes "shows those as separate segments"]**. Provider arbitrage needs real price data per channel (see `model_offers.csv`), so it is only as credible as that file.
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

Provenance **[v0.4 DRAFT, supersedes the badges; R-10]**: every series whose provenance is not `measured` has a row, "Modelled" or "Vendor-reported", in its chart's closed "Where these numbers come from" table, as section 9 says (BD-9). A series with no row is measured, and a non-measured series is never left out. The `provenance` columns are unchanged. The data contract gains an optional source URL per series, which the series' provenance part carries to that table. It is read from the rows' `source_url` (or `run_url`) columns. An optional `source_url` column is added to `hardware.csv` and `seat_plans.csv`, the two files that feed a chart series and hold no address today (`hardware.csv` has the text column `hr_price_source`); `model_offers.csv`, `buying_patterns.csv` and `quality.csv` keep their `source_url`, and `throughput_curves.csv` its `run_url`. Every address in the current fixtures is the invented placeholder address, so every vendor-reported row says "placeholder, no source yet".

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

- **Where these numbers come from [v0.4 DRAFT, supersedes the provenance badges and line styles; R-10].** Under each chart, a closed disclosure like "Fine-tune the assumptions" opens a table (bar or group, covers, basis, source) with one row per *vendor-reported* or *modelled* series or group, and a "Price list" link to its source where the data holds one. A series with no row is *measured* (a run with a link). No badge box, outline or line style carries provenance.
- **Assumptions panel** listing defaults the LLM filled in, plus the baseline definition, the $/GPU-hr sources and the data version. In v0.3 it lists the intake's defaults (for example customers per company type) instead.
- **"How this is computed"** drawer per chart, with a Download CSV link for exactly the rows the chart uses.
- Both sides of every comparison use the same quality floor and latency target. The UI states them next to the headline. G4 is the one labelled exception, because you chose to give something up; it states both sides' floors and speeds (6.2) **[PROPOSED]**.
- **Restored in v0.3, reversed by v0.4 asks [v0.4 DRAFT, supersedes the restored badges, outlines and patterns; R-10, R-11].** In v0.3 you chose "Restore the full spec rules". Your v0.4 asks 10 and 11 and your answers of 2026-10-22 remove the badges, the dashed and dotted outlines and the patterns, and keep the information in a closed "Where these numbers come from" table under each chart (R-10, R-11, 12.5).
- Every chart carries a source line, and any chart that uses invented speed or batch rows also says "Source: invented placeholder data" (BD-11).
- **Acceptance.** (1) Every chart in the v0.3 set renders a source line under its canvas. (2) **[v0.4 DRAFT, supersedes "and the provenance badge"; R-10]** With BD-11 rows loaded, the G4 view and the C10 speed view each show "Source: invented placeholder data" and a "Where these numbers come from" table listing the invented rows as modelled; the G1 view shows neither the invented source line nor the invented rows. (3) The footer text contains "invented" whenever BD-11 rows are loaded. (4) **[v0.4 DRAFT, supersedes "shows its badge and dashed outline"; R-10]** A modelled series has a row in its chart's "Where these numbers come from" table and no dashed outline.

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
| Mobile | See 4.1: swipeable stage, the contents column as one picker (R-8), two-column balanced grid view (R-13), fine-tune collapsed **[v0.4 DRAFT, supersedes "collapsed index"]**. |
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
| BD-6 | Notice colour | Amber family, now the Azure notice values (`#fdf3d9` fill, `#584503` text, `#695205` border; 14.1) **[v0.4 DRAFT, supersedes `#fff6dd`, `#6b4a00`, `#a07a1a`; R-12]**, for state banners only, never charts. Fallback: white banner, dark border, icon. | Reversible; one token group. | Your sign-off. |
| BD-7 | Brand spelling | UI copy writes "InfraVana", as the live site does; the spec, files and code keep "Infravana". | Copy only. | Your sign-off. |
| BD-8 | Conservative routing rule | InfraVana never changes the tier shares. Savings come from the cheapest channel per proprietary model (arbitrage) and the cheapest eligible hardware or channel for the open-weight share (routing). No tier moves; capacity unlimited. | Least flattering reading of 7.2; needs no invented reroute share. You confirmed it on 2026-10-21 for v0.3. | When real data and a rule for a reroute share exist. |
| BD-9 | Badging | **[v0.4 DRAFT, supersedes "is badged"; R-10]** Every non-measured series has a row in its chart's closed "Where these numbers come from" table (R-10), following section 9 over 7.3. | Display only. | Your answer of 2026-10-22 (12.5). |
| BD-10 | Examples | The mock loads the S1 example on start, and the example chips open their scenario directly instead of filling a prompt box. The intake now sits in front. | Reversible once a prompt flow exists. | When the layer returns. |
| BD-11 | Invented speed and batch rows | Fixtures gain invented proprietary speed and batch or flex price rows, under five guardrails: (1) every invented row carries the placeholder source address (`https://example.invalid/placeholder-invented-data/...`) and `provenance=modelled`, and the data README lists exactly which rows are invented; (2) a check script fails if any proprietary speed or batch-price row lacks the placeholder marker; (3) the rows, and the batch or flex move they allow (7.2), act only on the G4 tab and the C10 speed view, so the default tab's numbers do not change; (4) any chart that uses them lists them in its "Where these numbers come from" table and shows a "Source: invented placeholder data" line, and the footer says so **[v0.4 DRAFT, supersedes "shows the provenance badge"; R-10, 12.5]**; (5) the same columns are listed (7.4) as inputs the real backend must supply. | The rows are labelled, checked and fenced off from the default view. | When the backend supplies real rows. |
| BD-12 | Continuous inputs | "Team size, customers and budget (Recommended)": all three use the log slider with clickable presets and a typed number (5.1). Budget runs to $100M a quarter so 10,000 users fit (5.2). | Control and range only; compute unchanged. | Customers range is my default (5.2, 12.4). |
| BD-13 | Today set | "Let the data decide, no named defaults": up to four greys in `popularity_rank` order from the data (invented, labelled ranks in the mock); the typical buyer for the stage always present as the comparator; best single option a selectable extra comparator with its own paired InfraVana result; quality shown beside every Today bar (6.1). | The ranking lives in data. | When the backend names a real popularity source. |
| BD-14 | Benefit boxes | "Two or three numbers per chart (Recommended)": each naming its comparator, derived from that chart's data, never repeating the hero headline (6.4). | Display only. | Contents per chart reviewed at build. |
| BD-15 | Goal tabs G2 and G3 | "Yes, separate optimisations (Recommended)", computed by `solveAtBudget` (6.2). | One function; the tabs read its result. | If prices stop stepping with volume, the views converge anyway. |
| BD-16 | Fonts | "Self-host in the repo (Recommended)": Newsreader and Hanken Grotesk ship with the bundle; no third-party requests (13, 14.2). | Swapping the source is a CSS change. | Licence check before go-live (12.4). |
| BD-17 | Build commits | "Commit straight onto intake-v2": local only, no push, no PR; step 0 lands alone, then parallel workers in separate worktrees merged into `intake-v2` (11). | Local history only. | Before anything is published. |
| BD-18 | Intake layout and controls | "I need to see renders of this to make a choice. Why don't the design expert weigh in on this". The designer recommends (`mock/docs/theme-options/intake-studies/README.md`): a ruled list of equal rows, with "I sell AI compute" as the final row, now drawn like the others (R-1); a log slider with clickable preset marks plus a typed number for team size, customers and budget, the presets now a coloured row of buttons above the slider at every width (R-4). The designer's own product choices, which you may overrule: budget marks one per decade; the estimate hidden until the budget step (R-3) **[v0.4 DRAFT, supersedes the quieter row, the step-1-only hidden estimate and the narrow-track buttons; R-1, R-3, R-4]**. | Layout and copy only. | If you overrule any of the three product choices (12.4). |

Earlier **[ASSUMPTION]** tags in this document are also bootstrap-grade, and the same review applies to them.

The most expensive of these to change later is the **CSV schema** in section 7.3, because the backend will be built against it. That is the one place worth a deliberate check with the backend owner before they start.

### 12.4 Questions for you

Only points you have not answered are listed. Closed by your answers on 2026-10-21, now decisions: P-1 (BD-18), P-2 (BD-12), P-5 and P-6 (BD-13), P-7 (BD-14), P-9 (BD-11), P-10 (12.2 row 24), G2 and G3 as separate optimisations (BD-15), fonts (BD-16), commits (BD-17). Each item below goes ahead as written unless you say otherwise. **v0.4:** items 1 (patterns), 5 (where the selector sits), 19 (G3 disabled), 20 (the designer's product choices) and 28 (the accent) are changed by v0.4; 12.5 records the answers and what is still open.

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

### 12.5 v0.4: your answers and what is still open

**Resolved by your answers of 2026-10-22 and 2026-10-23.** Each reverses or settles something decided earlier. The clauses are edited in place, and the v0.3 wording is in Appendix A.7.

| Ask | Your answer | What it reverses or settles | Where |
|---|---|---|---|
| 2 | Round 2 and board 02: "Step 1" on step 1, with the rule already at 1/6; "Step n of N" from step 2 | 4.3: the empty rule on step 1 | R-2, 4.3 |
| 4 | 4B, with four preset hues and matching ticks (green, coral, periwinkle, plum); the one-violet ramp rejected as "all similar colour" | 5.1: marks under the track at their values, and buttons only on narrow tracks | R-4, 5.1, BD-18 |
| 5 | 5B, balanced for 6 and 5 answers | 4.2: the editable sentence | R-5, 4.2, 14.3 |
| 6 | 6B, the tab bar | 6.2: the tab group as built; 14.3: the hero's double rule; 6.2 and 10: G3 disabled without team work | R-6, 6.2, 10, 14.3 |
| 8 | 8C, the contents column | 4.1: the one-line numbered index | R-8, 4.1 |
| 9 | No ordinal numbers anywhere; balanced grids always, by the rule on board 09 | The "Figure n." titles of the theme (14.3), the numbered index (12.2 row 14) | R-9, R-13, 4.1, 14.3 |
| 10 | Keep the information in a closed disclosure with a source table; the boxes and outlines go; no invented addresses | "Restore the full spec rules" for badges and outlines (12.2 row 15), BD-9, BD-11 guardrail (4) | R-10, 7.3, 9, 14.4 |
| 11, 12 | Distinct Today hues; colourful, hopeful charts on calm chrome; Azure chosen, Azure gold-first not | The patterns of "Restore the full spec rules", the greys for Today, the v0.3 palette | R-11, R-12, 6, 6.1, 14, 14.1, 14.4, 14.5 |

**"Rest are all ok": the reading to confirm at freeze.** On 2026-10-23 you said "rest are all ok". I read it as accepting two things, and ask you to confirm the reading at freeze:

- The one drawn result of each of asks 1, 3, 7, 9 (no ordinals) and 10 (R-1, R-3, R-7, R-9, R-10).
- The flagged defaults this list carried before. The boards answered most of them: the estimate on the budget step (R-3), the preset row (R-4), the answer grid (R-5), the tab bar (R-6), the headline picker and its line (R-7), the contents column (R-8), the disclosure's details (R-10) and the palette's gates (R-11, R-12).

**Open for the freeze.**

1. **Brand-owner sign-off of the accent.** The accent moves from `#466577` to `#0065b0`: hue 250° instead of the logo's 232°, OKLCH chroma 0.142 instead of the logo's 0.038, CIEDE2000 14.3 from the logo's median colour. The logo file is unchanged. If it is not signed off, the palette README's fallback is the logo hue, and then InfraVana cannot be the most vivid mark with four Today bars that pass the vision gates. This replaces 12.4 item 28's accent question. (14.1, R-12)
2. **The fourth Today option.** The palette has four Today colours: the comparator and options 1 to 3. The code allows four options besides the comparator (`MAX_OPTIONS` is 4 in `mock/src/charts/patterns.ts`), so it can draw five Today bars. The design README offers two ways out: option 4 reuses option 1's colour, or the Today bars are capped at four in total. The cap is the default you set in 6.1, and the palette README assumes it. Which do you want? (6.1, R-11)
3. **Your view of the redrawn preset colours.** Board 04 was redrawn in four hues after you rejected the violet ramp. Your reaction to the redraw is not yet known. (R-4)

**Gaps the boards and READMEs leave [OPEN].** These are recorded so the build does not guess:

- the preset tokens' names and their selected tints;
- the generated files still hold the violet ramp, not board 04's hues (14.1);
- the inactive tabs' fill token (R-6);
- what a tab shows while its goal is still solving (R-6);
- the G3 placeholder values (R-6);
- the best-single-option wording under the headline (R-7);
- whether unbuilt charts are listed in the contents column (R-8);
- how a C1 bar with several channel segments colours them (R-11);
- the progress rule's thickness: 2px in 14.3, 3px in the design README's note on ask 2 (R-2).

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

The page reads as a published research note: warm paper, serif figure titles, sourced figures with no figure numbers (**[v0.4 DRAFT, supersedes "numbered and sourced figures"]**, R-9), structure drawn by rules instead of cards and shadows. You chose it on 2026-10-21. **[v0.4 DRAFT, supersedes the d1 source for colours; R-12]** Source of every colour below: the Azure palette in `mock/docs/design-v0.4/palette/` (14.1). Type, shape and page values still come from `mock/docs/theme-options/source/d1-research-note.css`, as changed by section 15. The brief stands: the page must not look AI-generated and should look like a leading-edge infrastructure startup. The option's named risk is that it is calm rather than "leading edge" and can read as a blog. v0.4 answers that risk with the Azure palette: calm chrome, vivid charts (R-11, R-12).

What it keeps from v0.2: the steel-blue logo, unedited; the accent for InfraVana, now the Azure blue `#0065b0` pending the brand owner (12.5), with Today's colours from the Azure Today ladder (**[v0.4 DRAFT, supersedes "greys for Today"]**); the accent used for "With InfraVana" and nowhere else; the footer line "Illustrative figures only. Prices and savings are placeholders, not quotes."; light mode only **[ASSUMPTION]**.

### 14.1 Palette

**[v0.4 DRAFT, supersedes the v0.3 Research Note palette, now in Appendix A.7; R-11, R-12.]** This is the Azure palette, which you chose on 2026-10-23. Every value is copied from `mock/docs/design-v0.4/palette/generated/tokens.css` (block `html[data-pal="AZ"]`). Every contrast figure is copied from `mock/docs/design-v0.4/palette/generated/checks.md` (section "AZ: Azure", WCAG 2.x). Both files are written by `palette.py`. The one exception is the preset row, which comes from board 04 (see the second bullet below).

| Role | Token | Value | Contrast (checks.md) |
|---|---|---|---|
| Page (paper), chart ground | `--color-bg`, `--color-bg-top` | `#f7f4ef` | Body text 15.53:1 |
| Surface, chart ground | `--color-surface` | `#fcfaf6` | Body text 16.35:1 |
| Muted panel, never under a chart | `--color-surface-muted` | `#ece9e2` | Body 14.05:1, secondary 5.61:1 |
| Text, focus ring | `--color-text` | `#1d1c19` | 15.53:1 on page |
| Secondary text, budget line | `--color-text-secondary` | `#5c5b57` | 6.20:1 on page, 6.52:1 on surface |
| Disabled text, `:disabled` controls only | `--color-text-disabled` | `#888682` | 3.31:1 on page (restricted, reported) |
| Rules | `--color-border` | `#d6d2ca` | Decorative |
| Grid lines | `--color-grid` | `#e3dfd7` | Decorative |
| Input, chip and axis borders | `--color-border-strong` | `#89867e` | 3.31:1 on page, 3.49:1 on surface |
| InfraVana fill | `--color-accent` | `#0065b0` | Mark 5.49:1 on page, 5.77:1 on surface; paper label inside 5.77:1 |
| InfraVana text, links of the brand, C10 frontier | `--color-accent-strong` | `#005798` | 6.80:1 on page, 7.15:1 on surface, 6.17:1 on the selected tint, 5.89:1 on the C10 wash `#dee6e9` |
| Primary button, chosen tab | `--color-accent-deep` | `#004479` | Paper label 9.58:1; mark 9.10:1 on page |
| Hovered primary button | `--color-accent-hover` | `#002f56` | Paper label 13.07:1 |
| Selected row (with a 2px `--color-accent-strong` edge) | `--color-accent-soft` | `#dfebf8` | Body 14.10:1, secondary 5.63:1, edge 6.17:1 |
| Saving figure | `--color-positive` | `#1e6250` | 6.56:1 on page, 6.90:1 on surface |
| Saved fill | `--color-saved` | `#319379` | Mark 3.43:1 on page, 3.61:1 on surface; ink label inside 4.53:1 |
| Today comparator (wine) | `--color-today-1` | `#5d1534` | Mark 11.80:1 on page, 12.42:1 on surface |
| Label inside the comparator bar | `--color-label-on-comparator` | `#fcfaf6` | 12.42:1 |
| Today option 1 (brick) | `--color-today-2` | `#892e2c` | Mark 7.68:1 on page, 8.09:1 on surface |
| Today option 2 (sienna) | `--color-today-3` | `#a1592a` | Mark 4.81:1 on page, 5.06:1 on surface |
| Today option 3 (ochre) | `--color-today-4` | `#b28439` | Mark 3.06:1 on page, 3.22:1 on surface |
| Section accent (clay), chrome only | `--color-section` | `#7f5a43` | Label 5.55:1 on page, 5.85:1 on surface; rule the same |
| Notices (BD-6) | `--color-notice-bg` / `-text` / `-border` | `#fdf3d9` / `#584503` / `#695205` | Text 8.38:1; border 6.81:1 on page, 6.76:1 on the fill |
| Presets (R-4) | **[OPEN]** | green `#316a23`, coral `#cc675c`, periwinkle `#736dc3`, plum `#883871` | From board 04: tick and edge on page 5.95, 3.38, 4.07 and 6.71:1; ink label on the selected tint 13.45, 14.21, 14.06 and 13.22:1 |

- **Summary (checks.md).** 66 gated pairs, 0 failures. The lowest text pair is 4.53:1 (ink inside saved) and the lowest mark 3.06:1 (ochre on paper). Reported, not gated: saved on `--color-surface-muted` 3.10:1, ochre on it 2.77:1, comparator on it 10.68:1. That is why charts never sit on it (R-11).
- **The presets differ from the generated files.** `generated/tokens.css` and `checks.md` still hold a five-step dusty violet ramp (`--color-preset-1` to `-5`, `#8b7ea5` to `#3d3052`) and a clay alternative. You chose board 04's four hues instead (Round 3). They come from board 04 and `mock/docs/design-v0.4/README.md`, and are not yet generated or gated by `palette.py`. Their token names and selected tints are **[OPEN]**.
- **How the values were made.** In OKLCH, from the logo's median hue of 232° (palette README section 2). InfraVana is moved 18° to 250° so that it can be the most vivid mark (chroma 0.142); the Today ladder runs at 359°, 25°, 51° and 77° in equal lightness steps; saved is at 172°. `python3 -I -B palette.py --check` regenerates the files and gates them.
- **The accent moves** from `#466577` to `#0065b0`. The brand owner's sign-off is open (12.5). The logo file is unchanged.
- **Greyscale near-ties** (checks.md): InfraVana with option 2 (1.14) and saved with option 3 (1.12). Each pair sits in different, directly labelled rows, and saved appears only inside the InfraVana row.

### 14.2 Type

- **Hosting (BD-16).** Both fonts are self-hosted in the repo ("Self-host in the repo (Recommended)"), not loaded from Google Fonts, so the embedded page makes no third-party requests. Their licence files ship beside them; the licence terms are still to be checked (12.4).
- **Acceptance (BD-16).** Loading the page makes zero requests to an origin other than the page's own; both font files load from the bundle.
- **Headings, figure titles, the estimate figures and the hero figure:** Newsreader (serif), weight 500. Hero figure 3.6rem (2.3rem under 600px); intake title 2.6rem; figure titles 1.85rem.
- **Body and UI:** Hanken Grotesk, falling back to Arial.
- **Figures:** tabular, lining numerals, as in v0.2. Serif text at small sizes needs care; keep serif at 1.1rem and above.

### 14.3 Shape and page patterns

- **Corners and depth:** 2px corners everywhere, no shadows. Sections sit on the paper between 1px ink rules, not in cards.
- **Header:** title in Newsreader, italic tagline, a 1px ink rule below; the logo has no plate.
- **Intake [v0.4 DRAFT, supersedes the white selected option and the ink step label; R-2, R-12]:** step labels in small capitals with tracking, in the section accent; a progress rule in the section accent (thickness [OPEN], R-2); options on the surface with a 1px rule; the selected row in `--color-accent-soft` with a 2px `--color-accent-strong` edge; equal rows per BD-18.
- **Estimate:** a margin note with one vertical ink rule at its left; italic serif title. Under 600px it moves above the questions with a top rule.
- **Sentence [v0.4 DRAFT, supersedes "large serif with blanks underlined in accent-strong"; R-5].** An answer grid: small-capitals labels over serif values in the brand text colour, each value with a caret and an underline, cells divided by rules, balanced by R-13.
- **Hero [v0.4 DRAFT, supersedes "a double rule above"; R-6]:** a framed panel (`--color-surface` fill, 1px edge) joined to the chosen goal tab, italic lead, large serif figure, with the comparator picker inside the headline (R-7).
- **Figures [v0.4 DRAFT, supersedes the "Figure n." label, the matching index number and the 1px ink rule; R-9, R-12].** Each chart shows its title alone, with no "Figure n." label, under a 2px rule in the section accent. Under the chart sits the closed "Where these numbers come from" disclosure (R-10). Each ends with a source-and-note line: "Source: InfraVana cost model on illustrative price tables. Note: all figures are invented placeholders, not quotes."
- **Benefit boxes (6.4):** to be drawn by the designer in this language (for example a ruled row of figures with serif numbers and a small comparator line), not as shadowed cards.
- **Notices:** amber family (BD-6), chrome only.
- **Acceptance (14.1 to 14.3).** (1) A test reads every token of 14.1 from the computed styles of the page and finds it equal to the table value. (2) **[v0.4 DRAFT, supersedes "Each figure title's number equals its index number"; R-9]** Each figure title's text equals its contents item's text in 4.1, and neither contains a figure number. (3) **[v0.4 DRAFT, supersedes "`3px double`"; R-6]** The hero panel has a 1px border and the `--color-surface` background. (4) No element on the page has a non-`none` box shadow. (5) Every corner radius computes to 2px or 0; the chosen designs keep the 2px rule.

### 14.4 Chart series and provenance marks [REQUIREMENT]

**[v0.4 DRAFT, supersedes 14.4 as written in v0.3: the badges, the dashed and dotted outlines, the series patterns and their acceptance; R-10, R-11. The v0.3 text is in Appendix A.7.]**

- **Requirement.** Chart series are solid fills and solid lines, told apart by hue and lightness and by direct labels (R-11), in the palette chosen for R-12. Provenance is kept in the closed "Where these numbers come from" table under each chart (R-10), not shown by badges, outlines or line styles. The chart styling rules of R-11 apply to every chart. In line charts no dash or dot style carries provenance **[ASSUMPTION]**.
- **Why.** Your v0.4 asks reverse the v0.3 restoration: "They look ugly. If they serve no purpose, then lets remove them." (ask 10) and "The bars are hideous with the pattern fill." (ask 11). Your answers of 2026-10-22 keep the information in the "Where these numbers come from" table and let Today options take distinct hues (12.5).
- **Acceptance.** The acceptance lists of R-10 and R-11.

### 14.5 Motion, contrast and charts

- **Motion:** calm, nothing decorative. One fade token drives the carousel transition (4.1) and drops to 0 ms under `prefers-reduced-motion`.
- **Contrast [v0.4 DRAFT, supersedes "on the d1 values, 0 failures across 32 pairs"; R-11, R-12].** Every text pair passes 4.5:1 and every mark and border 3:1 on the Azure values: 66 gated pairs, 0 failures (`mock/docs/design-v0.4/palette/generated/checks.md`); the lowest text pair is 4.53 and the lowest mark 3.06. The restricted uses of 14.1 are reported, not gated. The four preset hues of R-4 are checked on board 04 until `palette.py` generates them. Any new token is added to the table before it ships.
- **Charts:** follow the `dataviz` skill: direct labels over legends, no chartjunk. Chart code reads colours from CSS variables, never copied hex.

## 15. v0.4 visual and flow revision

Your twelve asks of 2026-10-22, one requirement each (R-1 to R-12), plus the balanced-grid rule you set in round 2 (R-13). You chose the designs on 2026-10-23, after two rounds of boards. Each requirement names its chosen board, which is the visual source of truth, and writes the design out in words a test can hold. The boards are in mock/docs/design-v0.4/; the palette, its generator and its checks are in mock/docs/design-v0.4/palette/. The spec stays **NOT FROZEN** until you freeze it. Nothing in this section is built before the freeze.

How to read it:

- Each requirement is written as **Ask / Requirement / Why / Data and compute / Selected design / Acceptance**. Every acceptance item is a test or a measured render: a script that reads the rendered page's computed styles, bounding boxes or text, or the chart option objects.
- "The three test widths" means 375, 768 and 1280px, as in 4.3 acceptance (3). "Phone" means below 600px, as in 4.1.
- "Grey" stays the name of a Today option slot (1 to 4) everywhere in this spec, though the Azure palette gives each slot a hue. "The sentence" of 4.2, 5 and 5.1 now means the answer grid of R-5.
- Asks 1, 3, 7, 9 and 10 have one drawn result each. You accepted them with "rest are all ok" on 2026-10-23, together with the flagged defaults that 12.5 had listed. That reading is mine, **to be confirmed at freeze** (12.5).
- Where a design leaves something unstated, it is marked **[OPEN]**; where I filled a gap, **[ASSUMPTION]**.
- Where an ask reverses something you decided earlier, the clause is edited in place and tagged, and its v0.3 wording is in Appendix A.7.

### 15.1 R-1: an icon on "I sell AI compute"

- **Ask.** "On the first page, the "I sell AI compute" has no icon"
- **Requirement [REQUIREMENT].** The sixth row of step 1 is drawn like the other five, no longer as a quieter row: a server-rack icon in the same 1.5px line style and the same colour as the five company icons, the bold label "I sell AI compute", the hint line "Cloud or GPU provider: talk to us about selling through InfraVana", and the same arrow at the right. The parenthesis of the old label moves into the hint. The row stays last and stays a link to contact. The icon is decorative (`aria-hidden="true"`).
- **Why.** It was the only row without an icon. This changes the "quieter final row" of BD-18 (4.3, 12.3).
- **Data and compute.** None.
- Selected design: 1, mock/docs/design-v0.4/01-provider-icon.png (one drawn result; accepted with "rest are all ok", to be confirmed at freeze).
- **Acceptance.** (1) At the three test widths, the sixth row holds exactly one icon whose rendered width and height, computed stroke width and stroke colour equal those of the five company icons. (2) Its icon, label, hint and arrow share the left and right edges of the other rows' icon, label, hint and arrow (bounding boxes). (3) Its label's computed font weight equals the other rows' label weight, and its hint reads "Cloud or GPU provider: talk to us about selling through InfraVana". (4) The row's height equals the other rows' height at each width (4.3 acceptance (3)). (5) The icon is `aria-hidden="true"`; the row is the last item of step 1 and links to the contact address.

### 15.2 R-2: "Step 1", then "Step n of N"

- **Ask.** "There is step 1, not step X of 5 -- the second slide has it but this does not"
- **Your answers.** 2026-10-22: no count, then keep "Step n". Round 2 (2026-10-23): step 1 shows "Step 1" with the partly filled rule, and from step 2 the label reads "Step n of N". Round 3: board 02 as drawn.
- **Requirement [REQUIREMENT].** Step 1 reads "Step 1", with no total, because N is not known until the company type is chosen. Its progress rule is already filled to 1/6, one step of the longest path, so the page never looks unstarted; 6 is the largest number of steps any type shows, computed from the step rules of 4.3, never typed. From step 2 the label reads "Step n of N", N being the number of steps for the chosen type (6 for a software company, 5 for an AI-first startup, which has no team-size step), and the rule is filled to n/N. The label is in small capitals in the section accent, and the rule is drawn in the section accent over a light track (14.3). The rule's thickness is **[OPEN]**: 14.3 says 2px, and the design README's note on ask 2 says 3px.
- **Why.** You saw step 1 was the only step without "of N". This keeps the v0.3 label and adds the partly filled rule on step 1.
- **Data and compute.** None.
- Selected design: 2, mock/docs/design-v0.4/02-step-label.png (round 2).
- **Acceptance.** (1) Before a type is chosen the label text is "Step 1" and contains no "of". (2) After a type is chosen, on step n with n of 2 or more, the label is "Step n of N" with N the number of rows of 4.3's table shown for that type. (3) On step 1 the rule's filled share equals 1 over N_max, where the test computes N_max as the largest step count over all company types in the data (6 on the current fixtures); on step n of N it equals n over N. (4) The label's computed colour is `--color-section`.

### 15.3 R-3: the estimate waits until it has your numbers

- **Ask.** "Why does the second page and some other pages has "your estimate, per quarter" ? They haven't given any numbers yet -- how is that even computed?"
- **Requirement [REQUIREMENT].** The live estimate is computed from the visitor's own answers only, plus the defaults section 5 names, never from the example scenario the intake starts from.
  - **When it appears.** There is no panel on step 2 or on the head-count steps (team size, customers): the questions take the full width, as on step 1. The panel first appears on the budget step, once the head-count steps the type asks are answered. Its three figures (Today, With InfraVana, You save) do not depend on the budget (7.2 step 4), so it does not wait for one. It stays on the speed step.
  - **What it says.** Under the figures, one line names what they are worked out from, in the board's form: "Worked out from your answers: 120 people, 200,000 customers, 5 kinds of work, at typical use per person and per customer." The values are the visitor's. A part the type does not ask is left out **[ASSUMPTION]**.
  - **Speed.** Until the speed step is answered, the estimate uses the default speed ("within a few seconds", interactive).
  - **Layout.** On desktop it is the margin note beside the question (14.3). On phones it sits above the question.
- **Why.** In the build the panel shows from step 2 and is computed from the example's $100K and 50 people. At step 2 it already showed $103K / $57.6K / 44% before the visitor had typed a number.
- **Data and compute.** No new data and no new function. The intake builds the estimate's scenario from the answered steps and the section 5 defaults. `compute()` is unchanged.
- Selected design: 3, mock/docs/design-v0.4/03-estimate.png (one drawn result; accepted with "rest are all ok", to be confirmed at freeze).
- **Acceptance.** (1) On step 1, step 2 and every head-count step, the estimate panel is absent from the page. (2) On the budget step and the speed step, it is present with three figures and one line that starts "Worked out from your answers:" and holds the visitor's head counts and the number of kinds of work. (3) Run the intake twice, starting once from S1 and once from hardware_heavy, with the same answers: every figure the panel shows is identical in both runs. (4) The Today figure equals, to the cent, `compute()` on a scenario the test builds from those answers and the section 5 defaults alone. (5) Moving the budget slider on the budget step leaves the three figures unchanged. (6) At 375px the panel's bounding box lies above the question's; at 1280px it lies to its right.

### 15.4 R-4: coloured preset buttons, each with its own tick

- **Ask.** ""How many customers use your AI?" -- the tab points on this page seem to crowd up. Possible to design this better?"
- **Requirement [REQUIREMENT].** On the team size, customers and budget steps, the presets are a labelled row of equal buttons above the slider ("Common team sizes", "Common numbers of customers", "Common budgets"), at every width, desktop and phone. A preset no longer sits under its own point on the slider. The track keeps a small tick at each preset's value.
  - **Four hues, not a ramp.** Each of the four presets has its own hue, in this order: green `#316a23`, coral `#cc675c`, periwinkle `#736dc3`, plum `#883871`. The hue shows as a 6px top edge on the button, and the preset's tick on the slider has exactly the same colour.
  - **Not colour alone.** Every button writes its value in ink. The selected preset has a tint of its own colour, a 3px edge in its colour, a check mark and a bold label. The tint values are **[OPEN]**: the board draws them but does not list them.
  - **Kept off the chart colours.** No preset is the InfraVana azure or the saved teal. The nearest chart colour to each is: green, saved teal, CIEDE2000 20.7; coral, "Today 3", 16.5; periwinkle, InfraVana azure, 16.3; plum, "Today 1", 14.6 (board 04).
  - **Figures (board 04).** Tick and edge on the page: green 5.95:1, coral 3.38:1, periwinkle 4.07:1, plum 6.71:1. Ink label on the selected tint: 13.45, 14.21, 14.06 and 13.22:1. Between presets, CIEDE2000 is at least 23.3 in normal vision, 16.9 under deuteranopia, 13.2 under protanopia and 18.8 under tritanopia (computed with the palette's own `colour.py`, Machado 2009, the lower of the linear and gamma conventions).
  - Clicking a preset still sets its exact value, and typing and dragging work as in 5.1.
- **Why.** On the customers step, the old marks at 50,000 and 200,000 sat 8.6% of the track apart and their buttons touched. A row of equal buttons works the same at every width and for any number of presets. You asked for the presets to be colour coded with matching ticks, and you rejected the one-violet ramp as "all similar colour".
- **Data and compute.** None. The preset lists of 5.1 are unchanged; four presets per step on the current data. The four hues are chrome tokens (14.1). Their token names are **[OPEN]**, because `palette.py` still generates a five-step violet ramp (14.1).
- Selected design: 4B, mock/docs/design-v0.4/04-customers.png (round 3, Azure palette). Your reaction to this redraw is still open (12.5).
- **Acceptance.** (1) On each of the three steps, at the three test widths, the preset buttons form one row above the slider track (every button's bottom edge is above the track's top edge), with equal widths and heights. (2) Each button's top border is 6px wide, and its colour equals its tick's colour; the four colours are, in order, `#316a23`, `#cc675c`, `#736dc3`, `#883871`. (3) Each tick's horizontal centre is at its preset's value on the log track, within 1px. (4) Each button's value text is in `--color-text`. The selected button has a 3px border in its own colour, a check mark and a bold label; no other button does. (5) A test recomputes the board 04 figures from the four hex values and the page colour and finds them equal to two decimals. (6) 5.1 acceptance (1) to (4) and (6) pass.

### 15.5 R-5: the answer grid

- **Ask.** "On the final page -- the fill in the blanks section is ugly, please make it aesthetically pleasing."
- **Requirement [REQUIREMENT].** The editable sentence of 4.2 becomes an answer grid. Each answer is one cell: a small-capitals label above the value, with the value in serif in the brand text colour, a caret at the right, and an underline across the cell. The labels are "Company", "Team", "Customers", "Budget a quarter", "Work" and "Answers needed". The values are, for example, "Software or internet company", "120 people", "200,000", "$150K", "5 kinds" and "within a few seconds". Cells are divided by rules. Each cell is the same control as the old blank (a list, or the work checklist), and changing one recomputes the page as in 4.2.
  - **Order.** Company, Team, Customers on the first row; Budget a quarter, Work, Answers needed on the second. A type without team work or without customers leaves that cell out.
  - **Desktop, balanced (R-13).** Up to 3 columns; a cell needs about 300px. Six answers make 3 × 2 with no wide cell. Five answers have no 3-column split, so Company spans two columns in the first row (2 + 1), then a row of 3.
  - **Phone.** One column: a ruled list of label and value, one row per answer.
- **Why.** You chose 5B. The sentence's blanks were sized wrongly, the work list ran two lines under one long underline, and a comma started a line.
- **Data and compute.** None.
- Selected design: 5B, mock/docs/design-v0.4/05-sentence.png (round 2).
- **Acceptance.** (1) With six answers at 1280px, the grid has 3 columns and 2 rows, with no wide cell, in the order above. (2) With five answers at 1280px, Company spans two columns and the second row has 3 cells. (3) At 375px the grid is one column with one row per answer. (4) Every cell has a label and a value, and every value is a focusable control (4.2 acceptance (1)). (5) All cells in a row have the same height, and no value runs outside its cell. (6) Changing a value recomputes the page with no reload (4.2 acceptance (2)).

### 15.6 R-6: goal tabs as a tab bar

- **Ask.** "Final page : The tab group "less money for same AI", "More AI for same money" etc. Make it visually stand out please. It feels like background text. Moreover, "More people for same money" is greyed out. This is a mock, you can put place holder number and show the design."
- **Your answers.** Round 2: make it look like browser tabs, with the active tab joining the content below it and the inactive tabs sitting behind; keep all four enabled with placeholder figures. Round 3: 6B.
- **Requirement [REQUIREMENT].**
  - **The tab bar.** Under the kicker "What matters most to you?", four equal tabs fill the width. Each tab shows its goal's label and, under it, that goal's figure, in this form: "47% lower cost", "1.8 times the AI work", "1.6 times the people", "Up to $12K more saved".
  - **The chosen tab** has the panel's colour, a 3px accent top edge and no line under it, so it joins the result below. The edge uses `--color-accent-deep`, which the palette assigns to the chosen tab (9.10:1 on the page, checks.md) **[ASSUMPTION: the board says only "accent"]**.
  - **The other tabs** sit behind on a darker fill. The token for that fill is **[OPEN]**: the board draws it, but neither README names it.
  - **The result panel.** The hero becomes a framed panel (`--color-surface` fill, 1px edge) instead of the double rule of 14.3. Corners stay 2px.
  - **Phones.** The four tabs stay in one row, with the short labels "Less money", "More AI", "More people" and "Trade-off" on up to two lines, and the figures hidden. The old 2 × 2 phone layout goes.
  - **All four tabs are enabled.** No tab uses the disabled text colour (14.1). In the mock, when the mix has no team work, G3 shows placeholder figures labelled as placeholders beside them. The values come from one labelled constant that no `compute()` path reads; the values themselves are **[OPEN]**.
  - Hover and focus are not drawn and follow the existing 2px ink focus ring.
  - Tabs remain a `role="tablist"` with arrow-key movement (6.2).
- **Why.** "It feels like background text". The figures tell the visitor what each goal is worth before they click it.
- **Data and compute.** Every goal's figure is needed up front, so all four goals are solved before the tabs render, not only the active one. The figure each tab shows is the headline figure of that goal (6.2). G4's "Up to" figure is taken at the largest give-up **[ASSUMPTION]**. What a tab shows while its solve is running is **[OPEN]**. The G2 and G3 solves keep the worker and the 0.5 s target of 6.2.
- Selected design: 6B, mock/docs/design-v0.4/06-goal-tabs.png (round 2).
- **Acceptance.** (1) At 1280px and at 375px the four tabs share one top coordinate and have equal widths, together filling the bar's width. (2) At 1280px each tab shows its label and a figure; at 375px each shows its short label and no figure. (3) The chosen tab's top border is 3px in `--color-accent-deep`, its background equals the panel's, and it has no bottom border. Every other tab's background differs from the panel's. (4) The hero panel has a 1px border and the `--color-surface` background, and no `double` border. (5) No tab has the `disabled` attribute or `aria-disabled="true"`, and no tab's text computes to `--color-text-disabled`. (6) With AI-first startup in the mock, choosing G3 selects it, the URL holds `goal=G3`, and its figures carry a visible placeholder label. (7) Each tab's figure equals the headline figure of its goal, once every solve has finished.

### 15.7 R-7: "Compared with" moves into the headline

- **Ask.** "What is the "Compared with" dropdown doing here -- please explain"
- **What it does, in plain words.** It picks which way of buying AI today the page measures InfraVana against. Every saving, box and chart number on the page is "InfraVana against this". The default is the way a company like yours most often buys (Pay-as-you-go API in the screenshots). Picking another option makes it the baseline. InfraVana's own figure can change too, because InfraVana keeps the model mix of the option it is compared with (BD-8, 6.1). It never changes your answers.
- **Requirement [REQUIREMENT].** The comparator's name in the headline becomes the picker: a list control drawn as part of the headline text, with a caret and a 3px underline. Choosing another way to buy recomputes the page, as the old list did. The detached "Compared with" list under the headline goes. One plain line under the headline says what it means: "<comparator> is the way a company like yours most often buys AI today. Every saving on this page is measured against it; pick another way to buy in the headline to compare against that instead." The comparator's name is in bold. For best single option, the line says instead that it is the cheapest single offer that meets your quality and speed; its exact wording is **[OPEN]**.
- **Why.** The detached control had no explanation. In the headline, the baseline becomes the subject of the sentence.
- **Data and compute.** None. The behaviour of 6.1 is unchanged.
- Selected design: 7, mock/docs/design-v0.4/07-comparator.png (one drawn result; accepted with "rest are all ok", to be confirmed at freeze).
- **Acceptance.** (1) The headline contains exactly one list control, whose selected text is the comparator's label and whose bottom border is 3px. (2) No other control on the page is labelled "Compared with". (3) The line under the headline starts with the comparator's label in bold, is visible at the three test widths, and is the control's accessible description. (4) 6.1 acceptance (3), (4) and (7) pass through the headline control.

### 15.8 R-8: the contents column

- **Ask.** "The figures tab is wrapping over. This is not a good design, please move to a better design of tab overflow"
- **Requirement [REQUIREMENT].** The one-line index of 4.1 becomes a contents column.
  - **Desktop.** The column is 16rem wide, beside the stage, and stays in view while the page scrolls. It has the heading "Charts" with the count, then one ruled item per chart: a small glyph of the chart's form (bars, columns, step line, line, scatter, flow, as board 08 assigns them per chart) and the chart's title, with no number. A title may take two lines within its item.
  - **The chart in focus** has the soft accent fill and a 3px accent edge at its left.
  - **Grid view** sits as a button under the list. Opening it hides the column and gives the grid the full width (R-13).
  - **Phone.** One picker shows the current chart's title and glyph, with "Grid view" beside it in the same row. It opens the same ruled list.
  - **How many items.** It holds every chart of the registry, C1 to C10 (ten). The board lists the six unbuilt charts too; whether the build lists a chart before it is built is **[OPEN]**.
- **Why.** The one-line index wrapped. A column has room for all ten charts and never wraps across the stage.
- **Data and compute.** Every chart needs a glyph (`ChartDef` gains one).
- Selected design: 8C, mock/docs/design-v0.4/08-chart-tabs.png (round 2).
- **Acceptance.** (1) At 1280px the column's width computes to 16rem, and after scrolling the page by the stage's height the column is still in the viewport. (2) It holds one item per listed chart, each with a glyph and a title and no digit; the heading shows "Charts" and the count. (3) The item in focus has `aria-current`, the `--color-accent-soft` background and a 3px left border; no other item does. (4) Every listed chart is reachable from the column by pointer and by keyboard alone. (5) With the grid view open, the column is not displayed. (6) At 375px a single picker button and a "Grid view" button share one row, and opening the picker lists every chart. (7) At every test width the page's scroll width equals the viewport width.

### 15.9 R-9: no ordinal numbers on charts

- **Ask.** "No need to add Figure1, Figure 2, .. just the text is fine"
- **Your answer (2026-10-22).** No ordinal numbers anywhere, because the charts are independent and of equal priority: not in the figure titles, not on the index, not in the grid view.
- **Requirement [REQUIREMENT].** No chart title, contents item, phone picker, grid view tile, announcement or other copy gives a chart an ordinal or a position number. Each chart shows its title text alone. The live region of 4.1 announces the title alone; it said "Figure n of N: title" in the build. Copy that refers to a chart by number names it by its title instead, for example the G1 drawer's "the two "Saved" parts of Figure 1". The count in the contents column's heading ("Charts 10") is a count, not an ordinal, and stays. Registry ids (C1 to C10) never show on the page.
- **Why.** Your words and your answer. This reverses the "Figure n." titles of the Research Note theme and the numbered index (12.2 row 14).
- **Data and compute.** None.
- Selected design: 9, mock/docs/design-v0.4/09-titles.png (one drawn result; accepted with "rest are all ok", to be confirmed at freeze).
- **Acceptance.** (1) In every tab and on every chart, at the three test widths, no visible text and no accessible name matches "Figure" followed by a number, case-insensitive. (2) No contents item, phone picker or grid view tile has text or an accessible name that contains a digit or matches "n / N" (chart titles contain no digit). (3) Each chart's heading, contents item and grid tile title equal its registry title. (4) The live region's text equals the new chart's title after every change of chart. (5) No visible text contains a registry id.

### 15.10 R-10: "Where these numbers come from"

- **Ask.** "What is the purpose of boxes like these, "VENDOR-REPORTED · TODAY: BEST SINGLE OPTION: AWS EC2" ? They look ugly. If they serve no purpose, then lets remove them."
- **What the boxes were for.** They are the provenance badges of 14.4. Each says whether a series is vendor-reported or modelled, so nothing that was not measured can read as measured (section 9).
- **Your answer (2026-10-22).** The boxes are the data's source of truth, so the information stays, hidden the way "Fine-tune the assumptions" is hidden. The boxes and the dashed and dotted outlines go.
- **Requirement [REQUIREMENT].**
  - **Gone.** Every badge box and every dashed and dotted provenance outline, in every chart.
  - **The disclosure.** Under each chart, above the source-and-note line, a disclosure labelled "Where these numbers come from", closed by default and built the same way as "Fine-tune the assumptions". The spec calls it the Sources disclosure.
  - **The table, when open.** Four columns: "Bar or group", "Covers", "Basis" and "Source". There is one row for each thing that was a box: one per provenance and group of the chart's non-measured series.
    - **Basis** is "Vendor-reported" or "Modelled".
    - **Source, vendor-reported row.** A link labelled "Price list", to the source address held in the data, followed by "placeholder, no source yet" while that address is the invented placeholder address.
    - **Source, modelled row.** "InfraVana cost model (no external source)".
  - **Phone.** Each row becomes a stacked block: the bar or group, what it covers, the basis, then the source.
  - **No invented addresses.** No address is typed in code. Every address in the current fixtures is the placeholder `https://example.invalid/placeholder-invented-data/...`, so every vendor-reported row says "placeholder, no source yet" today.
  - Where invented rows are drawn (BD-11), they appear as modelled rows, and the visible "Source: invented placeholder data" line stays.
- **Why.** You find the boxes ugly, and you also said the information they carry is the data's source of truth.
- **Data and compute.** The data contract gains an optional source URL per series, which the series' provenance part carries to the table. It is read from the rows' `source_url` (or `run_url`) columns. An optional `source_url` column is added to `hardware.csv` and `seat_plans.csv`, the two files that feed a series and hold no address today (7.3). No compute change.
- Selected design: 10, mock/docs/design-v0.4/10-provenance.png (one drawn result; accepted with "rest are all ok", to be confirmed at freeze).
- **Acceptance.** (1) In every chart, in every tab and in both C10 views, no element has a dashed or dotted computed border style, and no chart series option sets a dashed or dotted border or line type for provenance. (2) Outside the disclosure and the "How is this worked out?" drawer, no element of a chart contains "vendor-reported" or "modelled" in any case. (3) On load every disclosure is closed. It sits between the chart canvas and the source line, and its summary text is "Where these numbers come from". (4) Opened at 1280px, it shows a table with the four column headings, and one row per provenance and group of the chart's non-measured series. (5) Every "Price list" link's address is read from a data row, and a code search finds no address literal in chart code. On the current fixtures every vendor-reported row also reads "placeholder, no source yet", and every modelled row reads "InfraVana cost model (no external source)". (6) Giving one fixture row a real `source_url` makes its link point there and drops "placeholder, no source yet", with no code change. (7) At 375px the opened disclosure shows stacked blocks and no table wider than the viewport. (8) With BD-11 rows loaded, the G4 view and the C10 speed view list the invented rows as modelled and show "Source: invented placeholder data". (9) The loader accepts `hardware.csv` and `seat_plans.csv` with and without `source_url`.

### 15.11 R-11: solid hues, no patterns, and the chart styling

- **Ask.** "The bars are hideous with the pattern fill. Can we not do a different color fill, which goes with the design language."
- **Your answers.** 2026-10-22: Today options may take distinct hues, and the charts should look colourful. Round 3: Azure.
- **Requirement [REQUIREMENT].** No bar or segment in any chart has a pattern fill or decal. Chart marks are solid fills from the Azure palette (14.1), told apart by hue and lightness and by direct labels. The chart styling rules below come from the palette README (sections 2.6 and 5) and are part of this requirement.
  - **Roles.** The comparator always takes the darkest Today colour, `--color-today-1` (wine), with a paper label inside the bar. Options 1 to 3 take `--color-today-2` to `-4` (brick, sienna, ochre) in rank order. Each keeps its colour in every chart: C1 and C5 bars, C3 bars, C10 lines and markers. InfraVana takes `--color-accent`, and saved money `--color-saved`.
  - **Labels inside a bar.** Paper where paper reaches 4.5:1 on that fill, otherwise ink.
  - **Bar thickness and gap.** In the horizontal bar charts (C1, C5) bars are 24px thick. Neighbouring segments are separated by 2px paper gaps (`--chart-separator-width: 2px`), with no outlines.
  - **Axes and labels.** The y axis rule is hidden. Only the compared pair (comparator and InfraVana) has bold row names. End labels are rich text, with the quality figure in secondary ink and the cost figure bold. The budget line is 1px in `--color-text-secondary`.
  - **One labelled saving.** In C1 the InfraVana bar shows one saving block in `--color-saved`, labelled "Saved $X". Its two sources (better price, cheaper models and hardware) appear in the tooltip and in the benefit boxes, and the row label adds "$X saved".
  - **The price chart (C3).** Every Today option is a bar on the same baseline as InfraVana, in equal bar groups per model class, not a marker. Bars are 13% of the class width, at most 44px. The chart's key shows bar swatches.
  - **The iso-cost chart (C10).**
    - Today lines are 2px. The InfraVana frontier is a 3px step line in `--color-accent-strong`.
    - Points are 6px, without a ring.
    - A 10% brand wash (`#dee6e9`) fills from the frontier down to the best Today line.
    - Each line's end label carries a colour swatch, and each line ends in its own marker at a staggered x.
  - **Phones (390px).** In the horizontal bar charts the row name sits above a full-width bar (axis labels hidden, label offset [0, -4]), and rows are 84px.
  - **Grounds.** Charts, thumbnails and the grid view sit only on `--color-bg` or `--color-surface`, never on `--color-surface-muted`. On that ground ochre falls to 2.77:1 and saved to 3.10:1.
  - **The fourth option.** The palette has four Today colours, the comparator and three options. The code allows four options besides the comparator (`MAX_OPTIONS` is 4 in `mock/src/charts/patterns.ts`), so a fifth Today bar has no colour of its own. How to resolve this is open (12.5).
  - **Several channel segments.** The boards draw the comparator and InfraVana bars of C1 with one channel segment each. How a bar with several channel segments colours them is **[OPEN]**.
- **Why.** The patterns existed only because the v0.3 palette had two distinct greys for four slots. The styling rules fix the 16 chart faults the palette review found (palette README section 5, `01-diagnosis.png`).
- **Data and compute.** None. The Today ladder and the vision gates are in `palette.py`.
- Selected design: Azure, mock/docs/design-v0.4/palette/Azure-board.png (round 3), with mock/docs/design-v0.4/11-chart-fills.png superseded by it.
- **Acceptance.** (1) In every tab and in both C10 views, no chart option has a `decal` on any series or data item, no pattern or image fill, and the chart library's automatic decal is off. (2) Across C1, C3, C5 and C10, the comparator's fill is `--color-today-1` and option k's is `--color-today-(k+1)`, identical after switching tab and after a reload. (3) C1 and C5 bar series have `barWidth` 24 at 1280px; segment separators are 2px in the paper colour; no bar has a border. (4) C1's InfraVana bar has exactly one saved segment, labelled "Saved" with its figure, and its value equals the sum of the arbitrage and routing savings. (5) In C3 every Today option and InfraVana is a bar series on one category axis; bar width is at most 44px. (6) In C10 the frontier line width is 3, Today line widths are 2, point symbol size is 6 with no border, and every line's end label contains a swatch. (7) At 390px the horizontal bar charts hide the y axis labels and draw each row name above its bar. (8) The computed background of every chart container, thumbnail and grid tile is `--color-bg` or `--color-surface`. (9) Every label drawn on a fill has 4.5:1 or more against it.

### 15.12 R-12: calm chrome, vivid charts, the Azure palette

- **Ask.** "Extending 11. The whole site, feels mono-chromatic today .. Its mostly pastel and dull. I do appreciate properly used muted color. The idea of using pastel colors is to look classy, not dead. Please work on the visual design wrt this and make the webpage attractive yet classy."
- **Your answers.** 2026-10-22: the charts are the selling data; they look muted and mushed into the background; they should be attractive, impressive and hopeful, and the chrome should stay calm and classy. Round 2: a systematic palette from colour theory, independently reviewed. Round 3: Azure (not Azure gold-first).
- **Requirement [REQUIREMENT].** The whole page takes the Azure palette of 14.1, generated by `palette.py` from the logo's hue (232°) in OKLCH. The chrome (paper, serif type, ink rules, 2px corners, no shadows) stays calm. The chart marks carry the colour, under these rules (palette README section 2):
  - **InfraVana is the most vivid mark,** by absolute OKLCH chroma: InfraVana 0.142, then brick 0.125, sienna 0.112, ochre 0.107, wine 0.107 and saved 0.099. Every other mark is capped at 0.88 × InfraVana's chroma (0.125).
  - **Chart marks out-colour the chrome.** The chrome's chroma is absolute and low: paper 0.007, ink 0.006, rules 0.012, selected tint 0.022. The section accent, the presets and the notice sit between 0.06 and 0.09, all below the least vivid chart fill (saved, 0.099). The four board 04 preset hues are described as "at chrome chroma", but their chroma is not listed (**[OPEN]**, measured when `palette.py` generates them).
  - **Chrome stays clear of the data.** The section accent, the notice and the presets are each at least 10 in CIEDE2000 from every chart fill: section 10.1, notice border 18.8, notice text 21.3 (checks.md), presets 14.6 to 20.7 (board 04).
  - **The notice amber** is generated at 90° (`#fdf3d9` fill, `#584503` text, `#695205` border), 18.8 from the nearest fill (BD-6).
  - **Vision gates.** Every two chart fills are at least 10 apart in CIEDE2000, in normal vision and under Machado deuteranopia, protanopia and tritanopia, in both the linear and the gamma sRGB conventions. The smallest values are 16.5, 11.7 [13.7], 14.3 [15.4] and 10.7 [10.1].
  - **Contrast.** 66 gated WCAG 2.x pairs with 0 failures. The lowest text pair is 4.53 (ink inside saved) and the lowest mark 3.06 (ochre on paper).
  - **Disabled text** (`#888682`, 3.31:1) is for `:disabled` controls only. No goal tab uses it.
  - **The section accent** (`#7f5a43`, clay) is chrome only, never in a chart. It is used on the step label and rule, the small kickers and the 2px rule over each chart.
  - **The selected state** is the `--color-accent-soft` tint with a 2px `--color-accent-strong` edge. Primary buttons and the chosen tab use `--color-accent-deep`.
  - **The logo** file is unchanged. The accent moves from `#466577` to `#0065b0`, which needs the brand owner's sign-off (12.5).
- **Why.** Your words and your answers. The palette README records why the hue structure is forced: a dark-to-light warm Today ladder, a blue hero and a green or teal saving are the only structure that passes the gates.
- **Data and compute.** None.
- Selected design: Azure, mock/docs/design-v0.4/palette/Azure-board.png (round 3); tokens mock/docs/design-v0.4/palette/generated/tokens.css (block `html[data-pal="AZ"]`), checks mock/docs/design-v0.4/palette/generated/checks.md (section "AZ: Azure").
- **Acceptance.** (1) 14.3 acceptance (1) passes on the 14.1 table: every token read from the page's computed styles equals its table value. (2) `python3 -I -B palette.py --check`, run in the palette folder, exits 0. (3) A test computes the absolute OKLCH chroma of every chart fill token and of every chrome token, and finds `--color-accent` the highest of the chart fills, and every chart fill above every chrome token. (4) A code search finds `--color-text-disabled` only in `:disabled` rules. (5) No element inside a chart uses `--color-section`. (6) A code search of `mock/src` finds no colour literal outside the token files.

### 15.13 R-13: balanced grids

- **Your rule (round 2).** "The grid view with an unbalanced last row is ugly; always use balanced grids." It applies to every grid in the product: the chart grid view, the intake choice lists, the answer grid, the benefit boxes, the fine-tune panel and the goal tabs.
- **Requirement [REQUIREMENT].** The balanced-grid rule of board 09, for every grid:
  1. **Every row is full.** No grid may end with a half-empty row.
  2. **Allowed columns come from the width.** At most ⌊container width ÷ the grid's minimum cell width⌋, and at least the grid's minimum.
     - Chart grid: 240px cells, 2 to 4 columns on desktop; 160px cells, 2 columns on phones.
     - Answer grid: 300px cells, so 3 columns on desktop and 1 on phones.
     - Benefit boxes: 192px cells.
     - Fine-tune panel: 260px cells.
  3. **Choose** the column count that gives the fewest rows. On a tie, choose the one that needs the fewest wide cells.
  4. **When no column count divides the item count** (5, 7, or any prime above the column range), the first k items become wide cells spanning two columns, with the smallest k that fills every row. The wide cells go to the first items in order, which are the lead items. A wide chart tile shows its thumbnail at the normal size beside the chart's one-line takeaway, so no chart is stretched.
  5. **Results for the chart grid.**
     - Desktop: 4 → 4 × 1; 5 → 3 columns with 1 wide; 6 → 3 × 2; 7 → 4 columns with 1 wide; 9 → 3 × 3; 10 → 4 columns with 2 wide.
     - Phone: even counts → 2 columns; odd counts → 2 columns with 1 wide.
  6. **One column always obeys the rule.** This covers the intake lists, which stay one-column lists (the six-row company list included), and the phone answer list.
  - **Applied (board 09, other grids).**
    - Answer grid: 6 → 3 × 2; 5 → Company wide, then 3; phone one column.
    - Benefit boxes: 2 or 3 boxes make one full row on desktop and one column on phones.
    - Fine-tune panel: 6 knob groups → 3 × 2; 5 (no customer work) → one wide knob group; phone one column.
    - Goal tabs: four equal tabs in one row at every width.
- **Why.** Your rule. Board 09 shows the chart grid for 4, 5, 6, 7, 9 and 10 charts on desktop and phone.
- **Data and compute.** None. The wide chart tile needs the chart's one-line takeaway, which is its accessible name (6.4).
- Selected design: 9, mock/docs/design-v0.4/09-grid-view.png and mock/docs/design-v0.4/09-other-grids.png (round 2; you did not object to the rule).
- **Acceptance.** For every grid in the product (chart grid view, intake lists, answer grid, benefit boxes, fine-tune panel, goal tabs), at the three test widths and for every item count the product can produce: (1) a layout test groups the cells into rows by top coordinate and finds every row's cells spanning the full grid width, with no empty track at the end of the last row; (2) the column count equals the one the rule computes from the container width, the minimum cell width and the item count; (3) wide cells are the first k items in order, with k as small as the rule allows; (4) for the chart grid at 1280px, 4, 5, 6, 7, 9 and 10 tiles give the results of rule 5, and at 375px every count gives 2 columns, with 1 wide tile for odd counts; (5) a wide chart tile's thumbnail has the same size as a normal tile's, and its takeaway text is present.

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
(6) C1 shows one unsegmented, patterned, labelled bar per grey option other than the comparator, and no pattern appears both on a comparator channel segment and on an option bar; C3 shows one marker per such option per priced class.
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

**A.7.30 14.3 Sentence (R-5).**

```text
- **Sentence:** large serif with blanks underlined in accent-strong.
```

**A.7.31 14.3 Figures (R-9, R-10).**

```text
- **Figures:** each chart is "Figure n." (italic, secondary) plus its title, with a 1px ink rule above. Each ends with a source-and-note line: "Source: InfraVana cost model on illustrative price tables. Note: all figures are invented placeholders, not quotes." The figure number matches the index number (4.1).
```

**A.7.32 14.3 Acceptance (2) and (5) (R-9, R-12).**

```text
(2) Each figure title's number equals its index number in 4.1. (3) The hero's top border computes to `3px double`. (4) No element on the page has a non-`none` box shadow. (5) Every corner radius computes to 2px or 0.
```

**A.7.33 14.4 in full, as written in v0.3 (R-10, R-11).**

```text
- **Requirement.** During the build the designer specifies, on the Research Note values, the provenance and series rules you restored: provenance badges; a dashed outline for modelled and a dotted outline for vendor-reported parts; series patterns (hatch, dots, cross-hatch) for Today slots and InfraVana segments; and solid lines only between Today series in line charts, since dash style means provenance. In C1 the designer also sets which patterns are reserved for option bars, one per option rank, kept apart from those of the comparator's channel segments (6.1).
- **Starting point.** The rules removed in commit 8e00537, in `mock/docs/design-tokens.md` as it stood before that commit (sections 3 to 3e: Today slots and patterns, InfraVana segments, perforated provenance borders, label chips, label list). Their colours and ratios were cut for the old palette, so every ratio must be re-measured on the d1 values.
- **Why it is needed here.** With two distinct greys at 1.41:1, slots 3 and 4 of 6.1 cannot be told apart by colour, so patterns are the cue, behind direct labels.
- **Acceptance.** (1) A d1 contrast table covers every new pair (pattern on fill, dashed border on fill and on page). (2) A modelled series in any chart shows its dashed outline and badge. (3) Four Today bars are distinguishable in greyscale print.
```

**A.7.34 14.5 Contrast, the d1 contrast acceptance (R-12).**

```text
- **Contrast:** every text pair passes 4.5:1 and every mark and border 3:1 on the d1 values, 0 failures across 32 pairs. Any new token is added to the table before it ships.
```

**A.7.35 4.1 table, the grid view row (R-8, R-13).**

```text
| Grid view as a "contact sheet" | The live thumbnails live here. Click one to bring it into focus and close the grid. Render only thumbnails in view and throttle redraws while a control is dragged. | Kept, now the only home of thumbnails |
```

**A.7.36 4.1 table, the headline strip row (R-6, R-7).**

```text
| Headline strip pinned above the stage | Goal tabs, hero and comparator selector stay above the stage on every chart | Kept |
```

**A.7.37 4.2 the editable sentence (R-5).**

```text
- Once the intake is answered it becomes one editable sentence ("We are a software company with 50 people ..."). Each blank is a control from 5.1 or a list. Changing a blank recomputes the page. This replaces the v0.2 locked prompt and "Understood" strip, which are kept in Appendix A.3.
```

**A.7.38 4.2 Acceptance (1) (R-5).**

```text
(1) Every blank of the sentence is a focusable control.
```

**A.7.39 4.3 Layout, the quieter compute-seller row (R-1).**

```text
and "I sell AI compute" as a quieter last row under the same rule that does not pose as a kind of buyer.
```

**A.7.40 5.1 Requirement, the narrow-track buttons (R-4).**

```text
On tracks narrower than 640px the marks become a row of 44px buttons under the slider (BD-18).
```

**A.7.41 5.1 Acceptance (5) (R-4).**

```text
(5) Below a 640px track width the marks render as 44px-high buttons in a row; at 640px and above they sit under the track at their values.
```

**A.7.42 Section 6 registry, the C1 saving segments (R-11).**

```text
The Infravana bar also marks savings from provider arbitrage separately from savings from routing.
```

**A.7.43 6.1 How each chart draws them, the C3 row (R-11).**

```text
| C3 | Grouped bars per model class, as now | A marker per model class where that option has a price; none where it has none | Bars for 6 or 7 Today options would mean 18 to 21 bars with many empty cells [F] |
```

**A.7.44 6.2 table, the G1 acceptance (R-11).**

```text
Headline = sum of C1 savings segments;
```

**A.7.45 7.2 step 3, the separate segments in C1 (R-11).**

```text
There are two sources of gain, and the UI keeps them visible as separate segments in C1:
```

**A.7.46 7.2 credibility rules, the separate segments (R-11).**

```text
The engine shows those as separate segments instead of claiming blanket hardware savings.
```

**A.7.47 Section 10, the Mobile row (R-8).**

```text
| Mobile | See 4.1: swipeable stage, collapsed index, two-column grid view, fine-tune collapsed. |
```

**A.7.48 BD-6 row values (R-12).**

```text
| BD-6 | Notice colour | Amber family (`#fff6dd`, `#6b4a00`, `#a07a1a`) for state banners only, never charts.
```

**A.7.49 BD-18 row, the designer's choices (R-1, R-3, R-4).**

```text
a ruled list of equal rows, with "I sell AI compute" as a quieter final row; a log slider with clickable preset marks plus a typed number for team size, customers and budget. The designer's own product choices, which you may overrule: budget marks one per decade; the empty step-1 estimate hidden; on narrow tracks the marks become a row of buttons.
```

**A.7.50 Section 14 intro, the d1 source (R-12).**

```text
Source of every value below: `mock/docs/theme-options/source/d1-research-note.css`; contrast figures from `mock/docs/theme-options/contrast-tables.md` (WCAG 2.x, table d1) unless marked otherwise.
```

**A.7.51 14.1 in full, the v0.3 Research Note palette (R-11, R-12).**

```text
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
| Today greys, slots 1 to 4 | `--color-today-1` to `-4` | `#2a2a28`, `#43413d`, `#43413d`, `#2a2a28` | Marks 13.08:1 and 9.26:1; labels on them 13.77:1 and 9.75:1 |
| Notices (BD-6) | notice bg / text / border | `#fff6dd` / `#6b4a00` / `#a07a1a` | Text 7.48:1; border 3.61:1 on page |

- The accent `#466577` is the logo hue deepened (hue 202°, saturation 26%); the logo-sampled `#5f7a89` of `mock/docs/design-tokens.md` is superseded for the theme, pending the brand owner (12.4).
- Greys differ from the accent in lightness: 2.32:1 (today-1) and 1.64:1 (today-2) [d1 table]. Every InfraVana series still carries a direct label.
- Only two distinct greys exist, and they are close to each other: 1.41:1 (computed for this spec with the same WCAG formula, not in the d1 table). Neighbouring Today parts therefore need separators and patterns (14.4).
```

**A.7.52 14.3 Intake, the selected option (R-12).**

```text
- **Intake:** step labels in small capitals with tracking; a 2px progress rule; options on the surface with a 1px rule, selected or hovered option in white with an accent-strong border; equal rows per BD-18.
```

**A.7.53 14.3 Hero (R-6).**

```text
- **Hero:** a double rule above, italic lead, large serif figure.
```
