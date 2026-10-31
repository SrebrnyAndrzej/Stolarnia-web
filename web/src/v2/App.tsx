import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconCalculator,
  IconFolder,
  IconLogout,
  IconMail,
  IconMenu2,
  IconUsers,
  IconX,
  IconSettings,
  IconStack2,
} from "@tabler/icons-react";
import { request, roles, type Principal } from "./api";
import { Landing } from "./Landing";
import { Login } from "./Login";
import { Logo, Feedback } from "./ui";
const LegacyApp = lazy(() =>
  import("../App").then((m) => ({ default: m.LegacyApp })),
);
const PrzelicznikSzuflad = lazy(() =>
  import("../views/PrzelicznikSzuflad").then((m) => ({
    default: m.PrzelicznikSzuflad,
  })),
);
const Workspace = lazy(() =>
  import("./Workspace").then((m) => ({ default: m.Workspace })),
);
const Members = lazy(() =>
  import("./Owner").then((m) => ({ default: m.Members })),
);
const Requests = lazy(() =>
  import("./Owner").then((m) => ({ default: m.Requests })),
);

const KitchenPlanner = lazy(() =>
  import("./planner/KitchenPlanner").then((m) => ({
    default: m.KitchenPlanner,
  })),
);

export function App() {
  const [hash, setHash] = useState(location.hash || "#/");
  const [session, setSession] = useState<Principal | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  useEffect(() => {
    const change = () => {
      setHash(location.hash || "#/");
      setMobileMenu(false);
    };
    const expire = () => {
      setSession(null);
      setSessionError(
        "Sesja wygasła lub dostęp został cofnięty. Zaloguj się ponownie.",
      );
    };
    window.addEventListener("hashchange", change);
    window.addEventListener("pan-stolarz-session-expired", expire);
    const c = new AbortController();
    request<Principal>("/api/v2/session", { signal: c.signal })
      .then((p) => {
        if (!c.signal.aborted) setSession(p);
      })
      .catch(() => {})
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => {
      c.abort();
      window.removeEventListener("hashchange", change);
      window.removeEventListener("pan-stolarz-session-expired", expire);
    };
  }, []);
  const demoMatch = hash.match(
    /^#\/podglad\/(owner|employee|client)(?:\/([^?]*))?/,
  );
  const demo = !!demoMatch;
  const demoRole = demoMatch?.[1] as Principal["role"] | undefined;
  const person = demo
    ? {
        user_id: "demo",
        role: demoRole!,
        active: true,
        display_name: "Podgląd",
        project_ids: [],
        email: "",
      }
    : session;
  const plannerRoute = hash === "#/kreator-kuchni";
  const publicRoute =
    hash === "#/" ||
    hash.startsWith("#/zapytanie") ||
    hash === "#/jak-dzialamy";
  const section = demo
    ? demoMatch?.[2] || "projekty"
    : hash.split("/")[2] || "projekty";
  const isPanel =
    hash.startsWith("#/panel") ||
    demo ||
    /^(#\/p\/|#\/materialy|#\/ustawienia|#\/szuflady)/.test(hash);
  const href = (page: string) =>
    demo ? `#/podglad/${person!.role}/${page}` : `#/panel/${page}`;
  useEffect(() => {
    const title = plannerRoute
      ? "Kreator kuchni"
      : publicRoute
        ? "Meble na wymiar"
        : section === "szuflady"
          ? "Kalkulator szuflad"
          : isPanel
            ? "Panel stolarni"
            : "Logowanie";
    document.title = `${title} · Pan Stolarz`;
  }, [publicRoute, section, isPanel, plannerRoute]);
  const logout = async () => {
    setLogoutError("");
    try {
      await request("/api/v2/logout", { method: "POST" });
      setSession(null);
      location.hash = "#/";
    } catch (error) {
      setLogoutError((error as Error).message);
    }
  };
  if (plannerRoute)
    return (
      <Suspense
        fallback={
          <main className="ps-empty" role="status">
            Wczytywanie kreatora kuchni…
          </main>
        }
      >
        <KitchenPlanner />
      </Suspense>
    );
  if (publicRoute && !demo) return <Landing session={session} />;
  if (!demo && (hash === "#/logowanie" || (isPanel && !session))) {
    if (loading)
      return (
        <main className="ps-login-page">
          <Logo />
          <p role="status">Sprawdzamy sesję…</p>
        </main>
      );
    return (
      <Login
        sessionError={sessionError}
        onLogin={(p) => {
          setSession(p);
          setSessionError("");
          location.hash = "#/panel/projekty";
        }}
      />
    );
  }
  if (!person) return <Landing session={session} />;
  const owner = person.role === "owner";
  const employee = person.role === "employee";
  const legacy = /^(#\/p\/|#\/materialy|#\/ustawienia)/.test(hash);
  const canSeeSection =
    owner ||
    ["projekty", ""].includes(section) ||
    (employee && section === "szuflady");
  const nav = [
    {
      id: "projekty",
      label: person.role === "client" ? "Moje projekty" : "Projekty",
      icon: IconFolder,
    },
    ...(owner || employee
      ? [{ id: "szuflady", label: "Kalkulator szuflad", icon: IconCalculator }]
      : []),
    ...(owner
      ? [
          { id: "zapytania", label: "Zapytania klientów", icon: IconMail },
          { id: "pracownicy", label: "Pracownicy", icon: IconUsers },
        ]
      : []),
  ];
  return (
    <div className="ps-app">
      <a
        className="ps-skip"
        href="#ps-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("ps-content")?.focus();
        }}
      >
        Przejdź do treści
      </a>
      <header className="ps-topbar">
        <a href="#/" className="ps-logo-link">
          <Logo />
        </a>
        <div className="ps-topbar-right">
          {demo && (
            <span className="ps-demo-label">Podgląd · dane przykładowe</span>
          )}
          <span className="ps-role">{roles[person.role]}</span>
          {demo ? (
            <a className="ps-text-button" href="#/logowanie">
              Zaloguj się <IconArrowUpRight size={17} />
            </a>
          ) : (
            <button className="ps-text-button" onClick={logout}>
              <IconLogout size={18} /> Wyloguj
            </button>
          )}
          <button
            className="ps-mobile-toggle"
            aria-label={mobileMenu ? "Zamknij menu" : "Otwórz menu"}
            aria-expanded={mobileMenu}
            onClick={() => setMobileMenu((v) => !v)}
          >
            {mobileMenu ? <IconX /> : <IconMenu2 />}
          </button>
        </div>
      </header>
      <aside className={`ps-sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="ps-sidebar-label">
          {owner
            ? "Twoja pracownia"
            : employee
              ? "Przestrzeń pracownika"
              : "Twoje meble"}
        </div>
        <nav aria-label="Panel stolarni">
          {nav.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={href(id)}
              aria-current={!legacy && section === id ? "page" : undefined}
            >
              <Icon size={21} stroke={1.6} />
              {label}
            </a>
          ))}
          {owner && !demo && (
            <>
              <a
                href="#/materialy"
                aria-current={
                  hash.startsWith("#/materialy") ? "page" : undefined
                }
              >
                <IconStack2 size={21} stroke={1.6} />
                Materiały i okucia
              </a>
              <a
                href="#/ustawienia"
                aria-current={
                  hash.startsWith("#/ustawienia") ? "page" : undefined
                }
              >
                <IconSettings size={21} stroke={1.6} />
                Ustawienia
              </a>
            </>
          )}
        </nav>
        <div className="ps-sidebar-bottom">
          <p>
            Pan Stolarz <span>Przemyślane od projektu.</span>
          </p>
          <a href="#/">
            <IconArrowLeft size={16} /> Strona dla klientów
          </a>
        </div>
      </aside>
      <main id="ps-content" tabIndex={-1} className="ps-panel-content">
        {demo && (
          <div className="ps-demo-banner">
            To podgląd interfejsu. Przykładowe projekty nie pochodzą z bazy
            stolarni. <a href="#/logowanie">Przejdź do logowania</a>
          </div>
        )}
        {logoutError && <Feedback>{logoutError}</Feedback>}
        <Suspense
          fallback={
            <p className="ps-empty" role="status">
              Wczytywanie widoku…
            </p>
          }
        >
          {!canSeeSection || (legacy && !owner) ? (
            <section className="ps-empty">
              <h1>Brak dostępu</h1>
              <p>Ten widok nie jest dostępny na Twoim koncie.</p>
              <a className="ps-button" href={href("projekty")}>
                Wróć do projektów
              </a>
            </section>
          ) : legacy ? (
            <div className="ps-legacy">
              <a href={href("projekty")} className="ps-back-link">
                <IconArrowLeft size={16} /> Nowy widok projektów
              </a>
              <LegacyApp />
            </div>
          ) : section === "szuflady" ? (
            demo ? (
              <section className="ps-empty">
                <IconCalculator size={40} />
                <h1>Kalkulator szuflad</h1>
                <p>
                  Rozkrój dna i pleców, mocowanie frontu oraz rozstaw prowadnic.
                  Kalkulator korzysta z istniejącego silnika Pan Stolarz.
                </p>
                <p>
                  Obliczenia są dostępne po zalogowaniu do konta pracownika lub
                  właściciela.
                </p>
                <a className="ps-button" href="#/logowanie">
                  Zaloguj się do kalkulatora
                </a>
              </section>
            ) : (
              <PrzelicznikSzuflad />
            )
          ) : section === "pracownicy" && owner ? (
            <Members demo={demo} />
          ) : section === "zapytania" && owner ? (
            <Requests demo={demo} />
          ) : (
            <Workspace
              key={`${person.user_id}-${person.role}-${demo}`}
              person={person}
              demo={demo}
            />
          )}
        </Suspense>
      </main>
    </div>
  );
}
