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

## Ręcznie policzony oracle dla lustrzanych boków

**Cel:** zamienić ogólny warunek „odbicie nie zmienia fizycznego bazowania” na mały test liczbowy, który niezależnie sprawdza lokalną ramę części, stronę A/B oraz krawędzie. Wartości poniżej są syntetycznym oczekiwanym wynikiem obliczonym z konwencji `osieRoli`/`ukladCzesci` i definicji `Operacja` w `src/core/technologia.ts` oraz `src/core/types.ts`; nie zostały wygenerowane przez funkcję badaną i nie pochodzą od producenta.

Przyjąć moduł 600 × 720 × 560 mm i płyty 18 mm. Lewy bok zajmuje globalny prostopadłościan X=[0,18], Y=[0,720], Z=[0,560]; prawy X=[582,600], Y=[0,720], Z=[0,560]. Dla roli `side`, osie długość/szerokość/grubość odpowiadają kolejno modułowym Y/Z/X.

| Część | Początek lokalny `o` | Oś lokalna `x` (długość) | `y` (szerokość) | `n` (lico A) |
|---|---|---|---|---|
| lewy bok | (0, 0, 0) | (0, +1, 0) | (0, 0, +1) | (+1, 0, 0) |
| prawy bok | (600, 720, 0) | (0, −1, 0) | (0, 0, +1) | (−1, 0, 0) |

Lokalny rozmiar obu części wynosi 720 × 560 × 18 mm. Dla tej samej fizycznej wysokości Y=120 mm i głębokości Z=64 mm punkt lica A ma globalne współrzędne (18,120,64) po lewej i (582,120,64) po prawej. Oczekiwane współrzędne częściowe to odpowiednio (x=120,y=64,n=18) oraz (x=600,y=64,n=18); w obu przypadkach ponowne zastosowanie ramy daje wskazany punkt globalny. Na licu B analogiczne punkty mają n=0.

Kontrolne operacje krawędziowe według kontraktu `Operacja`: punkt na DA dla lewej części globalnie (9,120,0) powinien dać (powierzchnia=DA, x=120, y=9); dla prawej część globalna (591,120,0) powinna dać (DA, x=600, y=9). Punkt na KA: globalnie (9,0,64) po lewej i (591,720,64) po prawej powinien dać w obu przypadkach (KA, x=64, y=9), gdzie `y=9` jest odległością od lica B w grubości. Przeliczenie tych punktów przez lokalną ramę z powrotem do modułu musi odtworzyć każdą współrzędną globalną z tolerancją 0,05 mm.

**Mierzalne kryterium dla Claude:** fixture zawiera oczekiwane ramy, 4 punkty lica i 4 punkty krawędzi z tabeli/powyższego opisu; wynik porównuje bazę i osie, nazwę powierzchni, współrzędne oraz round-trip lokalny→globalny. Dodatkowo ten sam syntetyczny otwór bazowany 120 mm od fizycznego dołu musi po transformacji obu boków pozostać na tej samej wysokości Y=120 mm, mimo że lokalne `x` wynosi 120 mm po lewej i 600 mm po prawej. Test nie może wymagać równych współrzędnych lokalnych lustrzanych części. Błąd ramy, strony lub indeksu osi powinien zawieść co najmniej jeden punkt kontrolny.

**Granica:** to oracle transformacji dla prostokątnego korpusu i roli `side`, nie walidacja konstrukcji, wierceń konkretnego okucia, tolerancji maszynowej ani renderera 3D. Pozostałe role i narożniki wymagają odrębnych, podobnie niezależnych fixture; fizyczny detal nadal wymaga pomiaru i próbnego wykonania.
