import type { GlyphForm } from "../store/chartListing";

/** Strokes of each form on a 16 by 16 box (spec 15.8, board 08): shape tells charts apart as well as the title. */
const STROKES: Record<Exclude<GlyphForm, "scatter">, string[]> = {
  bars: ["M2 4h11", "M2 8h8", "M2 12h10"],
  columns: ["M3 13V8", "M6.5 13V3", "M10 13V6", "M13 13V9"],
  step: ["M2 4h4v4h4v4h4"],
  line: ["M2 12l4-4 3 2 5-6"],
  flow: ["M2 4c5 0 7 8 12 8", "M2 12c5 0 7-8 12-8"],
};

const DOTS: [number, number][] = [
  [3, 12],
  [6, 9],
  [8, 12],
  [10, 6],
  [13, 4],
];

interface ChartGlyphProps {
  form: GlyphForm;
  /** Pixel size of the square box. */
  size?: number;
  className?: string;
}

/** A small glyph of a chart's form. It is decoration: the chart's title is its name. */
export function ChartGlyph({ form, size = 16, className }: ChartGlyphProps) {
  return (
    <svg
      className={["chart-glyph", className].filter(Boolean).join(" ")}
      data-form={form}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {form === "scatter"
        ? DOTS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" />)
        : STROKES[form].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
