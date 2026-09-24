# Biblioteka okuć — Blum, GTV, Amix

Stan zebrania: 23.09.2026. Dokumentacja źródłowa do kreatora mebli, wspólna dla Claude i Codex. Zawiera 12 plików PDF (11 różnych treści), jeden model STEP GTV i zapis sześciu stron producentów. Rejestr `sources.json` podaje adresy, daty pobrania, rozmiary i SHA256. Numery stron poniżej liczone są od pierwszej strony PDF, a nie według numeracji drukowanej katalogu.

## Sprawdzone wymiary elementów szuflad

Poniższe wzory odczytano i porównano wizualnie z rysunkami. Są materiałem do wdrożenia profili, a nie zatwierdzeniem kompletnej technologii produkcji. LW oznacza rzeczywistą szerokość wewnętrzną korpusu; NL nominalną długość prowadnicy. Wszystkie wymiary w mm. Kolejność dna: szerokość × głębokość; pleców: szerokość × wysokość.

| System i zakres | Płyta | Dno | Plecy | Źródło w katalogu pdf/ |
|---|---:|---|---|---|
| Amix Elite Box standard | 18 | (LW−75) × (NL−26) | (LW−87) × H; H=84/116/167/199 | AMIX-Elite-Box-standardowe.pdf, s.1 |
| GTV Axis Pro, opcja 1 | 16 | (LW−75) × (NL−24) | (LW−87) × H; H=84/116/167/199 | GTV-Axis-Pro-karta.pdf, s.8 |
| GTV Modern Box PRO | 16 | (LW−75) × (NL−24) | (LW−87) × H; A=84, B=135, C=199, D=167 | GTV-Modern-Box-Pro-instrukcja.pdf, s.7 |
| Blum MERIVOBOX M, drewniane plecy | 16 | (LW−51) × (NL−26) | (LW−51) × 83 | BLUM-Merivobox-planowanie.pdf, s.15 |
| Blum LEGRABOX M, drewniane plecy | 16 | (LW−35) × (NL−10), z wymaganą obróbką | (LW−38) × 63 | BLUM-Legrabox-planowanie.pdf, s.15 |
| Blum TANDEMBOX antaro M, drewniane plecy | 16 | (LW−75) × (NL−24) | (LW−87) × 84 | BLUM-Tandembox-antaro-planowanie.pdf, s.7 |

Przykład: korpus zewnętrzny 600, dwa boki po 18, bez dodatkowych elementów zmniejszających światło: LW=564. Dla NL=500 dna wynoszą odpowiednio: Amix 489×474, Axis/Modern 489×476, MERIVOBOX 513×474, LEGRABOX 529×490, TANDEMBOX 489×476. Grubość dna wynika z profilu okucia, a nie automatycznie z grubości boków korpusu. LEGRABOX wymaga dodatkowej obróbki zgodnej z diagramem.

`reguly-szuflad.json` zawiera te sześć profili, zakres zastosowania, źródło, sumę kontrolną i przykłady. Każdy ma `production_approved=false`: nie uzupełniono jeszcze kompletnego przypisania SKU, długości, wierceń i obróbki. Nie używać go bezpośrednio jako zatwierdzonego katalogu CNC.

## Ważne rozróżnienia i braki

- Amix: instrukcja standardowa i wewnętrzna mają różne wartości L1 (100 i 95 dla wskazanych długości). Nie łączyć ich schematów wierceń. Wariant i rewizję trzeba rozstrzygnąć przy przypisaniu do SKU. Instrukcja wewnętrzna jest załączona, ale nie dostała osobnego zatwierdzonego profilu.
- Axis Pro: pliki nazwane `_3` i `_4` są identyczne bajtowo. Numer w nazwie nie dowodzi nowej rewizji. Nie rozszerzać reguły na Axis Pro Glass lub niezweryfikowane wysokości.
- Modern Box PRO: C=199, D=167; kolejność liter nie oznacza rosnącej wysokości.
- Blum: zweryfikowano tu tylko wskazane warianty M z drewnianymi plecami. Pozostałe warianty są w załączonych katalogach i wymagają odrębnej normalizacji.
- Wymiary prostokątów nie zastępują frezowania, otworów, tolerancji, odsadzeń prowadnic i wymagań montażowych. Brakujące dane mają blokować wydanie produkcyjne, nie samo projektowanie.

## Modele 3D i dokumentacja

Pobrano model `cad/GTV-PB-AXISPRO-P2O-KPL350A.stp` z [karty GTV](https://gtv.com.pl/produkt/PB-AXISPRO-P2O-KPL350A/). Zweryfikowano nagłówek formatu i integralność pliku; nie zweryfikowano geometrii, jednostek i zgodności montażowej w CAD. Model dotyczy konkretnego produktu, nie wszystkich długości rodziny.

[Serwis CAD/CAM Blum](https://www.blum.com/pl/pl/services/industrial-production/cad-cam-dataservice/) jest kolejnym źródłem modeli i danych produkcyjnych. Nie pobrano stamtąd modeli CAD ani nie potwierdzono publicznego API. Na sprawdzonych stronach Amix nie znaleziono modelu STEP; nie oznacza to braku takiego modelu u producenta.

Do renderowania w aplikacji konwertować zweryfikowane modele do glTF/GLB, zachowując osobno oryginalny STEP. Kontrolować jednostki, orientację osi, punkt montażu, lewą/prawą stronę i ograniczenia ruchu. Geometria renderowania nie jest źródłem pozycji wierceń. Sprawdzić warunki wykorzystania modeli przed ich publiczną dystrybucją.

## Kolejność dalszego wdrożenia

1. Przypisać rzeczywiście kupowane SKU, długości, wysokości i wersje otwierania do profili. Nazwy „Blum” i „GTV” nie wystarczają do wyboru technologii.
2. Dla każdego profilu opisać pełny zestaw części, obróbek i ograniczeń montażu z odwołaniami do stron PDF.
3. Uzupełnić średnicę, głębokość, stronę, lokalny układ współrzędnych i tolerancję każdego wiercenia. Rozróżnić otwory płyt od geometrii samych okuć.
4. Porównać obliczenia i rysunki z referencyjnym meblem oraz potwierdzonym procesem zakładu; dopiero wtedy zatwierdzić profil produkcyjny.
5. Wygenerować z jednego modelu konstrukcji widok 3D, zestawienie części, rysunki wszystkich części i mebli oraz pakiet całej kuchni.

Pobranie dokumentacji jest zakończone dla tego zestawu źródeł. Pełna biblioteka wierceń i wdrożenie w aplikacji pozostają oddzielnym etapem.

## Katalog produktów szuflad w aplikacji (24.09.2026)

Scrapowanie rozpoczął Codex, dokończył Claude. `produkty/katalog.json` zawiera 351 produktów: Amix Elite Box (19), GTV Axis Pro (150) i Modern Box PRO (37), Blum LEGRABOX (79), MERIVOBOX (31) i TANDEMBOX antaro (35). Każdy ma lokalne zdjęcie (`produkty/obrazy`, 128 unikalnych plików), adres karty producenta, datę pobrania, SHA256 strony i `zatwierdzoneProdukcyjnie=false`. Wyciąg tekstowy każdej karty jest w `produkty/*.md`. W `produkty/errors.json` zapisano 20 indeksów GTV z listy, których karty zwracały 404; nie trafiły do katalogu.

- **Rodzaj indeksu:** `wariant` to konkretne SKU zestawu (GTV). `bazowy` to numer elementu z dokumentacji Blum: bok, prowadnica albo mocowanie, a nie kompletna szuflada. `rodzina` to karta Amix, która nie wskazuje kombinacji koloru i długości.
- **Amix:** 8 kart nie publikuje żadnego indeksu, ani w treści, ani w danych produktu. SKU nie zostało wymyślone; opis braku jest w parametrze „Zakres indeksu”.
- **Konflikty GTV:** w 3 kartach symbol przeczy tabeli parametrów tej samej strony. PB-AXISPRO-KPL250A i KPL250A2 podają „250, 300”, a PB-AXISPRO-P2O-KPL450D2 podaje 400. Wartości producenta zostały bez zmian i mają parametr „Konflikt danych”, widoczny na karcie w galerii. Po każdym ponownym pobraniu uruchom `node scripts/oznacz-konflikty-okuc.mjs`.
- **W aplikacji:** Materiały i okucia → Okucia → „Katalog systemów szuflad”. Do cennika można dodać tylko pozycję z konkretnym SKU, po wpisaniu ceny zakupu netto. Dodanie nie zmienia istniejących cen ani wycen projektów. Katalog nie jest profilem wierceń. Reguły produkcyjne nadal pochodzą z `reguly-szuflad.json`.
- **Skrypty pobierania** (w katalogu roboczym Codexa, poza repozytorium): `collect_drawer_products.py` i `finalize_drawer_products.py`.

## Rozszerzony katalog: zawiasy, prowadnice, systemy przesuwne, wkręty, kleje, chemia (24.09.2026)

Kolektor `scripts/okucia/zbierz_katalog_okuc.py` dopisuje do `produkty/katalog.json` pozycje z kategoriami aplikacji: zawiasy, prowadnice, przesuwne, podnosniki, odbojniki, wkrety, laczniki, mocowania, nogi, kleje, chemia, wyposazenie i inne. Dotychczasowe szuflady zostają bez zmian. Liczby po ostatnim przebiegu są w `produkty/raport.json`, a błędy pobierania w `produkty/errors.json`.

| Źródło | Rodzaj | Zakres | Indeks |
|---|---|---|---|
| gtv.com.pl | producent | wszystkie karty SKU z mapy strony poza oświetleniem; kategoria z okruszków karty | symbol GTV z adresu, sprawdzony w treści karty |
| amix.pl | producent | zawiasy (także CLIP-ON), prowadnice, podnośniki, akcesoria do drzwi przesuwnych, elementy łączące, podpórki, odbojniki, nogi, kosze cargo, szuflady, segregatory, garderoba | `mpn`/`sku` z danych produktu; karta z wieloma wariantami ma status `rodzina` |
| spraykon.pl | producent | kleje kontaktowe (aerozole, kanistry), kleje meblarskie CA, zmywacze (bez wielopaków) | „Indeks” producenta i EAN z karty |
| mamutglue.pl | producent (Den Braven / Bostik) | Mamut Glue jako karta rodziny z kartą techniczną (TDS) i kartą charakterystyki (SDS) | brak indeksu na karcie; pojemność i kolor ustala się u dostawcy |
| sklep.merkuryam.pl | **dystrybutor** | Blum (CLIP top, MOVENTO, TANDEM, AVENTOS, TIP-ON), Hettich, Häfele, Laguna, Sevroll, Titus, Matrix (CELO, MX PRO), Astra Trade (KONFI), Würth i inne. Wybór przez słowa kluczowe w adresie. Marki GTV, Amix i Spray-Kon pominięte, bo mają dane od producenta | symbol dystrybutora i EAN osobno; kod producenta tylko wtedy, gdy występuje w nazwie (np. Blum 71B7550D) |

**Stan po przebiegu z 24–25.09.2026:** 2472 produkty. Od producenta pochodzi 1488 (GTV 835, Blum 145 z dokumentacji, Amix 474, Spray-Kon 33, Mamut 1), od dystrybutora 984. Wszystkie mają zdjęcie (2047 plików, ok. 59 MB), błędów pobierania: 0.

| Kategoria | Produkty |
|---|---:|
| Systemy szuflad | 620 |
| Zawiasy | 327 |
| Prowadnice | 259 |
| Wkręty i konfirmaty | 222 |
| Systemy przesuwne | 174 |
| Zawieszki i mocowania | 168 |
| Podnośniki | 132 |
| Odbojniki i push | 115 |
| Wyposażenie mebli | 113 |
| Nogi i kółka | 97 |
| Uchwyty i gałki | 75 |
| Kleje | 62 |
| Łączniki i kołki | 58 |
| Akcesoria (przepusty, kratki, zamki) | 27 |
| Chemia meblowa | 22 |
| Inne | 1 |

- **Kod producenta u dystrybutora** jest przyjmowany tylko wtedy, gdy ostatni człon symbolu Merkury jest całym słowem w nazwie, zawiera litery i cyfry i nie jest wymiarem ani pojemnością. Spełnia to 190 pozycji Blum i 1 Camar. Pozostałe mają symbol dystrybutora i EAN.
- **EAN** jest przyjmowany tylko z poprawną cyfrą kontrolną. W polu „EAN” Merkury bywają kody celne (np. „83024200.”); trafiają one do parametru „Kod z pola EAN (niepoprawny EAN)”.
- **Marka nieustalona (296 pozycji):** karta dystrybutora nie podaje marki, a nazwa jej nie zawiera. Nie zgadujemy. Części chemii marka jest nadana z nazwy (np. Tytan, Absorfen, Pattex), z adnotacją w parametrze „Marka”.
- **Amix:** nazwa składa się z kategorii i kodu, gdy karta ma za nazwę sam kod. Cena referencyjna to cena netto ze sklepu producenta za jednostkę sprzedaży podaną na karcie. Bywa nią opakowanie, np. kołki.
- **Matrix:** strona producenta matrixpolska.pl jest zawieszona („Suspended Domain”, 24.09.2026). Wkręty Matrix, w tym linia MX PRO, pochodzą więc od dystrybutora.
- **Astra Trade:** strona astra-trade.pl nie publikuje wymiarów ani indeksów w HTML, więc pozycje KONFI pochodzą z Merkury.
- **Merkury, robots.txt:** `Crawl-delay: 1` jest przestrzegane (1 zapytanie na sekundę, także dla zdjęć).
- **Cena referencyjna:** cena z karty sklepu dystrybutora (detaliczna brutto), zapisana z datą, tylko orientacyjnie. Nie jest ceną zakupu stolarni i nie trafia automatycznie do cennika.
- **Zdjęcia dystrybutora:** mogą przedstawiać wariant poglądowy. Karta pokazuje wtedy uwagę.
- **Kategorie** są przypisywane regułami słów kluczowych w kolektorze (`KATEGORIE`). Pomyłki trzeba poprawiać w regułach, a nie ręcznie w JSON.
- **Ponowne pobranie:** `SCRAPER_DEPS=<ścieżka bibliotek> python scripts/okucia/zbierz_katalog_okuc.py --cache <katalog-cache>`, a potem `node scripts/oznacz-konflikty-okuc.mjs`. Cache HTML trzymaj poza repozytorium.
