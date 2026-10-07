# Wydajność i odporność widoku 3D mebli

Data: 2026-10-07  
Baza `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`  
Zakres: statyczny przegląd Three.js i rekomendacje dla Claude; bez zmian silnika, logiki konstrukcji i geometrii produkcyjnej.

## Obserwacje z aktualnego kodu

1. `web/src/views/Widok3D.tsx` uruchamia ciągłe `requestAnimationFrame`, wywołuje `controls.update()` i renderuje scenę bez przerwy. To model właściwy dla animacji, ale scena mebli jest zasadniczo statyczna poza ruchem kamery.
2. Ten sam plik ustawia `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`, aktywuje cienie i mapę cieni 2048×2048. Ograniczenie DPR do 2 jest górną granicą; na ekranie DPR 2 oznacza cztery razy więcej pikseli niż DPR 1. Nie zmierzono wpływu na obsługiwanych urządzeniach.
3. Efekt budujący scenę ma zależności `[analiza, pomieszczenieId, scianaId, wybrany, matMap]`, a na wejściu zwalnia geometrię/materiały całej sceny i tworzy ją ponownie. Zaznaczenie modułu (`wybrany`) może zatem przebudować wszystkie bryły, choć zmieniło się tylko podświetlenie. To bezpośredni kandydat do testu regresji.
4. Każdy widoczny element modułu tworzy bryłę oraz `LineSegments` z `EdgesGeometry`; w dużej kuchni rośnie liczba obiektów i wywołań rysowania. Nie zmierzono dotąd liczby elementów, draw calls, klatek ani czasu przebudowy dla dużego projektu.
5. `web/src/render/fotorealizm.ts` tworzy osobny renderer, render target `2880×1620` dla obrazu `1920×1080`, multisampling 4, GTAO oraz kolejne post-processy dla każdego ujęcia. Jest to celowo ścieżka wysokiej jakości eksportu, ale może być kosztowna na urządzeniach z ograniczoną pamięcią/GPU. Brak pomiarów czasu, pamięci i zachowania przy utracie kontekstu.

To wnioski z odczytu kodu na podanej rewizji. Nie oznaczają, że użytkownicy zgłaszali opóźnienia, że istnieje przeciek GPU ani że wszystkie urządzenia mają ten sam problem.

## Źródła techniczne

- Oficjalny manual Three.js wskazuje wizualizatory, edytory 3D i katalogi produktów jako dobre przypadki renderowania na żądanie; ciągłe renderowanie statycznej sceny zużywa energię, a przy `OrbitControls` i damping należy kontynuować klatki tylko dopóki trwa ruch. [Three.js — Rendering on Demand](https://threejs.org/manual/pages/rendering-on-demand.html)
- `InstancedMesh` służy do wielu obiektów o tej samej geometrii/materiale i ogranicza draw calls, ale nie jest automatycznym rozwiązaniem dla wszystkich płyt, ponieważ obiekty bywają różne, selektywne i klikalne. [Three.js — InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html), [Optimize Lots of Objects](https://threejs.org/manual/pages/optimize-lots-of-objects.html)
- Three.js wymaga jawnego zwalniania zasobów GPU; geometrie i materiały mogą być współdzielone, więc indiscriminate dispose może usunąć aktywny zasób. `renderer.info` udostępnia m.in. liczbę geometrii, tekstur, draw calls i trójkątów do diagnostyki. [Three.js — Cleanup](https://threejs.org/manual/pages/cleanup.html), [How to dispose of objects](https://threejs.org/manual/pages/how-to-dispose-of-objects.html), [WebGLRenderer docs](https://threejs.org/docs/pages/WebGLRenderer.html)

Wnioski produktowe poniżej są zaleceniami. Oficjalne źródła nie wyznaczają progu wydajności dla aplikacji ani minimalnej klasy sprzętu warsztatu.

## Zalecenia dla Claude

**P1 — po priorytecie poprawności produkcyjnej i niezmiennego wydania.** Najpierw zbudować powtarzalny benchmark; optymalizować dopiero to, co wykazuje pomiar i zachować dokładność geometrii.

1. **Render na żądanie w interaktywnym widoku:** renderować klatkę po zmianie kamery, rozmiaru, stanu sceny, materiału/oświetlenia, zaznaczenia i załadowania zasobu. Przy włączonym damping renderować do ustania ruchu, potem zatrzymać pętlę. Przy zmianie widoczności karty wrócić z aktualną klatką. Nie modyfikować danych konstruktora ani wymiarów produkcyjnych dla poprawy FPS.
2. **Izolacja zmian:** oddzielić geometrię projektu od selekcji/podświetlenia, aby samo kliknięcie modułu nie zwalniało i nie budowało ponownie całej sceny. Rebuild wykonać tylko dla zmiany wejść geometrycznych; zmiany koloru/wyboru odświeżają odpowiedni wygląd. Przy niezmienionej geometrii zachować renderer, kamerę i zasoby.
3. **Jakość warstwowa:** udostępnić prosty podgląd (bez kosztownych cieni/HDRI) i tryb jakości; rozważyć ustawianie DPR/cieni według rozmiaru canvasu i zmierzonego czasu klatki, z ręcznym wyborem użytkownika. Nie fingerprintować GPU ani urządzenia. Jakość wizualna nie może wpływać na geometrię, listę części, pomiary ani rysunki.
4. **Benchmark skali:** fixture syntetyczny i anonimowy o trzech wielkościach (np. mały, średni, duży projekt; dokładną liczbę modułów dobrać z istniejących realnych rozkładów bez eksportu PII). Mierzyć czas pierwszej sceny, czas przebudowy po zmianie geometrycznej, koszt zmiany zaznaczenia, FPS/frame-time podczas orbitowania, `renderer.info.render.calls/triangles` oraz `renderer.info.memory.geometries/textures`; nie logować geometrii projektu klienta do telemetryki.
5. **Warstwa brył:** tylko po pomiarze draw calls rozważyć współdzielenie `BoxGeometry` według typowych wymiarów lub batchowanie niezmiennych powierzchni o wspólnym materiale. Pozostawić identyfikowalne części i moduły do wyboru/hit-testu; osobno zweryfikować prawidłowość normalnych, krawędzi i face-culling. `InstancedMesh` nie pasuje wprost, jeżeli geometrie mają różne wymiary lub indywidualny pick ID.
6. **Cykl życia GPU:** mapować właściciela współdzielonej geometrii/materialu/tekstury; zwalniać tylko zasoby niewykorzystywane. Test przełączenia wielu projektów/pomieszczeń i zamykania widoku powinien wykrywać monotoniczny przyrost renderer.info; pamiętać, że Three.js może zachować zasoby wewnętrzne wielokrotnego użytku, więc sama niezerowa liczba nie dowodzi wycieku.
7. **Eksport fotorealistyczny:** zachować renderer jednorazowego eksportu i tryb jakości, lecz ograniczyć równoległe renderowanie, raportować postęp i umożliwiać anulowanie. Dla wielu ujęć porównywać pomiar czasu i pamięci; obsłużyć błąd utworzenia WebGL context, utratę kontekstu i canvas bez dostępności GPU komunikatem po polsku oraz przejściem do standardowego podglądu/rysunków. Nie wstawiać pustego obrazu PDF po błędzie.
8. **Niezawodność:** dodać obsługę `webglcontextlost/restored`, cleanup listenerów, `ResizeObserver`, RAF i renderer przy odmontowaniu. Po przywróceniu kontekstu scena ma zostać odtworzona z domenowych danych; utrata GPU nie może wpływać na zapis projektu ani wydanie produkcyjne.

## Kryteria odbioru

1. Powtórzenie testu wyboru innego modułu w tej samej scenie nie uruchamia pełnego rebuild geometrii; liczba geometrii i render time wracają do stanu bazowego, a podświetlenie i pick nadal działają.
2. Po zatrzymaniu kamery liczba renderów spada do zera (po końcu damping/settling); zmiana rozmiaru, projektu, materiału, widoczności lub zaznaczenia odświeża właściwą klatkę. Test automatyczny kontroluje brak stale aktywnego RAF po ustaniu ruchu.
3. Benchmark zapisuje baseline p50/p95 dla czasu pierwszej sceny, pełnej zmiany geometrii i kliknięcia zaznaczenia na ustalonym sprzęcie low/mid/high oraz wersji przeglądarki. Docelowe p95 ustala zespół po pierwszym baseline; proponowany cel interakcji na sprzęcie minimalnym to utrzymać orbitowanie przy co najmniej 30 FPS bez blokowania odpowiedzi UI, ale potwierdzić go na urządzeniu rzeczywiście używanym w warsztacie.
4. Dla benchmarku 3 poziomów skali UI podaje czytelną informację o uproszczonym trybie, jeżeli urządzenie nie dotrzymuje ustalonego celu; zmiana trybu renderowania nie zmienia hash/snapshotu części ani wymiarów.
5. Test obrócenia kamery i wyboru elementów porównuje identyfikatory części oraz pozycje brył z danymi konstruktora; optymalizacja nie scala danych produkcyjnych w sposób, który usuwa pick lub rewizję części.
6. Po 30 cyklach pomieszczenie/projekt/zamknięcie widoku geometrie/tekstury nie rosną monotonicznie poza rozpoznanymi zasobami cache Three.js; po każdym cyklu działa ponowne renderowanie.
7. Test symulowanej odmowy WebGL i `webglcontextlost` pokazuje komunikat i pozostawia dostępny zapis, dokumentację i widok nie-WebGL; po przywróceniu kontekstu 3D odtwarza scenę albo jawnie prosi o odświeżenie.
8. Eksport wielu ujęć pokazuje postęp, może zostać anulowany bez uszkodzenia kolejnych eksportów, a błąd renderera nie generuje cichego pustego JPEG/PDF.

## Priorytet i ograniczenia

- **P1:** pomiar i render on demand, jeżeli benchmark potwierdzi koszt idle; separacja selekcji od pełnego rebuild; obsługa błędów kontekstu.
- **P2:** dzielenie/łączenie geometrii, adaptacyjne DPR/cienie, praca w Web Worker/OffscreenCanvas — tylko jeżeli profilowanie wskaże ograniczenie głównego wątku/GPU i realne urządzenia to wspierają.
- Nie wykonywano benchmarku browsera, nie dysponujemy profilem słabego komputera warsztatowego i nie weryfikowano widoku 3D wizualnie. Progi są hipotezą roboczą, wyjąwszy pomiar statycznego RAF, wartości DPR i rozmiarów render target odczytane bezpośrednio z kodu.

## Punkt wznowienia

- Ostatnie świeże `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude w tej kontroli.
- Research na osobnej gałęzi; nie zmieniono logiki ani nie uruchamiano testów aplikacji.
- Następny krok: porównać świeże zmiany Claude; jeśli bez zmian, sprawdzić z właścicielem/na dostępnych danych sprzęt minimalny do 3D i zbadać wsparcie mobilne/tryb małego ekranu, nie zakładając obecnej kompatybilności.
