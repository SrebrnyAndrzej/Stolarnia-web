# Mapa projektu: Stolarnia Online
commit: 8230275 · aktualizacja: 2026-11-01

## Czym jest projekt
Aplikacja web + serwer MCP do projektowania, wyceny i przygotowania produkcji mebli (Pan Stolarz). Logika domenowa przeniesiona z iPadowej StolarniaApp (Swift) do TypeScriptu. Jeden rdzeń (`src/core`) obsługuje REST API, serwer MCP (stdio/HTTP) i frontend React z widokiem 3D (three.js). Dane w `data/stolarnia.json` (zmienna `STOLARNIA_DATA`) lub w Supabase; wdrożenie na Vercel.

## Polecenia
`npm run dev` (API :3210 + Vite :5173) · `npm test` · `npm run typecheck` · `npx tsx scripts/mcp-smoke.ts` · `npm run mcp`. Na Windowsie `vite build` może zwracać `spawn EPERM` (esbuild).

## Moduły / foldery
| Ścieżka | Rola | Kluczowe pliki |
|---|---|---|
| `src/core/` | domena: typy, budowa szafek, produkcja, wycena, walidacja | `types.ts` (wszystkie typy), `builder.ts` (korpus/fronty/szuflady/blat), `production.ts` (formatki, okleinowanie, rozkrój), `pricing.ts` (Eco/Standard/Premium/VIP), `technologia.ts` (operacje produkcyjne — duży), `validation.ts`, `settings.ts`, `contracts.ts`, `statusy.ts`, `geometry.ts`, `dxf.ts`/`dwg.ts` (import CAD) |
| `src/core/silnik/` | nowy silnik konstrukcji | `model.ts`, `budowa.ts`, `polecenia.ts`, `adapter.ts` (most do starego buildera), `kuchnia-darii.fixture.json` |
| `src/core/catalog/` | katalogi | `kitchen-modules.json` (56 modułów), `materials.ts`, `decors.ts` (644 dekory), `hardware.ts`, `drawers.ts` + `reguly-szuflad.json`, `modules.ts` |
| `src/service.ts` | warstwa usług wspólna dla web i MCP (duży, ~50 KB) | — |
| `src/mcp/` | serwer MCP (27 narzędzi) | `server.ts`, `stdio.ts` |
| `src/server/` | Express: REST `/api`, MCP `/mcp`, statyka | `app.ts`, `index.ts` |
| `src/store/store.ts` | zapis: plik JSON lub Supabase | — |
| `src/export/` | dokumenty | `pdf.ts` (dokumentacja produkcyjna, duży), `szkice.ts`, `oferta.ts`, `umowa.ts`, `assets/pan-stolarz.png` |
| `src/*.test.ts` | testy (node --test przez tsx) | `service`, `silnik`, `technologia`, `przelicznik-szuflad`, `przegrody`, `pdf`, `contracts`, `agreed-price`, `wyspa`, `wydania`, `dxf`, `decors`, `hardware-products`, `store.chmura` |
| `web/src/` | React | `App.tsx`, `api.ts`; `views/`: `Designer.tsx` (projektant, duży), `Widok3D.tsx` + `studio3d.ts`, `Rzut.tsx`, `Quote.tsx`, `Oferta.tsx`, `Contracts.tsx`, `Production.tsx`, `Warsztat.tsx` (panele ról), `Materials.tsx`, `DecorCatalog.tsx`, `HardwareCatalog.tsx`, `PrzelicznikSzuflad.tsx`, `ImportDxf.tsx`, `Projects.tsx`, `Settings.tsx`, `Temat.tsx`; `render/fotorealizm.ts` (duży) |
| `api/index.js` | wejście Vercel | — |
| `supabase/migrations/` | schemat bazy | `202609230001_stolarnia_baza.sql` |
| `scripts/` | jednorazowe importy i generatory | importy klientów (`import-pieszczynscy`, `import-arch-kamien`, `kamien-parter`…), `rysunki-montazowe.ts`, `dokumentacja-z-rozkroju.ts`, `szkic-ciagu*.ts`, `mcp-smoke.ts`, `migracja-do-chmury.ts`, `sprawdz-supabase.mjs` |
| `docs/` | wymagania, research, stan prac | patrz niżej |
| `data/` | baza produkcyjna — **nie ruszać w testach** | — |

## Przepływ danych
Projekt (pomieszczenia → ściany → moduły) → `silnik` / `builder` buduje części → `technologia` dodaje operacje → `production` liczy formatki, obrzeża, rozkrój → `pricing` wycenia (cena uzgodniona zamrożona) → `export` tworzy PDF/ofertę/umowę → web i MCP czytają przez `service.ts` ten sam `store`.

## Gdzie szukać, gdy…
- konstrukcja szafki / szuflady / przegrody → `src/core/silnik/budowa.ts`, `builder.ts`, `catalog/drawers.ts`
- operacje, wiercenia, technologia → `src/core/technologia.ts`
- cena, warianty, marża → `src/core/pricing.ts`; cena uzgodniona → `agreed-price.test.ts`
- PDF produkcyjny i montażowy (jeden schemat stron T/R/E/I/S/C/M/K) → `src/export/pdf.ts`; workflow ról → `docs/WORKFLOW-WARSZTAT.md`
- nowe narzędzie MCP → `src/mcp/server.ts` + metoda w `src/service.ts`
- endpoint REST → `src/server/app.ts`; klient → `web/src/api.ts`
- zapis/Supabase → `src/store/store.ts`, `supabase/migrations`
- 3D → `web/src/views/Widok3D.tsx`, `render/fotorealizm.ts`

## Dokumenty — czytaj tylko właściwy
- Produkt i reguły: `docs/WYTYCZNE.md` (duży), `docs/SPECYFIKACJA-autodobor-okuc.md`
- Stan i podział pracy: `docs/STAN_PRAC.md`, `docs/WORKFLOW.md`, `docs/WORKFLOW-WARSZTAT.md` (role i pakiety P/M), `docs/KOORDYNACJA-Claude-Codex.md`
- Silnik i konta: `docs/RESEARCH-silnik-mebli-i-konta.md`; konstruktor niestandardowy: `docs/RESEARCH-konstruktor-mebli-niestandardowych.md`; kreator: `docs/RESEARCH-kreator-premium-dla-Claude.md`
- Katalogi: `docs/materialy/README.md`, `docs/okucia/README.md`
- Pozostałe `docs/RESEARCH-*` — tematyczne plany (KSeF, offline, WCAG, magazyn, reklamacje…); otwieraj tylko przy danym temacie.

## Konwencje i pułapki
- Claude implementuje silnik; Codex dostarcza research i dane (nie logikę).
- Braki danych oznaczać jawnie; dekor w katalogu ≠ zatwierdzona technologia.
- Import nie nadpisuje cen ani projektów; cena uzgodniona niezależna od katalogów.
- Testy na osobnym `STOLARNIA_DATA`.

## Otwarte wątki
Zobacz `docs/STAN_PRAC.md` (szuflady Amix Elite Box → SKU i schematy; pełna macierz Kronospan; PBR tekstury w 3D; narzędzia MCP katalogu).
