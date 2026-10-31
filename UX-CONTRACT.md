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
