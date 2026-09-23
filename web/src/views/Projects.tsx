import { useEffect, useState } from "react";
import { api, idz, type ProjektSkrot } from "../api";

export function Projects() {
  const [lista, setLista] = useState<ProjektSkrot[] | null>(null);
  const [nowy, setNowy] = useState(false);
  const [nazwa, setNazwa] = useState("");
  const [klient, setKlient] = useState("");
  const [sciany, setSciany] = useState("3600");
  const [blad, setBlad] = useState<string | null>(null);

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

      <div className="projects">
        {lista?.map((p) => (
          <div key={p.id} className="card project-tile" onClick={() => idz(`#/p/${p.id}`)}>
            <div className="row">
              <h2>{p.nazwa}</h2>
              <span className="spacer" />
              <span className="badge accent">{p.status}</span>
            </div>
            <div className="muted">{p.klient || "—"}</div>
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
