# Research: wydanie produkcyjne mimo braku części możliwych do rozkroju

Data: 2026-10-13 10:06 Europe/Warsaw
Zakres: bramka gotowości dokumentacji i wydania produkcyjnego w Stolarnia-web
Status: odtworzone syntetycznie; nie dowodzi wystąpienia na rzeczywistym zleceniu.

## Problem

Projekt może zostać oznaczony jako `gotowaDoProdukcji=true`, a usługa może zaakceptować jego wydanie z `tylkoKompletne=true`, mimo że każda wygenerowana formatka jest zgłoszona jako nierozmieszczona na arkuszu. W praktyce bramka „kompletne” nie jest spójna z możliwością wykonania wszystkich części z raportowanego materiału.

## Dowody

- W `src/core/technologia.ts` `gotowaDoProdukcji` zależy od niepustej listy części, statusu każdej części oraz diagnostyk. `WejscieDokumentacji` nie zawiera raportu rozkroju ani statusu części nierozmieszczonych.
- `src/service.ts` tworzy raport rozkroju w `analiza()`, lecz `dokumentacja()` przekazuje do `dokumentacjaProjektu()` jedynie projekt, zbudowane moduły, formatki, ustawienia i walidację projektu. `utworzWydanie(..., { tylkoKompletne: true })` sprawdza wyłącznie `dokumentacja.gotowaDoProdukcji`.
- **Reprodukcja runtime 13.10.2026, dane syntetyczne:** projekt z jednym modułem `base-shelves-600`, materiałem z dodatnim, ale celowo niewystarczającym formatem 100 × 100 mm i ustawionymi zgodami technologicznymi wygenerował 4 formatki. Raport rozkroju: 0 rozmieszczonych, 4 nierozmieszczone. Dokumentacja mimo to zwróciła `gotowaDoProdukcji=true`, a `utworzWydanie(..., { tylkoKompletne: true })` zaakceptowało wydanie z `gotowaDoProdukcji=true`.
- Próba używała wyłącznie losowego syntetycznego projektu i testowej bazy. Nie sprawdzono żadnego zlecenia klienta ani fizycznego procesu CNC. Dodatnie wymiary są poprawne składniowo; nie reprezentują zatwierdzonego, rzeczywistego formatu płyty.
- Istniejące ostrzeżenia nierozmieszczonych formatek w widoku produkcji/MCP nie usuwają niespójności bramki wydania. Nie twierdzimy, że problem jest bez ostrzeżeń w całym UI.

## Rekomendacja dla Claude

**Priorytet: P1 — integralność wydania produkcyjnego.** Gotowość dokumentacji i wydanie oznaczone jako kompletne powinny uwzględniać raport rozkroju z tej samej rewizji projektu. Gdy choć jedna wymagana formatka nie jest rozmieszczona, blokować `tylkoKompletne=true` i nie oznaczać wydania jako gotowego. Wydanie robocze może pozostać możliwe, ale musi jasno zachować status braków. Nie wprowadzać cichego fallbacku ani nie usuwać alertów.

**Zależności:**

- Przekazać do obliczania gotowości raport rozkroju / kompletność formatowania z identycznego snapshotu projektu i ustawień.
- Rozróżnić wymagane do wykonania formatki od pozycji, które z definicji nie trafiają do rozkroju arkuszowego (np. elementy kupowane na wymiar), jeśli model procesu takie przypadki obsługuje.
- Uzgodnić semantykę wydania roboczego i gotowego między API, UI, MCP i PDF.

## Mierzalne kryteria odbioru

1. Test usługi z prawidłowo wygenerowanymi formatkami i arkuszem 100 × 100 mm potwierdza: wszystkie niepasujące formatki są nierozmieszczone, `gotowaDoProdukcji=false`, a wydanie z `tylkoKompletne=true` jest odrzucone.
2. Wydanie robocze dla tego samego przypadku, jeśli dozwolone, zwraca wyraźny status niegotowy i zachowuje listę nierozmieszczonych części w powiązanej dokumentacji/raporcie.
3. Kontrolny test z arkuszem wystarczającym dla wszystkich elementów potwierdza, że gotowość może być `true` pod warunkiem spełnienia pozostałych istniejących reguł.
4. Test potwierdza, że wydanie, dokumentacja i raport odnoszą się do tej samej rewizji projektu oraz materiałów; zmiana formatu arkusza pomiędzy obliczeniami nie pozwala użyć starej pozytywnej bramki.
5. UI, API, MCP i PDF nie mogą nazywać wydania „gotowym” przy nierozmieszczonych elementach wymaganych do wykonania.

## Punkt wznowienia

Zdalny `origin/main` sprawdzony w tym cyklu: `8230275ad6dea52109f581c793bdd8d6f08684d3`; bez nowych commitów Claude. Kod źródłowy w obszarze bramki dokumentacji i wydania nie różni się między lokalnym materiałem badawczym a `origin/main`. Następnie: po kolejnym świeżym fetch sprawdzić, czy Claude dodał bramkę opartą o raport rozkroju i regresję usługi; jeśli nie, przekazać brief i kontynuować przegląd pozostałych ryzyk kompletu produkcyjnego.

## Ochrona danych i zakres zmian

Badanie i zmiana w tym cyklu dotyczą wyłącznie dokumentacji. Nie zmieniono logiki aplikacji, danych klientów, katalogu, uzgodnionej ceny 29 227,60 zł brutto ani historycznych umów. Dane reprodukcji są syntetyczne i nie zawierają danych osobowych ani sekretów.
