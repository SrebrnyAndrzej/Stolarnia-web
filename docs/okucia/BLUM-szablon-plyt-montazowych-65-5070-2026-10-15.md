# Blum 65.5070 — co potwierdza szablon, a czego nie

**Sprawdzenie:** 15.10.2026; podstawa aplikacji: świeży `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3`. Uzupełnia analizę 175H3100. To research dokumentacji producenta, nie gotowy profil wierceń CNC.

## Potwierdzone fakty producenta

Blum opisuje szablon 65.5070 jako narzędzie do wyznaczania pozycji mocowania **krzyżowych** płytek montażowych i krzyżowych płytek adapterowych. Katalog 2027/2028 podaje dla niego otwory Ø5 mm, sposób ustawienia na linii traserskiej, wykonanie pierwszego otworu, a następnie obrócenie szablonu i użycie kołka ustalającego z pierwszego otworu do wykonania drugiego. Opis wymienia funkcję umożliwiającą dokładne wykonanie rozstawu 32 mm. Wymienia systemy zastosowania: AVENTOS HF top, AVENTOS HK-XS, CLIP top BLUMOTION, CLIP top i MODUL.

Źródło: [Blum, katalog i podręcznik 2027/2028, drukowana s. 692](https://publications.blum.com/2026/catalogue/en/692/). Oficjalna strona Blum udostępnia również instrukcję PDF dla „Drilling template for mounting plates”, wydanie 13.07.2023, oraz film opisujący narzędzie: [Blum — templates and jigs](https://www.blum.com/ca/en/products/assembly-devices/assembly-templates/downloads-videos/).

## Granica wnioskowania dla 175H3100

Szablon 65.5070 jest opisany jako szablon do krzyżowych płytek; 175H3100 z osobnego wpisu katalogowego jest prostym prowadnikiem poziomym, SKU dla dystansu 0 mm i wysokości 8,5 mm. Katalogowy wykaz zastosowań systemowych szablonu nie jest sam w sobie rysunkiem kompatybilności każdego SKU. Nie potwierdza, że para otworów Ø5/rozstaw 32 z procedury szablonu stanowi komplet otworów mocujących 175H3100, ani nie lokalizuje względem bazy części ewentualnego wkrętu dodatkowego. Instrukcja narzędzia i instrukcja komponentu muszą być rozdzielone.

Szczególnie nie należy interpretować „Ø5 mm” z opisu szablonu jako średnicy wiercenia dla wkrętu do płyty Ø3,5 mm z wpisu 175H3100. To dwa różne rodzaje mocowania/danych; producentowy wpis narzędzia nie zatwierdza ich zamienności. W tekście katalogu pojawia się ogranicznik głębokości Ø5 mm, ale nie odczytano z niego głębokości otworu dla 175H3100.

## Rekomendacja dla Claude

**Priorytet P0 dla zwalniania CNC:** katalogować narzędzie i jego procedurę osobno od wzoru otworów SKU. Nie generować operacji dla 175H3100 z samej nazwy 20/32, opisu 65.5070 ani z faktu, że katalog wymienia AVENTOS HF top wśród systemów. Profil wymaga rysunku/instrukcji producenta, które jawnie wiążą konkretny SKU z typem mocowania, pozycjami względem datumu, średnicą i głębokością każdego otworu oraz ewentualnym dodatkowym wkrętem. Jeżeli taki dowód nie został pozyskany, pokazać brak i blokować status produkcyjny.

**Zależności:** dostęp do pełnej instrukcji komponentu i szablonu, identyfikacja wariantu płyty i okuć, wspólny lokalny datum/orientacja części, weryfikacja wizualna rysunku przez osobę techniczną.

**Mierzalny odbiór:** pakiet fixture dla 65.5070 odtwarza tylko to, co źródło mówi o narzędziu (Ø5, procedura dwa otwory, kołek indeksujący, nominalny rozstaw 32); osobny fixture SKU 175H3100 zawiera własny dowód zgodności i wszystkie współrzędne lub pozostaje jawnie niezatwierdzony. Test negatywny ma wykazać, że sama etykieta systemu AVENTOS HF top i zgodność „20/32” nie zwalniają niekompletnego profilu 175H3100.

## Pewność i ograniczenia

- **Wysoka pewność:** przeznaczenie/klasa szablonu, Ø5, procedura pierwszego otworu i indeksowania drugim, rozstaw 32 i deklarowana lista systemów — oficjalny katalog Blum.
- **Niepotwierdzone:** dokładna geometria szablonu odczytana z wymiarowanego rysunku, pełna głębokość wiercenia komponentu, zgodność 65.5070 z konkretną konfiguracją poziomego prowadnika 175H3100, pozycja wymaganego dodatkowego wkrętu.
- Próba otwarcia instrukcji PDF w podglądzie badawczym nie powiodła się; sam plik figuruje na oficjalnej stronie, ale niniejsza notatka opiera szczegóły wyłącznie na tekście katalogu, bez pozorowania oględzin rysunku.
- Nie zmieniono logiki aplikacji, ceny ani umów; bez danych klientów.
