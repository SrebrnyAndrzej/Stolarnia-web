import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconChevronRight,
  IconCube,
  IconFileDescription,
  IconFolder,
  IconPlus,
  IconSearch,
  IconX,
  IconRulerMeasure,
} from "@tabler/icons-react";
import { Widok3D } from "../views/Widok3D";
import { Rzut } from "../views/Rzut";
import { Elewacja } from "../views/Elewacja";
import type { Analiza } from "../api";
import { NAZWY_STATUSOW } from "../../../src/core/statusy";
import { Feedback } from "./ui";
import { useResource } from "./useResource";
import { demoProject, demoProjects } from "./demo";
import {
  currency,
  date,
  type Principal,
  type ProjectSummary,
  type TechnicalAnalysis,
} from "./api";

class CanvasBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="ps-empty">
        <IconCube size={32} />
        <p>Podgląd 3D nie jest dostępny na tym urządzeniu. Wybierz rzut 2D.</p>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function Workspace({
  person,
  demo,
}: {
  person: Principal;
  demo: boolean;
}) {
  const owner = person.role === "owner";
  const list = useResource<ProjectSummary[]>(
    demo ? null : "/api/v2/projects",
    demoProjects,
  );
  const params = new URLSearchParams(location.hash.split("?")[1] ?? "");
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(params.get("projekt") ?? "");
  const [newProject, setNewProject] = useState(false);
  const projects = list.data ?? [];
  const visible = projects.filter(
    (p) =>
      p.nazwa.toLocaleLowerCase("pl").includes(query.toLocaleLowerCase("pl")) &&
      (filter === "all" ||
        (filter === "done"
          ? p.status === "zakonczony"
          : p.status !== "zakonczony")),
  );
  const id = visible.some((p) => p.id === selected)
    ? selected
    : (visible[0]?.id ?? "");
  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (id) next.set("projekt", id);
    history.replaceState(
      null,
      "",
      `${location.hash.split("?")[0]}${next.size ? `?${next}` : ""}`,
    );
  }, [id, query]);
  return (
    <div className="ps-workspace">
      <section className="ps-project-list">
        <div className="ps-list-heading">
          <h1>{person.role === "client" ? "Moje projekty" : "Projekty"}</h1>
          {owner && !demo && (
            <button
              className="ps-icon-button primary"
              aria-label="Utwórz nowy projekt"
              onClick={() => setNewProject(true)}
            >
              <IconPlus size={22} />
            </button>
          )}
        </div>
        <div className="ps-search">
          <IconSearch size={17} />
          <input
            type="search"
            aria-label="Szukaj projektów"
            placeholder="Szukaj projektu…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              aria-label="Wyczyść wyszukiwanie"
              onClick={() => setQuery("")}
            >
              <IconX size={16} />
            </button>
          )}
        </div>
        <div className="ps-filters" role="group" aria-label="Status projektów">
          {[
            ["all", "Wszystkie"],
            ["active", "W trakcie"],
            ["done", "Zakończone"],
          ].map(([v, label]) => (
            <button
              key={v}
              aria-pressed={filter === v}
              onClick={() => setFilter(v)}
            >
              {label}
            </button>
          ))}
        </div>
        {list.busy ? (
          <p className="ps-loading" role="status">
            Wczytywanie projektów…
          </p>
        ) : list.error ? (
          <Feedback retry={list.retry}>{list.error}</Feedback>
        ) : visible.length ? (
          <ul className="ps-project-items">
            {visible.map((p) => (
              <li key={p.id}>
                <button
                  className={p.id === id ? "selected" : ""}
                  onClick={() => setSelected(p.id)}
                  aria-pressed={p.id === id}
                >
                  <span className="ps-project-thumb">
                    {demo && p.id === "pokaz-kuchnia" ? (
                      <img src="/images/kitchen-concept.png" alt="" />
                    ) : (
                      <IconFolder size={26} stroke={1.3} />
                    )}
                  </span>
                  <span>
                    <strong>{p.nazwa}</strong>
                    <small>{date(p.zmieniono)}</small>
                    <span className={`ps-status ${p.status}`}>
                      {NAZWY_STATUSOW[p.status]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="ps-list-empty">
            <IconFolder size={29} />
            <p>
              {projects.length
                ? "Nie ma projektów pasujących do wyszukiwania."
                : person.role === "owner"
                  ? "Nie masz jeszcze projektów."
                  : "Nie udostępniono Ci jeszcze projektów."}
            </p>
            {query && (
              <button className="ps-text-button" onClick={() => setQuery("")}>
                Wyczyść wyszukiwanie
              </button>
            )}
          </div>
        )}
        <div className="ps-list-footer">
          {demo
            ? "Projekty demonstracyjne"
            : person.role === "employee"
              ? "Projekty udostępnione przez właściciela"
              : "Pan Stolarz · przestrzeń projektów"}
        </div>
      </section>
      {id ? (
        <ProjectDetail
          key={`${person.user_id}-${id}`}
          id={id}
          owner={owner}
          demo={demo}
        />
      ) : (
        <section className="ps-empty ps-workspace-empty">
          <IconFolder size={45} stroke={1.2} />
          <h2>Tu zaczyna się projekt</h2>
          <p>
            {query
              ? "Zmień wyszukiwanie, aby zobaczyć projekt."
              : "Po wybraniu projektu zobaczysz jego podgląd, wymiary i materiały."}
          </p>
        </section>
      )}
      {newProject && (
        <NewProject
          onClose={() => {
            setNewProject(false);
            list.retry();
          }}
        />
      )}
    </div>
  );
}
function ProjectDetail({
  id,
  owner,
  demo,
}: {
  id: string;
  owner: boolean;
  demo: boolean;
}) {
  const demoData = useMemo(
    () => (demo ? demoProject(id) : undefined),
    [demo, id],
  );
  const technical = useResource<TechnicalAnalysis>(
    demo ? null : `/api/v2/projects/${encodeURIComponent(id)}`,
    demoData,
  );
  const financial = useResource<Analiza>(
    owner && !demo ? `/api/projekty/${encodeURIComponent(id)}/analiza` : null,
  );
  const [view, setView] = useState<"image" | "3d" | "2d">(
    demo && id === "pokaz-kuchnia" ? "image" : "2d",
  );
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [wall, setWall] = useState("");
  const [roomId, setRoomId] = useState("");
  const a = technical.data;
  const mats = useMemo(
    () => new Map((a?.materialy ?? []).map((m) => [m.id, m])),
    [a],
  );
  if (technical.busy)
    return (
      <section className="ps-empty" role="status">
        Wczytywanie projektu…
      </section>
    );
  if (technical.error)
    return <Feedback retry={technical.retry}>{technical.error}</Feedback>;
  if (!a) return null;
  const p = a.projekt;
  const room =
    p.pomieszczenia.find((r) => r.id === roomId) ?? p.pomieszczenia[0];
  const wallId =
    room?.sciany.find((w) => w.id === wall)?.id ?? room?.sciany[0]?.id ?? "";
  const price = financial.data?.warianty.find((w) => w.wariant === "standard");
  const priceIncomplete = price?.pozycje.some(
    (p) => p.jestBledemWyceny || /domyśln|brak aktywnej/.test(p.uwagi),
  );
  return (
    <>
      <section className="ps-project-canvas">
        <div className="ps-breadcrumb">
          Projekty <IconChevronRight size={14} />
          <span>{p.nazwa}</span>
        </div>
        <div className="ps-canvas-heading">
          <h2>{p.nazwa}</h2>
          <span className={`ps-status ${p.status}`}>
            {NAZWY_STATUSOW[p.status]}
          </span>
        </div>
        {room ? (
          <>
            <div className="ps-canvas-toolbar">
              <div
                className="ps-segment"
                role="group"
                aria-label="Widok projektu"
              >
                {demo && id === "pokaz-kuchnia" && (
                  <button
                    aria-pressed={view === "image"}
                    onClick={() => setView("image")}
                  >
                    Inspiracja
                  </button>
                )}
                <button
                  aria-pressed={view === "3d"}
                  onClick={() => setView("3d")}
                >
                  3D
                </button>
                <button
                  aria-pressed={view === "2d"}
                  onClick={() => setView("2d")}
                >
                  Rzut 2D
                </button>
              </div>
              {p.pomieszczenia.length > 1 && (
                <label className="ps-room-select">
                  Pomieszczenie
                  <select
                    value={room.id}
                    onChange={(e) => {
                      setRoomId(e.target.value);
                      setWall("");
                      setSelectedModule(null);
                    }}
                  >
                    {p.pomieszczenia.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nazwa}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <div className={`ps-visual ${view}`}>
              {view === "image" ? (
                <figure>
                  <img
                    src="/images/kitchen-concept.png"
                    alt="Poglądowa wizualizacja kuchni — inspiracja niezależna od modelu 3D"
                  />
                  <figcaption>
                    Wizualizacja poglądowa. Model z silnika zobaczysz w zakładce
                    3D.
                  </figcaption>
                </figure>
              ) : view === "3d" ? (
                <CanvasBoundary key={room.id}>
                  <Widok3D
                    analiza={a}
                    pomieszczenieId={room.id}
                    scianaId={wallId}
                    wybrany={selectedModule}
                    matMap={mats}
                    onWybierz={setSelectedModule}
                  />
                </CanvasBoundary>
              ) : (
                <Rzut
                  analiza={a}
                  pomieszczenieId={room.id}
                  scianaId={wallId}
                  wybrany={selectedModule}
                  matMap={mats}
                  onSciana={setWall}
                  onWybierz={setSelectedModule}
                />
              )}
            </div>
            <div className="ps-technical-heading">
              <div>
                <IconRulerMeasure size={19} />
                <h3>Układ i wymiary</h3>
              </div>
              <span>Wszystkie wymiary w mm</span>
            </div>
            <div
              className="ps-wall-buttons"
              role="group"
              aria-label="Wybierz ścianę"
            >
              {room.sciany.map((w) => (
                <button
                  key={w.id}
                  aria-pressed={wallId === w.id}
                  onClick={() => setWall(w.id)}
                >
                  {w.nazwa}
                  <span>{w.dlugoscMM.toLocaleString("pl-PL")} mm</span>
                </button>
              ))}
            </div>
            <div className="ps-elevation">
              <Elewacja
                readOnly
                analiza={a}
                scianaId={wallId}
                dlugosc={
                  room.sciany.find((w) => w.id === wallId)?.dlugoscMM ?? 3200
                }
                wysokosc={
                  room.sciany.find((w) => w.id === wallId)?.wysokoscMM ?? 2600
                }
                matMap={mats}
                blatId={room.materialBlatuId}
                wybrany={selectedModule}
                onWybierz={setSelectedModule}
              />
            </div>
            <div className="ps-module-table">
              <h3>Moduły projektu</h3>
              <p>Wybierz moduł, aby zaznaczyć go w podglądzie.</p>
              <div className="ps-module-grid">
                {p.moduly
                  .filter((m) => m.scianaId === wallId)
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModule(m.id)}
                      aria-pressed={m.id === selectedModule}
                    >
                      <strong>{m.nazwa}</strong>
                      <span>
                        {m.szerokoscMM} × {m.wysokoscMM} × {m.glebokoscMM} mm
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </>
        ) : (
          <div className="ps-empty">
            <h3>Projekt nie ma jeszcze pomieszczeń</h3>
            <p>
              {owner
                ? "Otwórz projektant, aby dodać układ."
                : "Właściciel uzupełni dane projektu."}
            </p>
          </div>
        )}
      </section>
      <aside className="ps-project-inspector">
        <h2>Projekt</h2>
        <dl className="ps-detail-list">
          <div>
            <dt>Nazwa</dt>
            <dd>{p.nazwa}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`ps-status ${p.status}`}>
                {NAZWY_STATUSOW[p.status]}
              </span>
            </dd>
          </div>
          <div>
            <dt>Ostatnia zmiana</dt>
            <dd>{date(p.zmieniono)}</dd>
          </div>
          <div>
            <dt>Wersja projektu</dt>
            <dd>{p.rewizja}</dd>
          </div>
        </dl>
        <section>
          <h3>Wymiary pomieszczenia</h3>
          {room?.sciany.map((w) => (
            <div className="ps-inspector-measure" key={w.id}>
              <span>{w.nazwa}</span>
              <strong>{w.dlugoscMM.toLocaleString("pl-PL")} mm</strong>
            </div>
          ))}
        </section>
        <section>
          <h3>Zastosowane materiały</h3>
          {a.materialy.length ? (
            a.materialy.map((m) => (
              <div className="ps-material-item" key={m.id}>
                <span
                  className="ps-material-swatch"
                  style={{
                    backgroundColor: /^#[0-9a-f]{3,8}$/i.test(m.kolorHEX)
                      ? m.kolorHEX
                      : "#eeeeee",
                  }}
                />
                <div>
                  <strong>{m.nazwa}</strong>
                  <small>
                    {[m.producent, m.kod].filter(Boolean).join(" · ")}
                    {m.gruboscMM ? ` · ${m.gruboscMM} mm` : ""}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <p className="ps-muted">Materiały nie zostały jeszcze określone.</p>
          )}
        </section>
        {owner ? (
          <section className="ps-owner-actions">
            <h3>Wycena orientacyjna</h3>
            {demo ? (
              <>
                <p className="ps-price">
                  {currency(32400)} <small>brutto</small>
                </p>
                <p className="ps-muted">Przykładowa kwota w podglądzie.</p>
              </>
            ) : financial.busy ? (
              <p role="status">Wczytywanie wyceny…</p>
            ) : financial.error ? (
              <Feedback retry={financial.retry}>{financial.error}</Feedback>
            ) : price ? (
              <>
                <p className="ps-price">
                  {currency(price.cenaBrutto)} <small>brutto</small>
                </p>
                <p className="ps-muted">
                  {priceIncomplete
                    ? "Niepełny cennik — wynik wymaga weryfikacji."
                    : "Do potwierdzenia zakresu i pomiaru."}
                </p>
              </>
            ) : (
              <p>Wycena nie jest dostępna.</p>
            )}
            {!demo && (
              <>
                <a className="ps-button" href={`#/p/${id}/oferta`}>
                  <IconFileDescription size={19} />
                  Przygotuj ofertę
                </a>
                <a className="ps-button secondary" href={`#/p/${id}`}>
                  Otwórz projektant
                  <IconArrowUpRight size={18} />
                </a>
                <a className="ps-under-link" href={`#/p/${id}/wycena`}>
                  Zobacz szczegóły wyceny
                  <IconArrowRight size={16} />
                </a>
              </>
            )}
          </section>
        ) : (
          <section>
            <h3>Podgląd techniczny</h3>
            <p className="ps-muted">
              Układ, wymiary i materiały udostępnione dla tego projektu. Zmiany
              ustal z właścicielem stolarni.
            </p>
          </section>
        )}
      </aside>
    </>
  );
}

import { useRef, type FormEvent } from "react";
import { request } from "./api";
function NewProject({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (name.trim().length < 2) {
      setError("Podaj nazwę projektu (minimum 2 znaki).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const p = await request<{ id: string }>("/api/projekty", {
        method: "POST",
        body: JSON.stringify({ nazwa: name.trim() }),
      });
      onClose();
      location.hash = `#/p/${p.id}`;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <dialog
      className="ps-dialog"
      ref={dialog}
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else onClose();
      }}
    >
      <form noValidate onSubmit={submit}>
        <h2>Nowy projekt</h2>
        <p>Po utworzeniu przejdziesz do projektanta.</p>
        <label htmlFor="new-project-name">Nazwa projektu</label>
        <input
          autoFocus
          id="new-project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={160}
          aria-invalid={!!error}
          aria-describedby={error ? "new-project-error" : undefined}
        />
        {error && (
          <p id="new-project-error" className="ps-field-error" role="alert">
            {error}
          </p>
        )}
        <div className="ps-dialog-actions">
          <button
            className="ps-button secondary"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Anuluj
          </button>
          <button className="ps-button" disabled={busy}>
            {busy ? "Tworzenie…" : "Utwórz projekt"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
