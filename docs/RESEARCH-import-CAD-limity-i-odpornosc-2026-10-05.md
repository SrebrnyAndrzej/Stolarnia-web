# Import DXF/DWG: limity kosztu i odporność usługi

Data: 2026-10-05
Baza kodu: `52ea418cae90e27cbed4fdf0755ab67062c67cb3`
Zakres: statyczny przegląd parsera i konfiguracji wdrożenia; brak benchmarku i prób obciążeniowych; nie testowano produkcji.

## Problem i dowody

Import rysunku jest celowo potrzebny do pomiaru pomieszczeń, ale jest kosztowną funkcją publicznego API, dopóki autoryzacja P0 nie zostanie wdrożona.

- `src/server/app.ts:25` ustawia wspólny limit `express.json` na 30 MB dla całego API, nie osobny limit dla plików CAD. DXF oraz DWG trafiają jako tekst/base64 w JSON (`:152–154`); dekodowanie base64 tworzy kolejny bufor.
- `src/service.ts:515–539` konwertuje DWG, a następnie parsuje cały DXF synchronicznie w `DxfParser.parseSync()`; nie widać ograniczenia liczby encji ani wierzchołków przed pełną analizą.
- `src/core/dwg.ts:61–89` zapisuje plik tymczasowy, uruchamia zewnętrzny konwerter i czyta cały wynik do pamięci. Timeout LibreDWG to 60 s, ODA 120 s; funkcja Vercel ma `maxDuration: 60` i `memory: 1024` w `vercel.json`.
- `src/core/dxf.ts:72–111` łączy odcinki przez wielokrotne liniowe przeszukiwanie listy. Gdy odcinki są rozłączne, każda iteracja nie znajduje sąsiada i skanuje pozostałą listę, co daje kwadratowy wzrost pracy względem liczby odcinków w takim przypadku.
- Nie znaleziono rate limitu ani równoległości ograniczonej specyficznie dla CAD. Nie wykonywano testu, który potwierdzałby rzeczywisty czas/zużycie pamięci przy maksymalnym pliku.

**Ocena ryzyka:** nie jest to potwierdzone przeciążenie produkcji. To wiarygodny wektor odmowy usługi lub nadmiernych kosztów, szczególnie gdy API pozostaje anonimowe; po uwierzytelnieniu nadal trzeba limitować użytkownika, ponieważ konto może wysłać wiele drogich żądań.

## Zalecenia i priorytet

**P0 — razem z autoryzacją przed publicznym użyciem:** `POST /api/cad/analiza` i import DWG/DXF wymagają sesji i uprawnienia do danego warsztatu/projektu. Ochrona samego UI nie wystarczy.

**P1 — parametry limitów ustalić z benchmarku reprezentatywnych rysunków:** wprowadzić osobny limit bajtów dla surowego pliku (przed base64/dekodowaniem), maksymalną liczbę encji i wierzchołków, dozwolone formaty, limity czasu i współbieżności. Zwracać czytelne `413` dla rozmiaru, `429` dla limitu tempa/współbieżności oraz bezpieczny błąd dla limitu czasu. Nie ograniczać wszystkich endpointów JSON tym samym wysokim limitem.

**P1 — algorytm:** zastąpić skanowanie wszystkich pozostałych odcinków na każdy krok indeksem wierzchołków/końców z uwzględnieniem tolerancji lub inną strukturą o zmierzonym ograniczonym koszcie. Nie zmieniać zasad łączenia geometrii bez przypadków regresji.

**P1 — izolacja konwersji:** jeśli backend hosta uruchamia DWG-converter, wykonywać go poza krytyczną ścieżką żądania albo z limitem czasu krótszym od limitu funkcji, kontrolą pamięci/procesów, limitem kolejki i pewnym sprzątaniem. Zwrócić użytkownikowi ID/status zadania, gdy praca przekracza bezpieczny czas synchroniczny.

## Kryteria odbioru

1. Dla zestawu rzeczywistych, zanonimizowanych planów kuchni zmierzyć rozmiar, encje, wierzchołki, CPU, pamięć i czas p50/p95; z tych pomiarów zatwierdzić progi produktu.
2. Generator testowy tworzy rozłączne odcinki, bardzo długie polilinie, duplikaty i uszkodzone DXF/DWG. Czas algorytmu rośnie zgodnie z ustalonym budżetem do maksymalnego zaakceptowanego wejścia; przypadek rozłączny nie powoduje kwadratowego skoku.
3. Plik przekraczający limit odrzucany jest przed dekodowaniem/parsingiem, bez pełnej alokacji dodatkowych kopii; liczba encji/wierzchołków nad limitem zatrzymuje parser przed kosztownym łączeniem.
4. Konwersja błędna, zawieszona lub przekraczająca limit kończy się bez pozostawionych plików/procesów; test symuluje timeout i awarię konwertera.
5. Równoległe żądania ponad limit kolejki są odrzucane lub kolejkowane z ograniczoną długością; test potwierdza, że limity działają per konto/warsztat po uwierzytelnieniu i nie ufają nagłówkowi/user ID przesłanemu przez klienta.
6. Prawidłowe DXF/DWG w zaakceptowanym zakresie nadal zwracają te same ściany i jednostki; testy regresyjne zachowują kierunek, kolejność oraz tolerancję łączenia.

## Źródła

- OWASP API4:2023 Unrestricted Resource Consumption: https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/ — rozmiary wejść, czas, pamięć, limity interakcji i koszt na pojedyncze żądanie.
- OWASP Denial of Service Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html — limit rozmiaru wejść, kosztownych operacji, tempa i współbieżności.
- Lokalny kod: `src/server/app.ts`, `src/service.ts`, `src/core/dxf.ts`, `src/core/dwg.ts`, `vercel.json`.

Brak zmian w implementacji. Najpierw P0 autoryzacja; progi techniczne wymagają benchmarku, nie zgadywania.

## Uzupełnienie 08.10.2026 — izolacja zewnętrznego konwertera DWG

### Fakt z kodu i źródła wykonawczego

`src/core/dwg.ts` wywołuje `promisify(execFile)` dla wybranego ODA/LibreDWG z plikiem przesłanym przez użytkownika. Użycie `execFile` bez `shell: true` nie uruchamia domyślnie shella, co ogranicza ryzyko klasycznego shell injection przez argumenty. Nie tworzy jednak sandboxa procesu. Oficjalna dokumentacja Node stwierdza, że zmienna środowiskowa procesu potomnego domyślnie jest ustawiana na `process.env`; bieżące wywołanie nie podaje własnego `env`. [Node.js child_process](https://nodejs.org/api/child_process.html)

W efekcie, jeśli podatność w dekoderze/konwerterze zostanie wyzwolona przez spreparowany DWG, konwerter działa w granicach systemowych serwera i dziedziczy jego zmienne środowiskowe, potencjalnie także sekrety aplikacji. To **warunkowy wektor ryzyka**, nie dowód podatności konkretnej wersji ODA/LibreDWG ani eksploatacji. Nie potwierdzono, czy Vercel/środowisko produkcyjne ma konwerter dostępny, czy trasę można wywołać publicznie ani jakie sekrety są ustawione. Sama istniejąca linia kodu wystarcza jednak, by wymagać izolacji przed wdrożeniem CAD z prawdziwymi sekretami.

### Wymagane zachowanie i priorytet

**P0 przed włączeniem zewnętrznego DWG convertera w środowisku z sekretami:** proces potomny dostaje jawnie minimalne `env` (bez kluczy Supabase/Vercel, tokenów, haseł i sekretów sesji). Uruchamiać go z tymczasowym katalogiem wejścia/wyjścia i minimalnym użytkownikiem/systemowymi uprawnieniami. Preferować odrębną, izolowaną usługę/worker z limitem CPU/pamięci/czasu/dysku i blokadą niepotrzebnego ruchu sieciowego; samo usunięcie zmiennych env nie chroni odczytu plików, sieci ani innych uprawnień procesu.

`execFile` i argumenty przekazywane jako tablica powinny zostać zachowane; nie przełączać na `exec` ani `shell: true`. Ścieżka programu konwertera ma pochodzić wyłącznie z zaufanej konfiguracji administratora, nigdy z żądania użytkownika. Ograniczyć maksymalny stdout/stderr (`maxBuffer`) oraz sprawdzić zachowanie przy timeout i przerwaniu funkcji. Proces konwertera nie może publikować wejściowego ani wyjściowego pliku bez dalszej walidacji DXF i limitów encji/wierzchołków opisanych powyżej.

**P0 niezależnie:** auth i limity `POST /api/cad/analiza` oraz `/api/projekty/:id/import-cad` są warunkiem publikacji tych tras. Wysłanie przez API nie powinno pozwalać anonimowemu klientowi wykonywać kosztownej pracy konwertera.

### Testy akceptacyjne

1. Test używa nieszkodliwego fake convertera, który zapisuje widoczne mu nazwy env do pliku tymczasowego; w wariancie serwerowym nie otrzymuje żadnego testowego sekretu ani zmiennych aplikacji, a ma tylko jawnie dozwolone zmienne potrzebne konwerterowi.
2. Test potwierdza, że argumenty zawierające spacje/metaznaki pozostają pojedynczymi argumentami i proces uruchamia się bez shell; ścieżka programu nie może być przekazana przez payload HTTP.
3. Test symuluje wyjście ponad `maxBuffer`, timeout, przerwanie i niezerowy exit code; proces zostaje zakończony, prywatne temp files usunięte, szczegóły/zmienne/treść CAD nie trafiają do odpowiedzi ani logów.
4. Integracyjny negatywny test dla anonimowego i nieuprawnionego członka potwierdza odmowę przed uruchomieniem convertera; licznik fake convertera pozostaje na zero.
5. W środowisku testowym dokumentuje się sandboxowe limity i brak dostępu do sieci/sekretów. Nie testować atakujących plików na produkcyjnym konwerterze.

**Zależności:** wybór deploy/runtime i wersji ODA/LibreDWG; administrator kontroluje ścieżkę programu; P0 auth API/MCP; osobna konfiguracja izolowanego worker-a. **Pozostaje niezweryfikowane:** aktywność DWG konwertera w produkcji, aktualne wersje binariów i ich znane CVE, dostęp publiczny do tras, logi i sekrety Vercel. Nie uruchamiano DWG ani convertera podczas tego researchu.

Źródło ogólnej zasady kontroli plików wejściowych, skanowania, bezpiecznego przechowywania i izolacji: [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html). Jest to uzupełnienie istniejących limitów zasobowych, nie zastąpienie ich.
