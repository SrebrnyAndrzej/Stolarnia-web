# LEGRABOX — dane frontu wewnętrznego M, przegląd 01.10.2026

Baza kodu: 7555187 (bez nowych commitów). Research dokumentacyjny; bez modyfikacji reguł wykonawczych i statusów produkcyjnych.

## Źródło i sposób kontroli

Lokalny plik: `docs/okucia/pdf/BLUM-Legrabox-planowanie.pdf`, 100 stron, pobrany 23.09.2026. SHA-256 ponownie obliczony: `7537f2530257e4e56a08de0398dd825465c4262e54a63ee5b16cd596f779421a`, zgodny z `sources.json`.

Oficjalny URL: https://www.blum.com/file/lbx0264-ep-390_ep_dok_bau?country=pl&language=pl
Zapisany końcowy plik: https://d2.blum.com/services/BEC003/lbx0264-ep-390_ep_dok_bau_$spl-pl_$aof_$v5.pdf

Odczytano wizualnie renderowane strony 17–19 (numeracja PDF i drukowana zgodna). Nie sprawdzano, czy producent opublikował późniejszą rewizję; ustalenia dotyczą wyłącznie tej migawki i szuflady wewnętrznej M z metalowym frontem. Kontrola wizualna dokumentu nie zastępuje próbnego montażu.

## Korekta identyfikacji — priorytet P1

W `docs/okucia/reguly-szuflad.json`, LEGRABOX → inner_drawer → notes, front wewnętrzny jest opisany jako ZI7.0MS0 / ZI7.0MI0. Strona 17 rozróżnia:

| Pozycja | Odczyt producenta | Znaczenie |
|---|---|---|
| 4 | ZI7.0MS0 (stal), ZI7.0MI0 (stal nierdzewna) | Zestaw uchwytów frontu; NIE profil do przycięcia |
| 5 | ZV7.1043C01 | Front bez wpustu, długość wyjściowa 1043 mm |
| 5 — wymiar przycięcia | LW − 126 mm | Dotyczy profilu frontu z pozycji 5, LW = szerokość wewnętrzna korpusu |
| 3 | ZB7M000S | Uchwyt drewnianej ścianki tylnej lewy/prawy, wysokość M |
| 6 | ZI7.0M07 | Opcjonalny zestaw zabieraka: zabierak i obudowa; mocowany do frontu |

Zestaw pozycji 4 obejmuje uchwyty lewe/prawe, zaślepki lewe/prawe, uchwyt i cztery wkręty. Nie zakładać, że indeks bazowy rozstrzyga wszystkie warianty koloru lub jednostkę handlową dostawcy. Strona 17 podaje, że połączenie ZI7.0M07 z TIP-ON BLUMOTION nie jest możliwe.

Przykład kontrolny, nie zatwierdzenie całego mebla: dla LW=764 mm profil frontu ma długość 638 mm. Surowe 1043 mm nie jest długością montażową dla tego korpusu. Nie stosować wzoru do uchwytów ZI7.

Zadanie Claude: rozdzielić w danych komplet uchwytów i profil cięty, poprawić opis w obu kopiach reguł oraz kompletację, jeśli bazuje na tym opisie. Kryterium odbioru: lista części dla przykładu zawiera właściwy profil z wymiarem 638 mm oraz osobny zestaw uchwytów; nie produkuje fikcyjnej formatki o SKU ZI7.0MS0. Sprawdzić, czy implementacja używa błędnej notatki — w tej sesji potwierdzono błąd opisu danych, nie zademonstrowano błędu wynikowej listy zakupowej.

## Potwierdzone zakresy geometryczne, nadal bez zatwierdzenia produkcji

Strona 18: minimum 38 mm od powierzchni płyty pod szufladą do osi mocowania prowadnicy. Przypis: +1 mm przy montażu prowadnicy przed montażem korpusu. Nad osią podano min. 66 mm, a z zabierakiem 71 mm. Nie traktować 71 mm jako całkowitej wysokości komory. Nie rozszerzać odczytu na inne wysokości boków.

Strona 19: płyta 16 mm, dno (LW−35) × (NL−10), drewniane plecy (LW−38) × 63 mm. Przy LW=764 i zadanej NL=500 otrzymujemy dno 729 × 490 mm oraz plecy 726 × 63 mm. NL=500 jest wejściem przykładu, nie wynikiem automatycznego doboru dla korpusu 600 mm. Dno wymaga pokazanej na rysunku obróbki; prostokątne wymiary nie wystarczają do wykonania części.

## Dane, których jeszcze NIE wolno normalizować do gotowych operacji

- Strona 18, zabierak: otwór Ø25 leży na osi symetrii frontu. Rysunek zawiera min 17, 59, x, x+46 oraz 12 w przekroju. Nie przyjęto baz pionowych i głębokości jako gotowego szablonu wiercenia. Potrzebna instrukcja montażu ZI7.0M07 i jednoznaczne rozpoznanie odniesień do mocowań frontu; samo odjęcie od dolnej krawędzi frontu jest nieuprawnione.
- Strona 18, uchwyt pleców: widoczne 9, 19 i 32 wymagają opisania konkretnego układu lokalnego, średnicy i głębokości. Brak tych parametrów nie oznacza otworu przelotowego.
- Strona 19, dno: rysunek z 24, 128 i 18,5 nie określa w tym odczycie kompletnej operacji dla wszystkich NL. Nie kopiować tych liczb jako uniwersalnych otworów prowadnicy w korpusie — rysunek dotyczy DNA.
- Raster 32 w aplikacji pozostaje osobnym zagadnieniem. Powyższe źródło nie jest dowodem, że można dowolnie podnosić skrzynkę bez przeliczenia mocowania frontu, kolizji i dostępnego światła.

## Punkt wznowienia

Sprawdzony remote: 7555187. Nowych testów kodu nie uruchamiano — brak zmian od poprzedniego przeglądu 20/20. Dostarczono dane z dokumentu, nie zmieniono kodu, projektu klienta, umów ani ceny uzgodnionej.

Następny priorytet: instrukcja montażu ZI7.0M07 i pełne bazy otworu Ø25; dalej otwory prowadnic LEGRABOX dla konkretnej rodziny prowadnicy i NL. Zachować production_approved=false do domknięcia danych oraz próbnego montażu.
