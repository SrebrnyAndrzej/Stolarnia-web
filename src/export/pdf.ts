import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import PDFDocument from "pdfkit";
import { obrysModulu, scianyNaRzucie, granice } from "../core/geometry.js";
import type { Czesc, DokumentacjaProjektu, Operacja, Projekt, StatusCzesci, ZbudowanyModul } from "../core/types.js";

// Pakiet dokumentacji produkcyjnej w PDF (wektorowo): strona tytułowa ze statusem, rzut i elewacje kuchni,
// indeks części, karta każdego mebla i rysunek wykonawczy każdej części z tabelą operacji.
// Wszystko z jednej rewizji — generator dostaje gotową DokumentacjaProjektu.

const require = createRequire(import.meta.url);
const FONTY = join(dirname(require.resolve("dejavu-fonts-ttf/package.json")), "ttf");
const MM = 72 / 25.4; // pt na mm papieru
const SKALE = [1, 2, 5, 10, 20, 25, 50];
const KOLOR_STATUSU: Record<StatusCzesci, string> = { gotowa: "#2f6b3a", robocza: "#8a5a00", brakDanych: "#b3261e" };
const NAZWA_STATUSU: Record<StatusCzesci, string> = { gotowa: "gotowa", robocza: "robocza (reguły niezatwierdzone)", brakDanych: "BRAK DANYCH" };
const OBRZEZE: Record<string, string> = { brak: "—", abs08: "ABS 0,8", abs20: "ABS 2,0" };
const SKROT_OP: Record<string, string> = {
  "Konfirmat — przelot w licu": "konfirmat lico",
  "Konfirmat — otwór w krawędzi": "konfirmat kraw.",
  "Podpórka półki": "podpórka",
  "Puszka zawiasu": "puszka zaw.",
  "Prowadnik zawiasu": "prowadnik",
};

export interface WejsciePdf {
  projekt: Projekt;
  zbudowane: ZbudowanyModul[];
  dokumentacja: DokumentacjaProjektu;
  firma?: string;
  /** ID lub etykiety części — tylko ich rysunki zamiast pełnego pakietu. */
  tylkoCzesci?: string[];
  /** ID szafek — tylko ich strony (dokumentacja pojedynczej szafki). */
  tylkoModuly?: string[];
  /** Skrócone karty szafek bez osobnych rysunków części. Domyślnie pełny pakiet. */
  skrocony?: boolean;
}

export function dokumentacjaPdf(w: WejsciePdf): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 28, autoFirstPage: false, bufferPages: true, info: { Title: `Dokumentacja — ${w.projekt.nazwa} (rew. ${w.dokumentacja.rewizja})`, Producer: w.dokumentacja.wersjaGeneratora } });
  doc.registerFont("R", join(FONTY, "DejaVuSans.ttf"));
  doc.registerFont("B", join(FONTY, "DejaVuSans-Bold.ttf"));
  doc.registerFont("M", join(FONTY, "DejaVuSansMono.ttf"));
  const bufory: Buffer[] = [];
  doc.on("data", (b: Buffer) => bufory.push(b));
  const koniec = new Promise<Buffer>((ok, blad) => {
    doc.on("end", () => ok(Buffer.concat(bufory)));
    doc.on("error", blad);
  });

  const ctx = new Kontekst(doc, w);
  if (w.tylkoModuly?.length) {
    for (const zm of w.zbudowane.filter((z) => w.tylkoModuly!.includes(z.modul.id))) {
      ctx.szafka(zm);
      if (!w.skrocony) for (const c of w.dokumentacja.czesci.filter((c) => c.modulId === zm.modul.id)) ctx.czesc(c);
    }
    if (!doc.bufferedPageRange().count) ctx.brak("Nie znaleziono wskazanej szafki w tej rewizji projektu.");
  } else if (w.tylkoCzesci?.length) {
    // Rysunki wybranych części (np. z zaznaczenia w 3D) — ta sama rewizja i format co pełny pakiet.
    for (const c of w.dokumentacja.czesci.filter((x) => w.tylkoCzesci!.includes(x.id) || w.tylkoCzesci!.includes(x.etykieta))) ctx.czesc(c);
    if (!doc.bufferedPageRange().count) ctx.brak("Nie znaleziono wskazanych części w tej rewizji projektu.");
  } else {
    ctx.stronaTytulowa();
    ctx.kuchnia();
    ctx.indeks();
    // Karta zbiorcza oraz osobne rysunki wszystkich części tej samej rewizji.
    for (const zm of w.zbudowane) {
      ctx.szafka(zm);
      if (!w.skrocony) for (const c of w.dokumentacja.czesci.filter((c) => c.modulId === zm.modul.id)) ctx.czesc(c);
    }
  }
  ctx.stopki();
  doc.end();
  return koniec;
}

class Kontekst {
  private strona = 0;
  private readonly m = 28;
  private get W() {
    return this.doc.page.width;
  }
  private get H() {
    return this.doc.page.height;
  }

  constructor(
    private doc: PDFKit.PDFDocument,
    private w: WejsciePdf,
  ) {}

  private get d() {
    return this.w.dokumentacja;
  }

  private nowaStrona(tytul: string, podtytul = "", format: "A4" | "A3" = "A4") {
    this.doc.addPage({ size: format, layout: "landscape", margin: this.m });
    this.strona += 1;
    const { doc, m } = this;
    doc.font("B").fontSize(13).fillColor("#000").text(tytul, m, m, { width: this.W - 2 * m - 250 });
    if (podtytul) doc.font("R").fontSize(8.5).fillColor("#555").text(podtytul, m, m + 17, { width: this.W - 2 * m - 250 });
    // Blok rewizji w prawym górnym rogu
    const x = this.W - m - 230;
    doc.lineWidth(0.6).strokeColor("#000").rect(x, m - 4, 230, 34).stroke();
    doc.font("R").fontSize(7).fillColor("#000");
    doc.text(`${this.w.projekt.nazwa}`, x + 5, m - 1, { width: 220, lineBreak: false, ellipsis: true });
    doc.text(`Rewizja ${this.d.rewizja} · ${new Date(this.d.wygenerowano).toLocaleString("pl-PL")} · jednostki: mm`, x + 5, m + 9, { width: 220 });
    doc.fillColor(this.d.gotowaDoProdukcji ? KOLOR_STATUSU.gotowa : KOLOR_STATUSU.brakDanych).font("B")
      .text(this.d.gotowaDoProdukcji ? "GOTOWA DO PRODUKCJI" : "DOKUMENT ROBOCZY — NIE DO PRODUKCJI", x + 5, m + 19, { width: 220 });
    doc.fillColor("#000");
  }

  brak(tekst: string) {
    this.nowaStrona("Brak danych");
    this.doc.font("R").fontSize(10).text(tekst, this.m, this.m + 60);
  }

  stopki() {
    const zakres = this.doc.bufferedPageRange();
    for (let i = zakres.start; i < zakres.start + zakres.count; i++) {
      this.doc.switchToPage(i);
      // Stopka leży w dolnym marginesie — bez zerowania marginesu pdfkit dodałby nową stronę.
      this.doc.page.margins.bottom = 0;
      this.doc.font("R").fontSize(7).fillColor("#666")
        .text(`${this.w.firma ? this.w.firma + " · " : ""}Stolarnia Online ${this.d.wersjaGeneratora} · projekt ${this.d.projektId} · strona ${i + 1}/${zakres.count}`, this.m, this.H - 20, { width: this.W - 2 * this.m, align: "center", lineBreak: false });
    }
  }

  // ---------- Strona tytułowa ----------

  stronaTytulowa() {
    const { doc, m } = this;
    const p = this.w.projekt;
    this.nowaStrona("Dokumentacja produkcyjna", `Wygenerowano z rewizji ${this.d.rewizja} projektu — wszystkie rysunki i zestawienia pochodzą z tej samej rewizji.`);
    let y = m + 50;
    doc.font("B").fontSize(20).text(p.nazwa, m, y, { width: 380 });
    y = doc.y + 14;
    doc.font("R").fontSize(10);
    for (const [k, v] of [
      ["Klient", p.klient.nazwa || "—"],
      ["Status projektu", p.status],
      ["Mebli", String(this.w.zbudowane.length)],
      ["Części", String(this.d.czesci.length)],
      ["Pozycji produkcyjnych (unikalnych)", String(this.d.pozycjeProdukcyjne.length)],
      ["Operacji obróbki", String(this.d.podsumowanie.operacje)],
      ["Części: gotowe / robocze / brak danych", `${this.d.podsumowanie.gotowa} / ${this.d.podsumowanie.robocza} / ${this.d.podsumowanie.brakDanych}`],
      ["Części bez wierceń (jawnie)", String(this.d.podsumowanie.bezWiercen)],
    ]) {
      doc.font("R").fillColor("#555").text(k, m, y, { width: 220 });
      doc.font("B").fillColor("#000").text(v, m + 230, y);
      y += 15;
    }
    y += 10;
    const gotowa = this.d.gotowaDoProdukcji;
    doc.rect(m, y, 380, 44).fillColor(gotowa ? "#e7f3ea" : "#fbe9e7").fill();
    doc.fillColor(gotowa ? KOLOR_STATUSU.gotowa : KOLOR_STATUSU.brakDanych).font("B").fontSize(13)
      .text(gotowa ? "Pakiet gotowy do produkcji" : "Dokument roboczy — nie do produkcji", m + 10, y + 8);
    doc.font("R").fontSize(8).text(gotowa ? "Wszystkie reguły zatwierdzone, brak braków danych." : "Pakiet zawiera reguły niezatwierdzone lub brakujące dane okuć — patrz diagnostyka.", m + 10, y + 26, { width: 360 });
    doc.fillColor("#000");

    // Diagnostyka
    const x2 = 440;
    let y2 = m + 50;
    doc.font("B").fontSize(11).text("Diagnostyka", x2, y2);
    y2 += 16;
    const kolejnosc = ["blad", "brakDanych", "niesprawdzone", "ostrzezenie", "info"] as const;
    const kolor: Record<string, string> = { blad: "#b3261e", brakDanych: "#b3261e", niesprawdzone: "#8a5a00", ostrzezenie: "#8a5a00", info: "#555" };
    const etyk: Record<string, string> = { blad: "BŁĄD", brakDanych: "BRAK DANYCH", niesprawdzone: "NIESPRAWDZONE", ostrzezenie: "OSTRZEŻENIE", info: "INFO" };
    const diag = [...this.d.diagnostyka].sort((a, b) => kolejnosc.indexOf(a.poziom) - kolejnosc.indexOf(b.poziom));
    if (!diag.length) doc.font("R").fontSize(8).text("Brak diagnostyk w sprawdzanym zakresie.", x2, y2);
    for (const dg of diag) {
      const tekst = `${dg.opis}${dg.poprawa ? " → " + dg.poprawa : ""}${dg.obiekty.length ? ` (${dg.obiekty.length} cz.)` : ""}`;
      const h = doc.font("R").fontSize(7.5).heightOfString(tekst, { width: this.W - m - x2 - 70 });
      if (y2 + h > this.H - 40) {
        this.nowaStrona("Diagnostyka (cd.)");
        y2 = m + 50;
      }
      doc.font("B").fontSize(7).fillColor(kolor[dg.poziom]).text(etyk[dg.poziom], x2, y2, { width: 66 });
      doc.font("R").fontSize(7.5).fillColor("#000").text(tekst, x2 + 68, y2, { width: this.W - m - x2 - 70 });
      y2 += h + 4;
    }
  }

  // ---------- Kuchnia: rzut i elewacje ----------

  kuchnia() {
    const { doc, m } = this;
    const p = this.w.projekt;
    const idx = new Map(this.w.zbudowane.map((z, i) => [z.modul.id, i + 1]));
    for (const pom of p.pomieszczenia) {
      this.nowaStrona(`Rzut z góry — ${pom.nazwa}`, "Szafki dolne: linia ciągła, wiszące: przerywana. Numery = numery mebli w dokumentacji.");
      const sc = scianyNaRzucie(pom);
      const g = granice(sc, 300);
      const obszar = { x: m, y: m + 50, w: this.W - 2 * m, h: this.H - m - 90 };
      const n = skala(g.w, g.h, obszar.w / MM, obszar.h / MM, [10, 20, 25, 50, 100]);
      const s = MM / n;
      const ox = obszar.x + (obszar.w - g.w * s) / 2 - g.x * s;
      const oy = obszar.y + (obszar.h - g.h * s) / 2 - g.y * s;
      doc.font("R").fontSize(8).text(`Skala 1:${n}`, m, m + 36);
      for (const w of sc) {
        doc.lineWidth(3).strokeColor("#444").moveTo(ox + w.x1 * s, oy + w.y1 * s).lineTo(ox + w.x2 * s, oy + w.y2 * s).stroke();
        const mx = (w.x1 + w.x2) / 2 - w.nx * 180;
        const my = (w.y1 + w.y2) / 2 - w.ny * 180;
        doc.font("R").fontSize(7).fillColor("#000").text(`${w.sciana.nazwa} ${w.sciana.dlugoscMM}`, ox + mx * s - 50, oy + my * s - 4, { width: 100, align: "center" });
      }
      for (const m2 of p.moduly) {
        const w = sc.find((q) => q.sciana.id === m2.scianaId);
        if (!w) continue;
        const pts = obrysModulu(w, m2);
        const wisz = m2.pozycjaYMM >= 1000;
        doc.lineWidth(0.7).strokeColor("#000");
        if (wisz) doc.dash(3, { space: 2 });
        doc.polygon(...pts.map(([x, y]) => [ox + x * s, oy + y * s] as [number, number])).stroke();
        doc.undash();
        const cx = pts.reduce((a, q) => a + q[0], 0) / 4;
        const cy = pts.reduce((a, q) => a + q[1], 0) / 4;
        doc.font("B").fontSize(7).fillColor(wisz ? "#666" : "#000").text(String(idx.get(m2.id) ?? ""), ox + cx * s - 10, oy + cy * s - (wisz ? 10 : 3), { width: 20, align: "center" });
      }
      doc.fillColor("#000");

      for (const sciana of pom.sciany) this.elewacja(sciana.id, idx);
    }
  }

  private elewacja(scianaId: string, idx: Map<string, number>) {
    const { doc, m } = this;
    const sc = this.w.projekt.pomieszczenia.flatMap((r) => r.sciany).find((s) => s.id === scianaId)!;
    const zb = this.w.zbudowane.filter((z) => z.modul.scianaId === scianaId);
    if (!zb.length) return;
    this.nowaStrona(`Elewacja — ${sc.nazwa}`, "Widok od strony pomieszczenia. Wymiary w mm od lewego końca ściany i od podłogi.");
    const obszar = { x: m + 20, y: m + 60, w: this.W - 2 * m - 40, h: this.H - m - 120 };
    const n = skala(sc.dlugoscMM, sc.wysokoscMM, obszar.w / MM, obszar.h / MM, [10, 20, 25, 50]);
    const s = MM / n;
    const X = (x: number) => obszar.x + x * s;
    const Y = (y: number) => obszar.y + obszar.h - y * s;
    doc.font("R").fontSize(8).text(`Skala 1:${n}`, m, m + 36);
    doc.lineWidth(0.8).strokeColor("#888").rect(X(0), Y(sc.wysokoscMM), sc.dlugoscMM * s, sc.wysokoscMM * s).stroke();
    for (const z of zb) {
      const md = z.modul;
      doc.lineWidth(0.8).strokeColor("#000");
      for (const e of z.elementy.filter((q) => q.rola === "front" || q.rola === "filler" || q.rola === "worktop")) {
        doc.rect(X(md.pozycjaXMM + e.x), Y(md.pozycjaYMM + e.y + e.wys), e.szer * s, e.wys * s).stroke();
      }
      if (md.konstrukcja !== "dishwasherFront") doc.lineWidth(0.4).strokeColor("#666").rect(X(md.pozycjaXMM), Y(md.pozycjaYMM + md.wysokoscMM), md.szerokoscMM * s, md.wysokoscMM * s).stroke();
      doc.font("B").fontSize(8).fillColor("#000").text(String(idx.get(md.id)), X(md.pozycjaXMM + md.szerokoscMM / 2) - 10, Y(md.pozycjaYMM + md.wysokoscMM / 2) - 4, { width: 20, align: "center" });
      // wymiar szerokości i pozycji
      const wy = md.pozycjaYMM >= 1000 ? Y(md.pozycjaYMM + md.wysokoscMM) - 12 : Y(0) + 8;
      wymiarPoziomy(doc, X(md.pozycjaXMM), X(md.pozycjaXMM + md.szerokoscMM), wy, String(md.szerokoscMM));
    }
    wymiarPoziomy(doc, X(0), X(sc.dlugoscMM), Y(sc.wysokoscMM) - 16, String(sc.dlugoscMM));
  }

  // ---------- Indeks ----------

  indeks() {
    const kol = [
      { t: "Etykieta", w: 70 },
      { t: "Mebel", w: 150 },
      { t: "Element", w: 80 },
      { t: "Materiał", w: 150 },
      { t: "Gotowy dł×szer×gr", w: 110 },
      { t: "Cięcie dł×szer", w: 80 },
      { t: "Oper.", w: 35 },
      { t: "Status", w: 110 },
    ];
    const wiersze = this.d.czesci.map((c) => [
      c.etykieta,
      c.nazwaModulu,
      c.kodElementu,
      c.materialOpis,
      `${f(c.dlugoscMM)}×${f(c.szerokoscMM)}×${f(c.gruboscMM)}`,
      c.kupowana ? "kupowana" : `${f(c.dlugoscCieciaMM)}×${f(c.szerokoscCieciaMM)}`,
      c.bezWiercen ? "bez" : String(c.operacje.length),
      NAZWA_STATUSU[c.status],
    ]);
    this.tabela("Indeks części", this.w.skrocony ? "Wydruk skrócony: karty zbiorcze szafek, bez osobnych rysunków części." : "Każda wykonywana część ma własny rysunek w dalszej części pakietu.", kol, wiersze, (i) => KOLOR_STATUSU[this.d.czesci[i].status]);
  }

  private tabela(tytul: string, podtytul: string, kol: { t: string; w: number }[], wiersze: string[][], kolorOstatniej?: (i: number) => string, y0?: number) {
    const { doc, m } = this;
    let y = y0 ?? m + 50;
    if (y0 === undefined) this.nowaStrona(tytul, podtytul);
    const naglowek = () => {
      let x = m;
      doc.font("B").fontSize(7).fillColor("#000");
      for (const k of kol) {
        doc.text(k.t, x + 2, y, { width: k.w - 4 });
        x += k.w;
      }
      y += 11;
      doc.lineWidth(0.5).strokeColor("#000").moveTo(m, y - 2).lineTo(m + kol.reduce((a, k) => a + k.w, 0), y - 2).stroke();
    };
    naglowek();
    wiersze.forEach((w, i) => {
      const h = Math.max(...w.map((t, j) => doc.font("R").fontSize(7).heightOfString(t, { width: kol[j].w - 4 }))) + 3;
      if (y + h > this.H - 34) {
        this.nowaStrona(`${tytul} (cd.)`);
        y = m + 50;
        naglowek();
      }
      let x = m;
      w.forEach((t, j) => {
        const ost = j === w.length - 1 && kolorOstatniej;
        doc.font(ost ? "B" : "R").fontSize(7).fillColor(ost ? kolorOstatniej(i) : "#000").text(t, x + 2, y, { width: kol[j].w - 4 });
        x += kol[j].w;
      });
      y += h;
      doc.lineWidth(0.2).strokeColor("#bbb").moveTo(m, y - 1).lineTo(x, y - 1).stroke();
    });
    doc.fillColor("#000");
    return y;
  }

  // ---------- Mebel ----------

  mebel(zm: ZbudowanyModul) {
    const { doc, m } = this;
    const md = zm.modul;
    const nr = this.w.zbudowane.indexOf(zm) + 1;
    this.nowaStrona(`Mebel ${nr}: ${md.nazwa}`, `Gabaryt korpusu ${md.szerokoscMM} × ${md.wysokoscMM} × ${md.glebokoscMM} mm (szer. × wys. × gł., bez frontów i blatu). Pozycja: X ${md.pozycjaXMM}, spód ${md.pozycjaYMM} nad podłogą.`);
    const obszarH = this.H - m - 250;
    const n = skala(md.szerokoscMM + md.glebokoscMM + 200, md.wysokoscMM + 100, (this.W - 2 * m) / MM, obszarH / MM, [5, 10, 20, 25]);
    const s = MM / n;
    doc.font("R").fontSize(8).text(`Skala 1:${n}`, m, m + 36);
    const baseY = m + 60 + (md.wysokoscMM + 60) * s;
    // Widok z przodu (bez frontów przerywanie, fronty ciągłą)
    const x0 = m + 20;
    doc.font("B").fontSize(8).text("Widok z przodu", x0, m + 48);
    for (const e of zm.elementy.filter((q) => q.rola !== "worktop")) {
      const front = e.rola === "front" || e.rola === "filler";
      doc.lineWidth(front ? 0.9 : 0.4).strokeColor(front ? "#000" : "#777");
      if (!front) doc.dash(2, { space: 1.5 });
      doc.rect(x0 + e.x * s, baseY - (e.y + e.wys) * s, e.szer * s, e.wys * s).stroke();
      doc.undash();
    }
    wymiarPoziomy(doc, x0, x0 + md.szerokoscMM * s, baseY + 10, String(md.szerokoscMM));
    wymiarPionowy(doc, x0 - 10, baseY - md.wysokoscMM * s, baseY, String(md.wysokoscMM));
    // Przekrój boczny (Z–Y): wszystkie części poza frontami
    const x1 = x0 + md.szerokoscMM * s + 80;
    doc.font("B").fontSize(8).text("Przekrój boczny (front z lewej)", x1, m + 48);
    for (const e of zm.elementy.filter((q) => q.rola !== "worktop" && q.rola !== "side")) {
      doc.lineWidth(e.rola === "front" ? 0.9 : 0.5).strokeColor(e.rola === "back" ? "#999" : "#000");
      doc.rect(x1 + (e.z + 30) * s, baseY - (e.y + e.wys) * s, Math.max(e.gl * s, 0.5), e.wys * s).stroke();
    }
    doc.lineWidth(0.3).strokeColor("#aaa").rect(x1 + 30 * s, baseY - md.wysokoscMM * s, md.glebokoscMM * s, md.wysokoscMM * s).stroke();
    wymiarPoziomy(doc, x1 + 30 * s, x1 + (30 + md.glebokoscMM) * s, baseY + 10, String(md.glebokoscMM));

    // Lista części i okuć
    const czesci = this.d.czesci.filter((c) => c.modulId === md.id);
    const kol = [
      { t: "Etykieta", w: 70 },
      { t: "Element", w: 90 },
      { t: "Materiał", w: 170 },
      { t: "Gotowy dł×szer×gr", w: 120 },
      { t: "Obrzeża DA/DB/KA/KB", w: 150 },
      { t: "Oper.", w: 40 },
      { t: "Status", w: 130 },
    ];
    const y = this.tabela(
      "",
      "",
      kol,
      czesci.map((c) => [c.etykieta, c.kodElementu, c.materialOpis, `${f(c.dlugoscMM)}×${f(c.szerokoscMM)}×${f(c.gruboscMM)}`, c.obrzeza.map((o) => OBRZEZE[o]).join(" / "), c.bezWiercen ? "bez" : String(c.operacje.length), NAZWA_STATUSU[c.status]]),
      (i) => KOLOR_STATUSU[czesci[i].status],
      Math.max(baseY + 30, m + 60),
    );
    let yy = y + 8;
    if (yy > this.H - 60) {
      this.nowaStrona(`Mebel ${nr}: okucia i montaż`);
      yy = m + 50;
    }
    doc.font("B").fontSize(8).fillColor("#000").text("Okucia i montaż", m, yy);
    yy += 11;
    const okucia = zm.okucia.map((o) => `${o.typ}: ${o.ilosc} — ${o.opis}`);
    const diag = this.d.diagnostyka.filter((dg) => dg.obiekty.some((id) => czesci.some((c) => c.id === id))).map((dg) => `[${dg.poziom}] ${dg.opis}`);
    doc.font("R").fontSize(7.5).text([...okucia, ...diag].join("\n") || "—", m, yy, { width: this.W - 2 * m });
  }

  // ---------- Zbiorcza karta szafki (A4, tabela może mieć kontynuację) ----------

  szafka(zm: ZbudowanyModul) {
    const { doc, m } = this;
    const md = zm.modul;
    const nr = this.w.zbudowane.indexOf(zm) + 1;
    const czesci = this.d.czesci.filter((c) => c.modulId === md.id);
    const nazwaStr = `Szafka ${nr}: ${md.nazwa}`;
    this.nowaStrona(
      nazwaStr,
      `Korpus ${md.szerokoscMM} × ${md.wysokoscMM} × ${md.glebokoscMM} mm (szer. × wys. × gł., bez frontów i blatu) · X ${md.pozycjaXMM}, spód ${md.pozycjaYMM} · ${czesci.length} formatek, ${czesci.reduce((a, c) => a + c.operacje.length, 0)} operacji`,
    );
    // Układ strony liczony ręcznie — tekst w dolnym pasie nie może wywołać automatycznej nowej strony.
    doc.page.margins.bottom = 0;
    const W = this.W;
    const H = this.H;
    const tabW = 318;
    const lewaW = W - 2 * m - tabW - 12;
    const top = m + 42;

    // --- Widoki: z przodu i przekrój boczny ---
    const widokH = 118;
    const n = skala(md.szerokoscMM + md.glebokoscMM + 250, md.wysokoscMM + 60, lewaW / MM, widokH / MM, [5, 10, 20, 25, 50]);
    const s = MM / n;
    const baseY = top + 14 + md.wysokoscMM * s;
    const x0 = m + 16;
    doc.font("B").fontSize(7.5).fillColor("#000").text(`Widok z przodu · 1:${n}`, x0, top);
    for (const e of zm.elementy.filter((q) => q.rola !== "worktop")) {
      const front = e.rola === "front" || e.rola === "filler";
      doc.lineWidth(front ? 0.8 : 0.35).strokeColor(front ? "#000" : "#888");
      if (!front) doc.dash(2, { space: 1.5 });
      doc.rect(x0 + e.x * s, baseY - (e.y + e.wys) * s, e.szer * s, e.wys * s).stroke();
      doc.undash();
    }
    wymiarPoziomy(doc, x0, x0 + md.szerokoscMM * s, baseY + 9, String(md.szerokoscMM));
    wymiarPionowy(doc, x0 - 9, baseY - md.wysokoscMM * s, baseY, String(md.wysokoscMM));
    const x1 = x0 + md.szerokoscMM * s + 70;
    doc.font("B").fontSize(7.5).text("Przekrój boczny (front z lewej)", x1, top);
    for (const e of zm.elementy.filter((q) => q.rola !== "worktop" && q.rola !== "side")) {
      doc.lineWidth(e.rola === "front" ? 0.8 : 0.45).strokeColor(e.rola === "back" ? "#999" : "#000");
      doc.rect(x1 + (e.z + 30) * s, baseY - (e.y + e.wys) * s, Math.max(e.gl * s, 0.5), e.wys * s).stroke();
    }
    doc.lineWidth(0.3).strokeColor("#aaa").rect(x1 + 30 * s, baseY - md.wysokoscMM * s, md.glebokoscMM * s, md.wysokoscMM * s).stroke();
    wymiarPoziomy(doc, x1 + 30 * s, x1 + (30 + md.glebokoscMM) * s, baseY + 9, String(md.glebokoscMM));
    // Etykiety formatek na przekroju/widoku pomijamy — numeracja na kartach poniżej.

    // --- Siatka formatek ---
    const siatkaY = baseY + 24;
    const dolnyPas = 64;
    const siatkaH = H - siatkaY - dolnyPas - 24;
    const liczba = Math.max(czesci.length, 1);
    let kol = 1;
    let najlepszy = 0;
    for (let c = 1; c <= liczba; c++) {
      const w = Math.ceil(liczba / c);
      const ocena = Math.min(lewaW / c, (siatkaH / w) * 1.5);
      if (ocena > najlepszy) {
        najlepszy = ocena;
        kol = c;
      }
    }
    const wierszy = Math.ceil(liczba / kol);
    const cw = lewaW / kol;
    const ch = siatkaH / wierszy;
    czesci.forEach((c, i) => this.karta(c, m + (i % kol) * cw, siatkaY + Math.floor(i / kol) * ch, cw - 6, ch - 6));

    // --- Okucia i braki (dolny pas) ---
    const okucia = zm.okucia.map((o) => `${o.typ} ×${o.ilosc}`).join(" · ");
    const braki = [...new Set(this.d.diagnostyka.filter((dg) => dg.obiekty.some((id) => czesci.some((c) => c.id === id))).map((dg) => `[${dg.poziom}] ${dg.opis.replace(`${md.nazwa}: `, "")}`))];
    doc.font("B").fontSize(7).fillColor("#000").text("Okucia:", m, H - dolnyPas - 18);
    doc.font("R").fontSize(7).text(okucia || "—", m + 38, H - dolnyPas - 18, { width: lewaW - 38 });
    doc.font("R").fontSize(6.3).fillColor("#b3261e").text(braki.join("\n") || "", m, H - dolnyPas - 6, { width: lewaW, height: dolnyPas - 8, ellipsis: true });

    // --- Tabela operacji całej szafki (1–2 kolumny, ciąg dalszy na kolejnej stronie) ---
    this.tabelaOperacji(czesci, W - m - tabW, top, tabW, H - top - 40, nazwaStr);
    this.legenda(m, H - 30, W - 2 * m);
  }

  /** Karta formatki: nagłówek, rysunek lica A z obrzeżami, otworami i rowkami (numeracja jak w tabeli). */
  private karta(c: Czesc, x: number, y: number, w: number, h: number) {
    const { doc } = this;
    doc.lineWidth(0.8).strokeColor(KOLOR_STATUSU[c.status]).rect(x, y, w, h).stroke();
    doc.font("B").fontSize(6.8).fillColor("#000").text(`${c.etykieta}  ${c.kodElementu}`, x + 4, y + 3, { width: w - 8, lineBreak: false, ellipsis: true });
    const opis = `${f(c.dlugoscMM)}×${f(c.szerokoscMM)}×${f(c.gruboscMM)}${c.kupowana ? " · kupowana" : c.dlugoscCieciaMM !== c.dlugoscMM || c.szerokoscCieciaMM !== c.szerokoscMM ? ` · cięcie ${f(c.dlugoscCieciaMM)}×${f(c.szerokoscCieciaMM)}` : ""} · ${c.materialOpis}`;
    doc.font("R").fontSize(5.8).fillColor("#333").text(opis, x + 4, y + 12, { width: w - 8, lineBreak: false, ellipsis: true });

    const obszar = { x: x + 14, y: y + 22, w: w - 32, h: h - 36 };
    // Najmniejsza całkowita skala 1:n mieszcząca rysunek (podana na karcie).
    const n = Math.max(1, Math.ceil(Math.max(c.dlugoscMM / (obszar.w / MM), c.szerokoscMM / (obszar.h / MM))));
    const s = MM / n;
    const L = c.dlugoscMM * s;
    const S = c.szerokoscMM * s;
    const ox = obszar.x + (obszar.w - L) / 2;
    const oy = obszar.y + (obszar.h + S) / 2;
    const P = (px: number, py: number): [number, number] => [ox + px * s, oy - py * s];
    doc.font("R").fontSize(5).fillColor("#666").text(`lico A · 1:${n}`, x + w - 50, y + h - 9, { width: 46, align: "right", lineBreak: false });

    doc.lineWidth(0.7).strokeColor("#000").rect(ox, oy - S, L, S).stroke();
    // Obrzeża
    const kr: [number, [number, number], [number, number]][] = [
      [0, P(0, 0), P(c.dlugoscMM, 0)],
      [1, P(0, c.szerokoscMM), P(c.dlugoscMM, c.szerokoscMM)],
      [2, P(0, 0), P(0, c.szerokoscMM)],
      [3, P(c.dlugoscMM, 0), P(c.dlugoscMM, c.szerokoscMM)],
    ];
    for (const [i, a, b] of kr) {
      const ob = c.obrzeza[i];
      if (ob !== "brak") doc.lineWidth(ob === "abs20" ? 2.2 : 1.4).strokeColor("#b36b1e").moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke();
    }
    doc.font("R").fontSize(5).fillColor("#b36b1e");
    doc.text("DA", ox + L / 2 - 5, oy + 2, { lineBreak: false }).text("DB", ox + L / 2 - 5, oy - S - 7, { lineBreak: false });
    doc.text("KA", ox - 11, oy - S / 2 - 3, { lineBreak: false }).text("KB", ox + L + 2, oy - S / 2 - 3, { lineBreak: false });
    // Początek układu
    doc.lineWidth(0.6).strokeColor("#1f5fbf").moveTo(ox, oy).lineTo(ox + 12, oy).moveTo(ox, oy).lineTo(ox, oy - 12).stroke();
    doc.font("B").fontSize(4.5).fillColor("#1f5fbf").text("0", ox - 5, oy + 0.5, { lineBreak: false });
    // Wymiary
    doc.font("R").fontSize(5.5).fillColor("#000").text(f(c.dlugoscMM), ox + L / 2 - 20, oy + 8, { width: 40, align: "center", lineBreak: false });
    doc.save().rotate(-90, { origin: [ox + L + 14, oy - S / 2] }).text(f(c.szerokoscMM), ox + L - 6, oy - S / 2 - 3, { width: 40, align: "center", lineBreak: false }).restore();

    if (c.bezWiercen) {
      doc.font("B").fontSize(7).fillColor(KOLOR_STATUSU.gotowa).text("BEZ WIERCEŃ", ox, oy - S / 2 - 4, { width: L, align: "center", lineBreak: false });
      return;
    }
    // Operacje — numer grupy jak w tabeli; etykiety pomijane, gdy zasłoniłyby sąsiednią
    const etykiety: [number, number][] = [];
    const nrGrupy = new Map<string, number>();
    grupyOperacji(c).forEach((g, gi) => g.operacje.forEach((o) => nrGrupy.set(o.id, gi + 1)));
    c.operacje.forEach((o) => {
      const i = (nrGrupy.get(o.id) ?? 0) - 1;
      let px: number;
      let py: number;
      doc.lineWidth(0.45).strokeColor(o.powierzchnia === "B" ? "#666" : "#000");
      if (o.powierzchnia === "A" || o.powierzchnia === "B") {
        [px, py] = P(o.x, o.y);
        if (o.powierzchnia === "B") doc.dash(1, { space: 0.8 });
        if (o.typ === "rowek") {
          const dl = (o.dlugosc ?? 0) * s;
          const sz = Math.max((o.szerokosc ?? 1) * s, 1);
          if (o.osRowka === "x") doc.rect(px, py - sz / 2, dl, sz).stroke();
          else doc.rect(px - sz / 2, py - dl, sz, dl).stroke();
          px += o.osRowka === "x" ? dl / 2 : 0;
          py -= o.osRowka === "y" ? dl / 2 : 0;
        } else doc.circle(px, py, Math.max(((o.srednica ?? 5) / 2) * s, 1.1)).stroke();
        doc.undash();
      } else {
        // Otwór krawędziowy: trójkąt na krawędzi skierowany do wnętrza płyty
        const wz = o.x;
        [px, py] = o.powierzchnia === "DA" ? P(wz, 0) : o.powierzchnia === "DB" ? P(wz, c.szerokoscMM) : o.powierzchnia === "KA" ? P(0, wz) : P(c.dlugoscMM, wz);
        const d = 3;
        const pkt: [number, number][] =
          o.powierzchnia === "DA" ? [[px - d, py + d], [px + d, py + d], [px, py]]
          : o.powierzchnia === "DB" ? [[px - d, py - d], [px + d, py - d], [px, py]]
          : o.powierzchnia === "KA" ? [[px - d, py - d], [px - d, py + d], [px, py]]
          : [[px + d, py - d], [px + d, py + d], [px, py]];
        doc.polygon(...pkt).fillColor("#000").fill();
      }
      if (!etykiety.some(([ex, ey]) => Math.abs(ex - px) < 7 && Math.abs(ey - py) < 6)) {
        etykiety.push([px, py]);
        doc.font("R").fontSize(4.6).fillColor("#1f5fbf").text(String(i + 1), px + 1.5, py - 6.5, { lineBreak: false });
      }
    });
    doc.fillColor("#000");
  }

  /**
   * Tabela operacji szafki pogrupowana: jeden wiersz = operacje tego samego typu, strony, średnicy, głębokości
   * i połączenia na jednej formatce. Współrzędne wszystkich otworów podane w wierszu (siatka x × y albo pary x/y).
   * Numer grupy odpowiada numerowi przy otworach na rysunku formatki.
   */
  private tabelaOperacji(czesci: Czesc[], x0: number, y0: number, szer: number, wys: number, tytul: string) {
    const { doc } = this;
    const kol = [
      { t: "Część", w: 48 },
      { t: "Gr.", w: 12 },
      { t: "Str.", w: 16 },
      { t: "Szt.", w: 14 },
      { t: "Pozycje x / y [mm]", w: szer - 48 - 12 - 16 - 14 - 24 - 22 - 48 - 34 - 8 },
      { t: "Ø/sz.", w: 24 },
      { t: "Gł.", w: 22 },
      { t: "Operacja", w: 48 },
      { t: "Łączy z", w: 34 },
      { t: "R", w: 8 },
    ];
    const fs = 5.6;
    const wiersze: { t: string[]; kolor: string; nowaCzesc: boolean }[] = [];
    for (const c of czesci) {
      if (c.bezWiercen) {
        wiersze.push({ t: [c.etykieta, "", "", "", "", "", "", "bez wierceń", "", ""], kolor: "#2f6b3a", nowaCzesc: true });
        continue;
      }
      grupyOperacji(c).forEach((g, i) => {
        const o = g.operacje[0];
        wiersze.push({
          t: [
            i === 0 ? c.etykieta : "",
            String(i + 1),
            o.powierzchnia,
            String(g.operacje.length),
            g.pozycje,
            o.typ === "rowek" ? f(o.szerokosc ?? 0) : `Ø${f(o.srednica ?? 0)}`,
            o.przelotowy ? "przelot" : f(o.glebokosc ?? 0),
            o.typ === "rowek" ? `rowek L${f(o.dlugosc ?? 0)} ${o.osRowka}` : SKROT_OP[o.przeznaczenie] ?? o.przeznaczenie,
            g.partner,
            statusSkrot(o),
          ],
          kolor: kolorReguly(o),
          nowaCzesc: i === 0,
        });
      });
      if (this.d.diagnostyka.some((dg) => dg.poziom === "brakDanych" && dg.obiekty.includes(c.id)))
        wiersze.push({ t: [c.operacje.length ? "" : c.etykieta, "", "", "", "wiercenia/obróbka okuć nieustalone — patrz braki", "", "", "BRAK DANYCH", "", "?"], kolor: "#b3261e", nowaCzesc: !c.operacje.length });
    }

    const naglowek = (y: number) => {
      let x = x0;
      doc.font("B").fontSize(6).fillColor("#000");
      for (const c of kol) {
        doc.text(c.t, x + 1, y, { width: c.w - 2, lineBreak: false });
        x += c.w;
      }
      doc.lineWidth(0.4).strokeColor("#000").moveTo(x0, y + 8).lineTo(x0 + szer, y + 8).stroke();
      return y + 10;
    };
    let y = naglowek(y0);
    for (const w of wiersze) {
      const h = Math.max(...w.t.map((t, j) => (t ? doc.font(j < 2 ? "B" : "R").fontSize(fs).heightOfString(t, { width: kol[j].w - 2 }) : 0)), fs + 1.4) + 1.2;
      if (y + h > y0 + wys) {
        doc.font("B").fontSize(6.5).fillColor("#b3261e").text("Ciąg dalszy tabeli na następnej stronie →", x0, y0 + wys, { lineBreak: false });
        this.nowaStrona(`${tytul} — operacje (cd.)`, "Ciąg dalszy tabeli operacji szafki.");
        x0 = this.m;
        y0 = this.m + 42;
        wys = this.H - y0 - 40;
        y = naglowek(y0);
      }
      if (w.nowaCzesc) doc.lineWidth(0.25).strokeColor("#999").moveTo(x0, y - 0.8).lineTo(x0 + szer, y - 0.8).stroke();
      let x = x0;
      w.t.forEach((t, j) => {
        const kolorowy = j === 9 || (j === 7 && (t === "BRAK DANYCH" || t === "bez wierceń"));
        doc.font(j === 0 || j === 1 ? "B" : "R").fontSize(fs).fillColor(kolorowy ? w.kolor : j === 1 ? "#1f5fbf" : "#000");
        doc.text(t, x + 1, y, { width: kol[j].w - 2 });
        x += kol[j].w;
      });
      y += h;
    }
    doc.fillColor("#000");
  }

  private legenda(x: number, y: number, w: number) {
    this.doc.font("R").fontSize(5.8).fillColor("#555").text(
      "Lico A — od wnętrza szafki (front: od korpusu). Lica: x od krawędzi KA, y od DA; krawędzie DA/DB: x od KA, y od lica B; KA/KB: x od DA, y od lica B. " +
        "○ otwór w licu A, przerywany — lico B, ▲ otwór w krawędzi, prostokąt — rowek. Obrzeża: brązowa linia (grubsza = ABS 2,0). Reguła: Z zatwierdzona, K katalogowa, R robocza, ? brak danych. Ramka karty: kolor statusu formatki.",
      x,
      y,
      { width: w },
    );
  }

  // ---------- Część ----------

  czesc(c: Czesc) {
    const { doc, m } = this;
    this.nowaStrona(
      `${c.etykieta} — ${c.kodElementu} (${c.nazwaModulu})`,
      `Gotowy ${f(c.dlugoscMM)} × ${f(c.szerokoscMM)} × ${f(c.gruboscMM)} mm · do cięcia ${c.kupowana ? "— (kupowana)" : `${f(c.dlugoscCieciaMM)} × ${f(c.szerokoscCieciaMM)}`} · usłojenie: ${c.kierunekDekoru === "dowolny" ? "dowolne" : "wzdłuż X"}`,
    );
    // Obszar rysunku po lewej, tabela po prawej
    const obszar = { x: m + 30, y: m + 70, w: 430, h: 330 };
    const n = skala(c.dlugoscMM, c.szerokoscMM, (obszar.w - 60) / MM, (obszar.h - 60) / MM, SKALE);
    const s = MM / n;
    const L = c.dlugoscMM * s;
    const S = c.szerokoscMM * s;
    const ox = obszar.x + 30;
    const oy = obszar.y + 30 + S; // lewy dolny róg (KA/DA) — oś y w górę
    const P = (x: number, y: number): [number, number] => [ox + x * s, oy - y * s];

    doc.font("R").fontSize(8).fillColor("#000").text(`Widok lica A (od wnętrza mebla) · skala 1:${n}`, m, m + 44);
    // Kontur
    doc.lineWidth(1).strokeColor("#000").rect(ox, oy - S, L, S).stroke();
    // Obrzeża: pogrubiona linia + opis
    const kr: [string, number, [number, number], [number, number]][] = [
      ["DA", 0, P(0, 0), P(c.dlugoscMM, 0)],
      ["DB", 1, P(0, c.szerokoscMM), P(c.dlugoscMM, c.szerokoscMM)],
      ["KA", 2, P(0, 0), P(0, c.szerokoscMM)],
      ["KB", 3, P(c.dlugoscMM, 0), P(c.dlugoscMM, c.szerokoscMM)],
    ];
    for (const [nazwa, i, a, b] of kr) {
      const ob = c.obrzeza[i];
      if (ob !== "brak") doc.lineWidth(ob === "abs20" ? 3 : 2).strokeColor("#b36b1e").moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke();
      const sx = (a[0] + b[0]) / 2;
      const sy = (a[1] + b[1]) / 2;
      const off = nazwa === "DA" ? [0, 6] : nazwa === "DB" ? [0, -14] : nazwa === "KA" ? [-26, -4] : [6, -4];
      doc.font("B").fontSize(7).fillColor("#b36b1e").text(`${nazwa}${ob !== "brak" ? " " + OBRZEZE[ob] : ""}`, sx + off[0] - (nazwa.startsWith("D") ? 25 : 0), sy + off[1], { width: 60, align: nazwa.startsWith("D") ? "center" : "left" });
    }
    // Początek układu i osie
    doc.lineWidth(0.8).strokeColor("#1f5fbf").fillColor("#1f5fbf");
    doc.moveTo(ox, oy).lineTo(ox + 26, oy).stroke().polygon([ox + 26, oy - 2.5], [ox + 31, oy], [ox + 26, oy + 2.5]).fill();
    doc.moveTo(ox, oy).lineTo(ox, oy - 26).stroke().polygon([ox - 2.5, oy - 26], [ox, oy - 31], [ox + 2.5, oy - 26]).fill();
    doc.font("B").fontSize(7).text("x", ox + 32, oy - 4).text("y", ox - 3, oy - 41).text("0", ox - 9, oy + 1);
    // Usłojenie
    if (c.kierunekDekoru !== "dowolny") {
      const [ux, uy] = P(c.dlugoscMM / 2, c.szerokoscMM / 2);
      doc.lineWidth(0.5).strokeColor("#999").moveTo(ux - 25, uy).lineTo(ux + 25, uy).stroke();
      doc.polygon([ux + 25, uy - 2], [ux + 30, uy], [ux + 25, uy + 2]).fillColor("#999").fill();
    }
    // Wymiary całkowite
    wymiarPoziomy(this.doc, ox, ox + L, oy + 22, f(c.dlugoscMM));
    wymiarPionowy(this.doc, ox + L + 22, oy - S, oy, f(c.szerokoscMM));

    // Etykiety bliskich otworów rozsuń, zachowując linię odniesienia do osi.
    const etykiety: { x: number; y: number; w: number }[] = [
      { x: ox + L / 2 - 35, y: oy + 5, w: 70 },
      { x: ox + L / 2 - 35, y: oy - S - 15, w: 70 },
      { x: ox - 12, y: oy - 5, w: 45 },
    ];
    // Operacje na licach
    const numer = new Map(c.operacje.map((o, i) => [o.id, i + 1]));
    for (const o of c.operacje.filter((q) => q.powierzchnia === "A" || q.powierzchnia === "B")) {
      const [x, y] = P(o.x, o.y);
      doc.lineWidth(0.6).strokeColor(o.powierzchnia === "A" ? "#000" : "#555").fillColor("#000");
      if (o.powierzchnia === "B") doc.dash(1.5, { space: 1 });
      if (o.typ === "rowek") {
        const dl = (o.dlugosc ?? 0) * s;
        const sz = Math.max((o.szerokosc ?? 1) * s, 1.5);
        if (o.osRowka === "x") doc.rect(x, y - sz / 2, dl, sz).stroke();
        else doc.rect(x - sz / 2, y - dl, sz, dl).stroke();
      } else {
        const r = Math.max(((o.srednica ?? 5) / 2) * s, 1.4);
        doc.circle(x, y, r).stroke();
        doc.moveTo(x - r - 1.5, y).lineTo(x + r + 1.5, y).moveTo(x, y - r - 1.5).lineTo(x, y + r + 1.5).lineWidth(0.3).stroke();
      }
      doc.undash();
      const tekst = String(numer.get(o.id));
      doc.font("R").fontSize(6);
      const w = doc.widthOfString(tekst) + 3;
      let ex = x + 3, ey = y - 12;
      szukaj: for (let poziom = 0; poziom < 30; poziom++) {
        for (const cy of [y - 12 - poziom * 11, y + 8 + poziom * 11]) {
          if (cy < m + 62 || cy + 8 > this.H - 80) continue;
          const cx = Math.max(m + 4, Math.min(x + 3, 470 - w));
          if (!etykiety.some((e) => cx < e.x + e.w + 2 && cx + w + 2 > e.x && cy < e.y + 10 && cy + 10 > e.y)) {
            ex = cx; ey = cy; break szukaj;
          }
        }
      }
      etykiety.push({ x: ex, y: ey, w });
      doc.lineWidth(0.25).strokeColor("#777").moveTo(x, y).lineTo(ex, ey + 4).stroke();
      doc.rect(ex - 1, ey - 1, w, 8).fillColor("#fff").fill();
      doc.fillColor(o.powierzchnia === "A" ? "#000" : "#555").text(tekst, ex, ey, { lineBreak: false });
    }

    // Tabela operacji
    const tx = 490;
    const kol = [
      { t: "#", w: 16 },
      { t: "Pow.", w: 24 },
      { t: "x", w: 34 },
      { t: "y", w: 30 },
      { t: "Ø / szer.", w: 36 },
      { t: "Głęb.", w: 32 },
      { t: "Przeznaczenie / połączenie", w: 103 },
      { t: "Reguła", w: 28 },
    ];
    let y = m + 50;
    if (c.bezWiercen) {
      doc.font("B").fontSize(14).fillColor(KOLOR_STATUSU.gotowa).text("BEZ WIERCEŃ", tx, y);
      y += 20;
    } else {
      const naglowek = () => {
        let x = tx;
        doc.font("B").fontSize(6.5).fillColor("#000");
        for (const k2 of kol) {
          doc.text(k2.t, x, y, { width: k2.w - 2 });
          x += k2.w;
        }
        y += Math.max(...kol.map((k2) => doc.heightOfString(k2.t, { width: k2.w - 2 }))) + 5;
      };
      naglowek();
      c.operacje.forEach((o, i) => {
        const wiersz = [
          String(i + 1),
          o.powierzchnia,
          f(o.x),
          f(o.y),
          o.typ === "rowek" ? `${f(o.szerokosc ?? 0)}` : `Ø${f(o.srednica ?? 0)}`,
          o.przelotowy ? "przelot" : f(o.glebokosc ?? 0),
          `${o.typ === "rowek" ? `Rowek dł. ${f(o.dlugosc ?? 0)} wzdłuż ${o.osRowka}. ` : ""}${o.przeznaczenie}${o.polaczenie ? " · " + o.polaczenie : ""}`,
          statusSkrot(o),
        ];
        const h = Math.max(...wiersz.map((t, j) => doc.font("R").fontSize(6.5).heightOfString(t, { width: kol[j].w - 2 }))) + 4;
        if (y + h > this.H - 90) {
          this.nowaStrona(`${c.etykieta} — operacje (cd.)`);
          y = m + 50;
          naglowek();
        }
        let x = tx;
        wiersz.forEach((t, j) => {
          doc.font("R").fontSize(6.5).fillColor(j === 7 ? kolorReguly(o) : "#000").text(t, x, y, { width: kol[j].w - 2 });
          x += kol[j].w;
        });
        y += h;
      });
    }
    // Uwagi i źródła nie mogą wypaść poza stronę ani zasłonić tabeli.
    const braki = this.d.diagnostyka.filter((dg) => dg.obiekty.includes(c.id)).map((dg) => dg.opis);
    const reguly = [...new Map(c.operacje.map((o) => [o.regula.id, o.regula])).values()];
    const uwagi = [
      `Status części: ${NAZWA_STATUSU[c.status]}`,
      `ID części: ${c.id}`,
      `Materiał: ${c.materialOpis}`,
      ...c.uwagi, ...braki,
      ...reguly.map((r) => `Reguła ${r.id}: ${r.opis}. Źródło: ${r.zrodlo}`),
    ];
    y += 12;
    const szerUwagi = this.W - m - tx;
    for (const uwaga of uwagi) {
      // Dziel również pojedynczą długą uwagę; każda kontynuacja ma nagłówek i stopkę.
      let wiersz = "";
      const linie: string[] = [];
      doc.font("R").fontSize(7);
      for (const slowo of uwaga.split(/\s+/).flatMap((slowo) => {
        const fragmenty: string[] = []; let fragment = "";
        for (const znak of slowo) {
          if (fragment && doc.widthOfString(fragment + znak) > szerUwagi) { fragmenty.push(fragment); fragment = ""; }
          fragment += znak;
        }
        if (fragment) fragmenty.push(fragment);
        return fragmenty;
      })) {
        const kandydat = wiersz ? `${wiersz} ${slowo}` : slowo;
        if (wiersz && doc.widthOfString(kandydat) > szerUwagi) { linie.push(wiersz); wiersz = slowo; }
        else wiersz = kandydat;
      }
      if (wiersz) linie.push(wiersz);
      for (const linia of linie) {
        if (y + 11 > this.H - 66) {
          this.nowaStrona(`${c.etykieta} — uwagi i źródła (cd.)`);
          y = m + 50;
        }
        doc.font("R").fontSize(7).fillColor("#000").text(linia, tx, y, { width: szerUwagi, lineBreak: false });
        y += 10;
      }
      y += 5;
    }
    this.legenda(m, this.H - 50, this.W - 2 * m);

    // Oddzielna strona krawędzi pozwala pokazać każdą powierzchnię, bez cichego pomijania.
    const krawedzie = (["DA", "DB", "KA", "KB"] as const).filter((k) => c.operacje.some((o) => o.powierzchnia === k));
    if (krawedzie.length) {
      this.nowaStrona(`${c.etykieta} — rysunki krawędzi`, `${c.kodElementu} · ${c.nazwaModulu} · numeracja operacji jak na rysunku lica i w tabeli.`);
      let ky = m + 60;
      for (const k of krawedzie) {
        const dl = k === "DA" || k === "DB" ? c.dlugoscMM : c.szerokoscMM;
        const nk = skala(dl, 1, (this.W - 2 * m - 80) / MM, 100, SKALE);
        const sk = MM / nk;
        const x0 = m + 35, hk = 28;
        doc.font("B").fontSize(9).fillColor("#000").text(`Krawędź ${k} · długość ${f(dl)} mm · grubość ${f(c.gruboscMM)} mm`, x0, ky);
        doc.font("R").fontSize(7).text(`Pozycje x w skali 1:${nk}; grubość powiększona. y od lica B.`, x0, ky + 14);
        ky += 40;
        doc.lineWidth(0.7).strokeColor("#000").rect(x0, ky, dl * sk, hk).stroke();
        for (const o of c.operacje.filter((q) => q.powierzchnia === k)) {
          const x = x0 + o.x * sk, y0 = ky + hk - o.y / c.gruboscMM * hk;
          doc.circle(x, y0, 2.5).stroke();
          doc.font("R").fontSize(7).text(String(numer.get(o.id)), x + 3, ky - 12, { lineBreak: false });
        }
        wymiarPoziomy(doc, x0, x0 + dl * sk, ky + hk + 17, f(dl));
        ky += hk + 39;
      }
      this.legenda(m, this.H - 50, this.W - 2 * m);
    }
  }
}

// ---------- Pomocnicze ----------

/**
 * Grupy operacji formatki (kolejność pierwszego wystąpienia). Pozycje: siatka „x: … · y: …”, gdy otwory tworzą
 * pełny iloczyn współrzędnych; w przeciwnym razie pary „x/y”. Rowek: początek i długość.
 */
export function grupyOperacji(c: Czesc): { operacje: Operacja[]; pozycje: string; partner: string }[] {
  const mapa = new Map<string, Operacja[]>();
  const partnerOp = (o: Operacja) => (o.polaczenie ?? "").split(" ↔ ").find((x) => x && x !== c.etykieta) ?? "";
  for (const o of c.operacje) {
    const k = [o.typ, o.powierzchnia, o.srednica, o.glebokosc, o.przelotowy, o.przeznaczenie, partnerOp(o), o.regula.id, o.dlugosc, o.szerokosc, o.osRowka].join("|");
    mapa.set(k, [...(mapa.get(k) ?? []), o]);
  }
  return [...mapa.values()].map((ops) => {
    const o = ops[0];
    let pozycje: string;
    if (o.typ === "rowek") pozycje = ops.map((q) => `od ${f(q.x)}/${f(q.y)}`).join("; ");
    else {
      const xs = [...new Set(ops.map((q) => q.x))].sort((a, b) => a - b);
      const ys = [...new Set(ops.map((q) => q.y))].sort((a, b) => a - b);
      const siatka = xs.length * ys.length === ops.length && ops.length > 1;
      pozycje = siatka ? `x: ${xs.map(f).join("; ")} · y: ${ys.map(f).join("; ")}` : ops.map((q) => `${f(q.x)}/${f(q.y)}`).join("; ");
    }
    return { operacje: ops, pozycje, partner: partnerOp(o) };
  });
}

function skala(w: number, h: number, maxW: number, maxH: number, dostepne: number[]): number {
  return dostepne.find((n) => w / n <= maxW && h / n <= maxH) ?? dostepne[dostepne.length - 1];
}

function f(v: number): string {
  return (Math.round(v * 10) / 10).toString().replace(".", ",");
}

function statusSkrot(o: Operacja): string {
  return { zatwierdzona: "Z", katalogowa: "K", robocza: "R", brakDanych: "?" }[o.regula.status];
}

function kolorReguly(o: Operacja): string {
  return { zatwierdzona: "#2f6b3a", katalogowa: "#2f6b3a", robocza: "#8a5a00", brakDanych: "#b3261e" }[o.regula.status];
}

function wymiarPoziomy(doc: PDFKit.PDFDocument, x1: number, x2: number, y: number, t: string) {
  doc.lineWidth(0.4).strokeColor("#333").moveTo(x1, y).lineTo(x2, y).stroke();
  doc.moveTo(x1, y - 3).lineTo(x1, y + 3).moveTo(x2, y - 3).lineTo(x2, y + 3).stroke();
  doc.font("R").fontSize(6.5).fillColor("#000").text(t, (x1 + x2) / 2 - 30, y - 8, { width: 60, align: "center", lineBreak: false });
}

function wymiarPionowy(doc: PDFKit.PDFDocument, x: number, y1: number, y2: number, t: string) {
  doc.lineWidth(0.4).strokeColor("#333").moveTo(x, y1).lineTo(x, y2).stroke();
  doc.moveTo(x - 3, y1).lineTo(x + 3, y1).moveTo(x - 3, y2).lineTo(x + 3, y2).stroke();
  doc.save().rotate(-90, { origin: [x, (y1 + y2) / 2] }).font("R").fontSize(6.5).fillColor("#000").text(t, x - 30, (y1 + y2) / 2 - 8, { width: 60, align: "center", lineBreak: false }).restore();
}
