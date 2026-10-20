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
| `src/contract.ts` | Types only: CSV rows, `Scenario`, `Results`, `ChartDef`, `ChartProps`. It is the interface between compute, charts and the album shell, so a change affects all three. |
| `src/charts/registry.ts` | `chartRegistry`, the ordered list of `ChartDef`s |
| `public/data/` | Fixture CSVs per spec 7.3 (invented placeholder data) |
| `src/App.tsx` | The page: loads the tables once, holds the one `Scenario` the knobs edit, calls `compute()` (throttled while a slider is dragged) and lays out the shell |
| `src/components/` | Header, prompt strip, Understood strip, knob rail, headline strip, album (stage, filmstrip, grid view), drawer, assumptions panel, footer |
| `src/store/` | Reducer for the page state, the three example prompts, mix rebalancing, the throttle hook and the `#slide=ID` hash hook |
| `src/styles/tokens.css` | The `:root` block of `docs/design-tokens.md`, pasted verbatim. The only file that may contain a hex colour. |
| `src/styles/app.css` | Layout and components, using only the tokens |

## How the shell behaves

- The data folder is fetched once at page load (`loadTables`). Moving a knob only calls `compute(scenario, tables)`; nothing is fetched. The example chips fetch one scenario file each.
- The prompt is locked. The three example chips load a ready-made scenario through `loadScenario`; no language model is called. The first example opens on load so the album is never empty.
- The album shows the charts in `chartRegistry` order, limited to the ids the scenario lists. Ids with no registry entry are skipped, and `n/N` counts only registered charts. The active slide is kept in the URL hash (`#slide=C1`).
- A chart component must fill the width and height of its parent. The stage gives it a fixed-height box and the filmstrip a small one.
- On screens up to 900px wide the knobs become a bottom sheet and the filmstrip becomes dots plus a thumbnail drawer.
- Fullscreen hides everything except the stage, caption and action buttons.
