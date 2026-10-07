# Blum LEGRABOX — uzupełnienie danych wiercenia frontów i komponentów

Data odczytu: 07.10.2026. Dokumentacja techniczna producenta, kontrola renderu obu PDF-ów. Nie zmieniono kodu ani statusów dopuszczenia produkcji.

## Źródła i rewizje

Oficjalna [strona pobrań LEGRABOX Blum USA](https://www.blum.com/us/en/products/boxsystems/legrabox/downloads-videos/) aktualnie indeksuje:

1. „LEGRABOX drawer front boring pattern”, 137 KB, data strony 02-07-2024. PDF pobrano z `https://d2.blum.com/services/BEC003/lbxfrdrill_td_dok_bus_$sen-us_$aof_$v2.pdf`; SHA-256 `30D7DE4F6DB7CFB39491D3759BBC7BDD97E9782E2590BE073E9467E9317D378C`. Rysunek jednostronicowy, numer rysunku nie widoczny; datowany 8/6/14, indeks 00.
2. „LEGRABOX Drawer component preparation”, 181 KB, data strony 07-02-2026. PDF pobrano z `https://d2.blum.com/services/BEC003/cme224466_td_dok_bus_$sen-us_$aof_$v1.pdf`; SHA-256 `E0CEB878A6A1F0391AF5CED599C0232BB0BB9C5C2BCE94A47C217F74B9A0824F`. Jedna strona, oznaczona © 2018. Data na stronie pobrań i data wydania samej planszy to różne metadane; nie przedstawiać jej jako rysunku technicznego stworzonego w 2026.

Oba PDF-y pobrano z oficjalnej strony, następnie strony wyrenderowano i sprawdzono wizualnie. Drugi arkusz jest ogólnym przygotowaniem komponentów, pierwszy — wzorem dla przyrządu wiertarskiego MZK.8000.US. Źródła amerykańskie; kody części i dostępność należy traktować jako rynek USA, dopóki nie zostaną potwierdzone w polskim katalogu/dystrybucji.

## Co daje arkusz „Drawer component preparation”

### Dno i drewniane plecy

| Parametr | Wartość producenta |
|---|---|
| Długość dna | `NL − 10 mm`; tabela potwierdza NL 270→260, 350→340, …, 650→640 mm |
| Szerokość dna | `LW − 35 mm` |
| Podcięcie dna przy każdym boku | 38 × 8 mm |
| Szerokości pleców | `LW − 38 mm` |
| Wysokości pleców N/M/K/C/F | 39 / 63 / 101 / 148 / 212 mm |

`LW` oznacza szerokość wewnętrzną korpusu; nie podmieniać jej na szerokość zewnętrzną. Podcięcie 38×8 jest osobną geometrią dna — prostokąt `LW−35 × NL−10` nie opisuje gotowego detalu.

### Dwa podstawowe otwory mocowania frontu

Rysunek rozdziela wysokość N od M/K/C/F:

| Wysokość boku | Rozstaw pionowy osi | Położenie od dolnej krawędzi frontu |
|---|---:|---|
| N | 16 mm | `min. 45,5 mm + bottom overlay` |
| M, K, C, F | 32 mm | `min. 51 mm + bottom overlay` |

Tabela na tej samej planszy podaje położenie mocowania w poziomie jako `14 mm + side overlay`. Dla pokazanych side overlay 8 / 13 / 16 / 17,5 / 19 mm daje to odpowiednio 22 / 27 / 30 / 31,5 / 33 mm. Dla bottom overlay 8 / 13 / 16 / 17,5 / 19 mm położenie dolnego poziomu wynosi:

| Bottom overlay | N | M/K/C/F |
|---:|---:|---:|
| 8 | 53,5 | 59 |
| 13 | 58,5 | 64 |
| 16 | 61,5 | 67 |
| 17,5 | 63 | 68,5 |
| 19 | 64,5 | 70 |

Na rysunku wiercenia oznaczono `Ø10 × 12*`; przypis mówi, że są to wymiary nawiercania dla EXPANDO, a dla mocowania wkrętem wstępne nawiercenie ma `Ø2 × 2,5 mm`. Schemat pokazuje dwa punkty; przed zasileniem CNC producentowski rysunek musi być powiązany z dokładną referencją mocowania oraz właściwym wariantem, a sposób interpretacji wspólnego calloutu dla obu punktów potwierdzony próbą lub osobną instrukcją. Nie mieszać nawiercenia EXPANDO z nawierceniem pod wkręt.

Blum zastrzega w stopce techniczne modyfikacje bez powiadomienia; plansza nie określa tolerancji procesu. Dla C i F przypis odsyła po dodatkowe miejsca nawierceń do broszury LEGRABOX — podstawowy wzór dwóch punktów nie jest pełnym wzorem wszystkich mocowań wysokiego frontu.

## Dodatkowe wzory C/F z arkusza przyrządu

Arkusz „front boring pattern” pokazuje lokalizacje bitów przyrządu MZK.8000.US (8 wrzecion, wiertła Ø10) oraz ustawienie ogranicznika `19 + overlay`. Dla C pokazano opcję czterech mocowań M (pozycje 2, 3, 5, 6) i opcję dwóch mocowań C (2, 3, 6); dla F pokazano układ sześciu mocowań M (2, 3, 5, 6, 7, 8) oraz układ mieszany dwóch C i dwóch M. Arkusz jawnie potwierdza, że wysokości M i K korzystają z pozycji bitów 2 i 3. Podane ciągi mają rozstawy 32 mm i 64 mm/96 mm zgodnie z rysunkiem; pozycje i rotacje bitów są specyficzne dla przyrządu.

Ten arkusz uzupełnia dobór pozycji dla określonych zestawów mocowań, ale nie zastępuje pełnego postprocesora CNC: należy odwzorować stronę lewą/prawą, bazę narzędzia, faktyczny zestaw mocujący, wysokość oraz nastawę overlay. Kody z planszy USA (np. `ZF7C0E2`, `ZF7M0E2`) różnią się zapisem od kodów w polskiej tabeli zamówieniowej, np. `ZF7C70E2`, `ZF7M70E2`. Nie utożsamiać ich automatycznie; utrzymywać odrębne aliasy SKU z rynkiem, dokumentem i datą.

## Aktualizacja poprzedniego odczytu standard M

Poprzedni odczyt lokalnej polskiej planszy M poprawnie stwierdzał, że sama strona 14 nie podaje kompletnego X ani wszystkich wierceń. Nowa plansza ogólna Blum dodaje parametr poziomy `14 + side overlay`, osobne poziomy N versus M/K/C/F oraz callout dla EXPANDO i nawiercenia wkrętu. Nie należy jednak usuwać ograniczeń dla lokalnej planszy ani rozszerzać tych danych na inne rodziny produktów lub warianty mocowania. Uzupełnienie dotyczy wskazanych schematów i marketu USA.

## Wnioski dla silnika i kryteria odbioru

- **Problem:** jeden profil „LEGRABOX” bez rozróżnienia wysokości, rodzaju szuflady, overlay, strony i sposobu mocowania może wygenerować zły rozstaw lub niewłaściwe przygotowanie otworu.
- **Zachowanie:** modelować osobne wersjonowane warianty N i M/K/C/F; wymagać side/bottom overlay i identyfikatora zestawu. Dla C/F wymagać także liczby/rodzaju mocowań. Niedopasowany lub nieznany SKU oraz brak overlay blokują eksport wierceń.
- **Priorytet:** P0 dla ochrony przed nieprawidłową operacją CNC; P1 dla pokrycia dodatkowych zestawów C/F oraz normalizacji SKU według rynku.
- **Zależności:** potwierdzenie polskiego SKU i zgodności z rynkiem USA, jednoznaczne bazy osi, wersjonowanie źródeł, próba fizycznego montażu i ustawienia w maszynie.
- **Mierzalny odbiór:** testy tabeli overlay potwierdzają X = 14 + side overlay, pion N = 16 i 45,5 + bottom overlay, M/K/C/F = 32 i 51 + bottom overlay; przypadki C/F odrzucają domyślną liczbę mocowań. Testy BOM odróżniają kody USA od PL. Eksport produkcyjny pozostaje zablokowany bez zweryfikowanego SKU/rynku, poprawnego wariantu oraz odbioru technologicznego.

## Punkt wznowienia

`origin/main=8230275`; w tym przebiegu nie wykryto nowych commitów Claude. PDF-y pobrano wyłącznie do tymczasowego katalogu, nie dodano ich do repozytorium. Zachować pliki oficjalne jako źródła zewnętrzne i sumy kontrolne powyżej. Następnie uzgodnić polskie SKU z kartami regionalnymi Blum oraz sprawdzić dokumentację przyrządu dla głębokości/tolerancji i otworów dodatkowych C/F.
