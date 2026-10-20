import type { Tables } from "../contract";
import { priceDates } from "./priceDates";

interface FooterProps {
  tables: Tables | null;
}

export function Footer({ tables }: FooterProps) {
  return (
    <footer className="footer">
      <p className="footer__placeholder">
        All data on this page is invented placeholder data. It is not measured, quoted or taken from any
        vendor, benchmark or price page.
      </p>
      <p className="footer__meta">
        <span>Data version: {tables ? tables.manifest.data_version : "loading"}</span>
        <span>Prices as of: {tables ? priceDates(tables).label : "loading"} (invented placeholder prices)</span>
        {tables ? <span>Generated: {tables.manifest.generated_at}</span> : null}
      </p>
      <p className="footer__legend">
        Every number here is invented. The badges name the kind of source each series would have in the
        real product: no badge for a measured series, or a <span className="badge">modelled</span> or{" "}
        <span className="badge">vendor-reported</span> badge.
      </p>
    </footer>
  );
}
