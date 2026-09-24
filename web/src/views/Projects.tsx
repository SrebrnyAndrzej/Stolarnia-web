import { useEffect, useState } from "react";
import { NAZWY_STATUSOW, STATUSY_PROJEKTU } from "../../../src/core/statusy";
import { api, idz, type ProjektSkrot } from "../api";

function Termin({ data, zakonczony }: { data: string; zakonczony: boolean }) {
  const dni = Math.round((new Date(`${data}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
  const opis = dni === 0 ? "dziś" : dni === 1 ? "jutro" : dni > 0 ? `za ${dni} dni` : `${-dni} dni temu`;
  const klasa = zakonczony ? "" : dni < 0 ? "blad" : dni <= 7 ? "warn" : "";
  return (
    <div className={`termin ${klasa}`}>
      Montaż: {new Date(`${data}T00:00:00`).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })} <span className="muted">({opis})</span>
    </div>
  );
}

export function Projects() {
  const [lista, setLista] = useState<ProjektSkrot[] | null>(null);
  const [nowy, setNowy] = useState(false);
  const [nazwa, setNazwa] = useState("");
  const [klient, setKlient] = useState("");
  const [sciany, setSciany] = useState("3600");
  const [blad, setBlad] = useState<string | null>(null);

  const [widok, setWidok] = useState<"tablica" | "lista">(() => {
    try {
      return localStorage.getItem("stolarnia.widokProjektow") === "lista" ? "lista" : "tablica";
    } catch {
      return "tablica";
    }
  });
  const ustawWidok = (w: "tablica" | "lista") => {
    setWidok(w);
    try {
      localStorage.setItem("stolarnia.widokProjektow", w);
    } catch {
      /* brak dostępu do pamięci przeglądarki */
    }
  };
  const [szukaj, setSzukaj] = useState("");
  const fraza = szukaj.trim().toLowerCase();
  const widoczne = lista?.filter((p) => !fraza || [p.nazwa, p.klient, p.telefon, p.ostatniaNotatka].some((t) => t?.toLowerCase().includes(fraza)));

  const wczytaj = () => api.projekty().then(setLista).catch((e) => setBlad(e.message));
  useEffect(() => {
    wczytaj();
  }, []);

  const utworz = async () => {
    try {
      const dl = sciany.split(/[;, ]+/).map(Number).filter((v) => v > 0);
      const p = await api.utworzProjekt({
        nazwa: nazwa || "Nowy projekt",
        klient: { nazwa: klient },
        sciany: dl.map((d) => ({ dlugoscMM: d })),
      });
      idz(`#/p/${p.id}`);
    } catch (e) {
      setBlad((e as Error).message);
    }
  };

  return (
    <div className="page">
      <div className="row">
        <h1>Projekty</h1>
        <span className="spacer" />
        <button className="btn primary" onClick={() => setNowy(true)}>+ Nowy projekt</button>
      </div>
      {blad && <div className="alert blad">{blad}</div>}

      {nowy && (
        <div className="card">
          <div className="card-h"><h2>Nowy projekt</h2></div>
          <div className="card-b" style={{ display: "grid", gap: 12 }}>
            <div className="grid3">
              <div className="field">
                <label>Nazwa projektu</label>
                <input className="input" value={nazwa} onChange={(e) => setNazwa(e.target.value)} placeholder="np. Kuchnia Kowalscy" autoFocus />
              </div>
              <div className="field">
                <label>Klient</label>
                <input className="input" value={klient} onChange={(e) => setKlient(e.target.value)} placeholder="Imię i nazwisko" />
              </div>
              <div className="field">
                <label>Długości ścian [mm], po przecinku</label>
                <input className="input" value={sciany} onChange={(e) => setSciany(e.target.value)} placeholder="3600, 2400" />
              </div>
            </div>
            <div className="row">
              <button className="btn primary" onClick={utworz}>Utwórz i projektuj</button>
              <button className="btn" onClick={() => setNowy(false)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}

      {lista && lista.length === 0 && !nowy && (
        <div className="card card-b muted">
          Brak projektów. Utwórz pierwszy projekt albo poproś Claude przez MCP: „zaprojektuj kuchnię 3,6 m ze zlewem pod oknem”.
        </div>
      )}

      {lista && lista.length > 0 && (
        <div className="row">
          <div className="seg" role="tablist" aria-label="Widok tematów">
            <button className={widok === "tablica" ? "on" : ""} onClick={() => ustawWidok("tablica")}>Tablica etapów</button>
            <button className={widok === "lista" ? "on" : ""} onClick={() => ustawWidok("lista")}>Lista</button>
          </div>
          <input className="input" style={{ maxWidth: 280 }} value={szukaj} onChange={(e) => setSzukaj(e.target.value)} placeholder="Szukaj: projekt, klient, notatka…" aria-label="Szukaj tematów" />
        </div>
      )}

      {widok === "tablica" && widoczne && (
        <div className="tablica">
          {STATUSY_PROJEKTU.map((s) => {
            const kol = widoczne.filter((p) => p.status === s);
            return (
              <section key={s} className="kolumna" aria-label={NAZWY_STATUSOW[s]}>
                <header className="kolumna-h">
                  <b>{NAZWY_STATUSOW[s]}</b>
                  <span className="muted num">{kol.length}</span>
                </header>
                {kol.map((p) => (
                  <div key={p.id} className="card temat-karta" onClick={() => idz(`#/p/${p.id}/temat`)}>
                    <b>{p.nazwa}</b>
                    <div className="muted">{p.klient || "—"}{p.telefon && <> · <a href={`tel:${p.telefon.replace(/\s/g, "")}`} onClick={(e) => e.stopPropagation()}>{p.telefon}</a></>}</div>
                    {p.terminMontazu && <Termin data={p.terminMontazu} zakonczony={p.status === "zakonczony"} />}
                    {p.otwarteNotatki > 0 && (
                      <div className="temat-notatka" title={p.ostatniaNotatka}>
                        <span className="badge warn">{p.otwarteNotatki}</span> {p.ostatniaNotatka}
                      </div>
                    )}
                    <select
                      className="input temat-status"
                      value={p.status}
                      aria-label={`Etap: ${p.nazwa}`}
                      onClick={(e) => e.stopPropagation()}
                      onChange={async (e) => {
                        try {
                          await api.zmienProjekt(p.id, { status: e.target.value });
                          wczytaj();
                        } catch (err) {
                          setBlad((err as Error).message);
                        }
                      }}
                    >
                      {STATUSY_PROJEKTU.map((x) => <option key={x} value={x}>{NAZWY_STATUSOW[x]}</option>)}
                    </select>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}

      <div className="projects">
        {widok === "lista" && widoczne?.map((p) => (
          <div key={p.id} className="card project-tile" onClick={() => idz(`#/p/${p.id}`)}>
            <div className="row">
              <h2>{p.nazwa}</h2>
              <span className="spacer" />
              {p.otwarteNotatki > 0 && <span className="badge warn" title={p.ostatniaNotatka}>{p.otwarteNotatki} notatek</span>}
              <span className="badge accent">{NAZWY_STATUSOW[p.status] ?? p.status}</span>
            </div>
            <div className="muted">{p.klient || "—"}</div>
            {p.terminMontazu && <Termin data={p.terminMontazu} zakonczony={p.status === "zakonczony"} />}
            <div className="row muted" style={{ fontSize: 12 }}>
              <span>{p.liczbaModulow} modułów</span>
              <span className="spacer" />
              <span>{new Date(p.zmieniono).toLocaleString("pl-PL")}</span>
            </div>
            <div className="row" onClick={(e) => e.stopPropagation()}>
              <button className="btn small" onClick={async () => { await api.duplikujProjekt(p.id); wczytaj(); }}>Duplikuj</button>
              <button
                className="btn small danger"
                onClick={async () => {
                  if (confirm(`Usunąć projekt „${p.nazwa}”? Tej operacji nie można cofnąć.`)) {
                    await api.usunProjekt(p.id);
                    wczytaj();
                  }
                }}
              >
                Usuń
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
