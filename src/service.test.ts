import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { zawiasyDlaWysokosci } from "./core/builder.js";
import { Magazyn } from "./store/store.js";
import { Stolarnia } from "./service.js";

function nowa() {
  return new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "stolarnia-"))));
}

test("reguła zawiasów jak w ProjektWycenyBuilder", () => {
  assert.equal(zawiasyDlaWysokosci(716), 2);
  assert.equal(zawiasyDlaWysokosci(1200), 3);
  assert.equal(zawiasyDlaWysokosci(1900), 4);
  assert.equal(zawiasyDlaWysokosci(2100), 5);
});

test("kuchnia 3,6 m: moduły, formatki, rozkrój i wycena 4 wariantów", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Kuchnia testowa", sciany: [{ dlugoscMM: 3600 }] });
  const sc = p.pomieszczenia[0].sciany[0].id;
  s.wypelnijSciane(p.id, sc, ["tall-refrigerator-600", "base-drawers-600", "base-sink-800", "dishwasher-front-600", "base-oven-600", "base-shelves-400"]);
  s.wypelnijSciane(p.id, sc, ["wall-shelves-800", "wall-shelves-600", "wall-hood-600", "wall-shelves-400"], 600);

  const a = s.analiza(p.id);
  assert.equal(a.projekt.moduly.length, 10);
  assert.ok(a.formatki.length > 60, `formatek: ${a.formatki.length}`);
  assert.equal(a.rozkroj.nierozmieszczone.length, 0);
  assert.ok(a.rozkroj.arkusze.length >= 2);
  assert.equal(a.walidacja.filter((u) => u.poziom === "blad").length, 0, JSON.stringify(a.walidacja));

  // Szafka 600 z szufladami: 3 fronty szuflad, 3 komplety prowadnic, skrzynki z płyty.
  const szuf = a.zbudowane.find((z) => z.modul.katalogId === "base-drawers-600")!;
  assert.equal(szuf.elementy.filter((e) => e.kod.startsWith("FRONT-SZ")).length, 3);
  assert.equal(szuf.elementy.filter((e) => e.rola === "drawerSide").length, 6);

  const [eco, std, prem, vip] = a.warianty;
  assert.ok(eco.cenaNetto < std.cenaNetto && std.cenaNetto < prem.cenaNetto && prem.cenaNetto < vip.cenaNetto, a.warianty.map((w) => w.cenaNetto).join(" < "));
  // Kaskada: zapas → narzut → marża → VAT (SilnikWycenyWariantowej)
  const u = s.ustawienia().finanse;
  const zap = std.kosztBazowyNetto * u.zapasKosztowyProcent / 100;
  const narz = (std.kosztBazowyNetto + zap) * u.narzutProcent / 100;
  const netto = (std.kosztBazowyNetto + zap + narz) * (1 + u.marzaProcent / 100);
  assert.ok(Math.abs(netto - std.cenaNetto) < 0.05);
  assert.ok(Math.abs(std.cenaBrutto - std.cenaNetto * 1.23) < 0.05);

  console.log(
    a.warianty.map((w) => `${w.nazwa}: ${w.cenaNetto.toFixed(2)} netto / ${w.cenaBrutto.toFixed(2)} brutto`).join("\n"),
    "\nArkusze:",
    a.rozkroj.podsumowanie.map((x) => `${x.materialOpis} ${x.gruboscMM}mm × ${x.liczbaArkuszy} (${x.wykorzystanieProcent}%)`).join("; "),
  );
});

test("minimalna wartość zlecenia dla pustego projektu", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Pusty" });
  const w = s.wycena(p.id, "standard").warianty[0];
  assert.equal(w.cenaNetto, 1500);
});

test("kolizja modułów jest wykrywana", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Kolizja" });
  s.dodajModul(p.id, { katalogId: "base-shelves-600", pozycjaXMM: 0 });
  s.dodajModul(p.id, { katalogId: "base-shelves-600", pozycjaXMM: 300 });
  assert.ok(s.analiza(p.id).walidacja.some((u) => u.komunikat.startsWith("Kolizja")));
});
