# Systemy szuflad we wspólnym kreatorze

2 listopada 2026. Kontynuacja wdrażania bez dodatkowych potwierdzeń, w granicach wcześniejszej decyzji: szkic narzędzia teraz, realny silnik zamawiania razem z wdrożeniem Mussi później.

## Kontrakt

Każdy front ma opcjonalne przypisanie systemu: stabilny frontId, profileId, jawny wariant boku i NL oraz opcjonalne ID lewej i prawej granicy komory. Brak NL to null, brak wariantu pusty tekst — taki szkic można zachować, ale nie otrzymuje obliczenia. Zapis sprawdza unikalne istniejące fronty i ścisły schemat; obliczenia tworzy serwer, nie przyjmuje ich od przeglądarki.

Rodziny: istniejące profile Amix Elite Box, GTV Axis Pro, GTV Modern Box PRO, Blum MERIVOBOX, LEGRABOX, TANDEMBOX antaro. Wzory dna i pleców pochodzą wyłącznie z istniejącego przeliczSzuflade w core/catalog/drawers.ts. Nie powstał drugi niezależny zestaw reguł. Źródła i ich SHA są już w core/catalog/reguly-szuflad.json oraz docs/okucia. Profile są kandydatami badawczymi, nie wydaniem produkcyjnym.

Domyślnie komorę ograniczają rzeczywiste, zakotwione boki, nie nominalne dwie grubości z formularza. Wariant domyślny wymaga dotychczasowego frontu na całe światło z luzem 2 mm na stronę. Dla własnego podziału wybiera się granice z płyt pionowych (jawna płaszczyzna YZ lub bok korpusu). Obie granice muszą istnieć, być w dobrej kolejności, obejmować wysokość frontu i pozostawiać front w świetle. Nieprzypisany bok domyślny można łączyć z jawnie wybraną przegrodą. Usunięcie wybranej przegrody nie powoduje cichego powrotu do całego korpusu: wynik pozostaje zablokowany.

Głębokość jest przecięciem rzeczywistych zakresów Z obu granic i pleców. NL musi być podane jawnie i mieścić się w tej przestrzeni; nie oznacza to potwierdzenia długości handlowej ani wymaganej głębokości montażu prowadnicy. Nie dobieramy NL z uniwersalnego typoszeregu. Płyty w obszarze frontu wewnątrz komory powodują wymaganie sprawdzenia, bez deklaracji dokładnej analizy kolizji.

Wybrany wariant musi istnieć w rodzinie; brak danych nigdy nie uruchamia cichego doboru zastępczego. Niedodatnie formatki, plecy nie niższe od frontu lub NL poza głębokością blokują obliczenie. Wysokość frontu jest niezależna od wysokości boku/pleców i nie zmienia się przy wyborze systemu.

## Trwałość i eksport

FurnitureEntry.drawerCalculations jest migawką obliczoną przez serwer przy zapisie: wybór, światło, głębokość, wynik, braki i źródło z SHA256 oraz stroną dokumentu. Model przechowuje parametry wejściowe, a nie zaufany wynik od klienta. Karta konstrukcji JSON eksportuje zapisaną migawkę. Ponowna edycja jawnie przelicza szkic na aktualnej bibliotece profili; samo otwarcie zapisanej wersji nie zmienia obliczeń. Starsze modele bez przypisań są kompatybilne. Nieudany zapis pozostawia dane, wersje i CAS obowiązują jak wcześniej.

Usunięcie frontu usuwa jego przypisanie. Zastąpienie zestawu frontów usuwa ich poprzednie przypisania, z jawnym opisem w interfejsie i obsługą Cofnij. Kopia modelu zachowuje parametry; zapis kopii tworzy nową migawkę. Kopia pojedynczego frontu nie zgaduje nowego przypisania systemu.

## Granice wyniku

Obliczamy osobne robocze formatki dna i drewnianych pleców. Lista płyt modelu i lista formatek skrzynek są osobnymi, nazwanymi sekcjami. Formatki nie mają zgadywanego materiału, usłojenia, obrzeży ani baz położenia w korpusie. Nie dodajemy wizualnej skrzynki w arbitralnym miejscu tylko na podstawie jej wymiarów.

Lista funkcji okuć opisuje boki, prowadnice, mocowania i dodatki; nie udaje koszyka zakupowego. Brak mapowania SKU i zawartości opakowań pozostaje jawny. Średnice, głębokości, położenie operacji, obciążenie, kompletny ruch i dopuszczalne artykuły wymagają dalszej normalizacji. readyForProduction jest zawsze false. Nie wysyłamy zamówień do Mussi.

## Sprawdzenie

Aktualizacja 13.11.2026: sekcja „Mocowanie frontu · osie X/Y” korzysta z mocowanieFrontu, wspólnego z kalkulatorem. Opcjonalne firstHoleFromBottom zapisuje dokładną pozycję pierwszego otworu; minimum z profilu nie zastępuje tej pozycji. Osie uwzględniają szerokość frontu i rzeczywiste przesunięcie względem środka wybranej komory. Przycięty front lub niepoprawne pozycje wstrzymują schemat mocowania, zachowując robocze formatki skrzynki. Komunikat trafia również do listy braków. Rysunek jest wspólny z kalkulatorem i pokazuje wartości Y z odnośnikami; średnice oraz głębokości bez danych pozostają do ustalenia. Parametr i obliczenia są zamrażane przy zapisie oraz obsługiwane przez Cofnij. Dotychczasowe ograniczenia produkcyjne i zakupowe pozostają.

Testy: zgodność z istniejącym wzorem, przełączenie Amix/Blum i grubości 18/16, plecy korpusu, nieistniejący wariant, za długa prowadnica, przegrody i komory, utrata granicy, zamrożenie wyniku i brak mutacji przez eksport, odrzucenie podrabianych wyników i osieroconych frontów. Przeglądarka: przypisanie i ponowne otwarcie, Cofnij, konflikt zapisu i telefon 390 px. Dane testowe nie zapisują się do produkcji.
