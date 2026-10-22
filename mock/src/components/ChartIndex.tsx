import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { ChartDef } from "../contract";

/** Phones: spec 4.1 collapses the index below this width. */
const PHONE_QUERY = "(max-width: 599.98px)";

function subscribePhone(onChange: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function isPhone(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(PHONE_QUERY).matches;
}

/** True under 600px wide, and follows the window as it is resized. */
export function usePhone(): boolean {
  return useSyncExternalStore(subscribePhone, isPhone, () => false);
}

interface ChartIndexProps {
  slides: readonly ChartDef[];
  active: number;
  onPick: (index: number) => void;
}

/**
 * The numbered, titled index (spec 4.1): "1 Where the money goes", "2 ...",
 * the active item marked with `aria-current`. The numbers are the ones of
 * the "Figure n." titles. Under 600px it collapses to one button reading
 * "2 / 4 What the budget buys" that opens the full list.
 */
export function ChartIndex({ slides, active, onPick }: ChartIndexProps) {
  const phone = usePhone();
  return phone ? (
    <CompactIndex slides={slides} active={active} onPick={onPick} />
  ) : (
    <nav className="chart-index" aria-label="Charts">
      <ol className="chart-index__list">
        {slides.map((def, i) => (
          <li key={def.id}>
            <button
              type="button"
              className="chart-index__item"
              aria-current={i === active ? "true" : undefined}
              onClick={() => onPick(i)}
            >
              <span className="chart-index__num">{i + 1}</span>
              <span className="chart-index__title">{def.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function CompactIndex({ slides, active, onPick }: ChartIndexProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const current = slides[active];

  // A click or touch outside, or Escape, closes the list.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: Event) => {
      if (root.current && event.target instanceof Node && !root.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <nav className="chart-index chart-index--compact" aria-label="Charts" ref={root}>
      <button
        ref={toggle}
        type="button"
        className="chart-index__toggle"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="chart-index__count">
          {active + 1} / {slides.length}
        </span>
        <span className="chart-index__title">{current?.title}</span>
        <svg className="chart-index__caret" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">
          <path d="M2 4.5 6 8.5 10 4.5" />
        </svg>
      </button>
      <ol id={listId} className="chart-index__list chart-index__list--menu" hidden={!open}>
        {slides.map((def, i) => (
          <li key={def.id}>
            <button
              type="button"
              className="chart-index__item"
              aria-current={i === active ? "true" : undefined}
              onClick={() => {
                setOpen(false);
                onPick(i);
              }}
            >
              <span className="chart-index__num">{i + 1}</span>
              <span className="chart-index__title">{def.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
