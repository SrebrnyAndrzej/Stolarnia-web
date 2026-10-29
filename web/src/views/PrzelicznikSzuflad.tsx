import { useEffect, useState } from "react";
import type { WynikPrzelicznika } from "../../../src/core/catalog/drawers";
import type { MontazSzuflad } from "../../../src/core/kalkulator-szuflad";

interface Odpowiedz {
  LW: number;
  NL: number;
  glebokoscUzytkowa?: number;
  wyniki: WynikPrzelicznika[];
  warianty: Record<string, { wariant: string; plecyWys: number }[]>;
  montaz?: MontazSzuflad;
}

const OPIS_WERYFIKACJI: Record<string, string> = {
  cut_dimensions_visually_checked: "sprawdzone z rysunkiem",
  visually_checked: "sprawdzone z rysunkiem",
  text_extracted_same_layout: "z tekstu karty (układ jak strona sprawdzona)",
};

// Przelicznik dna i pleców szuflad Amix / GTV / Blum — wymiary przycięcia z kart producentów, obok siebie.
export function PrzelicznikSzuflad() {
  const [tryb, setTryb] = useState<"korpus" | "lw">("korpus");
  const [szer, setSzer] = useState("600");
  const [bok, setBok] = useState("18");
  const [lw, setLw] = useState("564");
  const [gl, setGl] = useState("560");
  const [nl, setNl] = useState("");
  const [front, setFront] = useState("");
  const [scianka, setScianka] = useState<"drewniana" | "stalowa">("drewniana");
  const [wybrane, setWybrane] = useState<Record<string, string>>({});
  const [dane, setDane] = useState<Odpowiedz | null>(null);
  const [nadpisane, setNadpisane] = useState<Record<string, WynikPrzelicznika>>({});
  const [blad, setBlad] = useState("");
  const [liczMontaz, setLiczMontaz] = useState(false);
  const [liczba, setLiczba] = useState("2");
  const [szczelina, setSzczelina] = useState("3");
  const [dolna, setDolna] = useState("3");
  const [wysokosc, setWysokosc] = useState("698");
  const [wewnetrzny, setWewnetrzny] = useState(false);
  const [gruboscFrontu, setGruboscFrontu] = useState("18");
  const [liczenie, setLiczenie] = useState(true);
  const [ponow, setPonow] = useState(0);

  const parametry = () => {
    const q = new URLSearchParams();
    if (tryb === "korpus") {
      q.set("szerokoscKorpusu", szer);
      q.set("gruboscBoku", bok);
    } else q.set("LW", lw);
    if (nl.trim()) q.set("NL", nl);
    else q.set("glebokoscKorpusu", gl);
    if (front.trim()) q.set("wysokoscFrontu", front);
    q.set("sciankaTylna", scianka);
    if (liczMontaz) {
      q.set("liczbaSzuflad", liczba.trim() || "NaN");
      q.set("szczelinaFrontow", szczelina.trim() || "NaN");
      q.set("dolnaProwadnica", dolna.trim() || "NaN");
      if (wysokosc.trim()) q.set("wysokoscWewnetrzna", wysokosc);
      q.set("frontWewnetrzny", String(wewnetrzny));
      if (wewnetrzny) q.set("gruboscFrontu", gruboscFrontu.trim() || "NaN");
    }
    return q;
  };

  useEffect(() => {
    const controller = new AbortController();
    let aktualne = true;
    setLiczenie(true);
    setBlad("");
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/przelicznik-szuflad?${parametry()}`, { signal: controller.signal });
        const j = await r.json();
        if (!r.ok) throw new Error(j.blad ?? "Błąd przelicznika");
        // Warianty wybrane ręcznie w wierszach
        const nowe: Record<string, WynikPrzelicznika> = {};
        for (const [id, w] of Object.entries(wybrane)) {
          const q = parametry();
          q.set("profilId", id);
          q.set("wariant", w);
          const rr = await fetch(`/api/przelicznik-szuflad?${q}`, { signal: controller.signal });
          const wynik = await rr.json();
          if (!rr.ok) throw new Error(wynik.blad ?? "Błąd przeliczenia wariantu");
          nowe[id] = wynik.wyniki[0];
        }
        if (aktualne) { setDane(j); setNadpisane(nowe); }
      } catch (e) {
        if (aktualne) { setBlad((e as Error).message); setDane(null); }
      } finally {
        if (aktualne) setLiczenie(false);
      }
    }, 300);
    return () => { aktualne = false; controller.abort(); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tryb, szer, bok, lw, gl, nl, front, scianka, wybrane, liczMontaz, liczba, szczelina, dolna, wysokosc, wewnetrzny, gruboscFrontu, ponow]);

  const pole = (etykieta: string, v: string, set: (x: string) => void, placeholder?: string) => (
    <label className="field" style={{ minWidth: 130 }}>
      <span>{etykieta}</span>
      <input className="input num" inputMode="decimal" value={v} placeholder={placeholder} onChange={(e) => set(e.target.value.replace(",", "."))} />
    </label>
  );

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <h2 style={{ margin: 0 }}>Kalkulator szuflad i prowadnic</h2>
      <p className="muted" style={{ margin: 0 }}>
        Wymiary przycięcia dna i pleców dla systemów Amix, GTV i Blum — z kart producentów, ze stroną źródłową. LW to rzeczywiste światło korpusu w miejscu prowadnic, NL — długość prowadnicy.
      </p>
      <div className="row" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
        <div className="seg" role="group" aria-label="Sposób podania szerokości">
          <button aria-pressed={tryb === "korpus"} className={tryb === "korpus" ? "on" : ""} onClick={() => setTryb("korpus")}>Szerokość korpusu</button>
          <button aria-pressed={tryb === "lw"} className={tryb === "lw" ? "on" : ""} onClick={() => setTryb("lw")}>Światło LW</button>
        </div>
        {tryb === "korpus" ? <>{pole("Szerokość korpusu [mm]", szer, setSzer)}{pole("Grubość boku [mm]", bok, setBok)}</> : pole("LW [mm]", lw, setLw)}
        {pole("Głębokość korpusu [mm]", gl, setGl)}
        {pole("NL [mm] (opcjonalnie)", nl, setNl, dane ? `auto: ${dane.NL}` : "auto")}
        {pole("Wysokość frontu [mm]", front, setFront, "dobór wariantu")}
        <label className="field">
          <span>Ścianka tylna</span>
          <select className="input" value={scianka} onChange={(e) => setScianka(e.target.value as "drewniana" | "stalowa")}>
            <option value="drewniana">drewniana</option>
            <option value="stalowa">stalowa (TANDEMBOX)</option>
          </select>
        </label>
      </div>
      <div className="card calculator-mount">
        <label className="calculator-check"><input type="checkbox" checked={liczMontaz} onChange={(e) => setLiczMontaz(e.target.checked)} />Oblicz rozstaw prowadnic dla równych frontów</label>
        {liczMontaz && <>
          <div className="row" style={{ flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
            {pole("Liczba szuflad", liczba, setLiczba)}
            {pole("Szczelina między frontami [mm]", szczelina, setSzczelina)}
            {pole("Dolna prowadnica nad wieńcem [mm]", dolna, setDolna)}
            {pole("Wysokość światła [mm] (opcjonalnie)", wysokosc, setWysokosc)}
          </div>
          <p className="muted">Wpisz wysokość frontu powyżej. Wysokości mierzymy od górnej powierzchni wieńca dolnego do dolnej krawędzi prowadnicy, nie do osi wkrętów.</p>
          <label className="calculator-check"><input type="checkbox" checked={wewnetrzny} onChange={(e) => setWewnetrzny(e.target.checked)} />Front z płyty wewnątrz, zlicowany z korpusem</label>
          {wewnetrzny && pole("Grubość frontu [mm]", gruboscFrontu, setGruboscFrontu)}
        </>}
      </div>
      <div role="status" aria-live="polite" style={{ minHeight: 22 }}>{liczenie ? "Przeliczanie…" : blad ? "Popraw dane lub ponów obliczenia." : "Wyniki w mm."}</div>
      {blad && <div className="alert blad" role="alert">{blad} <button className="btn" onClick={() => setPonow((n) => n + 1)}>Przelicz ponownie</button></div>}
      {dane && !liczenie && !blad && (
        <>
          {dane.montaz && <div className="card calculator-mount">
            <h3>Wysokości montażu prowadnic</h3>
            <p>{dane.montaz.baza}</p>
            <ol className="calculator-runners">{dane.montaz.prowadnice.map((p) => <li key={p.numer}>Szuflada {p.numer} od dołu: <strong className="num">{p.dolnaKrawedzMM} mm</strong></li>)}</ol>
            <p>Rozstaw: <b className="num">{dane.montaz.skokMM} mm</b>. Dodatkowe cofnięcie prowadnic w głąb względem montażu standardowego: <b className="num">{dane.montaz.cofniecieMM} mm</b>.</p>
            {dane.montaz.uwagi.map((u) => <p className="muted" key={u}>{u}</p>)}
          </div>}
          <div className="muted">
            LW = <b className="num">{dane.LW} mm</b> · NL = <b className="num">{dane.NL} mm</b>
            {dane.glebokoscUzytkowa !== undefined && !nl && <> (dobrane do głębokości użytkowej {dane.glebokoscUzytkowa} mm)</>}
          </div>
          <div className="card t-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>System</th><th>Wysokość boku</th><th className="r">Płyta</th><th>Dno (szer. × gł.)</th><th>Plecy (szer. × wys.)</th><th>Źródło</th>
                </tr>
              </thead>
              <tbody>
                {dane.wyniki.map((bazowy) => {
                  const w = nadpisane[bazowy.profilId] ?? bazowy;
                  return (
                    <tr key={w.profilId}>
                      <td><b>{w.producent === "AMIX" ? "Amix" : w.producent === "BLUM" ? "Blum" : w.producent}</b> {w.system}</td>
                      <td>
                        <select className="input" value={wybrane[w.profilId] ?? ""} onChange={(e) => setWybrane((x) => { const n = { ...x }; if (e.target.value) n[w.profilId] = e.target.value; else delete n[w.profilId]; return n; })} aria-label={`Wysokość boku ${w.system}`}>
                          <option value="">auto ({w.wariant})</option>
                          {dane.warianty[w.profilId]?.map((v) => <option key={v.wariant} value={v.wariant}>{v.wariant} — plecy {v.plecyWys}</option>)}
                        </select>
                      </td>
                      <td className="r num">{w.grubosc} mm</td>
                      <td><b className="num">{w.dno.szer} × {w.dno.gl}</b><div className="muted" style={{ fontSize: 11 }}>{w.dno.wzor}</div></td>
                      <td><b className="num">{w.plecy.szer} × {w.plecy.wys}</b><div className="muted" style={{ fontSize: 11 }}>{w.plecy.wzor}</div></td>
                      <td style={{ fontSize: 12 }}>
                        {w.zrodlo.dokument}, s. {w.zrodlo.strona}
                        <div className="muted">{OPIS_WERYFIKACJI[w.zrodlo.weryfikacja] ?? w.zrodlo.weryfikacja}</div>
                        {w.uwagi.filter((u) => !u.startsWith("Profil niezatwierdzony")).map((u, i) => <div key={i} className="muted" style={{ fontSize: 11 }}>• {u}</div>)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            Wymiary przycięcia płyty bez obrzeża. Profile nie są jeszcze zatwierdzone produkcyjnie: wiercenia, długości NL dostępne w danym systemie i przypisanie SKU potwierdź w katalogu producenta.
          </p>
        </>
      )}
    </section>
  );
}
