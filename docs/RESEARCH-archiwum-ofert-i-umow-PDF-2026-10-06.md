# Niezmienna kopia wystawionej oferty i PDF umowy

Data: 2026-10-06
Baza kodu: `632c3d36126c83f5b6e29e088713cf0cdb07b789` (`origin/main`)
Zakres: pochodzenie i odtwarzalność dokumentów handlowych; brief dla Claude, bez zmiany logiki, cen, umów i ich warunków.

## Problem

Zapisany zestaw danych umowy i ponowne wygenerowanie pliku PDF to nie to samo co zachowanie dokładnego pliku, który otrzymał klient. Renderer, czcionki, układ, dane firmy lub tekst wzorca mogą zmienić się w przyszłym wdrożeniu. Podobnie oferta jest dziś generowana z bieżącego projektu i wyceny. Bez utrwalonego snapshotu wartości, zakresu i samego pliku trudno wykazać, co konkretnie zostało wysłane, a w przypadku zmiany szablonu późniejszy „pobierz PDF” może dać inny dokument.

## Stan sprawdzony w repozytorium

- `src/service.ts`: `ofertaPdf()` pobiera bieżącą analizę projektu, bieżący cennik i ustawienia firmy, po czym zwraca wygenerowany `Buffer`. W repo nie znaleziono osobnego rekordu wystawionej oferty przechowującego snapshot i oryginalne bajty PDF.
- `src/core/contracts.ts`: `Umowa` to zapisane pola `DaneUmowy` oraz `id` i `utworzono`; brak numeru wersji renderera, skrótu dokumentu lub przechowywanego PDF.
- `src/server/app.ts`: `/api/projekty/:id/umowy/:uid/pdf` za każdym razem wywołuje `umowaPdf(u)` i wysyła wynik. Dane umowy są zapisane, ale plik odtwarzany jest aktualnym kodem renderera.
- `web/src/views/Contracts.tsx` wyraźnie komunikuje: „Zapis umowy nie oznacza podpisania umowy.” Ten stan należy zachować: archiwizacja pliku nie może twierdzić, że umowa jest podpisana, wysłana, zaakceptowana ani skuteczna prawnie.
- B03 (`docs/RESEARCH-akceptacja-klienta-wersja-i-zakres-2026-10-05.md`) wymaga powiązania akceptacji zakresu z snapshotem; niniejszy brief dotyczy warstwy dokumentu handlowego i pochodzenia kwoty, nie ponawia projektu portalu akceptacji.

To wynik statycznego przeglądu wskazanych plików. Nie przeglądano danych produkcyjnych, wysłanych e-maili ani kopii PDF u użytkownika.

## Zalecany model

**P1 — przed obsługą wielu pracowników i edycją wzorów dokumentów.** Ustalić z właścicielem, czym w aplikacji jest „projekt PDF”, „wystawiona oferta”, „zapisane dane umowy” i „podpisana umowa”. Nie utożsamiać tych stanów.

1. **Oferta jako artefakt wersjonowany:** zapisać numer, datę utworzenia, status roboczy/wystawiony/anulowany (nazwy do zatwierdzenia), wariant wyceny, kwoty i zakres prezentowany klientowi, podstawowe identyfikatory projektu/rewizji, wersję generatora i hash PDF. Po wystawieniu snapshot pozostaje niezmienny. Zmiana projektu, katalogu, cennika, renderera lub uwag tworzy nową wersję/nową ofertę, nie nadpisuje poprzedniej.
2. **Zachować oryginalne bajty wystawionego PDF** w prywatnym, kontrolowanym magazynie lub innym właścicielsko zatwierdzonym rozwiązaniu. Hash SHA-256 pozwala wykryć różnicę; sam hash nie pozwala odtworzyć pliku. Jeśli przechowywanie binarnego PDF nie jest od razu możliwe, UI musi rozróżnić „wygeneruj aktualny podgląd” od „pobierz wystawiony plik” i nie sugerować, że drugi istnieje.
3. **Umowa: dane + artefakt, bez zmiany statusu prawnego.** Zachować dokładny PDF wygenerowany w chwili jawnego działania użytkownika „zapisz/eksportuj” razem z hashem, czasem, wersją wzorca/generatora i połączeniem z rekordem `Umowa`. Nie nazywać go podpisanym ani nie dopisywać podpisów lub skutków prawnych automatycznie. Korekta umowy po utworzeniu powinna być odrębną wersją z widocznym powiązaniem do poprzedniej, a nie cichą edycją historycznego rekordu.
4. **Pochodzenie ceny:** jeśli oferta lub umowa bazuje na `Projekt.cenaUzgodnionaBrutto`, zachowaj kwotę dokładnie w snapshotcie, w groszach/decimalu zgodnym z istniejącym modelem, a nie przeliczaj jej ze zmienionych kosztów. W przypadku rozbieżności między ceną uzgodnioną, ofertą i ręcznie wpisaną ceną umowy pokaż wyraźne porównanie i wymagaj jawnej decyzji właściciela — bez automatycznej zmiany kwoty. Historycznych umów ani ceny 29 227,60 zł brutto dla Pieszczyńskich nie przeliczaj ani nie nadpisuj.
5. **Idempotentny zapis i odtworzenie:** wielokrotne kliknięcie/powtórzony request nie tworzy kilku dokumentów z różnymi numerami. Użyj idempotency key albo jawnego identyfikatora operacji; powtórne pobranie wystawionego artefaktu zwraca te same bajty i hash. Błąd przechowania PDF ma być widoczny i nie może pokazywać dokumentu jako zarchiwizowanego.
6. **Dostęp i retencja:** artefakty umów/ofert zawierają dane osobowe i kwoty; wymagają P0 ACL, prywatnego storage, `no-store` dla odpowiedzi, ścieżki autoryzowanej oraz zatwierdzonego okresu retencji/backupów. Nie logować treści ani adresów klienta. Link publiczny lub sam `projectId` nie stanowi dostępu.
7. **Wersje generatora:** przechowuj hash i wersję renderera, szablonu oraz (dla oferty) użytych danych wejściowych. Nie wymagaj od przyszłego generatora identycznego ponownego renderowania pliku; oryginałem pozostaje zachowany artefakt, a renderer służy podglądowi nowego wydania.

## Zależności i priorytety

- **P0:** auth/ACL dla API i plików, izolacja projektów, kopia i próba odtworzenia artefaktów.
- **P1:** snapshot wystawionej oferty i PDF, rejestr wersji umowy/artefaktu, powiązanie kwoty z ceną uzgodnioną i wydaniem projektu.
- **P1 przed realną wysyłką klientowi:** decyzja właściciela o statusie „wystawiona/wysłana”, metodzie numeracji, retencji i tym, które wartości wymagają potwierdzenia. E-mail i podpis elektroniczny to oddzielne funkcje, poza zakresem tego briefu.
- **P2:** diff dwóch wersji oferty/umowy w UI oraz raport, kto i kiedy pobrał plik (tylko po akceptacji zakresu audytu i prywatności).

## Kryteria odbioru dla Claude

1. Test: wystaw ofertę za cenę uzgodnioną, zmień koszt katalogowy i dane projektu, a później pobierz tę wystawioną wersję — bajty PDF i SHA-256 pozostają identyczne; nowa oferta jawnie dostaje nowy artefakt.
2. Test: wygeneruj PDF umowy, zaktualizuj renderer i ponownie pobierz zachowany artefakt — hash i bajty historycznego pliku pozostają identyczne; nie jest cicho odtwarzany nowym rendererem.
3. Po zapisaniu/pobraniu draftu nie wyświetlaj etykiety „wystawiona”, „wysłana” lub „podpisana”. Wysłanie i podpis pozostają stanami odrębnymi, gdy zostaną jawnie wdrożone.
4. Niezgodność między kwotą zachowaną w projekcie a kwotą w nowych danych umowy pokazuje obie wartości i blokuje cichą podmianę. Test regresyjny zachowuje `29 227,60 zł` jako niezmienną wartość zapisanej umowy Pieszczyńskich.
5. Powtórzenie tego samego żądania po utracie odpowiedzi sieciowej nie tworzy kolejnego numeru/rekordu; pobieranie niezmiennej wersji działa wielokrotnie.
6. Użytkownik z innego konta/organizacji nie odczyta PDF przez URL ani endpoint; testy obejmują bezpośredni identyfikator projektu, umowy i pliku.
7. Backup i test restore obejmują zarówno rekord metadanych/snapshot, jak i binarny PDF; samo zachowanie hash bez pliku nie jest zaliczeniem.

## Granice

Ten brief nie zmienia żadnej umowy, ceny, warunków ani statusu dokumentu klienta; nie wdraża podpisu elektronicznego, wysyłki e-mail ani opinii prawnej. Nie sprawdzano aktualnych ustawień produkcji Supabase/Vercel, zewnętrznej poczty, podpisu, ani fizycznych dokumentów. Najpierw zweryfikować P0 autoryzację i prywatność.

## Punkt wznowienia

Po publikacji pobrać świeży `origin/main`; sprawdzić P0 API/Storage ACL i ewentualne zmiany Claude w `umovy`, rendererze ofert/umów oraz `cenaUzgodnionaBrutto`. Kolejny etap ma potwierdzić testami, że konkretna wystawiona kwota i PDF są odtwarzalne po aktualizacji projektu i kodu.
