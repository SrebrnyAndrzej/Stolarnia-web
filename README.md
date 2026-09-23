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
