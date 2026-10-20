import { useState } from "react";
import type { LatencyClass, Scenario, Tables } from "../contract";
import { fmtInt, LATENCY_LABEL } from "./format";
import { fmtUsd } from "../shared/format";
import {
  BUDGETS,
  MIX,
  QUESTIONS,
  setBudget,
  setSpeed,
  setUsers,
  setWork,
  SPEEDS,
  TEAM_SIZES,
  withCurrent,
  workOf,
  type QuestionId,
} from "../store/intake";

interface Choice {
  value: string;
  label: string;
  hint?: string;
}

const SPEED_HINT: Record<LatencyClass, string> = {
  interactive: "People wait on the answer, as in a chat or coding assistant",
  standard: "A short wait is fine, as in drafting or review",
  batch: "Jobs run in the background, as in nightly reports",
};

function workChoices(tables: Tables): Choice[] {
  return [
    ...tables.workloads.map((w) => ({ value: w.workload_id, label: w.label })),
    { value: MIX, label: "A mix of these" },
  ];
}

/** Question text, its choices and how a pick writes into the scenario. */
function question(id: QuestionId, tables: Tables) {
  switch (id) {
    case "users":
      return {
        title: "How many people on your team will use AI?",
        choices: TEAM_SIZES.map((n) => ({ value: String(n), label: `About ${fmtInt(n)}`, hint: "people" })),
        apply: (s: Scenario, v: string) => setUsers(s, Number(v)),
      };
    case "budget":
      return {
        title: "What is your AI budget each quarter?",
        choices: BUDGETS.map((n) => ({ value: String(n), label: fmtUsd(n), hint: "a quarter" })),
        apply: (s: Scenario, v: string) => setBudget(s, Number(v)),
      };
    case "work":
      return {
        title: "What does the team mostly use AI for?",
        choices: workChoices(tables),
        apply: (s: Scenario, v: string) => setWork(s, v, tables),
      };
    case "speed":
      return {
        title: "How fast do answers need to come back?",
        choices: SPEEDS.map((c) => ({ value: c, label: LATENCY_LABEL[c], hint: SPEED_HINT[c] })),
        apply: (s: Scenario, v: string) => setSpeed(s, v as LatencyClass),
      };
  }
}

interface QuestionsProps {
  tables: Tables;
  onEdit: (update: (s: Scenario) => Scenario) => void;
  onDone: () => void;
}

/** The guided start: four questions, one at a time, each a single click. */
export function IntakeQuestions({ tables, onEdit, onDone }: QuestionsProps) {
  const [step, setStep] = useState(0);
  const id = QUESTIONS[step];
  const q = question(id, tables);

  const pick = (value: string) => {
    onEdit((s) => q.apply(s, value));
    if (step === QUESTIONS.length - 1) onDone();
    else setStep(step + 1);
  };

  return (
    <section className="intake card" aria-labelledby="intake-title">
      <p className="intake__step">
        Question {step + 1} of {QUESTIONS.length}
      </p>
      <h2 id="intake-title" className="intake__title">
        {q.title}
      </h2>
      <div className="choices" role="group" aria-labelledby="intake-title">
        {q.choices.map((c) => (
          <button key={c.value} type="button" className="choice" onClick={() => pick(c.value)}>
            <span className="choice__label">{c.label}</span>
            {c.hint ? <span className="choice__hint">{c.hint}</span> : null}
          </button>
        ))}
      </div>
      {step > 0 ? (
        <button type="button" className="link-button intake__back" onClick={() => setStep(step - 1)}>
          Back
        </button>
      ) : null}
    </section>
  );
}

interface BlankProps {
  label: string;
  value: string;
  choices: Choice[];
  onChange: (value: string) => void;
}

/** One blank of the sentence: a native select styled as underlined text. */
function Blank({ label, value, choices, onChange }: BlankProps) {
  return (
    <select className="blank" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {choices.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
    </select>
  );
}

interface SentenceProps {
  tables: Tables;
  scenario: Scenario;
  onEdit: (update: (s: Scenario) => Scenario) => void;
}

/** The answers as one editable sentence; changing a blank recomputes the page. */
export function IntakeSentence({ tables, scenario, onEdit }: SentenceProps) {
  const { users, budget_usd_per_quarter: budget } = scenario.baseline;
  const work = workOf(scenario);
  const works = workChoices(tables).map((c) => ({
    ...c,
    label: c.value === MIX ? "a mix of work" : c.label.toLowerCase(),
  }));

  return (
    <p className="sentence">
      We have{" "}
      <Blank
        label="Team size"
        value={String(users)}
        choices={withCurrent(TEAM_SIZES, users).map((n) => ({ value: String(n), label: fmtInt(n) }))}
        onChange={(v) => onEdit((s) => setUsers(s, Number(v)))}
      />{" "}
      people spending{" "}
      <Blank
        label="Budget per quarter"
        value={String(budget)}
        choices={withCurrent(BUDGETS, budget).map((n) => ({ value: String(n), label: fmtUsd(n) }))}
        onChange={(v) => onEdit((s) => setBudget(s, Number(v)))}
      />{" "}
      a quarter, mostly on{" "}
      <Blank label="Main work" value={work} choices={works} onChange={(v) => onEdit((s) => setWork(s, v, tables))} />, and
      need answers{" "}
      <Blank
        label="Response speed"
        value={scenario.latency_class}
        choices={SPEEDS.map((c) => ({ value: c, label: LATENCY_LABEL[c] }))}
        onChange={(v) => onEdit((s) => setSpeed(s, v as LatencyClass))}
      />
      .
    </p>
  );
}
