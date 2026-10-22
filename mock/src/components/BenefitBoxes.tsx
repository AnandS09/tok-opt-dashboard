import { useId } from "react";
import { formatBenefitValue } from "../charts/benefits";
import type { BenefitBox } from "../contract";
import "../styles/benefits.css";

interface BenefitBoxesProps {
  boxes: readonly BenefitBox[];
  /** The chart's one-sentence takeaway: the accessible name of the boxes (spec 6.4). */
  caption: string;
  /** True for the boxes whose numbers are money saved, drawn in the saving colour. */
  saved?: boolean;
}

/**
 * The benefit boxes (spec 6.4, 14.3): a ruled row of figures, each a serif
 * number, a short label and the comparator line. The chart's caption sentence
 * stays as the accessible name of the group and is not drawn. With no boxes
 * to show (a chart function failed mid-change, or no candidate survived) the
 * sentence is drawn instead, so the figure never loses its takeaway.
 */
export function BenefitBoxes({ boxes, caption, saved }: BenefitBoxesProps) {
  const captionId = useId();
  if (boxes.length === 0) return <p className="chart-card__caption">{caption}</p>;
  return (
    <div className={saved ? "benefit-boxes benefit-boxes--saved" : "benefit-boxes"} role="group" aria-labelledby={captionId}>
      <p id={captionId} className="sr-only chart-card__caption">
        {caption}
      </p>
      <ul className="benefit-boxes__list">
        {boxes.map((box) => (
          <li key={box.label} className="benefit-box" data-unit={box.unit}>
            <span className="benefit-box__value">{formatBenefitValue(box)}</span>
            <span className="benefit-box__label">{box.label}</span>
            <span className="benefit-box__comparator">{box.comparator}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
