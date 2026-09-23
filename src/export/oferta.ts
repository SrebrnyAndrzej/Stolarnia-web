import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import PDFDocument from "pdfkit";
import type { DaneFirmy, Material, PodsumowanieWariantu, Projekt, ProjektWyceny, WariantWyceny, ZbudowanyModul } from "../core/types.js";

// Oferta handlowa dla klienta (A4 poziomo): okładka z wizualizacją, wizualizacje, zakres i materiały, cena.
// Wizualizacje renderuje przeglądarka (three.js) i przesyła jako JPEG — serwer tylko składa dokument.

const require = createRequire(import.meta.url);
const FONTY = join(dirname(require.resolve("dejavu-fonts-ttf/package.json")), "ttf");

const TEKST = "#23201c";
const SZARY = "#6f675d";
const AKCENT = "#9a6b3f";
const TLO = "#f4f1ec";
const LINIA = "#ddd6cb";

export interface Wizualizacja {
  tytul: string;
  jpeg: Buffer;
}

export interface WejscieOferty {
  projekt: Projekt;
  zbudowane: ZbudowanyModul[];
  ilosci: ProjektWyceny;
  warianty: PodsumowanieWariantu[];
  wariant: WariantWyceny;
  firma: DaneFirmy;
  materialy: Map<string, Material>;
  wizualizacje: Wizualizacja[];
  numer: string;
  data: Date;
  waznoscDni: number;
  terminRealizacji: string;
  uwagi: string[];
}

const zl = (v: number) => `${v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
const dataPL = (d: Date) => d.toLocaleDateString("pl-PL", { day: "2-digit", month: "long", year: "numeric" });

export function ofertaPdf(w: WejscieOferty): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0, autoFirstPage: false, info: { Title: `Oferta ${w.numer} — ${w.projekt.nazwa}` } });
  doc.registerFont("R", join(FONTY, "DejaVuSans.ttf"));
  doc.registerFont("B", join(FONTY, "DejaVuSans-Bold.ttf"));
  doc.registerFont("L", join(FONTY, "DejaVuSans-ExtraLight.ttf"));
  const bufory: Buffer[] = [];
  doc.on("data", (b: Buffer) => bufory.push(b));
  const koniec = new Promise<Buffer>((ok) => doc.on("end", () => ok(Buffer.concat(bufory))));

  const W = 841.89;
  const H = 595.28;
  const firma = w.firma.nazwaFirmy || "Stolarnia";
  const wybrany = w.warianty.find((v) => v.wariant === w.wariant) ?? w.warianty[0];
  let nrStrony = 0;

  const stopka = () => {
    nrStrony += 1;
    doc.font("R").fontSize(7.5).fillColor(SZARY);
    doc.text(`${firma} · Oferta ${w.numer} · ${w.projekt.nazwa}`, 40, H - 26, { width: W - 160, lineBreak: false });
    doc.text(String(nrStrony), W - 80, H - 26, { width: 40, align: "right", lineBreak: false });
  };
  const naglowek = (tytul: string, pod?: string) => {
    doc.font("B").fontSize(20).fillColor(TEKST).text(tytul, 40, 34, { width: W - 80 });
    if (pod) doc.font("R").fontSize(9.5).fillColor(SZARY).text(pod, 40, 62, { width: W - 80 });
    doc.moveTo(40, 84).lineTo(W - 40, 84).lineWidth(0.6).strokeColor(LINIA).stroke();
  };

  // ---------- Okładka ----------
  doc.addPage();
  const hero = w.wizualizacje[0];
  const heroH = H * 0.74;
  if (hero) doc.image(hero.jpeg, 0, 0, { cover: [W, heroH], align: "center", valign: "center" });
  else doc.rect(0, 0, W, heroH).fill(TLO);
  doc.rect(0, heroH, W, H - heroH).fill(TLO);
  doc.rect(40, heroH + 26, 3, H - heroH - 52).fill(AKCENT);
  doc.font("L").fontSize(11).fillColor(SZARY).text("OFERTA NA MEBLE NA WYMIAR", 56, heroH + 24, { characterSpacing: 2 });
  doc.font("B").fontSize(24).fillColor(TEKST).text(w.projekt.nazwa, 56, heroH + 42, { width: W * 0.55 });
  doc.font("R").fontSize(10).fillColor(SZARY).text(`Dla: ${w.projekt.klient.nazwa || "—"}${w.projekt.klient.adres ? ` · ${w.projekt.klient.adres}` : ""}`, 56, heroH + 78, { width: W * 0.55 });
  const kx = W * 0.64;
  const wiersz = (et: string, wart: string, y: number) => {
    doc.font("R").fontSize(8.5).fillColor(SZARY).text(et, kx, y, { width: 120 });
    doc.font("B").fontSize(10).fillColor(TEKST).text(wart, kx + 110, y - 1, { width: W - kx - 150 });
  };
  wiersz("Numer oferty", w.numer, heroH + 28);
  wiersz("Data", dataPL(w.data), heroH + 46);
  wiersz("Ważna do", dataPL(new Date(w.data.getTime() + w.waznoscDni * 86400000)), heroH + 64);
  wiersz(`Cena (${wybrany.nazwa})`, `${zl(wybrany.cenaBrutto)} brutto`, heroH + 82);
  wiersz("Przygotował", firma, heroH + 100);

  // ---------- Wizualizacje (po jednej na stronę) ----------
  for (const v of w.wizualizacje) {
    doc.addPage();
    const iw = W - 80;
    const ih = iw * (9 / 16);
    doc.image(v.jpeg, 40, 36, { width: iw, height: ih });
    doc.font("B").fontSize(12).fillColor(TEKST).text(v.tytul, 40, 36 + ih + 12, { width: iw * 0.6 });
    doc.font("R").fontSize(8).fillColor(SZARY).text("Wizualizacja poglądowa — kolory i struktura dekorów zależą od partii płyty i oświetlenia. Uchwyty, AGD i dodatki pokazane przykładowo.", 40 + iw * 0.45, 36 + ih + 14, { width: iw * 0.55, align: "right" });
    stopka();
  }

  // ---------- Zakres i materiały ----------
  doc.addPage();
  naglowek("Zakres i materiały", `${w.ilosci.liczbaModulow} szafek · ${w.ilosci.metryBiezaceZabudowy.toLocaleString("pl-PL")} mb zabudowy · blat ${w.ilosci.metryBiezaceBlatu.toLocaleString("pl-PL")} mb`);
  const pom = w.projekt.pomieszczenia[0];
  const nazwaMat = (id?: string) => {
    const m = id ? w.materialy.get(id) : undefined;
    return m ? `${m.producent ? `${m.producent} ` : ""}${m.nazwa}` : "—";
  };
  // Strefy materiałowe z faktycznych przypisań modułów
  const strefy = new Map<string, { nazwa: string; korpus: string; front: string; ile: number }>();
  for (const z of w.zbudowane) {
    const m = z.modul;
    const k = nazwaMat(m.materialKorpusuId ?? pom?.materialKorpusuId);
    const f = nazwaMat(m.materialFrontuId ?? pom?.materialFrontuId);
    const strefa = m.kategoria === "tall" ? "Zabudowa wysoka" : m.kategoria === "wall" ? "Szafki wiszące" : "Zabudowa dolna";
    const klucz = `${strefa}|${k}|${f}`;
    const s = strefy.get(klucz) ?? { nazwa: strefa, korpus: k, front: f, ile: 0 };
    s.ile += 1;
    strefy.set(klucz, s);
  }
  let y = 100;
  const kol = [40, 190, 470];
  doc.font("B").fontSize(8.5).fillColor(SZARY);
  doc.text("STREFA", kol[0], y).text("KORPUSY", kol[1], y).text("FRONTY", kol[2], y);
  y += 16;
  for (const s of strefy.values()) {
    doc.font("B").fontSize(10).fillColor(TEKST).text(`${s.nazwa} (${s.ile})`, kol[0], y, { width: 145 });
    doc.font("R").fontSize(9.5).text(s.korpus, kol[1], y, { width: 270 }).text(s.front, kol[2], y, { width: W - 40 - kol[2] });
    y += 30;
    doc.moveTo(40, y - 8).lineTo(W - 40, y - 8).lineWidth(0.4).strokeColor(LINIA).stroke();
  }
  doc.font("B").fontSize(10).fillColor(TEKST).text("Blat", kol[0], y);
  doc.font("R").fontSize(9.5).text(nazwaMat(pom?.materialBlatuId), kol[1], y, { width: W - 40 - kol[1] });
  y += 30;

  // Okucia i wyposażenie z pozycji wybranego wariantu
  doc.font("B").fontSize(12).fillColor(TEKST).text(`Okucia i wyposażenie — wariant ${wybrany.nazwa}`, 40, y);
  y += 20;
  const okucia = wybrany.pozycje.filter((p) => p.kategoria === "okucia" || p.kategoria === "akcesoria");
  const polowa = Math.ceil(okucia.length / 2);
  okucia.forEach((p, i) => {
    const x = i < polowa ? 40 : W / 2 + 10;
    const yy = y + (i % polowa) * 15;
    const wyr = /LeMans/i.test(p.nazwa);
    doc.font(wyr ? "B" : "R").fontSize(9).fillColor(wyr ? AKCENT : TEKST).text(`•  ${p.nazwa} — ${p.ilosc.toLocaleString("pl-PL")} ${p.jednostka}`, x, yy, { width: W / 2 - 60, lineBreak: false, ellipsis: true });
  });
  y += polowa * 15 + 14;

  const lemans = w.zbudowane.find((z) => z.modul.konfiguracja.systemNarozny === "lemans");
  if (lemans) {
    doc.rect(40, y, W - 80, 46).fill(TLO);
    doc.rect(40, y, 3, 46).fill(AKCENT);
    doc.font("B").fontSize(10).fillColor(TEKST).text(`Narożnik: ${lemans.modul.nazwa}`, 54, y + 8, { width: W - 110 });
    doc.font("R").fontSize(8.8).fillColor(SZARY).text(
      `Szafka narożna ślepa ${lemans.modul.szerokoscMM} mm z systemem Kesseböhmer LeMans II — dwie półki „nerki” wyjeżdżające niezależnie przed szafkę (do 25 kg na półkę wg producenta). Drzwi 450 mm, otwieranie ${lemans.modul.konfiguracja.stronaDrzwiNaroznika === "lewa" ? "na lewo" : "na prawo"}.`,
      54,
      y + 23,
      { width: W - 110 },
    );
    y += 58;
  }
  stopka();

  // ---------- Lista szafek ----------
  doc.addPage();
  naglowek("Zestawienie szafek", "Wymiary: szerokość × wysokość × głębokość korpusu [mm]");
  y = 98;
  const sciany = new Map(w.projekt.pomieszczenia.flatMap((r) => r.sciany.map((s) => [s.id, s.nazwa] as const)));
  const kolL = [40, 64, 330, 470, 600];
  const naglowekTabeli = () => {
    doc.font("B").fontSize(8).fillColor(SZARY);
    doc.text("LP", kolL[0], y).text("SZAFKA", kolL[1], y).text("WYMIARY", kolL[2], y).text("ŚCIANA", kolL[3], y).text("FRONT", kolL[4], y);
    y += 14;
  };
  naglowekTabeli();
  w.zbudowane.forEach((z, i) => {
    if (y > H - 50) {
      stopka();
      doc.addPage();
      naglowek("Zestawienie szafek (cd.)");
      y = 98;
      naglowekTabeli();
    }
    const m = z.modul;
    const k = m.konfiguracja;
    const front = k.typFrontu === "szuflady" ? `${k.liczbaSzuflad} szuflady` : k.typFrontu === "drzwi" ? `${k.liczbaDrzwi} ${k.liczbaDrzwi === 1 ? "drzwi" : "drzwi"}${k.systemNarozny === "lemans" ? " + LeMans II" : ""}` : k.typFrontu === "panelAGD" ? "panel AGD" : k.typFrontu;
    if (i % 2 === 0) doc.rect(36, y - 3, W - 72, 15).fill(TLO);
    doc.font("R").fontSize(8.6).fillColor(TEKST);
    doc.text(String(i + 1), kolL[0], y, { width: 20 });
    doc.text(m.nazwa, kolL[1], y, { width: kolL[2] - kolL[1] - 8, lineBreak: false, ellipsis: true });
    doc.text(`${m.szerokoscMM} × ${m.wysokoscMM} × ${m.glebokoscMM}`, kolL[2], y);
    doc.text(sciany.get(m.scianaId) ?? "—", kolL[3], y, { width: kolL[4] - kolL[3] - 8, lineBreak: false, ellipsis: true });
    doc.text(front, kolL[4], y, { width: W - 40 - kolL[4], lineBreak: false, ellipsis: true });
    y += 15;
  });
  stopka();

  // ---------- Cena ----------
  doc.addPage();
  naglowek("Cena", "Warianty różnią się klasą okuć i wykończenia; zakres mebli jest ten sam.");
  y = 104;
  const szerK = (W - 80 - 3 * 14) / 4;
  w.warianty.forEach((v, i) => {
    const x = 40 + i * (szerK + 14);
    const wyb = v.wariant === wybrany.wariant;
    doc.rect(x, y, szerK, 150).lineWidth(wyb ? 1.6 : 0.6).strokeColor(wyb ? AKCENT : LINIA).stroke();
    if (wyb) doc.rect(x, y, szerK, 20).fill(AKCENT);
    doc.font("B").fontSize(8).fillColor(wyb ? "#ffffff" : SZARY).text(wyb ? "PROPONOWANY" : " ", x, y + 6, { width: szerK, align: "center", characterSpacing: 1.5 });
    doc.font("B").fontSize(15).fillColor(TEKST).text(v.nazwa, x + 12, y + 30, { width: szerK - 24 });
    doc.font("R").fontSize(8).fillColor(SZARY).text(v.opis, x + 12, y + 52, { width: szerK - 24, height: 44, ellipsis: true });
    doc.font("B").fontSize(16).fillColor(TEKST).text(zl(v.cenaBrutto), x + 12, y + 102, { width: szerK - 24 });
    doc.font("R").fontSize(8).fillColor(SZARY).text(`brutto · ${zl(v.cenaNetto)} netto + VAT`, x + 12, y + 124, { width: szerK - 24 });
  });
  y += 176;

  doc.font("B").fontSize(11).fillColor(TEKST).text("Cena obejmuje", 40, y);
  doc.font("B").text("Warunki", W / 2 + 10, y);
  y += 18;
  const kat = new Set(wybrany.pozycje.map((p) => p.kategoria));
  const wCenie = [
    "Projekt wykonawczy i produkcję szafek",
    "Płyty wg specyfikacji, cięcie i oklejanie obrzeżem ABS",
    "Blat",
    "Okucia wg wybranego wariantu" + (lemans ? ", w tym system narożny LeMans II" : ""),
    ...(kat.has("transport") ? ["Transport"] : []),
    ...(kat.has("montaz") ? ["Montaż u klienta"] : []),
  ];
  doc.font("R").fontSize(9).fillColor(TEKST);
  const lista = (pozycje: string[], x: number, szer: number) => {
    let yy = y;
    for (const t of pozycje) {
      doc.text(`•  ${t}`, x, yy, { width: szer });
      yy = doc.y + 4;
    }
  };
  lista(wCenie, 40, W / 2 - 60);
  const warunki = [
    `Oferta ważna ${w.waznoscDni} dni od daty wystawienia.`,
    `Termin realizacji: ${w.terminRealizacji}.`,
    "Nie obejmuje: AGD, zlewozmywaka, baterii, oświetlenia i przyłączy — chyba że wymieniono je wyżej.",
    "Wymiary do potwierdzenia pomiarem z natury przed produkcją.",
    ...w.uwagi,
  ];
  lista(warunki, W / 2 + 10, W / 2 - 50);
  stopka();

  doc.end();
  return koniec;
}
