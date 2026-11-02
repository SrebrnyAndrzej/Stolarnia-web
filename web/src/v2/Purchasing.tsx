import { useState } from "react";
import {
  PURCHASE_UNITS,
  purchaseIssues,
  type PurchaseLine,
  type PurchaseOrder,
  type MUSSI_CONNECTION,
} from "../../../src/core/purchasing";
import { request } from "./api";
import { Feedback } from "./ui";
import { useResource } from "./useResource";
import { useDraftGuard } from "./useDraftGuard";
import "./purchasing.css";
type Project = { id: string; nazwa: string; rewizja: number };
const row = (): PurchaseLine => ({
  id: crypto.randomUUID(),
  label: "",
  sku: "",
  quantity: 1,
  unit: "arkusz",
  notes: "",
});
type Draft = Pick<
  PurchaseOrder,
  "id" | "version" | "title" | "projectId" | "projectRevision" | "lines"
>;
const fresh = (): Draft => ({
  id: crypto.randomUUID(),
  version: 0,
  title: "Nowe zamówienie",
  projectId: null,
  projectRevision: null,
  lines: [row()],
});
export function Purchasing() {
  const orders = useResource<PurchaseOrder[]>("/api/v2/purchase-orders");
  const projects = useResource<Project[]>("/api/v2/purchase-orders/projects");
  const connection = useResource<typeof MUSSI_CONNECTION>(
    "/api/v2/purchase-orders/connection",
  );
  const [draft, setDraft] = useState(fresh);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [removed, setRemoved] = useState<PurchaseLine | null>(null);
  const guard = useDraftGuard(dirty, () => setDirty(false));
  const issues = purchaseIssues(draft);
  const selectedProject = projects.data?.find((p) => p.id === draft.projectId);
  const stale =
    !!draft.projectId &&
    !!projects.data &&
    selectedProject?.rewizja !== draft.projectRevision;
  const update = (fn: (current: typeof draft) => typeof draft) => {
    setDraft(fn);
    setDirty(true);
    setError("");
    setMessage("");
  };
  const editLine = (id: string, patch: Partial<PurchaseLine>) =>
    update((d) => ({
      ...d,
      lines: d.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  const open = (order: PurchaseOrder) =>
    guard.guarded(() => {
      setDraft(structuredClone(order));
      setDirty(false);
      setRemoved(null);
      setError("");
      setMessage("");
    });
  const save = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { id, version, title, projectId, projectRevision, lines } = draft;
      const saved = await request<PurchaseOrder>("/api/v2/purchase-orders", {
        method: "PUT",
        body: JSON.stringify({
          id,
          version,
          title,
          projectId,
          projectRevision,
          lines,
        }),
      });
      setDraft(saved);
      setDirty(false);
      setMessage("Zapisano szkic zamówienia. Nie został wysłany do Mussi.");
      orders.retry();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const download = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const file = await request<{
        filename: string;
        csv: string;
        sent: false;
      }>(
        `/api/v2/purchase-orders/${encodeURIComponent(draft.id)}/export?version=${draft.version}`,
      );
      const url = URL.createObjectURL(
        new Blob([file.csv], { type: "text/csv;charset=utf-8" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(
        "Pobrano CSV koszyka. Plik nie został wysłany do Mussi i nie zawiera zlecenia rozkroju.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="ps-owner-page po-page">
      <span className="ps-eyebrow">Zakup materiałów i okuć</span>
      <h1>Zamówienia Mussi</h1>
      <p className="ps-page-intro">
        Przygotuj koszyk z indeksami Mussi, sprawdź ilości i zapisz szkic przed
        eksportem. Nie wpisujemy domyślnych cen ani indeksów za Ciebie.
      </p>
      <div className="ps-feedback" role="status">
        <strong>Automatyczne zamawianie nie jest jeszcze uruchomione.</strong>
        <p>
          {connection.error
            ? "Nie udało się sprawdzić połączenia. Wysyłka pozostaje wyłączona."
            : connection.busy
              ? "Sprawdzanie gotowości integracji…"
              : connection.data?.message}
        </p>
        <p>
          Eksport koszyka to indeks, ilość, jednostka i uwagi. Formatki z
          cięciem, okleinowaniem i usłojeniem wymagają osobnego zlecenia.
        </p>
      </div>
      <div className="po-layout">
        <aside className="po-list">
          <h2>Zapisane szkice</h2>
          <label>
            Szukaj zamówienia
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button
            className="ps-button secondary"
            disabled={busy}
            onClick={() => {
              orders.retry();
              projects.retry();
              connection.retry();
            }}
          >
            Odśwież dane
          </button>
          {orders.busy ? (
            <p role="status">Wczytywanie zamówień…</p>
          ) : orders.error ? (
            <Feedback retry={orders.retry}>{orders.error}</Feedback>
          ) : !orders.data?.length ? (
            <p>
              Nie ma zapisanych zamówień. Wypełnij koszyk i zapisz pierwszy
              szkic.
            </p>
          ) : (
            <ul>
              {orders.data
                .filter((o) =>
                  o.title
                    .toLocaleLowerCase("pl")
                    .includes(query.toLocaleLowerCase("pl")),
                )
                .map((o) => (
                  <li key={o.id}>
                    <button
                      disabled={busy}
                      aria-current={o.id === draft.id ? "true" : undefined}
                      onClick={() => open(o)}
                    >
                      <strong>{o.title}</strong>
                      <span>
                        Wersja {o.version} · {o.lines.length} pozycji
                      </span>
                      <span>Szkic · niewysłany</span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </aside>
        <div className="po-editor">
          <div className="po-actions">
            <button
              className="ps-button secondary"
              disabled={busy}
              onClick={() =>
                guard.guarded(() => {
                  setDraft(fresh());
                  setDirty(false);
                  setError("");
                  setMessage("");
                  setRemoved(null);
                })
              }
            >
              Nowe zamówienie
            </button>
            <button
              className="ps-button secondary"
              disabled={busy}
              onClick={() =>
                update((d) => ({
                  ...d,
                  id: crypto.randomUUID(),
                  version: 0,
                  title: `${d.title.slice(0, 108)} — kopia`,
                }))
              }
            >
              Utwórz kopię
            </button>
            <button className="ps-button" disabled={busy} onClick={save}>
              {busy ? "Przetwarzanie…" : "Zapisz szkic"}
            </button>
          </div>
          {error && <Feedback>{error}</Feedback>}
          {message && (
            <p className="ps-feedback" role="status">
              {message}
            </p>
          )}
          <fieldset disabled={busy}>
            <legend>Źródło i nazwa</legend>
            <label>
              Nazwa zamówienia
              <input
                maxLength={120}
                value={draft.title}
                onChange={(e) =>
                  update((d) => ({ ...d, title: e.target.value }))
                }
              />
            </label>
            <label>
              Projekt źródłowy
              <select
                aria-label="Projekt źródłowy"
                value={draft.projectId ?? ""}
                disabled={projects.busy || !!projects.error}
                onChange={(e) => {
                  const p = projects.data?.find((p) => p.id === e.target.value);
                  update((d) => ({
                    ...d,
                    projectId: p?.id ?? null,
                    projectRevision: p?.rewizja ?? null,
                  }));
                }}
              >
                <option value="">Bez powiązania z projektem</option>
                {projects.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nazwa} · rewizja {p.rewizja}
                  </option>
                ))}
              </select>
            </label>
            {projects.error && (
              <Feedback retry={projects.retry}>{projects.error}</Feedback>
            )}
            {draft.projectId && (
              <p>
                Rewizja źródłowa: {draft.projectRevision}. Powiązanie nie
                wylicza automatycznie ilości materiałów.
              </p>
            )}
            {stale && (
              <div className="ps-feedback" role="alert">
                <p>
                  Projekt zmienił się lub został usunięty. Sprawdź pozycje
                  koszyka przed zapisem i eksportem.
                </p>
                {selectedProject && (
                  <button
                    className="ps-button secondary"
                    onClick={() =>
                      update((d) => ({
                        ...d,
                        projectRevision: selectedProject.rewizja,
                      }))
                    }
                  >
                    Przyjmij bieżącą rewizję po sprawdzeniu ilości
                  </button>
                )}
              </div>
            )}
          </fieldset>
          <fieldset disabled={busy}>
            <legend>Pozycje koszyka · {draft.lines.length}</legend>
            <div className="po-lines">
              {draft.lines.map((line, i) => (
                <section
                  className="po-line"
                  key={line.id}
                  aria-label={`Pozycja ${i + 1}`}
                >
                  <h3>Pozycja {i + 1}</h3>
                  <div className="po-fields">
                    <label>
                      Nazwa pozycji
                      <input
                        maxLength={120}
                        value={line.label}
                        onChange={(e) =>
                          editLine(line.id, { label: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Indeks Mussi
                      <input
                        maxLength={100}
                        placeholder="Dokładny indeks z katalogu dostawcy"
                        value={line.sku}
                        onChange={(e) =>
                          editLine(line.id, { sku: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Ilość
                      <input
                        type="number"
                        min="0.001"
                        max="1000000"
                        step="0.001"
                        value={line.quantity}
                        onChange={(e) =>
                          editLine(line.id, {
                            quantity: Number.isFinite(e.target.valueAsNumber)
                              ? e.target.valueAsNumber
                              : 0,
                          })
                        }
                      />
                    </label>
                    <label>
                      Jednostka
                      <select
                        aria-label="Jednostka"
                        value={line.unit}
                        onChange={(e) =>
                          editLine(line.id, {
                            unit: e.target.value as PurchaseLine["unit"],
                          })
                        }
                      >
                        {PURCHASE_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="po-notes">
                      Uwagi do pozycji
                      <input
                        maxLength={300}
                        value={line.notes}
                        onChange={(e) =>
                          editLine(line.id, { notes: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <button
                    className="ps-text-button"
                    onClick={() => {
                      setRemoved(line);
                      update((d) => ({
                        ...d,
                        lines: d.lines.filter((l) => l.id !== line.id),
                      }));
                    }}
                  >
                    Usuń pozycję {i + 1}
                  </button>
                </section>
              ))}
            </div>
            <div className="po-actions">
              <button
                className="ps-button secondary"
                disabled={draft.lines.length >= 500}
                onClick={() =>
                  update((d) => ({ ...d, lines: [...d.lines, row()] }))
                }
              >
                Dodaj pozycję
              </button>
              {removed && (
                <button
                  className="ps-text-button"
                  onClick={() => {
                    const line = removed;
                    setRemoved(null);
                    update((d) => ({ ...d, lines: [...d.lines, line] }));
                  }}
                >
                  Przywróć usuniętą pozycję
                </button>
              )}
            </div>
          </fieldset>
          {issues.length > 0 && (
            <div className="ps-feedback">
              <strong>Do uzupełnienia przed eksportem:</strong>
              <ul>
                {issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="po-actions">
            <button
              className="ps-button secondary"
              disabled={
                busy || dirty || !draft.version || issues.length > 0 || stale
              }
              onClick={download}
            >
              Pobierz CSV koszyka Mussi
            </button>
            <button className="ps-button secondary" disabled>
              Automatyczne wysłanie — niedostępne
            </button>
          </div>
          <p className="po-note">
            {dirty
              ? "Niezapisane zmiany — zapisz szkic przed eksportem."
              : draft.version
                ? `Zapisana wersja ${draft.version}. Status: szkic, niewysłany.`
                : "Nowy szkic — nie został zapisany."}{" "}
            Indeksy, jednostki, ceny i dostępność wymagają sprawdzenia w
            aktualnym katalogu dostawcy.
          </p>
        </div>
      </div>
      {guard.dialog}
    </section>
  );
}
