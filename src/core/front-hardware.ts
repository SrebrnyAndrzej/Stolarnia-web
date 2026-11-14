import { z } from "zod";
import {
  platePolygon,
  polygonArea,
  type FurnitureModel,
  type FurniturePlate,
} from "./furniture.js";
const positive = z.number().finite().positive().max(10000);
const nonnegative = z.number().finite().min(0).max(10000);
export const frontHardwareSchema = z
  .object({
    kgPerM2: z.number().finite().min(0).max(100),
    mirrorKgPerM2: z.number().finite().min(0).max(100),
    hinges: z
      .object({
        count: z.number().int().min(2).max(8),
        side: z.enum(["left", "right"]),
        axis: positive,
        bottom: positive,
        top: positive,
        diameter: positive.max(100),
        depth: positive.max(100),
        clearance: nonnegative.max(200),
        source: z.string().trim().max(160),
      })
      .strict()
      .optional(),
    handle: z
      .object({
        x: nonnegative,
        y: nonnegative,
        pitch: nonnegative.max(2000),
        vertical: z.boolean(),
        diameter: positive.max(50),
        source: z.string().trim().max(160),
      })
      .strict()
      .optional(),
  })
  .strict();
export type FrontHardware = z.infer<typeof frontHardwareSchema>;
export interface FrontHole {
  kind: "hinge" | "handle";
  x: number;
  y: number;
  diameter: number;
  depth: number;
}
/** Front elevation coordinates. Machining is from the rear, never drill a mirror. */
export function frontHardware(model: FurnitureModel, plate: FurniturePlate) {
  const plan = plate.frontHardware;
  const issues: string[] = [],
    warnings: string[] = [],
    holes: FrontHole[] = [];
  const mass = plan
    ? ((plate.width * plate.height) / 1e6) * (plan.kgPerM2 + plan.mirrorKgPerM2)
    : null;
  if (!plan) return { holes, issues, warnings, mass };
  if (
    !["door", "drawer"].includes(plate.kind) ||
    Math.abs(
      polygonArea(platePolygon(model, plate)) - plate.width * plate.height,
    ) > 0.01 ||
    plate.depth > 100
  )
    issues.push(
      "Plan obsługuje pełny prostokątny front o grubości do 100 mm. Skosy wymagają osobnej technologii.",
    );
  if (plan.hinges) {
    const h = plan.hinges;
    if (plate.kind !== "door")
      issues.push("Zawiasy można planować wyłącznie na drzwiach.");
    if (h.bottom + h.top >= plate.height)
      issues.push("Odległości skrajnych zawiasów nie mieszczą się na froncie.");
    if (!h.source)
      warnings.push(
        "Zawiasy: uzupełnij model okucia i odniesienie do jego instrukcji.",
      );
    for (let i = 0; i < h.count; i++) {
      const y =
        h.bottom + (i * (plate.height - h.bottom - h.top)) / (h.count - 1);
      holes.push({
        kind: "hinge",
        x: h.side === "left" ? h.axis : plate.width - h.axis,
        y,
        diameter: h.diameter,
        depth: h.depth,
      });
      const shelves = model.plates.filter(
        (p) =>
          p.id !== plate.id &&
          p.kind === "board" &&
          p.height <= 100 &&
          p.depth > plate.depth &&
          p.x <
            plate.x +
              (h.side === "left" ? h.axis : plate.width - h.axis) +
              h.diameter / 2 +
              h.clearance &&
          p.x + p.width >
            plate.x +
              (h.side === "left" ? h.axis : plate.width - h.axis) -
              h.diameter / 2 -
              h.clearance &&
          p.z < plate.z &&
          p.z + p.depth > 0 &&
          p.y < plate.y + y + h.diameter / 2 + h.clearance &&
          p.y + p.height > plate.y + y - h.diameter / 2 - h.clearance,
      );
      if (shelves.length)
        warnings.push(
          `Zawias ${i + 1}: strefa kontrolna przecina półkę „${shelves[0].name}”. Sprawdź puszkę i ramię okucia.`,
        );
    }
  }
  if (plan.handle) {
    const h = plan.handle;
    if (!h.source)
      warnings.push("Uchwyt: uzupełnij model i rozstaw z instrukcji.");
    for (const delta of h.pitch === 0 ? [0] : [-h.pitch / 2, h.pitch / 2])
      holes.push({
        kind: "handle",
        x: h.x + (h.vertical ? 0 : delta),
        y: h.y + (h.vertical ? delta : 0),
        diameter: h.diameter,
        depth: plate.depth,
      });
  }
  for (const h of holes) {
    const r = h.diameter / 2;
    if (
      h.x - r < 0 ||
      h.x + r > plate.width ||
      h.y - r < 0 ||
      h.y + r > plate.height
    )
      issues.push(
        "Otwór lub jego obwód wychodzi poza front. Popraw pozycję, rozstaw lub średnicę.",
      );
    if (h.depth > plate.depth || (h.kind === "hinge" && h.depth >= plate.depth))
      issues.push(
        "Puszka wymaga głębokości mniejszej od grubości frontu. Popraw dane wiercenia.",
      );
  }
  for (let i = 0; i < holes.length; i++)
    for (let j = i + 1; j < holes.length; j++)
      if (
        Math.hypot(holes[i].x - holes[j].x, holes[i].y - holes[j].y) <
        (holes[i].diameter + holes[j].diameter) / 2
      )
        issues.push("Otwory nakładają się. Zmień ich pozycje lub rozstaw.");
  return {
    holes: issues.length ? [] : holes,
    issues: [...new Set(issues)],
    warnings: [...new Set(warnings)],
    mass,
  };
}
