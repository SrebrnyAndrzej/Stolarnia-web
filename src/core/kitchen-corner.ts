import {
  kitchenIssues,
  kitchenModules,
  kitchenOuterBounds,
  type KitchenGeometryInput,
  type KitchenItem,
} from "./kitchen-configuration.js";

/** Existing catalog construction: rectangular blind corner, door to the left, blind part at the turn. */
export function addKitchenBlindCorner(
  d: KitchenGeometryInput,
  wall: "a" | "b",
  id: () => string,
): KitchenItem[] {
  const nextWall =
    wall === "a" && (d.layout === "l" || d.layout === "u")
      ? "b"
      : wall === "b" && d.layout === "u"
        ? "c"
        : null;
  if (!nextWall) throw new Error("Wybierz zakręt w układzie L lub U.");
  const modules = kitchenModules(d),
    length = wall === "a" ? d.width : d.depth,
    start = length - 1100;
  const affected = modules.filter(
    (m) =>
      m.scianaId === wall &&
      m.pozycjaYMM < 1000 &&
      kitchenOuterBounds(m).end > start,
  );
  if (
    affected.some(
      (m) =>
        !["shelves", "drawers", "filler"].includes(m.konstrukcja) ||
        m.kategoria === "tall" ||
        m.konfiguracja.obudowaZewnetrzna,
    )
  )
    throw new Error(
      "W ostatnich 110 cm jest AGD, słupek lub obudowa. Przestaw te elementy przed dodaniem narożnika; nie zmieniamy ich automatycznie.",
    );
  if (
    modules.some(
      (m) =>
        m.scianaId === nextWall &&
        m.pozycjaYMM < 1000 &&
        m.glebokoscMM +
          20 +
          (m.konfiguracja.obudowaZewnetrzna?.wysuniecieMM ?? 0) >
          650,
    )
  )
    throw new Error(
      "Głęboka obudowa sąsiedniej ściany zajmuje dostęp do narożnika. Zmień jej głębokość lub wysunięcie.",
    );
  let items = d.items.filter((i) => !affected.some((m) => m.id === i.id));
  const first = affected.sort((a, b) => a.pozycjaXMM - b.pozycjaXMM)[0];
  if (first && start - first.pozycjaXMM >= 20) {
    const old = d.items.find((i) => i.id === first.id)!,
      width = start - first.pozycjaXMM;
    items.push({
      ...old,
      width,
      ...(width < 200
        ? {
            catalogId: "base-filler-50",
            drawers: undefined,
            drawerFronts: undefined,
            shelves: undefined,
          }
        : {}),
    });
  }
  const end = Math.max(
    d.layout !== "straight" && wall !== "a" ? 650 : 0,
    ...kitchenModules({ ...d, items })
      .filter((m) => m.scianaId === wall && m.pozycjaYMM < 1000)
      .map((m) => kitchenOuterBounds(m).end),
  );
  if (start < end) throw new Error("Brakuje miejsca na narożnik 110 cm.");
  items.push({
    id: id(),
    catalogId: "base-blind-corner-1100",
    wall,
    gapBefore: start - end,
    height: first?.wysokoscMM ?? 720,
    depth: 560,
  });
  const issues = kitchenIssues({ ...d, items });
  if (
    items.length > 24 ||
    new Set(items.map((i) => i.id)).size !== items.length
  )
    throw new Error(
      "Szkic mieści maksymalnie 24 różne elementy. Zwolnij miejsce przed dodaniem narożnika.",
    );
  if (issues.length) throw new Error(issues[0]);
  return items;
}
