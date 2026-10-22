interface FooterProps {
  /** Opens the assumptions and data drawer; absent until there is a result to explain. */
  onOpenAssumptions?: () => void;
  /** True while invented proprietary speed or batch-price rows are loaded (spec 9, 12 BD-11). */
  inventedSpeed?: boolean;
}

export function Footer({ onOpenAssumptions, inventedSpeed = false }: FooterProps) {
  return (
    <footer className="footer">
      <p>
        Illustrative figures only. Prices and savings are placeholders, not quotes.
        {inventedSpeed ? " The speed and batch-price rows behind the give-up tab are invented placeholder data." : ""}
      </p>
      {onOpenAssumptions ? (
        <button type="button" className="link-button" aria-haspopup="dialog" onClick={onOpenAssumptions}>
          Assumptions
        </button>
      ) : null}
    </footer>
  );
}
