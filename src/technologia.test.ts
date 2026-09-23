import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { profilSzuflady, wymiarySzuflady } from "./core/catalog/drawers.js";
import type { Czesc, Operacja } from "./core/types.js";
import { Magazyn } from "./store/store.js";
import { Stolarnia } from "./service.js";

// Przypadki odbiorcze z docs/WYTYCZNE.md §13. Oczekiwane wartości policzone niezależnie od generatora.

function nowa() {
  return new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "stolarnia-tech-"))));
}

function projektZModulem(s: Stolarnia, dane: Parameters<Stolarnia["dodajModul"]>[1]) {
  const p = s.utworzProjekt({ nazwa: "T", sciany: [{ dlugoscMM: 3000 }] });
  const m = s.dodajModul(p.id, dane);
  return { p, m };
}

const czesc = (d: { czesci: Czesc[] }, kod: string) => d.czesci.find((c) => c.kodElementu === kod)!;

/** Odtwarza punkt operacji w układzie modułu (odwrotność konwencji z typu Operacja). */
function wModule(c: Czesc, o: Operacja): number[] {
  const L = c.dlugoscMM, S = c.szerokoscMM, G = c.gruboscMM;
  const lok =
    o.powierzchnia === "A" ? [o.x, o.y, G]
    : o.powierzchnia === "B" ? [o.x, o.y, 0]
    : o.powierzchnia === "DA" ? [o.x, 0, o.y]
    : o.powierzchnia === "DB" ? [o.x, S, o.y]
    : o.powierzchnia === "KA" ? [0, o.x, o.y]
    : [L, o.x, o.y];
  const { o: p0, x, y, n } = c.uklad;
  return [0, 1, 2].map((i) => Math.round((p0[i] + lok[0] * x[i] + lok[1] * y[i] + lok[2] * n[i]) * 10) / 10);
}

test("Zasada zakładu: każdy moduł z korpusem = 2 boki + 2 wieńce (dolny i górny)", async () => {
  const { KATALOG_MODULOW } = await import("./core/catalog/modules.js");
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Wieńce", sciany: [{ dlugoscMM: 100000 }] });
  for (const k of KATALOG_MODULOW) s.dodajModul(p.id, { katalogId: k.id });
  for (const z of s.analiza(p.id).zbudowane) {
    if (z.modul.konstrukcja === "dishwasherFront") continue; // panel frontu AGD — bez korpusu
    const ile = (rola: string) => z.elementy.filter((e) => e.rola === rola).length;
    assert.equal(ile("side"), 2, `${z.modul.katalogId}: boki`);
    assert.equal(ile("bottom"), 1, `${z.modul.katalogId}: wieniec dolny`);
    assert.equal(ile("top"), 1, `${z.modul.katalogId}: wieniec górny`);
    assert.equal(ile("reinforcement"), 0, `${z.modul.katalogId}: listwy zamiast wieńca`);
  }
});

test("T01: dno między bokami — 800 mm, boki 18 → 19 mm daje 764 → 762 mm", () => {
  const s = nowa();
  const { p } = projektZModulem(s, { katalogId: "base-shelves-800" });
  assert.equal(czesc(s.dokumentacja(p.id), "WIENIEC-D").dlugoscMM, 764);
  assert.equal(s.analiza(p.id).formatki.find((f) => f.kodElementu === "WIENIEC-D")!.dlugoscMM, 764);
  s.zmienUstawienia({ konstrukcja: { gruboscPlytyKorpusuMM: 19 } });
  assert.equal(czesc(s.dokumentacja(p.id), "WIENIEC-D").dlugoscMM, 762);
  assert.equal(s.analiza(p.id).formatki.find((f) => f.kodElementu === "WIENIEC-D")!.dlugoscMM, 762);
});

test("Połączenia: każdy konfirmat w licu boku ma parę w krawędzi wieńca na tej samej osi", () => {
  const s = nowa();
  const { p } = projektZModulem(s, { katalogId: "wall-shelves-600" });
  const d = s.dokumentacja(p.id);
  const klucz = (v: number[]) => v.join(",");
  const lica = new Set<string>();
  const krawedzie = new Set<string>();
  for (const c of d.czesci)
    for (const o of c.operacje.filter((q) => q.przeznaczenie.startsWith("Konfirmat")))
      (o.przelotowy ? lica : krawedzie).add(klucz(wModule(c, o)));
  assert.ok(lica.size >= 8, `konfirmatów: ${lica.size}`);
  assert.deepEqual([...lica].sort(), [...krawedzie].sort());
  // Otwory krawędziowe leżą na krawędziach KA/KB wieńców, lico na stronie A boków.
  for (const c of d.czesci)
    for (const o of c.operacje.filter((q) => q.przeznaczenie.startsWith("Konfirmat")))
      assert.ok(c.rola === "side" ? o.powierzchnia === "A" : ["KA", "KB"].includes(o.powierzchnia), `${c.kodElementu} ${o.powierzchnia}`);
  assert.equal(d.diagnostyka.filter((x) => x.kod === "OP_POZA_CZESCIA").length, 0);
});

test("T04/T05: boki lustrzane — zawiasy tylko po stronie zawiasów, różne pozycje produkcyjne", () => {
  const s = nowa();
  const { p } = projektZModulem(s, { katalogId: "base-shelves-600" }); // 1 skrzydło, zawiasy z lewej
  const d = s.dokumentacja(p.id);
  const L = czesc(d, "BOK-L");
  const P = czesc(d, "BOK-P");
  const prowadnik = (c: Czesc) => c.operacje.filter((o) => o.przeznaczenie === "Prowadnik zawiasu");
  assert.equal(prowadnik(L).length, 4); // 2 zawiasy × 2 otwory
  assert.equal(prowadnik(P).length, 0);
  assert.ok(prowadnik(L).every((o) => o.powierzchnia === "A" && o.y === 37));
  assert.notEqual(L.podpis, P.podpis);

  // Dwa skrzydła: prowadniki po obu stronach; boki lustrzane mają układ prawoskrętny,
  // więc wysokość na prawym boku liczona jest od góry (x = H − y).
  const s2 = nowa();
  const { p: p2 } = projektZModulem(s2, { katalogId: "base-shelves-800" });
  const d2 = s2.dokumentacja(p2.id);
  const L2 = czesc(d2, "BOK-L");
  const P2 = czesc(d2, "BOK-P");
  const xs = (c: Czesc) => prowadnik(c).map((o) => o.x).sort((a, b) => a - b);
  assert.equal(xs(L2).length, 4);
  assert.deepEqual(xs(P2), xs(L2).map((x) => Math.round((L2.dlugoscMM - x) * 10) / 10).sort((a, b) => a - b));
  // Puszki: lewe skrzydło przy lewej krawędzi (22,5), prawe przy prawej.
  const puszkiL = czesc(d2, "FRONT-D01").operacje.filter((o) => o.przeznaczenie === "Puszka zawiasu");
  assert.equal(puszkiL.length, 2);
  assert.ok(puszkiL.every((o) => o.powierzchnia === "A"));
});

test("T06: kompensacja obrzeża stosowana dokładnie raz (formatka, rozkrój, dokumentacja)", () => {
  const s = nowa();
  const { p } = projektZModulem(s, { katalogId: "base-shelves-600" });
  const f0 = s.analiza(p.id).formatki.find((f) => f.kodElementu === "FRONT-D01")!;
  assert.equal(f0.dlugoscCieciaMM, f0.dlugoscMM);
  s.zmienUstawienia({ okleinowanie: { odejmujGruboscObrzeza: true } });
  const a = s.analiza(p.id);
  const f = a.formatki.find((x) => x.kodElementu === "FRONT-D01")!;
  // Front: ABS 2 mm na 4 krawędziach → −4 mm w obu wymiarach.
  assert.equal(f.dlugoscCieciaMM, f.dlugoscMM - 4);
  assert.equal(f.szerokoscCieciaMM, f.szerokoscMM - 4);
  const c = czesc(s.dokumentacja(p.id), "FRONT-D01");
  assert.equal(c.dlugoscCieciaMM, f.dlugoscCieciaMM);
  const pol = a.rozkroj.arkusze.flatMap((x) => x.polozenia).find((x) => x.formatkaId === f.id)!;
  assert.deepEqual([pol.dlugoscMM, pol.szerokoscMM].sort(), [f.dlugoscCieciaMM, f.szerokoscCieciaMM].sort());
});

test("T07: szuflady — wymiary z profilu producenta, brak wierceń blokuje gotowość produkcyjną", () => {
  // Przykład z katalogu (reguly-szuflad.json): LW 564, NL 500 → dno 489 × 476, plecy 477.
  const pr = profilSzuflady("blum-tandembox-antaro-m-wood")!;
  const w = wymiarySzuflady(pr, 564, 500, 200);
  assert.deepEqual([w.dnoSzer, w.dnoGl, w.plecySzer], [pr.example.bottom_width, pr.example.bottom_depth, pr.example.back_width]);

  const s = nowa();
  const { p } = projektZModulem(s, { katalogId: "base-drawers-600", konfiguracja: { szufladySystemowe: true } });
  const d = s.dokumentacja(p.id);
  const dno = czesc(d, "SZ01-DNO");
  assert.equal(dno.dlugoscMM, 564 - 75); // LW = 600 − 2×18
  assert.equal(dno.status, "brakDanych");
  assert.equal(czesc(d, "BOK-L").status, "brakDanych");
  assert.ok(d.diagnostyka.some((x) => x.kod === "SZUFLADA_WIERCENIA" && x.opis.includes("not_normalized")));
  assert.equal(d.gotowaDoProdukcji, false);

  // Nieznany profil: jawny komunikat, brak części dna.
  s.zmienUstawienia({ technologia: { profilSzuflad: "nieznany-system" } });
  const a = s.analiza(p.id);
  assert.ok(a.zbudowane[0].ostrzezenia.some((o) => o.includes("Nieznany profil")));
  assert.ok(!a.formatki.some((f) => f.kodElementu === "SZ01-DNO"));
  assert.equal(s.dokumentacja(p.id).gotowaDoProdukcji, false);
});

test("PDF: skrócona karta szafki mieści się na jednej stronie A4", async () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "PDF", sciany: [{ dlugoscMM: 3000 }] });
  const sc = p.pomieszczenia[0].sciany[0].id;
  const moduly = s.wypelnijSciane(p.id, sc, ["tall-pantry-600", "base-drawers-600", "base-sink-800", "base-shelves-600"]);
  const strony = (b: Buffer) => b.toString("latin1").match(/\/Type \/Page[^s]/g)?.length ?? 0;
  const a4 = (b: Buffer) => (b.toString("latin1").match(/\/MediaBox \[0 0 841\.89 595\.28\]/g)?.length ?? 0) === strony(b);
  for (const m of moduly) {
    const pdf = await s.dokumentacjaPdf(p.id, { moduly: [m.id], skrocony: true });
    assert.equal(strony(pdf), 1, m.nazwa);
    assert.ok(a4(pdf), `${m.nazwa}: format A4 poziomo`);
  }
  const pakiet = await s.dokumentacjaPdf(p.id);
  assert.ok(pakiet.subarray(0, 5).toString() === "%PDF-");
});

test("Części bez wierceń są jawnie oznaczone; każda część ma status", () => {
  const s = nowa();
  const { p } = projektZModulem(s, { katalogId: "wall-shelves-600" });
  const d = s.dokumentacja(p.id);
  const polka = czesc(d, "POLKA-01");
  assert.equal(polka.bezWiercen, true);
  assert.ok(polka.uwagi.some((u) => u.includes("bez wierceń")));
  assert.equal(czesc(d, "PLECY").bezWiercen, true);
  // Rowek pod plecy w bokach i wieńcach
  assert.ok(czesc(d, "BOK-L").operacje.some((o) => o.typ === "rowek" && o.glebokosc === 8));
  assert.ok(czesc(d, "WIENIEC-G").operacje.some((o) => o.typ === "rowek"));
  // Plecy wsunięte w rowek: światło 564 + 2 × (8 − 1) = 578
  assert.equal(czesc(d, "PLECY").szerokoscMM, 578);
  assert.equal(d.czesci.length, d.podsumowanie.gotowa + d.podsumowanie.robocza + d.podsumowanie.brakDanych);
  assert.equal(d.gotowaDoProdukcji, false); // reguły robocze + zawieszki bez SKU
});
