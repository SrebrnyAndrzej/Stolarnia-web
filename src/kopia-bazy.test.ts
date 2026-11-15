import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
// @ts-expect-error — skrypt .mjs bez deklaracji typów (uruchamiany poza aplikacją)
import { eksport, kluczePlikow, odtworzChmure, odtworzLokalnie, sprawdz } from "../scripts/kopia-bazy.mjs";
import { Magazyn } from "./store/store.js";
import { Stolarnia } from "./service.js";

// ST-APP-005: kopia poza Supabase. Supabase podmieniony atrapą fetch — test nie łączy się z żadną bazą.
const KLUCZ = `${"a".repeat(64)}/12345678-1234-1234-1234-123456789abc`;
function atrapa() {
  const zrodlo = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "kopia-zr-"))));
  const p = zrodlo.utworzProjekt({ nazwa: "Kuchnia kopii", sciany: [{ dlugoscMM: 3000 }] });
  zrodlo.dodajModul(p.id, { katalogId: "base-drawers-600" });
  const dane = structuredClone(zrodlo.magazyn.odczytaj()) as unknown as Record<string, unknown>;
  (dane.projekty as Record<string, unknown>[])[0].pliki = [{ id: "f1", objectKey: KLUCZ }];
  const stan = { glowna: { id: "glowna", dane, wersja: 7, zmieniono: "2026-11-15T10:00:00Z" }, patch: [] as unknown[], upload: [] as string[] };
  const fetchImpl = async (url: string, init: RequestInit = {}) => {
    const u = new URL(url);
    if (u.pathname.startsWith("/storage/v1/object/")) {
      if (init.method === "POST") {
        stan.upload.push(u.pathname);
        return Response.json({});
      }
      return new Response(Buffer.from("PLIK-CAD"));
    }
    const tabela = u.pathname.replace("/rest/v1/", "");
    if (init.method === "PATCH") {
      const body = JSON.parse(String(init.body));
      stan.patch.push(body);
      if (!u.search.includes(`wersja=eq.${stan.glowna.wersja}`)) return Response.json([]);
      stan.glowna = { ...stan.glowna, ...body };
      return Response.json([stan.glowna]);
    }
    if (tabela === "stolarnia_baza") return Response.json([stan.glowna]);
    if (tabela === "pan_stolarz_members") return Response.json([{ user_id: "u1", role: "owner" }]);
    if (tabela === "pan_stolarz_requests") return new Response("{}", { status: 404 });
    return Response.json([]);
  };
  return { stan, fetchImpl, cfg: { url: "https://test.supabase.co", klucz: "sb_secret_test" } };
}

test("kopia bazy: eksport z plikami, sumy kontrolne, rotacja i odtworzenie lokalne czytelne dla aplikacji", async () => {
  const { fetchImpl, cfg } = atrapa();
  const katalog = mkdtempSync(join(tmpdir(), "kopie-"));
  const w = await eksport({ cfg, katalog, fetchImpl, teraz: new Date("2026-11-15T23:00:00Z") });
  assert.equal(w.manifest.projekty, 1);
  assert.equal(w.manifest.pliki.length, 1);
  assert.deepEqual(w.manifest.tabele.pan_stolarz_members, 1);
  assert.equal("pan_stolarz_requests" in w.manifest.tabele, false); // brak tabeli = pominięta, nie błąd
  assert.deepEqual(sprawdz(w.katalog).problemy, []);
  assert.deepEqual(kluczePlikow(JSON.parse(readFileSync(join(w.katalog, "baza.json"), "utf8")).tabele.stolarnia_baza[0].dane), [KLUCZ]);
  // Rotacja: zostaje N najnowszych
  await eksport({ cfg, katalog, fetchImpl, teraz: new Date("2026-11-16T23:00:00Z"), zachowaj: 1 });
  assert.equal(existsSync(w.katalog), false);
  const nowa = join(katalog, "kopia-2026-11-16T23-00");
  // Odtworzenie lokalne: aplikacja czyta projekty i plik z kopii
  const dane = mkdtempSync(join(tmpdir(), "odtw-"));
  const o = odtworzLokalnie(nowa, dane);
  assert.equal(o.projekty, 1);
  assert.equal(new Magazyn(dane).odczytaj().projekty[0].nazwa, "Kuchnia kopii");
  assert.equal(readFileSync(join(dane, "project-files", KLUCZ), "utf8"), "PLIK-CAD");
  assert.throws(() => odtworzLokalnie(nowa, dane), /zawiera już stolarnia.json/);
  // Uszkodzona kopia nie przechodzi kontroli
  writeFileSync(join(nowa, "pliki", KLUCZ), "ZMIENIONY");
  assert.match(sprawdz(nowa).problemy.join(), /suma SHA-256/);
  assert.throws(() => odtworzLokalnie(nowa, mkdtempSync(join(tmpdir(), "odtw2-"))), /Kopia uszkodzona/);
});

test("kopia bazy: odtworzenie chmury robi najpierw kopię bieżącego stanu i nie nadpisuje równoległej zmiany", async () => {
  const { stan, fetchImpl, cfg } = atrapa();
  const katalog = mkdtempSync(join(tmpdir(), "kopie-"));
  const w = await eksport({ cfg, katalog, fetchImpl });
  const r = await odtworzChmure({ cfg, katalogKopii: w.katalog, katalogZabezpieczenia: join(katalog, "przed"), fetchImpl });
  assert.equal(r.wersja, 8);
  assert.equal(stan.glowna.wersja, 8);
  assert.equal(stan.upload.length, 1);
  assert.ok(existsSync(r.zabezpieczenie));
  // Gdy wersja zmieni się między kopią zabezpieczającą a zapisem — odmowa
  const zly = async (url: string, init: RequestInit = {}) => {
    if (init.method === "PATCH") return Response.json([]);
    return fetchImpl(url, init);
  };
  await assert.rejects(() => odtworzChmure({ cfg, katalogKopii: w.katalog, katalogZabezpieczenia: join(katalog, "przed2"), fetchImpl: zly }), /równoległa zmiana/);
});
