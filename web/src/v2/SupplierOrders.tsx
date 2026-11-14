import { useState } from "react";
import type { WydanieMeta } from "../api";
import { Zamowienie } from "../views/Zamowienie";
import { useResource } from "./useResource";
import { Feedback } from "./ui";
function ProjectOrder({ id }: { id: string }) {
  const releases = useResource<WydanieMeta[]>(
    `/api/projekty/${encodeURIComponent(id)}/wydania`,
  );
  if (releases.busy) return <p role="status">Wczytywanie wydań…</p>;
  if (releases.error)
    return <Feedback retry={releases.retry}>{releases.error}</Feedback>;
  return (
    <div className="po-supplier-table">
      <Zamowienie key={id} pid={id} wydania={releases.data ?? []} />
    </div>
  );
}
export function SupplierOrders() {
  const projects = useResource<{ id: string; nazwa: string }[]>(
    "/api/v2/purchase-orders/projects",
  );
  const [id, setId] = useState("");
  return (
    <details className="card">
      <summary>Zestawienie projektu i dostawy</summary>
      <div className="card-b">
        <p>
          Ilości płyt, obrzeży i okuć z projektu lub wydania. Rejestruj
          zamówienie i dostawy częściowe. Te statusy nie oznaczają wysłania
          zamówienia do Mussi.
        </p>
        {projects.error ? (
          <Feedback retry={projects.retry}>{projects.error}</Feedback>
        ) : (
          <label className="field">
            Projekt do zestawienia
            <select
              className="input"
              value={id}
              aria-label="Projekt do zestawienia"
              disabled={projects.busy}
              onChange={(e) => setId(e.target.value)}
            >
              <option value="">Wybierz projekt</option>
              {projects.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nazwa}
                </option>
              ))}
            </select>
          </label>
        )}
        {id && <ProjectOrder key={id} id={id} />}
      </div>
    </details>
  );
}
