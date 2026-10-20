import type { Results } from "../contract";
import { fmtMultiple, fmtPct, fmtUsdSig } from "../shared/format";

interface HeadlineStripProps {
  results: Results;
  contactUrl: string;
}

/**
 * The hero result (spec 4.1): the saving in money first, then the same fact
 * as a percentage and as "more work for the same budget". Both sides use the
 * same quality and speed settings (spec 9).
 */
export function HeadlineStrip({ results, contactUrl }: HeadlineStripProps) {
  const { tokens_multiple, cost_savings_pct } = results.headline;
  const savedPct = Math.round(cost_savings_pct);
  const savedUsd = (results.allocation.total_usd * cost_savings_pct) / 100;
  const budget = fmtUsdSig(results.allocation.budget_usd);

  return (
    <section className="hero card" aria-label="Result">
      {savedPct > 0 ? (
        <>
          <p className="hero__lead">For the same AI work</p>
          <p className="hero__figure">{fmtUsdSig(savedUsd)} less each quarter</p>
          <ul className="hero__stats">
            <li>
              <strong>{fmtPct(savedPct)}</strong> lower cost
            </li>
            <li>
              <strong>{fmtMultiple(tokens_multiple)}</strong> the AI work for the same {budget}
            </li>
          </ul>
        </>
      ) : (
        <p className="hero__figure">About the same cost as today</p>
      )}
      <p className="hero__basis">Same quality and response speed on both sides.</p>
      <a className="button button--primary" href={contactUrl}>
        Talk to us about your numbers
      </a>
    </section>
  );
}
