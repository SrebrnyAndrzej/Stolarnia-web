# Odporność aplikacji warsztatowej na utratę połączenia

Data: 2026-10-05
Baza kodu: `aa7ec661934d6215edef23c3d0e22ad6905df3c8` (`origin/main`)
Zakres: statyczne wyszukanie mechanizmów offline/cache w aplikacji oraz przegląd oficjalnych zaleceń web security. Nie testowano urządzeń ani sieci w warsztacie.

## Ustalenia z repozytorium

- Nie znaleziono rejestracji Service Workera, Cache API, IndexedDB ani mechanizmu synchronizacji offline w `web/src`, `src` i konfiguracji frontendu.
- W `localStorage` przechowywane są ustawienia widoku (filtr statusu, foldery klienta, zwinięte foldery oraz opcja wyglądu 3D), nie pełne projekty. Nie jest to mechanizm offline.
- Frontend pobiera dane przez API; API wymaga serwera/Supabase. Interfejs nie ma widocznego, wspólnego stanu „offline / zapis oczekuje / synchronizacja zakończona”.
- Pamięć projektu, klienta, umowy i produkcji jest poufna. Istniejący brief prywatności wymaga `Cache-Control: no-store` dla prywatnych odpowiedzi; brief autoryzacji P0 nadal jest zależnością przed włączeniem kont i wspólnej pracy.

Brak znalezionego mechanizmu offline jest faktem z przeglądu tego repozytorium, nie wynikiem testu wszystkich przeglądarek ani dowodem, że żaden użytkownik nie ma danych zapisanych poza aplikacją.

## Wnioski ze źródeł

- Service Worker może przechwytywać żądania strony i zwracać dane z Cache API. OWASP wskazuje, że Cache API nie respektuje nagłówków HTTP cache i wpisy nie wygasają automatycznie; odpowiedzi zawierające dane poufne należy z niego wykluczyć. Service Worker musi mieć ograniczony scope i procedurę aktualizacji/wycofania.
- OWASP odradza przechowywanie danych wrażliwych oraz tokenów w `localStorage`/`sessionStorage`. IndexedDB jest lepsza do danych strukturalnych/offline, lecz nie zapewnia poufności wobec użytkownika profilu, innego procesu na urządzeniu ani kodu XSS. Dane pochodzące z IndexedDB trzeba walidować jak niezaufane wejście.
- Background Sync może odłożyć operację do czasu powrotu sieci, ale to nie rozwiązuje konfliktu rewizji, ponowienia operacji, autoryzacji ani gwarancji, że przeglądarka ją wykona. Odbiór zapisu nadal musi pochodzić z serwera.

## Proponowane zachowanie etapami

### P0 — bezpieczny stan przy awarii sieci

1. Wspólny wskaźnik „Brak połączenia” oraz czas ostatniego potwierdzonego odczytu/zapisu. Nie przedstawiać starego widoku jako aktualnego.
2. Wyłączyć operacje zapisu i produkcyjne eksporty w stanie offline; zachować lokalny formularz w pamięci karty do chwili powrotu użytkownika. Nie wysyłać automatycznie niepotwierdzonych zmian.
3. Po ponownym połączeniu wykonać ponowną autoryzację i odczyt rewizji. Jeśli zmienił się projekt, pokazać konflikt z możliwością skopiowania/odzyskania szkicu; nie robić ślepego retry.
4. Nie buforować w Service Workerze odpowiedzi API, projektów, klientów, notatek, cen, umów ani PDF/CSV/DXF. Odpowiedzi prywatne pozostają `no-store`; awaria offline nie może zmieniać autoryzacji serwera.

### P1 — jawnie przygotowany pakiet do pracy terenowej

Dopiero po wdrożeniu auth/ACL i decyzji właściciela o urządzeniach oraz retencji rozważyć ręczne „Przygotuj pakiet offline” dla przypisanego projektu lub wydania produkcyjnego. Pakiet powinien być migawką tylko do odczytu z identyfikatorem rewizji, listą dołączonych artefaktów, datą pobrania i terminem ważności zatwierdzonym przez właściciela. Ekran stale pokazuje, że treść może być nieaktualna; po powrocie sieci wymaga weryfikacji aktualnej rewizji. Wykluczyć dane klienta/umowy, chyba że istnieje odrębna, zatwierdzona potrzeba i polityka urządzeń.

Nie włączać automatycznej kolejki zmian konstrukcji, cen, umów ani wydań produkcyjnych offline. Operacje te wymagają serwerowej autoryzacji, warunkowego zapisu i idempotencji; po konflikcie człowiek musi podjąć decyzję. Ewentualny offline zapis szkiców wymaga osobnej specyfikacji zagrożeń, szyfrowania i zarządzania kluczem na urządzeniu, limitu przechowywania oraz usuwania przy wylogowaniu/zmianie warsztatu. Samo szyfrowanie IndexedDB nie chroni przed aktywnym XSS.

## Priorytety, zależności, kryteria odbioru

| Priorytet | Problem i dowód | Wymagane zachowanie | Zależności | Mierzalny odbiór |
|---|---|---|---|---|
| P0 | Brak mechanizmu offline; użytkownik może nie wiedzieć, czy zapis został potwierdzony | Globalny stan sieci i potwierdzeń; formularz nie sugeruje zapisu przed odpowiedzią serwera | API error model, rewizje/konflikty | W teście odłączenia podczas edycji widać offline, zapis nie jest uznany za zakończony, a szkic pozostaje widoczny w tej karcie |
| P0 | Cache Service Workera mógłby utrwalić prywatne odpowiedzi | Cache wyłącznie dla wersjonowanych zasobów statycznych; prywatne API i eksporty wykluczone | Auth P0, polityka cache | Test cache po wylogowaniu i zmianie warsztatu nie zwraca danych projektu; skan cache nie wykazuje prywatnych JSON/PDF/CSV |
| P1 | W terenie może brakować sieci, a dane konstrukcji mogą być potrzebne do montażu | Opcjonalny, jawnie pobrany pakiet migawki tylko-do-odczytu | Zatwierdzona polityka urządzeń, ACL, no-store online, limit retencji | Pakiet pokazuje rewizję i timestamp; po wygaśnięciu/zmianie użytkownika jest usuwany; żadna zmiana offline nie trafia automatycznie do produkcji |
| P2 | Pełna synchronizacja offline może powodować konflikty i podwójne operacje | Dopiero po osobnym projekcie eventów idempotentnych i konfliktów domenowych | Rewizja projektu, idempotency key, audyt i UX konfliktu | Test utraconej odpowiedzi i dwukrotnego ponowienia tworzy najwyżej jedną operację; nie nadpisuje zmiany innego pracownika |

## Scenariusze testowe

- Utrata sieci przed, w trakcie i po wysłaniu zapisu; przerwanie odpowiedzi po zatwierdzeniu przez serwer; powrót online po zmianie tej samej rewizji przez drugiego pracownika.
- Wylogowanie, zmiana warsztatu, odebranie członkostwa, zamknięcie karty i ponowne otwarcie po przygotowaniu pakietu.
- Inspekcja Cache API, IndexedDB, localStorage i sessionStorage: brak sekretów, tokenów, umów i danych osobowych po wylogowaniu oraz zmiany tenant.
- Utrata/pełny storage przeglądarki; quota/eviction; stara wersja aplikacji i rollout/wycofanie Service Workera.
- Odczyt offline nie może sugerować, że projekt jest najnowszy, zaakceptowany lub gotowy do produkcji.

## Źródła

- OWASP HTML5 Security Cheat Sheet, Client-side storage i Offline Applications: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- MDN, Service Worker API — instalacja i cache: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
- MDN, Background Synchronization API: https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
- MDN, IndexedDB basics: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology
- Repozytorium: `web/src/views/Projects.tsx` (preferencje UI), `web/src/views/Widok3D.tsx` (preferencja wyglądu), `src/server/app.ts` (aktualnie jawne `no-store` tylko dla PDF umowy), `docs/RESEARCH-prywatnosc-retencja-dokumentow-2026-10-04.md`, `docs/RESEARCH-wspolpraca-zapis-scenariusze-2026-10-01.md`.

To rekomendacja produktu i architektury, nie obietnica dostępności offline. Nie zmieniano implementacji ani polityki retencji.
