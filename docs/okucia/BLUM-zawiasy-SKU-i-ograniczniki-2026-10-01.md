# Blum: identyfikacja zawiasu i zależność ogranicznika od zestawu

01.10.2026 — uzupełnienie ZAWIASY-szuflady-wewnetrzne-2026-10-01.md.
Przegląd: fetch origin/main = 7561612, brak nowych zmian kodu. Ostatni przegląd kodu e8dedfe i 20/20 testów z 30.09 pozostają aktualnym punktem odniesienia; nie wykonywano ponownie testów niezmienionego kodu.

## Oficjalne dane PL

Źródła odczytano 01.10.2026 z polskiego katalogu 2024/2025. Jest to konkretnie oznaczone wydanie historyczne, a nie potwierdzenie oferty handlowej na dziś. Odczyt HTML: identyfikacja produktów, bez zatwierdzania wierceń z liniowo wyodrębnionych tabel. Numery stron poniżej to numery drukowane; tytuł przeglądarki może pokazywać przesunięcie o cztery strony.

### Zawias 155° — źródło S1

[Blum PL, s.84](https://publications.blum.com/2024/catalogue/pl/84/): CLIP top BLUMOTION na wkręty 71B7550 do drzwi nakładanych; 71B7650 do bliźniaczych. Odpowiednie warianty INSERTA: 71B7590 i 71B7690. Nie scalać tych SKU jako zamiennych sposobów montażu. Katalog opisuje zerowy uskok dla drzwi nakładanych; nie przenosić tego automatycznie na wszystkie warianty. Dla zawiasu 155° zestawienie akcesoriów podaje 70T7553.09 = 92° i 70T7553 = 110°.

### Podobny SKU, inne działanie — źródło S2

[Blum PL, s.92](https://publications.blum.com/2024/catalogue/pl/92/): 71B7550D to zawias 125° do drzwi profilowanych, na wkręty; wersja do wprasowania 71B7580D. W tej konfiguracji ogranicznik 70T7553 opisano jako 92°. Zerowy uskok dotyczy drzwi nakładanych.

**Istotny wniosek dla katalogów:** sufiks D nie jest kosmetyczny. Ten sam ogranicznik 70T7553 ma w przytoczonych zestawach różny wynikowy kąt. Kąt po ograniczeniu musi należeć do relacji zawias–ogranicznik, nie do samego produktu ogranicznika. Nie usuwać suffixów ani kropek podczas deduplikacji SKU. Wcześniejszy brief 92°/110° dotyczył wskazanego zawiasu 155°, a nie globalnych właściwości akcesoriów.

### Prowadnik: dystans a wysokość — źródło S3

[Blum PL, s.150](https://publications.blum.com/2024/catalogue/pl/150/): prowadnik prosty 20/32 175H3100 ma dystans 0 i wysokość 8,5 mm; 175H3130 — dystans 3 i wysokość 11,5 mm. To różne pola. Strona zawiera także wymaganie dodatkowego wkrętu przy zawiasach szerokokątnych i z zerowym uskokiem. Nie wystarcza skopiowanie dwóch punktów mocowania z samej nazwy 20/32. Pozycja dodatkowego mocowania oraz średnica/głębokość otworu pilotującego pozostają nieznormalizowane. Nie utożsamiać średnicy wkrętu ze średnicą wiercenia.

### Geometria — źródło S4

[Blum PL, s.85](https://publications.blum.com/2024/catalogue/pl/85/) rozdziela geometrię drzwi nakładanych, bliźniaczych i wpuszczanych. Dane dotyczą ustawienia fabrycznego, a przy ścianie zaleca się próbę montażu. Nie przepisano macierzy TB/MD/FA z HTML jako zweryfikowanej tabeli numerycznej. Potrzebne sprawdzenie rysunku i przypisania kolumn.

## Wymagania dla Claude — rekomendacje, nie gotowa implementacja

| Priorytet / problem | Dowód | Zachowanie i zależności | Mierzalny odbiór |
|---|---|---|---|
| P0: błędne scalanie SKU | S1/S2 | Przechowywać oryginalny identyfikator producenta; alias sprzedawcy oddzielnie. Zależność: importer i wyszukiwarka katalogu | 71B7550 i 71B7550D pozostają dwoma rekordami z kątami 155°/125°; wyszukiwanie fragmentem nie zamienia wyboru |
| P0: kąt przypisany do samego ogranicznika | S1/S2 | Kąt wynikowy w tabeli kompatybilności z identyfikatorem zawiasu i źródłem | Dwie udokumentowane konfiguracje 70T7553 zwracają odpowiednio 110° i 92°; dla nieznanej pary brak danych, nie wartość domyślna |
| P0: mylenie dystansu i wysokości prowadnika | S3 | Osobne wielkości i jednostki; obliczenia nałożenia odwołują się do właściwego pola | Fikstura 175H3100: dystans 0, wysokość 8,5; zmiana jednego pola nie nadpisuje drugiego |
| P0 przed produkcją: niepełne mocowanie | S3 | Warunkowa operacja dodatkowego mocowania. Zależność: wymiarowany rysunek prowadnika i weryfikacja wierceń | Przy wymaganym dodatkowym wkręcie brak pozycji/średnicy/głębokości blokuje kompletność; BOM nie gubi wkrętu |
| P1: niejednoznaczna podmiana wariantu | S1/S4 | Zmiana pełne/bliźniacze albo wkręty/INSERTA wymaga ponownego przeliczenia i walidacji | Podmiana SKU unieważnia poprzednie potwierdzenie otworów i prześwitu; historia wydania zachowuje poprzedni profil |

Nie potwierdzono kompletnej pary zawias–prowadnik dla konkretnego korpusu użytkownika. Nie włączono tych rekordów do aplikacji ani nie zmieniono reguł produkcyjnych.

## Punkt wznowienia i priorytety

1. P0: pozyskać i obejrzeć wymiarowany rysunek prowadnika 175H3100, dodatkowego wkrętu i puszki 71B7550; ustalić brakujące operacje oraz geometryczne warunki nałożenia. Nie traktować niniejszego spisu SKU jako aprobaty zestawu.
2. P0: uzupełnić zamówione dane frontów i pleców Amix/GTV; zachować wcześniejsze blokady LEGRABOX i zabieraka.
3. P1: po danych produkcyjnych wrócić do trwałych oryginałów PDF wydań i testu odtworzenia z kopii — plan etapów z 30.09.

Sprawdzony origin/main przed publikacją: 7561612. Brak nowych zmian Claude. Zmieniono tylko dokumentację; ceny i umowy bez zmian.
