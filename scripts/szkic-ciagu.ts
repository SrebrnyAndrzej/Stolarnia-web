// Rysunek szkieletowy ciągu dolnego do ręcznego szkicowania (A4 poziomo, do druku w wielu kopiach):
// rzut całości + widok każdej ściany z obrysami korpusów, cokołem, blatem, wymiarami i pustym polem na notatki.
// Fronty celowo nie są rysowane — wnętrze korpusów zostaje puste do zaznaczenia szuflad / drzwi z półkami.
//
// Użycie: npx tsx scripts/szkic-ciagu.ts <plik-bazy.json> <id-projektu> <wyjście.pdf> [kolejność ścian, np. D,A,B]
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import PDFDocument from "pdfkit";
import { punktNaRzucie, scianyNaRzucie } from "../src/core/geometry.js";
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

const [plikBazy, projektId, wyjscie, kolejnosc] = process.argv.slice(2);
const baza = JSON.parse(readFileSync(plikBazy, "utf8")) as { projekty: Projekt[] };
const p = baza.projekty.find((q) => q.id === projektId);
if (!p) throw new Error(`Brak projektu ${projektId}`);
const pom = p.pomieszczenia[0];
const litera = (s: Sciana) => s.nazwa.trim().charAt(0).toUpperCase();
const dolne = (s: Sciana) => p.moduly.filter((m) => m.scianaId === s.id && m.pozycjaYMM < 1000 && m.wysokoscMM < 1400).sort((a, b) => a.pozycjaXMM - b.pozycjaXMM);
const sciany = (kolejnosc ? kolejnosc.split(",").map((l) => pom.sciany.find((s) => litera(s) === l.trim().toUpperCase())!) : pom.sciany).filter((s) => s && dolne(s).length);

// Numery szafek: litera ściany + kolejny numer od lewej (np. A1, A2…)
const numer = new Map<string, string>();
for (const s of sciany) dolne(s).forEach((m, i) => numer.set(m.id, `${litera(s)}${i + 1}`));

// Strefy narożne: fragment ściany zajęty przez głębokość ciągu na ścianie sąsiedniej
const rzut = scianyNaRzucie(pom);
function narozniki(s: Sciana): { a0: number; a1: number; opis: string }[] {
  const i = pom.sciany.indexOf(s);
  const poprz = pom.sciany[(i + pom.sciany.length - 1) % pom.sciany.length];
  const nast = pom.sciany[(i + 1) % pom.sciany.length];
  const wynik: { a0: number; a1: number; opis: string }[] = [];
  const gl = (sc: Sciana) => Math.max(0, ...dolne(sc).map((m) => m.glebokoscMM + 20));
  // początek ściany styka się z końcem poprzedniej
  const kPoprz = dolne(poprz).find((m) => m.pozycjaXMM + m.szerokoscMM >= poprz.dlugoscMM - 5);
  const glP = gl(poprz);
  if (glP && !dolne(s).some((m) => m.pozycjaXMM < 5)) wynik.push({ a0: 0, a1: glP, opis: kPoprz ? `narożnik — szafka ${numer.get(kPoprz.id) ?? ""} ze ściany ${litera(poprz)}` : "narożnik — pusty (do ustalenia)" });
  const kNast = dolne(nast).find((m) => m.pozycjaXMM < 5);
  const glN = gl(nast);
  if (glN && !dolne(s).some((m) => m.pozycjaXMM + m.szerokoscMM >= s.dlugoscMM - 5)) wynik.push({ a0: s.dlugoscMM - glN, a1: s.dlugoscMM, opis: kNast ? `narożnik — szafka ${numer.get(kNast.id) ?? ""} ze ściany ${litera(nast)}` : "narożnik — pusty (do ustalenia)" });
  return wynik;
}

const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: M, autoFirstPage: false, info: { Title: `Szkic ciągu dolnego — ${p.nazwa}` } });
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
};
const wymiarPoziomy = (x1: number, x2: number, y: number, t: string, yRef: number) => {
  doc.lineWidth(0.5).strokeColor(WYMIAR);
  doc.moveTo(x1, yRef).lineTo(x1, y + 3).moveTo(x2, yRef).lineTo(x2, y + 3).moveTo(x1, y).lineTo(x2, y).stroke();
  for (const x of [x1, x2]) doc.moveTo(x - 2.5, y + 2.5).lineTo(x + 2.5, y - 2.5).stroke();
  doc.font("C").fontSize(x2 - x1 < 26 ? 6 : 8).fillColor(WYMIAR).text(t, x1 - 10, y - 10, { width: x2 - x1 + 20, align: "center", lineBreak: false });
};
const wymiarPionowy = (y1: number, y2: number, x: number, t: string, xRef: number) => {
  doc.lineWidth(0.5).strokeColor(WYMIAR);
  doc.moveTo(xRef, y1).lineTo(x - 3, y1).moveTo(xRef, y2).lineTo(x - 3, y2).moveTo(x, y1).lineTo(x, y2).stroke();
  for (const y of [y1, y2]) doc.moveTo(x - 2.5, y + 2.5).lineTo(x + 2.5, y - 2.5).stroke();
  doc.save().rotate(-90, { origin: [x - 5, (y1 + y2) / 2] });
  doc.font("C").fontSize(7.5).fillColor(WYMIAR).text(t, x - 45, (y1 + y2) / 2 - 9, { width: 80, align: "center", lineBreak: false });
  doc.restore();
};
const kreskowanie = (x: number, y: number, w: number, h: number, kolor = JASNY) => {
  doc.save().rect(x, y, w, h).clip();
  doc.lineWidth(0.4).strokeColor(kolor);
  for (let d = -h; d < w; d += 7) doc.moveTo(x + d, y + h).lineTo(x + d + h, y).stroke();
  doc.restore();
  doc.rect(x, y, w, h).lineWidth(0.5).dash(3, { space: 2 }).strokeColor(SZARY).stroke().undash();
};
const opisStaly = (m: Modul) => {
  const t = `${m.nazwa} ${m.uwagi ?? ""}`;
  if (/zlew/i.test(t)) return "zlew";
  if (/indukc|płyt[aęy]/i.test(t)) return "płyta indukcyjna";
  if (m.konfiguracja.systemNarozny === "lemans") return "narożnik LeMans (drzwi 45 lewe, reszta ślepa)";
  if (/zmywark/i.test(t) && !/do potwierdzenia/i.test(t)) return "zmywarka";
  return "";
};

// ---------- Strona 1: rzut całości ----------
doc.addPage();
naglowek("Ciąg dolny — rzut i numeracja szafek", "Widok z góry. Numery szafek jak na kolejnych stronach (litera ściany + numer od lewej, patrząc na ścianę z wnętrza kuchni).");
{
  const pkt = rzut.flatMap((w) => [[w.x1, w.y1], [w.x2, w.y2]]);
  const [minX, maxX] = [Math.min(...pkt.map((q) => q[0])), Math.max(...pkt.map((q) => q[0]))];
  const [minY, maxY] = [Math.min(...pkt.map((q) => q[1])), Math.max(...pkt.map((q) => q[1]))];
  doc.page.margins.bottom = 0; // etykiety ścian poza obrysem nie mogą przenosić rzutu na nową stronę
  const obszar = { x: M + 40, y: M + 70, w: 400, h: H - 2 * M - 120 };
  const sk = Math.min(obszar.w / (maxX - minX), obszar.h / (maxY - minY));
  const X = (x: number) => obszar.x + (x - minX) * sk;
  const Y = (y: number) => obszar.y + (y - minY) * sk;
  for (const w of rzut) {
    doc.moveTo(X(w.x1), Y(w.y1)).lineTo(X(w.x2), Y(w.y2)).lineWidth(3).strokeColor(CIEMNY).stroke();
    const [cx, cy] = punktNaRzucie(w, w.sciana.dlugoscMM / 2, -220);
    doc.font("B").fontSize(10).fillColor(CIEMNY).text(`${litera(w.sciana)}`, X(cx) - 10, Y(cy) - 6, { width: 20, align: "center", lineBreak: false });
  }
  for (const m of p.moduly) {
    const w = rzut.find((q) => q.sciana.id === m.scianaId);
    if (!w) continue;
    const rog = [punktNaRzucie(w, m.pozycjaXMM, 0), punktNaRzucie(w, m.pozycjaXMM + m.szerokoscMM, 0), punktNaRzucie(w, m.pozycjaXMM + m.szerokoscMM, m.glebokoscMM), punktNaRzucie(w, m.pozycjaXMM, m.glebokoscMM)];
    const dolny = numer.has(m.id);
    doc.moveTo(X(rog[0][0]), Y(rog[0][1]));
    rog.slice(1).forEach((q) => doc.lineTo(X(q[0]), Y(q[1])));
    doc.closePath().lineWidth(dolny ? 0.9 : 0.4).fillAndStroke(dolny ? "#ffffff" : "#eeebe6", dolny ? CIEMNY : JASNY);
    const [sx, sy] = punktNaRzucie(w, m.pozycjaXMM + m.szerokoscMM / 2, m.glebokoscMM / 2);
    doc.font(dolny ? "B" : "R").fontSize(dolny ? 8 : 6).fillColor(dolny ? CIEMNY : SZARY).text(dolny ? `${numer.get(m.id)}\n${m.szerokoscMM / 10}` : "słupek", X(sx) - 22, Y(sy) - (dolny ? 8 : 3), { width: 44, align: "center" });
  }
  // lista szafek
  let ty = M + 50;
  const tx = M + 480;
  doc.font("B").fontSize(10).fillColor(CIEMNY).text("Szafki ciągu dolnego", tx, ty);
  ty += 16;
  for (const s of sciany) {
    doc.font("B").fontSize(8.5).fillColor(CIEMNY).text(`Ściana ${s.nazwa}`, tx, ty);
    ty += 12;
    for (const m of dolne(s)) {
      const staly = opisStaly(m);
      doc.font("R").fontSize(8).fillColor(CIEMNY).text(`${numer.get(m.id)}  ·  ${m.szerokoscMM} mm${staly ? `  ·  ${staly}` : ""}`, tx + 8, ty, { width: W - M - tx - 8 });
      ty = doc.y + 2;
    }
    ty += 6;
  }
  doc.font("R").fontSize(7.5).fillColor(SZARY).text("Wys. szafek 720 + nóżki 100, blat 38 → 858 mm. Głębokość korpusów 560 mm. Wymiary z projektu, do weryfikacji pomiarem.", tx, ty + 6, { width: W - M - tx });
}

// ---------- Strony ścian ----------
for (const s of sciany) {
  doc.addPage();
  const mod = dolne(s);
  naglowek(`Ściana ${s.nazwa} — ciąg dolny`, "Widok z wnętrza kuchni. Wnętrze szafek puste — zaznacz: szuflady (podział i wysokości) / drzwi z półkami / inne. Wymiary w mm.");
  const obszar = { x: M + 46, y: M + 70, w: W - 2 * M - 60, h: 250 };
  const zakresH = 858 + 250; // miejsce nad blatem na dopiski
  const sk = Math.min(obszar.w / s.dlugoscMM, obszar.h / zakresH);
  const ox = obszar.x + (obszar.w - s.dlugoscMM * sk) / 2;
  const oy = obszar.y + obszar.h;
  const X = (x: number) => ox + x * sk;
  const Y = (y: number) => oy - y * sk;
  // ściana i podłoga
  doc.moveTo(X(-120), Y(0)).lineTo(X(s.dlugoscMM + 120), Y(0)).lineWidth(1.4).strokeColor(CIEMNY).stroke();
  for (const x of [0, s.dlugoscMM]) doc.moveTo(X(x), Y(0)).lineTo(X(x), Y(zakresH - 60)).lineWidth(1.2).strokeColor(CIEMNY).stroke();
  // strefy narożne
  for (const n of narozniki(s)) {
    kreskowanie(X(n.a0), Y(820), (n.a1 - n.a0) * sk, 820 * sk);
    doc.font("C").fontSize(6.5).fillColor(SZARY).text(n.opis, X(n.a0) + 2, Y(420), { width: (n.a1 - n.a0) * sk - 4, align: "center" });
  }
  let blat0 = Infinity;
  let blat1 = -Infinity;
  for (const m of mod) {
    const [x0, x1] = [X(m.pozycjaXMM), X(m.pozycjaXMM + m.szerokoscMM)];
    const [yDol, yGora] = [Y(m.pozycjaYMM), Y(m.pozycjaYMM + m.wysokoscMM)];
    // cokół
    doc.rect(x0 + 1, yDol, x1 - x0 - 2, m.pozycjaYMM * sk).lineWidth(0.4).fillAndStroke("#e9e6e1", JASNY);
    // korpus — pusty do rysowania, z delikatną podziałką co 100 mm na krawędziach
    doc.rect(x0, yGora, x1 - x0, yDol - yGora).lineWidth(1.1).strokeColor(CIEMNY).stroke();
    for (let h = 100; h < m.wysokoscMM; h += 100) {
      const yy = Y(m.pozycjaYMM + h);
      doc.moveTo(x0, yy).lineTo(x0 + 5, yy).moveTo(x1 - 5, yy).lineTo(x1, yy).lineWidth(0.4).strokeColor(JASNY).stroke();
    }
    doc.font("B").fontSize(11).fillColor(JASNY).text(numer.get(m.id) ?? "", x0, yGora + 4, { width: x1 - x0, align: "center" });
    const staly = opisStaly(m);
    if (staly) doc.font("C").fontSize(6.5).fillColor(SZARY).text(staly, x0 + 3, yDol - 12, { width: x1 - x0 - 6, align: "center" });
    if (m.konfiguracja.systemNarozny === "lemans") {
      const drzwi = 450;
      const lewe = m.konfiguracja.stronaDrzwiNaroznika === "lewa";
      const xd = lewe ? X(m.pozycjaXMM + drzwi) : X(m.pozycjaXMM + m.szerokoscMM - drzwi);
      doc.moveTo(xd, yGora).lineTo(xd, yDol).lineWidth(0.5).dash(3, { space: 2 }).strokeColor(SZARY).stroke().undash();
    }
    if (m.konfiguracja.blat) {
      blat0 = Math.min(blat0, m.pozycjaXMM);
      blat1 = Math.max(blat1, m.pozycjaXMM + m.szerokoscMM);
    }
  }
  // blat (ciągły nad szafkami z blatem)
  if (blat1 > blat0) doc.rect(X(blat0), Y(858), (blat1 - blat0) * sk, 38 * sk).lineWidth(0.6).fillAndStroke("#f1eee9", CIEMNY);
  // wymiary poziome
  const yw = oy + 16;
  let poprz = 0;
  for (const m of mod) {
    if (m.pozycjaXMM > poprz + 1) wymiarPoziomy(X(poprz), X(m.pozycjaXMM), yw, String(m.pozycjaXMM - poprz), oy);
    wymiarPoziomy(X(m.pozycjaXMM), X(m.pozycjaXMM + m.szerokoscMM), yw, String(m.szerokoscMM), oy);
    poprz = m.pozycjaXMM + m.szerokoscMM;
  }
  if (poprz < s.dlugoscMM - 1) wymiarPoziomy(X(poprz), X(s.dlugoscMM), yw, String(s.dlugoscMM - poprz), oy);
  wymiarPoziomy(X(0), X(s.dlugoscMM), yw + 20, `${s.dlugoscMM} (ściana)`, oy);
  // wymiary pionowe
  wymiarPionowy(Y(100), Y(0), ox - 14, "100", ox);
  wymiarPionowy(Y(820), Y(100), ox - 14, "720", ox);
  wymiarPionowy(Y(858), Y(820), ox - 14, "38", ox);
  wymiarPionowy(Y(858), Y(0), ox - 30, "858", ox);
  // pole notatek
  const ny = yw + 44;
  doc.font("B").fontSize(9).fillColor(CIEMNY).text("Uwagi / ustalenia:", M, ny);
  for (let yy = ny + 22; yy < H - M - 4; yy += 20) doc.moveTo(M, yy).lineTo(W - M, yy).lineWidth(0.4).strokeColor(JASNY).stroke();
}

doc.end();
writeFileSync(wyjscie, await koniec);
console.log(`${sciany.map((s) => `${litera(s)}:${dolne(s).length}`).join(" ")} → ${wyjscie}`);
