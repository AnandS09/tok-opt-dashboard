/**
 * Validation of a scenario file (spec 7.1): the stage-2 response with its
 * verdict envelope. Every failure names the file and the JSON path of the
 * offending field.
 */

import type {
  ChartId,
  LatencyClass,
  ModelMix,
  Scenario,
  ScenarioResponse,
  ScenarioState,
  Stage,
  Verdict,
} from "../contract";
import { DEMAND_UNITS, LATENCY_CLASSES, STAGES, VERDICTS } from "./schema";

const CHART_IDS: readonly ChartId[] = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9"];

type Json = Record<string, unknown>;

/** Tolerance for "the three tier shares sum to 1". */
const MIX_SUM_TOLERANCE = 1e-6;

class Reader {
  constructor(
    private readonly file: string,
    /** hw_ids of hardware.csv, to check `tiers_allowed` against. */
    private readonly hardwareIds: ReadonlySet<string>,
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

  state(path: string, value: unknown): ScenarioState {
    const o = this.object(path, value);
    return {
      users: this.number(`${path}.users`, o.users),
      budget_usd_per_quarter: this.number(`${path}.budget_usd_per_quarter`, o.budget_usd_per_quarter),
    };
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
        if (!this.hardwareIds.has(id)) {
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
    return scenario;
  }
}

export function parseScenarioResponse(
  file: string,
  json: unknown,
  hardwareIds: ReadonlySet<string>,
): ScenarioResponse {
  const r = new Reader(file, hardwareIds);
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
