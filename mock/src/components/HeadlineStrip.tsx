import { comparisonOf } from "../charts/comparison";
import { BRAND } from "../charts/labels";
import type { Results } from "../contract";
import { fmtMultiple, fmtPct, fmtUsd, fmtUsdSig } from "../shared/format";

interface HeadlineStripProps {
  results: Results;
  contactUrl: string;
}

/**
 * The hero result (spec 4.2, 6.2): the saving in money first, then the same fact
 * as a percentage and as "more work for the same money". When the budget does
 * not cover the work (spec 5, 10), how much of it the budget covers comes first
 * instead. Work is moved only to models that meet the quality and speed
 * asked for (spec 9).
 */
export function HeadlineStrip({ results, contactUrl }: HeadlineStripProps) {
  const { tokens_multiple, cost_savings_pct } = results.headline;
  const savedPct = Math.round(cost_savings_pct);
  const savedUsd = (results.allocation.total_usd * cost_savings_pct) / 100;
  // One rounding rule (nearest percent), so a shortfall that displays as 100% is not one.
  const { demand_tokens, today_tokens, infravana_tokens } = results.tokens_bought;
  const todayPct = Math.round((today_tokens / demand_tokens) * 100);
  const infravanaPct = Math.min(100, Math.round((infravana_tokens / demand_tokens) * 100));
  const short = todayPct < 100;

  let figure: string;
  if (short) {
    const withUs = infravanaPct < 100 ? `${fmtPct(infravanaPct)} with ${BRAND}` : `all of it with ${BRAND}`;
    figure = `Your ${fmtUsd(results.allocation.budget_usd)} covers ${fmtPct(todayPct)} of this work today, ${withUs}`;
  } else {
    figure = savedPct > 0 ? `${fmtUsdSig(savedUsd)} less each quarter` : "About the same cost as today";
  }

  return (
    <section className="hero card" aria-label="Result">
      {/* Spec 6.1: every InfraVana number names the Today option it is measured against. */}
      <p className="hero__lead">
        {!short && savedPct > 0 ? "For the same AI work, compared" : "Compared"} with {comparisonOf(results).label}
      </p>
      <p className={short || savedPct <= 0 ? "hero__figure" : "hero__figure hero__figure--saving"}>{figure}</p>
      {savedPct > 0 ? (
        <ul className="hero__stats">
          {short ? (
            <li>
              <strong>{fmtUsdSig(savedUsd)}</strong> less to do all of it
            </li>
          ) : null}
          <li>
            <strong>{fmtPct(savedPct)}</strong> lower cost
          </li>
          <li>
            <strong>{fmtMultiple(tokens_multiple)}</strong> the AI work for the same money
          </li>
        </ul>
      ) : null}
      <p className="hero__basis">
        InfraVana moves work only to models that meet your minimum quality and response speed.
      </p>
      <a className="button button--primary" href={contactUrl}>
        Talk to us about your numbers
      </a>
    </section>
  );
}
