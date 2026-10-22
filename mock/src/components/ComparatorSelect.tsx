import { useId } from "react";
import "../styles/compare.css";
import type { PatternId, Results } from "../contract";
import { comparatorOptions } from "../store/comparator";

interface ComparatorSelectProps {
  results: Results;
  /** The comparator shown as chosen (see `selectedComparator`). */
  value: PatternId;
  /** Called with the picked id. */
  onChange: (id: PatternId) => void;
}

/**
 * The "Compared with" selector (spec 6.1): a labelled native select, so it is
 * operable by keyboard and announced by screen readers without extra code. It
 * lists every comparator `Results.today_alternatives` offers, the derived best
 * single option among them, and marks the typical buyer. It holds no state:
 * the stage slot owns the choice and recomputes the page when it changes.
 */
export function ComparatorSelect({ results, value, onChange }: ComparatorSelectProps) {
  const id = useId();
  const options = comparatorOptions(results);
  const picked = options.find((a) => a.pattern_id === value);
  const hintId = `${id}-hint`;
  const showHint = picked?.detail != null;
  return (
    <div className="compare-select">
      <label className="compare-select__label" htmlFor={id}>
        Compared with
      </label>
      <select
        id={id}
        className="compare-select__control"
        value={value}
        aria-describedby={showHint ? hintId : undefined}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((a) => (
          <option key={a.pattern_id} value={a.pattern_id}>
            {a.is_typical ? `${a.label} (typical for you)` : a.label}
          </option>
        ))}
      </select>
      {showHint ? (
        <p id={hintId} className="compare-select__hint">
          The cheapest single offer that meets your floors: {picked?.detail}.
        </p>
      ) : null}
    </div>
  );
}
