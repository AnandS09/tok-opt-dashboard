import { useId } from "react";
import "../styles/goals.css";
import type { TradeoffLevel, TradeoffView } from "../contract";
import { floorsText } from "../store/tradeoff";
import { LATENCY_LABEL } from "./format";

/** Why the quality control cannot move: no lower score exists for this work in the data. */
export const NO_LOWER_QUALITY_REASON = "No lower quality level is offered for this work.";

interface TradeoffControlsProps {
  view: TradeoffView;
  onSteps: (steps: { qualityStep?: number; speedStep?: number }) => void;
}

interface StepControlProps {
  legend: string;
  hint: string;
  levels: readonly TradeoffLevel[];
  step: number;
  label: (level: TradeoffLevel) => string;
  onChange: (step: number) => void;
  /** Why the control cannot be used, or null. */
  reason: string | null;
}

/**
 * One stepped control: a radio per position, step 0 first and marked as the
 * visitor's own. Native radios give the arrow keys; a control that cannot be
 * used is disabled and prints its reason, which its group is described by.
 */
function StepControl({ legend, hint, levels, step, label, onChange, reason }: StepControlProps) {
  const id = useId();
  const disabled = reason !== null;
  return (
    <fieldset className="steps" disabled={disabled} aria-describedby={`${id}-note`}>
      <legend className="steps__legend">{legend}</legend>
      <div className="steps__track" role="presentation">
        {levels.map((level) => (
          <label key={level.step} className="steps__option">
            <input
              type="radio"
              name={id}
              value={level.step}
              checked={level.step === step}
              onChange={() => onChange(level.step)}
            />
            <span>{label(level)}</span>
            {level.step === 0 ? <span className="steps__own">yours</span> : null}
          </label>
        ))}
      </div>
      <p id={`${id}-note`} className="steps__note">
        {disabled ? reason : hint}
      </p>
    </fieldset>
  );
}

/**
 * The two separate stepped controls of G4 (spec 6.2): a quality step and a
 * speed step. Each steps one position down from the visitor's own setting,
 * and the speed step is disabled, with its reason, when no proprietary offer
 * has speed data (spec 6.3, 10).
 */
export function TradeoffControls({ view, onSteps }: TradeoffControlsProps) {
  const qualityReason = view.qualityLevels.length > 1 ? null : NO_LOWER_QUALITY_REASON;
  const speedReason = view.speedReason ?? (view.speedLevels.length > 1 ? null : "Your own speed is already the slowest one offered.");
  return (
    <div className="tradeoff">
      <StepControl
        legend="Quality: lowest score you will accept"
        hint="Each step down lets open models with a lower benchmark score do the work."
        levels={view.qualityLevels}
        step={view.qualityStep}
        label={(level) => floorsText(level.floors)}
        onChange={(qualityStep) => onSteps({ qualityStep })}
        reason={qualityReason}
      />
      <StepControl
        legend="Speed: how soon you need answers"
        hint="Each step down lets work run on slower, cheaper prices and hardware."
        levels={view.speedLevels}
        step={view.speedStep}
        label={(level) => LATENCY_LABEL[level.latency_class]}
        onChange={(speedStep) => onSteps({ speedStep })}
        reason={speedReason}
      />
    </div>
  );
}
