import { useEffect, useState } from "react";
import { NAZWY_KATEGORII_OKUC, type KategoriaProduktuOkucia, type ProduktOkucia } from "../../../src/core/hardware-products";

interface StronaKatalogu {
  razem: number;
  produkty: ProduktOkucia[];
  kategorie: Record<string, number>;
  producenci: Record<string, number>;
}

const NA_STRONE = 48;

// Katalog okuć, wkrętów, klejów i chemii: filtrowanie i stronicowanie po stronie serwera (kilka tysięcy pozycji).
export function HardwareCatalog({ szukaj, dodane, odswiez }: { szukaj: string; dodane: string[]; odswiez: () => void }) {
  const [dane, setDane] = useState<StronaKatalogu | null>(null);
  const [produkty, setProdukty] = useState<ProduktOkucia[]>([]);
  const [loading, setLoading] = useState(true);
  const [blad, setBlad] = useState("");
  const [kategoria, setKategoria] = useState<KategoriaProduktuOkucia | "">("");
  const [producent, setProducent] = useState("");
  const [rodzaj, setRodzaj] = useState("");
  const [fraza, setFraza] = useState(szukaj);
  useEffect(() => {
    const t = setTimeout(() => setFraza(szukaj), 250);
    return () => clearTimeout(t);
  }, [szukaj]);

  const pobierz = async (od: number) => {
    const q = new URLSearchParams({ widok: "strona", od: String(od), ile: String(NA_STRONE) });
    if (kategoria) q.set("kategoria", kategoria);
    if (producent) q.set("producent", producent);
    if (rodzaj) q.set("rodzaj", rodzaj);
    if (fraza.trim()) q.set("szukaj", fraza.trim());
    const r = await fetch(`/api/okucia-katalog?${q}`);
    if (!r.ok) throw new Error("Nie udało się wczytać katalogu okuć.");
    return (await r.json()) as StronaKatalogu;
  };

  useEffect(() => {
    let aktywny = true;
    setLoading(true);
    pobierz(0)
      .then((d) => { if (aktywny) { setDane(d); setProdukty(d.produkty); setBlad(""); } })
      .catch((e) => aktywny && setBlad(e.message))
      .finally(() => aktywny && setLoading(false));
    return () => { aktywny = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kategoria, producent, rodzaj, fraza]);

  const wiecej = async () => {
    setLoading(true);
    try {
      const d = await pobierz(produkty.length);
      setProdukty((p) => [...p, ...d.produkty]);
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const kategorie = Object.entries(dane?.kategorie ?? {}).sort((a, b) => b[1] - a[1]);
  const wszystkich = kategorie.reduce((s, [, n]) => s + n, 0);
  return <section>
    <h2>Katalog okuć, wkrętów i chemii</h2>
    <p className="muted">Zdjęcia, indeksy producentów, EAN i dokumentacja: GTV, Amix, Blum, Hettich, Häfele, Laguna, Sevroll, Matrix, Astra, Spray-Kon, Mamut i inne. Pozycje z dystrybutora są oznaczone. Ceny zakupu uzupełniasz w swoim cenniku.</p>
    <nav className="etapy-pasek" aria-label="Kategoria katalogu" style={{ margin: "14px 0" }}>
      <button className={`etap-filtr ${kategoria === "" ? "on" : ""}`} aria-pressed={kategoria === ""} onClick={() => { setKategoria(""); setProducent(""); }}>
        Wszystko <span className="etap-licznik">{wszystkich}</span>
      </button>
      {kategorie.map(([k, n]) => (
        <button key={k} className={`etap-filtr ${kategoria === k ? "on" : ""}`} aria-pressed={kategoria === k} onClick={() => { setKategoria(kategoria === k ? "" : (k as KategoriaProduktuOkucia)); setProducent(""); }}>
          {NAZWY_KATEGORII_OKUC[k as KategoriaProduktuOkucia] ?? k} <span className="etap-licznik">{n}</span>
        </button>
      ))}
    </nav>
    <div className="row hardware-filters">
      <label>Producent<select className="input" value={producent} onChange={e => setProducent(e.target.value)}><option value="">Wszyscy producenci</option>{Object.entries(dane?.producenci ?? {}).sort((a, b) => a[0].localeCompare(b[0], "pl")).map(([x, n]) => <option key={x} value={x}>{x} ({n})</option>)}</select></label>
      <label>Rodzaj<select className="input" value={rodzaj} onChange={e => setRodzaj(e.target.value)}><option value="">Zestawy i elementy</option><option value="zestaw">Zestawy / komplety</option><option value="element">Pojedyncze elementy</option></select></label>
      <span role="status">{loading ? "Wczytywanie…" : `${dane?.razem ?? 0} produktów`}</span>
    </div>
    {blad && <p className="alert blad" role="alert">{blad} <button className="btn" onClick={() => location.reload()}>Ponów</button></p>}
    {!loading && !blad && !produkty.length && <p>Brak produktów dla wybranych filtrów.</p>}
    <div className="hardware-grid">{produkty.map(p => <HardwareCard key={p.id} p={p} dodany={dodane.includes(`katalog.${p.id}`)} odswiez={odswiez} />)}</div>
    {dane && dane.razem > produkty.length && <button className="btn" disabled={loading} onClick={wiecej}>Pokaż kolejne produkty ({dane.razem - produkty.length})</button>}
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
    <div className="row"><span className="badge">{p.producent}</span>{p.kategoria && <span className="badge accent">{NAZWY_KATEGORII_OKUC[p.kategoria]}</span>}{p.zrodloTyp === "dystrybutor" && <span className="badge warn" title="Dane z karty dystrybutora (Merkury AM), nie z katalogu producenta">dystrybutor</span>}</div>
    <h3>{p.nazwa}</h3>
    <p><b>{p.rodzajSKU === "wariant" ? "SKU producenta" : p.rodzajSKU === "rodzina" ? "Indeks rodziny" : p.rodzajSKU === "dystrybutor" ? "Symbol dystrybutora" : "Numer bazowy"}: {(p.rodzajSKU === "dystrybutor" ? p.symbolDystrybutora : p.sku) || "Nie podano"}</b>{p.ean && <><br /><span className="muted">EAN: {p.ean}</span></>}{p.sku && p.symbolDystrybutora && p.rodzajSKU !== "dystrybutor" && <><br /><span className="muted">Symbol dystrybutora: {p.symbolDystrybutora}</span></>}</p>
    {p.cenaReferencyjna && <small className="muted">Orientacyjnie: {p.cenaReferencyjna.kwota.toLocaleString("pl-PL", { style: "currency", currency: p.cenaReferencyjna.waluta })} — {p.cenaReferencyjna.opis}, {p.cenaReferencyjna.data}</small>}
    {p.zdjecieOpis && <small className="muted">{p.zdjecieOpis}</small>}
    {p.parametry["Konflikt danych"] && <p className="alert ostrzezenie" role="note">{p.parametry["Konflikt danych"]}</p>}
    <details><summary>Parametry i dokumentacja</summary><dl>{Object.entries(p.parametry).map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      {p.dokumenty.map(d => <a key={d.url} href={d.url} target="_blank" rel="noreferrer">{d.nazwa}</a>)}
      <p className="muted">Dane katalogowe nie są zatwierdzonym profilem wierceń ani obróbki CNC.</p>
    </details>
    <a href={p.zrodloURL} target="_blank" rel="noreferrer">{p.zrodloTyp === "dystrybutor" ? "Karta dystrybutora ↗" : "Karta producenta ↗"}</a>
    <small className="muted">Pozyskano: {new Date(p.pobrano).toLocaleDateString("pl-PL")}</small>
    {dodany ? <p className="badge">W Twoim cenniku</p> : p.rodzajSKU === "wariant" || (p.rodzajSKU === "dystrybutor" && p.symbolDystrybutora) ? <form onSubmit={dodaj} className="hardware-import"><label>Cena zakupu netto [zł]<input className="input" aria-label={`Cena netto ${p.sku || p.symbolDystrybutora}`} required type="number" min="0.01" max="1000000" step="0.01" value={cena} onChange={e => setCena(e.target.value)} /></label><button className="btn" disabled={busy}>{busy ? "Dodawanie…" : "Dodaj do cennika"}</button></form> : <p className="muted">Przed zamówieniem wybierz dokładny wariant u producenta (kolor, długość lub stronę).</p>}
    {blad && <p className="alert blad" role="alert">{blad}</p>}
  </article>;
}
