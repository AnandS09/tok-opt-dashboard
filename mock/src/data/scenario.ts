/**
 * Validation of a scenario file (spec 7.1): the stage-2 response with its
 * verdict envelope. Every failure names the file and the JSON path of the
 * offending field.
 */

import type {
  ChartId,
  GoalId,
  LatencyClass,
  ModelMix,
  Scenario,
  ScenarioResponse,
  ScenarioState,
  Stage,
  Tradeoff,
  Verdict,
} from "../contract";
import {
  BUDGET_USD_PER_QUARTER_RANGE,
  CUSTOMERS_RANGE,
  USERS_RANGE,
  clampToRange,
} from "./ranges";
import { DEMAND_UNITS, GOALS, LATENCY_CLASSES, STAGES, VERDICTS } from "./schema";

const CHART_IDS: readonly ChartId[] = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10"];

/** Ids a scenario may name, read from the data files it is checked against. */
export interface KnownIds {
  /** hw_ids of hardware.csv, to check `tiers_allowed` against. */
  hardwareIds: ReadonlySet<string>;
  /** pattern_ids of buying_patterns.csv, to check `comparator` against. */
  patternIds: ReadonlySet<string>;
}

type Json = Record<string, unknown>;

/** Tolerance for "the three tier shares sum to 1". */
const MIX_SUM_TOLERANCE = 1e-6;

class Reader {
  constructor(
    private readonly file: string,
    private readonly known: KnownIds,
  ) {}

  fail(path: string, expected: string): never {
    throw new Error(`${this.file}: field "${path}" must be ${expected}`);
  }

  object(path: string, value: unknown): Json {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      this.fail(path, "an object");
    }
    return value as Json;
  }

  number(path: string, value: unknown): number {
    if (typeof value !== "number" || !Number.isFinite(value)) this.fail(path, "a number");
    return value as number;
  }

  string(path: string, value: unknown): string {
    if (typeof value !== "string") this.fail(path, "text");
    return value as string;
  }

  oneOf<T extends string>(path: string, value: unknown, allowed: readonly T[]): T {
    if (typeof value !== "string" || !allowed.includes(value as T)) {
      this.fail(path, `one of ${allowed.join(", ")}`);
    }
    return value as T;
  }

  stringList(path: string, value: unknown): string[] {
    if (!Array.isArray(value)) this.fail(path, "a list of text");
    (value as unknown[]).forEach((item, i) => this.string(`${path}[${i}]`, item));
    return value as string[];
  }

  /** Users, budget and customers are clamped to the spec 5.2 ranges, not rejected. */
  state(path: string, value: unknown): ScenarioState {
    const o = this.object(path, value);
    return {
      users: clampToRange(this.number(`${path}.users`, o.users), USERS_RANGE),
      budget_usd_per_quarter: clampToRange(
        this.number(`${path}.budget_usd_per_quarter`, o.budget_usd_per_quarter),
        BUDGET_USD_PER_QUARTER_RANGE,
      ),
      ...(o.customers === undefined
        ? {}
        : { customers: clampToRange(this.number(`${path}.customers`, o.customers), CUSTOMERS_RANGE) }),
    };
  }

  tradeoff(path: string, value: unknown): Tradeoff {
    const o = this.object(path, value);
    const step = (key: "quality_step" | "speed_step"): number => {
      const n = this.number(`${path}.${key}`, o[key]);
      if (!Number.isInteger(n) || n < 0) this.fail(`${path}.${key}`, `a whole number from 0, got ${n}`);
      return n;
    };
    return { quality_step: step("quality_step"), speed_step: step("speed_step") };
  }

  modelMix(path: string, value: unknown): ModelMix {
    const o = this.object(path, value);
    const mix = {
      frontier: this.number(`${path}.frontier`, o.frontier),
      mid: this.number(`${path}.mid`, o.mid),
      small: this.number(`${path}.small`, o.small),
      open_weight_share: this.number(`${path}.open_weight_share`, o.open_weight_share),
    };
    for (const key of ["frontier", "mid", "small", "open_weight_share"] as const) {
      if (mix[key] < 0 || mix[key] > 1) {
        this.fail(`${path}.${key}`, `between 0 and 1, got ${mix[key]}`);
      }
    }
    const sum = mix.frontier + mix.mid + mix.small;
    if (Math.abs(sum - 1) > MIX_SUM_TOLERANCE) {
      this.fail(`${path}`, `shares frontier + mid + small summing to 1, got ${sum}`);
    }
    return mix;
  }

  scenario(path: string, value: unknown): Scenario {
    const o = this.object(path, value);
    const mix = this.object(`${path}.workload_mix`, o.workload_mix);
    const workload_mix: Record<string, number> = {};
    for (const [id, share] of Object.entries(mix)) {
      workload_mix[id] = this.number(`${path}.workload_mix.${id}`, share);
    }
    const tiersValue = o.tiers_allowed;
    const tiers_allowed =
      tiersValue === "all" ? "all" : this.stringList(`${path}.tiers_allowed`, tiersValue);
    if (tiers_allowed !== "all") {
      tiers_allowed.forEach((id, i) => {
        if (!this.known.hardwareIds.has(id)) {
          this.fail(`${path}.tiers_allowed[${i}]`, `an hw_id in hardware.csv, got "${id}"`);
        }
      });
    }

    const scenario: Scenario = {
      baseline: this.state(`${path}.baseline`, o.baseline),
      workload_mix,
      model_mix: this.modelMix(`${path}.model_mix`, o.model_mix),
      named_models: this.stringList(`${path}.named_models`, o.named_models),
      stage_today: this.oneOf<Stage>(`${path}.stage_today`, o.stage_today, STAGES),
      tiers_allowed,
      latency_class: this.oneOf<LatencyClass>(`${path}.latency_class`, o.latency_class, LATENCY_CLASSES),
      unit: this.oneOf(`${path}.unit`, o.unit, DEMAND_UNITS),
    };
    if (o.target !== undefined) scenario.target = this.state(`${path}.target`, o.target);
    if (o.quality_floor !== undefined) {
      scenario.quality_floor = this.number(`${path}.quality_floor`, o.quality_floor);
    }
    if (o.comparator !== undefined) {
      const comparator = this.string(`${path}.comparator`, o.comparator);
      if (!this.known.patternIds.has(comparator)) {
        this.fail(`${path}.comparator`, `a pattern_id in buying_patterns.csv, got "${comparator}"`);
      }
      scenario.comparator = comparator;
    }
    if (o.goal !== undefined) scenario.goal = this.oneOf<GoalId>(`${path}.goal`, o.goal, GOALS);
    if (o.tradeoff !== undefined) scenario.tradeoff = this.tradeoff(`${path}.tradeoff`, o.tradeoff);
    return scenario;
  }
}

export function parseScenarioResponse(
  file: string,
  json: unknown,
  known: KnownIds,
): ScenarioResponse {
  const r = new Reader(file, known);
  const o = r.object("(root)", json);
  const charts = o.charts;
  if (!Array.isArray(charts)) r.fail("charts", "a list of chart ids");
  return {
    verdict: r.oneOf<Verdict>("verdict", o.verdict, VERDICTS),
    reason_for_user: r.string("reason_for_user", o.reason_for_user),
    scenario: r.scenario("scenario", o.scenario),
    charts: (charts as unknown[]).map((id, i) => r.oneOf<ChartId>(`charts[${i}]`, id, CHART_IDS)),
    missing: r.stringList("missing", o.missing),
    narrative: r.string("narrative", o.narrative),
  };
}
