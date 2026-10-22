/** Loading state: a skeleton of the dashboard (spec A.5, the v0.2 prompt states of section 10). */
export function Skeleton({ label }: { label: string }) {
  return (
    <div className="skeleton" role="status" aria-live="polite">
      <p className="skeleton__label">{label}</p>
      <div className="skeleton__block skeleton__block--tall" />
      <div className="skeleton__block" />
    </div>
  );
}
