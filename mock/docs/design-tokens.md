# Design tokens: Infravana Playground mock

**Status:** proposed for v1 (light mode only, spec section 14). The accent comes from pixel samples of the live logo, but it still needs the brand owner's sign-off before go-live.
**Reference:** https://infravana.ai, fetched 2026-10-19. The page has one inline `<style>` block and no external CSS. Logo: `mock/public/logo.jpeg`, a byte-identical copy of https://infravana.ai/logo.jpeg (929,678 bytes, sha256 `975b5f52…cd21c44`, 1024x1024, sRGB).

## 1. Palette

| Token | Value | Source | Use |
|---|---|---|---|
| `--color-bg` | `#fafafa` | site `body { background }` | Page background |
| `--color-surface` | `#ffffff` | spec 14 ("cards white") | Cards, chart canvas |
| `--color-surface-muted` | `#f2f2f2` | new | Muted panels, hover rows |
| `--color-text` | `#222222` | site `body { color }` | Body text, headline numbers, focus ring, **links (always underlined)** |
| `--color-text-secondary` | `#595959` | site `p { opacity: .75 }` on `#222`, flattened onto white | Captions, axis labels, "Understood" strip |
| `--color-text-disabled` | `#888888` | new | Greyed-out hardware tier (spec 10) |
| `--color-border` | `#e0e0e0` | spec 14 ("1px light-grey border") | Card frame (decorative) |
| `--color-border-strong` | `#888888` | new | Input outlines, slider tracks, axis lines |
| `--color-grid` | `#ebebeb` | new | Chart gridlines (decorative) |
| `--color-skeleton` | `#ebebeb` | new | Loading skeleton blocks |
| **`--color-accent`** | **`#5f7a89`** | **logo pixel sample** (median of all 107,258 coloured pixels) | "With Infravana" fills, thick lines (3px or more), large text |
| `--color-accent-strong` | `#526a77` | accent darkened along the same hue (HSL lightness 0.455 to 0.395) | "With Infravana" **text** (labels, favourable deltas), thin lines (2px or less), markers, the outline of the C1 "Saved" block. **Never generic links.** |
| `--color-accent-hover` | `#445762` | accent-strong darkened again (HSL lightness 0.335) | Hover and pressed state of Infravana-coloured controls (primary button) |
| `--color-accent-soft` | `#e8eef1` | new | Hero card and pressed example chip background |
| `--color-today-1` | `#333333` | new | "Today" C1 segment 2, 4, ... (white label inside) |
| `--color-today-2` | `#888888` | new | "Today" bars in C3 and C5, whose labels sit outside the bar. **No white label on it** (3.54:1). |
| `--color-today-3` | `#5c5c5c` | new | "Today" C1 segment 1, 3, ... (white label inside) |
| `--color-today-4` | `#474747` | new | Spare "today" grey |
| `--color-series-separator` | `var(--color-surface)` (#ffffff) | alias (already in `tokens.css`) | 1px stroke between stacked C1 spend segments (3) |
| `--color-saved` | `#c9d6dd` | light accent tint | C1 "Saved" block fill, always with the `--color-accent-strong` outline (3) |
| `--color-budget-line` | `var(--color-text)` (#222222) | new alias | C1 budget line (3) |
| `--color-scrim` | `color-mix(in srgb, var(--color-text) 50%, transparent)` (#909090 over white, #8e8e8e over bg) | new | Drawer backdrop |
| `--color-notice-bg` | `#fff6dd` | new (proposal) | Infeasible-budget, rejected-prompt and attempts-exhausted banners |
| `--color-notice-text` | `#6b4a00` | new (proposal) | Banner heading |
| `--color-notice-border` | `#a07a1a` | new (proposal) | Banner border |

**Delta colours: none, by design.** Red and green would bring in more hues and break spec 14's rule that Infravana is the only coloured element. They also fail for red-green colour-blind users.

**One "favours Infravana" marker, whatever the number's direction.** Arrows are not used, because "−38% cost" with a down arrow reads as bad even though it is good.

| Delta | Marker | Colour | Hidden text for screen readers |
|---|---|---|---|
| Favours Infravana ("2.4x tokens", "−38% cost", "+12 pts quality") | A check mark before the number: inline SVG, 0.75em, `aria-hidden="true"` | `--color-accent-strong` for both the mark and the number | "(favours Infravana)" |
| Favours today, or no change | No marker | `--color-text` | "(favours today)" or "(no change)" |

- **The number keeps its own sign.** The sign says the direction and the check mark says who it favours, so the two are never mixed up.
- **Why SVG and not the ✓ character.** U+2713 is not reliably in Arial and would fall back to a different font. The SVG renders the same everywhere.
- **Colour is not what carries the meaning.** accent-strong vs `#222` is only 2.79:1, so the check mark's presence is the cue and colour only backs it up.

## 2. Contrast (WCAG 2.x AA)

**Method.** I linearised each sRGB channel, took L = 0.2126R + 0.7152G + 0.0722B, and computed the ratio as (L1 + 0.05) / (L2 + 0.05). Ratios come from a stdlib Python script run on the exact hex values above. Thresholds: 4.5:1 for normal text, and 3:1 for large text, chart marks and UI components.

| Use | Foreground | On | Ratio(s) | Needs | Result |
|---|---|---|---|---|---|
| Body text | `text` #222222 | bg / surface / surface-muted | 15.24 / 15.91 / 14.21 | 4.5:1 | PASS |
| Secondary text, captions, axis labels | `text-secondary` #595959 | bg / surface / surface-muted | 6.71 / 7.00 / 6.26 | 4.5:1 | PASS |
| Links (underlined, body text colour) | `text` #222222 | bg / surface / surface-muted | 15.24 / 15.91 / 14.21 | 4.5:1 | PASS |
| "With Infravana" text: labels, favourable deltas and check mark | `accent-strong` #526a77 | bg / surface / surface-muted | 5.46 / 5.70 / 5.09 | 4.5:1 | PASS |
| Accent hover (text or frame) | `accent-hover` #445762 | bg / surface / surface-muted | 7.22 / 7.54 / 6.73 | 4.5:1 | PASS |
| White label on accent-hover | #ffffff | accent-hover | 7.54 | 4.5:1 | PASS |
| **Brand accent as small text** | `accent` #5f7a89 | bg / surface / surface-muted | **4.34** / 4.53 / **4.05** | 4.5:1 | **FAIL, adjusted:** text uses accent-strong |
| Brand accent as large text (24px+, or 18.66px+ bold) | `accent` #5f7a89 | bg / surface / surface-muted | 4.34 / 4.53 / 4.05 | 3:1 | PASS |
| Notice banner text | `notice-text` #6b4a00 | notice-bg | 7.48 | 4.5:1 | PASS |
| Body text inside notice | `text` #222222 | notice-bg | 14.76 | 4.5:1 | PASS |
| Secondary text inside notice | `text-secondary` #595959 | notice-bg | 6.50 | 4.5:1 | PASS |
| White label inside accent bar | #ffffff | accent | 4.53 | 4.5:1 | PASS, thin margin: put labels outside bars |
| White label inside accent-strong bar | #ffffff | accent-strong | 5.70 | 4.5:1 | PASS |
| Infravana fill or thick line (3px or more) | `accent` #5f7a89 | bg / surface / surface-muted | 4.34 / 4.53 / 4.05 | 3:1 | PASS |
| Infravana thin line (2px or less), markers | `accent-strong` #526a77 | bg / surface / surface-muted | 5.46 / 5.70 / 5.09 | 3:1 | PASS |
| "Today" mark 1 | `today-1` #333333 | bg / surface / surface-muted | 12.10 / 12.63 / 11.29 | 3:1 | PASS |
| "Today" mark 2 | `today-2` #888888 | bg / surface / surface-muted | 3.40 / 3.54 / 3.17 | 3:1 | PASS |
| "Today" mark 3 | `today-3` #5c5c5c | bg / surface / surface-muted | 6.41 / 6.69 / 5.97 | 3:1 | PASS |
| "Today" mark 4 | `today-4` #474747 | bg / surface / surface-muted | 8.90 / 9.29 / 8.30 | 3:1 | PASS |
| 1px white segment separator vs C1 today greys | #ffffff | today-3 / today-1 | 6.69 / 12.63 | 3:1 | PASS |
| White label inside a C1 today segment | #ffffff | today-3 / today-1 | 6.69 / 12.63 | 4.5:1 | PASS |
| White label on today-2 (not allowed) | #ffffff | today-2 | 3.54 | 4.5:1 | FAIL: today-2 carries no label inside |
| C1 "Saved" fill vs the card | `saved` #c9d6dd | surface | 1.48 | 3:1 | FAIL alone: the block always has its outline |
| C1 "Saved" outline vs the card / vs its fill | `accent-strong` #526a77 | surface / saved | 5.70 / 3.84 | 3:1 | PASS |
| C1 "Saved" fill vs the spend segment next to it | `saved` #c9d6dd | accent | 3.05 | 3:1 | PASS |
| "Saved" label, inside or outside the block | `text` #222222 | saved / surface | 10.72 / 15.91 | 4.5:1 | PASS |
| C1 Infravana bar: 1px white separator between spend segments | #ffffff | accent | 4.53 | 3:1 | PASS |
| Drawer panel edge vs scrimmed page (50%) | #ffffff | scrim over white / bg / muted | 3.19 / 3.28 / 3.45 | 3:1 | PASS (at 40% it was 2.41 / 2.49 / 2.65, so raised) |
| Input, slider and axis line | `border-strong` #888888 | bg / surface / surface-muted | 3.40 / 3.54 / 3.17 | 3:1 | PASS |
| Focus ring (2px, 2px offset) | `text` #222222 | bg / surface / surface-muted | 15.24 / 15.91 / 14.21 | 3:1 | PASS |
| Notice border | `notice-border` #a07a1a | notice-bg / bg | 3.68 / 3.80 | 3:1 | PASS |
| Disabled text (exempt under 1.4.3) | `text-disabled` #888888 | surface / bg | 3.54 / 3.40 | n/a | Exempt; still kept at 3:1 or above |
| Card border (decorative, exempt) | `border` #e0e0e0 | bg / surface | 1.26 / 1.32 | n/a | Exempt: it does not identify a control |
| Gridline (decorative, exempt) | `grid` #ebebeb | surface | 1.19 | n/a | Exempt: values carry direct labels |

### Pairs adjusted, and why

| Pair | Before | After | Why |
|---|---|---|---|
| Accent as text, thin lines and outlines | `#5f7a89`: 4.34 on bg, 4.05 on surface-muted | `#526a77`: 5.46 / 5.09 | Fails 4.5:1 for small text on two of the three surfaces. I darkened it along the same hue (201°) to the first step with a clear margin on the worst surface. Spec 14 predicted this pair would fail. |
| Lightest "today" grey and strong border | First candidate `#8c8c8c`: exactly 3.00 on surface-muted | `#888888`: 3.17 | Zero margin at the threshold. |
| Notice border | First candidate `#b58a1e`: 2.94 on notice-bg | `#a07a1a`: 3.68 | Below 3:1. |
| Secondary text | Site uses `opacity: .75`, `.7` and `.6` | Solid `#595959` | Opacity gives a different colour on each surface and stacks inside charts. A solid hex keeps the ratio fixed. |

### Inherited debt on infravana.ai (measured, not reproduced)

- **Live-site footer fails AA.** The footer is `#222` at `opacity: .6` on `#fafafa`, which renders as `#787878`, a ratio of **4.23:1**. The mock does not reproduce this, because all secondary text uses `#595959`. Fixing the live site is the infravana.ai owner's call.
- **Live-site links are fine on contrast.** Social links at `opacity: .7` render as `#636363`, which is 5.76:1. They have no underline, but they are not body-text links, so this is not a failure.

### Distinguishing series without relying on colour

| Pair | Ratio | Consequence |
|---|---|---|
| accent vs today-2 / today-3 | 1.28 / 1.47 | Accent and greys can look alike in luminance. Every Infravana series must carry the direct label "With Infravana" (spec 14 already requires direct labels). |
| today-3 vs today-1 | 1.89 | Neighbouring C1 greys need the 1px `--color-surface` separator between stacked segments. |
| accent-strong vs body text | 2.79 | Below 3:1, so the accent cannot mark anything on its own next to body text. **Links use `--color-text` and are always underlined.** The accent stays reserved for the "With Infravana" meaning (spec 14). |

## 3. Charts on the executive page

The page is for executives, so the charts carry only what that reader needs. Every figure on the page is an illustrative placeholder. The one footer line says so, and the Assumptions drawer explains how the numbers are worked out. That is the only place provenance is shown: no per-part borders, dash patterns, badges or provenance lines on the charts.

**C1, where the money goes.** Two solid stacked bars, "Today" and "With Infravana", on a dollar axis that ends on a round number at or above the larger of the cost and the budget.

- **Today segments** alternate `--color-today-3` and `--color-today-1`, so a white label inside passes 4.5:1 (6.69 / 12.63). `--color-today-2` is never used under a white label (3.54:1).
- **With Infravana spend segments** alternate `--color-accent` and `--color-accent-strong`, with white labels (4.53 / 5.70).
- A 1px `--color-series-separator` stroke (`--chart-separator-width`) separates stacked segments.
- **Savings are one "Saved" block** at the end of the With bar: a `--color-saved` fill with a `--chart-savings-outline-width` `--color-accent-strong` outline. The fill alone is 1.48:1 against the card, so the outline is never dropped. Its label is `--color-text`. When the label does not fit inside the block, it goes to the right of the bar, or above the block when the budget line would cross it.
- **Labels inside a segment** read "Name $X", else "$X", else none. A segment too narrow for a label is still named in its tooltip and in the screen-reader table. There are no leader lines, chips or label list.
- **Budget line**: a dashed `--color-budget-line` line at `--chart-budget-line-width`, labelled "Budget $X" in `--color-text-secondary`.
- X-axis labels hide on overlap (`hideOverlap`), so ticks never run together on a phone.

**C3, price per million tokens.** Grouped bars by model size, "Today" in `--color-today-2` and "With Infravana" in `--color-accent`, with value labels above the bars and a legend. Only the model sizes priced on both sides are shown: a group with one bar would read as free or missing. If no size is priced on both sides, the sizes priced on either side are shown.

**C5, tokens the budget buys.** Two bars, `--color-today-2` and `--color-accent`, with value labels above them.

**Every chart** has a plain title, a one-line caption written from `Results`, a "How is this worked out?" drawer and a screen-reader table. Accent and greys can look alike in luminance (1.28 to 1.47), so every Infravana series carries the direct label "With Infravana".

## 4. Type

| Token | Value | Use |
|---|---|---|
| `--font-sans` | `Arial, "Helvetica Neue", Helvetica, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | Everything. Starts with Arial to match the site. |
| `--font-numeric` | `tabular-nums lining-nums` (on `font-variant-numeric`) | All figures: headline strip, knobs, axis labels, tables |
| `--font-size-xs` | 0.75rem (12px) | Axis ticks, sub-labels, the budget label. Use secondary text colour or darker. |
| `--font-size-sm` | 0.875rem (14px) | Captions, knob labels, chart data labels |
| `--font-size-md` | 1rem (16px) | Body |
| `--font-size-lg` | 1.125rem (18px) | Knob group headings, section titles |
| `--font-size-xl` | 1.5rem (24px) | Chart card title. Counts as large text at 400 weight. |
| `--font-size-2xl` | 2rem (32px) | Hero figure, set bold |
| `--font-size-display` | 2.4rem | Matches the site's `h1` |
| `--font-weight-regular` / `--font-weight-bold` | 400 / 700 | Arial only ships these two weights |
| `--line-height-tight` / `--line-height-body` | 1.2 / 1.5 | Numbers and headings / prose |

Arial's figures are already fixed-width by default. `tabular-nums` makes sure the fallback fonts behave the same way.

## 5. Space, radii, shadow, motion, focus

| Group | Tokens |
|---|---|
| Spacing (4px base) | `--space-1` 4px, `-2` 8px, `-3` 12px, `-4` 16px, `-5` 24px, `-6` 32px, `-7` 48px, `-8` 64px |
| Chart strokes (3) | `--chart-separator-width` 1px, `--chart-savings-outline-width` 1.5px, `--chart-budget-line-width` 1.5px |
| Chart size | `--chart-stage-height` 320px, the canvas height in a chart card |
| Chart type (G-5) | Chart code reads text sizes from `--font-size-xs` (12px) and `--font-size-sm` (14px) via `tokens.ts`, never literals. The value is a rem string, so convert it with the root font size (`parseFloat(getComputedStyle(document.documentElement).fontSize)`). **Use only these two:** `xs` for axis ticks, sub-labels, the budget label and tooltips; `sm` for category labels and data labels. Line height = `ceil(size x --line-height-tight)`, which is 15 for xs and 17 for sm. Bold labels use `--font-weight-bold`. Tooltip padding = `--space-2` / `--space-3` (8 / 12). Animation duration = `--duration-fade`, read in ms. |
| Radii | `--radius-sm` 4px (inputs, buttons), `--radius-md` 8px (cards), `--radius-lg` 12px, `--radius-pill` 999px (example chips) |
| Shadow | `--shadow-card`: very soft, two layers at 4% black. `--shadow-stage`: slightly lifted, for the "mounted print" stage, which also gets a 1px `--color-border` frame and a `--space-3` white mat. |
| Motion | `--duration-fade` 180ms, `--ease-standard`. Both drop to 0ms under `prefers-reduced-motion`. |
| Scrim | `--color-scrim` = `color-mix(in srgb, var(--color-text) 50%, transparent)` behind the drawer. Raised from the built 40%, so that the white drawer panel reaches at least 3:1 against the dimmed page: 3.19 over white, 3.28 over bg, 3.45 over muted. At 40% it was 2.41–2.65. |
| Focus | 2px `--color-text` outline with a 2px offset. |

## 6. Implementation notes

- **Logo placement.** The JPEG background is about `#f9f9f9`, not white or transparent. On `--color-bg` it blends in. On a white card it would show a faint box, so place it on `--color-bg` only.
- **Logo file size.** The file is 930 KB at 1024px. That is fine for the mock but heavy for a header icon in production. A resized derivative is follow-up work.
- **Chart colours must be read from these CSS variables, not copied as hex into chart code.** ECharts draws to canvas and cannot use `var()`. Read the values once with `getComputedStyle(document.documentElement).getPropertyValue('--color-accent')` and pass them in, so this file stays the single source.

## 7. Ready-to-paste CSS (for `mock/src/styles/tokens.css`)

```css
:root {
  /* Surfaces */
  --color-bg: #fafafa;              /* infravana.ai body background */
  --color-surface: #ffffff;
  --color-surface-muted: #f2f2f2;
  --color-skeleton: #ebebeb;

  /* Text */
  --color-text: #222222;            /* infravana.ai body colour */
  --color-text-secondary: #595959;  /* site's 0.75-opacity #222, flattened */
  --color-text-disabled: #888888;

  /* Lines */
  --color-border: #e0e0e0;          /* decorative card/stage frame */
  --color-border-strong: #888888;   /* inputs, sliders, axis lines: >=3:1 */
  --color-grid: #ebebeb;

  /* Infravana accent: the only chart hue */
  --color-accent: #5f7a89;          /* sampled from logo.jpeg; fills, lines >=3px, large text */
  --color-accent-strong: #526a77;   /* With-Infravana text, lines <=2px, markers, C1 "saved" outline; never generic links */
  --color-accent-hover: #445762;    /* hover/pressed on Infravana-coloured controls */
  --color-accent-soft: #e8eef1;     /* tinted card and selected-card background */
  --color-saved: #c9d6dd;           /* C1 "saved" block: light accent tint, reads as money not spent */

  /* "Today" series: greys, always with a direct label */
  --color-today-1: #333333;
  --color-today-2: #888888;         /* bars without a label inside (white on it is 3.54:1) */
  --color-today-3: #5c5c5c;
  --color-today-4: #474747;
  --color-series-separator: var(--color-surface);

  /* Chart-only aliases */
  --color-budget-line: var(--color-text);
  --color-scrim: color-mix(in srgb, var(--color-text) 50%, transparent); /* drawer backdrop; panel edge >=3:1 */

  /* Chart strokes: read with getComputedStyle, parse numbers */
  --chart-separator-width: 1px;
  --chart-savings-outline-width: 1.5px;   /* C1 "saved" block outline */
  --chart-budget-line-width: 1.5px;
  --chart-stage-height: 320px;            /* chart canvas height in a chart card */

  /* State banners (infeasible budget, rejected prompt, attempts exhausted) */
  --color-notice-bg: #fff6dd;
  --color-notice-text: #6b4a00;
  --color-notice-border: #a07a1a;

  /* Focus */
  --focus-ring-color: var(--color-text);
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;

  /* Type */
  --font-sans: Arial, "Helvetica Neue", Helvetica, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-numeric: tabular-nums lining-nums; /* use as font-variant-numeric */
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

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 999px;

  /* Shadow */
  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.04);
  --shadow-stage: 0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.06);

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
