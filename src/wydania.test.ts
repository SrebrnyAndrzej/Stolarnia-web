import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { jsonBezMigawek, Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

// P03: wydanie produkcyjne zamrożone w konkretnej rewizji.

test("wydanie zamraża dokumentację: zmiany projektu i ustawień nie zmieniają wydania", async () => {
  const store = new Magazyn(mkdtempSync(join(tmpdir(), "wydania-")));
  const s = new Stolarnia(store);
  const p = s.utworzProjekt({ nazwa: "W", sciany: [{ dlugoscMM: 3000 }] });
  const m = s.dodajModul(p.id, { katalogId: "base-drawers-600", konfiguracja: { szufladySystemowe: true, profilSzuflad: "amix-elite-standard" } });
  const rew = s.projekt(p.id).rewizja;
  const w = s.utworzWydanie(p.id, { notatka: "pierwsze" });
  assert.equal(w.numer, 1);
  assert.equal(w.rewizja, rew);
  assert.equal(s.projekt(p.id).rewizja, rew, "wydanie nie podbija rewizji");
  assert.equal(w.gotowaDoProdukcji, false, "braki danych → wydanie robocze");
  assert.throws(() => s.utworzWydanie(p.id, { tylkoKompletne: true }), /wstrzymane/);

  const dokPrzed = JSON.stringify(s.wydanieDokumentacja(p.id, w.id));
  const csvPrzed = s.formatkiCSV(p.id, w.id);
  const zakupyPrzed = JSON.stringify(s.zamowienie(p.id, { wydanie: w.id }).pozycje);
  const pdfPrzed = await s.wydaniePdf(p.id, "1");
  assert.ok(pdfPrzed.pdf.length > 10000);

  // Zmiany po wydaniu: wymiar modułu, system szuflad, technologia zakładu.
  s.zmienModul(p.id, m.id, { szerokoscMM: 800, konfiguracja: { profilSzuflad: "blum-legrabox-m-wood" } });
  s.zmienUstawienia({ technologia: { konfirmatOdKrawedziMM: 60 } });
  store.zmien((b) => {
    b.materialy.forEach((m) => { m.nazwa = `Zmieniony katalog ${m.nazwa}`; });
    b.okucia.forEach((o) => { o.nazwa = `Zmieniony katalog ${o.nazwa}`; });
  });
  assert.equal(s.formatkiCSV(p.id, w.id), csvPrzed, "CSV wydania zgodne z jego dokumentacją");
  assert.notEqual(s.formatkiCSV(p.id), csvPrzed, "CSV bieżące uwzględnia zmianę wymiaru");
  assert.equal(JSON.stringify(s.zamowienie(p.id, { wydanie: w.id }).pozycje), zakupyPrzed, "zamrożone pozycje i kody zakupów");
  assert.notEqual(JSON.stringify(s.dokumentacja(p.id).czesci.map((c) => c.dlugoscMM)), JSON.stringify(JSON.parse(dokPrzed).czesci.map((c: { dlugoscMM: number }) => c.dlugoscMM)));
  assert.equal(JSON.stringify(s.wydanieDokumentacja(p.id, w.id)), dokPrzed, "dokumentacja wydania bez zmian");

  const w2 = s.utworzWydanie(p.id);
  assert.equal(w2.numer, 2);
  assert.equal(s.wydania(p.id).length, 2);
  assert.ok(s.wydania(p.id).every((x) => !("dane" in x)));

  // Odpowiedzi API/MCP nie niosą migawek.
  const json = jsonBezMigawek(s.projekt(p.id));
  assert.ok(!json.includes('"dane"'));
  assert.ok(json.includes('"wydania"'));

  // Kopia projektu zaczyna bez wydań.
  assert.equal(s.duplikujProjekt(p.id).wydania?.length, 0);
});
