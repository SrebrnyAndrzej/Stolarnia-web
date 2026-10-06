# Karta pracy, postęp produkcji i śledzenie części

Data: 2026-10-06
Baza kodu: `5cc7b60185ca5ff6cb1af6f6e0c8165a148a2fcd` (`origin/main`)
Zakres: operacyjny przepływ po wydaniu produkcyjnym; wymagania dla Claude, bez zmian logiki.

## Problem i aktualny stan

Wydanie produkcyjne zawiera geometrię części i opis technologii, ale nie jest jeszcze kartą wykonania: nie zapisuje, czy część została wycięta, oklejona, nawiercona, zmontowana, sprawdzona, odłożona do poprawki ani kto wykonał daną czynność. Status projektu (`src/core/statusy.ts`) ma ogólne etapy, np. „Produkcja” i „Gotowe do montażu”, ale nie pokazuje kolejki stanowisk ani części w toku.

Potwierdzenia z kodu:

- `WydanieProdukcyjne` przechowuje numer, rewizję, snapshot projektu/części/dokumentacji, SHA-256 i stan kompletności dokumentacji (`src/core/types.ts`, `src/service.ts`).
- `Operacja` w `src/core/types.ts` opisuje cechę geometryczną, np. otwór/rowek, jego pozycję, parametry i źródło reguły. Nie ma pól wykonawcy, stanowiska, rozpoczęcia, wyniku ani zakończenia.
- `StatusCzesci` to `gotowa | robocza | brakDanych`: opisuje status danych technologicznych, a nie postęp fizycznej pracy.
- Nie znaleziono modelu zlecenia warsztatowego/karty pracy, pozycji WIP ani zdarzeń wykonania operacji; statyczne wyszukiwanie nie obejmuje ewidencji prowadzonej poza repo.

## Źródła i zakres ich znaczenia

- [GS1 Global Traceability Standard — aktualny standard](https://www.gs1.org/standards/gs1-global-traceability-standard/current-standard): zdarzenie identyfikowalności wiąże obiekt z tym, co/kiedy/gdzie/dlaczego nastąpiło; określa też poziomy identyfikacji (klasa/partia/egzemplarz) i wskazuje, że poziom szczegółowości dobiera się do celu.
- [GS1 EPCIS & CBV](https://www.gs1.org/standards/epcis): wspólny model zdarzeń dla informacji o statusie, lokalizacji, ruchu i łańcuchu przekazania. To inspiracja dla modelu zdarzeń, nie rekomendacja wdrożenia EPCIS ani wymóg certyfikacji warsztatu.
- [NIST, Supply Chain Traceability Principles: A Manufacturing Meta-Framework](https://www.nist.gov/publications/supply-chain-traceability-principles-manufacturing-meta-framework), opublikowane 2026: podejście do łączenia danych operacji i pochodzenia jako weryfikowalnej historii zdarzeń. Aplikacja nie musi implementować blockchain/DLT ani publikować danych na zewnątrz.

Źródła wspierają wzorzec zdarzeń i powiązanie procesu, ale nie wyznaczają właściwej marszruty dla tej stolarni. Kolejność operacji, poziom śledzenia (pojedyncza część czy partia) i mierzone czasy wymagają krótkiego warsztatu z pracownikami.

## Zalecany model

**P1 — po P0 auth/ACL, niezmiennym wydaniu produkcyjnym, audycie oraz kopii/restore.** Zacząć od lekkiej karty pracy i jawnych zdarzeń; nie budować pełnego systemu MES/ERP bez zmierzonego zapotrzebowania.

1. **Zlecenie wykonawcze** wskazuje projekt, konkretne wydanie (`numer`, `rewizja`, `skrot`), planowaną ilość, termin wewnętrzny oraz zatwierdzoną marszrutę i priorytet. Wydanie techniczne i postęp wykonania pozostają odrębnymi bytami.
2. **Pozycje karty** wskazują trwałe `czescId`/podpis części, planowaną i fizyczną liczbę sztuk, materiał, operacje, kolejność/zależności, stanowisko, status i ewentualne zablokowanie. Części `robocza` lub `brakDanych` nie mogą być przedstawiane jako normalnie zwolnione do pracy. Reguła akceptacji wydania wymaga polityki właściciela i zgodności z `gotowaDoProdukcji`.
3. **Marszruta konfigurowalna przez warsztat**, np. rozkrój → okleinowanie → wiercenie/frezowanie → montaż → kontrola → pakowanie, z możliwością pominięcia lub dodania kroku z uzasadnieniem. To przykładowy przepływ, nie narzucony proces. Operacje z `Operacja` opisują obróbkę do wykonania; zdarzenie pracy dokumentuje wykonanie.
4. **Zdarzenia append-only:** utworzenie/zatwierdzenie karty, przypisanie/rozpoczęcie/ukończenie kroku, częściowa ilość dobra, złom/brak, hold, przekazanie między stanowiskami, poprawka i ponowna kontrola. Każde zdarzenie zawiera identyfikator karty/pozycji, krok, serwerowy czas, aktora z sesji, stanowisko/lokalizację, rezultat ilościowy i (dla problemu) kod/przyczynę. Korektę wykonania zapisuje się nowym zdarzeniem, nie edycją historii.
5. **Wersjonowanie i zmiana konstrukcji:** start pracy wiąże element ze snapshotem wydania. Gdy pojawia się nowsze wydanie, system porównuje części/operacje i pokazuje nie rozpoczęte, rozpoczęte oraz ukończone pozycje do decyzji. Nie kasuje ani nie przepina automatycznie zakończonych zdarzeń; właściciel/technolog jawnie wstrzymuje, kontynuuje, złomuje lub wydaje poprawkę.
6. **Poziom identyfikacji:** grupuj identyczne elementy po `podpis` i liczbie, jeśli wystarczy to do rozliczenia partii; nadaj unikatowy identyfikator sztuce, gdy naprawa, pomyłki, uszkodzenia lub produkcja równoległa wymagają śledzenia egzemplarza. Pozostaw ID wewnętrzne — nie wymagaj GTIN/GS1 od stolarni bez potrzeby wymiany danych handlowych.
7. **Etykieta i skan:** drukowana karta/etykieta pokazuje zrozumiały numer projektu, moduł/element, ilość, rewizję wydania, materiał, wymiary/obrzeża i postęp, bez danych kontaktowych klienta. QR koduje niejawny token identyfikacyjny, nie PII; po skanie system nadal wymaga sesji i autoryzacji. Druk papierowy/manualny wpis pozostaje awaryjną ścieżką dla stanowisk bez urządzeń.
8. **Widok hali:** kolejki „do zrobienia”, „w toku”, „zablokowane”, „do kontroli” i „gotowe do przekazania”; filtr stanowisko/pracownik/projekt/termin; pokazuj problem i następny krok. Nie mierz czasu pracownika ukrycie. Rejestr czasu aktywności, produktywności lub raporty indywidualne wymagają osobnej decyzji właściciela, jasnej informacji i oceny prywatności.
9. **Powiązanie z materiałem i jakością:** rozchód/odpady z karty można później połączyć z briefem magazynu `RESEARCH-magazyn-zakupy-zapotrzebowanie-2026-10-06.md`. Usterka produkcyjna pozostaje powiązana z pozycją i trafia do kontroli/rework; usterka po montażu przechodzi do osobnego workflow `RESEARCH-odbior-montaz-reklamacje-2026-10-06.md`.
10. **Odporność sieci:** skan/wykonanie jest mutacją z idempotency key. Brak odpowiedzi po zapisie nie może podwajać wykonanej ilości. Widok wskazuje ostatnie potwierdzone zdarzenie; nie udaje zapisu offline. Zależność: `RESEARCH-tryb-offline-i-awarie-sieci-2026-10-05.md`.

## Priorytety i zależności

- **P0:** ACL dla endpointów, MCP i prywatnych plików; zapis audytowy; niezmienność wydania i migracje schematu; próba odtworzenia danych.
- **P1:** lista zleceń/karty, stacje/etapy, przejścia ilościowe, blokady i poprawki, wyszukiwanie oraz drukowalny traveler z QR.
- **P2:** tablica obciążenia stanowisk i planowanie terminów/pojemności, planowane vs rzeczywiste czasy, raport przyczyn poprawek i analityka wykorzystania materiału.
- Przed wyborem P1 ustalić z 1–2 pracownikami: prawdziwe stanowiska, wspólne/indywidualne ID części, liczbę identycznych elementów, częste wyjątki, drukarkę/rozmiar etykiety i dostępność urządzeń.

## Mierzalne kryteria odbioru dla Claude

1. Zlecenie produkcyjne wskazuje dokładny hash i numer wydania. Zmiana projektu nie zmienia istniejącej karty ani geometrii już rozpoczętych/wykonanych pozycji.
2. Dla partii 6 identycznych elementów test przechodzi: 4 dobre, 1 uszkodzona, 1 do poprawy; suma stanu jest 6 i żadne ponowne wysłanie tego samego eventu nie nalicza elementu ponownie.
3. Skan/klik „ukończ” jest odrzucany dla zależności nieukończonej; dozwolone pominięcie ma autora i uzasadnienie. Wstrzymane/brak-danych pozycje nie znikają z tablicy.
4. Wydanie 12 zostało rozpoczęte, a następnie superseded wydaniem 13: system pokazuje różnice części/operacji i wymaga decyzji dla każdej pozycji; zdarzenia wydania 12 pozostają odtwarzalne.
5. Poprawka jest nowym zadaniem powiązanym z oryginalną pozycją i przyczyną; nie edytuje wstecz pierwotnego wyniku kontroli.
6. QR/URL nie daje dostępu anonimowi ani innemu warsztatowi; test IDOR obejmuje projekt, wydanie, pozycję, event i eksport etykiet. Revoke członkostwa działa zgodnie z zatwierdzonym SLA.
7. Test utraty odpowiedzi po zatwierdzeniu eventu i ponownego skanu potwierdza pojedynczy ruch; konflikt z drugim użytkownikiem nie kasuje eventów ani ich kolejności.
8. Etykieta czytelnie pokazuje projekt/element/ilość/rewizję/materiał, drukuje się w ustalonym rozmiarze, jest skanowalna z testowego urządzenia warsztatu i nie zawiera imienia/adresu/telefonu klienta.
9. Pracownik bez uprawnienia do nadzoru widzi tylko przydzielone pozycje i potrzebne dane techniczne; raport czasu/pracownika nie powstaje, jeśli nie zatwierdzono osobnego celu i polityki.

## Ograniczenia i punkt wznowienia

Nie wykonano obserwacji hali, nie znamy obecnych stanowisk, urządzeń ani systemu papierowego; proponowana marszruta jest przykładem do walidacji z warsztatem. Nie zmieniono kodu, operacji technologicznych, ustawień produkcyjnych ani danych. Nie przeprowadzono testów aplikacji, bo brief jest dokumentacyjny. Po publikacji sprawdzić świeże zmiany Claude i P0 auth; w razie wdrożenia karty pracy przeprowadzić test z rzeczywistym testowym zleceniem na próbnych danych, bez klienta i bez zwolnienia nieweryfikowanych wierceń do produkcji.

Ostatnia sprawdzona rewizja: `5cc7b60185ca5ff6cb1af6f6e0c8165a148a2fcd`. Następny temat: status potwierdzonych zgód/licencji na zdjęcia katalogowe; jeśli brak odpowiedzi od właściciela, kontynuować przegląd zmian Claude, P0 auth oraz ścieżki blokowania niezatwierdzonych danych produkcyjnych.
