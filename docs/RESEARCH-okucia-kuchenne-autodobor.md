# Okucia kuchenne i automatyczny dobór — research techniczny

Stan badania: 23.09.2026. Opracowanie dla kreatora mebli online, Claude i Codex. Źródła: strony producentów, oficjalnych dostawców, instrukcje montażowe i katalogi. Towarzyszą mu lokalne oryginały w `research-kuchnia/`, rejestry pobrania i specyfikacja `SPECYFIKACJA-autodobor-okuc.md`.

**Wniosek:** aplikacja powinna dobierać kompletne, kompatybilne zestawy do funkcji mebla i jego rzeczywistej geometrii. Marka, szerokość zewnętrzna i głębokość szafki nie wystarczają. Po wyborze zestawu trzeba wygenerować wynik konstrukcyjny, obróbkę oraz ruch 3D z tej samej wersji danych.

Rozróżnienie statusów w opracowaniu: rozpoznanie rodziny; dane deklarowane na stronie; wymiary obejrzane na rysunku; kompletny profil zweryfikowany produkcyjnie. Ostatni status nie został tu nadany żadnej nowej rodzinie. To badanie i specyfikacja wdrożenia, nie wykonany moduł aplikacji.

## 1. Co użytkownik nazywa szufladą, koszem i nerką

„Szuflada koszowa” może oznaczać gotowy kosz druciany na prowadnicach, wysuw z pełną półką, kosz wewnętrzny za drzwiami albo cały mechanizm cargo. Aplikacja powinna pytać o sposób użycia i pokazywać ilustrację ruchu, zamiast wymagać fachowej nazwy.

„Nerka” opisuje przede wszystkim kształt i sposób udostępniania półki w ślepym narożniku. Nie jest jedną normą wymiarowania. LeMans II, CORNERSTONE MAXX i inne półki obrotowo-wysuwne wymagają osobnych profili. Magic Corner z zespołami koszy i obrotnica w korpusie L to kolejne, odmienne kategorie.

Rozdzielamy pięć poziomów: **funkcja → rodzaj ruchu → rodzina → wariant techniczny → SKU i komplet elementów**. Kolor jest cechą wariantu handlowego, ale nie dowodem zamienności technicznej.

## 2. Mapa rodzin do katalogu aplikacji

Poniższa klasyfikacja jest propozycją struktury katalogu. Wymienione rodziny są przykładami z podanych dalej źródeł, a nie listą wzajemnie zamiennych produktów.

| Grupa | Podtypy, które trzeba rozróżniać | Co zmienia dobór |
|---|---|---|
| Szuflady systemowe | niska, średnia, wysoka, z relingiem, z bokiem pełnym/szklanym | długość, grubość dna, typ pleców, wysokość montażowa, obciążenie |
| Szuflady wewnętrzne | za drzwiami, za wspólnym frontem, z zabierakiem | zawiasy, uskok drzwi, odsunięcie prowadnic, kolejność otwierania |
| Szuflady drewniane | prowadnice ukryte, boczne kulkowe, rolkowe | konstrukcja skrzynki, podcięcia, zaczepy, pełny/częściowy wysuw |
| Szuflady specjalne | z wycięciem pod syfon, pod płytą, cokołowe, tackowe | instalacje, wentylacja, prześwit, blokada i geometria dna |
| Szuflady koszowe | druciane lub z pełnym dnem; wewnętrzne lub z frontem | szerokość gotowego kosza, prowadnice i elementy dystansowe |
| Cargo podblatowe | wąskie, na butelki, przyprawy, blachy, deski, ręczniki | strona mocowania, liczba poziomów, montaż dolny/boczny |
| Cargo wysokie | cały stelaż z frontem, za drzwiami, układ dzielony drzwi/korpus | wysokość ramy, masa całkowita, górne prowadzenie, tor ruchu |
| Narożniki ślepe | nerki niezależne, zespoły koszy wysuwno-obrotowych | otwór dostępu, słupek, front, lewo/prawo, przestrzeń przed meblem |
| Narożniki L | obrotnice, mechanizmy z frontami, szuflady narożne | oba ramiona korpusu, geometria frontów, oś i promienie ruchu |
| Narożniki specjalne | windy pionowe, narożne sortowniki | blat, zasilanie, obszar ponad blatem, instalacje zlewu |
| Segregacja odpadów | wkład do szuflady, stelaż z frontem, kosz za drzwiami | użyteczne wnętrze, pokrywa, liczba frakcji, syfon i zbiorniki |
| Organizacja wnętrza | wkłady, przegrody, uchwyty talerzy/noży, maty | użyteczne wymiary wybranej szuflady, sposób przycięcia/mocowania |
| Drzwi rozwierne | nakładane, bliźniacze, wpuszczane, kątowe, szerokokątne | materiał i masa frontu, nałożenie, prowadnik, uskok, szczeliny |
| Fronty podnoszone | uchylne, składane, nad korpus, nachodzące | masa i wysokość frontu, uchwyt, siłownik, sufit i sąsiednie fronty |
| Drzwi chowane | pojedyncze i składane, z uchwytem/push | kieszeń, szerokość/masa frontu, ruch kilku skrzydeł |
| Wyposażenie górne | opuszczane półki i kosze, suszarki | zasięg użytkownika, światło drzwi, zajętość nad blatem |
| Wyposażenie podblatowe specjalne | wysuwane stoły, półki na mikser, stopnie | podparcie, blokada, obciążenie użytkowe, przejście |
| Konstrukcja i montaż | zawieszki, listwy, nogi, cokoły, złącza, podpórki | materiał, grubość, obciążenie, mocowania, narzędzia zakładu |
| Uchwyty i profile | gałki, relingi, krawędziowe, profile bezuchwytowe | rozstawy, frezowanie, przestrzeń chwytu, kolizje |
| Ruch i elektryka | domyk, push, napęd, LED, zasilacze, przewody | kompatybilność zestawu, miejsce, napięcie, moc, serwis |

## 3. Szuflady systemowe i prowadnice

Pierwszy zakres aplikacji powinien zachować Amix Elite Box, GTV Axis Pro/Modern Box PRO i trzy osobne rodziny Blum z wcześniejszej biblioteki. To preferencja wdrożeniowa wynikająca z dotychczasowej pracy, nie ranking jakości producentów.

Rozszerzenia: Hettich AvanTech YOU, InnoTech Atira i ArciTech; GRASS Nova Pro Scala, Vionaro oraz prowadnice Dynapro. Tabela Hettich rozróżnia platformy prowadnic i klasy obciążenia między rodzinami. Nie należy przenosić deklarowanej maksymalnej nośności całej rodziny na każdy wariant długości. [Porównanie Hettich](https://shop.hettich.com/us_EN/system-comparison/compare/group12100825821033). Instrukcje GRASS znajdują się w pobranym zestawie Peka.

Dobór obejmuje: funkcję zawartości, wysokość użytkową, ciężar części ruchomych i zawartości zgodnie z definicją producenta, dopuszczalne szerokości, długość nominalną, kompatybilny front i technologię otwierania. Wysokość frontu nie jest wysokością metalowego boku ani drewnianych pleców. Szeroki front nie oznacza automatycznie potrzeby najwyższego boku.

Wymiary dna/pleców z wcześniejszego `okucia/reguly-szuflad.json` pozostają ograniczone do opisanych wariantów. Kosz gotowy nie dostaje automatycznie formatek dna i pleców według wzoru Elite Box. Jeżeli ma fabryczne dno, jest częścią kupowaną; aplikacja produkuje tylko elementy wskazane w jego instrukcji.

## 4. Szuflady koszowe i cargo podblatowe

Vibo rozdziela gotowe szuflady od wyciągów podblatowych, wysokich i narożnych. Przykład czterostronnej szuflady Essence ma pełny wysuw, domyk i deklarowane 30 kg; występuje w kilku modułach szerokości. Jest to komplet o własnej konstrukcji, a nie dowolnie skalowana metalowa siatka. [Vibo Essence](https://www.viboitaly.com/en/products/four-side-drawer-essence-cctgm40e), [rodzina Partner](https://www.viboitaly.com/en/categories/kitchen/partner).

W GTV Movix występują kosze sprzedawane bez prowadnic. Dobór musi więc zakończyć się listą brakujących kompatybilnych elementów, a nie samą pozycją kosza. [GTV Movix](https://gtv.com.pl/kategoria-produktu/akcesoria-meblowe/wyposazenie-mebli-kuchennych/kosze-cargo/podblatowe/movix/).

Amix oferuje m.in. Deluxe Mini, Cargo Midi, Cargo Maxi oraz systemy Sige. W przykładzie Cargo Maxi Sige opis wskazuje zestaw dwóch wyciągów, a nie jeden wysoki stelaż. To przykład, dlaczego ilość w opakowaniu i liczba instalowanych mechanizmów muszą być osobnymi polami. [Amix Sige](https://amix.pl/pl/kosze-cargo-wloskie-sige/1577-cargo-wloskie-maxi), [Deluxe Mini](https://amix.pl/pl/kosze-cargo-grupa-i/2221-deluxe-cargo-mini).

**Reguły projektowe:** kosz na butelki musi spełniać wysokość przechowywanego przedmiotu; wyciąg na blachy musi uwzględniać ich głębokość; system boczny wymaga odpowiedniej powierzchni montażowej. Kosz za drzwiami należy sprawdzić względem ramienia zawiasu i rzeczywistego otworu po otwarciu. Profile bezuchwytowe mogą zmniejszyć wysokość dostępną u góry.

## 5. Cargo wysokie i szafy na zapasy

Trzy różne koncepcje powinny być widoczne dla użytkownika: cały stelaż wyjeżdżający wraz z frontem; mechanizm wysuwany po otwarciu drzwi; niezależne szuflady wewnętrzne. Mają inne masy ruchome i sposób dostępu do zawartości.

DISPENSA ma wspólny wysuw i regulowane poziomy. Producent podaje limit całego systemu oraz osobny limit półki. Nie wolno pomnożyć maksymalnego obciążenia półki przez ich liczbę i pominąć limitu ramy. [Kesseböhmer DISPENSA](https://www.kesseboehmer.com/stauraumloesungen/kueche/hochschraenke/dispensa).

Kesseböhmer TANDEM dzieli przechowywanie między drzwi i wnętrze. Na stronie występują niejednoznaczne sformułowania o nośności półki, a w dalszym opisie o nośności ramy. Do reguł liczbowych należy użyć instrukcji konkretnego zestawu. Nie utożsamiać tego TANDEM z prowadnicą Blum o tej samej nazwie. [Kesseböhmer TANDEM](https://www.kesseboehmer.com/en/storage-solutions/kitchen/larder-units/tandem-family/tandem).

Blum SPACE TOWER opiera się na niezależnym dostępie do szuflad wewnętrznych. W katalogu należy go opisać jako rozwiązanie mebla z zestawem komponentów, a nie pojedyncze uniwersalne okucie. [SPACE TOWER](https://www.blum.com/pl/pl/products/cabinet-applications/space-tower/overview/).

Dodatkowe rodziny do katalogowania: Convoy, Pleno oraz VS TAL. W pierwszej kolejności katalogować konkretne zestawy dostępne u używanego dostawcy, z identyfikatorami producenta i dostawcy zapisanymi oddzielnie.

## 6. Nerki — najważniejsze dane montażowe

LeMans pozwala niezależnie wyprowadzać półki przed korpus; producent deklaruje do 25 kg na półkę. Ogranicznik ruchu i doposażenie domyku należą do konfiguracji, nie do założenia o każdym zestawie. [Kesseböhmer LeMans](https://www.kesseboehmer.com/en/storage-solutions/kitchen/corner-units/lemans).

W pobranej instrukcji **MA 402118 0000, 08.05.2012, strona PDF 3** występują następujące wartości. To dane tej instrukcji, które wymagają przypisania do obecnego SKU; data pobrania nie czyni instrukcji nową.

| Wariant LeMans | A według rysunku | B — wymiar frontu, maksimum | C według rysunku, minimum |
|---|---:|---:|---:|
| 40 | 361–368 | 400 | 764 |
| 45 | 411–418 | 450 | 800 |
| 50 | 461–468 | 500 | 910 |
| 60 | 561–568 | 600 | 960 |

Na tym samym rysunku: minimum głębokości 500 mm i minimum otwarcia drzwi 85°, wraz z dodatkowymi ograniczeniami słupka i mocowania. A/B/C trzeba mapować z diagramu, nie z samej kolejności tekstu PDF. [Oryginalna instrukcja](https://peka.pl/do/file/pdf/instrukcje_montazu/systemy_narozne/le_mans/Instrukcja_montazu_LE_MANS_II.pdf).

Dla **VS CORNERSTONE MAXX**, broszura z oznaczeniem aktualizacji maj 2024, strona PDF 7, diagram podaje głębokość minimum 490 mm, boki 16–19 mm oraz zależności:

| A — wariant drzwi | B — minimalna szerokość z diagramu | C — minimalny otwór |
|---|---:|---:|
| 400 | 800 | 361 |
| 450 | 900 | 411 |
| 500 | 1000 | 461 |
| 600 | 1000 | 561 |

To odrębne wartości od LeMans. Biblioteka musi zachować diagram, wariant wysokości osi i pozostałe warunki. [Broszura producenta](https://vauth-sagel.com/files/PDF/Broschueren/EN/VS_CORNERSTONE_MAXX_EN.pdf).

Nie przenosić lewej/prawej strony przez odbicie modelu bez sprawdzenia, czy producent dostarcza warianty stron, czy mechanizm rzeczywiście jest przekładalny.

## 7. Magic Corner i kosze narożne

Warianty różnią się sposobem powiązania z frontem, liczbą etapów wysuwania, dostępem do tylnych koszy i stronnością. Vibo Smart Corner z analizowanej strony jest nieodwracalny i przeznaczony do określonych frontów. [Vibo Smart Corner](https://www.viboitaly.com/en/products/smart-corner-estraibile-cesti-lamina).

**GTV KO-WMC500-60:** karta strony wskazuje korpus zewnętrzny 900, światło 864, minimalną wysokość korpusu 590, minimum frontu 500 i obciążenie 24 kg. Instrukcja, strona PDF 2, pokazuje minimum głębokości montażowej 540 oraz LW=864. Nie należy używać jednej z ogólnych „głębokości produktu” na stronie jako zamiennika wymaganej przestrzeni instalacji. [Karta produktu](https://gtv.com.pl/produkt/KO-WMC500-60/).

**Amix MPTJ017E:** strona rozróżnia wersje lewe/prawe oraz deklaruje 6 kg na półkę. Wielkości produktu nie należy automatycznie interpretować jako minimum światła korpusu. [Amix MPTJ017E](https://amix.pl/pl/kosze-cargo-grupa-i/1994-MPTJ017E).

**Amix PTJ017J — rzeczywisty konflikt źródeł:** strona podaje do 25 kg, pobrana karta produktu na stronie PDF 1 podaje do 30 kg. Wymiary W525/D500/H600 są podane, ale limitu obciążenia nie można uznać za rozstrzygnięty. Profil otrzymuje status konfliktu; nie wybieramy po cichu większej ani mniejszej liczby. [Strona produktu](https://amix.pl/pl/kosze-cargo-grupa-i/1161-PTJ017J), [karta PDF](https://amix.pl/pl/index.php?controller=attachment&id_attachment=2746).

Instrukcja Magic Corner Comfort ma osobne schematy lewej i prawej strony, wymiary wierceń oraz różne limity koszy. Została pobrana jako materiał do normalizacji, bez zatwierdzenia wszystkich operacji produkcyjnych. [Instrukcja Comfort](https://peka.pl/do/file/pdf/instrukcje_montazu/systemy_narozne/magic_corner_comfort/Instrukcja_montazu_Magic_Corner_Comfort.pdf).

## 8. Obrotnice, szuflady narożne i windy

Obrotnice półkoliste, 3/4 koła i pełne koła wymagają odmiennych obrysów korpusu. REVO 90 obejmuje mechanikę frontów i nie jest prostym obrotem samej półki za dowolnymi drzwiami. [Kesseböhmer REVO 90](https://www.kesseboehmer.com/en/storage-solutions/kitchen/corner-units/revo-90). Instrukcje REVO i obrotnic 1/2 oraz 3/4 koła są w pakiecie.

Szuflady narożne trzeba klasyfikować osobno od nereki: inny front, inne łączenie płyt, inne prowadnice i przestrzeń poza meblem. Blum SPACE CORNER jest przykładem tej kategorii. Nie ma tu znormalizowanej reguły produkcyjnej dla niego.

Ninka Qanto frame 1 pokazuje trzeci kierunek ruchu — ponad blat. Sprawdzona karta, strona PDF 1, podaje pole planowania 650×650, głębokość blatu ≥600, wysuw 496 oraz odstęp co najmniej 200 od innych szafek w pozycji wysuniętej. Limity górnej i dolnej półki są różne: 10 i 15 kg. Warunków tych nie wolno przenosić na inne ramy Qanto. [Dokumenty Qanto](https://www.ninka.com/en/Qanto_Downloads.html).

Dla wszystkich narożników aplikacja powinna porównać także rozwiązanie bez mechanizmu narożnego: martwy narożnik plus dostępne szuflady obok. Jest to alternatywa projektowa, nie automatycznie gorszy wybór. Porównujemy dostępność zawartości, użytkową przestrzeń, koszt i kolizje, zamiast samej objętości korpusu.

## 9. Segregatory, zlew i instalacje

Hailo rozdziela systemy montowane z frontem, za drzwiami i wkładane do szuflad. Kosze o podobnej pojemności mogą więc wymagać innej konstrukcji. [Hailo — rodziny](https://www.hailo.de/en/built-in-technology/waste-separation-systems).

Przykład **Hailo 3608531**: nominalna szerokość szafki 500, boki 16–19, użyteczna głębokość minimum 405, wymiary produktu 462–468×400×424; pojemniki 18+13+13 l. Sam wymiar 400 produktu nie wystarcza do sprawdzenia montażu. Producent udostępnia instrukcję i zaznacza, że szablon wiercenia nie jest w skali. Nie mierzyć otworów linijką na ekranie ani na dowolnym wydruku. [Karta Hailo 3608531](https://www.hailo.de/de/p/hailo-as-cargo-synchro-500-181313d-3608531).

**Reguły projektowe:** zlew, syfon, węże, zawory, filtr i zbiornik powinny być bryłami przeszkód z przestrzenią obsługi. Wysoki pojemnik może nie wejść pod pokrywę mimo zgodności szerokości. Należy sprawdzić możliwość wyjęcia pojemników do góry i serwisowania zaworów. Wycięcie U w szufladzie może powstać tylko w obsługiwanej technologii; nie można dowolnie odcinać części kosza fabrycznego.

## 10. Zawiasy i drzwi

Dobór zawiasu to wspólny wybór puszki, ramienia, prowadnika, mocowania i liczby sztuk. Potrzebne są: wysokość/szerokość/masa frontu, materiał, grubość, nałożenie, układ boku, kąt otwarcia, szczelina i kolizje. Zawias szerokokątny nie zawsze gwarantuje zerowy uskok w dowolnym układzie.

Blum publikuje rozwiązania z zerowym uskokiem. Hettich pokazuje osobno mocowania, prowadniki, schematy wierceń i przykłady zastosowań. To właściwy wzorzec danych dla aplikacji. [Blum — zawiasy](https://www.blum.com/pl/pl/products/news-specials/new-hinges/overview/), [Hettich — przykłady Sensys](https://catalog.hettich.com/Hinges/Anwendungsbeispiele_Sensys/en_DE/catalogs/Anwendungsbeispiele_Sensys_en_DE/pdf/complete.pdf).

Reguła „dwa zawiasy na każdy front” jest niedopuszczalnym uproszczeniem. Ilość i rozmieszczenie trzeba brać z profilu producenta, z uwzględnieniem masy. Przy szufladach wewnętrznych trzeba kontrolować także położenie ramienia zawiasu na wysokości prowadnic i koszy.

## 11. Podnośniki frontów i opuszczane wyposażenie

Front uchylny, front składany, front unoszony równolegle i front przechodzący nad korpus mają różne tory ruchu. Rodziny AVENTOS HF/HS/HL/HK nie są zamiennymi wariantami jednego siłownika. [Blum — podnośniki](https://www.blum.com/in/en/products/liftsystems/aventos/overview/). Alternatywne rodziny do katalogowania to FREEspace/FREEfold/FREEslide, GRASS Kinvaro, Salice EvoLift/Wind; Pacta dotyczy frontów opuszczanych. [Salice](https://www.salice.com/us/en/products/lift-systems-and-flap-doors).

**Sprawdzony przykład doboru:** w pobranej pomocy zamawiania AVENTOS top, strona PDF 33, dla HK top Standard/SERVO-DRIVE zapisano:

`LF = wysokość korpusu [mm] × (masa frontu [kg] + 2 × masa uchwytu [kg])`

Przykład obliczeniowy: KH=400, front=5 kg, uchwyt=0,2 kg → LF=2160. Leży w dwóch zakresach tabeli: 930–2800 i 1730–5200. To lista kandydatów, nie rozstrzygnięcie całego zestawu. Trzeba uwzględnić rodzaj mocowania, pozostałe ograniczenia i zalecenia producenta. Nie stosować tego wzoru do wszystkich podnośników; w tej samej broszurze inne rodziny mają inne definicje. [Pliki AVENTOS HK top](https://www.blum.com/pl/pl/products/liftsystems/aventos-hk-top/downloads-videos/).

iMove i podobne windy opuszczają wyposażenie, a nie tylko otwierają front. Model ruchu musi uwzględnić uchwyt windy, zawartość i blat pod szafką. Instrukcja iMove jest pobrana; pełne ograniczenia nie zostały jeszcze przeniesione do profilu.

## 12. Kuchnie ukryte i systemy specjalne

Hawa Concepta/Folding Concepta, Blum REVEGO i Salice Exedra wymagają kieszeni i dedykowanej konstrukcji. Wymiary zwykłego frontu nie wystarczą. Hawa udostępnia konfiguratory, a Salice opisuje generowanie dokumentacji obróbki i złożenia 3D po konfiguracji. To inspiracja dla pełnego procesu naszej aplikacji, bez założenia dostępności publicznego API. [Hawa — narzędzia planowania](https://planningconcepta.hawa.com/), [Salice Exedra](https://www.salice.com/ww/fr/actualites/nouveautes/exedra-fonctionnalite-et-esthetique-pour-un-systeme-revisite).

Wysuwane stoły, półki pod mikser i stopnie wymagają modelu podparcia i blokad. SPACE STEP łączy schowek cokołowy i podest; zwykła szuflada nie może zostać potraktowana jako zamienny stopień. [Blum SPACE STEP](https://www.blum.com/al/en/products/cabinet-applications/space-step/overview/). Vibo Jino to wyciąg zmieniający się w wózek, co wymaga modelowania również ruchu poza korpusem. [Vibo Jino](https://www.viboitaly.com/en/products/jino-epoxy-coated-green-jino60vvr).

## 13. Okucia konstrukcyjne, profile i instalacje

Pełna dokumentacja mebla musi obejmować także połączenia płyt, zawieszki, nogi, listwy, podpórki, uchwyty, profile oraz otwory prowadzenia przewodów. Niewidoczny w renderze element nadal może generować wiercenia i wpływać na wykonalność.

Camar 807 jest przykładem systemu zawieszania z dedykowanymi płytkami ściennymi. Nie dobierać przypadkowej listwy na podstawie samej nośności. [Camar 807](https://www.camar.it/prodotti_sistemi_807.php). Hettich Korrekt pokazuje, że nośności pojedynczej nogi nie można bez ograniczeń mnożyć przez liczbę nóg: źródło określa też limit zestawu. [Korrekt](https://shop.hettich.com/gb_EN/Further-products/Plinth-adjustment-fittings/Korrekt-height-adjustable-leg%2C-450-kg-each/Korrekt-levelling-foot%2C-Plinth-height-100/p/61851).

Lamello oddziela CAD samego łącznika od CAD obróbki. Ten podział warto zastosować do wszystkich okuć w naszej bibliotece. Dostępność geometrii łącznika nie oznacza kompletnej operacji frezowania. [Clamex P-14](https://lamello.com/products/p-system/clamex-p-14).

LED i napędy wymagają zestawu zasilacz–przewody–sterowanie–odbiorniki oraz dostępu serwisowego. Przykład Loox5 ma określone napięcie, moc na metr i skok cięcia; przewód jest oddzielną pozycją. Nie generować dowolnej długości taśmy ani dobierać zasilacza wyłącznie po nazwie rodziny. [Häfele Loox5](https://www.hafele.pl/pl/product/ta-ma-led-haefele-loox5-eco-led-2074-12-v-8-mm-2-y-owa-monochromatyczna-/P-01453244/).

AGD jest osobnym źródłem ograniczeń: zabudowa lodówki, zmywarki, piekarnika i płyty wymaga instrukcji konkretnego urządzenia. Ten research nie ustala uniwersalnych wymiarów wentylacji lub mocowań AGD.

## 14. Źródła cyfrowe i ich ograniczenia

Peka udostępnia instrukcje i bibliotekę 3D z wariantami produktów. Zachować związek modelu ze SKU i pozycją otwarcia. Dwie bryły „zamknięte/otwarte” nie wyznaczają jednoznacznie całej trajektorii. [Instrukcje Peka](https://peka.pl/wsparcie-techniczne), [modele 3D Peka](https://peka.pl/modele-3d).

Vauth-Sagel opisuje konfigurator generujący listy cięcia, dane wierceń i modele dopasowane do korpusu, ale na tej samej stronie ostrzega o częściowo nieaktualnych danych. Nie traktować konfiguratora jako bezwarunkowego źródła prawdy. [Vauth-Sagel CAD/CAM](https://vauth-sagel.com/it/en/service/product-configurator).

W tej pracy użyto uzgodnionego scrapera HTTPX/BeautifulSoup/html2text. Załączniki z GTV odczytano również z atrybutów `data-url`. PDF-y zapisano w oryginale z SHA256, a kluczowe diagramy wyrenderowano i obejrzano. Nie wykonywano logowania do systemów producentów ani integracji z ich API.

Niektóre adresy katalogów zwracały błąd lub nie zwróciły PDF. Takie próby pozostają w rejestrze jako nieudane; nie są liczone jako pobrane dokumenty. Źródła zawierające tylko opis rodziny nie są dowodem wymiarów konkretnego produktu. Katalog regionalny służy rozpoznaniu rodziny; dostępność SKU w Polsce trzeba sprawdzić oddzielnie.

## 15. Co oznacza automatyczny dobór w Waszej aplikacji

Użytkownik wybiera cel, np. „garnki”, „zapasy”, „segregacja”, „przyprawy”, „narożnik”, oraz preferowany poziom wyposażenia. Aplikacja zna konstrukcję, fronty i otoczenie z projektu. Najpierw odrzuca rozwiązania niepasujące technicznie, potem porównuje pozostałe według uzgodnionych preferencji. Nie może poprawiać słabego dopasowania wymiarowego wysoką oceną ceny lub wyglądu.

Automatycznie wybiera rodzinę, wariant wysokości, długość, obciążenie, stronę, prowadnice i komponenty. Następnie pokazuje zwięzłe uzasadnienie oraz alternatywy. Użytkownik może zablokować wybór. Zmiana korpusu ponownie sprawdza blokadę; nie podmienia okuć potajemnie.

**Dla szafki 800×600:** przy bokach 18 światło prostego korpusu wynosi 764. Długość 550 może być kandydatem dla szuflady, lecz dopiero po obliczeniu głębokości użytecznej i sprawdzeniu właściwej instrukcji. Nie wybieramy „nerki 800” bez typu narożnika, frontu, otworu dostępu i strony. GTV KO-WMC500 z wymaganym LW864 odpada przy świetle 764, mimo występowania liczby 500 w nazwie. Układ dwóch lub trzech szuflad wymaga jeszcze wysokości korpusu i podziału frontów.

## 16. Kolejność wdrożenia

1. Silnik reguł i spójny model mebla; bazowe szuflady Amix/GTV/Blum; zwykłe drzwi i prowadniki; wszystkie części oraz operacje dla obsługiwanych profili.
2. Szuflady wewnętrzne, koszowe, cargo podblatowe i segregatory. To test kompletowania zestawów i przeszkód wewnątrz korpusu.
3. Jeden zweryfikowany system nerki i jeden Magic Corner, następnie obrotnice. Tu wymagane są trajektorie i kontrola kolizji poza korpusem.
4. Cargo wysokie, podnośniki i opuszczane półki; kontrola mas, prześwitów i zależności ruchu.
5. Drzwi kieszeniowe, windy w blacie, stoły, stopnie i integracje elektryczne.

Cała taksonomia może być obecna od początku w interfejsie. Automatyczny dobór i eksport produkcyjny należy włączać tylko dla konkretnych, kompletnych profili. Wybór nowych marek nie zastępuje walidacji warsztatowej.

## 17. Otwarty rejestr problemów

| Problem | Skutek dla aplikacji | Wymagane rozstrzygnięcie |
|---|---|---|
| Amix PTJ017J: 25 kg na stronie, 30 kg w karcie | brak zatwierdzonego limitu | rewizja i potwierdzenie dla kupowanego SKU |
| Starsze instrukcje nadal publikowane | ryzyko mieszania generacji | mapowanie dokument → rewizja produktu |
| Ukryty/stary tekst w PDF GTV | błędny odczyt może wskazać front 450 | używać widocznego diagramu i sprawdzać ekstrakcję |
| Powtarzające się nazwy, np. TANDEM | błędne połączenie rodzin | producent + rodzina + identyfikator |
| Część modeli to tylko bryła otwarta/zamknięta | nieznana trajektoria | dane ruchu lub zatwierdzona obwiednia |
| Niepełne listy SKU i zestawów | pominięte prowadnice/mocowania | normalizacja kompletu zakupowego |
| Brak profilu technologii zakładu | niepewny eksport maszynowy | osie, narzędzia, tolerancje, format CNC |

Efektem researchu jest mapa produktów, biblioteka źródeł i projekt zasad automatycznego doboru. Kompletna walidacja wszystkich systemów rynku oraz integracja z aplikacją nie są wykonane w tym opracowaniu.
