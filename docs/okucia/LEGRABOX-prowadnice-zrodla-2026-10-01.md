# LEGRABOX: prowadnice — rysunek montażu i zasady normalizacji

01.10.2026, druga sesja. Remote bez zmian: 723c926. Bez ponownego uruchamiania testów i bez zmian logiki.

## Odnaleziony materiał

Oficjalna instrukcja `docs/okucia/pdf/BLUM-Legrabox-pure-montaz.pdf`, strona 3, oznaczenie MD-013/5 · 04.24. SHA-256 obliczony lokalnie: `b133f531b78f9bd180e9a325b8b949daf305bfdcd0c77d55ff4f82ca5bafc92b`. Rysunek sprawdzony wizualnie po renderowaniu. Źródło producenta: https://www.blum.com/file/lbx0001-md-013_md_dok_bau?country=pl&language=pl . Odczyt dotyczy tej wersji instrukcji, nie wszystkich generacji LEGRABOX.

Dodatkowe źródło do porównania: https://publications.blum.com/2024/catalogue/de/248/ — drukowana strona 248, „Befestigung der Korpusschienen”. Tekst strony rozróżnia prowadnice 750 / 40 kg oraz 753 / 70 kg. Wskazuje A: wkręt do płyty Ø4×15; B: wkręt systemowy Ø6×14,5, 661.1450.HG. Średnica wkręta nie jest automatycznie średnicą otworu pilotującego. Tekstu HTML nie traktowano jako wystarczającego do przypisania wszystkich punktów wiercenia.

## Odczyt rysunku instrukcji — dane dla Claude

Rysunek s.3 grupuje prowadnice według klasy obciążenia i długości nominalnej. Są to DWA parametry doboru, nie tylko NL. Widoczne dłuższe odcinki mierzone są od linii odsuniętej 37 mm od przedniej bazy rysunku:

| Klasa | NL [mm] | Podany odcinek [mm] | Suma z bazą 37 mm [mm] |
|---|---|---|---|
| 40 kg | 270 | 160 | 197 |
| 40 kg | 300 | 192 | 229 |
| 40 kg | 350 | 224 | 261 |
| 40 kg | 400–500 | 224 i 256 | 261 i 293 |
| 40 kg | 550–600 | 320 | 357 |
| 70 kg | 450 | 224 i 256 | 261 i 293 |
| 70 kg | 500–600 | 320 | 357 |
| 70 kg | 650 | 416 | 453 |

Ostatnia kolumna to przeliczenie łańcucha wymiarowego, NIE gotowa lista obowiązkowych otworów. Na rysunku są dodatkowe pozycje i warianty A/B; trzeba wskazać dla każdego punktu typ mocowania, jego wymagalność i bazę. Nie wpisywać tabeli wprost do `holes_from_front_mm`.

Najważniejszy wniosek: **NL=500 nie wystarcza do wyznaczenia schematu mocowania**. Rysunek dla 40 kg i 70 kg jest inny. Dane powinny identyfikować co najmniej rodzinę prowadnicy, klasę, NL, wariant montażu i wersję instrukcji. Ten sam problem dotyczy ewentualnych następców SKU.

## Zadanie dla Claude — P0 przed zatwierdzeniem operacji prowadnic

1. Utrzymać brak zatwierdzenia produkcyjnego, dopóki brakuje kompletnego schematu.
2. Unikać kontraktu danych zakładającego, że sam NL jednoznacznie określa wszystkie otwory. Można zachować istniejące pole tylko dla profilu o jednoznacznie ograniczonej rodzinie i klasie obciążenia.
3. Odróżnić współrzędną od odległości między otworami: np. 160 z rysunku nie jest pozycją od przedniej krawędzi.
4. Odróżnić otwory alternatywne i dodatkowe od obowiązkowych. Nie wiercić sumy wszystkich możliwych wariantów.

Odbiór: dwa przykłady NL500 — 40 kg i 70 kg — wskazują właściwe, niezależnie sprawdzone schematy; wybór innego mocowania zmienia tylko odpowiadające mu operacje. Nieobsługiwany wariant daje jawny brak danych. Współrzędne sprawdzone na rysunku nie oznaczają automatycznego zatwierdzenia średnicy/głębokości.

## Status poszukiwania zabieraka

Nie odnaleziono w tej sesji osobnej instrukcji ZI7.0M07 rozstrzygającej wszystkie bazy otworu Ø25. Oficjalny skrót https://www.blum.com/a310 przekierował do ogólnej biblioteki pobrań; nie dał sam w sobie brakujących danych. Wyszukany angielski PDF lbx0264 v4 zwrócił 404 — nie wykorzystano go jako dowodu. Nie zmieniono poprzedniego statusu otworu zabieraka.

Następny krok: pełny wizualny odczyt strony katalogowej 248 lub odpowiedniej karty konkretnej prowadnicy, w tym legenda symboli; równolegle instrukcja ZI7.0M07. Kolejne przeglądy kodu od 723c926. Nie ma nowego zatwierdzonego profilu produkcyjnego.
