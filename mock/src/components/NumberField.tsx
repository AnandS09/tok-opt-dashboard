import { useState } from "react";

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  /** Whole numbers only: typed fractions are rounded. */
  integer?: boolean;
  onChange: (value: number) => void;
}

/**
 * A number input that lets the user type freely. A value is pushed up as soon
 * as it is inside the range, and clamped when the field loses focus. An
 * untouched field never writes back, so display rounding cannot change a value.
 */
export function NumberField({ id, label, value, min, max, step = 1, prefix, integer = false, onChange }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const commitDraft = () => {
    if (draft !== null && draft !== "") {
      const n = Number(draft);
      if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, integer ? Math.round(n) : n)));
    }
    setDraft(null);
  };

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__control">
        {prefix ? <span className="field__prefix" aria-hidden="true">{prefix}</span> : null}
        <input
          id={id}
          className="input"
          type="number"
          inputMode={integer ? "numeric" : "decimal"}
          min={min}
          max={max}
          step={step}
          value={draft ?? String(value)}
          onChange={(event) => {
            const text = event.target.value;
            setDraft(text);
            const n = integer ? Math.round(Number(text)) : Number(text);
            if (text !== "" && Number.isFinite(n) && n >= min && n <= max) onChange(n);
          }}
          onBlur={commitDraft}
        />
      </div>
    </div>
  );
}
