# LEGRABOX — drewniana ścianka tylna, uchwyty i przygotowanie

Stan: częściowo potwierdzone dla LEGRABOX z drewnianą ścianką tylną. Odczyt z aktualnego katalogu Blum 2027/2028 PL, 08.10.2026. To brief danych dla profilu systemu, a nie kompletna mapa CNC.

## Dane potwierdzone w katalogu producenta

| Wariant | Wysokość drewnianych pleców | Uchwyt pleców | Źródło |
|---|---:|---|---|
| LEGRABOX M | 63 mm | ZB7M000S | [katalog PL, drukowana s.200](https://publications.blum.com/2026/catalogue/pl/200/) |
| LEGRABOX C | 148 mm | ZB7C000S | [katalog PL, drukowana s.206](https://publications.blum.com/2026/catalogue/pl/206/) |

Katalog opisuje uchwyt jako stalowy, do drewnianej ścianki tylnej, lewy/prawy. Nie traktować kodów M i C jako zamiennych. Dla płyty 16 mm rysunek planowania podaje w wariancie C szerokość pleców `LW−38`, dno `LW−35 × (NL−10)`; są to wymiary formatki, nie pozycje mocowań. [Rysunek planowania LEGRABOX C, drukowana s.207](https://publications.blum.com/2026/catalogue/pl/207/).

Wykaz śrub w tym samym katalogu wskazuje wkręt mocujący z łbem płaskim Ø4,0 × 15 mm, kod 61D.1500, dla połączenia uchwytu drewnianej ścianki z plecami oraz boku z dnem. Blum zaleca łeb płaski dla optymalnego montażu drewnianych pleców i boku. Nie należy mylić tego wkrętu z wkrętem EURO Ø6 × 14,5 mm służącym do mocowania prowadnicy do korpusu. [Katalog PL, drukowana s.206](https://publications.blum.com/2026/catalogue/pl/206/).

Aktualny katalog producenta potwierdza również wzornik ZML.7000 do LEGRABOX pure/free, wraz z ogranicznikiem głębokości Ø2,5 mm. Producent opisuje jego użycie do nawiercania pozycji mocowania boku do dna, drewnianego uchwytu pleców do pleców oraz połączenia pleców z dnem; przy plecach ustawia się wzornik na samej ściance. Źródło nie publikuje w tym opisie pełnych współrzędnych XY ani tolerancji tych otworów. [Katalog Blum EN 2027/2028, drukowana s.695](https://publications.blum.com/2026/catalogue/en/695/).

## Konsekwencje dla modelu danych

- Uchwyt pleców powinien być wariantem powiązanym z rodziną/wysokością boku i typem pleców (`wood` kontra `steel`), a nie pojedynczym globalnym SKU.
- Do BOM można wpisać potwierdzony kod wariantu i wkręt 61D.1500; ilość na szufladę oraz wymagane zestawy kolorystyczne trzeba odczytać z pełnej karty zamówieniowej właściwego wariantu, bez wywodzenia liczby z samego oznaczenia „lewy/prawy”.
- ZML.7000 potwierdza średnicę pilotów Ø2,5 mm i sposób bazowania przyrządem, lecz nie daje wystarczających danych do samodzielnego wygenerowania nominalnych współrzędnych CNC. Nie zamieniać średnicy ogranicznika w gotowy wzór otworów.
- Stalowa ścianka tylna jest osobnym wariantem i ma inną geometrię. Nie stosować wymiarów pleców drewnianych ani ZB7 do konfiguracji stalowej.

## Status produkcyjny i kryteria odbioru

**CNC pozostaje zablokowane.** Przed zwolnieniem wierceń należy pozyskać wizualnie czytelny rysunek dla konkretnego wariantu i układu uchwytu, potwierdzić liczbę uchwytów/wkrętów na szufladę, ich orientację, bazę wymiarową i tolerancje, a następnie wykonać detal próbny. Obecny opis katalogowy wzornika mówi, jak go ustawić i jaką średnicą wykonać piloty; nie zastępuje wymiarowanego rysunku ani kalibracji procesu zakładu.

| Priorytet | Problem / dowód | Wymagane zachowanie | Zależność | Mierzalne kryterium |
|---|---|---|---|---|
| P0 | Uchwyty pleców zależą od wariantu: M→ZB7M000S, C→ZB7C000S | System dobiera wariant po jawnej wysokości boku i typie pleców | SKU producenta i konfiguracja LEGRABOX | Testy M/C wybierają różne kody; brak wariantu zwraca „nieustalone”, nie domyślny uchwyt |
| P0 | Wkręt mocujący uchwyt i wkręt prowadnicy mają różne funkcje | Zachować osobne pozycje BOM z opisem połączenia | Rysunek montażowy i typ połączenia | BOM nie zamienia 61D.1500 na 661.1450.HG |
| P0 przed CNC | ZML.7000 prowadzi wiercenie pilotowe Ø2,5, ale tekst katalogu nie definiuje XY/tolerancji | Wydruk/eksport CNC nie udaje kompletnego drill-map; ręczne bazowanie wzornika jest osobną metodą | Czytelna plansza, rzeczywisty przyrząd i zatwierdzenie procesu | Bez współrzędnych, bazy, głębokości i tolerancji profil ma status „brak danych produkcyjnych” |
| P1 | Drewniane i stalowe plecy mają różne wymiary oraz mocowania | Typ materiału pleców jest wymaganym polem konfiguracji | Karta systemu i grubość materiału | Testy dla `wood`/`steel` nie współdzielą reguły ani BOM |

## Punkt wznowienia

Uzupełniono kolejkę dotyczącą mocowania drewnianych pleców LEGRABOX o bieżące kody producenta, śrubę i przeznaczenie wzornika. Brak nowych zmian w `origin/main` od rewizji `8230275`. Następny krok: sprawdzić mocowania pleców TANDEMBOX/Axis Pro z ich kartami właściwych wariantów; nie przenosić ZB7 ani wzornika ZML.7000 na inne systemy. Nie zmieniano logiki, cen, ofert ani umów.
