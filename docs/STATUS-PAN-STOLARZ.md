# Pan Stolarz — wspólny stan pracy

Aktualizacja: 31.10.2026. Ten plik jest kontekstem dla nowych sesji Codexa i Claude na Windowsie i Macu. Git synchronizuje pliki, nie historię czatu.

## Repo i wznowienie

Repo: https://github.com/SrebrnyAndrzej/Stolarnia-web
Gałąź robocza: `feat/pan-stolarz-v2`. Draft PR: https://github.com/SrebrnyAndrzej/Stolarnia-web/pull/2
Przed pracą sprawdź `git status`, pobierz zdalne zmiany i nie nadpisuj niezapisanej pracy. Na drugim urządzeniu sklonuj repo, przełącz gałąź i wykonaj `git pull --ff-only` dopiero przy czystym drzewie. Wspólne pliki nie synchronizują automatycznie sesji aplikacji.

## Decyzje użytkownika

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
