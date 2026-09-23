import type { UstawieniaStolarni } from "./types.js";

// Wartości domyślne z UstawieniaStolarniModels.swift.
export const USTAWIENIA_DOMYSLNE: UstawieniaStolarni = {
  daneFirmy: {
    nazwaFirmy: "",
    wlasciciel: "",
    nip: "",
    telefon: "",
    email: "",
    adres: "",
    kodPocztowy: "",
    miasto: "",
  },
  finanse: {
    stawkaRoboczogodziny: 120,
    marzaProcent: 25,
    narzutProcent: 10,
    vatProcent: 23,
    minimalnaWartoscZlecenia: 1500,
    kosztTransportuBazowy: 250,
    kosztMontazuZaGodzine: 140,
    zapasKosztowyProcent: 5,
  },
  konstrukcja: {
    gruboscPlytyKorpusuMM: 18,
    gruboscPlytySzufladMM: 16,
    gruboscPlecHDFMM: 3,
    luzMontazowyMM: 3,
    szczelinaFrontowMM: 2,
    odsunieciePlecMM: 10,
    wysokoscCokoluMM: 100,
    wysokoscNogiMM: 100,
    gruboscFrontuMM: 18,
    gruboscBlatuMM: 38,
    glebokoscBlatuMM: 600,
  },
  rozkroj: {
    dlugoscArkuszaMM: 2800,
    szerokoscArkuszaMM: 2070,
    rzazPilyMM: 4.2,
    marginesArkuszaMM: 10,
    zapasMaterialuProcent: 10,
    uwzgledniajKierunekDekoru: true,
  },
  okleinowanie: {
    naddatekNaKrawedzMM: 20,
    zapasProcent: 10,
  },
};

export function walidujUstawienia(u: UstawieniaStolarni): string[] {
  const k: string[] = [];
  if (u.finanse.stawkaRoboczogodziny <= 0) k.push("Stawka roboczogodziny musi być większa od zera.");
  if (u.konstrukcja.gruboscPlytyKorpusuMM < 10) k.push("Grubość płyty korpusu jest zbyt mała.");
  if (u.konstrukcja.szczelinaFrontowMM < 0) k.push("Szczelina frontów nie może być ujemna.");
  if (u.rozkroj.szerokoscArkuszaMM <= 0 || u.rozkroj.dlugoscArkuszaMM <= 0)
    k.push("Wymiary arkusza muszą być większe od zera.");
  if (u.rozkroj.rzazPilyMM <= 0) k.push("Rzaz piły musi być większy od zera.");
  return k;
}

/** Głębokie scalenie częściowych ustawień z bieżącymi (tylko znane klucze). */
export function scalUstawienia(
  obecne: UstawieniaStolarni,
  zmiany: DeepPartial<UstawieniaStolarni>,
): UstawieniaStolarni {
  const wynik = structuredClone(obecne) as unknown as Record<string, Record<string, unknown>>;
  for (const [sekcja, wartosci] of Object.entries(zmiany ?? {})) {
    if (!(sekcja in wynik) || typeof wartosci !== "object" || wartosci === null) continue;
    for (const [klucz, wartosc] of Object.entries(wartosci)) {
      if (klucz in wynik[sekcja] && typeof wartosc === typeof wynik[sekcja][klucz]) {
        wynik[sekcja][klucz] = wartosc;
      }
    }
  }
  return wynik as unknown as UstawieniaStolarni;
}

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
