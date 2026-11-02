import { NumberField } from "./FurnitureNumberField";
import {
  deskCabinetWidth,
  deskWorktopHeight,
  type FurnitureModel,
} from "../../../src/core/furniture";
export function DeskStorage({
  model,
  disabled,
  onChange,
}: {
  model: FurnitureModel;
  disabled: boolean;
  onChange: (
    patch: Partial<NonNullable<FurnitureModel["desk"]>>,
    height?: number,
  ) => void;
}) {
  const d = model.desk ?? {
    worktopHeight: deskWorktopHeight(model),
    cabinetWidth: deskCabinetWidth(model),
    hutchDepth: 300,
    side: "right",
    cabinetFront: "door",
  };
  const numeric = (
    label: string,
    value: number,
    min: number,
    max: number,
    onChange: (v: number) => void,
  ) => (
    <NumberField
      label={label}
      value={value}
      min={min}
      max={max}
      onChange={onChange}
    />
  );
  return (
    <fieldset disabled={disabled}>
      <legend>Szafka i nadstawka biurka</legend>
      <div className="fc-fields">
        <label>
          Strona szafki
          <select
            aria-label="Strona szafki"
            value={d.side}
            onChange={(e) =>
              onChange({ side: e.target.value as typeof d.side })
            }
          >
            <option value="left">Lewa</option>
            <option value="right">Prawa</option>
            <option value="both">Po obu stronach</option>
          </select>
        </label>
        {numeric("Szerokość szafki bocznej", d.cabinetWidth, 100, 3000, (v) =>
          onChange({ cabinetWidth: v }),
        )}
        <label>
          Front szafki
          <select
            aria-label="Front szafki"
            value={d.cabinetFront}
            onChange={(e) =>
              onChange({
                cabinetFront: e.target.value as typeof d.cabinetFront,
              })
            }
          >
            <option value="open">Otwarte półki</option>
            <option value="door">Drzwi</option>
            <option value="drawers">Trzy szuflady</option>
          </select>
        </label>
        {model.suggestion?.variant === "desk-hutch" && (
          <>
            {numeric(
              "Wysokość blatu roboczego",
              deskWorktopHeight(model),
              100,
              3000,
              (v) =>
                onChange(
                  { worktopHeight: v },
                  model.height + v - deskWorktopHeight(model),
                ),
            )}
            {numeric(
              "Wysokość nadstawki nad blatem",
              model.height - deskWorktopHeight(model),
              100,
              3000,
              (v) => onChange({}, deskWorktopHeight(model) + v),
            )}
            {numeric(
              "Głębokość nadstawki",
              d.hutchDepth,
              50,
              model.depth,
              (v) => onChange({ hutchDepth: v }),
            )}
          </>
        )}
      </div>
      <p>
        Szafka mieści się pod blatem po wybranej stronie. Nadstawka stoi z tyłu
        blatu; sprawdź miejsce na monitor. Zmiana typu frontu zastępuje fronty
        szafki i ich przypisania systemów, z możliwością Cofnij. Pozostałe
        ręczne korekty części pozostają zachowane.
      </p>
    </fieldset>
  );
}
