# Konfiguratory mebli — wybór funkcji dla Pan Stolarz

Data sprawdzenia: 2 listopada 2026. Wynik: rekomendacja rozwoju, nie raport wdrożenia nowych funkcji.

## Wniosek

Największy zysk da przejście od edytowania pojedynczych płyt do edytowania komór, frontów i zależności między częściami. Proponuję połączyć prostotę wyboru segmentów Tylko/Pickawood z konstrukcją parametryczną PolyBoard, kontrolą okuć Blum oraz dokumentacją warsztatową Mozaik. Kolejność wynika z potrzeb naszego systemu, nie z rankingu popularności produktów.

## Zakres i wiarygodność

Porównano publiczne strony produktów, dokumentację i oficjalne poradniki ośmiu konfiguratorów/programów projektowych oraz narzędzia rozkroju. Nie przeprowadzano pełnych testów płatnych wersji ani sesji w kontach producentów. Funkcje w tabeli są opisane przez dostawców; proponowane zastosowania, priorytety i kryteria odbioru są naszą oceną. Nie traktujemy haseł marketingowych o bezbłędności czy najlepszej optymalizacji jako wyników niezależnego testu.

Zweryfikowano również bieżący kod kreatora: `FurnitureModel`, `FurnitureCreator`, `FurnitureScene`, `FurnitureDrawers`, `Purchasing` oraz istniejący silnik `production.ts`. Starsze dokumenty researchowe w repozytorium są kontekstem, a nie potwierdzeniem obecnej wersji konkurencji.

## Co warto przejąć

| Narzędzie | Potwierdzona funkcja | Zastosowanie u nas |
|---|---|---|
| [Tylko](https://dstm-nuxt.public.cloud.tylko.com/sv-se/FAQ/articles/customisation/what-is-the-configurator) | Gotowe segmenty, konfiguracja szafy kolumna po kolumnie, wybór wyposażenia. | Klik w komorę → „półki”, „drążek”, „szuflady”, „drzwi”; bez ręcznego ustawiania każdej płyty. |
| [Pickawood](https://www.pickawood.com/eu/furniture/sloping-ceilings) | Projektowanie pod skos, podział na komory, materiały, wyposażenie i drzwi. Opisuje też ograniczenie kierunku otwierania przy skosie. | Pomiar wnęki oddzielony od wymiaru mebla, kontrola strony zawiasów, blendy i świadomie ustawiane luzy montażowe. |
| [IKEA PAX](https://www.ikea.com/nl/en/customer-service/knowledge/articles/ef926ca5-08ee-45ac-b29d-023e28b556b9.html) | Zapis i ponowne otwarcie przez kod/link projektu, konsultacja na tym samym projekcie, plan 3D i lista zakupów. | Udostępnienie klientowi konkretnej wersji koncepcji i porównanie wariantów, bez konieczności tworzenia pełnego konta klienta. |
| [Blum Cabinet Configurator](https://www.blum.com/gb/en/services/planning-construction-product-selection/cabinet-configurator/index.html) | Dobór okuć, kontrola kolizji, podział wysokości i szerokości frontów, zmiany konstrukcji po doborze okuć, CAD/BXF. | Oddzielna warstwa frontów i wnętrza, wykrywanie konfliktów oraz dobór systemu z jego rzeczywistymi wymaganiami. |
| [PolyBoard — producent](https://boole.eu/polyboard.php) | Parametryczna konstrukcja, style materiałów i metod wykonania, skosy, przeliczanie części i operacji po zmianach. | Zależności: półka między konkretnymi bokami, front w konkretnej komorze, przypięcie elementu i blokada wymiaru. |
| [imos iX PLAN](https://www.imos3d.com/en/products/sale/sale-solution-ix-plan/) | Planowanie pomieszczenia, ustawienia materiałów dla projektu, animowane fronty, rysunki i przekazywanie planu dalej. | Wstawianie mebla z naszej biblioteki do pomieszczenia; wspólny model dla prezentacji i dokumentacji. |
| [Roomle — dokumentacja dokowania](https://docs.roomle.com/rubens/content-creation/idm/idmdockinglogic) | Zdefiniowane zgodne punkty/kierunki łączenia elementów. | Przyciąganie półek do komór i modułów do sąsiadów, zamiast dowolnego nakładania brył. |
| [Mozaik Manufacturing](https://www.mozaiksoftware.com/mozaik-products/mozaik-manufacturing) | Osobny podział frontu i wnętrza, parametry konstrukcji, listy części, rysunki, dokumentacja montażowa i optymalizacja także dla warsztatów bez CNC. | Jeden pakiet warsztatowy: oznaczone części, rzuty, materiały, obrzeża i instrukcja montażu. |
| [optiCutter](https://www.opticutter.com/) — rozkrój, nie kreator mebla | Plany cięcia, raporty PDF, grupy materiałowe i dostępny wariant API. | Punkt odniesienia dla raportu rozkroju oraz ewentualnego adaptera. Samo istnienie API nie oznacza, że kupujemy usługę lub wysyłamy tam dane. |

Dodatkowo [Roomle](https://www.roomle.com/en) oferuje AR, planowanie pomieszczeń i konfigurację z zamawianiem. Dla nas to późniejszy etap, po wiarygodnej konstrukcji i dokumentacji.

## Punkt wyjścia w naszym systemie

Mamy już: wspólną bibliotekę właściciela i pracowników, wersjonowanie zapisów, propozycje wnętrza, skosy i schody, biurka z szafkami i nadstawką, rzeczywisty widok 3D, ręczną edycję płyt, standard konstrukcji, dane materiałowe i obrzeża części, przypisania systemów szuflad oraz automatyczne wypełnienie wysokości do półki/wieńca.

Model kreatora jest nadal przede wszystkim listą płyt ze współrzędnymi. To wystarcza do podglądu i szkicu, ale nie zapewnia kompletnego modelu zależności komór i połączeń. Front w podglądzie nie jest jeszcze kompletną skrzynką z prowadnicami. Zestawienie części i eksport JSON są podstawą integracji, nie zatwierdzonym wydaniem do produkcji. Istniejące moduły rozkroju i wyceny należy połączyć adapterem z kreatorem, zamiast pisać drugi niezależny silnik.

## Wybrane funkcje i kolejność

### P0. Edytor komór z zależnościami — fundament

Kliknięcie pustej przestrzeni zaznacza komorę. Działania: podziel pionowo/poziomo, wstaw N równych półek, wypełnij szufladami, dodaj drążek, zamień na komorę otwartą. Można skopiować wyposażenie do innej komory albo odbić cały segment. Ręczna edycja płyt pozostaje dostępna jako tryb zaawansowany.

Każda część powinna znać komorę i bazę wymiarowania, np. „między bokami A i B”, zamiast wyłącznie X/Y/Z. Rozszerzenie mebla przelicza elementy zależne. Można zablokować szerokość segmentu, wysokość szuflady lub prześwit, a reszta dzieli pozostałą przestrzeń. Sprzeczne blokady pokazują konkretny błąd; nie mogą być po cichu ignorowane.

Odbiór: zmiana szerokości korpusu zmienia półki i fronty właściwej komory; dodanie półki skraca tylko jej stos szuflad; zablokowane 300 mm pozostaje 300 mm. ID części i opisy materiałowe zachowane. Cofnij, zapis i ponowne otwarcie odtwarzają zależności. Migracja starego modelu musi zachować dotychczasową geometrię i nie zgadywać niejednoznacznych połączeń.

### P1. Wymiary i przyciąganie — szybka poprawa codziennej pracy

Wymiary zewnętrzne oraz światła komór na rysunku, odległość półki od dna i sąsiadów, równe odstępy, wyrównanie do wybranej krawędzi. Przyciąganie ma pokazywać cel i pozwalać się wyłączyć; wpisanie wartości w mm pozostaje równoważną metodą. Warto dodać „powtórz rozstaw” i zastosowanie parametrów do zaznaczonych elementów.

Odbiór: pokazany prześwit odpowiada rzeczywistej geometrii, nie wymiarowi nominalnemu; edycja działa klawiaturą i na telefonie, a etykiety nie zasłaniają wyboru części. Proste oznaczenia można wdrożyć przed pełnym P0, operacje zależne korzystają już z komór.

### P1. Fronty, wnętrze i kontrola ruchu

Fronty oddzielone od wnętrza: nakładany/wpuszczany, lewy/prawy, para drzwi, szuflada zewnętrzna/wewnętrzna za drzwiami. W 3D: pokaż wnętrze przez ukrycie frontów, otwórz drzwi i wysuń szuflady. Ruch opiera się na osi zawiasu albo rzeczywistym kierunku wysuwu, nie deformacji modelu.

Najpierw kolizje statyczne płyt; potem zakres ruchu drzwi/szuflady przy sąsiednim froncie, półce, ścianie i skosie. Celowo stykające się części konstrukcji nie mogą generować fałszywych alarmów. Ostrzeżenie wskazuje konkretne elementy i miejsce problemu. Brak danych okuć ma być stanem „nie sprawdzono”, a nie zielonym wynikiem.

Odbiór: drzwi uderzające w skos są wskazane; niewysuwalna szuflada za zamkniętymi drzwiami nie przechodzi kontroli. Ukrycie frontów jest tylko stanem widoku i nie usuwa ich z zestawienia materiałowego.

### P1. Biblioteka standardów warsztatu

Rozszerzamy obecny standard konstrukcji o zapisane zestawy: korpus, fronty, plecy, grubości, obrzeża, luzy i metoda połączeń. Można zastosować standard do całego mebla, jednej komory albo zaznaczonych części. Własne odstępstwa pozostają oznaczone i nie są przypadkiem nadpisywane.

Odbiór: „korpus biały, front dębowy” nie zmienia materiału pleców ani wymiarów; zmiana standardu ma podgląd zakresu i Cofnij. Domyślne wartości pochodzą z naszych zatwierdzonych ustaleń, nie z uniwersalnej zgadywanej technologii.

### P2. Prezentacja dla klienta i warianty A/B

Widok zewnętrzny, wnętrze, wymiary, materiały i dwa warianty obok siebie. Przygotowany przez właściciela odnośnik prezentuje zamrożoną wersję. Docelowo klient zaznacza element i dodaje uwagę. To może działać bez pełnego profilu klienta, ale wymaga osobnego, ograniczonego mechanizmu dostępu; nie przywracamy usuniętych publicznych podglądów ról.

Odbiór: link dotyczy jednej wersji, ma możliwość wygaśnięcia/unieważnienia i nie ujawnia kosztów wewnętrznych ani innych modeli. Otworzenie linku nie jest akceptacją projektu. Zmiana po prezentacji tworzy nową wersję. Zatwierdzenie koncepcji i zwolnienie dokumentacji do produkcji pozostają odrębnymi zdarzeniami.

### P2. Z biblioteki do pomieszczenia i wnęki

Łączymy kreator mebla z istniejącym planowaniem pomieszczeń. Wnęka zawiera pomiary, skos, schody, belki, listwy, gniazdka i przeszkody. Wymiary wnęki i gotowego mebla są oddzielne; luzy i blendy są jawnymi parametrami. Nie przenosimy na naszą technologię arbitralnego luzu montażowego innego producenta.

Wstawiony mebel wskazuje konkretną wersję biblioteki; późniejsza zmiana szablonu nie modyfikuje automatycznie zatwierdzonego projektu. Automatyczne wypełnienie wnęki kilkoma korpusami to następny krok po niezawodnym podziale komór.

Odbiór: zmiana wysokości pokoju nie zmienia po cichu zatwierdzonej szafy; przeszkoda i brak miejsca na montaż są wskazane. Pomiar niepewny jest jawny, nie zastępowany precyzją pozorną.

### P2. Pakiet warsztatowy z jednego modelu

PDF z wymiarami i przekrojami, widok rozstrzelony, numeracja części, karty materiałów/obrzeży, etykiety i QR do odpowiedniej wersji. W kolejnym kroku CSV/DXF poprzez adapter do istniejącego silnika. Oznaczenia w 3D, na etykiecie i w zestawieniu muszą wskazywać tę samą część.

Odbiór: bryła, lista części, dokumentacja i plik mają ten sam numer wersji; wyeksportowany pakiet nie zmienia się po edycji szkicu. Nierozstrzygnięta konwencja wymiarów netto/brutto, skos lub operacja nie może otrzymać etykiety „gotowe do cięcia”. Rozkrój uwzględnia materiał, grubość, usłojenie, rzaz, obrzynkę oraz technologię piły.

### P3. Rzeczywiste okucia, koszty i Mussi

Z geometrii i konkretnego profilu otrzymujemy listę potrzebnych funkcji, następnie zatwierdzone indeksy artykułów: prowadnice, boki, mocowania, zawiasy, uchwyty, nóżki itp. Kompletność wynika z danych producenta i wariantu, nie ze stałej liczby okuć na każdy mebel. Cennik, jednostki i robocizna są zarządzane; brak ceny pozostaje brakiem, nie zerem. Finanse pozostają po stronie właściciela.

Pakiet Mussi grupuje zgodne pozycje, przechowuje źródłowe części i rewizję, rozdziela płyty, obrzeża, okucia oraz usługi. Liczba arkuszy wynika z poprawnego rozkroju i decyzji o zapasie. Zgodnie z dotychczasową decyzją użytkownika pozostajemy przy szkicu; prawdziwa wysyłka dopiero razem z rzeczywistym silnikiem Mussi. Nie zakładamy, że opis integracji Blum z dystrybutorami daje dostęp do API Mussi.

Odbiór docelowy: znane SKU i jednostki, zatwierdzona wartość, jedna wysyłka mimo ponowienia, trwały identyfikator odbiorcy i możliwość sprawdzenia statusu. Wycena właściciela, zgoda klienta oraz zamówienie hurtowe są osobnymi operacjami.

## Kolejne pakiety realizacyjne

1. **Komory + kotwienie + blokady.** Specyfikacja relacji i migracji, model domenowy, operacje, testy geometrii, UI wyboru komory. To największa zmiana fundamentu.
2. **Praca na komorze.** Równe podziały, duplikowanie/odbicie, wymiary, przyciąganie i zastosowanie standardów.
3. **Fronty i wnętrze.** Osobne warstwy, ukrywanie, rzeczywisty ruch oraz etapowe sprawdzanie kolizji.
4. **Klient i pomieszczenie.** Warianty, ograniczone udostępnianie konkretnej wersji, mebel z biblioteki w istniejącym projekcie pomieszczenia.
5. **Warsztat i dostawca.** Adapter części do obecnej dokumentacji/rozkroju, kompletne okucia, wiarygodna wycena i dopiero wspólna integracja Mussi.

Nie podaję terminów kalendarzowych przed rozstrzygnięciem zakresu modelu komór i przetestowaniem migracji. Małe dodatki widoku nie zastąpią tych zależności.

## Co odkładamy

AR/VR, fotorealistyczne generowanie obrazów, AI tworzące dowolny mebel z jednego zdania, kompletny CNC/G-code i bezobsługowe zamówienia. Render poglądowy nie może zmieniać konstrukcji. Najpierw zgodność komór, części, okuć i dokumentacji. Można rozwijać nasze obecne TypeScript/React/Three.js oraz istniejące API; research nie uzasadnia teraz wymiany stosu ani zakupu innego konfiguratora.

