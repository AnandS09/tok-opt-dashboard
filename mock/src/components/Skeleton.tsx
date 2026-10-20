/** Loading state: a skeleton of the dashboard (spec 10). */
export function Skeleton({ label }: { label: string }) {
  return (
    <div className="skeleton" role="status" aria-live="polite">
      <p className="skeleton__label">{label}</p>
      <div className="skeleton__block skeleton__block--tall" />
      <div className="skeleton__block" />
    </div>
  );
}
