import { dobierzNL, profilSzuflady, wymiarySzuflady } from "./catalog/drawers.js";
import { USTAWIENIA_DOMYSLNE } from "./settings.js";
import type { Element, Modul, OkucieModulu, UstawieniaKonstrukcyjne, UstawieniaTechnologii, ZbudowanyModul } from "./types.js";

// Budowa korpusu i frontów modułu — port DomainCore/CabinetBuilders.swift
// (BaseCabinetBuilder / WallCabinetBuilder + CabinetComponentFactory), rozszerzony o
// fronty wielodrzwiowe, szuflady (SzufladyModuluEngine) i blat.

const COFNIECIE_POLKI_MM = 20;
const LUZ_PROWADNIC_MM = 13; // na stronę — skrzynka = światło korpusu − 26 mm (GTV/Blum)

/** Reguła zawiasów (ProjektWycenyBuilder.hingesForFrontHeight): ≤900→2, ≤1400→3, ≤2000→4, >2000→5. */
export function zawiasyDlaWysokosci(h: number): number {
  if (h < 900) return 2;
  if (h < 1400) return 3;
  if (h < 2000) return 4;
  return 5;
}

export function zbudujModul(m: Modul, k: UstawieniaKonstrukcyjne, tech: UstawieniaTechnologii = USTAWIENIA_DOMYSLNE.technologia): ZbudowanyModul {
  const el: Element[] = [];
  const okucia: OkucieModulu[] = [];
  const ostrzezenia: string[] = [];
  const t = k.gruboscPlytyKorpusuMM;
  const { szerokoscMM: W, wysokoscMM: H, glebokoscMM: D } = m;
  const cfg = m.konfiguracja;
  const gap = k.szczelinaFrontowMM;
  const tf = k.gruboscFrontuMM;

  // --- Walidacja (CabinetBuildParameters.validate) ---
  if (W <= 2 * t) ostrzezenia.push("Szerokość mebla musi być większa niż suma grubości boków.");
  if (H <= 2 * t) ostrzezenia.push("Wysokość mebla musi być większa niż suma grubości wieńców.");
  if (cfg.liczbaPolek < 0 || cfg.liczbaPolek > 20) ostrzezenia.push("Liczba półek musi mieścić się w zakresie 0...20.");
  if (ostrzezenia.length) return { modul: m, elementy: [], okucia: [], ostrzezenia };

  // Blenda / maskownica: jeden panel z materiału frontu, bez korpusu.
  if (m.konstrukcja === "filler") {
    el.push(p("BLENDA", "filler", 0, 0, -k.gruboscFrontuMM, W, H, k.gruboscFrontuMM, "front"));
    if (m.konfiguracja.blat) el.push(p("BLAT", "worktop", 0, H, -k.gruboscFrontuMM - k.szczelinaFrontowMM, W, k.gruboscBlatuMM, k.glebokoscBlatuMM, "blat"));
    return { modul: m, elementy: el, okucia, ostrzezenia };
  }

  const innerW = W - 2 * t;
  const innerH = H - 2 * t;
  const bezKorpusu = m.konstrukcja === "dishwasherFront";
  const rezerwaPlecow = cfg.plecy ? k.odsunieciePlecMM + k.gruboscPlecHDFMM : 0;

  if (!bezKorpusu) {
    // Boki i wieniec dolny
    el.push(p("BOK-L", "side", 0, 0, 0, t, H, D, "korpus"));
    el.push(p("BOK-P", "side", W - t, 0, 0, t, H, D, "korpus"));
    el.push(p("WIENIEC-D", "bottom", t, 0, 0, innerW, t, D, "korpus"));

    // Zasada zakładu: każdy moduł z korpusem = dwa boki i dwa pełne wieńce (dolny i górny),
    // także szafki dolne pod blat (bez listew wzmacniających zamiast wieńca górnego).
    el.push(p("WIENIEC-G", "top", t, H - t, 0, innerW, t, D, "korpus"));

    // Układ mieszany (szuflady pod drzwiami): półka stała na górze strefy szuflad, półki nastawne tylko nad nią.
    const strefaSzuflad = strefaSzufladPodDrzwiami(m);
    let dolPolek = t;
    if (strefaSzuflad > 0) {
      if (strefaSzuflad > H - 2 * t - 200) ostrzezenia.push(`Strefa szuflad ${strefaSzuflad} mm nie zostawia miejsca na drzwi.`);
      el.push(p("POLKA-STALA", "fixedShelf", t, strefaSzuflad - t, 0, innerW, t, D - rezerwaPlecow, "korpus"));
      dolPolek = strefaSzuflad;
    }

    // Półki — równomierne rozmieszczenie światła (CabinetComponentFactory.shelfComponents)
    if (cfg.liczbaPolek > 0) {
      const glPolki = D - rezerwaPlecow - COFNIECIE_POLKI_MM;
      const swiatlo = H - t - dolPolek - t * cfg.liczbaPolek;
      if (swiatlo <= 0 || glPolki <= 0) {
        ostrzezenia.push("Wysokość/głębokość korpusu jest zbyt mała dla zadanej liczby półek.");
      } else {
        const odstep = swiatlo / (cfg.liczbaPolek + 1);
        for (let i = 1; i <= cfg.liczbaPolek; i++) {
          const y = dolPolek + odstep * i + t * (i - 1);
          el.push(p(`POLKA-${pad(i)}`, "shelf", t, y, COFNIECIE_POLKI_MM, innerW, t, glPolki, "korpus"));
        }
      }
    }

    // Plecy HDF wsuwane w rowek w bokach i obu wieńcach. Wpust w rowek = głębokość rowka − luz.
    if (cfg.plecy) {
      const wpust = tech.rowekGlebokoscMM - tech.rowekLuzMM;
      const dol = t - wpust;
      const gora = H - t + wpust;
      el.push(p("PLECY", "back", t - wpust, dol, D - k.odsunieciePlecMM - k.gruboscPlecHDFMM, innerW + 2 * wpust, gora - dol, k.gruboscPlecHDFMM, "plecy"));
    }
  }

  // --- Fronty ---
  const fronty = zbudujFronty(m, k, ostrzezenia);
  el.push(...fronty);

  // --- Szuflady (skrzynki) ---
  const szuflady = fronty.filter((f) => f.kod.startsWith("FRONT-SZ"));
  if (szuflady.length && !bezKorpusu) {
    const LW = innerW; // rzeczywiste światło korpusu w miejscu montażu prowadnic
    const uzytkowa = D - rezerwaPlecow;
    const profil = profilSzuflady(tech.profilSzuflad);
    if (cfg.szufladySystemowe && profil) {
      // Wymiary dna i pleców wyłącznie z profilu producenta (reguly-szuflad.json).
      const NL = dobierzNL(uzytkowa);
      if (!NL) {
        ostrzezenia.push(`Głębokość użytkowa ${uzytkowa} mm za mała dla prowadnic ${profil.family} (min. NL 270 + 3 mm).`);
      } else {
        szuflady.forEach((f, i) => {
          const n = pad(i + 1);
          const w = wymiarySzuflady(profil, LW, NL, f.wys);
          const x0 = t + (LW - w.dnoSzer) / 2;
          el.push(p(`SZ${n}-DNO`, "drawerBottom", x0, f.y + 20, 0, w.dnoSzer, w.grubosc, w.dnoGl, "szuflada"));
          el.push(p(`SZ${n}-TYL`, "drawerFrontBack", t + (LW - w.plecySzer) / 2, f.y + 20 + w.grubosc, w.dnoGl - w.grubosc, w.plecySzer, w.plecyWys, w.grubosc, "szuflada"));
        });
      }
    } else if (cfg.szufladySystemowe) {
      ostrzezenia.push(`Nieznany profil systemu szuflad "${tech.profilSzuflad}" — brak wymiarów dna i pleców.`);
    } else {
      // Skrzynka z płyty na prowadnicach bocznych — reguła robocza (luz 13 mm/stronę), bez profilu producenta.
      const L = Math.max(250, Math.min(550, Math.floor((uzytkowa - 10) / 50) * 50));
      const ts = k.gruboscPlytySzufladMM;
      const szerSkrzynki = LW - 2 * LUZ_PROWADNIC_MM;
      szuflady.forEach((f, i) => {
        const n = pad(i + 1);
        const h = Math.max(80, Math.min(250, f.wys - 40));
        const y = f.y + 20;
        el.push(p(`SZ${n}-BOK-L`, "drawerSide", t + LUZ_PROWADNIC_MM, y, 0, ts, h, L, "szuflada"));
        el.push(p(`SZ${n}-BOK-P`, "drawerSide", W - t - LUZ_PROWADNIC_MM - ts, y, 0, ts, h, L, "szuflada"));
        el.push(p(`SZ${n}-CZOLO`, "drawerFrontBack", t + LUZ_PROWADNIC_MM + ts, y, 0, szerSkrzynki - 2 * ts, h - 12, ts, "szuflada"));
        el.push(p(`SZ${n}-TYL`, "drawerFrontBack", t + LUZ_PROWADNIC_MM + ts, y, L - ts, szerSkrzynki - 2 * ts, h - 12, ts, "szuflada"));
        el.push(p(`SZ${n}-DNO`, "drawerBottom", t + LUZ_PROWADNIC_MM, y - k.gruboscPlecHDFMM, 0, szerSkrzynki, k.gruboscPlecHDFMM, L, "plecy"));
      });
    }
    if (innerW < 150) ostrzezenia.push("Światło korpusu poniżej 150 mm — szuflada może się nie zmieścić.");
  }

  // --- Blat ---
  if (cfg.blat) {
    el.push(p("BLAT", "worktop", 0, H, -tf - gap, W, k.gruboscBlatuMM, k.glebokoscBlatuMM, "blat"));
  }

  // --- Okucia modułu ---
  const drzwi = fronty.filter((f) => f.kod.startsWith("FRONT-D"));
  const zawiasy = drzwi.reduce((s, f) => s + zawiasyDlaWysokosci(f.wys), 0);
  if (zawiasy) okucia.push({ typ: "zawias", ilosc: zawiasy, opis: "Zawiasy frontów rozwieranych (reguła wysokości frontu)." });
  if (szuflady.length) okucia.push({ typ: cfg.szufladySystemowe ? "systemSzuflad" : "prowadnica", ilosc: szuflady.length, opis: "Komplet na każdą szufladę." });
  if (cfg.liczbaCargo > 0) okucia.push({ typ: "cargo", ilosc: cfg.liczbaCargo, opis: "Komplet cargo." });
  if (cfg.typFrontu === "uchylny") okucia.push({ typ: "podnosnik", ilosc: 1, opis: "Podnośnik frontu uchylnego." });
  if (cfg.systemNarozny === "lemans") {
    if (m.konstrukcja !== "blindCorner") ostrzezenia.push("LeMans montuje się tylko w szafce narożnej ślepej.");
    // Instrukcja LeMans II (MA 402118): front 450 → szerokość korpusu min. 800, głębokość min. 500.
    if (W < 800) ostrzezenia.push(`LeMans 45 wymaga szafki min. 800 mm (jest ${W} mm).`);
    if (D < 500) ostrzezenia.push(`LeMans wymaga głębokości min. 500 mm (jest ${D} mm).`);
    if (cfg.liczbaPolek > 0) ostrzezenia.push("Półki stałe kolidują z LeMans — ustaw 0 półek.");
    okucia.push({ typ: "inne", ilosc: 1, profilID: "kessebohmer.lemans2", opis: "Kesseböhmer LeMans II — komplet 2 półek (nerek), front 450." });
  }
  if (cfg.nogi && !bezKorpusu) okucia.push({ typ: "noga", ilosc: W > 1000 ? 6 : 4, opis: "Nogi regulowane." });

  return { modul: m, elementy: el, okucia, ostrzezenia };
}

function zbudujFronty(m: Modul, k: UstawieniaKonstrukcyjne, ostrzezenia: string[]): Element[] {
  const cfg = m.konfiguracja;
  const gap = k.szczelinaFrontowMM;
  const tf = k.gruboscFrontuMM;
  const { szerokoscMM: W, wysokoscMM: H } = m;
  const z = -tf;
  const wynik: Element[] = [];

  if (cfg.typFrontu === "brak") return wynik;

  if (cfg.typFrontu === "panelAGD") {
    wynik.push(p("FRONT-AGD", "front", gap, gap, z, W - 2 * gap, H - 2 * gap, tf, "front"));
    return wynik;
  }

  if (cfg.typFrontu === "uchylny") {
    wynik.push(p("FRONT-U01", "front", gap, gap, z, W - 2 * gap, H - 2 * gap, tf, "front"));
    return wynik;
  }

  // Strefa niszy AGD w słupkach i szafce pod piekarnik (front tylko poniżej/powyżej niszy)
  let niszaH = 0;
  if (m.konstrukcja === "oven") niszaH = 595;
  if (m.konstrukcja === "ovenTower") niszaH = 595;
  if (m.konstrukcja === "ovenMicrowaveTower") niszaH = 595 + 380;

  // Szuflady
  const mieszany = strefaSzufladPodDrzwiami(m);
  const liczbaSzuflad = cfg.typFrontu === "szuflady" || m.konstrukcja === "ovenTower" || mieszany > 0 ? cfg.liczbaSzuflad : 0;
  let yStart = 0;
  if (liczbaSzuflad > 0) {
    const strefaH = m.konstrukcja === "oven" ? H - niszaH : m.konstrukcja === "ovenTower" ? Math.min(H * 0.3, 450) : mieszany > 0 ? mieszany : H;
    if (strefaH < 100) {
      ostrzezenia.push("Za mało miejsca na front szuflady pod niszą AGD.");
    } else {
      const netto = strefaH - gap * (liczbaSzuflad + 1);
      // Górna szuflada niższa (≈20%), pozostałe równe — typowy układ 3-szufladowy.
      // Z podaną podziałką (wysokoscSzufladyMM) albo pod drzwiami — wszystkie równe, linie frontów w sąsiednich słupkach się pokrywają.
      const wysokosci =
        liczbaSzuflad === 1 || cfg.wysokoscSzufladyMM || mieszany > 0
          ? Array(liczbaSzuflad).fill(netto / liczbaSzuflad)
          : (() => {
              const gorna = Math.max(120, Math.round(netto * 0.2));
              const reszta = (netto - gorna) / (liczbaSzuflad - 1);
              return [...Array(liczbaSzuflad - 1).fill(reszta), gorna];
            })();
      let y = gap;
      wysokosci.forEach((h, i) => {
        wynik.push(p(`FRONT-SZ${pad(i + 1)}`, "front", gap, y, z, W - 2 * gap, h, tf, "front"));
        y += h + gap;
      });
      yStart = strefaH;
    }
  }

  // Drzwi
  const liczbaDrzwi = cfg.typFrontu === "szuflady" && m.konstrukcja !== "ovenTower" ? 0 : cfg.liczbaDrzwi;
  if (liczbaDrzwi <= 0) return wynik;

  if (m.konstrukcja === "blindCorner") {
    const drzwiW = Math.min(cfg.szerokoscDrzwiNaroznikaMM ?? 450, W - 2 * gap);
    const zaslepkaW = W - drzwiW - 3 * gap;
    const lewe = cfg.stronaDrzwiNaroznika === "lewa";
    wynik.push(p("FRONT-D01", "front", lewe ? gap : W - drzwiW - gap, gap, z, drzwiW, H - 2 * gap, tf, "front"));
    if (zaslepkaW > 0) wynik.push(p("ZASLEPKA", "filler", lewe ? drzwiW + 2 * gap : gap, gap, z, zaslepkaW, H - 2 * gap, tf, "front"));
    return wynik;
  }

  const wysoki = m.kategoria === "tall" || (m.kategoria === "appliance" && H > 1400);
  if (wysoki && W <= 600 && liczbaDrzwi >= 2) {
    // Słupek: drzwi jedne nad drugimi, z pominięciem niszy AGD
    const dostepne = H - yStart - niszaH;
    if (niszaH > 0) {
      const dolneH = yStart > 0 ? 0 : Math.round((H - niszaH) * 0.45);
      const gorneH = H - yStart - niszaH - dolneH;
      if (dolneH > 0) wynik.push(p("FRONT-D01", "front", gap, gap, z, W - 2 * gap, dolneH - 2 * gap, tf, "front"));
      wynik.push(p(`FRONT-D0${dolneH > 0 ? 2 : 1}`, "front", gap, H - gorneH + gap, z, W - 2 * gap, gorneH - 2 * gap, tf, "front"));
    } else {
      const dolneH = Math.round(dostepne * 0.62);
      wynik.push(p("FRONT-D01", "front", gap, yStart + gap, z, W - 2 * gap, dolneH - 2 * gap, tf, "front"));
      wynik.push(p("FRONT-D02", "front", gap, yStart + dolneH + gap, z, W - 2 * gap, dostepne - dolneH - 2 * gap, tf, "front"));
    }
    return wynik;
  }

  const h = H - yStart - niszaH - 2 * gap;
  if (h <= 0) return wynik;
  const dw = (W - gap * (liczbaDrzwi + 1)) / liczbaDrzwi;
  for (let i = 0; i < liczbaDrzwi; i++) {
    wynik.push(p(`FRONT-D${pad(i + 1)}`, "front", gap + i * (dw + gap), yStart + niszaH + gap, z, dw, h, tf, "front"));
  }
  if (dw > 600) ostrzezenia.push(`Skrzydło drzwi ${Math.round(dw)} mm szersze niż 600 mm — rozważ 2 skrzydła.`);
  return wynik;
}

/**
 * Wysokość strefy szuflad pod drzwiami [mm] albo 0. Dotyczy słupków/szafek z frontem „drzwi” i liczbaSzuflad > 0
 * (bez nisz AGD): strefa = liczba szuflad × podziałka (domyślnie 360 mm).
 */
export function strefaSzufladPodDrzwiami(m: Modul): number {
  const cfg = m.konfiguracja;
  if (cfg.typFrontu !== "drzwi" || cfg.liczbaSzuflad <= 0 || cfg.liczbaDrzwi <= 0) return 0;
  if (["oven", "ovenTower", "ovenMicrowaveTower", "blindCorner", "sink"].includes(m.konstrukcja)) return 0;
  return cfg.liczbaSzuflad * (cfg.wysokoscSzufladyMM ?? 360);
}

function p(kod: string, rola: Element["rola"], x: number, y: number, z: number, szer: number, wys: number, gl: number, materialRola: Element["materialRola"]): Element {
  return { kod, rola, x: r1(x), y: r1(y), z: r1(z), szer: r1(szer), wys: r1(wys), gl: r1(gl), materialRola };
}

function r1(v: number): number {
  return Math.round(v * 10) / 10;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
