import { useEffect, useState } from "react";
import { Logo } from "./ui";
import "./privacy.css";

// Polityka prywatności formularza zapytań i strony (ST-APP-005). Dane administratora pochodzą z
// Ustawienia → Dane firmy (te same co w umowach), więc zmiana w ustawieniach od razu zmienia politykę.
// Treść opisuje faktyczne działanie aplikacji: formularz (pan_stolarz_requests), limit zgłoszeń
// (skrót HMAC adresu IP, kasowany po 2 dniach), hosting Vercel/OVH, baza Supabase w UE, brak analityki.

interface Administrator {
  nazwaFirmy: string;
  wlasciciel: string;
  nip: string;
  adres: string;
  kodPocztowy: string;
  miasto: string;
  email: string;
  telefon: string;
}

export const AKTUALIZACJA_POLITYKI = "15 listopada 2026";

export function PrivacyPolicy() {
  const [a, setA] = useState<Administrator | null>(null);
  const [blad, setBlad] = useState(false);
  useEffect(() => {
    document.title = "Polityka prywatności · Pan Stolarz";
    fetch("/api/public/administrator")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setA)
      .catch(() => setBlad(true));
  }, []);
  const kompletny = !!a && !!(a.nazwaFirmy || a.wlasciciel) && !!a.adres && !!(a.email || a.telefon);
  const nazwa = a ? [a.nazwaFirmy, a.wlasciciel].filter(Boolean).join(" — ") : "";
  return (
    <div className="ps-privacy-page">
    <header className="ps-public-header">
      <a href="#/" aria-label="Pan Stolarz — strona główna">
        <Logo />
      </a>
      <a className="ps-under-link" href="#/">
        ← Strona główna
      </a>
    </header>
    <main className="ps-privacy" id="tresc">
      <span className="ps-eyebrow">Pan Stolarz · meble na wymiar</span>
      <h1>Polityka prywatności</h1>
      <p className="ps-privacy-lead">Obowiązuje od {AKTUALIZACJA_POLITYKI}. Dotyczy strony Pan Stolarz, formularza zapytań i kontaktu w sprawie mebli na wymiar.</p>

      <h2>1. Administrator danych</h2>
      {kompletny ? (
        <p className="ps-privacy-admin">
          Administratorem danych jest <b>{nazwa}</b>
          {a!.nip ? `, NIP ${a!.nip}` : ""}, {a!.adres}
          {a!.kodPocztowy || a!.miasto ? `, ${[a!.kodPocztowy, a!.miasto].filter(Boolean).join(" ")}` : ""}. Kontakt w sprawie danych:{" "}
          {a!.email && <a href={`mailto:${a!.email}`}>{a!.email}</a>}
          {a!.email && a!.telefon ? ", " : ""}
          {a!.telefon && <a href={`tel:${a!.telefon.replace(/\s/g, "")}`}>{a!.telefon}</a>}.
        </p>
      ) : (
        <p className="ps-privacy-admin" role="status">{blad ? "Nie udało się wczytać danych administratora. Odśwież stronę." : a ? "Dane administratora są w trakcie uzupełniania. W sprawie danych zadzwoń: +48 572 548 957." : "Wczytywanie danych administratora…"}</p>
      )}

      <h2>2. Jakie dane i po co</h2>
      <ul>
        <li>
          <b>Formularz zapytania:</b> imię i nazwisko, e-mail, miejscowość, rodzaj mebli i opis. Wykorzystujemy je, żeby odpowiedzieć, umówić pomiar i przygotować wycenę na Twoją prośbę (art. 6 ust. 1 lit. b RODO — działania przed zawarciem umowy).
        </li>
        <li>
          <b>Ochrona formularza przed nadużyciami:</b> z adresu IP liczymy jednokierunkowy skrót (nie zapisujemy samego adresu) i liczbę zgłoszeń w ciągu godziny. Skrót usuwamy po 2 dniach (art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes: bezpieczeństwo usługi).
        </li>
        <li>
          <b>Telefon, e-mail, komunikatory:</b> dane, które sam przekażesz, wykorzystujemy do prowadzenia rozmowy i realizacji zamówienia.
        </li>
        <li>
          <b>Zamówienie:</b> gdy dojdzie do umowy, przetwarzamy dane potrzebne do jej wykonania (projekt, pomiar, montaż, rozliczenie) oraz wymagane przepisami podatkowymi i rachunkowymi (art. 6 ust. 1 lit. b i c RODO).
        </li>
      </ul>
      <p>Podanie danych jest dobrowolne, ale bez nich nie odpowiemy na zapytanie. Nie podejmujemy decyzji wyłącznie automatycznie i nie profilujemy. Nie przesyłaj w opisie danych wrażliwych ani dokumentów.</p>

      <h2>3. Jak długo</h2>
      <ul>
        <li>Zapytania, które nie zakończyły się umową — do 12 miesięcy od ostatniego kontaktu.</li>
        <li>Dane z zamówień — przez czas realizacji, gwarancji i rękojmi, a dokumenty rozliczeniowe — przez okres wymagany przepisami podatkowymi (zwykle 5 lat od końca roku podatkowego).</li>
        <li>Skrót adresu IP do limitu zgłoszeń — 2 dni.</li>
      </ul>

      <h2>4. Komu powierzamy dane</h2>
      <p>
        Dane przechowują dostawcy usług technicznych działający na nasze zlecenie: hosting strony i aplikacji (Vercel Inc., OVH SAS) oraz baza danych (Supabase Inc., serwery w Unii Europejskiej, Frankfurt). Dostawcy z siedzibą poza Europejskim Obszarem Gospodarczym przetwarzają dane na podstawie standardowych klauzul umownych zatwierdzonych przez Komisję Europejską. Nie sprzedajemy danych i nie przekazujemy ich do celów marketingowych.
      </p>

      <h2>5. Twoje prawa</h2>
      <p>
        Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przeniesienia oraz sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie. Napisz lub zadzwoń na kontakt z punktu 1. Możesz też złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl).
      </p>

      <h2>6. Pliki cookie i pamięć przeglądarki</h2>
      <p>
        Strona nie używa analityki ani reklam i nie śledzi odwiedzających. Pracownicy zalogowani do panelu dostają techniczne ciasteczko sesji. Przeglądarka może pamiętać ustawienia widoku (np. tryb oświetlenia 3D) oraz szkic opisu zapytania do czasu jego wysłania — te informacje nie są wysyłane do nas.
      </p>
      <p className="ps-privacy-back">
        <a className="ps-button secondary" href="#/zapytanie">
          Wróć do formularza zapytania
        </a>
      </p>
    </main>
    </div>
  );
}
