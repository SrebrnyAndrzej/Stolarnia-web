import {
  freshConstructionStandard,
  type FurnitureModel,
  type ConstructionStandard as Standard,
} from "../../../src/core/furniture";
export function ConstructionStandard({
  model,
  disabled,
  onChange,
  onApply,
}: {
  model: FurnitureModel;
  disabled: boolean;
  onChange: (patch: Partial<Standard>) => void;
  onApply: (replace: boolean) => void;
}) {
  const s = model.construction ?? freshConstructionStandard();
  return (
    <fieldset disabled={disabled} className="fc-standard">
      <legend>Standard konstrukcji</legend>
      <p>
        {model.suggestion?.variant === "desk"
          ? "Biurko: blat nad bokami, bez dna i pełnych pleców. "
          : "Boki pełne, dno i wieniec między bokami. Głębokość korpusu obejmuje plecy; fronty są przed korpusem. "}
        Standard zapisuje się z meblem — użyj kopii z biblioteki do kolejnej
        realizacji.
      </p>
      <div className="fc-fields">
        <label>
          Plecy
          <select
            aria-label="Plecy"
            disabled={model.suggestion?.variant === "desk"}
            value={s.back}
            onChange={(e) =>
              onChange({ back: e.target.value as Standard["back"] })
            }
          >
            <option value="none">Korpus otwarty — bez pleców</option>
            <option value="applied">Plecy nakładane</option>
          </select>
        </label>
        {s.back === "applied" && (
          <label>
            Grubość pleców (mm)
            <input
              type="number"
              min={1}
              max={30}
              step={0.1}
              value={s.backThickness}
              onChange={(e) => {
                const v = e.target.valueAsNumber;
                if (Number.isFinite(v))
                  onChange({ backThickness: Math.max(1, Math.min(30, v)) });
              }}
            />
          </label>
        )}
        <label>
          Znaczenie wymiarów
          <select
            aria-label="Znaczenie wymiarów"
            value={s.dimensionMode}
            onChange={(e) =>
              onChange({
                dimensionMode: e.target.value as Standard["dimensionMode"],
              })
            }
          >
            <option value="unset">Do określenia</option>
            <option value="finished">Wymiar gotowy z obrzeżem</option>
            <option value="substrate">Wymiar rdzenia bez obrzeża</option>
          </select>
        </label>
        {(
          [
            ["bodyMaterial", "Materiał korpusu"],
            ["bodyDecor", "Dekor korpusu"],
            ["frontMaterial", "Materiał frontów"],
            ["frontDecor", "Dekor frontów"],
            ["backMaterial", "Materiał pleców"],
            ["backDecor", "Dekor pleców"],
            ["edgeMaterial", "Domyślne obrzeże"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              maxLength={120}
              value={s[key]}
              onChange={(e) => onChange({ [key]: e.target.value })}
            />
          </label>
        ))}
        <label>
          Domyślna grubość obrzeża (mm)
          <input
            type="number"
            min={0.1}
            max={10}
            step={0.1}
            value={s.edgeThickness}
            onChange={(e) => {
              const v = e.target.valueAsNumber;
              if (Number.isFinite(v))
                onChange({ edgeThickness: Math.max(0.1, Math.min(10, v)) });
            }}
          />
        </label>
      </div>
      <div className="fc-actions">
        <button onClick={() => onApply(false)}>
          Uzupełnij brakujące opisy
        </button>
        <button onClick={() => onApply(true)}>
          Zastąp opisy korpusu i frontów standardem
        </button>
      </div>
      <p>
        Domyślnie okleinujemy krawędzie przednie korpusu i wszystkie krawędzie
        frontów. Usłojenie wymaga osobnej decyzji. Własne półki i przegrody
        zachowują opisy. Zastąpienie opisów można cofnąć. Rowki, otworowanie i
        łączniki wymagają dalszego profilu technologii.
      </p>
    </fieldset>
  );
}
