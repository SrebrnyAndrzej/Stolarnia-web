# T14 — niezależny pakiet testowy dla części, 3D i dokumentacji

**Baza sprawdzenia:** świeże `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3`, 14.10.2026. Brief źródłowy: [`RESEARCH-kreator-premium-dla-Claude.md`](RESEARCH-kreator-premium-dla-Claude.md) (R01/R03/R04, P01–P03) oraz [`WYTYCZNE.md`](WYTYCZNE.md) (wymóg dokumentacji produkcyjnej i wspólnego rozwiązania).

## Problem i ustalenia

Kryteria produktu wymagają spójnego wskazania mebla/części w 3D, rysunku i pakiecie produkcyjnym. Sam test liczby stron lub renderu nie sprawdza, czy odpowiadające sobie widoki odnoszą się do tej samej części i tych samych danych. W obecnym widoku 3D selekcja identyfikuje moduł (`modulId`), a widoczne elementy przypisują identyfikator modułu; ścieżki rysunku części i operacji nie są w tej scenie wybierane przez trwałe `czescId`. Builder 3D pomija kilka klas elementów szuflad (`drawerSide`, `drawerFrontBack`, `drawerBottom`). Nie znaleziono tu narzędzi do izolacji części, przekroju, rozstrzelenia ani wizualizacji operacji; są to wymagania briefu, a nie potwierdzenie pełnej funkcji.

Generator dokumentacji otrzymuje części z lokalnymi układami/operacjami (`src/core/technologia.ts`), podczas gdy 3D korzysta z elementów buildera i własnego rzutu (`punktNaRzucie`). Nie przeprowadzono jeszcze porównania transformacji tych ścieżek na wspólnym fixture; możliwa rozbieżność układów jest **hipotezą do sprawdzenia**, nie wykazanym błędem wymiaru.

Eksport CSV formatek (`src/core/production.ts`) zawiera między innymi identyfikator/etykietę, materiał, wymiary cięcia i gotowe oraz obrzeża, lecz nie zawiera wierceń/operacji ani nagłówka rewizji. PDF uwzględnia operacje. Testy PDF sprawdzają między innymi pokrycie stron oraz render operacji po ręcznej zmianie obiektu testowego; nie stanowią niezależnej, niezależnie przygotowanej wyroczni porównującej artefakt ze źródłowym kontraktem.

## Proponowany fixture niezależny od implementacji

Zatwierdzić jeden mały, sztuczny fixture (bez danych klienta) obejmujący: prosty korpus z lewą/prawą stroną, plecami, półką i szufladą; co najmniej jedną część lustrzaną; otwór na płaszczyźnie i na krawędzi; operację połączenia; jawny element bez wierceń. Wymiary i operacje wpisuje autor fixture z ręcznie policzonej tabeli oczekiwanej, nie z funkcji produkcyjnych, by uniknąć testu porównującego funkcję z nią samą.

| Obszar | Niezależny oracle | Mierzalny warunek |
|---|---|---|
| Lista części/CSV | oczekiwana lista stabilnych ID i wymiarów cięcia/gotowych, materiałów, obrzeży | brakujący i dodatkowy ID = 0; wartości wymiarów zgodne w tolerancji jawnie podanej w fixture; eksport deklaruje rewizję i jednostkę albo jawnie sygnalizuje ich brak |
| PDF operacji | ręcznie przygotowane oczekiwane operacje: ID, strona/krawędź, baza, X/Y/Z, średnica, głębokość/przelot, kierunek | dla każdej operacji fixture jest dokładnie jeden rekord z tymi samymi parametrami; każda część bez otworów ma jawne „bez wierceń”; test parsuje tekst/tabele PDF, nie tylko liczbę stron |
| Identyfikacja 3D | mapowanie ekranowego hit-testu do `czescId`, a następnie do identycznego ID w liście/rysunku | kliknięcie reprezentatywnego elementu wybiera właściwe ID; brak/duplikat ID zgłasza diagnostykę |
| Geometria / orientacja | współrzędne kontrolne narożników i lokalnych osi w fixture oraz ta sama część w ułożeniu projektowym | po transformacji 3D wymiary długości/szerokości/grubości zachowane; odbicie lustrzane nie zamienia bazowania operacji ani strony |
| Funkcje widoku | części i operacje w stanie zwykłym, ukrytym/izolowanym i rozstrzelonym | liczba ID, wymiary projektowe i operacje pozostają niezmienione; transformacje widoku nie mutują danych wejściowych |
| Zamrożenie P03 | ten sam fixture wygenerowany jako wydanie, potem modyfikacja projektu | PDF wydania nadal odpowiada migawce; nowa rewizja robocza nie zmienia ID ani treści starego pakietu |

## Priorytet, zależności i odbiór

- **P0:** trwałe `czescId` współdzielone przez renderer 3D, listę części, rysunek i operacje; niezależne fixture dla T14. Zależność: określenie wspólnego kontraktu części/transformacji. Odbiór: wszystkie powyższe sprawdzenia przechodzą na sztucznej referencji; kliknięty ID i rysunek tej rewizji są zgodne.
- **P1:** pokaż elementy szuflad brakujące w rendererze oraz techniczny podgląd otworów/izolacji/przekroju/rozstrzelenia zgodnie z zakresem produktu. Odbiór: wybór obejmuje części szuflad; tryby widoku nie zmieniają danych produkcyjnych; operacje są identyfikowalne i orientacja/lokalny punkt zerowy są oznaczone.
- **P1:** CSV ma eksportować rewizję/jednostkę/manifest lub jasno nazwać go zestawieniem formatek bez operacji. Nie deklarować zgodności operacji CSV–PDF, dopóki format CSV ich nie zawiera.
- **P2:** odbiór warsztatowy na zatwierdzonej referencji kuchennej i fizyczne wykonanie wybranych części według PDF. Testy programowe nie zastępują pomiaru/wykonania w zakładzie.

## Fakty, hipotezy i ograniczenia

- **Fakty z inspekcji kodu:** 3D wybiera moduł, nie widoczną część; część klas szuflad jest pomijana; CSV nie ma operacji ani jawnej rewizji; PDF ma operacje; obecne testy PDF nie walidują pełnej zgodności niezależnym oracle.
- **Hipoteza:** niezależne wyliczanie lokalnego układu części i transformacji rendererów może prowadzić do odmiennego bazowania; wymaga fixture porównującego narożniki i osie, nie należy przedstawiać tego jako już znalezionego błędu.
- **Niezweryfikowane:** wykonanie fizyczne na warsztacie, wszystkie rodziny mebli i systemy okuć, pełny pakiet całej kuchni, tolerancje produkcyjne i wydajność 3D na docelowych urządzeniach.

## Korekta pochodzenia wcześniejszej notatki

Notatka robocza sporządzona wcześniej w starym checkout mówiła, że brief `RESEARCH-kreator-premium-dla-Claude.md` nie istnieje. To twierdzenie było błędne: stary lokalny `HEAD` był 81 commitów za bieżącym `origin/main`. Świeży checkout potwierdza istnienie briefu; powyższe ustalenia są ocenione względem jego faktycznych R01/R03/R04 i P01–P03. Nie przenosić dawnego stwierdzenia o braku briefu do kolejnych raportów.
