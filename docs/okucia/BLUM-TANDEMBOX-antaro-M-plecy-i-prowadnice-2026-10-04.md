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

Prowadnica przykręcana do boku korpusu ma odrębne wiercenia od frontu; dostępna karta planowania pokazuje przede wszystkim zabudowę i mocowania frontu/pleców. Nie znormalizowano tutaj pełnej pozycji otworów prowadnicy wzdłuż głębokości korpusu. Status wierceń produkcyjnych zostaje niezatwierdzony.

## Rekomendacje dla Claude

| Priorytet | Problem i dowód | Zachowanie | Zależności | Kryterium odbioru |
|---|---|---|---|---|
| P0 | Profil miesza warianty drewno/stal (s.7,43) | Jawny enum/wybór konstrukcyjny wpływa na plecy, dno, BOM, 3D | SKU konkretnego wariantu i kolor | LW567/NL500: drewniane plecy 480, stalowe 539; dno odpowiednio głębokość 476/478. Przełączenie aktualizuje obie części razem |
| P0 | Wariant M ma 30/65 kg w NL 450–600 (s.6) | Dobierać exact SKU po NL, wymaganej nośności i funkcji otwierania | Obciążenie projektowe oraz zgodność z SERVO-DRIVE/TIP-ON | NL500 30 kg→578.5001M, 65 kg→576.5001M; 650 mm 30 kg→brak kandydata i wyraźny komunikat |
| P0 przed zakupem | Szerokość/kolor/wersja opisu SKU stalowych pleców zależą od tabeli | Przechowywać wzorzec SKU oddzielnie od SKU zakupu oraz potwierdzić kolor/rynek | Dostępność i indeks bieżącego katalogu | Konfiguracja pokazuje kompletną listę części; nie sprzedaje wzorca `xxx` jako SKU kupowalnego |
| P0 przed CNC | Tabela montażowa nie jest pełnym CNC drill-map dla korpusu | Zachować blokadę kompletności wierceń prowadnicy | Instrukcja montażowa, wymiary nawiertu i próba | Rysunek produkcyjny dla boku korpusu nie powstaje na podstawie samej tabeli długości prowadnicy |
| P1 | Rodzaj pleców zmienia render i wycenę | Jedna konfiguracja zasila 3D, BOM i wycenę; jawny status weryfikacji | Model stalowego elementu i aktualny cennik | BOM, wizualizacja i zestawienie materiałów zgodne po każdym przełączeniu |

Przykłady są odczytem z konkretnej publikacji 2024/2025 PL; wymagają przypisania do faktycznie kupowanych komponentów i potwierdzenia bieżącego katalogu/sprzedawcy przed wyceną lub produkcją. Nie zmieniono `reguly-szuflad.json` ani logiki aplikacji.

## Punkt wznowienia

Ostatnia sprawdzona rewizja Claude: brak nowych commitów po przeglądzie. Baza repozytorium przed dokumentacją 76ca5e7. Następnie osobno przejrzeć reguły TANDEMBOX stalowe i konkretne SKU dostępne w PL; potem powrócić do otworów korpusu prowadnicy. R03 starego formularza pozostaje na liście kontroli przy następnym commicie Claude. Ceny i umowy bez zmian.
