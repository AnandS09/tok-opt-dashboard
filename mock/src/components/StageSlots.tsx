/**
 * The two places later steps fill (spec 4, 4.1, 6.2, 6.4). Each slot is its
 * own component with its own props, so a step that builds one replaces that
 * function and leaves `App.tsx`, `Stage.tsx` and the other slot alone.
 *
 *   GoalSlot        above the stage           the goal tab bar over the result
 *                                             panel, whose headline holds the
 *                                             comparator picker (6.1, 6.2, R-6, R-7)
 *   BenefitsSlot    under each figure title   the benefit boxes (6.4)
 *
 * `data-slot` names each one for tests and for the step that replaces it. The
 * view state and its setters arrive in `ctx`.
 */
import { effectiveView, frontierForView } from "../charts/c10Data";
import type { ChartDef, Results } from "../contract";
import { benefitContext } from "../store/benefitContext";
import { choiceFor, selectedComparator } from "../store/comparator";
import { g3PlaceholderReason, useGoalFigures } from "../store/goal";
import type { StageSlotContext } from "../store/stage";
import { BenefitBoxes } from "./BenefitBoxes";
import { GoalTabs } from "./GoalTabs";
import { HeadlineStrip } from "./HeadlineStrip";

/** The result of a chart function that may throw while an input is mid-change, else `fallback`. */
function attempt<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Slot 1: the goal tab bar and the result panel it is joined to (spec 6.2,
// 15.6, 15.7). The tabs show every goal's figure, so all four goals are worked
// out here whichever tab is active. The comparator is picked inside the
// headline: the panel gets the choice and reports a pick through `setComparator`.
// ---------------------------------------------------------------------------

export function GoalSlot({ ctx, contactUrl }: { ctx: StageSlotContext; contactUrl: string }) {
  const { scenario, tables, results, view, goalView, setGoal, setComparator, setSteps } = ctx;
  const figures = useGoalFigures({ scenario, tables, enabled: true });
  const placeholder = view.goal === "G3" && g3PlaceholderReason(scenario, tables) !== null;
  return (
    <div className="goal-section" data-slot="goal-tabs">
      <GoalTabs active={view.goal} figures={figures} onSelect={setGoal} />
      <HeadlineStrip
        goal={view.goal}
        results={results}
        scenario={scenario}
        goalView={goalView}
        comparator={{
          value: selectedComparator(results, view.comparator),
          onChange: (id) => setComparator(choiceFor(results, id)),
        }}
        placeholder={placeholder}
        onSteps={setSteps}
        contactUrl={contactUrl}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slot 2: benefit boxes, under the figure title (spec 6.4). The chart's
// one-sentence takeaway stays as the boxes' accessible name.
// ---------------------------------------------------------------------------

export function BenefitsSlot({ def, results, ctx }: { def: ChartDef; results: Results; ctx: StageSlotContext }) {
  // The goal tabs hand over the active tab's solve result (null in G1, and in G2 and G3 until it arrives);
  // C10 hands over the frontier of the view it shows (the chart and the boxes share one sweep).
  // While a solve is on its way the boxes stay and dim.
  const { solve, stale } = ctx.goalView;
  const frontier =
    def.id === "C10"
      ? attempt(() => frontierForView(ctx.scenario, ctx.tables, effectiveView(ctx.view.c10, ctx.tables)), null)
      : null;
  const context = benefitContext(ctx.scenario, ctx.tables, solve, frontier);
  const boxes = attempt(() => def.benefits(results, context), []);
  // A solved tab with no value yet is waiting, unless the solve failed or cannot run (G3 with no team work).
  const waiting =
    stale || ((ctx.goalView.goal === "G2" || ctx.goalView.goal === "G3") && solve === null && ctx.goalView.error === null);
  return (
    <div data-slot="benefit-boxes" data-stale={waiting ? "true" : undefined}>
      <BenefitBoxes boxes={boxes} caption={attempt(() => def.caption(results, ctx.goalView), "")} saved={def.id === "C1"} />
    </div>
  );
}
