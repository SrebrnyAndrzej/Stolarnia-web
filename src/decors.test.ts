import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { DEKORY, kluczDekoru, materialDekoru, wariantyDekoru, wymiaryWariantu } from "./core/catalog/decors.js";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

test("katalog zawiera wszystkie 644 dekory i lokalne obrazy", () => {
  assert.equal(DEKORY.length, 644);
  assert.equal(DEKORY.filter(d => d.manufacturer === "Egger").length, 408);
  assert.equal(new Set(DEKORY.map(kluczDekoru)).size, 644);
  for (const d of DEKORY) assert.ok(existsSync(join("docs/materialy", d.image_local)), d.id);
});
test("wariant płyty pochodzi z właściwego dekoru; rolki obrzeża są wykluczone", () => {
  const d = DEKORY.find(d => wariantyDekoru(d).length)!;
  const w = wariantyDekoru(d)[0];
  const m = materialDekoru(kluczDekoru(d), { artykul: w.article_id });
  assert.deepEqual({ gruboscMM: m.gruboscMM, wysokoscArkuszaMM: m.wysokoscArkuszaMM, szerokoscArkuszaMM: m.szerokoscArkuszaMM }, wymiaryWariantu(w));
  assert.ok(m.wysokoscArkuszaMM > 1000);
  assert.equal(m.cenaNetto, 0);
  assert.throws(() => materialDekoru(kluczDekoru(d), { artykul: "1685965" }));
  assert.throws(() => materialDekoru(kluczDekoru(d), { artykul: "nie-istnieje" }));
});
test("Kronospan wymaga jawnego formatu i zachowuje strukturę", () => {
  const d = DEKORY.find(d => d.manufacturer === "Kronospan")!;
  assert.throws(() => materialDekoru(kluczDekoru(d), {}));
  const m = materialDekoru(kluczDekoru(d), { gruboscMM: 18, wysokoscArkuszaMM: 2800, szerokoscArkuszaMM: 2070, struktura: d.textures?.[0] ?? "potwierdzona", kierunekDekoru: true });
  assert.ok(m.notatki.includes("użytkownika"));
  assert.equal(m.kierunekDekoru, true);
  assert.match(m.id, /^dekor-[a-f0-9]+$/);
});
test("zapis materiału zachowuje pochodzenie, zdjęcie i rzeczywistą grubość konstrukcji", () => {
  const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "dekory-"))));
  const d = DEKORY.find(d => wariantyDekoru(d).some(w => wymiaryWariantu(w).gruboscMM === 19))!;
  const w = wariantyDekoru(d).find(w => wymiaryWariantu(w).gruboscMM === 19)!;
  const m = s.zapiszMaterial(materialDekoru(kluczDekoru(d), { artykul: w.article_id }));
  assert.ok(s.materialy().find(x => x.id === m.id)?.zdjecieURL);
  const p = s.utworzProjekt({ nazwa: "Dekor", sciany: [{ dlugoscMM: 1000 }] });
  s.wypelnijSciane(p.id, p.pomieszczenia[0].sciany[0].id, ["base-shelves-400"]);
  s.zmienModul(p.id, s.projekt(p.id).moduly[0].id, { materialKorpusuId: m.id });
  const f = s.analiza(p.id).formatki.filter(f => f.materialId === m.id);
  assert.ok(f.length > 0);
  assert.ok(f.every(f => f.gruboscMM === 19));
});
