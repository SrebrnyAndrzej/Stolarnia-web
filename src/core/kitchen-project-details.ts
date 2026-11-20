import { z } from "zod";

/** Customer declarations remain tied to the dimensions/features they were checked against. */
export const kitchenProjectDetailsSchema = z
  .object({
    measurementKey: z.string().max(12000).optional(),
    measured: z
      .array(z.enum(["walls", "height", "openings", "services"]))
      .max(4)
      .default([]),
    budget: z.number().int().min(1000).max(500000).optional(),
    objects: z
      .array(
        z.object({
          id: z.string().uuid(),
          name: z.string().trim().min(1).max(100),
          width: z.number().int().min(10).max(2000),
          height: z.number().int().min(10).max(2000),
          depth: z.number().int().min(10).max(2000),
          cabinetId: z.string().uuid().optional(),
        }),
      )
      .max(20)
      .default([]),
  })
  .optional();
export type KitchenProjectDetails = NonNullable<
  z.infer<typeof kitchenProjectDetailsSchema>
>;
export function kitchenMeasurementKey(d: {
  layout: string;
  width: number;
  depth: number;
  height: number;
  returnLength?: number;
  features?: unknown[];
}) {
  return JSON.stringify([
    d.layout,
    d.width,
    d.depth,
    d.returnLength,
    d.height,
    d.features ?? [],
  ]);
}
export const kitchenMeasurementLabels = {
  walls: "Długości ścian i przekątne",
  height: "Wysokość i poziom podłogi",
  openings: "Okna, drzwi i kierunki otwierania",
  services: "Woda, odpływ, prąd i wentylacja",
} as const;
