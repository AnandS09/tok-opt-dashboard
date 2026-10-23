import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { ChartDef, GoalView, Results } from "../contract";
import type { ListedChart } from "../store/chartListing";
import { balancedGrid, CHART_GRID_DESKTOP, CHART_GRID_PHONE } from "../store/gridLayout";
import { useThrottledValue } from "../store/useThrottledValue";
import { ChartBoundary } from "./ChartBoundary";
import { ChartGlyph } from "./ChartGlyph";
import { unavailableNote, usePhone } from "./ChartIndex";

/** Pause between thumbnail redraws normally, and while a slider is being dragged. */
const THUMB_MS = 150;
const THUMB_DRAG_MS = 700;

/** Width assumed where nothing is measured (server render, a test with no layout): the page's own width. */
const UNMEASURED_WIDTH = 1040;

/** True from the moment a range input is pressed until the pointer is released. */
function useSliderDragging(): boolean {
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('input[type="range"]')) setDragging(true);
    };
    const onUp = () => setDragging(false);
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onUp, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
    };
  }, []);
  return dragging;
}

/** The content width of `ref`'s element, kept current as the window or the page changes. */
function useWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver !== "function") return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width || UNMEASURED_WIDTH;
}

/**
 * Draws its children only while the box is on screen (or just off it), so a
 * long grid does not keep every chart alive. The box keeps the thumbnail's
 * 16:9 shape either way, so nothing moves when a chart appears.
 */
function WhenInView({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const supported = typeof IntersectionObserver === "function";
  const [visible, setVisible] = useState(!supported);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver((entries) => setVisible(entries.some((e) => e.isIntersecting)), {
      rootMargin: "160px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} className="grid-view__frame">
      {visible ? children : null}
    </div>
  );
}

interface GridViewProps {
  /** Every listed chart, in order (spec 15.8): built ones draw a thumbnail, the rest a stand-in tile. */
  charts: readonly ListedChart[];
  /** The charts the stage shows, for the thumbnails and the wide tiles' takeaway. */
  slides: readonly ChartDef[];
  results: Results;
  /** The goal tab the thumbnails are drawn for. */
  goalView: GoalView;
  /** Index among `slides` of the chart in focus. */
  active: number;
  onPick: (slide: number) => void;
}

/**
 * The contact sheet of spec 4.1 and the balanced grid of spec 15.13: a live,
 * non-interactive thumbnail of every built chart and a dashed stand-in tile
 * for each one not built yet. The column count follows the container width and
 * the tile count, with wide tiles (a thumbnail of the usual size beside the
 * chart's takeaway) where no count fills every row. Choosing a tile brings its
 * chart into focus (the stage closes the grid). The thumbnails redraw from a
 * throttled copy of the results, much more slowly while a slider is dragged,
 * so they never make a drag lag.
 */
export function GridView({ charts, slides, results, goalView, active, onPick }: GridViewProps) {
  const dragging = useSliderDragging();
  const thumbResults = useThrottledValue(results, dragging ? THUMB_DRAG_MS : THUMB_MS);
  const thumbGoalView = useThrottledValue(goalView, dragging ? THUMB_DRAG_MS : THUMB_MS);
  const current = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const phone = usePhone();
  const width = useWidth(list);
  const layout = balancedGrid(charts.length, width, phone ? CHART_GRID_PHONE : CHART_GRID_DESKTOP);

  // Focus lands on the chart that was in focus, so the keyboard starts where the visitor was.
  useEffect(() => {
    current.current?.focus({ preventScroll: true });
  }, []);

  return (
    <ul
      ref={list}
      className="grid-view"
      aria-label="All charts"
      data-columns={layout.columns}
      data-wide={layout.wide}
      style={{ "--grid-columns": layout.columns } as CSSProperties}
    >
      {charts.map((chart, i) => {
        const wide = i < layout.wide;
        const slide = chart.slide;
        const def = slide === null ? undefined : slides[slide];
        const isCurrent = slide !== null && slide === active;
        const cell = ["grid-view__cell", wide ? "grid-view__cell--wide" : "", def ? "" : "grid-view__cell--planned"]
          .filter(Boolean)
          .join(" ");
        return (
          <li key={chart.id} className={cell} data-chart={chart.id}>
            {def && slide !== null ? (
              <button
                ref={isCurrent ? current : undefined}
                type="button"
                className="grid-view__item"
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => onPick(slide)}
              >
                <span className="grid-view__title">{def.title}</span>
              </button>
            ) : (
              <span className="grid-view__item">
                <span className="grid-view__title">{chart.title}</span>
                <span className="sr-only"> ({unavailableNote(chart)})</span>
              </span>
            )}
            <div className="grid-view__body">
              {def ? (
                // A picture of the chart: out of the reading order and out of the pointer's way.
                <div className="grid-view__thumb" aria-hidden="true">
                  <WhenInView>
                    <ChartBoundary resetKey={thumbResults}>
                      <def.Component results={thumbResults} size="thumb" goalView={thumbGoalView} />
                    </ChartBoundary>
                  </WhenInView>
                </div>
              ) : (
                <div className="grid-view__thumb grid-view__stand-in" aria-hidden="true">
                  <ChartGlyph form={chart.glyph} size={40} className="grid-view__stand-in-glyph" />
                  <span className="grid-view__stand-in-label">Planned chart</span>
                </div>
              )}
              {wide ? (
                <p className="grid-view__takeaway">
                  {def ? def.caption(thumbResults, thumbGoalView) : `This chart is ${unavailableNote(chart)}.`}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
