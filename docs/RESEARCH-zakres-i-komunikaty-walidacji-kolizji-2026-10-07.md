# Zakres walidacji i prawdziwe komunikaty o kolizjach

Data: 2026-10-07  
Baza przeglądu: `origin/main` = `8230275ad6dea52109f581c793bdd8d6f08684d3`.  
Zakres: statyczny przegląd walidacji geometrii projektu oraz komunikatu MCP. Bez zmian logiki; rekomendacje dla Claude.

## Ważne ustalenie

Obecny MCP może zakończyć walidację tekstem **„Brak uwag — projekt zgodny z normami i bez kolizji.”**, gdy lista sprawdzeń zwróci zero uwag. W kodzie `src/core/validation.ts` ta lista obejmuje wybrane zakresy wymiarowe katalogowych modułów, wyjście poza obręb pojedynczej ściany oraz nakładanie się prostokątów modułów w elewacji tej samej ściany. Nie sprawdza pełnej bryły korpusu, wewnętrznych części, ruchu drzwi/szuflad, okuć, prześwitów montażowych ani kolizji między ścianami. Sam wynik „brak uwag” nie dowodzi więc pełnej zgodności projektu lub braku kolizji w użytkowaniu.

## Dowód w aktualnym kodzie

- `src/core/validation.ts` — `walidujProjekt()`:
  - wybiera zakresy wymiarowe tylko dla rozpoznanych kategorii/konstrukcji; odchylenia głębokości i wysokości są ostrzeżeniami, a szerokość poza typoszeregiem jest informacją;
  - wykrywa brak przypisanej ściany oraz moduł wychodzący poza długość/wysokość ściany;
  - grupuje moduły po `scianaId` i przecina ich zakresy X/Y jako prostokąty elewacji, stosując odjęcie `0.5` mm przy porównaniu krawędzi;
  - nie używa geometrii części/operacji, brył 3D ani trajektorii elementów ruchomych.
- `src/mcp/server.ts`, narzędzie `waliduj_projekt`: dokłada ostrzeżenia konstrukcyjne z analizy, po czym dla pustej listy zwraca tekst „Brak uwag — projekt zgodny z normami i bez kolizji.”. Opis narzędzia mówi o normach, kolizjach modułów i wyjściu poza ścianę, ale wynik końcowy może zostać odczytany jako twierdzenie globalne.
- `docs/SPECYFIKACJA-autodobor-okuc.md` § „Kolizje i silnik 3D” już wymaga rozdzielenia renderowania i kolizji, sprawdzenia całej trajektorii oraz jawnego stanu niepotwierdzonego, jeśli brak trajektorii. To kryterium nie jest tym samym, co obecny test nakładania prostokątów na elewacji.
- Nie znaleziono osobnego `validation.test.ts` ani testów tekstu sukcesu MCP. Istnieją testy technologii i przelicznika okuć, ale nie stanowią dowodu kompletnego pokrycia wszystkich rodzajów kolizji.

## Ryzyko i zalecenie

**Ryzyko:** użytkownik lub agent wywołujący MCP może potraktować „zgodny z normami i bez kolizji” jako zgodę na produkcję albo potwierdzenie, że otwierane fronty, wewnętrzne wysuwy i okucia nie uderzają o siebie. Obecny wynik agreguje różne zakresy kontroli, a brak wykrytej usterki może zostać pomylony z wykonaniem kontroli, której system jeszcze nie ma.

### P0 — komunikat zgodny z zakresem dowodów

- Zamienić globalne zapewnienie na komunikat ograniczony: **„Nie wykryto uwag w wykonanych sprawdzeniach: zakresów wymiarowych modułów, położenia względem ściany i nakładania modułów w elewacji. Nie oceniono kolizji brył, okuć ani ruchu frontów/szuflad.”** Nazwy wyświetlać tylko dla kontroli faktycznie wykonanych.
- Gdy walidacja się nie wykonała, zakres jest nieobsługiwany albo dane nie wystarczają, zwracać osobny status `nieznane/nie sprawdzono`, nie pustą listę błędów ani `pass`.
- Oddzielić `walidacja geometrii układu`, `walidacja konstrukcji`, `walidacja okuć/operacji` i `analiza trajektorii`. Każdy wynik niesie status, listę sprawdzonych klas, pominięte klasy oraz wskazanie obiektów. „Brak uwag” nie może ustawiać `gotowaDoProdukcji=true`.

### P1 — etapowe pokrywanie kontroli

- Rozszerzać walidację parami obiektów tylko wtedy, gdy istnieje model i reguła dla danego typu: część stała–część stała, ruchoma–korpus, ruchoma–ruchoma, front–sąsiedni front, okucie–część, część–ściana/instalacja.
- Ruch sprawdzać na całej dozwolonej drodze lub konserwatywnej obwiedni z określoną dokładnością i zakresem regulacji. Kilka klatek animacji nie jest dowodem ciągłego braku przecięcia.
- Rozróżniać błąd, ostrzeżenie i informację oraz konflikt w normalnym, pojedynczym użyciu od konfliktu dwóch elementów, które klient może otworzyć równocześnie. Pokazywać elementy i stan, dla którego wykryto konflikt.
- Przechowywać w wyniku identyfikator wersji geometrii, okuć, reguł i silnika. Po zmianie dowolnego z nich wynik wcześniejszej analizy jest nieaktualny; wydanie produkcyjne musi mieć świeży wynik związanego zakresu.

## Priorytet, zależności i kryteria odbioru

| Priorytet | Zmiana | Zależności | Kryterium odbioru |
|---|---|---|---|
| P0 | MCP/ UI opisują zakres wykonanych kontroli zamiast obiecywać globalny brak kolizji | Wspólny typ wyniku walidacji | Test pustego projektu i projektu bez uwag sprawdza treść/status; komunikat wylicza tylko wykonane kontrole i mówi, co nie było sprawdzane |
| P0 | „Nieznane” i „nie sprawdzono” nie są utożsamiane z „brak błędów” ani gotowością produkcji | Model statusu i zasady fail-closed | Test braku danych trajektorii/nieobsługiwanej klasy powoduje `unknown`, a nie `pass`; status nie może sam odblokować wydania |
| P0 | Walidator 2D ma testy graniczne jawnie ograniczone do elewacji i ściany | Deterministyczne fixtures geometrii | Przypadki dotyku krawędzi, minimalnej szczeliny, nachodzenia X/Y, wyjścia poza ścianę i różnych ścian mają oczekiwane, nazwane wyniki |
| P1 | Wyniki różnych walidatorów są osobne i przypisane do konkretnych elementów | Wspólny model geometryczny z ID części/modułów | Dla każdego komunikatu operator może wskazać dwa obiekty i kategorię testu; renderer UI/MCP pokazuje ten sam rezultat |
| P1 | Ruchome okucia/fronty mają odrębny status analizy drogi ruchu | Zweryfikowana geometria/konfiguracja SKU oraz reguły trajektorii | Zestaw przypadków dopuszczalnych i kolizyjnych obejmuje zamknięcie, pełne otwarcie i skrajne tolerancje/ustawienia; brak modelu daje `unknown` |

## Fakty, hipotezy i ograniczenia

- **Fakt:** w kodzie brak ostrzeżeń z bieżącej walidacji powoduje sformułowanie o zgodności z normami i braku kolizji; walidacja kolizji porównuje prostokąty pozycji modułów na tej samej ścianie.
- **Wniosek ze źródła kodowego:** wynik potwierdza tylko brak problemu wykrytego przez zdefiniowane aktualnie testy. Nie stwierdza, że każdy typ kolizji został sprawdzony.
- **Hipoteza użytkowa:** treść MCP może wpływać na decyzję agenta o dalszym projektowaniu lub wydaniu. Przepływu promptów/agentów nie testowano.
- **Nie sprawdzono:** produkcyjny endpoint, wizualne komunikaty klienta, wszystkie typy geometrii, zachowanie przy koplanarnych/sąsiednich ścianach, ani tolerancje właściwe dla okuć. Nie stwierdza się, że aktualna aplikacja wydała błędną dokumentację produkcyjną.

## Punkt wznowienia

`origin/main` pozostał na `8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Research-only; bez zmian w walidatorze. Przy następnej zmianie Claude sprawdzić treść `waliduj_projekt`, wspólny status zakresu kontroli i to, czy walidacja części/ruchu nie jest mylona z kontrolą 2D układu. Ostatni analizowany commit `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`.
