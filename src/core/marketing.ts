import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";

// Panel publikacji social (Facebook + Instagram) — rdzeń bez sieci.
// Reguły przeniesione z publikatora Codexa (Stolarnia App/tools/social-publisher, 15.11.2026):
// - import i każda zmiana treści wracają do „do akceptacji”; akceptacja dotyczy konkretnej wersji;
// - oferta z terminem wymaga świeżego (≤ 24 h) potwierdzenia dostępności, ważnego do daty publikacji;
// - zadanie (post × kanał) przejmowane z dzierżawą; wygasła dzierżawa albo przerwane połączenie = „niepewne”,
//   nigdy automatyczne ponowienie; symulacja nigdy nie jest „opublikowane”;
// - stories i koncepcje reklam nie idą automatem (stan „ręcznie”).
// Kolejka mieszka w dokumencie bazy (Supabase), zapis z kontrolą wersji dokumentu = atomowe przejęcie.

export const KANALY = ["facebook", "instagram"] as const;
export type Kanal = (typeof KANALY)[number];
export const RODZAJE = ["feed", "story", "ad_concept"] as const;
export type RodzajPosta = (typeof RODZAJE)[number];
export const ZRODLA = ["photo", "concept_ai", "typography", "project_visualization"] as const;

const dataUtc = z.string().datetime({ offset: true });
export const schematMedium = z
  .object({
    publicUrl: z.string().url().refine((u) => u.startsWith("https://") || u.startsWith("http://localhost"), "Media wymagają adresu HTTPS"),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    altText: z.string().trim().min(1).max(500),
    mimeType: z.literal("image/jpeg"),
  })
  .strict();
export type Medium = z.infer<typeof schematMedium>;

export const schematTresci = z
  .object({
    title: z.string().trim().min(1).max(200),
    captionInstagram: z.string().min(1).max(2200),
    captionFacebook: z.string().min(1).max(63206),
    scheduledAt: dataUtc,
    timezone: z.literal("Europe/Warsaw"),
    channels: z.array(z.enum(KANALY)).min(1).max(2),
    assets: z.array(schematMedium).min(1).max(10),
    kind: z.enum(RODZAJE),
    sourceType: z.enum(ZRODLA),
    requiresAvailabilityConfirmation: z.boolean(),
    offerValidUntil: dataUtc.nullable(),
  })
  .strict();
export type TrescPosta = z.infer<typeof schematTresci>;

export type StanDostarczenia = "pending" | "queued" | "manual" | "blocked" | "publishing" | "published" | "simulated" | "failed" | "unknown" | "superseded";
export const NAZWY_STANOW: Record<StanDostarczenia, string> = {
  pending: "czeka na akceptację",
  queued: "w kolejce",
  manual: "do ręcznej publikacji",
  blocked: "wstrzymane",
  publishing: "wysyłanie",
  published: "opublikowane",
  simulated: "symulacja (nie wysłano)",
  failed: "błąd",
  unknown: "niepewne — sprawdź na profilu",
  superseded: "zastąpione nowszą wersją",
};

export interface PostMarketingu {
  id: string;
  wersja: string;
  tresc: TrescPosta;
  zaakceptowana: string | null;
  akceptowal?: string;
  akceptacja?: string;
  potwierdzenie?: { kto: string; kiedy: string; doKiedy: string; wersja: string } | null;
  utworzono: string;
  zmieniono: string;
}
export interface Dostarczenie {
  postId: string;
  wersja: string;
  kanal: Kanal;
  stan: StanDostarczenia;
  dzierzawa?: string | null;
  dzierzawaDo?: string | null;
  blad?: string | null;
  zewnetrzneId?: string | null;
  zmieniono: string;
}
export interface WpisAudytu {
  kiedy: string;
  zdarzenie: string;
  postId?: string;
  szczegoly: Record<string, unknown>;
}
export interface StanMarketingu {
  posty: PostMarketingu[];
  dostarczenia: Dostarczenie[];
  audyt: WpisAudytu[];
}

export class BladMarketingu extends Error {}

const AKTYWNE: StanDostarczenia[] = ["published", "publishing", "unknown"];
const LIMIT_AUDYTU = 3000;
const DZIERZAWA_S = 120;
const SWIEZOSC_POTWIERDZENIA_H = 24;

export const pustyStan = (): StanMarketingu => ({ posty: [], dostarczenia: [], audyt: [] });

function kanoniczny(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(kanoniczny);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, kanoniczny(x)]));
  return v;
}
export const wersjaTresci = (t: TrescPosta) => createHash("sha256").update(JSON.stringify(kanoniczny({ ...t, channels: [...t.channels].sort() }))).digest("hex");

/** Reguły treści z importu Codexa: oferta z terminem ma okres ważności, koncepcja AI jest oznaczona. */
export function sprawdzTresc(dane: unknown): TrescPosta {
  const r = schematTresci.safeParse(dane);
  if (!r.success) throw new BladMarketingu(r.error.issues.map((i) => `${i.path.join(".") || "dane"}: ${i.message}`).join("; "));
  const t = { ...r.data, channels: [...new Set(r.data.channels)].sort() as Kanal[], scheduledAt: new Date(r.data.scheduledAt).toISOString(), offerValidUntil: r.data.offerValidUntil ? new Date(r.data.offerValidUntil).toISOString() : null };
  const tekst = `${t.captionInstagram}\n${t.captionFacebook}`;
  if (/wolne terminy|przed wigilią/i.test(tekst) && !t.requiresAvailabilityConfirmation) throw new BladMarketingu("Post obiecuje terminy — zaznacz „wymaga potwierdzenia dostępności” i podaj ważność oferty.");
  if (t.requiresAvailabilityConfirmation && (!t.offerValidUntil || Date.parse(t.offerValidUntil) < Date.parse(t.scheduledAt))) throw new BladMarketingu("Oferta nie ma ważnego okresu dla daty publikacji.");
  if (t.sourceType === "concept_ai" && !/wizualizacj\S*\s+koncepcyjn\S*.*AI/i.test(tekst)) throw new BladMarketingu("Grafika z AI wymaga w tekście oznaczenia „wizualizacja koncepcyjna AI”.");
  return t;
}

const audyt = (s: StanMarketingu, zdarzenie: string, postId: string | undefined, szczegoly: Record<string, unknown>, kiedy: Date) => {
  s.audyt.push({ kiedy: kiedy.toISOString(), zdarzenie, postId, szczegoly });
  if (s.audyt.length > LIMIT_AUDYTU) s.audyt.splice(0, s.audyt.length - LIMIT_AUDYTU);
};

/**
 * Zapis treści (import albo edycja w panelu). Nowa wersja: akceptacja cofnięta, stare dostarczenia „zastąpione”,
 * nowe „czeka na akceptację”. Nie nadpisuje posta, który jest/mógł zostać opublikowany — wtedy nowy post.
 */
export function zapiszPost(s: StanMarketingu, id: string, dane: unknown, kiedy = new Date()): { wynik: "nowy" | "zmieniony" | "bez zmian"; post: PostMarketingu } {
  if (!/^[A-Za-z0-9._-]{1,160}$/.test(id)) throw new BladMarketingu("Identyfikator posta: litery, cyfry, kropka, myślnik, podkreślenie (do 160 znaków).");
  const tresc = sprawdzTresc(dane);
  const wersja = wersjaTresci(tresc);
  const stary = s.posty.find((p) => p.id === id);
  if (stary && stary.wersja === wersja) return { wynik: "bez zmian", post: stary };
  if (stary && s.dostarczenia.some((d) => d.postId === id && AKTYWNE.includes(d.stan)))
    throw new BladMarketingu("Ten post jest opublikowany, wysyłany albo ma niepewny wynik — utwórz nowy post zamiast go zmieniać.");
  for (const d of s.dostarczenia) if (d.postId === id && d.stan !== "superseded") d.stan = "superseded";
  const teraz = kiedy.toISOString();
  const post: PostMarketingu = { id, wersja, tresc, zaakceptowana: null, potwierdzenie: null, utworzono: stary?.utworzono ?? teraz, zmieniono: teraz };
  if (stary) s.posty[s.posty.indexOf(stary)] = post;
  else s.posty.push(post);
  for (const kanal of tresc.channels) s.dostarczenia.push({ postId: id, wersja, kanal, stan: "pending", zmieniono: teraz });
  audyt(s, stary ? "edycja" : "import", id, { wersja }, kiedy);
  return { wynik: stary ? "zmieniony" : "nowy", post };
}

/** Problem blokujący publikację w chwili `kiedy` (oferta wygasła, brak/nieświeże potwierdzenie). */
export function problemPosta(p: PostMarketingu, kiedy: Date): string | null {
  const t = p.tresc;
  if (t.offerValidUntil && kiedy.getTime() >= Date.parse(t.offerValidUntil)) return "oferta wygasła";
  if (t.requiresAvailabilityConfirmation) {
    const c = p.potwierdzenie;
    if (!c || c.wersja !== p.wersja) return "brak potwierdzenia dostępności terminów";
    const od = Date.parse(c.kiedy);
    if (od > kiedy.getTime() || kiedy.getTime() - od > SWIEZOSC_POTWIERDZENIA_H * 3600_000) return "potwierdzenie dostępności starsze niż 24 h";
    if (kiedy.getTime() >= Date.parse(c.doKiedy)) return "potwierdzenie dostępności wygasło";
  }
  return null;
}

const znajdz = (s: StanMarketingu, id: string) => {
  const p = s.posty.find((x) => x.id === id);
  if (!p) throw new BladMarketingu("Nie ma takiego posta.");
  return p;
};

export function potwierdzOferte(s: StanMarketingu, id: string, kto: string, doKiedy: string, kiedy = new Date()) {
  const p = znajdz(s, id);
  const doK = Date.parse(doKiedy);
  if (!p.tresc.requiresAvailabilityConfirmation) throw new BladMarketingu("Ten post nie wymaga potwierdzenia dostępności.");
  if (!kto || !Number.isFinite(doK) || doK <= kiedy.getTime() || !p.tresc.offerValidUntil || doK > Date.parse(p.tresc.offerValidUntil))
    throw new BladMarketingu("Potwierdzenie musi być ważne w przyszłości i nie dłużej niż oferta.");
  p.potwierdzenie = { kto, kiedy: kiedy.toISOString(), doKiedy: new Date(doK).toISOString(), wersja: p.wersja };
  audyt(s, "potwierdzenie", id, { kto, wersja: p.wersja }, kiedy);
  return p;
}

/** Akceptacja tej wersji: feed trafia do kolejki, story i koncepcja reklamy — do ręcznej publikacji. */
export function zaakceptuj(s: StanMarketingu, id: string, kto: string, kiedy = new Date()) {
  const p = znajdz(s, id);
  const problem = problemPosta(p, kiedy);
  if (!kto) throw new BladMarketingu("Akceptacja wymaga osoby.");
  if (problem) throw new BladMarketingu(`Nie można zaakceptować: ${problem}.`);
  const biezace = s.dostarczenia.filter((d) => d.postId === id && d.wersja === p.wersja);
  if (biezace.some((d) => AKTYWNE.includes(d.stan))) throw new BladMarketingu("Ten post jest wysyłany, opublikowany albo ma niepewny wynik.");
  p.zaakceptowana = p.wersja;
  p.akceptowal = kto;
  p.akceptacja = kiedy.toISOString();
  const cel: StanDostarczenia = p.tresc.kind === "feed" ? "queued" : "manual";
  for (const d of biezace)
    if (["pending", "blocked", "queued"].includes(d.stan)) Object.assign(d, { stan: cel, blad: null, zmieniono: kiedy.toISOString() });
  audyt(s, "akceptacja", id, { kto, wersja: p.wersja }, kiedy);
  return p;
}

/** Wycofanie akceptacji (przed wysyłką). */
export function cofnijAkceptacje(s: StanMarketingu, id: string, kto: string, kiedy = new Date()) {
  const p = znajdz(s, id);
  const biezace = s.dostarczenia.filter((d) => d.postId === id && d.wersja === p.wersja);
  if (biezace.some((d) => AKTYWNE.includes(d.stan))) throw new BladMarketingu("Za późno — post jest wysyłany albo opublikowany.");
  p.zaakceptowana = null;
  for (const d of biezace) if (["queued", "manual", "blocked"].includes(d.stan)) Object.assign(d, { stan: "pending", zmieniono: kiedy.toISOString() });
  audyt(s, "cofniecie_akceptacji", id, { kto }, kiedy);
  return p;
}

/** Ręczne oznaczenie wyniku (story opublikowane ręcznie, wyjaśnione „niepewne”). */
export function oznaczRecznie(s: StanMarketingu, id: string, kanal: Kanal, stan: "published" | "failed", kto: string, kiedy = new Date()) {
  const p = znajdz(s, id);
  const d = s.dostarczenia.find((x) => x.postId === id && x.wersja === p.wersja && x.kanal === kanal);
  if (!d || !["manual", "unknown", "failed", "blocked"].includes(d.stan)) throw new BladMarketingu("Ten kanał nie czeka na ręczne rozstrzygnięcie.");
  Object.assign(d, { stan, dzierzawa: null, dzierzawaDo: null, zmieniono: kiedy.toISOString() });
  audyt(s, "oznaczenie_reczne", id, { kanal, stan, kto }, kiedy);
  return d;
}

export interface Zadanie {
  postId: string;
  wersja: string;
  kanal: Kanal;
  dzierzawa: string;
  tresc: TrescPosta;
  klucz: string;
}

/**
 * Przejęcie jednego należnego zadania dla kanału. Wygasłe dzierżawy → „niepewne” (do wyjaśnienia ręcznie).
 * Wywoływać w transakcji magazynu: zapis z kontrolą wersji dokumentu gwarantuje, że dwa procesy nie przejmą tego samego.
 */
export function przejmij(s: StanMarketingu, kanal: Kanal, kiedy = new Date()): Zadanie | null {
  for (const d of s.dostarczenia)
    if (d.stan === "publishing" && d.dzierzawaDo && Date.parse(d.dzierzawaDo) <= kiedy.getTime()) {
      Object.assign(d, { stan: "unknown", blad: "przerwana wysyłka — sprawdź na profilu", dzierzawa: null, zmieniono: kiedy.toISOString() });
      audyt(s, "dzierzawa_wygasla", d.postId, { kanal: d.kanal }, kiedy);
    }
  const kolejka = s.dostarczenia
    .filter((d) => d.kanal === kanal && d.stan === "queued")
    .map((d) => ({ d, p: s.posty.find((p) => p.id === d.postId && p.wersja === d.wersja) }))
    .filter((x): x is { d: Dostarczenie; p: PostMarketingu } => !!x.p && x.p.zaakceptowana === x.p.wersja)
    .sort((a, b) => a.p.tresc.scheduledAt.localeCompare(b.p.tresc.scheduledAt) || a.p.id.localeCompare(b.p.id));
  for (const { d, p } of kolejka) {
    if (p.tresc.kind !== "feed" || Date.parse(p.tresc.scheduledAt) > kiedy.getTime()) continue;
    const problem = problemPosta(p, kiedy);
    if (problem) {
      Object.assign(d, { stan: "blocked", blad: problem, zmieniono: kiedy.toISOString() });
      audyt(s, "wstrzymane", p.id, { kanal, powod: problem }, kiedy);
      continue;
    }
    const dzierzawa = randomUUID();
    Object.assign(d, { stan: "publishing", dzierzawa, dzierzawaDo: new Date(kiedy.getTime() + DZIERZAWA_S * 1000).toISOString(), zmieniono: kiedy.toISOString() });
    audyt(s, "przejecie", p.id, { kanal, wersja: p.wersja }, kiedy);
    return { postId: p.id, wersja: p.wersja, kanal, dzierzawa, tresc: p.tresc, klucz: createHash("sha256").update(`${p.id}|${p.wersja}|${kanal}`).digest("hex") };
  }
  return null;
}

export type WynikWysylki = { stan: "published" | "simulated"; zewnetrzneId: string } | { stan: "failed" | "unknown"; blad: string };

/** Zapis wyniku tylko przez właściciela dzierżawy. */
export function zakoncz(s: StanMarketingu, z: Zadanie, w: WynikWysylki, kiedy = new Date()) {
  const d = s.dostarczenia.find((x) => x.postId === z.postId && x.wersja === z.wersja && x.kanal === z.kanal);
  if (!d || d.stan !== "publishing" || d.dzierzawa !== z.dzierzawa) throw new BladMarketingu("Utracono dzierżawę — wynik do wyjaśnienia ręcznie.");
  Object.assign(d, { stan: w.stan, blad: "blad" in w ? w.blad : null, zewnetrzneId: "zewnetrzneId" in w ? w.zewnetrzneId : null, dzierzawa: null, dzierzawaDo: null, zmieniono: kiedy.toISOString() });
  audyt(s, w.stan, z.postId, { kanal: z.kanal }, kiedy);
  return d;
}

/** Widok dla panelu: post z dostarczeniami bieżącej wersji i blokadami. */
export function widokPostow(s: StanMarketingu, kiedy = new Date()) {
  return [...s.posty]
    .sort((a, b) => a.tresc.scheduledAt.localeCompare(b.tresc.scheduledAt) || a.id.localeCompare(b.id))
    .map((p) => ({
      ...p,
      dostarczenia: s.dostarczenia.filter((d) => d.postId === p.id && d.wersja === p.wersja),
      problem: problemPosta(p, kiedy),
      historia: s.audyt.filter((a) => a.postId === p.id).slice(-20),
    }));
}
