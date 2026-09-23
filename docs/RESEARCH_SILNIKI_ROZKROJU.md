# Research: silniki optymalizacji rozkroju płyt — stan wiedzy i projekt dla Stolarni Online

Data: 2026-09-23. Oznaczenie **[?]** = twierdzenie niezweryfikowane w źródle pierwotnym (z pamięci / z opisów marketingowych / z wnioskowania).

## 0. Diagnoza obecnego silnika (`src/core/production.ts`, `rozkroj()`)

Obecny silnik to jednoprzebiegowy **shelf best-fit**: półki (pasy) biegną wzdłuż krótszego boku (2070), układane jedna pod drugą wzdłuż 2800; wysokość półki wyznacza pierwsza (najdłuższa) formatka. Skąd 46–80%:
1. **Brak 3. etapu**: pod krótszymi formatkami w półce zostaje martwa przestrzeń (nie da się tam włożyć drugiej formatki „na stos”). To główna strata.
2. Jedna reguła sortowania, jeden kierunek pierwszego cięcia, zero multi-startu.
3. Zachłanność globalna: formatka trafia na pierwszy arkusz, gdzie „jakoś pasuje”, bez oceny całego arkusza.
4. Ostatni arkusz zawsze jest słaby. To normalne, ale raport powinien to pokazać osobno (ostatni arkusz + resztka do magazynu) zamiast zaniżać średnią.
5. `wykorzystanieProcent` liczony od pełnego arkusza. Warto pokazywać też procent od pola użytkowego (po obrzynce).

## A. Porównanie algorytmów

| Algorytm | Jakość (typ. płyty meblowe) | Szybkość | Zgodność z piłą panelową | Trudność w TS |
|---|---|---|---|---|
| Shelf / strip FFD/BFD (obecny) | niska–średnia (60–80%) | µs | tak, 2-etap. | bardzo łatwa |
| **2/3-etapowy guillotine z DP (knapsack) na pasy i stosy** (Gilmore–Gomory 1965 styl) | dobra–b. dobra | ms | **tak, gwarantowane ≤3 etapy** | średnia |
| Guillotine bin pack (Jylänki: wybór wolnego prostokąta BAF/BSSF + reguła podziału SAS/LAS/MinAS/MaxAS + merge) | dobra | ms | tak, ale **dowolna liczba etapów** (drzewo nieograniczone) | łatwa |
| MaxRects (BSSF/BL/CP) | najlepsza z prostych heurystyk | ms | **nie** (non-guillotine; nadaje się tylko do CNC nestingu) | łatwa |
| Skyline (BL / MinWaste + waste map) | średnia–dobra | bardzo szybka | nie w ogólności | łatwa |
| Bottom-Left (BL/BLF) | średnia | ms | nie | łatwa |
| Multi-start „best-of” (wiele sortowań × reguł × orientacji) | +3–10 pp względem jednej heurystyki [?] | 10–500 ms | jak baza | łatwa |
| Sequential Value Correction (SVC) | b. dobra dla wielu arkuszy | 0.1–2 s | jak baza | średnia |
| Metaheurystyki (GA na permutacji, SA, ruin&recreate) nad dekoderem | b. dobra, niedeterministyczna | s | jak dekoder | średnia |
| Beam search / anytime tree search (Fontan & Libralesso, PackingSolver) | **state-of-the-art** (1. miejsce ROADEF/EURO 2018) | s (anytime) | tak, 2/3-etap., exact/non-exact | wysoka |
| Column generation (Gilmore–Gomory) + pricing knapsack | optimum LP; świetna przy dużych seriach i małej liczbie typów | s | tak | wysoka (wymaga LP) |
| Nesting NFP + GA (Deepnest/SVGnest) | kształty dowolne | wolna | nie | b. wysoka, zbędna |

Źródła: Jylänki, *A Thousand Ways to Pack the Bin* + kod (public domain) https://github.com/juj/RectangleBinPack; Fontan & Libralesso, arXiv:2004.02603 https://arxiv.org/abs/2004.02603; przegląd metod i benchmark CutOptim (guillotine multi-strategy 93,2% w ~1,7 s vs MaxRects 90,3% w ~62 ms dla 2000 elementów, dane producenta) https://cutoptim.com/guides/how-cutting-optimization-works.

Wniosek z Jylänkiego [?, z pamięci o treści PDF]: MaxRects-BSSF z globalnym wyborem jest najlepszy ogólnie, ale **daje układy nie-gilotynowe**, więc na pile panelowej odpada. Z gilotynowych najlepiej wypadają warianty BSSF/BAF z podziałem wg krótszej osi reszty (SAS/MinAS) i scalaniem wolnych prostokątów. Nadal jednak nie ograniczają liczby etapów.

## B. Co robią najlepsze silniki (ze źródłami)

- **OpenCutList 7 (SketchUp, GPL-3.0)**: od wersji 7.0 diagram rozkroju działa na **PackingSolver** (fork `lairdubois/fontanf-packingsolver`). Typy problemu: One (1D), Guillotine, Rectangle, Nesting. Tryby cięcia: exact, non-exact, homogeneous. https://docs.opencutlist.org/features/parts/parts-list/packing, https://github.com/lairdubois/fontanf-packingsolver
- **PackingSolver (F. Fontan, MIT)**, solver `rectangleguillotine`: wzory 2- i 3-etapowe; cięcia exact / non-exact / roadef2018 / homogenous; pierwsze cięcie pionowe / poziome / dowolne; grubość cięcia (kerf); obrzynki (trims); minimalny odpad; min/max odstęp między 1-cięciami i 2-cięciami; stosy (kolejność wyjmowania); defekty płyty. Cele: bin-packing, **bin-packing-with-leftovers** (min. liczba arkuszy + max wartość resztki na ostatnim), variable-sized bin packing (różne formaty z kosztem), knapsack, open-dimension. Metoda: anytime tree search (beam search z rosnącą szerokością), a w 1D także column generation i SVC. https://github.com/fontanf/packingsolver, https://fontanf.github.io/packingsolver/objectives.html
- **SmartCut (smartcut.dev, CutList Optimizer iOS)**: płatne hostowane API (REST + **MCP** pod `https://api.smartcut.dev/mcp`, narzędzia calculate/validate/status/result/cancel/export). Tryby: guillotine, efficiency (CNC), beam, nesting. Grain i blokada orientacji per formatka, kerf, trim per krawędź (L1/L2/W1/W2), okleina jako wejście, limit czasu (domyślnie ok. 25 s). Eksport PDF/CSV/DXF/SVG oraz formaty pił: PTX (Homag), Biesse XML, Mayer. Cut preference: najpierw cięcia wzdłuż długości (piła panelowa, rip) albo szerokości. https://github.com/jgmedialtd/smartcut-api, https://cutlistoptimizer.app/help.html. Algorytm zamknięty.
- **CutList Optimizer (cutlistoptimizer.com)**: grubość cięcia, etykiety, „orientation matters”, „consider materials”, okleina, **Optimization priority: mniej odpadu / mniej cięć**, wymuszenie jednego arkusza. Statystyki: liczba arkuszy, pole użyte/odpad, **liczba cięć i łączna długość cięć**, tabela cięć, lista „nie zmieściło się”, eksport PDF i obrazów. Silnik zamknięty. https://www.cutlistoptimizer.com/
- **OptiCut (Boole & Partners)**: 6 trybów (Fast … Advanced 2, NC) jako kompromis czas/iteracje („najlepsze wyniki zwykle przed 10. iteracją, czasem po 50.”). Kierunek pierwszego cięcia, **maksymalny poziom docięć (recut level = liczba etapów)**, obracanie płyty (turnarounds), **grupowanie pasów** (mniej cięć przez odpad, więcej użytecznych resztek), „zacznij od resztek”, gdy pokrycie ≥ X%. Ciągłość usłojenia między formatkami, etykiety z QR i kodem kreskowym. https://wooddesigner.org/help-centre/opticut-optimization-parameters/, https://www.boole.eu/opticoupe.php
- **MaxCut**: Normal (max wydajność, bez gwarancji etapów) oraz Multistage wzdłuż długości lub szerokości z **liczbą poziomów**; opcja zbierania odpadów na dole arkusza (czytelna, użyteczna resztka) albo rozkładania ich dla max wydajności; priorytet „mniej odpadu / szybsze cięcie”. https://knowledge.maxcutsoftware.com/help/optimisation-method-settings, https://maxcutsoftware.com/optimal-cutting-layouts/
- **Homag Cut Rite / productionAssist**: optymalizator rozwijany od ponad 40 lat, magazyn resztek (stock control), optymalizacja odpadów. W cięciu pakietowym (book) każdy wzór ma jeden cykl albo wszystkie cykle o tej samej wysokości pakietu. **Guided strip cutting**: operator widzi aktualny pas (jasnoniebieski), oczekujące (ciemnoniebieskie) i wykonane (szare), ma etykiety pasów. https://docs.homag.cloud/en/news/article/simplification-of-the-cutting-pattern-processing-guided-strip-cutting, https://www.magi-cut.co.uk/files/html/V12webhelp/mct1072.htm. Deklarowany zysk: 11,5% materiału (materiał marketingowy).
- **Polskie**: Nowy Rozkrój (5 kryteriów optymalizacji, cięcie od brzegu do brzegu i na pasy, netto/brutto zależnie od okleiniarki, magazyn odpadów, etykiety, raport długości okleiny, integracja z PRO100) https://www.ecru.pl/pl/nowy-rozkroj; Mega Rozkrój (eksport na piły Holzma/SCM/Biesse itd., etykiety z kodem, wizualizacja przy maszynie) https://www.megarozkroj.pl/; Optimik (bloki formatek z zachowaniem rysunku słojów na frontach szuflad) https://www.dobreprogramy.pl/optimik,program,windows,6628695955048577.
- **Biblioteki JS/TS**: `guillotine-packer` (MIT; kerf, próbuje wszystkie strategie sort/split/select i wybiera najlepszą; jeden format; etapy nieograniczone) https://github.com/tyschroed/guillotine-packer. `maxrects-packer` (MIT; atlasy tekstur, padding zamiast kerfu, nie-gilotynowy) https://github.com/soimy/maxrects-packer. `binpackingjs` (MIT; MaxRects) https://github.com/olragon/binpackingjs. `potpack` (ISC [?]; jeden rosnący kontener, bezużyteczny tutaj). `rectpack` (Python, Apache-2.0 [?]; MaxRects/Skyline/Guillotine, tryby BNF/BFF/BBF/Global) https://github.com/secnot/rectpack. OR-tools (Apache-2.0) ma CP-SAT z `NoOverlap2D`, co wystarcza do dokładnych małych instancji, ale nie do gilotyny [?]. Deepnest to nesting NFP+GA (MIT [?]).

**Wspólny mianownik najlepszych**: (1) model **drzewa cięć** z limitem etapów zamiast „wolnych prostokątów”; (2) wiele przebiegów w budżecie czasu (anytime); (3) cel leksykograficzny: arkusze → wartość resztki → cięcia; (4) resztki i różne formaty jako stock z kosztem; (5) przełącznik mniej odpadu / mniej cięć.

## C. Rekomendowany silnik dla Stolarni Online

### C1. Rekomendacja strategiczna
- **Wariant 1 (rekomendowany na start, własny TS, ~2 tyg.)**: konstrukcyjny packer 3-etapowy z DP + multi-start + SVC + ruin&recreate w Web Workerze / `worker_threads`, z budżetem czasu. Pełna kontrola, zero zależności.
- **Wariant 2 (później, jeśli trzeba wycisnąć ostatnie 2–4 pp)**: PackingSolver (C++, MIT) skompilowany do WASM przez Emscripten albo uruchamiany jako natywny proces w backendzie Node. To droga OpenCutList. Nakład: ok. 3–6 dni na build i mapowanie I/O [?, zależności: CMake, pakiety fontanf]. **Wspólny model danych z sekcji C2 pozwala podmienić silnik bez zmian w UI.**

### C2. Model danych
```ts
type Dir = "L" | "W";                       // L = wzdłuż długości arkusza (usłojenie)
interface StockSheet { id: string; materialId: string; thicknessMM: number;
  lengthMM: number; widthMM: number; qty: number | "inf"; cost: number;
  isRemnant: boolean; grainAlongLength: boolean;
  trim: { L1: number; L2: number; W1: number; W2: number } }   // obrzynka zawiera rzaz
interface PartDemand { id: string; label: string; materialId: string; thicknessMM: number;
  finishedL: number; finishedW: number; qty: number;
  grain: "L" | "W" | "free";                // "L" = długość formatki wzdłuż usłojenia
  edges: { L1?: EdgeBand; L2?: EdgeBand; W1?: EdgeBand; W2?: EdgeBand };
  moduleId?: string; priority?: number; groupId?: string /* ciągłość usłojenia frontów */ }
interface EdgeBand { code: string; thicknessMM: number }
interface OptimizeParams { kerfMM: number; maxStages: 2 | 3; firstCut: Dir | "any";
  cutMode: "exact" | "nonexact";           // nonexact = dozwolone docięcie (trim) elementu w stosie
  objective: "waste" | "cuts" | "balanced"; timeBudgetMs: number;
  minRemnant: { L: number; W: number; areaM2: number }; premillMM: number; bookHeightMM?: number; seed: number }
// Wynik: drzewo cięć (nie tylko prostokąty!)
interface CutNode { x: number; y: number; l: number; w: number; stage: 0|1|2|3|4;
  kind: "sheet" | "strip" | "block" | "part" | "waste" | "remnant"; partId?: string;
  rotated?: boolean; children?: CutNode[]; cutIndex?: string /* "3.2.1" */ }
interface SheetResult { stockId: string; root: CutNode; repeat: number; stats: SheetStats }
```
**Wymiar do cięcia** = wymiar gotowy − Σ grubości okleiny na krawędziach, które są na danej osi, + 2·premill (jeśli okleiniarka frezuje wstępnie). Dotychczasowa funkcja grubości ABS (0,8 / 2 mm) w `production.ts` zostaje, ale korekta ma być liczona w preprocessingu, jawnie i widocznie w raporcie (kolumna „wymiar netto/brutto”, jak w Nowym Rozkroju).

### C3. Pipeline
1. **Preprocess**: grupowanie materiał+grubość (już jest); wymiary cięcia; walidacja (co się nie mieści i dlaczego); dozwolone orientacje wynikające z grain (arkusz z usłojeniem wzdłuż L i formatka `grain:"L"` → tylko orientacja bez obrotu).
2. **Dolna granica** `LB = ceil(Σ pól / pole użytkowe)` do raportu jakości („12 arkuszy, minimum teoretyczne 11”).
3. **Konstrukcja** (dekoder): `packSheetByStrips` (niżej), arkusz po arkuszu. Dla każdego arkusza generuje K kandydatów (różne formaty i resztki, `firstCut ∈ {L,W}`, reguły lidera pasa) i bierze najlepszy wg gęstości ważonej wartościami SVC.
4. **Multi-start**: sortowania {pole↓, dłuższy bok↓, krótszy bok↓, obwód↓, szerokość↓} × `firstCut` × {exact, nonexact} × losowe zaburzenia kolejności (seed). Każdy wynik trafia do puli.
5. **SVC** (Sequential Value Correction): po każdym pełnym rozwiązaniu wartość formatki `v_i ← (1−α)v_i + α·area_i / density(arkusz, na który trafiła)`. Formatki „trudne” (lądujące na słabych arkuszach) zyskują priorytet w następnych przebiegach.
6. **Ruin & recreate** (do końca budżetu czasu): usuń 1–3 najsłabsze arkusze (albo losowy pas z każdego arkusza), przepakuj ich formatki z innym seedem, przyjmij wynik, jeśli score się poprawił (lub z prawdopodobieństwem SA).
7. **Ostatni arkusz**: osobny cel „bin-packing-with-leftovers”: zepchnij formatki do jednego rogu i maksymalizuj największy prostokąt resztki. Jeśli resztka ≥ `minRemnant`, zaproponuj ją do magazynu.
8. **Deduplikacja wzorów**: hash kanoniczny drzewa. Identyczne arkusze łączymy w `repeat: n`, a przy `bookHeightMM` liczymy pakiety `floor(book/grubość)`. W trybie „cuts” konstruktor najpierw próbuje powtórzyć poprzedni wzór, jeśli pozwala na to pozostała liczba sztuk (bonus w score).
9. **Anytime**: worker wysyła każdy nowy najlepszy wynik do UI (pasek postępu i „najlepszy: 11 ark., 87,4%”).

### C4. Funkcja celu (leksykograficzna, mniejsze = lepsze)
```
score = [ unplacedCount,
          Σ stockCost(nowe arkusze) + Σ remnantCost·0.5,            // najpierw koszt materiału
          −leftoverValue(ostatni arkusz)  // = pole największego prostokąta ≥ minRemnant (lub (area)^1.2)
          objective=="waste" ? cutsCount·ε : cutsCount + λ·totalCutLengthM,
          distinctPatterns ]
balanced: druga i czwarta pozycja łączone jako koszt = materiał[zł] + cięcia·koszt_cięcia[zł] (np. 0,30 zł/cięcie [?])
```

### C5. Gwarancje
- Każdy wynik to drzewo: arkusz → pasy (etap 1, pełne cięcia wzdłuż `firstCut`) → bloki (etap 2, cięcia poprzeczne) → formatki (etap 3). W trybie `nonexact` dochodzi co najwyżej jedno docięcie odpadu na formatkę (tzw. trim, liczony jako etap 3+; to samo co „non-exact 3-staged” w PackingSolver).
- `maxStages=2` ⇒ w bloku jedna formatka, blok = pełna wysokość pasa (exact) lub z docięciem.
- Walidator po optymalizacji (testy property-based): brak nachodzenia, kerf między sąsiadami, wszystkie cięcia od krawędzi do krawędzi rodzica, głębokość ≤ maxStages, grain zachowany, suma sztuk = zapotrzebowanie.

### C6. Pseudokod: pakowanie 3-etapowe z kerfem
Trik kerfowy do DP: n elementów o szerokościach `w_i` mieści się w długości `S`, gdy `Σw_i + (n−1)k ≤ S`, czyli `Σ(w_i+k) ≤ S+k`. Wystarczy więc knapsack z rozmiarami `w_i+k` i pojemnością `S+k`. Siatka 0,1 mm → liczby całkowite.

```
function packSheet(stock, demand, P, values): SheetPattern
  U = usableRect(stock)                        // po obrzynce (trim zawiera rzaz)
  (A, B) = P.firstCut == "L" ? (U.len, U.wid) : (U.wid, U.len)   // A: długość pasa, B: oś układania pasów
  strips = []; usedB = 0
  loop
    best = null
    for lead in distinctOrientedPartsFitting(demand, grain, A, B - usedB - kerfIf(strips))
      h = lead.sizeAlong(B)                   // szerokość pasa = wymiar lidera
      s = fillStrip(A, h, demand, P, values)  // etap 2+3
      if s.empty: continue
      dens = s.value / (A * h)                // gęstość ważona SVC
      if best == null or dens > best.dens: best = {s, h, dens}
    if best == null: break
    strips.push(best.s); take(demand, best.s.items); usedB += best.h + P.kerf
  // opcjonalnie: 1D-knapsack po B na kandydatach pasów (Gilmore–Gomory) zamiast zachłannego wyboru
  return assembleTree(strips) with trailing waste/remnant node

function fillStrip(A, h, demand, P, values): Strip
  // etap 2: pas dzielimy poprzecznie na bloki o długości (wzdłuż A) = szerokość bloku
  // etap 3: w bloku układamy formatki w stos wzdłuż h (cięcia równoległe do 1. etapu)
  candidates = []
  for each block-width bw in distinct part sizes along A with any part height ≤ h:
    items = parts whose sizeAlong(A) == bw (exact) or ≤ bw (nonexact → +trim)
    stack = boundedKnapsack(items, size = sizeAlong(B)+kerf, cap = h+kerf, value = values)
    if P.maxStages == 2: stack = best single item (h equals or trimmed)
    candidates.push(block{bw, stack, value = Σvalues})
  // etap 2: wybór bloków wzdłuż A — bounded knapsack z uwzględnieniem dostępnych sztuk
  chosen = boundedKnapsack(candidates, size = bw + kerf, cap = A + kerf, value)
  return Strip{h, blocks: chosen}               // kolejność bloków: malejąca wartość lub grupowanie identycznych (tryb "cuts")

function solve(allParts, stocks, P):
  best = null; values = area(parts)
  for (order, firstCut, mode, seed) in schedule until timeBudget:
    sol = []; rem = copy(allParts)
    while rem not empty:
      cand = [packSheet(s, rem, P', values) for s in availableStocks(stocks) ]   // resztki i różne formaty
      pick = argmax(cand, c => c.value / c.stockCost)    // remnant tylko gdy density ≥ progu
      if pick.empty: markUnplaced(rem); break
      sol.push(pick); take(rem, pick)
    sol = optimizeLastSheetLeftover(sol); sol = dedupePatterns(sol)
    values = svcUpdate(values, sol)
    if better(score(sol), score(best)): best = sol; emitProgress(best)
  while time left: best = ruinAndRecreate(best)
  return best
```
Złożoność: knapsack O(n·S/0,1 mm). Przy S ≤ 28000 i n ≤ 100 różnych formatek to ~3 mln operacji na pas, więc na kuchnię (50–150 formatek, 3–10 arkuszy) setki przebiegów/s w workerze [?, szacunek]. Przy dużych S można zejść do siatki 1 mm z korektą końcową.

**Liczenie cięć** z drzewa: `cuts(node) = (children.length − 1) + (ostatnie dziecko ≠ krawędź ? 1 : 0) + Σ cuts(child)`. Długość cięcia = wymiar rodzica prostopadły do cięcia. Kolejność numeracji: `1`, `1.1`, `1.1.1` (etap.kolejność), zgodna z Homag guided strip cutting.

### C7. Oczekiwane efekty i nakład
- Szacunek [?]: typowa kuchnia 85–92% łącznie (poza ostatnim arkuszem), zwykle 1 arkusz mniej na materiał przy 5+ arkuszach. Należy zweryfikować benchmarkiem: 10 zapisanych projektów, metryki arkusze/LB/cięcia/czas, snapshoty w testach.
- Nakład: model + preprocessing + walidator + testy **2–3 dni**; packer 2/3-etapowy z DP **3–4 dni**; multi-start + SVC + ruin&recreate + budżet czasu w workerze **3 dni**; resztki, wiele formatów, deduplikacja, pakiety **2–3 dni**; razem **~2–2,5 tyg.** silnika. UI jak w D: **1,5–2 tyg.** Opcjonalny PackingSolver/WASM: +1 tydzień.

## D. UI wyników (rekomendacje)

1. **Nagłówek-podsumowanie (karty)**: arkusze użyte / minimum teoretyczne; wykorzystanie łącznie oraz bez ostatniego arkusza; odpad m² i zł; resztki do magazynu (szt., m²); **liczba cięć, łączna długość cięć [m], szac. czas piły**; okleina per kod [mb] + naddatek; koszt materiału. Osobno lista „nie zmieściło się” z powodem.
2. **Widok arkusza (SVG, skalowalny)**: formatki w kolorze modułu, z **numerem pozycji** (tym samym co na liście i etykiecie) i wymiarami; szrafura kierunku usłojenia (arkusz i formatka); **okleina jako pogrubiona krawędź** (jak w SmartCut); odpad szary kreskowany, **resztka ≥ min** wyróżniona i opisana wymiarem z „R-12 → magazyn”; obrzynka pokazana. Hover podświetla formatkę na liście i odwrotnie.
3. **Sekwencja cięć**: linie cięć z numerami hierarchicznymi (1, 1.1, 1.1.1), grubością zależną od etapu, oraz **tryb krok-po-kroku** (następny/poprzedni). Wzorzec: Homag guided strip cutting, gdzie bieżący pas jest podświetlony, wykonane wyszarzone, a przy każdym kroku widać wymiar ustawienia prowadnicy.
4. **Grupowanie**: identyczne arkusze jako „×3” (z wysokością pakietu, jeśli jest cięcie pakietowe); zakładki per materiał+grubość; miniatury arkuszy z procentem.
5. **Sterowanie**: przełącznik **Mniej odpadu / Balans / Mniej cięć**; **suwak czasu** (1–30 s); kierunek pierwszego cięcia (auto / wzdłuż / w poprzek); maks. etapy (2/3); „użyj resztek z magazynu”; ponowne przeliczenie z innym seedem. Postęp anytime („znaleziono lepszy: 10 ark.”).
6. **Porównanie wariantów**: tabela 2–3 ostatnich przebiegów (arkusze, %, cięcia, resztki) z wyborem aktywnego.
7. **Edycja ręczna (faza 2)**: przeciągnięcie formatki na inny arkusz lub zamiana dwóch formatek z walidacją gilotyny i kerfu, blokada (pin) arkusza i przeliczenie reszty.
8. **Wydruki**: PDF A4 poziomo, arkusz na stronę (diagram + tabela cięć + lista formatek); **etykiety** (np. 70×36 mm, A4 3×8) z QR/kodem, numerem, modułem, wymiarem, materiałem, oznaczeniem okleiny na krawędziach i strzałką usłojenia; CSV dla piły. Formaty maszynowe (PTX Homag, Biesse, Mayer) jak w SmartCut to temat na później.

## E. Licencje i ryzyka

- **OpenCutList: GPL-3.0**. Nie kopiować kodu ani nie tłumaczyć go 1:1 do zamkniętego SaaS/aplikacji (ryzyko copyleft; przy SaaS GPL nie wymusza publikacji źródeł, ale dystrybucja klienta webowego już tak [?]). Inspiracja koncepcyjna jest bezpieczna.
- **PackingSolver: MIT**. Można używać w produkcie komercyjnym z zachowaniem noty licencyjnej. Sprawdzić licencje zależności fontanf (optimizationtools, treesearchsolver, columngenerationsolver itd.) i ewentualnego solvera LP (CLP/HiGHS są permisywne, CPLEX/Gurobi nie) [?].
- **RectangleBinPack (Jylänki)**: public domain. **guillotine-packer, maxrects-packer, binpackingjs: MIT**. **rectpack: Apache-2.0 [?]**. **OR-tools: Apache-2.0**. **Deepnest: MIT [?]** (zbędny).
- **SmartCut API**: repozytorium przykładów na MIT, ale sama usługa jest płatna i zamknięta. Dane klienta wychodzą na zewnątrz (RODO, zależność od dostawcy). Ewentualnie jako porównawczy benchmark, po akceptacji ToS przez właściciela konta.
- **CutList Optimizer, OptiCut, MaxCut, Cut Rite, Magi-Cut, Nowy/Mega Rozkrój, Optimik**: zamknięte. Wolno inspirować się funkcjami i UI, nie wolno kopiować grafik ani tekstów pomocy ani używać ich nazw w marketingu.
- Patenty na algorytmy rozkroju: nie znaleziono kolizji dla metod klasycznych (Gilmore–Gomory 1961/65, heurystyki shelf/guillotine/SVC są dobrze udokumentowane w literaturze) [?, bez przeglądu patentowego].
