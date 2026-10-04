# Pilna uwaga bezpieczeństwa: publiczne API przed wdrożeniem kont

Data przeglądu: 2026-10-04  
Baza kodu: `bb2a2257e2f10f447e67466dcd1bbee593c8df42`  
Zakres: statyczny przegląd kodu i konfiguracji; nie wykonywano żądań do środowiska produkcyjnego.

## Ustalenie

W `src/server/app.ts` przed zdefiniowaniem tras nie znaleziono middleware uwierzytelniającego ani autoryzującego żądania. Konfiguracja `vercel.json` kieruje `/api/:sciezka*` i `/mcp` do funkcji aplikacji. Trasy obejmują odczyt i zmianę materiałów, cen, ustawień oraz projektów; przez identyfikator projektu dostępne są m.in. umowy, eksporty, dokumentacja i operacje na modułach. `POST /mcp` tworzy serwer narzędzi MCP z tym samym serwisem aplikacji.

`src/store/store.ts` używa po stronie serwera `SUPABASE_SECRET_KEY` (lub starszego `SUPABASE_SERVICE_ROLE_KEY`) do bezpośrednich żądań REST. Migracja ogranicza role `anon` i `authenticated` dla tabeli bazy, co jest dobrą ochroną bezpośredniego Data API, ale nie autoryzuje publicznych tras Express. Aplikacja wykonuje zapytania z uprzywilejowanym kluczem, więc musi sama sprawdzić tożsamość i uprawnienia użytkownika przed każdą operacją.

**Wniosek warunkowy:** jeżeli wdrożenie Vercel nie jest objęte zewnętrzną ochroną dostępu (np. deployment protection lub własnym proxy), endpointy mogą być osiągalne bez logowania i umożliwiać odczyt, zmianę albo usunięcie danych. Nie sprawdzano ustawień ochrony Vercel ani dostępności produkcyjnego hosta; brak testu eksploatacyjnego. Do potwierdzenia konfiguracji zewnętrznej traktować jako blokadę publikacji danych rzeczywistych.

## Priorytet i zalecane działanie

**P0 — przed użyciem z prawdziwymi danymi lub publicznym udostępnieniem:** administrator powinien sprawdzić ustawienia ochrony deploymentu Vercel. Jeśli host jest publiczny, tymczasowo ograniczyć dostęp do aplikacji do czasu wprowadzenia uwierzytelniania i kontroli uprawnień w aplikacji. Nie traktować nieprzewidywalnego ID projektu ani ukrytego adresu jako autoryzacji.

**P0 — implementacja po stronie aplikacji (Claude):** zabezpieczyć jeden wspólny punkt wejścia dla wszystkich tras `/api` i `/mcp`, a następnie autoryzować zasób i czynność w kontekście warsztatu/organizacji. Samo poprawne logowanie nie wystarczy: każda trasa przyjmująca `:id`/`:uid`/`:wid` musi sprawdzić przynależność zasobu do warsztatu użytkownika oraz jego rolę. Domyślnie odmawiać dostępu. Obejmuje to także PDF/CSV/CAD, endpointy katalogów zapisujących ceny oraz wszystkie narzędzia MCP.

**Zależności:** dostawca tożsamości i weryfikacja sesji/JWT po stronie serwera; model warsztatu i członkostwa; role właściciel/pracownik; polityka dostępu do projektów i funkcji; testy REST, eksportów i MCP. Klucz sekretu pozostaje wyłącznie na serwerze. RLS tabeli Supabase nie zastępuje autoryzacji tras aplikacji korzystających z sekretu.

## Kryteria odbioru

1. Bez sesji każde żądanie odczytu lub zapisu danych firmowych oraz każde żądanie MCP otrzymuje `401` albo `403`; obejmuje to także PDF, CSV i CAD.
2. Użytkownik warsztatu A nie może odczytać, zmienić, usunąć, eksportować ani wygenerować dokumentu dla identyfikatora warsztatu B. Test obejmuje wszystkie rodziny tras ID-zależnych; odpowiedź nie ujawnia danych.
3. Pracownik nie może wykonać czynności zarezerwowanych dla właściciela; właściciel może zarządzać członkostwem zgodnie z polityką ról.
4. Po odebraniu członkostwa kolejne żądanie nie uzyskuje dostępu. Nie polegać wyłącznie na długowiecznej roli zapisanej w tokenie.
5. `SUPABASE_SECRET_KEY`/`SUPABASE_SERVICE_ROLE_KEY` nie występuje w bundlu przeglądarkowym, źródłach mapowanych ani odpowiedziach API.
6. Testy negatywne i pozytywne obejmują REST i MCP oraz przypadki własności zasobu; brak logowania tokenów, kluczy i danych klienta.

## Dowody w repozytorium

- `src/server/app.ts`: rejestracja tras i obsługa MCP; brak globalnej weryfikacji sesji w sprawdzonym pliku.
- `src/store/store.ts`: konfiguracja i serwerowe użycie sekretu Supabase.
- `vercel.json`: przekierowanie `/api/*` i `/mcp` do funkcji.
- `supabase/migrations/202609230001_stolarnia_baza.sql`: role `anon` i `authenticated` są odebrane tabeli; to chroni Data API, nie serwerowe endpointy aplikacji.

## Źródła

- Supabase, Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security — tabela w eksponowanym schemacie wymaga RLS/grantów; klucz sekretu działa jako `service_role` i omija RLS, ma pozostać po stronie serwera.
- OWASP API Security, API1:2023 Broken Object Level Authorization: https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/ — endpoint operujący na identyfikatorze obiektu ma sprawdzać autoryzację na poziomie obiektu.

To jest przegląd kodu, nie dowód, że ktoś uzyskał dostęp do danych ani że wdrożenie jest obecnie osiągalne publicznie.
