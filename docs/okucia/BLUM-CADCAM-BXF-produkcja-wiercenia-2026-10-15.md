# Blum CAD/CAM i BXF — źródło rysunku produkcyjnego a gotowość części

**Sprawdzenie:** 15.10.2026, baza `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3`. Kontynuuje research wierceń 175H3100/65.5070, ale opisuje źródło produkcyjne wyższego poziomu. Nie pobrano plików E-Services ani nie zatwierdzono żadnego programu CNC.

## Fakty potwierdzone u producenta

Blum opisuje CAD/CAM Data Service jako centralny dostęp do danych CAD pojedynczego produktu lub konfiguracji, sytuacji montażowych 2D, rysunków produkcyjnych 2D i pakietów. Polski opis mówi, że rysunki produkcyjne służą do znalezienia prawidłowych pozycji wiercenia na drewnianych częściach.

Katalog Blum 2027/2028 precyzuje dla BXF (Blum eXchange Format): plik zawiera dane okucia i informację produkcyjną dla drewnianych elementów, na przykład wymiary cięcia i pozycje wierceń. W tym samym opisie producent zastrzega, że wybieralne dane CAM zależą od poszczególnych produktów, dlatego położenie na drewnianych częściach nadal trzeba prawidłowo ustalić ręcznie. Zatem BXF/CAM może być silnym źródłem wejściowym, ale nie zwalnia z przypisania do poprawnego produktu, części, orientacji i lokalnej bazy.

Źródła: [Blum PL — Serwis danych CAD/CAM](https://www.blum.com/pl/pl/services/industrial-production/cad-cam-dataservice/) oraz [Blum, katalog i podręcznik 2027/2028, drukowana s. 626](https://publications.blum.com/2026/catalogue/en/626/). Producent informuje też, że dla nierozstrzygniętych zastosowań można poprosić o rysunek rozwiązania specjalnego; konkretna dostępność dla wskazanego SKU wymaga kontaktu/zapytania.

### Potwierdzona ścieżka uzyskania danych — 15.10.2026

Przegląd oficjalnego FAQ Blum uściśla wcześniejszy, niezweryfikowany krok „sprawdzić E-Services”. Gość może korzystać tylko z podstawowego zakresu Product Configurator; pełen zakres wymaga rejestracji osobistego konta klienta. Jeśli potrzebna aplikacja E-Service nie pojawia się po zalogowaniu, FAQ każe skontaktować się z opiekunem Blum w celu jej odblokowania. Dla danych CAD/CAM FAQ wskazuje Product Configurator oraz Product Database; w Product Configurator wymienia pakiet całego okucia 3D, produkt 3D i sytuację instalacji 2D, a wyniki planowania DYNAPLAN można eksportować interfejsem CAD/CAM. BXF jest zastrzeżonym formatem XML z informacjami o okuciu, montażu, wzorach/pozycjach wierceń; docelowy CAD/CAM potrzebuje interfejsu BXF.

Oficjalny katalog Blum 2024/2025, drukowana s. 612, odrębnie wymienia w CAD/CAM Data Service pakiety CAD/CAM, model produktu, kombinację, sytuację montażową 2D, rysunki produkcyjne 2D, dane CAM do CNC, BXF oraz indywidualne zapytanie do producenta w nietypowej lub nierozstrzygniętej sytuacji. Jest to lista typów materiałów w usłudze, nie gwarancja, że każdy typ będzie dostępny dla 175H3100 lub wybranego zestawu. Nowszy katalog 2027/2028 zachowuje zastrzeżenie, że wybór CAM zależy od produktu i trzeba ręcznie określić prawidłowe położenie na elementach drewnianych.

Źródła pierwotne: [Blum UK — FAQ, E-Services i CAD/CAM (sekcje „What are Blum’s E-SERVICES?”, „Where can I find CAD and CAM manufacturing data?” i „What is the BXF file format?”)](https://www.blum.com/gb/en/services/faq/); [Blum, katalog i podręcznik 2024/2025, drukowana s. 612](https://publications.blum.com/2024/catalogue/en/612/); [Blum, katalog i podręcznik 2027/2028, drukowana s. 627](https://publications.blum.com/2026/catalogue/en/627/).

## Czego źródło jeszcze nie rozstrzyga

### Rozróżnienie wpisu katalogowego od szablonu wierceń dla 175H3100

Kontrola katalogu w samym widoku stron 144–145 Blum 2027/2028 rozstrzygnęła, że strona drukowana 144 zawiera również zwymiarowany rysunek „Horizontal cam mounting plate – 20/32” przypisany w tabeli zamówień do 175H3100. Wcześniejsze sprawdzenie tekstu strony AVENTOS (wykaz zaleceń dla systemu podnośnika) nie wystarczało do tego ustalenia. Na rysunku i tabeli dla 175H3100 widać: mocowanie wkrętami do płyty wiórowej Ø3,5 mm, zalecaną długość wkręta 17 mm, regulację krzywką ±2 mm, materiał stal, dystans 0 mm i wysokość 8,5 mm. Obok podano wariant 175H3130 jako dystans 3 mm / wysokość 11,5 mm. Rysunek planowania oznacza wymiary 58,3 mm i 18,7 mm, układ „20/32”, wymiar min. 11,5 mm, bazę/wysokość `H` oraz dodatkowy wkręt dla zawiasu szerokokątnego lub z zerowym wystawaniem.

To już jest wymiarowany, produktowo przypisany punkt startowy do odwzorowania płytki, a nie tylko informacja o jej zastosowaniu. Nie odczytano jednak z obrazu pełnej semantyki każdego znacznika/wymiaru do układu współrzędnych projektu ani tolerancji, średnicy i głębokości ewentualnego nawiertu prowadzącego w płycie. Katalog podaje średnicę i długość wkręta, nie zaś narzędziową specyfikację pilota CNC. Dlatego profil danych może być statusowo „źródło producenta — rysunek wymiarowany; czeka na transkrypcję/fixture”, ale nie powinien być oznaczony jako zweryfikowany proces CNC przed sprawdzeniem odwzorowania i próbnym montażem.

Źródła: [Blum, katalog 2027/2028 — płyty montażowe, drukowana s. 144](https://publications.blum.com/2026/catalogue/en/144/); [Blum, katalog 2027/2028 — AVENTOS HK-XS, drukowana s. 54](https://publications.blum.com/2026/catalogue/en/54/). Katalog potwierdza też 175H3100 jako rekomendowaną przykręcaną płytkę o dystansie 0 mm w aplikacji SERVO-DRIVE/AVENTOS. Sąsiadujące informacje o minimalnej głębokości korpusu i „special drilling position” opisują zastosowanie systemu podnośnika HK-XS, a nie wzór wierceń 175H3100. Wynik oficjalnego PDF montażowego AVENTOS HF zawiera płytkę w wykazie części, lecz jego rysunki wierceń dotyczą montażu podnośnika/frontu; nie zastępują powyższego rysunku płyty. Nie należy przenosić wymiarów systemu HK-XS/HF na szablon 175H3100.

**Wniosek:** istnieje oficjalny, wymiarowany rysunek montażowy 175H3100, więc nie trzeba wnioskować o jego układzie wyłącznie z numeru SKU lub rodziny produktu. Można go przepisać do odrębnego profilu źródłowego po kontroli technicznej rysunku. Do zatwierdzenia CAM nadal potrzebne są jednoznaczna baza/orientacja w lokalnym modelu części, rozstrzygnięcie operacji prowadzącej dla użytej płyty i wkręta oraz sprawdzenie wzorca na próbce; plik CAD/CAM konkretnego SKU pozostaje preferowanym niezależnym potwierdzeniem.

- W niniejszym przeglądzie nie zalogowano się do usługi i nie sprawdzono, czy dla konkretnego SKU 175H3100, pary zawias–prowadnik i wybranej konfiguracji dostępny jest rysunek 2D, BXF lub plik CAM. Dostępność materiału, uprawnienia i zakres konfiguratora pozostają **niezweryfikowane**.
- Potwierdzono publiczną procedurę wejścia do pełnego E-Service, lecz nie status konta warsztatu, rynku PL, przypisanych usług ani uprawnień użytkownika. Nie wysyłano zapytania do Blum w imieniu warsztatu.
- Katalog p.144 jest konkretnym źródłem wymiarowanego rysunku 175H3100 i pokazuje 20/32 oraz dodatkowy wkręt; do danych CAM nadal trzeba przepisać jednoznaczne pozycje względem bazy/strony elementu oraz rozstrzygnąć rodzaj/średnicę/głębokość operacji w drewnie. Nie przypisywać widocznych otworów/punktów innej płyty (np. 175H4100 albo 177H3100E) do SKU 175H3100.
- Ogólny opis BXF nie dowodzi, że dla 175H3100 i wybranej kombinacji dostępny jest plik CAM; nie zastępuje też kontroli rewizji konkretnego pliku.
- Nawet poprawne współrzędne z producenta muszą zostać ustawione na konkretnym detalu: lokalny początek, strona, obrót/odbicie, grubość i wariant wykonania. Wymóg ręcznego pozycjonowania części wynika wprost z zastrzeżenia katalogowego; dokładny sposób ujęcia układu współrzędnych w aplikacji jest rekomendacją projektową.
- Model 3D okucia służy do geometrii/wizualizacji, nie zastępuje zwymiarowanego rysunku produkcyjnego i walidacji technologicznej.

## Rekomendacja dla Claude

**P0 dla zwolnienia profilu okuć:** dodawać dane z CAD/CAM Blum wyłącznie jako wersjonowane źródło powiązane z konkretnym produktem/konfiguracją oraz materiałem źródłowym. Rozdzielić geometrię komponentu (3D), rysunek sytuacji montażowej, rysunek wierceń części drewnianej, BXF i CAM/postprocesor; nie traktować tych artefaktów jako zamiennych. Jeśli źródło podaje otwory, ale nie określa ich kompletnej bazy lub orientacji na części, stan produkcyjny ma pozostać niezatwierdzony.

**Zależności:** konto klienta Blum z właściwym E-Service odblokowanym przez opiekuna, dokładny SKU i dobrana kombinacja okuć, pozyskany przez uprawnionego użytkownika rysunek/BXF/CAM oraz numer rewizji, definicja części i datumu w modelu, test translacji/obrotu/strony, zatwierdzony postprocesor i próba kontrolna na właściwej maszynie.

**Następny krok dostępu (P1, bez automatycznego scrapowania):** upoważniony użytkownik warsztatu sprawdza dostępność własnego konta Blum; jeśli CAD/CAM Data Service lub potrzebny konfigurator jest niewidoczny, prosi swojego opiekuna Blum o jego włączenie. Następnie szuka dokładnej kombinacji/produktu i zapisuje listę udostępnionych artefaktów, identyfikator konfiguracji i rewizję. Gdy rozwiązania brakuje albo dane są niejednoznaczne, składa indywidualne zapytanie o zwymiarowany rysunek dla konkretnego produktu/zastosowania. Samo konto ani obecność ogólnej rodziny produktu nie jest dowodem, że plik dla 175H3100 istnieje.

**Mierzalne kryteria odbioru:**

1. Dla każdej operacji otworu można wskazać producenta, identyfikator produktu/konfiguracji, plik źródłowy i rewizję/skrót, stronę i bazę części, współrzędne, średnicę, głębokość i typ operacji. Brak któregokolwiek wymagania blokuje `production_approved`.
2. Fixture źródłowy 175H3100 jest osobny od 175H3130, 175H4100 i 177H3100E oraz od krzyżowej płytki używanej w przykładzie szablonu 65.5070. Źródłem kandydującym jest wyłącznie wymiarowany rysunek przypisany do 175H3100 (katalog p.144) albo dokładniejszy plik CAD/CAM dla tego SKU; status produkcyjny wymaga sprawdzenia, że fixture poprawnie przenosi bazę/orientację i operację w materiale.
3. Test transformacji części sprawdza lewą/prawą stronę, odwrócenie i dwa położenia na detalu: operacje po transformacji zachowują tę samą fizyczną lokalizację względem oznaczonej bazy albo profilem zarządza jawna, odrębna konfiguracja. Nie wolno cicho lustrzanie odbić ścieżki.
4. Wydany PDF/CSV/CAM zachowuje odniesienie do źródła, SKU i rewizji. Współrzędne w modelu i na dokumentacji są identyczne po odświeżeniu katalogu; zmiana źródła wyświetla różnicę i wymaga ponownego zatwierdzenia.
5. Po wygenerowaniu programu wykonuje się symulację i próbny detal zgodnie z maszyną/postprocesorem warsztatu; wynik nie wynika automatycznie z samego importu danych producenta.

## Priorytet, pewność i ograniczenia

- **P0:** kompletność i pochodzenie wierceń przed wydaniem produkcyjnym; dozwolone działanie teraz to zdobycie właściwego źródła, nie dopisanie geometrii z domysłu.
- **Wysoka pewność:** opis zakresu CAD/CAM i BXF, przykładowe dane produkcyjne oraz potrzeba poprawnego ręcznego ustawienia części — oficjalny Blum PL i katalog 2027/2028.
- **Niezweryfikowane:** dostęp do usługi i konkretne pliki CAD/CAM dla SKU 175H3100; pełna transkrypcja etykiet/pozycji rysunku p.144 do osi i bazy lokalnej części; parametry nawiertu pilota w drewnie; kompatybilność pliku z maszyną i postprocesorem używanym w warsztacie.
- **Zweryfikowane 15.10.2026:** Blum publikuje ścieżkę konta/odblokowania E-Services oraz katalog usług CAD/CAM i indywidualnego zapytania; to potwierdza, jak upoważniony użytkownik może szukać danych, nie ich dostępność dla 175H3100.
- Nie użyto danych klientów, nie zmieniono aplikacji, cen ani umów. Nie wykonano testów aplikacji, bo zmiana obejmuje wyłącznie dokumentację.
