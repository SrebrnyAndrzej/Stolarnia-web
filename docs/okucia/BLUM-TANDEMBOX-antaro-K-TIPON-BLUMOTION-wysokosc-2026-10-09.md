# TANDEMBOX antaro K — odrębna wysokość zabudowy dla TIP-ON BLUMOTION

Sprawdzenie źródeł producenta: 09.10.2026. Zakres to wyłącznie wysokość zabudowy K w dwóch funkcjach TANDEMBOX antaro. Nie jest to mapa wierceń korpusu ani zwolnienie do CNC.

## Potwierdzone dane Blum

- Karta Blum **ID20048**, TANDEMBOX antaro K z BLUMOTION, podaje wymiar zabudowy **130,5 mm**. [Oficjalna specyfikacja ID20048](https://d2.blum.com/services/BEC003/iak0048-id20048_at_dok_bau_$spl-pl_$aof_$v7.pdf)
- Karta Blum **ID20235**, TANDEMBOX antaro K z TIP-ON BLUMOTION, podaje wymiar zabudowy **133,5 mm** oraz szczelinę frontu **2,5 mm** dla optymalnego działania. [Oficjalna specyfikacja ID20235](https://d2.blum.com/services/BEC003/iak0235-id20235_at_dok_bau_$spl-pl_$aof_$v7.pdf)
- Obie karty podają odrębne identyfikatory produktu i osobne warianty funkcji. Wspólna nazwa rodziny, wysokość nominalna K ani długość prowadnicy nie wystarczają więc do wybrania wymiaru zabudowy.
- Oficjalna polska strona pobrań TANDEMBOX obecnie indeksuje instrukcję montażu szuflady z datą 08.07.2026 i osobne pomoce zamawiania z datą 23.06.2026. [Blum PL — TANDEMBOX, pobrania](https://www.blum.com/pl/pl/products/boxsystems/tandembox/downloads-videos/)

Różnica między kartami K wynosi **3 mm**. To fakt z dwóch kart producenta, nie tolerancja montażowa ani zalecany zapas kolizji.

## Znaczenie dla projektu

**Problem:** jeśli konfigurator wysokości/kolizji wybiera jeden wymiar K dla całej rodziny TANDEMBOX antaro, wariant TIP-ON BLUMOTION może być modelowany z geometrią zabudowy różniącą się od standardowej karty BLUMOTION. Sama nazwa rodziny nie określa też szczeliny frontu wymaganej przez kartę TIP-ON.

**Proponowane zachowanie:** w danych wariantu wiązać wymiar zabudowy i wymagania frontu z dokładnym identyfikatorem/wariantem funkcji. Przy nierozstrzygniętym ID lub trybie otwierania nie używać domyślnej wartości K. W obliczaniu prześwitów i wizualizacji używać tego samego przypiętego wariantu, który występuje w BOM i dokumentacji projektu.

**Priorytet:** P1 dla modelu i walidacji kolizji; P0, jeśli system obecnie generuje wysokości zabudowy lub rysunki warsztatowe dla TIP-ON na podstawie wspólnej reguły K.

**Zależności:** rozpoznanie ID/trybu otwierania dokładnej prowadnicy; zdefiniowanie, czy „wymiar zabudowy” jest wysokością minimalną, czy nominalnym wymiarem montażowym w modelu projektu; odczyt pozostałych wysokości z kart tego samego wariantu.

**Mierzalne kryterium odbioru:** testy katalogu potwierdzają `ID20048/K → 130.5 mm` i `ID20235/K → 133.5 mm`; nieznany wariant nie zwraca żadnego z tych wymiarów domyślnie. Walidacja kolizji przy zmianie standard BLUMOTION ↔ TIP-ON BLUMOTION przelicza wysokość o 3 mm i nie zmienia pozostałych wariantów. Dla ID20235 UI/raport zachowuje również warunek szczeliny 2,5 mm, bez przedstawiania go jako luzu dla całej rodziny.

## Granice dowodu

Odczyt pochodzi z oficjalnych kart producenta widocznych 09.10.2026. Nie pobierano nowych lokalnych kopii PDF ani nie porównywano ich rewizji z kartoteką zakupową zakładu. Nie zweryfikowano, czy aplikacja ma już osobne modele wysokości; wniosek dotyczy wymaganej separacji danych, a nie zgłoszonego błędu kodu. Nie ma tu współrzędnych wierceń, tolerancji, zakresu kolizji ani danych o rzeczywistym SKU kupowanym przez firmę. Nie zwalniać żadnych operacji CNC na podstawie tej noty.

## Punkt wznowienia

Na świeżym `origin/main` w rewizji `8230275ad6dea52109f581c793bdd8d6f08684d3` nie było nowych commitów Claude. Badanie poszerza istniejący materiał `BLUM-TANDEMBOX-antaro-M-plecy-i-prowadnice-2026-10-04.md` o nowy, osobno potwierdzony wariant wysokości K; nie zastępuje danych z katalogu 2024/2025 ani nie dopisuje nic do `reguly-szuflad.json`. Następny temat okuć: pozyskać i wizualnie sprawdzić oficjalną kartę/instrukcję dla dokładnego GTV Axis Pro 18 mm (wpis `GTV-Axis-Pro-18mm-oddzielny-profil-techniczny-2026-10-08.md`) lub konkretny wzór mocowania pleców GTV; nie przenosić formuł LEGRABOX/TANDEMBOX między systemami.
