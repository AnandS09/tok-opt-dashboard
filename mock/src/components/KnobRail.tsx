import { useMemo, useState } from "react";
import type {
  CaseStudyRow,
  DemandUnit,
  HardwareClass,
  LatencyClass,
  ModelMix,
  Scenario,
  Stage,
  Tables,
} from "../contract";
import { rebalance, sameShares } from "../store/mix";
import { fmtShare, hwLabel } from "../shared/format";
import {
  fmtInt,
  HARDWARE_CLASS_LABEL,
  LATENCY_LABEL,
  STAGE_HINT,
  STAGE_LABEL,
} from "./format";
import { MixSliders } from "./MixSliders";
import { NumberField } from "./NumberField";
import { Segmented, type SegmentOption } from "./Segmented";

export const USERS_MIN = 1;
export const USERS_MAX = 10_000;
export const BUDGET_MIN = 1_000;
export const BUDGET_MAX = 10_000_000;

type Period = "quarter" | "month" | "year";

interface KnobRailProps {
  id: string;
  /** Open-weight share asked for and the share the engine could route; null before a result. */
  openShare: { asked: number; possible: number } | null;
  tables: Tables;
  scenario: Scenario;
  onEdit: (update: (scenario: Scenario) => Scenario) => void;
  onReset: () => void;
}

const TIERS = ["frontier", "mid", "small"] as const;

const UNIT_OPTIONS: SegmentOption<DemandUnit>[] = [
  { value: "people", label: "People" },
  { value: "workflows", label: "Workflows" },
];

const PERIOD_OPTIONS: SegmentOption<Period>[] = [
  { value: "quarter", label: "Quarter" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

function parseMix(json: string): ModelMix | null {
  try {
    const raw = JSON.parse(json) as Partial<ModelMix>;
    const { frontier, mid, small, open_weight_share } = raw;
    if (
      typeof frontier === "number" &&
      typeof mid === "number" &&
      typeof small === "number" &&
      typeof open_weight_share === "number"
    ) {
      return { frontier, mid, small, open_weight_share };
    }
  } catch {
    // fall through: a malformed preset is simply not offered
  }
  return null;
}

function sameModelMix(a: ModelMix, b: ModelMix): boolean {
  return (
    sameShares(a as unknown as Record<string, number>, b as unknown as Record<string, number>, [
      ...TIERS,
      "open_weight_share",
    ])
  );
}

export function KnobRail({ id, openShare, tables, scenario, onEdit, onReset }: KnobRailProps) {
  const [period, setPeriod] = useState<Period>("quarter");
  const monthsPerQuarter = tables.manifest.parameters.months_per_quarter;
  // quarterly dollars multiplied by this give dollars per displayed period
  const periodFactor = period === "quarter" ? 1 : period === "month" ? 1 / monthsPerQuarter : 12 / monthsPerQuarter;

  const workloadIds = tables.workloads.map((w) => w.workload_id);

  const hardwareGroups = useMemo(() => {
    const withData = new Set(tables.throughput_curves.map((r) => r.hw_id));
    const groups = new Map<HardwareClass, { hw_id: string; vendor: string; usd_per_hr: number; hasData: boolean }[]>();
    for (const hw of tables.hardware) {
      const list = groups.get(hw.class) ?? [];
      list.push({ hw_id: hw.hw_id, vendor: hw.vendor, usd_per_hr: hw.usd_per_hr, hasData: withData.has(hw.hw_id) });
      groups.set(hw.class, list);
    }
    return Array.from(groups.entries());
  }, [tables.hardware, tables.throughput_curves]);

  const available = hardwareGroups.flatMap(([, list]) => list.filter((h) => h.hasData).map((h) => h.hw_id));
  const selected = new Set(scenario.tiers_allowed === "all" ? available : scenario.tiers_allowed);

  const toggleTier = (hwId: string) => {
    const next = new Set(selected);
    if (next.has(hwId)) next.delete(hwId);
    else next.add(hwId);
    if (next.size === 0) return;
    const allSelected = available.every((a) => next.has(a));
    onEdit((s) => ({ ...s, tiers_allowed: allSelected ? "all" : available.filter((a) => next.has(a)) }));
  };

  const workloadItems = workloadIds.map((workloadId) => ({
    key: workloadId,
    label: tables.workloads.find((w) => w.workload_id === workloadId)?.label ?? workloadId,
    value: scenario.workload_mix[workloadId] ?? 0,
  }));

  const tierShares: Record<string, number> = {
    frontier: scenario.model_mix.frontier,
    mid: scenario.model_mix.mid,
    small: scenario.model_mix.small,
  };

  const compositeScores = tables.quality.filter((q) => q.benchmark.startsWith("composite:")).map((q) => q.score);
  const floorMin = compositeScores.length ? Math.floor(Math.min(...compositeScores)) : 0;
  const floorMax = compositeScores.length ? Math.ceil(Math.max(...compositeScores)) : 100;
  const workloadFloors = tables.workloads.filter((w) => (scenario.workload_mix[w.workload_id] ?? 0) > 0);
  const ownFloorValue = workloadFloors.length ? Math.max(...workloadFloors.map((w) => w.quality_floor)) : floorMin;
  const floorValue = scenario.quality_floor ?? ownFloorValue;

  const latencyOptions: SegmentOption<LatencyClass>[] = (
    Object.keys(tables.manifest.parameters.latency_classes) as LatencyClass[]
  ).map((cls) => {
    const def = tables.manifest.parameters.latency_classes[cls];
    const ttft = def.max_p95_ttft_ms === null ? "" : `, p95 first token within ${fmtInt(def.max_p95_ttft_ms)} ms`;
    return {
      value: cls,
      label: LATENCY_LABEL[cls],
      hint: `At least ${fmtInt(def.min_tok_s_per_user)} tokens per second per user${ttft}`,
    };
  });

  const presets: { row: CaseStudyRow; mix: ModelMix }[] = tables.case_studies.flatMap((row) => {
    const mix = parseMix(row.model_mix_json);
    return mix ? [{ row, mix }] : [];
  });
  const activePreset = presets.find((p) => sameModelMix(p.mix, scenario.model_mix));

  const stageOptions: SegmentOption<Stage>[] = (Object.keys(STAGE_LABEL) as Stage[]).map((stage) => ({
    value: stage,
    label: STAGE_LABEL[stage],
    hint: STAGE_HINT[stage],
  }));

  return (
    <aside id={id} className="rail card" aria-label="Knobs">
      <h2 className="rail__title">Knobs</h2>

      <section className="knob" aria-labelledby="knob-size">
        <h3 id="knob-size" className="knob__title">Users and workflows</h3>
        <NumberField
          id="knob-users"
          label="Number"
          value={scenario.baseline.users}
          min={USERS_MIN}
          max={USERS_MAX}
          integer
          onChange={(users) => onEdit((s) => ({ ...s, baseline: { ...s.baseline, users } }))}
        />
        <Segmented
          name="knob-unit"
          legend="Count"
          hideLegend
          value={scenario.unit}
          options={UNIT_OPTIONS}
          onChange={(unit) => onEdit((s) => ({ ...s, unit }))}
        />
        {scenario.target ? (
          <NumberField
            id="knob-target-users"
            label="Growing to"
            value={scenario.target.users}
            min={USERS_MIN}
            max={USERS_MAX}
            integer
            onChange={(users) =>
              onEdit((s) => (s.target ? { ...s, target: { ...s.target, users } } : s))
            }
          />
        ) : null}
      </section>

      <section className="knob" aria-labelledby="knob-budget">
        <h3 id="knob-budget" className="knob__title">Budget</h3>
        <NumberField
          id="knob-budget-input"
          label={`Dollars per ${period}`}
          prefix="$"
          value={Math.round(scenario.baseline.budget_usd_per_quarter * periodFactor)}
          min={Math.ceil(BUDGET_MIN * periodFactor)}
          max={Math.floor(BUDGET_MAX * periodFactor)}
          step={periodFactor < 1 ? 100 : 1000}
          onChange={(shown) =>
            onEdit((s) => ({
              ...s,
              baseline: { ...s.baseline, budget_usd_per_quarter: Math.round(shown / periodFactor) },
            }))
          }
        />
        <Segmented
          name="knob-period"
          legend="Show budget per"
          hideLegend
          value={period}
          options={PERIOD_OPTIONS}
          onChange={setPeriod}
        />
        {scenario.target ? (
          <NumberField
            id="knob-target-budget"
            label={`Growing to, dollars per ${period}`}
            prefix="$"
            value={Math.round(scenario.target.budget_usd_per_quarter * periodFactor)}
            min={Math.ceil(BUDGET_MIN * periodFactor)}
            max={Math.floor(BUDGET_MAX * periodFactor)}
            step={periodFactor < 1 ? 100 : 1000}
            onChange={(shown) =>
              onEdit((s) =>
                s.target
                  ? { ...s, target: { ...s.target, budget_usd_per_quarter: Math.round(shown / periodFactor) } }
                  : s,
              )
            }
          />
        ) : null}
      </section>

      <section className="knob" aria-labelledby="knob-today">
        <h3 id="knob-today" className="knob__title">Where you are today</h3>
        <Segmented
          name="knob-stage"
          legend="Where you are today"
          hideLegend
          value={scenario.stage_today}
          options={stageOptions}
          onChange={(stage_today) => onEdit((s) => ({ ...s, stage_today }))}
        />
        <p className="knob__hint">{STAGE_HINT[scenario.stage_today]}. This sets the "today" side of every chart.</p>
      </section>

      <section className="knob" aria-labelledby="knob-hardware">
        <h3 id="knob-hardware" className="knob__title">Hardware tiers</h3>
        {hardwareGroups.map(([hwClass, list]) => (
          <fieldset key={hwClass} className="checks">
            <legend className="field__label">{HARDWARE_CLASS_LABEL[hwClass]}</legend>
            {list.map((hw) => {
              const checked = hw.hasData && selected.has(hw.hw_id);
              const onlyOne = checked && selected.size === 1;
              const title = !hw.hasData
                ? "No throughput data for this tier, so it cannot be used"
                : onlyOne
                  ? "At least one tier must stay selected"
                  : `${hw.vendor}, ${hw.usd_per_hr} dollars per hour (placeholder)`;
              return (
                <label key={hw.hw_id} className={hw.hasData ? "check" : "check check--disabled"} title={title}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!hw.hasData || onlyOne}
                    onChange={() => toggleTier(hw.hw_id)}
                  />
                  <span>{hwLabel(hw.hw_id)}</span>
                  {!hw.hasData ? <span className="check__note">no data</span> : null}
                </label>
              );
            })}
          </fieldset>
        ))}
        <p className="knob__hint">Turning tiers off shrinks the choice InfraVana can route across.</p>
      </section>

      <section className="knob" aria-labelledby="knob-model">
        <h3 id="knob-model" className="knob__title">Model mix</h3>
        <MixSliders
          idPrefix="knob-tier"
          items={TIERS.map((tier) => ({
            key: tier,
            label: tier === "frontier" ? "Frontier" : tier === "mid" ? "Mid-tier" : "Small",
            value: tierShares[tier],
          }))}
          onChange={(key, value) =>
            onEdit((s) => {
              const next = rebalance(
                { frontier: s.model_mix.frontier, mid: s.model_mix.mid, small: s.model_mix.small },
                [...TIERS],
                key,
                value,
              );
              return {
                ...s,
                model_mix: { ...s.model_mix, frontier: next.frontier, mid: next.mid, small: next.small },
              };
            })
          }
        />
        <MixSliders
          idPrefix="knob-open"
          items={[{ key: "open_weight_share", label: "Open-weight (rest proprietary)", value: scenario.model_mix.open_weight_share }]}
          onChange={(_key, value) =>
            onEdit((s) => ({ ...s, model_mix: { ...s.model_mix, open_weight_share: value } }))
          }
        />
        {openShare && Math.round(openShare.asked * 100) !== Math.round(openShare.possible * 100) ? (
          <p className="knob__hint knob__hint--strong">
            {fmtShare(openShare.asked)} open-weight asked, {fmtShare(openShare.possible)} possible: the
            rest has no eligible open-weight model in its tier that would be cheaper, so it stays on
            Today's proprietary model.
          </p>
        ) : null}
        <p className="knob__hint">
          What these knobs do: the tier sliders set which tiers can hold the open-weight share. They do not
          change Today's baseline, which buys one model per workload whatever the mix, and InfraVana does
          not move traffic between tiers at present. The open-weight slider sets how much of each eligible
          tier moves.
        </p>
      </section>

      <section className="knob" aria-labelledby="knob-workload">
        <h3 id="knob-workload" className="knob__title">Workload mix</h3>
        <MixSliders
          idPrefix="knob-workload-share"
          items={workloadItems}
          onChange={(key, value) =>
            onEdit((s) => {
              const full = rebalance(s.workload_mix, workloadIds, key, value);
              const mix: Record<string, number> = {};
              for (const [k, v] of Object.entries(full)) if (v > 0) mix[k] = v;
              return { ...s, workload_mix: mix };
            })
          }
        />
      </section>

      <section className="knob" aria-labelledby="knob-latency">
        <h3 id="knob-latency" className="knob__title">Latency target</h3>
        <div className="field">
          <label className="sr-only" htmlFor="knob-latency-select">Latency target</label>
          <select
            id="knob-latency-select"
            className="input"
            value={scenario.latency_class}
            onChange={(event) =>
              onEdit((s) => ({ ...s, latency_class: event.target.value as LatencyClass }))
            }
          >
            {latencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <p className="knob__hint">
          {latencyOptions.find((o) => o.value === scenario.latency_class)?.hint}. Both sides use it.
        </p>
      </section>

      <section className="knob" aria-labelledby="knob-quality">
        <h3 id="knob-quality" className="knob__title">Quality floor</h3>
        <div className="slider">
          <label className="slider__label" htmlFor="knob-quality-range">Benchmark score</label>
          <input
            id="knob-quality-range"
            className="range"
            type="range"
            min={floorMin}
            max={floorMax}
            step={1}
            value={floorValue}
            onChange={(event) => onEdit((s) => ({ ...s, quality_floor: Number(event.target.value) }))}
          />
          <output className="slider__value" htmlFor="knob-quality-range">{floorValue}</output>
        </div>
        {scenario.quality_floor === undefined ? (
          <p className="knob__hint">
            Each workload uses its own floor:{" "}
            {workloadFloors.map((w) => `${w.label.toLowerCase()} ${w.quality_floor}`).join(", ")}.
          </p>
        ) : (
          <p className="knob__hint">
            One floor for every workload.{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => onEdit((s) => ({ ...s, quality_floor: undefined }))}
            >
              Use each workload's own floor
            </button>
          </p>
        )}
        <p className="knob__hint">Models scoring below the floor are left out of routing.</p>
      </section>

      <section className="knob" aria-labelledby="knob-case">
        <h3 id="knob-case" className="knob__title">Case study</h3>
        <div className="case-list" role="group" aria-labelledby="knob-case">
          {presets.map(({ row, mix }) => (
            <button
              key={row.case_id}
              type="button"
              className="chip"
              aria-pressed={activePreset?.row.case_id === row.case_id}
              onClick={() => onEdit((s) => ({ ...s, model_mix: { ...mix } }))}
            >
              {row.label}
            </button>
          ))}
        </div>
        <p className="knob__hint">
          {activePreset ? activePreset.row.description : "A preset sets the model mix. Placeholder mixes."}
        </p>
      </section>

      <button type="button" className="button button--block" onClick={onReset}>
        Reset to what was understood
      </button>
    </aside>
  );
}
