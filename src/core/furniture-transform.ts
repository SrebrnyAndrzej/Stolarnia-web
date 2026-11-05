import { furnitureIssues, type FurnitureModel } from "./furniture.js";
import { furnitureReview } from "./furniture-review.js";
export function transformFurnitureParts(
  model: FurnitureModel,
  ids: string[],
  operation: "duplicate" | "align-x" | "align-y" | "space-x" | "space-y",
  offset: number,
  uid: () => string,
): FurnitureModel {
  const picked = model.plates.filter((p) => ids.includes(p.id));
  if (!picked.length) throw new Error("Zaznacz części na liście.");
  if (!Number.isFinite(offset) || offset < 1 || offset > 10000)
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
    next.plates = next.plates.map((p) => {
      const index = sorted.findIndex((q) => q.id === p.id);
      return index < 0
        ? p
        : {
            ...p,
            [axis]: operation.startsWith("align")
              ? origin
              : origin + index * offset,
            layoutCustomized: p.layoutSlot ? true : p.layoutCustomized,
          };
    });
  }
  if (picked.some((p) => p.kind === "drawer")) next.drawerFit = "fixed";
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
