# Zachodnie kreatory mebli — wnioski i kolejny etap

14.11.2026. Przegląd dokumentacji producentów i opisów otwartych projektów. Opis funkcji producenta nie oznacza niezależnego testu jego programu. Stan naszego systemu ustalono z kodu i lokalnych testów.

## Rozwiązania warte przeniesienia

| Źródło pierwotne                                                                                                                                                                | Przydatna funkcja                                                                                                               | Wniosek dla Pan Stolarz                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Mozaik AutoFill](https://mozaik.support.cyncly.com/hc/en-us/articles/44022878183057-AutoFill-Customer-Guide)                                                                   | Dopełnianie pomieszczenia, ściany lub miejsca; podział na szerokości katalogowe albo dopasowane; możliwość dalszej edycji.      | Zaczęliśmy od jawnego dopełniania końca wybranego rzędu, bez przebudowy wcześniej ułożonych szafek.                                                       |
| [Mozaik Product Editor](https://mozaik.support.cyncly.com/hc/en-us/articles/44831885477905-Mozaik-Product-Editor-Customer-Guide)                                                | Osobna edycja frontów i wnętrza, blokowanie wymiarów otworów, powiązanie podziałów, parametry konkretnej szafki i lista części. | Rozwijać istniejące komory i blokady. Utrzymać jeden model dla rysunku, części i wyceny.                                                                  |
| [PolyBoard Cabinet mode](https://wooddesigner.org/help-centre/polyboard-cabinet-mode/) i [Project mode](https://wooddesigner.org/help-centre/polyboard-project-mode/)           | Nietypowe kształty, skosy, przegródki, dopasowanie mebli w pomieszczeniu oraz grupowanie modułów.                               | Kolejna większa luka to wnęka i przeszkody w publicznej kuchni. Istniejący kreator mebla ma już własny mechanizm skosów; nie tworzyć jego drugiej wersji. |
| [Microvellum Engineering](https://www.microvellum.com/solutions/engineering/) i [rysunki 2D](https://intercom.help/microvellum-knowledge-base/en/articles/13871775-2d-drawings) | Parametry konstrukcji, materiałów i okuć; rzuty, przekroje oraz rozstrzelenie z listą części.                                   | Zachować krótkie karty montażowe. Kolejny krok: podgląd kontroli i dokumentów konkretnej wersji zamiast mnożenia raportów.                                |
| [Winner Flex](https://www.cyncly.com/en-SE/products/winner-flex-b/capabilities)                                                                                                 | Pomiar pomieszczenia, elementy architektoniczne, katalogi i plany instalacyjne.                                                 | Okna, drzwi i przyłącza powinny poprzedzać zaawansowaną dekorację wizualizacji.                                                                           |
| [Roomle Full-logic](https://www.roomle.com/en/demos/full-logic-configurator)                                                                                                    | Zmiana wymiarów i modułów ograniczona regułami produktu.                                                                        | Walidować cały wynik przed zastosowaniem; nie zastępować niewykonalnych danych pozornie poprawnym wariantem.                                              |
| [OpenKitchen3D Cabinet planner](https://openkitchen3d.com/cabinet-planner)                                                                                                      | Przyciąganie do ścian i sąsiadów, automatyczne uzupełnienia, widoki z jednego modelu i zestawienie pozycji.                     | Rozróżnić pustą przerwę od fizycznej blendy. W tej iteracji oba są edytowalne i mają różny wpływ na geometrię oraz cenę.                                  |

## Otwarte repozytoria

- [CabinetDrafter](https://github.com/andyseubert/cabinet-drafter/blob/main/README.md): warsztatowe odhaczanie części, krótkie oznaczenia, podział wysokości szuflad i otwartych komór, optymalizacja uwzględniająca materiał/usłojenie i pozostałości. Najbardziej przydatny następny kierunek to postęp pracy na fizycznych częściach przypiętej wersji.
- [openPlan3D](https://github.com/laanlabs/openPlan3D/blob/main/README.md): ściany, drzwi, okna, schody, przyciąganie, prowadnice, warstwy i historia. Warto zaczerpnąć sposób pracy z pomieszczeniem, nie wprowadzać drugiego silnika jednostek lub geometrii.

Przeczytano opisy repozytoriów; nie wykonano ich kodu ani pełnego audytu. Nie skopiowano implementacji i nie dodano zależności. Włączenie kodu zewnętrznego wymaga osobnego sprawdzenia licencji i zgodności z naszym modelem.

## Materiał wideo z rzeczywistą transkrypcją

[PolyBoard: How to create a display cabinet](https://wooddesigner.org/how-to-create-a-display-cabinet-in-polyboard/) ma opublikowaną transkrypcję pod wideo. Pokazuje zmianę skosu w głębokości, stałą półkę, dodatkowe plecy, swobodną przegrodę równoległą do skosu i przegrody pod kątem. Ważna inspiracja: element można pozycjonować względem góry lub dołu, a nie tylko przeciągać. Wymiary demonstracji nie są regułami produkcyjnymi. Nie deklarujemy przeczytania transkrypcji pozostałych materiałów promocyjnych.

## Zaimplementowane lokalnie w tym etapie

1. **Dopełnij koniec rzędu**: oddzielne rzędy dolne/wiszące i wybrana ściana. Wolny koniec dzielony na równe szafki półkowe do 600 mm, z różnicą zaokrąglenia najwyżej 1 mm. Miejsce 20–199 mm otrzymuje blendę. Istniejące elementy i ich ID pozostają zachowane; jedna operacja historii.
2. **Blendy dolne i wiszące**: własny wymiar 20–300 mm; istniejący builder generuje rzeczywistą płytę frontową. Materiał i obrzeże wchodzą do wyceny, ale nie liczba pełnych szafek, zawiasy lub zawieszki. Blenda dolna zachowuje istniejący blat nad swoją szerokością.
3. **Przerwa przed elementem**: przesuwa ten element i następne w tym samym rzędzie. To pusta przestrzeń, bez automatycznej płyty i blatu. Uwzględnia ją dopasowanie szerokości; zapis/import, widoki i serwer używają tego samego położenia.
4. **Spójna oferta**: osobna liczba szafek i blend oraz jawna informacja o nieciągłym blacie przy przerwach. Zachowano dwustronicowy wzór A4.
5. **Kompaktowe UI**: dodatkowe narzędzia w dwóch domyślnie zamkniętych sekcjach, natywne kontrolki, przycisk zastosowania i istniejące Cofnij. Bez nowego modala.

Wymiary graniczne są ograniczeniami naszego szkicu, nie standardami producentów. Dopełnianie działa na końcu rzędu, nie wyszukuje luk w środku i nie dobiera AGD. Odrzuca kolizję ze słupkiem, przekroczenie ściany oraz limitu 24 elementów. Rezerwa narożnika 650 mm pozostaje zgodna z dotychczasową publiczną kuchnią; nie jest rzeczywistą szafką narożną. Ceny nadal są modelowe.

## Kolejność dalszego rozwoju

1. Pomiar i przeszkody: okna, drzwi z kierunkiem otwierania, przyłącza i odległości od ścian; czytelne wskazanie kolidującego elementu.
2. Wstawianie w wybraną lukę oraz pozycjonowanie ze wspólnym przyciąganiem w 2D/3D; zachowanie jawnych przerw i całej historii.
3. Rzeczywiste narożniki, panele końcowe i ciągłe blaty z zasadami łączenia, wycięciami i zgodną wyceną.
4. Zestawy okuć potwierdzone dokumentacją producenta, osobne wymiary frontu i skrzynki, kontrola otwierania.
5. Postęp warsztatowy części konkretnej wersji, pozostałości i parowanie usłojenia. Integracja Mussi nadal jako szkic, bez rzeczywistych zamówień.

Największa luka względem narzędzi zachodnich dotyczy obecnie kontekstu pomieszczenia i kontroli montażowej. Więcej efektów renderowania nie zastąpi tych danych.
