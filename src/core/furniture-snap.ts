import {
  platePolygon,
  type FurnitureModel,
  type FurniturePlate,
  type Point,
} from "./furniture.js";

export interface FurnitureSnapGuide {
  axis: "x" | "y";
  /** Coordinate of the shared edge in model mm; Y measured from the bottom. */
  position: number;
  targetId?: string;
  targetName: string;
}

interface Candidate extends FurnitureSnapGuide {
  /** Position of the moving plate's origin when this edge is aligned. */
  value: number;
  showGuide?: boolean;
}

const hasEdge = (poly: Point[], axis: "x" | "y", position: number) => {
  const a = axis === "x" ? 0 : 1,
    b = a === 0 ? 1 : 0;
  return poly.some((p, i) => {
    const q = poly[(i + 1) % poly.length];
    return (
      Math.abs(p[a] - position) < 0.001 &&
      Math.abs(q[a] - position) < 0.001 &&
      Math.abs(p[b] - q[b]) > 0.001
    );
  });
};

/** Existing placement rules, with transient display metadata. */
export function furniturePlateSnap(
  m: FurnitureModel,
  p: FurniturePlate,
  x: number,
  y: number,
): { x: number; y: number; guides: FurnitureSnapGuide[] } {
  const near = m.plates.filter(
    (q) => q.id !== p.id && q.z < p.z + p.depth && q.z + q.depth > p.z,
  );
  const axis = (key: "x" | "y", n: number, extent: number, size: number) => {
    const edges = key === "x" ? ["lewa", "prawa"] : ["dolna", "górna"];
    const candidates: Candidate[] = [
      {
        value: 0,
        position: 0,
        targetName: `${edges[0]} krawędź mebla`,
        axis: key,
      },
      {
        value: m.thickness,
        position: m.thickness,
        targetName: `wewnętrzna ${edges[0]} krawędź`,
        axis: key,
      },
      {
        value: extent - m.thickness - size,
        position: extent - m.thickness,
        targetName: `wewnętrzna ${edges[1]} krawędź`,
        axis: key,
        showGuide: key === "x" || m.shape === "rectangle",
      },
      ...near.flatMap((q) => {
        const start = q[key];
        const end = start + (key === "x" ? q.width : q.height);
        const poly = platePolygon(m, q);
        const edge = (
          position: number,
          value: number,
          side: number,
        ): Candidate => ({
          axis: key,
          position,
          value,
          targetId: q.id,
          targetName: `${q.name} · ${edges[side]} krawędź`,
          showGuide: hasEdge(poly, key, position),
        });
        return [
          edge(start, start, 0),
          edge(end, end, 1),
          edge(start, start - size, 0),
          edge(end, end - size, 1),
        ];
      }),
    ];
    // Keep candidate order for ties, the 12 mm edge threshold and 10 mm grid.
    const nearest = candidates.reduce<Candidate | undefined>(
      (best, v) =>
        !best || Math.abs(v.value - n) < Math.abs(best.value - n) ? v : best,
      undefined,
    );
    const hit =
      nearest && Math.abs(nearest.value - n) <= 12 ? nearest : undefined;
    const value = Math.max(
      0,
      Math.min(extent - size, hit?.value ?? Math.round(n / 10) * 10),
    );
    // A clamp must not claim alignment with an edge the plate did not reach.
    const guide: FurnitureSnapGuide | undefined =
      hit && hit.value === value && hit.showGuide !== false
        ? {
            axis: key,
            position: hit.position,
            targetId: hit.targetId,
            targetName: hit.targetName,
          }
        : undefined;
    return { value, guide };
  };
  const sx = axis("x", x, m.width, p.width);
  const sy = axis("y", y, m.height, p.height);
  const poly = platePolygon(m, { ...p, x: sx.value, y: sy.value });
  return {
    x: sx.value,
    y: sy.value,
    guides: [sx.guide, sy.guide].filter(
      (g): g is FurnitureSnapGuide => !!g && hasEdge(poly, g.axis, g.position),
    ),
  };
}

/** Position-only API: display metadata must never be spread into saved plates. */
export function snapFurniturePlate(
  m: FurnitureModel,
  p: FurniturePlate,
  x: number,
  y: number,
) {
  const result = furniturePlateSnap(m, p, x, y);
  return { x: result.x, y: result.y };
}
