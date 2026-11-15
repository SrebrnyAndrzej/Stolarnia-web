import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { cofnijAkceptacje, oznaczRecznie, potwierdzOferte, przejmij, pustyStan, zaakceptuj, zakoncz, zapiszPost, widokPostow } from "./core/marketing.js";
import { importujPaczke, konfiguracjaMeta, symulacja, wyslijNalezne, wysylaczMeta } from "./server/marketing.js";
import { Magazyn } from "./store/store.js";

// Panel publikacji: reguły z publikatora Codexa przeniesione do bazy v2. Bez sieci (fetch podmieniony).
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(100, 1)]);
const SHA = createHash("sha256").update(JPEG).digest("hex");
const URL_GRAFIKI = "https://example.test/g.jpg";
const T0 = new Date("2026-11-20T10:00:00Z");
const tresc = (o: Record<string, unknown> = {}) => ({
  title: "Wnęka",
  captionInstagram: "Tekst IG",
  captionFacebook: "Tekst FB",
  scheduledAt: "2026-11-20T09:00:00Z",
  timezone: "Europe/Warsaw",
  channels: ["instagram", "facebook"],
  assets: [{ publicUrl: URL_GRAFIKI, sha256: SHA, altText: "Szafa", mimeType: "image/jpeg" }],
  kind: "feed",
  sourceType: "photo",
  requiresAvailabilityConfirmation: false,
  offerValidUntil: null,
  ...o,
});
const fetchGrafiki = (async (u: string) => (String(u) === URL_GRAFIKI ? new Response(JPEG) : new Response("", { status: 404 }))) as typeof fetch;

test("marketing: import i edycja wracają do akceptacji, akceptacja dotyczy wersji, reguły treści", () => {
  const s = pustyStan();
  assert.equal(zapiszPost(s, "N01", tresc(), T0).wynik, "nowy");
  assert.equal(zapiszPost(s, "N01", tresc(), T0).wynik, "bez zmian");
  assert.deepEqual(s.dostarczenia.map((d) => d.stan), ["pending", "pending"]);
  zaakceptuj(s, "N01", "Mateusz", T0);
  assert.deepEqual(s.dostarczenia.map((d) => d.stan), ["queued", "queued"]);
  // zmiana tekstu cofa akceptację i zastępuje dostarczenia
  assert.equal(zapiszPost(s, "N01", tresc({ captionFacebook: "Nowy" }), T0).wynik, "zmieniony");
  assert.equal(s.posty[0].zaakceptowana, null);
  assert.deepEqual(s.dostarczenia.map((d) => d.stan).sort(), ["pending", "pending", "superseded", "superseded"]);
  assert.throws(() => zapiszPost(s, "X", tresc({ captionFacebook: "Mamy wolne terminy w grudniu" }), T0), /potwierdzenia dostępności/);
  assert.throws(() => zapiszPost(s, "Y", tresc({ sourceType: "concept_ai" }), T0), /wizualizacja koncepcyjna AI/);
  assert.equal(zapiszPost(s, "Y", tresc({ sourceType: "concept_ai", captionInstagram: "Na grafice: wizualizacja koncepcyjna AI." }), T0).wynik, "nowy");
  assert.throws(() => zapiszPost(s, "Z", tresc({ assets: [] }), T0), /assets/);
  assert.throws(() => zapiszPost(s, "zły id!", tresc(), T0), /Identyfikator/);
  // story nie idzie automatem
  zapiszPost(s, "S1", tresc({ kind: "story", channels: ["instagram"] }), T0);
  zaakceptuj(s, "S1", "Mateusz", T0);
  assert.equal(s.dostarczenia.find((d) => d.postId === "S1")!.stan, "manual");
  oznaczRecznie(s, "S1", "instagram", "published", "Mateusz", T0);
  assert.equal(s.dostarczenia.find((d) => d.postId === "S1")!.stan, "published");
  assert.throws(() => zapiszPost(s, "S1", tresc({ kind: "story", channels: ["instagram"], title: "Inny" }), T0), /utwórz nowy post/);
});

test("marketing: oferta z terminem wymaga świeżego potwierdzenia; wygasła oferta wstrzymuje wysyłkę", () => {
  const s = pustyStan();
  const oferta = tresc({ captionFacebook: "Mamy wolne terminy przed Wigilią", requiresAvailabilityConfirmation: true, offerValidUntil: "2026-12-10T00:00:00Z" });
  zapiszPost(s, "OF", oferta, T0);
  assert.throws(() => zaakceptuj(s, "OF", "Mateusz", T0), /brak potwierdzenia/);
  assert.throws(() => potwierdzOferte(s, "OF", "Mateusz", "2026-12-31T00:00:00Z", T0), /nie dłużej niż oferta/);
  potwierdzOferte(s, "OF", "Mateusz", "2026-12-05T00:00:00Z", T0);
  zaakceptuj(s, "OF", "Mateusz", T0);
  // po 25 h potwierdzenie jest nieświeże → zadanie wstrzymane zamiast wysłane
  const pozniej = new Date(T0.getTime() + 25 * 3600_000);
  assert.equal(przejmij(s, "facebook", pozniej), null);
  assert.match(s.dostarczenia.find((d) => d.kanal === "facebook")!.blad!, /starsze niż 24 h/);
  assert.equal(widokPostow(s, pozniej)[0].problem, "potwierdzenie dostępności starsze niż 24 h");
});

test("marketing: dzierżawa — jedno przejęcie, wynik tylko z dzierżawą, wygasła dzierżawa = niepewne bez ponowienia", () => {
  const s = pustyStan();
  zapiszPost(s, "N1", tresc(), T0);
  assert.equal(przejmij(s, "facebook", T0), null, "bez akceptacji nic nie wychodzi");
  zaakceptuj(s, "N1", "Mateusz", T0);
  assert.equal(przejmij(s, "facebook", new Date("2026-11-20T08:00:00Z")), null, "przed terminem nic nie wychodzi");
  const z = przejmij(s, "facebook", T0)!;
  assert.equal(z.kanal, "facebook");
  assert.equal(przejmij(s, "facebook", T0), null, "drugi worker nie dostaje tego samego");
  assert.throws(() => zakoncz(s, { ...z, dzierzawa: "obca" }, { stan: "published", zewnetrzneId: "1" }, T0), /dzierżawę/);
  zakoncz(s, z, { stan: "simulated", zewnetrzneId: "sym" }, T0);
  assert.equal(s.dostarczenia.find((d) => d.kanal === "facebook")!.stan, "simulated");
  const ig = przejmij(s, "instagram", T0)!;
  assert.ok(ig);
  // brak wyniku po 121 s → niepewne, nie ponowna wysyłka
  assert.equal(przejmij(s, "instagram", new Date(T0.getTime() + 121_000)), null);
  assert.equal(s.dostarczenia.find((d) => d.kanal === "instagram")!.stan, "unknown");
  assert.throws(() => cofnijAkceptacje(s, "N1", "Mateusz", T0), /Za późno/);
});

test("marketing: przebieg wysyłki w symulacji przez magazyn, sprawdzenie grafiki przed wysłaniem, import paczki", async () => {
  const m = new Magazyn(mkdtempSync(join(tmpdir(), "mkt-")));
  m.zmien((b) => {
    const st = (b.marketing = pustyStan());
    const r = importujPaczke(st, { schemaVersion: 1, posts: [{ id: "N01", ...tresc() }, { id: "N02", ...tresc({ assets: [{ publicUrl: "https://example.test/zmieniona.jpg", sha256: SHA, altText: "x", mimeType: "image/jpeg" }] }) }, { id: "BEZ", ...tresc({ assets: [{ path: "a.jpg", publicUrl: null, sha256: SHA, altText: "x", mimeType: "image/jpeg" }] }) }] }, T0);
    assert.equal(r.nowy, 2);
    assert.match(r.bledy[0], /BEZ: brak wgranej grafiki/);
    zaakceptuj(st, "N01", "Mateusz", T0);
    zaakceptuj(st, "N02", "Mateusz", T0);
  });
  const wynik = await wyslijNalezne(m, symulacja, { teraz: () => T0, fetchImpl: fetchGrafiki });
  const stany = Object.fromEntries(wynik.map((w) => [`${w.postId}/${w.kanal}`, w.stan]));
  assert.deepEqual(stany, { "N01/facebook": "simulated", "N01/instagram": "simulated", "N02/facebook": "failed", "N02/instagram": "failed" });
  assert.match(m.odczytaj().marketing!.dostarczenia.find((d) => d.postId === "N02")!.blad!, /grafika zmieniła się/);
  assert.deepEqual(await wyslijNalezne(m, symulacja, { teraz: () => T0, fetchImpl: fetchGrafiki }), [], "drugi przebieg nic nie powtarza");
});

test("marketing: adapter Meta — symulacja domyślnie, odrzucenie = błąd, brak odpowiedzi = niepewne", async () => {
  assert.equal(konfiguracjaMeta({}).tryb, "symulacja");
  assert.equal(wysylaczMeta({}).symulacja, true);
  const env = { MARKETING_TRYB: "live", META_PAGE_ID: "123", META_PAGE_TOKEN: "t", META_IG_USER_ID: "456" };
  const k = konfiguracjaMeta(env);
  assert.deepEqual([k.tryb, k.facebook, k.instagram, k.automat], ["live", true, true, false]);
  const zad = { postId: "N1", wersja: "v", kanal: "facebook" as const, dzierzawa: "d", klucz: "k".repeat(64), tresc: { ...tresc(), channels: ["facebook", "instagram"] } as never };
  const wywolania: string[] = [];
  const ok = (async (u: string) => {
    wywolania.push(String(u).replace(/^https:\/\/graph\.facebook\.com\/v[\d.]+/, ""));
    const url = String(u);
    return Response.json(url.endsWith("/media") ? { id: "kontener1" } : url.endsWith("/media_publish") ? { id: "777" } : { id: "777", post_id: "123_777" });
  }) as typeof fetch;
  assert.deepEqual(await wysylaczMeta(env, ok).publikuj(zad), { stan: "published", zewnetrzneId: "123_777" });
  assert.deepEqual(await wysylaczMeta(env, ok).publikuj({ ...zad, kanal: "instagram" }), { stan: "published", zewnetrzneId: "777" });
  assert.deepEqual(wywolania, ["/123/photos", "/456/media", "/456/media_publish"]);
  const odrzuca = (async () => Response.json({ error: { message: "Invalid image" } }, { status: 400 })) as typeof fetch;
  assert.deepEqual(await wysylaczMeta(env, odrzuca).publikuj(zad), { stan: "failed", blad: "Invalid image" });
  const milczy = (async () => {
    throw new Error("timeout");
  }) as typeof fetch;
  const w = await wysylaczMeta(env, milczy).publikuj(zad);
  assert.equal(w.stan, "unknown");
  // Instagram: kontener utworzony, publikacja bez odpowiedzi → niepewne
  const polowa = (async (u: string) => (String(u).endsWith("/media") ? Response.json({ id: "k" }) : Response.json({}, { status: 502 }))) as typeof fetch;
  assert.equal((await wysylaczMeta(env, polowa).publikuj({ ...zad, kanal: "instagram" })).stan, "unknown");
});
