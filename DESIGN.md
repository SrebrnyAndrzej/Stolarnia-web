---
version: alpha
colors:
  background: "#f7f8f7"
  panel: "#ffffff"
  text: "#1c2b30"
  primary: "#1c2b30"
typography:
  body:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
rounded:
  DEFAULT: "10px"
---

## Overview

### Edycja przy rysunku i wspólne wymiary — 27.11.2026
Podgląd zachowuje co najmniej 340 px na komputerze i 280 px na telefonie; rozwijany wybór rzędów znajduje się pod nim. Elewacja udostępnia zbliżenie wybranej szafki i edycję szerokości z wymiaru; dotykowa alternatywa ma przycisk co najmniej 44 px. Oba wejścia skupiają to samo pole istniejącego edytora. Nie powstaje drugi edytor ani osobny zapis. Cena proponowanej zmiany pojawia się przed Zastosuj; wyliczenie korzysta z tego samego publicznego API i mechanizmu anulowania. Natywne selecty pozwalają wybrać wspólny front i 1–3 niezależne szuflady ukryte. Karta AGD pokazuje minimalne wymagania modelu, rzeczywiste światło i osobną deklarację sprawdzenia wentylacji. Wspólne wymiary obejmują cokół, korpusy i poziom wiszących, z atomowym Zastosuj/Anuluj oraz Cofnij. Wszystkie kontrolki zachowują istniejące tokeny marki. Przed publikacją odblokowano połączenie lokalne: 16/16 testów przeglądarkowych, w tym telefon, dostępność i 3D, oraz potwierdzenie edytora w CUA. Błąd zachowania szuflad ukrytych przy propozycji szafki półkowej został naprawiony i objęty regresją.

### Czytelny wybór szafek klienta — 23.11.2026
Standardowy katalog i testowe Studio korzystają z KitchenCatalogCard oraz kitchenAdditionPreview: karta pokazuje rzeczywisty wymiar po wstawieniu w wybraną lukę, w jednostce pomieszczenia. Dopasowanie wymiarów ma jawny opis. Równoważne warianty po dopasowaniu pokazujemy raz, zachowując różne zakresy dalszej edycji. Wyszukiwanie Studio odnosi się do widocznego wymiaru, a przycisk czyszczenia przywraca fokus do pola. Wolne miejsce dla dołu/słupków i wiszących jest prezentowane obok siebie, z największą pojedynczą luką oraz sumą, gdy miejsc jest więcej. Te same kolory, typografia, przyciski i walidacja domeny; bez zmiany wycen ani zapisanych projektów.
Weryfikacja wizualna tej iteracji oczekuje na odblokowanie narzędzia przeglądarkowego. Ustalenia wynikają z analizy kodu i testów geometrii, nie z nowego audytu ekranów.

### Prowadnice przesuwania płyt — 22.11.2026
Istniejący rzut 2D w FurnitureCreator pokazuje przerywane prowadnice i kompaktowy opis krawędzi wyłącznie podczas przesuwania. Linie używają --text, opis --panel/--text i istniejącego --radius; brak nowych kolorów i paneli. Opis jest nakładką bez przechwytywania wskaźnika i bez zmiany wysokości rysunku. Pola pozycji pozostają alternatywą bez przeciągania. Na telefonie przesuwanie zachowuje widoczny projekt, zwykłe stuknięcie otwiera dotychczasowy inspektor.

Na telefonie wysokość podglądu kuchni korzysta z tego samego pomiaru dostępnego miejsca co komputer (useKitchenViewport). Ograniczenie dotyczy wyłącznie rysunku; inspektor i formularze zachowują naturalne przewijanie. Dolny pasek i opis podglądu są uwzględnione w pomiarze. Od 27.11 minimum wynosi 280 px na telefonie i 340 px na komputerze; przy małym oknie strona przewija się, aby rysunek pozostał czytelny.

### Studio: eksperymentalny katalog kuchni — 22.11.2026
Publiczny adres `#/kreator-kuchni?ui=studio` włącza wariant istniejącego kreatora. App jest właścicielem flagi adresu; nie powstaje osobny projekt ani kopia szkicu. Nagłówek jawnie oznacza test i pozwala wrócić do standardowego adresu przez tę samą ochronę oczekujących zmian. Domyślne wejście pozostaje bez eksperymentu. KitchenStudioCatalog ma natywne pole search i przyciski disclosure z aria-expanded/controls; grupy Meble / AGD i hydraulika / Wykończenia używają istniejących ikon i tokenów. Wyszukiwanie jest lokalne, więc nie ma wyścigu odpowiedzi. Dopasowanie miejsca nadal należy do catalog-placement, nie do wyszukiwarki. KitchenRunStrip jest wariantem istniejącego KitchenSelection: rozwijany wybór z przełączanym rzędem górnym lub dolnym/wysokim i przyciskami szafek, bez udawania skali, zmiany geometrii ani nowego gestu przeciągania. Natywna lista zostaje w standardowym trybie; Studio zapewnia wybór klawiaturą przez przyciski. Automatyczne układanie jest w rozwijanej sekcji, a wybór ściany nie dubluje się w katalogu. Na telefonie rząd przewija się we własnym obszarze z widoczną systemową belką; nie rozszerza strony. Edytor, cofanie, walidacja i API ceny są współdzielone. Źródła i rozróżnienie demo/prezentacji: docs/RESEARCH-ROZRYS-STUDIO-2026-11-22.md.

### Klient wybiera i przestawia szafkę przy projekcie — 22.11.2026
KitchenSelection używa natywnego selecta z jednoznaczną etykietą, bieżących nazw i wymiarów w cm oraz istniejących przycisków ścian. Zamiana kolejności jest dostępna przy wyborze, niezależnie od myszy i rysunku; pełna lista pozostaje w details. Inspektor pokazuje wyłącznie wybraną szafkę, a katalog wraca po zamknięciu edycji. Zastosuj/Anuluj mają wspólny pasek w formularzu; na komputerze pasek pozostaje przy dolnej krawędzi przewijanego inspektora. Podsumowanie zamyka edycję, a wybór szafki z podsumowania wraca do etapu szafek.
Nagłówek projektu i zapis online współdzielą rząd na komputerze; cena i przełącznik widoku współdzielą nagłówek podglądu. useKitchenViewport dopasowuje tylko podgląd i inspektor do rzeczywistego położenia dolnego paska; strona i pomocnicze formularze zachowują naturalne przewijanie. Na telefonie układ płynie pionowo, bez wewnętrznego scrolla edytora. Dodatkowe pomiary/pliki na starcie są rozwijane, a zapisany szkic pozwala przejść bezpośrednio do szafek. Dotychczasowa paleta, typografia, warstwa cen i domenowy model pozostają właścicielami swoich reguł.

### Porównanie propozycji kuchni — 20.11.2026
KitchenPlanningTools rozszerza istniejącą akcję układania o opcjonalne Porównaj propozycje kuchni. Natywny dialog kp-dialog ma biznesowy wariant kp-proposals-dialog, z maksymalnie trzema kartami obok siebie na komputerze. Karty pokazują priorytet, rzeczywistą orientacyjną cenę, liczbę szuflad, szafek półkowych i szerokość szafki roboczej. Na telefonie przyciski wyboru pokazują jedną kartę naraz, bez szerokiej tabeli i poziomego przewijania. Kolory i kontrolki dziedziczą istniejące tokeny. Powrót nie zmienia szkicu; wybranie kuchni wraca do normalnego podglądu. To porównanie projektów klienta, nie nowy ekran kalkulatora technicznego.

### Kuchnia według potrzeb domowników — 20.11.2026
Pierwszy etap zachowuje układ i wymiary, a obok pokazuje KitchenNeeds: trzy krótkie pytania o domowników, przechowywanie i priorytet z wyborem zmywarki. Na telefonie potrzeby poprzedzają wymiary; można je pominąć. Natywne selecty, checkboxy i radio korzystają ze wspólnych tokenów grafitu/oliwki, bez nowej palety. Na komputerze karty układów i pola wymiarowe są zwarte. Krótki nagłówek kp-editing obowiązuje od początku procesu. Jeden przycisk Dalej, widoczny postęp 1/3 i Wstecz ograniczają długość ankiety. Zapisane potrzeby mają krótkie podsumowanie i jawne Zmień potrzeby. Lista proponowanych miejsc pod podglądem łączy potrzeby z rzeczywistymi szafkami i wybiera je w istniejącym inspektorze; braki pozostają jawne.

### Kreator klienta po researchu — 20.11.2026
Na komputerze model jest po lewej, a katalog i istniejący KitchenCabinetEditor po prawej. Krótki nagłówek odzyskuje miejsce dla podglądu. Inspektor ma własne przewijanie; dodatkowe narzędzia i lista szafek pozostają w naturalnie przewijanej części poniżej, bez blokady wysokości całej strony. Na telefonie kolejność to podgląd, katalog z edytorem, narzędzia; w wycenie karta ceny pozostaje pierwsza. Graficzne zestawy wyposażenia są natywnymi przyciskami w palecie marki, bez nowych tokenów. Wybór tylko uzupełnia formularz; Zastosuj i Cofnij zachowują swoje znaczenie. Widok 3D ma jawne Pokaż całość, poza szkicem i ceną.

### Wyspa i dokumentacja architekta — 15.11.2026
Obecny publiczny kreator otrzymuje dwie zwinięte sekcje pod podglądem: wyspę i pliki architekta. Pozostają te same tokeny, natywne pola i Feedback; bez dodatkowego ekranu lub nowej palety. Wyspa jest osobnym rzędem na wirtualnej linii bez muru, z normalnym builderem szafek, rzeczywistymi panelami i blatem. Formularz w cm stosuje zmiany jednym krokiem historii, a oczekująca edycja chroni nawigację i cenę. Podkłady DXF są przygaszone w rzucie, meble mają pierwszeństwo wizualne. Oryginały i podgląd dokumentacji są w tej samej sekcji; nazwa pomieszczenia i rodzaj rysunku opisują każdy plik. Dodatkowy natywny wybór plików służy całej paczce projektu; dotychczasowy Plik szkicu kuchni zachowuje własne wejście.

### Pełniejszy proces kuchni klienta — 15.11.2026
Nadpisanie zapisanej kopii A/B otwiera istniejący wizualnie natywny dialog z domyślnym fokusem na zachowaniu kopii; zamknięcie przywraca fokus do przycisku wywołującego. Pierwszy zapis pustego slotu nie wymaga potwierdzenia.
KitchenCabinetEditor pokazuje wymiary korpusu w cm zgodnie z jednostką pomieszczenia; zespół domyślnie pracuje w mm. Osobny wybór jednostki edytora trwa między zastosowaniami i wyborem szafek, bez zmiany danych w mm ani wywołania niezapisanej zmiany. Parametry frontów pozostają jawnie opisane w mm. Te same natywne pola, kontrast marki i historia.
Przy podglądzie jest kompaktowa cena orientacyjna oraz różnica względem ostatniej wycenionej wersji. useKitchenEstimate jest wspólnym właścicielem anulowania, klucza szkicu i ponowienia dla paska, KitchenQuote i kart wariantów. Podsumowanie nie tworzy drugiej wyceny bieżącego szkicu. Oczekująca edycja i błędy układu chowają kwotę; brak/stara odpowiedź nie daje starej ceny.
Miejsce dodawania wybiera koniec rzędu lub rzeczywistą lukę; ten sam wybór dostępny z elewacji i listy kontroli projektu. SVG z przyciskami luk ma rolę group, nie statycznego img. Katalog filtruje pasujące warianty, a pojedyncza szafka bez AGD może zostać dopasowana do mniejszej luki. Stare elementy pozostają na swoich pozycjach.
Pomieszczenie, kontrola projektu, narożnik i porównanie A/B są natywnymi details pod podglądem. Nie konkurują z rysunkiem na pierwszym ekranie. Formularz oznaczeń korzysta z tej samej ochrony edycji co szafka. Warianty mają zwięzłe karty i wspólne tokeny; stan leży w KitchenPlanner przez useKitchenVariants, więc powrót do pomiarów nie usuwa kopii przy awarii pamięci.

### Wyposażenie szafki w miejscu — 15.11.2026
KitchenCabinetEditor rozszerza istniejące pole Wymiary i wnętrze o natywny select Wyposażenie szafki dla dolnych modułów półkowych i szufladowych. Dwie opcje: Drzwi i półki / Szuflady. Zmiana jest częścią obecnego formularza i jego Zastosuj/Anuluj; nie powstaje drugi dialog lub stan projektu. Parametry niezgodne z docelową konstrukcją są usuwane przy zatwierdzeniu, historia odtwarza poprzednie ustawienia. Obecne tokeny i grafitowy kolor pól wyboru pozostają.
Wybranie lub dodanie szafki prowadzi fokusem do nagłówka edytora, z istniejącym scroll-margin chroniącym przed stałymi paskami. W nagłówku jest Wróć do podglądu, obsługiwane przez tę samą ochronę oczekujących zmian; po zamknięciu fokus wraca do przełącznika widoku. Zastosowanie nie gubi fokusu po odmontowaniu wcześniejszej wersji formularza. Krótkie objaśnienia zostawiają więcej miejsca na pola na telefonie.

### Kolor natywnych pól wyboru — 15.11.2026
Wspólny arkusz v2 nadaje checkboxom i radio kolor `--accent` (grafit marki), zamiast domyślnego niebieskiego przeglądarki. Pozostają natywne, z istniejącym oliwkowym fokusem `--ps-lime` i systemowym stanem nieaktywnym; ta sama reguła obejmuje publiczny kreator oraz narzędzia zespołu. Bez osobnego stylu checkboxów dla każdego ekranu.

### Przejście klienta przez kuchnię — 15.11.2026
Wytyczne uwagi klienta i źródła: `docs/RESEARCH-UI-UX-uwaga-klienta-2026-11-15.md`. Projektowanie prowadzi od efektu do decyzji i ceny; nie odwzorowujemy fikcyjnej mapy spojrzeń. Skala, kontrast i bliskość dotyczą ważności dla aktualnego zadania. W podsumowaniu dolny pasek zawiera rzeczywiste Pobierz PDF, obsługiwane przez istniejącą kartę wyceny; etykieta i zajętość odpowiadają działaniu. Katalog na komputerze przy przewijaniu zaczyna się pod nagłówkiem, nie za nim.
Pomieszczenie przyjmuje cm lub mm; publiczne wejście domyślnie pokazuje cm. Przełączenie przelicza widoczne liczby, a szkic, silnik i API nadal używają całych mm. Główna akcja Ułóż całą kuchnię jest obok wymiarów; ręczny start opisuje dodawanie od zera. Na telefonie trzy układy mieszczą się w jednym rzędzie. Po rozpoczęciu edycji krótszy nagłówek i podgląd przed katalogiem przywracają pierwszeństwo projektowi. Strefy są rozwijane pod rysunkiem; cena na etapie podsumowania pozostaje przed podglądem. Dolny pasek utrzymuje przejście do kolejnego kroku i drogę powrotu; odstęp na dole strony oraz scroll-margin chronią treść i fokus przed zasłonięciem. Bez nowych kolorów, fontów i osobnych kontrolek.

Edytor szafki pokazuje niezastosowane zmiany oraz Anuluj zmiany w obecnym panelu. Stan zapisu odróżnia szkic od zmienionych pól. Nawigacja do ceny lub innej szafki wskazuje przycisk Zastosuj, zamiast wycenić wcześniejszy rozmiar albo zgubić edycję. W podsumowaniu oczekująca edycja usuwa kwotę i blokuje PDF. To nie automatyczny zapis każdej naciśniętej cyfry.

### Kreator klienta i kalkulatory zespołu — 15.11.2026
Publiczna kuchnia prowadzi od wymiarów i funkcjonalnego układu do własnego wyposażenia, podglądu i orientacyjnej ceny wstępnej z PDF. Nie pokazuje odnośników do narzędzi warsztatowych ani wyboru frontu do obróbki. Zalogowany właściciel lub pracownik zachowuje integrację z konkretnym frontem. W panelu Kalkulatory stolarza łączy szuflady, skosy i podział frontów w istniejących StudioTabs; wariant osadzony nie powiela nagłówka ani elementu main. Samodzielne stare adresy są również chronione i mają powrót do panelu. Te same tokeny, etykiety i kontrolki, bez zmiany palety. Stan sprawdzania sesji poprzedza narzędzia; odmowa dostępu ma drogę do publicznego projektowania kuchni.

### Kuchnia z edytorem szafek i kalkulatory - 13.11.2026 (dostęp zaktualizowany 15.11)
`KitchenCabinetEditor` rozszerza istniejącą kolumnę podglądu: krótki formularz wymiarów, półek/szuflad, jawne Zastosuj, wspólne Cofnij. Pozycje półek i frontów wynikają z istniejącego buildera. Lista szafek ma własny ograniczony scroll; pozostała strona zachowuje naturalne przewijanie. `#/kalkulatory` używa istniejących Logo, Feedback, StudioTabs oraz PrzelicznikSzuflad i SlopeCutting. Bez nowej palety, style konsumują te same tokeny. Wariant `pc-*` jest powłoką narzędzi zalogowanego zespołu, nie odrębnym systemem kontrolek. Dodatkowy podział frontów używa wspólnego rozdzielania wymiaru z precyzją 0,001 mm; nie zmienia domyślnego zaokrąglania w kreatorze mebli.

### Jedyny standard ofert i publiczna wycena kuchni - 13.11.2026
Obowiązuje `docs/OFERTY-STANDARD.md`, oparty na zaakceptowanych ofertach szafy i łazienki. Dwie strony A4 pionowo, logo, grafitowe pole ceny brutto, widok frontów i wnętrza, krótki zakres, założenia. Wspólny renderer `export/offer-standard`. Publiczny kreator rozszerza istniejący etap podsumowania o `KitchenQuote`: natywne selecty, checkbox montażu, cena i trzy grupy; założenia w details, PDF jako główna akcja. Bez nowej palety/fontów. `planner.css` konsumuje istniejące `--text`, `--panel`, `--line`, `--muted`, `--radius` z v2 styles. Kwota ma stałą przestrzeń podczas obliczania, na telefonie naturalny scroll.

### Okucia frontu — 12.11.2026
`FurnitureHardware` w istniejącym inspektorze, zakładka Okucia dla drzwi i frontu szuflady. Domyślnie zwinięte sekcje parametrów; numerowane otwory na głównym rysunku 2D, na telefonie także lokalny podgląd w inspektorze. Zachowane tokeny i standardowe NumberField/select/details. Karta frontu do druku jest osobnym eksportem; zbiorcza krótka karta nie powiela tabel każdego otworu.

### Precyzyjna edycja — 11.11.2026
`FurnitureDimensionEditor` pozostaje właścicielem edycji wymiaru bezpośrednio z rysunku. Pole przyjmuje ograniczone działania arytmetyczne i pokazuje wynik w istniejącej typografii liczbowej; dopiero Zastosuj zmienia szkic. Nie zapisujemy zależności ani formuł. `FurnitureCreator` rozszerza istniejącą sekcję operacji na zaznaczonych częściach o równe światła w pionie/poziomie, bez nowego panelu i bez zmiany tokenów. Skrajne części pozostają nieruchome; opis odróżnia światło od dotychczasowego kroku między początkami. Natywny select „Operacja na częściach” i „Zastosuj operację” zastępują zestaw osobnych przycisków wyrównania i rozstawu. Duplikowanie pozostaje bezpośrednią akcją, objaśnienia są rozwijane.

Integracja 3.11.2026 zachowuje istniejące tokeny i układ. Szybki projekt używa wariantów `.qp-*`, dialogi dekorów i pełnego ekranu są modalne natywnie. Panel Zamówienia pokazuje także istniejącą kartę dostaw, z przewijaniem szerokiej tabeli wewnątrz sekcji. Przygotowanie płyt z biblioteki korzysta z tych samych `.field/.input`, `.ps-button` oraz Feedback; nie dodaje nowej palety. Rozkrój jest opisany jako roboczy i powiązany z zapisaną wersją.

Pliki od architekta są rozwijaną sekcją w szczegółach projektu, obok dokumentacji. Właściciel UI: `ProjectFiles.tsx`, wspólne `.field/.input`, `.ps-button`, `Feedback` i `useResource`. Przerywana ramka oznacza miejsce upuszczenia pojedynczego pliku; natywny input pozostaje alternatywą klawiaturową. Podgląd CAD jest monochromatycznym rzutem 2D w kolorach tokenów aplikacji, bez nowego motywu lub surowego SVG z pliku.
Pan Stolarz 2.0: strona klienta i panel właściciela/pracownika. Użytkownik wybrał wariant 2 z oryginalnym brandingiem marki. Kontekst zatwierdzonego kierunku: grafitowa nawigacja, zielone zaznaczenia, jasny obszar projektu, lista po lewej i szczegóły po prawej. Dotychczasowy kalkulator i projektant zachowują logikę, dostają wspólne tokeny marki. UI po polsku; PLN, milimetry i Europe/Warsaw.

### Czytelny rzut kuchni - 20.11.2026

Rzut pozostaje w istniejącym podglądzie i korzysta z obecnych tokenów. Wspólny KitchenPlanSymbol dodaje schematyczne oznaczenia płyty, zlewu, zmywarki, lodówki i okapu; tekst jest poziomy niezależnie od ściany. Czytelność rzutu ma krótki pasek natywnych checkboxów nad rysunkiem: oznaczenia oraz podkład, gdy istnieje. Przejście równoległych ciągów ma jedną linię wymiarową i wartość w cm. Brak nowych paneli, palety lub modalnych kroków; wyłączenie warstwy nie zmienia kadru. Fokus szafki ma mocniejszy obrys; Enter/Spacja prowadzą do istniejącego edytora i właściwej ściany.

## Colors

Marka pochodzi z oryginalnego `src/export/assets/pan-stolarz.png`: #1C2B30, #A5B859, #435058. W v2 źródłem nadpisania tokenów jest `web/src/v2/styles.css`, importowany po bazowym arkuszu. Oryginalny asset jest używany bezpośrednio jako logo; wygenerowana wizualizacja kuchni to jawnie oznaczona inspiracja, nie zdjęcie realizacji. Paleta v2 nadpisuje stary brązowy akcent. Na zieleni tekst grafitowy; główne przyciski grafitowe z białą etykietą. V2 obecnie ma jasne powierzchnie zgodne z wybranym obrazem; starszy automatyczny motyw ciemny nie jest aktywny w nowej warstwie.
Źródłem tokenów jest `web/src/styles.css`, selektor `:root` i wariant ciemny `prefers-color-scheme`. Powyższe wartości dokumentują tryb jasny, nie stanowią osobnego generatora kolorów. Kalkulator używa wspólnych klas paneli, pól i tabel; scrollbar korzysta z istniejących tokenów linii i panelu.

Na tle `--accent-soft` drobny tekst wybranych przycisków, etykiet i głównej nawigacji używa `--text`, nie `--accent` (jasny wariant accent/soft ma kontrast 4,02:1). Wybrany stan nadal wskazuje tło, obrys i `aria-pressed`/`aria-current`.

## Typography
Font systemowy zgodny z resztą aplikacji. Wartości wymiarów używają `.num` (cyfry tabelaryczne). Wszystkie wymiary opisujemy w mm; dno: szerokość × głębokość, plecy: szerokość × wysokość.

## Layout
V2: desktop — nawigacja 182 px, lista projektów 244 px, płynny podgląd i inspektor 292 px. Poniżej 1200 px inspektor przechodzi pod podgląd; poniżej 800 px lista jest poziomym przewijanym zbiorem i nawigacja rozwija się przyciskiem. Każdy region ma min-width:0 i własny kontrakt przewijania. Ilustracja poglądowa w demonstracji jest oddzielona od rzeczywistej geometrii silnika (3D, rzut i elewacja). Dane demonstracyjne są syntetyczne.
Kalkulator jest osobnym narzędziem w głównym menu pod `#/szuflady`. Na komputerze: formularz do 410 px i karta wyników obok; poniżej 860 px jeden naturalnie przewijany ciąg formularz → wyniki. Nie używa szerokiej tabeli. Źródłem miar pozostaje serwis, UI wyświetla wybrany system, nie kopiuje wzorów okuć.

Podstawowe pola liczbowe mają minimum 52 px wysokości (54 px na telefonie), tekst od 18 px. Przyciski wariantów minimum 44 px. Sekcje 1/2 odpowiadają rzeczywistej kolejności: korpus i szuflada → front i zaczepy. Wymiary cięcia to dwie karty; wiercenia pokazujemy na schemacie tylnej strony frontu i dużymi liczbami od krawędzi. Brak pozycji nie staje się schematycznym „gotowym” otworem. Wysokości prowadnic pokazujemy jako listę od dołu z jawnym punktem bazowym, odróżniając krawędź prowadnicy od osi wkrętów.

## Elevation & Depth
Karty dziedziczą wspólny cień `--shadow`.

## Shapes
Panele używają `--radius`; nie dodajemy nowej geometrii kontrolek.

## Components
Nowy shell `v2/App.tsx` i współdzielony `v2/api.ts`/`useResource.ts`: prywatne dane bez cache, anulowanie nieaktualnych odczytów, timeout, role serwerowe. Chronione zakładki i techniczny DTO opisane w UX-CONTRACT.md. Autoryzacja w src/server/access.ts; interfejs nie może zastąpić kontroli serwerowej. Trzy role mają osobne zakresy odpowiedzi. Nie publikować przed uruchomieniem kont/migracji i sprawdzeniem prawdziwych sesji.
Właściciele UI: pola `.field/.input`, komunikaty `.alert`, panele `.card` w globalnym CSS. `.drawer-*` jest wariantem warsztatowym tych elementów: większy dotykowy rozmiar i wynik bez tabeli; nie zmienia kontrolek katalogu ani projektanta. Natywne selecty celowo pozostają obsługiwane przez system operacyjny.

`web/src/views/szuflady/model.ts` jest właścicielem formularza, mapowania parametrów i walidacji wejść UI; `useKalkulator.ts` obsługuje odczyt REST i anulowanie żądań. Formularz nie zmienia zapisanych projektów. Wersjonowana pamięć `stolarnia.kalkulator-szuflad.v1` w localStorage zachowuje wyłącznie parametry narzędzia na urządzeniu. Typy i wartości enum są sprawdzane przy odtwarzaniu. Brak pamięci nie blokuje obliczeń.

Front zewnętrzny i wewnętrzny zachowują osobne szerokości, wysokości i pierwsze otwory. Przełączanie nie przenosi tych wymiarów między frontami. Żądania są anulowane po zmianie danych; wynik jest widoczny wyłącznie dla bieżących parametrów i ukrywany podczas przeliczania oraz po błędzie. Ponowienie nie usuwa danych. Przycisk „Pokaż rozkrój i wiercenia” kieruje fokus na pierwsze błędne pole albo do wyników. Kopiowanie zawiera punkty pomiaru oraz status kolizji.

`RysunekFrontu.tsx` jest wyłącznie rendererem pozycji z API. Numerowane otwory odpowiadają liście wysokości, dolna krawędź ma grubszą linię. Schemat ma dostępny opis tekstowy. Kolizja usuwa schemat i pozycje z ekranu; brak danych nie jest oznaczany jako sprawdzony prześwit. Dodatkowe założenia i źródła są rozwijane przez natywne details.

## Do's and Don'ts
Wynik warsztatowego rozstawu nie jest automatycznym zatwierdzeniem CNC. Zachować statusy profili i odwołania do źródeł. Nie zaokrąglać rozstawu frontów do rastra 32 i nie utożsamiać go z osiami wierceń projektu.

## Kreator kuchni klienta

`#/kreator-kuchni` to publiczny, trzyetapowy wariant istniejącego języka Pan Stolarz. Wykorzystuje te same tokeny i logo: jasna plansza, grafitowe kontrole, zielone wybrane stany. Wyróżnikiem jest rzeczywisty rysunek kuchni z wymiarami, a nie fotografia przypisywana każdemu układowi. Typografia tytułów pozostaje bezszeryfowa, liczby mają tabelaryczne cyfry. Nie wprowadzamy nowej palety.

Właściciel widoku i zapisu szkicu: `v2/planner/KitchenPlanner.tsx`. Adapter `planner/model.ts` korzysta z istniejącego katalogu, domyślnej konfiguracji, buildera i rendererów; nie definiuje technologii ani wyceny. Układ prosty/L/U, pozycje w kolejności szafek osobno dla dolnych i wiszących; L rezerwuje pusty narożnik 650 mm na ścianie B. Wskazanie szafki na rysunku ma alternatywę w postaci listy i przycisków. Natywne selecty i picker plików są świadomie obsługiwane przez system operacyjny.

Szkic bez danych kontaktowych jest automatycznie zapisywany na urządzeniu pod `pan-stolarz.kuchnia.v1`, z walidacją wersji i katalogu podczas odczytu/importu. Błąd pamięci nie blokuje edycji; użytkownik może pobrać JSON. Zmiana w drugiej karcie wstrzymuje zapis i wymaga wyboru wersji. Reset wymaga potwierdzenia w natywnym dialogu; zwykłe usunięcie szafki jest odwracalne przyciskiem Cofnij. Przekazanie do zapytania przenosi opis w sessionStorage; potwierdzenie wysłania następuje dopiero po odpowiedzi serwera. JSON jest szkicem klienta, nie formatem importu produkcyjnego.

Układ U: trzy ściany A/B/C z niezależnymi długościami. Puste strefy narożników 650 mm na początku B i C; geometria ścian z istniejącego renderera (łańcuch 90°). Zmiana na mniejszy układ jest blokowana, dopóki na usuwanej ścianie są szafki. Starsze szkice bez długości C otrzymują domyślne 3600 mm; zapis wersji 1 pozostaje czytelny.

## Animacja otwierająca

HomeIntro.tsx odtwarza dostarczony film kuchni Darii v4 samoczynnie, bez dźwięku, w tempie 0,75× i bez zapętlenia. Hero ma naturalną wysokość, bez sticky i wielokrotności ekranu przeznaczonej na scroll. Tekst ujawnia się z czasem filmu, CTA pozostają dostępne od początku. Po końcu filmu następuje płynne przewinięcie do kolejnej sekcji, o ile użytkownik sam nie nawigował i nie ma fokusu w hero. Ukrycie karty lub opuszczenie hero wstrzymuje film. Pause/resume i replay są dostępne. Reduced-motion/saveData oraz awaria zachowują statyczny, czytelny wariant. Blokada autoplay daje przycisk odtworzenia i pełną treść. Dotychczasowy helper home-motion.ts dokumentuje poprzedni wariant i nie jest już używany przez hero.

## Składanie szafki i rendery projektów

`v2/Landing.tsx` zawiera sekcję filmu dostarczonego przez użytkownika: ręczne odtwarzanie, brak autoplay, preload none i poster. Galeria renderów czeka na materiały Claude; bez pustych miejsc. Prototyp ProjectMedia i pipeline offline zostały wycofane.

Struktura strony: hero → dwa wejścia klienta → konstrukcja szafki → oferta → proces → FAQ → formularz. Dwa wejścia to kreator bez konta oraz opis własnego pomysłu. FAQ używa natywnych details/summary, działających z klawiatury. Zachowujemy istniejącą paletę, font i rytm sekcji; nie dodajemy nowej identyfikacji.

Research przyszłego kierunku komunikacji oraz roboczy brief do pracy z Claude: docs/branding/. Propozycja Manrope i nowe przykłady copy nie zostały globalnie wdrożone.

> Aktualizacja 31.10.2026: film hero zastąpiony dostarczoną wersją Kuchnia-Darii-animacja-v2.mp4 (14 s). Sterowanie i wygładzanie scrolla pozostają bez zmian. Rendery i nową animację składania przygotowuje Claude. Wcześniejsze prototypy Codex wycofano z publikowanej strony i zachowano w lokalnym archiwum; poniższe wzmianki o ich wdrożeniu są historyczne. Codex odpowiada za układ i treści.

## Pulpity ról — 31.10.2026
`Workspace.tsx` pokazuje kontekst roli nad wspólną przestrzenią projektu. Właściciel: aktywne projekty, produkcja, gotowe do montażu i przejścia do zapytań oraz przydziału dostępu. Pracownik: przypisane projekty, ich etapy i kalkulator szuflad; bez żądań finansowych i uprawnień edycji. Liczniki wynikają wyłącznie z listy zwróconej dla konta; podczas odczytu pokazują wielokropek, przy błędzie kreskę, nigdy fikcyjne zero. Wspólna lista, 2D/3D i inspektor zachowują kontrakt odczytu. Demonstracja nadal ma dane syntetyczne i nie loguje użytkownika.

## Dokumentacja w przestrzeni projektu
Przycisk „Dokumentacja techniczna” obok nagłówka projektu otwiera sekcję w naturalnym przepływie, bez modala. ProjectDocuments.tsx używa istniejących tokenów, przycisków, pól i Feedback. Natywne selecty są wyborem platformowym. Dwie akcje prowadzą do PDF technicznego i skróconego montażowego; link do druku pojawia się dopiero po pobraniu dokumentu. Na telefonie akcje układają się pionowo. Klient nie otrzymuje dokumentacji warsztatowej. Nie projektujemy nowego szablonu rysunków: zachowujemy istniejący generator wektorowy, skalę, mm i oznaczenia rewizji.

## Usprawnienia codziennej pracy — 31.10.2026
Demonstracja ma jawny przełącznik trzech ról, oddzielony od prawdziwego logowania. Lista projektów zachowuje wyszukiwanie, etap i wybór w adresie; filtry obejmują wszystkie/w trakcie/produkcja/montaż/zakończone. Puste wyniki mają akcję przywrócenia listy, a licznik pokazuje zakres bieżącej listy. Wybrana szafka ma w inspektorze własne gabaryty i liczbę elementów modelu. Zmiana ściany usuwa poprzedni wybór szafki.

Właściciel wyszukuje w załadowanej liście najnowszych 100 zapytań i filtruje rodzaj. Nie jest to wyszukiwanie całej historii w bazie. Natywny select korzysta z geometrii systemowej; pole search ma dostępny przycisk czyszczenia i zwraca fokus. Dokumentacja używa polskich etykiet diagnostyki i jawnej akcji odświeżenia. Zachowano logo, paletę, typografię oraz spokojne tempo hero.

Renderer 3D w przestrzeni projektów jest importowany dynamicznie po wybraniu widoku 3D. Rzut, dokumentacja i dane projektu pozostają dostępne niezależnie od pobrania renderera. Suspense rezerwuje obszar podglądu i pokazuje polski status ładowania; istniejący CanvasBoundary pozostawia alternatywę 2D po awarii.

Aktualizacja tempa hero: maksymalnie 1 sekunda filmu na sekundę czasu (wcześniej 4), łagodniejsze dochodzenie do kadru 0,45 s. Zakres hero 560 svh desktop / 400 svh telefon. Natywne przewijanie, pauza i ograniczenie ruchu pozostają dostępne.

## Aktualny tryb hero — samoczynne odtwarzanie
Na nowe zlecenie użytkownika film v4 odtwarza się sam, bez powiązania currentTime ze scrollem. Tempo 0,75×, bez dźwięku i zapętlenia. Po zakończeniu następuje płynne przewinięcie do następnej sekcji. Hero ma naturalną wysokość zamiast długiego obszaru scrolla; tekst ujawnia się z czasem filmu. Pauza/wznowienie i ponowne odtworzenie są dostępne. Po ręcznej nawigacji, przy fokusie w hero, ukrytej karcie lub reduced-motion nie wymuszamy przejścia. Reduced-motion/saveData nie pobiera filmu bez opt-in; odrzucenie autoplay pokazuje przycisk uruchomienia. Ta decyzja zastępuje wcześniejszy tryb przewijania i jego parametry.

## Publiczna strona — materiały Mateusza z 1.11.2026
Aktualizacja opiera się na TRESCI-STRONA-GLOWNA.md, strategii treści i założeniach PS-WWW-001. Publiczne kopie danych nie obejmują ulicy, roboczych budżetów ani informacji weryfikacyjnych. Właściciel treści usług/procesu/FAQ: `v2/landing-content.ts`; Landing.tsx pozostaje właścicielem układu, formularza i hero. Brak danych oraz decyzji reprezentuje PENDING_CONTENT z null, bez publicznych placeholderów.

W publicznej witrynie `.ps-public` obowiązuje książkowa paleta z briefu: granat #1C2B30, tekst #111317, drugi tekst #435058, linia #717780, podpis #848C8E, limonka #A5B859, ciepły #BFB7B6, papier #F1F2EE i biel #FFFFFF. Wartości są zadeklarowane w styles.css jako tokeny lokalne i mapowane na istniejące role CSS; nie nadpisują tokenów paneli. Podpis #848C8E nie jest wymuszany na treści, jeśli osłabiłby kontrast. Limonka używa ciemnej etykiety.

Typografia publiczna: lokalne IBM Plex Sans 400/600 i IBM Plex Mono 400/600 dla telefonu, znaczników i osi procesu. Font-face i unicode-range w brand-fonts.css, pliki oraz licencje w public/fonts. Panele zachowują dotychczasowy font. Nagłówek publiczny jest sticky; kotwice sekcji mają scroll-margin, a telefon pozostaje dostępny na małym ekranie. Nie dodano nowej domeny, śledzenia ani fontów hostowanych zewnętrznie.

## Uzupełnienie całej gotowej treści — 1.11.2026
Na polecenie użytkownika dodano 4 usługi, 4 pozycje paska dowodów, galerię 2 istniejących wizualizacji, 3 wyróżniki z działającymi przejściami, materiały/okucia i komplet 10 pytań FAQ. Galeria zastępuje osobny blok składania; zachowuje ten sam film oraz dodaje kadr kuchni z linkiem do animacji. Wyróżnik dokumentacji otwiera publiczny syntetyczny przykład PDF z oznaczeniem nieprodukcyjnym. Ceny opisano dla zatwierdzonego zakresu, bez zmiany umów i aktualizacji zapisanych kwot. Nie podano nieznanych terminów, cen pomiaru ani okresów gwarancji. Opinie, nieznane dane firmy i brakujące dokumenty prawne nie są zastępowane fikcyjną treścią.

## Zadania warsztatu — 01.11.2026
`Tasks.tsx` korzysta z istniejącego układu `ps-owner-page`, przycisków, pól i `Feedback`; bez nowej palety. Natywne selecty projektu/pracownika akceptują popup systemowy. Tworzenie pozostaje na liście, po potwierdzeniu czyści tytuł i zachowuje wybrany projekt/pracownika. Status zapisu w live region, błąd pozostaje przy formularzu, wpisany tytuł nie znika przy błędzie. Lista jawnie ograniczona do 100 najnowszych, odświeżana ręcznie lub po zapisie. Pracownik nie dostaje formularza przydziału. Demo nie udaje trwałego zapisu. Przejścia stanów i uprawnienia definiuje migracja `202611010001_workshop_tasks.sql`; szczegóły zakresu w `docs/PLAN-praca-stolarni.md`.

## Katalog dekorów i marki
Publiczny `DecorCatalog.tsx` i wybór w kreatorze współdzielą `DecorPicker`. Natywny select producenta, wyszukiwanie lokalne z czyszczeniem, po 24 wyniki i przycisk kolejnych. `Feedback` oraz style paneli pozostają wspólne. Katalog jest dostępny bez konta, zawiera tylko publiczne nazwy, kody i zdjęcia. Karuzela `BrandCarousel` ma ręczne przyciski, natywny scroll, focus i brak autoplay; reduced-motion wyłącza płynne przewijanie. Wybór dekoru zapisuje referencję i próbkę w szkicu, nie udaje tekstury PBR ani zatwierdzenia materiału do produkcji. Ponowny wybór koloru poglądowego usuwa wcześniejszy dekor.

## Kreator mebla (2026-11-02)
Kreator w panelu właściciela i pracownika dziedziczy tokeny `web/src/v2/styles.css`; `furniture.css` odpowiada za układ biblioteka / rysunek / inspektor. Geometryczny rysunek płyt jest wyróżnikiem narzędzia. Brak zmian globalnej identyfikacji. Na telefonie biblioteka, rysunek i inspektor układają się pionowo. Pola liczbowe zapewniają alternatywę dla przeciągania.

Komory korzystają z istniejących fieldsetów, fc-fields, FurnitureNumberField i natywnych selectów, pod rysunkiem. Wymiary światła oraz zaznaczenie przestrzeni uzupełniają dotychczasową geometrię. FurnitureTools używa disclosure, przycisków i Feedback. Porównanie A/B: dwie kolumny na desktopie, jedna na telefonie. Prezentacja klienta korzysta z tej samej sceny 3D, bez nawigacji personelu. Textarea używa istniejącego resize-none i odpowiedniej wysokości. Bez nowej palety. Źródło: docs/KREATOR-KOMORY-I-PREZENTACJE.md.

Widok 3D: FurnitureScene używa rzeczywistych nieprzezroczystych brył, perspektywy, zasłaniania i cienia na neutralnym tle panelu. Kolor płyty #C5AB83 i frontu #E2D9C8 pochodzi z dotychczasowego rysunku; zaznaczenie #A5B859 z marki. Bez fototekstur ani automatycznej animacji. Pasek kamery dziedziczy przyciski i tokeny kreatora. Źródło: docs/KREATOR-WIDOK-3D.md.

## Szkice zamówień Mussi (2026-11-02)
Purchasing korzysta z istniejących tokenów i powłoki ps-owner-page. Lista szkiców i edytor pozycji są obok siebie na komputerze i kolejno na telefonie. Używa wspólnych request, useResource, Feedback oraz useDraftGuard. Zamówienie ma wyłącznie status szkicu; nie pokazujemy pozornych cen ani przyjęcia przez hurtownię. Wspólna modalna ochrona szkiców ma styl ps-draft-dialog w styles.css.

## Karta części — 2026-11-02
Inspektor kreatora rozszerza istniejące natywne pola i selecty o materiał, dekor, lokalną płaszczyznę, usłojenie i krawędzie U0/U1/V0/V1. Schemat osi jest oznaczeniem, nie obietnicą rozkroju. Karta części w disclosure używa tokenów panelu, pokazuje braki i przechodzi do wybranego elementu. Eksport JSON zapisanej wersji jest akcją drugorzędną; stan niezatwierdzony pozostaje jawny. Źródło domenowe: docs/KARTA-KONSTRUKCJI.md.

Doprecyzowanie układu karty części: formularz materiałów znajduje się w szerokiej kolumnie roboczej, a inspektor wymiarów ma przycisk przejścia z ustawieniem fokusu na pierwszym polu. Na telefonie pola układają się w jedną kolumnę.

## Standard konstrukcji — 2026-11-02
ConstructionStandard używa istniejącego fieldset, fc-fields, natywnych selectów i tokenów w szerokiej kolumnie roboczej. Dwie jawne akcje uzupełnienia/zastąpienia opisów, wspólne Cofnij. FurnitureParts jest tabelą w przewijanym poziomo disclosure, bez nowej palety. Źródło: docs/STANDARDY-KONSTRUKCJI.md.

## Systemy szuflad w kreatorze — 2026-11-02
FurnitureDrawers korzysta z fc-fields, fieldsetów i natywnych selectów oraz tabel w fc-cut-table. Każdy front ma osobny system i granice komory. Źródła, braki oraz stan szkicu są czytelne; lista funkcji okuć nie wygląda jak przyjęte zamówienie. Bez nowych tokenów. Źródło: docs/SYSTEMY-SZUFLAD-KREATOR.md.

Automatyczne wypełnienie komory kontroluje natywny checkbox w istniejącym fieldsecie szuflad, klasa fc-check. Jawny opis odróżnia proporcje frontów od własnych wysokości. Zmiany wizualizuje ten sam rysunek 2D/3D i zestawienie części. Źródło: docs/SZUFLADY-WYPELNIENIE.md.

## Automatyczny układ startowy — 2026-11-02
Nowy model pokazuje wnętrze bez ręcznego dodawania płyt. Pierwsze pole Układ startowy wybiera propozycję, a rysunek i istniejący inspektor pozostają miejscem edycji. Przywrócenie i zmiana wariantu mają jawną informację o zastąpieniu wnętrza i wspólne Cofnij. Natywny select, fc-fields i tokeny bez zmian. Źródło: docs/SUGEROWANE-UKLADY.md.

## Biurko — 2026-11-02
Wariant Biurko korzysta z tego samego selektora układu, rysunku i inspektora. Panel wymiarów podaje punkt startowy oraz źródła, a przyciski 160×80 i 120×80 są jawnie opisane. Wysokość oznacza górną powierzchnię blatu. Wskazówki są informacyjne, bez deklaracji certyfikacji. Źródło: docs/BIURKO-WYMIARY.md.

Biurka z szafkami i nadstawką rozszerzają ten sam wybór wariantu. DeskStorage używa wspólnego FurnitureNumberField, fc-fields i natywnych selectów. Wysokość całkowita z nadstawką jest wyraźnie oddzielona od wysokości blatu. Bez nowych tokenów i zmian powłoki. Źródło: docs/BIURKO-SZAFKI-NADSTAWKA.md.

## Studio mebli — 4.11.2026
Podgląd stoi pierwszy w kolejności dokumentu i klawiatury. Rzeczywista geometria na dyskretnej siatce jest wyróżnikiem; bez nowej palety lub fontów. Karty wariantów używają schematów SVG, biblioteka miniatur z platePolygon. Inspektor na szerokim ekranie przewija się we własnej karcie; dokument zachowuje naturalny scroll. Historia modelu oferuje Cofnij/Ponów (40 kroków), nowa zmiana usuwa przyszłą gałąź. PNG jest lokalnym podglądem bieżącej kamery. Równe prześwity dotyczą istniejących poziomych półek w prostokątnym korpusie, bez kolizji z innym wyposażeniem; komory mają własny właścicielski algorytm.

## Skrót dokumentacji i rzut techniczny — 4.11.2026
ProjectDocuments domyślnie wybiera skrót: wnętrze, przekrój i wybrane wiercenia okuć z tej samej rewizji/wydania. Pełny pakiet pozostaje osobną opcją. Reguły dostępu są bez zmian. Biblioteka generuje krótką kartę HTML/PDF z rysunkami i tabelą prześwitów zamiast długiego indeksu części. technicalOpenings jest wspólnym właścicielem miar na rysunku i w wydruku; mierzy od powierzchni do powierzchni w osi kolumny, przy skosie jawnie podaje oś. Średnic i głębokości nie uzupełniamy domysłem.
Szybkie gabaryty wykorzystują ten sam resizeFurniture co główny formularz. Powiększenie podglądu jest natywnym dialogiem modalnym (Escape, nieaktywne tło, powrót fokusu). Wymiarowanie 2D pokazuje wnętrze bez frontów i pleców.

## Edycja rysunku i kontrola braków — 5.11.2026
Wymiary na rzucie 2D są podkreślonymi, klawiaturowo dostępnymi akcjami. Edytor wymiaru jest natywnym dialogiem, pokazuje błąd bez zapisu i przywraca fokus. Gabaryty korzystają z resizeFurniture, blokady komór z istniejącego node.size, luźna półka zmienia pozycję bez domyślnej trwałej blokady. Blokady działają w podziale komór; szkic i historia pozostają jednym źródłem.
Gotowe zestawy w FurnitureCompartments używają changeCompartment/copyCompartment i cofania; tekst wyjaśnia zastąpienie wyposażenia i niezależny dobór okuć. FurnitureReadiness zastępuje dawną oddzielną listę kontroli geometrii w Tools, zbierając istniejące wyniki issues, parts, review i drawers. Nie dodaje statusu zatwierdzenia. Cztery zwijane sekcje utrzymują krótki widok; akcja przy części wskazuje jej dane materiałowe.

## Kolory i wybór komór w 3D — 5.11.2026
FurnitureAppearance rozdziela poglądowe kolory korpusu i frontów, z natywnym input color i przyciskami zestawów. appearance jest opcjonalną, walidowaną parą HEX zapisywaną z modelem; nie zastępuje specyfikacji materiałów, artykułów lub obrzeży. Publiczna prezentacja zamraża wyłącznie oba pola kolorów, nadal bez cen.
FurnitureScene ma tryb wyboru płyt albo komór. Wybór komór ukrywa fronty i używa obwiedni liści istniejącego compartmentBoxes, ograniczonych layoutCeiling pod skosem. Kliknięcie i natywny select współdzielą zaznaczenie z panelem komór. Podświetlenie oznacza wybór, nie nowy element konstrukcji. Pokaż ustawienia komory wraca z powiększenia i ustawia fokus na jej selektorze. Scena nadal renderuje te same platePolygon; niewidoczne obwiednie wyboru nie trafiają do dokumentacji ani rozkroju.

## Kompaktowy kreator — 5.11.2026
Lokalny fc-studio korzysta z dostępnej wysokości okna; nie ogranicza przewijania współdzielonej powłoki aplikacji. Trzy kolumny: narzędzia (Biblioteka/Układ/Części), trwały podgląd, inspektor (Płyta/Komora/Widok). Każdy boczny panel ma własne przewijanie. StudioTabs jest właścicielem dostępnych zakładek z klawiszami strzałek, Home/End i roving tabindex. Podgląd nie jest odmontowywany przy zmianie zakładki. Materiały, wnęka/skosy, dokumentacja oraz braki otwierają natywny dialog z Escape i powrotem fokusu. Wąski ekran przełącza Projekt/Narzędzia/Inspektor. Poniżej 600 px wysokości wraca naturalny scroll dla dostępności. Zachowujemy dotychczasową geometrię, walidację i historię.

## Narzędzia projektowania i odzyskiwanie — 5.11.2026
useFurnitureRecovery zapisuje lokalny szkic po 350 ms od zmiany, wyłącznie dla bieżącego user_id, bez trybu demonstracyjnego. Wspólna furniture-schema jest właścicielem kształtu modelu w API i odzyskiwaniu; lokalnie dopuszcza pustą nazwę/listę części, pozostałe limity zostają. Przywrócenie i odrzucenie są jawne, wersja biblioteki zostaje zachowana, więc zapis nadal wykrywa konflikt. Powiadomienie kopii ma stałe miejsce, by nie przesuwać podglądu po opóźnionym zapisie.
Zaznaczenie wielu części mieszka w istniejącej zakładce Części (natywne checkboxy); transformFurnitureParts obsługuje duplikację z krokiem, wyrównanie i rozstaw. Jedna operacja = jeden krok historii. Korpus i generowane komory zachowują własne reguły. Wyrównanie frontów działa między zaznaczonymi częściami bieżącego modelu, także w dwóch szafkach biurka; nie zmienia przypiętych wersji innych mebli w pomieszczeniu.
FurnitureScene udostępnia przekrój X/Y/Z i izolację części w Widoku. Przekrój jest płaszczyzną widoczności bez tworzenia nowych części i zamknięcia powierzchni przekroju; raycasting ignoruje odcięte powierzchnie. furnitureFaceGuides współdzieli U/V z listą części (YZ = Z/Y). Zielone odcinki oznaczają zapisane obrzeża, niebieska strzałka zapisany kierunek usłojenia, tylko dla prostokątnych płyt z jawną powierzchnią XY/XZ/YZ. Obie części kolizji obwiedni są oznaczone w 2D i 3D. Nadal jest to kontrola poglądowa.

## Pomiar dwóch części — 7.11.2026
FurnitureMeasure korzysta z zaznaczenia w istniejącej zakładce Części, bez nowego trybu edycji. measureFurnitureParts oblicza minimalną odległość zamkniętych brył: rzeczywiste platePolygon w XY oraz przedziały ekstrudowania w Z. Uwzględnia przecięcia, zawieranie i najbliższe punkty krawędzi, nie wyznacza odległości po przekątnej obwiedni. Przerwy rzutów X/Y/Z są osobno opisane. Wynik 0 oznacza styk lub przecięcie, nie potwierdzenie poprawnego montażu.
Linia i końce pomiaru są widoczne w 2D/3D; w 3D nie zmieniają obwiedni dopasowania kamery i nie są wybieralnymi częściami. Przy otwartych frontach, rozstrzeleniu lub izolacji linia jest ukrywana, bo pomiar dotyczy złożonego modelu. Dokładnie dwie zaznaczone części są wymagane; pozostałe stany pokazują krótką instrukcję. Operacje grupowe są zwijane, aby niezaznaczona lista części była bliżej góry.

## Wspólne przygotowanie biblioteki — 9.11.2026
FurnitureBatchPreparation działa w istniejącym natywnym panelu bocznym, wejście z Biblioteki. Przygotowuje wyłącznie zapisane modele, bez niezapisanego szkicu. Wybór modeli, liczba sztuk i przypisania materiałów nie zmieniają konstrukcji ani zamówień. Modele i źródła są oznaczone wersją. Zmiana wyboru, ilości, przypisania, odświeżenie biblioteki lub zamknięcie panelu unieważniają wynik i anulują żądanie. Konflikt wersji wymaga jawnego użycia bieżącej wersji i ponownego przypisania materiału.
Backend furniture-batch-preparation używa istniejącego adaptera prepareFurniture na jednym odczycie bazy, a następnie tego samego rozkroj dla zestawu. Limit 12 modeli / 20 sztuk każdego / 1500 płyt. Każda fizyczna kopia otrzymuje namespacowany identyfikator i mapę do modelu, wersji oraz części źródłowej. Braki dowolnego modelu blokują cały wspólny plan. Oddzielny i wspólny wynik porównują tę samą heurystykę; nie obiecujemy minimum odpadu.
Diagramy pokazują istniejące położenia, nie instrukcje kolejnych cięć. Klawiaturą i kliknięciem wybiera się formatkę; tekst pokazuje mebel, sztukę, wersję i rdzeń. JSON zawiera migawki źródeł i ustawienia, bez cen. To nadal szkic płyt, bez skrzynek szuflad, okuć, technologii i zgody produkcyjnej; nie wysyła zamówienia do Mussi.

Jednostka wyceny nie jest formatem fizycznym płyty: adapter pojedynczy i zestawowy akceptują także płyty laminowane, MDF, HDF i sklejkę sprzedawane na sztuki/arkusze. Format arkusza musi nadal być jawny i dodatni. Gotowy front na sztuki nie staje się arkuszem; brak formatu lub niezgodna grubość blokują plan. Ceny nie są potrzebne ani zwracane.

## Blokady frontów i bazy prowadnic — 12.11.2026
Inspektor samodzielnej szuflady rozszerza istniejący checkbox i NumberField o stałą wysokość frontu. Wysokość jest pierwszym polem geometrii szuflady, bez przewijania przez pozycje XYZ. Etykieta na rzucie 2D wskazuje wartość blokady; w trybie wymiarowania ustępuje istniejącym wymiarom technicznym. Bez nowego panelu ani kolorów. Pozostałe automatyczne fronty dzielą resztę komory równo, a brak blokad zachowuje dotychczasowe proporcje.
Kalkulator szuflad używa jednej tabeli dla dwóch baz dolnej krawędzi prowadnicy. Druga kolumna pomiarów wymaga jawnej grubości wieńca; brak danych to kreska i instrukcja uzupełnienia. Odległość od dołu korpusu nie obejmuje nóg/cokołu. Stan niezatwierdzonego profilu to „Obliczenie robocze”, bez zielonego potwierdzenia produkcji. Zachowane tokeny i natywna tabela, układ telefonu bez poziomego przewijania strony.

## Rysunki techniczne i montażowe — 12.11.2026
FurnitureTools udostępnia zamknięty domyślnie podgląd rysunków w istniejącym dialogu Dokumentacja. Ta sama furnitureDocument generuje srcDoc izolowanej ramki i plik HTML do druku. Dwa arkusze: rzuty z prześwitami oraz rozstrzelenie korpusu, identyfikacja części i poziomy półek. Widok ekranu dopasowuje się do telefonu; druk zachowuje A4 poziomo. Tło i linie kontynuują paletę dokumentacji. Wymiary mają linie pomocnicze i ukośne kreski; krótkie prześwity otrzymują sam odnośnik do tabeli, aby opisy nie nakładały się na płyty. Powiększone opisy i dyskretny obrys zapewniają czytelność wydruku.
Oznaczenia P odpowiadają kolejności części w kreatorze i nowej kolumnie CSV; PART_n w DXF odpowiada Pn. Oznaczenia O łączą rzut z tabelą światła. Rysunek rozstrzelony jest rzutem równoległym rzeczywistych wielokątów i głębokości płyt, z umownymi przesunięciami części. Brak fototekstur, pozornych łączników i domyślnych wierceń. Odnośniki rozmieszczane są w kolejności wysokości, oddzielnie po obu stronach rysunku.
Dla ponad 8 części korpusu lub ponad 6 prześwitów karta używa gęstszego układu: niższe rysunki, większy tekst we współrzędnych SVG i mniejsze odstępy tabel/stopki. Mobilny podgląd zachowuje automatyczną wysokość SVG. Test fizycznej liczby stron PDF obejmuje prostokątną szafkę oraz skosy i schody w obu kierunkach; liczba arkuszy nie jest wnioskowana z samego podglądu ekranu.

## Wspólne mocowania szuflad — 13.11.2026
FurnitureDrawers używa istniejącego RysunekFrontu z kalkulatora. Nowa sekcja „Mocowanie frontu · osie X/Y” jest domyślnie zamknięta. Jedno opcjonalne pole pierwszego otworu, schemat i krótki opis osi; dłuższe założenia mieszczą się wewnątrz kolejnego disclosure. Wartości Y na wspólnym schemacie mają odnośniki po prawej; etykiety rozsuwa algorytm, aby bliskie otwory nie nakładały opisów. Zachowane kolory, obrys i fonty kalkulatora. Precyzja tekstu w obu narzędziach: do trzech miejsc po przecinku.
Jedna lista wyboru płyty jest nad zakładkami inspektora. Nie znika podczas edycji materiału, okuć ani systemu szuflady. Wybranie kolejnego frontu szuflady zachowuje zakładkę System; wybór części nieobsługującej danej zakładki korzysta z dotychczasowego powrotu do Wymiarów. Usunięto powtarzany nagłówek i instrukcję, by odzyskać miejsce na parametry.

## Podział frontów w kuchni — 14.11.2026
Publiczny inspektor szafki korzysta z tych samych pól, przycisków i tokenów. Podział frontów jest natywnym selectem; własne wysokości rozwijają krótki rząd pól od góry. Auto oznacza pozostawienie pustego pola. Podgląd wysokości nie zmienia rysunku do czasu Zastosuj. Wybrany rzeczywisty front ma osobny select z wymiarami i odnośnik do istniejącego kalkulatora. Dopasowanie szerokości jest pomocniczą akcją w formularzu, bez dodatkowego modala. Przywracanie stanu po zastosowaniu ma różne klucze właścicieli edytora i wyboru szuflady.

## Dopełnianie rzędów, blendy i przerwy — 14.11.2026
KitchenRunTools używa zamkniętego details w obecnym katalogu, z jednym wyborem rzędu i przyciskiem. Dodatkowe położenie mieści się w zamkniętej sekcji inspektora; jej nagłówek pokazuje zastosowany początek elementu. Zastosuj zachowuje dotychczasową historię. Nie przybywa modali ani stale rozwiniętych paneli. Blenda ma nazwane własne wymiary i przycisk, bez pola głębokości sugerującego grubość płyty.
Przerwa to puste miejsce, blenda to fizyczna płyta. Obie wpływają na położenie, ale tylko blenda trafia do materiałów. Teksty wyjaśniają zakres dopełniania końca rzędu, brak blatu nad przerwą i konieczność dopasowania blendy po pomiarze. Nie sugerują automatycznego opracowania narożnika lub montażu.

## Funkcjonalna kuchnia — 14.11.2026
Propozycja pokazuje kuchnię ze strefami hydrauliki, AGD i wentylacji oraz przygotowania, zamiast sekwencji typów szafek. KitchenZones nad podglądem ma trzy krótkie kolumny; na telefonie naturalny układ pionowy. Przyciski z funkcją, ścianą i położeniem wybierają istniejący element. Tekst, nie kolor, rozróżnia funkcje. Dodatkowa lista braków jest zwinięta; stan wynika z aktualnej geometrii także po edycji i cofnięciu.
KitchenPlanningTools mieści założenia zlewu i zmywarki w jednym details. Native select/input oraz jawny przycisk propozycji korzystają z obecnej historii i Feedback. KitchenRunTools domyślnie uzupełnia brakujące strefy, a osobne cele oznaczają półki lub szuflady. Elewacja publicznej kuchni ma opcjonalne oznaczenia urządzeń; 3D korzysta z istniejącego trybu klienta i poglądowego frontu piekarnika. Symbole nie są częściami produkcyjnymi. Zachowano paletę, typografię i mechanizm rysowania.

## Powrót do szuflady i pamięć kalkulatora — 14.11.2026
Łącze z konkretnego frontu zachowuje identyfikator szafki i kod frontu. Powrót otwiera odpowiednią ścianę i inspektor, z fokusem na wyborze frontu. Dodatkowy blok w kalkulatorze odróżnia wymiar wejściowy frontu od dociętego dna i pleców; grubość płyty skrzynki jest przy obu formatkach. Używa tych samych tokenów, liczb i typografii, bez nowych kart nawigacji.
Pamięć ostatniej kalkulacji z projektu jest oddzielna od samodzielnego kalkulatora. Krótka informacja i akcja Przywróć dane z projektu wyjaśniają reset systemu i pozycji otworów. Przy niedostępnym zapisie tekst opisuje faktyczny stan. Nie dodano synchronizacji z chmurą ani zapisu wyników do konstrukcji mebla.
Samodzielny chroniony kalkulator zachowuje 120 px odstępu przewijania dla formularza i wyników; wariant w panelu używa 96 px. Stały nagłówek nie zasłania celu akcji Pokaż rozkrój i wiercenia oraz Zmień dane.

## Automatyczny front wewnętrzny i start całej kuchni — 14.11.2026
Za drzwiami szerokość frontu jest domyślnie automatyczna. Natywny checkbox przełącza na wymiar ręczny; pole automatyczne jest readonly, z krótkim działaniem LW − 36 mm i stroną dystansu. Rysunek, podsumowanie i kopiowanie biorą ten sam wymiar. Nie dodajemy luzu bez decyzji użytkownika; opis wskazuje, że automatyka nie zawiera dodatkowego luzu.
Pierwszy ekran kuchni udostępnia tę samą kontrolkę KitchenPlanningTools w bocznym obszarze Gotowa kuchnia na start. Ułóż całą kuchnię przejmuje bieżące, jeszcze niezastosowane wymiary, zatwierdza je wspólną walidacją i przechodzi do edytowalnej propozycji. Przy istniejącym szkicu etykieta brzmi Zastąp całą kuchnię. Zachowane tokeny, kontrole natywne, historia oraz ręczne wejście Przejdź do szafek.

## Ciągi kuchenne i obudowy — 15.11.2026
KitchenRunTools jest pod podglądem na etapie szafek. Stałe liczniki trzech typów ciągów, dwie natywne sekcje details do uzupełniania i wykończenia. Bez nowej nawigacji, panelu nad rysunkiem ani nowych tokenów. Natywny select wybiera lukę i ciąg; checkboxy osłon mają cele 44 px. Sugestia ustawia formularz, Zastosuj zatwierdza; wstępny opis podaje zmianę szerokości. Po zastosowaniu fokus wraca na wybór ciągu.
Wspólne kitchen-runs wykrywa fizyczne sąsiedztwo i dzieli ciągi przy zmianie typu, wysokości, poziomu lub głębokości. Uzupełnianie luk zachowuje istniejące pozycje, omija słupki na poziomie górnym i proponuje blendy dla 20–199 mm. Uzupełnij cały rząd zatwierdza wszystkie dopasowania w jednym kroku historii albo nie zmienia niczego.
Osłony są konfiguracją istniejącego modułu, nie osobnym pozornym meblem. Builder generuje boki i modułowe wieńce z materiału frontu; tę samą geometrię pokazują elewacja, rzut, 3D oraz PDF i wycenia serwer. Domyślne 20 mm liczymy przed zewnętrznym licem frontów; pole jawnie podaje bazę. Grubość boków jest rezerwą w szerokości. Zachowanie obrysu dopasowuje tylko szafki bez AGD i pokazuje zmianę przed zatwierdzeniem. Brak miejsca lub przekroczenie sufitu blokują zastosowanie. To koncepcja do sprawdzenia otwierania i wentylacji, nie automatyczna aprobata montażu.

## Rzuty JPG/PNG i narożniki kuchni — 16.11.2026
Istniejące Pliki architekta mają wyraźny nagłówek Wczytaj rzut. Obrazy używają obecnego formularza i jego akcji zapisu, anulowania oraz ochrony niezapisanej edycji. Dwa kliknięcia/tapnięcia zaznaczają prostokąt kuchni albo znany odcinek. Natywne pola kadru udostępniają tę samą operację z klawiatury. Skala jest jawna, bez zgadywania; obrót i przesunięcie zostają w tych samych kontrolkach. Zaawansowane pola są zwinięte. Podkład jest pod geometrią szafek, w istniejącym rzucie.
Kolizja gabarytów lub rezerwy otwierania ma tekst pod rysunkiem oraz odnośniki do obu szafek. Ten sam token danger zaznacza je w rzucie i elewacji; informacja nie zależy od koloru. Propozycja i dopełnianie nie zajmują zwykłymi szafkami rezerwy obu ramion narożnika. Kontrola jest konserwatywnym obrysem, nie symulacją konkretnego zawiasu.

## Dwa ciągi naprzeciwko i odniesienie blatem — 16.11.2026
Układ równoległy korzysta z istniejących kart wyboru, w siatce 2 × 2 także na telefonie. Ściany A/C mają wspólną długość; osobne pole oznacza odległość między ich tyłami, nie szerokość przejścia. Nie pokazujemy narzędzi ani rezerw narożnikowych. Rzut i 3D korzystają z jawnych przeciwnych kierunków ścian. Obrót lub numer ciągu nie oznacza odbicia całego obrazu.
Kalibracja obrazem zachowuje końce znanego odcinka i jego długość. Przycisk Głębokość blatu: 60 cm uzupełnia wymiar już zaznaczonego odcinka; nie zgaduje miejsca na zdjęciu. Po ponownym otwarciu edytor pokazuje ten sam odcinek i skalę. Brak zmian w kolorach, typografii lub mechanizmie zapisu plików.

## Uzgodnienia i zapis kuchni — 20.11.2026
KitchenProjectHub rozszerza istniejące akcje zapisu o osobne linki edycji/podglądu i natywny kp-dialog. KitchenProjectExtras używa natywnych pól, checkboxów i disclosure dla pomiarów, budżetu i gabarytów. KitchenBudgetAdvice i KitchenRepairPreview korzystają z istniejącej wyceny i rzutu. Tokeny panel/line/text/radius z styles.css pozostają właścicielem kolorów. Telefon zachowuje podgląd i następny krok przed katalogiem; zapis online ma zwarty pasek. Źródło: docs/KUCHNIA-ZAPIS-I-PRZEKAZANIE.md.

## Wyceniarka właściciela — 20.11.2026
FairQuoteCalculator rozszerza panel właściciela o porównanie materiał ×2, dolnego progu kosztów i docelowej marży. Reużywa pc-number-grid, Feedback, ps-button i tokenów panel/line/text/accent-soft/radius. Wynik ma jedną hierarchię cena → zarobek po pracy → porównanie metod. Na telefonie przechodzi pod formularz; brak poziomego przewijania. Kwoty netto i osobogodziny są jawne. Źródło: docs/WYCENIARKA-MATERIAL-X2.md.
