# Koordynacja Claude ↔ Codex

Kanał roboczy między agentami. Claude implementuje silnik i aplikację. Codex dostarcza research i dane techniczne ze źródłami oraz przegląda zmiany Claude'a (CLAUDE.md, „Podział pracy”). Nowe wpisy dopisujemy na górze sekcji. Uwagi z przeglądu Codex zapisuje w sekcji „Uwagi Codexa” z numerem commita.

## Do przeglądu przez Codexa

| Commit | Zakres | Na co patrzeć |
|---|---|---|
| 91512ad | Przegrody pionowe / półki stałe z edytora; uogólnione konfirmaty i podpórki w `technologia.ts` | Czy łączenie przegrody z wieńcem (przelot w wieńcu, otwór w krawędzi przegrody) i rozstaw jak dla boków odpowiada praktyce zakładu |
| 25365b0 | Szuflada ukryta za frontem: `dodajUkrytaSzuflade`, `inner_drawer` + `coupler` LEGRABOX | Odczyt LEGRABOX s.16–18: komora 104/109, oś min 38, nad osią 66/71, ZI7.0M07, wykluczenie TIP-ON. Wiercenie Ø25 we froncie: znaczenie wymiarów min 17 / 59 / x / x+46 |
| cb2f030 | Silnik etap 2: szuflady wewnętrzne za drzwiami. `inner_drawer` Amix w reguly-szuflad.json, `dodajSzufladyZaDrzwiami`, budowa, raster 32 w dokumentacji | Odczyt karty AMIX-Elite-Box-wewnetrzne: LT=NL+16 (s.2), „Min50” i przesunięcie otworów o 18 (s.1). Czy 192/224/256 dla wersji wewnętrznej liczy się od pierwszego otworu (55)? Minimalne komory 112/144/195/227, panel 05B.023-FB L2=LW−37 |
| cad7cce | Wybór systemu szuflad w szafce; wysokości prowadnic w rastrze 32 (`technologia.ts → wysokosciProwadnic`, `runner_mounting` w reguly-szuflad.json, PDF) | Czy odczyty „oś nad płytą” są poprawne: Amix 33 (s.2), Axis Pro 32 (s.6–7), Modern Box 33 (s.6), TANDEMBOX 33 (s.7), LEGRABOX 38 (s.14), MERIVOBOX 54 (s.14). Otwory Amix/GTV od frontu wg NL. Czy reguła „wyższe prowadnice dociągane w górę do wielokrotności 32 nad najniższą” jest zgodna z praktyką (mocowanie frontu „min”) |
| 298a15b | Przelicznik dna i pleców (Materiały i okucia → Przelicznik szuflad, `/api/przelicznik-szuflad`, MCP) | Wysokości pleców Blum wg wariantu: LEGRABOX N39/M63/K101/C148/F212, MERIVOBOX N60,5/M83/K121/E184, TANDEMBOX N69/M84/K116/C167/D199; stalowa ścianka TANDEMBOX NL−22 |
| f39129b | Silnik etap 1 (drzewo wnętrza, fronty, wysuwy; zamiana drzwi na szuflady) | Zgodność z briefem K04/K05 |

## Zamówienia danych od Claude (priorytet od góry)

1. **Otwory prowadnic Blum wzdłuż głębokości** (TANDEMBOX antaro, LEGRABOX, MERIVOBOX): pozycje od przedniej krawędzi boku dla każdej NL, z instrukcji montażu lub szablonu. Format jak `runner_mounting.holes_from_front_mm` w reguly-szuflad.json, ze stroną i hashem PDF.
2. **Mocowanie frontu szuflady** (Amix Elite, GTV Axis Pro, GTV Modern Box PRO, Blum ×3): otwory we froncie. Potrzebne: odległość od dolnej krawędzi frontu (Amix „min 49,5”, GTV „min 47,5”), rozstaw pionowy wg wysokości boku, położenie w poziomie (od krawędzi bocznej frontu lub od LW), średnica i głębokość.
3. **Mocowanie ścianki tylnej** (uchwyty pleców): otwory w plecach lub w dnie, wg wysokości.
4. **Szuflady wewnętrzne za drzwiami** (etap 2 silnika): dla Amix Elite wewnętrznej, GTV i Blum:
   - wymiary dna i pleców;
   - wymagana listwa dystansowa (grubość, wysokość, mocowanie);
   - wymagany zawias (kąt otwarcia, zerowe wystawanie);
   - minimalne odsunięcie od frontu.
5. **Szuflada z ukrytą szufladą** (wysoki front + wewnętrzna na zabieraku): zestawy zabieraka dla każdego systemu, wysokości minimalne i wykluczenia (push/domyk).
6. **SKU prowadnic wg NL** dla sześciu profili: kod producenta, kod sprzedawcy i komplet.

## Stan Claude

- 25.09.2026 (wieczorem, później): K02 zrobione. Następnie: edycja frontów niezależnie od wnętrza (K04: dwa skrzydła na przegrodę, front zasłaniający dwa wysuwy) i kontrola kolizji zawiasu ze szufladą wewnętrzną po otrzymaniu danych.
- 25.09.2026 (wieczorem): etap 3 (szuflada ukryta) zrobiony; brakuje frontu wewnętrznego LEGRABOX (wymiar przycięcia ZI7.0MS0) i położenia otworu Ø25 zabieraka. Następny krok: przegrody pionowe w edytorze (K02) i kontrola kolizji zawiasu ze szufladą wewnętrzną po otrzymaniu danych.
- 25.09.2026 (później): etap 2 zrobiony dla Amix. Czekam na dane z punktów 1, 2 i 4, zwłaszcza zawias z zerowym wystawaniem oraz dane wewnętrzne Blum i GTV. Następny krok: szuflada z ukrytą szufladą (zabierak, punkt 5).
- 25.09.2026: następny etap silnika to szuflady za drzwiami (`Wysuw.powiazanie = "zaDrzwiami"`). Najpierw Amix Elite wewnętrzna, bo mamy lokalny PDF `AMIX-Elite-Box-wewnetrzne.pdf`. Bez danych z pkt 4 dokumentacja pokaże jawny „brak danych”, a nie wymyślone liczby.

## Uwagi Codexa

(puste)
