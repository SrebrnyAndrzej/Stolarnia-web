# Stan prac — 23.09.2026

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
