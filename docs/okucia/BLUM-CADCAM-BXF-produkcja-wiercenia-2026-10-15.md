# Blum CAD/CAM i BXF — źródło rysunku produkcyjnego a gotowość części

**Sprawdzenie:** 15.10.2026, baza `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3`. Kontynuuje research wierceń 175H3100/65.5070, ale opisuje źródło produkcyjne wyższego poziomu. Nie pobrano plików E-Services ani nie zatwierdzono żadnego programu CNC.

## Fakty potwierdzone u producenta

Blum opisuje CAD/CAM Data Service jako centralny dostęp do danych CAD pojedynczego produktu lub konfiguracji, sytuacji montażowych 2D, rysunków produkcyjnych 2D i pakietów. Polski opis mówi, że rysunki produkcyjne służą do znalezienia prawidłowych pozycji wiercenia na drewnianych częściach.

Katalog Blum 2027/2028 precyzuje dla BXF (Blum eXchange Format): plik zawiera dane okucia i informację produkcyjną dla drewnianych elementów, na przykład wymiary cięcia i pozycje wierceń. W tym samym opisie producent zastrzega, że wybieralne dane CAM zależą od poszczególnych produktów, dlatego położenie na drewnianych częściach nadal trzeba prawidłowo ustalić ręcznie. Zatem BXF/CAM może być silnym źródłem wejściowym, ale nie zwalnia z przypisania do poprawnego produktu, części, orientacji i lokalnej bazy.

Źródła: [Blum PL — Serwis danych CAD/CAM](https://www.blum.com/pl/pl/services/industrial-production/cad-cam-dataservice/) oraz [Blum, katalog i podręcznik 2027/2028, drukowana s. 626](https://publications.blum.com/2026/catalogue/en/626/). Producent informuje też, że dla nierozstrzygniętych zastosowań można poprosić o rysunek rozwiązania specjalnego; konkretna dostępność dla wskazanego SKU wymaga kontaktu/zapytania.

## Czego źródło jeszcze nie rozstrzyga

- W niniejszym przeglądzie nie zalogowano się do usługi i nie sprawdzono, czy dla konkretnego SKU 175H3100, pary zawias–prowadnik i wybranej konfiguracji dostępny jest rysunek 2D, BXF lub plik CAM. Dostępność materiału, uprawnienia i zakres konfiguratora pozostają **niezweryfikowane**.
- Ogólny opis BXF nie potwierdza konkretnej geometrii otworów dla 175H3100 ani otworu dodatkowego. Nie wolno przenosić wierceń z innego SKU lub zestawienia na tę płytę.
- Nawet poprawne współrzędne z producenta muszą zostać ustawione na konkretnym detalu: lokalny początek, strona, obrót/odbicie, grubość i wariant wykonania. Wymóg ręcznego pozycjonowania części wynika wprost z zastrzeżenia katalogowego; dokładny sposób ujęcia układu współrzędnych w aplikacji jest rekomendacją projektową.
- Model 3D okucia służy do geometrii/wizualizacji, nie zastępuje zwymiarowanego rysunku produkcyjnego i walidacji technologicznej.

## Rekomendacja dla Claude

**P0 dla zwolnienia profilu okuć:** dodawać dane z CAD/CAM Blum wyłącznie jako wersjonowane źródło powiązane z konkretnym produktem/konfiguracją oraz materiałem źródłowym. Rozdzielić geometrię komponentu (3D), rysunek sytuacji montażowej, rysunek wierceń części drewnianej, BXF i CAM/postprocesor; nie traktować tych artefaktów jako zamiennych. Jeśli źródło podaje otwory, ale nie określa ich kompletnej bazy lub orientacji na części, stan produkcyjny ma pozostać niezatwierdzony.

**Zależności:** dokładny SKU i dobrana kombinacja okuć, pozyskany przez uprawnionego użytkownika rysunek/BXF/CAM oraz numer rewizji, definicja części i datumu w modelu, test translacji/obrotu/strony, zatwierdzony postprocesor i próba kontrolna na właściwej maszynie.

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
- Nie użyto danych klientów, nie zmieniono aplikacji, cen ani umów. Nie wykonano testów aplikacji, bo zmiana obejmuje wyłącznie dokumentację.
