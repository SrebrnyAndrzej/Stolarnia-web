# GTV Axis Pro i Modern Box Pro: elementy szuflady z płyty 16 mm

**Status:** źródła producenta sprawdzone tekstowo; wymiarów wyciętych z rysunku nie zatwierdzono do produkcji bez wizualnej kontroli rysunku i próby warsztatowej.  
**Zakres:** wyłącznie porównanie dokumentacji GTV dla elementów z płyty 16 mm. Nie jest to walidacja konfiguratora ani program CNC.

## Ustalenia ze źródeł

Instrukcja techniczna **AXIS PRO** GTV ma osobną sekcję „Wymiary elementów ścianki tylnej i dna szuflady dla płyty 16 mm” (PDF, s. 8). Tabela opisuje warianty boku/typu i podaje wysokości H: niski 84 mm, średni 116 mm, wysoki 167 mm oraz bardzo wysoki 199 mm. Rysunki pokazują osobne wymiary ścianki tylnej i dna oraz definiują oznaczenia `A`, `B` i `NF`; nie należy traktować samej wysokości boku handlowego jako wysokości formatki pleców.

Osobna instrukcja **MODERN BOX PRO** GTV również ma sekcję dla płyty 16 mm (PDF, s. 7). Tabela podaje: A / niski H=84 mm, B / średni H=135 mm, C / wysoki H=199 mm, D / wysoki H=167 mm; obok tabela `X` podaje odpowiednio 110, 165, 229 i 197 mm. Rysunek rozdziela ściankę tylną i dno, podaje ich wymiary zależne od `LW` (wewnętrzna szerokość korpusu) i `NL` (nominalna długość prowadnicy), a instrukcja pokazuje przykręcenie złączek do ścianki przed jej zapięciem w szufladę.

**Potwierdzona różnica:** środkowy wariant płyty opisany jako 16 mm ma H=116 mm w dokumencie Axis Pro i H=135 mm w dokumencie Modern Box Pro. Nie wolno przenosić między rodzinami nazwy wariantu, H ani reguły rozkroju. Zewnętrzne wysokości boków szuflady, wysokości tylnej formatki oraz wysokości gotowych systemów to różne wielkości i muszą mieć osobne pola/definicje.

## Wniosek dla konfiguratora

**Problem:** wpisanie jednej ogólnej formuły „GTV 16 mm” grozi pomieszaniem profili Axis Pro i Modern Box Pro, zwłaszcza wariantu średniego. Rysunki producenta są rodzinne, zależne od wejść i orientacji; sam tekst wyciągnięty z PDF nie wystarcza do bezpiecznego odwzorowania geometrii.

**Proponowane zachowanie:** kluczować reguły co najmniej po rodzinie oraz rewizji źródła: `AXIS_PRO` albo `MODERN_BOX_PRO`, typie szuflady, płycie 16 mm i długości prowadnicy. Zachować oddzielnie wysokość systemu/boku, wysokość płyty tylnej i wymiary dna. Brak zgodności źródła lub nieobsługiwany wariant ma zwracać `unknown` i blokować kompletne wydanie produkcyjne. Własności komponentu katalogowego nie zastępują rysunku obróbki.

**Priorytet:** P1 dla doboru oraz zestawienia materiałów; P0 przed zatwierdzeniem rozkroju, wierceń lub wydania produkcyjnego z tym profilem.

**Zależności:** dokładny system i rewizja instrukcji; niski/średni/wysoki wariant (z rozróżnieniem C/D MBPRO); grubość oraz rodzaj płyty; `LW`; `NL`; ewentualne podwyższenie relingiem; strona i orientacja części.

**Mierzalne kryteria odbioru:** (1) przypadek Axis Pro, średni, płyta 16 mm zachowuje źródłowe H=116 mm; (2) Modern Box Pro, średni, zachowuje H=135 mm; (3) typy MBPRO C i D nie są scalane mimo podobnego opisu „wysoka”; (4) wyjście formatek przechowuje osobno symboliczne wejścia `LW`/`NL` i identyfikator strony/rysunku; (5) test nierozpoznanej rodziny lub typu potwierdza `unknown`, bez domyślnego wyboru wzoru i bez zatwierdzenia CNC; (6) próbny montaż zapisuje rewizję instrukcji i pomiar kontrolny formatki przed oznaczeniem profilu jako zweryfikowanego produkcyjnie.

## Źródła pierwotne

- GTV, [AXIS PRO — karta techniczna/instrukcja](https://api2.gtv.com.pl/pimcore/assets/attachments/karta_techniczna/Axis_Pro_karta%20techniczna_3.pdf), s. 8 (PDF s. 8; ekstrakcja tekstu pokazuje sekcję płyty 16 mm i H: 84/116/167/199); s. 7 zawiera rysunki montażowe korpusu.
- GTV, [MODERN BOX PRO — instrukcja](https://api2.gtv.com.pl/pimcore/assets/attachments/karta_techniczna/Modern_Box_PRO__instrukcja_fina%C5%82.pdf), s. 7 (PDF s. 7; ekstrakcja tekstu pokazuje H: 84/135/199/167 i X: 110/165/229/197), s. 6 zawiera rysunki rozkroju z `LW` i `NL` oraz sekwencję montażu pleców.
- GTV, [strona produktu Axis Pro KPL300B](https://gtv.com.pl/produkt/PB-AXISPRO-KPL300B/) — potwierdza skład zestawu i ogólną rodzinę, lecz nie zastępuje tabeli wymiarowej.

**Ograniczenia dowodu:** odczyt tekstowy identyfikuje tabele i symbole, ale nie wystarcza do odtworzenia wszystkich kierunków/odnośników wymiarów z grafiki. Nie przepisano dlatego nieweryfikowanych osiowych równań na formatki ani tolerancji. Nie sprawdzono fizycznych części ani konkretnej serii zakupowej zakładu. Przed produkcyjnym mapowaniem należy wizualnie odczytać rysunki źródłowe i wykonać próbny montaż.

## Punkt wznowienia

Na `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3` nie wykryto nowego commitu Claude. Następnie: jeśli brak zmian kodu, porównać osobne karty wymiarowe GTV dla dna/pleców albo przejść do następnego niezależnego obszaru z listy priorytetów. Nie wyprowadzać ukrytych wymiarów z renderów 3D ani nazw części.
