import { createHash } from "node:crypto";
import { artykulyDekoru, DEKORY, kluczDekoru, materialDekoru, obrazDekoru, wariantyDekoru, wymiaryWariantu, type Dekor, type WariantDekoru } from "./catalog/decors.js";
import type { Material } from "./types.js";

// Pakiet stylu: dekor korpusu, frontów i blatu z galerii 644 dekorów jednym wywołaniem.
// Zasada: grubość i format bierzemy WYŁĄCZNIE z danych producenta (artykuły Egger) albo z jawnego wpisu użytkownika.
// Gdy danych brak — zwracamy brak („wymaga wpisania grubości/formatu”), niczego nie zgadujemy.

export type RolaStylu = "korpus" | "front" | "blat";

export type WyborMaterialu =
  | { materialId: string }
  | {
      /** Klucz dekoru z galerii: `${producent}:${id}`, np. "Egger:H1384 ST40". */
      dekor: string;
      /** Konkretny artykuł producenta (Egger) — gdy kilka formatów. */
      artykul?: string;
      /** Jawny wpis użytkownika, gdy producent nie podaje danych (np. Kronospan). */
      gruboscMM?: number;
      szerokoscArkuszaMM?: number;
      wysokoscArkuszaMM?: number;
      /** Blat: głębokość i długość handlowa [mm] wpisane przez użytkownika. */
      glebokoscMM?: number;
      dlugoscMM?: number;
      struktura?: string;
    };

export interface RozstrzygniecieStylu {
  rola: RolaStylu;
  material?: Material;
  /** Źródło grubości/formatu: artykuł producenta albo wpis użytkownika. */
  zrodlo?: string;
  /** Liczba innych pasujących artykułów (wybrano jeden deterministycznie). */
  alternatywy?: number;
  brak?: string;
}

export function znajdzDekor(klucz: string): Dekor | undefined {
  return DEKORY.find((d) => kluczDekoru(d) === klucz);
}

/** Płyta korpusu lub frontu z dekoru: artykuł o docelowej grubości, preferowany format 2800×2070. */
export function plytaZDekoru(rola: "korpus" | "front", w: Exclude<WyborMaterialu, { materialId: string }>, gruboscDocelowaMM: number): RozstrzygniecieStylu {
  const d = znajdzDekor(w.dekor);
  if (!d) return { rola, brak: `Nieznany dekor "${w.dekor}" — sprawdź galerię dekorów.` };
  const jawne = w.gruboscMM !== undefined || w.szerokoscArkuszaMM !== undefined || w.wysokoscArkuszaMM !== undefined;
  // Wszystkie brakujące dane w jednej odpowiedzi (OCENA-kreatora §4, zmiana 6): wymiary i struktura razem.
  const strukturaWpisana = w.struktura ?? (d.textures?.length === 1 ? d.textures[0] : undefined);
  const brakStruktury = !d.surface_label && !strukturaWpisana ? ` oraz strukturę (${(d.textures ?? []).join(", ") || "brak listy struktur"})` : "";
  try {
    if (w.artykul) return { rola, material: materialDekoru(w.dekor, { artykul: w.artykul, struktura: w.struktura }), zrodlo: `artykuł producenta ${w.artykul}` };
    if (jawne) {
      if (!(w.gruboscMM && w.szerokoscArkuszaMM && w.wysokoscArkuszaMM)) return { rola, brak: `${d.name}: podaj komplet — grubość, szerokość i wysokość arkusza${brakStruktury}.` };
      const struktura = w.struktura ?? (d.textures?.length === 1 ? d.textures[0] : undefined);
      if (!d.surface_label && !struktura) return { rola, brak: `${d.name}: wybierz strukturę (${(d.textures ?? []).join(", ") || "brak listy struktur"}).` };
      const m = materialDekoru(w.dekor, { gruboscMM: w.gruboscMM, szerokoscArkuszaMM: w.szerokoscArkuszaMM, wysokoscArkuszaMM: w.wysokoscArkuszaMM, struktura });
      return { rola, material: m, zrodlo: "wpis użytkownika (potwierdź u dostawcy)" };
    }
  } catch (e) {
    return { rola, brak: `${d.name}: ${(e as Error).message}` };
  }
  const warianty = wariantyDekoru(d);
  if (!warianty.length) return { rola, brak: `${d.name} (${d.manufacturer}): producent nie podaje grubości i formatu w danych katalogu — wymaga wpisania grubości/formatu${brakStruktury}.` };
  const pasujace = warianty.filter((x) => wymiaryWariantu(x).gruboscMM === gruboscDocelowaMM);
  if (!pasujace.length) {
    const grubosci = [...new Set(warianty.map((x) => wymiaryWariantu(x).gruboscMM))].sort((a, b) => a - b);
    return { rola, brak: `${d.name}: brak artykułu ${gruboscDocelowaMM} mm (dostępne: ${grubosci.join(", ")} mm) — wybierz artykuł albo wpisz grubość/format.` };
  }
  const wybrany = wybierzFormat(pasujace);
  return { rola, material: materialDekoru(w.dekor, { artykul: wybrany.article_id }), zrodlo: `artykuł producenta ${wybrany.article_id}`, alternatywy: pasujace.length - 1 };
}

function wybierzFormat(lista: WariantDekoru[]): WariantDekoru {
  const pole = (x: WariantDekoru) => {
    const w = wymiaryWariantu(x);
    return w.wysokoscArkuszaMM * w.szerokoscArkuszaMM;
  };
  const std = lista.filter((x) => {
    const w = wymiaryWariantu(x);
    return w.wysokoscArkuszaMM === 2800 && w.szerokoscArkuszaMM === 2070;
  });
  return [...(std.length ? std : lista)].sort((a, b) => pole(b) - pole(a) || a.article_id.localeCompare(b.article_id))[0];
}

/** Blat z dekoru: artykuł blatu roboczego (Egger PG_WORKTOPS) o grubości blatu z ustawień i głębokości ≥ głębokości blatu. */
export function blatZDekoru(w: Exclude<WyborMaterialu, { materialId: string }>, ust: { gruboscBlatuMM: number; glebokoscBlatuMM: number }): RozstrzygniecieStylu {
  const d = znajdzDekor(w.dekor);
  if (!d) return { rola: "blat", brak: `Nieznany dekor "${w.dekor}" — sprawdź galerię dekorów.` };
  const blaty = artykulyDekoru(d, "PG_WORKTOPS");
  let art: WariantDekoru | undefined;
  let wym: { gruboscMM: number; glebokoscMM: number; dlugoscMM: number };
  let zrodlo: string;
  let alternatywy = 0;
  if (w.artykul) {
    art = blaty.find((x) => x.article_id === w.artykul);
    if (!art) return { rola: "blat", brak: `${d.name}: artykuł ${w.artykul} nie jest blatem roboczym tego dekoru.` };
  } else if (w.gruboscMM !== undefined || w.glebokoscMM !== undefined || w.dlugoscMM !== undefined) {
    if (!(w.gruboscMM! > 0 && w.gruboscMM! <= 100 && w.glebokoscMM! > 0 && w.glebokoscMM! <= 3000 && w.dlugoscMM! > 0 && w.dlugoscMM! <= 6000))
      return { rola: "blat", brak: `${d.name}: podaj komplet — grubość (≤ 100), głębokość i długość blatu [mm].` };
  } else {
    const pasujace = blaty.filter((x) => {
      const v = wymiaryBlatu(x);
      return v.gruboscMM === ust.gruboscBlatuMM && v.glebokoscMM >= ust.glebokoscBlatuMM;
    });
    if (!pasujace.length) {
      const opis = blaty.length ? `dostępne: ${[...new Set(blaty.map((x) => `${wymiaryBlatu(x).gruboscMM}×${wymiaryBlatu(x).glebokoscMM}`))].join(", ")} mm` : "producent nie podaje blatów w tym dekorze w danych katalogu";
      return { rola: "blat", brak: `${d.name}: brak blatu ${ust.gruboscBlatuMM} mm o głębokości ≥ ${ust.glebokoscBlatuMM} mm (${opis}) — wymaga wpisania grubości/formatu.` };
    }
    art = pasujace.sort((a, b) => wymiaryBlatu(a).glebokoscMM - wymiaryBlatu(b).glebokoscMM || a.article_id.localeCompare(b.article_id))[0];
    alternatywy = pasujace.length - 1;
  }
  if (art) {
    wym = wymiaryBlatu(art);
    zrodlo = `artykuł producenta ${art.article_id}`;
  } else {
    wym = { gruboscMM: w.gruboscMM!, glebokoscMM: w.glebokoscMM!, dlugoscMM: w.dlugoscMM! };
    zrodlo = "wpis użytkownika (potwierdź u dostawcy)";
  }
  const struktura = d.surface_label ?? w.struktura ?? (d.textures?.length === 1 ? d.textures[0] : undefined);
  const kompakt = art?.product_label.toLowerCase().includes("kompakt") ?? false;
  const id = `dekor-blat-${createHash("sha256").update(JSON.stringify([w.dekor, art?.article_id, wym, struktura ?? null])).digest("hex").slice(0, 24)}`;
  const material: Material = {
    id,
    kod: d.id,
    nazwa: `Blat ${d.name}${struktura ? ` · ${struktura}` : ""} · ${wym.gruboscMM} mm`,
    producent: d.manufacturer,
    typ: kompakt ? "blatKompaktowy" : "blatLaminowany",
    dekor: d.name,
    kolekcja: d.collection,
    struktura,
    gruboscMM: wym.gruboscMM,
    szerokoscArkuszaMM: wym.glebokoscMM,
    wysokoscArkuszaMM: wym.dlugoscMM,
    jednostka: "metrBiezacy",
    cenaNetto: 0,
    vatProcent: 23,
    rabatProcent: 0,
    aktywny: true,
    kierunekDekoru: !!d.directional,
    kolorHEX: "#cccccc",
    zdjecieURL: obrazDekoru(d),
    zrodloKatalogu: d.source_url,
    artykulProducenta: art?.article_id,
    notatki: `${art ? `Artykuł producenta ${art.article_id}: ${art.product_label}, ${art.dimension_xy_source} × ${art.dimension_z_source} mm.` : "Wymiary blatu podane przez użytkownika — potwierdź u dostawcy."} Brak ceny zakupu — uzupełnij cennik. Źródło: ${d.source_url}.`,
  };
  return { rola: "blat", material, zrodlo, alternatywy };
}

/** Egger podaje blat jako „długość x głębokość” i grubość. */
export function wymiaryBlatu(w: WariantDekoru) {
  const v = wymiaryWariantu(w);
  return { dlugoscMM: v.wysokoscArkuszaMM, glebokoscMM: v.szerokoscArkuszaMM, gruboscMM: v.gruboscMM };
}
