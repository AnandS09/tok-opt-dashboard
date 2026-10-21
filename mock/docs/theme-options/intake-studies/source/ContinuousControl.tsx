import { useEffect, useId, useState } from "react";

/**
 * Intake study (scratch copy only): one continuous control for team size,
 * customers and budget, on a log scale. Two variants:
 *   "slider":  typed number + log slider + clickable preset marks under it
 *   "stepper": [-] typed number [+] + log slider (no marks)
 */
export type ControlVariant = "slider" | "stepper";

export interface ContinuousControlProps {
  label: string;
  /** Word after the number, e.g. "people", or null for money. */
  unit: string | null;
  min: number;
  max: number;
  presets: number[];
  value: number;
  format: (n: number) => string;
  /** Money shows "$" before the typed number. */
  money?: boolean;
  variant: ControlVariant;
  onChange: (n: number) => void;
}

/** 100 positions: about 10% per arrow-key press over four decades, so keyboard use is practical. */
const STEPS = 100;

const toPos = (v: number, min: number, max: number) =>
  Math.round((Math.log(v / min) / Math.log(max / min)) * STEPS);

/** Two significant figures: the slider lands on round numbers. */
function nice(v: number): number {
  if (v < 10) return Math.round(v);
  const p = 10 ** (Math.floor(Math.log10(v)) - 1);
  return Math.round(v / p) * p;
}
const fromPos = (pos: number, min: number, max: number) =>
  Math.min(max, Math.max(min, nice(min * (max / min) ** (pos / STEPS))));

/** The 1-2-5 ladder the stepper walks: 1, 2, 5, 10, 20, 50 ... */
function ladder(v: number, dir: 1 | -1, min: number, max: number): number {
  const seq: number[] = [];
  for (let e = 0; e <= 9; e++) for (const m of [1, 2, 5]) seq.push(m * 10 ** e);
  const pick = dir > 0 ? seq.find((s) => s > v) : [...seq].reverse().find((s) => s < v);
  return Math.min(max, Math.max(min, pick ?? v));
}

function parseTyped(text: string, money: boolean): number | null {
  const t = text.trim().toLowerCase().replace(/[$,\s]/g, "");
  const m = /^(\d*\.?\d+)([km])?$/.exec(t);
  if (!m) return null;
  const mult = m[2] === "k" ? 1e3 : m[2] === "m" ? 1e6 : 1;
  const n = Number(m[1]) * mult;
  return Number.isFinite(n) ? Math.round(n) : money ? null : null;
}

export function ContinuousControl(p: ContinuousControlProps) {
  const id = useId();
  const [text, setText] = useState(String(p.value));
  useEffect(() => setText(p.money ? p.format(p.value).replace("$", "") : p.value.toLocaleString("en-US")), [p.value, p.money, p.format]);
  const commit = () => {
    const n = parseTyped(text, !!p.money);
    if (n !== null) p.onChange(Math.min(p.max, Math.max(p.min, n)));
    else setText(String(p.value));
  };
  const number = (
    <span className="cc__number">
      {p.money ? <span className="cc__affix">$</span> : null}
      <input
        id={`${id}-n`}
        className="cc__input"
        inputMode="numeric"
        value={text}
        aria-label={`${p.label} (type a number)`}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
      />
      {p.unit ? <span className="cc__affix">{p.unit}</span> : <span className="cc__affix">a quarter</span>}
    </span>
  );
  const slider = (
    <input
      id={`${id}-r`}
      className="cc__range"
      type="range"
      min={0}
      max={STEPS}
      step={1}
      value={toPos(p.value, p.min, p.max)}
      aria-label={p.label}
      aria-valuetext={p.unit ? `${p.value.toLocaleString("en-US")} ${p.unit}` : `${p.format(p.value)} a quarter`}
      onChange={(e) => p.onChange(fromPos(Number(e.target.value), p.min, p.max))}
      style={{ ["--cc-fill" as string]: `${(toPos(p.value, p.min, p.max) / STEPS) * 100}%` }}
    />
  );
  const ends = (
    <div className="cc__ends" aria-hidden="true">
      <span>{p.format(p.min)}</span>
      <span>{p.format(p.max)}</span>
    </div>
  );

  return (
    <div className={`cc cc--${p.variant}`}>
      {p.variant === "stepper" ? (
        <div className="cc__stepper">
          <button type="button" className="cc__step" aria-label={`Fewer: ${p.format(ladder(p.value, -1, p.min, p.max))}`} disabled={p.value <= p.min} onClick={() => p.onChange(ladder(p.value, -1, p.min, p.max))}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" /></svg>
          </button>
          {number}
          <button type="button" className="cc__step" aria-label={`More: ${p.format(ladder(p.value, 1, p.min, p.max))}`} disabled={p.value >= p.max} onClick={() => p.onChange(ladder(p.value, 1, p.min, p.max))}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M8 3v10" /></svg>
          </button>
        </div>
      ) : (
        <div className="cc__readout">{number}</div>
      )}
      <div className="cc__track">
        {slider}
        {p.variant === "slider" ? (
          <div className="cc__ticks" aria-hidden="true">
            {p.presets.map((v) => (
              <span key={v} className="cc__tick" style={{ left: `${(toPos(v, p.min, p.max) / STEPS) * 100}%` }} />
            ))}
          </div>
        ) : null}
        {ends}
        {p.variant === "slider" ? (
          <div className="cc__marks" role="group" aria-label={p.money ? "Common budgets" : "Common sizes"}>
            {p.presets.map((v) => {
              return (
                <button
                  key={v}
                  type="button"
                  className="cc__mark"
                  aria-pressed={v === p.value}
                  style={{ ["--cc-at" as string]: `${(toPos(v, p.min, p.max) / STEPS) * 100}%` }}
                  onClick={() => p.onChange(v)}
                >
                  {p.format(v)}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
