import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { dostepDoTrasy, filtrujOdpowiedz, podpisUwagi, profilOsoby, regulyTrasy, sprawdzZmianeProjektu } from "./uprawnienia.js";

// Profile dostępu v2 (sprzedaz / produkcja / montaz) na prawdziwych trasach Express. Supabase (Auth, członkowie,
// dokument bazy) jest podmieniony atrapą fetch — test nie łączy się z żadną bazą; dane w katalogu tymczasowym.

const katalog = mkdtempSync(join(tmpdir(), "pan-stolarz-profile-"));
for (const k of ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_PUBLISHABLE_KEY"]) delete process.env[k];
process.env.STOLARNIA_DATA = katalog;
const { Magazyn } = await import("../store/store.js");
const { Stolarnia } = await import("../service.js");

// ---------- Dane testowe (lokalnie, potem jako dokument „chmury” atrapy) ----------
const lokalny = new Magazyn(katalog);
const svc = new Stolarnia(lokalny);
const mat = svc.materialy()[0];
svc.zapiszMaterial({ ...mat, cenaNetto: 4321.77 });
svc.zmienUstawienia({ finanse: { stawkaRoboczogodziny: 123.45 } } as never);
const KLIENT = { nazwa: "Sonda Klient", telefon: "731-555-019", adres: "ul. Sondy 9", email: "sonda@example.test" };
function projekt(nazwa: string, status: "szkic" | "produkcja" | "gotoweDoMontazu") {
  const p = svc.utworzProjekt({ nazwa, sciany: [{ dlugoscMM: 3000 }], klient: KLIENT, materialKorpusuId: mat.id } as never);
  svc.dodajModul(p.id, { katalogId: "base-drawers-600" });
  svc.zmienProjekt(p.id, { cenaUzgodnionaBrutto: 98765.43, notatki: "CRM-TAJNE-7Q" });
  // Uwaga robocza z rozmowy z klientem (CRM) i uwaga z warsztatu — produkcja/montaż widzą tylko drugą.
  svc.dodajNotatke(p.id, "Klient dzwonił: CRM-UWAGA-55, chce rabat");
  svc.dodajNotatke(p.id, "[Produkcja · Kuba] brak zawiasów");
  svc.utworzWydanie(p.id, {});
  if (status !== "szkic") svc.zmienProjekt(p.id, { status });
  return p.id;
}
const P = { szkic: projekt("Sonda szkic", "szkic"), prod: projekt("Sonda produkcja", "produkcja"), mont: projekt("Sonda montaż", "gotoweDoMontazu"), inny: projekt("Sonda nieprzydzielony", "produkcja") };
const wydanie = (id: string) => svc.wydania(id)[0].id;

let doc = { dane: structuredClone(lokalny.odczytaj()), wersja: 1 };
const baza = () => doc.dane;
const projektW = (id: string) => baza().projekty.find((p) => p.id === id)!;

// ---------- Atrapa Supabase ----------
const ID = { owner: "00000000-0000-4000-8000-0000000000a1", sprzedaz: "00000000-0000-4000-8000-0000000000a2", produkcja: "00000000-0000-4000-8000-0000000000a3", montaz: "00000000-0000-4000-8000-0000000000a4" };
const CZLONKOWIE: Record<string, Record<string, unknown>> = {
  [ID.owner]: { user_id: ID.owner, role: "owner", active: true, display_name: "Mateusz", project_ids: [], job_role: "Właściciel", access_profile: "sprzedaz" },
  [ID.sprzedaz]: { user_id: ID.sprzedaz, role: "employee", active: true, display_name: "Ola", project_ids: [], job_role: "Projektant", access_profile: "sprzedaz" },
  [ID.produkcja]: { user_id: ID.produkcja, role: "employee", active: true, display_name: "Kuba", project_ids: [P.prod, P.szkic], job_role: "Stolarz", access_profile: "produkcja" },
  [ID.montaz]: { user_id: ID.montaz, role: "employee", active: true, display_name: "Tomek", project_ids: [P.mont], job_role: "Montażysta", access_profile: "montaz" },
};
const TOKENY: Record<string, string> = { "t-owner": ID.owner, "t-sprzedaz": ID.sprzedaz, "t-produkcja": ID.produkcja, "t-montaz": ID.montaz };
const zapytaniaCzlonkow: string[] = [];
const oryginalnyFetch = globalThis.fetch;
const cadObjects = new Map<string, Uint8Array>();

process.env.SUPABASE_URL = "https://auth-test.invalid";
process.env.SUPABASE_PUBLISHABLE_KEY = "test-public-key";
process.env.SUPABASE_SECRET_KEY = "test-secret-key";
globalThis.fetch = (async (input: string | URL | Request, init: RequestInit = {}) => {
  const url = String(input instanceof Request ? input.url : input);
  if (!url.startsWith("https://auth-test.invalid")) return oryginalnyFetch(input, init);
  const metoda = (init.method ?? "GET").toUpperCase();
  if (url.includes("/storage/v1/bucket")) return Response.json({ id: "pan-stolarz-project-files", name: "pan-stolarz-project-files", public: false });
  if (url.includes("/storage/v1/object/")) {
    const key = new URL(url).pathname;
    if (metoda === "POST") { cadObjects.set(key, new Uint8Array(init.body as ArrayBuffer)); return Response.json({ Key: key }); }
    const bytes = cadObjects.get(key.replace("/object/authenticated/", "/object/"));
    return bytes ? new Response(bytes, {headers:{"content-type":"application/octet-stream"}}) : Response.json({message:"not found"}, {status:404});
  }
  if (url.includes("/auth/v1/user")) {
    const token = new Headers(init.headers).get("authorization")?.replace("Bearer ", "") ?? "";
    const id = TOKENY[token];
    return id ? Response.json({ id, email: `${token}@example.test`, aud: "authenticated", role: "authenticated" }) : Response.json({ message: "invalid" }, { status: 401 });
  }
  if (url.includes("pan_stolarz_members")) {
    zapytaniaCzlonkow.push(`${metoda} ${decodeURIComponent(url)}`);
    if (metoda !== "GET") return Response.json([]);
    const id = /user_id=eq\.([0-9a-f-]+)/.exec(url)?.[1];
    return Response.json(id && CZLONKOWIE[id] ? [CZLONKOWIE[id]] : []);
  }
  if (url.includes("stolarnia_baza")) {
    if (metoda === "GET") return Response.json([doc]);
    const body = JSON.parse(String(init.body));
    if (metoda === "PATCH") {
      const wersja = Number(/wersja=eq\.(\d+)/.exec(url)?.[1]);
      if (wersja !== doc.wersja) return Response.json([]);
      doc = { dane: body.dane, wersja: body.wersja };
      return Response.json([doc]);
    }
    return Response.json([doc]);
  }
  throw new Error(`Nieoczekiwane żądanie testu: ${metoda} ${new URL(url).pathname}`);
}) as typeof fetch;

const { app } = await import("./app.js");
let adres = "";
let serwer: ReturnType<typeof app.listen>;
before(async () => {
  serwer = app.listen(0, "127.0.0.1");
  await new Promise((ok) => serwer.once("listening", ok));
  adres = `http://127.0.0.1:${(serwer.address() as AddressInfo).port}`;
});
after(async () => {
  globalThis.fetch = oryginalnyFetch;
  await new Promise((ok) => serwer.close(ok));
  rmSync(katalog, { recursive: true, force: true });
});

const zadanie = async (metoda: string, sciezka: string, token?: string, body?: unknown) => {
  const r = await oryginalnyFetch(adres + sciezka, {
    method: metoda,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { "content-type": "application/json" } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const bufor = Buffer.from(await r.arrayBuffer());
  const tekst = bufor.toString("utf8");
  let json: any;
  try {
    json = JSON.parse(tekst);
  } catch {
    json = undefined;
  }
  return { status: r.status, json, tekst, bufor, typ: r.headers.get("content-type") ?? "" };
};
const tekstPdf = (bufor: Buffer, nazwa: string) => {
  const plik = join(katalog, `${nazwa}.pdf`);
  writeFileSync(plik, bufor);
  return execFileSync("pdftotext", [plik, "-"], { encoding: "utf8" });
};

test("pliki CAD HTTP: prywatny zapis, pobranie, deduplikacja i zakres profili", async () => {
  const { randomUUID } = await import("node:crypto");
  const base = `/api/v2/projects/${P.szkic}/files`;
  const text = "0\nSECTION\n2\nENTITIES\n0\nLINE\n8\nSCIANY\n10\n0\n20\n0\n11\n1000\n21\n2000\n0\nENDSEC\n0\nEOF\n";
  const body = { id: randomUUID(), name: "architekt.dxf", base64: Buffer.from(text).toString("base64") };
  assert.equal((await zadanie("GET", base)).status, 401);
  assert.equal((await zadanie("POST", base, "t-produkcja", body)).status, 403);
  assert.equal((await zadanie("GET", base, "t-produkcja")).status, 403);
  const result = await zadanie("POST", base, "t-owner", body);
  assert.equal(result.status, 200, result.tekst);
  assert.ok(!result.tekst.includes("objectKey"));
  const again = await zadanie("POST", base, "t-sprzedaz", { ...body, id: randomUUID() });
  assert.equal(again.json.id, result.json.id);
  assert.equal((await zadanie("GET", base, "t-sprzedaz")).json.length, 1);
  const content = await zadanie("GET", `${base}/${result.json.id}/content`, "t-sprzedaz");
  assert.equal(content.status, 200, content.tekst);
  assert.equal(Buffer.from(content.json.base64, "base64").toString(), text);
  assert.equal((await zadanie("GET", `/api/v2/projects/${P.mont}/files/${result.json.id}/content`, "t-owner")).status, 404);
  assert.equal((await zadanie("GET", `${base}/${result.json.id}/content`, "t-montaz")).status, 403);
});

// ---------- Macierz: każda trasa ma regułę ----------

test("każda chroniona trasa aplikacji ma regułę w macierzy (nowa trasa bez reguły = błąd testu)", () => {
  // Publiczne, rejestrowane przed bramką dostępu: logowanie, aktywacja, formularz zapytań, podgląd demo, healthz.
  const PUBLICZNE = new Set(["GET /healthz", "GET /api/v2/config", "POST /api/v2/login", "POST /api/v2/logout", "POST /api/v2/activate", "GET /api/v2/session", "POST /api/v2/requests", "GET /api/demo/dekory", "GET /api/demo/systemy-szuflad", "GET /api/demo/przelicznik-szuflad", "GET /api/v2/presentation/:token", "POST /api/v2/presentation/:token/comments"]);
  type Warstwa = { route?: { path: string | RegExp; methods: Record<string, boolean> } };
  const stos = (app as unknown as { _router: { stack: Warstwa[] } })._router.stack;
  const brak: string[] = [];
  let trasy = 0;
  for (const w of stos) {
    if (!w.route || typeof w.route.path !== "string") continue;
    const sciezka = w.route.path.replace(/:[a-z]+/gi, "x");
    for (const metoda of Object.keys(w.route.methods)) {
      if (metoda === "_all" || Object.keys(w.route.methods).length > 10) continue; // app.all("/mcp") = odpowiedź 405
      const klucz = `${metoda.toUpperCase()} ${w.route.path}`;
      trasy++;
      if (PUBLICZNE.has(klucz)) continue;
      if (!regulyTrasy(metoda, sciezka).length) brak.push(klucz);
    }
  }
  assert.ok(trasy > 80, `znaleziono ${trasy} tras`);
  assert.deepEqual(brak, []);
  for (const p of ["sprzedaz", "produkcja", "montaz"] as const) {
    assert.equal(dostepDoTrasy(p, "GET", "/api/nieznana"), false, "odmowa domyślna");
    assert.equal(dostepDoTrasy(p, "POST", "/mcp"), false, "MCP tylko właściciel");
  }
  assert.equal(dostepDoTrasy("wlasciciel", "GET", "/api/nieznana"), true);
  assert.equal(profilOsoby({ role: "employee" }), "produkcja", "brak profilu → najwęższy");
  assert.equal(profilOsoby({ role: "employee", access_profile: "admin" }), "produkcja");
  assert.equal(profilOsoby({ role: "owner", access_profile: "montaz" }), "wlasciciel");
});

test("macierz HTTP: profil × trasa (403 = odmowa bramki)", async () => {
  const s = P.szkic;
  const w = wydanie(P.prod);
  const wm = wydanie(P.mont);
  // [token, metoda, ścieżka, oczekiwany: "ok" (≠ 401/403) | kod]
  const przypadki: [string, string, string, "ok" | number, unknown?][] = [
    // sprzedaż: projektuje, wycenia, oferta; bez cenników, ustawień firmy, wydań, umów do zapisu, MCP i kont
    ["t-sprzedaz", "GET", "/api/projekty", "ok"],
    ["t-sprzedaz", "POST", "/api/projekty", "ok", { nazwa: "Kuchnia przy kliencie", sciany: [{ dlugoscMM: 2400 }] }],
    ["t-sprzedaz", "GET", `/api/projekty/${s}/analiza`, "ok"],
    ["t-sprzedaz", "GET", "/api/okucia-projektu/opcje", "ok"],
    ["t-sprzedaz", "GET", `/api/projekty/${s}/styl`, "ok"],
    ["t-sprzedaz", "POST", `/api/projekty/${s}/oferta.pdf`, "ok", {}],
    ["t-sprzedaz", "GET", `/api/projekty/${s}/umowy`, "ok"],
    ["t-sprzedaz", "POST", `/api/projekty/${s}/umowy`, 403, {}],
    ["t-sprzedaz", "GET", "/api/cennik/materialow", 403],
    ["t-sprzedaz", "PUT", `/api/materialy/${mat.id}`, 403, {}],
    ["t-sprzedaz", "PATCH", "/api/ustawienia", 403, { finanse: { marzaProcent: 1 } }],
    ["t-sprzedaz", "POST", `/api/dekory/x/material`, 403, {}],
    ["t-sprzedaz", "POST", `/api/projekty/${s}/wydania`, 403, {}],
    ["t-sprzedaz", "DELETE", `/api/projekty/${s}`, 403],
    ["t-sprzedaz", "GET", "/api/v2/members", 403],
    ["t-sprzedaz", "GET", "/api/v2/requests", 403],
    ["t-sprzedaz", "POST", "/api/v2/tasks", 403, {}],
    ["t-sprzedaz", "POST", "/mcp", 403, {}],
    // produkcja: wydania i pakiet P, uwagi; bez wyceny, umów, oferty, pakietu M i konstrukcji
    ["t-produkcja", "GET", "/api/projekty", "ok"],
    ["t-produkcja", "GET", `/api/projekty/${P.prod}/wydania`, "ok"],
    ["t-produkcja", "GET", `/api/projekty/${P.prod}/wydania/${w}/dokumentacja`, "ok"],
    ["t-produkcja", "GET", `/api/projekty/${P.prod}/wydania/${w}/dokumentacja.pdf`, "ok"],
    ["t-produkcja", "GET", `/api/projekty/${P.prod}/wydania/${w}/montaz.pdf`, 403],
    ["t-produkcja", "GET", `/api/projekty/${P.prod}`, 403],
    ["t-produkcja", "GET", `/api/projekty/${P.prod}/analiza`, 403],
    ["t-produkcja", "GET", `/api/projekty/${P.prod}/umowy`, 403],
    ["t-produkcja", "POST", `/api/projekty/${P.prod}/oferta.pdf`, 403, {}],
    ["t-produkcja", "GET", `/api/projekty/${P.prod}/formatki.csv`, 403],
    ["t-produkcja", "GET", `/api/projekty/${P.prod}/dokumentacja.pdf`, 403],
    ["t-produkcja", "PATCH", `/api/projekty/${P.prod}/moduly/x`, 403, { szerokoscMM: 1 }],
    ["t-produkcja", "GET", "/api/materialy", 403],
    ["t-produkcja", "GET", "/api/ustawienia", 403],
    ["t-produkcja", "GET", "/api/okucia", 403],
    ["t-produkcja", "GET", `/api/projekty/${P.inny}/wydania`, 404],
    ["t-produkcja", "GET", "/api/systemy-szuflad", "ok"],
    ["t-produkcja", "GET", "/api/v2/projects", "ok"],
    // montaż: wydania i pakiet M; bez pakietu P, cen i umów
    ["t-montaz", "GET", `/api/projekty/${P.mont}/wydania/${wm}/montaz.pdf`, "ok"],
    ["t-montaz", "GET", `/api/projekty/${P.mont}/wydania/${wm}/dokumentacja.pdf`, 403],
    ["t-montaz", "GET", `/api/projekty/${P.mont}/umowy`, 403],
    ["t-montaz", "GET", `/api/projekty/${P.mont}/analiza`, 403],
    ["t-montaz", "GET", `/api/projekty/${P.prod}/wydania`, 404],
    ["t-montaz", "GET", "/api/cennik/materialow", 403],
    ["t-montaz", "POST", "/mcp", 403, {}],
    // montaż: z dokumentacji v2 tylko skrócone karty montażowe, pełna techniczna = 403
    ["t-montaz", "GET", `/api/v2/projects/${P.mont}/documents.pdf?wydanie=${wm}&rewizja=${svc.wydania(P.mont)[0].rewizja}&rodzaj=montazowe`, "ok"],
    ["t-montaz", "GET", `/api/v2/projects/${P.mont}/documents.pdf?wydanie=${wm}&rewizja=${svc.wydania(P.mont)[0].rewizja}&rodzaj=techniczne`, 403],
    ["t-montaz", "GET", `/api/v2/projects/${P.mont}/documents.pdf?wydanie=${wm}&rewizja=${svc.wydania(P.mont)[0].rewizja}`, 403],
    ["t-produkcja", "GET", `/api/v2/projects/${P.prod}/documents.pdf?wydanie=${w}&rewizja=${svc.wydania(P.prod)[0].rewizja}&rodzaj=techniczne`, "ok"],
    // wielkość liter i ukośniki nie omijają reguł
    ["t-montaz", "GET", `/API/Projekty/${P.mont}/Umowy`, 403],
    ["t-montaz", "GET", `/api//projekty/${P.mont}/umowy/`, 403],
    // właściciel: wszystko
    ["t-owner", "GET", "/api/cennik/materialow", "ok"],
    ["t-owner", "GET", `/api/projekty/${P.inny}/analiza`, "ok"],
    // bez logowania
    [" ", "GET", "/api/projekty", 401],
  ];
  const zle: string[] = [];
  for (const [token, metoda, sciezka, oczek, body] of przypadki) {
    const r = await zadanie(metoda, sciezka, token.trim() || undefined, body);
    const ok = oczek === "ok" ? r.status !== 401 && r.status !== 403 && r.status !== 404 && r.status < 500 : r.status === oczek;
    if (!ok) zle.push(`${token} ${metoda} ${sciezka}: ${r.status} (oczekiwano ${oczek}) ${r.tekst.slice(0, 120)}`);
  }
  assert.deepEqual(zle, []);
  // Oferta nie ujawnia ścieżki pliku na serwerze.
  const of = await oryginalnyFetch(`${adres}/api/projekty/${s}/oferta.pdf`, { method: "POST", headers: { authorization: "Bearer t-sprzedaz", "content-type": "application/json" }, body: "{}" });
  assert.equal(of.status, 200);
  assert.equal(of.headers.get("x-oferta-plik"), null);
  await of.arrayBuffer();
});

test("sonda wycieków: charakterystyczne kwoty, kontakt i notatka CRM w odpowiedziach każdego profilu", async () => {
  const KWOTY: [string, RegExp][] = [["cena uzgodniona", /98765[.,]43/], ["cena zakupu", /4321[.,]77/], ["stawka", /123[.,]45/], ["notatka CRM", /CRM-TAJNE/], ["uwaga CRM", /CRM-UWAGA/], ["umowy", /"umovy"/]];
  const KONTAKT: [string, RegExp][] = [["telefon", /731-555-019/], ["adres", /Sondy 9/], ["e-mail", /sonda@example/]];
  const KOSZTY: [string, RegExp][] = [
    ["cena zakupu", /4321[.,]77/],
    ["stawka", /123[.,]45/],
    ["pola kosztów", /"(koszt|marza|narzut|zapasKoszt|korektaHandlowa|cenaJednostkowa|cenaReferencyjna|rabat|stawka|cennikMaterialow)[A-Za-z]*"/i],
  ];
  const wspolne = ["/api/systemy-szuflad", "/api/v2/projects"];
  const trasy: Record<string, { pid: string; trasy: string[]; zakazane: [string, RegExp][] }> = {
    "t-sprzedaz": {
      pid: P.szkic,
      zakazane: KOSZTY,
      trasy: ["/api/projekty", `/api/projekty/${P.szkic}`, `/api/projekty/${P.szkic}/analiza`, `/api/projekty/${P.szkic}/dokumentacja`, `/api/projekty/${P.szkic}/wydania`, `/api/projekty/${P.szkic}/wydania/${wydanie(P.szkic)}/dokumentacja`, `/api/projekty/${P.szkic}/umowy`, `/api/projekty/${P.szkic}/styl`, `/api/projekty/${P.szkic}/szkice`, "/api/materialy", "/api/okucia", "/api/ustawienia", "/api/okucia-katalog", "/api/okucia-katalog?widok=strona", "/api/okucia-projektu/opcje", "/api/katalog", "/api/dekory", `/api/v2/projects/${P.szkic}`, ...wspolne],
    },
    "t-produkcja": {
      pid: P.prod,
      zakazane: [...KWOTY, ...KONTAKT, ["nazwa klienta", /Sonda Klient/]],
      trasy: ["/api/projekty", `/api/projekty/${P.prod}/wydania`, `/api/projekty/${P.prod}/wydania/${wydanie(P.prod)}/dokumentacja`, `/api/v2/projects/${P.prod}`, `/api/v2/projects/${P.prod}/documents`, ...wspolne],
    },
    "t-montaz": {
      pid: P.mont,
      zakazane: KWOTY,
      trasy: ["/api/projekty", `/api/projekty/${P.mont}/wydania`, `/api/v2/projects/${P.mont}`, `/api/v2/projects/${P.mont}/documents`, ...wspolne],
    },
  };
  const wycieki: string[] = [];
  let sprawdzone = 0;
  for (const [token, { trasy: lista, zakazane }] of Object.entries(trasy)) {
    for (const t of lista) {
      const r = await zadanie("GET", t, token);
      if (r.status === 403 || r.status === 404) continue;
      if (r.status !== 200) {
        wycieki.push(`${token} ${t}: status ${r.status} ${r.tekst.slice(0, 100)}`);
        continue;
      }
      sprawdzone++;
      for (const [co, wzor] of zakazane) if (wzor.test(r.tekst)) wycieki.push(`${token} ${t}: ${co}`);
    }
  }
  // Sprzedaż widzi cenę ofertową i cenę uzgodnioną (decyzja a), ale nie koszt zakupu.
  const a = await zadanie("GET", `/api/projekty/${P.szkic}/analiza`, "t-sprzedaz");
  const std = a.json.warianty.find((x: { wariant: string }) => x.wariant === "standard");
  assert.ok(std.cenaBrutto > 0 && std.cenaNetto > 0, "cena ofertowa widoczna");
  assert.equal(a.json.projekt.cenaUzgodnionaBrutto, 98765.43);
  assert.deepEqual(Object.keys(a.json.ustawienia.finanse), ["vatProcent"]);
  // Produkcja: lista bez telefonu, tylko przydzielone projekty.
  const lp = await zadanie("GET", "/api/projekty", "t-produkcja");
  assert.deepEqual(lp.json.map((x: { id: string }) => x.id).sort(), [P.prod, P.szkic].sort());
  const lm = await zadanie("GET", "/api/projekty", "t-montaz");
  assert.equal(lm.json[0].telefon, KLIENT.telefon, "montaż widzi kontakt klienta");

  // PDF-y: pakiet P bez kontaktu i cen; pakiet M z adresem i kontaktem, bez cen.
  const pdfP = await zadanie("GET", `/api/projekty/${P.prod}/wydania/${wydanie(P.prod)}/dokumentacja.pdf`, "t-produkcja");
  assert.match(pdfP.typ, /pdf/);
  const tP = tekstPdf(pdfP.bufor, "pakiet-p");
  for (const [co, wzor] of [...KWOTY, ...KONTAKT, ["nazwa klienta", /Sonda Klient/] as [string, RegExp]]) if (wzor.test(tP)) wycieki.push(`PDF P: ${co}`);
  const pdfM = await zadanie("GET", `/api/projekty/${P.mont}/wydania/${wydanie(P.mont)}/montaz.pdf`, "t-montaz");
  const tM = tekstPdf(pdfM.bufor, "pakiet-m");
  assert.match(tM, /Sondy 9/, "pakiet M ma adres montażu");
  assert.match(tM, /731-555-019/, "pakiet M ma kontakt");
  for (const [co, wzor] of KWOTY) if (wzor.test(tM)) wycieki.push(`PDF M: ${co}`);

  assert.deepEqual(wycieki, []);
  assert.ok(sprawdzone >= 25, `sprawdzono ${sprawdzone} odpowiedzi`);
  // Kontrola sondy: właściciel widzi wszystkie wartości.
  const w = await zadanie("GET", `/api/projekty/${P.szkic}/analiza`, "t-owner");
  assert.ok(/98765[.,]43/.test(w.tekst) && /731-555-019/.test(w.tekst) && /123[.,]45/.test(w.tekst) && /CRM-TAJNE/.test(w.tekst) && /"marzaKwota"/.test(w.tekst));
});

test("przejścia statusów: produkcja Produkcja→Gotowe do montażu, montaż Gotowe do montażu→Zakończony", async () => {
  const pm = (id: string, token: string, body: unknown) => zadanie("PATCH", `/api/projekty/${id}`, token, body);
  assert.equal((await pm(P.prod, "t-produkcja", { nazwa: "x" })).status, 403);
  assert.equal((await pm(P.prod, "t-produkcja", { status: "zakonczony" })).status, 403);
  assert.equal((await pm(P.prod, "t-produkcja", { status: "gotoweDoMontazu", cenaUzgodnionaBrutto: 1 })).status, 403);
  assert.equal((await pm(P.szkic, "t-produkcja", { status: "gotoweDoMontazu" })).status, 403, "tylko z etapu Produkcja");
  assert.equal((await pm(P.mont, "t-montaz", { status: "szkic" })).status, 403);
  assert.equal((await pm(P.prod, "t-montaz", { status: "zakonczony" })).status, 404, "nieprzydzielony projekt");
  assert.equal(projektW(P.prod).status, "produkcja", "odrzucone żądania nie zmieniają danych");
  assert.equal(projektW(P.prod).nazwa, "Sonda produkcja");

  const ok = await pm(P.prod, "t-produkcja", { status: "gotoweDoMontazu" });
  assert.equal(ok.status, 200);
  // Odpowiedź PATCH dla warsztatu: tylko id i status — bez cen, klienta, CRM i uwag roboczych.
  assert.deepEqual(ok.json, { id: P.prod, status: "gotoweDoMontazu" });
  assert.ok(!/98765|CRM-|Sonda Klient|731-555|notatkiRobocze/.test(ok.tekst));
  assert.equal(projektW(P.prod).status, "gotoweDoMontazu");
  assert.equal((await pm(P.prod, "t-produkcja", { status: "zakonczony" })).status, 403, "produkcja nie zamyka montażu");
  const okM = await pm(P.mont, "t-montaz", { status: "zakonczony" });
  assert.equal(okM.status, 200);
  assert.deepEqual(okM.json, { id: P.mont, status: "zakonczony" });
  assert.equal(projektW(P.mont).status, "zakonczony");
});

test("sprzedaż: przywracanie stanu (cofnij) sprawdzane schematem; konstrukcja tylko na etapie Szkic/Wycena", async () => {
  const sciezka = `/api/projekty/${P.szkic}/stan`;
  const stan = { pomieszczenia: projektW(P.szkic).pomieszczenia, moduly: projektW(P.szkic).moduly };
  assert.equal((await zadanie("PUT", sciezka, "t-sprzedaz", { pomieszczenia: [], moduly: [] })).status, 400, "brak pomieszczeń");
  assert.equal((await zadanie("PUT", sciezka, "t-sprzedaz", { pomieszczenia: stan.pomieszczenia, moduly: [{ ...stan.moduly[0], szerokoscMM: "600" }] })).status, 400, "liczba jako tekst");
  assert.equal((await zadanie("PUT", sciezka, "t-sprzedaz", { pomieszczenia: stan.pomieszczenia, moduly: [{ ...stan.moduly[0], scianaId: "nie-ma" }] })).status, 400, "nieistniejąca ściana");
  assert.equal((await zadanie("PUT", sciezka, "t-sprzedaz", { pomieszczenia: stan.pomieszczenia, moduly: [stan.moduly[0], stan.moduly[0]] })).status, 400, "powtórzone id");
  assert.equal((await zadanie("PUT", sciezka, "t-sprzedaz", { pomieszczenia: stan.pomieszczenia, moduly: [{ ...stan.moduly[0], materialKorpusuId: "nie-ma" }] })).status, 400, "nieznany materiał");
  assert.equal(projektW(P.szkic).moduly.length, stan.moduly.length, "odrzucony stan nie zmienia projektu");
  assert.equal((await zadanie("PUT", sciezka, "t-sprzedaz", stan)).status, 200, "poprawna migawka");

  // Projekt po akceptacji: konstrukcja tylko właściciel; uwagi, oferta i kopia — tak.
  const pid = P.inny; // status produkcja
  assert.equal((await zadanie("POST", `/api/projekty/${pid}/moduly`, "t-sprzedaz", { katalogId: "base-drawers-600" })).status, 403);
  assert.equal((await zadanie("PUT", `/api/projekty/${pid}/stan`, "t-sprzedaz", { pomieszczenia: projektW(pid).pomieszczenia, moduly: [] })).status, 403);
  assert.equal((await zadanie("POST", `/api/projekty/${pid}/szybki-uklad`, "t-sprzedaz", { typ: "I" })).status, 403);
  assert.equal((await zadanie("PUT", `/api/projekty/${pid}/okucia`, "t-sprzedaz", { okucia: null })).status, 403);
  assert.equal((await zadanie("PUT", `/api/projekty/${pid}/okucia`, "t-sprzedaz", null)).status, 400, "zły JSON = 400, nie 500");
  assert.equal(projektW(pid).moduly.length, 1, "konstrukcja bez zmian");
  assert.equal((await zadanie("POST", `/api/projekty/${pid}/notatki`, "t-sprzedaz", { tekst: "Klient pyta o termin" })).status, 200);
  assert.notEqual((await zadanie("POST", `/api/projekty/${pid}/oferta.pdf`, "t-sprzedaz", {})).status, 403);
  assert.equal((await zadanie("POST", `/api/projekty/${pid}/moduly`, "t-owner", { katalogId: "base-drawers-600" })).status, 200, "właściciel tak");
});

test("sprzedaż: cena uzgodniona i status tylko na etapie Szkic/Wycena; akceptacja i dalej — właściciel", async () => {
  const pm = (token: string, body: unknown) => zadanie("PATCH", `/api/projekty/${P.szkic}`, token, body);
  assert.equal((await pm("t-sprzedaz", { status: "wycena", cenaUzgodnionaBrutto: 15000 })).status, 200);
  assert.equal(projektW(P.szkic).cenaUzgodnionaBrutto, 15000);
  assert.equal((await pm("t-sprzedaz", { status: "zaakceptowany" })).status, 403);
  assert.equal(projektW(P.szkic).status, "wycena");
  assert.equal((await pm("t-owner", { status: "zaakceptowany" })).status, 200);
  assert.equal((await pm("t-sprzedaz", { cenaUzgodnionaBrutto: 1000 })).status, 403);
  assert.equal((await pm("t-sprzedaz", { status: "wycena" })).status, 403);
  assert.equal(projektW(P.szkic).cenaUzgodnionaBrutto, 15000);
  assert.equal((await pm("t-sprzedaz", { terminMontazu: "2026-12-01" })).status, 200, "pozostałe dane tematu tak");
});

test("uwagi z warsztatu są podpisane profilem i imieniem z konta", async () => {
  const r = await zadanie("POST", `/api/projekty/${P.prod}/notatki`, "t-produkcja", { tekst: "[Montaż] brak zawiasów" });
  assert.equal(r.status, 200);
  assert.equal(r.json.tekst, "[Produkcja · Kuba] brak zawiasów");
  assert.equal((await zadanie("PATCH", `/api/projekty/${P.prod}/notatki/${r.json.id}`, "t-produkcja", { zalatwiona: true })).status, 403);
  assert.equal(podpisUwagi("montaz", "Tomek", "[Montaż · Tomek] ok"), "[Montaż · Tomek] ok");
  assert.equal(podpisUwagi("montaz", "Tomek", "[Produkcja · Kuba] [Właściciel] podszycie"), "[Montaż · Tomek] podszycie");
  const pr = filtrujOdpowiedz("produkcja", { notatkiRobocze: [{ tekst: "Klient chce rabat CRM" }, { tekst: "[Produkcja · Kuba] brak" }, { tekst: "[Montaż] front" }, { tekst: "[Produkcjaxx] nie" }] }) as { notatkiRobocze: { tekst: string }[] };
  assert.deepEqual(pr.notatkiRobocze.map((n) => n.tekst), ["[Produkcja · Kuba] brak", "[Montaż] front"]);
  const sp = filtrujOdpowiedz("sprzedaz", { materialy: [{ nazwa: "P", rabatProcent: 0, notatki: "zakup 45,10 zł/m2" }], projekt: { notatki: "umówione 15 000 zł" } }) as any;
  assert.equal(sp.materialy[0].notatki, "zakup [kwota ukryta]/m2", "kwoty w notatkach materiału ukryte");
  assert.equal(sp.projekt.notatki, "umówione 15 000 zł", "notatki projektu sprzedaży bez zmian");
});

test("konta: tylko właściciel; własne konto i wiersze właściciela nie są zmieniane (ochrona ostatniego właściciela)", async () => {
  assert.equal((await zadanie("PATCH", `/api/v2/members/${ID.owner}`, "t-owner", { active: false, project_ids: [] })).status, 400);
  assert.equal((await zadanie("PATCH", `/api/v2/members/${ID.produkcja}`, "t-sprzedaz", { active: false, project_ids: [] })).status, 403);
  assert.equal((await zadanie("PATCH", `/api/v2/members/${ID.produkcja}`, "t-owner", { active: true, project_ids: [], access_profile: "admin" })).status, 400);
  zapytaniaCzlonkow.length = 0;
  await zadanie("PATCH", `/api/v2/members/${ID.produkcja}`, "t-owner", { active: true, project_ids: [P.prod], access_profile: "montaz" });
  const aktualizacja = zapytaniaCzlonkow.find((q) => q.startsWith("PATCH"));
  assert.ok(aktualizacja?.includes("role=eq.employee"), `aktualizacja tylko wierszy pracowników: ${aktualizacja}`);
  const utworz = await zadanie("POST", "/api/v2/members", "t-owner", { operation_id: "00000000-0000-4000-8000-000000000099", display_name: "Nowy", email: "n@example.test", access_profile: "kierownik" });
  assert.equal(utworz.status, 400, "nieznany profil odrzucony");
  const bezProfilu = await zadanie("POST", "/api/v2/members", "t-owner", { operation_id: "00000000-0000-4000-8000-000000000098", display_name: "Nowy", email: "n2@example.test" });
  assert.equal(bezProfilu.status, 400, "profil dostępu jest wymagany");
});

// ---------- Czyste funkcje ----------

test("filtr pól: sprzedaż bez kosztów zakupu, produkcja bez cen i kontaktu, montaż bez cen", () => {
  const dane = {
    producent: "Blum",
    cenaUzgodnionaBrutto: 1,
    umovy: [{ cena: 1 }],
    notatki: "CRM",
    klient: { nazwa: "K", telefon: "1", adres: "a", email: "e" },
    warianty: [{ wariant: "standard", cenaBrutto: 10, cenaNetto: 8, marzaKwota: 2, kosztBazowyNetto: 5, korektaHandlowaNetto: 1, pozycje: [{ nazwa: "x", kosztNetto: 1, cenaJednostkowaNetto: 1, uwagi: "stawka 50 zł/h" }] }],
    materialy: [{ id: "m", cenaNetto: 50, rabatProcent: 0, nazwa: "Płyta" }],
    opcje: [{ id: "o", cenaNetto: 7, maCene: true }],
    finanse: { marzaProcent: 30, vatProcent: 23 },
    opis: "Zawias. Średnia rynkowa brutto 12.34 zł (research).",
    wstawka: "zostaje",
  };
  const m = filtrujOdpowiedz("montaz", dane) as Record<string, any>;
  assert.equal(m.producent, "Blum");
  assert.equal(m.wstawka, "zostaje");
  for (const k of ["cenaUzgodnionaBrutto", "umovy", "warianty", "finanse", "notatki"]) assert.equal(m[k], undefined, k);
  assert.equal(m.materialy[0].cenaNetto, undefined);
  assert.equal(m.klient.telefon, "1");
  const pr = filtrujOdpowiedz("produkcja", dane) as Record<string, any>;
  assert.equal(pr.klient, undefined, "produkcja bez danych klienta (także nazwy, jak w pakiecie P)");
  const s = filtrujOdpowiedz("sprzedaz", dane) as Record<string, any>;
  assert.equal(s.warianty[0].cenaBrutto, 10);
  assert.equal(s.warianty[0].cenaNetto, 8, "cena ofertowa netto zostaje");
  assert.equal(s.warianty[0].marzaKwota, undefined);
  assert.equal(s.warianty[0].korektaHandlowaNetto, undefined);
  assert.deepEqual(s.warianty[0].pozycje[0], { nazwa: "x", uwagi: "stawka [kwota ukryta]/h" });
  assert.equal(s.materialy[0].cenaNetto, undefined);
  assert.equal(s.materialy[0].rabatProcent, undefined);
  assert.equal(s.opcje[0].cenaNetto, undefined, "cena zakupu okucia w opcjach projektu");
  assert.equal(s.opcje[0].maCene, true);
  assert.deepEqual(s.finanse, { vatProcent: 23 });
  assert.equal(s.opis, "Zawias.");
  assert.equal(s.cenaUzgodnionaBrutto, 1);
  assert.equal(s.klient.telefon, "1");
  assert.equal(filtrujOdpowiedz("wlasciciel", dane), dane);
  assert.equal(dane.warianty[0].marzaKwota, 2, "filtr nie zmienia danych źródłowych");
});

test("przejścia statusów (czysta funkcja)", () => {
  assert.equal(sprawdzZmianeProjektu("produkcja", "produkcja", { status: "gotoweDoMontazu" }), null);
  assert.ok(sprawdzZmianeProjektu("produkcja", "wZamowieniu", { status: "gotoweDoMontazu" }));
  assert.ok(sprawdzZmianeProjektu("produkcja", "produkcja", { status: "zakonczony" }));
  assert.equal(sprawdzZmianeProjektu("montaz", "gotoweDoMontazu", { status: "zakonczony" }), null);
  assert.ok(sprawdzZmianeProjektu("montaz", "gotoweDoMontazu", { status: "zakonczony", notatki: "x" }));
  assert.ok(sprawdzZmianeProjektu("montaz", "produkcja", { status: "zakonczony" }));
  assert.equal(sprawdzZmianeProjektu("sprzedaz", "szkic", { status: "wycena", cenaUzgodnionaBrutto: 5 }), null);
  assert.ok(sprawdzZmianeProjektu("sprzedaz", "wycena", { status: "zaakceptowany" }));
  assert.ok(sprawdzZmianeProjektu("sprzedaz", "produkcja", { cenaUzgodnionaBrutto: 5 }));
  assert.equal(sprawdzZmianeProjektu("sprzedaz", "produkcja", { status: "produkcja", nazwa: "x" }), null, "status bez zmiany");
  assert.equal(sprawdzZmianeProjektu("wlasciciel", "zakonczony", { status: "szkic" }), null);
});

test("prezentacje HTTP: właściciel tworzy, klient odczytuje tylko migawkę, pracownik nie udostępnia",async()=>{
  const {randomUUID}=await import("node:crypto");
  const {freshFurniture,carcass}=await import("../core/furniture.js");
  const model=freshFurniture();model.plates=carcass(model,randomUUID);
  const id=randomUUID();
  assert.equal((await zadanie("PUT","/api/v2/furniture","t-owner",{id,version:0,model})).status,200);
  const created=await zadanie("POST",`/api/v2/furniture/${id}/presentations`,"t-owner",{version:1});
  assert.equal(created.status,200);
  assert.match(created.json.token,/^[a-f0-9]{64}$/);
  assert.equal((await zadanie("POST",`/api/v2/furniture/${id}/presentations`,"t-produkcja",{version:1})).status,403);
  assert.equal((await zadanie("GET",`/api/v2/furniture/${id}/presentations`,"t-produkcja")).status,403);
  const path=`/api/v2/presentation/${created.json.token}`;
  const publicView=await zadanie("GET",path);
  assert.equal(publicView.status,200);
  assert.equal(publicView.json.model.name,model.name);
  assert.ok(!publicView.tekst.includes("tokenHash"));
  assert.ok(!publicView.tekst.includes("createdBy"));
  const origin=process.env.PAN_STOLARZ_ORIGIN??adres;
  const response=await oryginalnyFetch(adres+path+"/comments",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify({id:randomUUID(),text:"Proszę zmienić front"})});
  assert.equal(response.status,200);
  const hostile=await oryginalnyFetch(adres+path+"/comments",{method:"POST",headers:{origin:"https://evil.invalid","content-type":"application/json"},body:JSON.stringify({id:randomUUID(),text:"Błąd"})});
  assert.equal(hostile.status,403);
  assert.equal((await zadanie("GET",path)).json.comments.length,1);
  assert.equal((await zadanie("DELETE",`/api/v2/presentations/${created.json.id}`,"t-owner")).status,200);
  assert.equal((await zadanie("GET",path)).status,404);
  assert.equal((await zadanie("GET","/api/v2/furniture")).status,401);
});
