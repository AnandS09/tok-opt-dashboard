/**
 * The three places later steps fill (spec 4, 4.1, 6.2, 6.4). Each slot is its
 * own component with its own props, so a step that builds one replaces that
 * function and leaves `App.tsx`, `Stage.tsx` and the other slots alone.
 *
 *   GoalTabsSlot    above the hero            goal tabs G1 to G4 (6.2)
 *   ComparatorSlot  under the hero            the "Compared with" selector (6.1)
 *   BenefitsSlot    under each figure title   the benefit boxes (6.4)
 *
 * The comparator slot holds the "Compared with" selector. Until the other two
 * are built the goal-tabs slot draws nothing and the boxes slot shows the
 * one-sentence takeaway the page has always shown. `data-slot` names each one for tests and for the step that
 * replaces it. The view state and its setters arrive in `ctx`.
 */
import type { ChartDef, Results } from "../contract";
import { choiceFor, selectedComparator } from "../store/comparator";
import type { StageSlotContext } from "../store/stage";
import { ComparatorSelect } from "./ComparatorSelect";

/** Text of a chart function that may throw while an input is mid-change. */
function attempt(fn: () => string): string {
  try {
    return fn();
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Slot 1: goal tabs. Replace the body of GoalTabsSlot; keep the wrapper's data-slot.
// ---------------------------------------------------------------------------

export function GoalTabsSlot({ ctx }: { ctx: StageSlotContext }) {
  void ctx;
  // Nothing is drawn until the tabs exist: an empty hook for them, not text for visitors.
  return <div data-slot="goal-tabs" />;
}

// ---------------------------------------------------------------------------
// Slot 2: the "Compared with" selector. Replace the body of ComparatorSlot.
// ---------------------------------------------------------------------------

export function ComparatorSlot({ ctx }: { ctx: StageSlotContext }) {
  const { results, view, setComparator } = ctx;
  return (
    <div data-slot="comparator">
      <ComparatorSelect
        results={results}
        value={selectedComparator(results, view.comparator)}
        onChange={(id) => setComparator(choiceFor(results, id))}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slot 3: benefit boxes, under the figure title. Replace the body of BenefitsSlot.
// Until the boxes exist it shows the chart's one-sentence takeaway, which
// stays as the chart's accessible name once they do (spec 6.4).
// ---------------------------------------------------------------------------

export function BenefitsSlot({ def, results, ctx }: { def: ChartDef; results: Results; ctx: StageSlotContext }) {
  void ctx;
  return (
    <div data-slot="benefit-boxes">
      <p className="chart-card__caption">{attempt(() => def.caption(results))}</p>
    </div>
  );
}
