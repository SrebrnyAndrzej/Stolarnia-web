import { useState } from "react";
import { NAZWY_STATUSOW, STATUSY_PROJEKTU } from "../../../src/core/statusy";
import { api, type Analiza, type NotatkaProjektu, type StatusProjektu } from "../api";

// Mikro CRM tematu: etap realizacji, kontakt z klientem, termin montażu i notatki robocze (braki, ustalenia).
export function Temat({ analiza, odswiez }: { analiza: Analiza; odswiez: () => Promise<void> }) {
  const p = analiza.projekt;
  const [blad, setBlad] = useState<string | null>(null);
  const [nowa, setNowa] = useState("");
  const [pokazZalatwione, setPokazZalatwione] = useState(false);

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
                onClick={() => s !== p.status && zmien({ status: s })}
              >
                <span className="etap-nr">{i + 1}</span>
                {NAZWY_STATUSOW[s]}
              </button>
            ))}
          </div>
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
          </div>
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
