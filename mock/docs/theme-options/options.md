# AI Budget Playground: five theme options

**Pick by looking.**
- **Start here:** the contact sheet, [`contact-sheet.png`](contact-sheet.png).
- **Full-size screenshots:** [`shots/<option>/`](shots/). The current app is in `0-current-app` for comparison.

**How these were made.** Every picture is the real running app, reskinned. The intake, the estimate and the three charts all redraw from each option's colours and fonts.

**What every option keeps:**
- the steel-blue logo, unedited;
- greys for "Today" and the accent for "With InfraVana";
- the footer line "Illustrative figures only. Prices and savings are placeholders, not quotes.";
- text at 4.5:1 or better and chart marks and borders at 3:1 or better, measured.

## Ranking

Ranked for "leading-edge infrastructure startup that does not look AI-made".

| Rank | Option | One-line character | Infra signal | CFO fit | Main risk |
|---|---|---|---|---|---|
| **1 (recommended)** | **Spec Sheet** | A hardware datasheet for your spend | highest | medium | Dark can read "for developers" |
| 2 | Ink and Scale | A printed poster of your numbers | high | medium | Huge figures make placeholders look official |
| 3 | Research Note | A published research note | medium | highest | Can feel slow or "blog" |
| 4 | Blueprint | The calculation as a drafting sheet | high | medium | Closest to one reference site (Baseten) |
| 5 | Analyst Desk | An analyst's working screen | medium | high | Dense, least distinctive |

**My recommendation is Spec Sheet.** It is the one that most clearly says "we build infrastructure", and its signature idea does real work. The "FIG. 01 · ILLUSTRATIVE · INVENTED DATA" box on each chart makes the placeholder status part of the look, rather than small print.

If the CFO audience matters more than the infra signal, choose Research Note. It keeps every rule, and serif figure titles with a source line read as credible analysis.

Ink and Scale is the most memorable. It needs the placeholder line kept right under its giant figure, as built here.

## What every option changes from today

Two changes in each option remove the AI-generated tells the research named:
- **Gone:** the page gradient, the gradient hero card, uniform 12px soft-shadow cards, pill chips and the single-font type.
- **New:** a two-font system (display or body plus mono for labels and figures), with structure drawn by rules instead of shadows.

**Other changes in every option:**
- **Icon.** The sparkle icon on "AI-first startup" became a stacked-layers icon. Sparkles are a named AI tell. This is a one-line markup change in the scratch copy only.
- **Greys are darker than the accent.** The current app's grey and accent sit at nearly the same lightness (1.28 to 1.47:1), so they only separate by a faint hue. In every option, the "Today" greys now differ from the accent in lightness by 1.56:1 or more, as well as in hue. On graphite the greys are mid-tone and the accent is lighter.

## 1. Spec Sheet (recommended)

- **Palette.**

  | Role | Hex |
  |---|---|
  | Graphite ground | `#0f1214` |
  | Panels | `#161b1e` |
  | Text | `#e4e7e5` |
  | Secondary | `#9aa3a8` |
  | Rules | `#2b3237` |
  | Accent, lifted steel (logo hue 201°) | `#9ac0d5` |
  | Accent text | `#b6d2e1` |
  | Saved money only, mint | `#6fcfa6` |
  | Today greys | `#848b8f` / `#80878b` |
  | Notices (amber, re-cut for dark) | `#2a2412` / `#f2cf7a` |

- **Fonts:** Switzer (Fontshare) for headings and body. JetBrains Mono (Google Fonts) for labels, buttons, chips, figures and the footer, all uppercase with tracking.
- **Shape:** 2px corners and 1px hairline borders, no shadows. The intake choices form one ruled grid, not separate cards. A faint 96px horizontal rule pattern runs behind the page.
- **Why it feels authored:**
  - It follows technical-manual conventions: "FIG. 0n" caption boxes, mono step labels, a ruled choice grid.
  - It has one supporting hue with one meaning (mint means money saved).
  - The logo sits on a deliberate light plate, like a badge on a datasheet.
- **Risks:**
  - Dark UIs can feel "developer, not finance".
  - Mint is a second hue. The research flagged it as needing your sign-off.
  - Switzer uses the ITF Free Font License. I did not re-read its terms, so confirm before shipping.
- **Contrast:**
  - Lowest text pair: 4.76:1 (dark chart label on the mid-grey Today bar).
  - Lowest border pair: 3.68:1.
  - I darkened one grey that failed at first: today-2 was 2.80:1 against the panel.

## 2. Ink and Scale

- **Palette.**

  | Role | Hex |
  |---|---|
  | Cream ground | `#eeece4` |
  | Ink | `#141414` |
  | Secondary | `#55534d` |
  | Accent | `#4f6e80` |
  | Accent text | `#466577` |
  | Saved | `#1f6b5e` |
  | Today greys | `#232321` / `#45433f` |

  Primary buttons are solid ink with cream text.
- **Fonts:** Archivo throughout, using its width axis. Headlines and figures are set at width 112 to 125 and weight 800. Labels use Fragment Mono. Both are from Google Fonts.
- **Shape:**
  - Radius 0, no cards and no shadows.
  - 2px ink rules separate sections, and a 6px rule sits above the result.
  - The choices form a ruled table. The hovered or selected choice inverts to ink.
- **Why it feels authored:** typography carries the whole brand. The saving is set at about 90px and extra-wide, with "Illustrative placeholder figure, not a quote" set directly under it in mono.
- **Risks:**
  - It is the most opinionated option.
  - Giant numbers make invented figures look authoritative, so the placeholder line under the figure must never be removed.
  - The logo needed an ink-outlined plate. On cream, its own off-white box shows.
- **Contrast:**
  - Lowest text pair: 4.80:1 (selected-blank text).
  - Lowest border pair: 3.35:1 (notice border).

## 3. Research Note

- **Palette.**

  | Role | Hex |
  |---|---|
  | Warm paper | `#f6f4ef` |
  | Text | `#1c1c1a` |
  | Secondary | `#5c5a55` |
  | Rules | `#d6d1c7` |
  | Accent, deepened steel | `#466577` |
  | Accent text | `#3d5a6b` |
  | Saved | `#1f6b5e` |
  | Today greys | `#2a2a28` / `#43413d` |

- **Fonts:** Newsreader (serif, Google Fonts) for headings, figure titles, the estimate and the hero figure. Hanken Grotesk for body and UI.
- **Shape:**
  - 2px corners and no shadows. Sections sit on the paper between 1px ink rules, not in cards.
  - The estimate becomes a margin note with a single vertical rule.
  - A double rule sits above the result.
- **Why it feels authored:** every chart is "Figure n." in italic serif. Each chart ends with a source-and-note line: "Source: InfraVana cost model on illustrative price tables. Note: all figures are invented placeholders, not quotes." That puts provenance where a reader expects it.
- **Risks:** it is calm rather than "leading edge", it can read as a blog, and serif text at small sizes needs care.
- **Contrast:**
  - Lowest text pair: 5.78:1.
  - Lowest border pair: 3.30:1 (input borders on paper).

## 4. Blueprint

- **Palette.**

  | Role | Hex |
  |---|---|
  | Near-white ground | `#fbfbfa` |
  | Panels | white |
  | Text | `#111314` |
  | Secondary | `#555b60` |
  | Dashed construction lines | `#c9ced2` |
  | Accent | `#2f6f93` |
  | Accent text | `#275f7e` |
  | Saved | `#1f6b5e` |
  | Today greys | `#222222` / `#454545` |

  The accent is steel-cobalt: the logo's own hue (202°), saturated to 52%. That is a deliberate change of tone, not a new hue.
- **Fonts:** Schibsted Grotesk for headings and body. Spline Sans Mono for labels, buttons, chips and figures. Both are from Google Fonts.
- **Shape:**
  - Radius 0, no shadows.
  - Registration ticks on two corners of every panel.
  - Dashed rules and a dashed estimate box.
  - Every chart title is tagged "ILLUSTRATIVE DATA".
- **Why it feels authored:** the headline saving is drawn with a dimension line under it, with end ticks, as on an engineering drawing.
- **Risks:**
  - It is closest to a single reference site (Baseten), so it must stay a principle and not become a clone.
  - Schibsted's tabular figures space out "." and ",". I turned tabular figures off except in the estimate and the stats.
  - The logo's off-white box is faintly visible on phones.
- **Contrast:**
  - Lowest text pair: 5.50:1 (white chart label on the accent).
  - Lowest border pair: 3.62:1.

## 5. Analyst Desk

- **Palette.**

  | Role | Hex |
  |---|---|
  | Ground | `#f2f3f4` |
  | Panels | white |
  | Text | `#15171a` |
  | Secondary | `#535a60` |
  | Rules | `#d9dce0` |
  | Accent | `#3d6880` |
  | Accent text | `#345a6f` |
  | Saved | `#1f6b5e` |
  | Today greys | `#25282b` / `#43474b` |

- **Fonts:** IBM Plex Sans for UI and IBM Plex Mono for every figure. Both are from Google Fonts.
- **Shape:** a compact 14px base, 3px corners and no shadows. 11px uppercase panel labels, a full-width white header bar, and a 1280px layout.
- **Why it feels authored:**
  - Every chart shows its own data table beside it. The table already existed for screen readers and is now visible.
  - The headline is a summary row: the figure, the stats and the call to action on one line.
  - It says "check our numbers".
- **Risks:**
  - It is the least distinctive option, and it is dense for someone arriving from the intake.
  - The table is now read twice by screen readers. A real build should give the visible table `aria-hidden` or remove the hidden copy.
- **Contrast:**
  - Lowest text pair: 6.02:1.
  - Lowest border pair: 3.10:1 (input borders on the grey ground).

## Contrast method and full tables

**Method.** WCAG 2.x relative luminance, computed with python3 -I using only the standard library, on the exact token values each option sets. The script reads the theme CSS files directly: `tools/contrast.py`.

**Coverage, per option.** 32 pairs:
- body and secondary text on page, panel and muted panel;
- accent text, button labels, the segmented control;
- white or dark chart labels on every bar fill;
- the saved fill and outline, axis ticks;
- every chart mark against the chart's ground, the budget line;
- input borders, notices, the focus ring.

**Result.** 0 failures after the fixes. Full tables: [`contrast-tables.md`](contrast-tables.md).

## What the pictures cannot show

- **Two screens in the brief do not exist in the current app.** The intake-v2 app has no album and no grid view: the charts are stacked under the headline. So I captured:
  - "Result: headline and first chart" in place of the album stage;
  - the whole result page in place of the grid view.
- **No chart patterns or provenance outlines.** The current app's charts draw no hatch patterns on the Today greys and no dashed or dotted provenance outlines, which `docs/design-tokens.md` specifies. The options therefore separate Today from the accent by lightness, hue and direct labels. Restoring the patterns is a separate decision; any of these themes can carry them.
