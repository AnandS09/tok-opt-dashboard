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
 * State banners that depend on the results, in the amber notice family:
 * the infeasible budget (Today side, spec 5) and a quality floor that Today's
 * own model does not meet.
 */
export function ResultNotices({ results, tables }: ResultNoticesProps) {
  // One rounding rule (nearest percent) for the trigger, title and body, so a shortfall that
  // displays as 100% raises no banner and the title never disagrees with the body.
  const { demand_tokens, today_tokens, infravana_tokens } = results.tokens_bought;
  const todayPct = Math.round((today_tokens / demand_tokens) * 100);
  const infravanaPct = Math.min(100, Math.round((infravana_tokens / demand_tokens) * 100));
  const unmet = (results.floor_unmet_workloads ?? []).map(
    (id) => tables.workloads.find((w) => w.workload_id === id)?.label ?? id,
  );

  return (
    <>
      {unmet.length > 0 ? (
        <Notice title="Neither side meets the quality floor">
          For {joinList(unmet.map((label) => label.toLowerCase()))}, the model Today buys scores below the
          quality floor in effect. InfraVana keeps that same proprietary model for the traffic it does not
          move, so it does not meet the floor either. Lower the floor to compare like with like.
        </Notice>
      ) : null}
      {todayPct < 100 ? (
        <Notice title={`Budget covers only ${todayPct}% of this workload`}>
          At today's prices the budget buys {todayPct}% of the tokens this workload needs.
          {infravanaPct < 100
            ? ` With InfraVana it covers ${infravanaPct}%.`
            : " With InfraVana it covers all of it."}{" "}
          The charts below still show the comparison.
        </Notice>
      ) : null}
    </>
  );
}
