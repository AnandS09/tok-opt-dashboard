interface FooterProps {
  /** Opens the assumptions and data drawer; absent until there is a result to explain. */
  onOpenAssumptions?: () => void;
}

export function Footer({ onOpenAssumptions }: FooterProps) {
  return (
    <footer className="footer">
      <p>Illustrative figures only. Prices and savings are placeholders, not quotes.</p>
      {onOpenAssumptions ? (
        <button type="button" className="link-button" aria-haspopup="dialog" onClick={onOpenAssumptions}>
          Assumptions and data sources
        </button>
      ) : null}
    </footer>
  );
}
