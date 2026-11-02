> Aktualizacja 31.10.2026: film hero zastąpiony dostarczoną wersją Kuchnia-Darii-animacja-v2.mp4 (14 s). Sterowanie i wygładzanie scrolla pozostają bez zmian. Rendery i nową animację składania przygotowuje Claude. Wcześniejsze prototypy Codex wycofano z publikowanej strony i zachowano w lokalnym archiwum; poniższe wzmianki o ich wdrożeniu są historyczne. Codex odpowiada za układ i treści.

# Pan Stolarz 2.0 — kontrakt interfejsu

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
