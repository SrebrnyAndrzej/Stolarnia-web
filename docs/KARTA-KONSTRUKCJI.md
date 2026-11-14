# Karta konstrukcji — etap materiałowy

Wdrożenie z 2 listopada 2026. Wspólny kreator właściciela i pracownika. Automatyczne zamawianie Mussi pozostaje wyłączone zgodnie z decyzją użytkownika.

## Dane części

Każda płyta ma opcjonalną specyfikację: opis materiału, dekor/powierzchnia, lokalna płaszczyzna, kierunek usłojenia i cztery decyzje o obrzeżach. Starsze modele bez specyfikacji otwierają się bez migracji; brak danych pozostaje widoczny. Materiał i dekor są opisem roboczym, nie indeksem hurtowni ani potwierdzeniem oferty.

- XY: U szerokość/X, V wysokość/Y, grubość = głębokość/Z.
- XZ: U szerokość/X, V głębokość/Z, grubość = wysokość/Y.
- YZ: U głębokość/Z, V wysokość/Y, grubość = szerokość/X.
- Wieniec dopasowany do obrysu: U wzdłuż górnego odcinka w kierunku rosnącego X, V w głąb/Z, grubość normalna = grubość modelu.

Płaszczyznę wybiera człowiek. U0/U1 to brzegi na początku/końcu U; V0/V1 to początek/koniec V. Schemat pokazuje oznaczenia, nie rozkrój. Usłojenie: nieokreślone, brak kierunku, U lub V. Każda krawędź: nieokreślona, bez obrzeża lub okleinowana; okleinowana ma opis i grubość 0,1–10 mm.

Zmiana płaszczyzny resetuje lokalne decyzje o usłojeniu i krawędziach, aby nie przypisać ich do innej strony. Można ją cofnąć. Dla wielokrawędziowego obrysu XY, np. pleców pod schodami, karta zgłasza potrzebę indywidualnego opisu technologicznego. Cztery etykiety nie udają pełnego opisu takiego wielokąta.

Wymiary geometrii nie są automatycznie pomniejszane o obrzeża. Naddatki i wymiary netto/brutto będą zależeć od profilu technologii. Grubość w karcie pochodzi z geometrii; ponad 100 mm sygnalizuje sprawdzenie płaszczyzny lub wymiaru.

## Stabilność

Przeliczenie korpusu zachowuje ID, własne nazwy i specyfikacje istniejących miejsc: bok lewy, prawy, dno, kolejne odcinki wieńca od lewej. Nowe odcinki mają nowe ID i nieokreśloną specyfikację; usunięte odcinki znikają z nowego szkicu. Cofnij odtwarza poprzedni model. Własne płyty zachowują jawne wymiary. Zastąpienie zestawu frontów pozostaje osobną operacją wymiany.

Zapis stosuje dotychczasową kontrolę wersji i CAS bazy, z aktorem z sesji. Dane materiałowe są dostępne dla całego aktywnego zespołu; nie dodają cen ani uprawnień zakupowych.

## Eksport konstrukcji

GET /api/v2/furniture/:id/construction?version=N wymaga aktywnego członka zespołu i zgodnej zapisanej wersji. Brak modelu daje 404, inna wersja 409. Interfejs blokuje eksport przed pierwszym zapisem i przy niezapisanych zmianach.

JSON: format pan-stolarz-construction-draft, schemaVersion 1, status draft, readyForProduction false, jednostka mm, ID i wersja biblioteki, czas zapisu, pełny model oraz części. Część zachowuje ID, rzeczywisty wielokąt przekroju frontowego XY i ekstruzję Z, grubość, specyfikację i braki. Nie zastępujemy skosu prostokątem obwiedni. Przekrój frontowy nie jest płaską formatką produkcyjną.

To migawka zapisanej wersji, nie zatwierdzone wydanie, CNC, lista zakupowa ani zlecenie rozkroju Mussi. Nawet kompletne dane materiałowe pozostawiają odbiór połączeń, baz obróbki, operacji, okuć i naddatków. Następny etap: adapter tych samych części do istniejącego silnika technologii i dokumentacji, z zachowaniem wielokątów i wersji.

## Sprawdzenie

Testy jednostkowe: grubość z geometrii, ID/opisy, schemat zapisu, braki, wielokąty eksportu, nieaktualna wersja i rola klienta, brak mutacji zapisanej migawki. Testy przeglądarkowe na atrapach API: właściciel i pracownik, zapis/otwarcie/eksport, zmiana wymiarów, reset lokalnej bazy i Cofnij, 390 px. Istniejące testy błędu zapisu i konfliktu zachowują formularz.
