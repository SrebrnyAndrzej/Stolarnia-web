import { z } from "zod";
import { kitchenProjectDetailsSchema } from "../../../../src/core/kitchen-project-details";
import {
  kitchenNeedsSchema,
  kitchenNeedsBrief,
} from "../../../../src/core/kitchen-needs-schema";
import {
  architectFilesSchema,
  architectRoles,
} from "../../../../src/core/architect-files";
import { kitchenRoomWalls } from "../../../../src/core/kitchen-island";
import {
  kitchenLayoutSchema,
  kitchenLayoutWalls,
  kitchenWallStart,
  kitchenWallLength,
  kitchenLayoutName,
} from "../../../../src/core/kitchen-layout";
import {
  kitchenFeatureSchema,
  featureRoomIssues,
  featureName,
} from "../../../../src/core/kitchen-room";
import { buildKitchenModule } from "../../../../src/core/kitchen-build";
import { kitchenStandardsSchema } from "../../../../src/core/kitchen-standards";
import { USTAWIENIA_DOMYSLNE } from "../../../../src/core/settings";
import type { TechnicalAnalysis } from "../api";
import {
  customerKitchenCatalog,
  kitchenModules,
  kitchenIssues,
  kitchenOptionsSchema,
  kitchenOptions,
  kitchenItemSchema,
  kitchenPlanningSchema,
  kitchenIslandSchema,
  isKitchenUpper,
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
    layout: kitchenLayoutSchema,
    width: z.number().int().min(1800).max(8000),
    depth: z.number().int().min(1800).max(8000),
    returnLength: z.number().int().min(1800).max(8000).default(3600),
    height: z.number().int().min(2300).max(3500),
    finish: z.enum(["white", "oak", "sage", "graphite", "cashmere"]),
    quote: kitchenOptionsSchema.default({}),
    standards: kitchenStandardsSchema.optional(),
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
    planning: kitchenPlanningSchema.optional(),
    needs: kitchenNeedsSchema.optional(),
    projectDetails: kitchenProjectDetailsSchema,
    features: z.array(kitchenFeatureSchema).max(20).optional(),
    island: kitchenIslandSchema.optional(),
    architectFiles: architectFilesSchema.optional(),
  })
  .superRefine((d, ctx) => {
    for (const message of featureRoomIssues(d, wallIds(d)))
      ctx.addIssue({ code: "custom", path: ["features"], message });
    const allItems = [...d.items, ...(d.island?.items ?? [])];
    if (new Set(allItems.map((i) => i.id)).size !== allItems.length)
      ctx.addIssue({
        code: "custom",
        message: "Powtarzające się identyfikatory szafek.",
      });
    if (d.items.some((i) => !wallIds(d).includes(i.wall)))
      ctx.addIssue({
        code: "custom",
        message: "Szafki znajdują się na ścianie spoza wybranego układu.",
      });
    if (
      d.planning?.waterWall &&
      d.planning.waterWall !== "auto" &&
      !wallIds(d).includes(d.planning.waterWall)
    )
      ctx.addIssue({
        code: "custom",
        path: ["planning", "waterWall"],
        message: "Ściana zlewu nie należy do układu.",
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
  catalog.some((m) => m.id === id && isKitchenUpper(m));
export const wallIds = (d: Pick<Draft, "layout">): ("a" | "b" | "c")[] =>
  kitchenLayoutWalls(d);
export const wallLength = (d: Draft, wall: string) =>
  kitchenWallLength(d, wall);
export const startOffset = (d: Draft, wall: string) =>
  kitchenWallStart(d, wall);
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
          sciany: kitchenRoomWalls(d),
        },
      ],
    },
    zbudowane: moduly.map((m) => {
      const b = buildKitchenModule(m, {
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
  const analysis = toAnalysis(d);
  const lines = [
    "Szkic z kreatora Pan Stolarz (do weryfikacji pomiarem).",
    ...(d.needs ? [`Potrzeby domowników: ${kitchenNeedsBrief(d.needs)}`] : []),
    `Układ: ${kitchenLayoutName(d.layout)}. Ściana A: ${d.width} mm${d.layout === "parallel" ? `, C: ${d.width} mm, odległość między ścianami: ${d.depth} mm` : d.layout !== "straight" ? `, B: ${d.depth} mm` : ""}${d.layout === "u" ? `, C: ${d.returnLength} mm` : ""}. Wysokość: ${d.height} mm.`,
    d.decor
      ? `Wybrany dekor frontów: ${d.decor.manufacturer} ${d.decor.id} — ${d.decor.name}. Do potwierdzenia na próbce.`
      : `Fronty: ${finishes.find((f) => f.id === d.finish)!.name} (kolor poglądowy).`,
    "Elementy od początku każdej ściany, osobno dolne i wiszące:",
    ...(d.island
      ? [
          `Wyspa: położenie ${d.island.x} / ${d.island.y} mm, obrót ${d.island.rotation}°, blat głębokości ${d.island.depth} mm, szafki ${d.island.items.length}.`,
        ]
      : []),
    ...(d.architectFiles ?? []).map(
      (f) =>
        `Plik architekta: ${f.name} | ${f.room} | ${architectRoles[f.role]}. Oryginał w lokalnej paczce projektu; nie jest wysyłany tym opisem.`,
    ),
    ...(d.features ?? []).map(
      (f) =>
        `${featureName[f.kind]}: ściana ${f.wall.toUpperCase()}, od początku ${f.x} mm, od podłogi ${f.bottom} mm${f.width ? `, ${f.width} × ${f.height} mm` : ""}.`,
    ),
    ...(d.planning
      ? [
          `Założenia hydrauliki: ściana ${d.planning.waterWall === "auto" ? "Auto" : d.planning.waterWall.toUpperCase()}, środek zlewu ${d.planning.sinkCenter ?? "Auto"} mm; zmywarka ${d.planning.dishwasher === "none" ? "brak" : `${d.planning.dishwasher} mm`}. To założenie rozmieszczenia, nie plan przyłączy.`,
        ]
      : []),
    `Standard: ${kitchenOptions.front[d.quote.front]}; ${kitchenOptions.worktop[d.quote.worktop]}; ${kitchenOptions.drawers[d.quote.drawers]}; ${d.quote.installation ? "z montażem" : "bez montażu"}.`,
    ...(d.standards
      ? [
          `Wspólne wymiary: cokół ${d.standards.plinth} mm, korpus dolny ${d.standards.baseHeight} mm, spód wiszących ${d.standards.upperBottom} mm od podłogi.`,
        ]
      : []),
    ...[...d.items, ...(d.island?.items ?? [])].flatMap((i) => [
      ...(i.innerDrawers
        ? [
            `${i.wall.toUpperCase()} | ${i.id}: ${i.innerDrawers} szuflady ukryte, niezależne, za jednym frontem.`,
          ]
        : []),
      ...(i.appliance
        ? [
            `AGD ${i.wall.toUpperCase()} | ${i.catalogId}: ${i.appliance.model}; minimalna nisza ${i.appliance.width} × ${i.appliance.height} × ${i.appliance.depth} mm; wentylacja ${i.appliance.ventilationChecked ? "sprawdzona przez użytkownika" : "do potwierdzenia"}${i.appliance.source ? `; karta ${i.appliance.source}` : ""}.`,
          ]
        : []),
    ]),
    ...analysis.projekt.moduly.map((m) => {
      const fronts = analysis.zbudowane
        .find((b) => b.modul.id === m.id)!
        .elementy.filter(
          (e) => e.rola === "front" && e.kod.startsWith("FRONT-SZ"),
        )
        .sort((a, b) => b.y - a.y);
      return (
        `${m.scianaId.toUpperCase()} | ${m.katalogId} | x=${m.pozycjaXMM} mm | ${m.szerokoscMM}×${m.wysokoscMM}×${m.glebokoscMM} mm` +
        (fronts.length
          ? ` | fronty szuflad od góry: ${fronts.map((f) => f.wys).join(" / ")} mm`
          : "") +
        (m.konfiguracja.obudowaZewnetrzna
          ? ` | obudowa: ${[m.konfiguracja.obudowaZewnetrzna.lewy ? "bok lewy" : "", m.konfiguracja.obudowaZewnetrzna.prawy ? "bok prawy" : "", m.konfiguracja.obudowaZewnetrzna.gora ? "wieniec górny" : "", m.konfiguracja.obudowaZewnetrzna.dol ? "wieniec dolny" : ""].filter(Boolean).join(", ")}; wysunięcie ${m.konfiguracja.obudowaZewnetrzna.wysuniecieMM} mm przed lico frontów`
          : "")
      );
    }),
    "Oznaczenia okien, drzwi i przyłączy oraz podkłady są koncepcyjne. Otwieranie frontów, instalacje i luzy montażowe wymagają sprawdzenia. To koncepcja, nie dokumentacja produkcyjna.",
  ];
  return lines.join("\n");
}
