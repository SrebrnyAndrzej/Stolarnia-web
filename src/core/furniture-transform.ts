import {
  furnitureIssues,
  platePolygon,
  type FurnitureModel,
} from "./furniture.js";
import { furnitureReview } from "./furniture-review.js";
export type FurnitureTransform =
  | "duplicate"
  | "align-x"
  | "align-y"
  | "space-x"
  | "space-y"
  | "equal-x"
  | "equal-y";
export function transformFurnitureParts(
  model: FurnitureModel,
  ids: string[],
  operation: FurnitureTransform,
  offset: number,
  uid: () => string,
): FurnitureModel {
  const picked = model.plates.filter((p) => ids.includes(p.id));
  if (!picked.length) throw new Error("Zaznacz części na liście.");
  const equal = operation === "equal-x" || operation === "equal-y";
  if (!equal && (!Number.isFinite(offset) || offset < 1 || offset > 10000))
    throw new Error("Podaj odstęp 1–10000 mm.");
  if (
    picked.some(
      (p) =>
        p.anchor ||
        p.kind === "cap" ||
        p.layoutSlot?.startsWith("compartment/"),
    )
  )
    throw new Error(
      "Części korpusu i komór zmieniaj przez gabaryty lub układ komór.",
    );
  if (operation !== "duplicate" && picked.length < 2)
    throw new Error("Zaznacz co najmniej dwie części.");
  if (equal && picked.length < 3)
    throw new Error(
      "Do równych świateł zaznacz co najmniej trzy części. Skrajne pozostaną na miejscu.",
    );
  const next = structuredClone(model);
  if (operation === "duplicate") {
    if (next.plates.length + picked.length > 150)
      throw new Error("Maksymalnie 150 części w modelu.");
    next.plates.push(
      ...picked.map((p) => ({
        ...structuredClone(p),
        id: uid(),
        name: `${p.name.slice(0, 85)} — kopia`,
        y: p.y + offset,
        layoutSlot: undefined,
        layoutCustomized: undefined,
      })),
    );
  } else {
    const axis = operation.endsWith("x") ? "x" : "y";
    const sorted = [...picked].sort((a, b) => a[axis] - b[axis]);
    const origin = sorted[0][axis];
    const dimension = axis === "x" ? "width" : "height";
    let gap = 0;
    if (equal) {
      for (const p of sorted) {
        const poly = platePolygon(model, p);
        const area =
          Math.abs(
            poly.reduce((sum, a, i) => {
              const b = poly[(i + 1) % poly.length];
              return sum + a[0] * b[1] - b[0] * a[1];
            }, 0),
          ) / 2;
        if (Math.abs(area - p.width * p.height) > 0.01)
          throw new Error(
            "Równe światła wymagają pełnych prostokątnych części. Element pod skosem zmieniaj w układzie komór.",
          );
      }
      const last = sorted[sorted.length - 1];
      const span = last[axis] + last[dimension] - origin;
      gap =
        (span - sorted.reduce((sum, p) => sum + p[dimension], 0)) /
        (sorted.length - 1);
      if (gap < -1e-8)
        throw new Error(
          "Brakuje miejsca na równe światła między zaznaczonymi częściami.",
        );
      gap = Math.max(0, gap);
    }
    const positions = sorted.map((p, i) =>
      i === 0 || i === sorted.length - 1
        ? p[axis]
        : origin +
          sorted.slice(0, i).reduce((sum, q) => sum + q[dimension], 0) +
          i * gap,
    );
    next.plates = next.plates.map((p) => {
      const index = sorted.findIndex((q) => q.id === p.id);
      return index < 0
        ? p
        : {
            ...p,
            [axis]: equal
              ? positions[index]
              : operation.startsWith("align")
                ? origin
                : origin + index * offset,
            layoutCustomized: p.layoutSlot ? true : p.layoutCustomized,
          };
    });
  }
  if (picked.some((p) => p.kind === "drawer")) next.drawerFit = "fixed";
  if (equal) {
    for (const p of next.plates.filter((p) => ids.includes(p.id))) {
      const poly = platePolygon(next, p);
      const area =
        Math.abs(
          poly.reduce((sum, a, i) => {
            const b = poly[(i + 1) % poly.length];
            return sum + a[0] * b[1] - b[0] * a[1];
          }, 0),
        ) / 2;
      if (Math.abs(area - p.width * p.height) > 0.01)
        throw new Error(
          "Rozstaw przyciąłby część do skosu lub obrysu. Zmień skrajne pozycje.",
        );
    }
  }
  const issues = furnitureIssues(next);
  if (issues.length) throw new Error(issues[0]);
  const existing = new Set(
    furnitureReview(model).collisions.map((c) => [c.a, c.b].sort().join("/")),
  );
  if (
    furnitureReview(next).collisions.some(
      (c) => !existing.has([c.a, c.b].sort().join("/")),
    )
  )
    throw new Error(
      "Operacja spowodowałaby nowe przecięcie obwiedni części. Zmień odstęp lub wybór.",
    );
  return next;
}
