import { useEffect, useState } from "react";
import { api, mm } from "../api";

type Analiza = Awaited<ReturnType<typeof api.analizaCad>>;

function base64(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Okno importu rzutu z CAD (DXF/DWG): wybór pliku → warstwa i jednostki → podgląd ścian → import. */
export function ImportDxf({ projektId, onGotowe, onZamknij }: { projektId: string; onGotowe: () => void; onZamknij: () => void }) {
  const [plik, setPlik] = useState<{ nazwa: string; tresc: string } | null>(null);
  const [konwerter, setKonwerter] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    api.konwerterCad().then((k) => setKonwerter(k.dwg ? k.dwg.typ : null)).catch(() => setKonwerter(null));
  }, []);
  const [warstwa, setWarstwa] = useState("");
  const [jednostka, setJednostka] = useState("");
  const [nazwa, setNazwa] = useState("Pomieszczenie z CAD");
  const [a, setA] = useState<Analiza | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [trwa, setTrwa] = useState(false);

  useEffect(() => {
    if (!plik) return;
    setBlad(null);
    api
      .analizaCad(plik.tresc, { warstwa: warstwa || undefined, jednostka: jednostka || undefined })
      .then((r) => {
        setA(r);
        if (!warstwa && r.warstwy[0]) setWarstwa(r.warstwy[0].nazwa);
        if (!jednostka) setJednostka(r.jednostka);
      })
      .catch((e) => setBlad(e.message));
  }, [plik, warstwa, jednostka]);

  const importuj = async () => {
    if (!plik) return;
    setTrwa(true);
    try {
      await api.importujCad(projektId, plik.tresc, { warstwa, jednostka, nazwa });
      onGotowe();
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setTrwa(false);
    }
  };

  const sc = a?.sciany ?? [];
  const xs = sc.flatMap((s) => [s.x1, s.x2]);
  const ys = sc.flatMap((s) => [s.y1, s.y2]);
  const box = sc.length ? { x: Math.min(...xs) - 400, y: Math.min(...ys) - 400, w: Math.max(...xs) - Math.min(...xs) + 800, h: Math.max(...ys) - Math.min(...ys) + 800 } : null;

  return (
    <div className="modal-tlo" onClick={onZamknij}>
      <div className="card modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Import z CAD">
        <div className="card-h">
          <h2 style={{ flex: 1 }}>Import rzutu z CAD (DXF / DWG)</h2>
          <button className="btn small" onClick={onZamknij} aria-label="Zamknij">✕</button>
        </div>
        <div className="card-b" style={{ display: "grid", gap: 12 }}>
          <label className="drop">
            <input
              type="file"
              accept=".dxf,.dwg"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setWarstwa("");
                setJednostka("");
                setA(null);
                setPlik({ nazwa: f.name, tresc: base64(await f.arrayBuffer()) });
              }}
            />
            {plik ? <b>{plik.nazwa}</b> : <span>Wybierz plik <b>.dxf</b> lub <b>.dwg</b> z rzutem (AutoCAD, ArchiCAD, SketchUp, DraftSight…)</span>}
          </label>
          {konwerter === null && (
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>
              DXF działa od razu. Dla DWG serwer potrzebuje konwertera (ODA File Converter lub LibreDWG) — obecnie nie jest zainstalowany.
            </p>
          )}

          {a && (
            <>
              <div className="grid3">
                <div className="field">
                  <label>Warstwa ze ścianami</label>
                  <select className="input" value={warstwa} onChange={(e) => setWarstwa(e.target.value)}>
                    {a.warstwy.map((w) => (
                      <option key={w.nazwa} value={w.nazwa}>
                        {w.nazwa} — {w.odcinki} odc., {mm(w.dlugoscM)} m
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Jednostki rysunku</label>
                  <select className="input" value={jednostka} onChange={(e) => setJednostka(e.target.value)}>
                    <option value="mm">milimetry</option>
                    <option value="cm">centymetry</option>
                    <option value="m">metry</option>
                  </select>
                </div>
                <div className="field">
                  <label>Nazwa pomieszczenia</label>
                  <input className="input" value={nazwa} onChange={(e) => setNazwa(e.target.value)} />
                </div>
              </div>

              {box ? (
                <svg className="elev" viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} style={{ maxHeight: 320, background: "var(--panel-2)", borderRadius: 8 }}>
                  {sc.map((s, i) => (
                    <g key={i}>
                      <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="var(--accent)" strokeWidth={Math.max(box.w, box.h) / 150} strokeLinecap="round" />
                      <text x={(s.x1 + s.x2) / 2} y={(s.y1 + s.y2) / 2} fontSize={Math.max(box.w, box.h) / 30} fill="var(--text)" textAnchor="middle" dy="-0.4em">
                        {s.nazwa.replace("Ściana ", "")} {mm(s.dlugoscMM)}
                      </text>
                    </g>
                  ))}
                </svg>
              ) : (
                <div className="alert ostrzezenie">Na tej warstwie nie ma linii ≥ 300 mm. Wybierz inną warstwę lub jednostki.</div>
              )}
              <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                Znaleziono {sc.length} ścian w najdłuższym ciągu linii ({a.liczbaLancuchow} ciągów na warstwie). Ściany można potem dopracować w projektancie.
              </p>
            </>
          )}
          {blad && <div className="alert blad">{blad}</div>}
          <div className="row">
            <button className="btn primary" disabled={!sc.length || trwa} onClick={importuj}>
              {trwa ? "Importuję…" : `Utwórz pomieszczenie (${sc.length} ścian)`}
            </button>
            <button className="btn" onClick={onZamknij}>Anuluj</button>
          </div>
        </div>
      </div>
    </div>
  );
}
