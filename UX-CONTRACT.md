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

Źródło: użytkownik dostarczył „Kuchnia-Darii-animacja.mp4” jako animację otwierającą i wcześniej zlecił sterowanie przejazdem podczas scrollowania. Kanoniczny komponent: `v2/HomeIntro.tsx`. Scroll jest natywny; film nie przechwytuje wheel/touchmove ani klawiszy. Pauza zatrzymuje zmianę kadru, a nie stronę. Ograniczenie ruchu i danych nie pobiera MP4 bez opt-in. Awaria zachowuje obraz i CTA. Testy: `tests/v2/home-animation.spec.ts`.

Doprecyzowanie intro: film jest tłem całego hero, a tekst pojawia się wraz z postępem przewijania. Przyciski pozostają dostępne; fokus klawiatury odsłania tekst, a reduced-motion i awaria pokazują go od razu. Kadrowanie cover jest celowe na wszystkich ekranach.

## Publiczne materiały projektowe

Na zlecenie użytkownika dodano pokaz składania i rendery z zapisanych projektów. `ProjectMedia.tsx` pobiera wyłącznie publiczne pliki statyczne; nie udostępnia API prywatnych projektów. Film 8 s uruchamiany ręcznie, bez autoplay i audio; natywne sterowanie przeglądarki oraz poster przy błędzie. Trzy neutralnie podpisane widoki mają status renderów geometrii i poglądowych kolorów. Nie stanowią zatwierdzenia do produkcji ani zdjęć realizacji. Testy: tests/v2/project-media.spec.ts.
