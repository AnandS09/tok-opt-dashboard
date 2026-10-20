import type { ScenarioResponse, Tables } from "../contract";
import { isAssumed, understoodItems } from "./describe";

interface UnderstoodStripProps {
  response: ScenarioResponse;
  tables: Tables;
}

/**
 * What was extracted from the prompt, read-only (spec 4.2). It shows the
 * scenario as loaded, not the knobs' current values, so misreads stay visible.
 * Values the prompt did not state are marked "assumed".
 */
export function UnderstoodStrip({ response, tables }: UnderstoodStripProps) {
  const items = understoodItems(response.scenario, tables);
  return (
    <section className="understood card" aria-label="Understood from your prompt">
      <h2 className="understood__title">Understood</h2>
      <ul className="understood__list">
        {items.map((item) => {
          const assumed = isAssumed(item, response.missing);
          return (
            <li key={item.key} className={assumed ? "understood__item understood__item--assumed" : "understood__item"}>
              <span className="understood__label">{item.label}</span> <span>{item.value}</span>
              {assumed ? <span className="tag">assumed</span> : null}
            </li>
          );
        })}
      </ul>
      {response.narrative ? <p className="understood__narrative">{response.narrative}</p> : null}
    </section>
  );
}
