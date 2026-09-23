import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import type { Material } from "../types.js";

export interface Dekor {
  manufacturer: string; id: string; name: string; source_url: string;
  image_local: string; decor_key?: string; surface_label?: string;
  textures?: string[]; directional?: number; collection?: string;
}
export interface WariantDekoru {
  article_id: string; decor_key: string; product_group: string; product_label: string;
  dimension_xy_source: string; dimension_z_source: string; layout: string; unit: string;
}
const folder = join(process.cwd(), "docs/materialy");
export const DEKORY: Dekor[] = JSON.parse(readFileSync(join(folder, "katalog-dekorow-PL.json"), "utf8"));
const artykuly: WariantDekoru[] = JSON.parse(readFileSync(join(folder, "egger-warianty-program-dostaw-PL.json"), "utf8"));
export const kluczDekoru = (d: Dekor) => `${d.manufacturer}:${d.id}`;
export const obrazDekoru = (d: Dekor) => `/api/dekory/obrazy/${d.image_local.replace(/^obrazy\//, "")}`;
export function wymiaryWariantu(w: WariantDekoru) {
  const liczba = (s: string) => /^\d+(?:\.\d{3})*(?:,\d+)?$/.test(s.trim()) ? Number(s.trim().replaceAll(".", "").replace(",", ".")) : NaN;
  const xy = w.dimension_xy_source.split(/\s*[x×]\s*/i).map(liczba);
  return { wysokoscArkuszaMM: xy[0], szerokoscArkuszaMM: xy[1], gruboscMM: liczba(w.dimension_z_source) };
}
// Obrzeża i laminaty nie są płytami konstrukcyjnymi. Osie ich wymiarów mają inne znaczenie.
export function wariantyDekoru(d: Dekor) {
  return artykuly.filter(w => d.manufacturer === "Egger" && w.decor_key === d.decor_key &&
    ["PG_MELAMINFACEDBOARDS", "PG_PERFECTSENSE"].includes(w.product_group) && w.unit === "Szt." &&
    Object.values(wymiaryWariantu(w)).every(n => Number.isFinite(n) && n > 0));
}
export function materialDekoru(key: string, dane: { artykul?: string; gruboscMM?: number; szerokoscArkuszaMM?: number; wysokoscArkuszaMM?: number; struktura?: string; kierunekDekoru?: boolean }): Material {
  const d = DEKORY.find(x => kluczDekoru(x) === key);
  if (!d) throw new Error("Nieznany dekor.");
  const w = dane.artykul ? wariantyDekoru(d).find(x => x.article_id === dane.artykul) : undefined;
  if (dane.artykul && !w) throw new Error("Artykuł nie należy do tego dekoru lub nie jest płytą.");
  const wym = w ? wymiaryWariantu(w) : { gruboscMM: dane.gruboscMM!, szerokoscArkuszaMM: dane.szerokoscArkuszaMM!, wysokoscArkuszaMM: dane.wysokoscArkuszaMM! };
  if (!Object.values(wym).every(n => typeof n === "number" && Number.isFinite(n) && n > 0 && n <= 10000) || wym.gruboscMM > 200) throw new Error("Podaj poprawną grubość i format płyty w mm.");
  const struktura = d.surface_label ?? dane.struktura?.trim();
  if (!struktura) throw new Error("Wybierz strukturę płyty.");
  if (d.textures?.length && !d.textures.includes(struktura)) throw new Error("Struktura nie należy do tego dekoru.");
  const identity = JSON.stringify([key, w?.article_id, struktura, wym, !!dane.kierunekDekoru]);
  const id = `dekor-${createHash("sha256").update(identity).digest("hex").slice(0, 24)}`;
  return { id, kod: d.id, nazwa: `${d.name} · ${struktura} · ${wym.gruboscMM} mm`, producent: d.manufacturer,
    typ: w?.product_label.includes("MDF") ? "mdf" : "plytaLaminowana", dekor: d.name,
    ...wym, jednostka: "metrKwadratowy", cenaNetto: 0, vatProcent: 23, rabatProcent: 0, aktywny: true,
    kierunekDekoru: d.directional !== undefined ? !!d.directional : !!dane.kierunekDekoru,
    kolorHEX: "#cccccc", kolekcja: d.collection, struktura, zdjecieURL: obrazDekoru(d),
    zrodloKatalogu: d.source_url, artykulProducenta: w?.article_id,
    notatki: `${w ? `Artykuł producenta ${w.article_id}: ${w.product_label}.` : "Format i grubość podane przez użytkownika — potwierdź u dostawcy."} Brak ceny zakupu. Źródło: ${d.source_url}. Zdjęcie poglądowe, bez skali fizycznej.` };
}
