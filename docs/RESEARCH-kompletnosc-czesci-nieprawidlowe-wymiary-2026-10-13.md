# Research: nie pomijaj części o nieprawidłowych wymiarach

Data: 13.10.2026
Status: potwierdzona luka w przepływie kodu; scenariusz wymaga testu regresyjnego przed zamknięciem.
Zakres: kompletność listy części i blokada wydania produkcyjnego. Bez zmian logiki aplikacji.

## Problem

Nieprawidłowa geometria może zniknąć z listy formatek i dokumentacji zamiast pozostawić jawny, przypisany do modułu błąd. Gdy projekt zawiera także poprawny moduł, dokumentacja może nie wykryć brakującej części: status produkcyjny sprawdza części, które udało się utworzyć, a nie zgodność liczby części źródłowych z liczbą części wynikowych.

## Dowody i granice pewności

- **Fakt z kodu:** `src/core/production.ts`, `listaFormatek`, pomija element, gdy `dl`, `sz` lub `gr` nie jest dodatnie (`if (!(dl > 0 && sz > 0 && gr > 0)) return`). Brak wpisu diagnostycznego.
- **Fakt z kodu:** `src/core/technologia.ts`, `dokumentacjaProjektu`, pomija element bez odpowiadającej formatki (`if (!f) continue`). `gotowaDoProdukcji` sprawdza niepustą listę utworzonych części, ich status oraz diagnostykę, ale nie porównuje jej z `zbudowane[].elementy`.
- **Fakt z kodu:** `src/core/builder.ts` wykrywa część błędnych parametrów korpusu przez `ostrzezenia` i zwraca pustą listę elementów. Te ostrzeżenia są na `ZbudowanyModul`; analiza w `src/service.ts` przekazuje do walidacji projekt, formatki i zbudowane moduły, ale nie przekazuje `ostrzezenia` buildera do `dokumentacjaProjektu`.
- **Fakt z kodu:** `NowyModul` w `src/service.ts` przyjmuje wymiary, a `nowyModul` przypisuje je bez lokalnej walidacji dodatniości/finitości. Trasy HTTP i MCP wołają tę usługę. Walidator projektu nie sprawdza dodatniości wymiarów modułu.
- **Konsekwencja wyprowadzona z kodu, jeszcze niepotwierdzona testem:** w projekcie z jednym poprawnym modułem i drugim modułem o wymiarze powodującym pustą/odrzuconą geometrię, brakujący moduł/części mogą nie dać diagnostyki blokującej, a dokumentacja może pozostać gotowa, jeśli reszta spełnia warunki. To należy odtworzyć testem integracyjnym przed traktowaniem jako runtime-confirmed.
- `docs/WYTYCZNE.md` wymaga, aby żadna szafka ani wykonywana część nie została pominięta (sekcja 2), błędy wskazywały obiekt i przyczynę (sekcja 10), a testy zapewniały kompletność sztuk i brak ujemnych wymiarów (sekcja 14). Obecne T08 obejmuje elementy nierozmieszczone po rozkroju; niniejsza luka występuje wcześniej, przy konwersji konstrukcji na formatki.

## Rekomendacja dla Claude

**Priorytet: P1 — blokada bezpieczeństwa produkcyjnego.** Przed wygenerowaniem BOM-u, dokumentacji lub wydania sprawdzać każdy element zbudowanego modułu. Niewłaściwy wymiar, brak formatki albo nieprzekazane ostrzeżenie konstruktora powinny tworzyć diagnostykę `blad`/`brakDanych` powiązaną z ID modułu i kodem elementu. Nie usuwać wadliwego elementu po cichu i nie zamieniać wymiaru na zero. Nie oznaczać dokumentacji jako gotowej, dopóki nie wyjaśniono rozbieżności.

## Zależności

- Walidacja zakresu wejściowego dla wymiarów modułu na granicy usługi, z obsługą starych/uszkodzonych danych zapisanych wcześniej.
- Przepływ ostrzeżeń z `zbudujModul`/`zbudujMebel` do diagnostyki dokumentacji.
- Jednoznaczne powiązanie błędu z `modulId` i `kodElementu`; diagnostyka na poziomie modułu wystarcza, jeśli element nie powstał.
- Spójność `listaFormatek`, `Czesc[]`, listy rozkroju i statusu `gotowaDoProdukcji`.

## Kryteria odbioru

1. Test integracyjny: projekt z jednym prawidłowym modułem i jednym modułem z szerokością, wysokością lub głębokością równą zero/ujemną nie gubi wadliwego modułu bez śladu; jego diagnostyka zawiera ID/nazwę i przyczynę.
2. Test integracyjny: element konstruktora z niepoprawnym wymiarem (w tym `NaN` w danych legacy, jeśli może wystąpić po odczycie) jest jawnie zgłoszony; żaden artefakt produkcyjny nie zostaje oznaczony jako kompletny.
3. Dla poprawnego projektu liczba i kody produkowanych części w konstrukcji, formatkach, dokumentacji i wydaniu są zgodne; T08 dla części nierozmieszczonych nadal działa niezależnie.
4. `gotowaDoProdukcji` pozostaje `false` przy każdej rozbieżności lub błędzie geometrii, także gdy w projekcie są inne poprawne moduły.

## Priorytet kolejki

1. **P1:** kompletność części przy niepoprawnych wymiarach / brakujących formatkach (ten brief).
2. **P1:** potwierdzenie geometrii konkretnych wariantów okuć na czytelnych rysunkach producenta; niezweryfikowane dane nadal blokują CNC.
3. **P2:** ponowny przegląd zmian Claude po aktualizacji `origin/main`.

## Punkt wznowienia

Ostatnia sprawdzona rewizja `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3` (brak nowych commitów Claude). Analiza opiera się na kodzie gałęzi researchowej i wytycznych; nie uruchamiano jeszcze reprodukcji testowej. Następny krok: sprawdzić `origin/main`, a jeśli bez zmian, przekazać brief Claude przez dokumentację i w kolejnym przeglądzie zweryfikować regresję po implementacji.

## Ochrona danych i zakres zmian

Research-only. Nie zmieniono logiki aplikacji, widoczności repozytorium, danych klientów, uzgodnionej ceny 29 227,60 zł brutto ani historycznych umów. Nie przepisano ani nie opublikowano żadnych danych osobowych.
