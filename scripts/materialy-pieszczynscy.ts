// Materiały kuchni Pieszczyńskich: zabudowa niska — Kronospan Dąb Artisan 5307 LN (korpus + fronty),
// słupki — korpus Kronospan K521 Smoke Green, fronty Egger U604 ST9 (najbliższy odcień K521, ΔE ≈ 3,3
// wg średniego koloru zdjęć katalogowych). Ceny: puste (za arkusz) — do wpisania w Wycena → „Płyty w projekcie”.
// `npx tsx scripts/materialy-pieszczynscy.ts [projektId]` (serwer musi działać).

const API = process.env.API ?? "http://localhost:3210/api";
const projektId = process.argv[2] ?? "a4b0b291";

async function req<T>(metoda: string, sciezka: string, body?: unknown): Promise<T> {
  const r = await fetch(API + sciezka, { method: metoda, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json();
  if (!r.ok) throw new Error(`${metoda} ${sciezka}: ${d.blad ?? r.status}`);
  return d as T;
}
type M = { id: string; nazwa: string; cenaNetto: number };

// Z katalogu dekorów (nie nadpisuje istniejących cen przy ponownym uruchomieniu)
const smoke = await req<M>("POST", `/dekory/${encodeURIComponent("Kronospan:K521")}/material`, { gruboscMM: 18, wysokoscArkuszaMM: 2800, szerokoscArkuszaMM: 2070, struktura: "SU" });
const u604 = await req<M>("POST", `/dekory/${encodeURIComponent("Egger:U604 ST9")}/material`, { artykul: "1620450" });

// Dąb Artisan 5307 LN — brak w katalogu 644 dekorów; źródło: kronosfera.pl (dekory Kronospan PL)
const istniejace = await req<(M & { kod: string })[]>("GET", "/materialy");
const artisan =
  istniejace.find((m) => m.kod === "KRONOSPAN-5307-LN") ??
  (await req<M>("POST", "/materialy", {
    kod: "KRONOSPAN-5307-LN",
    nazwa: "5307 Dąb Artisan · LN · 18 mm",
    producent: "Kronospan",
    typ: "plytaLaminowana",
    dekor: "Dąb Artisan",
    grupaDekoru: "Drewno",
    struktura: "LN",
    gruboscMM: 18,
    wysokoscArkuszaMM: 2800,
    szerokoscArkuszaMM: 2070,
    jednostka: "sztuka",
    cenaNetto: 0,
    kierunekDekoru: true,
    kolorHEX: "#b48a5c",
    notatki: "Płyta wiórowa laminowana Dąb Artisan 5307 LN (Kronospan, wg kronosfera.pl). Format 2800×2070 i grubość 18 do potwierdzenia u dostawcy. Brak ceny zakupu — wpisz cenę arkusza. Kolor HEX poglądowy.",
  }));

// Ceny za arkusz (tylko jednostka — cena pozostaje do wpisania przez użytkownika)
for (const m of [smoke, u604]) if (!(m.cenaNetto > 0)) await req("PUT", `/materialy/${m.id}`, { jednostka: "sztuka" });

// Projekt: pomieszczenie = Dąb Artisan (zabudowa niska), słupki = Smoke Green / U604
const p = await req<{ pomieszczenia: { id: string }[]; moduly: { id: string; kategoria: string; nazwa: string }[] }>("GET", `/projekty/${projektId}`);
await req("PATCH", `/projekty/${projektId}/pomieszczenia/${p.pomieszczenia[0].id}`, { materialKorpusuId: artisan.id, materialFrontuId: artisan.id });
for (const m of p.moduly.filter((x) => x.kategoria === "tall"))
  await req("PATCH", `/projekty/${projektId}/moduly/${m.id}`, { materialKorpusuId: smoke.id, materialFrontuId: u604.id });

console.log(`Dąb Artisan: ${artisan.id}\nSmoke Green: ${smoke.id}\nU604: ${u604.id}\nSłupki: ${p.moduly.filter((x) => x.kategoria === "tall").map((x) => x.nazwa).join(", ")}`);
