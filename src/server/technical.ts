import type {
  Element,
  Material,
  Modul,
  Pomieszczenie,
  Projekt,
} from "../core/types.js";
import type { Stolarnia } from "../service.js";

export type VisualMaterial = Pick<
  Material,
  "id" | "kod" | "nazwa" | "producent" | "kolorHEX" | "gruboscMM"
>;
export interface TechnicalProject {
  id: string;
  nazwa: string;
  status: Projekt["status"];
  rewizja: number;
  zmieniono: string;
  pomieszczenia: Pomieszczenie[];
  moduly: Modul[];
}
export interface TechnicalAnalysis {
  projekt: TechnicalProject;
  zbudowane: { modul: Modul; elementy: Element[] }[];
  materialy: VisualMaterial[];
}
export function visualMaterial(m: Material): VisualMaterial {
  return {
    id: m.id,
    kod: m.kod,
    nazwa: m.nazwa,
    producent: m.producent,
    kolorHEX: m.kolorHEX,
    gruboscMM: m.gruboscMM,
  };
}
// Explicit field allowlists: no spread of source projects, notes, contracts,
// releases, prices, unknown future fields or internal financial diagnostics.
function moduleView(m: Modul): Modul {
  const c = m.konfiguracja;
  return {
    id: m.id,
    nazwa: m.nazwa,
    scianaId: m.scianaId,
    kategoria: m.kategoria,
    konstrukcja: m.konstrukcja,
    pozycjaXMM: m.pozycjaXMM,
    pozycjaYMM: m.pozycjaYMM,
    szerokoscMM: m.szerokoscMM,
    wysokoscMM: m.wysokoscMM,
    glebokoscMM: m.glebokoscMM,
    materialKorpusuId: m.materialKorpusuId,
    materialFrontuId: m.materialFrontuId,
    konfiguracja: {
      liczbaPolek: c.liczbaPolek,
      typFrontu: c.typFrontu,
      liczbaDrzwi: c.liczbaDrzwi,
      liczbaSzuflad: c.liczbaSzuflad,
      liczbaCargo: c.liczbaCargo,
      plecy: c.plecy,
      blat: c.blat,
      nogi: c.nogi,
      szufladySystemowe: c.szufladySystemowe,
      ...(c.sanitariat
        ? {
            sanitariat: {
              typ: c.sanitariat.typ,
              wysokoscMiskiMM: c.sanitariat.wysokoscMiskiMM,
              przyciskYMM: c.sanitariat.przyciskYMM,
            },
          }
        : {}),
      ...(c.kolka
        ? {
            kolka: {
              liczba: c.kolka.liczba,
              zHamulcem: c.kolka.zHamulcem,
              wysokoscMM: c.kolka.wysokoscMM,
            },
          }
        : {}),
    },
  };
}
function roomView(r: Pomieszczenie): Pomieszczenie {
  return {
    id: r.id,
    nazwa: r.nazwa,
    materialKorpusuId: r.materialKorpusuId,
    materialFrontuId: r.materialFrontuId,
    materialBlatuId: r.materialBlatuId,
    bezUchwytow: r.bezUchwytow,
    sciany: r.sciany.map((w) => ({
      id: w.id,
      nazwa: w.nazwa,
      dlugoscMM: w.dlugoscMM,
      wysokoscMM: w.wysokoscMM,
      x1: w.x1,
      y1: w.y1,
      x2: w.x2,
      y2: w.y2,
      wirtualna: w.wirtualna,
    })),
  };
}
export function projectSummary(p: Projekt) {
  return {
    id: p.id,
    nazwa: p.nazwa,
    status: p.status,
    zmieniono: p.zmieniono,
    liczbaModulow: p.moduly.length,
  };
}
export function technicalView(
  service: Stolarnia,
  id: string,
): TechnicalAnalysis {
  const p = service.projekt(id);
  const a = service.analiza(id);
  const materialIds = new Set(
    p.pomieszczenia
      .flatMap((r) => [
        r.materialKorpusuId,
        r.materialFrontuId,
        r.materialBlatuId,
      ])
      .concat(
        p.moduly.flatMap((m) => [m.materialKorpusuId, m.materialFrontuId]),
      ),
  );
  return {
    projekt: {
      ...projectSummary(p),
      rewizja: p.rewizja,
      pomieszczenia: p.pomieszczenia.map(roomView),
      moduly: p.moduly.map(moduleView),
    },
    zbudowane: a.zbudowane.map((z) => ({
      modul: moduleView(z.modul),
      elementy: z.elementy.map((e) => ({
        kod: e.kod,
        rola: e.rola,
        x: e.x,
        y: e.y,
        z: e.z,
        szer: e.szer,
        wys: e.wys,
        gl: e.gl,
        materialRola: e.materialRola,
        stronaZawiasow: e.stronaZawiasow,
      })),
    })),
    materialy: service
      .materialy()
      .filter((m) => materialIds.has(m.id))
      .map(visualMaterial),
  };
}
