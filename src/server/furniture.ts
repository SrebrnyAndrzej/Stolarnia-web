import { z } from "zod";
import { AccessError, isWorkshopMember, type Principal } from "./access.js";
import {
  furnitureIssues,
  platePolygon,
  plateThickness,
  plateSpecificationIssues,
  type FurnitureEntry,
} from "../core/furniture.js";
import type { Magazyn } from "../store/store.js";
import { furnitureParts } from "../core/furniture-parts.js";
const mm = z.number().finite().min(1).max(10000);
const coordinate = z.number().finite().min(0).max(10000);
const edge = z
  .object({
    state: z.enum(["unset", "none", "band"]),
    material: z.string().trim().max(120),
    thickness: z.number().finite().min(0.1).max(10),
  })
  .strict();
const specification = z
  .object({
    material: z.string().trim().max(120),
    decor: z.string().trim().max(120),
    face: z.enum(["unset", "xy", "xz", "yz", "slope"]),
    grain: z.enum(["unset", "none", "u", "v"]),
    edges: z.object({ u0: edge, u1: edge, v0: edge, v1: edge }).strict(),
  })
  .strict();
const plate = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(100),
    kind: z.enum(["board", "drawer", "cap"]),
    anchor: z.enum(["left", "right", "bottom", "top", "back"]).optional(),
    x: coordinate,
    y: coordinate,
    z: coordinate,
    width: mm,
    height: mm,
    depth: mm,
    specification: specification.optional(),
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
        construction: z
          .object({
            version: z.literal(1),
            back: z.enum(["none", "applied"]),
            backThickness: z.number().finite().min(1).max(30),
            dimensionMode: z.enum(["unset", "finished", "substrate"]),
            bodyMaterial: z.string().trim().max(120),
            bodyDecor: z.string().trim().max(120),
            frontMaterial: z.string().trim().max(120),
            frontDecor: z.string().trim().max(120),
            backMaterial: z.string().trim().max(120),
            backDecor: z.string().trim().max(120),
            edgeMaterial: z.string().trim().max(120),
            edgeThickness: z.number().finite().min(0.1).max(10),
          })
          .strict()
          .optional(),
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
    data.model.plates.some(
      (p) =>
        p.specification &&
        (p.kind === "cap"
          ? !["unset", "slope"].includes(p.specification.face)
          : p.specification.face === "slope"),
    )
  )
    throw new AccessError(
      400,
      "Płaszczyzna skosu dotyczy wyłącznie wieńca dopasowanego do obrysu.",
    );
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

/** An immutable saved library version for the future technology adapter, never CNC. */
export function furnitureConstruction(
  store: Magazyn,
  person: Principal,
  id: string,
  version: number,
) {
  if (!isWorkshopMember(person))
    throw new AccessError(
      403,
      "Karta konstrukcji jest dostępna dla aktywnego zespołu.",
    );
  const entry = store.odczytaj().furnitureLibrary?.find((e) => e.id === id);
  if (!entry) throw new AccessError(404, "Nie znaleziono modelu w bibliotece.");
  if (!Number.isInteger(version) || version !== entry.version)
    throw new AccessError(
      409,
      "Wersja modelu zmieniła się. Otwórz aktualną wersję z biblioteki przed eksportem.",
    );
  const snapshot = structuredClone(entry);
  return {
    format: "pan-stolarz-construction-draft",
    schemaVersion: 1,
    status: "draft",
    readyForProduction: false,
    unit: "mm",
    libraryId: snapshot.id,
    libraryVersion: snapshot.version,
    savedAt: snapshot.updatedAt,
    model: snapshot.model,
    dimensionSummary: furnitureParts(snapshot.model),
    parts: snapshot.model.plates.map((p) => ({
      id: p.id,
      name: p.name,
      frontPolygon: platePolygon(snapshot.model, p),
      extrusion: { z: p.z, depth: p.depth },
      thickness: plateThickness(snapshot.model, p),
      specification: p.specification ?? null,
      missingMaterialData: plateSpecificationIssues(snapshot.model, p),
    })),
    technologyRequired: [
      "połączenia",
      "bazy obróbki",
      "otwory i rowki",
      "naddatki i obrzeża",
      "okucia",
      "odbiór technologiczny",
    ],
  };
}
