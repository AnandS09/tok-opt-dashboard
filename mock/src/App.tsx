import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { chartRegistry } from "./charts/registry";
import { AssumptionsPanel } from "./components/AssumptionsPanel";
import { ChartSections } from "./components/ChartSections";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HeadlineStrip } from "./components/HeadlineStrip";
import { IntakeQuestions, IntakeSentence } from "./components/Intake";
import { KnobRail } from "./components/KnobRail";
import { Notice } from "./components/Notice";
import { openShareOf, ResultNotices } from "./components/ResultNotices";
import { Skeleton } from "./components/Skeleton";
import { compute } from "./compute";
import type { Results, Scenario, ScenarioResponse } from "./contract";
import { loadScenario, loadTables } from "./data/load";
import { appReducer, initialState } from "./store/appState";
import { EXAMPLES, type Example } from "./store/examples";
import { useThrottledValue } from "./store/useThrottledValue";

/** Folder of the data files, relative to the page so the bundle can be mounted under a sub-path. */
const DATA_URL = `${import.meta.env.BASE_URL}data/`;
/** Pause between recomputations while a slider is dragged. */
const RECOMPUTE_MS = 120;
// ponytail: placeholder until the site has a contact page or address; swap in the real link.
const CONTACT_URL = "#contact";
/** Scenario fields the guided questions set, so they are no longer "assumed". */
const ANSWERED = ["users", "baseline", "budget", "workload_mix", "latency_class"];

/**
 * A scaling example is shown at its target size: the charts compare one plan,
 * so the plan shown is the one being planned for.
 */
function atTarget(response: ScenarioResponse): ScenarioResponse {
  const { target, ...rest } = response.scenario;
  return target ? { ...response, scenario: { ...rest, baseline: target } } : response;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [panelOpen, setPanelOpen] = useState(false);
  // The guided questions show until they are answered or an example is picked.
  const [answered, setAnswered] = useState(false);
  const loadSeq = useRef(0);
  const situationRef = useRef<HTMLElement>(null);

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

  /** Loads an example; true once it is the scenario on the page. */
  const openExample = useCallback(
    async (example: Example): Promise<boolean> => {
      if (!tables) return false;
      const seq = ++loadSeq.current;
      dispatch({ type: "example_loading", exampleId: example.id });
      try {
        const loaded = await loadScenario(DATA_URL, example.scenarioId);
        if (seq !== loadSeq.current) return false;
        dispatch({
          type: "example_loaded",
          exampleId: example.id,
          response: atTarget(loaded),
        });
        return true;
      } catch (error) {
        if (seq === loadSeq.current) dispatch({ type: "example_failed", message: messageOf(error) });
        return false;
      }
    },
    [tables],
  );

  // Load the first example once the tables are in: the guided questions start from its scenario.
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
  const answer = useCallback((update: (s: Scenario) => Scenario) => {
    dispatch({ type: "answer_edited", update });
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

  // The questions (and the focused control) are gone once answered: focus moves to the answers.
  useEffect(() => {
    if (answered) situationRef.current?.focus();
  }, [answered]);

  const pickExample = (example: Example) => {
    setAnswered(true);
    void openExample(example);
  };
  // The questions show only once the default scenario is back, so a late load never overwrites an answer.
  const startOver = async () => {
    if (await openExample(EXAMPLES[0])) setAnswered(false);
  };

  const openShare = results && liveScenario ? openShareOf(results, liveScenario) : null;

  let body;
  if (state.tablesError) {
    body = (
      <Notice title="The data tables could not be loaded" role="alert">
        {state.tablesError}
      </Notice>
    );
  } else if (!tables || (state.loadingExample && !response)) {
    body = <Skeleton label="Loading..." />;
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
  } else if (response && scenario && !answered) {
    body = (
      <>
        <IntakeQuestions
          tables={tables}
          onEdit={edit}
          onDone={() => {
            dispatch({ type: "scenario_committed", answered: ANSWERED });
            setAnswered(true);
          }}
        />
        <Examples activeId={null} onPick={pickExample} />
      </>
    );
  } else if (response && scenario) {
    body = (
      <>
        <section className="situation card" aria-label="Your situation" ref={situationRef} tabIndex={-1}>
          <IntakeSentence tables={tables} scenario={scenario} onEdit={answer} />
          <details className="finetune">
            <summary>Fine-tune the assumptions</summary>
            <KnobRail
              tables={tables}
              scenario={scenario}
              openShare={openShare}
              onEdit={edit}
              onReset={() => dispatch({ type: "scenario_reset" })}
            />
          </details>
          <div className="situation__foot">
            <Examples activeId={state.exampleId} onPick={pickExample} />
            <button type="button" className="link-button" onClick={() => void startOver()}>
              Start over
            </button>
          </div>
        </section>
        {state.exampleError ? (
          <Notice title="That example could not be opened" role="alert">
            {state.exampleError}
          </Notice>
        ) : null}
        {computed.error ? (
          <Notice title="These answers could not be worked out" role="alert">
            {computed.error} Try changing an answer back.
          </Notice>
        ) : null}
        {results ? (
          <>
            <HeadlineStrip results={results} contactUrl={CONTACT_URL} />
            <ResultNotices results={results} tables={tables} />
            <ChartSections slides={slides} results={results} />
            <section className="cta card" aria-label="Contact">
              <h2 className="cta__title">Want this with your real numbers?</h2>
              <p>We model your actual workloads, contracts and hardware options, and show what you can save.</p>
              <a className="button button--primary" href={CONTACT_URL}>
                Talk to us
              </a>
            </section>
          </>
        ) : computed.error ? null : (
          <Skeleton label="Working out your numbers..." />
        )}
      </>
    );
  }

  return (
    <div className="app">
      <Header />
      <main className="page" id="main-content">
        {body}
      </main>
      <Footer onOpenAssumptions={tables && response && answered ? () => setPanelOpen(true) : undefined} />
      {panelOpen && tables && response && scenario ? (
        <AssumptionsPanel
          tables={tables}
          response={response}
          stage={scenario.stage_today}
          onClose={() => setPanelOpen(false)}
        />
      ) : null}
    </div>
  );
}

/** The ready-made situations, as chips. */
function Examples({ activeId, onPick }: { activeId: string | null; onPick: (example: Example) => void }) {
  return (
    <div className="examples" role="group" aria-label="Examples">
      <span className="examples__label">Or try an example:</span>
      {EXAMPLES.map((example) => (
        <button
          key={example.id}
          type="button"
          className="chip"
          aria-pressed={example.id === activeId}
          onClick={() => onPick(example)}
        >
          {example.chip}
        </button>
      ))}
    </div>
  );
}
