# Stan prac — 23.09.2026

## Punkt wznowienia — 11.10.2026 01:53

- Świeży `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; bez zmian od poprzedniego punktu. Na `main` nadal obecny jest klientowski artefakt montażowy z commita `537cdc0`, bez późniejszego usunięcia/zastąpienia. Nie powielono danych osobowych.
- Poprzedni przegląd z 06.10 potwierdzał publiczną widoczność repozytorium. Dzisiejsza aktualna widoczność pozostała **niezweryfikowana**: brak `gh` auth, bezpośredni web/API niedostępny. Uzupełniono punkt kontrolny w `docs/RESEARCH-prywatnosc-danych-projektowych-w-publicznym-repo-2026-10-06.md` oraz koordynację.
- To wymaga pilnej decyzji właściciela/osoby odpowiedzialnej za dane: containment, aktualna widoczność oraz bezpieczny plan czyszczenia historii i koordynacji klonów. Codex nie zmieniał main, widoczności ani historii i nie formułował wniosku prawnego.
- Następnie sprawdzić świeże zmiany Claude. W tym obszarze dalsza praca zależy od wymaganej decyzji i działania właściciela; niezależnie kontynuować kolejny niepowielony przegląd produkcyjny bez powielania danych klienta.
- Tylko dokumentacja badawcza; `git diff --check` przed publikacją. Cena uzgodniona 29 227,60 zł brutto i historyczne umowy niezmienione.

## Punkt wznowienia — 11.10.2026 00:52

- Świeży `origin/main` bez nowych commitów Claude: `8230275ad6dea52109f581c793bdd8d6f08684d3`; research na izolowanej gałęzi `codex/research-zmiany-projektu-2026-10-07`.
- Oficjalne karty GTV dla czarnego Axis Pro A2 nie zgadzają się co do kodu złączki: karta PL podaje `WEWMOCA`, EN `INVIGO`, a karta osobnej czarnej złączki i kwartalnik 2026 wskazują `WEWMOCA2`. Starszy katalog 2020 używa `WEWMOCA` dla antracytu; nie potwierdza aliasu ani relacji komponentowej do czarnego zestawu. Uzupełniono `docs/okucia/GTV-Axis-Pro-szuflada-wewnetrzna-wymiary-elementow-2026-10-09.md` oraz koordynację.
- Następny krok: uzyskać od GTV albo z etykiety dokładnego zestawu A2 potwierdzenie komponentu i aliasu; zachować `unknown` w relacji BOM do potwierdzenia. Niezależnie, pozostałe callouty `LW−80`/`LW−100` są nadal nieprzypisane, a profile pozostają niezatwierdzone do CNC.
- Dokumentacja researchowa only; bez zmian logiki, katalogu aktywnego, danych klientów, ceny 29 227,60 zł brutto ani historycznych umów. Przed publikacją sprawdzić `git diff --check` i świeży stan gałęzi.

## Punkt wznowienia — 10.10.2026 23:51

- Świeży `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Izolowana gałąź researchowa.
- Starszy oficjalny PDF GTV `Axis_Pro_karta techniczna 06_24_44.pdf`, druk. s.4, podaje panelowe `R`: A=110, B=95, C=110, D=110 mm; osobne H profili/łączników to 86/120/168/200 mm. Zapisano, że ten historyczny wymiar nie jest jeszcze przypięty do aktualnych SKU A2–D2. Szczegóły i kryteria w `docs/okucia/GTV-Axis-Pro-szuflada-wewnetrzna-wymiary-elementow-2026-10-09.md`.
- Następnie porównać rewizję bieżącej instrukcji exact SKU i próbkę fizyczną z wartościami `R` 06_24; rozstrzygnąć skład A2 (`INVIGO`/`WEWMOCA`) oraz mapę `LW−80`/`LW−100`. Bez tego nadal nie emitować CNC. Przy nowym commicie Claude najpierw review i odpowiednie testy.
- Tylko dokumentacja researchowa; zachowano logikę, aktywny katalog, dane klientów, uzgodnioną cenę 29 227,60 zł brutto i historyczne umowy.

## Punkt wznowienia — 10.10.2026 18:48

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; nie ma nowych commitów Claude. Pracuję na izolowanej gałęzi researchowej.
- Oficjalna karta GTV dla `PB-AXISPRO18-KPL500C1` wymienia zawartość zestawu okuć, lecz nie dno ani drewniane plecy. Dopisano do noty Axis Pro 18 mm wymóg rozdzielenia zakupionego zestawu od formatek do wykonania; ich wymiary pozostają `unknown`, dopóki nie zostanie zweryfikowana instrukcja producenta dla exact SKU.
- Następnie pozyskać/odczytać instrukcję 18 mm dla exact SKU, sprawdzić listę formatek i komplet danych wierceń. Do tego czasu bez profilu CNC 18 mm; nie kopiować reguł wariantu 16 mm.
- Research-only; bez zmian logiki, aktywnego katalogu, danych klientów, uzgodnionej ceny 29 227,60 zł brutto ani historycznych umów.

## Punkt wznowienia — 10.10.2026 15:44

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Research-only na odizolowanej gałęzi.
- Dodatkowe polskie źródło Blum potwierdza, że BXF może zawierać wymiary formatek i pozycje wierceń, jest eksportowany z Konfiguratora produktów/korpusów i służy do dalszej pracy w CAD lub MINIPRESS z EASYSTICK. Zaktualizowano notę MERIVOBOX z warunkami testu, bez założenia, że dokładny SKU jest dostępny albo że istnieje publiczne API.
- Następny krok: po ustaleniu przez warsztat SKU i dostępu do konfiguratora sprawdzić eksport BXF dla dokładnej konfiguracji oraz porównać bazę/otwory z plan-bookiem, CAM i próbką fizyczną. Do tego czasu status pozostaje `unknown`, CNC niezwolnione.
- Bez zmian logiki, katalogu aktywnego, danych klienta, ceny 29 227,60 zł brutto ani umów. `git diff --check` przed publikacją.

## Punkt wznowienia — 10.10.2026 11:43

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Research-only na odizolowanej gałęzi.
- Oficjalny polski Blum CAD/CAM Data Service deklaruje dostęp do rysunków produkcyjnych 2D i makr CAM/WOP; polskie strony potwierdzają, że E-Services wymaga aktywowanego dostępu. To konkretna ścieżka pozyskania danych wierceń, ale nie potwierdza, że rysunek/makro istnieje dla nieustalonego SKU MERIVOBOX.
- W nocie MERIVOBOX zapisano źródła, zależności oraz kryterium odbioru: exact SKU/konfiguracja, rysunek z bazą/XY/Ø/głębokością/tolerancją, zgodność z CAM i próbą fizyczną. Do tego czasu X z plan-booka nie zwalnia CNC.
- Następny krok: warsztat ustala kod kupionego artykułu, a uprawniony użytkownik sprawdza rysunek dla SKU w aktywowanym E-Service; bez automatycznego kontaktu z producentem. Jeżeli brak danych lub SKU, utrzymać `unknown` i nie emitować operacji CNC.
- Zachowano rozdział research/implementacja; nie zmieniano logiki, danych klienta, ceny 29 227,60 zł brutto ani umów historycznych. `git diff --check` przed publikacją.

## Punkt wznowienia — 10.10.2026 10:41

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Research wykonany na izolowanej gałęzi `codex/research-zmiany-projektu-2026-10-07`.
- Lokalny PDF jest aktualną, producentową pomocą planistyczną wskazaną przez stronę Blum: ID `me25532842`, wersja `EP-530/5 PL-PL/12.24`, metadane utworzenia 2024-10-21 i modyfikacji 2025-06-24; strona Blum podaje listing 2025-07-11. Str.15 wizualnie pokazuje dla dna M z płyty 16 mm `NL270→X128`, `NL300→X128`, `NL>350→X256` oraz detale 9/16. Rysunek wskazuje X od przedniej krawędzi do osi otworu, ale bez tekstowej nazwy bazy; wymaga to potwierdzenia próbą. NL=350, pozostałe długości i parametry wiercenia nadal nieznane; CNC niezatwierdzone.
- Opublikowano notę `docs/okucia/BLUM-MERIVOBOX-M-dno-otwory-wstepne-2026-10-10.md` i odsyłacz w README. Rewizję istniejącej kopii potwierdzono jako aktualny plan-book. Profil pozostaje `not_normalized` i nieprodukcyjny do próby konkretnego SKU.
- Następny temat: warsztatowo potwierdzić bazę X i geometrię wiercenia na zakupionym wariancie; sprawdzić z polskiego E-Service, czy dostępny jest dokładny SKU/CAM. NL=350 i inne niewymienione długości pozostają `unknown`.
- Research-only; nie zmieniono logiki aplikacji, katalogu aktywnego, danych klienta, uzgodnionej ceny 29 227,60 zł brutto ani umów historycznych.

## Punkt wznowienia — 10.10.2026 04:37

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude.
- Oficjalny Blum 2027/2028, drukowana s.345, potwierdza tekstowo nominalne NL profilu 578/30 kg (`270, 300, 350, 400, 450, 500, 550, 600`) i 576/65 kg (`450, 500–550, 600, 650`). Przeglądarka nie zwróciła obrazu/PDF tej strony, więc nie dopisano żadnej współrzędnej/relacji NL→otwór.
- W nocie TANDEMBOX opisano zależność od typu profilu/nośności i kryterium: NL poza jawnym zakresem zwraca brak potwierdzonego wariantu, bez fallbacku. Wiercenia CNC nadal blokowane, aż punkty będą przypisane do rzędu, bazy, typu mocowania i potwierdzone próbą.
- Następnie pozyskać/obejrzeć obraz tabeli strony 345 i powiązać symbole z konkretnymi długościami, pozycją, wkrętem oraz bazą; równolegle nie mieszać wyniku z GTV ani ZML.7000 LEGRABOX.
- Research-only; nie zmieniać logiki, ceny 29 227,60 zł brutto Pieszczyńskich ani historycznych umów.

## Punkt wznowienia — 10.10.2026 03:37

- Świeży fetch `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; nowy względem poprzedniego punktu jest wyłącznie commit dokumentacyjny Codexa o narzucie/marży, bez nowych commitów Claude.
- Korekta GTV: `GLASS-PAWEW` to panel szklany; `GLASS-ZEWEW` to osobny zestaw do frontu szklanego (aluminiowy panel + złączki, bez szyby); `ZESWEW` bez `GLASS` to standardowy zestaw panelu/złączek, a reling zależy od wariantu. Nie utożsamiać rodzin po wspólnym fragmencie kodu. Karty potwierdzają konkretne składy; dokładne warianty i ceny wymagają źródła dostawcy.
- Bieżący `katalog.json` nie ma żadnej z rodzin PAWEW/ZEWEW/ZESWEW. Rekomendacja P1: test danych modeluje je oddzielnie z pełnym SKU, źródłem i flagą zawartości; CNC szkła pozostaje niezatwierdzone. W nocie GTV skorygowano poprzedni skrót materiałowy oraz zachowano konflikt 1100/szkło vs 1200/stal z PDF jako nierozstrzygnięty.
- Następnie przygotować dokładne fixture SKU potwierdzonych kartami i rozwiązać z dostawcą warianty/kolory. Odczytywanie rysunków/wymiarów technologicznych szkła i próba warsztatowa są osobnym warunkiem CNC.
- Research-only; zachować 29 227,60 zł brutto Pieszczyńskich, historyczne umowy i prywatność danych.

## Punkt wznowienia — 10.10.2026 02:36

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; bez nowych commitów Claude.
- Oficjalny katalog GTV Q1+Q2 2026 potwierdza PAWEW A/B/C jako 1100 mm, H=56/88/139 i szkło; ZEWEW pozostaje odrębnym zestawem szuflady. W bieżącej migawce `docs/okucia/produkty/katalog.json` brak rekordów ze słowami PAWEW/ZEWEW/AXISPRO-GLASS. To luka migawki, nie dowód braku oferty. Zalecenie P1: dokładne rekordy źródłowe do BOM zakupowego, bez wymyślania ceny/dostępności; CNC nadal zablokowane.
- Kryteria i źródła dodano do `docs/RESEARCH-aktualnosc-i-zaufanie-katalogu-okuc-2026-10-07.md` i do noty wariantu `docs/okucia/GTV-AXIS-PRO-GLASS-szuflady-wewnetrzne-profile-2023-2024-2026-10-09.md`.
- Następnie, po zmianie/nowej migawce katalogu, sprawdzić dokładne SKU/kolory na kartach GTV i zachować wersje źródłowe; osobno uzyskać potwierdzenie bazy/tolerancji i warsztatowej próby cięcia szkła.
- Research-only; bez zmian logiki, ceny Pieszczyńskich 29 227,60 zł brutto, umów i danych klientów.

## Punkt wznowienia — 10.10.2026 01:35

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; bez nowych commitów Claude.
- Oficjalna instrukcja GLASS 2024, karty produktów i katalog AXIS PRO ONLINE wspierają rozróżnienie `PAWEW` (szklany panel, H 56/88/139, L 1100, niehartowane szkło) vs `ZEWEW` (stalowy zestaw szuflady, L=1200). Strona 21 innego oficjalnego katalogu przypisuje 1200/stal do tabeli PAWEW, lecz to pokrywa się z ZEWEW na poprzedniej stronie; prawdopodobny błąd publikacji, nadal hipoteza bez sprostowania GTV.
- Aktualizacja wymagań i źródeł: `docs/okucia/GTV-AXIS-PRO-GLASS-szuflady-wewnetrzne-profile-2023-2024-2026-10-09.md`; wiersz konstruktora zaktualizowany w `docs/RESEARCH-konstruktor-mebli-niestandardowych.md`.
- Następnie sprawdzić etykiety/fizyczny towar PAWEW i ZEWEW oraz pozyskać tolerancję/bazę obróbki od warsztatu lub producenta; nie zwalniać CNC szkła bez zatwierdzonej próby.
- Research-only; nie zmieniano aplikacji, ceny Pieszczyńskich 29 227,60 zł brutto, umów ani danych klientów.

## Punkt wznowienia — 10.10.2026 00:35

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych zmian Claude. Research prowadzony na `codex/research-zmiany-projektu-2026-10-07`.
- Nowy dowód: ekstrakcja tabeli z oficjalnego `drawer-system-AXIS-PRO-EN_PL.pdf`, drukowana s.21, podaje dla Glass PAWEW A1/B1/C1 długości 1200 mm i materiał stal; oficjalne karty produktu i inny katalog podają dla identycznych SKU długości 1100 mm i szkło (karty produktów: niehartowane). Konflikt publikacji producenta potwierdzony; rzeczywista rewizja towaru pozostaje nieznana. CNC zablokowane do potwierdzenia SKU/rewizji i właściwej obróbki.
- Aktualizacja i kryteria: `docs/okucia/GTV-AXIS-PRO-GLASS-szuflady-wewnetrzne-profile-2023-2024-2026-10-09.md`; następny temat: odzyskać wizualną kopię tabeli/egzemplarz fizyczny oraz pozyskać pisemne wyjaśnienie GTV lub dostawcy, potem odrębnie zatwierdzić bazę/tolerancję i próbę cięcia.
- Research-only; bez zmian kodu aplikacji, ceny uzgodnionej 29 227,60 zł brutto, umów i danych klientów.

## Punkt wznowienia — 09.10.2026 23:34

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude do przeglądu. Bieżący research na gałęzi `codex/research-zmiany-projektu-2026-10-07`.
- GTV Axis Pro Glass: strony producenta potwierdzają dokładne SKU paneli A1/B1/C1, wysokości 56/88/139 mm, długość katalogową 1100 mm i szkło niehartowane. Jeden oficjalny katalog PDF indeksuje te same kody jako 1200 mm/stal, więc zachowujemy jawny konflikt; strony bezpośrednie i drugi katalog wspierają 1100 mm/szkło. Nie ma zwolnienia długości cięcia, obróbki ani formatek CNC. Szczegóły: `docs/okucia/GTV-AXIS-PRO-GLASS-szuflady-wewnetrzne-profile-2023-2024-2026-10-09.md`.
- Następny temat: pozyskać lokalnie zachowywalne/otwieralne kopie konfliktujących oficjalnych PDF-ów, porównać rysunki wizualnie i ustalić, który dokładny wariant szkła dostawca/zakład stosuje; dopiero potem potwierdzić bazę, tolerancje i obróbkę warsztatową. CNC pozostaje niezatwierdzone.
- Kontrola zmian: odczyt dokumentacji tylko; nie zmieniano logiki aplikacji, umów, ceny Pieszczyńskich (29 227,60 zł brutto) ani danych klientów.

## Kontynuacja po Claude: dokumentacja PDF

Punkt przejęcia: model części i operacji (271e80a), następnie zbiorcza karta szafki w PDF (f9791a8). Pełny eksport zawierał tylko karty zbiorcze, mimo że generator umiał tworzyć osobne rysunki części. Widoki krawędzi mogły zostać pominięte po wyczerpaniu miejsca.

Wdrożono:
- Domyślny eksport całej kuchni oraz pojedynczej szafki zawiera karty zbiorcze i osobne rysunki wszystkich jej części.
- `GET /api/projekty/:id/dokumentacja.pdf?skrocony=1` zachowuje skrócone karty. Parametry `modul` i `czesc` nadal filtrują eksport.
- Krawędzie z operacjami otrzymują oddzielną stronę z numerami zgodnymi z tabelą operacji.
- Uwagi, diagnostyka i źródła reguł mają kontynuację stron. Nagłówki tabel uwzględniają zawijanie tekstu. Numeracja otworów jest rozsuwana z liniami odniesienia.
- Interfejs produkcji rozdziela pełny pakiet i karty zbiorcze.

## Sprawdzenie

- 16 testów zaliczonych; obejmują wszystkie dotychczasowe przypadki oraz kompletność pełnego pakietu, filtrowanie szafki, cztery krawędzie i długie uwagi.
- TypeScript: backend i frontend bez błędów.
- Próbna kuchnia: 4 szafki, 53 części, 217 operacji, 77 stron PDF. Sprawdzono obecność rysunku każdej części przez niezależny od generatora odczyt PDF.
- Przypadek testowy: wszystkie cztery widoki krawędzi i wszystkie 100 ponumerowanych uwag obecne w treści PDF.
- Wizualnie sprawdzono reprezentatywne strony: tytułową, indeks, kartę szafki, rysunek części, tabelę kontynuowaną i krawędzie.
- Pełny build Vite nie został ukończony: lokalne środowisko Windows zwracało `spawn EPERM` przy uruchamianiu esbuild. Testy wykonano po kompilacji TypeScript, w pojedynczym procesie Node z `--test-isolation=none`.

## Ograniczenia i następny etap

To uzupełnienie eksportu istniejących operacji, nie zatwierdzenie całej technologii. Brakujące wiercenia prowadnic, uchwytów, zawieszek i konkretnych SKU nadal dają dokument roboczy. Nie wolno zmieniać tego statusu, aby ukryć braki danych.

Następny etap: powiązać wybraną rodzinę szuflad (Amix Elite Box standard) z konkretnymi wariantami/SKU i zweryfikowanymi schematami montażowymi; dopiero potem wprowadzić pełne operacje, przypadki referencyjne i dobór kompatybilności. Nie przenosić schematów standard/wewnętrzna ani wymiarów między rodzinami. Równolegle plan katalogu płyt pozostaje w `materialy/pokrycie.json`: normalizacja regionalnej oferty Kronospan jest nieukończona.


## Integracja katalogów w aplikacji — przejęcie przez Codex

- Podłączono wszystkie 644 zebrane pozycje dekorów (408 Egger, 236 Kronospan) i ich lokalne zdjęcia. To komplet zebranej migawki, nie potwierdzenie pełnej oferty wszystkich produktów na rynku PL.
- Nowa domyślna zakładka „Dekory producentów” w materiałach: galeria, filtr producenta, wyszukiwanie kodu/nazwy/struktury, link do źródła.
- Projektant: przy korpusie i froncie można otworzyć tę samą galerię, dodać materiał i od razu zastosować go w projekcie.
- REST: GET /api/dekory, GET /api/dekory/:key, POST /api/dekory/:key/material; obrazy /api/dekory/obrazy. Klucz dekoru URL-encode (producent:kod).
- Egger: wybór istniejącego artykułu z grup płyt dekoracyjnych i PerfectSense; obrzeża, laminaty i blaty nie są konwertowane do płyt korpusu. Format z konkretnego artykułu, bez iloczynu grubości i formatów.
- Przy braku artykułu: jawny format, grubość i struktura od użytkownika. Brak cen oznaczony w UI; obowiązuje istniejąca diagnostyka zastępczych kosztów. Istniejące materiały, ceny i projekty zachowane. Ponowne dodanie tego samego wariantu nie nadpisuje ceny.
- Material zawiera zdjecieURL, zrodloKatalogu, artykulProducenta. Grubość nowego materiału katalogowego wpływa na konstrukcję korpusu/frontu. Starsze materiały zachowują dotychczasową semantykę ustawień zakładu.
- 20 testów zaliczonych (4 nowe), kontrola typów frontend/backend zaliczona. W przeglądarce potwierdzono licznik 644, działające zdjęcie i wyszukiwanie H1384 ST40, wybór artykułu 1688144 oraz trwałe dodanie do materiałów.
- Standardowy Vite nadal blokowany przez lokalne spawn EPERM. Udało się zbudować frontend bezpośrednim oficjalnym esbuild.exe z zainstalowanych zależności i uruchomić podgląd localhost:3211 na osobnej bazie testowej. Nie zmieniono produkcyjnej bazy użytkownika.
- Start serwera wymaga katalogu roboczego repozytorium i docs/materialy (oba JSON oraz obrazy). Wdrożenie musi zawierać te zasoby.

Pozostało: pełna macierz Kronospan, rozdzielenie nośników specjalnych (np. komórkowych) i ich dopuszczalnych technologii, kompletność regionalna, walidacja zgodności okuć z grubością, obsługa blatów/obrzeży jako osobnych produktów, narzędzia MCP katalogu. Miniatury są w galerii i selektorach; nie wdrożono mapowania tekstur PBR/skali na model 3D. Nie uznawać dodania dekoru za zatwierdzenie technologii produkcyjnej.


### Wdrożenie do lokalnej aplikacji użytkownika

Zaktualizowano także C:/Users/Komp/Stolarnia App. Zachowano zastane niezacommitowane filtry producenta/kolekcji/grupy/grubości oraz filtrowanie API; te zmiany włączono również do repozytorium roboczego, aby wersje nie rozjechały się. Kopie trzech wcześniejszych plików są w katalogu roboczym Codex work/original-app-before-catalog. Baza data/ nie była kopiowana ani modyfikowana przez wdrożenie. Skompilowano backend i frontend lokalnej aplikacji; istniejący serwer localhost:3210 zwraca 644 dekory. W przeglądarce potwierdzono galerię 644 także pod właściwym adresem localhost:3210/#/materialy. Testowe dodanie materiału wykonano wyłącznie w odrębnej bazie podglądu localhost:3211.


## Supabase — nowy projekt (23.09.2026)

Pobrano nowe zmiany main do bbbec58 zawierające adapter Supabase i konfigurację Vercel. Użytkownik odmówił użycia wskazanego wcześniej projektu i polecił przygotować konfigurację nowego. Nie otwarto ani nie zmieniono starego projektu. Przygotowano migrację SQL public.stolarnia_baza, RLS i uprawnienia tylko backendu, .env.example bez sekretów, wykluczenie plików .env i .vercel z Git oraz odczytowy skrypt scripts/sprawdz-supabase.mjs. Instrukcja: docs/SUPABASE-NOWY-PROJEKT.md. Usunięto stary identyfikator projektu z przykładu importu.

NIE WYKONANO: utworzenie nowego projektu na koncie użytkownika, uruchomienie SQL w nim, wprowadzenie nowych zmiennych Vercel, migracja danych i potwierdzenie działania online. Nie raportować konfiguracji jako uruchomionej. Wymagane potwierdzenie ochrony domeny produkcyjnej/API/MCP, ponieważ obecny serwer nie implementuje własnej autoryzacji.

Aktualizacja 24.09.2026: produkcja Vercel faktycznie używa istniejącego projektu Supabase `stolarnia-web` (SUPABASE_URL jak wyżej, SUPABASE_SECRET_KEY ustawiony przez właściciela 23.09 z komentarzem „istniejąca baza”). Baza jest aktywna: dokument `glowna` w wersji 34, zawierał projekt „Kuchnia Tomek” utworzony online. Dopisano do niego projekt „Kuchnia — Pieszczyńscy” (a4b0b291, rewizja 23, z narożnikiem LeMans) bez zmiany innych danych, więc dokument ma teraz wersję 35. Materiały projektu (Dąb Artisan 215, Smoke Green 295, U604 450, blat 550) już były w bazie. Wdrożenie 39cf6ee jest READY. Nowy projekt Supabase z instrukcji powyżej nie powstał. Jeżeli nadal obowiązuje decyzja o nowym projekcie, trzeba przenieść dane i zmienne.

Kolejny zakres użytkownika pozostaje otwarty: katalog szuflad Amix/GTV/Blum, zawiasów, akcesoriów kuchennych i systemów przesuwnych. Przeprowadzono przegląd istniejących źródeł; nie wdrożono jeszcze nowej galerii okuć. Nie mylić istniejących 48 rekordów cennika z pełnym katalogiem.

## 2026-09-24 - Umowy (Codex)
Dodano zakładkę Umowy w projekcie: wzory kuchnia/schody/inne, edytowalne dane stron, zakres i warunki, cena/zaliczka z osobnym potwierdzeniem wpłaty. Zapisane umowy są niezmiennymi kopiami w projekcie (Supabase przez istniejący magazyn). Eksport PDF z logo Pan Stolarz, bez wizualizacji/specyfikacji z projektu. Kopiowanie umowy tworzy nowy dokument; duplikowanie projektu nie kopiuje umów. Nie dodano uploadu ani automatycznych podpisów. API: GET/POST /api/projekty/:id/umowy oraz GET /:uid/pdf. Walidacja Zod, kwoty do grosza, unikalny numer w projekcie. Testy: typy frontend/backend oraz 10 testów umów/usługi/chmury przeszły. PDF standard 2 strony; sprawdzono też długie warunki. Lokalny Vite blokowany przez spawn EPERM; build do sprawdzenia na Vercelu. Dane klientów nie zostały dodane do repozytorium. Formularz pobiera firmę z Ustawień; treść umowy wymaga przeglądu przed podpisaniem.

Weryfikacja wdrożenia: zakładka Umowy i formularz działają na stolarnia-web.vercel.app (Vercel zbudował frontend). Test REST scripts/smoke-contracts.mjs przeszedł na izolowanej lokalnej bazie: walidacja, zapis, lista, pobranie PDF. Nie zapisano testowych umów na produkcji. Cena projektu Pieszczyńskich pozostaje bez zmian zgodnie z potwierdzeniem użytkownika; formularz przyjmuje aktualną wycenę, nie historyczną kwotę z oferty.

## 2026-09-24 - Katalog systemów szuflad (Codex → Claude)
Codex zebrał karty produktów Amix, GTV i Blum oraz podłączył galerię w Okuciach, ale skończyły mu się limity przed zamknięciem testów. Claude przeniósł zmiany z kopii roboczej Codexa do repozytorium. Oznaczył 3 konflikty danych GTV i 8 kart Amix bez indeksu (`scripts/oznacz-konflikty-okuc.mjs`), poprawił test katalogu i ustawił kolejność galerii: najpierw konkretne SKU. Szczegóły: docs/okucia/README.md. Testy: 32/32.

## 2026-09-25 - Katalog okuć, wkrętów, klejów i chemii (Claude)
Kolektor `scripts/okucia/zbierz_katalog_okuc.py` zbiera dane z GTV, Amix, Spray-Kon i Mamut (producenci) oraz z Merkury AM (dystrybutor: Blum, Hettich, Häfele, Laguna, Sevroll, Matrix, Astra Trade, Würth, chemia). Katalog ma 2472 pozycje w 16 kategoriach, wszystkie ze zdjęciem. Panel pokazuje go w Materiały i okucia → Okucia; filtrowanie i stronicowanie działa na serwerze (`/api/okucia-katalog?widok=strona`). Do cennika trafia tylko pozycja z indeksem producenta albo z symbolem dystrybutora. Szczegóły i ograniczenia: docs/okucia/README.md. Testy: 33/33.

## 2026-09-25 - Katalog okuć: Blum, Hettich, Häfele z kolejnych dystrybutorów (Claude)
Kolektor ma dwa nowe źródła: meblownia.pl (Blum, Häfele i pokrewne, z jawnym kodem producenta i EAN) oraz akcesoriazagrosze.pl (Hettich). Duplikaty łączą się po kodzie producenta. Katalog ma 2987 pozycji: Blum 780, Hettich 148, Häfele 153. Häfele.com (403) i bimeb.pl (robots.txt blokuje boty AI) pominięte. Szczegóły: docs/okucia/README.md. Testy 34/34.

## 2026-09-25 - Własny cennik materiałów (Codex → Claude)
Codex zaczął cennik własny: `cennikMaterialow` w bazie, API `/api/cennik/materialow`, kolumnę „Mój cennik netto” w Materiałach i priorytet ceny własnej w wycenach bez zmiany katalogu. Claude go dokończył:
- cena własna jest traktowana jako faktyczna cena zakupu, więc rabat katalogowy obniża już tylko cenę referencyjną;
- pozycje wyceny pokazują źródło ceny („Cena z Twojego cennika” albo „Cena referencyjna katalogu”);
- MCP: `lista_materialow` zwraca `cenaWlasnaNetto`, a nowe narzędzie `ustaw_cene_materialu` ustawia albo usuwa cenę własną.

Test „własny cennik…” rozszerzony o rabat. Testy 34/34.

## 25.09.2026 — cena uzgodniona
Dodano cenaUzgodnionaBrutto projektu: wyłącznie Standard, odrębnie od kosztów, z korektą handlową netto. Nowe umowy i oferty korzystają z tej ceny; zapisane umowy są niezmienne. PATCH projektu obsługuje dodatnią kwotę do grosza lub null do usunięcia. Duplikat projektu nie dziedziczy uzgodnienia. Testy ceny i umów oraz typy frontendu przeszły.

## 2026-09-25 - Silnik konstrukcji mebli, etap 1 (Claude)
Nowy silnik `src/core/silnik/` (model drzewa, budowa, adapter, polecenia). Na wszystkich 11 szafkach kuchni Darii, całym katalogu i ponad 150 wariantach daje dokładnie te same formatki i okucia co stary builder. Pierwsze polecenie: „zamień drzwi na szuflady” — w API, MCP i inspektorze modułu. Moduł z `drzewo` buduje silnik; bez niego nic się nie zmienia. Projekt Darii w bazie nietknięty. Szczegóły i dalsze etapy: docs/RESEARCH-konstruktor-mebli-niestandardowych.md §6.

## 2026-09-25 - Przelicznik dna i pleców szuflad Amix, GTV, Blum (Claude)
Przelicznik w zakładce „Materiały i okucia”, w API (`/api/przelicznik-szuflad`, `/api/systemy-szuflad`) i w MCP (`przelicznik_szuflad`). Profile Blum mają wszystkie wysokości boków ze stron PDF. Szafka może mieć własny system i wariant boku; builder i silnik liczą z niego formatki. Testy: `src/przelicznik-szuflad.test.ts`.

Zmiana zachowania: dla Blum automatyczny dobór może wybrać teraz inny wariant niż M (wcześniej był tylko M). Dotyczy wyłącznie szafek z szufladami systemowymi Blum. Profile nadal mają `production_approved=false`.

## 2026-09-25 - Wybór systemu szuflad w szafce i wysokości prowadnic w rastrze 32 (Claude)
W inspektorze szafki z szufladami jest jedna lista „System szuflad”: skrzynka z płyty, system z ustawień albo jeden z sześciu systemów Amix/GTV/Blum. Obok jest wybór wysokości boku.

Dokumentacja produkcyjna podaje dla każdej szuflady wysokość osi prowadnicy od dolnej krawędzi boku w rastrze 32. Dane pochodzą z kart producentów (`runner_mounting` w reguly-szuflad.json). Dla Amix i GTV dochodzą otwory w bokach. Szczegóły: docs/okucia/README.md. Test: `src/przelicznik-szuflad.test.ts`.

## 2026-09-25 - Silnik etap 2: szuflady wewnętrzne za drzwiami (Claude)
Polecenie „Dodaj szuflady za drzwiami” działa w inspektorze, API i MCP. Pełne dane są dla Amix Elite Box w wersji wewnętrznej (karta s.2: NL+16, cofnięcie 18, minimalne komory, panel 05B.023-FB). Dla Blum i GTV brakuje danych: dokumentacja pokazuje „brak danych” i używa wymiarów szuflady z frontem. Zawias i listwa dystansowa są w brakach. Szczegóły: RESEARCH-konstruktor-mebli-niestandardowych.md §6. Zamówienia danych i przegląd: docs/KOORDYNACJA-Claude-Codex.md.

Tomek (Kuchnia Tomek, online): trzy słupki z szufladami mają system Amix Elite Box. Zapis z 25.09 z warunkiem na wersję bazy (75 → 76), rewizja projektu 46.

## 2026-09-25 - Silnik etap 3: szuflada ukryta za frontem (Claude)
Ukryta szuflada nad szufladą główną, wysuwana osobno albo z zabierakiem. Zabierak ma w danych tylko Blum LEGRABOX (ZI7.0M07). Amix obsługuje wyłącznie wysuw osobny. Prowadnice pozostają w rastrze 32. Test: `src/przelicznik-szuflad.test.ts`.

## 2026-09-25 - Silnik K02: przegrody pionowe i półki stałe (Claude)
Polecenie „Podziel wnętrze” w inspektorze, API i MCP. Połączenia konfirmatowe i podpórki półek obsługują teraz przegrody. Dla dotychczasowych mebli operacje się nie zmieniły (sprawdzone na całym katalogu).

## 2026-09-25 - Silnik K04: podział drzwi na skrzydła (Claude)
Polecenie „Podziel front”: skrzydła obok siebie albo jedno nad drugim, z płytą na linii podziału lub bez niej. Zawiasy skrzydła przy przegrodzie mocowane do przegrody. Test: `src/przegrody.test.ts`.

## 2026-09-25 - Silnik K03: nierówne fronty (Claude)
Inspektor pokazuje wymiary frontów modułu z drzewem. Zmiana jednego frontu wyrównuje pozostałe, a zablokowane zostają bez zmian. Szuflady, prowadnice i dokumentacja podążają za frontami.

## 2026-09-25 - Wydania produkcyjne P03 (Claude)
Zakładka „Produkcja → Wydania produkcyjne”, API `POST/GET /api/projekty/:id/wydania`, `GET …/wydania/:wid/dokumentacja(.pdf)`, MCP `utworz_wydanie_produkcyjne`, `lista_wydan`.

Wydanie zamraża projekt, elementy i dokumentację bieżącej rewizji w migawce gzip + base64 z sumą SHA-256 (około 20–30 kB na kuchnię) w `Projekt.wydania`. PDF wydania powstaje wyłącznie z migawki, więc zmiany projektu, ustawień i katalogów go nie zmieniają. Wydanie nie podbija rewizji projektu.

Braki danych oznaczają wydanie jako robocze; `tylkoKompletne` blokuje takie wydanie. Odpowiedzi API i MCP nie zawierają migawek (`jsonBezMigawek`). Kopia projektu zaczyna bez wydań. Test: `src/wydania.test.ts`.

## 2026-09-25 - Widok 3D: studyjne HDRI (Claude)
Przełącznik „Studio / Proste” w rogu widoku 3D. Studio to mapa środowiska generowana w przeglądarce (cyklorama i softboxy HDR przez PMREM) z tone mappingiem ACES i cieniem od głównego softboxu. Nie wymaga pobierania plików. Prawdziwy plik HDRI (np. Poly Haven, CC0) można dodać później, po zgodzie na pobranie. Kamera startowa stoi ponad najwyższą szafką.

## 2026-10-09 09:26 — Punkt wznowienia Codex

- Repozytorium: `SrebrnyAndrzej/Stolarnia-web`, izolowana gałąź `codex/research-zmiany-projektu-2026-10-07`.
- Ostatnia sprawdzona rewizja `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude.
- Zmiana do opublikowania: źródłowa rozbieżność zakresu przyrządów GTV `PB-SZABLON-AXIS-MB` vs MBPRO w briefie `docs/okucia/GTV-AXIS-PRO-szablony-wiercen-korpusu-2026-10-09.md` i dzienniku koordynacji. `unknown` pozostaje obowiązujące dla nierozstrzygniętych kombinacji; mapowanie ręcznego przyrządu nie jest mapą CNC.
- Następny temat: źródłowo zweryfikować wariantowe mocowania pleców GTV, bez wnioskowania z nazw rodziny; jeśli pojawi się nowa zmiana Claude, najpierw wykonać review/testy według głównego briefu.
- Nie zmieniano logiki aplikacji, danych klienta, ceny ani umów.

## 2026-10-09 10:27 — Punkt wznowienia Codex

- Ostatnia sprawdzona rewizja `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`; świeży fetch bez nowych commitów Claude.
- Dodany research: `docs/okucia/GTV-AXIS-PRO-vs-MODERN-BOX-PRO-elementy-16mm-2026-10-09.md`. Oficjalne źródła GTV różnią środkowe elementy pleców z płyty 16 mm (AXIS PRO H=116 mm, MODERN BOX PRO H=135 mm), a MBPRO rozdziela ponadto C=199 i D=167. Z OCR nie zatwierdzono formuł wycięć; należy sprawdzić rysunki i zrobić próbny montaż.
- Następny temat: pozyskać zweryfikowane wymiarowe karty/rysunki na formatek dla konkretnych GTV SKU albo wybrać kolejny niedublujący się priorytet researchu. Przy nowym commicie Claude najpierw przegląd i adekwatne testy.
- Nie zmieniano logiki aplikacji, katalogu, danych klienta, ceny ani umów.

## 2026-10-09 11:27 — Punkt wznowienia Codex

- Ostatnia sprawdzona rewizja `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`; świeży fetch bez commitów Claude.
- Zaktualizowano `docs/okucia/GTV-AXIS-PRO-vs-MODERN-BOX-PRO-elementy-16mm-2026-10-09.md`: oba niezależne źródła GTV potwierdzają przy 16 mm wspólne relacje dna `(LW−75)×(NL−24)` i szerokości pleców `LW−87`; wysokości pleców pozostają profile-specific (średni Axis Pro 116 vs MBPRO 135 mm; MBPRO C=199, D=167). Model powinien zachować osobną provenance/rewizję źródła dla każdego profilu, nawet gdy matematyka jest wspólna.
- Próba otwarcia oficjalnej instrukcji Axis Pro 18 mm w narzędziu web pozostała niedostępna; bez nowych danych w tym obszarze. Następny temat: kolejny niezależny brak wierceń/formatek do zamknięcia z kolejki źródeł producenta; nie tworzyć formuł z niedostępnego PDF.
- Bez zmian logiki aplikacji, katalogu, danych klienta, ceny i umów.
## 2026-10-09 12:28 — Punkt wznowienia Codex

- Świeży `origin/main` nadal `8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Pracuję na gałęzi izolowanej `codex/research-zmiany-projektu-2026-10-07`.
- Dodano `docs/okucia/GTV-AXIS-PRO-GLASS-rozbieznosc-wysokosci-dokumentacji-2023-2024-2026-10-09.md`. Oficjalne instrukcje GTV opisane jako 2023/2024 różnią się wartościami H dla Low/Medium/High (86/120/168 vs 84/116/167 mm). Nieznane jest przypisanie rewizji do SKU ani przyczyna różnicy; nie należy automatycznie stosować wartości do starego zakupu ani zatwierdzać CNC.
- Następnie sprawdzić źródłowe zmiany Claude. Jeśli brak, przejść do kolejnego niepowielającego się ryzyka technologicznego okuć; wymagać jawnego SKU/revizji i pozostawiać niewiadome jako `unknown`.
- Nie zmieniano logiki aplikacji, katalogu produktów, danych klienta, ceny ani umów. PDF-y weryfikowano online; nie zapisano ich lokalnej kopii ani checksumy.
## 2026-10-09 13:28 — Punkt wznowienia Codex

- Świeży `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Izolowana gałąź researchu `codex/research-zmiany-projektu-2026-10-07`.
- Uzupełniono brief TANDEMBOX i README źródłem Blum 2027/2028, s.345: osobne diagramy mocowania korpusu dla prowadnic 578/30 kg i 576/65 kg zależne od NL; SKU 578.4501M jest wskazany w bieżącej karcie jako obsługujący wiercenie liniowe. Ekstrakcja tekstowa nie wystarcza do mapy współrzędnych, więc profili wierceń nie zmieniono, a CNC pozostaje zablokowane do wizualnego odczytu i próby.
- Następnie ręcznie sprawdzić rysunek o wysokiej rozdzielczości i określić każdą pozycję, jej bazę, typ, wymagany wkręt A/B i opcjonalność; dopiero po mapowaniu dokładnych SKU/NL i fizycznej walidacji rozważyć regułę produkcyjną.
- Bez zmian logiki, katalogu produktów, danych klienta, ceny i umów. Katalog 2027/2028 przeglądano publicznie; nie zapisano lokalnej kopii ani checksumy.

## 2026-10-09 14:29 — Punkt wznowienia Codex

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Izolowana gałąź: `codex/research-zmiany-projektu-2026-10-07`.
- Wizualnie zweryfikowano oficjalną stronę Blum 2027/2028, s.345: osobne tabele mocowań 578/30 kg i 576/65 kg oraz legenda A Ø4×15, B Ø6×14,5 mm; `**` oznacza opcjonalną pozycję stabilizującą. Dopisano ograniczenia odczytu do `docs/okucia/BLUM-TANDEMBOX-antaro-M-plecy-i-prowadnice-2026-10-04.md`.
- Nie zapisano współrzędnych do reguł CNC: strona nadal wymaga zdefiniowania baz, przypisania każdego punktu i parametrów otworu oraz potwierdzenia próbą montażową. Następny krok: zachować oficjalny PDF/identyfikator/rynek/hash, a potem dokończyć weryfikację mapy względem szablonu i próbnego montażu.
- Nie zmieniono logiki aplikacji, katalogu, danych klienta, ceny ani umów. Przegląd dotyczył dokumentacji; test aplikacji nie dotyczy.

## 2026-10-09 15:29 — Punkt wznowienia Codex

- `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`, brak nowych commitów Claude; gałąź izolowana `codex/research-zmiany-projektu-2026-10-07`.
- Wizualnie przejrzano strony 1–3 oficjalnej instrukcji Amix Elite Box wewnętrznej. Str.1 pokazuje 2 grupy mocowań dla przykładowych NL250–350 i 3 dla NL400–550, ale nie wiąże grup z identyfikatorami części; pozycje mocowania frontu: 14=H84, 15=H116, 16=H167, 17=H199 (numery rysunkowe, nie SKU). Szczegóły i P0 dla BOM per NL/H dopisano do `docs/okucia/AMIX-Elite-Box-wewnetrzne-wiercenia-2026-10-03.md`.
- Następny krok: odszukać producentową legendę/listę elementów lub wzornik dla tych mocowań, przypisać elementy do exact SKU, a dopiero potem zweryfikować w warsztacie. Nie generować CNC ze schematu nieoznaczonych grup; brak SKU, osi i parametrów otworów pozostaje `unknown`.
- Bez zmian logiki, cen, danych klienta i umów. Wykonano kontrolę dokumentacji i `git diff --check`; testy aplikacji nie dotyczą.
## 2026-10-09 17:29 — Punkt wznowienia Codex

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Izolowana gałąź researchu `codex/research-zmiany-projektu-2026-10-07` jest czysta przed tym wpisem.
- Ponownie sprawdzono oficjalny katalog Blum 2027/2028, drukowaną s.345. Widok potwierdza dwie osobne tabele mocowania 578/30 kg i 576/65 kg oraz legendę A/B/`**`; tekst indeksowanej strony podaje A: wkręt do płyty Ø4×15 mm, B: systemowy Ø6×14,5 mm, kod 661.1450.HG, a `**` jako opcjonalne mocowanie zwiększające stabilność, zastępowalne A. To potwierdza istniejący brief, nie dodaje geometrii CNC; żadnych współrzędnych nie zatwierdzono.
- Próba zebrania widocznych plików wektorowych/rastrowych strony przez mechanizm zasobów przeglądarki nie powiodła się: środowisko odmówiło utworzenia katalogu tymczasowego `C:\Users\Komp\AppData\Local\Temp\browser-use` (`EPERM`). Nie pobrano ani nie zapisano PDF/obrazu lokalnie; nie kontynuowano przez obejście poza dozwolonym katalogiem.
- Następnie odtworzyć stronę 345 w lokalnym artefakcie przez dozwoloną ścieżkę pobierania pojedynczej strony lub przerzucić ją do kolejnego niezależnego, niezdublowanego ryzyka w kolejce. Do czasu odczytu baz, symboli i wymiarów otworów oraz walidacji fizycznej, TANDEMBOX CNC pozostaje niezatwierdzone.
- Bez zmian logiki, katalogu, danych klienta, ceny uzgodnionej 29 227,60 zł brutto ani umów.

## 2026-10-09 22:34 — Punkt wznowienia Codex

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Gałąź izolowana `codex/research-zmiany-projektu-2026-10-07` (ostatni research opublikowany jako `d7f0d57`).
- Indeksowane oficjalne karty GTV Axis Pro GLASS 2023/2024 wskazują tabele standardowe `R` i szklane `S`, w tym callouty `LW−80`/`LW−100`. Bezpośrednie karty GTV potwierdzają szklane SKU A1/B1/C1 jako 56/88/139 × 1100 mm, szkło niehartowane, ale jeden oficjalny PDF sprzecznie indeksuje te same SKU jako 1200 mm/stal. Mapa `S` na rysunku, gotowa długość/obróbka i status CNC nadal niepotwierdzone; szczegóły i kryteria: `docs/okucia/GTV-AXIS-PRO-GLASS-szuflady-wewnetrzne-profile-2023-2024-2026-10-09.md`.
- Następny temat: pozyskać lokalne, czytelne PDF-y GTV GLASS do wizualnego porównania rewizji i potwierdzenia wartości/SKU A/B/C; nie dopisywać kandydackich wymiarów `R`/`S` do aktywnych reguł. Jeśli pojawi się commit Claude, najpierw review i adekwatne testy.
- Research-only; bez zmian logiki, danych klienta, ceny uzgodnionej 29 227,60 zł brutto ani umów. Po zmianach wykonać `git diff --check`.

## 2026-10-09 21:32 — Punkt wznowienia Codex

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Gałąź izolowana `codex/research-zmiany-projektu-2026-10-07`.
- Wizualnie sprawdzono drukowaną s.10 oficjalnej karty GTV Axis Pro: sekcja szuflady wewnętrznej określa `LW` jako światło wewnętrzne korpusu, `R` jako wysokość panelu i pokazuje dwa osobne wymiary elementów `LW−80` oraz `LW−100`. Zaktualizowano lukę danych: GTV ma częściowe adnotacje wymiarowe, lecz nie pełną konfigurację szuflady wewnętrznej. Szczegóły, granice i kryteria dla Claude: `docs/okucia/GTV-Axis-Pro-szuflada-wewnetrzna-wymiary-elementow-2026-10-09.md`.
- Następny temat: odnaleźć producentową listę części/instrukcję dla exact Axis Pro internal-drawer SKU, aby przypisać callouty do elementów oraz ustalić `R`, materiał, grubość i zakresy. Do tego czasu niepełny profil nie może generować kompletnego BOM/CNC; jeśli pojawi się commit Claude, najpierw review i adekwatne testy.
- Research-only; bez zmian logiki, danych klienta, ceny uzgodnionej 29 227,60 zł brutto ani umów. Wykonać `git diff --check` przed publikacją.

## 2026-10-09 20:31 — Punkt wznowienia Codex

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; bez nowych commitów Claude. Gałąź izolowana `codex/research-zmiany-projektu-2026-10-07`.
- Dalszy odczyt z powiększonego widoku oficjalnej strony Blum 2027/2028, drukowana s.345, czytelnie odsłonił etykiety pozycji w oddzielnych tabelach: dla 578 / 30 kg `19**`, 37, 115, 133, 165, 229, 261, 293; dla 576 / 65 kg `19**`, 28, 37, 115, 165, 261, 293, 357, 453, 517, 549. Uzupełniono istniejący brief TANDEMBOX. Odczyt nadal nie rozstrzyga baz/stron odniesienia ani geometrii otworów, więc lista nie jest mapą CNC i nie zmienia blokady zwolnienia.
- Dla pozyskania trwałego obrazu/pliku strona nie pozwoliła zapisać tymczasowego bundle z powodu `EPERM` dla katalogu poza workspace; nie obchodzono ograniczenia. Następny temat: spróbować jednorazowo pobrania wyłącznie bieżącej strony przez oficjalny interfejs Blum, jeśli istnieje zapisywalne miejsce docelowe; w przeciwnym razie przejść do niezależnego źródłowego ryzyka GTV, a brak mapy CNC utrzymać `unknown`.
- Bez zmian logiki, katalogu, danych klienta, ceny uzgodnionej ani umów; kontrola `git diff --check` do wykonania po aktualizacji.

## 2026-10-10 16:45 — Punkt wznowienia Codex

- Świeży `origin/main` po fetch nadal `8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych zmian Claude do review. Research prowadzony na izolowanej gałęzi `codex/research-zmiany-projektu-2026-10-07`.
- Uzupełniono `docs/RESEARCH-akceptacja-klienta-wersja-i-zakres-2026-10-05.md` o granicę etykiet „akceptacja projektu” vs „podpis umowy”, na podstawie tekstu jednolitego KC Dz.U. 2026 poz. 795 (art. 60–61, 78–78¹) oraz skonsolidowanego eIDAS (art. 2 ust. 3 i 25). Wprost zapisano, że klik nie jest automatycznie kwalifikowanym podpisem ani że QES jest wymagany dla każdej umowy; prawna ocena konkretnego przepływu pozostaje niezweryfikowana i wymaga prawnika.
- Następny krok: przy kolejnym uruchomieniu świeżo sprawdzić `origin/main`; jeśli nadal bez zmian, kontynuować priorytetowe źródłowe badanie dokładnego wariantu okuć/operacji z otwartym ryzykiem. Dla zmian dotyczących akceptacji zweryfikować widoczne etykiety, audit/PDF, rozdzielenie statusów umowy i test bramki produkcyjnej.
- Tylko dokumentacja researchowa; bez zmian logiki, katalogu, danych klienta, uzgodnionej ceny 29 227,60 zł brutto i historycznych umów. Zweryfikować `git diff --check`.

## 2026-10-10 16:45 — Punkt wznowienia Codex

- Świeży `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; nadal bez nowych commitów Claude. Gałąź researchowa `codex/research-zmiany-projektu-2026-10-07`.
- Zaktualizowano `docs/okucia/AMIX-Elite-Box-wewnetrzne-wiercenia-2026-10-03.md`: oficjalne karty AMIX wiążą wysokości H116/H167/H199 z EAN 5904208179870/5904208179894/5904208179917. H84 pozostaje bez zweryfikowanego EAN; karty mają selektor koloru, ale publiczny widok nie mapuje EAN na wybraną opcję. Jedna karta detalisty dla H199 podaje sprzeczny symbol `ELITE-167/ANTR-1`, więc nie może zastępować identyfikatora producenta. Zalecono rozdzielać numer pozycji rysunku, EAN, SKU, kolor i status potwierdzenia; CNC/otwory nie zostały zmienione ani zatwierdzone.
- Następny krok: potwierdzić H84 i EAN↔kolor na rzeczywistym wyborze AMIX lub etykiecie opakowania; mapować pełny zestaw tylko po exact zakupowym wariancie. Po świeżym sprawdzeniu zmian Claude zweryfikować, czy BOM rozdziela zakup od geometrii/CNC i utrzymuje `unknown` dla nierozstrzygniętego wariantu.
- Research-only, bez zmian aplikacji, katalogu aktywnego, danych klientów, ceny 29 227,60 zł brutto ani umów. Wykonać `git diff --check` przed publikacją.

## 2026-10-10 16:46 — Punkt wznowienia Codex

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; bez nowych commitów Claude. Gałąź researchowa `codex/research-zmiany-projektu-2026-10-07`.
- Bezpośrednia karta producenta AMIX H84 (otwarta przez link z listy produktów) publikuje EAN `5904208179924`. Tabela AMIX Elite Box mocowań frontu ma teraz EAN-y H84/H116/H167/H199: `5904208179924`, `5904208179870`, `5904208179894`, `5904208179917`. Zapisano źródło i ograniczenie w `docs/okucia/AMIX-Elite-Box-wewnetrzne-wiercenia-2026-10-03.md` oraz w dzienniku koordynacji.
- Następny krok: rozstrzygnąć EAN↔kolor/SKU przez wybór wariantu zamówienia lub etykietę. Do tego czasu kolor i producentowy indeks zamówieniowy pozostają `unknown`; wynik nie zatwierdza BOM zakupowego ani żadnych wierceń/CNC.
- Bez zmian logiki, aktywnego katalogu, danych klientów, uzgodnionej ceny 29 227,60 zł brutto ani historycznych umów. Następny heartbeat: świeżo sprawdzić zmiany Claude, a przy ich braku kontynuować niezależny research okuć według otwartych ryzyk.

## 2026-10-11 04:58 — Punkt wznowienia Codex

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Gałąź researchowa `codex/research-zmiany-projektu-2026-10-07`.
- W aktualnej karcie Axis Pro GTV `_7`, drukowana s.11, znaleziono callout „Stabilizator dna szuflady” / “Drawer bottom stabilizer” w montażu szuflad wewnętrznych. Exact SKU, ilość, kryterium stosowania i zawartość zestawów A2–D2 pozostają `unknown`; nie wolno mylić z kątownikiem/kołkiem wzmacniającym wspomnianym w artykule GTV. Zapisano problem BOM, źródło i kryterium odbioru w `docs/okucia/GTV-Axis-Pro-szuflada-wewnetrzna-wymiary-elementow-2026-10-09.md`.
- Następny temat: odnaleźć aktualną, dokładną instrukcję/wykaz części GTV dla szuflad wewnętrznych albo wiarygodne potwierdzenie z opakowania/próby; ustalić SKU, ilość i kiedy stosować stabilizator. W międzyczasie zachować `unknown` i blokować automatyczne zamawianie/zwalnianie BOM-u wariantu, którego kompletność zależy od tej pozycji. Przy nowych commitach Claude najpierw review i testy.
- Research-only, bez zmian logiki, katalogu, danych klientów, ceny 29 227,60 zł brutto ani historycznych umów. `git diff --check` przed publikacją.

## 2026-10-11 05:59 — Punkt wznowienia Codex

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; bez nowych commitów Claude. Gałąź researchowa `codex/research-zmiany-projektu-2026-10-07`.
- Oficjalny wynik GTV dla kategorii „Vedení” pokazuje osobny stabilizator do drewnianych szuflad P2O z wymogiem zakupu 2 szt./szufladę. Nie jest to dowód, że ten element odpowiada stabilizatorowi dna pokazanemu w montażu szuflady wewnętrznej Axis Pro (metalowe boki). Kategoria nie otworzyła się w web z powodu timeoutu, więc exact SKU/pełny zakres tej pozycji pozostają niezweryfikowane. Dopisano jawne rozróżnienie i zakaz przenoszenia ilości do danych Axis Pro w `docs/okucia/GTV-Axis-Pro-szuflada-wewnetrzna-wymiary-elementow-2026-10-09.md`.
- Następny temat: znaleźć bezpośrednią kartę/SKU GTV stabilizatora dla drewnianej szuflady P2O i potwierdzić wyraźnie zakres oraz odrębność; dla Axis Pro nadal potrzebna jest osobna identyfikacja elementu z instrukcji/etykiety/próby. Zachować status `unknown`, bez automatycznego BOM.
- Research-only; bez zmian logiki, katalogu, danych klientów, 29 227,60 zł brutto ani umów. Wykonać `git diff --check`.

## 2026-10-11 07:01 — Punkt wznowienia Codex — pilne P0 prywatności

- `origin/main` po świeżym fetch: `8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Gałąź researchowa: `codex/research-zmiany-projektu-2026-10-07`.
- Potwierdziłem bieżącą anonimową osiągalność repozytorium przez HTTPS `git ls-remote` z wyłączonym credential helperem i pustym nagłówkiem autoryzacji; odczytano tylko HEAD. Niezależnie potwierdzono tylko obecność ścieżki opisanego wcześniej artefaktu w bieżącym drzewie main, bez otwierania jego treści. Szczegóły bez reprodukcji danych: `docs/RESEARCH-prywatnosc-danych-projektowych-w-publicznym-repo-2026-10-06.md`.
- Wymaga pilnego działania właściciela i osoby odpowiedzialnej za dane: containment, ocena zakresu oraz decyzja o kontroli bieżącego artefaktu i historii/kopii; w razie potrzeby konsultacja prawna. Nie podejmowano żadnej zmiany widoczności, plików na `main` ani historii. Sama anonimizacja późniejszego commita nie usuwa wersji historycznych.
- Następnie: po decyzji uprawnionego właściciela przeprowadzić uzgodniony containment; do tego czasu nie dodawać kolejnych materiałów projektowych klientów do repo. Zmiany Claude oceniać w odizolowanym checkout.

## 2026-10-11 22:42 — Punkt wznowienia Codex

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; bez nowych commitów Claude. Gałąź researchowa `codex/research-zmiany-projektu-2026-10-07` (HEAD przed zmianą `5ead9900cc628654decbbf550798973697117fec`).
- Bezpośrednie karty GTV rozróżniają `PB-D-P2OSTAB` (stal/nikiel, 50/opakowanie, 2 szt./drewniana szuflada skrzyniowa P2O; jawnie dopuszczony przez 0FPO18-500) oraz `PB-D-MBSTAB-00` (plastik, szary, 120/opakowanie, para L+P, montaż w bocznych płaszczach bez dodatkowych nawiertów; Modern Box, zalecenie szczególnie dla szerokich szuflad). Dopisano exact SKU, różne rodziny/ilości/mocowania i kryteria w `docs/okucia/GTV-Axis-Pro-szuflada-wewnetrzna-wymiary-elementow-2026-10-09.md`.
- Żaden z tych dwóch wyrobów nie jest źródłowo powiązany z calloutem stabilizatora dna szuflady wewnętrznej Axis Pro. Ten pozostaje `unknown`; nie wstawiać go do BOM ani drill-map. Następnie zweryfikować bezpośrednie karty/etykiety składów dla zatwierdzonych zestawów MBSTAB/P2OSTAB, a osobno uzyskać źródło/etykietę Axis Pro; priorytet P1 poprawność BOM, P0 przed automatycznym zakupem/zwolnieniem.
- Research-only; bez zmian logiki, katalogu aktywnego, danych klientów, 29 227,60 zł brutto ani umów. Wykonać `git diff --check` przed publikacją.
## 2026-10-11 23:43 — Punkt wznowienia Codex

- Świeży fetch w odizolowanym checkout: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Branch research: `codex/research-zmiany-projektu-2026-10-07`.
- Zweryfikowano bezpośrednio oficjalny regulamin GTV: 3D jest podglądem, wymiary bryły mogą różnić się od rzeczywistego wyrobu; licencja jest przypisana do zarejestrowanego użytkownika; regulamin zabrania modyfikacji, sublicencji, publicznego samodzielnego udostępniania i przypisywania bryły innej marce. Zapisano odrębny brief `docs/RESEARCH-warunki-bryl-3D-GTV-a-wiarygodnosc-wymiarow-2026-10-11.md` oraz wpis koordynacji. Brak indywidualnej licencji/zgody dla użycia wewnątrz aplikacji pozostaje niezweryfikowany; nie pobierano modeli i nie wydano opinii prawnej.
- Następny krok: świeżo sprawdzić main i zmiany Claude; jeśli brak nowych zmian, odnieść brief do aktualnego przepływu 3D w repo oraz uzyskać właścicielsko zatwierdzone potwierdzenie licencji przed importem/serwowaniem plików producenta. Zachować osobną, zatwierdzoną geometrię produkcyjną i blokadę `unknown` dla wierceń/CNC.
- Research-only; nie zmieniono aplikacji, danych klientów, katalogu, ceny 29 227,60 zł brutto ani umów. Sprawdzić `git diff --check` i opublikować na research branch.
## 2026-10-12 00:44 — Punkt wznowienia Codex — P0 assetu producenta w anonimowo osiągalnym repo

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`, bez nowych commitów Claude. Gałąź researchowa `codex/research-zmiany-projektu-2026-10-07`, HEAD `456bdcfb2f446f2b529b57702a26995366c08967` przed tym pakietem.
- `origin/main` zawiera śledzony GTV STEP dla dokładnego SKU `PB-AXISPRO-P2O-KPL350A`; rekord źródła potwierdza URL pobrania od GTV. Anonimowy odczyt Git HEAD potwierdził, że repo jest osiągalne bez poświadczeń. Nie otwierano pliku CAD ani nie pobierano klonu. Regulamin GTV zabrania modyfikacji/sublicencji/publicznego samodzielnego udostępniania i zastrzega rozbieżność wymiarów. Indywidualna dodatkowa licencja firmy jest nieznana — to P0 do pilnej oceny właściciela, nie ustalenie naruszenia.
- Kod aktualnego renderera Three.js buduje bryły z własnego modelu projektu; przeszukanie `web/src`, `src` i listy assetów nie znalazło loadera importującego STEP/GLTF/OBJ. Problem dotyczy przede wszystkim samej dostępności pliku w repo/historii, nie jego użycia w obecnym widoku.
- Dokumentacja/rekomendacja dla Claude: `docs/RESEARCH-GTV-STEP-w-repozytorium-publicznym-2026-10-12.md`; skorygowano też zalecenie konwersji do GLB w `docs/okucia/README.md` — wyłącznie po potwierdzeniu praw. Następny krok wymaga uprawnionego właściciela: containment/zakres widoczności oraz ewentualna koordynacja historii, forków i backupów po ocenie prawnej; Codex niczego nie usuwa ani nie przepisywał.
- Research-only, bez zmian aplikacji, danych klientów, aktywnego katalogu, kwoty 29 227,60 zł ani umów. `git diff --check`, opublikować wyłącznie na gałęzi research.
## 2026-10-12 01:41Z — Punkt wznowienia Codex

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Gałąź research: `codex/research-zmiany-projektu-2026-10-07`; HEAD bazowy `0086574488d47cc8d2c718a1ca5c37e9b7981bc7`.
- Zweryfikowano nowy brief narzutu/marży z aktualnym kodem: obliczenie `marzaProcent` bazuje na koszcie po zapasie i narzucie; test sprawdza obecną formułę, ale nie jawną semantykę/zakresy docelowej marży. Właścicielska decyzja o mianowniku nadal wymagana. Brief ACCA jest merytorycznie spójny; uzupełniono go o weryfikację kryteriów i brakujących testów.
- Walidacja: testy `agreed-price` + `contracts` 3/3 oraz `npm run typecheck` zaliczone. Pełne `npm test` 55/56; test chmurowy nie mógł otworzyć lokalnego połączenia z powodu sandbox `EACCES`, pozostałe przeszły. Przed uznaniem za awarię produktu powtórzyć ten test w środowisku z dozwolonym loopback.
- Następny temat: niezależnie zbadać workflow plan–actual dla kosztów zakupów, czasu, odpadu i poprawek, uwzględniając już istniejące briefy magazynu/audytu i nie dublując ich; odświeżyć `origin/main` przed dalszą oceną. Otwarta kwestia GTV STEP i historycznych danych klientowskich nadal wymaga decyzji właściciela; nie zmieniono widoczności ani repozytorium upstream.
- Research-only. Bez zmian logiki, katalogu aktywnego, danych klientów, umów ani kwoty 29 227,60 zł brutto. Wykonać `git diff --check`, commitować/publikować tylko na gałęzi research.
## 2026-10-12 02:41Z — Punkt wznowienia Codex

- Po świeżym fetch `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Praca researchowa na `codex/research-zmiany-projektu-2026-10-07`.
- Zaplanowany temat plan–actual dla zakupów, czasu, odpadu i poprawek jest już przekryty przez briefy magazynu, karty postępu, planowania zdolności, jakości oraz kosztu rzeczywistego; nie tworzono duplikatu.
- Nowy brief `docs/RESEARCH-piekarnik-zabudowa-modelowa-obwiednia-i-zwolnienie-2026-10-12.md` wiąże typowe progi piekarnika w kodzie z kryteriami exact-model: zakres wnęki, dokumentacja instalacyjna, wentylacja/przyłącza, projekcja frontu/uchwytu i obwiednia ruchu. Źródła producenta dla Bosch HBA5570S0B i Gaggenau BOP250131 dowodzą odrębności wymiarów urządzenia/wnęki oraz zależności ruchu drzwi; żadna liczba nie została ustanowiona jako uniwersalny wymiar ani zwolniona do CNC. Wymagana instrukcja instalacji dla konkretnego modelu nie została w tym kroku zweryfikowana.
- Następnie: odświeżyć `origin/main`; review nowych zmian Claude; przy braku zmian pozyskać i sprawdzić oficjalną instrukcję instalacji dla jednego aktualnego piekarnika na rynku PL i odrębnie zweryfikować stronę/kinematykę drzwi. Nie zamieniać `unknown` na domyślną geometrię.
- Research-only. Nie zmieniono logiki, katalogu, danych klientów, uzgodnionej kwoty 29 227,60 zł brutto ani historycznych umów. Wykonać `git diff --check`, commit i push wyłącznie na gałęzi research.
- Uzupełnienie kolejnego heartbeat: sprawdzono oficjalny polski PDF Bosch HBA.72E.3 (rodzina, bez potwierdzonego pełnego E-Nr). Wskazuje on m.in. otwory wentylacyjne w przegrodach, min. 200 cm² w cokole dla dwóch urządzeń piętrowo oraz konieczność uniemożliwienia dostępu do tylnych otworów; dla wyspy wymaga pełnej ściany tylnej. To stawia konkretną granicę dla bezwarunkowego usuwania pleców za piekarnikiem w kodzie. Rozszerzono brief o osobny P0: rozdzielić kanał wentylacji od bariery tylnej i nie wydawać CNC przy nierozstrzygniętym exact modelu/rysunku. Rysunki PDF nie zostały przetworzone jako gotowa geometria.
## 2026-10-12 04:41Z — Punkt wznowienia Codex

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`, nadal bez commitów Claude. Bosch PL specyfikacja modelu bazowego HBA534BB3 potwierdza wymiary urządzenia 595×594×548 mm, zakres wnęki 585–595×560–568×550 mm oraz rysunki wariantów/rezerwy przyłącza. Strona wsparcia dla HBA534BB3/97 podaje kategorię „Instrukcja montażu”, ale w odczytanym wyniku brak ID/rewizji dokumentu i potwierdzenia, że bazowa specyfikacja stosuje się do sufiksu /97. Szczegóły i źródła: `docs/RESEARCH-piekarnik-zabudowa-modelowa-obwiednia-i-zwolnienie-2026-10-12.md`.
- Następny krok: przez stronę producenta E-Nr pozyskać właściwą instrukcję, zapisać ID/rewizję/rynek i porównać rysunek z PDF-em bazowego modelu; nie zwalniać wymiarów ani CNC na podstawie samej zgodności nazwy.
- Research-only: bez zmian logiki, danych klientów, katalogu, kwoty 29 227,60 zł brutto ani umów. `origin/main` bez zmian. `git diff --check` zaliczone.
## 2026-10-12 05:42Z — Korekta śladu Bosch HBA534BB3/97

- Po świeżym fetch `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; bez commitów Claude. Oficjalna lista producenta ma dziewięć E-Nr HBA534BB3, w tym `/97`. Otwarta szczegółowa strona `/97` nie pokazuje jawnej „Instrukcji montażu” ani identyfikatora/revizji PDF (w przeciwieństwie do wcześniejszego fragmentu wyniku wyszukiwania); ogólna strona bazowa wymienia instrukcję, ale nie wiąże jej z sufiksem. Skorygowano brief i dziennik koordynacji: dokładny załącznik /97 nadal niepotwierdzony, parametry bazowego HBA534BB3 niezatwierdzone do CNC dla /97.
- Następnie sprawdzić oficjalny portal E-Nr i dostępne załączniki (nie tylko tekst wyszukiwarki), zapisać ID/rynek/rewizję i wizualnie zweryfikować rysunek. `git diff --check`; research-only, cena 29 227,60 zł brutto i umowy bez zmian.

## 2026-10-12 06:42Z — Punkt wznowienia piekarnik Bosch

- Świeży fetch potwierdził `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`, bez nowych commitów Claude. Znaleziono oficjalny polski PDF Bosch HBA534B.3 nr 9001910274_B, rodzinny i z warunkami instalacji (tylne otwory, pełna ściana wyspy, wentylacja przegród i cokołu, narożnik); w PDF brak pełnego E-Nr `/97` i strona wsparcia nie wskazuje go jawnie. Ustalenia w briefie i dzienniku koordynacji.
- Następny krok: uzyskać producentowe potwierdzenie przypisania rewizji B do HBA534BB3/97 albo dokładny załącznik z E-Nr; nie zwalniać CNC ani nie kopiować geometrii do innego wariantu.
- `git diff --check`; dokumentacja-only. Bez zmian aplikacji, klientów, kwoty 29 227,60 zł brutto ani historycznych umów.
