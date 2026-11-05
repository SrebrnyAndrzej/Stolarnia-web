> Aktualizacja 31.10.2026: film hero zastąpiony dostarczoną wersją Kuchnia-Darii-animacja-v2.mp4 (14 s). Sterowanie i wygładzanie scrolla pozostają bez zmian. Rendery i nową animację składania przygotowuje Claude. Wcześniejsze prototypy Codex wycofano z publikowanej strony i zachowano w lokalnym archiwum; poniższe wzmianki o ich wdrożeniu są historyczne. Codex odpowiada za układ i treści.

# Pan Stolarz 2.0 — kontrakt interfejsu

## Integracja Claude i przygotowanie płyt — 3.11.2026

ST-APP-004: punkty stałe i okna w szybkim kreatorze, tryb przy kliencie domyślnie ukrywa koszty zakupu także właścicielowi, preferowane dekory, tekstury 3D i ujęcia do oferty. Galerie dekorów i pełny ekran 3D korzystają z natywnego modalnego dialogu: tło nieaktywne, Escape, fokus w obrębie dialogu. Ujęcia wyłącznie w pamięci edytora, usuwane po opuszczeniu lub zmianie rewizji, bez sessionStorage. Ustawienia dekorów używają request/useResource/Feedback i blokują równoległy zapis.

Propozycja wstępna może powstać przy brakach cen. Pokazuje zakres i braki oraz cenę do ustalenia; nie wyznacza nieuzasadnionego maksimum przez dodanie procentu do niepełnej kalkulacji. Pełna oferta nadal wymaga wszystkich cen. Ujęcia do PDF nie są trwałym archiwum ani akceptacją klienta.

ST-APP-003: karta zestawienia jest dostępna w Produkcji oraz w panelu Zamówienia. Te same API i statusy w obu miejscach; nie tworzymy drugiego zestawu dostaw. Właściciel wybiera projekt i wydanie; import nie wysyła zamówienia do Mussi. Ilości z geometrii wydania, katalogi i ustawienia bieżące — jawne ostrzeżenie. Każdy zapis statusu przez HTTP wymaga oczekiwanej rewizji, ilości i czasu ostatniej zmiany; konflikt 409 zachowuje formularz. request/useResource anuluje stare odczyty; tabela przewijana lokalnie. CSV chroni tekstowe komórki przed interpretacją formuł.

FurniturePreparation jest wariantem standardowych field/input, natywnych selectów, request/useResource/Feedback. Uruchomienie tylko dla zapisanej, niezmienionej wersji. Materiały przypisuje się jawnie z katalogu bez cen; zbiorczo tylko przy zgodnej grubości. Każdy brak wstrzymuje rozkrój całego modelu zamiast pomijania części. Pakiet JSON zawiera geometrię, specyfikacje, materiały, przypisania, ustawienia, wersję i sumę SHA-256 oraz wynik tego samego silnika rozkroju i obrzeży. Kompensacja raz; obsługiwane prostokątne płyty i ABS 0,8/2 mm, kierunek dekoru. Bez pozornego zwolnienia technologii, automatycznych skrzynek szuflad czy zamówienia. Źródło: docs/ROBOCZY-PAKIET-PLYT.md.

## Oryginały CAD od architekta

`ProjectFiles.tsx` w szczegółach projektu: import jednego DXF/DWG, limit 3 MiB, do 50 oryginałów na projekt. Natywny input i drop target mają tę samą walidację. Stan wyboru jest zachowany po błędzie sieci/serwera; ponowienie z tym samym ID lub sumą SHA-256 nie tworzy drugiego oryginału. Postęp jest nieokreślony, przerwanie oznacza przerwanie oczekiwania (serwer mógł już zatwierdzić zapis). Odświeżenie listy rozstrzyga wynik. Zmiana projektu anuluje odczyty i zamyka sekcję; zamknięcie przywraca fokus.

Oryginały są nieprzefiltrowaną treścią zewnętrzną, dlatego dostęp mają właściciel oraz projektant z profilem sprzedaży; produkcja i montaż zachowują dokumentację techniczną bez nowych praw do surowych plików. Każde pobranie sprawdza aktywną sesję, profil i projekt. Metadane są w bazie aplikacji, zawartość w prywatnym Supabase Storage (lokalnie obok lokalnej bazy), nie w publicznym katalogu. Lista nie ujawnia klucza obiektu, pobranie sprawdza SHA-256. Nazwy i rysunki nie są interpretowane jako HTML. Nie ma publicznych linków ani zmiany polityk dostępu Storage.

DXF do 1 MiB ma ograniczony podgląd w osobnym workerze z limitem 5 sekund: przestrzeń modelu 2D, linie, proste polilinie, przybliżone koła i łuki. Ograniczona liczba elementów i punktów; pominięcia są opisane. Jednostka z INSUNITS lub jawny wybór użytkownika; brak nie staje się milimetrami. Wybór warstw i jednostki nie edytuje oryginału ani konstrukcji. DWG i binarny DXF są zachowywane; podgląd wymaga ASCII DXF. Nie ma automatycznej konwersji DWG ani tworzenia geometrii mebli z rysunku architekta.

Weryfikacja: `src/project-files.test.ts`, test „pliki CAD HTTP” w macierzy dostępu, `tests/v2/project-files.spec.ts` (właściciel, projektant na telefonie, odmowa produkcji, ponowienie, oryginalne bajty, worker, warstwy, jednostki, axe).

Źródła biznesowe: polecenia właściciela w rozmowie (2026-10-31), docs/RESEARCH-silnik-mebli-i-konta.md i docs/RESEARCH-macierz-autoryzacji-tras-2026-10-05.md. Nowe ustalenie: pracownik nie ma dostępu do wycen i finansów; ma kalkulator i podgląd udostępnionych projektów. Obsługujemy jedną stolarnię Pan Stolarz, nie produkt dla wielu warsztatów.

| Zdolność            | Właściciel UI                   | Wariant                                                           | Weryfikacja                     |
| ------------------- | ------------------------------- | ----------------------------------------------------------------- | ------------------------------- |
| Nawigacja           | v2/App.tsx                      | hash istniejącego repo; menu mobilne                              | test tras i odmowy dostępu      |
| Formularz zapytania | v2/Landing.tsx                  | walidacja własna, noValidate, zachowanie danych po błędzie        | test formularza                 |
| Logowanie           | v2/Login.tsx + server/access.ts | Supabase Auth; cookie HttpOnly; bez wyboru roli                   | test API i sesji                |
| Select              | natywny select                  | systemowy popup akceptowany, polskie etykiety                     | klawiatura i urządzenie mobilne |
| Wyszukiwanie        | v2/Workspace.tsx                | lokalne, natychmiastowe; clear i query w URL                      | test wyszukania i wyczyszczenia |
| Zapis               | v2/api.ts i useResource.ts      | anulowanie starych odczytów; brak automatycznych powtórek mutacji | błąd i opóźniona odpowiedź      |
| Dialog tworzenia    | Workspace/NewProject            | natywny dialog modalny, Escape, autofocus                         | test klawiatury                 |
| Komunikaty          | v2/App.tsx Feedback             | inline role alert/status; brak natywnych alert/confirm            | błąd i retry                    |
| Scrollbar           | styles.css                      | istniejący standard + v2 tokeny                                   | kontrola CSS/przeglądarki       |
| Kalkulator          | PrzelicznikSzuflad.tsx          | istniejący model/hook/serwis, nie kopiujemy wzorów                | regresja obliczeń               |

## Canonical capability map

| Capability     | Canonical owner              | Source of truth     | Allowed variants                                                     | Verification                 |
| -------------- | ---------------------------- | ------------------- | -------------------------------------------------------------------- | ---------------------------- |
| Select/Listbox | Native select                | DESIGN.md           | platform-owned popup, polskie etykiety                               | tests/v2/interface.spec.ts   |
| Form           | v2/Login.tsx, v2/Landing.tsx | This contract       | noValidate + własna walidacja                                        | tests/v2/interface.spec.ts   |
| Scrollbar      | web/src/styles.css           | DESIGN.md           | v2 overrides tokens                                                  | browser screenshots          |
| Toast          | v2/App.tsx Feedback          | This contract       | inline alert/status only                                             | tests/v2/interface.spec.ts   |
| CRUD           | v2/api.ts, server/access.ts  | Role contract above | create request, read project, update access; no employee edit/delete | scripts/verify-v2-access.mjs |

## Dane i uprawnienia

Serwer sprawdza aktywne członkostwo przy każdym żądaniu. role=owner obsługuje dotychczasowy panel i eksporty. employee ma tylko kalkulator oraz projekty z project_ids; client ma własne udostępnione projekty. Odpowiedź technical.ts ma jawny zestaw pól, bez notatek, umów, wydań i finansów. Ekran klienta nie dostaje wewnętrznych kosztów. Rola w UI nie stanowi uprawnienia.

## Przepływy

- Strona klienta → zapytanie → potwierdzenie dopiero po zapisie serwerowym. Błąd zachowuje pola. Brak wyliczenia ceny nie jest ukrywany fikcyjną kwotą.
- Logowanie → panel wynikający z członkostwa. Wygaśnięcie sesji → ponowne logowanie i usunięcie danych panelu z drzewa UI.
- Projekt → 2D/3D i materiały. Właściciel przechodzi do istniejącego projektanta/oferty. Pracownik ma podgląd bez edycji.
- Pracownicy → przydział projektów lub wyłączenie konta. Kont właściciela nie można zmieniać tym formularzem.
- Demonstracja → jawny komunikat i tylko dane syntetyczne; nie udaje logowania, zapisu ani kalkulacji z bazy zakładu.

Nowe konto wymaga przygotowania w Supabase Auth i przypisania członkostwa. Panel nie implementuje jeszcze zaproszeń i resetu hasła. Formularz przyjmuje opis, nie upload. Publiczne wyceny i dokumenty klienta wymagają następnego etapu integracji; nie są przedstawiane jako gotowe.

## Kreator kuchni (2026-10-31)

Źródło zakresu: prośba użytkownika o samodzielny wstępny projekt kuchni; zasady konstrukcji nadal należą do istniejącego silnika i docs/RESEARCH-silnik-mebli-i-konta.md. UI: `planner/KitchenPlanner.tsx`; adapter i walidacja szkicu: `planner/model.ts`. Publiczny dostęp nie poszerza dostępu do projektów ani API właściciela.

Strona klienta → kreator → wymiary → szafki/wygląd → podsumowanie → formularz zapytania z opisem. Zapis lokalny i eksport obejmują tylko koncepcję; nie stanowią zapisania projektu w bazie stolarni. Pierwszy zakres nie obejmuje okien, drzwi, instalacji, swobodnego drag-and-drop, aktywnej zabudowy narożnej, współdzielonych linków, automatycznej wyceny ani zatwierdzenia do produkcji. Brak tych kontroli jest jawny w interfejsie. Kolory to poglądowe wykończenia, nie wybór SKU płyty.

Wymiary: pełne milimetry, długości 1800–8000 mm, wysokość 2300–3500 mm. Do 24 modułów z jawnego podzbioru katalogu. Przekroczenie ściany i nakładanie słupka/wiszącej blokują przejście do zapytania; kontrola nie oznacza pełnej analizy kolizji. Zmiana kolejności i usuwanie mają Cofnij. Dane kontaktowe są zbierane dopiero w istniejącym formularzu. Testy: `tests/v2/planner.spec.ts`, `web/src/v2/planner/model.test.ts`.

Układ U: trzy ściany A/B/C z niezależnymi długościami. Puste strefy narożników 650 mm na początku B i C; geometria ścian z istniejącego renderera (łańcuch 90°). Zmiana na mniejszy układ jest blokowana, dopóki na usuwanej ścianie są szafki. Starsze szkice bez długości C otrzymują domyślne 3600 mm; zapis wersji 1 pozostaje czytelny.

## Animacja intro

Kanoniczny komponent HomeIntro.tsx sam odtwarza film v4 (0,75×, muted/playsInline). Zakończenie prowadzi płynnie do kolejnej sekcji, bez konieczności przewijania i bez pętli. Hero nie przechwytuje scrolla i nie tworzy długiego obszaru przewijania. Ręczna nawigacja, fokus w hero, reduced-motion lub ukryta karta powstrzymują automatyczne przejście. Pauza i wznowienie nie blokują strony. Ograniczenie ruchu/danych nie pobiera filmu bez opt-in. Awaria i odrzucenie autoplay zachowują czytelną treść, poster oraz CTA. Film zatrzymuje się poza widokiem i w ukrytej karcie. Testy: tests/v2/home-animation.spec.ts.

## Publiczne materiały projektowe

Aktualne media: dostarczony film kuchni Darii v2 w hero i film składania szafki w osobnej sekcji `Landing.tsx` (12 s, ręczne odtwarzanie, preload none, poster). Prototyp ProjectMedia, rendery Codexa i test project-media zostały wycofane. Galeria czeka na materiały Claude. Strona nie odpytuje prywatnych projektów w celu prezentacji publicznych mediów.

## Pulpity ról — 31.10.2026
`Workspace.tsx` pokazuje kontekst roli nad wspólną przestrzenią projektu. Właściciel: aktywne projekty, produkcja, gotowe do montażu i przejścia do zapytań oraz przydziału dostępu. Pracownik: przypisane projekty, ich etapy i kalkulator szuflad; bez żądań finansowych i uprawnień edycji. Liczniki wynikają wyłącznie z listy zwróconej dla konta; podczas odczytu pokazują wielokropek, przy błędzie kreskę, nigdy fikcyjne zero. Wspólna lista, 2D/3D i inspektor zachowują kontrakt odczytu. Demonstracja nadal ma dane syntetyczne i nie loguje użytkownika.

## Dokumentacja warsztatowa i druk — 31.10.2026

Źródło reguł: docs/WYTYCZNE.md (ta sama rewizja i jawna gotowość), istniejący Production.tsx (pracownik drukuje zamrożone wydanie), src/server/access.ts (role i przydziały). Właściciel i pracownik otwierają dokumentację z Workspace.tsx. Klient nie ma tego wejścia ani dostępu do endpointów.

Kanoniczny komponent ProjectDocuments.tsx korzysta z useResource/requestPdf, natywnych selectów i Feedback. PDF generuje istniejący silnik przez adapter src/server/documents.ts i /api/v2/projects/:id/documents(.pdf). Nie zmieniono reguł konstrukcyjnych src/core. Właściciel może czytać bieżącą dokumentację lub wybrane wydanie; pracownik tylko wydania przypisanych projektów, domyślnie najnowsze. Brak wydania wyjaśnia brak wydruku. Nowe wydanie tworzy właściciel w istniejącym panelu produkcji, nie ten odczyt.

Karty techniczne = pełny pakiet istniejącego generatora, z kartami szafek i osobnymi rysunkami części. Karty montażowe = istniejący pakiet skrócony, z rzutami, zbiorczymi kartami, częściami i okuciami. Nie dodano nowych instrukcji technologicznych ani nie zadeklarowano pełnej weryfikacji warsztatowej. Oba zakresy można ograniczyć do szafki. Wybrana rewizja jest kontrolowana przez serwer; jej zmiana zwraca 409. Roboczy status i braki danych pozostają w UI i PDF, również w historycznym wydaniu.

Adapter zwraca jawny zestaw pól podsumowania bez notatek wydania, danych klienta, cen, umów i migawki. PDF warsztatowy ukrywa pole klienta; brak kwot i finansów potwierdzono ekstrakcją tekstu w izolowanych testach. Legacy eksporty pozostają owner-only. Każde pobranie sprawdza aktywną rolę i przydział, odpowiedzi private/no-store. PDF przechowywany w pamięci przeglądarki jako Blob, URL sprzątany po zmianie zakresu/zamknięciu. Błąd zachowuje wybór i umożliwia ponowienie. Zamknięcie przywraca fokus. Wydruk z podglądu PDF w nowej karcie; bez automatycznego otwierania popupu po await.

Demo ma statyczne PDF-y syntetycznej szafki, niezależne od wybranego przykładowego projektu, wyraźnie oznaczone jako nieprodukcyjne. Nie pobiera dokumentacji prywatnej. Skrypt odtwarzania: scripts/generate-technical-demo.mts, wyłącznie lokalny magazyn tymczasowy. Testy: tests/v2/documents.spec.ts, scripts/verify-v2-access.mjs.

## Przywracanie kontekstu i wyszukiwanie
Parametry hash `projekt`, `q`, `etap` odtwarzają wybór i filtry po odświeżeniu. App rozpoznaje sekcję oddzielnie od parametrów, aby link z parametrami nie zmieniał zakresu dostępu pracownika. W trakcie ładowania lub błędu nie nadpisujemy zapisanego wyboru pustą listą. Zmiana parametrów hash jest odczytywana przez Workspace; zwykłe wpisywanie używa replaceState, bez wpisu historii na każdy znak.

Puste wyniki listy mają „Pokaż wszystkie projekty” i przywrócenie fokusu do wyszukiwania. Wyczyszczenie pola search również przywraca fokus. Filtry nie zmieniają projektu ani jego statusu. Owner Requests filtruje tylko aktualnie pobraną listę do 100 zgłoszeń, lokalnie i bez wysyłania zapytań mutujących.

Odświeżenie dokumentacji anuluje przygotowanie PDF, usuwa poprzedni plik z UI i resetuje zakres szafki. Polskie etykiety diagnostyki są warstwą prezentacji, nie zmianą poziomów silnika. Walidacja logowania kieruje fokus do błędnego e-maila również wtedy, gdy pole nie jest puste; aria-invalid wskazuje błędne pola. Nie zmieniono polityki autoryzacji ani ról.
Wyszukiwanie zapytań pozostaje w pamięci widoku: fraza może zawierać imię lub e-mail, dlatego nie zapisujemy jej w URL ani localStorage. Zmiana roli demonstracyjnej przechodzi na listę projektów danej roli, bez przenoszenia danych sesji i bez udawania zalogowania.

## Aktualny tryb hero — samoczynne odtwarzanie
Na nowe zlecenie użytkownika film v4 odtwarza się sam, bez powiązania currentTime ze scrollem. Tempo 0,75×, bez dźwięku i zapętlenia. Po zakończeniu następuje płynne przewinięcie do następnej sekcji. Hero ma naturalną wysokość zamiast długiego obszaru scrolla; tekst ujawnia się z czasem filmu. Pauza/wznowienie i ponowne odtworzenie są dostępne. Po ręcznej nawigacji, przy fokusie w hero, ukrytej karcie lub reduced-motion nie wymuszamy przejścia. Reduced-motion/saveData nie pobiera filmu bez opt-in; odrzucenie autoplay pokazuje przycisk uruchomienia. Ta decyzja zastępuje wcześniejszy tryb przewijania i jego parametry.

## Treści publiczne i kontakt — 1.11.2026
Treść pochodzi z plików Mateusza; niepotwierdzone warunki i brakujące materiały są wyłączone. Główne „Umów pomiar” otwiera telefon, bez udawania rezerwacji lub wysłania zapytania. Kotwice `#/uslugi`, `#/wizualizacja`, `#/o-nas` wracają do publicznej strony także przy aktywnej sesji. Stały nagłówek i scroll-margin utrzymują widoczność nagłówków docelowych. Dane kontaktowe są bez ulicy; JSON-LD nie zawiera niepotwierdzonego maila/domeny/profili.

Dotychczasowy formularz i adapter nie oznaczają uruchomienia przyjmowania danych na produkcji. Nie dodano nieistniejącego uploadu, terminów odpowiedzi ani automatycznego oddzwaniania. Polityka prywatności i docelowa konfiguracja pozostają wymaganiami uruchomienia, a nie publicznym placeholderem. Kontrola check:zgody blokuje materiały oznaczone prefiksem oczekiwania na zgodę przed buildem.

## Uzupełnienie całej gotowej treści — 1.11.2026
Na polecenie użytkownika dodano 4 usługi, 4 pozycje paska dowodów, galerię 2 istniejących wizualizacji, 3 wyróżniki z działającymi przejściami, materiały/okucia i komplet 10 pytań FAQ. Galeria zastępuje osobny blok składania; zachowuje ten sam film oraz dodaje kadr kuchni z linkiem do animacji. Wyróżnik dokumentacji otwiera publiczny syntetyczny przykład PDF z oznaczeniem nieprodukcyjnym. Ceny opisano dla zatwierdzonego zakresu, bez zmiany umów i aktualizacji zapisanych kwot. Nie podano nieznanych terminów, cen pomiaru ani okresów gwarancji. Opinie, nieznane dane firmy i brakujące dokumenty prawne nie są zastępowane fikcyjną treścią.

## Biblioteka mebli (2026-11-02)
- Kanoniczny widok: `FurnitureCreator`; pola mm: `NumberField`; błąd API: wspólny `Feedback`; zapis sieciowy: `request`.
- Decyzja użytkownika: wszyscy aktywni pracownicy, niezależnie od profilu, edytują wszystkie modele warsztatu. Nie rozszerza to dostępu do innych tras. `GET|PUT /api/v2/furniture` ma jawną regułę serwera.
- Biblioteka przechowuje wyłącznie model i metadane zmian; dane klientów, ceny i projekty nie są dołączane. Serwer nadaje autora z sesji.
- Zapis wymaga wersji modelu i istniejącego CAS całej bazy. Konflikt pozostawia szkic; użytkownik otwiera aktualną wersję lub tworzy kopię. Nie ma automatycznego nadpisania.
- Nieudany zapis zachowuje formularz. Zapis blokuje edycję. Odejście linkiem lub nowy model z niezapisanym szkicem wymaga potwierdzenia; przeładowanie chroni beforeunload. Cofnij zachowuje do 40 kroków w karcie.
- Podgląd demonstracyjny zapisuje jedynie w pamięci bieżącej karty, co interfejs jawnie opisuje.
- Półki i przegrody są przycinane do obrysu. Front szuflady wychodzący poza obrys blokuje zapis. 2D i izometryczna bryła 3D używają identycznych polygonów.
- To model do dalszego opracowania, bez automatycznie zatwierdzonych połączeń, skrzynek szuflad, obrzeży i otworowania; nie jest wydaniem produkcyjnym ani eksportem CNC.
- Główna granica błędów `PanelBoundary` pokazuje odzyskanie po błędzie komponentu lub pliku lazy; wydanie OVH zachowuje starsze zasoby z hashami i wymusza rewalidację index.html.

## Skos i cięcie (2026-11-02)
Dwa jawne pola wysokości boków (krótki i długi, pomiar zewnętrzny) oraz szerokość pozioma. SlopeCutting używa geometrii slopeCut; rysunek przedstawia wieniec między bokami. Porównanie uciosów jest oddzielnie oznaczone i nie zmienia konstrukcji. Nastawa0°=cięcie prostopadłe przy płycie płasko. Przekroczenie45° jest jawne i blokuje wskazówki ustawiania do bezpośredniego cięcia. Dane nie są instrukcją konkretnego modelu Mac Allister; nie znamy jego identyfikatora ani dopuszczalnej głębokości. Zmiana wysokości aktualizuje kalkulator i zapisuje się z modelem; wybór piły i wariantu porównania jest lokalnym ustawieniem widoku.

## Przejście z podglądu do kont zespołu (2026-11-02)
Adres #/podglad/owner/pracownicy jest demonstracją; pokazuje jawne wyjaśnienie oraz odnośnik #/panel/pracownicy. Podgląd nie tworzy prawdziwych kont. Po logowaniu rozpoczętym z #/panel/... aplikacja zachowuje docelową sekcję, a autoryzacja roli nadal obowiązuje. Ekran startowy właściciela i pracownika ma widoczne szybkie przejście „Otwórz kreator mebla”, również gdy boczne menu jest schowane na telefonie.

## Usunięcie publicznych podglądów ról — decyzja użytkownika 2026-11-02
Podglądy owner/employee/client usunięte z ekranu logowania i wyłączone w aplikacji. Tożsamość i rola panelu pochodzą wyłącznie z sesji. Stare adresy #/podglad/{rola}/{sekcja} przekierowują do #/panel/{sekcja}; bez sesji pokazują logowanie, a po logowaniu obowiązują uprawnienia rzeczywistej roli. Nie ma możliwości wyboru roli przez URL. Publiczny kreator kuchni na stronie marketingowej pozostaje odrębną funkcją.
2026-11-02 — decyzja użytkownika: strona publiczna nie pokazuje wejścia do logowania ani panelu w nagłówku i stopce, również po rozpoznaniu sesji. Bezpośrednie adresy #/logowanie i #/panel/... działają nadal; autoryzacja pozostaje bez zmian.

## Szkic zamówienia Mussi — 2026-11-02
Użytkownik wybrał szkic narzędzia teraz, rzeczywisty silnik wraz z wdrożeniem Mussi później. Purchasing i /api/v2/purchase-orders są tylko dla właściciela zgodnie z dotychczasową granicą finansów. PUT sprawdza wersję i rewizję źródłowego projektu; autor pochodzi z sesji. Brak SKU może pozostać w zapisanym szkicu, ale blokuje eksport; cena i indeks nie są zgadywane. Eksport wymaga zapisanej bieżącej wersji i potwierdza sent:false. Nie jest zleceniem rozkroju ani wysłaniem do dostawcy. useDraftGuard jest wspólną ochroną niezapisanych zmian w kreatorze i zamówieniach. Stan integracji jawnie opisuje zapisane:false po stronie obecnego Mussi; przycisk wysyłki jest nieaktywny i nie ma trasy sieciowej do składania realnych zamówień. Na błędzie szkic pozostaje w formularzu, odświeżenie list nie nadpisuje edytowanego dokumentu.

## Materiały części i eksport konstrukcji — 2026-11-02
Źródło: docs/KARTA-KONSTRUKCJI.md. Właściciel i aktywny pracownik uzupełniają dane wszystkich modeli. Braki nie blokują zapisu szkicu. Zmiana płaszczyzny resetuje usłojenie i krawędzie; wspólne Cofnij odtwarza je. Grubość jest wyliczana z geometrii. Eksport wymaga zapisanej zgodnej wersji, jest blokowany przy dirty i nigdy nie nadaje statusu produkcyjnego. Błąd pozostawia edytor. CRUD, Feedback, useDraftGuard, NumberField, natywne selecty i tokeny pozostają kanonicznymi właścicielami.

## Standardy i zestawienie części — 2026-11-02
Źródło: docs/STANDARDY-KONSTRUKCJI.md. Standard zapisany z modelem, ponowne użycie przez kopię biblioteki. Zmiana geometrii zachowuje ID i opisy; wyłączenie pleców usuwa wyłącznie generowane plecy. Braki i nieobsługiwane skosy nie stają się poprawną listą cięcia. Wymiar rdzenia wymaga jawnej konwencji wymiarowej. Własne płyty pozostają do indywidualnej edycji. Uprawnienia, wersje, Feedback i useDraftGuard bez zmian.

## Przypisanie systemu szuflady — 2026-11-02
Źródło: docs/SYSTEMY-SZUFLAD-KREATOR.md. Parametry są częścią modelu, obliczenia zamraża serwer przy zapisie. Otwieranie zapisanej wersji zachowuje migawkę, edycja przelicza szkic. Brak granicy komory nie uruchamia fallbacku do pełnej szerokości. Błąd zapisu zachowuje parametry. Zastąpienie frontów usuwa przypisania z obsługą Cofnij. Źródła profili nie stanowią dopuszczenia produkcyjnego. Wspólne uprawnienia, Feedback, useDraftGuard i request pozostają właścicielami zachowania.

Nowe układy wypełniają wysokość komory do pełnej półki/wieńca, z luzami 2 mm. Ręczna geometria frontu przełącza drawerFit na fixed, checkbox pozwala jawnie wrócić do fill. Starsze modele bez pola nie są przebudowywane przy odczycie. Tryb i własna liczba frontów zapisują się razem z modelem; Cofnij obejmuje oba. Źródło: docs/SZUFLADY-WYPELNIENIE.md.

## Propozycje do ustalania projektu — 2026-11-02
Źródło: docs/SUGEROWANE-UKLADY.md. Nowy model startuje automatycznie; zapisane modele bez suggestion nie są przebudowywane. Ręczne pozycje i wymiary zachowują się po zmianie gabarytów, usunięte sugestie nie wracają. Wariant i wykluczenia zapisują się z modelem. Zmiana wariantu zastępuje wnętrze i przypisania szuflad z obsługą Cofnij, bez dodatkowego potwierdzenia dla tej odwracalnej operacji. Nie zmienia to dostępu do biblioteki ani ról.

Komory są jawnym wariantem projektowania: uruchomienie zastępuje wnętrze zgodnie z opisem, Cofnij odtwarza model. Zależności i blokady są zapisywane oraz sprawdzane po stronie serwera. Niejednoznaczne stare modele nie są automatycznie konwertowane. Błędy blokad pozostają w formularzu do poprawy. Źródło: docs/KREATOR-KOMORY-I-PREZENTACJE.md.

Prezentacja klienta: tworzenie/lista/wycofanie tylko właściciel; publiczny odczyt i uwagi wyłącznie przez losowy, wygasający token konkretnej migawki. Brak dostępu do biblioteki, finansów i innych projektów. Uwagi nie oznaczają akceptacji. useResource, request i Feedback są właścicielami pobierania, ponawiania oraz anulowania starych odczytów. Kod QR etykiety wymaga sesji i zgodnej wersji; nie udostępnia modelu publicznie. Eksporty pozostają szkicem.

Widok 3D wybiera najbliższą widoczną płytę; przeciąganie obraca kamerę bez modyfikacji modelu. Przyciski kamery i lista płyt zapewniają obsługę klawiaturą. Przełączenie 2D/3D nie zapisuje i nie usuwa zmian. Brak WebGL i utrata kontekstu mają Feedback, ponowienie i dostępne przełączenie 2D. Renderowanie bez automatycznej animacji, zwolnienie zasobów po zamknięciu widoku. Źródło: docs/KREATOR-WIDOK-3D.md.

## Biurko — 2026-11-02
Źródło: docs/BIURKO-WYMIARY.md. Wybór wariantu stosuje jawne wymiary startowe i poziomy blat. Kolejna edycja gabarytów pozostaje możliwa; przywrócenie układu nie resetuje gabarytów. Presety są odwracalne wspólnym Cofnij. Serwer sprawdza obrys i brak pełnych pleców, zachowuje wersje oraz uprawnienia. Zalecenia ergonomiczne nie są dopuszczeniem produkcyjnym.

Szafki po jednej lub obu stronach mają wspólny wybór frontu; nadstawka osobną wysokość i głębokość. Zmiana frontu usuwa stare fronty i przypisania systemów z możliwością Cofnij. Zmiana strony ogranicza szerokość szafki, aby pozostawić sugerowane miejsce na nogi; kolejne ręczne wymiary są dozwolone z informacją o prześwicie. Zachowane role, zapis wersji, błędy, ochrona szkicu i ręczne korekty części. Źródło: docs/BIURKO-SZAFKI-NADSTAWKA.md.

## Dokumentacja skrócona i podgląd mebla
Domyślny skrót w ProjectDocuments to opcja formatu, nie nowa rewizja ani zatwierdzenie. Zmiana formatu usuwa poprzedni podgląd PDF. Zamrożone wydanie jest źródłem geometrii i operacji. Montaż nadal nie uzyskuje pełnych kart technicznych. Brak danych operacji jest jawnym brakiem; wybrane otwory zachowują status reguł i bazy pomiarowe.
Powiększenie kreatora zachowuje bieżący szkic i historię; Escape zamyka dialog, przywracając fokus. Szybkie pola i główny formularz współdzielą model.

## Edycja wymiaru na rysunku — 5.11.2026
Kliknięcie lub Enter/Spacja na wymiarze otwiera natywny dialog z polem mm. Zastosowanie działa jako jedna operacja historii; Anuluj/Escape zachowuje szkic, błąd zachowuje wpisaną wartość. Zamknięcie przywraca fokus do wymiaru. Niedopasowana blokada lub nowa kolizja nie modyfikuje modelu. Komora: Ustaw i zablokuj lub Przywróć wymiar automatyczny, zgodnie z istniejącą semantyką size.
Gotowe wyposażenie i kopiowanie są odwracalne przez Cofnij. Kopia zachowuje geometrię celu; systemów okuć nie dobiera automatycznie. Lista braków korzysta z istniejących obliczeń i nie oznacza kompletnej technologii produkcyjnej.

## Poglądowe kolory i wybór komór w 3D
Zmiana kolorów jest odwracalną zmianą szkicu i wymaga standardowego zapisu biblioteki. Poprzednie modele bez appearance zachowują dotychczasowe kolory. Zmiana nie wybiera materiału i nie wprowadza danych technologii. Utworzona wcześniej prezentacja zachowuje swoją zamrożoną wersję.
W trybie wyboru komór: ukryj fronty, wybierz kliknięciem lub natywnym selectem, następnie pokaż ustawienia. Brak układu komór oznacza wyłączony wybór z opisem następnego kroku. Po zmianie trybu można wrócić do zaznaczania płyt.

### Kompaktowy kreator
- Zakładki zachowują szkic, stan formularza i scenę 3D; nie uruchamiają zapisu.
- Boki przewijają się niezależnie od centralnego podglądu. Kontener wysokości należy wyłącznie do kreatora.
- Wybór płyty lub komory otwiera odpowiedni inspektor. Zakładka System dotyczy wybranego frontu szuflady.
- Materiały, Wnęka i skosy, Dokumentacja i Braki to natywne modale: Escape zamyka, fokus wraca do przycisku otwarcia. Akcja uzupełnienia braków zamyka modal i skupia pole części.
- Mobile przełącza obszar roboczy, zachowując projekt; krótkie okno dopuszcza naturalne przewijanie.

### Odzyskiwanie i wybór części
- Lokalna kopia: klucz wersjonowany według konta, walidacja wspólnym schematem API, jawne Przywróć/Odrzuć; zapis biblioteki pozostaje ręczny. Błąd pamięci nie blokuje edycji. Kopia nie jest synchronizacją między urządzeniami.
- Właściciel wielokrotnego wyboru: FurnitureParts compact (natywne checkboxy). Model jest źródłem geometrii; wybór i ustawienia widoczności nie należą do dokumentacji.
- Transformacje: transformFurnitureParts + wspólna historia Creator; bez mutacji wejścia, bez nowych przecięć obwiedni, ograniczenie 150 części. Operacje strukturalnych komór wykonuje dotychczasowy edytor komór.
- Kolizja: FurnitureReadiness wskazuje obie części, zamyka modal; edycja geometrii kasuje stare podświetlenie.
- Widok: przekrój i izolacja nie zapisują geometrii. Dane materiałowe nie są wyprowadzane z koloru ani zgadywane.
