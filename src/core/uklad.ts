import { modulKatalogowy } from "./catalog/modules.js";
import { scianyNaRzucie } from "./geometry.js";
import type { KategoriaModulu, KonfiguracjaModulu, KonstrukcjaModulu, Modul, Pomieszczenie } from "./types.js";

// Szybkie układanie kuchni: „wypełnij całą ścianę” i „szybki układ I / L / U”.
// Wynik to plan zwykłych modułów (katalogowych, blend i szafek dopasowanych) — ten sam rodzaj danych, co przy
// ręcznym dodawaniu, więc 3D, wycena, produkcja i PDF działają bez zmian.
//
// UWAGA: wartości ergonomiczne poniżej są ZAŁOŻENIAMI roboczymi (praktyka warsztatowa, wymaganie Mateusza
// „płyta min ~300 mm od narożnika/słupka”), a NIE normą. Do potwierdzenia przez zakład — zob. docs/SZYBKI-PROJEKT.md.
export const ZALOZENIA_UKLADU = {
  /** Założenie: minimalny blat roboczy między zlewem a płytą [mm]. */
  zlewPlytaMinMM: 600,
  /** Założenie (Mateusz 1.11.2026, „~300 mm”): płyta nie przy samym narożniku, końcu ściany ani słupku [mm]. */
  plytaOdBokuMinMM: 300,
  /** Założenie: blat odkładczy obok lodówki przed zlewem [mm]. */
  odkladanieObokLodowkiMM: 300,
  /** Założenie: blenda przy szafkach prostopadłych w narożniku (prześwit na uchwyty i otwieranie) [mm]. */
  blendaNaroznaMM: 50,
  /** Reszta poniżej tej wartości zamykana blendą (jak wypelnijLuke / FurnitureRunDistributor) [mm]. */
  maksBlendaMM: 150,
  /** Domyślna kolejność preferowanych szerokości szafek [mm]. */
  preferowaneSzerokosci: [600, 500, 400, 800, 900, 300, 450],
};

export const OPIS_ZALOZEN_UKLADU: string[] = [
  `Blat roboczy między zlewem a płytą min. ${ZALOZENIA_UKLADU.zlewPlytaMinMM} mm — założenie robocze, nie norma.`,
  `Płyta min. ${ZALOZENIA_UKLADU.plytaOdBokuMinMM} mm od narożnika, końca ściany i słupka — założenie (ok. 300 mm wg Mateusza), nie norma.`,
  `Blat odkładczy przy lodówce min. ${ZALOZENIA_UKLADU.odkladanieObokLodowkiMM} mm — założenie robocze; zmniejszany jako pierwszy, gdy brakuje miejsca.`,
  `Blenda narożna ${ZALOZENIA_UKLADU.blendaNaroznaMM} mm przy szafce prostopadłej — założenie robocze (prześwit na uchwyty).`,
  `Narożnik dolny „ślepa”: szafka ślepa 1100 mm z drzwiami 450 mm od strony ciągu (część ślepa w narożniku), ciąg prostopadły zaczyna się za frontem szafki narożnej + blenda.`,
  `Wiszące: spód 1400 mm, wysokość 720 mm (z katalogu); pomijane nad słupkami i lodówką wolnostojącą; nad płytą szafka okapowa z katalogu.`,
];

export type Rzad = "dolny" | "wiszacy";

export type RolaWUkladzie =
  | "szafka" | "blenda" | "blendaNarozna" | "dopasowana" | "naroznik" | "zlew" | "zmywarka" | "plyta" | "lodowka" | "slupek" | "okap";

/** Moduł do wstawienia (pola jak w NowyModul usługi) + rola w układzie. */
export interface PlanModulu {
  scianaId: string;
  rola: RolaWUkladzie;
  katalogId?: string;
  nazwa?: string;
  kategoria?: KategoriaModulu;
  konstrukcja?: KonstrukcjaModulu;
  pozycjaXMM: number;
  pozycjaYMM?: number;
  szerokoscMM: number;
  wysokoscMM?: number;
  glebokoscMM?: number;
  konfiguracja?: Partial<KonfiguracjaModulu>;
}

export interface Przedzial {
  odMM: number;
  doMM: number;
  /** Opis zajętości (nazwa modułu, narożnik, wnęka). */
  opis?: string;
  /** Zajętość przez moduł z innej (prostopadłej) ściany — przy nim blenda narożna. */
  prostopadly?: boolean;
  /** Moduł narożny „L” — bez blendy (ciąg zaczyna się od jego boku). */
  naroznikL?: boolean;
}

export interface Rezerwacja {
  scianaId: string;
  rzad: Rzad;
  odMM: number;
  doMM: number;
  opis: string;
}

const PASMO: Record<Rzad, [number, number]> = { dolny: [0, 1000], wiszacy: [1400, 2120] };
const r1 = (v: number) => Math.round(v * 10) / 10;
/** Reszta poniżej tej wartości to luz montażowy (bez blendy) — decyzja koordynatora 1.11.2026. */
const MIN_BLENDA_MM = 20;
/** „Ściana A” zamiast „ściana Ściana A”. */
export const opisSciany = (nazwa: string) => (/^ściana/i.test(nazwa) ? nazwa : `ściana ${nazwa}`);
const Opis = (nazwa: string) => { const t = opisSciany(nazwa); return t[0].toUpperCase() + t.slice(1); };

// ---------- Podział długości na szerokości szafek ----------

export interface Odcinek {
  /** luz = szczelina montażowa < 20 mm, bez modułu. */
  typ: "szafka" | "blenda" | "dopasowana" | "cargo" | "luz";
  szerokoscMM: number;
  /** Ostrzeżenie dla użytkownika (luz, szeroka blenda). */
  uwaga?: string;
}

export class BladRozkladu extends Error {}

/**
 * Dzieli długość na szafki o preferowanych szerokościach (kolejność listy = preferencja) tak, by reszta była < 150 mm.
 * Reszta: < 20 mm → luz montażowy (bez modułu, ostrzeżenie); 20–149 mm → blenda. Gdy reszty nie da się zejść poniżej
 * 150 mm: 150–299 mm → cargo 150/200 z katalogu (jeśli podano `cargo`) + blenda/luz, inaczej szeroka blenda z ostrzeżeniem
 * (decyzja koordynatora 1.11.2026, do potwierdzenia przez Mateusza); ≥ 300 mm → szafki dopasowane po maks. 900 mm.
 * Suma odcinków = długość.
 */
export function rozlozDlugosc(
  dlugoscMM: number,
  szerokosci: number[],
  o: { symetria?: boolean; blenda?: "poczatek" | "koniec"; maksBlendaMM?: number; cargo?: number[] } = {},
): Odcinek[] {
  const maks = o.maksBlendaMM ?? ZALOZENIA_UKLADU.maksBlendaMM;
  const L = r1(dlugoscMM);
  if (L <= 0.5) return [];
  if (L < maks) return [reszty(L)];
  const W = [...new Set(szerokosci.map((w) => Math.round(w)).filter((w) => w > 0))];
  if (!W.length) throw new BladRozkladu("Brak szerokości szafek dostępnych w katalogu dla tego rzędu.");
  const n = Math.floor(L);
  const koszt = new Float64Array(n + 1).fill(Infinity);
  const skad = new Int32Array(n + 1).fill(-1);
  koszt[0] = 0;
  for (let s = 1; s <= n; s++) {
    for (let i = 0; i < W.length; i++) {
      const w = W[i];
      if (w > s || koszt[s - w] === Infinity) continue;
      const k = koszt[s - w] + 1 + 0.25 * i;
      if (k < koszt[s] - 1e-9) {
        koszt[s] = k;
        skad[s] = w;
      }
    }
  }
  let najS = -1;
  let najWynik = Infinity;
  for (let s = n; s >= 0 && L - s < maks; s--) {
    if (koszt[s] === Infinity) continue;
    const reszta = L - s;
    const wynik = koszt[s] + (reszta > 0.5 ? 1 + reszta / 50 : 0);
    if (wynik < najWynik - 1e-9) {
      najWynik = wynik;
      najS = s;
    }
  }
  const dodatki: Odcinek[] = [];
  let reszta = 0;
  if (najS < 0) {
    // Brak sumy z resztą < 150 mm — największa osiągalna suma, resztę zamykają cargo / szafki dopasowane.
    najS = 0;
    for (let s = n; s > 0; s--) if (koszt[s] !== Infinity) { najS = s; break; }
    const r = r1(L - najS);
    if (r < 300) {
      const c = [...(o.cargo ?? [])].filter((w) => w <= r).sort((a, b) => b - a)[0];
      if (c) {
        dodatki.push({ typ: "cargo", szerokoscMM: c });
        reszta = r1(r - c);
      } else dodatki.push({ typ: "blenda", szerokoscMM: r, uwaga: `Blenda ${Math.round(r)} mm (szersza niż 150 mm) — brak szafki pasującej do reszty; do potwierdzenia.` });
    } else {
      const ile = Math.ceil(r / 900);
      const czesc = Math.floor((r / ile) * 10) / 10;
      for (let i = 0; i < ile; i++) dodatki.push({ typ: "dopasowana", szerokoscMM: i === ile - 1 ? r1(r - czesc * (ile - 1)) : czesc });
    }
  } else reszta = r1(L - najS);
  const lista: number[] = [];
  for (let s = najS; s > 0; s -= skad[s]) lista.push(skad[s]);
  const pref = (w: number) => W.indexOf(w);
  lista.sort((a, b) => pref(a) - pref(b) || b - a);

  let szafki: number[];
  if (o.symetria) {
    const pary: number[] = [];
    const pojedyncze: number[] = [];
    const ile = new Map<number, number>();
    for (const w of lista) ile.set(w, (ile.get(w) ?? 0) + 1);
    for (const [w, k] of [...ile.entries()].sort((a, b) => pref(a[0]) - pref(b[0]))) {
      for (let i = 0; i < Math.floor(k / 2); i++) pary.push(w);
      if (k % 2) pojedyncze.push(w);
    }
    szafki = [...pary, ...pojedyncze, ...[...pary].reverse()];
  } else szafki = lista;

  const wynik: Odcinek[] = szafki.map((w) => ({ typ: "szafka" as const, szerokoscMM: w }));
  wynik.push(...dodatki);
  if (reszta > 0.5) {
    if (o.symetria && reszta >= 2 * MIN_BLENDA_MM) {
      const pol = r1(reszta / 2);
      wynik.unshift(reszty(pol));
      wynik.push(reszty(r1(reszta - pol)));
    } else if (o.blenda === "poczatek") wynik.unshift(reszty(reszta));
    else wynik.push(reszty(reszta));
  }
  return wynik;
}

/** Reszta < 150 mm: blenda, a poniżej 20 mm luz montażowy. */
function reszty(r: number): Odcinek {
  return r < MIN_BLENDA_MM
    ? { typ: "luz", szerokoscMM: r, uwaga: `Luz montażowy ${r} mm bez blendy — rozłóż przy montażu.` }
    : { typ: "blenda", szerokoscMM: r };
}

export interface PlanOdcinkow {
  plan: PlanModulu[];
  luzy: { odMM: number; doMM: number }[];
  uwagi: string[];
}

/** Odcinki → plan modułów w rzędzie, od pozycji x (luz nie tworzy modułu). */
export function modulyZOdcinkow(odcinki: Odcinek[], scianaId: string, xMM: number, rzad: Rzad, konstrukcja: "shelves" | "drawers" = "shelves"): PlanOdcinkow {
  const wynik: PlanOdcinkow = { plan: [], luzy: [], uwagi: [] };
  let x = xMM;
  for (const o of odcinki) {
    if (o.typ === "luz") wynik.luzy.push({ odMM: x, doMM: r1(x + o.szerokoscMM) });
    else wynik.plan.push(modulOdcinka(o, scianaId, x, rzad, konstrukcja));
    if (o.uwaga) wynik.uwagi.push(o.uwaga);
    x = r1(x + o.szerokoscMM);
  }
  return wynik;
}

function modulOdcinka(o: Odcinek, scianaId: string, x: number, rzad: Rzad, konstrukcja: "shelves" | "drawers"): PlanModulu {
  const wiszacy = rzad === "wiszacy";
  if (o.typ === "szafka" || o.typ === "cargo") {
    const katalogId = o.typ === "cargo" ? `base-cargo-${o.szerokoscMM}` : wiszacy ? `wall-shelves-${o.szerokoscMM}` : `base-${konstrukcja}-${o.szerokoscMM}`;
    if (modulKatalogowy(katalogId)) return { scianaId, rola: "szafka", katalogId, pozycjaXMM: x, szerokoscMM: o.szerokoscMM };
  }
  return blendaLubDopasowana(o.szerokoscMM, scianaId, x, rzad, o.typ === "blenda" ? "blenda" : "dopasowana");
}

/** Blenda (< 150 mm) albo szafka z półkami na wymiar — te same parametry co Stolarnia.wypelnijLuke. */
export function blendaLubDopasowana(szerokoscMM: number, scianaId: string, x: number, rzad: Rzad, rola: RolaWUkladzie = szerokoscMM < ZALOZENIA_UKLADU.maksBlendaMM ? "blenda" : "dopasowana"): PlanModulu {
  const wiszacy = rzad === "wiszacy";
  const blenda = rola === "blenda" || rola === "blendaNarozna";
  return {
    scianaId,
    rola,
    nazwa: blenda ? `Blenda ${rola === "blendaNarozna" ? "narożna " : ""}${Math.round(szerokoscMM)}` : `Szafka ${wiszacy ? "wisząca" : "dolna"} dopasowana ${Math.round(szerokoscMM)}`,
    kategoria: wiszacy ? "wall" : "base",
    konstrukcja: blenda ? "filler" : "shelves",
    pozycjaXMM: x,
    szerokoscMM,
    wysokoscMM: 720,
    glebokoscMM: wiszacy ? 320 : 560,
    pozycjaYMM: wiszacy ? 1400 : undefined,
  };
}

// ---------- Przedziały ----------

export function wolnePrzedzialy(odMM: number, doMM: number, zajete: Przedzial[]): Przedzial[] {
  const posort = [...zajete].filter((z) => z.doMM > odMM && z.odMM < doMM).sort((a, b) => a.odMM - b.odMM);
  const wynik: Przedzial[] = [];
  let x = odMM;
  let lewy: Przedzial | undefined;
  for (const z of posort) {
    if (z.odMM > x + 0.5) wynik.push({ odMM: r1(x), doMM: r1(z.odMM), ...flagi(lewy, z) });
    if (z.doMM > x) {
      x = z.doMM;
      lewy = z;
    }
  }
  if (doMM > x + 0.5) wynik.push({ odMM: r1(x), doMM: r1(doMM), ...flagi(lewy, undefined) });
  return wynik;
}

/** Sąsiedzi wolnego przedziału zapisani w opisie: L = z lewej, P = z prawej. */
function flagi(lewy?: Przedzial, prawy?: Przedzial): { opis: string } {
  const k = (z?: Przedzial) => (!z ? "koniec" : z.naroznikL ? "naroznikL" : z.prostopadly ? "prostopadly" : "modul");
  return { opis: `${k(lewy)}|${k(prawy)}` };
}

/**
 * Odcinki ściany zajęte w danym rzędzie: moduły tej ściany (rzut elewacji) oraz moduły z innych ścian pomieszczenia,
 * których obrys (z frontem) wchodzi w pas przy tej ścianie — np. szafka narożna ze ściany prostopadłej.
 */
export function zajeteNaScianie(pom: Pomieszczenie, moduly: Modul[], scianaId: string, rzad: Rzad, gruboscFrontuMM: number): Przedzial[] {
  const [lo, hi] = PASMO[rzad];
  const wPasmie = (m: Modul) => m.pozycjaYMM < hi - 0.5 && m.pozycjaYMM + m.wysokoscMM > lo + 0.5;
  const wynik: Przedzial[] = [];
  for (const m of moduly) if (m.scianaId === scianaId && wPasmie(m)) wynik.push({ odMM: m.pozycjaXMM, doMM: m.pozycjaXMM + m.szerokoscMM, opis: m.nazwa });

  const rzut = scianyNaRzucie(pom);
  const ta = rzut.find((w) => w.sciana.id === scianaId);
  if (!ta) return wynik;
  const pas = rzad === "dolny" ? 560 + gruboscFrontuMM : 320 + gruboscFrontuMM;
  for (const w of rzut) {
    if (w.sciana.id === scianaId) continue;
    for (const m of moduly) {
      if (m.scianaId !== w.sciana.id || !wPasmie(m)) continue;
      const lCorner = m.konstrukcja === "lCorner" || m.konstrukcja === "wallCorner";
      const gl = m.glebokoscMM + (lCorner || m.konfiguracja.typFrontu === "brak" ? 0 : gruboscFrontuMM);
      const pkt: [number, number][] = [
        [m.pozycjaXMM, 0], [m.pozycjaXMM + m.szerokoscMM, 0], [m.pozycjaXMM + m.szerokoscMM, gl], [m.pozycjaXMM, gl],
      ].map(([a, d]) => [w.x1 + w.dx * a + w.nx * d, w.y1 + w.dy * a + w.ny * d]);
      const wzdluz = pkt.map(([x, y]) => (x - ta.x1) * ta.dx + (y - ta.y1) * ta.dy);
      const odLica = pkt.map(([x, y]) => (x - ta.x1) * ta.nx + (y - ta.y1) * ta.ny);
      const [a0, a1] = [Math.min(...wzdluz), Math.max(...wzdluz)];
      const [d0, d1] = [Math.min(...odLica), Math.max(...odLica)];
      if (d1 <= 1 || d0 >= pas - 1) continue;
      const od = Math.max(0, a0);
      const doo = Math.min(ta.sciana.dlugoscMM, a1);
      if (doo - od > 1) wynik.push({ odMM: r1(od), doMM: r1(doo), opis: `${m.nazwa} (ściana ${w.sciana.nazwa})`, prostopadly: true, naroznikL: lCorner });
    }
  }
  return wynik;
}

// ---------- Wypełnij całą ścianę ----------

export interface OpcjeWypelnienia {
  rzad: Rzad;
  /** Dolne: szafki z półkami (domyślnie) lub szufladami. Wiszące zawsze z półkami. */
  konstrukcja?: "shelves" | "drawers";
  /** Preferowane szerokości w kolejności preferencji; domyślnie 600/500/400/800/900/300/450. */
  szerokosci?: number[];
  symetria?: boolean;
  odXMM?: number;
  doXMM?: number;
  /** Blenda przy module ze ściany prostopadłej (narożnik); 0 = bez blendy. Domyślnie 50 mm (założenie). */
  blendaNaroznaMM?: number;
}

export function planWypelnieniaSciany(pom: Pomieszczenie, moduly: Modul[], scianaId: string, o: OpcjeWypelnienia, gruboscFrontuMM: number) {
  const sciana = pom.sciany.find((s) => s.id === scianaId);
  if (!sciana) throw new Error(`Nie ma ściany o id "${scianaId}" w pomieszczeniu.`);
  const od = Math.max(0, o.odXMM ?? 0);
  const doo = Math.min(sciana.dlugoscMM, o.doXMM ?? sciana.dlugoscMM);
  if (!(doo > od)) throw new Error("Zakres wypełnienia jest pusty.");
  const zajete = zajeteNaScianie(pom, moduly, scianaId, o.rzad, gruboscFrontuMM);
  const wolne = wolnePrzedzialy(od, doo, zajete);
  const konstr = o.rzad === "wiszacy" ? "shelves" : o.konstrukcja ?? "shelves";
  const szer = dostepneSzerokosci(o.szerokosci ?? ZALOZENIA_UKLADU.preferowaneSzerokosci, o.rzad, konstr);
  if (!szer.length) throw new BladRozkladu(`Żadna z szerokości ${(o.szerokosci ?? []).join(", ")} mm nie ma modułu w katalogu dla tego rzędu.`);
  const blendaN = o.blendaNaroznaMM ?? ZALOZENIA_UKLADU.blendaNaroznaMM;
  if (!(Number.isFinite(blendaN) && blendaN >= 0 && blendaN <= ZALOZENIA_UKLADU.maksBlendaMM)) throw new BladRozkladu("blendaNaroznaMM: 0–150 mm.");
  const plan: PlanModulu[] = [];
  const luzy: { odMM: number; doMM: number }[] = [];
  const ostrzezenia: string[] = [];
  for (const w of wolne) {
    let [a, b] = [w.odMM, w.doMM];
    const [lewy, prawy] = (w.opis ?? "koniec|koniec").split("|");
    if (lewy === "prostopadly" && blendaN > 0 && b - a > blendaN) {
      plan.push(blendaLubDopasowana(blendaN, scianaId, a, o.rzad, "blendaNarozna"));
      a = r1(a + blendaN);
    }
    if (prawy === "prostopadly" && blendaN > 0 && b - a > blendaN) {
      plan.push(blendaLubDopasowana(blendaN, scianaId, r1(b - blendaN), o.rzad, "blendaNarozna"));
      b = r1(b - blendaN);
    }
    // Blenda reszty przy końcu ściany (wyrównanie do muru), w przeciwnym razie na końcu przedziału.
    const strona = lewy === "koniec" && prawy !== "koniec" ? "poczatek" : "koniec";
    const r = modulyZOdcinkow(rozlozDlugosc(b - a, szer, { symetria: o.symetria, blenda: strona, cargo: o.rzad === "dolny" ? CARGO_RESZTY : [] }), scianaId, a, o.rzad, konstr);
    plan.push(...r.plan);
    luzy.push(...r.luzy);
    ostrzezenia.push(...r.uwagi);
  }
  if (!wolne.length) ostrzezenia.push("Na ścianie nie ma wolnego miejsca w tym rzędzie.");
  return { plan: plan.sort((x, y) => x.pozycjaXMM - y.pozycjaXMM), wolne: wolne.map(({ odMM, doMM }) => ({ odMM, doMM })), zajete, luzy, ostrzezenia };
}

/** Cargo z katalogu do zamykania reszty 150–299 mm w rzędzie dolnym (decyzja koordynatora, do potwierdzenia przez Mateusza). */
export const CARGO_RESZTY = [150, 200].filter((w) => modulKatalogowy(`base-cargo-${w}`));

export function dostepneSzerokosci(pref: number[], rzad: Rzad, konstrukcja: "shelves" | "drawers"): number[] {
  return pref.filter((w) => modulKatalogowy(rzad === "wiszacy" ? `wall-shelves-${w}` : `base-${konstrukcja}-${w}`));
}

// ---------- Szybki układ I / L / U ----------

export interface OpcjeSzybkiegoUkladu {
  typ: "I" | "L" | "U";
  zlew?: { sciana?: number; xMM?: number; szerokoscMM?: number } | null;
  zmywarka?: { szerokoscMM?: 450 | 600; strona?: "lewa" | "prawa" } | null;
  plyta?: { sciana?: number; xMM?: number; szerokoscMM?: number; piekarnikPod?: boolean } | null;
  lodowka?: { sciana?: number; xMM?: number; rodzaj?: "slupek" | "wolnostojaca"; szerokoscMM?: number; strona?: "poczatek" | "koniec" } | null;
  /** Dodatkowe słupki z katalogu (np. tall-oven-600) dostawiane do lodówki. */
  slupki?: string[];
  wiszace?: boolean;
  okap?: "szafka" | "brak";
  naroznik?: "slepa" | "L";
  /** Dolne szafki wypełniające: szuflady (domyślnie) lub półki. */
  dolne?: "shelves" | "drawers";
  szerokosci?: number[];
  symetria?: boolean;
  /** Przerwy w rzędzie wiszącym (okno, wywiew): indeks ściany i odcinek. */
  przerwyWiszacych?: { sciana: number; odMM: number; doMM: number }[];
}

export interface ScianaUkladu {
  id: string;
  nazwa: string;
  dlugoscMM: number;
  wysokoscMM: number;
}

type Rodzaj = "lodowka" | "zlew" | "plyta";
type Granica = "koniec" | "naroznik" | Rodzaj;

interface Element {
  rodzaj: Rodzaj;
  sciana: number;
  xMM?: number;
  szerokoscMM: number;
  kolejnosc: number;
  /** Składowe z przesunięciem względem początku elementu. */
  sklad: { dx: number; plan: Omit<PlanModulu, "scianaId" | "pozycjaXMM"> | null; szer: number; opis?: string; wysoki?: boolean }[];
}

export class BladUkladu extends Error {}

/** Zajętość ściany układu przez moduły spoza układu (np. szafka narożna ze ściany sąsiedniej), z zajeteNaScianie. */
export interface ZajetoscZewnetrzna {
  dolny: Przedzial[];
  wiszacy: Przedzial[];
}

export function planSzybkiegoUkladu(sciany: ScianaUkladu[], o: OpcjeSzybkiegoUkladu, ust: { gruboscFrontuMM: number; zajete?: ZajetoscZewnetrzna[] }) {
  const n = { I: 1, L: 2, U: 3 }[o.typ];
  if (!n) throw new BladUkladu(`Nieznany typ układu "${o.typ}" (I, L lub U).`);
  if (sciany.length !== n) throw new BladUkladu(`Układ ${o.typ} wymaga ${n} ścian(y), podano ${sciany.length}.`);
  const Z = ZALOZENIA_UKLADU;
  const plan: PlanModulu[] = [];
  const rezerwacje: Rezerwacja[] = [];
  const ostrzezenia: string[] = [];
  const zalozenia = [...OPIS_ZALOZEN_UKLADU];
  const dolne = o.dolne ?? "drawers";
  const szerDolne = dostepneSzerokosci(o.szerokosci ?? Z.preferowaneSzerokosci, "dolny", dolne);
  const szerWiszace = dostepneSzerokosci(o.szerokosci ?? Z.preferowaneSzerokosci, "wiszacy", "shelves");
  if (!szerDolne.length || ((o.wiszace ?? true) && !szerWiszace.length))
    throw new BladUkladu(`Podane szerokości (${(o.szerokosci ?? []).join(", ")} mm) nie mają modułów w katalogu dla ${!szerDolne.length ? "rzędu dolnego" : "rzędu wiszącego"}.`);
  const przerwy = (o.przerwyWiszacych ?? []).filter((x) => {
    const ok = Number.isInteger(x.sciana) && x.sciana >= 0 && x.sciana < n && x.doMM > x.odMM;
    if (!ok) ostrzezenia.push(`Przerwa w wiszących (ściana ${x.sciana}, ${x.odMM}–${x.doMM} mm) poza układem lub pusta — pominięta.`);
    return ok;
  });
  const podPrzerwa = (i: number, od: number, doo: number) => przerwy.some((x) => x.sciana === i && x.odMM < doo - 0.5 && x.doMM > od + 0.5);
  const kat = (id: string) => {
    const k = modulKatalogowy(id);
    if (!k) throw new BladUkladu(`Brak modułu "${id}" w katalogu.`);
    return k;
  };

  // --- Narożniki: moduł narożny na końcu ściany i, rezerwacja na początku ściany i+1 ---
  const naroznik = o.naroznik ?? "slepa";
  const front = ust.gruboscFrontuMM;
  const startDolny = sciany.map(() => 0);
  const koniecDolny = sciany.map((s) => s.dlugoscMM);
  const startWisz = sciany.map(() => 0);
  const koniecWisz = sciany.map((s) => s.dlugoscMM);
  const wiszace = o.wiszace ?? true;
  for (let i = 0; i < n - 1; i++) {
    const A = sciany[i];
    const B = sciany[i + 1];
    if (naroznik === "L") {
      const k = kat("base-l-corner-900");
      plan.push({ scianaId: A.id, rola: "naroznik", katalogId: k.id, pozycjaXMM: A.dlugoscMM - k.widthMM, szerokoscMM: k.widthMM });
      koniecDolny[i] = A.dlugoscMM - k.widthMM;
      rezerwacje.push({ scianaId: B.id, rzad: "dolny", odMM: 0, doMM: k.depthMM, opis: `Narożnik: ${k.name} (${opisSciany(A.nazwa)})` });
      startDolny[i + 1] = k.depthMM;
    } else {
      const k = kat("base-blind-corner-1100");
      plan.push({
        scianaId: A.id, rola: "naroznik", katalogId: k.id, pozycjaXMM: A.dlugoscMM - k.widthMM, szerokoscMM: k.widthMM,
        konfiguracja: { stronaDrzwiNaroznika: "lewa", szerokoscDrzwiNaroznikaMM: 450 },
      });
      koniecDolny[i] = A.dlugoscMM - k.widthMM;
      const zajete = k.depthMM + front;
      rezerwacje.push({ scianaId: B.id, rzad: "dolny", odMM: 0, doMM: zajete, opis: `Narożnik: ${k.name} (${opisSciany(A.nazwa)}, korpus + front)` });
      plan.push({ ...blendaLubDopasowana(Z.blendaNaroznaMM, B.id, zajete, "dolny", "blendaNarozna") });
      startDolny[i + 1] = zajete + Z.blendaNaroznaMM;
    }
    if (wiszace) {
      const k = kat("wall-corner-600");
      if (podPrzerwa(i, A.dlugoscMM - k.widthMM, A.dlugoscMM) || podPrzerwa(i + 1, 0, k.depthMM))
        ostrzezenia.push(`Narożnik wiszący ${opisSciany(A.nazwa)}/${opisSciany(B.nazwa)} wypada w przerwie (np. okno) — pominięty, narożnik zostaje pusty.`);
      else plan.push({ scianaId: A.id, rola: "naroznik", katalogId: k.id, pozycjaXMM: A.dlugoscMM - k.widthMM, szerokoscMM: k.widthMM });
      koniecWisz[i] = A.dlugoscMM - k.widthMM;
      rezerwacje.push({ scianaId: B.id, rzad: "wiszacy", odMM: 0, doMM: k.depthMM, opis: `Narożnik wiszący: ${k.name} (${opisSciany(A.nazwa)})` });
      startWisz[i + 1] = k.depthMM;
    }
  }
  // --- Moduły spoza układu (np. szafka narożna ze ściany sąsiedniej): przy końcach ściany skracają odcinek, w środku — błąd ---
  for (let i = 0; i < n; i++) {
    const sc = sciany[i];
    for (const rzad of ["dolny", "wiszacy"] as const) {
      if (rzad === "wiszacy" && !wiszace) continue;
      const start = rzad === "dolny" ? startDolny : startWisz;
      const koniec = rzad === "dolny" ? koniecDolny : koniecWisz;
      const lista = [...(ust.zajete?.[i]?.[rzad] ?? [])].sort((a, b) => a.odMM - b.odMM);
      const blenda = (z: Przedzial) => z.prostopadly && !z.naroznikL && Z.blendaNaroznaMM > 0;
      const pozostale: Przedzial[] = [];
      for (const z of lista) {
        if (z.doMM <= start[i] + 0.5) continue;
        if (z.odMM <= start[i] + 1) {
          rezerwacje.push({ scianaId: sc.id, rzad, odMM: r1(start[i]), doMM: r1(z.doMM), opis: `Zajęte: ${z.opis ?? "moduł spoza układu"}` });
          start[i] = z.doMM;
          if (blenda(z)) {
            plan.push(blendaLubDopasowana(Z.blendaNaroznaMM, sc.id, r1(start[i]), rzad, "blendaNarozna"));
            start[i] = r1(start[i] + Z.blendaNaroznaMM);
          }
        } else pozostale.push(z);
      }
      for (const z of pozostale.sort((a, b) => b.doMM - a.doMM)) {
        if (z.odMM >= koniec[i] - 0.5) continue;
        if (z.doMM >= koniec[i] - 1) {
          rezerwacje.push({ scianaId: sc.id, rzad, odMM: r1(z.odMM), doMM: r1(koniec[i]), opis: `Zajęte: ${z.opis ?? "moduł spoza układu"}` });
          koniec[i] = z.odMM;
          if (blenda(z)) {
            koniec[i] = r1(koniec[i] - Z.blendaNaroznaMM);
            plan.push(blendaLubDopasowana(Z.blendaNaroznaMM, sc.id, koniec[i], rzad, "blendaNarozna"));
          }
        } else throw new BladUkladu(`${Opis(sc.nazwa)}: ${z.opis ?? "moduł spoza układu"} zajmuje środek ściany (${Math.round(z.odMM)}–${Math.round(z.doMM)} mm) — przesuń go albo usuń przed szybkim układem.`);
      }
    }
  }
  for (let i = 0; i < n; i++) if (koniecDolny[i] - startDolny[i] < 0 || koniecWisz[i] - startWisz[i] < 0) throw new BladUkladu(`${Opis(sciany[i].nazwa)} jest za krótka na narożnik(i).`);

  // --- Elementy stałe ---
  const domyslnaSciana = (r: Rodzaj) => ({ I: { lodowka: 0, zlew: 0, plyta: 0 }, L: { lodowka: 0, zlew: 0, plyta: 1 }, U: { lodowka: 0, zlew: 1, plyta: 2 } })[o.typ][r];
  const sprawdzSciane = (i: number | undefined, r: Rodzaj) => {
    const v = i ?? domyslnaSciana(r);
    if (!Number.isInteger(v) || v < 0 || v >= n) throw new BladUkladu(`${r}: indeks ściany ${v} poza zakresem 0–${n - 1}.`);
    return v;
  };
  const elementy: Element[] = [];

  if (o.lodowka !== null) {
    const l = o.lodowka ?? {};
    const sklad: Element["sklad"] = [];
    const slupki = (o.slupki ?? []).map((id) => {
      const k = kat(id);
      if (k.category !== "tall" && k.heightMM < 1800) throw new BladUkladu(`"${id}" nie jest słupkiem.`);
      return k;
    });
    let lod: Element["sklad"][number];
    if ((l.rodzaj ?? "slupek") === "slupek") {
      const k = kat("tall-refrigerator-600");
      lod = { dx: 0, szer: k.widthMM, plan: { rola: "lodowka", katalogId: k.id, szerokoscMM: k.widthMM }, wysoki: true };
    } else {
      const w = l.szerokoscMM ?? 600;
      if (!(w >= 450 && w <= 1200)) throw new BladUkladu("Lodówka wolnostojąca: szerokość wnęki 450–1200 mm.");
      lod = { dx: 0, szer: w, plan: null, opis: `Wnęka na lodówkę wolnostojącą ${w} mm (bez szafki)`, wysoki: true };
      zalozenia.push("Wnęka lodówki wolnostojącej: szerokość podana przez użytkownika lub 600 mm; luzy wentylacyjne wg karty urządzenia — do sprawdzenia.");
    }
    const sl = slupki.map((k) => ({ dx: 0, szer: k.widthMM, plan: { rola: "slupek" as const, katalogId: k.id, szerokoscMM: k.widthMM }, wysoki: true }));
    const naKoncu = l.strona === "koniec";
    for (const s of naKoncu ? [...sl, lod] : [lod, ...sl]) sklad.push(s);
    let dx = 0;
    for (const s of sklad) { s.dx = dx; dx += s.szer; }
    elementy.push({ rodzaj: "lodowka", sciana: sprawdzSciane(l.sciana, "lodowka"), xMM: l.xMM, szerokoscMM: dx, kolejnosc: naKoncu ? 3 : 0, sklad });
  }

  if (o.zlew !== null) {
    const z = o.zlew ?? {};
    const ks = kat(`base-sink-${z.szerokoscMM ?? 600}`);
    const sklad: Element["sklad"] = [{ dx: 0, szer: ks.widthMM, plan: { rola: "zlew", katalogId: ks.id, szerokoscMM: ks.widthMM } }];
    if (o.zmywarka !== null) {
      const zm = o.zmywarka ?? {};
      const kz = kat(`dishwasher-front-${zm.szerokoscMM ?? 600}`);
      const p = { dx: 0, szer: kz.widthMM, plan: { rola: "zmywarka" as const, katalogId: kz.id, szerokoscMM: kz.widthMM } };
      if (zm.strona === "lewa") {
        sklad.unshift(p);
        sklad[1].dx = kz.widthMM;
      } else {
        p.dx = ks.widthMM;
        sklad.push(p);
      }
    }
    elementy.push({ rodzaj: "zlew", sciana: sprawdzSciane(z.sciana, "zlew"), xMM: z.xMM, szerokoscMM: sklad.reduce((s, x) => s + x.szer, 0), kolejnosc: 1, sklad });
  } else if (o.zmywarka) ostrzezenia.push("Zmywarka bez zlewu — pominięta (dodaj ją ręcznie).");

  let hob: { sciana: number; szer: number } | undefined;
  if (o.plyta !== null) {
    const pl = o.plyta ?? {};
    const w = pl.szerokoscMM ?? 600;
    let k = (pl.piekarnikPod ?? true) && w === 600 ? kat("base-oven-600") : undefined;
    if ((pl.piekarnikPod ?? true) && w !== 600) ostrzezenia.push(`Katalog ma szafkę pod piekarnik tylko 600 mm — pod płytą ${w} mm wstawiono szafkę z szufladami.`);
    k ??= kat(`base-drawers-${w}`);
    elementy.push({ rodzaj: "plyta", sciana: sprawdzSciane(pl.sciana, "plyta"), xMM: pl.xMM, szerokoscMM: k.widthMM, kolejnosc: 2, sklad: [{ dx: 0, szer: k.widthMM, plan: { rola: "plyta", katalogId: k.id, szerokoscMM: k.widthMM } }] });
    hob = { sciana: elementy[elementy.length - 1].sciana, szer: k.widthMM };
  }

  // --- Słupek / lodówka przy drzwiach szafki ślepej (koniec ściany z narożnikiem): blenda 50 mm + ostrzeżenie ---
  if (naroznik === "slepa")
    for (const e of elementy) {
      if (e.rodzaj !== "lodowka" || e.sciana >= n - 1) continue;
      const przyNarozniku = e.xMM !== undefined ? e.xMM + e.szerokoscMM > koniecDolny[e.sciana] - Z.blendaNaroznaMM - 0.5 : e.kolejnosc === 3;
      if (!przyNarozniku) continue;
      koniecDolny[e.sciana] = r1(koniecDolny[e.sciana] - Z.blendaNaroznaMM);
      plan.push(blendaLubDopasowana(Z.blendaNaroznaMM, sciany[e.sciana].id, koniecDolny[e.sciana], "dolny", "blendaNarozna"));
      ostrzezenia.push(`${Opis(sciany[e.sciana].nazwa)}: słupek/lodówka przy drzwiach szafki narożnej ślepej — dodano blendę ${Z.blendaNaroznaMM} mm; sprawdź kolizję frontu i uchwytu przy otwieraniu.`);
    }

  // --- Rozmieszczenie na ścianach ---
  const polozenie = new Map<Element, number>();
  const minOdstep = (a: Granica, b: Granica): { mm: number; prio: number; waga: number } => {
    const para = new Set([a, b]);
    if (para.has("zlew") && para.has("plyta")) return { mm: Z.zlewPlytaMinMM, prio: 3, waga: 2 };
    if (para.has("plyta")) return { mm: Z.plytaOdBokuMinMM, prio: 2, waga: 1 };
    if (para.has("lodowka") && para.has("zlew")) return { mm: Z.odkladanieObokLodowkiMM, prio: 1, waga: 1 };
    return { mm: 0, prio: 0, waga: 1 };
  };
  const granicaKonca = (i: number, strona: "lewa" | "prawa"): Granica =>
    strona === "lewa" ? (i > 0 ? "naroznik" : "koniec") : i < n - 1 ? "naroznik" : "koniec";

  for (let i = 0; i < n; i++) {
    const naScianie = elementy.filter((e) => e.sciana === i);
    const stale = naScianie.filter((e) => e.xMM !== undefined).sort((a, b) => a.xMM! - b.xMM!);
    for (const e of stale) {
      if (e.xMM! < startDolny[i] - 0.5 || e.xMM! + e.szerokoscMM > koniecDolny[i] + 0.5)
        throw new BladUkladu(`${e.rodzaj}: pozycja ${e.xMM}–${e.xMM! + e.szerokoscMM} mm poza wolnym odcinkiem (${opisSciany(sciany[i].nazwa)}: ${startDolny[i]}–${koniecDolny[i]} mm).`);
      polozenie.set(e, e.xMM!);
    }
    for (let j = 1; j < stale.length; j++)
      if (stale[j].xMM! < stale[j - 1].xMM! + stale[j - 1].szerokoscMM - 0.5) throw new BladUkladu(`${stale[j - 1].rodzaj} i ${stale[j].rodzaj} nachodzą na siebie.`);
    const auto = naScianie.filter((e) => e.xMM === undefined).sort((a, b) => a.kolejnosc - b.kolejnosc);
    if (!auto.length) continue;
    // Odcinki między elementami stałymi; automatyczne idą do najdłuższego.
    const odc: { a: number; b: number; gl: Granica; gp: Granica }[] = [];
    let x = startDolny[i];
    let gl: Granica = granicaKonca(i, "lewa");
    for (const e of stale) {
      odc.push({ a: x, b: e.xMM!, gl, gp: e.rodzaj });
      x = e.xMM! + e.szerokoscMM;
      gl = e.rodzaj;
    }
    odc.push({ a: x, b: koniecDolny[i], gl, gp: granicaKonca(i, "prawa") });
    const cel = odc.reduce((m, c) => (c.b - c.a > m.b - m.a ? c : m));
    rozmiesc(cel, auto, sciany[i].nazwa);
  }

  function rozmiesc(odc: { a: number; b: number; gl: Granica; gp: Granica }, el: Element[], nazwaSciany: string) {
    const suma = el.reduce((s, e) => s + e.szerokoscMM, 0);
    const wolne = odc.b - odc.a - suma;
    if (wolne < -0.5) throw new BladUkladu(`${Opis(nazwaSciany)}: elementy (${el.map((e) => e.rodzaj).join(", ")}, ${suma} mm) nie mieszczą się na wolnym odcinku ${Math.round(odc.b - odc.a)} mm.`);
    const granice: Granica[] = [odc.gl, ...el.map((e) => e.rodzaj), odc.gp];
    const luki = el.length + 1;
    const min: number[] = [];
    const waga: number[] = [];
    const prio: number[] = [];
    for (let g = 0; g < luki; g++) {
      const lewa = granice[g];
      const prawa = granice[g + 1];
      // Lodówka przyklejona do końca ściany / narożnika (pierwsza lub ostatnia na odcinku).
      const przyklejona = (g === 0 && prawa === "lodowka" && el[0].kolejnosc === 0) || (g === luki - 1 && lewa === "lodowka" && el[el.length - 1].kolejnosc === 3);
      if (przyklejona) { min.push(0); waga.push(0); prio.push(0); continue; }
      const m = minOdstep(lewa, prawa);
      min.push(m.mm); waga.push(m.waga); prio.push(m.prio);
    }
    let brak = min.reduce((s, v) => s + v, 0) - wolne;
    for (const p of [1, 2, 3]) {
      if (brak <= 0.5) break;
      for (let g = 0; g < luki && brak > 0.5; g++) {
        if (prio[g] !== p || min[g] <= 0) continue;
        const ile = Math.min(min[g], brak);
        min[g] -= ile;
        brak -= ile;
        ostrzezenia.push(`${Opis(nazwaSciany)}: odstęp ${granice[g]}–${granice[g + 1]} zmniejszony do ${Math.round(min[g])} mm (założenie ergonomii nie spełnione — brak miejsca).`);
      }
    }
    const nadwyzka = wolne - min.reduce((s, v) => s + v, 0);
    const sumaWag = waga.reduce((s, v) => s + v, 0);
    const idealne = min.map((m, g) => m + (sumaWag > 0 ? (nadwyzka * waga[g]) / sumaWag : g === luki - 1 ? nadwyzka : 0));
    // Luka „pochłaniająca” resztę: przy wolnym końcu ściany, inaczej największa z wagą > 0.
    let poch = -1;
    for (let g = luki - 1; g >= 0; g--) if (waga[g] > 0 && (granice[g] === "koniec" || granice[g + 1] === "koniec")) { poch = g; break; }
    if (poch < 0) poch = idealne.reduce((m, v, g) => (waga[g] > 0 && v > (idealne[m] ?? -1) ? g : m), luki - 1);
    const osiagalne = sumyOsiagalne(szerDolne, Math.ceil(wolne));
    const luk = idealne.map((v, g) => (g === poch ? 0 : przyciagnij(v, min[g], osiagalne)));
    luk[poch] = Math.max(0, wolne - luk.reduce((s, v) => s + v, 0));
    let x = odc.a;
    el.forEach((e, k) => {
      x += luk[k];
      polozenie.set(e, r1(x));
      x += e.szerokoscMM;
    });
  }

  function dodajOdcinki(r: PlanOdcinkow, scianaId: string, rzad: Rzad) {
    plan.push(...r.plan);
    for (const l of r.luzy) rezerwacje.push({ scianaId, rzad, odMM: l.odMM, doMM: l.doMM, opis: "Luz montażowy (bez blendy)" });
    ostrzezenia.push(...r.uwagi);
  }

  // --- Plan dolnego rzędu ---
  const wysokie: { sciana: number; od: number; do: number }[] = [];
  for (const e of elementy) {
    const x0 = polozenie.get(e)!;
    const sc = sciany[e.sciana];
    for (const s of e.sklad) {
      if (s.plan) plan.push({ ...s.plan, scianaId: sc.id, pozycjaXMM: r1(x0 + s.dx) });
      else rezerwacje.push({ scianaId: sc.id, rzad: "dolny", odMM: r1(x0 + s.dx), doMM: r1(x0 + s.dx + s.szer), opis: s.opis ?? "Rezerwacja" });
      if (s.wysoki) wysokie.push({ sciana: e.sciana, od: x0 + s.dx, do: x0 + s.dx + s.szer });
    }
  }
  for (let i = 0; i < n; i++) {
    const sc = sciany[i];
    const zaj: (Przedzial & { g: Granica })[] = elementy
      .filter((e) => e.sciana === i)
      .map((e) => ({ odMM: polozenie.get(e)!, doMM: polozenie.get(e)! + e.szerokoscMM, g: e.rodzaj }));
    const wolne = wolnePrzedzialy(startDolny[i], koniecDolny[i], zaj);
    for (const w of wolne) {
      const lewa = zaj.find((z) => Math.abs(z.doMM - w.odMM) < 1)?.g ?? granicaKonca(i, "lewa");
      const prawa = zaj.find((z) => Math.abs(z.odMM - w.doMM) < 1)?.g ?? granicaKonca(i, "prawa");
      const strona = prawa === "koniec" || prawa === "lodowka" ? "koniec" : lewa === "koniec" || lewa === "lodowka" ? "poczatek" : "koniec";
      dodajOdcinki(modulyZOdcinkow(rozlozDlugosc(w.doMM - w.odMM, szerDolne, { symetria: o.symetria, blenda: strona, cargo: CARGO_RESZTY }), sc.id, w.odMM, "dolny", dolne), sc.id, "dolny");
    }
  }

  // --- Plan rzędu wiszącego ---
  if (wiszace) {
    for (let i = 0; i < n; i++) {
      const sc = sciany[i];
      const zaj: Przedzial[] = wysokie.filter((w) => w.sciana === i).map((w) => ({ odMM: w.od, doMM: w.do, opis: "słupek / lodówka" }));
      for (const p of przerwy) if (p.sciana === i) zaj.push({ odMM: Math.max(0, p.odMM), doMM: Math.min(sc.dlugoscMM, p.doMM), opis: "przerwa" });
      const pl = elementy.find((e) => e.rodzaj === "plyta" && e.sciana === i);
      if (pl && hob) {
        const x = polozenie.get(pl)!;
        const okap = (o.okap ?? "szafka") === "szafka" ? modulKatalogowy(`wall-hood-${hob.szer}`) : undefined;
        if ((o.okap ?? "szafka") === "szafka" && !okap) ostrzezenia.push(`Brak szafki okapowej ${hob.szer} mm w katalogu — nad płytą zostawiono przerwę.`);
        if (okap) {
          const kolizja = zaj.some((z) => z.odMM < x + okap.widthMM - 0.5 && z.doMM > x + 0.5) || x < startWisz[i] - 0.5 || x + okap.widthMM > koniecWisz[i] + 0.5;
          if (kolizja) ostrzezenia.push("Szafka okapowa koliduje z narożnikiem wiszącym, słupkiem lub przerwą — pominięta.");
          else plan.push({ scianaId: sc.id, rola: "okap", katalogId: okap.id, pozycjaXMM: r1(x), szerokoscMM: okap.widthMM });
        }
        zaj.push({ odMM: x, doMM: x + hob.szer, opis: "nad płytą" });
      }
      for (const w of wolnePrzedzialy(startWisz[i], koniecWisz[i], zaj))
        dodajOdcinki(modulyZOdcinkow(rozlozDlugosc(w.doMM - w.odMM, szerWiszace, { symetria: o.symetria, blenda: "koniec" }), sc.id, w.odMM, "wiszacy"), sc.id, "wiszacy");
    }
  }

  // --- Wysokość pomieszczenia ---
  for (const s of sciany) {
    if (wysokie.length && s.wysokoscMM < 2170) ostrzezenia.push(`${Opis(s.nazwa)}: wysokość ${s.wysokoscMM} mm < 2170 mm (słupek 2070 + nogi 100) — skróć słupki.`);
    if (wiszace && s.wysokoscMM < 2120) ostrzezenia.push(`${Opis(s.nazwa)}: wysokość ${s.wysokoscMM} mm < 2120 mm — szafki wiszące nie mieszczą się.`);
  }

  return { plan: plan.sort((a, b) => sciany.findIndex((s) => s.id === a.scianaId) - sciany.findIndex((s) => s.id === b.scianaId) || a.pozycjaXMM - b.pozycjaXMM), rezerwacje, ostrzezenia, zalozenia };
}

/** Sumy szerokości osiągalne z katalogowych szafek (do „przyciągania” odstępów do pełnych szafek). */
function sumyOsiagalne(szerokosci: number[], maks: number): boolean[] {
  const t = new Array<boolean>(Math.max(0, maks) + 1).fill(false);
  t[0] = true;
  for (let s = 1; s <= maks; s++) for (const w of szerokosci) if (w <= s && t[s - w]) { t[s] = true; break; }
  return t;
}

function przyciagnij(v: number, min: number, osiagalne: boolean[]): number {
  for (let s = Math.min(Math.floor(v), osiagalne.length - 1); s >= Math.ceil(min); s--) if (osiagalne[s]) return s;
  return Math.max(min, Math.floor(v));
}
