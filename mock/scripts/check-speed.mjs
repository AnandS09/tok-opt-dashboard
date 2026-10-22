// Checks the G4 speed step (compute/tradeoff.ts, infravana.ts) against spec 6.2 G4
// and the guardrails of spec 12 BD-11, on the placeholder data.
// Run from mock/: node scripts/check-speed.mjs
//
//   1. the default numbers, and every default view, are unchanged by the batch and flex rows
//   2. G4 steps: each step down never raises InfraVana spend, Today is identical at every
//      step, step (0, 0) equals the untraded call, infravana_side follows the steps
//   3. the speed step is worth something and its figures are modelled, never measured
//   4. its spend equals a default-view compute on tables where the admitted rows are standard
//   5. with no speed data the step reports itself unavailable and changes nothing
import assert from "node:assert/strict";
import { createServer } from "vite";

/** [today USD, InfraVana spend USD, demand tokens] per quarter, as in check-demand.mjs. */
const BEFORE = {
  s1: [100012.5, 70440.09177916667, 8023050000],
  s2: [72487.61099999999, 49555.11882799479, 6457500000],
  hardware_heavy: [88987.5, 70289.27529652779, 7147350000],
};
const CLASS_AFTER = ["interactive", "standard", "batch", "batch"];
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
  const { compute, speedUnavailableReason, NO_SPEED_DATA_REASON } = engine;
  const tables = await loadTables(base);
  const scenarios = {};
  for (const id of ["s1", "s2", "hardware_heavy"]) scenarios[id] = (await loadScenario(base, id)).scenario;

  const spendOf = (r) => r.allocation.infravana.filter((x) => x.kind !== "savings").reduce((a, x) => a + x.usd, 0);
  const g4 = (s, q, v) => ({ ...s, goal: "G4", tradeoff: { quality_step: q, speed_step: v } });
  const variants = [];
  for (const [id, s] of Object.entries(scenarios)) {
    for (const stage of STAGES) {
      for (const budget of BUDGETS) {
        variants.push({ name: `${id}/${stage}/$${budget}`, s: { ...s, stage_today: stage, baseline: { ...s.baseline, budget_usd_per_quarter: budget } } });
      }
    }
  }

  // ---- 1. default numbers and default views do not move ---------------------
  for (const [id, expected] of Object.entries(BEFORE)) {
    const r = compute(scenarios[id], tables);
    assert.deepEqual([r.allocation.total_usd, spendOf(r), r.tokens_bought.demand_tokens], expected, id);
  }
  ok("default numbers: S1 100,012.50 / 70,440.09, S2 72,487.61 / 49,555.12, hardware_heavy 88,987.50 / 70,289.28");

  // The same tables without the batch and flex rows and without any speed value.
  const stripped = {
    ...tables,
    model_offers: tables.model_offers
      .filter((o) => o.price_tier === "standard")
      .map((o) => ({ ...o, tok_s_per_user: null, p95_ttft_ms: null, provenance: "vendor_reported" })),
  };
  assert.ok(tables.model_offers.length > stripped.model_offers.length, "the data has batch or flex rows");
  for (const v of variants) {
    assert.deepEqual(compute(v.s, tables), compute(v.s, stripped), `${v.name}: default view`);
    assert.deepEqual(compute({ ...v.s, goal: "G2" }, tables), compute({ ...v.s, goal: "G2" }, stripped), `${v.name}: G2`);
  }
  ok(`default views (G1, G2) equal the results without any batch, flex or speed row, over ${variants.length} scenario variants`);

  // ---- 2. G4 steps ----------------------------------------------------------
  const EPS = 1e-6;
  let gridPoints = 0;
  for (const v of variants) {
    const untraded = compute(v.s, tables);
    assert.deepEqual(compute(g4(v.s, 0, 0), tables), untraded, `${v.name}: step (0, 0) equals the untraded call`);
    const spend = [];
    for (let q = 0; q <= 4; q++) {
      spend[q] = [];
      for (let s = 0; s <= 3; s++) {
        const r = compute(g4(v.s, q, s), tables);
        gridPoints += 1;
        spend[q][s] = spendOf(r);
        const at = `${v.name} q${q} s${s}`;
        assert.deepEqual(r.allocation.today, untraded.allocation.today, `${at}: Today's segments`);
        assert.equal(r.allocation.total_usd, untraded.allocation.total_usd, `${at}: Today's total`);
        assert.equal(r.tokens_bought.today_tokens, untraded.tokens_bought.today_tokens, `${at}: Today's tokens`);
        assert.deepEqual(r.today_alternatives, untraded.today_alternatives, `${at}: Today options`);
        assert.deepEqual(r.quality_floor_by_workload, untraded.quality_floor_by_workload, `${at}: the visitor's floors`);
        assert.equal(r.infravana_side.latency_class, CLASS_AFTER[CLASS_AFTER.indexOf("interactive") + s], `${at}: latency class`);
        if (q === 0) assert.deepEqual(r.infravana_side.quality_floor_by_workload, untraded.quality_floor_by_workload, `${at}: floors with no quality step`);
        if (q > 0) assert.ok(spend[q][s] <= spend[q - 1][s] + EPS, `${at}: a quality step raised spend (${spend[q - 1][s]} to ${spend[q][s]})`);
        if (s > 0) assert.ok(spend[q][s] <= spend[q][s - 1] + EPS, `${at}: a speed step raised spend (${spend[q][s - 1]} to ${spend[q][s]})`);
      }
    }
  }
  ok(`G4 grid, ${gridPoints} points: spend never rises with either step, Today and the visitor's floors identical, step (0, 0) equals the untraded call`);

  // ---- 3. the step is worth something, and says it is modelled --------------
  const worth = {};
  for (const id of Object.keys(scenarios)) {
    const s = scenarios[id];
    const own = compute(g4(s, 0, 0), tables);
    const step1 = compute(g4(s, 0, 1), tables);
    const step2 = compute(g4(s, 0, 2), tables);
    worth[id] = [spendOf(own), spendOf(step1), spendOf(step2)];
    assert.ok(spendOf(step1) < spendOf(own) * 0.95, `${id}: step 1 is worth over 5 percent`);
    assert.ok(spendOf(step2) < spendOf(step1), `${id}: step 2 is worth more than step 1`);
    const arbitrage = (r) => r.allocation.infravana.find((x) => x.kind === "savings" && x.savings_source === "arbitrage");
    assert.equal(arbitrage(own).provenance, "vendor_reported", `${id}: arbitrage at your own speed keeps its price provenance`);
    for (const r of [step1, step2]) {
      assert.equal(arbitrage(r).provenance, "modelled", `${id}: arbitrage through batch or flex rows is modelled`);
      assert.equal(r.allocation.provenance.infravana, "modelled", `${id}: the InfraVana side is modelled`);
      const frontierClass = r.cost_per_mtok.by_model_class.find((c) => c.model_class === "frontier");
      assert.equal(frontierClass.infravana_provenance, "modelled", `${id}: the frontier class price is modelled`);
      assert.equal(r.allocation.provenance.today, own.allocation.provenance.today, `${id}: Today's provenance unchanged`);
    }
    assert.equal(
      own.cost_per_mtok.by_model_class.find((c) => c.model_class === "frontier").infravana_provenance,
      "vendor_reported",
      `${id}: the frontier class price at your own speed is not badged modelled`,
    );
  }
  ok(`speed step worth: ${Object.entries(worth).map(([id, w]) => `${id} ${w.map((x) => x.toFixed(2)).join(" > ")}`).join("; ")}`);

  // ---- 4. the figures follow from the rows they admit -----------------------
  // Step 1 admits the flex rows (they meet `standard`), step 2 the batch rows too. The same
  // spend must come from a default-view compute on tables where those rows are standard and
  // the scenario is at that class, which never touches the speed-requirement path.
  const admit = (tiers) => ({
    ...tables,
    model_offers: tables.model_offers
      .filter((o) => o.price_tier === "standard" || tiers.includes(o.price_tier))
      .map((o) => ({ ...o, price_tier: "standard" })),
  });
  const viaTables = [admit(["flex"]), admit(["flex", "batch"])];
  // The api and platform stages do not read the direct-channel seat overage price, which the
  // converted tables would change.
  const comparable = variants.filter((v) => v.s.stage_today !== "seats");
  for (const v of comparable) {
    for (const step of [1, 2]) {
      const traded = spendOf(compute(g4(v.s, 0, step), tables));
      const direct = spendOf(compute({ ...v.s, latency_class: CLASS_AFTER[step] }, viaTables[step - 1]));
      assert.ok(Math.abs(traded - direct) < EPS, `${v.name} step ${step}: ${traded} against ${direct}`);
    }
  }
  ok(`speed step spend equals a default-view compute on the admitted rows, ${comparable.length} variants x 2 steps`);

  // ---- 5. with no speed data the step is unavailable ------------------------
  assert.equal(speedUnavailableReason(tables), null);
  const noSpeed = {
    ...tables,
    model_offers: tables.model_offers.map((o) => ({ ...o, tok_s_per_user: null, p95_ttft_ms: null })),
  };
  assert.equal(speedUnavailableReason(noSpeed), NO_SPEED_DATA_REASON);
  assert.match(NO_SPEED_DATA_REASON, /speed/);
  const openOnly = {
    ...noSpeed,
    model_offers: noSpeed.model_offers.map((o) => (o.offer_id === "open_x_neocloud_useast" ? { ...o, tok_s_per_user: 90, p95_ttft_ms: 300 } : o)),
  };
  assert.ok(speedUnavailableReason(openOnly) !== null, "speed data on an open-weight offer alone does not enable the step");
  for (const v of variants) {
    const own = compute(g4(v.s, 0, 0), noSpeed);
    for (const step of [1, 2, 3]) {
      const r = compute(g4(v.s, 0, step), noSpeed);
      assert.deepEqual(r, own, `${v.name}: a speed step with no speed data changes nothing`);
      assert.equal(r.infravana_side.latency_class, v.s.latency_class, `${v.name}: the class stays`);
    }
    // The quality step still works without speed data.
    assert.ok(spendOf(compute(g4(v.s, 1, 0), noSpeed)) <= spendOf(own) + EPS, `${v.name}: quality step`);
  }
  const noSpeedTables = compute(g4(scenarios.s1, 0, 0), noSpeed);
  assert.deepEqual(noSpeedTables.allocation.today, compute(scenarios.s1, tables).allocation.today);
  ok("no proprietary speed data: speedUnavailableReason gives the reason, a speed step changes nothing, the quality step still works");

  console.log(`check-speed: ok (${checks} checks)`);
} finally {
  await server.close();
}
