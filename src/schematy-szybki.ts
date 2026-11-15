import { z } from "zod";

// Schematy wejścia szybkiego projektu — wspólne dla MCP (inputSchema = .shape) i usługi (REST parsuje nimi każde żądanie).
// Liczby muszą być skończone (zod odrzuca NaN/Infinity), limity jak w docs/SZYBKI-PROJEKT.md.

const mm = (maks = 20000) => z.number().finite().min(0).max(maks);
const szerokosci = z.array(z.number().finite().positive().max(3000)).min(1).max(20).optional().describe("Preferowane szerokości w kolejności preferencji");

export const schematWypelnienia = z.object({
  rzad: z.enum(["dolny", "wiszacy"]),
  konstrukcja: z.enum(["shelves", "drawers"]).optional().describe("Dolne: półki (domyślnie) albo szuflady"),
  szerokosci,
  symetria: z.boolean().optional(),
  odXMM: mm().optional(),
  doXMM: mm().optional(),
  blendaNaroznaMM: z.number().finite().min(0).max(150).optional().describe("Blenda przy szafce prostopadłej, 0–150 mm (domyślnie 50)"),
  podglad: z.boolean().optional(),
});

const element = {
  sciana: z.number().int().min(0).max(2).optional().describe("Indeks ściany w układzie (0 = pierwsza)"),
  xMM: mm().optional().describe("Lewa krawędź od początku ściany; brak = automatycznie"),
};

export const schematSzybkiegoUkladu = z.object({
  typ: z.enum(["I", "L", "U"]),
  pomieszczenieId: z.string().optional(),
  scianyIds: z.array(z.string()).min(1).max(3).optional().describe("Kolejne ściany układu (koniec jednej = początek następnej)"),
  dlugosciScianMM: z.array(z.number().finite().min(300).max(20000)).min(1).max(3).optional().describe("Długości ścian; brakujące ściany zostaną utworzone"),
  wysokoscMM: z.number().finite().min(1500).max(5000).optional().describe("Wysokość pomieszczenia"),
  zlew: z.object({ ...element, szerokoscMM: z.number().finite().positive().max(1200).optional() }).nullable().optional().describe("null = bez zlewu"),
  zmywarka: z.object({ szerokoscMM: z.union([z.literal(450), z.literal(600)]).optional(), strona: z.enum(["lewa", "prawa"]).optional() }).nullable().optional().describe("null = bez zmywarki"),
  plyta: z.object({ ...element, szerokoscMM: z.number().finite().positive().max(1200).optional(), piekarnikPod: z.boolean().optional() }).nullable().optional(),
  lodowka: z
    .object({ ...element, rodzaj: z.enum(["slupek", "wolnostojaca"]).optional(), szerokoscMM: z.number().finite().positive().max(1200).optional(), strona: z.enum(["poczatek", "koniec"]).optional() })
    .nullable()
    .optional(),
  slupki: z.array(z.string()).max(4).optional().describe("Dodatkowe słupki z katalogu obok lodówki, np. tall-oven-600"),
  wiszace: z.boolean().optional(),
  okap: z.enum(["szafka", "brak"]).optional(),
  naroznik: z.enum(["slepa", "L"]).optional(),
  dolne: z.enum(["shelves", "drawers"]).optional().describe("Szafki wypełniające dolne (domyślnie szuflady)"),
  szerokosci,
  symetria: z.boolean().optional(),
  przerwyWiszacych: z.array(z.object({ sciana: z.number().int().min(0), odMM: mm(), doMM: mm() })).max(20).optional().describe("Np. okno"),
  zastap: z.boolean().optional(),
  podglad: z.boolean().optional(),
});

export const schematWyboruMaterialu = z.union([
  z.object({ materialId: z.string().min(1) }).strict(),
  z
    .object({
      dekor: z.string().min(1).describe("Klucz dekoru z galerii: 'Producent:id', np. 'Egger:H1384 ST40'"),
      artykul: z.string().optional(),
      gruboscMM: z.number().finite().positive().max(200).optional(),
      szerokoscArkuszaMM: z.number().finite().positive().max(10000).optional(),
      wysokoscArkuszaMM: z.number().finite().positive().max(10000).optional(),
      glebokoscMM: z.number().finite().positive().max(3000).optional().describe("Blat: głębokość"),
      dlugoscMM: z.number().finite().positive().max(6000).optional().describe("Blat: długość handlowa"),
      struktura: z.string().optional(),
    })
    .strict(),
]);

export const schematStylu = z.object({
  pomieszczenieId: z.string().optional(),
  korpus: schematWyboruMaterialu.optional(),
  front: schematWyboruMaterialu.optional(),
  blat: schematWyboruMaterialu.optional(),
  wyczyscWyjatkiModulow: z.boolean().optional(),
  podglad: z.boolean().optional(),
});

export const schematOkucProjektu = z
  .object({ systemSzuflad: z.string().optional(), zawiasy: z.string().optional(), podnosniki: z.string().optional(), profilSzuflad: z.string().optional() })
  .strict()
  .nullable();

/** Czytelny komunikat z błędu zod (pole: problem). */
export function opisBleduZod(e: z.ZodError): string {
  return e.issues.map((i) => `${i.path.join(".") || "dane"}: ${i.message}`).join("; ");
}
