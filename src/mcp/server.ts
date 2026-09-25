import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { BladUslugi, Stolarnia } from "../service.js";
import { STATUSY_PROJEKTU } from "../core/statusy.js";

const KATEGORIE = ["base", "wall", "tall", "corner", "appliance", "open"] as const;
const KONSTRUKCJE = [
  "shelves", "drawers", "cargo", "sink", "oven", "dishwasherFront", "blindCorner", "lCorner", "liftUp", "hood",
  "wallCorner", "refrigerator", "ovenTower", "ovenMicrowaveTower", "utility", "topBox", "openShelf", "filler",
] as const;
const WARIANTY = ["eco", "standard", "premium", "vip"] as const;
const TYPY_MATERIALU = ["plytaLaminowana", "mdf", "hdf", "sklejka", "front", "blatLaminowany", "blatKompaktowy", "blatKamienny", "obrzeze", "szklo", "inne"] as const;

const sciana = z.object({
  nazwa: z.string().optional(),
  dlugoscMM: z.number().positive().describe("Długość ściany w mm"),
  wysokoscMM: z.number().positive().optional().describe("Wysokość ściany w mm (domyślnie 2600)"),
});

const konfiguracja = z
  .object({
    liczbaPolek: z.number().int().min(0).max(20).optional(),
    typFrontu: z.enum(["drzwi", "szuflady", "uchylny", "brak", "panelAGD"]).optional(),
    liczbaDrzwi: z.number().int().min(0).max(4).optional(),
    liczbaSzuflad: z.number().int().min(0).max(8).optional(),
    liczbaCargo: z.number().int().min(0).optional(),
    plecy: z.boolean().optional(),
    blat: z.boolean().optional(),
    nogi: z.boolean().optional(),
    szufladySystemowe: z.boolean().optional().describe("true = system (Tandembox/Legrabox), false = skrzynki z płyty"),
    profilSzuflad: z.string().optional().describe("System szuflad tej szafki: amix-elite-standard, gtv-axis-pro-option1, gtv-modern-box-pro, blum-legrabox-m-wood, blum-merivobox-m-wood, blum-tandembox-antaro-m-wood"),
    wariantBokuSzuflady: z.string().optional().describe("Wysokość boku / wariant pleców, np. M, K, C (Blum) lub 84/116 (Amix)"),
    wysokoscSzufladyMM: z.number().positive().optional().describe("Podziałka szuflad [mm] — równe fronty. Z typFrontu 'drzwi' i liczbaSzuflad > 0: szuflady pod drzwiami (półka stała), domyślnie 360"),
    stronaDrzwiNaroznika: z.enum(["lewa", "prawa"]).optional().describe("Szafka narożna ślepa: strona drzwi (część ślepa po przeciwnej)"),
    szerokoscDrzwiNaroznikaMM: z.number().positive().optional().describe("Szafka narożna ślepa: szerokość drzwi [mm], domyślnie 450"),
    systemNarozny: z.enum(["lemans"]).optional().describe("System narożny w szafce ślepej: LeMans II (2 nerki)"),
  })
  .optional();

const wymiaryModulu = {
  nazwa: z.string().optional(),
  scianaId: z.string().optional().describe("Id ściany; domyślnie pierwsza ściana projektu"),
  pozycjaXMM: z.number().min(0).optional().describe("Odległość od lewego końca ściany; domyślnie za ostatnim modułem w rzędzie"),
  pozycjaYMM: z.number().min(0).optional().describe("Wysokość spodu korpusu nad podłogą; domyślnie nogi (100) lub 1400 dla wiszących"),
  szerokoscMM: z.number().positive().optional(),
  wysokoscMM: z.number().positive().optional(),
  glebokoscMM: z.number().positive().optional(),
  konfiguracja,
  materialKorpusuId: z.string().optional().describe("Nadpisanie materiału korpusu tylko dla tego modułu"),
  materialFrontuId: z.string().optional(),
  uwagi: z.string().optional(),
};

function ok(dane: unknown) {
  return { content: [{ type: "text" as const, text: typeof dane === "string" ? dane : JSON.stringify(dane, null, 2) }] };
}

function bezpiecznie<A>(fn: (a: A) => unknown) {
  return async (a: A) => {
    try {
      return ok(await fn(a));
    } catch (e) {
      const msg = e instanceof BladUslugi ? e.message : `Błąd wewnętrzny: ${(e as Error).message}`;
      return { content: [{ type: "text" as const, text: msg }], isError: true };
    }
  };
}

const zl = (v: number) => `${v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;

export function utworzSerwerMcp(s = new Stolarnia()): McpServer {
  const server = new McpServer(
    { name: "stolarnia", version: "0.1.0" },
    {
      instructions:
        "Serwer Stolarni: projektowanie zabudów meblowych (kuchnie, szafy), wycena w 4 wariantach (Eco/Standard/Premium/VIP) " +
        "i przygotowanie produkcji (formatki, okleinowanie ABS, rozkrój płyt). Wymiary zawsze w milimetrach, ceny w PLN netto. " +
        "Typowy przebieg: utworz_projekt → katalog_modulow → wypelnij_sciane / dodaj_modul → waliduj_projekt → wycen_projekt → lista_formatek / rozkroj_plyt. " +
        "Szafki wiszące mają spód na wysokości 1400 mm, dolne stoją na nogach 100 mm. Projekty są widoczne w aplikacji web.",
    },
  );

  // ---------- Katalogi ----------

  server.registerTool(
    "katalog_modulow",
    {
      title: "Katalog modułów",
      description: "Lista standardowych modułów kuchennych (56 pozycji) z wymiarami. Użyj id jako katalogId w dodaj_modul / wypelnij_sciane.",
      inputSchema: { kategoria: z.enum(KATEGORIE).optional(), szukaj: z.string().optional().describe("np. 'zlew', 'szuflad', '600'") },
      annotations: { readOnlyHint: true },
    },
    bezpiecznie((a) =>
      s.katalogModulow(a).map((m) => ({ id: m.id, nazwa: m.name, kategoria: m.category, konstrukcja: m.construction, wymiary: `${m.widthMM}×${m.heightMM}×${m.depthMM}`, spodMM: m.bottomOffsetMM })),
    ),
  );

  server.registerTool(
    "lista_materialow",
    {
      title: "Baza materiałów",
      description: "Płyty (EGGER, Kronospan), fronty, HDF i blaty z cenami netto (referencyjna i własna z cennika, jeśli ustawiona). Id materiału podajesz przy projekcie/pomieszczeniu/module.",
      inputSchema: { typ: z.enum(TYPY_MATERIALU).optional(), szukaj: z.string().optional().describe("kod, dekor lub producent, np. 'W1100', 'dąb'") },
      annotations: { readOnlyHint: true },
    },
    bezpiecznie((a) => {
      const cennik = s.cennikMaterialow();
      return s.materialy({ ...a, tylkoAktywne: true }).map((m) => ({
        id: m.id,
        nazwa: m.nazwa,
        producent: m.producent,
        typ: m.typ,
        grupa: m.grupaDekoru,
        gruboscMM: m.gruboscMM,
        cenaNetto: m.cenaNetto,
        cenaWlasnaNetto: cennik[m.id]?.cenaNetto ?? null,
        jednostka: m.jednostka,
        kolor: m.kolorHEX,
      }));
    }),
  );

  server.registerTool(
    "ustaw_cene_materialu",
    {
      title: "Cena własna materiału",
      description: "Ustaw własną cenę zakupu netto materiału (ma pierwszeństwo w wycenach przed ceną referencyjną katalogu, bez rabatu katalogowego) albo usuń ją (cenaNetto: null).",
      inputSchema: { materialId: z.string(), cenaNetto: z.number().positive().nullable() },
    },
    bezpiecznie(({ materialId, cenaNetto }) => {
      if (cenaNetto === null) {
        s.usunCeneMaterialu(materialId);
        return { usunieto: materialId };
      }
      return s.zapiszCeneMaterialu(materialId, cenaNetto);
    }),
  );

  server.registerTool(
    "lista_okuc",
    {
      title: "Baza okuć",
      description: "Okucia i akcesoria (Blum, GTV, Häfele, Hettich…) z cenami netto i poziomem wyceny eco/standard/premium.",
      inputSchema: { typ: z.string().optional().describe("zawias, prowadnica, systemSzuflad, podnosnik, noga, uchwyt, …"), szukaj: z.string().optional() },
      annotations: { readOnlyHint: true },
    },
    bezpiecznie((a) => s.okucia(a).map((o) => ({ id: o.id, nazwa: o.nazwa, typ: o.typ, poziom: o.poziomWyceny, cenaNetto: o.cenaNetto, jednostka: o.jednostka, aktywne: o.aktywne }))),
  );

  server.registerTool(
    "zapisz_material",
    {
      title: "Dodaj/zmień materiał",
      description: "Aktualizuje cenę/rabat/aktywność istniejącego materiału (podaj id) albo dodaje nowy (nazwa + typ wymagane).",
      inputSchema: {
        id: z.string().optional(),
        nazwa: z.string().optional(),
        typ: z.enum(TYPY_MATERIALU).optional(),
        producent: z.string().optional(),
        kod: z.string().optional(),
        gruboscMM: z.number().optional(),
        szerokoscArkuszaMM: z.number().optional(),
        wysokoscArkuszaMM: z.number().optional(),
        jednostka: z.enum(["sztuka", "metrKwadratowy", "metrBiezacy"]).optional(),
        cenaNetto: z.number().min(0).optional(),
        rabatProcent: z.number().min(0).max(100).optional(),
        aktywny: z.boolean().optional(),
        kierunekDekoru: z.boolean().optional(),
        kolorHEX: z.string().optional(),
        notatki: z.string().optional(),
      },
    },
    bezpiecznie((a) => s.zapiszMaterial(a)),
  );

  server.registerTool(
    "zmien_okucie",
    {
      title: "Zmień okucie",
      description: "Aktualizuje cenę netto, rabat, poziom wyceny lub aktywność okucia.",
      inputSchema: {
        id: z.string(),
        cenaNetto: z.number().min(0).optional(),
        rabatProcent: z.number().min(0).max(100).optional(),
        poziomWyceny: z.enum(WARIANTY).optional(),
        aktywne: z.boolean().optional(),
      },
    },
    bezpiecznie((a) => s.zapiszOkucie(a)),
  );

  // ---------- Ustawienia ----------

  server.registerTool(
    "ustawienia_stolarni",
    {
      title: "Ustawienia stolarni",
      description: "Stawki (roboczogodzina, montaż, transport), marża, narzut, VAT, minimalne zlecenie, parametry konstrukcji i rozkroju.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    bezpiecznie(() => s.ustawienia()),
  );

  server.registerTool(
    "zmien_ustawienia",
    {
      title: "Zmień ustawienia stolarni",
      description: "Częściowa zmiana ustawień, np. { finanse: { marzaProcent: 30 } } lub { rozkroj: { rzazPilyMM: 4 } }.",
      inputSchema: {
        finanse: z.record(z.number()).optional(),
        konstrukcja: z.record(z.number()).optional(),
        rozkroj: z.record(z.union([z.number(), z.boolean()])).optional(),
        okleinowanie: z.record(z.number()).optional(),
        daneFirmy: z.record(z.string()).optional(),
      },
    },
    bezpiecznie((a) => s.zmienUstawienia(a as never)),
  );

  // ---------- Projekty ----------

  server.registerTool(
    "lista_projektow",
    { title: "Lista projektów", description: "Wszystkie projekty z liczbą modułów i statusem.", inputSchema: {}, annotations: { readOnlyHint: true } },
    bezpiecznie(() => s.projekty()),
  );

  server.registerTool(
    "utworz_projekt",
    {
      title: "Utwórz projekt",
      description: "Nowy projekt z pomieszczeniem i ścianami. Zwraca id projektu, pomieszczenia i ścian.",
      inputSchema: {
        nazwa: z.string(),
        klient: z.object({ nazwa: z.string().optional(), telefon: z.string().optional(), email: z.string().optional(), adres: z.string().optional() }).optional(),
        pomieszczenie: z.string().optional().describe("Nazwa pomieszczenia, domyślnie 'Kuchnia'"),
        sciany: z.array(sciana).optional().describe("Domyślnie jedna ściana 3600 mm"),
        materialKorpusuId: z.string().optional(),
        materialFrontuId: z.string().optional(),
        materialBlatuId: z.string().optional(),
        notatki: z.string().optional(),
      },
    },
    bezpiecznie((a) => {
      const p = s.utworzProjekt(a);
      return { id: p.id, nazwa: p.nazwa, pomieszczenia: p.pomieszczenia };
    }),
  );

  server.registerTool(
    "pokaz_projekt",
    {
      title: "Pokaż projekt",
      description: "Pełne dane projektu: klient, pomieszczenia, ściany, materiały i moduły z pozycjami.",
      inputSchema: { projektId: z.string() },
      annotations: { readOnlyHint: true },
    },
    bezpiecznie((a) => s.projekt(a.projektId)),
  );

  server.registerTool(
    "zmien_projekt",
    {
      title: "Zmień projekt",
      description: `Zmiana nazwy, danych klienta, statusu tematu (${STATUSY_PROJEKTU.join("/")}), terminu montażu lub notatek projektowych.`,
      inputSchema: {
        projektId: z.string(),
        nazwa: z.string().optional(),
        klient: z.object({ nazwa: z.string().optional(), telefon: z.string().optional(), email: z.string().optional(), adres: z.string().optional() }).optional(),
        status: z.enum(STATUSY_PROJEKTU).optional(),
        notatki: z.string().optional(),
        terminMontazu: z.string().nullable().optional().describe("RRRR-MM-DD, null usuwa termin"),
        agd: z
          .array(
            z.object({
              rodzaj: z.enum(["piekarnik", "mikrofala", "plyta", "lodowka", "zmywarka", "okap", "inne"]),
              model: z.string(),
              szerMM: z.number().optional(),
              wysMM: z.number().optional(),
              glMM: z.number().optional(),
              nisza: z.string().optional().describe("Wymagana nisza / otwór z karty producenta"),
              odstepTylMM: z.number().optional(),
              odstepBokMM: z.number().optional(),
              odstepGoraMM: z.number().optional(),
              glKorpusuMM: z.number().optional(),
              glOtwarteMM: z.number().optional(),
              uwagi: z.array(z.string()).optional(),
            }),
          )
          .optional()
          .describe("Pełna lista urządzeń AGD klienta (zastępuje poprzednią) — do szkiców i dopasowania nisz"),
      },
    },
    bezpiecznie(({ projektId, ...d }) => s.zmienProjekt(projektId, d)),
  );

  server.registerTool(
    "zapisz_szkic_pdf",
    {
      title: "Zapisz szkic wstępny dla klienta",
      description:
        "Rysunki szkieletowe do druku (A4 poziomo): ciąg dolny (rzut z numeracją + widok każdej ściany z pustymi korpusami) i/lub ciąg wysoki (słupki, nisze AGD, lodówka z odstępami, rzut z otwieraniem). AGD z pola projektu agd.",
      inputSchema: {
        projektId: z.string(),
        sciezka: z.string().describe("Ścieżka pliku .pdf do zapisania"),
        rodzaj: z.enum(["dolny", "wysoki", "oba"]).optional(),
        kolejnoscDolnych: z.array(z.string()).optional().describe("Litery ścian ciągu dolnego w kolejności, np. [D, A, B]"),
        scianyWysokie: z.array(z.string()).optional(),
      },
    },
    bezpiecznie(async (a) => {
      const rodzaj = a.rodzaj ?? "oba";
      const pdf = await s.szkicePdf(a.projektId, { dolny: rodzaj !== "wysoki", wysoki: rodzaj !== "dolny", kolejnoscDolnych: a.kolejnoscDolnych, scianyWysokie: a.scianyWysokie });
      writeFileSync(a.sciezka, pdf);
      return `Zapisano ${Math.round(pdf.length / 1024)} KB: ${a.sciezka}`;
    }),
  );

  server.registerTool(
    "notatka_projektu",
    {
      title: "Notatka robocza projektu",
      description: "Dodaj notatkę roboczą do tematu (np. „brakuje wkrętów”), odhacz ją jako załatwioną albo usuń.",
      inputSchema: {
        projektId: z.string(),
        tekst: z.string().optional().describe("Treść nowej notatki albo nowa treść istniejącej"),
        notatkaId: z.string().optional().describe("Id istniejącej notatki (zmiana / usunięcie)"),
        zalatwiona: z.boolean().optional(),
        usun: z.boolean().optional(),
      },
    },
    bezpiecznie(({ projektId, tekst, notatkaId, zalatwiona, usun }) => {
      if (!notatkaId) return s.dodajNotatke(projektId, tekst ?? "");
      if (usun) {
        s.usunNotatke(projektId, notatkaId);
        return { usunieto: notatkaId };
      }
      return s.zmienNotatke(projektId, notatkaId, { tekst, zalatwiona });
    }),
  );

  server.registerTool(
    "duplikuj_projekt",
    { title: "Duplikuj projekt", description: "Kopia projektu (np. jako wariant oferty).", inputSchema: { projektId: z.string(), nazwa: z.string().optional() } },
    bezpiecznie((a) => {
      const p = s.duplikujProjekt(a.projektId, a.nazwa);
      return { id: p.id, nazwa: p.nazwa };
    }),
  );

  server.registerTool(
    "usun_projekt",
    {
      title: "Usuń projekt",
      description: "Trwale usuwa projekt. Potwierdź z użytkownikiem przed użyciem.",
      inputSchema: { projektId: z.string() },
      annotations: { destructiveHint: true },
    },
    bezpiecznie((a) => {
      s.usunProjekt(a.projektId);
      return "Projekt usunięty.";
    }),
  );

  // ---------- Pomieszczenia / ściany ----------

  server.registerTool(
    "dodaj_pomieszczenie",
    {
      title: "Dodaj pomieszczenie",
      description: "Dodaje pomieszczenie (np. garderoba, łazienka) ze ścianami i materiałami.",
      inputSchema: { projektId: z.string(), nazwa: z.string(), sciany: z.array(sciana).optional(), materialKorpusuId: z.string().optional(), materialFrontuId: z.string().optional(), materialBlatuId: z.string().optional() },
    },
    bezpiecznie(({ projektId, ...d }) => s.dodajPomieszczenie(projektId, d)),
  );

  server.registerTool(
    "zmien_pomieszczenie",
    {
      title: "Zmień materiały pomieszczenia",
      description: "Ustawia nazwę i materiały korpusu, frontu i blatu dla wszystkich modułów w pomieszczeniu.",
      inputSchema: { projektId: z.string(), pomieszczenieId: z.string(), nazwa: z.string().optional(), materialKorpusuId: z.string().optional(), materialFrontuId: z.string().optional(), materialBlatuId: z.string().optional() },
    },
    bezpiecznie(({ projektId, pomieszczenieId, ...d }) => s.zmienPomieszczenie(projektId, pomieszczenieId, d)),
  );

  server.registerTool(
    "dodaj_sciane",
    { title: "Dodaj ścianę", description: "Dodaje ścianę do pomieszczenia.", inputSchema: { projektId: z.string(), pomieszczenieId: z.string(), ...sciana.shape } },
    bezpiecznie(({ projektId, pomieszczenieId, ...d }) => s.dodajSciane(projektId, pomieszczenieId, d)),
  );

  server.registerTool(
    "zmien_sciane",
    { title: "Zmień ścianę", description: "Zmienia nazwę lub wymiary ściany.", inputSchema: { projektId: z.string(), scianaId: z.string(), ...sciana.partial().shape } },
    bezpiecznie(({ projektId, scianaId, ...d }) => s.zmienSciane(projektId, scianaId, d)),
  );

  server.registerTool(
    "importuj_cad",
    {
      title: "Import rzutu z CAD (DXF / DWG)",
      description:
        "Tworzy pomieszczenie ze ścianami z pliku DXF lub DWG (linie i polilinie; DWG konwertowany ODA File Converter / LibreDWG). " +
        "Podaj ścieżkę do pliku (serwer lokalny) albo treść DXF. " +
        "Najpierw wywołaj z tylkoAnaliza=true, żeby zobaczyć warstwy i proponowane ściany, potem zaimportuj z wybraną warstwą.",
      inputSchema: {
        projektId: z.string().optional().describe("Wymagany przy imporcie (tylkoAnaliza=false)"),
        sciezka: z.string().optional().describe("Ścieżka do pliku .dxf lub .dwg na dysku serwera"),
        tresc: z.string().optional().describe("Treść pliku DXF (ASCII)"),
        warstwa: z.string().optional().describe("Warstwa ze ścianami, np. 'SCIANY'"),
        jednostka: z.enum(["mm", "cm", "m"]).optional().describe("Nadpisanie jednostek; domyślnie z $INSUNITS"),
        nazwa: z.string().optional(),
        wysokoscMM: z.number().positive().optional(),
        tylkoAnaliza: z.boolean().optional(),
      },
    },
    bezpiecznie(async (a) => {
      const tresc = a.tresc ?? (a.sciezka ? await s.trescCad(readFileSync(a.sciezka)) : undefined);
      if (!tresc) throw new BladUslugi("Podaj sciezka albo tresc pliku DXF.");
      if (a.tylkoAnaliza) {
        const r = s.analizaDxf(tresc, a);
        return { jednostka: r.jednostka, warstwy: r.warstwy, proponowaneSciany: r.sciany, liczbaLancuchow: r.liczbaLancuchow };
      }
      if (!a.projektId) throw new BladUslugi("Import wymaga projektId.");
      return s.importujDxf(a.projektId, tresc, a);
    }),
  );

  // ---------- Moduły ----------

  server.registerTool(
    "dodaj_modul",
    {
      title: "Dodaj moduł",
      description:
        "Dodaje szafkę z katalogu (katalogId) lub niestandardową (podaj kategoria, konstrukcja i wymiary). Pozycja domyślnie za ostatnim modułem w rzędzie (dolnym lub wiszącym).",
      inputSchema: {
        projektId: z.string(),
        katalogId: z.string().optional(),
        kategoria: z.enum(KATEGORIE).optional(),
        konstrukcja: z.enum(KONSTRUKCJE).optional(),
        ...wymiaryModulu,
      },
    },
    bezpiecznie(({ projektId, ...d }) => s.dodajModul(projektId, d)),
  );

  server.registerTool(
    "wypelnij_sciane",
    {
      title: "Wypełnij ścianę szeregiem modułów",
      description: "Wstawia kolejno moduły katalogowe od lewej (lub od odXMM). Dolne i wiszące tworzą osobne rzędy — wywołaj dwa razy.",
      inputSchema: { projektId: z.string(), scianaId: z.string(), katalogIds: z.array(z.string()).min(1), odXMM: z.number().min(0).optional() },
    },
    bezpiecznie((a) => s.wypelnijSciane(a.projektId, a.scianaId, a.katalogIds, a.odXMM).map((m) => ({ id: m.id, nazwa: m.nazwa, x: m.pozycjaXMM, szerokosc: m.szerokoscMM }))),
  );

  server.registerTool(
    "wypelnij_luke",
    {
      title: "Wypełnij lukę",
      description: "Domyka lukę w rzędzie: < 150 mm blendą (panel z materiału frontu), większą — szafką z półkami dopasowaną na wymiar.",
      inputSchema: {
        projektId: z.string(),
        scianaId: z.string(),
        xMM: z.number().min(0).describe("Początek luki od lewego końca ściany"),
        szerokoscMM: z.number().positive(),
        wiszacy: z.boolean().optional().describe("true = rząd szafek wiszących"),
      },
    },
    bezpiecznie((a) => s.wypelnijLuke(a.projektId, a.scianaId, a.xMM, a.szerokoscMM, !!a.wiszacy)),
  );

  server.registerTool(
    "zmien_modul",
    {
      title: "Zmień moduł",
      description: "Zmiana wymiarów, pozycji, konfiguracji (półki, drzwi, szuflady, blat…) lub materiałów modułu.",
      inputSchema: { projektId: z.string(), modulId: z.string(), ...wymiaryModulu },
    },
    bezpiecznie(({ projektId, modulId, ...d }) => s.zmienModul(projektId, modulId, d)),
  );

  server.registerTool(
    "przelicznik_szuflad",
    {
      title: "Przelicznik dna i pleców szuflad",
      description: "Wymiary przycięcia dna i pleców szuflady dla systemów Amix Elite Box, GTV Axis Pro / Modern Box PRO i Blum LEGRABOX / MERIVOBOX / TANDEMBOX antaro, z kart producentów (strona PDF i status weryfikacji). Podaj LW albo szerokość korpusu, NL albo głębokość korpusu.",
      inputSchema: {
        LW: z.number().optional().describe("Światło korpusu [mm]"), szerokoscKorpusu: z.number().optional(), gruboscBoku: z.number().optional(),
        NL: z.number().optional().describe("Długość nominalna prowadnicy [mm]"), glebokoscKorpusu: z.number().optional(),
        wysokoscFrontu: z.number().optional(), wariant: z.string().optional().describe("Wysokość boku, np. N/M/K/C (Blum), 84/116 (Amix)"),
        sciankaTylna: z.enum(["drewniana", "stalowa"]).optional(), profilId: z.string().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    bezpiecznie((a) => s.przelicznikSzuflad(a)),
  );

  server.registerTool(
    "zamien_drzwi_na_szuflady",
    {
      title: "Zamień drzwi na szuflady",
      description:
        "Silnik konstrukcji: zamienia drzwi modułu (pojedyncze albo rząd skrzydeł) na N szuflad o równych frontach. Półki nastawne za frontem i cargo są usuwane; powstają skrzynki szuflad. Moduł przechodzi na konstrukcję z edytora (liczniki konfiguracji przestają działać do czasu przywrócenia).",
      inputSchema: { projektId: z.string(), modulId: z.string(), liczba: z.number().int().min(1).max(8), poleId: z.string().optional().describe("Pole frontu, gdy mebel ma kilka pól z drzwiami") },
    },
    bezpiecznie(({ projektId, modulId, liczba, poleId }) => s.polecenieKonstrukcji(projektId, modulId, { typ: "zamienDrzwiNaSzuflady", liczba, poleId })),
  );

  server.registerTool(
    "przywroc_konstrukcje_standardowa",
    {
      title: "Przywróć konstrukcję standardową",
      description: "Usuwa konstrukcję z edytora silnika — moduł wraca do budowy z konfiguracji (półki, drzwi, szuflady).",
      inputSchema: { projektId: z.string(), modulId: z.string() },
    },
    bezpiecznie((a) => s.przywrocKonstrukcjeStandardowa(a.projektId, a.modulId)),
  );

  server.registerTool(
    "duplikuj_modul",
    { title: "Duplikuj moduł", description: "Kopiuje moduł i stawia go na końcu rzędu.", inputSchema: { projektId: z.string(), modulId: z.string() } },
    bezpiecznie((a) => s.duplikujModul(a.projektId, a.modulId)),
  );

  server.registerTool(
    "usun_modul",
    { title: "Usuń moduł", description: "Usuwa moduł z projektu.", inputSchema: { projektId: z.string(), modulId: z.string() }, annotations: { destructiveHint: true } },
    bezpiecznie((a) => {
      s.usunModul(a.projektId, a.modulId);
      return "Moduł usunięty.";
    }),
  );

  // ---------- Analiza ----------

  server.registerTool(
    "waliduj_projekt",
    {
      title: "Waliduj projekt",
      description: "Sprawdza normy wymiarowe szafek, kolizje modułów i wyjście poza ścianę, oraz ostrzeżenia konstrukcyjne.",
      inputSchema: { projektId: z.string() },
      annotations: { readOnlyHint: true },
    },
    bezpiecznie((a) => {
      const an = s.analiza(a.projektId);
      const konstr = an.zbudowane.flatMap((z) => z.ostrzezenia.map((o) => ({ poziom: "ostrzezenie", modulId: z.modul.id, komunikat: `${z.modul.nazwa}: ${o}` })));
      const wszystko = [...an.walidacja, ...konstr];
      return wszystko.length ? wszystko : "Brak uwag — projekt zgodny z normami i bez kolizji.";
    }),
  );

  server.registerTool(
    "wycen_projekt",
    {
      title: "Wyceń projekt",
      description:
        "Wycena wariantowa Eco/Standard/Premium/VIP: płyty, fronty, blaty, okucia, robocizna, montaż, transport + zapas, narzut, marża, VAT. " +
        "szczegoly=true zwraca wszystkie pozycje kosztowe.",
      inputSchema: { projektId: z.string(), wariant: z.enum(WARIANTY).optional(), szczegoly: z.boolean().optional() },
      annotations: { readOnlyHint: true },
    },
    bezpiecznie((a) => {
      const w = s.wycena(a.projektId, a.wariant);
      if (a.szczegoly) return w;
      return {
        projekt: w.projekt,
        ilosci: {
          moduly: w.ilosci.liczbaModulow,
          zabudowaMB: w.ilosci.metryBiezaceZabudowy,
          plytyM2: w.ilosci.powierzchniaPlytM2,
          frontyM2: w.ilosci.powierzchniaFrontowM2,
          blatMB: w.ilosci.metryBiezaceBlatu,
          szuflady: w.ilosci.liczbaSzuflad,
          zawiasy: w.ilosci.liczbaZawiasow,
          godzinyProdukcji: w.ilosci.liczbaGodzinProdukcji,
          godzinyMontazu: w.ilosci.liczbaGodzinMontazu,
        },
        warianty: w.warianty.map((v) => ({
          wariant: v.nazwa,
          netto: zl(v.cenaNetto),
          brutto: zl(v.cenaBrutto),
          kosztBazowy: zl(v.kosztBazowyNetto),
          materialy: zl(v.kosztMaterialowNetto),
          bledyWyceny: v.pozycje.filter((p) => p.jestBledemWyceny).map((p) => `${p.nazwa}: ${p.uwagi}`),
        })),
        uwagi: w.uwagi.map((u) => u.komunikat),
      };
    }),
  );

  server.registerTool(
    "lista_formatek",
    {
      title: "Lista formatek",
      description: "Lista elementów do cięcia (etykieta, wymiary dł×szer×gr, materiał, obrzeża DA/DB/KA/KB). format='csv' zwraca CSV dla piły.",
      inputSchema: {
        projektId: z.string(),
        kategoria: z.enum(["korpus", "front", "plecy", "blat", "szuflady", "pozostale"]).optional(),
        format: z.enum(["json", "csv"]).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    bezpiecznie((a) => {
      if (a.format === "csv") return s.formatkiCSV(a.projektId);
      const f = s.analiza(a.projektId).formatki.filter((x) => !a.kategoria || x.kategoria === a.kategoria);
      return f.map((x) => ({ etykieta: x.etykieta, modul: x.nazwaModulu, element: x.kodElementu, wymiar: `${x.dlugoscMM}×${x.szerokoscMM}×${x.gruboscMM}`, material: x.materialOpis, obrzeza: x.obrzeza.join("/") }));
    }),
  );

  server.registerTool(
    "okleinowanie",
    {
      title: "Zapotrzebowanie na obrzeże",
      description: "Metry obrzeża ABS 0,8 i 2,0 mm wg materiału (netto i do zakupu z naddatkiem na krawędź i zapasem).",
      inputSchema: { projektId: z.string() },
      annotations: { readOnlyHint: true },
    },
    bezpiecznie((a) => s.analiza(a.projektId).obrzeza),
  );

  server.registerTool(
    "rozkroj_plyt",
    {
      title: "Rozkrój płyt",
      description: "Optymalizacja rozkroju na arkusze (algorytm półkowy z rzazem, marginesem i kierunkiem dekoru). szczegoly=true zwraca położenia formatek.",
      inputSchema: { projektId: z.string(), szczegoly: z.boolean().optional() },
      annotations: { readOnlyHint: true },
    },
    bezpiecznie((a) => {
      const r = s.analiza(a.projektId).rozkroj;
      return a.szczegoly ? r : { podsumowanie: r.podsumowanie, nierozmieszczone: r.nierozmieszczone };
    }),
  );

  server.registerTool(
    "dokumentacja_produkcyjna",
    {
      title: "Dokumentacja produkcyjna",
      description:
        "Status gotowości produkcyjnej, diagnostyka (braki danych okuć, reguły niezatwierdzone, kolizje) i zestawienie części z liczbą operacji. " +
        "czescId zwraca pełną listę operacji (wiercenia, rowki) jednej części w jej układzie lokalnym.",
      inputSchema: { projektId: z.string(), czescId: z.string().optional() },
      annotations: { readOnlyHint: true },
    },
    bezpiecznie((a) => {
      const d = s.dokumentacja(a.projektId);
      if (a.czescId) {
        const c = d.czesci.find((x) => x.id === a.czescId || x.etykieta === a.czescId);
        if (!c) throw new BladUslugi(`Nie ma części "${a.czescId}".`);
        return c;
      }
      return {
        rewizja: d.rewizja,
        gotowaDoProdukcji: d.gotowaDoProdukcji,
        podsumowanie: d.podsumowanie,
        pozycjeProdukcyjne: d.pozycjeProdukcyjne.length,
        diagnostyka: d.diagnostyka.map((x) => `[${x.poziom}] ${x.opis}`),
        czesci: d.czesci.map((c) => ({ id: c.id, etykieta: c.etykieta, element: c.kodElementu, status: c.status, operacje: c.operacje.length, bezWiercen: c.bezWiercen })),
      };
    }),
  );

  server.registerTool(
    "zapisz_dokumentacje_pdf",
    {
      title: "Zapisz pakiet PDF",
      description: "Generuje pakiet PDF całej kuchni (rzut, elewacje, indeks, karta każdego mebla, rysunek i tabela wierceń każdej części) i zapisuje go pod wskazaną ścieżką na serwerze.",
      inputSchema: { projektId: z.string(), sciezka: z.string().describe("Ścieżka pliku .pdf do zapisania") },
    },
    bezpiecznie(async (a) => {
      const pdf = await s.dokumentacjaPdf(a.projektId);
      writeFileSync(a.sciezka, pdf);
      return `Zapisano ${Math.round(pdf.length / 1024)} KB: ${a.sciezka}`;
    }),
  );

  // ---------- Zasoby ----------

  server.registerResource(
    "katalog-modulow",
    "stolarnia://katalog/moduly",
    { title: "Katalog modułów kuchennych", mimeType: "application/json" },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(s.katalogModulow(), null, 2) }] }),
  );

  server.registerResource(
    "projekt",
    new ResourceTemplate("stolarnia://projekt/{projektId}", {
      list: async () => ({ resources: s.projekty().map((p) => ({ uri: `stolarnia://projekt/${p.id}`, name: p.nazwa, mimeType: "application/json" })) }),
    }),
    { title: "Projekt stolarski", mimeType: "application/json" },
    async (uri, { projektId }) => ({ contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(s.projekt(String(projektId)), null, 2) }] }),
  );

  // ---------- Prompty ----------

  server.registerPrompt(
    "zaprojektuj_kuchnie",
    {
      title: "Zaprojektuj kuchnię",
      description: "Prowadzi przez projekt kuchni: wymiary ścian → dobór modułów → walidacja → wycena.",
      argsSchema: { opis: z.string().describe("Opis pomieszczenia i oczekiwań klienta, np. 'kuchnia w L 3,2 m × 2,4 m, zlew pod oknem'") },
    },
    ({ opis }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Zaprojektuj zabudowę kuchenną: ${opis}\n\n` +
              "1. Utwórz projekt (utworz_projekt) ze ścianami o podanych wymiarach.\n" +
              "2. Przejrzyj katalog_modulow i dobierz dolny rząd (zlew, zmywarka 600/450, piekarnik, szuflady, cargo) oraz rząd wiszący (okap nad płytą). Suma szerokości ≤ długość ściany; resztę uzupełnij modułem niestandardowym lub blendą.\n" +
              "3. Wstaw moduły wypelnij_sciane (osobno dolne i wiszące), potem waliduj_projekt i popraw kolizje.\n" +
              "4. Wyceń (wycen_projekt) i przedstaw porównanie wariantów Eco/Standard/Premium/VIP w tabeli.\n" +
              "5. Podaj podsumowanie produkcji: liczba arkuszy z rozkroj_plyt i metry obrzeża z okleinowanie.",
          },
        },
      ],
    }),
  );

  return server;
}
