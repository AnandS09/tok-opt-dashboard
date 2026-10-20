import { EXAMPLES, type Example } from "../store/examples";

interface PromptStripProps {
  activeId: string | null;
  loading: boolean;
  disabled: boolean;
  onPick: (example: Example) => void;
}

/**
 * The prompt strip, locked in the mock (spec 4.2). The example chips load a
 * ready-made scenario file; no language model is involved.
 */
export function PromptStrip({ activeId, loading, disabled, onPick }: PromptStripProps) {
  const active = EXAMPLES.find((e) => e.id === activeId);
  return (
    <section className="prompt card" aria-label="Prompt">
      <label className="prompt__label" htmlFor="prompt-text">
        Your prompt <span className="prompt__locked">(locked in this mock)</span>
      </label>
      <textarea
        id="prompt-text"
        className="prompt__text"
        readOnly
        rows={3}
        value={active?.prompt ?? "Pick an example below to open a scenario."}
      />
      <div className="prompt__chips" role="group" aria-label="Example prompts">
        {EXAMPLES.map((example) => (
          <button
            key={example.id}
            type="button"
            className="chip"
            aria-pressed={example.id === activeId}
            disabled={disabled || loading}
            onClick={() => onPick(example)}
          >
            {example.chip}
          </button>
        ))}
      </div>
      <p className="prompt__note">
        The language step is not wired in this mock. Each example opens a ready-made scenario, and no
        language model is called. {active ? "Adjust the knobs to explore." : ""}
      </p>
    </section>
  );
}
