import { niszaSlupka, strefaSzufladPodDrzwiami } from "../builder.js";
import { USTAWIENIA_DOMYSLNE } from "../settings.js";
import type { Modul, UstawieniaKonstrukcyjne, UstawieniaTechnologii, ZbudowanyModul } from "../types.js";
import { zbudujMebel } from "./budowa.js";
import type { Mebel, PoleFrontu, StrefaWnetrza, WyposazenieStrefy, Wysuw } from "./model.js";

// Adapter: dotychczasowa konfiguracja modułu (liczniki + typ konstrukcji) → jawne drzewo mebla dla silnika.
// Tu żyją reguły szablonów starego buildera (górna szuflada ≈20%, drzwi w słupku 62/38, nisze AGD, narożnik ślepy).
// Silnik po przejściu przez adapter musi dawać te same formatki co stary builder (test regresji: silnik.test.ts).

export function mebelZModulu(m: Modul, k: UstawieniaKonstrukcyjne): Mebel {
  const cfg = m.konfiguracja;
  const t = k.gruboscPlytyKorpusuMM;
  const gap = k.szczelinaFrontowMM;
  const { szerokoscMM: W, wysokoscMM: H } = m;
  const polki: WyposazenieStrefy = { typ: "polki", liczba: cfg.liczbaPolek };

  // --- Wnętrze ---
  const nisza = niszaSlupka(m);
  const strefaSzuflad = strefaSzufladPodDrzwiami(m);
  let wnetrze: StrefaWnetrza;
  if (nisza) {
    const czesci: StrefaWnetrza[] = [];
    const kody: string[] = [];
    if (nisza.dol > t) {
      czesci.push({ id: "pod-nisza", rozmiar: { mm: nisza.dol - 2 * t }, wyposazenie: { typ: "pusta" } });
      kody.push("POLKA-STALA");
    }
    const start = nisza.dol > t ? nisza.dol : t;
    if (nisza.mikrofala) {
      czesci.push({ id: "piekarnik", rozmiar: { mm: nisza.dol + nisza.mikrofala.od - t - start }, wyposazenie: { typ: "nisza", opis: "piekarnik" }, bezPlecow: true });
      kody.push("POLKA-STALA-M");
      czesci.push({ id: "mikrofala", rozmiar: { mm: nisza.wys - nisza.mikrofala.od }, wyposazenie: { typ: "nisza", opis: "mikrofala" }, bezPlecow: true });
    } else {
      czesci.push({ id: "piekarnik", rozmiar: { mm: nisza.dol + nisza.wys - start }, wyposazenie: { typ: "nisza", opis: "piekarnik" }, bezPlecow: true });
    }
    kody.push("POLKA-STALA-G");
    czesci.push({ id: "nad-nisza", rozmiar: { reszta: true }, wyposazenie: polki });
    wnetrze = { id: "wnetrze", podzial: { kierunek: "poziom", przegroda: "plyta", kodyPrzegrod: kody, czesci } };
  } else if (strefaSzuflad > 0) {
    wnetrze = {
      id: "wnetrze",
      podzial: {
        kierunek: "poziom",
        przegroda: "plyta",
        kodyPrzegrod: ["POLKA-STALA"],
        czesci: [
          { id: "szuflady", rozmiar: { mm: strefaSzuflad - 2 * t }, wyposazenie: { typ: "pusta" } },
          { id: "nad-szufladami", rozmiar: { reszta: true }, wyposazenie: polki },
        ],
      },
    };
  } else {
    wnetrze = { id: "wnetrze", wyposazenie: polki };
  }

  // --- Fronty ---
  const wysuwy: Wysuw[] = [];
  const pole = (id: string, front: PoleFrontu["front"], mm?: number): PoleFrontu => ({ id, front, rozmiar: mm === undefined ? { reszta: true } : { mm } });
  /** Stos pól ze wspólną szczeliną, tak aby fronty miały dokładnie zadane wymiary (skrajne pola mają pełną szczelinę od zewnątrz). */
  const stos = (wymiary: number[]) =>
    wymiary.map((w, i) => (i === 0 ? gap : gap / 2) + w + (i === wymiary.length - 1 ? gap : gap / 2));

  let fronty: PoleFrontu;
  if (cfg.typFrontu === "brak") fronty = pole("czolo", { typ: "otwarte" });
  else if (cfg.typFrontu === "panelAGD") fronty = pole("czolo", { typ: "panelAGD", kod: "FRONT-AGD" });
  else if (cfg.typFrontu === "uchylny") fronty = pole("czolo", { typ: "klapa", kod: "FRONT-U01" });
  else {
    const niszaH = m.konstrukcja === "oven" ? 595 : nisza ? nisza.wys : 0;
    const liczbaSzuflad = cfg.typFrontu === "szuflady" || nisza || strefaSzuflad > 0 ? cfg.liczbaSzuflad : 0;
    // Grupy od dołu, rozdzielone pełną szczeliną: strefa szuflad | nisza AGD | drzwi
    const grupy: PoleFrontu[] = [];
    let yStart = 0;
    if (liczbaSzuflad > 0) {
      const strefaH = m.konstrukcja === "oven" ? H - niszaH : nisza ? nisza.dol : strefaSzuflad > 0 ? strefaSzuflad : H;
      if (strefaH >= 100) {
        const netto = strefaH - gap * (liczbaSzuflad + 1);
        const wysokosci: number[] =
          liczbaSzuflad === 1 || cfg.wysokoscSzufladyMM || strefaSzuflad > 0
            ? Array(liczbaSzuflad).fill(netto / liczbaSzuflad)
            : (() => {
                const gorna = Math.max(120, Math.round(netto * 0.2));
                const reszta = (netto - gorna) / (liczbaSzuflad - 1);
                return [...Array(liczbaSzuflad - 1).fill(reszta), gorna];
              })();
        const sloty = stos(wysokosci);
        const czesci = wysokosci.map((_, i) => {
          const id = `szuflada-${i + 1}`;
          wysuwy.push({ id: `wysuw-${i + 1}`, kod: `SZ${pad(i + 1)}`, poleFrontuId: id, strefaId: "wnetrze", powiazanie: "zFrontem" });
          return pole(id, { typ: "szuflada", kod: `FRONT-SZ${pad(i + 1)}` }, sloty[i]);
        });
        grupy.push({ id: "szuflady", rozmiar: { mm: strefaH }, podzial: { kierunek: "poziom", szczelinaWspolna: true, czesci } });
        yStart = strefaH;
      }
    }

    const liczbaDrzwi = cfg.typFrontu === "szuflady" && !nisza ? 0 : cfg.liczbaDrzwi;
    const wysoki = m.kategoria === "tall" || (m.kategoria === "appliance" && H > 1400);
    if (liczbaDrzwi > 0 && m.konstrukcja === "blindCorner") {
      const drzwiW = Math.min(cfg.szerokoscDrzwiNaroznikaMM ?? 450, W - 2 * gap);
      const zaslepkaW = W - drzwiW - 3 * gap;
      const lewe = cfg.stronaDrzwiNaroznika === "lewa";
      const drzwi = pole("drzwi-1", { typ: "drzwi", kod: "FRONT-D01", strona: lewe ? "lewa" : "prawa" });
      if (zaslepkaW > 0) {
        const [a, b] = lewe ? stos([drzwiW, zaslepkaW]) : stos([zaslepkaW, drzwiW]);
        const zasl = pole("zaslepka", { typ: "blenda", kod: "ZASLEPKA" });
        drzwi.rozmiar = { mm: lewe ? a : b };
        zasl.rozmiar = { mm: lewe ? b : a };
        grupy.push({ id: "drzwi", rozmiar: { reszta: true }, podzial: { kierunek: "pion", szczelinaWspolna: true, czesci: lewe ? [drzwi, zasl] : [zasl, drzwi] } });
      } else {
        grupy.push(drzwi);
      }
    } else if (liczbaDrzwi > 0 && wysoki && W <= 600 && liczbaDrzwi >= 2) {
      // Słupek: drzwi jedne nad drugimi, z pominięciem niszy AGD
      if (niszaH > 0) {
        const dolneH = yStart > 0 ? 0 : Math.round((H - niszaH) * 0.45);
        if (dolneH > 0) grupy.push(pole("drzwi-dolne", { typ: "drzwi", kod: "FRONT-D01" }, dolneH));
        grupy.push(pole("nisza", { typ: "otwarte" }, niszaH));
        grupy.push(pole("drzwi-gorne", { typ: "drzwi", kod: `FRONT-D0${dolneH > 0 ? 2 : 1}` }));
      } else {
        const dolneH = Math.round((H - yStart) * 0.62);
        grupy.push(pole("drzwi-dolne", { typ: "drzwi", kod: "FRONT-D01" }, dolneH));
        grupy.push(pole("drzwi-gorne", { typ: "drzwi", kod: "FRONT-D02" }));
      }
    } else if (liczbaDrzwi > 0) {
      if (niszaH > 0) grupy.push(pole("nisza", { typ: "otwarte" }, niszaH));
      if (H - yStart - niszaH - 2 * gap > 0) {
        const dw = (W - gap * (liczbaDrzwi + 1)) / liczbaDrzwi;
        const sloty = stos(Array(liczbaDrzwi).fill(dw));
        const czesci = sloty.map((s, i) => pole(`drzwi-${i + 1}`, { typ: "drzwi", kod: `FRONT-D${pad(i + 1)}` }, s));
        grupy.push(czesci.length === 1 ? { ...czesci[0], rozmiar: { reszta: true } } : { id: "drzwi", rozmiar: { reszta: true }, podzial: { kierunek: "pion", szczelinaWspolna: true, czesci } });
      }
    }
    const suma = grupy.reduce((s, g) => s + (g.rozmiar && "mm" in g.rozmiar ? g.rozmiar.mm : 0), 0);
    if (!grupy.some((g) => g.rozmiar && "reszta" in g.rozmiar) && suma < H) grupy.push(pole("reszta", { typ: "otwarte" }));
    fronty = grupy.length === 0 ? pole("czolo", { typ: "otwarte" }) : grupy.length === 1 ? { ...grupy[0], rozmiar: undefined } : { id: "czolo", podzial: { kierunek: "poziom", szczelinaWspolna: false, czesci: grupy } };
  }

  return {
    szerokoscMM: W,
    wysokoscMM: H,
    glebokoscMM: m.glebokoscMM,
    korpus: {
      rodzaj: m.konstrukcja === "filler" ? "blenda" : m.konstrukcja === "dishwasherFront" ? "bezKorpusu" : "korpus",
      plecy: cfg.plecy,
      blat: cfg.blat,
      nogi: cfg.nogi,
    },
    wnetrze,
    fronty,
    wysuwy,
    szufladySystemowe: cfg.szufladySystemowe,
    profilSzuflad: cfg.profilSzuflad,
    wariantBokuSzuflady: cfg.wariantBokuSzuflady,
    dodatki: { cargo: cfg.liczbaCargo || undefined, podnosnik: cfg.typFrontu === "uchylny" || undefined, systemNarozny: cfg.systemNarozny },
  };
}

/** Budowa modułu przez silnik (adapter + zbudujMebel). */
export function zbudujModulSilnikiem(m: Modul, k: UstawieniaKonstrukcyjne, tech: UstawieniaTechnologii = USTAWIENIA_DOMYSLNE.technologia): ZbudowanyModul {
  return zbudujMebel(mebelZModulu(m, k), m, k, tech);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
