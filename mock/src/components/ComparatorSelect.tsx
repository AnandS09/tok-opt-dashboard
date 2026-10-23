import "../styles/compare.css";
import type { PatternId, Results, TodayAlternative } from "../contract";
import { comparatorOptions } from "../store/comparator";

interface ComparatorSelectProps {
  results: Results;
  /** The comparator shown as chosen (see `selectedComparator`). */
  value: PatternId;
  /** Called with the picked id. */
  onChange: (id: PatternId) => void;
  /** Id of the line under the headline that explains the picker; it becomes the control's description. */
  describedBy?: string;
}

/**
 * The comparator picker (spec 6.1, 15.7): the name of the Today the headline
 * measures InfraVana against, drawn as part of the headline text with a caret
 * and a 3px underline. It is a native select, so keyboard and screen readers
 * work without extra code: the select lies over the visible name, transparent
 * except for its own 3px bottom border (the underline), and the name beneath
 * wraps like any other headline words. It lists every comparator
 * `Results.today_alternatives` offers, the derived best single option among
 * them; the typical buyer is marked in the list while another is chosen. It
 * holds no state: the stage owns the choice and recomputes the page when it
 * changes.
 */
export function ComparatorSelect({ results, value, onChange, describedBy }: ComparatorSelectProps) {
  const options = comparatorOptions(results);
  const picked = options.find((a) => a.pattern_id === value);
  return (
    <span className="comparator" data-slot="comparator">
      <span className="comparator__text">{picked?.label ?? value}</span>
      <svg className="comparator__caret" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M2.5 4.5 6 8l3.5-3.5" />
      </svg>
      <select
        className="comparator__control"
        aria-label="Compared with"
        aria-describedby={describedBy}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((a) => (
          <option key={a.pattern_id} value={a.pattern_id}>
            {a.is_typical && a.pattern_id !== value ? `${a.label} (typical for you)` : a.label}
          </option>
        ))}
      </select>
    </span>
  );
}

/** The plain statement of what the picked comparator is, the first sentence of the line under the headline. */
function whatItIs(picked: TodayAlternative, typical: TodayAlternative | undefined): string {
  if (picked.kind === "best_single") {
    return `is the cheapest single offer that meets your quality and speed${picked.detail_label ? `: ${picked.detail_label}` : ""}.`;
  }
  if (picked.is_typical) return "is the way a company like yours most often buys AI today.";
  return `is not the way a company like yours most often buys AI today${typical ? `; that is ${typical.label}` : ""}.`;
}

/**
 * The one plain line under the headline (spec 15.7): what the comparator means.
 * The comparator's name is in bold. It is the picker's accessible description.
 */
export function ComparatorLine({ results, value, id }: { results: Results; value: PatternId; id: string }) {
  const options = comparatorOptions(results);
  const picked = options.find((a) => a.pattern_id === value);
  if (!picked) return null;
  return (
    <p id={id} className="hero__compare">
      <strong>{picked.label}</strong> {whatItIs(picked, options.find((a) => a.is_typical))} Every saving on this page is
      measured against it; pick another way to buy in the headline to compare against that instead.
    </p>
  );
}
