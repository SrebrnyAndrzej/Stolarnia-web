export type KategoriaProduktuOkucia =
  | "szuflady"
  | "zawiasy"
  | "prowadnice"
  | "przesuwne"
  | "podnosniki"
  | "odbojniki"
  | "wkrety"
  | "laczniki"
  | "mocowania"
  | "nogi"
  | "kleje"
  | "chemia"
  | "wyposazenie"
  | "uchwyty"
  | "akcesoria"
  | "narzedzia"
  | "inne";

export const NAZWY_KATEGORII_OKUC: Record<KategoriaProduktuOkucia, string> = {
  szuflady: "Systemy szuflad",
  zawiasy: "Zawiasy",
  prowadnice: "Prowadnice",
  przesuwne: "Systemy przesuwne",
  podnosniki: "Podnośniki",
  odbojniki: "Odbojniki i push",
  wkrety: "Wkręty i konfirmaty",
  laczniki: "Łączniki i kołki",
  mocowania: "Zawieszki i mocowania",
  nogi: "Nogi i kółka",
  kleje: "Kleje",
  chemia: "Chemia meblowa",
  wyposazenie: "Wyposażenie mebli",
  uchwyty: "Uchwyty i gałki",
  akcesoria: "Akcesoria (przepusty, kratki, zamki)",
  narzedzia: "Narzędzia i szablony montażowe",
  inne: "Inne",
};

export interface ProduktOkucia {
  id: string;
  producent: string;
  system: string;
  /** Kategoria aplikacji; starsze rekordy szuflad jej nie miały. */
  kategoria?: KategoriaProduktuOkucia;
  sku: string;
  /** wariant = konkretny indeks producenta; rodzina = karta wielu wariantów; bazowy = element z dokumentacji; dystrybutor = tylko symbol dystrybutora/EAN. */
  rodzajSKU: "wariant" | "rodzina" | "bazowy" | "dystrybutor";
  ean?: string | null;
  symbolDystrybutora?: string | null;
  nazwa: string;
  rodzaj: "zestaw" | "element";
  zdjecieURL: string;
  zdjecieZrodloURL: string;
  zdjecieOpis?: string;
  zdjecia: string[];
  parametry: Record<string, string>;
  dokumenty: { nazwa: string; url: string }[];
  zrodloURL: string;
  zrodloTyp?: "producent" | "dystrybutor";
  /** Cena z publicznej karty sklepu — tylko orientacyjnie, nie jest ceną zakupu stolarni. */
  cenaReferencyjna?: { kwota: number; waluta: string; opis: string; data: string } | null;
  pobrano: string;
  sha256: string;
  zatwierdzoneProdukcyjnie: false;
}
