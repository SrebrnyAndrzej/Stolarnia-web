import { z } from "zod";

export const kitchenStorageLabels = {
  cutlery: "Sztućce i przybory",
  dishes: "Talerze i szklanki",
  cookware: "Garnki i patelnie",
  pantry: "Zapasy żywności",
  appliances: "Małe AGD",
  recycling: "Segregacja odpadów",
} as const;
export const kitchenPriorityLabels = {
  balanced: "Równowaga",
  storage: "Wygodne przechowywanie",
  worktop: "Więcej blatu do pracy",
  economy: "Prostsze wyposażenie",
} as const;
export const kitchenNeedsSchema = z.object({
  household: z.enum(["unknown", "1-2", "3-4", "5+"]).default("unknown"),
  cooking: z
    .enum(["unknown", "occasional", "daily", "enthusiast"])
    .default("unknown"),
  storage: z
    .array(
      z.enum([
        "cutlery",
        "dishes",
        "cookware",
        "pantry",
        "appliances",
        "recycling",
      ]),
    )
    .max(6)
    .default([])
    .refine(
      (items) => new Set(items).size === items.length,
      "Wybierz każdą potrzebę tylko raz.",
    ),
  priority: z
    .enum(["balanced", "storage", "worktop", "economy"])
    .default("balanced"),
});
export type KitchenNeeds = z.infer<typeof kitchenNeedsSchema>;
export type KitchenStorage = KitchenNeeds["storage"][number];

export function kitchenNeedsBrief(needs: KitchenNeeds) {
  return [
    `Domownicy: ${needs.household === "unknown" ? "do ustalenia" : needs.household}.`,
    `Gotowanie: ${{ unknown: "do ustalenia", occasional: "od czasu do czasu", daily: "codziennie", enthusiast: "często i dużo" }[needs.cooking]}.`,
    `Priorytet: ${kitchenPriorityLabels[needs.priority]}.`,
    `Do przechowywania: ${needs.storage.length ? needs.storage.map((s) => kitchenStorageLabels[s]).join(", ") : "do ustalenia"}.`,
  ].join(" ");
}
