import { zawiasyDlaWysokosci } from "./builder.js";
import { profilSzuflady } from "./catalog/drawers.js";
import type {
  Czesc,
  Diagnostyka,
  DokumentacjaProjektu,
  Element,
  Formatka,
  Operacja,
  Powierzchnia,
  Projekt,
  RolaElementu,
  StatusCzesci,
  StatusReguly,
  UstawieniaStolarni,
  UstawieniaTechnologii,
  ZbudowanyModul,
  ZrodloReguly,
} from "./types.js";
import type { Uwaga } from "./validation.js";

// Generator dokumentacji produkcyjnej: części z lokalnym układem, połączenia i operacje.
// Operacje są wyznaczane raz w układzie modułu i przypisywane do łączonych części, dzięki czemu
// otwór w licu boku i otwór w krawędzi wieńca leżą na tej samej osi. Każda operacja ma źródło reguły
// i status weryfikacji; brak danych producenta daje diagnostykę „brakDanych” zamiast zgadywania.

export const WERSJA_GENERATORA = "dok-0.1.0";

type V3 = [number, number, number];
const EPS = 0.05;

// ---------- Lokalny układ części ----------

/** Indeksy osi modułu (0=X szerokość, 1=Y wysokość, 2=Z głębokość) dla długości, szerokości i grubości części. */
function osieRoli(rola: RolaElementu): { dl: number; sz: number; gr: number } {
  switch (rola) {
    case "side":
    case "divider":
    case "drawerSide":
      return { dl: 1, sz: 2, gr: 0 };
    case "top":
    case "bottom":
    case "shelf":
    case "fixedShelf":
    case "worktop":
    case "reinforcement":
    case "rail":
    case "drawerBottom":
      return { dl: 0, sz: 2, gr: 1 };
    default:
      return { dl: 1, sz: 0, gr: 2 };
  }
}

const jed = (i: number, s = 1): V3 => [0, 1, 2].map((k) => (k === i ? s : 0)) as V3;
const krzyz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const iloczyn = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const minus = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/**
 * Układ części: y wzdłuż szerokości od strony min (dla korpusu DA = krawędź przednia), n = normalna lica A
 * skierowana do wnętrza modułu, x = y × n (układ prawoskrętny — części lustrzane mają różne współrzędne).
 */
export function ukladCzesci(e: Element, W: number, H: number, D: number): Czesc["uklad"] {
  const a = osieRoli(e.rola);
  const min: V3 = [e.x, e.y, e.z];
  const max: V3 = [e.x + e.szer, e.y + e.wys, e.z + e.gl];
  const srodekModulu: V3 = [W / 2, H / 2, D / 2];
  const c = (min[a.gr] + max[a.gr]) / 2;
  let s = Math.sign(srodekModulu[a.gr] - c);
  if (e.rola === "shelf" || e.rola === "drawerBottom" || s === 0) s = 1; // półki i dna: A = góra
  const n = jed(a.gr, s);
  const y = jed(a.sz);
  const x = krzyz(y, n);
  const o: V3 = [0, 0, 0];
  o[a.dl] = x[a.dl] > 0 ? min[a.dl] : max[a.dl];
  o[a.sz] = min[a.sz];
  o[a.gr] = s > 0 ? min[a.gr] : max[a.gr];
  return { o, x, y, n };
}

export function doLokalnego(u: Czesc["uklad"], p: V3): V3 {
  const d = minus(p, u.o);
  return [iloczyn(d, u.x), iloczyn(d, u.y), iloczyn(d, u.n)];
}

/** Powierzchnia i współrzędne operacji na części wg konwencji z typu Operacja. */
function naPowierzchni(c: Czesc, p: V3): { pow: Powierzchnia; x: number; y: number } | null {
  const [x, y, z] = doLokalnego(c.uklad, p);
  const { dlugoscMM: L, szerokoscMM: S, gruboscMM: G } = c;
  if (Math.abs(z - G) < EPS) return { pow: "A", x, y };
  if (Math.abs(z) < EPS) return { pow: "B", x, y };
  if (Math.abs(y) < EPS) return { pow: "DA", x, y: z };
  if (Math.abs(y - S) < EPS) return { pow: "DB", x, y: z };
  if (Math.abs(x) < EPS) return { pow: "KA", x: y, y: z };
  if (Math.abs(x - L) < EPS) return { pow: "KB", x: y, y: z };
  return null;
}

/** Pozycje łączników na długości: od krawędzi `e`, rozstaw nie większy niż `max`. */
export function rozstaw(dl: number, e: number, max: number): number[] {
  const brzeg = Math.min(e, dl / 4);
  if (dl <= 2 * brzeg + 1) return [dl / 2];
  const odc = Math.max(1, Math.ceil((dl - 2 * brzeg) / max));
  return Array.from({ length: odc + 1 }, (_, i) => brzeg + ((dl - 2 * brzeg) * i) / odc);
}

// ---------- Reguły ----------

function reguly(t: UstawieniaTechnologii) {
  const st = (ok: boolean): StatusReguly => (ok ? "zatwierdzona" : "robocza");
  return {
    konfirmat: {
      id: "polaczenie.konfirmat@1",
      opis: `Konfirmat: lico Ø${t.konfirmatSrednicaLicaMM} przelot, krawędź Ø${t.konfirmatSrednicaKrawedziMM}×${t.konfirmatGlebokoscKrawedziMM}`,
      status: st(t.polaczeniaZatwierdzone),
      zrodlo: "Profil zakładu (Ustawienia → Technologia)",
    },
    podporka: {
      id: "polka.podporka@1",
      opis: `Podpórka półki Ø${t.podporkaSrednicaMM}×${t.podporkaGlebokoscMM}, raster ${t.rastrMM}`,
      status: st(t.podporkiZatwierdzone),
      zrodlo: "Profil zakładu — system 32",
    },
    rowek: {
      id: "plecy.rowek@1",
      opis: `Rowek pod plecy, głębokość ${t.rowekGlebokoscMM}`,
      status: st(t.rowekZatwierdzony),
      zrodlo: "Profil zakładu",
    },
    puszka: {
      id: "zawias.puszka35@1",
      opis: `Puszka zawiasu Ø${t.zawiasPuszkaSrednicaMM}×${t.zawiasPuszkaGlebokoscMM}, oś ${t.zawiasPuszkaOdKrawedziMM} od krawędzi`,
      status: st(t.zawiasyZatwierdzone),
      zrodlo: "Zawias puszkowy Ø35 (np. Blum CLIP top) — do weryfikacji z katalogiem producenta",
    },
    prowadnik: {
      id: "zawias.prowadnik.s32@1",
      opis: `Prowadnik zawiasu: 2× Ø${t.prowadnikSrednicaMM}×${t.prowadnikGlebokoscMM}, ${t.prowadnikOdFrontuMM} od frontu, rozstaw ${t.prowadnikRozstawMM}`,
      status: st(t.zawiasyZatwierdzone),
      zrodlo: "Prowadnik w systemie 32 — do weryfikacji z katalogiem producenta",
    },
  } satisfies Record<string, ZrodloReguly>;
}

// ---------- Generator ----------

export interface WejscieDokumentacji {
  projekt: Projekt;
  zbudowane: ZbudowanyModul[];
  formatki: Formatka[];
  ustawienia: UstawieniaStolarni;
  walidacja: Uwaga[];
}

export function dokumentacjaProjektu({ projekt, zbudowane, formatki, ustawienia, walidacja }: WejscieDokumentacji): DokumentacjaProjektu {
  const t = ustawienia.technologia;
  const R = reguly(t);
  const diagnostyka: Diagnostyka[] = [];
  const czesci: Czesc[] = [];
  const poFormatce = new Map(formatki.map((f) => [f.id, f]));

  for (const zm of zbudowane) {
    const m = zm.modul;
    const { szerokoscMM: W, wysokoscMM: H, glebokoscMM: D } = m;
    const el = new Map(zm.elementy.map((e) => [e.kod, e]));
    const cz = new Map<string, Czesc>();

    for (const e of zm.elementy) {
      const f = poFormatce.get(`${m.id}|${e.kod}`);
      if (!f) continue;
      const c: Czesc = {
        id: f.id,
        etykieta: f.etykieta,
        modulId: m.id,
        nazwaModulu: m.nazwa,
        kodElementu: e.kod,
        rola: e.rola,
        materialId: f.materialId,
        materialOpis: f.materialOpis,
        dlugoscMM: f.dlugoscMM,
        szerokoscMM: f.szerokoscMM,
        gruboscMM: f.gruboscMM,
        dlugoscCieciaMM: f.dlugoscCieciaMM,
        szerokoscCieciaMM: f.szerokoscCieciaMM,
        obrzeza: f.obrzeza,
        kierunekDekoru: f.kierunekDekoru,
        uklad: ukladCzesci(e, W, H, D),
        operacje: [],
        bezWiercen: false,
        kupowana: e.rola === "worktop",
        status: "gotowa",
        uwagi: [],
        podpis: "",
      };
      cz.set(e.kod, c);
      czesci.push(c);
    }

    const dodaj = (kod: string, p: V3, o: Omit<Operacja, "id" | "czescId" | "powierzchnia" | "x" | "y">) => {
      const c = cz.get(kod);
      if (!c) return;
      const s = naPowierzchni(c, p);
      if (!s) {
        diagnostyka.push({ kod: "OP_POZA_CZESCIA", poziom: "blad", obiekty: [c.id], opis: `${c.etykieta}: operacja „${o.przeznaczenie}” nie leży na powierzchni części (błąd reguły).` });
        return;
      }
      c.operacje.push({ id: `${c.id}#${c.operacje.length + 1}`, czescId: c.id, powierzchnia: s.pow, x: r1(s.x), y: r1(s.y), ...o });
    };
    const brak = (kod: string, obiekty: string[], opis: string, poprawa?: string) => {
      const ids = obiekty.map((k) => cz.get(k)?.id).filter(Boolean) as string[];
      if (ids.length) diagnostyka.push({ kod, poziom: "brakDanych", obiekty: ids, opis: `${m.nazwa}: ${opis}`, poprawa });
    };

    const bokL = el.get("BOK-L");
    const bokP = el.get("BOK-P");
    const boki = [bokL, bokP].filter(Boolean) as Element[];

    // --- Konfirmaty: boki ↔ wieńce i wzmocnienia ---
    for (const hz of zm.elementy.filter((e) => e.rola === "bottom" || e.rola === "top" || e.rola === "reinforcement" || e.rola === "fixedShelf")) {
      const yOs = hz.y + hz.wys / 2;
      for (const b of boki) {
        const lewy = b.kod === "BOK-L";
        const licoBoku = lewy ? b.x + b.szer : b.x;
        for (const dz of rozstaw(hz.gl, t.konfirmatOdKrawedziMM, t.konfirmatMaxRozstawMM)) {
          const z = hz.z + dz;
          const pol = `${cz.get(b.kod)?.etykieta ?? b.kod} ↔ ${cz.get(hz.kod)?.etykieta ?? hz.kod}`;
          dodaj(b.kod, [licoBoku, yOs, z], { typ: "otwor", srednica: t.konfirmatSrednicaLicaMM, przelotowy: true, przeznaczenie: "Konfirmat — przelot w licu", polaczenie: pol, regula: R.konfirmat });
          dodaj(hz.kod, [licoBoku, yOs, z], { typ: "otwor", srednica: t.konfirmatSrednicaKrawedziMM, glebokosc: t.konfirmatGlebokoscKrawedziMM, przeznaczenie: "Konfirmat — otwór w krawędzi", polaczenie: pol, regula: R.konfirmat });
        }
      }
    }

    // --- Podpórki półek (system 32) ---
    const rezerwaPlecow = m.konfiguracja.plecy ? ustawienia.konstrukcja.odsunieciePlecMM + ustawienia.konstrukcja.gruboscPlecHDFMM : 0;
    for (const polka of zm.elementy.filter((e) => e.rola === "shelf")) {
      const yBaza = polka.y - 7; // oś podpórki pod spodem półki
      const rzedy = [t.podporkaOdKrawedziMM, D - rezerwaPlecow - t.podporkaOdKrawedziMM];
      for (const b of boki) {
        const licoBoku = b.kod === "BOK-L" ? b.x + b.szer : b.x;
        for (const z of rzedy)
          for (const dy of [-t.rastrMM, 0, t.rastrMM])
            dodaj(b.kod, [licoBoku, yBaza + dy, z], { typ: "otwor", srednica: t.podporkaSrednicaMM, glebokosc: t.podporkaGlebokoscMM, przeznaczenie: "Podpórka półki", polaczenie: cz.get(polka.kod)?.etykieta, regula: R.podporka });
      }
      const c = cz.get(polka.kod);
      if (c) c.uwagi.push("Półka nastawna na podpórkach — bez wierceń.");
    }

    // --- Rowek pod plecy ---
    const plecy = el.get("PLECY");
    if (plecy) {
      const zRowka = plecy.z + plecy.gl / 2;
      const szerRowka = plecy.gl + 0.5;
      const rowki: { kod: string; od: V3; do: V3 }[] = [];
      for (const b of boki) {
        const lico = b.kod === "BOK-L" ? b.x + b.szer : b.x;
        rowki.push({ kod: b.kod, od: [lico, b.y, zRowka], do: [lico, b.y + b.wys, zRowka] });
      }
      for (const kod of ["WIENIEC-D", "WIENIEC-G"]) {
        const w = el.get(kod);
        if (!w) continue;
        const yl = kod === "WIENIEC-D" ? w.y + w.wys : w.y;
        rowki.push({ kod, od: [w.x, yl, zRowka], do: [w.x + w.szer, yl, zRowka] });
      }
      for (const r of rowki) {
        const c = cz.get(r.kod);
        if (!c) continue;
        const a = naPowierzchni(c, r.od);
        const b = naPowierzchni(c, r.do);
        if (!a || !b) continue;
        const osX = Math.abs(a.x - b.x) > Math.abs(a.y - b.y);
        c.operacje.push({
          id: `${c.id}#${c.operacje.length + 1}`,
          czescId: c.id,
          typ: "rowek",
          powierzchnia: a.pow,
          x: r1(Math.min(a.x, b.x)),
          y: r1(Math.min(a.y, b.y)),
          dlugosc: r1(Math.abs(osX ? b.x - a.x : b.y - a.y)),
          szerokosc: szerRowka,
          glebokosc: t.rowekGlebokoscMM,
          osRowka: osX ? "x" : "y",
          przeznaczenie: "Rowek pod plecy HDF (przelotowy na długości)",
          polaczenie: cz.get("PLECY")?.etykieta,
          regula: R.rowek,
        });
      }
      const c = cz.get("PLECY");
      if (c) c.uwagi.push("Plecy wsuwane w rowek — bez wierceń.");
    }

    // --- Zawiasy: puszki we frontach i prowadniki w bokach ---
    const drzwi = zm.elementy.filter((e) => e.kod.startsWith("FRONT-D"));
    drzwi.forEach((d, i) => {
      const lewy = m.konstrukcja === "blindCorner" ? m.konfiguracja.stronaDrzwiNaroznika === "lewa" : drzwi.length === 1 ? true : i % 2 === 0;
      const bok = lewy ? bokL : bokP;
      const n = zawiasyDlaWysokosci(d.wys);
      const pozycje = n === 1 ? [d.wys / 2] : Array.from({ length: n }, (_, k) => t.zawiasOdKoncaFrontuMM + ((d.wys - 2 * t.zawiasOdKoncaFrontuMM) * k) / (n - 1));
      const xPuszki = lewy ? d.x + t.zawiasPuszkaOdKrawedziMM : d.x + d.szer - t.zawiasPuszkaOdKrawedziMM;
      for (const py of pozycje) {
        const y = d.y + py;
        const pol = `${cz.get(d.kod)?.etykieta} ↔ ${bok ? cz.get(bok.kod)?.etykieta : "?"}`;
        dodaj(d.kod, [xPuszki, y, d.z + d.gl], { typ: "otwor", srednica: t.zawiasPuszkaSrednicaMM, glebokosc: t.zawiasPuszkaGlebokoscMM, przeznaczenie: "Puszka zawiasu", polaczenie: pol, regula: R.puszka });
        if (bok) {
          const lico = bok.kod === "BOK-L" ? bok.x + bok.szer : bok.x;
          for (const dy of [-t.prowadnikRozstawMM / 2, t.prowadnikRozstawMM / 2])
            dodaj(bok.kod, [lico, y + dy, t.prowadnikOdFrontuMM], { typ: "otwor", srednica: t.prowadnikSrednicaMM, glebokosc: t.prowadnikGlebokoscMM, przeznaczenie: "Prowadnik zawiasu", polaczenie: pol, regula: R.prowadnik });
        } else {
          brak("ZAWIAS_BEZ_BOKU", [d.kod], `front ${d.kod} nie ma boku do montażu prowadnika.`);
        }
      }
    });

    // --- Szuflady: wiercenia prowadnic nie są znormalizowane (reguly-szuflad.json) ---
    const frontySz = zm.elementy.filter((e) => e.kod.startsWith("FRONT-SZ")).map((e) => e.kod);
    if (frontySz.length) {
      const czesciSz = zm.elementy.filter((e) => e.kod.startsWith("SZ")).map((e) => e.kod);
      if (m.konfiguracja.szufladySystemowe) {
        const pr = profilSzuflady(t.profilSzuflad);
        brak(
          "SZUFLADA_WIERCENIA",
          ["BOK-L", "BOK-P", ...frontySz, ...czesciSz],
          pr
            ? `wiercenia prowadnic ${pr.manufacturer} ${pr.family} w bokach, mocowanie frontu i pleców nie są znormalizowane (profil ${pr.id}: drilling_status=${pr.drilling_status}, źródło ${pr.source_id} s.${pr.pdf_page_1based}).`
            : `nieznany profil szuflad „${t.profilSzuflad}”.`,
          "Uzupełnij profil o operacje z katalogu producenta i przypisz SKU prowadnic.",
        );
        if (pr?.family === "LEGRABOX") brak("LEGRABOX_DNO", czesciSz.filter((k) => k.endsWith("DNO")), "dno LEGRABOX wymaga obróbki wg rysunku producenta — profil frezowania nieznormalizowany.");
      } else {
        brak("SZUFLADA_PROWADNICE", ["BOK-L", "BOK-P", ...frontySz, ...czesciSz], "skrzynki z płyty: nie wybrano SKU prowadnic — brak pozycji wierceń i połączeń skrzynki.", "Wybierz system szuflad lub prowadnicę z danymi montażowymi.");
      }
    }

    // --- Pozostałe okucia bez danych montażowych ---
    if (m.konfiguracja.typFrontu === "uchylny") brak("PODNOSNIK", ["BOK-L", "BOK-P", "FRONT-U01"], "podnośnik frontu: brak SKU i danych montażowych (siła, otwory w bokach i froncie).");
    if (m.konfiguracja.systemNarozny === "lemans")
      brak("LEMANS", ["BOK-L", "BOK-P", "WIENIEC-D", "WIENIEC-G"], "LeMans II: pozycje otworów mocowania kolumny i prowadnic wg szablonu producenta (instrukcja MA 402118) — nieprzeniesione do reguł.", "Wpisz operacje z szablonu montażowego LeMans albo montuj z szablonem na budowie.");
    if (m.konfiguracja.liczbaCargo > 0) brak("CARGO", ["BOK-L", "BOK-P", "WIENIEC-D"], "cargo: brak SKU i danych montażowych.");
    // Nadstawka (kategoria tall nad podłogą) stoi na słupku — łączona wkrętami przez wieńce, bez zawieszek.
    if (m.kategoria === "tall" && m.pozycjaYMM >= 1000) cz.get("WIENIEC-D")?.uwagi.push("Nadstawka skręcana z wieńcem górnym słupka wkrętami — bez wierceń.");
    else if (m.pozycjaYMM >= 1000 && boki.length) brak("ZAWIESZKI", boki.map((b) => b.kod), "zawieszki szafki wiszącej: brak SKU — otwory/wycięcia w bokach nieustalone.");
    const zUchwytem = zm.elementy.filter((e) => e.rola === "front" && e.kod !== "FRONT-AGD").map((e) => e.kod);
    if (zUchwytem.length) brak("UCHWYT", zUchwytem, "uchwyty: brak SKU (rozstaw otworów i pozycja na froncie nieustalone).", "Wybierz uchwyt lub mechanizm bezuchwytowy.");
    if (m.konstrukcja === "sink" || m.konstrukcja === "oven") brak("BLAT_WYCIECIE", ["BLAT"], `wycięcie w blacie pod ${m.konstrukcja === "sink" ? "zlew" : "płytę grzewczą"} — wymaga modelu urządzenia.`);
    if (m.konstrukcja === "filler") cz.get("BLENDA")?.uwagi.push("Blenda mocowana wkrętami przez bok sąsiedniej szafki — bez wierceń.");
    if (m.konfiguracja.nogi) cz.get("WIENIEC-D")?.uwagi.push("Nogi przykręcane wkrętami do lica B — bez wierceń.");
  }

  // Walidacja projektu (kolizje, normy) → diagnostyka
  for (const u of walidacja) {
    diagnostyka.push({
      kod: u.komunikat.startsWith("Kolizja") ? "KOLIZJA" : "WALIDACJA",
      poziom: u.poziom === "blad" ? "blad" : u.poziom === "ostrzezenie" ? "ostrzezenie" : "info",
      obiekty: u.modulId ? czesci.filter((c) => c.modulId === u.modulId).map((c) => c.id) : [],
      opis: u.komunikat,
    });
  }
  if (czesci.some((c) => c.operacje.some((o) => o.przeznaczenie === "Puszka zawiasu")))
    diagnostyka.push({
      kod: "ZAWIASY_LICZBA",
      poziom: "niesprawdzone",
      obiekty: [],
      opis: "Liczba zawiasów dobrana progami wysokości frontu — wymaga potwierdzenia wg masy i wymiarów frontu w katalogu producenta.",
    });

  // Statusy części
  const zBrakiem = new Set(diagnostyka.filter((d) => d.poziom === "brakDanych" || d.poziom === "blad").flatMap((d) => d.obiekty));
  for (const c of czesci) {
    c.bezWiercen = c.operacje.length === 0 && !zBrakiem.has(c.id);
    c.status = zBrakiem.has(c.id) ? "brakDanych" : c.operacje.some((o) => o.regula.status !== "zatwierdzona") ? "robocza" : "gotowa";
    if (c.bezWiercen && !c.uwagi.length) c.uwagi.push(c.kupowana ? "Część kupowana na wymiar — bez wierceń w zakładzie." : "Bez wierceń.");
    c.podpis = podpis(c);
  }

  const grupy = new Map<string, string[]>();
  for (const c of czesci) grupy.set(c.podpis, [...(grupy.get(c.podpis) ?? []), c.id]);
  const podsumowanie = { gotowa: 0, robocza: 0, brakDanych: 0, operacje: 0, bezWiercen: 0 } as DokumentacjaProjektu["podsumowanie"];
  for (const c of czesci) {
    podsumowanie[c.status] += 1;
    podsumowanie.operacje += c.operacje.length;
    if (c.bezWiercen) podsumowanie.bezWiercen += 1;
  }

  return {
    projektId: projekt.id,
    nazwaProjektu: projekt.nazwa,
    rewizja: projekt.rewizja,
    wygenerowano: new Date().toISOString(),
    wersjaGeneratora: WERSJA_GENERATORA,
    czesci,
    diagnostyka,
    pozycjeProdukcyjne: [...grupy.entries()].map(([p, ids]) => ({ podpis: p, ilosc: ids.length, czesci: ids })),
    gotowaDoProdukcji: czesci.length > 0 && czesci.every((c) => c.status === "gotowa") && !diagnostyka.some((d) => d.poziom === "blad" || d.poziom === "brakDanych" || d.poziom === "niesprawdzone"),
    podsumowanie,
  };
}

/** Podpis produkcyjny: materiał, wymiary cięcia, obrzeża, usłojenie i komplet operacji w układzie części. */
function podpis(c: Czesc): string {
  const ops = c.operacje
    .map((o) => [o.typ, o.powierzchnia, o.x, o.y, o.srednica ?? "", o.glebokosc ?? (o.przelotowy ? "P" : ""), o.dlugosc ?? "", o.szerokosc ?? ""].join(":"))
    .sort()
    .join(",");
  return [c.materialId, c.gruboscMM, c.dlugoscCieciaMM, c.szerokoscCieciaMM, c.obrzeza.join("/"), c.kierunekDekoru, ops].join("|");
}

function r1(v: number): number {
  return Math.round(v * 10) / 10;
}

export type { StatusCzesci };
