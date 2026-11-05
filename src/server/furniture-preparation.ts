import { createHash } from "node:crypto";
import { z } from "zod";
import type { Magazyn } from "../store/store.js";
import { AccessError, isWorkshopMember, type Principal } from "./access.js";
import { furnitureParts } from "../core/furniture-parts.js";
import { furnitureGeometrySnapshot } from "../core/furniture.js";
import { rozkroj, zapotrzebowanieObrzeza } from "../core/production.js";
import type { Formatka, Material, RodzajObrzeza } from "../core/types.js";
const schema = z
  .object({
    version: z.number().int().positive(),
    materials: z.record(z.string().uuid(), z.string().min(1).max(120)),
  })
  .strict();
const materialSnapshot = (m: Material) => ({
  id: m.id,
  kod: m.kod,
  nazwa: m.nazwa,
  producent: m.producent,
  dekor: m.dekor,
  typ: m.typ,
  gruboscMM: m.gruboscMM,
  szerokoscArkuszaMM: m.szerokoscArkuszaMM,
  wysokoscArkuszaMM: m.wysokoscArkuszaMM,
  jednostka: m.jednostka,
  aktywny: m.aktywny,
  kierunekDekoru: m.kierunekDekoru,
  kolorHEX: m.kolorHEX,
});
export function preparationMaterials(store: Magazyn, person: Principal) {
  if (!isWorkshopMember(person))
    throw new AccessError(
      403,
      "Przygotowanie jest dostępne aktywnemu zespołowi.",
    );
  return store
    .odczytaj()
    .materialy.filter((m) => m.aktywny && m.jednostka === "metrKwadratowy")
    .map(materialSnapshot);
}
/** Stage one adapter: all-or-nothing board planning, no guessed hardware or production approval. */
export function prepareFurniture(
  store: Magazyn,
  person: Principal,
  id: string,
  input: unknown,
) {
  if (!isWorkshopMember(person))
    throw new AccessError(
      403,
      "Przygotowanie jest dostępne aktywnemu zespołowi.",
    );
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw new AccessError(
      400,
      "Wybierz zapisaną wersję i przypisz materiały katalogowe do części.",
    );
  const db = store.odczytaj(),
    entry = db.furnitureLibrary?.find((e) => e.id === id);
  if (!entry) throw new AccessError(404, "Nie znaleziono modelu.");
  if (entry.version !== parsed.data.version)
    throw new AccessError(
      409,
      "Model zmienił się. Otwórz bieżącą wersję przed przygotowaniem rozkroju.",
    );
  if (
    Object.keys(parsed.data.materials).some(
      (key) => !entry.model.plates.some((p) => p.id === key),
    )
  )
    throw new AccessError(
      400,
      "Przypisanie dotyczy części spoza tej wersji mebla.",
    );
  const parts = furnitureParts(entry.model),
    catalog = new Map(db.materialy.map((m) => [m.id, m]));
  const diagnostics: { partId: string; name: string; issues: string[] }[] = [],
    formatki: Formatka[] = [];
  const used = new Map<string, ReturnType<typeof materialSnapshot>>();
  for (const [i, row] of parts.entries()) {
    const plate = entry.model.plates[i],
      spec = plate.specification,
      material = catalog.get(parsed.data.materials[row.id]);
    const issues = [...row.issues];
    if (!material?.aktywny) issues.push("przypisz aktywny materiał z katalogu");
    else {
      used.set(material.id, materialSnapshot(material));
      if (
        material.jednostka !== "metrKwadratowy" ||
        !Number.isFinite(material.szerokoscArkuszaMM) ||
        !Number.isFinite(material.wysokoscArkuszaMM) ||
        material.szerokoscArkuszaMM <= 0 ||
        material.wysokoscArkuszaMM <= 0
      )
        issues.push("materiał nie ma poprawnego formatu arkusza płyty");
      if (
        row.thickness === null ||
        Math.abs(material.gruboscMM - row.thickness) > 0.01
      )
        issues.push("grubość materiału katalogowego nie odpowiada części");
      if (material.kierunekDekoru && spec?.grain === "none")
        issues.push("materiał ma kierunek wzoru — wskaż oś U lub V");
    }
    if (spec?.face === "slope" && !row.substrate)
      issues.push(
        "skośna płaszczyzna wymaga odrębnej technologii i rozwinięcia",
      );
    if (
      (spec?.grain === "u" || spec?.grain === "v") &&
      !db.ustawienia.rozkroj.uwzgledniajKierunekDekoru
    )
      issues.push(
        "włącz uwzględnianie kierunku dekoru w ustawieniach rozkroju",
      );
    const edge = (key: "u0" | "u1" | "v0" | "v1"): RodzajObrzeza => {
      const e = spec?.edges[key];
      if (e?.state !== "band") return "brak";
      if (Math.abs(e.thickness - 0.8) < 0.001) return "abs08";
      if (Math.abs(e.thickness - 2) < 0.001) return "abs20";
      issues.push(`obrzeże ${key}: adapter obsługuje ABS 0,8 lub 2 mm`);
      return "brak";
    };
    let edges: [RodzajObrzeza, RodzajObrzeza, RodzajObrzeza, RodzajObrzeza] = [
      edge("v0"),
      edge("v1"),
      edge("u0"),
      edge("u1"),
    ];
    if (!row.substrate || !row.dimensions)
      issues.push("brak jednoznacznego prostokątnego wymiaru rdzenia");
    if (issues.length) {
      diagnostics.push({
        partId: row.id,
        name: row.name,
        issues: [...new Set(issues)],
      });
      continue;
    }
    let [length, width] = row.dimensions!,
      [cutLength, cutWidth] = row.substrate!;
    if (entry.model.construction?.dimensionMode === "substrate") {
      const band = (key: "u0" | "u1" | "v0" | "v1") =>
        spec!.edges[key].state === "band" ? spec!.edges[key].thickness : 0;
      length += band("u0") + band("u1");
      width += band("v0") + band("v1");
    }
    if (spec!.grain === "v") {
      [length, width] = [width, length];
      [cutLength, cutWidth] = [cutWidth, cutLength];
      edges = [edges[2], edges[3], edges[0], edges[1]];
    }
    formatki.push({
      id: row.id,
      etykieta: `${i + 1}. ${row.name}`,
      indeksModulu: 1,
      nazwaModulu: entry.model.name,
      modulId: entry.id,
      kodElementu: row.id,
      rola:
        plate.kind === "door" || plate.kind === "drawer" ? "front" : "shelf",
      kategoria:
        plate.kind === "door" || plate.kind === "drawer" ? "front" : "korpus",
      materialId: material!.id,
      materialOpis: `${material!.nazwa} · ${material!.dekor}`,
      kolorHEX: material!.kolorHEX,
      dlugoscMM: length,
      szerokoscMM: width,
      gruboscMM: row.thickness!,
      dlugoscCieciaMM: cutLength,
      szerokoscCieciaMM: cutWidth,
      kierunekDekoru: spec!.grain === "none" ? "dowolny" : "wzdluzDlugosci",
      obrzeza: edges,
    });
  }
  const source = {
    libraryId: entry.id,
    libraryVersion: entry.version,
    savedAt: entry.updatedAt,
    geometry: furnitureGeometrySnapshot(entry.model),
    construction: entry.model.construction ?? null,
    specifications: entry.model.plates.map((p) => ({
      partId: p.id,
      specification: p.specification ?? null,
    })),
    materialAssignments: parsed.data.materials,
    materials: [...used.values()],
    settings: {
      rozkroj: db.ustawienia.rozkroj,
      okleinowanie: db.ustawienia.okleinowanie,
    },
  };
  const canonical = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(canonical)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value)
              .sort(([a], [b]) => a.localeCompare(b, "en"))
              .map(([key, v]) => [key, canonical(v)]),
          )
        : value;
  const checksum = createHash("sha256")
    .update(JSON.stringify(canonical(source)))
    .digest("hex");
  const planning = diagnostics.length
    ? null
    : {
        formatki,
        rozkroj: rozkroj(formatki, db.ustawienia.rozkroj, catalog),
        obrzeza: zapotrzebowanieObrzeza(formatki, db.ustawienia.okleinowanie),
      };
  return {
    format: "pan-stolarz-preparation-draft",
    schemaVersion: 1,
    status: "draft",
    readyForProduction: false,
    unit: "mm",
    checksum,
    source,
    diagnostics,
    planning,
    technologyRequired: [
      "połączenia i bazy obróbki",
      "kompletne wiercenia i rowki",
      "skrzynki szuflad i kompletacja okuć",
      "kody obrzeży i zakupowa weryfikacja ilości",
      "odbiór technologiczny",
    ],
    scope:
      "Plan obejmuje tylko płyty zapisane w tym modelu. Nie jest wydaniem produkcyjnym, zleceniem cięcia ani zamówieniem do dostawcy.",
  };
}
