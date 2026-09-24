import { useEffect, useState } from "react";
import { api, zl, type Analiza } from "../api";
import { WARUNKI_UMOWY, ZAKRESY, type DaneUmowy, type Umowa } from "../../../src/core/contracts";

export function Contracts({ analiza }: { analiza: Analiza }) {
  const id = analiza.projekt.id;
  const [lista, setLista] = useState<Umowa[]>([]);
  const [dane, setDane] = useState<DaneUmowy | null>(null);
  const [blad, setBlad] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([api.umowy(id), api.ustawienia()]).then(([umowy, u]) => {
      if (!active) return;
      const f = u.daneFirmy;
      setLista(umowy);
      setDane({ numer: `UM/${new Date().getFullYear()}/${crypto.randomUUID().slice(0, 8).toUpperCase()}`, rodzaj: "kuchnia",
        klient: analiza.projekt.klient.nazwa, adresKlienta: analiza.projekt.klient.adres,
        firma: [f.nazwaFirmy, f.wlasciciel].filter(Boolean).join(" - "), adresFirmy: [f.adres, [f.kodPocztowy, f.miasto].filter(Boolean).join(" ")].filter(Boolean).join(", "), nip: f.nip,
        adresMontazu: analiza.projekt.klient.adres, miejsce: "", data: "", termin: "", cena: Math.round((analiza.warianty.find(w => w.wariant === "standard")?.cenaBrutto ?? 0) * 100) / 100,
        zaliczka: 0, zaliczkaZaplacona: false, dataZaliczki: "", zakres: ZAKRESY.kuchnia, warunki: WARUNKI_UMOWY });
    }).catch(e => active && setBlad(e.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const zmien = <K extends keyof DaneUmowy>(key: K, value: DaneUmowy[K]) => { setDane(v => v && ({ ...v, [key]: value })); setDirty(true); setInfo(""); };
  async function pobierz(u: Umowa) {
    setBusy(true); setBlad("");
    try {
      const r = await fetch(`/api/projekty/${id}/umowy/${u.id}/pdf`);
      if (!r.ok) throw new Error((await r.json()).blad || "Nie udało się pobrać PDF.");
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a"); a.href = url; a.download = `Umowa-${u.numer.replace(/[^\p{L}\p{N}-]/gu, "-")}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) { setBlad((e as Error).message); } finally { setBusy(false); }
  }
  async function zapisz(e: React.FormEvent) {
    e.preventDefault(); if (!dane || busy) return;
    setBusy(true); setBlad("");setInfo("");
    try {
      const u = await api.dodajUmowe(id, dane);
      setLista(l => [...l, u]); setDirty(false); setDane(v => v && ({ ...v, numer: `UM/${new Date().getFullYear()}/${crypto.randomUUID().slice(0, 8).toUpperCase()}` }));
      setInfo("Umowa zapisana. Pobierz PDF z listy poniżej. Zapis nie oznacza podpisania umowy.");
    } catch (e) { setBlad((e as Error).message); } finally { setBusy(false); }
  }
  if (loading) return <p role="status">Wczytywanie umów…</p>;
  if (!dane) return <div role="alert" className="alert blad">{blad || "Nie udało się wczytać formularza."} <button className="btn" onClick={() => location.reload()}>Ponów</button></div>;
  const pole = (key: keyof DaneUmowy, label: string, type = "text", required = false) => <label key={key}>{label}<input type={type} required={required} maxLength={type === "text" ? 400 : undefined} value={String(dane[key])} onChange={e => zmien(key, e.target.value)} /></label>;
  return <section className="contracts">
    <h2>Umowy</h2>
    <p className="muted">Przygotuj umowę, sprawdź dane i zapisz ją przed pobraniem PDF. Projekt kuchni i szczegóły wyposażenia ustalicie osobno. Zapisane dokumenty zachowują dane i kwoty z dnia zapisu.</p>
    {blad && <div className="alert blad" role="alert">{blad}</div>}
    {info && <div className="alert" role="status">{info}</div>}
    <form onSubmit={zapisz}>
      <fieldset disabled={busy}>
        <legend>Nowa umowa</legend>
        <div className="contract-grid">
          <label>Rodzaj umowy<select value={dane.rodzaj} onChange={e => { const rodzaj = e.target.value as DaneUmowy["rodzaj"]; if (dirty && !confirm("Zmiana rodzaju zastąpi opis przedmiotu umowy. Kontynuować?")) return; setDane(v => v && ({ ...v, rodzaj, zakres: ZAKRESY[rodzaj] }));setDirty(true); }}><option value="kuchnia">Kuchnia</option><option value="schody">Okładzina schodów</option><option value="inne">Inna umowa o dzieło</option></select></label>
          {pole("numer", "Numer umowy", "text", true)}{pole("data", "Data zawarcia (można uzupełnić ręcznie)", "date")}{pole("miejsce", "Miejsce zawarcia")}
          {pole("klient", "Imię i nazwisko / nazwa klienta", "text", true)}{pole("adresKlienta", "Adres klienta", "text", true)}
          {pole("firma", "Firma i właściciel", "text", true)}{pole("adresFirmy", "Adres firmy", "text", true)}{pole("nip", "NIP firmy", "text", true)}
          {pole("adresMontazu", "Adres montażu", "text", true)}{pole("termin", "Termin zakończenia (można uzupełnić ręcznie)", "date")}
        </div>
        <h3>Rozliczenie</h3>
        <p className="muted">Cena startowa pochodzi z wyceny Standard. Sprawdź uzgodnioną z klientem kwotę.</p>
        <div className="contract-grid">
          <label>Cena brutto [zł]<input required type="number" min="0.01" max="100000000" step="0.01" value={dane.cena || ""} onChange={e => zmien("cena", e.target.valueAsNumber || 0)} /></label>
          <label>Zaliczka [zł]<input required type="number" min="0" max={dane.cena} step="0.01" value={dane.zaliczka} onChange={e => zmien("zaliczka", e.target.valueAsNumber || 0)} /></label>
          <label className="contract-check"><input type="checkbox" checked={dane.zaliczkaZaplacona} onChange={e => { zmien("zaliczkaZaplacona", e.target.checked); if (!e.target.checked) zmien("dataZaliczki", ""); }} /> Potwierdzam otrzymanie zaliczki</label>
          {dane.zaliczkaZaplacona && pole("dataZaliczki", "Data otrzymania zaliczki (opcjonalnie)", "date")}
        </div>
        <p><b>Pozostało do zapłaty: {zl((Math.round(dane.cena * 100) - (dane.zaliczkaZaplacona ? Math.round(dane.zaliczka * 100) : 0)) / 100)}</b>{!dane.zaliczkaZaplacona && " — zaliczka nie została oznaczona jako otrzymana."}</p>
        <label>Przedmiot umowy<textarea required maxLength={5000} rows={6} value={dane.zakres} onChange={e => zmien("zakres", e.target.value)} /></label>
        <label>Warunki umowy — sprawdź i dostosuj przed podpisaniem<textarea required maxLength={12000} rows={15} value={dane.warunki} onChange={e => zmien("warunki", e.target.value)} /></label>
        <p className="muted">Puste daty zostaną zastąpione miejscem do ręcznego uzupełnienia. Zapisana umowa nie jest automatycznie podpisana ani wysłana klientowi.</p>
        <button className="btn primary" disabled={busy} type="submit">{busy ? "Proszę czekać…" : "Zapisz umowę"}</button>
        {dirty && <span className="muted"> Masz niezapisane zmiany.</span>}
      </fieldset>
    </form>
    <h3>Zapisane umowy</h3>
    {!lista.length && <p className="muted">Ten projekt nie ma jeszcze zapisanych umów.</p>}
    {[...lista].reverse().map(u => <article className="contract-item" key={u.id}><div><b>{u.numer}</b><p>{u.klient} · {zl(u.cena)} · {new Date(u.utworzono).toLocaleDateString("pl-PL")}</p></div><div className="row"><button className="btn" disabled={busy} onClick={() => pobierz(u)}>Pobierz PDF</button><button className="btn" disabled={busy} onClick={() => { if (dirty && !confirm("Zastąpić niezapisany formularz kopią tej umowy?")) return; const { id: _id, utworzono: _ut, ...d } = u;setDane({ ...d, numer: `UM/${new Date().getFullYear()}/${crypto.randomUUID().slice(0, 8).toUpperCase()}` });setDirty(true);setInfo("Wczytano kopię do formularza. Oryginał pozostaje bez zmian.");window.scrollTo({ top: 0, behavior: "smooth" }); }}>Utwórz na podstawie</button></div></article>)}
  </section>;
}
