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
