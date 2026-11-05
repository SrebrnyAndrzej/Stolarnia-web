import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { Material, Okucie, PozycjaKosztowa, RaportRozkroju, ZapotrzebowanieObrzeza } from "./core/types.js";
import { grupujPoDostawcy, nowyStatus, zamowienieCSV, zeStatusami, zestawienieZamowienia, type PozycjaZamowienia } from "./core/zamowienie.js";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

// ST-APP-003: lista zamówienia dla dostawcy — agregacja z istniejących wyników, statusy pozycji, eksport.

const material = (id: string, producent: string, dekor: string, art?: string): Material => ({
  id, kod: `K-${id}`, nazwa: `Płyta ${dekor}`, producent, typ: "plytaLaminowana", dekor, gruboscMM: 18,
  szerokoscArkuszaMM: 2800, wysokoscArkuszaMM: 2070, jednostka: "metrKwadratowy", cenaNetto: 50, vatProcent: 23,
  rabatProcent: 0, aktywny: true, kierunekDekoru: false, kolorHEX: "#ffffff", notatki: "", ...(art ? { artykulProducenta: art } : {}),
});
const okucie = (id: string, producent: string, nazwa: string, sku?: string): Okucie => ({
  id, profilID: id, nazwa, producent, system: "S", typ: "zawias", jednostka: "szt.", cenaNetto: 10, rabatProcent: 0,
  vatProcent: 23, poziomWyceny: "standard", aktywne: true, opis: "", ...(sku ? { skuProducenta: sku } : {}),
});
const pozW = (nazwa: string, ilosc: number, x: Partial<PozycjaKosztowa> = {}): PozycjaKosztowa => ({
  nazwa, kategoria: "okucia", ilosc, jednostka: "szt.", cenaJednostkowaNetto: 1, kosztNetto: ilosc, uwagi: "", jestBledemWyceny: false, ...x,
});

function wejscie() {
  const egger = material("m1", "Egger", "Biały W1000", "1234567");
  const krono = material("m2", "Kronospan", "Dąb K001");
  const rozkroj: RaportRozkroju = {
    arkusze: [
      { numer: 1, materialId: "m1", materialOpis: "Egger W1000", gruboscMM: 18, kolorHEX: "#fff", szerokoscMM: 2070, dlugoscMM: 2800, polozenia: [], wykorzystanieProcent: 80 },
      { numer: 2, materialId: "m2", materialOpis: "Kronospan K001", gruboscMM: 18, kolorHEX: "#fff", szerokoscMM: 2070, dlugoscMM: 2800, polozenia: [], wykorzystanieProcent: 60 },
    ],
    nierozmieszczone: [],
    podsumowanie: [
      { materialId: "m1", materialOpis: "Egger W1000", gruboscMM: 18, liczbaArkuszy: 3, powierzchniaFormatekM2: 12.1, powierzchniaArkuszyM2: 17.388, wykorzystanieProcent: 70 },
      { materialId: "m2", materialOpis: "Kronospan K001", gruboscMM: 18, liczbaArkuszy: 1, powierzchniaFormatekM2: 3, powierzchniaArkuszyM2: 5.796, wykorzystanieProcent: 52 },
    ],
  };
  const obrzeza: ZapotrzebowanieObrzeza[] = [{ rodzaj: "abs20", materialId: "m1", opis: "ABS 2,0 mm — Egger W1000", liczbaKrawedzi: 20, dlugoscNettoM: 30, dlugoscZakupuM: 34.567 }];
  const okucia = [okucie("o1", "Blum", "Zawias Clip top", "71B3550"), okucie("o2", "GTV", "Prowadnica")];
  const pozycje = [
    pozW("Zawias Clip top", 8, { okucieId: "o1", typOkucia: "zawias" }),
    pozW("Zawias Clip top", 4, { okucieId: "o1", typOkucia: "zawias" }),
    pozW("Prowadnica", 3, { okucieId: "o2", typOkucia: "prowadnica" }),
    pozW("Nogi meblowe", 16, { typOkucia: "noga" }),
    pozW("Obrzeże ABS", 35, { typOkucia: "obrzeze", okucieId: "o9" }),
    pozW("Wkręty", 0, { kategoria: "akcesoria", typOkucia: "wkret" }),
    pozW("Produkcja", 10, { kategoria: "robocizna" }),
  ];
  return { rozkroj, obrzeza, pozycjeWyceny: pozycje, materialy: new Map([egger, krono].map((m) => [m.id, m])), okucia };
}

test("zestawienie: płyty z rozkroju, obrzeża z zapasem, okucia z kosztorysu (scalone, bez obrzeża i robocizny)", () => {
  const z = zestawienieZamowienia(wejscie());
  const klucze = z.map((p) => p.klucz);
  assert.deepEqual(klucze, ["plyta|m1|18", "plyta|m2|18", "obrzeze|abs20|m1", "okucie|o1", "okucie|o2", "okucie|dobor|Nogi meblowe"]);
  const p1 = z[0];
  assert.equal(p1.ilosc, 3);
  assert.equal(p1.jednostka, "ark.");
  assert.equal(p1.m2, 17.39);
  assert.equal(p1.kod, "1234567", "artykuł producenta ma pierwszeństwo przed kodem wewnętrznym");
  assert.equal(p1.producent, "Egger");
  assert.equal(p1.format, "2800 × 2070");
  assert.equal(z[1].kod, "K-m2", "bez artykułu — kod materiału");
  const obrz = z[2];
  assert.equal(obrz.ilosc, 34.57, "mb zakupu z naddatkiem i zapasem");
  assert.equal(obrz.nettoM, 30);
  const zawias = z.find((p) => p.klucz === "okucie|o1")!;
  assert.equal(zawias.ilosc, 12, "dwie pozycje tego samego okucia scalone");
  assert.equal(zawias.kod, "71B3550");
  assert.equal(z.find((p) => p.klucz === "okucie|o2")!.kod, undefined, "okucie bez SKU → BRAK KODU");
  const nogi = z.find((p) => p.klucz.startsWith("okucie|dobor"))!;
  assert.equal(nogi.producent, "");
  assert.match(nogi.uwagi.join(" "), /Dobór domyślny/);
});

test("statusy: do zamówienia → zamówione → częściowo → dostarczone; niedozwolone przejścia odrzucone", () => {
  const poz = zestawienieZamowienia(wejscie())[0] as PozycjaZamowienia;
  const t = new Date("2026-11-02T10:00:00Z");
  assert.throws(() => nowyStatus(poz, undefined, { stan: "dostarczone" }, t), /Nie można zmienić stanu/);
  const zam = nowyStatus(poz, undefined, { stan: "zamowione", dostawca: "Hurtownia Płyt Sp. z o.o." }, t);
  assert.equal(zam.dataZamowienia, "2026-11-02");
  assert.equal(zam.iloscZamowiona, 3);
  assert.equal(zam.dostawca, "Hurtownia Płyt Sp. z o.o.");
  assert.throws(() => nowyStatus(poz, zam, { stan: "czesciowo" }, t), /dostarczoną ilość/);
  assert.throws(() => nowyStatus(poz, zam, { stan: "czesciowo", iloscDostarczona: 3 }, t), /mniejszą od zamówionej/);
  assert.throws(() => nowyStatus(poz, zam, { stan: "zamowione", data: "2.11.2026" }, t), /RRRR-MM-DD/);
  const cz = nowyStatus(poz, zam, { stan: "czesciowo", iloscDostarczona: 2, data: "2026-11-05" }, t);
  assert.equal(cz.iloscDostarczona, 2);
  assert.equal(cz.dataDostawy, "2026-11-05");
  assert.equal(cz.dataZamowienia, "2026-11-02", "data zamówienia zostaje");
  const dost = nowyStatus(poz, cz, { stan: "dostarczone", data: "2026-11-06" }, t);
  assert.equal(dost.dataDostawy, "2026-11-06");
  assert.equal(dost.iloscDostarczona, undefined);
  assert.equal(dost.dostawca, "Hurtownia Płyt Sp. z o.o.", "dostawca zostaje");
  const brak = nowyStatus(poz, zam, { stan: "brak", uwagi: "termin 3 tyg." }, t);
  const ponownie = nowyStatus(poz, brak, { stan: "zamowione", data: "2026-11-10" }, t);
  assert.equal(ponownie.dataZamowienia, "2026-11-10", "ponowne zamówienie po braku ma nową datę");
  const cofniete = nowyStatus(poz, zam, { stan: "doZamowienia" }, t);
  assert.equal(cofniete.dataZamowienia, undefined);
  assert.equal(nowyStatus(poz, zam, { stan: "zamowione", dostawca: null }, t).dostawca, undefined, "pusty dostawca usuwa wpis");
});

test("statusy przy zestawieniu: domyślnie do zamówienia, domówienie po wzroście ilości, pozycje nieaktualne", () => {
  const poz = zestawienieZamowienia(wejscie());
  const t = new Date("2026-11-02T10:00:00Z");
  const zam = nowyStatus({ ...poz[0], ilosc: 2 }, undefined, { stan: "zamowione" }, t);
  const stary = nowyStatus(poz[1], undefined, { stan: "zamowione" }, t);
  const { pozycje, nieaktualne } = zeStatusami(poz, { pozycje: { "plyta|m1|18": zam, "plyta|stary|18": stary, "plyta|nic|18": { stan: "doZamowienia", zmieniono: "" } } });
  assert.equal(pozycje[1].status.stan, "doZamowienia");
  assert.equal(pozycje[0].status.stan, "zamowione");
  assert.equal(pozycje[0].doDomowienia, 1, "zamówiono 2 arkusze, projekt potrzebuje 3");
  assert.deepEqual(nieaktualne.map((n) => n.klucz), ["plyta|stary|18"], "pozycje „do zamówienia” spoza zestawienia nie są ostrzeżeniem");
});

test("grupowanie i CSV: dostawca ręczny > producent > „Bez dostawcy”; BRAK KODU; średnik i przecinek dziesiętny", () => {
  const poz = zestawienieZamowienia(wejscie());
  const t = new Date("2026-11-02T10:00:00Z");
  const { pozycje } = zeStatusami(poz, { pozycje: { "okucie|o2": nowyStatus(poz[4], undefined, { stan: "zamowione", dostawca: "Merkury AM" }, t) } });
  assert.deepEqual(grupujPoDostawcy(pozycje).map((g) => g.dostawca), ["Blum", "Egger", "Kronospan", "Merkury AM", "Bez dostawcy"]);
  const csv = zamowienieCSV(pozycje);
  const wiersze = csv.split("\r\n");
  assert.match(wiersze[0], /^Dostawca;Rodzaj;Producent;Kod \/ SKU;Nazwa/);
  assert.equal(wiersze.length, 1 + pozycje.length);
  assert.ok(wiersze.some((w) => w.startsWith("Merkury AM;Okucie;GTV;BRAK KODU;Prowadnica;") && w.includes(";zamówione;2026-11-02;")));
  assert.ok(wiersze.some((w) => w.startsWith("Egger;Obrzeże;Egger;BRAK KODU;") && w.includes(";34,57;mb;")));
  assert.ok(wiersze.some((w) => w.startsWith("Egger;Płyta;Egger;1234567;") && w.includes(";17,39;do zamówienia;")));
});

test("usługa: zestawienie z bieżącej rewizji = analiza; status nie podbija rewizji; wydanie zamraża ilości", async () => {
  const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "zamowienie-"))));
  const p = s.utworzProjekt({ nazwa: "Z", sciany: [{ dlugoscMM: 3000 }] });
  const m = s.dodajModul(p.id, { katalogId: "base-drawers-600" });
  s.dodajModul(p.id, { katalogId: "base-drawers-600" });

  const z = s.zamowienie(p.id);
  assert.equal(z.zrodlo.rodzaj, "rewizja");
  assert.match(z.ostrzezenia.join(" "), /nie ma wydania/);
  const a = s.analiza(p.id);
  const plyty = z.pozycje.filter((x) => x.rodzaj === "plyta");
  assert.equal(plyty.length, a.rozkroj.podsumowanie.length);
  assert.equal(plyty.reduce((sum, x) => sum + x.ilosc, 0), a.rozkroj.arkusze.length, "liczba arkuszy z rozkroju");
  const obrz = z.pozycje.filter((x) => x.rodzaj === "obrzeze");
  assert.deepEqual(obrz.map((x) => x.ilosc), a.obrzeza.map((o) => o.dlugoscZakupuM));
  const standard = a.warianty.find((w) => w.wariant === "standard")!;
  const sumaOkucKosztorys = standard.pozycje.filter((x) => (x.kategoria === "okucia" || x.kategoria === "akcesoria") && x.typOkucia !== "obrzeze").reduce((sum, x) => sum + x.ilosc, 0);
  const sumaOkucLista = z.pozycje.filter((x) => x.rodzaj === "okucie").reduce((sum, x) => sum + x.ilosc, 0);
  assert.ok(Math.abs(sumaOkucKosztorys - sumaOkucLista) < 1e-6, "ilości okuć jak w kosztorysie Standard");
  assert.ok(z.pozycje.every((x) => !("cenaNetto" in x) && !("kosztNetto" in x)), "lista bez cen");

  const rew = s.projekt(p.id).rewizja;
  const klucz = plyty[0].klucz;
  const zm = s.zmienStatusZamowienia(p.id, { klucz, stan: "zamowione", data: "2026-11-03", dostawca: "Hurtownia X" });
  assert.equal(zm.status.iloscZamowiona, plyty[0].ilosc);
  assert.equal(s.projekt(p.id).rewizja, rew, "status zamówienia nie podbija rewizji");
  assert.throws(() => s.zmienStatusZamowienia(p.id, { klucz: "plyta|nie-ma|18", stan: "zamowione" }), /Nie ma pozycji/);
  s.zmienStatusZamowienia(p.id, { klucz, stan: "doZamowienia" });
  assert.equal(s.zamowienie(p.id).pozycje.find((x) => x.klucz === klucz)!.status.stan, "doZamowienia", "cofnięcie pomyłki zapisane");
  assert.throws(() => s.zmienStatusZamowienia(p.id, { klucz, stan: "dostarczone" }), (e: Error) => e.constructor.name === "BladUslugi" && /Nie można zmienić stanu/.test(e.message));

  // Wydanie: zestawienie domyślnie z ostatniego wydania; zmiana projektu po wydaniu go nie zmienia.
  const w = s.utworzWydanie(p.id);
  const zw = s.zamowienie(p.id);
  assert.equal(zw.zrodlo.rodzaj, "wydanie");
  assert.equal(zw.zrodlo.numer, w.numer);
  const przed = JSON.stringify(zw.pozycje.map((x) => [x.klucz, x.ilosc]));
  s.zmienModul(p.id, m.id, { szerokoscMM: 900 });
  s.dodajModul(p.id, { katalogId: "base-drawers-600" });
  const zPo = s.zamowienie(p.id);
  assert.equal(JSON.stringify(zPo.pozycje.map((x) => [x.klucz, x.ilosc])), przed, "ilości z wydania bez zmian");
  assert.match(zPo.ostrzezenia.join(" "), /zmienił się po wydaniu/);
  const biezaca = s.zamowienie(p.id, { wydanie: "biezaca" });
  assert.equal(biezaca.zrodlo.rodzaj, "rewizja");
  assert.notEqual(JSON.stringify(biezaca.pozycje.map((x) => [x.klucz, x.ilosc])), przed, "bieżąca rewizja widzi zmianę");

  const csv = s.zamowienieCSV(p.id);
  assert.ok(csv.startsWith("﻿Dostawca;"), "BOM dla Excela");
  const pdf = await s.zamowieniePdf(p.id);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.length > 3000);
  assert.equal(s.duplikujProjekt(p.id).zamowienie, undefined, "kopia projektu bez statusów zamówienia");
});
