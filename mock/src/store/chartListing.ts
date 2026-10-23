/**
 * The charts the contents column and the grid view list (spec 15.8, 15.13):
 * every chart of the registry, C1 to C10, ten in all, in board 08's order.
 * The built charts come from `chartRegistry` (their title is the registry
 * title); the rest are planned and listed with their title and glyph so the
 * column and the grid are the size they will be. Nothing here shows an id or
 * a position to the visitor (spec 15.9).
 */
import type { ChartDef, ChartId } from "../contract";

/** The form a chart's glyph draws (spec 15.8): bars, columns, step line, line, scatter, flow. */
export type GlyphForm = "bars" | "columns" | "step" | "line" | "scatter" | "flow";

interface Planned {
  id: ChartId;
  title: string;
  glyph: GlyphForm;
}

/**
 * Board 08's ten items, in its order: the four built charts, then the six
 * planned ones. Titles of the built charts are repeated here only so the
 * glyph and the order live in one place; the page always shows the registry's
 * own title (`listCharts`), and a test keeps the two equal.
 */
export const CHART_LISTING: readonly Planned[] = [
  { id: "C1", title: "Where the money goes", glyph: "bars" },
  { id: "C5", title: "How much AI work the budget buys", glyph: "bars" },
  { id: "C3", title: "Price per million tokens, by model size", glyph: "columns" },
  { id: "C10", title: "What you can buy if you accept less", glyph: "step" },
  { id: "C2", title: "Efficiency frontier", glyph: "line" },
  { id: "C4", title: "Quality against cost", glyph: "scatter" },
  { id: "C6", title: "Where each kind of work runs", glyph: "flow" },
  { id: "C8", title: "How far the budget goes", glyph: "line" },
  { id: "C9", title: "Response time by hardware tier", glyph: "columns" },
  { id: "C7", title: "Before and after growth", glyph: "bars" },
];

/**
 * One listed chart. `slide` is its index among the charts the stage shows,
 * or null when it cannot be opened: `state` says why (not built yet, or built
 * but not part of this scenario).
 */
export interface ListedChart {
  id: ChartId;
  title: string;
  glyph: GlyphForm;
  slide: number | null;
  state: "shown" | "planned" | "hidden";
}

/**
 * The listing for the charts the stage shows (`slides`, registry order) out of
 * the whole registry (`registry`). A built chart missing from `slides` is
 * "hidden" for these answers; one with no `ChartDef` at all is "planned". A
 * built chart the listing does not know is added at the end with the bars glyph.
 */
export function listCharts(slides: readonly ChartDef[], registry: readonly ChartDef[] = slides): ListedChart[] {
  const listed = CHART_LISTING.map((entry): ListedChart => {
    const slide = slides.findIndex((def) => def.id === entry.id);
    const built = registry.find((def) => def.id === entry.id);
    return {
      id: entry.id,
      title: built?.title ?? entry.title,
      glyph: entry.glyph,
      slide: slide < 0 ? null : slide,
      state: slide >= 0 ? "shown" : built ? "hidden" : "planned",
    };
  });
  const known = new Set(CHART_LISTING.map((entry) => entry.id));
  slides.forEach((def, slide) => {
    if (!known.has(def.id)) listed.push({ id: def.id, title: def.title, glyph: "bars", slide, state: "shown" });
  });
  return listed;
}
