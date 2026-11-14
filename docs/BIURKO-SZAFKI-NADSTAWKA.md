# Biurko z szafkami i nadstawką

W kreatorze właściciela i pracownika są trzy warianty: Biurko, Biurko z szafką boczną oraz Biurko z szafką i nadstawką. Szafki mogą stać po lewej, prawej lub obu stronach. Każda ma wybór otwartych półek, drzwi lub trzech frontów szuflad o różnej wysokości. Elementy można dalej przesuwać, wymiarować, usuwać i dodawać w istniejącym inspektorze.

Punkt startowy: blat 1600 × 800 mm, wysokość robocza 740 mm, płyta 28 mm. Szafka pojedyncza ma 420 mm; przełączenie na dwie szafki ogranicza ich szerokość do 375 mm dla zachowania 850 mm wolnej szerokości. Wymiary można potem zmienić ręcznie; aplikacja pokazuje informację o ograniczonym miejscu na nogi. To założenia projektu, nie deklaracja zgodności z normą. Źródła ergonomii: [BIURKO-WYMIARY.md](BIURKO-WYMIARY.md).

Nadstawka zaczyna się na blacie: początkowo 600 mm wysokości i 300 mm głębokości. Wysokość całkowita i wysokość robocza są oddzielne. Zmiana wysokości nadstawki nie podnosi blatu; zmiana wysokości roboczej przesuwa nadstawkę razem z blatem. Ma boki, wieniec oraz półki i przegrody nad szafkami, pozostawiając środek na stanowisko pracy. Trzeba sprawdzić gabaryt monitora, stateczność i mocowania przed wykonaniem.

Szafki mają plecy 3 mm i dno; pod środkową przestrzenią nie ma pełnego dna. Z tyłu pod blatem jest listwa usztywniająca 150 mm. Fronty są wpuszczone z luzem 2 mm na stronę; geometria nie zawiera jeszcze zawiasów, skrzynek i prowadnic. Szuflady mogą otrzymać systemy w istniejącym panelu: obliczenia uwzględniają rzeczywiste boki szafki oraz plecy/listwę z tyłu. Nie jest to dokumentacja dopuszczona do produkcji.

Model, konfiguracja szafek, nadstawki i ręczne korekty zapisują się w ogólnej bibliotece. Obowiązują dotychczasowe role, wersjonowanie i obsługa konfliktów. Zmiana rodzaju frontu zastępuje fronty szafek i usuwa ich przypisania systemów; Cofnij odtwarza zmianę. Przełączenie całego wariantu zastępuje wnętrze zgodnie z dotychczasowym kontraktem kreatora.

Weryfikacja obejmuje geometrię obu stron i dwóch szafek, brak powielonych części, obliczenia sześciu szuflad, niezależną wysokość blatu, walidację zapisu oraz zapis/odczyt biblioteki i Cofnij na telefonie.
