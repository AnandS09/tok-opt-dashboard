import type { LatencyClass, ModelMix, Scenario, Stage, Tables, WorkloadBasis } from "../contract";

/**
 * The guided start: company type, then plain one-click questions that adapt
 * to it, and the editable sentence that replaces them once answered. Each
 * answer writes straight into the one `Scenario` the rest of the page
 * computes from; nothing here is a second source of truth.
 */

export type CompanyType = "ai_first" | "software" | "enterprise" | "telecom" | "chip";

export interface Company {
  id: CompanyType;
  title: string;
  /** The title inside the sentence, with its article: "We are <sentence>". */
  sentence: string;
  line: string;
  /** Workloads this kind of company picks from, in the order shown. */
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
    sentence: "an AI-first startup",
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
    sentence: "a software or internet company",
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
    sentence: "a traditional enterprise",
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
    sentence: "a telecom or national cloud",
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
    sentence: "a chip or hardware design company",
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

export const BUDGETS = [50_000, 100_000, 200_000, 500_000];
export const SPEEDS: LatencyClass[] = ["interactive", "standard", "batch"];

export type StepId = "company" | "work" | "users" | "customers" | "budget" | "speed";

/** Workloads with a positive share, in workloads.csv order. */
export function selectedWorkloads(s: Scenario, tables: Tables): string[] {
  return tables.workloads.filter((w) => (s.workload_mix[w.workload_id] ?? 0) > 0).map((w) => w.workload_id);
}

export function hasBasis(s: Scenario, tables: Tables, basis: WorkloadBasis): boolean {
  return tables.workloads.some((w) => w.basis === basis && (s.workload_mix[w.workload_id] ?? 0) > 0);
}

/** The steps for the scenario as it stands: team size only with team work, customers only with customer work. */
export function stepsFor(s: Scenario, tables: Tables): StepId[] {
  const steps: StepId[] = ["company", "work"];
  if (hasBasis(s, tables, "employee")) steps.push("users");
  if (hasBasis(s, tables, "customer")) steps.push("customers");
  steps.push("budget", "speed");
  return steps;
}

/** A list of preset values, with the current value added in order when it is not one of them. */
export function withCurrent(values: number[], current: number): number[] {
  return values.includes(current) ? values : [...values, current].sort((a, b) => a - b);
}

export function setUsers(s: Scenario, users: number): Scenario {
  return { ...s, baseline: { ...s.baseline, users } };
}

export function setCustomers(s: Scenario, customers: number): Scenario {
  return { ...s, baseline: { ...s.baseline, customers } };
}

export function setBudget(s: Scenario, budget: number): Scenario {
  return { ...s, baseline: { ...s.baseline, budget_usd_per_quarter: budget } };
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
