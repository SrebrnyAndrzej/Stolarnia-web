# Automatyczne wypełnianie komory szufladami

Nowy układ i przywrócenie wariantu domyślnie włączają „Wypełnij szufladami całą komorę”. Fronty w każdej kolumnie wypełniają wysokość od dna do najbliższej pełnej półki albo wieńca. W biurku granicą jest spód blatu, nie nadstawka. Zostają luzy 2 mm u dołu, u góry i pomiędzy frontami. Wartości niskich, średnich i wysokich frontów są proporcjami podziału w trybie automatycznym. Ostateczne wymiary są widoczne w inspektorze i zestawieniu części.

Dodana pełna półka kończy stos poniżej swojej dolnej powierzchni. Przesunięcie lub usunięcie półki przelicza dostępną wysokość. Krótka półka nie jest automatycznie granicą całej kolumny. Automatyka nie tworzy szuflad powyżej półki ani nie zmienia jej położenia. Skosy i schody ograniczają wysokość do najniższego punktu komory. Wariant mieszany zawiera własną półkę nad częścią szuflad i zachowuje ten świadomy podział.

Tryb można wyłączyć, aby zachować własne wysokości i pozycje. Ręczna zmiana wymiaru lub pozycji frontu również go wyłącza. Cofnij odtwarza poprzedni tryb i geometrię. Ponowne włączenie dopasowuje istniejące fronty bez zmiany ich liczby i identyfikatorów. Zbyt wiele frontów pod niską półką daje błąd, zamiast ujemnych wymiarów; minimalny front 60 mm jest ograniczeniem tego szkicu, nie uniwersalnym standardem okuć.

„Ustaw zestaw szuflad” rozdziela wskazaną liczbę według proporcji, również osobno w obu szafkach biurka. Liczba z własnego zestawu nie wraca do trzech po zmianie gabarytów. Zmiana konfiguracji szafek biurka tworzy ponownie domyślny podział jej frontów, z możliwością Cofnij. Jak wcześniej, zastąpienie frontów usuwa przypisania systemów tych frontów.

Tryb i informacja o własnym zestawie zapisują się w modelu biblioteki. Starsze modele bez tych pól zachowują dotychczasową geometrię do jawnego włączenia automatyki albo przywrócenia układu. Role, wersjonowanie i konflikty zapisu nie zmieniają się. To podział frontów; dobór skrzynek, prowadnic, prześwitów i okuć pozostaje w istniejącym panelu systemów szuflad.

## Stała wysokość wybranego frontu

W inspektorze samodzielnej szuflady zaznacz „Stała wysokość frontu”, następnie wpisz wysokość płyty. Wypełnianie komory pozostaje włączone. Po odjęciu luzów i wszystkich stałych wysokości pozostałe fronty dzielą dostępną wysokość równo. Przykład dla sumy wysokości samych frontów 704 mm: blokada 140,5 mm pozostawia po 281,75 mm dla dwóch wolnych frontów. Bez blokad nadal obowiązują proporcje dotychczasowego układu.

Blokada przeżywa zmianę gabarytów, dopasowanie do pełnej półki, zapis/otwarcie i cofanie. Nie zmienia liczby frontów ani doboru ich systemów. Jeżeli stałe wymiary nie mieszczą się w komorze, podział zgłasza konflikt, zachowując zadane wysokości. Bez wolnego frontu suma blokad musi dokładnie wypełnić dostępną przestrzeń po odjęciu luzów. Dla frontów generowanych przez układ komór korzystaj z wymiarów komory. Przełączenie na ręczne pozycjonowanie zawiesza blokady do ponownego włączenia wypełnienia.
