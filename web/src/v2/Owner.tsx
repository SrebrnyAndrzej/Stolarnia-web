import { useState, type FormEvent } from "react";
import { IconMail, IconUsers } from "@tabler/icons-react";
import { Feedback } from "./ui";
import {
  date,
  request,
  roles,
  type CustomerRequest,
  type Membership,
  type ProjectSummary,
} from "./api";
import { useResource } from "./useResource";
import { demoProjects } from "./demo";

export function Requests({ demo }: { demo: boolean }) {
  const list = useResource<CustomerRequest[]>(
    demo ? null : "/api/v2/requests",
    [
      {
        id: "pokaz",
        name: "Zapytanie pokazowe",
        email: "klient@example.com",
        kind: "kuchnia",
        city: "Miejscowość przykładowa",
        created_at: "2026-10-31T09:00:00Z",
        description:
          "Kuchnia w układzie L. Potrzebne miejsce na przechowywanie i blat do wspólnego gotowania. Wymiary do potwierdzenia.",
        status: "nowe",
      },
    ],
  );
  return (
    <section className="ps-owner-page">
      <span className="ps-eyebrow">Kontakt z klientami</span>
      <h1>Zapytania klientów</h1>
      <p className="ps-page-intro">
        Opisy przesłane przez formularz na stronie Pan Stolarz. Lista pokazuje
        do 100 najnowszych zgłoszeń.
      </p>
      {list.busy ? (
        <p role="status">Wczytywanie zapytań…</p>
      ) : list.error ? (
        <Feedback retry={list.retry}>{list.error}</Feedback>
      ) : list.data?.length ? (
        <div className="ps-request-list">
          {list.data.map((r) => (
            <article key={r.id}>
              <header>
                <div>
                  <h2>{r.name}</h2>
                  <p>
                    {r.city} · {r.kind} · {date(r.created_at)}
                  </p>
                </div>
                <span className="ps-status">
                  {r.status === "nowe" ? "Nowe zapytanie" : r.status}
                </span>
              </header>
              <p className="ps-request-description">{r.description}</p>
              <a className="ps-under-link" href={`mailto:${r.email}`}>
                <IconMail size={17} />
                {r.email}
              </a>
              <small>Numer: {r.id}</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="ps-empty">
          <IconMail size={36} />
          <h2>Jeszcze bez zapytań</h2>
          <p>Nowe zgłoszenia ze strony pojawią się tutaj.</p>
        </div>
      )}
    </section>
  );
}
export function Members({ demo }: { demo: boolean }) {
  const members = useResource<Membership[]>(demo ? null : "/api/v2/members", [
    {
      user_id: "pokaz-pracownik",
      display_name: "Pracownik pokazowy",
      role: "employee",
      active: true,
      project_ids: ["pokaz-kuchnia"],
    },
  ]);
  const projects = useResource<ProjectSummary[]>(
    demo ? null : "/api/v2/projects",
    demoProjects,
  );
  return (
    <section className="ps-owner-page">
      <span className="ps-eyebrow">Dostęp do pracowni</span>
      <h1>Pracownicy i dostęp</h1>
      <p className="ps-page-intro">
        Pracownik korzysta z kalkulatora szuflad i widzi udostępnione projekty.
        Wyceny, ceny i dokumenty finansowe pozostają dostępne tylko
        właścicielowi.
      </p>
      {members.busy || projects.busy ? (
        <p role="status">Wczytywanie kont…</p>
      ) : members.error || projects.error ? (
        <Feedback
          retry={() => {
            members.retry();
            projects.retry();
          }}
        >
          {members.error || projects.error}
        </Feedback>
      ) : members.data?.length ? (
        <div className="ps-member-list">
          {members.data.map((m) => (
            <Member
              key={`${m.user_id}-${m.active}-${m.project_ids.join()}`}
              member={m}
              projects={projects.data ?? []}
              demo={demo}
              onSaved={members.retry}
            />
          ))}
        </div>
      ) : (
        <div className="ps-empty">
          <IconUsers size={36} />
          <h2>Nie dodano jeszcze kont</h2>
          <p>Konta pojawią się po skonfigurowaniu dostępu do stolarni.</p>
        </div>
      )}
    </section>
  );
}
function Member({
  member,
  projects,
  demo,
  onSaved,
}: {
  member: Membership;
  projects: ProjectSummary[];
  demo: boolean;
  onSaved: () => void;
}) {
  const [ids, setIds] = useState(member.project_ids);
  const [active, setActive] = useState(member.active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (demo || busy) return;
    setBusy(true);
    setError("");
    try {
      await request(`/api/v2/members/${encodeURIComponent(member.user_id)}`, {
        method: "PATCH",
        body: JSON.stringify({ active, project_ids: ids }),
      });
      setSaved(true);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="ps-member">
      <header>
        <div className="ps-member-avatar">
          <IconUsers size={24} stroke={1.5} />
        </div>
        <div>
          <h2>{member.display_name || "Konto bez nazwy"}</h2>
          <p>{roles[member.role]}</p>
        </div>
        <span className={`ps-status ${active ? "zaakceptowany" : "inactive"}`}>
          {active ? "Dostęp aktywny" : "Dostęp wyłączony"}
        </span>
      </header>
      {member.role === "owner" ? (
        <p className="ps-muted">
          Konto właściciela ma dostęp do całej stolarni. Nie można zmienić jego
          uprawnień z tego formularza.
        </p>
      ) : (
        <form noValidate onSubmit={save}>
          <label className="ps-check">
            <input
              type="checkbox"
              checked={active}
              disabled={demo || busy}
              onChange={(e) => setActive(e.target.checked)}
            />
            Aktywny dostęp do stolarni
          </label>
          <fieldset disabled={demo || busy}>
            <legend>Udostępnione projekty</legend>
            <p>Podgląd techniczny bez wycen i danych finansowych.</p>
            {projects.length ? (
              projects.map((p) => (
                <label className="ps-check" key={p.id}>
                  <input
                    type="checkbox"
                    checked={ids.includes(p.id)}
                    onChange={(e) =>
                      setIds((old) =>
                        e.target.checked
                          ? [...old, p.id]
                          : old.filter((id) => id !== p.id),
                      )
                    }
                  />
                  {p.nazwa}
                </label>
              ))
            ) : (
              <p className="ps-muted">Najpierw utwórz projekt.</p>
            )}
          </fieldset>
          {error && (
            <p className="ps-field-error" role="alert">
              {error}
            </p>
          )}
          {saved && <p role="status">Dostęp został zapisany.</p>}
          {!demo && (
            <button className="ps-button" disabled={busy}>
              {busy ? "Zapisywanie…" : "Zapisz dostęp"}
            </button>
          )}
        </form>
      )}
    </article>
  );
}
