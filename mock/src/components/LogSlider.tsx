import { useId, useState, type KeyboardEvent } from "react";
import type { Range } from "../data/ranges";
import { fmtInt } from "./format";
import {
  adjacentMark,
  clampTyped,
  positionToValue,
  SLIDER_STEPS,
  syncPosition,
  valueToFraction,
} from "../store/logScale";
import { parseNumber } from "../store/parseNumber";

export interface LogSliderProps {
  /** The question, which names the slider for a screen reader. */
  label: string;
  /** The word after the number ("people"), or null for a money value, which reads "a quarter". */
  unit: string | null;
  range: Range;
  /** Preset values, drawn as clickable marks. */
  marks: readonly number[];
  /** Names the group of marks ("Common team sizes"). */
  marksLabel: string;
  value: number;
  /** A mark or range-end label ("25", "$10K"). */
  formatMark: (n: number) => string;
  /** Money shows a "$" before the number. */
  money?: boolean;
  onChange: (value: number) => void;
}

/** The box width in digit widths: a comma is about half a digit, and a little room is left for the caret. */
function inputChars(display: string): number {
  const commas = display.split(",").length - 1;
  return Math.max(2, display.length - commas * 0.5) + 0.6;
}

const INVALID = "Enter a number, such as 2500, 20K or 1.5M.";

/** The note shown when a typed value was snapped to a bound of the range. */
function clampNote(limit: "min" | "max", bound: number, money: boolean): string {
  // The unit stays out of it: "1 people" reads wrong, and the box beside the note already shows it.
  return `Set to ${money ? "$" : ""}${fmtInt(bound)}, the ${limit === "max" ? "most" : "least"} this page models.`;
}

/**
 * A log-scale slider with a typed number box and clickable preset marks
 * (spec 5.1). The box, the slider and the marks all show the one `value`;
 * dragging or typing sets any value in range and a mark sets its own value.
 */
export function LogSlider({ label, unit, range, marks, marksLabel, value, formatMark, money = false, onChange }: LogSliderProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const [position, setPosition] = useState(0);
  const [text, setText] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const shownPosition = syncPosition(position, value, range);
  const set = (next: number) => {
    if (next !== value) onChange(next);
  };

  const commit = () => {
    // Nothing was edited, or the text is what a commit already wrote: leave any note alone.
    if (text === null || text === fmtInt(value)) return;
    const parsed = parseNumber(text);
    if (parsed === null) {
      setNote(INVALID);
      setText(fmtInt(value));
      return;
    }
    const { value: next, limit } = clampTyped(parsed, range);
    setNote(limit ? clampNote(limit, next, money) : "");
    setText(fmtInt(next));
    set(next);
  };

  const onRangeChange = (raw: number) => {
    setPosition(raw);
    setNote("");
    set(positionToValue(raw, range));
  };

  const onRangeKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "PageUp" && e.key !== "PageDown") return;
    e.preventDefault();
    setNote("");
    set(adjacentMark(value, marks, e.key === "PageUp" ? 1 : -1, range));
  };

  const display = text ?? fmtInt(value);
  const valueText = money ? `$${fmtInt(value)} a quarter` : `${fmtInt(value)} ${unit ?? ""}`.trim();

  return (
    <div className="lv">
      <div className="lv__readout">
        {money ? (
          <span className="lv__affix lv__affix--lead" aria-hidden="true">
            $
          </span>
        ) : null}
        <input
          className="lv__input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          value={display}
          style={{ width: `${inputChars(display)}ch` }}
          aria-label={`${label} Type a number.`}
          aria-describedby={noteId}
          onFocus={(e) => {
            setText(fmtInt(value));
            e.currentTarget.select();
          }}
          onChange={(e) => {
            setText(e.target.value);
            setNote("");
          }}
          onBlur={() => {
            commit();
            setText(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
        />
        <span className="lv__affix">{money ? "a quarter" : unit}</span>
      </div>
      <p id={noteId} className="lv__note" role="status">
        {note}
      </p>
      <div className="lv__track">
        <input
          className="lv__range"
          type="range"
          min={0}
          max={SLIDER_STEPS}
          step={1}
          value={shownPosition}
          aria-label={label}
          aria-valuetext={valueText}
          style={{ ["--lv-fill" as string]: `${(shownPosition / SLIDER_STEPS) * 100}%` }}
          onChange={(e) => onRangeChange(Number(e.target.value))}
          onKeyDown={onRangeKey}
        />
        <div className="lv__ticks" aria-hidden="true">
          {marks.map((m) => (
            <span key={m} className="lv__tick" style={{ left: `${valueToFraction(m, range) * 100}%` }} />
          ))}
        </div>
        <div className="lv__ends" aria-hidden="true">
          <span>{formatMark(range.min)}</span>
          <span>{formatMark(range.max)}</span>
        </div>
        <div className="lv__marks" role="group" aria-label={marksLabel}>
          {marks.map((m) => (
            <button
              key={m}
              type="button"
              className="lv__mark"
              aria-pressed={m === value}
              style={{ ["--lv-at" as string]: `${valueToFraction(m, range) * 100}%` }}
              onClick={() => {
                setNote("");
                set(m);
              }}
            >
              {formatMark(m)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
