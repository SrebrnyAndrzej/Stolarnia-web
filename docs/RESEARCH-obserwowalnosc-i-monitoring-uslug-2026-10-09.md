# Obserwowalność i monitoring usług

Data: 2026-10-09  
Baza przeglądu: `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3`  
Zakres: statyczny przegląd diagnostyki aplikacji oraz aktualnych możliwości dokumentowanych przez Vercel/OpenTelemetry. Bez dostępu do konta Vercel, ustawień projektu, produkcyjnych logów i bez zmian logiki.

## Problem i dowody z repozytorium

W kodzie serwera znaleziono wyłącznie kilka bezpośrednich wywołań `console.log/error`: start serwera, nieudane utrwalenie oraz ogólny handler 500 (`src/server/index.ts`, `src/server/app.ts`). W śledzonym kodzie nie znaleziono jawnego endpointu health/readiness, metryk, trace'ów, wspólnego loggera strukturalnego ani korelacji logu błędu z identyfikatorem żądania. Jest to brak w repo, a nie dowód braku logów platformy lub monitoringu skonfigurowanego w panelu.

Ważna konsekwencja konkretna dla aplikacji: ostatni brief `docs/RESEARCH-potwierdzenie-trwalego-zapisu-REST-MCP-2026-10-09.md` wykazał możliwość błędnego potwierdzenia mutacji przy awarii zapisu. Bez metryk i alarmu błędy `utrwal()` mogą pozostać niewidoczne, a sam log `console.error` nie zapewnia właścicielowi powiadomienia ani trendu. `docs/RESEARCH-komunikaty-bledow-API-MCP-2026-10-09.md` dodatkowo wymaga skorelowanej, zredagowanej diagnostyki.

## Fakty ze źródeł platformowych

- Vercel dokumentuje wbudowany podgląd invocations funkcji, błędów i zewnętrznych API; szczegółowe rozbicie latency/path zależy od funkcji planu. Stan konta i tego projektu nie został sprawdzony. [Vercel Observability](https://vercel.com/docs/observability)
- Vercel runtime logs grupuje wpisy według żądania i udostępnia m.in. Request ID oraz HTTP status. Retencja jest zależna od planu i dodatku: dokumentacja podaje 1 godzinę dla Hobby, 1 dzień Pro, 3 dni Enterprise, do 30 dni dla wybranych planów z dodatkiem. Logi są strumieniowane, z limitami liczby i rozmiaru wpisów. Dlatego panel logów nie jest sam w sobie długoterminowym audytem ani kopią danych. [Vercel Runtime Logs](https://vercel.com/docs/logs/runtime)
- Vercel Alerts o anomaliach błędów 5xx i użycia są według bieżącej dokumentacji w beta dla Enterprise oraz Pro z Observability Plus. Dostępność i koszt dla tej firmy nie są potwierdzone; projekt nie powinien polegać na funkcji bez sprawdzenia planu. [Vercel Alerts](https://vercel.com/docs/alerts)
- OpenTelemetry rozdziela telemetryczne sygnały na traces, metrics i logs; trace opisuje drogę pojedynczego żądania, metryki mierzą zachowanie w czasie, a logi zapisują zdarzenia. Są to uzupełniające się narzędzia. Nie oznacza to wymogu instalacji OpenTelemetry ani konkretnego vendora. [OpenTelemetry Signals](https://opentelemetry.io/docs/concepts/signals/)

## Zalecenia dla Claude

**P0 — minimalny, bezpieczny sygnał operacyjny:** emitować dla każdej odpowiedzi API/MCP co najmniej route/template (bez identyfikatora projektu), metodę, status, czas trwania, request ID i kategorię błędu. Osobno policzyć błąd utrwalania, konflikt wersji, timeout/fetch failure, import CAD, błąd eksportu oraz odpowiedź 5xx. Nigdy nie etykietować metryki PII, nazw klienta, ID projektu, parametrów CAD, treści umowy, tokenu ani dowolnego tekstu błędu; ograniczyć kardynalność etykiet.

**P0 — alarmy i runbook:** po potwierdzeniu możliwości w planie Vercel skonfigurować powiadomienie dla wzrostu 5xx i anomalii invocations. Gdy plan nie wspiera alarmów, wybrać zatwierdzony istniejący kanał monitoringu lub prosty zewnętrzny syntetyczny odczyt. Ustalić osobę odbierającą alarm, czas reakcji, procedurę sprawdzenia stanu bazy, rozróżnienia konfliktu od awarii i bezpiecznego ponowienia oraz status page dostawcy. Nie tworzyć automatycznego testu zapisującego na prawdziwych danych.

**P1 — health kontra readiness:** jeśli host wymaga probe, rozdzielić liveness (czy funkcja odpowiada) od readiness (czy zależność krytyczna jest gotowa). Odpowiedź publiczna ma być minimalna: status i ewentualnie losowy request ID; nie ujawniać URL, wersji, sekretów, projektu Supabase, tabel ani treści zależności. Probe nie może tworzyć brakującego rekordu bazy ani wykonywać mutacji. Szczegóły gotowości, o ile są potrzebne, wymagają uwierzytelnionej ścieżki operatorskiej.

**P1 — budżety niezawodności:** przez uzgodniony okres zmierzyć bazowy poziom dostępności, p95 czasu odpowiedzi per rodzina tras, odsetek 5xx oraz odsetek błędów zapisu. Dopiero właściciel określa SLO i progi alarmowe; bez baseline nie wpisywać arbitralnych obietnic SLA. Osobno liczyć błędny sukces/niejednoznaczny zapis jako zdarzenie jakościowe, bo 2xx nie pokazuje błędnego payloadu.

## Kryteria odbioru

1. Atrapą Supabase wymusza się 500, timeout i konflikt zapisu; każde zdarzenie ma request ID i ograniczoną kategorię, bez body, sekretów, danych klienta lub argumentów narzędzia w logu/metrykach.
2. Można przejść od request ID z odpowiedzią 5xx do jednego zredagowanego wpisu logu; request ID nie zawiera danych pochodzących od użytkownika.
3. Kontrolowany syntetyczny wzrost 5xx w preview/środowisku testowym uruchamia skonfigurowane powiadomienie i runbook; test nie dotyka danych produkcyjnych.
4. Health probe odróżnia samą żywotność funkcji od gotowości wymaganej zależności, nie tworzy danych i nie ujawnia szczegółów infrastruktury. Jeżeli platforma nie używa probe, nie dodawać publicznego endpointu bez potrzeby.
5. Zapisane są baseline, właściciel alertu, retencja platformowa, procedura reakcji oraz zatwierdzone SLO; każde niepotwierdzone ustawienie konta oznaczone jest jako nieznane.

## Priorytet i zależności

**P0:** minimalne korelowane metryki błędów zapisu i 5xx oraz działająca droga powiadomienia. Zależności: bezpieczne logowanie z `RESEARCH-komunikaty-bledow-API-MCP-2026-10-09.md` i prawidłowa semantyka odpowiedzi z `RESEARCH-potwierdzenie-trwalego-zapisu-REST-MCP-2026-10-09.md`.

**P1:** liveness/readiness i SLO po zebraniu baseline. Zależności: wiedza o modelu funkcji Vercel, zatwierdzone progi i osoba operacyjna. Nie zakładać posiadania Vercel Observability Plus ani zewnętrznego systemu.

Miernik: 100% błędów utrwalania i odpowiedzi 5xx w testach tworzy korelowalny, zredagowany sygnał; kontrolowana anomalia powoduje powiadomienie właściciela bez danych projektu w treści alarmu.

## Ograniczenia

To statyczna analiza śledzonego kodu i dokumentacji dostawcy. Nie zalogowano się do Vercel/Supabase, nie sprawdzono planu, retencji, alertów, rzeczywistych logów ani dostępności produkcji. Brak loggera w repozytorium nie dowodzi, że żaden monitoring nie istnieje poza nim. Bez zmian logiki i konfiguracji.

## Powiązane materiały

- `docs/RESEARCH-potwierdzenie-trwalego-zapisu-REST-MCP-2026-10-09.md` — błędne potwierdzenie po awarii zapisu.
- `docs/RESEARCH-komunikaty-bledow-API-MCP-2026-10-09.md` — redakcja błędów i request ID.
- `docs/RESEARCH-kopie-zapasowe-i-odtwarzanie-2026-10-04.md` — kopie i próba odtworzenia.
