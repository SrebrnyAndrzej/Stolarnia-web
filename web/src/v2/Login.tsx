import { useRef, useState, type FormEvent } from "react";
import {
  IconArrowLeft,
  IconEye,
  IconEyeOff,
  IconArrowRight,
  IconLock,
} from "@tabler/icons-react";
import { Logo } from "./ui";
import { request, type Principal } from "./api";

export function Login({
  onLogin,
  sessionError,
}: {
  onLogin: (p: Principal) => void;
  sessionError: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(sessionError);
  const ref = useRef<HTMLFormElement>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      setError("Wpisz poprawny e-mail i hasło.");
      ref.current
        ?.querySelector<HTMLInputElement>(
          !email ? "input[type=email]" : "input[name=password]",
        )
        ?.focus();
      return;
    }
    setBusy(true);
    setError("");
    try {
      onLogin(
        await request<Principal>("/api/v2/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
      setPassword("");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="ps-login-layout">
      <header>
        <a href="#/">
          <Logo />
        </a>
        <a href="#/" className="ps-back-link">
          <IconArrowLeft size={17} />
          Wróć na stronę
        </a>
      </header>
      <main className="ps-login-main">
        <div className="ps-login-intro">
          <span className="ps-eyebrow">
            Pan Stolarz · Twoja przestrzeń pracy
          </span>
          <h1>
            Dobry projekt.
            <br />
            Wspólna praca.
          </h1>
          <p>
            Projekty, narzędzia i ustalenia w jednym miejscu. Zaloguj się, aby
            wrócić do swojej pracy.
          </p>
          <div className="ps-login-photo">
            <img
              src="/images/kitchen-concept.png"
              alt="Przykładowa wizualizacja kuchni w naturalnym dębie"
            />
            <span>Wizualizacja poglądowa</span>
          </div>
        </div>
        <section className="ps-login-form">
          <IconLock size={29} stroke={1.5} />
          <h2>Zaloguj się</h2>
          <p>Użyj konta udostępnionego przez Pan Stolarz.</p>
          <form noValidate onSubmit={submit} ref={ref}>
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              maxLength={254}
              aria-describedby={error ? "login-error" : undefined}
            />
            <label htmlFor="login-password">Hasło</label>
            <div className="ps-password">
              <input
                id="login-password"
                name="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                maxLength={256}
                aria-describedby={error ? "login-error" : undefined}
              />
              <button
                type="button"
                aria-label={show ? "Ukryj hasło" : "Pokaż hasło"}
                aria-pressed={show}
                onClick={() => setShow((v) => !v)}
              >
                {show ? <IconEyeOff size={20} /> : <IconEye size={20} />}
              </button>
            </div>
            {error && (
              <p id="login-error" role="alert" className="ps-field-error">
                {error}
              </p>
            )}
            <button className="ps-button" disabled={busy} aria-busy={busy}>
              {busy ? "Logowanie…" : "Zaloguj się"}
              <IconArrowRight size={18} />
            </button>
          </form>
          <p className="ps-login-help">
            Nie masz konta lub nie pamiętasz hasła? Skontaktuj się z
            właścicielem stolarni.
          </p>
          <details className="ps-demo-links">
            <summary>Zobacz podgląd wersji 2.0</summary>
            <p>
              Podgląd nie wymaga logowania i zawiera wyłącznie dane przykładowe.
            </p>
            <a href="#/podglad/owner">Widok właściciela</a>
            <a href="#/podglad/employee">Widok pracownika</a>
            <a href="#/podglad/client">Widok klienta</a>
          </details>
        </section>
      </main>
    </div>
  );
}
