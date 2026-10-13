# Research: nie pomijaj części o nieprawidłowych wymiarach

Data: 13.10.2026
Status: potwierdzona reprodukcją w uruchomionym kodzie; wymaga trwałego testu regresyjnego i naprawy.
Zakres: kompletność listy części i blokada wydania produkcyjnego. Bez zmian logiki aplikacji.

## Problem

Nieprawidłowa geometria może zniknąć z listy formatek i dokumentacji zamiast pozostawić jawny, przypisany do modułu błąd. Gdy projekt zawiera także poprawny moduł, dokumentacja może nie wykryć brakującej części: status produkcyjny sprawdza części, które udało się utworzyć, a nie zgodność liczby części źródłowych z liczbą części wynikowych.

## Dowody i granice pewności

- **Fakt z kodu:** `src/core/production.ts`, `listaFormatek`, pomija element, gdy `dl`, `sz` lub `gr` nie jest dodatnie (`if (!(dl > 0 && sz > 0 && gr > 0)) return`). Brak wpisu diagnostycznego.
- **Fakt z kodu:** `src/core/technologia.ts`, `dokumentacjaProjektu`, pomija element bez odpowiadającej formatki (`if (!f) continue`). `gotowaDoProdukcji` sprawdza niepustą listę utworzonych części, ich status oraz diagnostykę, ale nie porównuje jej z `zbudowane[].elementy`.
- **Fakt z kodu:** `src/core/builder.ts` wykrywa część błędnych parametrów korpusu przez `ostrzezenia` i zwraca pustą listę elementów. Te ostrzeżenia są na `ZbudowanyModul`; analiza w `src/service.ts` przekazuje do walidacji projekt, formatki i zbudowane moduły, ale nie przekazuje `ostrzezenia` buildera do `dokumentacjaProjektu`.
- **Fakt z kodu:** `NowyModul` w `src/service.ts` przyjmuje wymiary, a `nowyModul` przypisuje je bez lokalnej walidacji dodatniości/finitości. Trasy HTTP i MCP wołają tę usługę. Walidator projektu nie sprawdza dodatniości wymiarów modułu.
- **Reprodukcja runtime 13.10.2026:** przez usługę utworzono dwa moduły bez frontów, oba o szerokości 600 i wysokości 720 mm; jeden miał prawidłową głębokość 560 mm, drugi głębokość −1 mm. Dla wadliwego modułu konstruktor zwrócił pięć elementów, lecz dokumentacja zawierała tylko jego `BLAT` — boki i oba wieńce zniknęły. `diagnostyka` nie zawierała żadnego wpisu dla modułu, a `gotowaDoProdukcji` wyniosło **true**. Próbę wykonano na bieżącym kodzie gałęzi researchowej przez `tsx`; plik danych testowych usunięto. To potwierdza konkretny scenariusz, nie wszystkie możliwe uszkodzenia geometrii.
- `docs/WYTYCZNE.md` wymaga, aby żadna szafka ani wykonywana część nie została pominięta (sekcja 2), błędy wskazywały obiekt i przyczynę (sekcja 10), a testy zapewniały kompletność sztuk i brak ujemnych wymiarów (sekcja 14). Obecne T08 obejmuje elementy nierozmieszczone po rozkroju; niniejsza luka występuje wcześniej, przy konwersji konstrukcji na formatki.

## Rekomendacja dla Claude

**Priorytet: P1 — blokada bezpieczeństwa produkcyjnego.** Przed wygenerowaniem BOM-u, dokumentacji lub wydania sprawdzać każdy element zbudowanego modułu. Niewłaściwy wymiar, brak formatki albo nieprzekazane ostrzeżenie konstruktora powinny tworzyć diagnostykę `blad`/`brakDanych` powiązaną z ID modułu i kodem elementu. Nie usuwać wadliwego elementu po cichu i nie zamieniać wymiaru na zero. Nie oznaczać dokumentacji jako gotowej, dopóki nie wyjaśniono rozbieżności.

## Zależności

- Walidacja zakresu wejściowego dla wymiarów modułu na granicy usługi, z obsługą starych/uszkodzonych danych zapisanych wcześniej.
- Przepływ ostrzeżeń z `zbudujModul`/`zbudujMebel` do diagnostyki dokumentacji.
- Jednoznaczne powiązanie błędu z `modulId` i `kodElementu`; diagnostyka na poziomie modułu wystarcza, jeśli element nie powstał.
- Spójność `listaFormatek`, `Czesc[]`, listy rozkroju i statusu `gotowaDoProdukcji`.

## Kryteria odbioru

1. Trwały test integracyjny odtwarzający powyższy przypadek: projekt z jednym prawidłowym i jednym wadliwym modułem nie pomija jego części bez śladu; diagnostyka zawiera ID/nazwę i przyczynę, a `gotowaDoProdukcji` jest `false`.
2. Test integracyjny: element konstruktora z niepoprawnym wymiarem (w tym `NaN` w danych legacy, jeśli może wystąpić po odczycie) jest jawnie zgłoszony; żaden artefakt produkcyjny nie zostaje oznaczony jako kompletny.
3. Dla poprawnego projektu liczba i kody produkowanych części w konstrukcji, formatkach, dokumentacji i wydaniu są zgodne; T08 dla części nierozmieszczonych nadal działa niezależnie.
4. `gotowaDoProdukcji` pozostaje `false` przy każdej rozbieżności lub błędzie geometrii, także gdy w projekcie są inne poprawne moduły.

## Priorytet kolejki

1. **P1:** kompletność części przy niepoprawnych wymiarach / brakujących formatkach (ten brief).
2. **P1:** potwierdzenie geometrii konkretnych wariantów okuć na czytelnych rysunkach producenta; niezweryfikowane dane nadal blokują CNC.
3. **P2:** ponowny przegląd zmian Claude po aktualizacji `origin/main`.

## Punkt wznowienia

Ostatnia znana rewizja `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`; ponowne pobranie zarówno przez SSH, jak i HTTPS nie wykazało nowszego commita. Na gałęzi researchowej reprodukcja runtime potwierdziła pominięcie czterech części i fałszywy status gotowości w opisanym przypadku. Testy sąsiednich ścieżek: `npx tsx --test src/service.test.ts src/technologia.test.ts` — 19/19 zaliczone po przekierowaniu katalogu tymczasowego do workspace; nie zawierają jeszcze trwałego testu reprodukującego tę lukę. Następny krok: przekazać brief Claude przez dokumentację i w kolejnym przeglądzie sprawdzić trwały test oraz naprawę.

## Ochrona danych i zakres zmian

Research-only. Nie zmieniono logiki aplikacji, widoczności repozytorium, danych klientów, uzgodnionej ceny 29 227,60 zł brutto ani historycznych umów. Reprodukcja użyła wyłącznie syntetycznych danych i plik testowy został usunięty; nie przepisano ani nie opublikowano żadnych danych osobowych.
