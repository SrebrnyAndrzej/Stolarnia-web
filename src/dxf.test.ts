import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { scianyNaRzucie } from "./core/geometry.js";
import { Magazyn } from "./store/store.js";
import { Stolarnia } from "./service.js";

/** Minimalny DXF: LWPOLYLINE na warstwie ŚCIANY (w metrach) + LINE na warstwie MEBLE. */
function dxfL(): string {
  const naglowek = ["0", "SECTION", "2", "HEADER", "9", "$INSUNITS", "70", "6", "0", "ENDSEC"];
  const poli = [
    "0", "LWPOLYLINE", "8", "SCIANY", "90", "4", "70", "0",
    "10", "0", "20", "0",
    "10", "3.6", "20", "0",
    "10", "3.6", "20", "-2.4",
    "10", "3.3", "20", "-2.4",
  ];
  const linia = ["0", "LINE", "8", "MEBLE", "10", "0.5", "20", "-0.5", "11", "1.1", "21", "-0.5"];
  return [...naglowek, "0", "SECTION", "2", "ENTITIES", ...poli, ...linia, "0", "ENDSEC", "0", "EOF"].join("\n");
}

test("import DXF: warstwy, jednostki (m→mm), łańcuch ścian", () => {
  const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "stolarnia-dxf-"))));
  const a = s.analizaDxf(dxfL());
  assert.equal(a.jednostka, "m");
  assert.deepEqual(a.warstwy.map((w) => w.nazwa), ["SCIANY", "MEBLE"]);

  const p = s.utworzProjekt({ nazwa: "Z CAD" });
  const r = s.importujDxf(p.id, dxfL(), { warstwa: "SCIANY", nazwa: "Kuchnia L" });
  const dl = r.pomieszczenie.sciany.map((x) => x.dlugoscMM);
  assert.deepEqual(dl, [3600, 2400, 300]);

  // Normalne do wnętrza: pierwsza ściana (górna na rzucie) ma wnętrze w dół (+Y po odbiciu osi).
  const rzut = scianyNaRzucie(r.pomieszczenie);
  assert.ok(Math.abs(rzut[0].ny - 1) < 1e-9, JSON.stringify(rzut[0]));
  assert.ok(Math.abs(rzut[1].nx + 1) < 1e-9, JSON.stringify(rzut[1]));

  // Moduły można stawiać na zaimportowanej ścianie.
  const m = s.dodajModul(p.id, { katalogId: "base-shelves-600", scianaId: r.pomieszczenie.sciany[1].id });
  assert.equal(m.pozycjaXMM, 0);
});

test("DWG: rozpoznany po nagłówku, bez konwertera czytelny błąd; DXF z bufora przechodzi", async () => {
  const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "stolarnia-dwg-"))));
  const stary = { oda: process.env.STOLARNIA_ODA, lib: process.env.STOLARNIA_DWG2DXF, path: process.env.PATH };
  process.env.PATH = "";
  delete process.env.STOLARNIA_ODA;
  delete process.env.STOLARNIA_DWG2DXF;
  try {
    const dwg = Buffer.concat([Buffer.from("AC1032"), Buffer.alloc(100)]);
    await assert.rejects(s.trescCad(dwg), /DWG \(2018\+\) wymaga konwertera/);
  } finally {
    process.env.PATH = stary.path;
    if (stary.oda) process.env.STOLARNIA_ODA = stary.oda;
    if (stary.lib) process.env.STOLARNIA_DWG2DXF = stary.lib;
  }
  const tresc = await s.trescCad(Buffer.from(dxfL(), "utf8"));
  assert.equal(s.analizaDxf(tresc).sciany.length, 3);
});

test("domyślne ściany łączą się pod kątem 90° z wnętrzem po prawej", () => {
  const rzut = scianyNaRzucie({ sciany: [{ id: "a", nazwa: "A", dlugoscMM: 3000, wysokoscMM: 2600 }, { id: "b", nazwa: "B", dlugoscMM: 2000, wysokoscMM: 2600 }] });
  assert.deepEqual([rzut[1].x1, rzut[1].y1, rzut[1].x2, rzut[1].y2], [3000, 0, 3000, 2000]);
  assert.equal(rzut[0].ny, 1);
  assert.equal(rzut[1].nx, -1);
});
