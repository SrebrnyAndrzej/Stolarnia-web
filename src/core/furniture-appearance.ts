import type { FurnitureModel, FurniturePlate } from "./furniture.js";
export const defaultFurnitureAppearance = {
  bodyColor: "#c5ab83",
  frontColor: "#e2d9c8",
};
export const furnitureAppearancePresets = [
  { name: "Jasny zestaw", bodyColor: "#cfba94", frontColor: "#f0efe9" },
  { name: "Grafitowe fronty", bodyColor: "#cfba94", frontColor: "#435058" },
  { name: "Całość jasna", bodyColor: "#e5e7e0", frontColor: "#fafaf5" },
  { name: "Zielone fronty", bodyColor: "#cfba94", frontColor: "#73866b" },
];
export function furniturePlateColor(
  m: FurnitureModel,
  p: Pick<FurniturePlate, "kind">,
) {
  const colors = m.appearance ?? defaultFurnitureAppearance;
  return p.kind === "door" || p.kind === "drawer"
    ? colors.frontColor
    : colors.bodyColor;
}
