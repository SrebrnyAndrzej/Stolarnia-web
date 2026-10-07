# Obsługa dotykowa i mały ekran w kreatorze

Data: 2026-10-07  
Baza `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`  
Zakres: zachowanie gestów na planszach i użyteczność edytora na telefonie/tablecie; uzupełnia brief WCAG, nie powtarza pełnego audytu dostępności.

## Stan w kodzie i luka

- `web/src/styles.css` przypisuje `.elev` (`SVG` rzutu/elewacji) i `.widok3d canvas` `touch-action: none`.
- `web/src/views/Designer.tsx` obsługuje przeciąganie elementu na planszy wskaźnikiem, a `web/src/views/Rzut.tsx` nasłuchuje `pointerdown` i kliknięć. Nie znaleziono w tych widokach osobnych przycisków/kontrolerów gestów dla mobilnego panningu/zoomu planszy.
- Kreator ma breakpointy 1100 px i 640 px; przy węższym widoku `.designer` układa widoki w jedną kolumnę, a `.side` jest ograniczony `max-height: 480px`. To poprawia układ, ale samo nie rozstrzyga konfliktu gestów ani tego, jak użytkownik ma przewijać stronę, gdy dotyk zaczyna się na płótnie.
- Istniejący `RESEARCH-dostepnosc-kreatora-WCAG22-2026-10-05.md` już wymaga alternatywy dla drag-only, klawiatury i alternatywnych kontrolek zoom/pan. Nowe ustalenie dotyczy konkretnie dotykowego gestu, który może wyłączyć naturalny scroll/zoom przeglądarki.

Nie potwierdzono testem, że bieżący użytkownik nie może przewijać konkretnej strony na danym telefonie; to ryzyko wynikające z CSS i modelu wskaźnika wymagające ręcznej weryfikacji.

## Źródła i fakty

- MDN opisuje, że `touch-action: none` wyłącza obsługę przewijania/pinch zoom przez przeglądarkę w danym regionie; może też ograniczyć funkcję powiększenia przeglądarki. Wartość ta jest uzasadniona dla powierzchni, która implementuje własne gesty (np. mapa), ale należy ograniczyć jej obszar do manipulowanej planszy i zapewnić przewidywalne zachowanie poza nią. [MDN — `touch-action`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)
- Pointer Events wspiera urządzenia dotykowe, mysz i pióro oraz wiele równoległych punktów dotyku; wielodotyk wymaga jawnej obsługi. `pointercancel` może wystąpić, gdy przeglądarka przejmie gest. [MDN — Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events), [MDN — Multi-touch interaction](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Multi-touch_interaction)
- WCAG 2.2 Reflow wymaga dla zwykłej treści pionowego przewijania bez utraty funkcji przy szerokości równoważnej 320 CSS px; dwuwymiarowość może być wyjątkiem tylko dla fragmentu, którego użycie/znaczenie rzeczywiście jej wymaga. Istniejący brief WCAG już obejmuje kryteria zgodności. [W3C WAI — Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

## Rekomendacja dla Claude

**P1 — wraz z istniejącą alternatywą dla przeciągania.** Przyjąć, że plansza ma własny gest tylko wtedy, gdy użytkownik wchodzi z nią w interakcję. Poza obszarem płótna strona zachowuje natywne przewijanie i zoom. Nie wymagać gestu pinch ani przeciągania jako jedynej metody.

1. Ograniczyć `touch-action` do widocznego obszaru, w którym odbywa się bezpośrednie manipulowanie planszą. Panele, listy, inspektor i treść strony muszą przewijać się normalnie. Jeśli natywny pinch-zoom jest blokowany w edytorze, zapewnić osobne przyciski zoom +/−, dopasuj widok i reset; użytkownik może dalej powiększyć całą stronę poza planszą.
2. Rozróżnić tap (wybór) od drag (przesunięcie), obsłużyć zakończenie przez `pointerup`, `pointercancel` i utratę capture. Tap nie może przypadkowo przenieść modułu; rozpoczęcie gestu poza aktywną planszą nie może zmienić projektu.
3. Udostępnić dla dotyku i klawiatury procedurę: wybierz ścianę/moduł → wybierz akcję „przenieś” → naciśnij/puknij cel albo wpisz X/Y. Zaznaczenie i cel nie mogą zależeć od precyzji palca względem cienkiej linii SVG. To realizuje już zapisane wymaganie `RESEARCH-dostepnosc-kreatora-WCAG22-2026-10-05.md`.
4. Ustalić obsługiwane klasy urządzeń z właścicielem: desktop do kompletnego projektowania i produkcji, tablet do zatwierdzonej listy zadań, telefon do wybranych lekkich zadań (np. podgląd, potwierdzenie gotowości, zdjęcie/protokół) — propozycja do decyzji, nie stwierdzona obecna polityka. Nie deklarować pełnej konstrukcji/CAD na telefonie bez testów.
5. Przy małym ekranie układać katalog, inspektor i widoki w logiczne sekcje/zakładki; zachować widoczny status wybranego modułu i łatwe przejście do jego parametrów. Długi panel boczny o stałym limicie wysokości nie powinien tworzyć niezauważonego wewnętrznego scrolla ani chować akcji zapisu.
6. Testować wydanie produkcyjne jako osobny tryb: wymiary i rysunki muszą pozostać czytelne po powiększeniu; ekran dotykowy jest podglądem, a nie źródłem modyfikacji liczb przez przypadkowy drag. Eksport/PDF pozostaje dokładny i niezależny od canvasowego zoomu.

## Kryteria odbioru

1. Na rzeczywistym dotyku w porcie Safari i Chrome: przewinięcie panelu/strony zaczęte poza płótnem działa natywnie; interakcja w płótnie ma jawny, testowalny rezultat i nie zamraża przewijania całego interfejsu.
2. Tap na meblu wybiera go; drag przesuwa go wyłącznie po rozpoczęciu na uchwycie/wybranym elemencie; pinch/scroll nie powoduje przypadkowej mutacji. `pointercancel` kończy gest bez utraty lub pół-zapisania pozycji.
3. Każdą operację pozycjonowania da się wykonać również bez przeciągania, używając wyboru i pola/przycisków; zmiana X/Y przez kontrolkę daje ten sam wynik dokumentacji co desktop.
4. Na viewportach 320, 375, 768 i 1024 CSS px można przejść do katalogu, inspektora, widoku 2D/3D, zapisu i krytycznych komunikatów bez poziomego scrolla całej strony. Dwuwymiarowy scroll samego obszaru planszy może być uzasadniony, jeśli wyraźnie odróżniony i sterowalny.
5. Powiększenie przeglądarki do 200–400% nie ukrywa zapisu, błędów ani stanu synchronizacji. Sprawdzić także orientation portrait/landscape, klawiaturę, sterowanie głosowe i co najmniej jedno urządzenie dotykowe rzeczywiście używane w warsztacie.
6. Wybranie modułu lub zmiana gestu nie zmienia niepowiązanych części, materiałów ani ceny; historia Undo traktuje pojedynczą udaną zmianę położenia jako jeden krok.

## Priorytet, zależności i niewiadome

- **P0/P1:** wdrożyć razem z wcześniej wskazaną alternatywą dla przeciągania i testami WCAG; zachować dokładność produkcyjnych wymiarów i ochronę przed przypadkową edycją.
- **Zależności:** `RESEARCH-dostepnosc-kreatora-WCAG22-2026-10-05.md`, `RESEARCH-wydajnosc-i-odpornosc-widoku-3D-2026-10-07.md`, polityka minimalnych wspieranych urządzeń i ręczny test na fizycznym telefonie/tablecie.
- Nie badano ruchu użytkowników, modeli urządzeń, rozdzielczości, orientacji, sterowania głosem, Safari iOS ani Chrome Android w uruchomionej aplikacji. Nie twierdzę, że dostępność jest zgodna/niezgodna na podstawie statycznego wyszukania selektorów.

## Punkt wznowienia

- Ostatni świeży `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude w tej kontroli.
- Opublikować tylko dokument researchowy na gałęzi Codexa; bez zmian logiki.
- Następny temat: świeży przegląd zmian Claude; przy braku zmian zebrać z właścicielem minimalną matrycę wspieranych przeglądarek/sprzętu na hali, a następnie sprawdzić katalogi okuć i dekory pod kątem jawnego statusu źródła/aktualności bez powielania praw do zdjęć.
