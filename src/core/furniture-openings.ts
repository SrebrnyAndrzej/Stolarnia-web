import {
  furnitureOutline,
  platePolygon,
  type FurnitureModel,
} from "./furniture.js";
import { technicalOpenings } from "./technical-openings.js";
export function furnitureOpenings(model: FurnitureModel) {
  const structural = model.plates.filter(
    (p) =>
      p.kind !== "door" &&
      p.kind !== "drawer" &&
      p.anchor !== "back" &&
      p.specification?.face !== "xy",
  );
  const geometry = structural.map((p) => ({
    id: p.id,
    polygon: platePolygon(model, p),
    vertical: p.kind === "board" && p.height > p.width,
  }));
  return {
    structural,
    geometry,
    openings: technicalOpenings(furnitureOutline(model), geometry),
  };
}
