# GTV Axis Pro i Modern Box Pro: elementy szuflady z płyty 16 mm

**Status:** źródła producenta sprawdzone tekstowo; wymiarów wyciętych z rysunku nie zatwierdzono do produkcji bez wizualnej kontroli rysunku i próby warsztatowej.  
**Zakres:** wyłącznie porównanie dokumentacji GTV dla elementów z płyty 16 mm. Nie jest to walidacja konfiguratora ani program CNC.

## Ustalenia ze źródeł

Instrukcja techniczna **AXIS PRO** GTV ma osobną sekcję „Wymiary elementów ścianki tylnej i dna szuflady dla płyty 16 mm” (PDF, s. 8). Tabela opisuje warianty boku/typu i podaje wysokości H: niski 84 mm, średni 116 mm, wysoki 167 mm oraz bardzo wysoki 199 mm. Rysunki pokazują osobne wymiary ścianki tylnej i dna oraz definiują oznaczenia `A`, `B` i `NF`; nie należy traktować samej wysokości boku handlowego jako wysokości formatki pleców.

Osobna instrukcja **MODERN BOX PRO** GTV również ma sekcję dla płyty 16 mm (PDF, s. 7). Tabela podaje: A / niski H=84 mm, B / średni H=135 mm, C / wysoki H=199 mm, D / wysoki H=167 mm; obok tabela `X` podaje odpowiednio 110, 165, 229 i 197 mm. Rysunek rozdziela ściankę tylną i dno, podaje ich wymiary zależne od `LW` (wewnętrzna szerokość korpusu) i `NL` (nominalna długość prowadnicy), a instrukcja pokazuje przykręcenie złączek do ścianki przed jej zapięciem w szufladę.

**Potwierdzona zgodność i różnica:** niezależne rysunki obu rodzin dla płyty 16 mm podają te same relacje szerokości/głębokości: dno `(LW−75) × (NL−24)` i plecy `(LW−87) × H`. Tabele wysokości nie są jednak takie same: wariant średni ma H=116 mm w AXIS PRO i H=135 mm w MODERN BOX PRO; dodatkowo oznaczenia MBPRO C=199 i D=167 nie odpowiadają prostemu sortowaniu po literze. Można współdzielić obliczenie tylko wtedy, gdy źródła, materiał, wejścia oraz testy są osobno przypięte do obu profili; nie wolno użyć wspólnego, niezweryfikowanego profilu rodzinnego. Zewnętrzne wysokości boków szuflady, wysokości tylnej formatki oraz wysokości gotowych systemów to różne wielkości i muszą mieć osobne pola/definicje.

## Wniosek dla konfiguratora

**Problem:** wpisanie jednej ogólnej formuły „GTV 16 mm” grozi pomieszaniem profili Axis Pro i Modern Box Pro, zwłaszcza wariantu średniego. Rysunki producenta są rodzinne, zależne od wejść i orientacji; sam tekst wyciągnięty z PDF nie wystarcza do bezpiecznego odwzorowania geometrii.

**Proponowane zachowanie:** kluczować profil co najmniej po rodzinie i rewizji źródła: `AXIS_PRO` albo `MODERN_BOX_PRO`, wariancie szuflady, płycie 16 mm i NL. Wymiarom wspólnym można nadać tę samą formułę dopiero po zapisaniu dowodu niezależnie w obu profilach; ich provenance nie może zostać scalone. Zachować osobno wysokość systemu/boku, wysokość płyty tylnej i wymiary dna. Brak zgodności źródła lub nieobsługiwany wariant ma zwracać `unknown` i blokować kompletne wydanie produkcyjne. Własności komponentu katalogowego nie zastępują rysunku obróbki.

**Priorytet:** P1 dla doboru oraz zestawienia materiałów; P0 przed zatwierdzeniem rozkroju, wierceń lub wydania produkcyjnego z tym profilem.

**Zależności:** dokładny system i rewizja instrukcji; niski/średni/wysoki wariant (z rozróżnieniem C/D MBPRO); grubość oraz rodzaj płyty; `LW`; `NL`; ewentualne podwyższenie relingiem; strona i orientacja części.

**Mierzalne kryteria odbioru:** (1) test każdego profilu AXIS PRO/MBPRO potwierdza dno `(LW−75) × (NL−24)` oraz szerokość pleców `LW−87` tylko dla 16 mm; przykładowo LW=564, NL=500 daje dno 489×476 i plecy 477×H; (2) AXIS PRO średni wybiera H=116, MBPRO średni H=135; (3) typy MBPRO C i D nie są scalane mimo podobnego opisu „wysoka”; (4) wyjście formatek przechowuje osobno symboliczne wejścia `LW`/`NL`, rodzinę, wariant i identyfikator źródła/rysunku; (5) test nierozpoznanej rodziny, grubości lub typu potwierdza `unknown`, bez domyślnego wyboru wzoru i bez zatwierdzenia CNC; (6) próbny montaż zapisuje rewizję instrukcji i pomiar kontrolny formatki przed oznaczeniem profilu jako zweryfikowanego produkcyjnie.

## Źródła pierwotne

- GTV, [AXIS PRO — karta techniczna/instrukcja](https://api2.gtv.com.pl/pimcore/assets/attachments/karta_techniczna/Axis_Pro_karta%20techniczna_3.pdf), s. 8 (PDF s. 8; ekstrakcja tekstu pokazuje sekcję płyty 16 mm i H: 84/116/167/199); s. 7 zawiera rysunki montażowe korpusu.
- GTV, [MODERN BOX PRO — instrukcja](https://api2.gtv.com.pl/pimcore/assets/attachments/karta_techniczna/Modern_Box_PRO__instrukcja_fina%C5%82.pdf), s. 7 (PDF s. 7; ekstrakcja tekstu pokazuje H: 84/135/199/167 i X: 110/165/229/197), s. 6 zawiera rysunki rozkroju z `LW` i `NL` oraz sekwencję montażu pleców.
- Archiwalne odczyty rysunków źródłowych w repo: [`GTV-Axis-Pro-karta-aktualna-elementy-i-wiercenia-2026-10-07.md`](GTV-Axis-Pro-karta-aktualna-elementy-i-wiercenia-2026-10-07.md) oraz [`GTV-Modern-Box-PRO-wiercenia-2026-10-04.md`](GTV-Modern-Box-PRO-wiercenia-2026-10-04.md) — oba niezależnie podają wzory `(LW−75) × (NL−24)` dla dna i `LW−87` dla szerokości pleców, w granicach profilu 16 mm.
- GTV, [strona produktu Axis Pro KPL300B](https://gtv.com.pl/produkt/PB-AXISPRO-KPL300B/) — potwierdza skład zestawu i ogólną rodzinę, lecz nie zastępuje tabeli wymiarowej.

**Ograniczenia dowodu:** odczyt tekstowy identyfikuje tabele i symbole, ale nie wystarcza do odtworzenia wszystkich kierunków/odnośników wymiarów z grafiki. Nie przepisano dlatego nieweryfikowanych osiowych równań na formatki ani tolerancji. Nie sprawdzono fizycznych części ani konkretnej serii zakupowej zakładu. Przed produkcyjnym mapowaniem należy wizualnie odczytać rysunki źródłowe i wykonać próbny montaż.

## Punkt wznowienia

Na `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3` nie wykryto nowego commitu Claude. Następnie: jeśli brak zmian kodu, porównać osobne karty wymiarowe GTV dla dna/pleców albo przejść do następnego niezależnego obszaru z listy priorytetów. Nie wyprowadzać ukrytych wymiarów z renderów 3D ani nazw części.
