import { drawerSystems, calculateDrawer, previewCalculator } from "./drawer-preview.js";
import { taskCreate, taskUpdate, requireWorkshop, taskFailure } from "./tasks.js";
import { DEKORY, artykulyDekoru, kluczDekoru, obrazDekoru, wariantyDekoru, materialDekoru } from "../core/catalog/decors.js";
import { umowaPdf } from "../export/umowa.js";
import { PRODUKTY_OKUC } from "../core/catalog/hardware-products.js";
import { PROFILE_SZUFLAD } from "../core/catalog/drawers.js";
import express, { type NextFunction, type Request, type Response } from "express";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { KATALOG_MODULOW } from "../core/catalog/modules.js";
import { konwerterDwg } from "../core/dwg.js";
import { utworzSerwerMcp } from "../mcp/server.js";
import { jsonBezMigawek, BladUslugi, Stolarnia } from "../service.js";
import { KonfliktZapisu, Magazyn, konfiguracjaChmury } from "../store/store.js";
import { z } from "zod";
import type { WariantWyceny } from "../core/types.js";
import { AccessError, createAccess, mayReadProject, type Principal } from "./access.js";
import { projectSummary, technicalView } from "./technical.js";
import { documentSource, requireTechnicalDocuments, technicalDocuments } from "./documents.js";
import { createHmac } from "node:crypto";
import { createEmployee, employeeActivation, memberFields, memberUpdate } from "./members.js";
import { saveFurniture, furnitureConstruction } from "./furniture.js";
import { prepareFurniture, preparationMaterials } from "./furniture-preparation.js";
import { projectFileObjects, listProjectFiles, uploadProjectFile, readProjectFile } from "./project-files.js";
import { createFurniturePresentation,readFurniturePresentation,commentFurniturePresentation,listFurniturePresentations,revokeFurniturePresentation } from "./furniture-presentations.js";
import { savePurchaseOrder, exportPurchaseOrder } from "./purchasing.js";
import { MUSSI_CONNECTION } from "../core/purchasing.js";
import { filtrujOdpowiedz, podpisUwagi, profilOsoby, projektZTrasy, sprawdzZapisSprzedazy, sprawdzZmianeProjektu, type Profil } from "./uprawnienia.js";

// Aplikacja: REST API dla przeglądarki + MCP (Streamable HTTP, bezstanowy) pod /mcp + statyczny frontend z dist/web.
// Oba interfejsy używają tej samej usługi i tego samego magazynu. Uruchamiana lokalnie przez index.ts,
// na Vercelu jako funkcja (api/index.js). W trybie chmurowym (Supabase) baza jest wczytywana na początku
// żądania i zapisywana przed wysłaniem odpowiedzi.

// Na Vercelu dysk jest tylko do odczytu i ulotny — bez konfiguracji Supabase API zwraca jasny komunikat
// zamiast zapisywać dane, które zniknęłyby po restarcie funkcji.
const brakBazyWChmurze = !!process.env.VERCEL && !konfiguracjaChmury();
export const s = new Stolarnia(new Magazyn(brakBazyWChmurze ? "/tmp/stolarnia" : undefined));
export const app = express();
app.get("/healthz", (_req, res) => { res.setHeader("Cache-Control", "no-store"); res.json({ status: "ok", service: "pan-stolarz" }); });
app.use(express.json({ limit: "30mb" }));
const access = createAccess();
app.get("/api/v2/config", (_req, res) => { res.setHeader("Cache-Control", "no-store"); res.json({ authReady: access.configured }); });
app.post("/api/v2/login", access.login);
app.post("/api/v2/logout", access.logout);
app.post("/api/v2/activate", access.activate);
app.get("/api/v2/session", async (req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  try { res.json(await access.identify(req)); } catch (error) { access.fail(res, error); }
});
const requestSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254), kind: z.enum(["kuchnia", "szafa", "inne"]), city: z.string().trim().min(2).max(120), description: z.string().trim().min(10).max(6000), website: z.string().max(0).optional(), submission_id: z.string().uuid() });
app.post("/api/v2/requests", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    access.checkOrigin(req);
    if (!access.configured || !access.admin) throw new AccessError(503, "Formularz nie jest jeszcze uruchomiony. Spróbuj ponownie później.");
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) throw new AccessError(400, "Uzupełnij imię, e-mail, miejscowość i opis projektu (10–6000 znaków).");
    const { website: _trap, submission_id, ...payload } = parsed.data;
    const ip = process.env.VERCEL ? req.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.ip ?? "unknown" : req.ip ?? "unknown";
    const bucket_key = createHmac("sha256", process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!).update(ip).digest("hex");
    const { data, error } = await access.admin.rpc("pan_stolarz_submit_request", { payload, bucket_key, submission_id });
    if (error?.message.includes("request_limit_exceeded")) throw new AccessError(429, "Wysłano zbyt wiele zapytań. Spróbuj ponownie za godzinę.");
    if (error) throw new AccessError(503, "Nie udało się zapisać zapytania. Twoje dane pozostały w formularzu.");
    res.status(201).json({ id: data });
  } catch (error) { access.fail(res, error); }
});
app.get("/api/demo/dekory", (_req, res) => res.json(DEKORY.map(d => ({ key: kluczDekoru(d), id:d.id, name:d.name, manufacturer:d.manufacturer, obraz:obrazDekoru(d) }))));
app.use("/api/dekory/obrazy", express.static(join(process.cwd(), "docs/materialy/obrazy")));
// Public stateless preview only. Never loads or persists workshop data.
const drawerPreview = previewCalculator(s);
app.get("/api/demo/systemy-szuflad", (_req, res) => res.json(drawerSystems()));
app.get("/api/demo/przelicznik-szuflad", (req, res) => {
  try { res.json(calculateDrawer(req, drawerPreview)); }
  catch (error) { res.status(400).json({ blad: error instanceof BladUslugi ? error.message : "Nie udało się przeliczyć szuflady." }); }
});
// Owner-only by default, including legacy PDF/CSV exports and HTTP MCP.
app.use(["/api", "/mcp"],(req,res,next)=>{
  const path=req.baseUrl+req.path;
  if((req.method==="GET"&&/^\/api\/v2\/presentation\/[a-f0-9]{64}$/.test(path))||(req.method==="POST"&&/^\/api\/v2\/presentation\/[a-f0-9]{64}\/comments$/.test(path))) {
    res.setHeader("Cache-Control","private, no-store");res.setHeader("Referrer-Policy","no-referrer");
    try{access.checkOrigin(req);next();}catch(e){access.fail(res,e);}return;
  }
  return access.guard(req,res,next);
});
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

// Osoba i profil żądania (ustawia access.guard). Brak osoby to błąd konfiguracji — nigdy prawa właściciela.
const osoba = (req: Request): Principal => {
  const person = req.res?.locals.person as Principal | undefined;
  if (!person) throw new Error("Brak osoby w żądaniu (bramka dostępu nie zadziałała).");
  return person;
};
const profil = (req: Request): Profil => profilOsoby(osoba(req));

// Dostęp do obiektu (stary panel /api/projekty/:id/...): produkcja i montaż tylko przydzielone projekty; zmiany projektu
// (PATCH) wg profilu; uwagi z warsztatu podpisane profilem i imieniem z konta. Po wczytaniu bazy (tryb chmurowy).
app.use("/api/projekty", (req, res, next) => {
  try {
    const person = osoba(req);
    const pr = profilOsoby(person);
    if (pr === "wlasciciel") return next();
    const id = projektZTrasy(req.baseUrl + req.path);
    if (!id) return next();
    const projekt = s.magazyn.odczytaj().projekty.find((x) => x.id === id);
    if (!projekt || !mayReadProject(person, id)) return res.status(404).json({ blad: `Nie ma projektu o id "${id}".` });
    const reszta = req.path.replace(/^\/[^/]+/, "").replace(/\/+$/, "");
    if (req.method === "PATCH" && reszta === "") {
      const blad = sprawdzZmianeProjektu(pr, projekt.status, req.body);
      if (blad) return res.status(403).json({ blad });
    }
    if (pr === "sprzedaz") {
      const blad = sprawdzZapisSprzedazy(projekt.status, req.method, reszta);
      if (blad) return res.status(403).json({ blad });
    }
    if (req.method === "POST" && /^\/notatki$/i.test(reszta) && req.body && typeof req.body.tekst === "string" && pr !== "sprzedaz")
      req.body.tekst = podpisUwagi(pr, person.display_name, req.body.tekst);
    next();
  } catch (e) {
    if (e instanceof AccessError) access.fail(res, e); else next(e);
  }
});

type Handler = (req: Request) => unknown;
const api = (fn: Handler) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wynik = await fn(req);
    // Zapis przed odpowiedzią, żeby konflikt zapisu wrócił jako błąd (409), a nie po cichu.
    await s.magazyn.utrwal();
    // Pola niewidoczne dla profilu (koszty zakupu, marża, ceny, umowy, kontakt klienta) są odcinane po stronie serwera.
    res.type("application/json").send(jsonBezMigawek(filtrujOdpowiedz(profil(req), wynik ?? { ok: true })));
  } catch (e) {
    if (e instanceof AccessError) access.fail(res, e); else next(e);
  }
};

const p = (req: Request, k: string) => String(req.params[k]);
const fileObjects = projectFileObjects(s.magazyn, access.admin);
app.get("/api/v2/projects/:id/files", api(req => listProjectFiles(s.magazyn, osoba(req), p(req,"id"))));
app.post("/api/v2/projects/:id/files", api(req => uploadProjectFile(s.magazyn, fileObjects, osoba(req), p(req,"id"), req.body)));
app.get("/api/v2/projects/:id/files/:fid/content", api(req => readProjectFile(s.magazyn, fileObjects, osoba(req), p(req,"id"), p(req,"fid"))));
app.get("/api/v2/furniture", api(() => s.magazyn.odczytaj().furnitureLibrary ?? []));
app.get("/api/v2/furniture/materials",api(req=>preparationMaterials(s.magazyn,osoba(req))));
app.post("/api/v2/furniture/:id/preparation",api(req=>prepareFurniture(s.magazyn,osoba(req),p(req,"id"),req.body)));
app.put("/api/v2/furniture", api(req => saveFurniture(s.magazyn, osoba(req), req.body)));
app.get("/api/v2/furniture/:id/construction", api(req => furnitureConstruction(s.magazyn, osoba(req), req.params.id, Number(req.query.version))));
app.post("/api/v2/furniture/:id/presentations",api(req=>createFurniturePresentation(s.magazyn,osoba(req),req.params.id,Number(req.body?.version))));
app.get("/api/v2/furniture/:id/presentations",api(req=>listFurniturePresentations(s.magazyn,osoba(req),req.params.id)));
app.delete("/api/v2/presentations/:id",api(req=>revokeFurniturePresentation(s.magazyn,osoba(req),req.params.id)));
app.get("/api/v2/presentation/:token",(req,res)=>{try{res.json(readFurniturePresentation(s.magazyn,req.params.token));}catch(e){access.fail(res,e);}});
app.post("/api/v2/presentation/:token/comments",async(req,res)=>{try{const result=commentFurniturePresentation(s.magazyn,req.params.token,req.body);await s.magazyn.utrwal();res.json(result);}catch(e){access.fail(res,e);}});
app.get("/api/v2/purchase-orders", api(() => s.magazyn.odczytaj().purchaseOrders ?? []));
app.put("/api/v2/purchase-orders", api(req => savePurchaseOrder(s.magazyn, osoba(req), req.body)));
app.get("/api/v2/purchase-orders/connection", api(() => MUSSI_CONNECTION));
app.get("/api/v2/purchase-orders/projects", api(() => s.magazyn.odczytaj().projekty.map(({id,nazwa,rewizja}) => ({id,nazwa,rewizja}))));
app.get("/api/v2/purchase-orders/:id/export", api(req => exportPurchaseOrder(s.magazyn, osoba(req), p(req,"id"), Number(req.query.version))));

const v2 = (fn: (req: Request, person: Principal) => unknown) => async (req: Request, res: Response) => {
  try {
    const person = res.locals.person as Principal;
    res.json(filtrujOdpowiedz(profilOsoby(person), await fn(req, person)));
  }
  catch (error) { access.fail(res, error); }
};
app.get("/api/v2/projects", v2((_req, person) => s.magazyn.odczytaj().projekty.filter(p => mayReadProject(person, p.id)).map(projectSummary)));
app.get("/api/v2/projects/:id", v2((req, person) => {
  const id = p(req, "id");
  if (!mayReadProject(person, id)) throw new AccessError(403, "Ten projekt nie jest Ci udostępniony.");
  if (!s.magazyn.odczytaj().projekty.some(p => p.id === id)) throw new AccessError(404, "Nie znaleziono projektu.");
  return technicalView(s, id);
}));
const technicalDocumentQuery = z.object({
  wydanie: z.string().min(1).max(80).optional(),
  rodzaj: z.enum(["techniczne", "montazowe"]).default("techniczne"),
  format: z.enum(["skrot", "pelny"]).optional(),
  modul: z.string().min(1).max(80).optional(),
  rewizja: z.coerce.number().int().min(0).optional(),
}).strict();
app.get("/api/v2/projects/:id/documents", v2((req, person) => {
  const parsed = technicalDocumentQuery.safeParse(req.query);
  if (!parsed.success) throw new AccessError(400, "Niepoprawny wybór dokumentacji.");
  return technicalDocuments(s, person, p(req, "id"), parsed.data.wydanie);
}));
app.get("/api/v2/projects/:id/documents.pdf", async (req, res) => {
  try {
    const person = res.locals.person as Principal;
    const id = p(req, "id");
    requireTechnicalDocuments(s, person, id);
    const parsed = technicalDocumentQuery.safeParse(req.query);
    if (!parsed.success || parsed.data.rewizja === undefined) throw new AccessError(400, "Wybierz rewizję dokumentacji przed wydrukiem.");
    const q = parsed.data;
    // Montaż drukuje tylko skrócone karty montażowe; pełna dokumentacja techniczna (pakiet P) to produkcja.
    if (profilOsoby(person) === "montaz" && q.rodzaj !== "montazowe") throw new AccessError(403, "Na koncie montażu drukujesz karty montażowe.");
    const source = documentSource(s, person, id, q.wydanie);
    if (source.document.rewizja !== q.rewizja) throw new AccessError(409, "Projekt zmienił się. Odśwież dokumentację i ponownie wybierz wydruk.");
    if (q.modul && !source.document.czesci.some(c => c.modulId === q.modul)) throw new AccessError(404, "Nie znaleziono szafki w tej dokumentacji.");
    const wybor = { zwiezly: q.format === "skrot", skrocony: q.rodzaj === "montazowe", moduly: q.modul ? [q.modul] : undefined, ukryjDaneKlienta: true };
    const pdf = q.wydanie ? (await s.wydaniePdf(id, q.wydanie, wybor)).pdf : await s.dokumentacjaPdf(id, wybor);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", `inline; filename="karty-${q.rodzaj}-rew${q.rewizja}.pdf"`);
    res.send(pdf);
  } catch (error) { access.fail(res, error); }
});
app.get("/api/v2/requests", v2(async (_req, person) => {
  if (person.role !== "owner") throw new AccessError(403, "Nie masz dostępu do zapytań klientów.");
  const { data, error } = await access.admin!.from("pan_stolarz_requests").select("id,created_at,name,email,kind,city,description,status").order("created_at", { ascending: false }).limit(100);
  if (error) throw new AccessError(503, "Nie udało się pobrać zapytań.");
  return data;
}));
app.post("/api/v2/members", v2(async (req, person) => {
  if (!access.admin) throw new AccessError(503, "Usługa kont jest niedostępna.");
  return createEmployee(access.admin, person, req.body, new Set(s.magazyn.odczytaj().projekty.map(p => p.id)), process.env.PAN_STOLARZ_ORIGIN ?? "");
}));
app.post("/api/v2/members/:id/activation", v2(async (req, person) => {
  if (!access.admin) throw new AccessError(503, "Usługa kont jest niedostępna.");
  return employeeActivation(access.admin, person, p(req, "id"), process.env.PAN_STOLARZ_ORIGIN ?? "");
}));
app.get("/api/v2/members", v2(async (_req, person) => {
  if (person.role !== "owner") throw new AccessError(403, "Nie masz dostępu do kont zespołu.");
  const { data, error } = await access.admin!.from("pan_stolarz_members").select(memberFields).in("role", ["owner", "employee"]).order("display_name").limit(200);
  if (error) throw new AccessError(503, "Nie udało się pobrać pracowników.");
  return data;
}));
app.patch("/api/v2/members/:id", v2(async (req, person) => {
  if (person.role !== "owner") throw new AccessError(403, "Tylko właściciel może zmieniać dostęp.");
  // Konto właściciela (także własne) nie jest zmieniane tą trasą: aktualizacja dotyczy tylko wierszy role = employee,
  // więc ostatniego właściciela nie da się zawiesić ani zdegradować przez API.
  if (p(req, "id") === person.user_id) throw new AccessError(400, "Nie zmieniasz dostępu własnego konta.");
  const parsed = memberUpdate.safeParse(req.body);
  if (!parsed.success) throw new AccessError(400, "Sprawdź ustawienia dostępu.");
  const projects = new Set(s.magazyn.odczytaj().projekty.map(p => p.id));
  if (parsed.data.project_ids.some(id => !projects.has(id))) throw new AccessError(400, "Wybrany projekt już nie istnieje. Odśwież listę.");
  const { data, error } = await access.admin!.from("pan_stolarz_members").update(parsed.data).eq("user_id", p(req, "id")).eq("role", "employee").select(memberFields).maybeSingle();
  if (error) throw new AccessError(503, "Nie udało się zapisać uprawnień.");
  if (!data) throw new AccessError(403, "Nie można zmienić tego konta.");
  return data;
}));

const taskFields = "id,project_id,assignee_id,title,status,version,created_at,updated_at";
app.get("/api/v2/tasks", v2(async (_req, person) => {
  requireWorkshop(person);
  if (!access.admin) throw new AccessError(503, "Baza zadań jest niedostępna.");
  let query = access.admin.from("pan_stolarz_tasks").select(taskFields).order("created_at", { ascending: false }).limit(100);
  if (person.role === "employee") {
    if (!person.project_ids.length) return [];
    query = query.eq("assignee_id", person.user_id).in("project_id", person.project_ids);
  }
  const { data, error } = await query;
  if (error) throw new AccessError(503, "Nie udało się pobrać zadań. Sprawdź konfigurację modułu.");
  return data;
}));
app.post("/api/v2/tasks", v2(async (req, person) => {
  requireWorkshop(person);
  if (person.role !== "owner") throw new AccessError(403, "Tylko właściciel przydziela pracę.");
  const parsed = taskCreate.safeParse(req.body);
  if (!parsed.success) throw new AccessError(400, "Wybierz projekt, pracownika i tytuł zadania (2–160 znaków).");
  const input = parsed.data;
  if (!s.magazyn.odczytaj().projekty.some(p => p.id === input.project_id)) throw new AccessError(404, "Nie znaleziono projektu.");
  if (!access.admin) throw new AccessError(503, "Baza zadań jest niedostępna.");
  const { error } = await access.admin.rpc("pan_stolarz_task_command", { actor:person.user_id, task:null, expected_version:null, next_status:null, project:input.project_id, assignee:input.assignee_id, task_title:input.title, operation_id:input.operation_id });
  if (error) taskFailure(error.message);
  return { ok:true };
}));
app.patch("/api/v2/tasks/:id", v2(async (req, person) => {
  requireWorkshop(person);
  const parsed = taskUpdate.safeParse(req.body);
  if (!parsed.success || !z.string().uuid().safeParse(p(req,"id")).success) throw new AccessError(400,"Sprawdź zadanie i jego wersję.");
  if (!access.admin) throw new AccessError(503,"Baza zadań jest niedostępna.");
  const { error } = await access.admin.rpc("pan_stolarz_task_command", { actor:person.user_id, task:p(req,"id"), expected_version:parsed.data.version, next_status:parsed.data.status });
  if (error) taskFailure(error.message);
  return { ok:true };
}));

// Katalogi i ustawienia
app.use("/api/okucia-katalog/obrazy", express.static(join(process.cwd(), "docs/okucia/produkty/obrazy")));
app.get("/api/okucia-katalog", api((r) => {
  const q = (k: string) => (typeof r.query[k] === "string" ? String(r.query[k]) : undefined);
  // Bez parametrów — pełna lista (zgodność wsteczna, eksport); panel używa ?widok=strona
  if (!q("widok")) return PRODUKTY_OKUC;
  return s.katalogOkuc({ kategoria: q("kategoria"), producent: q("producent"), szukaj: q("szukaj"), rodzaj: q("rodzaj"), od: Number(q("od") ?? 0), ile: Number(q("ile") ?? 48) });
}));
app.post("/api/okucia-katalog/:id/dodaj", api(r => s.dodajProduktOkucia(p(r, "id"), r.body?.cenaNetto)));
app.use("/api/dekory/obrazy", express.static(join(process.cwd(), "docs/materialy/obrazy")));
// maBlat: dekor ma artykuł blatu roboczego (Egger PG_WORKTOPS) — galeria blatów filtruje po tej fladze.
app.get("/api/dekory", api(() => DEKORY.map(d => ({ ...d, key: kluczDekoru(d), obraz: obrazDekoru(d), maBlat: artykulyDekoru(d, "PG_WORKTOPS").length > 0 }))));
app.get("/api/dekory-stolarni", api(() => s.dekoryStolarni()));
app.put("/api/dekory-stolarni", api((r) => s.ustawDekoryStolarni(r.body?.klucze)));
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
app.get("/api/cennik/materialow", api(() => s.cennikMaterialow()));
app.put("/api/cennik/materialow/:id", api((r) => s.zapiszCeneMaterialu(p(r, "id"), Number(r.body?.cenaNetto))));
app.delete("/api/cennik/materialow/:id", api((r) => { s.usunCeneMaterialu(p(r, "id")); return { ok: true }; }));
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
app.get("/api/projekty", api((r) => { const person = osoba(r); return s.projekty().filter((x) => mayReadProject(person, x.id)); }));
app.post("/api/projekty", api((r) => s.utworzProjekt(r.body)));
app.get("/api/projekty/:id", api((r) => s.projekt(p(r, "id"))));
// Produkcja i montaż zmieniają tylko status — w odpowiedzi tylko id i status (bez pozostałych danych projektu).
app.patch("/api/projekty/:id", api((r) => {
  const w = s.zmienProjekt(p(r, "id"), r.body);
  const pr = profil(r);
  return pr === "produkcja" || pr === "montaz" ? { id: w.id, status: w.status } : w;
}));
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
app.post("/api/cad/analiza", (req, res, next) => trescCad(req.body).then((t) => res.json(filtrujOdpowiedz(profil(req), s.analizaDxf(t, req.body)))).catch(next));
app.post("/api/projekty/:id/import-cad", (req, res, next) => trescCad(req.body).then((t) => res.json(filtrujOdpowiedz(profil(req), s.importujDxf(p(req, "id"), t, req.body)))).catch(next));
app.get("/api/cad/konwerter", api(() => ({ dwg: konwerterDwg() })));
app.put("/api/projekty/:id/stan", api((r) => s.przywrocStan(p(r, "id"), r.body)));
app.post("/api/projekty/:id/luka", api((r) => s.wypelnijLuke(p(r, "id"), r.body.scianaId, r.body.xMM, r.body.szerokoscMM, !!r.body.wiszacy)));
app.post("/api/projekty/:id/moduly", api((r) => s.dodajModul(p(r, "id"), r.body)));
// Szybki projekt (docs/SZYBKI-PROJEKT.md): wypełnij całą ścianę, układ I/L/U, pakiet stylu, okucia projektu
app.post("/api/projekty/:id/sciany/:sid/wypelnij", api((r) => s.wypelnijCalaSciane(p(r, "id"), p(r, "sid"), r.body ?? {})));
app.post("/api/projekty/:id/szybki-uklad", api((r) => s.szybkiUklad(p(r, "id"), r.body ?? {})));
app.post("/api/projekty/:id/styl", api((r) => s.ustawStyl(p(r, "id"), r.body ?? {})));
app.get("/api/projekty/:id/styl", api((r) => s.stylPomieszczenia(p(r, "id"), typeof r.query.pomieszczenieId === "string" ? r.query.pomieszczenieId : undefined)));
app.get("/api/okucia-projektu/opcje", api(() => s.opcjeOkuc()));
app.put("/api/projekty/:id/okucia", api((r) => s.ustawOkucia(p(r, "id"), r.body?.okucia === undefined ? r.body : r.body.okucia)));
app.patch("/api/projekty/:id/moduly/:mid", api((r) => s.zmienModul(p(r, "id"), p(r, "mid"), r.body)));
// Przelicznik dna i pleców szuflad (Amix, GTV, Blum)
app.get("/api/systemy-szuflad", api(drawerSystems));
app.get("/api/przelicznik-szuflad", api(r => calculateDrawer(r, s)));
// Silnik konstrukcji: polecenia edycji modułu (np. {"typ":"zamienDrzwiNaSzuflady","liczba":3}) i powrót do konstrukcji standardowej
app.post("/api/projekty/:id/moduly/:mid/polecenie", api((r) => s.polecenieKonstrukcji(p(r, "id"), p(r, "mid"), r.body)));
app.delete("/api/projekty/:id/moduly/:mid/drzewo", api((r) => s.przywrocKonstrukcjeStandardowa(p(r, "id"), p(r, "mid"))));
app.delete("/api/projekty/:id/moduly/:mid", api((r) => s.usunModul(p(r, "id"), p(r, "mid"))));
app.post("/api/projekty/:id/moduly/:mid/duplikuj", api((r) => s.duplikujModul(p(r, "id"), p(r, "mid"))));

app.get("/api/projekty/:id/analiza", api((r) => s.analiza(p(r, "id"))));
app.get("/api/projekty/:id/dokumentacja", api((r) => s.dokumentacja(p(r, "id"))));
app.get("/api/projekty/:id/wydania", api((r) => s.wydania(p(r, "id"))));
app.post("/api/projekty/:id/wydania", api((r) => s.utworzWydanie(p(r, "id"), r.body ?? {})));
app.get("/api/projekty/:id/wydania/:wid/dokumentacja", api((r) => s.wydanieDokumentacja(p(r, "id"), p(r, "wid"))));
app.get("/api/projekty/:id/wydania/:wid/dokumentacja.pdf", (req, res, next) => {
  const lista = (k: string) => (typeof req.query[k] === "string" ? String(req.query[k]).split(",").filter(Boolean) : undefined);
  // Produkcja: pakiet P bez danych klienta (tylko właściciel i sprzedaż widzą nazwę klienta na karcie).
  s.wydaniePdf(p(req, "id"), p(req, "wid"), { czesci: lista("czesc"), moduly: lista("modul"), skrocony: req.query.skrocony === "1", ukryjDaneKlienta: profil(req) === "produkcja" })
    .then(({ pdf, numer, rewizja }) => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="wydanie-${numer}-${p(req, "id")}-rew${rewizja}.pdf"`);
      res.send(pdf);
    })
    .catch(next);
});
// Pakiet montażowy (ten sam schemat stron co produkcyjny): z bieżącej rewizji lub z wydania.
const wyslijMontaz = (req: Request, res: Response, next: NextFunction, wid?: string) =>
  s.montazPdf(p(req, "id"), wid)
    .then(({ pdf, rewizja, numer }) => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="montaz-${numer ? `wydanie-${numer}-` : ""}${p(req, "id")}-rew${rewizja}.pdf"`);
      res.send(pdf);
    })
    .catch(next);
app.get("/api/projekty/:id/montaz.pdf", (req, res, next) => wyslijMontaz(req, res, next));
app.get("/api/projekty/:id/wydania/:wid/montaz.pdf", (req, res, next) => wyslijMontaz(req, res, next, p(req, "wid")));
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
      // Propozycja wstępna nie jest ofertą — nie trafia do archiwum ofert.
      const wstepna = req.body?.wstepna === true;
      if (!process.env.VERCEL && !wstepna) {
        const katalog = join(process.env.STOLARNIA_DATA ?? join(process.cwd(), "data"), "oferty");
        mkdirSync(katalog, { recursive: true });
        const plik = join(katalog, `oferta-${p(req, "id")}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.pdf`);
        writeFileSync(plik, pdf);
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${wstepna ? "propozycja-wstepna" : "oferta"}-${p(req, "id")}.pdf"`);
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

// Lista zamówienia dla dostawcy (ST-APP-003): ?wydanie=<id|numer|biezaca>&wariant=<eco|standard|premium|vip>
const opcjeZamowienia = (req: Request) => ({
  wydanie: typeof req.query.wydanie === "string" && req.query.wydanie ? String(req.query.wydanie) : undefined,
  wariant: typeof req.query.wariant === "string" && req.query.wariant ? (String(req.query.wariant) as WariantWyceny) : undefined,
});
app.get("/api/projekty/:id/zamowienie", api((r) => s.zamowienie(p(r, "id"), opcjeZamowienia(r))));
app.put("/api/projekty/:id/zamowienie/status", api((r) => {
  const check=z.object({expectedRevision:z.number().int().min(0),expectedQuantity:z.number().finite().positive(),expectedUpdatedAt:z.string().datetime().nullable()}).passthrough().safeParse(r.body);
  if(!check.success) throw new AccessError(400,"Odśwież zestawienie przed zmianą statusu.");
  return s.zmienStatusZamowienia(p(r,"id"),check.data);
}));
app.get("/api/projekty/:id/zamowienie.csv", (req, res, next) => {
  try {
    const csv = s.zamowienieCSV(p(req, "id"), opcjeZamowienia(req));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="zamowienie-${p(req, "id")}.csv"`);
    res.send(csv);
  } catch (e) {
    next(e);
  }
});
app.get("/api/projekty/:id/zamowienie.pdf", (req, res, next) => {
  s.zamowieniePdf(p(req, "id"), opcjeZamowienia(req))
    .then((pdf) => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="zamowienie-${p(req, "id")}.pdf"`);
      res.send(pdf);
    })
    .catch(next);
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
  // Niepoprawny JSON w żądaniu (body-parser) to błąd klienta, nie serwera.
  const zlyJson = (err as { type?: string }).type === "entity.parse.failed";
  const status = err instanceof BladUslugi || zlyJson ? 400 : err instanceof KonfliktZapisu ? 409 : 500;
  if (status === 500) console.error(err);
  // Błąd wewnętrzny: szczegóły tylko w logu serwera (ścieżki, zapytania, dane), klient dostaje ogólny komunikat.
  res.status(status).json({ blad: status === 500 ? "Wystąpił błąd serwera. Spróbuj ponownie; jeśli się powtarza, powiadom właściciela." : zlyJson ? "Niepoprawny format danych (JSON)." : err.message });
});
