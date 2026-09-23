# Research UX: konfiguratory i programy do projektowania zabudów, a Stolarnia Online

Data: 2026-09-23. Tylko publiczne źródła (strony producentów, help center, fora, recenzje). **[?]** oznacza twierdzenie niezweryfikowane: wnioskuję je, dostępne materiały są niepełne albo pochodzą tylko z materiałów marketingowych.

---

## 0. Co ustaliłem o poszczególnych narzędziach

| Narzędzie | Układ i przebieg pracy | Dodawanie, wymiary, przyciąganie | Wycena i eksport | Źródła |
|---|---|---|---|---|
| **IKEA Kitchen Planner (METOD)** | Kreator: potrzeby (AGD, kształt L/U), potem pomieszczenie (przeciąganie ścian, wymiary wpisywane, okna, przyłącze wody), potem **gotowe propozycje kuchni**, potem szafki, blat, AGD, na końcu zapis. Menu opcji wybranego elementu po prawej [?], lista elementów z ceną. | Klik w katalogu wstawia szafkę do planu, potem przesuwanie „krzyżykiem”. Przy ścianie szafka sama się obraca, przy innej szafce przyciąga się magnetycznie. Pola pozycji do wpisania. Ctrl+Z. Siatka przyciągania „walczy” przy precyzyjnym ustawianiu. Tryb 3D „linie” jest szybszy od 3D z teksturami. | Lista pozycji z cenami (fronty, zawiasy, cokoły, blendy), wydruk i PDF, kod projektu do sklepu. Planer sam dokłada cokoły, zlewy i akcesoria, które użytkownik musi potem usuwać. | [IKEA quick guide](https://www.ikea.com/be/en/planners/ikea-kitchen-planner-quick-guide-pub515d8bc0/), [House Digest](https://www.housedigest.com/1632701/how-use-ikea-kitchen-planner-tips-home-design/), [Dendra 14 tips](https://dendradoor.com/14-tips-for-the-ikea-kitchen-planner/), [kitchen-fitters](https://www.kitchen-fitters.com/blog/how-use-ikea-kitchen-planner) |
| **IKEA PAX** | Pomieszczenie (uchwyty narożników albo pola wymiarów), korpusy przeciągane do planu, potem drzwi i uchwyty, potem **wnętrze**: organizery przeciągane do korpusu, a podczas przeciągania pokazują się **wymiary pomocnicze** (odstępy). Przycisk „Finalise” daje zestawienie. Podgląd 3D przez cały czas. | Przeciąganie i upuszczanie, wymiary wpisywane w polach | Lista pozycji | [IKEA PAX](https://www.ikea.com/us/en/planners/pax-planner/), [Chris Loves Julia](https://chrislovesjulia.com/how-to-use-the-ikea-pax-wardrobe-planner-our-master-closet-mood-board/), [House Digest](https://www.housedigest.com/1908134/ikea-online-closet-design-tool/) |
| **Blum Cabinet Configurator (następca DYNAPLAN)** | Przeglądarka, sekwencja kroków: korpus (wymiary, fronty jedno- lub dwuczęściowe, automatyczna waga frontu), potem **konstrukcja wnętrza przeciąganiem** (półki, przegrody, rzędy otworów), potem okucia, **kontrola kolizji**, potem wyniki. Biblioteka własnych szablonów, projekty, listy zamówień. | Wymiary się wpisuje, nie rysuje. Okucia duplikuje się jednym kliknięciem. | Lista rozkroju, rysunki, BXF/CAD, wysyłka listy do dystrybutora. Użytkownicy chwalą szybkość w porównaniu z rysowaniem, a narzekają na logowanie i „słabo rozplanowany” interfejs. | [Blum CC](https://www.blum.com/aa/en/services/planning-construction-product-selection/cabinet-configurator/), [Blum E-SERVICES](https://www.blum.com/gb/en/services/technical-services/e-services/), [Festool forum](https://festoolownersgroup.com/threads/blum-cabinet-configurator.65295/) |
| **Roomle Rubens** | Scena 3D z panelem parametrów. **Smart sizing**: suwak albo wpisanie cm, a system dobiera pasujący wariant. Moduły dokowane w punktach („dock-lines”). Wersja mobilna projektowana pod kciuk, AR bez aplikacji. Szkic można wysłać mailem. | Dokowanie modułów. Klikalne „+” przy punktach dokowania [?] | **Lista części i cena liczone na żywo w panelu obok**. Na produkcję wychodzi tylko lista części w JSON, bez DXF i CNC. | [Roomle blog](https://www.roomle.com/en/blog/new-configurator-interface), [Rubens](https://www.roomle.com/en/blog/roomle-rubens-configurator), [docs planner](https://docs.roomle.com/rubens/content-creation/roomlescript-reference/configurator-planner-interaction), [configurator.tech](https://configurator.tech/blogs/roomle-product-configurator-review/) |
| **Threekit / Zolak** | E-commerce: swatche materiałów (w Zolak na pełnym ekranie), dynamiczna cena, porównywanie wariantów w scenie, udostępnianie i wishlisty, etykiety części produktu | n/d | Cena na żywo | [Threekit UX](https://www.threekit.com/capabilities/ux-ui), [Zolak](https://zolak.tech/3d-furniture-configurator) |
| **Polyboard (Wood Designer)** | Szafka to **jeden parametryczny obiekt**: wpisujesz wymiary korpusu, potem **zaznaczasz wewnętrzną strefę (podświetla się na niebiesko)** i z menu dodajesz półkę, przegrodę, drzwi albo szufladę. Po zmianie wymiaru przeliczają się wszystkie części i okucia. „Style” zapisują materiały i sposób konstrukcji (nakładanie, wpuszczanie, luzy, obrzeża). Szafki przeciąga się do projektu pomieszczenia. | Wymiary wpisywane numerycznie, reguły okuć stosowane jednym kliknięciem | Konfigurowalny moduł wyceny, lista rozkroju PDF/CSV, rozkroje z usłojeniem, etykiety z kodem kreskowym, CNC | [Polyboard tools](https://wooddesigner.org/polyboard-software-tools/), [cabinet software](https://wooddesigner.org/cabinet-design-software/), [shelves/uprights](https://wooddesigner.org/support/polyboard-videos/shelves-uprights) |
| **Mozaik** | Rzut i elewacje z przeciąganiem, zakładka Room (ściany, okna, zlew, przyłącza, gniazdka). **AutoFill** wypełnia przestrzeń, ścianę albo pokój szafkami z biblioteki według kryteriów, z uwzględnieniem prześwitów bocznych. Skróty: bump (dosunięcie), obrót, grupowanie. | Na forum krytyka, że własne części trzeba ustawiać współrzędnymi x/y/z, a w Cabinet Vision wystarczy przeciągnąć do punktów przyciągania. | Rysunki łączone (rzut, elewacje, przekroje, 3D). Słabe etykiety obrzeży (forum). | [Mozaik](https://www.mozaiksoftware.com/mozaik-products), [Room tab](https://sites.google.com/view/mozaikonlinehelp/training-videos/room-tab), [AutoFill](https://www.scribd.com/document/892436689/Auto-Fill), [WOODWEB](https://www.woodweb.com/forum_fdse_files/cnc/843629.html) |
| **Cabinet Vision** | Szafka upuszczona w rogu sama „odbija” na swoją głębokość, a przy sąsiedniej szafce ustawia się bez szczeliny. **Po upuszczeniu w lukę rozszerza się, żeby ją wypełnić.** Blendy (fillers) to osobne komponenty, domyślnie 50 mm w narożniku. Narożniki powstają przez „Combine assemblies”. Szerokość i prześwity L/P zmienia się w kalkulatorze w lewym panelu, a przy zmianie program pyta, w którą stronę rosnąć. | F3 włącza tryb wstawiania, prawy przycisk myszy obraca i zmienia materiał | Screen-to-machine. Stroma krzywa uczenia i wysoka cena. | [CV KB](https://cabinetvision.screenstepslive.com/s/cvnz/m/layout/l/871038-plan-and-elevation-placing-assemblies-objects-f3), [WOODWEB](https://woodweb.com/cgi-bin/forums/cad.pl?read=843166) |
| **imos iX** | „drag&drop” i „move&match” (dopasowanie do otoczenia). Korpus może podążać za konturem ściany lub skosu. Łączniki i okucia dobierane są regułami. | n/d | Pełny CAM | [iX CAD](https://www.imos3d.com/en/products/design-order/ix-cad-1/) |
| **SketchUp + Dynamic Components / OpenCutList** | Parametry w oknie Component Options, uchwyty skalowania można zablokować. Użytkownicy mylą narzędzie Interact z Options. OpenCutList: lista części, rozkroje, **obrzeża zaznaczone kolorem na rozkroju i etykietach**, eksport SVG/DXF/CSV. | Uchwyty albo dialog | Rozkrój, etykiety, koszt i waga | [SketchUp DC](https://help.sketchup.com/en/sketchup/interacting-dynamic-components), [OpenCutList](https://docs.opencutlist.org/) |
| **SketchList 3D** | Deski przeciągane w 3D z przyciąganiem, **niebieskie kropki w narożnikach do wymiarowania przeciąganiem**, kopiowanie pozycji, niski próg wejścia | Przeciąganie z przyciąganiem | Lista rozkroju | [SketchList](https://sketchlist.com/blog/drag-drop-furniture-design-software/), [Capterra](https://www.capterra.com/p/204375/SketchList-3D/reviews/) |
| **2020 Design / Planner 5D / Homestyler** | Przeciąganie z katalogu na rzut, przełączanie 2D/3D, katalogi producentów w chmurze. Recenzje 2020: chmura jest wolna, zdarzają się awarie, trudno wyszukiwać i wstawiać elementy. | Przeciąganie i upuszczanie | Rendering, raport | [2020 reviews](https://www.softwareadvice.com/architecture/2020-design-live-profile/), [Planner 5D](https://planner5d.com/use/kitchen-planner-tool) |
| **PRO100 (Viasoft)** | Praca od razu w 3D, 5 trybów wyświetlania (od szkieletu do pełnej wizualizacji), ukrywanie elementów daleko od rzutni, żeby dostać elewację | **Bogate modyfikatory przy przesuwaniu:** Shift wyłącza kolizje, Alt przyciąga do krawędzi, Alt+C do osi. Ctrl+D duplikat, Ctrl+L lustro, Ctrl+[ / ] obrót o 90°, Ctrl+I materiał, Ctrl+Z/Y. Wymiarowanie automatyczne i ręczne na warstwach. | Lista formatek, wycena, rozkrój przez Nowy Rozkrój | [skróty PRO100](https://www.ecru.pl/pl/faq/skroty-klawiaturowe-w-pro100), [Viasoft](https://viasoft.pl/blog/jakie-programy-do-projektowania-mebli-wybrac-na-poczatek) |
| **KD Max** | **Inteligentna zabudowa**: wskazujesz ścianę lub ściany i zlew, a program sam układa szafki i AGD (prosta, L). Blenda z biblioteki sama dosuwa się do wskazanej ściany. Listwa podsufitowa generowana automatycznie. Kolizje są podświetlane. | Parametry edytowane w oknie | Automatyczna wycena (za sztukę lub za metr, osobne ceny frontów), formatki, lista kolizji | [KD Max funkcje](https://www.kdmax.pl/funkcje/), [3dcad.pl](https://3dcad.pl/aktualnosci/6066/zobacz-co-potrafi-nowy-kd-max-do-projektowania-kuchni-i-szaf.html) |
| **Nowy Rozkrój / Mega Rozkrój** | Szybkie skróty do oklejania formatek, domyślne obrzeże dla zaznaczonego zestawu, usłojenie, rzaz, etykiety, magazyn płyt i obrzeży. W Mega Rozkrój operator przy pile klika formatkę na rozkroju i drukuje etykietę. | n/d | Eksport do pił (Homag, SCM, Felder i inne) | [Nowy Rozkrój](https://www.ecru.pl/pl/nowy-rozkroj), [Mega Rozkrój](https://www.megarozkroj.pl/) |
| **Designer Komandor** | **Pytania na start** (rozmiar w 3 przedziałach, styl, co przechowujesz, zaznaczane ikonami), z których powstaje model wzorcowy do edycji. Dalej zakładki Korpus (wymiary, sposób osadzenia we wnęce), Fronty (liczba drzwi, podziały, szkło, profile) i Wnętrze (gotowe zestawy). Tryb „ubrania” pokazuje pojemność. AR. Aplikacje na iOS i Android. | Wymiary wpisywane w zakładce | Projekt idzie do wyceny przez projektanta | [Komandor 5 kroków](https://www.komandor.pl/blog/jak-zaprojektowac-szafe-w-5-krokach), [Designer](https://designer.komandor.pl/) |
| **Flatma** | Przeglądarka, bez rejestracji, działa na telefonie. „Draw”: szkicujesz ramę, dodajesz panele, drzwi i szuflady. Generator AI z opisu. | n/d | Rozkrój płyt, obrzeża, wiercenia, koszt | [Flatma](https://flatma.com/en/) |
| **Leroy Merlin Planer 3D (Delinia) / Castorama** | Kształt pomieszczenia, drzwi i okna, wymiary, potem kolekcja (24 kolekcje Delinia), potem ściany i podłoga. W Castoramie projekt kończy się konsultacją, a e-mail zawiera wizualizację, rzut i kosztorys z linkiem do zamówienia. | Przeciąganie [?] | Kosztorys, lista produktów | [LM Planer](https://media.leroymerlin.pl/aktualnosci/aplikacja-leroy-merlin-planer-3d-idealna-kuchnia-od-projektu-do-realizacji), [Castorama](https://www.castorama.pl/planowanie-kuchni-krok-po-kroku-ins-95386.html) |

Nie znalazłem publicznych materiałów o interakcji w konfiguratorach Polboard/Kompozyt, Formatec, Wood-Tec, BRW, Nobilia i Häcker. Wszystko, co można by o nich napisać, byłoby niezweryfikowane.

---

## 1. Najlepsze wzorce interakcji i kto robi je najlepiej

| Wzorzec | Najlepiej robi | Uwagi |
|---|---|---|
| Szafka wstawiona w lukę sama się do niej dopasowuje | Cabinet Vision | Najszybsze domknięcie ciągu szafek |
| Automatyczne wypełnienie ściany według reguł | Mozaik AutoFill, KD Max „inteligentna zabudowa” | Wejściem jest ściana plus punkty stałe (zlew, AGD) |
| Blenda jako komponent, który sam dosuwa się do ściany | KD Max, Cabinet Vision (domyślnie 50 mm) | |
| Pytanie przy zmianie szerokości, którą stronę przesunąć | Cabinet Vision | U nas: kotwica lewa, prawa albo środek |
| Zaznaczenie strefy wewnątrz szafki, potem menu wstawiania | Polyboard | Idealne do szaf i komód |
| Wymiary pomocnicze pokazywane w trakcie przeciągania | IKEA PAX, SketchList | |
| Modyfikatory przyciągania i kolizji pod klawiszami | PRO100 (Shift, Alt, Alt+C) | |
| Cena na żywo obok modelu | Roomle, Threekit | |
| Start od pytań lub szablonu zamiast pustego płótna | Komandor, IKEA (propozycje kuchni) | |
| Style materiałowe i konstrukcyjne jako globalny preset | Polyboard | Pasuje wprost do naszych Eco, Standard, Premium i VIP |
| Kontrola kolizji zanim projekt trafi do produkcji | Blum, KD Max | |
| Obrzeże zaznaczone kolorem na rozkroju i etykietach | OpenCutList | |
| Etykieta drukowana kliknięciem formatki na rozkroju | Mega Rozkrój | |
| Szybszy, uproszczony tryb podglądu | IKEA („3D Line”), PRO100 (5 trybów) | |
| Układ działający na telefonie, AR | Roomle, Komandor, Flatma | |

---

## 2. Top 15 rekomendacji dla Stolarni Online

| # | Priorytet | Rekomendacja | Uzasadnienie |
|---|---|---|---|
| 1 | **P1** | **Undo/redo** (Ctrl+Z, Ctrl+Y) na stosie komend, łącznie z historią zmian w inspektorze | Standard wszędzie. W IKEA to podstawowy sposób ratowania się po błędzie. |
| 2 | **P1** | **Wymiary klikalne na płótnie**: klik w szerokość modułu albo w lukę otwiera pole do wpisania wartości. Inspektor zostaje do reszty parametrów. | SketchList i PAX pokazują wymiary w miejscu pracy. Mozaik jest krytykowany za wpisywanie współrzędnych. |
| 3 | **P1** | **Pasek pozostałego miejsca na ścianie** (np. „Pozostało 37 mm”) z przyciskami „Wstaw blendę”, „Rozszerz sąsiada” i „Rozłóż równo” | Cabinet Vision i KD Max. Stolarz nie liczy luki ręcznie. |
| 4 | **P1** | **Moduł upuszczony w lukę sam się dopasowuje**, z zakresem min/max szerokości i skokiem modułu | Cabinet Vision |
| 5 | **P1** | **Stały pasek ceny z 4 wariantami** (Eco, Standard, Premium, VIP) i różnicą po ostatniej zmianie, np. „+420 zł” | Roomle i Threekit. Klient i stolarz od razu widzą koszt decyzji. |
| 6 | **P1** | **Panel walidacji**: lista błędów i ostrzeżeń, klik zaznacza element, na płótnie czerwone kreskowanie w miejscu kolizji. Produkcja zablokowana przy błędach krytycznych. | Blum i KD Max |
| 7 | **P1** | **Autozapis** ze wskaźnikiem „Zapisano”, żadnego ręcznego zapisywania | Największa skarga na IKEA: utrata pracy, zalecenie „zapisuj po każdej zmianie” |
| 8 | **P2** | **Przeciąganie z katalogu na płótno** z podglądem miejsca wstawienia (zostaje też klik = dodaj na koniec) oraz **„+” na końcach ciągu i w lukach** | IKEA, Roomle [?], 2020 |
| 9 | **P2** | **Wybór strefy wewnątrz modułu** (Polyboard): klik w strefę, potem „półka / przegroda / szuflada / drążek”, podział na N równych części | Najszybsza edycja wnętrza szaf |
| 10 | **P2** | **Kotwica przy zmianie szerokości** (lewa, prawa, środek) i przesuwanie sąsiadów (ripple) albo nie | Cabinet Vision pyta o kierunek |
| 11 | **P2** | **Skróty klawiszowe**: Del, Ctrl+D, strzałki (1 mm, z Shift 10 mm), Alt = bez przyciągania, `[` `]` zmiana zaznaczenia, `?` ściąga ze skrótami | Szybkość jak w PRO100 |
| 12 | **P2** | **Globalne style**: materiał korpusu, frontu i obrzeża oraz konstrukcja ustawiane na projekt lub ścianę, z nadpisaniem per moduł (nadpisanie widoczne kropką) | Polyboard. Rozwiązuje skargę z IKEA na zmienianie frontów szafka po szafce. |
| 13 | **P2** | **Start z szablonu lub pytań**: typ (kuchnia prosta/L, szafa wnękowa), wymiary wnęki, potem gotowy układ do edycji | Komandor, IKEA, KD Max |
| 14 | **P3** | **Widoki dzielone**: rzut z góry (wybór ściany) obok elewacji, później 3D w three.js, w tym tryb uproszczony | IKEA i PRO100: szybki tryb do pracy, ładny do prezentacji |
| 15 | **P3** | **Produkcja**: obrzeża kolorem na formatkach i rozkroju, etykiety z kodem, klik formatki podświetla ją w module. PDF oferty dla klienta z wizualizacją i 4 wariantami. | OpenCutList, Mega Rozkrój, Castorama (kosztorys plus wizualizacja w jednym mailu) |

---

## 3. Rekomendowany układ ekranu

- **Górny pasek**: nazwa projektu i status autozapisu, undo/redo, kroki pracy **Pomieszczenie, Zabudowa, Materiały, Wycena, Produkcja** (w miejscu obecnych oddzielnych zakładek), przełącznik widoku (Elewacja / Rzut / 3D / Podział), **pasek ceny z 4 wariantami** (aktywny wariant wyróżniony, klik przełącza).
- **Lewy panel (zwijany)**: wyszukiwarka i filtry (dolne, górne, słupki, narożne, AGD, blendy), miniatury SVG modułów do przeciągania, sekcja „Szablony” i „Moje moduły”.
- **Centrum**: zakładki ścian (A, B, C) nad elewacją. Na płótnie łańcuch wymiarów (moduły, luki, całość), linijka, pasek pozostałego miejsca pod ścianą, „+” na końcach ciągu. Opcjonalnie minirzut w rogu do wyboru ściany.
- **Prawy inspektor, kontekstowy według poziomu zaznaczenia**: Projekt, potem Ściana, potem Moduł, potem Strefa lub Front. Okruszki (breadcrumbs) na górze, grupy zwijane (Wymiary, Fronty, Wnętrze, Materiały, Okucia), a przy parametrze znacznik „nadpisane względem stylu”.
- **Dolny pasek statusu**: licznik błędów i ostrzeżeń, który rozwija panel walidacji, oraz podpowiedź skrótów dla bieżącego narzędzia.
- **Tablet**: inspektor jako wysuwany panel, większe uchwyty (min. 44 px), przeciąganie jednym palcem, powiększanie dwoma.

---

## 4. Czego unikać (skargi z recenzji i forów)

1. **Wolne 3D blokujące pracę.** IKEA ma opóźnienia i awarie przy zmianie blatu, 2020 ma wolną chmurę. Edycja powinna iść w lekkim 2D, a 3D ładować się leniwie ([Mumsnet](https://www.mumsnet.com/talk/property/2096865-IKEA-kitchen-planner-frustration), [Dendra](https://dendradoor.com/14-tips-for-the-ikea-kitchen-planner/)).
2. **Utrata pracy i ręczny zapis** (IKEA).
3. **Zmiana frontu lub blatu osobno na każdej szafce** po fakcie (Mumsnet). Potrzebne są style globalne.
4. **Niewidoczne automatyczne dodatki.** IKEA sama dokłada cokoły i akcesoria, które trzeba potem usuwać. Automat może dodawać, ale widocznie i z możliwością cofnięcia.
5. **Przyciąganie, które „walczy” z precyzją.** Potrzebny klawisz wyłączający (Alt w PRO100) i możliwość wpisania wartości.
6. **Pozycjonowanie tylko przez współrzędne x/y/z** (krytyka Mozaika na WOODWEB).
7. **Mylące tryby narzędzi** (Interact kontra Options w SketchUp) i **bariery przy logowaniu lub dostępie** (Blum).
8. **Stroma krzywa uczenia** (Mozaik, Cabinet Vision: płatne szkolenia).

---

## 5. Szybkie poprawki (React + SVG, w jeden dzień)

1. **Undo/redo**: stos zmian stanu projektu (np. `immer` produceWithPatches albo migawki) plus Ctrl+Z, Ctrl+Y i przyciski w pasku.
2. **Łańcuch wymiarów na SVG**: szerokości modułów, luki między nimi i do ścian. Klik otwiera nakładkę `<foreignObject><input>`, Enter zatwierdza.
3. **Pasek pozostałego miejsca** z przyciskami „Blenda”, „Rozszerz ostatni” i „Rozłóż równo” (równy podział reszty na moduły o regulowanej szerokości).
4. **Stały pasek ceny z 4 wariantami** i animowaną różnicą (`useMemo` na obecnym silniku wyceny).
5. **Skróty**: Del, Ctrl+D, strzałki z Shift, Esc (odznacz), Alt w trakcie przeciągania = bez przyciągania.
6. **Panel walidacji** z listy obecnych ostrzeżeń kolizji: klik zaznacza moduł, na płótnie kreskowanie przez `<pattern>`.
7. **Autozapis** do localStorage lub backendu z debounce 1 s i znacznikiem „Zapisano 12:04”.
8. **Podgląd miejsca wstawienia**: przy najechaniu na ciąg pokazać cień modułu i pionową linię wstawienia. Wcześniej „+” na końcu ciągu.
9. **Swatche materiałów**: siatka kafelków z teksturą lub kolorem i sekcją „Ostatnio użyte” zamiast listy rozwijanej.
10. **Ściąga skrótów** pod `?` i puste płótno z trzema dużymi szablonami na start.

---

### Źródła (główne)
IKEA: https://www.ikea.com/be/en/planners/ikea-kitchen-planner-quick-guide-pub515d8bc0/ · https://www.housedigest.com/1632701/how-use-ikea-kitchen-planner-tips-home-design/ · https://dendradoor.com/14-tips-for-the-ikea-kitchen-planner/ · https://www.kitchen-fitters.com/blog/how-use-ikea-kitchen-planner · https://www.mumsnet.com/talk/property/2096865-IKEA-kitchen-planner-frustration · https://chrislovesjulia.com/how-to-use-the-ikea-pax-wardrobe-planner-our-master-closet-mood-board/
Blum: https://www.blum.com/aa/en/services/planning-construction-product-selection/cabinet-configurator/ · https://festoolownersgroup.com/threads/blum-cabinet-configurator.65295/
Roomle, Threekit, Zolak: https://www.roomle.com/en/blog/new-configurator-interface · https://configurator.tech/blogs/roomle-product-configurator-review/ · https://www.threekit.com/capabilities/ux-ui · https://zolak.tech/3d-furniture-configurator
Pro: https://wooddesigner.org/polyboard-software-tools/ · https://wooddesigner.org/support/polyboard-videos/shelves-uprights · https://www.mozaiksoftware.com/mozaik-products · https://www.woodweb.com/forum_fdse_files/cnc/843629.html · https://cabinetvision.screenstepslive.com/s/cvnz/m/layout/l/871038-plan-and-elevation-placing-assemblies-objects-f3 · https://www.imos3d.com/en/products/design-order/ix-cad-1/ · https://docs.opencutlist.org/ · https://help.sketchup.com/en/sketchup/interacting-dynamic-components · https://sketchlist.com/blog/drag-drop-furniture-design-software/ · https://www.softwareadvice.com/architecture/2020-design-live-profile/
PL: https://www.ecru.pl/pl/faq/skroty-klawiaturowe-w-pro100 · https://www.kdmax.pl/funkcje/ · https://www.ecru.pl/pl/nowy-rozkroj · https://www.megarozkroj.pl/ · https://www.komandor.pl/blog/jak-zaprojektowac-szafe-w-5-krokach · https://flatma.com/en/ · https://media.leroymerlin.pl/aktualnosci/aplikacja-leroy-merlin-planer-3d-idealna-kuchnia-od-projektu-do-realizacji · https://www.castorama.pl/planowanie-kuchni-krok-po-kroku-ins-95386.html
