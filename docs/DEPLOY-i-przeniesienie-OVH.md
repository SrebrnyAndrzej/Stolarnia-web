# Wdrożenie teraz i późniejsze OVH

Aktualny cel: preview Vercel dla gałęzi `feat/pan-stolarz-v2`; bez merge do main. Backend Express, migracje SQL w `supabase/migrations`, brak integracji faktur.

## Supabase — warunki aktywacji

1. W istniejącym projekcie sprawdzić wcześniejsze migracje bazy i kont. Wykonać backup i potwierdzić możliwość odtworzenia.
2. Zastosować migrację `202611010001_workshop_tasks.sql` raz, po migracji kont. Dodaje tabele i funkcję; nie migruje ani nie zmienia projektów i cen. Zapisać jej wykonanie w historii migracji.
3. Skonfigurować w docelowym środowisku `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` oraz serwerowy `SUPABASE_SECRET_KEY` (lub obsługiwany `SUPABASE_SERVICE_ROLE_KEY`). Klucze ustawiać przez panel/sekrety środowiska, nie przez Git ani czat. Nie kopiować dostępu do produkcyjnej bazy do wszystkich preview bez decyzji o zakresie.
4. Zaprosić właściciela i osobno Bartka oraz Kacpra w Auth; przypisać ich UUID w `pan_stolarz_members`, role i projekty. Nazwa wyświetlana nie nadaje dostępu.
5. Sprawdzić prawdziwe sesje trzech kont, odmowę dostępu do cudzego zadania, brak finansów u pracowników, równoczesne zapisy, retry i wycofanie dostępu. Atrapy API nie zastępują tego odbioru.

## Przeniesienie całego projektu na OVH

- Aplikacja: budowanie przez `npm ci` i `npm run build`, uruchamianie Express przez `npm start`; port przez `PORT`. Reverse proxy TLS, nadzór procesu i health checks. Vercel pozostaje adapterem wdrożenia, nie właścicielem danych.
- Dane: zwykłe tabele PostgreSQL i migracje SQL. Najpierw eksport/próba odtworzenia bazy, porównanie liczby rekordów, uzgodnionych kwot oraz identyfikatorów.
- **Przeniesienie samego Postgresa nie usuwa zależności od Supabase.** Logowanie korzysta z Supabase Auth, a obecny magazyn i moduł zadań z API Supabase/PostgREST. Do całkowitego odejścia potrzebny jest self-hostowany zestaw Supabase albo osobny projekt migracji Auth i adapterów bazy. Zachować UUID użytkowników i relacje; zaplanować obsługę sesji i resetów haseł.
- Jeśli pojawi się Storage: przenieść również binarne pliki i reguły prywatnego dostępu; dump SQL nie jest kopią plików. Zachować odwołania kart do wydań dokumentacji.
- Przed przełączeniem: próbne środowisko OVH, backup i odtworzenie, e-mail, TLS, sekrety, test trzech ról, termin zamrożenia zapisów, końcowa synchronizacja, DNS oraz plan powrotu. Unikać dwóch równolegle aktywnych baz zapisujących te same projekty.

Nie wybierano jeszcze płatnego serwera OVH i nie zmieniano DNS. Pełna migracja infrastruktury jest odrębnym etapem.
