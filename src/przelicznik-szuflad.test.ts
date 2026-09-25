import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { zbudujModul } from "./core/builder.js";
import { PROFILE_SZUFLAD, przeliczSzuflade, profilSzuflady } from "./core/catalog/drawers.js";
import { USTAWIENIA_DOMYSLNE } from "./core/settings.js";
import { zbudujModulSilnikiem } from "./core/silnik/adapter.js";
import type { Modul } from "./core/types.js";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

test("przelicznik: przykłady z kart producentów (LW 564, NL 500) dla Amix, GTV i Blum", () => {
  // docs/okucia/README.md — wymiary porównane wizualnie z rysunkami
  const ocz: Record<string, [number, number, number]> = {
    "amix-elite-standard": [489, 474, 477],
    "gtv-axis-pro-option1": [489, 476, 477],
    "gtv-modern-box-pro": [489, 476, 477],
    "blum-merivobox-m-wood": [513, 474, 513],
    "blum-legrabox-m-wood": [529, 490, 526],
    "blum-tandembox-antaro-m-wood": [489, 476, 477],
  };
  for (const p of PROFILE_SZUFLAD) {
    const w = przeliczSzuflade(p, { LW: 564, NL: 500 });
    assert.deepEqual([w.dno.szer, w.dno.gl, w.plecy.szer], ocz[p.id], p.id);
    assert.equal(w.zatwierdzoneProdukcyjnie, false);
  }
});

test("przelicznik: wysokości boków Blum ze stron PDF, stalowa ścianka TANDEMBOX, frezowanie LEGRABOX", () => {
  const legra = profilSzuflady("blum-legrabox-m-wood")!;
  const wys = (id: string, war: string) => przeliczSzuflade(profilSzuflady(id)!, { LW: 564, NL: 500, wariant: war }).plecy.wys;
  assert.deepEqual(["N", "M", "K", "C", "F"].map((w) => wys("blum-legrabox-m-wood", w)), [39, 63, 101, 148, 212]);
  assert.deepEqual(["N", "M", "K", "E"].map((w) => wys("blum-merivobox-m-wood", w)), [60.5, 83, 121, 184]);
  assert.deepEqual(["N", "M", "K", "C", "D"].map((w) => wys("blum-tandembox-antaro-m-wood", w)), [69, 84, 116, 167, 199]);
  const n = przeliczSzuflade(legra, { LW: 564, NL: 500, wariant: "N" });
  assert.equal(n.zrodlo.strona, 11);
  assert.ok(n.uwagi.some((u) => u.includes("Frezowanie")));
  const tandem = profilSzuflady("blum-tandembox-antaro-m-wood")!;
  assert.equal(przeliczSzuflade(tandem, { LW: 564, NL: 500, sciankaTylna: "stalowa" }).dno.gl, 478);
  assert.equal(przeliczSzuflade(tandem, { LW: 564, NL: 500, sciankaTylna: "drewniana" }).dno.gl, 476);
  // Dobór wariantu do wysokości frontu: najwyższe plecy z zapasem 40 mm
  assert.equal(przeliczSzuflade(legra, { LW: 564, NL: 500, wysokoscFrontuMM: 150 }).wariant, "K");
  assert.ok(przeliczSzuflade(legra, { LW: 564, NL: 500, wariant: "Z" }).uwagi.some((u) => u.includes("nie ma wariantu")));
});

test("przelicznik w serwisie: LW i NL z wymiarów korpusu, błędy dla złych danych", () => {
  const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "przelicznik-"))));
  const r = s.przelicznikSzuflad({ szerokoscKorpusu: 600, glebokoscKorpusu: 560 });
  assert.equal(r.LW, 564);
  assert.equal(r.NL, 500); // 560 − 10 − 3 = 547 → NL 500
  assert.equal(r.wyniki.length, PROFILE_SZUFLAD.length);
  assert.equal(s.przelicznikSzuflad({ LW: 564, NL: 450, profilId: "gtv-modern-box-pro" }).wyniki.length, 1);
  assert.throws(() => s.przelicznikSzuflad({ NL: 500 }), /LW/);
  assert.throws(() => s.przelicznikSzuflad({ LW: 564, glebokoscKorpusu: 250 }), /za mała/);
  assert.throws(() => s.przelicznikSzuflad({ LW: 564, NL: 500, profilId: "xyz" }), /Nieznany/);
});

test("system szuflad wybrany dla szafki: builder i silnik liczą dno i plecy z tego profilu i wariantu", () => {
  const k = USTAWIENIA_DOMYSLNE.konstrukcja;
  const tech = USTAWIENIA_DOMYSLNE.technologia;
  const m: Modul = {
    id: "x", nazwa: "Szuflady LEGRABOX", kategoria: "base", konstrukcja: "drawers", scianaId: "s", pozycjaXMM: 0, pozycjaYMM: 100,
    szerokoscMM: 600, wysokoscMM: 720, glebokoscMM: 560,
    konfiguracja: { liczbaPolek: 0, typFrontu: "szuflady", liczbaDrzwi: 0, liczbaSzuflad: 3, liczbaCargo: 0, plecy: true, blat: true, nogi: true, szufladySystemowe: true, profilSzuflad: "blum-legrabox-m-wood", wariantBokuSzuflady: "K" },
  };
  const z = zbudujModul(m, k, tech);
  const dno = z.elementy.find((e) => e.kod === "SZ01-DNO")!;
  const tyl = z.elementy.find((e) => e.kod === "SZ01-TYL")!;
  assert.equal(dno.szer, 564 - 35);
  assert.equal(dno.gl, 500 - 10);
  assert.equal(tyl.szer, 564 - 38);
  assert.equal(tyl.wys, 101);
  const posortuj = (e: typeof z.elementy) => [...e].sort((a, b) => a.kod.localeCompare(b.kod));
  assert.deepEqual(posortuj(zbudujModulSilnikiem(m, k, tech).elementy), posortuj(z.elementy));
});

test("wysokości prowadnic w rastrze 32: kotwica z karty, wyższe szuflady na wielokrotności 32, otwory Amix w bokach", () => {
  const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "prowadnice-"))));
  const p = s.utworzProjekt({ nazwa: "P", sciany: [{ dlugoscMM: 3000 }] });
  const m = s.dodajModul(p.id, { katalogId: "base-drawers-600", konfiguracja: { szufladySystemowe: true, profilSzuflad: "amix-elite-standard" } });
  const z = s.analiza(p.id).zbudowane.find((q) => q.modul.id === m.id)!;
  const bok = z.elementy.find((e) => e.kod === "BOK-L")!;
  const wieniec = z.elementy.find((e) => e.kod === "WIENIEC-D")!;
  const d = s.dokumentacja(p.id);
  const pr = d.prowadnice.filter((q) => q.modulId === m.id);
  assert.equal(pr.length, 3);
  // Najniższa: górna powierzchnia wieńca + 33 (Amix, karta s.2), liczona od dolnej krawędzi boku.
  assert.equal(pr[0].osOdDoluBokuMM, wieniec.y + wieniec.wys - bok.y + 33);
  assert.equal(pr[0].rastr, 0);
  for (const q of pr) {
    assert.equal((q.osOdDoluBokuMM - pr[0].osOdDoluBokuMM) % 32, 0, q.szuflada);
    assert.ok(q.osOdDoluBokuMM >= q.osMinimalnaMM, q.szuflada);
    assert.ok(q.osOdDoluBokuMM - q.osMinimalnaMM < 32, q.szuflada);
    assert.deepEqual(q.otworyOdFrontuMM, [37, 69, 261, 293]); // NL 500
  }
  const bokL = d.czesci.find((c) => c.modulId === m.id && c.kodElementu === "BOK-L")!;
  assert.equal(bokL.operacje.filter((o) => o.przeznaczenie.startsWith("Prowadnica")).length, 3 * 4);
  assert.ok(bokL.uwagi.some((u) => u.includes("oś od dolnej krawędzi boku")));
  assert.ok(!d.diagnostyka.some((x) => x.kod === "PROWADNICA_OTWORY" || x.kod === "OP_POZA_CZESCIA"));

  // Blum: wysokości są, otworów wzdłuż głębokości karta nie podaje; montaż przed korpusem dodaje 1 mm.
  s.zmienModul(p.id, m.id, { konfiguracja: { profilSzuflad: "blum-legrabox-m-wood" } });
  const b1 = s.dokumentacja(p.id).prowadnice.find((q) => q.modulId === m.id)!;
  assert.equal(b1.osOdDoluBokuMM, wieniec.y + wieniec.wys - bok.y + 38);
  assert.ok(s.dokumentacja(p.id).diagnostyka.some((x) => x.kod === "PROWADNICA_OTWORY"));
  s.zmienUstawienia({ technologia: { prowadniceMontowanePrzedKorpusem: true } });
  assert.equal(s.dokumentacja(p.id).prowadnice.find((q) => q.modulId === m.id)!.osOdDoluBokuMM, b1.osOdDoluBokuMM + 1);

  // Skrzynki z płyty: bez systemu nie ma wysokości, jest brak danych z podpowiedzią wyboru systemu.
  s.zmienModul(p.id, m.id, { konfiguracja: { szufladySystemowe: false } });
  const d2 = s.dokumentacja(p.id);
  assert.equal(d2.prowadnice.length, 0);
  assert.ok(d2.diagnostyka.some((x) => x.kod === "SZUFLADA_PROWADNICE"));
});

test("szuflady wewnętrzne za drzwiami (Amix Elite): NL+16, cofnięcie 18, wariant z min. komory, raster 32, zawias w brakach", () => {
  const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "wewnetrzne-"))));
  const p = s.utworzProjekt({ nazwa: "W", sciany: [{ dlugoscMM: 3000 }] });
  const m = s.dodajModul(p.id, { katalogId: "base-shelves-600", konfiguracja: { szufladySystemowe: true, profilSzuflad: "amix-elite-standard" } });
  assert.throws(() => s.polecenieKonstrukcji(p.id, m.id, { typ: "dodajSzufladyZaDrzwiami", liczba: 6, wysokoscMM: 300 }), /nie mieści się/);
  const r = s.polecenieKonstrukcji(p.id, m.id, { typ: "dodajSzufladyZaDrzwiami", liczba: 2 });
  assert.ok(r.uwagi.some((u) => u.includes("Dodano 2")));

  const z = s.analiza(p.id).zbudowane.find((q) => q.modul.id === m.id)!;
  const t = 18;
  const LW = m.szerokoscMM - 2 * t;
  const uzytkowa = m.glebokoscMM - 10 - 3; // odsunięcie pleców + HDF (ustawienia domyślne)
  const NL = [650, 600, 550, 500, 450, 400, 350, 300, 270].find((nl) => nl + 16 <= uzytkowa && nl !== 600 && nl !== 650)!;
  const dno = z.elementy.find((e) => e.kod === "SW01-DNO")!;
  assert.equal(dno.szer, LW - 75);
  assert.equal(dno.gl, NL - 26);
  assert.equal(dno.z, 18); // skrzynka cofnięta za drzwi
  assert.equal(z.elementy.find((e) => e.kod === "SW02-TYL")!.wys, 116); // strefa 160 → H116 (komora min. 144)
  assert.ok(z.okucia.some((o) => o.opis.includes("05B.023-FB") && o.opis.includes(`${LW - 37} mm`) && o.ilosc === 2));
  assert.ok(z.elementy.some((e) => e.kod.startsWith("FRONT-D")), "drzwi zostają");

  const d = s.dokumentacja(p.id);
  const pr = d.prowadnice.filter((q) => q.modulId === m.id);
  assert.deepEqual(pr.map((q) => q.szuflada), ["SW01", "SW02"]);
  assert.ok(pr.every((q) => q.wewnetrzna));
  const bok = z.elementy.find((e) => e.kod === "BOK-L")!;
  assert.equal(pr[0].osOdDoluBokuMM, t - bok.y + 33);
  assert.equal(pr[1].osOdDoluBokuMM, pr[0].osOdDoluBokuMM + 5 * 32); // strefa 160 = 5 rastrów
  const standard = { 450: [37, 69, 261, 293], 500: [37, 69, 261, 293], 400: [37, 69, 229, 261] }[NL as 400 | 450 | 500]!;
  assert.deepEqual(pr[0].otworyOdFrontuMM, standard.map((x) => x + 18));
  assert.ok(d.diagnostyka.some((x) => x.kod === "ZAWIAS_ZA_DRZWIAMI"));
  assert.ok(!d.diagnostyka.some((x) => x.kod === "OP_POZA_CZESCIA" || x.kod === "PROWADNICA_KOLIZJA"));

  // Zmiana systemu w inspektorze działa też na module z drzewem: Blum bez danych wewnętrznych → jawny brak.
  s.zmienModul(p.id, m.id, { konfiguracja: { profilSzuflad: "blum-tandembox-antaro-m-wood" } });
  const d2 = s.dokumentacja(p.id);
  assert.ok(d2.diagnostyka.some((x) => x.kod === "SZUFLADA_WEWNETRZNA"));
  assert.ok(d2.prowadnice.filter((q) => q.modulId === m.id).every((q) => q.system.includes("TANDEMBOX")));
});
