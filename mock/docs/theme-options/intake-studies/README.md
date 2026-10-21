# Intake studies: company-type layout and the continuous control (Research Note theme)

**The renders show the real running app in the Research Note theme**, at desktop 1440 and phone 390. They are in `renders/`. Every number shown is an invented placeholder.

## Recommendation

| Question | Recommended | Why |
|---|---|---|
| **Company-type layout** | **A. Ruled list of equal rows** (`layout-list-*.png`) | The layout reasons are listed below. |
| **Team size, customers and budget** | **Log slider with clickable preset marks, plus a typed number** (`control-slider-*.png`) | The control reasons are listed below. |

**Why the ruled list:**
- **Every row is the same height.** Rows are laid out as one grid with equal row heights.
- **Descriptions get a full-width column**, so they wrap at most twice. In the row of five they wrap up to four times.
- **The phone layout is the same pattern**, so there is nothing to relearn.
- **It suits the Research Note look**, which is built from ruled lines.
- **"I sell AI compute" is the quieter last row** under the same rule. It is easy to find, but it does not pose as a kind of buyer.

**Why the slider:**
- **The old one-click answers survive as marks** on the scale, so one click still answers the question.
- **The slider shows size on a log scale** from 1 to 10,000.
- **The box takes an exact number.** It accepts "2500", "20M" or "$1.5m".
- **The same control works for customers and for a budget up to $100M a quarter.**

**Runner-up layout: C, the six-card grid** (`layout-grid6-*.png`). It is balanced, 3 by 2 on desktop and 2 by 3 on phone, and all cards are equal. I put it second because its sixth card is a link to a contact page, not an answer. One card that behaves differently from the other five invites mis-clicks.

## Rejected, and why

| Option | Why not |
|---|---|
| B. Equal-width row of five (`layout-row5-*.png`) | Each card is about 190px wide, so descriptions run to 4 lines. The row cannot exist on a phone; it has to fall back to the list there anyway. Choosing it means building two layouts to get the list on phones. |
| Stepper with a slider (`control-stepper-*.png`) | It drops the one-click presets. Its −/+ steps follow 1, 2, 5, 10 and so on, so getting from 50 to 5,000 takes 6 presses, and it adds two more targets per row. Typing or dragging covers what it does. |

## Decisions the user should know about

1. **Budget marks are one per decade** ($10K, $100K, $1M, $10M), not today's $50K, $100K, $200K and $500K.
   - **Why:** on a $1K to $100M log scale the old four sit about 6% apart. In the first render their labels overlapped.
   - **How old values are reached:** by typing or dragging.
   - The old marks are kept for team size, both the small-company and large-company sets, and for customers.
2. **The empty estimate panel is hidden on step 1.** It only said "Pick your company type to start." Hiding it lets every layout use the full width. It appears from step 2, as before.
3. **On phones and narrow tracks, the marks become a row of 44px buttons** under the slider. Placed at their values, they would sit 20 to 25px apart, under the 44px touch size. Marks are placed under the track only when it is at least 640px wide, which is checked with a container query.

## Accessibility, as built

| Check | How |
|---|---|
| Slider labelled | `aria-label` is the question; `aria-valuetext` reads "50 people" or "$20M a quarter" |
| Marks reachable by keyboard | Each mark is a real `<button>` in the Tab order, with `aria-pressed` on the current value, inside a group labelled "Common sizes" |
| Keyboard on the slider | 100 positions, so each arrow press moves about 10% along the log scale. PageUp/PageDown and Home/End work natively. `control-*-team-focus-desktop.png` shows the result after Tab plus 40 presses of →. |
| Focus ring | The theme's 2px ink ring with a 2px offset on the slider, number box, marks and stepper. The ring is 15.53:1 on the page. |
| Touch targets on phone | Slider hit area 44px high. Marks and stepper buttons 44 by 44. Rows and cards are far larger. |
| Reduced motion | The only motion is the thumb growing while dragged, and it is wrapped in `prefers-reduced-motion: no-preference` |
| Equal boxes | `grid-auto-rows: 1fr` in all three layouts, with long descriptions wrapping inside the box |

## Contrast of every new colour pair

**Method.** WCAG 2.x relative luminance, computed with python3 -I using only the standard library, on the theme's real values. This is the same method as `../contrast-tables.md`.

**Theme values:**

| Role | Hex |
|---|---|
| Page | `#f6f4ef` |
| Surface | `#fbfaf6` |
| Text | `#1c1c1a` |
| Secondary | `#5c5a55` |
| Border-strong | `#8a867f` |
| Accent-strong | `#3d5a6b` |
| Accent-deep | `#2f4856` |

| Pair | Fg | Bg | Ratio | Needs | Result |
|---|---|---|---|---|---|
| Slider track, filled part | `#3d5a6b` | `#f6f4ef` | 6.65 | 3:1 | PASS |
| Slider track, unfilled part | `#8a867f` | `#f6f4ef` | 3.30 | 3:1 | PASS |
| Slider thumb on page | `#2f4856` | `#f6f4ef` | 8.76 | 3:1 | PASS |
| Thumb ring against thumb | `#fbfaf6` | `#2f4856` | 9.21 | 3:1 | PASS |
| Tick marks | `#1c1c1a` | `#f6f4ef` | 15.53 | 3:1 | PASS |
| Mark label / typed number | `#1c1c1a` | `#f6f4ef` | 15.53 | 4.5:1 | PASS |
| Mark and stepper border | `#8a867f` | `#f6f4ef` | 3.30 | 3:1 | PASS |
| Selected mark label on ink | `#fbfaf6` | `#1c1c1a` | 16.34 | 4.5:1 | PASS |
| Unit word, end labels, row arrow | `#5c5a55` | `#f6f4ef` | 6.27 | 4.5:1 | PASS |
| Number underline | `#3d5a6b` | `#f6f4ef` | 6.65 | 3:1 | PASS |
| Stepper icon on its surface | `#1c1c1a` | `#fbfaf6` | 16.34 | 3:1 | PASS |
| List row hover bar on white | `#3d5a6b` | `#ffffff` | 7.31 | 3:1 | PASS |
| Focus ring | `#1c1c1a` | `#f6f4ef` | 15.53 | 3:1 | PASS |
| Row and card rules (decorative; each option is named by its text) | `#d6d1c7` | `#f6f4ef` | 1.38 | n/a | exempt |

## Renders

**Company step, one layout per pair:**
- `layout-list-desktop.png`, `layout-list-phone.png`, `layout-list-phone-full.png`
- `layout-row5-…`
- `layout-grid6-…`

**Controls.** For `slider` and `stepper` each:

| Render | Shows |
|---|---|
| `control-<v>-team-desktop.png` | Team size, small-company presets 25, 50, 100, 500 |
| `control-<v>-team-enterprise-desktop.png` | Large-company presets 100, 500, 1,000, 5,000 |
| `control-<v>-team-focus-desktop.png` | Keyboard focus on the slider |
| `control-<v>-team-phone.png` | Team size on phone |
| `control-<v>-budget-desktop.png`, `control-<v>-budget-phone.png` | Budget typed as $20M, on the $1K to $100M scale |

## Reproducing

**The files in `source/` are a patch on the current `mock/`.**

| File | What it is |
|---|---|
| `ContinuousControl.tsx` | The control, both variants, chosen by a `variant` prop |
| `intake-study.css` | All styles, scoped to `[data-theme="d1"]`. It sits on top of `../source/d1-research-note.css` and `../source/shared.css`. |
| `Intake.tsx.patch` | Swaps the team, customers and budget choices for the control, adds Continue to those steps, adds the layout classes and the sixth card, and tags the step on the section |
| `main.tsx.patch` | The theme loader from the theme boards, plus the import of `intake-study.css`. It imports `./themes/*.css`, so first copy `../source/shared.css` and `../source/d*.css` into `mock/src/themes/`, and copy `ContinuousControl.tsx` and `intake-study.css` into `mock/src/intake-study/`. Both patches pass `git apply --check` against the current tree. |
| `capture-intake.mjs` | The playwright-core script that made the renders |

**Study switches, in the scratch copy only:**
- `?theme=d1&layout=list|row5|grid6&control=slider|stepper`
- A build should hard-wire the recommended pair and drop the switches.

**Scope.** Nothing outside this folder in the repo was changed by this study.
