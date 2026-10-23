/**
 * Development page, not part of the app (the app never imports it): mounts the
 * grid view alone, at a tile count and a container width taken from the
 * address, so `scripts/check-stage-render.mjs` can measure the balanced-grid
 * rule (spec 15.13) for counts the product does not produce yet (4, 5, 6, 7, 9).
 *
 *   gridHarness.html?n=7&w=1040
 *
 * `n` is the number of tiles (the first n of the listing), `w` the content
 * width in pixels of the box the grid sits in. The charts are the real
 * components drawn from the real fixtures.
 */
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { chartRegistry } from "../../registry";
import { compute } from "../../../compute";
import type { Results } from "../../../contract";
import { GridView } from "../../../components/GridView";
import { listCharts } from "../../../store/chartListing";
import { loadScenario, loadTables } from "../../../data/load";
import "../../../styles/tokens.css";
import "../../../styles/app.css";
import "../../../styles/stage.css";

// The page is served from a nested folder of the build, the data from its root.
const DATA_URL = "/data/";

function Harness() {
  const params = new URLSearchParams(window.location.search);
  const count = Number(params.get("n") ?? "10");
  const width = Number(params.get("w") ?? "1040");
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    (async () => {
      const tables = await loadTables(DATA_URL);
      const loaded = await loadScenario(DATA_URL, "s1");
      if (loaded.verdict === "ok") setResults(compute(loaded.scenario, tables));
    })().catch((error: unknown) => {
      document.title = `error: ${String(error)}`;
    });
  }, []);

  if (!results) return <p>Loading</p>;
  const charts = listCharts(chartRegistry, chartRegistry).slice(0, count);
  return (
    <div className="stage" id="harness-box" style={{ width }}>
      <GridView
        charts={charts}
        slides={chartRegistry}
        results={results}
        goalView={{ goal: "G1", solve: null, stale: false, error: null }}
        active={0}
        onPick={() => {}}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Harness />);
