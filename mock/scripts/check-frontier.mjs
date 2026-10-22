// Checks frontier() (compute/solve.ts) against the acceptance of spec 6.3, on the placeholder data.
// Run from mock/: node scripts/check-frontier.mjs
//
//   (1) every point equals a direct compute at its threshold
//   (2) tokens never rise as the threshold tightens
//   (3) only non-dominated points are returned (checked against a brute-force dominance test)
//   (6) the speed axis is unavailable, with a reason, when no proprietary offer has speed data
//   and the marker for the current setting, the scenario's own setting on the other axis, and
//   the edge cases (no thresholds, a threshold nothing can meet, a bad threshold)
import assert from "node:assert/strict";
import { createServer } from "vite";

const STAGES = ["seats", "api", "platform"];
const BUDGETS = [20_000, 100_000, 5_000_000];

const server = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/data`;

let checks = 0;
const ok = (name) => {
  checks += 1;
  console.log(`  ok  ${name}`);
};

try {
  const { loadTables, loadScenario } = await server.ssrLoadModule("/src/data/load.ts");
  const engine = await server.ssrLoadModule("/src/compute/index.ts");
  const { compute, computeCore, frontier, frontierAvailability, frontierThresholds, NO_SPEED_DATA_REASON } = engine;
  const { deriveDemand } = await server.ssrLoadModule("/src/compute/demand.ts");
  const { computeToday } = await server.ssrLoadModule("/src/compute/today.ts");
  const { typicalPattern } = await server.ssrLoadModule("/src/compute/patterns.ts");
  const tables = await loadTables(base);
  const scenarios = {};
  for (const id of ["s1", "s2", "hardware_heavy"]) scenarios[id] = (await loadScenario(base, id)).scenario;

  const variants = [];
  for (const [id, s] of Object.entries(scenarios)) {
    for (const stage of STAGES) {
      for (const budget of BUDGETS) {
        variants.push({ id, name: `${id}/${stage}/$${budget}`, s: { ...s, stage_today: stage, baseline: { ...s.baseline, budget_usd_per_quarter: budget } } });
      }
    }
  }

  /** The two points are in order of threshold: one beats the other only by being at least as strict and buying at least as much. */
  const dominates = (a, b) =>
    a.threshold >= b.threshold && a.infravana_tokens >= b.infravana_tokens &&
    (a.threshold > b.threshold || a.infravana_tokens > b.infravana_tokens);

  /** The direct compute at a threshold: the public compute() for quality, the core with its option for speed. */
  const direct = {
    quality: (s, t) => compute({ ...s, quality_floor: t }, tables).tokens_bought.infravana_tokens,
    speed: (s, t) => computeCore(s, tables, { min_tok_s_per_user: t }).tokens_bought.infravana_tokens,
  };
  /** Raw sweep: every threshold with a plan, by direct compute. */
  const rawSweep = (axis, s, thresholds) => {
    const out = [];
    for (const t of thresholds) {
      try {
        out.push({ threshold: t, infravana_tokens: direct[axis](s, t) });
      } catch (error) {
        if (error.name !== "SpeedInfeasibleError") throw error;
      }
    }
    return out;
  };

  let pointCount = 0;
  for (const axis of ["quality", "speed"]) {
    for (const v of variants) {
      const thresholds = frontierThresholds(v.s, tables, axis);
      assert.ok(thresholds.length >= 5, `${v.name} ${axis}: thresholds`);
      const result = frontier(v.s, tables, axis, thresholds);
      assert.equal(result.axis, axis);
      assert.ok(result.points.length >= 2, `${v.name} ${axis}: the frontier has a shape`);
      const raw = rawSweep(axis, v.s, thresholds);

      // (1) every point equals a direct compute at its threshold.
      for (const p of result.points) {
        assert.equal(p.infravana_tokens, direct[axis](v.s, p.threshold), `${v.name} ${axis} ${p.threshold}: point against direct compute`);
        assert.ok(thresholds.includes(p.threshold));
        pointCount += 1;
      }
      // (2) tokens never rise as the threshold tightens: on the raw sweep, and on the points.
      for (let i = 1; i < raw.length; i++) {
        assert.ok(raw[i].infravana_tokens <= raw[i - 1].infravana_tokens + 1e-6, `${v.name} ${axis}: the engine's tokens rose from ${raw[i - 1].threshold} to ${raw[i].threshold}`);
      }
      for (let i = 1; i < result.points.length; i++) {
        assert.ok(result.points[i].threshold > result.points[i - 1].threshold, `${v.name} ${axis}: ordered by threshold`);
        assert.ok(result.points[i].infravana_tokens < result.points[i - 1].infravana_tokens, `${v.name} ${axis}: tokens fall at every kept point`);
      }
      // (3) exactly the non-dominated points of the raw sweep.
      const expected = raw.filter((p) => !raw.some((q) => dominates(q, p)));
      assert.deepEqual(result.points, expected, `${v.name} ${axis}: the points are the non-dominated ones`);
    }
  }
  ok(`both axes, ${variants.length} variants each, ${pointCount} points: equal to a direct compute, tokens fall as the threshold tightens, exactly the non-dominated points`);

  // The dominance filter is not vacuous: the raw sweep has points it drops.
  {
    const s = scenarios.s1;
    const thresholds = frontierThresholds(s, tables, "speed");
    const raw = rawSweep("speed", s, thresholds);
    const kept = frontier(s, tables, "speed", thresholds).points;
    assert.ok(raw.length > kept.length, "the speed sweep has dominated (flat) points to drop");
    ok(`the filter drops points: S1 speed sweep ${thresholds.length} thresholds, ${raw.length} with a plan, ${kept.length} kept`);
  }

  // (1) again for speed, through the public compute(): thresholds every standard offer meets
  // can be reproduced by a G4 speed step on tables whose `standard` class is that threshold.
  {
    const slowestStandard = Math.min(...tables.model_offers.filter((o) => o.price_tier === "standard" && o.tok_s_per_user !== null).map((o) => o.tok_s_per_user));
    for (const v of variants.filter((x) => x.s.stage_today !== "seats")) {
      const points = frontier(v.s, tables, "speed", frontierThresholds(v.s, tables, "speed")).points.filter((p) => p.threshold <= slowestStandard);
      assert.ok(points.length >= 1, `${v.name}: points at or under the slowest standard offer`);
      for (const p of points) {
        const classes = { ...tables.manifest.parameters.latency_classes, standard: { min_tok_s_per_user: p.threshold, max_p95_ttft_ms: null } };
        const viaClass = { ...tables, manifest: { ...tables.manifest, parameters: { ...tables.manifest.parameters, latency_classes: classes } } };
        const r = compute({ ...v.s, latency_class: "interactive", goal: "G4", tradeoff: { quality_step: 0, speed_step: 1 } }, viaClass);
        assert.equal(r.tokens_bought.infravana_tokens, p.infravana_tokens, `${v.name} speed ${p.threshold}: against the public compute()`);
      }
    }
    ok("speed points at or under the slowest standard offer equal the public compute() with a G4 speed step on a class set to that threshold");
  }

  // The speed axis ends where a model the visitor buys has no faster offer.
  {
    const proprietary = new Set(tables.models.filter((m) => m.license === "proprietary").map((m) => m.model_id));
    for (const v of variants) {
      const demand = deriveDemand(v.s, tables);
      const today = computeToday(demand, v.s, tables, v.s.comparator ?? typicalPattern(tables, v.s.stage_today).pattern_id);
      const bought = new Set();
      for (const models of today.models_by_workload.values()) for (const m of models) if (proprietary.has(m.model_id)) bought.add(m.model_id);
      const fastest = Math.min(...[...bought].map((id) => Math.max(...tables.model_offers.filter((o) => o.model_id === id && o.tok_s_per_user !== null).map((o) => o.tok_s_per_user))));
      const thresholds = frontierThresholds(v.s, tables, "speed");
      const points = frontier(v.s, tables, "speed", thresholds).points;
      assert.equal(points.at(-1).threshold, Math.max(...thresholds.filter((t) => t <= fastest)), `${v.name}: the last point is the fastest speed every bought model has`);
      assert.deepEqual(frontier(v.s, tables, "speed", [fastest + 0.5, fastest + 100]).points, [], `${v.name}: nothing is faster than the fastest offer`);
    }
    ok("speed axis: the last point is the fastest speed every bought proprietary model has an offer for, and no point exists above it");
  }

  // The marker for the current setting, and the setting on the axis not swept.
  {
    assert.equal(frontier(scenarios.s1, tables, "quality", [60, 70]).current_threshold, 78, "S1 defaults sit at 78");
    for (const [id, s] of Object.entries(scenarios)) {
      const floors = Object.keys(s.workload_mix)
        .filter((w) => s.workload_mix[w] > 0)
        .map((w) => tables.workloads.find((x) => x.workload_id === w).quality_floor);
      assert.equal(frontier(s, tables, "quality", [60]).current_threshold, Math.min(...floors), `${id}: lowest workload floor`);
      assert.equal(frontier(s, tables, "speed", [60]).current_threshold, tables.manifest.parameters.latency_classes[s.latency_class].min_tok_s_per_user, `${id}: latency class minimum speed`);
    }
    assert.equal(frontier({ ...scenarios.s1, quality_floor: 70 }, tables, "quality", [60]).current_threshold, 70, "a global floor is the setting");
    // A G4 trade-off is ignored, as in solveAtBudget.
    const traded = { ...scenarios.s1, goal: "G4", tradeoff: { quality_step: 3, speed_step: 2 } };
    for (const axis of ["quality", "speed"]) {
      const th = frontierThresholds(scenarios.s1, tables, axis);
      assert.deepEqual(frontier(traded, tables, axis, th), frontier(scenarios.s1, tables, axis, th), `${axis}: trade-off ignored`);
    }
    // The quality axis keeps the scenario's speed; the speed axis keeps its floors.
    const standard = { ...scenarios.s1, latency_class: "standard" };
    assert.notDeepEqual(frontier(standard, tables, "quality", [60, 80]).points, frontier(scenarios.s1, tables, "quality", [60, 80]).points, "the quality axis uses the scenario's latency class");
    const lowFloor = { ...scenarios.s1, quality_floor: 50 };
    assert.notDeepEqual(frontier(lowFloor, tables, "speed", [5, 50]).points, frontier(scenarios.s1, tables, "speed", [5, 50]).points, "the speed axis uses the scenario's floors");
    ok("current_threshold (S1 78, class minimum speed), the other axis keeps the scenario's setting, G4 trade-off ignored");
  }

  // Edge cases.
  {
    assert.deepEqual(frontier(scenarios.s1, tables, "quality", []).points, []);
    assert.deepEqual(frontier(scenarios.s1, tables, "speed", []).points, []);
    const once = frontier(scenarios.s1, tables, "quality", [70, 70, 60, 70]);
    assert.deepEqual(once, frontier(scenarios.s1, tables, "quality", [60, 70]), "duplicates and order do not matter");
    for (const bad of [NaN, Infinity]) {
      assert.throws(() => frontier(scenarios.s1, tables, "quality", [60, bad]), /not a finite number/);
    }
    ok("no thresholds gives no points, duplicates and order do not matter, a bad threshold throws");
  }

  // (6) No proprietary speed data: the speed axis is unavailable with a reason.
  {
    assert.deepEqual(frontierAvailability(tables), { quality: null, speed: null });
    const noSpeed = { ...tables, model_offers: tables.model_offers.map((o) => ({ ...o, tok_s_per_user: null, p95_ttft_ms: null })) };
    const availability = frontierAvailability(noSpeed);
    assert.equal(availability.quality, null);
    assert.equal(availability.speed, NO_SPEED_DATA_REASON);
    assert.throws(() => frontier(scenarios.s1, noSpeed, "speed", [10, 50]), (e) => e.message.includes(NO_SPEED_DATA_REASON));
    const quality = frontier(scenarios.s1, noSpeed, "quality", frontierThresholds(scenarios.s1, noSpeed, "quality"));
    assert.deepEqual(quality, frontier(scenarios.s1, tables, "quality", frontierThresholds(scenarios.s1, tables, "quality")), "the quality axis does not need speed data");
    ok(`no proprietary speed data: speed axis unavailable ("${NO_SPEED_DATA_REASON}"), quality axis unchanged`);
  }

  console.log(`check-frontier: ok (${checks} checks)`);
} finally {
  await server.close();
}
