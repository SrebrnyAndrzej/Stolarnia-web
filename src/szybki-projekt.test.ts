import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { DEKORY, kluczDekoru, wariantyDekoru } from "./core/catalog/decors.js";
import { planSzybkiegoUkladu, rozlozDlugosc } from "./core/uklad.js";
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
  // Reszta 150–299 mm: cargo z katalogu, inaczej szeroka blenda z ostrzeżeniem; < 20 mm luz montażowy (decyzja koordynatora).
  assert.deepEqual(rozlozDlugosc(220, [600, 300], { cargo: [150, 200] }).map((o) => [o.typ, o.szerokoscMM]), [["cargo", 200], ["blenda", 20]]);
  assert.deepEqual(rozlozDlugosc(160, [600], { cargo: [150, 200] }).map((o) => o.typ), ["cargo", "luz"]);
  const bezCargo = rozlozDlugosc(220, [600, 300]);
  assert.equal(bezCargo[0].typ, "blenda");
  assert.ok(bezCargo[0].uwaga);
  assert.deepEqual(rozlozDlugosc(3610, [600]).map((o) => o.typ), ["szafka", "szafka", "szafka", "szafka", "szafka", "szafka", "luz"]);
  assert.deepEqual(rozlozDlugosc(12, [600]).map((o) => o.typ), ["luz"]);
  // Szafki dopasowane maks. 900 mm
  const dop = rozlozDlugosc(2000, [3000]);
  assert.ok(dop.length === 3 && dop.every((o) => o.typ === "dopasowana" && o.szerokoscMM <= 900));
  assert.equal(Math.round(dop.reduce((x, o) => x + o.szerokoscMM, 0) * 10) / 10, 2000);
  assert.throws(() => rozlozDlugosc(1000, []), /Brak szerokości/);
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

test("szybki układ omija szafkę ślepą z sąsiedniej ściany; moduł w środku ściany = błąd", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Ślepa+I", sciany: [{ dlugoscMM: 3000 }, { dlugoscMM: 3600 }] });
  const [A, B] = p.pomieszczenia[0].sciany;
  s.dodajModul(p.id, { katalogId: "base-blind-corner-1100", scianaId: A.id, pozycjaXMM: 1900, konfiguracja: { stronaDrzwiNaroznika: "lewa" } });
  const w = s.szybkiUklad(p.id, { typ: "I", scianyIds: [B.id], lodowka: { strona: "koniec" } });
  sprawdzSciane(w.moduly, w.rezerwacje, B.id, 3600);
  assert.ok(w.rezerwacje.some((r) => r.scianaId === B.id && r.odMM === 0 && r.doMM === 578));
  assert.ok(w.moduly.some((m) => m.rola === "blendaNarozna" && m.pozycjaXMM === 578));
  assert.ok(!w.ostrzezenia.some((o) => /Ściana Ściana|ściana Ściana/.test(o)));
  assert.deepEqual(s.analiza(p.id).walidacja.filter((u) => u.poziom === "blad"), []);

  // Zajętość spoza układu w środku ściany → błąd planu
  const sc = [{ id: "a", nazwa: "Ściana A", dlugoscMM: 3600, wysokoscMM: 2600 }];
  assert.throws(() => planSzybkiegoUkladu(sc, { typ: "I" }, { gruboscFrontuMM: 18, zajete: [{ dolny: [{ odMM: 1500, doMM: 2000, opis: "Szafka X" }], wiszacy: [] }] }), /środek ściany/);
});

test("blenda węższa niż dwa boki bez błędu budowy; przerwa poza układem; lodówka przy drzwiach ślepej", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Blenda", sciany: [{ dlugoscMM: 3000 }, { dlugoscMM: 2400 }] });
  const w = s.szybkiUklad(p.id, { typ: "L", lodowka: { strona: "koniec" }, przerwyWiszacych: [{ sciana: 5, odMM: 0, doMM: 500 }, { sciana: 0, odMM: 2500, doMM: 3000 }] });
  assert.ok(w.ostrzezenia.some((o) => o.includes("poza układem")));
  assert.ok(w.ostrzezenia.some((o) => o.includes("Narożnik wiszący")));
  assert.ok(!w.moduly.some((m) => m.konstrukcja === "wallCorner"));
  assert.ok(w.ostrzezenia.some((o) => o.includes("drzwiach szafki narożnej ślepej")));
  const A = w.sciany[0];
  sprawdzSciane(w.moduly, w.rezerwacje, A.id, 3000);
  const blenda = s.dodajModul(p.id, { kategoria: "base", konstrukcja: "filler", nazwa: "Blenda 28", scianaId: A.id, pozycjaXMM: 0, szerokoscMM: 28, wysokoscMM: 720, glebokoscMM: 560 });
  const zb = s.analiza(p.id).zbudowane.find((z) => z.modul.id === blenda.id)!;
  assert.ok(zb.elementy.length > 0 && !zb.ostrzezenia.some((o) => o.includes("grubości boków")));
});

test("walidacja wejścia: zod → BladUslugi, puste szerokości, blenda narożna > 150", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Walidacja", sciany: [{ dlugoscMM: 3000 }] });
  const sc = p.pomieszczenia[0].sciany[0].id;
  assert.throws(() => s.ustawStyl(p.id, { korpus: "abc" as never }), (e: Error) => e.constructor.name === "BladUslugi");
  assert.throws(() => s.wypelnijCalaSciane(p.id, sc, { rzad: "dolny", blendaNaroznaMM: 200 }), /Nieprawidłowe dane/);
  assert.throws(() => s.wypelnijCalaSciane(p.id, sc, { rzad: "dolny", odXMM: Number.NaN }), /Nieprawidłowe dane/);
  assert.throws(() => s.wypelnijCalaSciane(p.id, sc, { rzad: "dolny", szerokosci: [123] }), /katalogu/);
  assert.throws(() => s.szybkiUklad(p.id, { typ: "I", szerokosci: [123] }), /katalogu/);
  assert.throws(() => s.szybkiUklad(p.id, { typ: "X" as never }), /Nieprawidłowe dane/);
  assert.equal(s.projekt(p.id).moduly.length, 0);
});

test("styl: zły typ materiału = brak bez zapisu; odczyt stylu z kluczem dekoru", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "StylOdczyt" });
  const przed = s.projekt(p.id).pomieszczenia[0].materialKorpusuId;
  const w = s.ustawStyl(p.id, { korpus: { materialId: "blat-lam-38" }, blat: { materialId: "front-mdf-folia" } });
  assert.equal(w.braki.length, 2);
  assert.equal(s.projekt(p.id).pomieszczenia[0].materialKorpusuId, przed);
  const egger = DEKORY.find((d) => wariantyDekoru(d).some((x) => x.dimension_z_source.trim() === "18"))!;
  s.ustawStyl(p.id, { front: { dekor: kluczDekoru(egger) } });
  const st = s.stylPomieszczenia(p.id);
  assert.equal(st.front?.dekor, kluczDekoru(egger));
  assert.equal(st.korpus?.materialId, przed);
});

test("oferta PDF zablokowana, gdy wariant ma pozycje bez ceny; komunikat bez wewnętrznych id", async () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Oferta", sciany: [{ dlugoscMM: 3000 }] });
  s.szybkiUklad(p.id, { typ: "I" });
  s.zapiszOkucie({ id: "salice.silentia", cenaNetto: 0 });
  s.ustawOkucia(p.id, { zawiasy: "salice.silentia" });
  await assert.rejects(() => s.ofertaPdf(p.id, { wariant: "standard" }), (e: Error) => e.constructor.name === "BladUslugi" && /Silentia/.test(e.message) && !e.message.includes("salice.silentia"));
  s.zapiszOkucie({ id: "salice.silentia", cenaNetto: 12 });
  const pdf = await s.ofertaPdf(p.id, { wariant: "standard" });
  assert.ok(pdf.length > 1000);
});

test("propozycja wstępna: brak ceny nie daje fałszywej granicy kwoty; pełna oferta nadal zablokowana", async () => {
  const { pdfText } = await import("../tests/helpers/pdf-text.js");
  const { execFileSync } = await import("node:child_process");
  const { writeFileSync } = await import("node:fs");
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Wstępna", sciany: [{ dlugoscMM: 3000 }] });
  s.szybkiUklad(p.id, { typ: "I" });
  s.zapiszOkucie({ id: "salice.silentia", cenaNetto: 0 });
  s.ustawOkucia(p.id, { zawiasy: "salice.silentia" });
  await assert.rejects(() => s.ofertaPdf(p.id, { wariant: "standard" }), /Oferty nie można wygenerować/);
  const pdf = await s.ofertaPdf(p.id, { wariant: "standard", wstepna: true });
  const plik = join(mkdtempSync(join(tmpdir(), "pw-")), "pw.pdf");
  writeFileSync(plik, pdf);
  const tekst = pdfText(plik);
  assert.match(tekst,/do ustalenia/);
  assert.doesNotMatch(tekst,/Widełki: od/);
  assert.match(tekst, /PROPOZYCJA WSTĘPNA/);
  assert.match(tekst, /CENA DO POTWIERDZENIA/);
  assert.match(tekst, /PW\/\d{4}\//);
  assert.match(tekst, /nie stanowi oferty ani podstawy\s+umowy/);
  assert.doesNotMatch(tekst, /Ważna do/);
  // Bez braków „wstępna” nie ma sensu: powstaje zwykła oferta.
  s.zapiszOkucie({ id: "salice.silentia", cenaNetto: 12 });
  const pelna = await s.ofertaPdf(p.id, { wariant: "standard", wstepna: true });
  writeFileSync(plik, pelna);
  assert.doesNotMatch(pdfText(plik), /CENA DO POTWIERDZENIA/);
});

test("styl Kronospan: wszystkie brakujące dane (wymiary i struktura) w pierwszej odpowiedzi", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Krono", sciany: [{ dlugoscMM: 3000 }] });
  s.szybkiUklad(p.id, { typ: "I" });
  const krono = DEKORY.find((d) => d.manufacturer === "Kronospan" && !d.surface_label && (d.textures?.length ?? 0) > 1)!;
  const w = s.ustawStyl(p.id, { front: { dekor: kluczDekoru(krono) } });
  assert.equal(w.braki.length, 1);
  assert.match(w.braki[0].komunikat, /grubości\/formatu oraz strukturę \(/);
  for (const t of krono.textures!) assert.ok(w.braki[0].komunikat.includes(t));
  // Komplet wymiarów bez struktury — dalej jedna, jasna prośba o strukturę.
  const w2 = s.ustawStyl(p.id, { front: { dekor: kluczDekoru(krono), gruboscMM: 18, szerokoscArkuszaMM: 2070, wysokoscArkuszaMM: 2800 } });
  assert.match(w2.braki[0].komunikat, /wybierz strukturę/);
  const w3 = s.ustawStyl(p.id, { front: { dekor: kluczDekoru(krono), gruboscMM: 18, szerokoscArkuszaMM: 2070, wysokoscArkuszaMM: 2800, struktura: krono.textures![0] } });
  assert.deepEqual(w3.braki, []);
});

test("dekory stolarni: lista właściciela, a bez niej najczęstsze dekory z projektów", () => {
  const s = nowa();
  assert.deepEqual(s.dekoryStolarni(), { zrodlo: "brak", klucze: [] });
  const egger = DEKORY.find((d) => d.manufacturer === "Egger" && wariantyDekoru(d).length)!;
  for (const n of ["A", "B"]) {
    const p = s.utworzProjekt({ nazwa: n, sciany: [{ dlugoscMM: 3000 }] });
    s.szybkiUklad(p.id, { typ: "I" });
    s.ustawStyl(p.id, { front: { dekor: kluczDekoru(egger) } });
  }
  const z = s.dekoryStolarni();
  assert.equal(z.zrodlo, "projekty");
  assert.equal(z.klucze[0], kluczDekoru(egger));
  const inne = DEKORY.filter((d) => d !== egger).slice(0, 3).map(kluczDekoru);
  assert.deepEqual(s.ustawDekoryStolarni(inne), { zrodlo: "stolarnia", klucze: inne });
  assert.throws(() => s.ustawDekoryStolarni(["Nie:ma"]), /Nieznane dekory/);
  assert.throws(() => s.ustawDekoryStolarni("x"), /lista/);
  assert.deepEqual(s.ustawDekoryStolarni([]).zrodlo, "projekty");
});
