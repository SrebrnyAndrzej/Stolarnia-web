import { measureFurnitureParts } from "../../../src/core/furniture-measure";
import type { FurnitureModel } from "../../../src/core/furniture";
export function FurnitureMeasure({
  model,
  marked,
}: {
  model: FurnitureModel;
  marked: string[];
}) {
  const measurement = measureFurnitureParts(model, marked);
  const format = (n: number) =>
    n.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
  return (
    <section className="fc-measure-panel" aria-label="Pomiar między częściami">
      <h2>Pomiar między częściami</h2>
      {measurement ? (
        <>
          <p className="fc-measure-names">{measurement.names.join(" ↔ ")}</p>
          <output aria-label="Najmniejsza odległość między bryłami">
            <strong>{format(measurement.distance)} mm</strong>
          </output>
          <dl>
            {(["x", "y", "z"] as const).map((axis) => (
              <div key={axis}>
                <dt>Przerwa {axis.toUpperCase()}</dt>
                <dd>
                  {format(measurement.axes[axis].gap)} mm
                  {measurement.axes[axis].overlap > 0 && (
                    <small>rzuty nakładają się</small>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <details className="fc-measure-help">
            <summary>Jak czytać pomiar</summary>
            <p className="fc-hint">
              Pomiar powierzchni zamkniętego, złożonego modelu. Przerwy X/Y/Z
              dotyczą rzutów; nie są prześwitem pod dowolnym kątem. Wynik 0
              oznacza styk lub przecięcie.
            </p>
          </details>
        </>
      ) : (
        <p className="fc-hint">
          Zaznacz dokładnie dwie części na liście. Pomiar uwzględni skosy,
          grubość i położenie w głębokości.
        </p>
      )}
    </section>
  );
}
