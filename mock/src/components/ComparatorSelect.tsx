import { useId } from "react";
import "../styles/compare.css";
import type { PatternId, Results } from "../contract";
import { comparatorOptions, selectedComparator, setComparator, useComparator } from "../store/comparator";

interface ComparatorSelectProps {
  results: Results;
  /** Controlled use: the shown choice. Omitted, the shared choice of `store/comparator.ts` is used. */
  value?: PatternId;
  /** Called with the picked id. Omitted, the choice is written to `store/comparator.ts`. */
  onChange?: (id: PatternId) => void;
}

/**
 * The "Compared with" selector (spec 6.1): a labelled native select, so it is
 * operable by keyboard and announced by screen readers without extra code. It
 * lists every comparator `Results.today_alternatives` offers, the derived best
 * single option among them, and marks the typical buyer. It does not change
 * the page by itself: the choice is exposed through `store/comparator.ts`.
 */
export function ComparatorSelect({ results, value, onChange }: ComparatorSelectProps) {
  const id = useId();
  const stored = useComparator();
  const options = comparatorOptions(results);
  const current = value ?? selectedComparator(results, stored);
  const picked = options.find((a) => a.pattern_id === current);
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
        value={current}
        aria-describedby={showHint ? hintId : undefined}
        onChange={(e) => (onChange ? onChange(e.target.value) : setComparator(e.target.value))}
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
