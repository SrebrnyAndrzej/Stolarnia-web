# Wiarygodność dekorów w podglądzie 3D i renderze ofertowym

Data przeglądu: 07.10.2026. Baza kodu: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`. Autor: Codex. Research-only: nie zmienia silnika ani katalogu. Celem jest uczciwe przedstawienie dekoru, a nie zapewnienie zgodności barwowej monitora z fizyczną płytą.

## Stan obecny — fakty z kodu i katalogu

- `web/src/views/Widok3D.tsx` pobiera `kolorHEX` i tworzy materiał `MeshStandardMaterial` z kolorem oraz chropowatością wg roli. W tym interaktywnym widoku nie używa `zdjecieURL`, tekstury dekoru ani `kierunekDekoru` do mapowania powierzchni.
- `web/src/render/fotorealizm.ts` buduje materiał oferty osobno. Rodzaj drewna jest wnioskowany wyrażeniem regularnym z nazw/grup; zamiast skanu płyty powstaje proceduralna tekstura drewna o stałym rozmiarze fizycznym 1 × 2 m. Dla innych materiałów chropowatość jest częściowo dobierana przez dopasowanie tekstu do nazwy/struktury; obraz może posłużyć do wyliczenia koloru średniego. To stylizowana aproksymacja, nie mapa producenta.
- Model `Material` ma `zdjecieURL`, `struktura`, `kierunekDekoru` i `kolorHEX`, ale nie zawiera wymiarów fizycznych źródłowej tekstury, mapy powierzchni/licencji ani parametrów roughness/normal pochodzących z konkretnego produktu. Katalog `docs/materialy/README.md` już wyraźnie stwierdza brak potwierdzonej skali tekstur i kompletu map PBR oraz że zdjęcie nie jest potwierdzeniem prawa do redystrybucji.
- Oficjalna karta EGGER F433 podaje `Directional: Yes` i opisuje strukturę ST10 jako imitującą dotyk lnu, a zarazem informuje, że dekor jest reprodukcją i dobór zgodności koloru możliwy jest tylko na oryginalnej próbce. EGGER oferuje cyfrowy dobór/wizualizację, ale zachowuje to samo zastrzeżenie o próbce.

Te obserwacje nie dowodzą wad wizualnych na każdym ekranie; pokazują granicę między aktualną podglądową prezentacją a deklaracją fizycznej zgodności.

## Źródła pierwotne

- [EGGER F433 ST10 — oferta PL](https://www.egger.com/pl/meble-i-aranzacja-wnetrz/dekory/F433_10?country=PL): kierunkowość, opis struktury ST10, dostępność i zastrzeżenie o oryginalnej próbce.
- [EGGER — planning and visualization](https://www.egger.com/en/furniture-interior-design/decorative-collection/planning-and-visualization?lci=bmM9bmF3MSAg): cyfrowa prezentacja/porównanie i eksport; dobór koloru nadal wymaga oryginalnej próbki.
- [Three.js — Color Management](https://threejs.org/manual/pages/color-management.html): mapy barw PNG/JPEG należy oznaczyć sRGB; mapy danych, np. roughness/normal, zwykle pozostają `NoColorSpace`; transformacja wyjścia do ekranu/obrazu musi być spójna.
- [Three.js — Texture](https://threejs.org/docs/pages/Texture.html) oraz [manual Textures](https://threejs.org/manual/pages/textures.html): UV mapping, repeat/offset/rotation, osobne materiały na ścianach `BoxGeometry`, ładowanie asynchroniczne i koszt pamięci GPU zależny od wymiarów obrazu, nie tylko skompresowanego rozmiaru pliku.

Dokumentacja biblioteki opisuje możliwości techniczne, nie potwierdza licencji na pliki producenta, skali konkretnego dekoru ani zgodności wyglądu z próbką. Zakres praw do assetów pozostaje w `docs/RESEARCH-prawa-do-katalogow-i-obrazow-producentow-2026-10-06.md`.

## Zalecane zachowanie dla Claude

**P1 — po kompletności modelu produkcyjnego i dostępach do assetów.** Rozdzielić trzy jawne klasy prezentacji:

1. **Kolor/karta katalogowa** — płaski kolor lub miniatura; jasno oznaczyć jako poglądową, nie mapować automatycznie miniatury jako wzoru płyty.
2. **Tekstura stylizowana** — proceduralna, użyteczna do zobaczenia ogólnego kierunku/tonu, lecz oznaczona jako przybliżona; nie wyprowadzać z niej rzeczywistej struktury powierzchni.
3. **Tekstura produktu z potwierdzonym źródłem** — tylko po potwierdzeniu warunków użycia i przechowywania; zapisuje wariant produktu/dekoru/struktury, URL i datę źródła, hash assetu, fizyczną szerokość i wysokość reprezentowanego wycinka, orientację i informację o mapach dostępnych dla materiału. Brak tych pól wyłącza roszczenie do skali/struktury i sprowadza podgląd do klasy 1 lub 2.

Mapowanie na część powinno liczyć powtórzenie tekstury z fizycznego wymiaru źródła i wymiaru gotowego elementu, a obrót/odwrócenie wynikać z `kierunekDekoru` i orientacji konkretnej części. Jeśli materiał jest kierunkowy, nie stosować losowego obrotu ani lustrzanego odbicia. Sąsiednie fronty z ciągłym rysunkiem potrzebują jawnego wspólnego punktu odniesienia/offsetu; nie zakładać ciągłości, gdy ma się tylko pojedynczy skan bez pochodzenia z arkusza.

Kolorowe mapy skanów są danymi sRGB; mapy normal/roughness są mapami danych, a nie kolorem. Używać właściwego zarządzania przestrzenią barw i jednej spójnej ścieżki konwersji canvas→PNG/JPEG/PDF. Parametr chropowatości lub bump wynika z potwierdzonych metadanych powierzchni albo pozostaje neutralny/stylizowany; nie zgadywać go tylko po `ST9`, słowie „mat” czy regexie nazwy.

Na ekranie wyboru i w PDF oferty umieścić krótką informację „wizualizacja poglądowa — kolor i struktura mogą różnić się od płyty; finalny wybór potwierdzić na próbce”. Do akceptacji klienta zapisać kod dokładnego produktu/dekoru/struktury i fakt sprawdzenia próbki osobno od obrazu wizualizacyjnego. Obraz renderu nie może być jedynym dowodem zaakceptowanego produktu.

## Kryteria odbioru i ryzyka

- Fixture materiału o wymiarze źródła 1000 × 2000 mm zastosowany na elementach o różnym gabarycie zachowuje tę samą skalę wzoru w metrach, niezależnie od wielkości elementu i rozdzielczości renderu.
- Kierunkowy dekor ma zgodną orientację na froncie i boku; test odwrócenia lewej/prawej części jawnie kontroluje lustrzane odbicie oraz teksturę. Kierunkowość false nie wymusza orientacji drewna.
- Ten sam wariant materiału ma ten sam identyfikator w widoku interaktywnym, renderze oferty i snapshotcie projektu. Różne są tylko udokumentowane poziomy jakości/tekstury, nie wybrany produkt.
- Test przestrzeni barw sprawdza, że kolorowa mapa jest oznaczona sRGB, a mapy danych nie są błędnie konwertowane jak kolor; eksport PNG/PDF nie ma drugiej lub brakującej transformacji. Nie obiecywać kalibracji fizycznej dla niekalibrowanego ekranu.
- Asset bez potwierdzonego prawa użycia lub bez skali/orientacji nie dostaje statusu „tekstura produktu”; brak mapy powoduje jawny fallback do stylizowanej próbki, nie błąd renderowania ani ciche użycie miniatury.
- Duże tekstury mają budżet rozmiaru/dimensions i liczbę aktywnych materiałów; Three.js dokumentuje, że rozmiar pamięci GPU zależy od wymiarów rozpakowanej tekstury. Zmierzyć benchmark przed ustawieniem limitu, nie wymyślać limitu z samej wielkości JPG.

**Zależności:** potwierdzenie praw/licencji assetów (brief praw do katalogów), informacja o fizycznym obszarze i kierunkowości skanu, stabilne powiązanie wariantu z `Material`, synchronizacja trybu podglądu z renderem oferty oraz zapis wersji produktu w akceptacji/snapshotcie. Nie zmieniać ceny ani danych klienta.

**Niezweryfikowane:** nie wykonano wizualnego testu bieżącego widoku w przeglądarce ani pomiaru renderu; zewnętrzne pliki map producentów i ich warunki licencyjne nie zostały dopuszczone. Nie wiadomo, czy przyjęty przez warsztat proces wymaga ciągłości usłojenia dla konkretnych frontów — potwierdzić z technologiem.

## Punkt wznowienia

- Ostatnia sprawdzona rewizja `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude w tym przebiegu.
- Przegląd statyczny wskazanych plików; testów aplikacji nie uruchamiano, nie zmieniono logiki ani rekordów materiałów.
- Następnie: sprawdzić, czy w nowych zmianach Claude wspólny snapshot/render utrwala wybrany produkt materiału; potem, jeśli brak zmian, audyt spójności produktu między 3D, dokumentem oferty i zaakceptowaną próbką.
