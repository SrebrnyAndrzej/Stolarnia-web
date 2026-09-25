import type { UstawieniaKonstrukcyjne } from "../types.js";
import { ukladFrontow, ukladWnetrza } from "./budowa.js";
import type { Mebel, PoleFrontu, StrefaWnetrza } from "./model.js";

// Polecenia edycji mebla na drzewie konstrukcji. Każde zwraca nowy mebel (bez mutacji wejścia) i uwagi dla użytkownika,
// a sprzeczne żądanie kończy się czytelnym błędem zamiast ujemnej formatki.

export class BladPolecenia extends Error {}

export interface WynikPolecenia {
  mebel: Mebel;
  uwagi: string[];
}

/** Minimalna wysokość frontu szuflady [mm] — poniżej prowadnice i skrzynka się nie mieszczą (reguła robocza). */
const MIN_FRONT_SZUFLADY_MM = 100;

/**
 * Zamienia drzwi (pojedyncze albo rząd skrzydeł) na stos N frontów szuflad o równej wysokości.
 * Wnętrze za frontem: półki nastawne są usuwane (strefa pusta), powstają wysuwy „z frontem”, cargo za drzwiami znika.
 */
export function zamienDrzwiNaSzuflady(
  wejscie: Mebel,
  k: UstawieniaKonstrukcyjne,
  opcje: { liczba: number; poleId?: string },
): WynikPolecenia {
  const n = Math.round(opcje.liczba);
  if (!(n >= 1 && n <= 8)) throw new BladPolecenia("Liczba szuflad musi być w zakresie 1–8.");
  if (wejscie.korpus.rodzaj !== "korpus") throw new BladPolecenia("Szuflady wymagają korpusu.");
  const mebel: Mebel = structuredClone(wejscie);
  const gap = k.szczelinaFrontowMM;
  const uklad = ukladFrontow(mebel.fronty, mebel.szerokoscMM, mebel.wysokoscMM, gap);

  // Pole do zamiany: wskazane albo jedyne pole z drzwiami (rząd skrzydeł = wspólny rodzic).
  const zDrzwiami = [...uklad.values()].filter((u) => u.pole.front?.typ === "drzwi");
  let cel: PoleFrontu | undefined;
  if (opcje.poleId) {
    cel = uklad.get(opcje.poleId)?.pole;
    if (!cel) throw new BladPolecenia(`Nie ma pola frontu „${opcje.poleId}”.`);
    const dzieci = cel.podzial ? cel.podzial.czesci : [cel];
    if (!dzieci.every((c) => c.front?.typ === "drzwi")) throw new BladPolecenia("Wskazane pole nie zawiera wyłącznie drzwi.");
  } else if (zDrzwiami.length === 1) {
    cel = zDrzwiami[0].pole;
  } else if (zDrzwiami.length > 1) {
    const rodzic = [...uklad.values()].find((u) => u.pole.podzial?.czesci.every((c) => c.front?.typ === "drzwi") && u.pole.podzial.czesci.length === zDrzwiami.length);
    if (!rodzic) throw new BladPolecenia("Mebel ma kilka pól z drzwiami — wskaż, które zamienić (poleId).");
    cel = rodzic.pole;
  }
  if (!cel) throw new BladPolecenia("Mebel nie ma drzwi do zamiany.");
  const u = uklad.get(cel.id)!;

  // Równe fronty w polu: skrajne pola mają szczeliny odziedziczone po polu, między szufladami — wspólna szczelina.
  const netto = u.obszar.h - u.szczeliny.d - u.szczeliny.g - gap * (n - 1);
  const h = netto / n;
  if (h < MIN_FRONT_SZUFLADY_MM) throw new BladPolecenia(`Front szuflady miałby ${Math.round(h)} mm — minimum ${MIN_FRONT_SZUFLADY_MM} mm. Zmniejsz liczbę szuflad.`);
  const juz = new Set<string>();
  const zbierz = (p: PoleFrontu) => {
    if (p.front && "kod" in p.front) juz.add(p.front.kod);
    p.podzial?.czesci.forEach(zbierz);
  };
  zbierz(mebel.fronty);
  let nr = 0;
  const nowyKod = () => {
    let kod: string;
    do kod = `FRONT-SZ${pad(++nr)}`;
    while (juz.has(kod));
    juz.add(kod);
    return kod;
  };
  const sloty = Array.from({ length: n }, (_, i) => (i === 0 ? u.szczeliny.d : gap / 2) + h + (i === n - 1 ? u.szczeliny.g : gap / 2));
  const czesci: PoleFrontu[] = sloty.map((s, i) => ({ id: `${cel!.id}-sz${i + 1}`, rozmiar: { mm: s }, front: { typ: "szuflada", kod: nowyKod() } }));

  // Podmiana w drzewie (rozmiar pola w rodzicu zostaje). Pole ma zachować szczeliny od rodzica, dlatego stos jest jego podziałem.
  const zastap = (p: PoleFrontu): PoleFrontu =>
    p.id === cel!.id
      ? { id: p.id, rozmiar: p.rozmiar, podzial: { kierunek: "poziom", szczelinaWspolna: true, czesci } }
      : p.podzial
        ? { ...p, podzial: { ...p.podzial, czesci: p.podzial.czesci.map(zastap) } }
        : p;
  mebel.fronty = zastap(mebel.fronty);

  // Wnętrze za frontem: liście stref, które zachodzą na pole frontu w pionie — bez półek nastawnych.
  const uwagi: string[] = [];
  const t = k.gruboscPlytyKorpusuMM;
  const wnetrze = ukladWnetrza(mebel.wnetrze, mebel.szerokoscMM, mebel.wysokoscMM, t);
  const y0 = u.obszar.y;
  const y1 = u.obszar.y + u.obszar.h;
  const liscie = [...wnetrze.values()].filter((s) => !s.strefa.podzial && s.y < y1 && s.y + s.h > y0);
  const docelowa = liscie.sort((a, b) => Math.min(b.y + b.h, y1) - Math.max(b.y, y0) - (Math.min(a.y + a.h, y1) - Math.max(a.y, y0)))[0];
  if (!docelowa) throw new BladPolecenia("Brak strefy wnętrza za frontem.");
  const wyczysc = (s: StrefaWnetrza): StrefaWnetrza => {
    if (liscie.some((l) => l.strefa.id === s.id)) {
      if (s.wyposazenie?.typ === "polki" && s.wyposazenie.liczba > 0) uwagi.push(`Usunięto ${s.wyposazenie.liczba} półk${s.wyposazenie.liczba === 1 ? "ę" : "i"} nastawne za frontem.`);
      if (s.wyposazenie?.typ === "nisza") throw new BladPolecenia("Za tym frontem jest nisza urządzenia — szuflady w niej się nie zmieszczą.");
      return { ...s, wyposazenie: { typ: "pusta" } };
    }
    return s.podzial ? { ...s, podzial: { ...s.podzial, czesci: s.podzial.czesci.map(wyczysc) } } : s;
  };
  mebel.wnetrze = wyczysc(mebel.wnetrze);

  let nrW = mebel.wysuwy.reduce((mx, w) => Math.max(mx, Number(w.kod.replace(/\D/g, "")) || 0), 0);
  for (const c of czesci) mebel.wysuwy.push({ id: `wysuw-${c.id}`, kod: `SZ${pad(++nrW)}`, poleFrontuId: c.id, strefaId: docelowa.strefa.id, powiazanie: "zFrontem" });
  if (mebel.dodatki.cargo) {
    uwagi.push("Usunięto cargo — kolidowało z szufladami.");
    mebel.dodatki = { ...mebel.dodatki, cargo: undefined };
  }
  uwagi.push(`Drzwi zamienione na ${n} szuflad${n === 1 ? "ę" : n < 5 ? "y" : ""} po ${Math.round(h * 10) / 10} mm.`);
  return { mebel, uwagi };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Domyślna wysokość strefy jednej szuflady wewnętrznej [mm] — mieści H116 Amix (komora min. 144). */
const STREFA_SZUFLADY_WEWNETRZNEJ_MM = 160;

/**
 * Dodaje N szuflad wewnętrznych za drzwiami: dolna część strefy za drzwiami dzieli się na N stref (bez płyt między nimi),
 * każda z wysuwem „zaDrzwiami”. Półki nastawne zostają nad szufladami. Drzwi i zawiasy bez zmian — wymagania zawiasu
 * (zerowe wystawanie / listwa dystansowa) zgłasza silnik.
 */
export function dodajSzufladyZaDrzwiami(
  wejscie: Mebel,
  k: UstawieniaKonstrukcyjne,
  opcje: { liczba: number; wysokoscMM?: number; poleId?: string },
): WynikPolecenia {
  const n = Math.round(opcje.liczba);
  if (!(n >= 1 && n <= 6)) throw new BladPolecenia("Liczba szuflad wewnętrznych musi być w zakresie 1–6.");
  if (wejscie.korpus.rodzaj !== "korpus") throw new BladPolecenia("Szuflady wymagają korpusu.");
  const h = opcje.wysokoscMM ?? STREFA_SZUFLADY_WEWNETRZNEJ_MM;
  if (!(h >= 100)) throw new BladPolecenia("Strefa szuflady wewnętrznej musi mieć co najmniej 100 mm.");
  const mebel: Mebel = structuredClone(wejscie);
  const uklad = ukladFrontow(mebel.fronty, mebel.szerokoscMM, mebel.wysokoscMM, k.szczelinaFrontowMM);
  const zDrzwiami = [...uklad.values()].filter((u) => u.pole.front?.typ === "drzwi");
  const cel = opcje.poleId ? uklad.get(opcje.poleId) : zDrzwiami[0];
  if (!cel) throw new BladPolecenia(opcje.poleId ? `Nie ma pola frontu „${opcje.poleId}”.` : "Mebel nie ma drzwi, za którymi można dodać szuflady.");
  if (!opcje.poleId && zDrzwiami.length > 1 && !zDrzwiami.every((u) => Math.abs(u.obszar.y - cel.obszar.y) < 1 && Math.abs(u.obszar.h - cel.obszar.h) < 1))
    throw new BladPolecenia("Mebel ma drzwi na różnych wysokościach — wskaż, za którymi dodać szuflady (poleId).");

  // Strefa wnętrza za drzwiami: liść o największym pokryciu wysokości drzwi.
  const t = k.gruboscPlytyKorpusuMM;
  const wnetrze = ukladWnetrza(mebel.wnetrze, mebel.szerokoscMM, mebel.wysokoscMM, t);
  const y0 = cel.obszar.y;
  const y1 = cel.obszar.y + cel.obszar.h;
  const pokrycie = (s: { y: number; h: number }) => Math.min(s.y + s.h, y1) - Math.max(s.y, y0);
  const docelowa = [...wnetrze.values()].filter((s) => !s.strefa.podzial && pokrycie(s) > 0).sort((a, b) => pokrycie(b) - pokrycie(a))[0];
  if (!docelowa) throw new BladPolecenia("Brak strefy wnętrza za drzwiami.");
  const wyp = docelowa.strefa.wyposazenie;
  if (wyp?.typ === "nisza") throw new BladPolecenia("Za tymi drzwiami jest nisza urządzenia — szuflady się nie zmieszczą.");
  if (mebel.wysuwy.some((w) => w.strefaId === docelowa.strefa.id)) throw new BladPolecenia("W tej strefie są już szuflady.");
  const zostaje = docelowa.h - n * h;
  if (zostaje < 0) throw new BladPolecenia(`${n} × ${h} mm nie mieści się w strefie ${Math.round(docelowa.h)} mm za drzwiami. Zmniejsz liczbę albo wysokość.`);

  const uwagi: string[] = [];
  const id = docelowa.strefa.id;
  const czesci: StrefaWnetrza[] = Array.from({ length: n }, (_, i) => ({ id: `${id}-sw${i + 1}`, rozmiar: { mm: h }, wyposazenie: { typ: "pusta" } }));
  if (zostaje > 0) {
    const polki = wyp?.typ === "polki" ? wyp.liczba : 0;
    // Półki nad szufladami: tyle, ile zmieści się co najmniej co 250 mm.
    const mieszczace = Math.max(0, Math.floor(zostaje / 250) - 1);
    const nowe = Math.min(polki, mieszczace);
    if (nowe < polki) uwagi.push(`Półek nastawnych nad szufladami: ${nowe} (było ${polki}).`);
    czesci.push({ id: `${id}-nad`, rozmiar: { reszta: true }, wyposazenie: nowe > 0 ? { typ: "polki", liczba: nowe } : { typ: "pusta" } });
  } else if (wyp?.typ === "polki" && wyp.liczba > 0) {
    uwagi.push(`Usunięto ${wyp.liczba} półek nastawnych — szuflady zajmują całą strefę.`);
  }
  const zastap = (s: StrefaWnetrza): StrefaWnetrza =>
    s.id === id
      ? { id: s.id, rozmiar: s.rozmiar, bezPlecow: s.bezPlecow, podzial: { kierunek: "poziom", przegroda: "brak", czesci } }
      : s.podzial
        ? { ...s, podzial: { ...s.podzial, czesci: s.podzial.czesci.map(zastap) } }
        : s;
  mebel.wnetrze = zastap(mebel.wnetrze);

  let nr = mebel.wysuwy.filter((w) => w.kod.startsWith("SW")).reduce((mx, w) => Math.max(mx, Number(w.kod.replace(/\D/g, "")) || 0), 0);
  for (const c of czesci.slice(0, n)) mebel.wysuwy.push({ id: `wysuw-${c.id}`, kod: `SW${pad(++nr)}`, poleFrontuId: cel.pole.id, strefaId: c.id, powiazanie: "zaDrzwiami" });
  uwagi.push(`Dodano ${n} szuflad${n === 1 ? "ę" : n < 5 ? "y" : ""} wewnętrzn${n === 1 ? "ą" : "e"} za drzwiami, strefa ${h} mm każda.`);
  if (!mebel.szufladySystemowe) uwagi.push("Skrzynki z płyty — wybierz system szuflad, aby dostać wymiary z karty producenta.");
  return { mebel, uwagi };
}
