import { z } from "zod";
import {kitchenWallLength, type KitchenLayout} from "./kitchen-layout.js";
import type { Modul } from "./types.js";

export const kitchenFeatureSchema = z
  .object({
    id: z.string().uuid(),
    kind: z.enum(["window", "door", "water", "drain", "power"]),
    wall: z.enum(["a", "b", "c"]),
    x: z.number().int().min(0).max(8000),
    width: z.number().int().min(0).max(4000),
    bottom: z.number().int().min(0).max(3500),
    height: z.number().int().min(0).max(3500),
  })
  .superRefine((f, ctx) => {
    if (
      ["window", "door"].includes(f.kind) &&
      (f.width < 200 || f.height < 200)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Okno lub drzwi muszą mieć szerokość i wysokość co najmniej 200 mm.",
      });
    if (f.kind === "door" && f.bottom !== 0)
      ctx.addIssue({
        code: "custom",
        message: "Drzwi zaczynają się przy podłodze.",
      });
    if (
      !["window", "door"].includes(f.kind) &&
      (f.width !== 0 || f.height !== 0)
    )
      ctx.addIssue({
        code: "custom",
        message: "Przyłącze oznacz jako punkt, bez szerokości i wysokości.",
      });
  });
export type KitchenFeature = z.infer<typeof kitchenFeatureSchema>;
export const featureName = {
  window: "Okno",
  door: "Drzwi",
  water: "Woda",
  drain: "Odpływ",
  power: "Prąd",
} as const;
export const isKitchenOpening = (f: KitchenFeature) =>
  f.kind === "window" || f.kind === "door";
export function featureRoomIssues(
  d: {
    width: number;
    depth: number;
    returnLength: number;
    height: number;
    layout?: KitchenLayout;
    features?: KitchenFeature[];
  },
  walls: string[],
) {
  const issues: string[] = [];
  if ((d.features ?? []).filter((f) => f.kind === "water").length > 1)
    issues.push(
      "W tym szkicu można wskazać jeden punkt wody dla proponowanej kuchni.",
    );
  if (new Set(d.features?.map((f) => f.id)).size !== (d.features?.length ?? 0))
    issues.push("Powtarzające się oznaczenia pomieszczenia.");
  for (const f of d.features ?? []) {
    const length = kitchenWallLength({...d, layout: d.layout ?? "u"}, f.wall);
    if (
      !walls.includes(f.wall) ||
      f.x + f.width > length ||
      f.bottom + f.height > d.height
    )
      issues.push(
        `${featureName[f.kind]} ${f.kind === "door" ? "nie mieszczą się" : "nie mieści się"} na ścianie ${f.wall.toUpperCase()}. Popraw położenie lub wymiary.`,
      );
  }
  return issues;
}
export function openingOverlaps(m: Modul, f: KitchenFeature, worktop = 38) {
  if (!isKitchenOpening(f) || m.scianaId !== f.wall) return false;
  const s = m.konfiguracja.obudowaZewnetrzna;
  const left = m.pozycjaXMM - (s?.lewy ? s.gruboscMM : 0);
  const right = m.pozycjaXMM + m.szerokoscMM + (s?.prawy ? s.gruboscMM : 0);
  const bottom = m.konfiguracja.nogi
    ? 0
    : m.pozycjaYMM - (s?.dol ? s.gruboscMM : 0);
  const top =
    m.pozycjaYMM +
    m.wysokoscMM +
    (s?.gora ? s.gruboscMM : 0) +
    (m.konfiguracja.blat ? worktop : 0);
  return (
    left < f.x + f.width &&
    right > f.x &&
    bottom < f.bottom + f.height &&
    top > f.bottom
  );
}
