import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  BladMarketingu,
  KANALY,
  pustyStan,
  przejmij,
  widokPostow,
  zakoncz,
  zapiszPost,
  type Kanal,
  type StanMarketingu,
  type WynikWysylki,
  type Zadanie,
} from "../core/marketing.js";
import { KonfliktZapisu, type Magazyn } from "../store/store.js";

// Panel publikacji (serwer): magazyn grafik, adapter Meta, wysyłka należnych postów.
// Domyślnie SYMULACJA. Prawdziwa publikacja tylko gdy MARKETING_TRYB=live i są tokeny strony (Meta) — ustawia
// je właściciel w Vercel; tokenów nie zapisujemy w repo ani w bazie.

export const BUCKET_MARKETINGU = "pan-stolarz-marketing";
export const LIMIT_GRAFIKI = 8 * 1024 * 1024;

export interface KonfiguracjaMeta {
  tryb: "symulacja" | "live";
  facebook: boolean;
  instagram: boolean;
  automat: boolean;
  wersjaApi: string;
}
export function konfiguracjaMeta(env = process.env): KonfiguracjaMeta {
  const live = env.MARKETING_TRYB === "live";
  return {
    tryb: live ? "live" : "symulacja",
    facebook: !!(env.META_PAGE_ID && env.META_PAGE_TOKEN),
    instagram: !!(env.META_IG_USER_ID && env.META_PAGE_TOKEN),
    automat: !!env.CRON_SECRET,
    wersjaApi: env.META_GRAPH_VERSION || "v21.0",
  };
}

// ---------- Wysyłacze ----------

export interface Wysylacz {
  symulacja: boolean;
  publikuj(z: Zadanie): Promise<WynikWysylki>;
}

export const symulacja: Wysylacz = {
  symulacja: true,
  async publikuj(z) {
    return { stan: "simulated", zewnetrzneId: `symulacja:${z.klucz.slice(0, 16)}` };
  },
};

class OdrzuconeZanimOpublikowano extends Error {}

/** Graph API: odrzucenie przez dostawcę (4xx) = nic nie opublikowano; brak odpowiedzi / 5xx = wynik niepewny. */
async function graph(url: string, body: Record<string, string>, fetchImpl: typeof fetch) {
  let r: Response;
  try {
    r = await fetchImpl(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(body), signal: AbortSignal.timeout(25000) });
  } catch {
    throw new Error("brak odpowiedzi Meta");
  }
  const j = (await r.json().catch(() => ({}))) as { id?: string; post_id?: string; error?: { message?: string } };
  if (r.status >= 400 && r.status < 500) throw new OdrzuconeZanimOpublikowano(j.error?.message?.slice(0, 300) ?? `HTTP ${r.status}`);
  if (!r.ok || !(j.post_id ?? j.id)) throw new Error(`Meta HTTP ${r.status}`);
  return (j.post_id ?? j.id)!;
}

export function wysylaczMeta(env = process.env, fetchImpl: typeof fetch = fetch): Wysylacz {
  const k = konfiguracjaMeta(env);
  if (k.tryb !== "live") return symulacja;
  const api = `https://graph.facebook.com/${k.wersjaApi}`;
  const token = env.META_PAGE_TOKEN ?? "";
  return {
    symulacja: false,
    async publikuj(z) {
      const zdjecie = z.tresc.assets[0].publicUrl;
      try {
        if (z.kanal === "facebook") {
          if (!k.facebook) return { stan: "failed", blad: "Facebook nie jest połączony (META_PAGE_ID, META_PAGE_TOKEN)" };
          const id = await graph(`${api}/${env.META_PAGE_ID}/photos`, { url: zdjecie, caption: z.tresc.captionFacebook, published: "true", access_token: token }, fetchImpl);
          return { stan: "published", zewnetrzneId: id };
        }
        if (!k.instagram) return { stan: "failed", blad: "Instagram nie jest połączony (META_IG_USER_ID)" };
        // Kontener (odrzucenie = nic nie opublikowano), potem publikacja (brak odpowiedzi = niepewne).
        const kontener = await graph(`${api}/${env.META_IG_USER_ID}/media`, { image_url: zdjecie, caption: z.tresc.captionInstagram, access_token: token }, fetchImpl).catch((e) => {
          throw e instanceof OdrzuconeZanimOpublikowano ? e : new OdrzuconeZanimOpublikowano(`kontener: ${(e as Error).message}`);
        });
        const id = await graph(`${api}/${env.META_IG_USER_ID}/media_publish`, { creation_id: kontener, access_token: token }, fetchImpl);
        return { stan: "published", zewnetrzneId: id };
      } catch (e) {
        if (e instanceof OdrzuconeZanimOpublikowano) return { stan: "failed", blad: e.message };
        return { stan: "unknown", blad: `${(e as Error).message} — sprawdź na profilu, czy post się ukazał` };
      }
    },
  };
}

// ---------- Kolejka w dokumencie bazy ----------

const stanZ = (b: { marketing?: StanMarketingu }) => (b.marketing ??= pustyStan());

/** Zapis z ponowieniem przy równoległej zmianie dokumentu (inne okno, worker). */
async function transakcja<T>(m: Magazyn, fn: (s: StanMarketingu) => T, proby = 3): Promise<T> {
  for (let i = 0; ; i++) {
    await m.zaladuj();
    const w = m.zmien((b) => fn(stanZ(b as { marketing?: StanMarketingu })));
    try {
      await m.utrwal();
      return w;
    } catch (e) {
      if (!(e instanceof KonfliktZapisu) || i >= proby - 1) throw e;
    }
  }
}

/** Sprawdza, że grafika pod adresem publicznym jest tą zaakceptowaną (SHA-256) — przed każdym wysłaniem. */
async function grafikaZgodna(z: Zadanie, fetchImpl: typeof fetch) {
  for (const a of z.tresc.assets) {
    try {
      const r = await fetchImpl(a.publicUrl, { signal: AbortSignal.timeout(20000) });
      if (!r.ok) return false;
      if (createHash("sha256").update(Buffer.from(await r.arrayBuffer())).digest("hex") !== a.sha256) return false;
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Jeden przebieg wysyłki: dla każdego kanału przejmuje należne zadania (najwyżej `limit` łącznie) i publikuje.
 * Przejęcie i wynik zapisywane osobno — przerwanie między nimi zostawia „wysyłanie”, które po dzierżawie
 * zamienia się w „niepewne”, a nie w ponowną publikację.
 */
export async function wyslijNalezne(m: Magazyn, w: Wysylacz, opcje: { limit?: number; teraz?: () => Date; fetchImpl?: typeof fetch } = {}) {
  const teraz = opcje.teraz ?? (() => new Date());
  const fetchImpl = opcje.fetchImpl ?? fetch;
  const wynik: { postId: string; kanal: Kanal; stan: string }[] = [];
  for (let n = 0; n < (opcje.limit ?? 6); ) {
    let zrobiono = false;
    for (const kanal of KANALY) {
      if (n >= (opcje.limit ?? 6)) break;
      let z: Zadanie | null;
      try {
        z = await transakcja(m, (s) => przejmij(s, kanal, teraz()), 1);
      } catch (e) {
        if (e instanceof KonfliktZapisu) continue; // inny proces właśnie przejmuje — spróbuje następny przebieg
        throw e;
      }
      if (!z) continue;
      zrobiono = true;
      n++;
      const rezultat: WynikWysylki = (await grafikaZgodna(z, fetchImpl)) ? await w.publikuj(z) : { stan: "failed", blad: "grafika zmieniła się albo jest niedostępna — nic nie wysłano" };
      await transakcja(m, (s) => zakoncz(s, z!, rezultat, teraz()));
      wynik.push({ postId: z.postId, kanal, stan: rezultat.stan });
    }
    if (!zrobiono) break;
  }
  return wynik;
}

// ---------- Grafiki ----------

const schematGrafiki = z.object({ base64: z.string().min(4).max(Math.ceil(LIMIT_GRAFIKI / 3) * 4) }).strict();

export interface MagazynGrafik {
  zapisz(klucz: string, bajty: Buffer): Promise<string>;
}

/** Grafiki postów są publiczne z natury (idą na Facebook i Instagram) — osobny publiczny bucket, nie pliki projektów. */
export function magazynGrafik(store: Magazyn, admin: SupabaseClient | null, env = process.env): MagazynGrafik {
  if (!store.wChmurze) {
    const katalog = join(dirname(store.plik), "marketing-media");
    return {
      async zapisz(klucz, bajty) {
        mkdirSync(katalog, { recursive: true });
        if (!existsSync(join(katalog, klucz))) writeFileSync(join(katalog, klucz), bajty);
        return `${env.PAN_STOLARZ_ORIGIN?.replace(/\/$/, "") || "http://localhost:3210"}/api/public/marketing-media/${klucz}`;
      },
    };
  }
  return {
    async zapisz(klucz, bajty) {
      if (!admin) throw new BladMarketingu("Magazyn grafik jest niedostępny.");
      const api = admin.storage;
      if ((await api.getBucket(BUCKET_MARKETINGU)).error)
        await api.createBucket(BUCKET_MARKETINGU, { public: true, fileSizeLimit: LIMIT_GRAFIKI, allowedMimeTypes: ["image/jpeg"] });
      const { error } = await api.from(BUCKET_MARKETINGU).upload(klucz, bajty, { contentType: "image/jpeg", upsert: false });
      if (error && !/exists|duplicate/i.test(error.message)) throw new BladMarketingu(`Nie udało się zapisać grafiki: ${error.message}`);
      return api.from(BUCKET_MARKETINGU).getPublicUrl(klucz).data.publicUrl;
    },
  };
}

export function lokalnaGrafika(store: Magazyn, klucz: string): Buffer | null {
  if (!/^[a-f0-9]{64}\.jpg$/.test(klucz)) return null;
  const p = join(dirname(store.plik), "marketing-media", klucz);
  return existsSync(p) ? readFileSync(p) : null;
}

export async function dodajGrafike(mg: MagazynGrafik, dane: unknown) {
  const r = schematGrafiki.safeParse(dane);
  if (!r.success) throw new BladMarketingu("Wybierz grafikę JPEG do 8 MiB.");
  const bajty = Buffer.from(r.data.base64, "base64");
  if (bajty.length < 4 || bajty[0] !== 0xff || bajty[1] !== 0xd8 || bajty[2] !== 0xff) throw new BladMarketingu("Grafika musi być w formacie JPEG (Instagram przyjmuje JPEG).");
  if (bajty.length > LIMIT_GRAFIKI) throw new BladMarketingu("Grafika jest większa niż 8 MiB.");
  const sha256 = createHash("sha256").update(bajty).digest("hex");
  return { sha256, publicUrl: await mg.zapisz(`${sha256}.jpg`, bajty), mimeType: "image/jpeg" as const, bajty: bajty.length };
}

// ---------- Import paczki (format content-import.json, schemaVersion 1) ----------

const schematPaczki = z.object({ schemaVersion: z.literal(1), posts: z.array(z.record(z.unknown())).min(1).max(1000) }).passthrough();

/** Import z panelu: grafiki są już wgrane (publicUrl), każdy post wraca do „do akceptacji”, akceptacje z pliku są ignorowane. */
export function importujPaczke(s: StanMarketingu, dane: unknown, kiedy = new Date()) {
  const p = schematPaczki.safeParse(dane);
  if (!p.success) throw new BladMarketingu("To nie jest paczka content-import.json (schemaVersion 1).");
  const licz = { nowy: 0, zmieniony: 0, "bez zmian": 0 };
  const bledy: string[] = [];
  for (const rekord of p.data.posts) {
    const id = String(rekord.id ?? "");
    const tresc = Object.fromEntries(
      ["title", "captionInstagram", "captionFacebook", "scheduledAt", "timezone", "channels", "kind", "sourceType", "requiresAvailabilityConfirmation", "offerValidUntil"].map((k) => [k, rekord[k]]),
    );
    const assets = Array.isArray(rekord.assets) ? (rekord.assets as Record<string, unknown>[]).map((a) => ({ publicUrl: a.publicUrl, sha256: a.sha256, altText: a.altText, mimeType: a.mimeType })) : [];
    try {
      if (assets.some((a) => !a.publicUrl)) throw new BladMarketingu("brak wgranej grafiki (publicUrl)");
      licz[zapiszPost(s, id, { ...tresc, assets }, kiedy).wynik]++;
    } catch (e) {
      bledy.push(`${id || "(bez id)"}: ${(e as Error).message}`);
    }
  }
  return { ...licz, bledy };
}

export { widokPostow, KonfliktZapisu };
