import { zawiasyDlaWysokosci } from "./builder.js";
import { dobierzNL, otworyProwadnicy, profilSzuflady } from "./catalog/drawers.js";
import type {
  Czesc,
  Diagnostyka,
  DokumentacjaProjektu,
  Element,
  Formatka,
  Operacja,
  Powierzchnia,
  Projekt,
  ProwadnicaSzuflady,
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
    prowadnica: {
      id: "szuflada.prowadnica.s32@1",
      opis: `Otwór pod wkręt prowadnicy Ø${t.prowadnicaOtworSrednicaMM}×${t.prowadnicaOtworGlebokoscMM}, oś w rastrze 32 nad prowadnicą najniższej szuflady`,
      status: "robocza",
      zrodlo: "Wysokość i otwory z karty producenta (reguly-szuflad.json → runner_mounting); średnica otworu — profil zakładu",
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
  const prowadnice: ProwadnicaSzuflady[] = [];
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

    // --- Konfirmaty: płyty pionowe (boki, przegrody) ↔ wieńce, wzmocnienia i półki stałe ---
    // Płyta pozioma łączy się z tą płytą pionową, której lico dotyka jej końca (bok albo przegroda).
    const pionowe = zm.elementy.filter((e) => e.rola === "side" || e.rola === "divider");
    const obokX = (x: number, y: number) =>
      pionowe.filter((v) => (Math.abs(v.x + v.szer - x) < EPS || Math.abs(v.x - x) < EPS) && v.y - EPS <= y && y <= v.y + v.wys + EPS);
    const poziome = zm.elementy.filter((e) => e.rola === "bottom" || e.rola === "top" || e.rola === "reinforcement" || e.rola === "fixedShelf");
    for (const hz of poziome) {
      const yOs = hz.y + hz.wys / 2;
      for (const xKonca of [hz.x, hz.x + hz.szer]) {
        for (const b of obokX(xKonca, yOs)) {
          for (const dz of rozstaw(hz.gl, t.konfirmatOdKrawedziMM, t.konfirmatMaxRozstawMM)) {
            const z = hz.z + dz;
            const pol = `${cz.get(b.kod)?.etykieta ?? b.kod} ↔ ${cz.get(hz.kod)?.etykieta ?? hz.kod}`;
            dodaj(b.kod, [xKonca, yOs, z], { typ: "otwor", srednica: t.konfirmatSrednicaLicaMM, przelotowy: true, przeznaczenie: "Konfirmat — przelot w licu", polaczenie: pol, regula: R.konfirmat });
            dodaj(hz.kod, [xKonca, yOs, z], { typ: "otwor", srednica: t.konfirmatSrednicaKrawedziMM, glebokosc: t.konfirmatGlebokoscKrawedziMM, przeznaczenie: "Konfirmat — otwór w krawędzi", polaczenie: pol, regula: R.konfirmat });
          }
        }
      }
    }
    // Przegroda pionowa ↔ płyta pozioma nad nią i pod nią: przelot w licu płyty poziomej, otwór w krawędzi przegrody.
    for (const d of zm.elementy.filter((e) => e.rola === "divider")) {
      const xOs = d.x + d.szer / 2;
      for (const yKonca of [d.y, d.y + d.wys]) {
        const hz = poziome.find((h) => (Math.abs(h.y + h.wys - yKonca) < EPS || Math.abs(h.y - yKonca) < EPS) && h.x - EPS <= xOs && xOs <= h.x + h.szer + EPS);
        if (!hz) {
          brak("PRZEGRODA_BEZ_OPARCIA", [d.kod], `przegroda ${d.kod} nie opiera się na płycie ${yKonca === d.y ? "pod" : "nad"} nią.`);
          continue;
        }
        for (const dz of rozstaw(d.gl, t.konfirmatOdKrawedziMM, t.konfirmatMaxRozstawMM)) {
          const z = d.z + dz;
          const pol = `${cz.get(hz.kod)?.etykieta ?? hz.kod} ↔ ${cz.get(d.kod)?.etykieta ?? d.kod}`;
          dodaj(hz.kod, [xOs, yKonca, z], { typ: "otwor", srednica: t.konfirmatSrednicaLicaMM, przelotowy: true, przeznaczenie: "Konfirmat — przelot w licu", polaczenie: pol, regula: R.konfirmat });
          dodaj(d.kod, [xOs, yKonca, z], { typ: "otwor", srednica: t.konfirmatSrednicaKrawedziMM, glebokosc: t.konfirmatGlebokoscKrawedziMM, przeznaczenie: "Konfirmat — otwór w krawędzi", polaczenie: pol, regula: R.konfirmat });
        }
      }
    }

    // --- Podpórki półek (system 32) ---
    const rezerwaPlecow = m.konfiguracja.plecy ? ustawienia.konstrukcja.odsunieciePlecMM + ustawienia.konstrukcja.gruboscPlecHDFMM : 0;
    for (const polka of zm.elementy.filter((e) => e.rola === "shelf")) {
      const yBaza = polka.y - 7; // oś podpórki pod spodem półki
      const rzedy = [t.podporkaOdKrawedziMM, D - rezerwaPlecow - t.podporkaOdKrawedziMM];
      for (const licoBoku of [polka.x, polka.x + polka.szer]) {
        const b = obokX(licoBoku, polka.y)[0];
        if (!b) continue;
        for (const z of rzedy)
          for (const dy of [-t.rastrMM, 0, t.rastrMM])
            dodaj(b.kod, [licoBoku, yBaza + dy, z], { typ: "otwor", srednica: t.podporkaSrednicaMM, glebokosc: t.podporkaGlebokoscMM, przeznaczenie: "Podpórka półki", polaczenie: cz.get(polka.kod)?.etykieta, regula: R.podporka });
      }
      const c = cz.get(polka.kod);
      if (c) c.uwagi.push("Półka nastawna na podpórkach — bez wierceń.");
    }

    // --- Rowek pod plecy ---
    // Plecy w jednym kawałku albo (słupek z niszą AGD) PLECY-D pod niszą i PLECY-G nad nią — rowki także w półkach stałych.
    const kawalkiPlecow: [string, string, string][] = [
      ["PLECY", "WIENIEC-D", "WIENIEC-G"],
      ["PLECY-D", "WIENIEC-D", "POLKA-STALA"],
      ["PLECY-G", "POLKA-STALA-G", "WIENIEC-G"],
    ];
    for (const [kodPlecow, kodDol, kodGora] of kawalkiPlecow) {
    const plecy = el.get(kodPlecow);
    if (plecy) {
      const zRowka = plecy.z + plecy.gl / 2;
      const szerRowka = plecy.gl + 0.5;
      const rowki: { kod: string; od: V3; do: V3 }[] = [];
      for (const b of boki) {
        const lico = b.kod === "BOK-L" ? b.x + b.szer : b.x;
        // Rowek w boku przelotowy na całej wysokości — przy dzielonych plecach frezowany raz (pomijany dla PLECY-G).
        if (kodPlecow !== "PLECY-G") rowki.push({ kod: b.kod, od: [lico, b.y, zRowka], do: [lico, b.y + b.wys, zRowka] });
      }
      for (const kod of [kodDol, kodGora]) {
        const w = el.get(kod);
        if (!w) continue;
        const yl = kod === kodDol ? w.y + w.wys : w.y;
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
          polaczenie: cz.get(kodPlecow)?.etykieta,
          regula: R.rowek,
        });
      }
      const c = cz.get(kodPlecow);
      if (c) c.uwagi.push(kodPlecow === "PLECY" ? "Plecy wsuwane w rowek — bez wierceń." : "Plecy wsuwane w rowek — bez wierceń. Za piekarnikiem brak pleców (wentylacja, głębokość niszy).");
    }
    }

    // --- Zawiasy: puszki we frontach i prowadniki w bokach ---
    const drzwi = zm.elementy.filter((e) => e.kod.startsWith("FRONT-D"));
    drzwi.forEach((d, i) => {
      const lewy = d.stronaZawiasow ? d.stronaZawiasow === "lewa" : m.konstrukcja === "blindCorner" ? m.konfiguracja.stronaDrzwiNaroznika === "lewa" : drzwi.length === 1 ? true : i % 2 === 0;
      // Prowadnik na płycie pionowej przy krawędzi zawiasów: bok albo przegroda (skrzydła na komorach).
      const krawedz = lewy ? d.x : d.x + d.szer;
      const yS = d.y + d.wys / 2;
      const kandydaci = pionowe.filter((v) => v.y - EPS <= yS && yS <= v.y + v.wys + EPS && (lewy ? v.x <= krawedz + EPS : v.x + v.szer >= krawedz - EPS));
      const bok = kandydaci.sort((a, b) => (lewy ? b.x - a.x : a.x - b.x))[0] ?? (lewy ? bokL : bokP);
      const n = zawiasyDlaWysokosci(d.wys);
      const pozycje = n === 1 ? [d.wys / 2] : Array.from({ length: n }, (_, k) => t.zawiasOdKoncaFrontuMM + ((d.wys - 2 * t.zawiasOdKoncaFrontuMM) * k) / (n - 1));
      const xPuszki = lewy ? d.x + t.zawiasPuszkaOdKrawedziMM : d.x + d.szer - t.zawiasPuszkaOdKrawedziMM;
      for (const py of pozycje) {
        const y = d.y + py;
        const pol = `${cz.get(d.kod)?.etykieta} ↔ ${bok ? cz.get(bok.kod)?.etykieta : "?"}`;
        dodaj(d.kod, [xPuszki, y, d.z + d.gl], { typ: "otwor", srednica: t.zawiasPuszkaSrednicaMM, glebokosc: t.zawiasPuszkaGlebokoscMM, przeznaczenie: "Puszka zawiasu", polaczenie: pol, regula: R.puszka });
        if (bok) {
          const lico = lewy ? bok.x + bok.szer : bok.x;
          for (const dy of [-t.prowadnikRozstawMM / 2, t.prowadnikRozstawMM / 2])
            dodaj(bok.kod, [lico, y + dy, t.prowadnikOdFrontuMM], { typ: "otwor", srednica: t.prowadnikSrednicaMM, glebokosc: t.prowadnikGlebokoscMM, przeznaczenie: "Prowadnik zawiasu", polaczenie: pol, regula: R.prowadnik });
        } else {
          brak("ZAWIAS_BEZ_BOKU", [d.kod], `front ${d.kod} nie ma boku do montażu prowadnika.`);
        }
      }
    });

    // --- Szuflady: wysokości prowadnic w rastrze 32 i otwory z karty producenta ---
    // Szuflady z frontem (FRONT-SZ) i wewnętrzne za drzwiami (z silnika) leżą w jednym rastrze boku.
    const frontySzEl = zm.elementy.filter((e) => e.kod.startsWith("FRONT-SZ")).sort((a, b) => a.y - b.y);
    const frontySz = frontySzEl.map((e) => e.kod);
    const wewnetrzne = zm.szufladyWewnetrzne ?? [];
    if (frontySz.length || wewnetrzne.length) {
      const czesciSz = zm.elementy.filter((e) => /^S[ZW]\d/.test(e.kod)).map((e) => e.kod);
      if (m.konfiguracja.szufladySystemowe) {
        const idProfilu = m.konfiguracja.profilSzuflad ?? t.profilSzuflad;
        const pr = profilSzuflady(idProfilu);
        const NL = dobierzNL(D - rezerwaPlecow);
        const rm = pr?.runner_mounting;
        if (pr && rm && boki.length) {
          const dodatek = t.prowadniceMontowanePrzedKorpusem ? rm.premount_extra_mm ?? 0 : 0;
          const a = rm.axis_above_panel_min_mm + dodatek;
          const zrodlo = `${rm.source_id}, s.${rm.pdf_page_1based}`;
          const wpisy: WpisProwadnicy[] = [];
          if (frontySzEl.length && NL) wpisy.push(...minimaZFrontow(zm.elementy, frontySzEl, boki[0], a).map((q) => ({ ...q, NL, wewnetrzna: false })));
          else if (frontySzEl.length) brak("PROWADNICA_NL", boki.map((b) => b.kod), `głębokość korpusu za mała dla prowadnic ${pr.family}.`);
          for (const q of wewnetrzne) if (q.NL) wpisy.push({ kod: q.kod, min: q.podlogaY + a, sufit: q.sufitY, NL: q.NL, wewnetrzna: true });
          const wyniki = rastrujProwadnice(wpisy, t.rastrMM);
          for (const w of wyniki) {
            const przesuniecie = w.wewnetrzna ? pr.inner_drawer?.runner_holes_offset_mm ?? 0 : 0;
            const otwory = otworyProwadnicy(pr, w.NL)?.map((z) => z + przesuniecie);
            const uwagi: string[] = [];
            if (w.rastr === 0) uwagi.push(`Kotwica rastra: ${rm.axis_above_panel_min_mm}${dodatek ? ` + ${dodatek}` : ""} mm nad płytą pod szufladą (${zrodlo}).`);
            if (w.podniesienie > 0.05) uwagi.push(`Prowadnica ${f1(w.podniesienie)} mm wyżej niż minimum (dociągnięcie do rastra 32)${w.wewnetrzna ? "" : " — skrzynka wyżej względem frontu; otwory mocowania frontu mierz od skrzynki"}.`);
            if (rm.space_above_axis_min_mm !== undefined && w.wolneNadOsia < rm.space_above_axis_min_mm)
              uwagi.push(`Nad osią ${f1(w.wolneNadOsia)} mm, karta wymaga min. ${f1(rm.space_above_axis_min_mm)} mm (wysokość M) — sprawdź wysokość boku.`);
            const rodzaj = wewnetrzne.find((q) => q.kod === w.kod)?.rodzaj;
            if (w.wewnetrzna && pr.inner_drawer && rodzaj !== "ukrytaZaFrontem" && rodzaj !== "zZabierakiem")
              uwagi.push(`Szuflada wewnętrzna za drzwiami: otwory +${przesuniecie} mm względem standardu${pr.inner_drawer.first_hole_from_front_min_mm ? `, pierwszy min. ${pr.inner_drawer.first_hole_from_front_min_mm} od frontu korpusu` : ""} (${pr.inner_drawer.source_id}, s.${pr.inner_drawer.pdf_page_1based}).`);
            if (rodzaj === "ukrytaZaFrontem" || rodzaj === "zZabierakiem")
              uwagi.push(`Szuflada ukryta za frontem ${wewnetrzne.find((q) => q.kod === w.kod)?.frontKod?.replace("FRONT-", "")}${rodzaj === "zZabierakiem" ? ", sprzężona zabierakiem" : ", wysuwana osobno"}; prowadnica dociągnięta w dół do rastra 32 (${pr.inner_drawer?.source_id}, s.${pr.inner_drawer?.pdf_page_1based}).`);
            if (!otwory) uwagi.push("Otwory wzdłuż głębokości: producent nie podaje ich w karcie — montaż wg szablonu.");
            prowadnice.push({
              modulId: m.id,
              nazwaModulu: m.nazwa,
              szuflada: w.kod,
              profilId: pr.id,
              system: `${pr.manufacturer === "AMIX" ? "Amix" : pr.manufacturer === "BLUM" ? "Blum" : pr.manufacturer} ${pr.family}`,
              NL: w.NL,
              osOdDoluBokuMM: r1(w.os - boki[0].y),
              osMinimalnaMM: r1(w.min - boki[0].y),
              rastr: w.rastr,
              otworyOdFrontuMM: otwory,
              ...(w.wewnetrzna ? { wewnetrzna: true } : {}),
              zrodlo,
              uwagi,
            });
            if (w.kolizja) diagnostyka.push({ kod: "PROWADNICA_KOLIZJA", poziom: "blad", obiekty: boki.map((b) => cz.get(b.kod)?.id).filter(Boolean) as string[], opis: `${m.nazwa}: prowadnica ${w.kod} po dociągnięciu do rastra 32 wypada ponad strefą szuflady — zmień podział.` });
            for (const b of boki) {
              const lico = b.kod === "BOK-L" ? b.x + b.szer : b.x;
              for (const z of otwory ?? [])
                dodaj(b.kod, [lico, w.os, b.z + z], { typ: "otwor", srednica: t.prowadnicaOtworSrednicaMM, glebokosc: t.prowadnicaOtworGlebokoscMM, przeznaczenie: `Prowadnica ${w.kod}`, polaczenie: `${cz.get(b.kod)?.etykieta} ↔ ${w.kod}`, regula: { ...R.prowadnica, zrodlo: `${zrodlo}; ${R.prowadnica.zrodlo}` } });
            }
          }
          const moje = prowadnice.filter((q) => q.modulId === m.id);
          if (moje.length) {
            const opisBoku = `Prowadnice ${pr.family}, oś od dolnej krawędzi boku: ${moje.map((q) => `${q.szuflada} ${f1(q.osOdDoluBokuMM)}${q.wewnetrzna ? " (wewn., NL " + q.NL + ")" : ""}`).join(", ")} mm (raster ${t.rastrMM}).`;
            for (const b of boki) cz.get(b.kod)?.uwagi.push(opisBoku);
          }
          if (moje.some((q) => !q.otworyOdFrontuMM)) brak("PROWADNICA_OTWORY", boki.map((b) => b.kod), `${pr.manufacturer} ${pr.family}: wysokości prowadnic wyznaczone (${zrodlo}), ale karta nie podaje otworów wzdłuż głębokości.`, "Wpisz otwory z szablonu montażowego producenta albo montuj z szablonem.");
          if (wewnetrzne.length && !pr.inner_drawer)
            brak("SZUFLADA_WEWNETRZNA", [...boki.map((b) => b.kod), ...czesciSz.filter((k) => k.startsWith("SW"))], `${pr.manufacturer} ${pr.family}: profil nie ma danych szuflady wewnętrznej (głębokość, cofnięcie, front wewnętrzny) — użyto wymiarów szuflady z frontem.`, "Uzupełnij `inner_drawer` w reguly-szuflad.json z karty producenta.");
        } else if (!pr) {
          brak("SZUFLADA_WIERCENIA", boki.map((b) => b.kod), `nieznany profil szuflad „${idProfilu}” — brak wysokości prowadnic.`);
        }
        brak(
          "SZUFLADA_WIERCENIA",
          [...frontySz, ...czesciSz],
          pr
            ? `mocowanie frontów i pleców ${pr.manufacturer} ${pr.family} nie jest znormalizowane w profilu ${pr.id} (drilling_status=${pr.drilling_status}, źródło ${pr.source_id} s.${pr.pdf_page_1based}).`
            : `nieznany profil szuflad „${idProfilu}”.`,
          "Uzupełnij profil o operacje frontu i pleców z katalogu producenta i przypisz SKU.",
        );
        if (pr?.family === "LEGRABOX") brak("LEGRABOX_DNO", czesciSz.filter((k) => k.endsWith("DNO")), "dno LEGRABOX wymaga obróbki wg rysunku producenta — profil frezowania nieznormalizowany.");
      } else {
        brak("SZUFLADA_PROWADNICE", ["BOK-L", "BOK-P", ...frontySz, ...czesciSz], "skrzynki z płyty: nie wybrano systemu szuflad — brak wysokości prowadnic w rastrze 32 i połączeń skrzynki.", "Wybierz system szuflad w inspektorze szafki.");
      }
      for (const q of wewnetrzne.filter((x) => x.rodzaj === "zZabierakiem" && x.frontKod)) {
        const c = profilSzuflady(m.konfiguracja.profilSzuflad ?? t.profilSzuflad)?.inner_drawer?.coupler;
        brak("ZABIERAK_FRONT", [q.frontKod!], `front ${q.frontKod}: wiercenie${c?.front_drilling ? ` Ø${c.front_drilling.diameter_mm} (${c.front_drilling.horizontal})` : ""} pod obudowę zabieraka ${c?.part ?? ""} dla ${q.kod} — ${c?.front_drilling?.note ?? "brak danych"}.`, "Potwierdź położenie pionowe otworu z rysunku producenta.");
      }
      if (wewnetrzne.some((q) => !q.rodzaj || q.rodzaj === "zaDrzwiami")) {
        const drzwiKody = zm.elementy.filter((e) => e.kod.startsWith("FRONT-D")).map((e) => e.kod);
        brak("ZAWIAS_ZA_DRZWIAMI", drzwiKody, "szuflady wewnętrzne za drzwiami: zawias musi dawać zerowe wystawanie skrzydła w światło korpusu albo potrzebna jest listwa dystansowa — karta zawiasu nieprzypisana.", "Wybierz zawias z danymi wystawania (np. kąt 155°/170° lub zerowe wystawanie) albo dodaj listwę dystansową.");
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
    if (m.konfiguracja.kolka) {
      const k = m.konfiguracja.kolka;
      cz.get("WIENIEC-D")?.uwagi.push(`Kółka (${k.liczba} szt., w tym ${k.zHamulcem} z hamulcem, H${k.wysokoscMM}) przykręcane wkrętami do lica B, płytka min. 40 mm od krawędzi — bez wierceń. Nośność sprawdź z masą mebla z zawartością.`);
    } else if (m.konfiguracja.nogi) cz.get("WIENIEC-D")?.uwagi.push("Nogi przykręcane wkrętami do lica B — bez wierceń.");
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
    prowadnice,
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

interface WpisProwadnicy {
  kod: string;
  /** Minimalna oś prowadnicy (układ modułu) wg karty producenta. */
  min: number;
  /** Górna granica strefy szuflady (następna podłoga albo spód płyty powyżej). */
  sufit: number;
  NL: number;
  wewnetrzna: boolean;
}

/**
 * Minimalne osie prowadnic szuflad z frontem (od dołu). Najniższa: płyta pod szufladą + wymiar z karty. Wyższe: to samo
 * położenie względem własnego frontu (brak płyt między szufladami).
 */
export function minimaZFrontow(elementy: Element[], fronty: Element[], bok: Element, osNadPlyta: number) {
  const f0 = fronty[0];
  const plyty = elementy.filter((e) => ["bottom", "fixedShelf", "top", "rail", "reinforcement"].includes(e.rola) && e.y + e.wys <= bok.y + bok.wys + EPS);
  const podloga = Math.max(bok.y, ...plyty.map((e) => e.y + e.wys).filter((y) => y <= f0.y + f0.wys / 2));
  const podlogi = fronty.map((f) => podloga + (f.y - f0.y));
  return fronty.map((f, i) => {
    const min = podlogi[i] + osNadPlyta;
    const sufit = i + 1 < fronty.length ? podlogi[i + 1] : Math.min(bok.y + bok.wys, ...plyty.map((e) => e.y).filter((y) => y >= min));
    return { kod: f.kod.replace("FRONT-", ""), min, sufit };
  });
}

/**
 * Raster 32 na boku: kotwica = najniższa minimalna oś; każda prowadnica dociągnięta w górę do wielokrotności rastra
 * nad kotwicą — wszystkie leżą w jednej linii otworów systemu 32.
 */
export function rastrujProwadnice<T extends { kod: string; min: number; sufit: number }>(wpisy: T[], raster: number) {
  if (!wpisy.length) return [];
  const kotwica = Math.min(...wpisy.map((w) => w.min));
  return [...wpisy]
    .sort((a, b) => a.min - b.min)
    .map((w) => {
      const rastr = Math.max(0, Math.ceil((w.min - kotwica) / raster - 1e-6));
      const os = kotwica + rastr * raster;
      return { ...w, os, rastr, podniesienie: os - w.min, wolneNadOsia: w.sufit - os, kolizja: os >= w.sufit };
    });
}

function f1(v: number): string {
  return String(r1(v)).replace(".", ",");
}

function r1(v: number): number {
  return Math.round(v * 10) / 10;
}

export type { StatusCzesci };
