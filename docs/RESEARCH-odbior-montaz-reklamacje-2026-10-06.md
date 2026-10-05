# Odbiór montażu, lista usterek i obsługa zgłoszeń

Data: 2026-10-06
Baza kodu: `e5fa7c7227b923974239c326c11f38f00f2605e4` (`origin/main`)
Zakres: wymagania workflow po montażu; research i zalecenia dla Claude, bez zmian logiki ani warunków umów.

## Problem i stan obecny

Po montażu zespół potrzebuje jednego, wiarygodnego zapisu: co przekazano, co sprawdzono, jakie odstępstwa lub usterki pozostały, kto i kiedy ma je usunąć oraz do jakiej wersji wykonawczej odnoszą się zdjęcia i naprawy. Gdy te informacje są tylko w swobodnych notatkach lub w osobnym komunikatorze, warsztat może zamknąć projekt bez widocznej listy prac, zgubić kontekst rewizji albo potraktować podpis protokołu jako wyłączenie późniejszych praw klienta.

Statycznie sprawdzony stan repozytorium:

- `Projekt` ma liniowy status do `zakonczony`, termin montażu, `notatkiRobocze` oraz historię statusów złożoną jedynie ze statusu i daty (`src/core/types.ts`, `src/core/statusy.ts`). Nie znaleziono odrębnego modelu protokołu montażu, pozycji usterki ani reklamacji.
- `NotatkaProjektu` ma tekst, datę, flagę załatwienia i datę załatwienia. Nadaje się do prostych notatek roboczych, ale nie zapisuje lokalizacji/części, priorytetu, osoby odpowiedzialnej, dowodu, planu naprawy ani powiązanej rewizji.
- `WydanieProdukcyjne` przechowuje numer, rewizję, niezmienną migawkę i skrót SHA-256; PDF dokumentacji jest odtwarzany z migawki (`src/core/types.ts`, `src/service.ts`). To potencjalny punkt odniesienia dla wydania, które faktycznie wykonano, ale bieżący model nie rejestruje, które wydanie zamontowano/odebrano.
- `src/core/contracts.ts` zawiera istniejącą klauzulę protokołu: strony wskazują w nim ewentualne wady i uzgodniony termin usunięcia; tekst stanowi też, że odbiór nie oznacza rezygnacji z roszczeń i nie ogranicza ustawowych praw. Jest to istniejący tekst umowy, którego ten brief nie zmienia.
- Zmiana statusu nie jest wystarczającym dowodem przekazania ani pełnym śladem biznesowym. Oddzielny brief o audycie zdarzeń pozostaje zależnością.

To przegląd statyczny wybranych modeli i serwisu, nie potwierdzenie kompletności całej aplikacji, przepływów poza repozytorium ani praktyki prawnej konkretnej umowy.

## Dowody prawne i granice automatyzacji

UOKiK opisuje odrębne drogi reklamacji oraz wskazuje, że konsument wybiera podstawę; przedsiębiorca nie może jej narzucić ani zmienić. Przepisy o niezgodności towaru z umową nie mogą być zmieniane na niekorzyść konsumenta. Zobacz [Reklamacja – UOKiK](https://prawakonsumenta.uokik.gov.pl/reklamacja/) i [Niezgodność towaru z umową czy gwarancja – UOKiK](https://prawakonsumenta.uokik.gov.pl/reklamacja/niezgodnosc-czy-gwarancja/). Źródła sprawdzono 2026-10-06.

**Nie przesądzono** kwalifikacji prawnej konkretnej umowy łączącej wykonanie mebla, dostawę i montaż, początku ani długości terminów, odpowiedzialności w konkretnej sytuacji, skutku podpisu czy wymaganego sposobu odpowiedzi. Nie kodować terminów ustawowych, automatycznej odmowy, domniemanej akceptacji, zrzeczenia się roszczeń ani przypisania podstawy prawnej na podstawie ogólnego briefu. Proces i treść komunikatów prawnych wymagają aktualnego przeglądu przez właściwego specjalistę. Brief nie zmienia umów ani historycznych dokumentów.

## Zalecany model pracy

**P1 — po P0 uwierzytelnieniu/autoryzacji i śladzie audytowym.** Ustal z właścicielem, kto może sporządzić protokół, zamknąć montaż, rejestrować zgłoszenie oraz zatwierdzić naprawę. Protokół i zgłoszenie powinny być osobnymi obiektami od ogólnego statusu projektu, notatek, akceptacji projektu przed produkcją i dokumentu umowy.

1. **Protokół montażu/przekazania** zapisuje identyfikator projektu i konkretnego wydania produkcyjnego (numer, rewizja, hash), datę/czas serwera, wykonawcę i uczestników, zakres sprawdzenia, wynik oraz listę uwag. Wynik może opisywać fakt operacyjny, np. „przekazano”, „przekazano z uwagami” lub „pozostały prace”; nazwy i skutki zatwierdza właściciel. Protokół nie może sam oznaczać, że klient utracił prawa lub że mebel jest bez wad.
2. **Pozycja listy usterek/wykończeniówek** jest atomowa: opis problemu, pomieszczenie/moduł/część (jeśli znane), lokalizacja na rysunku lub identyfikator elementu, zdjęcia/dokumenty, data wykrycia, zgłaszający, przypisany pracownik, następny termin operacyjny, status i sposób zamknięcia. Zachowuj historię zmian; wznowienie sprawy nie kasuje wcześniejszego zamknięcia.
3. **Powiązanie z wydaniem wykonanym** jest jawne. Nie opieraj sprawy wyłącznie na bieżącej rewizji projektu, która może być już zmieniona. Zachowaj możliwość wskazania „wydanie nieznane/ustalane” i nie przypisuj go domyślnie do najnowszego. Zdjęcia i obserwacje można wiązać z elementem, ale interfejs musi pozwolić zapisać problem bez odnalezienia części.
4. **Zgłoszenie klienta/reklamacja** odrębne od listy usterek wewnętrznej: zachowaj oryginalną treść i datę otrzymania, kanał, dokumenty, tożsamość odbierającego, żądanie klienta w jego własnych słowach oraz wybraną przez klienta podstawę/ścieżkę tylko wtedy, gdy ją sam wskazał. Nie automatyzuj kwalifikacji prawnej ani odpowiedzi/odmowy. Właściciel zatwierdza terminy i szablony komunikatów po aktualnym przeglądzie prawnym.
5. **Rozdział zdarzeń i ról:** autor, data, przypisanie, zmiana statusu, dodanie/zmiana/usunięcie załącznika, zamknięcie i ponowne otwarcie trafiają do audytowalnej historii. Prawa do kosztów, kontaktów, dokumentów i zgłoszeń wynikają z członkostwa/roli; identyfikator projektu ani niejawny link nie jest autoryzacją.
6. **Załączniki i prywatność:** zdjęcia wnętrz i dokumenty klienta przechowuj prywatnie, z autoryzacją przy pobieraniu, jawnie bez cache pośredniego dla treści prywatnej i z kontrolą retencji. Nie kopiuj danych osobowych ani treści reklamacji do logów technicznych. Zależność: brief prywatności/retencji i P0 ACL.

## Zależności i priorytety

- **P0 blokujące dane produkcyjne:** autoryzacja i izolacja danych; niezawodne zachowanie historycznego snapshotu produkcyjnego; audyt kto/co/kiedy. Nie otwierać portalu ani publicznych linków do zgłoszeń przed ACL.
- **P1 operacyjne:** rejestr przekazania, lista usterek i przypisania, powiązanie z wydaniem, załączniki prywatne, przypomnienia o wewnętrznych terminach.
- **P1 z przeglądem prawnym:** formularz zgłoszenia klienta, katalog statusów i komunikaty, terminy i raportowanie SLA. Żadne prawne terminy nie wynikają z tego briefu.
- **P2:** analityka przyczyn powracających usterek, czas do naprawy i koszty serwisu, jeśli pomiar nie ujawnia nadmiarowych danych klienta.

## Kryteria odbioru dla Claude

1. Po zmianie projektu po montażu protokół nadal wskazuje wydanie użyte do wykonania, a system potrafi odtworzyć jego PDF i hash.
2. Każda uwaga z protokołu może zostać osobną pozycją z lokalizacją, załącznikiem, odpowiedzialnym i datą operacyjną; dashboard pokazuje otwarte pozycje bez wyszukiwania w swobodnych notatkach.
3. Projekt z otwartą listą prac nie znika z widoku warsztatu po zmianie statusu na „zakonczony”; warunek i nazwy statusów operacyjnych zatwierdza właściciel.
4. Testy: utworzyć przekazanie z dwiema uwagami; zamknąć jedną z dowodem; ponownie otworzyć ją bez utraty historii; zmienić bieżący projekt i potwierdzić, że wydanie protokołu się nie zmienia.
5. Testy autoryzacji: użytkownik spoza firmy nie może odczytać projektu, listy usterek, zdjęć, eksportu ani użyć identyfikatora potomka; odwołane członkostwo traci dostęp według mierzalnego SLA ustalonego w briefie ACL.
6. Zgłoszenie klienta zachowuje pierwotną treść i datę. Formularz nie zaznacza domyślnie gwarancji ani innej podstawy, nie generuje odmowy/odpowiedzi prawnej i nie sugeruje utraty ustawowych uprawnień przez podpis odbioru.
7. Historia zmian zapisuje autora, serwerowy czas i rodzaj zdarzenia; prywatny tekst i zdjęcia nie trafiają do logów, nie są dostępne publicznie ani cachowane przez współdzielony CDN.
8. Właściciel może eksportować protokół/listę w formie czytelnej i odtwarzalnej; dokument zawiera widoczne ID/numer wydania i wersję, ale nie ujawnia informacji wewnętrznych nieprzeznaczonych dla klienta.

## Pliki i briefy powiązane

- `src/core/types.ts`: `Projekt`, `NotatkaProjektu`, `WydanieProdukcyjne`.
- `src/service.ts`: `utworzWydanie`, `wydania`, migawka dokumentacji; aktualny model nie wskazuje wydania zrealizowanego na montażu.
- `src/core/statusy.ts`: liniowy cykl statusu projektu.
- `src/core/contracts.ts`: istniejący paragraf odbioru i wad; zachować bez zmian.
- `docs/RESEARCH-akceptacja-klienta-wersja-i-zakres-2026-10-05.md`: wcześniejsza akceptacja zamrożonego zakresu przed produkcją; nie mylić z odbiorem po montażu.
- `docs/RESEARCH-audit-zdarzen-zespolowych-2026-10-05.md`: wymagania dziennika operacji; nie dublować go oddzielnym, niespójnym logiem.
- `docs/RESEARCH-prywatnosc-retencja-dokumentow-2026-10-04.md` i `docs/SECURITY-API-publiczna-przed-kontami-2026-10-04.md`: ACL, prywatne załączniki i cykl życia danych.

## Granice i dalszy krok

Nie zmieniono kodu, testów, umów, cen ani danych klientów. Nie wykonano testu UI ani produkcji; analizę przeprowadzono statycznie. Po publikacji ponownie sprawdzić nowe zmiany Claude, w szczególności P0 auth/ACL, audyt zdarzeń i zachowanie wydań produkcyjnych. Przed wdrożeniem workflow zgłoszeń ustalić z właścicielem i prawnikiem zakres odpowiedzialności, terminy, formularze oraz politykę retencji.
