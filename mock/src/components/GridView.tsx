import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ChartDef, Results } from "../contract";
import { useThrottledValue } from "../store/useThrottledValue";
import { ChartBoundary } from "./ChartBoundary";

/** Pause between thumbnail redraws normally, and while a slider is being dragged. */
const THUMB_MS = 150;
const THUMB_DRAG_MS = 700;

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
  slides: readonly ChartDef[];
  results: Results;
  active: number;
  onPick: (index: number) => void;
}

/**
 * The contact sheet of spec 4.1: a live, non-interactive thumbnail of every
 * chart, two columns on phones. Choosing one brings it into focus (the stage
 * closes the grid). The thumbnails redraw from a throttled copy of the
 * results, much more slowly while a slider is dragged, so they never make a
 * drag lag.
 */
export function GridView({ slides, results, active, onPick }: GridViewProps) {
  const dragging = useSliderDragging();
  const thumbResults = useThrottledValue(results, dragging ? THUMB_DRAG_MS : THUMB_MS);
  const current = useRef<HTMLButtonElement>(null);

  // Focus lands on the chart that was in focus, so the keyboard starts where the visitor was.
  useEffect(() => {
    current.current?.focus({ preventScroll: true });
  }, []);

  return (
    <ul className="grid-view" aria-label="All charts">
      {slides.map((def, i) => (
        <li key={def.id} className="grid-view__cell">
          <button
            ref={i === active ? current : undefined}
            type="button"
            className="grid-view__item"
            aria-current={i === active ? "true" : undefined}
            onClick={() => onPick(i)}
          >
            <span className="grid-view__num">{i + 1}</span>
            <span className="grid-view__title">{def.title}</span>
          </button>
          {/* A picture of the chart: out of the reading order and out of the pointer's way. */}
          <div className="grid-view__thumb" aria-hidden="true">
            <WhenInView>
              <ChartBoundary resetKey={thumbResults}>
                <def.Component results={thumbResults} size="thumb" />
              </ChartBoundary>
            </WhenInView>
          </div>
        </li>
      ))}
    </ul>
  );
}
