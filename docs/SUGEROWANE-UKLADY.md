# Sugerowane układy mebla

Decyzja użytkownika 2.11.2026: każdy wariant powinien od razu proponować wnętrze do modyfikowania podczas ustalania projektu. Nowy model w interfejsie uruchamia się z układem automatycznym. Nie zmieniono uprawnień ani nie udostępniono prywatnej biblioteki publicznie.

## Propozycje

- Automatycznie do obrysu: szafa z półkami i wysoką komorą dla prostokąta; półki w dwóch komorach pod skosem; podział na komory dla schodów.
- Szafa: przegroda, półki w jednej komorze i wysoka przestrzeń z półką u góry w drugiej. Nie dodaje domniemanych okuć/drążka.
- Regał: półki z podziałem uwzględniającym obrys.
- Komoda: fronty szuflad, liczba zależna od wysokości (maksymalnie osiem na komorę).
- Półki i szuflady: dolny zestaw trzech frontów (przy dostatecznej wysokości 140/220/320 mm), półka nad nimi oraz półki w sąsiedniej komorze. Przy mniejszej wysokości układ jest ograniczany do dostępnej przestrzeni.
- Sam korpus: wariant zaawansowany bez proponowanego wnętrza.

Wszystkie warianty działają dla prostokąta, skosu i schodów w obu kierunkach. Obliczenie dostępnej wysokości uwzględnia grubość wieńca normalną do skosu oraz grubości przegród. Zbyt mała szerokość/głębokość/wysokość nie generuje niedodatnich płyt: interfejs nazywa brak miejsca. Układy są propozycją konstrukcyjną, nie znormalizowaną technologią produkcji.

## Edycja i trwałość

Model zapisuje suggestion.variant i listę excludedSlots. Elementy mają stabilne layoutSlot i opcjonalne layoutCustomized. Zmiana gabarytów lub obrysu przelicza tylko niezmienione ręcznie elementy sugerowane, zachowując ID, własną nazwę oraz dane materiałowe. Edycja wymiarów/pozycji albo przeciąganie oznacza element jako ręcznie zmieniony. Samo przypisanie materiału nie zamraża geometrii.

Usunięty element jest wykluczony z kolejnych przeliczeń. Kopia pojedynczej płyty staje się niezależnym elementem. Jeżeli zmiana topologii usuwa miejsce elementu zmienionego ręcznie, zachowujemy go jako niezależną płytę do sprawdzenia. Ręczne zmiany mogą wymagać korekty po zmianie gabarytów; dotychczasowe sprawdzanie geometrii pozostaje aktywne.

Zmiana wariantu lub Przywróć sugerowany układ jawnie zastępuje wnętrze i przypisania systemów szuflad. Korpus i standard materiałów pozostają. Operację można cofnąć. Ręczne Ustaw zestaw szuflad zastępuje fronty i niezmienione sugestie; zachowuje niezależne i ręcznie zmienione płyty. Starsze zapisane modele otwierają się bez automatycznej przebudowy.

Sugerowane fronty rozpoznają rzeczywiste granice komory po geometrii (luz 2 mm na stronę). Brak pasującej granicy blokuje kalkulację skrzynki zamiast rozszerzać komorę do całej szerokości. System okuć nadal wybierany jest osobno i pozostaje roboczy.

## Sprawdzenie

Testy jednostkowe obejmują 36 kombinacji wariantu, obrysu i kierunku, dodatnie części, unikalne ID, zgodność schematu, zachowanie ręcznych zmian i wykluczeń oraz przywrócenie układu. Testy przeglądarkowe sprawdzają automatyczny start, warianty, edycję, zapis i otwarcie, Cofnij oraz telefon. Dotychczasowe testy ręcznych operacji jawnie wybierają Sam korpus, by nadal sprawdzać ten tryb.
