// Kuchnia z rysunku 2406_KRO_PIESZCZYNSCY (DWG → DXF przez LibreDWG), rzut „PARTER V1 — PROJEKT”.
// Rysunek w cm (mimo $INSUNITS=mm), obrócony o 33°. Geometria szafek z warstwy _shltr_80_meble:
// U-kształt, wnętrze 300 × 341 cm. Rysunek nie zawiera widoków — wysokości i funkcje szafek bez oznaczeń
// przyjęte z katalogu (do potwierdzenia). `npx tsx scripts/import-pieszczynscy.ts` (serwer musi działać).

const API = process.env.API ?? "http://localhost:3210/api";

async function req<T>(metoda: string, sciezka: string, body?: unknown): Promise<T> {
  const r = await fetch(API + sciezka, { method: metoda, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json();
  if (!r.ok) throw new Error(`${metoda} ${sciezka}: ${d.blad ?? r.status}`);
  return d as T;
}

const p = await req<{ id: string; pomieszczenia: { sciany: { id: string }[] }[] }>("POST", "/projekty", {
  nazwa: "Kuchnia — Pieszczyńscy",
  klient: { nazwa: "Pieszczyńscy" },
  pomieszczenie: "Kuchnia (parter V1)",
  sciany: [
    { nazwa: "A — okno", dlugoscMM: 3000 },
    { nazwa: "B — prawa (płyta)", dlugoscMM: 3410 },
    { nazwa: "C — słupki i lodówka", dlugoscMM: 3000 },
    { nazwa: "D — lewa (zlew, drzwi)", dlugoscMM: 3410 },
  ],
  notatki: [
    "Źródło: 2406_KRO_PIESZCZYNSCY_out.dwg → DXF (LibreDWG), rzut PARTER V1 PROJEKT. Rysunek w cm, obrót 33°.",
    "Z rzutu: U-kształt 300 × 341; ściana okna 5×60 (gł. 60) z narożnikami; prawa: płyta indukcyjna 60 + zakończenie 40;",
    "lewa: zlew 60 + zakończenie 43, niżej drzwi; naprzeciw okna: słupki 3×60, wnęka 92 na lodówkę side-by-side, słupek 28.",
    "DO POTWIERDZENIA (brak widoków w pliku): wysokości (przyjęto katalogowe 720/2070 + nogi 100), szafki wiszące,",
    "funkcje szafek pod oknem (np. zmywarka przy zlewie), rozwiązanie narożników, piekarnik (blok w rysunku bez jednoznacznej pozycji),",
    "głębokość słupków — na rysunku 75 cm (przyjęto katalogowe 56 + front).",
  ].join("\n"),
});
const [A, B, C, D] = p.pomieszczenia[0].sciany.map((s) => s.id);
const dodaj = (scianaId: string, m: Record<string, unknown>) => req("POST", `/projekty/${p.id}/moduly`, { scianaId, ...m });

// Ściana A (okno), od lewej: narożnik, 3 szafki, narożnik
await dodaj(A, { katalogId: "base-shelves-600", nazwa: "Narożnik lewy 60", pozycjaXMM: 0, uwagi: "Narożnik U z ciągiem lewym — dostęp i system narożny do ustalenia." });
for (const x of [600, 1200, 1800]) await dodaj(A, { katalogId: "base-shelves-600", pozycjaXMM: x, uwagi: "Funkcja do potwierdzenia (szuflady / zmywarka)." });
await dodaj(A, { katalogId: "base-shelves-600", nazwa: "Narożnik prawy 60", pozycjaXMM: 2400, uwagi: "Narożnik U z ciągiem prawym — dostęp i system narożny do ustalenia." });

// Ściana B (prawa, od okna): narożnik zajmuje 0–600, dalej płyta 60 i zakończenie 40
await dodaj(B, { katalogId: "base-drawers-600", nazwa: "Szafka pod płytę indukcyjną 60", pozycjaXMM: 600, uwagi: "Płyta indukcyjna 60 (blok @_SHLTR_płyta indukcyjna 60)." });
await dodaj(B, { katalogId: "base-shelves-400", nazwa: "Zakończenie 40", pozycjaXMM: 1200 });

// Ściana D (lewa, x od dołu rzutu; ciąg przy oknie = koniec ściany): narożnik 2810–3410, zlew 2210–2810, zakończenie 43
await dodaj(D, { katalogId: "base-sink-600", nazwa: "Szafka zlewowa 60", pozycjaXMM: 2210, uwagi: "Zlewozmywak 60 (blok @_SHLTR_zlewozmywak 60)." });
await dodaj(D, { katalogId: "base-shelves-450", nazwa: "Zakończenie 43", szerokoscMM: 430, pozycjaXMM: 1780 });

// Ściana C (naprzeciw okna, x od prawej): słupek 28, wnęka lodówki 92, 3 słupki 60
await dodaj(C, { kategoria: "tall", konstrukcja: "shelves", nazwa: "Słupek wąski 28", pozycjaXMM: 0, pozycjaYMM: 100, szerokoscMM: 280, wysokoscMM: 2070, glebokoscMM: 560, konfiguracja: { liczbaDrzwi: 1, liczbaPolek: 4, nogi: true, blat: false, typFrontu: "drzwi" }, uwagi: "Na rysunku 28 × 75 — np. cargo wysokie lub półki." });
for (const x of [1200, 1800, 2400]) await dodaj(C, { katalogId: "tall-pantry-600", pozycjaXMM: x, uwagi: "Słupek 60 (rysunek: gł. 75). Jeden ze słupków może mieścić piekarnik — do potwierdzenia." });

console.log(`Projekt: ${p.id} — wnęka 920 mm na lodówkę side-by-side zostaje wolna (ściana C, 280–1200).`);
