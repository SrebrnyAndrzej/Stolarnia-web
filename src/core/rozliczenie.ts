import { z } from "zod";
import type { Umowa } from "./contracts.js";

// Rozliczenie projektu (ST-APP-005): wpłaty klienta, kwota pozostała i status. Faktury zostają poza systemem
// (decyzja z 1.11, docs/PLAN-praca-stolarni.md) — tu jest tylko ewidencja wpłat do bieżącej kontroli.

export const SPOSOBY_WPLATY = ["przelew", "gotowka", "karta", "inne"] as const;
export type SposobWplaty = (typeof SPOSOBY_WPLATY)[number];
export interface Wplata {
  id: string;
  data: string;
  kwota: number;
  sposob: SposobWplaty;
  opis: string;
  dodano: string;
}

const data = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data w formacie RRRR-MM-DD.")
  .refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Nieprawidłowa data.");
export const schematWplaty = z
  .object({
    data,
    kwota: z
      .number()
      .finite()
      .positive("Kwota musi być większa od zera.")
      .max(100000000)
      .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001, "Kwota może mieć najwyżej dwa miejsca po przecinku."),
    sposob: z.enum(SPOSOBY_WPLATY),
    opis: z.string().trim().max(300).default(""),
  })
  .strict();

export type StatusRozliczenia = "brakCeny" | "nierozliczony" | "rozliczony" | "nadplata";
export const NAZWY_STATUSU: Record<StatusRozliczenia, string> = {
  brakCeny: "brak ceny do rozliczenia",
  nierozliczony: "do zapłaty",
  rozliczony: "rozliczony",
  nadplata: "nadpłata",
};

export interface PozycjaRozliczenia {
  id: string;
  data: string;
  kwota: number;
  sposob: SposobWplaty | "zaliczka z umowy";
  opis: string;
  /** Wpłata zapisana w umowie (zaliczka) — zmienia się w umowie, nie tutaj. */
  zUmowy: boolean;
}

export interface Rozliczenie {
  naleznosc: number | null;
  zrodloNaleznosci: string;
  wplaty: PozycjaRozliczenia[];
  wplacono: number;
  pozostalo: number | null;
  status: StatusRozliczenia;
}

const grosze = (v: number) => Math.round(v * 100) / 100;

/**
 * Należność: cena z ostatniej umowy (to, co klient podpisał), a bez umowy cena uzgodniona projektu.
 * Wpłaty: zaliczka z ostatniej umowy, jeśli potwierdzono jej otrzymanie, oraz wpłaty dopisane w projekcie.
 */
export function rozliczenie(p: { umovy?: Umowa[]; cenaUzgodnionaBrutto?: number; wplaty?: Wplata[] }): Rozliczenie {
  const umowa = [...(p.umovy ?? [])].sort((a, b) => a.utworzono.localeCompare(b.utworzono)).at(-1);
  const naleznosc = umowa ? umowa.cena : (p.cenaUzgodnionaBrutto ?? null);
  const zrodloNaleznosci = umowa ? `umowa ${umowa.numer}` : p.cenaUzgodnionaBrutto !== undefined ? "cena uzgodniona" : "brak umowy i ceny uzgodnionej";
  const wplaty: PozycjaRozliczenia[] = [
    ...(umowa && umowa.zaliczkaZaplacona && umowa.zaliczka > 0
      ? [{ id: `umowa:${umowa.id}`, data: umowa.dataZaliczki || umowa.data || umowa.utworzono.slice(0, 10), kwota: umowa.zaliczka, sposob: "zaliczka z umowy" as const, opis: `Zaliczka — umowa ${umowa.numer}`, zUmowy: true }]
      : []),
    ...(p.wplaty ?? []).map((w) => ({ id: w.id, data: w.data, kwota: w.kwota, sposob: w.sposob, opis: w.opis, zUmowy: false })),
  ].sort((a, b) => a.data.localeCompare(b.data));
  const wplacono = grosze(wplaty.reduce((s, w) => s + w.kwota, 0));
  const pozostalo = naleznosc === null ? null : grosze(naleznosc - wplacono);
  const status: StatusRozliczenia = pozostalo === null ? "brakCeny" : pozostalo > 0 ? "nierozliczony" : pozostalo === 0 ? "rozliczony" : "nadplata";
  return { naleznosc, zrodloNaleznosci, wplaty, wplacono, pozostalo, status };
}
