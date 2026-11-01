import { useCallback, useEffect, useState } from "react";
import { api, idz, type ProjektSkrot, type WydanieMeta } from "../api";
import { NAZWY_STATUSOW, STATUSY_PROJEKTU, type StatusProjektu } from "../../../src/core/statusy";

// Panel warsztatu: jeden przepływ pracy, trzy widoki ról. Widok roli to filtr ekranu, a nie zabezpieczenie —
// do czasu kont i uprawnień (RESEARCH-macierz-autoryzacji-tras) każdy z dostępem do aplikacji widzi wszystko.

export type Rola = "wlasciciel" | "produkcja" | "montaz";
const NAZWY_ROL: Record<Rola, string> = { wlasciciel: "Właściciel", produkcja: "Produkcja", montaz: "Montaż" };

/** Następny krok i kto go wykonuje — ta sama tabela co w docs/WORKFLOW-WARSZTAT.md. */
export const NASTEPNY_KROK: Record<StatusProjektu, { kto: Rola; krok: string }> = {
  szkic: { kto: "wlasciciel", krok: "Pomiar, projekt i wizualizacja 3D" },
  wycena: { kto: "wlasciciel", krok: "Oferta, uzgodnienie ceny, umowa" },
  zaakceptowany: { kto: "wlasciciel", krok: "Wydaj rewizję do produkcji (zakładka Produkcja)" },
  wZamowieniu: { kto: "wlasciciel", krok: "Zamów płyty i okucia wg rozkroju; potem status „Produkcja”" },
  produkcja: { kto: "produkcja", krok: "Rozkrój → okleinowanie → wiercenie → składanie wg pakietu P; potem „Gotowe do montażu”" },
  gotoweDoMontazu: { kto: "montaz", krok: "Termin montażu, pakowanie wg listy M, montaż i protokół K" },
  zakonczony: { kto: "wlasciciel", krok: "Zamknij uwagi z protokołu, poproś o opinię" },
};

const STATUSY_ROLI: Record<Rola, StatusProjektu[]> = {
  wlasciciel: [...STATUSY_PROJEKTU],
  produkcja: ["zaakceptowany", "wZamowieniu", "produkcja"],
  montaz: ["gotoweDoMontazu"],
};

function czytajRole(): Rola {
  try {
    const r = localStorage.getItem("warsztat.rola");
    return r === "produkcja" || r === "montaz" ? r : "wlasciciel";
  } catch {
    return "wlasciciel";
  }
}

export function Warsztat() {
  const [rola, setRola] = useState<Rola>(czytajRole);
  const [projekty, setProjekty] = useState<ProjektSkrot[] | null>(null);
  const [wydania, setWydania] = useState<Record<string, WydanieMeta[]>>({});
  const [blad, setBlad] = useState("");

  const odswiez = useCallback(async () => {
    try {
      const lista = await api.projekty();
      setProjekty(lista);
      const potrzebne = lista.filter((p) => STATUSY_ROLI.produkcja.includes(p.status) || p.status === "gotoweDoMontazu");
      const pary = await Promise.all(potrzebne.map(async (p) => [p.id, await api.wydania(p.id).catch(() => [])] as const));
      setWydania(Object.fromEntries(pary));
    } catch (e) {
      setBlad((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void odswiez();
  }, [odswiez]);

  const ustawRole = (r: Rola) => {
    setRola(r);
    try {
      localStorage.setItem("warsztat.rola", r);
    } catch {
      /* brak pamięci przeglądarki — rola tylko na tę sesję */
    }
  };
  const zmienStatus = async (p: ProjektSkrot, status: StatusProjektu) => {
    if (!confirm(`„${p.nazwa}”: zmienić status na „${NAZWY_STATUSOW[status]}”?`)) return;
    await api.zmienProjekt(p.id, { status });
    await odswiez();
  };
  const zglosUwage = async (p: ProjektSkrot) => {
    const tekst = prompt(`Uwaga do „${p.nazwa}” (np. brak okucia, uszkodzony front, nr mebla):`);
    if (!tekst?.trim()) return;
    await api.dodajNotatke(p.id, `[${NAZWY_ROL[rola]}] ${tekst.trim()}`);
    await odswiez();
  };

  const widoczne = (projekty ?? []).filter((p) => STATUSY_ROLI[rola].includes(p.status));

  return (
    <>
      <div className="card">
        <div className="card-h" style={{ flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ flex: 1 }}>Warsztat</h2>
          <div className="seg" role="tablist" aria-label="Widok roli">
            {(Object.keys(NAZWY_ROL) as Rola[]).map((r) => (
              <button key={r} role="tab" aria-selected={rola === r} className={`btn small${rola === r ? " primary" : ""}`} onClick={() => ustawRole(r)}>
                {NAZWY_ROL[r]}
              </button>
            ))}
          </div>
        </div>
        <div className="card-b muted" style={{ fontSize: 13 }}>
          {rola === "wlasciciel" && "Wszystkie zlecenia według etapu i następny krok. Produkcja pracuje wyłącznie na wydaniach (zamrożonych rewizjach)."}
          {rola === "produkcja" && "Zlecenia do wykonania. Drukuj z wydania: pakiet produkcyjny P (sekcje T, R, E, I, S, C). Bez cen i danych kontaktowych klienta."}
          {rola === "montaz" && "Zlecenia gotowe do montażu. Pakiet montażowy (sekcje T, R, E, M, K) zawiera kolejność, wymiary montażowe, okucia i protokół odbioru."}
          <div className="alert ostrzezenie" style={{ marginTop: 8 }}>
            Widok roli porządkuje ekran, ale nie jest zabezpieczeniem — konta i uprawnienia pracowników to osobny etap.
          </div>
        </div>
      </div>
      {blad && <div className="alert blad">{blad}</div>}
      {!projekty && <div className="muted">Wczytywanie…</div>}

      {rola === "wlasciciel" && projekty && (
        <div className="card">
          <div className="t-wrap">
            <table className="t">
              <thead>
                <tr><th>Etap</th><th className="r">Zleceń</th><th>Następny krok</th><th>Kto</th><th>Zlecenia</th></tr>
              </thead>
              <tbody>
                {STATUSY_PROJEKTU.map((st) => {
                  const lista = projekty.filter((p) => p.status === st);
                  return (
                    <tr key={st}>
                      <td><b>{NAZWY_STATUSOW[st]}</b></td>
                      <td className="r num">{lista.length}</td>
                      <td style={{ fontSize: 13 }}>{NASTEPNY_KROK[st].krok}</td>
                      <td>{NAZWY_ROL[NASTEPNY_KROK[st].kto]}</td>
                      <td style={{ fontSize: 13 }}>
                        {lista.map((p) => (
                          <div key={p.id}>
                            <a href={`#/p/${p.id}`} onClick={(e) => { e.preventDefault(); idz(`#/p/${p.id}`); }}>{p.nazwa}</a>
                            {p.terminMontazu ? <span className="muted"> · montaż {p.terminMontazu}</span> : null}
                            {p.otwarteNotatki ? <span className="badge" style={{ marginLeft: 6 }}>{p.otwarteNotatki} uwag</span> : null}
                          </div>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rola !== "wlasciciel" && projekty && !widoczne.length && <div className="card"><div className="card-b muted">Brak zleceń na tym etapie.</div></div>}
      {rola !== "wlasciciel" &&
        widoczne.map((p) => {
          const w = wydania[p.id] ?? [];
          const ost = w[w.length - 1];
          const pdf = (rodzaj: "dokumentacja" | "montaz", q = "") => `/api/projekty/${p.id}/wydania/${ost!.id}/${rodzaj}.pdf${q}`;
          return (
            <div className="card" key={p.id}>
              <div className="card-h" style={{ flexWrap: "wrap", gap: 8 }}>
                <h2 style={{ flex: 1 }}>{p.nazwa}</h2>
                <span className="badge">{NAZWY_STATUSOW[p.status]}</span>
                {p.terminMontazu && <span className="badge">montaż {p.terminMontazu}</span>}
                <span className="badge">{p.skladanieKorpusow === "warsztat" ? "korpusy: składamy w warsztacie" : p.skladanieKorpusow === "naMiejscu" ? "korpusy: składamy na miejscu" : "składanie korpusów: nie ustalono"}</span>
              </div>
              <div className="card-b" style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 13 }}><b>Teraz:</b> {NASTEPNY_KROK[p.status].krok}</div>
                {!ost && <div className="alert ostrzezenie">Brak wydania produkcyjnego — nie zaczynaj pracy. Właściciel wydaje rewizję w zakładce Produkcja projektu.</div>}
                {ost && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 13 }}>Wydanie <b>{ost.numer}</b> (rew. {ost.rewizja}) · {ost.gotowaDoProdukcji ? <span className="ok">kompletne</span> : <span className="muted">robocze — braki: {ost.podsumowanie.brakDanych}</span>}</span>
                    {rola === "produkcja" && (
                      <>
                        <a className="btn primary small" href={pdf("dokumentacja")} target="_blank" rel="noreferrer">Pakiet produkcyjny P</a>
                        <a className="btn small" href={pdf("dokumentacja", "?skrocony=1")} target="_blank" rel="noreferrer">Karty szafek S</a>
                      </>
                    )}
                    <a className={`btn small${rola === "montaz" ? " primary" : ""}`} href={pdf("montaz")} target="_blank" rel="noreferrer">Pakiet montażowy M</a>
                  </div>
                )}
                {p.otwarteNotatki > 0 && <div className="muted" style={{ fontSize: 13 }}>Otwarte uwagi: {p.otwarteNotatki}{p.ostatniaNotatka ? ` · ostatnia: ${p.ostatniaNotatka}` : ""}</div>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button className="btn small" onClick={() => zglosUwage(p)}>Zgłoś uwagę / brak</button>
                  {rola === "produkcja" && p.status === "produkcja" && <button className="btn small" disabled={!ost} onClick={() => zmienStatus(p, "gotoweDoMontazu")}>Gotowe do montażu</button>}
                  {rola === "montaz" && <button className="btn small" disabled={!ost} onClick={() => zmienStatus(p, "zakonczony")}>Montaż zakończony (protokół podpisany)</button>}
                </div>
              </div>
            </div>
          );
        })}
    </>
  );
}
