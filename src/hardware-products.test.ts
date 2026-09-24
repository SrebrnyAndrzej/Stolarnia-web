import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PRODUKTY_OKUC } from "./core/catalog/hardware-products.js";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

test("katalog ma unikalne produkty trzech producentów, lokalne zdjęcia i źródła", () => {
  assert.equal(new Set(PRODUKTY_OKUC.map(p => p.id)).size, PRODUKTY_OKUC.length);
  for (const brand of ["Amix", "GTV", "Blum"]) assert.ok(PRODUKTY_OKUC.some(p => p.producent === brand));
  for (const p of PRODUKTY_OKUC) {
    // Indeks rodziny bez publicznego SKU jest dozwolony tylko z jawnym opisem braku — SKU nie jest wymyślane.
    if (p.rodzajSKU === "rodzina") assert.ok(p.sku || p.parametry["Zakres indeksu"], p.id);
    else assert.ok(p.sku, p.id);
    assert.ok(p.zrodloURL.startsWith("https://"));
    assert.ok(existsSync(join("docs/okucia/produkty/obrazy", p.zdjecieURL.split("/").at(-1)!)), p.id);
    assert.equal(p.zatwierdzoneProdukcyjnie, false);
    for (const d of p.dokumenty) assert.equal(new URL(d.url).protocol, "https:");
    if (p.producent === "GTV") {
      const length = p.sku.match(/KPL(\d{3})/)?.[1];
      // Rozbieżność symbolu i tabeli karty producenta musi być jawnie oznaczona (scripts/oznacz-konflikty-okuc.mjs).
      if (p.parametry["Długość [mm]"] !== length) assert.ok(p.parametry["Konflikt danych"]?.includes(length!), p.sku);
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
