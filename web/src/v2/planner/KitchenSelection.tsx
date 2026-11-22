import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import type { Modul } from "../../../../src/core/types";
import { isUpper, wallIds, wallLength, type Draft } from "./model";
import { KitchenRunStrip } from "./KitchenRunStrip";

export function KitchenSelection({
  draft,
  wall,
  modules,
  selected,
  disabled,
  visual = false,
  onSelect,
  onMove,
}: {
  draft: Draft;
  wall: "a" | "b" | "c";
  modules: Modul[];
  selected: string | null;
  disabled: boolean;
  visual?: boolean;
  onSelect: (id: string | null, wall?: "a" | "b" | "c") => void;
  onMove: (id: string, delta: -1 | 1) => void;
}) {
  const item = draft.items.find((i) => i.id === selected);
  const peers = item
    ? draft.items.filter(
        (i) =>
          i.wall === wall && isUpper(i.catalogId) === isUpper(item.catalogId),
      )
    : [];
  const position = peers.findIndex((i) => i.id === selected);
  return (
    <div
      className="kp-selection"
      role="group"
      aria-label="Wybór i ustawianie szafek"
    >
      {wallIds(draft).length > 1 && (
        <div
          className="kp-wall-buttons"
          role="group"
          aria-label="Ściana podglądu"
        >
          {wallIds(draft).map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={wall === w}
              disabled={disabled}
              onClick={() => onSelect(null, w as typeof wall)}
            >
              Ściana {w.toUpperCase()}{" "}
              <small>
                {(wallLength(draft, w) / 10).toLocaleString("pl-PL")} cm
              </small>
            </button>
          ))}
        </div>
      )}
      {visual && (
        <details className="kp-run-picker">
          <summary>Wybór szafek w rzędzie · {modules.length}</summary>
          <KitchenRunStrip
            modules={modules}
            selected={selected}
            disabled={disabled}
            onSelect={onSelect}
          />
        </details>
      )}
      {(!visual || item) && (
        <div className="kp-selection-row">
          {visual ? (
            <span className="kp-strip-selected">
              {modules.find((m) => m.id === selected)?.nazwa}
            </span>
          ) : (
            <label htmlFor="kp-selected-cabinet">
              <span id="kp-selected-cabinet-label">Wybierz szafkę</span>
              <select
                id="kp-selected-cabinet"
                aria-labelledby="kp-selected-cabinet-label"
                value={item?.wall === wall ? (selected ?? "") : ""}
                disabled={disabled || !modules.length}
                onChange={(e) => onSelect(e.target.value || null)}
              >
                <option value="">
                  {modules.length
                    ? "Kliknij na rysunku lub wybierz z listy"
                    : "Ta ściana jest pusta — dodaj szafkę"}
                </option>
                {modules.map((m, index) => (
                  <option key={m.id} value={m.id}>
                    {index + 1}. {m.nazwa} ·{" "}
                    {(m.szerokoscMM / 10).toLocaleString("pl-PL")} cm
                    {draft.items.find((i) => i.id === m.id)?.locked
                      ? " · zablokowana"
                      : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          {item && (
            <div
              className="kp-selection-move"
              role="group"
              aria-label="Zamiana kolejności w rzędzie"
            >
              <button
                type="button"
                className="ps-button secondary"
                disabled={disabled || item.locked || position <= 0}
                onClick={() => onMove(item.id, -1)}
                aria-label="Wcześniej — zamień z poprzednią szafką"
              >
                <IconArrowLeft size={18} />
                <span>Wcześniej</span>
              </button>
              <button
                type="button"
                className="ps-button secondary"
                disabled={
                  disabled || item.locked || position >= peers.length - 1
                }
                onClick={() => onMove(item.id, 1)}
                aria-label="Później — zamień z następną szafką"
              >
                <span>Później</span>
                <IconArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
      {item?.locked && (
        <small>Odblokuj szafkę w edytorze, aby zmienić jej położenie.</small>
      )}
    </div>
  );
}
