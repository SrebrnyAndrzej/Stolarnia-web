import {
  platePolygon,
  furnitureOutline,
  type FurnitureModel,
  type Point,
} from "./furniture.js";
import { furnitureOpenings } from "./furniture-openings.js";
import { verticalSection } from "./technical-openings.js";

/** Labels match the one-based plate order used by the creator's CSV and DXF. */
export function drawingParts(model: FurnitureModel) {
  return model.plates.flatMap((plate, i) => {
    const polygon = platePolygon(model, plate);
    return polygon.length >= 3 ? [{ plate, polygon, label: `P${i + 1}` }] : [];
  });
}

/** Horizontal clearance at the centre height, rather than a bounding-box width. */
export function drawingOpenings(model: FurnitureModel, limit = Infinity) {
  const { openings, geometry } = furnitureOpenings(model);
  return openings.slice(0, limit).map((o, i) => {
    const probeY = o.y + o.height / 2;
    const section = (polygon: Point[]) =>
      verticalSection(
        polygon.map(([x, y]) => [y, x]),
        probeY,
      );
    const bounds = section(furnitureOutline(model));
    let clearWidth: number | null = null;
    if (bounds) {
      const occupied = geometry
        .map((p) => section(p.polygon))
        .filter((s): s is [number, number] => !!s)
        .sort((a, b) => a[0] - b[0]);
      let left = bounds[0];
      for (const [start, end] of [...occupied, [bounds[1], bounds[1]]]) {
        if (o.probeX > left + 0.001 && o.probeX < start - 0.001) {
          clearWidth = start - left;
          break;
        }
        left = Math.max(left, end);
      }
    }
    return { ...o, label: `O${i + 1}`, probeY, clearWidth };
  });
}

export type AssemblyFace = {
  label: string;
  points: Point[];
  depth: number;
  tone: "front" | "edge";
};
const project = ([x, y, z]: number[]): Point => [
  (Math.sqrt(3) / 2) * (x - z),
  (x + z) / 2 - y,
];

/** Orthographic exploded view of the actual extruded polygons; display offsets are not machining dimensions. */
export function assemblyDrawing(model: FurnitureModel) {
  const gap = Math.max(
    60,
    Math.max(model.width, model.height, model.depth) * 0.12,
  );
  const parts = drawingParts(model).filter(
    (p) => p.plate.kind !== "door" && p.plate.kind !== "drawer",
  );
  const faces: AssemblyFace[] = [];
  const labels = parts.map((part) => {
    const { plate: p, polygon, label } = part;
    const delta: [number, number, number] =
      p.anchor === "left"
        ? [-gap, 0, 0]
        : p.anchor === "right"
          ? [gap, 0, 0]
          : p.anchor === "bottom"
            ? [0, -gap, 0]
            : p.anchor === "back"
              ? [0, 0, -gap]
              : p.kind === "cap" || p.anchor === "top"
                ? [0, gap, 0]
                : [0, 0, 0];
    const vertex = ([x, y]: Point, z: number) => [
      x + delta[0],
      y + delta[1],
      z + delta[2],
    ];
    const add = (vertices: number[][], tone: AssemblyFace["tone"]) =>
      faces.push({
        label,
        points: vertices.map(project),
        depth:
          vertices.reduce((s, v) => s + v[0] + v[1] + v[2], 0) /
          vertices.length,
        tone,
      });
    add(
      polygon.map((q) => vertex(q, p.z + p.depth)),
      "front",
    );
    const area = polygon.reduce((s, a, i) => {
      const b = polygon[(i + 1) % polygon.length];
      return s + a[0] * b[1] - b[0] * a[1];
    }, 0);
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i],
        b = polygon[(i + 1) % polygon.length];
      if (Math.sign(area) * (b[1] - a[1] - (b[0] - a[0])) <= 1e-8) continue;
      add(
        [
          vertex(a, p.z),
          vertex(b, p.z),
          vertex(b, p.z + p.depth),
          vertex(a, p.z + p.depth),
        ],
        "edge",
      );
    }
    const xs = polygon.map((q) => q[0]),
      ys = polygon.map((q) => q[1]);
    const point = project(
      vertex(
        [
          (Math.min(...xs) + Math.max(...xs)) / 2,
          (Math.min(...ys) + Math.max(...ys)) / 2,
        ],
        p.z + p.depth,
      ),
    );
    return { ...part, point };
  });
  faces.sort((a, b) => a.depth - b.depth);
  const points = faces.flatMap((f) => f.points);
  const bounds = points.length
    ? {
        left: Math.min(...points.map((p) => p[0])),
        right: Math.max(...points.map((p) => p[0])),
        top: Math.min(...points.map((p) => p[1])),
        bottom: Math.max(...points.map((p) => p[1])),
      }
    : { left: 0, right: 1, top: 0, bottom: 1 };
  return { faces, parts: labels, bounds };
}
