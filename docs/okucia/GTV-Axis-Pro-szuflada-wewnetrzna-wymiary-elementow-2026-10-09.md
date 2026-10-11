# GTV Axis Pro — częściowy wymiarowy rysunek szuflady wewnętrznej

09.10.2026. Wizualny odczyt drukowanej strony 10 oficjalnej karty Axis Pro. To uzupełnienie danych o szufladach wewnętrznych, nie pełna specyfikacja formatek ani zwolnienie CNC.

## Źródło i fakty

- Producent: [GTV — karta techniczna Axis Pro](https://api2.gtv.com.pl/pimcore/assets/attachments/karta_techniczna/Axis_Pro_karta%20techniczna_3.pdf), drukowana s.10 (PDF: strona 10). Lokalna kopia: `docs/okucia/pdf/GTV-Axis-Pro-karta-4.pdf`; SHA-256 `fe6850956d9e1c6fbb6c865a1f2946fdc15caa5f8a4ffc91b7e949bdd225839c`.
- Nagłówek rysunku brzmi „Wymiary elementów szuflady wewnętrznej”. Legenda producenta definiuje `LW` jako wewnętrzną szerokość korpusu, a `R` jako wysokość panelu.
- Widok rozstrzelony pokazuje dwa oddzielne wymiary w poprzek rysowanych elementów: `LW−80` i `LW−100`. Rysunek nie nadaje tym wymiarom nazw części ani kodów SKU; nie podaje wartości `R`, pełnych wymiarów pozostałych elementów, materiału, grubości ani przypisania do wariantu/łącznika.
- To są adnotacje do części szuflady wewnętrznej, nie wymiary dna `LW−75 × NL−24` ani pleców standardowej szuflady Axis Pro. Nie utożsamiać ich z wcześniej odczytanym stalowym frontem Amix `LW−37`.

### Potwierdzone zestawy zakupowe szuflady wewnętrznej — bez geometrii formatek

11.10.2026. W bieżącej karcie technicznej GTV Axis Pro, drukowana s.4 (PDF s.4), oraz na oficjalnych kartach produktów potwierdziłem indeksy zestawów A–D w kolorze czarnym i część ich składu:

| Wariant | Indeks GTV (czarny) | Skład z karty produktu | Co to potwierdza / ograniczenie |
|---|---|---|---|
| A, niski | `PB-AXISPRO-ZESWEW-A2` | `PB-AXISPRO-PANELWEW-110` + `PB-AXISPRO-INVIGO` | Karta nazywa zestaw panelem i złączkami; kod `INVIGO` nie został przypisany do kodu złączki z karty technicznej. |
| B, średni | `PB-AXISPRO-ZESWEW-B2` | `PB-AXISPRO-PANELWEW-95` + `PB-AXISPRO-WEWMOCB` | Karta opisuje panel H=95 mm i złączki; katalog klasyfikuje łącznik B jako H=120 mm. To różne elementy/wysokości, nie wolno ich scalać w jedną wartość. |
| C, wysoki | `PB-AXISPRO-ZESWEW-C2` | `PB-AXISPRO-PANELWEW-110` + `PB-AXISPRO-WEWMOCC` | Zestaw zawiera panel i łącznik; katalog klasyfikuje C jako H=168 mm, podczas gdy panel ma H=110 mm. |
| D, bardzo wysoki | `PB-AXISPRO-ZESWEW-D2` | `PB-AXISPRO-PANELWEW-110` + `PB-AXISPRO-WEWMOCD` | Zestaw zawiera panel i łącznik; katalog klasyfikuje D jako H=200 mm, podczas gdy panel ma H=110 mm. |

Źródła producenta: [karta techniczna Axis Pro, PDF](https://assets.gtv.com.pl/assets/attachments/karta_techniczna/Axis_Pro_karta%20techniczna_3.pdf) (tabela indeksów i wymiary elementów, str. 3–4); [zestaw A2](https://gtv.com.pl/en/produkt/PB-AXISPRO-ZESWEW-A2/), [zestaw B2](https://gtv.com.pl/en/produkt/PB-AXISPRO-ZESWEW-B2/), [zestaw C2](https://gtv.com.pl/en/produkt/PB-AXISPRO-ZESWEW-C2/), [zestaw D2](https://gtv.com.pl/en/produkt/PB-AXISPRO-ZESWEW-D2/). Numery indeksów zestawów i rozbicie składników są danymi zakupowymi; nie identyfikują dwóch wymiarów `LW−80` i `LW−100` na rysunku formatek.

### Doprecyzowanie źródeł dla złączki w zestawie A2 (11.10.2026)

Porównanie oficjalnych źródeł producenta ujawniło trzy różne zapisy komponentu dla czarnego zestawu `PB-AXISPRO-ZESWEW-A2`:

| Źródło GTV | Zapis widoczny dla komponentu | Co źródło potwierdza | Ograniczenie |
|---|---|---|---|
| [Karta zestawu A2 — PL](https://gtv.com.pl/produkt/PB-AXISPRO-ZESWEW-A2/) | `PB-AXISPRO-WEWMOCA` | Zestaw A2, kolor czarny, panel 110 mm; opis dodatkowy podaje panel `PANELWEW-110` i złączkę `WEWMOCA`. | Kod złączki nie ma sufiksu koloru, choć indeks zestawu kończy się `A2`. |
| [Karta zestawu A2 — EN](https://gtv.com.pl/en/produkt/PB-AXISPRO-ZESWEW-A2/) | `PB-AXISPRO-INVIGO` | Ten sam indeks zestawu A2, czarny, panel 110 mm. | Inna nazwa komponentu niż na polskiej karcie; brak producentowego potwierdzenia, że `INVIGO` jest aliasem kodu `WEWMOCA`. |
| [Kwartalnik GTV PL Q1+Q2 2026](https://gtv.com.pl/wp-content/uploads/2026/05/PL-Kwartalnik_AM_Q2.pdf) i [EN](https://gtv.com.pl/wp-content/uploads/2026/05/EN-Kwartalnik_AM_Q2.pdf) | osobna pozycja `PB-AXISPRO-WEWMOCA2`, „Złączka frontu wewnętrznego, H=86 mm”; zestaw A2 opisany jako panel+złączki, H=110 mm | W zestawieniu producent używa dla czarnej niskiej złączki indeksu z sufiksem `2` i rozdziela H złączki (86) od wysokości panelu/zestawu (110). | Kwartalnik nie wskazuje wprost, że kod komponentu z listy jest składnikiem A2; bezpośrednia karta A2 nadal pokazuje kod bez sufiksu albo `INVIGO`. Otwieranie obu dużych PDF-ów w przeglądarce nie powiodło się z powodu limitu rozmiaru; odczyt tekstu pochodzi z indeksowanego wyniku oficjalnego serwisu GTV. |

Oficjalna [karta samej czarnej złączki `PB-AXISPRO-WEWMOCA2`](https://gtv.com.pl/produkt/PB-AXISPRO-WEWMOCA2/) potwierdza indeks, przeznaczenie do niskiej szuflady Axis Pro, H=86 mm, kolor czarny i opakowanie 2 szt. Starszy oficjalny [katalog techniczny Axis Pro](https://api2.gtv.com.pl/pimcore/assets/attachments/karta_techniczna/Karta_techniczna_2020_206-213.pdf), drukowana s.205 katalogu (PDF, strona 2), używa `PB-AXISPRO-WEWMOCA` dla niskiej złączki antracytowej oraz `...WEWMOCA1` dla białej. Ten starszy dokument pokazuje historyczne indeksowanie bez sufiksu dla antracytu, ale nie dowodzi powiązania go z czarnym A2 ani równoważności z `INVIGO`.

**Wniosek:** nie scalać automatycznie `INVIGO`, `WEWMOCA` i `WEWMOCA2` w jeden komponent ani nie kopiować indeksu z karty zestawu do BOM bez jawnej mapy źródeł/rewizji. Przechowywać surową nazwę/kod wraz z URL-em, językiem, datą odczytu, SKU zestawu i kolorem. Dla zakupu czarnego A2 bieżąca karta komponentu wskazuje na `WEWMOCA2`, ale skład zestawu nie jest jednoznacznie potwierdzony — status relacji komponentowej pozostaje `unknown` do potwierdzenia przez GTV lub etykietę/opakowanie.

**Priorytet:** P1 dla wiarygodnego BOM; P0 przed automatycznym zakupem podzespołu lub generowaniem CNC z komponentów. **Zależności:** aktualna wersja karty zestawu, język/rynek, indeks koloru, potwierdzenie relacji komponentu 86 mm do panelu 110 mm. **Mierzalny odbiór:** test danych zachowuje wszystkie trzy zapisy jako źródłowe obserwacje i nie tworzy aliasu/relacji BOM ani nie zamawia podzespołu, dopóki producent lub etykieta dokładnego zestawu nie potwierdzi mapowania. Wymiary panelu i złączki pozostają osobnymi polami.

### Starsza karta daje wartości `R`, ale wymaga związania z rewizją/SKU

W starszym pliku producenta [Axis_Pro_karta techniczna 06_24_44.pdf](https://api2.gtv.com.pl/pimcore/assets/attachments/karta_techniczna/Axis_Pro_karta%20techniczna%2006_24_44.pdf), drukowana s.4, rysunki zestawów wewnętrznych pokazują `R=110` dla A, `R=95` dla B, `R=110` dla C i `R=110` dla D. Ten sam arkusz pokazuje osobno wysokości szuflad/łączników A–D: H=86/120/168/200 mm. Odczyt diagramu jest zgodny z późniejszymi kartami zakupowymi co do rozdzielenia wysokości panelu i elementu systemu, ale stary dokument oraz publiczne strony nie dowodzą, że wartości `R` nadal dotyczą każdego obecnego koloru, indeksu i wariantu mechanizmu.

**Status wartości:** traktować `R(A–D)=110/95/110/110 mm` jako producentowy wymiar z konkretnego, starszego pliku, nie jako uniwersalną regułę aktywnego profilu. Zachować rewizję, stronę, dokładny SKU/kolor i stan potwierdzenia w rekordzie. Dla bieżących czarnych zestawów A2–D2 nie generować cięć ani CNC wyłącznie na podstawie tej starszej tabeli; brak zgodności rewizji musi pozostać jawny aż do porównania bieżącej instrukcji i próbnego zestawu. Wartość `R` nie rozstrzyga szerokości `LW−80`/`LW−100` ani ich przypisania do części.

**Wniosek dla modelu danych:** przechowywać osobno wysokość panelu (`95`/`110`), wysokość łącznika A/B/C/D oraz indeksy składowe. Nie wyprowadzać z indeksu zestawu wymiarów cięcia, szerokości `LW`, otworów ani dopuszczalnego mechanizmu. Skład zakupowy dla czarnych wariantów jest potwierdzony częściowo, lecz dla A pozostaje niespójna nazwa `INVIGO` vs rodzina indeksów `WEWMOC`; także kompletność zestawu i kolorów innych niż czarny należy potwierdzać dla dokładnego zamówienia.

## Zalecenie dla Claude

**Problem:** dokumentacja i dane Axis Pro zawierają profil standardowej szuflady, ale model GTV nie ma odrębnej, źródłowo powiązanej reguły szuflady wewnętrznej. Pominięcie tych etykiet prowadzi do użycia wymiarów szuflady z frontem; przypisanie ich domysłem do pleców/frontu może z kolei wytworzyć błędne formatki.

**Proponowane zachowanie:** utrzymać te dwa callouty jako częściowe, odrębne wymiary elementów profilu „Axis Pro / szuflada wewnętrzna”, ze źródłem, stroną i statusem `partial/unknown`. Nie wstawiać jeszcze do produkcyjnych pól `back`, `front` ani BOM-u, dopóki nie potwierdzono mapowania wymiaru do nazw/SKU części, wariantu mechanizmu i zakresu `LW` oraz `R`. Brak danych ma być jawny; nie dziedziczyć po cichu reguł standardowego Axis Pro.

| Pole w źródle | Odczyt | Status |
|---|---|---|
| `LW` | wewnętrzna szerokość korpusu | definicja producenta |
| `R` | wysokość panelu | definicja producenta, bez wartości liczbowej |
| pierwszy element poprzeczny | `LW−80` | callout widoczny; nazwa/SKU i pełna interpretacja wymagają potwierdzenia |
| drugi element poprzeczny | `LW−100` | callout widoczny; nazwa/SKU i pełna interpretacja wymagają potwierdzenia |

**Priorytet:** P1 dla kompletności projektu; P0 przed wygenerowaniem BOM/CNC z tego profilu.  
**Zależności:** nazwa i funkcja części z rysunku `LW−80`/`LW−100`, exact SKU/rynek/rewizja i kolor, system frontu/łącznika, materiał i grubość, zakresy `LW`/`R`, pozostałe wymiary cięcia oraz instrukcja montażu. Zweryfikowane indeksy zestawu A2–D2 i starsze wartości `R` nie zamykają tych zależności.
**Mierzalne kryterium odbioru:** testy źródłowych danych zachowują osobno `LW−80` i `LW−100`, panelowe `R` wraz z rewizją źródła, wysokość łącznika oraz skład zestawu zakupowego. Nie przenoszą starszego `R` do bieżącego SKU bez potwierdzenia rewizji i nie emitują kompletnego BOM/CNC z nierozstrzygniętym mapowaniem. Dla A2 test ujawnia konflikt `INVIGO`/`WEWMOCA`; dla B2–D2 nie scala panelowego R 95/110 mm z H 120/168/200 mm łącznika. Po uzyskaniu zgodnej instrukcji i SKU test sprawdza wymiary względem przypisanych elementów. Standardowy profil GTV pozostaje niezależnym wariantem.

## Granice i następny krok

Odczyt wizualny potwierdza nagłówek, definicje zmiennych i obydwa callouty. Karty produktowe potwierdzają wybrane czarne indeksy zakupowe A2–D2 i ich deklarowane składowe; starszy arkusz podaje `R`, ale nie potwierdza stosowalności jego rewizji do obecnych SKU. Nie ustalono przypisania `LW−80`/`LW−100` do części ani nie rozstrzygnięto konfliktu `INVIGO`/`WEWMOCA`. Następnie porównać właściwą instrukcję/current product revision z kartą 06_24 i zestawem warsztatowym, przypisać elementy i potwierdzić próbą. Do tego czasu GTV Axis Pro szuflada wewnętrzna pozostaje częściowo opisana i niezatwierdzona do produkcji.
