/**
 * Spec 7.2 step 1: demand per workload type, from users, the workload mix,
 * tokens per user per day and working days per quarter.
 */

import type { Scenario, Tables } from "../contract";

export interface WorkloadDemand {
  workload_id: string;
  /** Users (or workflows) assigned to this workload: users x mix share. */
  users: number;
  /** One user's tokens per quarter, in and out. */
  tokens_in_per_user: number;
  tokens_out_per_user: number;
  /** Quarterly tokens for the whole workload. */
  tokens_in: number;
  tokens_out: number;
  /** `scenario.quality_floor` if set, else the workload's own floor. */
  quality_floor: number;
}

/**
 * Workloads with a positive mix share, in workloads.csv order, so the result
 * does not depend on key order in the scenario object. A workflow
 * (`unit: "workflows"`) is demanded like one user: spec 7.1 gives no other
 * conversion, so the count scales demand the same way.
 */
export function deriveDemand(scenario: Scenario, tables: Tables): WorkloadDemand[] {
  const known = new Set(tables.workloads.map((w) => w.workload_id));
  for (const id of Object.keys(scenario.workload_mix)) {
    if (!known.has(id)) {
      throw new Error(`workload_mix names "${id}", which is not a workload_id in workloads.csv`);
    }
  }
  const days = tables.manifest.parameters.working_days_per_quarter;
  const demand: WorkloadDemand[] = [];
  for (const workload of tables.workloads) {
    const share = scenario.workload_mix[workload.workload_id] ?? 0;
    if (!(share > 0)) continue;
    const users = scenario.baseline.users * share;
    const tokensInPerUser = workload.tok_in_per_user_day * days;
    const tokensOutPerUser = workload.tok_out_per_user_day * days;
    demand.push({
      workload_id: workload.workload_id,
      users,
      tokens_in_per_user: tokensInPerUser,
      tokens_out_per_user: tokensOutPerUser,
      tokens_in: users * tokensInPerUser,
      tokens_out: users * tokensOutPerUser,
      quality_floor: scenario.quality_floor ?? workload.quality_floor,
    });
  }
  return demand;
}
