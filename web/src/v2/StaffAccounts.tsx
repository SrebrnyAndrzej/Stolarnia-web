import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { request, type Principal } from "./api";
import { Logo } from "./ui";
import { NAZWY_PROFILI, PROFILE_DOSTEPU, type ProfilDostepu } from "../../../src/server/uprawnienia";

export const OPISY_PROFILI: Record<ProfilDostepu, string> = {
  sprzedaz: "Projekt i szybki projekt przy kliencie, wycena i oferta. Bez kosztów zakupu i marży; umowy tylko do odczytu.",
  produkcja: "Wydania i pakiet produkcyjny P, uwagi, status „Gotowe do montażu”. Bez cen, umów i danych klienta.",
  montaz: "Wydania i pakiet montażowy M z adresem i kontaktem, uwagi, status „Zakończony”. Bez cen i umów.",
};

/** Wybór profilu dostępu — o uprawnieniach decyduje serwer (src/server/uprawnienia.ts). */
export function ProfileSelect({ value, onChange, disabled, name, invalid }: { value: ProfilDostepu | ""; onChange: (v: ProfilDostepu) => void; disabled?: boolean; name: string; invalid?: boolean }) {
  return (
    <fieldset disabled={disabled} aria-invalid={invalid || undefined}>
      <legend>Profil dostępu (wymagany)</legend>
      {PROFILE_DOSTEPU.map((p) => (
        <label className="ps-check" key={p}>
          <input id={`${name}-${p}`} type="radio" name={name} value={p} checked={value === p} required onChange={() => onChange(p)} />
          <span>
            <strong>{NAZWY_PROFILI[p]}</strong> — {OPISY_PROFILI[p]}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function ActivationLink({ value }: { value: string }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <section className="ps-member" aria-label="Link aktywacyjny">
      <h3>Przekaż link pracownikowi</h3>
      <p>
        Link pozwala ustawić własne hasło. Traktuj go jak hasło i przekaż
        wyłącznie tej osobie. Nie wysyłamy automatycznie e-maila.
      </p>
      <label htmlFor={id}>Jednorazowy link</label>
      <input
        id={id}
        className="input"
        readOnly
        type={shown ? "text" : "password"}
        value={value}
        autoComplete="off"
      />
      <div className="row">
        <button
          type="button"
          className="ps-button secondary"
          aria-pressed={shown}
          onClick={() => setShown((v) => !v)}
        >
          {shown ? "Ukryj link" : "Pokaż link"}
        </button>
        <button
          type="button"
          className="ps-button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setMessage("Link skopiowany.");
            } catch {
              setShown(true);
              setMessage(
                "Nie udało się skopiować. Zaznacz i skopiuj widoczny link ręcznie.",
              );
            }
          }}
        >
          Kopiuj link
        </button>
      </div>
      <p role="status">{message}</p>
    </section>
  );
}

export function CreateEmployee({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [job, setJob] = useState("Pracownik");
  // Bez wartości domyślnej: właściciel świadomie wybiera profil (serwer też go wymaga).
  const [profile, setProfile] = useState<ProfilDostepu | "">("");
  const [operation, setOperation] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [invalid, setInvalid] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const field =
      name.trim().length < 2
        ? "staff-name"
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
          ? "staff-email"
          : !job.trim()
            ? "staff-job"
            : !profile
              ? "staff-profile-sprzedaz"
              : "";
    setInvalid(field);
    setError("");
    if (field) {
      setError("Uzupełnij imię, poprawny e-mail, funkcję i wybierz profil dostępu pracownika.");
      form.current?.querySelector<HTMLInputElement>(`#${field}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const result = await request<{ activation_url: string }>(
        "/api/v2/members",
        {
          method: "POST",
          body: JSON.stringify({
            operation_id: operation,
            display_name: name.trim(),
            email: email.trim(),
            job_role: job.trim(),
            access_profile: profile,
            project_ids: [],
          }),
        },
      );
      setLink(result.activation_url);
      setName("");
      setEmail("");
      setJob("Pracownik");
      setProfile("");
      setOperation(crypto.randomUUID());
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="ps-member">
      <h2>Dodaj pracownika</h2>
      <p>
        Nowe konto otrzyma poziom „Pracownik”. Projekty udostępnisz poniżej po
        utworzeniu konta.
      </p>
      <form ref={form} noValidate onSubmit={submit}>
        <fieldset disabled={busy}>
          <legend>Dane konta</legend>
          <label htmlFor="staff-name">Imię i nazwisko</label>
          <input
            id="staff-name"
            className="input"
            value={name}
            maxLength={120}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={invalid === "staff-name" || undefined}
            aria-describedby={error ? "staff-create-error" : undefined}
          />
          <label htmlFor="staff-email">E-mail pracownika</label>
          <input
            id="staff-email"
            className="input"
            type="email"
            value={email}
            maxLength={254}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={invalid === "staff-email" || undefined}
            aria-describedby={error ? "staff-create-error" : undefined}
          />
          <label htmlFor="staff-job">Funkcja w zespole</label>
          <input
            id="staff-job"
            className="input"
            value={job}
            maxLength={80}
            onChange={(e) => setJob(e.target.value)}
            aria-invalid={invalid === "staff-job" || undefined}
            aria-describedby="staff-job-help"
          />
          <p id="staff-job-help">
            Np. projektant, produkcja lub montażysta. Nazwa funkcji nie nadaje
            dostępu — o uprawnieniach decyduje profil dostępu.
          </p>
        </fieldset>
        <ProfileSelect name="staff-profile" value={profile} onChange={setProfile} disabled={busy} invalid={invalid === "staff-profile-sprzedaz"} />
        {error && (
          <p id="staff-create-error" role="alert" className="ps-field-error">
            {error}
          </p>
        )}
        <button className="ps-button" disabled={busy} aria-busy={busy}>
          {busy ? "Tworzenie konta…" : "Utwórz konto i link"}
        </button>
      </form>
      {link && (
        <>
          <p role="status">
            Konto utworzone. Skopiuj link przed opuszczeniem strony.
          </p>
          <ActivationLink value={link} />
        </>
      )}
    </section>
  );
}

export function ActivateAccount({
  hash,
  onLogin,
}: {
  hash: string;
  onLogin: (p: Principal) => void;
}) {
  const [params] = useState(
    () => new URLSearchParams(hash.split("?")[1] ?? ""),
  );
  useEffect(() => {
    history.replaceState(
      null,
      "",
      `${location.pathname}${location.search}#/aktywacja`,
    );
  }, []);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (password.length < 12 || password.length > 128 || password !== repeat) {
      setError("Wpisz takie samo hasło w obu polach, od 12 do 128 znaków.");
      form.current?.querySelector<HTMLInputElement>("input")?.focus();
      return;
    }
    setError("");
    setBusy(true);
    try {
      onLogin(
        await request<Principal>("/api/v2/activate", {
          method: "POST",
          body: JSON.stringify({
            token_hash: params.get("token"),
            type: params.get("type"),
            password,
          }),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
      setPassword("");
      setRepeat("");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="ps-login-page">
      <Logo />
      <section className="ps-login-form">
        <h1>Ustaw własne hasło</h1>
        <p>
          Hasło powinno mieć od 12 do 128 znaków. Możesz wkleić hasło z
          menedżera haseł.
        </p>
        <form ref={form} noValidate onSubmit={submit}>
          <label htmlFor="activate-password">Nowe hasło</label>
          <input
            id="activate-password"
            type={shown ? "text" : "password"}
            value={password}
            maxLength={128}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? "activate-error" : undefined}
          />
          <label htmlFor="activate-repeat">Powtórz hasło</label>
          <input
            id="activate-repeat"
            type={shown ? "text" : "password"}
            value={repeat}
            maxLength={128}
            autoComplete="new-password"
            onChange={(e) => setRepeat(e.target.value)}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? "activate-error" : undefined}
          />
          <button
            type="button"
            className="ps-text-button"
            aria-pressed={shown}
            onClick={() => setShown((v) => !v)}
          >
            {shown ? "Ukryj hasła" : "Pokaż hasła"}
          </button>
          {error && (
            <p id="activate-error" role="alert" className="ps-field-error">
              {error}
            </p>
          )}
          <button className="ps-button" disabled={busy} aria-busy={busy}>
            {busy ? "Aktywowanie…" : "Ustaw hasło i wejdź do panelu"}
          </button>
        </form>
        <a href="#/logowanie">Wróć do logowania</a>
      </section>
    </main>
  );
}
