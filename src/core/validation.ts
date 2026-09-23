import type { Modul, Projekt } from "./types.js";

// Normy wymiarowe szafek (NormySzafekCatalog.swift) + kolizje na ścianie (MebelCollisionValidatorV0143).

interface Zakres {
  min: number;
  max: number;
}
interface Norma {
  nazwa: string;
  szerokosci?: number[];
  glebokosc: Zakres;
  wysokosc: Zakres;
}

const NORMY: Record<string, Norma> = {
  dolna: { nazwa: "Szafka dolna", szerokosci: [300, 400, 450, 500, 600, 800, 900, 1000], glebokosc: { min: 560, max: 580 }, wysokosc: { min: 720, max: 750 } },
  cargo: { nazwa: "Szafka dolna cargo", szerokosci: [150, 200, 300], glebokosc: { min: 560, max: 580 }, wysokosc: { min: 720, max: 750 } },
  wiszaca: { nazwa: "Szafka wisząca", szerokosci: [300, 400, 450, 500, 600, 800, 900, 1000], glebokosc: { min: 280, max: 350 }, wysokosc: { min: 300, max: 1200 } },
  naroznaL: { nazwa: "Szafka narożna L", szerokosci: [800, 900], glebokosc: { min: 560, max: 900 }, wysokosc: { min: 720, max: 750 } },
  naroznaSlepa: { nazwa: "Szafka narożna ślepa", glebokosc: { min: 560, max: 580 }, wysokosc: { min: 720, max: 750 } },
  slupek: { nazwa: "Słupek / wysoka zabudowa", glebokosc: { min: 560, max: 600 }, wysokosc: { min: 1700, max: 2400 } },
};

function norma(m: Modul): Norma | undefined {
  if (m.konstrukcja === "cargo") return NORMY.cargo;
  if (m.konstrukcja === "blindCorner") return NORMY.naroznaSlepa;
  if (m.konstrukcja === "lCorner") return NORMY.naroznaL;
  if (m.kategoria === "wall" || m.konstrukcja === "hood" || m.konstrukcja === "wallCorner") return NORMY.wiszaca;
  if (m.kategoria === "tall" || m.wysokoscMM > 1400) return NORMY.slupek;
  if (m.kategoria === "base" || m.konfiguracja.blat) return NORMY.dolna;
  return undefined;
}

export interface Uwaga {
  poziom: "blad" | "ostrzezenie" | "info";
  modulId?: string;
  komunikat: string;
}

export function walidujProjekt(p: Projekt): Uwaga[] {
  const uwagi: Uwaga[] = [];
  const sciany = new Map(p.pomieszczenia.flatMap((r) => r.sciany.map((s) => [s.id, s] as const)));

  for (const m of p.moduly) {
    // Normy kuchenne dotyczą modułów katalogowych; zabudowa na wymiar (szafy, garderoby) ich nie podlega.
    const n = m.katalogId ? norma(m) : undefined;
    if (n) {
      if (m.glebokoscMM < n.glebokosc.min || m.glebokoscMM > n.glebokosc.max)
        uwagi.push({ poziom: "ostrzezenie", modulId: m.id, komunikat: `${m.nazwa}: głębokość ${m.glebokoscMM} mm poza normą "${n.nazwa}" (${n.glebokosc.min}–${n.glebokosc.max} mm).` });
      if (m.wysokoscMM < n.wysokosc.min || m.wysokoscMM > n.wysokosc.max)
        uwagi.push({ poziom: "ostrzezenie", modulId: m.id, komunikat: `${m.nazwa}: wysokość ${m.wysokoscMM} mm poza normą "${n.nazwa}" (${n.wysokosc.min}–${n.wysokosc.max} mm).` });
      if (n.szerokosci && !n.szerokosci.includes(m.szerokoscMM))
        uwagi.push({ poziom: "info", modulId: m.id, komunikat: `${m.nazwa}: szerokość ${m.szerokoscMM} mm spoza typoszeregu (${n.szerokosci.join(", ")}).` });
    }

    const s = sciany.get(m.scianaId);
    if (!s) {
      uwagi.push({ poziom: "blad", modulId: m.id, komunikat: `${m.nazwa}: moduł nie jest przypisany do istniejącej ściany.` });
      continue;
    }
    if (m.pozycjaXMM < 0 || m.pozycjaXMM + m.szerokoscMM > s.dlugoscMM)
      uwagi.push({ poziom: "blad", modulId: m.id, komunikat: `${m.nazwa}: wychodzi poza ścianę "${s.nazwa}" (${s.dlugoscMM} mm).` });
    const gora = m.pozycjaYMM + m.wysokoscMM + (m.konfiguracja.blat ? 38 : 0);
    if (gora > s.wysokoscMM)
      uwagi.push({ poziom: "blad", modulId: m.id, komunikat: `${m.nazwa}: górna krawędź ${gora} mm przekracza wysokość ściany ${s.wysokoscMM} mm.` });
  }

  // Kolizje prostokątów w widoku elewacji tej samej ściany
  const poScianie = new Map<string, Modul[]>();
  for (const m of p.moduly) poScianie.set(m.scianaId, [...(poScianie.get(m.scianaId) ?? []), m]);
  for (const lista of poScianie.values()) {
    for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        const a = lista[i];
        const b = lista[j];
        const x = a.pozycjaXMM < b.pozycjaXMM + b.szerokoscMM - 0.5 && b.pozycjaXMM < a.pozycjaXMM + a.szerokoscMM - 0.5;
        const y = a.pozycjaYMM < b.pozycjaYMM + b.wysokoscMM - 0.5 && b.pozycjaYMM < a.pozycjaYMM + a.wysokoscMM - 0.5;
        if (x && y) uwagi.push({ poziom: "blad", modulId: b.id, komunikat: `Kolizja: "${a.nazwa}" i "${b.nazwa}" nachodzą na siebie.` });
      }
    }
  }
  return uwagi;
}
