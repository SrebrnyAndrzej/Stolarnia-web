# Research: niezmienne wydanie nie zachowuje raportu rozkroju

Data: 2026-10-13, 12:04 Europe/Warsaw
Status: potwierdzone przeglądem kodu; brak dowodu na utratę danych z rzeczywistego zlecenia.

## Problem

Wydanie produkcyjne zachowuje migawkę projektu, konstrukcji i dokumentacji części, ale nie zachowuje raportu rozkroju ani kompletu wejść, z których ten raport wynika. Po zmianie globalnych ustawień rozkroju lub danych materiału nie można pobrać planu cięcia z konkretnego wydania, a bieżący raport może reprezentować inne założenia niż data wydania. To ogranicza odtwarzalność całego pakietu wykonawczego i utrudnia badanie reklamacji lub wznowienie produkcji.

Zakres jest odrębny od briefu `RESEARCH-wydanie-produkcyjne-bez-rozmieszczonych-czesci-2026-10-13.md`: tam chodzi o warunek dopuszczenia wydania kompletnego; tutaj o zawartość i odtwarzalność już utworzonej migawki.

## Dowody

- `docs/WYTYCZNE.md`, sekcja 12, wymaga zapisywania ustawień, wersji algorytmu i wyniku zatwierdzonego rozkroju.
- `src/core/types.ts`: komentarz i typ `WydanieProdukcyjne` określają migawkę jako `{ projekt, zbudowane, dokumentacja, firma }`. Metadane wydania przechowują rewizję projektu, wersję generatora, status i hash.
- `src/service.ts`: `utworzWydanie()` oblicza `analiza()`, ale do JSON migawki serializuje tylko `projekt`, `zbudowane`, `dokumentacja` i `firma`. `Analiza` zwraca osobno `formatki`, `rozkroj`, `projektWyceny` oraz `ustawienia`; nie są one składnikiem archiwizowanego JSON.
- `wydaniePdf()` odtwarza PDF z migawki projektu, konstrukcji i dokumentacji. Wydanie nie ma analogicznego czytnika raportu rozkroju; bieżące `rozkroj_plyt` pobiera raport z `s.analiza(projektId).rozkroj`, czyli dla aktualnego projektu i ustawień.
- Istniejący `src/wydania.test.ts` weryfikuje niezmienność dokumentacji PDF po zmianie wymiaru modułu, profilu szuflady i ustawień technologii. Nie sprawdza przechowania wyniku rozkroju, wejściowych wymiarów arkuszy, marginesu/rzazu, orientacji, listy rozmieszczonych i nierozmieszczonych części ani wersji algorytmu rozkroju.
- Testy `src/wydania.test.ts` i `src/service.test.ts`: 12/12 przechodzi. Nie stanowi to dowodu odtwarzalności planu cięcia; aktualne testy nie zawierają takiego kryterium.

## Rekomendacja dla Claude

**Priorytet P1 — kompletność i audytowalność pakietu produkcyjnego.** Migawka gotowego wydania powinna przechowywać niezmienny raport rozkroju wraz z wejściami i pochodzeniem: identyfikatory oraz snapshot materiałów, pary wymiarów arkuszy i ich źródło, ustawienia marginesu/rzazu/obrotu/dekoru, wersję algorytmu, położenia na arkuszach oraz nierozmieszczone formatki i diagnostykę. Hash wydania musi obejmować te dane. Dodać odczyt raportu przypisanego do numeru/revizji wydania; interfejs nie powinien zastępować brakującego historycznego planu aktualnym wynikiem bez jawnej etykiety „bieżący podgląd”.

**Zależności:**

- Poprzedni warunek kompletności: nie zamrażać jako gotowego wydania, jeśli wymagane formatki są nierozmieszczone.
- Przechowywać wejściowe wymiary i identyfikatory materiału jako snapshot, a nie polegać na aktualnym katalogu lub ustawieniach globalnych.
- Przypisać wersję algorytmu i status/pochodzenie arkusza, szczególnie gdy rozkrój jest orientacyjny lub bazuje na formacie zakładowym.
- Uzgodnić retencję i migrację istniejących wydań, które raportu nie zawierają; brak historycznego planu ma być jawny, bez rekonstrukcji udającej wynik z dnia wydania.

## Mierzalne kryteria odbioru

1. Test wydania zapisuje hash i snapshot raportu z formatkami, arkuszami, położeniami, nierozmieszczonymi elementami, wymiarami/źródłem arkuszy, parametrami cięcia i wersją algorytmu.
2. Po wydaniu zmiana globalnych ustawień rozkroju, wymiarów materiału i aktualnego katalogu nie zmienia raportu pobranego dla historycznego numeru wydania; nowa analiza może pokazywać nowy wynik oddzielnie.
3. Zmiana liczby, orientacji, materiału lub położenia formatki powoduje różny hash migawki albo nowe wydanie; kontrolny identyczny snapshot odtwarza ten sam hash.
4. API/UI/MCP udostępniają raport związany z wydaniem i rewizją. Gdy wydanie historyczne nie ma raportu, odpowiedź jednoznacznie oznacza go jako brakujący i nie podstawia obecnego rozkroju.
5. Test przypadków z nierozmieszczoną formatką potwierdza, że wydanie kompletne jest blokowane, a robocze utrwala dokładnie listę braków i ograniczenia z chwili utworzenia.

## Punkt wznowienia

Świeży tip `main` sprawdzony 2026-10-13 12:04: `8230275ad6dea52109f581c793bdd8d6f08684d3`. Brak nowych commitów Claude. W porównaniu `origin/main` i branch materiału badawczego pliki `src/core/technologia.ts`, `src/service.ts`, `src/core/types.ts` i `src/wydania.test.ts` są identyczne. Następnie: sprawdzić, czy zmiana bramki wydania uwzględnia raport rozkroju oraz czy nowe wydanie przechowuje jego wersjonowany snapshot; jeśli nie, przekazać ten brief i zweryfikować na syntetycznych danych test odtworzenia po zmianie globalnych ustawień.

## Zakres i ochrona danych

Research-only. Nie zmieniono logiki, danych klientów, katalogu, ceny uzgodnionej 29 227,60 zł brutto ani historycznych umów. Przegląd źródeł/testów nie dotykał bazy produkcyjnej.
