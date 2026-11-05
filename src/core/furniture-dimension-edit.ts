import {
  resizeFurniture,
  furnitureIssues,
  type FurnitureModel,
} from "./furniture.js";
import {
  compartmentBoxes,
  changeCompartment,
} from "./furniture-compartments.js";
import { furnitureOpenings } from "./furniture-openings.js";
import { furnitureReview } from "./furniture-review.js";
import type { ClearOpening } from "./technical-openings.js";
export type DimensionTarget =
  | { kind: "overall"; axis: "width" | "height" }
  | { kind: "compartment"; id: string }
  | { kind: "opening"; opening: ClearOpening };
export function dimensionDescription(m: FurnitureModel, t: DimensionTarget) {
  if (t.kind === "overall")
    return {
      label: t.axis === "width" ? "Szerokość mebla" : "Wysokość mebla",
      value: m[t.axis],
      locked: false,
    };
  if (t.kind === "opening")
    return {
      label: "Światło między płytami",
      value: t.opening.height,
      locked: false,
    };
  const box = compartmentBoxes(m).boxes.find((b) => b.node.id === t.id),
    parent = m.compartments?.nodes.find((n) =>
      n.split?.children.includes(t.id),
    );
  return {
    label: `${parent?.split?.axis === "x" ? "Szerokość" : "Wysokość"} komory: ${box?.node.name ?? "nieznana"}`,
    value: parent?.split?.axis === "x" ? (box?.width ?? 0) : (box?.height ?? 0),
    locked: box?.node.size !== undefined,
  };
}
/** UI adapter: existing resize/compartment engine, no second construction model. */
export function editFurnitureDimension(
  m: FurnitureModel,
  t: DimensionTarget,
  value: number,
  id: () => string,
  automatic = false,
): FurnitureModel {
  if (!automatic && (!Number.isFinite(value) || value <= 0 || value > 10000))
    throw new Error("Podaj dodatni wymiar do 10 000 mm.");
  let next: FurnitureModel;
  if (t.kind === "overall") {
    if (value < 100)
      throw new Error("Gabaryt mebla musi mieć co najmniej 100 mm.");
    if (t.axis === "height" && m.shape !== "rectangle")
      throw new Error(
        "Dla skosu lub schodów zmień osobno wysokości ścianek w gabarytach.",
      );
    next = resizeFurniture(m, { [t.axis]: value }, id);
  } else if (t.kind === "compartment") {
    const parent = m.compartments?.nodes.find((n) =>
      n.split?.children.includes(t.id),
    );
    if (!parent)
      throw new Error(
        "Komora główna zależy od gabarytów mebla. Wybierz wymiar zewnętrzny.",
      );
    if (!automatic && value < 60)
      throw new Error("Światło komory musi mieć co najmniej 60 mm.");
    next = changeCompartment(
      m,
      t.id,
      { size: automatic ? undefined : value },
      id,
    );
  } else {
    if (m.compartments)
      throw new Error(
        "Ten prześwit pochodzi z wyposażenia komory. Zmień podział komory lub liczbę półek w panelu komór.",
      );
    const o = furnitureOpenings(m).openings.find(
      (o) =>
        Math.abs(o.probeX - t.opening.probeX) < 0.01 &&
        Math.abs(o.y - t.opening.y) < 0.01 &&
        Math.abs(o.height - t.opening.height) < 0.01,
    );
    if (!o)
      throw new Error(
        "Prześwit zmienił się. Zamknij okno i wybierz go ponownie.",
      );
    const candidates = m.plates.filter(
      (p) =>
        !p.anchor &&
        p.kind === "board" &&
        p.height < p.width &&
        p.x <= o.probeX &&
        p.x + p.width >= o.probeX &&
        !p.layoutSlot?.startsWith("compartment/"),
    );
    const upper = candidates.find((p) => Math.abs(p.y - o.y - o.height) < 0.01),
      lower = candidates.find((p) => Math.abs(p.y + p.height - o.y) < 0.01),
      plate = upper ?? lower;
    if (!plate)
      throw new Error(
        "Prześwit jest ograniczony stałymi elementami. Zmień gabaryty lub podział komór.",
      );
    const dy = (value - o.height) * (upper ? 1 : -1);
    next = {
      ...m,
      plates: m.plates.map((p) =>
        p.id === plate.id ? { ...p, y: p.y + dy, layoutCustomized: true } : p,
      ),
    };
    if (
      !furnitureOpenings(next).openings.some(
        (g) =>
          Math.abs(g.probeX - o.probeX) < 0.01 &&
          Math.abs(g.height - value) < 0.01 &&
          Math.abs(g.y - (upper ? o.y : plate.y + dy + plate.height)) < 0.01,
      )
    )
      throw new Error(
        "Ten prześwit nie mieści się między sąsiednimi płytami. Wybierz mniejszy wymiar.",
      );
    const previous = new Set(
      furnitureReview(m).collisions.map((c) => [c.a, c.b].sort().join("/")),
    );
    if (
      furnitureReview(next).collisions.some(
        (c) => !previous.has([c.a, c.b].sort().join("/")),
      )
    )
      throw new Error("Zmiana spowodowałaby kolizję półki z innym elementem.");
  }
  const problems = compartmentBoxes(next).issues;
  if (problems.length) throw new Error(problems[0]);
  const oldIssues = new Set(furnitureIssues(m)),
    issues = furnitureIssues(next).filter((s) => !oldIssues.has(s));
  if (issues.length) throw new Error(issues[0]);
  return next;
}
