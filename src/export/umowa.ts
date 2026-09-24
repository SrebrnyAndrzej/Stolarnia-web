import PDFDocument from "pdfkit";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { Umowa } from "../core/contracts.js";

const require = createRequire(import.meta.url);
const fonts = join(dirname(require.resolve("dejavu-fonts-ttf/package.json")), "ttf");
const money = (n: number) => n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
const date = (s: string) => s ? s.split("-").reverse().join(".") : "................................";
export function umowaPdf(u: Umowa): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const d = new PDFDocument({ size: "A4", margins: { top: 100, bottom: 65, left: 48, right: 48 }, bufferPages: true, info: { Title: `Umowa ${u.numer}`, Author: u.firma } });
    const chunks: Buffer[] = [];
    d.on("data", b => chunks.push(b)); d.on("end", () => resolve(Buffer.concat(chunks))); d.on("error", reject);
    d.registerFont("R", join(fonts, "DejaVuSans.ttf")); d.registerFont("B", join(fonts, "DejaVuSans-Bold.ttf"));
    const p = (text: string) => { d.font("R").fontSize(10).fillColor("#1C2B30").text(text, { lineGap: 4 }); d.moveDown(.7); };
    d.font("B").fontSize(21).fillColor("#1C2B30").text(u.rodzaj === "kuchnia" ? "Umowa o wykonanie kuchni" : u.rodzaj === "schody" ? "Umowa o wykonanie okładziny schodów" : "Umowa o dzieło");
    d.moveDown(.5); p(`Numer: ${u.numer}\nZawarta w: ${u.miejsce || "................................"}, dnia ${date(u.data)} r.`);
    p(`ZAMAWIAJĄCY\n${u.klient}\n${u.adresKlienta}`);
    p(`WYKONAWCA\n${u.firma}\n${u.adresFirmy}\nNIP: ${u.nip}`);
    p(`MIEJSCE MONTAŻU\n${u.adresMontazu}`);
    d.font("B").fontSize(12).text("Przedmiot umowy"); d.moveDown(.4); p(u.zakres);
    d.font("B").fontSize(12).text("Wynagrodzenie i zaliczka"); d.moveDown(.4);
    p(`Cena całkowita brutto: ${money(u.cena)}\nUzgodniona zaliczka: ${money(u.zaliczka)}\nPozostało do zapłaty: ${money((Math.round(u.cena * 100) - (u.zaliczkaZaplacona ? Math.round(u.zaliczka * 100) : 0)) / 100)}`);
    p(u.zaliczkaZaplacona ? `Wykonawca potwierdza otrzymanie zaliczki ${money(u.zaliczka)}${u.dataZaliczki ? ` dnia ${date(u.dataZaliczki)} r.` : "."} Zaliczka jest zaliczana na poczet ceny.` : "Otrzymanie zaliczki nie zostało potwierdzone. Wpłatę należy potwierdzić odrębnym pokwitowaniem lub dowodem przelewu.");
    p(`Termin zakończenia wykonania i montażu: ${date(u.termin)} r.`);
    d.addPage(); d.font("B").fontSize(18).text("Warunki umowy");d.moveDown(.7);p(u.warunki);
    if (d.y > 670) d.addPage();
    d.moveDown(2);p("........................................................\nZamawiający - podpis\n\n........................................................\nWykonawca - podpis");
    const range = d.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      d.switchToPage(i); d.image(join(process.cwd(), "src/export/assets/pan-stolarz.png"), 48, 30, { width: 180 });
      d.moveTo(48, 83).lineTo(547, 83).strokeColor("#A5B859").lineWidth(1.5).stroke();
      const bottom = d.page.margins.bottom;
      d.page.margins.bottom = 0;
      d.font("R").fontSize(8).fillColor("#435058").text(`${u.numer} | ${i + 1} / ${range.count}`, 48, 798, { lineBreak: false, width: 499, align: "right" });
      d.page.margins.bottom = bottom;
    }
    d.end();
  });
}
