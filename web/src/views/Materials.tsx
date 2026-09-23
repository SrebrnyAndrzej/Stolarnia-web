import { useEffect, useState } from "react";
import { api, zl, type Material, type Okucie } from "../api";

const TYPY: Record<string, string> = {
  plytaLaminowana: "Płyta laminowana",
  front: "Front",
  hdf: "HDF",
  mdf: "MDF",
  blatLaminowany: "Blat laminowany",
  blatKompaktowy: "Blat kompaktowy",
  blatKamienny: "Blat kamienny",
};
const JEDN: Record<string, string> = { sztuka: "ark.", metrKwadratowy: "m²", metrBiezacy: "mb" };

export function Materials() {
  const [zakladka, setZakladka] = useState<"materialy" | "okucia">("materialy");
  const [materialy, setMaterialy] = useState<Material[]>([]);
  const [okucia, setOkucia] = useState<Okucie[]>([]);
  const [szukaj, setSzukaj] = useState("");
  const [blad, setBlad] = useState<string | null>(null);

  const wczytaj = () => Promise.all([api.materialy().then(setMaterialy), api.okucia().then(setOkucia)]).catch((e) => setBlad(e.message));
  useEffect(() => {
    wczytaj();
  }, []);

  const s = szukaj.toLowerCase();
  const zapiszM = (id: string, d: Partial<Material>) => api.zapiszMaterial({ id, ...d }).then(wczytaj).catch((e) => setBlad(e.message));
  const zapiszO = (id: string, d: Partial<Okucie>) => api.zapiszOkucie({ id, ...d }).then(wczytaj).catch((e) => setBlad(e.message));

  return (
    <div className="page">
      <div className="row">
        <h1>Materiały i okucia</h1>
        <nav className="nav">
          <button className={zakladka === "materialy" ? "on" : ""} onClick={() => setZakladka("materialy")}>Materiały ({materialy.length})</button>
          <button className={zakladka === "okucia" ? "on" : ""} onClick={() => setZakladka("okucia")}>Okucia ({okucia.length})</button>
        </nav>
        <span className="spacer" />
        <input className="input" style={{ width: 240 }} placeholder="Szukaj…" value={szukaj} onChange={(e) => setSzukaj(e.target.value)} />
      </div>
      {blad && <div className="alert blad">{blad}</div>}
      <p className="muted" style={{ margin: 0 }}>
        Ceny startowe to średnie rynkowe z researchu StolarniaApp (20.06.2026) — wpisz swoje ceny zakupu i rabaty. Zmiany od razu wpływają na wyceny.
      </p>

      {zakladka === "materialy" && (
        <div className="card t-wrap" style={{ maxHeight: "calc(100vh - 230px)" }}>
          <table className="t">
            <thead>
              <tr>
                <th></th><th>Materiał</th><th>Typ</th><th className="r">Gr.</th><th className="r">Cena netto</th><th>Jedn.</th><th className="r">Rabat %</th><th>Aktywny</th>
              </tr>
            </thead>
            <tbody>
              {materialy
                .filter((m) => !s || `${m.nazwa} ${m.producent} ${m.kod}`.toLowerCase().includes(s))
                .map((m) => (
                  <tr key={m.id} style={{ opacity: m.aktywny ? 1 : 0.5 }}>
                    <td><span className="swatch" style={{ background: m.kolorHEX }} /></td>
                    <td>
                      <b>{m.producent !== "Stolarnia" ? `${m.producent} ` : ""}{m.nazwa}</b>
                      <div className="muted" style={{ fontSize: 11 }}>{m.kod}{m.grupaDekoru ? ` · ${m.grupaDekoru}` : ""}</div>
                    </td>
                    <td>{TYPY[m.typ] ?? m.typ}</td>
                    <td className="r num">{m.gruboscMM}</td>
                    <td className="r"><Kwota value={m.cenaNetto} onSave={(v) => zapiszM(m.id, { cenaNetto: v })} /></td>
                    <td>{JEDN[m.jednostka]}</td>
                    <td className="r"><Kwota value={m.rabatProcent} onSave={(v) => zapiszM(m.id, { rabatProcent: v })} /></td>
                    <td><input type="checkbox" checked={m.aktywny} onChange={(e) => zapiszM(m.id, { aktywny: e.target.checked })} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {zakladka === "okucia" && (
        <div className="card t-wrap" style={{ maxHeight: "calc(100vh - 230px)" }}>
          <table className="t">
            <thead>
              <tr><th>Okucie</th><th>Typ</th><th>Poziom</th><th className="r">Cena netto</th><th>Jedn.</th><th className="r">Rabat %</th><th className="r">Po rabacie</th><th>Aktywne</th></tr>
            </thead>
            <tbody>
              {okucia
                .filter((o) => !s || `${o.nazwa} ${o.producent} ${o.typ}`.toLowerCase().includes(s))
                .map((o) => (
                  <tr key={o.id} style={{ opacity: o.aktywne ? 1 : 0.5 }}>
                    <td><b>{o.nazwa}</b><div className="muted" style={{ fontSize: 11 }}>{o.profilID}</div></td>
                    <td>{o.typ}</td>
                    <td>
                      <select className="input" value={o.poziomWyceny} onChange={(e) => zapiszO(o.id, { poziomWyceny: e.target.value as Okucie["poziomWyceny"] })} style={{ width: 110 }}>
                        <option value="eco">Eco</option><option value="standard">Standard</option><option value="premium">Premium</option><option value="vip">VIP</option>
                      </select>
                    </td>
                    <td className="r"><Kwota value={o.cenaNetto} onSave={(v) => zapiszO(o.id, { cenaNetto: v })} /></td>
                    <td>{o.jednostka}</td>
                    <td className="r"><Kwota value={o.rabatProcent} onSave={(v) => zapiszO(o.id, { rabatProcent: v })} /></td>
                    <td className="r num">{zl(o.cenaNetto * (1 - o.rabatProcent / 100))}</td>
                    <td><input type="checkbox" checked={o.aktywne} onChange={(e) => zapiszO(o.id, { aktywne: e.target.checked })} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Kwota({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  return (
    <input
      className="input num"
      style={{ width: 90, textAlign: "right" }}
      inputMode="decimal"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const n = Number(v.replace(",", "."));
        if (Number.isFinite(n) && n >= 0 && n !== value) onSave(n);
        else setV(String(value));
      }}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}
