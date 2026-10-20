import { useEffect, useRef } from "react";
import type { ScenarioResponse, Stage, Tables } from "../contract";
import { Drawer } from "./Drawer";
import { isAssumed, understoodItems } from "./describe";
import { fmtPercent, hwLabel, LATENCY_LABEL, STAGE_LABEL } from "./format";
import { priceDates } from "./priceDates";

export type PanelSection = "assumptions" | "data";

interface AssumptionsPanelProps {
  tables: Tables;
  response: ScenarioResponse;
  stage: Stage;
  section: PanelSection;
  onClose: () => void;
}

/**
 * Assumptions and data (spec 9): the defaults that were filled in, the
 * baseline definition, the hourly price sources, and the data version.
 */
export function AssumptionsPanel({ tables, response, stage, section, onClose }: AssumptionsPanelProps) {
  const dataSection = useRef<HTMLElement>(null);

  useEffect(() => {
    if (section === "data") dataSection.current?.scrollIntoView({ block: "start" });
  }, [section]);

  const assumed = understoodItems(response.scenario, tables).filter((item) =>
    isAssumed(item, response.missing),
  );
  const baseline = tables.baseline_providers.filter((row) => row.stage === stage);
  const dates = priceDates(tables);
  const { manifest } = tables;

  const describeBuy = (offerId: string | null, planId: string | null): string => {
    if (planId) {
      const plan = tables.seat_plans.find((p) => p.plan_id === planId);
      return plan ? `${plan.vendor} seat plan, ${plan.usd_per_user_month} dollars per user per month` : planId;
    }
    const offer = tables.model_offers.find((o) => o.offer_id === offerId);
    if (!offer) return offerId ?? "";
    const model = tables.models.find((m) => m.model_id === offer.model_id);
    const discount = offer.commit_discount_pct > 0 ? `, ${offer.commit_discount_pct}% commit discount` : "";
    return `${model?.family ?? offer.model_id} via ${offer.channel}${discount}`;
  };

  return (
    <Drawer title="Assumptions and data" onClose={onClose}>
      <p className="panel__warning">
        All data is invented placeholder data. Nothing here is measured, quoted or taken from a vendor.
      </p>

      <section aria-labelledby="panel-assumed">
        <h3 id="panel-assumed">Defaults that were filled in</h3>
        {assumed.length === 0 ? (
          <p>Every value was stated in the prompt.</p>
        ) : (
          <ul className="panel__list">
            {assumed.map((item) => (
              <li key={item.key}>
                <strong>{item.label}:</strong> {item.value}
              </li>
            ))}
          </ul>
        )}
        <p className="panel__muted">
          Values the prompt did not state are filled from the data tables and marked "assumed" in the
          Understood strip.
        </p>
      </section>

      <section aria-labelledby="panel-baseline">
        <h3 id="panel-baseline">How "today" is defined ({STAGE_LABEL[stage]} stage)</h3>
        <p>
          Today is a documented typical buyer, not the cheapest possible one: a company new to AI that is
          scaling from vendor options for individuals towards platforms that serve at scale. Seats and API
          use list price. Platform applies the commit discount read from the data. Switching "Where you are
          today" changes this table.
        </p>
        <div className="datatable__scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Workload</th>
                <th scope="col">Bought as</th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              {baseline.map((row, i) => (
                <tr key={i}>
                  <td>{tables.workloads.find((w) => w.workload_id === row.workload_id)?.label ?? row.workload_id}</td>
                  <td>{describeBuy(row.offer_id, row.plan_id)}</td>
                  <td>{fmtPercent(row.share_default)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="panel-rules">
        <h3 id="panel-rules">How the numbers are worked out</h3>
        <ul className="panel__list panel__list--rules">
          <li>
            The Platform stage applies a commit discount only when the offer's minimum commit is met, and
            pays list price otherwise. Seats and API always use list price.
          </li>
          <li>
            Today's baseline buys one model per workload, whatever the model mix. The mix changes how much
            traffic InfraVana can move, not what Today buys.
          </li>
          <li>Capacity is assumed unlimited on every tier and channel.</li>
          <li>
            Routing is conservative: InfraVana does not move traffic between tiers. It gets a better price
            on the same proprietary model, and moves the open-weight share onto tiers that have an
            eligible open-weight model.
          </li>
          <li>
            Tokens bought scale linearly with spend, so the two headline numbers carry the same
            information: the tokens multiple equals 1 divided by (1 minus the cost saving).
          </li>
        </ul>
      </section>

      <section aria-labelledby="panel-hardware">
        <h3 id="panel-hardware">Hardware prices per hour and their sources</h3>
        <div className="datatable__scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col">Dollars per hour</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {tables.hardware.map((hw) => (
                <tr key={hw.hw_id}>
                  <td>{hwLabel(hw.hw_id)}</td>
                  <td>{hw.usd_per_hr}</td>
                  <td>{hw.hr_price_source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section ref={dataSection} aria-labelledby="panel-data">
        <h3 id="panel-data">Data version</h3>
        <ul className="panel__list">
          <li>Data version: {manifest.data_version}</li>
          <li>Generated: {manifest.generated_at}</li>
          <li>Prices as of: {dates.label}</li>
          <li>Working days per quarter: {manifest.parameters.working_days_per_quarter}</li>
          {(Object.keys(manifest.parameters.latency_classes) as (keyof typeof manifest.parameters.latency_classes)[]).map(
            (cls) => {
              const def = manifest.parameters.latency_classes[cls];
              return (
                <li key={cls}>
                  {LATENCY_LABEL[cls]} latency: at least {def.min_tok_s_per_user} tokens per second per user
                  {def.max_p95_ttft_ms === null ? "" : `, first token within ${def.max_p95_ttft_ms} ms`}
                </li>
              );
            },
          )}
        </ul>
        {manifest.notice ? <p className="panel__muted">{manifest.notice}</p> : null}
      </section>
    </Drawer>
  );
}
