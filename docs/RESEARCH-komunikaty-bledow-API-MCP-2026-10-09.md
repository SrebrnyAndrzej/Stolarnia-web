# Bezpieczne komunikaty błędów dla API i MCP

Data: 2026-10-09  
Baza przeglądu: `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3`  
Zakres: statyczna analiza odpowiedzi błędów Express, magazynu Supabase i opakowania narzędzi MCP. Bez wywołań do produkcji, bez prawdziwych danych i bez zmian logiki aplikacji.

## Ustalenie

Istnieją dwa widoczne miejsca, w których wyjątki techniczne mogą trafić do odpowiedzi:

1. Globalny handler w `src/server/app.ts` mapuje wyjątki na 400, 409 albo 500. Dla 500 zapisuje `console.error(err)`, ale dla każdego statusu zwraca `{ blad: err.message }`. Błędy domenowe `BladUslugi` także zwracają treść; te są celowo formułowane dla naprawialnych problemów wejścia/projektu, lecz są klasyfikowane zbiorczo jako 400.
2. `src/store/store.ts` w razie odpowiedzi nie-2xx Supabase rzuca wyjątek zawierający status oraz do 200 znaków surowego body dostawcy. Przy wejściu przez Express wyjątek trafia do globalnego handlera i jego `message` jest zwracany klientowi. Przy MCP helper `bezpiecznie()` zwraca komunikat wyjątku; dla wyjątku innego niż `BladUslugi` dodaje jedynie prefiks „Błąd wewnętrzny” przed oryginalną treścią. Prefiks nie ukrywa szczegółów.

Skutek: przy błędzie integracji klient może otrzymać fragment diagnostyki bazy/dostawcy, a wyjątki z innych bibliotek mogą ujawnić ich treść. Repo nie dowodzi, że taki body zawiera sekret w obecnej konfiguracji; to przepływ, który może ujawnić szczegóły implementacji. Ryzyko dla anonimowego dostępu zależy także od niezweryfikowanej ochrony tras `/api` i `/mcp`.

## Dowód ze źródeł

OWASP Error Handling i REST Security zalecają odpowiedzi użytkownikowi bez szczegółów wewnętrznych oraz zachowanie diagnostyki po stronie serwera; szczegółowe komunikaty, ścieżki, stack trace i odpowiedzi zależności mogą pomagać w rozpoznaniu systemu. IETF RFC 9457 definiuje wspólny format `application/problem+json`; pole `detail` ma pomagać klientowi rozwiązać problem, nie debugować implementację. Sam format nie jest mechanizmem redakcji — serwer musi ustalić, które szczegóły są bezpieczne.

## Zalecenia dla Claude

**P0 — oddzielić błąd użytkowy od awarii wewnętrznej:** tylko znane, walidowane przypadki domenowe mogą zwracać szczegółowy i bezpieczny komunikat. Nieznany `Error`, awaria Supabase, pliku, konwertera lub biblioteki zwraca stabilny komunikat ogólny i identyfikator zdarzenia. Szczegóły przyczyny nie mogą być kopiowane do REST ani MCP.

**P0 — uciąć propagację treści upstream:** `Magazyn.rest()` nie powinien umieszczać body Supabase w wyjątku publicznym. Zachować klasę/kod statusu dostawcy do wewnętrznej diagnostyki z kontrolą dostępu i redakcją; nie logować kluczy, tokenów, pełnych body ani danych projektu. Wartość body po stronie klienta nie może być bezpośrednio renderowana w UI, promptach MCP ani odpowiedziach HTTP.

**P1 — stabilny kontrakt problemów:** dla REST przyjąć RFC 9457 lub jawny, równoważny kontrakt z `type`/kodem aplikacyjnym, `title`, bezpiecznym `detail`, `status` i identyfikatorem zdarzenia. Wybór nie może zmieniać semantyki statusu HTTP. Nieznany wyjątek ma 500; konflikt zapisu pozostaje rozpoznawalnym 409; naprawialne dane wejściowe dostają spójny 4xx. Nie ujawniać różnych odpowiedzi zależnie od tekstu błędu Supabase.

**P1 — MCP:** mapować `BladUslugi` na bezpieczne wskazówki możliwe do poprawienia przez model/użytkownika. Dla pozostałych wyjątków zwracać stały komunikat ogólny z correlation ID, `isError: true`; nie dołączać `Error.message`, stack trace ani treści wyjątku upstream.

**P1 — diagnostyka i prywatność logów:** nadać żądaniu losowy request/correlation ID, logować kategorię, trasę/narzędzie, status, czas, klasę/kod zależności i ten identyfikator. Ustalić allowlistę pól. Odrzucać lub redagować Authorization, klucze, body, dane klienta, umowy, argumenty CAD/PDF oraz surowe odpowiedzi zależności. Log injection: kontrolować CR/LF i długość wartości z wejścia.

## Kryteria odbioru

1. W atrapach Supabase zwracać unikalne canary zawierające udawany wewnętrzny detal. REST i MCP nie zawierają canary, stack trace, ścieżki, tokenu ani surowego body w odpowiedzi.
2. Błąd walidacji domenowej nadal wyjaśnia, które pole poprawić; konflikt zapisu zachowuje status 409; awaria nieznana ma status 500 i ogólną treść. Klient nie traci wskazówki, jak bezpiecznie naprawić własne dane.
3. Każda odpowiedź błędna REST ma zgodny status/body i identyfikator korelacyjny; dla MCP wynik nieudany ma `isError: true` i bezpieczny tekst.
4. Błąd po stronie serwera daje wystarczający wpis diagnostyczny po korelacji, ale nie ujawnia w logach sekretów, treści projektu, umowy ani pełnego body dostawcy.
5. Testy kontraktowe pokrywają `BladUslugi`, `KonfliktZapisu`, nieoczekiwany `Error`, timeout/fetch failure, odpowiedź Supabase non-2xx i wyjątek narzędzia MCP.
6. Test integracyjny bezpośrednio wywołuje Express `/api` oraz `/mcp`; samo testowanie formattera wyjątków nie dowodzi, że wszystkie ścieżki używają go poprawnie.

## Priorytet i zależności

**P0:** redakcja technicznych wyjątków w odpowiedziach REST/MCP i usunięcie surowego Supabase body z komunikatu. Zależności: auth/ACL P0 z `docs/SECURITY-API-publiczna-przed-kontami-2026-10-04.md` oraz granica HTTP MCP z `docs/RESEARCH-bezpieczenstwo-transportu-MCP-2026-10-08.md`. Sanitacja pozostaje wymagana nawet po zamknięciu publicznego dostępu.

**P1:** katalog kodów problemów, request ID i bezpieczne, skorelowane logowanie. Zależność: zatwierdzony schemat audytu i logów oraz polityka redakcji danych.

Miernik: w 100% testów wyjątek techniczny nie wycieka do klienta, a 100% odpowiedzi wewnętrznych 5xx ma ID, które pozwala znaleźć zredagowany wpis diagnostyczny; wszystkie naprawialne błędy domenowe zachowują użyteczne instrukcje.

## Ograniczenia

To wniosek ze statycznego przepływu kodu na wskazanym commicie; nie mierzono rzeczywistych body Supabase, logów Vercel, klienta MCP ani osiągalności tras. Nie stwierdzam, że już ujawniono sekrety lub że wystąpił incydent. Poprzedni brief autoryzacji wykazał brak middleware auth w kodzie, lecz zewnętrzna ochrona Vercel/proxy i produkcyjna ekspozycja nie były weryfikowane.

## Źródła

- OWASP, Error Handling Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html — ogólny komunikat na zewnątrz, szczegółowa diagnoza po stronie serwera.
- OWASP, REST Security Cheat Sheet, sekcja Error handling: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html — nie przekazywać technicznych szczegółów i call stacks klientom.
- IETF, RFC 9457: https://www.rfc-editor.org/rfc/rfc9457.html — Problem Details, bezpieczne `detail` skupione na korekcie problemu, nie debugowaniu implementacji.
- Powiązane materiały: `docs/SECURITY-API-publiczna-przed-kontami-2026-10-04.md`, `docs/RESEARCH-bezpieczenstwo-transportu-MCP-2026-10-08.md`, `docs/RESEARCH-audit-zdarzen-zespolowych-2026-10-05.md`.

## Pliki sprawdzone

- `src/server/app.ts` — globalny handler Express, statusy i ciało błędu.
- `src/store/store.ts` — fragment body Supabase do 200 znaków w `Error.message`.
- `src/mcp/server.ts` — `bezpiecznie()` i sposób zwracania nieoczekiwanych wyjątków MCP.
