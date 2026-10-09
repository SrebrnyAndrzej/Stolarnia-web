# Potwierdzanie operacji i bezpieczeństwo operatora w MCP

Data: 2026-10-09
Baza przeglądu: `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3`
Zakres: semantyka i przepływy wywołań narzędzi MCP; analiza statyczna `src/mcp/server.ts` i wybranych operacji usługi. Nie wywoływano narzędzi zapisujących, nie wykonywano żądań do produkcji i nie zmieniano kodu aplikacji.

## Ustalenia

W badanej rewizji serwer rejestruje 44 narzędzia. 16 deklaruje `annotations`; wśród nich 14 ma `readOnlyHint: true`, a dwa narzędzia usuwające mają `destructiveHint: true`. Pozostałe 28 nie deklaruje adnotacji zachowania. Zliczenie dotyczy jawnych deklaracji w pliku, nie dowodzi, jak konkretny klient przedstawia narzędzia użytkownikowi ani jak SDK interpretuje brakujące pola.

`usun_projekt` opisuje trwale usunięcie i tekstowo poleca „Potwierdź z użytkownikiem przed użyciem”, ale nie ma `destructiveHint`. `usun_modul` ma tę adnotację. Jest to niespójność katalogu i wskazówka modelowi, nie mechanizm, który samodzielnie blokuje wykonanie.

`utworz_wydanie_produkcyjne` tworzy niezmienną migawkę i hash SHA-256. `tylkoKompletne=true` odmawia wydania z brakami dokumentacji, ale nie oznacza ludzkiego potwierdzenia ani akceptacji klienta. Brak adnotacji operacji zapisu/zmiany przy wydaniu może sprawić, że klientowi trudniej rozpoznać wagę wywołania. Stan i zachowanie widocznego klienta MCP nie zostały sprawdzone.

`zapisz_szkic_pdf` i `zapisz_dokumentacje_pdf` przyjmują `sciezka`; ta druga bezpośrednio przekazuje wartość do `writeFileSync(a.sciezka, pdf)`. Statycznie nie widać ograniczenia do kontrolowanego katalogu ani ochrony przed ścieżką wykraczającą poza katalog docelowy. Nie testowano rzeczywistego zapisu, uprawnień procesu ani ekspozycji endpointu. To zakres wymagający walidacji niezależnej od potwierdzenia w UI.

Wiele pozostałych narzędzi tworzy lub modyfikuje projekty, ceny, ustawienia warsztatu, pomieszczenia, ściany, moduły, konfiguracje konstrukcyjne i notatki. Brak adnotacji nie zmienia ich zachowania; utrudnia klientowi, który korzysta z metadanych, rozróżnienie odczytu od zmiany.

## Dowód z protokołu

Wersjonowana specyfikacja MCP z 2025-11-25 opisuje narzędzia jako model-controlled: model może odkrywać i wywoływać je automatycznie, a protokół nie narzuca konkretnego modelu interakcji. Jednocześnie aplikacje powinny zachowywać człowieka w pętli i przedstawiać potwierdzenia operacji. Specyfikacja zaleca potwierdzanie operacji wrażliwych przez klienta, pokazanie użytkownikowi argumentów przed wywołaniem oraz logowanie użycia.

`annotations` są opcjonalne; klienci muszą traktować je jako niezaufane, chyba że serwer jest zaufany. Dlatego adnotacje służą do prezentacji i routingu, lecz nie są autoryzacją, potwierdzeniem ani kontrolą skutków ubocznych. Serwer pozostaje odpowiedzialny za walidację, kontrolę dostępu, limity i bezpieczne wyniki.

## Zalecenia dla Claude

**P0 — wydanie produkcyjne i trwałe usuwanie:** wydzielić jawne etapy podglądu i wykonania dla `utworz_wydanie_produkcyjne` oraz `usun_projekt`. Przed wykonaniem klient powinien pokazać identyfikator projektu, numer/referencję rewizji, wynik kompletności i dokładny skutek, a człowiek potwierdza konkretną operację. Potwierdzenie dla jednej rewizji nie może autoryzować późniejszej rewizji: etap wykonania ma sprawdzić aktualną rewizję względem tej pokazanej w podglądzie. Nie opierać tego na samym opisie narzędzia, nazwie ani `destructiveHint`.

**P0 — zapis plików:** nie przyjmować dowolnej ścieżki systemowej od klienta. Preferować zwrócenie PDF jako artefaktu/zasobu do pobrania albo zapisywać go w katalogu kontrolowanym przez serwer pod wygenerowaną nazwą. Jeśli zapis ścieżki jest wymagany, canonicalizować ją, ograniczyć do zatwierdzonego katalogu i odrzucać traversal, ścieżki absolutne, kolizje nazw oraz nadpisanie istniejącego pliku bez osobnej zgody.

**P1 — spójna deklaracja narzędzi:** utworzyć tabelę wszystkich narzędzi: odczyt, modyfikacja odwracalna, operacja wrażliwa/destrukcyjna, zapis pliku, wydanie zewnętrzne. Uzupełnić `readOnlyHint`, `destructiveHint`, `idempotentHint` i `openWorldHint` zgodnie z prawdziwym zachowaniem, zwłaszcza rozróżniając zapis roboczy od nieodwracalnego/skutkującego produkcją. Nie oznaczać narzędzia jako read-only, jeśli pośrednio zmienia dane lub emituje zdarzenia.

**P1 — ślad działania:** rejestrować aktora, nazwę narzędzia, projekt/rewizję, czas, wynik, decyzję o potwierdzeniu oraz identyfikator korelacyjny. Nie rejestrować tokenów, pełnych danych klientów, PDF ani niepotrzebnych argumentów wrażliwych. Uzupełniać istniejący brief o dzienniku zdarzeń zespołowych, nie traktować logu technicznego jako źródła uprawnień.

**P2 — czytelność interfejsu klienta:** sprawdzić dla każdego obsługiwanego klienta, czy ujawnia listę narzędzi, wskaźnik wywołania i argumenty, umożliwia odmowę i prezentuje zgodę dla operacji wrażliwych. Ponieważ specyfikacja nie wymusza konkretnego interfejsu, serwer nie może polegać na tym, że każda aplikacja MCP pokaże potwierdzenie.

## Kryteria odbioru

1. Testy kontraktowe obejmują każde z 44 narzędzi i blokują nową rejestrację bez klasyfikacji skutków ubocznych oraz polityki uprawnień.
2. Bez potwierdzenia dla tej samej rewizji nie powstaje wydanie produkcyjne; potwierdzenie starej rewizji nie wydaje rewizji nowszej.
3. Usunięcie projektu wymaga jawnego, jednorazowego potwierdzenia; odmowa nie zmienia danych ani rewizji.
4. Testy ścieżek PDF obejmują traversal (`..`), ścieżkę absolutną, istniejący plik, symlink i wyjście poza katalog roboczy; żadna próba nie zapisuje poza katalogiem dozwolonym.
5. Zdarzenie audytu pozwala odtworzyć kto, kiedy i na jakiej rewizji wykonał operację, bez przechowywania zbędnych danych osobowych lub sekretów.
6. Próba na każdym wspieranym kliencie dokumentuje prezentację narzędzi, argumentów, potwierdzenia i odmowy; to test konkretnego klienta, nie test protokołu MCP.

## Priorytet i zależności

**P0:** jednorazowe potwierdzenie niezmiennej rewizji dla wydania, potwierdzenie trwałego usunięcia i zamknięcie dowolnej ścieżki zapisu. Zależności: autoryzacja P0 dla `/mcp` i warstwy REST, wersjonowanie rewizji oraz ustalony magazyn plików.

**P1:** klasyfikacja i kompletność wszystkich narzędzi oraz ślad audytowy. Zależności: zatwierdzona macierz ról i czynności oraz brief `docs/RESEARCH-audit-zdarzen-zespolowych-2026-10-05.md`.

**P2:** walidacja doświadczenia klientów MCP, które faktycznie będą używane przez warsztat. Zależność: lista wspieranych klientów i wersji.

Miernik: 100% operacji zmieniających stan mają klasyfikację i test odmowy; 100% wrażliwych operacji wymaga potwierdzenia przypiętego do widocznego zakresu i aktualnej rewizji; 0 zapisów poza katalogiem kontrolowanym; można przypisać każde wykonanie do aktora bez zapisywania nadmiarowych danych klienta.

## Ograniczenia

To statyczna analiza kodu na wskazanej rewizji. Nie zweryfikowano implementacji klienta MCP, ekspozycji endpointu, uprawnień systemowych, konfiguracji hosta, publicznego wdrożenia ani zachowania produkcyjnego. Wnioski o ścieżce zapisu opisują widoczny handler, nie dowodzą osiągalności przez atakującego. Adnotacje protokołu są wskazówkami, a nie zastępstwem auth, ACL ani serwerowego zatwierdzenia.

## Źródła

- Model Context Protocol, Tools, wersja `2025-11-25`: https://modelcontextprotocol.io/specification/2025-11-25/server/tools — model-controlled wywołania, zalecenie człowieka w pętli, opcjonalność i niezaufany charakter adnotacji oraz zalecenia potwierdzania operacji wrażliwych i logowania.
- Powiązane notatki w repozytorium: `docs/RESEARCH-macierz-autoryzacji-tras-2026-10-05.md`, `docs/RESEARCH-audit-zdarzen-zespolowych-2026-10-05.md`, `docs/RESEARCH-prywatny-magazyn-plikow-Supabase-2026-10-08.md`.

## Pliki sprawdzone

- `src/mcp/server.ts` — rejestracja 44 narzędzi, adnotacje, opisy potwierdzenia i obsługa zapisów PDF.
- `src/service.ts` — walidacja kompletności i tworzenie wydania produkcyjnego.
- `src/wydania.test.ts` — istniejące testy wydania i wstrzymania niekompletnej dokumentacji.
- `package-lock.json` — MCP SDK 1.30.0 w lockfile.
