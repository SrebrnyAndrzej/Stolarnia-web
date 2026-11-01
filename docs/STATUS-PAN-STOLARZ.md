# Pan Stolarz — wspólny stan pracy

Aktualizacja: 31.10.2026. Ten plik jest kontekstem dla nowych sesji Codexa i Claude na Windowsie i Macu. Git synchronizuje pliki, nie historię czatu.

## Repo i wznowienie

Repo: https://github.com/SrebrnyAndrzej/Stolarnia-web
Gałąź robocza: `feat/pan-stolarz-v2`. Draft PR: https://github.com/SrebrnyAndrzej/Stolarnia-web/pull/2
Przed pracą sprawdź `git status`, pobierz zdalne zmiany i nie nadpisuj niezapisanej pracy. Na drugim urządzeniu sklonuj repo, przełącz gałąź i wykonaj `git pull --ff-only` dopiero przy czystym drzewie. Wspólne pliki nie synchronizują automatycznie sesji aplikacji.

## Decyzje użytkownika

Aktualny priorytet 01.11.2026: praca stolarni dla właściciela oraz dwóch pracowników — Bartka i Kacpra. Faktury pozostają poza systemem; nie integrujemy teraz Erste, KSeF ani księgowości. Rozwijamy obecny backend Supabase/API zamiast wdrażać ERP. Bieżący plan: `docs/PLAN-praca-stolarni.md`. Zadania, czas i zgłoszenia opisane w planie wymagają implementacji; nie przedstawiać ich jako działających funkcji.

Branding Pan Stolarz, wybrany wariant 2, język bezpośredni na Ty. Widoki klienta, właściciela i pracownika. Pracownik: przypisane dane techniczne i kalkulator szuflad; bez finansów i wycen. Silnik należy do Claude; Codex nie zmienia `src/core`. Claude przygotowuje rendery i animacje. Codex skupia się na układzie i treściach.

## Działa w podglądzie

Strona i panele v2. Publiczny kreator kuchni: prosty/L/U, szafki, 2D/3D, szkic lokalny, import/eksport, opis do formularza. Hero ma dostarczoną Kuchnia-Darii-animacja-v2.mp4, sterowanie scrollem z wygładzaniem, poster, pauzę i reduced-motion. Osobna sekcja zawiera dostarczony film Szafka-skladanie-animacja.mp4 z ręcznym odtwarzaniem. Prototypy mediów Codexa wycofane z publikacji.

Bieżąca rozbudowa układu: dwa wejścia (kreator / opis własnego pomysłu) i FAQ o projekcie, szkicu, cenie i przygotowaniu do kontaktu. Bez zmiany brandingu i zachowania hero.

## Blokady produkcyjne

Rzeczywiste logowanie i przyjmowanie zapytań wymagają konfiguracji Supabase/środowiska oraz migracji. UI i mockowane testy nie dowodzą gotowości prawdziwych kont. Nie obiecuj instant wyceny, uploadu załączników ani rezerwacji terminu. Nie zmieniaj produkcji, danych klientów ani finansów bez zlecenia.

## Podział zadań

Pakiet dla Claude: `docs/handoff/CLAUDE-ZADANIA.md`. Status: przygotowany, nieprzekazany automatycznie — brak połączenia z aplikacją Claude w sesji Codexa. Research i brief marki: `docs/branding/`. Kanał koordynacji: `docs/KOORDYNACJA-Claude-Codex.md`.

## Walidacja

`npm run typecheck`, `npm run build`, testy `tests/v2/home-animation.spec.ts` i `tests/v2/interface.spec.ts`. Playwright używa `PAN_STOLARZ_QA_URL` i opcjonalnie `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Kontrole uprawnień: `npm run test:v2:unit` oraz scenariusze API w repo. Aktualny deployment sprawdzaj po SHA w Vercel; stare unikalne URL-e nie aktualizują się po pushu. Wdrażamy preview z gałęzi, bez merge do main.

## Ekrany właściciela i pracownika — bieżąca iteracja

Wspólny widok projektów otrzymał oddzielne nagłówki ról, podsumowania etapów oraz skróty: właściciel do zapytań i zarządzania dostępem, pracownik do kalkulatora. Liczniki nie tworzą terminów ani zadań, których brak w danych. Bez zmian w API/silniku/uprawnieniach. Test pracownika dodatkowo sprawdza brak żądań finansowych. Do pokazania bez logowania: `#/podglad/owner/projekty` i `#/podglad/employee/projekty` — jawne dane przykładowe.

## Dokumentacja i wydruk
Właściciel i pracownik mają w projekcie przycisk „Dokumentacja techniczna”. Pełne PDF-y techniczne i skrócone karty montażowe wykorzystują istniejący generator; zakres cały projekt lub szafka. Pracownik drukuje z zapisanego wydania przypisanego projektu, właściciel również z bieżącej rewizji. Wydania tworzy dotychczasowy panel Produkcja. Brak wydania jest jawny; roboczy status nie znika. API sprawdza uprawnienia i rewizję, bez finansów i danych klienta. Demo zawiera wyłącznie syntetyczne przykładowe pliki. To integracja dokumentacji, nie nowa implementacja silnika ani zatwierdzenie konstrukcji do produkcji.

## Dopracowanie UX
Naprawiono rozpoznawanie sekcji panelu z parametrami hash (ważne przy odświeżaniu linku pracownika). Filtry i wyszukiwanie projektów zachowują się w URL, są filtry produkcji/montażu i przywrócenie pustej listy. Inspektor pokazuje wybraną szafkę. Dodano przełączanie ról demo, wyszukiwanie najnowszych zapytań właściciela, odświeżanie dokumentacji i polskie etykiety diagnostyki. Walidacja logowania poprawnie wskazuje błędny e-mail. Bez nowych deklaracji gotowości produkcyjnej i bez zmian src/core.
Renderer 3D w panelu projektów jest ładowany dopiero po wyborze 3D; ekran 2D i dokumentacja nie wymagają jego pobrania. Nie zmienia to geometrii ani zachowania silnika. Pozostaje build warning wielkości chunka samego renderera.

Aktualizacja hero: dostarczona Kuchnia-Darii-animacja-v4.mp4 (26 s) zastępuje v2. HomeIntro używa nowych nazw plików, bez zmiany sterowania scrollem i wygładzania.

Aktualizacja tempa hero: maksymalnie 1 sekunda filmu na sekundę czasu (wcześniej 4), łagodniejsze dochodzenie do kadru 0,45 s. Zakres hero 560 svh desktop / 400 svh telefon. Natywne przewijanie, pauza i ograniczenie ruchu pozostają dostępne.

## Aktualny tryb hero — samoczynne odtwarzanie
Na nowe zlecenie użytkownika film v4 odtwarza się sam, bez powiązania currentTime ze scrollem. Tempo 0,75×, bez dźwięku i zapętlenia. Po zakończeniu następuje płynne przewinięcie do następnej sekcji. Hero ma naturalną wysokość zamiast długiego obszaru scrolla; tekst ujawnia się z czasem filmu. Pauza/wznowienie i ponowne odtworzenie są dostępne. Po ręcznej nawigacji, przy fokusie w hero, ukrytej karcie lub reduced-motion nie wymuszamy przejścia. Reduced-motion/saveData nie pobiera filmu bez opt-in; odrzucenie autoplay pokazuje przycisk uruchomienia. Ta decyzja zastępuje wcześniejszy tryb przewijania i jego parametry.

## Treści z materiałów agencji — 1.11.2026
Dodano lokalne treści, sześć etapów współpracy, sekcję o Mateuszu, obszar działania, kontakt telefoniczny, lokalne SEO/JSON-LD, kolory v02 i lokalne IBM Plex tylko dla publicznej witryny. Nie opublikowano danych weryfikacyjnych ani źródłowych plików strategii. Brakujące rendery, warunki i terminy pozostają wyłączone. Raport do recenzji: bridge/outbox/PS-WWW-001-codex.md. Nie oznacza odbioru całego nowego briefu ani wykonania benchmarku/Lighthouse. Istniejące panele, kreator i hero autoplay pozostają zgodne z wcześniejszymi decyzjami użytkownika.

## Uzupełnienie całej gotowej treści — 1.11.2026
Na polecenie użytkownika dodano 4 usługi, 4 pozycje paska dowodów, galerię 2 istniejących wizualizacji, 3 wyróżniki z działającymi przejściami, materiały/okucia i komplet 10 pytań FAQ. Galeria zastępuje osobny blok składania; zachowuje ten sam film oraz dodaje kadr kuchni z linkiem do animacji. Wyróżnik dokumentacji otwiera publiczny syntetyczny przykład PDF z oznaczeniem nieprodukcyjnym. Ceny opisano dla zatwierdzonego zakresu, bez zmiany umów i aktualizacji zapisanych kwot. Nie podano nieznanych terminów, cen pomiaru ani okresów gwarancji. Opinie, nieznane dane firmy i brakujące dokumenty prawne nie są zastępowane fikcyjną treścią.

## Moduł zadań — pierwsza implementacja 01.11.2026
Dodano `#/panel/zadania`: właściciel przydziela zadanie aktywnemu pracownikowi przypisanemu do projektu; pracownik odczytuje własne zadania i rozpoczyna/wstrzymuje/kończy pracę. Osobna tabela, wersjonowanie, historia zdarzeń i transakcyjna komenda SQL. Klucz operacji ogranicza duplikaty po ponowieniu tworzenia. Demo jawnie nie zapisuje zadań. Nie utworzono kont Bartka/Kacpra, nie dodano czasu, checklist ani zdjęć.

Wymagane przed aktywacją: zastosowanie `supabase/migrations/202611010001_workshop_tasks.sql` po migracji kont, testy transakcji i uprawnień na testowym Postgres/Supabase, zaproszenie pracowników i przypisanie projektów. Migracja nie została wykonana na zdalnej bazie. Nie było deployu tej zmiany. Testy przeglądarkowe `tests/v2/tasks.spec.ts` używają atrapy API; nie potwierdzają reguł SQL.

Weryfikacja przed deployem: migracja zadań została wykonana na izolowanym PostgreSQL/PGlite z testowymi rolami i członkami. Potwierdzono audyt, idempotentne tworzenie, kontrolę wykonawcy, konflikt wersji, przejścia stanów, dezaktywację konta i odmowę bezpośredniego dostępu authenticated. Nie jest to migracja zdalnego Supabase. Instrukcja aktywacji i przeniesienia: `docs/DEPLOY-i-przeniesienie-OVH.md`.

## Konta pracowników — 01.11.2026 (rozpoczął Codex, dokończył Claude)
Właściciel w `#/panel/pracownicy` tworzy konto pracownika (imię, e-mail, funkcja w zespole). Serwer zakłada tożsamość przez Supabase Admin `generateLink` (invite) — bez wysyłki e-maila — i zwraca tylko właścicielowi jednorazowy link `#/aktywacja` (token we fragmencie URL). Pracownik ustawia hasło (12–128 znaków), `/api/v2/activate` weryfikuje token i membership. Właściciel może wygenerować nowy link (invite lub recovery). Rola zawsze `employee`; funkcja (`job_role`) jest opisowa i nie nadaje uprawnień. `operation_id` (kolumna `creation_id`) sprawia, że ponowienie tej samej operacji zwraca to samo konto. Stare wiersze `client` nie logują się do paneli. Wymaga migracji `202611010002_staff_accounts.sql` (addytywna) i `PAN_STOLARZ_ORIGIN` (https). Migracja nie została wykonana na zdalnej bazie, brak deployu, nie utworzono kont. Testy: jednostkowe z atrapą Supabase, `test:v2:api`, `tests/v2/staff-accounts.spec.ts` (atrapa API). Do decyzji Mateusza: pracownik ma projektować i wyceniać przy kliencie — obecnie nadal bez wycen i finansów.

## Kalkulator bez logowania — podgląd
Podglądy `#/podglad/owner/szuflady` oraz `#/podglad/employee/szuflady` otwierają pełny kalkulator. Osobne publiczne endpointy `/api/demo/systemy-szuflad` i `/api/demo/przelicznik-szuflad` używają istniejącego silnika z domyślną konstrukcją przez adapter; nie ładują ani nie zapisują bazy stolarni. Zalogowani nadal korzystają z chronionych endpointów i własnych ustawień. Test Playwright uruchamia prawdziwe lokalne API bez sesji i potwierdza obliczenie oraz ochronę listy projektów. Nie zmieniano algorytmów src/core.

## Biblioteka marek i dekory
Przeniesiono 19 WebP marek z repo mussi-plyta do `web/public/brand/manufacturers`, z manifestem i SHA-256. Nie są automatycznie listą oferty ani partnerów Pan Stolarz. Dekory (644 zdjęcia) już były w repo. Kopiowanie obrazów dekorów/okuć włączono do standardowego `npm run build`, a nie tylko komendy Vercel, z myślą o OVH. Szczegóły: `docs/ASSETY-dekory-i-logotypy.md`.

## Katalog i karuzela marek — nowy interfejs
Pod „Materiały i okucia” dodano ręczną karuzelę 19 logotypów. Menu publiczne ma `#/katalog-dekorow`, 644 dekory z wyszukiwaniem i filtrem producenta. Wspólny picker pozwala wybrać dekor frontów w kreatorze; wybór przechodzi z katalogu linkiem, utrwala się w lokalnym szkicu/import-export i jest uwzględniony w opisie zapytania. Publiczny endpoint dekorów nie czyta bazy firmy. Wybrana próbka jest widoczna, ale 3D pozostaje kolorem poglądowym; bez mapowania miniatur na geometrię. Potwierdzenie fizycznej próbki, formatów i grubości pozostaje osobnym etapem. Nowe testy: `tests/v2/decor-catalog.spec.ts`.
Walidacja: typecheck i build przeszły; 2 nowe testy katalogu/karuzeli oraz eksport/import dekoru i briefu przeszły. 6/7 testów kreatora przeszło na dev; scenariusz U zatrzymał się na ładowaniu modułu 3D na dev, następnie przeszedł bez zmian na zbudowanej paczce produkcyjnej (vite preview).

## Rozpoczęcie migracji OVH — panstolarz.pro
Użytkownik zlecił przeniesienie na OVH i domenę panstolarz.pro. DNS publiczny 01.11.2026: ns200.anycast.me/dns200.anycast.me, A 87.98.236.253. Nie potwierdzono typu hostingu ani dostępu SSH; środowisko nie ma podłączonych poświadczeń OVH/Supabase. Nie zmieniono DNS ani serwera. Pakiet `deploy/ovh` zawiera usługę systemd dla Node 24, Caddyfile, przykład env bez sekretów, preflight blokujący start bez konfiguracji i instrukcję uruchomienia/rollbacku. Dodano publiczny `/healthz` bez danych firmy; test lokalny OK. Przeniesienie samej aplikacji zachowuje obecny Supabase; pełne odejście od Supabase wymaga osobnej migracji Auth i API danych. W czacie oczekujemy na podłączenie dostępu SSH i podanie typu/adresu usługi OVH; nie prosić o wklejanie kluczy.

## Zmiana celu migracji — obecny Pro + Supabase
Użytkownik polecił pominąć VPS i jego wycenę. Automatyzacja wyceny została anulowana bez zakupu. Aktualny cel to istniejący hosting Pro i Supabase; instrukcja `deploy/ovh-pro/README.md` zastępuje na ten etap wariant systemd/Caddy z `deploy/ovh`. Katalog dekorów przeniesiono do generowanego statycznego `/catalog/decors.json` (644 wpisy), build i 2 testy przeglądarkowe katalogu przeszły. Zalogowany OVH potwierdził webroot `www` i aktywne SSL dla apex/www. Brak danych dostępu SFTP w środowisku; próba TCP SSH odrzucona. Nie wysłano plików na hosting, nie zmieniono DNS/hasła ani Supabase. Backend Node nadal wymaga konfiguracji integracji z frontendem na Pro; nie przedstawiać samego statycznego uploadu jako ukończonej migracji paneli/API. W czacie oczekiwanie na podłączenie SFTP lub wybór ręcznego uploadu.

## Wdrożenie OVH przez Git — stan potwierdzony HTTP
Git wdrożył gałąź `deploy/ovh-pro` (commit `db8055d`) do witryny `Staging-podglad` na https://podglad.panstolarz.pro. Manager raportuje katalog `j8fhlg95l6`; przed zmianami ponownie odczytać rzeczywiste przypisania w panelu. Stare `www` zachowano. HTTPS HTTP 200 potwierdzono dla index.html i katalogu 644 dekorów. PHP bridge działa na hostingu: `/api/demo/systemy-szuflad` → 6 systemów, `/api/demo/przelicznik-szuflad?LW=564&NL=550&profilId=amix-elite-standard&wariant=199` → LW 564, lista projektów bez sesji → 401. `/api/v2/config` → authReady false: prawdziwe konta nie są jeszcze uruchomione.

Backend: produkcyjny deployment Vercel `dpl_ER6DoGzowQQ9FMrnomwZ91cbQf5B` (source a1766d0) pod https://backend.panstolarz.pro, TLS wydany. Most PHP używa tej domeny. Dodatkowy api.panstolarz.pro jest aliasem preview i nie jest używany w mostku; nie wyłączano globalnego SSO. Przy przygotowaniu deployu tymczasowo zatrzymano automatyczne przypinanie domen, następnie przywrócono je. Stara domena główna OVH i rekordy MX/A/AAAA nie były zmieniane na moment tej notatki; osobna automatyzacja próbuje przełączyć foldery domen, ale błędy UI nie potwierdzają powodzenia. Nie deklarować domeny głównej jako przeniesionej bez ponownego sprawdzenia HTTP.

Weryfikacja przeglądarkowa z lokalnego Chromium na zdalnym podglądzie zatrzymała się na ERR_CERT_AUTHORITY_INVALID (brak zaufania w środowisku przeglądarki); nie wyłączano weryfikacji TLS. Odczyty HTTPS przez systemową konfigurację zaufania przeszły. To ograniczenie walidacji browser, nie dowód ukończenia całej migracji.

### Blokada przełączenia domeny — po ostatniej próbie
Automatyzacja UI nie zatwierdziła zmiany folderu witryny. Osobna próba przez `/engine/apiv6/hosting/web/.../attachedDomain` w sesji przeglądarki otrzymała 401 „You must login first”; nie wykonywano PUT ani prób obejścia uwierzytelnienia. Domena główna i www pozostają w `www`, działający podgląd w `j8fhlg95l6`. Nie przedstawiać migracji domeny jako ukończonej. Oficjalna instrukcja OVH potwierdza istnienie opcji zmiany katalogu: https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/my-websites-modify-root-folder (My sites → menu witryny → Edit site → Root folder → Confirm). Nie twierdzić na podstawie nieudanej automatyzacji, że OVH nie obsługuje tej operacji lub wymaga VPS. Wszystkie uruchomione automatyzacje zakończone. Nie zakupiono VPS ani płatnych dodatków, nie zmieniono danych firmy ani poczty.

## Biały ekran HTTP — przyczyna i poprawka
Przeglądarka na http://podglad.panstolarz.pro zgłosiła rzeczywisty błąd `crypto.randomUUID is not a function` i pusty body. Dodano wspólny randomId() z CSPRNG getRandomValues dla HTTP, użyty w Landing/Tasks/planner/Contracts. Test http-preview.spec.ts wymusza brak randomUUID i potwierdza render oraz dodanie szafki. Typecheck i build przeszły. Source commit5b86e71, gotowy build gałęzi deploy/ovh-pro commit2705411, skrypt index-DZ1D0Rfp.js. OVH nadal serwuje index-Be5o-CUm.js — poprawka nie została potwierdzona na OVH. Przygotowana mała paczka /workspace/releases/pan-stolarz-poprawka-http.zip (index + assets).

SSL: użytkownik pokazał ERR_CERT_COMMON_NAME_INVALID. Raport TinyFish twierdzi, że certyfikat podglądu jest Active, ale nie potwierdza poprawnego certyfikatu faktycznie serwowanego. DNS: A87.98.236.253 i AAAA2001:41d0:301:5::31; canonical cluster131 A146.59.209.152. Nie zakładać błędu samych geo IP bez odczytu właściwych IP hostingu. Próba weryfikacji/naprawy DNS przez TinyFish zakończyła się ogólną odmową narzędzia, bez potwierdzonych zmian DNS. Próba odświeżenia Git zwróciła sprzeczny opis panelu (brak Git vs wcześniejsze Active; inny folder); nie traktować tego jako dowodu, że Pro nie obsługuje Git. Wstrzymano kolejne płatne próby w ciemno. Nie deklarować SSL ani poprawki OVH jako gotowych. Wszystkie automatyzacje z tej iteracji zakończone.

### Kolejna próba odświeżenia OVH
Na polecenie „kontynuuj” sprawdzono konsolę API OVH przez TinyFish (run d062c855-6a12-4d64-b958-7a24a25925af). Agent nie uruchomił endpointu deploy z powodu błędów starych identyfikatorów elementów DOM; samo otwarcie specyfikacji nie potwierdziło uwierzytelnienia API. Nie wykonywać kolejnych takich samych płatnych prób bez nowej drogi dostępu. Publikacja poprawki HTTP na OVH nadal niepotwierdzona, przy ostatnim odczycie index-Be5o-CUm.js. Potrzebny skuteczny bezpośredni dostęp SFTP/API albo ręczne uruchomienie wdrożenia przez właściciela. Publiczny link udostępniający podgląd Vercela został odrzucony przez automatyczną kontrolę jako rozszerzenie dostępu do chronionego deploymentu; nie zmieniano ochrony ani nie obchodzono odmowy. Chroniony deploy poprawki (READY, source5b86e71): stolarnia-aunrdx7y9-srebrnyandrzejs-projects.vercel.app.
