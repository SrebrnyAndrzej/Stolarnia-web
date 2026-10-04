# Kopie zapasowe i odtwarzanie danych — wymagania dla aplikacji stolarskiej

Data: 2026-10-04
Baza kodu: `d66a6d258903cc01784fee665659e3f4a6fe2eb5`
Zakres: statyczny przegląd modelu magazynu i istniejących instrukcji; nie sprawdzano planu ani ustawień konkretnego projektu Supabase.

## Problem i dowody

Obecny magazyn chmurowy zapisuje całą aplikacyjną bazę jako jeden dokument JSON w `public.stolarnia_baza` (`src/store/store.ts`, `supabase/migrations/202609230001_stolarnia_baza.sql`). Dokument zawiera ustawienia, materiały, cenniki, okucia i wszystkie projekty. `utrwal()` zastępuje całe pole `dane` warunkowym `PATCH` po wersji. W repozytorium jest migracja do chmury, ale wyszukiwanie skryptów/instrukcji nie znalazło procedury regularnego eksportu ani odtworzenia tej tabeli. Dotychczasowy plan wdrożenia wspomina ogólnie o kopii lokalnej i zależności backupów Supabase od planu, lecz nie zawiera testu odtworzenia.

Konsekwencja: usunięcie lub uszkodzenie tego jednego rekordu może objąć całą firmową bazę. Backup Postgresa może pomóc, ale sama deklaracja, że dostawca tworzy kopie, nie dowodzi, że właściwy plan, retencja, dostęp i procedura odtworzenia są skonfigurowane i sprawdzone.

## Fakty potwierdzone w dokumentacji dostawcy

- Supabase tworzy automatyczne kopie dzienne dla planów Pro, Team i Enterprise; deklarowana retencja wynosi odpowiednio 7, 14 i do 30 dni. Dla planu bezpłatnego Supabase zaleca regularny własny eksport i kopię poza usługą.
- PITR jest dodatkiem dla płatnych planów; dostępność, retencja i koszt zależą od ustawień. Odtworzenie przywraca bazę do punktu w czasie i powoduje niedostępność projektu podczas operacji.
- Kopia bazy nie zawiera obiektów z Supabase Storage — tylko ich metadane. Jeśli aplikacja zacznie przechowywać tam umowy lub załączniki, wymagają one osobnej strategii kopii.
- Nie ustalono, jaki plan, retencja ani PITR są aktywne w używanym projekcie. Nie rekomenduję włączenia płatnego dodatku bez decyzji właściciela.

## Rekomendacje i priorytet

**P1 — przed przechowywaniem nieodtwarzalnych, aktywnych zleceń:** właściciel powinien potwierdzić plan i retencję w panelu Supabase oraz ustalić akceptowalne RPO (ile ostatnich danych można stracić) i RTO (jak długo aplikacja może być niedostępna). Do czasu weryfikacji traktować ochronę jako niepotwierdzoną.

**P1 — niezależna kopia:** zapewnić regularny, szyfrowany eksport `stolarnia_baza` do lokalizacji poza tym samym projektem Supabase. Ograniczyć dostęp do kopii; nie umieszczać danych osobowych ani sekretów w Git, logach lub zwykłym artefakcie CI. Dla pełnego dumpa trzeba zachować również schemat/migracje i udokumentować sposób odtworzenia. Częstotliwość ma wynikać z zaakceptowanego RPO.

**P1 — próba odtworzenia:** odtworzyć kopię wyłącznie do oddzielnego/testowego projektu, sprawdzić integralność JSON, wersję, ustawienia, liczbę projektów oraz możliwość otwarcia przykładowego projektu i wygenerowania jego dokumentacji. Zapisać czas odtworzenia i różnicę względem wskazanego punktu kopii. Nie przeprowadzać prób odtworzenia na produkcji.

**P2 — produktowa diagnostyka:** pokazywać właścicielowi datę ostatniej potwierdzonej kopii i jej status tylko wtedy, gdy źródło tej informacji jest wiarygodne. Nie obiecywać „backup OK” na podstawie samego udanego zapisu aplikacji.

## Zależności i mierzalne kryteria odbioru

Zależności: decyzja właściciela o RPO/RTO i retencji; potwierdzenie planu Supabase; bezpieczne miejsce i właściciel procesu eksportu; dostęp do odizolowanego projektu testowego. Nie dodawać publicznego endpointu pobierającego backup; istniejące API wymaga wcześniej zabezpieczenia zgodnie z notatką P0 o dostępie.

Odbiór procedury:

1. Ustalono i zapisano plan, retencję dostawcy, RPO, RTO, lokalizację kopii i osobę odpowiedzialną; nieznane wartości oznaczone jako niepotwierdzone.
2. Wykonano próbny eksport i odtworzenie do projektu testowego bez ujawnienia sekretu w konsoli/artefaktach.
3. Odtworzony rekord przechodzi walidację schematu i zawiera zgodne kontrolne wartości ustawień, materiałów oraz projektów.
4. Zmierzono czas wykonania i odtworzenia; procedura wskazuje kroki, dostępne narzędzia i zachowanie przy błędzie.
5. Kolejna próba jest zaplanowana według ustalonego RPO, a kopia pozostaje dostępna także przy utracie projektu produkcyjnego.

## Źródła

- Supabase, Database Backups: https://supabase.com/docs/guides/platform/backups — plany/retencja, eksport dla Free, przywracanie, ograniczenia Storage i PITR.
- Supabase, Backup and Restore using the CLI: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore — polecana ścieżka eksportu/odtwarzania i zachowanie migracji.

Nie włączano PITR, nie zmieniano ustawień Supabase/Vercel i nie wykonywano operacji na danych produkcyjnych.
