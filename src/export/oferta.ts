import type {
  DaneFirmy,
  Material,
  PodsumowanieWariantu,
  Projekt,
  ProjektWyceny,
  WariantWyceny,
  ZbudowanyModul,
} from "../core/types.js";
import { standardOfferPdf } from "./offer-standard.js";

export interface Wizualizacja {
  tytul: string;
  jpeg: Buffer;
}

export interface WejscieOferty {
  projekt: Projekt;
  zbudowane: ZbudowanyModul[];
  ilosci: ProjektWyceny;
  warianty: PodsumowanieWariantu[];
  wariant: WariantWyceny;
  firma: DaneFirmy;
  materialy: Map<string, Material>;
  wizualizacje: Wizualizacja[];
  numer: string;
  data: Date;
  waznoscDni: number;
  terminRealizacji: string;
  uwagi: string[];
  /**
   * Propozycja wstępna (OCENA-kreatora §4, zmiana 4): przy brakach cen — znak „cena do potwierdzenia”
   * na każdej stronie i jawna lista braków. Nie zgadujemy ceny ani jej maksymalnej wartości.
   */
  wstepna?: { braki: string[] };
}

// All customer offers use the approved two-page A4 format.
export function ofertaPdf(w: WejscieOferty): Promise<Buffer> {
  const v = w.warianty.find((v) => v.wariant === w.wariant);
  if (!v) throw new Error("Brak wybranego wariantu wyceny.");
  const incomplete = !!w.wstepna || v.pozycje.some((p) => p.jestBledemWyceny);
  const raw = [
    {
      label: "Meble z frontami i okuciami",
      cost: v.pozycje
        .filter((p) => !["blaty", "montaz", "transport"].includes(p.kategoria))
        .reduce((s, p) => s + p.kosztNetto, 0),
    },
    {
      label: "Blat",
      cost: v.pozycje
        .filter((p) => p.kategoria === "blaty")
        .reduce((s, p) => s + p.kosztNetto, 0),
    },
    {
      label: "Transport i montaż",
      cost: v.pozycje
        .filter((p) => ["montaz", "transport"].includes(p.kategoria))
        .reduce((s, p) => s + p.kosztNetto, 0),
    },
  ];
  const sum = raw.reduce((s, g) => s + g.cost, 0);
  const groups =
    sum > 0
      ? raw.map((g) => ({
          label: g.label,
          gross: Math.round(((v.cenaBrutto * g.cost) / sum) * 100) / 100,
        }))
      : [];
  if (groups.length)
    groups[0].gross =
      Math.round(
        (groups[0].gross +
          v.cenaBrutto -
          groups.reduce((s, g) => s + g.gross, 0)) *
          100,
      ) / 100;
  return standardOfferPdf({
    title: w.projekt.nazwa,
    date: w.data,
    reference: w.numer,
    gross: incomplete ? null : v.cenaBrutto,
    groups: incomplete ? [] : groups,
    scope: [
      {
        label: "Projekt",
        description: `${w.projekt.klient.nazwa || "Klient"}; ${w.ilosci.liczbaModulow} szafek. Wariant: ${v.nazwa}.`,
      },
      {
        label: "Materiały",
        description: [
          ...new Set(
            w.ilosci.uzyciaMaterialow.map(
              (u) =>
                w.materialy.get(u.materialId)?.nazwa ?? "Materiał do ustalenia",
            ),
          ),
        ].join(", "),
      },
      {
        label: "Wyposażenie",
        description: `${w.ilosci.liczbaSzuflad} szuflad, ${w.ilosci.liczbaPolekWewnetrznych} półek. Okucia według wybranego wariantu.`,
      },
      {
        label: "Blat",
        description: `Około ${w.ilosci.metryBiezaceBlatu} mb; dekor i wycięcia według zatwierdzonego projektu.`,
      },
      {
        label: "Realizacja",
        description: `${w.terminRealizacji || "Termin do uzgodnienia"}. ${w.firma.nazwaFirmy || "Pan Stolarz"}.`,
      },
    ],
    notes: [
      ...(w.wstepna?.braki ?? []),
      ...w.uwagi,
      `Oferta ${w.numer}. ${incomplete ? "Cena do potwierdzenia; braki wyceny wymagają uzupełnienia." : `Ważność: ${w.waznoscDni} dni od daty wystawienia.`}`,
      "Rysunki poglądowe; dokumentacja wykonawcza wymaga odrębnego zatwierdzenia.",
    ],
    modules: w.projekt.moduly,
    built: w.zbudowane,
    preliminary: incomplete,
  });
}
