# GTV Axis Pro 18 mm — oddzielny profil materiałowy i nieprzenoszenie formuł 16 mm

Data sprawdzenia: 08.10.2026. Research dotyczy szuflad GTV Axis Pro z oznaczeniem wariantu dla korpusu/płyty 18 mm. Nie zatwierdza programu CNC.

## Źródła producenta

- [GTV — Axis Pro, zestaw 18 mm, PB-AXISPRO18-KPL500C1](https://gtv.com.pl/en/produkt/PB-AXISPRO18-KPL500C1/): karta SKU jawnie podaje „Appliance panel [mm]: 18”, długość 500 mm, wysokość boku 168 mm, Soft Close, obciążenie 40 kg, prowadnice/boki i łączniki pleców/frontu w zestawie; oferuje do pobrania osobną instrukcję oraz model STEP.
- [GTV — Axis Pro 18 mm bez frezowania](https://gtv.com.pl/sk/novinky/axis-pro-soft-close-18-mm-zasuvkovy-system-pre-dosku-18-mm-bez-frezovania-biela-a-siva/): producent opisuje system jako przeznaczony do płyty 18 mm i montażu bez frezowania. To informacja o kompatybilności systemu, nie formuła na wymiary dna/pleców.
- [GTV — karta techniczna Axis Pro 16 mm](https://assets.gtv.com.pl/assets/attachments/karta_techniczna/Axis_Pro_karta%20techniczna_3.pdf): osobna karta ma jawny nagłówek wymiarów elementów z płyty 16 mm i formuły dla tej grubości.

## Wnioski

- **Fakt:** producent publikuje osobne SKU `PB-AXISPRO18-…` z parametrem płyty 18 mm, a standardowa karta cięcia, do której dotychczas odsyła dokumentacja projektu, jawnie opisuje formatki z płyty 16 mm.
- **Granica dowodu:** nie odczytano i wizualnie nie zweryfikowano tutaj załączonej instrukcji/modelu 18 mm z kompletem wymiarów części i otworów. Nie zakładamy, że zmieniają się wszystkie wymiary; zakładamy jedynie, że nie ma podstaw, by bez weryfikacji przypisać SKU 18 mm profilowi 16 mm.
- **Fakt wariantowy:** karta standardowego produktu pokazuje ekstra niski bok 69 mm (`PB-AXISPRO-KPL69-…`), a produkt P2O w SKU `PB-AXISPRO-P2O-KPL…` oraz instrukcja P2O identyfikują swoje warianty niskie jako H=86 mm. Nie wolno składać jednej listy wysokości z wariantów otwierania bez potwierdzenia SKU. (Standardowy produkt: [GTV, PB-AXISPRO-KPL69-400-10](https://gtv.com.pl/produkt/PB-AXISPRO-KPL69-400-10/); P2O: [GTV, PB-AXISPRO-P2O-KPL300A2](https://gtv.com.pl/produkt/PB-AXISPRO-P2O-KPL300A2/); instrukcja P2O jest opisana w nocie Axis Pro P2O.)
- **Fakt wariantowy:** producent podaje dla standard Soft Close nominalne długości 250–600 mm, podczas gdy strona zestawu P2O podaje 300–550 mm. Dozwolone długości są cechą konkretnego SKU/trybu, a nie samej marki Axis Pro.

## Zalecenia dla modelu katalogowego

| Priorytet | Problem / dowód | Proponowane zachowanie | Zależności | Kryterium odbioru |
|---|---|---|---|---|
| P0 | Etykieta rodziny Axis Pro nie wystarcza do wybrania formuł: producent rozróżnia płytę 16 i 18 mm, Soft Close i P2O oraz warianty wysokości/długości. | Kluczować profil obróbki co najmniej dokładnym SKU/rewizją, grubością płyty, rodzajem otwierania, wysokością boku i NL; żadnego fallbacku do „najbliższego Axis Pro”. | Kompletna oficjalna instrukcja/karta dla `AXISPRO18`, dokładny model zestawu oraz rozstrzygnięcie, czy jego geometria cięcia różni się od 16 mm. | Negatywne testy: SKU 18 mm nie wybiera profilu 16 mm; P2O nie dostaje NL 250/600 z profilu Soft Close; wysokość 69 nie jest automatycznie utożsamiona z P2O low 86. |
| P0 przed CNC | Dostępność STEP i deklaracja „bez frezowania” nie dostarczają tolerancji, bazy ani kompletnej technologii wierceń. | Trzymać model 3D jako podgląd geometrii/konfliktów, a operacje CNC wyłącznie ze zweryfikowanej dokumentacji wymiarowej oraz próby. | Czytelny rysunek techniczny, baza/krawędź, Ø, głębokość, tolerancja i test montażowy. | Status CNC pozostaje „niezweryfikowany” aż każde wymagane pole źródła, rewizji i operacji jest wypełnione; sam plik STEP nie zwalnia części. |

## Następny krok

Pozyskać i wizualnie zweryfikować załączoną instrukcję Axis Pro 18 mm dla konkretnego wariantu, porównać formatki i otwory do 16 mm oraz sprawdzić tabelę SKU/długości P2O kontra Soft Close. Do tego czasu w aplikacji/research data ma być jawny brak profilu 18 mm, a nie skopiowane parametry wariantu 16 mm. Dokumentacja-only; bez zmian aplikacji i testów logiki.
