import {
  platePolygon,
  polygonArea,
  plateThickness,
  plateSpecificationIssues,
  type FurnitureModel,
  type FurniturePlate,
} from "./furniture.js";

/** Substrate dimensions without machine allowances; unsupported shapes remain explicit. */
export function furniturePartRow(m: FurnitureModel, p: FurniturePlate) {
  const polygon = platePolygon(m, p);
  const xs = polygon.map(([x]) => x),
    ys = polygon.map(([, y]) => y);
  const width = Math.max(...xs) - Math.min(...xs),
    height = Math.max(...ys) - Math.min(...ys);
  const axisRectangle =
    polygon.length >= 4 &&
    Math.abs(polygonArea(polygon) - width * height) < 0.01;
  const face = p.specification?.face;
  const dimensions =
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
      ? null
      : face === "xy"
        ? [width, height]
        : face === "xz" || face === "slope"
          ? [width, p.depth]
          : face === "yz"
            ? [p.depth, height]
            : null;
  const issues = plateSpecificationIssues(m, p);
  if (!axisRectangle)
    issues.push(
      "skos lub obrys nieregularny — indywidualna technologia cięcia",
    );
  if (!m.construction || m.construction.dimensionMode === "unset")
    issues.push("określ, czy geometria opisuje wymiar gotowy czy rdzeń");
  let substrate: number[] | null = null;
  if (axisRectangle && dimensions && !issues.length) {
    const edges = p.specification!.edges;
    const deduction = (k: keyof typeof edges) =>
      edges[k].state === "band" ? edges[k].thickness : 0;
    substrate =
      m.construction!.dimensionMode === "finished"
        ? [
            dimensions[0] - deduction("u0") - deduction("u1"),
            dimensions[1] - deduction("v0") - deduction("v1"),
          ]
        : [...dimensions];
    if (substrate.some((d) => d <= 0)) {
      issues.push("obrzeża przekraczają wymiar części");
      substrate = null;
    }
  }
  return {
    id: p.id,
    name: p.name,
    material: p.specification?.material ?? "",
    decor: p.specification?.decor ?? "",
    thickness: plateThickness(m, p),
    dimensions,
    substrate,
    polygon,
    issues,
  };
}
export const furnitureParts = (m: FurnitureModel) =>
  m.plates.map((p) => furniturePartRow(m, p));
