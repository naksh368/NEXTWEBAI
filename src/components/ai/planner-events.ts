/**
 * A tiny event bridge so any part of the page (the map, a button, a package
 * card) can open the floating AI trip planner, optionally with a question
 * already typed in. The planner widget listens for this event.
 */
export const PLANNER_EVENT = "jst:open-planner";

export type PlannerEventDetail = { prompt?: string };

export function openPlanner(prompt?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PlannerEventDetail>(PLANNER_EVENT, { detail: { prompt } }));
}
