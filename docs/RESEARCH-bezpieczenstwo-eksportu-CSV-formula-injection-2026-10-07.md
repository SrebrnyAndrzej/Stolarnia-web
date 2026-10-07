# Bezpieczeństwo eksportu CSV do arkuszy

Data: 2026-10-07  
Baza przeglądu: `origin/main` = `8230275ad6dea52109f581c793bdd8d6f08684d3`.  
Zakres: statyczny przegląd eksportu listy formatek `GET /api/projekty/:id/formatki.csv`. Nie uruchamiano payloadów ani nie testowano produkcji.

## Wniosek

Eksport CSV zawiera tekst nazwy modułu i opisu materiału, a generator zabezpiecza jedynie separator, cudzysłów i znaki nowej linii. Pole zaczynające się od `=`, `+`, `-` lub `@` może zostać zinterpretowane przez arkusz kalkulacyjny jako formuła. Cytowanie komórki nie jest samo w sobie neutralizacją formuły. To potencjalny **CSV/formula injection** w scenariuszu, w którym kontrolowalny tekst trafi do pliku, a pracownik otworzy go w Excelu/LibreOffice.

## Dowód z repozytorium

- `src/core/production.ts`, `formatkiCSV()` eksportuje m.in. `f.etykieta`, `f.nazwaModulu`, `f.kodElementu`, `f.kategoria` i `f.materialOpis`. Funkcja `csv()` otacza pole cudzysłowami tylko, jeśli zawiera `;`, `"` lub znak nowej linii; nie rozpoznaje prefiksu formuły ani znaków sterujących.
- `NowyModul` w `src/service.ts` przyjmuje `nazwa?: string`, a `nowyModul()` kopiuje tę nazwę do `Modul.nazwa`; `zmienModul()` również przekazuje dane z body żądania do serwisu. Nazwa modułu jest więc potencjalnie kontrolowalnym polem tekstowym używanym potem przez `Formatka.nazwaModulu`.
- `src/server/app.ts` udostępnia CSV osobną trasą i wysyła `Content-Type: text/csv; charset=utf-8`. W poprzednim przeglądzie granicy API nie znaleziono middleware uwierzytelniającego wszystkie `/api`/`/mcp`; konfiguracja produkcyjna pozostaje niezweryfikowana. Ten brief nie potwierdza zdalnej eksploatacji ani dostępu do wdrożenia.
- Nie znaleziono testu regresji, który wstawia kontrolowany tekst do nazwy/opisu, eksportuje CSV i otwiera wynik w docelowych arkuszach.

## Źródło bezpieczeństwa

[OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection) opisuje interpretowanie komórek zaczynających się od `=`, `+`, `-`, `@` (oraz tab/CR/LF i niektórych znaków pełnej szerokości) jako formuł. OWASP podkreśla, że samo cytowanie i typowe escape'y mogą nie być trwałe po zapisaniu i ponownym otwarciu CSV w Excelu; nie istnieje jedno kodowanie bezpieczne dla każdego arkusza i każdego odbiorcy maszynowego. [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/21-Testing_for_CSV_Injection) zaleca sprawdzić pola niezaufane, separator/cudzysłów, rzeczywiste otwarcie w arkuszu oraz zapis i ponowne otwarcie.

## Priorytet i rekomendacje dla Claude

### P0 — najpierw domknąć ścieżkę end-to-end

1. Zabezpieczyć odczyt i zapis projektu zgodnie z P0 autoryzacji: sesja/rola, członkostwo warsztatu i uprawnienie do konkretnego projektu, zarówno przy modyfikacji nazwy, jak i pobraniu eksportu. Ochrona samego UI nie zabezpiecza API.
2. Ustalić, kto otwiera ten CSV i w czym: Excel, LibreOffice, system rozkroju, dostawca czy automatyczny import. Zmiana pól przez apostrof/tab może zmienić ich treść i uszkodzić import produkcyjny.
3. Dla pliku otwieranego przez człowieka preferować XLSX z jawnym typem komórki tekstowym dla wszystkich pól nie liczbowych albo osobny, czytelnie nazwany eksport arkuszowy z neutralizacją przetestowaną dla aplikacji/wersji używanych w warsztacie. Nie traktować prefiksowania tabulatorem jako uniwersalnej ochrony.
4. Jeśli trzeba zachować CSV maszynowy bez zmiany wartości tekstowych, utrzymać stały schemat/odbiorcę, walidować dozwolone wartości pól (np. nazwa/kod jako dane, nie formuła) i zabezpieczyć trasę autoryzacją. Oddzielny plik dla ludzi i plik maszynowy muszą być wyraźnie oznaczone, żeby pracownik nie otwierał niebezpiecznego wariantu.
5. Normalizacja musi być per-komórka po podziale pól, z poprawnym quotingiem separatora `;`, cudzysłowu, CR/LF i kontrolą znaków Unicode. Nie wykonywać regexu na całym wierszu po jego złożeniu.

### P1 — regresje eksportu

- Fikstury obejmują każdy pole tekstowe i prefiksy: `=`, `+`, `-`, `@`, tab, CR, LF, znaki full-width; także `";=1+1` i warianty separatora. Testuj wartości po rozkodowaniu CSV, nie tylko surowy tekst.
- Test ręczny w bezpiecznym, odizolowanym środowisku: otwarcie w aplikacji docelowej, kontrola czy formuła jest tekstem, zapis jako CSV i ponowne otwarcie. Jeśli używany jest XLSX, sprawdź typ komórki oraz ponowne otwarcie.
- Nie wysyłać „działającego” testu do zewnętrznego hosta. Można użyć nieszkodliwego `=1+1` w lokalnej fiksturze; nie testować eksfiltracji ani komend systemowych.
- Testy parsera potwierdzają, że pole jednej komórki nie może zmienić liczby komórek/nagłówków. Zachować polski separator dziesiętny, BOM i zgodność z importerem wskazanym przez warsztat.

## Kryteria odbioru

| Priorytet | Kryterium |
|---|---|
| P0 | Użytkownik bez uprawnienia do projektu nie może modyfikować pól źródłowych ani pobrać CSV; testy obejmują REST i MCP zgodnie z macierzą tras. |
| P0 | Każdy tekst zewnętrzny/edytowalny eksportowany do arkusza jest traktowany jako tekst; fikstury formuł nie wykonują się w zatwierdzonym środowisku docelowym, również po zapisaniu i ponownym otwarciu. |
| P0 | Ustalony odbiorca importu maszynowego akceptuje eksport po ochronie, bez cichej zmiany SKU/kodu/nazwy i bez utraty kolumn/wierszy. Jeśli nie, wydano osobne, jednoznacznie nazwane formaty: maszynowy oraz dla arkusza. |
| P1 | Test separatora, cytowania, CR/LF i znaków Unicode dowodzi zachowania struktury tabeli i blokuje cell-breakout. |
| P1 | W dokumentacji eksportu jest wskazana aplikacja arkuszowa/wersja, sposób otwarcia i wynik testu save/re-open; ograniczenia formatu są widoczne dla użytkownika. |

## Granice wniosku

- **Fakt:** obecny serializator nie ma widocznej sanitacji prefiksów formuł; pole `nazwaModulu` może pochodzić z nazwy modułu przekazanej do serwisu.
- **Ryzyko warunkowe:** wpływ zależy od tego, czy napastnik może zapisać taki tekst, czy pracownik pobierze plik i otworzy go w arkuszu oraz od zachowania programu/ustawień. Nie potwierdzono wykonania formuły w tej aplikacji.
- **Niezweryfikowane:** faktyczna dostępność publicznych tras w aktualnym wdrożeniu, używany odbiorca CSV, importery pił/CNC, konfiguracja Excel/LibreOffice i ochrona hosta. Nie wysyłano żądań do produkcji ani nie używano payloadu z siecią/komendami.

## Punkt wznowienia

W tej iteracji `origin/main` pozostał na `8230275ad6dea52109f581c793bdd8d6f08684d3`; nie wykryto nowych commitów Claude. Brief research-only; bez zmian generatora CSV lub ustawień hosta. Następnie sprawdzić, czy zmiany auth P0 i eksportów obejmują trasę CSV; po decyzji zakładu przetestować zarówno importer maszyny, jak i arkusz biurowy na bezpiecznych fiksturach. Ostatni analizowany commit `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`.
