import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { zbudujModul } from "./core/builder.js";
import { PROFILE_SZUFLAD, przeliczSzuflade, profilSzuflady } from "./core/catalog/drawers.js";
import { USTAWIENIA_DOMYSLNE } from "./core/settings.js";
import { zbudujModulSilnikiem } from "./core/silnik/adapter.js";
import type { Modul } from "./core/types.js";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

test("przelicznik: przykłady z kart producentów (LW 564, NL 500) dla Amix, GTV i Blum", () => {
  // docs/okucia/README.md — wymiary porównane wizualnie z rysunkami
  const ocz: Record<string, [number, number, number]> = {
    "amix-elite-standard": [489, 474, 477],
    "gtv-axis-pro-option1": [489, 476, 477],
    "gtv-modern-box-pro": [489, 476, 477],
    "blum-merivobox-m-wood": [513, 474, 513],
    "blum-legrabox-m-wood": [529, 490, 526],
    "blum-tandembox-antaro-m-wood": [489, 476, 477],
  };
  for (const p of PROFILE_SZUFLAD) {
    const w = przeliczSzuflade(p, { LW: 564, NL: 500 });
    assert.deepEqual([w.dno.szer, w.dno.gl, w.plecy.szer], ocz[p.id], p.id);
    assert.equal(w.zatwierdzoneProdukcyjnie, false);
  }
});

test("przelicznik: wysokości boków Blum ze stron PDF, stalowa ścianka TANDEMBOX, frezowanie LEGRABOX", () => {
  const legra = profilSzuflady("blum-legrabox-m-wood")!;
  const wys = (id: string, war: string) => przeliczSzuflade(profilSzuflady(id)!, { LW: 564, NL: 500, wariant: war }).plecy.wys;
  assert.deepEqual(["N", "M", "K", "C", "F"].map((w) => wys("blum-legrabox-m-wood", w)), [39, 63, 101, 148, 212]);
  assert.deepEqual(["N", "M", "K", "E"].map((w) => wys("blum-merivobox-m-wood", w)), [60.5, 83, 121, 184]);
  assert.deepEqual(["N", "M", "K", "C", "D"].map((w) => wys("blum-tandembox-antaro-m-wood", w)), [69, 84, 116, 167, 199]);
  const n = przeliczSzuflade(legra, { LW: 564, NL: 500, wariant: "N" });
  assert.equal(n.zrodlo.strona, 11);
  assert.ok(n.uwagi.some((u) => u.includes("Frezowanie")));
  const tandem = profilSzuflady("blum-tandembox-antaro-m-wood")!;
  assert.equal(przeliczSzuflade(tandem, { LW: 564, NL: 500, sciankaTylna: "stalowa" }).dno.gl, 478);
  assert.equal(przeliczSzuflade(tandem, { LW: 564, NL: 500, sciankaTylna: "drewniana" }).dno.gl, 476);
  // Dobór wariantu do wysokości frontu: najwyższe plecy z zapasem 40 mm
  assert.equal(przeliczSzuflade(legra, { LW: 564, NL: 500, wysokoscFrontuMM: 150 }).wariant, "K");
  assert.ok(przeliczSzuflade(legra, { LW: 564, NL: 500, wariant: "Z" }).uwagi.some((u) => u.includes("nie ma wariantu")));
});

test("przelicznik w serwisie: LW i NL z wymiarów korpusu, błędy dla złych danych", () => {
  const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "przelicznik-"))));
  const r = s.przelicznikSzuflad({ szerokoscKorpusu: 600, glebokoscKorpusu: 560 });
  assert.equal(r.LW, 564);
  assert.equal(r.NL, 500); // 560 − 10 − 3 = 547 → NL 500
  assert.equal(r.wyniki.length, PROFILE_SZUFLAD.length);
  assert.equal(s.przelicznikSzuflad({ LW: 564, NL: 450, profilId: "gtv-modern-box-pro" }).wyniki.length, 1);
  assert.throws(() => s.przelicznikSzuflad({ NL: 500 }), /LW/);
  assert.throws(() => s.przelicznikSzuflad({ LW: 564, glebokoscKorpusu: 250 }), /za mała/);
  assert.throws(() => s.przelicznikSzuflad({ LW: 564, NL: 500, profilId: "xyz" }), /Nieznany/);
});

test("system szuflad wybrany dla szafki: builder i silnik liczą dno i plecy z tego profilu i wariantu", () => {
  const k = USTAWIENIA_DOMYSLNE.konstrukcja;
  const tech = USTAWIENIA_DOMYSLNE.technologia;
  const m: Modul = {
    id: "x", nazwa: "Szuflady LEGRABOX", kategoria: "base", konstrukcja: "drawers", scianaId: "s", pozycjaXMM: 0, pozycjaYMM: 100,
    szerokoscMM: 600, wysokoscMM: 720, glebokoscMM: 560,
    konfiguracja: { liczbaPolek: 0, typFrontu: "szuflady", liczbaDrzwi: 0, liczbaSzuflad: 3, liczbaCargo: 0, plecy: true, blat: true, nogi: true, szufladySystemowe: true, profilSzuflad: "blum-legrabox-m-wood", wariantBokuSzuflady: "K" },
  };
  const z = zbudujModul(m, k, tech);
  const dno = z.elementy.find((e) => e.kod === "SZ01-DNO")!;
  const tyl = z.elementy.find((e) => e.kod === "SZ01-TYL")!;
  assert.equal(dno.szer, 564 - 35);
  assert.equal(dno.gl, 500 - 10);
  assert.equal(tyl.szer, 564 - 38);
  assert.equal(tyl.wys, 101);
  const posortuj = (e: typeof z.elementy) => [...e].sort((a, b) => a.kod.localeCompare(b.kod));
  assert.deepEqual(posortuj(zbudujModulSilnikiem(m, k, tech).elementy), posortuj(z.elementy));
});
