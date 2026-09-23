// Projekty pomieszczeń z dokumentacji ARCH_KAMIEN_WN (MOOI Architekci, rzut i widoki 1:50, wymiary w cm).
// Wymiary odczytane z rysunków PDF: ARCH_KAMIEN_WN_rzut, widok_pokoj (JANEK), widok_pokoj_sypialnia_garderoba,
// widok_garderoba1/2. Tworzy projekty przez REST działającego serwera: `npx tsx scripts/import-arch-kamien.ts`.

const API = process.env.API ?? "http://localhost:3210/api";
const H = 2700; // wysokość pomieszczeń z widoków (270 cm)

async function req<T>(metoda: string, sciezka: string, body?: unknown): Promise<T> {
  const r = await fetch(API + sciezka, { method: metoda, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json();
  if (!r.ok) throw new Error(`${metoda} ${sciezka}: ${d.blad ?? r.status}`);
  return d as T;
}

interface Proj {
  id: string;
  pomieszczenia: { id: string; sciany: { id: string; nazwa: string }[] }[];
}

const bazaKlient = { nazwa: "Projekt wnętrz domu — ul. Główna 17, Kamień", adres: "ul. Główna 17, 66-600 Kamień" };
const zrodlo = "Źródło: ARCH_KAMIEN_WN (MOOI Architekci), rysunki 1:50 — wymiary odczytane z PDF, do weryfikacji pomiarem.";

async function projekt(nazwa: string, sciany: Record<string, unknown>[], notatki: string): Promise<Proj> {
  return req<Proj>("POST", "/projekty", {
    nazwa,
    klient: bazaKlient,
    pomieszczenie: nazwa,
    sciany: sciany.map((s) => ({ wysokoscMM: H, ...s })),
    materialKorpusuId: "egger-w1100-st9",
    materialFrontuId: "egger-w1000-st9",
    notatki: `${zrodlo}\n${notatki}`,
  });
}

async function modul(p: Proj, sciana: number, m: Record<string, unknown>) {
  const s = p.pomieszczenia[0].sciany[sciana];
  return req("POST", `/projekty/${p.id}/moduly`, { scianaId: s.id, ...m });
}

const bezNog = { nogi: false, blat: false, plecy: true };
const szuflady = (n: number) => ({ ...bezNog, typFrontu: "szuflady", liczbaDrzwi: 0, liczbaSzuflad: n });
const drzwi = (polek: number, liczbaDrzwi = 1) => ({ ...bezNog, typFrontu: "drzwi", liczbaDrzwi, liczbaSzuflad: 0, liczbaPolek: polek });

// ---------- 1. Pokój Janka (widok_pokoj: JANEK) ----------
// Wnętrze 270 × 479 cm (220 + 50; 15 + 6×60 + 12 + 92). Szafa gł. 50 na ścianie B (prawej), od okna.
{
  const p = await projekt(
    "Pokój Janka",
    [
      { nazwa: "A — okno", dlugoscMM: 2700 },
      { nazwa: "B — szafa", dlugoscMM: 4790 },
      { nazwa: "C — wejście", dlugoscMM: 2700 },
      { nazwa: "D", dlugoscMM: 4790 },
    ],
    "Szafa: maskownica karnisza 15, 6 kolumn po 60 (dół: front wysuwany 60 / szuflady ukryte 30×60, góra: drzwi 210, uchwyt krawędziowy 50 cm). Za szafą ścianka 12 i drzwi 80×205 (otwór 92).",
  );
  await modul(p, 1, { kategoria: "base", konstrukcja: "filler", nazwa: "Maskownica karnisza 15", pozycjaXMM: 0, pozycjaYMM: 0, szerokoscMM: 150, wysokoscMM: H, glebokoscMM: 500, konfiguracja: { blat: false } });
  const gora = [
    { polek: 4, uwagi: "Półki co ok. 42 cm (43/42/42/42/41)." },
    { polek: 4, uwagi: "Półki co ok. 42 cm (43/42/42/42/41)." },
    { polek: 1, uwagi: "Reling na wieszaki (dwa poziomy: 80 i 59 cm), półka górna 59." },
    { polek: 1, uwagi: "Reling na wieszaki (dwa poziomy: 80 i 59 cm), półka górna 59." },
    { polek: 5, uwagi: "Półki co 30 cm, półka górna 59." },
    { polek: 5, uwagi: "Półki co 30 cm, półka górna 59." },
  ];
  for (let i = 0; i < 6; i++) {
    const x = 150 + 600 * i;
    await modul(p, 1, { kategoria: "base", konstrukcja: "drawers", nazwa: `Szafa — dół ${i + 1}`, pozycjaXMM: x, pozycjaYMM: 0, szerokoscMM: 600, wysokoscMM: 600, glebokoscMM: 500, konfiguracja: szuflady(i < 2 ? 1 : 2), uwagi: i < 2 ? "Front wysuwany 60×60." : "Szuflady ukryte 30×60." });
    await modul(p, 1, { kategoria: "tall", konstrukcja: "shelves", nazwa: `Szafa — góra ${i + 1}`, pozycjaXMM: x, pozycjaYMM: 600, szerokoscMM: 600, wysokoscMM: 2100, glebokoscMM: 500, konfiguracja: drzwi(gora[i].polek), uwagi: gora[i].uwagi });
  }
  console.log("Pokój Janka:", p.id);
}

// ---------- 2. Pokój 2 (widok_pokoj_sypialnia_garderoba, lewa część) ----------
// Wnętrze 307 × 375 cm (247 + 60; 20 + 5×60 + 55). Szafa gł. 60 na ścianie B, zabudowa z szufladami pod oknem (ściana A).
{
  const p = await projekt(
    "Pokój 2",
    [
      { nazwa: "A — okno / biurko", dlugoscMM: 3070 },
      { nazwa: "B — szafa", dlugoscMM: 3750 },
      { nazwa: "C — wejście", dlugoscMM: 3070 },
      { nazwa: "D", dlugoscMM: 3750 },
    ],
    "Szafa: maskownica 20, kolumna 60 (półki), strefa wieszaków 120, 2×60 półki co 30, otwarta półka 55 z pionową listwą LED we froncie. Pod oknem: zabudowa 180 z szufladami 3×25 + wolna przestrzeń 71 na komputer, biurko 70 cm (blat biurka do dodania).",
  );
  await modul(p, 1, { kategoria: "base", konstrukcja: "filler", nazwa: "Maskownica 20", pozycjaXMM: 0, pozycjaYMM: 0, szerokoscMM: 200, wysokoscMM: H, glebokoscMM: 600, konfiguracja: { blat: false } });
  const kolumny = [
    { x: 200, w: 600, dol: 1, polek: 4, drzwi: 1, u: "Półki co ok. 42 cm; dół: front wysuwany 60×60." },
    { x: 800, w: 1200, dol: 2, polek: 1, drzwi: 2, u: "Strefa wieszaków 120: reling (80 i 59 cm), półka górna 59; dół: szuflady ukryte 30×60." },
    { x: 2000, w: 600, dol: 2, polek: 5, drzwi: 1, u: "Półki co 30 cm." },
    { x: 2600, w: 600, dol: 2, polek: 5, drzwi: 1, u: "Półki co 30 cm." },
  ];
  for (const k of kolumny) {
    for (let j = 0; j < k.w / 600; j++)
      await modul(p, 1, { kategoria: "base", konstrukcja: "drawers", nazwa: `Szafa — dół ${k.x + j * 600}`, pozycjaXMM: k.x + j * 600, pozycjaYMM: 0, szerokoscMM: 600, wysokoscMM: 600, glebokoscMM: 600, konfiguracja: szuflady(k.dol) });
    await modul(p, 1, { kategoria: "tall", konstrukcja: "shelves", nazwa: `Szafa — góra ${k.w / 10}`, pozycjaXMM: k.x, pozycjaYMM: 600, szerokoscMM: k.w, wysokoscMM: 2100, glebokoscMM: 600, konfiguracja: drzwi(k.polek, k.drzwi), uwagi: k.u });
  }
  await modul(p, 1, { kategoria: "open", konstrukcja: "openShelf", nazwa: "Otwarta półka 55 z LED", pozycjaXMM: 3200, pozycjaYMM: 0, szerokoscMM: 550, wysokoscMM: H, glebokoscMM: 600, konfiguracja: { ...bezNog, typFrontu: "brak", liczbaDrzwi: 0, liczbaPolek: 8 }, uwagi: "Otwarte półki co 30 cm; pionowa listwa LED wbudowana we front sąsiedniej szafy." });
  for (const x of [0, 900])
    await modul(p, 0, { kategoria: "base", konstrukcja: "drawers", nazwa: "Zabudowa pod oknem — szuflady", pozycjaXMM: x, pozycjaYMM: 0, szerokoscMM: 900, wysokoscMM: 750, glebokoscMM: 600, konfiguracja: szuflady(3), uwagi: "Szuflady standardowe 3×25 cm." });
  console.log("Pokój 2:", p.id);
}

// ---------- 3. Garderoba (widok_garderoba1 i 2) ----------
// Ściany z rzutu (współrzędne lica, Y w dół): górna 321 (70+68+60+60+3+60), uskok przy drzwiach, lewa 416 (71+3×60+2×50+65).
{
  const p = await projekt(
    "Garderoba",
    [
      { nazwa: "A — górna (zabudowa 65)", x1: 0, y1: 0, x2: 3210, y2: 0 },
      { nazwa: "B — przy drzwiach", x1: 3210, y1: 0, x2: 3210, y2: 1000 },
      { nazwa: "C — uskok", x1: 3210, y1: 1000, x2: 2540, y2: 1000 },
      { nazwa: "D — prawa", x1: 2540, y1: 1000, x2: 2540, y2: 4160 },
      { nazwa: "E — okno", x1: 2540, y1: 4160, x2: 0, y2: 4160 },
      { nazwa: "F — lewa (zabudowa)", x1: 0, y1: 4160, x2: 0, y2: 0 },
    ],
    "Ściana górna: narożnik 70 (strefa zabudowy lewej), wieszaki za drzwiami 68 (drążek 138 z narożnikiem, wys. 213), 2×60 z półkami i 2 szufladami wewnętrznymi (36/38), dystans 3 na drzwi, 60 jw. Ściana lewa (od okna): biurko 71 z otwartymi półkami i szufladami pod biurkiem, 60 półki, 60 wieszaki (96), 60 półki, fronty 50+50 na półki 40 i miejsce na pralkę/suszarkę 60 (85 cm), narożnik 65. Fronty rozwierane 270, uchwyt krawędziowy 50 cm.",
  );
  const g = 650;
  await modul(p, 0, { kategoria: "tall", konstrukcja: "shelves", nazwa: "Wieszaki 68", pozycjaXMM: 700, pozycjaYMM: 0, szerokoscMM: 680, wysokoscMM: H, glebokoscMM: g, konfiguracja: drzwi(1), uwagi: "Reling na wieszaki (strefa 138 z narożnikiem, wys. 213), półka górna 57." });
  for (const x of [1380, 1980, 2610])
    await modul(p, 0, { kategoria: "tall", konstrukcja: "shelves", nazwa: "Półki + szuflady wewn. 60", pozycjaXMM: x, pozycjaYMM: 0, szerokoscMM: 600, wysokoscMM: H, glebokoscMM: g, konfiguracja: drzwi(5), uwagi: "Półki wewnętrzne 57/43/32/32/32, 2 szuflady wewnętrzne 36 i 38 (do skonfigurowania)." });
  await modul(p, 0, { kategoria: "base", konstrukcja: "filler", nazwa: "Dystans na drzwi 3", pozycjaXMM: 2580, pozycjaYMM: 0, szerokoscMM: 30, wysokoscMM: H, glebokoscMM: g, konfiguracja: { blat: false } });

  const l = 600;
  await modul(p, 5, { kategoria: "base", konstrukcja: "drawers", nazwa: "Biurko — szuflady", pozycjaXMM: 0, pozycjaYMM: 0, szerokoscMM: 710, wysokoscMM: 750, glebokoscMM: l, konfiguracja: szuflady(2), uwagi: "Szuflady pod biurkiem; blat biurka." });
  await modul(p, 5, { kategoria: "open", konstrukcja: "openShelf", nazwa: "Biurko — otwarte półki", pozycjaXMM: 0, pozycjaYMM: 1200, szerokoscMM: 710, wysokoscMM: 1500, glebokoscMM: 350, konfiguracja: { ...bezNog, typFrontu: "brak", liczbaDrzwi: 0, liczbaPolek: 4 }, uwagi: "Otwarte półki nad biurkiem (wys. do weryfikacji)." });
  const lewa = [
    { x: 710, w: 600, polek: 5, d: 1, u: "Półki 43/32/32/36/38." },
    { x: 1310, w: 600, polek: 1, d: 1, u: "Reling na wieszaki (96), półka górna 57." },
    { x: 1910, w: 600, polek: 5, d: 1, u: "Półki 47/47/42/44/44/46." },
    { x: 2510, w: 1000, polek: 1, d: 2, u: "Fronty 50+50: półki 40 + miejsce na pralkę i suszarkę (85 cm), reling." },
  ];
  for (const k of lewa)
    await modul(p, 5, { kategoria: "tall", konstrukcja: "shelves", nazwa: `Szafa ${k.w / 10}`, pozycjaXMM: k.x, pozycjaYMM: 0, szerokoscMM: k.w, wysokoscMM: H, glebokoscMM: l, konfiguracja: drzwi(k.polek, k.d), uwagi: k.u });
  console.log("Garderoba:", p.id);
}

// ---------- 4. Sypialnia (widok: łóżko 180×200, ściana 356) ----------
{
  const p = await projekt(
    "Sypialnia",
    [
      { nazwa: "A — wejście", dlugoscMM: 3200 },
      { nazwa: "B — zagłówek", dlugoscMM: 3560 },
      { nazwa: "C — okno", dlugoscMM: 3200 },
      { nazwa: "D — garderoba", dlugoscMM: 3560 },
    ],
    "Ściana zagłówka 356 (rzut: 351 = 81+200+70): płyta meblowa wys. 110 z poziomą listwą LED, łóżko 180×200 (kupowane), maskownica karnisza 20 cm, tapeta. Szerokość pokoju ok. 320 — odczyt ze skali rzutu, do pomiaru.",
  );
  for (const x of [0, 1780])
    await modul(p, 1, { kategoria: "base", konstrukcja: "filler", nazwa: "Zagłówek — płyta meblowa 110", pozycjaXMM: x, pozycjaYMM: 0, szerokoscMM: 1780, wysokoscMM: 1100, glebokoscMM: 20, konfiguracja: { blat: false }, uwagi: "Panel dzielony na 2 × 178 (długość 356 przekracza arkusz 280). Listwa LED pozioma na górnej krawędzi." });
  console.log("Sypialnia:", p.id);
}

// ---------- 5. Łazienka (tylko rzut) ----------
{
  const p = await projekt(
    "Łazienka",
    [
      { nazwa: "A — umywalki", dlugoscMM: 3160 },
      { nazwa: "B — drzwi", dlugoscMM: 2500 },
      { nazwa: "C — zabudowa 40", dlugoscMM: 3160 },
      { nazwa: "D — prysznic", dlugoscMM: 2500 },
    ],
    "Z rzutu: podwójna umywalka na ścianie A; na ścianie C zabudowa gł. 40: 60 + 60 + WC 50 + 50. Brak widoku z wysokościami — meble do uzupełnienia po otrzymaniu widoku łazienki. Wymiary ścian odczytane ze skali, do pomiaru.",
  );
  console.log("Łazienka:", p.id);
}
