import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { rozliczenie } from "./core/rozliczenie.js";
import { filtrujOdpowiedz } from "./server/uprawnienia.js";
import { Stolarnia } from "./service.js";
import { Magazyn } from "./store/store.js";

// ST-APP-005: rozliczenie wpłat i zapytanie → projekt.
const nowa = () => new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "rozl-"))));
const UMOWA = {
  numer: "1/2026", rodzaj: "kuchnia" as const, klient: "Klient", adresKlienta: "Adres", firma: "Pan Stolarz", adresFirmy: "Adres firmy", nip: "1234567890",
  miejsce: "", adresMontazu: "Adres", data: "2026-11-01", termin: "2026-12-10", cena: 30000, zaliczka: 9000, zaliczkaZaplacona: true, dataZaliczki: "2026-11-02",
  zakres: "Zakres", warunki: "Warunki",
};

test("rozliczenie: należność z umowy (a bez niej z ceny uzgodnionej), zaliczka z umowy + wpłaty, statusy", () => {
  assert.equal(rozliczenie({}).status, "brakCeny");
  const r1 = rozliczenie({ cenaUzgodnionaBrutto: 1000, wplaty: [{ id: "a", data: "2026-11-03", kwota: 400.1, sposob: "przelew", opis: "", dodano: "" }] });
  assert.deepEqual([r1.naleznosc, r1.wplacono, r1.pozostalo, r1.status], [1000, 400.1, 599.9, "nierozliczony"]);
  const r2 = rozliczenie({ cenaUzgodnionaBrutto: 1, umovy: [{ ...UMOWA, id: "u1", utworzono: "2026-11-01T10:00:00Z" }], wplaty: [{ id: "a", data: "2026-12-12", kwota: 21000, sposob: "gotowka", opis: "dopłata", dodano: "" }] });
  assert.equal(r2.naleznosc, 30000);
  assert.equal(r2.zrodloNaleznosci, "umowa 1/2026");
  assert.deepEqual(r2.wplaty.map((w) => [w.kwota, w.zUmowy]), [[9000, true], [21000, false]]);
  assert.equal(r2.status, "rozliczony");
  assert.equal(rozliczenie({ cenaUzgodnionaBrutto: 100, wplaty: [{ id: "a", data: "2026-11-03", kwota: 150, sposob: "karta", opis: "", dodano: "" }] }).status, "nadplata");
});

test("rozliczenie w usłudze: wpłaty bez podbijania rewizji, walidacja, usuwanie, kopia projektu bez wpłat; produkcja nie widzi wpłat", () => {
  const s = nowa();
  const p = s.utworzProjekt({ nazwa: "Kuchnia", sciany: [{ dlugoscMM: 3000 }] });
  s.zmienProjekt(p.id, { cenaUzgodnionaBrutto: 20000 });
  const rew = s.projekt(p.id).rewizja;
  const r = s.dodajWplate(p.id, { data: "2026-11-15", kwota: 5000, sposob: "przelew", opis: "zaliczka przelewem" });
  assert.equal(r.pozostalo, 15000);
  assert.equal(s.projekt(p.id).rewizja, rew);
  assert.throws(() => s.dodajWplate(p.id, { data: "2026-02-30", kwota: 1, sposob: "przelew" }), /data/);
  assert.throws(() => s.dodajWplate(p.id, { data: "2026-11-15", kwota: 0, sposob: "przelew" }), /większa od zera/);
  assert.throws(() => s.dodajWplate(p.id, { data: "2026-11-15", kwota: 1.234, sposob: "przelew" }), /dwa miejsca/);
  const wid = s.projekt(p.id).wplaty![0].id;
  assert.equal(filtrujOdpowiedz("produkcja", s.projekt(p.id)) && (filtrujOdpowiedz("produkcja", s.projekt(p.id)) as Record<string, unknown>).wplaty, undefined);
  assert.equal((filtrujOdpowiedz("montaz", s.projekt(p.id)) as Record<string, unknown>).wplaty, undefined);
  assert.equal(s.duplikujProjekt(p.id).wplaty, undefined);
  assert.equal(s.usunWplate(p.id, wid).wplacono, 0);
  assert.throws(() => s.usunWplate(p.id, wid), /Nie ma takiej wpłaty/);
});

test("zapytanie → projekt: dane klienta i opis w Temacie, drugi raz ten sam projekt", () => {
  const s = nowa();
  const z = { id: "11111111-1111-4111-8111-111111111111", name: "Anna Test", email: "anna@example.test", kind: "kuchnia", city: "Nowa Sól", description: "Kuchnia L, 3 m." };
  const a = s.projektZZapytania(z);
  assert.equal(a.nowy, true);
  assert.equal(a.projekt.nazwa, "Kuchnia — Anna Test");
  assert.deepEqual([a.projekt.klient.nazwa, a.projekt.klient.email, a.projekt.klient.adres], ["Anna Test", "anna@example.test", "Nowa Sól"]);
  assert.match(a.projekt.notatki, /Kuchnia L, 3 m\./);
  assert.equal(a.projekt.zrodloZapytania, z.id);
  const b = s.projektZZapytania(z);
  assert.deepEqual([b.nowy, b.projekt.id], [false, a.projekt.id]);
  assert.equal(s.projekty().length, 1);
});
