// Rysunki montażowe (A3) z modelu zabudowy w JSON (docs/montaz/*.json):
// aksonometria każdej ściany, widok frontów i wnętrza z wymiarami, rzut z głębokościami,
// karta montażu (kolejność, pozycje, formatki do skompletowania) i lista rzeczy do potwierdzenia.
//
// Użycie: npx tsx scripts/rysunki-montazowe.ts <model.json> <wyjście.pdf>
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import PDFDocument from "pdfkit";

const require = createRequire(import.meta.url);
const FONTY = join(dirname(require.resolve("dejavu-fonts-ttf/package.json")), "ttf");

interface Front { kod: string; typ: "drzwi" | "szuflada" | "blenda"; x: number; y: number; szer: number; wys: number; material: string }
interface Wnetrze { typ: "polka" | "reling" | "szufladaWewn" | "blat" | "strefa"; y: number; wys?: number; x?: number; szer?: number; opis?: string }
interface Element {
  kod: string; nazwa: string; typ?: "korpus" | "panel"; x: number; y: number; szer: number; wys: number; gl: number; material: string;
  fronty?: Front[]; wnetrze?: Wnetrze[]; formatki?: string[]; uwagi?: string[]; pewnosc?: string;
}
interface Sciana { id: string; pomieszczenie: string; nazwa: string; dlugosc: number; wysokosc: number; lewyKoniec: string; prawyKoniec: string; uwagi: string[]; elementy: Element[] }
interface Model { tytul: string; zrodla: string[]; materialy: Record<string, { nazwa: string; kolor: string }>; sciany: Sciana[]; doPotwierdzenia: string[] }

const TEKST = "#1f1c18";
const SZARY = "#6b645b";
const LINIA = "#cfc7bb";
const WYMIAR = "#2d5c8a";
const UWAGA = "#b3261e";
const WNETRZE = "#d9d4cb";

const W = 1190.55; // A3 poziomo
const H = 841.89;
const M = 36;

// pdfkit przyjmuje kolory jako #rrggbb (nie rgb()).
function mieszaj(hex: string, fn: (v: number) => number): string {
  const n = parseInt(hex.slice(1), 16);
  return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(Math.max(0, Math.min(255, fn(v)))).toString(16).padStart(2, "0")).join("");
}
const rozjasnij = (hex: string, f: number) => mieszaj(hex, (v) => v + (255 - v) * f);
const przyciemnij = (hex: string, f: number) => mieszaj(hex, (v) => v * (1 - f));

export function rysunkiMontazowe(model: Model): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A3", layout: "landscape", margin: M, autoFirstPage: false, bufferPages: true, info: { Title: model.tytul } });
  doc.registerFont("R", join(FONTY, "DejaVuSans.ttf"));
  doc.registerFont("B", join(FONTY, "DejaVuSans-Bold.ttf"));
  doc.registerFont("C", join(FONTY, "DejaVuSansCondensed.ttf"));
  const bufory: Buffer[] = [];
  doc.on("data", (b: Buffer) => bufory.push(b));
  const koniec = new Promise<Buffer>((ok) => doc.on("end", () => ok(Buffer.concat(bufory))));
  const data = new Date().toLocaleDateString("pl-PL");
  const kolor = (m: string) => model.materialy[m]?.kolor ?? "#dddddd";

  const naglowek = (tytul: string, pod?: string): number => {
    doc.font("R").fontSize(8.5).fillColor(SZARY).text(`${model.tytul} · ${data}`, W - M - 420, M - 4, { width: 420, align: "right" });
    doc.font("B").fontSize(20).fillColor(TEKST).text(tytul, M, M - 8, { width: W - 2 * M - 430 });
    if (pod) doc.font("R").fontSize(9.5).fillColor(SZARY).text(pod, M, doc.y + 2, { width: W - 2 * M });
    const y = Math.max(M + 30, doc.y + 6);
    doc.moveTo(M, y).lineTo(W - M, y).lineWidth(0.6).strokeColor(LINIA).stroke();
    return y + 14;
  };

  // ---------- rysowanie wymiarów ----------
  const wymiarPoziomy = (x1: number, x2: number, y: number, tekst: string, yRef?: number) => {
    doc.lineWidth(0.5).strokeColor(WYMIAR);
    if (yRef !== undefined) {
      doc.moveTo(x1, yRef).lineTo(x1, y + 3).stroke();
      doc.moveTo(x2, yRef).lineTo(x2, y + 3).stroke();
    }
    doc.moveTo(x1, y).lineTo(x2, y).stroke();
    for (const x of [x1, x2]) doc.moveTo(x - 2.5, y + 2.5).lineTo(x + 2.5, y - 2.5).stroke();
    const sz = x2 - x1;
    doc.font("C").fontSize(sz < 22 ? 5.5 : 7).fillColor(WYMIAR).text(tekst, x1 - 10, y - 9, { width: sz + 20, align: "center", lineBreak: false });
  };
  const wymiarPionowy = (y1: number, y2: number, x: number, tekst: string, xRef?: number) => {
    doc.lineWidth(0.5).strokeColor(WYMIAR);
    if (xRef !== undefined) {
      doc.moveTo(xRef, y1).lineTo(x - 3, y1).stroke();
      doc.moveTo(xRef, y2).lineTo(x - 3, y2).stroke();
    }
    doc.moveTo(x, y1).lineTo(x, y2).stroke();
    for (const y of [y1, y2]) doc.moveTo(x - 2.5, y + 2.5).lineTo(x + 2.5, y - 2.5).stroke();
    doc.save();
    doc.rotate(-90, { origin: [x - 4, (y1 + y2) / 2] });
    doc.font("C").fontSize(Math.abs(y2 - y1) < 22 ? 5.5 : 7).fillColor(WYMIAR).text(tekst, x - 4 - 40, (y1 + y2) / 2 - 8, { width: 80, align: "center", lineBreak: false });
    doc.restore();
  };

  // ---------- aksonometria (rzut ukośny: głębokość w lewo-w dół) ----------
  function aksonometria(s: Sciana, bx: number, by: number, bw: number, bh: number) {
    const gMax = Math.max(600, ...s.elementy.map((e) => e.gl));
    const kx = Math.cos((35 * Math.PI) / 180) * 0.55;
    const ky = Math.sin((35 * Math.PI) / 180) * 0.55;
    const zasiegX = s.dlugosc + gMax * kx;
    const zasiegY = s.wysokosc + gMax * ky;
    const sk = Math.min(bw / zasiegX, bh / zasiegY);
    const ox = bx + gMax * kx * sk + (bw - zasiegX * sk) / 2;
    const oy = by + bh - (bh - zasiegY * sk) / 2;
    const P = (x: number, y: number, z: number): [number, number] => [ox + (x - z * kx) * sk, oy - (y - z * ky) * sk];
    const wielokat = (pkt: [number, number][], wyp: string, obrys = TEKST, grub = 0.5) => {
      doc.moveTo(...pkt[0]);
      pkt.slice(1).forEach((p) => doc.lineTo(...p));
      doc.closePath().lineWidth(grub).fillAndStroke(wyp, obrys);
    };
    // ściana i podłoga
    wielokat([P(0, 0, 0), P(s.dlugosc, 0, 0), P(s.dlugosc, s.wysokosc, 0), P(0, s.wysokosc, 0)], "#ecebe8", "#bdb7ad");
    wielokat([P(0, 0, 0), P(s.dlugosc, 0, 0), P(s.dlugosc, 0, gMax + 200), P(0, 0, gMax + 200)], "#e3ddd2", "#bdb7ad");
    for (const e of [...s.elementy].sort((a, b) => a.x - b.x || a.y - b.y)) {
      const [x0, x1, y0, y1, z1] = [e.x, e.x + e.szer, e.y, e.y + e.wys, e.gl];
      const k = kolor(e.material);
      if (e.typ === "panel") {
        wielokat([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], k);
        wielokat([P(x0, y1, 0), P(x1, y1, 0), P(x1, y1, z1), P(x0, y1, z1)], rozjasnij(k, 0.25));
        wielokat([P(x1, y0, 0), P(x1, y1, 0), P(x1, y1, z1), P(x1, y0, z1)], przyciemnij(k, 0.2));
        continue;
      }
      // cokół / nogi
      if (y0 > 0) wielokat([P(x0 + 10, 0, z1 - 60), P(x1 - 10, 0, z1 - 60), P(x1 - 10, y0, z1 - 60), P(x0 + 10, y0, z1 - 60)], "#5b5550");
      // korpus: górna i boczna ściana, front jako rama z wnętrzem
      wielokat([P(x0, y1, 0), P(x1, y1, 0), P(x1, y1, z1), P(x0, y1, z1)], rozjasnij(k, 0.3));
      wielokat([P(x1, y0, 0), P(x1, y1, 0), P(x1, y1, z1), P(x1, y0, z1)], przyciemnij(k, 0.12));
      wielokat([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], k);
      const t = 18;
      wielokat([P(x0 + t, y0 + t, z1), P(x1 - t, y0 + t, z1), P(x1 - t, y1 - t, z1), P(x0 + t, y1 - t, z1)], WNETRZE, "#a9a298", 0.4);
      for (const w of e.wnetrze ?? []) {
        if (w.typ === "polka" || w.typ === "blat") {
          const xa = w.typ === "blat" ? e.x + (w.x ?? 0) : x0 + t;
          const xb = w.typ === "blat" ? xa + (w.szer ?? e.szer) : x1 - t;
          const yy = y0 + w.y;
          wielokat([P(xa, yy, z1), P(Math.min(xb, x1 - t), yy, z1), P(Math.min(xb, x1 - t), yy + 18, z1), P(xa, yy + 18, z1)], w.typ === "blat" ? "#f7f6f2" : k, "#8f887e", 0.4);
        }
        if (w.typ === "reling") {
          const [a, b] = [P(x0 + t, y0 + w.y, z1 - 250), P(x1 - t, y0 + w.y, z1 - 250)];
          doc.moveTo(...a).lineTo(...b).lineWidth(1.4).strokeColor("#8a8a8a").stroke();
        }
      }
      for (const f of e.fronty ?? []) {
        const fz = z1 + 18;
        const fk = kolor(f.material);
        wielokat([P(x0 + f.x, y0 + f.y, fz), P(x0 + f.x + f.szer, y0 + f.y, fz), P(x0 + f.x + f.szer, y0 + f.y + f.wys, fz), P(x0 + f.x, y0 + f.y + f.wys, fz)], fk, przyciemnij(fk, 0.45), 0.5);
        // krawędź górna frontu (grubość) — daje efekt bryły
        wielokat([P(x0 + f.x, y0 + f.y + f.wys, fz - 18), P(x0 + f.x + f.szer, y0 + f.y + f.wys, fz - 18), P(x0 + f.x + f.szer, y0 + f.y + f.wys, fz), P(x0 + f.x, y0 + f.y + f.wys, fz)], rozjasnij(fk, 0.3), przyciemnij(fk, 0.45), 0.3);
      }
      const [lx, ly] = P((x0 + x1) / 2, y1, z1 / 2);
      doc.font("B").fontSize(7).fillColor(TEKST).text(e.kod, lx - 40, ly - 12, { width: 80, align: "center", lineBreak: false });
    }
  }

  // ---------- widok (elewacja) ----------
  function widok(s: Sciana, tryb: "fronty" | "wnetrze", bx: number, by: number, bw: number, bh: number) {
    const marL = 44;
    const marD = 58;
    const sk = Math.min((bw - marL - 10) / s.dlugosc, (bh - marD - 10) / s.wysokosc);
    const ox = bx + marL;
    const oy = by + 10 + s.wysokosc * sk;
    const X = (x: number) => ox + x * sk;
    const Y = (y: number) => oy - y * sk;
    // ściana
    doc.rect(X(0), Y(s.wysokosc), s.dlugosc * sk, s.wysokosc * sk).lineWidth(0.4).dash(3, { space: 2 }).strokeColor("#9c958a").stroke().undash();
    doc.moveTo(X(-150), Y(0)).lineTo(X(s.dlugosc + 150), Y(0)).lineWidth(1.4).strokeColor(TEKST).stroke();
    for (const e of s.elementy) {
      const [x0, y0] = [X(e.x), Y(e.y + e.wys)];
      const [w, h] = [e.szer * sk, e.wys * sk];
      if (e.typ === "panel") {
        doc.rect(x0, y0, w, h).lineWidth(0.7).fillAndStroke(rozjasnij(kolor(e.material), 0.55), TEKST);
        doc.font("C").fontSize(6.5).fillColor(TEKST).text(e.kod.replace(/^N-0\d-/, ""), x0, y0 + h / 2 - 4, { width: w, align: "center", lineBreak: false });
        continue;
      }
      if (e.y > 0) doc.rect(X(e.x + 10), Y(e.y), (e.szer - 20) * sk, e.y * sk).lineWidth(0.4).fillAndStroke("#9a948c", "#6d675f");
      doc.rect(x0, y0, w, h).lineWidth(0.9).fillAndStroke("#ffffff", TEKST);
      const t = 18 * sk;
      if (tryb === "wnetrze" || !(e.fronty ?? []).length) {
        doc.rect(x0 + t, y0 + t, w - 2 * t, h - 2 * t).lineWidth(0.3).strokeColor("#8f887e").stroke();
        for (const q of e.wnetrze ?? []) {
          if (q.typ === "polka") doc.rect(x0 + t, Y(e.y + q.y + 18), w - 2 * t, 18 * sk).lineWidth(0.3).fillAndStroke("#e6e1d8", "#6d675f");
          if (q.typ === "blat") doc.rect(X(e.x + (q.x ?? 0)), Y(e.y + q.y + 18), Math.min((q.szer ?? e.szer) * sk, w), 18 * sk).lineWidth(0.5).fillAndStroke("#cfc7bb", TEKST);
          if (q.typ === "reling") {
            doc.moveTo(x0 + t, Y(e.y + q.y)).lineTo(x0 + w - t, Y(e.y + q.y)).lineWidth(1.2).strokeColor("#555").stroke();
            doc.circle(x0 + t + 2, Y(e.y + q.y), 1.4).fill("#555");
            doc.circle(x0 + w - t - 2, Y(e.y + q.y), 1.4).fill("#555");
          }
          if (q.typ === "szufladaWewn" || q.typ === "strefa") {
            const hh = (q.wys ?? 200) * sk;
            doc.rect(x0 + t + 3, Y(e.y + q.y) - hh, w - 2 * t - 6, hh).lineWidth(0.5).dash(2.5, { space: 1.5 }).strokeColor(q.typ === "strefa" ? UWAGA : "#555").stroke().undash();
            doc.font("C").fontSize(5.8).fillColor(q.typ === "strefa" ? UWAGA : "#555").text(q.typ === "strefa" ? q.opis ?? "" : "szuflada wewn.", x0 + t, Y(e.y + q.y) - hh / 2 - 3, { width: w - 2 * t, align: "center", lineBreak: false });
          }
        }
      }
      if (tryb === "fronty")
        for (const f of e.fronty ?? []) {
          const fx = X(e.x + f.x);
          const fy = Y(e.y + f.y + f.wys);
          doc.rect(fx, fy, f.szer * sk, f.wys * sk).lineWidth(0.8).fillAndStroke(rozjasnij(kolor(f.material), 0.6), przyciemnij(kolor(f.material), 0.3));
          if (f.typ === "szuflada") {
            doc.moveTo(fx + 3, fy + f.wys * sk - 3).lineTo(fx + (f.szer * sk) / 2, fy + 3).lineTo(fx + f.szer * sk - 3, fy + f.wys * sk - 3).lineWidth(0.35).dash(2, { space: 1.5 }).strokeColor(SZARY).stroke().undash();
          }
          doc.font("C").fontSize(6).fillColor(TEKST).text(`${f.kod.replace(/^N-0\d-/, "")}\n${f.szer}×${f.wys}`, fx, fy + (f.wys * sk) / 2 - 7, { width: f.szer * sk, align: "center" });
        }
      doc.font("B").fontSize(6.8).fillColor(TEKST).text(e.kod, x0, y0 - 9, { width: w, align: "center", lineBreak: false });
    }
    // Wymiary: łańcuch szerokości pod podłogą + całość + odległości od ścian
    const korp = [...s.elementy].filter((e) => e.y < 1000 || e.typ !== "panel").sort((a, b) => a.x - b.x);
    const rzad = korp.filter((e, i, a) => a.findIndex((q) => q.x === e.x) === i);
    const y1 = oy + 16;
    let poprz = 0;
    for (const e of rzad) {
      if (e.x > poprz + 1) wymiarPoziomy(X(poprz), X(e.x), y1, String(e.x - poprz), oy);
      wymiarPoziomy(X(e.x), X(e.x + e.szer), y1, String(e.szer), oy);
      poprz = Math.max(poprz, e.x + e.szer);
    }
    if (poprz < s.dlugosc - 1) wymiarPoziomy(X(poprz), X(s.dlugosc), y1, String(s.dlugosc - poprz), oy);
    wymiarPoziomy(X(0), X(s.dlugosc), y1 + 18, `${s.dlugosc} (ściana)`, oy);
    doc.font("R").fontSize(6.5).fillColor(SZARY).text(`← ${s.lewyKoniec}`, X(0), y1 + 30, { lineBreak: false });
    doc.text(`${s.prawyKoniec} →`, X(s.dlugosc) - 200, y1 + 30, { width: 200, align: "right", lineBreak: false });
    // Wymiary pionowe: poziomy charakterystyczne pierwszego elementu z frontami
    const poziomy = new Set<number>([0, s.wysokosc]);
    for (const e of s.elementy) {
      poziomy.add(e.y);
      poziomy.add(e.y + e.wys);
      if (tryb === "fronty") for (const f of e.fronty ?? []) poziomy.add(e.y + f.y + f.wys + (f.typ === "szuflada" ? 0 : 0));
      if (tryb === "wnetrze") for (const q of e.wnetrze ?? []) if (q.typ === "blat") poziomy.add(e.y + q.y + 18);
    }
    const lista = [...poziomy].filter((v) => v >= 0 && v <= s.wysokosc).sort((a, b) => a - b);
    const lista2 = lista.filter((v, i) => i === 0 || v - lista[i - 1] >= 30);
    for (let i = 1; i < lista2.length; i++) wymiarPionowy(Y(lista2[i]), Y(lista2[i - 1]), ox - 14, String(lista2[i] - lista2[i - 1]), ox);
    wymiarPionowy(Y(s.wysokosc), Y(0), ox - 32, `${s.wysokosc}`, ox);
  }

  // ---------- rzut (pasek) ----------
  function rzut(s: Sciana, bx: number, by: number, bw: number, bh: number) {
    const gMax = Math.max(...s.elementy.map((e) => e.gl), 400);
    const sk = Math.min((bw - 50) / s.dlugosc, (bh - 30) / (gMax + 300));
    const ox = bx + 30;
    const oy = by + 8;
    doc.rect(ox, oy - 8, s.dlugosc * sk, 8).fillAndStroke("#b9b2a6", "#6d675f");
    for (const e of s.elementy) {
      const gl = e.typ === "panel" ? Math.max(e.gl, 18) : e.gl;
      doc.rect(ox + e.x * sk, oy, e.szer * sk, gl * sk).lineWidth(0.6).fillAndStroke(e.typ === "panel" ? rozjasnij(kolor(e.material), 0.4) : "#ffffff", TEKST);
      if (e.typ !== "panel") {
        const fr = (e.fronty ?? []).length;
        if (fr) doc.rect(ox + e.x * sk + 1, oy + gl * sk, e.szer * sk - 2, 18 * sk).fill(kolor(e.fronty![0].material));
        doc.font("C").fontSize(6).fillColor(TEKST).text(e.kod.replace(/^N-0\d-/, ""), ox + e.x * sk, oy + (gl * sk) / 2 - 3, { width: e.szer * sk, align: "center", lineBreak: false });
      }
    }
    const gl = Math.max(...s.elementy.map((e) => e.gl));
    if (gl > 100) wymiarPionowy(oy, oy + gl * sk, ox - 12, String(gl), ox);
    doc.font("R").fontSize(7).fillColor(SZARY).text("RZUT (widok z góry) — ściana u góry, fronty na dole", ox, oy + gl * sk + 22, { lineBreak: false });
  }

  // ---------- strona tytułowa ----------
  doc.addPage();
  doc.rect(0, 0, W, 10).fill("#9a6b3f");
  doc.font("B").fontSize(30).fillColor(TEKST).text("Rysunki montażowe zabudowy", M, 60);
  doc.font("R").fontSize(15).fillColor(SZARY).text(model.tytul, M, 100);
  let y = 140;
  doc.font("B").fontSize(11).fillColor(TEKST).text("Źródła", M, y);
  y += 16;
  for (const z of model.zrodla) {
    doc.font("R").fontSize(9.5).fillColor(TEKST).text(`•  ${z}`, M, y, { width: 560 });
    y = doc.y + 3;
  }
  y += 10;
  doc.font("B").fontSize(11).fillColor(TEKST).text("Zawartość", M, y);
  y += 16;
  for (const s of model.sciany) {
    doc.font("R").fontSize(9.5).fillColor(TEKST).text(`•  ${s.pomieszczenie} — ${s.nazwa}`, M, y, { width: 560 });
    y = doc.y + 3;
  }
  y += 10;
  doc.font("B").fontSize(11).fillColor(TEKST).text("Kolejność montażu (zasady ogólne)", M, y);
  y += 16;
  const kroki = [
    "Sprawdź wymiary ścian, pion i poziom; wyznacz linię poziomu i położenie korpusów wg wymiarów od ścian (widoki poniżej).",
    "Skompletuj formatki każdego korpusu wg karty montażu (kody z etykiet). Skręć korpus: boki + wieniec dolny i górny, plecy HDF.",
    "Ustaw korpusy na cokole/nogach, wypoziomuj. Montuj w kolejności z karty (od narożnika lub od ściany stałej).",
    "Skręć sąsiednie korpusy ze sobą przez boki (złączki / wkręty), zakotw do ściany przy wieńcu górnym.",
    "Wyposaż wnętrza: podpórki i półki, relingi, prowadnice i szuflady wewnętrzne.",
    "Załóż fronty (zawiasy, prowadnice), wyreguluj szczeliny i linie frontów w całym rzędzie; uchwyty krawędziowe wg projektu.",
    "Panele, blendy, maskownice, oświetlenie LED; końcowa regulacja i czyszczenie.",
  ];
  kroki.forEach((k, i) => {
    doc.font("R").fontSize(9.5).fillColor(TEKST).text(`${i + 1}.  ${k}`, M, y, { width: 560 });
    y = doc.y + 3;
  });
  // Legenda
  let ly = 140;
  const lx = 660;
  doc.font("B").fontSize(11).fillColor(TEKST).text("Legenda", lx, ly);
  ly += 20;
  const leg = (rys: () => void, opis: string) => {
    rys();
    doc.font("R").fontSize(9).fillColor(TEKST).text(opis, lx + 60, ly + 3, { width: 420 });
    ly += 30;
  };
  leg(() => doc.rect(lx, ly, 44, 20).lineWidth(0.9).fillAndStroke("#ffffff", TEKST), "Korpus (płyta biała 18 mm) — obrys i kod korpusu");
  leg(() => doc.rect(lx, ly, 44, 20).lineWidth(0.8).fillAndStroke(rozjasnij(model.materialy.franklin?.kolor ?? "#8b5e3c", 0.6), przyciemnij(model.materialy.franklin?.kolor ?? "#8b5e3c", 0.3)), "Front / panel Franklin Tobacco — kod formatki i wymiar gotowy (szer × wys)");
  leg(() => {
    doc.rect(lx, ly, 44, 20).lineWidth(0.8).fillAndStroke("#f2e6dc", "#6d4a2f");
    doc.moveTo(lx + 3, ly + 17).lineTo(lx + 22, ly + 3).lineTo(lx + 41, ly + 17).lineWidth(0.35).dash(2, { space: 1.5 }).strokeColor(SZARY).stroke().undash();
  }, "Front szuflady (wysuwany)");
  leg(() => doc.rect(lx, ly + 7, 44, 5).fillAndStroke("#e6e1d8", "#6d675f"), "Półka (widok wnętrza)");
  leg(() => doc.rect(lx + 3, ly, 38, 20).lineWidth(0.5).dash(2.5, { space: 1.5 }).strokeColor("#555").stroke().undash(), "Szuflada wewnętrzna (za drzwiami)");
  leg(() => doc.moveTo(lx, ly + 10).lineTo(lx + 44, ly + 10).lineWidth(1.2).strokeColor("#555").stroke(), "Reling na wieszaki");
  leg(() => wymiarPoziomy(lx, lx + 44, ly + 12, "600"), "Wymiar [mm] — łańcuchy od lewej krawędzi ściany, poziomy od podłogi");
  leg(() => doc.font("B").fontSize(12).fillColor(UWAGA).text("!", lx + 18, ly), "Czerwone uwagi / pewność „średnia”, „niska” — sprawdzić przed montażem");

  // ---------- strony ścian ----------
  for (const s of model.sciany) {
    // 1) aksonometria + rzut + uwagi
    doc.addPage();
    let y0 = naglowek(`${s.pomieszczenie} — ${s.nazwa}`, `Wizualizacja aksonometryczna (bez sufitu) · długość ściany ${s.dlugosc} mm, wysokość ${s.wysokosc} mm`);
    aksonometria(s, M, y0, 760, H - y0 - 60);
    let uy = y0;
    const ux = M + 790;
    doc.font("B").fontSize(11).fillColor(TEKST).text("Uwagi montażowe", ux, uy);
    uy += 16;
    for (const u of s.uwagi) {
      doc.font("R").fontSize(8.6).fillColor(TEKST).text(`•  ${u}`, ux, uy, { width: W - M - ux });
      uy = doc.y + 4;
    }
    const niepewne = s.elementy.filter((e) => e.pewnosc && e.pewnosc !== "wysoka");
    if (niepewne.length) {
      uy += 4;
      doc.font("B").fontSize(9).fillColor(UWAGA).text(`Do potwierdzenia: ${niepewne.map((e) => `${e.kod} (${e.pewnosc})`).join(", ")}`, ux, uy, { width: W - M - ux });
      uy = doc.y + 8;
    }
    rzut(s, ux - 10, Math.max(uy + 14, H - 250), W - M - ux + 10, 190);

    // 2) widoki frontów i wnętrza
    doc.addPage();
    y0 = naglowek(`${s.pomieszczenie} — widoki z wymiarami`, `${s.nazwa} · wymiary w mm · widok od strony pomieszczenia`);
    const pw = (W - 2 * M - 20) / 2;
    doc.font("B").fontSize(10).fillColor(TEKST).text("WIDOK FRONTÓW", M, y0);
    doc.text("WIDOK WNĘTRZA (bez frontów)", M + pw + 20, y0);
    widok(s, "fronty", M, y0 + 16, pw, H - y0 - 70);
    widok(s, "wnetrze", M + pw + 20, y0 + 16, pw, H - y0 - 70);

    // 3) karta montażu
    doc.addPage();
    y0 = naglowek(`${s.pomieszczenie} — karta montażu`, `${s.nazwa} · kolejność montażu od lewej krawędzi ściany (${s.lewyKoniec})`);
    const kol = [M, M + 30, M + 150, M + 320, M + 450, M + 640, M + 820];
    const nagl = ["LP", "KOD", "NAZWA", "POŁOŻENIE [mm]", "WYMIARY sz×wys×gł", "FRONTY / WNĘTRZE", "FORMATKI DO SKOMPLETOWANIA · UWAGI"];
    doc.font("B").fontSize(7.8).fillColor(SZARY);
    nagl.forEach((t, i) => doc.text(t, kol[i], y0, { width: (kol[i + 1] ?? W - M) - kol[i] - 6, lineBreak: false }));
    let ty = y0 + 14;
    [...s.elementy].sort((a, b) => a.x - b.x || a.y - b.y).forEach((e, i) => {
      const fronty = (e.fronty ?? []).map((f) => `${f.typ === "drzwi" ? "drzwi" : f.typ} ${f.szer}×${f.wys}`);
      const wn = (e.wnetrze ?? []).reduce<Record<string, number>>((acc, q) => ((acc[q.typ] = (acc[q.typ] ?? 0) + 1), acc), {});
      const nazwyWn: Record<string, string> = { polka: "półki", reling: "reling", szufladaWewn: "szuflady wewn.", blat: "blat", strefa: "strefa urządzeń" };
      const kolumny = [
        String(i + 1),
        e.kod,
        e.nazwa,
        `x = ${e.x} od lewej\ny = ${e.y} od podłogi`,
        `${e.szer} × ${e.wys} × ${e.gl}`,
        [...fronty, ...Object.entries(wn).map(([k, n]) => `${nazwyWn[k] ?? k}: ${n}`)].join("\n") || "—",
        [...(e.formatki ?? []), ...(e.uwagi ?? []).map((u) => `! ${u}`)].join("\n"),
      ];
      const wysokosci = kolumny.map((t, j) => doc.font(j === 1 ? "B" : "R").fontSize(8).heightOfString(t, { width: (kol[j + 1] ?? W - M) - kol[j] - 6 }));
      const hWiersza = Math.max(...wysokosci) + 8;
      if (ty + hWiersza > H - 40) {
        doc.addPage();
        ty = naglowek(`${s.pomieszczenie} — karta montażu (cd.)`);
      }
      if (i % 2 === 0) doc.rect(M - 4, ty - 3, W - 2 * M + 8, hWiersza).fill("#f4f1ec");
      kolumny.forEach((t, j) => {
        doc.font(j === 1 ? "B" : "R").fontSize(8).fillColor(j === 6 && t.includes("!") ? TEKST : TEKST).text(t, kol[j], ty, { width: (kol[j + 1] ?? W - M) - kol[j] - 6 });
      });
      if (e.pewnosc && e.pewnosc !== "wysoka") doc.font("B").fontSize(7).fillColor(UWAGA).text(`pewność: ${e.pewnosc}`, kol[2], ty + wysokosci[2] + 1, { lineBreak: false });
      ty += hWiersza;
    });
  }

  // ---------- do potwierdzenia ----------
  doc.addPage();
  y = naglowek("Do potwierdzenia przed montażem", "Założenia przyjęte w rysunkach — źródła ich nie rozstrzygają.");
  model.doPotwierdzenia.forEach((t, i) => {
    doc.rect(M, y + 1, 9, 9).lineWidth(0.8).strokeColor(TEKST).stroke();
    doc.font("R").fontSize(10).fillColor(TEKST).text(`${i + 1}. ${t}`, M + 18, y, { width: W - 2 * M - 18 });
    y = doc.y + 8;
  });

  const zakres = doc.bufferedPageRange();
  for (let i = 0; i < zakres.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    doc.font("R").fontSize(7.5).fillColor(SZARY).text(`${model.tytul} · rysunki montażowe · dokument roboczy`, M, H - 22, { lineBreak: false });
    doc.text(`${i + 1} / ${zakres.count}`, W - M - 60, H - 22, { width: 60, align: "right", lineBreak: false });
  }
  doc.end();
  return koniec;
}

if (process.argv[1]?.endsWith("rysunki-montazowe.ts")) {
  const [wejscie, wyjscie] = process.argv.slice(2);
  const model = JSON.parse(readFileSync(wejscie, "utf8")) as Model;
  writeFileSync(wyjscie, await rysunkiMontazowe(model));
  console.log(`${model.sciany.length} ścian, ${model.sciany.reduce((s, w) => s + w.elementy.length, 0)} elementów → ${wyjscie}`);
}
