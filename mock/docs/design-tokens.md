# Design tokens: Infravana Playground mock

**Status:** proposed for v1 (light mode only, spec section 14). The accent comes from pixel samples of the live logo, but it still needs the brand owner's sign-off before go-live.
**Reference:** https://infravana.ai, fetched 2026-10-19. The page has one inline `<style>` block and no external CSS. Logo: `mock/public/logo.jpeg`, a byte-identical copy of https://infravana.ai/logo.jpeg (929,678 bytes, sha256 `975b5f52…cd21c44`, 1024x1024, sRGB).

## 1. Palette

| Token | Value | Source | Use |
|---|---|---|---|
| `--color-bg` | `#fafafa` | site `body { background }` | Page background |
| `--color-surface` | `#ffffff` | spec 14 ("cards white") | Cards, stage mat, chart canvas |
| `--color-surface-muted` | `#f2f2f2` | new | Filmstrip track, headline strip, hover rows |
| `--color-text` | `#222222` | site `body { color }` | Body text, headline numbers, focus ring, **links (always underlined)** |
| `--color-text-secondary` | `#595959` | site `p { opacity: .75 }` on `#222`, flattened onto white | Captions, axis labels, "Understood" strip |
| `--color-text-disabled` | `#888888` | new | Greyed-out hardware tier (spec 10) |
| `--color-border` | `#e0e0e0` | spec 14 ("1px light-grey border") | Card and stage frame (decorative) |
| `--color-border-strong` | `#888888` | new | Input outlines, slider tracks, axis lines |
| `--color-grid` | `#ebebeb` | new | Chart gridlines (decorative) |
| `--color-skeleton` | `#ebebeb` | new | Loading skeleton blocks |
| **`--color-accent`** | **`#5f7a89`** | **logo pixel sample** (median of all 107,258 coloured pixels) | "With Infravana" fills, thick lines (3px or more), large text |
| `--color-accent-strong` | `#526a77` | accent darkened along the same hue (HSL lightness 0.455 to 0.395) | "With Infravana" **text** (labels, favourable deltas), thin lines (2px or less), markers, savings outlines and patterns in C1, active thumbnail frame. **Never generic links.** |
| `--color-accent-hover` | `#445762` | accent-strong darkened again (HSL lightness 0.335) | Hover and pressed state of the active thumbnail frame, and hover emphasis on Infravana chart marks |
| `--color-today-1` | `#333333` | new | "Today" series slot 1, solid fill |
| `--color-today-2` | `#888888` | new | Slot 2, solid fill |
| `--color-today-3` | `#5c5c5c` | new | Slot 3, diagonal hatch |
| `--color-today-4` | `#474747` | new | Slot 4, dot pattern |
| `--color-series-separator` | `var(--color-surface)` (#ffffff) | alias (already in `tokens.css`) | 1px stroke between stacked segments (3, 3a) |
| `--color-provenance-on-fill` | `var(--color-surface)` (#ffffff) | new alias | Dashed or dotted provenance border on filled bars (3b) |
| `--color-provenance-on-hollow` | `var(--color-accent-strong)` (#526a77) | new alias | Dashed or dotted outline on hollow savings segments (3b) |
| `--color-chart-chip` | `var(--color-surface)` (#ffffff) | new alias | Label chips on bar fills (3c) |
| `--color-budget-line` | `var(--color-text)` (#222222) | new alias | C1 budget markLine (3d) |
| `--color-budget-halo` | `var(--color-surface)` (#ffffff) | new alias | Underlay halo for the budget line (3d) |
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
| 1px white segment separator vs lightest grey | #ffffff | today-2 | 3.54 | 3:1 | PASS |
| White hatch or dots on today-3 / today-4 | #ffffff | today-3 / today-4 | 6.69 / 9.29 | 3:1 | PASS |
| C1 Infravana bar: 1px white separator between spend segments | #ffffff | accent | 4.53 | 3:1 | PASS |
| C1 Infravana bar: white hatch, dots or cross-hatch on spend segments | #ffffff | accent | 4.53 | 3:1 | PASS |
| C1 savings segment: accent-strong outline and pattern on white fill | `accent-strong` #526a77 | surface | 5.70 | 3:1 | PASS |
| C1 savings segment next to spend segment (outline vs fill) | `accent-strong` #526a77 | accent | 1.26 | 3:1 | Not a boundary by itself: the white separator between them is (4.53 vs accent, 5.70 vs outline) |
| Modelled or vendor-reported border: white dashes on fills | #ffffff | accent / today-1 / today-2 / today-3 / today-4 | 4.53 / 12.63 / 3.54 / 6.69 / 9.29 | 3:1 | PASS |
| Same border, outer edge: fill seen through the gaps vs surface | accent / today-1 / today-2 / today-3 / today-4 | surface / bg | 4.53 / 12.63 / 3.54 / 6.69 / 9.29 on surface; 4.34 / 12.10 / 3.40 / 6.41 / 8.90 on bg | 3:1 | PASS |
| Provenance outline on hollow savings segment | `accent-strong` #526a77 | surface (interior and outside) | 5.70 | 3:1 | PASS |
| Chip text / chip provenance line | `text` #222222 / `text-secondary` #595959 | chart-chip #ffffff | 15.91 / 7.00 | 4.5:1 | PASS |
| Budget line vs its halo | `budget-line` #222222 | budget-halo #ffffff | 15.91 | 3:1 | PASS |
| Budget halo vs fills it crosses | #ffffff | accent / today-1 / today-2 / today-3 / today-4 | 4.53 / 12.63 / 3.54 / 6.69 / 9.29 | 3:1 | PASS |
| Budget line without halo, inside today-1 (rejected) | #222222 | today-1 | 1.26 | 3:1 | FAIL, fixed by the halo (3d) |
| Input, slider and axis line | `border-strong` #888888 | bg / surface / surface-muted | 3.40 / 3.54 / 3.17 | 3:1 | PASS |
| Focus ring (2px, 2px offset) | `text` #222222 | bg / surface / surface-muted | 15.24 / 15.91 / 14.21 | 3:1 | PASS |
| Active thumbnail frame | `accent-strong` #526a77 | bg / surface / surface-muted | 5.46 / 5.70 / 5.09 | 3:1 | PASS |
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
| today-2 vs today-3, today-3 vs today-4 | 1.89 / 1.39 | Neighbouring greys need a 1px `--color-surface` separator between stacked segments, plus their slot pattern. |
| accent-strong vs body text | 2.79 | Below 3:1, so the accent cannot mark anything on its own next to body text. **Links use `--color-text` and are always underlined.** The accent stays reserved for the "With Infravana" meaning (spec 14). |

## 3. "Today" series rules

| Slot | Colour | Bar/area cue | Line cue (dash is reserved) | Order rationale |
|---|---|---|---|---|
| 1 | `--color-today-1` #333333 | solid | circle marker | Darkest first |
| 2 | `--color-today-2` #888888 | solid | square marker | Alternates dark and light, so slots 1 and 2 differ by 3.56:1 |
| 3 | `--color-today-3` #5c5c5c | diagonal hatch (white) | triangle marker | |
| 4 | `--color-today-4` #474747 | dot pattern (white) | diamond marker | |
| 5+ | Fold into "Other providers" on today-2 with cross-hatch | | | Keeps the series count at 5 or fewer |

- **Direct labels are required on every series.** Patterns and markers are the backup cue, not a substitute.
- **Line charts never use dashes to tell "today" series apart.** Spec 9 reserves line style for provenance: measured is solid, modelled is dashed, vendor-reported is dotted (section 3b). Markers and end-of-line labels tell series apart instead.
- **Stacked bars (C1, C7)** draw a 1px `--color-surface` stroke between segments.

## 3a. Infravana C1 bar segments (one accent, no tints)

**Rule: the Infravana bar uses `--color-accent` and `--color-accent-strong` only. Segments are told apart by white separators, patterns and direct labels. Savings are drawn hollow.** The same rule applies to the Infravana panels in C7.

| Segment kind | Fill | Cue | Label |
|---|---|---|---|
| Spend segment 1 | `--color-accent`, solid | — | Direct label (see naming below) |
| Spend segment 2 | `--color-accent` + white diagonal hatch | pattern | Direct label |
| Spend segment 3 | `--color-accent` + white dots | pattern | Direct label |
| Spend segment 4+ | `--color-accent` + white cross-hatch, tail folded into "Other" | pattern | Direct label |
| **Saved by provider arbitrage** | `--color-surface` (hollow) + 1.5px `--color-accent-strong` outline + accent-strong diagonal hatch | hollow + pattern | "Saved: provider arbitrage $X" |
| **Saved by routing** | `--color-surface` (hollow) + 1.5px `--color-accent-strong` outline + accent-strong dots | hollow + pattern | "Saved: routing $X" |

**Segment naming.** Hardware is not nested inside a channel. In the data contract, self-host is the only channel costed from hardware, so each hardware segment is its own segment:

| Segment kind (contract `SpendSegment.kind`) | Label | Examples |
|---|---|---|
| `provider` (an API channel, or a seat-plan vendor) | Capitalised channel or vendor name | "Direct", "Bedrock", "Azure", "Neocloud" |
| `hardware` (always channel self-host) | "Self-host · " followed by the hardware name, written the way the shell writes it | "Self-host · MI355X", "Self-host · H200" |

Raw lower-case ids ("mi355x", "direct") never appear in a label. Savings labels keep the text in the table above. The tooltip title, the badge and the CSV `segment` column use the same text as the bar label.

- **Every segment carries a direct label.** If a segment is too narrow for its label, put the label outside the bar with a leader line, or fold the segment into "Other". Never rely on pattern alone.
- **Order along the bar:** spend segments first, then arbitrage savings, then routing savings at the end. The two bars then end at the same total, as spec 6 asks.
- **Separators.** A 1px `--color-series-separator` sits between every pair of spend segments.
- **Spend-to-savings edge (accepted deviation).** Stock ECharts lets the 1.5px accent-strong savings outline cover the white separator there. The outline itself is only 1.26:1 against the accent fill. The boundary is still visible, because just inside the outline the savings interior is white, which is 4.53:1 against the accent. Accepted for the mock and for go-live. No custom series or spacer segment is needed.

**Why there are no accent tints.** I checked whether a darker and a lighter tint could pass 3:1 against both the accent and every surface. They cannot:
- **Lighter tint: impossible.** To pass 3:1 on white it needs L ≤ 0.300. To pass 3:1 against the accent (L = 0.1816) it needs L ≥ 0.645. No colour meets both.
- **Darker tint: technically possible, but it doesn't work.** The first same-hue step that passes 3:1 against the accent is `#252f35` (3.01:1). It reads as black: 1.16:1 against body text and 1.08:1 against today-1. It would lose the brand hue and collide with the "today" greys.

So neither tint goes into the palette or the `:root` block.

## 3b. Provenance on bars (C1 stacked bars, C3 bars, and all future bars)

**Rule: provenance is shown on a bar's perimeter, and series patterns stay inside it, so the two never compete.** A non-measured part is drawn with a perforated border:
- **Modelled:** a dashed border.
- **Vendor-reported:** a dotted border.

Every non-measured part gets this border, whether or not its side is mixed. That keeps the cue constant. Badges and tooltip provenance lines stay as they are.

| Provenance | Filled segment or bar (accent or grey) | Hollow savings segment | Line charts (C2, C8) | Label chip (stage only) |
|---|---|---|---|---|
| Measured | Standard 1px `--color-series-separator` border | Solid 1.5px `--color-accent-strong` outline | Solid | No provenance text |
| **Modelled** | 2px `--color-provenance-on-fill` border, dash `--chart-dash-modelled` (6 3) | 1.5px `--color-provenance-on-hollow` outline, dash 6 3 | Dashed 6 3 | Second line "modelled" in `--color-text-secondary`, `--font-size-xs` |
| **Vendor-reported** | 2px `--color-provenance-on-fill` border, dash `--chart-dash-vendor` (2 3) | 1.5px `--color-provenance-on-hollow` outline, dash 2 3 | Dotted 2 3 | Second line "vendor-reported" |

**Why white dashes on fills.** No single outline colour can pass 3:1 against both white and every fill:
- 3:1 against every fill needs L ≥ 0.839.
- 3:1 against white needs L ≤ 0.300.

So the dash is white on fills, and the cue works in two directions:
- **Inside the bar:** the white dashes read against the fill, at 3.54–12.63:1.
- **Along the outer edge:** the dash merges into the surface and the fill showing through the gaps reads against the surface, at 3.40–12.63:1. The edge looks perforated.

On hollow savings segments, where the fill is white, the dash is accent-strong instead: 5.70:1 against both the interior and the surface.

**Small segments.** A segment shorter than about three dash periods along the bar (about 27px) cannot show the pattern. Its chip text carries the provenance there. At thumb size the border is the only cue, which is acceptable because thumbs are decorative (`aria-hidden`).

**ECharts.** This is stock ECharts: per data item, set `itemStyle.borderType` to `'dashed'`, `'dotted'`, or a number array, plus `borderWidth` and `borderColor`. Read the dash arrays from the tokens and check array support against the installed version. The series `decal` patterns are unaffected.

## 3c. Chart labels on chips (deviation accepted)

**Ruling: label chips are accepted as the standard for labels drawn on top of bar fills.** No bare text colour reaches 4.5:1 on every fill: `#222` on the accent is 3.51 and on today-1 is 1.26, and white on today-2 is 3.54.

| Property | Token | Ratio |
|---|---|---|
| Chip fill | `--color-chart-chip` (= `--color-surface`) | — |
| Chip text | `--color-text` | 15.91 |
| Provenance line in the chip | `--color-text-secondary`, `--font-size-xs` | 7.00 |
| Padding / radius | `--chart-chip-padding` 2px 4px / `--radius-sm` | — |

- **No chip border or shadow.** The chip edge is invisible on a hollow savings segment (1.00:1). That is acceptable because the text is what must read there.
- **Fallback.** If a chip does not fit inside its segment, place it outside the bar with a leader line, as in section 3a.

## 3d. Budget line in C1 (halo)

**Rule: draw the budget line as two stacked markLine items at the same value.**
1. An underlay: `--color-budget-halo` (white), `--chart-budget-halo-width` 4.5px wide.
2. The line itself on top: `--color-budget-line` (`#222`), `--chart-budget-line-width` 1.5px wide.

The result is a dark line with 1.5px of white on each side.

**Ratios:**
- Line vs halo: 15.91.
- Halo vs every fill: 3.54–12.63.
- Line vs surface: 15.91.

Without the halo, the line is 1.26:1 against today-1 and disappears inside it.

**Constraints:**
- Keep the line solid, because dashes mean provenance.
- The underlay is `silent`, with no label and no tooltip, and it is left out of the CSV and the hidden table.
- This is stock ECharts: `markLine.data` takes a `lineStyle` per item.

## 4. Type

| Token | Value | Use |
|---|---|---|
| `--font-sans` | `Arial, "Helvetica Neue", Helvetica, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | Everything. Starts with Arial to match the site. |
| `--font-numeric` | `tabular-nums lining-nums` (on `font-variant-numeric`) | All figures: headline strip, knobs, axis labels, tables |
| `--font-size-xs` | 0.75rem (12px) | Axis ticks, provenance badges. Use secondary text colour or darker. |
| `--font-size-sm` | 0.875rem (14px) | Captions, knob labels, "Understood" strip |
| `--font-size-md` | 1rem (16px) | Body |
| `--font-size-lg` | 1.125rem (18px) | Knob group headings, section titles |
| `--font-size-xl` | 1.5rem (24px) | Stage chart title. Counts as large text at 400 weight. |
| `--font-size-2xl` | 2rem (32px) | Headline-strip numbers, set bold |
| `--font-size-display` | 2.4rem | Matches the site's `h1` |
| `--font-weight-regular` / `--font-weight-bold` | 400 / 700 | Arial only ships these two weights |
| `--line-height-tight` / `--line-height-body` | 1.2 / 1.5 | Numbers and headings / prose |

Arial's figures are already fixed-width by default. `tabular-nums` makes sure the fallback fonts behave the same way.

## 5. Space, radii, shadow, motion, focus

| Group | Tokens |
|---|---|
| Spacing (4px base) | `--space-1` 4px, `-2` 8px, `-3` 12px, `-4` 16px, `-5` 24px, `-6` 32px, `-7` 48px, `-8` 64px |
| Chart strokes (3a to 3d) | `--chart-separator-width` 1px, `--chart-savings-outline-width` 1.5px, `--chart-provenance-width` 2px, `--chart-dash-modelled` 6 3, `--chart-dash-vendor` 2 3, `--chart-budget-line-width` 1.5px, `--chart-budget-halo-width` 4.5px, `--chart-chip-padding` 2px 4px |
| Radii | `--radius-sm` 4px (inputs, buttons), `--radius-md` 8px (cards, stage frame), `--radius-lg` 12px (filmstrip), `--radius-pill` 999px (chips, dots) |
| Shadow | `--shadow-card`: very soft, two layers at 4% black. `--shadow-stage`: slightly lifted, for the "mounted print" stage, which also gets a 1px `--color-border` frame and a `--space-3` white mat. |
| Motion | `--duration-fade` 180ms, `--ease-standard`. Both drop to 0ms under `prefers-reduced-motion`. |
| Focus | 2px `--color-text` outline with a 2px offset. This keeps it distinct from the accent-strong frame on the active thumbnail, so "focused" and "current" never look the same. |

## 6. Implementation notes

- **Logo placement.** The JPEG background is about `#f9f9f9`, not white or transparent. On `--color-bg` it blends in. On a white card it would show a faint box, so place it on `--color-bg` only.
- **Logo file size.** The file is 930 KB at 1024px. That is fine for the mock but heavy for a header icon in production. A resized derivative is follow-up work.
- **Chart colours must be read from these CSS variables, not copied as hex into chart code.** ECharts draws to canvas and cannot use `var()`. Read the values once with `getComputedStyle(document.documentElement).getPropertyValue('--color-accent')` and pass them in, so this file stays the single source.
- **Patterns.** ECharts 5 can draw patterns through `itemStyle.decal`. Check this against the installed version.
- **Build check still to do.** There is no build yet, so the compiled output cannot be checked against these values. After the album shell lands, run `npm run build` in `mock/` and grep the CSS in `mock/dist` for `#5f7a89` and `#526a77`.

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
  --color-accent-strong: #526a77;   /* With-Infravana text + favourable-delta check, lines <=2px, markers, C1 savings outline/pattern, active frame; never generic links */
  --color-accent-hover: #445762;    /* hover/pressed on active frame and Infravana marks */

  /* "Today" series: greys, always with direct label + pattern/marker */
  --color-today-1: #333333;         /* solid  / circle */
  --color-today-2: #888888;         /* solid  / square */
  --color-today-3: #5c5c5c;         /* hatch  / triangle */
  --color-today-4: #474747;         /* dots   / diamond */
  --color-series-separator: var(--color-surface);

  /* Chart-only aliases (sections 3b to 3d) */
  --color-provenance-on-fill: var(--color-surface);       /* dashed/dotted border on filled bars */
  --color-provenance-on-hollow: var(--color-accent-strong); /* dashed/dotted outline on hollow savings */
  --color-chart-chip: var(--color-surface);               /* label chips on bar fills */
  --color-budget-line: var(--color-text);
  --color-budget-halo: var(--color-surface);

  /* Chart strokes: read with getComputedStyle, parse numbers */
  --chart-separator-width: 1px;
  --chart-savings-outline-width: 1.5px;
  --chart-provenance-width: 2px;          /* on filled bars; hollow savings keep 1.5px */
  --chart-dash-modelled: 6 3;             /* dash array: modelled */
  --chart-dash-vendor: 2 3;               /* dash array: vendor-reported */
  --chart-budget-line-width: 1.5px;
  --chart-budget-halo-width: 4.5px;       /* 1.5px of white each side of the line */
  --chart-chip-padding: 2px 4px;

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
