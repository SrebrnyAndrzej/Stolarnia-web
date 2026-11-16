import { kitchenFunctionalReview } from "../../../../src/core/kitchen-functions";
import type { Modul } from "../../../../src/core/types";
import type { Draft } from "./model";

export function KitchenZones({
  draft,
  onSelect,
}: {
  draft: Draft;
  onSelect: (m: Modul) => void;
}) {
  if (!draft.items.length) return null;
  const review = kitchenFunctionalReview(draft);
  const rows = [
    {
      title: "Hydraulika",
      items: [...review.sinks, ...review.dishwashers],
      text: "Woda i odpływ; zmywarka także prąd",
    },
    {
      title: "AGD i wentylacja",
      items: [...review.fridges, ...review.ovens, ...review.hoods],
      text: "Urządzenia i przyłącza dobierzesz do modeli AGD",
    },
    {
      title: "Przygotowanie",
      items: [...review.preparation]
        .sort(
          (a, b) =>
            Number(b.konstrukcja === "drawers") -
              Number(a.konstrukcja === "drawers") ||
            b.szerokoscMM - a.szerokoscMM,
        )
        .slice(0, 1),
      text: "Główny odcinek blatu roboczego",
    },
  ];
  return (
    <section className="kp-zones" aria-label="Strefy funkcjonalne kuchni">
      <div className="kp-zone-grid">
        {rows.map((row) => (
          <div key={row.title}>
            <h2>{row.title}</h2>
            {row.items.length ? (
              <ul>
                {row.items.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      className="ps-text-button"
                      onClick={() => onSelect(m)}
                    >
                      {m.konstrukcja === "oven"
                        ? "Piekarnik + płyta"
                        : m.konstrukcja === "sink"
                          ? "Zlew"
                          : m.konstrukcja === "dishwasherFront"
                            ? "Zmywarka"
                            : m.konstrukcja === "hood"
                              ? "Okap"
                              : m.konstrukcja === "refrigerator"
                                ? "Lodówka"
                                : `Blat ${m.szerokoscMM} mm`}{" "}
                      · {m.scianaId.toUpperCase()} ·{" "}
                      {m.konstrukcja === "sink"
                        ? `środek ${m.pozycjaXMM + m.szerokoscMM / 2}`
                        : `${m.pozycjaXMM}–${m.pozycjaXMM + m.szerokoscMM}`}{" "}
                      mm
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nie dodano tej strefy.</p>
            )}
            <small>{row.text}</small>
          </div>
        ))}
      </div>
      {!!review.warnings.length && (
        <details className="kp-zone-review">
          <summary>Do dopracowania · {review.warnings.length}</summary>
          <ul>
            {review.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </details>
      )}
      <p className="kp-zone-note">
        Symbole AGD są poglądowe. Plan przyłączy, wentylacja, luzy i otwieranie
        wymagają sprawdzenia po wyborze urządzeń.
      </p>
    </section>
  );
}
