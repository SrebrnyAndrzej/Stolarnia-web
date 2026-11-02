import { z } from "zod";
import { AccessError, isWorkshopMember, type Principal } from "./access.js";
import { furnitureIssues, type FurnitureEntry } from "../core/furniture.js";
import type { Magazyn } from "../store/store.js";
const mm = z.number().finite().min(1).max(10000);
const coordinate = z.number().finite().min(0).max(10000);
const plate = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(100),
    kind: z.enum(["board", "drawer", "cap"]),
    anchor: z.enum(["left", "right", "bottom", "top"]).optional(),
    x: coordinate,
    y: coordinate,
    z: coordinate,
    width: mm,
    height: mm,
    depth: mm,
  })
  .strict();
export const furnitureSave = z
  .object({
    id: z.string().uuid(),
    version: z.number().int().min(0),
    model: z
      .object({
        name: z.string().trim().min(2).max(100),
        width: mm.min(100),
        height: mm.min(100),
        depth: mm.min(100),
        thickness: mm.max(100),
        shape: z.enum(["rectangle", "slope", "stairs"]),
        lowHeight: mm,
        steps: z.number().int().min(2).max(20),
        reverse: z.boolean(),
        plates: z.array(plate).min(1).max(150),
      })
      .strict(),
  })
  .strict();
export function saveFurniture(
  store: Magazyn,
  person: Principal,
  input: unknown,
): FurnitureEntry {
  if (!isWorkshopMember(person))
    throw new AccessError(
      403,
      "Biblioteka jest dostępna dla aktywnego zespołu.",
    );
  const result = furnitureSave.safeParse(input);
  if (!result.success)
    throw new AccessError(
      400,
      "Sprawdź nazwę, wymiary i płyty mebla. Dopuszczalne wymiary: 1–10000 mm, maksymalnie 150 płyt.",
    );
  const data = result.data;
  if (
    new Set(data.model.plates.map((p) => p.id)).size !==
    data.model.plates.length
  )
    throw new AccessError(400, "Płyty muszą mieć różne identyfikatory.");
  const issues = furnitureIssues(data.model);
  if (issues.length) throw new AccessError(400, issues[0]);
  return store.zmien((db) => {
    const entries = (db.furnitureLibrary ??= []);
    const previous = entries.find((e) => e.id === data.id);
    if ((previous?.version ?? 0) !== data.version)
      throw new AccessError(
        409,
        "Ten model został zmieniony przez inną osobę. Szkic pozostał w edytorze. Zapisz kopię lub ponownie otwórz model z biblioteki.",
      );
    const next: FurnitureEntry = {
      ...data,
      version: data.version + 1,
      createdBy: previous?.createdBy ?? person.user_id,
      updatedBy: person.user_id,
      updatedAt: new Date().toISOString(),
    };
    if (previous) entries[entries.indexOf(previous)] = next;
    else entries.push(next);
    return next;
  });
}
