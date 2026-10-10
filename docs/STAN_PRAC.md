# Stan prac — 23.09.2026

## Punkt wznowienia — 10.10.2026 07:39

- Świeży fetch: `origin/main=8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude. Research wykonany na izolowanej gałęzi `codex/research-zmiany-projektu-2026-10-07`.
- Obejrzano w wysokiej rozdzielczości oficjalny, zarchiwizowany PDF Blum MERIVOBOX, drukowaną s.15. Poza wymiarami cięcia jest tam tabela nawiercenia dna M: NL270→X128, NL300→X128, NL>350→X256 mm oraz detal 9/16 mm. Nie ustalono jednoznacznie bazy X, wszystkich obsługiwanych NL ani parametrów otworu; oznaczenia nie są gotowe do CNC.
- Opublikowano notę `docs/okucia/BLUM-MERIVOBOX-M-dno-otwory-wstepne-2026-10-10.md` i odsyłacz w README. Profil pozostaje `not_normalized` i nieprodukcyjny. Oficjalna strona Blum obecnie wymienia też plik MERIVOBOX z 2026-05-20, którego wpływu na starszy arkusz planowania nie zweryfikowano.
- Następny temat: porównać aktualną instrukcję 2026-05-20 z archiwalną tabelą wierceń i uzyskać jednoznaczną bazę X oraz wymagane średnicę/głębokość dla konkretnego wariantu; jeśli podgląd pozostanie niedostępny, przejść do następnej pozycji P0/P1 z briefu bez wyprowadzania CNC z domysłów.
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
