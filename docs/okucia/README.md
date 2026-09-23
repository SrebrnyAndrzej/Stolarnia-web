# Biblioteka okuć — Blum, GTV, Amix

Stan zebrania: 23.09.2026. Dokumentacja źródłowa do kreatora mebli, wspólna dla Claude i Codex. Zawiera 12 plików PDF (11 różnych treści), jeden model STEP GTV i zapis sześciu stron producentów. Rejestr `sources.json` podaje adresy, daty pobrania, rozmiary i SHA256. Numery stron poniżej liczone są od pierwszej strony PDF, a nie według numeracji drukowanej katalogu.

## Sprawdzone wymiary elementów szuflad

Poniższe wzory odczytano i porównano wizualnie z rysunkami. Są materiałem do wdrożenia profili, a nie zatwierdzeniem kompletnej technologii produkcji. LW oznacza rzeczywistą szerokość wewnętrzną korpusu; NL nominalną długość prowadnicy. Wszystkie wymiary w mm. Kolejność dna: szerokość × głębokość; pleców: szerokość × wysokość.

| System i zakres | Płyta | Dno | Plecy | Źródło w katalogu pdf/ |
|---|---:|---|---|---|
| Amix Elite Box standard | 18 | (LW−75) × (NL−26) | (LW−87) × H; H=84/116/167/199 | AMIX-Elite-Box-standardowe.pdf, s.1 |
| GTV Axis Pro, opcja 1 | 16 | (LW−75) × (NL−24) | (LW−87) × H; H=84/116/167/199 | GTV-Axis-Pro-karta.pdf, s.8 |
| GTV Modern Box PRO | 16 | (LW−75) × (NL−24) | (LW−87) × H; A=84, B=135, C=199, D=167 | GTV-Modern-Box-Pro-instrukcja.pdf, s.7 |
| Blum MERIVOBOX M, drewniane plecy | 16 | (LW−51) × (NL−26) | (LW−51) × 83 | BLUM-Merivobox-planowanie.pdf, s.15 |
| Blum LEGRABOX M, drewniane plecy | 16 | (LW−35) × (NL−10), z wymaganą obróbką | (LW−38) × 63 | BLUM-Legrabox-planowanie.pdf, s.15 |
| Blum TANDEMBOX antaro M, drewniane plecy | 16 | (LW−75) × (NL−24) | (LW−87) × 84 | BLUM-Tandembox-antaro-planowanie.pdf, s.7 |

Przykład: korpus zewnętrzny 600, dwa boki po 18, bez dodatkowych elementów zmniejszających światło: LW=564. Dla NL=500 dna wynoszą odpowiednio: Amix 489×474, Axis/Modern 489×476, MERIVOBOX 513×474, LEGRABOX 529×490, TANDEMBOX 489×476. Grubość dna wynika z profilu okucia, a nie automatycznie z grubości boków korpusu. LEGRABOX wymaga dodatkowej obróbki zgodnej z diagramem.

`reguly-szuflad.json` zawiera te sześć profili, zakres zastosowania, źródło, sumę kontrolną i przykłady. Każdy ma `production_approved=false`: nie uzupełniono jeszcze kompletnego przypisania SKU, długości, wierceń i obróbki. Nie używać go bezpośrednio jako zatwierdzonego katalogu CNC.

## Ważne rozróżnienia i braki

- Amix: instrukcja standardowa i wewnętrzna mają różne wartości L1 (100 i 95 dla wskazanych długości). Nie łączyć ich schematów wierceń. Wariant i rewizję trzeba rozstrzygnąć przy przypisaniu do SKU. Instrukcja wewnętrzna jest załączona, ale nie dostała osobnego zatwierdzonego profilu.
- Axis Pro: pliki nazwane `_3` i `_4` są identyczne bajtowo. Numer w nazwie nie dowodzi nowej rewizji. Nie rozszerzać reguły na Axis Pro Glass lub niezweryfikowane wysokości.
- Modern Box PRO: C=199, D=167; kolejność liter nie oznacza rosnącej wysokości.
- Blum: zweryfikowano tu tylko wskazane warianty M z drewnianymi plecami. Pozostałe warianty są w załączonych katalogach i wymagają odrębnej normalizacji.
- Wymiary prostokątów nie zastępują frezowania, otworów, tolerancji, odsadzeń prowadnic i wymagań montażowych. Brakujące dane mają blokować wydanie produkcyjne, nie samo projektowanie.

## Modele 3D i dokumentacja

Pobrano model `cad/GTV-PB-AXISPRO-P2O-KPL350A.stp` z [karty GTV](https://gtv.com.pl/produkt/PB-AXISPRO-P2O-KPL350A/). Zweryfikowano nagłówek formatu i integralność pliku; nie zweryfikowano geometrii, jednostek i zgodności montażowej w CAD. Model dotyczy konkretnego produktu, nie wszystkich długości rodziny.

[Serwis CAD/CAM Blum](https://www.blum.com/pl/pl/services/industrial-production/cad-cam-dataservice/) jest kolejnym źródłem modeli i danych produkcyjnych. Nie pobrano stamtąd modeli CAD ani nie potwierdzono publicznego API. Na sprawdzonych stronach Amix nie znaleziono modelu STEP; nie oznacza to braku takiego modelu u producenta.

Do renderowania w aplikacji konwertować zweryfikowane modele do glTF/GLB, zachowując osobno oryginalny STEP. Kontrolować jednostki, orientację osi, punkt montażu, lewą/prawą stronę i ograniczenia ruchu. Geometria renderowania nie jest źródłem pozycji wierceń. Sprawdzić warunki wykorzystania modeli przed ich publiczną dystrybucją.

## Kolejność dalszego wdrożenia

1. Przypisać rzeczywiście kupowane SKU, długości, wysokości i wersje otwierania do profili. Nazwy „Blum” i „GTV” nie wystarczają do wyboru technologii.
2. Dla każdego profilu opisać pełny zestaw części, obróbek i ograniczeń montażu z odwołaniami do stron PDF.
3. Uzupełnić średnicę, głębokość, stronę, lokalny układ współrzędnych i tolerancję każdego wiercenia. Rozróżnić otwory płyt od geometrii samych okuć.
4. Porównać obliczenia i rysunki z referencyjnym meblem oraz potwierdzonym procesem zakładu; dopiero wtedy zatwierdzić profil produkcyjny.
5. Wygenerować z jednego modelu konstrukcji widok 3D, zestawienie części, rysunki wszystkich części i mebli oraz pakiet całej kuchni.

Pobranie dokumentacji jest zakończone dla tego zestawu źródeł. Pełna biblioteka wierceń i wdrożenie w aplikacji pozostają oddzielnym etapem.
