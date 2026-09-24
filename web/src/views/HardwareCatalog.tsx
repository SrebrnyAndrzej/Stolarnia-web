import { useEffect, useState } from "react";
import type { ProduktOkucia } from "../../../src/core/hardware-products";

export function HardwareCatalog({ szukaj, dodane, odswiez }: { szukaj: string; dodane: string[]; odswiez: () => void }) {
  const [produkty, setProdukty] = useState<ProduktOkucia[]>([]);
  const [loading, setLoading] = useState(true);
  const [blad, setBlad] = useState("");
  const [producent, setProducent] = useState("");
  const [system, setSystem] = useState("");
  const [rodzaj, setRodzaj] = useState("");
  const [limit, setLimit] = useState(24);
  useEffect(() => { let active = true; fetch("/api/okucia-katalog").then(async r => { if (!r.ok) throw new Error("Nie udało się wczytać katalogu okuć."); return r.json(); }).then(p => active && setProdukty(p)).catch(e => active && setBlad(e.message)).finally(() => active && setLoading(false)); return () => { active = false; }; }, []);
  useEffect(() => setLimit(24), [szukaj, producent, system, rodzaj]);
  const s = szukaj.trim().toLocaleLowerCase("pl");
  // Najpierw zestawy z konkretnym SKU, na końcu indeksy rodzin (bez wariantu do zamówienia).
  const waga = (p: ProduktOkucia) => (p.rodzajSKU === "wariant" ? 0 : p.rodzajSKU === "bazowy" ? 1 : 2) * 2 + (p.rodzaj === "zestaw" ? 0 : 1);
  const filtered = produkty
    .filter(p => (!producent || p.producent === producent) && (!system || p.system === system) && (!rodzaj || p.rodzaj === rodzaj) && (!s || `${p.nazwa} ${p.sku} ${p.producent} ${p.system} ${Object.values(p.parametry).join(" ")}`.toLocaleLowerCase("pl").includes(s)))
    .sort((a, b) => waga(a) - waga(b) || a.producent.localeCompare(b.producent) || a.sku.localeCompare(b.sku, "pl", { numeric: true }));
  return <section>
    <h2>Systemy szuflad — katalog producentów</h2>
    <p className="muted">Zdjęcia, indeksy i dokumentacja Amix, GTV i Blum. Zestaw okuć nie obejmuje automatycznie płyt dna, pleców ani frontu. Ceny zakupu uzupełniasz w swoim cenniku.</p>
    <div className="row hardware-filters">
      <label>Producent<select className="input" value={producent} onChange={e => { setProducent(e.target.value);setSystem(""); }}><option value="">Wszyscy producenci</option>{[...new Set(produkty.map(p => p.producent))].sort().map(x => <option key={x}>{x}</option>)}</select></label>
      <label>System<select className="input" value={system} onChange={e => setSystem(e.target.value)}><option value="">Wszystkie systemy</option>{[...new Set(produkty.filter(p => !producent || p.producent === producent).map(p => p.system))].sort().map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Rodzaj<select className="input" value={rodzaj} onChange={e => setRodzaj(e.target.value)}><option value="">Zestawy i elementy</option><option value="zestaw">Zestawy okuć szuflady</option><option value="element">Elementy systemu</option></select></label>
      <span role="status">{loading ? "Wczytywanie…" : `${filtered.length} produktów`}</span>
    </div>
    {blad && <p className="alert blad" role="alert">{blad} <button className="btn" onClick={() => location.reload()}>Ponów</button></p>}
    {!loading && !blad && !filtered.length && <p>Brak produktów dla wybranych filtrów.</p>}
    <div className="hardware-grid">{filtered.slice(0, limit).map(p => <HardwareCard key={p.id} p={p} dodany={dodane.includes(`katalog.${p.id}`)} odswiez={odswiez} />)}</div>
    {filtered.length > limit && <button className="btn" onClick={() => setLimit(v => v + 24)}>Pokaż kolejne produkty ({filtered.length - limit})</button>}
  </section>;
}

function HardwareCard({ p, dodany, odswiez }: { p: ProduktOkucia; dodany: boolean; odswiez: () => void }) {
  const [imageError, setImageError] = useState(false);
  const [cena, setCena] = useState("");
  const [blad, setBlad] = useState("");
  const [busy, setBusy] = useState(false);
  async function dodaj(e: React.FormEvent) {
    e.preventDefault();setBusy(true);setBlad("");
    try {
      const r = await fetch(`/api/okucia-katalog/${p.id}/dodaj`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cenaNetto: Number(cena.replace(",", ".")) }) });
      if (!r.ok) throw new Error((await r.json()).blad || "Nie udało się dodać produktu."); odswiez();
    } catch (e) { setBlad((e as Error).message); } finally { setBusy(false); }
  }
  return <article className="card hardware-card">
    {p.zdjecieURL && !imageError ? <img src={p.zdjecieURL} alt={p.nazwa} loading="lazy" onError={() => setImageError(true)} /> : <div className="hardware-placeholder">Zdjęcie niedostępne</div>}
    <div className="row"><span className="badge">{p.producent}</span><span className="muted">{p.rodzaj === "zestaw" ? "Zestaw okuć" : "Element systemu"}</span></div>
    <h3>{p.nazwa}</h3>
    <p><b>{p.rodzajSKU === "wariant" ? "SKU" : p.rodzajSKU === "rodzina" ? "Indeks rodziny" : "Numer bazowy"}: {p.sku || "Nie podano"}</b></p>
    {p.zdjecieOpis && <small className="muted">{p.zdjecieOpis}</small>}
    {p.parametry["Konflikt danych"] && <p className="alert ostrzezenie" role="note">{p.parametry["Konflikt danych"]}</p>}
    <details><summary>Parametry i dokumentacja</summary><dl>{Object.entries(p.parametry).map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      {p.dokumenty.map(d => <a key={d.url} href={d.url} target="_blank" rel="noreferrer">{d.nazwa}</a>)}
      <p className="muted">Dane katalogowe nie są zatwierdzonym profilem wierceń ani obróbki CNC.</p>
    </details>
    <a href={p.zrodloURL} target="_blank" rel="noreferrer">Karta producenta ↗</a>
    <small className="muted">Pozyskano: {new Date(p.pobrano).toLocaleDateString("pl-PL")}</small>
    {dodany ? <p className="badge">W Twoim cenniku</p> : p.rodzajSKU === "wariant" ? <form onSubmit={dodaj} className="hardware-import"><label>Cena zakupu netto za zestaw [zł]<input className="input" aria-label={`Cena netto ${p.sku}`} required type="number" min="0.01" max="1000000" step="0.01" value={cena} onChange={e => setCena(e.target.value)} /></label><button className="btn" disabled={busy}>{busy ? "Dodawanie…" : "Dodaj do cennika"}</button></form> : <p className="muted">Przed zamówieniem wybierz dokładny wariant u producenta (kolor, długość lub stronę).</p>}
    {blad && <p className="alert blad" role="alert">{blad}</p>}
  </article>;
}
