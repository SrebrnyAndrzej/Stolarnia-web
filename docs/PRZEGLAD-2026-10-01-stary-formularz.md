# R03 — opóźniony zapis projektu nadpisuje nowszą zmianę

01.10.2026. Priorytet P1 obecnie / warunek P0 przed uruchomieniem edycji zespołowej. Baza origin/main 87ba8a3, kod aplikacji bez nowych zmian względem poprzedniego przebiegu. Rozwinięcie hipotezy z RESEARCH-wspolpraca-zapis-scenariusze-2026-10-01.md: zachowanie potwierdzone w lokalnym API, nie badano produkcji ani interfejsu przeglądarki.

## Odtworzenie i wynik

Uruchomiono skompilowane src/server/app.ts z lokalnym serwerem udającym PostgREST. Atrapa przechowuje dane wyłącznie w pamięci i obsługuje warunek wersji PATCH tak jak dotychczasowy test magazynu. SUPABASE_URL wskazywał wyłącznie 127.0.0.1, klucz był fikcyjny. Żadne żądanie nie trafiło do Supabase/Vercel.

1. POST /api/projekty tworzy fikcyjny projekt z rewizją 1.
2. Dwa GET /api/projekty/:id reprezentują odczyt A i B tej samej rewizji.
3. A zapisuje nazwę przez PATCH, otrzymuje HTTP 200 i rewizję 2.
4. Dopiero po odpowiedzi A, B wysyła własną nazwę opartą na poprzednim odczycie. Dołączono też oczekiwanaRewizja=1 jako próbę jawnego oznaczenia starego stanu; takie pole nie jest obecnie obsługiwane przez kontrakt.
5. B otrzymuje HTTP 200, końcowy GET pokazuje nazwę B i rewizję 3. Brak konfliktu.

Wynik narzędzia: initialRevision=1, afterA=2, staleBStatus=200, finalRevision=3, staleOverwriteConfirmed=true. Dowód dotyczy endpointu zmiany nazwy; nie rozszerza automatycznie wyniku na wszystkie operacje konstrukcyjne. Lokalny skrypt odtworzenia zapisano poza repozytorium jako ../review-stale-form.mjs; powyższa sekwencja wystarcza do niezależnego odtworzenia. Nie dodawano logiki aplikacji.

## Przyczyna w kodzie

- src/server/app.ts:50 pobiera najnowszą bazę na początku każdego żądania. To potrzebne, lecz nie przenosi wersji widzianej wcześniej przez użytkownika.
- src/server/app.ts:137 przekazuje dane PATCH do zmienProjekt bez wymaganego warunku klienta.
- src/service.ts:338 przyjmuje pola projektu bez oczekiwanej wersji. Nowy zapis nadpisuje wskazane pole.
- src/store/store.ts:93 kontroluje wersję między pobraniem bazy a utrwaleniem tego żądania. Zapisy A/B wykonane kolejno przechodzą ten warunek poprawnie.

Dotychczasowy test chmury 1/1 nadal opisuje prawidłowo ochronę równoległych instancji; nie jest sprzeczny z R03. R03 narusza wymaganie Z02 i scenariusz 11 kreatora premium.

## Rekomendacja i kryteria dla Claude

Problem: cicha utrata nowszej wartości podczas opóźnionej edycji. Proponowane zachowanie: warunek wersji widzianej przez użytkownika, sprawdzany atomowo z zapisem. Zależności: kontrakt API/MCP, formularze, wersjonowanie wszystkich edytowanych pól oraz zachowanie lokalnego szkicu po konflikcie.

Opcja protokołu: [RFC 9110, If-Match, sekcja 13.1.1](https://www.rfc-editor.org/rfc/rfc9110.html#name-if-match), sprawdzone 01.10.2026, opisuje warunek używany m.in. przeciw utracie aktualizacji. Dla niespełnionego If-Match standard przewiduje 412 (z określonymi wyjątkami). Alternatywą projektową jest jawna rewizja w żądaniu i spójny błąd domenowy 409. Nie mieszać obu kontraktów bez dokumentacji. W obecnym modelu rewizja konstrukcji nie rośnie przy części zmian CRM; potrzebny osobny licznik obejmujący wszystkie chronione pola albo rozdzielone wersje zasobów.

Odbiór:

- Dokładnie powyższa sekwencja kończy się konfliktem zapisu B; nazwa A i jej rewizja pozostają bez zmian, szkic B nie znika.
- Zapis B oparty na świeżej wersji udaje się raz; brak warunku w edytującym kliencie nie obchodzi zabezpieczenia.
- Test dotyczy także pól CRM, które obecnie nie zwiększają rewizji konstrukcji. Nie używać do tego danych klientów.
- Zwykły odczyt nie zmienia wersji. Brak uprawnienia nie ujawnia danych aktualnego projektu w treści konfliktu.
- Przyszłe testy: utracona odpowiedź i ponowienie, dwa niezależne projekty, przywracanie stanu, operacje MCP. Nie uznawać tych przypadków za zweryfikowane tym testem.

## Punkt wznowienia

Sprawdzona rewizja 87ba8a3. Następny temat badawczy: wrócić do danych frontów i pleców Amix/GTV; R03 czeka na implementację Claude. Zachować także wcześniejsze priorytety produkcyjne i R01/R02 z przeglądu 30.09. Nie zmieniono cen, umów ani stanu produkcyjnego.
