import { useEffect, useMemo, useState } from "react";
import { api, zl, type Analiza, type Material } from "../api";
import { domyslneUjecia, renderuj, type Render } from "../render/fotorealizm";
import type { WariantWyceny } from "../../../src/core/types";

/** Oferta dla klienta: wizualizacje fotorealistyczne renderowane w przeglądarce + PDF składany na serwerze. */
export function Oferta({ analiza }: { analiza: Analiza }) {
  const p = analiza.projekt;
  const [materialy, setMaterialy] = useState<Material[] | null>(null);
  const [rendery, setRendery] = useState<Render[]>([]);
  const [postep, setPostep] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [wariant, setWariant] = useState<WariantWyceny>("standard");
  const [numer, setNumer] = useState("");
  const [waznosc, setWaznosc] = useState(14);
  const [termin, setTermin] = useState("");
  const [uwagi, setUwagi] = useState("");
  const [podglad, setPodglad] = useState<Render | null>(null);

  useEffect(() => {
    api.materialy().then(setMaterialy).catch((e) => setBlad(e.message));
  }, []);
  const matMap = useMemo(() => new Map((materialy ?? []).map((m) => [m.id, m])), [materialy]);
  const ujecia = useMemo(() => domyslneUjecia(analiza), [analiza]);

  const generuj = async () => {
    setBlad(null);
    setPostep("Przygotowanie sceny…");
    try {
      const r = await renderuj(analiza, matMap, ujecia, { postep: (i, n) => setPostep(i < n ? `Renderowanie ujęcia ${i + 1} z ${n}: ${ujecia[i].tytul}` : "Gotowe") });
      setRendery(r);
    } catch (e) {
      setBlad(`Nie udało się wyrenderować: ${(e as Error).message}`);
    } finally {
      setPostep(null);
    }
  };

  const pobierzPdf = async () => {
    setBlad(null);
    setPostep("Składanie PDF…");
    try {
      const odp = await fetch(`/api/projekty/${p.id}/oferta.pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wariant,
          numer: numer || undefined,
          waznoscDni: waznosc,
          terminRealizacji: termin || undefined,
          uwagi: uwagi.split("\n").map((s) => s.trim()).filter(Boolean),
          wizualizacje: rendery.map((r) => ({ tytul: r.ujecie.tytul, jpegBase64: r.obraz })),
        }),
      });
      if (!odp.ok) throw new Error(((await odp.json().catch(() => ({}))) as { blad?: string }).blad ?? `Błąd ${odp.status}`);
      const url = URL.createObjectURL(await odp.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `Oferta — ${p.nazwa}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setPostep(null);
    }
  };

  const wybrany = analiza.warianty.find((w) => w.wariant === wariant);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card">
        <div className="card-h" style={{ flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ flex: 1 }}>Oferta dla klienta</h2>
          <button className="btn" disabled={!materialy || !!postep} onClick={generuj}>{rendery.length ? "Renderuj ponownie" : "Generuj wizualizacje"}</button>
          <button className="btn primary" disabled={!rendery.length || !!postep} onClick={pobierzPdf}>Pobierz ofertę PDF</button>
        </div>
        <div className="card-b" style={{ display: "grid", gap: 12 }}>
          <div className="grid3">
            <div className="field">
              <label>Wariant w ofercie</label>
              <select className="input" value={wariant} onChange={(e) => setWariant(e.target.value as WariantWyceny)}>
                {analiza.warianty.map((w) => (
                  <option key={w.wariant} value={w.wariant}>{w.nazwa} — {zl(w.cenaBrutto)} brutto</option>
                ))}
              </select>
            </div>
            <label className="field">
              <span>Numer oferty</span>
              <input className="input" placeholder="automatyczny" value={numer} onChange={(e) => setNumer(e.target.value)} />
            </label>
            <label className="field">
              <span>Ważność [dni]</span>
              <input className="input" type="number" min={1} value={waznosc} onChange={(e) => setWaznosc(Number(e.target.value) || 14)} />
            </label>
          </div>
          <label className="field">
            <span>Termin realizacji</span>
            <input className="input" placeholder="np. 6–8 tygodni od akceptacji i wpłaty zaliczki" value={termin} onChange={(e) => setTermin(e.target.value)} />
          </label>
          <label className="field">
            <span>Dodatkowe warunki (każdy w nowej linii)</span>
            <textarea className="input" rows={3} value={uwagi} onChange={(e) => setUwagi(e.target.value)} />
          </label>
          {wybrany && <div className="muted">W ofercie: {wybrany.nazwa} — <b>{zl(wybrany.cenaBrutto)}</b> brutto ({zl(wybrany.cenaNetto)} netto). Wszystkie warianty pokazane do porównania.</div>}
          {postep && <div className="alert">{postep}</div>}
          {blad && <div className="alert blad">{blad}</div>}
        </div>
      </div>

      {rendery.length > 0 && (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))" }}>
          {rendery.map((r) => (
            <figure key={r.ujecie.id} className="card" style={{ margin: 0, overflow: "hidden" }}>
              <img src={r.obraz} alt={r.ujecie.tytul} style={{ width: "100%", display: "block", cursor: "zoom-in" }} onClick={() => setPodglad(r)} />
              <figcaption className="card-b row">
                <span style={{ flex: 1 }}>{r.ujecie.tytul}</span>
                <a className="btn small" href={r.obraz} download={`${p.nazwa} — ${r.ujecie.tytul}.jpg`}>JPG</a>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {podglad && (
        <div onClick={() => setPodglad(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "grid", placeItems: "center", zIndex: 50, cursor: "zoom-out", padding: 16 }}>
          <img src={podglad.obraz} alt={podglad.ujecie.tytul} style={{ maxWidth: "100%", maxHeight: "100%" }} />
        </div>
      )}
    </div>
  );
}
