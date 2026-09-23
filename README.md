# Stolarnia Online

Serwer MCP i aplikacja web do projektowania, wyceny i przygotowania produkcji mebli.
Logika domenowa została przeniesiona z iPadowej aplikacji [StolarniaApp](https://github.com/SrebrnyAndrzej/stolarnia) (Swift) do TypeScriptu.

## Co jest w środku

| Warstwa | Plik | Źródło w StolarniaApp |
|---|---|---|
| Budowa korpusu, frontów, szuflad, blatu | `src/core/builder.ts` | `DomainCore/CabinetBuilders.swift`, `SzufladyModuluEngine.swift` |
| Katalog 56 modułów kuchennych | `src/core/catalog/kitchen-modules.json` | `KitchenModuleCatalog_v0.14.3.json` |
| Płyty EGGER/Kronospan + ceny referencyjne | `src/core/catalog/materials.ts` | `BazaMaterialowWzornikiSeeder.swift`, `CennikRynkowyPlyt.swift` |
| Okucia Blum/GTV/Häfele/Hettich + ceny | `src/core/catalog/hardware.ts` | `CennikRynkowyAkcesoriow.swift`, `BazaOkucAkcesoriaSeeder.swift` |
| Lista formatek, okleinowanie ABS, rozkrój | `src/core/production.ts` | `ListaFormatekProjektuModelsV070`, `OkleinowanieEngineV072`, `RozkrojPlytEngineV071` |
| Wycena Eco/Standard/Premium/VIP | `src/core/pricing.ts` | `ProjektWycenyBuilder`, `SilnikWycenyWariantowej`, `AutomatycznyDoborOkuc` |
| Normy szafek i kolizje | `src/core/validation.ts` | `NormySzafekCatalog`, `MebelCollisionValidatorV0143` |
| Usługa wspólna (web + MCP) | `src/service.ts` | — |
| Serwer MCP (27 narzędzi, zasoby, prompt) | `src/mcp/server.ts` | — |
| REST API + MCP po HTTP + frontend | `src/server/index.ts` | — |
| Aplikacja web (React) | `web/src` | — |

Świadome odstępstwa od oryginału:
- Obrzeże liczone dokładnie z listy formatek, zamiast szacunku 3,5 mb/m².
- Plecy HDF wyceniane osobno.
- Podnośniki Aventos i zawieszki wliczone do wyceny.
- Dobór okuć VIP bierze najdroższą pozycję premium. W oryginale spadał do najtańszej pozycji w ogóle.

## Uruchomienie

```bash
npm install
npm run build        # frontend → dist/web, backend → dist/
npm start            # http://localhost:3210  (API /api, MCP /mcp)
```

Tryb deweloperski z hot-reload (API :3210 + Vite :5173):

```bash
npm run dev
```

Testy: `npm test` (rdzeń) oraz `npx tsx scripts/mcp-smoke.ts` (MCP przez prawdziwego klienta stdio).
Dane trzymamy w `data/stolarnia.json`, a katalog można zmienić zmienną `STOLARNIA_DATA`. Web i MCP używają tego samego pliku, więc projekt zbudowany przez Claude od razu pojawia się w przeglądarce (odświeżanie co 4 s).

## Podłączenie MCP

**Claude Code** (stdio):

```bash
claude mcp add stolarnia -e STOLARNIA_DATA="C:/Users/Komp/Stolarnia App/data" -- node --import tsx "C:/Users/Komp/Stolarnia App/src/mcp/stdio.ts"
```

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "stolarnia": {
      "command": "node",
      "args": ["--import", "tsx", "C:/Users/Komp/Stolarnia App/src/mcp/stdio.ts"],
      "cwd": "C:/Users/Komp/Stolarnia App",
      "env": { "STOLARNIA_DATA": "C:/Users/Komp/Stolarnia App/data" }
    }
  }
}
```

**Po HTTP** (serwer uruchomiony `npm start`): `http://localhost:3210/mcp` (Streamable HTTP, bezstanowy).

## Import z CAD (DXF / DWG)

W projektancie: **Import CAD**. Wybierasz plik, warstwę ze ścianami i jednostki, sprawdzasz podgląd, a aplikacja tworzy pomieszczenie ze ścianami z linii i polilinii. Jest też narzędzie MCP `importuj_cad`.

- **DXF** (ASCII) działa od razu, parsowany przez `dxf-parser`.
- **DWG** jest konwertowany do DXF przez **ODA File Converter**. Pobierz go z [opendesign.com/guestfiles/oda_file_converter](https://www.opendesign.com/guestfiles/oda_file_converter) i zainstaluj. Serwer sam znajdzie go w `C:\Program Files\ODA\…`, albo ustaw ścieżkę w zmiennej `STOLARNIA_ODA`. Alternatywa: LibreDWG `dwg2dxf` wskazany w `STOLARNIA_DWG2DXF`. Konwerter działa jako osobny proces.

Widoki projektanta: **Elewacja** (edycja ściany), **Rzut** (widok z góry, wybór ściany) i **3D** (three.js, obrót, przybliżanie, zaznaczanie szafek).

### Narzędzia MCP

- **Katalogi:** `katalog_modulow`, `lista_materialow`, `lista_okuc`, `zapisz_material`, `zmien_okucie`
- **Ustawienia:** `ustawienia_stolarni`, `zmien_ustawienia`
- **Projekty:** `lista_projektow`, `utworz_projekt`, `pokaz_projekt`, `zmien_projekt`, `duplikuj_projekt`, `usun_projekt`
- **Pomieszczenia i ściany:** `dodaj_pomieszczenie`, `zmien_pomieszczenie`, `dodaj_sciane`, `zmien_sciane`
- **Moduły:** `dodaj_modul`, `wypelnij_sciane`, `zmien_modul`, `duplikuj_modul`, `usun_modul`
- **Analiza:** `waliduj_projekt`, `wycen_projekt`, `lista_formatek` (JSON/CSV), `okleinowanie`, `rozkroj_plyt`
- **Zasoby:** `stolarnia://katalog/moduly`, `stolarnia://projekt/{id}`
- **Prompt:** `zaprojektuj_kuchnie`

## Dalej

Plan rozwoju (MCP, skille, biblioteki, formaty maszynowe) opisuje [docs/RESEARCH_MCP_SKILLE.md](docs/RESEARCH_MCP_SKILLE.md). Wytyczne produktu trafiają do `docs/WYTYCZNE.md`.

## Dokumentacja i katalogi — aktualizacja 23.09.2026

- [Wytyczne dla Claude i Codex v0.5](docs/WYTYCZNE.md)
- [Automatyczny dobór okuć](docs/SPECYFIKACJA-autodobor-okuc.md) i [research systemów kuchennych](docs/RESEARCH-okucia-kuchenne-autodobor.md)
- [Materiały Egger / Kronospan PL](docs/materialy/README.md): 644 lokalne zdjęcia, 408 pozycji Egger, 236 dekorów Kronospan oraz 9214 artykułów programu dostaw Egger.
- [Przeglądarka dekorów](docs/materialy/katalog.html) — otwórz lokalnie po pobraniu repozytorium.

Dane są biblioteką źródłową do wdrożenia. Pełne uzgodnienie regionalnej oferty Kronospan, macierzy wariantów płyt i profili obróbki pozostaje opisane w dokumentach jako nieukończone. Aktualizacja nie zmienia działania aplikacji.

## Wydruk dokumentacji

Domyślny **Pełny pakiet PDF** obejmuje karty szafek i osobne rysunki części z operacjami, widokami krawędzi, uwagami i źródłami reguł. **Karty zbiorcze szafek** to skrócony wydruk (`?skrocony=1`). Eksport pojedynczej szafki także domyślnie zawiera jej części. Braki danych montażowych pozostają oznaczone jako dokument roboczy.

Aktualny zakres zmian, sprawdzenia i kolejny krok opisuje [stan prac](docs/STAN_PRAC.md).

## Wdrożenie online (Vercel + Supabase)

- Projekt Vercel `stolarnia-web` jest połączony z repozytorium — każdy push na `main` wdraża produkcję. Dostęp chroniony logowaniem Vercel (Deployment Protection).
- Frontend: `dist/web` (CDN), zdjęcia dekorów kopiowane do `dist/web/api/dekory/obrazy`. API i MCP: funkcja `api/index.js` (Express z `dist/server/app.js`), region `fra1`. Konfiguracja: `vercel.json`.
- Baza: Supabase `stolarnia-web` (eu-central-1), tabela `stolarnia_baza` z jednym dokumentem JSON. RLS bez polityk — dostęp wyłącznie z serwera kluczem secret. Każde żądanie wczytuje bazę i zapisuje zmiany przed odpowiedzią z kontrolą wersji (równoległa zmiana → 409 zamiast nadpisania).
- Zmienne środowiskowe Vercel: `SUPABASE_URL` (ustawiona) i `SUPABASE_SECRET_KEY` — klucz secret z Supabase → Project Settings → API Keys, wkleja właściciel. Bez klucza API odpowiada 503 z instrukcją.
- Migracja lokalnych danych: `scripts/migracja-do-chmury.ts` (dopisuje brakujące projekty/materiały, niczego nie nadpisuje).
- Lokalnie bez zmiennych Supabase aplikacja nadal używa pliku `data/stolarnia.json`. Konwersja DWG nie działa na Vercelu (brak programu konwertera) — DXF działa.
