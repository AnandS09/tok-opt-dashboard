import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartDef, Results } from "../contract";
import { ChartBoundary } from "./ChartBoundary";
import { Drawer } from "./Drawer";
import { LazyThumb } from "./LazyThumb";

interface AlbumProps {
  slides: ChartDef[];
  results: Results;
  activeIndex: number;
  onSelect: (id: string) => void;
  presenting: boolean;
  onTogglePresent: () => void;
}

const SWIPE_DISTANCE = 50;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "SELECT" ||
    target.tagName === "TEXTAREA"
  );
}

/** Text of a chart function that may throw while a knob is mid-change. */
function attempt(fn: () => string, fallback = ""): string {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/**
 * The album of spec 4.1: one chart on the stage, a caption, arrows, a live
 * filmstrip, and a grid view. Slides arrive already in registry order and
 * already limited to registered charts, so `n/N` counts only those.
 */
export function Album({ slides, results, activeIndex, onSelect, presenting, onTogglePresent }: AlbumProps) {
  const [grid, setGrid] = useState(false);
  const [thumbsOpen, setThumbsOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [tableFor, setTableFor] = useState<string | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const total = slides.length;
  const active = slides[activeIndex];
  const Chart = active.Component;

  const go = (index: number) => {
    const next = Math.min(total - 1, Math.max(0, index));
    if (next !== activeIndex) onSelect(slides[next].id);
  };

  // Left and right arrow keys move through the album, except while typing or in a dialog.
  const goRef = useRef(go);
  goRef.current = go;
  const stateRef = useRef({ activeIndex });
  stateRef.current = { activeIndex };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
      // A modal dialog (How computed, Assumptions and data) owns the keys while it is open.
      if (document.querySelector('[aria-modal="true"]')) return;
      if (event.key === "ArrowLeft") goRef.current(stateRef.current.activeIndex - 1);
      else if (event.key === "ArrowRight") goRef.current(stateRef.current.activeIndex + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Announce the new slide to screen readers on slide change only, not on every knob move.
  const activeId = active.id;
  useEffect(() => {
    const def = slides.find((s) => s.id === activeId);
    if (!def) return;
    const index = slides.indexOf(def);
    setAnnouncement(
      `Slide ${index + 1} of ${slides.length}: ${def.title}. ${attempt(() => def.caption(results))}`,
    );
  }, [activeId]);

  const caption = attempt(() => active.caption(results));
  const showTable = tableFor === active.id;
  const csv = useMemo(() => attempt(() => active.toCsv(results)), [active, results]);
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <section className="album" aria-roledescription="carousel" aria-label="Charts">
      <div className="album__stage-row">
        <button
          type="button"
          className="arrow"
          aria-label="Previous chart"
          disabled={activeIndex === 0}
          onClick={() => go(activeIndex - 1)}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
            <path d="M8 1.5 3.5 6 8 10.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div
          className="stage"
          onPointerDown={(event) => {
            if (event.pointerType === "mouse") return;
            touchStart.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerUp={(event) => {
            const start = touchStart.current;
            touchStart.current = null;
            if (!start) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            if (Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5) {
              go(activeIndex + (dx < 0 ? 1 : -1));
            }
          }}
          onPointerCancel={() => {
            touchStart.current = null;
          }}
        >
          <figure className={showTable ? "stage__figure stage__figure--table" : "stage__figure"} key={active.id} id="album-stage" aria-labelledby="stage-title" aria-describedby="stage-caption">
            <h2 id="stage-title" className="stage__title">{active.title}</h2>
            <div className="stage__chart">
              <ChartBoundary resetKey={results}>
                <Chart results={results} size="stage" />
              </ChartBoundary>
            </div>
            <figcaption id="stage-caption" className="stage__caption">{caption}</figcaption>
            <p className="stage__placeholder">
              Invented placeholder data: every price, cost and token count on this chart is made up.
            </p>
          </figure>
        </div>

        <button
          type="button"
          className="arrow"
          aria-label="Next chart"
          disabled={activeIndex === total - 1}
          onClick={() => go(activeIndex + 1)}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
            <path d="M4 1.5 8.5 6 4 10.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="album__actions">
        <button type="button" className="button" aria-haspopup="dialog" onClick={() => setHowOpen(true)}>
          How computed
        </button>
        <a className="button button--link" href={csvHref} download={`${active.id}-data.csv`}>
          Download CSV
        </a>
        <button type="button" className="button" aria-pressed={presenting} onClick={onTogglePresent}>
          {presenting ? "Exit fullscreen" : "Fullscreen"}
        </button>
      </div>

      <button
        type="button"
        className="link-button album__table-toggle"
        aria-expanded={showTable}
        onClick={() => setTableFor(showTable ? null : active.id)}
      >
        {showTable ? "Hide the data table" : "Show the data behind this chart as a table"}
      </button>

      <div className="film">
        <div className="film__bar">
          <p className="film__count">
            {activeIndex + 1}/{total}
          </p>
          <div className="dots" role="group" aria-label="Choose a chart">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                className="dot"
                aria-label={`Chart ${i + 1}: ${slide.title}`}
                aria-current={i === activeIndex ? "true" : undefined}
                onClick={() => onSelect(slide.id)}
              />
            ))}
          </div>
          <button
            type="button"
            className="button film__thumbs-toggle"
            aria-expanded={thumbsOpen}
            aria-controls="filmstrip"
            onClick={() => setThumbsOpen((open) => !open)}
          >
            Thumbnails
          </button>
          <button
            type="button"
            className="button"
            aria-pressed={grid}
            onClick={() => setGrid((on) => !on)}
          >
            Grid view
          </button>
        </div>
        <ul
          id="filmstrip"
          className={[
            "film__strip",
            grid ? "film__strip--grid" : "",
            thumbsOpen ? "film__strip--open" : "",
          ].join(" ")}
          aria-label="Chart thumbnails"
        >
          {slides.map((slide, i) => (
            <li key={slide.id} className="film__item">
              <button
                type="button"
                className="thumb"
                aria-current={i === activeIndex ? "true" : undefined}
                onClick={() => onSelect(slide.id)}
              >
                <LazyThumb def={slide} results={results} />
                <span className="thumb__label">
                  {i + 1}. {slide.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </div>

      {howOpen ? (
        <Drawer title={`How this is computed: ${active.title}`} onClose={() => setHowOpen(false)}>
          <p>{active.howComputed}</p>
          <p className="drawer__note">
            Every InfraVana number comes from the data tables through the same calculation, with no fixed
            multipliers. All data in this mock is invented placeholder data.
          </p>
          <p>
            <a href={csvHref} download={`${active.id}-data.csv`}>Download the rows this chart plots (CSV)</a>
          </p>
        </Drawer>
      ) : null}
    </section>
  );
}
