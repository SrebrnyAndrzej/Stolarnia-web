# Wersjonowanie i migracje firmowej bazy JSON

Data: 2026-10-06
Baza kodu: `c136681b5fed150ee91438d816544b2f689bfb9f` (`origin/main`)
Zakres: zgodność danych między wydaniami aplikacji i bezpieczne migracje; rekomendacje dla Claude, bez zmian logiki.

## Problem

W firmowej bazie zapisane są projekty, materiały, cenniki, okucia i ustawienia. Zmiana modelu TypeScript podczas wdrożenia może spowodować, że nowa wersja aplikacji nie odczyta starego rekordu albo po cichu zapisze jego niepełną interpretację. Szczególnie ważne są historyczne umowy, uzgodnione ceny, wydania produkcyjne, ich skompresowane migawki i powiązane dokumenty.

## Ustalenia z repozytorium

- `supabase/migrations/202609230001_stolarnia_baza.sql` tworzy tabelę `public.stolarnia_baza` z jednym polem `dane jsonb` dla firmowej bazy, oraz osobnym `wersja integer` używanym do wykrywania równoległego zapisu.
- `src/store/store.ts` definiuje `BazaDanych.wersja`, a pusta baza dostaje `wersja: 1`. `Magazyn.zaladuj()` rzutuje zdekodowane `dane` na `BazaDanych`; nie ma tam walidatora całego payloadu ani rejestru transformacji kolejnych wersji schematu. `Magazyn.utrwal()` używa wersji wiersza Supabase jako optymistycznej blokady.
- W `odczytaj()` istnieją ograniczone działania zgodności: dodawanie nowych pozycji katalogowych, inicjalizacja cennika i dołączanie brakujących ustawień domyślnych. Nie jest to ogólna, jawna migracja struktury wszystkich projektów i ich zagnieżdżonych danych.
- Wyszukiwanie repozytorium wykazało migrację SQL tworzącą tabelę, ale nie osobny łańcuch migracji JSON ani test fixture starszej kompletnej bazy. Istniejący test `src/store.chmura.test.ts` sprawdza zapis/odczyt, optymistyczny konflikt dwóch instancji i brak zapisu przy braku zmian.
- Nazwa `wersja` ma dwa różne poziomy znaczenia: `BazaDanych.wersja` to pole payloadu, a `stolarnia_baza.wersja` jest licznikiem konfliktów zapisu. Nie wolno używać tego samego licznika wiersza jako identyfikatora schematu.

To wnioski z przeglądu statycznego; nie połączono się z projektem Supabase, nie oglądano rzeczywistych danych i nie sprawdzono jego historii wdrożeń.

## Potwierdzenie z dokumentacji dostawcy

Supabase zaleca zapisywać zmiany schematu w plikach migracji, testować je na lokalnej bazie i prowadzić oddzielną historię zastosowanych migracji. Zmiany wykonane ręcznie na zdalnej bazie mogą rozjechać kod i historię migracji. Branching może zapewnić odizolowane środowisko dla pull requestu. Są to mechanizmy schematu Postgresa — same nie migrują struktury JSON przechowywanej wewnątrz `dane`.

- [Supabase: Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase: Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments)
- [Supabase: Branching](https://supabase.com/docs/guides/deployment/branching)

Źródła sprawdzono 2026-10-06.

## Zalecany model

**P0 przed kolejną destrukcyjną zmianą struktury zapisanych danych; P1 jako powtarzalny proces wdrożeń.** Najpierw potwierdzić odtwarzalną kopię i próbę restore według `docs/RESEARCH-kopie-zapasowe-i-odtwarzanie-2026-10-04.md`. Następnie wprowadzić jawny `schemaVersion` w JSON payloadzie, odrębny od PostgREST concurrency token i od wersji generatora dokumentacji.

1. **Kontrakt schematu:** określić wersję bieżącą, walidację wymaganych pól, dopuszczalne pola opcjonalne i zachowanie przy nieznanej wersji. Brak lub błędna wersja legacy obsługiwana wyłącznie przez jawnie wskazaną migrację; nieznana nowsza wersja kończy odczyt bez zapisu, zamiast być „naprawiana” domyślnymi wartościami.
2. **Sekwencja transformacji:** czyste, deterministyczne funkcje `vN → vN+1`, uruchamiane po wczytaniu i przed normalnym odczytem/zapisem. Każdy krok waliduje wejście i wynik; przy błędzie zwraca raport i nie zapisuje częściowo przekształconej bazy. Powtórne uruchomienie po błędzie nie może dublować elementów ani zmieniać ceny.
3. **Migracja bez cichej utraty:** zachować wszystkie pola nieobjęte transformacją; umowy historyczne, `cenaUzgodnionaBrutto`, snapshoty wydań, hash, katalog własnych pozycji, ceny edytowane przez firmę i nieznane rozszerzenia muszą mieć jawne reguły zachowania. Usunięcie/podmiana danych wymaga osobnej, zatwierdzonej decyzji i kopii; nie wolno „naprawiać” hash snapshotu przez ponowne wyliczenie.
4. **Dwie ścieżki magazynu:** jedna migracja musi dawać ten sam wynik dla pliku JSON lokalnego i wiersza Supabase. Przy zapisie chmurowym migracja jest częścią warunkowego PATCH po sprawdzeniu concurrency version; konflikt wymaga ponownego załadowania i ponownego zastosowania migracji do najnowszych danych, bez automatycznego nadpisania.
5. **Rollout:** dla zmian niekompatybilnych rozdziel wdrożenie wstecznie kompatybilnych odczytów od zapisu nowego kształtu (expand/contract). Wersja aplikacji musi umieć wyjaśnić „wymagana nowsza wersja” i zablokować mutacje, jeśli spotka payload nowszy od siebie.
6. **Kopie i diagnostyka:** przed migracją firmowej bazy wykonaj kopię o weryfikowalnym ID/hash i potwierdź możliwość restore. Zapisz starą/nową wersję payloadu, liczbę przekształconych rekordów i wynik walidacji bez kopiowania danych klienta do logów. Nie udostępniaj endpointu migracyjnego anonimowo; zależność P0 ACL pozostaje nierozwiązana.
7. **Schemat SQL osobno:** wszystkie przyszłe tabele/kolumny/RLS policies przechodzą przez kontrolowane SQL migrations i staging. Migracja SQL tabeli `stolarnia_baza` nie zastępuje migracji JSON `dane`, a `schemaVersion` JSON nie zastępuje historii SQL.

## Kryteria odbioru dla Claude

1. Fixture starszej wersji z prawdziwymi strukturami (zanonimizowana i bez danych klienta) migruje do bieżącej wersji; porównanie potwierdza zachowanie historycznej umowy, ceny uzgodnionej, materiałów/cen firmy oraz snapshotu produkcyjnego i jego SHA-256.
2. Test lokalnego pliku oraz atrap Supabase daje identyczny znormalizowany payload po migracji.
3. Migracja zatrzymuje się przed zapisem po wadliwym polu/hash; baza wejściowa jest identyczna przed i po błędzie, a komunikat zawiera wersję i ścieżkę pola bez treści PII.
4. Migracja `vN → vN+1` po dwóch uruchomieniach daje ten sam wynik co po jednym; nie dubluje katalogów i nie zmienia zatwierdzonych cen.
5. Payload z wersją nowszą niż uruchomiona aplikacja jest tylko do odczytu/blokuje zapis z jawnym komunikatem; stara aplikacja nie usuwa nieznanych pól po zapisie.
6. Równoległa modyfikacja między odczytem a zapisem powoduje konflikt. Po ponownym odczycie migracja i edycja nie kasują niezależnych zmian drugiej instancji.
7. Migrację przed produkcją odtworzono w bazie testowej z kopii; zapisano sprawdzenie integralności, czas, liczbę projektów i wynik odtworzenia wybranych dokumentów.
8. SQL migrations są wersjonowane i odtwarzalne na czystej lokalnej bazie, a proces wdrożenia do staging i produkcji ma wskazanego operatora i nie zmienia ręcznie historii migracji.

## Zależności i ograniczenia

- Zależności: P0 autoryzacja i izolacja organizacji; niezależne kopie i udokumentowany restore; uzgodniona polityka deployu/staging; fixtures reprezentujące faktyczny format starszych danych.
- Nie można potwierdzić z repozytorium, czy produkcyjny rekord jest starszy od bieżącego, czy migration history Supabase jest zsynchronizowana ani czy backup obejmuje aktualny rekord. To wymaga właściciela projektu i bezpiecznej kontroli w panelu.
- Nie wprowadzano zmian kodu, SQL, konfiguracji Supabase, danych produkcyjnych ani umów. Nie uruchamiano testów, bo brief nie zmienia zachowania aplikacji.

## Punkt wznowienia

Po publikacji sprawdzić świeże commity Claude, szczególnie P0 auth/ACL i ewentualne pliki SQL migracji. Następnie zweryfikować, czy plan zmian uwzględnia rozdział licznika concurrency od wersji schematu JSON oraz odtwarzalne testy z fixture starszej bazy. Ostatnia zbadana rewizja: `c136681b5fed150ee91438d816544b2f689bfb9f`.
