# Research: jawne założenia formatu arkusza w rozkroju

Data: 13.10.2026
Status: zachowanie potwierdzone w kodzie i krótkiej reprodukcji runtime; ryzyko dotyczy wiarygodności planu, a nie wykazanego błędnego wydania CNC.
Zakres: materiały bez wymiarów arkusza, materiały rozliczane powierzchniowo i plan rozkroju. Bez zmian logiki aplikacji.

## Problem

Rozkrój wylicza dokładne wymiary arkusza i liczbę arkuszy także wtedy, gdy wybrany materiał nie ma własnego znanego formatu. W takim przypadku bez widocznego oznaczenia podstawia domyślne wymiary zakładu. Użytkownik może odczytać ten wynik jako potwierdzony plan zakupu/cięcia dla konkretnego materiału.

## Dowody i granice pewności

- **Fakt z kodu:** `src/core/production.ts`, `rozkroj`, jeśli materiał nie ma dodatnich wymiarów arkusza, używa `UstawieniaRozkroju.dlugoscArkuszaMM` i `szerokoscArkuszaMM`. `RaportRozkroju` nie zapisuje, czy wymiary pochodzą z karty materiału czy z ustawień ogólnych; do listy nierozmieszczonych trafiają tylko części za duże dla przyjętego arkusza.
- **Fakt z kodu:** startowy materiał `front-mdf-folia` w `src/core/catalog/materials.ts` jest rozliczany w `metrKwadratowy` i ma wymiary arkusza `0 × 0`. Ten sam wzorzec występuje w `m2()` dla frontów lakierowanych i fornirowanych.
- **Reprodukcja runtime 13.10.2026:** dla katalogowego modułu z frontem `front-mdf-folia` analiza zwróciła arkusz 2070 × 2800 mm z elementem FRONT-D01, choć dane materiału mają `0 × 0` i jednostkę `metrKwadratowy`. Nie było diagnostyki o użyciu formatu zastępczego. Dokumentacja miała inne braki okuć (`UCHWYT`, `ZAWIASY_LICZBA`) i `gotowaDoProdukcji=false`; ta próba **nie** dowodzi, że cały projekt można oznaczyć jako gotowy ani że ktoś użył planu do CNC.
- `docs/WYTYCZNE.md` wymaga uwzględnienia formatu i ilości arkuszy oraz walidacji granic, materiału i kompletności optymalizacji (sekcja 12). `docs/RESEARCH_SILNIKI_ROZKROJU.md` opisuje wyjścia zakupowo-produkcyjne, ale nie znalazłem tam jawnego rozróżnienia między potwierdzonym formatem materiału i formatem zastępczym zakładu.

## Rekomendacja dla Claude

**Priorytet: P1 dla dokładnego planu produkcyjnego; P2 dla podglądu orientacyjnego.** Zachować możliwość podglądu na formacie ogólnym, ale przenosić źródło wymiaru arkusza do wyniku. Wyraźnie oznaczyć podgląd jako orientacyjny, gdy format pochodzi z ustawień zakładu. Materiał rozliczany w m² bez wymiaru/źródła arkusza wymaga decyzji procesu: kupowany na wymiar, przypisany do zatwierdzonego formatu płytowego albo wstrzymany z dokładnego rozkroju. Nie wyprowadzać rzeczywistej liczby arkuszy ani instrukcji cięcia wyłącznie z domyślnego formatu bez widocznego statusu założenia.

## Zależności

- Model materiału musi rozróżniać jednostkę ceny od postaci magazynowej (arkusz, półfabrykat, część kupowana na wymiar).
- `RaportRozkroju` i widoki/eksporty potrzebują źródła oraz statusu wymiarów arkusza, np. `potwierdzone` / `założenie zakładu` / `brak`.
- Wydanie produkcyjne/zakupowe powinno konsumować ten status; zwykły podgląd może pozostać dostępny jako estymacja.
- Potrzebna polityka dla MDF/lakierni/forniru: czy zakład otrzymuje surową płytę, czy gotowe fronty cięte na wymiar.

## Mierzalne kryteria odbioru

1. Test z `front-mdf-folia` (0 × 0, cena/m²) potwierdza, że rozkrój jawnie oznacza format 2070 × 2800 jako założenie z ustawień zakładu, a nie format potwierdzony dla materiału.
2. Dokładne wydanie listy cięć nie może nazywać liczby arkuszy potwierdzoną, jeśli format bazuje na ustawieniu ogólnym; materiał kupowany na wymiar nie trafia do arkuszowego rozkroju.
3. Po przypisaniu dodatniego, potwierdzonego formatu konkretnego materiału raport wskazuje jego źródło i stosuje te wymiary; test graniczny nadal weryfikuje margines, rzaz, obrót i część nierozmieszczoną.
4. Status rozkroju/zakupu i gotowość wydania pokazują osobno: brak geometrii materiału, format zastępczy i format zweryfikowany.

## Kolejka priorytetów

1. **P1:** blokowanie cichego pomijania części o nieprawidłowej geometrii — reprodukcja oraz oczekujący trwały test opisane w `RESEARCH-kompletnosc-czesci-nieprawidlowe-wymiary-2026-10-13.md`.
2. **P1/P2:** rozróżnienie potwierdzonego formatu arkusza i założenia zakładu (ten brief).
3. **P1:** weryfikacja wymiarów i wierceń okuć z konkretnych, czytelnych rysunków producenta przed CNC.
4. **P2:** kolejny świeży przegląd commitów Claude oraz weryfikacja testów naprawionych punktów.

## Punkt wznowienia

Zdalny `HEAD` i `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`; bez nowych commitów Claude. Reprodukcja materiału m² bez wymiarów arkusza użyła danych syntetycznego projektu i nie zmieniła aplikacji ani danych w repozytorium. Następnie: po świeżym fetch sprawdzić, czy Claude dodał status źródła formatu arkusza; jeśli nie, przekazać ten brief i dopiero wtedy analizować kolejną kategorię przepływu produkcyjnego.

## Zakres ochrony

Research-only. Nie zmieniono logiki, ceny uzgodnionej 29 227,60 zł brutto, historycznych umów, katalogu materiałów, danych klientów ani widoczności repozytorium. Test użył syntetycznych danych; katalog roboczy usunięto.
