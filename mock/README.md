# Infravana Playground: static mock

Build step 1 of `spec.md` section 11. React + TypeScript + Vite, ECharts
(per-chart imports), PapaParse, plain CSS.

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

## Layout

| Path | Purpose |
|---|---|
| `src/contract.ts` | Types only: CSV rows, `Scenario`, `Results`, `ChartDef`, `ChartProps`. It is the interface between compute, charts and the page shell, so a change affects all three. |
| `src/charts/registry.ts` | `chartRegistry`, the ordered list of `ChartDef`s |
| `public/data/` | Fixture CSVs per spec 7.3 (invented placeholder data) |
| `src/App.tsx` | The page: loads the tables once, holds the one `Scenario` the knobs edit, calls `compute()` (throttled while a slider is dragged) and lays out the shell |
| `src/components/` | Header, guided questions and sentence (`Intake.tsx`), fine-tune inputs (`KnobRail.tsx`), hero result (`HeadlineStrip.tsx`), stacked chart cards, drawer, assumptions panel, footer |
| `src/store/` | Reducer for the page state, the guided questions (`intake.ts`), the three examples, mix rebalancing and the throttle hook |
| `src/styles/tokens.css` | The `:root` block of `docs/design-tokens.md`, pasted verbatim. The only file that may contain a hex colour. |
| `src/styles/app.css` | Layout and components, using only the tokens |

## How the shell behaves

- The data folder is fetched once at page load (`loadTables`). Changing an input only calls `compute(scenario, tables)`; nothing is fetched. The example chips fetch one scenario file each.
- The page opens on four one-click questions (team size, budget, main work, response speed). They write into the scenario of the first example. Once answered, they become an editable sentence at the top, with everything else under a collapsed "Fine-tune the assumptions". An example chip skips the questions. No language model is called.
- A scaling example (one with `target`) is shown at its target size.
- The result is a hero card (the saving in dollars, then as a percentage and a multiple), then the charts in `chartRegistry` order as stacked cards, limited to the ids the scenario lists, then a contact call to action. `CONTACT_URL` in `App.tsx` is a placeholder.
- A chart component must fill the width of its parent; its canvas height is `--chart-stage-height`.
