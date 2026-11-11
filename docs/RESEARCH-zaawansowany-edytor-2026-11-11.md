# Zaawansowany kreator mebla — research i etap wdrożenia

11.11.2026. Przegląd dokumentacji otwartych repozytoriów, bez uruchamiania ich aplikacji i bez przejmowania kodu. Deklaracje README nie są audytem poprawności produkcyjnej.

## Warte wykorzystania

| Repozytorium | Potwierdzone w dokumentacji | Kierunek dla Pan Stolarz |
|---|---|---|
| [BenchUp](https://github.com/BenchUp3D/editor) | Precyzyjne narzędzia Move/Rotate/Offset, snap, grupy, komponenty, wymiarowanie, schowek i cofanie; Rust/WASM/WebGPU | Dokładne transformacje zaznaczenia i manipulacja w centralnym widoku. Nie wymieniamy obecnego renderera ani modelu na inny silnik. |
| [Woodworking](https://github.com/dprojects/Woodworking/blob/master/README.md) | magicMove/magicResizer, narzędzia wierceń, powiązanie paneli z dokumentacją | Kontrolowane operacje na płytach i dalsza rozbudowa wierceń z jawną bazą pomiaru. |
| [Cabinet-Builder](https://github.com/RealBadVolf/Cabinet-Builder) | Rowki/wręgi, półki stałe i regulowane, otwory, lustrzane strony, warstwy DXF | W przyszłości wspólny model operacji technologicznych i rysunków. Katalogowe liczby z tego repo nie stają się automatycznie naszymi regułami. |
| [AIGenFurniture](https://github.com/yelloish6/AIGenFurniture-freecad-workbench) | Konfigurowalne skrzynki parametryczne, generacja struktury i pakietów; projekt oznaczony jako beta/MVP | Zestawy mebli powiązanych z gabarytami, zachowanie zmian po regeneracji. |
| [cabineteer](https://github.com/chemrich/cabineteer) | Walidacja projektu, katalogowe okucia, przekrój i zestawienia; wyraźnie oddziela projektowanie od CAM | Trwałe reguły i diagnostyka konstrukcji, bez przedstawiania obrysu DXF jako gotowych ścieżek CNC. |

Nie kopiowano kodu zależnego od licencji ani nie dodawano tych projektów do zależności aplikacji. Implementacja etapu jest własna, na istniejącym modelu Pan Stolarz.

## Zakres obecnego etapu

1. **Równe światła między zaznaczonymi częściami**, pionowo i poziomo: co najmniej trzy prostokątne luźne płyty; skrajne zostają na miejscu, różne grubości są uwzględnione. Ścieżka: Kreator → Części → zaznaczenie → Operacje. Całość cofa się jednym krokiem. Nowe przecięcie obwiedni albo przycięcie przez skos blokuje operację bez częściowego zapisu. Części korpusu i komór nadal edytuje ich własny edytor.
2. **Działania w edycji wymiaru na rysunku**: np. `(600-2*18)/3`, przecinek dziesiętny, znaki ×/÷, nawiasy i podgląd wyniku. Dopiero Zastosuj zmienia model. Bez wykonywania JavaScript. Działanie jest jednorazowym obliczeniem — nie jest trwałą zależnością między częściami. Zwykłe pola inspektora pozostają liczbowe.

## Dalsza kolejność

1. Wspólne definicje wierceń uchwytów, zawiasów i podpórek spięte z częścią w bibliotece oraz krótką dokumentacją.
2. Translacja grupy w XYZ i precyzyjne kopiowanie z podglądem operacji; bez zmieniania chronionych części korpusu.
3. Trwałe wiązania: odległość od krawędzi/elementu, równe światła utrzymywane po zmianie wymiarów, diagnostyka sprzecznych ograniczeń.
4. Połączenia konstrukcyjne i naddatki rowków/wręgów z jawną stroną obróbki; wspólna geometria, lista formatek i dokumentacja.
5. Rozbudowa okuć według aktualnych kart producentów, w tym drewniane skrzynki i podnośniki.

Cel UI: środek zawsze przeznaczony na projekt, narzędzia kontekstowe w istniejącym inspektorze, szczegóły technologii otwierane na żądanie. Nie rozciągamy formularza pod rysunkiem o kolejne długie sekcje.
