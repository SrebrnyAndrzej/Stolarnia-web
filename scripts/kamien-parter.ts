// Kuchnia i łazienka na parterze — dom Kamień (ARCH_KAMIEN_WN_26-06-29-out.dwg, MOOI Architekci; odczyt: docs/projekty/KAMIEN-parter-kuchnia-lazienka.md).
// Użycie: npx tsx scripts/kamien-parter.ts <katalog-magazynu> <kuchnia.json> <lazienka.json>
// Kuchnia równoległa: zabudowa 346 (60 | 68 | 90 | 68 | 60) i wyspa 280 × 60, przejście 95. Widok zabudowy w DWG jest odwrócony
// (podłoga u góry arkusza): cokół 5, szafki dolne 41 + 34 (fronty), blat 12 mm na 86, wnęka 58,8, wiszące 40 + 40 + 35 do 260, sufit 271.
// Łazienka: WC podwieszane (zabudowa stelaża 18), umywalka nablatowa 60 × 40 na szafce, prysznic 90 × 124 (poza stolarką).
import { writeFileSync } from "node:fs";
import { Stolarnia } from "../src/service.js";
import { Magazyn } from "../src/store/store.js";

const [katalog, wyjKuchnia, wyjLazienka] = process.argv.slice(2);
const s = new Stolarnia(new Magazyn(katalog));
const klient = { nazwa: "Projekt wnętrz domu — ul. Główna 17, Kamień", adres: "ul. Główna 17, 66-600 Kamień" };
const zrodlo = "Źródło: ARCH_KAMIEN_WN_26-06-29-out.dwg (MOOI Architekci) — wymiary z geometrii rysunku, do weryfikacji pomiarem.";

// ---------------- Kuchnia ----------------
const KORPUS = "egger-w1100-st9";
const FRONT = "egger-w1000-st9";
const BLAT = "blat-spiek-12";
const H_POM = 2710;
const COKOL = 50;
const H_DOL = 800; // korpus; + blat 12 → 862 (DWG: 86,2; wyspa 87)
const Y_WISZ = 1450; // wnęka 58,8 cm nad blatem
const H_WISZ = 1150; // do 2600, 11 cm do sufitu
const H_SLUP = 2600 - COKOL;

const k = s.utworzProjekt({
  nazwa: "Kamień — kuchnia parter",
  klient,
  pomieszczenie: "Kuchnia parter",
  sciany: [
    { nazwa: "A — zabudowa 346", dlugoscMM: 3460, wysokoscMM: H_POM, x1: 0, y1: 0, x2: 3460, y2: 0 },
    // Wyspa: linia montażowa tyłu wyspy, fronty w stronę zabudowy (przejście 95 cm)
    { nazwa: "Wyspa 280 (tył)", dlugoscMM: 2800, wysokoscMM: H_POM, x1: 2800, y1: 2150, x2: 0, y2: 2150, wirtualna: true },
  ],
  materialKorpusuId: KORPUS,
  materialFrontuId: FRONT,
  materialBlatuId: BLAT,
  notatki: [
    zrodlo,
    "Zabudowa ściany A od lewej: słupek piekarnikowy 60 | dolna 68 | dolna 90 z płytą 80 | dolna 68 | słupek lodówki 60. Nad blatem wnęka 58,8 cm z gniazdami, wiszące 68/90/68 do 260 cm, pas 11 cm do sufitu 271.",
    "W DWG tył zabudowy jest ok. 23 cm od ściany konstrukcyjnej — ustalić: instalacje, zabudowa blendą z boku czy przesunięcie ciągu.",
    "Blat 12 mm (DWG: 1,2) — spiek lub kompakt, do wyboru z klientem. Dekory korpusu i frontów nieokreślone w DWG — przyjęto biel, do potwierdzenia.",
    "Podział frontów wg widoku: dolne 41 + 34 cm (przyjęto 2 szuflady), wiszące 40 + 40 + 35 cm (przyjęto drzwi z 2 półkami) — do potwierdzenia.",
    "Wyspa 280 × 60, wys. blatu 87: zlew 60 | 80 | 80 | 60 (rzut); w widoku podział 142 | 76 | 62. Nad wyspą zawieszony element szer. ok. 120 cm, dół na ok. 189 cm (lampa/okap) — poza stolarką.",
    "Za ścianą konstrukcyjną (poza kuchnią) box 75 × 93 z symbolem mrożenia — zamrażarka, nie w zakresie.",
  ].join("\n"),
});
const [A, W] = k.pomieszczenia[0].sciany;
const wspK = { materialKorpusuId: KORPUS, materialFrontuId: FRONT };
const konf = (c: Record<string, unknown>) => ({ liczbaPolek: 0, liczbaDrzwi: 0, liczbaSzuflad: 0, plecy: true, blat: true, nogi: true, szufladySystemowe: true, ...c });
const dolna = (sc: string, nazwa: string, x: number, w: number, c: Record<string, unknown>, konstrukcja: "drawers" | "sink" | "shelves" = "drawers") =>
  s.dodajModul(k.id, { ...wspK, nazwa, kategoria: "base", konstrukcja, scianaId: sc, pozycjaXMM: x, pozycjaYMM: COKOL, szerokoscMM: w, wysokoscMM: H_DOL, glebokoscMM: 560, konfiguracja: konf(c) });
const szuf2 = { typFrontu: "szuflady", liczbaSzuflad: 2 };

s.dodajModul(k.id, { ...wspK, nazwa: "A1 · słupek piekarnik + mikrofala 60", kategoria: "tall", konstrukcja: "ovenMicrowaveTower", scianaId: A.id, pozycjaXMM: 0, pozycjaYMM: COKOL, szerokoscMM: 600, wysokoscMM: H_SLUP, glebokoscMM: 560, konfiguracja: konf({ typFrontu: "drzwi", liczbaDrzwi: 1, liczbaSzuflad: 2, blat: false }), uwagi: "DWG: dół do 80 cm (2 fronty), nisza AGD ok. 90 cm na 86–176, nad nią 2 fronty do 260." });
dolna(A.id, "A2 · dolna 68, 2 szuflady", 600, 680, szuf2);
dolna(A.id, "A3 · dolna 90 pod płytę 80, 2 szuflady", 1280, 900, szuf2);
dolna(A.id, "A4 · dolna 68, 2 szuflady", 2180, 680, szuf2);
s.dodajModul(k.id, { ...wspK, nazwa: "A5 · słupek lodówki 60", kategoria: "tall", konstrukcja: "refrigerator", scianaId: A.id, pozycjaXMM: 2860, pozycjaYMM: COKOL, szerokoscMM: 600, wysokoscMM: H_SLUP, glebokoscMM: 560, konfiguracja: konf({ typFrontu: "panelAGD", liczbaDrzwi: 2, blat: false, szufladySystemowe: false }), uwagi: "Lodówka do zabudowy (blok „lodowka” w DWG) — model do ustalenia." });
for (const [i, [x, w]] of ([[600, 680], [1280, 900], [2180, 680]] as const).entries())
  s.dodajModul(k.id, { ...wspK, nazwa: `A${i + 2}g · wisząca ${w / 10}`, kategoria: "wall", konstrukcja: "shelves", scianaId: A.id, pozycjaXMM: x, pozycjaYMM: Y_WISZ, szerokoscMM: w, wysokoscMM: H_WISZ, glebokoscMM: 350, konfiguracja: konf({ typFrontu: "drzwi", liczbaDrzwi: 2, liczbaPolek: 2, blat: false, nogi: false, szufladySystemowe: false }) });

// Wyspa (x liczone od prawego końca linii — strona zlewu w rzucie)
dolna(W.id, "W1 · zlewowa 60", 0, 600, { typFrontu: "drzwi", liczbaDrzwi: 2, szufladySystemowe: false }, "sink");
dolna(W.id, "W2 · dolna 80, 3 szuflady", 600, 800, { typFrontu: "szuflady", liczbaSzuflad: 3 });
dolna(W.id, "W3 · dolna 80, 3 szuflady", 1400, 800, { typFrontu: "szuflady", liczbaSzuflad: 3 });
dolna(W.id, "W4 · dolna 60, 2 szuflady", 2200, 600, szuf2);

s.zmienProjekt(k.id, {
  agd: [
    { rodzaj: "lodowka", model: "do zabudowy, wys. ok. 178 — do ustalenia", szerMM: 560 },
    { rodzaj: "piekarnik", model: "do zabudowy 60 — do ustalenia" },
    { rodzaj: "mikrofala", model: "do zabudowy — do ustalenia (nisza ok. 90 cm łącznie z piekarnikiem)" },
    { rodzaj: "plyta", model: "płyta 80 (w rzucie 79 × 51) — do ustalenia", szerMM: 790, glMM: 510 },
  ],
});

// ---------------- Łazienka parter ----------------
const FRONT_L = "dekor-e8ee0cd9976099702fa865db"; // jak łazienka piętro (Kronospan K547 Franklin Walnut) — do potwierdzenia
const H_L = 2710;
const l = s.utworzProjekt({
  nazwa: "Kamień — łazienka parter",
  klient,
  pomieszczenie: "Łazienka parter",
  sciany: [
    { nazwa: "A — umywalka (tył)", dlugoscMM: 2790, wysokoscMM: H_L },
    { nazwa: "B — prysznic", dlugoscMM: 1250, wysokoscMM: H_L },
    { nazwa: "C — drzwi", dlugoscMM: 2790, wysokoscMM: H_L },
    { nazwa: "D — WC", dlugoscMM: 1250, wysokoscMM: H_L },
  ],
  materialKorpusuId: KORPUS,
  materialFrontuId: FRONT_L,
  materialBlatuId: BLAT,
  notatki: [
    zrodlo,
    "Wymiary wzdłuż ściany tylnej: 139 | 91 | 49 (razem 279). Głębokość ok. 125 (przy prysznicu), przy WC ściana cofnięta do 100.",
    "WC podwieszane przy ścianie D: zabudowa stelaża gł. 18 cm na odcinku 100 cm od ściany tylnej, oś miski ok. 50 cm od ściany tylnej, miska 38 × ok. 54. Wysokość zabudowy przyjęta 120 cm.",
    "Umywalka nablatowa 60 × 40 (blok umywaka60x40) 109–169 cm od ściany D — szafka wisząca 60 × 40 z blatem 12 mm; wysokość i fronty przyjęte, do potwierdzenia.",
    "Prysznic 90 × 124 przy ścianie B z deszczownicą — poza stolarką. Szafka pod schodami (110, korytarz) — poza tym projektem.",
    "Dekor frontów przyjęty jak łazienka na piętrze (K547 Franklin Walnut) — potwierdzić; korpus: płyta wilgocioodporna.",
  ].join("\n"),
});
const [LA, , , LD] = l.pomieszczenia[0].sciany;
const wspL = { materialKorpusuId: KORPUS, materialFrontuId: FRONT_L };
s.dodajModul(l.id, { ...wspL, nazwa: "D1 · maskownica stelaża WC", kategoria: "base", konstrukcja: "filler", scianaId: LD.id, pozycjaXMM: 250, pozycjaYMM: 0, szerokoscMM: 1000, wysokoscMM: 1200, glebokoscMM: 180, konfiguracja: konf({ typFrontu: "brak", plecy: false, blat: false, nogi: false, szufladySystemowe: false, sanitariat: { typ: "wcWiszace", wysokoscMiskiMM: 400, przyciskYMM: 1000 } }), uwagi: "Wycięcia pod przycisk i przyłącze miski wg karty stelaża; blat zabudowy (półka) do ustalenia." });
s.dodajModul(l.id, { ...wspL, nazwa: "A1 · szafka pod umywalkę nablatową 60", kategoria: "base", konstrukcja: "drawers", scianaId: LA.id, pozycjaXMM: 1090, pozycjaYMM: 500, szerokoscMM: 600, wysokoscMM: 350, glebokoscMM: 400, konfiguracja: konf({ typFrontu: "szuflady", liczbaSzuflad: 1, nogi: false, profilSzuflad: "amix-elite-standard" }), uwagi: "Wisząca; blat 12 mm pod umywalkę nablatową na ok. 86 cm; wycięcie pod syfon w szufladzie." });
s.zmienProjekt(l.id, { agd: [{ rodzaj: "inne", model: "Umywalka nablatowa 60 × 40 (misa 48 × 27) — model do ustalenia", szerMM: 600, glMM: 400 }] });

for (const [p, wyj] of [[k, wyjKuchnia], [l, wyjLazienka]] as const) {
  const a = s.analiza(p.id);
  console.log("==", p.nazwa, "formatek", a.formatki.length, "walidacja", a.walidacja.map((u) => u.komunikat));
  for (const z of a.zbudowane) if (z.ostrzezenia.length) console.log(" ", z.modul.nazwa, z.ostrzezenia);
  console.log(" cena", a.warianty?.map?.((w: { wariant: string; bruttoRazem?: number; brutto?: number }) => `${w.wariant} ${w.bruttoRazem ?? w.brutto}`));
  writeFileSync(wyj, JSON.stringify(s.projekt(p.id)));
  console.log(" projekt", p.id);
}
