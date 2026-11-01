import { BrandCarousel } from "./BrandCarousel";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconCheck,
  IconRulerMeasure,
  IconLayout,
} from "@tabler/icons-react";
import { Logo } from "./ui";
import { HomeIntro } from "./HomeIntro";
import {
  AREAS,
  PHONE,
  SERVICES,
  PROCESS,
  FAQ,
  MORE_FAQ,
  BENEFITS,
  MATERIALS,
  BUSINESS_SCHEMA,
} from "./landing-content";
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
      } else if (["#/uslugi", "#/o-nas"].includes(location.hash)) {
        document
          .getElementById(location.hash.slice(2))
          ?.scrollIntoView({ behavior: "instant" });
      } else if (location.hash === "#/wizualizacja") {
        document
          .getElementById("wizualizacja")
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
      <script type="application/ld+json">
        {JSON.stringify(BUSINESS_SCHEMA)}
      </script>
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
          <a href="#/uslugi">Usługi</a>
          <a href="#/wizualizacja">Wizualizacje</a>
          <a href="#/o-nas">O nas</a>
          <a href="#/kreator-kuchni">Kreator kuchni</a>
          <a href="#/katalog-dekorow">Katalog dekorów</a>
          <a href="#/jak-dzialamy">Jak działamy</a>
        </nav>
        <a className="ps-button ps-header-call" href={PHONE.href}>
          Zadzwoń: {PHONE.label}
        </a>
        <a
          className="ps-text-button"
          href={session ? "#/panel/projekty" : "#/logowanie"}
        >
          {session ? "Twój panel" : "Zaloguj się"}
          <IconArrowUpRight size={18} />
        </a>
      </header>
      <main>
        <HomeIntro>
          <div className="ps-hero-copy">
            <span className="ps-eyebrow">
              Kuchnie · garderoby · szafy · zabudowy na wymiar
            </span>
            <h1>
              Zobaczysz mebel w 3D,{" "}
              <span>zanim powstanie pierwsza formatka.</span>
            </h1>
            <p>
              Mierzymy na miejscu, projektujemy i pokazujemy Ci fotorealistyczną
              wizualizację. Z tej samej konstrukcji powstaje dokumentacja
              produkcyjna, więc zatwierdzasz dokładnie to, co potem montujemy.
            </p>
            <a className="ps-button" href={PHONE.href}>
              Umów pomiar <IconArrowRight size={20} />
            </a>
            <a className="ps-under-link" href="#/wizualizacja">
              Zobacz wizualizacje
            </a>
            <p className="ps-hero-contact">
              Zielona Góra i okolice · <a href={PHONE.href}>{PHONE.label}</a>
            </p>
            <p className="ps-brand-line">
              Dobrze pomyślane. Dobrze dopasowane.
            </p>
          </div>
        </HomeIntro>
        <section
          className="ps-proof-strip"
          aria-label="Od pomysłu do wykonania"
        >
          <div>
            <strong>3D</strong>
            <span>Wizualizacja w cenie wyceny</span>
          </div>
          <div>
            <strong>mm</strong>
            <span>Pomiar i wymiarowanie frontów na miejscu</span>
          </div>
          <div>
            <strong>PDF</strong>
            <span>Dokumentacja każdej formatki</span>
          </div>
          <div>
            <strong>=</strong>
            <span>Cena do zatwierdzonego projektu</span>
          </div>
        </section>
        <section
          className="ps-public-section ps-start"
          aria-labelledby="start-title"
        >
          <div className="ps-start-heading">
            <span className="ps-eyebrow">Twój pierwszy krok</span>
            <h2 id="start-title">Zacznij tak, jak Ci wygodnie.</h2>
          </div>
          <div className="ps-start-grid">
            <article>
              <IconLayout size={30} stroke={1.4} aria-hidden="true" />
              <h3>Chcesz sprawdzić układ kuchni?</h3>
              <p>
                Wybierz układ prosty, L lub U. Dodaj szafki i zobacz wstępny
                pomysł w 3D. Nie potrzebujesz konta.
              </p>
              <a className="ps-button" href="#/kreator-kuchni">
                Otwórz kreator kuchni{" "}
                <IconArrowRight size={20} aria-hidden="true" />
              </a>
              <p className="ps-form-note">
                To szkic do rozmowy. Wymiary, rozwiązania i cenę potwierdzimy
                osobno.
              </p>
            </article>
            <article>
              <IconRulerMeasure size={30} stroke={1.4} aria-hidden="true" />
              <h3>Masz już pomysł lub projekt?</h3>
              <p>
                Opisz, czego potrzebujesz. Możesz zacząć od przybliżonych
                wymiarów i tego, co ma się zmieścić w Twoich meblach.
              </p>
              <a className="ps-button secondary" href="#/zapytanie">
                Opisz swój pomysł{" "}
                <IconArrowRight size={20} aria-hidden="true" />
              </a>
              <p className="ps-form-note">
                Kuchnia, szafa czy inna zabudowa — formularz jest wspólny.
              </p>
            </article>
          </div>
        </section>
        <section
          className="ps-public-section ps-gallery"
          id="wizualizacja"
          aria-labelledby="gallery-title"
        >
          <span className="ps-eyebrow">Najpierw zobacz projekt</span>
          <h2 id="gallery-title">
            Tak wyglądają nasze projekty, zanim trafią do produkcji
          </h2>
          <p className="ps-gallery-lead">
            To wizualizacje, nie zdjęcia z montażu. Pokazują wygląd kuchni i
            konstrukcję szafki. Materiały, detale i wyposażenie potwierdzamy w
            projekcie.
          </p>
          <div className="ps-gallery-grid">
            <figure>
              <img
                src="/animations/kuchnia-darii-v4-poster.jpg"
                alt="Kuchnia na wymiar z drewnianymi frontami i zielonymi szafkami wokół okna — wizualizacja projektu"
                loading="lazy"
                width="1280"
                height="720"
              />
              <figcaption>
                <strong>Kuchnia w drewnie i zieleni</strong>
                <span>Wizualizacja projektu · okucia poglądowe</span>
                <a
                  className="ps-under-link"
                  href="/animations/kuchnia-darii-v4.mp4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Obejrzyj animację kuchni (nowa karta)
                </a>
              </figcaption>
            </figure>
            <figure>
              <video
                controls
                playsInline
                muted
                preload="none"
                poster="/animations/szafka-skladanie-claude-poster.jpg"
                aria-label="Animacja składania przykładowej szafki"
                src="/animations/szafka-skladanie-claude.mp4"
              >
                Twoja przeglądarka nie obsługuje filmu.{" "}
                <a href="/animations/szafka-skladanie-claude.mp4">
                  Otwórz animację składania szafki
                </a>
                .
              </video>
              <figcaption>
                <strong>Od pojedynczych elementów do gotowej szafki</strong>
                <span>Wizualizacja projektu · przykładowa konstrukcja</span>
                <span>Uruchom animację, żeby zobaczyć kolejne etapy.</span>
              </figcaption>
            </figure>
          </div>
          <a className="ps-button secondary" href="#/zapytanie">
            Chcę taką wizualizację mojego wnętrza <IconArrowRight size={18} />
          </a>
        </section>
        <section className="ps-public-section ps-offer" id="uslugi">
          <div>
            <span className="ps-eyebrow">Meble pod Twoje wnętrze</span>
            <h2>Co dla Ciebie zrobimy</h2>
            <p>
              Każdy mebel projektujemy pod Twoje wymiary, ściany i sposób
              używania. Nie przerabiamy gotowych modułów.
            </p>
          </div>
          <div className="ps-offer-links">
            {SERVICES.map((x) => (
              <a key={x.title} href={`#/zapytanie/${x.kind}`}>
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
            Od pomiaru do montażu.
            <br />
            Jeden projekt, z którego powstaje wszystko.
          </h2>
          <p className="ps-process-lead">
            Wizualizacja, rysunki produkcyjne i rysunki montażowe powstają z tej
            samej konstrukcji. Dlatego to, co widzisz na ekranie, jest tym, co
            stanie u Ciebie.
          </p>
          <div className="ps-process-grid">
            {PROCESS.map(({ title, text }, index) => (
              <article key={title}>
                <span className="ps-process-step">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          className="ps-public-section ps-benefits"
          aria-labelledby="benefits-title"
        >
          <span className="ps-eyebrow">Co dostajesz w projekcie</span>
          <h2 id="benefits-title">Co dostajesz, czego zwykle nie widać</h2>
          <div className="ps-benefits-grid">
            {BENEFITS.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <a
                  className="ps-under-link"
                  href={item.href}
                  {...(item.href.endsWith(".pdf")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {item.link}
                </a>
              </article>
            ))}
          </div>
          <div className="ps-materials">
            <h3>Materiały i okucia</h3>
            <p>
              Dobieramy je do projektu, sposobu używania i ustalonego
              wyposażenia.
            </p>
            <ul>
              {MATERIALS.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
          <BrandCarousel />
        </section>
        <section
          className="ps-public-section ps-about"
          aria-labelledby="about-title"
          id="o-nas"
        >
          <div>
            <span className="ps-eyebrow">
              Mateusz Wojciechowski · Pan Stolarz
            </span>
            <h2 id="about-title">Kto za tym stoi</h2>
          </div>
          <div>
            <p>
              Nazywam się Mateusz Wojciechowski i prowadzę Pan Stolarz w
              Zielonej Górze. Sam jeżdżę na pomiary, sam projektuję i pilnuję,
              żeby to, co zatwierdzisz na ekranie, zgadzało się z tym, co
              przywieziemy.
            </p>
            <p>
              Projekt i dokumentację robię we własnym programie, więc
              wizualizacja i rysunki dla warsztatu nie rozjeżdżają się.
            </p>
          </div>
        </section>
        <section
          className="ps-public-section ps-service-area"
          aria-labelledby="area-title"
        >
          <span className="ps-eyebrow">Zielona Góra i okolice</span>
          <h2 id="area-title">Gdzie przyjeżdżamy</h2>
          <p>
            Pracownia jest w Zielonej Górze. Na pomiar i montaż przyjeżdżamy do:
          </p>
          <ul aria-label="Obszar działania">
            {AREAS.map((city) => (
              <li key={city}>{city}</li>
            ))}
          </ul>
          <p>
            Mieszkasz gdzie indziej w okolicy?{" "}
            <a href={PHONE.href}>Zadzwoń: {PHONE.label}</a> — ustalimy dojazd.
          </p>
        </section>
        <section
          className="ps-public-section ps-faq"
          aria-labelledby="faq-title"
        >
          <div>
            <span className="ps-eyebrow">Zanim zaczniemy</span>
            <h2 id="faq-title">Najczęstsze pytania</h2>
          </div>
          <div className="ps-faq-list">
            {[...FAQ, ...MORE_FAQ].map(({ question, answer }) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="ps-public-section ps-enquiry" id="zapytanie">
          <div>
            <span className="ps-eyebrow">Porozmawiajmy o Twoim wnętrzu</span>
            <h2>Zacznijmy od pomiaru</h2>
            <p>
              Napisz albo zadzwoń. Ustalimy termin, przyjedziemy, zmierzymy i
              przygotujemy projekt z wizualizacją 3D.
            </p>
            <a className="ps-button secondary" href={PHONE.href}>
              Zadzwoń: {PHONE.label}
            </a>
            <p className="ps-form-note">
              To zapytanie, a nie zamówienie ani rezerwacja terminu. Cena,
              zakres i możliwość realizacji wymagają potwierdzenia.
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
                    <option value="inne">Zabudowa lub meble łazienkowe</option>
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
                  placeholder="Przybliżone wymiary, czego potrzebujesz i kiedy chcesz mieć meble…"
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
        <div className="ps-footer-contact">
          <strong>Pan Stolarz · meble na wymiar</strong>
          <span>
            Zielona Góra · <a href={PHONE.href}>{PHONE.label}</a>
          </span>
          <small>{AREAS.join(" · ")}</small>
          <small>@panstolarz.meble</small>
        </div>
        <a href="#/logowanie">
          Panel stolarni
          <IconArrowUpRight size={17} />
        </a>
      </footer>
    </div>
  );
}
