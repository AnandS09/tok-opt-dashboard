import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { chartRegistry } from "./charts/registry";
import { AssumptionsPanel } from "./components/AssumptionsPanel";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HeadlineStrip } from "./components/HeadlineStrip";
import { IntakeQuestions, IntakeSentence } from "./components/Intake";
import { KnobRail } from "./components/KnobRail";
import { Notice } from "./components/Notice";
import { openShareOf, ResultNotices } from "./components/ResultNotices";
import { Skeleton } from "./components/Skeleton";
import { Stage } from "./components/Stage";
import { ComparatorSlot, GoalTabsSlot } from "./components/StageSlots";
import type { GoalId, PatternId, Results, Scenario, ScenarioResponse } from "./contract";
import { loadScenario, loadTables } from "./data/load";
import { appReducer, initialState } from "./store/appState";
import { EXAMPLES, type Example } from "./store/examples";
import { goalTabStates, useGoalSolve } from "./store/goal";
import type { CompanyType } from "./store/intake";
import {
  activeIndex,
  computeForView,
  useStageHash,
  useStageState,
  withView,
  type StageDirection,
  type StageSlotContext,
} from "./store/stage";
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
  // Chart in focus, goal tab, comparator and the other fields the page address holds (spec 4.1).
  const [stage, stageDispatch] = useStageState();
  const { view } = stage;
  const [panelOpen, setPanelOpen] = useState(false);
  // The guided questions show until they are answered or an example is picked.
  const [answered, setAnswered] = useState(false);
  // Null until the visitor picks one; each example names its own.
  const [company, setCompany] = useState<CompanyType | null>(null);
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

  // Every knob change recomputes locally through compute() (computeForView), throttled while a slider is dragged.
  // The goal, comparator and G4 steps join the scenario here; the chart in focus does not, so changing chart never recomputes.
  const { goal, comparator, qualityStep, speedStep } = view;
  const viewedScenario = useMemo(
    () => (scenario && tables && answered ? withView(scenario, { goal, comparator, qualityStep, speedStep }, tables) : scenario),
    [scenario, tables, answered, goal, comparator, qualityStep, speedStep],
  );
  const liveScenario = useThrottledValue(viewedScenario, RECOMPUTE_MS);
  // G2 and G3 are solved on the worker, from the scenario as it is now (the solver's own debounce
  // spaces the requests), so the previous value dims at once. A goal that cannot be chosen is not solved.
  const tabStates = useMemo(() => (scenario && tables ? goalTabStates(scenario, tables) : null), [scenario, tables]);
  const goalView = useGoalSolve({
    goal,
    scenario: viewedScenario,
    tables,
    enabled: answered && response?.verdict === "ok" && tabStates !== null && !tabStates[goal].disabled,
  });
  const computed = useMemo<{ results: Results | null; error: string | null }>(() => {
    if (!tables || !liveScenario || response?.verdict !== "ok") return { results: null, error: null };
    try {
      return { results: computeForView(liveScenario, tables), error: null };
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

  // The stage is on screen once the answers are in and there is something to draw; only then does it own the address.
  const stageShown = !!tables && !!scenario && response?.verdict === "ok" && answered && !!results && slides.length > 0;
  const active = activeIndex(slides, view.slide);
  useStageHash(view, stageShown ? slides[active].id : null, stageDispatch);

  // A tab that cannot be chosen for these answers (G3 with no team work, G4 until its controls exist)
  // cannot stay active, so a link or an edit that lands on one returns to G1.
  const goalBlocked = tabStates?.[goal].disabled ?? false;
  useEffect(() => {
    if (stageShown && goalBlocked) stageDispatch({ type: "goal_set", goal: "G1" });
  }, [stageShown, goalBlocked, stageDispatch]);

  const slideTo = useCallback(
    (index: number, direction: StageDirection) => {
      const target = slides[index];
      if (target) stageDispatch({ type: "slide_set", slide: target.id, direction });
    },
    [slides, stageDispatch],
  );
  const slotContext: StageSlotContext | null =
    tables && liveScenario && results
      ? {
          view,
          scenario: liveScenario,
          tables,
          results,
          goalView,
          setGoal: (next: GoalId) => stageDispatch({ type: "goal_set", goal: next }),
          setComparator: (next: PatternId | null) => stageDispatch({ type: "comparator_set", comparator: next }),
          setSteps: (steps) => stageDispatch({ type: "steps_set", ...steps }),
          setC10: (next) => stageDispatch({ type: "c10_set", c10: next }),
        }
      : null;

  // The questions (and the focused control) are gone once answered: focus moves to the answers.
  useEffect(() => {
    if (answered) situationRef.current?.focus();
  }, [answered]);

  // The dashboard opens only once the example is loaded; a failed load leaves the questions as they were.
  const pickExample = async (example: Example) => {
    if (await openExample(example)) {
      setAnswered(true);
      setCompany(example.company);
    }
  };
  // The questions show only once the default scenario is back, so a late load never overwrites an answer.
  const startOver = async () => {
    if (await openExample(EXAMPLES[0])) {
      setAnswered(false);
      setCompany(null);
    }
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
          scenario={scenario}
          results={results}
          company={company}
          contactUrl={CONTACT_URL}
          onCompany={setCompany}
          onEdit={edit}
          onDone={() => {
            dispatch({ type: "scenario_committed", answered: ANSWERED });
            setAnswered(true);
          }}
        />
        <Examples activeId={null} onPick={(example) => void pickExample(example)} />
        {state.exampleError ? (
          <Notice title="That example could not be opened" role="alert">
            {state.exampleError}
          </Notice>
        ) : null}
      </>
    );
  } else if (response && scenario) {
    body = (
      <>
        <section className="situation card" aria-label="Your situation" ref={situationRef} tabIndex={-1}>
          {company ? (
            <IntakeSentence tables={tables} scenario={scenario} company={company} onCompany={setCompany} onEdit={answer} />
          ) : null}
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
            <Examples activeId={state.exampleId} onPick={(example) => void pickExample(example)} />
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
        {results && slotContext ? (
          <>
            <GoalTabsSlot ctx={slotContext} />
            <HeadlineStrip goal={goal} results={results} scenario={slotContext.scenario} goalView={goalView} contactUrl={CONTACT_URL} />
            <ComparatorSlot ctx={slotContext} />
            <ResultNotices results={results} tables={tables} />
            <Stage
              slides={slides}
              results={results}
              active={active}
              direction={stage.direction}
              ctx={slotContext}
              onSlide={slideTo}
            />
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
