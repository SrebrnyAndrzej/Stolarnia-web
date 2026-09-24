import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PRODUKTY_OKUC } from "./core/catalog/hardware-products.js";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

test("katalog: unikalne produkty, źródła, zdjęcia lokalne, indeksy bez zgadywania", () => {
  assert.equal(new Set(PRODUKTY_OKUC.map(p => p.id)).size, PRODUKTY_OKUC.length);
  for (const brand of ["Amix", "GTV", "Blum"]) assert.ok(PRODUKTY_OKUC.some(p => p.producent === brand));
  for (const p of PRODUKTY_OKUC) {
    // Indeks rodziny bez publicznego SKU jest dozwolony tylko z jawnym opisem braku — SKU nie jest wymyślane.
    if (p.rodzajSKU === "rodzina") assert.ok(p.sku || p.parametry["Zakres indeksu"], p.id);
    else if (p.rodzajSKU === "dystrybutor") assert.ok(p.symbolDystrybutora && p.zrodloTyp === "dystrybutor", p.id);
    else assert.ok(p.sku, p.id);
    assert.ok(p.zrodloURL.startsWith("https://"));
    if (p.zdjecieURL) assert.ok(existsSync(join("docs/okucia/produkty/obrazy", p.zdjecieURL.split("/").at(-1)!)), p.id);
    assert.equal(p.zatwierdzoneProdukcyjnie, false);
    for (const d of p.dokumenty) assert.ok(["https:", "http:"].includes(new URL(d.url).protocol), d.url);
    if (p.ean) assert.match(p.ean, /^\d{8,14}$/, p.id);
    if (p.producent === "GTV") {
      const length = p.sku.match(/KPL(\d{3})/)?.[1];
      // Rozbieżność symbolu i tabeli karty producenta musi być jawnie oznaczona (scripts/oznacz-konflikty-okuc.mjs).
      if (length && p.parametry["Długość [mm]"] !== length) assert.ok(p.parametry["Konflikt danych"]?.includes(length), p.sku);
    }
  }
});

test("dodanie SKU wymaga ceny, zachowuje istniejące ceny i nie zmienia wyceny projektu", () => {
  const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "hardware-products-"))));
  const p = s.utworzProjekt({ nazwa: "Test" });
  s.dodajModul(p.id, { katalogId: "base-drawers-600", scianaId: p.pomieszczenia[0].sciany[0].id });
  const before = s.analiza(p.id).warianty;
  const prod = PRODUKTY_OKUC.find(p => p.rodzajSKU === "wariant")!;
  const family = PRODUKTY_OKUC.find(p => p.rodzajSKU === "rodzina")!;
  for (const price of [0, -1, NaN, Infinity, 1.001]) assert.throws(() => s.dodajProduktOkucia(prod.id, price));
  assert.throws(() => s.dodajProduktOkucia(family.id, 100));
  const added = s.dodajProduktOkucia(prod.id, 89.99);
  assert.equal(added.skuProducenta, prod.sku);
  assert.equal(s.dodajProduktOkucia(prod.id, 200).cenaNetto, 89.99);
  assert.equal(s.okucia().filter(o => o.id === added.id).length, 1);
  assert.deepEqual(s.analiza(p.id).warianty, before);
});

test("katalog okuć po stronie serwera: filtr kategorii, stronicowanie, liczniki, typ okucia z kategorii", () => {
  const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "hardware-katalog-"))));
  const wszystko = s.katalogOkuc({ ile: 10 });
  assert.equal(wszystko.razem, PRODUKTY_OKUC.length);
  assert.equal(wszystko.produkty.length, Math.min(10, PRODUKTY_OKUC.length));
  const kat = Object.keys(wszystko.kategorie).find((k) => k !== "szuflady") ?? "szuflady";
  const wKat = s.katalogOkuc({ kategoria: kat, ile: 200 });
  assert.ok(wKat.produkty.every((p) => (p.kategoria ?? "szuflady") === kat));
  assert.equal(wKat.razem, wszystko.kategorie[kat]);
  const druga = s.katalogOkuc({ kategoria: kat, od: 1, ile: 1 });
  if (wKat.razem > 1) assert.equal(druga.produkty[0].id, wKat.produkty[1].id);
  // Pozycja z indeksem producenta trafia do cennika z typem okucia wynikającym z kategorii
  const zawias = PRODUKTY_OKUC.find((p) => p.kategoria === "zawiasy" && p.rodzajSKU === "wariant");
  if (zawias) assert.equal(s.dodajProduktOkucia(zawias.id, 5).typ, "zawias");
});
