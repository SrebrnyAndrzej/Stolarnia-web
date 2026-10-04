# Prywatność, dostęp i cykl życia danych klienta — wymagania produktu

Data: 2026-10-04
Baza kodu: `849c6094b35d0b4aec31c7360595160387c8c1f6`
Zakres: przegląd statyczny kodu i źródeł prawnych; nie jest to porada prawna ani potwierdzenie zgodności konkretnej firmy.

## Ustalenia z kodu

- Model projektu zawiera dane klienta i notatki robocze; umowa utrwala osobno kopię danych kontraktowych. Są one przechowywane razem z projektami w głównym dokumencie JSON (`src/store/store.ts`, `src/core/contracts.ts`).
- `DELETE /api/projekty/:id` usuwa projekt z bieżącej bazy. Nie znaleziono osobnego eksportu danych klienta, procesu retencji/anonimizacji ani opisu skutków dla kopii zapasowych.
- PDF umowy ustawia `Cache-Control: no-store`. Trasy PDF dokumentacji, szkiców, ofert i CSV nie ustawiają jawnie tego nagłówka w `src/server/app.ts`; zachowanie infrastruktury pośredniej nie było badane. Nie twierdzę, że są obecnie buforowane — brak jawnej polityki w tym kodzie uzasadnia test.
- Domena produkcyjna/API nadal wymaga potwierdzenia ochrony z poprzedniej notatki P0. Żądania o dane i dokumenty muszą być autoryzowane przed obsługą i generowaniem pliku.

## Źródłowe zasady, bez narzucania okresów przechowywania

RODO wymaga ograniczenia danych do niezbędnych celów, ograniczenia okresu przechowywania, poufności i integralności (art. 5). Ochrona danych ma być uwzględniona projektowo i domyślnie (art. 25), a bezpieczeństwo dobrane do ryzyka (art. 32). Prawo do usunięcia ma określone przesłanki i wyjątki — nie oznacza bezwarunkowego kasowania każdej umowy ani ustawienia jednego okresu dla wszystkich danych (art. 17). Konkretne podstawy, terminy retencji dokumentów księgowych/umów, role administratora i proces obsługi żądań musi ustalić właściciel z odpowiednim doradcą. Nie zapisuję w tej notatce arbitralnych terminów.

## Proponowane zachowanie i priorytety

**P0 — przed danymi produkcyjnymi:** zakończyć zabezpieczenie dostępu opisane w `docs/SECURITY-API-publiczna-przed-kontami-2026-10-04.md`. Chronić każdy projekt, umowę i eksport w API oraz MCP kontrolą sesji i członkostwa; brak dostępu nie może ujawniać nawet istnienia zasobu. Wymaganie dotyczy również prywatnych plików generowanych na żądanie.

**P1 — decyzja właściciela:** zdefiniować kategorie danych (lead/roboczy projekt, aktywne zamówienie, umowa, dokument księgowy, eksport techniczny, log) i cel każdego pola; ustalić osobno reguły retencji, archiwizacji i usunięcia, w tym wyjątków wynikających z obowiązków prawnych. Udokumentować, kto zatwierdza i wykonuje żądanie klienta.

**P1 — workflow danych:** zapewnić autoryzowany eksport danych klienta/projektu w przenośnym formacie oraz ewidencję obsługi żądań dostępu, sprostowania, ograniczenia i usunięcia. Usunięcie wymaga jawnego potwierdzenia, zakresu i audytu wykonawcy; gdy część umowy musi być zachowana, system powinien umożliwiać odseparowanie/ograniczenie dalszego użycia zamiast obiecywać pełne usunięcie.

**P1 — retencja i kopie:** usunięcie z aktywnego rekordu nie oznacza natychmiastowego usunięcia z backupów. Określić i ujawnić okno rotacji kopii oraz procedurę ponownego zastosowania usunięć po odtworzeniu backupu. Nie uruchamiać automatycznego kasowania, dopóki właściciel nie zatwierdzi tabeli retencji i wyjątków.

**P1 — eksporty i cache:** ustawić jawne `Cache-Control: no-store` dla prywatnych odpowiedzi API i generowanych PDF/CSV/DXF, chyba że konkretna trasa ma uzasadnione inne zachowanie. Sprawdzić też cache przeglądarki, CDN i nagłówki Vercel; nie opierać się na domyślnym zachowaniu. Umowy i dokumentacja nie mogą trafiać do publicznego cache ani być dostępne przez nieograniczony, stały link.

**P2 — minimalizacja i audyt:** logować aktora, czas, typ czynności i identyfikator zasobu dla odczytu/eksportu/usunięcia, ale nigdy tokeny, sekrety ani pełną treść umowy/notatek. Ograniczać pola osobowe w listach i widokach do tych potrzebnych dla zadania. Dane testowe powinny być fikcyjne.

## Zależności i mierzalne kryteria odbioru

Zależności: wprowadzenie tożsamości/ACL i zabezpieczenie tras; właściciel zatwierdza cele, retencję oraz wyjątki; przegląd prawny procesu umów i dokumentów; decyzja, czy/które zasoby trafią do Supabase Storage.

1. Nieautoryzowany użytkownik otrzymuje odmowę dla JSON projektu, listy/treści umów, dokumentacji PDF, szkiców, oferty, CSV, CAD i MCP.
2. Użytkownik jednego warsztatu nie może eksportować danych innego; testy obejmują zmienione identyfikatory w URL oraz identyfikatory umowy i wydania.
3. Dla prywatnych endpointów odpowiedzi zawierają `Cache-Control: no-store`; test integracyjny sprawdza nagłówki na odpowiedziach JSON i każdej trasie plikowej, a inspekcja konfiguracji CDN potwierdza brak cache.
4. Istnieje zatwierdzona przez właściciela tabela: kategoria danych → cel → retencja/zdarzenie kończące cel → wyjątek/hold → zachowanie w kopii → odpowiedzialna rola. Nie wypełniać jej domyślnymi terminami Codexa.
5. Próba eksportu, usunięcia oraz odtworzenia po usunięciu jest sprawdzona w środowisku testowym; odtworzenie nie przywraca po cichu rekordu objętego zakończonym żądaniem usunięcia — albo jawnie uruchamia procedurę ponownego zastosowania żądań.
6. Dzienniki audytu nie zawierają pełnych danych klienta, treści umów, tokenów ani kluczy; eksport jest widoczny jako osobna czynność.

## Źródła

- Rozporządzenie (UE) 2016/679, EUR-Lex — art. 5, 17, 25, 28, 30 i 32: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- UODO — zgłaszanie naruszeń i obowiązki po incydencie (materiał urzędu): https://uodo.gov.pl/pl/525/2584
- Wymagania aplikacji co do logowania i autoryzacji: `docs/SECURITY-API-publiczna-przed-kontami-2026-10-04.md`.

Ten brief nie zmienia umów, nie określa terminów ustawowych i nie stwierdza naruszenia. Jest wymaganiem produktowym do zatwierdzenia przez właściciela i konsultacji prawnej.
