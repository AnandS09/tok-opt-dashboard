import { useEffect, useId, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import type { ChartDef, Results } from "../contract";
import { wrapIndex, type StageDirection, type StageSlotContext } from "../store/stage";
import "../styles/stage.css";
import { ChartBoundary } from "./ChartBoundary";
import { ChartIndex } from "./ChartIndex";
import { Drawer } from "./Drawer";
import { GridView } from "./GridView";
import { BenefitsSlot } from "./StageSlots";

/** A horizontal swipe counts from this distance, and only when it is mostly sideways. */
const SWIPE_PX = 48;
const SWIPE_RATIO = 1.5;

/** Controls that use the left and right arrow keys themselves, so the stage leaves them alone. */
const OWN_ARROWS =
  'input:not([type="checkbox"]):not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select, ' +
  '[contenteditable=""], [contenteditable="true"], [role="slider"], [role="radio"], [role="tab"], ' +
  '[role="spinbutton"], [role="listbox"], [role="menu"], [role="menuitem"]';

interface StageProps {
  slides: readonly ChartDef[];
  results: Results;
  /** Index into `slides` of the chart in focus. */
  active: number;
  direction: StageDirection;
  ctx: StageSlotContext;
  onSlide: (index: number, direction: StageDirection) => void;
}

function Chevron({ side }: { side: "left" | "right" }) {
  return (
    <svg className="stage__chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d={side === "left" ? "M10.5 3 5.5 8l5 5" : "M5.5 3l5 5-5 5"} />
    </svg>
  );
}

interface StageBodyProps {
  direction: StageDirection;
  def: ChartDef;
  results: Results;
  ctx: StageSlotContext;
  onHow: () => void;
}

/**
 * What changes with the chart: the takeaway or boxes, the chart and the "how"
 * link. The slide direction is read once when it appears, so a later redraw
 * cannot cut the transition short.
 */
function StageBody({ direction, def, results, ctx, onHow }: StageBodyProps) {
  const [arrival] = useState(direction);
  return (
    <div className="stage__body" data-direction={arrival}>
      <BenefitsSlot def={def} results={results} ctx={ctx} />
      <ChartBoundary resetKey={results}>
        <def.Component results={results} size="stage" />
      </ChartBoundary>
      <button type="button" className="link-button chart-card__how" aria-haspopup="dialog" onClick={onHow}>
        How is this worked out?
      </button>
    </div>
  );
}

/**
 * The stage (spec 4.1): one chart in focus, picked by the numbered index, the
 * arrows, the left and right keys, a swipe or the grid view. The chart is
 * drawn through its own component at stage size; a change slides the new
 * chart in over the fade token's duration (none under reduced motion).
 */
export function Stage({ slides, results, active, direction, ctx, onSlide }: StageProps) {
  const [gridOpen, setGridOpen] = useState(false);
  const [how, setHow] = useState<ChartDef | null>(null);
  const gridButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const count = slides.length;
  const def = slides[active];
  // The chart whose body is on screen, so a body that comes back (the grid closed) does not replay the slide.
  const shown = useRef<string | null>(null);
  useEffect(() => {
    if (!gridOpen && def) shown.current = def.id;
  }, [gridOpen, def]);

  const step = (delta: number) => {
    if (count < 2) return;
    onSlide(wrapIndex(active, delta, count), delta > 0 ? "next" : "prev");
  };
  const pick = (index: number) => {
    if (index === active) return;
    onSlide(index, index > active ? "next" : "prev");
  };
  const pickFromGrid = (index: number) => {
    if (index !== active) onSlide(index, "jump");
    setGridOpen(false);
    gridButton.current?.focus();
  };

  // Left and right arrow keys, anywhere on the page except in a control that uses them or under a dialog.
  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    if (gridOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (document.querySelector('[aria-modal="true"]')) return;
      if (event.target instanceof Element && event.target.closest(OWN_ARROWS)) return;
      event.preventDefault();
      stepRef.current(event.key === "ArrowRight" ? 1 : -1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [gridOpen]);

  // Escape leaves the grid without choosing.
  useEffect(() => {
    if (!gridOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      setGridOpen(false);
      gridButton.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [gridOpen]);

  // Swipe: a mostly horizontal touch of at least 48px; left goes to the next chart.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (event: TouchEvent) => {
    const t = event.touches.length === 1 ? event.touches[0] : null;
    touchStart.current = t ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const from = touchStart.current;
    touchStart.current = null;
    const t = event.changedTouches[0];
    if (!from || !t) return;
    const dx = t.clientX - from.x;
    const dy = t.clientY - from.y;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > SWIPE_RATIO * Math.abs(dy)) step(dx < 0 ? 1 : -1);
  };

  if (!def) return null;
  const figure = active + 1;
  const style = { "--figure-number": `"${figure}"` } as CSSProperties;

  return (
    <section className="stage" aria-label="Charts">
      <div className="stage__bar">
        <ChartIndex slides={slides} active={active} onPick={pick} />
        <button
          ref={gridButton}
          type="button"
          className="button stage__grid-button"
          aria-pressed={gridOpen}
          onClick={() => setGridOpen((open) => !open)}
        >
          Grid view
        </button>
      </div>

      {/* The title of the chart in focus, read out on every change (spec 4.1 acceptance 6). */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Figure ${figure} of ${count}: ${def.title}`}
      </div>

      {gridOpen ? (
        <GridView slides={slides} results={results} active={active} onPick={pickFromGrid} />
      ) : (
        <section
          className="chart-card card stage__panel"
          aria-labelledby={titleId}
          style={style}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchCancel={() => {
            touchStart.current = null;
          }}
        >
          <div className="stage__head">
            <button
              type="button"
              className="stage__arrow"
              aria-label="Previous chart"
              disabled={count < 2}
              onClick={() => step(-1)}
            >
              <Chevron side="left" />
            </button>
            <h2 id={titleId} className="chart-card__title stage__title">
              {def.title}
            </h2>
            <button
              type="button"
              className="stage__arrow"
              aria-label="Next chart"
              disabled={count < 2}
              onClick={() => step(1)}
            >
              <Chevron side="right" />
            </button>
          </div>
          {/* Keyed by chart, so the arrival of a new chart (and only that) plays the transition. */}
          <StageBody
            key={def.id}
            direction={shown.current === def.id ? "none" : direction}
            def={def}
            results={results}
            ctx={ctx}
            onHow={() => setHow(def)}
          />
        </section>
      )}

      {how ? (
        <Drawer title={how.title} onClose={() => setHow(null)}>
          <p>{how.howComputed}</p>
        </Drawer>
      ) : null}
    </section>
  );
}
