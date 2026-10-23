# Charts unit of the v0.4 build: screenshots and measurements

Built for spec 15.10 (Sources disclosure), 15.11 (solid hues and chart styling) and 15.12 (Azure palette), against the boards in `mock/docs/design-v0.4/`. All figures are invented placeholders, not quotes.

## The screenshots

Taken by `drive.mjs` from the built app (`mock/dist`) in headless Chrome at a device pixel ratio of 1, on the first example ("50 people, $100K a quarter", scenario S1), with reduced motion.

| File | Shows | Board it is compared with |
|---|---|---|
| `c1-1280.png` | C1, "Where the money goes", at 1280 | `palette/Azure-board.png` (Azure column, first chart) and the right-hand chart of `palette/02-before-after.png` |
| `c5-1280.png` | C5, "How much AI work the budget buys", at 1280 | `palette/Azure-board.png` (Azure column, second chart) |
| `c3-1280.png` | C3, "Price per million tokens", at 1280 | `palette/Azure-board.png` (Azure column, third chart) |
| `c10-1280.png`, `c10-1280-speed.png` | C10 in its quality and speed views at 1280 | `palette/Azure-board.png` (Azure column, fourth chart) |
| `c1-390.png` | The first chart at 390 | `palette/Azure-board.png` (390 phone, "Azure, first chart") |
| `c3-390.png`, `c5-390.png`, `c10-390.png` | The other charts at 390 (no board draws them) | none |
| `c1-1280-sources-open.png`, `c1-375-sources-open.png` | The disclosure opened, desktop and phone | `10-provenance.png`, columns "10 open" (desktop and phone) |

## What matches and what differs

- **Colour and chart styling match** the Azure column of `Azure-board.png`: the comparator wine, Today options brick, sienna and ochre in rank order, InfraVana azure, one teal "Saved $X" block, 24px bars with air between rows, no outlines, no y axis rule, bold row names only for the compared pair, quality in secondary ink with the cost bold, the budget line 1px; C3 as equal groups of bars; C10 with a 3px frontier, 2px Today lines, 6px points, a wash and swatched end labels; on a phone each row name above a full-width bar.
- **The figures differ** from the boards ($100K against $103K for the typical buyer, for example) because the boards were drawn from a different state of the app (the intake's budget step). The design is the same; the numbers are the app's own.
- **C3's second group** shows only an InfraVana bar in this scenario: no Today option buys a mid-size model here, and the group keeps its place in the equal-slot layout, as the board's does for the flagship class.
- **The Source cell of "Other Today options"** lists one "Price list" link per option, each named, where `10-provenance.png` draws one link for the row. Each option has its own address in the data, so one link would hide all but one.
- **"Figure n."** still heads each chart: removing it is R-9, not part of this unit.

## The 16 faults of `palette/01-diagnosis.png`

| # | Fault | Fixed by | Where it is checked |
|---|---|---|---|
| 1 | Slab bars | `barWidth` = `--chart-bar-thickness` (24px) in C1 and C5 | render check, `style.test.ts`, `drive.mjs` (measured 24px) |
| 2 | Broken y axis rule | `yAxis.axisLine.show: false` | render check, `style.test.ts` |
| 3 | Every row name bold | bold only for the compared pair | render check (rich styles) |
| 4 | Outlined, framed savings | a 2px paper gap drawn on each boundary, no outline | render check (gap series read through a stand-in for the drawing context), `drive.mjs` (measured 2px) |
| 5 | Today louder than InfraVana | the absolute chroma rule in the tokens | `tokens.test.ts` |
| 6 | Heavy budget line | 1px in `--color-text-secondary` | render check, `style.test.ts` |
| 7 | Bold end labels | rich text: quality secondary, cost bold | render check (option label) |
| 8 | Accent reads as data | `--color-section` is chrome only and used in no chart | `rules.test.ts` |
| 9 | Slabs against dots | C3 bars 13% of the class, at most 44px | render check, `style.test.ts`, `drive.mjs` |
| 10 | No rhythm in the hues | equal ladders in the palette | `palette.py --check` |
| 11 | Points cut the line | 6px points without a ring, 3px frontier, a wash | C10 check, `drive.mjs` |
| 12 | Thin C10 lines | 2px | C10 check, `drive.mjs` |
| 13 | Split, unlabelled saving | one "Saved $X" block, the two sources in the tooltip and the boxes | render check, `style.test.ts` |
| 14 | C3 marker staircase | every option a bar on the shared baseline | render check, `style.test.ts` |
| 15 | C10 unkeyed, tangled lines | a swatch in each end label, staggered end markers | C10 check |
| 16 | Cramped phone chart | row name above a full-width bar, rows 84px | render check, `style.test.ts`, `drive.mjs` (measured 84px) |

## Re-running

```
cd mock && npm run build
PLAYWRIGHT_CORE=<a folder whose node_modules holds playwright-core> node docs/build-v04/charts/drive.mjs . docs/build-v04/charts
```

`drive.mjs` is not a gate (it needs playwright-core and Chrome, which the project does not depend on). The gates are in `mock/README.md`.
