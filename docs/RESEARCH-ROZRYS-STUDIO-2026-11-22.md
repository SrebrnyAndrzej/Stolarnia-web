# Rozrys: publiczny przegląd i test Studio — 22.11.2026

Źródło pierwotne: https://rozrys.pl/ — publiczna strona, działające demo rozkroju i rozdziały prezentacji planera. Bez zakładania konta, logowania do Pro, pobierania kodu ani kopiowania zasobów.

## Co można rzeczywiście sprawdzić

- Demo „Ile płyt potrzebujesz?”: tabela nazwa/wymiary/liczba elementów, dodawanie i usuwanie, reset, diagram arkusza oraz liczba płyt, wykorzystanie i długość cięć. Przykład wyraźnie oddziela HDF od korpusów.
- Planer 3D jest na stronie opisany jako Pro. Publicznie dostępna jest prezentacja wideo, a nie otwarta sesja edytora. Nie potwierdzamy działania niewidocznej aplikacji.
- Na filmie: katalog rozwijany grupami z liczbą wariantów, edytor obok projektu, wybór ściany, elewacja/rzut/3D, Cofnij/Ponów, dosuwanie, warstwy i zoom. Rozdział AGD prezentuje dopasowywanie zlewu, płyty i okapu do szafek.
- Rozdziały Formatki i Dokumentacja pokazują osobny etap produkcyjny, grupowanie według szafek lub zamówienia do rozkroju oraz eksport. Są to obserwacje prezentacji, nie wykonany eksport z konta.

## Porównanie z Pan Stolarz

Mamy już podglądy 2D/3D, edytor wymiarów i wnętrza, historię, blokady, kontrolę narożników/otworów, układanie stref, luki, rozkrój oraz dokumentację zespołu. Nie tworzymy ich drugiej implementacji. Największa różnica w przebiegu klienta to odkrywalność katalogu: dotychczas rodzaje szafek są ukryte w select.

## Wdrożony eksperyment

Adres `#/kreator-kuchni?ui=studio`. Domyślny adres zachowuje dotychczasowy interfejs. Studio:

1. Pokazuje rozwijane grupy w sekcjach Meble / AGD i hydraulika / Wykończenia. Zabudowa lodówki nie dubluje się jako słupek do przechowywania. Pokazuje również istniejące narożne warianty katalogu.
2. Wyszukuje po nazwie, funkcji i szerokości w cm; przyjmuje polskie znaki i zapis bez ogonków. Pokazuje liczbę pasujących wariantów z rzeczywistego planowania dodania, nie tylko z porównania szerokości. Brak miejsca nie znika bez wyjaśnienia.
3. Dodaje schemat wyboru istniejących szafek z osobnym rzędem górnym i dolnym/wysokim. To przyciski wyboru, nie rysunek w skali. Właściwy rysunek nadal generuje silnik. Standardowy widok zachowuje natywną listę; Studio pozwala wybrać i przestawiać szafki klawiaturą przez przyciski. Pokazujemy jeden przełączany rząd naraz w rozwijanym wyborze, aby zostawić miejsce na rysunek.
4. Używa istniejących Apply/Cancel, historii, walidacji, blokad, schematu szkicu i API ceny. Wyjście z eksperymentu nie gubi projektu i respektuje oczekującą edycję.

To samodzielna implementacja wzorców interakcji w obecnej identyfikacji marki. Nie zawiera kodu, filmów ani grafik Rozrys. Tryb nie jest zmianą modelu wyceny i nie udaje zakupu urządzeń AGD. Nie wdrażamy niezweryfikowanego swobodnego przeciągania ani nowego algorytmu rozkroju na podstawie filmu.

## Weryfikacja

Testy grupowania, wyszukiwania i pełnego rzędu: `studio-catalog.test.ts`. Kontrola dodawania i zamiany: istniejące `catalog-placement.test.ts` i `catalog-movement.test.ts`. Typecheck, build i przejście przez oba adresy w przeglądarce przed publikacją. Dowody ekranowe oraz wynik publikacji znajdują się w katalogu zadania `outputs/rozrys-test-20261122`.
