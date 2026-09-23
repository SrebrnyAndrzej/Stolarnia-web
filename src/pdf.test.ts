import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";
import { dokumentacjaPdf } from "./export/pdf.js";

const strony = (b: Buffer) => b.toString("latin1").match(/\/Type \/Page[^s]/g)?.length ?? 0;
function projekt() {
  const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "stolarnia-pdf-"))));
  const p = s.utworzProjekt({ nazwa: "Odbiór PDF", sciany: [{ dlugoscMM: 3000 }] });
  const moduly = s.wypelnijSciane(p.id, p.pomieszczenia[0].sciany[0].id, ["base-shelves-800", "base-drawers-600"]);
  return { s, p, moduly };
}

test("PDF pełny zawiera rysunek każdej części, także części bez wierceń i niezatwierdzonych", async () => {
  const { s, p, moduly } = projekt();
  const d = s.dokumentacja(p.id);
  const rewizja = s.projekt(p.id).rewizja;
  let wszystkie = 0;
  for (const m of moduly) {
    let rysunki = 0;
    for (const c of d.czesci.filter((x) => x.modulId === m.id)) {
      rysunki += strony(await s.dokumentacjaPdf(p.id, { czesci: [c.id] }));
    }
    assert.ok(rysunki >= d.czesci.filter((x) => x.modulId === m.id).length);
    const skrot = strony(await s.dokumentacjaPdf(p.id, { moduly: [m.id], skrocony: true }));
    const pelny = strony(await s.dokumentacjaPdf(p.id, { moduly: [m.id] }));
    assert.equal(pelny, skrot + rysunki, "filtr szafki obejmuje dokładnie jej części");
    wszystkie += rysunki;
  }
  assert.equal(strony(await s.dokumentacjaPdf(p.id)), strony(await s.dokumentacjaPdf(p.id, { skrocony: true })) + wszystkie);
  assert.equal(s.projekt(p.id).rewizja, rewizja, "eksport nie zmienia projektu");
  assert.equal(strony(await s.dokumentacjaPdf(p.id, { moduly: ["nieistniejaca"] })), 1);
});

test("PDF: cztery krawędzie dostają osobny rysunek, długie uwagi kontynuację", async () => {
  const { s, p } = projekt();
  const a = s.analiza(p.id), d = s.dokumentacja(p.id);
  const c = d.czesci.find((x) => x.operacje.length > 0)!;
  const op = c.operacje[0];
  c.operacje = (["DA", "DB", "KA", "KB"] as const).map((powierzchnia, i) => ({ ...op, id: `edge-${i}`, powierzchnia, x: 50, y: c.gruboscMM / 2 }));
  c.bezWiercen = false;
  const wejscie = { projekt: a.projekt, zbudowane: a.zbudowane, dokumentacja: d, tylkoCzesci: [c.id] };
  const zKrawedziami = strony(await dokumentacjaPdf(wejscie));
  c.operacje = c.operacje.map((o) => ({ ...o, powierzchnia: "A" }));
  assert.equal(zKrawedziami, strony(await dokumentacjaPdf(wejscie)) + 1);
  c.uwagi = Array.from({ length: 100 }, (_, i) => `Uwaga ${i + 1}: zachowaj wszystkie informacje o obróbce oraz montażu.`);
  assert.ok(strony(await dokumentacjaPdf(wejscie)) > zKrawedziami, "uwagi nie są obcinane do ostatniej strony tabeli");
});
