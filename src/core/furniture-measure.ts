import {
  platePolygon,
  polygonArea,
  type FurnitureModel,
  type Point,
} from "./furniture.js";
export type MeasurePoint = [number, number, number];
const epsilon = 1e-8;
const cross = (a: Point, b: Point) => a[0] * b[1] - a[1] * b[0];
const minus = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function projection(p: Point, a: Point, b: Point): Point {
  const d = minus(b, a),
    length = d[0] ** 2 + d[1] ** 2;
  const t = length
    ? Math.max(
        0,
        Math.min(1, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / length),
      )
    : 0;
  return [a[0] + t * d[0], a[1] + t * d[1]];
}
function inside(p: Point, poly: Point[]) {
  let result = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (distance(p, projection(p, poly[j], poly[i])) < epsilon) return true;
    const a = poly[i],
      b = poly[j];
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      result = !result;
  }
  return result;
}
function nearestPolygons(a: Point[], b: Point[]): [Point, Point] {
  for (const p of a) if (inside(p, b)) return [p, p];
  for (const p of b) if (inside(p, a)) return [p, p];
  const all = [...a, ...b];
  const center: Point = [
    all.reduce((sum, p) => sum + p[0], 0) / all.length,
    all.reduce((sum, p) => sum + p[1], 0) / all.length,
  ];
  const score = (p: Point, q: Point) =>
    distance([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], center);
  let nearest: [Point, Point] = [a[0], b[0]],
    best = Infinity;
  const consider = (p: Point, q: Point) => {
    const d = distance(p, q);
    if (
      d < best - epsilon ||
      (Math.abs(d - best) < epsilon && score(p, q) < score(...nearest))
    ) {
      best = d;
      nearest = [p, q];
    }
  };
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b.length; j++) {
      const p = a[i],
        p2 = a[(i + 1) % a.length],
        q = b[j],
        q2 = b[(j + 1) % b.length];
      const r = minus(p2, p),
        s = minus(q2, q),
        div = cross(r, s),
        delta = minus(q, p);
      if (Math.abs(div) > epsilon) {
        const t = cross(delta, s) / div,
          u = cross(delta, r) / div;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
          const hit: Point = [p[0] + t * r[0], p[1] + t * r[1]];
          return [hit, hit];
        }
      }
      const pm: Point = [(p[0] + p2[0]) / 2, (p[1] + p2[1]) / 2],
        qm: Point = [(q[0] + q2[0]) / 2, (q[1] + q2[1]) / 2];
      consider(pm, projection(pm, q, q2));
      consider(projection(qm, p, p2), qm);
      consider(p, projection(p, q, q2));
      consider(p2, projection(p2, q, q2));
      consider(projection(q, p, p2), q);
      consider(projection(q2, p, p2), q2);
    }
  return nearest;
}
function axis(a0: number, a1: number, b0: number, b1: number) {
  return {
    gap: Math.max(0, Math.max(a0, b0) - Math.min(a1, b1)),
    overlap: Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)),
  };
}
/** Minimum distance between closed, assembled polygon extrusions, not AABB diagonals. */
export function measureFurnitureParts(model: FurnitureModel, ids: string[]) {
  const wanted = new Set(ids);
  const selected = model.plates.filter((p) => wanted.has(p.id));
  if (selected.length !== 2) return null;
  const [a, b] = selected,
    pa = platePolygon(model, a),
    pb = platePolygon(model, b);
  if (
    pa.length < 3 ||
    pb.length < 3 ||
    polygonArea(pa) <= epsilon ||
    polygonArea(pb) <= epsilon ||
    a.depth <= 0 ||
    b.depth <= 0
  )
    return null;
  const [p, q] = nearestPolygons(pa, pb);
  const za =
    a.z + a.depth < b.z
      ? a.z + a.depth
      : b.z + b.depth < a.z
        ? a.z
        : Math.max(a.z, b.z);
  const zb =
    a.z + a.depth < b.z ? b.z : b.z + b.depth < a.z ? b.z + b.depth : za;
  const bounds = (poly: Point[], index: 0 | 1) =>
    [
      Math.min(...poly.map((p) => p[index])),
      Math.max(...poly.map((p) => p[index])),
    ] as const;
  const ax = bounds(pa, 0),
    bx = bounds(pb, 0),
    ay = bounds(pa, 1),
    by = bounds(pb, 1);
  return {
    names: [a.name, b.name],
    ids: [a.id, b.id],
    from: [...p, za] as MeasurePoint,
    to: [...q, zb] as MeasurePoint,
    distance: Math.hypot(distance(p, q), za - zb),
    axes: {
      x: axis(...ax, ...bx),
      y: axis(...ay, ...by),
      z: axis(a.z, a.z + a.depth, b.z, b.z + b.depth),
    },
    shaped: model.shape !== "rectangle" || pa.length !== 4 || pb.length !== 4,
  };
}
