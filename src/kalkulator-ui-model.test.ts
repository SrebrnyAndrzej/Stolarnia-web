import assert from "node:assert/strict";
import { test } from "node:test";
import { bledyFormularza, DOMYSLNY_FORMULARZ, parametryKalkulatora, przywrocFormularz } from "../web/src/views/szuflady/model.js";

test("UI: front zewnętrzny i wewnętrzny mają niezależne wymiary i otwory", () => {
  const f = { ...DOMYSLNY_FORMULARZ, frontZewSzer: "598", frontWewSzer: "528", frontWewWys: "250", otworZew: "60", otworWew: "65" };
  const zew = new URLSearchParams(parametryKalkulatora(f)!);
  assert.equal(zew.get("szerokoscFrontu"), "598");
  assert.equal(zew.get("pierwszyOtworOdDolu"), "60");
  assert.equal(zew.get("wysokoscFrontu"), "357");
  assert.equal(zew.has("frontZaDrzwiami"), false);
  const wew = new URLSearchParams(parametryKalkulatora({ ...f, typFrontu: "wewnetrzny", stronaZawiasow: "prawa", wystawanie: "30" })!);
  assert.equal(wew.get("szerokoscFrontu"), "528");
  assert.equal(wew.get("pierwszyOtworOdDolu"), "65");
  assert.equal(wew.get("wysokoscFrontu"), "250");
  assert.equal(wew.get("LW"), "564"); // pierwotne światło; dystans odejmuje wspólny silnik
  assert.equal(wew.get("frontZaDrzwiami"), "true");
  assert.equal(wew.get("wystawanieZawiasuLewe"), "0");
  assert.equal(wew.get("wystawanieZawiasuPrawe"), "30");
});

test("UI: front zlicowany nie włącza dystansu, pola rozstawu nie wpływają na pojedynczą szufladę", () => {
  const q = new URLSearchParams(parametryKalkulatora({ ...DOMYSLNY_FORMULARZ, typFrontu: "wewnetrzny", montazWewnetrzny: "zlicowany", dolna: "-100" })!);
  assert.equal(q.get("frontWewnetrzny"), "true");
  assert.equal(q.has("frontZaDrzwiami"), false);
  assert.equal(q.get("gruboscFrontu"), "18");
  assert.equal(q.get("liczbaSzuflad"), "1");
  assert.equal(q.get("dolnaProwadnica"), "3");
});

test("UI: przecinek dziesiętny, walidacja i minima bez dopisywania fikcyjnych wierceń", () => {
  const q = new URLSearchParams(parametryKalkulatora({ ...DOMYSLNY_FORMULARZ, otworZew: "49,5", frontZewSzer: "598,5" })!);
  assert.equal(q.get("pierwszyOtworOdDolu"), "49.5");
  assert.equal(q.get("szerokoscFrontu"), "598.5");
  const pusty = new URLSearchParams(parametryKalkulatora(DOMYSLNY_FORMULARZ)!);
  assert.equal(pusty.has("pierwszyOtworOdDolu"), false);
  assert.equal(pusty.has("szerokoscFrontu"), false);
  assert.equal(parametryKalkulatora({ ...DOMYSLNY_FORMULARZ, lw: "" }), null);
  assert.ok(bledyFormularza({ ...DOMYSLNY_FORMULARZ, otworZew: "49" }, 49.5).otworZew);
  assert.ok(bledyFormularza({ ...DOMYSLNY_FORMULARZ, nl: "Infinity" }).nl);
});

test("UI: odzyskiwanie formularza odrzuca nieznane typy i zachowuje wymiary obu frontów", () => {
  const f = przywrocFormularz({ frontZewSzer: "598", frontWewSzer: "528", typFrontu: "zly", rozstaw: "true", lw: 123 });
  assert.equal(f.frontZewSzer, "598"); assert.equal(f.frontWewSzer, "528");
  assert.equal(f.typFrontu, "zewnetrzny"); assert.equal(f.rozstaw, false); assert.equal(f.lw, "564");
  assert.deepEqual(przywrocFormularz(null), DOMYSLNY_FORMULARZ);
});
