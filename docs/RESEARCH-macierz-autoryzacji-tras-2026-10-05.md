# Macierz autoryzacji tras REST i MCP

Data: 2026-10-05  
Baza przeglądu: `55853865e51d35ff65a2b089aa83ce03db3c95e5` (`origin/main`)  
Zakres: statyczny przegląd `src/server/app.ts`; nie badano wdrożenia ani nie wykonywano żądań do środowiska produkcyjnego.

## Cel

Uzupełnienie briefu `SECURITY-API-publiczna-przed-kontami-2026-10-04.md`. Po dodaniu logowania nadal trzeba wykazać, że każdy endpoint sprawdza jednocześnie tożsamość, warsztat, obiekt i czynność. Trasy są dziś rozproszone w `app.ts`; eksporty plików, statyczne zasoby i MCP nie zawsze przechodzą przez ten sam wrapper `api()`. Macierz jest kontraktem przeglądu i testów, nie potwierdzeniem wdrożonej ochrony ani ostateczną polityką biznesową.

## Powierzchnie i granice zaufania

| Powierzchnia | Przykłady z repozytorium | Wymagana kontrola |
|---|---|---|
| Katalogi odczytu i obrazy | `GET /api/okucia-katalog`, `/api/dekory`, `/api/katalog`, `/api/systemy-szuflad`, `/api/przelicznik-szuflad`, `/api/cad/konwerter`, `/api/okucia-katalog/obrazy/*`, `/api/dekory/obrazy/*` | Właściciel produktu musi jawnie zatwierdzić, które dane mogą być publiczne i na jakiej podstawie/licencji. Nie zakładać, że katalog jest publiczny: odpowiedź pełnego katalogu okuć może zawierać dane handlowe. Jeżeli publiczny, zwracać wyłącznie zatwierdzony, minimalny zbiór statyczny. |
| Dane i konfiguracja warsztatu | `GET/POST/PUT /api/materialy`, `/api/cennik/materialow`, `/api/okucia`, `/api/ustawienia`; `POST /api/dekory/:key/material`, `/api/okucia-katalog/:id/dodaj` | Odczyt wymaga aktywnego członkostwa w warsztacie. Zapis cen, ustawień i katalogu warsztatu wymaga właściciela lub odrębnego uprawnienia. Nie ufać cenie ani identyfikatorowi z klienta bez walidacji. |
| Projekty i operacje robocze | `/api/projekty`, `/api/projekty/:id`, notatki, duplikowanie, pomieszczenia, ściany, moduły, luka, stan, polecenia konstrukcji, analiza, CAD | Lista i odczyt tylko w dozwolonym warsztacie/projekcie. Każda operacja na `:id`, `:pid`, `:sid`, `:mid` rozwiązuje rodzica, potwierdza jego warsztat i uprawnienie do czynności; nie dopuszczać do podmiany identyfikatora potomka w projekcie innego użytkownika. Zmiany konstrukcji/import CAD przypisać członkowi i zakresowi projektu. |
| Dokumenty i dane handlowe | `/umowy`, `/umowy/:uid/pdf`, `/wydania`, `/wydania/:wid/dokumentacja(.pdf)`, `/dokumentacja(.pdf)`, `/szkice(.pdf)`, `/oferta.pdf`, `/formatki.csv` | Takie same kontrole projektu dla metadanych i pliku. Uprawnienia mogą rozróżniać podgląd, generowanie, eksport i umowy. Ustawiać `Cache-Control: no-store` na prywatnych odpowiedziach; testować również pamięć podręczną proxy. Hash/ID pliku nie jest tokenem dostępu. |
| MCP po HTTP | `POST /mcp` oraz narzędzia utworzone przez `utworzSerwerMcp(s)` | Uwierzytelnić połączenie/żądanie, stosować ten sam tenant/object/function check co REST dla każdego narzędzia. Nie uznawać nazwy narzędzia, promptu ani argumentów MCP za rolę. Testować transport HTTP oddzielnie. |
| MCP lokalne stdio | Uruchomienie lokalnego procesu, jeśli jest skonfigurowane | Inna granica zaufania niż publiczne `/mcp`: dostęp ogranicza użytkownik systemu operacyjnego/procesu. Opisać bezpieczne uruchomienie, sekrety procesu i ryzyko współdzielenia komputera; nie przenosić założeń HTTP automatycznie. |

## Wstępna polityka do zatwierdzenia przez właściciela

- **Właściciel warsztatu:** zarządzanie członkami, rolami, cennikami, ustawieniami i katalogiem warsztatu; dostęp do projektów warsztatu i czynności administracyjnych.
- **Pracownik:** dostęp do przypisanych projektów i zadań, zgodnie z rolą. Oddzielne uprawnienia dla konstrukcji, ofert/klientów, dokumentacji produkcyjnej, umów, eksportów i usuwania.
- **Anonimowy:** brak dostępu do danych warsztatu, projektu, klienta, umowy, eksportu i operacji zapisu. Publiczne katalogi tylko po formalnym zatwierdzeniu zakresu i licencji.

To szkic uprawnień, nie decyzja o tym, które stanowiska pracownicze mogą widzieć ceny, umowy lub dokumentację. Zanim wdrożenie ustali role, utworzyć tabelę rola × zasób × czynność zaakceptowaną właścicielem. Brak/nieaktualność członkostwa, warsztatu lub projektu oznacza odmowę (`401/403`, a dla nieistniejącego/obcego obiektu można stosować jednolite `404`, by nie ujawniać jego istnienia).

## Testy akceptacyjne dla Claude

1. Zbudować rejestr wszystkich metod i tras z `app.ts`, w tym tras plikowych/statycznych, fallbacków oraz MCP; do każdej wskazać wymagane uprawnienie i właściciela kontroli.
2. Test macierzowy anonimowy / właściciel warsztatu A / pracownik A przypisany / pracownik A nieprzypisany / użytkownik warsztatu B: odczyt, zapis, kasowanie, eksport i wywołanie narzędzia. Dla każdego ID podmienić `id`, `uid`, `wid`, `pid`, `sid` i `mid` na identyfikator z obcego projektu.
3. Wykonać testy bezpośrednio na wszystkich rodzinach tras, nie tylko ścieżce interfejsu. Objąć prawidłową i błędną metodę HTTP, nieznaną trasę `/api`, REST i MCP; żadna alternatywna metoda nie może ominąć kontroli funkcji.
4. Każdy eksport PDF/CSV, oferta, umowa, szkic, dokumentacja wydania i formatki musi odmawiać dostępu przed generacją. Test potwierdza brak danych w treści i nagłówkach oraz `Cache-Control: no-store`.
5. Testy publicznego katalogu są jawnie allowlistowane. Zmiana z publicznego GET na zapis/nową metodę wymaga odmowy, chyba że konkretną funkcję zatwierdzono w macierzy.
6. Zmiana członkostwa/odebranie dostępu unieważnia kolejne żądanie po stronie serwera. Nie polegać na starym klienckim stanie, długowiecznej roli w tokenie ani cache kanału realtime.
7. Weryfikować rolę i członkostwo ponownie na serwerze przy każdej operacji; logować wynik autoryzacji bez tokenów, sekretów i pełnych danych klienta.
8. Błędy `401/403/404` nie ujawniają, czy cudzy projekt, umowa ani plik istnieją; odrzucone żądanie nie zmienia danych ani numeru rewizji.

## Priorytet, zależności i mierniki

**P0 przed użyciem z prawdziwymi danymi:** auth middleware dla REST i HTTP MCP, aktywne członkostwo/warsztat, object-level check we wspólnej warstwie usługowej, deny-by-default oraz ochrona bezpośrednich eksportów. Zależności: model warsztatu/członkostwa, serwerowa weryfikacja sesji, tabela uprawnień zatwierdzona przez właściciela.

**P1 przed szerszym wdrożeniem pracowniczym:** komplet testów dla wszystkich tras i zasobów potomnych, audyt odmów/działań, prywatne cache headers, procedura unieważnienia sesji/kanałów. Zależności: model ról i przydziału projektów.

**Mierzalny odbiór:** 100% zarejestrowanych tras oznaczonych public/auth + zasób + czynność + rola; wszystkie testy negatywne dla anonimowego i obcego warsztatu przechodzą dla każdej rodziny tras; brak nieautoryzowanych zmian w stanie; eksporty prywatne nie są cachowane; HTTP MCP pokryty tym samym zestawem przypadków. Testy generować z rejestru tras lub utrzymywać taką listę tak, aby nowa trasa bez polityki powodowała błąd CI.

## Ograniczenia ustalenia

To statyczny przegląd kodu w konkretnej rewizji. Nie dowodzi dostępności endpointów w produkcji ani wykorzystania podatności. Wdrożenie Vercel i konfiguracja Supabase pozostają niezweryfikowane. Nie sprawdzano uprawnień/licencji do publicznego udostępniania katalogów producentów.

## Źródła

- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html — odmowa domyślna, najmniejsze uprawnienia, sprawdzanie każdego żądania.
- OWASP API1:2023 Broken Object Level Authorization: https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/ — kontrola dostępu do każdego obiektu wskazanego przez identyfikator.
- OWASP API5:2023 Broken Function Level Authorization: https://api-security.owasp.org/editions/2023/en/0xa5-broken-function-level-authorization/ — wymuszanie uprawnień funkcji administracyjnych niezależnie od ścieżki i metody.
- Repozytorium: `src/server/app.ts` (trasy i ich różne handlery), `src/mcp/server.ts` (narzędzia MCP), `src/service.ts` (operacje domenowe), `vercel.json` (routing funkcji). Baza porównania: commit podany na początku.
