import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "kalkulator-szuflad-"))));
const baza = { LW: 528, NL: 550, profilId: "amix-elite-standard", wariant: "199" };
const montaz = { liczbaSzuflad: 2, wysokoscFrontu: 357, szczelinaFrontow: 3, dolnaProwadnica: 3, wysokoscWewnetrzna: 698 };

test("Amix H199: przypadki warsztatowe i rozstaw 3/363 bez zaokrąglenia do rastra", () => {
  for (const [LW, dno, plecy] of [[578, 503, 491], [564, 489, 477], [528, 453, 441]]) {
    const r = s.przelicznikSzuflad({ ...baza, ...montaz, LW });
    assert.deepEqual([r.wyniki[0].dno.szer, r.wyniki[0].dno.gl], [dno, 524]);
    assert.deepEqual([r.wyniki[0].plecy.szer, r.wyniki[0].plecy.wys], [plecy, 199]);
    assert.deepEqual(r.montaz!.prowadnice.map((p) => p.dolnaKrawedzMM), [3, 363]);
    assert.equal(r.wyniki[0].zatwierdzoneProdukcyjnie, false);
  }
});

test("front wewnętrzny: cofnięcie według grubości frontu, niezależne od wysokości", () => {
  const r = s.przelicznikSzuflad({ ...baza, ...montaz, frontWewnetrzny: true, gruboscFrontu: 18 });
  assert.equal(r.montaz!.cofniecieMM, 18);
  assert.equal(r.montaz!.skokMM, 360);
  assert.equal(s.przelicznikSzuflad(baza).montaz, undefined);
  assert.throws(() => s.przelicznikSzuflad({ ...baza, ...montaz, frontWewnetrzny: true }), /grubość frontu/);
});

test("kalkulator odrzuca błędne wejścia i wyniki poza korpusem", () => {
  for (const NL of [-1, 0, Infinity, NaN]) assert.throws(() => s.przelicznikSzuflad({ ...baza, NL }), /Niepoprawne dane/);
  for (const liczbaSzuflad of [0, -1, 2.5, 21]) assert.throws(() => s.przelicznikSzuflad({ ...baza, ...montaz, liczbaSzuflad }), /Niepoprawne dane/);
  assert.throws(() => s.przelicznikSzuflad({ ...baza, LW: 75 }), /muszą być dodatnie/);
  assert.throws(() => s.przelicznikSzuflad({ ...baza, wariant: "XYZ" }), /wariant nie istnieje/);
  assert.throws(() => s.przelicznikSzuflad({ ...baza, ...montaz, liczbaSzuflad: 3 }), /poza światłem/);
  assert.throws(() => s.przelicznikSzuflad({ ...baza, liczbaSzuflad: 2 }), /wysokość frontu/);
  assert.throws(() => s.przelicznikSzuflad({ ...baza, ...montaz, szczelinaFrontow: -1 }), /Niepoprawne dane/);
});

test("pojedyncza szuflada i wymiary ułamkowe zachowują punkt pomiaru", () => {
  const r = s.przelicznikSzuflad({ ...baza, ...montaz, liczbaSzuflad: 1, dolnaProwadnica: 0 });
  assert.deepEqual(r.montaz!.prowadnice, [{ numer: 1, dolnaKrawedzMM: 0 }]);
  const u = s.przelicznikSzuflad({ ...baza, ...montaz, wysokoscFrontu: 357.5, szczelinaFrontow: 2.5 });
  assert.deepEqual(u.montaz!.prowadnice.map((p) => p.dolnaKrawedzMM), [3, 363]);
});

test("Amix H199: zaczepy na wyśrodkowanym froncie nakładanym, wymiary od krawędzi frontu", () => {
  const r = s.przelicznikSzuflad({ ...baza, LW: 564, szerokoscFrontu: 598, wysokoscFrontu: 357, pierwszyOtworOdDolu: 60 });
  const f = r.wyniki[0].mocowanieFrontu!;
  assert.equal(f.status, "pozycje");
  assert.equal(f.odBocznejKrawedziMM, 31.5);
  assert.deepEqual(f.odDolnejKrawedziMM, [60, 92, 156, 188]);
  assert.equal(f.srednicaMM, null);
  assert.equal(f.glebokoscMM, null);
  assert.equal(f.zatwierdzoneProdukcyjnie, false);
  assert.deepEqual(f.zrodlo, { dokument: "AMIX-Elite-Box-standardowe", strona: 2 });
});

test("zaczepy: minimum nie staje się domyślną pozycją wiercenia", () => {
  const f = s.przelicznikSzuflad(baza).wyniki[0].mocowanieFrontu!;
  assert.equal(f.status, "czesciowe");
  assert.equal(f.odDolnejKrawedziMM, undefined);
  assert.equal(f.odBocznejKrawedziMM, undefined);
  assert.deepEqual(f.minimalneOdDolnejKrawedziMM, [49.5, 81.5, 145.5, 177.5]);
  for (const wariant of ["84", "116"]) {
    const f = s.przelicznikSzuflad({ ...baza, wariant, pierwszyOtworOdDolu: 50 }).wyniki[0].mocowanieFrontu!;
    assert.deepEqual(f.odDolnejKrawedziMM, [50, 82]);
  }
  const inne = s.przelicznikSzuflad({ LW: 564, NL: 550, profilId: "gtv-modern-box-pro" }).wyniki[0].mocowanieFrontu!;
  assert.equal(inne.status, "brakDanych");
  assert.equal(inne.odDolnejKrawedziMM, undefined);
});

test("zaczepy: front wpuszczany i błędne pozycje otworów", () => {
  const f = s.przelicznikSzuflad({ ...baza, LW: 564, szerokoscFrontu: 560, pierwszyOtworOdDolu: 49.5 }).wyniki[0].mocowanieFrontu!;
  assert.equal(f.odBocznejKrawedziMM, 12.5);
  assert.deepEqual(f.odDolnejKrawedziMM, [49.5, 81.5, 145.5, 177.5]);
  assert.throws(() => s.przelicznikSzuflad({ ...baza, pierwszyOtworOdDolu: 49 }), /co najmniej/);
  assert.throws(() => s.przelicznikSzuflad({ ...baza, szerokoscFrontu: 400 }), /poza frontem/);
  assert.throws(() => s.przelicznikSzuflad({ ...baza, pierwszyOtworOdDolu: 100, wysokoscFrontu: 200 }), /nie mieszczą/);
  assert.throws(() => s.przelicznikSzuflad({ ...baza, szerokoscFrontu: Infinity }), /Niepoprawne dane/);
});

test("skrzynka za zwykłymi zawiasami: dno i plecy −36, front osobno", () => {
  for (const stronaZawiasow of ["lewa", "prawa"] as const) {
    const r = s.przelicznikSzuflad({ ...baza, LW: 564, szerokoscFrontu: 528, frontZaDrzwiami: true, stronaZawiasow, pierwszyOtworOdDolu: 60, wystawanieZawiasuLewe: stronaZawiasow === "lewa" ? 30 : 0, wystawanieZawiasuPrawe: stronaZawiasow === "prawa" ? 30 : 0 });
    assert.equal(r.zaDrzwiami!.szerokoscFrontu, 528);
    assert.equal(r.LW, 528);
    assert.equal(r.zaDrzwiami!.dystansLewy, stronaZawiasow === "lewa" ? 36 : 0);
    assert.equal(r.zaDrzwiami!.dystansPrawy, stronaZawiasow === "prawa" ? 36 : 0);
    assert.equal(r.zaDrzwiami!.przesuniecieWzgledemSwiatla, 0);
    assert.equal(r.zaDrzwiami!.kolizje.status, "przeswitBocznySprawdzony");
    assert.deepEqual([r.wyniki[0].dno.szer, r.wyniki[0].plecy.szer], [453, 441]);
    assert.deepEqual([r.wyniki[0].mocowanieFrontu!.odLewejKrawedziMM, r.wyniki[0].mocowanieFrontu!.odPrawejKrawedziMM], [14.5, 14.5]);
    assert.deepEqual(r.wyniki[0].mocowanieFrontu!.odDolnejKrawedziMM, [60, 92, 156, 188]);
  }
});

test("kolizja z zawiasem blokuje współrzędne frontu, brak obrysu nie daje pozytywnej weryfikacji", () => {
  const q = { ...baza, LW: 564, szerokoscFrontu: 528, frontZaDrzwiami: true, pierwszyOtworOdDolu: 60 };
  const brak = s.przelicznikSzuflad(q);
  assert.equal(brak.zaDrzwiami!.kolizje.status, "brakDanych");
  assert.equal(brak.wyniki[0].mocowanieFrontu!.status, "czesciowe");
  const kolizja = s.przelicznikSzuflad({ ...q, wystawanieZawiasuLewe: 36, wystawanieZawiasuPrawe: 0 });
  assert.equal(kolizja.zaDrzwiami!.kolizje.status, "kolizja");
  assert.equal(kolizja.wyniki[0].mocowanieFrontu!.status, "kolizja");
  assert.equal(kolizja.wyniki[0].mocowanieFrontu!.odLewejKrawedziMM, undefined);
  assert.equal(kolizja.wyniki[0].mocowanieFrontu!.odDolnejKrawedziMM, undefined);
  const granica = s.przelicznikSzuflad({ ...q, wystawanieZawiasuLewe: 35, wystawanieZawiasuPrawe: 0, luzOdZawiasu: 1 });
  assert.equal(granica.zaDrzwiami!.kolizje.status, "przeswitBocznySprawdzony");
});

test("wariant za drzwiami odrzuca sprzeczne wymiary i przesunięcia", () => {
  const q = { ...baza, LW: 564, frontZaDrzwiami: true, szerokoscFrontu: 528 };
  assert.throws(() => s.przelicznikSzuflad({ ...q, frontWewnetrzny: true }), /osobne warianty/);
  assert.throws(() => s.przelicznikSzuflad({ ...q, przesuniecieFrontu: -18 }), /poza frontem/);
  assert.throws(() => s.przelicznikSzuflad({ ...q, przesuniecieFrontu: 100 }), /wystaje poza/);
  assert.throws(() => s.przelicznikSzuflad({ ...q, LW: 30 }), /niedodatnią/);
});

test("dystans nie zwęża ręcznego frontu i nie tworzy wymiaru frontu przy jego braku", () => {
  const q = { ...baza, LW: 564, frontZaDrzwiami: true };
  const bez = s.przelicznikSzuflad(q);
  assert.equal(bez.zaDrzwiami!.szerokoscFrontu, undefined);
  assert.equal(bez.wyniki[0].mocowanieFrontu!.odLewejKrawedziMM, undefined);
  const r = s.przelicznikSzuflad({ ...q, szerokoscFrontu: 520 });
  assert.equal(r.zaDrzwiami!.szerokoscFrontu, 520);
  assert.equal(r.wyniki[0].dno.szer, 453);
  assert.equal(r.wyniki[0].plecy.szer, 441);
  assert.equal(r.wyniki[0].mocowanieFrontu!.odLewejKrawedziMM, 10.5);
  assert.equal(r.wyniki[0].mocowanieFrontu!.odPrawejKrawedziMM, 10.5);
});
