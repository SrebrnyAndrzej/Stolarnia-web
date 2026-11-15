import { randomUUID } from "node:crypto";
import { rebuildCompartments } from "../core/furniture-compartments.js";
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
import { furnitureDrawerCalculations } from "../core/furniture-drawers.js";
export { furnitureSave } from "../core/furniture-schema.js";
import { furnitureSave } from "../core/furniture-schema.js";
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
  data.model = rebuildCompartments(data.model, randomUUID);
  const layoutSlots = data.model.plates.flatMap((p) =>
    p.layoutSlot ? [p.layoutSlot] : [],
  );
  if (new Set(layoutSlots).size !== layoutSlots.length)
    throw new AccessError(
      400,
      "Elementy sugerowanego układu muszą mieć różne oznaczenia.",
    );
  const assemblies = data.model.drawerAssemblies ?? [];
  if (
    new Set(assemblies.map((a) => a.frontId)).size !== assemblies.length ||
    assemblies.some(
      (a) =>
        !data.model.plates.some(
          (p) => p.id === a.frontId && p.kind === "drawer",
        ),
    )
  )
    throw new AccessError(
      400,
      "System szuflady musi wskazywać istniejący, niepowtarzający się front.",
    );
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
      drawerCalculations: furnitureDrawerCalculations(data.model),
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
    drawerAssemblies:
      snapshot.drawerCalculations ??
      furnitureDrawerCalculations(snapshot.model),
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
