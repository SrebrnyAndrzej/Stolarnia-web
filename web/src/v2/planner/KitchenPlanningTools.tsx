import { useRef, useState } from "react";
import {
  kitchenPlanningSchema,
  kitchenWalls,
  suggestKitchen,
} from "../../../../src/core/kitchen-configuration";
import { randomId } from "../../uuid";
import { Feedback } from "../ui";
import type { Draft } from "./model";

export function KitchenPlanningTools({
  draft,
  disabled,
  onApply,
  prepareDraft,
  wholeKitchen = false,
}: {
  draft: Draft;
  disabled: boolean;
  onApply: (next: Draft) => void;
  prepareDraft?: () => Draft | undefined;
  wholeKitchen?: boolean;
}) {
  const waterPoint = draft.features?.find((f) => f.kind === "water");
  const [waterWall, setWaterWall] = useState(
    waterPoint?.wall ?? draft.planning?.waterWall ?? "auto",
  );
  const [sinkCenter, setSinkCenter] = useState(
    String(waterPoint?.x ?? draft.planning?.sinkCenter ?? ""),
  );
  const [dishwasher, setDishwasher] = useState(
    draft.planning?.dishwasher ?? "600",
  );
  const [error, setError] = useState("");
  const settings = useRef<HTMLDetailsElement>(null),
    first = useRef<HTMLSelectElement>(null);
  const fail = (message: string) => {
    setError(message);
    if (settings.current) settings.current.open = true;
    first.current?.focus();
  };
  return (
    <form
      className="kp-planning-tools"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = kitchenPlanningSchema.safeParse({
          waterWall,
          dishwasher,
          ...(sinkCenter.trim() ? { sinkCenter: Number(sinkCenter) } : {}),
        });
        if (!parsed.success) {
          fail(
            "Środek zlewu podaj w całych milimetrach od początku wskazanej ściany (300–7700 mm) albo pozostaw Auto.",
          );
          return;
        }
        try {
          const prepared = prepareDraft ? prepareDraft() : draft;
          if (!prepared) return;
          const next = { ...prepared, planning: parsed.data };
          onApply({ ...next, items: suggestKitchen(next, randomId) });
          setError("");
        } catch (problem) {
          fail(
            problem instanceof Error
              ? problem.message
              : "Nie udało się ułożyć kuchni.",
          );
        }
      }}
    >
      <details ref={settings}>
        <summary>Założenia kuchni · AGD i hydraulika</summary>
        <fieldset disabled={disabled}>
          <legend>Strefa zmywania</legend>
          {waterPoint && (
            <p>
              Środek zlewu wyznacza punkt wody. Jego położenie zmienisz w sekcji
              Okna, drzwi i przyłącza.
            </p>
          )}
          <label>
            Ściana zlewu
            <select
              aria-label="Ściana zlewu"
              ref={first}
              disabled={!!waterPoint}
              value={waterWall}
              onChange={(e) => {
                setWaterWall(e.target.value as typeof waterWall);
                setError("");
              }}
              aria-invalid={!!error}
              aria-describedby={
                error ? "kp-planning-error" : "kp-planning-help"
              }
            >
              <option value="auto">Auto · wybierz układ</option>
              {kitchenWalls(draft).map((w) => (
                <option key={w} value={w}>
                  Ściana {w.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <label>
            Środek zlewu od początku ściany (mm)
            <input
              inputMode="numeric"
              disabled={!!waterPoint}
              placeholder="Auto"
              value={sinkCenter}
              onChange={(e) => {
                setSinkCenter(e.target.value);
                setError("");
              }}
              aria-invalid={!!error}
              aria-describedby={
                error
                  ? "kp-planning-error kp-planning-help"
                  : "kp-planning-help"
              }
            />
          </label>
          <label>
            Zmywarka
            <select
              aria-label="Zmywarka"
              value={dishwasher}
              onChange={(e) => {
                setDishwasher(e.target.value as typeof dishwasher);
                setError("");
              }}
            >
              <option value="600">600 mm</option>
              <option value="450">450 mm</option>
              <option value="none">Bez zmywarki</option>
            </select>
          </label>
        </fieldset>
        <p id="kp-planning-help">
          Zmywarka obok zlewu, osobny blat do przygotowania, piekarnik z płytą i
          okapem oraz lodówka na końcu ciągu. Środek zlewu to założenie jego
          położenia, nie punkt wykonania przyłączy. Auto ze wpisanym środkiem
          używa ściany A.
        </p>
      </details>
      <button
        className={`ps-button ${wholeKitchen ? "" : "secondary"} kp-suggestion`}
        disabled={disabled}
        type="submit"
      >
        {wholeKitchen
          ? draft.items.length
            ? "Zastąp całą kuchnię"
            : "Ułóż całą kuchnię"
          : draft.items.length
            ? "Zastąp proponowanym układem"
            : "Wstaw proponowany układ"}
      </button>
      {error && (
        <Feedback>
          <p id="kp-planning-error">{error}</p>
        </Feedback>
      )}
    </form>
  );
}
