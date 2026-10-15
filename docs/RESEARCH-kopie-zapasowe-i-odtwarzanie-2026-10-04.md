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

## Aktualizacja oficjalnych warunków Supabase — 2026-10-15

Ponownie sprawdzono dokumentację dostawcy, bez dostępu do konta/projektu warsztatu. Bieżąca strona Supabase potwierdza kopie dzienne dla planów Pro, Team i Enterprise z retencją 7/14/do 30 dni; projekty Free mają samodzielnie eksportować dane i utrzymywać kopię poza usługą. Dla nowszych wersji Postgresa (15.8.1.079+) standardem są kopie fizyczne. Nie można pobrać ich plików z dashboardu; po wyłączeniu PITR dalsze kopie również są tylko fizycznymi backupami, a ręczny pobieralny dump wymaga CLI/`pg_dump`.

**Zmiany i szczegóły istotne dla planowania:**

- Włączenie PITR zastępuje codzienne backupy dzienne (dostawca uznaje je za zbędne przy dokładniejszym PITR) i wymaga co najmniej dodatku compute Small. Oficjalna strona cennika backupów pokazuje orientacyjnie 7 dni za 0,137 USD/godz. (~100 USD/mies.), 14 dni ~200 USD/mies. i 28 dni ~400 USD/mies.; ostateczny koszt i stan konkretnego projektu należy sprawdzić w panelu przed decyzją. Nie włączono dodatku ani nie zakładamy, że warsztat używa wskazanego planu.
- Restore backupu dziennego i PITR powoduje niedostępność projektu; czas zależy od rozmiaru bazy. Najnowszy punkt PITR może wyglądać na starszy, gdy nie było ostatnio transakcji, mimo że odzwierciedla aktualny stan. Odbiór operacyjny powinien więc opierać się na potwierdzonym punkcie/zakresie transakcji, nie tylko na etykiecie czasu.
- Kopie fizyczne nie obejmują zawartości Storage API, tylko metadane. Jeśli aplikacja zacznie tam zapisywać umowy/załączniki, odrębny eksport obiektów jest konieczny. Usunięcie projektu kasuje również powiązane backupy.
- Procedura logicznego dump/restore CLI wymienia osobne pliki dla ról, schematu i danych. Dokumentacja wskazuje dodatkowe działania dla niestandardowych obiektów w `auth`/`storage`, historii migracji, rozszerzeń, webhooków, publikacji Realtime oraz haseł własnych ról. Runbook musi najpierw zinwentaryzować, które z nich istnieją; nie kopiować automatycznie całego schematu zarządzanego dostawcy ani nie zakładać, że sam `data.sql` odtwarza konfigurację.

**Uściślone kryterium odbioru:** przed określeniem backupu jako gotowego właściciel zapisuje plan/Postgres version i źródło potwierdzenia kopii w panelu; wybiera RPO/RTO; wybiera niezależny eksport o retencji odpowiadającej RPO (zawierający `stolarnia_baza.dane`, schemat/migracje i potrzebną konfigurację), a Storage kopiuje osobno, jeśli jest używany. Operator odtwarza go w pustym, oddzielnym projekcie; test potwierdza zgodność wersji/migracji, walidację kompletnego JSON, zachowanie uzgodnionej ceny 29 227,60 zł brutto i wszystkich historycznych umów oraz otwarcie zanonimizowanego przykładowego projektu. Runbook mierzy czas niedostępności i odtworzenia, liczbę utraconych transakcji względem ustalonego celu oraz wynik kontroli Storage. W razie nieudanego restore nie przełącza produkcji i nie nadpisuje jej automatycznie.

Źródła pierwotne, sprawdzone 2026-10-15:

- [Supabase — Database Backups](https://supabase.com/docs/guides/platform/backups): plany/retencja, rodzaje backupów, wyłączenie pobierania kopii fizycznych, Storage, restore downtime oraz PITR i koszt.
- [Supabase — Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore): `db dump` dla ról/schematu/danych, restore w pustym projekcie, niestandardowe zmiany `auth`/`storage`, migracje, rozszerzenia, webhooki, realtime i reset haseł ról.

Nie zweryfikowano dashboardu, planu, konfiguracji, rozmiaru ani rzeczywistego backupu projektu warsztatu. Nie wykonano eksportu, restore, odpytywania danych produkcyjnych ani zmian w Supabase. Nie są to podstawy do zakupu PITR; decyzja zależy od zaakceptowanego RPO/RTO i aktualnej wyceny.
