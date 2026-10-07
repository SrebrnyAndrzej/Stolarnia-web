# GTV Axis Pro — aktualna karta: wymiary części i zakres wzoru mocowania frontu

07.10.2026. Ponowny, wizualny odczyt 12-stronicowej karty technicznej GTV Axis Pro już zarchiwizowanej w repozytorium. To uzupełnienie materiału `GTV-Axis-Pro-P2O-wiercenia-2026-10-04.md`; nie jest implementacją ani zwolnieniem CNC.

## Źródło i zakres

Oficjalna karta techniczna producenta: [Axis Pro — karta techniczna](https://assets.gtv.com.pl/assets/attachments/karta_techniczna/Axis_Pro_karta%20techniczna_3.pdf). Ten sam plik jest przechowywany jako `docs/okucia/pdf/GTV-Axis-Pro-karta-4.pdf`; SHA-256 `fe6850956d9e1c6fbb6c865a1f2946fdc15caa5f8a4ffc91b7e949bdd225839c` i odpowiada wpisowi `GTV-Axis-Pro-karta-4` w `docs/okucia/sources.json`. Odczyt wizualny stron drukowanych 6–8 (PDF 7–9); strona 8 zawiera wprost wymiary części z płyty 16 mm.

## Fakty producenta

- Dno z płyty 16 mm: szerokość `LW − 75`, długość `NL − 24`.
- Plecy z płyty 16 mm: szerokość `LW − 87`. Tabela wysokości pleców: niski 84 mm, średni 116 mm, wysoki 167 mm, bardzo wysoki 199 mm. To wysokość drewnianej części, nie wysokość metalowego boku; karta podaje osobno wysokości boków 86/120/168/200 mm.
- Przykład kontrolny dla `LW=564 mm`, `NL=500 mm`: dno `489 × 476 mm`, plecy `477 × H mm`; H należy wybrać z powyższej tabeli dla rzeczywistego wariantu. Są to wymiary cięcia wskazanych części, a nie kompletny BOM.
- Rysunek izometryczny złożonej szuflady opisuje wymiar wzdłużny jako `NL + 10`. To różni się od `NL − 24` przypisanego do długości dna i nie może zastępować długości cięcia. Wcześniejszy odczyt dla Modern Box PRO w pliku `GTV-Modern-Box-PRO-wiercenia-2026-10-04.md` podawał dla tamtego rysunku `NL + 3`; nie przenosić tej wartości do Axis Pro. Jeżeli karta Axis Pro ma być używana do wymiaru złożenia, trzeba jeszcze zweryfikować bazę wymiaru na rysunku i odróżnić obrys części od długości prowadnicy.
- Karta pokazuje odrębne schematy mocowania frontu dla niskiej szuflady H=86 (drukowana s.6), średniej H=120, wysokiej H=168 i bardzo wysokiej H=200 (drukowana s.7). Nie kopiować jednej sekwencji do innych wysokości.
- Widoki frontów pokazują `Ø2` oraz położenie dolnego otworu minimum 47,5 mm od dolnej krawędzi. Dla H=86 i H=120 pokazana jest sekwencja pionowa 32 mm; dla H=168/H=200 występuje układ 32/64/32 mm nad dolnym poziomem. Karta opisuje więc średnicę symbolicznie, ale nie podaje głębokości, tolerancji ani kompletnego zwymiarowania osi X i bazy dla operacji CNC.
- Widoki pleców pokazują osobny układ otworów i nie należy łączyć go z układem frontu. Sam rysunek nie wystarcza do ustalenia wszystkich parametrów otworu, jego głębokości i technologii dla konkretnego SKU mocowania.

## Wnioski dla silnika i dokumentacji

| Priorytet | Problem / dowód | Zalecenie dla Claude | Zależności | Kryterium odbioru |
|---|---|---|---|---|
| P0 | Wysokość drewnianych pleców (84/116/167/199) różni się od wysokości metalowych boków (86/120/168/200). | Przechowywać osobno `sideHeight` i `backPanelHeight`; nie wyliczać pleców z nazwy wariantu ani wysokości boku. | Dokładny wariant Axis Pro i grubość 16 mm. | Testy 4 wariantów wybierają wysokość pleców z tabeli; H=120 nie daje pleców 120 mm. |
| P0 | Dno `NL−24`, plecy `LW−87`, a wymiar złożenia `NL+10` opisują różne obiekty. | Nadać każdemu wymiarowi rolę i bazę; nie używać wymiaru obrysu złożenia jako długości formatki. | Definicja `LW`, `NL`, orientacji części i założeń montażowych. | Dla przykładu 564/500 raport zawiera osobno dno 489×476, plecy 477×H i wymiar złożenia oznaczony na rysunku; żadna wartość nie nadpisuje innej. |
| P0 przed CNC | Karta rozróżnia fronty H=86/120/168/200 i opisuje Ø2, minima oraz rozstawy, lecz brak głębokości, tolerancji i kompletnej współrzędnej poziomej/base axis. | Przechowywać częściowy wzór frontu jako referencyjny, z brakującymi polami i statusem „niezatwierdzony do CNC”; zero interpolowania braków. | Kod złącza/frontu, pozycja osi X, rodzaj i głębokość, tolerancja, kierunek/baza wiercenia, próba montażowa. | Eksport CNC jest zablokowany, dopóki każda operacja ma część, bazę, współrzędne, Ø, głębokość, tolerancję i potwierdzony SKU. |

### Granice wniosku

To wiarygodne źródło wymiarów formatek i schematów montażu, ale nie kompletny, zweryfikowany postprocesor ani plik do maszyny. Sformułowanie `Ø2` nie zwalnia otworu: potrzebne są parametry wiercenia i zgodność z konkretnym łącznikiem, materiałem oraz procesem. Wymiar `NL+10` dotyczy rysunku złożenia, a jego bazę należy utrzymać jako adnotację producenta, nie parametr cięcia.

## Status

Statyczny research-only; plik źródłowy już był w repozytorium, brak zmian aplikacji. Przed zwolnieniem CNC: niezależnie uzgodnić rysunek z SKU złącza frontu, potwierdzić bazę X/obróbkę z GTV lub próbą technologiczną oraz zweryfikować, czy wymiar złożenia `NL+10` ma zastosowanie w używanym układzie. Następny priorytet w kolejce: domknąć kody i geometrię mocowania frontu Axis Pro / Modern Box dla konkretnych zestawów albo przejść do analogicznego braku w Amix.
