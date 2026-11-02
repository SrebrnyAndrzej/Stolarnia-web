import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import PDFDocument from "pdfkit";
import { BRAK_KODU, grupujPoDostawcy, NAZWY_STANOW, nazwaRodzaju, type PozycjaZeStatusem, type StatusPozycjiZamowienia } from "../core/zamowienie.js";

// Lista zamówienia dla dostawcy (ST-APP-003): A4 pionowo, jedna sekcja na dostawcę, bez cen.
// Układ roboczy — wygląd do decyzji Mateusza (patrz raport ST-APP-003).

const require = createRequire(import.meta.url);
const FONTY = join(dirname(require.resolve("dejavu-fonts-ttf/package.json")), "ttf");

const TEKST = "#23201c";
const SZARY = "#6f675d";
const CZERWONY = "#b3261e";
const LINIA = "#ddd6cb";
const TLO = "#f4f1ec";

export interface WejscieZamowieniaPdf {
  projekt: { id: string; nazwa: string; rewizja: number };
  zrodlo: { rodzaj: "wydanie" | "rewizja"; rewizja: number; numer?: number };
  wariant: string;
  pozycje: PozycjaZeStatusem[];
  ostrzezenia: string[];
  firma: string;
  data: Date;
}

const liczba = (v: number) => v.toLocaleString("pl-PL", { maximumFractionDigits: 2 });

export function zamowieniePdf(w: WejscieZamowieniaPdf): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false, info: { Title: `Zamówienie — ${w.projekt.nazwa}` } });
  doc.registerFont("R", join(FONTY, "DejaVuSans.ttf"));
  doc.registerFont("B", join(FONTY, "DejaVuSans-Bold.ttf"));
  const bufory: Buffer[] = [];
  doc.on("data", (b: Buffer) => bufory.push(b));
  const koniec = new Promise<Buffer>((ok) => doc.on("end", () => ok(Buffer.concat(bufory))));

  const W = 595.28;
  const H = 841.89;
  const L = 36;
  const P = W - 36;
  const zrodlo = w.zrodlo.rodzaj === "wydanie" ? `wydanie ${w.zrodlo.numer} (rew. ${w.zrodlo.rewizja})` : `bieżąca rewizja ${w.zrodlo.rewizja} — bez wydania`;
  // Kolumny: ☐ | Kod | Nazwa | Ilość | Status
  const K = { box: L, kod: L + 16, nazwa: L + 126, ilosc: L + 380, status: L + 450 };
  const szer = { kod: 106, nazwa: 250, ilosc: 66, status: P - (L + 450) };
  let y = 0;
  let strona = 0;

  const stopka = () => {
    doc.font("R").fontSize(7).fillColor(SZARY);
    doc.text(`${w.firma} · Zamówienie · ${w.projekt.nazwa} · ${zrodlo}`, L, H - 24, { width: P - L - 40, lineBreak: false });
    doc.text(String(strona), P - 40, H - 24, { width: 40, align: "right", lineBreak: false });
  };
  const nowaStrona = () => {
    if (strona) stopka();
    doc.addPage();
    strona += 1;
    y = 36;
  };
  const naglowekTabeli = () => {
    doc.rect(L, y, P - L, 16).fill(TLO);
    doc.font("B").fontSize(7.5).fillColor(SZARY);
    doc.text("Kod / SKU", K.kod, y + 4.5, { width: szer.kod, lineBreak: false });
    doc.text("Nazwa", K.nazwa, y + 4.5, { width: szer.nazwa, lineBreak: false });
    doc.text("Ilość", K.ilosc, y + 4.5, { width: szer.ilosc, align: "right", lineBreak: false });
    doc.text("Status", K.status + 8, y + 4.5, { width: szer.status - 8, lineBreak: false });
    y += 18;
  };
  const miejsce = (h: number) => {
    if (y + h > H - 40) {
      nowaStrona();
      naglowekTabeli();
    }
  };

  nowaStrona();
  doc.font("B").fontSize(18).fillColor(TEKST).text("Zamówienie materiałów i okuć", L, y, { width: P - L });
  y += 26;
  doc.font("R").fontSize(9).fillColor(SZARY);
  doc.text(`${w.projekt.nazwa} · ${zrodlo} · okucia z wariantu ${w.wariant} · ${w.data.toLocaleDateString("pl-PL")}`, L, y, { width: P - L });
  y += 16;
  for (const o of w.ostrzezenia) {
    doc.font("R").fontSize(8).fillColor(CZERWONY);
    const h = doc.heightOfString(`! ${o}`, { width: P - L });
    doc.text(`! ${o}`, L, y, { width: P - L });
    y += h + 2;
  }
  y += 8;

  for (const g of grupujPoDostawcy(w.pozycje)) {
    miejsce(60);
    doc.moveTo(L, y).lineTo(P, y).lineWidth(0.8).strokeColor(TEKST).stroke();
    y += 6;
    doc.font("B").fontSize(11.5).fillColor(TEKST).text(g.dostawca, L, y, { width: P - L });
    y += 18;
    naglowekTabeli();
    for (const p of g.pozycje) {
      const s = p.status as Partial<StatusPozycjiZamowienia> & { stan: StatusPozycjiZamowienia["stan"] };
      const opis = [nazwaRodzaju(p.rodzaj), p.nazwa, p.dekor && !p.nazwa.includes(p.dekor) ? p.dekor : "", p.gruboscMM ? `${liczba(p.gruboscMM)} mm` : "", p.format ? `ark. ${p.format}` : ""].filter(Boolean).join(" · ");
      const dodatki = [p.m2 ? `${liczba(p.m2)} m²` : "", p.nettoM ? `netto ${liczba(p.nettoM)} mb` : "", ...p.uwagi, s.uwagi ?? ""].filter(Boolean).join(" · ");
      const statusTxt = [NAZWY_STANOW[s.stan], s.dataZamowienia ? `zam. ${s.dataZamowienia}` : "", s.stan === "czesciowo" && s.iloscDostarczona !== undefined ? `jest ${liczba(s.iloscDostarczona)}` : "", s.dataDostawy ? `dost. ${s.dataDostawy}` : "", p.doDomowienia ? `domówić ${liczba(p.doDomowienia)}` : ""].filter(Boolean).join(" · ");
      doc.font("R").fontSize(8.5);
      const hNazwa = doc.heightOfString(opis, { width: szer.nazwa });
      doc.fontSize(7);
      const hDod = dodatki ? doc.heightOfString(dodatki, { width: szer.nazwa }) : 0;
      const hStatus = doc.heightOfString(statusTxt, { width: szer.status - 8 });
      const h = Math.max(hNazwa + (hDod ? hDod + 2 : 0), hStatus, 12) + 6;
      miejsce(h);
      doc.rect(K.box, y + 1, 9, 9).lineWidth(0.7).strokeColor(TEKST).stroke();
      if (p.kod) doc.font("B").fontSize(8.5).fillColor(TEKST).text(p.kod, K.kod, y, { width: szer.kod });
      else doc.font("B").fontSize(8.5).fillColor(CZERWONY).text(BRAK_KODU, K.kod, y, { width: szer.kod });
      doc.font("R").fontSize(8.5).fillColor(TEKST).text(opis, K.nazwa, y, { width: szer.nazwa });
      if (dodatki) doc.fontSize(7).fillColor(SZARY).text(dodatki, K.nazwa, y + hNazwa + 2, { width: szer.nazwa });
      doc.font("B").fontSize(9).fillColor(TEKST).text(`${liczba(p.ilosc)} ${p.jednostka}`, K.ilosc, y, { width: szer.ilosc, align: "right" });
      doc.font("R").fontSize(7).fillColor(s.stan === "brak" ? CZERWONY : SZARY).text(statusTxt, K.status + 8, y + 1, { width: szer.status - 8 });
      y += h;
      doc.moveTo(L, y - 3).lineTo(P, y - 3).lineWidth(0.4).strokeColor(LINIA).stroke();
    }
    y += 12;
  }
  stopka();
  doc.end();
  return koniec;
}
