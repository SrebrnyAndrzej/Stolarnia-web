import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

test("cena uzgodniona zmienia tylko Standard, zachowuje koszty i można ją usunąć", () => {
  const dir = mkdtempSync(join(tmpdir(), "agreed-price-"));
  const s = new Stolarnia(new Magazyn(dir));
  const p = s.utworzProjekt({ nazwa: "Test ceny" });
  const before = s.analiza(p.id);
  for (const value of [0, -1, 12.345, Infinity, NaN, "29227.60"]) {
    assert.throws(() => s.zmienProjekt(p.id, { cenaUzgodnionaBrutto: value as number }));
  }
  s.zmienProjekt(p.id, { cenaUzgodnionaBrutto: 29227.60 });
  const after = s.analiza(p.id);
  const a = after.warianty.find(w => w.wariant === "standard")!;
  const b = before.warianty.find(w => w.wariant === "standard")!;
  assert.equal(a.cenaBrutto, 29227.60);
  assert.equal(a.cenaKalkulowanaBrutto, b.cenaBrutto);
  assert.equal(Math.round((a.cenaNetto + a.vatKwota) * 100), 2922760);
  assert.deepEqual(a.pozycje, b.pozycje);
  assert.deepEqual(after.warianty.filter(w => w.wariant !== "standard"), before.warianty.filter(w => w.wariant !== "standard"));
  assert.equal(new Stolarnia(new Magazyn(dir)).projekt(p.id).cenaUzgodnionaBrutto, 29227.60);
  assert.equal(s.duplikujProjekt(p.id).cenaUzgodnionaBrutto, undefined);
  s.zmienProjekt(p.id, { cenaUzgodnionaBrutto: null });
  assert.deepEqual(s.analiza(p.id).warianty, before.warianty);
});
