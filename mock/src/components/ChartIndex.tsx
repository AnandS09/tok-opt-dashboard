import { useEffect, useId, useRef, useState, useSyncExternalStore, type Ref } from "react";
import type { ListedChart } from "../store/chartListing";
import { ChartGlyph } from "./ChartGlyph";

/** Phones: spec 4.1 turns the contents column into a picker below this width. */
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

/** Read out after the title of a listed chart that cannot be opened. */
export function unavailableNote(chart: ListedChart): string {
  if (chart.state === "planned") return "planned, not built yet";
  return "not shown for these answers";
}

interface ChartIndexProps {
  charts: readonly ListedChart[];
  /** Index (among the charts the stage shows) of the chart in focus. */
  active: number;
  /** Called with the slide index of a chart that can be opened. */
  onPick: (slide: number) => void;
  gridOpen: boolean;
  onGrid: () => void;
  gridButton: Ref<HTMLButtonElement>;
}

interface ListProps {
  charts: readonly ListedChart[];
  active: number;
  onChoose: (slide: number) => void;
  className?: string;
  id?: string;
  hidden?: boolean;
}

/**
 * The ruled list of every listed chart (spec 15.8): a glyph of its form and its
 * title, no number. The chart in focus carries `aria-current`. A chart that is
 * listed but cannot be opened yet is an inert, announced item.
 */
function ChartList({ charts, active, onChoose, className, id, hidden }: ListProps) {
  return (
    <ol id={id} hidden={hidden} className={["chart-index__list", className].filter(Boolean).join(" ")}>
      {charts.map((chart) => {
        const open = chart.slide !== null;
        return (
          <li key={chart.id}>
            <button
              type="button"
              className="chart-index__item"
              data-chart={chart.id}
              aria-current={open && chart.slide === active ? "true" : undefined}
              aria-disabled={open ? undefined : true}
              onClick={() => {
                if (chart.slide !== null) onChoose(chart.slide);
              }}
            >
              <ChartGlyph form={chart.glyph} className="chart-index__glyph" />
              <span className="chart-index__title">{chart.title}</span>
              {open ? null : <span className="sr-only"> ({unavailableNote(chart)})</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function GridButton({ gridOpen, onGrid, gridButton }: Pick<ChartIndexProps, "gridOpen" | "onGrid" | "gridButton">) {
  return (
    <button ref={gridButton} type="button" className="button stage__grid-button" aria-pressed={gridOpen} onClick={onGrid}>
      Grid view
    </button>
  );
}

/**
 * The contents column (spec 15.8, board 08C): "Charts" with the count, one
 * ruled item per listed chart and the Grid view button under the list. Under
 * 600px it becomes one picker, showing the chart in focus with its glyph, with
 * Grid view beside it on the same row, that opens the same list.
 */
export function ChartIndex(props: ChartIndexProps) {
  const phone = usePhone();
  return phone ? <Picker {...props} /> : <Column {...props} />;
}

export function Column({ charts, active, onPick, gridOpen, onGrid, gridButton }: ChartIndexProps) {
  return (
    <nav className="chart-index" aria-label="Charts">
      <h2 className="chart-index__heading">
        <span>Charts</span>
        <span className="chart-index__count">{charts.length}</span>
      </h2>
      <ChartList charts={charts} active={active} onChoose={onPick} />
      <GridButton gridOpen={gridOpen} onGrid={onGrid} gridButton={gridButton} />
    </nav>
  );
}

export function Picker({ charts, active, onPick, gridOpen, onGrid, gridButton }: ChartIndexProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const current = charts.find((chart) => chart.slide === active);

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
      <div className="chart-index__row">
        <div className="chart-index__pick">
          <button
            ref={toggle}
            type="button"
            className="chart-index__toggle"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((o) => !o)}
          >
            {current ? <ChartGlyph form={current.glyph} className="chart-index__glyph" /> : null}
            <span className="chart-index__title">{current?.title}</span>
            <svg className="chart-index__caret" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">
              <path d="M2 4.5 6 8.5 10 4.5" />
            </svg>
          </button>
          <ChartList
            id={listId}
            hidden={!open}
            className="chart-index__list--menu"
            charts={charts}
            active={active}
            onChoose={(slide) => {
              setOpen(false);
              // The picked button is about to be hidden with the list: keep focus on the toggle (WCAG 2.4.3).
              toggle.current?.focus();
              onPick(slide);
            }}
          />
        </div>
        <GridButton gridOpen={gridOpen} onGrid={onGrid} gridButton={gridButton} />
      </div>
    </nav>
  );
}
