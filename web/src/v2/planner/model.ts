import { z } from "zod";
import {
  KATALOG_MODULOW,
  domyslnaKonfiguracja,
} from "../../../../src/core/catalog/modules";
import { zbudujModul } from "../../../../src/core/builder";
import { USTAWIENIA_DOMYSLNE } from "../../../../src/core/settings";
import type { Modul } from "../../../../src/core/types";
import type { TechnicalAnalysis } from "../api";

export const STORAGE_KEY = "pan-stolarz.kuchnia.v1";
export const HANDOFF_KEY = "pan-stolarz.kuchnia.zapytanie";
export const catalog = KATALOG_MODULOW.filter(
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
export const finishes = [
  { id: "white", name: "Biel matowa", color: "#eeede8" },
  { id: "oak", name: "Naturalny dąb", color: "#b89668" },
  { id: "sage", name: "Szałwia", color: "#929d87" },
  { id: "graphite", name: "Grafit", color: "#435058" },
] as const;
const itemSchema = z.object({
  id: z.string().uuid(),
  catalogId: z.string().refine((id) => catalog.some((m) => m.id === id)),
  wall: z.enum(["a", "b"]),
});
export const draftSchema = z
  .object({
    version: z.literal(1),
    layout: z.enum(["straight", "l"]),
    width: z.number().int().min(1800).max(8000),
    depth: z.number().int().min(1800).max(8000),
    height: z.number().int().min(2300).max(3500),
    finish: z.enum(["white", "oak", "sage", "graphite"]),
    items: z.array(itemSchema).max(24),
  })
  .superRefine((d, ctx) => {
    if (new Set(d.items.map((i) => i.id)).size !== d.items.length)
      ctx.addIssue({
        code: "custom",
        message: "Powtarzające się identyfikatory szafek.",
      });
    if (d.layout === "straight" && d.items.some((i) => i.wall === "b"))
      ctx.addIssue({
        code: "custom",
        message: "Układ prosty obsługuje ścianę A.",
      });
  });
export type Draft = z.infer<typeof draftSchema>;
export const newDraft = (): Draft => ({
  version: 1,
  layout: "straight",
  width: 3600,
  depth: 2400,
  height: 2600,
  finish: "oak",
  items: [],
});
export function readDraft(raw: string): Draft {
  return draftSchema.parse(JSON.parse(raw));
}
export const isUpper = (id: string) =>
  catalog.find((m) => m.id === id)?.category === "wall";
export const startOffset = (d: Draft, wall: string) =>
  d.layout === "l" && wall === "b" ? 650 : 0;
export function toAnalysis(d: Draft): TechnicalAnalysis {
  // UI adapter only: catalog dimensions/configuration and existing engine build every part.
  const ends: Record<string, number> = {};
  const moduly: Modul[] = d.items.map((i) => {
    const entry = catalog.find((m) => m.id === i.catalogId)!;
    const key = `${i.wall}-${isUpper(i.catalogId) ? "upper" : "base"}`;
    const x = ends[key] ?? startOffset(d, i.wall);
    ends[key] = x + entry.widthMM;
    return {
      id: i.id,
      katalogId: entry.id,
      nazwa: entry.name,
      scianaId: i.wall,
      kategoria: entry.category,
      konstrukcja: entry.construction,
      pozycjaXMM: x,
      pozycjaYMM: entry.category === "wall" ? entry.bottomOffsetMM : 100,
      szerokoscMM: entry.widthMM,
      wysokoscMM: entry.heightMM,
      glebokoscMM: entry.depthMM,
      konfiguracja: domyslnaKonfiguracja(entry),
      materialFrontuId: d.finish,
    };
  });
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
            ...(d.layout === "l"
              ? [
                  {
                    id: "b",
                    nazwa: "Ściana B",
                    dlugoscMM: d.depth,
                    wysokoscMM: d.height,
                  },
                ]
              : []),
          ],
        },
      ],
    },
    zbudowane: moduly.map((m) => {
      const b = zbudujModul(m, USTAWIENIA_DOMYSLNE.konstrukcja);
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
  const modules = toAnalysis(d).projekt.moduly;
  const issues: string[] = [];
  for (const wall of ["a", "b"]) {
    const length = wall === "a" ? d.width : d.depth;
    if (
      modules.some(
        (m) => m.scianaId === wall && m.pozycjaXMM + m.szerokoscMM > length,
      )
    )
      issues.push(
        `Szafki wychodzą poza ścianę ${wall.toUpperCase()}. Usuń szafkę lub zwiększ wymiar.`,
      );
  }
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
export function brief(d: Draft): string {
  const lines = [
    "Szkic z kreatora Pan Stolarz (do weryfikacji pomiarem).",
    `Układ: ${d.layout === "l" ? "L z pustym narożnikiem 650 mm na ścianie B" : "prosty"}. Ściana A: ${d.width} mm${d.layout === "l" ? `, B: ${d.depth} mm` : ""}. Wysokość: ${d.height} mm.`,
    `Fronty: ${finishes.find((f) => f.id === d.finish)!.name} (kolor poglądowy).`,
    "Szafki od początku każdej ściany, osobno dolne i wiszące:",
    ...toAnalysis(d).projekt.moduly.map(
      (m) =>
        `${m.scianaId.toUpperCase()} | ${m.katalogId} | x=${m.pozycjaXMM} mm | ${m.szerokoscMM}×${m.wysokoscMM}×${m.glebokoscMM} mm`,
    ),
    "Nie uwzględniono okien, drzwi, instalacji, otwierania frontów ani luzów montażowych. To koncepcja, nie dokumentacja produkcyjna.",
  ];
  return lines.join("\n");
}
