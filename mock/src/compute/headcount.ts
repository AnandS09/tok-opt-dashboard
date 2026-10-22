/**
 * The count the per-head benefit boxes divide by (spec 6.4, chart C1 box 3):
 * "per team member, or per customer when the mix has no team work".
 */

import type { Scenario, Tables } from "../contract";

/**
 * The scenario's people when its workload mix has employee work, else its
 * customers when the mix has customer work and a customer count, else null.
 */
export function benefitHeadcount(scenario: Scenario, tables: Tables): number | null {
  const inMix = (basis: "employee" | "customer"): boolean =>
    tables.workloads.some(
      (w) => w.basis === basis && (scenario.workload_mix[w.workload_id] ?? 0) > 0,
    );
  if (inMix("employee")) return scenario.baseline.users;
  const customers = scenario.baseline.customers ?? 0;
  return inMix("customer") && customers > 0 ? customers : null;
}
