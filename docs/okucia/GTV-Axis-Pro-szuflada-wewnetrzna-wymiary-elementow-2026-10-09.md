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
**Zależności:** nazwa i funkcja części z rysunku `LW−80`/`LW−100`, exact SKU/rynek/rewizja i kolor, system frontu/łącznika, materiał i grubość, zakresy `LW`/`R`, pozostałe wymiary cięcia oraz instrukcja montażu. Zweryfikowane indeksy zestawu A2–D2 nie zamykają tych zależności.
**Mierzalne kryterium odbioru:** testy źródłowych danych zachowują osobno `LW−80` i `LW−100`, wysokość panelu i wysokość łącznika oraz skład zestawu zakupowego, nie wyliczają brakującego `R` i nie emitują kompletnego BOM/CNC z nierozstrzygniętym mapowaniem. Dla A2 test ujawnia nierozstrzygnięty komponent `INVIGO`; dla B2–D2 nie scala wysokości panelu 95/110 mm z wysokością łącznika B/C/D. Po uzyskaniu pełnej identyfikacji części test sprawdza wymiary względem przypisanych elementów. Standardowy profil GTV pozostaje niezależnym wariantem.

## Granice i następny krok

Odczyt wizualny potwierdza nagłówek, definicje zmiennych i obydwa callouty. Karty produktowe potwierdzają wybrane czarne indeksy zakupowe A2–D2 i ich deklarowane składowe, lecz nie wiążą ich z wymiarami `LW−80`/`LW−100`, nie rozstrzygają komponentu `INVIGO` ani nie potwierdzają, że podane szerokości są wymiarami cięcia dla każdego SKU. Następnie uzyskać rysunek/instrukcję montażu składowych dokładnego zestawu i przypisać widoczne kształty do części. Do tego czasu GTV Axis Pro szuflada wewnętrzna pozostaje częściowo opisana i niezatwierdzona do produkcji.
