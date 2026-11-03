import { useEffect, useState, useRef } from "react";
import { request } from "../v2/api";
import { useResource } from "../v2/useResource";
import { Feedback } from "../v2/ui";
import {
  type PozycjaZeStatusem,
  type StanPozycji,
  type WydanieMeta,
  type ZamowienieProjektu,
} from "../api";

// Lista zamówienia dla dostawcy (ST-APP-003): płyty, obrzeża i okucia ze statusem przy każdej pozycji.
// Serwer pilnuje przejść i dat; tu tylko wybór następnego stanu.

const NAZWY: Record<StanPozycji, string> = {
  doZamowienia: "do zamówienia",
  zamowione: "zamówione",
  czesciowo: "częściowo",
  dostarczone: "dostarczone",
  brak: "brak u dostawcy",
};
const NASTEPNE: Record<StanPozycji, StanPozycji[]> = {
  doZamowienia: ["zamowione"],
  zamowione: ["dostarczone", "czesciowo", "brak", "doZamowienia"],
  czesciowo: ["dostarczone", "czesciowo", "brak", "zamowione"],
  dostarczone: ["zamowione", "czesciowo"],
  brak: ["zamowione", "doZamowienia"],
};
const KLASA: Record<StanPozycji, string> = {
  doZamowienia: "",
  zamowione: "muted",
  czesciowo: "",
  dostarczone: "ok",
  brak: "",
};
const RODZAJ: Record<PozycjaZeStatusem["rodzaj"], string> = {
  plyta: "Płyta",
  blat: "Blat",
  obrzeze: "Obrzeże",
  okucie: "Okucie",
};
const dzis = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw" }).format(
    new Date(),
  );
const l = (v: number) =>
  v.toLocaleString("pl-PL", { maximumFractionDigits: 2 });

export function Zamowienie({
  pid,
  wydania,
}: {
  pid: string;
  wydania: WydanieMeta[];
}) {
  const [zrodlo, setZrodlo] = useState<string>("");
  const resource = useResource<ZamowienieProjektu>(
    `/api/projekty/${encodeURIComponent(pid)}/zamowienie${zrodlo ? `?wydanie=${encodeURIComponent(zrodlo)}` : ""}`,
  );
  const dane = resource.busy || resource.error ? null : resource.data;
  const operation = useRef<AbortController | null>(null);
  const [blad, setBlad] = useState("");
  const [trwa, setTrwa] = useState<string | null>(null);
  const [edycja, setEdycja] = useState<{
    klucz: string;
    stan: StanPozycji;
    data: string;
    ilosc: string;
    dostawca: string;
  } | null>(null);

  useEffect(() => {
    setEdycja(null);
    setBlad("");
    return () => operation.current?.abort();
  }, [pid, zrodlo]);

  const zapisz = async () => {
    if (!edycja || !dane || trwa) return;
    const current = dane.pozycje.find((p) => p.klucz === edycja.klucz);
    if (!current) return;
    const controller = new AbortController();
    operation.current = controller;
    setTrwa(edycja.klucz);
    try {
      await request(
        `/api/projekty/${encodeURIComponent(pid)}/zamowienie/status`,
        {
          method: "PUT",
          signal: controller.signal,
          body: JSON.stringify({
            expectedRevision: dane.projekt.rewizja,
            expectedQuantity: current.ilosc,
            expectedUpdatedAt:
              "zmieniono" in current.status ? current.status.zmieniono : null,
            klucz: edycja.klucz,
            stan: edycja.stan,
            data: edycja.data || undefined,
            iloscDostarczona:
              edycja.stan === "czesciowo"
                ? Number(edycja.ilosc.replace(",", "."))
                : undefined,
            dostawca: edycja.dostawca.trim() ? edycja.dostawca.trim() : null,
            wydanie:
              dane.zrodlo.rodzaj === "wydanie"
                ? dane.zrodlo.wydanieId
                : "biezaca",
          }),
        },
      );
      if (controller.signal.aborted) return;
      setEdycja(null);
      resource.retry();
    } catch (e) {
      if (!controller.signal.aborted) setBlad((e as Error).message);
    } finally {
      if (!controller.signal.aborted) setTrwa(null);
    }
  };

  const zapytanie = zrodlo ? `?wydanie=${encodeURIComponent(zrodlo)}` : "";
  const poKluczu = new Map((dane?.pozycje ?? []).map((p) => [p.klucz, p]));
  const licz = (s: StanPozycji) =>
    dane?.pozycje.filter((p) => p.status.stan === s).length ?? 0;

  return (
    <div className="card">
      <div className="card-h" style={{ flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ flex: 1 }}>Zamówienie materiałów i okuć</h2>
        <select
          className="input"
          disabled={!!trwa || !!edycja}
          style={{ maxWidth: 240 }}
          value={zrodlo}
          onChange={(e) => setZrodlo(e.target.value)}
          aria-label="Źródło zestawienia"
        >
          <option value="">
            {wydania.length
              ? "Ostatnie wydanie"
              : "Bieżąca rewizja (brak wydań)"}
          </option>
          {[...wydania].reverse().map((w) => (
            <option key={w.id} value={w.id}>
              Wydanie {w.numer} (rew. {w.rewizja})
            </option>
          ))}
          {wydania.length > 0 && (
            <option value="biezaca">Bieżąca rewizja</option>
          )}
        </select>
        <a
          className="btn primary"
          href={`/api/projekty/${pid}/zamowienie.pdf${zapytanie}`}
          target="_blank"
          rel="noreferrer"
        >
          PDF
        </a>
        <a
          className="btn"
          href={`/api/projekty/${pid}/zamowienie.csv${zapytanie}`}
        >
          CSV
        </a>
      </div>
      <div className="card-b" style={{ display: "grid", gap: 8 }}>
        {dane && (
          <div className="muted" style={{ fontSize: 13 }}>
            {dane.zrodlo.rodzaj === "wydanie"
              ? `Z wydania ${dane.zrodlo.numer} (rew. ${dane.zrodlo.rewizja})`
              : `Z bieżącej rewizji ${dane.zrodlo.rewizja}`}
            ; okucia z wariantu {dane.wariant}. Bez cen. Do zamówienia:{" "}
            {licz("doZamowienia")} · zamówione: {licz("zamowione")} · częściowo:{" "}
            {licz("czesciowo")} · dostarczone: {licz("dostarczone")} · brak:{" "}
            {licz("brak")}
          </div>
        )}
        {resource.busy && <p role="status">Wczytywanie zestawienia…</p>}
        {resource.error && (
          <Feedback retry={resource.retry}>{resource.error}</Feedback>
        )}
        {blad && (
          <Feedback>
            {blad} Odśwież zestawienie, jeśli projekt lub status zmienił się na
            innym urządzeniu.
          </Feedback>
        )}
        <button
          className="ps-text-button"
          disabled={!!trwa || !!edycja}
          onClick={resource.retry}
        >
          Odśwież zestawienie
        </button>
        {dane?.ostrzezenia.map((o) => (
          <div key={o} className="alert ostrzezenie">
            {o}
          </div>
        ))}
        {dane?.grupy.map((g) => (
          <div key={g.dostawca}>
            <h3 style={{ margin: "8px 0 4px" }}>{g.dostawca}</h3>
            <table className="t">
              <thead>
                <tr>
                  <th>Kod / SKU</th>
                  <th>Pozycja</th>
                  <th className="r">Ilość</th>
                  <th>Status</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {g.klucze
                  .map((k) => poKluczu.get(k))
                  .filter((p): p is PozycjaZeStatusem => !!p)
                  .map((p) => {
                    const s = p.status as PozycjaZeStatusem["status"] & {
                      dataZamowienia?: string;
                      dataDostawy?: string;
                      iloscDostarczona?: number;
                      dostawca?: string;
                      uwagi?: string;
                    };
                    const ed = edycja?.klucz === p.klucz ? edycja : null;
                    return (
                      <tr key={p.klucz}>
                        <td className="num">
                          {p.kod ?? (
                            <b style={{ color: "#b3261e" }}>BRAK KODU</b>
                          )}
                        </td>
                        <td>
                          <div>
                            {RODZAJ[p.rodzaj]} · {p.nazwa}
                            {p.gruboscMM ? ` · ${l(p.gruboscMM)} mm` : ""}
                            {p.format ? ` · ark. ${p.format}` : ""}
                          </div>
                          {(p.m2 || p.nettoM || p.uwagi.length > 0) && (
                            <div className="muted" style={{ fontSize: 12 }}>
                              {[
                                p.m2 ? `${l(p.m2)} m²` : "",
                                p.nettoM ? `netto ${l(p.nettoM)} mb` : "",
                                ...p.uwagi,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          )}
                        </td>
                        <td className="r num" style={{ whiteSpace: "nowrap" }}>
                          <b>
                            {l(p.ilosc)} {p.jednostka}
                          </b>
                          {p.doDomowienia ? (
                            <div style={{ color: "#b3261e", fontSize: 12 }}>
                              domówić {l(p.doDomowienia)}
                            </div>
                          ) : null}
                        </td>
                        <td style={{ fontSize: 13 }}>
                          <span
                            className={KLASA[s.stan]}
                            style={
                              s.stan === "brak"
                                ? { color: "#b3261e" }
                                : undefined
                            }
                          >
                            {NAZWY[s.stan]}
                          </span>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {[
                              s.dataZamowienia
                                ? `zam. ${s.dataZamowienia}`
                                : "",
                              s.stan === "czesciowo" &&
                              s.iloscDostarczona !== undefined
                                ? `jest ${l(s.iloscDostarczona)}`
                                : "",
                              s.dataDostawy ? `dost. ${s.dataDostawy}` : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {!ed ? (
                            <button
                              className="btn small"
                              disabled={!!edycja || !!trwa}
                              aria-label={`Zmień status ${p.nazwa}`}
                              onClick={() =>
                                setEdycja({
                                  klucz: p.klucz,
                                  stan: NASTEPNE[s.stan][0],
                                  data: dzis(),
                                  ilosc: "",
                                  dostawca: s.dostawca ?? "",
                                })
                              }
                            >
                              Zmień
                            </button>
                          ) : (
                            <div
                              style={{ display: "grid", gap: 4, minWidth: 180 }}
                            >
                              <select
                                className="input"
                                value={ed.stan}
                                onChange={(e) =>
                                  setEdycja({
                                    ...ed,
                                    stan: e.target.value as StanPozycji,
                                  })
                                }
                                aria-label="Nowy status"
                              >
                                {[
                                  ...new Set([s.stan, ...NASTEPNE[s.stan]]),
                                ].map((n) => (
                                  <option key={n} value={n}>
                                    {NAZWY[n]}
                                    {n === s.stan ? " (bez zmiany)" : ""}
                                  </option>
                                ))}
                              </select>
                              {ed.stan !== "doZamowienia" &&
                                ed.stan !== "brak" && (
                                  <input
                                    className="input"
                                    type="date"
                                    value={ed.data}
                                    onChange={(e) =>
                                      setEdycja({ ...ed, data: e.target.value })
                                    }
                                    aria-label="Data"
                                  />
                                )}
                              {ed.stan === "czesciowo" && (
                                <input
                                  className="input"
                                  aria-label="Dostarczona ilość"
                                  inputMode="decimal"
                                  placeholder={`Dostarczono (${p.jednostka})`}
                                  value={ed.ilosc}
                                  onChange={(e) =>
                                    setEdycja({ ...ed, ilosc: e.target.value })
                                  }
                                />
                              )}
                              <input
                                className="input"
                                aria-label="Dostawca lub hurtownia"
                                maxLength={80}
                                placeholder="Dostawca / hurtownia (opcjonalnie)"
                                value={ed.dostawca}
                                onChange={(e) =>
                                  setEdycja({ ...ed, dostawca: e.target.value })
                                }
                              />
                              <div style={{ display: "flex", gap: 4 }}>
                                <button
                                  className="btn small primary"
                                  disabled={trwa === p.klucz}
                                  onClick={zapisz}
                                >
                                  Zapisz
                                </button>
                                <button
                                  className="btn small"
                                  disabled={!!trwa}
                                  onClick={() => setEdycja(null)}
                                >
                                  Anuluj
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ))}
        {dane && dane.nieaktualne.length > 0 && (
          <div className="muted" style={{ fontSize: 12 }}>
            Zamówione wcześniej, poza tym zestawieniem:{" "}
            {dane.nieaktualne
              .map((n) => `${n.klucz} (${NAZWY[n.status.stan]})`)
              .join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
