import type { FurnitureModel } from "./furniture.js";
import { platePolygon } from "./furniture.js";

/** Dimensions in the actual cap's plane, including the offset between bevelled end points. */
export function slopeRoofPanels(m: FurnitureModel) {
  if (m.shape !== "slope" || !slopeCut(m)) return [];
  const angle = Math.atan2(
      (m.reverse ? -1 : 1) * (m.height - m.lowHeight),
      m.width,
    ),
    c = Math.cos(angle),
    s = Math.sin(angle);
  return m.plates
    .filter((p) => p.kind === "cap")
    .flatMap((p) => {
      const polygon = platePolygon(m, p);
      if (polygon.length < 3 || !Number.isFinite(p.depth) || p.depth <= 0)
        return [];
      const points = polygon.map(([x, y]) => ({
        x,
        y,
        u: x * c + y * s,
        n: -x * s + y * c,
      }));
      if (points.some((p) => ![p.u, p.n].every(Number.isFinite))) return [];
      const ns = points.map((p) => p.n),
        us = points.map((p) => p.u),
        maxN = Math.max(...ns);
      const top = points
        .filter((p) => Math.abs(p.n - maxN) < 1e-6)
        .sort((a, b) => a.u - b.u);
      if (top.length < 2) return [];
      const topLength = top[top.length - 1].u - top[0].u,
        blankLength = Math.max(...us) - Math.min(...us),
        thickness = maxN - Math.min(...ns);
      if (topLength <= 0 || thickness <= 0) return [];
      return [
        {
          id: p.id,
          name: p.name,
          topLength,
          blankLength,
          depth: p.depth,
          thickness,
          polygon,
        },
      ];
    });
}

/** Cross-section geometry: outside wall heights; roof between walls; equal board thickness.
 * Saw scale: 0° is a square cut, board broad face flat on table/track support.
 * Equal mitres refer to splitting each INTERNAL corner equally, not half the roof angle.
 */
export function slopeCut(
  m: Pick<FurnitureModel, "width" | "height" | "lowHeight" | "thickness">,
) {
  if (
    ![m.width, m.height, m.lowHeight, m.thickness].every(Number.isFinite) ||
    m.width <= 2 * m.thickness ||
    m.thickness <= 0 ||
    m.lowHeight <= 0 ||
    m.height < m.lowHeight
  )
    return null;
  const rise = m.height - m.lowHeight;
  const radians = Math.atan2(rise, m.width);
  const angle = (radians * 180) / Math.PI;
  const cornerShort = 90 + angle;
  const cornerLong = 90 - angle;
  const fits = (degrees: number) => degrees <= 45 + 1e-9;
  return {
    angle,
    rise,
    cornerShort,
    cornerLong,
    outerSlopeLength: Math.hypot(m.width, rise),
    roofTopEdge: (m.width - 2 * m.thickness) / Math.cos(radians),
    shortOuter: m.lowHeight,
    shortInner: m.lowHeight + m.thickness * Math.tan(radians),
    longOuter: m.height,
    longInner: m.height - m.thickness * Math.tan(radians),
    butt: { degrees: angle, fits: fits(angle) },
    mitreShort: {
      degrees: (180 - cornerShort) / 2,
      fits: fits((180 - cornerShort) / 2),
    },
    mitreLong: {
      degrees: (180 - cornerLong) / 2,
      fits: fits((180 - cornerLong) / 2),
    },
  };
}
