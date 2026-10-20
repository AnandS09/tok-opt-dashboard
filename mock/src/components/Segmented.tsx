export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface SegmentedProps<T extends string> {
  name: string;
  legend: string;
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  /** Hide the legend visually but keep it for screen readers. */
  hideLegend?: boolean;
}

/** A segmented control built from native radio buttons, so arrow keys work. */
export function Segmented<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
  hideLegend = false,
}: SegmentedProps<T>) {
  return (
    <fieldset className="segmented">
      <legend className={hideLegend ? "sr-only" : "field__label"}>{legend}</legend>
      <div className="segmented__track">
        {options.map((option) => (
          <label key={option.value} className="segmented__option" title={option.hint}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
