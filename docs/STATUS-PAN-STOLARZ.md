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
