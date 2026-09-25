import { DecorCatalog } from "./DecorCatalog";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, mm, type Analiza, type Material, type Modul, type ModulKatalogowy } from "../api";
import { ImportDxf } from "./ImportDxf";
import { Rzut } from "./Rzut";
import { Widok3D } from "./Widok3D";

const KATEGORIE: Record<string, string> = {
  base: "Szafki dolne",
  appliance: "Zabudowa AGD",
  corner: "Narożne",
  wall: "Szafki wiszące",
  tall: "Słupki",
  open: "Otwarte",
};

interface Props {
  analiza: Analiza;
  odswiez: () => Promise<void>;
}

export function Designer({ analiza, odswiez }: Props) {
  const p = analiza.projekt;
  const [katalog, setKatalog] = useState<ModulKatalogowy[]>([]);
  const [materialy, setMaterialy] = useState<Material[]>([]);
  const [scianaId, setScianaId] = useState(p.pomieszczenia[0]?.sciany[0]?.id ?? "");
  const [wybrany, setWybrany] = useState<string | null>(null);
  const [szukaj, setSzukaj] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [panel, setPanel] = useState<"katalog" | "wlasciwosci">("katalog");
  const [widok, setWidok] = useState<"elewacja" | "rzut" | "3d">("elewacja");
  const [importDxf, setImportDxf] = useState(false);
  // Po imporcie CAD przejdź na pierwszą ścianę nowego pomieszczenia.
  const wybierzNowe = useRef(false);
  useEffect(() => {
    if (!wybierzNowe.current) return;
    const nowe = p.pomieszczenia[p.pomieszczenia.length - 1];
    if (nowe?.sciany[0]) {
      setScianaId(nowe.sciany[0].id);
      wybierzNowe.current = false;
    }
  }, [p.pomieszczenia]);

  useEffect(() => {
    api.katalog().then(setKatalog);
    const reload = () => { api.materialy().then(setMaterialy).catch(e => setBlad(e.message)); };
    reload();
    window.addEventListener("materialy-zmienione", reload);
    return () => window.removeEventListener("materialy-zmienione", reload);
  }, []);

  const sciany = p.pomieszczenia.flatMap((r) => r.sciany.map((s) => ({ ...s, pomieszczenie: r })));
  const sciana = sciany.find((s) => s.id === scianaId) ?? sciany[0];
  useEffect(() => {
    if (!sciany.some((s) => s.id === scianaId) && sciany[0]) setScianaId(sciany[0].id);
  }, [sciany, scianaId]);

  const matMap = useMemo(() => new Map(materialy.map((m) => [m.id, m])), [materialy]);
  const modul = p.moduly.find((m) => m.id === wybrany) ?? null;

  // Historia zmian (cofnij/ponów) — migawki pomieszczeń i modułów sprzed każdej operacji.
  type Stan = { pomieszczenia: typeof p.pomieszczenia; moduly: typeof p.moduly };
  const [wstecz, setWstecz] = useState<Stan[]>([]);
  const [naprzod, setNaprzod] = useState<Stan[]>([]);
  const migawka = (): Stan => structuredClone({ pomieszczenia: p.pomieszczenia, moduly: p.moduly });
  const [toasty, setToasty] = useState<{ id: number; tekst: string; blad?: boolean }[]>([]);
  const toast = (tekst: string, blad = false) => {
    const id = Date.now() + Math.random();
    setToasty((t) => [...t.slice(-3), { id, tekst, blad }]);
    setTimeout(() => setToasty((t) => t.filter((x) => x.id !== id)), blad ? 6000 : 2500);
  };

  const wykonaj = async (fn: () => Promise<unknown>, opis?: string) => {
    const przed = migawka();
    try {
      setBlad(null);
      await fn();
      setWstecz((w) => [...w.slice(-49), przed]);
      setNaprzod([]);
      await odswiez();
      if (opis) toast(opis);
    } catch (e) {
      toast((e as Error).message, true);
    }
  };

  const cofnij = async () => {
    const poprz = wstecz[wstecz.length - 1];
    if (!poprz) return;
    const teraz = migawka();
    await api.przywrocStan(p.id, poprz);
    setWstecz((w) => w.slice(0, -1));
    setNaprzod((n) => [...n, teraz]);
    await odswiez();
    toast("Cofnięto");
  };
  const ponow = async () => {
    const nast = naprzod[naprzod.length - 1];
    if (!nast) return;
    const teraz = migawka();
    await api.przywrocStan(p.id, nast);
    setNaprzod((n) => n.slice(0, -1));
    setWstecz((w) => [...w, teraz]);
    await odswiez();
    toast("Ponowiono");
  };

  const dodaj = (k: ModulKatalogowy, pozycjaXMM?: number) =>
    wykonaj(async () => {
      const m = await api.dodajModul(p.id, { katalogId: k.id, scianaId: sciana?.id, pozycjaXMM });
      setWybrany(m.id);
    }, `Dodano: ${k.name}`);

  // Skróty klawiszowe
  const stanRef = useRef({ modul, cofnij, ponow, wykonaj, setWybrany });
  stanRef.current = { modul, cofnij, ponow, wykonaj, setWybrany };
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const cel = e.target as HTMLElement;
      if (cel.closest("input, select, textarea")) return;
      const { modul, cofnij, ponow, wykonaj, setWybrany } = stanRef.current;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); cofnij(); return; }
      if (ctrl && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); ponow(); return; }
      if (!modul) return;
      if (e.key === "Escape") setWybrany(null);
      else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        wykonaj(async () => { await api.usunModul(p.id, modul.id); setWybrany(null); }, `Usunięto: ${modul.nazwa}`);
      } else if (ctrl && e.key.toLowerCase() === "d") {
        e.preventDefault();
        wykonaj(async () => setWybrany((await api.duplikujModul(p.id, modul.id)).id), "Zduplikowano");
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const krok = e.shiftKey ? 100 : e.altKey ? 1 : 10;
        const x = Math.max(0, modul.pozycjaXMM + (e.key === "ArrowLeft" ? -krok : krok));
        wykonaj(() => api.zmienModul(p.id, modul.id, { pozycjaXMM: x }));
      }
    };
    addEventListener("keydown", f);
    return () => removeEventListener("keydown", f);
  }, [p.id]);

  const grupy = useMemo(() => {
    const s = szukaj.toLowerCase();
    const g = new Map<string, ModulKatalogowy[]>();
    for (const k of katalog) {
      if (s && !`${k.name} ${k.tags.join(" ")}`.toLowerCase().includes(s)) continue;
      g.set(k.category, [...(g.get(k.category) ?? []), k]);
    }
    return [...g.entries()].sort((a, b) => Object.keys(KATEGORIE).indexOf(a[0]) - Object.keys(KATEGORIE).indexOf(b[0]));
  }, [katalog, szukaj]);

  const pw = analiza.projektWyceny;
  const uwagiSciany = analiza.walidacja.filter((u) => !u.modulId || p.moduly.find((m) => m.id === u.modulId)?.scianaId === sciana?.id);

  return (
    <div className="designer">
      {/* Elewacja — główny obszar roboczy */}
      <section style={{ display: "grid", gap: 16, minWidth: 0 }}>
        <div className="card">
          <div className="card-h" style={{ flexWrap: "wrap" }}>
            <div className="walls">
              {sciany.map((s) => (
                <button key={s.id} className={`btn small ${s.id === sciana?.id ? "primary" : ""}`} onClick={() => setScianaId(s.id)}>
                  {sciany.length > 1 && p.pomieszczenia.length > 1 ? `${s.pomieszczenie.nazwa} · ` : ""}{s.nazwa}
                </button>
              ))}
              <button className="btn small" onClick={() => wykonaj(() => api.dodajSciane(p.id, sciana?.pomieszczenie.id ?? p.pomieszczenia[0].id, { dlugoscMM: 2400 }))}>+ ściana</button>
              <button className="btn small" onClick={() => setImportDxf(true)} title="Wczytaj rzut pomieszczenia z pliku DXF">Import CAD</button>
            </div>
            <div className="seg" role="tablist" aria-label="Widok">
              {(["elewacja", "rzut", "3d"] as const).map((v) => (
                <button key={v} role="tab" aria-selected={widok === v} className={widok === v ? "on" : ""} onClick={() => setWidok(v)}>
                  {v === "elewacja" ? "Elewacja" : v === "rzut" ? "Rzut" : "3D"}
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: 4 }}>
              <button className="btn small" disabled={!wstecz.length} onClick={cofnij} title="Cofnij (Ctrl+Z)">↶</button>
              <button className="btn small" disabled={!naprzod.length} onClick={ponow} title="Ponów (Ctrl+Y)">↷</button>
            </div>
            <span className="spacer" />
            {sciana && (
              <div className="row">
                <Liczba label="Długość" value={sciana.dlugoscMM} onSave={(v) => wykonaj(() => api.zmienSciane(p.id, sciana.id, { dlugoscMM: v }))} />
                <Liczba label="Wysokość" value={sciana.wysokoscMM} onSave={(v) => wykonaj(() => api.zmienSciane(p.id, sciana.id, { wysokoscMM: v }))} />
              </div>
            )}
          </div>
          <div className="card-b">
            {sciana && widok === "rzut" && (
              <Rzut
                analiza={analiza}
                pomieszczenieId={sciana.pomieszczenie.id}
                scianaId={sciana.id}
                wybrany={wybrany}
                matMap={matMap}
                onSciana={setScianaId}
                onWybierz={(id) => {
                  setWybrany(id);
                  if (id) setPanel("wlasciwosci");
                }}
              />
            )}
            {sciana && widok === "3d" && (
              <Widok3D
                analiza={analiza}
                pomieszczenieId={sciana.pomieszczenie.id}
                scianaId={sciana.id}
                wybrany={wybrany}
                matMap={matMap}
                onWybierz={(id) => {
                  setWybrany(id);
                  if (id) setPanel("wlasciwosci");
                }}
              />
            )}
            {sciana && widok === "elewacja" ? (
              <Elewacja
                analiza={analiza}
                scianaId={sciana.id}
                dlugosc={sciana.dlugoscMM}
                wysokosc={sciana.wysokoscMM}
                matMap={matMap}
                blatId={sciana.pomieszczenie.materialBlatuId}
                wybrany={wybrany}
                onWybierz={(id) => {
                  setWybrany(id);
                  if (id) setPanel("wlasciwosci");
                }}
                onPrzesun={(id, x) => wykonaj(() => api.zmienModul(p.id, id, { pozycjaXMM: x }))}
                onUpusc={(katalogId, x) => {
                  const k = katalog.find((q) => q.id === katalogId);
                  if (k) dodaj(k, Math.max(0, Math.round(x - k.widthMM / 2)));
                }}
                onLuka={(x, szer, wiszacy) =>
                  wykonaj(async () => setWybrany((await api.wypelnijLuke(p.id, { scianaId: sciana.id, xMM: x, szerokoscMM: szer, wiszacy })).id), szer < 150 ? "Dodano blendę" : "Dodano szafkę dopasowaną")
                }
              />
            ) : !sciana ? (
              <div className="muted">Dodaj ścianę albo zaimportuj rzut z CAD, aby zacząć.</div>
            ) : null}
            <p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>
              {widok === "elewacja" && (
                <>Przeciągnij moduł z katalogu na ścianę albo kliknij, by dodać na koniec rzędu. Kliknij lukę <b>+</b>, aby ją domknąć (blenda &lt; 150 mm).
                Skróty: ←/→ przesuń 10 mm (Shift 100, Alt 1) · Del usuń · Ctrl+D duplikuj · Ctrl+Z / Ctrl+Y · Esc.</>
              )}
              {widok === "rzut" && <>Kliknij ścianę, aby ją wybrać do edycji w elewacji. Szafki wiszące — linia przerywana.</>}
              {widok === "3d" && <>Obracaj: lewy przycisk · przesuwaj: prawy · przybliżaj: kółko. Kliknij szafkę, aby ją zaznaczyć. Ściany od strony kamery są ukryte.</>}
            </p>
          </div>
        </div>

        {blad && <div className="alert blad">{blad}</div>}
        {importDxf && (
          <ImportDxf
            projektId={p.id}
            onZamknij={() => setImportDxf(false)}
            onGotowe={async () => {
              setImportDxf(false);
              wybierzNowe.current = true;
              setWidok("rzut");
              await odswiez();
              toast("Zaimportowano rzut z CAD");
            }}
          />
        )}
        <div className="toasts" aria-live="polite">
          {toasty.map((t) => <div key={t.id} className={`toast ${t.blad ? "blad" : ""}`}>{t.tekst}</div>)}
        </div>
        {uwagiSciany.length > 0 && (
          <div style={{ display: "grid", gap: 6 }}>
            {uwagiSciany.map((u, i) => (
              <div key={i} className={`alert ${u.poziom}`} onClick={() => u.modulId && setWybrany(u.modulId)} style={{ cursor: u.modulId ? "pointer" : undefined }}>
                {u.komunikat}
              </div>
            ))}
          </div>
        )}

        <div className="stats">
          <Stat v={pw.liczbaModulow} l="modułów" />
          <Stat v={`${mm(pw.metryBiezaceZabudowy)} mb`} l="zabudowy" />
          <Stat v={`${mm(pw.powierzchniaPlytM2)} m²`} l="płyt korpusu" />
          <Stat v={`${mm(pw.powierzchniaFrontowM2)} m²`} l="frontów" />
          <Stat v={analiza.formatki.length} l="formatek" />
          <Stat v={analiza.rozkroj.arkusze.length} l="arkuszy płyt" />
        </div>
      </section>

      {/* Panel boczny: katalog modułów / właściwości */}
      <aside className="card side">
        <div className="side-tabs" role="tablist">
          <button role="tab" aria-selected={panel === "katalog"} className={panel === "katalog" ? "on" : ""} onClick={() => setPanel("katalog")}>
            Moduły
          </button>
          <button role="tab" aria-selected={panel === "wlasciwosci"} className={panel === "wlasciwosci" ? "on" : ""} onClick={() => setPanel("wlasciwosci")}>
            {modul ? "Właściwości" : "Materiały"}
          </button>
        </div>
        {panel === "katalog" ? (
          <div className="side-body">
            <div className="side-search">
              <input className="input" placeholder="Szukaj: zlew, szuflady, 600…" value={szukaj} onChange={(e) => setSzukaj(e.target.value)} />
            </div>
            {grupy.map(([kat, lista]) => (
              <div key={kat} className="cat-group">
                <h3 style={{ margin: "6px 8px" }}>{KATEGORIE[kat] ?? kat}</h3>
                {lista.map((k) => (
                  <button
                    key={k.id}
                    className="cat-item"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/x-katalog", k.id);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => dodaj(k)}
                    title="Kliknij — na koniec rzędu. Przeciągnij na ścianę — w wybrane miejsce."
                  >
                    <MiniModul k={k} />
                    <span className="cat-name">{k.name.replace(/ \d+( × \d+)?$/, "")}</span>
                    <small className="num">{k.widthMM}×{k.heightMM}</small>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : modul ? (
          <Inspektor
            key={modul.id + p.rewizja}
            modul={modul}
            projektId={p.id}
            materialy={materialy}
            sciany={sciany}
            ostrzezenia={analiza.zbudowane.find((z) => z.modul.id === modul.id)?.ostrzezenia ?? []}
            onZmien={(d) => wykonaj(() => api.zmienModul(p.id, modul.id, d))}
            onDrzwiNaSzuflady={(liczba) => wykonaj(() => api.polecenieKonstrukcji(p.id, modul.id, { typ: "zamienDrzwiNaSzuflady", liczba }))}
            onSzufladyZaDrzwiami={(liczba, wysokoscMM) => wykonaj(() => api.polecenieKonstrukcji(p.id, modul.id, { typ: "dodajSzufladyZaDrzwiami", liczba, wysokoscMM }))}
            onUkrytaSzuflada={(sprzezona) => wykonaj(() => api.polecenieKonstrukcji(p.id, modul.id, { typ: "dodajUkrytaSzuflade", sprzezona }))}
            onPodzielWnetrze={(kierunek, liczba) => wykonaj(() => api.polecenieKonstrukcji(p.id, modul.id, { typ: "podzielWnetrze", kierunek, liczba }))}
            onPodzielFront={(kierunek, liczba, przegroda) => wykonaj(() => api.polecenieKonstrukcji(p.id, modul.id, { typ: "podzielFront", kierunek, liczba, przegroda }))}
            onPrzywrocStandardowa={() => wykonaj(() => api.przywrocKonstrukcjeStandardowa(p.id, modul.id))}
            onUsun={() => wykonaj(async () => { await api.usunModul(p.id, modul.id); setWybrany(null); })}
            onDuplikuj={() => wykonaj(async () => setWybrany((await api.duplikujModul(p.id, modul.id)).id))}
            onZamknij={() => setWybrany(null)}
          />
        ) : (
          sciana && (
            <MaterialyPomieszczenia
              key={sciana.pomieszczenie.id + p.rewizja}
              pomieszczenie={sciana.pomieszczenie}
              materialy={materialy}
              onZmien={(d) => wykonaj(() => api.zmienPomieszczenie(p.id, sciana.pomieszczenie.id, d))}
            />
          )
        )}
      </aside>
    </div>
  );
}

/** Miniatura frontu modułu z katalogu — ułatwia rozpoznanie typu bez czytania nazwy. */
function MiniModul({ k }: { k: ModulKatalogowy }) {
  const s = 30 / Math.max(k.widthMM, k.heightMM);
  const w = Math.max(6, k.widthMM * s);
  const h = Math.max(6, k.heightMM * s);
  const x = (32 - w) / 2;
  const y = (32 - h) / 2;
  const c = k.construction;
  const linie: JSX.Element[] = [];
  if (c === "drawers") [0.28, 0.62].forEach((f, i) => linie.push(<line key={i} x1={x} x2={x + w} y1={y + h * f} y2={y + h * f} />));
  else if (c === "oven" || c === "ovenTower") linie.push(<rect key="o" x={x + 2} y={y + h * 0.35} width={w - 4} height={Math.min(h * 0.3, 10)} rx={1} />);
  else if (k.widthMM > 600 && c !== "cargo" && c !== "liftUp" && c !== "topBox") linie.push(<line key="d" x1={x + w / 2} x2={x + w / 2} y1={y} y2={y + h} />);
  if (c === "openShelf") [0.33, 0.66].forEach((f, i) => linie.push(<line key={`p${i}`} x1={x} x2={x + w} y1={y + h * f} y2={y + h * f} strokeDasharray="2 1.5" />));
  return (
    <svg className="mini" viewBox="0 0 32 32" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth={1.2}>
        <rect x={x} y={y} width={w} height={h} rx={1} fill="var(--accent-soft)" />
        {linie}
      </g>
    </svg>
  );
}

function Stat({ v, l }: { v: string | number; l: string }) {
  return (
    <div className="stat">
      <b>{v}</b>
      <span>{l}</span>
    </div>
  );
}

function Liczba({ label, value, onSave, step = 1 }: { label: string; value: number; onSave: (v: number) => void; step?: number }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  const zapisz = () => {
    const n = Number(v.replace(",", "."));
    if (Number.isFinite(n) && n !== value) onSave(n);
    else setV(String(value));
  };
  return (
    <label className="field" style={{ minWidth: 0 }}>
      <label>{label}</label>
      <input
        className="input num"
        inputMode="decimal"
        step={step}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={zapisz}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        style={{ width: 96 }}
      />
    </label>
  );
}

// ---------- Elewacja ściany (SVG w milimetrach) ----------

interface ElewacjaProps {
  analiza: Analiza;
  scianaId: string;
  dlugosc: number;
  wysokosc: number;
  matMap: Map<string, Material>;
  blatId?: string;
  wybrany: string | null;
  onWybierz: (id: string | null) => void;
  onPrzesun: (id: string, x: number) => void;
  onUpusc: (katalogId: string, xMM: number) => void;
  onLuka: (xMM: number, szerokoscMM: number, wiszacy: boolean) => void;
}

/** Wolne odcinki w rzędzie dolnym lub wiszącym (słupki blokują oba rzędy). */
function luki(moduly: Modul[], dlugosc: number, wiszacy: boolean): { x: number; szer: number }[] {
  const wRzedzie = moduly.filter((m) => (m.pozycjaYMM >= 1000) === wiszacy || m.wysokoscMM > 1400);
  if (wiszacy && !moduly.some((m) => m.pozycjaYMM >= 1000)) return [];
  const odcinki = wRzedzie.map((m) => [m.pozycjaXMM, m.pozycjaXMM + m.szerokoscMM] as const).sort((a, b) => a[0] - b[0]);
  const wynik: { x: number; szer: number }[] = [];
  let x = 0;
  for (const [a, b] of odcinki) {
    if (a - x >= 10) wynik.push({ x, szer: a - x });
    x = Math.max(x, b);
  }
  if (dlugosc - x >= 10) wynik.push({ x, szer: dlugosc - x });
  return wynik;
}

function Elewacja({ analiza, scianaId, dlugosc, wysokosc, matMap, blatId, wybrany, onWybierz, onPrzesun, onUpusc, onLuka }: ElewacjaProps) {
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ id: string; start: number; x0: number; x: number } | null>(null);
  const [cel, setCel] = useState<number | null>(null);
  const p = analiza.projekt;
  const pom = p.pomieszczenia.find((r) => r.sciany.some((s) => s.id === scianaId));
  const zbudowane = analiza.zbudowane.filter((z) => z.modul.scianaId === scianaId);
  const M = 160;
  const Y = (y: number) => wysokosc - y; // oś Y w górę

  const doMM = (clientX: number) => {
    const s = svg.current!;
    const pt = s.createSVGPoint();
    pt.x = clientX;
    pt.y = 0;
    return pt.matrixTransform(s.getScreenCTM()!.inverse()).x;
  };

  const przyciagnij = (id: string, x: number, w: number) => {
    const krawedzie = [0, dlugosc, ...zbudowane.filter((z) => z.modul.id !== id).flatMap((z) => [z.modul.pozycjaXMM, z.modul.pozycjaXMM + z.modul.szerokoscMM])];
    let best = Math.round(x / 5) * 5;
    let d = 25;
    for (const k of krawedzie) {
      if (Math.abs(x - k) < d) { d = Math.abs(x - k); best = k; }
      if (Math.abs(x + w - k) < d) { d = Math.abs(x + w - k); best = k - w; }
    }
    return Math.max(0, best);
  };

  const kolorMat = (id?: string, fallback = "#ddd") => (id && matMap.get(id)?.kolorHEX) || fallback;

  return (
    <svg
      ref={svg}
      className="elev"
      viewBox={`${-M} ${-M * 1.6} ${dlugosc + 2 * M} ${wysokosc + M * 2.6}`}
      onPointerMove={(e) => {
        if (!drag) return;
        const z = zbudowane.find((q) => q.modul.id === drag.id)!;
        setDrag({ ...drag, x: przyciagnij(drag.id, drag.x0 + doMM(e.clientX) - drag.start, z.modul.szerokoscMM) });
      }}
      onPointerUp={() => {
        if (drag && Math.abs(drag.x - drag.x0) > 0.5) onPrzesun(drag.id, drag.x);
        setDrag(null);
      }}
      onPointerDown={(e) => e.target === e.currentTarget && onWybierz(null)}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("application/x-katalog")) return;
        e.preventDefault();
        setCel(doMM(e.clientX));
      }}
      onDragLeave={() => setCel(null)}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("application/x-katalog");
        setCel(null);
        if (id) {
          e.preventDefault();
          onUpusc(id, doMM(e.clientX));
        }
      }}
    >
      <defs>
        <pattern id="kreski" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="40" stroke="var(--line-strong)" strokeWidth="6" />
        </pattern>
      </defs>
      <rect x={0} y={0} width={dlugosc} height={wysokosc} fill="var(--wall)" stroke="var(--line-strong)" strokeWidth={4} onPointerDown={() => onWybierz(null)} />
      <rect x={-M} y={wysokosc} width={dlugosc + 2 * M} height={40} fill="url(#kreski)" />
      <line x1={-M} x2={dlugosc + M} y1={wysokosc} y2={wysokosc} stroke="var(--floor)" strokeWidth={8} />
      <Wymiar x1={0} x2={dlugosc} y={-M * 1.1} tekst={`${mm(dlugosc)}`} gruby />
      {cel !== null && <line x1={cel} x2={cel} y1={0} y2={wysokosc} stroke="var(--accent)" strokeWidth={8} strokeDasharray="30 20" pointerEvents="none" />}

      {/* Luki w rzędach — klik domyka blendą lub szafką dopasowaną */}
      {!drag &&
        ([false, true] as const).flatMap((wiszacy) =>
          luki(zbudowane.map((z) => z.modul), dlugosc, wiszacy).map((l) => {
            const yMid = wiszacy ? Y(1400 + 360) : Y(100 + 360);
            return (
              <g key={`${wiszacy}-${l.x}`} className="luka" onClick={() => onLuka(l.x, l.szer, wiszacy)} style={{ cursor: "pointer" }}>
                <title>{`Luka ${mm(l.szer)} mm — kliknij, aby domknąć ${l.szer < 150 ? "blendą" : "szafką dopasowaną"}`}</title>
                <rect x={l.x} y={yMid - 360} width={l.szer} height={720} fill="var(--accent)" opacity={0.06} stroke="var(--accent)" strokeDasharray="16 12" strokeWidth={3} />
                <line x1={l.x} x2={l.x + l.szer} y1={yMid} y2={yMid} stroke="var(--accent)" strokeWidth={3} />
                <circle cx={l.x + l.szer / 2} cy={yMid} r={Math.min(46, l.szer / 2 - 2)} fill="var(--accent)" />
                {l.szer >= 60 && <text x={l.x + l.szer / 2} y={yMid + 18} textAnchor="middle" fontSize={56} fill="var(--accent-text)" fontWeight={700}>+</text>}
                {l.szer >= 160 && <text x={l.x + l.szer / 2} y={yMid - 70} textAnchor="middle" fontSize={52} fill="var(--accent)">{mm(l.szer)}</text>}
              </g>
            );
          }),
        )}

      {zbudowane.map(({ modul: m, elementy }) => {
        const x = drag?.id === m.id ? drag.x : m.pozycjaXMM;
        const sel = wybrany === m.id;
        const frontCol = kolorMat(m.materialFrontuId ?? pom?.materialFrontuId, "#e8e2d8");
        const korpCol = kolorMat(m.materialKorpusuId ?? pom?.materialKorpusuId, "#f4f3ed");
        const wiszacy = m.pozycjaYMM >= 1000;
        const bezKorpusu = m.konstrukcja === "dishwasherFront";
        return (
          <g
            key={m.id}
            style={{ cursor: drag?.id === m.id ? "grabbing" : "grab" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.currentTarget.ownerSVGElement as SVGSVGElement).setPointerCapture(e.pointerId);
              onWybierz(m.id);
              setDrag({ id: m.id, start: doMM(e.clientX), x0: m.pozycjaXMM, x: m.pozycjaXMM });
            }}
          >
            {/* Cokół / nogi */}
            {m.konfiguracja.nogi && <rect x={x + 5} y={Y(m.pozycjaYMM)} width={m.szerokoscMM - 10} height={m.pozycjaYMM} fill="var(--floor)" opacity={0.55} />}
            {/* Korpus */}
            {!bezKorpusu && <rect x={x} y={Y(m.pozycjaYMM + m.wysokoscMM)} width={m.szerokoscMM} height={m.wysokoscMM} fill={korpCol} stroke="#6b5a47" strokeWidth={3} />}
            {/* Fronty */}
            {elementy
              .filter((e) => e.rola === "front" || e.rola === "filler")
              .map((e) => {
                const fx = x + e.x;
                const fy = Y(m.pozycjaYMM + e.y + e.wys);
                const drzwi = e.kod.startsWith("FRONT-D");
                const szuflada = e.kod.startsWith("FRONT-SZ");
                const lewy = drzwi && Number(e.kod.slice(-2)) % 2 === 1;
                return (
                  <g key={e.kod}>
                    <rect x={fx} y={fy} width={e.szer} height={e.wys} fill={frontCol} stroke="#3b3128" strokeWidth={3} />
                    {drzwi && (
                      <polyline
                        points={lewy ? `${fx + e.szer},${fy} ${fx},${fy + e.wys / 2} ${fx + e.szer},${fy + e.wys}` : `${fx},${fy} ${fx + e.szer},${fy + e.wys / 2} ${fx},${fy + e.wys}`}
                        fill="none"
                        stroke="#3b3128"
                        strokeWidth={2}
                        strokeDasharray="14 10"
                        opacity={0.55}
                      />
                    )}
                    {szuflada && <line x1={fx + e.szer * 0.35} x2={fx + e.szer * 0.65} y1={fy + 30} y2={fy + 30} stroke="#3b3128" strokeWidth={8} strokeLinecap="round" />}
                    {e.kod === "FRONT-U01" && <line x1={fx + e.szer * 0.35} x2={fx + e.szer * 0.65} y1={fy + e.wys - 30} y2={fy + e.wys - 30} stroke="#3b3128" strokeWidth={8} strokeLinecap="round" />}
                  </g>
                );
              })}
            {/* Blat */}
            {m.konfiguracja.blat && (
              <rect x={x} y={Y(m.pozycjaYMM + m.wysokoscMM + 38)} width={m.szerokoscMM} height={38} fill={kolorMat(blatId, "#a98f6e")} stroke="#3b3128" strokeWidth={2} />
            )}
            {/* Zaznaczenie */}
            {sel && (
              <rect
                x={x - 12}
                y={Y(m.pozycjaYMM + m.wysokoscMM + (m.konfiguracja.blat ? 38 : 0)) - 12}
                width={m.szerokoscMM + 24}
                height={m.wysokoscMM + (m.konfiguracja.blat ? 38 : 0) + 24}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={10}
                rx={8}
              />
            )}
            <Wymiar x1={x} x2={x + m.szerokoscMM} y={wiszacy ? Y(m.pozycjaYMM + m.wysokoscMM) - 60 : wysokosc + 110} tekst={mm(m.szerokoscMM)} />
          </g>
        );
      })}
    </svg>
  );
}

function Wymiar({ x1, x2, y, tekst, gruby }: { x1: number; x2: number; y: number; tekst: string; gruby?: boolean }) {
  const s = gruby ? 5 : 3;
  return (
    <g stroke="var(--muted)" fill="var(--muted)" pointerEvents="none">
      <line x1={x1} x2={x2} y1={y} y2={y} strokeWidth={s} />
      <line x1={x1} x2={x1} y1={y - 25} y2={y + 25} strokeWidth={s} />
      <line x1={x2} x2={x2} y1={y - 25} y2={y + 25} strokeWidth={s} />
      <text x={(x1 + x2) / 2} y={y - 18} textAnchor="middle" fontSize={gruby ? 70 : 56} stroke="none" style={{ fontVariantNumeric: "tabular-nums" }}>
        {tekst}
      </text>
    </g>
  );
}

// ---------- Inspektor modułu ----------

interface InspektorProps {
  modul: Modul;
  projektId: string;
  materialy: Material[];
  sciany: { id: string; nazwa: string }[];
  ostrzezenia: string[];
  onZmien: (d: Record<string, unknown>) => void;
  onDrzwiNaSzuflady: (liczba: number) => void;
  onSzufladyZaDrzwiami: (liczba: number, wysokoscMM: number) => void;
  onUkrytaSzuflada: (sprzezona: boolean) => void;
  onPodzielWnetrze: (kierunek: "pion" | "poziom", liczba: number) => void;
  onPodzielFront: (kierunek: "pion" | "poziom", liczba: number, przegroda: boolean) => void;
  onPrzywrocStandardowa: () => void;
  onUsun: () => void;
  onDuplikuj: () => void;
  onZamknij: () => void;
}

function Inspektor({ modul: m, projektId, materialy, sciany, ostrzezenia, onZmien, onDrzwiNaSzuflady, onSzufladyZaDrzwiami, onUkrytaSzuflada, onPodzielWnetrze, onPodzielFront, onPrzywrocStandardowa, onUsun, onDuplikuj, onZamknij }: InspektorProps) {
  const k = m.konfiguracja;
  const konf = (d: Partial<typeof k>) => onZmien({ konfiguracja: d });
  const [nazwa, setNazwa] = useState(m.nazwa);
  const [liczbaSzufladEdytor, setLiczbaSzufladEdytor] = useState(3);
  const [liczbaWewnetrznych, setLiczbaWewnetrznych] = useState(2);
  const [strefaWewnetrznej, setStrefaWewnetrznej] = useState(160);
  const [liczbaKomor, setLiczbaKomor] = useState(2);
  const [liczbaSkrzydel, setLiczbaSkrzydel] = useState(2);
  const [zPrzegroda, setZPrzegroda] = useState(true);
  const [systemy, setSystemy] = useState<Awaited<ReturnType<typeof api.systemySzuflad>>>([]);
  useEffect(() => {
    api.systemySzuflad().then(setSystemy).catch(() => setSystemy([]));
  }, []);
  const plyty = materialy.filter((x) => x.typ === "plytaLaminowana" || x.typ === "mdf");
  const fronty = materialy.filter((x) => x.typ === "plytaLaminowana" || x.typ === "front" || x.typ === "mdf");

  return (
    <>
      <div className="card-h">
        <h2 style={{ flex: 1 }}>Moduł</h2>
        <button className="btn small" onClick={onZamknij} aria-label="Zamknij">✕</button>
      </div>
      <div className="card-b" style={{ display: "grid", gap: 12 }}>
        <div className="field">
          <label>Nazwa</label>
          <input className="input" value={nazwa} onChange={(e) => setNazwa(e.target.value)} onBlur={() => nazwa !== m.nazwa && onZmien({ nazwa })} />
        </div>
        <div className="row">
          <span className="badge">{m.kategoria}</span>
          <span className="badge">{m.konstrukcja}</span>
          {m.katalogId && <span className="badge accent">{m.katalogId}</span>}
        </div>
        <div className="grid3">
          <Liczba label="Szer." value={m.szerokoscMM} onSave={(v) => onZmien({ szerokoscMM: v })} />
          <Liczba label="Wys." value={m.wysokoscMM} onSave={(v) => onZmien({ wysokoscMM: v })} />
          <Liczba label="Głęb." value={m.glebokoscMM} onSave={(v) => onZmien({ glebokoscMM: v })} />
          <Liczba label="Pozycja X" value={m.pozycjaXMM} onSave={(v) => onZmien({ pozycjaXMM: v })} />
          <Liczba label="Pozycja Y" value={m.pozycjaYMM} onSave={(v) => onZmien({ pozycjaYMM: v })} />
        </div>
        {sciany.length > 1 && (
          <div className="field">
            <label>Ściana</label>
            <select className="input" value={m.scianaId} onChange={(e) => onZmien({ scianaId: e.target.value })}>
              {sciany.map((s) => <option key={s.id} value={s.id}>{s.nazwa}</option>)}
            </select>
          </div>
        )}

        <h3>Konfiguracja</h3>
        <div className="field">
          <label>Front</label>
          <select className="input" value={k.typFrontu} onChange={(e) => konf({ typFrontu: e.target.value as typeof k.typFrontu })}>
            <option value="drzwi">Drzwi</option>
            <option value="szuflady">Szuflady</option>
            <option value="uchylny">Uchylny (podnośnik)</option>
            <option value="panelAGD">Panel AGD</option>
            <option value="brak">Brak (otwarty)</option>
          </select>
        </div>
        <div className="grid3">
          <Liczba label="Drzwi" value={k.liczbaDrzwi} onSave={(v) => konf({ liczbaDrzwi: v })} />
          <Liczba label="Szuflady" value={k.liczbaSzuflad} onSave={(v) => konf({ liczbaSzuflad: v })} />
          <Liczba label="Półki" value={k.liczbaPolek} onSave={(v) => konf({ liczbaPolek: v })} />
        </div>
        <div className="grid2">
          <label className="check"><input type="checkbox" checked={k.plecy} onChange={(e) => konf({ plecy: e.target.checked })} /> Plecy HDF</label>
          <label className="check"><input type="checkbox" checked={k.blat} onChange={(e) => konf({ blat: e.target.checked })} /> Blat</label>
          <label className="check"><input type="checkbox" checked={k.nogi} onChange={(e) => konf({ nogi: e.target.checked })} /> Nogi + cokół</label>
        </div>
        <div className="grid2">
          <Liczba label="Cargo [kpl.]" value={k.liczbaCargo} onSave={(v) => konf({ liczbaCargo: v })} />
          <Liczba label="Podziałka szuflad [mm]" value={k.wysokoscSzufladyMM ?? 0} onSave={(v) => konf({ wysokoscSzufladyMM: v > 0 ? v : (null as unknown as undefined) })} />
        </div>
        {(k.liczbaSzuflad > 0 || k.typFrontu === "szuflady" || (m.drzewo?.wysuwy.length ?? 0) > 0) && (
          <div className="grid2">
            <div className="field">
              <label>System szuflad</label>
              <select
                className="input"
                value={k.szufladySystemowe ? k.profilSzuflad ?? "" : "plyta"}
                onChange={(e) =>
                  e.target.value === "plyta"
                    ? konf({ szufladySystemowe: false })
                    : konf({ szufladySystemowe: true, profilSzuflad: e.target.value || (null as unknown as undefined), wariantBokuSzuflady: null as unknown as undefined })
                }
              >
                <option value="plyta">Skrzynka z płyty na prowadnicach</option>
                <option value="">System jak w ustawieniach</option>
                {systemy.map((s) => <option key={s.id} value={s.id}>{s.producent === "AMIX" ? "Amix" : s.producent === "BLUM" ? "Blum" : s.producent} {s.system}</option>)}
              </select>
            </div>
            {k.szufladySystemowe && (
              <div className="field">
                <label>Wysokość boku</label>
                <select className="input" value={k.wariantBokuSzuflady ?? ""} onChange={(e) => konf({ wariantBokuSzuflady: e.target.value || (null as unknown as undefined) })}>
                  <option value="">dobór do frontu</option>
                  {(systemy.find((s) => s.id === k.profilSzuflad)?.warianty ?? []).map((w) => <option key={w.wariant} value={w.wariant}>{w.wariant} — plecy {w.plecyWys} mm</option>)}
                </select>
              </div>
            )}
          </div>
        )}
        {k.typFrontu === "drzwi" && k.liczbaSzuflad > 0 && <div className="muted" style={{ fontSize: 12 }}>Szuflady pod drzwiami: {k.liczbaSzuflad} × {k.wysokoscSzufladyMM ?? 360} mm, nad nimi półka stała i drzwi.</div>}
        {m.konstrukcja === "blindCorner" && (
          <div className="grid2">
            <div className="field">
              <label>Drzwi narożnika</label>
              <select className="input" value={k.stronaDrzwiNaroznika ?? "prawa"} onChange={(e) => konf({ stronaDrzwiNaroznika: e.target.value as "lewa" | "prawa" })}>
                <option value="lewa">Po lewej</option>
                <option value="prawa">Po prawej</option>
              </select>
            </div>
            <Liczba label="Szer. drzwi [mm]" value={k.szerokoscDrzwiNaroznikaMM ?? 450} onSave={(v) => konf({ szerokoscDrzwiNaroznikaMM: v })} />
            <label className="check"><input type="checkbox" checked={k.systemNarozny === "lemans"} onChange={(e) => konf({ systemNarozny: e.target.checked ? "lemans" : undefined, ...(e.target.checked ? { liczbaPolek: 0 } : {}) })} /> LeMans II (2 nerki)</label>
          </div>
        )}

        <h3>Konstrukcja (silnik)</h3>
        {m.drzewo && (
          <div className="alert info">
            Konstrukcja z edytora — pola półek, drzwi i szuflad powyżej nie są używane.{" "}
            <button className="btn small" onClick={onPrzywrocStandardowa}>Przywróć standardową</button>
          </div>
        )}
        {(m.drzewo ? JSON.stringify(m.drzewo.fronty).includes('"typ":"drzwi"') : k.typFrontu === "drzwi" && k.liczbaDrzwi > 0) && (
          <div className="row">
            <Liczba label="Szuflad" value={liczbaSzufladEdytor} onSave={(v) => setLiczbaSzufladEdytor(Math.max(1, Math.min(8, v)))} />
            <button className="btn" onClick={() => onDrzwiNaSzuflady(liczbaSzufladEdytor)}>Zamień drzwi na szuflady</button>
          </div>
        )}
        {(m.drzewo ? JSON.stringify(m.drzewo.fronty).includes('"typ":"drzwi"') : k.typFrontu === "drzwi" && k.liczbaDrzwi > 0) && (
          <div className="row">
            <Liczba label="Szuflad wewn." value={liczbaWewnetrznych} onSave={(v) => setLiczbaWewnetrznych(Math.max(1, Math.min(6, v)))} />
            <Liczba label="Strefa [mm]" value={strefaWewnetrznej} onSave={(v) => setStrefaWewnetrznej(Math.max(100, v))} />
            <button className="btn" onClick={() => onSzufladyZaDrzwiami(liczbaWewnetrznych, strefaWewnetrznej)}>Dodaj szuflady za drzwiami</button>
          </div>
        )}
        {(m.drzewo ? JSON.stringify(m.drzewo.fronty).includes('"typ":"drzwi"') : k.typFrontu === "drzwi" && k.liczbaDrzwi === 1) && (
          <div className="row">
            <Liczba label="Skrzydeł" value={liczbaSkrzydel} onSave={(v) => setLiczbaSkrzydel(Math.max(2, Math.min(4, v)))} />
            <label className="check"><input type="checkbox" checked={zPrzegroda} onChange={(e) => setZPrzegroda(e.target.checked)} /> z płytą na podziale</label>
            <button className="btn" onClick={() => onPodzielFront("pion", liczbaSkrzydel, zPrzegroda)}>Skrzydła obok siebie</button>
            <button className="btn" onClick={() => onPodzielFront("poziom", liczbaSkrzydel, zPrzegroda)}>Jedno nad drugim</button>
          </div>
        )}
        {(m.drzewo ? m.drzewo.wysuwy.some((w) => w.powiazanie === "zFrontem") : k.typFrontu === "szuflady" && k.liczbaSzuflad > 0) && (
          <div className="row">
            <button className="btn" onClick={() => onUkrytaSzuflada(false)}>Szuflada ukryta za frontem</button>
            <button className="btn" onClick={() => onUkrytaSzuflada(true)}>…z zabierakiem</button>
          </div>
        )}
        {!["filler", "dishwasherFront"].includes(m.konstrukcja) && (
          <div className="row">
            <Liczba label="Komór" value={liczbaKomor} onSave={(v) => setLiczbaKomor(Math.max(2, Math.min(6, v)))} />
            <button className="btn" onClick={() => onPodzielWnetrze("pion", liczbaKomor)}>Przegrody pionowe</button>
            <button className="btn" onClick={() => onPodzielWnetrze("poziom", liczbaKomor)}>Półki stałe</button>
          </div>
        )}

        <h3>Materiały (nadpisanie)</h3>
        <WyborMaterialu label="Korpus" value={m.materialKorpusuId ?? ""} lista={plyty} pusty="jak w pomieszczeniu" onChange={(v) => onZmien({ materialKorpusuId: v })} />
        <WyborMaterialu label="Front" value={m.materialFrontuId ?? ""} lista={fronty} pusty="jak w pomieszczeniu" onChange={(v) => onZmien({ materialFrontuId: v })} />

        {ostrzezenia.filter((o) => !(m.drzewo && o.startsWith("Konstrukcja z edytora"))).map((o, i) => <div key={i} className="alert ostrzezenie">{o}</div>)}

        <div className="row">
          <button className="btn" onClick={onDuplikuj}>Duplikuj</button>
          <button className="btn danger" onClick={onUsun}>Usuń</button>
          <a className="btn" href={`/api/projekty/${projektId}/dokumentacja.pdf?modul=${m.id}`} target="_blank" rel="noreferrer">
            Dokumentacja szafki
          </a>
        </div>
      </div>
    </>
  );
}

function WyborMaterialu({ label, value, lista, pusty, onChange }: { label: string; value: string; lista: Material[]; pusty?: string; onChange: (v: string) => void }) {
  const [catalog, setCatalog] = useState(false);
  const [added, setAdded] = useState<Material | null>(null);
  const options = added && !lista.some(x => x.id === added.id) ? [...lista, added] : lista;
  const m = options.find((x) => x.id === value);
  return (
    <div className="field">
      <label>
        {label} {m && <span className="swatch" style={{ background: m.kolorHEX, backgroundImage: m.zdjecieURL ? `url("${m.zdjecieURL}")` : undefined, backgroundSize: "cover" }} />}
      </label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {pusty !== undefined && <option value="">— {pusty} —</option>}
        {options.map((x) => (
          <option key={x.id} value={x.id}>
            {x.producent !== "Stolarnia" ? `${x.producent} ` : ""}{x.nazwa}
          </option>
        ))}
      </select>
      {!label.toLowerCase().includes("blat") && <button className="btn" onClick={() => setCatalog(true)}>Wybierz z katalogu dekorów</button>}
      {catalog && <div className="decor-overlay"><section className="decor-dialog" role="dialog" aria-modal="true" aria-label="Katalog dekorów">
        <button autoFocus className="btn" onClick={() => setCatalog(false)}>Zamknij katalog</button>
        <DecorCatalog onAdded={m => { setAdded(m); onChange(m.id); setCatalog(false); }} />
      </section></div>}
    </div>
  );
}

function MaterialyPomieszczenia({
  pomieszczenie,
  materialy,
  onZmien,
}: {
  pomieszczenie: { nazwa: string; materialKorpusuId: string; materialFrontuId: string; materialBlatuId?: string };
  materialy: Material[];
  onZmien: (d: Record<string, string>) => void;
}) {
  const plyty = materialy.filter((x) => x.typ === "plytaLaminowana" || x.typ === "mdf");
  const fronty = materialy.filter((x) => x.typ === "plytaLaminowana" || x.typ === "front" || x.typ === "mdf");
  const blaty = materialy.filter((x) => x.typ.startsWith("blat"));
  return (
    <>
      <div className="card-h"><h2>Materiały: {pomieszczenie.nazwa}</h2></div>
      <div className="card-b" style={{ display: "grid", gap: 12 }}>
        <WyborMaterialu label="Korpus" value={pomieszczenie.materialKorpusuId} lista={plyty} onChange={(v) => onZmien({ materialKorpusuId: v })} />
        <WyborMaterialu label="Fronty" value={pomieszczenie.materialFrontuId} lista={fronty} onChange={(v) => onZmien({ materialFrontuId: v })} />
        <WyborMaterialu label="Blat" value={pomieszczenie.materialBlatuId ?? ""} lista={blaty} pusty="wg wariantu wyceny" onChange={(v) => onZmien({ materialBlatuId: v })} />
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>Wybierz moduł na elewacji, aby edytować jego wymiary i konfigurację.</p>
      </div>
    </>
  );
}
