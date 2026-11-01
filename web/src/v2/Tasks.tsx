import { randomId } from "../uuid";
import { useState, type FormEvent } from "react";
import {
  request,
  type Principal,
  type ProjectSummary,
  type Membership,
} from "./api";
import { useResource } from "./useResource";
import { Feedback } from "./ui";
interface Task {
  id: string;
  project_id: string;
  assignee_id: string;
  title: string;
  status: "todo" | "working" | "paused" | "done";
  version: number;
}
const labels = {
  todo: "Do zrobienia",
  working: "W pracy",
  paused: "Wstrzymane",
  done: "Wykonane",
};
export function Tasks({ person, demo }: { person: Principal; demo: boolean }) {
  const tasks = useResource<Task[]>(demo ? null : "/api/v2/tasks", []);
  const projects = useResource<ProjectSummary[]>(
    demo ? null : "/api/v2/projects",
    [],
  );
  const members = useResource<Membership[]>(
    !demo && person.role === "owner" ? "/api/v2/members" : null,
    [],
  );
  const [project, setProject] = useState("");
  const [assignee, setAssignee] = useState("");
  const [title, setTitle] = useState("");
  const [operationId, setOperationId] = useState(() => randomId());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const employees = (members.data ?? []).filter(
    (m) => m.role === "employee" && m.active && m.project_ids.includes(project),
  );
  async function save(url: string, method: string, body: unknown) {
    setPending(true);
    setError("");
    setNotice("");
    try {
      await request(url, { method, body: JSON.stringify(body) });
      tasks.retry();
      setNotice("Zapisano zmianę.");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setPending(false);
    }
  }
  async function create(e: FormEvent) {
    e.preventDefault();
    if (
      await save("/api/v2/tasks", "POST", {
        operation_id: operationId,
        project_id: project,
        assignee_id: assignee,
        title,
      })
    ) {
      setTitle("");
      setOperationId(randomId());
    }
  }
  return (
    <section className="ps-owner-page">
      <span className="ps-eyebrow">Warsztat</span>
      <h1>{person.role === "owner" ? "Plan pracy" : "Moja praca"}</h1>
      <p>
        {person.role === "owner"
          ? "Przydziel pracę i śledź jej wykonanie."
          : "Twoje zadania i postęp pracy w przypisanych projektach."}
      </p>
      {demo ? (
        <Feedback>
          Podgląd modułu. Zadania pojawią się po zalogowaniu i uruchomieniu
          bazy. Nie zapisujemy tutaj przykładowych zmian.
        </Feedback>
      ) : (
        <>
          {person.role === "owner" && (
            <form noValidate onSubmit={create} className="ps-task-form">
              <h2>Nowe zadanie</h2>
              <label>
                Projekt
                <select
                  required
                  value={project}
                  onChange={(e) => {
                    setProject(e.target.value);
                    setAssignee("");
                  }}
                >
                  <option value="">Wybierz projekt</option>
                  {projects.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nazwa}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Pracownik
                <select
                  required
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                >
                  <option value="">Wybierz pracownika</option>
                  {employees.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.display_name}
                    </option>
                  ))}
                </select>
              </label>
              {project &&
                !members.busy &&
                !members.error &&
                !employees.length && (
                  <p>
                    Przypisz aktywnego pracownika do tego projektu w zakładce
                    Pracownicy.
                  </p>
                )}
              <label>
                Zadanie
                <input
                  value={title}
                  minLength={2}
                  maxLength={160}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Np. przygotuj elementy korpusów"
                />
              </label>
              <button
                className="ps-button"
                disabled={
                  pending || !project || !assignee || title.trim().length < 2
                }
              >
                Dodaj zadanie
              </button>
            </form>
          )}
          {(projects.error || members.error) && (
            <Feedback
              retry={() => {
                projects.retry();
                members.retry();
              }}
            >
              {projects.error || members.error}
            </Feedback>
          )}
          {error && <Feedback>{error}</Feedback>}
          <p role="status">{pending ? "Zapisywanie…" : notice}</p>
          <h2>
            {person.role === "owner" ? "Ostatnie zadania" : "Twoje zadania"}
          </h2>
          <p>Lista obejmuje maksymalnie 100 najnowszych zadań.</p>
          <button
            className="ps-button secondary"
            disabled={tasks.busy || pending}
            onClick={tasks.retry}
          >
            Odśwież zadania
          </button>
          {tasks.busy ? (
            <p role="status">Wczytywanie zadań…</p>
          ) : tasks.error ? (
            <Feedback retry={tasks.retry}>{tasks.error}</Feedback>
          ) : !tasks.data?.length ? (
            <p>
              Nie ma jeszcze zadań.{" "}
              {person.role === "owner"
                ? "Dodaj pierwsze zadanie powyżej."
                : "Przydzielone zadania pojawią się tutaj."}
            </p>
          ) : (
            tasks.data.map((t) => (
              <article className="ps-task-card" key={t.id}>
                <h3>{t.title}</h3>
                <p>
                  {projects.data?.find((p) => p.id === t.project_id)?.nazwa ??
                    "Projekt"}{" "}
                  · {labels[t.status]}
                </p>
                {person.role === "owner" && (
                  <p>
                    {members.data?.find((m) => m.user_id === t.assignee_id)
                      ?.display_name ?? "Pracownik"}
                  </p>
                )}
                <div className="ps-task-actions">
                  <a
                    className="ps-button secondary"
                    href={`${demo ? "#/podglad/" + person.role : "#/panel"}/projekty?projekt=${encodeURIComponent(t.project_id)}`}
                  >
                    Projekt i dokumentacja
                  </a>
                  {(t.status === "todo" || t.status === "paused") && (
                    <button
                      disabled={pending}
                      className="ps-button"
                      onClick={() =>
                        save("/api/v2/tasks/" + t.id, "PATCH", {
                          version: t.version,
                          status: "working",
                        })
                      }
                    >
                      {t.status === "paused"
                        ? "Wznów pracę"
                        : "Rozpocznij pracę"}
                    </button>
                  )}
                  {t.status === "working" && (
                    <>
                      <button
                        disabled={pending}
                        className="ps-button secondary"
                        onClick={() =>
                          save("/api/v2/tasks/" + t.id, "PATCH", {
                            version: t.version,
                            status: "paused",
                          })
                        }
                      >
                        Wstrzymaj
                      </button>
                      <button
                        disabled={pending}
                        className="ps-button"
                        onClick={() =>
                          save("/api/v2/tasks/" + t.id, "PATCH", {
                            version: t.version,
                            status: "done",
                          })
                        }
                      >
                        Zakończ zadanie
                      </button>
                    </>
                  )}
                  {t.status === "done" && person.role === "owner" && (
                    <button
                      disabled={pending}
                      className="ps-button secondary"
                      onClick={() =>
                        save("/api/v2/tasks/" + t.id, "PATCH", {
                          version: t.version,
                          status: "todo",
                        })
                      }
                    >
                      Przywróć do zrobienia
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </>
      )}
    </section>
  );
}
