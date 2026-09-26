import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { scianyNaRzucie } from "./core/geometry.js";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

test("wyspa: dwie wirtualne linie plecami do siebie i jeden blat na wymiar nad oboma rzędami", () => {
  const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "wyspa-"))));
  const p = s.utworzProjekt({
    nazwa: "Stół",
    sciany: [
      { nazwa: "A", dlugoscMM: 1200, wysokoscMM: 1000, x1: 0, y1: 0, x2: 1200, y2: 0, wirtualna: true },
      { nazwa: "B", dlugoscMM: 1200, wysokoscMM: 1000, x1: 1200, y1: 0, x2: 0, y2: 0, wirtualna: true },
    ],
  });
  const [A, B] = p.pomieszczenia[0].sciany;
  assert.ok(A.wirtualna && B.wirtualna);
  const rzut = scianyNaRzucie(p.pomieszczenia[0]);
  assert.equal(rzut[0].ny, -rzut[1].ny, "rzędy skierowane przeciwnie");

  const baza = { kategoria: "base" as const, konstrukcja: "shelves" as const, pozycjaYMM: 100, szerokoscMM: 600, wysokoscMM: 762, glebokoscMM: 550 };
  const a1 = s.dodajModul(p.id, { ...baza, scianaId: A.id, pozycjaXMM: 0, konfiguracja: { blat: true, blatWymiar: { szerokoscMM: 1230, glebokoscMM: 1200, xMM: -15, zMM: -50 } } });
  s.dodajModul(p.id, { ...baza, scianaId: A.id, pozycjaXMM: 600, konfiguracja: { blat: false } });
  s.dodajModul(p.id, { ...baza, scianaId: B.id, pozycjaXMM: 0, konfiguracja: { blat: false } });
  s.dodajModul(p.id, { ...baza, scianaId: B.id, pozycjaXMM: 600, konfiguracja: { blat: false } });

  const a = s.analiza(p.id);
  assert.deepEqual(a.walidacja.filter((u) => u.poziom === "blad"), []);
  const blaty = a.zbudowane.flatMap((z) => z.elementy.filter((e) => e.rola === "worktop").map((e) => ({ modul: z.modul.id, ...e })));
  assert.equal(blaty.length, 1);
  assert.deepEqual([blaty[0].modul, blaty[0].x, blaty[0].z, blaty[0].szer, blaty[0].gl, blaty[0].y], [a1.id, -15, -50, 1230, 1200, 762]);
  // Wycena: blat 1200 mm głębokości = dwa blaty standardowe 600 mm.
  assert.equal(a.projektWyceny.metryBiezaceBlatu, 1.23 * 2);
  assert.ok(!s.dokumentacja(p.id).diagnostyka.some((x) => x.kod === "OP_POZA_CZESCIA"));
});
