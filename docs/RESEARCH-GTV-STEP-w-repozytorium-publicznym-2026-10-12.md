# Model CAD STEP GTV w repozytorium osiągalnym anonimowo

Data weryfikacji: 2026-10-12
Zakres: obecność firmowego pliku CAD dostawcy i warunki producenta. To ustalenie operacyjne i badawcze, nie opinia prawna.

## Ustalenie potwierdzone

- Oficjalna [karta produktu GTV `PB-AXISPRO-P2O-KPL350A`](https://gtv.com.pl/produkt/PB-AXISPRO-P2O-KPL350A/) udostępnia bryłę STEP do pobrania.
- Rekord źródła `docs/okucia/sources.json` wiąże oryginalny adres pobrania GTV z lokalną ścieżką `docs/okucia/cad/GTV-PB-AXISPRO-P2O-KPL350A.stp`; `origin/main` zawiera tę ścieżkę jako śledzony plik CAD. Odczytano jedynie metadane ścieżki, wielkość i rekord źródła — nie otwierano ani nie analizowano bajtów modelu.
- Anonimowy `git ls-remote` do GitHub bez poświadczeń zwrócił HEAD `8230275ad6dea52109f581c793bdd8d6f08684d3`. To potwierdza anonimową osiągalność repozytorium Git w chwili sprawdzenia; nie pobierano klonu ani zawartości pliku.
- Oficjalny [Regulamin korzystania z brył 3D GTV](https://gtv.com.pl/regulamin-korzystania-z-bryl-trojwymiarowych/) wiąże licencję z użytkownikiem pobierającym plik po rejestracji i akceptacji. Wskazuje zastosowania wizualizacyjne/obliczeniowe, ale zabrania modyfikacji brył, sublicencji oraz ich samodzielnego publicznego udostępniania. Stanowi też, że bryły są materiałem poglądowym i rzeczywiste wymiary mogą się różnić. Regulamin może ulec zmianie.
- Statyczny przegląd kodu bieżącego `origin/main` nie znalazł loadera STEP/GLTF/OBJ ani integracji odczytującej tę bryłę: widok mebli Three.js buduje własne prostopadłościany z części analizy projektu. To zawęża ustalenie: potwierdzone jest umieszczenie CAD-u w osiągalnym repozytorium, nie jego użycie przez aktualny renderer aplikacji. Istniejący `docs/okucia/README.md` sugeruje konwersję modeli do GLB, ale bez odnotowanego wcześniej potwierdzenia zakresu licencji.

## Problem i ryzyko

Anonimowa osiągalność wersjonowanego repo udostępnia także śledzone pliki binarne. Dla wskazanego modelu istnieje rozbieżność między jego publiczną dostępnością u producenta po rejestracji/akceptacji a dalszym umieszczeniem w repozytorium, do którego HEAD jest osiągalny bez uwierzytelnienia. Publiczny adres źródłowy i fakt, że producent pozwala pobrać bryłę, nie dowodzą prawa do przechowywania lub przekazywania kopii przez publiczny Git, ani do konwersji jej na GLB dla wieloużytkownikowej aplikacji.

Nie ustalono, kto pobrał model, jakie oświadczenie/zgodę zaakceptował, czy istnieje dodatkowa umowa GTV ani jaki zakres użycia ona obejmuje. Nie formułujemy wniosku, że doszło do naruszenia; wymagana jest pilna decyzja właściciela repozytorium oraz weryfikacja warunków przez osobę odpowiedzialną i — jeśli trzeba — prawnika/GTV.

To odrębne od wcześniej zgłoszonego problemu z artefaktem projektu klienta: ten brief dotyczy wyłącznie assetu producenta. Nie powtarza ani nie zawiera danych klientów.

## Działania dla właściciela i rekomendacja dla Claude

**Priorytet: P0 — containment i rozstrzygnięcie uprawnień.** Właściciel repozytorium powinien zdecydować o natychmiastowym ograniczeniu anonimowego dostępu do repo/artefaktów do czasu oceny, a uprawniona osoba powinna potwierdzić z GTV licencję obejmującą publiczne przechowywanie Git, serwowanie serwerowe, użycie przez pracowników i klientów, konwersję STEP→GLB, eksport projektów oraz backupy. Sama zgoda na pobranie przez jednego użytkownika nie może być domyślnie uznana za zgodę na publiczną dystrybucję ani sublicencję.

Nie zmieniano widoczności repozytorium, nie usuwano pliku, nie przepisywano historii Git i nie zmieniano aktywnego katalogu. Nie należy uznawać usunięcia z kolejnego commita za pełne containment: wersje mogą pozostać w Git-historii, forkach, klonach, mirrorach, cache i backupach. Plan oczyszczenia historii lub repozytorium ma przygotować i wykonać uprawniony właściciel po ocenie wpływu na współpracowników i kopie. Nie kontaktowano GTV w imieniu firmy.

**Zachowanie aplikacji:** do czasu udokumentowania zakresu licencji nie importować STEP/GLB do bundle, nie serwować modelu z backendu i nie konwertować go. Renderer może nadal używać własnej geometrii parametrycznej wyprowadzonej z zatwierdzonego profilu produktu; nie należy jej uzyskiwać przez modyfikację modelu GTV. Gdy zakres zgody pozostaje `unknown`, pipeline publikacji ma blokować asset zewnętrzny i wypisać nazwę dostawcy, cel, magazynowanie oraz wymagane pola licencji do uzupełnienia.

## Zależności i kryteria odbioru

**Zależności:** decyzja właściciela o widoczności/containment; ustalenie statusu bieżącej i historycznej dystrybucji; tekst warunków zaakceptowany przy pobraniu; ewentualna indywidualna zgoda GTV; plan historii/kopii; ewentualna opinia prawna. Wymiary konkretnego SKU wymagają niezależnego źródła technicznego i próby warsztatowej.

1. Do czasu rozstrzygnięcia właściciel dokumentuje containment decyzją uprawnioną osobą; anonimowa dostępność repo/artefaktu zostaje ponownie sprawdzona.
2. Każdy firmowy asset producenta w Git, bundle, backendzie i backupie ma rekord licencji: dokładny asset/SKU, właściciel praw, użytkownik licencji, dozwolona kopia, modyfikacja/konwersja, użytkownicy końcowi, publiczne/serwerowe użycie, eksport, retencja, odwołanie oraz dowód zgody. Brak wymaganej zgody blokuje publikację.
3. Dopóki licencja nie potwierdza dokładnego przepływu, test release blokuje pakowanie/serwowanie STEP/GLB z nieznanym statusem i wskazuje brakujące warunki; brak takiego assetu nie blokuje parametrycznego podglądu ani pozostałej pracy aplikacji.
4. Brak modelu licencjonowanego nie zmienia statusu gotowości produkcyjnej: wiercenia/CNC wymagają oddzielnego, wersjonowanego profilu wymiarowego dla exact SKU, zatwierdzonego źródła i warsztatowego zatwierdzenia. Wymiary z bryły poglądowej nie zasilają outputu produkcyjnego.
5. Jeśli właściciel zdecyduje o usunięciu z publicznego repozytorium, kryterium zakończenia obejmuje bieżący HEAD i uzgodniony plan dla historii, forków/klonów i backupów — samo skasowanie pliku w nowym commicie nie wystarcza.

## Ograniczenia i punkt wznowienia

`origin/main` po świeżym fetch: `8230275ad6dea52109f581c793bdd8d6f08684d3`, bez nowych commitów Claude. Anonimowa osiągalność Git potwierdzona przez odczyt samego HEAD. Nie otwierano CAD-u, nie uruchamiano aplikacji, nie modyfikowano plików ani widoczności repo i nie badano treści kopii/forów. Następny krok: konieczne działanie właściciela ws. containment oraz praw do konkretnego STEP; po świeżym `origin/main` sprawdzić, czy Claude dodał gate do pipeline assetów i pozostawił renderer oparty o własny profil.
