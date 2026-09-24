// Rysunek szkieletowy ciągu wysokiego (słupki + nisza lodówki) do ręcznego szkicowania, A4 poziomo:
// str. 1 — widok ściany: puste obrysy słupków, nisza piekarnika z urządzeniem, lodówka wolnostojąca z odstępami,
//          linie odniesienia blatu, strefa do sufitu; str. 2 — rzut z głębokościami i otwieraniem drzwi + dane AGD.
// Dane AGD (wymiary i wymagania zabudowy) z kart producentów — tabela AGD poniżej.
//
// Użycie: npx tsx scripts/szkic-ciagu-wysokiego.ts <plik-bazy.json> <id-projektu> <wyjście.pdf> <litera ściany, np. C>
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import PDFDocument from "pdfkit";
import { niszaSlupka } from "../src/core/builder.js";
import type { Modul, Projekt, Sciana } from "../src/core/types.js";

const require = createRequire(import.meta.url);
const FONTY = join(dirname(require.resolve("dejavu-fonts-ttf/package.json")), "ttf");
const W = 841.89;
const H = 595.28;
const M = 32;
const CIEMNY = "#1f1c18";
const SZARY = "#77706a";
const JASNY = "#c9c3ba";
const WYMIAR = "#2d5c8a";
const AGD_KOLOR = "#8a4b2d";

// Karty producentów: Electrolux EOF4P56X, Electrolux EIV63440BW, Bosch KFN96VPEA (instrukcja 8001167016).
const AGD = {
  piekarnik: { model: "Electrolux EOF4P56X", szer: 594, wys: 589, gl: 569, nisza: "590 × 560 × 550 (wys. × szer. × gł.)" },
  plyta: { model: "Electrolux EIV63440BW Slim-fit", szer: 590, gl: 520, otwor: "560 × 490", zabudowa: 44 },
  mikrofala: { model: "Bosch BFL524MS0", szer: 594, wys: 382, gl: 317, nisza: "362–365 × 560–568 × 300 (wys. × szer. × gł.)" },
  lodowka: { model: "Bosch KFN96VPEA (French door, wolnostojąca)", szer: 905, wys: 1830, gl: 736, glKorpus: 635, tyl: 50, bok: 50, gora: 300, glOtwarte: 1102 },
};

const [plikBazy, projektId, wyjscie, literaSciany = "C"] = process.argv.slice(2);
const baza = JSON.parse(readFileSync(plikBazy, "utf8")) as { projekty: Projekt[] };
const p = baza.projekty.find((q) => q.id === projektId);
if (!p) throw new Error(`Brak projektu ${projektId}`);
const pom = p.pomieszczenia[0];
const litera = (s: Sciana) => s.nazwa.trim().charAt(0).toUpperCase();
const s = pom.sciany.find((q) => litera(q) === literaSciany.toUpperCase());
if (!s) throw new Error(`Brak ściany ${literaSciany}`);
const slupki = p.moduly.filter((m) => m.scianaId === s.id && m.wysokoscMM >= 1400).sort((a, b) => a.pozycjaXMM - b.pozycjaXMM);
const numer = new Map(slupki.map((m, i) => [m.id, `${litera(s)}${i + 1}`]));
const gora = Math.max(...slupki.map((m) => m.pozycjaYMM + m.wysokoscMM));
const glSlupkow = Math.max(...slupki.map((m) => m.glebokoscMM));

// Luki między słupkami; najszersza ≥ 800 mm = nisza lodówki
const luki: { x0: number; x1: number }[] = [];
{
  let poprz = 0;
  for (const m of slupki) {
    if (m.pozycjaXMM > poprz + 1) luki.push({ x0: poprz, x1: m.pozycjaXMM });
    poprz = Math.max(poprz, m.pozycjaXMM + m.szerokoscMM);
  }
  if (poprz < s.dlugoscMM - 1) luki.push({ x0: poprz, x1: s.dlugoscMM });
}
const niszaLod = luki.filter((l) => l.x1 - l.x0 >= 800).sort((a, b) => b.x1 - b.x0 - (a.x1 - a.x0))[0];
const lod = AGD.lodowka;
const lodX0 = niszaLod ? niszaLod.x0 + (niszaLod.x1 - niszaLod.x0 - lod.szer) / 2 : 0;
const bokLod = niszaLod ? (niszaLod.x1 - niszaLod.x0 - lod.szer) / 2 : 0;

const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: M, autoFirstPage: false, info: { Title: `Szkic ciągu wysokiego — ${p.nazwa}` } });
doc.registerFont("R", join(FONTY, "DejaVuSans.ttf"));
doc.registerFont("B", join(FONTY, "DejaVuSans-Bold.ttf"));
doc.registerFont("C", join(FONTY, "DejaVuSansCondensed.ttf"));
const bufory: Buffer[] = [];
doc.on("data", (b: Buffer) => bufory.push(b));
const koniec = new Promise<Buffer>((ok) => doc.on("end", () => ok(Buffer.concat(bufory))));

const naglowek = (tytul: string, pod: string) => {
  doc.font("B").fontSize(16).fillColor(CIEMNY).text(tytul, M, M - 6, { width: W - 2 * M - 220 });
  doc.font("R").fontSize(8).fillColor(SZARY).text(`${p.nazwa} · szkic roboczy · data: ____________`, W - M - 260, M - 2, { width: 260, align: "right" });
  doc.font("R").fontSize(8.5).fillColor(SZARY).text(pod, M, M + 16, { width: W - 2 * M });
  doc.moveTo(M, M + 30).lineTo(W - M, M + 30).lineWidth(0.5).strokeColor(JASNY).stroke();
  doc.page.margins.bottom = 0;
};
const tekst = (t: string, x: number, y: number, w: number, o: { font?: string; size?: number; kolor?: string; align?: "left" | "center" | "right" } = {}) =>
  doc.font(o.font ?? "C").fontSize(o.size ?? 7).fillColor(o.kolor ?? SZARY).text(t, x, y, { width: w, align: o.align ?? "center", lineBreak: false });
const wymiarPoziomy = (x1: number, x2: number, y: number, t: string, yRef: number) => {
  doc.lineWidth(0.5).strokeColor(WYMIAR);
  doc.moveTo(x1, yRef).lineTo(x1, y + 3).moveTo(x2, yRef).lineTo(x2, y + 3).moveTo(x1, y).lineTo(x2, y).stroke();
  for (const x of [x1, x2]) doc.moveTo(x - 2.5, y + 2.5).lineTo(x + 2.5, y - 2.5).stroke();
  tekst(t, x1 - 12, y - 9, x2 - x1 + 24, { size: x2 - x1 < 22 ? 5.5 : 7.5, kolor: WYMIAR });
};
const wymiarPionowy = (y1: number, y2: number, x: number, t: string, xRef: number) => {
  doc.lineWidth(0.5).strokeColor(WYMIAR);
  doc.moveTo(xRef, y1).lineTo(x - 3, y1).moveTo(xRef, y2).lineTo(x - 3, y2).moveTo(x, y1).lineTo(x, y2).stroke();
  for (const y of [y1, y2]) doc.moveTo(x - 2.5, y + 2.5).lineTo(x + 2.5, y - 2.5).stroke();
  doc.save().rotate(-90, { origin: [x - 5, (y1 + y2) / 2] });
  tekst(t, x - 45, (y1 + y2) / 2 - 9, 80, { size: 7, kolor: WYMIAR });
  doc.restore();
};
const kreskowanie = (x: number, y: number, w: number, h: number, kolor = JASNY) => {
  doc.save().rect(x, y, w, h).clip();
  doc.lineWidth(0.4).strokeColor(kolor);
  for (let d = -h; d < w; d += 6) doc.moveTo(x + d, y + h).lineTo(x + d + h, y).stroke();
  doc.restore();
  doc.rect(x, y, w, h).lineWidth(0.5).dash(3, { space: 2 }).strokeColor(SZARY).stroke().undash();
};
const przerywana = (x1: number, y1: number, x2: number, y2: number, kolor = SZARY, gr = 0.5) =>
  doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(gr).dash(4, { space: 2.5 }).strokeColor(kolor).stroke().undash();
const opisSlupka = (m: Modul) => {
  if (niszaSlupka(m)) return niszaSlupka(m)!.mikrofala ? "piekarnik + mikrofala" : "piekarnik";
  if (m.szerokoscMM < 400) return "słupek wąski";
  return "";
};
const linie = (x: number, y: number, w: number, y1: number) => {
  for (let yy = y; yy < y1; yy += 19) doc.moveTo(x, yy).lineTo(x + w, yy).lineWidth(0.4).strokeColor(JASNY).stroke();
};

// ---------- Strona 1: widok ściany ----------
doc.addPage();
naglowek(
  `Ściana ${s.nazwa} — ciąg wysoki`,
  "Widok z wnętrza kuchni. Słupki puste do zaznaczenia: szuflady / drzwi z półkami / cargo. Urządzenia narysowane w skali według kart producentów. Wymiary w mm.",
);
{
  const obszar = { x: M + 52, y: M + 50, w: 470, h: H - M - 50 - (M + 50) };
  const zakresH = s.wysokoscMM;
  const sk = Math.min(obszar.w / (s.dlugoscMM + 200), (obszar.h - 50) / zakresH);
  const ox = obszar.x + 10;
  const oy = obszar.y + zakresH * sk + 4;
  const X = (x: number) => ox + x * sk;
  const Y = (y: number) => oy - y * sk;

  // podłoga, ściany boczne, sufit
  doc.moveTo(X(-100), Y(0)).lineTo(X(s.dlugoscMM + 100), Y(0)).lineWidth(1.4).strokeColor(CIEMNY).stroke();
  for (const x of [0, s.dlugoscMM]) doc.moveTo(X(x), Y(0)).lineTo(X(x), Y(zakresH)).lineWidth(1.2).strokeColor(CIEMNY).stroke();
  przerywana(X(-100), Y(zakresH), X(s.dlugoscMM + 100), Y(zakresH), CIEMNY, 0.8);
  tekst(`sufit ${zakresH}`, X(s.dlugoscMM) - 80, Y(zakresH) + 3, 76, { align: "right" });
  // strefa nad słupkami do sufitu
  tekst(`${zakresH - gora} do sufitu — nadstawki / blenda?`, X(0), Y((zakresH + gora) / 2) - 4, (s.dlugoscMM) * sk, { size: 7 });
  // linie odniesienia ciągu dolnego
  przerywana(X(0), Y(858), X(s.dlugoscMM), Y(858), AGD_KOLOR, 0.4);
  przerywana(X(0), Y(820), X(s.dlugoscMM), Y(820), JASNY, 0.4);

  for (const m of slupki) {
    const [x0, x1] = [X(m.pozycjaXMM), X(m.pozycjaXMM + m.szerokoscMM)];
    const [yDol, yGora] = [Y(m.pozycjaYMM), Y(m.pozycjaYMM + m.wysokoscMM)];
    doc.rect(x0 + 1, yDol, x1 - x0 - 2, m.pozycjaYMM * sk).lineWidth(0.4).fillAndStroke("#e9e6e1", JASNY);
    doc.rect(x0, yGora, x1 - x0, yDol - yGora).lineWidth(1.1).strokeColor(CIEMNY).stroke();
    for (let h = 100; h < m.wysokoscMM; h += 100) {
      const yy = Y(m.pozycjaYMM + h);
      doc.moveTo(x0, yy).lineTo(x0 + 4, yy).moveTo(x1 - 4, yy).lineTo(x1, yy).lineWidth(0.4).strokeColor(JASNY).stroke();
    }
    doc.font("B").fontSize(11).fillColor(JASNY).text(numer.get(m.id) ?? "", x0, yGora + 4, { width: x1 - x0, align: "center", lineBreak: false });
    const n = niszaSlupka(m);
    if (n) {
      const t = 18;
      const y0 = m.pozycjaYMM + n.dol;
      // półki stałe (nośna pod piekarnikiem i nad niszą)
      const mf = n.mikrofala;
      if (mf) {
        // mikrofala (front 594 × 382, zachodzi po ok. 10 na półki nad i pod niszą 362)
        const mk = AGD.mikrofala;
        const my0 = y0 + mf.od + (mf.wys - mk.wys) / 2;
        const mx0 = X(m.pozycjaXMM + (m.szerokoscMM - mk.szer) / 2);
        doc.rect(mx0, Y(my0 + mk.wys), mk.szer * sk, mk.wys * sk).lineWidth(0.9).strokeColor(AGD_KOLOR).stroke();
        doc.rect(mx0 + 40 * sk, Y(my0 + mk.wys - 50), (mk.szer - 300) * sk, (mk.wys - 100) * sk).lineWidth(0.5).strokeColor(AGD_KOLOR).stroke();
        tekst("mikrofala", x0 + (x1 - x0) * 0.55, Y(my0 + mk.wys / 2) - 4, (x1 - x0) * 0.43, { font: "B", size: 7, kolor: AGD_KOLOR });
        tekst("BFL524MS0", x0 + (x1 - x0) * 0.55, Y(my0 + mk.wys / 2) + 5, (x1 - x0) * 0.43, { size: 6, kolor: AGD_KOLOR });
      }
      for (const yp of [y0 - t, y0 + n.wys, ...(mf ? [y0 + mf.od - t] : [])]) doc.rect(x0 + 1, Y(yp + t), x1 - x0 - 2, t * sk).lineWidth(0.4).fillAndStroke("#bdb6ab", SZARY);
      // piekarnik (front 594 × 589, na półce nośnej)
      const pk = AGD.piekarnik;
      const px0 = X(m.pozycjaXMM + (m.szerokoscMM - pk.szer) / 2);
      doc.rect(px0, Y(y0 + pk.wys), pk.szer * sk, pk.wys * sk).lineWidth(0.9).strokeColor(AGD_KOLOR).stroke();
      doc.rect(px0 + 60 * sk, Y(y0 + pk.wys - 150), (pk.szer - 120) * sk, (pk.wys - 230) * sk).lineWidth(0.5).strokeColor(AGD_KOLOR).stroke();
      doc.moveTo(px0 + 60 * sk, Y(y0 + pk.wys - 90)).lineTo(px0 + (pk.szer - 60) * sk, Y(y0 + pk.wys - 90)).lineWidth(1.2).strokeColor(AGD_KOLOR).stroke();
      tekst("piekarnik", x0, Y(y0 + pk.wys / 2) - 4, x1 - x0, { font: "B", size: 7, kolor: AGD_KOLOR });
      tekst("EOF4P56X", x0, Y(y0 + pk.wys / 2) + 5, x1 - x0, { size: 6, kolor: AGD_KOLOR });
      // proponowana podziałka szuflad pod piekarnikiem (do zmiany ręcznie)
      const ls = m.konfiguracja.liczbaSzuflad;
      for (let i = 1; i < ls; i++) przerywana(x0 + 3, Y(m.pozycjaYMM + (n.dol * i) / ls), x1 - 3, Y(m.pozycjaYMM + (n.dol * i) / ls), JASNY, 0.4);
      if (ls > 0) tekst(`${ls} szuflady (propozycja)`, x0, Y(m.pozycjaYMM + n.dol / 2) - 3, x1 - x0, { size: 6 });
    } else {
      const op = opisSlupka(m);
      if (op) tekst(op, x0 + 1, yDol - 12, x1 - x0 - 2, { size: 5 });
    }
  }

  // lodówka wolnostojąca w niszy
  if (niszaLod) {
    const [lx0, lx1] = [X(lodX0), X(lodX0 + lod.szer)];
    kreskowanie(X(lodX0), Y(lod.wys + lod.gora), lod.szer * sk, lod.gora * sk, "#e3c7b8");
    tekst(`min. ${lod.gora} wolne nad lodówką (Bosch)`, lx0 + 4, Y(lod.wys + lod.gora / 2) - 4, lx1 - lx0 - 40, { size: 6.5, kolor: AGD_KOLOR });
    doc.roundedRect(lx0, Y(lod.wys), lx1 - lx0, lod.wys * sk, 3).lineWidth(1).strokeColor(AGD_KOLOR).stroke();
    const xs = (lx0 + lx1) / 2;
    const yPodzial = Y(lod.wys - 1080);
    doc.moveTo(xs, Y(lod.wys) + 2).lineTo(xs, yPodzial).moveTo(lx0, yPodzial).lineTo(lx1, yPodzial).lineWidth(0.5).strokeColor(AGD_KOLOR).stroke();
    doc.moveTo(lx0, Y((lod.wys - 1080) / 2)).lineTo(lx1, Y((lod.wys - 1080) / 2)).lineWidth(0.5).strokeColor(AGD_KOLOR).stroke();
    tekst("lodówka Bosch KFN96VPEA", lx0, Y(lod.wys * 0.72), lx1 - lx0, { font: "B", size: 7, kolor: AGD_KOLOR });
    tekst("wolnostojąca, French door", lx0, Y(lod.wys * 0.72) + 9, lx1 - lx0, { size: 6.5, kolor: AGD_KOLOR });
    tekst("podział drzwi/szuflad schematyczny", lx0, Y(lod.wys * 0.72) + 18, lx1 - lx0, { size: 5.5, kolor: SZARY });
    wymiarPionowy(Y(lod.wys), Y(0), lx1 - 12, String(lod.wys), lx1 - 12);
    wymiarPionowy(Y(lod.wys + lod.gora), Y(lod.wys), lx1 - 12, String(lod.gora), lx1 - 12);
    // odstępy boczne
    const yb = Y(lod.wys + 60);
    wymiarPoziomy(X(niszaLod.x0), lx0, yb, String(Math.round(bokLod)), yb);
    wymiarPoziomy(lx1, X(niszaLod.x1), yb, String(Math.round(bokLod)), yb);
  }

  // wymiary poziome
  const oyW = Y(0);
  const yw = oyW + 14;
  let poprz = 0;
  for (const m of slupki) {
    if (m.pozycjaXMM > poprz + 1) wymiarPoziomy(X(poprz), X(m.pozycjaXMM), yw, `nisza ${m.pozycjaXMM - poprz}`, oyW);
    wymiarPoziomy(X(m.pozycjaXMM), X(m.pozycjaXMM + m.szerokoscMM), yw, String(m.szerokoscMM), oyW);
    poprz = m.pozycjaXMM + m.szerokoscMM;
  }
  if (poprz < s.dlugoscMM - 1) wymiarPoziomy(X(poprz), X(s.dlugoscMM), yw, String(s.dlugoscMM - poprz), oyW);
  if (niszaLod) wymiarPoziomy(lodX0 * sk + ox, X(lodX0 + lod.szer), yw + 16, String(lod.szer), oyW);
  wymiarPoziomy(X(0), X(s.dlugoscMM), yw + 32, `${s.dlugoscMM} (ściana)`, oyW);
  // wymiary pionowe (lewa strona): cokół, strefa pod piekarnikiem, nisza, reszta, całość
  const piek = slupki.find((m) => niszaSlupka(m));
  const xa = ox - 12;
  wymiarPionowy(Y(100), Y(0), xa, "100", ox);
  if (piek) {
    const n = niszaSlupka(piek)!;
    const y0 = piek.pozycjaYMM + n.dol;
    wymiarPionowy(Y(y0), Y(100), xa, String(n.dol), ox);
    if (n.mikrofala) {
      wymiarPionowy(Y(y0 + 595), Y(y0), xa, "595", ox);
      wymiarPionowy(Y(y0 + n.wys), Y(y0 + n.mikrofala.od), xa, String(n.mikrofala.wys), ox);
    } else wymiarPionowy(Y(y0 + n.wys), Y(y0), xa, `nisza ${n.wys}`, ox);
    wymiarPionowy(Y(gora), Y(y0 + n.wys), xa, String(gora - y0 - n.wys), ox);
    wymiarPionowy(Y(y0), Y(0), xa - 16, `${y0} dół piek.`, ox);
  }
  wymiarPionowy(Y(gora), Y(0), xa - 32, String(gora), ox);
  wymiarPionowy(Y(zakresH), Y(gora), xa - 32, String(zakresH - gora), ox);
  tekst("858 blat ciągu dolnego", X(s.dlugoscMM) + 3, Y(858) - 4, 90, { align: "left", size: 6, kolor: AGD_KOLOR });

  // prawa kolumna: legenda i uwagi
  const tx = M + 560;
  const tw = W - M - tx;
  let ty = M + 44;
  doc.font("B").fontSize(9.5).fillColor(CIEMNY).text("Słupki", tx, ty);
  ty += 14;
  for (const m of slupki) {
    const n = niszaSlupka(m);
    const op = n ? `piekarnik${n.mikrofala ? " + mikrofala" : ""}, ${m.konfiguracja.liczbaSzuflad} szuflady pod, drzwi nad` : m.szerokoscMM < 400 ? "wąski — półki / blachy" : "spiżarnia — do rozrysowania";
    doc.font("R").fontSize(7.5).fillColor(CIEMNY).text(`${numer.get(m.id)} · ${m.szerokoscMM} × ${m.wysokoscMM} · ${op}`, tx, ty, { width: tw });
    ty = doc.y + 2;
  }
  if (niszaLod) {
    doc.font("R").fontSize(7.5).fillColor(AGD_KOLOR).text(`Nisza lodówki ${niszaLod.x1 - niszaLod.x0} (lodówka ${lod.szer} + ${Math.round(bokLod)} z każdej strony)`, tx, ty, { width: tw });
    ty = doc.y + 8;
  }
  doc.font("B").fontSize(8).fillColor(CIEMNY).text("Stałe z urządzeń", tx, ty);
  ty = doc.y + 2;
  const stale = [
    `Piekarnik: nisza min. ${AGD.piekarnik.nisza}; w projekcie 595 × 564; bez pleców za piekarnikiem.`,
    ...(piek && niszaSlupka(piek)!.mikrofala ? [`Mikrofala: nisza ${AGD.mikrofala.nisza}; w projekcie 362 × 564 nad półką stałą; środek drzwiczek ok. ${piek.pozycjaYMM + niszaSlupka(piek)!.dol + 613 + 181} od podłogi.`] : []),
    `Dół piekarnika ${piek ? piek.pozycjaYMM + niszaSlupka(piek)!.dol : "—"} = poziom górnej krawędzi szafek dolnych — szuflady w jednej linii.`,
    `Lodówka: ${lod.tyl} z tyłu, min. ${lod.bok} z boku zawiasów (drzwi 90°), ${lod.gora} nad — nic nie zabudowywać nad lodówką.`,
    `Lodówka wystaje ok. ${lod.gl + lod.tyl - glSlupkow - 20} przed fronty słupków (gł. ${lod.gl} z drzwiami).`,
  ];
  for (const l of stale) {
    doc.font("R").fontSize(7).fillColor(SZARY).text(`• ${l}`, tx, ty, { width: tw });
    ty = doc.y + 2;
  }
  ty += 6;
  doc.font("B").fontSize(8.5).fillColor(CIEMNY).text("Uwagi / ustalenia:", tx, ty);
  linie(tx, ty + 30, tw, H - M);
}

// ---------- Strona 2: rzut + AGD ----------
doc.addPage();
naglowek(`Ściana ${litera(s)} — rzut z góry: głębokości i otwieranie`, "Rzut z góry (ściana na górze rysunku). Strefy otwarcia drzwi lodówki i piekarnika muszą zostać wolne. Wymiary w mm.");
{
  const obszar = { x: M + 30, y: M + 60, w: 480, h: 250 };
  const zakresG = Math.max(lod.glOtwarte + lod.tyl, glSlupkow + 600) + 60;
  const sk = Math.min(obszar.w / (s.dlugoscMM + 100), obszar.h / zakresG);
  const ox = obszar.x + 20;
  const oy = obszar.y;
  const X = (x: number) => ox + x * sk;
  const Y = (g: number) => oy + g * sk; // g = odległość od ściany
  doc.moveTo(X(-80), Y(0)).lineTo(X(s.dlugoscMM + 80), Y(0)).lineWidth(2.5).strokeColor(CIEMNY).stroke();
  for (const x of [0, s.dlugoscMM]) doc.moveTo(X(x), Y(0)).lineTo(X(x), Y(zakresG - 40)).lineWidth(1.2).strokeColor(CIEMNY).stroke();
  for (const m of slupki) {
    doc.rect(X(m.pozycjaXMM), Y(0), m.szerokoscMM * sk, m.glebokoscMM * sk).lineWidth(1).fillAndStroke("#ffffff", CIEMNY);
    doc.rect(X(m.pozycjaXMM) + 1, Y(m.glebokoscMM), m.szerokoscMM * sk - 2, 18 * sk).lineWidth(0.4).fillAndStroke("#e9e6e1", SZARY);
    tekst(numer.get(m.id) ?? "", X(m.pozycjaXMM), Y(m.glebokoscMM / 2) - 5, m.szerokoscMM * sk, { font: "B", size: 9, kolor: JASNY });
    const n = niszaSlupka(m);
    if (n) {
      // drzwi piekarnika opuszczane — strefa ok. 500 przed frontem
      kreskowanie(X(m.pozycjaXMM + 3), Y(m.glebokoscMM + 18), (m.szerokoscMM - 6) * sk, 500 * sk, "#e3c7b8");
      tekst("drzwi piekarnika (opuszczane)", X(m.pozycjaXMM), Y(m.glebokoscMM + 270) - 4, m.szerokoscMM * sk, { size: 6, kolor: AGD_KOLOR });
    }
  }
  if (niszaLod) {
    const gTyl = lod.tyl;
    const gFront = lod.tyl + lod.glKorpus;
    doc.rect(X(lodX0), Y(gTyl), lod.szer * sk, lod.glKorpus * sk).lineWidth(1).strokeColor(AGD_KOLOR).stroke();
    doc.rect(X(lodX0), Y(gFront), lod.szer * sk, (lod.gl - lod.glKorpus) * sk).lineWidth(0.6).fillAndStroke("#f3e6de", AGD_KOLOR);
    tekst("lodówka", X(lodX0), Y((gTyl + gFront) / 2) - 8, lod.szer * sk, { font: "B", size: 7.5, kolor: AGD_KOLOR });
    tekst("KFN96VPEA", X(lodX0), Y((gTyl + gFront) / 2) + 2, lod.szer * sk, { size: 6.5, kolor: AGD_KOLOR });
    // skrzydła drzwi (French door) otwarte 90° — zawiasy na zewnętrznych krawędziach
    const r = lod.szer / 2;
    const gd = lod.tyl + lod.gl;
    for (const [xz, kier] of [[lodX0, 1], [lodX0 + lod.szer, -1]] as const) {
      doc.moveTo(X(xz), Y(gd)).lineTo(X(xz), Y(gd + r)).lineWidth(0.8).strokeColor(AGD_KOLOR).stroke();
      const kroki = 16;
      doc.moveTo(X(xz + kier * r), Y(gd));
      for (let i = 1; i <= kroki; i++) {
        const a = (Math.PI / 2) * (i / kroki);
        doc.lineTo(X(xz + kier * r * Math.cos(a)), Y(gd + r * Math.sin(a)));
      }
      doc.lineWidth(0.4).dash(3, { space: 2 }).strokeColor(AGD_KOLOR).stroke().undash();
    }
    przerywana(X(lodX0 - 60), Y(lod.glOtwarte + lod.tyl), X(lodX0 + lod.szer + 60), Y(lod.glOtwarte + lod.tyl), AGD_KOLOR, 0.6);
    tekst(`${lod.glOtwarte} gł. przy drzwiach otwartych (Bosch) + ${lod.tyl} od ściany`, X(lodX0) - 40, Y(lod.glOtwarte + lod.tyl) + 3, lod.szer * sk + 80, { size: 6, kolor: AGD_KOLOR });
    // wymiary głębokości
    const xw = X(niszaLod.x0) + 8;
    wymiarPionowy(Y(0), Y(gTyl), xw, String(gTyl), xw);
    wymiarPionowy(Y(gTyl), Y(gd), xw, String(lod.gl), xw);
  }
  const xk = X(s.dlugoscMM) + 14;
  wymiarPionowy(Y(0), Y(glSlupkow), xk, String(glSlupkow), X(s.dlugoscMM));
  wymiarPionowy(Y(glSlupkow), Y(glSlupkow + 18), xk + 14, "18", X(s.dlugoscMM));

  // prawa kolumna: tabela AGD
  const tx = M + 560;
  const tw = W - M - tx;
  let ty = M + 44;
  const blok = (tyt: string, wiersze: string[]) => {
    doc.font("B").fontSize(8.5).fillColor(AGD_KOLOR).text(tyt, tx, ty, { width: tw });
    ty = doc.y + 2;
    for (const w of wiersze) {
      doc.font("R").fontSize(7).fillColor(CIEMNY).text(`• ${w}`, tx, ty, { width: tw });
      ty = doc.y + 1.5;
    }
    ty += 7;
  };
  blok(AGD.piekarnik.model, [
    `Urządzenie ${AGD.piekarnik.wys} × ${AGD.piekarnik.szer} × ${AGD.piekarnik.gl} (wys. × szer. × gł.)`,
    `Nisza min. ${AGD.piekarnik.nisza}`,
    "Półka nośna pełna, przewód przez wycięcie przy plecach; bez pleców w strefie niszy.",
  ]);
  blok(AGD.mikrofala.model, [
    `Urządzenie ${AGD.mikrofala.wys} × ${AGD.mikrofala.szer} × ${AGD.mikrofala.gl} (wys. × szer. × gł.)`,
    `Nisza ${AGD.mikrofala.nisza}; ramka frontu zachodzi na półki stałe.`,
  ]);
  blok(AGD.plyta.model, [
    `Płyta ${AGD.plyta.szer} × ${AGD.plyta.gl}; otwór w blacie ${AGD.plyta.otwor}`,
    `Głębokość zabudowy ${AGD.plyta.zabudowa} mm > blat 38 — wycięcie ${AGD.plyta.otwor} także w wieńcu górnym szafki pod płytą.`,
    "Min. 12 mm między spodem płyty a szufladą (28 mm nad piekarnikiem Electrolux).",
    "Szafka pod płytą: szuflady, górna niska.",
  ]);
  blok(lod.model, [
    `${lod.wys} × ${lod.szer} × ${lod.gl} z drzwiami (korpus ${lod.glKorpus})`,
    `Odstępy: ${lod.tyl} z tyłu, ${lod.bok} z boku (drzwi 90°), ${lod.gora} nad urządzeniem`,
    `Głębokość z drzwiami otwartymi ${lod.glOtwarte}; przy pełnym otwarciu (118°) szer. ok. 1393 — drzwi przy słupkach otwierają się do 90°.`,
  ]);
  doc.font("B").fontSize(8.5).fillColor(CIEMNY).text("Uwagi / ustalenia:", tx, ty);
  linie(tx, ty + 30, tw, H - M);
  // notatki pod rzutem
  const ny = obszar.y + obszar.h + 40;
  doc.font("B").fontSize(8.5).fillColor(CIEMNY).text("Szkic / pomiary na miejscu:", M, ny);
  linie(M, ny + 26, tx - M - 20, H - M);
}

doc.end();
writeFileSync(wyjscie, await koniec);
console.log(`${litera(s)}: ${slupki.length} słupków, nisza lodówki ${niszaLod ? niszaLod.x1 - niszaLod.x0 : "—"} → ${wyjscie}`);
