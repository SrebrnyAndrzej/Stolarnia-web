# Ponowna weryfikacja granicy API i MCP przed kontami — 14.10.2026

**Baza:** świeżo pobrane `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3`. To aktualizacja stanu po wcześniejszych briefach `SECURITY-API-publiczna-przed-kontami-2026-10-04.md` i `RESEARCH-macierz-autoryzacji-tras-2026-10-05.md`; nie zastępuje ich planu testów.

## Wynik bieżącego sprawdzenia

W `src/server/app.ts` nadal nie znaleziono sesji, walidacji tokenu ani middleware autoryzacji przed rejestracją endpointów. W chmurowym trybie jedyny globalny middleware dla `/api` i `/mcp` tworzy kolejkę i ładuje dane magazynu do instancji. Sama kolejka serializująca żądania nie kontroluje tożsamości ani uprawnienia.

`vercel.json` nadal kieruje `/api/:sciezka*` oraz `/mcp` do `api/index.js`. Wykaz tras w `app.ts` obejmuje operacje zapisu, usunięcia, CAD, projekty, umowy, wydania i eksporty. `POST /mcp` tworzy bezstanowy `StreamableHTTPServerTransport`. W repozytorium kod korzysta z serwerowego `SUPABASE_SECRET_KEY`; nie znaleziono ścieżki logowania sesji HTTP przed użyciem tych tras. Wyszukanie `Authorization`/`Bearer`/JWT w `src/server`, `src/mcp` i `src/store` znalazło jedynie opcjonalne ustawienie nagłówka Supabase dla klucza, który sam zaczyna się od `eyJ`; nie jest to uwierzytelnienie użytkownika aplikacji.

Główny kod funkcji nie zmienił się od rewizji produktu `537cdc0`; późniejsze wpisy `main` są dokumentacją. Stan potwierdza więc, że poprzednia rekomendacja P0 pozostaje aktualna w kodzie.

## Ocena ryzyka i granice dowodu

- **Fakt:** w tej rewizji repo nie ma kontroli sesji/ACL w warstwie Express/MCP przed trasami. Sekret Supabase jest używany serwerowo, więc same granty RLS dla klienta nie zastępują uprawnień w tych endpointach.
- **Warunek:** ryzyko anonimowego dostępu rzeczywistych danych zależy od zewnętrznej ochrony konfiguracji Vercel/proxy. Nie sprawdzono ustawień projektu ani dostępności hosta; nie wysyłano żądań do produkcji. Nie wolno z samego braku middleware wyciągać wniosku, że ktoś uzyskał dostęp.
- **Status:** P0 — właściciel powinien potwierdzić ochronę wdrożenia przed dalszym używaniem prawdziwych danych lub otwieraniem dostępu. To działanie konfiguracyjne nie wymaga zmiany umów ani ceny.

## Konkretne kryterium zamknięcia dla Claude / właściciela

1. Właściciel zapisuje w zatwierdzonym miejscu konfiguracji, czy production i preview są ograniczone do uprawnionych osób; żadnych sekretów/tokens nie dodawać do repo ani raportu.
2. Jeśli hosting zapewnia wymaganą ochronę, udokumentować zakres: domena production, deployment previews, `/api/*` i `/mcp`; anonimowy dostęp do aplikacji i danych jest odmówiony. Potwierdzić przez administratora ustawień i staging lub bezpieczny test nieprodukcyjny, bez używania danych klienta.
3. Jeśli host jest publiczny, ograniczyć go do czasu wdrożenia uwierzytelniania i autoryzacji po stronie serwera. Właściwe zamknięcie funkcji w kodzie wymaga 100% tras pokrytych macierzą rola × zasób × czynność; anonimowe i cross-workshop przypadki dla REST, eksportów oraz MCP kończą się odmową bez zmiany stanu.
4. Po wdrożeniu uruchomić testy na syntetycznej bazie: anonimowy / warsztat A / warsztat B, zasoby potomne z podmienionymi ID, eksporty/PDF/CSV i MCP. Potwierdzić brak cache prywatnych odpowiedzi. Nie wykonywać skanów obciążeniowych ani negatywnych prób na produkcji.

**Zależności:** decyzja właściciela o polityce dostępu, model członkostwa/warsztatu, zaufany issuer/sposób weryfikacji sesji, wspólne object-level checks w usługach oraz kompletna macierz tras. **Priorytet:** P0 przed danymi rzeczywistymi; P1 przed współpracą wielu pracowników.

## Następny krok

Po dodaniu Claude warstwy logowania albo po potwierdzeniu konfiguracji hostingu powtórzyć kontrolę na nowej rewizji. Jeśli kod pozostanie bez zmian, kolejny research powinien sprawdzić konkretny obszar wykonania produkcji (T14: identyfikacja części i operacji) na niezależnym fixture zsyntetyzowanym, a nie ponawiać skanowanie produkcji.
