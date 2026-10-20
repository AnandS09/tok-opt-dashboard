import { useMemo } from "react";
import type { Scenario, Stage, Tables, WorkloadBasis } from "../contract";
import { hasBasis, setCustomers } from "../store/intake";
import { rebalance } from "../store/mix";
import { fmtShare, hwLabel } from "../shared/format";
import { STAGE_HINT, STAGE_LABEL } from "./format";
import { MixSliders } from "./MixSliders";
import { Segmented, type SegmentOption } from "./Segmented";

interface KnobRailProps {
  /** Open-weight share asked for and the share the engine could route; null before a result. */
  openShare: { asked: number; possible: number } | null;
  tables: Tables;
  scenario: Scenario;
  onEdit: (update: (scenario: Scenario) => Scenario) => void;
  onReset: () => void;
}

const TIERS = ["frontier", "mid", "small"] as const;
const TIER_LABEL: Record<(typeof TIERS)[number], string> = {
  frontier: "Flagship models",
  mid: "Mid-size models",
  small: "Small models",
};

/**
 * The fine-tuning inputs, collapsed under the sentence: how the team buys AI
 * today, the work of the team and of the customers and the model mix, the
 * hardware allowed, and the quality bar. Company type, team size, customers,
 * budget, main work and speed live in the sentence.
 */
export function KnobRail({ openShare, tables, scenario, onEdit, onReset }: KnobRailProps) {
  const customerWork = hasBasis(scenario, tables, "customer");

  // Shares sum to 100% within each basis, so each group rebalances on its own.
  const workloadSliders = (basis: WorkloadBasis) => {
    const group = tables.workloads.filter((w) => w.basis === basis);
    const ids = group.map((w) => w.workload_id);
    return (
      <MixSliders
        idPrefix={`knob-${basis}-share`}
        items={group.map((w) => ({ key: w.workload_id, label: w.label, value: scenario.workload_mix[w.workload_id] ?? 0 }))}
        onChange={(key, value) =>
          onEdit((s) => {
            const full = { ...s.workload_mix, ...rebalance(s.workload_mix, ids, key, value) };
            return { ...s, workload_mix: Object.fromEntries(Object.entries(full).filter(([, v]) => v > 0)) };
          })
        }
      />
    );
  };

  // Hardware grouped by vendor, only the tiers that have throughput data.
  const vendors = useMemo(() => {
    const withData = new Set(tables.throughput_curves.map((r) => r.hw_id));
    const groups = new Map<string, string[]>();
    for (const hw of tables.hardware) {
      if (!withData.has(hw.hw_id)) continue;
      groups.set(hw.vendor, [...(groups.get(hw.vendor) ?? []), hw.hw_id]);
    }
    return Array.from(groups.entries());
  }, [tables.hardware, tables.throughput_curves]);

  const available = vendors.flatMap(([, ids]) => ids);
  const selected = new Set(scenario.tiers_allowed === "all" ? available : scenario.tiers_allowed);

  const toggleHw = (hwId: string) => {
    const next = new Set(selected);
    if (next.has(hwId)) next.delete(hwId);
    else next.add(hwId);
    if (next.size === 0) return;
    const all = available.every((a) => next.has(a));
    onEdit((s) => ({ ...s, tiers_allowed: all ? "all" : available.filter((a) => next.has(a)) }));
  };

  const compositeScores = tables.quality.filter((q) => q.benchmark.startsWith("composite:")).map((q) => q.score);
  const floorMin = compositeScores.length ? Math.floor(Math.min(...compositeScores)) : 0;
  const floorMax = compositeScores.length ? Math.ceil(Math.max(...compositeScores)) : 100;
  const active = tables.workloads.filter((w) => (scenario.workload_mix[w.workload_id] ?? 0) > 0);
  const ownFloor = active.length ? Math.max(...active.map((w) => w.quality_floor)) : floorMin;
  const floorValue = scenario.quality_floor ?? ownFloor;

  const stageOptions: SegmentOption<Stage>[] = (Object.keys(STAGE_LABEL) as Stage[]).map((stage) => ({
    value: stage,
    label: STAGE_LABEL[stage],
    hint: STAGE_HINT[stage],
  }));

  return (
    <div className="finetune__grid">
      <section className="knob" aria-labelledby="knob-today">
        <h3 id="knob-today" className="knob__title">How you buy AI today</h3>
        <Segmented
          name="knob-stage"
          legend="How you buy AI today"
          hideLegend
          value={scenario.stage_today}
          options={stageOptions}
          onChange={(stage_today) => onEdit((s) => ({ ...s, stage_today }))}
        />
        <p className="knob__hint">{STAGE_HINT[scenario.stage_today]}.</p>
      </section>

      <section className="knob" aria-labelledby="knob-workload">
        <h3 id="knob-workload" className="knob__title">What the team uses AI for</h3>
        {workloadSliders("employee")}
      </section>

      <section className="knob" aria-labelledby="knob-customer">
        <h3 id="knob-customer" className="knob__title">What your customers use AI for</h3>
        {workloadSliders("customer")}
        {customerWork ? (
          <div className="field">
            <label className="field__label" htmlFor="knob-customers">
              Customers
            </label>
            <input
              id="knob-customers"
              className="input"
              type="number"
              min={0}
              step={1000}
              value={scenario.baseline.customers ?? 0}
              onChange={(event) => onEdit((s) => setCustomers(s, Math.max(0, Number(event.target.value) || 0)))}
            />
          </div>
        ) : null}
      </section>

      <section className="knob" aria-labelledby="knob-model">
        <h3 id="knob-model" className="knob__title">Which models</h3>
        <MixSliders
          idPrefix="knob-tier"
          items={TIERS.map((tier) => ({ key: tier, label: TIER_LABEL[tier], value: scenario.model_mix[tier] }))}
          onChange={(key, value) =>
            onEdit((s) => {
              const next = rebalance(
                { frontier: s.model_mix.frontier, mid: s.model_mix.mid, small: s.model_mix.small },
                [...TIERS],
                key,
                value,
              );
              return { ...s, model_mix: { ...s.model_mix, frontier: next.frontier, mid: next.mid, small: next.small } };
            })
          }
        />
        <MixSliders
          idPrefix="knob-open"
          items={[{ key: "open_weight_share", label: "Share on open models", value: scenario.model_mix.open_weight_share }]}
          onChange={(_key, value) => onEdit((s) => ({ ...s, model_mix: { ...s.model_mix, open_weight_share: value } }))}
        />
        <p className="knob__hint">
          Today keeps one model for each kind of work. This split sets how the work moved to open models is spread
          across model sizes.
        </p>
        {openShare && Math.round(openShare.asked * 100) !== Math.round(openShare.possible * 100) ? (
          <p className="knob__hint">
            Only {fmtShare(openShare.possible)} can move to open models here; the rest has no cheaper open model.
          </p>
        ) : null}
      </section>

      <section className="knob" aria-labelledby="knob-hardware">
        <h3 id="knob-hardware" className="knob__title">Hardware allowed</h3>
        {vendors.map(([vendor, ids]) => (
          <fieldset key={vendor} className="checks">
            <legend className="field__label">{vendor}</legend>
            {ids.map((hwId) => {
              const checked = selected.has(hwId);
              const onlyOne = checked && selected.size === 1;
              return (
                <label key={hwId} className="check" title={onlyOne ? "At least one must stay on" : undefined}>
                  <input type="checkbox" checked={checked} disabled={onlyOne} onChange={() => toggleHw(hwId)} />
                  <span>{hwLabel(hwId)}</span>
                </label>
              );
            })}
          </fieldset>
        ))}
      </section>

      <section className="knob" aria-labelledby="knob-quality">
        <h3 id="knob-quality" className="knob__title">Minimum model quality</h3>
        <div className="slider">
          <label className="slider__label" htmlFor="knob-quality-range">
            Benchmark score
          </label>
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
          <output className="slider__value" htmlFor="knob-quality-range">
            {floorValue}
          </output>
        </div>
        <p className="knob__hint">
          {scenario.quality_floor === undefined
            ? "Until you move this, each kind of work keeps its own usual minimum (the highest is shown)."
            : "InfraVana only moves work to cheaper models that score at least this."}
        </p>
      </section>

      <button type="button" className="link-button finetune__reset" onClick={onReset}>
        Undo fine-tuning
      </button>
    </div>
  );
}
