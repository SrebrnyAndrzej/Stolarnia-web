# Nowy projekt Supabase dla stolarnia-web

Stan: przygotowana konfiguracja. Nowy projekt nie został jeszcze utworzony ani połączony z Vercel. Użytkownik polecił nie korzystać z projektu wskazanego wcześniej w repozytorium.

## 1. Utworzenie projektu

W panelu Supabase utwórz projekt w swojej organizacji, np. `stolarnia-web-prod`, najlepiej w regionie Frankfurt (blisko funkcji Vercel `fra1`). Wybierz plan świadomie w panelu; konfiguracja aplikacji nie wymaga zakupu płatnego planu. Hasło bazy zachowaj w swoim menedżerze haseł. Nie umieszczaj go w repozytorium ani rozmowie.

## 2. Schemat bazy

W SQL Editor nowego projektu uruchom zawartość `supabase/migrations/202609230001_stolarnia_baza.sql`. Powstaje tabela `public.stolarnia_baza` z polami `id`, `dane`, `wersja`, `zmieniono`. RLS jest włączone, brak dostępu dla `anon` i `authenticated`, backend korzysta z klucza serwerowego. Migracja nie przenosi danych ze starego projektu.

Jest to istniejący model aplikacji: jeden dokument JSON z projektami, materiałami, okuciami i ustawieniami. Kontrola wersji zapobiega nadpisaniu równoczesnej zmiany. Nie jest to jeszcze model wielu niezależnych firm/użytkowników.

## 3. Połączenie z Vercel

W ustawieniach projektu Vercel `stolarnia-web`, Environment Variables, ustaw w środowisku Production:

| Zmienna | Wartość |
|---|---|
| SUPABASE_URL | Project URL **nowego** projektu z panelu Supabase |
| SUPABASE_SECRET_KEY | Secret key **tego samego nowego** projektu z API Keys |

Zastąp poprzedni SUPABASE_URL, jeśli jest ustawiony. Zmień obie wartości przed ponownym wdrożeniem. Klucza nie dodawaj do zmiennych z prefiksem VITE_, kodu frontendu ani Git. Preview powinien używać oddzielnej bazy testowej, jeżeli ma wykonywać zapisy. Po zapisaniu zmiennych wykonaj Redeploy produkcji.

W tej wersji API i MCP nie mają własnego logowania; klucz Supabase nie zabezpiecza publicznych endpointów aplikacji. Przed uruchomieniem prawdziwych danych potwierdź w Vercel, że ochrona obejmuje również domenę produkcyjną `stolarnia-web.vercel.app`, API i MCP, a nie tylko podglądy. Jeśli plan tego nie umożliwia, wymagane jest wdrożenie logowania aplikacji. Nie wyłączaj RLS, aby naprawić połączenie.

## 4. Sprawdzenie i dane lokalne

- Odczytowy test z ustawionymi lokalnie zmiennymi: `node scripts/sprawdz-supabase.mjs`. Dla Node obsługującego env-file: `node --env-file=.env.local scripts/sprawdz-supabase.mjs`. Skrypt nie wyświetla klucza ani zawartości projektów.
- Otwórz aplikację po redeploy. Sprawdź odczyt materiałów i dekorów; zapisz próbny projekt i sprawdź go po ponownym odświeżeniu.
- Import lokalnych projektów jest osobną operacją: `npx tsx scripts/migracja-do-chmury.ts` z tymi samymi zmiennymi nowego projektu oraz STOLARNIA_DATA wskazującym właściwy lokalny katalog danych. Skrypt dopisuje brakujące ID; nie aktualizuje istniejących projektów ani nie przenosi automatycznie wszystkich ustawień zakładu. Najpierw zachowaj kopię lokalnej bazy.

## Źródła

- [Klucze API Supabase](https://supabase.com/docs/guides/api/api-keys)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Zmienne środowiskowe Vercel](https://vercel.com/docs/environment-variables)

Po wykonaniu kroków dopisz datę, potwierdzenie migracji, redeploy i wyniki odczytu/zapisu do STAN_PRAC.md. Nie zapisuj sekretów.
