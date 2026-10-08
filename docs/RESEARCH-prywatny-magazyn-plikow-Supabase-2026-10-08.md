# Prywatny magazyn plików projektowych w Supabase Storage

Data przeglądu: 08.10.2026. Baza kodu: świeże `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3`. Zakres: konsekwencje dla przyszłego obiegu rysunków, umów, ofert i zdjęć klientów. To rekomendacje techniczne, nie potwierdzenie obecnych ustawień produkcji ani porada prawna.

## Stan projektu i problem

W repozytorium nie znaleziono użycia Supabase Storage ani tabeli metadanych dokumentów. Backend `src/store/store.ts` używa `SUPABASE_SECRET_KEY` lub legacy `SUPABASE_SERVICE_ROLE_KEY` do tabeli całej bazy; klucz uprzywilejowany omija RLS. Aktualna macierz autoryzacji REST/MCP zaznacza, że wdrożenie i ACL pozostają niezweryfikowane. Zatem Storage jest przyszłym kandydatem, a poniższe zasady muszą być zaprojektowane wraz z autoryzacją aplikacji — sama prywatna nazwa bucketu nie wystarczy.

Problem użytkownika: projekty zawierają pliki o różnej wrażliwości. Błędne publiczne bucket-y, zbyt szeroka reguła RLS, pominięta kontrola projektu przed wydaniem URL albo link, którego nie da się odwołać natychmiast, mogą udostępnić dokument poza zamierzonym warsztatem.

## Fakty z dokumentacji Supabase

- Prywatny bucket nie obsługuje publicznego odczytu URL; plik można pobrać autoryzowanym żądaniem z JWT albo przez czasowo podpisany URL. Public bucket czyni każdy plik dostępnym publicznie. [Serving assets from Storage](https://supabase.com/docs/guides/storage/serving/downloads)
- Dostęp do prywatnych operacji Storage kontroluje RLS na `storage.objects`; bez polityk Storage domyślnie nie dopuszcza uploadu. Upsert wymaga dodatkowo `SELECT` i `UPDATE`, więc nie należy przyznawać ich „na zapas”. Klucz `service` omija RLS całkowicie. [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- `owner_id` powstaje z JWT przy tworzeniu obiektu, ale właściciel nie jest sam w sobie regułą dostępu. Obiekt utworzony przy użyciu service key nie dostaje właściciela. Sama relacja „ten użytkownik przesłał plik” nie realizuje członkostwa w warsztacie i uprawnień do projektu. [Ownership](https://supabase.com/docs/guides/storage/security/ownership)
- Podpisany URL pozostaje ważny do wygaśnięcia niezależnie od rotacji klucza JWT; dokumentacja mówi, że jego unieważnienie wymaga kontaktu z Supabase. Wygenerowany URL należy więc traktować jak czasowy token-posiadacza. [Serving assets from Storage](https://supabase.com/docs/guides/storage/serving/downloads)
- Metadane i binarne obiekty są przechowywane oddzielnie. Usunięcie rekordu/metadanych SQL może pozostawić obiekt u dostawcy i naliczane przechowywanie; modyfikacje plików należy robić przez Storage API. Konfiguracja bucketu może nakładać limit wielkości i dozwolone typy MIME. [Storage schema](https://supabase.com/docs/guides/storage/schema/design)
- Supabase rozróżnia klucz publishable dla kodu publicznego od secret/service key dla zaufanego backendu; secret/service omija RLS i nie może trafić do frontendu. [Securing your data](https://supabase.com/docs/guides/database/secure-data), [API keys](https://supabase.com/docs/guides/getting-started/api-keys)

## Zalecany przepływ

**P0 przed plikami klientów:** osobny, prywatny bucket. Każde żądanie backendu najpierw weryfikuje aktywną sesję, warsztat, przynależność pliku do projektu oraz uprawnienie do konkretnej czynności (odczyt, upload, zmiana, usunięcie, eksport). Dopiero po tej kontroli serwer może użyć secret key. Nie ufać samemu `owner_id`, nazwie bucketu, identyfikatorowi ścieżki ani UUID przekazanemu przez klienta. Alternatywnie można użyć JWT użytkownika i polityk RLS; w obu architekturach testować rzeczywistą granicę tenant/project.

**P1 — klucze obiektów bez danych osobowych.** Ścieżka zawierać powinna niejawne, stabilne identyfikatory warsztatu/projektu/obiektu, a nie nazwisko, adres, nazwę pomieszczenia, numer telefonu ani nazwę umowy. Oryginalna nazwa pliku trafi do prywatnych metadanych z walidacją i wyświetlaniem jako dane niezaufane. Ustalić dozwolone formaty/rozmiary, skanowanie uploadu i politykę retencji zanim włączyć klientom upload.

**P1 — pobieranie.** Preferować autoryzowany download z JWT, gdy odebranie członkostwa musi natychmiast zatrzymać dalsze żądania. Podpisany URL jest dopuszczalny przy krótkim, uzasadnionym TTL i świadomym zaakceptowaniu okna ważności po cofnięciu uprawnień. Nie zapisywać pełnego URL/tokena w logach, analityce ani komunikatach błędu; audytować wydanie linku: kto, jaki obiekt/projekt, kiedy i na jak długo. Do udostępnienia klientowi używać osobnego procesu z wyraźnym zakresem i terminem, nie linku z panelu pracownika.

**P1 — spójne usuwanie.** Usunięcie projektu lub pliku powinno najpierw zarejestrować stan retencji/operacji, a następnie usunąć obiekt przez Storage API. Błędy częściowe muszą pozostawić widoczny stan do ponowienia przez uprawniony proces; nie kasować wyłącznie rekordu metadanych SQL i nie twierdzić, że binarium usunięto. Ustalić odrębnie kopie zapasowe i ich retencję.

## Kryteria odbioru dla Claude

1. Bucket projektowy jest prywatny. Niezalogowany download/list, publiczny URL oraz metoda niewymieniona w ACL nie zwracają pliku ani jego treści.
2. Test macierzowy: anonimowy, członek warsztatu A, pracownik A przypisany do projektu, pracownik A bez przypisania, właściciel A i użytkownik warsztatu B. Sprawdzić listę, odczyt, upload, overwrite, signed URL, delete i eksport; podmienić ID warsztatu/projektu/obiektu w każdej rodzinie tras.
3. Wymuszenie ACL poprzedza użycie service key. Test negatywny dowodzi, że prawidłowy identyfikator pliku z obcego projektu nadal daje odmowę i nie tworzy signed URL. Żaden sekret nie pojawia się w bundlu frontendu, source mapie ani logu.
4. Revoke członkostwa blokuje następny autoryzowany download. Osobny test dokumentuje, że wcześniej wydany signed URL działa do TTL; jeśli wymagane jest natychmiastowe odebranie linku, mechanizm wydawania signed URL zostaje wyłączony na rzecz proxy/JWT.
5. Test delete potwierdza odpowiedź Storage API i brak obiektu po operacji; przypadek awarii nie pozostawia pozornie zakończonego usunięcia. Metadane ścieżki i logi nie zawierają nazwisk/adresów ani signed tokena.
6. Upload odrzuca format i rozmiar spoza zatwierdzonej polityki; plik o dozwolonym rozszerzeniu, lecz innym rzeczywistym typie, nie jest automatycznie uznawany za bezpieczny.

**Priorytet:** P0 przed przechowywaniem prawdziwych plików; P1 przed linkami do pobrania, współdzieleniem i retencją. **Zależności:** właściciel zatwierdza role/zakresy, retencję, maksymalny rozmiar/format i wymagany czas unieważniania; auth P0 dla REST/MCP; decyzja o architekturze JWT-RLS albo backend service key z kontrolą ACL; odrębny projekt backup/restore. **Miernik:** 100% operacji plikowych przypisanych do rola × warsztat × projekt × czynność; negatywne testy między tenantami przechodzą; wszystkie operacje usunięcia i wydania linku mają audyt bez treści dokumentu.

## Czego nie potwierdzono

Nie sprawdzono ustawień produkcyjnego projektu Supabase, Vercel, secretów, polityk storage, użycia klientowskich plików ani retencji. Obecna gałąź main nie zawierała implementacji Storage w sprawdzonym wyszukiwaniu. Rekomendacja nie oznacza, że można zacząć przechowywać dane klientów — wymagane jest wdrożenie i testy z osobnym przeglądem bezpieczeństwa.

## Uzupełnienie: spójność metadanych, plików i odtworzenia

### Problem i dowód

W aktualnym projekcie cała baza domenowa jest utrwalana jako pojedynczy rekord JSON w `stolarnia_baza`. Pliki binarne — jeśli zostaną przeniesione do Storage — będą osobnym obiektem poza tym rekordem. Supabase potwierdza, że metadane Storage w Postgres i pliki u dostawcy są rozdzielone; backup bazy nie obejmuje samych obiektów. Zatem transakcja obejmująca jednocześnie rekord projektu i plik nie powstaje automatycznie przez zapis JSON ani przez kopię bazy. Źródła: [Storage schema](https://supabase.com/docs/guides/storage/schema/design), [Database backups](https://supabase.com/docs/guides/platform/backups).

### Proponowane zachowanie

**P1 — jawny stan operacji plikowej.** Wprowadzić manifest metadanych z `pending_upload`, `ready`, `pending_delete`, `failed`/`orphaned`, obok niezmiennego object key, rozmiaru, deklarowanego i wykrytego MIME, SHA-256, właściciela/warsztatu/projektu, rewizji dokumentu, autora i dat. Nie publikować linku i nie dołączać pliku do wydania/umowy, dopóki stan nie jest `ready` i hash nie zgadza się z zawartością.

Proponowana kolejność uploadu: utworzyć prywatny rekord pending i losowy object key; przesłać do prywatnego bucketu; zweryfikować odpowiedź, typ, rozmiar i hash; dopiero potem ustawić ready. Awaria pomiędzy krokami pozostawia rozpoznawalny stan do ponowienia, a nie „ukończony” dokument. Okresowy reconciliation job powinien wykrywać pending/orphaned rekordy i obiekty bez referencji; usunięcie obiektu wyłącznie przez Storage API.

Proponowana kolejność kasowania: oznaczyć pending_delete i zablokować nowe downloady; wykonać usunięcie przez Storage API; po potwierdzeniu zapisać deleted/tombstone i audyt. Jeśli wymagane jest odtwarzanie historycznej rewizji, obiekt pozostaje w retencji jawnie zatwierdzonej przez właściciela — nie należy po cichu nadpisywać pliku o tym samym kluczu.

### Kryteria odbioru

1. Awaria testowa po każdym kroku uploadu nie ujawnia pliku jako gotowego; retry jest idempotentny i prowadzi do dokładnie jednego gotowego obiektu albo jawnego błędu.
2. Niezgodność SHA-256, rozmiaru lub rzeczywistego typu MIME blokuje `ready` i wydanie dokumentu.
3. Usunięcie projektu, obiektu lub retencji nie pozostawia niewykrytych orphanów; raport reconciliation pokazuje identyfikatory wewnętrzne i status, bez nazwisk/adresów.
4. Test odtworzenia kopii bazy plus osobnej kopii obiektów przywraca manifest i binarium do tego samego stanu; wszystkie hash'e weryfikują się, a brak obiektu blokuje jego wydanie. Mierzyć RPO/RTO na testowym, odizolowanym środowisku.
5. Snapshot wydania, dokument PDF i pliki załączone mają wspólny identyfikator rewizji i hash manifestu; późniejsza zmiana nie podmienia artefaktu już zaakceptowanego.

**Priorytet:** P1 przed wiązaniem załączników z umową, akceptacją lub wydaniem produkcyjnym. **Zależności:** prywatny bucket i ACL P0, model manifestu/revizji, strategia osobnych kopii binariów i bazy, zaakceptowana retencja. **Status:** wymagania projektowe; Storage i job reconciliation nie są obecnie wdrożone ani zweryfikowane.
