# Bezpieczeństwo HTTP MCP i granica autoryzacji

Data: 2026-10-08  
Baza statycznego przeglądu: `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3`  
Zakres: endpoint `POST /mcp`, montaż serwera MCP i narzędzia w `src/mcp/server.ts`; bez żądań do produkcji i bez uruchamiania narzędzi modyfikujących dane.

## Ustalenie

W tej rewizji `/mcp` tworzy bezstanowy transport `StreamableHTTPServerTransport` i nowy serwer na każde żądanie. Serwer jest tworzony jako `utworzSerwerMcp(s)` i używa tego samego serwisu co REST. `package-lock.json` przypina `@modelcontextprotocol/sdk` do `1.30.0` (package range: `^1.17.0`). W `app.ts` nie widać lokalnego middleware autoryzacji przed rejestracją handlera `/mcp`; oddzielny przegląd REST/MCP również nie znalazł auth middleware dla tych ścieżek. Nie oznacza to, że endpoint jest publicznie osiągalny: bramka Vercel lub proxy nie była sprawdzana.

Nie znaleziono kontroli tożsamości, warsztatu, projektu ani uprawnienia wewnątrz rejestratorów narzędzi MCP. Wniosek wynika ze statycznego przeglądu: handler przekazuje żądanie do transportu, a fabryka serwera dostaje współdzieloną usługę bez widocznego kontekstu użytkownika. Nie badano wszystkich funkcji domenowych pod kątem ukrytych kontroli. HTTP MCP udostępnia narzędzia odczytu i modyfikacji, więc zabezpieczenie samego interfejsu REST nie wystarcza, jeśli klient MCP może dotrzeć do `/mcp`.

## Fakty ze specyfikacji MCP

- Autoryzacja protokołu jest opcjonalna dla ogólnego MCP. Gdy serwer wdraża OAuth dla HTTP transportu, bieżąca specyfikacja `2025-11-25` nakazuje weryfikować token przed obsługą żądania i sprawdzać, czy token został wydany właśnie dla tego serwera (audience/resource binding). Serwer nie może przekazywać tokenu klienta dalej do upstream API. To nie zwalnia aplikacji warsztatowej z własnej, wymaganej przez produkt autoryzacji danych klienta i czynności.
- Specyfikacja Streamable HTTP nakazuje walidację nagłówka `Origin`; nieprawidłowy podany Origin ma skutkować `403`. Autoryzacja i ochrona Origin rozwiązują różne problemy: kontrola Origin nie zastępuje sesji, członkostwa ani ACL.
- Endpoint może odpowiedzieć `405` na GET, jeżeli nie obsługuje strumienia SSE. Nie trzeba włączać sesji, aby poprawnie zabezpieczyć bezstanowy handler; każde żądanie powinno być uwierzytelnione i autoryzowane niezależnie.

## Zalecenia dla Claude

**P0 — przed użyciem z danymi warsztatu:** stosować wspólną serwerową granicę auth dla `/api` i `/mcp`, zanim nastąpi parsowanie dużego body, pobranie magazynu lub wykonanie narzędzia. Przekazywać zweryfikowaną tożsamość do wykonania MCP, a nie ufać promptom, nazwom narzędzi, identyfikatorom ani danym w argumentach.

Każde narzędzie powinno wykonywać sprawdzenie: sesja użytkownika → aktywne członkostwo w warsztacie → dostęp do projektu/obiektu → uprawnienie do konkretnej czynności. Nieznany przypadek ma odmawiać dostępu. Chronić także eksporty i narzędzia destrukcyjne. Macierz rola × zasób × czynność pozostaje do zatwierdzenia przez właściciela według `docs/RESEARCH-macierz-autoryzacji-tras-2026-10-05.md`.

Jeśli serwer przyjmuje bearer OAuth: poprawnie odkrywać metadane chronionego zasobu, sprawdzać wystawcę/podpis/wygasanie/audience oraz wymagane scope; nie logować tokenów i nie przekazywać tokenu MCP do Supabase ani innego API. Dla upstream używać osobnego poświadczenia/tokenu przeznaczonego dla tego zasobu. Samo dekodowanie JWT bez weryfikacji podpisu i oczekiwanych claims nie jest walidacją.

**Dodatkowa weryfikacja SDK:** w przypiętym `1.30.0` wrapper `server/streamableHttp.js` przekazuje `req.auth` i body do web-standard transportu. Ten transport robi kontrolę Origin tylko gdy skonfigurowano niepustą opcję `allowedOrigins` (`server/webStandardStreamableHttp.js`, `validateRequestHeaders`). Kod aplikacji konstruuje transport wyłącznie z `sessionIdGenerator: undefined`, więc nie przekazuje `allowedOrigins`; zatem kontrola wbudowana w SDK jest w tym call site wyłączona. To konkretny brak ochrony Origin w konfiguracji repozytorium, nie dowód, że edge nie stosuje własnej ochrony. Dodać sprawdzenie Origin na wspólnym middleware przed `express.json()` albo jawnie skonfigurować transport przy każdej ścieżce wejścia, z testami integracyjnymi.

Dla endpointu chmurowego allowlista Origin powinna uwzględniać wyłącznie zatwierdzone źródła przeglądarkowe; nadal nie traktować Origin jako tożsamości użytkownika. Dla lokalnego HTTP MCP dodatkowo wiązać usługę z loopback i autoryzacją.

## Testy odbioru

1. Macierz kontraktowa REST/MCP: anonimowy, właściciel warsztatu A, przypisany pracownik A, nieprzypisany pracownik A oraz użytkownik warsztatu B; dla narzędzi obejmować odczyt, zapis, usunięcie i eksport. Podmiana każdego identyfikatora projektu/obiektu na cudzy daje odmowę przed odczytem albo mutacją.
2. Żądanie anonimowe nie może wywołać żadnego narzędzia ani zdradzić danych w JSON-RPC, treści błędu lub logu. Odmowa nie zmienia stanu ani rewizji. Test wykonać bezpośrednio przez HTTP MCP, nie wyłącznie przez UI lub REST.
3. W przypadku OAuth: token z błędnym audience, wygasły, błędny podpis lub niewystarczający scope odrzucony; token klienta nie pojawia się w żądaniu downstream ani logach. W testach użyć atrap upstream i syntetycznych sekretów.
4. Origin nieobecny, prawidłowy i złośliwy — wynik zgodny z profilem wdrożenia; złośliwy Origin jest odrzucany `403`. Test musi wywoływać faktycznie używaną ścieżkę transportu (SDK albo middleware), a nie tylko testować pomocniczy walidator. Test nie może być uznany za test autoryzacji.
5. Połączenie bezstanowe: każde kolejne żądanie HTTP jest ponownie sprawdzane; cofnięcie członkostwa wpływa na kolejne wywołanie bez polegania na pamięci sesji transportu.
6. CI wymaga jawnej polityki dla każdego zarejestrowanego narzędzia: publiczny/uwierzytelniony, zakres danych, uprawnienie i mutowalność. Nowe narzędzie bez deklaracji lub testu polityki powoduje błąd.

## Priorytet, zależności, miara

**P0:** wykazać ochronę edge lub wdrożyć auth aplikacyjny zanim MCP otrzyma prawdziwe dane; dodać object/function-level ACL i testy dla wszystkich narzędzi. Zależności: model warsztatu/członkostwa, serwerowa weryfikacja sesji i zatwierdzona tabela ról.

**P1:** zweryfikować wersję i zachowanie SDK dla Origin, token audience/scopes, politykę logowania oraz testy regresji transportu.

**Miernik:** 100% narzędzi MCP ma zdefiniowaną i testowaną politykę; wszystkie przypadki anonimowe/cross-tenant/destrukcyjne bez uprawnienia odmawiają dostępu bez ujawnienia danych i bez zmiany stanu. Konfiguracja bramki produkcyjnej pozostaje osobnym dowodem do uzyskania.

## Ograniczenia

To statyczna analiza wskazanej rewizji. Repo nie dowodzi publicznej osiągalności `/mcp`, aktualnej konfiguracji Vercel, zachowania produkcyjnego SDK ani tego, czy upstream tokeny są używane. Brak błędów auth w pliku nie jest dowodem exploita. Należy ustalić bramkę hosta i odtąd testować także samą aplikację bez tej bramki.

## Źródła

- MCP Authorization, wersja 2025-11-25: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization — optional authorization, ale wymagania w razie wdrożenia OAuth HTTP, audience binding i zakaz token passthrough.
- MCP Streamable HTTP Transport, wersja 2025-11-25: https://modelcontextprotocol.io/specification/2025-11-25/basic/transports — Origin validation, uwagi o autoryzacji, zachowanie metod HTTP.
- MCP Security Best Practices, wersja 2025-11-25: https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices — token passthrough, audience i zagrożenia MCP proxy.
- Wewnętrzna macierz tras: `docs/RESEARCH-macierz-autoryzacji-tras-2026-10-05.md`.

## Pliki sprawdzone

- `package.json` i `package-lock.json` — SDK `^1.17.0`, przypięte `1.30.0`; wersja działająca na produkcji wymaga potwierdzenia w artefakcie deploy.
- `src/server/app.ts` — rejestracja JSON parsera, tras `/api`, `POST /mcp` i handlera pozostałych metod `/mcp`.
- `src/mcp/server.ts` — fabryka serwera i rejestracje narzędzi.
- `node_modules/@modelcontextprotocol/sdk/dist/esm/server/streamableHttp.js` i `webStandardStreamableHttp.js` — lokalny kod zgodny z lockfile; `allowedOrigins` jest opcjonalne i brak tej konfiguracji wyłącza sprawdzenie Origin.
