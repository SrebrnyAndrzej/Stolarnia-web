# LEGRABOX standard M — częściowy, wizualnie sprawdzony wzór mocowania frontu

Data odczytu: 07.10.2026. Baza `origin/main`: `8230275`. Odczyt lokalnego dokumentu producenta; bez zmian kodu i bez zwolnienia wierceń produkcyjnych.

## Źródło i wersja

Lokalny PDF producenta: `docs/okucia/pdf/BLUM-Legrabox-planowanie.pdf`, 100 stron A4. SHA-256: `7537f2530257e4e56a08de0398dd825465c4262e54a63ee5b16cd596f779421a`. Metadane PDF: utworzono 17.04.2025, zmodyfikowano 17.11.2025. Oficjalne źródło wskazane dla tej kopii: https://www.blum.com/file/lbx0264-ep-390_ep_dok_bau?country=pl&language=pl . Sprawdzony wizualnie drukowany arkusz 14 (w dokumencie PDF strona 14), „LEGRABOX | Szuflada standardowa – wysokość M”.

Zgodność katalogu potwierdza też oficjalny [katalog techniczny Blum 2024/2025, strona LEGRABOX standard M](https://publications.blum.com/2024/catalogue/pl/203/) oraz [polska karta pobrań LEGRABOX](https://www.blum.com/pl/pl/products/boxsystems/legrabox/downloads-videos/). Odczyt wymiarów poniżej pochodzi z lokalnego renderu strony 14, nie z indeksu wyszukiwarki.

## Odczyt strony 14 — wyłącznie standard M

Arkusz pokazuje osobne widoki „Wymiary montażu frontu w wersji na wkręty” i „Wymiary wiercenia frontu w wersji EXPANDO/EXPANDO T”. Nie mieszać tych sposobów mocowania.

**Wkręty:** widok montażowy pokazuje dwa pionowe poziomy mocowania o rozstawie 32 mm. Dolny poziom ma wymiar `min 51 mm` od dolnej krawędzi frontu; gwiazdka oznacza `+1 mm w przypadku montażu prowadnicy przed montażem korpusu`. Rysunek zawiera ponadto 14 mm w przekroju montażowym i symboliczne `FA` (nałożenie frontu). Ten widok sam nie daje pełnego płaskiego wzoru CNC: nie interpretujeć 14 mm jako odległości otworu od bocznej krawędzi, a nałożenie FA jest parametrem wejściowym.

**EXPANDO / EXPANDO T:** schemat pokazuje dwa poziomy mocowania w rozstawie 32 mm, dolny w odległości `min 51 mm` od dolnej krawędzi frontu (ta sama uwaga `+1 mm` zależnie od kolejności montażu). Rysunek opisuje minimalną grubość frontu `min 12 mm`; przypis stanowi `min. 6 mm dla EXPANDO T`. Przy górnym otworze widnieje oznaczenie `Ø 10`. Nie dopisuję niepokazanej w osobnym wymiarowaniu średnicy dolnego otworu ani współrzędnej X od bocznej krawędzi.

SKU mocowań, strona 13 tego samego PDF: EXPANDO `ZF7M70E2`, EXPANDO T `ZF7M70T2`, mocowanie na wkręty `ZF7M7002` (po 2 szt.). Numery przepisano z tabeli zamówieniowej; nie utożsamiać ich z numerem wiertła ani z kompletną listą zakupową.

### Aktualizacja tego odczytu — 07.10.2026

Wizualnie sprawdzono dodatkowo oficjalny, regionalny arkusz Blum „LEGRABOX Drawer component preparation”. Dla wzoru obejmującego M/K/C/F podaje rozstaw pionowy 32 mm i położenie w poziomie `14 mm + side overlay`; jego tabela obejmuje wartości overlay. Rysunek opisuje przygotowanie EXPANDO jako `Ø10 × 12*`, a przypis podaje dla mocowania wkrętem nawiercenie `Ø2 × 2,5 mm`. To osobne źródło uzupełnia brakujący wymiar X z poprzedniego punktu — nie należy odczytywać X z samego wymiaru 14 mm na stronie 14 polskiej planszy. Pozostają ograniczenia dotyczące jednoznacznego powiązania otworów ze SKU, strony/rotacji, zakresu calloutu średnicy i głębokości, tolerancji i rynku. Pełny odczyt oraz sumy plików: `docs/okucia/BLUM-LEGRABOX-front-component-preparation-2026-10-07.md`.

## Znaczenie dla implementacji

- To nowy, producentem opublikowany częściowy zestaw danych dla LEGRABOX standard M; otwór nie jest już całkowicie „brakiem źródła”. Odczytu nie rozszerzać automatycznie na N/K/C/F, szufladę wewnętrzną, zlewozmywakową, free z dodatkowymi elementami ani na MERIVOBOX/TANDEMBOX.
- Nowy arkusz regionalny dopuszcza zapis X jako `14 + side overlay`, lecz dane muszą zachować jawne wejście overlay, region źródła i powiązanie z konkretnym zestawem. Nie podstawiać stałego X=14.
- Nie generować kompletnej operacji CNC, dopóki nie potwierdzono interpretacji calloutu dla każdego otworu i wybranego mocowania, strony/rotacji, rynku/SKU, tolerancji i próbnego montażu. Alternatywą warsztatową pozostaje znacznik ZML.3710, który przenosi pozycje na zmontowanym i wsuniętym korpusie.

**Priorytet:** P0 zachować blokadę pełnego wiercenia do pozyskania pozostałych wymiarów; P1 uzupełnić bazę częściowych, wersjonowanych danych standard M.

**Zależności:** położenie mocowań lewo/prawo w X; średnica i głębokość każdego otworu w każdym wariancie; dokładna referencja podzespołu/frontu; próba montażowa oraz porównanie do dokumentacji dla wybranej rodziny.

**Mierzalny odbiór:** test źródłowy potwierdza 32 mm rozstawu i dolną bazę 51 mm z warunkiem +1 mm, a osobne testy granic grubości rozróżniają EXPANDO 12 mm i EXPANDO T 6 mm. Bez jawnego kompletu średnic, głębokości i X wynik dla CNC ma status „niekompletny/niezatwierdzony”; nie używa zastępczych współrzędnych.

## Punkt wznowienia

`origin/main=8230275`, brak nowszych commitów Claude. Plik nie został zmieniony. Render QA strony 14 zapisano tylko tymczasowo pod `tmp/pdfs/`; nie jest częścią commitowanego researchu. Następnie sprawdzić pozostałe wysokości LEGRABOX w tych samych stronach technicznych i zdobyć dokumentację dla wariantów mocowania/osi X, bez automatycznego uogólniania.
