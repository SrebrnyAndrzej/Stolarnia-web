import { DEKORY, kluczDekoru, obrazDekoru, wariantyDekoru, materialDekoru } from "../core/catalog/decors.js";
import { umowaPdf } from "../export/umowa.js";
import { PRODUKTY_OKUC } from "../core/catalog/hardware-products.js";
import express, { type NextFunction, type Request, type Response } from "express";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { KATALOG_MODULOW } from "../core/catalog/modules.js";
import { konwerterDwg } from "../core/dwg.js";
import { utworzSerwerMcp } from "../mcp/server.js";
import { BladUslugi, Stolarnia } from "../service.js";
import { KonfliktZapisu, Magazyn, konfiguracjaChmury } from "../store/store.js";

// Aplikacja: REST API dla przeglądarki + MCP (Streamable HTTP, bezstanowy) pod /mcp + statyczny frontend z dist/web.
// Oba interfejsy używają tej samej usługi i tego samego magazynu. Uruchamiana lokalnie przez index.ts,
// na Vercelu jako funkcja (api/index.js). W trybie chmurowym (Supabase) baza jest wczytywana na początku
// żądania i zapisywana przed wysłaniem odpowiedzi.

// Na Vercelu dysk jest tylko do odczytu i ulotny — bez konfiguracji Supabase API zwraca jasny komunikat
// zamiast zapisywać dane, które zniknęłyby po restarcie funkcji.
const brakBazyWChmurze = !!process.env.VERCEL && !konfiguracjaChmury();
export const s = new Stolarnia(new Magazyn(brakBazyWChmurze ? "/tmp/stolarnia" : undefined));
export const app = express();
app.use(express.json({ limit: "30mb" }));
if (brakBazyWChmurze) {
  app.use(["/api", "/mcp"], (_req, res) => {
    res.status(503).json({ blad: "Brak konfiguracji bazy danych: ustaw SUPABASE_URL i SUPABASE_SECRET_KEY w ustawieniach projektu Vercel (Settings → Environment Variables) i wdroż ponownie." });
  });
}

if (s.magazyn.wChmurze) {
  // Jedna instancja funkcji może obsługiwać kilka żądań naraz — kolejkujemy je, bo baza jest w pamięci instancji.
  let kolejka: Promise<void> = Promise.resolve();
  app.use(["/api", "/mcp"], async (_req, res, next) => {
    let zwolnij!: () => void;
    const poprzednie = kolejka;
    kolejka = new Promise<void>((ok) => (zwolnij = ok));
    let zwolniono = false;
    const koniec = () => {
      if (!zwolniono) {
        zwolniono = true;
        zwolnij();
      }
    };
    res.on("finish", koniec);
    res.on("close", koniec);
    await poprzednie;
    try {
      await s.magazyn.zaladuj();
    } catch (e) {
      return next(e);
    }
    // Odpowiedzi wysyłane z pominięciem api() (PDF, CSV, CAD, MCP): zapis przed zakończeniem odpowiedzi.
    const end = res.end.bind(res) as (...a: unknown[]) => Response;
    res.end = ((...args: unknown[]) => {
      s.magazyn.utrwal().then(
        () => end(...args),
        (e) => {
          console.error("Nie zapisano zmian w bazie:", e);
          end(...args);
        },
      );
      return res;
    }) as typeof res.end;
    next();
  });
}

type Handler = (req: Request) => unknown;
const api = (fn: Handler) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wynik = await fn(req);
    // Zapis przed odpowiedzią, żeby konflikt zapisu wrócił jako błąd (409), a nie po cichu.
    await s.magazyn.utrwal();
    res.json(wynik ?? { ok: true });
  } catch (e) {
    next(e);
  }
};

const p = (req: Request, k: string) => String(req.params[k]);

// Katalogi i ustawienia
app.use("/api/okucia-katalog/obrazy", express.static(join(process.cwd(), "docs/okucia/produkty/obrazy")));
app.get("/api/okucia-katalog", api(() => PRODUKTY_OKUC));
app.post("/api/okucia-katalog/:id/dodaj", api(r => s.dodajProduktOkucia(p(r, "id"), r.body?.cenaNetto)));
app.use("/api/dekory/obrazy", express.static(join(process.cwd(), "docs/materialy/obrazy")));
app.get("/api/dekory", api(() => DEKORY.map(d => ({ ...d, key: kluczDekoru(d), obraz: obrazDekoru(d) }))));
app.get("/api/dekory/:key", api(r => {
  const d = DEKORY.find(x => kluczDekoru(x) === p(r, "key"));
  if (!d) throw new BladUslugi("Nieznany dekor.");
  return { ...d, warianty: wariantyDekoru(d) };
}));
app.post("/api/dekory/:key/material", api(r => {
  let m;
  try { m = materialDekoru(p(r, "key"), r.body); }
  catch (e) { throw new BladUslugi((e as Error).message); }
  // Ponowne dodanie nie nadpisuje ceny ani zmian użytkownika.
  return s.materialy().find(x => x.id === m.id) ?? s.zapiszMaterial(m);
}));
app.get("/api/katalog", api(() => KATALOG_MODULOW));
app.get("/api/materialy", api((r) => s.materialy({ typ: r.query.typ as string | undefined, szukaj: r.query.szukaj as string | undefined, tylkoAktywne: r.query.tylkoAktywne === "true" })));
app.post("/api/materialy", api((r) => s.zapiszMaterial(r.body)));
app.put("/api/materialy/:id", api((r) => s.zapiszMaterial({ ...r.body, id: p(r, "id") })));
app.get("/api/okucia", api(() => s.okucia()));
app.put("/api/okucia/:id", api((r) => s.zapiszOkucie({ ...r.body, id: p(r, "id") })));
app.get("/api/ustawienia", api(() => s.ustawienia()));
app.patch("/api/ustawienia", api((r) => s.zmienUstawienia(r.body)));

// Umowy są zapisanymi kopiami danych, niezależnymi od przyszłych zmian projektu.
app.get("/api/projekty/:id/umowy", api(r => s.umowy(p(r, "id"))));
app.post("/api/projekty/:id/umowy", api(r => s.dodajUmowe(p(r, "id"), r.body)));
app.get("/api/projekty/:id/umowy/:uid/pdf", async (req, res, next) => {
  try {
    const u = s.umowa(p(req, "id"), p(req, "uid"));
    const pdf = await umowaPdf(u);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Disposition", `attachment; filename="umowa-${u.id}.pdf"`);
    res.send(pdf);
  } catch (e) { next(e); }
});

// Projekty
app.get("/api/projekty", api(() => s.projekty()));
app.post("/api/projekty", api((r) => s.utworzProjekt(r.body)));
app.get("/api/projekty/:id", api((r) => s.projekt(p(r, "id"))));
app.patch("/api/projekty/:id", api((r) => s.zmienProjekt(p(r, "id"), r.body)));
app.delete("/api/projekty/:id", api((r) => s.usunProjekt(p(r, "id"))));
// Notatki robocze tematu (mikro CRM)
app.post("/api/projekty/:id/notatki", api((r) => s.dodajNotatke(p(r, "id"), r.body?.tekst)));
app.patch("/api/projekty/:id/notatki/:nid", api((r) => s.zmienNotatke(p(r, "id"), p(r, "nid"), r.body ?? {})));
app.delete("/api/projekty/:id/notatki/:nid", api((r) => s.usunNotatke(p(r, "id"), p(r, "nid"))));
app.post("/api/projekty/:id/duplikuj", api((r) => s.duplikujProjekt(p(r, "id"), r.body?.nazwa)));

app.post("/api/projekty/:id/pomieszczenia", api((r) => s.dodajPomieszczenie(p(r, "id"), r.body)));
app.patch("/api/projekty/:id/pomieszczenia/:pid", api((r) => s.zmienPomieszczenie(p(r, "id"), p(r, "pid"), r.body)));
app.post("/api/projekty/:id/pomieszczenia/:pid/sciany", api((r) => s.dodajSciane(p(r, "id"), p(r, "pid"), r.body)));
app.patch("/api/projekty/:id/sciany/:sid", api((r) => s.zmienSciane(p(r, "id"), p(r, "sid"), r.body)));
app.delete("/api/projekty/:id/sciany/:sid", api((r) => s.usunSciane(p(r, "id"), p(r, "sid"))));

// Import CAD: klient wysyła plik (DXF lub DWG) jako base64; DWG jest konwertowany po stronie serwera.
const trescCad = (body: { tresc?: string; base64?: string }) => (body.base64 ? s.trescCad(Buffer.from(body.base64, "base64")) : Promise.resolve(body.tresc ?? ""));
app.post("/api/cad/analiza", (req, res, next) => trescCad(req.body).then((t) => res.json(s.analizaDxf(t, req.body))).catch(next));
app.post("/api/projekty/:id/import-cad", (req, res, next) => trescCad(req.body).then((t) => res.json(s.importujDxf(p(req, "id"), t, req.body))).catch(next));
app.get("/api/cad/konwerter", api(() => ({ dwg: konwerterDwg() })));
app.put("/api/projekty/:id/stan", api((r) => s.przywrocStan(p(r, "id"), r.body)));
app.post("/api/projekty/:id/luka", api((r) => s.wypelnijLuke(p(r, "id"), r.body.scianaId, r.body.xMM, r.body.szerokoscMM, !!r.body.wiszacy)));
app.post("/api/projekty/:id/moduly", api((r) => s.dodajModul(p(r, "id"), r.body)));
app.patch("/api/projekty/:id/moduly/:mid", api((r) => s.zmienModul(p(r, "id"), p(r, "mid"), r.body)));
app.delete("/api/projekty/:id/moduly/:mid", api((r) => s.usunModul(p(r, "id"), p(r, "mid"))));
app.post("/api/projekty/:id/moduly/:mid/duplikuj", api((r) => s.duplikujModul(p(r, "id"), p(r, "mid"))));

app.get("/api/projekty/:id/analiza", api((r) => s.analiza(p(r, "id"))));
app.get("/api/projekty/:id/dokumentacja", api((r) => s.dokumentacja(p(r, "id"))));
app.get("/api/projekty/:id/dokumentacja.pdf", (req, res, next) => {
  const lista = (k: string) => (req.query[k] ? String(req.query[k]).split(",") : undefined);
  s.dokumentacjaPdf(p(req, "id"), { czesci: lista("czesc"), moduly: lista("modul"), skrocony: req.query.skrocony === "1" })
    .then((pdf) => {
      const rew = s.projekt(p(req, "id")).rewizja;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="dokumentacja-${p(req, "id")}-rew${rew}.pdf"`);
      res.send(pdf);
    })
    .catch(next);
});
// Szkice wstępne dla klienta: ?rodzaj=dolny|wysoki|oba, opcjonalnie &dolne=D,A,B&wysokie=C
app.get("/api/projekty/:id/szkice", api((r) => s.scianySzkicow(p(r, "id"))));
app.get("/api/projekty/:id/szkic.pdf", (req, res, next) => {
  const rodzaj = String(req.query.rodzaj ?? "oba");
  const lista = (k: string) => (req.query[k] ? String(req.query[k]).split(",") : undefined);
  s.szkicePdf(p(req, "id"), { dolny: rodzaj !== "wysoki", wysoki: rodzaj !== "dolny", kolejnoscDolnych: lista("dolne"), scianyWysokie: lista("wysokie") })
    .then((pdf) => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="szkic-${rodzaj}-${p(req, "id")}.pdf"`);
      res.send(pdf);
    })
    .catch(next);
});
app.post("/api/projekty/:id/oferta.pdf", (req, res, next) => {
  s.ofertaPdf(p(req, "id"), req.body ?? {})
    .then((pdf) => {
      // Lokalnie kopia oferty trafia do katalogu danych (data/oferty); na Vercelu nie ma trwałego dysku.
      if (!process.env.VERCEL) {
        const katalog = join(process.env.STOLARNIA_DATA ?? join(process.cwd(), "data"), "oferty");
        mkdirSync(katalog, { recursive: true });
        const plik = join(katalog, `oferta-${p(req, "id")}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.pdf`);
        writeFileSync(plik, pdf);
        res.setHeader("X-Oferta-Plik", encodeURIComponent(plik));
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="oferta-${p(req, "id")}.pdf"`);
      res.send(pdf);
    })
    .catch(next);
});
app.get("/api/projekty/:id/formatki.csv", (req, res, next) => {
  try {
    const csv = s.formatkiCSV(p(req, "id"));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="formatki-${p(req, "id")}.csv"`);
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

// MCP po HTTP — bezstanowo: nowy serwer i transport na każde żądanie.
app.post("/mcp", async (req, res) => {
  const server = utworzSerwerMcp(s);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
app.all("/mcp", (_req, res) => {
  res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Metoda niedozwolona (serwer bezstanowy)." }, id: null });
});

// Frontend
const web = join(process.cwd(), "dist", "web");
if (existsSync(web)) {
  app.use(express.static(web));
  app.get(/^\/(?!api|mcp).*/, (_req, res) => res.sendFile(join(web, "index.html")));
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof BladUslugi ? 400 : err instanceof KonfliktZapisu ? 409 : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ blad: err.message });
});
