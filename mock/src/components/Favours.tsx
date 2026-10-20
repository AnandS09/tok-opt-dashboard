import type { ReactNode } from "react";

interface FavoursProps {
  /** True when the number favours Infravana: shows the check mark and accent colour. */
  favoursInfravana: boolean;
  /** True when there is no change at all. */
  noChange?: boolean;
  children: ReactNode;
}

/**
 * The one "favours Infravana" marker of the design tokens: a check mark
 * before the number, plus hidden text, whatever the direction of the number.
 */
export function Favours({ favoursInfravana, noChange = false, children }: FavoursProps) {
  return (
    <span className={favoursInfravana ? "favours favours--infravana" : "favours"}>
      {favoursInfravana ? (
        <svg className="favours__check" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M1.5 6.5 4.5 9.5 10.5 2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
      {children}
      <span className="sr-only">
        {favoursInfravana ? " (favours InfraVana)" : noChange ? " (no change)" : " (favours today)"}
      </span>
    </span>
  );
}
