// Stół do gier bitewnych z szafkami pod spodem — generator projektu (wyspa na dwóch wirtualnych liniach montażowych).
// Użycie: npx tsx scripts/stol-do-gier.ts <katalog-magazynu> <plik-wyjściowy.json>
// Blat 1800 × 1200 (180 × 120 cm, standard gier bitewnych) na wysokości 900 mm; pod spodem 2 × 3 szafki plecami do siebie.
import { writeFileSync } from "node:fs";
import { Stolarnia } from "../src/service.js";
import { Magazyn } from "../src/store/store.js";

const [katalog, wyjscie] = process.argv.slice(2);
const s = new Stolarnia(new Magazyn(katalog));

const BLAT = { dl: 1800, gl: 1200 };
const NOGI = 100;
const WYS_STOLU = 900;
const GR_BLATU = 38;
const H = WYS_STOLU - NOGI - GR_BLATU; // 762 — korpus
const D = 550;
const W = 590;
const RZAD = 3 * W; // 1770
const NAD_FRONTEM = 30; // wysunięcie blatu przed fronty (miejsce na dłonie, uchwyty chowają się pod blatem)
const NA_KONCACH = (BLAT.dl - RZAD) / 2; // 15

const KORPUS = "egger-u961-st7"; // Graphite Grey
const FRONT = "egger-h1180-st37"; // Natural Halifax Oak
const BLAT_MAT = "blat-lam-38";

const NOTATKI =
  "Stół do gier bitewnych 180×120 cm, wysokość 90 cm (gra na stojąco). Blat laminowany 38 mm jednym kawałkiem 1800×1200 pod matę do gier; " +
  "wysunięcie 30 mm poza fronty, 15 mm na końcach. Pod spodem 2×3 szafki 590×762×550 plecami do siebie: płytkie szuflady na figurki (Amix Elite), " +
  "szafki z półkami na tereny, 3 głębsze szuflady na podręczniki i maty. Szafki skręcone ze sobą i z blatem od spodu; nogi regulowane 100 mm.";
// Pomieszczenie: dwie wirtualne linie na tej samej osi, skierowane przeciwnie → dwa rzędy plecami do siebie.
const p = s.utworzProjekt({
  nazwa: "Stół do gier bitewnych 180×120 z szafkami",
  pomieszczenie: "Stół (wyspa)",
  sciany: [
    { nazwa: "Strona A", dlugoscMM: RZAD, wysokoscMM: 1000, x1: 0, y1: 0, x2: RZAD, y2: 0, wirtualna: true },
    { nazwa: "Strona B", dlugoscMM: RZAD, wysokoscMM: 1000, x1: RZAD, y1: 0, x2: 0, y2: 0, wirtualna: true },
  ],
  materialKorpusuId: KORPUS,
  materialFrontuId: FRONT,
  materialBlatuId: BLAT_MAT,
  notatki: NOTATKI,
});
const pom = p.pomieszczenia[0];
const [A, B] = pom.sciany;

const baza = { kategoria: "base" as const, pozycjaYMM: NOGI, szerokoscMM: W, wysokoscMM: H, glebokoscMM: D, materialKorpusuId: KORPUS, materialFrontuId: FRONT };
const szuflady = (n: number) => ({ typFrontu: "szuflady" as const, liczbaDrzwi: 0, liczbaSzuflad: n, liczbaPolek: 0, plecy: true, blat: false, nogi: true, szufladySystemowe: true, profilSzuflad: "amix-elite-standard" });
const drzwi = (polki: number) => ({ typFrontu: "drzwi" as const, liczbaDrzwi: 1, liczbaSzuflad: 0, liczbaPolek: polki, plecy: true, blat: false, nogi: true, szufladySystemowe: false });

const moduly = [
  // Strona A: figurki w płytkich szufladach po bokach, tereny za drzwiami w środku
  { sciana: A.id, x: 0, nazwa: "A1 · 4 szuflady — figurki", konstrukcja: "drawers" as const, konf: szuflady(4) },
  { sciana: A.id, x: W, nazwa: "A2 · drzwi, 2 półki — tereny", konstrukcja: "shelves" as const, konf: drzwi(2) },
  { sciana: A.id, x: 2 * W, nazwa: "A3 · 4 szuflady — figurki", konstrukcja: "drawers" as const, konf: szuflady(4) },
  // Strona B: tereny za drzwiami po bokach, 3 głębsze szuflady (podręczniki, kości, maty) w środku
  { sciana: B.id, x: 0, nazwa: "B1 · drzwi, 2 półki — tereny", konstrukcja: "shelves" as const, konf: drzwi(2) },
  { sciana: B.id, x: W, nazwa: "B2 · 3 szuflady — podręczniki, maty", konstrukcja: "drawers" as const, konf: szuflady(3) },
  { sciana: B.id, x: 2 * W, nazwa: "B3 · drzwi, 2 półki — tereny", konstrukcja: "shelves" as const, konf: drzwi(2) },
];
const ids: string[] = [];
for (const m of moduly) ids.push(s.dodajModul(p.id, { ...baza, nazwa: m.nazwa, konstrukcja: m.konstrukcja, scianaId: m.sciana, pozycjaXMM: m.x, konfiguracja: m.konf }).id);

// Jeden blat na cały stół (bez łączenia na środku planszy), niesiony przez A1.
s.zmienModul(p.id, ids[0], {
  konfiguracja: { blat: true, blatWymiar: { szerokoscMM: BLAT.dl, glebokoscMM: BLAT.gl, xMM: -NA_KONCACH, zMM: -(18 + 2 + NAD_FRONTEM) } },
});

const a = s.analiza(p.id);
const d = s.dokumentacja(p.id);
console.log("formatek", a.formatki.length, "arkuszy", a.rozkroj.arkusze.length, "walidacja", a.walidacja.map((u) => u.komunikat));
for (const z of a.zbudowane) console.log(z.modul.nazwa, z.ostrzezenia);
console.log("prowadnice", d.prowadnice.map((q) => `${q.nazwaModulu.slice(0, 2)} ${q.szuflada} ${q.osOdDoluBokuMM}`).join(", "));
const blat = a.zbudowane.flatMap((z) => z.elementy).filter((e) => e.rola === "worktop");
console.log("blaty", blat.map((e) => `${e.szer}×${e.gl}×${e.wys}`));
console.log("cena", a.warianty?.map?.((w: { wariant: string; bruttoRazem?: number; brutto?: number }) => `${w.wariant} ${w.bruttoRazem ?? w.brutto}`));
writeFileSync(wyjscie, JSON.stringify(s.projekt(p.id)));
console.log("projekt", p.id);
