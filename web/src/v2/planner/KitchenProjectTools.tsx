import { useState } from "react";
import { kitchenFreeGaps } from "../../../../src/core/kitchen-runs";
import {
  kitchenIssues,
  kitchenModules,
  type KitchenItem,
} from "../../../../src/core/kitchen-configuration";
import { kitchenFunctionalReview } from "../../../../src/core/kitchen-functions";
import { addKitchenBlindCorner } from "../../../../src/core/kitchen-corner";
import { randomId } from "../../uuid";
import { Feedback } from "../ui";
import { wallIds, type Draft } from "./model";

export function KitchenProjectReview({
  draft,
  disabled,
  onGap,
  onSelect,
  onRoom,
}: {
  draft: Draft;
  disabled: boolean;
  onGap: (wall: KitchenItem["wall"], id: string) => void;
  onSelect: (id: string) => void;
  onRoom: () => void;
}) {
  const problems = kitchenIssues(draft),
    advice = kitchenFunctionalReview(draft).warnings;
  const gaps = wallIds(draft)
    .flatMap((w) =>
      (["base", "wall"] as const).flatMap((t) => kitchenFreeGaps(draft, w, t)),
    )
    .filter((g) => g.width >= 20);
  const modules = kitchenModules(draft);
  return (
    <details className="kp-project-review">
      <summary>
        Sprawdź projekt · {problems.length} do poprawy ·{" "}
        {advice.length + gaps.length} wskazówek
      </summary>
      {!!problems.length && (
        <>
          <h2>Do poprawy przed wyceną</h2>
          <ul>
            {problems.map((p, i) => {
              const m = modules.find((m) => p.includes(m.nazwa));
              return (
                <li key={i}>
                  <span>{p}</span>
                  <button
                    className="ps-text-button"
                    disabled={disabled}
                    onClick={() => (m ? onSelect(m.id) : onRoom())}
                  >
                    {m ? "Popraw tę szafkę" : "Pokaż pomieszczenie"}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {!!advice.length && (
        <>
          <h2>Do sprawdzenia</h2>
          <ul>
            {advice.map((p, i) => (
              <li key={i}>
                {p}{" "}
                <button
                  className="ps-text-button"
                  disabled={disabled}
                  onClick={onRoom}
                >
                  Założenia kuchni
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {!!gaps.length && (
        <>
          <h2>Wolne miejsca</h2>
          <ul>
            {gaps.map((g) => (
              <li key={g.id}>
                Ściana {g.wall.toUpperCase()} ·{" "}
                {g.tier === "wall" ? "górne" : "dolne / wysokie"} ·{" "}
                {g.width / 10} cm od {g.start / 10} cm{" "}
                <button
                  className="ps-text-button"
                  disabled={disabled}
                  onClick={() => onGap(g.wall, g.id)}
                >
                  {g.width < 200 ? "Dobierz blendę" : "Dobierz szafkę"}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {!problems.length && (
        <p>
          Nie wykryto kolizji gabarytów ani blokowania przyjętych rezerw
          otwierania. Konkretny zawias, kąt otwarcia i wentylację AGD sprawdzimy
          przy dopracowaniu projektu.
        </p>
      )}
    </details>
  );
}

export function KitchenCornerTools({
  draft,
  disabled,
  onApply,
}: {
  draft: Draft;
  disabled: boolean;
  onApply: (items: KitchenItem[]) => void;
}) {
  const [wall, setWall] = useState<"a" | "b">("a"),
    [error, setError] = useState("");
  if (draft.layout === "straight") return null;
  return (
    <details className="kp-corner-tools">
      <summary>Zabudowa narożnika L / U</summary>
      <p>
        Szafka narożna ślepa 110 × 56 cm z drzwiami 45 cm. Zastąpi końcowy
        odcinek przechowywania przed zakrętem; następna ściana zachowa
        odsunięcie 65 cm. Istniejącego AGD i słupków nie przestawiamy.
      </p>
      <label>
        Zakręt kuchni
        <select
          aria-label="Zakręt kuchni"
          value={wall}
          disabled={disabled}
          onChange={(e) => {
            setWall(e.target.value as "a" | "b");
            setError("");
          }}
        >
          <option value="a">A → B</option>
          {draft.layout === "u" && <option value="b">B → C</option>}
        </select>
      </label>
      <button
        className="ps-button secondary"
        disabled={disabled}
        onClick={() => {
          try {
            onApply(addKitchenBlindCorner(draft, wall, randomId));
            setError("");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        Zastosuj narożnik ślepy
      </button>
      <p>
        Materiały i podstawowe okucia wchodzą do wyceny. System wysuwany
        narożnika i otwieranie wymagają osobnego doboru. Cofnij przywraca
        poprzednie szafki.
      </p>
      {error && <Feedback>{error}</Feedback>}
    </details>
  );
}
