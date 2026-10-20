import { fmtPercent } from "./format";

export interface MixItem {
  key: string;
  label: string;
  value: number;
}

interface MixSlidersProps {
  idPrefix: string;
  items: MixItem[];
  onChange: (key: string, value: number) => void;
}

/** One slider per share. The caller rebalances the others so the shares keep summing to 100%. */
export function MixSliders({ idPrefix, items, onChange }: MixSlidersProps) {
  return (
    <div className="mix">
      {items.map((item) => (
        <div key={item.key} className="slider">
          <label className="slider__label" htmlFor={`${idPrefix}-${item.key}`}>
            {item.label}
          </label>
          <input
            id={`${idPrefix}-${item.key}`}
            className="range"
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(item.value * 100)}
            aria-valuetext={fmtPercent(item.value)}
            onChange={(event) => onChange(item.key, Number(event.target.value) / 100)}
          />
          <output className="slider__value" htmlFor={`${idPrefix}-${item.key}`}>
            {fmtPercent(item.value)}
          </output>
        </div>
      ))}
    </div>
  );
}
