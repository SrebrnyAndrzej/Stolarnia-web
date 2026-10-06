# Bezpieczne przekazywanie pakietów produkcyjnych podwykonawcom

Data: 2026-10-07  
Baza przeglądu `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`  
Zakres: wymagania dla ograniczonego dostępu do rysunków/pliku konkretnego wydania dla zewnętrznego wykonawcy. Bez zmian kodu, danych klientów ani konfiguracji Supabase.

## Luka względem istniejących briefów

Macierz autoryzacji obejmuje pracowników warsztatu, projekty i eksporty; brief prywatności wymaga ochrony dokumentów i `no-store`. Nie opisują jednak osobnego scenariusza „podwykonawca ma dostać tylko wybrane rysunki do zlecenia, na ograniczony czas”, w tym jak unieważnić jego dostęp lub udowodnić, co pobrał.

Jest to szczególnie ważne dla rysunków produkcyjnych: samo ukrycie URL albo nieprzewidywalny identyfikator nie stanowi autoryzacji. Link bearer skopiowany dalej umożliwia dostęp każdemu, kto go otrzyma, aż do wygaśnięcia i zgodnie z zachowaniem cache dostawcy.

## Zweryfikowane fakty techniczne

- Supabase Storage rozróżnia zasoby publiczne i prywatne. Prywatny bucket wymaga JWT i reguł RLS albo czasowego signed URL. Publiczny URL pomija kontrolę dostępu przy pobieraniu. [Supabase — Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- Signed URL Supabase pozostaje ważny do czasu wygaśnięcia; zmiana/rotacja klucza Auth nie unieważnia podpisów Storage, a dokumentacja mówi, by w sprawie unieważnienia kontaktować Supabase Support. [Supabase — Serving assets from Storage](https://supabase.com/docs/guides/storage/serving/downloads)
- Przy Smart CDN Supabase token URL signed nie stanowi klucza cache dla poszczególnych plików, ale cache może utrzymać odpowiedź po wygaśnięciu tokenu; dokumentacja ostrzega, że usunięcie obiektu jest sposobem odcięcia dostępu, a invalidacja propaguje się do ok. 60 sekund. TTL cache i czas tokena są niezależne. [Supabase — Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn)
- OWASP zaleca least privilege, deny-by-default oraz kontrolę dostępu dla każdego żądania i konkretnego obiektu, a nie poleganie na trudnym do odgadnięcia ID. [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

To są zachowania opisane przez dostawcę, nie dowód, że bieżący projekt Supabase ma Smart CDN włączony, używa Storage ani że istnieje udostępniony publiczny link. Konfiguracji produkcji w tym researchu nie sprawdzano.

## Rekomendowany przepływ

**P0 przed wysłaniem plików produkcyjnych poza warsztat:** potwierdzić ACL całej aplikacji, prywatność bucketów, reguły cache i wymagany zakres dostępu. **P1:** wdrożyć jawny grant dla konkretnego podwykonawcy/zadania.

1. Pracownik tworzy pakiet ze wskazaniem: warsztat, projekt, numer/hash wydania, konkretne dokumenty/części i cel zlecenia. Nie udostępnia się całego projektu, historii klienta, umowy, ceny, kosztu, notatek ani danych kontaktowych, jeżeli odbiorca ich nie potrzebuje.
2. Grant ma osobny ID, twórcę i zatwierdzającego, odbiorcę (osoba/firma/kanał), uprawnienie tylko do odczytu/pobrania, datę rozpoczęcia i wygaśnięcia, stan aktywny/odwołany/wygasły, zakres plików/rewizji oraz powód. Późniejsza rewizja nie podmienia pliku w już wydanym pakiecie.
3. Preferowana ścieżka: konto gościa lub weryfikacja jednorazowym kodem, a następnie serwerowa autoryzacja każdego pobrania do konkretnego grantu i pliku. Serwer wydaje plik przez kontrolowany handler z `Cache-Control: private, no-store`; odmowa lub odwołanie ma działać przy następnym żądaniu. Sama obecność losowego tokenu w URL nie jest sprawdzeniem tożsamości odbiorcy.
4. Jeżeli decyzja produktowa dopuszcza prosty bearer link, serwer musi przechowywać wyłącznie hash tokenu, nadać mu krótki zatwierdzony termin ważności, ograniczyć go do jednego grantu/manifestu i umożliwić odwołanie grantów w aplikacji. Nie udawać natychmiastowego unieważnienia już wydanego bezpośredniego signed URL Supabase: jego odcięcie może być opóźnione przez ważność podpisu oraz cache. Nie umieszczać signed URL w logach, analityce, refererach ani komunikatach zespołu.
5. Dla rzeczywistego odwołania natychmiastowego wszystkie kolejne odczyty muszą przechodzić przez autoryzujący serwer/proxy lub konto odbiorcy, które sprawdza aktywny grant za każdym razem. Nie buforować prywatnej odpowiedzi w CDN; sprawdzić nagłówki end-to-end oraz konfigurację hostingu. Ustawienie `no-store` w kodzie jest konieczne, ale nie zastępuje testu rzeczywistej ścieżki CDN.
6. Rejestr audytu zapisuje utworzenie, wysłanie, pierwsze/ostatnie pobranie, odwołanie, wygaśnięcie i wynik odmowy; zapisuje actor, grant ID, file/release ID, czas serwera oraz rezultat. Nie zapisuje pełnego tokenu, URL-u bearer, zawartości rysunku ani niepotrzebnych danych osobowych.
7. Etykieta/rysunek dla zewnętrznego wykonawcy ma numer projektu wewnętrzny, element, wymiary i rewizję. Tożsamość klienta pokazuje wyłącznie w zakresie uzgodnionym z właścicielem. Dokument ma widoczny watermark „wydane dla [odbiorca/zlecenie] — rewizja X”, o ile nie zakłóca czytelności produkcyjnej.
8. Wydanie odwołane lub zastąpione pozostaje w historii dla warsztatu, ale nie jest dostępne odbiorcy. Nowa rewizja wymaga nowego pakietu/grantu; nie nadpisywać obiektu pod tym samym kluczem.

## Kryteria odbioru

1. Test gość A z grantu do wydania 12 pobiera tylko dwie wskazane formatki; zmiana ID projektu, wydania, dokumentu lub warsztatu kończy się odmową bez ujawnienia, czy obiekt istnieje.
2. Po odwołaniu grantu następne żądanie URL aplikacji jest odrzucone; stary cache przeglądarki/CDN nie zwraca treści. Test przeprowadza się przez dokładną produkcyjną ścieżkę dystrybucji. Jeśli użyto direct signed URL, UI nie obiecuje natychmiastowego odcięcia i pokazuje, kiedy dostęp definitywnie wygaśnie według skonfigurowanego TTL/cache.
3. Po wygaśnięciu grant nie generuje nowego signed URL ani pliku. Usunięcie/odwołanie nie wpływa na dostęp warsztatu do własnego archiwum.
4. Zmiana wydania 12 na 13 nie podmienia pliku w starym grancie. Podwykonawca widzi wyłącznie wersję, którą warsztat jawnie przekazał; wydanie 12 oznaczono jako zastąpione i grant odwołano, jeśli nowe wydanie ma obowiązywać.
5. Dziennik poprawnie obejmuje allow/deny i zdarzenia utworzenia, wygaśnięcia/odwołania; nie zawiera sekretnego tokenu ani danych z PDF.
6. Negatywne testy dostępu obejmują brak grantu, obcy warsztat, plik spoza listy, grant wygasły/odwołany, replay tokenu oraz próbę dostępu przez bezpośredni URL Storage.
7. Każdy plik dostępny zewnętrznie ma znaną rewizję/hash, autora wydania i zatwierdzony cel; administrator potrafi odtworzyć manifest wydania.

## Zależności, priorytet i ograniczenia

- **P0:** auth/ACL z `RESEARCH-macierz-autoryzacji-tras-2026-10-05.md`, prywatne artefakty z `RESEARCH-prywatnosc-retencja-dokumentow-2026-10-04.md`, trwały snapshot wydania i jego oryginalny PDF, konfiguracja no-cache/CDN.
- **P1:** tabela/rekord grantów, możliwość zawężenia eksportu do części, audyt, proces udostępniania i odwoływania, test odbiorcy zewnętrznego.
- **P2:** raport pobrań i czasów dostępu oraz integracja z zamówieniami podwykonawczymi; najpierw sprawdzić, czy warsztat w ogóle korzysta z zewnętrznej obróbki.
- Hipoteza do walidacji: warsztat może potrzebować zlecać CNC/okleinowanie poza firmą. Nie znaleziono potwierdzenia w repozytorium ani nie przeprowadzono wywiadu z użytkownikiem.
- To brief techniczny, nie opinia prawna, nie decyzja o sposobie identyfikacji kontrahenta i nie zalecenie włączenia płatnych usług Supabase. Nie zmieniono logiki, bucketów ani danych.

## Punkt wznowienia

- Świeże `origin/main` nadal: `8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude w tej kontroli.
- Poprzedni brief o zmianach w trakcie realizacji: `RESEARCH-zmiany-w-projekcie-w-toku-2026-10-07.md` (commit `002dfc0` na gałęzi researchowej, nie na `main`).
- Następny temat: sprawdzić P0 autoryzacji przy świeżych zmianach Claude; jeżeli bez zmian, zbadać widoki i logikę ręcznego odbioru/niezgodności na poziomie warsztatu, nie ponownie klientowskie reklamacje objęte `RESEARCH-odbior-montaz-reklamacje-2026-10-06.md`.
