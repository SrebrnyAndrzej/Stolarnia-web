import { kitchenLockProblem } from "../../../../src/core/kitchen-locks";
import { isUpper, layoutIssues, type Draft } from "./model";

/** A swap stays on its wall and tier and is committed only if all geometry and locks remain valid. */
export function planKitchenMove(
  draft: Draft,
  id: string,
  delta: -1 | 1,
): Draft {
  const index = draft.items.findIndex((i) => i.id === id);
  if (index < 0) throw new Error("Wybierz szafkę w bieżącym projekcie.");
  const item = draft.items[index];
  const peers = draft.items.filter(
    (i) =>
      i.wall === item.wall && isUpper(i.catalogId) === isUpper(item.catalogId),
  );
  const target = peers[peers.findIndex((i) => i.id === id) + delta];
  if (!target) return draft;
  const items = [...draft.items];
  const targetIndex = items.findIndex((i) => i.id === target.id);
  [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
  const next = { ...draft, items };
  const problem = kitchenLockProblem(draft, next) || layoutIssues(next)[0];
  if (problem) throw new Error(problem);
  return next;
}
