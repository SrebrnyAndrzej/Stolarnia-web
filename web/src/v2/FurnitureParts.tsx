import { useState } from "react";
import { furnitureParts } from "../../../src/core/furniture-parts";
import type { FurnitureModel } from "../../../src/core/furniture";
const size = (d: number[] | null) =>
  d
    ? d
        .map((v) => v.toLocaleString("pl-PL", { maximumFractionDigits: 2 }))
        .join(" × ")
    : "Do ustalenia";
export function FurnitureParts({
  model,
  onSelect,
  compact = false,
  selected = "",
}: {
  model: FurnitureModel;
  compact?: boolean;
  selected?: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  if (compact)
    return (
      <section className="fc-parts-browser">
        <h2>Części · {model.plates.length}</h2>
        <label>
          Szukaj części
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <ul>
          {furnitureParts(model)
            .filter((p) =>
              p.name
                .toLocaleLowerCase("pl")
                .includes(query.toLocaleLowerCase("pl")),
            )
            .map((p, i) => (
              <li key={p.id}>
                <button
                  aria-current={selected === p.id ? "true" : undefined}
                  onClick={() => onSelect(p.id)}
                >
                  <strong>
                    {i + 1}. {p.name}
                  </strong>
                  <span>{size(p.dimensions)} mm</span>
                  <small>
                    {p.issues.length
                      ? `${p.issues.length} braków danych`
                      : "Dane wymiarowe uzupełnione"}
                  </small>
                </button>
              </li>
            ))}
        </ul>
      </section>
    );
  return (
    <details className="fc-part-review">
      <summary>Zestawienie części · {model.plates.length}</summary>
      <p>
        U/V w płaszczyźnie części. Rdzeń po uwzględnieniu grubości obrzeży; bez
        naddatków obróbkowych. Skosy i kształty nieregularne wymagają
        technologii i pozostają bez automatycznego wymiaru rdzenia. Nie jest to
        lista arkuszy do zakupu. Dna i plecy skrzynek są wyszczególnione osobno
        w sekcji „Systemy szuflad”.
      </p>
      <div className="fc-cut-table">
        <table>
          <caption>Wymiary geometrii i rdzenia w mm</caption>
          <thead>
            <tr>
              <th>Część</th>
              <th>Materiał</th>
              <th>Grubość</th>
              <th>Geometria U × V</th>
              <th>Rdzeń U × V</th>
              <th>Do sprawdzenia</th>
            </tr>
          </thead>
          <tbody>
            {furnitureParts(model).map((p) => (
              <tr key={p.id}>
                <td>
                  <button onClick={() => onSelect(p.id)}>{p.name}</button>
                </td>
                <td>
                  {p.material || "Brak materiału"}
                  <br />
                  {p.decor || "Brak dekoru"}
                </td>
                <td>{p.thickness ?? "—"}</td>
                <td>{size(p.dimensions)}</td>
                <td>{size(p.substrate)}</td>
                <td>
                  {p.issues.length
                    ? p.issues.join("; ")
                    : "Dane wymiarowe uzupełnione · technologia do odbioru"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
