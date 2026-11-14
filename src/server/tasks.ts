import { z } from "zod";
import { AccessError, type Principal } from "./access.js";
export const taskCreate = z
  .object({
    operation_id: z.string().uuid(),
    project_id: z.string().min(1).max(80),
    assignee_id: z.string().uuid(),
    title: z.string().trim().min(2).max(160),
  })
  .strict();
export const taskUpdate = z
  .object({
    version: z.number().int().positive(),
    status: z.enum(["todo", "working", "paused", "done"]),
  })
  .strict();
export function requireWorkshop(person: Principal) {
  if (!person.active || !["owner", "employee"].includes(person.role))
    throw new AccessError(403, "Nie masz dostępu do zadań warsztatu.");
}
export function taskFailure(message: string): never {
  if (message.includes("task_conflict"))
    throw new AccessError(
      409,
      "Zadanie zmieniło się. Odśwież listę przed kolejną zmianą.",
    );
  if (message.includes("task_forbidden"))
    throw new AccessError(403, "Nie masz dostępu do tego zadania.");
  if (message.includes("task_assignee"))
    throw new AccessError(
      400,
      "Wybierz aktywnego pracownika przypisanego do projektu.",
    );
  if (message.includes("task_transition") || message.includes("task_status"))
    throw new AccessError(
      400,
      "Niedozwolona zmiana stanu zadania. Odśwież listę.",
    );
  throw new AccessError(
    503,
    "Nie udało się zapisać zadania. Odśwież listę, aby sprawdzić wynik.",
  );
}
