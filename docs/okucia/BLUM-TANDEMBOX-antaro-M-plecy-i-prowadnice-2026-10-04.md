# Blum TANDEMBOX antaro M — dobór prowadnicy i plecy drewniane/stalowe

04.10.2026. Ręczna kontrola katalogu Blum 2024/2025 PL, plik w repozytorium `docs/okucia/pdf/BLUM-Tandembox-antaro-planowanie.pdf` (48 stron; SHA-256 rejestru sources.json: `c59a7c22f74f557b5f91d39ff173db04663311dc1eadf0607392a7db69a6f671`; pobrany 23.09.2026). Odczyt wizualny: strony PDF 7, 8, 43, 44; odczyt treści w polskim katalogu źródłowym. Baza origin/main na wejściu 76ca5e7; brak nowych commitów Claude.

## Rozstrzygnięcie wariantu pleców

Karta szuflady standardowej M, PDF s.7 (drukowana str.7):

| Typ ścianki tylnej | Część / dane zamówieniowe | Szerokość pleców | Dno |
|---|---|---:|---|
| Drewniana płyta 16 mm | uchwyty L/P Z30M000S.04 | `LW−87` | `(LW−75) × (NL−24)` |
| Stalowa ścianka M | SKU wzorca `Z30MxxxS.6` (kolor wpływa na SKU) | `LW−28` | `(LW−75) × (NL−22)` |

Stalowe plecy to odrębna rodzina części, nie drewniana płyta o innej grubości. Katalog podaje przykład LW=567: stalowy element ma szerokość 539 (`567−28`). Drewniany wariant dla tego samego LW wynosi 480. Różnica szerokości to 59 mm. Długości dna także różnią się o 2 mm.

Pełny wariant stalowy i tabele wysokości/SKU dla N/M/K/C/D znajdują się w PDF s.43. Wszystkie stalowe plecy z tabeli mają szerokość LW−28; SKU zawiera oznaczenie wysokości (Z30N/M/K/C/DxxxS.6). Uchwyty pleców stalowych mają osobną pozycję Z30B000S.04. Nie wybierać SKU stalowych pleców, kolorów ani wysokości automatycznie bez zakresu katalogu i potwierdzenia oferty.

## Dobór prowadnicy M wg NL i nośności

Katalog dla M, PDF s.6:

| NL | 30 kg: SKU BLUMOTION | 65 kg: SKU BLUMOTION |
|---:|---|---|
| 270 | 578.2701M | — |
| 300 | 578.3001M | — |
| 350 | 578.3501M | — |
| 400 | 578.4001M | — |
| 450 | 578.4501M | 576.4501M |
| 500 | 578.5001M | 576.5001M |
| 550 | 578.5501M | 576.5501M |
| 600 | 578.6001M | 576.6001M |
| 650 | — | 576.6501M |

Katalog zaznacza gwiazdką zastosowanie 30 kg „do SERVO-DRIVE i TIP-ON BLUMOTION”. Wpis serii jest wersją/wariantem; nie rozstrzyga, jak obciążenie aplikacyjne mebla należy obliczyć. Pusta komórka nie oznacza równoważnego SKU. Na wspólnym zakresie 450–600 istnieją dwie nośności i odrębne numery prowadnic. Zatem NL nie wystarcza do SKU, a sama szerokość/długość korpusu nie rozstrzyga nośności. Nośność musi być jawnie wymagana lub wybrana i odzwierciedlona w BOM.

## Stan obecnego profilu w repozytorium

W `docs/okucia/reguly-szuflad.json`, profil `blum-tandembox-antaro-m-wood` opisuje drewnianą płytę: LW−87, dno NL−24; dodano osobno głębokość dna NL−22 dla stalowych pleców. Brakuje jednak pola szerokości stalowych pleców LW−28 i kontraktu, który wymusza spójny wybór rodzaju pleców dla obliczenia obu części. `allowed_nominal_lengths_status` pozostaje `not_normalized`; tabela prowadnic s.6 pozwala opracować zakres wariantów z nośnością, lecz trzeba zachować wybór 30/65 kg, nie tylko jedną tablicę NL.

Prowadnica przykręcana do boku korpusu ma odrębne wiercenia od frontu. Karta planowania zapisana lokalnie pokazuje przede wszystkim zabudowę i mocowania frontu/pleców. Późniejszy, aktualny [katalog Blum 2027/2028, s. 345](https://publications.blum.com/2026/catalogue/en/345/) zawiera osobne diagramy „Cabinet profile fixing positions” dla 578 (30 kg) i 576 (65 kg), z pozycjami grupowanymi według NL. To nowe źródło do dalszej normalizacji, ale nie dowód gotowej mapy CNC: tekstowa ekstrakcja strony nie przypisuje jednoznacznie każdej współrzędnej do otworu, wymaganej/opcjonalnej pozycji oraz typu mocowania. Pełne wiercenia pozostają niezatwierdzone.

## Nowe źródło do pozycji prowadnic (09.10.2026)

Aktualny [katalog Blum 2027/2028, s. 345](https://publications.blum.com/2026/catalogue/en/345/) pokazuje mapy mocowania prowadnic korpusu oddzielnie dla profilu 578 – 30 kg i 576 – 65 kg. Na stronie wymieniono wiele nominalnych długości i oddzielne grupy NL dla profilu 576; legenda rozróżnia wkręt do płyty A Ø4×15 mm oraz wkręt systemowy B Ø6×14,5 mm, a część pozycji jest oznaczona jako opcjonalna. Diagramy nie powinny być spłaszczane do jednej tablicy wierceń niezależnej od typu prowadnicy/nośności.

Karta aktualnego wariantu TANDEMBOX potwierdza dodatkowo, że wiercenie liniowe dotyczy dokładnie SKU 578.4501M (30 kg), a nie całej rodziny 578/576 ([katalog Blum 2027/2028, s. 309](https://publications.blum.com/2026/catalogue/en/309/)). To ograniczenie SKU należy przechować razem z profilem oraz NL. Katalog opisuje ponadto dostęp do Manufacturing data — drawings, 2D/3D CAD lub CAM — przez web code i Blum Product Configurator ([wstęp do katalogu 2027/2028](https://publications.blum.com/2026/catalogue/en/)); nie potwierdza to publicznego API ani prawa do automatycznego pobierania danych.

Odczyt tekstowy strony 345 zawiera etykiety wymiarów i grup NL, lecz ich kolejność w ekstrakcji nie wystarcza do odwzorowania wszystkich punktów, ich baz i oznaczeń A/B na części. Nie zapisano więc żadnej nowej liczbowej listy `holes_from_front_mm`. Przed implementacją należy obejrzeć oryginalny rysunek o wysokiej rozdzielczości i powiązać każdą pozycję z typem otworu, średnicą/głębokością, sposobem mocowania, opcjonalnością i dokładnym SKU. W międzyczasie `unknown` oraz blokada zwolnienia CNC pozostają prawidłowe.

### Kontrola graficzna strony 345 — 09.10.2026

Otworzyłem stronę 345 bieżącego interaktywnego katalogu Blum 2027/2028 w wysokim powiększeniu. Obraz potwierdza, że to dwie osobne tabele „Cabinet profile fixing positions”: 578 / 30 kg i 576 / 65 kg, z odmiennymi zakresami NL. Widoczne etykiety pozycji w tabeli 578 to `19**`, 37, 115, 133, 165, 229, 261 i 293 mm; dla 576 — `19**`, 28, 37, 115, 165, 261, 293, 357, 453, 517 i 549 mm. To etykiety rysunkowe połączone pionowymi liniami z symbolami w wierszach NL, a nie współrzędne zatwierdzone do CNC: nadal trzeba jednoznacznie ustalić początek i stronę odniesienia każdego wymiaru oraz przypisanie symbolu do mocowania. Legenda rozróżnia wkręt do płyty A (Ø4 × 15 mm) i wkręt systemowy B (Ø6 × 14,5 mm, 661.1450.HG); `**` opisuje pozycję opcjonalną dla większej stabilności, którą można zastąpić wkrętem do płyty A. [Strona Blum 345](https://publications.blum.com/2026/catalogue/en/345/).

To wizualne potwierdzenie legendy i rozdzielenia tabel, nie kompletna geometria obróbki płyty. Diagram nie podaje w tej tabeli jawnej średnicy/głębokości wstępnego nawiercenia ani tolerancji; same symbole wkrętów nie wystarczają do wygenerowania bezpiecznej operacji CNC. Nie przepisuję z obrazu współrzędnych do `reguly-szuflad.json`. Do zwolnienia produkcyjnego nadal wymagane są jawny początek/strona odniesienia dla każdego wymiaru, przypisanie symbolu do punktu, parametry otworu i potwierdzenie próbą montażową na właściwym profilu/SKU.

## Rekomendacje dla Claude

| Priorytet | Problem i dowód | Zachowanie | Zależności | Kryterium odbioru |
|---|---|---|---|---|
| P0 | Profil miesza warianty drewno/stal (s.7,43) | Jawny enum/wybór konstrukcyjny wpływa na plecy, dno, BOM, 3D | SKU konkretnego wariantu i kolor | LW567/NL500: drewniane plecy 480, stalowe 539; dno odpowiednio głębokość 476/478. Przełączenie aktualizuje obie części razem |
| P0 | Wariant M ma 30/65 kg w NL 450–600 (s.6) | Dobierać exact SKU po NL, wymaganej nośności i funkcji otwierania | Obciążenie projektowe oraz zgodność z SERVO-DRIVE/TIP-ON | NL500 30 kg→578.5001M, 65 kg→576.5001M; 650 mm 30 kg→brak kandydata i wyraźny komunikat |
| P0 przed zakupem | Szerokość/kolor/wersja opisu SKU stalowych pleców zależą od tabeli | Przechowywać wzorzec SKU oddzielnie od SKU zakupu oraz potwierdzić kolor/rynek | Dostępność i indeks bieżącego katalogu | Konfiguracja pokazuje kompletną listę części; nie sprzedaje wzorca `xxx` jako SKU kupowalnego |
| P0 przed CNC | Istnieje oddzielny diagram Blum 2027/2028 dla prowadnic 578/576, ale ekstrakcja tekstowa nie wiąże jednoznacznie punktów z geometrią i typem mocowania (s.345) | Oddzielić mapę 578 30 kg od 576 65 kg; nie publikować OCR jako pełnego CNC drill-map | Wizualny odczyt strony 345, dokładny SKU/NL, typ oraz średnica/głębokość otworu i próba | Dla każdego punktu zapisano bazę, współrzędne, typ otworu i wkręt A/B, opcjonalność i źródło; referencyjny bok oraz próbny montaż potwierdzają mapę; do tego czasu eksport pozostaje nieprodukcyjny |
| P1 | Rodzaj pleców zmienia render i wycenę | Jedna konfiguracja zasila 3D, BOM i wycenę; jawny status weryfikacji | Model stalowego elementu i aktualny cennik | BOM, wizualizacja i zestawienie materiałów zgodne po każdym przełączeniu |

Przykłady są odczytem z konkretnej publikacji 2024/2025 PL; wymagają przypisania do faktycznie kupowanych komponentów i potwierdzenia bieżącego katalogu/sprzedawcy przed wyceną lub produkcją. Nie zmieniono `reguly-szuflad.json` ani logiki aplikacji.

## Punkt wznowienia

Ostatnia sprawdzona rewizja Claude: brak nowych commitów po przeglądzie. Baza repozytorium przed dokumentacją 76ca5e7. Następnie osobno przejrzeć reguły TANDEMBOX stalowe i konkretne SKU dostępne w PL; potem powrócić do otworów korpusu prowadnicy. R03 starego formularza pozostaje na liście kontroli przy następnym commicie Claude. Ceny i umowy bez zmian.
