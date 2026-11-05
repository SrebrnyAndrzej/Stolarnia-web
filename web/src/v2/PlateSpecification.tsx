import {
  freshPlateSpecification,
  plateThickness,
  type FurnitureModel,
  type FurniturePlate,
  type PlateSpecification as Specification,
} from "../../../src/core/furniture";

export function PlateSpecification({
  model,
  plate,
  onChange,
  disabled,
}: {
  model: FurnitureModel;
  plate: FurniturePlate;
  onChange: (specification: Specification) => void;
  disabled: boolean;
}) {
  const s = plate.specification ?? freshPlateSpecification();
  const set = (patch: Partial<Specification>) => onChange({ ...s, ...patch });
  const t = plateThickness(model, plate);
  return (
    <fieldset className="fc-specification" disabled={disabled}>
      <legend>Materiał i krawędzie · {plate.name}</legend>
      <label>
        Materiał płyty
        <input
          maxLength={120}
          value={s.material}
          onChange={(e) => set({ material: e.target.value })}
        />
      </label>
      <label>
        Dekor / powierzchnia
        <input
          maxLength={120}
          value={s.decor}
          onChange={(e) => set({ decor: e.target.value })}
        />
      </label>
      <label>
        Płaszczyzna płyty
        <select
          aria-label="Płaszczyzna płyty"
          value={s.face}
          onChange={(e) => {
            const face = e.target.value as Specification["face"];
            // A new local frame must not silently reinterpret existing edge/grain decisions.
            onChange({
              ...s,
              face,
              grain: "unset",
              edges: freshPlateSpecification().edges,
            });
          }}
        >
          <option value="unset">Do określenia</option>
          {plate.kind === "cap" ? (
            <option value="slope">Wieniec · U wzdłuż obrysu, V w głąb</option>
          ) : (
            <>
              <option value="xy">XY · U szerokość, V wysokość</option>
              <option value="xz">XZ · U szerokość, V głębokość</option>
              <option value="yz">YZ · U głębokość, V wysokość</option>
            </>
          )}
        </select>
      </label>
      <p>
        Grubość z geometrii:{" "}
        <strong>
          {t === null
            ? "wybierz płaszczyznę"
            : `${t.toLocaleString("pl-PL")} mm`}
        </strong>
        . Zmienisz ją w wymiarze prostopadłym do płaszczyzny; dla wieńca w
        „Grubość płyty”.
      </p>
      <label>
        Kierunek usłojenia
        <select
          aria-label="Kierunek usłojenia"
          value={s.grain}
          onChange={(e) =>
            set({ grain: e.target.value as Specification["grain"] })
          }
        >
          <option value="unset">Do określenia</option>
          <option value="none">Bez kierunku</option>
          <option value="u">Wzdłuż U</option>
          <option value="v">Wzdłuż V</option>
        </select>
      </label>
      <svg
        viewBox="0 0 260 145"
        role="img"
        aria-label="Schemat lokalnych krawędzi: U0 lewa, U1 prawa, V0 dolna, V1 górna"
        className="fc-edge-map"
      >
        <rect
          x="55"
          y="28"
          width="150"
          height="85"
          fill="none"
          stroke="currentColor"
        />
        <text x="130" y="18" textAnchor="middle">
          V1
        </text>
        <text x="130" y="132" textAnchor="middle">
          V0
        </text>
        <text x="30" y="75" textAnchor="middle">
          U0
        </text>
        <text x="230" y="75" textAnchor="middle">
          U1
        </text>
        <text x="130" y="64" textAnchor="middle">
          U →
        </text>
        <text x="130" y="88" textAnchor="middle">
          V ↑
        </text>
      </svg>
      <p>
        Schemat oznaczeń w płaszczyźnie płyty, nie widok od przodu mebla. Zmiana
        płaszczyzny wymaga ponownego wskazania usłojenia i krawędzi.
      </p>
      {(["u0", "u1", "v0", "v1"] as const).map((key) => {
        const edge = s.edges[key];
        const setEdge = (patch: Partial<typeof edge>) =>
          set({ edges: { ...s.edges, [key]: { ...edge, ...patch } } });
        return (
          <fieldset key={key}>
            <legend>Krawędź {key.toUpperCase()}</legend>
            <label>
              Obrzeże {key.toUpperCase()}
              <select
                aria-label={`Obrzeże ${key.toUpperCase()}`}
                value={edge.state}
                onChange={(e) =>
                  setEdge({ state: e.target.value as typeof edge.state })
                }
              >
                <option value="unset">Do określenia</option>
                <option value="none">Bez obrzeża</option>
                <option value="band">Okleinowana</option>
              </select>
            </label>
            {edge.state === "band" && (
              <>
                <label>
                  Oznaczenie obrzeża {key.toUpperCase()}
                  <input
                    maxLength={120}
                    value={edge.material}
                    onChange={(e) => setEdge({ material: e.target.value })}
                  />
                </label>
                <label>
                  Grubość obrzeża {key.toUpperCase()} (mm)
                  <input
                    type="number"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={edge.thickness}
                    onChange={(e) => {
                      const v = e.target.valueAsNumber;
                      if (Number.isFinite(v))
                        setEdge({ thickness: Math.min(10, Math.max(0.1, v)) });
                    }}
                  />
                </label>
              </>
            )}
          </fieldset>
        );
      })}
      <p>
        Wymiary modelu pozostają wymiarami geometrii. Obrzeża nie odejmują
        automatycznie naddatków ani nie zmieniają obrysu. To wymaga późniejszego
        profilu technologii.
      </p>
    </fieldset>
  );
}
