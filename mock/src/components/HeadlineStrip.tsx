import { PROVENANCE_TEXT, worstProvenance } from "../charts/format";
import type { Results, Scenario, Tables } from "../contract";
import { Favours } from "./Favours";
import { fmtMultiple, fmtPct } from "../shared/format";
import { LATENCY_LABEL } from "./format";

interface HeadlineStripProps {
  results: Results;
  scenario: Scenario;
  tables: Tables;
}

/**
 * The pinned headline strip (spec 4.1): the numbers people screenshot. The
 * quality floor and latency target both sides share are stated next to it
 * (spec 9).
 */
export function HeadlineStrip({ results, scenario, tables }: HeadlineStripProps) {
  const { tokens_multiple, cost_savings_pct } = results.headline;
  // Decide marker and sign from the numbers as displayed, so "0% cost" never carries a check mark.
  const tokensShown = Math.round(tokens_multiple * 10) / 10;
  const moreTokens = tokensShown > 1;
  const savedPct = Math.round(cost_savings_pct);
  const saves = savedPct > 0;
  const costSign = savedPct > 0 ? "\u2212" : savedPct < 0 ? "+" : "";
  const floors = Object.entries(results.quality_floor_by_workload)
    .filter(([id]) => (scenario.workload_mix[id] ?? 0) > 0)
    .map(([, floor]) => floor);
  const floorText =
    floors.length === 0
      ? "its own quality floor"
      : Math.min(...floors) === Math.max(...floors)
        ? `a quality floor of ${floors[0]}`
        : `quality floors of ${Math.min(...floors)} to ${Math.max(...floors)}`;
  const provenance = worstProvenance([
    results.allocation.provenance.today,
    results.allocation.provenance.infravana,
    results.tokens_bought.provenance.today,
    results.tokens_bought.provenance.infravana,
  ]);
  const latency = tables.manifest.parameters.latency_classes[scenario.latency_class];

  return (
    <section className="headline" aria-label="Headline">
      <p className="headline__lead">Same budget</p>
      <p className="headline__numbers">
        <span className="headline__figure">
          <Favours favoursInfravana={moreTokens} noChange={tokensShown === 1}>
            {fmtMultiple(tokens_multiple)} tokens
          </Favours>
        </span>
        <span className="headline__divider" aria-hidden="true">|</span>
        <span className="headline__figure">
          <Favours favoursInfravana={saves} noChange={savedPct === 0}>
            {costSign}
            {fmtPct(Math.abs(cost_savings_pct))} cost
          </Favours>
        </span>
        {provenance !== "measured" ? <span className="badge">{PROVENANCE_TEXT[provenance]}</span> : null}
      </p>
      <p className="headline__basis">
        With InfraVana against today. Both sides use {floorText} and the{" "}
        {LATENCY_LABEL[scenario.latency_class].toLowerCase()} latency target
        {latency
          ? ` (at least ${latency.min_tok_s_per_user} tokens per second per user${
              latency.max_p95_ttft_ms === null ? "" : `, first token within ${latency.max_p95_ttft_ms} ms`
            })`
          : ""}
        .
      </p>
    </section>
  );
}

