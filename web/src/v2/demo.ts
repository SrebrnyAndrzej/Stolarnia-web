import { zbudujModul } from "../../../src/core/builder";
import { domyslnaKonfiguracja } from "../../../src/core/catalog/modules";
import { USTAWIENIA_DOMYSLNE } from "../../../src/core/settings";
import type { Modul } from "../../../src/core/types";
import type { TechnicalAnalysis, ProjectSummary } from "./api";

// Synthetic geometry only; no customer fixtures or production data are bundled.
const module = (
  id: string,
  x: number,
  width: number,
  wall = "a",
  tall = false,
): Modul => ({
  id,
  nazwa: tall ? "Słupek" : "Szafka dolna",
  scianaId: wall,
  kategoria: tall ? "tall" : "base",
  konstrukcja: "shelves",
  pozycjaXMM: x,
  pozycjaYMM: 100,
  szerokoscMM: width,
  wysokoscMM: tall ? 2200 : 720,
  glebokoscMM: 560,
  konfiguracja: domyslnaKonfiguracja({
    construction: "shelves",
    category: tall ? "tall" : "base",
    widthMM: width,
    heightMM: tall ? 2200 : 720,
  }),
});
export const demoProjects: ProjectSummary[] = [
  {
    id: "pokaz-kuchnia",
    nazwa: "Kuchnia • Projekt A",
    status: "szkic",
    zmieniono: "2026-10-31T09:00:00Z",
    liczbaModulow: 7,
  },
  {
    id: "pokaz-szafa",
    nazwa: "Szafa wnękowa • Projekt B",
    status: "produkcja",
    zmieniono: "2026-10-28T09:00:00Z",
    liczbaModulow: 3,
  },
  {
    id: "pokaz-rtv",
    nazwa: "Zabudowa RTV • Projekt C",
    status: "zaakceptowany",
    zmieniono: "2026-10-26T09:00:00Z",
    liczbaModulow: 2,
  },
];
export function demoProject(id: string): TechnicalAnalysis {
  const summary = demoProjects.find((p) => p.id === id) ?? demoProjects[0];
  const moduly = [
    module("m1", 0, 600, "a", true),
    module("m2", 600, 600),
    module("m3", 1200, 800),
    module("m4", 2000, 600),
    module("m5", 2600, 600),
    module("m6", 600, 600, "b"),
    module("m7", 1200, 600, "b"),
  ];
  return {
    projekt: {
      ...summary,
      rewizja: 1,
      moduly,
      pomieszczenia: [
        {
          id: "room",
          nazwa: "Kuchnia pokazowa",
          materialKorpusuId: "white",
          materialFrontuId: "oak",
          materialBlatuId: "white",
          sciany: [
            { id: "a", nazwa: "Ściana A", dlugoscMM: 3200, wysokoscMM: 2600 },
            { id: "b", nazwa: "Ściana B", dlugoscMM: 2400, wysokoscMM: 2600 },
          ],
        },
      ],
    },
    zbudowane: moduly.map((m) => {
      const z = zbudujModul(m, USTAWIENIA_DOMYSLNE.konstrukcja);
      return { modul: z.modul, elementy: z.elementy };
    }),
    materialy: [
      {
        id: "white",
        nazwa: "Biel matowa",
        kolorHEX: "#efeeea",
        producent: "Przykład",
        kod: "",
        gruboscMM: 18,
      },
      {
        id: "oak",
        nazwa: "Dąb naturalny",
        kolorHEX: "#b89668",
        producent: "Przykład",
        kod: "",
        gruboscMM: 18,
      },
    ],
  };
}
