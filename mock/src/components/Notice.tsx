import type { ReactNode } from "react";

interface NoticeProps {
  title: string;
  children?: ReactNode;
  /** `alert` for a failure, `status` for a state that changes as knobs move. */
  role?: "alert" | "status";
  action?: ReactNode;
}

/** The amber notice family of the design tokens: state banners, chrome only. */
export function Notice({ title, children, role = "status", action }: NoticeProps) {
  return (
    <div className="notice" role={role}>
      <svg className="notice__icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M8 1.5 15 14H1L8 1.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 6v4M8 11.6v.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div className="notice__body">
        <p className="notice__title">{title}</p>
        {children ? <div className="notice__text">{children}</div> : null}
      </div>
      {action ? <div className="notice__action">{action}</div> : null}
    </div>
  );
}
