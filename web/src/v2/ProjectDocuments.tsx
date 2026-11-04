import { useEffect, useRef, useState } from "react";
import { IconFileDescription, IconPrinter, IconX } from "@tabler/icons-react";
import type { TechnicalDocuments } from "../../../src/server/documents";
import { date, requestPdf } from "./api";
import { useResource } from "./useResource";
import { Feedback } from "./ui";

export function ProjectDocuments({
  id,
  owner,
  demo,
  onClose,
}: {
  id: string;
  owner: boolean;
  demo: boolean;
  onClose: () => void;
}) {
  const [release, setRelease] = useState("");
  const [format, setFormat] = useState<"skrot" | "pelny">("skrot");
  const [module, setModule] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [pdf, setPdf] = useState<{ url: string; kind: string } | null>(null);
  const operation = useRef<AbortController | null>(null);
  const base = `/api/v2/projects/${encodeURIComponent(id)}/documents`;
  const resource = useResource<TechnicalDocuments>(
    demo
      ? null
      : `${base}${release ? `?wydanie=${encodeURIComponent(release)}` : ""}`,
  );
  const d = resource.data?.document;
  const diagnosticLabels: Record<string, string> = {
    blad: "Błąd",
    brakDanych: "Brak danych",
    niesprawdzone: "Do sprawdzenia",
    ostrzezenie: "Ostrzeżenie",
    info: "Informacja",
  };
  const refresh = () => {
    operation.current?.abort();
    setBusy("");
    setPdf(null);
    setError("");
    setModule("");
    resource.retry();
  };
  useEffect(() => () => operation.current?.abort(), []);
  useEffect(
    () => () => {
      if (pdf) URL.revokeObjectURL(pdf.url);
    },
    [pdf],
  );
  useEffect(() => {
    operation.current?.abort();
    setPdf(null);
    setError("");
    setBusy("");
    setModule("");
  }, [release]);
  const generate = async (kind: "techniczne" | "montazowe") => {
    if (busy) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(kind);
    setError("");
    setPdf(null);
    try {
      const query = new URLSearchParams({
        rodzaj: kind,
        format,
        rewizja: String(d?.revision),
      });
      const selected = resource.data?.selectedRelease;
      if (selected) query.set("wydanie", selected);
      if (module) query.set("modul", module);
      const url = demo ? `/documents/demo-${kind}.pdf` : `${base}.pdf?${query}`;
      const blob = await requestPdf(url, controller.signal);
      if (!controller.signal.aborted)
        setPdf({ url: URL.createObjectURL(blob), kind });
    } catch (e) {
      if (!controller.signal.aborted) setError((e as Error).message);
    } finally {
      if (!controller.signal.aborted) setBusy("");
    }
  };
  return (
    <section className="ps-documents" aria-labelledby="documents-title">
      <div className="ps-documents-heading">
        <div>
          <span className="ps-eyebrow">Dokumentacja projektu</span>
          <h3 id="documents-title">Karty techniczne i montażowe</h3>
        </div>
        <button className="ps-text-button" onClick={onClose}>
          <IconX size={18} aria-hidden="true" />
          Zamknij dokumentację
        </button>
      </div>
      <p>
        Skrót zawiera rysunek wnętrza ze światłem między półkami, przekrój
        boczny i wybrane wiercenia okuć. Pełne karty zawierają wszystkie części
        i operacje. PDF otworzysz w nowej karcie i wydrukujesz z przeglądarki.
      </p>
      {!demo && (
        <button
          className="ps-text-button"
          disabled={resource.busy || !!busy}
          onClick={refresh}
        >
          Odśwież dokumentację
        </button>
      )}
      {demo ? (
        <p className="ps-document-warning">
          Podgląd: wydruki pokazują wyłącznie przykładową szafkę, niezależną od
          wybranego projektu. Dokument roboczy — nie do produkcji.
        </p>
      ) : resource.busy ? (
        <p role="status">Wczytywanie dokumentacji…</p>
      ) : resource.error ? (
        <Feedback retry={resource.retry}>{resource.error}</Feedback>
      ) : (
        <>
          {!!resource.data?.releases.length && (
            <label className="field">
              Wersja dokumentacji
              <select
                className="input"
                value={
                  release ||
                  (owner ? "" : (resource.data.selectedRelease ?? ""))
                }
                onChange={(e) => setRelease(e.target.value)}
              >
                {owner && <option value="">Bieżąca wersja robocza</option>}
                {resource.data.releases.map((w) => (
                  <option key={w.id} value={w.id}>
                    Wydanie {w.number} · rew. {w.revision} · {date(w.createdAt)}
                    {w.ready ? "" : " · robocze"}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!d ? (
            <p className="ps-document-warning">
              Nie ma jeszcze zapisanego wydania dokumentacji. Poproś właściciela
              o przygotowanie wydania w dokumentacji produkcyjnej.
            </p>
          ) : (
            <>
              <p className="ps-document-warning">
                {resource.data?.selectedRelease
                  ? `Zapisane wydanie · rewizja ${d.revision}.`
                  : `Bieżąca wersja · rewizja ${d.revision}.`}
                {!d.ready &&
                  " Dokument roboczy — nie do produkcji. Sprawdź braki danych i diagnostykę."}
                {resource.data?.selectedRelease &&
                  resource.data.currentRevision !== d.revision &&
                  ` Aktualny projekt ma rewizję ${resource.data.currentRevision}; drukujesz wybrane, wcześniejsze wydanie.`}
              </p>
              <dl className="ps-documents-stats">
                <div>
                  <dt>Części</dt>
                  <dd>{d.parts}</dd>
                </div>
                <div>
                  <dt>Operacje</dt>
                  <dd>{d.operations}</dd>
                </div>
                <div>
                  <dt>Rewizja</dt>
                  <dd>{d.revision}</dd>
                </div>
              </dl>
              <label className="field">
                Zakres wydruku
                <select
                  className="input"
                  value={module}
                  onChange={(e) => {
                    setModule(e.target.value);
                    setPdf(null);
                    setError("");
                  }}
                  disabled={!!busy}
                >
                  <option value="">Cały projekt</option>
                  {d.modules.map((m, index) => (
                    <option key={m.id} value={m.id}>
                      {index + 1}. {m.name} · {m.parts} części
                    </option>
                  ))}
                </select>
              </label>
              {!!d.diagnostics.length && (
                <details>
                  <summary>
                    Diagnostyka i braki danych ({d.diagnostics.length})
                  </summary>
                  <ul>
                    {d.diagnostics.map((x, i) => (
                      <li key={`${x.code}-${i}`}>
                        <strong>
                          {diagnosticLabels[x.level] ?? "Informacja"}
                        </strong>
                        : {x.description}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </>
      )}
      {!demo && (
        <label className="field">
          Objętość dokumentacji
          <select
            className="input"
            value={format}
            disabled={!!busy}
            onChange={(e) => {
              setFormat(e.target.value as "skrot" | "pelny");
              setPdf(null);
            }}
          >
            <option value="skrot">
              Skrót — rysunki, prześwity i wiercenia okuć
            </option>
            <option value="pelny">Pełny zakres wybranego rodzaju kart</option>
          </select>
        </label>
      )}
      {(demo || (!!d && !resource.busy && !resource.error && d.parts > 0)) && (
        <div className="ps-document-actions">
          <button
            className="ps-button"
            disabled={!!busy}
            onClick={() => generate("techniczne")}
          >
            <IconFileDescription size={19} aria-hidden="true" />
            {busy === "techniczne"
              ? "Przygotowywanie PDF…"
              : "Przygotuj karty techniczne"}
          </button>
          <button
            className="ps-button secondary"
            disabled={!!busy}
            onClick={() => generate("montazowe")}
          >
            <IconPrinter size={19} aria-hidden="true" />
            {busy === "montazowe"
              ? "Przygotowywanie PDF…"
              : "Przygotuj karty montażowe"}
          </button>
        </div>
      )}
      {owner && !demo && (
        <p>
          <a
            className="ps-under-link"
            href={`#/p/${encodeURIComponent(id)}/produkcja`}
          >
            Zarządzaj wydaniami dokumentacji
          </a>
        </p>
      )}
      {busy && (
        <p role="status">
          Generowanie dokumentu. Możesz pozostać na tej stronie.
        </p>
      )}
      {error && (
        <Feedback>
          {error} Ponów przygotowanie PDF. Jeśli projekt się zmienił, użyj
          przycisku „Odśwież dokumentację”.
        </Feedback>
      )}
      {pdf && (
        <div className="ps-document-result">
          <p role="status">
            PDF gotowy: karty{" "}
            {pdf.kind === "techniczne" ? "techniczne" : "montażowe"}.
          </p>
          <a
            className="ps-button"
            href={pdf.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Otwórz PDF do druku (nowa karta)
          </a>
          <a
            className="ps-under-link"
            href={pdf.url}
            download={`karty-${pdf.kind}.pdf`}
          >
            Pobierz PDF
          </a>
        </div>
      )}
    </section>
  );
}
