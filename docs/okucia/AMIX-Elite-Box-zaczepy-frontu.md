# Amix Elite Box — pozycje mocowań na froncie

Odczyt wizualny 29.10.2026: `pdf/AMIX-Elite-Box-standardowe.pdf`, strona 2. Źródło: wpis `AMIX-Elite-Box-standardowe` w `sources.json`, SHA256 `7ef6cd84fbb21cf0c5e8fccbb7765a782968fe32b000e3356f023afa43e3609d`. Sprawdzono powiększony przekrój H84 oraz rysunki „Wymiary montażowe mocowania frontu” H84/116/167/199.

- W przekroju wymiar 14,5 mm biegnie od wewnętrznej płaszczyzny boku korpusu do osi mocowania frontu, w stronę wnętrza szuflady. To nie jest odległość od bocznej krawędzi widocznego frontu.
- Dla frontu wyśrodkowanego względem LW: oś od lewej i prawej krawędzi frontu = `(szerokośćFrontu − LW) / 2 + 14,5`. Wartość uwzględnia nałożenie lub wpuszczenie frontu. Przykład LW564/front598: 31,5 mm od każdej krawędzi bocznej. Front560/LW564: 12,5 mm.
- Rysunki H84/116 pokazują rozstaw 32 mm (2 otwory na każdej osi). H167/199: 32, 64, 32 mm (4 otwory na każdej osi), czyli przesunięcia `[0,32,96,128]` od dolnego otworu.
- Dolny wymiar jest opisany **Min49.5**. Nie wolno automatycznie wyznaczać na jego podstawie dokładnej pozycji pierwszego otworu. Użytkownik podaje odległość od dolnej krawędzi frontu, zależną od nałożenia i położenia skrzynki. Kalkulator kontroluje minimum 49,5 mm, dodaje rozstawy i sprawdza wysokość frontu, jeśli podano ją na wejściu.
- Bez wpisanej pozycji pierwszego otworu wynik zawiera tylko minima, a `odDolnejKrawedziMM` pozostaje nieobecne. Bez szerokości frontu nie ma współrzędnej bocznej. `status=pozycje` oznacza komplet pozycji 2D, nie dopuszczenie do produkcji.
- Współrzędne odczytujemy na tylnej stronie frontu. Symetria powoduje, że obie osie mają ten sam odstęp od odpowiedniej krawędzi bocznej. Kalkulator nie obsługuje w tym wzorze frontu przesuniętego względem LW.

Schemat nie podaje jednoznacznych średnic i głębokości wiercenia pod konkretny zaczep/SKU. Pozostają `null`, `production_approved=false`. Nie przeniesiono tych danych na inne systemy ani na stalowy panel frontu wewnętrznego. Obliczenia nie dopisują operacji CNC do zapisanych projektów.

Interfejsy: REST/MCP `szerokoscFrontu`, `pierwszyOtworOdDolu` (mm). Wynik w `wyniki[].mocowanieFrontu`. Dane profilu w `reguly-szuflad.json` oraz kopii runtime `src/core/catalog/reguly-szuflad.json`.
