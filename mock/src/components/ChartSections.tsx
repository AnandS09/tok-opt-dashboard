import { useState } from "react";
import type { ChartDef, Results } from "../contract";
import { ChartBoundary } from "./ChartBoundary";
import { Drawer } from "./Drawer";

interface ChartSectionsProps {
  slides: ChartDef[];
  results: Results;
}

/** Text of a chart function that may throw while an input is mid-change. */
function attempt(fn: () => string): string {
  try {
    return fn();
  } catch {
    return "";
  }
}

/** The charts stacked one under another, each with its one-sentence takeaway. */
export function ChartSections({ slides, results }: ChartSectionsProps) {
  const [how, setHow] = useState<ChartDef | null>(null);
  return (
    <>
      {slides.map((def) => (
        <section key={def.id} className="chart-card card" aria-labelledby={`chart-${def.id}`}>
          <h2 id={`chart-${def.id}`} className="chart-card__title">
            {def.title}
          </h2>
          <p className="chart-card__caption">{attempt(() => def.caption(results))}</p>
          <ChartBoundary resetKey={results}>
            <def.Component results={results} size="stage" />
          </ChartBoundary>
          <button type="button" className="link-button chart-card__how" aria-haspopup="dialog" onClick={() => setHow(def)}>
            How is this worked out?
          </button>
        </section>
      ))}
      {how ? (
        <Drawer title={how.title} onClose={() => setHow(null)}>
          <p>{how.howComputed}</p>
        </Drawer>
      ) : null}
    </>
  );
}
