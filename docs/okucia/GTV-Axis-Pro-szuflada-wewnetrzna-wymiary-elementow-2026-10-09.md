# GTV Axis Pro — częściowy wymiarowy rysunek szuflady wewnętrznej

09.10.2026. Wizualny odczyt drukowanej strony 10 oficjalnej karty Axis Pro. To uzupełnienie danych o szufladach wewnętrznych, nie pełna specyfikacja formatek ani zwolnienie CNC.

## Źródło i fakty

- Producent: [GTV — karta techniczna Axis Pro](https://api2.gtv.com.pl/pimcore/assets/attachments/karta_techniczna/Axis_Pro_karta%20techniczna_3.pdf), drukowana s.10 (PDF: strona 10). Lokalna kopia: `docs/okucia/pdf/GTV-Axis-Pro-karta-4.pdf`; SHA-256 `fe6850956d9e1c6fbb6c865a1f2946fdc15caa5f8a4ffc91b7e949bdd225839c`.
- Nagłówek rysunku brzmi „Wymiary elementów szuflady wewnętrznej”. Legenda producenta definiuje `LW` jako wewnętrzną szerokość korpusu, a `R` jako wysokość panelu.
- Widok rozstrzelony pokazuje dwa oddzielne wymiary w poprzek rysowanych elementów: `LW−80` i `LW−100`. Rysunek nie nadaje tym wymiarom nazw części ani kodów SKU; nie podaje wartości `R`, pełnych wymiarów pozostałych elementów, materiału, grubości ani przypisania do wariantu/łącznika.
- To są adnotacje do części szuflady wewnętrznej, nie wymiary dna `LW−75 × NL−24` ani pleców standardowej szuflady Axis Pro. Nie utożsamiać ich z wcześniej odczytanym stalowym frontem Amix `LW−37`.

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
**Zależności:** nazwa i funkcja każdego elementu, exact SKU/rynek/rewizja, system frontu lub łącznika, materiał i grubość, zakresy `LW`/`R`, pozostałe wymiary cięcia oraz instrukcja montażu.  
**Mierzalne kryterium odbioru:** testy źródłowych danych zachowują osobno `LW−80` i `LW−100`, odwołują `LW` do światła wewnętrznego korpusu, nie wyliczają brakującego `R` ani SKU i nie emitują kompletnego BOM/CNC dla profilu z nierozstrzygniętym mapowaniem; po uzyskaniu identyfikacji części test sprawdza oba wymiary względem przypisanych elementów. Standardowy profil GTV pozostaje niezależnym wariantem.

## Granice i następny krok

Odczyt wizualny potwierdza nagłówek, definicje zmiennych i obydwa callouty. Nie potwierdza, która część nosi każdą nazwę warsztatową, czy są to wymiary cięcia, ani czy rysunek stosuje się do każdego SKU/wersji Axis Pro. Następnie uzyskać listę komponentów lub instrukcję montażu dla exact internal-drawer SKU i przypisać widoczne kształty do części. Do tego czasu GTV Axis Pro szuflada wewnętrzna pozostaje częściowo opisana i niezatwierdzona do produkcji.
