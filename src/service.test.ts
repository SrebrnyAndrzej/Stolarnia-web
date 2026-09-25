import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { zawiasyDlaWysokosci } from "./core/builder.js";
import { Magazyn } from "./store/store.js";
import { Stolarnia } from "./service.js";

function nowa() {
  return new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "stolarnia-"))));
}

test("reguła zawiasów jak w ProjektWycenyBuilder", () => {
  assert.equal(zawiasyDlaWysokosci(716), 2);
  assert.equal(zawiasyDlaWysokosci(1200), 3);
  assert.equal(zawiasyDlaWysokosci(1900), 4);
  assert.equal(zawiasyDlaWysokosci(2100), 5);
});

test("kuchnia 3,6 m: moduły, formatki, rozkrój i wycena 4 wariantów", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Kuchnia testowa", sciany: [{ dlugoscMM: 3600 }] });
  const sc = p.pomieszczenia[0].sciany[0].id;
  s.wypelnijSciane(p.id, sc, ["tall-refrigerator-600", "base-drawers-600", "base-sink-800", "dishwasher-front-600", "base-oven-600", "base-shelves-400"]);
  s.wypelnijSciane(p.id, sc, ["wall-shelves-800", "wall-shelves-600", "wall-hood-600", "wall-shelves-400"], 600);

  const a = s.analiza(p.id);
  assert.equal(a.projekt.moduly.length, 10);
  assert.ok(a.formatki.length > 60, `formatek: ${a.formatki.length}`);
  assert.equal(a.rozkroj.nierozmieszczone.length, 0);
  assert.ok(a.rozkroj.arkusze.length >= 2);
  assert.equal(a.walidacja.filter((u) => u.poziom === "blad").length, 0, JSON.stringify(a.walidacja));

  // Szafka 600 z szufladami: 3 fronty szuflad, 3 komplety prowadnic, skrzynki z płyty.
  const szuf = a.zbudowane.find((z) => z.modul.katalogId === "base-drawers-600")!;
  assert.equal(szuf.elementy.filter((e) => e.kod.startsWith("FRONT-SZ")).length, 3);
  assert.equal(szuf.elementy.filter((e) => e.rola === "drawerSide").length, 6);

  const [eco, std, prem, vip] = a.warianty;
  assert.ok(eco.cenaNetto < std.cenaNetto && std.cenaNetto < prem.cenaNetto && prem.cenaNetto < vip.cenaNetto, a.warianty.map((w) => w.cenaNetto).join(" < "));
  // Kaskada: zapas → narzut → marża → VAT (SilnikWycenyWariantowej)
  const u = s.ustawienia().finanse;
  const zap = std.kosztBazowyNetto * u.zapasKosztowyProcent / 100;
  const narz = (std.kosztBazowyNetto + zap) * u.narzutProcent / 100;
  const netto = (std.kosztBazowyNetto + zap + narz) * (1 + u.marzaProcent / 100);
  assert.ok(Math.abs(netto - std.cenaNetto) < 0.05);
  assert.ok(Math.abs(std.cenaBrutto - std.cenaNetto * 1.23) < 0.05);

  console.log(
    a.warianty.map((w) => `${w.nazwa}: ${w.cenaNetto.toFixed(2)} netto / ${w.cenaBrutto.toFixed(2)} brutto`).join("\n"),
    "\nArkusze:",
    a.rozkroj.podsumowanie.map((x) => `${x.materialOpis} ${x.gruboscMM}mm × ${x.liczbaArkuszy} (${x.wykorzystanieProcent}%)`).join("; "),
  );
});

test("usługi w wycenie: 70 zł netto za cięcie każdego arkusza i 8 zł netto za mb oklejania", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Usługi", sciany: [{ dlugoscMM: 3000 }] });
  s.wypelnijSciane(p.id, p.pomieszczenia[0].sciany[0].id, ["base-drawers-600", "base-shelves-800", "wall-shelves-600"]);
  const a = s.analiza(p.id);
  const arkusze = a.rozkroj.arkusze.length;
  const mb = a.obrzeza.reduce((x, o) => x + o.dlugoscNettoM, 0);
  for (const w of a.warianty) {
    const ciecie = w.pozycje.find((x) => x.nazwa === "Cięcie płyt")!;
    const okl = w.pozycje.find((x) => x.nazwa === "Oklejanie obrzeżem")!;
    assert.equal(ciecie.ilosc, arkusze);
    assert.equal(ciecie.kosztNetto, arkusze * 70);
    assert.ok(Math.abs(okl.ilosc - mb) < 0.01);
    assert.ok(Math.abs(okl.kosztNetto - mb * 8) < 0.05);
    assert.equal(ciecie.kategoria, "uslugi");
  }
  // Stawki z ustawień
  s.zmienUstawienia({ finanse: { cenaCieciaArkuszaNetto: 80 } });
  assert.equal(s.analiza(p.id).warianty[0].pozycje.find((x) => x.nazwa === "Cięcie płyt")!.kosztNetto, arkusze * 80);
});

test("minimalna wartość zlecenia dla pustego projektu", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Pusty" });
  const w = s.wycena(p.id, "standard").warianty[0];
  assert.equal(w.cenaNetto, 1500);
});

test("własny cennik ma priorytet nad ceną referencyjną i nie zmienia katalogu", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Cennik własny", sciany: [{ dlugoscMM: 1200 }] });
  s.dodajModul(p.id, { katalogId: "base-shelves-600" });
  const materialId = p.pomieszczenia[0].materialKorpusuId;
  const referencja = s.materialy().find((m) => m.id === materialId)!.cenaNetto;
  const przed = s.analiza(p.id).warianty[1].kosztMaterialowNetto;
  assert.equal(Object.keys(s.cennikMaterialow()).length, 0);
  s.zapiszCeneMaterialu(materialId, 1);
  const po = s.analiza(p.id).warianty[1].kosztMaterialowNetto;
  assert.equal(s.materialy().find((m) => m.id === materialId)!.cenaNetto, referencja);
  assert.ok(po < przed, `${po} nie jest mniejsze od ${przed}`);
  assert.equal(s.cennikMaterialow()[materialId].cenaNetto, 1);
  assert.throws(() => s.zapiszCeneMaterialu(materialId, 0), /Cena własna/);
  // Rabat katalogowy nie obniża ceny własnej (to już cena zakupu)
  s.zapiszMaterial({ id: materialId, rabatProcent: 50 });
  assert.equal(s.analiza(p.id).warianty[1].kosztMaterialowNetto, po);
  assert.ok(s.analiza(p.id).warianty[1].pozycje.some((x) => x.uwagi.includes("Twojego cennika")));
  s.zapiszMaterial({ id: materialId, rabatProcent: 0 });
  s.usunCeneMaterialu(materialId);
  assert.equal(Object.keys(s.cennikMaterialow()).length, 0);
});

test("kolizja modułów jest wykrywana", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Kolizja" });
  s.dodajModul(p.id, { katalogId: "base-shelves-600", pozycjaXMM: 0 });
  s.dodajModul(p.id, { katalogId: "base-shelves-600", pozycjaXMM: 300 });
  assert.ok(s.analiza(p.id).walidacja.some((u) => u.komunikat.startsWith("Kolizja")));
});

test("szafka narożna ślepa z LeMans: drzwi po lewej, komplet w wycenie, oferta PDF", async () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Narożnik", sciany: [{ dlugoscMM: 2400 }] });
  const sc = p.pomieszczenia[0].sciany[0].id;
  const m = s.dodajModul(p.id, {
    scianaId: sc,
    pozycjaXMM: 1200,
    nazwa: "Narożnik ślepy 120",
    kategoria: "corner",
    konstrukcja: "blindCorner",
    szerokoscMM: 1200,
    wysokoscMM: 720,
    glebokoscMM: 560,
    konfiguracja: { liczbaPolek: 0, liczbaDrzwi: 1, typFrontu: "drzwi", stronaDrzwiNaroznika: "lewa", systemNarozny: "lemans" },
  });
  const a = s.analiza(p.id);
  const z = a.zbudowane.find((q) => q.modul.id === m.id)!;
  assert.deepEqual(z.ostrzezenia, []);
  const drzwi = z.elementy.find((e) => e.kod === "FRONT-D01")!;
  const zaslepka = z.elementy.find((e) => e.kod === "ZASLEPKA")!;
  assert.equal(drzwi.x, 2);
  assert.equal(drzwi.szer, 450);
  assert.ok(zaslepka.x > drzwi.x + drzwi.szer, "zaślepka po stronie narożnika (prawej)");
  assert.equal(z.okucia.find((o) => o.profilID === "kessebohmer.lemans2")?.ilosc, 1);
  assert.equal(a.projektWyceny.liczbaSystemowNaroznych, 1);
  for (const w of a.warianty) assert.ok(w.pozycje.some((q) => /LeMans/.test(q.nazwa) && q.ilosc === 1 && q.kosztNetto > 1000), w.wariant);

  // Za wąska szafka → ostrzeżenie z instrukcji LeMans
  s.zmienModul(p.id, m.id, { szerokoscMM: 700 });
  assert.ok(s.analiza(p.id).zbudowane.find((q) => q.modul.id === m.id)!.ostrzezenia.some((o) => /800/.test(o)));

  const pdf = await s.ofertaPdf(p.id, { wariant: "premium" });
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
});

test("słupek: szuflady pod drzwiami z półką stałą, fronty w jednej linii z sąsiednim słupkiem", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Szafa", sciany: [{ dlugoscMM: 1200 }] });
  const sc = p.pomieszczenia[0].sciany[0].id;
  const baza = { scianaId: sc, kategoria: "tall" as const, konstrukcja: "shelves" as const, szerokoscMM: 600, wysokoscMM: 1800, glebokoscMM: 560, pozycjaYMM: 100 };
  const mix = s.dodajModul(p.id, { ...baza, pozycjaXMM: 0, konfiguracja: { typFrontu: "drzwi", liczbaDrzwi: 1, liczbaSzuflad: 2, liczbaPolek: 2, wysokoscSzufladyMM: 360 } });
  const sz = s.dodajModul(p.id, { ...baza, pozycjaXMM: 600, konfiguracja: { typFrontu: "szuflady", liczbaDrzwi: 0, liczbaSzuflad: 5, liczbaPolek: 0, wysokoscSzufladyMM: 360 } });
  const a = s.analiza(p.id);
  const m1 = a.zbudowane.find((z) => z.modul.id === mix.id)!;
  const m2 = a.zbudowane.find((z) => z.modul.id === sz.id)!;
  assert.deepEqual(m1.ostrzezenia, []);
  assert.equal(m1.elementy.filter((e) => e.kod.startsWith("FRONT-SZ")).length, 2);
  const drzwi = m1.elementy.find((e) => e.kod === "FRONT-D01")!;
  assert.equal(drzwi.y, 722);
  const stala = m1.elementy.find((e) => e.rola === "fixedShelf")!;
  assert.equal(stala.y + stala.wys, 720);
  for (const polka of m1.elementy.filter((e) => e.rola === "shelf")) assert.ok(polka.y > 720, "półki nastawne tylko nad szufladami");
  // Podział frontów: druga szuflada kończy się na tej samej wysokości co w słupku z 5 szufladami (±2 mm)
  const gora = (z: typeof m1, kod: string) => { const e = z.elementy.find((q) => q.kod === kod)!; return e.y + e.wys; };
  assert.ok(Math.abs(gora(m1, "FRONT-SZ02") - gora(m2, "FRONT-SZ02")) <= 2);
  // Półka stała łączona konfirmatami z bokami
  const d = s.dokumentacja(p.id);
  const c = d.czesci.find((q) => q.modulId === mix.id && q.kodElementu === "POLKA-STALA")!;
  assert.ok(c.operacje.some((o) => /Konfirmat/.test(o.przeznaczenie)));
});

test("słupek z piekarnikiem: szuflady w linii dolnych, półki stałe przy niszy, bez pleców za piekarnikiem", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Słupek AGD", sciany: [{ dlugoscMM: 600 }] });
  const sc = p.pomieszczenia[0].sciany[0].id;
  const m = s.dodajModul(p.id, {
    scianaId: sc, kategoria: "tall", konstrukcja: "ovenTower", szerokoscMM: 600, wysokoscMM: 2070, glebokoscMM: 560, pozycjaXMM: 0, pozycjaYMM: 100,
    konfiguracja: { typFrontu: "drzwi", liczbaDrzwi: 1, liczbaSzuflad: 2, liczbaPolek: 2, wysokoscSzufladyMM: 360 },
  });
  const z = s.analiza(p.id).zbudowane.find((q) => q.modul.id === m.id)!;
  assert.deepEqual(z.ostrzezenia, []);
  const el = (kod: string) => z.elementy.find((e) => e.kod === kod)!;
  assert.equal(el("POLKA-STALA").y + el("POLKA-STALA").wys, 720);
  assert.equal(el("POLKA-STALA-G").y - 720, 595, "światło niszy 595");
  assert.equal(el("FRONT-D01").y, 720 + 595 + 2);
  assert.equal(z.elementy.filter((e) => e.kod.startsWith("FRONT-SZ")).length, 2);
  for (const polka of z.elementy.filter((e) => e.rola === "shelf")) assert.ok(polka.y > 720 + 595 + 18);
  assert.ok(!el("PLECY"));
  assert.ok(el("PLECY-D").y + el("PLECY-D").wys <= 720);
  assert.ok(el("PLECY-G").y >= 720 + 595);
  const d = s.dokumentacja(p.id);
  const polkaG = d.czesci.find((q) => q.modulId === m.id && q.kodElementu === "POLKA-STALA-G")!;
  assert.ok(polkaG.operacje.some((o) => o.typ === "rowek"));

  // Wariant z mikrofalą nad piekarnikiem: półka stała między niszami, nisza mikrofali 362
  s.zmienModul(p.id, m.id, { konstrukcja: "ovenMicrowaveTower" });
  const z2 = s.analiza(p.id).zbudowane.find((q) => q.modul.id === m.id)!;
  assert.deepEqual(z2.ostrzezenia, []);
  const e2 = (kod: string) => z2.elementy.find((e) => e.kod === kod)!;
  assert.equal(e2("POLKA-STALA-M").y, 720 + 595);
  assert.equal(e2("POLKA-STALA-G").y - (e2("POLKA-STALA-M").y + 18), 362);
  assert.equal(e2("FRONT-D01").y, 720 + 595 + 18 + 362 + 2);
  assert.equal(z2.elementy.filter((e) => e.kod.startsWith("FRONT-SZ")).length, 2);
});

test("mikro CRM: etapy z historią, termin montażu i notatki robocze bez zmiany rewizji konstrukcji", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Temat", sciany: [{ dlugoscMM: 2000 }] });
  const rew = s.projekt(p.id).rewizja;
  s.zmienProjekt(p.id, { status: "wZamowieniu", terminMontazu: "2026-10-15" });
  s.zmienProjekt(p.id, { status: "produkcja" });
  const n = s.dodajNotatke(p.id, "  brakuje wkrętów 4×16  ");
  s.dodajNotatke(p.id, "zamówić zawiasy");
  s.zmienNotatke(p.id, n.id, { zalatwiona: true });
  const q = s.projekt(p.id);
  assert.equal(q.rewizja, rew, "CRM nie podbija rewizji konstrukcji");
  assert.deepEqual(q.historiaStatusow?.map((h) => h.status), ["wZamowieniu", "produkcja"]);
  assert.equal(q.terminMontazu, "2026-10-15");
  assert.equal(q.notatkiRobocze?.find((x) => x.id === n.id)?.tekst, "brakuje wkrętów 4×16");
  assert.ok(q.notatkiRobocze?.find((x) => x.id === n.id)?.zalatwiono);
  const skrot = s.projekty().find((x) => x.id === p.id)!;
  assert.equal(skrot.otwarteNotatki, 1);
  assert.equal(skrot.ostatniaNotatka, "zamówić zawiasy");
  assert.throws(() => s.zmienProjekt(p.id, { status: "xyz" as never }), /Nieznany status/);
  assert.throws(() => s.dodajNotatke(p.id, "  "), /pusta/);
  s.usunNotatke(p.id, n.id);
  assert.equal(s.projekt(p.id).notatkiRobocze?.length, 1);
  s.zmienProjekt(p.id, { terminMontazu: null });
  assert.equal(s.projekt(p.id).terminMontazu, undefined);
});

test("szkice dla klienta: ciąg dolny i wysoki z AGD projektu, kolejność ścian ciągu", async () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Szkic", sciany: [{ nazwa: "A", dlugoscMM: 3000 }, { nazwa: "B", dlugoscMM: 2400 }, { nazwa: "C", dlugoscMM: 3000 }, { nazwa: "D", dlugoscMM: 2400 }] });
  const [a, b, c] = p.pomieszczenia[0].sciany.map((x) => x.id);
  for (const sc of [a, b]) s.dodajModul(p.id, { scianaId: sc, kategoria: "base", konstrukcja: "drawers", szerokoscMM: 600, wysokoscMM: 720, glebokoscMM: 560, pozycjaXMM: 600, pozycjaYMM: 100 });
  s.dodajModul(p.id, { scianaId: c, kategoria: "tall", konstrukcja: "ovenMicrowaveTower", szerokoscMM: 600, wysokoscMM: 2070, glebokoscMM: 560, pozycjaXMM: 1200, pozycjaYMM: 100, konfiguracja: { typFrontu: "drzwi", liczbaDrzwi: 1, liczbaSzuflad: 2, wysokoscSzufladyMM: 360 } });
  assert.deepEqual(s.scianySzkicow(p.id), { dolne: ["A", "B"], wysokie: ["C"] });
  const bez = await s.szkicePdf(p.id);
  assert.equal(bez.subarray(0, 4).toString(), "%PDF");
  s.zmienProjekt(p.id, { agd: [{ rodzaj: "lodowka", model: "Bosch KFN96VPEA", szerMM: 905, wysMM: 1830, glMM: 736, odstepGoraMM: 300 }, { rodzaj: "piekarnik", model: "Electrolux EOF4P56X", szerMM: 594, wysMM: 589 }] });
  assert.equal(s.projekt(p.id).agd?.length, 2);
  const strony = (b: Buffer) => (b.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length;
  assert.equal(strony(await s.szkicePdf(p.id, { wysoki: false })), 3, "rzut + 2 ściany");
  assert.equal(strony(await s.szkicePdf(p.id, { dolny: false })), 2, "widok + rzut ściany C");
  assert.throws(() => s.zmienProjekt(p.id, { agd: [{ rodzaj: "lodowka", model: "" }] }), /model/);
  await assert.rejects(() => s.szkicePdf(p.id, { dolny: false, scianyWysokie: ["A"] }), /Brak szafek/);
});
