# Stolarnia Online: MCP, skille, biblioteki, formaty maszynowe, konkurencja

*Stan na 2026-09-23. Oznaczenia: **[OK]** zweryfikowane w źródle w trakcie researchu, **[?]** niezweryfikowane (wiedza ogólna lub brak dostępu do źródła). Priorytety: P1 = od razu, P2 = w najbliższych iteracjach, P3 = opcjonalnie.*

## A. Serwery MCP do podłączenia

| # | Serwer | URL | Do czego | Prio | Dojrzałość |
|---|---|---|---|---|---|
| 1 | **Playwright MCP** (Microsoft) | github.com/microsoft/playwright-mcp | Testy E2E frontu (konfigurator, wycena, podgląd rozkroju) na drzewie dostępności, bez zrzutów ekranu | P1 | Wysoka, oficjalny [OK] |
| 2 | **Supabase MCP** (oficjalny) *lub* **Postgres MCP Pro** | github.com/supabase/mcp · github.com/crystaldba/postgres-mcp | Schemat, migracje, RLS, logi (Supabase); strojenie indeksów i EXPLAIN (dowolny Postgres) | P1 | Wysoka [OK]; connector Supabase jest już dostępny w tej sesji |
| 3 | **Fetch / Filesystem / Git** (serwery referencyjne) | github.com/modelcontextprotocol/servers | Pobieranie kart katalogowych, praca na plikach DXF/CSV/PDF | P1 | Referencyjne [OK]. Uwaga: Postgres, SQLite i Puppeteer są już **zarchiwizowane** |
| 4 | **SmartCut MCP** (hostowany, płatne API) | github.com/jgmedialtd/smartcut-api · smartcut.dev | Benchmark i fallback dla naszego `optimize_cutting`: gilotyna, słoje, rzaz, eksport **PTX (Homag), Biesse XML, Mayer**, DXF, CSV, etykiety | P2 (do porównania wyników i podejrzenia formatów) | Komercyjny, w oficjalnym rejestrze [OK] |
| 5 | **Firecrawl MCP** (oficjalny) | github.com/firecrawl/firecrawl-mcp-server | Scraping cenników dostawców (płyty EGGER/Kronospan w hurtowniach, okucia Blum/GTV/Hettich), aktualizacja bazy cen; darmowy tryb bez klucza z limitami | P2 | Wysoka, w katalogu Claude [OK] |
| 6 | **Fakturownia MCP / inFakt MCP / KSeF MCP** | pomoc.fakturownia.pl (zdalny MCP `https://<konto>.fakturownia.pl/mcp`) · infakt.pl (MCP) · glama.ai (KSeF) | Faktury i zaliczki z zaakceptowanej oferty, zgodność z KSeF | P2 | Fakturownia i inFakt: oficjalne [OK]; KSeF MCP: społecznościowy [?] |
| 7 | **Figma MCP** (oficjalny) | connector Figma | Design system UI konfiguratora, przekazanie projektu do kodu | P2 | Oficjalny [OK]; w tej sesji **wymaga autoryzacji** (connectory Figma i Canva nie są zalogowane) |
| 8 | **docgen-mcp-server** | github.com/cyanheads/docgen-mcp-server | HTML/MD → PDF, wiersze → XLSX, wypełnianie formularzy AcroForm (stdio + Streamable HTTP); do prototypów ofert. Produkcyjnie PDF generujemy w backendzie (sekcja C) | P3 | Społecznościowy [OK] |
| 9 | **mcp-cad** (ezdxf) | github.com/korals-ai/mcp-cad | Odczyt, pomiar i walidacja wygenerowanych przez nas plików DXF (R12–R2018), Streamable HTTP | P2 (QA eksportu CNC) | Społecznościowy [OK] |
| 10 | **Blender MCP** | github.com/ahujasid/blender-mcp (pakiet `mcp-for-blender`) | Fotorealistyczne rendery kuchni do ofert (eksport glTF/OBJ, render w Blenderze) | P3 | Bardzo popularny (~26 tys. gwiazdek) [OK] |
| 11 | **FreeCAD MCP** | github.com/neka-nat/freecad-mcp (najpopularniejszy [?]) | Walidacja brył i eksport STEP dla klientów z CAD | P3 | Społecznościowy, wiele forków [OK] |
| 12 | OpenSCAD / Onshape / Fusion 360 MCP | np. github.com/quellant/openscad-mcp, github.com/gpambrozio/onshape-mcp, github.com/faust-machines/fusion360-mcp-server | Mało przydatne (orientacja mechaniczna i druk 3D); Onshape ewentualnie do importu cutlist (por. aklinker1/cutlist) | P3 | Wyłącznie społecznościowe, brak oficjalnych [OK] |
| 13 | furniture-designer-mcp | github.com/LuisEnVilla/furniture-designer-mcp | Tylko jako inspiracja dla schematów narzędzi (specyfikacja, walidacja, rozkrój, BOM, raport 3D) | P3 | Wczesny etap (1 gwiazdka, Python, MIT) [OK] |

Dostawcy e-commerce (Blum, GTV, Hettich, hurtownie płyt): **nie znaleziono żadnego gotowego MCP** [OK, na podstawie wyszukiwania w oficjalnym rejestrze]. EGGER udostępnia API dostępności dla ok. 350 dekorów i ok. 20 tys. pozycji oraz paczki tekstur dekorów (po rejestracji w myEGGER) [OK]. Dostęp do API wymaga kontaktu z EGGER [?]. Blum eksportuje BXF (XML z okuciami i wierceniami) z Cabinet Configuratora, następcy DYNAPLAN [OK].

## B. Skille (Agent Skills)

Oficjalne repozytorium: **github.com/anthropics/skills** [OK]. Zawiera 19 katalogów, w tym pdf, xlsx, docx, pptx, mcp-builder, webapp-testing, frontend-design, web-artifacts-builder, canvas-design, skill-creator i theme-factory.

| Skill | Źródło | Do czego | Prio |
|---|---|---|---|
| **mcp-builder** | anthropics/skills | Projektowanie i ewaluacja naszego serwera MCP (TS SDK): nazewnictwo narzędzi, schematy, testy ewaluacyjne | P1 |
| **webapp-testing** | anthropics/skills | Testy Playwright aplikacji React/Vite: zrzuty, logi konsoli | P1 |
| **frontend-design** | anthropics/skills | Dopracowany UI konfiguratora zamiast generycznego wyglądu | P1 |
| **pdf** | anthropics/skills (dostępny też w tej sesji) | Oferty PDF, rysunki formatek, łączenie z kartami katalogowymi | P1 |
| **xlsx** | anthropics/skills (dostępny w sesji) | Import i eksport list formatek oraz cenników CSV/XLSX, audyt importów z hurtowni | P1 |
| **skill-creator** | anthropics/skills (dostępny w sesji) | Własne skille domenowe, np. „stolarnia-domena” (reguły konstrukcji korpusów, okleinowanie, systemy 32 mm, katalog Blum) oraz „eksport-pila” (PTX/CSV) | P1 |
| docx | anthropics/skills | Umowy i protokoły odbioru w formacie Word | P2 |
| web-artifacts-builder, canvas-design | anthropics/skills | Szybkie prototypy widoków i grafik marketingowych | P3 |
| threejs-skills | github.com/cloudai-x/threejs-skills · github.com/OpenAEC-Foundation/Three.js-Claude-Skill-Package (24 skille: R3F, Drei, IFC) | Wiedza o three.js i react-three-fiber dla podglądu 3D mebli | P2 [OK, jakość niesprawdzona] |
| Supabase agent skills | `npx skills add supabase/agent-skills` | Bezpieczeństwo, RLS, migracje (zalecane w instrukcjach serwera Supabase) | P2 [OK] |

Gotowych skilli meblarskich lub stolarskich **nie znaleziono** [OK]. To nisza, którą warto wypełnić własnym skillem.

## C. Kluczowe biblioteki open-source

| Obszar | Biblioteka | npm / URL | Licencja | Uwagi |
|---|---|---|---|---|
| Rozkrój (gilotyna) | **guillotine-packer** | npm `guillotine-packer`, github.com/tyschroed/guillotine-packer | MIT [OK] | TS, rzaz (kerf), rotacja, strategie sort/split/select. Mały projekt (36 gwiazdek): traktować jako punkt odniesienia lub baseline, a docelowo własny solver z portu Swift |
| Rozkrój (maxrects) | **maxrects-packer** | npm `maxrects-packer` | MIT [OK] | TS, wiele arkuszy. **Nie** daje cięć gilotynowych: tylko do CNC nestingu lub porównań. Ostatnie wydanie ok. 5 lat temu |
| Rozkrój (referencja) | aklinker1/cutlist | github.com/aklinker1/cutlist | [?] | TS, cutlist z Onshape. Przydatny jako wzór UI planów cięcia; pakiet npm jeszcze nieopublikowany |
| Nesting kształtów (CNC) | **Deepnest (deepnest-next)**, SVGnest | github.com/deepnest-next/deepnest, github.com/Jack000/SVGnest | MIT [OK] | Nesting nieprostokątny (algorytm genetyczny, NFP), np. dla frontów frezowanych. Port serwerowy TS: FrankSandqvist/svg-nest (eksperymentalny) |
| Solver (opcja) | highs-js | npm `highs` | MIT [?] | ILP/LP do dokładnej optymalizacji małych zleceń |
| DXF zapis | **@tarikjabiri/dxf** (dxfjs/writer) | npm `@tarikjabiri/dxf` | MIT [?] | Nowoczesny TS, warstwy. Rekomendowany. Starszy `dxf-writer` od ok. 4 lat bez wydań [OK] |
| DXF/SVG geometria | **maker.js** (Microsoft) | npm `makerjs` | Apache-2.0 [OK] | Parametryczne ścieżki 2D (wręby, wiercenia, łuki); eksport DXF, SVG, PDF. Nie importuje DXF |
| DXF odczyt | dxf-parser | npm `dxf-parser` | MIT [?] | Testy round-trip eksportu |
| PDF | **pdfmake** / **@react-pdf/renderer** | npm | MIT / MIT [?] | pdfmake: deklaratywne tabele, dobre dla ofert i list formatek (serwer). react-pdf: gdy chcemy komponentów React. Alternatywa: pdf-lib (edycja) |
| XLSX/CSV | **exceljs**, papaparse | npm | MIT / MIT [?] | SheetJS (Apache-2.0) nie jest już aktualizowany w rejestrze npm, instalacja z cdn.sheetjs.com [?] |
| 3D | **three.js** + **@react-three/fiber** + **@react-three/drei** | npm | MIT [?] | Podgląd korpusów, tekstury dekorów EGGER, eksport glTF/OBJ (np. do Blendera) |
| 2D edytor | **Konva** + react-konva (rekomendowane) lub fabric.js | npm | MIT / MIT [?] | Plan pomieszczenia, rzut kuchni, interaktywny podgląd rozkroju i edycja ręczna planu |
| Etykiety/kody | bwip-js | npm `bwip-js` | MIT [?] | Kody kreskowe i QR na etykietach formatek (Code128, DataMatrix) |
| Okleinowanie | brak dedykowanej biblioteki [OK] | n/d | n/d | Modelować w domenie: 4 krawędzie × (typ i grubość obrzeża), naddatek, korekta wymiaru „na gotowo” lub „przed oklejaniem” |

## D. Formaty eksportu maszynowego

| Prio | Format | Maszyny / programy | Uwagi |
|---|---|---|---|
| **P1** | **CSV lista formatek** (konfigurowalny mapper kolumn) | Uniwersalny import: OptiCut (separator `;`), CADmatic (import Excel/CSV), Maestro Ottimo (import Excel), Nowy Rozkrój, Optimik, hurtownie online (np. Formatec: długość, szerokość, ilość, opis, oklejanie L/P/G/D) | Najwięcej wartości za najmniej pracy. Szablony per odbiorca [OK] |
| **P1** | **DXF** (warstwy: kontur, wiercenia wg średnicy i głębokości, wręby) | Każdy CNC i CAM | Konwencja nazw warstw do ustalenia z klientem pilotażowym [?] |
| **P1** | **PDF** (plany rozkroju, etykiety, oferta) | n/d | Standard u konkurencji |
| **P2** | **PTX (Pattern Exchange)** | Homag/Holzma CADmatic, SCM Maestro Converter Cut, Magi-Cut | ASCII z rekordami (min. `PARTS_REQ` + `MATERIALS`); obsługuje zarówno listę części, jak i gotowe wzory cięcia. Najbardziej „branżowy” standard dla pił [OK] |
| **P2** | **BXF** (Blum XML) | Import od Blum Cabinet Configurator | Import okuć i wierceń z konfiguratora Blum [OK] |
| **P3** | **MPR/MPRX (woodWOP)** | Homag/Weeke CNC | Specyfikacja częściowo publiczna (opis formatu MPR, wersja 5+). Wymaga walidacji na maszynie [OK/?] |
| **P3** | **CIX/BPP (Biesse)**, Biesse Selco XML, SCM Maestro (XXL) | Biesse / SCM CNC i piły | Tylko na żądanie klienta; niewiele dokumentacji publicznej [?] |
| P3 | Giben `.AC`, Mayer | Giben G57, piły Mayer | Niszowe (SmartCut eksportuje format Mayer) [OK] |

## E. Lista must-have (Pro100, KD Max, Nowy Rozkrój, Mega Rozkrój, Flatma, Mozaik, CutList Optimizer, Blum)

1. **Szybki projekt 3D z biblioteki modułów** (korpusy parametryczne, szafy, kuchnie) z podglądem na żywo. Pro100 i KD Max deklarują projekt z wyceną w ok. 15 minut.
2. **Automatyczna wycena**: materiał, okucia, obrzeże i robocizna. Warianty wyceny za sztukę i za metr bieżący (KD Max), osobne ceny frontów, marża i rabat.
3. **Lista formatek i BOM, aktualizowane automatycznie** przy każdej zmianie projektu.
4. **Optymalizator rozkroju**: rzaz, słoje (grain) i blokada obrotu, obrzynanie arkusza, **magazyn resztek**, kilka kryteriów optymalizacji (Nowy Rozkrój ma 5), raport zużycia płyty i obrzeża.
5. **Okleinowanie per krawędź** (typ i grubość) z korektą wymiaru, zestawienie metrów bieżących.
6. **Integracja z piłą i CNC**: jeden klik do CSV, PTX lub DXF. Mega Rozkrój obsługuje Felder, Homag, SCM, Schelling, Biesse, Giben i Altendorf; KD Max eksportuje do Optimika.
7. **Okucia z katalogów** (Blum, GTV, Hettich) z automatycznymi wierceniami (system 32 mm) i ew. import BXF.
8. **Etykiety formatek** z kodem kreskowym lub QR (Mozaik: auto-etykiety na CNC).
9. **Dokumentacja**: rysunki techniczne, rysunki montażowe, oferta PDF z wizualizacją, zamówienie do hurtowni.
10. **Import i eksport CSV/Excel** list formatek (CutList Optimizer, Flatma).
11. Biblioteki dekorów (tekstury EGGER i Kronospan), eksport OBJ do renderu.
12. Nice-to-have: ponowne cięcie uszkodzonej formatki na hali (Mozaik), wycena online dla klienta końcowego, fakturowanie i KSeF.

*Polboard/Kompozyt, Cabinet Vision, SketchList, imos i Woodwork for Inventor: szczegółów nie weryfikowano [?]. Zakres funkcji jest zbliżony do powyższego; imos i Cabinet Vision dodatkowo oferują pełne CAM i ERP.*

## F. Rekomendowane kolejne kroki

1. **Tydzień 1:** podłączyć Playwright MCP i Supabase (lub Postgres) MCP; zainstalować skille mcp-builder, webapp-testing i frontend-design. Przepuścić nasz serwer MCP przez checklistę i ewaluacje z mcp-builder.
2. **Solver rozkroju:** port z Swift jako główny. Benchmark na 10 realnych zleceniach przeciw guillotine-packer (baseline) i SmartCut (jakość). Metryki: % odpadu, liczba arkuszy, czas.
3. **Eksport P1:** konfigurowalny mapper CSV (szablony: OptiCut, CADmatic, Formatec/hurtownia, Nowy Rozkrój) oraz DXF przez @tarikjabiri/dxf lub maker.js z walidacją w mcp-cad (ezdxf) lub dxf-parser.
4. **Oferta PDF:** pdfmake po stronie serwera, narzędzie MCP `generate_offer_pdf`; etykiety z bwip-js.
5. **Cennik:** tabela cen z datą ważności i źródłem. Firecrawl tylko do półautomatycznej aktualizacji z akceptacją człowieka, z poszanowaniem regulaminów sklepów. Zapytać EGGER o API i Blum o BXF.
6. **Własny skill domenowy** (skill-creator): reguły konstrukcyjne, systemy wierceń, słownik PL (formatka, obrzeże, wieniec, trawers).
7. **P2:** PTX dla Homag/SCM (wymaga pliku referencyjnego od klienta z piłą), import BXF, integracja Fakturownia lub inFakt.
8. **Autoryzacja:** connectory Figma i Canva w tej sesji wymagają zalogowania (ustawienia connectorów na claude.ai lub `/mcp` w sesji interaktywnej). Do tego czasu są niedostępne.

**Źródła (wybrane):** registry.modelcontextprotocol.io (wyszukiwania: cad, furniture, cut), github.com/modelcontextprotocol/servers, github.com/anthropics/skills, github.com/microsoft/playwright-mcp, github.com/supabase/mcp, github.com/crystaldba/postgres-mcp, github.com/firecrawl/firecrawl-mcp-server, github.com/jgmedialtd/smartcut-api, github.com/korals-ai/mcp-cad, github.com/ahujasid/blender-mcp, github.com/neka-nat/freecad-mcp, pomoc.fakturownia.pl, infakt.pl/blog, github.com/tyschroed/guillotine-packer, github.com/soimy/maxrects-packer, github.com/deepnest-next/deepnest, maker.js.org, npmjs.com/package/@tarikjabiri/dxf, magi-cut.co.uk (PTX), wtp.hoechsmann.com (Maestro/CADmatic), wooddesigner.org (OptiCut CSV), homag.com (woodWOP), blum.com (BXF), egger.com, kdmax.pl, viasoft.pl (PRO100), megarozkroj.pl, flatma.com, formatec.pl, mozaiksoftware.com, cutlistoptimizer.com.
