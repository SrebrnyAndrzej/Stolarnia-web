import { useEffect, useRef, useState } from "react";
import { randomId } from "../../uuid";
import { Feedback } from "../ui";
import {
  architectFileSchema,
  architectFilesSchema,
  architectRoles,
  ARCHITECT_TOTAL_LIMIT,
  imageReferenceSize,
  type ArchitectFile,
} from "../../../../src/core/architect-files";
import type { CadPreview } from "../../../../src/core/cad-preview";
import {
  readArchitectFile,
  storeArchitectFiles,
  validateArchitectFile,
  parseArchitectDxf,
  referencePaths,
} from "./architect-storage";
import { draftSchema, type Draft } from "./model";
import {
  ArchitectRasterEditor,
  type RasterEditorHandle,
} from "./ArchitectRasterEditor";
const download = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const base64 = async (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = () => reject(new Error("Nie udało się zapakować pliku."));
    r.readAsDataURL(blob);
  });

export function KitchenArchitectFiles({
  draft,
  disabled,
  onApply,
  onDirtyChange,
}: {
  draft: Draft;
  disabled: boolean;
  onApply: (d: Draft) => void;
  onDirtyChange: (v: boolean) => void;
}) {
  const files = draft.architectFiles ?? [];
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [rasterDirty, setRasterDirty] = useState(false);
  const rasterEditor = useRef<RasterEditorHandle>(null);
  const [preview, setPreview] = useState<{
    file: ArchitectFile;
    data?: CadPreview;
    blob?: Blob;
  } | null>(null);
  const [edit, setEdit] = useState<ArchitectFile | null>(null),
    [pdfUrl, setPdfUrl] = useState("");
  const operation = useRef<AbortController | null>(null),
    live = useRef(true),
    lock = useRef(false);
  const latest = useRef({ draft, disabled });
  useEffect(() => {
    latest.current = { draft, disabled };
  }, [draft, disabled]);
  const applyAsync = (next: Draft) => {
    if (latest.current.draft !== draft || latest.current.disabled)
      throw new Error(
        "Projekt zmienił się w trakcie odczytu. Zachowano obecną wersję; ponów dodawanie lub import.",
      );
    onApply(next);
  };
  const dirty =
    rasterDirty ||
    (!!edit && JSON.stringify(edit) !== JSON.stringify(preview?.file));
  useEffect(() => {
    setRasterDirty(false);
  }, [preview]);
  useEffect(() => {
    onDirtyChange(dirty || !!busy);
    return () => onDirtyChange(false);
  }, [dirty, busy, onDirtyChange]);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      operation.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!preview?.blob || preview.file.format !== "pdf") {
      setPdfUrl("");
      return;
    }
    const u = URL.createObjectURL(
      new Blob([preview.blob], { type: "application/pdf" }),
    );
    setPdfUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [preview]);
  const start = () => {
    if (lock.current) return null;
    lock.current = true;
    operation.current?.abort();
    const c = new AbortController();
    operation.current = c;
    setError("");
    setStatus("");
    return c;
  };
  const finish = () => {
    lock.current = false;
    if (live.current) setBusy("");
  };
  const add = async (list: FileList | null) => {
    if (disabled || dirty || !list?.length) return;
    const c = start();
    if (!c) return;
    setBusy("Zapisywanie plików na tym urządzeniu…");
    const rows = [...files],
      blobs: { id: string; blob: Blob }[] = [],
      errors: string[] = [];
    try {
      for (const f of Array.from(list)) {
        if (c.signal.aborted) return;
        try {
          const format = await validateArchitectFile(f, f.name);
          const previousIndex = rows.findIndex(
            (r) => r.name === f.name && r.size === f.size,
          );
          if (previousIndex >= 0) {
            const previous = rows[previousIndex];
            let available = blobs.some((b) => b.id === previous.id);
            if (!available)
              try {
                await readArchitectFile(previous);
                available = true;
              } catch {
                /* A manifest imported without its original can be repaired. */
              }
            if (available)
              throw new Error(
                `${f.name}: taki plik jest już na liście. Zmień nazwę, jeśli jest to inna wersja.`,
              );
            const id = randomId();
            rows[previousIndex] = { ...previous, id, format };
            blobs.push({ id, blob: f });
            continue;
          }
          if (
            rows.length >= 20 ||
            rows.reduce((s, r) => s + r.size, 0) + f.size >
              ARCHITECT_TOTAL_LIMIT
          )
            throw new Error(`${f.name}: limit 20 plików i 40 MiB łącznie.`);
          const meta = architectFileSchema.parse({
            id: randomId(),
            name: f.name,
            size: f.size,
            format,
            room: "Kuchnia",
            role: "plan",
          });
          rows.push(meta);
          blobs.push({ id: meta.id, blob: f });
        } catch (e) {
          errors.push((e as Error).message);
        }
      }
      if (blobs.length) {
        await storeArchitectFiles(blobs);
        if (!c.signal.aborted) {
          applyAsync({ ...draft, architectFiles: rows });
          setStatus(
            `Dodano pliki: ${blobs.length}. Zapisano oryginały na tym urządzeniu.`,
          );
        }
      }
      if (!c.signal.aborted) setError(errors.join(" "));
    } catch (e) {
      if (!c.signal.aborted) setError((e as Error).message);
    } finally {
      finish();
    }
  };
  const open = async (file: ArchitectFile) => {
    if (disabled || dirty) return;
    const c = start();
    if (!c) return;
    setBusy("Odczytywanie pliku…");
    setPreview(null);
    setEdit(null);
    try {
      const blob = await readArchitectFile(file);
      if (c.signal.aborted) return;
      const data =
        file.format === "dxf"
          ? await parseArchitectDxf(blob, c.signal)
          : undefined;
      if (!c.signal.aborted) {
        setPreview({ file, data, blob });
        setEdit(structuredClone(file));
      }
    } catch (e) {
      if (!c.signal.aborted) setError((e as Error).message);
    } finally {
      finish();
    }
  };
  const exportBundle = async () => {
    const c = start();
    if (!c) return;
    setBusy("Przygotowanie projektu z oryginałami…");
    try {
      const originals = [];
      for (const f of files) {
        if (c.signal.aborted) return;
        originals.push({
          id: f.id,
          data: await base64(await readArchitectFile(f)),
        });
      }
      if (!c.signal.aborted) {
        download(
          new Blob(
            [
              JSON.stringify({
                type: "pan-stolarz-project",
                version: 1,
                draft,
                files: originals,
              }),
            ],
            { type: "application/json" },
          ),
          "pan-stolarz-projekt-z-plikami.json",
        );
        setStatus(
          "Pobrano projekt z oryginałami. Tę paczkę można przenieść na inne urządzenie.",
        );
      }
    } catch (e) {
      if (!c.signal.aborted) setError((e as Error).message);
    } finally {
      finish();
    }
  };
  const importBundle = async (file: File) => {
    const c = start();
    if (!c) return;
    setBusy("Wczytywanie paczki projektu…");
    try {
      if (file.size > 60 * 1024 * 1024)
        throw new Error("Paczka przekracza 60 MiB.");
      const raw = JSON.parse(await file.text());
      if (
        raw.type !== "pan-stolarz-project" ||
        raw.version !== 1 ||
        !Array.isArray(raw.files)
      )
        throw new Error("Wybierz paczkę pobraną z kreatora.");
      const next = draftSchema.parse(raw.draft);
      const meta = architectFilesSchema.parse(next.architectFiles ?? []);
      if (raw.files.length !== meta.length)
        throw new Error("Paczka nie zawiera wszystkich oryginałów.");
      const blobs = [];
      const importedMeta: ArchitectFile[] = [];
      for (const f of meta) {
        const row = raw.files.find((r: { id: string }) => r.id === f.id);
        if (
          !row ||
          typeof row.data !== "string" ||
          row.data.length > 14 * 1024 * 1024 ||
          !/^[A-Za-z0-9+/]*={0,2}$/.test(row.data)
        )
          throw new Error("Nieprawidłowa zawartość paczki.");
        const blob = new Blob([
          Uint8Array.from(atob(row.data), (c) => c.charCodeAt(0)),
        ]);
        if (
          blob.size !== f.size ||
          (await validateArchitectFile(blob, f.name)) !== f.format
        )
          throw new Error("Zawartość pliku jest niezgodna z opisem.");
        // New immutable blob IDs keep Undo and saved A/B originals intact.
        const id = randomId();
        blobs.push({ id, blob });
        importedMeta.push({ ...f, id });
      }
      if (c.signal.aborted) return;
      await storeArchitectFiles(blobs);
      if (!c.signal.aborted) {
        applyAsync({ ...next, architectFiles: importedMeta });
        setPreview(null);
        setEdit(null);
        setStatus(
          "Wczytano projekt i oryginały. Cofnij przywróci poprzedni szkic.",
        );
      }
    } catch (e) {
      if (!c.signal.aborted)
        setError(
          e instanceof SyntaxError
            ? "Nieprawidłowa paczka JSON."
            : (e as Error).message,
        );
    } finally {
      finish();
    }
  };
  let drawing: ReturnType<typeof referencePaths> | null = null;
  let drawingError = "";
  if (preview?.data && edit?.reference)
    try {
      drawing = referencePaths(preview.data, edit.reference);
    } catch (e) {
      drawingError = (e as Error).message;
    }
  const blocked = disabled || !!busy;
  const save = (next: Draft, useImageDimensions = false) => {
    let imageReference = edit?.imageReference;
    try {
      if (rasterEditor.current) imageReference = rasterEditor.current.read();
      if (useImageDimensions) {
        if (!imageReference)
          throw new Error("Włącz podkład obrazu i ustaw jego skalę.");
        const size = imageReferenceSize(imageReference);
        if (
          size.width < 1800 ||
          size.width > 8000 ||
          size.depth < 1800 ||
          size.depth > 8000
        )
          throw new Error(
            "Wymiary kuchni muszą mieścić się w zakresie 180–800 cm. Wybierz kadr jednego pomieszczenia i sprawdź skalę.",
          );
        next = {
          ...next,
          ...size,
          ...(next.layout === "u" ? { returnLength: size.width } : {}),
        };
      }
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    const parsed = edit
      ? architectFileSchema.safeParse({ ...edit, imageReference })
      : null;
    if (!parsed?.success) {
      setError("Sprawdź nazwę pomieszczenia i ustawienia podkładu.");
      return;
    }
    if (drawingError) {
      setError(drawingError);
      return;
    }
    const candidate = draftSchema.safeParse({
      ...next,
      architectFiles: files.map((f) =>
        f.id === parsed.data.id ? parsed.data : f,
      ),
    });
    if (!candidate.success) {
      setError(
        candidate.error.issues[0]?.message ?? "Sprawdź ustawienia projektu.",
      );
      return;
    }
    onApply(candidate.data);
    setPreview((p) => (p ? { ...p, file: parsed.data } : p));
    setEdit(parsed.data);
    setStatus("Zapisano opis i ustawienia pliku.");
    setError("");
  };
  return (
    <details className="kp-architect-tools">
      <summary>Wczytaj rzut / pliki architekta · {files.length} plików</summary>
      <p>
        Dodaj kilka rzutów, elewacji i instalacji. DXF, DWG, PDF, JPG i PNG: do
        10 MiB na plik, 20 plików i 40 MiB łącznie. Pliki pozostają na tym
        urządzeniu; pobierz paczkę, aby zachować je lub przekazać dalej.
      </p>
      <div
        className="kp-file-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!blocked && !dirty) void add(e.dataTransfer.files);
        }}
      >
        <label className="field">
          Dodaj pliki architekta
          <input
            aria-label="Dodaj pliki architekta"
            type="file"
            multiple
            accept=".dxf,.dwg,.pdf,.jpg,.jpeg,.png"
            disabled={blocked || dirty}
            onChange={(e) => {
              void add(e.currentTarget.files);
              e.currentTarget.value = "";
            }}
          />
        </label>
        <small>Wybierz kilka plików lub przeciągnij je tutaj.</small>
      </div>
      {files.length === 0 && (
        <p>
          Zacznij od zdjęcia lub skanu rzutu parteru / piętra (JPG, PNG), PDF
          albo DXF. Na obrazie zaznaczysz kuchnię i ustawisz skalę.
        </p>
      )}
      <ul className="kp-architect-list">
        {files.map((f) => (
          <li key={f.id}>
            <div>
              <strong>{f.name}</strong>
              <small>
                {f.room} · {architectRoles[f.role]} ·{" "}
                {(f.size / 1024).toFixed(0)} KiB
                {f.reference || f.imageReference ? " · podkład w rzucie" : ""}
              </small>
            </div>
            <div className="kp-actions">
              <button
                className="ps-button secondary"
                disabled={blocked || dirty}
                onClick={() => void open(f)}
              >
                Otwórz {f.name}
              </button>
              <button
                className="ps-text-button"
                disabled={blocked || dirty}
                onClick={async () => {
                  try {
                    download(await readArchitectFile(f), f.name);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Pobierz oryginał
              </button>
              <button
                className="ps-text-button"
                disabled={blocked || dirty}
                onClick={() => {
                  onApply({
                    ...draft,
                    architectFiles: files.filter((x) => x.id !== f.id),
                  });
                  if (preview?.file.id === f.id) {
                    setPreview(null);
                    setEdit(null);
                  }
                  setStatus("Usunięto z projektu. Cofnij przywróci plik.");
                }}
              >
                Usuń z projektu {f.name}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {preview && edit && (
        <section
          className="kp-architect-preview"
          aria-label="Podgląd pliku architekta"
        >
          <h2>{preview.file.name}</h2>
          {preview.file.format === "dwg" && (
            <Feedback>
              Oryginał DWG jest zachowany. Do podkładu i odczytu wymiarów dołącz
              eksport ASCII DXF; DWG nie jest automatycznie zamieniany na meble.
            </Feedback>
          )}
          {pdfUrl && (
            <object
              data={pdfUrl}
              type="application/pdf"
              aria-label={`PDF: ${preview.file.name}`}
            >
              <p>Podgląd PDF jest niedostępny. Użyj Pobierz oryginał.</p>
            </object>
          )}
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              save(draft);
            }}
          >
            <fieldset disabled={blocked}>
              <div className="kp-room-feature-grid">
                <label className="field">
                  Pomieszczenie
                  <input
                    maxLength={80}
                    value={edit.room}
                    onChange={(e) => setEdit({ ...edit, room: e.target.value })}
                  />
                </label>
                <label className="field">
                  Rodzaj rysunku
                  <select
                    aria-label="Rodzaj rysunku"
                    value={edit.role}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        role: e.target.value as ArchitectFile["role"],
                      })
                    }
                  >
                    {Object.entries(architectRoles).map(([v, l]) => (
                      <option value={v} key={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {preview.blob && ["jpg", "png"].includes(preview.file.format) && (
                <>
                  <ArchitectRasterEditor
                    key={`${preview.file.id}:${JSON.stringify(preview.file.imageReference)}`}
                    ref={rasterEditor}
                    blob={preview.blob}
                    initial={preview.file.imageReference}
                    onDirtyChange={setRasterDirty}
                  />
                  <button
                    type="button"
                    className="ps-button secondary"
                    onClick={() => save(draft, true)}
                  >
                    Przyjmij kadr jako wymiary pomieszczenia
                  </button>
                </>
              )}
              {preview.data && (
                <>
                  <p>{preview.data.warnings.join(" ")}</p>
                  <label className="field">
                    <input
                      type="checkbox"
                      checked={!!edit.reference}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          reference: e.target.checked
                            ? {
                                unit: preview.data!.unit ?? "mm",
                                layer: "",
                                rotation: 0,
                                x: 0,
                                y: 0,
                              }
                            : undefined,
                        })
                      }
                    />{" "}
                    Pokaż jako podkład rzutu
                  </label>
                  {!preview.data.unit && (
                    <p>
                      Brak jednostki w DXF. Wybierz ją i sprawdź wymiary przed
                      użyciem podkładu.
                    </p>
                  )}
                  {edit.reference && (
                    <>
                      <div className="kp-room-feature-grid">
                        <label className="field">
                          Jednostka DXF
                          <select
                            aria-label="Jednostka DXF"
                            value={edit.reference.unit}
                            onChange={(e) =>
                              setEdit({
                                ...edit,
                                reference: {
                                  ...edit.reference!,
                                  unit: e.target.value as NonNullable<
                                    ArchitectFile["reference"]
                                  >["unit"],
                                },
                              })
                            }
                          >
                            {["mm", "cm", "m", "in", "ft"].map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          Warstwa DXF
                          <select
                            aria-label="Warstwa DXF"
                            value={edit.reference.layer}
                            onChange={(e) =>
                              setEdit({
                                ...edit,
                                reference: {
                                  ...edit.reference!,
                                  layer: e.target.value,
                                },
                              })
                            }
                          >
                            <option value="">
                              Wszystkie obsługiwane warstwy
                            </option>
                            {[
                              ...new Set(
                                preview.data.paths.map((p) => p.layer),
                              ),
                            ].map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          Obrót podkładu
                          <select
                            aria-label="Obrót podkładu"
                            value={edit.reference.rotation}
                            onChange={(e) =>
                              setEdit({
                                ...edit,
                                reference: {
                                  ...edit.reference!,
                                  rotation: Number(e.target.value) as
                                    0 | 90 | 180 | 270,
                                },
                              })
                            }
                          >
                            {[0, 90, 180, 270].map((v) => (
                              <option key={v} value={v}>
                                {v}°
                              </option>
                            ))}
                          </select>
                        </label>
                        {(["x", "y"] as const).map((k) => (
                          <label className="field" key={k}>
                            Przesunięcie {k.toUpperCase()} (cm)
                            <input
                              type="number"
                              step="0.1"
                              value={edit.reference![k] / 10}
                              onChange={(e) =>
                                setEdit({
                                  ...edit,
                                  reference: {
                                    ...edit.reference!,
                                    [k]: Number(e.target.value) * 10,
                                  },
                                })
                              }
                            />
                          </label>
                        ))}
                      </div>
                      {drawing && (
                        <>
                          <svg
                            role="img"
                            aria-label="Podkład DXF"
                            viewBox={`${edit.reference.x - 100} ${edit.reference.y - 100} ${Math.max(200, drawing.width) + 200} ${Math.max(200, drawing.depth) + 200}`}
                            className="elev"
                          >
                            {drawing.paths.map((p, n) => (
                              <polyline
                                key={n}
                                points={p.points
                                  .map((p) => p.join(","))
                                  .join(" ")}
                                fill="none"
                                stroke="var(--text)"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                              />
                            ))}
                          </svg>
                          <p>
                            Obrys wybranej geometrii: {drawing.width / 10} ×{" "}
                            {drawing.depth / 10} cm. To granice linii, nie
                            automatycznie rozpoznane ściany. Wybierz warstwę
                            jednego pomieszczenia.
                          </p>
                          <button
                            type="button"
                            className="ps-button secondary"
                            disabled={
                              drawing.width < 1800 ||
                              drawing.width > 8000 ||
                              drawing.depth < 1800 ||
                              drawing.depth > 8000
                            }
                            onClick={() =>
                              save({
                                ...draft,
                                width: drawing!.width,
                                depth: drawing!.depth,
                                ...(draft.layout === "u"
                                  ? { returnLength: drawing!.width }
                                  : {}),
                              })
                            }
                          >
                            Przyjmij obrys jako wymiary pomieszczenia
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
              {drawingError && <Feedback>{drawingError}</Feedback>}
              <div className="kp-actions">
                <button data-save-architect className="ps-button" type="submit">
                  Zapisz ustawienia pliku
                </button>
                <button
                  className="ps-button secondary"
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setEdit(null);
                    setError("");
                  }}
                >
                  Zamknij podgląd i anuluj edycję
                </button>
              </div>
            </fieldset>
          </form>
        </section>
      )}
      <div className="kp-actions">
        <button
          className="ps-button secondary"
          disabled={blocked || dirty || !files.length}
          onClick={() => void exportBundle()}
        >
          Pobierz projekt z plikami
        </button>
        <label className="field">
          Wczytaj paczkę projektu
          <input
            type="file"
            accept=".json"
            disabled={blocked || dirty}
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              if (f) void importBundle(f);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      <p>
        PDF służy do odczytu dokumentacji; wymiary i szafki ustalasz w
        kreatorze. DXF może być wspólnym podkładem z innych plików po ustawieniu
        jednostek, warstw, obrotu i przesunięcia. Nie rozpoznajemy automatycznie
        mebli ani instalacji.
      </p>
      {busy && (
        <p role="status">
          {busy}{" "}
          <button
            type="button"
            className="ps-text-button"
            onClick={() => {
              operation.current?.abort();
              setStatus("Anulowano oczekiwanie. Projekt zachowano bez zmian.");
            }}
          >
            Anuluj odczyt
          </button>
        </p>
      )}
      {status && <p role="status">{status}</p>}
      {error && <Feedback>{error}</Feedback>}
    </details>
  );
}
