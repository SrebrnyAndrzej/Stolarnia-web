# Pan Stolarz 2.0 — wdrożenie i stan

Wersja robocza przygotowana 31.10.2026. Trzy powierzchnie korzystające z istniejącego silnika: klient, właściciel i pracownik. Nie jest to potwierdzenie uruchomienia kont na produkcji.

## Co działa w kodzie

- Strona klienta z oryginalnym logo, opisem oferty i formularzem zapytania. Formularz zapisuje w osobnej tabeli, nie tworzy zamówienia ani fikcyjnej ceny. Po błędzie zachowuje dane; identyfikator wysłania ogranicza duplikaty przy ponowieniu.
- Logowanie Supabase Auth przez serwer, cookie HttpOnly/SameSite=Strict, role i przydziały sprawdzane na serwerze. Przeglądarka nie przechowuje tokenów ani kluczy w localStorage.
- Właściciel: nowy widok projektów, dane wyceny z istniejącej analizy, przejście do obecnego projektanta, ofert, umów i produkcji, zapytania klientów i zmiana dostępu istniejących członków.
- Pracownik: kalkulator szuflad z dotychczasową logiką oraz techniczny podgląd przypisanych projektów. Nie ma edycji, wycen, notatek handlowych, ustawień finansowych ani dostępu do starego API/MCP/eksportów.
- Konto klienta: techniczny podgląd wyłącznie przypisanych projektów. Publikowanie zaakceptowanych ofert dla klienta jest kolejnym etapem, nie gotową funkcją.
- 2D/3D/elewacja korzystają z danych istniejącego silnika. Właściwe projekty zaczynają od lekkiego rzutu 2D, a 3D uruchamia użytkownik. Demonstracja zawiera syntetyczną geometrię i oznaczoną wizualizację inspiracyjną, niezależną od modelu.

## Przed pierwszym wdrożeniem

1. Wykonać kopię istniejącej bazy. Zastosować `supabase/migrations/202610310001_pan_stolarz_access.sql` w **właściwym projekcie Supabase**. Migracja tworzy nowe tabele; nie zmienia dotychczasowego dokumentu projektów ani cen. Nie wykonano jej w tej sesji.
2. Ustawić serwerowe zmienne `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`. Nie używać prefiksu VITE_. `PAN_STOLARZ_ORIGIN` musi być dokładnym produkcyjnym originem (np. https://wlasciwa-domena.pl), zgodnym z adresem przeglądarki. W preview należy podać origin preview. Nie wpisywać wartości sekretów do repozytorium.
3. Utworzyć potwierdzone konta w Supabase Auth zgodnie z procesem właściciela. Wstawić członkostwa do `pan_stolarz_members`: `user_id` z Auth, `role` owner/employee/client, `display_name`, `active`, `project_ids`. Pierwszego właściciela ustanawia administrator bazy. Brak aktywnego członkostwa oznacza odmowę dostępu. Ten model obsługuje jedną stolarnię Pan Stolarz.
4. Dotychczasowe lokalne MCP stdio pozostaje w granicy uprawnień użytkownika komputera. HTTP MCP po wdrożeniu wymaga tokenu właściciela. Obecne połączenia HTTP bez tokenu przestaną działać — to celowa zmiana dostępu.
5. Sprawdzić właściciela i pracownika na prawdziwych kontach: logowanie, wylogowanie, cofnięcie członkostwa, kalkulator, projekty, próba wejścia do wyceny, PDF i MCP. W tej sesji testy to izolowane atrapy Supabase i lokalna przeglądarka; nie potwierdzają działania rzeczywistych kont.
6. Uzupełnić zatwierdzoną politykę prywatności i faktyczne dane firmy przed publicznym zbieraniem zapytań. Wizualizacja poglądowa nie może zostać opisana jako zrealizowana kuchnia klienta.

Nowe API działa domyślnie w trybie odmowy: bez konfiguracji Auth/migracji nie wolno udostępniać starego API jako obejścia. Brak logowania na lokalnym serwerze nie jest powodem do wyłączenia kontroli.

## Publiczny formularz

RPC `pan_stolarz_submit_request` zapisuje zapytanie atomowo. Limit to 6 zgłoszeń na godzinę na kubełek oparty na HMAC adresu IP; surowy IP nie trafia do tabeli limitów. Operacja usuwa kubełki starsze niż 2 dni. Funkcja jest dostępna wyłącznie service_role. Limit działa wspólnie dla instancji Vercel; może objąć osoby współdzielące publiczny adres IP. Migracja/RPC nie były wykonane na produkcji ani przetestowane z prawdziwym PostgreSQL — wymagają sprawdzenia w izolowanej bazie przed aktywacją.

## Granice obecnego etapu

- Brak kreatora zaproszeń, samodzielnej rejestracji i resetu hasła. Panel pozwala zmieniać przydziały i aktywność już przygotowanych kont, nie udaje wysyłania zaproszeń.
- Sesja trwa do wygaśnięcia tokenu Auth; brak automatycznego odświeżania, po wygaśnięciu ponowne logowanie. Cofnięcie aktywnego członkostwa jest sprawdzane przy następnym żądaniu.
- Formularz nie przyjmuje jeszcze plików. Konfigurator klienta z orientacyjną wyceną i ofertami jest następnym etapem; nie dublowano silnika prostym kalkulatorem metra bieżącego.
- Nie zmieniono zasad konstrukcji, profili okuć ani zatwierdzeń produkcyjnych. Status roboczy dokumentacji pozostaje ważny.
- Do zakończenia konfiguracji konto właściciela i pracownika można obejrzeć wyłącznie jako jawny podgląd (`#/podglad/owner`, `#/podglad/employee`, `#/podglad/client`). Podgląd nie jest uprawnieniem do prawdziwych danych.

## Sprawdzenia

`npm run typecheck`, `npm run build`, `npm run test:v2:unit`, `npm run test:v2:api` oraz `npm run test:v2:browser`. Browser: najpierw uruchomić aplikację i ustawić `PAN_STOLARZ_QA_URL`. Lokalnie w środowisku z Chromium: `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`. Bez tej zmiennej Playwright używa własnego zainstalowanego Chromium. Testy UI używają odpowiedzi syntetycznych, test API mockuje Supabase i uruchamia rzeczywisty Express. Testy regresji rdzenia: `node --import tsx --test --test-isolation=none src/*.test.ts src/server/*.test.ts`.
