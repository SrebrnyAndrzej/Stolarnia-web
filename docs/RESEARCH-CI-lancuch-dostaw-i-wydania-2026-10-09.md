# CI, łańcuch dostaw i kontrola wydań

Data: 2026-10-09  
Baza: świeże `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3`  
Zakres: repozytoryjna konfiguracja build/test/dependency review; bez zmiany aplikacji i bez ustawień GitHub/Vercel.

## Problem i fakty z repozytorium

W drzewie rewizji nie ma katalogu `.github/workflows`; nie znaleziono więc automatycznego CI ani workflow aktualizacji zależności. `package-lock.json` istnieje, lecz sama blokada wersji nie sprawdza, czy pull request przechodzi testy i buduje aktualny frontend. `package.json` definiuje `npm test`, `npm run typecheck` (obejmuje osobne konfiguracje TypeScript serwera i web) oraz `npm run build` (Vite build i TypeScript głównego projektu). Obecny `build` nie zastępuje osobnego typechecka web.

Nie sprawdzano ustawień Security/Dependabot w GitHub, ochrony gałęzi, ani tego, czy wdrożenie Vercel jest sprzężone z kontrolą PR. Brak workflow w repo nie dowodzi, że właściciel nie wykonuje ręcznie żadnych testów.

## Rekomendacja dla Claude

**P0 przed częstymi zmianami przez wielu współtwórców:** dodać wymagany CI do PR i push na główną gałąź. Używać `npm ci` z lockfile, potem `npm test`, `npm run typecheck`, `npm run build`. Build/test nie powinny otrzymywać sekretów Supabase ani uprawnień deploymentu. CI powinien działać na PR z forków bez `pull_request_target` i bez wykonywania uprzywilejowanych akcji z niezaufanym kodem. Minimalne uprawnienia tokena workflow: tylko odczyt repo, chyba że konkretny job potrzebuje więcej.

Zablokować merge, jeżeli dowolny z czterech kroków CI nie przejdzie. Dla domenowych obszarów o wysokim ryzyku (wycena, wiercenia, geometria, BOM, eksport PDF/CSV) utrzymywać testy regresji i fixture syntetyczne; zielony build sam nie dowodzi poprawności produkcyjnej obliczeń.

**P1 — zależności:** włączyć GitHub Dependency Graph/Dependabot alerts i rozważyć aktualizacje dla npm oraz GitHub Actions. Dodać dependency review na PR, aby zmianę wersji bezpośredniej lub przechodniej ocenić przed merge. Każdy alert wymaga triage: czy pakiet jest produkcyjny/uruchamiany na serwerze, czy łatka jest kompatybilna, który test ją pokrywa oraz czy wdrożono poprawkę. Nie uruchamiać automatycznego `npm audit fix --force` bez przeglądu, bo może wykonać major update.

Jeśli Actions zostaną dodane: przypinać zewnętrzne akcje do pełnego SHA i komentować przy SHA nazwę oraz wersję; definiować `permissions:` jawnie z zasadą minimum; nie nadawać sekretów jobowi build PR. Ewentualne automatyczne deploye rozdzielić od joba testowego i ograniczyć do zaufanych pushy/środowisk po przejściu required checks.

## Zależności i decyzje

- Repozytorium `private: true` w `package.json` dotyczy pakietu npm, nie prywatności GitHub. Stan widoczności repo i dostępność planu funkcji GitHub Security są niezweryfikowane; właściciel sprawdza w ustawieniach, czy alerts/dependency review są dostępne i aktywne.
- CI uruchamia obliczenia lokalnie na syntetycznych danych; testy nie mogą odczytywać dokumentów klientów ani sekretów środowiska.
- Required status checks wymagają konfiguracji zasad branch protection/ruleset; nie zmieniać ustawień bez sprawdzenia istniejących reguł i właścicielskich wymagań.

## Kryteria odbioru

1. Nowy PR bez zmian aplikacji i PR z celowym błędem typu/testu/buildu: pierwszy przechodzi, drugi jest blokowany przez required check.
2. CI używa `npm ci`; lockfile pozostaje niezmieniony po instalacji. Pracuje na obsługiwanym, jawnie ustalonym Node LTS; bez `SUPABASE_SECRET_KEY` ani deploy tokenów.
3. Wszystkie cztery polecenia `npm test`, `npm run typecheck`, `npm run build` przechodzą z czystego checkoutu; `npm test` musi raportować liczbę testów, a regresyjny test celowo wprowadzony w test fixture powoduje fail.
4. Workflow z pull requesta z forka nie ma write tokena/secrets; nie jest używane `pull_request_target` do checkoutu/wykonywania kodu PR.
5. Zmiana `package.json`/`package-lock.json` pokazuje review nowych i usuniętych zależności oraz liczbę alertów; alert krytyczny/wysoki ma właściciela, decyzję i termin obsługi zamiast cichego zignorowania.
6. Zmiana używanej GitHub Action aktualizuje pin SHA przez review; polityka jawnie ustala dopuszczone akcje oraz najmniejsze workflow permissions.
7. Po merge do głównej gałęzi aplikacja wdrażana jest tylko z przebiegu, który przeszedł te same required checks; wdrożenie ma widoczny commit SHA i możliwość rollbacku.

## Priorytety i miara

**P0:** CI `npm ci` + test + oba typechecki + build, brak sekretów oraz required checks. Zależność: decyzja właściciela o obsługiwanym Node LTS oraz ochrona głównej gałęzi.

**P1:** Dependency Graph/alerts, review zależności i aktualizacje przypiętych Actions.

**Miernik:** 100% PR do głównej gałęzi ma zielony wymagany zestaw CI; testy nie mają dostępu do prawdziwych danych/sekretów; każdy wysoki/krytyczny dependency alert jest triage’owany, a każda zmiana Actions ma przypięty SHA.

## Ograniczenia

To statyczna analiza repozytorium, nie audyt konta GitHub ani Vercel. Nie sprawdzano podatności konkretnych wersji, nie wykonywano `npm audit` ani nie aktualizowano pakietów. Sama obecność lockfile i zielone CI nie dowodzą bezpieczeństwa ani prawidłowych obliczeń produkcyjnych.

## Źródła

- GitHub Docs, Building and testing Node.js: https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs — konfiguracja `npm ci`, testu i builda.
- npm CLI, `npm ci`: https://docs.npmjs.com/cli/commands/npm-ci/ — instalacja z lockfile i błąd przy rozbieżności manifestu/lockfile.
- GitHub Docs, dependency review: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review — widok zmian zależności pośrednich i podatnych wersji przed wprowadzeniem.
- GitHub Docs, hardening Actions: https://docs.github.com/en/code-security/tutorials/secure-your-organization/protect-against-threats — minimalne `GITHUB_TOKEN` permissions i pełne SHA dla actions.
- GitHub Docs, `pull_request_target`: https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target — elevated trust, secrets/token i ryzyko wykonywania kodu z PR.

## Pliki sprawdzone

- `package.json` i `package-lock.json` — skrypty, zależności i lock.
- `.github/workflows/` — nieobecny na badanej rewizji.
