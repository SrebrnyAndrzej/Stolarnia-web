import type {
  FurnitureModel,
  FurniturePlate,
} from "../../../src/core/furniture";
import {
  frontHardware,
  type FrontHardware,
} from "../../../src/core/front-hardware";
import { NumberField } from "./FurnitureNumberField";
import { frontHardwarePrint } from "./front-hardware-document";
export function FurnitureHardware({
  model,
  plate,
  disabled,
  onChange,
}: {
  model: FurnitureModel;
  plate: FurniturePlate;
  disabled: boolean;
  onChange: (p: FrontHardware | undefined) => void;
}) {
  const p = plate.frontHardware ?? { kgPerM2: 8, mirrorKgPerM2: 0 },
    r = frontHardware(model, plate);
  const set = (patch: Partial<FrontHardware>) => onChange({ ...p, ...patch });
  const size = (n: number) =>
    n.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
  return (
    <section className="fc-hardware" aria-label="Okucia i wiercenia frontu">
      <h2>{plate.name} · okucia</h2>
      <p>
        Plan ręczny · do sprawdzenia z kartą okucia. Rzut od przodu, wiercenie
        od tyłu płyty. Nie obejmuje wiercenia lustra.
      </p>
      <fieldset disabled={disabled}>
        <legend>Rozmieszczenie</legend>
        {plate.kind === "door" && (
          <label className="fc-check">
            <input
              type="checkbox"
              checked={!!p.hinges}
              onChange={(e) =>
                set({
                  hinges: e.target.checked
                    ? {
                        count: 4,
                        side: "left",
                        axis: 22.5,
                        bottom: 100,
                        top: 100,
                        diameter: 35,
                        depth: 13,
                        clearance: 30,
                        source: "",
                      }
                    : undefined,
                })
              }
            />
            Planuj zawiasy
          </label>
        )}
        <label className="fc-check">
          <input
            type="checkbox"
            checked={!!p.handle}
            onChange={(e) =>
              set({
                handle: e.target.checked
                  ? {
                      x: plate.width / 2,
                      y: plate.height / 2,
                      pitch: 128,
                      vertical: false,
                      diameter: 5,
                      source: "",
                    }
                  : undefined,
              })
            }
          />
          Planuj uchwyt / gałkę
        </label>
        {p.hinges && (
          <details>
            <summary>Zawiasy · {p.hinges.count} szt.</summary>
            <div className="fc-fields">
              <label>
                Krawędź zawiasów
                <select
                  aria-label="Krawędź zawiasów"
                  value={p.hinges.side}
                  onChange={(e) =>
                    set({
                      hinges: {
                        ...p.hinges!,
                        side: e.target.value as "left" | "right",
                      },
                    })
                  }
                >
                  <option value="left">Lewa w rzucie od przodu</option>
                  <option value="right">Prawa w rzucie od przodu</option>
                </select>
              </label>
              {(
                [
                  { key: "count", label: "Liczba zawiasów", min: 2, max: 8 },
                  {
                    key: "axis",
                    label: "Oś puszki od krawędzi (mm)",
                    min: 1,
                    max: 1000,
                  },
                  {
                    key: "bottom",
                    label: "Dolna oś od dołu (mm)",
                    min: 1,
                    max: 10000,
                  },
                  {
                    key: "top",
                    label: "Górna oś od góry (mm)",
                    min: 1,
                    max: 10000,
                  },
                  {
                    key: "diameter",
                    label: "Średnica puszki (mm)",
                    min: 1,
                    max: 100,
                  },
                  {
                    key: "depth",
                    label: "Głębokość puszki (mm)",
                    min: 1,
                    max: 100,
                  },
                  {
                    key: "clearance",
                    label: "Strefa kontrolna przy półce (mm)",
                    min: 0,
                    max: 200,
                  },
                ] as const
              ).map((f) => (
                <NumberField
                  key={f.key}
                  label={f.label}
                  value={p.hinges![f.key]}
                  min={f.min}
                  max={f.max}
                  onChange={(v) =>
                    set({
                      hinges: {
                        ...p.hinges!,
                        [f.key]: f.key === "count" ? Math.round(v) : v,
                      },
                    })
                  }
                />
              ))}
            </div>
            <label>
              Model zawiasu / źródło
              <input
                maxLength={160}
                value={p.hinges.source}
                onChange={(e) =>
                  set({ hinges: { ...p.hinges!, source: e.target.value } })
                }
              />
            </label>
            <small>
              Wartości startowe są robocze. Liczbę i wymiary potwierdź dla masy
              frontu i konkretnego okucia.
            </small>
          </details>
        )}
        {p.handle && (
          <details>
            <summary>Uchwyt / gałka</summary>
            <div className="fc-fields">
              {(
                [
                  {
                    key: "x",
                    label: "Środek uchwytu od lewej (mm)",
                    max: 10000,
                  },
                  {
                    key: "y",
                    label: "Środek uchwytu od dołu (mm)",
                    max: 10000,
                  },
                  {
                    key: "pitch",
                    label: "Rozstaw uchwytu (0 = gałka)",
                    max: 2000,
                  },
                  {
                    key: "diameter",
                    label: "Średnica otworów uchwytu (mm)",
                    max: 50,
                  },
                ] as const
              ).map((f) => (
                <NumberField
                  key={f.key}
                  label={f.label}
                  value={p.handle![f.key]}
                  min={f.key === "diameter" ? 1 : 0}
                  max={f.max}
                  onChange={(v) =>
                    set({ handle: { ...p.handle!, [f.key]: v } })
                  }
                />
              ))}
            </div>
            <label className="fc-check">
              <input
                type="checkbox"
                checked={p.handle.vertical}
                onChange={(e) =>
                  set({ handle: { ...p.handle!, vertical: e.target.checked } })
                }
              />
              Uchwyt pionowo
            </label>
            <label>
              Model uchwytu / źródło
              <input
                maxLength={160}
                value={p.handle.source}
                onChange={(e) =>
                  set({ handle: { ...p.handle!, source: e.target.value } })
                }
              />
            </label>
            <small>
              Otwory przelotowe w płycie. Długość śrub dobierz osobno.
            </small>
          </details>
        )}
        <details>
          <summary>Masa frontu · bez automatycznego doboru zawiasów</summary>
          <NumberField
            label="Masa płyty (kg/m²)"
            value={p.kgPerM2}
            max={100}
            onChange={(v) => set({ kgPerM2: v })}
          />
          <NumberField
            label="Dodatkowa masa lustra (kg/m²)"
            value={p.mirrorKgPerM2}
            max={100}
            onChange={(v) => set({ mirrorKgPerM2: v })}
          />
          <p>
            Szacowana masa:{" "}
            {size(
              ((plate.width * plate.height) / 1e6) *
                (p.kgPerM2 + p.mirrorKgPerM2),
            )}{" "}
            kg. Podaj dane materiałów; nie jest to dobór nośności.
          </p>
        </details>
        {plate.frontHardware && (
          <button onClick={() => onChange(undefined)}>
            Usuń plan okuć z frontu
          </button>
        )}
      </fieldset>
      {!!r.issues.length && (
        <div role="alert" className="ps-feedback">
          <strong>Rysunek otworów wstrzymany</strong>
          <ul>
            {r.issues.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {!!r.warnings.length && (
        <details>
          <summary>Do sprawdzenia</summary>
          <ul>
            {r.warnings.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </details>
      )}
      {!!r.holes.length && (
        <>
          <button
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([frontHardwarePrint(model, plate.id)], {
                  type: "text/html;charset=utf-8",
                }),
              );
              const link = document.createElement("a");
              link.href = url;
              link.download = `karta-frontu-${plate.id}.html`;
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            Pobierz kartę do druku
          </button>
          <svg
            viewBox={`-45 -45 ${plate.width + 90} ${plate.height + 90}`}
            role="img"
            aria-label="Rozmieszczenie otworów frontu"
          >
            <rect
              x={0}
              y={0}
              width={plate.width}
              height={plate.height}
              fill="var(--panel)"
              stroke="var(--text)"
            />
            {r.holes.map((h, i) => (
              <g key={i}>
                <circle
                  cx={h.x}
                  cy={plate.height - h.y}
                  r={h.diameter / 2}
                  fill="none"
                  stroke="var(--text)"
                  strokeWidth={2}
                />
                <text
                  x={h.x + 25}
                  y={plate.height - h.y + 5}
                  fontSize={Math.max(14, plate.height / 20)}
                  fill="var(--text)"
                >
                  {i + 1}
                </text>
              </g>
            ))}
          </svg>
          <p>
            Baza: lewa i dolna krawędź rzutu od przodu. Przy obróbce od tyłu
            zachowaj oznaczenie krawędzi. Wszystkie wartości w mm.
          </p>
          <details>
            <summary>Pozycje otworów · {r.holes.length}</summary>
            <ol className="fc-hole-list">
              {r.holes.map((h, i) => (
                <li key={i}>
                  {h.kind === "hinge" ? "Puszka" : "Uchwyt"}: X {size(h.x)} · Y{" "}
                  {size(h.y)} · Ø{size(h.diameter)} ·{" "}
                  {h.kind === "handle" ? "przelot" : `gł. ${size(h.depth)}`}
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
    </section>
  );
}
