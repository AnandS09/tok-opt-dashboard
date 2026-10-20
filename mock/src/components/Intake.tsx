import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { LatencyClass, Results, Scenario, Tables } from "../contract";
import { fmtInt, joinList, LATENCY_LABEL } from "./format";
import { fmtPct, fmtUsd, fmtUsdSig } from "../shared/format";
import {
  BUDGETS,
  COMPANIES,
  companyOf,
  hasBasis,
  lowerFirst,
  selectedWorkloads,
  setBudget,
  setCompany,
  setCustomers,
  setSpeed,
  setUsers,
  setWorkloads,
  SPEEDS,
  stepsFor,
  withCurrent,
  type Company,
  type CompanyType,
  type StepId,
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

const ICON_SHAPES: Record<CompanyType, ReactNode> = {
  ai_first: (
    <>
      <path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z" />
      <path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  software: (
    <>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M9 9l-2.5 2.5L9 14M15 9l2.5 2.5L15 14M8 21h8" />
    </>
  ),
  enterprise: <path d="M3 21h18M5 21V10M19 21V10M9 21v-7M15 21v-7M3 10l9-6 9 6z" />,
  telecom: (
    <>
      <path d="M12 13v8M9 21h6M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  chip: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3" />
    </>
  ),
};

function workLabels(ids: string[], tables: Tables): string {
  return joinList(tables.workloads.filter((w) => ids.includes(w.workload_id)).map((w) => lowerFirst(w.label)));
}

interface EstimateProps {
  results: Results | null;
  /** Shown instead of the figures, which would be stale or empty. */
  note: string | null;
}

/** The live estimate beside the questions: what `compute()` gives for the answers so far. */
function Estimate({ results, note }: EstimateProps) {
  let body;
  if (note) {
    body = <p className="estimate__note">{note}</p>;
  } else if (!results) {
    body = <p className="estimate__note">Working it out...</p>;
  } else {
    const total = results.allocation.total_usd;
    const savedPct = Math.round(results.headline.cost_savings_pct);
    const saved = (total * results.headline.cost_savings_pct) / 100;
    body = (
      <dl className="estimate__figures">
        <div>
          <dt>Today</dt>
          <dd>{fmtUsdSig(total)}</dd>
        </div>
        <div>
          <dt>With InfraVana</dt>
          <dd>{fmtUsdSig(total - saved)}</dd>
        </div>
        <div className="estimate__saving">
          <dt>You save</dt>
          <dd>{savedPct > 0 ? fmtPct(savedPct) : "About the same"}</dd>
        </div>
      </dl>
    );
  }
  return (
    <aside className="estimate" aria-label="Your estimate" aria-live="polite">
      <p className="estimate__title">Your estimate, per quarter</p>
      {body}
    </aside>
  );
}

interface QuestionsProps {
  tables: Tables;
  scenario: Scenario;
  results: Results | null;
  company: CompanyType | null;
  contactUrl: string;
  onCompany: (company: CompanyType) => void;
  onEdit: (update: (s: Scenario) => Scenario) => void;
  onDone: () => void;
}

/**
 * The guided start: the company type, then the questions that follow from
 * it, one at a time. Work is multi-select with Continue; every other step is
 * a single click. The estimate beside it recomputes after every answer.
 */
export function IntakeQuestions({
  tables,
  scenario,
  results,
  company,
  contactUrl,
  onCompany,
  onEdit,
  onDone,
}: QuestionsProps) {
  const [current, setCurrent] = useState<StepId>("company");
  const [answered, setAnswered] = useState<StepId[]>([]);
  /** The work cards switched on; the company type switches all of its own on. */
  const [picked, setPicked] = useState<string[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Each pick replaces the focused button, so focus moves to the new question for keyboard and screen-reader users.
  useEffect(() => {
    titleRef.current?.focus();
  }, [current]);

  const info = company ? companyOf(company) : null;
  // Before a type is picked the total is not known yet.
  const steps: StepId[] = info ? stepsFor(info, tables) : ["company"];
  const index = Math.max(0, steps.indexOf(current));
  const customerWord = info?.customerWord ?? "customers";
  const { users, budget_usd_per_quarter: budget, customers = 0 } = scenario.baseline;

  // With no work picked the scenario still holds the last pick, so the visitor cannot leave the work step.
  const stuck = current === "work" && picked.length === 0;
  const go = (step: StepId) => {
    if (step === "work") setPicked(selectedWorkloads(scenario, tables));
    setCurrent(step);
  };
  const advance = () => {
    setAnswered(answered.includes(current) ? answered : [...answered, current]);
    if (index === steps.length - 1) onDone();
    else setCurrent(steps[index + 1]);
  };
  const pickOne = (update: (s: Scenario) => Scenario) => {
    onEdit(update);
    advance();
  };
  const pickCompany = (c: Company) => {
    onCompany(c.id);
    onEdit((s) => setCompany(s, c, tables));
    setPicked(c.workloads);
    // Another type offers other work, so the later answers start again.
    const kept = company === c.id ? answered : [];
    setAnswered(kept.includes("company") ? kept : [...kept, "company"]);
    setCurrent("work");
  };
  const toggle = (id: string) => {
    const next = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id];
    setPicked(next);
    if (next.length > 0) onEdit((s) => setWorkloads(s, next, tables));
  };

  const answerText: Record<StepId, string> = {
    company: info?.title ?? "",
    work: workLabels(selectedWorkloads(scenario, tables), tables),
    users: `${fmtInt(users)} people`,
    customers: `${fmtInt(customers)} ${customerWord}`,
    budget: `${fmtUsd(budget)} a quarter`,
    speed: `Answers ${LATENCY_LABEL[scenario.latency_class]}`,
  };

  const single = (list: Choice[], apply: (s: Scenario, v: string) => Scenario) =>
    list.map((c) => (
      <button key={c.value} type="button" className="choice" onClick={() => pickOne((s) => apply(s, c.value))}>
        <span className="choice__label">{c.label}</span>
        {c.hint ? <span className="choice__hint">{c.hint}</span> : null}
      </button>
    ));

  let title: string;
  let choices: ReactNode;
  switch (current) {
    case "company":
      title = "What kind of company are you?";
      choices = COMPANIES.map((c) => (
        <button key={c.id} type="button" className="choice" aria-pressed={company === c.id} onClick={() => pickCompany(c)}>
          <svg className="choice__icon" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            {ICON_SHAPES[c.id]}
          </svg>
          <span className="choice__label">{c.title}</span>
          <span className="choice__hint">{c.line}</span>
        </button>
      ));
      break;
    case "work":
      title = "What do you use AI for?";
      choices = tables.workloads
        .filter((w) => info?.workloads.includes(w.workload_id))
        .map((w) => (
          <button
            key={w.workload_id}
            type="button"
            className="choice"
            aria-pressed={picked.includes(w.workload_id)}
            onClick={() => toggle(w.workload_id)}
          >
            <span className="choice__label">{w.label}</span>
            <span className="choice__hint">{w.basis === "customer" ? "Used by your customers" : "Used by your team"}</span>
          </button>
        ));
      break;
    case "users":
      title = "How many people on your team will use AI?";
      choices = single(
        (info?.teamSizes ?? []).map((n) => ({ value: String(n), label: `About ${fmtInt(n)}`, hint: "people" })),
        (s, v) => setUsers(s, Number(v)),
      );
      break;
    case "customers":
      title = `How many ${customerWord} use your AI?`;
      choices = single(
        (info?.customerCounts ?? []).map((n) => ({ value: String(n), label: `About ${fmtInt(n)}`, hint: customerWord })),
        (s, v) => setCustomers(s, Number(v)),
      );
      break;
    case "budget":
      title = "What is your AI budget each quarter?";
      choices = single(
        BUDGETS.map((n) => ({ value: String(n), label: fmtUsd(n), hint: "a quarter" })),
        (s, v) => setBudget(s, Number(v)),
      );
      break;
    case "speed":
      title = "How fast do answers need to come back?";
      choices = single(
        SPEEDS.map((c) => ({ value: c, label: LATENCY_LABEL[c], hint: SPEED_HINT[c] })),
        (s, v) => setSpeed(s, v as LatencyClass),
      );
      break;
  }

  const chips = steps.filter((step) => step !== current && answered.includes(step));

  return (
    <section className="intake card" aria-labelledby="intake-title">
      <div className="intake__main">
        <label className="intake__step">
          {info ? `Step ${index + 1} of ${steps.length}` : "Step 1"}
          <progress className="intake__progress" value={info ? index + 1 : 0} max={steps.length} />
        </label>
        {chips.length > 0 ? (
          <ul className="intake__answers" aria-label="Your answers so far">
            {chips.map((step) => (
              <li key={step}>
                <button
                  type="button"
                  className="chip"
                  aria-label={`Change: ${answerText[step]}`}
                  disabled={stuck}
                  onClick={() => go(step)}
                >
                  {answerText[step]}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <h2 id="intake-title" className="intake__title" ref={titleRef} tabIndex={-1}>
          {title}
        </h2>
        {current === "work" ? <p className="intake__note">Pick all that apply.</p> : null}
        <div className="choices" role="group" aria-labelledby="intake-title">
          {choices}
        </div>
        <div className="intake__nav">
          {index > 0 ? (
            <button
              type="button"
              className="link-button intake__back"
              disabled={stuck}
              onClick={() => go(steps[index - 1])}
            >
              Back
            </button>
          ) : null}
          {current === "work" ? (
            <button
              type="button"
              className="button button--primary"
              disabled={stuck}
              onClick={() => advance()}
            >
              Continue
            </button>
          ) : null}
        </div>
        {current === "company" ? (
          <a className="intake__aside" href={contactUrl}>
            I sell AI compute (cloud or GPU provider)
          </a>
        ) : null}
      </div>
      <Estimate
        results={results}
        note={
          company === null
            ? "Pick your company type to start."
            : stuck
              ? "Pick at least one kind of work."
              : null
        }
      />
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

interface WorkBlankProps {
  tables: Tables;
  options: string[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

/** The work blank: a button that opens a native popover of checkboxes; at least one stays on. */
function WorkBlank({ tables, options, selected, onChange }: WorkBlankProps) {
  const popId = `${useId()}-work`;
  const text = workLabels(selected, tables);
  return (
    <>
      <button type="button" className="blank" popoverTarget={popId} aria-label={`Main work: ${text}`}>
        {text}
      </button>
      <div id={popId} popover="auto" className="popover">
        <fieldset className="checks">
          <legend className="field__label">Main work</legend>
          {tables.workloads
            .filter((w) => options.includes(w.workload_id))
            .map((w) => {
              const checked = selected.includes(w.workload_id);
              const onlyOne = checked && selected.length === 1;
              return (
                <label key={w.workload_id} className="check" title={onlyOne ? "At least one must stay on" : undefined}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={onlyOne}
                    onChange={() =>
                      onChange(checked ? selected.filter((id) => id !== w.workload_id) : [...selected, w.workload_id])
                    }
                  />
                  <span>{w.label}</span>
                </label>
              );
            })}
        </fieldset>
        <button type="button" className="button" popoverTarget={popId} popoverTargetAction="hide">
          Done
        </button>
      </div>
    </>
  );
}

interface SentenceProps {
  tables: Tables;
  scenario: Scenario;
  company: CompanyType;
  onCompany: (company: CompanyType) => void;
  onEdit: (update: (s: Scenario) => Scenario) => void;
}

/** The answers as one editable sentence; changing a blank recomputes the page. */
export function IntakeSentence({ tables, scenario, company, onCompany, onEdit }: SentenceProps) {
  const { users, budget_usd_per_quarter: budget, customers = 0 } = scenario.baseline;
  const info = companyOf(company);
  const selected = selectedWorkloads(scenario, tables);
  const team = hasBasis(scenario, tables, "employee");
  const served = hasBasis(scenario, tables, "customer");

  return (
    <div className="sentence">
      We are{" "}
      <Blank
        label="Company type"
        value={company}
        choices={COMPANIES.map((c) => ({ value: c.id, label: c.sentence }))}
        onChange={(v) => {
          const next = companyOf(v as CompanyType);
          onEdit((s) => setCompany(s, next, tables));
          onCompany(next.id);
        }}
      />
      {team ? (
        <>
          {" "}
          with{" "}
          <Blank
            label="Team size"
            value={String(users)}
            choices={withCurrent(info.teamSizes, users).map((n) => ({ value: String(n), label: fmtInt(n) }))}
            onChange={(v) => onEdit((s) => setUsers(s, Number(v)))}
          />{" "}
          people
        </>
      ) : null}
      {served ? (
        <>
          {team ? " and " : " serving "}
          <Blank
            label={`Number of ${info.customerWord}`}
            value={String(customers)}
            choices={withCurrent(info.customerCounts, customers).map((n) => ({ value: String(n), label: fmtInt(n) }))}
            onChange={(v) => onEdit((s) => setCustomers(s, Number(v)))}
          />{" "}
          {info.customerWord}
        </>
      ) : null}
      . Our AI budget is{" "}
      <Blank
        label="Budget per quarter"
        value={String(budget)}
        choices={withCurrent(BUDGETS, budget).map((n) => ({ value: String(n), label: fmtUsd(n) }))}
        onChange={(v) => onEdit((s) => setBudget(s, Number(v)))}
      />{" "}
      a quarter, used {selected.length > 1 ? "on" : "only on"}{" "}
      <WorkBlank
        tables={tables}
        options={[...info.workloads, ...selected]}
        selected={selected}
        onChange={(ids) => onEdit((s) => setWorkloads(s, ids, tables))}
      />
      , and answers need to come back{" "}
      <Blank
        label="Response speed"
        value={scenario.latency_class}
        choices={SPEEDS.map((c) => ({ value: c, label: LATENCY_LABEL[c] }))}
        onChange={(v) => onEdit((s) => setSpeed(s, v as LatencyClass))}
      />
      .
    </div>
  );
}
