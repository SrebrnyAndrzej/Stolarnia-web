# Wytyczne dla Claude: internetowy kreator mebli

Wersja 0.4 — 23.09.2026. Zastępuje wersje 0.1–0.3. Dodaje bibliotekę źródeł okuć, reguły wymiarowania szuflad i wspólny warsztat pozyskiwania dokumentacji. Uwzględnia dwa obowiązkowe wymagania użytkownika: pełną dokumentację produkcyjną każdego mebla po zaprojektowaniu całej kuchni oraz silnik wizualizacji 3D. Dokument jest gotowy do przekazania Claude jako specyfikacja robocza. Nie został jeszcze zastosowany do repozytorium aplikacji.

## Cel i priorytety

Rozwijaj istniejący internetowy kreator różnych rodzin mebli. Wynikiem ma być zapisany projekt oraz spójna dokumentacja do wykonania mebla w jawnie obsługiwanej technologii.

Priorytety: poprawność konstrukcji i danych produkcyjnych, trwałość projektu, czytelność obsługi, wydajność, a następnie jakość prezentacji. Użytkownik ma móc projektować różne meble; rozwijaj zakres przez rodziny i profile technologiczne. Początek od mebli płytowych jest rekomendacją etapowania, do potwierdzenia z istniejącym zakresem produktu.

Nie uznawaj braku błędów na ekranie za dowód wykonalności. Nie generuj zastępczych danych technologicznych udających dane producenta.

### Nadrzędny wymóg użytkownika: pełna dokumentacja kuchni

Po zakończeniu układania i konfiguracji kuchni użytkownik musi móc wygenerować jeden kompletny pakiet produkcyjny dla całego projektu. Pakiet zawiera osobną dokumentację KAŻDEGO mebla oraz KAŻDEJ części wykonywanej w zakładzie, w tym wszystkie wymagane wiercenia i pozostałe operacje. Jest to warunek ukończenia funkcji kuchni, a nie opcjonalne rozszerzenie ani zadanie odkładane do integracji CNC.

Dokumentacja ma wystarczać do wykonania obsługiwanej konstrukcji bez odgadywania wymiarów i ręcznego ustalania brakujących pozycji otworów. Jeśli konfiguracja wykracza poza zweryfikowany zakres, aplikacja wskazuje braki i nie oznacza pakietu jako gotowego do produkcji. Samo ograniczenie eksportu nie spełnia celu produktu: trzeba doprowadzić zadeklarowany zakres kuchni do kompletnej obsługi.

Wymagany zakres pakietu:

| Poziom | Obowiązkowe informacje |
|---|---|
| Cała kuchnia | Rzut z góry, elewacje zabudów, wymiary i pozycje mebli, oznaczenia szafek, połączenia między bryłami oraz elementy wspólne, np. blaty, cokoły i blendy. |
| Każdy mebel | Rzuty z niezbędnych stron, przekroje, wymiary zewnętrzne i wnętrza, podział frontów i szczeliny, schemat złożenia, lista części, okuć i łączników. |
| Każda wykonywana część | Osobny rysunek wykonawczy: ID, materiał, grubość, kontur, wymiary gotowe i do cięcia, obrzeża, usłojenie, strony A/B, lokalny punkt zerowy i osie. |
| Wszystkie wiercenia | ID operacji, część i strona lub krawędź, pozycja osi otworu względem określonej bazy, średnica, głębokość albo oznaczenie otworu przelotowego, kierunek wiercenia, przeznaczenie oraz powiązane okucie lub połączenie. |
| Pozostała obróbka | Pozycje, kształty i wymiary rowków, kieszeni, wręgów i wycięć, głębokości, strona obróbki oraz wymagane promienie i tolerancje wynikające z zatwierdzonej technologii. |
| Montaż | Oznaczenia łączonych części, schemat połączeń i informacje niezbędne do złożenia mebla oraz połączenia go z resztą zabudowy. |

Uwzględnij wiercenia pod zawiasy i prowadniki, prowadnice szuflad, podpórki półek, uchwyty, kołki, mimośrody, konfirmaty, zawieszki, nogi i inne elementy występujące w danej konstrukcji. Lista nie narzuca rodzaju połączeń — dokumentuje wszystkie faktycznie zastosowane. Otwory krawędziowe wymagają osobnego czytelnego widoku. Dla części bez wierceń zamieść jawne oznaczenie „bez wierceń”, aby odróżnić je od brakującej dokumentacji.

Elementy wspólne zabudowy dokumentuj jako odrębne części z przypisaniem do mebli. Wycięcia pod sprzęt i osprzęt opieraj na dokumentacji wybranego modelu. Nie zgaduj danych montażowych urządzenia, ściany ani mocowań.

Rysunki mają być wektorowe w PDF, czytelne przy wydruku, z podaną skalą, jednostkami i rewizją. Rozmieszczenie opisów nie może zasłaniać wymiarów. Przy gęstych wzorach wierceń stosuj detale i tabele współrzędnych jednoznacznie powiązane z oznaczeniami otworów. DXF i zestawienia operacji uzupełniają rysunki; generowanie G-code pozostaje odrębną integracją.

Każda zmiana konstrukcji, wymiarów, grubości, okuć lub połączeń unieważnia wcześniejszy status aktualności dokumentacji. Ponowne generowanie obejmuje wszystkie zależne części oraz zestawienia całej kuchni. Historyczny pakiet pozostaje przypisany do swojej rewizji.

Warunki odbioru tego wymagania:

- Wykaz mebli i części w dokumentacji jest zgodny z projektem; żadna szafka ani wykonywana część nie zostaje pominięta.
- Każda wymagana operacja modelu występuje na rysunku lub jednoznacznie powiązanej tabeli; liczba i parametry operacji są zgodne w PDF i danych eksportowych.
- Wiercenia po obu stronach i na krawędziach, części lustrzane oraz operacje połączeń między częściami mają niezależne przypadki testowe.
- Powiązane operacje łączonych części pasują w pozycji montażowej zgodnie z regułą danego połączenia.
- Na zatwierdzonej kuchni referencyjnej sprawdzono pełny pakiet, a reprezentatywne meble wykonano i złożono według dokumentacji w ramach odbioru warsztatowego. Testów programu nie przedstawiaj jako potwierdzenia wykonania fizycznego.
- Brak średnicy, głębokości, strony, pozycji lub danych wymaganego okucia powoduje konkretny komunikat i brak statusu gotowości produkcyjnej.

### Nadrzędny wymóg użytkownika: silnik wizualizacji 3D

Aplikacja musi zawierać interaktywny silnik wizualizacji 3D działający w przeglądarce. Jest to podstawowa część kreatora. Rzuty 2D i statyczne obrazki mogą go uzupełniać. Wybór konkretnej biblioteki następuje po sprawdzeniu obecnej aplikacji i wymagań; niniejsza specyfikacja nie nakazuje jej przebudowy na nowy stos technologiczny.

Wymagany zakres funkcjonalny:

- Widok całej zaprojektowanej kuchni oraz możliwość przejścia do wybranego mebla i jego części.
- Obrót kamery, przybliżanie, przesuwanie widoku, dopasowanie do zaznaczenia i przywrócenie czytelnego widoku początkowego.
- Rzeczywiste proporcje i pozycje brył, poprawne grubości płyt, podziały, fronty, szczeliny, blaty, blendy, cokoły i pozostałe elementy projektu.
- Zaznaczanie mebli i części z powiązaniem z panelem parametrów, zestawieniem elementów i właściwym rysunkiem technicznym.
- Aktualizacja zależnej geometrii po zmianie wymiarów, konstrukcji, wyposażenia i materiałów.
- Wizualizacja materiałów, kolorów, obrzeży i kierunku dekoru zgodnie z przypisaniem do części. Wygląd materiału na ekranie jest poglądowy.
- Ukrywanie frontów, izolowanie części, widok rozstrzelony oraz przekroje potrzebne do kontroli konstrukcji.
- Otwieranie drzwi i wysuwanie szuflad w obsługiwanych systemach. Mechanika ruchu wynika z konfiguracji; brak dokładnych danych musi być odróżniony od zweryfikowanej symulacji.
- Tryb techniczny: wymiary, identyfikatory części i podgląd operacji obróbki. Nie trzeba renderować szczegółowo wszystkich otworów w podstawowym widoku całej kuchni, lecz muszą być dostępne przy kontroli wybranej części.
- Czytelne wskazanie części objętych błędem lub kolizją. Wynik walidacji pochodzi z reguł konstrukcji, nie wyłącznie z obrazu.

Silnik prezentacji otrzymuje rozwiązaną konstrukcję z tej samej rewizji co generator dokumentacji. Przekształcenia służące animacji, ukrywaniu i rozstrzeleniu są oddzielone od pozycji konstrukcyjnych. Geometria ekranowa może mieć uproszczoną szczegółowość, ale nie może zmieniać wymiarów ani stanowić źródła pomiarów produkcyjnych.

Wydajność weryfikuj dla pojedynczego mebla i całej kuchni na ustalonych urządzeniach. Ograniczaj szczegółowość niewidocznych elementów, zachowuj identyfikację części i obsługuj błędy inicjalizacji silnika bez utraty projektu. Nie podawaj deklaracji płynności bez pomiaru.

Warunki odbioru: zmiana konstrukcji aktualizuje 3D i dokumentację tej samej rewizji; zaznaczenie wskazuje właściwe ID; ukrywanie, animacja i widok rozstrzelony nie zmieniają listy części ani wymiarów produkcyjnych; pełna kuchnia przechodzi uzgodnione pomiary wydajności. Fotorealistyczny rendering może być późniejszym rozszerzeniem, ale działający interaktywny widok 3D jest obowiązkowy.

## 1. Pierwsze zadanie w istniejącym projekcie

- Odczytaj strukturę, lokalne instrukcje, zależności i istniejące testy.
- Ustal, gdzie zapisuje się projekt, gdzie obliczane są wymiary, skąd powstaje model 3D i eksporty.
- Sporządź krótką mapę: działa / częściowo działa / brak / wymaga danych warsztatowych. Każdy wniosek powiąż z kodem albo przeprowadzonym sprawdzeniem.
- Zachowaj działające funkcje i formaty projektów. Nie zmieniaj frameworka ani silnika grafiki bez uzasadnionego problemu i planu migracji.
- Wybierz najmniejszy brakujący fragment pełnego procesu projekt–dokumentacja i doprowadź go do sprawdzalnego działania.
- Jeśli brakuje danych producenta, wykonuj niezależną część pracy, a brakujący parametr oznacz. Nie zgaduj wartości produkcyjnych.

## 2. Architektura obliczeń

Utrzymuj następujący przepływ:

```text
Intencja projektu + wersjonowane katalogi + profil technologiczny
                         ↓
             Walidacja danych i zależności
                         ↓
           Rozwiązana konstrukcja i diagnostyka
                         ↓
       Części + połączenia + okucia + operacje
                         ↓
       Widoki 2D/3D | zestawienia | eksporty | koszt
```

Obliczenia domenowe mają być deterministyczne i możliwe do uruchomienia bez interfejsu, przeglądarkowego DOM i renderera 3D. Przy tych samych danych i wersjach reguł otrzymujemy tę samą konstrukcję.

Renderer i eksportery korzystają ze wspólnego wyniku. Nie odtwarzają osobno wzorów na wymiary. Dopuszczalne są transformacje wymagane przez format, ale muszą być testowane.

Rozdziel intencję użytkownika, obliczony wynik, stan interfejsu i zapis serwerowy. Wartości wynikowych nie edytuj bez określonego sposobu zmiany ich parametrów źródłowych. Cache wyniku jest dopuszczalny, jeśli jest powiązany z dokładną rewizją wejścia.

## 3. Minimalny kontrakt danych

Poniższe nazwy są przykładowe; zachowaj zgodność z obecną aplikacją. Wymagana jest semantyka, nie konkretna nazwa klasy.

| Obiekt | Minimalne znaczenie danych |
|---|---|
| Project | Trwałe ID, rewizja, wersja schematu, jednostki, wersje reguł/katalogów/profilu, lista mebli. |
| Furniture | ID, rodzina, parametry, konstrukcja, drzewo wnętrza, przypisane materiały i systemy okuć, pozycja w projekcie. |
| Compartment | ID, rodzaj podziału, dzieci, grubości przegród, stałe lub proporcjonalne wymiary, wyposażenie. |
| Part | ID, rola, źródłowy mebel/sekcja, materiał i grubość, kontur, gotowy wymiar, wymiar do cięcia, osie lokalne, strony, transformacja montażowa, obrzeża, usłojenie. |
| Joint | Łączone części i ich strony, rodzaj połączenia, parametry oraz operacje wynikające z połączenia. |
| Hardware | Producent, kod i wariant produktu, ilość, wersja danych, zakres zgodności, przypisanie do konstrukcji. |
| Operation | ID części, strona lub krawędź, typ operacji, współrzędne i kierunek, rozmiar, głębokość, źródło reguły. |
| Diagnostic | Kod, poziom, wskazane obiekty/parametry, opis przyczyny, możliwa poprawa, zakres sprawdzenia. |
| ExportManifest | Projekt i rewizja, wersja generatora, katalogów i profilu, lista plików, jednostki, status i ograniczenia. |

Nie używaj indeksu tablicy, nazwy wyświetlanej ani numeru trójkąta jako trwałego ID części. Zmiana wymiaru powinna zachować tożsamość części, o ile jej rola nadal istnieje.

## 4. Wymiary, konstrukcja i precyzja

- Wewnętrzna jednostka długości: milimetr. Ustal reprezentację liczbową, tolerancje porównań i zasady zaokrąglania; nie zaokrąglaj wielokrotnie w kolejnych etapach.
- Rozróżniaj szerokość zewnętrzną, światło wnętrza, wymiar gotowej części, półfabrykatu i obwiedni montażowej.
- Profil konstrukcji określa m.in. położenie dna i wieńców, rodzaj pleców, wpusty, połączenia i luzy.
- Definiuj, czy wymiar mebla obejmuje fronty, plecy, uchwyty, cokół i nogi. Pokaż to użytkownikowi przy polu, gdy ma znaczenie.
- Grubość materiału może być inna dla każdej części. Parametr nominalny i przyjęta grubość obliczeniowa mają jawne znaczenie.
- Tolerancja algorytmu geometrii nie jest tolerancją wykonania w zakładzie.
- Nie ukrywaj błędów konstrukcji przez automatyczne zamienianie ujemnych wartości na zero lub usuwanie niepasujących części.

## 5. Edycja podziałów i frontów

Podziały mają obsługiwać wymiary stałe, proporcjonalne i pozostałe. Ustal jednoznaczny priorytet ograniczeń. W przypadku sprzeczności pokaż konflikt; nie przesuwaj samoczynnie elementów zablokowanych przez użytkownika.

Oddziel otwór mebla od fizycznej przegrody. Wspólne ściany sekcji nie mogą dublować się na liście części. Drzwi i szuflady zależą od światła otworu, sposobu nałożenia, szczelin i wybranego systemu okuć.

Jedno przeciągnięcie powinno być jednym krokiem cofania. Zapewnij również wpisanie dokładnej wartości i edycję bez przeciągania. Widok 2D może służyć do precyzyjnych podziałów, a 3D do kontroli przestrzennej.

## 6. Materiały, obrzeża i układ współrzędnych

- Materiał ma trwały identyfikator, parametry technologiczne i osobne dane prezentacyjne. Zmiana tekstury nie zmienia sama w sobie grubości płyty.
- Obrzeża przypisuj do nazwanych krawędzi lokalnych części. Dla konturów innych niż prostokąt nie zakładaj zawsze czterech krawędzi.
- Profil zakładu określa sposób kompensacji obrzeży i naddatków. Stosuj kompensację dokładnie raz i ujawniaj ją w danych eksportu.
- Rozróżniaj kierunek usłojenia, dozwolone obroty i ciągłość wzoru pomiędzy częściami.
- Części kupowane na wymiar pozostają w zestawieniu, ale nie trafiają automatycznie do rozkroju płyt.
- Każda część ma lokalne osie, punkt zerowy i strony A/B. Transformacja do mebla jest oddzielna od orientacji produkcyjnej.
- Odbicie części transformuje operacje, krawędzie, kierunki i strony. Nie realizuj go wyłącznie ujemną skalą siatki.
- Łącz części w jedną pozycję produkcyjną dopiero po porównaniu materiału, konturu, grubości, obrzeży, usłojenia i operacji. Zachowaj mapę instancji do mebli.

## 7. Okucia i reguły warsztatowe

Każdy obsługiwany system okuć musi mieć źródło danych, wersję, zakres wymiarów i jawny stopień weryfikacji. Nie stosuj ogólnych progów wysokości jako zamiennika kompletnego doboru zawiasów. Nie wyliczaj wierceń prowadnic dowolnym procentem długości szuflady.

Odróżniaj model poglądowy okucia od informacji niezbędnych do jego zamontowania. Brak modelu 3D nie musi blokować poprawnego zestawienia; brak danych montażowych blokuje oznaczenie odpowiedniej obróbki jako zweryfikowanej.

Nowa wersja katalogu nie zmienia po cichu istniejącego projektu. Aktualizacja jest jawną operacją z porównaniem zmian. Zamówiony projekt zachowuje swój profil i rewizję.

## 8. Walidacja i statusy

Waliduj dane wejściowe, zależności, części wynikowe, okucia, technologię zakładu i kompletność dokumentacji. Wszystkie błędy mają wskazywać obiekt oraz przyczynę.

Stosuj rozróżnienie: błąd blokujący, ostrzeżenie, informacja i zakres niesprawdzony. Nie traktuj „brak znalezionych błędów” jako „wszystko sprawdzone”.

Rozróżniaj zamierzone połączenia od niezamierzonych kolizji. Kontrolę otwierania opisz zakresem i metodą; sam film animacji jej nie zastępuje. Weryfikacja wytrzymałości wymaga osobnych danych i reguł.

Można zapisać projekt roboczy z błędami. Można wyeksportować dokument roboczy, jeśli jego status i braki są jednoznaczne. Pakiet oznaczony jako gotowy do produkcji wymaga spełnienia reguł zatwierdzonego profilu oraz ewentualnej akceptacji przewidzianej w procesie zakładu.

## 9. Dokumentacja i eksport

Pierwszy pełny pakiet obejmuje: identyfikację projektu i rewizji, zestawienie części, materiały, obrzeża, usłojenie, okucia, rysunki z wymiarami oraz operacje i informacje montażowe wymagane dla obsługiwanego zakresu.

PDF, CSV/XLSX, DXF i dokument maszynowy to oddzielne formaty o oddzielnych kryteriach odbioru. Sam zapis DXF nie stanowi programu CNC.

Eksporter otrzymuje niezmienną rewizję rozwiązanej konstrukcji. Każdy plik pakietu odnosi się do tej samej rewizji. Ustal jednostki, punkt odniesienia, strony, warstwy, nazwy plików oraz kodowanie tabel. Sprawdź polskie znaki i sposób interpretacji liczb przez odbiorcę.

Przy imporcie do programu odbiorcy sprawdzaj kontury, wymiary, wiercenia, jednostki i identyfikatory. Nie uznawaj udanego pobrania pliku za zaliczony test eksportu.

CNC wdrażaj wyłącznie dla określonego zestawu: maszyna, sterowanie, postprocesor, narzędzia i sposób mocowania. Oddziel testowanie oprogramowania od zatwierdzenia procesu wykonania przez zakład.

## 10. Rozkrój

Przed wyborem algorytmu ustal technologię odbiorcy: cięcia gilotynowe, nesting frezarką lub inny proces. MaxRects ani dowolne rozmieszczenie konturów nie gwarantuje zgodności z wymaganiami piły.

Uwzględniaj materiał, grubość, formaty i ilości arkuszy, obrzeża już przeliczone w półfabrykacie, kierunek dekoru, dozwolone obroty, rzaz/odstęp, marginesy oraz resztki. Pokazuj części nierozmieszczone.

Wynik optymalizatora sprawdzaj osobno: kompletność sztuk, brak nakładania, granice arkusza, materiał, dozwolone orientacje i ograniczenia procesu. Algorytm nie może sam zmieniać projektu w celu poprawy wykorzystania płyty.

Zapisuj ustawienia, wersję algorytmu i wynik zatwierdzonego rozkroju. Nie obiecuj optymalności ani stałego poziomu odpadu bez dowodu dla konkretnego zadania.

## 11. Wydajność i zgodność wyników

Ciężkie obliczenia przenieś poza główny wątek po pomiarze ich kosztu. Zadania w tle mają identyfikator i rewizję wejścia; nieaktualne wyniki odrzucaj. Umożliwiaj anulowanie długich zadań.

Podgląd może chwilowo korzystać z uproszczeń, ale musi wskazywać trwające przeliczenie. Eksport nie może odczytać częściowo zaktualizowanego stanu.

Przeliczaj zależne elementy, a nie całą aplikację przy ruchu kamery. Oddziel dokładność produkcyjną od poziomu szczegółowości grafiki. Zarządzaj zasobami GPU i przywracaniem widoku po utracie kontekstu. Dla powtórzeń rozważ instancing po pomiarach.

Przyjmij robocze zbiory pomiarowe: 1 mebel, 20 mebli oraz 1000 części. Na zadeklarowanym urządzeniu mierz czas obliczeń, opóźnienie interakcji, generowanie dokumentów i pamięć. Wstępny cel dla zwykłej edycji jednego mebla: widoczna odpowiedź p95 do 100 ms; do potwierdzenia pomiarem. Dłuższe zadania mają postęp i nie zamrażają obsługi. To proponowany cel projektu, nie wynik przeprowadzonego benchmarku.

## 12. Zapis, rewizje i dostęp online

- Zapewnij odzyskiwanie lokalne i eksport/import kompletnego pliku projektu.
- Dla pracy między urządzeniami zastosuj zapis serwerowy. Informuj osobno o zapisie lokalnym, synchronizacji i jej błędzie.
- Obsłuż brak miejsca w pamięci przeglądarki, utratę sieci i przerwanie zapisu.
- Wprowadź wersję schematu i testowane migracje. Nie modyfikuj jedynej kopii starszego projektu przed potwierdzeniem udanej migracji.
- Konflikt dwóch zapisów wykrywaj na podstawie rewizji. Zachowaj wersję konfliktową zamiast nadpisywać pracę bez informacji.
- Sprawdzaj uprawnienia na serwerze dla odczytu, zapisu i eksportu. Oddziel link do podglądu od prawa edycji.
- Import waliduj pod względem struktury, wersji i limitów zasobów. Nie wykonuj skryptów z zaimportowanego projektu.
- Jeśli projekt ma wyrażenia parametryczne, stosuj ograniczony parser z kontrolą zależności i wykrywaniem cykli, bez dowolnego `eval`.
- Publikacja pakietu produkcyjnego wymaga walidacji jego rewizji; nie ufaj samemu statusowi przesłanemu przez klienta.

## 13. Obowiązkowe przypadki odbiorcze

Przygotuj oczekiwane wyniki niezależnie od testowanego algorytmu. Zestaw warsztatowy musi mieć potwierdzone założenia.

| ID | Sprawdzenie | Oczekiwany wynik |
|---|---|---|
| T01 | Szerokość 800, dno między bokami, boki 18 → 19, bez wpustów i luzów | Szerokość dna 764 → 762 mm we wszystkich wyjściach. |
| T02 | Zmiana wariantu konstrukcji dna | Prawidłowa zmiana wymiarów, połączeń i dokumentacji. |
| T03 | Za mało miejsca dla zablokowanych sekcji | Konflikt bez cichej zmiany parametrów. |
| T04 | Odbicie części z niesymetrycznym wierceniem | Poprawne współrzędne, strony i obrzeża. |
| T05 | Te same gabaryty, różne operacje | Oddzielne pozycje produkcyjne. |
| T06 | Obrzeża według dwóch profili zakładu | Poprawny półfabrykat, brak podwójnej kompensacji. |
| T07 | Nieznany wariant prowadnicy | Jawny brak weryfikacji i właściwa blokada dokumentacji. |
| T08 | Za mało arkuszy lub część za duża | Element nierozmieszczony jest widoczny; nie znika z listy. |
| T09 | Kierunek dekoru | Niedozwolony obrót nie występuje w planie. |
| T10 | Ukrycie frontów lub rozstrzelenie widoku | Brak zmian danych do produkcji. |
| T11 | Szybka zmiana A → B podczas obliczeń | Wynik A nie nadpisuje B. |
| T12 | Cofnij/ponów, zapis/import | Odtworzona intencja i zgodna konstrukcja. |
| T13 | Migracja i konflikt dwóch kart | Zachowane dane i czytelna obsługa konfliktu. |
| T14 | Odczyt eksportu niezależnym narzędziem | Zgodne jednostki, części, wymiary i operacje. |
| T15 | Próba odczytu/zapisu/eksportu cudzego projektu | Brak nieuprawnionego dostępu. |
| T16 | Przejście pełnej ścieżki referencyjnego mebla | Projekt, dokumentacja i wymagania warsztatu zgodne. |

Oprócz tych przypadków stosuj testy graniczne i własności: brak NaN, brak ujemnych wymiarów prawidłowej konstrukcji, zachowanie sum podziałów, jednoznaczne ID oraz kompletność sztuk w rozkroju. Testy obrazu uzupełniają testy danych, ale ich nie zastępują.

## 14. Etapy i definicja ukończenia

Etap 0: rozpoznanie istniejącego kodu i profilu technologicznego.

Etap 1: jeden poprawny mebel od parametrów po zapis i kompletną dokumentację w określonym zakresie.

Etap 2: podziały, blokady wymiarów, kolejne rodziny i wiele brył.

Etap 3: udokumentowany katalog okuć, poprawne operacje i pełne rysunki każdej części oraz każdego mebla. Etap kończy odbiór pakietu dla całej kuchni zgodnie z nadrzędnym wymaganiem. Nie deklaruj funkcji kuchni gotowej produkcyjnie przed tym odbiorem.

Etap 4: niezawodny zapis online, rewizje, uprawnienia i udostępnianie.

Etap 5: zatwierdzony eksport do zakładu i rozkrój zgodny z jego procesem.

Etap 6: kolejne technologie, zaawansowane kształty i integracje maszynowe.

Dostosuj kolejność do tego, co już działa. Funkcja jest ukończona, gdy ma spójne dane, obliczenia, obsługę błędów, zapis, wymagane widoki i eksporty oraz zaliczone właściwe testy. Wskaż konkretnie, co sprawdzono, czego nie sprawdzono i jakie dane są jeszcze potrzebne.

## 15. Korzystanie z inspiracji

- [OpenCutList](https://github.com/lairdubois/lairdubois-opencutlist-sketchup-extension): semantyka materiałów, listy części, rozkrój i etykiety.
- [Furniture Designer](https://github.com/Manwe-777/furniture-designer): edycja wnętrza i wspólny wynik konstrukcji.
- [WoodworkingShop](https://github.com/RajwanYair/WoodworkingShop): moduły obliczeń, eksporty i organizacja pracy.
- [Cabinet Studio](https://github.com/petervanderwalt/cabinet-studio): rozdzielenie obliczeń paneli i prezentacji; nie kopiuj uproszczonych reguł okuć jako norm produkcyjnych.
- [PackingSolver](https://github.com/fontanf/packingsolver): ocena algorytmu zgodnego z typem cięcia.
- [Replicad](https://github.com/sgenoud/replicad) i [JSketcher](https://github.com/xibyte/jsketcher): opcjonalne rozszerzenia geometrii po wykazaniu potrzeby.
- [Blum](https://www.blum.com/pl/pl/services/planning-construction-product-selection/cabinet-configurator/): referencja procesu konfiguracji i danych okuć; nie zakładaj publicznego API.

Przed wykorzystaniem kodu sprawdź konkretną rewizję, licencję i zależności, uruchom istotne testy oraz porównaj wynik z przypadkiem referencyjnym. Nie traktuj README, liczby testów ani etykiety „production-ready” jako dowodu poprawności.

## 16. Sposób przekazywania pracy

Utrzymuj krótką wspólną specyfikację, rejestr decyzji, opis formatu danych i zestaw przypadków referencyjnych. Przy przekazaniu zadania zapisz: zakres zmian, zmienione reguły lub formaty, wykonane testy, braki danych oraz następny konkretny krok. Nie nadpisuj aktualnej dokumentacji repozytorium bez wcześniejszego porównania jej treści z tymi wytycznymi.


## 17. Biblioteka producentów i wymiarowanie szuflad

Przed implementacją profili przeczytaj `okucia/README.md`, `okucia/reguly-szuflad.json`, `okucia/sources.json` i `NARZEDZIA-SCRAPOWANIE.md`. Biblioteka zawiera oryginalne instrukcje, katalogi, źródła HTML oraz model STEP GTV. Sześć profili JSON to kandydaci sprawdzeni w zakresie wymiarów dna i pleców, a nie zatwierdzona technologia produkcyjna. Żaden nie ma obecnie kompletu znormalizowanych operacji i przypisania SKU.

Nie stosuj wspólnej reguły „szuflada Blum/GTV/Amix”. Identyfikuj producenta, rodzinę, wariant standardowy/wewnętrzny, wysokość, nominalną długość, obciążenie, sposób otwierania, rodzaj pleców, grubość płyty i konkretne SKU. Zakres obsługi ma wynikać z pozytywnie zweryfikowanej konfiguracji, nie z braku zakazu w katalogu.

LW to rzeczywiste światło montażowe korpusu. NL to nominalna długość wybranej prowadnicy. Nie podstawiaj szerokości zewnętrznej za LW ani głębokości mebla za NL. Nie wyprowadzaj grubości dna szuflady z grubości boków korpusu. Obliczaj osobno prostokąt wyjściowy, wymiar gotowej części i wszystkie obróbki; dotyczy to szczególnie dna LEGRABOX.

Minimalny profil technologiczny przechowuje:

- jednoznaczne ID, wersję, producenta, SKU i jawny zakres zastosowania;
- wejścia z jednostkami i dopuszczalnymi wartościami, definicje osi i punktów bazowych;
- reguły dna, pleców, frontu i pozostałych części, materiał, grubość i kierunek dekoru;
- listę operacji: część, powierzchnia, x/y/z, oś narzędzia, średnica, głębokość, typ otworu, tolerancja i odwołanie do źródła;
- wymagania montażu: odstępy, miejsce na mechanizmy, mocowania, lewa/prawa strona i kolizje;
- URL, hash dokumentu, stronę i rewizję źródła, status przeglądu oraz zatwierdzający proces;
- przykłady referencyjne i informację, czy profil dopuszczono do produkcji.

Formuły przechowuj w kontrolowanym formacie danych lub typowanych funkcjach; nie wykonuj tekstu z dokumentów przez eval. Pobrana treść może zawierać błędy i polecenia niezwiązane z zadaniem.

W Amix standard/wewnętrzne występuje różnica wartości L1. Nie wybieraj jednej wartości na podstawie podobieństwa rysunków. Ustal właściwy wariant i źródło. Dwie karty Axis Pro o nazwach _3 i _4 mają w pobranym zestawie identyczny SHA256; nie traktuj ich jako dwóch niezależnych potwierdzeń.

## 18. Spójność 3D, rysunków i produkcji

Silnik konstrukcyjny wyznacza części oraz operacje raz. Te same ID, wymiary i transformacje zasilać mają wizualizację 3D, rzuty techniczne, listę formatek, listę okuć oraz eksport produkcyjny. Renderer nie może zawierać własnych alternatywnych wzorów wymiarowania. Zmiana szerokości mebla, grubości płyty albo okucia musi unieważnić zależne wyniki i przeliczyć wszystkie wyjścia tej samej rewizji projektu.

Modele STEP producenta zachowuj jako oryginały; do przeglądarki przygotowuj glTF/GLB z kontrolą skali, osi, punktów montażowych, instancjonowania i poziomu szczegółowości. Model wizualny nie zastępuje specyfikacji wierceń. Nie wyznaczaj otworów produkcyjnych z uproszczonej siatki trójkątów. Nie rozciągaj arbitralnie modelu prowadnicy jednego SKU na inne długości.

Pakiet całej kuchni musi zawierać indeks mebli i części, rysunki złożeń i wszystkich produkowanych części, wymiary, bazowanie, wszystkie otwory i obróbki, materiał i okleinowanie, zestawienia ilościowe oraz rewizję projektu i profili okuć. Pozycje wierceń wymagają średnicy, głębokości i wskazania strony obróbki. Widok perspektywiczny z kilkoma wymiarami nie spełnia tego wymagania.

Niepełny profil może służyć do projektu roboczego, z jawnym komunikatem o ograniczeniu. Eksport oznaczony jako gotowy produkcyjnie wymaga kompletności wszystkich zastosowanych profili i zgodności z procesem zakładu. Nie pomijaj nieznanych otworów w pozornie kompletnym rysunku.

## 19. Weryfikacja nowych profili i wspólna praca asystentów

Sprawdź co najmniej: przykład z katalogu, skrajne dopuszczalne wymiary, zmianę grubości korpusu, wszystkie obsługiwane wysokości, wariant pleców, odbicie lewo/prawo i zmianę długości prowadnicy. Porównaj rysunek oraz listę operacji z dokumentacją producenta. Test arytmetyczny samej formuły nie dowodzi poprawności odczytu diagramu. Dopuszczenie do produkcji wymaga zweryfikowanego przypadku referencyjnego w przyjętej technologii zakładu.

Claude i Codex korzystają z tej samej biblioteki plików i identyfikatorów źródeł. Kolejność: odkrycie źródła → pobranie oryginału → ekstrakcja → sprawdzenie diagramu → profil → test referencyjny → dopuszczenie. Aktualizacja źródła tworzy nową wersję profilu i nie zmienia bez ostrzeżenia historycznych projektów. Przy przekazaniu pracy podaj profile zmienione, źródła, wykonane sprawdzenia i nierozstrzygnięte dane.
