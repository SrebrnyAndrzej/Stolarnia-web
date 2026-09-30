// Łazienka na piętrze — dom Kamień (ARCH_KAMIEN_WN_lazienka-gora + -rzut, MOOI Architekci).
// Użycie: npx tsx scripts/lazienka-kamien-gora.ts <katalog-magazynu> <plik-wyjściowy.json>
// Ściana C (widok): 50 pion | 50 WC | 60 | 60 | 100 gres (siedzisko, skrzynka rozdzielacza — poza stolarką);
// strefa dolna 120 cm, górna 150 cm (do sufitu 270). Głębokość zabudowy 40 cm (z frontem). Fronty Kronospan K547 RW.
// Ściana A (tylko rzut): podwójna umywalka 180 × 54 przy ścianie B — wysokość i fronty przyjęte, do potwierdzenia.
import { writeFileSync } from "node:fs";
import { Stolarnia } from "../src/service.js";
import { Magazyn } from "../src/store/store.js";

const [katalog, wyjscie] = process.argv.slice(2);
const s = new Stolarnia(new Magazyn(katalog));

const FRONT = "dekor-e8ee0cd9976099702fa865db"; // Kronospan K547 RW Tobacco Franklin Walnut 18 mm
const KORPUS = "egger-w1100-st9"; // biały korpus — w łazience płyta wilgocioodporna (P3/P5) do potwierdzenia
const H_SC = 2700;
const DOL = 1200;
const GORA = 1500;
const D = 380; // korpus; + front 18 + szczelina 2 = 400 jak na rzucie

const p = s.utworzProjekt({
  nazwa: "Kamień — łazienka piętro",
  klient: { nazwa: "Projekt wnętrz domu — ul. Główna 17, Kamień", adres: "ul. Główna 17, 66-600 Kamień" },
  pomieszczenie: "Łazienka piętro",
  sciany: [
    { nazwa: "A — umywalki", dlugoscMM: 3200, wysokoscMM: H_SC },
    { nazwa: "B — drzwi", dlugoscMM: 2520, wysokoscMM: H_SC },
    { nazwa: "C — zabudowa WC", dlugoscMM: 3200, wysokoscMM: H_SC },
    { nazwa: "D — prysznic", dlugoscMM: 2520, wysokoscMM: H_SC },
  ],
  materialKorpusuId: KORPUS,
  materialFrontuId: FRONT,
  notatki: [
    "Źródło: ARCH_KAMIEN_WN_lazienka-gora (widok ściany C) i -rzut (MOOI Architekci). Wymiary z rysunku, do weryfikacji pomiarem.",
    "Ściana C od lewej (patrząc na ścianę): maskownica pionu 50, WC 50 (maskownica stelaża + szafka nad), 2 × szafka 60, 100 gres Florim (siedzisko nad skrzynką rozdzielacza — poza zakresem stolarki).",
    "Strefa dolna 120 cm, górna 150 cm do sufitu 270 — pod sufitem zostawić tolerancję montażową (blenda/cięcie na wymiar po pomiarze).",
    "Fronty Kronospan Orzech Franklin Tobacco K547 RW. Korpus: w łazience płyta wilgocioodporna — potwierdzić dekor i klasę.",
    "Maskownica stelaża WC: wycięcia pod przycisk spłukujący i przyłącze miski wg karty stelaża (brak modelu).",
    "Maskownica pionu: sposób mocowania i dostęp rewizyjny do ustalenia.",
    "Szafka pod umywalki 2 × 90 × 54 (ściana A, przy ścianie B): tylko z rzutu — wysokość, podział frontów, blat i umywalki do potwierdzenia; blat niewyceniony.",
  ].join("\n"),
});
const [A, , C] = p.pomieszczenia[0].sciany;

const wsp = { materialKorpusuId: KORPUS, materialFrontuId: FRONT };
const blenda = (nazwa: string, x: number, y: number, h: number) =>
  s.dodajModul(p.id, { ...wsp, nazwa, kategoria: "base", konstrukcja: "filler", scianaId: C.id, pozycjaXMM: x, pozycjaYMM: y, szerokoscMM: 500, wysokoscMM: h, glebokoscMM: 20, konfiguracja: { typFrontu: "brak", liczbaDrzwi: 0, liczbaSzuflad: 0, liczbaPolek: 0, plecy: false, blat: false, nogi: false } });
const szafka = (nazwa: string, x: number, y: number, w: number, h: number, polki: number, kategoria: "base" | "wall") =>
  s.dodajModul(p.id, { ...wsp, nazwa, kategoria, konstrukcja: "shelves", scianaId: C.id, pozycjaXMM: x, pozycjaYMM: y, szerokoscMM: w, wysokoscMM: h, glebokoscMM: D, konfiguracja: { typFrontu: "drzwi", liczbaDrzwi: 1, liczbaSzuflad: 0, liczbaPolek: polki, plecy: true, blat: false, nogi: false } });

// Ściana C
blenda("C1 · maskownica pionu — dół", 0, 0, DOL);
blenda("C1 · maskownica pionu — góra", 0, DOL, GORA);
blenda("C2 · maskownica stelaża WC", 500, 0, DOL);
szafka("C2 · szafka nad WC", 500, DOL, 500, GORA, 3, "wall");
szafka("C3 · szafka dolna 60", 1000, 0, 600, DOL, 2, "base");
szafka("C3 · szafka górna 60", 1000, DOL, 600, GORA, 3, "wall");
szafka("C4 · szafka dolna 60", 1600, 0, 600, DOL, 2, "base");
szafka("C4 · szafka górna 60", 1600, DOL, 600, GORA, 3, "wall");

// Ściana A: szafka pod podwójną umywalkę (2 × 90), wisząca, przy ścianie B (koniec ściany A)
for (const [i, x] of [1400, 2300].entries())
  s.dodajModul(p.id, {
    ...wsp,
    nazwa: `A${i + 1} · pod umywalkę 90 (do potwierdzenia)`,
    kategoria: "base",
    konstrukcja: "drawers",
    scianaId: A.id,
    pozycjaXMM: x,
    pozycjaYMM: 400,
    szerokoscMM: 900,
    wysokoscMM: 450,
    glebokoscMM: 520,
    konfiguracja: { typFrontu: "szuflady", liczbaDrzwi: 0, liczbaSzuflad: 2, liczbaPolek: 0, plecy: true, blat: false, nogi: false, szufladySystemowe: true, profilSzuflad: "amix-elite-standard" },
  });

const a = s.analiza(p.id);
console.log("formatek", a.formatki.length, "arkuszy", a.rozkroj.arkusze.length, "walidacja", a.walidacja.map((u) => u.komunikat));
for (const z of a.zbudowane) console.log(z.modul.nazwa, z.ostrzezenia);
console.log("cena", (a.warianty as { wariant: string; cenaBrutto: number }[]).map((w) => `${w.wariant} ${w.cenaBrutto}`).join(", "));
writeFileSync(wyjscie, JSON.stringify(s.projekt(p.id)));
console.log("projekt", p.id);
