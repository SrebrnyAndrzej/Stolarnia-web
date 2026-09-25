# Kreator meblowy najwyższej klasy — brief dla Claude

Data researchu: 25.09.2026. Autor: Codex. Zakres: wymagania, źródła i kryteria odbioru. Implementację prowadzi Claude. Dokument uzupełnia `RESEARCH-silnik-mebli-i-konta.md` oraz `RESEARCH-konstruktor-mebli-niestandardowych.md`; nie oznacza, że opisane funkcje są wdrożone.

## 1. Co oznacza „najwyższa półka” dla tej stolarni

Projektant swobodnie zmienia mebel, klient rozumie rezultat, a pracownik otrzymuje komplet danych do wykonania tego samego projektu. Zmiana frontu lub okucia ma ujawnić wszystkie konsekwencje dla wnętrza, wierceń, ceny i zamówienia. Piękny obraz nie potwierdza możliwości wykonania.

Docelowy produkt obejmuje trzy środowiska: projektowanie, prezentację klientowi i przygotowanie produkcji. Nie trzeba pokazywać wszystkich narzędzi naraz. Wspólnym punktem odniesienia jest konkretna rewizja projektu.

## 2. Wzorce rynkowe: co faktycznie opisują producenci

Przegląd oficjalnych dokumentacji i stron produktowych, bez testów płatnych systemów. Deklaracje dostawców nie są niezależnym pomiarem jakości. Poniższe wymagania dla naszej aplikacji są rekomendacją, nie przypisaniem każdej funkcji wszystkim porównywanym narzędziom.

| System / źródło | Potwierdzona funkcjonalność | Wniosek dla naszej aplikacji |
|---|---|---|
| [Blum Cabinet Configurator](https://www.blum.com/aa/en/services/planning-construction-product-selection/cabinet-configurator/) | Kontrola kolizji, podziały frontów i pleców, dobór okuć, listy cięcia, rysunki, BXF z wymiarami i pozycjami wierceń | Projektowanie musi kończyć się danymi części; trzeba umożliwić zmiany także po doborze okuć |
| [Mozaik Manufacturing](https://www.mozaiksoftware.com/en-GB/mozaik-products/mozaik-manufacturing-) | Oddzielna edycja frontu i wnętrza, własne części, biblioteki okuć, szuflady, listy i rysunki warsztatowe | Kluczowe są niezależne podziały frontów i wyposażenia oraz zapis własnych konstrukcji |
| [imos iX](https://www.imos3d.com/en/products/design-order) | Powiązane konstrukcyjnie części, materiały, obrzeża, wiercenia i połączenia; dobór okuć i kolizje; przekroje i widoki rozstrzelone | Automatyka ma uwzględniać zależności między częściami, nie tylko ich położenie |
| [iFurn](https://www.imos3d.com/en/products/design-order/supplier-data/) | Dane dostawców, akcesoria i prezentacja 3D zintegrowane z projektowaniem | Biblioteka producenta powinna obejmować komponenty potrzebne do kompletnego zestawu |
| [HOMAG cabinetCreator — broszura](https://www.homag.com/fileadmin/systems/brochures/cell-concepts-networked-production-en.pdf) | Konfiguracja webowa, własna biblioteka i zasady konstrukcyjne, dane części, rysunki, montaż 3D i programy CNC w opisanym rozwiązaniu | Potrzebne są profile warsztatu; eksport maszyny to osobny zakres integracji |
| [Cyncly Winner Flex — broszura](https://spaces.cyncly.com/rs/637-XCA-146/images/Winner_Flex_Brochure%20EN.pdf?version=0) | Planowanie pomieszczeń, wizualizacja, wycena, zamówienia i praca na danych w chmurze | Prezentacja i sprzedaż powinny korzystać z aktualnego projektu bez ponownego rysowania |
| [Roomle — dokumentacja](https://docs.roomle.com/rubens/content-creation/overview) | Rozdziela statyczny viewer, zmianę materiałów i konfigurację parametryczną | Sam wybór dekoru na modelu nie spełnia wymagań kreatora własnego mebla |
| [HOMAG intelliDivide](https://www.homag.com/en/software-detail/software/work-preparation/intellidivide-cutting) | Różne cele optymalizacji rozkroju: odpad, czas i obsługa; ciągłość wzoru frontów | Najmniejszy odpad nie zawsze oznacza najlepszy plan dla warsztatu |
| [Hettich CAD](https://www.hettich.com/en-us/services/hettich-cad/cad-downloads) | Pakiety CAD, rysunki montażowe i pomoce planistyczne dla wielu rodzin okuć | Dane wizualne i montażowe trzeba pozyskiwać razem, z przypisaniem do wariantu |

Nie potwierdzono otwartego, publicznego API produkcyjnego Blum do osadzenia w naszym silniku. Dostępność konfiguratora w przeglądarce nie oznacza dostępności takiej integracji. Warunki użycia modeli CAD, zdjęć i tekstur sprawdzić przed ich redystrybucją; dostępny plik nie jest automatycznie zgodą na publiczny katalog.

## 3. Wymagania funkcjonalne

P0 — warunek wiarygodnego pierwszego wydania; P1 — standard profesjonalnej pracy; P2 — późniejsze rozszerzenia premium. Priorytet nie oznacza, że całą kategorię trzeba dostarczyć jednym wdrożeniem.

| ID | Priorytet | Co powinien umieć kreator | Dowód odbioru |
|---|---|---|---|
| K01 | P0 | Utworzenie mebla od gabarytów albo szablonu zakładu | Użytkownik tworzy mebel o niestandardowej szerokości bez zmiany kodu |
| K02 | P0 | Zagnieżdżone podziały pionowe i poziome: płyta lub umowna strefa | Nierówne komory liczą światło po odjęciu rzeczywistych przegród |
| K03 | P0 | Wymiary stałe, równe, proporcjonalne i „pozostałe miejsce” | Zmiana gabarytu zachowuje wymiar zablokowanej komory albo zgłasza konflikt |
| K04 | P0 | Osobny układ frontów i wnętrza, jawne powiązania między nimi | Jeden front może zasłaniać dwa wysuwy; półka może podążać za podziałem frontu |
| K05 | P0 | Zamiana drzwi na szuflady i odwrotnie | Usuwane są niepotrzebne zawiasy i operacje, pojawia się pełne nowe wyposażenie |
| K06 | P0 | Szuflady wewnętrzne za drzwiami; wysoka szuflada z ukrytą szufladą | Zweryfikowane drzwi, zawiasy, prowadnice i kolejność ruchów |
| K07 | P0 | Jawny wybór konstrukcji korpusu, wieńców i pleców | Zmiana pleców zmienia głębokość użyteczną i dobór wyposażenia |
| K08 | P1 | Narożniki, blendy, skosy, wnęki i nieregularne części | Obrys części, kolizje i dokumentacja odpowiadają faktycznej geometrii |
| K09 | P1 | Ciągi mebli: wspólne linie frontów, blaty, cokoły i panele boczne | Zmiana jednego modułu aktualizuje elementy wspólne, bez dublowania |
| K10 | P1 | Własne szablony i warianty warsztatowe | Zapis konstrukcji do biblioteki; aktualizacja szablonu nie zmienia starych zleceń |
| R01 | P0 | Rzut, elewacja i 3D z tego samego projektu | Wybór części wskazuje tę samą część w każdym widoku |
| R02 | P0 | Wymiary i precyzyjne wpisywanie wartości obok przeciągania | Projektant ustawia konkretny wymiar bez trafiania myszą w piksel |
| R03 | P1 | Ukrywanie warstw, przezroczystość, przekrój, izolacja i rozstrzelenie | Można zobaczyć prowadnice i połączenia zasłonięte przez korpus |
| R04 | P1 | Symulacja otwarcia i wysuwu z obwiedniami ruchu | Kolizja uchwytu z sąsiednią zabudową jest widoczna przed wykonaniem |
| R05 | P1 | Realistyczne materiały, światło i zapisane ujęcia | Skala oraz kierunek dekoru odpowiadają ustawieniom części |
| R06 | P2 | Panorama, prezentacja na telefonie, AR | Ułatwiają decyzję klientowi; nie zastępują zweryfikowanego pomiaru |
| O01 | P0 | Dobór systemu po funkcji, wymiarach, obciążeniu i preferencjach | Widać zgodne warianty i powody odrzucenia pozostałych |
| O02 | P0 | Dokładny wariant/SKU oraz komplet wymaganych komponentów | Zestaw zawiera właściwe strony, mocowania, łączniki i elementy dodatkowe |
| O03 | P0 | Dna, plecy i fronty wewnętrzne szuflad według profilu | Każdy wymiar wskazuje dokument, stronę, zakres wariantu i grubość płyty |
| O04 | P0 | Statyczna i ruchowa zgodność okuć | Zawias, szuflada, syfon i instalacje nie zajmują tej samej wymaganej przestrzeni |
| O05 | P1 | Podnośniki, cargo, segregatory, nerki, systemy przesuwne | Każda rodzina ma własne reguły, a brak danych blokuje status produkcyjny |
| O06 | P1 | Alternatywy dostawcy i systemu | Zmiana dostawcy tego samego SKU nie zmienia technologii; zmiana systemu ją przelicza |
| M01 | P0 | Konkretny produkt płyty, grubość, format i struktura | Sam dekor nie pozwala wybrać nieistniejącego wariantu płyty |
| M02 | P0 | Obrzeże każdej krawędzi, kierunek wzoru, wymiary gotowe i cięcia | Kompensacja obrzeża stosowana raz, według technologii zakładu |
| M03 | P1 | Ciągłość usłojenia i grupy frontów wycinanych razem | Rozkrój utrzymuje wymagane sąsiedztwo i orientację |
| M04 | P1 | Zamienniki, odpady użytkowe i dostępność | Zamiennik wymaga zatwierdzenia; wykorzystanie odpadu nie gubi identyfikacji materiału |
| P01 | P0 | Pełny rysunek każdej części, z bazami i wszystkimi operacjami | Z rysunku jednoznacznie wynika strona i położenie każdego otworu |
| P02 | P0 | Formatki, obrzeża, zestaw okuć, etykiety i montaż | Suma części zgadza się między modelem, listami i dokumentacją |
| P03 | P0 | Wydanie produkcyjne zamrożone w konkretnej wersji | Późniejsza aktualizacja katalogu nie zmienia wysłanego pakietu |
| P04 | P1 | Rozkrój z rzazem, marginesami, kierunkiem i ograniczeniami procesu | Części pasują na rzeczywiste arkusze i mogą być wykonane dostępną technologią |
| P05 | P1 | Eksport dla wybranej maszyny i jej wyposażenia | Program przechodzi symulację oraz kontrolowany próbny detal |
| P06 | P1 | QR części, braki, poprawki, ponowne wykonanie | Pracownik zgłasza konkretną część i rewizję, bez odgadywania z nazwy pliku |
| B01 | P0 | Oddzielne koszty, marża i cena uzgodniona | Aktualizacja kosztu okucia nie zmienia uzgodnionej ceny ani zapisanej umowy |
| B02 | P1 | Porównanie wariantów i skutków zmiany | Klient widzi dopłatę, projektant widzi zmianę komponentów oraz prac |
| B03 | P1 | Akceptacje projektu, zakresu, materiałów i zmian | Wiadomo kto, kiedy i którą wersję zaakceptował; akceptacja obrazu nie udaje akceptacji technologii |
| Z01 | P0 przed kontami | Właściciel, pracownicy, dostęp do przydzielonych projektów | Ograniczenia obowiązują w interfejsie, API, MCP i plikach |
| Z02 | P1 | Historia, cofanie, odzyskiwanie i konflikty zapisów | Dwie osoby nie nadpisują sobie zmian bez informacji |
| Z03 | P1 | Zadania i uwagi przypięte do części lub miejsca | Zgłoszenie z montażu można odnaleźć w konkretnej rewizji modelu |

## 4. Interakcje, które powinny sprawiać wrażenie produktu premium

Rekomendacje projektowe:

- Kliknięcie frontu pokazuje działania „zamień na szuflady”, „dodaj ukrytą szufladę”, „otwieranie”, „materiał”. Kliknięcie wnętrza pokazuje podziały i wyposażenie. Panel ma odnosić się do zaznaczonego obiektu.
- Przeciąganie daje podgląd, a pole liczbowe pozwala zatwierdzić dokładny wymiar. Przyciąganie do osi, sąsiadów i podziałów można chwilowo wyłączyć. Nie przeskakuje bez wyjaśnienia do innego wymiaru.
- Niedozwolona konfiguracja pokazuje miejsce, przyczynę i możliwe rozwiązania: np. brak przestrzeni dla konkretnej prowadnicy. Nie wystarcza komunikat „błąd”.
- Przed zmianą systemu pojawia się podsumowanie: inne formatki, wiercenia, komponenty, koszt i utracone zatwierdzenie. Nie podmieniamy marki po cichu.
- Widok klienta ukrywa koszty zakupu i technologię; widok warsztatu pokazuje operacje i rewizję. Są to widoki tych samych danych, nie dwa osobne projekty.
- Zapis jest widoczny jako „zapisywanie / zapisano / konflikt”. Cofnięcie dotyczy całej czynności, np. zamiany drzwi na szuflady, a nie przypadkowego fragmentu operacji.
- Pomiary pomieszczenia przechowują pochodzenie, datę i status sprawdzenia. Ściany nie muszą być prostopadłe; uwzględniamy otwory, parapety, instalacje, wentylację i możliwość montażu.
- Jakość pracy mierzymy na reprezentatywnych projektach. Proponowany cel, do potwierdzenia pomiarem: reakcja zaznaczenia do 100 ms, typowa zmiana modułu do 500 ms, płynny obrót co najmniej 30 kl./s na uzgodnionym laptopie. To cel produktu, nie wynik obecnej aplikacji.

## 5. Specjalne wymagania dla szuflad i kuchni

„Szuflada koszowa” jest niejednoznaczna: może oznaczać wysoką szufladę na garnki albo wysuw druciany. Interfejs powinien pokazywać typ i zdjęcie, zanim dobierze system.

**Szuflady za drzwiami:** ocenić minimalny kąt otwarcia, wystawanie zawiasu i drzwi, grubość frontu, uchwyt, prowadnice i dystanse. Listwa dystansowa zmienia światło oraz wymiary dna/pleców; wymaga mocowania i własnej formatki. Nie każdy zawias szerokokątny zapewnia wymagane zerowe wystawanie w każdej konfiguracji.

**Szuflada ukryta za wysokim frontem:** rozróżniać wysuw niezależny i sprzężony zabierakiem. Wymagane są obwiednie obu skrzynek, szczeliny, mocowanie frontu, dostęp ręką i ewentualne wykluczenia push/domyk. Odejmowanie wysokości frontów jest tylko wstępnym bilansem, nie uniwersalną regułą technologiczną. Przykłady IKEA nie dowodzą kompatybilności Amix, GTV czy Blum.

**AGD:** dokładny model, nisza, wentylacja, dopuszczalne zabudowanie pleców, miejsce przewodów i węży, trajektoria drzwi i możliwość wyjęcia urządzenia do serwisu. Wartość z typowego szablonu jest założeniem, dopóki nie ma karty konkretnego urządzenia.

**Nerki i cargo:** wymiar otworu wejściowego, strona, przeszkody wewnętrzne, wysokość i pełna trajektoria mechanizmu. Dopasowanie bryły do korpusu przy zamknięciu nie potwierdza działania.

Wcześniejsze dokumenty zawierają przykłady liczb producentów. Nie zatwierdzać ich przez samo powtórzenie w nowym briefie: sprawdzić rysunek, wersję i wariant. Nie stosować ogólnego luzu „na Blum” ani „na GTV”.

## 6. Dane, które Codex powinien dostarczać Claude’owi

| Pakiet | Wymagana zawartość | Warunek użycia |
|---|---|---|
| Tożsamość | Producent, rodzina, pełny SKU, wariant, strona, zakres długości i obciążeń | Osobno kod producenta i kod sprzedawcy; nazwa rodziny nie udaje SKU |
| Kompletacja | Elementy zestawu, ilości, opakowanie, wymagane dodatki i wykluczenia | Rozróżniać komplet handlowy, parę i pojedynczy element |
| Dopasowanie | Grubości płyt, światło, głębokość, nałożenie frontu, wymagane luzy | Każdy symbol ma definicję i układ odniesienia |
| Obróbka | Otwory, rowki, frezy, strony, średnice, głębokości, tolerancje | Każda operacja wskazuje dokument i miejsce na rysunku |
| Ruch i obciążenie | Osie, zakresy ruchu, wymagane otwarcie, obwiednie i warunki obciążenia | Animacja poglądowa nie jest zweryfikowaną obwiednią kolizji |
| Wizualizacja | Zdjęcie, CAD/mesh, jednostki, orientacja, tekstury i ich skala | Zdjęcie rodziny oznaczone jako poglądowe; sprawdzone warunki wykorzystania |
| Dowód | Oficjalny URL, plik, data pobrania, rewizja, numer strony, hash, status kontroli | Konflikt źródeł pozostaje jawny; brak to `unknown`, nie zero |

Oceny danych rozdzielić na: identyfikacja, wizualizacja, dopasowanie, kompletacja, produkcja. Produkt ze zdjęciem może być dobry do galerii i jednocześnie niedopuszczony do generowania wierceń. Konflikty dystrybutor–producent wymagają rozstrzygnięcia; nie wybierać „bardziej prawdopodobnej” liczby automatycznie.

## 7. Pakiet produkcyjny — lista obowiązkowa

Każda część: trwały identyfikator, mebel i rewizja, materiał i grubość, liczba sztuk, obrys, wymiar gotowy i cięcia, orientacja dekoru, obrzeża z przypisaniem krawędzi, baza pomiarowa i strony, wszystkie otwory/rowki/frezy z głębokością i średnicą, status kompletności oraz powiązania montażowe. Rysunek musi rozróżniać widok od strony obróbki od odbicia lustrzanego.

Cały mebel: złożenie, przekroje niezbędne do montażu, kolejność składania, lista okuć z wariantami, łączniki, ostrzeżenia, tolerancje wynikające z technologii. Cała kuchnia: numeracja modułów, układ w pomieszczeniu, połączenia między modułami, blaty, cokoły, instalacje i uzgodnione odstępy.

Przy wydaniu: pliki PDF/listy/etykiety/programy odnoszą się do jednej rewizji. Niekompletne wiercenia blokują wydanie; samo wygenerowanie pliku PDF nie oznacza kompletności. Format wymiany i postprocesor CNC trzeba dobrać do rzeczywistej maszyny i narzędzi zakładu.

## 8. Scenariusze odbioru dla Claude

1. Mebel 800 × 600 mm głębokości, boki 18 mm: 764 mm światła przed dodatkowymi przegrodami. Po zmianie boków na 16 mm światło wynosi 768 mm. System ponownie ocenia zgodność prowadnic; nie zakłada długości nominalnej na podstawie samej głębokości zewnętrznej.
2. Jedna komora stała, druga elastyczna: po zwężeniu korpusu pierwsza zachowuje wymiar; przy braku miejsca pojawia się konflikt.
3. Jedne drzwi i dwie szuflady wewnętrzne: kolizja zawiasu jest wykryta; dystans zmienia części, mocowania i wymiary szuflad.
4. Wysoki front i ukryta szuflada: wariant niezależny i z zabierakiem mają różną kompletację; niedopuszczalne połączenie okuć jest odrzucone.
5. Zamiana Amix → GTV → Blum: aktualizują się wszystkie zależne części i operacje; nie zostają otwory poprzedniego systemu.
6. Lustro szafki: zmieniają się strony okuć i wiercenia, ale identyfikacja stron rysunku pozostaje jednoznaczna.
7. Fronty ze wspólnym usłojeniem: podgląd i rozkrój zachowują tę samą kolejność części.
8. Nowa dokumentacja producenta: stare wydanie produkcyjne pozostaje identyczne; projektant może świadomie zastosować nowszy profil do nowej rewizji.
9. Zmiana ceny materiału: zmienia kalkulację kosztów, nie cenę uzgodnioną i nie zapisane umowy.
10. Pracownik bez uprawnienia do marży: nie uzyskuje jej także przez eksport, API i MCP.
11. Dwie osoby zapisują projekt: konflikt nie niszczy pracy żadnej z nich; widoczny autor i czas zmian.
12. Brak strony z wierceniami: projekt można przedstawić klientowi, ale nie zatwierdzić do produkcji. Próbny montaż pierwszego profilu potwierdza zgodność rzeczywistych części.

## 9. Kolejność rozwoju

**Najpierw:** jeden kompletny przepływ dla prostego korpusu, niezależne fronty i wnętrze, szuflady ukryte, jeden zweryfikowany profil okuć, spójne części/3D/dokumentacja. Rozszerzać dopiero po próbnym montażu.

**Następnie:** więcej rodzin okuć, narożniki i AGD, biblioteka zakładu, praca na rewizjach, konta i zakresy dostępu, pełny obieg akceptacji. Kontrola dostępu jest warunkiem udostępnienia kont pracownikom, nawet gdy funkcje konstruktora są jeszcze rozwijane.

**Potem:** optymalizacja rozkroju, magazyn odpadów, konkretne CNC, obieg hali i montażu, fotorealizm/AR oraz portal klienta. Pomoc AI może proponować układ i wyjaśniać konflikty, ale nie dopisywać nieudokumentowanych wierceń ani samodzielnie zatwierdzać produkcji.

Własny wygląd i wygoda obsługi są ważne, lecz przewagę stworzy możliwość wykonania dokładnie tego, co zaakceptował klient — z kompletnymi, sprawdzalnymi danymi i bez przepisywania projektu między narzędziami.
