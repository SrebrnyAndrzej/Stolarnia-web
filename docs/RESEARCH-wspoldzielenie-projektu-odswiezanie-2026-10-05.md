# Odświeżanie współdzielonych projektów bez pełnego odpytywania

Data: 2026-10-05
Baza kodu: `20bde90b09abbe279b77c19f3c8b81af8c98ab69`
Zakres: przegląd ścieżki odświeżania i aktualnej dokumentacji Supabase; bez pomiaru produkcyjnego.

## Problem potwierdzony w repozytorium

`web/src/App.tsx` odpyta `api.analiza(id)` od razu, a następnie co 4 sekundy w każdej widocznej karcie projektu (`setInterval`, linie 77–84). To 15 pełnych pobrań i analiz na minutę na jedną otwartą kartę, niezależnie od tego, czy projekt się zmienił. Przy N aktywnych kartach liczba wynosi 15N/minutę; np. 10 kart to 150 pełnych analiz/min (obliczenie z interwału, nie wynik benchmarku).

Każde żądanie `/api` i `/mcp` trafia do wspólnej kolejki w `src/server/app.ts`; middleware pobiera rekord przed obsługą każdego żądania (`s.magazyn.zaladuj()`). `src/store/store.ts` za każdym razem pobiera całą kolumnę `dane` jednego rekordu JSONB. Trasa `/api/projekty/:id/analiza` uruchamia budowę modułów, formatki, rozkrój, kalkulację ceny i walidację (`src/service.ts:781+`). Zmiana state nie jest potrzebna, aby ponieść ten koszt. Powolne żądanie w jednej instancji blokuje następujące żądania tej instancji do czasu końca odpowiedzi; Vercel może uruchamiać wiele instancji, więc ta kolejka nie jest globalnym lockiem.

Wynik: rosną niepotrzebne transfery, odczyty bazy, obliczenia i kolejki; sprawdzanie współdzielonej zmiany jest powiązane z ponownym liczeniem pełnego silnika.

## Źródła i wybór techniki

Dokumentacja Supabase wskazuje Broadcast jako rekomendowaną metodę powiadomień o zmianach pod kątem skalowalności i bezpieczeństwa; Postgres Changes jest prostsze, ale skaluje się gorzej. Przy Postgres Changes dostęp każdego subskrybenta jest sprawdzany przy zdarzeniu, a przetwarzanie zachowujące kolejność odbywa się jednowątkowo. Dla prywatnego Broadcast wymagane są kanały prywatne i polityki autoryzacyjne. Nie oznacza to, że należy przesyłać przez kanał pełny rekord.

**Propozycja — P1, po autoryzacji P0 i rozdzieleniu zakresu warsztatów/projektów:** zastąpić okresowe pełne `/analiza` lekkim unieważnieniem: kanał prywatny dla warsztatu/projektu emituje jedynie typ zdarzenia i monotoniczny numer/rewizję. Po powiadomieniu klient pobiera tylko potrzebny stan przez API, które ponownie sprawdza członkostwo i uprawnienia. Nie wysyłać klienta, umowy, notatek, kosztorysu ani całego projektu w evencie. Rozważyć bazodanowy Broadcast/event-outbox; wybrać po teście na rzeczywistym schemacie.

**Zależności:** autoryzacja JWT i tenant membership; prywatne kanały z RLS; zdarzenia zapisywane transakcyjnie; odrębne revisions/event sequence; model ograniczony do warsztatu/projektu (obecny singleton JSON utrudnia izolację); fallback po rozłączeniu.

**Ważne ograniczenie cofania dostępu:** dokumentacja Supabase informuje, że polityka kanału jest cache’owana dla czasu połączenia. Odebranie członkostwa nie musi samo w sobie zakończyć istniejącego subskrybowania, dopóki JWT nie wygaśnie lub nie zostanie odświeżony. Wymagana jest jawna strategia: revoke/disconnect kanału, wymuszone odświeżenie autoryzacji albo krótki, zmierzony czas życia JWT wraz z twardym odcięciem; test musi mierzyć realny czas odebrania dostępu. Realtime jest kanałem wskazującym zmianę, nie źródłem autoryzacji odczytu.

## Kryteria odbioru

1. Po początkowym pobraniu i otwarciu konkretnej zakładki, widoczny bezczynny projekt nie wykonuje cyklicznego pełnego `/analiza`, gdy subskrypcja działa. Potwierdzić w logu sieci przeglądarki i licznikach bazy.
2. Dla 10 równoczesnych, bezczynnych kart liczba pełnych analiz spada z obecnego teoretycznego poziomu 150/min do zera po bootstrapie; reconnect/backoff nie przekracza uzgodnionego limitu.
3. Po zapisie nowa rewizja dociera do uprawnionych współpracowników w docelowym p95 (proponowany punkt startu: ≤2 s; hipoteza do potwierdzenia z benchmarkiem), a klient pobiera szczegóły dopiero po zdarzeniu.
4. Użytkownicy innych warsztatów nie otrzymują nawet identyfikatora ani wzmianki o projekcie; payload Broadcast nie zawiera PII, cen, notatek, umowy ani geometrii.
5. Odebranie członkostwa odcina aktywny kanał w zmierzonym SLA i uniemożliwia następujący po evencie fetch. Sprawdzić też otwartą sesję pracownika.
6. Utrata WebSocketu, ukryta karta, stary event cursor i dłuższa przerwa nie gubią zmian: przy ponownym widoku/połączeniu klient wykonuje autoryzowany resync. Powiadomienia są idempotentne, duplikat tylko powoduje bezpieczne odświeżenie.
7. Benchmark z 1, 5, 10 i 25 sesjami raportuje p50/p95 opóźnienia, żądania pełnej analizy, bajty odczytu i czas oczekiwania w kolejce. Progi produkcyjne zatwierdzić na podstawie tych danych i planu Supabase/Vercel.

## Źródła

- Supabase, Subscribing to Database Changes: https://supabase.com/docs/guides/realtime/subscribing-to-database-changes — Broadcast rekomendowany nad Postgres Changes pod kątem skali/bezpieczeństwa.
- Supabase, Realtime Benchmarks: https://supabase.com/docs/guides/realtime/benchmarks — uwierzytelnianie poszczególnych odbiorców, jednowątkowe przetwarzanie Postgres Changes i zalecenie własnego benchmarku.
- Supabase, Realtime Authorization: https://supabase.com/docs/guides/realtime/authorization — cache polityki subskrypcji do wygaśnięcia/odświeżenia JWT; istotne przy odwołaniu członkostwa.
- Kod: `web/src/App.tsx`, `src/server/app.ts`, `src/store/store.ts`, `src/service.ts`.

Nie zmieniono logiki. Nie udostępniać Realtime przed wprowadzeniem i sprawdzeniem autoryzacji.
