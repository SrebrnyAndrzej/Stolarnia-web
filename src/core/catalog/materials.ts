import type { Material } from "../types.js";

// Ceny referencyjne płyt z CennikRynkowyPlyt.swift (research 20.06.2026, brutto/arkusz 2800×2070×18).
const CENY_REFERENCYJNE_PLYT: Record<string, { srednia: number; min: number; max: number; zrodla: string[] }> = {
  "egger.uni": { srednia: 412.51, min: 395.92, max: 429.1, zrodla: ["WIP Rumia", "M-HM"] },
  "egger.wood": { srednia: 450.83, min: 407.28, max: 515.96, zrodla: ["M-HM", "Belmeb", "Hadson 2"] },
  "egger.material": { srednia: 528.92, min: 526.93, max: 530.91, zrodla: ["WIP Rumia", "M-HM"] },
  "kronospan.uni": { srednia: 272.74, min: 272.41, max: 273.06, zrodla: ["Kronosfera", "Beta Meble"] },
  "kronospan.wood": { srednia: 226.27, min: 184.0, max: 260.82, zrodla: ["Modiy", "Intar", "Kronosfera", "Beta Meble"] },
  "kronospan.material": { srednia: 369.62, min: 360.39, max: 378.84, zrodla: ["Strefa Płyt", "Kronosfera"] },
};

type Grupa = "Uni" | "Drewno" | "Kamień" | "Materiał";

// Wzorniki startowe z BazaMaterialowWzornikiSeeder.swift.
const WZORNIKI: [string, string, string, string, string, Grupa, string][] = [
  ["EGGER", "Decorative Collection 26+", "W1100", "Alpine White", "ST9", "Uni", "#F4F3ED"],
  ["EGGER", "Decorative Collection 26+", "W1000", "Premium White", "ST9", "Uni", "#F8F7F0"],
  ["EGGER", "Decorative Collection 26+", "U104", "Alabaster White", "ST9", "Uni", "#EDE7D7"],
  ["EGGER", "Decorative Collection 26+", "U201", "Pebble Grey", "ST9", "Uni", "#B9B2A8"],
  ["EGGER", "Decorative Collection 26+", "U702", "Cashmere Grey", "ST9", "Uni", "#B9AFA2"],
  ["EGGER", "Decorative Collection 26+", "U705", "Angora Grey", "ST9", "Uni", "#C6BCAD"],
  ["EGGER", "Decorative Collection 26+", "U708", "Light Grey", "ST9", "Uni", "#C8C8C3"],
  ["EGGER", "Decorative Collection 26+", "U727", "Stone Grey", "ST9", "Uni", "#9B958D"],
  ["EGGER", "Decorative Collection 26+", "U732", "Dust Grey", "ST9", "Uni", "#787A77"],
  ["EGGER", "Decorative Collection 26+", "U750", "Taupe Grey", "ST9", "Uni", "#867D72"],
  ["EGGER", "Decorative Collection 26+", "U960", "Onyx Grey", "ST9", "Uni", "#4D5150"],
  ["EGGER", "Decorative Collection 26+", "U961", "Graphite Grey", "ST7", "Uni", "#3F4444"],
  ["EGGER", "Decorative Collection 26+", "U999", "Black", "ST7", "Uni", "#1F2020"],
  ["EGGER", "Decorative Collection 26+", "H1180", "Natural Halifax Oak", "ST37", "Drewno", "#B58B5D"],
  ["EGGER", "Decorative Collection 26+", "H1385", "Natural Casella Oak", "ST40", "Drewno", "#B99A70"],
  ["EGGER", "Decorative Collection 26+", "H1714", "Lincoln Walnut", "ST19", "Drewno", "#72513B"],
  ["EGGER", "Decorative Collection 26+", "H3303", "Natural Hamilton Oak", "ST10", "Drewno", "#A77D4E"],
  ["EGGER", "Decorative Collection 26+", "F206", "Black Pietra Grigia", "ST9", "Kamień", "#3A3A38"],
  ["Kronospan", "Global Collection 3.0", "0101", "Front White", "PE", "Uni", "#F3F3EE"],
  ["Kronospan", "Global Collection 3.0", "0110", "White", "SM", "Uni", "#F8F8F4"],
  ["Kronospan", "Global Collection 3.0", "0190", "Black", "PE", "Uni", "#202121"],
  ["Kronospan", "Global Collection 3.0", "5981", "Cashmere", "BS", "Uni", "#B8AA9C"],
  ["Kronospan", "Global Collection 3.0", "7045", "Satin", "SU", "Uni", "#D8D0C4"],
  ["Kronospan", "Global Collection 3.0", "7181", "Dark Chocolate", "BS", "Uni", "#493A34"],
  ["Kronospan", "Global Collection 3.0", "K096", "Clay Grey", "SU", "Uni", "#9E968B"],
  ["Kronospan", "Global Collection 3.0", "K003", "Gold Craft Oak", "PW", "Drewno", "#B9834F"],
  ["Kronospan", "Global Collection 3.0", "K005", "Oyster Urban Oak", "PW", "Drewno", "#B6A185"],
  ["Kronospan", "Global Collection 3.0", "K006", "Amber Urban Oak", "PW", "Drewno", "#9C6E43"],
  ["Kronospan", "Global Collection 3.0", "K086", "Natural Rockford Hickory", "PW", "Drewno", "#B48C62"],
  ["Kronospan", "Global Collection 3.0", "K105", "Raw Endgrain Oak", "PW", "Drewno", "#A6845E"],
  ["Kronospan", "Global Collection 3.0", "K358", "Honey Castello Oak", "PW", "Drewno", "#B78048"],
  ["Kronospan", "Global Collection 3.0", "K359", "Brandy Castello Oak", "PW", "Drewno", "#83583B"],
  ["Kronospan", "Global Collection 3.0", "K365", "Coast Evoke Oak", "PW", "Drewno", "#BEA27C"],
  ["Kronospan", "Global Collection 3.0", "K366", "Fossil Evoke Oak", "PW", "Drewno", "#7F7365"],
  ["Kronospan", "Global Collection 3.0", "K349", "Silk Flow", "RT", "Materiał", "#BEB7AD"],
  ["Kronospan", "Global Collection 3.0", "K350", "Concrete Flow", "RT", "Materiał", "#8E8D88"],
];

function kluczCeny(producent: string, grupa: Grupa): string {
  const p = producent.toLowerCase().includes("kronospan") ? "kronospan" : "egger";
  const g = grupa === "Drewno" ? "wood" : grupa === "Uni" ? "uni" : "material";
  return `${p}.${g}`;
}

export function slug(...czesci: string[]): string {
  return czesci
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const plyty: Material[] = WZORNIKI.map(([producent, kolekcja, kod, nazwa, struktura, grupa, hex]) => {
  const cena = CENY_REFERENCYJNE_PLYT[kluczCeny(producent, grupa)];
  return {
    id: slug(producent, kod, struktura),
    kod: `${producent.toUpperCase()}-${kod}-${struktura}`,
    nazwa: `${kod} ${nazwa}`,
    producent,
    typ: "plytaLaminowana",
    dekor: nazwa,
    grupaDekoru: grupa,
    kolekcja,
    struktura,
    gruboscMM: 18,
    szerokoscArkuszaMM: 2800,
    wysokoscArkuszaMM: 2070,
    jednostka: "sztuka",
    cenaNetto: round2(cena.srednia / 1.23),
    vatProcent: 23,
    rabatProcent: 0,
    aktywny: true,
    kierunekDekoru: grupa === "Drewno",
    kolorHEX: hex,
    notatki:
      `Wzornik ${producent}, kolekcja ${kolekcja}. Cena startowa = średnia netto reprezentanta grupy "${grupa}" ` +
      `(brutto ${cena.min.toFixed(2)}–${cena.max.toFixed(2)} zł/ark., źródła: ${cena.zrodla.join(", ")}; research 20.06.2026). ` +
      `Kolor HEX służy wyłącznie do wizualizacji.`,
  };
});

function m2(
  id: string,
  nazwa: string,
  typ: Material["typ"],
  cenaNetto: number,
  kolorHEX: string,
  gruboscMM: number,
  notatki: string,
): Material {
  return {
    id,
    kod: id.toUpperCase(),
    nazwa,
    producent: "Stolarnia",
    typ,
    dekor: nazwa,
    gruboscMM,
    szerokoscArkuszaMM: 0,
    wysokoscArkuszaMM: 0,
    jednostka: "metrKwadratowy",
    cenaNetto,
    vatProcent: 23,
    rabatProcent: 0,
    aktywny: true,
    kierunekDekoru: false,
    kolorHEX,
    notatki,
  };
}

function mb(id: string, nazwa: string, typ: Material["typ"], cenaNetto: number, kolorHEX: string, gruboscMM: number): Material {
  return {
    ...m2(id, nazwa, typ, cenaNetto, kolorHEX, gruboscMM, "Cena orientacyjna za mb (fallback z DoborMaterialowWyceny.swift) — uzupełnij cennik dostawcy."),
    jednostka: "metrBiezacy",
  };
}

// Fronty i blaty: poziomy cen = wartości fallback z DoborMaterialowWyceny.swift.
const fronty: Material[] = [
  m2("front-mdf-folia", "Front MDF foliowany 18 mm", "front", 240, "#EDEBE6", 18, "Cena orientacyjna netto/m² — uzupełnij cennik dostawcy frontów."),
  m2("front-mdf-lakier-mat", "Front MDF lakierowany mat 19 mm", "front", 420, "#E9E6DF", 19, "Cena orientacyjna netto/m² — uzupełnij cennik lakierni."),
  m2("front-mdf-lakier-polysk", "Front MDF lakierowany połysk 19 mm", "front", 520, "#F2F1EE", 19, "Cena orientacyjna netto/m²."),
  m2("front-fornir-dab", "Front fornirowany dąb 19 mm", "front", 650, "#B08A5E", 19, "Cena orientacyjna netto/m² — segment VIP."),
];

const plecy: Material[] = [
  {
    ...m2("hdf-3-bialy", "HDF 3 mm biały (plecy, dna szuflad)", "hdf", 0, "#F2F2EE", 3, "Cena orientacyjna arkusza HDF 2800×2070×3 — uzupełnij cennik."),
    jednostka: "sztuka",
    szerokoscArkuszaMM: 2800,
    wysokoscArkuszaMM: 2070,
    cenaNetto: 42,
  },
];

const blaty: Material[] = [
  mb("blat-lam-38-eco", "Blat laminowany 38 mm — podstawowy", "blatLaminowany", 180, "#C8B79E", 38),
  mb("blat-lam-38", "Blat laminowany 38 mm — wyższa klasa", "blatLaminowany", 320, "#A98F6E", 38),
  mb("blat-kompakt-12", "Blat kompaktowy HPL 12 mm", "blatKompaktowy", 760, "#3C3C3A", 12),
  mb("blat-spiek-12", "Blat kamienny / spiek 12–20 mm", "blatKamienny", 1350, "#D9D6CF", 20),
];

export const MATERIALY_STARTOWE: Material[] = [...plyty, ...fronty, ...plecy, ...blaty];

export const DOMYSLNY_KORPUS = "egger-w1100-st9";
export const DOMYSLNY_FRONT = "egger-u708-st9";
export const DOMYSLNE_PLECY = "hdf-3-bialy";
export const DOMYSLNY_BLAT = "blat-lam-38";

// ---------- Ceny (MaterialStolarski.cenaPoRabacieNetto / cenaZaM2Netto) ----------

export function cenaPoRabacieNetto(m: Material): number {
  return m.cenaNetto * (1 - Math.max(Math.min(m.rabatProcent, 100), 0) / 100);
}

export function powierzchniaArkuszaM2(m: Material): number | null {
  if (m.szerokoscArkuszaMM <= 0 || m.wysokoscArkuszaMM <= 0) return null;
  return (m.szerokoscArkuszaMM * m.wysokoscArkuszaMM) / 1_000_000;
}

export function cenaZaM2Netto(m: Material): number | null {
  if (m.jednostka === "sztuka") {
    const pow = powierzchniaArkuszaM2(m);
    return pow && pow > 0 ? cenaPoRabacieNetto(m) / pow : null;
  }
  return m.jednostka === "metrKwadratowy" ? cenaPoRabacieNetto(m) : null;
}

export function opisMaterialu(m: Material | undefined): string {
  if (!m) return "brak materiału";
  return m.producent === "Stolarnia" ? m.nazwa : `${m.producent} ${m.nazwa}`;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
