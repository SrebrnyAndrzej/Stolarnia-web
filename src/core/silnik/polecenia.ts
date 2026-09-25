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

/**
 * Dodaje szufladę ukrytą za frontem szuflady (np. płytka szuflada na sztućce nad szufladą garnkową). Niezależna — wysuwana
 * osobno po otwarciu frontu; sprzężona — zabierak łączy ją z frontem (tylko systemy z danymi zabieraka). Położenie i wymiary
 * wyznacza silnik z profilu systemu (górna część strefy za frontem, prowadnica w rastrze 32).
 */
export function dodajUkrytaSzuflade(wejscie: Mebel, k: UstawieniaKonstrukcyjne, opcje: { sprzezona: boolean; poleId?: string }): WynikPolecenia {
  if (wejscie.korpus.rodzaj !== "korpus") throw new BladPolecenia("Szuflady wymagają korpusu.");
  const mebel: Mebel = structuredClone(wejscie);
  const uklad = ukladFrontow(mebel.fronty, mebel.szerokoscMM, mebel.wysokoscMM, k.szczelinaFrontowMM);
  const zFrontem = mebel.wysuwy.filter((w) => w.powiazanie === "zFrontem" && uklad.get(w.poleFrontuId));
  if (!zFrontem.length) throw new BladPolecenia("Mebel nie ma szuflad z frontem — najpierw zamień drzwi na szuflady.");
  const cel = opcje.poleId
    ? zFrontem.find((w) => w.poleFrontuId === opcje.poleId)
    : [...zFrontem].sort((a, b) => uklad.get(b.poleFrontuId)!.front.h - uklad.get(a.poleFrontuId)!.front.h)[0];
  if (!cel) throw new BladPolecenia(`Pole „${opcje.poleId}” nie jest frontem szuflady.`);
  const front = uklad.get(cel.poleFrontuId)!.front;
  if (front.h < 200) throw new BladPolecenia(`Front ${Math.round(front.h)} mm jest za niski na szufladę ukrytą (min. 200 mm).`);
  if (mebel.wysuwy.some((w) => w.poleFrontuId === cel.poleFrontuId && w.powiazanie !== "zFrontem")) throw new BladPolecenia("Za tym frontem jest już szuflada ukryta.");
  const nr = mebel.wysuwy.filter((w) => w.kod.startsWith("SU")).length + 1;
  const kod = `SU${pad(nr)}`;
  mebel.wysuwy.push({ id: `wysuw-${kod.toLowerCase()}`, kod, poleFrontuId: cel.poleFrontuId, strefaId: cel.strefaId, powiazanie: opcje.sprzezona ? "zZabierakiem" : "ukrytaZaFrontem" });
  const uwagi = [`Dodano szufladę ukrytą ${kod} za frontem ${Math.round(front.h)} mm (${opcje.sprzezona ? "sprzężoną zabierakiem" : "wysuwaną osobno"}).`];
  if (!mebel.szufladySystemowe) uwagi.push("Wybierz system szuflad — szuflada ukryta powstaje tylko z danymi producenta.");
  return { mebel, uwagi };
}

/**
 * Dzieli strefę wnętrza przegrodami z płyty korpusu na N komór (pionowo — obok siebie, poziomo — półkami stałymi).
 * Wyposażenie strefy (półki nastawne) przechodzi do każdej komory. Komory są równe albo mają podane szerokości/wysokości [mm]
 * (pozostałe dzielą resztę). Strefa z wysuwem albo niszą AGD nie jest dzielona.
 */
export function podzielWnetrze(
  wejscie: Mebel,
  k: UstawieniaKonstrukcyjne,
  opcje: { kierunek: "pion" | "poziom"; liczba: number; strefaId?: string; rozmiaryMM?: number[] },
): WynikPolecenia {
  const n = Math.round(opcje.liczba);
  if (!(n >= 2 && n <= 6)) throw new BladPolecenia("Liczba komór musi być w zakresie 2–6.");
  if (wejscie.korpus.rodzaj !== "korpus") throw new BladPolecenia("Podział wymaga korpusu.");
  const mebel: Mebel = structuredClone(wejscie);
  const t = k.gruboscPlytyKorpusuMM;
  const wnetrze = ukladWnetrza(mebel.wnetrze, mebel.szerokoscMM, mebel.wysokoscMM, t);
  const liscie = [...wnetrze.values()].filter((s) => !s.strefa.podzial);
  const cel = opcje.strefaId ? wnetrze.get(opcje.strefaId) : liscie.sort((a, b) => b.w * b.h - a.w * a.h)[0];
  if (!cel) throw new BladPolecenia(`Nie ma strefy „${opcje.strefaId}”.`);
  if (cel.strefa.podzial) throw new BladPolecenia("Ta strefa jest już podzielona — wskaż jedną z jej komór.");
  if (cel.strefa.wyposazenie?.typ === "nisza") throw new BladPolecenia("Nisza urządzenia nie może być podzielona.");
  if (mebel.wysuwy.some((w) => w.strefaId === cel.strefa.id)) throw new BladPolecenia("W tej strefie pracują szuflady — najpierw je usuń.");
  const wzdluz = opcje.kierunek === "pion" ? cel.w : cel.h;
  const netto = wzdluz - t * (n - 1);
  const rozmiary = opcje.rozmiaryMM ?? [];
  if (rozmiary.length > n - 1) throw new BladPolecenia(`Podaj najwyżej ${n - 1} wymiarów — pozostałe komory dzielą resztę.`);
  const rowne = (netto - rozmiary.reduce((s, x) => s + x, 0)) / (n - rozmiary.length);
  const minimum = 100;
  if (rozmiary.some((x) => x < minimum) || rowne < minimum) throw new BladPolecenia(`Komora węższa niż ${minimum} mm — zmniejsz liczbę komór albo zmień wymiary.`);
  const wyp = cel.strefa.wyposazenie;
  const czesci: StrefaWnetrza[] = Array.from({ length: n }, (_, i) => ({
    id: `${cel.strefa.id}-k${i + 1}`,
    rozmiar: i < rozmiary.length ? { mm: rozmiary[i] } : { reszta: true },
    wyposazenie: wyp ? structuredClone(wyp) : { typ: "pusta" },
  }));
  const id = cel.strefa.id;
  const zastap = (s: StrefaWnetrza): StrefaWnetrza =>
    s.id === id
      ? { id: s.id, rozmiar: s.rozmiar, bezPlecow: s.bezPlecow, podzial: { kierunek: opcje.kierunek, przegroda: "plyta", czesci } }
      : s.podzial
        ? { ...s, podzial: { ...s.podzial, czesci: s.podzial.czesci.map(zastap) } }
        : s;
  mebel.wnetrze = zastap(mebel.wnetrze);
  const opis = czesci.map((_, i) => Math.round(i < rozmiary.length ? rozmiary[i] : rowne)).join(" / ");
  return { mebel, uwagi: [`Strefa podzielona ${opcje.kierunek === "pion" ? "przegrodami pionowymi" : "półkami stałymi"} na ${n} komór: ${opis} mm.`] };
}

/**
 * Dzieli pole drzwi na N skrzydeł obok siebie („pion”) albo jedno nad drugim („poziom”) — niezależnie od wnętrza.
 * Skrzydła obok siebie dostają zawiasy na zewnątrz (lewe — lewa, prawe — prawa). Opcja `przegroda` dodaje płytę
 * na linii podziału w strefie za drzwiami (przegrodę pionową albo półkę stałą), tak aby każde skrzydło zamykało swoją komorę.
 */
export function podzielFront(
  wejscie: Mebel,
  k: UstawieniaKonstrukcyjne,
  opcje: { kierunek: "pion" | "poziom"; liczba: number; poleId?: string; przegroda?: boolean },
): WynikPolecenia {
  const n = Math.round(opcje.liczba);
  if (!(n >= 2 && n <= 4)) throw new BladPolecenia("Front można podzielić na 2–4 części.");
  const mebel: Mebel = structuredClone(wejscie);
  const gap = k.szczelinaFrontowMM;
  const uklad = ukladFrontow(mebel.fronty, mebel.szerokoscMM, mebel.wysokoscMM, gap);
  const drzwi = [...uklad.values()].filter((u) => u.pole.front?.typ === "drzwi" && !u.pole.podzial);
  const cel = opcje.poleId ? uklad.get(opcje.poleId) : drzwi.length === 1 ? drzwi[0] : undefined;
  if (!cel) throw new BladPolecenia(opcje.poleId ? `Nie ma pola frontu „${opcje.poleId}”.` : drzwi.length ? "Mebel ma kilka skrzydeł — wskaż, które podzielić (poleId)." : "Mebel nie ma drzwi do podzielenia.");
  const front = cel.pole.front;
  if (front?.typ !== "drzwi" || cel.pole.podzial) throw new BladPolecenia("Wskazane pole nie jest pojedynczym skrzydłem drzwi.");
  const wymiar = opcje.kierunek === "pion" ? cel.front.w : cel.front.h;
  const czesc = (wymiar - gap * (n - 1)) / n;
  if (czesc < 150) throw new BladPolecenia(`Skrzydło miałoby ${Math.round(czesc)} mm — minimum 150 mm.`);
  if (opcje.kierunek === "pion" && czesc > 600) throw new BladPolecenia(`Skrzydło ${Math.round(czesc)} mm szersze niż 600 mm — zwiększ liczbę skrzydeł.`);

  const juz = new Set<string>();
  const zbierz = (p: PoleFrontu) => {
    if (p.front && "kod" in p.front) juz.add(p.front.kod);
    p.podzial?.czesci.forEach(zbierz);
  };
  zbierz(mebel.fronty);
  let nr = 0;
  const nowyKod = () => {
    let kod: string;
    do kod = `FRONT-D${pad(++nr)}`;
    while (juz.has(kod));
    juz.add(kod);
    return kod;
  };
  const stronaPionu = (i: number): "lewa" | "prawa" => (i < n / 2 ? "lewa" : "prawa");
  const czesci: PoleFrontu[] = Array.from({ length: n }, (_, i) => ({
    id: `${cel.pole.id}-${opcje.kierunek === "pion" ? "s" : "p"}${i + 1}`,
    rozmiar: { reszta: true },
    front: { typ: "drzwi", kod: i === 0 ? front.kod : nowyKod(), zawiasy: opcje.kierunek === "pion" ? stronaPionu(i) : front.zawiasy ?? "lewa" },
  }));
  const zastap = (p: PoleFrontu): PoleFrontu =>
    p.id === cel.pole.id
      ? { id: p.id, rozmiar: p.rozmiar, podzial: { kierunek: opcje.kierunek, szczelinaWspolna: true, czesci } }
      : p.podzial
        ? { ...p, podzial: { ...p.podzial, czesci: p.podzial.czesci.map(zastap) } }
        : p;
  mebel.fronty = zastap(mebel.fronty);
  const uwagi = [`Drzwi podzielone na ${n} skrzydła ${opcje.kierunek === "pion" ? "obok siebie" : "jedno nad drugim"} po ${Math.round(czesc)} mm.`];

  if (opcje.przegroda) {
    // Płyta na każdej linii podziału frontu: oś płyty = oś szczeliny między skrzydłami.
    const t = k.gruboscPlytyKorpusuMM;
    const wnetrze = ukladWnetrza(mebel.wnetrze, mebel.szerokoscMM, mebel.wysokoscMM, t);
    const [a0, a1] = opcje.kierunek === "pion" ? [cel.obszar.x, cel.obszar.x + cel.obszar.w] : [cel.obszar.y, cel.obszar.y + cel.obszar.h];
    const pokrycie = (s: { x: number; y: number; w: number; h: number }) =>
      opcje.kierunek === "pion" ? Math.min(s.x + s.w, a1) - Math.max(s.x, a0) : Math.min(s.y + s.h, a1) - Math.max(s.y, a0);
    const strefa = [...wnetrze.values()].filter((s) => !s.strefa.podzial && pokrycie(s) > 0).sort((a, b) => pokrycie(b) - pokrycie(a))[0];
    if (!strefa) throw new BladPolecenia("Brak strefy wnętrza za drzwiami.");
    if (strefa.strefa.wyposazenie?.typ === "nisza") throw new BladPolecenia("Za drzwiami jest nisza urządzenia — bez przegrody.");
    if (mebel.wysuwy.some((w) => w.strefaId === strefa.strefa.id)) throw new BladPolecenia("W strefie za drzwiami pracują szuflady — przegroda by z nimi kolidowała.");
    const start = opcje.kierunek === "pion" ? strefa.x : strefa.y;
    const dl = opcje.kierunek === "pion" ? strefa.w : strefa.h;
    const krokFrontu = (a1 - a0) / n;
    const linie = Array.from({ length: n - 1 }, (_, i) => a0 + krokFrontu * (i + 1));
    const rozmiary: number[] = [];
    let od = start;
    for (const l of linie) {
      rozmiary.push(l - t / 2 - od);
      od = l + t / 2;
    }
    if (rozmiary.some((r) => r < 100) || start + dl - od < 100) throw new BladPolecenia("Komora za skrzydłem węższa niż 100 mm — przegroda nie pasuje do strefy.");
    const wyp = strefa.strefa.wyposazenie;
    const polki = wyp?.typ === "polki" ? wyp.liczba : 0;
    const komory: StrefaWnetrza[] = Array.from({ length: n }, (_, i) => ({
      id: `${strefa.strefa.id}-k${i + 1}`,
      rozmiar: i < n - 1 ? { mm: r1(rozmiary[i]) } : { reszta: true },
      wyposazenie: opcje.kierunek === "pion" ? (wyp ? structuredClone(wyp) : { typ: "pusta" }) : polki ? { typ: "polki", liczba: Math.floor(polki / n) + (i < polki % n ? 1 : 0) } : { typ: "pusta" },
    }));
    const id = strefa.strefa.id;
    const zastapW = (s: StrefaWnetrza): StrefaWnetrza =>
      s.id === id
        ? { id: s.id, rozmiar: s.rozmiar, bezPlecow: s.bezPlecow, podzial: { kierunek: opcje.kierunek, przegroda: "plyta", czesci: komory } }
        : s.podzial
          ? { ...s, podzial: { ...s.podzial, czesci: s.podzial.czesci.map(zastapW) } }
          : s;
    mebel.wnetrze = zastapW(mebel.wnetrze);
    uwagi.push(`Dodano ${opcje.kierunek === "pion" ? "przegrodę pionową" : "półkę stałą"} na linii podziału frontu (${n} komory).`);
  }
  return { mebel, uwagi };
}

function r1(v: number): number {
  return Math.round(v * 10) / 10;
}
