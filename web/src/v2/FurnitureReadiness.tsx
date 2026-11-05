import {
  furnitureIssues,
  type FurnitureModel,
} from "../../../src/core/furniture";
import { furnitureParts } from "../../../src/core/furniture-parts";
import { furnitureReview } from "../../../src/core/furniture-review";
import { furnitureDrawerCalculations } from "../../../src/core/furniture-drawers";
export function FurnitureReadiness({
  model,
  onPart,
}: {
  model: FurnitureModel;
  onPart: (id: string, area?: "material" | "geometry" | "drawers") => void;
}) {
  const parts = furnitureParts(model),
    missing = parts.filter((p) => p.issues.length),
    issues = furnitureIssues(model),
    review = furnitureReview(model),
    drawers = furnitureDrawerCalculations(model);
  return (
    <section
      className="fc-readiness"
      aria-label="Braki przed zamówieniem i produkcją"
    >
      <div className="fc-readiness-heading">
        <h2>Przed zamówieniem i produkcją</h2>
        <span>
          {missing.length} / {parts.length} części z brakami danych
        </span>
      </div>
      <p>
        Lista prowadzi do danych części. Uzupełnienie pól nie zastępuje
        zatwierdzenia konstrukcji i technologii.
      </p>
      <details>
        <summary>
          Geometria i dopasowanie ·{" "}
          {issues.length +
            review.collisions.length +
            review.motion.length +
            review.installation.length}{" "}
          uwag
        </summary>
        <ul>
          {issues.map((s, i) => (
            <li key={`i${i}`}>{s}</li>
          ))}
          {review.collisions.map((c, i) => (
            <li key={`c${i}`}>
              <button onClick={() => onPart(c.a, "geometry")}>
                Sprawdź przecięcie obwiedni: {c.message}
              </button>
            </li>
          ))}
          {review.motion.map((c, i) => (
            <li key={`m${i}`}>
              <button onClick={() => onPart(c.partId, "geometry")}>
                {c.message}
              </button>
            </li>
          ))}
          {review.installation.map((s, i) => (
            <li key={`n${i}`}>{s}</li>
          ))}
        </ul>
        <p>{review.method}</p>
      </details>
      <details>
        <summary>
          Materiały, obrzeża i wymiary części · {missing.length} do uzupełnienia
        </summary>
        {missing.length ? (
          <ul>
            {missing.map((p) => (
              <li key={p.id}>
                <button onClick={() => onPart(p.id)}>
                  Uzupełnij: {p.name}
                </button>
                <p>{p.issues.join("; ")}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Dane wymiarowe części uzupełnione. Sprawdź dostępność wybranych
            artykułów w przygotowaniu płyt do rozkroju.
          </p>
        )}
      </details>
      <details>
        <summary>Szuflady i okucia · {drawers.length} frontów szuflad</summary>
        {drawers.length ? (
          <ul>
            {drawers.map((d) => (
              <li key={d.frontId}>
                <button onClick={() => onPart(d.frontId, "drawers")}>
                  {d.frontName}
                </button>
                <p>{[...d.blockers, ...d.unresolved].join(" ")}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Brak frontów szuflad. Dla drzwi ustal zawiasy i sposób mocowania.
          </p>
        )}
      </details>
      <details>
        <summary>Połączenia i wiercenia · wymagają odbioru technologii</summary>
        <p>
          Biblioteka nie zawiera jeszcze zatwierdzonego kompletu połączeń,
          mocowań i operacji dla każdej części. Skrót dokumentacji pokazuje
          dostępne informacje i braki. Ten szkic nie jest zatwierdzonym wydaniem
          produkcyjnym.
        </p>
      </details>
    </section>
  );
}
