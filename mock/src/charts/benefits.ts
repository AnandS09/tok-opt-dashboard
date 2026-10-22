/**
 * Benefit boxes (spec 6.4): the two or three numbers under each figure title.
 * Each box is a number, a short label and the named comparator. Every number
 * is derived from the chart's `Results` and the `BenefitContext`; no figure is
 * typed in this file (a test searches it for numeric literals).
 *
 * A chart lists its candidates in the order of the spec 6.4 table. `selectBoxes`
 * then keeps the first three that survive three rules: a value that is zero,
 * negative or shows as zero is hidden, and a box that reads the same as a
 * number in the active tab's headline is dropped (the hero already says it).
 *
 * Units: `usd` is dollars a quarter (or per head), `usd_per_mtok` dollars per
 * million tokens, `tokens` a count, `multiple` a ratio, and `percent` a value
 * already in percent (24.3 is "24%").
 */

import { COVERAGE_MESSAGE_ABOVE, c5Figures, g1Headline, solvedHeadline } from "../compute/goals";
import type { BenefitBox, BenefitContext, BenefitUnit, CostPerMtokRow, Results } from "../contract";
import { fmtMultiple, fmtPct, fmtTokensSig, fmtUsdSig } from "../shared/format";
import { comparisonOf } from "./comparison";
import { fmtUsdPerMtok } from "./format";
import { BRAND, MODEL_CLASS_NAME } from "./labels";

/** No chart shows more than this many boxes (spec 6.4 acceptance 7). */
export const MAX_BOXES = 3;

/** Tokens in one "million tokens", the unit of a price. */
const TOKENS_PER_MTOK = 1e6;
/** Converts a share (0.25) to percent (25). */
const PERCENT = 100;

/** One number the hero of the active tab states, which no box may repeat. */
export interface HeadlineNumber {
  unit: BenefitUnit;
  value: number;
}

/** A box, or null for a candidate that does not apply (a missing count, no demand). */
type Candidate = BenefitBox | null;

/** A value as the box prints it, so equality and "shows as zero" are judged on what a reader sees. */
export function formatBenefitValue(box: Pick<BenefitBox, "value" | "unit">): string {
  switch (box.unit) {
    case "usd":
      return fmtUsdSig(box.value);
    case "usd_per_mtok":
      return fmtUsdPerMtok(box.value);
    case "tokens":
      return fmtTokensSig(box.value);
    case "multiple":
      return fmtMultiple(box.value);
    case "percent":
      return fmtPct(box.value);
  }
}

/** "vs Pay-as-you-go API": the Today every InfraVana figure of `results` is measured against (spec 6.1). */
export function comparatorName(results: Results): string {
  return `vs ${comparisonOf(results).label}`;
}

function candidate(results: Results, value: number, unit: BenefitUnit, label: string): BenefitBox {
  return { value, unit, label, comparator: comparatorName(results) };
}

/**
 * The numbers the hero states on the active tab. G1 and G4 state the saving
 * in dollars and percent and the linear multiple, and, when the budget does
 * not cover the work, the coverage percentages. G2 and G3 state the solved
 * multiple. While a solved tab has no solve yet there is no number to repeat.
 *
 * G4's hero also states the saving at the visitor's own floors, which comes
 * from a second `compute()` call that `BenefitContext` does not carry; here G4
 * uses the saving in `results`, the relaxed plan's.
 */
export function headlineNumbers(results: Results, context: BenefitContext): HeadlineNumber[] {
  if (context.goal === "G2" || context.goal === "G3") {
    return context.solve ? [{ unit: "multiple", value: solvedHeadline(context.scenario, context.solve).multiple }] : [];
  }
  const g1 = g1Headline(results);
  const numbers: HeadlineNumber[] = [
    { unit: "usd", value: g1.saved_usd },
    { unit: "percent", value: g1.saved_pct },
    { unit: "multiple", value: g1.linear_multiple },
  ];
  const todayPct = Math.round(g1.coverage * PERCENT);
  if (todayPct < PERCENT) {
    const { demand_tokens, infravana_tokens } = results.tokens_bought;
    numbers.push({ unit: "percent", value: todayPct });
    numbers.push({ unit: "percent", value: Math.min(PERCENT, (infravana_tokens / demand_tokens) * PERCENT) });
  }
  return numbers;
}

/** True when the box and the headline number read the same: same unit, same printed value. */
function repeatsHeadline(box: BenefitBox, headline: readonly HeadlineNumber[]): boolean {
  const printed = formatBenefitValue(box);
  return headline.some((h) => h.unit === box.unit && formatBenefitValue(h) === printed);
}

/**
 * The boxes a chart shows: its candidates in order, minus any that is not a
 * positive finite number, shows as zero, or repeats the headline, cut to the
 * first `MAX_BOXES` (spec 6.4 "Which boxes show", "Backstop rule").
 */
export function selectBoxes(candidates: readonly Candidate[], headline: readonly HeadlineNumber[]): BenefitBox[] {
  const shown: BenefitBox[] = [];
  for (const box of candidates) {
    if (box === null || !Number.isFinite(box.value) || box.value <= 0) continue;
    if (!/[1-9]/.test(formatBenefitValue(box))) continue;
    if (repeatsHeadline(box, headline)) continue;
    shown.push(box);
    if (shown.length === MAX_BOXES) break;
  }
  return shown;
}

/** Quarterly dollars saved by savings segments of one source, or all of them. */
function savedUsd(results: Results, source?: "arbitrage" | "routing"): number {
  return results.allocation.infravana.reduce(
    (sum, s) => (s.kind === "savings" && (source === undefined || s.savings_source === source) ? sum + s.usd : sum),
    0,
  );
}

/** Millions of tokens the workload uses in a quarter; null when there is no demand. */
function demandMtok(results: Results): number | null {
  const demand = results.tokens_bought.demand_tokens;
  return demand > 0 ? demand / TOKENS_PER_MTOK : null;
}

/** Who the per-head box divides by, read from which count `headcount` equals. */
function headLabel(context: BenefitContext): string {
  const { users, customers } = context.scenario.baseline;
  const team = context.headcount === users;
  const buyers = context.headcount === customers;
  return team && !buyers ? "team member" : buyers && !team ? "customer" : "head";
}

/** C1 (spec 6.4): arbitrage, routing, saving per head, saving per million tokens. */
export function allocationBenefits(results: Results, context: BenefitContext): BenefitBox[] {
  const total = savedUsd(results);
  const mtok = demandMtok(results);
  return selectBoxes(
    [
      candidate(results, savedUsd(results, "arbitrage"), "usd", "saved a quarter through better prices"),
      candidate(results, savedUsd(results, "routing"), "usd", "saved a quarter by routing work to cheaper options"),
      context.headcount !== null && context.headcount > 0
        ? candidate(results, total / context.headcount, "usd", `saved per ${headLabel(context)} a quarter`)
        : null,
      mtok !== null ? candidate(results, total / mtok, "usd_per_mtok", "saved per million tokens") : null,
    ],
    headlineNumbers(results, context),
  );
}

/**
 * C5 (spec 6.4): tokens at the tab's volume, the share of the work the budget
 * covers, and the extra tokens over the comparator. On a solved tab the
 * volumes are the solved ones; before the solve arrives they are the linear
 * ones. The share is hidden above ten times the work (spec 5.2 P-3), where the
 * page states a message instead of a multiple.
 */
export function tokensBoughtBenefits(results: Results, context: BenefitContext): BenefitBox[] {
  const solved = context.goal === "G2" || context.goal === "G3";
  const figures =
    solved && context.solve === null ? c5Figures("G1", results, null) : c5Figures(context.goal, results, context.solve);
  const demand = results.tokens_bought.demand_tokens;
  const coverage = demand > 0 ? figures.infravana_tokens / demand : 0;
  return selectBoxes(
    [
      candidate(
        results,
        figures.infravana_tokens,
        "tokens",
        figures.basis === "solved" ? "tokens a quarter at the volume your budget buys" : `tokens a quarter with ${BRAND}`,
      ),
      coverage > COVERAGE_MESSAGE_ABOVE
        ? null
        : candidate(results, coverage * PERCENT, "percent", "of your current work the budget covers"),
      candidate(results, figures.extra_tokens, "tokens", "more tokens a quarter"),
    ],
    headlineNumbers(results, context),
  );
}

/** The classes priced on both sides, largest model class first (the order of `by_model_class`). */
function pricedBothSides(results: Results): (CostPerMtokRow & { today_usd_per_mtok: number; infravana_usd_per_mtok: number })[] {
  return results.cost_per_mtok.by_model_class.filter(
    (r): r is CostPerMtokRow & { today_usd_per_mtok: number; infravana_usd_per_mtok: number } =>
      r.today_usd_per_mtok !== null && r.infravana_usd_per_mtok !== null,
  );
}

function className(row: CostPerMtokRow): string {
  return MODEL_CLASS_NAME[row.model_class].toLowerCase();
}

/**
 * C3 (spec 6.4): the largest class's price on both sides, the biggest drop by
 * class, and the blended price over all classes on both sides. The box's
 * number is InfraVana's price; the label states the comparator's.
 */
export function costPerMtokBenefits(results: Results, context: BenefitContext): BenefitBox[] {
  const rows = pricedBothSides(results);
  const largest = rows.length > 0 ? rows[0] : null;
  let biggestDrop: { row: (typeof rows)[number]; pct: number } | null = null;
  for (const row of rows) {
    const pct = row.today_usd_per_mtok > 0 ? ((row.today_usd_per_mtok - row.infravana_usd_per_mtok) / row.today_usd_per_mtok) * PERCENT : 0;
    if (biggestDrop === null || pct > biggestDrop.pct) biggestDrop = { row, pct };
  }
  const mtok = demandMtok(results);
  const blendedToday = mtok !== null ? results.allocation.total_usd / mtok : null;
  const blendedInfravana = mtok !== null ? (results.allocation.total_usd - savedUsd(results)) / mtok : null;
  return selectBoxes(
    [
      largest
        ? candidate(
            results,
            largest.infravana_usd_per_mtok,
            "usd_per_mtok",
            `per million tokens for ${className(largest)} models, against ${fmtUsdPerMtok(largest.today_usd_per_mtok)}`,
          )
        : null,
      biggestDrop
        ? candidate(results, biggestDrop.pct, "percent", `lower price for ${className(biggestDrop.row)} models, the biggest drop of any size`)
        : null,
      blendedToday !== null && blendedInfravana !== null
        ? candidate(
            results,
            blendedInfravana,
            "usd_per_mtok",
            `per million tokens across all models, against ${fmtUsdPerMtok(blendedToday)}`,
          )
        : null,
    ],
    headlineNumbers(results, context),
  );
}
