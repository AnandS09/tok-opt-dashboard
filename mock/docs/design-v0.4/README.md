# Design v0.4: pictures of the twelve style asks

**Open one board per ask, then reply with codes such as `4B 5A 6A 8A 12A`.** Every picture is the real running app, built in a scratch copy with the proposed change switched on: real ECharts charts, real colour tokens, the app's own numbers. Where a state does not exist in the app yet, it was faked with a small markup or CSS change, and the board says "Design proposal". Today's app is in `before/`. Nothing in `mock/src`, `mock/public` or `spec.md` was changed.

All figures are invented placeholders, not quotes.

## The twelve asks, in your order

| Ask | Board | What we propose | Options | Recommended |
|---|---|---|---|---|
| 1. "I sell AI compute" has no icon | [`01-provider-icon.png`](01-provider-icon.png) | A server-rack icon, a bold label and a hint line, like the other five rows | one fix | **1** |
| 2. "Step 1", not "Step X of 5" | [`02-step-label.png`](02-step-label.png) | "Step 1", "Step 2" ... with no total. The progress rule already shows 1/6 on step 1 | one fix | **2** |
| 3. Estimate before any numbers | [`03-estimate.png`](03-estimate.png) | No panel on steps 2 to 4. It first appears on the budget step, with figures from your typed answers and one line saying what they are worked out from | one fix | **3** |
| 4. Crowded customer presets | [`04-customers.png`](04-customers.png) | A: short ruler labels. B: a labelled row of equal buttons above the slider. C: a ruled list plus a typed row | 4A, 4B, 4C | **4B** |
| 5. Ugly fill-in-the-blanks | [`05-sentence.png`](05-sentence.png) | A: a refined sentence with tinted, content-sized blanks. B: a 3 by 2 answer grid. C: a quiet summary with an "Edit answers" button | 5A, 5B, 5C | **5A** |
| 6. Goal tabs feel like background | [`06-goal-tabs.png`](06-goal-tabs.png) | All four tabs enabled; G3 drawn with placeholder numbers. A: goal cards, each with a figure. B: large serif tabs. C: a segmented switch | 6A, 6B, 6C | **6A** |
| 7. What is "Compared with"? | [`07-comparator.png`](07-comparator.png) | The comparator's name in the headline becomes the picker, with one plain line explaining it (see below) | one change | **7** |
| 8. Chart tabs wrap | [`08-chart-tabs.png`](08-chart-tabs.png) | Drawn with 9 charts. A: one row plus "More charts". B: one picker on every width. C: a contents column | 8A, 8B, 8C | **8A** |
| 9. No "Figure 1." | [`09-titles.png`](09-titles.png) | No ordinal numbers anywhere: titles, tabs, phone picker, grid view | one fix | **9** |
| 10. Provenance boxes | [`10-provenance.png`](10-provenance.png) | The boxes and the dashed and dotted outlines go. A closed "Where these numbers come from" opens to a table, one row per former box, with source links | one fix | **10** |
| 11. Patterned bars | [`11-chart-fills.png`](11-chart-fills.png) | Solid colour fills, one hue per Today option, in colour and greyscale | 11A, 11B, 11C (same as 12) | **A** |
| 12. Mono-chromatic site | [`12-palettes.png`](12-palettes.png), with detail boards [`12A-detail.png`](12A-detail.png), [`12B-detail.png`](12B-detail.png), [`12C-detail.png`](12C-detail.png) | Calm chrome with vivid charts, in three palettes: A Daybreak, B Jewel, C Spotlight | 12A, 12B, 12C | **12A** |

Every "after" picture also includes the plain fixes 1, 2, 3, 9 and 10, so the boards agree with each other. The palette boards also include the recommended 4B, 5A, 6A, 7 and 8A.

## Notes per ask

**1. Provider icon.** The hint text is new copy: "Cloud or GPU provider: talk to us about selling through InfraVana". Please check the wording.

**2. Step label.** This follows your answer: keep "Step n" and drop the total. The rule is 3px and is filled to step ÷ steps. Before a company type is chosen, it is filled to 1/6, one step of the longest path.

**3. Estimate.** Today the panel is computed from the example the intake starts from ($100K, 50 people), not from the visitor. Proposed:
- It appears once team size and customers are answered, on the budget step.
- Its line reads, for example: "Worked out from your answers: 120 people, 200,000 customers, 5 kinds of work, at typical use per person and per customer."
- Speed uses the default until step 6.

**4. Customers.** I recommend 4B because it works the same at every width and for any number of presets. What you give up: a preset no longer sits under its own point on the slider. The track keeps small ticks at those points.

**5. Sentence.** I recommend 5A because it keeps the sentence voice and fixes what makes it look ugly:
- The blanks were sized wrongly.
- The work list ran two lines under one long underline.
- A comma started a line.

What you give up: the full work list is now behind one click ("and 3 more").

**6. Goal tabs.** I recommend 6A because each tab shows what that goal is worth before the visitor clicks it. What you give up:
- About 90px of height.
- All four goals must be solved up front. In this proposal the G2 to G4 figures are placeholders, and so are the G3 hero numbers (1.6 times, 80 against 50). Both are labelled as placeholders.

**7. What "Compared with" does.** It picks which way of buying AI today the page measures InfraVana against. Every saving, box and chart number is "InfraVana against this". The default is the typical way for your stage (here Pay-as-you-go API). Folding it into the headline makes the baseline the subject of the sentence. Changing it there recomputes the page, as the old select did.

**8. Chart tabs.** The five planned charts are added to the index only (C2, C4, C6, C8, C9), so that nine items are drawn. I recommend 8A because it keeps the chart at full width, keeps the common charts one click away, and never wraps. What you give up: which titles stay visible depends on the screen width.

**9. Numbers.** No ordinal numbers appear anywhere, following your answer. Spec 4.1's clause that "index numbers match the Figure n. titles" has to go. Spec 14.3's "Figure n." pattern changes to "title only".

**10. Provenance.**
- The open table has four columns: bar or group, what it covers, vendor-reported or modelled, and source.
- The data files carry source addresses only as placeholders (`https://example.invalid/placeholder-invented-data/...`), so each link is labelled "placeholder, no source yet". No URL is invented.
- Spec change: the data contract gains an optional source URL per series, and the provenance part carries it to the table.

**11 and 12. Colour.** See the next section.

## Palettes (asks 11 and 12)

**The chrome stays calm, and the chart marks carry the colour.** The chrome is the paper, the serif type, the ink rules, 2px corners and no shadows. The marks are the most vivid things on the page. The logo is unedited. In all three palettes the InfraVana blue is the logo's steel-blue hue (about 200°) made more saturated, so the brand stays fixed. The palettes differ in Today, savings, paper and the section accent.

**Roles:**
- **InfraVana:** the fill for "With InfraVana", plus its darker text shade.
- **Saved money:** a solid fill with ink labels and a dark green edge, plus a text shade for the saving figures.
- **Today:** the comparator, darkest, with labels inside the bar. Then options 1 to 3, each a solid hue, always with direct labels.
- **Section accent:** chrome only, never in a chart. It is used on the step label and rule, the small kickers and the 2px rule over the chart.
- **Selected state:** a soft accent fill with an accent-strong edge. Primary buttons and the chosen tab use the deep accent.

| Role | Today (v0.3) | 12A Daybreak | 12B Jewel | 12C Spotlight |
|---|---|---|---|---|
| Page / surface | `#f6f4ef` / `#fbfaf6` | `#f6f4ef` / `#fbfaf6` | `#f3f4f2` / `#fafbfa` | `#fafaf8` / `#ffffff` |
| Text / secondary | `#1c1c1a` / `#5c5a55` | `#1c1c1a` / `#5c5a55` | `#1a1c1e` / `#565b5f` | `#1d1d1f` / `#5b5b5b` |
| InfraVana fill / text | `#466577` / `#3d5a6b` | `#21678e` / `#1d587a` | `#14698d` / `#115877` | `#13659c` / `#105785` |
| Saved fill / figure | `#dcebe5` / `#1f6b5e` | `#2d9a72` / `#12664a` | `#1b9b81` / `#0e6553` | `#279c61` / `#12673f` |
| Today comparator | `#2a2a28` | `#642640` plum | `#472f6e` aubergine | `#393c42` graphite |
| Today option 1 | `#43413d` + pattern | `#8e3021` brick | `#8b2867` berry | `#67484f` dusty mauve |
| Today option 2 | `#2a2a28` + pattern | `#bf581b` ember | `#d24058` rose-red | `#9d695c` clay |
| Today option 3 | `#43413d` + pattern | `#b9810f` saffron | `#a977cb` lavender | `#9c8b57` sand |
| Section accent | (none) | `#9a422d` clay | `#674a99` violet | `#105785` blue |
| Selected / button | `#e8ebea` / `#2f4856` | `#dfe9ee` / `#184661` | `#dde9ef` / `#11485f` | `#dde9f1` / `#124668` |

**Contrast, computed from these hex values (WCAG 2.x relative luminance, python3 -I):**
- Each palette has 31 pairs: 18 text pairs and 13 mark and border pairs. There are 0 failures in A, B and C.
- Lowest text pair: A 4.86, B 4.93, C 4.82 (the ink label inside a savings bar).
- Lowest mark: A 3.08, B 3.08, C 3.22 (the lightest Today option against the page).
- Every pair is listed in the detail boards.
- I rebuilt the scratch copy and checked every hex in the compiled CSS. The minifier writes 12C's `#ffffff` as `#fff`.
- Today's v0.3 hollow savings fill is 1.12:1 against the page and relies on its outline. That value is inherited, and the proposal replaces it.

**Greyscale.** The six bar fills are spaced in lightness. Neighbouring steps are 1.29:1 or more in all three palettes. The one exception is that Saved and option 3 share a grey. They never meet: Saved sits only in the InfraVana row and always carries its dark green edge.

**Character, and my reasoning:**
- **12A Daybreak (recommended).** Plum, brick, ember and saffron for Today, the vivid logo blue for InfraVana, fresh green for savings, on the warm paper. It fits your brief best: warm, hopeful and colourful charts in a calm research-note page. The warm Today bars against the cool InfraVana blue also tell the story by temperature. *What you give up:* Today's bars compete with InfraVana for attention more than in C.
- **12B Jewel.** Aubergine, berry, rose-red and lavender, with emerald savings, on a cooler paper and with a violet section accent. It is the most striking and the most "premium tech" of the three. *What you give up:* warmth. It is cooler and more formal than the hopeful register you asked for, and the pinks and violets are the most likely to look over-designed.
- **12C Spotlight.** Dusty Today hues on near-white paper (close to infravana.ai's `#fafafa`), with only InfraVana and savings vivid. The eye goes straight to the answer, and it is the easiest to keep classy. *What you give up:* the charts are the least colourful overall, which is close to the "muted and mushed" look you described.

**One rule changes in every palette.** The Today options are told apart by hue and lightness plus direct labels, not by patterns. Each option keeps one colour in every chart (C1, C5, C3 markers, C10 lines). The comparator, chosen in the headline, always takes the darkest colour.

## How it was made

- **Scratch copy.** `mock/` was copied without `node_modules`, with `node_modules` symlinked from the repo. It ran under Vite on 127.0.0.1:5210, with its cache outside the repo. `playwright-core` was installed in a sibling tools folder and drove the installed Chrome headless at 1280 and 390 wide, at 2x.
- **Switches.** Proposals are switched on by `?pal=A|B|C&a1&a2&a3&a4=A|B|C&a5=…&a6=…&a7&a8=…&a9&a10`, read by one scratch module that sets data attributes on `<html>`. The palettes are token overrides, and patterns and provenance dashes are off. Boards are HTML pages laid out from the captures.
- **Review.** I looked at every picture and fixed anything clipped, cramped or wrapped before composing the boards:
  - truncated cells in 5B
  - an orphan comma in 5A
  - wrapping tabs in 8A
  - an oversized button in 8B on phone
  - dashed lines left in C10
  - cramped provenance-table columns
- **Before pictures.** They are in `before/`, captured from the same scratch copy with no switches, which is the same code as the app.

## Decisions you need to make

1. **4:** 4A, 4B or 4C (I recommend 4B).
2. **5:** 5A, 5B or 5C (I recommend 5A).
3. **6:** 6A, 6B or 6C (I recommend 6A). If you choose 6A, the page must solve all four goals up front to show the figures on the cards. That is a compute and performance decision for the build.
4. **8:** 8A, 8B or 8C (I recommend 8A).
5. **11 and 12:** 12A, 12B or 12C (I recommend 12A). One choice covers both asks.
6. **1:** approve the new hint copy for the provider row.
7. **3:** confirm that the estimate first appears on the budget step and not earlier. The line under it is new copy.
8. **7:** confirm that the select under the headline goes away and the explanation line replaces it (new copy).
9. **10:** confirm that the dashed and dotted outlines go along with the boxes, and that the data contract gains an optional source URL per series.
10. **9:** confirm the spec edits to 4.1 and 14.3 (no ordinals; the screen-reader announcement also drops "Figure n of N").
11. **Spec 14.1 and 14.4 replaced:** the colours, the "two greys plus patterns" rule and the provenance perimeters become the chosen palette and the "hue plus label" rule. The accent changes from `#466577` to the chosen palette's blue, which is a brand-owner sign-off (spec 12.4).
12. **A fifth Today bar:** when there are four other options besides the comparator, option 4 reuses option 1's colour. Either accept that, or limit the Today bars to four in total, which is the default you already set.

## What I could not draw

- **Real solves.** The G2, G3 and G4 figures on the 6A cards and the G3 hero numbers are placeholders, because the mock does not solve every goal at once. G3 is enabled by a scratch switch.
- **The five planned charts.** They exist only as entries in the 8A, 8B and 8C index pictures. Selecting one does nothing.
- **Unwired controls.** 5C's "Edit answers" button and 10's "Price list" links are drawn but not wired; the links point at the data's placeholder address.
- **Some states.** Hover, focus and keyboard states of the new controls are not drawn. They follow the existing 2px ink focus ring. The 8A "More charts" menu with a chart from inside it chosen is not drawn.
- **Other scenarios.** A C1 with four other Today options (the rank-4 colour repeat) is not drawn, because the default scenario has three. Phone-width pictures of the C5, C3 and C10 charts in each palette are not drawn; the phone full-page captures in the detail boards show C1 only.
