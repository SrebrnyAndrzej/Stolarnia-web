# Stan prac — 23.09.2026

## Kontynuacja po Claude: dokumentacja PDF

Punkt przejęcia: model części i operacji (271e80a), następnie zbiorcza karta szafki w PDF (f9791a8). Pełny eksport zawierał tylko karty zbiorcze, mimo że generator umiał tworzyć osobne rysunki części. Widoki krawędzi mogły zostać pominięte po wyczerpaniu miejsca.

Wdrożono:
- Domyślny eksport całej kuchni oraz pojedynczej szafki zawiera karty zbiorcze i osobne rysunki wszystkich jej części.
- `GET /api/projekty/:id/dokumentacja.pdf?skrocony=1` zachowuje skrócone karty. Parametry `modul` i `czesc` nadal filtrują eksport.
- Krawędzie z operacjami otrzymują oddzielną stronę z numerami zgodnymi z tabelą operacji.
- Uwagi, diagnostyka i źródła reguł mają kontynuację stron. Nagłówki tabel uwzględniają zawijanie tekstu. Numeracja otworów jest rozsuwana z liniami odniesienia.
- Interfejs produkcji rozdziela pełny pakiet i karty zbiorcze.

## Sprawdzenie

- 16 testów zaliczonych; obejmują wszystkie dotychczasowe przypadki oraz kompletność pełnego pakietu, filtrowanie szafki, cztery krawędzie i długie uwagi.
- TypeScript: backend i frontend bez błędów.
- Próbna kuchnia: 4 szafki, 53 części, 217 operacji, 77 stron PDF. Sprawdzono obecność rysunku każdej części przez niezależny od generatora odczyt PDF.
- Przypadek testowy: wszystkie cztery widoki krawędzi i wszystkie 100 ponumerowanych uwag obecne w treści PDF.
- Wizualnie sprawdzono reprezentatywne strony: tytułową, indeks, kartę szafki, rysunek części, tabelę kontynuowaną i krawędzie.
- Pełny build Vite nie został ukończony: lokalne środowisko Windows zwracało `spawn EPERM` przy uruchamianiu esbuild. Testy wykonano po kompilacji TypeScript, w pojedynczym procesie Node z `--test-isolation=none`.

## Ograniczenia i następny etap

To uzupełnienie eksportu istniejących operacji, nie zatwierdzenie całej technologii. Brakujące wiercenia prowadnic, uchwytów, zawieszek i konkretnych SKU nadal dają dokument roboczy. Nie wolno zmieniać tego statusu, aby ukryć braki danych.

Następny etap: powiązać wybraną rodzinę szuflad (Amix Elite Box standard) z konkretnymi wariantami/SKU i zweryfikowanymi schematami montażowymi; dopiero potem wprowadzić pełne operacje, przypadki referencyjne i dobór kompatybilności. Nie przenosić schematów standard/wewnętrzna ani wymiarów między rodzinami. Równolegle plan katalogu płyt pozostaje w `materialy/pokrycie.json`: normalizacja regionalnej oferty Kronospan jest nieukończona.
