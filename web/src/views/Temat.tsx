import { useEffect, useState } from "react";
import { NAZWY_STATUSOW, STATUSY_PROJEKTU } from "../../../src/core/statusy";
import type { RodzajAGD } from "../../../src/core/types";
import { api, type Analiza, type NotatkaProjektu, type StatusProjektu, type UrzadzenieAGD } from "../api";
import { NAZWY_STATUSU as NAZWY_STATUSU_ROZLICZENIA, type Rozliczenie as RozliczenieProjektu, type SposobWplaty } from "../../../src/core/rozliczenie";

// Mikro CRM tematu: etap realizacji, kontakt z klientem, termin montażu i notatki robocze (braki, ustalenia).
export function Temat({ analiza, odswiez }: { analiza: Analiza; odswiez: () => Promise<void> }) {
  const p = analiza.projekt;
  const [blad, setBlad] = useState<string | null>(null);
  const [nowa, setNowa] = useState("");
  const [pokazZalatwione, setPokazZalatwione] = useState(false);
  // Zwolnienie do produkcji (R02): serwer odmawia przy wydaniu roboczym lub nieaktualnym; właściciel może świadomie z powodem.
  const [zwolnienie, setZwolnienie] = useState<{ komunikat: string; powod: string } | null>(null);
  const ustawStatus = async (s: StatusProjektu) => {
    if (s !== "produkcja") return zmien({ status: s });
    try {
      await api.zmienProjekt(p.id, { status: s });
      setBlad(null);
      setZwolnienie(null);
      await odswiez();
    } catch (e) {
      const m = (e as Error).message;
      if (/podając powód/.test(m)) setZwolnienie({ komunikat: m, powod: "" });
      else setBlad(m);
    }
  };

  const wykonaj = async (f: () => Promise<unknown>) => {
    try {
      await f();
      setBlad(null);
      await odswiez();
    } catch (e) {
      setBlad((e as Error).message);
    }
  };
  const zmien = (d: Record<string, unknown>) => wykonaj(() => api.zmienProjekt(p.id, d));
  const dodaj = () => {
    const t = nowa.trim();
    if (!t) return;
    setNowa("");
    wykonaj(() => api.dodajNotatke(p.id, t));
  };

  const notatki = p.notatkiRobocze ?? [];
  const otwarte = notatki.filter((n) => !n.zalatwiona);
  const zalatwione = notatki.filter((n) => n.zalatwiona);
  const idx = STATUSY_PROJEKTU.indexOf(p.status);

  return (
    <div className="temat">
      {blad && <div className="alert blad">{blad}</div>}

      <div className="card">
        <div className="card-h"><h2>Etap</h2></div>
        <div className="card-b">
          <div className="etapy" role="radiogroup" aria-label="Status tematu">
            {STATUSY_PROJEKTU.map((s, i) => (
              <button
                key={s}
                role="radio"
                aria-checked={s === p.status}
                className={`etap ${s === p.status ? "on" : i < idx ? "za" : ""}`}
                onClick={() => s !== p.status && void ustawStatus(s)}
              >
                <span className="etap-nr">{i + 1}</span>
                {NAZWY_STATUSOW[s]}
              </button>
            ))}
          </div>
          {zwolnienie && (
            <div className="alert ostrzezenie" role="alert" style={{ marginTop: 10, display: "grid", gap: 8 }}>
              <b>Projekt nie jest gotowy do produkcji</b>
              <span>{zwolnienie.komunikat}</span>
              <div className="field">
                <label htmlFor="zwolnienie-powod">Powód świadomego zwolnienia (trafi do uwag, widzi go warsztat)</label>
                <input id="zwolnienie-powod" className="input" maxLength={500} value={zwolnienie.powod} onChange={(e) => setZwolnienie({ ...zwolnienie, powod: e.target.value })} />
              </div>
              <div className="row">
                <button className="btn" onClick={() => setZwolnienie(null)}>Anuluj</button>
                <button
                  className="btn primary"
                  disabled={!zwolnienie.powod.trim()}
                  onClick={async () => {
                    await wykonaj(() => api.zmienProjekt(p.id, { status: "produkcja", zwolnienieMimoBrakow: zwolnienie.powod.trim() }));
                    setZwolnienie(null);
                  }}
                >
                  Zwolnij mimo braków
                </button>
              </div>
            </div>
          )}
          {!!p.historiaStatusow?.length && (
            <details className="historia">
              <summary className="muted">Historia etapów ({p.historiaStatusow.length})</summary>
              <ul>
                {[...p.historiaStatusow].reverse().map((h, i) => (
                  <li key={i}><b>{NAZWY_STATUSOW[h.status] ?? h.status}</b> <span className="muted">· {data(h.data)}</span></li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>

      <div className="temat-grid">
        <div className="card">
          <div className="card-h">
            <h2>Notatki robocze</h2>
            <span className="spacer" />
            {otwarte.length > 0 && <span className="badge warn">{otwarte.length} do załatwienia</span>}
          </div>
          <div className="card-b">
            <form className="row" onSubmit={(e) => { e.preventDefault(); dodaj(); }}>
              <input className="input" style={{ flex: 1 }} value={nowa} onChange={(e) => setNowa(e.target.value)} placeholder="np. brakuje wkrętów 4×16 do prowadnic" aria-label="Nowa notatka" />
              <button className="btn primary" type="submit" disabled={!nowa.trim()}>Dodaj</button>
            </form>
            {notatki.length === 0 && <p className="muted">Brak notatek. Wpisz braki, ustalenia z klientem albo rzeczy do zabrania na montaż.</p>}
            <ul className="notatki">
              {otwarte.map((n) => <Notatka key={n.id} n={n} projektId={p.id} wykonaj={wykonaj} />)}
            </ul>
            {zalatwione.length > 0 && (
              <>
                <button className="btn small" onClick={() => setPokazZalatwione((v) => !v)}>
                  {pokazZalatwione ? "Ukryj" : "Pokaż"} załatwione ({zalatwione.length})
                </button>
                {pokazZalatwione && <ul className="notatki">{zalatwione.map((n) => <Notatka key={n.id} n={n} projektId={p.id} wykonaj={wykonaj} />)}</ul>}
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h2>Klient i termin</h2></div>
          <div className="card-b" style={{ display: "grid", gap: 10 }}>
            <Pole etykieta="Klient" wartosc={p.klient.nazwa} zapisz={(v) => zmien({ klient: { nazwa: v } })} />
            <Pole etykieta="Telefon" typ="tel" wartosc={p.klient.telefon} zapisz={(v) => zmien({ klient: { telefon: v } })} link={p.klient.telefon ? `tel:${p.klient.telefon.replace(/\s/g, "")}` : undefined} />
            <Pole etykieta="E-mail" typ="email" wartosc={p.klient.email} zapisz={(v) => zmien({ klient: { email: v } })} link={p.klient.email ? `mailto:${p.klient.email}` : undefined} />
            <Pole etykieta="Adres montażu" wartosc={p.klient.adres} zapisz={(v) => zmien({ klient: { adres: v } })} />
            <Pole etykieta="Termin montażu" typ="date" wartosc={p.terminMontazu ?? ""} zapisz={(v) => zmien({ terminMontazu: v || null })} />
            <div className="field">
              <label>Składanie korpusów</label>
              <select className="input" value={p.skladanieKorpusow ?? ""} onChange={(e) => zmien({ skladanieKorpusow: e.target.value || null })}>
                <option value="">— nie ustalono</option>
                <option value="warsztat">w warsztacie — wozimy złożone</option>
                <option value="naMiejscu">na miejscu — wozimy formatki w paczkach</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <Rozliczenie projektId={p.id} cena={p.cenaUzgodnionaBrutto} />
      <RysunkiKlienta analiza={analiza} />
      <UrzadzeniaAGD key={JSON.stringify(p.agd ?? [])} agd={p.agd ?? []} zapisz={(agd) => zmien({ agd })} />
    </div>
  );
}

// ---------- Rozliczenie: wpłaty i kwota pozostała (ST-APP-005) ----------

const zl = (v: number) => v.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
const dzis = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });

function Rozliczenie({ projektId, cena }: { projektId: string; cena?: number }) {
  const [r, setR] = useState<RozliczenieProjektu | null>(null);
  const [brakDostepu, setBrakDostepu] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [w, setW] = useState({ data: dzis(), kwota: "", sposob: "przelew" as SposobWplaty, opis: "" });
  useEffect(() => {
    api.rozliczenie(projektId).then(setR).catch((e: Error) => (/dostępu|403/i.test(e.message) ? setBrakDostepu(true) : setBlad(e.message)));
  }, [projektId, cena]);
  if (brakDostepu) return null; // rozliczenie widzi tylko właściciel
  const zapisz = async (f: () => Promise<RozliczenieProjektu>) => {
    setBusy(true);
    try {
      setR(await f());
      setBlad(null);
      return true;
    } catch (e) {
      setBlad((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const kwota = Number(w.kwota.replace(",", ".").replace(/\s/g, ""));
  return (
    <div className="card">
      <div className="card-h">
        <h2>Rozliczenie</h2>
        {r && <span className={`tag ${r.status === "rozliczony" ? "ok" : r.status === "nierozliczony" ? "warn" : ""}`}>{NAZWY_STATUSU_ROZLICZENIA[r.status]}</span>}
      </div>
      <div className="card-b" style={{ display: "grid", gap: 10 }}>
        {blad && <div className="alert blad">{blad}</div>}
        {r && (
          <>
            <div className="grid3">
              <div><span className="muted">Należność ({r.zrodloNaleznosci})</span><br /><b>{r.naleznosc === null ? "—" : zl(r.naleznosc)}</b></div>
              <div><span className="muted">Wpłacono</span><br /><b>{zl(r.wplacono)}</b></div>
              <div><span className="muted">{r.pozostalo !== null && r.pozostalo < 0 ? "Nadpłata" : "Pozostało do zapłaty"}</span><br /><b>{r.pozostalo === null ? "—" : zl(Math.abs(r.pozostalo))}</b></div>
            </div>
            {r.naleznosc === null && <p className="muted">Wpisz cenę uzgodnioną albo dodaj umowę, żeby policzyć, ile zostało do zapłaty.</p>}
            {r.wplaty.length > 0 && (
              <table className="tab" aria-label="Wpłaty klienta">
                <thead><tr><th>Data</th><th>Sposób</th><th>Opis</th><th className="num">Kwota</th><th /></tr></thead>
                <tbody>
                  {r.wplaty.map((x) => (
                    <tr key={x.id}>
                      <td>{x.data}</td>
                      <td>{x.sposob === "gotowka" ? "gotówka" : x.sposob}</td>
                      <td>{x.opis}</td>
                      <td className="num">{zl(x.kwota)}</td>
                      <td>{!x.zUmowy && <button className="btn" disabled={busy} onClick={() => window.confirm(`Usunąć wpłatę ${zl(x.kwota)} z ${x.data}?`) && void zapisz(() => api.usunWplate(projektId, x.id))}>Usuń</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <form
              className="row"
              style={{ flexWrap: "wrap", alignItems: "end" }}
              onSubmit={async (e) => {
                e.preventDefault();
                if (await zapisz(() => api.dodajWplate(projektId, { data: w.data, kwota, sposob: w.sposob, opis: w.opis })))
                  setW({ data: dzis(), kwota: "", sposob: "przelew", opis: "" });
              }}
            >
              <div className="field"><label htmlFor="wplata-data">Data wpłaty</label><input id="wplata-data" className="input" type="date" required value={w.data} onChange={(e) => setW({ ...w, data: e.target.value })} /></div>
              <div className="field"><label htmlFor="wplata-kwota">Kwota [zł]</label><input id="wplata-kwota" className="input num" inputMode="decimal" required value={w.kwota} onChange={(e) => setW({ ...w, kwota: e.target.value })} /></div>
              <div className="field">
                <label htmlFor="wplata-sposob">Sposób</label>
                <select id="wplata-sposob" className="input" value={w.sposob} onChange={(e) => setW({ ...w, sposob: e.target.value as SposobWplaty })}>
                  <option value="przelew">przelew</option><option value="gotowka">gotówka</option><option value="karta">karta</option><option value="inne">inne</option>
                </select>
              </div>
              <div className="field" style={{ flex: "1 1 200px" }}><label htmlFor="wplata-opis">Opis</label><input id="wplata-opis" className="input" maxLength={300} placeholder="np. dopłata po montażu" value={w.opis} onChange={(e) => setW({ ...w, opis: e.target.value })} /></div>
              <button className="btn primary" disabled={busy || !(kwota > 0)}>Dodaj wpłatę</button>
            </form>
            <p className="muted" style={{ margin: 0 }}>Zaliczka potwierdzona w umowie liczy się automatycznie. Faktury wystawiasz jak dotąd w programie księgowym.</p>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Wstępne rysunki szkieletowe dla klienta ----------

function RysunkiKlienta({ analiza }: { analiza: Analiza }) {
  const p = analiza.projekt;
  const [sciany, setSciany] = useState<{ dolne: string[]; wysokie: string[] } | null>(null);
  const liczbaModulow = p.moduly.length;
  useEffect(() => {
    api.scianySzkicow(p.id).then(setSciany).catch(() => setSciany({ dolne: [], wysokie: [] }));
  }, [p.id, liczbaModulow, p.rewizja]);
  const url = (rodzaj: string) => `/api/projekty/${p.id}/szkic.pdf?rodzaj=${rodzaj}`;
  const brak = sciany && !sciany.dolne.length && !sciany.wysokie.length;
  return (
    <div className="card">
      <div className="card-h"><h2>Rysunki dla klienta</h2></div>
      <div className="card-b" style={{ display: "grid", gap: 10 }}>
        <p className="muted" style={{ margin: 0 }}>
          Szkice szkieletowe A4 do druku: puste obrysy szafek z wymiarami, do rysowania z klientem szuflad, drzwi i półek. Ciąg wysoki pokazuje nisze AGD i lodówkę według listy urządzeń poniżej.
        </p>
        {brak ? (
          <p className="muted" style={{ margin: 0 }}>Projekt nie ma jeszcze szafek dolnych ani słupków — dodaj je w zakładce Projekt.</p>
        ) : (
          <div className="row">
            <a className="btn primary" href={url("oba")} target="_blank" rel="noopener">Komplet PDF</a>
            {!!sciany?.dolne.length && <a className="btn" href={url("dolny")} target="_blank" rel="noopener">Ciąg dolny ({sciany.dolne.join(", ")})</a>}
            {!!sciany?.wysokie.length && <a className="btn" href={url("wysoki")} target="_blank" rel="noopener">Ciąg wysoki ({sciany.wysokie.join(", ")})</a>}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Urządzenia AGD klienta ----------

const RODZAJE: { v: RodzajAGD; n: string }[] = [
  { v: "piekarnik", n: "Piekarnik" },
  { v: "mikrofala", n: "Mikrofala" },
  { v: "plyta", n: "Płyta grzewcza" },
  { v: "lodowka", n: "Lodówka" },
  { v: "zmywarka", n: "Zmywarka" },
  { v: "okap", n: "Okap" },
  { v: "inne", n: "Inne" },
];

type WierszAGD = Omit<UrzadzenieAGD, "uwagi"> & { uwagi: string };

function UrzadzeniaAGD({ agd, zapisz }: { agd: UrzadzenieAGD[]; zapisz: (a: UrzadzenieAGD[]) => Promise<void> }) {
  const [wiersze, setWiersze] = useState<WierszAGD[]>(() => agd.map((a) => ({ ...a, uwagi: (a.uwagi ?? []).join("\n") })));
  const [zmienione, setZmienione] = useState(false);
  const ustaw = (i: number, z: Partial<WierszAGD>) => {
    setWiersze((w) => w.map((x, j) => (j === i ? { ...x, ...z } : x)));
    setZmienione(true);
  };
  const liczba = (v: string) => (v.trim() === "" ? undefined : Number(v));
  const pole = (i: number, k: keyof WierszAGD, etykieta: string) => (
    <div className="field">
      <label>{etykieta}</label>
      <input className="input" inputMode="numeric" value={(wiersze[i][k] as number | undefined) ?? ""} onChange={(e) => ustaw(i, { [k]: liczba(e.target.value) })} />
    </div>
  );
  return (
    <div className="card">
      <div className="card-h">
        <h2>Urządzenia AGD</h2>
        <span className="spacer" />
        {zmienione && <button className="btn primary small" onClick={async () => { await zapisz(wiersze.filter((w) => w.model.trim()).map((w) => ({ ...w, uwagi: w.uwagi.split("\n").map((u) => u.trim()).filter(Boolean) }))); setZmienione(false); }}>Zapisz AGD</button>}
      </div>
      <div className="card-b agd-lista">
        {wiersze.length === 0 && <p className="muted" style={{ margin: 0 }}>Brak urządzeń. Dodaj modele AGD klienta — wymiary i nisze z karty producenta trafią na rysunki.</p>}
        {wiersze.map((w, i) => (
          <div key={i} className="agd-wiersz">
            <div className="agd-pola">
              <div className="field">
                <label>Rodzaj</label>
                <select className="input" value={w.rodzaj} onChange={(e) => ustaw(i, { rodzaj: e.target.value as RodzajAGD })}>
                  {RODZAJE.map((r) => <option key={r.v} value={r.v}>{r.n}</option>)}
                </select>
              </div>
              <div className="field agd-model">
                <label>Model</label>
                <input className="input" value={w.model} placeholder="np. Electrolux EOF4P56X" onChange={(e) => ustaw(i, { model: e.target.value })} />
              </div>
              {pole(i, "szerMM", "Szer. [mm]")}
              {pole(i, "wysMM", "Wys. [mm]")}
              {pole(i, "glMM", "Gł. [mm]")}
              <div className="field agd-nisza">
                <label>Nisza / otwór (z karty)</label>
                <input className="input" value={w.nisza ?? ""} placeholder="np. 590 × 560 × 550" onChange={(e) => ustaw(i, { nisza: e.target.value })} />
              </div>
              {w.rodzaj === "lodowka" && (
                <>
                  {pole(i, "odstepTylMM", "Odstęp tył")}
                  {pole(i, "odstepBokMM", "Odstęp bok")}
                  {pole(i, "odstepGoraMM", "Odstęp góra")}
                  {pole(i, "glKorpusuMM", "Gł. korpusu")}
                  {pole(i, "glOtwarteMM", "Gł. przy otwartych")}
                </>
              )}
            </div>
            <div className="field">
              <label>Uwagi montażowe (każda w nowej linii)</label>
              <textarea className="input" rows={2} value={w.uwagi} onChange={(e) => ustaw(i, { uwagi: e.target.value })} />
            </div>
            <button className="btn small danger" onClick={() => { setWiersze((x) => x.filter((_, j) => j !== i)); setZmienione(true); }}>Usuń urządzenie</button>
          </div>
        ))}
        <div className="row">
          <button className="btn small" onClick={() => { setWiersze((w) => [...w, { rodzaj: "piekarnik", model: "", uwagi: "" }]); setZmienione(true); }}>+ Dodaj urządzenie</button>
          {zmienione && <span className="muted" style={{ fontSize: 12 }}>Niezapisane zmiany — urządzenia bez modelu zostaną pominięte.</span>}
        </div>
      </div>
    </div>
  );
}

function Notatka({ n, projektId, wykonaj }: { n: NotatkaProjektu; projektId: string; wykonaj: (f: () => Promise<unknown>) => Promise<void> }) {
  const [edycja, setEdycja] = useState<string | null>(null);
  return (
    <li className={`notatka ${n.zalatwiona ? "zal" : ""}`}>
      <input type="checkbox" checked={n.zalatwiona} aria-label={n.zalatwiona ? "Oznacz jako niezałatwione" : "Oznacz jako załatwione"} onChange={(e) => wykonaj(() => api.zmienNotatke(projektId, n.id, { zalatwiona: e.target.checked }))} />
      <div className="notatka-tresc">
        {edycja !== null ? (
          <form onSubmit={(e) => { e.preventDefault(); const t = edycja; setEdycja(null); if (t.trim() && t !== n.tekst) wykonaj(() => api.zmienNotatke(projektId, n.id, { tekst: t })); }}>
            <input className="input" value={edycja} autoFocus onChange={(e) => setEdycja(e.target.value)} onBlur={(e) => e.currentTarget.form?.requestSubmit()} onKeyDown={(e) => e.key === "Escape" && setEdycja(null)} />
          </form>
        ) : (
          <span className="notatka-tekst" onDoubleClick={() => !n.zalatwiona && setEdycja(n.tekst)}>{n.tekst}</span>
        )}
        <span className="muted notatka-data">{data(n.utworzono)}{n.zalatwiona && n.zalatwiono ? ` · załatwione ${data(n.zalatwiono)}` : ""}</span>
      </div>
      {!n.zalatwiona && edycja === null && <button className="btn small" onClick={() => setEdycja(n.tekst)} aria-label="Edytuj notatkę">Edytuj</button>}
      <button className="btn small danger" aria-label="Usuń notatkę" onClick={() => confirm("Usunąć notatkę?") && wykonaj(() => api.usunNotatke(projektId, n.id))}>✕</button>
    </li>
  );
}

function Pole({ etykieta, wartosc, zapisz, typ = "text", link }: { etykieta: string; wartosc: string; zapisz: (v: string) => void; typ?: string; link?: string }) {
  const [v, setV] = useState(wartosc);
  const [pop, setPop] = useState(wartosc);
  if (wartosc !== pop) {
    // wartość zmieniona z zewnątrz (np. przez MCP) — synchronizacja pola
    setPop(wartosc);
    setV(wartosc);
  }
  return (
    <div className="field">
      <label>
        {etykieta}
        {link && <a href={link} style={{ marginLeft: 8 }}>{typ === "tel" ? "zadzwoń" : "napisz"}</a>}
      </label>
      <input className="input" type={typ} value={v} onChange={(e) => { setV(e.target.value); if (typ === "date") zapisz(e.target.value); }} onBlur={() => typ !== "date" && v !== wartosc && zapisz(v.trim())} />
    </div>
  );
}

export const nazwaStatusu = (s: string) => NAZWY_STATUSOW[s as StatusProjektu] ?? s;

function data(iso: string) {
  return new Date(iso).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
