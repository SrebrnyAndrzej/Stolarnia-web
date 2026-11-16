import { useEffect, useRef, useState } from "react";
import { randomId } from "../../uuid";
import { Feedback } from "../ui";
import {
  kitchenIslandSchema,
  kitchenModules,
  kitchenIssues,
  type KitchenIsland,
} from "../../../../src/core/kitchen-configuration";
import {
  islandClearances,
  islandSize,
} from "../../../../src/core/kitchen-island";
import type { Draft } from "./model";

export function KitchenIslandTools({
  draft,
  disabled,
  onApply,
  onDirtyChange,
  selected,
}: {
  draft: Draft;
  disabled: boolean;
  onApply: (d: Draft) => void;
  onDirtyChange: (v: boolean) => void;
  selected: string | null;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  const [form, setForm] = useState<KitchenIsland | undefined>(() =>
    draft.island ? structuredClone(draft.island) : undefined,
  );
  const [error, setError] = useState("");
  const dirty = JSON.stringify(form) !== JSON.stringify(draft.island);
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (selected && draft.island?.items.some((i) => i.id === selected)) {
      details.current!.open = true;
      requestAnimationFrame(() =>
        document.getElementById(`kp-island-${selected}`)?.focus(),
      );
    }
  }, [selected, draft.island]);
  const update = (patch: Partial<KitchenIsland>) =>
    form && setForm({ ...form, ...patch });
  const setSize = (count: number) =>
    setForm({
      x: Math.max(0, Math.round((draft.width - count * 600 - 36) / 2)),
      y: Math.max(0, Math.min(1800, draft.depth - 900)),
      rotation: 0,
      depth: 900,
      items: Array.from({ length: count }, (_, n) => ({
        id: randomId(),
        catalogId: n === 0 ? "base-drawers-600" : "base-shelves-600",
        wall: "a",
      })),
    });
  const active = draft.island ? islandSize(draft) : null;
  const clearance = draft.island
    ? Math.min(
        ...islandClearances(draft, kitchenModules(draft)).map(
          (c) => c.distance,
        ),
      )
    : Infinity;
  return (
    <details className="kp-island-tools" ref={details}>
      <summary>
        {draft.island
          ? `Wyspa · ${active!.length / 10} × ${draft.island.depth / 10} cm`
          : "Dodaj wyspę kuchenną"}
      </summary>
      <p>
        Szafki z drzwiami lub szufladami, blat i dekoracyjne boki oraz tył w
        cenie. Współrzędne od lewego górnego narożnika rzutu; położenie dotyczy
        całego blatu.
      </p>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          const parsed = form ? kitchenIslandSchema.safeParse(form) : null;
          if (parsed && !parsed.success) {
            setError(
              "Sprawdź wymiary wyspy i szafek. Szerokość szafki: 20–120 cm, blat: 60–120 cm głębokości.",
            );
            return;
          }
          const next = {
            ...draft,
            island: parsed?.success ? parsed.data : undefined,
          };
          const issues = kitchenIssues(next);
          if (issues.length) {
            setError(issues[0]);
            return;
          }
          onApply(next);
        }}
      >
        <fieldset disabled={disabled}>
          {!form ? (
            <div className="kp-actions">
              {[2, 3, 4].map((n) => (
                <button
                  type="button"
                  className="ps-button secondary"
                  key={n}
                  onClick={() => setSize(n)}
                >
                  Wyspa {n * 60} cm · {n} szafki
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="kp-room-feature-grid">
                {(
                  [
                    ["x", "Od lewej (cm)"],
                    ["y", "Od góry (cm)"],
                    ["depth", "Głębokość blatu (cm)"],
                  ] as const
                ).map(([key, label]) => (
                  <label className="field" key={key}>
                    {label}
                    <input
                      type="number"
                      step="0.1"
                      value={form[key] / 10}
                      onChange={(e) =>
                        update({ [key]: Number(e.target.value) * 10 })
                      }
                    />
                  </label>
                ))}
                <label className="field">
                  Obrót
                  <select
                    aria-label="Obrót"
                    value={form.rotation}
                    onChange={(e) =>
                      update({ rotation: Number(e.target.value) as 0 | 90 })
                    }
                  >
                    <option value="0">Wzdłuż ściany A</option>
                    <option value="90">Prostopadle do ściany A</option>
                  </select>
                </label>
              </div>
              <p>
                Szafki: korpus 72 cm wysokości i 56 cm głębokości. Wysokość
                robocza: cokół 10 cm + korpus 72 cm + grubość blatu.
                Nadwieszenie z tyłu wymaga sprawdzenia podparcia.
              </p>
              <div className="kp-island-cabinets">
                {form.items.map((item, n) => (
                  <div key={item.id} className="kp-island-cabinet">
                    <label className="field">
                      Szafka {n + 1} · szerokość (cm)
                      <input
                        id={`kp-island-${item.id}`}
                        type="number"
                        step="0.1"
                        value={(item.width ?? 600) / 10}
                        onChange={(e) =>
                          update({
                            items: form.items.map((i) =>
                              i.id === item.id
                                ? { ...i, width: Number(e.target.value) * 10 }
                                : i,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      Wyposażenie
                      <select
                        value={
                          item.catalogId.includes("drawers")
                            ? "drawers"
                            : "shelves"
                        }
                        onChange={(e) =>
                          update({
                            items: form.items.map((i) =>
                              i.id === item.id
                                ? {
                                    id: i.id,
                                    wall: "a",
                                    width: i.width,
                                    catalogId: `base-${e.target.value}-600`,
                                  }
                                : i,
                            ),
                          })
                        }
                      >
                        <option value="shelves">Drzwi i półki</option>
                        <option value="drawers">Szuflady</option>
                      </select>
                    </label>
                    <label className="field">
                      {item.catalogId.includes("drawers")
                        ? "Liczba szuflad"
                        : "Liczba półek"}
                      <select
                        value={
                          item.catalogId.includes("drawers")
                            ? (item.drawers ?? 3)
                            : (item.shelves ?? 1)
                        }
                        onChange={(e) =>
                          update({
                            items: form.items.map((i) =>
                              i.id === item.id
                                ? {
                                    ...i,
                                    [i.catalogId.includes("drawers")
                                      ? "drawers"
                                      : "shelves"]: Number(e.target.value),
                                  }
                                : i,
                            ),
                          })
                        }
                      >
                        {(item.catalogId.includes("drawers")
                          ? [2, 3, 4, 5, 6]
                          : [0, 1, 2, 3, 4]
                        ).map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="ps-text-button"
                      disabled={form.items.length <= 1}
                      onClick={() =>
                        update({
                          items: form.items.filter((i) => i.id !== item.id),
                        })
                      }
                    >
                      Usuń szafkę {n + 1}
                    </button>
                  </div>
                ))}
              </div>
              <div className="kp-actions">
                <button
                  type="button"
                  className="ps-button secondary"
                  disabled={form.items.length >= 8}
                  onClick={() =>
                    update({
                      items: [
                        ...form.items,
                        {
                          id: randomId(),
                          catalogId: "base-shelves-600",
                          wall: "a",
                        },
                      ],
                    })
                  }
                >
                  Dodaj szafkę do wyspy
                </button>
                <button
                  type="button"
                  className="ps-text-button"
                  onClick={() => setForm(undefined)}
                >
                  Usuń wyspę
                </button>
              </div>
            </>
          )}
          {dirty && (
            <div className="kp-actions">
              <button data-save-island className="ps-button" type="submit">
                Zastosuj wyspę
              </button>
              <button
                type="button"
                className="ps-button secondary"
                onClick={() => {
                  setForm(
                    draft.island ? structuredClone(draft.island) : undefined,
                  );
                  setError("");
                }}
              >
                Anuluj zmiany wyspy
              </button>
            </div>
          )}
        </fieldset>
      </form>
      {Number.isFinite(clearance) && (
        <p role="status">
          Najmniejsze odsunięcie od zabudowy: {clearance / 10} cm.
          {clearance < 1200
            ? " Zalecamy 120 cm miejsca do pracy; sprawdź otwieranie i przejścia."
            : " Sprawdź jeszcze otwieranie frontów i urządzeń."}
        </p>
      )}
      <p>
        Ten wariant wyspy służy do przechowywania, pracy i siedzenia. Zlew lub
        płyta na wyspie wymagają odrębnego projektu przyłączy.
      </p>
      {error && <Feedback>{error}</Feedback>}
    </details>
  );
}
