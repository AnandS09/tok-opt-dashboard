import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import type { LatencyClass, Scenario, Tables } from "../contract";
import { fmtInt, joinList, LATENCY_LABEL } from "./format";
import { fmtPct, fmtUsd, fmtUsdSig } from "../shared/format";
import { BUDGET_USD_PER_QUARTER_RANGE, CUSTOMERS_RANGE, USERS_RANGE } from "../data/ranges";
import { LogSlider } from "./LogSlider";
import "../styles/intake.css";
import { ANSWER_GRID, balancedGrid, placeCells } from "../store/balancedGrid";
import {
  beginIntake,
  BUDGET_MARKS,
  BUDGETS,
  COMPANIES,
  companyOf,
  estimateBasisLine,
  estimateFigures,
  hasBasis,
  kindsOfWork,
  lowerFirst,
  selectedWorkloads,
  setBudget,
  setCompany,
  setCustomers,
  setSpeed,
  setUsers,
  setWorkloads,
  showsEstimate,
  SPEEDS,
  stepProgress,
  stepsFor,
  withCurrent,
  type Company,
  type CompanyType,
  type EstimateFigures,
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

/** The compute seller's row (spec 15.1) is drawn like the five company rows: a server rack in the same line style. */
const PROVIDER = {
  label: "I sell AI compute",
  hint: "Cloud or GPU provider: talk to us about selling through InfraVana",
};

const ICON_SHAPES: Record<CompanyType | "provider", ReactNode> = {
  provider: (
    <>
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <path d="M7 7h.01M7 17h.01M11 7h6M11 17h6" />
    </>
  ),
  ai_first: (
    <>
      <path d="M12 3l9 4.5-9 4.5-9-4.5z" />
      <path d="M3 12l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5" />
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

function Icon({ shape }: { shape: CompanyType | "provider" }) {
  return (
    <svg className="choice__icon" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      {ICON_SHAPES[shape]}
    </svg>
  );
}

function workLabels(ids: string[], tables: Tables): string {
  return joinList(tables.workloads.filter((w) => ids.includes(w.workload_id)).map((w) => lowerFirst(w.label)));
}

interface EstimateProps {
  /** Null when the answers cannot be worked out. */
  figures: EstimateFigures | null;
  /** What the figures are worked out from; shown under them. */
  basis: string;
}

/**
 * The live estimate beside the questions (spec 15.3): its figures are worked
 * out from the visitor's own answers, and the line under them says which.
 */
function Estimate({ figures, basis }: EstimateProps) {
  return (
    <aside className="estimate" aria-label="Your estimate" aria-live="polite">
      <p className="estimate__title">Your estimate, per quarter</p>
      {figures ? (
        <>
          <dl className="estimate__figures">
            <div>
              <dt>Today</dt>
              <dd>{fmtUsdSig(figures.today)}</dd>
            </div>
            <div>
              <dt>With InfraVana</dt>
              <dd>{fmtUsdSig(figures.withInfravana)}</dd>
            </div>
            <div className="estimate__saving">
              <dt>You save</dt>
              <dd>{Math.round(figures.savedPct) > 0 ? fmtPct(figures.savedPct) : "About the same"}</dd>
            </div>
          </dl>
          <p className="estimate__basis">{basis}</p>
        </>
      ) : (
        <p className="estimate__note">These answers could not be worked out yet.</p>
      )}
    </aside>
  );
}

interface QuestionsProps {
  tables: Tables;
  scenario: Scenario;
  company: CompanyType | null;
  contactUrl: string;
  onCompany: (company: CompanyType) => void;
  onEdit: (update: (s: Scenario) => Scenario) => void;
  onDone: () => void;
}

/**
 * The guided start: the company type, then the questions that follow from
 * it, one at a time. Work is multi-select with Continue; every other step is
 * a single click. From the budget step the estimate beside it is worked out
 * from the answers given so far.
 */
export function IntakeQuestions({ tables, scenario, company, contactUrl, onCompany, onEdit, onDone }: QuestionsProps) {
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
  const progress = stepProgress(info, current, tables);
  const customerWord = info?.customerWord ?? "customers";
  const { users, budget_usd_per_quarter: budget, customers = 0 } = scenario.baseline;

  const showEstimate = info !== null && showsEstimate(current);
  const estimate = useMemo(() => {
    if (!showEstimate || !info) return null;
    try {
      return { figures: estimateFigures(scenario, tables), basis: estimateBasisLine(scenario, info, tables) };
    } catch {
      return { figures: null, basis: "" };
    }
  }, [showEstimate, info, scenario, tables]);

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
    if (company === c.id) {
      setCurrent("work");
      return;
    }
    onCompany(c.id);
    onEdit((s) => beginIntake(s, c, tables));
    setPicked(c.workloads);
    // Another type offers other work, so the later answers start again.
    setAnswered(["company"]);
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

  // Every step but the company type and the sliders is a ruled list of equal rows (spec 4.3, 5.1).
  let listClass = "choices--list choices--plain";
  let title: string;
  let choices: ReactNode;
  switch (current) {
    case "company":
      title = "What kind of company are you?";
      listClass = "choices--list";
      choices = (
        <>
          {COMPANIES.map((c) => (
            <button key={c.id} type="button" className="choice" aria-pressed={company === c.id} onClick={() => pickCompany(c)}>
              <Icon shape={c.id} />
              <span className="choice__label">{c.title}</span>
              <span className="choice__hint">{c.line}</span>
            </button>
          ))}
          <a className="choice choice--provider" href={contactUrl}>
            <Icon shape="provider" />
            <span className="choice__label">{PROVIDER.label}</span>
            <span className="choice__hint">{PROVIDER.hint}</span>
          </a>
        </>
      );
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
      listClass = "choices--slider";
      choices = (
        <LogSlider
          key={current}
          label={title}
          unit="people"
          range={USERS_RANGE}
          marks={info?.teamSizes ?? []}
          marksLabel="Common team sizes"
          value={users}
          formatMark={fmtInt}
          onChange={(n) => onEdit((s) => setUsers(s, n))}
        />
      );
      break;
    case "customers":
      title = `How many ${customerWord} use your AI?`;
      listClass = "choices--slider";
      choices = (
        <LogSlider
          key={current}
          label={title}
          unit={customerWord}
          range={CUSTOMERS_RANGE}
          marks={info?.customerCounts ?? []}
          marksLabel={`Common numbers of ${customerWord}`}
          value={customers}
          formatMark={fmtInt}
          onChange={(n) => onEdit((s) => setCustomers(s, n))}
        />
      );
      break;
    case "budget":
      title = "What is your AI budget each quarter?";
      listClass = "choices--slider";
      choices = (
        <LogSlider
          key={current}
          label={title}
          unit={null}
          money
          range={BUDGET_USD_PER_QUARTER_RANGE}
          marks={BUDGET_MARKS}
          marksLabel="Common budgets"
          value={budget}
          formatMark={fmtUsd}
          onChange={(n) => onEdit((s) => setBudget(s, n))}
        />
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
    <section
      className={`intake card intake--${current}${showEstimate ? " intake--estimate" : ""}`}
      aria-labelledby="intake-title"
    >
      <div className="intake__main">
        <label className="intake__step">
          {progress.label}
          <progress className="intake__progress" value={progress.value} max={progress.max} />
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
        <div className={`choices ${listClass}`} role="group" aria-labelledby="intake-title">
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
          {current === "work" || current === "users" || current === "customers" || current === "budget" ? (
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
      </div>
      {/* No panel on steps 1 to 4: it has nothing of the visitor's to work from until the budget step (spec 15.3). */}
      {estimate ? <Estimate figures={estimate.figures} basis={estimate.basis} /> : null}
    </section>
  );
}

/** The width of an element, re-read whenever it changes size and before the first paint. */
function useWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const next = el.clientWidth;
      setWidth((previous) => (previous === next ? previous : next));
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

function Caret() {
  return (
    <svg className="answer__caret" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
      <path d="M2 4.5l4 4 4-4" />
    </svg>
  );
}

interface SelectCellProps {
  label: string;
  value: string;
  choices: Choice[];
  onChange: (value: string) => void;
}

interface CellFrameProps {
  label: string;
  span: number;
  endsRow: boolean;
  lastRow: boolean;
  children: (labelId: string) => ReactNode;
}

/** One cell of the answer grid: a small-capitals label over the control that holds the value (spec 15.5). */
function AnswerCell({ label, span, endsRow, lastRow, children }: CellFrameProps) {
  const labelId = useId();
  return (
    <div
      className={`answer${endsRow ? " answer--ends-row" : ""}${lastRow ? " answer--last-row" : ""}`}
      style={span > 1 ? { gridColumn: `span ${span}` } : undefined}
    >
      <span id={labelId} className="answer__label">
        {label}
      </span>
      <span className="answer__control">{children(labelId)}</span>
    </div>
  );
}

/** The value of a list cell: a native select drawn as serif text with a caret and an underline. */
function SelectValue({ labelId, value, choices, onChange }: Omit<SelectCellProps, "label"> & { labelId: string }) {
  return (
    <>
      <select className="answer__value" aria-labelledby={labelId} value={value} onChange={(e) => onChange(e.target.value)}>
        {choices.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <Caret />
    </>
  );
}

interface WorkValueProps {
  labelId: string;
  tables: Tables;
  options: string[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

/** The work cell's value: a button that opens a native popover of checkboxes; at least one stays on. */
function WorkValue({ labelId, tables, options, selected, onChange }: WorkValueProps) {
  const popId = `${useId()}-work`;
  const buttonId = `${popId}-button`;
  return (
    <>
      <button
        id={buttonId}
        type="button"
        className="answer__value"
        popoverTarget={popId}
        aria-labelledby={`${labelId} ${buttonId}`}
        title={workLabels(selected, tables)}
      >
        {kindsOfWork(selected.length)}
      </button>
      <Caret />
      <div id={popId} popover="auto" className="popover">
        <fieldset className="checks">
          <legend className="field__label">Work</legend>
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

interface AnswersProps {
  tables: Tables;
  scenario: Scenario;
  company: CompanyType;
  onCompany: (company: CompanyType) => void;
  onEdit: (update: (s: Scenario) => Scenario) => void;
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * The answers as a balanced grid (spec 15.5): Company, Team and Customers,
 * then Budget a quarter, Work and Answers needed; a type without team work or
 * customer work leaves that cell out. Each cell is the control of the old
 * old blank, and changing one recomputes the page. The columns and wide cells come
 * from the balanced-grid rule (spec 15.13) for the grid's width.
 */
export function IntakeAnswers({ tables, scenario, company, onCompany, onEdit }: AnswersProps) {
  const { users, budget_usd_per_quarter: budget, customers = 0 } = scenario.baseline;
  const info = companyOf(company);
  const selected = selectedWorkloads(scenario, tables);
  const team = hasBasis(scenario, tables, "employee");
  const served = hasBasis(scenario, tables, "customer");
  const gridRef = useRef<HTMLDivElement>(null);
  const width = useWidth(gridRef);

  const cells: { key: string; label: string; render: (labelId: string) => ReactNode }[] = [
    {
      key: "company",
      label: "Company",
      render: (labelId) => (
        <SelectValue
          labelId={labelId}
          value={company}
          choices={COMPANIES.map((c) => ({ value: c.id, label: c.title }))}
          onChange={(v) => {
            const next = companyOf(v as CompanyType);
            onEdit((s) => setCompany(s, next, tables));
            onCompany(next.id);
          }}
        />
      ),
    },
  ];
  if (team) {
    cells.push({
      key: "team",
      label: "Team",
      render: (labelId) => (
        <SelectValue
          labelId={labelId}
          value={String(users)}
          choices={withCurrent(info.teamSizes, users).map((n) => ({
            value: String(n),
            label: `${fmtInt(n)} ${n === 1 ? "person" : "people"}`,
          }))}
          onChange={(v) => onEdit((s) => setUsers(s, Number(v)))}
        />
      ),
    });
  }
  if (served) {
    cells.push({
      key: "customers",
      label: capitalise(info.customerWord),
      render: (labelId) => (
        <SelectValue
          labelId={labelId}
          value={String(customers)}
          choices={withCurrent(info.customerCounts, customers).map((n) => ({ value: String(n), label: fmtInt(n) }))}
          onChange={(v) => onEdit((s) => setCustomers(s, Number(v)))}
        />
      ),
    });
  }
  cells.push(
    {
      key: "budget",
      label: "Budget a quarter",
      render: (labelId) => (
        <SelectValue
          labelId={labelId}
          value={String(budget)}
          choices={withCurrent(BUDGETS, budget).map((n) => ({ value: String(n), label: fmtUsd(n) }))}
          onChange={(v) => onEdit((s) => setBudget(s, Number(v)))}
        />
      ),
    },
    {
      key: "work",
      label: "Work",
      render: (labelId) => (
        <WorkValue
          labelId={labelId}
          tables={tables}
          options={[...info.workloads, ...selected]}
          selected={selected}
          onChange={(ids) => onEdit((s) => setWorkloads(s, ids, tables))}
        />
      ),
    },
    {
      key: "speed",
      label: "Answers needed",
      render: (labelId) => (
        <SelectValue
          labelId={labelId}
          value={scenario.latency_class}
          choices={SPEEDS.map((c) => ({ value: c, label: LATENCY_LABEL[c] }))}
          onChange={(v) => onEdit((s) => setSpeed(s, v as LatencyClass))}
        />
      ),
    },
  );

  const layout = balancedGrid(cells.length, width, ANSWER_GRID);
  const places = placeCells(layout);

  return (
    <div
      ref={gridRef}
      className="answers"
      role="group"
      aria-label="Your answers"
      style={{ gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))` }}
    >
      {cells.map((cell, i) => (
        <AnswerCell key={cell.key} label={cell.label} {...places[i]}>
          {cell.render}
        </AnswerCell>
      ))}
    </div>
  );
}
