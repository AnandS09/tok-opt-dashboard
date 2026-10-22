import { useRef, type KeyboardEvent } from "react";
import "../styles/goals.css";
import type { GoalId } from "../contract";
import { GOAL_ORDER, GOAL_TABS, type GoalTabState } from "../store/goal";

/** Id of a tab, so the hero it controls can name it as its label. */
export const goalTabId = (goal: GoalId): string => `goal-tab-${goal}`;
/** Id of the panel the tabs control: the hero. */
export const GOAL_PANEL_ID = "goal-panel";

interface GoalTabsProps {
  active: GoalId;
  states: Record<GoalId, GoalTabState>;
  onSelect: (goal: GoalId) => void;
}

/**
 * The goal tabs (spec 6.2): a tablist of the four goals, each one a button
 * with `role="tab"`. Left and right arrows move to the next tab that can be
 * chosen (wrapping), Home and End go to the first and last, and focus moves
 * with the choice. Only the active tab is in the tab order. A tab that cannot
 * be chosen is disabled and its one-line reason is printed under the tabs,
 * where a screen reader reaches it right after the list.
 */
export function GoalTabs({ active, states, onSelect }: GoalTabsProps) {
  const list = useRef<HTMLDivElement>(null);
  const enabled = GOAL_ORDER.filter((id) => !states[id].disabled);
  const disabled = GOAL_ORDER.filter((id) => states[id].disabled);

  const move = (to: GoalId) => {
    onSelect(to);
    list.current?.querySelector<HTMLElement>(`#${goalTabId(to)}`)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const at = enabled.indexOf(active);
    let to: GoalId | undefined;
    if (event.key === "ArrowRight") to = enabled[(at + 1) % enabled.length];
    else if (event.key === "ArrowLeft") to = enabled[(at - 1 + enabled.length) % enabled.length];
    else if (event.key === "Home") to = enabled[0];
    else if (event.key === "End") to = enabled[enabled.length - 1];
    if (to === undefined) return;
    event.preventDefault();
    if (to !== active) move(to);
  };

  return (
    <div className="goal-tabs" data-active={active}>
      <div ref={list} className="goal-tabs__list" role="tablist" aria-label="What matters most to you" onKeyDown={onKeyDown}>
        {GOAL_ORDER.map((id) => {
          const state = states[id];
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
              aria-describedby={state.disabled ? `${goalTabId(id)}-reason` : undefined}
              tabIndex={selected ? 0 : -1}
              disabled={state.disabled}
              onClick={() => onSelect(id)}
            >
              {GOAL_TABS[id].label}
            </button>
          );
        })}
      </div>
      {disabled.length > 0 ? (
        <ul className="goal-tabs__reasons">
          {disabled.map((id) => (
            <li key={id} id={`${goalTabId(id)}-reason`}>
              <span className="goal-tabs__reason-name">{GOAL_TABS[id].label}:</span> {states[id].reason}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
