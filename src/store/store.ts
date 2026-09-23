import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { OKUCIA_STARTOWE } from "../core/catalog/hardware.js";
import { MATERIALY_STARTOWE } from "../core/catalog/materials.js";
import { USTAWIENIA_DOMYSLNE } from "../core/settings.js";
import type { Material, Okucie, Projekt, UstawieniaStolarni } from "../core/types.js";

export interface BazaDanych {
  wersja: number;
  ustawienia: UstawieniaStolarni;
  materialy: Material[];
  okucia: Okucie[];
  projekty: Projekt[];
}

/**
 * Prosty magazyn JSON (jeden plik, zapis atomowy). Wspólny dla serwera web i serwera MCP —
 * oba procesy czytają plik przy każdym odczycie, więc zmiany z Claude są widoczne w przeglądarce.
 * Ścieżka: STOLARNIA_DATA (katalog) lub ./data.
 */
export class Magazyn {
  readonly plik: string;

  constructor(katalog = process.env.STOLARNIA_DATA ?? join(process.cwd(), "data")) {
    this.plik = resolve(katalog, "stolarnia.json");
    if (!existsSync(this.plik)) this.zapisz(this.pusta());
  }

  private pusta(): BazaDanych {
    return {
      wersja: 1,
      ustawienia: structuredClone(USTAWIENIA_DOMYSLNE),
      materialy: structuredClone(MATERIALY_STARTOWE),
      okucia: structuredClone(OKUCIA_STARTOWE),
      projekty: [],
    };
  }

  odczytaj(): BazaDanych {
    const baza = JSON.parse(readFileSync(this.plik, "utf8")) as BazaDanych;
    // Uzupełnij nowe pozycje katalogowe, nie nadpisując cen edytowanych przez firmę.
    const idM = new Set(baza.materialy.map((m) => m.id));
    for (const m of MATERIALY_STARTOWE) if (!idM.has(m.id)) baza.materialy.push(structuredClone(m));
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
