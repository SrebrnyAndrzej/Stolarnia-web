// Generuje próbny pakiet PDF: `npx tsx scripts/pdf-probny.ts [projektId] [plik.pdf]`
// i wypisuje liczbę stron A4 na każdą szafkę (cel: 1 strona na szafkę).
import { writeFileSync } from "node:fs";
import { Stolarnia } from "../src/service.js";

const s = new Stolarnia();
const id = process.argv[2] ?? s.projekty()[0]?.id;
if (!id) throw new Error("Brak projektów w ./data");
const plik = process.argv[3] ?? `dokumentacja-${id}.pdf`;
const pdf = await s.dokumentacjaPdf(id);
writeFileSync(plik, pdf);
const d = s.dokumentacja(id);
const strony = (b: Buffer) => (b.toString("latin1").match(/\/Type \/Page[^s]/g) ?? []).length;
console.log(`${plik}: ${Math.round(pdf.length / 1024)} KB, stron ${strony(pdf)}, części ${d.czesci.length}, operacji ${d.podsumowanie.operacje}`);
for (const m of s.projekt(id).moduly) {
  const n = strony(await s.dokumentacjaPdf(id, { moduly: [m.id] }));
  console.log(`${n === 1 ? "  ok" : "  !!"} ${n} str. — ${m.nazwa}`);
}
