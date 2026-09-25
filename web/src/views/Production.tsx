import { useEffect, useMemo, useState } from "react";
import { api, mm, type Analiza, type Arkusz, type WydanieMeta } from "../api";

const OBRZEZE: Record<string, string> = { brak: "", abs08: "0,8", abs20: "2,0" };

export function Production({ analiza }: { analiza: Analiza }) {
  const [kat, setKat] = useState("");
  const [podswietl, setPodswietl] = useState<string | null>(null);
  const formatki = analiza.formatki.filter((f) => !kat || f.kategoria === kat);
  const kategorie = useMemo(() => [...new Set(analiza.formatki.map((f) => f.kategoria))], [analiza.formatki]);
  const r = analiza.rozkroj;
  const pid = analiza.projekt.id;
  const [wydania, setWydania] = useState<WydanieMeta[]>([]);
  const [notatka, setNotatka] = useState("");
  const [blad, setBlad] = useState("");
  const [trwa, setTrwa] = useState(false);
  useEffect(() => {
    api.wydania(pid).then(setWydania).catch(() => setWydania([]));
  }, [pid]);
  const ostatnie = wydania[wydania.length - 1];
  const wydaj = async () => {
    setTrwa(true);
    setBlad("");
    try {
      await api.utworzWydanie(pid, notatka || undefined);
      setNotatka("");
      setWydania(await api.wydania(pid));
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setTrwa(false);
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-h" style={{ flexWrap: "wrap" }}>
          <h2 style={{ flex: 1 }}>Dokumentacja produkcyjna</h2>
          <a className="btn primary" href={`/api/projekty/${analiza.projekt.id}/dokumentacja.pdf`} target="_blank" rel="noreferrer">
            Pełny pakiet PDF
          </a>
          <a className="btn" href={`/api/projekty/${analiza.projekt.id}/dokumentacja.pdf?skrocony=1`} target="_blank" rel="noreferrer">Karty zbiorcze szafek</a>
        </div>
        <div className="card-b muted" style={{ fontSize: 13 }}>
          Rzut, elewacje, indeks, karty szafek oraz osobne rysunki wszystkich części: wymiary, obrzeża, widoki krawędzi, tabele operacji i źródła reguł — z rewizji {analiza.projekt.rewizja}.
          Dopóki reguły technologii nie są zatwierdzone, a okucia (prowadnice, uchwyty, zawieszki) nie mają danych montażowych, pakiet ma status „dokument roboczy”.
        </div>
      </div>

      <div className="card">
        <div className="card-h" style={{ flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ flex: 1 }}>Wydania produkcyjne</h2>
          <input className="input" style={{ maxWidth: 260 }} placeholder="Notatka do wydania (opcjonalnie)" value={notatka} onChange={(e) => setNotatka(e.target.value)} />
          <button className="btn primary" disabled={trwa || ostatnie?.rewizja === analiza.projekt.rewizja} onClick={wydaj}>
            {ostatnie?.rewizja === analiza.projekt.rewizja ? `Rewizja ${analiza.projekt.rewizja} już wydana` : `Wydaj rewizję ${analiza.projekt.rewizja} do produkcji`}
          </button>
        </div>
        <div className="card-b" style={{ display: "grid", gap: 8 }}>
          <div className="muted" style={{ fontSize: 13 }}>
            Wydanie zamraża projekt, części i dokumentację. Jego PDF nie zmienia się po późniejszych zmianach projektu ani aktualizacji katalogów. Pracownik drukuje z wydania, nie z bieżącego projektu.
          </div>
          {blad && <div className="alert blad">{blad}</div>}
          {ostatnie && ostatnie.rewizja !== analiza.projekt.rewizja && (
            <div className="alert ostrzezenie">Projekt zmienił się po wydaniu {ostatnie.numer} (rew. {ostatnie.rewizja} → {analiza.projekt.rewizja}). Produkcja pracuje na wydaniu {ostatnie.numer}, dopóki nie wydasz nowej rewizji.</div>
          )}
          {wydania.length > 0 && (
            <table className="t">
              <thead>
                <tr><th>Nr</th><th>Rewizja</th><th>Data</th><th>Stan</th><th className="r">Części</th><th className="r">Operacje</th><th>Notatka</th><th></th></tr>
              </thead>
              <tbody>
                {[...wydania].reverse().map((w) => (
                  <tr key={w.id}>
                    <td><b>{w.numer}</b></td>
                    <td className="num">{w.rewizja}</td>
                    <td>{new Date(w.utworzono).toLocaleString("pl-PL")}</td>
                    <td>{w.gotowaDoProdukcji ? <span className="ok">kompletne</span> : <span className="muted">robocze (braki danych: {w.podsumowanie.brakDanych})</span>}</td>
                    <td className="r num">{w.liczbaCzesci}</td>
                    <td className="r num">{w.podsumowanie.operacje}</td>
                    <td style={{ fontSize: 12 }}>{w.notatka ?? ""}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <a className="btn small" href={`/api/projekty/${pid}/wydania/${w.id}/dokumentacja.pdf`} target="_blank" rel="noreferrer">PDF</a>{" "}
                      <a className="btn small" href={`/api/projekty/${pid}/wydania/${w.id}/dokumentacja.pdf?skrocony=1`} target="_blank" rel="noreferrer">Karty</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h2 style={{ flex: 1 }}>Rozkrój płyt</h2>
          <span className="muted">{r.arkusze.length} arkuszy</span>
        </div>
        <div className="card-b" style={{ display: "grid", gap: 12 }}>
          <table className="t">
            <thead>
              <tr>
                <th>Materiał</th>
                <th className="r">Grubość</th>
                <th className="r">Arkusze</th>
                <th className="r">Formatki m²</th>
                <th className="r">Arkusze m²</th>
                <th className="r">Wykorzystanie</th>
              </tr>
            </thead>
            <tbody>
              {r.podsumowanie.map((p) => (
                <tr key={p.materialId + p.gruboscMM}>
                  <td>{p.materialOpis}</td>
                  <td className="r num">{p.gruboscMM} mm</td>
                  <td className="r num"><b>{p.liczbaArkuszy}</b></td>
                  <td className="r num">{mm(p.powierzchniaFormatekM2)}</td>
                  <td className="r num">{mm(p.powierzchniaArkuszyM2)}</td>
                  <td className="r num">{mm(p.wykorzystanieProcent)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {r.nierozmieszczone.map((n) => <div key={n.formatkaId} className="alert blad">{n.etykieta}: {n.powod}</div>)}
          <div className="sheets">
            {r.arkusze.map((a) => <Plan key={a.numer} a={a} podswietl={podswietl} />)}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h"><h2>Okleinowanie</h2></div>
        <div className="t-wrap">
          <table className="t">
            <thead>
              <tr><th>Obrzeże</th><th className="r">Krawędzie</th><th className="r">Netto [m]</th><th className="r">Do zakupu [m]</th></tr>
            </thead>
            <tbody>
              {analiza.obrzeza.map((o) => (
                <tr key={o.rodzaj + o.materialId}>
                  <td>{o.opis}</td>
                  <td className="r num">{o.liczbaKrawedzi}</td>
                  <td className="r num">{mm(o.dlugoscNettoM)}</td>
                  <td className="r num"><b>{mm(o.dlugoscZakupuM)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-h" style={{ flexWrap: "wrap" }}>
          <h2 style={{ flex: 1 }}>Lista formatek ({formatki.length})</h2>
          <select className="input" style={{ width: 160 }} value={kat} onChange={(e) => setKat(e.target.value)}>
            <option value="">Wszystkie</option>
            {kategorie.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <a className="btn" href={`/api/projekty/${analiza.projekt.id}/formatki.csv`} download>Pobierz CSV</a>
        </div>
        <div className="t-wrap">
          <table className="t">
            <thead>
              <tr>
                <th>Etykieta</th><th>Moduł</th><th>Element</th><th>Materiał</th>
                <th className="r">Dł.</th><th className="r">Szer.</th><th className="r">Gr.</th>
                <th>Słoje</th><th>DA</th><th>DB</th><th>KA</th><th>KB</th>
              </tr>
            </thead>
            <tbody>
              {formatki.map((f) => (
                <tr key={f.id} onMouseEnter={() => setPodswietl(f.id)} onMouseLeave={() => setPodswietl(null)}>
                  <td className="num"><b>{f.etykieta}</b></td>
                  <td>{f.nazwaModulu}</td>
                  <td>{f.kodElementu}</td>
                  <td><span className="swatch" style={{ background: f.kolorHEX }} /> {f.materialOpis}</td>
                  <td className="r num">{mm(f.dlugoscMM)}</td>
                  <td className="r num">{mm(f.szerokoscMM)}</td>
                  <td className="r num">{mm(f.gruboscMM)}</td>
                  <td>{f.kierunekDekoru === "dowolny" ? "—" : "↕"}</td>
                  {f.obrzeza.map((o, i) => <td key={i} className="num">{OBRZEZE[o]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Plan({ a, podswietl }: { a: Arkusz; podswietl: string | null }) {
  // Arkusz rysowany poziomo: długość (kierunek dekoru) wzdłuż osi X.
  return (
    <div className="card sheet">
      <div className="card-h" style={{ padding: "8px 12px" }}>
        <b>#{a.numer}</b>
        <span className="swatch" style={{ background: a.kolorHEX }} />
        <span style={{ flex: 1, fontSize: 12 }}>{a.materialOpis} · {a.gruboscMM} mm</span>
        <span className="badge">{mm(a.wykorzystanieProcent)}%</span>
      </div>
      <svg viewBox={`-20 -20 ${a.dlugoscMM + 40} ${a.szerokoscMM + 40}`}>
        <rect x={0} y={0} width={a.dlugoscMM} height={a.szerokoscMM} fill="var(--panel-2)" stroke="var(--line-strong)" strokeWidth={6} />
        {a.polozenia.map((p) => {
          const on = podswietl === p.formatkaId;
          return (
            <g key={p.formatkaId}>
              <title>{`${p.etykieta}: ${mm(p.dlugoscMM)} × ${mm(p.szerokoscMM)}${p.obrocona ? " (obrócona)" : ""}`}</title>
              <rect x={p.yMM} y={p.xMM} width={p.dlugoscMM} height={p.szerokoscMM} fill={on ? "var(--accent)" : a.kolorHEX} stroke="#3b3128" strokeWidth={4} opacity={on ? 1 : 0.9} />
              {p.dlugoscMM > 260 && p.szerokoscMM > 90 && (
                <text x={p.yMM + p.dlugoscMM / 2} y={p.xMM + p.szerokoscMM / 2 + 22} textAnchor="middle" fontSize={Math.min(64, p.szerokoscMM * 0.45)} fill="#1d1812" style={{ paintOrder: "stroke", stroke: "rgba(255,255,255,.7)", strokeWidth: 8 }}>
                  {p.etykieta}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
