# Standardy konstrukcji i lista części

Decyzja użytkownika 2.11.2026: wdrażać wzorce znalezione w konkurencji. Kierunek: metody konstrukcyjne PolyBoard, kompletne planowanie okuć Blum, rozdzielenie wymiarów i zestawień Mozaik, późniejszy proces wyceny/realizacji Mussi. Źródła sprawdzone w poprzednim etapie:

- https://boole.eu/polyboard.php
- https://www.blum.com/pl/pl/services/planning-construction-product-selection/cabinet-configurator/
- https://mozaik.support.cyncly.com/hc/en-us/articles/43534171162513-Mozaik-Cutlist-Tab-Customer-Guide
- https://www.erozrys.drewmax.pl/pl/content/show/help

## Obecny zakres

Standard jest zapisany wraz z modelem biblioteki. Kopia modelu przenosi standard i opisy, a dalsze zmiany kopii nie modyfikują oryginału. Nie wprowadzono osobnego globalnego katalogu standardów ani migracji istniejących modeli.

Jedna obsługiwana geometria korpusu: pełne boki, dno i wieniec między bokami. Dwa warianty pleców: brak lub nakładane. Rowki, wręgi, uciosy konstrukcyjne i profile wierceń nie są udawane.

Zadana głębokość D obejmuje plecy o grubości B: plecy zajmują Z=0..B, korpus Z=B..D, fronty pozostają przed Z=D. Plecy przyjmują rzeczywisty obrys skosu/schodów. Ich ID zachowuje się po zmianie gabarytów. Wyłączenie pleców usuwa ten element i przywraca pełną głębokość generowanego korpusu. Własne płyty nie są automatycznie przesuwane; nachodzenie na plecy jest nazwanym błędem do poprawienia przed zapisem.

Materiał i dekor korpusu, frontów i pleców oraz domyślne obrzeże są opisami użytkownika, bez cen i SKU. Domyślnie okleinowana jest przednia krawędź korpusu oraz cztery krawędzie frontów, pozostałe krawędzie bez obrzeża. Kierunku usłojenia nie zgadujemy z nazwy dekoru.

Uzupełnienie brakujących opisów zachowuje istniejące decyzje. Jawne zastąpienie obejmuje generowany korpus, plecy i fronty, ale nie własne półki/przegrody. Można je cofnąć. Nowe półki/przegrody i fronty korzystają z bieżących opisów standardu. Zmiana samych pól materiałowych standardu nie nadpisuje istniejących opisów bez użycia akcji. Wymiary/plecy przeliczają się bez dodatkowego zatwierdzenia, z ochroną niezapisanego szkicu.

## Zestawienie

Każda część pozostaje osobnym wierszem ze stabilnym ID. Wymiary U/V odpowiadają jawnie wybranej płaszczyźnie. Lista pokazuje materiał, dekor, grubość, geometrię, rdzeń i braki.

Wybór znaczenia geometrii:

- nieokreślone: brak automatycznego wymiaru rdzenia;
- wymiar gotowy: dla obsługiwanej prostokątnej części odejmujemy grubość wybranych obrzeży na przeciwległych krawędziach;
- wymiar rdzenia: pozostawiamy wymiar geometryczny bez odejmowania.

Brak danych materiałowych, decyzji o usłojeniu lub krawędziach blokuje wymiar rdzenia, ale nie zapis szkicu. Skosy i nieregularny przekrój pozostają z pełnym polygonem i nazwanym wymaganiem technologii; nie dostają zastępczego prostokąta do cięcia. Grubość obrzeży przekraczająca rozmiar części też blokuje wynik. Wymiary rdzenia nie zawierają naddatków obróbkowych ani korekt konkretnej maszyny. Nie są zatwierdzonym wydaniem produkcyjnym.

Eksport karty konstrukcji zawiera teraz dodatkowo dimensionSummary z tego samego modułu obliczeniowego co tabela. Dotychczasowe pola i schemaVersion=1 pozostają kompatybilne. Eksport nadal wymaga zapisanej zgodnej wersji i readyForProduction=false.

## Dalsze etapy

Profil technologiczny połączeń/operacji, rzeczywiste systemy szuflad i zestawienia okuć, dobór indeksów dostawcy, rozkrój i naddatki. Wysyłka Mussi nadal wyłączona; obecny etap nie wprowadza zamówień ani cen demonstracyjnych do produkcji.
