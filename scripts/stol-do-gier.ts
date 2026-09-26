// Stół do gier bitewnych z szafkami pod spodem — generator projektu (wyspa na dwóch wirtualnych liniach montażowych).
// Użycie: npx tsx scripts/stol-do-gier.ts <katalog-magazynu> <plik-wyjściowy.json>
// Blat 1800 × 1200 (180 × 120 cm, standard gier bitewnych) na wysokości 900 mm; pod spodem 2 × 3 szafki plecami do siebie,
// cofnięte w głąb blatu (miejsce na nogi) i postawione na kółkach z hamulcami.
import { writeFileSync } from "node:fs";
import { Stolarnia } from "../src/service.js";
import { Magazyn } from "../src/store/store.js";

const [katalog, wyjscie] = process.argv.slice(2);
const s = new Stolarnia(new Magazyn(katalog));

const BLAT = { dl: 1800, gl: 1200 };
const KOLKO = 96; // GTV BRAZYLIA 75, H = 96 mm, nośność 64 kg/szt. (karta produktu)
const WYS_STOLU = 900;
const GR_BLATU = 38;
const H = WYS_STOLU - KOLKO - GR_BLATU; // 766 — korpus
const NAD_FRONTEM = 250; // blat wysunięty poza fronty — miejsce na stopy i kolana przy grze na stojąco
const NA_KONCACH = 150;
const D = BLAT.gl / 2 - 18 - 2 - NAD_FRONTEM; // 330 — dwa rzędy plecami do siebie
const RZAD = BLAT.dl - 2 * NA_KONCACH; // 1500
const W = RZAD / 3; // 500

const KORPUS = "egger-u961-st7"; // Graphite Grey
const FRONT = "egger-h1180-st37"; // Natural Halifax Oak
const BLAT_MAT = "blat-lam-38";

const NOTATKI =
  "Stół do gier bitewnych 180×120 cm, wysokość 90 cm (gra na stojąco), mobilny. Blat laminowany 38 mm jednym kawałkiem 1800×1200 pod matę do gier. " +
  "Szafki cofnięte w głąb blatu: 250 mm na długich bokach i 150 mm na końcach — miejsce na stopy i kolana. Pod spodem 2×3 szafki 500×766×330 plecami do siebie: " +
  "płytkie szuflady na figurki (Amix Elite, NL 300), szafki z półkami na tereny, 3 głębsze szuflady na podręczniki i maty. " +
  "12 kółek GTV BRAZYLIA 75 (H 96 mm, 64 kg/szt.), 8 z hamulcem pod szafkami narożnymi. Szafki skręcone ze sobą plecami i z blatem od spodu. " +
  "Stateczność: oś kółek ok. 310 mm od krawędzi blatu, rozstaw osi kółek w poprzek 540 mm — nie siadać na krawędzi blatu.";
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

const baza = { kategoria: "base" as const, pozycjaYMM: KOLKO, szerokoscMM: W, wysokoscMM: H, glebokoscMM: D, materialKorpusuId: KORPUS, materialFrontuId: FRONT };
const kolka = (narozna: boolean) => ({
  liczba: 2,
  zHamulcem: narozna ? 2 : 0,
  wysokoscMM: KOLKO,
  produktHamulec: "GTV BRAZYLIA 75 KM-RD-75-CF-20, czarny",
  produktBez: "GTV BRAZYLIA 75 KM-RD-75-SF-20, czarny",
});
const szuflady = (n: number, narozna: boolean) => ({ typFrontu: "szuflady" as const, liczbaDrzwi: 0, liczbaSzuflad: n, liczbaPolek: 0, plecy: true, blat: false, nogi: false, kolka: kolka(narozna), szufladySystemowe: true, profilSzuflad: "amix-elite-standard" });
const drzwi = (polki: number, narozna: boolean) => ({ typFrontu: "drzwi" as const, liczbaDrzwi: 1, liczbaSzuflad: 0, liczbaPolek: polki, plecy: true, blat: false, nogi: false, kolka: kolka(narozna), szufladySystemowe: false });

const moduly = [
  // Strona A: figurki w płytkich szufladach po bokach, tereny za drzwiami w środku
  { sciana: A.id, x: 0, nazwa: "A1 · 4 szuflady — figurki", konstrukcja: "drawers" as const, konf: szuflady(4, true) },
  { sciana: A.id, x: W, nazwa: "A2 · drzwi, 2 półki — tereny", konstrukcja: "shelves" as const, konf: drzwi(2, false) },
  { sciana: A.id, x: 2 * W, nazwa: "A3 · 4 szuflady — figurki", konstrukcja: "drawers" as const, konf: szuflady(4, true) },
  // Strona B: tereny za drzwiami po bokach, 3 głębsze szuflady (podręczniki, kości, maty) w środku
  { sciana: B.id, x: 0, nazwa: "B1 · drzwi, 2 półki — tereny", konstrukcja: "shelves" as const, konf: drzwi(2, true) },
  { sciana: B.id, x: W, nazwa: "B2 · 3 szuflady — podręczniki, maty", konstrukcja: "drawers" as const, konf: szuflady(3, false) },
  { sciana: B.id, x: 2 * W, nazwa: "B3 · drzwi, 2 półki — tereny", konstrukcja: "shelves" as const, konf: drzwi(2, true) },
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
