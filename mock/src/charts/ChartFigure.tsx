import type { CSSProperties, ComponentProps } from "react";
import { ChartFrame } from "./ChartFrame";
import { ProvenanceNotes } from "./ProvenanceNotes";
import type { ProvenancePart } from "./ProvenanceNotes";

type FrameProps = ComponentProps<typeof ChartFrame>;

interface ChartFigureProps extends FrameProps {
  /** Where each drawn series comes from, for the "Where these numbers come from" table. */
  parts: ProvenancePart[];
  /** True when the chart draws the invented speed or batch rows (BD-11). */
  invented?: boolean;
  /** Stage height in pixels, for a chart with more rows than the default height holds. */
  height?: number;
  /** Stage height under 600px wide, where labels wrap and take more room. Defaults to `height`. */
  phoneHeight?: number;
}

/**
 * A chart with its "Where these numbers come from" disclosure and source line: the frame every
 * comparison chart renders. The height overrides the stage height token for
 * this chart only: compare.css redefines the custom property the frame reads.
 */
export function ChartFigure({ parts, invented, height, phoneHeight, ...frame }: ChartFigureProps) {
  const style = height
    ? ({ "--figure-height": `${height}px`, "--figure-height-phone": `${phoneHeight ?? height}px` } as CSSProperties)
    : undefined;
  return (
    <div className={height ? "chart-figure" : undefined} style={style}>
      <ChartFrame {...frame} />
      <ProvenanceNotes size={frame.size} parts={parts} invented={invented} />
    </div>
  );
}
