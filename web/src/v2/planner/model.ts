import { z } from "zod";
import { zbudujModul } from "../../../../src/core/builder";
import { USTAWIENIA_DOMYSLNE } from "../../../../src/core/settings";
import type { TechnicalAnalysis } from "../api";
import {
  customerKitchenCatalog,
  kitchenModules,
  kitchenIssues,
  kitchenOptionsSchema,
  kitchenOptions,
  kitchenItemSchema,
} from "../../../../src/core/kitchen-configuration";

export const STORAGE_KEY = "pan-stolarz.kuchnia.v1";
export const HANDOFF_KEY = "pan-stolarz.kuchnia.zapytanie";
export const catalog = customerKitchenCatalog;

export const finishes = [
  { id: "white", name: "Biel matowa", color: "#eeede8" },
  { id: "oak", name: "Naturalny dąb", color: "#b89668" },
  { id: "sage", name: "Szałwia", color: "#929d87" },
  { id: "graphite", name: "Grafit", color: "#435058" },
  { id: "cashmere", name: "Kaszmir", color: "#d8cfc1" },
] as const;
export const draftSchema = z
  .object({
    version: z.literal(1),
    layout: z.enum(["straight", "l", "u"]),
    width: z.number().int().min(1800).max(8000),
    depth: z.number().int().min(1800).max(8000),
    returnLength: z.number().int().min(1800).max(8000).default(3600),
    height: z.number().int().min(2300).max(3500),
    finish: z.enum(["white", "oak", "sage", "graphite", "cashmere"]),
    quote: kitchenOptionsSchema.default({}),
    decor: z
      .object({
        key: z.string().max(160),
        id: z.string().max(120),
        name: z.string().max(200),
        manufacturer: z.enum(["Egger", "Kronospan"]),
        obraz: z.string().startsWith("/api/dekory/obrazy/").max(240),
      })
      .optional(),
    items: z.array(kitchenItemSchema).max(24),
  })
  .superRefine((d, ctx) => {
    if (new Set(d.items.map((i) => i.id)).size !== d.items.length)
      ctx.addIssue({
        code: "custom",
        message: "Powtarzające się identyfikatory szafek.",
      });
    if (d.items.some((i) => !wallIds(d).includes(i.wall)))
      ctx.addIssue({
        code: "custom",
        message: "Szafki znajdują się na ścianie spoza wybranego układu.",
      });
  });
export type Draft = z.infer<typeof draftSchema>;
export const newDraft = (): Draft => ({
  version: 1,
  layout: "straight",
  width: 3600,
  depth: 2400,
  returnLength: 3600,
  height: 2600,
  finish: "oak",
  quote: kitchenOptionsSchema.parse({}),
  items: [],
});
export function readDraft(raw: string): Draft {
  return draftSchema.parse(JSON.parse(raw));
}
export const isUpper = (id: string) =>
  catalog.find((m) => m.id === id)?.category === "wall";
export const wallIds = (d: Pick<Draft, "layout">): ("a" | "b" | "c")[] =>
  d.layout === "u" ? ["a", "b", "c"] : d.layout === "l" ? ["a", "b"] : ["a"];
export const wallLength = (d: Draft, wall: string) =>
  wall === "a" ? d.width : wall === "b" ? d.depth : d.returnLength;
export const startOffset = (d: Draft, wall: string) =>
  d.layout !== "straight" && wall !== "a" ? 650 : 0;
export function toAnalysis(d: Draft): TechnicalAnalysis {
  // UI adapter only: catalog dimensions/configuration and existing engine build every part.
  const moduly = kitchenModules(d);

  return {
    projekt: {
      id: "szkic-klienta",
      nazwa: "Moja kuchnia",
      status: "szkic",
      rewizja: 1,
      zmieniono: "",
      moduly,
      pomieszczenia: [
        {
          id: "kitchen",
          nazwa: "Moja kuchnia",
          materialKorpusuId: "white",
          materialFrontuId: d.finish,
          materialBlatuId: "white",
          sciany: [
            {
              id: "a",
              nazwa: "Ściana A",
              dlugoscMM: d.width,
              wysokoscMM: d.height,
            },
            ...(d.layout !== "straight"
              ? [
                  {
                    id: "b",
                    nazwa: "Ściana B",
                    dlugoscMM: d.depth,
                    wysokoscMM: d.height,
                  },
                ]
              : []),
            ...(d.layout === "u"
              ? [
                  {
                    id: "c",
                    nazwa: "Ściana C",
                    dlugoscMM: d.returnLength,
                    wysokoscMM: d.height,
                  },
                ]
              : []),
          ],
        },
      ],
    },
    zbudowane: moduly.map((m) => {
      const b = zbudujModul(m, {
        ...USTAWIENIA_DOMYSLNE.konstrukcja,
        gruboscFrontuMM: d.quote.front === "lacquer" ? 19 : 18,
        gruboscBlatuMM: d.quote.worktop === "compact" ? 12 : 38,
      });
      return { modul: b.modul, elementy: b.elementy };
    }),
    materialy: finishes.map((f) => ({
      id: f.id,
      nazwa: f.name,
      kolorHEX: f.color,
      gruboscMM: 18,
      kod: "",
      producent: "Kolor poglądowy",
    })),
  };
}
export function layoutIssues(d: Draft): string[] {
  return kitchenIssues(d);
}
export function brief(d: Draft): string {
  const lines = [
    "Szkic z kreatora Pan Stolarz (do weryfikacji pomiarem).",
    `Układ: ${d.layout === "u" ? "U z pustymi narożnikami po 650 mm na ścianach B i C" : d.layout === "l" ? "L z pustym narożnikiem 650 mm na ścianie B" : "prosty"}. Ściana A: ${d.width} mm${d.layout !== "straight" ? `, B: ${d.depth} mm` : ""}${d.layout === "u" ? `, C: ${d.returnLength} mm` : ""}. Wysokość: ${d.height} mm.`,
    d.decor
      ? `Wybrany dekor frontów: ${d.decor.manufacturer} ${d.decor.id} — ${d.decor.name}. Do potwierdzenia na próbce.`
      : `Fronty: ${finishes.find((f) => f.id === d.finish)!.name} (kolor poglądowy).`,
    "Szafki od początku każdej ściany, osobno dolne i wiszące:",
    `Standard: ${kitchenOptions.front[d.quote.front]}; ${kitchenOptions.worktop[d.quote.worktop]}; ${kitchenOptions.drawers[d.quote.drawers]}; ${d.quote.installation ? "z montażem" : "bez montażu"}.`,
    ...toAnalysis(d).projekt.moduly.map(
      (m) =>
        `${m.scianaId.toUpperCase()} | ${m.katalogId} | x=${m.pozycjaXMM} mm | ${m.szerokoscMM}×${m.wysokoscMM}×${m.glebokoscMM} mm`,
    ),
    "Nie uwzględniono okien, drzwi, instalacji, otwierania frontów ani luzów montażowych. To koncepcja, nie dokumentacja produkcyjna.",
  ];
  return lines.join("\n");
}
