// Kopia zapasowa bazy Pan Stolarz POZA Supabase i jej odtworzenie (ST-APP-005).
//
//   node scripts/kopia-bazy.mjs eksport --katalog D:/Kopie/pan-stolarz [--zachowaj 30] [--env .env.kopia]
//   node scripts/kopia-bazy.mjs sprawdz <katalog-kopii>
//   node scripts/kopia-bazy.mjs odtworz-lokalnie <katalog-kopii> <katalog-danych>
//   node scripts/kopia-bazy.mjs odtworz-chmure <katalog-kopii> --potwierdzam [--env .env.kopia]
//
// Eksport: wszystkie wiersze tabel public (stolarnia_baza, pan_stolarz_*), prywatne pliki projektów
// z magazynu Supabase i manifest z SHA-256. Tylko odczyt. Kopie starsze niż --zachowaj są usuwane
// (tylko katalogi „kopia-*” w podanym katalogu).
// Odtworzenie lokalne: plik stolarnia.json + project-files/ w formacie lokalnego magazynu aplikacji —
// do sprawdzenia kopii (`STOLARNIA_DATA=<katalog-danych> npm run dev:api`) bez dotykania produkcji.
// Odtworzenie chmury: najpierw automatyczny eksport bieżącego stanu, potem dokument `glowna`
// i pliki projektów wracają do Supabase. Konta (Auth), zadania i zapytania odtwarza się ręcznie z baza.json.
// Klucze: SUPABASE_URL i SUPABASE_SECRET_KEY ze zmiennych środowiska albo z pliku --env (nie w repo).

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const TABELE = ["stolarnia_baza", "pan_stolarz_members", "pan_stolarz_tasks", "pan_stolarz_task_events", "pan_stolarz_requests"];
export const BUCKET = "pan-stolarz-project-files";
const KLUCZ_PLIKU = /^[a-f0-9]{64}\/[a-f0-9-]{36}$/;
const sha = (b) => createHash("sha256").update(b).digest("hex");

export function konfiguracja(env = process.env, plikEnv) {
  const z = { ...env };
  if (plikEnv) {
    for (const linia of readFileSync(plikEnv, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(linia);
      if (m) z[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  const url = z.SUPABASE_URL?.replace(/\/$/, "");
  const klucz = z.SUPABASE_SECRET_KEY ?? z.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !klucz) throw new Error("Brak SUPABASE_URL lub SUPABASE_SECRET_KEY (zmienne środowiska albo --env).");
  return { url, klucz };
}

const naglowki = (klucz, extra = {}) => ({ apikey: klucz, ...(klucz.startsWith("eyJ") ? { Authorization: `Bearer ${klucz}` } : {}), ...extra });

/** Wszystkie klucze plików projektów (pole objectKey) z dokumentu bazy. */
export function kluczePlikow(dane) {
  const wynik = new Set();
  JSON.stringify(dane, (k, v) => {
    if (k === "objectKey" && typeof v === "string" && KLUCZ_PLIKU.test(v)) wynik.add(v);
    return v;
  });
  return [...wynik].sort();
}

async function wiersze(cfg, tabela, fetchImpl) {
  const wszystkie = [];
  for (let od = 0; ; od += 1000) {
    const r = await fetchImpl(`${cfg.url}/rest/v1/${tabela}?select=*`, { headers: naglowki(cfg.klucz, { Range: `${od}-${od + 999}`, "Range-Unit": "items" }), signal: AbortSignal.timeout(30000) });
    if (r.status === 404) return null; // tabela jeszcze nie istnieje w tym projekcie
    if (!r.ok) throw new Error(`Supabase ${tabela}: HTTP ${r.status}`);
    const czesc = await r.json();
    wszystkie.push(...czesc);
    if (czesc.length < 1000) return wszystkie;
  }
}

export async function eksport({ cfg, katalog, zachowaj = 30, teraz = new Date(), fetchImpl = fetch }) {
  const nazwa = `kopia-${teraz.toISOString().slice(0, 16).replace(/[:]/g, "-")}`;
  const cel = join(resolve(katalog), nazwa);
  if (existsSync(cel)) throw new Error(`Kopia ${nazwa} już istnieje.`);
  const tabele = {};
  for (const t of TABELE) {
    const w = await wiersze(cfg, t, fetchImpl);
    if (w) tabele[t] = w;
  }
  const glowna = tabele.stolarnia_baza?.find((x) => x.id === "glowna");
  if (!glowna?.dane?.projekty) throw new Error("Brak dokumentu „glowna” w stolarnia_baza — kopia przerwana, nic nie zapisano.");
  mkdirSync(join(cel, "pliki"), { recursive: true });
  const pliki = [];
  for (const klucz of kluczePlikow(glowna.dane)) {
    const r = await fetchImpl(`${cfg.url}/storage/v1/object/${BUCKET}/${klucz}`, { headers: naglowki(cfg.klucz), signal: AbortSignal.timeout(60000) });
    if (!r.ok) {
      pliki.push({ klucz, blad: `HTTP ${r.status}` });
      continue;
    }
    const b = Buffer.from(await r.arrayBuffer());
    const sciezka = join(cel, "pliki", klucz);
    mkdirSync(dirname(sciezka), { recursive: true });
    writeFileSync(sciezka, b);
    pliki.push({ klucz, bajty: b.length, sha256: sha(b) });
  }
  const baza = Buffer.from(JSON.stringify({ format: "pan-stolarz-kopia/1", utworzono: teraz.toISOString(), zrodlo: new URL(cfg.url).host, tabele }, null, 1));
  writeFileSync(join(cel, "baza.json"), baza);
  const manifest = {
    format: "pan-stolarz-kopia/1",
    utworzono: teraz.toISOString(),
    zrodlo: new URL(cfg.url).host,
    baza: { bajty: baza.length, sha256: sha(baza) },
    tabele: Object.fromEntries(Object.entries(tabele).map(([k, v]) => [k, v.length])),
    projekty: glowna.dane.projekty.length,
    wersjaGlownej: glowna.wersja,
    pliki,
  };
  writeFileSync(join(cel, "manifest.json"), JSON.stringify(manifest, null, 2));
  // Rotacja: tylko katalogi kopii w tym katalogu, najstarsze pierwsze.
  const usuniete = [];
  const kopie = readdirSync(resolve(katalog)).filter((x) => /^kopia-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}$/.test(x)).sort();
  for (const stara of kopie.slice(0, Math.max(0, kopie.length - zachowaj))) {
    rmSync(join(resolve(katalog), stara), { recursive: true, force: true });
    usuniete.push(stara);
  }
  return { katalog: cel, manifest, usuniete, brakiPlikow: pliki.filter((p) => p.blad).length };
}

/** Sprawdza sumy kontrolne i strukturę kopii. Zwraca listę problemów (pusta = kopia poprawna). */
export function sprawdz(katalogKopii) {
  const problemy = [];
  const manifest = JSON.parse(readFileSync(join(katalogKopii, "manifest.json"), "utf8"));
  const baza = readFileSync(join(katalogKopii, "baza.json"));
  if (sha(baza) !== manifest.baza.sha256) problemy.push("baza.json: suma SHA-256 się nie zgadza");
  const dane = JSON.parse(baza.toString("utf8"));
  const glowna = dane.tabele?.stolarnia_baza?.find((x) => x.id === "glowna");
  if (!glowna?.dane?.projekty) problemy.push("baza.json: brak dokumentu „glowna”");
  else if (glowna.dane.projekty.length !== manifest.projekty) problemy.push("baza.json: liczba projektów inna niż w manifeście");
  for (const p of manifest.pliki) {
    if (p.blad) {
      problemy.push(`plik ${p.klucz}: nie został pobrany (${p.blad})`);
      continue;
    }
    const sciezka = join(katalogKopii, "pliki", p.klucz);
    if (!existsSync(sciezka)) problemy.push(`plik ${p.klucz}: brak w kopii`);
    else if (sha(readFileSync(sciezka)) !== p.sha256) problemy.push(`plik ${p.klucz}: suma SHA-256 się nie zgadza`);
  }
  return { manifest, problemy, glowna };
}

/** Odtworzenie do lokalnego magazynu aplikacji (stolarnia.json + project-files/). */
export function odtworzLokalnie(katalogKopii, katalogDanych) {
  const { problemy, glowna, manifest } = sprawdz(katalogKopii);
  if (problemy.length) throw new Error(`Kopia uszkodzona:\n- ${problemy.join("\n- ")}`);
  const cel = resolve(katalogDanych);
  if (existsSync(join(cel, "stolarnia.json"))) throw new Error(`${cel} zawiera już stolarnia.json — wskaż pusty katalog.`);
  mkdirSync(cel, { recursive: true });
  writeFileSync(join(cel, "stolarnia.json"), JSON.stringify(glowna.dane, null, 1));
  for (const p of manifest.pliki) {
    const sciezka = join(cel, "project-files", p.klucz);
    mkdirSync(dirname(sciezka), { recursive: true });
    writeFileSync(sciezka, readFileSync(join(katalogKopii, "pliki", p.klucz)));
  }
  return { projekty: glowna.dane.projekty.length, pliki: manifest.pliki.length, plik: join(cel, "stolarnia.json") };
}

/** Odtworzenie produkcji: dokument „glowna” (nowa wersja, nie nadpisuje równoległej zmiany) i pliki projektów. */
export async function odtworzChmure({ cfg, katalogKopii, katalogZabezpieczenia, fetchImpl = fetch }) {
  const { problemy, glowna, manifest } = sprawdz(katalogKopii);
  if (problemy.length) throw new Error(`Kopia uszkodzona:\n- ${problemy.join("\n- ")}`);
  const zabezpieczenie = await eksport({ cfg, katalog: katalogZabezpieczenia, zachowaj: 1000, fetchImpl });
  const teraz = zabezpieczenie.manifest.wersjaGlownej;
  const r = await fetchImpl(`${cfg.url}/rest/v1/stolarnia_baza?id=eq.glowna&wersja=eq.${teraz}`, {
    method: "PATCH",
    headers: naglowki(cfg.klucz, { "Content-Type": "application/json", Prefer: "return=representation" }),
    body: JSON.stringify({ dane: glowna.dane, wersja: teraz + 1, zmieniono: new Date().toISOString() }),
  });
  const zmienione = r.ok ? await r.json() : [];
  if (!r.ok || !zmienione.length) throw new Error(`Nie odtworzono dokumentu (HTTP ${r.status}; równoległa zmiana?). Stan sprzed próby: ${zabezpieczenie.katalog}`);
  for (const p of manifest.pliki) {
    const u = await fetchImpl(`${cfg.url}/storage/v1/object/${BUCKET}/${p.klucz}`, {
      method: "POST",
      headers: naglowki(cfg.klucz, { "Content-Type": "application/octet-stream", "x-upsert": "true" }),
      body: readFileSync(join(katalogKopii, "pliki", p.klucz)),
    });
    if (!u.ok) throw new Error(`Plik ${p.klucz}: HTTP ${u.status}. Dokument odtworzono; ponów odtworzenie plików.`);
  }
  return { wersja: teraz + 1, projekty: glowna.dane.projekty.length, pliki: manifest.pliki.length, zabezpieczenie: zabezpieczenie.katalog };
}

// ---------- Wiersz poleceń ----------
async function main(argv) {
  const [komenda, ...reszta] = argv;
  const opcja = (n) => {
    const i = reszta.indexOf(n);
    return i >= 0 ? reszta[i + 1] : undefined;
  };
  const zWartoscia = new Set(["--katalog", "--zachowaj", "--env"]);
  const pozycyjne = reszta.filter((x, i) => !x.startsWith("--") && !(i > 0 && zWartoscia.has(reszta[i - 1])));
  if (komenda === "eksport") {
    const katalog = opcja("--katalog");
    if (!katalog) throw new Error("Podaj --katalog (poza repozytorium, np. dysk z kopią w chmurze).");
    const w = await eksport({ cfg: konfiguracja(process.env, opcja("--env")), katalog, zachowaj: Number(opcja("--zachowaj") ?? 30) });
    const { problemy } = sprawdz(w.katalog);
    console.log(`Kopia: ${w.katalog}\nProjekty: ${w.manifest.projekty}; tabele: ${JSON.stringify(w.manifest.tabele)}; pliki: ${w.manifest.pliki.length}${w.brakiPlikow ? ` (nie pobrano ${w.brakiPlikow})` : ""}; usunięte stare: ${w.usuniete.length}`);
    if (problemy.length || w.brakiPlikow) {
      console.error(`UWAGA:\n- ${problemy.join("\n- ")}`);
      process.exitCode = 2;
    }
  } else if (komenda === "sprawdz") {
    const { manifest, problemy } = sprawdz(pozycyjne[0]);
    console.log(`Kopia z ${manifest.utworzono}: ${manifest.projekty} projektów, ${manifest.pliki.length} plików.`);
    if (problemy.length) {
      console.error(`Problemy:\n- ${problemy.join("\n- ")}`);
      process.exitCode = 2;
    } else console.log("Sumy kontrolne zgodne.");
  } else if (komenda === "odtworz-lokalnie") {
    const w = odtworzLokalnie(pozycyjne[0], pozycyjne[1]);
    console.log(`Odtworzono ${w.projekty} projektów i ${w.pliki} plików do ${w.plik}.\nPodgląd: STOLARNIA_DATA=${resolve(pozycyjne[1])} npm run dev:api (bez zmiennych SUPABASE_*).`);
  } else if (komenda === "odtworz-chmure") {
    if (!reszta.includes("--potwierdzam")) throw new Error("Odtworzenie produkcji nadpisze bieżące projekty. Dodaj --potwierdzam.");
    const w = await odtworzChmure({ cfg: konfiguracja(process.env, opcja("--env")), katalogKopii: pozycyjne[0], katalogZabezpieczenia: join(dirname(resolve(pozycyjne[0])), "przed-odtworzeniem") });
    console.log(`Odtworzono dokument (wersja ${w.wersja}, ${w.projekty} projektów) i ${w.pliki} plików. Stan sprzed odtworzenia: ${w.zabezpieczenie}`);
  } else {
    console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).slice(0, 6).join("\n"));
    process.exitCode = komenda ? 1 : 0;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href)
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
