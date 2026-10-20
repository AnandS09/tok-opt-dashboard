// Checks per-basis demand (compute/demand.ts): the three example scenarios
// give the numbers they gave before customer workloads existed, and the
// customer count scales only customer workloads.
// Run from mock/: node scripts/check-demand.mjs
import assert from "node:assert/strict";
import { createServer } from "vite";

/** [today USD, InfraVana spend USD, demand tokens] per quarter, captured at 8e00537. */
const BEFORE = {
  s1: [100012.5, 70440.09177916667, 8023050000],
  s2: [72487.61099999999, 49555.11882799479, 6457500000],
  "s2@target": [144975.22199999998, 99110.23765598958, 12915000000],
  hardware_heavy: [88987.5, 70289.27529652779, 7147350000],
};

const server = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/data`;
try {
  const { loadTables, loadScenario } = await server.ssrLoadModule("/src/data/load.ts");
  const { compute, scenarioAtTarget } = await server.ssrLoadModule("/src/compute/index.ts");
  const { deriveDemand } = await server.ssrLoadModule("/src/compute/demand.ts");
  const tables = await loadTables(base);
  const summary = (s) => {
    const r = compute(s, tables);
    const spend = r.allocation.infravana.filter((x) => x.kind !== "savings").reduce((a, x) => a + x.usd, 0);
    return [r.allocation.total_usd, spend, r.tokens_bought.demand_tokens];
  };

  const s1 = (await loadScenario(base, "s1")).scenario;
  for (const id of ["s1", "s2", "hardware_heavy"]) {
    const { scenario } = await loadScenario(base, id);
    assert.deepEqual(summary(scenario), BEFORE[id], id);
    const target = scenarioAtTarget(scenario);
    if (target) assert.deepEqual(summary(target), BEFORE[`${id}@target`], `${id} target`);
  }

  // S1's employee work plus customer work: customers scale only the customer rows.
  const mixed = (customers) => ({
    ...s1,
    baseline: { ...s1.baseline, customers },
    workload_mix: { ...s1.workload_mix, customer_service: 0.5, product_ai: 0.5 },
  });
  const tokens = (s) =>
    Object.fromEntries(deriveDemand(s, tables).map((d) => [d.workload_id, d.tokens_in + d.tokens_out]));
  const one = tokens(mixed(10_000));
  const two = tokens(mixed(20_000));
  for (const id of ["software_design", "hardware_design"]) assert.equal(two[id], one[id], `${id} ignores customers`);
  for (const id of ["customer_service", "product_ai"]) assert.equal(two[id], 2 * one[id], `${id} doubles`);
  assert.deepEqual(summary(mixed(0)), BEFORE.s1, "no customers gives S1");
  assert.deepEqual(summary({ ...mixed(10_000), baseline: { ...s1.baseline, users: 0, customers: 10_000 } })[2],
    one.customer_service + one.product_ai, "no users leaves only customer demand");
  console.log("check-demand: ok");
} finally {
  await server.close();
}
