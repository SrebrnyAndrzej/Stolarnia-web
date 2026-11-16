# Kopia zapasowa bazy (ST-APP-005)

Cała praca stolarni to dokument `glowna` w tabeli `stolarnia_baza` (Supabase), tabele kont i zadań `pan_stolarz_*` oraz prywatne pliki projektów (bucket `pan-stolarz-project-files`). Skrypt `scripts/kopia-bazy.mjs` zapisuje je **poza Supabase** i umie je odtworzyć.

## Raz: klucz i folder
1. Utwórz plik `C:\Users\Komp\.pan-stolarz\.env.kopia` (poza repozytorium) z dwoma liniami:
   ```
   SUPABASE_URL=https://<projekt>.supabase.co
   SUPABASE_SECRET_KEY=<klucz serwerowy z Vercel / Supabase → Settings → API>
   ```
   Plik zawiera klucz z pełnym dostępem do bazy. Nie wysyłaj go nikomu i nie kopiuj do repozytorium.
2. Wybierz folder kopii, najlepiej synchronizowany z chmurą prywatną (np. OneDrive), np. `C:\Users\Komp\OneDrive\Kopie\pan-stolarz`.

## Ręcznie
```
node scripts/kopia-bazy.mjs eksport --katalog "C:\Users\Komp\OneDrive\Kopie\pan-stolarz" --env "C:\Users\Komp\.pan-stolarz\.env.kopia"
node scripts/kopia-bazy.mjs sprawdz "C:\Users\Komp\OneDrive\Kopie\pan-stolarz\kopia-2026-11-15T23-00"
```
Domyślnie zostaje 30 najnowszych kopii (`--zachowaj 30`).

## Co noc (Harmonogram zadań Windows, jedno polecenie w PowerShell)
```
schtasks /Create /TN "Pan Stolarz - kopia bazy" /SC DAILY /ST 23:30 /TR "cmd /c cd /d C:\Users\Komp\stolarnia-v2-integracja && node scripts\kopia-bazy.mjs eksport --katalog C:\Users\Komp\OneDrive\Kopie\pan-stolarz --env C:\Users\Komp\.pan-stolarz\.env.kopia >> C:\Users\Komp\OneDrive\Kopie\pan-stolarz\dziennik.txt 2>&1"
```
Komputer musi być włączony o tej porze (albo w ustawieniach zadania zaznacz „uruchom jak najszybciej po pominięciu”).

## Próbne odtworzenie (bez dotykania produkcji)
```
node scripts/kopia-bazy.mjs odtworz-lokalnie "<katalog-kopii>" "C:\Temp\pan-stolarz-test"
```
Potem lokalna aplikacja na tych danych (bez zmiennych SUPABASE_*): `STOLARNIA_DATA=C:\Temp\pan-stolarz-test npm run dev:api`. Sprawdź, czy projekty i pliki są na miejscu.

## Awaria: odtworzenie produkcji
```
node scripts/kopia-bazy.mjs odtworz-chmure "<katalog-kopii>" --potwierdzam --env "C:\Users\Komp\.pan-stolarz\.env.kopia"
```
- Skrypt najpierw robi kopię bieżącego stanu do `przed-odtworzeniem\`.
- Potem przywraca dokument `glowna` jako nową wersję. Jeśli w międzyczasie ktoś coś zapisał, odmawia.
- Na koniec wgrywa pliki projektów.
- Konta (Supabase Auth), zadania i zapytania odtwarza się ręcznie z `baza.json`. Ich utrata nie kasuje projektów.
