# Infravana Playground: static mock

The static mock, built to `spec.md` (v0.3): v0.2 build steps 1 to 3 are done
and the v0.3 order of section 11 continues from them. React + TypeScript +
Vite, ECharts (per-chart imports), PapaParse, plain CSS.

**All data in this mock is invented placeholder data. It is not measured and
must never be presented as measured.**

## Commands

Run from this directory.

| Command | Does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server |
| `npm run build` | Typecheck, then production build into `dist/` |
| `npm run typecheck` | `tsc --noEmit` for `src/` and `vite.config.ts` |
| `node scripts/check-demand.mjs` | Checks demand per basis: S1, S2 and the chip-design example still give their recorded numbers, and the customer count scales only customer workloads. Prints `check-demand: ok` or fails with the broken assertion. |

## Layout

| Path | Purpose |
|---|---|
| `src/contract.ts` | Types only: CSV rows, `Scenario`, `Results`, `ChartDef`, `ChartProps`. It is the interface between compute, charts and the page shell, so a change affects all three. |
| `src/charts/benefits.ts` | The benefit boxes of C1, C3 and C5 (spec 6.4): candidates in table order, the first three that are non-zero and do not repeat the tab's headline; every number derived from `Results` and the `BenefitContext`, each box naming its comparator. `components/BenefitBoxes.tsx` draws them (`styles/benefits.css`) and keeps the caption as their accessible name. |
| `src/charts/registry.ts` | `chartRegistry`, the ordered list of `ChartDef`s |
| `public/data/` | Fixture CSVs per spec 7.3 (invented placeholder data) |
| `src/App.tsx` | The page: loads the tables once, holds the one `Scenario` the knobs edit, calls `compute()` (throttled while a slider is dragged) and lays out the shell |
| `src/components/` | Header, guided questions and sentence (`Intake.tsx`), fine-tune inputs (`KnobRail.tsx`), hero result (`HeadlineStrip.tsx`), stacked chart cards, drawer, assumptions panel, footer |
| `src/store/` | Reducer for the page state, the guided questions (`intake.ts`), the three examples, mix rebalancing and the throttle hook |
| `src/styles/tokens.css` | The Research Note tokens of spec 14 (values of `docs/theme-options/source/d1-research-note.css`; fonts in `fonts.css` and `public/fonts/`, self-hosted). The only file that may contain a hex colour. |
| `src/styles/app.css` | Layout and components, using only the tokens |

## How the shell behaves

- The data folder is fetched once at page load (`loadTables`). Changing an input only calls `compute(scenario, tables)`; nothing is fetched. The example chips fetch one scenario file each.
- The page opens on the company type (five cards, plus a contact link for compute sellers). It pre-fills the work, how the company buys AI and a customer count, and the questions that follow adapt to it: the work (multi-select, Continue), team size only when team work is picked, customers only when customer work is picked, budget and response speed. A progress bar, Back and chips of the answers so far (each jumps back to its step) sit above the question, and "Your estimate" beside it (a bar pinned to the bottom on narrow screens) recomputes after every answer. The answers write into the scenario of the first example. Once answered, they become an editable sentence at the top (the work blank opens a checkbox popover), with everything else under a collapsed "Fine-tune the assumptions". An example chip skips the questions and loads its scenario file unchanged. No language model is called.
- Picked work splits evenly within its basis (team work over the team, customer work over the customers), and the model mix is the share-weighted blend of the picked workloads' usual mixes. The fine-tune sliders set exact shares, one group per basis.
- A scaling example (one with `target`) is shown at its target size.
- The result is a hero card (the saving in dollars, then as a percentage and a multiple), then the charts in `chartRegistry` order as stacked cards, limited to the ids the scenario lists, then a contact call to action. `CONTACT_URL` in `App.tsx` is a placeholder.
- A chart component must fill the width of its parent; its canvas height is `--chart-stage-height`.
