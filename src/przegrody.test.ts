import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

// Silnik K02: przegrody pionowe i półki stałe z edytora — formatki i połączenia w dokumentacji.

function nowa() {
  return new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "przegrody-"))));
}

test("przegroda pionowa: dwie komory, konfirmaty z wieńcami, podpórki półek w boku i przegrodzie", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "P", sciany: [{ dlugoscMM: 3000 }] });
  const m = s.dodajModul(p.id, { katalogId: "base-shelves-800" });
  const polkiPrzed = s.analiza(p.id).zbudowane[0].elementy.filter((e) => e.rola === "shelf").length;
  const r = s.polecenieKonstrukcji(p.id, m.id, { typ: "podzielWnetrze", kierunek: "pion", liczba: 2 });
  assert.ok(r.uwagi[0].includes("2 komór"));

  const z = s.analiza(p.id).zbudowane.find((q) => q.modul.id === m.id)!;
  const t = 18;
  const przegroda = z.elementy.find((e) => e.rola === "divider")!;
  assert.ok(przegroda, "jest przegroda");
  const swiatlo = m.szerokoscMM - 2 * t;
  const komora = (swiatlo - t) / 2;
  assert.equal(przegroda.x, t + komora);
  assert.equal(przegroda.wys, m.wysokoscMM - 2 * t);
  const polki = z.elementy.filter((e) => e.rola === "shelf");
  assert.equal(polki.length, 2 * polkiPrzed, "półki w każdej komorze");
  assert.ok(polki.every((q) => q.szer === komora));

  const d = s.dokumentacja(p.id);
  const cz = (kod: string) => d.czesci.find((c) => c.modulId === m.id && c.kodElementu === kod)!;
  const opsP = cz(przegroda.kod).operacje;
  assert.ok(opsP.filter((o) => o.przeznaczenie === "Konfirmat — otwór w krawędzi").length >= 4, "krawędzie przegrody");
  assert.ok(opsP.some((o) => o.przeznaczenie === "Podpórka półki" && o.powierzchnia === "A"));
  assert.ok(opsP.some((o) => o.przeznaczenie === "Podpórka półki" && o.powierzchnia === "B"), "podpórki z obu stron przegrody");
  for (const w of ["WIENIEC-D", "WIENIEC-G"]) assert.ok(cz(w).operacje.some((o) => o.przelotowy && o.polaczenie?.includes(cz(przegroda.kod).etykieta)), `${w} ↔ przegroda`);
  assert.ok(!d.diagnostyka.some((x) => x.kod === "OP_POZA_CZESCIA" || x.kod === "PRZEGRODA_BEZ_OPARCIA"));

  // Półka stała w komorze łączy się z bokiem i przegrodą, nie z drugim bokiem.
  const komoraId = s.polecenieKonstrukcji(p.id, m.id, { typ: "podzielWnetrze", kierunek: "poziom", liczba: 2, strefaId: "wnetrze-k1" });
  assert.ok(komoraId.uwagi[0].includes("półkami stałymi"));
  const d2 = s.dokumentacja(p.id);
  const stala = d2.czesci.find((c) => c.modulId === m.id && c.rola === "fixedShelf")!;
  const polaczenia = new Set(stala.operacje.map((o) => o.polaczenie));
  assert.ok([...polaczenia].some((x) => x?.includes("BOK")));
  assert.ok(![...polaczenia].some((x) => x?.includes(d2.czesci.find((c) => c.modulId === m.id && c.kodElementu === "BOK-P")!.etykieta)), "nie sięga prawego boku");
  assert.ok(!d2.diagnostyka.some((x) => x.kod === "OP_POZA_CZESCIA"));

  assert.throws(() => s.polecenieKonstrukcji(p.id, m.id, { typ: "podzielWnetrze", kierunek: "pion", liczba: 6, strefaId: "wnetrze-k2" }), /węższa niż 100/);
});
