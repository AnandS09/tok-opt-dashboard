import { BUDGET_USD_PER_QUARTER_RANGE, clampToRange, CUSTOMERS_RANGE, USERS_RANGE } from "../data/ranges";
import { compute } from "../compute";
import type { LatencyClass, ModelMix, Scenario, Stage, Tables, WorkloadBasis } from "../contract";

/**
 * The guided start: company type, then plain one-click questions that adapt
 * to it, and the answer grid that replaces them once answered. Each
 * answer writes straight into the one `Scenario` the rest of the page
 * computes from; nothing here is a second source of truth.
 */

export type CompanyType = "ai_first" | "software" | "enterprise" | "telecom" | "chip";

export interface Company {
  id: CompanyType;
  title: string;
  line: string;
  /** Workloads this kind of company picks from; the cards show them in workloads.csv order. */
  workloads: string[];
  stage: Stage;
  teamSizes: number[];
  customerCounts: number[];
  defaultCustomers: number;
  /** What its customers are called. */
  customerWord: string;
}

const SMALL_TEAMS = [25, 50, 100, 500];
const LARGE_TEAMS = [100, 500, 1_000, 5_000];
const CUSTOMERS = [10_000, 50_000, 200_000, 1_000_000];

export const COMPANIES: Company[] = [
  {
    id: "ai_first",
    title: "AI-first startup",
    line: "AI is the product: service, document, voice or coding agents you sell to customers",
    workloads: ["customer_service", "product_ai"],
    stage: "api",
    teamSizes: SMALL_TEAMS,
    customerCounts: CUSTOMERS,
    defaultCustomers: 50_000,
    customerWord: "customers",
  },
  {
    id: "software",
    title: "Software or internet company",
    line: "SaaS, marketplace or fintech app with AI in the product, support and engineering",
    workloads: ["software_design", "ops_agents", "support", "product_ai", "customer_service"],
    stage: "api",
    teamSizes: SMALL_TEAMS,
    customerCounts: CUSTOMERS,
    defaultCustomers: 50_000,
    customerWord: "customers",
  },
  {
    id: "enterprise",
    title: "Traditional enterprise",
    line: "Bank, insurer, pharma, retailer or manufacturer: documents, compliance and internal IT",
    workloads: ["documents", "software_design", "ops_agents", "support"],
    stage: "platform",
    teamSizes: LARGE_TEAMS,
    customerCounts: CUSTOMERS,
    defaultCustomers: 50_000,
    customerWord: "customers",
  },
  {
    id: "telecom",
    title: "Telecom or national cloud",
    line: "Subscriber care, network operations and AI hosted for local businesses",
    workloads: ["customer_service", "product_ai", "ops_agents", "support"],
    stage: "platform",
    teamSizes: LARGE_TEAMS,
    customerCounts: [50_000, 200_000, 1_000_000, 5_000_000],
    defaultCustomers: 200_000,
    customerWord: "subscribers",
  },
  {
    id: "chip",
    title: "Chip or hardware design company",
    line: "Hardware and software design teams",
    workloads: ["hardware_design", "software_design"],
    stage: "api",
    teamSizes: SMALL_TEAMS,
    customerCounts: CUSTOMERS,
    defaultCustomers: 50_000,
    customerWord: "customers",
  },
];

export function companyOf(id: CompanyType): Company {
  return COMPANIES.find((c) => c.id === id) ?? COMPANIES[0];
}

/** The budget choices of the answer grid's budget cell. */
export const BUDGETS = [50_000, 100_000, 200_000, 500_000];
/** The budget slider's marks, one per decade: the four above would sit about 6% apart on a $1K to $100M track (spec 5.1). */
export const BUDGET_MARKS = [10_000, 100_000, 1_000_000, 10_000_000];
export const SPEEDS: LatencyClass[] = ["interactive", "standard", "batch"];

export type StepId = "company" | "work" | "users" | "customers" | "budget" | "speed";

/** Workloads with a positive share, in workloads.csv order. */
export function selectedWorkloads(s: Scenario, tables: Tables): string[] {
  return tables.workloads.filter((w) => (s.workload_mix[w.workload_id] ?? 0) > 0).map((w) => w.workload_id);
}

export function hasBasis(s: Scenario, tables: Tables, basis: WorkloadBasis): boolean {
  return tables.workloads.some((w) => w.basis === basis && (s.workload_mix[w.workload_id] ?? 0) > 0);
}

/**
 * The steps for a company type, fixed once it is picked so the step count
 * never moves: team size only when it offers team work, customers only when
 * it offers customer work.
 */
export function stepsFor(company: Company, tables: Tables): StepId[] {
  const offered = (basis: WorkloadBasis) =>
    tables.workloads.some((w) => w.basis === basis && company.workloads.includes(w.workload_id));
  const steps: StepId[] = ["company", "work"];
  if (offered("employee")) steps.push("users");
  if (offered("customer")) steps.push("customers");
  steps.push("budget", "speed");
  return steps;
}

/** A list of preset values, with the current value added in order when it is not one of them. */
export function withCurrent(values: number[], current: number): number[] {
  return values.includes(current) ? values : [...values, current].sort((a, b) => a - b);
}

export function setUsers(s: Scenario, users: number): Scenario {
  return { ...s, baseline: { ...s.baseline, users: clampToRange(Math.round(users), USERS_RANGE) } };
}

export function setCustomers(s: Scenario, customers: number): Scenario {
  return { ...s, baseline: { ...s.baseline, customers: clampToRange(Math.round(customers), CUSTOMERS_RANGE) } };
}

/**
 * Customer work with no customer count counts for nothing (demand reads it as
 * 0), so customer work added after the questions (the answer grid's work cell,
 * the fine-tune sliders) starts at the usual 50,000.
 */
export function withCustomers(s: Scenario, tables: Tables): Scenario {
  return s.baseline.customers === undefined && hasBasis(s, tables, "customer") ? setCustomers(s, 50_000) : s;
}

export function setBudget(s: Scenario, budget: number): Scenario {
  return { ...s, baseline: { ...s.baseline, budget_usd_per_quarter: clampToRange(budget, BUDGET_USD_PER_QUARTER_RANGE) } };
}

export function setSpeed(s: Scenario, latency_class: LatencyClass): Scenario {
  return { ...s, latency_class };
}

function parseMix(json: string): ModelMix | null {
  try {
    const m = JSON.parse(json) as Partial<ModelMix>;
    return typeof m.frontier === "number" &&
      typeof m.mid === "number" &&
      typeof m.small === "number" &&
      typeof m.open_weight_share === "number"
      ? { frontier: m.frontier, mid: m.mid, small: m.small, open_weight_share: m.open_weight_share }
      : null;
  } catch {
    return null;
  }
}

/**
 * The picked workloads, split evenly within their basis, with the
 * share-weighted blend of their usual model mixes (one pick keeps that
 * workload's own mix). An empty pick leaves the scenario as it is.
 */
export function setWorkloads(s: Scenario, ids: string[], tables: Tables): Scenario {
  const rows = tables.workloads.filter((w) => ids.includes(w.workload_id));
  if (rows.length === 0) return s;
  const inBasis = (basis: WorkloadBasis) => rows.filter((w) => w.basis === basis).length;
  const workload_mix = Object.fromEntries(rows.map((w) => [w.workload_id, 1 / inBasis(w.basis)]));

  const total = Object.values(workload_mix).reduce((a, b) => a + b, 0);
  const blend: ModelMix = { frontier: 0, mid: 0, small: 0, open_weight_share: 0 };
  for (const w of rows) {
    const mix = parseMix(w.default_model_mix);
    if (mix === null) return { ...s, workload_mix };
    const weight = workload_mix[w.workload_id] / total;
    for (const key of Object.keys(blend) as (keyof ModelMix)[]) blend[key] += weight * mix[key];
  }
  return { ...s, workload_mix, model_mix: blend };
}

/**
 * A company type's starting point: all its workloads, how it usually buys,
 * and its usual customer count when it has customer work. Team size, budget
 * and speed are kept.
 */
export function setCompany(s: Scenario, company: Company, tables: Tables): Scenario {
  const next = setWorkloads({ ...s, stage_today: company.stage }, company.workloads, tables);
  const { customers: _dropped, ...baseline } = next.baseline;
  return hasBasis(next, tables, "customer")
    ? { ...next, baseline: { ...baseline, customers: company.defaultCustomers } }
    : { ...next, baseline };
}

/** "Software engineering" -> "software engineering"; "AI features" stays as it is. */
export function lowerFirst(label: string): string {
  return label.length > 1 && label[1] === label[1].toUpperCase()
    ? label
    : label.charAt(0).toLowerCase() + label.slice(1);
}

/**
 * Where the numeric answers start when a company type is picked (spec 15.3):
 * the sliders open here, and a visitor who presses Continue has answered with
 * this value. They are the intake's own constants, so no answer or estimate
 * ever reads a number from the example scenario the page starts from.
 */
export const INTAKE_DEFAULTS = {
  users: 50,
  budget_usd_per_quarter: 100_000,
  latency_class: "interactive" as LatencyClass,
};

/**
 * Picking a company type at the start of the questions: the type's starting
 * point (`setCompany`) with team size, budget and speed back at the intake's
 * own defaults, so nothing of the example the page started from is left in an
 * answer. (The answer grid's company cell uses `setCompany` alone, which keeps
 * the visitor's numbers.)
 */
export function beginIntake(s: Scenario, company: Company, tables: Tables): Scenario {
  const next = setCompany(s, company, tables);
  return {
    ...next,
    latency_class: INTAKE_DEFAULTS.latency_class,
    baseline: {
      ...next.baseline,
      users: INTAKE_DEFAULTS.users,
      budget_usd_per_quarter: INTAKE_DEFAULTS.budget_usd_per_quarter,
    },
  };
}

/** The largest number of steps any company type shows, computed from the step rules, never typed (spec 15.2). */
export function maxSteps(tables: Tables): number {
  return Math.max(...COMPANIES.map((c) => stepsFor(c, tables).length));
}

export interface StepProgress {
  /** "Step 1" before a type is picked, then "Step n of N". */
  label: string;
  /** The progress rule is filled to `value` over `max`. */
  value: number;
  max: number;
}

/**
 * The step label and how full the progress rule is (spec 15.2). Before a type
 * is chosen N is unknown, so the label has no total and the rule is one step
 * of the longest path; after it, n of N and n over N.
 */
export function stepProgress(company: Company | null, current: StepId, tables: Tables): StepProgress {
  if (!company) return { label: "Step 1", value: 1, max: maxSteps(tables) };
  const steps = stepsFor(company, tables);
  const n = Math.max(0, steps.indexOf(current)) + 1;
  return { label: `Step ${n} of ${steps.length}`, value: n, max: steps.length };
}

/** The steps that show the estimate: the budget step and the speed step, once the head counts are answered (spec 15.3 (1)). */
const ESTIMATE_STEPS: readonly StepId[] = ["budget", "speed"];

/** True on the steps that have the estimate beside the question; false on every earlier step. */
export function showsEstimate(step: StepId): boolean {
  return ESTIMATE_STEPS.includes(step);
}

/**
 * The scenario the live estimate is worked out from (spec 15.3): the visitor's
 * answers (company type, work, head counts, speed) and the section 5 defaults,
 * and nothing else. Every field is named here, so a field of the example the
 * page started from (its named models, hardware tiers, quality floor,
 * comparator, goal) cannot reach the estimate. The budget is the visitor's, but
 * Today and With InfraVana are the same at every budget (spec 7.2 step 4).
 */
export function estimateScenario(s: Scenario): Scenario {
  const { users, budget_usd_per_quarter, customers } = s.baseline;
  return {
    baseline: customers === undefined ? { users, budget_usd_per_quarter } : { users, budget_usd_per_quarter, customers },
    workload_mix: s.workload_mix,
    model_mix: s.model_mix,
    stage_today: s.stage_today,
    latency_class: s.latency_class,
    named_models: [],
    tiers_allowed: "all",
    unit: "people",
  };
}

export interface EstimateFigures {
  /** Per quarter, USD. */
  today: number;
  withInfravana: number;
  saved: number;
  /** Percent of Today. */
  savedPct: number;
}

/** The three figures of the estimate panel: one `compute()` call on `estimateScenario`. */
export function estimateFigures(s: Scenario, tables: Tables): EstimateFigures {
  const { allocation, headline } = compute(estimateScenario(s), tables);
  const saved = (allocation.total_usd * headline.cost_savings_pct) / 100;
  return {
    today: allocation.total_usd,
    withInfravana: allocation.total_usd - saved,
    saved,
    savedPct: headline.cost_savings_pct,
  };
}

/** "1 kind" or "5 kinds". */
export function kindsOfWork(n: number): string {
  return `${n} ${n === 1 ? "kind" : "kinds"}`;
}

const countFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** "customers" -> "customer", "subscribers" -> "subscriber". */
function singular(word: string): string {
  return word.replace(/s$/, "");
}

/**
 * The line under the estimate figures, naming what they are worked out from
 * (spec 15.3). A part the company type does not ask is left out.
 */
export function estimateBasisLine(s: Scenario, company: Company, tables: Tables): string {
  const { users, customers = 0 } = s.baseline;
  const team = hasBasis(s, tables, "employee");
  const served = hasBasis(s, tables, "customer");
  const parts: string[] = [];
  if (team) parts.push(`${countFormat.format(users)} ${users === 1 ? "person" : "people"}`);
  if (served) {
    parts.push(`${countFormat.format(customers)} ${customers === 1 ? singular(company.customerWord) : company.customerWord}`);
  }
  parts.push(`${kindsOfWork(selectedWorkloads(s, tables).length)} of work`);
  const per = [team ? "per person" : null, served ? `per ${singular(company.customerWord)}` : null].filter(Boolean);
  return `Worked out from your answers: ${parts.join(", ")}, at typical use ${per.join(" and ")}.`;
}
