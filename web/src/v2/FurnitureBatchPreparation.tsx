import { useEffect, useRef, useState } from "react";
import type { FurnitureEntry } from "../../../src/core/furniture";
import { plateThickness } from "../../../src/core/furniture";
import type { prepareFurnitureBatch } from "../../../src/server/furniture-batch-preparation";
import type { preparationMaterials } from "../../../src/server/furniture-preparation";
import { useResource } from "./useResource";
import { request } from "./api";
import { Feedback } from "./ui";
type Selection = {
  version: number;
  quantity: number;
  materials: Record<string, string>;
};
type Packet = ReturnType<typeof prepareFurnitureBatch>;
export function FurnitureBatchPreparation({
  library,
  active,
  onRefresh,
  loading,
}: {
  library: FurnitureEntry[];
  active: boolean;
  onRefresh: () => void;
  loading: boolean;
}) {
  const catalog = useResource<ReturnType<typeof preparationMaterials>>(
    active ? "/api/v2/furniture/materials" : null,
  );
  const [selection, setSelection] = useState<Record<string, Selection>>({}),
    [query, setQuery] = useState(""),
    [bulk, setBulk] = useState(""),
    [packet, setPacket] = useState<Packet | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [focus, setFocus] = useState("");
  const operation = useRef<AbortController | null>(null);
  const invalidate = () => {
    operation.current?.abort();
    setBusy(false);
    setPacket(null);
    setFocus("");
  };
  useEffect(() => {
    invalidate();
    return () => operation.current?.abort();
  }, [library, active]);
  const change = (
    fn: (old: Record<string, Selection>) => Record<string, Selection>,
  ) => {
    invalidate();
    setError("");
    setSelection(fn);
  };
  const selected = library.filter((e) => selection[e.id]);
  const missing = Object.keys(selection).some(
    (id) => !library.some((e) => e.id === id),
  );
  const stale =
    missing || selected.some((e) => selection[e.id].version !== e.version);
  const calculate = async () => {
    if (busy || !selected.length || stale) return;
    invalidate();
    setError("");
    setBusy(true);
    const controller = new AbortController();
    operation.current = controller;
    try {
      const result = await request<Packet>(
        "/api/v2/furniture/batch-preparation",
        {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify({
            items: selected.map((e) => ({ id: e.id, ...selection[e.id] })),
          }),
        },
      );
      if (!controller.signal.aborted) setPacket(result);
    } catch (e) {
      if (!controller.signal.aborted) setError((e as Error).message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  const download = () => {
    if (!packet) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `zestaw-plyt-${packet.checksum.slice(0, 12)}-szkic.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const focused = packet?.planning?.formatki.find((f) => f.id === focus),
    focusedSource = packet?.partSources.find((p) => p.formatkaId === focus);
  return (
    <section className="fc-batch" aria-label="Wspólny rozkrój biblioteki">
      <p>
        Wybierz zapisane modele i liczbę sztuk. Materiały przypisujesz z
        katalogu; niezapisany szkic kreatora nie wchodzi do zestawu.
      </p>
      <fieldset disabled={busy}>
        <legend>Zestaw mebli</legend>
        <p className="fc-hint">
          Maksymalnie 12 modeli, 20 sztuk każdego i 1500 płyt łącznie.
        </p>
        <div className="fc-actions">
          <button onClick={onRefresh} disabled={loading}>
            {loading ? "Wczytywanie…" : "Odśwież modele zestawu"}
          </button>
          <span>
            {selected.length} modeli ·{" "}
            {selected.reduce((n, e) => n + selection[e.id].quantity, 0)} szt.
          </span>
        </div>
        <label>
          Szukaj mebla w rozkroju
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {!library.length && (
          <p>Zapisz pierwszy mebel w bibliotece, aby przygotować zestaw.</p>
        )}
        {library.length > 0 &&
          !library.some((e) =>
            e.model.name
              .toLocaleLowerCase("pl")
              .includes(query.toLocaleLowerCase("pl")),
          ) && <p>Brak modeli pasujących do wyszukiwania.</p>}
        <div className="fc-batch-list">
          {library
            .filter((e) =>
              e.model.name
                .toLocaleLowerCase("pl")
                .includes(query.toLocaleLowerCase("pl")),
            )
            .map((entry) => {
              const choice = selection[entry.id];
              return (
                <div className="fc-batch-entry" key={entry.id}>
                  <div className="fc-batch-row">
                    <label className="fc-check">
                      <input
                        type="checkbox"
                        checked={Boolean(choice)}
                        onChange={(e) =>
                          change((old) => {
                            const next = { ...old };
                            if (e.target.checked)
                              next[entry.id] = {
                                version: entry.version,
                                quantity: 1,
                                materials: {},
                              };
                            else delete next[entry.id];
                            return next;
                          })
                        }
                      />
                      {entry.model.name} · v{entry.version}
                    </label>
                    {choice && (
                      <label>
                        Sztuki
                        <input
                          aria-label={`Sztuki: ${entry.model.name}`}
                          type="number"
                          min="1"
                          max="20"
                          step="1"
                          value={choice.quantity}
                          onChange={(e) => {
                            const value = e.target.valueAsNumber;
                            if (Number.isInteger(value))
                              change((old) => ({
                                ...old,
                                [entry.id]: {
                                  ...old[entry.id],
                                  quantity: Math.min(20, Math.max(1, value)),
                                },
                              }));
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {choice && choice.version !== entry.version && (
                    <p role="alert">
                      Zmieniona wersja.{" "}
                      <button
                        onClick={() =>
                          change((old) => ({
                            ...old,
                            [entry.id]: {
                              ...old[entry.id],
                              version: entry.version,
                              materials: {},
                            },
                          }))
                        }
                      >
                        Użyj bieżącej wersji: {entry.model.name}
                      </button>
                    </p>
                  )}
                  {choice && (
                    <details>
                      <summary>
                        Materiały części ·{" "}
                        {Object.keys(choice.materials).length}/
                        {entry.model.plates.length}
                      </summary>
                      {entry.model.plates.map((p, index) => (
                        <label key={p.id}>
                          {entry.model.name} · {index + 1}. {p.name}
                          <select
                            aria-label={`Materiał zestawu: ${entry.id}/${p.id}`}
                            value={choice.materials[p.id] ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              change((old) => {
                                const materials = {
                                  ...old[entry.id].materials,
                                };
                                if (value) materials[p.id] = value;
                                else delete materials[p.id];
                                return {
                                  ...old,
                                  [entry.id]: { ...old[entry.id], materials },
                                };
                              });
                            }}
                          >
                            <option value="">Nieprzypisany</option>
                            {catalog.data
                              ?.filter(
                                (m) =>
                                  Math.abs(
                                    m.gruboscMM -
                                      (plateThickness(entry.model, p) ?? -1),
                                  ) < 0.01,
                              )
                              .map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.nazwa} · {m.gruboscMM} mm
                                </option>
                              ))}
                          </select>
                        </label>
                      ))}
                    </details>
                  )}
                </div>
              );
            })}
        </div>
        {missing && (
          <p role="alert">
            Nie ma jednego z wybranych modeli.{" "}
            <button
              onClick={() =>
                change((old) =>
                  Object.fromEntries(
                    Object.entries(old).filter(([id]) =>
                      library.some((e) => e.id === id),
                    ),
                  ),
                )
              }
            >
              Usuń niedostępne modele z zestawu
            </button>
          </p>
        )}
      </fieldset>
      {catalog.busy ? (
        <p role="status">Wczytywanie materiałów zestawu…</p>
      ) : catalog.error ? (
        <Feedback retry={catalog.retry}>{catalog.error}</Feedback>
      ) : (
        <fieldset disabled={busy || !selected.length || stale}>
          <legend>Przypisanie zbiorcze</legend>
          <label>
            Materiał zbiorczy zestawu
            <select
              aria-label="Materiał zbiorczy zestawu"
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
            >
              <option value="">Wybierz materiał katalogowy</option>
              {catalog.data?.map((m) => (
                <option value={m.id} key={m.id}>
                  {m.nazwa} · {m.gruboscMM} mm
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={!bulk}
            onClick={() => {
              const material = catalog.data?.find((m) => m.id === bulk);
              if (!material) return;
              change((old) =>
                Object.fromEntries(
                  Object.entries(old).map(([id, choice]) => {
                    const entry = library.find((e) => e.id === id);
                    const materials = { ...choice.materials };
                    for (const p of entry?.model.plates ?? [])
                      if (
                        Math.abs(
                          material.gruboscMM -
                            (plateThickness(entry!.model, p) ?? -1),
                        ) < 0.01
                      )
                        materials[p.id] = material.id;
                    return [id, { ...choice, materials }];
                  }),
                ),
              );
            }}
          >
            Przypisz materiał do zgodnych płyt zestawu
          </button>
          <p className="fc-hint">
            Zastępuje przypisanie tylko dla zgodnej grubości. Inne grubości
            przypisz osobno. Sprawdzenie obejmuje też usłojenie i obrzeża.
          </p>
        </fieldset>
      )}
      <button
        className="ps-button"
        disabled={
          busy ||
          !selected.length ||
          stale ||
          catalog.busy ||
          !!catalog.error ||
          !catalog.data?.length
        }
        onClick={calculate}
      >
        {busy ? "Obliczanie zestawu…" : "Oblicz wspólny rozkrój"}
      </button>
      {error && <Feedback>{error}</Feedback>}
      {packet && (
        <div className="fc-batch-result">
          <p role="status">
            Zestaw {packet.checksum.slice(0, 12)} ·{" "}
            {packet.source.items.reduce((n, i) => n + i.quantity, 0)} szt. ·
            szkic do weryfikacji
          </p>
          {packet.diagnostics.length > 0 && (
            <>
              <p role="alert">
                Wspólny rozkrój wstrzymany — uzupełnij wszystkie wybrane modele.
              </p>
              <ul>
                {packet.diagnostics.map((d) => (
                  <li key={`${d.libraryId}/${d.partId}`}>
                    <strong>
                      {d.modelName} · {d.name}
                    </strong>
                    : {d.issues.join("; ")}
                  </li>
                ))}
              </ul>
            </>
          )}
          {packet.planning && (
            <>
              <div className="fc-batch-summary">
                <strong>Formatki: {packet.planning.formatki.length}</strong>
                <strong>
                  Arkusze wspólnie: {packet.comparison!.combinedSheets}
                </strong>
                <span>
                  Arkusze osobno: {packet.comparison!.separateSheets} (każda
                  sztuka oddzielnie)
                </span>
              </div>
              <p className="fc-hint">
                Porównanie dotyczy tej samej heurystyki i tych samych
                materiałów. Wynik może wymagać więcej arkuszy; nie gwarantuje
                minimum odpadu.
              </p>
              {packet.planning.rozkroj.nierozmieszczone.length > 0 && (
                <p role="alert">
                  Nierozmieszczone formatki:{" "}
                  {packet.planning.rozkroj.nierozmieszczone
                    .map((p) => `${p.etykieta}: ${p.powod}`)
                    .join("; ")}
                </p>
              )}
              {packet.planning.rozkroj.arkusze.map((sheet) => (
                <details
                  key={sheet.numer}
                  className="fc-batch-sheet"
                  open={packet.planning!.rozkroj.arkusze.length === 1}
                >
                  <summary>
                    Arkusz {sheet.numer} · {sheet.materialOpis} ·{" "}
                    {sheet.gruboscMM} mm ·{" "}
                    {sheet.wykorzystanieProcent.toFixed(1)}%
                  </summary>
                  <p>
                    {sheet.dlugoscMM} × {sheet.szerokoscMM} mm. Kliknij
                    formatkę, aby odczytać mebel i numer sztuki. Linia
                    przerywana oznacza oś usłojenia.
                  </p>
                  <svg
                    viewBox={`0 0 ${sheet.dlugoscMM} ${sheet.szerokoscMM}`}
                    role="group"
                    aria-label={`Plan arkusza ${sheet.numer}`}
                  >
                    <rect
                      width={sheet.dlugoscMM}
                      height={sheet.szerokoscMM}
                      fill="var(--panel-2)"
                      stroke="var(--line-strong)"
                    />
                    {sheet.polozenia.map((p) => {
                      const part = packet.planning!.formatki.find(
                        (f) => f.id === p.formatkaId,
                      )!;
                      const choose = () => setFocus(p.formatkaId);
                      return (
                        <g
                          key={p.formatkaId}
                          role="button"
                          tabIndex={0}
                          aria-label={`${p.etykieta} · ${p.dlugoscMM} × ${p.szerokoscMM} mm`}
                          aria-pressed={focus === p.formatkaId}
                          onClick={choose}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              choose();
                            }
                          }}
                        >
                          <rect
                            x={p.yMM}
                            y={p.xMM}
                            width={p.dlugoscMM}
                            height={p.szerokoscMM}
                            fill={
                              focus === p.formatkaId
                                ? "var(--accent)"
                                : "var(--accent-soft)"
                            }
                            stroke="var(--text)"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                          />
                          <text
                            x={p.yMM + 8}
                            y={p.xMM + 24}
                            fontSize="20"
                            fill={
                              focus === p.formatkaId
                                ? "var(--accent-text)"
                                : "var(--text)"
                            }
                            aria-hidden="true"
                          >
                            {p.etykieta.split(" · ")[0]}
                          </text>
                          {part.kierunekDekoru !== "dowolny" && (
                            <path
                              d={
                                p.obrocona
                                  ? `M${p.yMM + p.dlugoscMM / 2} ${p.xMM + 10}v${Math.max(1, p.szerokoscMM - 20)}`
                                  : `M${p.yMM + 10} ${p.xMM + p.szerokoscMM / 2}h${Math.max(1, p.dlugoscMM - 20)}`
                              }
                              stroke="var(--text)"
                              strokeDasharray="5 3"
                              strokeWidth="1"
                              vectorEffect="non-scaling-stroke"
                              aria-hidden="true"
                            />
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </details>
              ))}
              {focused && focusedSource && (
                <p role="status">
                  {focused.nazwaModulu} · {focused.etykieta} · wersja{" "}
                  {focusedSource.libraryVersion} · rdzeń{" "}
                  {focused.dlugoscCieciaMM} × {focused.szerokoscCieciaMM} mm
                </p>
              )}
              <details>
                <summary>Lista formatek zestawu</summary>
                <div className="fc-cut-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Oznaczenie</th>
                        <th>Mebel / sztuka</th>
                        <th>Rdzeń mm</th>
                        <th>Materiał</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packet.planning.formatki.map((f) => (
                        <tr key={f.id}>
                          <td>{f.etykieta}</td>
                          <td>{f.nazwaModulu}</td>
                          <td>
                            {f.dlugoscCieciaMM} × {f.szerokoscCieciaMM}
                          </td>
                          <td>{f.materialOpis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
          <p className="fc-hint">{packet.scope}</p>
          <button onClick={download}>Pobierz pakiet zestawu JSON</button>
        </div>
      )}
    </section>
  );
}
