import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { chartRegistry } from "./charts/registry";
import { Album } from "./components/Album";
import { AssumptionsPanel, type PanelSection } from "./components/AssumptionsPanel";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HeadlineStrip } from "./components/HeadlineStrip";
import { KnobRail } from "./components/KnobRail";
import { Notice } from "./components/Notice";
import { openShareOf, ResultNotices } from "./components/ResultNotices";
import { PromptStrip } from "./components/PromptStrip";
import { Skeleton } from "./components/Skeleton";
import { UnderstoodStrip } from "./components/UnderstoodStrip";
import { compute } from "./compute";
import type { Results, Scenario } from "./contract";
import { loadScenario, loadTables } from "./data/load";
import { appReducer, initialState } from "./store/appState";
import { EXAMPLES, type Example } from "./store/examples";
import { useSlideHash } from "./store/useSlideHash";
import { useThrottledValue } from "./store/useThrottledValue";

/** Folder of the data files, relative to the page so the bundle can be mounted under a sub-path. */
const DATA_URL = `${import.meta.env.BASE_URL}data/`;
/** Pause between recomputations while a slider is dragged. */
const RECOMPUTE_MS = 120;

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [panel, setPanel] = useState<PanelSection | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [requestedSlide, setSlide] = useSlideHash();
  const loadSeq = useRef(0);

  const { tables, response, scenario } = state;

  // Fetch the data tables once. Nothing else is fetched when a knob moves.
  useEffect(() => {
    let cancelled = false;
    loadTables(DATA_URL).then(
      (loaded) => {
        if (!cancelled) dispatch({ type: "tables_loaded", tables: loaded });
      },
      (error: unknown) => {
        if (!cancelled) dispatch({ type: "tables_failed", message: messageOf(error) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const openExample = useCallback(
    async (example: Example) => {
      if (!tables) return;
      const seq = ++loadSeq.current;
      dispatch({ type: "example_loading", exampleId: example.id });
      try {
        const loaded = await loadScenario(DATA_URL, example.scenarioId);
        if (seq !== loadSeq.current) return;
        dispatch({
          type: "example_loaded",
          exampleId: example.id,
          response: loaded,
        });
      } catch (error) {
        if (seq === loadSeq.current) dispatch({ type: "example_failed", message: messageOf(error) });
      }
    },
    [tables],
  );

  // Open the first example once the tables are in, so the album is never an empty page.
  const opened = useRef(false);
  useEffect(() => {
    if (tables && !opened.current) {
      opened.current = true;
      void openExample(EXAMPLES[0]);
    }
  }, [tables, openExample]);

  const edit = useCallback((update: (s: Scenario) => Scenario) => {
    dispatch({ type: "scenario_edited", update });
  }, []);

  // Every knob change recomputes locally through compute(), throttled while a slider is dragged.
  const liveScenario = useThrottledValue(scenario, RECOMPUTE_MS);
  const computed = useMemo<{ results: Results | null; error: string | null }>(() => {
    if (!tables || !liveScenario || response?.verdict !== "ok") return { results: null, error: null };
    try {
      return { results: compute(liveScenario, tables), error: null };
    } catch (error) {
      return { results: null, error: messageOf(error) };
    }
  }, [tables, liveScenario, response?.verdict]);
  const { results } = computed;

  // Charts in registry order, limited to the ones the scenario asked for and that exist.
  const slides = useMemo(
    () => (response ? chartRegistry.filter((def) => response.charts.includes(def.id)) : []),
    [response],
  );
  const found = slides.findIndex((def) => def.id === requestedSlide);
  const activeIndex = found >= 0 ? found : 0;

  // A link to a slide that is not shown (not requested, or not registered) is rewritten to the
  // slide that is, so a copied link always matches the page.
  const shownId = slides[activeIndex]?.id;
  useEffect(() => {
    if (shownId !== undefined && requestedSlide !== null && found < 0) setSlide(shownId);
  }, [shownId, requestedSlide, found, setSlide]);

  // Presentation mode: hide the rails and use the browser's fullscreen where it exists.
  const togglePresent = useCallback(() => {
    if (presenting) {
      setPresenting(false);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    } else {
      setPresenting(true);
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
    }
  }, [presenting]);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && presenting && !document.fullscreenElement) setPresenting(false);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKey);
    };
  }, [presenting]);

  const openShare = results && liveScenario ? openShareOf(results, liveScenario) : null;

  let body;
  if (state.tablesError) {
    body = (
      <Notice title="The data tables could not be loaded" role="alert">
        {state.tablesError}
      </Notice>
    );
  } else if (!tables || (state.loadingExample && !response)) {
    body = <Skeleton label="Reading your scenario..." />;
  } else if (state.exampleError && !response) {
    body = (
      <Notice
        title="This example could not be opened"
        role="alert"
        action={
          <button type="button" className="button" onClick={() => void openExample(EXAMPLES[0])}>
            Open the default scenario
          </button>
        }
      >
        {state.exampleError}
      </Notice>
    );
  } else if (response && response.verdict !== "ok") {
    body = (
      <Notice title="This prompt did not produce a dashboard" role="alert">
        {response.reason_for_user || "The prompt could not be used."}
      </Notice>
    );
  } else if (response && scenario) {
    body = (
      <div className="workspace">
        <KnobRail
          id="knob-rail"
          tables={tables}
          scenario={scenario}
          openShare={openShare}
          onEdit={edit}
          onReset={() => dispatch({ type: "scenario_reset" })}
        />
        <div className="main" id="main-content" tabIndex={-1}>
          {state.exampleError ? (
            <Notice title="The other example could not be opened" role="alert">
              {state.exampleError}
            </Notice>
          ) : null}
          {computed.error ? (
            <Notice title="These knob values could not be computed" role="alert">
              {computed.error} Try Reset, or move a knob back.
            </Notice>
          ) : null}
          {results && liveScenario ? (
            <>
              <HeadlineStrip results={results} scenario={liveScenario} tables={tables} />
              <ResultNotices results={results} tables={tables} />
              {slides.length > 0 ? (
                <Album
                  slides={slides}
                  results={results}
                  activeIndex={activeIndex}
                  onSelect={setSlide}
                  presenting={presenting}
                  onTogglePresent={togglePresent}
                />
              ) : (
                <Notice title="None of the requested charts is available yet">
                  This mock draws only the charts that are registered. Pick another example.
                </Notice>
              )}
            </>
          ) : computed.error ? null : (
            <Skeleton label="Reading your scenario..." />
          )}
        </div>
        <button
          type="button"
          className="sheet-toggle button"
          aria-expanded={sheetOpen}
          aria-controls="knob-rail"
          onClick={() => setSheetOpen((open) => !open)}
        >
          {sheetOpen ? "Close knobs" : "Knobs"}
        </button>
      </div>
    );
  }

  return (
    <div className={["app", presenting ? "app--present" : "", sheetOpen ? "app--sheet-open" : ""].join(" ")}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to the charts
      </a>
      <Header
        disabled={!tables || !response}
        onOpenAssumptions={() => setPanel("assumptions")}
        onOpenData={() => setPanel("data")}
      />
      <main className="page">
        <PromptStrip
          activeId={state.exampleId}
          loading={state.loadingExample}
          disabled={!tables}
          onPick={(example) => void openExample(example)}
        />
        {tables && response && response.verdict === "ok" ? (
          <UnderstoodStrip response={response} tables={tables} />
        ) : null}
        {body}
      </main>
      <Footer tables={tables} />
      {panel && tables && response && scenario ? (
        <AssumptionsPanel
          tables={tables}
          response={response}
          stage={scenario.stage_today}
          section={panel}
          onClose={() => setPanel(null)}
        />
      ) : null}
    </div>
  );
}
