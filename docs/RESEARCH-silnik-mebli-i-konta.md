# Silnik mebli na wymiar i konta stolarni

Research i propozycja wdrożenia, 25.09.2026. To plan, nie opis ukończonych funkcji.

## Rekomendacja

Rozbudować własny silnik parametryczny w TypeScript, zachowując Three.js do wizualizacji. Jeden model konstrukcyjny ma generować części, połączenia, operacje, zestaw okuć, dokumentację i scenę 3D. Nie przechowywać brył sceny jako jedynego źródła dokumentacji produkcyjnej. Pełny CAD bryłowy można dołączyć później do nietypowych kształtów; nie jest warunkiem budowania szafek płytowych.

## Co już mamy

Przegląd kodu lokalnego na bazie a494b87:

- `src/core/builder.ts`: parametryczne budowanie modułów, części i okuć; istnieje baza do rozbudowy.
- `src/core/types.ts`: moduły z gabarytami i konfiguracją, ale bez ogólnego drzewa dowolnie zagnieżdżonych przegród.
- `src/core/technologia.ts`: części z lokalnymi układami i operacjami, diagnostyka braków danych.
- `web/src/views/Widok3D.tsx`: geometria korzysta z elementów zbudowanego modułu. Zachować ten kierunek zależności.
- `docs/okucia/reguly-szuflad.json`: sześć profili z `production_approved=false`. Katalog produktu lub zdjęcie nie zatwierdzają wierceń.
- `src/store/store.ts`: wspólny dokument JSON w Supabase, globalne wersjonowanie. To ogranicza niezależną pracę kilku osób i kontrolę dostępu do projektów.
- W sprawdzonym serwerze nie ma uwierzytelniania użytkowników aplikacji. Nie jest to ustalenie dotyczące zewnętrznych zabezpieczeń wdrożenia.

## Inspiracje i granice ich wykorzystania

| Źródło | Co warto przenieść do projektu | Ograniczenie |
|---|---|---|
| [Blum — konfigurator korpusów](https://www.blum.com/pl/pl/services/planning-construction-product-selection/cabinet-configurator/) | Połączenie konstrukcji, doboru okuć i danych produkcyjnych; BXF obejmuje też formatki | Rozwiązanie producenta nie zastępuje wielomarkowego silnika; nie potwierdzono publicznego API do integracji |
| [SWOOD Design](https://www.solidworks.com/partner-product/swood-design) | Biblioteka parametrycznych konstrukcji i podejście wyspecjalizowane dla meblarstwa | Produkt oparty na SolidWorks, nie gotowy silnik naszej aplikacji webowej |
| [OpenCutList](https://github.com/lairdubois/lairdubois-opencutlist-sketchup-extension) | Lista części, rozkrój, etykiety i koszty jako wynik projektu | Rozszerzenie SketchUp, GPL-3.0; inspiracja procesem, nie bezpośrednia zależność frontendowa |
| [JSketcher](https://github.com/xibyte/jsketcher) | Więzy geometryczne, parametry i historia konstrukcji | Własna [licencja](https://github.com/xibyte/jsketcher/blob/main/LICENSE) wymaga osobnej oceny przed wykorzystaniem kodu |
| [replicad](https://replicad.xyz/docs/intro/) | Opcjonalne operacje CAD w przeglądarce przy bardziej złożonych częściach | Sprawdzić licencję konkretnej wersji i zależności przed wyborem; obecnie nie proponujemy włączenia |
| [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) | Wydajne pokazywanie wielu powtarzalnych elementów | Renderer nie rozwiązuje reguł stolarskich ani kompletności dokumentacji |

To wnioski projektowe z porównania dokumentacji, nie wynik testów wydajności tych produktów.

## Model mebla

Projekt zawiera zespoły mebli. Mebel zawiera gabaryty, materiały, sposób połączeń, plecy, cokół i drzewo przestrzeni wewnętrznych. Przestrzeń można podzielić pionowo lub poziomo, dodając rzeczywistą przegrodę albo tylko umowną strefę wyposażenia. Podział frontów musi być niezależny od wnętrza: jeden front może zasłaniać kilka szuflad wewnętrznych.

Każdy wymiar jest stały, proporcjonalny albo wynika z pozostałego miejsca. Przy podziale trzeba odjąć grubości przegród i wymagane luzy. Sprzeczne wymiary mają zwrócić zrozumiały błąd, nie ujemną formatkę lub ciche zmniejszenie elementu. Zależności tworzą graf bez cykli; formuły pochodzą z kontrolowanego zestawu operacji, nie z wykonywanego dowolnego kodu katalogowego.

Jednostką obliczeń jest milimetr. Każda część ma trwałe ID, lokalne osie, transformację w zespole, stronę bazową, materiał, kierunek usłojenia i opis każdej krawędzi. Otwory mają współrzędne lokalne, średnicę, głębokość, stronę obróbki, źródło i status weryfikacji. Odbicie prawego elementu nie może przypadkowo odwrócić strony wiercenia. Wymiary gotowe i wymiary do cięcia muszą być rozdzielone według rzeczywistej technologii obrzeża.

## Dobór okuć i szuflad

Oddzielić produkt handlowy od profilu technologicznego. Produkt ma producenta, SKU, wariant i zdjęcie. Profil ma wersję dokumentacji, grubości płyt, wzory dna i pleców, wymagane przestrzenie, mocowania, kompletny zestaw komponentów i operacje. Wariant lewy/prawy, wysokość boku, długość, kolor i sposób otwierania nie mogą być domyślane z fotografii.

Algorytm: wyznacz rzeczywiste światło komory → odfiltruj niezgodne systemy → sprawdź głębokość montażową i ruch → zaproponuj warianty → oblicz części i wiercenia z konkretnego profilu. Szerokość zewnętrzna 800 mm przy dwóch bokach po 18 mm daje 764 mm światła tylko wtedy, gdy w tej komorze nie ma dodatkowych przegród. Głębokość zewnętrzna 600 mm sama nie określa długości prowadnicy. Dna i plecy Amix, GTV i Blum liczymy osobno dla wskazanej rodziny, grubości i rewizji dokumentacji.

Po zmianie wymiaru aplikacja pokazuje, które okucie przestało pasować. Nie podmienia go bez wiedzy użytkownika. Kontrola obejmuje także ruch frontów, zawiasów, szuflad i systemów narożnych oraz kolizje z uchwytami i sąsiednimi meblami. Nie wystarczy sprawdzenie zamkniętych brył.

## Przeliczanie, 3D i produkcja

Przepływ: polecenie użytkownika → walidacja projektu → obliczenie przestrzeni → części i połączenia → okucia i operacje → diagnostyka → 3D, rysunki, listy i kosztorys.

Przesunięcie w 3D zmienia parametr konstrukcji, nie samą pozycję siatki. Cofanie działa na poleceniach takich jak dodanie przegrody. Podgląd przelicza się w Web Workerze; ten sam silnik na serwerze weryfikuje zapis i wydanie produkcyjne. Wyniki starszych obliczeń nie mogą nadpisywać nowszych. Buforować tylko wyniki z pełnym kluczem wersji danych i silnika.

Na podglądzie wystarczą proste bryły i oznaczenia wierceń. Kosztowne odejmowanie każdego otworu od geometrii nie jest potrzebne do poprawnej dokumentacji. Tekstury wymagają skali rzeczywistej i kierunku usłojenia; miniatura dekoru nie stanowi automatycznie tekstury produkcyjnie wiernej.

Wydanie produkcyjne jest niezmienną migawką: wersja projektu, silnika, szablonów, materiałów i profili okuć oraz suma kontrolna wyników. Zawiera zestawienie części, okleinowanie, okucia, identyfikatory części, rysunek każdej części z bazami i wszystkimi operacjami oraz instrukcję złożenia. Eksport CNC wymaga osobnego postprocesora i sprawdzenia na konkretnej maszynie. PDF nie jest programem CNC.

Brak zatwierdzonego profilu pozwala na projekt koncepcyjny z wyraźnym oznaczeniem, ale blokuje wydanie do produkcji. Zmiana katalogu nie może zmieniać zatwierdzonej dokumentacji, zapisanej umowy ani ceny zaakceptowanej przez klienta.

## Następny etap: właściciel i pracownicy

Zastosować Supabase Auth z zaproszeniami. Role początkowe: właściciel i pracownik; uprawnienia do cen, zatwierdzania produkcji i edycji projektu przechowywać osobno, aby można je było delegować.

| Czynność | Właściciel | Pracownik domyślnie |
|---|---|---|
| Ustawienia firmy, zaproszenia, role | Tak | Nie |
| Projekty | Wszystkie w stolarni | Przydzielone |
| Ceny, marże i umowy | Tak | Po nadaniu uprawnienia |
| Dokumentacja zatwierdzona, zadania, notatki | Tak | W przydzielonych projektach |
| Wydanie do produkcji | Tak | Po nadaniu uprawnienia |

Rozdzielić wspólny JSON na `workshops`, `memberships`, `projects`, `project_revisions`, `production_releases` i dziennik zdarzeń. Konstrukcja może nadal być JSONB w rewizji projektu. Powiązania muszą wymuszać zgodność stolarni; ID projektu od klienta nie jest dowodem uprawnienia. Każdy zapis sprawdza oczekiwaną rewizję, a konflikt nie może nadpisywać cudzej pracy. Obecność kilku osób w projekcie można pokazać wcześniej niż wprowadzić pełną edycję jednoczesną.

API, MCP i pobieranie PDF muszą sprawdzać tę samą tożsamość i zakres dostępu. Polityki RLS stanowią drugą warstwę. Klucz serwerowy z uprawnieniami `service_role` omija RLS, więc nie zastąpi walidacji użytkownika. Zwykłe operacje preferencyjnie wykonywać w kontekście JWT użytkownika; klient administracyjny tylko do wyraźnie wydzielonych operacji. [Dokumentacja Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

Role wynikają z członkostwa, nie edytowalnego profilu użytkownika. Zawieszenie pracownika musi odcinać dostęp także przy istniejącej sesji. Nie usuwać autora ze starych rewizji. Chronić ostatnie konto właściciela. Pliki prywatne wydawać po sprawdzeniu uprawnień, ewentualnie krótkotrwałym podpisanym adresem. [Supabase RBAC](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac), [zapraszanie użytkownika](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail).

## Kolejność wdrożenia i kryteria odbioru

1. Ustalić model drzewa, identyfikatory, lokalne osie i format profilu okuć. Przygotować adapter obecnych modułów bez automatycznej zmiany istniejących realizacji.
2. Zbudować jeden pełny przypadek: mebel z nierównymi komorami, półkami, drzwiami i szufladami. Zmiana wymiaru aktualizuje 3D i wszystkie części z tych samych danych.
3. Zatwierdzić jeden kompletny system szuflad na podstawie dokumentacji i próbnego montażu. Dopiero wtedy oznaczyć profil jako produkcyjny; następnie rozszerzać rodziny.
4. Wydać pełną dokumentację tego przypadku. Sprawdzić strony wierceń, lustrzane części, brak kolizji, kompletność okuć i zgodność po fizycznym montażu.
5. Wprowadzić strukturę projektów i rewizji w bazie, migrację z kopią bezpieczeństwa i porównaniem liczby projektów, umów oraz kwot.
6. Dodać konta, role i zaproszenia; przed udostępnieniem pracownikom sprawdzić odmowę dostępu do cudzych projektów, PDF, MCP i funkcji właściciela.

Testy silnika obejmują graniczne wymiary, grubości płyt, zmianę kierunku usłojenia, odbicie mebla, brak danych i zmianę wariantu okuć. Testy regresji zachowują wyniki dotychczasowych konstrukcji i zapisane ceny. Testy współpracy obejmują konflikt dwóch zapisów i cofnięcie uprawnienia podczas sesji. Warunkiem produkcyjnego odbioru jest rzeczywisty próbny montaż, nie tylko przejście testów kodu.

## Wytyczne dla Claude i Codex

Nie zastępować istniejącego buildera od razu; rozwijać przez adapter i kolejne obsługiwane konstrukcje. Nie wpisywać ogólnych luzów i wierceń dla całej marki. Nie utożsamiać kompletnego katalogu SKU z kompletną technologią. Nie generować dokumentacji produkcyjnej z pozycji meshów. Nie nadpisywać cen, umów i wydań historycznych. Nie wdrażać samego ekranu logowania bez kontroli API i MCP. Każdy etap ma osobno opisane: zakres działający, nieobsługiwane warianty, źródła i dowód weryfikacji.
