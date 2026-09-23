// Przenosi lokalną bazę (data/stolarnia.json) do bazy w chmurze (Supabase, tabela stolarnia_baza).
// Dopisuje brakujące projekty, materiały i okucia (po id) — niczego nie nadpisuje, można uruchamiać wielokrotnie.
//
// Użycie (klucz wklejasz sam, tylko w swoim terminalu):
//   $env:SUPABASE_URL="https://ybzriunkihgbriytinij.supabase.co"; $env:SUPABASE_SECRET_KEY="<klucz secret>"; npx tsx scripts/migracja-do-chmury.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { konfiguracjaChmury, Magazyn, type BazaDanych } from "../src/store/store.js";

const chmura = konfiguracjaChmury();
if (!chmura) {
  console.error("Ustaw SUPABASE_URL i SUPABASE_SECRET_KEY (klucz secret z Supabase → Project Settings → API Keys).");
  process.exit(1);
}
const plik = join(process.env.STOLARNIA_DATA ?? join(process.cwd(), "data"), "stolarnia.json");
const lokalna = JSON.parse(readFileSync(plik, "utf8")) as BazaDanych;

const m = new Magazyn(undefined, chmura);
await m.zaladuj();
const wynik = { projekty: 0, materialy: 0, okucia: 0 };
m.zmien((b) => {
  for (const [klucz, lista] of [["projekty", lokalna.projekty], ["materialy", lokalna.materialy], ["okucia", lokalna.okucia]] as const) {
    const cel = b[klucz] as { id: string }[];
    const ids = new Set(cel.map((x) => x.id));
    for (const x of lista as { id: string }[]) {
      if (ids.has(x.id)) continue;
      cel.push(structuredClone(x));
      wynik[klucz] += 1;
    }
  }
});
await m.utrwal();
await m.zaladuj();
const b = m.odczytaj();
console.log(`Dopisano: projekty ${wynik.projekty}, materiały ${wynik.materialy}, okucia ${wynik.okucia}.`);
console.log(`W chmurze: ${b.projekty.length} projektów (${b.projekty.map((p) => p.nazwa).join(", ")}), ${b.materialy.length} materiałów.`);
