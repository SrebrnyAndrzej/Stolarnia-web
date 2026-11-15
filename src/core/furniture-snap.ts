import type { FurnitureModel, FurniturePlate } from "./furniture.js";
export function snapFurniturePlate(
  m: FurnitureModel,
  p: FurniturePlate,
  x: number,
  y: number,
) {
  const near = m.plates.filter(
    (q) => q.id !== p.id && q.z < p.z + p.depth && q.z + q.depth > p.z,
  );
  const choose = (n: number, candidates: number[]) => {
    const nearest = candidates.reduce(
      (best, v) => (Math.abs(v - n) < Math.abs(best - n) ? v : best),
      Infinity,
    );
    return Number.isFinite(nearest) && Math.abs(nearest - n) <= 12
      ? nearest
      : Math.round(n / 10) * 10;
  };
  return {
    x: Math.max(
      0,
      Math.min(
        m.width - p.width,
        choose(x, [
          0,
          m.thickness,
          m.width - m.thickness - p.width,
          ...near.flatMap((q) => [
            q.x,
            q.x + q.width,
            q.x - p.width,
            q.x + q.width - p.width,
          ]),
        ]),
      ),
    ),
    y: Math.max(
      0,
      Math.min(
        m.height - p.height,
        choose(y, [
          0,
          m.thickness,
          m.height - m.thickness - p.height,
          ...near.flatMap((q) => [
            q.y,
            q.y + q.height,
            q.y - p.height,
            q.y + q.height - p.height,
          ]),
        ]),
      ),
    ),
  };
}
