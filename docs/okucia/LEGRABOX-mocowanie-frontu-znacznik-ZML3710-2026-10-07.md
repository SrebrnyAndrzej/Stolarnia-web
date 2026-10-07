# LEGRABOX — front fixings: źródło o znaczniku ZML.3710

Data sprawdzenia: 07.10.2026. Baza repozytorium: `8230275`. Dokumentacja badawcza; bez zmian kodu, geometrii ani statusu produkcyjnego.

## Potwierdzone u producenta

Katalog techniczny Blum 2024/2025, drukowana strona 695 ([wersja EN](https://publications.blum.com/2024/catalogue/en/695/)), nazywa narzędzie „Marking template for LEGRABOX”, numer artykułu **ZML.3710**, dla LEGRABOX pure i LEGRABOX free. Opisuje je jako przyrząd do oznaczania pozycji mocowań frontu. Procedura: przyrząd zakłada się na zmontowaną szufladę już wsuniętą w korpus, ustawia ogranicznik na wymagane nałożenie frontu, przykłada front i lekko uderza, aby zaznaczyć pozycje mocowań.

Polska [wyszukiwarka pomocy montażowych Blum](https://www.blum.com/pl/pl/products/assembly-devices/selector/) potwierdza kategorię „Wzornik do LEGRABOX” i przeznaczenie „Do znakowania pozycji mocowania okuć frontu”. Polska [strona pobrań LEGRABOX](https://www.blum.com/pl/pl/products/boxsystems/legrabox/downloads-videos/) wskazuje osobną usługę ze specyfikacjami, a strona pomocy podaje osobno wzornik wiercenia dna/ścianki tylnej — rozróżnienie typów pomocy jest istotne.

## Granice wniosku

ZML.3710 jest **znacznikiem**, który przenosi pozycje na front po złożeniu szuflady i ustawieniu nałożenia. Podane źródło nie stanowi rysunku CNC z wymiarami XY, średnicą, głębokością ani tolerancją otworów. Nie wyznacza samodzielnie wzoru wiercenia dla frontu w stanie płaskim. Nie rozszerzać na inne systemy, profile lub generacje LEGRABOX.

To praktyczne obejście do ręcznego montażu w warsztacie, ale nie zamyka otwartego zapotrzebowania aplikacji na deterministyczne operacje CNC. Otwarta pozostaje możliwość pozyskania arkusza producenta „LEGRABOX drawer front boring pattern” z notatki `LEGRABOX-front-boring-pattern-source-2026-10-07.md`.

## Zalecenie dla Claude

- W katalogu okuć można powiązać ZML.3710 jako akcesorium/instrukcję ręcznego znakowania, z rozróżnieniem funkcji `marking_template` od `drilling_template` i pliku wymiarowego CNC.
- Nie używać ZML.3710 do automatycznego wygenerowania współrzędnych; tekst katalogu nie udostępnia ich liczbowo.
- Dla produkcyjnego CNC pozyskać i wizualnie zweryfikować techniczny PDF „front boring pattern” albo specyfikację danego mocowania z dokładnym wariantem i bazami.
- Kryterium odbioru: UI i BOM nazywają ZML.3710 znacznikiem/matrycą do znakowania frontu; system nie tworzy na tej podstawie otworów. Brak wymiarowego wzoru nadal skutkuje jawnie niezweryfikowanym statusem wierceń.

**Priorytet:** P1 dla ręcznego montażu i kompletacji pomocy; P0 dla utrzymania blokady niezweryfikowanego CNC.

**Zależności:** potwierdzenie wersji katalogu i komponentów szuflady; osobne pozyskanie rysunku/wzoru mocowań, jeżeli wiercenie ma być automatyczne.

## Odbiór dokumentacji źródłowej

Katalog 2024/2025 drukowana strona 695, angielski opis Blum: ZML.3710, przeznaczenie do znakowania, LEGRABOX pure/free, procedura na już wsuniętej skrzynce i wybranym nałożeniu. Polska karta selector potwierdza przeznaczenie, ale nie podaje wymiarów. Odczytane fakty dotyczą źródła i sposobu użycia, nie rzeczywistej próbki narzędzia.
