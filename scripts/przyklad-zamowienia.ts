// Przykład listy zamówienia (ST-APP-003) na syntetycznym projekcie w katalogu tymczasowym — bez bazy produkcyjnej.
// Użycie: npx tsx scripts/przyklad-zamowienia.ts <katalog wyjściowy>
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Stolarnia } from "../src/service.js";
import { Magazyn } from "../src/store/store.js";

const wyj = process.argv[2] ?? ".";
const s = new Stolarnia(new Magazyn(mkdtempSync(join(tmpdir(), "przyklad-zamowienia-"))));
const p = s.utworzProjekt({ nazwa: "Kuchnia przykładowa", sciany: [{ dlugoscMM: 3600 }] });
for (const k of ["base-drawers-600", "base-drawers-600", "base-sink-800"]) {
  try {
    s.dodajModul(p.id, { katalogId: k });
  } catch {
    s.dodajModul(p.id, { katalogId: "base-drawers-600" });
  }
}
s.utworzWydanie(p.id, { notatka: "przykład" });
const z = s.zamowienie(p.id);
const plyta = z.pozycje.find((x) => x.rodzaj === "plyta")!;
const okucie = z.pozycje.find((x) => x.rodzaj === "okucie")!;
s.zmienStatusZamowienia(p.id, { klucz: plyta.klucz, stan: "zamowione", data: "2026-11-02", dostawca: "Hurtownia płyt (przykład)" });
s.zmienStatusZamowienia(p.id, { klucz: okucie.klucz, stan: "zamowione", data: "2026-11-02" });
s.zmienStatusZamowienia(p.id, { klucz: okucie.klucz, stan: "dostarczone", data: "2026-11-04" });
writeFileSync(join(wyj, "zamowienie-przyklad.csv"), s.zamowienieCSV(p.id));
writeFileSync(join(wyj, "zamowienie-przyklad.pdf"), await s.zamowieniePdf(p.id));
writeFileSync(join(wyj, "zamowienie-przyklad.json"), JSON.stringify(s.zamowienie(p.id), null, 2));
console.log(`pozycji: ${z.pozycje.length}, grup: ${z.grupy.length}`);
