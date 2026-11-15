import {
  platePolygon,
  polygonArea,
  type FurnitureModel,
  type FurniturePlate,
} from "./furniture.js";
export type GuidePoint = [number, number, number];
/** Same U/V axes as furniturePartRow: XY=(X,Y), XZ=(X,Z), YZ=(Z,Y). */
export function furnitureFaceGuides(
  model: FurnitureModel,
  plate: FurniturePlate,
) {
  const spec = plate.specification;
  if (!spec || !["xy", "xz", "yz"].includes(spec.face)) return [];
  const polygon = platePolygon(model, plate);
  if (Math.abs(polygonArea(polygon) - plate.width * plate.height) > 0.01)
    return [];
  const u = spec.face === "yz" ? plate.depth : plate.width,
    v = spec.face === "xz" ? plate.depth : plate.height;
  const at = (a: number, b: number): GuidePoint =>
    spec.face === "xy"
      ? [plate.x + a, plate.y + b, plate.z + plate.depth + 0.7]
      : spec.face === "xz"
        ? [plate.x + a, plate.y + plate.height + 0.7, plate.z + b]
        : [plate.x + plate.width + 0.7, plate.y + b, plate.z + a];
  const result: { kind: "band" | "grain"; points: GuidePoint[] }[] = [];
  const ends = {
    u0: [
      [0, 0],
      [0, v],
    ],
    u1: [
      [u, 0],
      [u, v],
    ],
    v0: [
      [0, 0],
      [u, 0],
    ],
    v1: [
      [0, v],
      [u, v],
    ],
  } as const;
  for (const edge of ["u0", "u1", "v0", "v1"] as const)
    if (spec.edges[edge].state === "band")
      result.push({
        kind: "band",
        points: ends[edge].map(([a, b]) => at(a, b)),
      });
  if (spec.grain === "u" || spec.grain === "v") {
    const along = spec.grain === "u",
      a = along ? [u * 0.2, v * 0.5] : [u * 0.5, v * 0.2],
      b = along ? [u * 0.8, v * 0.5] : [u * 0.5, v * 0.8],
      h = Math.min(u, v) * 0.08;
    const wings = along
      ? [
          [b[0] - h, b[1] - h],
          [b[0] - h, b[1] + h],
        ]
      : [
          [b[0] - h, b[1] - h],
          [b[0] + h, b[1] - h],
        ];
    result.push({
      kind: "grain",
      points: [
        at(a[0], a[1]),
        at(b[0], b[1]),
        at(b[0], b[1]),
        at(wings[0][0], wings[0][1]),
        at(b[0], b[1]),
        at(wings[1][0], wings[1][1]),
      ],
    });
  }
  return result;
}
