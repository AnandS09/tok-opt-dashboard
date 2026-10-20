import { useEffect, useRef, type ReactNode } from "react";

interface DrawerProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A right-hand drawer that behaves as a dialog: focus moves in, Tab stays
 * inside, Escape or the backdrop closes it, and focus returns to what opened it.
 */
export function Drawer({ title, onClose, children }: DrawerProps) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      opener?.focus();
    };
  }, []);

  return (
    <div className="drawer">
      <div className="drawer__backdrop" onClick={onClose} />
      <div ref={panel} className="drawer__panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer__head">
          <h2 className="drawer__title">{title}</h2>
          <button type="button" className="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="drawer__body">{children}</div>
      </div>
    </div>
  );
}
