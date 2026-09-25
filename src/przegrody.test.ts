import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

// Silnik K02: przegrody pionowe i półki stałe z edytora — formatki i połączenia w dokumentacji.

function nowa() {
  return new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "przegrody-"))));
}

test("przegroda pionowa: dwie komory, konfirmaty z wieńcami, podpórki półek w boku i przegrodzie", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "P", sciany: [{ dlugoscMM: 3000 }] });
  const m = s.dodajModul(p.id, { katalogId: "base-shelves-800" });
  const polkiPrzed = s.analiza(p.id).zbudowane[0].elementy.filter((e) => e.rola === "shelf").length;
  const r = s.polecenieKonstrukcji(p.id, m.id, { typ: "podzielWnetrze", kierunek: "pion", liczba: 2 });
  assert.ok(r.uwagi[0].includes("2 komór"));

  const z = s.analiza(p.id).zbudowane.find((q) => q.modul.id === m.id)!;
  const t = 18;
  const przegroda = z.elementy.find((e) => e.rola === "divider")!;
  assert.ok(przegroda, "jest przegroda");
  const swiatlo = m.szerokoscMM - 2 * t;
  const komora = (swiatlo - t) / 2;
  assert.equal(przegroda.x, t + komora);
  assert.equal(przegroda.wys, m.wysokoscMM - 2 * t);
  const polki = z.elementy.filter((e) => e.rola === "shelf");
  assert.equal(polki.length, 2 * polkiPrzed, "półki w każdej komorze");
  assert.ok(polki.every((q) => q.szer === komora));

  const d = s.dokumentacja(p.id);
  const cz = (kod: string) => d.czesci.find((c) => c.modulId === m.id && c.kodElementu === kod)!;
  const opsP = cz(przegroda.kod).operacje;
  assert.ok(opsP.filter((o) => o.przeznaczenie === "Konfirmat — otwór w krawędzi").length >= 4, "krawędzie przegrody");
  assert.ok(opsP.some((o) => o.przeznaczenie === "Podpórka półki" && o.powierzchnia === "A"));
  assert.ok(opsP.some((o) => o.przeznaczenie === "Podpórka półki" && o.powierzchnia === "B"), "podpórki z obu stron przegrody");
  for (const w of ["WIENIEC-D", "WIENIEC-G"]) assert.ok(cz(w).operacje.some((o) => o.przelotowy && o.polaczenie?.includes(cz(przegroda.kod).etykieta)), `${w} ↔ przegroda`);
  assert.ok(!d.diagnostyka.some((x) => x.kod === "OP_POZA_CZESCIA" || x.kod === "PRZEGRODA_BEZ_OPARCIA"));

  // Półka stała w komorze łączy się z bokiem i przegrodą, nie z drugim bokiem.
  const komoraId = s.polecenieKonstrukcji(p.id, m.id, { typ: "podzielWnetrze", kierunek: "poziom", liczba: 2, strefaId: "wnetrze-k1" });
  assert.ok(komoraId.uwagi[0].includes("półkami stałymi"));
  const d2 = s.dokumentacja(p.id);
  const stala = d2.czesci.find((c) => c.modulId === m.id && c.rola === "fixedShelf")!;
  const polaczenia = new Set(stala.operacje.map((o) => o.polaczenie));
  assert.ok([...polaczenia].some((x) => x?.includes("BOK")));
  assert.ok(![...polaczenia].some((x) => x?.includes(d2.czesci.find((c) => c.modulId === m.id && c.kodElementu === "BOK-P")!.etykieta)), "nie sięga prawego boku");
  assert.ok(!d2.diagnostyka.some((x) => x.kod === "OP_POZA_CZESCIA"));

  assert.throws(() => s.polecenieKonstrukcji(p.id, m.id, { typ: "podzielWnetrze", kierunek: "pion", liczba: 6, strefaId: "wnetrze-k2" }), /węższa niż 100/);
});

test("podział drzwi: 4 skrzydła z przegrodami — prowadniki zawiasów wewnętrznych skrzydeł na przegrodach", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "F", sciany: [{ dlugoscMM: 3000 }] });
  const m = s.dodajModul(p.id, { katalogId: "base-shelves-800", konfiguracja: { liczbaDrzwi: 1 } });
  s.polecenieKonstrukcji(p.id, m.id, { typ: "podzielFront", kierunek: "pion", liczba: 4, przegroda: true });
  const z = s.analiza(p.id).zbudowane.find((q) => q.modul.id === m.id)!;
  const drzwi = z.elementy.filter((e) => e.kod.startsWith("FRONT-D")).sort((a, b) => a.x - b.x);
  assert.equal(drzwi.length, 4);
  assert.deepEqual(drzwi.map((d) => d.stronaZawiasow), ["lewa", "lewa", "prawa", "prawa"]);
  const przegrody = z.elementy.filter((e) => e.rola === "divider").sort((a, b) => a.x - b.x);
  assert.equal(przegrody.length, 3);
  // Oś przegrody w osi szczeliny między skrzydłami
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(przegrody[i].x + przegrody[i].szer / 2 - (drzwi[i].x + drzwi[i].szer + drzwi[i + 1].x) / 2) < 0.2);
  const d = s.dokumentacja(p.id);
  const cz = (kod: string) => d.czesci.find((c) => c.modulId === m.id && c.kodElementu === kod)!;
  const naPrzegrodzie = cz(przegrody[0].kod).operacje.filter((o) => o.przeznaczenie === "Prowadnik zawiasu");
  assert.ok(naPrzegrodzie.length >= 4, "skrzydło 2 (zawiasy lewe) wisi na przegrodzie 1");
  assert.ok(naPrzegrodzie.every((o) => o.polaczenie?.includes(cz(drzwi[1].kod).etykieta)));
  assert.ok(!d.diagnostyka.some((x) => x.kod === "OP_POZA_CZESCIA" || x.kod === "ZAWIAS_BEZ_BOKU"));
});

test("podział drzwi jedno nad drugim z półką stałą na linii podziału", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "F2", sciany: [{ dlugoscMM: 3000 }] });
  const m = s.dodajModul(p.id, { katalogId: "base-shelves-600" });
  s.polecenieKonstrukcji(p.id, m.id, { typ: "podzielFront", kierunek: "poziom", liczba: 2, przegroda: true });
  const z = s.analiza(p.id).zbudowane.find((q) => q.modul.id === m.id)!;
  const drzwi = z.elementy.filter((e) => e.kod.startsWith("FRONT-D")).sort((a, b) => a.y - b.y);
  assert.equal(drzwi.length, 2);
  const stala = z.elementy.find((e) => e.rola === "fixedShelf")!;
  const szczelina = (drzwi[0].y + drzwi[0].wys + drzwi[1].y) / 2;
  assert.ok(Math.abs(stala.y + stala.wys / 2 - szczelina) < 0.2, "półka stała w osi szczeliny");
  assert.throws(() => s.polecenieKonstrukcji(p.id, m.id, { typ: "podzielFront", kierunek: "pion", liczba: 4 }), /wskaż|150/);
});

test("nierówne fronty: wysokość jednej szuflady, reszta po równo, blokada, minimum 100", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "R", sciany: [{ dlugoscMM: 3000 }] });
  const m = s.dodajModul(p.id, { katalogId: "base-shelves-600" });
  s.polecenieKonstrukcji(p.id, m.id, { typ: "zamienDrzwiNaSzuflady", liczba: 3 });
  const pola = () => {
    const mod = s.projekt(p.id).moduly.find((q) => q.id === m.id)!;
    const z = s.analiza(p.id).zbudowane.find((q) => q.modul.id === m.id)!;
    type Pole = NonNullable<typeof mod.drzewo>["fronty"];
    const znajdz = (q: Pole): Pole | undefined => (q.podzial?.czesci.some((c) => c.front?.typ === "szuflada") ? q : q.podzial?.czesci.map(znajdz).find(Boolean));
    const stos = znajdz(mod.drzewo!.fronty)!.podzial!.czesci;
    return stos.map((c) => ({ id: c.id, wys: z.elementy.find((e) => e.kod === (c.front as { kod: string }).kod)!.wys }));
  };
  const przed = pola();
  const suma = przed.reduce((a, q) => a + q.wys, 0);
  s.polecenieKonstrukcji(p.id, m.id, { typ: "ustawRozmiarFrontu", poleId: przed[0].id, mm: 300 });
  const po = pola();
  assert.equal(Math.round(po[0].wys * 10) / 10, 300);
  assert.ok(Math.abs(po[1].wys - po[2].wys) < 0.01, "reszta po równo");
  assert.ok(Math.abs(po.reduce((a, q) => a + q.wys, 0) - suma) < 0.2, `suma frontów bez zmian: ${JSON.stringify(przed)} → ${JSON.stringify(po)}`);
  // Blokada górnej: zmiana środkowej nie rusza górnej, dolna wyrównuje.
  s.polecenieKonstrukcji(p.id, m.id, { typ: "ustawRozmiarFrontu", poleId: po[1].id, mm: 150, zablokowane: [po[2].id] });
  const po2 = pola();
  assert.ok(Math.abs(po2[2].wys - po[2].wys) < 0.01);
  assert.equal(Math.round(po2[1].wys), 150);
  assert.throws(() => s.polecenieKonstrukcji(p.id, m.id, { typ: "ustawRozmiarFrontu", poleId: po2[0].id, mm: suma - 150 }), /minimum 100/);
  const d = s.dokumentacja(p.id);
  assert.ok(!d.diagnostyka.some((x) => x.kod === "OP_POZA_CZESCIA"));
});

test("zmiana szerokości skrzydła przesuwa przegrodę, która leżała na linii podziału", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "S", sciany: [{ dlugoscMM: 3000 }] });
  const m = s.dodajModul(p.id, { katalogId: "base-shelves-800", konfiguracja: { liczbaDrzwi: 1 } });
  s.polecenieKonstrukcji(p.id, m.id, { typ: "podzielFront", kierunek: "pion", liczba: 2, przegroda: true });
  const r = s.polecenieKonstrukcji(p.id, m.id, { typ: "ustawRozmiarFrontu", poleId: "drzwi-1-s1", mm: 300 });
  assert.ok(r.uwagi.some((u) => u.includes("Przesunięto przegrodę")));
  const z = s.analiza(p.id).zbudowane.find((q) => q.modul.id === m.id)!;
  const [d1, d2] = z.elementy.filter((e) => e.kod.startsWith("FRONT-D")).sort((a, b) => a.x - b.x);
  const pr = z.elementy.find((e) => e.rola === "divider")!;
  assert.ok(Math.abs(pr.x + pr.szer / 2 - (d1.x + d1.szer + d2.x) / 2) < 0.2, `przegroda ${pr.x} vs szczelina ${(d1.x + d1.szer + d2.x) / 2}`);
  assert.ok(!s.dokumentacja(p.id).diagnostyka.some((x) => x.kod === "OP_POZA_CZESCIA"));
});
