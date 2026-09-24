import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Magazyn } from "./store/store.js";
import { Stolarnia } from "./service.js";
import { schematUmowy, WARUNKI_UMOWY, ZAKRESY, type DaneUmowy } from "./core/contracts.js";
import { umowaPdf } from "./export/umowa.js";

const dane: DaneUmowy = { numer: "TEST/1", rodzaj: "kuchnia", klient: "Klient testowy", adresKlienta: "Adres testowy", firma: "Firma testowa", adresFirmy: "Adres firmy", nip: "1234567890", miejsce: "", adresMontazu: "Adres montażu", data: "", termin: "", cena: 29227.60, zaliczka: 14000, zaliczkaZaplacona: true, dataZaliczki: "", zakres: ZAKRESY.kuchnia, warunki: WARUNKI_UMOWY };
test("umowa przetrwa restart; zmiany projektu nie zmieniają dokumentu; kopia projektu nie dziedziczy umów", async () => {
  const dir = mkdtempSync(join(tmpdir(), "umowy-"));
  const s = new Stolarnia(new Magazyn(dir));const p = s.utworzProjekt({ nazwa: "Test" });
  assert.deepEqual(s.umowy(p.id), []);
  const u = s.dodajUmowe(p.id, dane);
  s.zmienProjekt(p.id, { klient: { nazwa: "Inny klient" } });
  const restart = new Stolarnia(new Magazyn(dir));
  assert.equal(restart.umowa(p.id, u.id).klient, dane.klient);
  assert.equal(restart.umowa(p.id, u.id).cena, 29227.60);
  assert.deepEqual(s.umowy(s.duplikujProjekt(p.id).id), []);
  assert.throws(() => s.dodajUmowe(p.id, dane), /numerze/);
  assert.throws(() => s.umowa(s.utworzProjekt({ nazwa: "Inny" }).id, u.id), /Nie znaleziono/);
  const pdf = await umowaPdf(u); assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
});
test("walidacja odrzuca błędne kwoty, daty i niepotwierdzone wpłaty", () => {
  for (const patch of [{ cena: -1 }, { cena: 1.001 }, { cena: Infinity }, { zaliczka: 99999 }, { data: "2026-02-30" }, { data: "2026-09-24", termin: "2026-09-23" }, { zaliczkaZaplacona: false, dataZaliczki: "2026-09-24" }, { klient: " " }]) {
    assert.equal(schematUmowy.safeParse({ ...dane, ...patch }).success, false, JSON.stringify(patch));
  }
  assert.equal(schematUmowy.safeParse({ ...dane, zaliczkaZaplacona: false }).success, true);
});
