import { useEffect, useRef, useState } from "react";
import { init, use } from "echarts/core";
import type { ECharts, EChartsCoreOption } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { readTokens } from "./tokens";
import type { Tokens } from "./tokens";

use([CanvasRenderer]);

/** Pixel size of the chart area, passed to the option builder for label fitting. */
export interface Dims {
  width: number;
  height: number;
}

export type OptionBuilder = (tokens: Tokens, dims: Dims) => EChartsCoreOption;

/**
 * Owns one ECharts instance for the lifetime of the component: creates it on
 * mount, redraws when `build` changes or the container is resized, and
 * disposes it on unmount. Tokens are read at every draw, so a token change
 * shows at the next redraw.
 *
 * Returns the element ref to attach to the chart container and an error
 * message when the chart could not be drawn (for example, missing tokens).
 */
export function useEChart(build: OptionBuilder) {
  const ref = useRef<HTMLDivElement>(null);
  const buildRef = useRef(build);
  const drawRef = useRef<(() => void) | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chart: ECharts = init(el, undefined, { renderer: "canvas" });
    let lastWidth = -1;
    const draw = () => {
      try {
        chart.setOption(
          buildRef.current(readTokens(), { width: chart.getWidth(), height: chart.getHeight() }),
          { notMerge: true },
        );
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "The chart could not be drawn.");
      }
    };
    drawRef.current = draw;
    const observer = new ResizeObserver(() => {
      chart.resize();
      // Labels are fitted to the width, so redraw when it changes.
      if (chart.getWidth() !== lastWidth) {
        lastWidth = chart.getWidth();
        draw();
      }
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      drawRef.current = null;
      chart.dispose();
    };
  }, []);

  useEffect(() => {
    buildRef.current = build;
    drawRef.current?.();
  }, [build]);

  return { ref, error };
}
