/**
 * Where C10 writes "With InfraVana": a spot beside the frontier where the text touches no line. The
 * label is laid out in plot pixels against the shapes that can be in its way, so it never has a
 * line through it: the frontier's own steps, the thin drop line and ring of the visitor's setting,
 * every Today reference line and the Today markers. Pure: numbers in, a rectangle out.
 */

/** A rectangle in plot pixels (origin at the plot's top left). */
export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Everything in the plot the label must keep clear of, in plot pixels. */
export interface LabelObstacles {
  /** The frontier's vertices in drawing order, with the step already expanded (vertical at the start of each interval). */
  frontier: [number, number][];
  /** Stroke width of the frontier. */
  frontierWidth: number;
  /** The visitor's setting: the drop line's x and the ring's centre height, or null. */
  setting: { x: number; y: number; ring: number } | null;
  /** Heights of the horizontal Today reference lines, across the whole plot, and their stroke width. */
  todayLines: number[];
  todayWidth: number;
  /** Squares (centre and half-size) drawn on the plot: Today markers. */
  squares: { x: number; y: number; half: number }[];
  plotWidth: number;
  plotHeight: number;
}

/** The frontier as drawn with ECharts' `step: "start"`: each interval goes vertical at its start, then runs flat. */
export function stepPath(points: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  points.forEach(([x, y], i) => {
    const prev = points[i - 1];
    if (!prev) out.push([x, y]);
    else {
      out.push([prev[0], y]);
      out.push([x, y]);
    }
  });
  return out;
}

const overlaps = (r: Rect, a: Rect): boolean => r.x0 < a.x1 && r.x1 > a.x0 && r.y0 < a.y1 && r.y1 > a.y0;

/** How many obstacles the rectangle touches, with `clear` pixels of air around each line. */
export function hits(r: Rect, o: LabelObstacles, clear: number): number {
  let n = 0;
  const fw = o.frontierWidth / 2 + clear;
  for (let i = 1; i < o.frontier.length; i++) {
    const [ax, ay] = o.frontier[i - 1] as [number, number];
    const [bx, by] = o.frontier[i] as [number, number];
    const seg: Rect = { x0: Math.min(ax, bx) - fw, x1: Math.max(ax, bx) + fw, y0: Math.min(ay, by) - fw, y1: Math.max(ay, by) + fw };
    if (overlaps(r, seg)) n++;
  }
  if (o.setting) {
    const w = 0.5 + clear;
    if (overlaps(r, { x0: o.setting.x - w, x1: o.setting.x + w, y0: 0, y1: o.plotHeight })) n++;
    const q = o.setting.ring + clear;
    if (overlaps(r, { x0: o.setting.x - q, x1: o.setting.x + q, y0: o.setting.y - q, y1: o.setting.y + q })) n++;
  }
  const tw = o.todayWidth / 2 + clear;
  for (const y of o.todayLines) if (overlaps(r, { x0: 0, x1: o.plotWidth, y0: y - tw, y1: y + tw })) n++;
  for (const s of o.squares) if (overlaps(r, { x0: s.x - s.half - clear, x1: s.x + s.half + clear, y0: s.y - s.half - clear, y1: s.y + s.half + clear })) n++;
  return n;
}

export interface LabelSpot {
  rect: Rect;
  /** Obstacles still touched (0 for a clear spot). */
  hits: number;
}

/**
 * The first spot, walking the frontier from its left end, where a `width` by `height` label sits just under
 * (the wash's side) or just over a flat run of the frontier and touches nothing. Spots start 6px inside a run and
 * slide along it in 24px steps. When every spot is crowded, the one touching least is returned with its count,
 * and the caller gives it a paper background.
 */
export function placeNameLabel(o: LabelObstacles, width: number, height: number, gap: number, clear: number): LabelSpot | null {
  const path = o.frontier;
  const flats: { y: number; from: number; to: number }[] = [];
  for (let i = 1; i < path.length; i++) {
    const [ax, ay] = path[i - 1] as [number, number];
    const [bx, by] = path[i] as [number, number];
    if (ay === by && bx - ax >= 12) flats.push({ y: ay, from: ax, to: bx });
  }
  let best: LabelSpot | null = null;
  const inside = (r: Rect) => r.x0 >= 2 && r.x1 <= o.plotWidth - 2 && r.y0 >= 2 && r.y1 <= o.plotHeight - 2;
  for (const run of flats) {
    for (let x0 = run.from + 6; x0 <= run.to - 6; x0 += 24) {
      for (const side of ["below", "above"] as const) {
        const y0 = side === "below" ? run.y + o.frontierWidth / 2 + gap : run.y - o.frontierWidth / 2 - gap - height;
        const rect: Rect = { x0, x1: x0 + width, y0, y1: y0 + height };
        if (!inside(rect)) continue;
        const n = hits(rect, o, clear);
        if (n === 0) return { rect, hits: 0 };
        if (best === null || n < best.hits) best = { rect, hits: n };
      }
    }
  }
  return best;
}
