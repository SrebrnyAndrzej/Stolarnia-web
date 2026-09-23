# Budowa internetowego kreatora mebli: analiza i inspiracje

Data researchu: 23.09.2026. Cel: uniwersalny kreator różnych rodzin mebli z dokumentacją do produkcji. Aktualne wytyczne: `CLAUDE-wytyczne-kreator-mebli-v0.4.md`.

Doprecyzowanie użytkownika po researchu: po zaprojektowaniu całej kuchni obowiązkowo powstaje pełna dokumentacja każdego mebla i każdej wykonywanej części, w tym pozycje, średnice, głębokości i strony wszystkich wymaganych wierceń oraz pozostała obróbka. Wymóg ten jest warunkiem gotowości produkcyjnej funkcji kuchni; nie wolno odkładać go do opcjonalnej integracji CNC. Drugim obowiązkowym wymaganiem jest interaktywny silnik wizualizacji 3D. Oba systemy korzystają ze wspólnego modelu konstrukcji. Szczegółowy zakres i kryteria odbioru znajdują się w wersji 0.3 wytycznych.

## 1. Najważniejsza decyzja

Rekomenduję budowę edytora parametrycznego opartego na wiedzy o konstrukcji mebli. Jego rdzeń powinien przeliczać intencję użytkownika na części, połączenia, okucia i operacje technologiczne. Podgląd, dokumentacja i kalkulacja kosztów powinny korzystać z jednego wyniku tych obliczeń.

Uniwersalność należy rozwijać przez kolejne rodziny konstrukcji. Pierwszym spójnym zakresem mogą być regały, szafy, komody, biurka i szafki wykonywane z płyt. To rekomendacja kolejności wdrażania, nie ograniczenie docelowego produktu. Meble tapicerowane, lite drewno, konstrukcje stalowe oraz meble o swobodnych krzywiznach wymagają własnych modeli technologicznych.

Największy koszt i ryzyko dotyczą poprawności zależności oraz danych warsztatowych. Sam obrót modelu 3D jest znacznie mniejszym problemem.

## 2. Metoda i granice analizy

Przejrzano publiczne repozytoria, dokumentacje, opisy funkcji oraz wybrane pliki źródłowe. Szczegółowo odczytano m.in. `cabinet-math.js` i fragment eksportera DXF w projekcie petervanderwalt/cabinet-studio oraz dokumentację architektury WoodworkingShop. Nie uruchamiano aplikacji i ich testów, nie przeprowadzano obróbki próbnej ani kompletnego audytu repozytoriów. Deklaracje README pozostają deklaracjami autorów, dopóki nie potwierdzi ich test.

Nie otrzymano kodu obecnej aplikacji. Rekomendacje wymagają porównania z istniejącą architekturą przed wdrożeniem. Linki do gałęzi repozytoriów mogą się zmieniać; przed wykorzystaniem kodu trzeba zapisać konkretną rewizję.

## 3. Inspiracje z GitHuba

| Projekt | Zweryfikowany zakres źródła | Przydatność dla nas | Ograniczenie |
|---|---|---|---|
| [OpenCutList](https://github.com/lairdubois/lairdubois-opencutlist-sketchup-extension) | Rozszerzenie SketchUp: zestawienia części, rozkrój, etykiety, koszty i masa; repozytorium wskazuje GPL-3.0. | Najlepszy z wybranych punkt odniesienia dla znaczenia danych materiałowych i wyjść warsztatowych. | Rozszerzenie istniejącego programu, a nie gotowy silnik przeglądarkowego kreatora. |
| [Furniture Designer](https://github.com/Manwe-777/furniture-designer) | README opisuje podziały wnętrza, model części, materiały, eksporty, rozkrój i wiercenia; wskazuje MIT. | Inspiracja dla edycji przestrzeni i części kupowanych na gotowo. | Nie zweryfikowano niezależnie dokładności obliczeń ani deklarowanych testów. |
| [WoodworkingShop](https://github.com/RajwanYair/WoodworkingShop) | Parametry, BOM, eksporty, MaxRects; dokumentacja oddziela obliczenia od UI; MIT w repozytorium. | Organizacja modułów, historia zmian, eksporty i warianty. | Dokumentacja rozróżnia widoki SVG od eksperymentalnego WebGL; hasło „3D” wymaga doprecyzowania. |
| [Cabinet Studio](https://github.com/petervanderwalt/cabinet-studio) | Odczytano kod obliczania paneli oraz eksportera DXF. | Mały, czytelny przykład rozdzielenia obliczeń, interfejsu, widoku i eksportu. | Kod zawiera uproszczone reguły referencyjne; autor zaleca sprawdzanie wymiarów przed cięciem. |
| [PackingSolver](https://github.com/fontanf/packingsolver) | Osobne warianty dla prostokątów, rozkroju gilotynowego i innych problemów; MIT w repozytorium. | Kandydat do osobnego prototypu optymalizacji rozkroju. | Integrację i wydajność w naszym środowisku trzeba zmierzyć; nie jest gotowym interfejsem meblowym. |
| [Replicad](https://github.com/sgenoud/replicad) | Biblioteka budowania modeli w przeglądarce, oparta na OpenCascade; MIT w repozytorium. | Kandydat przy potrzebie dokładnych operacji na bryłach. | Nie dostarcza reguł meblarskich, doboru okuć ani kompletnej aplikacji. |
| [JSketcher](https://github.com/xibyte/jsketcher) | Więzy szkiców, historia operacji, OpenCascade i modelowanie parametryczne. | Punkt odniesienia dla przyszłego edytora nietypowych kształtów. | Dużo szerszy zakres niż konfiguracja korpusów; przed adaptacją konieczna analiza kodu i licencji. |
| [Deepnest](https://github.com/Jack000/Deepnest) | Aplikacja desktopowa do nestingu, oparta na SVGNest; README wymienia m.in. łączenie linii dla lasera. | Inspiracja dla rozmieszczania nieregularnych konturów. | Nie zakładać, że układ do lasera jest wykonalnym planem cięcia płyt na pile. |

Nie rekomenduję kopiowania całej aplikacji na podstawie atrakcyjnego README. Najbardziej wartościowe są konkretne idee i oddzielne komponenty: semantyka produkcji z OpenCutList, edycja podziałów z Furniture Designer, separacja modułów z Cabinet Studio oraz specjalizacja rozkroju z PackingSolver.

### Konkretny wniosek z kodu

W odczytanej wersji `cabinet-math.js` rozmieszczenie części otworów prowadnic zależy od uproszczonego wzoru z głębokością szuflady, a operacje są oznaczone jako referencyjne. W tym samym pliku liczba zawiasów jest dobierana prostym progiem wysokości. To użyteczne do demonstracji, lecz nie stanowi potwierdzenia zgodności z konkretnym katalogowym okuciem. [Kod źródłowy](https://raw.githubusercontent.com/petervanderwalt/cabinet-studio/main/js/cabinet-math.js).

Wniosek dla nas: każda reguła technologiczna ma wskazywać produkt, wariant, zakres stosowania i źródło. Obliczona pozycja otworu nie może automatycznie otrzymywać statusu zweryfikowanej operacji produkcyjnej.

## 4. Inspiracje z działających produktów

Tylko i Pickawood są punktami odniesienia dla prowadzenia klienta przez ograniczony zestaw sensownych decyzji. Pickawood opisuje wybór rodziny mebla, wymiarów, podziałów, materiałów i detali oraz zapis projektu. Warto wykorzystać tę stopniowość w trybie podstawowym. [Pickawood](https://www.pickawood.com/eu/configurator).

Blum pokazuje znaczenie powiązania korpusu z okuciami, testem montażu, rysunkami i danymi produkcyjnymi. Jego BXF przenosi m.in. informacje o formatkach i pozycjach wierceń do zgodnych rozwiązań. Nie oznacza to automatycznie dostępności publicznego API dla naszego produktu. [Blum](https://www.blum.com/pl/pl/services/planning-construction-product-selection/cabinet-configurator/).

Intar/Arrocco opisuje powiązanie konfiguracji, wyceny i specyfikacji technicznej. To dobry wzorzec ciągłości procesu od projektu do zamówienia komponentów. [Arrocco](https://arrocco.pl/dla-stolarzy/).

## 5. Problemy, które trzeba rozwiązać w modelu danych

### Intencja, konstrukcja i prezentacja

Rekomenduję trzy jawne warstwy:

- Intencja użytkownika: szerokość mebla, rodzaj korpusu, podział wnętrza, wybrane materiały i systemy okuć.
- Rozwiązana konstrukcja: części o znanych konturach, grubościach, pozycjach, obrzeżach i operacjach; połączenia oraz listy zakupowe.
- Prezentacja: siatki 3D, tekstury, linie wymiarowe, zaznaczenie i animacja otwierania.

Ukrycie frontów w widoku nie usuwa ich z zestawienia. Widok rozstrzelony nie zmienia pozycji montażowych. Animacja nie modyfikuje geometrii części do produkcji.

### Podziały wnętrza

Przestrzeń wewnętrzna może być drzewem: sekcję dzielimy pionowo lub poziomo, a każda sekcja może otrzymać wyposażenie. Trzeba rozróżnić wymiar stały, proporcjonalny i wynikający z pozostałego miejsca. Suma przegród, szczelin i wolnych przestrzeni musi zamykać dostępną szerokość lub wysokość.

Po zwężeniu szafy nie wolno po cichu zmieniać wymiaru zablokowanej sekcji. System powinien wskazać konflikt. Jeden fizyczny element wspólny dla dwóch sekcji musi być policzony raz.

### Różne znaczenia wymiaru

Potrzebne są osobne pojęcia: wymiar zewnętrzny mebla, światło wnętrza, wymiar gotowej części, wymiar półfabrykatu do cięcia, naddatek technologiczny, luz montażowy i tolerancja.

Przykład czysto obliczeniowy: dla korpusu o szerokości 800 mm, bokach 18 mm oraz dna umieszczonego pomiędzy bokami, bez wpustów i luzów, szerokość dna wynosi 764 mm. Zmiana boków na 19 mm daje 762 mm. Jest to przykład z podanymi założeniami, nie uniwersalna reguła wszystkich korpusów.

OpenCutList rozróżnia materiały oraz sposób uwzględniania obrzeży, w tym pomniejszenie wymiaru o grubość obrzeża albo brak takiej redukcji. [Dokumentacja materiałów](https://docs.opencutlist.org/features/applying-materials).

Wniosek: sposób kompensacji obrzeży musi wynikać z profilu wykonawcy. Nie wolno odejmować obrzeża ponownie w eksporcie, jeśli uwzględniono je wcześniej.

### Lokalny układ części

Każda część wymaga jednoznacznego początku układu współrzędnych, osi długości/szerokości/grubości, strony A/B i nazw krawędzi. Ustawienie w meblu jest oddzielną transformacją.

Lewa i prawa płyta mogą mieć te same wymiary, lecz inne wiercenia. Nie są wówczas jednym typem części do produkcji. Odbicie musi obejmować operacje, strony i obrzeża. Numer trójkąta modelu 3D nie nadaje się na trwałe oznaczenie strony płyty.

### Pochodzenie reguł

Reguła powinna przechowywać identyfikator, wersję, źródło, zakres parametrów, wynik oraz stopień weryfikacji. Projekt ma pamiętać wersję katalogu i profilu technologicznego. Aktualizacja katalogu nie może samoczynnie zmienić dokumentacji zamówienia sprzed miesiąca.

## 6. Co oznacza „projekt poprawny”

Należy oddzielić kilka poziomów sprawdzania:

| Poziom | Przykładowy problem | Oczekiwane zachowanie |
|---|---|---|
| Dane wejściowe | Brak wymiaru, NaN, nieznany materiał | Czytelny błąd przed obliczeniem konstrukcji. |
| Zależności | Zablokowane sekcje nie mieszczą się w korpusie | Konflikt ze wskazaniem parametrów. |
| Geometria | Ujemny wymiar, niezamierzona kolizja | Błąd przypisany do części. |
| Okucia | Prowadnica niezgodna z głębokością lub systemem szuflady | Niedostępny wybór albo blokada eksportu produkcyjnego. |
| Technologia | Element mniejszy niż dopuszcza wybrany zakład | Błąd konkretnego profilu produkcji. |
| Eksploatacja i montaż | Konflikt otwierania, niedostępne połączenie | Ostrzeżenie lub blokada w obsługiwanym zakresie. |
| Dokumentacja | Brak strony wiercenia, inna rewizja rysunku | Brak oznaczenia „gotowe do produkcji”. |

Własna rekomendacja: wstępne wykrywanie zderzeń uproszczonymi bryłami, a dokładne badanie dla podejrzanych par. Zamierzone osadzenie w rowku czy wpuszczenie łącznika nie może być traktowane tak samo jak przypadkowe przenikanie płyt. Animacja otwierania nie jest dowodem bezkolizyjności całego ruchu.

Nośności i stateczności nie wolno wyprowadzać z samego faktu braku kolizji. Bez zweryfikowanych reguł należy oznaczyć zakres jako niesprawdzony.

## 7. Wybór silnika geometrii

| Kierunek | Kiedy pasuje | Koszt i ryzyko |
|---|---|---|
| Parametryczne części płytowe + kontury 2D + podgląd 3D | Prostokątne korpusy i większość początkowego katalogu | Najmniejsza złożoność; trzeba samodzielnie modelować reguły meblarskie. |
| Dokładne bryły CAD, np. przez Replicad/OpenCascade | Złożone kształty, zaawansowane operacje na bryłach, określone formaty CAD | Większe wymagania obliczeniowe i trudniejsza obsługa zmian topologii. |
| Pełny edytor szkiców z więzami | Swobodne rysowanie nietypowych części przez zaawansowanego użytkownika | Dodatkowy produkt o dużym zakresie; niepotrzebny do pierwszego poprawnego korpusu. |

Rekomenduję pierwszy kierunek z możliwością późniejszego dodania dokładnego modułu CAD. Three.js może pełnić rolę prezentacji. Nie należy odczytywać dokumentacji produkcyjnej z przybliżonej siatki ekranowej. Biblioteki CAD są kandydatami do pomiarów i prototypu, a nie decyzją o przebudowie istniejącej aplikacji. [Replicad](https://github.com/sgenoud/replicad), [JSketcher](https://github.com/xibyte/jsketcher).

## 8. Rozkrój jest osobnym problemem

Lista części nie określa jeszcze kolejności cięcia. Układ prostokątów o małym odpadzie nie musi spełniać wymagań piły panelowej. PackingSolver jawnie rozdziela zwykłe rozmieszczenie prostokątów od wariantu z cięciami przechodzącymi przez cały aktualnie cięty fragment. [PackingSolver](https://github.com/fontanf/packingsolver).

OpenCutList opisuje rzaz, obcięcie brzegów arkusza, usłojenie, wykorzystanie resztek i kompromis między czasem obliczeń a wynikiem. [Rozkrój płyt](https://docs.opencutlist.org/features/parts/parts-list/cutting-diagrams/sheet-goods), [ograniczenia rozkroju](https://docs.opencutlist.org/features/parts/parts-list/cutting-diagrams).

Rekomendowane wymagania: rozdzielenie po materiale i grubości, dozwolone obroty, marginesy, rzaz lub odstęp narzędzia, ograniczona liczba dostępnych arkuszy, resztki, części kupowane gotowe i jawna lista elementów nierozmieszczonych. Wynik musi być sprawdzony niezależnym walidatorem.

Optymalizacja nie może automatycznie zwęzić mebla tylko dlatego, że oszczędza to arkusz. Taka zmiana jest osobnym wariantem do wyboru przez użytkownika. Nie obiecywać stałego procentu odpadu niezależnie od danych.

## 9. Dokumentacja i maszyny

Należy wdrażać oddzielnie: dokumentację PDF, zestawienia CSV/XLSX, geometrię DXF, optymalizację arkuszy oraz wyjścia dla konkretnej maszyny.

DXF może przekazać kontur i oznaczenia operacji, lecz samo jego istnienie nie określa narzędzia, posuwu, mocowania ani kolejności obróbki. Eksporter powinien mieć uzgodnione jednostki, strony, punkt odniesienia i znaczenie warstw. Należy sprawdzić go w docelowym programie odbiorczym.

Pakiet produkcyjny powinien zawierać projekt i rewizję, listę części, okucia, rysunki, instrukcje wymagane dla obsługiwanej konstrukcji, profil technologii oraz wykaz nieobsługiwanych operacji. Wszystkie pliki muszą powstać z tej samej niezmiennej rewizji.

## 10. Niezawodność aplikacji online

### Obliczenia i wydajność

Rekomenduję szybkie obliczenia podstawowe lokalnie, a ciężkie zadania w tle. Web Workers umożliwiają wykonywanie kodu poza głównym wątkiem interfejsu. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).

Każde zadanie powinno przenosić rewizję wejścia. Gdy użytkownik zmieni mebel, wynik starego zadania nie może nadpisać nowego stanu. Eksport należy wykonywać na zamrożonej rewizji; ekran ma pokazywać, jeśli obliczenia nie są jeszcze aktualne.

W Three.js potrzebne jest zarządzanie cyklem życia zasobów GPU. Dla wielu powtarzalnych elementów można rozważyć instancing, zachowując możliwość wskazania konkretnej części. [Zwalnianie zasobów](https://threejs.org/manual/pages/cleanup.html), [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html).

### Trwałość projektu

IndexedDB nadaje się do strukturalnych danych lokalnych, ale przechowywanie w przeglądarce podlega limitom i zasadom usuwania danych. [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [limity i trwałość](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).

Rekomendacja: lokalne odzyskiwanie + plik projektu + zapis serwerowy dla projektów przypisanych do konta. Status „zapisano na urządzeniu” powinien różnić się od „zsynchronizowano”. Konflikt dwóch kart albo dwóch urządzeń wymaga jawnego rozwiązania, np. kopii konfliktowej.

### Dostęp i walidacja

Projekty muszą mieć sprawdzanego właściciela po stronie serwera. Link do podglądu nie powinien domyślnie umożliwiać edycji. Import projektu wymaga walidacji struktury, rozmiaru i wersji. Wyrażenia parametryczne, jeśli będą dostępne, powinny korzystać z ograniczonego języka zamiast dowolnego kodu.

Walidacja serwerowa przed publikacją pakietu produkcyjnego powinna korzystać z tej samej wersji reguł co klient. Nie implementować drugi raz tych samych wzorów w inny sposób.

## 11. Strategia testów

Potrzebna jest niezależna dokumentacja referencyjna zatwierdzona przez osobę znającą technologię zakładu. Test, który oblicza oczekiwaną wartość tą samą funkcją co aplikacja, nie wykryje błędu jej wzoru.

| Scenariusz | Co ma potwierdzić |
|---|---|
| Korpus 800 mm, boki 18 → 19 mm, dno między bokami | W ustalonych założeniach szerokość dna 764 → 762 mm. |
| Zmiana konstrukcji: dno między bokami → pod bokami | Zmiana zależności, a nie tylko pozycji w widoku. |
| Odbicie lewej i prawej strony | Poprawne strony, krawędzie i wiercenia. |
| Dwie identyczne płyty z innym wierceniem | Oddzielne pozycje produkcyjne. |
| Zwężenie korpusu z zablokowaną sekcją | Czytelny konflikt zamiast cichego przeskalowania. |
| Materiał z kierunkiem dekoru | Dozwolone orientacje w rozkroju i w eksporcie. |
| Zmiana profilu oklejania | Jednokrotne, jawne przeliczenie wymiarów do cięcia. |
| Nieznane okucie lub brak jego danych | Brak udawanego potwierdzenia poprawności. |
| Szybkie kolejne zmiany podczas obliczeń | Stary wynik nie zastępuje nowego. |
| Zapis, zamknięcie, import, migracja | Odtworzenie intencji i poprawna obsługa wersji. |
| Eksport i ponowny odczyt DXF/CSV | Zgodne identyfikatory, jednostki, liczności i wymiary. |
| Niewystarczająca liczba arkuszy | Widoczna lista części nierozmieszczonych. |
| Ukrycie frontów i widok rozstrzelony | Brak zmiany zestawień produkcyjnych. |
| Cudze ID projektu | Brak dostępu do odczytu, zapisu i eksportu. |

## 12. Kolejność realizacji i warunki przejścia

| Etap | Wynik | Warunek ukończenia |
|---|---|---|
| 0. Rozpoznanie obecnego produktu | Mapa funkcji, danych, braków i decyzji technologicznych. | Znane miejsce przechowywania prawdy o projekcie i zakres pierwszego profilu. |
| 1. Jeden pełny przykład | Korpus → części → 2D/3D → zapis → zestawienia i rysunki. | Zgodność z niezależnym przykładem warsztatowym. |
| 2. Podziały i rodziny | Regał, komoda, szafa, biurko; wspólny mechanizm zależności. | Testy zmian konstrukcji, blokad wymiarów i odtwarzania projektu. |
| 3. Okucia i obróbka | Ograniczony, udokumentowany katalog. | Zgodne otwory, strony, dobór i dokumentacja w określonym zakresie. |
| 4. Projekty online | Wiele mebli, historia, synchronizacja i udostępnianie. | Testy konfliktów zapisu, migracji i uprawnień. |
| 5. Integracja zakładu | Zatwierdzony eksport i profil rozkroju. | Odczyt w docelowym systemie oraz sprawdzony przykład wykonania. |
| 6. Rozszerzenia | Kolejne technologie i ewentualnie CNC. | Osobne kryteria odbioru dla nowej technologii. |

Nie podaję wiarygodnego terminu ani kosztu bez kodu, składu zespołu i uzgodnienia technologii. Czynniki najmocniej wpływające na zakres to liczba rodzin konstrukcji, swoboda edycji, zakres okuć i obróbki, formaty odbiorców, współpraca online oraz liczba maszyn.

## 13. Co zmienić w dotychczasowych wytycznych

Wersja 0.2 powinna uzupełnić wcześniejsze zasady o: formalny model części, lokalne współrzędne, intencję i wynik obliczeń, profile zakładów, pochodzenie reguł, wersjonowanie katalogów, niezmienne rewizje eksportu, kontrolę nieaktualnych wyników, niezależną walidację rozkroju oraz konkretne testy warsztatowe.

Najbliższe potrzebne dane to obecne repozytorium, wzorcowy mebel z dokumentacją, lista stosowanych materiałów i okuć oraz wymagany format przyjęcia zlecenia przez zakład. Ich brak nie blokuje budowy struktury programu, ale blokuje uczciwe oznaczenie dokumentacji jako zweryfikowanej do produkcji.
