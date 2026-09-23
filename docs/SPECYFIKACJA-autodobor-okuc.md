# Automatyczny dobór okuć — kontrakt implementacyjny

Wersja 1.0, 23.09.2026. Decyzje projektowe na podstawie `RESEARCH-okucia-kuchenne-autodobor.md`. Dokument obowiązuje Claude i Codex przy wdrażaniu. Nie oznacza, że poniższy silnik już istnieje w aplikacji.

## Wynik wymagany przez użytkownika

Aplikacja automatycznie proponuje i dobiera rodzaj szuflady, kosza, cargo, mechanizmu narożnego, zawiasów i pozostałych okuć do mebla. Dobór ma zakończyć się kompletnym zestawem, spójną wizualizacją 3D, rysunkami i operacjami wszystkich części oraz dokumentacją całej kuchni. Człowiek ustala funkcję i preferencje; nie musi znać katalogu SKU.

## Model danych

Rozdziel encje:

- `HardwareFamily`: producent, rodzina, kategoria funkcji i ruchu.
- `HardwareVariant`: długość, wysokość, strona, klasa obciążenia, rodzaj frontu, technologia otwierania, wykończenie.
- `SupplierArticle`: dostawca, jego kod, kod producenta, jednostka sprzedaży, skład opakowania, aktualność ceny/dostępności.
- `AssemblyRecipe`: wymagane komponenty, ilości, alternatywy kompatybilne, elementy opcjonalne i wykluczenia.
- `FitRule`: wejścia, jednostki, operator, warunek zastosowania, źródło i tolerancja.
- `MachiningTemplate`: część, powierzchnia bazowa, osie lokalne, punkty, głębokość, średnica, rowki, frezy i mocowania.
- `MotionModel`: segmenty, osie/przeguby, zależności ruchu, obwiednie, obszary obsługi.
- `Evidence`: dokument, SHA256, rewizja, strona PDF, oznaczenie diagramu, zakres SKU, przegląd.
- `Approval`: zakres dopuszczenia; osobno prezentacja, dopasowanie, kompletacja, produkcja i eksport maszynowy.

Brak pola zapisz jako `unknown`/null, nigdy jako zero. `Not applicable` jest innym stanem. Kod producenta przechowuj jako tekst; nie usuwaj zer wiodących. Nazwa rodziny nie jest globalnie unikalna.

## Dane wejściowe z projektu

Korpus: typ geometrii (prosty, ślepy narożnik, L, ukośny, słupek, wiszący), szerokość/wysokość/głębokość zewnętrzna, poszczególne grubości i materiały, położenie pleców, cokołu, wieńców, przegród, poprzeczek i profili.

Fronty: obrys, podział, nałożenie, szczeliny, masa lub obliczalny materiał, uchwyt i jego masa/położenie, strona, rodzaj otwierania, ograniczniki. Nie wyliczaj masy z jednej uniwersalnej gęstości dla wszystkich płyt.

Przestrzeń: otwór dostępu, instalacje, AGD, ściany, sąsiednie fronty i uchwyty, blat, sufit, odległość do wyspy. Głębokość użyteczna pochodzi z geometrii konkretnego korpusu, nie ze stałego odjęcia od głębokości nominalnej.

Potrzeba: zawartość i jej masa/wymiary, sposób dostępu, preferowana marka, budżet, domyk/push/napęd, wymagania ergonomiczne i jawne blokady użytkownika.

## Algorytm

1. Ustal funkcję mebla i jego geometrię. Z istniejącego projektu pobierz dane; pytaj tylko o rzeczywiste braki.
2. Zbuduj kandydatów rodzin i wariantów ze zweryfikowanego katalogu. Nie generuj nieistniejących długości lub szerokości przez skalowanie.
3. Dla każdego kandydata oblicz komplet montażowy i zajętość przestrzeni, łącznie z akcesoriami.
4. Oceń twarde warunki: wymiary, otwór, strona, materiał, grubość, obciążenie, front, mocowanie, ruch, instalacje i kompatybilność.
5. Oceń kompletność danych. Wynik każdego warunku ma trzy stany: `pass`, `fail`, `unknown`. Kandydat z `unknown` nie jest potwierdzonym dopasowaniem.
6. Dopiero pasujące rozwiązania porównuj pod kątem funkcjonalności, dostępności zawartości, kosztu kompletnego zestawu, ergonomii i preferencji. Wagi rankingu są konfiguracją produktu; nie udawaj, że wynik punktowy jest normą producenta.
7. Wybierz rekomendację i pokaż alternatywy z krótkim uzasadnieniem. Jawnie podaj założenia dotyczące zawartości, masy i podziału frontów.
8. Przelicz części oraz operacje i sprawdź cały mebel. Zmiana systemu może zmienić grubość dna, wiercenia, liczbę komponentów i koszt — wszystko aktualizuje się razem.
9. Zapisz decyzję z wersją projektu, katalogu, reguł i źródeł. Zmiana w katalogu nie może po cichu zmienić wydanego projektu.

Przykładowe kody odrzucenia: `OPENING_TOO_NARROW`, `INSUFFICIENT_INSTALL_DEPTH`, `WRONG_HANDING`, `FRONT_MASS_OUT_OF_RANGE`, `HINGE_INTRUSION`, `SINK_COLLISION`, `SWEEP_COLLISION`, `MISSING_REQUIRED_PART`, `SOURCE_CONFLICT`, `MACHINING_INCOMPLETE`.

## Dobór szuflad

Najpierw wyznacz podział frontów i położenie szuflad, a dopiero potem dobierz ich warianty. Wysokość frontu, boku systemowego, pleców drewnianych i użytkowa przestrzeń wewnątrz to cztery osobne wartości. Nie wybieraj najwyższego boku, który fizycznie wejdzie, jeśli pogarsza użyteczność lub koliduje z innym elementem.

Długość prowadnicy wybieraj wyłącznie z listy dostępnych długości wariantu, po sprawdzeniu minimalnej głębokości montażu i dodatkowych mechanizmów. Wymiary dna i pleców bierz z właściwego profilu. Przy szufladach wewnętrznych sprawdź drzwi, zawiasy i kolejność otwarcia. Przy koszu kupowanym nie dopisuj formatek fabrycznego dna do rozkroju.

## Dobór narożników

Przechowuj geometrię ślepej części i otworu dostępu oddzielnie. Reguła zależy od konkretnej rodziny: LeMans, Magic Corner, REVO i winda pionowa nie współdzielą uniwersalnego profilu.

Montaż uniwersalny L/P nie oznacza, że sam model można zawsze odbić bez zmiany komponentów. Dla strony ustal definicję producenta i transformację do układu mebla. Sprawdź montaż, pozycję zamkniętą, cały przebieg otwierania i wyjmowanie zawartości.

## Kolizje i silnik 3D

Każda część ruchoma ma własną transformację zależną od stanu mechanizmu. Dla cargo wieloetapowego stosuj relację kolejności: najpierw drzwi/front, potem rama, następnie kosze. Dwa statyczne modele końcowe nie dowodzą bezkolizyjnej drogi między nimi.

Oddziel model do renderowania od uproszczonego modelu kolizji. Szybki test obwiedni zawęża pary do dokładniejszej oceny. Samo sprawdzenie kilku klatek animacji nie gwarantuje braku kolizji; do zatwierdzenia użyj konserwatywnej obwiedni całego ruchu lub metody o kontrolowanej dokładności. Uwzględnij zakres tolerancji i regulacji.

Rozróżnij kolizję w normalnej obsłudze jednego mebla od konfliktu dwóch otwartych jednocześnie frontów. Oba przypadki raportuj, lecz nie muszą mieć identycznej klasy błędu. Ustawienia interfejsu nie mogą wyłączyć obowiązkowych ograniczeń montażu producenta.

Brak trajektorii oznacza model prezentacyjny z niepotwierdzonym ruchem. Nie oznaczaj takiego produktu jako sprawdzonego bezkolizyjnie.

## Produkcja i dokumentacja

Jeden wynik konstrukcyjny jest źródłem dla 3D, rysunków, listy części, listy okuć i eksportów. Każda formatka ma ID, materiał, rzeczywistą grubość, orientację dekoru i okleinowanie. Każda operacja ma bazę i stronę obróbki; współrzędne globalne wizualizacji nie są automatycznie współrzędnymi maszyny.

Produkcja jest dozwolona dopiero, gdy wszystkie wymagane operacje i mocowania są znormalizowane oraz sprawdzone. Dopuszczenie profilu nie obejmuje niezweryfikowanych SKU tylko dlatego, że mają wspólną nazwę rodziny. Eksport CNC ma osobny profil maszyny, narzędzi i układów osi.

## Interfejs

Użytkownik widzi: proponowany system, cel jego użycia, najważniejszy parametr, cenę całego zestawu, alternatywy i powód odrzucenia. Przykład: „Ten kosz wymaga światła 864 mm. W Twoim korpusie jest 764 mm”. Brak danych należy nazwać konkretnie, np. „Brakuje wymiaru syfonu”, zamiast pokazywać sam czerwony znacznik.

Można zmienić rekomendację na innego zgodnego kandydata. Zablokowany wybór po zmianie geometrii staje się konfliktem do rozwiązania; nie wolno go podmieniać bez informacji. Tryb roboczy może pokazywać produkt z brakami danych, ale pakiet nie może otrzymać etykiety gotowego do produkcji.

## Przypadki odbioru

1. Prosty korpus W800 z bokami 18 daje LW764; KO-WMC500 wymagający LW864 zostaje odrzucony.
2. Dwie szafki mają tę samą głębokość zewnętrzną, lecz inne plecy/instalacje: wybór długości może się różnić.
3. Zmiana Amix Elite Box na inną rodzinę przelicza dno, plecy, grubość i obróbkę; nie zachowuje poprzednich wzorów.
4. Kosz sprzedawany bez prowadnic wymaga ich dołączenia; brak kompatybilnego SKU uniemożliwia kompletny dobór.
5. Zmiana strony narożnika zmienia wymagane komponenty i transformacje albo jest niedozwolona dla danego wariantu.
6. Szuflada wewnętrzna mieszcząca się w korpusie, ale kolidująca z zawiasem, nie przechodzi weryfikacji.
7. Segregator mieści się po szerokości, lecz koliduje z syfonem albo nie pozwala wyjąć pojemnika: zostaje odrzucony lub wymaga zmiany projektu.
8. Limit półek nie może przekroczyć limitu całej ramy.
9. Konflikt PTJ017J 25/30 kg pozostaje `unknown/conflict`; system nie zatwierdza wartości przez zgadywanie.
10. Przykład HK top KH400, masa frontu5, uchwyt0,2 daje LF2160 przy formule z podwójną masą uchwytu; inna rodzina korzysta ze swojej formuły.
11. Ruch nerki przechodzi sprawdzenie całej drogi, a nie tylko pozycji końcowych.
12. Zmiana płyty 18 na rzeczywistą grubość innego produktu przelicza światło, połączenia i dopasowanie okuć.
13. Powtórzenie obliczeń z tą samą wersją katalogu daje identyczny wynik. Aktualizacja katalogu jest jawna.
14. Pakiet kuchni obejmuje wszystkie części wszystkich mebli; pojedynczy niekompletny profil uniemożliwia oznaczenie całości jako gotowej produkcyjnie.

## Połączenie z katalogiem płyt

Rozdziel `Decor` (kod/nazwa), `SurfaceFinish` (struktura), `PanelProduct` (nośnik/wykończenie), `PanelVariant` (grubość i format), `RegionalAvailability` i `TextureAsset`. Sam obraz dekoru nie dowodzi dostępności płyty w wymaganej grubości.

Dobór okuć korzysta z rzeczywistej grubości i właściwości materiału konkretnego wariantu płyty. Render korzysta z tekstury przypisanej do dekoru i struktury, z jawną skalą fizyczną. Nie wymyślaj map normal/roughness ani bezszwowości na podstawie miniatury. Dane Egger i Kronospan dla Polski mają być przechowywane z datą i źródłem, niezależnie od stanów magazynowych hurtowni.
