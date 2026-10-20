import type { Results, Scenario, Tables } from "../contract";
import { joinList } from "./format";
import { Notice } from "./Notice";

/**
 * The open-weight share asked for and the share the engine could route, from
 * the scenario that produced `results`. Null when the results do not carry it.
 */
export function openShareOf(
  results: Results,
  scenario: Scenario,
): { asked: number; possible: number } | null {
  if (results.effective_open_share === undefined) return null;
  return { asked: scenario.model_mix.open_weight_share, possible: results.effective_open_share };
}

interface ResultNoticesProps {
  results: Results;
  tables: Tables;
}

/**
 * State banners that depend on the results, in the amber notice family: a
 * quality floor that Today's own model does not meet. A budget that does not
 * cover the work is the hero's first line instead (HeadlineStrip).
 */
export function ResultNotices({ results, tables }: ResultNoticesProps) {
  const unmet = (results.floor_unmet_workloads ?? []).map(
    (id) => tables.workloads.find((w) => w.workload_id === id)?.label ?? id,
  );
  if (unmet.length === 0) return null;

  return (
    <Notice title="Today's model is below this quality bar">
      For {joinList(unmet.map((label) => label.toLowerCase()))}, the model used today scores below the
      minimum quality you set. Lower "Minimum model quality" to compare.
    </Notice>
  );
}
