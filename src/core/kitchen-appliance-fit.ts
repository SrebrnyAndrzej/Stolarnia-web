import { z } from "zod";
import type { Modul, UstawieniaKonstrukcyjne } from "./types.js";
import { niszaSlupka } from "./builder.js";
import { USTAWIENIA_DOMYSLNE } from "./settings.js";

export const kitchenApplianceSchema = z.object({
  model: z
    .string()
    .trim()
    .min(2, "Podaj model urządzenia z karty producenta.")
    .max(160),
  width: z.number().int().min(100).max(1500),
  height: z.number().int().min(100).max(2500),
  depth: z.number().int().min(100).max(1000),
  source: z
    .string()
    .trim()
    .max(500)
    .regex(/^https:\/\//, "Link do karty musi zaczynać się od https://.")
    .optional(),
  ventilationChecked: z.boolean().default(false),
});
export type KitchenAppliance = z.infer<typeof kitchenApplianceSchema>;

/** Clear space between panel faces, not the outer dimensions or a nominal catalogue label. */
export function kitchenApplianceFit(
  m: Modul,
  appliance: KitchenAppliance,
  k: UstawieniaKonstrukcyjne = USTAWIENIA_DOMYSLNE.konstrukcja,
) {
  const t = k.gruboscPlytyKorpusuMM;
  const niche = niszaSlupka(m);
  const supported = [
    "oven",
    "ovenTower",
    "refrigerator",
    "dishwasherFront",
  ].includes(m.konstrukcja);
  const available = {
    width:
      m.konstrukcja === "dishwasherFront"
        ? m.szerokoscMM
        : m.szerokoscMM - 2 * t,
    height: niche
      ? niche.wys
      : m.konstrukcja === "oven"
        ? m.wysokoscMM - t - Math.max(t, m.wysokoscMM - 595)
        : m.konstrukcja === "dishwasherFront"
          ? m.wysokoscMM + m.pozycjaYMM
          : m.wysokoscMM - 2 * t,
    depth:
      m.glebokoscMM -
      (m.konfiguracja.plecy ? k.odsunieciePlecMM + k.gruboscPlecHDFMM : 0),
  };
  const names = { width: "szerokość", height: "wysokość", depth: "głębokość" };
  const issues = !supported
    ? [
        "Ten typ zabudowy wymaga indywidualnego sprawdzenia otworu i wentylacji.",
      ]
    : (Object.keys(available) as (keyof typeof available)[]).flatMap((key) =>
        appliance[key] > available[key]
          ? [
              `${names[key]} niszy: dostępne ${available[key]} mm, model ${appliance.model} wymaga co najmniej ${appliance[key]} mm.`,
            ]
          : [],
      );
  return {
    available,
    issues,
    status: !supported
      ? "unverified"
      : issues.length
        ? "blocked"
        : appliance.ventilationChecked
          ? "minimum-fits"
          : "ventilation-needed",
  } as const;
}
