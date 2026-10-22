// Checks the goal-tab solver (compute/solve.ts, goals.ts) and its worker client
// (solveClient.ts) against the spec 6.2 acceptance cases, on the placeholder data.
// Run from mock/: node scripts/check-solve.mjs
//
// The expected multiples come from the spec (S1 at 5,000 people and $90M gives
// about 1.42; S2 at $30K gives about 1.30), and an independent re-implementation
// of the spec wording below, built on the full `compute()` and not on `computeCore`.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { createServer } from "vite";

/** [today USD, InfraVana spend USD, demand tokens] per quarter, as in check-demand.mjs. */
const BEFORE = {
  s1: [100012.5, 70440.09177916667, 8023050000],
  s2: [72487.61099999999, 49555.11882799479, 6457500000],
  hardware_heavy: [88987.5, 70289.27529652779, 7147350000],
};

const server = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/data`;

let checks = 0;
const ok = (name) => {
  checks += 1;
  console.log(`  ok  ${name}`);
};
const close = (actual, expected, tolerance, name) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${name}: ${actual} is not within ${tolerance} of ${expected}`);
};
/** Runs `fn` and asserts it throws an error whose message matches `pattern`. */
const throwsLike = (fn, pattern, name) => {
  assert.throws(fn, (error) => pattern.test(error.message), name);
};

try {
  const { loadTables, loadScenario } = await server.ssrLoadModule("/src/data/load.ts");
  const compute = await server.ssrLoadModule("/src/compute/index.ts");
  const { createSolveHandler } = await server.ssrLoadModule("/src/compute/solveProtocol.ts");
  const { SolveClient, SOLVE_DEBOUNCE_MS } = await server.ssrLoadModule("/src/compute/solveClient.ts");
  const { deriveDemand } = await server.ssrLoadModule("/src/compute/demand.ts");
  const { computeCore } = await server.ssrLoadModule("/src/compute/core.ts");
  const { USERS_RANGE } = await server.ssrLoadModule("/src/data/ranges.ts");
  const tables = await loadTables(base);
  const scen = async (id) => (await loadScenario(base, id)).scenario;
  const s1 = await scen("s1");
  const s2 = await scen("s2");
  const hardwareHeavy = await scen("hardware_heavy");
  const at = (s, users, budget, customers) => ({
    ...s,
    baseline: { ...s.baseline, users, budget_usd_per_quarter: budget, ...(customers === undefined ? {} : { customers }) },
  });

  // ---- An independent solver, written from the spec 6.2 wording -------------
  const spendOf = (r) => r.allocation.infravana.filter((x) => x.kind !== "savings").reduce((a, x) => a + x.usd, 0);
  const intensity = (k) => ({
    ...tables,
    workloads: tables.workloads.map((w) => ({
      ...w,
      tok_in_per_user_day: w.tok_in_per_user_day * k,
      tok_out_per_user_day: w.tok_out_per_user_day * k,
    })),
  });
  const spendFns = (s, axis) => {
    const run = (k) =>
      axis === "intensity"
        ? compute.compute(s, intensity(k))
        : compute.compute({ ...s, baseline: { ...s.baseline, users: s.baseline.users * k } }, tables);
    return { today: (k) => run(k).allocation.total_usd, infravana: (k) => spendOf(run(k)) };
  };
  /** The spec wording: ceiling 2B over linear spend, 1% geometric scan from 0.01, bisect to 0.1%. */
  function specSolve(spendAt, budget) {
    const ceiling = (2 * budget) / spendAt(1);
    let lo = null;
    let hi = null;
    for (let s = 0.01; s <= ceiling; s *= 1.01) {
      if (spendAt(s) <= budget) {
        lo = s;
        hi = null;
      } else if (lo !== null && hi === null) hi = s;
    }
    if (lo === null || hi === null) return { lo, scanned: ceiling };
    while ((hi - lo) / lo > 0.001) {
      const m = (lo + hi) / 2;
      if (spendAt(m) <= budget) lo = m;
      else hi = m;
    }
    return { lo, scanned: ceiling };
  }
  /** Spec 6.2 acceptance (1): no scanned scale above `scale` has spend within the budget. */
  const noScannedAbove = (spendAt, budget, scale) => {
    const ceiling = (2 * budget) / spendAt(1);
    for (let s = 0.01; s <= ceiling; s *= 1.01) {
      if (s > scale * 1.0000001 && spendAt(s) <= budget) return false;
    }
    return true;
  };
  const solved = (s, axis) => compute.solveAtBudget(s, tables, axis);

  // ---- The spec's acceptance cases ----------------------------------------
  console.log("acceptance cases (spec 6.2)");

  const big = at(s1, 5000, 90e6);
  const bigG2 = solved(big, "intensity");
  close(bigG2.multiple, 1.42, 0.005, "S1 5,000 people $90M G2");
  assert.ok(Math.abs(bigG2.multiple - 1) > 0.3, "G2 is not 1.0");
  close(bigG2.multiple, 1.4201, 0.0005, "S1 5,000 people $90M G2 against a solver written from the spec wording");
  ok(`S1 at 5,000 people and $90M: G2 ${bigG2.multiple.toFixed(4)} (about 1.42, not 1.0)`);

  const bigG3 = solved(big, "users");
  // Today's 44,968 and InfraVana's 63,860 people both exceed 10,000: the flag is set and the scales stay the true ones.
  assert.equal(bigG3.capped_at_users_max, true, "63,860 people is above the users range");
  close(bigG3.multiple, 1.4201, 0.0014, "S1 5,000 people $90M G3 multiple is uncapped (within 0.1%)");
  close(bigG3.infravana_scale * 5000, 63_860, 5, "InfraVana head-count is the true solved one");
  close(bigG3.today_scale * 5000, 44_968, 5, "Today head-count is the true solved one");
  ok(`S1 at 5,000 people and $90M: G3 ${bigG3.multiple.toFixed(4)} (not 1.0), flag set, head-counts 44,968 and 63,860`);

  // Only InfraVana passes 10,000 here (Today 7,996 people, InfraVana 11,355): the one-sided case.
  const oneSided = at(s1, 5000, 16e6);
  const oneSidedG3 = solved(oneSided, "users");
  assert.equal(oneSidedG3.capped_at_users_max, true, "InfraVana's 11,355 people is above the users range");
  assert.ok(oneSidedG3.today_scale * 5000 < USERS_RANGE.max, "Today's head-count is below the range");
  assert.ok(oneSidedG3.infravana_scale * 5000 > USERS_RANGE.max, "InfraVana's head-count is above the range");
  close(oneSidedG3.multiple, 1.4201, 0.0014, "S1 5,000 people $16M G3 multiple is uncapped (within 0.1%)");
  assert.equal(solved(oneSided, "intensity").capped_at_users_max, false, "the flag is G3 only");
  ok(`S1 at 5,000 people and $16M: only InfraVana is over the range; flag set, G3 ${oneSidedG3.multiple.toFixed(4)}`);

  const one = at(s1, 1, 100e6);
  const oneG2 = solved(one, "intensity");
  assert.ok(Number.isFinite(oneG2.multiple) && oneG2.multiple > 1, "finite G2");
  assert.equal(oneG2.capped_at_users_max, false, "the cap is G3 only");
  const oneG3 = solved(one, "users");
  assert.ok(Number.isFinite(oneG3.multiple), "finite G3");
  assert.equal(oneG3.capped_at_users_max, true);
  assert.ok(oneG3.today_scale > USERS_RANGE.max && oneG3.infravana_scale > USERS_RANGE.max, "true head-counts, not clamped");
  close(oneG3.multiple, 1.4201, 0.0014, "S1 1 user $100M G3 multiple is uncapped (within 0.1%)");
  ok(`S1 at 1 user and $100M: G2 ${oneG2.multiple.toFixed(4)} finite; G3 ${oneG3.multiple.toFixed(4)} with the cap flag`);

  const lowBudget = at(s2, s2.baseline.users, 30_000);
  const lowG2 = solved(lowBudget, "intensity");
  const lowG3 = solved(lowBudget, "users");
  close(lowG2.multiple, 1.3, 0.005, "S2 $30K G2");
  close(lowG3.multiple, 1.3, 0.005, "S2 $30K G3");
  assert.ok(Math.abs(lowG2.multiple - 1.4628) > 0.1, "not the linear 1.46");
  assert.equal(lowG3.capped_at_users_max, false);
  ok(`S2 at $30K: G2 ${lowG2.multiple.toFixed(4)}, G3 ${lowG3.multiple.toFixed(4)} (about 1.30, not 1.46)`);

  // ---- The default scenarios reproduce check-demand's G1 numbers -----------
  console.log("default scenarios, G1");
  for (const [id, s] of [["s1", s1], ["s2", s2], ["hardware_heavy", hardwareHeavy]]) {
    const r = compute.compute(s, tables);
    const g1 = compute.g1Headline(r);
    const [todayUsd, infravanaUsd, demand] = BEFORE[id];
    close(g1.saved_usd, todayUsd - infravanaUsd, 1e-6, `${id} saved dollars`);
    close(g1.saved_pct, (100 * (todayUsd - infravanaUsd)) / todayUsd, 1e-9, `${id} saved percent`);
    close(g1.linear_multiple, todayUsd / infravanaUsd, 1e-9, `${id} linear multiple`);
    assert.equal(g1.comparator, r.comparator);
    close(g1.coverage, (r.tokens_bought.today_tokens) / demand, 1e-12, `${id} coverage`);
    assert.equal(g1.over_ten_times, false);
  }
  const g1s1 = compute.g1Headline(compute.compute(s1, tables));
  close(g1s1.saved_pct, 29.57, 0.005, "S1 saves 29.57 percent");
  ok("S1, S2 and hardware_heavy: G1 dollars, percent and linear multiple equal the check-demand figures; S1 is 29.57%");

  // ---- Spec 6.2 acceptance (1) and agreement with the independent solver ----
  console.log("the solved scale against the spec wording");
  const cases = [
    ["S1 default", s1],
    ["S2 default", s2],
    ["hardware_heavy default", hardwareHeavy],
    ["S1 5,000 people $90M", big],
    ["S1 1 user $100M", one],
    ["S1 5,000 people $16M (only InfraVana over the users range)", oneSided],
    ["S2 $30K", lowBudget],
    ["S1 seats, $50K", { ...at(s1, s1.baseline.users, 50_000), stage_today: "seats" }],
    ["S1 seats, 100 people $10K (below the seat fees)", { ...at(s1, 100, 10_000), stage_today: "seats" }],
    ["S1 with 10,000 customers", { ...at(s1, s1.baseline.users, 100_000, 10_000), workload_mix: { ...s1.workload_mix, customer_service: 0.5, product_ai: 0.5 } }],
  ];
  for (const [name, s] of cases) {
    const budget = s.baseline.budget_usd_per_quarter;
    for (const axis of ["intensity", "users"]) {
      const result = solved(s, axis);
      const fns = spendFns(s, axis);
      const today = specSolve(fns.today, budget);
      const infravana = specSolve(fns.infravana, budget);
      // The scales are never clamped; the flag says whether either head-count is above the users range.
      const cap = axis === "users" ? USERS_RANGE.max / s.baseline.users : Infinity;
      // The independent solver finds nothing (null) where no volume fits; the solver returns 0 there.
      const todayLo = today.lo ?? 0;
      const infravanaLo = infravana.lo ?? 0;
      close(result.today_scale, todayLo, 1e-9 * todayLo, `${name} ${axis} Today scale`);
      close(result.infravana_scale, infravanaLo, 1e-9 * infravanaLo, `${name} ${axis} InfraVana scale`);
      assert.ok(result.today_scale === 0 || fns.today(result.today_scale) <= budget, `${name} ${axis} Today fits the budget`);
      assert.ok(result.infravana_scale === 0 || fns.infravana(result.infravana_scale) <= budget, `${name} ${axis} InfraVana fits the budget`);
      assert.equal(result.capped_at_users_max, axis === "users" && (todayLo > cap || infravanaLo > cap), `${name} ${axis} cap flag`);
      assert.ok(noScannedAbove(fns.infravana, budget, result.infravana_scale), `${name} ${axis}: a scanned scale above the InfraVana result fits`);
      assert.ok(noScannedAbove(fns.today, budget, result.today_scale), `${name} ${axis}: a scanned scale above the Today result fits`);
      assert.equal(result.multiple, result.infravana_scale / result.today_scale);
    }
  }
  ok(`${cases.length} cases x 2 axes: scales equal the independent solver, fit the budget, and no scanned scale above them fits`);

  // Negative controls: the checks above must be able to fail.
  {
    const fns = spendFns(lowBudget, "intensity");
    const result = solved(lowBudget, "intensity");
    assert.equal(noScannedAbove(fns.infravana, 30_000, result.infravana_scale * 0.9), false, "a result 10% too low is caught");
    assert.ok(Math.abs(result.multiple - compute.compute(lowBudget, tables).headline.tokens_multiple) > 0.1, "the linear 1.46 would be caught");
    ok("negative controls: a result 10% too low and the linear 1.46 both fail their checks");
  }

  // ---- Axis semantics -------------------------------------------------------
  console.log("axis semantics");
  {
    // G3 scales employee workloads only: customers stay fixed.
    const mixed = at(s1, s1.baseline.users, 100_000, 10_000);
    const withCustomers = { ...mixed, workload_mix: { ...s1.workload_mix, customer_service: 0.5, product_ai: 0.5 } };
    const result = solved(withCustomers, "users");
    const tokens = (s) => {
      const by = { employee: 0, customer: 0 };
      for (const d of deriveDemand(s, tables)) {
        const basis = tables.workloads.find((w) => w.workload_id === d.workload_id).basis;
        by[basis] += d.tokens_in + d.tokens_out;
      }
      return by;
    };
    const base = tokens(withCustomers);
    const expected = result.infravana_scale * base.employee + base.customer;
    close(result.infravana_tokens, expected, 1e-6 * expected, "G3 InfraVana tokens: employees scaled, customers fixed");
    close(result.multiple, 1.46, 0.02, "S1 with 10,000 customers G3 is about 1.46");
    const g2 = solved(withCustomers, "intensity");
    const expectedG2 = g2.infravana_scale * (base.employee + base.customer);
    close(g2.infravana_tokens, expectedG2, 1e-6 * expectedG2, "G2 InfraVana tokens: all workloads scaled");
    assert.ok(g2.multiple < result.multiple - 0.02, "G2 and G3 are separate optimisations with customers");
    ok("G3 scales employees only, G2 scales all workloads; with 10,000 customers G3 is about 1.46 and G2 is lower");
  }
  {
    const customerOnly = { ...at(s1, 50, 100_000, 10_000), workload_mix: { customer_service: 0.5, product_ai: 0.5 } };
    assert.equal(compute.goalAvailability(customerOnly, tables).G3 !== null, true);
    assert.equal(compute.goalAvailability(s1, tables).G3, null);
    assert.equal(compute.goalAvailability(s1, tables).G2, null);
    throwsLike(() => solved(customerOnly, "users"), /no employee work/, "users axis without employee work");
    assert.ok(Number.isFinite(solved(customerOnly, "intensity").multiple), "G2 works for customer-only work");
    ok("G3 is unavailable (with a reason) and solveAtBudget throws for a mix with no employee work; G2 still solves");
  }
  {
    // The G4 trade-off is ignored: G2 and G3 use the visitor's own floors and speed.
    const withTradeoff = { ...s1, goal: "G4", tradeoff: { quality_step: 3, speed_step: 1 } };
    assert.deepEqual(solved(withTradeoff, "intensity"), solved(s1, "intensity"));
    ok("a G4 trade-off on the scenario does not change a solve");
  }
  {
    // Budget below one hundredth of the volume: the scan continues downward.
    const tiny = at(s1, 10_000, 1_000);
    const g2 = solved(tiny, "intensity");
    assert.ok(g2.infravana_scale < 0.01 && g2.today_scale < 0.01 && g2.multiple > 1, "scales below the scan start");
    assert.ok(spendFns(tiny, "intensity").infravana(g2.infravana_scale) <= 1_000, "fits the budget");
    ok(`10,000 people on a $1K budget: G2 ${g2.multiple.toFixed(4)} from scales below 0.01`);
  }
  {
    // The ceiling: with prices that fall steeply with volume the answer can lie above 2 budgets over the
    // linear spend; the spec's ceiling then ends the scan, and the largest scanned scale is the result.
    const steep = { ...tables, model_offers: tables.model_offers.map((o) => (o.min_commit_usd > 0 ? { ...o, commit_discount_pct: 90 } : o)) };
    const s = at(s2, 5, 20_000);
    const result = compute.solveAtBudget(s, steep, "users");
    const run = (k) => compute.compute({ ...s, baseline: { ...s.baseline, users: s.baseline.users * k } }, steep);
    const today = specSolve((k) => run(k).allocation.total_usd, 20_000);
    const infravana = specSolve((k) => spendOf(run(k)), 20_000);
    const ceilingToday = (2 * 20_000) / run(1).allocation.total_usd;
    assert.ok(result.today_scale <= ceilingToday, "the result never exceeds the ceiling");
    assert.ok(result.today_scale > ceilingToday / 1.0101, "and sits on its last scanned point");
    close(result.today_scale, today.lo, 1e-9 * today.lo, "steep prices: Today scale");
    close(result.infravana_scale, infravana.lo, 1e-9 * infravana.lo, "steep prices: InfraVana scale");
    ok("a result at the ceiling is the last scanned scale below 2 budgets over the linear spend");
  }
  {
    // Seat fees do not shrink with intensity: a budget below them fits no volume on the Today side.
    const seats = { ...at(s1, 100, 10_000), stage_today: "seats" };
    const g2 = solved(seats, "intensity");
    assert.equal(g2.today_scale, 0, "no intensity fits under the seat fees");
    assert.equal(g2.today_tokens, 0);
    assert.ok(g2.infravana_scale > 0 && g2.infravana_tokens > 0, "InfraVana, priced per token, still fits");
    assert.equal(g2.multiple, Infinity);
    const headline = compute.solvedHeadline(seats, g2);
    assert.deepEqual(headline.no_volume_fits, { today: true, infravana: false });
    assert.equal(headline.over_ten_times, false);
    const g3 = solved(seats, "users");
    assert.ok(g3.today_scale > 0 && Number.isFinite(g3.multiple), "fewer people do fit");
    assert.equal(compute.c5Figures("G2", compute.compute(seats, tables), g2).multiple, Infinity);
    ok("a budget below the seat fees: G2 Today scale is 0 (multiple Infinity, flagged), G3 still solves");
  }
  {
    throwsLike(() => solved(at(s1, 0, 100_000), "intensity"), /no spend/, "no demand");
    throwsLike(() => solved(at(s1, 50, 0), "intensity"), /budget must be a positive/, "no budget");
    const before = JSON.stringify(s1);
    solved(s1, "intensity");
    assert.equal(JSON.stringify(s1), before, "the scenario is not modified");
    const rows = JSON.stringify(tables.workloads);
    solved(s1, "intensity");
    assert.equal(JSON.stringify(tables.workloads), rows, "the tables are not modified");
    throwsLike(() => compute.frontier(s1, tables, "quality", [60]), /not implemented/, "frontier is still a stub");
    ok("no demand and no budget throw by name; neither argument is modified; frontier is still a stub");
  }

  // ---- C5 follows the tab ---------------------------------------------------
  console.log("goals: C5 figures");
  {
    const r = compute.compute(s2, tables);
    const g1 = compute.c5Figures("G1", r, null);
    assert.equal(g1.basis, "linear");
    close(g1.multiple, r.headline.tokens_multiple, 1e-12, "G1 C5 multiple");
    close(g1.multiple, 1 / (1 - r.headline.cost_savings_pct / 100), 1e-9, "G1 C5 multiple is 1 / (1 - saving)");
    assert.ok(g1.options.every((o) => o.estimated_at_average_price === false));
    const lowResults = compute.compute(lowBudget, tables);
    const g2 = compute.c5Figures("G2", lowResults, lowG2);
    assert.equal(g2.basis, "solved");
    close(g2.multiple, lowG2.multiple, 1e-12, "G2 C5 multiple is the solved one");
    assert.equal(g2.today_tokens, lowG2.today_tokens);
    assert.ok(g2.options.length > 0 && g2.options.every((o) => o.estimated_at_average_price === true));
    assert.ok(g2.options.every((o) => o.pattern_id !== lowResults.comparator), "the comparator is not among the options");
    const alt = new Map(lowResults.today_alternatives.map((a) => [a.pattern_id, a.tokens_at_budget]));
    assert.ok(g2.options.every((o) => o.tokens === alt.get(o.pattern_id)), "options stay linear");
    const g4 = compute.c5Figures("G4", lowResults, null);
    assert.equal(g4.basis, "linear");
    assert.equal(g4.at_tradeoff, true);
    throwsLike(() => compute.c5Figures("G3", lowResults, null), /needs the solveAtBudget result/, "G3 without a solve");
    assert.notEqual(g2.multiple, g1.multiple);
    ok("C5: G1 and G4 linear (1/(1 - saving)), G2 and G3 solved, grey options linear and labelled in G2 and G3 only");
  }
  {
    const h = compute.solvedHeadline(one, oneG3);
    assert.equal(h.goal, "G3");
    assert.equal(h.capped_at_users_max, true);
    assert.equal(h.over_ten_times, true, "$100M for one person is far above ten times the work");
    assert.equal(h.today_people, oneG3.today_scale);
    assert.ok(h.infravana_people > USERS_RANGE.max, "people are the true solved head-count, not clamped");
    close(h.multiple, 1.4201, 0.0014, "G3 headline multiple is the solved one");
    // C5 in G3 uses the solved volumes and says whether the cap applies.
    const c5 = compute.c5Figures("G3", compute.compute(big, tables), bigG3);
    assert.equal(c5.capped_at_users_max, true);
    assert.equal(c5.basis, "solved");
    assert.equal(c5.today_tokens, bigG3.today_tokens);
    assert.equal(c5.infravana_tokens, bigG3.infravana_tokens);
    close(c5.multiple, 1.4201, 0.0014, "C5 G3 multiple is the solved one at $90M");
    assert.ok(c5.extra_tokens > 0, "C5 G3 has extra tokens");
    assert.equal(compute.c5Figures("G3", compute.compute(lowBudget, tables), lowG3).capped_at_users_max, false);
    assert.equal(compute.c5Figures("G2", compute.compute(big, tables), bigG2).capped_at_users_max, false);
    const g2h = compute.solvedHeadline(one, oneG2);
    assert.equal(g2h.goal, "G2");
    assert.equal(g2h.today_people, null);
    assert.equal(g2h.capped_at_users_max, false);
    assert.equal(compute.solvedHeadline(s1, solved(s1, "intensity")).over_ten_times, false);
    const direct = compute.solveGoal(lowBudget, tables, "G3");
    assert.deepEqual(direct.solve, lowG3);
    ok("solved headlines: goal, people (G3 only), ten-times flag and cap flag");
  }

  // ---- The worker wrapper ---------------------------------------------------
  console.log("worker client");
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clientSource = await readFile(new URL("../src/compute/solveClient.ts", import.meta.url), "utf8");
  const workerSource = await readFile(new URL("../src/compute/solveWorker.ts", import.meta.url), "utf8");
  assert.ok(!/from "\.\/solve"|from "\.\/core"/.test(clientSource), "the client never imports the solver");
  assert.ok(/new Worker\(new URL\("\.\/solveWorker\.ts", import\.meta\.url\), \{ type: "module" \}\)/.test(clientSource));
  assert.ok(!/from "\.\/solve"/.test(workerSource) && /createSolveHandler/.test(workerSource));
  assert.equal(SOLVE_DEBOUNCE_MS, 150);
  ok("the client imports no solver code (the solve can only run in the worker); debounce constant is 150 ms");

  /** A stand-in worker that runs the real handler. `hold` keeps answers back until `release`. */
  const makeFakeFactory = ({ hold = false } = {}) => {
    const workers = [];
    const create = () => {
      const handler = createSolveHandler();
      const w = { posts: [], terminated: false, held: [], respond: null };
      w.api = {
        post(request) {
          w.posts.push(request.type);
          setTimeout(() => {
            if (w.terminated) return;
            const response = handler(request);
            if (response === null) return;
            if (hold) w.held.push(response);
            else w.respond(response);
          }, 0);
        },
        terminate() {
          w.terminated = true;
        },
        listen(onResponse) {
          w.respond = onResponse;
        },
      };
      workers.push(w);
      return w.api;
    };
    return { workers, create };
  };
  const solvesPosted = (workers) => workers.reduce((n, w) => n + w.posts.filter((p) => p === "solve").length, 0);

  {
    // Debounce: three requests 20 ms apart give one solve, 150 ms after the last.
    const fake = makeFakeFactory();
    const client = new SolveClient({ tables, createWorker: fake.create });
    const seen = [];
    client.subscribe(() => seen.push(client.getSnapshot()));
    assert.deepEqual(client.getSnapshot(), { status: "idle", result: null, stale: false, error: null });
    client.request(at(s1, 50, 100_000), "intensity");
    await sleep(20);
    client.request(at(s1, 60, 100_000), "intensity");
    await sleep(20);
    client.request(at(s1, 70, 100_000), "intensity");
    await sleep(100);
    assert.equal(fake.workers.length, 0, "nothing starts before the debounce has elapsed");
    assert.equal(client.getSnapshot().status, "solving");
    await sleep(120);
    assert.equal(solvesPosted(fake.workers), 1, "three quick requests give one solve");
    assert.equal(fake.workers.length, 1);
    assert.equal(client.getSnapshot().status, "ready");
    const expected = compute.solveAtBudget(at(s1, 70, 100_000), tables, "intensity");
    assert.deepEqual(client.getSnapshot().result, expected, "the answer is for the latest request");
    assert.equal(client.getSnapshot().stale, false);
    ok("debounce: three requests inside 150 ms give one solve, for the last one");

    // Previous value is reported stale until the new one arrives.
    client.request(at(s1, 80, 100_000), "intensity");
    const during = client.getSnapshot();
    assert.equal(during.status, "solving");
    assert.equal(during.stale, true);
    assert.deepEqual(during.result, expected, "the previous value stays visible while the next is computed");
    await sleep(250);
    const after = client.getSnapshot();
    assert.equal(after.stale, false);
    assert.notDeepEqual(after.result, expected);
    assert.deepEqual(after.result, compute.solveAtBudget(at(s1, 80, 100_000), tables, "intensity"));
    ok("the previous value is reported stale while a new request is pending, then replaced");

    // The same request again changes nothing.
    const posts = solvesPosted(fake.workers);
    const snap = client.getSnapshot();
    client.request(at(s1, 80, 100_000), "intensity");
    await sleep(200);
    assert.equal(solvesPosted(fake.workers), posts);
    assert.equal(client.getSnapshot(), snap);
    ok("repeating the latest request starts nothing");

    // Unavailable axis: an error, with the earlier value kept (stale).
    const customerOnly = { ...at(s1, 50, 100_000, 10_000), workload_mix: { customer_service: 1 } };
    client.request(customerOnly, "users");
    await sleep(250);
    const failed = client.getSnapshot();
    assert.equal(failed.status, "error");
    assert.match(failed.error, /no employee work/);
    assert.equal(failed.stale, true);
    assert.ok(failed.result !== null);
    ok("a failed solve reports its message and keeps the previous value as stale");

    client.dispose();
    const before = solvesPosted(fake.workers);
    client.request(at(s1, 90, 100_000), "intensity");
    await sleep(200);
    assert.equal(solvesPosted(fake.workers), before);
    assert.ok(fake.workers.every((w) => w.terminated), "dispose ends the worker");
    assert.ok(seen.length > 0);
    ok("dispose stops the worker and ignores later requests");
  }
  {
    // Cancel: a new request while one is running ends that worker; its late answer is dropped.
    const fake = makeFakeFactory({ hold: true });
    const client = new SolveClient({ tables, createWorker: fake.create, debounceMs: 10 });
    client.request(at(s1, 50, 100_000), "intensity");
    await sleep(60);
    assert.equal(fake.workers.length, 1);
    assert.equal(solvesPosted(fake.workers), 1);
    client.request(at(s1, 60, 100_000), "intensity");
    assert.equal(fake.workers[0].terminated, true, "the running solve is cancelled by ending its worker");
    await sleep(60);
    assert.equal(fake.workers.length, 2, "a fresh worker takes the new request");
    assert.deepEqual(fake.workers[1].posts, ["init", "solve"], "and is given the tables first");
    // The cancelled worker's answer arrives late: it must not touch the snapshot.
    fake.workers[0].respond({ type: "result", id: 1, result: { late: true } });
    assert.equal(client.getSnapshot().result, null);
    assert.equal(client.getSnapshot().status, "solving");
    assert.equal(fake.workers[1].held.length, 1);
    fake.workers[1].respond(fake.workers[1].held[0]);
    assert.equal(client.getSnapshot().status, "ready");
    assert.deepEqual(client.getSnapshot().result, compute.solveAtBudget(at(s1, 60, 100_000), tables, "intensity"));
    client.dispose();
    ok("a request made while a solve runs cancels it (worker ended); a late answer to it is ignored");
  }
  {
    // A worker that fails reports an error and is replaced for the next request.
    let failNext = true;
    const workers = [];
    const create = () => {
      let onFailure = null;
      const w = { terminated: false };
      workers.push(w);
      return {
        post(request) {
          if (request.type === "solve" && failNext) {
            failNext = false;
            setTimeout(() => onFailure("worker crashed"), 0);
          }
        },
        terminate() {
          w.terminated = true;
        },
        listen(_onResponse, onFail) {
          onFailure = onFail;
        },
      };
    };
    const client = new SolveClient({ tables, createWorker: create, debounceMs: 10 });
    client.request(s1, "intensity");
    await sleep(80);
    assert.equal(client.getSnapshot().status, "error");
    assert.equal(client.getSnapshot().error, "worker crashed");
    assert.equal(workers[0].terminated, true);
    client.request(s1, "intensity");
    await sleep(80);
    assert.equal(workers.length, 2);
    client.dispose();
    ok("a worker failure is reported and the same request can be retried on a fresh worker");
  }
  {
    // The worker handler on its own.
    const handle = createSolveHandler();
    assert.deepEqual(handle({ type: "solve", id: 7, scenario: s1, axis: "intensity" }), {
      type: "error",
      id: 7,
      message: "the solver worker has no tables yet",
    });
    assert.equal(handle({ type: "init", tables }), null);
    const response = handle({ type: "solve", id: 8, scenario: s1, axis: "users" });
    assert.equal(response.type, "result");
    assert.equal(response.id, 8);
    assert.deepEqual(response.result, solved(s1, "users"));
    ok("the worker handler needs init first, then answers with the solver's result");
  }

  // ---- Timing ---------------------------------------------------------------
  console.log("timing (placeholder data, this machine; informational)");
  const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  for (const [name, s] of [["1 user, $100M", one], ["5,000 people, $90M", big], ["S1 default", s1]]) {
    const row = { case: name };
    for (const axis of ["intensity", "users"]) {
      solved(s, axis);
      const runs = [];
      for (let i = 0; i < 7; i += 1) {
        const t0 = performance.now();
        solved(s, axis);
        runs.push(performance.now() - t0);
      }
      row[`${axis} solve ms (median of 7)`] = +median(runs).toFixed(1);
    }
    const n = 2000;
    const t0 = performance.now();
    for (let i = 0; i < n; i += 1) computeCore(s, tables);
    row["computeCore ms per call"] = +((performance.now() - t0) / n).toFixed(4);
    console.log(JSON.stringify(row));
  }
  console.log(`debounce ${SOLVE_DEBOUNCE_MS} ms plus the slowest solve above is the time to a solved value after the last change`);

  console.log(`check-solve: ok (${checks} checks)`);
} finally {
  await server.close();
}
