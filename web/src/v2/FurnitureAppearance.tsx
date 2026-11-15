import {
  defaultFurnitureAppearance,
  furnitureAppearancePresets,
} from "../../../src/core/furniture-appearance";
import type { FurnitureModel } from "../../../src/core/furniture";
export function FurnitureAppearance({
  model,
  disabled,
  onChange,
}: {
  model: FurnitureModel;
  disabled: boolean;
  onChange: (colors: NonNullable<FurnitureModel["appearance"]>) => void;
}) {
  const colors = model.appearance ?? defaultFurnitureAppearance;
  return (
    <fieldset disabled={disabled} className="fc-appearance">
      <legend>Kolory poglądowe 3D</legend>
      <div className="fc-appearance-fields">
        <label>
          Kolor korpusu (podgląd)
          <input
            type="color"
            value={colors.bodyColor}
            onChange={(e) => onChange({ ...colors, bodyColor: e.target.value })}
          />
        </label>
        <label>
          Kolor frontów (podgląd)
          <input
            type="color"
            value={colors.frontColor}
            onChange={(e) =>
              onChange({ ...colors, frontColor: e.target.value })
            }
          />
        </label>
        <div
          className="fc-actions"
          role="group"
          aria-label="Zestawy kolorów poglądowych"
        >
          {furnitureAppearancePresets.map((p) => (
            <button
              key={p.name}
              onClick={() =>
                onChange({ bodyColor: p.bodyColor, frontColor: p.frontColor })
              }
            >
              <span aria-hidden="true" className="fc-color-pair">
                <i style={{ background: p.bodyColor }} />
                <i style={{ background: p.frontColor }} />
              </span>
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <p>
        Kolory zapiszą się z modelem i w nowej prezentacji dla klienta. Nie
        wybierają materiałów, dekorów ani obrzeży do produkcji.
      </p>
    </fieldset>
  );
}
