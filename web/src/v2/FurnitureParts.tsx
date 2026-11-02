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
}: {
  model: FurnitureModel;
  onSelect: (id: string) => void;
}) {
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
