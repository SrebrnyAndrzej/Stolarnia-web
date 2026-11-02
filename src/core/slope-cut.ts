import type { FurnitureModel } from "./furniture.js";

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
