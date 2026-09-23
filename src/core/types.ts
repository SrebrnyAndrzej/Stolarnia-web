// Model domenowy Stolarni Online.
// Nazewnictwo i reguły przeniesione z StolarniaApp (Swift): DomainCore, WycenaModels,
// BazaMaterialowModels, BazaOkucModels, ListaFormatekProjektuModelsV070.

// ---------- Ustawienia stolarni (UstawieniaStolarniModels.swift) ----------

export interface DaneFirmy {
  nazwaFirmy: string;
  wlasciciel: string;
  nip: string;
  telefon: string;
  email: string;
  adres: string;
  kodPocztowy: string;
  miasto: string;
}

export interface UstawieniaFinansowe {
  stawkaRoboczogodziny: number;
  marzaProcent: number;
  narzutProcent: number;
  vatProcent: number;
  minimalnaWartoscZlecenia: number;
  kosztTransportuBazowy: number;
  kosztMontazuZaGodzine: number;
  zapasKosztowyProcent: number;
}

export interface UstawieniaKonstrukcyjne {
  gruboscPlytyKorpusuMM: number;
  gruboscPlytySzufladMM: number;
  gruboscPlecHDFMM: number;
  luzMontazowyMM: number;
  szczelinaFrontowMM: number;
  odsunieciePlecMM: number;
  wysokoscCokoluMM: number;
  wysokoscNogiMM: number;
  gruboscFrontuMM: number;
  gruboscBlatuMM: number;
  glebokoscBlatuMM: number;
}

export interface UstawieniaRozkroju {
  /** Długość arkusza — zgodna z kierunkiem dekoru (np. 2800). */
  dlugoscArkuszaMM: number;
  /** Szerokość arkusza (np. 2070). */
  szerokoscArkuszaMM: number;
  rzazPilyMM: number;
  marginesArkuszaMM: number;
  zapasMaterialuProcent: number;
  uwzgledniajKierunekDekoru: boolean;
}

export interface UstawieniaOkleinowania {
  naddatekNaKrawedzMM: number;
  zapasProcent: number;
}

export interface UstawieniaStolarni {
  daneFirmy: DaneFirmy;
  finanse: UstawieniaFinansowe;
  konstrukcja: UstawieniaKonstrukcyjne;
  rozkroj: UstawieniaRozkroju;
  okleinowanie: UstawieniaOkleinowania;
}

// ---------- Materiały (BazaMaterialowModels.swift) ----------

export type TypMaterialu =
  | "plytaLaminowana"
  | "mdf"
  | "hdf"
  | "sklejka"
  | "front"
  | "blatLaminowany"
  | "blatKompaktowy"
  | "blatKamienny"
  | "obrzeze"
  | "szklo"
  | "inne";

export type JednostkaCeny = "sztuka" | "metrKwadratowy" | "metrBiezacy";

export interface Material {
  id: string;
  kod: string;
  nazwa: string;
  producent: string;
  typ: TypMaterialu;
  dekor: string;
  grupaDekoru?: string;
  kolekcja?: string;
  struktura?: string;
  gruboscMM: number;
  szerokoscArkuszaMM: number;
  wysokoscArkuszaMM: number;
  jednostka: JednostkaCeny;
  cenaNetto: number;
  vatProcent: number;
  rabatProcent: number;
  aktywny: boolean;
  kierunekDekoru: boolean;
  kolorHEX: string;
  notatki: string;
}

// ---------- Okucia (BazaOkucModels.swift) ----------

export type TypOkucia =
  | "zawias"
  | "prowadnica"
  | "systemSzuflad"
  | "podnosnik"
  | "cargo"
  | "noga"
  | "cokol"
  | "zawieszka"
  | "uchwyt"
  | "profil"
  | "oswietlenieLED"
  | "lacznik"
  | "wkret"
  | "klej"
  | "obrzeze"
  | "inne";

export type PoziomWyceny = "eco" | "standard" | "premium" | "vip";

export interface Okucie {
  id: string;
  profilID: string;
  nazwa: string;
  producent: string;
  system: string;
  typ: TypOkucia;
  jednostka: string;
  cenaNetto: number;
  rabatProcent: number;
  vatProcent: number;
  poziomWyceny: PoziomWyceny;
  aktywne: boolean;
  opis: string;
}

// ---------- Katalog modułów (KitchenModuleCatalog_v0.14.3.json) ----------

export type KategoriaModulu = "base" | "wall" | "tall" | "corner" | "appliance" | "open";

export type KonstrukcjaModulu =
  | "shelves"
  | "drawers"
  | "cargo"
  | "sink"
  | "oven"
  | "dishwasherFront"
  | "blindCorner"
  | "lCorner"
  | "liftUp"
  | "hood"
  | "wallCorner"
  | "refrigerator"
  | "ovenTower"
  | "ovenMicrowaveTower"
  | "utility"
  | "topBox"
  | "openShelf"
  | "filler";

export type Kotwiczenie = "floorStanding" | "wallMounted" | "builtIn";

export interface ModulKatalogowy {
  id: string;
  name: string;
  category: KategoriaModulu;
  construction: KonstrukcjaModulu;
  anchoring: Kotwiczenie;
  widthMM: number;
  heightMM: number;
  depthMM: number;
  bottomOffsetMM: number;
  availableHeightsMM: number[];
  availableDepthsMM: number[];
  tags: string[];
}

// ---------- Projekt ----------

export type TypFrontu = "drzwi" | "szuflady" | "uchylny" | "brak" | "panelAGD";

export interface KonfiguracjaModulu {
  liczbaPolek: number;
  typFrontu: TypFrontu;
  liczbaDrzwi: number;
  liczbaSzuflad: number;
  liczbaCargo: number;
  plecy: boolean;
  blat: boolean;
  nogi: boolean;
  /** Szuflady w systemie (Tandembox/Legrabox) zamiast skrzynek z płyty. */
  szufladySystemowe: boolean;
}

export interface Modul {
  id: string;
  katalogId?: string;
  nazwa: string;
  kategoria: KategoriaModulu;
  konstrukcja: KonstrukcjaModulu;
  scianaId: string;
  /** Odległość lewej krawędzi modułu od lewego końca ściany [mm]. */
  pozycjaXMM: number;
  /** Wysokość dolnej krawędzi korpusu nad podłogą [mm] (dla dolnych = wysokość nóg). */
  pozycjaYMM: number;
  szerokoscMM: number;
  wysokoscMM: number;
  glebokoscMM: number;
  konfiguracja: KonfiguracjaModulu;
  materialKorpusuId?: string;
  materialFrontuId?: string;
  uwagi?: string;
}

export interface Sciana {
  id: string;
  nazwa: string;
  dlugoscMM: number;
  wysokoscMM: number;
  /**
   * Położenie lica ściany na rzucie [mm], oś Y w dół (jak w DXF po odbiciu).
   * Brak = ściany łączone kolejno pod kątem 90° (układ prosty / L / U).
   */
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export interface Pomieszczenie {
  id: string;
  nazwa: string;
  sciany: Sciana[];
  materialKorpusuId: string;
  materialFrontuId: string;
  materialBlatuId?: string;
}

export interface Klient {
  nazwa: string;
  telefon: string;
  email: string;
  adres: string;
}

export type StatusProjektu = "szkic" | "wycena" | "zaakceptowany" | "produkcja" | "zakonczony";

export interface Projekt {
  id: string;
  nazwa: string;
  klient: Klient;
  status: StatusProjektu;
  pomieszczenia: Pomieszczenie[];
  moduly: Modul[];
  /** Modul.scianaId wskazuje ścianę; ściana należy do pomieszczenia. */
  utworzono: string;
  zmieniono: string;
  rewizja: number;
  notatki: string;
}

// ---------- Geometria elementów (DomainCore FurnitureComponent) ----------

export type RolaElementu =
  | "side"
  | "top"
  | "bottom"
  | "shelf"
  | "divider"
  | "back"
  | "front"
  | "worktop"
  | "plinth"
  | "filler"
  | "reinforcement"
  | "rail"
  | "drawerSide"
  | "drawerFrontBack"
  | "drawerBottom";

export interface Element {
  kod: string;
  rola: RolaElementu;
  /** Wymiary w układzie modułu: szerokość (X), wysokość (Y), głębokość (Z) [mm]. */
  x: number;
  y: number;
  z: number;
  szer: number;
  wys: number;
  gl: number;
  materialRola: "korpus" | "front" | "plecy" | "blat" | "szuflada";
}

export interface OkucieModulu {
  typ: TypOkucia;
  ilosc: number;
  opis: string;
}

export interface ZbudowanyModul {
  modul: Modul;
  elementy: Element[];
  okucia: OkucieModulu[];
  ostrzezenia: string[];
}

// ---------- Formatki / produkcja ----------

export type KategoriaFormatki = "korpus" | "front" | "plecy" | "blat" | "szuflady" | "pozostale";
export type KierunekDekoru = "dowolny" | "wzdluzDlugosci";
export type RodzajObrzeza = "brak" | "abs08" | "abs20";

export interface Formatka {
  id: string;
  etykieta: string;
  indeksModulu: number;
  nazwaModulu: string;
  modulId: string;
  kodElementu: string;
  rola: RolaElementu;
  kategoria: KategoriaFormatki;
  materialId: string;
  materialOpis: string;
  kolorHEX: string;
  dlugoscMM: number;
  szerokoscMM: number;
  gruboscMM: number;
  kierunekDekoru: KierunekDekoru;
  /** Obrzeże kolejno: długa A, długa B, krótka A, krótka B. */
  obrzeza: [RodzajObrzeza, RodzajObrzeza, RodzajObrzeza, RodzajObrzeza];
}

export interface PolozenieFormatki {
  formatkaId: string;
  etykieta: string;
  xMM: number;
  yMM: number;
  szerokoscMM: number;
  dlugoscMM: number;
  obrocona: boolean;
}

export interface Arkusz {
  numer: number;
  materialId: string;
  materialOpis: string;
  gruboscMM: number;
  kolorHEX: string;
  szerokoscMM: number;
  dlugoscMM: number;
  polozenia: PolozenieFormatki[];
  wykorzystanieProcent: number;
}

export interface RaportRozkroju {
  arkusze: Arkusz[];
  nierozmieszczone: { formatkaId: string; etykieta: string; powod: string }[];
  podsumowanie: {
    materialId: string;
    materialOpis: string;
    gruboscMM: number;
    liczbaArkuszy: number;
    powierzchniaFormatekM2: number;
    powierzchniaArkuszyM2: number;
    wykorzystanieProcent: number;
  }[];
}

export interface ZapotrzebowanieObrzeza {
  rodzaj: RodzajObrzeza;
  materialId: string;
  opis: string;
  liczbaKrawedzi: number;
  dlugoscNettoM: number;
  dlugoscZakupuM: number;
}

// ---------- Wycena (WycenaModels.swift) ----------

export type WariantWyceny = "eco" | "standard" | "premium" | "vip";

export type KategoriaKosztu =
  | "plyty"
  | "fronty"
  | "blaty"
  | "okucia"
  | "akcesoria"
  | "robocizna"
  | "montaz"
  | "transport"
  | "pozostale";

export interface PozycjaKosztowa {
  nazwa: string;
  kategoria: KategoriaKosztu;
  ilosc: number;
  jednostka: string;
  cenaJednostkowaNetto: number;
  kosztNetto: number;
  uwagi: string;
  jestBledemWyceny: boolean;
}

export interface PodsumowanieWariantu {
  wariant: WariantWyceny;
  nazwa: string;
  opis: string;
  pozycje: PozycjaKosztowa[];
  kosztBazowyNetto: number;
  zapasKosztowyKwota: number;
  narzutKwota: number;
  marzaKwota: number;
  cenaNetto: number;
  vatKwota: number;
  cenaBrutto: number;
  kosztMaterialowNetto: number;
}

/** Odpowiednik ProjektWyceny.swift — zagregowane ilości projektu. */
export interface ProjektWyceny {
  nazwaProjektu: string;
  liczbaModulow: number;
  metryBiezaceZabudowy: number;
  powierzchniaFrontowM2: number;
  powierzchniaPlytM2: number;
  metryBiezaceBlatu: number;
  liczbaSzuflad: number;
  liczbaZawiasow: number;
  liczbaCargo: number;
  liczbaPodnosnikow: number;
  liczbaGodzinProdukcji: number;
  liczbaGodzinMontazu: number;
  liczbaTransportow: number;
  liczbaModulowDolnych: number;
  liczbaNog: number;
  liczbaModulowWiszacych: number;
  liczbaPolekWewnetrznych: number;
  dlugoscCokoluM: number;
  metryKrawedziBanding: number;
  liczbaFrontow: number;
  uzyciaMaterialow: { rola: "korpus" | "front" | "plecy"; materialId: string; iloscM2: number }[];
  blatMaterialId?: string;
  ostrzezenia: string[];
}
