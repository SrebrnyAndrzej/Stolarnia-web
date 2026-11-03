import { useEffect, useRef, useState } from "react";
import type { FurnitureModel } from "../../../src/core/furniture";
import { plateThickness } from "../../../src/core/furniture";
import type {
  prepareFurniture,
  preparationMaterials,
} from "../../../src/server/furniture-preparation";
import { request } from "./api";
import { useResource } from "./useResource";
import { Feedback } from "./ui";
type Packet = ReturnType<typeof prepareFurniture>;
export function FurniturePreparation({
  id,
  version,
  model,
  disabled,
  onSelect,
}: {
  id: string;
  version: number;
  model: FurnitureModel;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  const catalog = useResource<ReturnType<typeof preparationMaterials>>(
    "/api/v2/furniture/materials",
  );
  const [materials, setMaterials] = useState<Record<string, string>>({}),
    [all, setAll] = useState(""),
    [packet, setPacket] = useState<Packet | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const operation = useRef<AbortController | null>(null);
  useEffect(() => () => operation.current?.abort(), []);
  const calculate = async () => {
    if (disabled || busy) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    setError("");
    setPacket(null);
    try {
      const result = await request<Packet>(
        `/api/v2/furniture/${encodeURIComponent(id)}/preparation`,
        {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify({ version, materials }),
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
    if (!packet || disabled) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `przygotowanie-${id}-v${version}-${packet.checksum.slice(0, 8)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <fieldset disabled={disabled || busy} className="card">
      <legend>Roboczy rozkrój i pakiet części</legend>
      <p>
        Przypisz rzeczywiste materiały katalogowe. Plan obejmuje płyty zapisane
        w modelu; skrzynki szuflad, okucia, połączenia i operacje wymagają
        dalszej weryfikacji. To nie jest zlecenie cięcia ani wydanie
        produkcyjne.
      </p>
      {disabled && (
        <p>Zapisz bieżącą wersję mebla, aby przygotować spójny pakiet.</p>
      )}
      {catalog.busy ? (
        <p role="status">Wczytywanie materiałów…</p>
      ) : catalog.error ? (
        <Feedback retry={catalog.retry}>{catalog.error}</Feedback>
      ) : (
        <>
          <label className="field">
            Materiał zbiorczy
            <select
              className="input"
              aria-label="Materiał zbiorczy"
              value={all}
              onChange={(e) => setAll(e.target.value)}
            >
              <option value="">Wybierz materiał</option>
              {catalog.data?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nazwa} · {m.gruboscMM} mm
                </option>
              ))}
            </select>
          </label>
          <button
            className="ps-button secondary"
            disabled={!all}
            onClick={() => {
              const m = catalog.data?.find((x) => x.id === all);
              if (!m) return;
              setMaterials(
                Object.fromEntries(
                  model.plates
                    .map((p) => [
                      p.id,
                      Math.abs(
                        m.gruboscMM - (plateThickness(model, p) ?? -100),
                      ) < 0.01
                        ? m.id
                        : (materials[p.id] ?? ""),
                    ])
                    .filter(([, v]) => !!v),
                ),
              );
              setPacket(null);
            }}
          >
            Przypisz do części o zgodnej grubości
          </button>
          {model.plates.map((p) => (
            <label key={p.id} className="field">
              Materiał części: {p.name}
              <select
                className="input"
                aria-label={`Materiał części ${p.id}`}
                value={materials[p.id] ?? ""}
                onChange={(e) => {
                  setMaterials((old) => {
                    const next = { ...old };
                    if (e.target.value) next[p.id] = e.target.value;
                    else delete next[p.id];
                    return next;
                  });
                  setPacket(null);
                }}
              >
                <option value="">Nieprzypisany</option>
                {catalog.data?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nazwa} · {m.gruboscMM} mm
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button
            className="ps-button"
            onClick={calculate}
            disabled={!version || !catalog.data?.length}
          >
            {busy ? "Obliczanie…" : "Oblicz roboczy rozkrój"}
          </button>
        </>
      )}
      {error && <Feedback>{error}</Feedback>}
      {packet && !disabled && (
        <div role="status">
          <p>
            Wersja {packet.source.libraryVersion} · identyfikator pakietu{" "}
            {packet.checksum.slice(0, 12)}
          </p>
          {packet.diagnostics.map((d) => (
            <p key={d.partId}>
              <button
                className="ps-text-button"
                onClick={() => onSelect(d.partId)}
              >
                {d.name}
              </button>
              : {d.issues.join("; ")}
            </p>
          ))}
          {packet.planning && (
            <>
              <p>
                Formatki: {packet.planning.formatki.length} · arkusze:{" "}
                {packet.planning.rozkroj.arkusze.length} · nierozmieszczone:{" "}
                {packet.planning.rozkroj.nierozmieszczone.length}.
              </p>
              <p>
                Pakiet zawiera formatki, wynik rozkroju, zapotrzebowanie
                obrzeży, materiały i ustawienia użyte w obliczeniu.
              </p>
            </>
          )}
          {!packet.planning && (
            <p>
              Rozkrój całego modelu wstrzymany do uzupełnienia wszystkich
              części.
            </p>
          )}
          <button className="ps-button secondary" onClick={download}>
            Pobierz pakiet roboczy JSON
          </button>
        </div>
      )}
    </fieldset>
  );
}
