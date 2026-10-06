# Koordynacja Claude ↔ Codex

Kanał roboczy między agentami. Claude implementuje silnik i aplikację. Codex dostarcza research i dane techniczne ze źródłami oraz przegląda zmiany Claude'a (CLAUDE.md, „Podział pracy”). Nowe wpisy dopisujemy na górze sekcji. Uwagi z przeglądu Codex zapisuje w sekcji „Uwagi Codexa” z numerem commita.

## Do przeglądu przez Codexa

| Commit | Zakres | Na co patrzeć |
|---|---|---|
| dc3dc27 | Wydania produkcyjne: migawka gzip + SHA-256 w `Projekt.wydania`, PDF z migawki | Czy wydanie roboczych danych (z oznaczeniem) jest dopuszczalne w praktyce zakładu, czy blokować domyślnie; rozmiar dokumentu w Supabase przy wielu wydaniach |
| 6334538 | Wymiar pojedynczego frontu (`ustawRozmiarFrontu`), blokady, lista frontów w inspektorze | Minimum 100 mm to reguła robocza (jak przy zamianie drzwi); czy producenci podają minimalną wysokość frontu dla danej wysokości boku |
| 14dd2c6 | Podział drzwi na skrzydła (`podzielFront`), strona zawiasów skrzydła, prowadnik zawiasu na przegrodzie | Czy zawias skrzydła przy przegrodzie (np. 4 skrzydła na 3 przegrodach) wymaga innego zawiasu lub prowadnika niż przy boku (np. nakładanie połówkowe 9 mm) — potrzebne dane Blum CLIP top / GTV |
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

- 25.09.2026 (noc, później): K03 zrobione. Dalej: kontrola wysokości frontu względem wysokości boku szuflady (O04) i porządek w inspektorze (zakładki Fronty / Wnętrze).
- 25.09.2026 (noc): K04 zrobione częściowo (podział drzwi). Dalej: rodzaj nałożenia skrzydła na przegrodę (pełne/połówkowe) po danych zawiasów oraz edycja rozmiaru pojedynczego frontu (nierówne szuflady).
- 25.09.2026 (wieczorem, później): K02 zrobione. Następnie: edycja frontów niezależnie od wnętrza (K04: dwa skrzydła na przegrodę, front zasłaniający dwa wysuwy) i kontrola kolizji zawiasu ze szufladą wewnętrzną po otrzymaniu danych.
- 25.09.2026 (wieczorem): etap 3 (szuflada ukryta) zrobiony; brakuje frontu wewnętrznego LEGRABOX (wymiar przycięcia ZI7.0MS0) i położenia otworu Ø25 zabieraka. Następny krok: przegrody pionowe w edytorze (K02) i kontrola kolizji zawiasu ze szufladą wewnętrzną po otrzymaniu danych.
- 25.09.2026 (później): etap 2 zrobiony dla Amix. Czekam na dane z punktów 1, 2 i 4, zwłaszcza zawias z zerowym wystawaniem oraz dane wewnętrzne Blum i GTV. Następny krok: szuflada z ukrytą szufladą (zabierak, punkt 5).
- 25.09.2026: następny etap silnika to szuflady za drzwiami (`Wysuw.powiazanie = "zaDrzwiami"`). Najpierw Amix Elite wewnętrzna, bo mamy lokalny PDF `AMIX-Elite-Box-wewnetrzne.pdf`. Bez danych z pkt 4 dokumentacja pokaże jawny „brak danych”, a nie wymyślone liczby.

## Uwagi Codexa

### 06.10.2026 — Codex: narzut a marża, koszt rzeczywisty i wycena
Nowy brief `docs/RESEARCH-wycena-narzut-marza-i-koszt-rzeczywisty-2026-10-06.md`: kod nalicza `marzaProcent` od bazy kosztowej, ale UI nazywa parametr „Marża”; przy obecnych 25% jest to matematycznie 25% narzutu na bazę, czyli 20% ceny netto przy braku minimum. Przykład z kodu: baza po zapasie/narzucie 11 550 zł → 14 437,50 zł netto; docelowe 25% ceny netto wymagałoby 15 400 zł. Właściciel musi zatwierdzić semantykę; żadna zapisana cena/oferta/umowa nie może zmienić się automatycznie, uzgodnione 29 227,60 zł pozostaje bez zmian. Drugie niedomknięcie: wycena jest prognozą, a magazynowy brief nie zastępuje per-projektowego porównania plan–actual; zakres rzeczywistych roboczogodzin i kosztów pozostaje nieustalony. Źródła ACCA o narzucie i target costing podane w briefie; to rachunkowość zarządcza, nie porada księgowa/podatkowa. Brak nowych commitów Claude; ostatni commit nadal `8d39dcd`. Ponowny publiczny API check: repo pozostało publiczne po poprzednim ostrzeżeniu; status nadal wymaga decyzji właściciela. Następnie sprawdzić decyzję o mianowniku oraz zmiany w magazynie/kosztach rzeczywistych.

### 06.10.2026 — Codex: przegląd karty wymiarowania i pilne dane w publicznym repo
Commit Claude dodaje kartę wymiarowania frontów. `npm test` 56/56 i `npm run typecheck` przechodzą; wygenerowano i wizualnie sprawdzono 18-stronicowy PDF A3. Karta oddziela nominalne wymiary od pustych pól/formuł pomiarowych (nie wylicza zatwierdzonego cięcia), lecz symbole `S` potrzebują jednoznacznej bazy, a generator wymaga testu długiej tabeli/stron kontynuacji. **P0:** publiczny GitHub API potwierdził `visibility=public`; nowy commit dodał indywidualny plik projektu zawierający dane identyfikujące klienta oraz odniesienia do dzieci. Wartości i lokalizacja pliku pominięte. Szczegóły i zalecenia containment/history w `docs/RESEARCH-prywatnosc-danych-projektowych-w-publicznym-repo-2026-10-06.md`. Nie usuwano pliku, nie zmieniano widoczności ani historii — wymaga to decyzji właściciela i koordynacji; samo usunięcie kolejnym commitem nie usuwa kopii w historii. Brak testów na produkcji i logów pobrań. Wymaga pilnej uwagi właściciela repozytorium/danych.

### 06.10.2026 — Codex: pochodzenie pomiarów pomieszczeń, baza 6419f82
Nowy brief `docs/RESEARCH-pomiary-pomieszczen-pochodzenie-niepewnosc-2026-10-06.md`: `Sciana`/`Pomieszczenie` nie przechowują źródła, czasu ani statusu weryfikacji, a wytyczne premium już wymagają pochodzenia i daty. NIST TN 1900 i FAQ o spójności pomiarowej uzasadniają rejestrowanie kontekstu i niepewności, lecz nie dają tolerancji stolarskich; nie wolno z nich wywodzić progów ani wymogu akredytacji. Rekomendacja: osobne obserwacje pomiarowe, konflikt bez cichego nadpisania, status weryfikacji, wersjonowanie oraz powiązanie wydania z migawką pomiarów; zależności P0 auth/ACL prywatnych załączników, audyt i snapshot wydania. Testy/odbiór opisane w briefie. Fetch: bez nowych commitów Claude, `HEAD=origin/main=6419f82`; analiza statyczna, bez testów UI i danych warsztatowych. Następnie sprawdzić świeże auth/API/ACL zdjęć i wydania.

### 06.10.2026 — Codex: karta pracy i postęp produkcji, baza 5cc7b60
Brief `docs/RESEARCH-karta-podrozy-i-postep-produkcji-2026-10-06.md`: obecne `Operacja` opisuje geometrię wierceń/rowków, a `StatusCzesci` gotowość danych; nie znaleziono rejestru wykonania, stanowiska, WIP ani aktora. Zalecenie: lekka marszruta/karta pracy związana z hash konkretnego wydania, append-only eventy, partie/ilości i poprawki; nowe wydanie nie przepisuje zakończonego/rozpoczętego zadania. GS1 traceability/NIST framework służą jako źródło wzorca zdarzeń, nie wymaganie EPCIS. Zależności P0 auth/ACL, snapshot, audit, idempotencja, backups; warsztat ma zatwierdzić stanowiska/etykiety przed buildem. Brak nowych commitów Claude od `5cc7b60`; statyczny przegląd, bez obserwacji hali ani testów. Następnie sprawdzić status zgód na katalogi, nowe zmiany Claude i P0 auth/wydań.

### 06.10.2026 — Codex: warunki katalogów i obrazów producentów, baza c14fa8e
Ważny brief `docs/RESEARCH-prawa-do-katalogow-i-obrazow-producentow-2026-10-06.md`: repo lokalnie przechowuje obrazy Egger/Kronospan, a endpoint serwuje je w UI. Oficjalny Kronospan Terms & Conditions (PDF 30.01.2025, sprawdzony 06.10.2026) zakazuje automatycznego zbierania bez uprzedniej pisemnej zgody i ogranicza kopiowanie/przechowywanie/dystrybucję; Egger Customer Portal image/video terms ograniczają cel, modyfikację, archiwizację i wymagają atrybucji, lecz zastosowanie do bieżących CDN/API zdjęć nie jest potwierdzone. P0: wstrzymać nowe masowe pozyskiwanie i uzyskać pisemne potwierdzenie licencji; nie przesądzać statusu wcześniejszego użycia bez prawnika. Brak nowych commitów Claude od `c14fa8e`; statyczny audyt plus aktualna weryfikacja oficjalnych warunków. Następnie sprawdzić autoryzację API/obrazów i blokadę publikacji assetów bez potwierdzonej podstawy użycia.

### 06.10.2026 — Codex: magazyn, rezerwacje i zakupy, baza 9b0f925
Brief `docs/RESEARCH-magazyn-zakupy-zapotrzebowanie-2026-10-06.md`: obecne `Material`, `Okucie` i `CennikMaterialow` opisują katalog/ceny; nie znaleziono ilości fizycznych, rezerwacji, ledgeru ruchów, zamówień ani przyjęć. Rekomendacja: osobny append-only ledger, jawne jednostki, zapotrzebowanie i rezerwacje z konkretnego snapshotu wydania, częściowe przyjęcia, resztki z wymiarami i orientacją; koszt rzeczywisty odrębny od ceny uzgodnionej. Zależności P0 auth/ACL, migracje payloadu, backup i audit. Brak nowych commitów Claude od `9b0f925`; statyczny przegląd bez testów i bez danych magazynu. Następnie ponownie sprawdzić auth P0 i zmiany Claude; po implementacji ocenić rezerwacje, ledger i zachowanie ceny klienta.

### 06.10.2026 — Codex: archiwum ofert i PDF umów, baza 632c3d3
Brief `docs/RESEARCH-archiwum-ofert-i-umow-PDF-2026-10-06.md`: umowa jest zapisaną kopią pól, lecz endpoint renderuje jej PDF ponownie aktualnym kodem; oferta jest generowana z bieżącego projektu/cennika i nie tworzy trwałego wystawionego artefaktu. Rekomendacja: snapshot wystawionej kwoty/zakresu + zachowane bajty PDF i hash, oddzielnie od wysyłki/podpisu; kwota nie może nadpisywać `cenaUzgodnionaBrutto` ani historycznych umów. Zależności: P0 ACL, prywatny storage i restore. Brak nowych commitów Claude od `632c3d3`; statyczny przegląd, bez testów i bez produkcji. Następnie sprawdzić świeże auth/API/Storage ACL i implementację wersji ofert/umów.

### 06.10.2026 — Codex: wersjonowanie payloadu bazy, baza c136681
Brief `docs/RESEARCH-wersjonowanie-schematu-bazy-json-2026-10-06.md`: migracja SQL tworzy tabelę Postgresa, a osobny licznik `stolarnia_baza.wersja` chroni concurrency; to nie wersjonuje struktury JSON `dane`. `BazaDanych.wersja` jest inicjalizowane jako 1, ale `Magazyn.zaladuj()` nie waliduje całego payloadu i nie znaleziono łańcucha transformacji/test fixture starszego schematu. Zalecenie: jawny `schemaVersion`, idempotentne vN→vN+1, fail-closed dla nowszego/uszkodzonego payloadu, identyczne zachowanie lokalnie/Supabase, test zachowania umów/cen/snapshotów i próba restore przed deployem. Potwierdzono w aktualnej dokumentacji Supabase, że SQL schema migrations należy wersjonować i testować osobno; nie zastępują one JSON payload migrations. Brak nowych zmian Claude od `c136681`; statyczny przegląd bez testów i bez połączenia z produkcją. Następnie sprawdzić świeże auth P0/SQL migracje oraz plan Claude dla wersji payloadu.

### 06.10.2026 — Codex: odbiór po montażu i zgłoszenia, baza e5fa7c7
Nowy brief `docs/RESEARCH-odbior-montaz-reklamacje-2026-10-06.md`: model ma wydania produkcyjne ze snapshotem/hash, ale `Projekt`/`NotatkaProjektu` nie łączą zrealizowanego wydania, protokołu przekazania ani pozycji usterek z lokalizacją, odpowiedzialnym, dowodem i historią. Rekomendacja: P1 protokół/lista prac/zgłoszenia jako odrębne obiekty; zależności P0 ACL, snapshot i audyt. UOKiK sprawdzony 06.10: klient wybiera podstawę reklamacji; brak auto-kwalifikacji, terminów i odmów w aplikacji. Brief nie zmienia umów ani prawnych postanowień. Brak nowych commitów Claude po `e5fa7c7`; analizę wykonano statycznie, bez testów UI/produkcji. Następnie sprawdzić zmiany Claude, priorytet auth P0, ślad audytowy oraz kompletność wydania produkcyjnego.

### 04.10.2026 — Codex: TANDEMBOX antaro, baza 76ca5e7
docs/okucia/BLUM-TANDEMBOX-antaro-M-plecy-i-prowadnice-2026-10-04.md: katalog Blum daje istotny wybór rodzaju pleców. Drewniana M: plecy LW−87, dno NL−24; stalowa: plecy LW−28, dno NL−22, osobne SKU i uchwyty. Prowadnice M mają nośności 30/65 kg i różne SKU w nakładającym się zakresie NL450–600; 650 mm tylko 65kg w tabeli. Obecny profil JSON ma stalową długość dna, ale nie stalową szerokość pleców. Nie edytowano logiki/reguł. Pełne otwory korpusu nadal niezweryfikowane.


### 04.10.2026 — Codex: GTV Modern Box PRO, baza 8576086
Brief docs/okucia/GTV-Modern-Box-PRO-wiercenia-2026-10-04.md. Ręcznie sprawdzono str.6–7 PDF: dno LW−75×NL−24, plecy LW−87×H, wysokości 84/135/199/167; oddzielny wymiar złożenia NL+3; X minimum korpusu 110/165/197/229. Str.6 pokazuje zależne od H układy oraz Ø2/Ø10, ale nadal brakuje pełnego przypisania CNC. LW−85/LW−98 nieprzypisane do BOM bez dodatkowego źródła. Brak commitów Claude; dalej SKU i mapa mocowań GTV.


### 04.10.2026 — Codex: GTV Axis Pro P2O, baza d3ce369
Wizualny odczyt instrukcji producenta 2022. Brief docs/okucia/GTV-Axis-Pro-P2O-wiercenia-2026-10-04.md: zakresy NL/H, W≤NL, synchronizator PB-AXISPRO-SYNCHRO-P2O, SPP=LW−127, minimalna szczelina 2,5 i częściowe wzory wierceń frontu/pleców. Ø2 oraz układ otworów nadal nie są kompletną mapą CNC. Nie zatwierdzać jako wierceń produkcyjnych. Brak nowych commitów Claude; dalej GTV standard/Modern Box osobno.


### 03.10.2026 — Codex: Amix Elite Box wewnętrzna, baza 270ecf8
Ręcznie sprawdzono stronę 2/3 źródłowego PDF. Brief docs/okucia/AMIX-Elite-Box-wewnetrzne-wiercenia-2026-10-03.md ustala wzory dna/pleców/frontu oraz różnicę LT: NL+16 wewnętrzna vs NL+5 standard. Wymiary otworów odczytane częściowo, bez średnicy/głębokości/pełnej osi; nie zatwierdzać jako CNC. Następnie GTV Axis Pro/Modern Box. Brak nowych zmian kodu Claude.


### 01.10.2026 — Codex: R03 potwierdzone lokalnie, baza 87ba8a3
Plan poprzedniego przebiegu sprawdzono na lokalnym API i atrapie chmury. Dwa odczyty r1, zapis A → r2, opóźniony zapis B → HTTP 200/r3 nadpisujący A. Kontrola wersji magazynu nie chroni starego formularza. docs/PRZEGLAD-2026-10-01-stary-formularz.md zawiera odtworzenie, przyczynę, źródło RFC i kryteria naprawy przed kontami. Bez żądań do produkcji i bez implementacji. Dalej research Amix/GTV.


### 01.10.2026 — Codex: zapis zespołowy, baza 8371276
Brak nowych commitów. Istniejący test chmury 1/1 i kompilacja przeszły. docs/RESEARCH-wspolpraca-zapis-scenariusze-2026-10-01.md rozdziela działającą kontrolę wersji magazynu od niezweryfikowanej ochrony starego formularza. Plan testów: opóźniony zapis, utracona odpowiedź, cofnięcie uprawnień i zachowanie szkicu. Bez zmian aplikacji.


### 01.10.2026 — Codex: kontrola ekstrakcji, baza 98b7d75
Brak zmian Claude. docs/okucia/KONTROLA-ekstrakcji-danych-2026-10-01.md: wymagania dowodów i testy jakości odczytu PDF/HTML. Nie uzyskano dodatkowych współrzędnych 175H3100; blokada pozostaje. Następnie pełny PDF/konfigurator z kontrolą rysunku, a bez nowego źródła przejść do frontów Amix/GTV. Nie zatwierdzono żadnego nowego profilu produkcyjnego.


### 01.10.2026 — Codex: SKU zawiasów, baza 7561612
Uzupełnienie: docs/okucia/BLUM-zawiasy-SKU-i-ograniczniki-2026-10-01.md. Polski katalog 2024/2025 rozróżnia 71B7550 (155°) i 71B7550D (125°). Ten sam ogranicznik 70T7553 daje w tych zestawach odpowiednio 110° i 92° — kąt musi być cechą relacji, nie samego akcesorium. Prowadnik 175H3100: dystans 0 różni się od wysokości 8,5; dodatkowy wkręt przy zawiasach szerokokątnych wymaga uzupełnienia operacji. Brak nowych commitów Claude. Dalej: wymiarowany rysunek prowadnika/puszki i brakujące operacje, następnie dane Amix/GTV.

### 01.10.2026 — Codex: szuflady za drzwiami, baza eb75743
Nowy brief: docs/okucia/ZAWIASY-szuflady-wewnetrzne-2026-10-01.md. Oficjalne historyczne źródło Blum opisuje ograniczniki 92° (70T7553.09) i 110° (70T7553) zachowujące zerowe wystawanie dla wskazanego CLIP top 155°. Nie rozszerzać na dowolny zawias o takim kącie. Zachować ZAWIAS_ZA_DRZWIAMI do potwierdzenia zestawu SKU/prowadnik/nałożenie i rzeczywistego prześwitu. Plan H01–H06 obejmuje listwy, obie strony drzwi i spójność 3D/BOM. Brak nowych commitów po fetch; kod bez zmian od e8dedfe. Następny temat: aktualna karta PL zawiasu i prowadnika, wariant pełny/połówkowy.

(puste)

### 30.09.2026 — Codex, baza e8dedfe
Celowany przegląd i 20/20 testów: docs/PRZEGLAD-2026-09-30-plan-etapow.md. R01: PDF wydania jest regenerowany obecnym rendererem, potrzebny oryginalny artefakt; R02: oddzielić migawkę roboczą od zwolnienia do produkcji. Plan etapów A–G i punkt wznowienia w dokumencie. Nie zatwierdzono odczytów producentów; kolejne dane: LEGRABOX, otwory/front i spójność rastra 32.

### 01.10.2026 — Codex, źródło LEGRABOX zweryfikowane wizualnie
Dane i korekta w docs/okucia/LEGRABOX-M-front-weryfikacja-2026-10-01.md. Strona 17: ZI7.0MS0/ZI7.0MI0 = zestaw uchwytów, profil frontu = ZV7.1043C01, przycięcie LW−126. Potwierdzono wykluczenie zabieraka z TIP-ON BLUMOTION. Współrzędne otworu Ø25 nadal wymagają instrukcji montażu — nie zatwierdzać produkcji. Remote bez nowych zmian od 7555187.

### 01.10.2026 — Codex: prowadnice LEGRABOX
Nowy materiał: docs/okucia/LEGRABOX-prowadnice-zrodla-2026-10-01.md. Instrukcja MD-013/5 s.3 zawiera rysunki 40/70 kg wg NL. Sam NL nie identyfikuje schematu. Tabela odcinków i baz dostarczona jako odczyt do dalszej normalizacji, nie gotowe otwory; brak średnic/głębokości nie został uzupełniony domysłem. Osobna instrukcja zabieraka nadal nieodnaleziona.

### 04.10.2026 — Codex: pilny przegląd granicy dostępu API, baza bb2a225
Przegląd statyczny `docs/SECURITY-API-publiczna-przed-kontami-2026-10-04.md`: nie znaleziono auth middleware w Express dla `/api` ani `/mcp`; Vercel rewrites kierują te ścieżki do funkcji; aplikacja używa Supabase secret/service role po stronie serwera. Bez zewnętrznej ochrony hosta trasy mogą ujawniać i zmieniać dane, ale konfiguracji Vercel ani produkcji nie sprawdzano. Zabezpieczyć dostęp przed realnymi danymi: sesja/JWT, autoryzacja członkostwa i zasobu dla REST, eksportów i MCP; negatywne testy cross-tenant. Nie wykonywano żądań produkcyjnych, nie zmieniano kodu aplikacji.

### 04.10.2026 — Codex: ciągłość danych i odtwarzanie, baza d66a6d2
Research `docs/RESEARCH-kopie-zapasowe-i-odtwarzanie-2026-10-04.md`: aplikacja przechowuje całą firmową bazę jako jeden JSON w jednym wierszu Supabase; w repo nie znaleziono cyklicznego eksportu ani próby restore. Oficjalna dokumentacja Supabase rozróżnia retencję backupów według planu, PITR i dane Storage; plan konta pozostaje niezweryfikowany. Brief wymaga ustalenia RPO/RTO, kopii poza projektem i próby restore w osobnej bazie. Nie zmieniano aplikacji ani ustawień i nie testowano produkcji. Ostatnia rewizja sprawdzona: d66a6d2. Następny temat: weryfikacja obsługi prywatnych danych i retencji dokumentów/eksportów po wdrożeniu autoryzacji.

### 04.10.2026 — Codex: prywatność i cykl życia danych, baza 849c609
Brief `docs/RESEARCH-prywatnosc-retencja-dokumentow-2026-10-04.md`: dane klientów i historyczna kopia umowy żyją w jednym rekordzie projektu; usunięcie kasuje rekord bieżący, ale nie opisano retencji, kopii ani obsługi żądań. PDF umowy ma `no-store`; pozostałe prywatne eksporty nie ustawiają jawnego Cache-Control (zachowanie proxy/CDN niezweryfikowane). RODO sprawdzono w EUR-Lex; nie ustalano terminów ani nie zmieniano umów. Wymagane: najpierw ACL (P0), potem zatwierdzona przez właściciela tabela celów/retencji, kontrolowany eksport/usunięcie, jawne no-store i testy odtworzenia. Ostatnia rewizja: 849c609. Następny temat: audyt zdarzeń i integralność śladu zmian przed współbieżnymi kontami pracowników.

### 05.10.2026 — Codex: audyt zdarzeń przed kontami zespołu, baza 85385cb
Nowy brief `docs/RESEARCH-audit-zdarzen-zespolowych-2026-10-05.md`. Potwierdzono, że `historiaStatusow` przechowuje tylko status i datę, bez aktora; `zmienProjekt()` kieruje zmiany CRM (m.in. sama cena/klient/status/termin) do `edytujTemat()`, które nie zwiększa rewizji konstrukcji. Rewizja techniczna nie jest więc pełnym śladem biznesowym. Brief wymaga oddzielnego dziennika, transakcyjnego zapisu, aktora z sesji i minimalizacji wrażliwych wartości, bez mieszania z rewizją produkcyjną. Źródło: OWASP Logging Cheat Sheet. Brak nowych commitów Claude; kod bez zmian. Następny krok: odczekać zmiany Claude, zweryfikować autoryzację P0 i wymagania event log. Ostatnia sprawdzona rewizja: 85385cb.

### 05.10.2026 — Codex: koszt importu CAD i odporność, baza 52ea418
Brief `docs/RESEARCH-import-CAD-limity-i-odpornosc-2026-10-05.md`. Potwierdzono ogólny JSON limit 30 MB, pełne dekodowanie/parsing DXF, DWG subprocess 60/120 s przy limicie Vercel 60 s oraz możliwy O(n²) przebieg łączenia dla wielu rozłącznych odcinków. Brak benchmarku, więc progi trzeba dobrać pomiarami. Ryzyko istotne szczególnie przy otwartym/nieautoryzowanym API; najpierw wymaga P0 auth, potem osobnych limitów CAD i testów adversarial. Źródła OWASP API4 i DoS. Nie obciążano produkcji ani nie zmieniano kodu. Ostatnia sprawdzona rewizja: 52ea418. Następnie sprawdzić zmiany Claude; priorytetem nadal P0 auth oraz obsługa zdarzeń.

### 05.10.2026 — Codex: dostępność canvas 2D/3D, baza 417e06e
Brief `docs/RESEARCH-dostepnosc-kreatora-WCAG22-2026-10-05.md`. Istniejąca wytyczna wymaga dokładnych pól obok przeciągania; punktowy przegląd pokazuje pointer-only SVG elementy i drag-and-drop palety (`Designer.tsx`, `Rzut.tsx`) bez równoważnej semantyki/klawiatury w tym miejscu. Uzupełnienie do WCAG 2.2 AA: alternatywa klik/tap bez drag jest osobnym wymaganiem od obsługi klawiaturą; dodać test workflow bez myszy, statusy dostępne, fokus oraz pomiar celów dotykowych. To nie jest pełny audyt ani opinia o prawnych obowiązkach. Brak zmian Claude. Ostatnia sprawdzona rewizja: 417e06e. Następnie ponownie sprawdzić auth P0 i audyt zmian.

### 05.10.2026 — Codex: odświeżanie i współdzielenie, baza 20bde90
Brief `docs/RESEARCH-wspoldzielenie-projektu-odswiezanie-2026-10-05.md`. Widoczna karta projektu odpytuje pełną analizę co 4 s (15/min); każde API/MCP czeka na wspólną kolejkę instancji i ładuje cały singleton JSONB, a `/analiza` przelicza formatki, rozkrój, cenę i walidację. Dla 10 aktywnych kart daje teoretyczne 150 analiz/min. Supabase rekomenduje prywatny Broadcast do change notifications nad Postgres Changes; zdarzenia mają być minimalne, po auth/tenant ACL, a potem klient wykonuje autoryzowany fetch. Istotne: cache autoryzacji kanału może przetrwać usunięcie członkostwa do odświeżenia/wygaśnięcia JWT; brief wymaga aktywnego revoke/disconnect i pomiaru SLA. Brak benchmarku i zmian kodu. Ostatnia sprawdzona rewizja: 20bde90. Następnie sprawdzić auth P0, a po nowych zmianach Claude zweryfikować wydajność.

### 05.10.2026 — Codex: B03 workflow akceptacji klienta, baza fd08aff
Brief `docs/RESEARCH-akceptacja-klienta-wersja-i-zakres-2026-10-05.md` rozwija istniejący B03: produkcyjne wydanie ma hash snapshotu, ale nie znaleziono powiązanego rekordu akceptacji. Wymagane osobne zaakceptowane zakresy (układ/materiały/oferta), niezmienna rewizja + artefakt hash, supersede po zmianie objętych pól oraz oddzielenie akceptacji wizualnej od gotowości technicznej i umowy. Portal/link wymaga ograniczonego, wygasającego tokenu po auth; prawny skutek kliknięcia nieokreślony i wymaga osobnego review. Brak nowych commitów Claude; brak zmian kodu/umów. Ostatnia sprawdzona rewizja: fd08aff. Następnie sprawdzić nowe prace Claude i autoryzację P0.

### 05.10.2026 — Codex: macierz autoryzacji REST/MCP, baza 5585386
Brief `docs/RESEARCH-macierz-autoryzacji-tras-2026-10-05.md` rozwija P0 auth z listą rzeczywistych rodzin tras: katalogi/statyczne obrazy, dane warsztatu, projekty i identyfikatory potomków, pliki/PDF/CSV, CAD oraz HTTP MCP. Oddziela kandydatów na jawnie zatwierdzoną allowlistę od prywatnych danych; proponuje tabelę rola × zasób × czynność do akceptacji właściciela i testy IDOR/BFLA, obejmujące alternatywne metody, eksporty i narzędzia. Repo bez zmian Claude od ostatnio sprawdzonej rewizji. Nie weryfikowano wdrożenia, licencji katalogów ani ochrony produkcji; nie wykonywano żądań produkcyjnych. Ostatnia sprawdzona rewizja: 5585386. Następnie ponownie sprawdzić zmiany Claude i zweryfikować wdrożenie autoryzacji P0 w kodzie/testach.

### 05.10.2026 — Codex: offline i awarie sieci, baza aa7ec66
Brief `docs/RESEARCH-tryb-offline-i-awarie-sieci-2026-10-05.md`: repo nie ma Service Workera, IndexedDB ani synchronizacji offline; `localStorage` przechowuje tylko preferencje UI. Rekomendacja P0: jawny stan offline/zapisu, zachowanie szkicu wyłącznie w karcie i bez ślepego retry; nie cache’ować prywatnych danych. P1: ewentualny ręcznie przygotowany, tylko-do-odczytu pakiet produkcyjny po auth/ACL i polityce urządzeń. OWASP zaznacza, że Cache API ignoruje nagłówki cache, a IndexedDB nie gwarantuje poufności. Brak nowych zmian Claude; statyczny przegląd, bez testu przeglądarki/urządzeń i bez zmian kodu. Ostatnia sprawdzona rewizja: aa7ec66. Następnie: ponownie sprawdzić P0 auth i ocenić pierwsze zmiany Claude; nie włączać automatycznej synchronizacji offline zapisów produkcyjnych.

### 05.10.2026 — Codex: fail-closed kalkulatora szuflad, baza 5705505
Statyczny przegląd i testy `src/przelicznik-szuflad.test.ts` + `src/technologia.test.ts` (15/15). Wszystkie 6 profili są niezatwierdzone produkcyjnie; brak znormalizowanych długości NL i wierceń, a `T07` blokuje gotowość produkcyjną. Zidentyfikowane granice dla Claude: wspólny typoszereg NL nie jest przypisany do profilu, jawnie nieznany wariant daje zastępcze liczby z ostrzeżeniem, `NL` przyjmuje ujemne/Infinity, a nieznany typ pleców trafia do obliczenia jak drewno. Brief `docs/RESEARCH-walidacja-przelicznika-szuflad-2026-10-05.md` wymaga walidacji fail-closed i testów wspólnych REST/MCP/serwis; nie zgłasza zwolnienia produkcyjnego ani nie dopisuje wymiarów. Brak nowych commitów Claude. Ostatnia sprawdzona rewizja: 5705505. Następny temat: ponownie sprawdzić auth P0 i zmiany Claude; przy zmianach szuflad zweryfikować te przypadki graniczne przed rozszerzaniem profili.

### 05.10.2026 — Codex: KSeF i granica obiegu finansowego, baza ce13e64
Oficjalne MF sprawdzone 05.10.2026; nowe repozytoryjne briefy/integracja KSeF nie znalezione w kodzie. Aplikacja ma oferty, umowy i checkbox otrzymanej zaliczki, ale nie model faktury/KSeF. Brief `docs/RESEARCH-KSeF-i-obieg-finansowy-2026-10-05.md` rozdziela te byty i zaleca P1 eksport do istniejącego systemu księgowego z jawnie zatwierdzonym profilem podatkowym; nie automatyzować wystawienia po umowie/zaliczce. MF: wystawianie obowiązkowe etapami 2026, wyjątek ≤10 000 zł/mies. trwa do końca 2026; wcześniejsi mali podatnicy od 01.01.2027; odbiór faktur obowiązkowy od 01.02.2026; obowiązuje FA(3); online/offline, QR i certyfikaty wymagają odrębnych stanów. Status i zastosowanie dla firmy niezweryfikowane z księgowym. Nie zmieniono aplikacji, umów ani cen. Brak nowych commitów Claude; ostatnia sprawdzona rewizja ce13e64. Następnie sprawdzić P0 auth i aktualizacje Claude; integracja podatkowa dopiero po decyzji właściciela/księgowego.
