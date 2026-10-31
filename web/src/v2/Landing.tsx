import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconCheck,
  IconRulerMeasure,
  IconLayout,
  IconTools,
} from "@tabler/icons-react";
import { Logo } from "./ui";
const HANDOFF_KEY = "pan-stolarz.kuchnia.zapytanie";
import { request, type Principal } from "./api";

const initial = {
  name: "",
  email: "",
  kind: "kuchnia",
  city: "",
  description: "",
  website: "",
};
export function Landing({ session }: { session: Principal | null }) {
  const [form, setForm] = useState(() => {
    try {
      const description = sessionStorage.getItem(HANDOFF_KEY);
      if (description && description.length <= 6000)
        return { ...initial, description };
    } catch {}
    return initial;
  });
  useEffect(() => {
    try {
      sessionStorage.removeItem(HANDOFF_KEY);
    } catch {}
  }, []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [result, setResult] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const submissionId = useRef(crypto.randomUUID());
  useEffect(() => {
    const sync = () => {
      if (location.hash.startsWith("#/zapytanie")) {
        const kind = location.hash.split("/")[2];
        if (["kuchnia", "szafa", "inne"].includes(kind))
          setForm((f) => ({ ...f, kind }));
        document
          .getElementById("zapytanie")
          ?.scrollIntoView({ behavior: "instant" });
      } else if (location.hash === "#/jak-dzialamy")
        document
          .getElementById("proces")
          ?.scrollIntoView({ behavior: "instant" });
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    const dirty =
      Object.entries(form).some(([k, v]) => k !== "kind" && !!v) && !result;
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [form, result]);
  const field = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2)
      errs.name = "Wpisz imię (minimum 2 znaki).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Wpisz poprawny adres e-mail.";
    if (form.city.trim().length < 2)
      errs.city = "Podaj miejscowość realizacji.";
    if (form.description.trim().length < 10)
      errs.description = "Opisz projekt w co najmniej 10 znakach.";
    setErrors(errs);
    setFailure("");
    if (Object.keys(errs).length) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)
        ?.focus();
      return;
    }
    setBusy(true);
    try {
      const r = await request<{ id: string }>("/api/v2/requests", {
        method: "POST",
        body: JSON.stringify({ ...form, submission_id: submissionId.current }),
      });
      setResult(r.id);
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="ps-public">
      <a
        className="ps-skip"
        href="#zapytanie"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("enquiry-name")?.focus();
        }}
      >
        Przejdź do formularza
      </a>
      <header className="ps-public-header">
        <a href="#/">
          <Logo />
        </a>
        <nav aria-label="Menu strony">
          <a href="#/zapytanie/kuchnia">Kuchnie</a>
          <a href="#/zapytanie/szafa">Szafy i zabudowy</a>
          <a href="#/kreator-kuchni">Kreator kuchni</a>
          <a href="#/jak-dzialamy">Jak działamy</a>
        </nav>
        <a
          className="ps-text-button"
          href={session ? "#/panel/projekty" : "#/logowanie"}
        >
          {session ? "Twój panel" : "Zaloguj się"}
          <IconArrowUpRight size={18} />
        </a>
      </header>
      <main>
        <section className="ps-hero">
          <div className="ps-hero-copy">
            <span className="ps-eyebrow">Pan Stolarz · meble na wymiar</span>
            <h1>
              Twoje wnętrze.
              <br />
              Dobrze
              <br />
              <span>przemyślane.</span>
            </h1>
            <p>
              Kuchnia, szafa czy zabudowa? Zacznijmy od tego, czego
              potrzebujesz. Wspólnie dopracujemy układ, materiały i detale.
            </p>
            <a className="ps-button" href="#/kreator-kuchni">
              Zaprojektuj kuchnię
              <IconArrowRight size={20} />
            </a>
            <a className="ps-under-link" href="#/zapytanie">
              Opowiedz o projekcie
            </a>
          </div>
          <figure className="ps-hero-image">
            <img
              src="/images/kitchen-concept.png"
              alt="Przykładowa wizualizacja kuchni z dębowymi i jasnymi frontami"
              fetchPriority="high"
            />
            <figcaption>
              Wizualizacja poglądowa · inspiracja do rozmowy
            </figcaption>
          </figure>
        </section>
        <section className="ps-public-section ps-offer">
          <div>
            <span className="ps-eyebrow">Od pomysłu do dopasowania</span>
            <h2>
              Co planujesz
              <br />w swoim wnętrzu?
            </h2>
          </div>
          <div className="ps-offer-links">
            {[
              {
                kind: "kuchnia",
                title: "Kuchnia",
                text: "Układ, przechowywanie i wygoda na co dzień.",
              },
              {
                kind: "szafa",
                title: "Szafa i garderoba",
                text: "Miejsce na Twoje rzeczy, dopasowane do wnęki.",
              },
              {
                kind: "inne",
                title: "Inna zabudowa",
                text: "Łazienka, salon lub pomysł, który wymaga rozmowy.",
              },
            ].map((x) => (
              <a key={x.kind} href={`#/zapytanie/${x.kind}`}>
                <div>
                  <h3>{x.title}</h3>
                  <p>{x.text}</p>
                </div>
                <IconArrowUpRight size={25} />
              </a>
            ))}
          </div>
        </section>
        <section className="ps-public-section ps-process" id="proces">
          <span className="ps-eyebrow">Jak działamy</span>
          <h2>
            Najpierw rozumiemy.
            <br />
            Potem projektujemy.
          </h2>
          <div className="ps-process-grid">
            {[
              {
                Icon: IconLayout,
                title: "Rozmawiamy o potrzebach",
                text: "Opisz pomysł. Przybliżone wymiary i informacja o pomieszczeniu pomogą nam zacząć.",
              },
              {
                Icon: IconRulerMeasure,
                title: "Dopracowujemy projekt",
                text: "Ustalamy układ, materiały i zakres. Wymiary oraz szczegóły wyceny wymagają potwierdzenia.",
              },
              {
                Icon: IconTools,
                title: "Przygotowujemy realizację",
                text: "Dalsze etapy, termin i warunki ustalamy na podstawie zaakceptowanego projektu.",
              },
            ].map(({ Icon, title, text }) => (
              <article key={title}>
                <Icon size={30} stroke={1.4} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="ps-public-section ps-enquiry" id="zapytanie">
          <div>
            <span className="ps-eyebrow">Zacznijmy od rozmowy</span>
            <h2>
              Masz pomysł?
              <br />
              Opowiedz nam o nim.
            </h2>
            <p>
              Nie potrzebujesz jeszcze dokładnego projektu. Napisz, co chcesz
              zmienić i gdzie powstaną meble.
            </p>
            <p className="ps-form-note">
              To zapytanie, a nie zamówienie. Cena i możliwość realizacji
              wymagają potwierdzenia.
            </p>
          </div>
          {result ? (
            <div className="ps-request-success" role="status">
              <IconCheck size={36} />
              <h3>Zapytanie zapisane</h3>
              <p>
                Pan Stolarz otrzymał opis Twojego projektu. Zachowaj numer
                zgłoszenia:
              </p>
              <code>{result}</code>
              <button
                className="ps-button secondary"
                onClick={() => {
                  setResult("");
                  setForm(initial);
                  submissionId.current = crypto.randomUUID();
                }}
              >
                Nowe zapytanie
              </button>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={send}
              ref={formRef}
              className="ps-enquiry-form"
            >
              <div className="ps-form-grid">
                {[
                  {
                    key: "name",
                    label: "Imię",
                    type: "text",
                    auto: "given-name",
                    max: 120,
                  },
                  {
                    key: "email",
                    label: "E-mail",
                    type: "email",
                    auto: "email",
                    max: 254,
                  },
                  {
                    key: "city",
                    label: "Miejscowość realizacji",
                    type: "text",
                    auto: "address-level2",
                    max: 120,
                  },
                ].map((x) => (
                  <div className="ps-form-field" key={x.key}>
                    <label htmlFor={`enquiry-${x.key}`}>{x.label}</label>
                    <input
                      id={`enquiry-${x.key}`}
                      name={x.key}
                      type={x.type}
                      value={form[x.key as keyof typeof form]}
                      autoComplete={x.auto}
                      maxLength={x.max}
                      onChange={(e) =>
                        field(x.key as keyof typeof form, e.target.value)
                      }
                      aria-invalid={!!errors[x.key]}
                      aria-describedby={
                        errors[x.key] ? `error-${x.key}` : undefined
                      }
                      required
                    />
                    {errors[x.key] && (
                      <small id={`error-${x.key}`} className="ps-field-error">
                        {errors[x.key]}
                      </small>
                    )}
                  </div>
                ))}
                <div className="ps-form-field">
                  <label htmlFor="enquiry-kind">Co planujesz?</label>
                  <select
                    id="enquiry-kind"
                    value={form.kind}
                    onChange={(e) => field("kind", e.target.value)}
                  >
                    <option value="kuchnia">Kuchnia</option>
                    <option value="szafa">Szafa lub garderoba</option>
                    <option value="inne">Inna zabudowa</option>
                  </select>
                </div>
              </div>
              <div className="ps-form-field">
                <label htmlFor="enquiry-description">Twój pomysł</label>
                <textarea
                  className="resize-none"
                  id="enquiry-description"
                  name="description"
                  value={form.description}
                  maxLength={6000}
                  rows={5}
                  onChange={(e) => field("description", e.target.value)}
                  placeholder="Przybliżone wymiary, układ, materiały, potrzeby…"
                  aria-invalid={!!errors.description}
                  aria-describedby={
                    errors.description
                      ? "error-description"
                      : "description-help"
                  }
                  required
                />
                {errors.description ? (
                  <small id="error-description" className="ps-field-error">
                    {errors.description}
                  </small>
                ) : (
                  <small id="description-help">
                    10–6000 znaków. Dokładne wymiary ustalimy później.
                  </small>
                )}
              </div>
              <div className="ps-honeypot" aria-hidden="true">
                <label htmlFor="enquiry-website">Strona internetowa</label>
                <input
                  id="enquiry-website"
                  value={form.website}
                  onChange={(e) => field("website", e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              {failure && (
                <p className="ps-field-error" role="alert">
                  {failure}
                </p>
              )}
              <button className="ps-button" disabled={busy} aria-busy={busy}>
                {busy ? "Zapisywanie…" : "Wyślij zapytanie"}
                <IconArrowRight size={18} />
              </button>
              <p className="ps-form-note">
                Dane wykorzystamy do obsługi tego zapytania. Nie przesyłaj
                dokumentów ani danych wrażliwych.
              </p>
            </form>
          )}
        </section>
      </main>
      <footer className="ps-public-footer">
        <Logo />
        <span>Pan Stolarz · meble na wymiar</span>
        <a href="#/logowanie">
          Panel stolarni
          <IconArrowUpRight size={17} />
        </a>
      </footer>
    </div>
  );
}
