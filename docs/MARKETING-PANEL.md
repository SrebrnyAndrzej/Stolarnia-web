# Panel publikacji social (Facebook + Instagram)

Panel → **Marketing** (tylko właściciel). Rdzeń i reguły pochodzą z publikatora Codexa (`Stolarnia App/tools/social-publisher`, 15.11.2026). Zostały przeniesione do bazy v2, żeby działały na stronie, a nie tylko na jednym komputerze.

## Jak to działa
- **Import paczki** (`content-import.json`, schemaVersion 1, np. kampania v07/v09) razem z folderem grafik. Panel sprawdza SHA-256 każdej grafiki, wgrywa ją do publicznego bucketu `pan-stolarz-marketing`, a posty ustawia jako „czeka na akceptację”. Akceptacje zapisane w pliku są ignorowane.
- **Nowy post / edycja:** grafika (JPEG; inne formaty przeglądarka zamienia na JPEG), teksty IG i FB, data w czasie polskim, kanały, rodzaj. Podgląd pokazuje, jak post wygląda na Instagramie i Facebooku. Każda zmiana tworzy nową wersję i cofa akceptację.
- **Oferty z terminami:** post obiecujący terminy wymaga „Potwierdź terminy”. Potwierdzenie jest ważne 24 h i najdłużej do końca oferty. Później wysyłka zostaje wstrzymana, a nie wykonana na ślepo.
- **Akceptacja** dotyczy konkretnej wersji:
  - post (feed) trafia do kolejki;
  - story i koncepcja reklamy trafiają do „ręcznej publikacji”; po wrzuceniu ich ręcznie oznaczasz je jako opublikowane.
- **Wysyłka** obejmuje tylko należne posty (data minęła), zaakceptowane i z aktualnym potwierdzeniem:
  - przed wysłaniem serwer pobiera grafikę i porównuje jej SHA-256 z zaakceptowaną;
  - każdy kanał (FB, IG) jest osobnym zadaniem z dzierżawą;
  - brak odpowiedzi Meta albo przerwana wysyłka daje stan **„niepewne — sprawdź na profilu”**, nigdy ponowną publikację;
  - odrzucenie przez Meta (4xx) daje stan „błąd” i oznacza, że nic nie opublikowano.
- **Symulacja** jest trybem domyślnym: nic nie wychodzi na profile, a stan „symulacja” nie jest stanem „opublikowane”. Panel zawsze pokazuje, w jakim trybie działa.

## Uruchomienie publikacji na żywo (właściciel, Vercel → stolarnia-web → Settings → Environment Variables, Production)
1. W Meta Business: konto **Instagram firmowe** połączone ze **stroną Facebook** Pan Stolarz i aplikacja z uprawnieniami `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`.
2. Zmienne:
   - `META_PAGE_ID` — identyfikator strony Facebook;
   - `META_PAGE_TOKEN` — długoterminowy token strony (Page Access Token); **nigdy w repo ani na czacie**;
   - `META_IG_USER_ID` — identyfikator konta Instagram firmowego (Instagram Business Account ID);
   - `META_GRAPH_VERSION` — opcjonalnie, domyślnie `v21.0`;
   - `MARKETING_TRYB=live` — dopiero po teście; bez tego zawsze symulacja.
3. **Wysyłka automatyczna:** ustaw `CRON_SECRET` (losowy ciąg) i dodaj Vercel Cron wywołujący `GET /api/cron/marketing`. Vercel sam dołącza `Authorization: Bearer <CRON_SECRET>`. Bez sekretu adres zwraca 503, czyli automat jest wyłączony. Częstotliwość zależy od planu Vercel (Hobby: raz dziennie; Pro: np. co 15 min). Do tego czasu używaj przycisku „Wyślij należne teraz”.
4. Pierwszy test: jeden post na dedykowanym, testowym poście albo poza godzinami szczytu. Potem sprawdzenie na profilu.

## Ograniczenia
- Wysyłana jest pierwsza grafika posta (karuzele nie są jeszcze obsługiwane).
- Stories i reklamy płatne publikujesz ręcznie (API Meta nie obsługuje naklejek; reklama to osobna decyzja zakupowa).
- Kolejka mieszka w dokumencie bazy `glowna` (zapis z kontrolą wersji). Audyt przechowuje do 3000 ostatnich zdarzeń.
- Zapytania o statystyki postów (zasięgi) nie są pobierane.
