import { useEffect, useState } from "react";
import type { Material } from "../api";

interface Decor { key: string; id: string; name: string; manufacturer: string; obraz: string; source_url: string; surface_label?: string; textures?: string[] }
interface Variant { article_id: string; product_label: string; dimension_xy_source: string; dimension_z_source: string }
async function request<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const d = await r.json();
  if (!r.ok) throw new Error(d.blad ?? "Nie udało się wczytać katalogu.");
  return d;
}
export function DecorCatalog({ onAdded }: { onAdded?: (m: Material) => void }) {
  const [items, setItems] = useState<Decor[]>([]), [search, setSearch] = useState(""), [brand, setBrand] = useState("");
  const [selected, setSelected] = useState<Decor | null>(null), [variants, setVariants] = useState<Variant[]>([]);
  const [article, setArticle] = useState(""), [manual, setManual] = useState(false), [structure, setStructure] = useState("");
  const [thickness, setThickness] = useState(""), [length, setLength] = useState(""), [width, setWidth] = useState("");
  const [directional, setDirectional] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false), [saving, setSaving] = useState(false);
  useEffect(() => { request<Decor[]>("/api/dekory").then(setItems).catch(e => setError(e.message)); }, []);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    setLoading(true); setVariants([]); setArticle(""); setManual(false); setError("");
    setThickness(""); setLength(""); setWidth(""); setDirectional(false); setStructure(selected.surface_label ?? "");
    request<{ warianty: Variant[] }>(`/api/dekory/${encodeURIComponent(selected.key)}`).then(d => {
      if (!active) return;
      setVariants(d.warianty); setManual(d.warianty.length === 0);
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selected]);
  const visible = items.filter(d => (!brand || d.manufacturer === brand) && `${d.id} ${d.name} ${d.surface_label ?? ""} ${(d.textures ?? []).join(" ")}`.toLocaleLowerCase("pl").includes(search.toLocaleLowerCase("pl")));
  async function add() {
    if (!selected) return;
    setSaving(true); setError("");
    try {
      const m = await request<Material>(`/api/dekory/${encodeURIComponent(selected.key)}/material`, manual ? {
        gruboscMM: Number(thickness), wysokoscArkuszaMM: Number(length), szerokoscArkuszaMM: Number(width), struktura: structure, kierunekDekoru: directional,
      } : { artykul: article });
      setMessage(`Dodano: ${m.nazwa}. Uzupełnij cenę zakupu w zakładce Materiały.`);
      window.dispatchEvent(new Event("materialy-zmienione")); onAdded?.(m); setSelected(null);
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  }
  return <section>
    <p>Wczytano {items.length} dekorów: Egger {items.filter(d => d.manufacturer === "Egger").length} · Kronospan {items.filter(d => d.manufacturer === "Kronospan").length}. Katalog PL, stan danych: 23.09.2026.</p>
    <p className="muted">Zdjęcia poglądowe. Obecność w katalogu nie potwierdza stanu magazynowego. Kolekcje regionalne wymagają dalszego uzupełnienia.</p>
    <div className="row"><input aria-label="Szukaj dekoru" className="input" placeholder="Kod, nazwa lub struktura…" value={search} onChange={e => setSearch(e.target.value)} />
      <select aria-label="Producent dekoru" className="input" value={brand} onChange={e => setBrand(e.target.value)}><option value="">Wszyscy producenci</option><option>Egger</option><option>Kronospan</option></select><span>{visible.length} wyników</span></div>
    {error && <p role="alert" className="alert blad">{error}</p>}{message && <p role="status">{message}</p>}
    <div className="decor-grid">{visible.map(d => <button className="decor-card" key={d.key} onClick={() => { setSelected(d); setMessage(""); }}>
      <img src={d.obraz} alt={`${d.id} — ${d.name}`} loading="lazy" width="240" height="135" />
      <strong>{d.manufacturer} {d.id}</strong><span>{d.name}</span><small>{d.surface_label ?? d.textures?.join(" · ")}</small>
    </button>)}</div>
    {selected && <div className="decor-overlay"><section className="decor-dialog" role="dialog" aria-modal="true" aria-label="Dodaj dekor do materiałów" onKeyDown={e => { if (e.key === "Escape" && !saving) setSelected(null); }}>
      <button autoFocus className="btn" disabled={saving} onClick={() => setSelected(null)}>Zamknij</button>
      <h2>{selected.manufacturer} {selected.id} · {selected.name}</h2><img className="decor-preview" src={selected.obraz} alt={selected.name} />
      <p><a href={selected.source_url} target="_blank" rel="noreferrer">Dokumentacja dekoru u producenta</a></p>
      {loading ? <p>Wczytywanie wariantów…</p> : <>
        {variants.length > 0 && <><label>Wariant płyty<select className="input" value={manual ? "manual" : article} onChange={e => { setManual(e.target.value === "manual"); setArticle(e.target.value === "manual" ? "" : e.target.value); }}>
          <option value="">Wybierz artykuł producenta</option>{variants.map(v => <option key={v.article_id} value={v.article_id}>{v.dimension_z_source} mm · {v.dimension_xy_source} mm · {v.product_label} · {v.article_id}</option>)}<option value="manual">Wpisz format od dostawcy</option></select></label></>}
        {manual && <><p>Brak pełnej tabeli formatów dla tego wyboru. Wpisz parametry potwierdzone u dostawcy.</p>
          <div className="row">{[["Grubość (mm)", thickness, setThickness], ["Długość arkusza (mm)", length, setLength], ["Szerokość arkusza (mm)", width, setWidth]].map(([label, value, setter]) => <label key={label as string}>{label as string}<input className="input" type="number" min="0.1" step="0.1" value={value as string} onChange={e => (setter as (s: string) => void)(e.target.value)} /></label>)}</div>
          {!selected.surface_label && <label>Struktura{selected.textures?.length ? <select className="input" value={structure} onChange={e => setStructure(e.target.value)}><option value="">Wybierz strukturę</option>{selected.textures.map(t => <option key={t}>{t}</option>)}</select> : <input className="input" value={structure} onChange={e => setStructure(e.target.value)} />}</label>}
          {selected.manufacturer !== "Egger" && <label><input type="checkbox" checked={directional} onChange={e => setDirectional(e.target.checked)} /> Dekor kierunkowy — bez obracania formatek</label>}
        </>}
        <p className="muted">Cena zakupu zostanie oznaczona jako brakująca. Dodany materiał będzie dostępny w projektancie.</p>
        {error && <p role="alert">{error}</p>}
        <button className="btn" disabled={saving || (!manual && !article)} onClick={add}>{saving ? "Zapisywanie…" : "Dodaj do materiałów"}</button>
      </>}
    </section></div>}
  </section>;
}
