import type { Express, Request, Response } from "express";
import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z, ZodError } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  kitchenInputSchema,
  type KitchenInput,
} from "../core/kitchen-configuration.js";
import { calculateKitchenEstimate } from "../core/kitchen-estimate.js";
import {
  kitchenMeasurementKey,
  kitchenMeasurementLabels,
} from "../core/kitchen-project-details.js";
import { reviewKitchenObjects } from "../core/kitchen-storage-check.js";
import { kitchenFunctionalReview } from "../core/kitchen-functions.js";
import { kitchenApplianceFit } from "../core/kitchen-appliance-fit.js";
import {
  DOMYSLNY_KORPUS,
  DOMYSLNY_FRONT,
  DOMYSLNE_PLECY,
  MATERIALY_STARTOWE,
} from "../core/catalog/materials.js";
import { listaFormatek } from "../core/production.js";
import { AccessError } from "./access.js";
import { konfiguracjaChmury, type Magazyn } from "../store/store.js";
import { projectFileObjects, type FileObjects } from "./project-files.js";

type SavedDraft = KitchenInput & {
  version: 1;
  decor?: KitchenInput["decor"] & { key?: string; obraz: string };
};
type Project = {
  draft: SavedDraft;
  readHash: string;
  editHash: string;
  created: string;
  expires: string;
  frozen: boolean;
  fileRoot: string;
  sourceRevision?: number;
};
type Row = { id: string; dane: Project; wersja: number };
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const token = () => randomBytes(32).toString("hex");
const uuid = z.string().uuid();
const secret = z.string().regex(/^[a-f0-9]{64}$/);
const saveSchema = z.object({
  draft: z.unknown(),
  revision: z.number().int().positive().optional(),
  clientId: z.string().uuid().optional(),
});
export const KITCHEN_FILE_CHUNK = 2 * 1024 * 1024;
const chunkKey = (root: string, file: string, part: number) =>
  `${hash(`${root}:${file}`)}/00000000-0000-4000-8000-${String(part).padStart(12, "0")}`;
const error = (code: number, text: string): never => {
  throw new AccessError(code, text);
};
function parseDraft(raw: unknown): SavedDraft {
  const d = kitchenInputSchema.parse(raw);
  const original = z
    .object({
      version: z.literal(1),
      decor: z
        .object({
          key: z.string().max(160),
          obraz: z
            .string()
            .regex(/^\/api\/dekory\/obrazy\/[A-Za-z0-9._\/-]+$/)
            .max(240),
        })
        .optional(),
    })
    .parse(raw);
  if (Buffer.byteLength(JSON.stringify(raw)) > 110000)
    error(
      413,
      "Szkic jest za duży. Ogranicz metadane plików i zapisz do 24 szafek.",
    );
  return {
    ...d,
    version: 1,
    ...(d.decor && original.decor
      ? { decor: { ...d.decor, ...original.decor } }
      : {}),
  } as SavedDraft;
}

/** Uses separate rows of the existing private table. Never loads or writes the workshop's glowna document. */
export class KitchenProjectRecords {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private root: string,
    private cloud = konfiguracjaChmury(),
  ) {}
  private async rest(method: string, query: string, data?: unknown) {
    const c = this.cloud!;
    const r = await fetch(`${c.url}/rest/v1/stolarnia_baza${query}`, {
      method,
      headers: {
        apikey: c.klucz,
        ...(c.klucz.startsWith("eyJ")
          ? { Authorization: `Bearer ${c.klucz}` }
          : {}),
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (r.status === 409)
      error(
        409,
        "Projekt zmienił się podczas zapisu. Spróbuj ponownie lub zapisz osobną kopię.",
      );
    if (!r.ok)
      error(
        503,
        "Zapis online jest chwilowo niedostępny. Szkic na urządzeniu pozostał bez zmian.",
      );
    return r.json() as Promise<Row[]>;
  }
  async get(id: string): Promise<Row | undefined> {
    if (!/^(kitchen:[a-f0-9-]{36}|kitchen-rate:[a-f0-9]{64})$/.test(id))
      return undefined;
    if (this.cloud)
      return (await this.rest("GET", `?id=eq.${id}&select=id,dane,wersja`))[0];
    try {
      return JSON.parse(
        await readFile(join(this.root, `${id.replace(":", "-")}.json`), "utf8"),
      );
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw e;
    }
  }
  async put(id: string, dane: Project, revision?: number): Promise<Row> {
    if (!/^(kitchen:[a-f0-9-]{36}|kitchen-rate:[a-f0-9]{64})$/.test(id))
      error(400, "Niepoprawny zapis.");
    const row: Row = { id, dane, wersja: (revision ?? 0) + 1 };
    if (this.cloud) {
      const rows = await this.rest(
        revision ? "PATCH" : "POST",
        revision ? `?id=eq.${id}&wersja=eq.${revision}` : "",
        { ...row, zmieniono: new Date().toISOString() },
      );
      if (!rows[0])
        error(
          409,
          "Projekt ma nowszą wersję na innym urządzeniu. Wczytaj ją przed ponownym zapisem lub zapisz osobną kopię.",
        );
      return rows[0];
    }
    const write = this.queue.then(async () => {
      const current = await this.get(id);
      if (current?.wersja !== revision)
        error(
          409,
          "Projekt ma nowszą wersję. Wczytaj ją lub zapisz osobną kopię.",
        );
      await mkdir(this.root, { recursive: true });
      const path = join(this.root, `${id.replace(":", "-")}.json`),
        tmp = `${path}.${randomUUID()}.tmp`;
      await writeFile(tmp, JSON.stringify(row));
      await rename(tmp, path);
      return row;
    });
    this.queue = write.catch(() => undefined);
    return write;
  }
  async limit(ip: string) {
    const id = `kitchen-rate:${hash(`${ip}:${new Date().toISOString().slice(0, 13)}`)}`;
    for (let n = 0; n < 5; n++) {
      const row = await this.get(id);
      if ((row?.wersja ?? 0) >= 12)
        error(
          429,
          "Zapisano wiele nowych projektów. Wróć do istniejącego linku edycji lub spróbuj za godzinę.",
        );
      try {
        await this.put(id, {} as Project, row?.wersja);
        return;
      } catch (e) {
        if (!(e instanceof AccessError) || e.status !== 409) throw e;
      }
    }
    error(429, "Poczekaj chwilę przed kolejnym zapisem.");
  }
}

export function kitchenWorkshopPacket(draft: SavedDraft, revision: number) {
  const { input, estimate, modules, built } = calculateKitchenEstimate(draft);
  const mapped = built.map((zm) => ({
    zm,
    materialy: {
      korpus: DOMYSLNY_KORPUS,
      front:
        input.quote.front === "fluted"
          ? "front-mdf-lakier-mat"
          : input.quote.front === "lacquer"
            ? "front-mdf-lakier-mat"
            : DOMYSLNY_FRONT,
      plecy: DOMYSLNE_PLECY,
      blat:
        input.quote.worktop === "compact" ? "blat-kompakt-12" : "blat-lam-38",
    },
  }));
  const parts = listaFormatek(
    mapped,
    new Map(MATERIALY_STARTOWE.map((m) => [m.id, m])),
  );
  // Workshop convention: exposed front edges; on wall cabinet sides also the visible bottom edge.
  for (const p of parts) {
    const m = modules.find((m) => m.id === p.modulId);
    if (m?.kategoria === "wall" && (p.rola === "side" || p.rola === "divider"))
      p.obrzeza[2] = "abs08";
  }
  const decor = input.decor
    ? `${input.decor.manufacturer} ${input.decor.id} · ${input.decor.name}`
    : input.finish;
  const groups = new Map<string, typeof parts>();
  for (const p of parts) {
    const label =
      p.kategoria === "front"
        ? `Fronty · ${input.quote.front} · ${decor}`
        : p.materialOpis;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(p);
  }
  const csv = (s: unknown) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [
    [
      "Dekor / materiał",
      "Opis elementu",
      "Długość po oklejeniu [mm]",
      "Szerokość po oklejeniu [mm]",
      "Grubość [mm]",
      "Ilość",
      "Okleina długa A",
      "Okleina długa B",
      "Okleina krótka A",
      "Okleina krótka B",
    ],
  ];
  for (const [label, list] of [...groups].sort((a, b) =>
    a[0].localeCompare(b[0], "pl"),
  ))
    for (const p of list)
      rows.push([
        label,
        `${p.nazwaModulu} · ${p.kodElementu} · ${p.etykieta}`,
        String(p.dlugoscMM),
        String(p.szerokoscMM),
        String(p.gruboscMM),
        "1",
        ...p.obrzeza,
      ]);
  const measured =
    input.projectDetails?.measurementKey === kitchenMeasurementKey(input)
      ? input.projectDetails.measured
      : [];
  return {
    version: "kitchen-workshop-v1",
    revision,
    status: "Szkic do weryfikacji technologicznej — nie wysyłać do cięcia",
    draft,
    estimate,
    materials: estimate.scope,
    appliances: modules
      .filter((m) =>
        ["sink", "oven", "hood", "refrigerator", "dishwasherFront"].includes(
          m.konstrukcja,
        ),
      )
      .map((m) => ({
        id: m.id,
        name: m.nazwa,
        wall: m.scianaId,
        width: m.szerokoscMM,
        x: m.pozycjaXMM,
        ...(() => {
          const card = input.items.find((i) => i.id === m.id)?.appliance;
          return card ? { card, fit: kitchenApplianceFit(m, card) } : {};
        })(),
      })),
    unresolved: [
      ...Object.entries(kitchenMeasurementLabels)
        .filter(([key]) => !measured.includes(key as (typeof measured)[number]))
        .map(([, label]) => `Pomiar do potwierdzenia: ${label}`),
      ...estimate.issues,
      ...kitchenFunctionalReview(input).warnings,
      ...reviewKitchenObjects(input)
        .filter((o) => !o.fit)
        .map((o) => `Przechowywanie: ${o.name}`),
      "Potwierdź modele AGD, syfon, dekory na próbce, okucia, stronę zawiasów i krawędzie widoczne. Reguły oklejenia z modelu wymagają zatwierdzenia przez stolarza.",
    ],
    standards: input.standards,
    hardware: built.map((b) => ({ cabinet: b.modul.nazwa, items: b.okucia })),
    partsByMaterial: [...groups].map(([material, parts]) => ({
      material,
      parts,
    })),
    csv: "\uFEFF" + rows.map((row) => row.map(csv).join(";")).join("\r\n"),
    files: draft.architectFiles ?? [],
  };
}

export function registerKitchenProjects(
  app: Express,
  options: {
    store: Magazyn;
    admin: SupabaseClient | null;
    checkOrigin: (r: Request) => void;
    identify: (r: Request) => Promise<unknown>;
    objects?: FileObjects;
    records?: KitchenProjectRecords;
  },
) {
  const records =
    options.records ??
    new KitchenProjectRecords(
      join(dirname(options.store.plik), "kitchen-projects"),
    );
  const objects =
    options.objects ?? projectFileObjects(options.store, options.admin);
  const wrap =
    (fn: (r: Request, s: Response) => Promise<unknown>) =>
    async (req: Request, res: Response) => {
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader("X-Content-Type-Options", "nosniff");
      try {
        options.checkOrigin(req);
        await fn(req, res);
      } catch (e) {
        const status =
          e instanceof ZodError
            ? 400
            : e instanceof AccessError
              ? e.status
              : 503;
        res.status(status).json({
          blad:
            e instanceof AccessError
              ? e.message
              : e instanceof ZodError
                ? "Sprawdź poprawność projektu i wybranego pliku."
                : "Nie udało się zapisać lub odczytać projektu. Zachowano szkic na urządzeniu; spróbuj ponownie.",
        });
      }
    };
  const get = async (req: Request, edit = false) => {
    const id = uuid.parse(req.params.id),
      t = secret.safeParse(req.get("authorization")?.replace(/^Kitchen /, ""));
    if (!t.success) error(404, "Link projektu jest niepoprawny lub wygasł.");
    const row = await records.get(`kitchen:${id}`);
    const provided = hash(t.data!);
    if (
      !row ||
      Date.parse(row.dane.expires) < Date.now() ||
      !(
        timingSafeEqual(
          Buffer.from(provided),
          Buffer.from(row.dane.editHash),
        ) ||
        (!edit &&
          timingSafeEqual(
            Buffer.from(provided),
            Buffer.from(row.dane.readHash),
          ))
      )
    )
      error(404, "Link projektu jest niepoprawny lub wygasł.");
    return row!;
  };
  const dto = (r: Row) => ({
    id: r.id.slice(8),
    revision: r.wersja,
    draft: r.dane.draft,
    frozen: r.dane.frozen,
    expires: r.dane.expires,
    sourceRevision: r.dane.sourceRevision,
  });
  app.post(
    "/api/public/kitchen-projects",
    wrap(async (req, res) => {
      if (process.env.VERCEL && !konfiguracjaChmury())
        error(503, "Zapis online nie jest gotowy.");
      const body = saveSchema.parse(req.body),
        draft = parseDraft(body.draft);
      await records.limit(
        `${req.ip ?? "unknown"}:${body.clientId ?? "browser"}`,
      );
      const id = randomUUID(),
        readToken = token(),
        editToken = token();
      const row = await records.put(`kitchen:${id}`, {
        draft,
        readHash: hash(readToken),
        editHash: hash(editToken),
        created: new Date().toISOString(),
        expires: new Date(Date.now() + 90 * 86400000).toISOString(),
        frozen: false,
        fileRoot: hash(id),
      });
      res.status(201).json({ ...dto(row), readToken, editToken });
    }),
  );
  app.get(
    "/api/public/kitchen-projects/:id",
    wrap(async (req, res) => {
      const row = await get(req);
      res.json({
        ...dto(row),
        canEdit:
          hash(req.get("authorization")!.slice(8)) === row.dane.editHash &&
          !row.dane.frozen,
      });
    }),
  );
  app.put(
    "/api/public/kitchen-projects/:id",
    wrap(async (req, res) => {
      const row = await get(req, true),
        body = saveSchema.parse(req.body);
      if (row.dane.frozen)
        error(
          409,
          "Przekazana wersja jest zamknięta. Zapisz osobną kopię, aby dalej projektować.",
        );
      if (body.revision !== row.wersja)
        error(
          409,
          "Projekt ma nowszą wersję na innym urządzeniu. Wczytaj ją lub zapisz osobną kopię.",
        );
      res.json(
        dto(
          await records.put(
            row.id,
            { ...row.dane, draft: parseDraft(body.draft) },
            row.wersja,
          ),
        ),
      );
    }),
  );
  app.put(
    "/api/public/kitchen-projects/:id/files/:file",
    wrap(async (req, res) => {
      const row = await get(req, true),
        file = row.dane.draft.architectFiles?.find(
          (f) => f.id === uuid.parse(req.params.file),
        );
      if (!file || row.dane.frozen)
        error(404, "Nie ma takiego pliku w tej wersji.");
      const { base64: raw, part } = z
        .object({
          base64: z.string().max(3 * 1024 * 1024),
          part: z.number().int().min(0).max(4),
        })
        .parse(req.body);
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(raw) || raw.length % 4)
        error(400, "Niepoprawny plik.");
      const bytes = Buffer.from(raw, "base64");
      const expected = Math.min(
        KITCHEN_FILE_CHUNK,
        file!.size - part * KITCHEN_FILE_CHUNK,
      );
      if (expected <= 0 || bytes.length !== expected)
        error(400, "Rozmiar pliku nie zgadza się z projektem.");
      await objects.put(chunkKey(row.dane.fileRoot, file!.id, part), bytes);
      res.json({ saved: true });
    }),
  );
  app.get(
    "/api/public/kitchen-projects/:id/files/:file",
    wrap(async (req, res) => {
      const row = await get(req),
        file = row.dane.draft.architectFiles?.find(
          (f) => f.id === uuid.parse(req.params.file),
        );
      if (!file) error(404, "Nie ma takiego pliku w tej wersji.");
      const part = z.coerce
        .number()
        .int()
        .min(0)
        .max(4)
        .parse(req.query.part ?? 0);
      if (part * KITCHEN_FILE_CHUNK >= file!.size)
        error(404, "Nie ma takiego fragmentu pliku.");
      const bytes = await objects.get(
        chunkKey(row.dane.fileRoot, file!.id, part),
      );
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(file!.name)}`,
      );
      res.send(bytes);
    }),
  );
  app.post(
    "/api/public/kitchen-projects/:id/handoff",
    wrap(async (req, res) => {
      const row = await get(req, true);
      if (
        z.object({ revision: z.number().int() }).parse(req.body).revision !==
        row.wersja
      )
        error(
          409,
          "Projekt zmienił się. Zapisz aktualną wersję przed przekazaniem.",
        );
      if (
        calculateKitchenEstimate(row.dane.draft).estimate.status !== "estimated"
      )
        error(422, "Popraw błędy projektu przed przekazaniem.");
      for (const file of row.dane.draft.architectFiles ?? [])
        for (let part = 0; part * KITCHEN_FILE_CHUNK < file.size; part++) {
          const bytes = await objects.get(
            chunkKey(row.dane.fileRoot, file.id, part),
          );
          if (
            bytes.length !==
            Math.min(KITCHEN_FILE_CHUNK, file.size - part * KITCHEN_FILE_CHUNK)
          )
            error(
              409,
              "Brakuje oryginału pliku. Zapisz go ponownie przed przekazaniem.",
            );
        }
      const signature = hash(`snapshot:${row.id}:${row.wersja}`);
      const id = `${signature.slice(0, 8)}-${signature.slice(8, 12)}-4${signature.slice(13, 16)}-8${signature.slice(17, 20)}-${signature.slice(20, 32)}`;
      const readToken = createHmac("sha256", row.dane.editHash)
        .update(`snapshot:${row.id}:${row.wersja}`)
        .digest("hex");
      let frozen = await records.get(`kitchen:${id}`);
      if (!frozen) {
        try {
          frozen = await records.put(`kitchen:${id}`, {
            ...row.dane,
            frozen: true,
            sourceRevision: row.wersja,
            readHash: hash(readToken),
            editHash: hash(token()),
          });
        } catch (e) {
          frozen = await records.get(`kitchen:${id}`);
          if (!frozen) throw e;
        }
      }
      res
        .status(201)
        .json({ ...dto(frozen), readToken, sourceRevision: row.wersja });
    }),
  );
  // Registered before the legacy API guard; this route has its own explicit owner check.
  app.post(
    "/api/public/kitchen-projects/:id/workshop-packet",
    wrap(async (req, res) => {
      const person = (await options.identify(req)) as { role?: string };
      if (person.role !== "owner")
        error(
          403,
          "Pakiet przygotowania jest dostępny dla właściciela stolarni.",
        );
      const row = await get(req);
      if (!row.dane.frozen)
        error(409, "Najpierw przekaż zamkniętą wersję projektu w zapytaniu.");
      res.json(
        kitchenWorkshopPacket(
          row.dane.draft,
          row.dane.sourceRevision ?? row.wersja,
        ),
      );
    }),
  );
}
