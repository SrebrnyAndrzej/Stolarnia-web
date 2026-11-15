import { z } from "zod";
import { KATALOG_MODULOW, domyslnaKonfiguracja } from "./catalog/modules.js";
import type { Modul } from "./types.js";

export const customerKitchenCatalog = KATALOG_MODULOW.filter(
  (m) =>
    [
      "shelves",
      "drawers",
      "sink",
      "oven",
      "dishwasherFront",
      "refrigerator",
    ].includes(m.construction) &&
    ["base", "wall", "tall", "appliance"].includes(m.category),
);
export const kitchenOptionsSchema = z.object({
  front: z.enum(["laminate", "lacquer", "fluted"]).default("laminate"),
  worktop: z.enum(["laminate", "compact"]).default("laminate"),
  drawers: z.enum(["amix", "blum"]).default("amix"),
  installation: z.boolean().default(true),
});
export const kitchenOptions = {
  front: {
    laminate: "Laminat matowy",
    lacquer: "MDF lakierowany mat",
    fluted: "MDF ryflowany lakierowany",
  },
  worktop: { laminate: "Blat laminowany", compact: "Blat kompaktowy HPL" },
  drawers: { amix: "Amix + zawiasy Hettich", blum: "Blum + zawiasy Hettich" },
} as const;
export const kitchenFinishes = {
  white: "Biel matowa",
  oak: "Naturalny dąb",
  sage: "Szałwia",
  graphite: "Grafit",
  cashmere: "Kaszmir",
} as const;
export const kitchenItemSchema = z
  .object({
    id: z.string().uuid(),
    catalogId: z
      .string()
      .refine((id) => customerKitchenCatalog.some((m) => m.id === id)),
    wall: z.enum(["a", "b", "c"]),
    width: z.number().int().min(200).max(1200).optional(),
    height: z.number().int().min(300).max(2600).optional(),
    depth: z.number().int().min(250).max(800).optional(),
    shelves: z.number().int().min(0).max(8).optional(),
    drawers: z.number().int().min(2).max(6).optional(),
  })
  .superRefine((i, ctx) => {
    const m = customerKitchenCatalog.find((m) => m.id === i.catalogId);
    if (!m) return;
    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (
      i.width !== undefined &&
      m.category === "appliance" &&
      i.width !== m.widthMM
    )
      fail(
        "width",
        "Szerokość zabudowy AGD zmienisz wybierając właściwy model szafki.",
      );
    if (
      i.height !== undefined &&
      ![m.heightMM, ...m.availableHeightsMM].includes(i.height)
    )
      fail("height", "Wybierz wysokość dostępną dla tej szafki.");
    if (
      i.depth !== undefined &&
      ![m.depthMM, ...m.availableDepthsMM].includes(i.depth)
    )
      fail("depth", "Wybierz głębokość dostępną dla tej szafki.");
    if (i.shelves !== undefined && m.construction !== "shelves")
      fail("shelves", "Półki można ustawiać w szafce półkowej.");
    if (i.drawers !== undefined && m.construction !== "drawers")
      fail("drawers", "Liczbę szuflad można ustawiać w szafce szufladowej.");
  });
export type KitchenItem = z.infer<typeof kitchenItemSchema>;
export const kitchenInputSchema = z
  .object({
    layout: z.enum(["straight", "l", "u"]),
    width: z.number().int().min(1800).max(8000),
    depth: z.number().int().min(1800).max(8000),
    returnLength: z.number().int().min(1800).max(8000).default(3600),
    height: z.number().int().min(2300).max(3500),
    finish: z
      .enum(["white", "oak", "sage", "graphite", "cashmere"])
      .default("oak"),
    decor: z
      .object({
        name: z.string().max(200),
        id: z.string().max(120),
        manufacturer: z.enum(["Egger", "Kronospan"]),
      })
      .optional(),
    items: z.array(kitchenItemSchema).max(24),
    quote: kitchenOptionsSchema.default({}),
  })
  .superRefine((d, ctx) => {
    if (new Set(d.items.map((i) => i.id)).size !== d.items.length)
      ctx.addIssue({
        code: "custom",
        message: "Powtarzające się identyfikatory szafek.",
      });
    if (d.items.some((i) => !kitchenWalls(d).includes(i.wall)))
      ctx.addIssue({
        code: "custom",
        message: "Szafka na nieużywanej ścianie.",
      });
  });
export type KitchenInput = z.infer<typeof kitchenInputSchema>;
export type KitchenQuoteOptions = z.infer<typeof kitchenOptionsSchema>;
export const kitchenWalls = (d: {
  layout: KitchenInput["layout"];
}): ("a" | "b" | "c")[] =>
  d.layout === "u" ? ["a", "b", "c"] : d.layout === "l" ? ["a", "b"] : ["a"];
export function kitchenModules(d: Omit<KitchenInput, "quote">): Modul[] {
  const ends: Record<string, number> = {};
  return d.items.map((i) => {
    const m = customerKitchenCatalog.find((m) => m.id === i.catalogId)!;
    const key = `${i.wall}-${m.category === "wall" ? "upper" : "base"}`;
    const x =
      ends[key] ?? (d.layout !== "straight" && i.wall !== "a" ? 650 : 0);
    const width = i.width ?? m.widthMM,
      height = i.height ?? m.heightMM,
      depth = i.depth ?? m.depthMM;
    const config = domyslnaKonfiguracja({
      ...m,
      widthMM: width,
      heightMM: height,
    });
    if (i.shelves !== undefined) config.liczbaPolek = i.shelves;
    if (i.drawers !== undefined) config.liczbaSzuflad = i.drawers;
    ends[key] = x + width;
    return {
      id: i.id,
      katalogId: m.id,
      nazwa: m.name.replace(/\s+\d+$/, ` ${width}`),
      scianaId: i.wall,
      kategoria: m.category,
      konstrukcja: m.construction,
      pozycjaXMM: x,
      pozycjaYMM: m.category === "wall" ? m.bottomOffsetMM : 100,
      szerokoscMM: width,
      wysokoscMM: height,
      glebokoscMM: depth,
      konfiguracja: config,
      materialFrontuId: d.finish,
    };
  });
}
export function kitchenIssues(d: Omit<KitchenInput, "quote">): string[] {
  const modules = kitchenModules(d),
    issues: string[] = [];
  for (const wall of kitchenWalls(d)) {
    const len =
      wall === "a" ? d.width : wall === "b" ? d.depth : d.returnLength;
    if (
      modules.some(
        (m) => m.scianaId === wall && m.pozycjaXMM + m.szerokoscMM > len,
      )
    )
      issues.push(
        `Szafki wychodzą poza ścianę ${wall.toUpperCase()}. Usuń szafkę lub zwiększ wymiar.`,
      );
  }
  if (modules.some((m) => m.pozycjaYMM + m.wysokoscMM > d.height))
    issues.push(
      "Szafka przekracza wysokość pomieszczenia. Zmień jej wysokość.",
    );
  if (modules.some((m) => m.konfiguracja.liczbaPolek * 18 >= m.wysokoscMM - 36))
    issues.push("W szafce brakuje miejsca na wybraną liczbę półek.");
  if (
    modules.some(
      (a) =>
        a.wysokoscMM > 1500 &&
        a.kategoria !== "wall" &&
        modules.some(
          (b) =>
            b.kategoria === "wall" &&
            a.scianaId === b.scianaId &&
            a.pozycjaXMM < b.pozycjaXMM + b.szerokoscMM &&
            b.pozycjaXMM < a.pozycjaXMM + a.szerokoscMM,
        ),
    )
  )
    issues.push(
      "Szafka wisząca nakłada się na słupek. Usuń lub przestaw szafki w tej ścianie.",
    );
  return issues;
}

/** Starter suggestion, not an installation plan. Keeps the existing empty-corner convention. */
export function suggestKitchen(
  d: Omit<KitchenInput, "quote">,
  id: () => string,
): KitchenItem[] {
  const walls = kitchenWalls(d),
    items: KitchenItem[] = [];
  const maxPerWall = Math.floor(24 / (walls.length * 2));
  const baseTypes = [
    "base-drawers-600",
    "base-sink-600",
    "dishwasher-front-600",
  ];
  let baseIndex = 0;
  for (const wall of walls) {
    const len =
      wall === "a" ? d.width : wall === "b" ? d.depth : d.returnLength;
    const available = len - (wall !== "a" ? 650 : 0);
    const count = Math.min(maxPerWall, Math.floor(available / 600));
    for (let i = 0; i < count; i++) {
      items.push({
        id: id(),
        catalogId: baseTypes[baseIndex++] ?? "base-shelves-600",
        wall,
      });
      items.push({ id: id(), catalogId: "wall-shelves-600", wall });
    }
  }
  return items;
}
export interface KitchenEstimate {
  version: "oferta-2-a4-v1";
  basis: string;
  status: "estimated" | "blocked";
  gross: number | null;
  groups: { label: string; gross: number }[];
  scope: { label: string; description: string }[];
  notes: string[];
  issues: string[];
}
