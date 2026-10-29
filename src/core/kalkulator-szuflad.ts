import { z } from "zod";

const dodatnia = z.number().finite().positive();
const nieujemna = z.number().finite().nonnegative();

/** Wspólny kontrakt serwisu, REST i MCP. Wszystkie długości w mm. */
export const wejsciePrzelicznika = z.object({
  LW: dodatnia.optional(), szerokoscKorpusu: dodatnia.optional(), gruboscBoku: dodatnia.optional(),
  NL: dodatnia.optional(), glebokoscKorpusu: dodatnia.optional(), wysokoscFrontu: dodatnia.optional(),
  wariant: z.string().min(1).optional(), sciankaTylna: z.enum(["drewniana", "stalowa"]).optional(), profilId: z.string().min(1).optional(),
  liczbaSzuflad: z.number().int().min(1).max(20).optional(),
  szczelinaFrontow: nieujemna.optional(), dolnaProwadnica: nieujemna.optional(),
  wysokoscWewnetrzna: dodatnia.optional(), gruboscFrontu: dodatnia.optional(),
  frontWewnetrzny: z.boolean().optional(),
  szerokoscFrontu: dodatnia.optional(), pierwszyOtworOdDolu: nieujemna.optional(),
  frontZaDrzwiami: z.boolean().optional(), stronaZawiasow: z.enum(["lewa", "prawa"]).optional(),
  dystansLewy: nieujemna.optional(), dystansPrawy: nieujemna.optional(),
  przesuniecieFrontu: z.number().finite().optional(),
  wystawanieZawiasuLewe: nieujemna.optional(), wystawanieZawiasuPrawe: nieujemna.optional(),
  luzOdZawiasu: nieujemna.optional(),
});
export type WejsciePrzelicznika = z.infer<typeof wejsciePrzelicznika>;

/** Rozstaw równych frontów. Nie zaokrąglamy do rastra 32 i nie wyznaczamy osi wkrętów. */
export function rozstawProwadnic(q: WejsciePrzelicznika) {
  if (q.liczbaSzuflad === undefined) return undefined;
  if (q.wysokoscFrontu === undefined) throw new Error("Podaj wysokość frontu do obliczenia rozstawu prowadnic.");
  if (q.frontWewnetrzny && q.gruboscFrontu === undefined) throw new Error("Podaj grubość frontu wewnętrznego.");
  const szczelina = q.szczelinaFrontow ?? 3;
  const dolna = q.dolnaProwadnica ?? 3;
  const skok = q.wysokoscFrontu + szczelina;
  const r = (n: number) => Math.round(n * 1000) / 1000;
  const prowadnice = Array.from({ length: q.liczbaSzuflad }, (_, i) => ({ numer: i + 1, dolnaKrawedzMM: r(dolna + i * skok) }));
  if (q.wysokoscWewnetrzna !== undefined && prowadnice.at(-1)!.dolnaKrawedzMM >= q.wysokoscWewnetrzna) {
    throw new Error("Górna prowadnica wypada poza światłem korpusu. Zmniejsz liczbę szuflad lub wysokość frontów.");
  }
  const cofniecieMM = q.frontWewnetrzny ? q.gruboscFrontu! : 0;
  return {
    baza: "Górna powierzchnia wieńca dolnego → dolna krawędź prowadnicy (nie oś wkrętów).",
    skokMM: r(skok), prowadnice, cofniecieMM,
    uwagi: [
      "Rozstaw zakłada jednakowe położenie mocowań względem każdego równego frontu. Nie zmienia konstrukcji zapisanego projektu ani wierceń w rastrze 32.",
      "Wysokość światła sprawdza położenie prowadnic; dopasowanie skrzynek, mocowań i nałożenie frontów wymaga osobnego sprawdzenia.",
      ...(q.frontWewnetrzny ? ["Cofnięcie względem montażu standardowego dla frontu z płyty zlicowanego z korpusem; nie jest to profil szuflady wewnętrznej ze stalowym panelem."] : []),
    ],
  };
}
export type MontazSzuflad = ReturnType<typeof rozstawProwadnic>;

/** Dystans 36 po stronie zawiasów zwęża skrzynkę; front jest osobnym wymiarem. */
export function frontZaZwyklymiZawiasami(q: WejsciePrzelicznika, LW: number) {
  if (!q.frontZaDrzwiami) return undefined;
  const lewy = q.dystansLewy ?? (q.stronaZawiasow === "prawa" ? 0 : 36);
  const prawy = q.dystansPrawy ?? (q.stronaZawiasow === "prawa" ? 36 : 0);
  const szerokoscFrontu = q.szerokoscFrontu;
  const LWPoDystansach = LW - lewy - prawy;
  if (LWPoDystansach <= 0) throw new Error("Światło po dystansach ma niedodatnią szerokość.");
  const przesuniecie = (lewy - prawy) / 2 + (q.przesuniecieFrontu ?? 0);
  const krawedzLewa = szerokoscFrontu === undefined ? undefined : (LW - szerokoscFrontu) / 2 + przesuniecie;
  const krawedzPrawa = krawedzLewa === undefined ? undefined : LW - krawedzLewa - szerokoscFrontu!;
  if ((krawedzLewa !== undefined && krawedzLewa < 0) || (krawedzPrawa !== undefined && krawedzPrawa < 0)) throw new Error("Front wewnętrzny wystaje poza światło korpusu. Sprawdź szerokość i przesunięcie frontu.");
  const luz = q.luzOdZawiasu ?? 1;
  const przeswitLewy = q.wystawanieZawiasuLewe === undefined ? undefined : Math.min(lewy, krawedzLewa ?? Infinity) - q.wystawanieZawiasuLewe;
  const przeswitPrawy = q.wystawanieZawiasuPrawe === undefined ? undefined : Math.min(prawy, krawedzPrawa ?? Infinity) - q.wystawanieZawiasuPrawe;
  const kolizja = (przeswitLewy !== undefined && przeswitLewy < (q.wystawanieZawiasuLewe === 0 ? 0 : luz)) || (przeswitPrawy !== undefined && przeswitPrawy < (q.wystawanieZawiasuPrawe === 0 ? 0 : luz));
  const status = kolizja ? "kolizja" : szerokoscFrontu === undefined || przeswitLewy === undefined || przeswitPrawy === undefined ? "brakDanych" : "przeswitBocznySprawdzony";
  return {
    potracenieMM: lewy + prawy,
    szerokoscFrontu, LWPrzedDystansami: LW, LWPoDystansach,
    dystansLewy: lewy, dystansPrawy: prawy, krawedzLewa, krawedzPrawa,
    // Baza wzoru zaczepów to środek otworu PO dodaniu dystansów.
    przesuniecieWzgledemSwiatla: przesuniecie + (prawy - lewy) / 2,
    kolizje: {
      status, przeswitLewy, przeswitPrawy, wymaganyLuzMM: luz,
      opis: kolizja ? "Front lub skrzynka wchodzi w obrys zawiasu albo nie zachowuje wymaganego luzu. Wiercenia frontu zablokowane." : status === "brakDanych" ? "Podaj osobną szerokość frontu i maksymalne wystawanie zawiasów po obu stronach w całym ruchu wysuwania (0 po stronie bez zawiasów). Do tego czasu pozycje wierceń są niezweryfikowane." : "Sprawdzono boczny prześwit frontu i skrzynki względem podanego obrysu zawiasów. Nie obejmuje toru drzwi, głębokości ani kolizji wkrętów z samym zaczepem.",
    },
  };
}
export type FrontZaDrzwiami = ReturnType<typeof frontZaZwyklymiZawiasami>;
