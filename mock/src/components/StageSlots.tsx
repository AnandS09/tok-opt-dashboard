/**
 * The three places later steps fill (spec 4, 4.1, 6.2, 6.4). Each slot is its
 * own component with its own props, so a step that builds one replaces that
 * function and leaves `App.tsx`, `Stage.tsx` and the other slots alone.
 *
 *   GoalTabsSlot    above the hero            goal tabs G1 to G4 (6.2)
 *   ComparatorSlot  under the hero            the "Compared with" selector (6.1)
 *   BenefitsSlot    under each figure title   the benefit boxes (6.4)
 *
 * The goal-tabs slot holds the goal tabs, the comparator slot holds the
 * "Compared with" selector and the boxes slot holds the benefit boxes.
 * `data-slot` names each one for tests and for the step that replaces it. The
 * view state and its setters arrive in `ctx`.
 */
import { useMemo } from "react";
import type { ChartDef, Results } from "../contract";
import { benefitContext } from "../store/benefitContext";
import { choiceFor, selectedComparator } from "../store/comparator";
import { goalTabStates } from "../store/goal";
import type { StageSlotContext } from "../store/stage";
import { BenefitBoxes } from "./BenefitBoxes";
import { ComparatorSelect } from "./ComparatorSelect";
import { GoalTabs } from "./GoalTabs";

/** The result of a chart function that may throw while an input is mid-change, else `fallback`. */
function attempt<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
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
// Slot 3: benefit boxes, under the figure title (spec 6.4). The chart's
// one-sentence takeaway stays as the boxes' accessible name.
// ---------------------------------------------------------------------------

export function BenefitsSlot({ def, results, ctx }: { def: ChartDef; results: Results; ctx: StageSlotContext }) {
  // The goal tabs hand over the active tab's solve result (null in G1, and in G2 and G3 until it arrives);
  // C10 does not yet hand over a frontier. While a solve is on its way the boxes stay and dim.
  const { solve, stale } = ctx.goalView;
  const context = benefitContext(ctx.scenario, ctx.tables, solve, null);
  const boxes = attempt(() => def.benefits(results, context), []);
  const waiting = stale || ((ctx.goalView.goal === "G2" || ctx.goalView.goal === "G3") && solve === null);
  return (
    <div data-slot="benefit-boxes" data-stale={waiting ? "true" : undefined}>
      <BenefitBoxes boxes={boxes} caption={attempt(() => def.caption(results, ctx.goalView), "")} saved={def.id === "C1"} />
    </div>
  );
}
