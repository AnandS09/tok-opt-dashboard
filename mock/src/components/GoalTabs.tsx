import { useRef, type KeyboardEvent } from "react";
import "../styles/goals.css";
import type { GoalId } from "../contract";
import { GOAL_ORDER, GOAL_TABS, PLACEHOLDER_TAG, tabForKey, type TabFigure } from "../store/goal";

/** Id of a tab, so the hero it controls can name it as its label. */
export const goalTabId = (goal: GoalId): string => `goal-tab-${goal}`;
/** Id of the panel the tabs control: the hero. */
export const GOAL_PANEL_ID = "goal-panel";

/** The line over the tab bar (spec 15.6). */
export const GOAL_KICKER = "What matters most to you?";

interface GoalTabsProps {
  active: GoalId;
  /** The figure each tab shows under its name; every goal has one up front. */
  figures: Record<GoalId, TabFigure>;
  onSelect: (goal: GoalId) => void;
}

/**
 * The goal tab bar (spec 6.2, 15.6): four equal tabs, each one a button with
 * `role="tab"` that shows its goal's name and, under it, its goal's figure.
 * The chosen tab is joined to the result panel below (the panel is the hero,
 * see `HeadlineStrip`). All four tabs are always enabled. Left and right
 * arrows move to the next tab (wrapping), Home and End go to the first and
 * last, and focus moves with the choice. Only the active tab is in the tab
 * order. Under 600px the figures are hidden and each tab shows its short name.
 */
export function GoalTabs({ active, figures, onSelect }: GoalTabsProps) {
  const list = useRef<HTMLDivElement>(null);

  const move = (to: GoalId) => {
    onSelect(to);
    list.current?.querySelector<HTMLElement>(`#${goalTabId(to)}`)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const to = tabForKey(active, event.key);
    if (to === null) return;
    event.preventDefault();
    if (to !== active) move(to);
  };

  return (
    <div className="goal-tabs" data-active={active}>
      <p className="goal-tabs__kicker">{GOAL_KICKER}</p>
      <div ref={list} className="goal-tabs__list" role="tablist" aria-label="What matters most to you" onKeyDown={onKeyDown}>
        {GOAL_ORDER.map((id) => {
          const figure = figures[id];
          const selected = id === active;
          return (
            <button
              key={id}
              id={goalTabId(id)}
              type="button"
              role="tab"
              className="goal-tabs__tab"
              aria-selected={selected}
              aria-controls={GOAL_PANEL_ID}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(id)}
            >
              <span className="goal-tabs__label">
                <span className="goal-tabs__long">{GOAL_TABS[id].label}</span>
                <span className="goal-tabs__short">{GOAL_TABS[id].short}</span>
              </span>
              <span
                className="goal-tabs__figure"
                data-stale={figure.stale ? "true" : undefined}
                data-pending={figure.pending ? "true" : undefined}
              >
                {figure.text}
                {figure.placeholder ? (
                  <>
                    {" "}
                    <span className="goal-tabs__flag">{PLACEHOLDER_TAG}</span>
                  </>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
