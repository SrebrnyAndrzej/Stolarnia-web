# LEGRABOX 750/753 — tabela pozycji mocowania prowadnic wg instrukcji 12.25

08.10.2026. Uzupełnienie kolejki „otwory prowadnic Blum wzdłuż głębokości”. Źródłem jest oficjalny arkusz Blum **LEGRABOX | Befestigung der Korpusschienen**, `TD-159/2 DE/12.25`: [PDF producenta](https://d2.blum.com/services/BEC003/cme179786_td_dok_bau_%24sde_%24aof_%24v2.pdf). W indeksie wyszukiwania Blum arkusz udostępnia osobne macierze dla prowadnicy 750/40 kg i 753/70 kg. Najnowszy katalog producenta 2027/2028 wymienia te rodziny osobno w sekcji LEGRABOX (drukowane s.247–248; [spis sekcji](https://publications.blum.com/2026/catalogue/de/193/)).

## Co pokazuje tabela producenta

Arkusz podaje kolumny wymiarowe `19*`, `28`, `37`, `69`, `197`, `229`, `243`, `261`, `293`, `357`, `453` mm (nie wszystkie występują w każdej rodzinie) i osobny wiersz dla zakresu nominalnego `NL`. W ekstrakcji tabeli producenta macierze oznaczeń są następujące:

| Prowadnica | NL [mm] | Kolumny wymiarowe z oznaczeniami w macierzy źródła |
|---|---:|---|
| 750, 40 kg | 270 | 19* `●○●`; 37 `○○●`; 69 `○○●`; 197 `○○●` |
| 750, 40 kg | 300–350 | 19* `●○●`; 37 `○○●`; 197 `○○●`; 243 `○○●` |
| 750, 40 kg | 400–500 | 19* `●○●`; 37 `○○●`; 243 `●○●`; 293 `○○●` |
| 750, 40 kg | 550–600 | 19* `●○●`; 37 `○○●`; 243 `●○●`; 293 `○○●`; 357 `○○●` |
| 753, 70 kg | 450 | 19* `●○●`; 28/37/69/243 `○○●`; 261 `**` |
| 753, 70 kg | 500–600 | 19* `●○●`; 28/37/69/243/261 `○○●`; 293 `**` |
| 753, 70 kg | 650 | 19* `●○●`; 28/37/69/243/261/293 `○○●`; 357 `**` |

Legenda arkusza: `A` = wkręt do płyty wiórowej Ø4×15 mm; `B` = wkręt systemowy Ø6×14,5 mm, nr 661.1450.HG. Oznaczenie `19*` może być zastąpione wkrętem A; `**` opisuje pozycję opcjonalną dla zwiększonej stabilności. Symbole `●○●` i `○○●` zachowano tak, jak zwraca indeksowany rysunek — bez interpretowania ich jako gotowych operacji lub typów otworów.

## Znaczenie i granice

- **Potwierdzony fakt źródłowy:** rozstaw mocowania zależy co najmniej od rodziny/klasy obciążenia i NL; nie wystarczy samo NL. 750 i 753 mają odrębne macierze.
- **Potwierdzony fakt źródłowy:** arkusz rozdziela mocowanie wkrętem do płyty od mocowania wkrętem systemowym oraz wyodrębnia pozycje dodatkowe oznaczone jako opcjonalne.
- **Do weryfikacji wizualnej przed wdrożeniem:** bazę osi X dla kolumn tabeli, położenie i kształt każdego symbolu na rzeczywistym rysunku, dokładne przypisanie A/B do geometrii otworów oraz to, czy montaż używa otworu, fasolki czy kombinacji. Bez tych elementów nie przepisuj tabeli do `holes_from_front_mm` ani do eksportu CNC.
- **Poza zakresem dowodu:** średnice/głębokości otworów pilotujących, tolerancje, typ wiertła, materiał korpusu, postprocesor oraz próba montażowa. Średnica wkręta nie jest automatycznie średnicą otworu.

## Rekomendacja dla Claude

P0 — zdefiniować rekord schematu wierceń z kluczem `(rodzina prowadnicy, klasa obciążenia, NL, wariant wkręta, wersja źródła)`, osobno przechować dozwolone pozycje i opcjonalne punkty stabilizujące. Pokazywać jawny brak danych dla niewspieranego NL/rodziny; nie dobierać klasy ani punktów automatycznie na podstawie szerokości szuflady.

**Zależności:** pobranie i wizualna kontrola całego arkusza 12.25; potwierdzenie bazy przedniej krawędzi i kształtu punktów; sku/typ wkręta dla produkcji; średnica, głębokość i tolerancje z procesu zakładu; test na rzeczywistej prowadnicy i płycie.

**Odbiór:** testy rozróżniają NL 500 dla 750/40 kg i 753/70 kg; pozycje opcjonalne są oznaczone jako opcjonalne; brak potwierdzonej bazy, typu/średnicy/głębokości lub wariantu mocowania daje `unknown` i blokuje CNC; wygenerowany rysunek wskazuje rodzinę, klasę, NL oraz źródło/revizję.

## Status

Nowe źródło producenta uzupełnia starszy brief `LEGRABOX-prowadnice-zrodla-2026-10-01.md`, ale ekstrakcja tekstowa tabeli **nie wystarcza do zwolnienia współrzędnych produkcyjnych**. W tej iteracji nie pobrano kopii PDF do repozytorium ani nie zatwierdzono symboli wizualnie. Brak zmian logiki. Następny krok: uzyskać czytelny rysunek/instrukcję dla 12.25, zweryfikować geometrię osi, a następnie przygotować tylko potwierdzone punkty do cross-checku z lokalnym przyrządem i maszyną.
