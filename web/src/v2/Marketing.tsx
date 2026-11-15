import { useEffect, useMemo, useRef, useState } from "react";
import { request } from "./api";
import { useResource } from "./useResource";
import { Feedback } from "./ui";
import { NAZWY_STANOW, type StanDostarczenia } from "../../../src/core/marketing-stany";
import type { Dostarczenie, Kanal, PostMarketingu, TrescPosta, WpisAudytu } from "../../../src/core/marketing";
import type { KonfiguracjaMeta } from "../../../src/server/marketing";
import "./marketing.css";

// Panel publikacji social (właściciel): przegląd tygodniami, podgląd IG/FB, edycja, akceptacja wersji,
// potwierdzenie terminów, import paczki content-import.json i ręczne „wyślij należne teraz”.
// Domyślnie symulacja — panel wyraźnie mówi, czy cokolwiek trafia na Facebook/Instagram.

type Post = PostMarketingu & { dostarczenia: Dostarczenie[]; problem: string | null; historia: WpisAudytu[] };
type Dane = { konfiguracja: KonfiguracjaMeta; posty: Post[] };

const STREFA = "Europe/Warsaw";
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pl-PL", { timeZone: STREFA, ...o }).format(new Date(iso));
const dzienGodzina = (iso: string) => fmt(iso, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
/** Poniedziałek tygodnia (data w Warszawie) jako klucz grupy. */
function tydzien(iso: string) {
  const [d, m, r] = fmt(iso, { day: "2-digit", month: "2-digit", year: "numeric" }).split(".").map(Number);
  const dzien = new Date(Date.UTC(r, m - 1, d));
  const pn = new Date(dzien.getTime() - ((dzien.getUTCDay() + 6) % 7) * 86400_000);
  const nd = new Date(pn.getTime() + 6 * 86400_000);
  const f = (x: Date) => x.toLocaleDateString("pl-PL", { day: "numeric", month: "long", timeZone: "UTC" });
  return { klucz: pn.toISOString().slice(0, 10), nazwa: `${f(pn)} – ${f(nd)}` };
}
/** „RRRR-MM-DDTHH:mm” w czasie warszawskim → ISO UTC (z uwzględnieniem zmiany czasu). */
export function warszawaNaUtc(lokalny: string) {
  const [d, t] = lokalny.split("T");
  const [r, m, dz] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  const zgadnij = Date.UTC(r, m - 1, dz, h, mi);
  const przesuniecie = (ts: number) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: STREFA, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - ts;
  };
  const pierwsze = zgadnij - przesuniecie(zgadnij);
  return new Date(zgadnij - przesuniecie(pierwsze)).toISOString();
}
const utcNaWarszawe = (iso: string) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: STREFA, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};
const base64 = (b: ArrayBuffer) => {
  let s = "";
  const u = new Uint8Array(b);
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};
const sha256 = async (b: ArrayBuffer) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", b))].map((x) => x.toString(16).padStart(2, "0")).join("");

const RODZAJ: Record<string, string> = { feed: "Post", story: "Story — ręcznie", ad_concept: "Reklama — koncepcja, ręcznie" };
const KANAL: Record<Kanal, string> = { facebook: "Facebook", instagram: "Instagram" };
const FILTRY: [string, string, (p: Post) => boolean][] = [
  ["akceptacja", "Do akceptacji", (p) => p.dostarczenia.some((d) => d.stan === "pending")],
  ["kolejka", "Zaplanowane", (p) => p.dostarczenia.some((d) => d.stan === "queued")],
  ["reczne", "Do ręcznej publikacji", (p) => p.dostarczenia.some((d) => d.stan === "manual")],
  // Problem = blokada po akceptacji albo błąd/niepewny wynik; „potwierdź terminy” przed akceptacją to zwykły krok.
  ["problemy", "Problemy", (p) => p.dostarczenia.some((d) => ["blocked", "failed", "unknown"].includes(d.stan)) || (!!p.problem && p.dostarczenia.some((d) => d.stan === "queued"))],
  ["wyslane", "Opublikowane / symulacja", (p) => p.dostarczenia.some((d) => ["published", "simulated"].includes(d.stan))],
  ["wszystkie", "Wszystkie", () => true],
];
const tonStanu = (s: StanDostarczenia) => (["published"].includes(s) ? "ok" : ["failed", "unknown", "blocked"].includes(s) ? "zle" : s === "simulated" ? "sym" : "");

export function Marketing() {
  const dane = useResource<Dane>("/api/marketing");
  const [filtr, setFiltr] = useState("akceptacja");
  const [edytowany, setEdytowany] = useState<Post | "nowy" | null>(null);
  const [potwierdzany, setPotwierdzany] = useState<Post | null>(null);
  const [importOtwarty, setImportOtwarty] = useState(false);
  const [komunikat, setKomunikat] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [zajety, setZajety] = useState(false);

  const akcja = async (opis: string, f: () => Promise<unknown>) => {
    setZajety(true);
    setBlad(null);
    try {
      const w = await f();
      // Komunikat z akcji tylko wtedy, gdy zwraca go jawnie; inaczej opis (serwer zwraca np. sam identyfikator).
      setKomunikat((w as { komunikat?: string } | undefined)?.komunikat ?? opis);
      dane.retry();
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setZajety(false);
    }
  };
  const posty = dane.data?.posty ?? [];
  const wybrany = FILTRY.find((f) => f[0] === filtr)!;
  const widoczne = posty.filter(wybrany[2]);
  const grupy = useMemo(() => {
    const m = new Map<string, { nazwa: string; posty: Post[] }>();
    for (const p of widoczne) {
      const t = tydzien(p.tresc.scheduledAt);
      if (!m.has(t.klucz)) m.set(t.klucz, { nazwa: t.nazwa, posty: [] });
      m.get(t.klucz)!.posty.push(p);
    }
    return [...m.values()];
  }, [widoczne]);
  const k = dane.data?.konfiguracja;

  return (
    <section className="ps-owner-page ps-mkt">
      <span className="ps-eyebrow">Social media</span>
      <h1>Publikacje</h1>
      <p className="ps-page-intro">
        Posty na Facebook i Instagram: przegląd, akceptacja konkretnej wersji i harmonogram. Każda zmiana tekstu, grafiki albo terminu cofa akceptację.
      </p>
      {k && (
        <div className={`ps-mkt-tryb ${k.tryb === "live" ? "live" : ""}`} role="status">
          <b>{k.tryb === "live" ? "Publikacja na żywo" : "Symulacja — nic nie trafia na Facebook ani Instagram"}</b>
          <span>Facebook: {k.facebook ? "połączony" : "niepołączony"}</span>
          <span>Instagram: {k.instagram ? "połączony" : "niepołączony"}</span>
          <span>Wysyłka automatyczna: {k.automat ? "włączona" : "wyłączona — użyj „Wyślij należne teraz”"}</span>
        </div>
      )}
      <div className="ps-mkt-akcje">
        <button className="ps-button" onClick={() => setEdytowany("nowy")}>
          Nowy post
        </button>
        <button className="ps-button secondary" onClick={() => setImportOtwarty(true)}>
          Importuj paczkę
        </button>
        <button
          className="ps-button secondary"
          disabled={zajety}
          onClick={() =>
            void akcja("Wysłano", async () => {
              const w = await request<{ postId: string; kanal: string; stan: string }[]>("/api/marketing/wyslij", { method: "POST" });
              return { komunikat: w.length ? `Przetworzono: ${w.map((x) => `${x.postId} ${KANAL[x.kanal as Kanal]} → ${NAZWY_STANOW[x.stan as StanDostarczenia]}`).join("; ")}` : "Nie ma należnych, zaakceptowanych postów." };
            })
          }
        >
          Wyślij należne teraz
        </button>
      </div>
      {komunikat && (
        <p className="ps-mkt-komunikat" role="status">
          {komunikat}
        </p>
      )}
      {blad && <Feedback>{blad}</Feedback>}
      <div className="ps-mkt-filtry" role="group" aria-label="Pokaż posty">
        {FILTRY.map(([id, nazwa, f]) => (
          <button key={id} className="ps-button secondary" aria-pressed={filtr === id} onClick={() => setFiltr(id)}>
            {nazwa} <span>{posty.filter(f).length}</span>
          </button>
        ))}
      </div>
      {dane.busy ? (
        <p role="status">Wczytywanie postów…</p>
      ) : dane.error ? (
        <Feedback retry={dane.retry}>{dane.error}</Feedback>
      ) : !grupy.length ? (
        <div className="ps-empty">
          <h2>{posty.length ? "Brak postów w tym widoku" : "Jeszcze bez postów"}</h2>
          <p>{posty.length ? "Wybierz inny filtr." : "Dodaj post albo zaimportuj paczkę content-import.json z grafikami."}</p>
        </div>
      ) : (
        grupy.map((g) => (
          <section key={g.nazwa} className="ps-mkt-tydzien" aria-label={`Tydzień ${g.nazwa}`}>
            <h2>{g.nazwa}</h2>
            <ul>
              {g.posty.map((p) => (
                <li key={p.id} className="ps-mkt-post">
                  <img src={p.tresc.assets[0].publicUrl} alt={p.tresc.assets[0].altText} loading="lazy" />
                  <div className="ps-mkt-opis">
                    <span className="ps-mkt-meta">
                      {dzienGodzina(p.tresc.scheduledAt)} · {RODZAJ[p.tresc.kind]} · {p.id}
                    </span>
                    <b>{p.tresc.title}</b>
                    <span className="ps-mkt-kanaly">
                      {p.dostarczenia.map((d) => (
                        <span key={d.kanal} className={`ps-mkt-stan ${tonStanu(d.stan)}`} title={d.blad ?? undefined}>
                          {KANAL[d.kanal]}: {NAZWY_STANOW[d.stan]}
                        </span>
                      ))}
                    </span>
                    {p.problem &&
                      (p.dostarczenia.every((d) => d.stan === "pending") ? (
                        <span className="ps-mkt-meta">Przed akceptacją: {p.problem}</span>
                      ) : (
                        <span className="ps-mkt-problem">Wstrzymanie: {p.problem}</span>
                      ))}
                    {p.dostarczenia.find((d) => d.blad) && <span className="ps-mkt-problem">{p.dostarczenia.find((d) => d.blad)!.blad}</span>}
                  </div>
                  <div className="ps-mkt-przyciski">
                    <button className="ps-button secondary" onClick={() => setEdytowany(p)}>
                      Podgląd i edycja
                    </button>
                    {p.tresc.requiresAvailabilityConfirmation && p.dostarczenia.some((d) => ["pending", "queued", "blocked"].includes(d.stan)) && (
                      <button className="ps-button secondary" onClick={() => setPotwierdzany(p)}>
                        Potwierdź terminy
                      </button>
                    )}
                    {p.dostarczenia.some((d) => d.stan === "pending") && (
                      <button className="ps-button" disabled={zajety || !!p.problem} title={p.problem ?? undefined} onClick={() => void akcja(`Zaakceptowano ${p.id}`, () => request(`/api/marketing/posty/${p.id}/akceptuj`, { method: "POST" }))}>
                        Zaakceptuj
                      </button>
                    )}
                    {p.dostarczenia.some((d) => ["queued", "manual", "blocked"].includes(d.stan)) && (
                      <button className="ps-button secondary" disabled={zajety} onClick={() => void akcja(`Cofnięto akceptację ${p.id}`, () => request(`/api/marketing/posty/${p.id}/cofnij`, { method: "POST" }))}>
                        Cofnij akceptację
                      </button>
                    )}
                    {p.dostarczenia
                      .filter((d) => ["manual", "unknown", "failed", "blocked"].includes(d.stan))
                      .map((d) => (
                        <button
                          key={d.kanal}
                          className="ps-button secondary"
                          disabled={zajety}
                          onClick={() =>
                            window.confirm(`Czy post ${p.id} ukazał się na ${KANAL[d.kanal]}? „OK” = opublikowany, „Anuluj” = nie ukazał się.`)
                              ? void akcja("Oznaczono", () => request(`/api/marketing/posty/${p.id}/oznacz`, { method: "POST", body: JSON.stringify({ kanal: d.kanal, stan: "published" }) }))
                              : d.stan !== "failed" && void akcja("Oznaczono", () => request(`/api/marketing/posty/${p.id}/oznacz`, { method: "POST", body: JSON.stringify({ kanal: d.kanal, stan: "failed" }) }))
                          }
                        >
                          {d.stan === "manual" ? `Opublikowałem ręcznie (${KANAL[d.kanal]})` : `Wyjaśnij ${KANAL[d.kanal]}`}
                        </button>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      {edytowany && (
        <Edytor
          post={edytowany === "nowy" ? null : edytowany}
          onZamknij={() => setEdytowany(null)}
          onZapisano={(w) => {
            setEdytowany(null);
            setKomunikat(w);
            dane.retry();
          }}
          onUsun={(id) => {
            setEdytowany(null);
            void akcja(`Usunięto ${id}`, () => request(`/api/marketing/posty/${id}`, { method: "DELETE" }));
          }}
        />
      )}
      {potwierdzany && (
        <Potwierdzenie
          post={potwierdzany}
          onZamknij={() => setPotwierdzany(null)}
          onGotowe={() => {
            setPotwierdzany(null);
            setKomunikat(`Potwierdzono terminy dla ${potwierdzany.id}`);
            dane.retry();
          }}
        />
      )}
      {importOtwarty && (
        <Import
          onZamknij={() => setImportOtwarty(false)}
          onGotowe={(w) => {
            setImportOtwarty(false);
            setKomunikat(w);
            setFiltr("akceptacja");
            dane.retry();
          }}
        />
      )}
    </section>
  );
}

function Okno({ tytul, onZamknij, children }: { tytul: string; onZamknij: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className="ps-mkt-okno" aria-label={tytul} onClose={onZamknij} onCancel={onZamknij}>
      <header>
        <h2>{tytul}</h2>
        <button className="ps-button secondary" onClick={onZamknij}>
          Zamknij
        </button>
      </header>
      {children}
    </dialog>
  );
}

const nowyId = () => `P-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}`;

function Edytor({ post, onZamknij, onZapisano, onUsun }: { post: Post | null; onZamknij: () => void; onZapisano: (w: string) => void; onUsun: (id: string) => void }) {
  const t = post?.tresc;
  const jutro = utcNaWarszawe(new Date(Date.now() + 86400_000).toISOString()).slice(0, 11) + "18:00";
  const [f, setF] = useState({
    id: post?.id ?? nowyId(),
    title: t?.title ?? "",
    captionInstagram: t?.captionInstagram ?? "",
    captionFacebook: t?.captionFacebook ?? "",
    kiedy: t ? utcNaWarszawe(t.scheduledAt) : jutro,
    channels: (t?.channels ?? ["facebook", "instagram"]) as Kanal[],
    kind: t?.kind ?? "feed",
    sourceType: t?.sourceType ?? "photo",
    oferta: t?.requiresAvailabilityConfirmation ?? false,
    ofertaDo: t?.offerValidUntil ? utcNaWarszawe(t.offerValidUntil).slice(0, 10) : "",
    assets: t?.assets ?? [],
  });
  const [blad, setBlad] = useState<string | null>(null);
  const [zajety, setZajety] = useState(false);
  const opublikowany = !!post?.dostarczenia.some((d) => ["published", "publishing", "unknown"].includes(d.stan));
  const ustaw = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const dodajGrafike = async (plik: File) => {
    setZajety(true);
    setBlad(null);
    try {
      let bajty = await plik.arrayBuffer();
      const u = new Uint8Array(bajty);
      if (!(u[0] === 0xff && u[1] === 0xd8) || bajty.byteLength > 8 * 1024 * 1024) {
        // nie-JPEG (np. PNG, HEIC) albo za duży: zamiana na JPEG w przeglądarce
        const { jpegBase64 } = await import("./ProjectPhotos");
        bajty = Uint8Array.from(atob(await jpegBase64(plik)), (c) => c.charCodeAt(0)).buffer;
      }
      const g = await request<{ publicUrl: string; sha256: string }>("/api/marketing/grafiki", { method: "POST", body: JSON.stringify({ base64: base64(bajty) }) });
      ustaw("assets", [{ publicUrl: g.publicUrl, sha256: g.sha256, altText: f.title || plik.name, mimeType: "image/jpeg" }]);
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setZajety(false);
    }
  };
  const zapisz = async () => {
    setZajety(true);
    setBlad(null);
    try {
      const tresc: TrescPosta = {
        title: f.title,
        captionInstagram: f.captionInstagram,
        captionFacebook: f.captionFacebook,
        scheduledAt: warszawaNaUtc(f.kiedy),
        timezone: "Europe/Warsaw",
        channels: f.channels,
        assets: f.assets.map((a) => ({ ...a, altText: a.altText || f.title })),
        kind: f.kind,
        sourceType: f.sourceType,
        requiresAvailabilityConfirmation: f.oferta,
        offerValidUntil: f.oferta && f.ofertaDo ? warszawaNaUtc(`${f.ofertaDo}T23:59`) : null,
      };
      const w = await request<string>(`/api/marketing/posty/${encodeURIComponent(f.id)}`, { method: "PUT", body: JSON.stringify(tresc) });
      onZapisano(w === "bez zmian" ? "Bez zmian." : `Zapisano ${f.id} — czeka na akceptację.`);
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setZajety(false);
    }
  };
  return (
    <Okno tytul={post ? `Post ${post.id}` : "Nowy post"} onZamknij={onZamknij}>
      <div className="ps-mkt-edytor">
        <div className="ps-mkt-pola">
          {opublikowany && <Feedback>Ten post jest opublikowany albo ma niepewny wynik — zmiany zapisz jako nowy post (zmień identyfikator).</Feedback>}
          {blad && <Feedback>{blad}</Feedback>}
          <label className="field">
            <span>Identyfikator</span>
            <input className="input" value={f.id} onChange={(e) => ustaw("id", e.target.value.replace(/[^A-Za-z0-9._-]/g, ""))} />
          </label>
          <label className="field">
            <span>Tytuł (wewnętrzny)</span>
            <input className="input" maxLength={200} value={f.title} onChange={(e) => ustaw("title", e.target.value)} />
          </label>
          <div className="ps-mkt-dwa">
            <label className="field">
              <span>Data i godzina (czas polski)</span>
              <input className="input" type="datetime-local" value={f.kiedy} onChange={(e) => ustaw("kiedy", e.target.value)} />
            </label>
            <label className="field">
              <span>Rodzaj</span>
              <select className="input" value={f.kind} onChange={(e) => ustaw("kind", e.target.value as typeof f.kind)}>
                <option value="feed">Post (wysyłany automatycznie)</option>
                <option value="story">Story (ręcznie)</option>
                <option value="ad_concept">Reklama — koncepcja (ręcznie)</option>
              </select>
            </label>
          </div>
          <fieldset className="ps-mkt-kanaly-wybor">
            <legend>Kanały</legend>
            {(["facebook", "instagram"] as Kanal[]).map((k) => (
              <label key={k}>
                <input type="checkbox" checked={f.channels.includes(k)} onChange={(e) => ustaw("channels", e.target.checked ? [...f.channels, k] : f.channels.filter((x) => x !== k))} /> {KANAL[k]}
              </label>
            ))}
          </fieldset>
          <label className="field">
            <span>Grafika (JPEG; inne formaty zamienimy na JPEG)</span>
            <input type="file" accept="image/*" disabled={zajety} onChange={(e) => e.target.files?.[0] && void dodajGrafike(e.target.files[0])} />
          </label>
          <label className="field">
            <span>Źródło grafiki</span>
            <select className="input" value={f.sourceType} onChange={(e) => ustaw("sourceType", e.target.value as typeof f.sourceType)}>
              <option value="photo">Zdjęcie realizacji</option>
              <option value="project_visualization">Wizualizacja projektu</option>
              <option value="typography">Grafika tekstowa</option>
              <option value="concept_ai">Wizualizacja koncepcyjna AI (wymaga oznaczenia w tekście)</option>
            </select>
          </label>
          <label className="field">
            <span>Tekst Instagram ({f.captionInstagram.length}/2200)</span>
            <textarea className="input" rows={6} maxLength={2200} value={f.captionInstagram} onChange={(e) => ustaw("captionInstagram", e.target.value)} />
          </label>
          <label className="field">
            <span>Tekst Facebook</span>
            <textarea className="input" rows={6} value={f.captionFacebook} onChange={(e) => ustaw("captionFacebook", e.target.value)} />
          </label>
          <label className="ps-mkt-oferta">
            <input type="checkbox" checked={f.oferta} onChange={(e) => ustaw("oferta", e.target.checked)} /> Post obiecuje terminy / ofertę (wymaga potwierdzenia dostępności przed wysłaniem)
          </label>
          {f.oferta && (
            <label className="field">
              <span>Oferta ważna do</span>
              <input className="input" type="date" value={f.ofertaDo} onChange={(e) => ustaw("ofertaDo", e.target.value)} />
            </label>
          )}
          <div className="ps-mkt-akcje">
            <button className="ps-button" disabled={zajety || !f.assets.length || !f.channels.length} onClick={() => void zapisz()}>
              {zajety ? "Zapisywanie…" : "Zapisz (wraca do akceptacji)"}
            </button>
            {post && !opublikowany && (
              <button className="ps-button secondary" onClick={() => window.confirm(`Usunąć post ${post.id}?`) && onUsun(post.id)}>
                Usuń post
              </button>
            )}
          </div>
          {!!post?.historia.length && (
            <details>
              <summary>Historia ({post.historia.length})</summary>
              <ul className="ps-mkt-historia">
                {post.historia.map((h, i) => (
                  <li key={i}>
                    {dzienGodzina(h.kiedy)} · {h.zdarzenie}
                    {h.szczegoly.kanal ? ` · ${String(h.szczegoly.kanal)}` : ""}
                    {h.szczegoly.kto ? ` · ${String(h.szczegoly.kto)}` : ""}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
        <div className="ps-mkt-podglady" aria-label="Podgląd">
          {f.channels.includes("instagram") && (
            <figure className="ps-mkt-ig">
              <figcaption>Instagram</figcaption>
              {f.assets[0] ? <img src={f.assets[0].publicUrl} alt="" /> : <div className="ps-mkt-brak">Brak grafiki</div>}
              <p>
                <b>panstolarz.meble</b> {f.captionInstagram.slice(0, 125)}
                {f.captionInstagram.length > 125 && <span className="ps-muted">… więcej</span>}
              </p>
            </figure>
          )}
          {f.channels.includes("facebook") && (
            <figure className="ps-mkt-fb">
              <figcaption>Facebook</figcaption>
              <p className="ps-mkt-fb-tekst">{f.captionFacebook}</p>
              {f.assets[0] && <img src={f.assets[0].publicUrl} alt="" />}
            </figure>
          )}
        </div>
      </div>
    </Okno>
  );
}

function Potwierdzenie({ post, onZamknij, onGotowe }: { post: Post; onZamknij: () => void; onGotowe: () => void }) {
  const maks = post.tresc.offerValidUntil ? utcNaWarszawe(post.tresc.offerValidUntil).slice(0, 10) : "";
  const [doKiedy, setDoKiedy] = useState(maks);
  const [blad, setBlad] = useState<string | null>(null);
  return (
    <Okno tytul={`Potwierdź terminy — ${post.id}`} onZamknij={onZamknij}>
      <p>
        Post obiecuje terminy. Potwierdź, że <b>dziś</b> nadal je masz. Potwierdzenie jest ważne 24 godziny i najdłużej do daty poniżej; po tym czasie wysyłka zostanie wstrzymana.
      </p>
      {blad && <Feedback>{blad}</Feedback>}
      <label className="field">
        <span>Terminy aktualne do (najpóźniej {maks})</span>
        <input className="input" type="date" max={maks} value={doKiedy} onChange={(e) => setDoKiedy(e.target.value)} />
      </label>
      <button
        className="ps-button"
        disabled={!doKiedy}
        onClick={async () => {
          try {
            await request(`/api/marketing/posty/${post.id}/potwierdz`, { method: "POST", body: JSON.stringify({ doKiedy: warszawaNaUtc(`${doKiedy}T23:59`) }) });
            onGotowe();
          } catch (e) {
            setBlad((e as Error).message);
          }
        }}
      >
        Potwierdzam dostępność terminów
      </button>
    </Okno>
  );
}

/** Import paczki: plik content-import.json + folder z grafikami; grafiki są sprawdzane (SHA-256) i wgrywane, potem import. */
function Import({ onZamknij, onGotowe }: { onZamknij: () => void; onGotowe: (w: string) => void }) {
  const [paczka, setPaczka] = useState<{ posts: { id: string; assets: { path: string; sha256: string; publicUrl?: string | null }[] }[] } | null>(null);
  const [pliki, setPliki] = useState<File[]>([]);
  const [postep, setPostep] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const sciezka = (f: File) => ((f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name).replace(/\\/g, "/");
  const brakujace = paczka ? paczka.posts.flatMap((p) => p.assets).filter((a) => !pliki.some((f) => sciezka(f).endsWith(a.path.replace(/\\/g, "/")))) : [];
  const start = async () => {
    if (!paczka) return;
    setBlad(null);
    try {
      const assets = paczka.posts.flatMap((p) => p.assets);
      const wgrane = new Map<string, string>();
      for (const [i, a] of assets.entries()) {
        setPostep(`Grafiki: ${i + 1} z ${assets.length}`);
        if (wgrane.has(a.sha256)) continue;
        const plik = pliki.find((f) => sciezka(f).endsWith(a.path.replace(/\\/g, "/")))!;
        const bajty = await plik.arrayBuffer();
        if ((await sha256(bajty)) !== a.sha256) throw new Error(`Grafika ${a.path} różni się od zapisanej w paczce (SHA-256).`);
        const g = await request<{ publicUrl: string }>("/api/marketing/grafiki", { method: "POST", body: JSON.stringify({ base64: base64(bajty) }) });
        wgrane.set(a.sha256, g.publicUrl);
      }
      setPostep("Import postów…");
      const z = { ...paczka, posts: paczka.posts.map((p) => ({ ...p, assets: p.assets.map((a) => ({ ...a, publicUrl: wgrane.get(a.sha256) })) })) };
      const w = await request<{ nowy: number; zmieniony: number; "bez zmian": number; bledy: string[] }>("/api/marketing/import", { method: "POST", body: JSON.stringify(z) });
      onGotowe(`Import: nowe ${w.nowy}, zmienione ${w.zmieniony}, bez zmian ${w["bez zmian"]}${w.bledy.length ? `; odrzucone ${w.bledy.length}: ${w.bledy.slice(0, 3).join("; ")}` : ""}. Wszystkie czekają na akceptację.`);
    } catch (e) {
      setBlad((e as Error).message);
      setPostep(null);
    }
  };
  return (
    <Okno tytul="Importuj paczkę postów" onZamknij={onZamknij}>
      <p>Wybierz plik content-import.json (schemaVersion 1) i folder paczki z grafikami. Import nie publikuje — każdy post czeka na Twoją akceptację.</p>
      {blad && <Feedback>{blad}</Feedback>}
      <label className="field">
        <span>Plik content-import.json</span>
        <input
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            setBlad(null);
            try {
              const j = JSON.parse(await e.target.files![0].text());
              if (j.schemaVersion !== 1 || !Array.isArray(j.posts)) throw new Error("To nie jest paczka content-import.json (schemaVersion 1).");
              setPaczka(j);
            } catch (er) {
              setBlad((er as Error).message);
            }
          }}
        />
      </label>
      <label className="field">
        <span>Folder paczki z grafikami</span>
        <input type="file" multiple {...({ webkitdirectory: "" } as object)} onChange={(e) => setPliki([...(e.target.files ?? [])])} />
      </label>
      {paczka && (
        <p role="status">
          Postów: {paczka.posts.length}; grafik: {paczka.posts.flatMap((p) => p.assets).length}; {brakujace.length ? `brakuje plików: ${brakujace.length} (np. ${brakujace[0].path})` : "wszystkie grafiki znalezione."}
        </p>
      )}
      {postep && <p role="status">{postep}</p>}
      <button className="ps-button" disabled={!paczka || !!brakujace.length || !!postep} onClick={() => void start()}>
        Wgraj grafiki i importuj
      </button>
    </Okno>
  );
}
