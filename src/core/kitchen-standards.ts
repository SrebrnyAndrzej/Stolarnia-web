import { z } from "zod";
import type { ModulKatalogowy } from "./types.js";

export const kitchenStandardsSchema = z.object({
  plinth: z.number().int().min(80).max(200),
  baseHeight: z.union([z.literal(720), z.literal(800)]),
  upperBottom: z.number().int().min(1300).max(2000),
});
export type KitchenStandards = z.infer<typeof kitchenStandardsSchema>;
export const defaultKitchenStandards: KitchenStandards = {
  plinth: 100,
  baseHeight: 720,
  upperBottom: 1400,
};
export function isStandardBase(
  m: Pick<ModulKatalogowy, "construction" | "category">,
) {
  return (
    m.category === "base" ||
    ["sink", "oven", "dishwasherFront", "blindCorner"].includes(m.construction)
  );
}
