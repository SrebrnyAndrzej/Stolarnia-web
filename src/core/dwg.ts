import { execFile } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

// Obsługa DWG przez konwersję do DXF zewnętrznym programem (osobny proces — licencja konwertera
// nie przenosi się na kod aplikacji). Obsługiwane:
//  • LibreDWG `dwg2dxf` (GPL-3, open source)          — STOLARNIA_DWG2DXF=ścieżka do dwg2dxf(.exe)
//  • ODA File Converter (darmowy, licencja ODA)         — STOLARNIA_ODA=ścieżka do ODAFileConverter(.exe)
// Bez konfiguracji szukamy obu programów w PATH / typowych katalogach.

const run = promisify(execFile);

export class BrakKonwerteraDwg extends Error {}

/** DWG zaczyna się od "AC10" + numer wersji (AC1015 = 2000 … AC1032 = 2018+). */
export function czyDwg(bufor: Buffer): boolean {
  return bufor.length > 6 && bufor.subarray(0, 4).toString("ascii") === "AC10";
}

export function wersjaDwg(bufor: Buffer): string {
  const kod = bufor.subarray(0, 6).toString("ascii");
  const mapa: Record<string, string> = {
    AC1012: "R13", AC1014: "R14", AC1015: "2000", AC1018: "2004", AC1021: "2007", AC1024: "2010", AC1027: "2013", AC1032: "2018+",
  };
  return mapa[kod] ?? kod;
}

function znajdz(): { typ: "libredwg" | "oda"; sciezka: string } | null {
  const env = process.env;
  if (env.STOLARNIA_DWG2DXF && existsSync(env.STOLARNIA_DWG2DXF)) return { typ: "libredwg", sciezka: env.STOLARNIA_DWG2DXF };
  if (env.STOLARNIA_ODA && existsSync(env.STOLARNIA_ODA)) return { typ: "oda", sciezka: env.STOLARNIA_ODA };
  const pf = [env.ProgramFiles, env["ProgramFiles(x86)"]].filter(Boolean) as string[];
  for (const baza of pf) {
    const oda = join(baza, "ODA");
    if (existsSync(oda)) {
      for (const d of readdirSync(oda)) {
        const exe = join(oda, d, "ODAFileConverter.exe");
        if (existsSync(exe)) return { typ: "oda", sciezka: exe };
      }
    }
  }
  for (const kat of (env.PATH ?? "").split(process.platform === "win32" ? ";" : ":")) {
    for (const nazwa of ["dwg2dxf.exe", "dwg2dxf"]) {
      const p = join(kat, nazwa);
      if (kat && existsSync(p)) return { typ: "libredwg", sciezka: p };
    }
    for (const nazwa of ["ODAFileConverter.exe", "ODAFileConverter"]) {
      const p = join(kat, nazwa);
      if (kat && existsSync(p)) return { typ: "oda", sciezka: p };
    }
  }
  return null;
}

export function konwerterDwg(): { typ: string; sciezka: string } | null {
  return znajdz();
}

/** Konwertuje DWG → DXF (ASCII). Rzuca BrakKonwerteraDwg, gdy żaden konwerter nie jest dostępny. */
export async function dwgNaDxf(bufor: Buffer): Promise<string> {
  const k = znajdz();
  if (!k) {
    throw new BrakKonwerteraDwg(
      `Plik DWG (${wersjaDwg(bufor)}) wymaga konwertera. Zainstaluj ODA File Converter lub LibreDWG (dwg2dxf) ` +
        `i ustaw STOLARNIA_ODA / STOLARNIA_DWG2DXF — albo zapisz rysunek jako DXF w programie CAD.`,
    );
  }
  const kat = mkdtempSync(join(tmpdir(), "stolarnia-dwg-"));
  const we = join(kat, "we");
  const wy = join(kat, "wy");
  try {
    for (const d of [we, wy]) mkdirSync(d);
    const plik = join(we, "rysunek.dwg");
    writeFileSync(plik, bufor);
    if (k.typ === "libredwg") {
      await run(k.sciezka, ["-y", "-o", join(wy, "rysunek.dxf"), plik], { timeout: 60_000 });
    } else {
      // ODAFileConverter "we" "wy" wersja typ rekurencja audyt [filtr]
      await run(k.sciezka, [we, wy, "ACAD2013", "DXF", "0", "1", "*.DWG"], { timeout: 120_000, windowsHide: true });
    }
    const dxf = readdirSync(wy).find((f) => f.toLowerCase().endsWith(".dxf"));
    if (!dxf) throw new Error("Konwerter nie utworzył pliku DXF.");
    return readFileSync(join(wy, dxf), "utf8");
  } finally {
    rmSync(kat, { recursive: true, force: true });
  }
}
