# GTV Modern Box PRO — rozkrój i mocowania wariantów

04.10.2026. Odczyt wizualny źródłowej instrukcji GTV `docs/okucia/pdf/GTV-Modern-Box-Pro-instrukcja.pdf`, strony 6–7/10. Rejestr źródeł: `docs/okucia/sources.json`, pobrano 23.09.2026. Zdalny `origin/main` na wejściu: 8576086; brak nowych commitów Claude. Materiał doprecyzowuje dane, nie implementuje ich i nie zatwierdza kompletu CNC.

## Dane potwierdzone w rysunku

### Elementy skrzynki z płyty 16 mm — str.7

- Dno: `(LW−75) × (NL−24)`.
- Plecy: `(LW−87) × H`; tabela H: A=84, B=135, C=199, D=167 mm. Uwaga: 199 i 167 są różnymi oznaczeniami/wysokościami, nie rosnącą kolejnością liter.
- Złożona skrzynka na rysunku ma długość `NL+3`; długość dna pozostaje `NL−24`. Nie zastępować jednego wymiaru drugim.
- Przykład kontrolny LW=564, NL=500: dno 489×476 mm, plecy 477×H, skrzynka nominalnie 503 mm w wymiarze złożenia oznaczonym na rysunku. Ostatniego wymiaru nie używać do długości cięcia części.
- Instrukcja montażu wymienia wkręt Ø4×16 przy mocowaniu złączy do frontu. Nie wynika z tego automatycznie średnica ani głębokość otworu w płycie frontowej.

### Wysokości korpusu i mocowanie frontu — str.6

Tabela podaje minimalną wysokość korpusu X w zależności od wysokości szuflady: H84→110 mm, H135→165 mm, H167→197 mm, H199→229 mm. To osobny wymiar od wysokości frontu.

Na schematach pokazano różne układy dla H84, H135, H167 i H199. Występują minima przy dolnej krawędzi, rozstawy 32 i 64 mm oraz oznaczenia Ø2 i Ø10. Geometria zmienia się z wysokością; przykładowo H84 ma parę otworów w rozstawie 32, a większe warianty mają sekwencje mieszane. Nie uśredniać układów.

Tabela prowadnic podaje NL 300–550 i wymiar A od krawędzi korpusu: 300→292, 350→342, 400→392, 450→442, 500→492, 550→542 mm. To wymiar lokalizacji prowadnicy na pokazanej bazie, nie pozycja wszystkich jej otworów. Producent zaleca, by szerokość szuflady nie przekraczała NL.

Rysunki przedstawiają także wewnętrzną szufladę i zestawy jej elementów, z osobnymi oznaczeniami wymiarów `LW−85`, `LW−98` oraz tabelą minimalnej wysokości montażu. Ponieważ rysunek nie opisuje jednoznacznie tych wymiarów wyciętych jako pełny indeks części, nie przypisuję jeszcze `LW−85` ani `LW−98` do nazw części BOM. Potrzebne porównanie z kartami konkretnych zestawów wewnętrznych GTV.

## Granice dowodu dla wierceń

Rysunki montażowe pozwalają stwierdzić, że pozycje, liczba i sekwencja otworów zależą od H. Same symbole średnic nie zawierają wystarczających danych do zatwierdzenia operacji CNC: brakuje pełnego przypisania każdego otworu do SKU łącznika, powierzchni części, lokalnej bazy, głębokości, tolerancji i warunku ślepy/przelotowy. `Min` należy zachować jako ograniczenie graniczne, nie zamieniać w nominalne położenie otworu.

## Brief dla Claude

| Priorytet | Problem i źródło | Zalecane zachowanie | Zależności | Kryterium odbioru |
|---|---|---|---|---|
| P0 | Rozkrój i wymiar złożenia różnią się: str.7 | Model części i gabaryt złożenia oddzielnie | Profil GTV Modern Box PRO, płyta 16 mm | LW564/NL500 wylicza dno 489×476 i plecy 477×H; wartość 503 nie trafia do cięcia |
| P0 | H199 i H167 mają niemonotoniczne kody wariantów | Wiązać nazwę/SKU/indeks wariantu z wysokością katalogową, nie sortować po literze | Potwierdzenie symboli/wyboru katalogowego dla kupowanego zestawu | Cztery wysokości zwracają właściwe H; zmiana H zmienia część tylnej ściany i schemat frontu |
| P0 przed CNC | Rysunek str.6 ma różne drill maps i Ø2/Ø10, lecz brak pełnego kontraktu operacji | Trzymać mapy jako częściowe i odrębne per H; nie generować CAM z niepełnych pól | Pełna karta złączy i zatwierdzona technologia wiercenia | H84 ≠ H135 ≠ H167 ≠ H199 w zestawie pozycji; brak głębokości lub identyfikacji łącznika blokuje CNC |
| P0 | Wymiary wewnętrznych elementów `LW−85`/`LW−98` bez jednoznacznej etykiety BOM | Nie przypisywać nazw części na podstawie samej sylwetki | Karta zestawu szuflady wewnętrznej i SKU | Interfejs pokazuje „niezweryfikowany wymiar elementu”, dopóki relacja część↔wzór nie ma źródła |
| P1 | Lokalizacja prowadnicy A zależy od NL | Zachować tabelę dyskretną NL 300–550 | Baza „krawędź korpusu” | NL500 daje A492; NL spoza tabeli nie jest interpolowane bez reguły producenta |
| P1 | Front i uchwyty przesuwne mogą kolidować | Użyć wariantowej geometrii złącza i frontu w widoku 3D; brak mapy pozostaje „nieznane” | Zweryfikowany SKU i model geometryczny | Wynik 3D nie oznacza „bez kolizji” dla profilu niezweryfikowanego |

Wymagane do następnego kroku: karta produktów dla SKU używanych w stolarni, wiązanie części wewnętrznej z kodami zestawów i pełne dane wierceń ze sprawdzeniem grafiki/łącznika. Nie wprowadzać tych wartości do `reguly-szuflad.json` jako gotowych otworów bez takiej walidacji.

## Punkt wznowienia

Baza: 8576086. Nie znaleziono nowych zmian Claude. Udokumentowano osobno GTV Modern Box PRO; wartości nie przenoszą się na GTV Axis Pro, Amix ani Blum. Następny brak do pozyskania: SKU i pełna mapa otworów mocowań pleców/frontów GTV. R03 starego formularza pozostaje niezałatwiony w kodzie, o ile kolejny przegląd nie wykryje zmiany. Ceny i umowy nietknięte.
