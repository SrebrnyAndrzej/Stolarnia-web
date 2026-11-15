import PDFDocument from "pdfkit";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Modul, ZbudowanyModul } from "../core/types.js";

export const OFFER_STANDARD = "oferta-2-a4-v1";
export interface StandardOffer {
  title: string;
  date: Date;
  reference: string;
  gross: number | null;
  groups: { label: string; gross: number }[];
  scope: { label: string; description: string }[];
  notes: string[];
  modules: Modul[];
  built: ZbudowanyModul[];
  preliminary: boolean;
  frontColor?: string;
  frontFluted?: boolean;
  worktopColor?: string;
}
const require = createRequire(import.meta.url);
const fonts = join(
  dirname(require.resolve("dejavu-fonts-ttf/package.json")),
  "ttf",
);
const logo = fileURLToPath(
  new URL("./assets/pan-stolarz.png", import.meta.url),
);
const C = {
  dark: "#1c2b30",
  green: "#a5b859",
  muted: "#435058",
  line: "#d5dcda",
  pale: "#f1f4f0",
};
const money = (v: number) =>
  `${v.toLocaleString("pl-PL", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 })} zł`;

/** The single client offer layout. It never receives the internal cost breakdown. */
export function standardOfferPdf(w: StandardOffer): Promise<Buffer> {
  const d = new PDFDocument({
    size: "A4",
    margin: 0,
    autoFirstPage: false,
    info: {
      Title: `Pan Stolarz | ${w.title}`,
      Author: "Pan Stolarz",
      Subject: OFFER_STANDARD,
    },
  });
  d.registerFont("R", join(fonts, "DejaVuSans.ttf"));
  d.registerFont("B", join(fonts, "DejaVuSans-Bold.ttf"));
  // Preserve every condition even when a legacy project has more than four notes.
  const notePages: string[][] = [[]];
  let noteY = 655;
  const conditions = [
    ...w.notes,
    ...w.scope
      .filter(
        (s, i) =>
          i >= 5 ||
          d
            .font("R")
            .fontSize(8.8)
            .heightOfString(s.description, { width: 423, lineGap: 2 }) >
            8.8 * 1.42 * 3,
      )
      .map((s) => `${s.label}: ${s.description}`),
  ];
  for (const condition of conditions) {
    d.font("R").fontSize(7.7);
    const words = `• ${condition}`.split(/\s+/);
    let line = "";
    const pushLine = (value: string) => {
      if (noteY + 11 > 788) {
        notePages.push([]);
        noteY = 150;
      }
      notePages[notePages.length - 1].push(value);
      noteY += 11;
    };
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (d.widthOfString(next) > 523 && line) {
        pushLine(line);
        line = word;
      } else line = next;
    }
    if (line) pushLine(line);
    pushLine("");
  }
  const pageCount = 2 + notePages.length - 1;
  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((ok, no) => {
    d.on("data", (b) => chunks.push(b));
    d.on("end", () => ok(Buffer.concat(chunks)));
    d.on("error", no);
  });
  const text = (
    s: string,
    x: number,
    y: number,
    size = 9,
    bold = false,
    width = 523,
    color = C.dark,
    lines = 3,
  ) => {
    d.font(bold ? "B" : "R")
      .fontSize(size)
      .fillColor(color)
      .text(s, x, y, {
        width,
        height: size * 1.42 * lines,
        ellipsis: true,
        lineGap: 2,
      });
  };
  const rule = (y: number) =>
    d.moveTo(36, y).lineTo(559, y).lineWidth(0.6).strokeColor(C.line).stroke();
  const header = (p: number) => {
    d.addPage();
    d.image(logo, 36, 24, { fit: [150, 40] });
    text(
      w.gross === null
        ? "PROPOZYCJA WSTĘPNA"
        : w.preliminary
          ? "OFERTA WSTĘPNA"
          : "OFERTA",
      365,
      30,
      9,
      true,
      194,
    );
    text(
      w.date.toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw" }),
      365,
      47,
      8,
      false,
      194,
      C.muted,
    );
    if (w.gross === null)
      text("CENA DO POTWIERDZENIA", 365, 62, 7, true, 194, C.muted, 1);
    rule(77);
    rule(802);
    text(
      `panstolarz.pro | ${w.preliminary ? "Koncepcja przed pomiarem" : "Oferta na meble na wymiar"}`,
      36,
      812,
      7,
      false,
      460,
      C.muted,
      1,
    );
    text(`${p} / ${pageCount}`, 532, 812, 7, false, 27, C.muted, 1);
  };
  const walls = [...new Set(w.modules.map((m) => m.scianaId))];
  const elevation = (
    wall: string,
    x: number,
    y: number,
    width: number,
    height: number,
    inside: boolean,
  ) => {
    const mods = w.modules.filter((m) => m.scianaId === wall);
    if (!mods.length) return;
    const maxX = Math.max(...mods.map((m) => m.pozycjaXMM + m.szerokoscMM));
    const maxY = Math.max(...mods.map((m) => m.pozycjaYMM + m.wysokoscMM));
    const scale = Math.min(
      width / Math.max(maxX, 1),
      (height - 17) / Math.max(maxY, 1),
    );
    for (const m of mods) {
      const mx = x + m.pozycjaXMM * scale,
        my = y + height - 17 - (m.pozycjaYMM + m.wysokoscMM) * scale;
      const mw = m.szerokoscMM * scale,
        mh = m.wysokoscMM * scale;
      d.rect(mx, my, mw, mh).fillAndStroke(
        inside ? C.pale : (w.frontColor ?? "#d8cfc1"),
        C.muted,
      );
      if (!inside && w.frontFluted) {
        for (let xx = mx + 2; xx < mx + mw - 1; xx += 3)
          d.moveTo(xx, my + 1)
            .lineTo(xx, my + mh - 1)
            .lineWidth(0.25)
            .strokeColor(C.muted)
            .stroke();
      }
      const built = w.built.find((b) => b.modul.id === m.id);
      for (const e of built?.elementy ?? []) {
        if (
          inside
            ? !["shelf", "fixedShelf", "divider", "drawerFrontBack"].includes(
                e.rola,
              )
            : e.rola !== "front"
        )
          continue;
        d.rect(
          mx + e.x * scale,
          my + (m.wysokoscMM - e.y - e.wys) * scale,
          Math.max(0.35, e.szer * scale),
          Math.max(0.35, e.wys * scale),
        )
          .lineWidth(0.35)
          .strokeColor(C.muted)
          .stroke();
      }
      if (m.konfiguracja.blat)
        d.rect(mx, my - 3, mw, 3).fill(w.worktopColor ?? "#b58c5e");
      if (mw > 25)
        text(`${m.szerokoscMM}`, mx, my + mh + 4, 6, false, mw, C.muted, 1);
    }
    d.moveTo(x, y + height - 15)
      .lineTo(x + maxX * scale, y + height - 15)
      .lineWidth(0.5)
      .strokeColor(C.line)
      .stroke();
    if (inside) {
      d.moveTo(x - 8, y + height - 17 - maxY * scale)
        .lineTo(x - 8, y + height - 17)
        .lineWidth(0.5)
        .strokeColor(C.muted)
        .stroke();
      d.save();
      d.translate(x - 13, y + height - 17 - (maxY * scale) / 2);
      d.rotate(-90);
      text(`${maxY} mm od podłogi`, 0, 0, 6, false, 125, C.muted, 1);
      d.restore();
    }
  };
  header(1);
  text(w.title, 36, 97, 24, true, 320, C.dark, 2);
  text(
    "Wykonanie na wymiar. Zakres, cena i wstępny projekt w jednym dokumencie.",
    36,
    168,
    10,
    false,
    298,
    C.muted,
    3,
  );
  d.roundedRect(36, 234, 298, 119, 7).fill(C.dark);
  text(
    w.preliminary ? "CENA KALKULACYJNA CAŁOŚCI" : "CENA CAŁOŚCI",
    52,
    250,
    8,
    true,
    265,
    C.green,
    1,
  );
  text(
    w.gross === null ? "do ustalenia" : money(w.gross),
    52,
    279,
    30,
    true,
    265,
    "#ffffff",
    1,
  );
  text(
    "brutto | zakres realizacji opisany poniżej",
    52,
    326,
    8,
    false,
    265,
    "#ffffff",
    1,
  );
  if (walls.length) elevation(walls[0], 371, 211, 184, 142, false);
  text("Widok frontów · poglądowo", 371, 362, 7, false, 184, C.muted, 1);
  text("Zakres proponowanej realizacji", 36, 385, 13, true);
  let y = 414;
  for (const s of w.scope.slice(0, 5)) {
    text(s.label, 36, y, 9, true, 94, C.dark, 2);
    text(s.description, 135, y, 8.8, false, 423, C.dark, 3);
    y += 48;
  }
  rule(658);
  y = 670;
  if (w.gross !== null) {
    for (const g of w.groups.slice(0, 3)) {
      text(g.label, 36, y, 9, false, 405, C.dark, 1);
      text(money(g.gross), 462, y, 9, true, 97, C.dark, 1);
      y += 19;
    }
  } else {
    text("Cena do potwierdzenia po uzupełnieniu braków.", 36, y, 9, true);
    y += 20;
  }
  text(
    w.gross === null
      ? `Propozycja ${w.reference} nie stanowi oferty ani podstawy umowy. Cena do potwierdzenia po uzupełnieniu braków.`
      : w.preliminary
        ? "Cena orientacyjna. Ostateczne warunki po pomiarze i wyborze materiałów. Termin realizacji i płatności do uzgodnienia."
        : `Oferta ${w.reference}. Warunki realizacji zgodnie z uzgodnionym zakresem.`,
    36,
    y + 8,
    8,
    false,
    523,
    C.muted,
    3,
  );
  header(2);
  text("Wstępny projekt wnętrza", 36, 97, 23, true);
  text(
    "Rysunki koncepcyjne, wymiary w mm. Rozmieszczenie według wybranego układu; bez zatwierdzenia do produkcji.",
    36,
    135,
    9,
    false,
    523,
    C.muted,
    2,
  );
  const shown = walls.slice(0, 3),
    rowH = shown.length === 1 ? 330 : shown.length === 2 ? 185 : 129;
  shown.forEach((wall, i) => {
    const top = 178 + i * (rowH + 14);
    text(`ŚCIANA ${wall.toUpperCase()}`, 36, top, 8, true, 523, C.muted, 1);
    elevation(wall, 52, top + 16, 491, rowH - 8, true);
  });
  rule(617);
  text("Założenia do potwierdzenia przy pomiarze", 36, 631, 11, true);
  notePages.forEach((lines, index) => {
    if (index > 0) {
      header(index + 2);
      text("Dodatkowe uzgodnienia", 36, 97, 23, true);
    }
    let yy = index === 0 ? 655 : 150;
    for (const line of lines) {
      text(line, 36, yy, 7.7, false, 523, C.muted, 1);
      yy += 11;
    }
  });
  d.end();
  return result;
}
