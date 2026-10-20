import { useEffect, useRef, useState } from "react";
import type { ChartDef, Results } from "../contract";
import { ChartBoundary } from "./ChartBoundary";

interface LazyThumbProps {
  def: ChartDef;
  results: Results;
}

/**
 * A live, non-interactive thumbnail (spec 4.1). The chart is only mounted
 * while the thumbnail is in view, inside a box of fixed size.
 */
export function LazyThumb({ def, results }: LazyThumbProps) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = box.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) setVisible(entry.isIntersecting);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Chart = def.Component;
  return (
    <div ref={box} className="thumb__chart" aria-hidden="true">
      {visible ? (
        <ChartBoundary resetKey={results}>
          <Chart results={results} size="thumb" />
        </ChartBoundary>
      ) : null}
    </div>
  );
}
