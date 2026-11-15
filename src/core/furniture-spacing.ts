import type { FurnitureModel } from "./furniture.js";
/** Existing shelves only: equal clear openings, never a guessed support or drawer clearance. */
export function shelfSpacing(
  model: FurnitureModel,
  selected: string,
): {
  ids: string[];
  positions: number[];
  clearance: number;
  issue: string | null;
} {
  const fail = (issue: string) => ({
    ids: [],
    positions: [],
    clearance: 0,
    issue,
  });
  const shelf = model.plates.find((p) => p.id === selected);
  if (model.compartments)
    return fail("Rozstaw półek w komorze zmieniaj w wyposażeniu komory.");
  if (model.shape !== "rectangle")
    return fail(
      "Dla skosu i schodów rozstaw ustaw w komorach lub polach pozycji.",
    );
  if (
    !shelf ||
    shelf.anchor ||
    shelf.kind !== "board" ||
    shelf.width <= shelf.height ||
    shelf.specification?.face === "yz"
  )
    return fail("Wybierz poziomą półkę wewnątrz korpusu.");
  const equal = (a: number, b: number) => Math.abs(a - b) < 0.01;
  const shelves = model.plates
    .filter(
      (p) =>
        !p.anchor &&
        p.kind === "board" &&
        equal(p.x, shelf.x) &&
        equal(p.width, shelf.width) &&
        equal(p.z, shelf.z) &&
        equal(p.depth, shelf.depth) &&
        p.width > p.height,
    )
    .sort((a, b) => a.y - b.y || a.id.localeCompare(b.id));
  if (shelves.length < 2)
    return fail(
      "Dodaj co najmniej dwie półki o tym samym położeniu X, szerokości i głębokości.",
    );
  const bottom = model.plates.find((p) => p.anchor === "bottom"),
    top = model.plates.find((p) => p.anchor === "top" || p.kind === "cap");
  if (!bottom || !top)
    return fail("Do rozstawienia potrzebne są dolny i górny wieniec.");
  const lo = bottom.y + bottom.height,
    hi = top.y;
  if (
    shelf.x < model.thickness ||
    shelf.x + shelf.width > model.width - model.thickness ||
    shelves.some((p) => p.z < 0 || p.z + p.depth > model.depth)
  )
    return fail("Półki muszą mieścić się między bokami korpusu.");
  const ids = new Set(shelves.map((p) => p.id));
  if (
    model.plates.some(
      (p) =>
        !ids.has(p.id) &&
        !p.anchor &&
        p.kind !== "cap" &&
        p.kind !== "door" &&
        p.x < shelf.x + shelf.width - 0.01 &&
        p.x + p.width > shelf.x + 0.01 &&
        p.z < shelf.z + shelf.depth &&
        p.z + p.depth > shelf.z &&
        p.y < hi &&
        p.y + p.height > lo,
    )
  )
    return fail(
      "W tej przestrzeni są inne elementy lub szuflady. Użyj komór, aby rozdzielić wyposażenie.",
    );
  const clearance =
    (hi - lo - shelves.reduce((n, p) => n + p.height, 0)) /
    (shelves.length + 1);
  if (!Number.isFinite(clearance) || clearance < 1)
    return fail("Brakuje miejsca na równe prześwity między półkami.");
  let y = lo;
  const positions = shelves.map((p) => {
    y += clearance;
    const pos = y;
    y += p.height;
    return pos;
  });
  return { ids: shelves.map((p) => p.id), positions, clearance, issue: null };
}
export function applyShelfSpacing(
  model: FurnitureModel,
  selected: string,
): FurnitureModel {
  const result = shelfSpacing(model, selected);
  if (result.issue) return model;
  const positions = new Map(
    result.ids.map((id, i) => [id, result.positions[i]]),
  );
  return {
    ...model,
    plates: model.plates.map((p) =>
      positions.has(p.id)
        ? { ...p, y: positions.get(p.id)!, layoutCustomized: true }
        : p,
    ),
  };
}
