import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { KonfliktZapisu, Magazyn } from "./store/store.js";
import { Stolarnia } from "./service.js";

/** Minimalna atrapa PostgREST dla tabeli stolarnia_baza (GET/POST/PATCH z filtrem wersji). */
async function atrapaSupabase() {
  let wiersz: { id: string; dane: unknown; wersja: number } | undefined;
  const klucze: string[] = [];
  const srv = createServer((req, res) => {
    klucze.push(String(req.headers.apikey));
    const url = new URL(req.url!, "http://x");
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const json = (s: number, d: unknown) => res.writeHead(s, { "Content-Type": "application/json" }).end(JSON.stringify(d));
      if (req.method === "GET") return json(200, wiersz ? [wiersz] : []);
      if (req.method === "POST") {
        wiersz = JSON.parse(body);
        return json(201, [wiersz]);
      }
      if (req.method === "PATCH") {
        const w = Number(url.searchParams.get("wersja")?.replace("eq.", ""));
        if (!wiersz || wiersz.wersja !== w) return json(200, []);
        const zmiana = JSON.parse(body);
        wiersz = { ...wiersz, dane: zmiana.dane, wersja: zmiana.wersja };
        return json(200, [wiersz]);
      }
      json(405, {});
    });
  });
  await new Promise<void>((ok) => srv.listen(0, ok));
  const url = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  return { url, srv, klucze, wiersz: () => wiersz };
}

test("Magazyn w chmurze: pierwsze użycie tworzy bazę, zmiany zapisują się z kontrolą wersji", async () => {
  const a = await atrapaSupabase();
  try {
    const chmura = { url: a.url, klucz: "sb_secret_test" };
    const m1 = new Magazyn(undefined, chmura);
    await m1.zaladuj();
    assert.equal(a.wiersz()?.wersja, 1);
    const s1 = new Stolarnia(m1);
    const p = s1.utworzProjekt({ nazwa: "W chmurze" });
    await m1.utrwal();
    assert.equal(a.wiersz()?.wersja, 2);
    assert.ok(a.klucze.every((k) => k === "sb_secret_test"));

    // Druga instancja widzi zmianę po wczytaniu.
    const m2 = new Magazyn(undefined, chmura);
    await m2.zaladuj();
    assert.equal(new Stolarnia(m2).projekt(p.id).nazwa, "W chmurze");

    // Konflikt: m1 ma nieaktualną wersję, jeśli m2 zapisze pierwsza.
    new Stolarnia(m2).zmienProjekt(p.id, { nazwa: "Zmiana B" });
    await m2.utrwal();
    s1.zmienProjekt(p.id, { nazwa: "Zmiana A" });
    await assert.rejects(m1.utrwal(), KonfliktZapisu);
    await m1.zaladuj();
    assert.equal(new Stolarnia(m1).projekt(p.id).nazwa, "Zmiana B");

    // Bez zmian — brak zapisu.
    const przed = a.wiersz()?.wersja;
    await m1.utrwal();
    assert.equal(a.wiersz()?.wersja, przed);
  } finally {
    a.srv.close();
  }
});
