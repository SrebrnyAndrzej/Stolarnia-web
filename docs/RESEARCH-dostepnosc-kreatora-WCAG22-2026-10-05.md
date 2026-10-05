# Dostępność kreatora 2D/3D — wymagania uzupełniające

Data: 2026-10-05
Baza kodu: `417e06e1d79866d3e61fc42f2d8727cd1196e9a7`
Zakres: ukierunkowany przegląd ścieżki manipulacji meblami i oficjalnego standardu W3C; nie jest to pełny audyt WCAG ani ocena prawnej obowiązywalności.

## Ustalenie

Repozytorium wymaga już wpisywania dokładnych wartości obok przeciągania (`docs/WYTYCZNE.md`, §5), co jest ważną alternatywą dla precyzji myszy. Dodatkowy przegląd wskazuje, że na płótnie elewacji `web/src/views/Designer.tsx` meble SVG `<g>` są przesuwane przez `onPointerDown/Move/Up`; te elementy nie mają w pokazanym miejscu semantyki kontrolki ani obsługi klawiatury. `web/src/views/Rzut.tsx` również reaguje na pointer. Paleta używa HTML drag-and-drop (`Designer.tsx`, `draggable` i `onDragStart`). Nie wykonano pełnego audytu reszty ekranów/czytnika ekranu.

Wymiar wpisywany w inspektorze nie rozwiązuje sam wszystkich przypadków: użytkownik musi móc wskazać mebel, zmienić jego położenie lub kolejność, przenieść pozycję z katalogu na projekt, nawigować widokiem i obsłużyć fokus bez wymogu przeciągania.

## Źródło i zalecenie

W3C WCAG 2.2 na poziomie AA wymaga obsługi klawiaturą (2.1.1), widocznego fokusu (2.4.7), alternatywy jednopunktowej dla funkcji wymagających przeciągania (2.5.7 Dragging Movements) i domyślnego minimum celu 24×24 CSS px (2.5.8, z określonymi wyjątkami). Spełnienie klawiatury samo nie dowodzi spełnienia osobnego kryterium alternatywy przeciągania. WCAG jest tu przyjętym standardem jakości produktu; zastosowanie konkretnych obowiązków prawnych do tej aplikacji nie było oceniane.

**P1 — etapy projektowania, zależność niewymagająca zmian silnika konstrukcji:** zapewnić dla operacji canvasów jednocześnie klawiaturę i alternatywę kliknięcie/tap bez przeciągania. Przykładowo: kliknij część/mebel, użyj panelu z polami X/Y i przyciskami krokowymi; albo wybierz pozycję katalogu i następnie kliknij miejsce docelowe. Krok można też zmienić precyzyjnym polem liczbowym. Pojedyncza manipulacja ma tworzyć jeden krok cofania, zgodnie z istniejącą wytyczną.

Pozostałe kryteria dla całej aplikacji:

- elementy interaktywne SVG mają nazwę dostępną, rolę, stan zaznaczenia i działanie klawiaturą; grafika dekoracyjna jest ukryta przed czytnikiem ekranu;
- fokus jest widoczny i po zamknięciu dialogu/panelu wraca do elementu, który go otworzył; tab order odpowiada kolejności pracy;
- błędy walidacji i zapis/konflikt są ogłaszane bez konieczności szukania w canvasie; błędy są powiązane z polami;
- na małych ekranach nie zmuszać do gestu wielopunktowego; zoom/pan mają kontrolki alternatywne; cele wskaźnika osiągają WCAG 2.2 AA albo udokumentowany wyjątek;
- testować kontrast, powiększenie do 200%, reflow, klawiaturę i co najmniej jedną kombinację czytnika ekranu/przeglądarki. Automatyczny skan nie zastępuje testu ścieżki pracy.

## Kryteria odbioru

1. Całą kluczową ścieżkę: utworzenie projektu, dodanie mebla, wybór i precyzyjne ustawienie, zmianę wymiaru, zmianę materiału, zapis oraz wygenerowanie dokumentacji można wykonać bez myszy.
2. To samo dodanie i pozycjonowanie mebla działa pojedynczym kliknięciem/tapem jako alternatywa dla przeciągania, z podaniem docelowej pozycji bez konieczności przeciągnięcia.
3. Test klawiaturowy nie wpada w pułapkę fokusu; zaznaczony element i stan błędu/zapisu są rozpoznawalne wizualnie i semantycznie.
4. Zmiana rozmiaru w polu liczbowym daje ten sam model, pozycję i wynik dokumentacji co przeciągnięcie; cofnięcie cofa całą operację.
5. Zmierzone cele wskaźnika spełniają 24×24 CSS px lub wyjątek WCAG; kolory, focus, komunikaty i zoom przechodzą manualny przegląd z checklistą WCAG 2.2 AA dla kluczowego workflow.

## Źródła

- W3C Recommendation, WCAG 2.2: https://www.w3.org/TR/WCAG22/ — kryteria keyboard, focus, dragging movements, target size.
- W3C WAI, Understanding 2.5.7 Dragging Movements: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements — wyjaśnia, że alternatywę wskaźnikiem bez przeciągania ocenia się osobno od obsługi klawiaturą.
- Repozytorium: `docs/WYTYCZNE.md` §5, `web/src/views/Designer.tsx`, `web/src/views/Rzut.tsx`.

Brak zmian w aplikacji; pełny audyt UI i testy asystujące pozostają do wykonania przez zespół przed oznaczeniem zgodności.
