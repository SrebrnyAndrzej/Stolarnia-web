import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { OKUCIA_STARTOWE } from "../core/catalog/hardware.js";
import { MATERIALY_STARTOWE } from "../core/catalog/materials.js";
import { USTAWIENIA_DOMYSLNE } from "../core/settings.js";
import type { CennikMaterialow, Material, Okucie, Projekt, UstawieniaStolarni } from "../core/types.js";

export interface BazaDanych {
  wersja: number;
  ustawienia: UstawieniaStolarni;
  materialy: Material[];
  cennikMaterialow?: CennikMaterialow;
  okucia: Okucie[];
  projekty: Projekt[];
}

export class KonfliktZapisu extends Error {}

interface Chmura {
  url: string;
  klucz: string;
}

/** Tryb chmurowy włącza się, gdy są ustawione SUPABASE_URL i SUPABASE_SECRET_KEY (np. na Vercelu). */
export function konfiguracjaChmury(env = process.env): Chmura | undefined {
  const url = env.SUPABASE_URL?.replace(/\/$/, "");
  const klucz = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  return url && klucz ? { url, klucz } : undefined;
}

const ID_DOKUMENTU = "glowna";

/**
 * Magazyn bazy aplikacji.
 * - Lokalnie: jeden plik JSON (zapis atomowy), wspólny dla serwera web i MCP. Ścieżka: STOLARNIA_DATA lub ./data.
 * - W chmurze (Vercel): dokument w tabeli Supabase `stolarnia_baza`. Serwer wywołuje `zaladuj()` na początku
 *   żądania i `utrwal()` przed odpowiedzią; operacje serwisu pozostają synchroniczne na kopii w pamięci.
 *   Zapis sprawdza wersję — równoległa zmiana z innej instancji daje KonfliktZapisu zamiast cichego nadpisania.
 */
export class Magazyn {
  readonly plik: string;
  private readonly chmura?: Chmura;
  private pamiec?: BazaDanych;
  private wersjaChmury = 0;
  private brudny = false;

  constructor(katalog = process.env.STOLARNIA_DATA ?? join(process.cwd(), "data"), chmura = konfiguracjaChmury()) {
    this.chmura = chmura;
    if (chmura) {
      this.plik = `${chmura.url}/rest/v1/stolarnia_baza`;
      return;
    }
    this.plik = resolve(katalog, "stolarnia.json");
    if (!existsSync(this.plik)) this.zapisz(this.pusta());
  }

  get wChmurze(): boolean {
    return !!this.chmura;
  }

  private async rest(metoda: string, zapytanie: string, body?: unknown): Promise<{ dane: BazaDanych; wersja: number }[]> {
    const c = this.chmura!;
    const r = await fetch(`${c.url}/rest/v1/stolarnia_baza${zapytanie}`, {
      method: metoda,
      headers: {
        apikey: c.klucz,
        ...(c.klucz.startsWith("eyJ") ? { Authorization: `Bearer ${c.klucz}` } : {}),
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) throw new Error(`Baza danych (Supabase) odpowiedziała ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return r.json();
  }

  /** Tryb chmurowy: pobiera aktualny dokument bazy (tworzy go przy pierwszym użyciu). Lokalnie nic nie robi. */
  async zaladuj(): Promise<void> {
    if (!this.chmura) return;
    const w = await this.rest("GET", `?id=eq.${ID_DOKUMENTU}&select=dane,wersja`);
    if (w[0]) {
      this.pamiec = w[0].dane;
      this.wersjaChmury = w[0].wersja;
    } else {
      const nowy = await this.rest("POST", "", { id: ID_DOKUMENTU, dane: this.pusta(), wersja: 1 });
      this.pamiec = nowy[0].dane;
      this.wersjaChmury = 1;
    }
    this.brudny = false;
  }

  /** Tryb chmurowy: zapisuje zmiany z tego żądania, jeśli dokument nie zmienił się w międzyczasie. */
  async utrwal(): Promise<void> {
    if (!this.chmura || !this.brudny || !this.pamiec) return;
    const w = await this.rest("PATCH", `?id=eq.${ID_DOKUMENTU}&wersja=eq.${this.wersjaChmury}`, {
      dane: this.pamiec,
      wersja: this.wersjaChmury + 1,
      zmieniono: new Date().toISOString(),
    });
    if (!w.length) throw new KonfliktZapisu("Dane zmieniły się w międzyczasie (inne okno lub Claude). Odśwież stronę i powtórz zmianę.");
    this.wersjaChmury += 1;
    this.brudny = false;
  }

  /** Zastępuje całą bazę (migracja danych lokalnych do chmury). */
  async zastap(baza: BazaDanych): Promise<void> {
    if (!this.chmura) return this.zapisz(baza);
    await this.zaladuj();
    this.pamiec = baza;
    this.brudny = true;
    await this.utrwal();
  }

  private pusta(): BazaDanych {
    return {
      wersja: 1,
      ustawienia: structuredClone(USTAWIENIA_DOMYSLNE),
      materialy: structuredClone(MATERIALY_STARTOWE),
      cennikMaterialow: {},
      okucia: structuredClone(OKUCIA_STARTOWE),
      projekty: [],
    };
  }

  odczytaj(): BazaDanych {
    let baza: BazaDanych;
    if (this.chmura) {
      if (!this.pamiec) throw new Error("Magazyn chmurowy nie został wczytany (brak zaladuj() przed operacją).");
      baza = structuredClone(this.pamiec);
    } else {
      baza = JSON.parse(readFileSync(this.plik, "utf8")) as BazaDanych;
    }
    // Uzupełnij nowe pozycje katalogowe, nie nadpisując cen edytowanych przez firmę.
    const idM = new Set(baza.materialy.map((m) => m.id));
    for (const m of MATERIALY_STARTOWE) if (!idM.has(m.id)) baza.materialy.push(structuredClone(m));
    if (!baza.cennikMaterialow || typeof baza.cennikMaterialow !== "object") baza.cennikMaterialow = {};
    const idO = new Set(baza.okucia.map((o) => o.id));
    for (const o of OKUCIA_STARTOWE) if (!idO.has(o.id)) baza.okucia.push(structuredClone(o));
    // Nowe sekcje i pola ustawień dostają wartości domyślne (bazy zapisane starszą wersją).
    const dom = structuredClone(USTAWIENIA_DOMYSLNE) as unknown as Record<string, Record<string, unknown>>;
    const zap = (baza.ustawienia ?? {}) as unknown as Record<string, Record<string, unknown>>;
    for (const k of Object.keys(dom)) dom[k] = { ...dom[k], ...(zap[k] ?? {}) };
    baza.ustawienia = dom as unknown as UstawieniaStolarni;
    return baza;
  }

  zapisz(baza: BazaDanych): void {
    if (this.chmura) {
      this.pamiec = structuredClone(baza);
      this.brudny = true;
      return;
    }
    mkdirSync(dirname(this.plik), { recursive: true });
    const tmp = `${this.plik}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(baza, null, 2), "utf8");
    renameSync(tmp, this.plik);
  }

  /** Odczyt–modyfikacja–zapis w jednym kroku. */
  zmien<T>(fn: (baza: BazaDanych) => T): T {
    const baza = this.odczytaj();
    const wynik = fn(baza);
    this.zapisz(baza);
    return wynik;
  }
}
