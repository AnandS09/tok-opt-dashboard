/**
 * The three places later steps fill (spec 4, 4.1, 6.2, 6.4). Each slot is its
 * own component with its own props, so a step that builds one replaces that
 * function and leaves `App.tsx`, `Stage.tsx` and the other slots alone.
 *
 *   GoalTabsSlot    above the hero            goal tabs G1 to G4 (6.2)
 *   ComparatorSlot  under the hero            the "Compared with" selector (6.1)
 *   BenefitsSlot    under each figure title   the benefit boxes (6.4)
 *
 * The goal-tabs slot holds the goal tabs and the comparator slot holds the
 * "Compared with" selector. Until the boxes are built the boxes slot shows the
 * one-sentence takeaway the page has always shown. `data-slot` names each one
 * for tests and for the step that replaces it. The view state and its setters arrive in `ctx`.
 */
import { useMemo } from "react";
import type { ChartDef, Results } from "../contract";
import { choiceFor, selectedComparator } from "../store/comparator";
import { goalTabStates } from "../store/goal";
import type { StageSlotContext } from "../store/stage";
import { ComparatorSelect } from "./ComparatorSelect";
import { GoalTabs } from "./GoalTabs";

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
  const { scenario, tables, view, setGoal } = ctx;
  const states = useMemo(() => goalTabStates(scenario, tables), [scenario, tables]);
  return (
    <div data-slot="goal-tabs">
      <GoalTabs active={view.goal} states={states} onSelect={setGoal} />
    </div>
  );
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
  return (
    <div data-slot="benefit-boxes">
      <p className="chart-card__caption">{attempt(() => def.caption(results, ctx.goalView))}</p>
    </div>
  );
}
