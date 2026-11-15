import { useEffect, useMemo, useRef, useState } from "react";
import {
  CAD_FILE_LIMIT,
  CAD_PREVIEW_LIMIT,
  CAD_SCALES as scales,
  type CadUnit,
  type ProjectFile,
} from "../../../src/core/project-files";
import type { CadPreview } from "../../../src/core/cad-preview";
import { request, date } from "./api";
import { useResource } from "./useResource";
import { Feedback } from "./ui";
import "./project-files.css";

const size = (n: number) =>
  n < 1024
    ? `${n} B`
    : `${(n / 1024).toLocaleString("pl-PL", { maximumFractionDigits: 0 })} KiB`;
const bytesFromBase64 = (value: string) =>
  Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
const fileBase64 = (file: File, signal: AbortSignal) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => reader.abort();
    signal.addEventListener("abort", abort, { once: true });
    const cleanup = () => signal.removeEventListener("abort", abort);
    reader.onload = () => {
      cleanup();
      resolve(String(reader.result).split(",")[1]);
    };
    reader.onerror = () => {
      cleanup();
      reject(new Error("Nie udało się odczytać pliku. Wybierz go ponownie."));
    };
    reader.onabort = () => {
      cleanup();
      reject(new Error("Anulowano odczyt."));
    };
    if (signal.aborted) {
      cleanup();
      reject(new Error("Anulowano odczyt."));
      return;
    }
    reader.readAsDataURL(file);
  });

export function ProjectFiles({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const base = `/api/v2/projects/${encodeURIComponent(id)}/files`;
  const resource = useResource<ProjectFile[]>(base);
  const [chosen, setChosen] = useState<{ file: File; id: string } | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<{
    file: ProjectFile;
    data: CadPreview;
  } | null>(null);
  const [unit, setUnit] = useState<CadUnit | "">("");
  const [layer, setLayer] = useState("");
  const operation = useRef<AbortController | null>(null);
  const worker = useRef<Worker | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => {
      operation.current?.abort();
      worker.current?.terminate();
    },
    [],
  );
  const choose = (files: FileList | null) => {
    if (busy || !files?.length) return;
    setError("");
    setStatus("");
    if (files.length !== 1) {
      setChosen(null);
      setError("Wybierz jeden plik. Następne dodasz po zapisaniu pierwszego.");
      return;
    }
    const file = files[0];
    if (
      !/\.(dxf|dwg)$/i.test(file.name) ||
      !file.size ||
      file.size > CAD_FILE_LIMIT ||
      file.name.length > 180
    ) {
      setChosen(null);
      setError(
        "Wybierz niepusty plik DXF lub DWG do 3 MiB. Nazwa: maksymalnie 180 znaków.",
      );
      return;
    }
    setChosen({ file, id: crypto.randomUUID() });
  };
  const cancel = () => {
    operation.current?.abort();
    worker.current?.terminate();
    setBusy("");
    setStatus(
      "Przerwano oczekiwanie. Jeśli wysyłanie już się zakończyło, plik pojawi się po odświeżeniu listy. Ponowienie nie doda drugiego oryginału.",
    );
    resource.retry();
  };
  const upload = async () => {
    if (!chosen || busy) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy("Zapisywanie oryginału…");
    setError("");
    setStatus("");
    try {
      const base64 = await fileBase64(chosen.file, controller.signal);
      const file = await request<ProjectFile>(base, {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({ id: chosen.id, name: chosen.file.name, base64 }),
      });
      if (!controller.signal.aborted) {
        setChosen(null);
        if (input.current) input.current.value = "";
        setStatus(`Zapisano oryginał: ${file.name}.`);
        resource.retry();
      }
    } catch (e) {
      if (!controller.signal.aborted) setError((e as Error).message);
    } finally {
      if (!controller.signal.aborted) setBusy("");
    }
  };
  const open = async (file: ProjectFile, download: boolean) => {
    if (busy) return;
    if (!download && file.format === "dwg") {
      setError(
        "DWG zapisano w oryginale. Do podglądu dołącz tekstowy DXF wyeksportowany przez architekta.",
      );
      return;
    }
    if (!download && file.size > CAD_PREVIEW_LIMIT) {
      setError(
        "Podgląd DXF obsługuje do 1 MiB. Pobierz oryginał, aby otworzyć go w CAD.",
      );
      return;
    }
    const controller = new AbortController();
    operation.current = controller;
    setBusy(download ? "Pobieranie oryginału…" : "Odczytywanie rysunku…");
    setError("");
    setStatus("");
    if (!download) setPreview(null);
    try {
      const content = await request<ProjectFile & { base64: string }>(
        `${base}/${encodeURIComponent(file.id)}/content`,
        { signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      const bytes = bytesFromBase64(content.base64);
      if (download) {
        const url = URL.createObjectURL(
          new Blob([bytes], { type: "application/octet-stream" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = content.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatus(`Pobrano: ${content.name}.`);
      } else {
        const data = await new Promise<CadPreview>((resolve, reject) => {
          const w = new Worker(
            new URL("./cad-preview.worker.ts", import.meta.url),
            { type: "module" },
          );
          worker.current = w;
          const finish = () => {
            clearTimeout(timer);
            controller.signal.removeEventListener("abort", abort);
            w.terminate();
            if (worker.current === w) worker.current = null;
          };
          const abort = () => {
            finish();
            reject(new Error("Anulowano podgląd."));
          };
          const timer = setTimeout(() => {
            finish();
            reject(
              new Error(
                "Rysunek jest zbyt złożony do podglądu. Pobierz oryginał i otwórz w CAD.",
              ),
            );
          }, 5000);
          controller.signal.addEventListener("abort", abort, { once: true });
          w.onmessage = (event) => {
            finish();
            event.data.error
              ? reject(new Error(event.data.error))
              : resolve(event.data.result);
          };
          w.onerror = () => {
            finish();
            reject(
              new Error(
                "Nie udało się otworzyć podglądu DXF. Pobierz oryginał.",
              ),
            );
          };
          w.postMessage(new TextDecoder().decode(bytes));
        });
        if (!controller.signal.aborted) {
          setPreview({ file, data });
          setUnit(data.unit ?? "");
          setLayer("");
        }
      }
    } catch (e) {
      if (!controller.signal.aborted) setError((e as Error).message);
    } finally {
      if (!controller.signal.aborted) setBusy("");
    }
  };
  const layers = useMemo(
    () => [...new Set(preview?.data.paths.map((p) => p.layer) ?? [])],
    [preview],
  );
  const paths = useMemo(
    () => preview?.data.paths.filter((p) => !layer || p.layer === layer) ?? [],
    [preview, layer],
  );
  const bounds = useMemo(() => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of paths)
      for (const [x, y] of p.points) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    if (!Number.isFinite(minX)) return null;
    const width = maxX - minX,
      height = maxY - minY,
      padding = Math.max(width, height, 1) * 0.05;
    return {
      viewBox: `${minX - padding} ${minY - padding} ${Math.max(width, padding) + 2 * padding} ${Math.max(height, padding) + 2 * padding}`,
      width,
      height,
    };
  }, [paths]);
  return (
    <section
      className="ps-documents ps-project-files"
      aria-labelledby="project-files-title"
    >
      <div className="ps-documents-heading">
        <div>
          <span className="ps-eyebrow">Materiały projektu</span>
          <h3 id="project-files-title">Pliki od architekta</h3>
        </div>
        <button className="ps-text-button" onClick={onClose} disabled={!!busy}>
          Zamknij pliki
        </button>
      </div>
      <p>
        Dodaj DXF lub DWG — zachowamy oryginał bez zmiany projektu. Do 3 MiB na
        plik, maksymalnie 50 plików w projekcie. Oryginały są dostępne
        właścicielowi i projektantowi.
      </p>
      <div
        className={`ps-file-drop${drag ? " is-dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          choose(e.dataTransfer.files);
        }}
      >
        <label className="field">
          Wybierz DXF lub DWG
          <input
            className="input"
            ref={input}
            type="file"
            accept=".dxf,.dwg"
            disabled={!!busy}
            onChange={(e) => choose(e.target.files)}
            aria-describedby="cad-file-help"
          />
        </label>
        <p id="cad-file-help">Możesz też przeciągnąć tutaj jeden plik.</p>
        {chosen && (
          <p>
            {chosen.file.name} · {size(chosen.file.size)} · gotowy do zapisania
          </p>
        )}
        <div className="ps-document-actions">
          <button
            className="ps-button"
            disabled={!chosen || !!busy}
            onClick={upload}
          >
            Zapisz plik w projekcie
          </button>
          {chosen && (
            <button
              className="ps-button secondary"
              disabled={!!busy}
              onClick={() => {
                setChosen(null);
                if (input.current) input.current.value = "";
              }}
            >
              Wyczyść wybór
            </button>
          )}
        </div>
      </div>
      {busy && (
        <div role="status">
          <p>{busy}</p>
          <progress aria-label={busy} />
          <button className="ps-text-button" onClick={cancel}>
            Przerwij oczekiwanie
          </button>
        </div>
      )}
      {error && <Feedback>{error}</Feedback>}
      {status && <p role="status">{status}</p>}
      <button
        className="ps-text-button"
        disabled={!!busy || resource.busy}
        onClick={resource.retry}
      >
        Odśwież listę plików
      </button>
      {resource.busy ? (
        <p role="status">Wczytywanie plików…</p>
      ) : resource.error ? (
        <Feedback retry={resource.retry}>{resource.error}</Feedback>
      ) : !resource.data?.length ? (
        <p>Brak plików od architekta. Wybierz pierwszy rysunek powyżej.</p>
      ) : (
        <ul className="ps-file-list">
          {resource.data.map((file) => (
            <li key={file.id}>
              <div>
                <strong>{file.name}</strong>
                <p>
                  {file.format.toUpperCase()} · {size(file.size)} ·{" "}
                  {date(file.createdAt)}
                </p>
              </div>
              <div className="ps-document-actions">
                <button
                  className="ps-button secondary"
                  disabled={!!busy}
                  onClick={() => open(file, true)}
                  aria-label={`Pobierz oryginał ${file.name}`}
                >
                  Pobierz oryginał
                </button>
                {file.format === "dxf" && (
                  <button
                    className="ps-button secondary"
                    disabled={!!busy}
                    onClick={() => open(file, false)}
                    aria-label={`Podgląd DXF ${file.name}`}
                  >
                    Podgląd DXF
                  </button>
                )}
              </div>
              {file.format === "dwg" && (
                <p>Podgląd: dołącz również wersję ASCII DXF z programu CAD.</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {preview && (
        <section aria-label="Podgląd rysunku CAD">
          <h4>{preview.file.name}</h4>
          <p>
            Rysunek referencyjny — nie tworzy mebli ani ścian automatycznie.
          </p>
          <div className="ps-file-controls">
            <label className="field">
              Jednostka rysunku
              <select
                className="input"
                value={unit}
                aria-label="Jednostka rysunku"
                onChange={(e) => setUnit(e.target.value as CadUnit | "")}
              >
                <option value="">Nieokreślona — wybierz jednostkę</option>
                <option value="mm">Milimetry</option>
                <option value="cm">Centymetry</option>
                <option value="m">Metry</option>
                <option value="in">Cale</option>
                <option value="ft">Stopy</option>
              </select>
            </label>
            <label className="field">
              Warstwa rysunku
              <select
                className="input"
                value={layer}
                aria-label="Warstwa rysunku"
                onChange={(e) => setLayer(e.target.value)}
              >
                <option value="">Wszystkie warstwy</option>
                {layers.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
          </div>
          <p>
            {preview.data.unit
              ? `Jednostka w nagłówku: ${preview.data.unit}.`
              : "Nagłówek nie podaje obsługiwanej jednostki. Sprawdź skalę u architekta."}{" "}
            Zmiana jednostki dotyczy tylko podglądu.
          </p>
          {bounds ? (
            <>
              <p>
                {unit
                  ? `Gabaryt widocznego rysunku: ${(bounds.width * scales[unit]).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} × ${(bounds.height * scales[unit]).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} mm.`
                  : "Gabaryt w mm będzie dostępny po wskazaniu jednostki."}
              </p>
              <svg
                className="ps-cad-preview"
                viewBox={bounds.viewBox}
                role="img"
                aria-label="Rzut 2D z pliku DXF"
              >
                {paths.map((p, i) => (
                  <polyline
                    key={i}
                    points={p.points.map((point) => point.join(",")).join(" ")}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
            </>
          ) : (
            <p>
              Nie znaleziono obsługiwanej geometrii 2D. Pobierz oryginał, aby
              obejrzeć pełny rysunek.
            </p>
          )}
          <details>
            <summary>
              Zakres podglądu i pominięte elementy ({preview.data.skipped})
            </summary>
            {preview.data.warnings.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </details>
        </section>
      )}
    </section>
  );
}
