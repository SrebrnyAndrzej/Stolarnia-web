export type DrawingPolygon = {
  id: string;
  polygon: [number, number][];
  vertical?: boolean;
};
export type ClearOpening = {
  x: number;
  y: number;
  width: number;
  height: number;
  probeX: number;
};
/** Intersections of real polygons with a vertical measuring line, in mm. */
export function verticalSection(
  polygon: [number, number][],
  x: number,
): [number, number] | null {
  const ys: number[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i],
      b = polygon[(i + 1) % polygon.length];
    if (Math.abs(a[0] - b[0]) < 1e-8) continue;
    if (x >= Math.min(a[0], b[0]) && x <= Math.max(a[0], b[0]))
      ys.push(a[1] + ((x - a[0]) * (b[1] - a[1])) / (b[0] - a[0]));
  }
  return ys.length >= 2 ? [Math.min(...ys), Math.max(...ys)] : null;
}
/** Clear heights, excluding all board thicknesses. Slope measured explicitly at the column centre. */
export function technicalOpenings(
  outline: [number, number][],
  parts: DrawingPolygon[],
): ClearOpening[] {
  const xs = [
    ...new Set([
      ...outline.map((p) => p[0]),
      ...parts
        .filter((p) => p.vertical)
        .flatMap((p) => p.polygon.map((q) => q[0])),
    ]),
  ].sort((a, b) => a - b);
  const result: ClearOpening[] = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const x = xs[i],
      width = xs[i + 1] - x;
    if (width < 0.01) continue;
    const probeX = x + width / 2,
      bounds = verticalSection(outline, probeX);
    if (!bounds) continue;
    const occupied = parts
      .map((p) => verticalSection(p.polygon, probeX))
      .filter((v): v is [number, number] => !!v)
      .map(
        ([a, b]) =>
          [Math.max(bounds[0], a), Math.min(bounds[1], b)] as [number, number],
      )
      .filter(([a, b]) => b > a)
      .sort((a, b) => a[0] - b[0]);
    let bottom = bounds[0];
    for (const [a, b] of [
      ...occupied,
      [bounds[1], bounds[1]] as [number, number],
    ]) {
      if (a - bottom > 0.01)
        result.push({ x, y: bottom, width, height: a - bottom, probeX });
      bottom = Math.max(bottom, b);
    }
  }
  return result;
}
