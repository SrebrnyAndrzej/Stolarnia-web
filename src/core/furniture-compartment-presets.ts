import type { FurnitureModel } from "./furniture.js";
import {
  changeCompartment,
  copyCompartment,
  compartmentIssues,
  type CompartmentNode,
} from "./furniture-compartments.js";
export const compartmentPresets = [
  {
    id: "open",
    label: "Otwarta komora",
    patch: { interior: "open", front: "none" },
  },
  {
    id: "shelves",
    label: "3 półki",
    patch: { interior: "shelves", count: 3, front: "none" },
  },
  {
    id: "drawers",
    label: "3 szuflady",
    patch: { interior: "drawers", count: 3, front: "drawers" },
  },
  {
    id: "door",
    label: "Półki i drzwi",
    patch: { interior: "shelves", count: 3, front: "door" },
  },
  {
    id: "pair",
    label: "Półki i para drzwi",
    patch: { interior: "shelves", count: 3, front: "pair" },
  },
] as const;
export function adjacentCompartment(m: FurnitureModel, id: string) {
  const parent = m.compartments?.nodes.find((n) =>
    n.split?.children.includes(id),
  );
  const children = parent?.split?.children ?? [];
  const at = children.indexOf(id);
  return [children[at + 1], children[at - 1]]
    .map((key) => m.compartments?.nodes.find((n) => n.id === key && !n.split))
    .find(Boolean);
}
function resetCustomizations(m: FurnitureModel, id: string): FurnitureModel {
  return {
    ...m,
    plates: m.plates.map((p) =>
      p.layoutSlot?.startsWith(`compartment/${id}/`)
        ? { ...p, layoutCustomized: undefined }
        : p,
    ),
  };
}
function checked(before: FurnitureModel, next: FurnitureModel) {
  const old = new Set(compartmentIssues(before)),
    issues = compartmentIssues(next).filter((s) => !old.has(s));
  if (issues.length) throw new Error(issues[0]);
  return next;
}
export function applyCompartmentPreset(
  m: FurnitureModel,
  id: string,
  preset: string,
  uid: () => string,
) {
  const node = m.compartments?.nodes.find((n) => n.id === id);
  const item = compartmentPresets.find((p) => p.id === preset);
  if (!node || node.split || !item)
    throw new Error("Wybierz komorę bez podziału.");
  return checked(
    m,
    changeCompartment(
      resetCustomizations(m, id),
      id,
      item.patch as Partial<CompartmentNode>,
      uid,
    ),
  );
}
export function copyToAdjacent(
  m: FurnitureModel,
  id: string,
  uid: () => string,
) {
  const to = adjacentCompartment(m, id);
  if (!to) throw new Error("Brak sąsiedniej komory bez podziału.");
  return checked(
    m,
    copyCompartment(resetCustomizations(m, to.id), id, to.id, uid),
  );
}
