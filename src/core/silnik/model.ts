// Model mebla dla silnika konstrukcji (etap 1) — plan: docs/RESEARCH-konstruktor-mebli-niestandardowych.md.
// Mebel = korpus + drzewo przestrzeni wnętrza + niezależna siatka frontów + wysuwy łączące front, skrzynkę i strefę.
// Silnik zna tylko ogólne pojęcia; reguły szablonów (np. „górna szuflada ≈20%”) liczy adapter albo polecenie edycji.

/** Rozmiar części w podziale: stały [mm], udział w pozostałym miejscu albo „reszta” (dzielona równo). */
export type Rozmiar = { mm: number } | { udzial: number } | { reszta: true };

export type KierunekPodzialu =
  /** Części jedna nad drugą (podział wysokości, licząc od dołu). */
  | "poziom"
  /** Części obok siebie (podział szerokości, licząc od lewej). */
  | "pion";

export interface PodzialWnetrza {
  kierunek: KierunekPodzialu;
  /** Co rozdziela sąsiednie części: półka stała / przegroda z płyty korpusu albo tylko umowna granica strefy. */
  przegroda: "plyta" | "brak";
  /** Kody elementów przegród (od dołu / od lewej); brak → nadawane automatycznie. */
  kodyPrzegrod?: string[];
  czesci: StrefaWnetrza[];
}

export type WyposazenieStrefy =
  | { typ: "polki"; liczba: number }
  /** Nisza urządzenia (piekarnik, mikrofala) — bez półek. */
  | { typ: "nisza"; opis: string }
  | { typ: "pusta" };

export interface StrefaWnetrza {
  id: string;
  rozmiar?: Rozmiar;
  podzial?: PodzialWnetrza;
  wyposazenie?: WyposazenieStrefy;
  /** Strefa bez pleców HDF (np. nisza piekarnika — głębokość i wentylacja); plecy dzielą się wokół niej. */
  bezPlecow?: boolean;
}

export interface PodzialFrontow {
  kierunek: KierunekPodzialu;
  /**
   * true — sąsiednie fronty dzielą jedną szczelinę (stos szuflad, rząd drzwi);
   * false — każda część ma pełną szczelinę od granicy (np. strefa szuflad | nisza | drzwi).
   */
  szczelinaWspolna: boolean;
  czesci: PoleFrontu[];
}

export type Front =
  | { typ: "drzwi"; kod: string; strona?: "lewa" | "prawa" }
  | { typ: "szuflada"; kod: string }
  /** Zaślepka / blenda z materiału frontu (np. część ślepa narożnika). */
  | { typ: "blenda"; kod: string }
  | { typ: "klapa"; kod: string }
  | { typ: "panelAGD"; kod: string }
  /** Pole bez frontu (otwarta nisza, półka otwarta). */
  | { typ: "otwarte" };

export interface PoleFrontu {
  id: string;
  rozmiar?: Rozmiar;
  podzial?: PodzialFrontow;
  front?: Front;
}

export type PowiazanieWysuwu =
  /** Szuflada ze swoim frontem. */
  | "zFrontem"
  /** Szuflada wewnętrzna za drzwiami. */
  | "zaDrzwiami"
  /** Szuflada wewnętrzna za frontem szuflady, wysuwana osobno (np. nad szufladą garnkową). */
  | "ukrytaZaFrontem"
  /** Szuflada wewnętrzna sprzężona zabierakiem z frontem (Blum ZI7.0M07). */
  | "zZabierakiem";

export interface Wysuw {
  id: string;
  /** Prefiks kodów elementów skrzynki, np. „SZ01”. */
  kod: string;
  /** Pole frontu (dla „zFrontem” — front szuflady; dla pozostałych — front, za którym jest wysuw). */
  poleFrontuId: string;
  /** Strefa wnętrza, w której pracuje wysuw (światło LW, głębokość). */
  strefaId: string;
  powiazanie: PowiazanieWysuwu;
}

export interface Mebel {
  szerokoscMM: number;
  wysokoscMM: number;
  glebokoscMM: number;
  korpus: {
    /** korpus — boki + 2 wieńce; bezKorpusu — sam front (np. zmywarka); blenda — pojedynczy panel. */
    rodzaj: "korpus" | "bezKorpusu" | "blenda";
    plecy: boolean;
    blat: boolean;
    nogi: boolean;
  };
  /** Korzeń = światło korpusu (między bokami i wieńcami). */
  wnetrze: StrefaWnetrza;
  /** Korzeń = obrys czoła mebla. */
  fronty: PoleFrontu;
  wysuwy: Wysuw[];
  /** Skrzynki systemowe (profil producenta) zamiast skrzynek z płyty. */
  szufladySystemowe: boolean;
  dodatki: { cargo?: number; podnosnik?: boolean; systemNarozny?: "lemans" };
}
