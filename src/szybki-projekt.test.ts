import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { DEKORY, kluczDekoru, wariantyDekoru } from "./core/catalog/decors.js";
import { rozlozDlugosc } from "./core/uklad.js";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";
import type { Modul } from "./core/types.js";

const nowa = () => new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "szybki-"))));
const dolny = (m: Modul) => m.pozycjaYMM < 1000;
const wiszacy = (m: Modul) => m.pozycjaYMM + m.wysokoscMM > 1400 && m.pozycjaYMM < 2120;

/** Bez nakładania w rzędzie, suma szerokości dolnych + rezerwacje = długość ściany. */
function sprawdzSciane(moduly: Modul[], rez: { scianaId: string; rzad: string; odMM: number; doMM: number }[], scianaId: string, dlugosc: number) {
  const d = moduly.filter((m) => m.scianaId === scianaId && dolny(m));
  const r = rez.filter((x) => x.scianaId === scianaId && x.rzad === "dolny");
  const odc = [...d.map((m) => [m.pozycjaXMM, m.pozycjaXMM + m.szerokoscMM]), ...r.map((x) => [x.odMM, x.doMM])].sort((a, b) => a[0] - b[0]);
  let x = 0;
  for (const [a, b] of odc) {
    assert.ok(Math.abs(a - x) < 0.6, `ciągłość dolnego rzędu na ${scianaId}: ${a} vs ${x}`);
    x = b;
  }
  assert.ok(Math.abs(x - dlugosc) < 0.6, `suma = długość ściany (${x} vs ${dlugosc})`);
  for (const rz of [dolny, wiszacy]) {
    const l = moduly.filter((m) => m.scianaId === scianaId && rz(m)).sort((a, b) => a.pozycjaXMM - b.pozycjaXMM);
    for (let i = 1; i < l.length; i++) assert.ok(l[i].pozycjaXMM >= l[i - 1].pozycjaXMM + l[i - 1].szerokoscMM - 0.5, `kolizja ${l[i - 1].nazwa} / ${l[i].nazwa}`);
  }
}

test("rozlozDlugosc: preferowane szerokości, blenda < 150 mm, szafka dopasowana", () => {
  assert.deepEqual(rozlozDlugosc(3600, [600, 500, 400]).map((o) => o.szerokoscMM), [600, 600, 600, 600, 600, 600]);
  const r = rozlozDlugosc(1250, [600, 500, 400, 800, 900, 300, 450]);
  assert.equal(r.reduce((s, o) => s + o.szerokoscMM, 0), 1250);
  assert.ok(r.filter((o) => o.typ === "blenda").every((o) => o.szerokoscMM < 150));
  assert.deepEqual(rozlozDlugosc(90, [600]), [{ typ: "blenda", szerokoscMM: 90 }]);
  assert.deepEqual(rozlozDlugosc(220, [600, 300]), [{ typ: "dopasowana", szerokoscMM: 220 }]);
  const sym = rozlozDlugosc(2470, [600, 500, 400], { symetria: true });
  assert.equal(sym[0].typ, "blenda");
  assert.equal(sym[sym.length - 1].typ, "blenda");
  const sz = sym.filter((o) => o.typ === "szafka").map((o) => o.szerokoscMM);
  assert.deepEqual(sz, [...sz].reverse(), "symetria");
});

test("szybki układ I 3600: zlew, zmywarka, płyta, lodówka, wiszące z okapem — bez kolizji, suma = ściana", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "I", sciany: [{ dlugoscMM: 3600 }] });
  const w = s.szybkiUklad(p.id, { typ: "I" });
  const sid = w.sciany[0].id;
  sprawdzSciane(w.moduly, w.rezerwacje, sid, 3600);
  const role = w.moduly.map((m) => m.rola);
  for (const r of ["lodowka", "zlew", "zmywarka", "plyta", "okap"]) assert.ok(role.includes(r as never), r);
  const zlew = w.moduly.find((m) => m.rola === "zlew")!;
  const plyta = w.moduly.find((m) => m.rola === "plyta")!;
  const zmyw = w.moduly.find((m) => m.rola === "zmywarka")!;
  assert.ok(plyta.pozycjaXMM - Math.max(zlew.pozycjaXMM + zlew.szerokoscMM, zmyw.pozycjaXMM + zmyw.szerokoscMM) >= 600, "blat zlew–płyta ≥ 600");
  assert.ok(3600 - (plyta.pozycjaXMM + plyta.szerokoscMM) >= 300, "płyta ≥ 300 od końca");
  // nad lodówką (słupkiem) brak wiszących
  const lod = w.moduly.find((m) => m.rola === "lodowka")!;
  assert.ok(!w.moduly.some((m) => m.pozycjaYMM >= 1000 && m.pozycjaXMM < lod.pozycjaXMM + lod.szerokoscMM - 0.5 && m.pozycjaXMM + m.szerokoscMM > lod.pozycjaXMM + 0.5));
  const a = s.analiza(p.id);
  assert.deepEqual(a.walidacja.filter((u) => u.poziom === "blad"), []);
  assert.ok(a.warianty.every((x) => x.cenaBrutto > 0));
  // bez flagi zastap nie nadpisuje
  assert.throws(() => s.szybkiUklad(p.id, { typ: "I" }), /zastap/);
  const n = s.projekt(p.id).moduly.length;
  const w2 = s.szybkiUklad(p.id, { typ: "I", zastap: true, lodowka: { rodzaj: "wolnostojaca", szerokoscMM: 700 } });
  assert.equal(w2.usunieto, n);
  sprawdzSciane(w2.moduly, w2.rezerwacje, sid, 3600);
  assert.ok(w2.rezerwacje.some((r) => r.opis.includes("wolnostojącą")));
});

test("szybki układ L 3000+2400: narożnik ślepy, rezerwacja i blenda narożna, bez kolizji", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "L", sciany: [{ dlugoscMM: 1000 }] });
  const w = s.szybkiUklad(p.id, { typ: "L", dlugosciScianMM: [3000, 2400], wysokoscMM: 2600 });
  const [A, B] = w.sciany;
  assert.deepEqual([A.dlugoscMM, B.dlugoscMM], [3000, 2400]);
  sprawdzSciane(w.moduly, w.rezerwacje, A.id, 3000);
  sprawdzSciane(w.moduly, w.rezerwacje, B.id, 2400);
  const nar = w.moduly.find((m) => m.rola === "naroznik" && m.konstrukcja === "blindCorner")!;
  assert.equal(nar.scianaId, A.id);
  assert.equal(nar.pozycjaXMM + nar.szerokoscMM, 3000);
  assert.equal(nar.konfiguracja.stronaDrzwiNaroznika, "lewa");
  assert.ok(w.moduly.some((m) => m.rola === "blendaNarozna" && m.scianaId === B.id));
  assert.ok(w.moduly.some((m) => m.konstrukcja === "wallCorner" && m.scianaId === A.id));
  const plyta = w.moduly.find((m) => m.rola === "plyta")!;
  assert.equal(plyta.scianaId, B.id);
  assert.ok(plyta.pozycjaXMM >= 578 + 50 + 300 - 0.5, "płyta ≥ 300 od narożnika");
  assert.deepEqual(s.analiza(p.id).walidacja.filter((u) => u.poziom === "blad"), []);

  // Wypełnij całą ścianę widzi szafkę narożną ze ściany prostopadłej
  const s2 = nowa();
  const p2 = s2.utworzProjekt({ nazwa: "L2", sciany: [{ dlugoscMM: 3000 }, { dlugoscMM: 2400 }] });
  const [a2, b2] = p2.pomieszczenia[0].sciany;
  s2.dodajModul(p2.id, { katalogId: "base-blind-corner-1100", scianaId: a2.id, pozycjaXMM: 1900 });
  const f = s2.wypelnijCalaSciane(p2.id, b2.id, { rzad: "dolny" });
  assert.ok(f.zajete.some((z) => z.prostopadly && z.odMM === 0 && z.doMM === 578));
  assert.equal(f.moduly[0].rola, "blendaNarozna");
  assert.equal(f.moduly[0].pozycjaXMM, 578);
  assert.equal(578 + f.moduly.reduce((x, m) => x + m.szerokoscMM, 0), 2400);
});

test("szybki układ U 2400+3200+2400 i narożnik L; wypełnij ścianę omija zmywarkę", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "U", sciany: [{ dlugoscMM: 2400 }, { dlugoscMM: 3200 }, { dlugoscMM: 2400 }] });
  const w = s.szybkiUklad(p.id, { typ: "U", naroznik: "L", slupki: ["tall-oven-600"] });
  const [A, B, C] = w.sciany;
  sprawdzSciane(w.moduly, w.rezerwacje, A.id, 2400);
  sprawdzSciane(w.moduly, w.rezerwacje, B.id, 3200);
  sprawdzSciane(w.moduly, w.rezerwacje, C.id, 2400);
  assert.equal(w.moduly.filter((m) => m.konstrukcja === "lCorner").length, 2);
  assert.equal(w.moduly.find((m) => m.rola === "zlew")!.scianaId, B.id);
  assert.equal(w.moduly.find((m) => m.rola === "plyta")!.scianaId, C.id);
  assert.ok(w.moduly.some((m) => m.katalogId === "tall-oven-600"));
  assert.deepEqual(s.analiza(p.id).walidacja.filter((u) => u.poziom === "blad"), []);

  // podgląd nie zapisuje
  const s2 = nowa();
  const p2 = s2.utworzProjekt({ nazwa: "W", sciany: [{ dlugoscMM: 3000 }] });
  const sc = p2.pomieszczenia[0].sciany[0].id;
  s2.dodajModul(p2.id, { katalogId: "dishwasher-front-600", scianaId: sc, pozycjaXMM: 1200 });
  const pg = s2.wypelnijCalaSciane(p2.id, sc, { rzad: "dolny", podglad: true });
  assert.equal(pg.podglad, true);
  assert.equal(s2.projekt(p2.id).moduly.length, 1);
  const f = s2.wypelnijCalaSciane(p2.id, sc, { rzad: "dolny", konstrukcja: "drawers" });
  const wszystkie = s2.projekt(p2.id).moduly;
  assert.equal(wszystkie.reduce((x, m) => x + m.szerokoscMM, 0), 3000);
  assert.ok(f.moduly.every((m) => m.pozycjaXMM + m.szerokoscMM <= 1200.5 || m.pozycjaXMM >= 1799.5));
  assert.deepEqual(s2.analiza(p2.id).walidacja.filter((u) => u.poziom === "blad"), []);
});

test("pakiet stylu: Egger z artykułu aktywowany, Kronospan bez danych = jawny brak, blat z galerii", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Styl" });
  const egger = DEKORY.find((d) => wariantyDekoru(d).some((w) => w.dimension_z_source.trim() === "18"))!;
  const krono = DEKORY.find((d) => d.manufacturer === "Kronospan")!;
  const blatDekor = DEKORY.find((d) => d.decor_key === "F021_75")!;
  const w = s.ustawStyl(p.id, { korpus: { dekor: kluczDekoru(egger) }, front: { dekor: kluczDekoru(krono) }, blat: { dekor: kluczDekoru(blatDekor) } });
  assert.equal(w.braki.length, 1);
  assert.equal(w.braki[0].rola, "front");
  assert.match(w.braki[0].komunikat, /wymaga wpisania grubości\/formatu/);
  assert.ok(w.ustawiono.korpus && w.ustawiono.blat && !w.ustawiono.front);
  const pom = s.projekt(p.id).pomieszczenia[0];
  assert.equal(pom.materialKorpusuId, w.ustawiono.korpus);
  assert.equal(pom.materialBlatuId, w.ustawiono.blat);
  const korpus = s.materialy().find((m) => m.id === w.ustawiono.korpus)!;
  assert.equal(korpus.gruboscMM, 18);
  const blat = s.materialy().find((m) => m.id === w.ustawiono.blat)!;
  assert.equal(blat.jednostka, "metrBiezacy");
  assert.equal(blat.gruboscMM, 38);
  // Kronospan z jawnym wpisem użytkownika
  const w2 = s.ustawStyl(p.id, { front: { dekor: kluczDekoru(krono), gruboscMM: 18, szerokoscArkuszaMM: 2070, wysokoscArkuszaMM: 2800, struktura: krono.textures?.[0] } });
  assert.deepEqual(w2.braki, []);
  assert.match(w2.zrodla[0].zrodlo, /wpis użytkownika/);
  // Blat bez ceny: pozycja wyceny oznaczona błędem, nie cena z innego materiału
  s.dodajModul(p.id, { katalogId: "base-drawers-600" });
  const blatPoz = s.wycena(p.id, "standard").warianty[0].pozycje.find((x) => x.kategoria === "blaty")!;
  assert.ok(blatPoz.jestBledemWyceny);
  assert.match(blatPoz.nazwa, new RegExp(blatDekor.name));
});

test("okucia projektu: wybór respektowany w wycenie, brak ceny = jawny błąd, cena uzgodniona bez zmian", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Okucia", sciany: [{ dlugoscMM: 3000 }] });
  s.szybkiUklad(p.id, { typ: "I", wiszace: true });
  s.zmienProjekt(p.id, { cenaUzgodnionaBrutto: 30000 });
  const opcje = s.opcjeOkuc();
  assert.ok(opcje.systemySzuflad.some((o) => o.id === "blum.legrabox.pure"));
  assert.throws(() => s.ustawOkucia(p.id, { zawiasy: "blum.legrabox.pure" }), /typ/);
  const u = s.ustawOkucia(p.id, { systemSzuflad: "blum.legrabox.pure", zawiasy: "salice.silentia", profilSzuflad: "blum-legrabox-m-wood" });
  assert.equal(u.okucia?.systemSzuflad, "blum.legrabox.pure");
  const eco = s.wycena(p.id, "eco").warianty[0];
  const szuf = eco.pozycje.find((x) => x.nazwa.includes("Legrabox"))!;
  assert.ok(szuf && !szuf.jestBledemWyceny && szuf.uwagi.includes("Wybór projektu"));
  assert.ok(eco.pozycje.some((x) => x.nazwa.includes("Silentia")));
  assert.equal(s.wycena(p.id, "standard").warianty[0].cenaBrutto, 30000);
  // pozycja bez ceny
  s.zapiszOkucie({ id: "salice.silentia", cenaNetto: 0 });
  const z = s.wycena(p.id, "eco").warianty[0].pozycje.find((x) => x.nazwa.includes("Silentia"))!;
  assert.equal(z.cenaJednostkowaNetto, 0);
  assert.ok(z.jestBledemWyceny);
  assert.equal(s.wycena(p.id, "standard").warianty[0].cenaBrutto, 30000);
  s.ustawOkucia(p.id, null);
  assert.equal(s.projekt(p.id).okucia, undefined);
});
