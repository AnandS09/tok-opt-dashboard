# Design tokens: InfraVana AI Budget Playground (Research Note theme)

**Status:** the Research Note theme, which the user chose on 2026-10-21 (spec 14). Light mode only (spec 14, [ASSUMPTION]).
**Source of every colour, font and radius below:** `mock/docs/theme-options/source/d1-research-note.css`, merged over the base `mock/src/styles/tokens.css`.
**Contrast:** WCAG 2.x, the d1 table in `mock/docs/theme-options/contrast-tables.md`, plus the chart pairs in 3.7.
**Logo:** `mock/public/logo.jpeg`, unedited. It is the live site's file (929,678 bytes, sha256 `975b5f52…cd21c44`).

## 1. Palette

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#f6f4ef` | Warm paper: the page and every chart ground (figures sit on the paper, not in cards) |
| `--color-bg-top` | `#f6f4ef` | Equal to `--color-bg`, so the base gradient is flat |
| `--color-surface` | `#fbfaf6` | Inputs, option rows, drawer; pattern, provenance dash and label-chip text colour on fills (3) |
| `--color-surface-muted` | `#eeebe3` | Muted panels, table headers |
| `--color-skeleton` | `#e6e2d8` | Loading blocks |
| `--color-text` | `#1c1c1a` | Body text, rules above sections, focus ring, links (always underlined), budget line |
| `--color-text-secondary` | `#5c5a55` | Captions, axis ticks, "Figure n.", source lines |
| `--color-text-disabled` | `#8a867f` | Disabled controls (exempt) |
| `--color-border` | `#d6d1c7` | Decorative rules |
| `--color-border-strong` | `#8a867f` | Input, chip and badge borders; axis lines |
| `--color-grid` | `#e4e0d7` | Horizontal gridlines only |
| **`--color-accent`** | **`#466577`** | "With InfraVana" fills and thick lines. The logo hue deepened (202°, 26%). It supersedes the sampled `#5f7a89`, pending the brand owner (spec 12.4). |
| `--color-accent-strong` | `#3d5a6b` | "With InfraVana" text, lines 2px or thinner, markers |
| `--color-accent-deep` / `--color-accent-hover` | `#2f4856` / `#233843` | Primary button and its hover |
| `--color-accent-soft` / `--color-hero-end` | `#e8ebea` | Selected option background |
| `--color-positive` / `--color-saved` | `#1f6b5e` / `#dcebe5` | Saved money only: hero figure; C1 savings outline, pattern and fill |
| `--color-today-1` / `-4` | `#2a2a28` | Today grey T1 |
| `--color-today-2` / `-3` | `#43413d` | Today grey T2. There are only two distinct greys, 1.41:1 apart, so patterns carry the difference (3). |
| `--color-chart-ground` | `var(--color-bg)` | What a chart is drawn on: the paper behind marks, under label chips and in the gaps of a dashed outline |
| `--color-series-separator` | `var(--color-chart-ground)` | 1px stroke between stacked segments, so the paper shows between them |
| `--color-budget-line` | `var(--color-text)` | C1 budget line, **solid** |
| `--color-pattern-on-fill` | `var(--color-surface)` | **New.** Pattern colour on every grey and accent fill |
| `--color-pattern-on-saved` | `var(--color-positive)` | **New.** Pattern colour on the hollow savings segments |
| `--color-provenance-on-fill` / `-on-hollow` | `var(--color-surface)` / `var(--color-positive)` | **New.** Dashed and dotted perimeters (3.3) |
| `--color-scrim` | `color-mix(in srgb, var(--color-text) 50%, transparent)` | Drawer backdrop |
| `--color-notice-bg` / `-text` / `-border` | `#fff6dd` / `#6b4a00` / `#a07a1a` | Amber notices (BD-6) and the "Invented placeholder" badge (3.4) |

**Delta colours.** Positive teal marks saved money only. There is no red: a cost that went up is shown in plain text.

## 2. Contrast (WCAG 2.x AA)

**Method.** I linearised each sRGB channel, took L = 0.2126R + 0.7152G + 0.0722B, and computed the ratio as (L1 + 0.05) / (L2 + 0.05). Ratios come from python3 -I with the standard library, run on the exact values in section 1.

**Thresholds.** Text needs 4.5:1. Large text, chart marks and borders need 3:1.

**Result.** 0 failures. The d1 table covers 32 page pairs. The chart pairs are in 3.7.

| Pair | Ratio |
|---|---|
| Body text on page / surface | 15.53 / 16.34 |
| Secondary text on page / surface / muted | 6.27 / 6.60 / 5.78 (the lowest text pair) |
| Accent-strong text on page / surface | 6.65 / 7.00 |
| Primary button label | 9.21 |
| Border-strong on page / surface | 3.30 / 3.47 (the lowest border pair) |
| Notice text / notice border on page | 7.48 / 3.61 |
| Focus ring on page | 15.53 |
| Rules `#d6d1c7` on page | 1.38 (decorative, exempt) |

## 3. Chart series, patterns and provenance marks

Spec 9 and 14.4 restore these rules. The base is the pre-8e00537 rules, re-measured on the Research Note values.

**The principle: patterns sit inside a fill, and provenance sits on its perimeter.** Neither replaces the direct label. Line style means provenance, so Today line series are always solid.

**The rendered sheet** is in `mock/docs/theme-options/patterns/`:
- PNGs in colour and in greyscale, at 1440 and 390 wide;
- `pattern-sheet.html`, which draws them with the real ECharts in `mock/node_modules`;
- `render.mjs`, which renders them.

### 3.1 Pattern table

These are ECharts `itemStyle.decal` objects. In every row, `symbolSize` is relative to the tile and the pattern colour is `--color-pattern-on-fill`, except on the savings segments, which use `--color-pattern-on-saved`.

| Id | Name | `symbol` | `symbolSize` | `dashArrayX` | `dashArrayY` | `rotation` | Set |
|---|---|---|---|---|---|---|---|
| P1 | Solid | none | — | — | — | — | Channel |
| P2 | Hatch | `rect` | 1 | `[[1, 0]]` | `[2, 5]` | −π/4 | Channel |
| P3 | Dots | `circle` | 0.7 | `[[6, 6], [0, 6, 6, 0]]` | `[5, 0]` | 0 | Channel |
| P4 | Cross-hatch | `rect` | 1 | `[[1, 0], [1, 6]]` | `[1, 0, 6, 0]` | π/4 | Channel |
| P5 | Fine lines | `rect` | 1 | `[[1, 0]]` | `[1, 4]` | 0 | Channel (spare) |
| P6 | Vertical bars | `rect` | 1 | `[[1, 0]]` | `[3, 7]` | π/2 | **Option only** |
| P7 | Square grid | `rect` | 1 | `[[1, 0], [1, 9]]` | `[1, 0, 9, 0]` | 0 | **Option only** |
| P8 | Triangles | `triangle` | 0.9 | `[[10, 10], [0, 10, 10, 0]]` | `[10, 0]` | 0 | **Option only** |
| P9 | Diamonds | `diamond` | 0.9 | `[[10, 6]]` | `[10, 0]` | 0 | **Option only** |
| P10 | Wide bands | `rect` | 1 | `[[1, 0]]` | `[6, 6]` | π/4 | Spare, unassigned |

- **Two disjoint sets.** The channel set (P1 to P5) and the option set (P6 to P9) share no pattern, so spec 6.1 acceptance (6) holds by construction. This closes F-review-spec-003-1.
- **Greyscale.** Each of the ten differs by geometry (orientation, line weight or shape), not by colour, on both greys and on the accent. See the `-greyscale` PNGs.

### 3.2 Assignment rules

**Today greys.** There are only two values: T1 `#2a2a28` and T2 `#43413d`. They always alternate between neighbours, and every neighbour pair is split by the 1px separator.

**C1, the comparator Today bar.** Up to five channel segments:

| Segment | Fill | Pattern |
|---|---|---|
| 1 | T1 | P1 |
| 2 | T2 | P1 |
| 3 | T1 | P2 |
| 4 | T2 | P3 |
| 5 ("Other" when six or more fold) | T1 | P4 |

**C1, the option bars.** Each grey option other than the comparator is one unsegmented bar. Its pattern follows its option rank, counted 1 to 4 over the non-comparator greys in popularity order:

| Option rank | Fill | Pattern |
|---|---|---|
| 1 | T2 | P6 |
| 2 | T1 | P7 |
| 3 | T2 | P8 |
| 4 | T1 | P9 |

The bar carries its direct label and its quality score ("quality 91 · $99K") to its right.

**C1, the With InfraVana bar.**
- **Spend segments** are all `--color-accent`, with patterns P1, P2, P3, then P4 for "Other". The accent and accent-strong are 1.18:1 apart, so they do not alternate.
- **Savings segments** are hollow: a `--color-saved` fill with a 1.5px `--color-positive` outline, then P2 for "Saved: better price" (arbitrage) and P3 for "Saved: routing", both in `--color-positive`. Spend comes first, then arbitrage, then routing.

**C5.** One bar per option:
- The comparator is T1 with P1.
- Each other option uses the fill and pattern of its option rank (as above).
- InfraVana is the accent with P1.

**C3.** The comparator and InfraVana are grouped bars, T1 and the accent, both P1. Each other option is a marker per priced class, placed to the right of the pair:

| Option rank | Marker | Fill |
|---|---|---|
| 1 | `circle` | T2 |
| 2 | `rect` | T1 |
| 3 | `triangle` | T2 |
| 4 | `diamond` | T1 |

Markers are 12px with a 1.5px `--color-surface` stroke. There is no marker where the option has no price.

**C10.**
- **Today options** are solid 1.5px reference lines in their rank's grey. Each ends in its rank's marker (10px) with a direct end label. The comparator's marker is a circle.
- **InfraVana** is the step line in `--color-accent-strong`, 2px. It is dashed or dotted only when its points are modelled or vendor-reported (3.3).

**One option, one identity.** An option keeps the same rank pattern and marker in every chart, while the comparator stays the same.

### 3.3 Provenance outlines

| Provenance | Filled bar or segment | Hollow savings | Lines |
|---|---|---|---|
| Measured | 1px `--color-series-separator`, solid | 1.5px `--color-positive`, solid | Solid |
| **Modelled** | 2px `--color-provenance-on-fill`, dash `--chart-dash-modelled` (6 3) | 1.5px `--color-provenance-on-hollow`, dash 6 3 | Dashed 6 3 |
| **Vendor-reported** | 2px `--color-provenance-on-fill`, dash `--chart-dash-vendor` (2 3) | 1.5px `--color-provenance-on-hollow`, dash 2 3 | Dotted 2 3 |

**How the outline reads.** The light dashes read against the fill. Along the outer edge, the fill showing through the gaps reads against the paper. So the edge looks perforated (ratios in 3.7).

**ECharts.** Set `itemStyle.borderType` to the dash array, plus `borderWidth` and `borderColor`, per data item. The decal is unaffected.

**Small segments.** Under about 27px wide, the badge and the tooltip carry the provenance.

### 3.4 Badges

These sit under the chart, before the source line. They are uppercase, `--font-size-xs`, weight 600, with letter-spacing 0.04em, a 2px radius and a minimum height of 24px. Each names the series and part it applies to.

| Badge | Border | Text and fill | Ratios |
|---|---|---|---|
| Measured (a link to the run) | 1px solid `--color-text` | `--color-text` on transparent, underlined link | 15.53 |
| Modelled | 1px **dashed** `--color-border-strong` | `--color-text` | border 3.30, text 15.53 |
| Vendor-reported | 2px **dotted** `--color-border-strong` | `--color-text` | border 3.30, text 15.53 |
| Invented placeholder (BD-11) | 1px `--color-notice-border` | `--color-notice-text` on `--color-notice-bg` | border 3.61 on page, text 7.48 |

### 3.5 Source line

Every figure ends with a source line, under the canvas and the badges:
- **Rule:** a 1px `--color-border` rule above, with `--space-2` above and below it.
- **Type:** `--font-size-xs`, in `--color-text-secondary` (6.27:1).
- **Labels:** "Source:" and "Note:" are set in weight 600, in `--color-text` (15.53:1).

| Chart | Text |
|---|---|
| Default | "Source: InfraVana cost model on illustrative price tables. Note: all figures are invented placeholders, not quotes." |
| Any chart that uses BD-11 rows | "Source: invented placeholder data." |

### 3.6 Labels and the budget line

- **Labels inside a patterned segment** sit on a small chip of the segment's own solid fill: padding 2px 4px, 2px radius, `--font-size-xs`, weight 600. The text never crosses a pattern.
- **Label colours:** `--color-surface` on grey and accent, `--color-text` on saved.
- **On narrow charts (under 600px wide)**, segment labels are hidden. Names stay in the tooltip and the screen-reader table.
- **The budget line** is now **solid** 1.5px `--color-budget-line`, drawn under the bars. Dashes are reserved for provenance, which changes the built dashed line. It is labelled "Budget $X" in `--color-text-secondary`.

### 3.7 Chart contrast (Research Note values)

**Patterns and fills:**

| Pair | Ratio | Needs |
|---|---|---|
| Pattern `#fbfaf6` on T1 / T2 | 13.77 / 9.75 | 3:1 |
| Pattern `#fbfaf6` on accent `#466577` | 5.93 | 3:1 |
| Savings pattern and outline `#1f6b5e` on saved `#dcebe5` | 5.13 | 3:1 |
| T1 / T2 / accent / accent-strong on page | 13.08 / 9.26 / 5.64 / 6.65 | 3:1 |
| Savings outline `#1f6b5e` on page | 5.75 | 3:1 |
| Saved fill `#dcebe5` on page | 1.12 | none alone; the outline is never dropped |

**Neighbours:**

| Pair | Ratio | Needs |
|---|---|---|
| T1 vs T2 | 1.41 | none; split by the separator and the pattern |
| Separator (the paper `#f6f4ef`) on T1 / T2 / accent | 13.08 / 9.26 / 5.64 | 3:1 |
| Saved fill vs neighbouring accent segment | 5.03 | 3:1 |

**Perimeters, labels and lines:**

| Pair | Ratio | Needs |
|---|---|---|
| Provenance dash `#fbfaf6` on T1 / T2 / accent | 13.77 / 9.75 / 5.93 | 3:1 |
| Fill showing through the gaps, on page | 13.08 / 9.26 / 5.64 | 3:1 |
| Provenance dash `#1f6b5e` on saved / page | 5.13 / 5.75 | 3:1 |
| Label chip text (`--color-surface` `#fbfaf6`) on T1 / T2 / accent; `--color-text` on saved | 13.77 / 9.75 / 5.93 / 13.86 | 4.5:1 |
| Markers T1 / T2 on page | 13.08 / 9.26 | 3:1 |
| C10 lines: T1 / T2 / accent-strong on page | 13.08 / 9.26 / 6.65 | 3:1 |
| Budget line `#1c1c1a` on page | 15.53 | 3:1 |

**Accent vs greys.** The accent is 2.32:1 against T1 and 1.64:1 against T2. Every InfraVana series carries the direct label "With InfraVana" (spec 6).

## 4. Type

| Token | Value | Use |
|---|---|---|
| `--font-display` | `"Newsreader", Georgia, serif` | Headings, figure titles, estimate and hero figures, at weight 500. Serif only at 1.1rem and above (spec 14.2). |
| `--font-sans` | `"Hanken Grotesk", Arial, sans-serif` | Body, UI and every chart text |
| `--font-numeric` | `tabular-nums lining-nums` | All figures |
| `--font-size-xs` / `-sm` | 0.75rem / 0.875rem | Chart text uses only these two: xs for ticks, badges, source lines and chips; sm for category and data labels |
| `--font-size-md` / `-lg` / `-xl` / `-2xl` / `-display` | 1 / 1.125 / 1.5 / 2 / 2.4rem | Body to display |
| `--font-weight-regular` / `-bold` | 400 / 700 | |
| `--line-height-tight` / `-body` | 1.2 / 1.5 | |

Both fonts are self-hosted in the repo (BD-16, spec 14.2).

## 5. Space, radii, shadow, motion, focus

| Group | Tokens |
|---|---|
| Spacing | `--space-1` to `-8`: 4, 8, 12, 16, 24, 32, 48, 64px |
| Chart strokes | Separator 1px, savings outline 1.5px, budget line 1.5px (solid). **New:** `--chart-provenance-width` 2px, `--chart-dash-modelled` 6 3, `--chart-dash-vendor` 2 3 |
| Chart size | `--chart-stage-height` 320px |
| Radii | `--radius-sm`, `-md`, `-lg`, `-pill`: all 2px (spec 14.3) |
| Shadow | `--shadow-card`: none. `--shadow-stage`: a 1px `#d6d1c7` ring only. No box shadows on the page (spec 14.3). |
| Motion | `--duration-fade` 180ms, set to 0 under `prefers-reduced-motion` |
| Scrim | 50%: the drawer panel edge is 3:1 or better |
| Focus | 2px `--color-text` with a 2px offset; 15.53:1 |

## 6. Implementation notes

- **Chart colours come from these variables at draw time** (`getComputedStyle`), never as copied hex. Dash arrays are strings ("6 3") split into numbers.
- **Decals.** ECharts draws them in both renderers. The sheet in `theme-options/patterns/` was drawn with the SVG renderer.
- **Logo.** It sits directly on the paper, with no plate (spec 14.3).

## 7. Ready-to-paste CSS (for `mock/src/styles/tokens.css`)

```css
:root {
  /* Surfaces: warm paper (Research Note) */
  --color-bg: #f6f4ef;
  --color-bg-top: #f6f4ef;          /* equal to bg: no page gradient */
  --color-surface: #fbfaf6;
  --color-surface-muted: #eeebe3;
  --color-skeleton: #e6e2d8;

  /* Text */
  --color-text: #1c1c1a;
  --color-text-secondary: #5c5a55;
  --color-text-disabled: #8a867f;

  /* Lines */
  --color-border: #d6d1c7;          /* decorative rules */
  --color-border-strong: #8a867f;   /* inputs, chips, badges, axis lines: >=3:1 */
  --color-grid: #e4e0d7;

  /* InfraVana accent: the only chart hue */
  --color-accent: #466577;          /* fills, thick lines */
  --color-accent-strong: #3d5a6b;   /* With-InfraVana text, thin lines, markers */
  --color-accent-deep: #2f4856;     /* primary button: label 9.21:1 */
  --color-accent-hover: #233843;
  --color-accent-soft: #e8ebea;     /* selected option */
  --color-hero-end: #e8ebea;

  /* Saved money only */
  --color-positive: #1f6b5e;
  --color-saved: #dcebe5;           /* always with the positive outline */

  /* Today greys: two values, told apart by pattern (section 3) */
  --color-today-1: #2a2a28;
  --color-today-2: #43413d;
  --color-today-3: #43413d;
  --color-today-4: #2a2a28;
  --color-chart-ground: var(--color-bg);               /* what a chart is drawn on */
  --color-series-separator: var(--color-chart-ground); /* 1px between segments: the paper */

  /* Chart-only aliases */
  --color-budget-line: var(--color-text);              /* solid: dashes mean provenance */
  --color-pattern-on-fill: var(--color-surface);       /* new: decal colour on grey and accent */
  --color-pattern-on-saved: var(--color-positive);     /* new: decal colour on savings */
  --color-provenance-on-fill: var(--color-surface);    /* new: dashed/dotted perimeter on fills */
  --color-provenance-on-hollow: var(--color-positive); /* new: perimeter on savings */
  --color-scrim: color-mix(in srgb, var(--color-text) 50%, transparent);

  /* Chart strokes: read with getComputedStyle, parse numbers */
  --chart-separator-width: 1px;
  --chart-savings-outline-width: 1.5px;
  --chart-budget-line-width: 1.5px;
  --chart-provenance-width: 2px;          /* new */
  --chart-dash-modelled: 6 3;             /* new: dash array, modelled */
  --chart-dash-vendor: 2 3;               /* new: dash array, vendor-reported */
  --chart-stage-height: 320px;

  /* Notices (BD-6) and the invented-placeholder badge */
  --color-notice-bg: #fff6dd;
  --color-notice-text: #6b4a00;
  --color-notice-border: #a07a1a;

  /* Focus */
  --focus-ring-color: var(--color-text);
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;

  /* Type */
  --font-sans: "Hanken Grotesk", Arial, sans-serif;
  --font-display: "Newsreader", Georgia, serif;
  --font-numeric: tabular-nums lining-nums;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;
  --font-size-display: 2.4rem;
  --font-weight-regular: 400;
  --font-weight-bold: 700;
  --line-height-tight: 1.2;
  --line-height-body: 1.5;

  /* Space (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  /* Radii: 2px everywhere */
  --radius-sm: 2px;
  --radius-md: 2px;
  --radius-lg: 2px;
  --radius-pill: 2px;

  /* Shadow: none on the page */
  --shadow-card: none;
  --shadow-stage: 0 0 0 1px #d6d1c7;

  /* Motion */
  --duration-fade: 180ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fade: 0ms;
  }
}
```
