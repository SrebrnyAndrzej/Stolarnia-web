# Amix Elite Box — pozycje mocowań na froncie

Odczyt wizualny 29.10.2026: `pdf/AMIX-Elite-Box-standardowe.pdf`, strona 2. Źródło: wpis `AMIX-Elite-Box-standardowe` w `sources.json`, SHA256 `7ef6cd84fbb21cf0c5e8fccbb7765a782968fe32b000e3356f023afa43e3609d`. Sprawdzono powiększony przekrój H84 oraz rysunki „Wymiary montażowe mocowania frontu” H84/116/167/199.

- W przekroju wymiar 14,5 mm biegnie od wewnętrznej płaszczyzny boku korpusu do osi mocowania frontu, w stronę wnętrza szuflady. To nie jest odległość od bocznej krawędzi widocznego frontu.
- Dla frontu wyśrodkowanego względem LW: oś od lewej i prawej krawędzi frontu = `(szerokośćFrontu − LW) / 2 + 14,5`. Wartość uwzględnia nałożenie lub wpuszczenie frontu. Przykład LW564/front598: 31,5 mm od każdej krawędzi bocznej. Front560/LW564: 12,5 mm.
- Rysunki H84/116 pokazują rozstaw 32 mm (2 otwory na każdej osi). H167/199: 32, 64, 32 mm (4 otwory na każdej osi), czyli przesunięcia `[0,32,96,128]` od dolnego otworu.
- Dolny wymiar jest opisany **Min49.5**. Nie wolno automatycznie wyznaczać na jego podstawie dokładnej pozycji pierwszego otworu. Użytkownik podaje odległość od dolnej krawędzi frontu, zależną od nałożenia i położenia skrzynki. Kalkulator kontroluje minimum 49,5 mm, dodaje rozstawy i sprawdza wysokość frontu, jeśli podano ją na wejściu.
- Bez wpisanej pozycji pierwszego otworu wynik zawiera tylko minima, a `odDolnejKrawedziMM` pozostaje nieobecne. Bez szerokości frontu nie ma współrzędnej bocznej. `status=pozycje` oznacza komplet pozycji 2D, nie dopuszczenie do produkcji.
- Współrzędne odczytujemy na tylnej stronie frontu. Przy froncie wyśrodkowanym obie osie mają ten sam odstęp od odpowiedniej krawędzi bocznej. Wariant za drzwiami może uwzględniać przesunięcie frontu i zwraca osobne odległości od lewej/prawej krawędzi.

Schemat nie podaje jednoznacznych średnic i głębokości wiercenia pod konkretny zaczep/SKU. Pozostają `null`, `production_approved=false`. Nie przeniesiono tych danych na inne systemy ani na stalowy panel frontu wewnętrznego. Obliczenia nie dopisują operacji CNC do zapisanych projektów.

Interfejsy: REST/MCP `szerokoscFrontu`, `pierwszyOtworOdDolu` (mm). Wynik w `wyniki[].mocowanieFrontu`. Dane profilu w `reguly-szuflad.json` oraz kopii runtime `src/core/catalog/reguly-szuflad.json`.

## Front za drzwiami na zwykłych zawiasach — reguła użytkownika

Użytkownik doprecyzował: **dno i plecy skrzynki węższe o 36 mm**, dystans jednostronny po stronie zawiasów. Szerokość frontu pozostaje osobnym wymiarem i nie jest automatycznie zwężana. Wariant `frontZaDrzwiami=true`, `stronaZawiasow=lewa|prawa` ustawia prowadnice na dystansie 36 mm z wybranej strony i wyznacza montażowe LW = pierwotne LW − 36. Dopiero do niego stosujemy potrącenia producenta dla dna i pleców.

Przykład LW 564, dystans lewy 36/prawy 0: płaszczyzny prowadnic wyznaczają LW 528. Dno 453×524 i plecy 441×199 przy NL550/H199; bez dystansu byłyby to 489×524 i 477×199. Jeśli użytkownik osobno wpisze front 528, osie zaczepów Amix leżą 14,5 mm od obu krawędzi. Dla frontu 520 są to 10,5 mm — szerokość frontu pozostaje 520, bez kolejnego odjęcia 36. Bez wymiaru frontu współrzędne boczne nie powstają. Wariant z prawym zawiasem jest lustrzany.

Nie podstawiać frontu 528 do wzoru ze starym LW 564: dałoby to −3,5 mm, czyli otwory poza frontem. Kalkulator używa nowego LW i jawnie przelicza przesunięcie. API przyjmuje dodatkowo jawne dystanse i `przesuniecieFrontu` względem środka światła PO dystansach (dodatnie = w prawo). Wówczas odległości od lewej/prawej krawędzi mogą być różne. Ujemna oś blokuje wynik.

Prześwit kontrolujemy względem maksymalnego wystawania zawiasów/drzwi w światło w całym ruchu wysuwania, podanego przez użytkownika z karty lub pomiaru. Brak wartości lub szerokości frontu daje `brakDanych`, nie stwierdzenie braku kolizji całego zespołu. Po stronie bez zawiasów należy podać 0. Kontrola porównuje mniejszą z odległości do płaszczyzny prowadnicy i krawędzi frontu z obrysem zawiasu oraz wymaganym luzem (domyślnie 1 mm po stronie z wystawaniem). Znana kolizja lub brak wymaganego luzu daje `kolizja` i usuwa współrzędne wiercenia frontu z wyniku.

Zakres to kontrola bocznego prześwitu według podanego obrysu. Nie modeluje 3D zawiasu, kolizji w głębokości, puszek i wkrętów ani pełnego toru drzwi. Nie zmienia dopuszczenia CNC ani profili producenta; 36 mm jest regułą warsztatową użytkownika, a nie uniwersalną gwarancją dla wszystkich zwykłych zawiasów.
