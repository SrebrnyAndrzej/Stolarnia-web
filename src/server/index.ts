import express, { type NextFunction, type Request, type Response } from "express";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { KATALOG_MODULOW } from "../core/catalog/modules.js";
import { konwerterDwg } from "../core/dwg.js";
import { utworzSerwerMcp } from "../mcp/server.js";
import { BladUslugi, Stolarnia } from "../service.js";

// Serwer aplikacji: REST API dla przeglądarki + MCP (Streamable HTTP, bezstanowy) pod /mcp
// + statyczny frontend z dist/web. Oba interfejsy używają tej samej usługi i tego samego pliku danych.

const s = new Stolarnia();
const app = express();
app.use(express.json({ limit: "30mb" }));

type Handler = (req: Request) => unknown;
const api = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  try {
    const wynik = fn(req);
    res.json(wynik ?? { ok: true });
  } catch (e) {
    next(e);
  }
};

const p = (req: Request, k: string) => String(req.params[k]);

// Katalogi i ustawienia
app.get("/api/katalog", api(() => KATALOG_MODULOW));
app.get("/api/materialy", api((r) => s.materialy({ typ: r.query.typ as string | undefined, szukaj: r.query.szukaj as string | undefined })));
app.post("/api/materialy", api((r) => s.zapiszMaterial(r.body)));
app.put("/api/materialy/:id", api((r) => s.zapiszMaterial({ ...r.body, id: p(r, "id") })));
app.get("/api/okucia", api(() => s.okucia()));
app.put("/api/okucia/:id", api((r) => s.zapiszOkucie({ ...r.body, id: p(r, "id") })));
app.get("/api/ustawienia", api(() => s.ustawienia()));
app.patch("/api/ustawienia", api((r) => s.zmienUstawienia(r.body)));

// Projekty
app.get("/api/projekty", api(() => s.projekty()));
app.post("/api/projekty", api((r) => s.utworzProjekt(r.body)));
app.get("/api/projekty/:id", api((r) => s.projekt(p(r, "id"))));
app.patch("/api/projekty/:id", api((r) => s.zmienProjekt(p(r, "id"), r.body)));
app.delete("/api/projekty/:id", api((r) => s.usunProjekt(p(r, "id"))));
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
  const status = err instanceof BladUslugi ? 400 : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ blad: err.message });
});

const port = Number(process.env.PORT ?? 3210);
app.listen(port, () => {
  console.log(`Stolarnia Online: http://localhost:${port}  (API /api, MCP /mcp, dane: ${s.magazyn.plik})`);
});
