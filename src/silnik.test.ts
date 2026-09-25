import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { zbudujModul } from "./core/builder.js";
import { domyslnaKonfiguracja, KATALOG_MODULOW } from "./core/catalog/modules.js";
import { USTAWIENIA_DOMYSLNE } from "./core/settings.js";
import { mebelZModulu, zbudujModulSilnikiem } from "./core/silnik/adapter.js";
import { rozmiaryCzesci, zbudujMebel } from "./core/silnik/budowa.js";
import { zamienDrzwiNaSzuflady } from "./core/silnik/polecenia.js";
import type { KonfiguracjaModulu, Modul } from "./core/types.js";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

// Test regresji silnika konstrukcji (etap 1): adapter + silnik muszą dawać te same elementy i okucia co dotychczasowy builder.

const k = USTAWIENIA_DOMYSLNE.konstrukcja;
const tech = USTAWIENIA_DOMYSLNE.technologia;

function porownaj(m: Modul) {
  const stary = zbudujModul(m, k, tech);
  const nowy = zbudujModulSilnikiem(m, k, tech);
  const posortuj = (e: typeof stary.elementy) => [...e].sort((a, b) => a.kod.localeCompare(b.kod));
  assert.deepEqual(posortuj(nowy.elementy), posortuj(stary.elementy), `elementy: ${m.nazwa} ${JSON.stringify(m.konfiguracja)}`);
  assert.deepEqual(nowy.okucia, stary.okucia, `okucia: ${m.nazwa}`);
}

test("silnik = stary builder: wszystkie szafki kuchni Darii (Pieszczyńscy)", () => {
  const { moduly } = JSON.parse(readFileSync("src/core/silnik/kuchnia-darii.fixture.json", "utf8")) as { moduly: Modul[] };
  assert.equal(moduly.length, 11);
  for (const m of moduly) porownaj(m);
});

test("silnik = stary builder: każdy moduł katalogu z konfiguracją domyślną", () => {
  for (const c of KATALOG_MODULOW) {
    porownaj({
      id: c.id, nazwa: c.name, kategoria: c.category, konstrukcja: c.construction, scianaId: "s", pozycjaXMM: 0, pozycjaYMM: c.bottomOffsetMM,
      szerokoscMM: c.widthMM, wysokoscMM: c.heightMM, glebokoscMM: c.depthMM, konfiguracja: domyslnaKonfiguracja(c),
    });
  }
});

test("silnik = stary builder: siatka wariantów frontów, szuflad, drzwi, słupków AGD i narożników", () => {
  const baza = (kategoria: Modul["kategoria"], konstrukcja: Modul["konstrukcja"], W: number, H: number, cfg: Partial<KonfiguracjaModulu>): Modul => ({
    id: "x", nazwa: `${konstrukcja} ${W}x${H}`, kategoria, konstrukcja, scianaId: "s", pozycjaXMM: 0, pozycjaYMM: 100, szerokoscMM: W, wysokoscMM: H, glebokoscMM: 560,
    konfiguracja: { liczbaPolek: 0, typFrontu: "drzwi", liczbaDrzwi: 1, liczbaSzuflad: 0, liczbaCargo: 0, plecy: true, blat: false, nogi: true, szufladySystemowe: false, ...cfg },
  });
  let n = 0;
  for (const W of [300, 450, 600, 800, 1000]) {
    for (const szuflady of [1, 2, 3, 4]) {
      for (const systemowe of [false, true]) {
        porownaj(baza("base", "drawers", W, 720, { typFrontu: "szuflady", liczbaDrzwi: 0, liczbaSzuflad: szuflady, szufladySystemowe: systemowe, blat: true }));
        porownaj(baza("base", "drawers", W, 720, { typFrontu: "szuflady", liczbaDrzwi: 0, liczbaSzuflad: szuflady, wysokoscSzufladyMM: 180 }));
        n += 2;
      }
    }
    for (const drzwi of [1, 2, 3]) for (const polki of [0, 1, 3]) for (const plecy of [true, false]) {
      porownaj(baza("base", "shelves", W, 720, { liczbaDrzwi: drzwi, liczbaPolek: polki, plecy }));
      porownaj(baza("tall", "shelves", W, 2070, { liczbaDrzwi: drzwi, liczbaPolek: polki + 2, plecy }));
      n += 2;
    }
    // Słupek: szuflady pod drzwiami (półka stała), różna podziałka
    for (const szuflady of [1, 2, 3]) for (const podz of [undefined, 360, 250]) {
      porownaj(baza("tall", "shelves", W, 1800, { liczbaDrzwi: 1, liczbaSzuflad: szuflady, liczbaPolek: 2, wysokoscSzufladyMM: podz }));
      n++;
    }
  }
  // Słupki AGD: piekarnik, piekarnik + mikrofala, z szufladami i bez, 1 i 2 drzwi
  for (const konstrukcja of ["ovenTower", "ovenMicrowaveTower"] as const) for (const szuflady of [0, 2, 3]) for (const drzwi of [1, 2]) for (const podz of [undefined, 360]) {
    porownaj(baza("tall", konstrukcja, 600, 2070, { liczbaDrzwi: drzwi, liczbaSzuflad: szuflady, liczbaPolek: 1, wysokoscSzufladyMM: podz }));
    n++;
  }
  // Szafka pod piekarnik, zlewowa, cargo, uchylna, panel AGD, bez frontu
  porownaj(baza("appliance", "oven", 600, 720, { liczbaDrzwi: 0, typFrontu: "szuflady", liczbaSzuflad: 1 }));
  porownaj(baza("appliance", "sink", 800, 720, { liczbaDrzwi: 2, plecy: false, blat: true }));
  porownaj(baza("base", "cargo", 300, 720, { liczbaCargo: 1 }));
  porownaj(baza("wall", "liftUp", 800, 360, { typFrontu: "uchylny", liczbaDrzwi: 0 }));
  porownaj(baza("appliance", "dishwasherFront", 600, 720, { typFrontu: "panelAGD", liczbaDrzwi: 0 }));
  porownaj(baza("base", "shelves", 600, 720, { typFrontu: "brak", liczbaDrzwi: 0, liczbaPolek: 2 }));
  // Narożniki ślepe: strona drzwi, szerokość drzwi, LeMans
  for (const strona of ["lewa", "prawa"] as const) for (const drzwi of [400, 450, 530]) for (const W of [900, 1100, 1200]) {
    porownaj(baza("corner", "blindCorner", W, 720, { stronaDrzwiNaroznika: strona, szerokoscDrzwiNaroznikaMM: drzwi, liczbaPolek: 1 }));
    porownaj(baza("corner", "blindCorner", W, 720, { stronaDrzwiNaroznika: strona, szerokoscDrzwiNaroznikaMM: drzwi, systemNarozny: "lemans" }));
    n += 2;
  }
  assert.ok(n > 150);
});

test("rozkład rozmiarów: stałe, udziały i reszta", () => {
  assert.deepEqual(rozmiaryCzesci([{ mm: 100 }, { reszta: true }], 500), [100, 400]);
  assert.deepEqual(rozmiaryCzesci([{ mm: 100 }, { reszta: true }, { reszta: true }], 500), [100, 200, 200]);
  assert.deepEqual(rozmiaryCzesci([{ udzial: 0.25 }, { reszta: true }], 400), [100, 300]);
  assert.deepEqual(rozmiaryCzesci([{ udzial: 1 }, { udzial: 3 }], 400), [100, 300]);
});

test("polecenie: kuchnia Darii, szafka A2 — drzwi → 3 szuflady daje to samo co moduł szufladowy z równą podziałką", () => {
  const { moduly } = JSON.parse(readFileSync("src/core/silnik/kuchnia-darii.fixture.json", "utf8")) as { moduly: Modul[] };
  const a2 = moduly.find((m) => m.id === "4dd532ac")!; // „Szafka dolna z półkami 600” — funkcja do potwierdzenia
  const { mebel, uwagi } = zamienDrzwiNaSzuflady(mebelZModulu(a2, k), k, { liczba: 3 });
  const nowy = zbudujMebel(mebel, a2, k, tech);
  const wzorzec = zbudujModul({ ...a2, konstrukcja: "drawers", konfiguracja: { ...a2.konfiguracja, typFrontu: "szuflady", liczbaDrzwi: 0, liczbaSzuflad: 3, liczbaPolek: 0, wysokoscSzufladyMM: 240 } }, k, tech);
  const posortuj = (e: typeof nowy.elementy) => [...e].sort((a, b) => a.kod.localeCompare(b.kod));
  assert.deepEqual(posortuj(nowy.elementy), posortuj(wzorzec.elementy));
  assert.deepEqual(nowy.okucia, wzorzec.okucia);
  assert.ok(uwagi.some((u) => u.includes("półk")), "zgłasza usunięcie półki");
  assert.equal(a2.konfiguracja.liczbaPolek, 1, "wejście bez zmian");
});

test("polecenie: słupek C2 Darii → 5 równych szuflad, cargo B2 → szuflady bez cargo, za dużo szuflad = błąd", () => {
  const { moduly } = JSON.parse(readFileSync("src/core/silnik/kuchnia-darii.fixture.json", "utf8")) as { moduly: Modul[] };
  // Słupek spiżarniany C2 (600×2070, 1 drzwi, 4 półki) → 5 szuflad
  const c2 = moduly.find((m) => m.id === "76698245")!;
  const w = zamienDrzwiNaSzuflady(mebelZModulu(c2, k), k, { liczba: 5 });
  const z = zbudujMebel(w.mebel, c2, k, tech);
  const fronty = z.elementy.filter((e) => e.kod.startsWith("FRONT-SZ"));
  assert.equal(fronty.length, 5);
  assert.ok(fronty.every((f) => Math.abs(f.wys - fronty[0].wys) < 0.2), "równe fronty");
  assert.equal(z.elementy.filter((e) => e.rola === "shelf").length, 0);
  assert.equal(z.okucia.find((o) => o.typ === "zawias"), undefined);
  // Cargo przy płycie (B2) → szuflady: cargo znika z okuć
  const b2 = moduly.find((m) => m.id === "c9167e2b")!;
  const wb = zamienDrzwiNaSzuflady(mebelZModulu(b2, k), k, { liczba: 2 });
  assert.equal(zbudujMebel(wb.mebel, b2, k, tech).okucia.find((o) => o.typ === "cargo"), undefined);
  assert.ok(wb.uwagi.some((u) => u.includes("cargo")));
  // Za dużo szuflad → czytelny błąd
  assert.throws(() => zamienDrzwiNaSzuflady(mebelZModulu(b2, k), k, { liczba: 8 }), /minimum 100 mm/);
});

test("serwis: polecenie zamiany drzwi na szuflady zapisuje drzewo, analiza buduje z silnika, powrót do standardowej", () => {
  const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "silnik-"))));
  const p = s.utworzProjekt({ nazwa: "Silnik", sciany: [{ dlugoscMM: 1200 }] });
  const m = s.dodajModul(p.id, { katalogId: "base-shelves-600" });
  const rew = s.projekt(p.id).rewizja;
  const { uwagi } = s.polecenieKonstrukcji(p.id, m.id, { typ: "zamienDrzwiNaSzuflady", liczba: 3 });
  assert.ok(uwagi.length > 0);
  assert.ok(s.projekt(p.id).rewizja > rew, "zmiana konstrukcji podbija rewizję");
  const z = s.analiza(p.id).zbudowane.find((q) => q.modul.id === m.id)!;
  assert.equal(z.elementy.filter((e) => e.kod.startsWith("FRONT-SZ")).length, 3);
  assert.equal(z.okucia.find((o) => o.typ === "zawias"), undefined);
  assert.ok(z.ostrzezenia[0].includes("Konstrukcja z edytora"));
  // Zmiana szerokości przelicza drzewo (fronty szuflad na nową szerokość)
  s.zmienModul(p.id, m.id, { szerokoscMM: 500 });
  const z2 = s.analiza(p.id).zbudowane.find((q) => q.modul.id === m.id)!;
  assert.equal(z2.elementy.find((e) => e.kod === "FRONT-SZ01")!.szer, 496);
  assert.throws(() => s.polecenieKonstrukcji(p.id, m.id, { typ: "zamienDrzwiNaSzuflady", liczba: 2 }), /nie ma drzwi/);
  s.przywrocKonstrukcjeStandardowa(p.id, m.id);
  const z3 = s.analiza(p.id).zbudowane.find((q) => q.modul.id === m.id)!;
  assert.ok(z3.elementy.some((e) => e.kod === "FRONT-D01"));
  // Dokumentacja produkcyjna działa na konstrukcji z silnika
  s.polecenieKonstrukcji(p.id, m.id, { typ: "zamienDrzwiNaSzuflady", liczba: 2 });
  assert.ok(s.dokumentacja(p.id).czesci.some((c) => c.modulId === m.id && c.kodElementu === "SZ01-DNO"));
});
