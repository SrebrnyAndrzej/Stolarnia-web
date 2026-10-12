# Profil wiercenia puszki zawiasu Blum musi rozróżniać warianty

Data sprawdzenia źródeł: 12.10.2026. Zakres: głębokość otworu puszki frontowej dla wskazanych grup CLIP top BLUMOTION. To wymaganie danych produkcyjnych, nie pełna specyfikacja wszystkich otworów zawiasu.

## Zweryfikowane fakty

- Aktualna polska strona producenta dla systemu [CLIP top BLUMOTION — obróbka i montaż](https://www.blum.com/pl/pl/products/hingesystems/clip-top-blumotion/assembly/) podaje ogólną zasadę rodziny: ten sam wzór wiercenia co CLIP top, przy czym głębokość wiercenia puszki zmienia się na 13 mm.
- Polska strona producenta [CLIP top BLUMOTION — przegląd](https://www.blum.com/pl/pl/products/hingesystems/clip-top-blumotion/overview/) wyróżnia zawias 107° z płytką głębokością wiercenia 11,5 mm i podaje kompatybilność z frontami od 15 mm grubości; opisuje go także jako wygięty wariant do drzwi bliźniaczych.
- Oficjalna karta producenta [CLIP top BLUMOTION 107°, ID20203](https://d2.blum.com/services/BEC003/iak0203-id20203_at_dok_bau_%24sen-sg_%24aof_%24v7.pdf) potwierdza wprost otwór puszki 11,5 mm dla drzwi o grubości co najmniej 15 mm, kąt 107° oraz numery artykułów m.in. 75B1550, 75B1650, 75B1750, 75B1580, 75B1680, 75B1780 i warianty 75B…E.
- Osobny oficjalny folder producenta [CLIP top BLUMOTION 107°](https://d2.blum.com/services/BEC003/clp0014-ep-239_ep_dok_bau_%24sen-th_%24aof_%24v2.pdf) powtarza 11,5 mm, min. 15 mm i podaje zastosowania nakładane, bliźniacze oraz wpuszczane. Nie należy traktować tych zastosowań jako jednego uniwersalnego układu frontu.

**Wniosek liczbowy:** nie wpisywać jednej głębokości dla całej marki ani nawet dla całej nazwy handlowej CLIP top BLUMOTION. Oficjalne materiały rozróżniają regułę rodziny 13 mm i konkretną gałąź 107° z 11,5 mm. Różnica wynosi 1,5 mm i ma znaczenie przy cienkim froncie; liczby odnoszą się do głębokości otworu puszki, nie do głębokości wszystkich wkrętów lub otworów prowadnika.

## Rekomendacja dla Claude

**Problem:** reguła „Blum” lub jedna głębokość puszki może wywiercić zbyt głęboko front albo wygenerować profil, który nie odpowiada rzeczywistemu zawiasowi. Sama wspólna nazwa systemu i zgodność planu otworów nie gwarantują zgodności głębokości.

**Proponowane zachowanie:** profil produkcyjny zawiasu wybierać po numerze artykułu / dokładnym wariancie, a nie wyłącznie po marce lub rodzinie. Przechowywać odrębnie co najmniej: średnicę i pozycję puszki, głębokość jej wiercenia, dopuszczalną grubość frontu, metodę mocowania puszki, kąt i typ nałożenia. Osobno opisywać wiercenia ramienia/płytki w korpusie. Brak numeru artykułu lub autorytatywnego rysunku oznacza geometrię niezweryfikowaną i blokuje CNC; nie nadpisywać istniejącego profilu po cichu.

**Priorytet:** P0 przed wydaniem wierceń frontu/CNC; P1 dla kompletności katalogu okuć.

**Zależności:** wybrany numer zawiasu, wariant mocowania, grubość i materiał frontu, właściwy aktualny dokument Blum, profil wiercenia korpusu/płytki oraz postprocesor docelowej maszyny.

**Mierzalne kryteria odbioru:**

1. Fixture dla zweryfikowanego wariantu 107° generuje głębokość puszki 11,5 mm i odrzuca front cieńszy niż 15 mm; test sprawdza, że wartość nie jest odziedziczona z domyślnego profilu 13 mm.
2. Fixture dla innego, konkretnie wskazanego CLIP top BLUMOTION respektuje jego dokumentowaną głębokość 13 mm; brak numeru wariantu nie może automatycznie dostać wartości 13 mm ani 11,5 mm.
3. Plik CNC i rysunek frontu pokazują średnicę, głębokość, odległość od krawędzi, SKU/artykuł, źródło i rewizję; oddzielne otwory płytki korpusowej zachowują własny profil.
4. Zmiana SKU/artykułu unieważnia zależne zatwierdzenie wierceń i wymusza ponowną walidację; regresja testowa wykrywa przypadkowe użycie profilu siostrzanego.

**Granice:** źródła potwierdzają opisane wartości dla wskazanych materiałów producenta. Nie weryfikują pozostałych wariantów Blum, dokładnych współrzędnych CNC dla danego zakładu ani tego, jaki zawias jest aktualnie wybrany w projekcie. Nie wpisywać współrzędnych otworów na podstawie samej tej notatki; sprawdzić właściwy rysunek artykułu i maszynę.
