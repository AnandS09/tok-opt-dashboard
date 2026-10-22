import "../styles/c10.css";
import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ChartDef, ChartProps, Results } from "../contract";
import { fmtTokensSig } from "../shared/format";
import { ChartFigure } from "./ChartFigure";
import { paretoBenefits } from "./benefits";
import { c10Data, effectiveView, speedViewReason } from "./c10Data";
import type { C10Data, C10View } from "./c10Data";
import { C10Context } from "./c10Context";
import { AXIS_TITLE, CURRENT_LABEL, NARROW, lineMarks, markName, markerOf, pointMarks } from "./c10Option";
import { buildParetoOption } from "./c10Option";
import { comparisonOf } from "./comparison";
import { optionStyle } from "./patterns";
import { fmtBudget, toCsvText } from "./format";
import { BRAND, INFRAVANA_LABEL, TODAY_LABEL } from "./labels";
import type { ProvenancePart } from "./ProvenanceNotes";
import type { Tokens } from "./tokens";
import type { Dims } from "./useEChart";

/** The two views of the switch, in the words of the spec (6.3). */
export const VIEW_LABEL: Record<C10View, string> = {
  quality: "Quality versus volume",
  speed: "Speed versus volume",
};

/**
 * One sentence from Results: what the comparator's way of buying gets for the
 * budget. The line's own figures depend on the scenario and the view, so they
 * are in the chart, its table and its label rather than here.
 */
export function paretoCaption(results: Results): string {
  const cmp = comparisonOf(results);
  const budget = fmtBudget(results.tokens_bought.budget_usd);
  const buyer = cmp.comparator ? `${cmp.label} buys` : "Today buys";
  const tokens = cmp.comparator ? fmtTokensSig(cmp.comparator.tokens_at_budget) : fmtTokensSig(results.tokens_bought.today_tokens);
  return `For the same ${budget} budget, ${buyer} ${tokens} tokens a quarter, and the line shows how many ${BRAND} buys as you accept a lower quality or speed.`;
}

const PARETO_HOW_COMPUTED =
  "This holds your budget fixed and asks what happens to the work it buys if you accept less. " +
  "In the quality view, each point on the line is a quality floor (a score from the benchmark table) applied to all your work, " +
  `and the height is the number of tokens (the small pieces of text that models read and write) ${BRAND} can buy a quarter for the budget at that floor. ` +
  "In the speed view, each point is a minimum speed, in tokens a second per user, and the height is what the budget buys when every model must be at least that fast; " +
  "slower speeds let work move to cheaper batch and flex prices. " +
  "Only points that no stricter point beats are drawn, as steps, so the line never rises as you ask for more. " +
  "The ring marks your own setting. Each grey line is a way companies buy today; its height does not change with the floor. " +
  "In the speed view each is a marker at the speed of the slowest offer it buys. " +
  "Speeds in the speed view are invented placeholder data.";

/** Header first: the Today lines (or points) as the chart plots them. The InfraVana rows come from `c10Csv`. */
export function paretoCsv(results: Results): string {
  const cmp = comparisonOf(results);
  const rows: (string | number | null)[][] = [
    ...(cmp.comparator
      ? [[`${TODAY_LABEL}: ${cmp.comparator.label}`, "tokens_per_quarter", cmp.comparator.tokens_at_budget, cmp.comparator.provenance]]
      : []),
    ...cmp.options.map((o) => [`${TODAY_LABEL}: ${o.alt.label}`, "tokens_per_quarter", o.alt.tokens_at_budget, o.alt.provenance]),
  ];
  return toCsvText(["series", "measure", "value", "provenance"], rows);
}

/** The rows C10 plots for one view: the frontier, the visitor's setting and each Today option. */
export function c10Csv(data: C10Data): string {
  const axis = data.view === "quality" ? "quality_floor" : "min_tok_s_per_user";
  const rows: (string | number | null)[][] = [
    ...data.frontier.points.map((p) => [INFRAVANA_LABEL, axis, p.threshold, "tokens_per_quarter", p.infravana_tokens, data.provenance]),
    ...(data.current_tokens === null
      ? []
      : [[CURRENT_LABEL, axis, data.frontier.current_threshold, "tokens_per_quarter", data.current_tokens, data.provenance]]),
    ...data.today.map((m) => [
      markName(m),
      axis,
      m.speed,
      "tokens_per_quarter",
      m.tokens,
      data.view === "speed" && m.speed !== null ? "modelled" : m.alt.provenance,
    ]),
  ];
  return toCsvText(["series", "axis", "threshold", "measure", "value", "provenance"], rows);
}

/** Where each drawn series comes from, for the badges. */
export function paretoParts(results: Results, data: C10Data | null): ProvenancePart[] {
  const cmp = comparisonOf(results);
  const speed = data?.view === "speed";
  const today = (provenance: ProvenancePart["provenance"], mark: { speed: number | null; alt: { provenance: ProvenancePart["provenance"] } }) =>
    speed && mark.speed !== null ? "modelled" : provenance;
  const marks = data?.today ?? [];
  return [
    ...(cmp.comparator
      ? [
          {
            group: `${TODAY_LABEL}: ${cmp.label}`,
            part: "",
            provenance: today(cmp.comparator.provenance, marks[0] ?? { speed: null, alt: cmp.comparator }),
          },
        ]
      : []),
    { group: INFRAVANA_LABEL, part: "", provenance: data?.provenance ?? results.tokens_bought.provenance.infravana },
    ...cmp.options.map((o, i) => ({
      group: "Other Today options",
      part: o.alt.label,
      provenance: today(o.alt.provenance, marks[(cmp.comparator ? 1 : 0) + i] ?? { speed: null, alt: o.alt }),
    })),
  ];
}

interface SwitchProps {
  view: C10View;
  reason: string | null;
  onChange: (view: C10View) => void;
}

/** The switch of spec 6.3: quality or speed against volume; the speed side is disabled, with its reason beside it, when there is no speed data. */
export function C10Switch({ view, reason, onChange }: SwitchProps) {
  const name = useId();
  const reasonId = useId();
  return (
    <fieldset className="segmented c10-switch" data-slot="c10-switch">
      <legend className="sr-only">Which trade-off to plot</legend>
      <div className="segmented__track">
        {(["quality", "speed"] as const).map((v) => {
          const disabled = v === "speed" && reason !== null;
          return (
            <label
              key={v}
              className={`segmented__option${disabled ? " segmented__option--disabled" : ""}`}
              title={disabled ? (reason ?? undefined) : undefined}
            >
              <input
                type="radio"
                name={name}
                value={v}
                checked={view === v}
                disabled={disabled}
                aria-describedby={disabled ? reasonId : undefined}
                onChange={() => onChange(v)}
              />
              <span>{VIEW_LABEL[v]}</span>
            </label>
          );
        })}
      </div>
      {reason !== null ? (
        <p id={reasonId} className="c10-switch__reason">
          {reason}
        </p>
      ) : null}
    </fieldset>
  );
}

const FILL_VAR: Record<string, string> = { today1: "var(--color-today-1)", today2: "var(--color-today-2)" };

/** The key: each Today option's marker and name, shown where the chart has no room for end labels. */
function C10Key({ data }: { data: C10Data }) {
  const swatch = (key: string, shape: string, fill: string, text: string) => (
    <li key={key} className="chart-key__item">
      <span className={`chart-key__swatch chart-key__swatch--${shape}`} style={{ background: fill } as CSSProperties} aria-hidden="true" />
      {text}
    </li>
  );
  const figures = (m: C10Data["today"][number]) =>
    `${fmtTokensSig(m.tokens)} tokens${m.speed === null ? (data.view === "speed" ? ", no speed data, drawn as a line" : "") : `, ${Math.round(m.speed)} tokens a second`}`;
  return (
    <ul className="chart-key" aria-label="Key to the lines and markers">
      {data.today.map((m) => {
        const fill = m.rank === null ? "today1" : optionStyle(m.rank).fill;
        return swatch(m.alt.pattern_id, m.rank === null ? "tick" : markerOf(m), FILL_VAR[fill], `${markName(m)}: ${figures(m)}`);
      })}
    </ul>
  );
}

/** The sentence a screen reader gets for the picture: the comparator's figure, then the line's. */
function ariaLabelOf(results: Results, data: C10Data | null): string {
  const base = paretoCaption(results);
  if (data === null || data.current_tokens === null) return base;
  const unit = data.view === "quality" ? "quality floor" : "speed";
  return `${base} At your ${unit} of ${Math.round(data.frontier.current_threshold)} it buys ${fmtTokensSig(data.current_tokens)}.`;
}

export function ParetoChart({ results, size }: ChartProps) {
  const inputs = useContext(C10Context);
  const stage = size === "stage";
  const requested = inputs?.view ?? "quality";
  const reason = inputs ? speedViewReason(inputs.tables) : null;
  const view = inputs ? effectiveView(requested, inputs.tables) : "quality";

  // The address may name the speed view while there is no speed data: show quality and correct the address.
  const setView = inputs?.setView;
  useEffect(() => {
    if (stage && setView && requested === "speed" && reason !== null) setView("quality");
  }, [stage, setView, requested, reason]);

  const scenario = inputs?.scenario;
  const tables = inputs?.tables;
  const computed = useMemo<{ data: C10Data | null; error: string | null }>(() => {
    if (!scenario || !tables) return { data: null, error: null };
    try {
      return { data: c10Data(results, scenario, tables, view), error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }, [results, scenario, tables, view]);
  const { data, error } = computed;

  const build = useCallback(
    (t: Tokens, dims: Dims) => (data ? buildParetoOption(data, size, t, dims) : {}),
    [data, size],
  );

  // The end labels need room; below that width the key names the lines instead.
  const box = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver !== "function") return;
    const observer = new ResizeObserver(() => setNarrow(el.clientWidth < NARROW));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const showKey = stage && data !== null && (narrow || data.view === "speed");
  const header = stage ? (
    <>
      {inputs ? <C10Switch view={view} reason={reason} onChange={inputs.setView} /> : null}
      {showKey && data ? <C10Key data={data} /> : null}
      {error ? (
        <p role="alert" className="c10-error">
          This chart could not be worked out for these answers. {error}
        </p>
      ) : null}
    </>
  ) : undefined;

  const axisTitle = AXIS_TITLE[view];
  const table = {
    caption: `Tokens a quarter that a ${fmtBudget(results.tokens_bought.budget_usd)} budget buys, by ${view === "quality" ? "quality floor" : "minimum speed"}.`,
    headers: ["Series", axisTitle.split(" (")[0], "Tokens a quarter"],
    rows: data
      ? [
          ...data.frontier.points.map((p) => [INFRAVANA_LABEL, Math.round(p.threshold * 10) / 10, fmtTokensSig(p.infravana_tokens)]),
          ...(data.current_tokens === null
            ? []
            : [[CURRENT_LABEL, Math.round(data.frontier.current_threshold * 10) / 10, fmtTokensSig(data.current_tokens)]]),
          ...data.today.map((m) => [markName(m), m.speed === null ? "any" : Math.round(m.speed), fmtTokensSig(m.tokens)]),
        ]
      : [],
  };

  // The speed view draws the invented speed rows (BD-11), so it carries the invented badge and source line.
  return (
    <div ref={box}>
    <ChartFigure
      size={size}
      height={400}
      phoneHeight={360}
      invented={data?.view === "speed"}
      parts={paretoParts(results, data)}
      ariaLabel={ariaLabelOf(results, data)}
      build={build}
      header={header}
      subtitle={data ? `Tokens a quarter that ${fmtBudget(data.budget_usd)} buys` : undefined}
      table={table}
    />
    </div>
  );
}

export const paretoChart: ChartDef = {
  id: "C10",
  title: "What you can buy if you accept less",
  caption: paretoCaption,
  howComputed: PARETO_HOW_COMPUTED,
  toCsv: paretoCsv,
  benefits: paretoBenefits,
  Component: ParetoChart,
};

export { lineMarks, pointMarks };
