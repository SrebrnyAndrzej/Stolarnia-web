import { useCallback, useEffect, useState } from "react";
import { api, idz, type Analiza } from "./api";
import { Designer } from "./views/Designer";
import { Materials } from "./views/Materials";
import { Production } from "./views/Production";
import { Projects } from "./views/Projects";
import { Quote } from "./views/Quote";
import { Settings } from "./views/Settings";

type Trasa =
  | { widok: "projekty" }
  | { widok: "projekt"; id: string; zakladka: "projekt" | "wycena" | "produkcja" }
  | { widok: "materialy" }
  | { widok: "ustawienia" };

function czytajTrase(): Trasa {
  const cz = location.hash.replace(/^#\/?/, "").split("/");
  if (cz[0] === "p" && cz[1]) {
    const z = cz[2] === "wycena" || cz[2] === "produkcja" ? cz[2] : "projekt";
    return { widok: "projekt", id: cz[1], zakladka: z };
  }
  if (cz[0] === "materialy") return { widok: "materialy" };
  if (cz[0] === "ustawienia") return { widok: "ustawienia" };
  return { widok: "projekty" };
}

export function App() {
  const [trasa, setTrasa] = useState<Trasa>(czytajTrase);
  useEffect(() => {
    const f = () => setTrasa(czytajTrase());
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" onClick={() => idz("#/")}>
          <span className="brand-mark" aria-hidden /> Stolarnia Online
        </div>
        <nav className="nav">
          <button className={trasa.widok === "projekty" || trasa.widok === "projekt" ? "on" : ""} onClick={() => idz("#/")}>Projekty</button>
          <button className={trasa.widok === "materialy" ? "on" : ""} onClick={() => idz("#/materialy")}>Materiały i okucia</button>
          <button className={trasa.widok === "ustawienia" ? "on" : ""} onClick={() => idz("#/ustawienia")}>Ustawienia</button>
        </nav>
      </header>
      <main className="main">
        {trasa.widok === "projekty" && <Projects />}
        {trasa.widok === "projekt" && <ProjektWidok id={trasa.id} zakladka={trasa.zakladka} />}
        {trasa.widok === "materialy" && <Materials />}
        {trasa.widok === "ustawienia" && <Settings />}
      </main>
    </div>
  );
}

function ProjektWidok({ id, zakladka }: { id: string; zakladka: "projekt" | "wycena" | "produkcja" }) {
  const [analiza, setAnaliza] = useState<Analiza | null>(null);
  const [blad, setBlad] = useState<string | null>(null);

  const odswiez = useCallback(async () => {
    try {
      const a = await api.analiza(id);
      // Unikamy przerysowania, gdy nic się nie zmieniło (odpytywanie zmian z MCP).
      // Ceny i ustawienia zmieniają wycenę bez zmiany rewizji projektu — porównujemy też wynik wyceny.
      const cena = (x: Analiza) => x.warianty.map((w) => w.cenaNetto).join("|");
      setAnaliza((stara) => (stara && stara.projekt.rewizja === a.projekt.rewizja && stara.projekt.zmieniono === a.projekt.zmieniono && cena(stara) === cena(a) ? stara : a));
      setBlad(null);
    } catch (e) {
      setBlad((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    setAnaliza(null);
    odswiez();
    // Zmiany wprowadzone przez Claude (MCP) pojawiają się automatycznie.
    const t = setInterval(() => document.visibilityState === "visible" && odswiez(), 4000);
    return () => clearInterval(t);
  }, [odswiez]);

  // Ustawienia/cenniki zmieniają wycenę bez zmiany rewizji projektu — wymuś odświeżenie przy wejściu w zakładkę.
  useEffect(() => {
    api.analiza(id).then(setAnaliza).catch(() => undefined);
  }, [id, zakladka]);

  if (blad) return <div className="page"><div className="alert blad">{blad}</div></div>;
  if (!analiza) return <div className="page muted">Wczytywanie projektu…</div>;

  const p = analiza.projekt;
  const std = analiza.warianty.find((w) => w.wariant === "standard");
  return (
    <div className="page">
      <div className="row">
        <button className="btn small" onClick={() => idz("#/")}>← Projekty</button>
        <h1>{p.nazwa}</h1>
        {p.klient.nazwa && <span className="muted">· {p.klient.nazwa}</span>}
        <span className="badge accent">{p.status}</span>
        <span className="spacer" />
        {std && <span className="muted num">Standard: <b>{std.cenaBrutto.toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}</b> brutto</span>}
      </div>
      <nav className="nav" style={{ marginLeft: 0 }}>
        <button className={zakladka === "projekt" ? "on" : ""} onClick={() => idz(`#/p/${id}`)}>Projekt</button>
        <button className={zakladka === "wycena" ? "on" : ""} onClick={() => idz(`#/p/${id}/wycena`)}>Wycena</button>
        <button className={zakladka === "produkcja" ? "on" : ""} onClick={() => idz(`#/p/${id}/produkcja`)}>Produkcja</button>
      </nav>
      {zakladka === "projekt" && <Designer analiza={analiza} odswiez={odswiez} />}
      {zakladka === "wycena" && <Quote analiza={analiza} odswiez={odswiez} />}
      {zakladka === "produkcja" && <Production analiza={analiza} />}
    </div>
  );
}
