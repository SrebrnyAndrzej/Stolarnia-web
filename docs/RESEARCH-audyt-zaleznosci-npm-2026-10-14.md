# Audyt zależności npm — 14.10.2026

**Zakres:** migawka `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3`; analiza manifestu i lockfile oraz `npm audit` po czystym `npm ci`. Jest to ustalenie dotyczące deklarowanych/rozwiązanych pakietów, a nie dowód wykorzystania podatnej ścieżki w produkcji.

## Wynik sprawdzenia

`npm ci` zainstalowało 265 pakietów. `npm audit --json` zwróciło 4 pozycje: 2 high i 2 critical; dla każdej npm wskazał dostępne rozwiązanie. Lockfile zawierał:

| Pakiet | Rola/ścieżka | Zainstalowana wersja | Advisory / status |
|---|---|---:|---|
| `@modelcontextprotocol/sdk` | bezpośrednia zależność aplikacji | 1.30.0 | GHSA-6qxp-vccf-f47h / CVE-2026-104850, high; poprawka 1.31.0 |
| `concurrently` | zależność developerska skryptu `dev` | 9.2.4 | critical przez `shell-quote` |
| `shell-quote` | zależność przechodnia `concurrently` | 1.9.0 | GHSA-pqg4-j6r4-53mv / CVE-2026-102422, critical; poprawka 1.11.0 |
| `source-map-js` | zależność developerska przez Vite/PostCSS | 1.2.1 | GHSA-68fv-2mgg-jv7q / CVE-2026-93749, high; poprawka 1.2.2 |

### Fakty potwierdzone w repozytorium i źródłach

- Manifest przypina zakres `@modelcontextprotocol/sdk` do `^1.17.0`; kod importuje transporty/serwer (`src/mcp/stdio.ts`, `src/mcp/server.ts`, `src/server/app.ts`). Nie znaleziono w tych importach użycia klienta OAuth. Oficjalny advisory obejmuje SDK `<1.31.0`, ale jawnie stwierdza, że serwery MCP zbudowane z SDK nie są dotknięte tym problemem. Pozycja npm audit nie powinna więc być raportowana jako potwierdzona podatność tej aplikacji; aktualizacja do 1.31.0 nadal upraszcza higienę zależności.
- `package.json` uruchamia `concurrently` wyłącznie w skrypcie `dev` z dwoma stałymi skryptami `npm:dev:api` i `npm:dev:web`. Kod repozytorium nie wykazał wejścia kontrolowanego z zewnątrz przekazywanego do `shell-quote`. Advisory shell-quote wymaga tokenu z separatorem linii po tokenie `{ comment }` w tym samym wywołaniu `quote()`. Podatna wersja jest w grafie instalacji, lecz wykorzystanie warunku ataku nie zostało wykazane.
- `source-map-js` jest w lockfile przez łańcuch Vite/PostCSS (zależności developerskie). Advisory opisuje blokowanie pętli zdarzeń przy spreparowanej mapie sekcyjnej z bardzo dużym offsetem. Nie wykazano, by aplikacja przyjmowała niezaufane mapy źródłowe w działającym serwerze; ekspozycja produkcyjna pozostaje niepotwierdzona.
- SDK MCP jest jedyną z tych czterech pozycji bezpośrednią zależnością produkcyjną. Należy sprawdzić ponownie po aktualizacji, czy wersja i zakresy pozostają aktualne.

## Zalecenia dla Claude

**P1 — zaktualizować lockfile i ocenić cały graf.** W bezpiecznej gałęzi podnieść wersje do poprawek wskazanych przez npm/advisories (minimum: SDK 1.31.0, `shell-quote` 1.11.0 przez aktualizację `concurrently`, `source-map-js` 1.2.2 przez poprawkę grafu Vite/PostCSS). Nie przypinać pakietu przechodniego ręcznie bez sprawdzenia kompatybilności. Sprawdzić changelogi i różnicę major/minor, nie aktualizować masowo bez przeglądu.

**P1 — kryteria odbioru:**

1. `npm ci` z nowym lockfile kończy się poprawnie; `npm audit --json` nie wykazuje tych wersji jako podatnych, a nowe pozycje mają wyjaśnioną osiągalność i plan.
2. Przechodzą `npm run typecheck`, `npm test` oraz `npm run build`.
3. Uruchomienie `npm run dev` nadal startuje API i Vite; test uruchomienia MCP przez `npm run mcp`/`npm run mcp:build` potwierdza działanie transportu i podstawowego narzędzia bez poświadczeń lub danych rzeczywistych.
4. Sprawdzić osobno `npm audit --omit=dev` i pełny audit. Rozbieżność między nimi ma być opisana: testy developerskie też są częścią łańcucha dostaw, ale ich poziom narażenia jest inny.

**P2 — utrzymanie:** włączyć kontrolę zależności w CI (np. okresowy `npm audit` z raportem, a nie automatyczną zmianą lockfile) i przeglądać nowe advisory przy aktualizacji. Nie traktować liczby audytu jako miary ryzyka bez sprawdzenia roli, ścieżki i osiągalności.

**Zależności:** bezpieczny branch aktualizacji, kompatybilność SDK z interfejsami używanymi w trzech importach, wersje transitive rozwiązane przez npm oraz CI. **Właściciel wdrożenia:** Claude.

## Granice i status dowodów

- **Zweryfikowane:** wersje w `package-lock.json`, deklaracje `package.json`, ścieżki użycia SDK, skrypt `dev`, wynik audytu, treść trzech oficjalnych GitHub Advisories.
- **Niezweryfikowane:** produkcyjne manifesty instalacyjne/obrazy, polityki hostingu, osiągalność podatnych ścieżek po buildzie, użycie dowolnego wejścia w `concurrently`, konfiguracja CI i środowiska produkcyjnego. Nie wykonano żądań do produkcji ani analizy działającej usługi.
- **Nie jest to zgłoszenie aktywnego włamania ani dowód, że wszystkie 4 advisories są wykorzystywalne przez aplikację.**

## Walidacja tej rewizji

- `npm test`: 56/56 zaliczonych.
- `npm run typecheck`: zaliczony.
- `src/pdf.test.ts` uruchomione także osobno: 2/2 zaliczone.
- `npm run build`: nie udało się zweryfikować — Vite dostał `EPERM` przy `realpath` istniejącego pliku `web/src/main.tsx`, mimo że PowerShell i Node odczytały ten plik/ścieżkę, a build powtórzono. Nie zmieniano uprawnień ani pliku; traktuj to jako ograniczenie tej maszyny/sandboxa, nie błąd produktu.
- `git diff --check`: bez błędów formatowania patcha.

## Źródła pierwotne

- GitHub Advisory, MCP SDK OAuth: https://github.com/advisories/GHSA-6qxp-vccf-f47h (zakres `<1.31.0`; advisory wyłącza serwery MCP i klientów stdio).
- GitHub Advisory, `shell-quote`: https://github.com/advisories/GHSA-pqg4-j6r4-53mv (warunek ataku, dotknięte `<1.11.0`, poprawka 1.11.0).
- GitHub Advisory, `source-map-js`: https://github.com/advisories/GHSA-68fv-2mgg-jv7q (dotknięte `<1.2.2`, poprawka 1.2.2).
