import type { ScenarioResponse, Stage, Tables } from "../contract";
import { Drawer } from "./Drawer";
import { isAssumed, understoodItems } from "./describe";
import { STAGE_LABEL } from "./format";

interface AssumptionsPanelProps {
  tables: Tables;
  response: ScenarioResponse;
  stage: Stage;
  onClose: () => void;
}

/**
 * Assumptions (spec 9): the defaults that were filled in, how "today" is
 * priced, and how the saving is worked out, in plain words.
 */
export function AssumptionsPanel({ tables, response, stage, onClose }: AssumptionsPanelProps) {
  const assumed = understoodItems(response.scenario, tables).filter((item) =>
    isAssumed(item, response.missing),
  );

  return (
    <Drawer title="Assumptions" onClose={onClose}>
      <section aria-labelledby="panel-assumed">
        <h3 id="panel-assumed">What we filled in for you</h3>
        {assumed.length === 0 ? (
          <p>Every value came from your answers.</p>
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
          Anything your answers did not cover uses a typical value. You can change it under "Fine-tune the
          assumptions".
        </p>
      </section>

      <section aria-labelledby="panel-today">
        <h3 id="panel-today">How "today" is priced</h3>
        <p>
          Today is a typical company buying AI through {STAGE_LABEL[stage].toLowerCase()}, one model for each
          kind of work, at list price
          {stage === "platform" ? ", less the contract discount where its minimum spend is met" : ""}.
        </p>
      </section>

      <section aria-labelledby="panel-saving">
        <h3 id="panel-saving">How the saving is worked out</h3>
        <ul className="panel__list">
          <li>InfraVana buys the same model at the best price on offer.</li>
          <li>
            It moves part of the work to cheaper open models, hosted or on your own hardware, only where they
            meet your minimum quality and response speed.
          </li>
          <li>Every option is assumed to have the capacity you need.</li>
        </ul>
      </section>
    </Drawer>
  );
}
