# Potwierdzanie trwałego zapisu w REST i MCP

Data: 2026-10-09  
Baza przeglądu: `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3`  
Zakres: statyczna analiza cyklu odpowiedzi przy błędzie utrwalania; bez wywołań produkcyjnych i bez zmian logiki.

## Ustalenie

W trybie chmurowym middleware w `src/server/app.ts` podmienia `res.end()`, aby przed zakończeniem odpowiedzi wykonać `s.magazyn.utrwal()`. Gdy obietnica zapisu odrzuci się, kod zapisuje `console.error("Nie zapisano zmian w bazie:", e)`, po czym mimo to wywołuje oryginalne `end(...args)` z dotychczasowym statusem i treścią odpowiedzi. Ten fallback nie zmienia odpowiedzi na błąd.

Istnieją mutujące ścieżki, które nie używają wrappera `api()` z jawnym `await utrwal()` przed odpowiedzią. Przykład REST: `POST /api/projekty/:id/import-cad` wywołuje `s.importujDxf(...)`, a następnie `res.json(...)`. Żądanie jest objęte middleware, więc błąd zapisu przechodzi przez fallback `res.end()` i może pozostawić klienta z odpowiedzią sukcesu mimo niepotwierdzonego zapisu. MCP `POST /mcp` obsługuje żądanie przez transport SDK, również pod tym middleware; wynik mutującego narzędzia może podlegać temu samemu cyklowi. Konkretny typ odpowiedzi SDK i zachowanie przy każdym błędzie trzeba potwierdzić testem integracyjnym.

To różni się od zwykłych tras `api()`, gdzie zapis jest oczekiwany przed `res.send()`. Nie ustaliłem, czy błąd zawsze oznacza brak trwałej zmiany (np. timeout może pozostawić niejednoznaczny wynik), ani czy którakolwiek z tych ścieżek zawiodła w produkcji. Jest to potwierdzona ścieżka kodu, nie potwierdzony incydent.

## Problem dla warsztatu

Użytkownik może zobaczyć „zapisano” lub poprawny wynik importu/narzędzia, a po odświeżeniu nie znaleźć wprowadzonych zmian. Powtórzenie operacji po takim wyniku może ją wykonać drugi raz. Ma to znaczenie dla importu CAD, zmian projektu i mutacji MCP, gdzie pozorny sukces podważa zaufanie do dokumentacji i stanu zlecenia.

## Dowody i źródła

- `src/server/app.ts`: middleware magazynu chmurowego zastępuje `res.end`; w gałęzi odrzucenia zapisu loguje błąd i kończy odpowiedź pierwotnymi argumentami. `POST /api/projekty/:id/import-cad` nie jest opakowany w `api()` i wysyła wynik po synchronicznej mutacji.
- `src/store/store.ts`: `utrwal()` odrzuca błędy `fetch`/Supabase oraz `KonfliktZapisu`, więc gałąź odrzucenia middleware jest osiągalna przy błędzie zależności albo konflikcie wersji.
- [RFC 9110, §15](https://www.rfc-editor.org/rfc/rfc9110.html#section-15): klasa 2xx oznacza, że żądanie zostało pomyślnie odebrane, zrozumiane i zaakceptowane; serwerowy brak potwierdzenia zapisu nie powinien być reprezentowany jako potwierdzony sukces.
- [AWS Well-Architected — make all responses idempotent](https://docs.aws.amazon.com/wellarchitected/2024-06-27/framework/rel_prevent_interaction_failure_idempotent.html): przy niepewności połączenia ponowienie może powtórzyć działanie; token idempotencji pozwala zwrócić rezultat tej samej operacji. Źródło jest ogólną praktyką architektoniczną, nie specyfikacją wymagającą użycia AWS.
- [Express 4 response API](https://expressjs.com/en/4x/api/response/): `res.end()` kończy odpowiedź; `res.json()`/`res.send()` korzystają z obiektu odpowiedzi Express. Dokładna kolejność i zachowanie obecnego patcha trzeba pokryć testem wersji używanej w repozytorium.

## Zalecenia dla Claude

**P0 — potwierdzenie zapisu przed sukcesem:** usuń zależność od asynchronicznego patchowania `res.end()` jako granicy trwałości. Każda mutacja REST i MCP powinna zaczekać na wynik zapisu i dopiero potem zwrócić rezultat sukcesu. Przy błędzie zapisu zakończyć odpowiedź bez 2xx i z bezpiecznym błędem/identyfikatorem zdarzenia. Jeżeli nagłówki lub część odpowiedzi zostały już wysłane, nie udawać, że można zmienić status; zapisać zdarzenie i zaprojektować protokół tak, by klient mógł sprawdzić wynik operacji.

**P0 — jedna ścieżka kontraktu:** rozróżnić potwierdzone zatwierdzenie, odrzucony konflikt i niejednoznaczny timeout. Nie oznaczać mutacji jako zapisanej, jeśli `utrwal()` nie potwierdził aktualizacji. Utrzymać wcześniejsze zalecenie o idempotency key dla mutacji, gdzie utrata odpowiedzi po udanym zapisie może wywołać ponowienie.

**P1 — bezpieczne zachowanie UI/MCP:** REST ma pokazywać zapis jako zakończony dopiero po odpowiedzi potwierdzającej trwałość. MCP ma zwrócić wynik błędny przy odmowie zapisu, a nie treść sugerującą powodzenie. Szczegóły techniczne pozostawić w zredagowanym logu skorelowanym z request ID, według `docs/RESEARCH-komunikaty-bledow-API-MCP-2026-10-09.md`.

## Kryteria odbioru

1. Test integracyjny na atrapie PostgREST powoduje odrzucenie `PATCH` po wywołaniu importu CAD. Trasa nie odpowiada 2xx ani payloadem „import zakończony”; odświeżony magazyn nie zawiera importu.
2. Analogiczny test dla mutującego narzędzia MCP potwierdza, że nieudane utrwalenie daje wynik błędny protokołu bez komunikatu sukcesu. Pokryć również konflikt wersji i timeout.
3. Test zwykłej trasy opakowanej w `api()` potwierdza, że sukces następuje dopiero po `utrwal()`, a błąd zapisu nie jest maskowany ponowną próbą podczas wysyłania odpowiedzi błędnej.
4. Test udanego PATCH potwierdza jedno zatwierdzenie i zgodność wyniku zwracanego z zatwierdzonym stanem.
5. Dla timeoutu po możliwym zatwierdzeniu klient dostaje wynik „nieznany/zweryfikuj” albo może odczytać rezultat pod stabilnym ID operacji; retry nie tworzy drugiej mutacji.
6. W logach przy błędzie nie ma body Supabase ani danych projektu; zdarzenie ma correlation ID i bezpieczną kategorię błędu.

## Priorytet i zależności

**P0:** nie zwracać sukcesu mutacji przed potwierdzonym zapisem, szczególnie w ścieżkach omijających `api()`. Zależności: istniejące auth/ACL, bezpieczny kontrakt błędów oraz decyzja o obsłudze konfliktów; auth ogranicza dostęp, ale nie usuwa problemu fałszywego sukcesu.

**P1:** trwałe rozpoznawanie rezultatu i idempotencja przy timeoutach/utracie odpowiedzi. Zależność: transakcyjny rejestr kluczy operacji lub równoważny mechanizm atomowy, jak opisano w briefie archiwum ofert i umów.

Miernik: żadna mutacja nie daje odpowiedzi 2xx przed potwierdzeniem zapisu; 100% scenariuszy odmowy/conflict/timeout testowanych dla REST i MCP nie jest przedstawiane jako pewny sukces.

## Ograniczenia

Statyczna analiza gałęzi `res.end()` i tras. Nie wykonano testów runtime, nie sprawdzono semantyki wszystkich odpowiedzi MCP SDK, wdrożenia Vercel ani awarii produkcyjnych. Wystąpienie utraty danych lub odpowiedzi 2xx na żywo pozostaje niezweryfikowane.

## Powiązane materiały

- `docs/RESEARCH-komunikaty-bledow-API-MCP-2026-10-09.md` — redakcja błędów REST/MCP.
- `docs/RESEARCH-archiwum-ofert-i-umow-PDF-2026-10-06.md` — idempotencja operacji przy retry.
- `docs/RESEARCH-wspolpraca-zapis-scenariusze-2026-10-01.md` — konflikty współbieżnych zapisów.
