import { DecorCatalog } from "./DecorCatalog";
import { useEffect, useState } from "react";
import { HardwareCatalog } from "./HardwareCatalog";
import { PrzelicznikSzuflad } from "./PrzelicznikSzuflad";
import { api, zl, type CennikMaterialow, type Material, type Okucie } from "../api";

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
  const [zakladka, setZakladka] = useState<"dekory" | "materialy" | "okucia" | "szuflady">("dekory");
  const [materialy, setMaterialy] = useState<Material[]>([]);
  const [cennik, setCennik] = useState<CennikMaterialow>({});
  const [widokOkuc, setWidokOkuc] = useState<"katalog" | "cennik">("katalog");
  const [okucia, setOkucia] = useState<Okucie[]>([]);
  const [szukaj, setSzukaj] = useState("");
  const [producent, setProducent] = useState("wszyscy");
  const [kolekcja, setKolekcja] = useState("wszystkie");
  const [typ, setTyp] = useState("wszystkie");
  const [grubosc, setGrubosc] = useState("wszystkie");
  const [blad, setBlad] = useState<string | null>(null);

  const wczytaj = () => Promise.all([api.materialy().then(setMaterialy), api.cennikMaterialow().then(setCennik), api.okucia().then(setOkucia)]).catch((e) => setBlad(e.message));
  useEffect(() => {
    wczytaj();
  }, []);

  const s = szukaj.toLowerCase();
  const katalogowe = materialy.filter((m) => ["egger", "kronospan"].includes(m.producent.toLowerCase()));
  const producenci = [...new Set(katalogowe.map((m) => m.producent))].sort();
  const kolekcje = [...new Set(katalogowe.map((m) => m.kolekcja).filter((v): v is string => Boolean(v)))].sort();
  const typy = [...new Set(katalogowe.map((m) => m.grupaDekoru).filter((v): v is string => Boolean(v)))].sort();
  const grubosci = [...new Set(katalogowe.map((m) => m.gruboscMM))].sort((a, b) => a - b);
  const widoczneMaterialy = materialy.filter((m) => {
    const pasujeTekst = !s || `${m.nazwa} ${m.producent} ${m.kod} ${m.dekor}`.toLowerCase().includes(s);
    return pasujeTekst &&
      (producent === "wszyscy" || m.producent === producent) &&
      (kolekcja === "wszystkie" || m.kolekcja === kolekcja) &&
      (typ === "wszystkie" || m.grupaDekoru === typ) &&
      (grubosc === "wszystkie" || m.gruboscMM === Number(grubosc));
  });
  const zapiszM = (id: string, d: Partial<Material>) => api.zapiszMaterial({ id, ...d }).then(wczytaj).catch((e) => setBlad(e.message));
  const zapiszC = (id: string, cena: number | null) => (cena === null ? api.usunCeneMaterialu(id) : api.zapiszCeneMaterialu(id, cena)).then(wczytaj).catch((e) => setBlad(e.message));
  const zapiszO = (id: string, d: Partial<Okucie>) => api.zapiszOkucie({ id, ...d }).then(wczytaj).catch((e) => setBlad(e.message));

  return (
    <div className="page">
      <div className="row">
        <h1>Materiały i okucia</h1>
        <nav className="nav">
          <button className={zakladka === "dekory" ? "on" : ""} onClick={() => setZakladka("dekory")}>Dekory producentów</button>
          <button className={zakladka === "materialy" ? "on" : ""} onClick={() => setZakladka("materialy")}>Materiały ({materialy.length})</button>
          <button className={zakladka === "okucia" ? "on" : ""} onClick={() => setZakladka("okucia")}>Okucia ({okucia.length})</button>
          <button className={zakladka === "szuflady" ? "on" : ""} onClick={() => setZakladka("szuflady")}>Przelicznik szuflad</button>
        </nav>
        <span className="spacer" />
        {(zakladka === "materialy" || zakladka === "okucia") && <input className="input" style={{ width: 240 }} placeholder="Szukaj…" value={szukaj} onChange={(e) => setSzukaj(e.target.value)} />}
      </div>
      {blad && <div className="alert blad">{blad}</div>}
      <p className="muted" style={{ margin: 0 }}>
        Katalog zdjęć znajduje się w zakładce Dekory producentów. Tutaj zarządzasz wybranymi materiałami i cenami zakupu.
      </p>

      {zakladka === "dekory" && <DecorCatalog onAdded={() => { wczytaj(); }} />}
      {zakladka === "szuflady" && <PrzelicznikSzuflad />}
      {zakladka === "materialy" && (
        <>
          <div className="stats">
            {producenci.map((p) => (
              <button key={p} className="stat" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => setProducent(producent === p ? "wszyscy" : p)}>
                <b>{katalogowe.filter((m) => m.producent === p).length}</b><span>{p} · materiałów</span>
              </button>
            ))}
            <div className="stat"><b>{katalogowe.length}</b><span>wariantów materiałów</span></div>
            <div className="stat"><b>{Object.keys(cennik).length}</b><span>pozycji z własną ceną</span></div>
          </div>
          {Object.keys(cennik).length === 0 && <div className="alert info">Cennik własny jest pusty. Uzupełnij cenę przy wybranym materiale — od tej chwili będzie używana priorytetowo w wycenach.</div>}
          <div className="row">
            <select className="input" style={{ width: 180 }} value={producent} onChange={(e) => setProducent(e.target.value)}>
              <option value="wszyscy">Wszyscy producenci</option>
              {producenci.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="input" style={{ width: 220 }} value={kolekcja} onChange={(e) => setKolekcja(e.target.value)}>
              <option value="wszystkie">Wszystkie kolekcje</option>
              {kolekcje.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <select className="input" style={{ width: 150 }} value={typ} onChange={(e) => setTyp(e.target.value)}>
              <option value="wszystkie">Wszystkie grupy</option>
              {typy.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="input" style={{ width: 130 }} value={grubosc} onChange={(e) => setGrubosc(e.target.value)}>
              <option value="wszystkie">Każda grubość</option>
              {grubosci.map((g) => <option key={g} value={g}>{g} mm</option>)}
            </select>
            <span className="muted">Widoczne: {widoczneMaterialy.length}</span>
          </div>
          <div className="card t-wrap" style={{ maxHeight: "calc(100vh - 330px)" }}>
          <table className="t">
            <thead>
              <tr>
                <th></th><th>Materiał</th><th>Typ</th><th className="r">Gr.</th><th className="r">Referencja netto</th><th className="r">Mój cennik netto</th><th>Jedn.</th><th className="r" title="Rabat od ceny referencyjnej; cena własna jest już ceną zakupu">Rabat % (ref.)</th><th>Aktywny</th>
              </tr>
            </thead>
            <tbody>
              {widoczneMaterialy.map((m) => (
                  <tr key={m.id} style={{ opacity: m.aktywny ? 1 : 0.5 }}>
                    <td><span className="swatch" style={{ background: m.kolorHEX, backgroundImage: m.zdjecieURL ? `url("${m.zdjecieURL}")` : undefined, backgroundSize: "cover" }} /></td>
                    <td>
                      <b>{m.producent !== "Stolarnia" ? `${m.producent} ` : ""}{m.nazwa}</b>
                      <div className="muted" style={{ fontSize: 11 }}>{m.kod}{m.grupaDekoru ? ` · ${m.grupaDekoru}` : ""}</div>
                    </td>
                    <td>{TYPY[m.typ] ?? m.typ}</td>
                    <td className="r num">{m.gruboscMM}</td>
                    <td className="r num">{m.cenaNetto > 0 ? zl(m.cenaNetto) : "brak"}</td>
                    <td className="r"><KwotaWlasna value={cennik[m.id]?.cenaNetto ?? null} onSave={(v) => zapiszC(m.id, v)} />{cennik[m.id] && <button className="btn small" title="Usuń cenę własną" onClick={() => zapiszC(m.id, null)}>×</button>}</td>
                    <td>{JEDN[m.jednostka]}</td>
                    <td className="r"><Kwota value={m.rabatProcent} onSave={(v) => zapiszM(m.id, { rabatProcent: v })} /></td>
                    <td><input type="checkbox" checked={m.aktywny} onChange={(e) => zapiszM(m.id, { aktywny: e.target.checked })} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
          </div>
        </>
      )}

      {zakladka === "okucia" && <>
        <div className="row" style={{ margin: "16px 0" }}>
          <button className={`btn ${widokOkuc === "katalog" ? "primary" : ""}`} onClick={() => setWidokOkuc("katalog")}>Katalog okuć, wkrętów i chemii</button>
          <button className={`btn ${widokOkuc === "cennik" ? "primary" : ""}`} onClick={() => setWidokOkuc("cennik")}>Mój cennik okuć ({okucia.length})</button>
        </div>
        {widokOkuc === "katalog" && <HardwareCatalog szukaj={szukaj} dodane={okucia.map(o => o.id)} odswiez={wczytaj} />}
      </>}
      {zakladka === "okucia" && widokOkuc === "cennik" && (
        <div className="card t-wrap" style={{ maxHeight: "calc(100vh - 230px)" }}>
          <table className="t">
            <thead>
              <tr><th>Okucie</th><th>Typ</th><th>Poziom</th><th className="r">Cena netto</th><th>Jedn.</th><th className="r">Rabat %</th><th className="r">Po rabacie</th><th>Aktywne</th></tr>
            </thead>
            <tbody>
              {okucia
                .filter((o) => !s || `${o.nazwa} ${o.producent} ${o.typ} ${o.skuProducenta ?? ""}`.toLowerCase().includes(s))
                .map((o) => (
                  <tr key={o.id} style={{ opacity: o.aktywne ? 1 : 0.5 }}>
                    <td><b>{o.nazwa}</b><div className="muted" style={{ fontSize: 11 }}>{o.skuProducenta ?? o.profilID}</div>{o.zrodloURL && <a href={o.zrodloURL} target="_blank" rel="noreferrer">Karta producenta</a>}</td>
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

function KwotaWlasna({ value, onSave }: { value: number | null; onSave: (v: number | null) => void }) {
  const [v, setV] = useState(value === null ? "" : String(value));
  useEffect(() => setV(value === null ? "" : String(value)), [value]);
  return (
    <input
      className="input num"
      style={{ width: 95, textAlign: "right" }}
      inputMode="decimal"
      placeholder="brak"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        if (!v.trim()) {
          if (value !== null) onSave(null);
          return;
        }
        const n = Number(v.replace(",", "."));
        if (Number.isFinite(n) && n > 0 && n <= 1000000 && n !== value) onSave(n);
        else setV(value === null ? "" : String(value));
      }}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}
