import {
  compartmentPresets,
  applyCompartmentPreset,
  adjacentCompartment,
  copyToAdjacent,
} from "../../../src/core/furniture-compartment-presets";
import { useEffect, useState } from "react";
import { NumberField } from "./FurnitureNumberField";
import { Feedback } from "./ui";
import {
  compartmentBoxes,
  startCompartments,
  splitCompartment,
  mergeCompartment,
  changeCompartment,
  copyCompartment,
  type CompartmentNode,
} from "../../../src/core/furniture-compartments";
import type { FurnitureModel } from "../../../src/core/furniture";
const uid = () => crypto.randomUUID();
export function FurnitureCompartments({
  model,
  selected,
  onSelect,
  onChange,
  disabled,
}: {
  model: FurnitureModel;
  selected: string;
  onSelect: (id: string) => void;
  onChange: (fn: (m: FurnitureModel) => FurnitureModel) => void;
  disabled: boolean;
}) {
  const [presetError, setPresetError] = useState("");
  const [parts, setParts] = useState(2),
    [copyFrom, setCopyFrom] = useState("");
  useEffect(() => setPresetError(""), [selected]);
  const layout = model.compartments;
  if (!layout)
    return (
      <fieldset disabled={disabled}>
        <legend>Projektowanie komór</legend>
        <p>
          Wybieraj przestrzeń i dodawaj całe wyposażenie. Uruchomienie zastąpi
          dotychczasowe wnętrze pustymi komorami; zachowa korpus i konstrukcję
          biurka. Cofnij odtwarza poprzedni model.
        </p>
        <button
          onClick={() => {
            const next = startCompartments(model, uid);
            onSelect(next.compartments!.roots[0].nodeId);
            onChange(() => next);
          }}
        >
          Rozpocznij układ komór
        </button>
      </fieldset>
    );
  const node =
    layout.nodes.find((n) => n.id === selected) ??
    layout.nodes.find((n) => n.id === layout.roots[0].nodeId)!;
  const { boxes, issues } = compartmentBoxes(model),
    box = boxes.find((b) => b.node.id === node.id);
  const parent = layout.nodes.find((n) => n.split?.children.includes(node.id));
  const patch = (p: Partial<CompartmentNode>) =>
    onChange((m) => changeCompartment(m, node.id, p, uid));
  const split = (axis: "x" | "y") =>
    onChange((m) => splitCompartment(m, node.id, axis, parts, uid));
  return (
    <fieldset disabled={disabled} className="fc-compartments">
      <legend>Komory i podziały</legend>
      <div className="fc-fields">
        <label>
          Wybierz komorę
          <select
            aria-label="Wybierz komorę"
            value={node.id}
            onChange={(e) => onSelect(e.target.value)}
          >
            {layout.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {"— ".repeat(boxes.find((b) => b.node.id === n.id)?.level ?? 0)}
                {n.name}
                {n.split ? " (podział)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nazwa komory
          <input
            value={node.name}
            maxLength={80}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </label>
        <div>
          <strong>Światło komory</strong>
          <p>
            {box
              ? `${Math.round(box.width)} × ${Math.round(box.height)} × ${Math.round(box.depth)} mm`
              : "Popraw blokady, aby obliczyć wymiary."}
          </p>
        </div>
      </div>
      {issues.length > 0 && <Feedback>{issues.join(" ")}</Feedback>}
      {parent && (
        <>
          <label className="fc-check">
            <input
              type="checkbox"
              checked={node.size !== undefined}
              onChange={(e) =>
                patch({
                  size: e.target.checked
                    ? Math.max(
                        60,
                        Math.round(
                          parent.split!.axis === "x"
                            ? (box?.width ?? 300)
                            : (box?.height ?? 300),
                        ),
                      )
                    : undefined,
                })
              }
            />
            Zablokuj {parent.split!.axis === "x" ? "szerokość" : "wysokość"} tej
            komory
          </label>
          {node.size !== undefined && (
            <NumberField
              label="Zablokowany wymiar komory"
              min={60}
              max={10000}
              value={node.size}
              onChange={(v) => patch({ size: v })}
            />
          )}
        </>
      )}
      {!node.split ? (
        <>
          <div
            className="fc-compartment-presets"
            role="group"
            aria-label="Gotowe wyposażenie komory"
          >
            <h3>Wyposaż komorę jednym kliknięciem</h3>
            <div className="fc-actions">
              {compartmentPresets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    try {
                      const next = applyCompartmentPreset(
                        model,
                        node.id,
                        p.id,
                        uid,
                      );
                      onChange(() => next);
                      setPresetError("");
                    } catch (e) {
                      setPresetError((e as Error).message);
                    }
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p>
              Zastąpi wyposażenie i front wybranej komory. Systemy szuflad
              dobierz osobno. Cofnij przywraca poprzedni układ.
            </p>
            <button
              disabled={!adjacentCompartment(model, node.id)}
              onClick={() => {
                try {
                  const next = copyToAdjacent(model, node.id, uid);
                  onChange(() => next);
                  setPresetError("");
                } catch (e) {
                  setPresetError((e as Error).message);
                }
              }}
            >
              Skopiuj do sąsiedniej komory
              {adjacentCompartment(model, node.id)
                ? `: ${adjacentCompartment(model, node.id)!.name}`
                : ""}
            </button>
            <p>
              Kopiuje rodzaj wyposażenia, liczbę elementów i ustawienia frontów;
              zachowuje wymiary komory docelowej.
            </p>
            {presetError && <Feedback>{presetError}</Feedback>}
          </div>
          <div className="fc-fields">
            <NumberField
              label="Liczba części podziału"
              min={2}
              max={8}
              value={parts}
              onChange={(v) => setParts(Math.round(v))}
            />
            <div className="fc-actions">
              <button onClick={() => split("x")}>Podziel pionowo</button>
              <button onClick={() => split("y")}>Podziel poziomo</button>
            </div>
          </div>
          <div className="fc-fields">
            <label>
              Wyposażenie komory
              <select
                aria-label="Wyposażenie komory"
                value={node.interior}
                onChange={(e) =>
                  patch({
                    interior: e.target.value as CompartmentNode["interior"],
                  })
                }
              >
                <option value="open">Otwarta komora</option>
                <option value="shelves">Równo rozmieszczone półki</option>
                <option value="drawers">Stos szuflad</option>
              </select>
            </label>
            <NumberField
              label="Liczba półek lub szuflad w komorze"
              min={1}
              max={12}
              value={node.count}
              onChange={(v) => patch({ count: Math.round(v) })}
            />
            <label>
              Front komory
              <select
                aria-label="Front komory"
                value={node.front}
                onChange={(e) =>
                  patch({ front: e.target.value as CompartmentNode["front"] })
                }
              >
                <option value="none">Bez frontu</option>
                <option value="door">Jedne drzwi</option>
                <option value="pair">Para drzwi</option>
                <option value="drawers">Fronty szuflad</option>
              </select>
            </label>
            <label>
              Strona zawiasów
              <select
                aria-label="Strona zawiasów"
                value={node.hinge}
                onChange={(e) =>
                  patch({ hinge: e.target.value as "left" | "right" })
                }
              >
                <option value="left">Lewa</option>
                <option value="right">Prawa</option>
              </select>
            </label>
            <label>
              Osadzenie frontu
              <select
                aria-label="Osadzenie frontu"
                value={node.mount}
                onChange={(e) =>
                  patch({ mount: e.target.value as "inset" | "overlay" })
                }
              >
                <option value="inset">Wpuszczany</option>
                <option value="overlay">
                  Nakładany — po pół grubości boku
                </option>
              </select>
            </label>
          </div>
          <div className="fc-fields">
            <label>
              Kopiuj wyposażenie z komory
              <select
                aria-label="Kopiuj wyposażenie z komory"
                value={copyFrom}
                onChange={(e) => setCopyFrom(e.target.value)}
              >
                <option value="">Wybierz źródło…</option>
                {layout.nodes
                  .filter((n) => n.id !== node.id && !n.split)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
              </select>
            </label>
            <div>
              <button
                disabled={!copyFrom}
                onClick={() =>
                  onChange((m) => copyCompartment(m, copyFrom, node.id, uid))
                }
              >
                Skopiuj wyposażenie
              </button>
              <button
                onClick={() =>
                  patch({ hinge: node.hinge === "left" ? "right" : "left" })
                }
              >
                Odwróć stronę drzwi
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <p>
            Podział {node.split.axis === "x" ? "pionowy" : "poziomy"}. Wybierz
            komorę podrzędną, aby ustawić wyposażenie lub blokadę wymiaru.
          </p>
          <button
            onClick={() => onChange((m) => mergeCompartment(m, node.id, uid))}
          >
            Usuń podział i wyposażenie podkomór
          </button>
        </>
      )}
      <p>
        Wymiary komór są zależne od korpusu. Blokady obejmują światło, bez
        grubości przegród. Fronty i wnętrze wybierasz oddzielnie. Zmiana układu
        startowego zastępuje układ komór; wszystkie operacje obejmuje Cofnij.
      </p>
    </fieldset>
  );
}
