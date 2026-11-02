import { useRef, useState, type FormEvent } from "react";
import { IconMail, IconUsers, IconSearch, IconX } from "@tabler/icons-react";
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
import { ActivationLink, CreateEmployee, ProfileSelect } from "./StaffAccounts";
import { NAZWY_PROFILI, profilOsoby, type ProfilDostepu } from "../../../src/server/uprawnienia";

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
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const search = useRef<HTMLInputElement>(null);
  const visible = (list.data ?? []).filter(
    (r) =>
      (kind === "all" || r.kind === kind) &&
      [r.name, r.city, r.email, r.description]
        .join(" ")
        .toLocaleLowerCase("pl")
        .includes(query.trim().toLocaleLowerCase("pl")),
  );
  return (
    <section className="ps-owner-page">
      <span className="ps-eyebrow">Kontakt z klientami</span>
      <h1>Zapytania klientów</h1>
      <p className="ps-page-intro">
        Opisy przesłane przez formularz na stronie Pan Stolarz. Lista pokazuje
        do 100 najnowszych zgłoszeń.
      </p>
      <div className="ps-request-tools">
        <div className="ps-search">
          <IconSearch size={18} aria-hidden="true" />
          <input
            ref={search}
            type="search"
            aria-label="Szukaj zapytań"
            placeholder="Imię, miejscowość lub opis…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              aria-label="Wyczyść wyszukiwanie zapytań"
              onClick={() => {
                setQuery("");
                search.current?.focus();
              }}
            >
              <IconX size={18} />
            </button>
          )}
        </div>
        <div className="field">
          <label htmlFor="request-kind">Rodzaj zapytania</label>
          <select
            id="request-kind"
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="all">Wszystkie rodzaje</option>
            <option value="kuchnia">Kuchnie</option>
            <option value="szafa">Szafy i garderoby</option>
            <option value="inne">Inne zabudowy</option>
          </select>
        </div>
        {!demo && (
          <button
            className="ps-button secondary"
            onClick={list.retry}
            disabled={list.busy}
          >
            Odśwież zapytania
          </button>
        )}
      </div>
      {!list.busy && !list.error && (
        <p className="ps-project-count" role="status">
          Widoczne zapytania: {visible.length} z {list.data?.length ?? 0}
        </p>
      )}
      {list.busy ? (
        <p role="status">Wczytywanie zapytań…</p>
      ) : list.error ? (
        <Feedback retry={list.retry}>{list.error}</Feedback>
      ) : visible.length ? (
        <div className="ps-request-list">
          {visible.map((r) => (
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
          <h2>
            {list.data?.length
              ? "Brak pasujących zapytań"
              : "Jeszcze bez zapytań"}
          </h2>
          <p>
            {list.data?.length
              ? "Zmień wpisaną frazę lub rodzaj zapytania."
              : "Nowe zgłoszenia ze strony pojawią się tutaj."}
          </p>
          {(query || kind !== "all") && (
            <button
              className="ps-button secondary"
              onClick={() => {
                setQuery("");
                setKind("all");
                search.current?.focus();
              }}
            >
              Pokaż wszystkie zapytania
            </button>
          )}
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
      {!demo && <CreateEmployee onCreated={members.retry} />}
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
              key={`${m.user_id}-${m.active}-${m.job_role ?? ""}-${m.project_ids.join()}-${m.access_profile ?? ""}`}
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
          <p>
            {demo
              ? "Konta pojawią się po skonfigurowaniu dostępu do stolarni."
              : "Dodaj pierwszego pracownika formularzem powyżej."}
          </p>
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
  const [job, setJob] = useState(member.job_role ?? "Pracownik");
  const [profile, setProfile] = useState<ProfilDostepu>(member.access_profile ?? "produkcja");
  const [link, setLink] = useState("");
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
        body: JSON.stringify({ active, project_ids: ids, job_role: job, access_profile: profile }),
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
          <p>
            {roles[member.role]}
            {member.role === "employee"
              ? ` · ${member.job_role ?? "Pracownik"} · ${NAZWY_PROFILI[profilOsoby(member)]}`
              : ""}
          </p>
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
          <label htmlFor={`staff-job-${member.user_id}`}>
            Funkcja w zespole
          </label>
          <input
            id={`staff-job-${member.user_id}`}
            className="input"
            value={job}
            maxLength={80}
            disabled={demo || busy}
            onChange={(e) => setJob(e.target.value)}
            required
          />
          <label className="ps-check">
            <input
              type="checkbox"
              checked={active}
              disabled={demo || busy}
              onChange={(e) => setActive(e.target.checked)}
            />
            Aktywny dostęp do stolarni
          </label>
          <ProfileSelect name={`staff-profile-${member.user_id}`} value={profile} onChange={setProfile} disabled={demo || busy} />
          <fieldset disabled={demo || busy}>
            <legend>Udostępnione projekty</legend>
            <p>Produkcja i montaż widzą tylko udostępnione projekty. Sprzedaż widzi wszystkie projekty (projektuje także nowe przy kliencie).</p>
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
            <button className="ps-button" disabled={busy || !job.trim()}>
              {busy ? "Zapisywanie…" : "Zapisz dostęp"}
            </button>
          )}
          {!demo && (
            <button
              type="button"
              className="ps-button secondary"
              disabled={busy || !member.active}
              onClick={async () => {
                if (busy) return;
                setBusy(true);
                setError("");
                try {
                  const result = await request<{ activation_url: string }>(
                    `/api/v2/members/${encodeURIComponent(member.user_id)}/activation`,
                    { method: "POST", body: "{}" },
                  );
                  setLink(result.activation_url);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Nowy link ustawienia hasła
            </button>
          )}
        </form>
      )}
      {link && <ActivationLink value={link} />}
    </article>
  );
}
