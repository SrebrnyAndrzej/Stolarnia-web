import { useMemo, useState } from "react";
import { mm, type Analiza, type Arkusz } from "../api";

const OBRZEZE: Record<string, string> = { brak: "", abs08: "0,8", abs20: "2,0" };

export function Production({ analiza }: { analiza: Analiza }) {
  const [kat, setKat] = useState("");
  const [podswietl, setPodswietl] = useState<string | null>(null);
  const formatki = analiza.formatki.filter((f) => !kat || f.kategoria === kat);
  const kategorie = useMemo(() => [...new Set(analiza.formatki.map((f) => f.kategoria))], [analiza.formatki]);
  const r = analiza.rozkroj;

  return (
    <>
      <div className="card">
        <div className="card-h" style={{ flexWrap: "wrap" }}>
          <h2 style={{ flex: 1 }}>Dokumentacja produkcyjna</h2>
          <a className="btn primary" href={`/api/projekty/${analiza.projekt.id}/dokumentacja.pdf`} target="_blank" rel="noreferrer">
            Pakiet PDF (A4, 1 szafka = 1 strona)
          </a>
        </div>
        <div className="card-b muted" style={{ fontSize: 13 }}>
          Rzut, elewacje, indeks części i karta każdej szafki: wszystkie formatki z obrzeżami i wierceniami oraz tabela operacji — z rewizji {analiza.projekt.rewizja}.
          Dopóki reguły technologii nie są zatwierdzone, a okucia (prowadnice, uchwyty, zawieszki) nie mają danych montażowych, pakiet ma status „dokument roboczy”.
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
