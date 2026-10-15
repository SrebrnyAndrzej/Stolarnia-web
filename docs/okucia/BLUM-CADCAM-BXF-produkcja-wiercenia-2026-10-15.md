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

- W niniejszym przeglądzie nie zalogowano się do usługi i nie sprawdzono, czy dla konkretnego SKU 175H3100, pary zawias–prowadnik i wybranej konfiguracji dostępny jest rysunek 2D, BXF lub plik CAM. Dostępność materiału, uprawnienia i zakres konfiguratora pozostają **niezweryfikowane**.
- Potwierdzono publiczną procedurę wejścia do pełnego E-Service, lecz nie status konta warsztatu, rynku PL, przypisanych usług ani uprawnień użytkownika. Nie wysyłano zapytania do Blum w imieniu warsztatu.
- Ogólny opis BXF nie potwierdza konkretnej geometrii otworów dla 175H3100 ani otworu dodatkowego. Nie wolno przenosić wierceń z innego SKU lub zestawienia na tę płytę.
- Nawet poprawne współrzędne z producenta muszą zostać ustawione na konkretnym detalu: lokalny początek, strona, obrót/odbicie, grubość i wariant wykonania. Wymóg ręcznego pozycjonowania części wynika wprost z zastrzeżenia katalogowego; dokładny sposób ujęcia układu współrzędnych w aplikacji jest rekomendacją projektową.
- Model 3D okucia służy do geometrii/wizualizacji, nie zastępuje zwymiarowanego rysunku produkcyjnego i walidacji technologicznej.

## Rekomendacja dla Claude

**P0 dla zwolnienia profilu okuć:** dodawać dane z CAD/CAM Blum wyłącznie jako wersjonowane źródło powiązane z konkretnym produktem/konfiguracją oraz materiałem źródłowym. Rozdzielić geometrię komponentu (3D), rysunek sytuacji montażowej, rysunek wierceń części drewnianej, BXF i CAM/postprocesor; nie traktować tych artefaktów jako zamiennych. Jeśli źródło podaje otwory, ale nie określa ich kompletnej bazy lub orientacji na części, stan produkcyjny ma pozostać niezatwierdzony.

**Zależności:** konto klienta Blum z właściwym E-Service odblokowanym przez opiekuna, dokładny SKU i dobrana kombinacja okuć, pozyskany przez uprawnionego użytkownika rysunek/BXF/CAM oraz numer rewizji, definicja części i datumu w modelu, test translacji/obrotu/strony, zatwierdzony postprocesor i próba kontrolna na właściwej maszynie.

**Następny krok dostępu (P1, bez automatycznego scrapowania):** upoważniony użytkownik warsztatu sprawdza dostępność własnego konta Blum; jeśli CAD/CAM Data Service lub potrzebny konfigurator jest niewidoczny, prosi swojego opiekuna Blum o jego włączenie. Następnie szuka dokładnej kombinacji/produktu i zapisuje listę udostępnionych artefaktów, identyfikator konfiguracji i rewizję. Gdy rozwiązania brakuje albo dane są niejednoznaczne, składa indywidualne zapytanie o zwymiarowany rysunek dla konkretnego produktu/zastosowania. Samo konto ani obecność ogólnej rodziny produktu nie jest dowodem, że plik dla 175H3100 istnieje.

**Mierzalne kryteria odbioru:**

1. Dla każdej operacji otworu można wskazać producenta, identyfikator produktu/konfiguracji, plik źródłowy i rewizję/skrót, stronę i bazę części, współrzędne, średnicę, głębokość i typ operacji. Brak któregokolwiek wymagania blokuje `production_approved`.
2. Fixture źródłowy 175H3100 jest osobny od 175H3130 i od krzyżowej płytki używanej w przykładzie szablonu 65.5070; fixture dla 175H3100 nie przechodzi, jeśli jego dane są tylko wywnioskowane z opisu rodziny, narzędzia lub 20/32.
3. Test transformacji części sprawdza lewą/prawą stronę, odwrócenie i dwa położenia na detalu: operacje po transformacji zachowują tę samą fizyczną lokalizację względem oznaczonej bazy albo profilem zarządza jawna, odrębna konfiguracja. Nie wolno cicho lustrzanie odbić ścieżki.
4. Wydany PDF/CSV/CAM zachowuje odniesienie do źródła, SKU i rewizji. Współrzędne w modelu i na dokumentacji są identyczne po odświeżeniu katalogu; zmiana źródła wyświetla różnicę i wymaga ponownego zatwierdzenia.
5. Po wygenerowaniu programu wykonuje się symulację i próbny detal zgodnie z maszyną/postprocesorem warsztatu; wynik nie wynika automatycznie z samego importu danych producenta.

## Priorytet, pewność i ograniczenia

- **P0:** kompletność i pochodzenie wierceń przed wydaniem produkcyjnym; dozwolone działanie teraz to zdobycie właściwego źródła, nie dopisanie geometrii z domysłu.
- **Wysoka pewność:** opis zakresu CAD/CAM i BXF, przykładowe dane produkcyjne oraz potrzeba poprawnego ręcznego ustawienia części — oficjalny Blum PL i katalog 2027/2028.
- **Niezweryfikowane:** dostęp do usługi i konkretne pliki dla SKU 175H3100, wszystkie współrzędne jego mocowań, dołączone CAM oraz kompatybilność/odczyt przez maszynę i postprocesor używany w warsztacie.
- **Zweryfikowane 15.10.2026:** Blum publikuje ścieżkę konta/odblokowania E-Services oraz katalog usług CAD/CAM i indywidualnego zapytania; to potwierdza, jak upoważniony użytkownik może szukać danych, nie ich dostępność dla 175H3100.
- Nie użyto danych klientów, nie zmieniono aplikacji, cen ani umów. Nie wykonano testów aplikacji, bo zmiana obejmuje wyłącznie dokumentację.
