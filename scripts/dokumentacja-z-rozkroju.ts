// Dokumentacja techniczna szafek z arkusza „rozkrój do hurtowni” (xlsx, format warsztatu:
// Lp | Oznaczenie | – | Długość | Szerokość | Ilość | słoje | Okleina DA-DB-KA-KB | Wymiar po oklejeniu).
// Dokument jest zgodny 1:1 z formatkami wysłanymi do hurtowni — nie przelicza konstrukcji na nowo.
//
// Użycie: npx tsx scripts/dokumentacja-z-rozkroju.ts <plik.xlsx> <arkusz> <wyjście.pdf> [przypisania.json]
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import PDFDocument from "pdfkit";

const require = createRequire(import.meta.url);
const FONTY = join(dirname(require.resolve("dejavu-fonts-ttf/package.json")), "ttf");

interface Formatka {
  lp: number;
  kod: string;
  modul: string;
  element: string;
  dl: number;
  sz: number;
  ilosc: number;
  sloje: string;
  okleina: string;
  gotowy: string;
  material: string;
}

interface Przypisanie {
  pomieszczenie: string;
  pewnosc: string;
  uzasadnienie: string;
  uwagi?: string[];
}

// ---------- odczyt xlsx (zip → XML arkusza) ----------

function czytajArkusz(xlsx: string, nazwa: string): { wiersze: string[][] } {
  const kat = mkdtempSync(join(tmpdir(), "xlsx-"));
  const kopia = join(kat, "a.zip");
  copyFileSync(xlsx, kopia);
  execFileSync("powershell.exe", ["-NoProfile", "-Command", `Add-Type -A System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::ExtractToDirectory('${kopia}', '${join(kat, "x")}')`]);
  const wb = readFileSync(join(kat, "x/xl/workbook.xml"), "utf8");
  const arkusze = [...wb.matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="rId(\d+)"/g)];
  const nr = arkusze.find((a) => a[1].toLowerCase() === nazwa.toLowerCase())?.[2];
  if (!nr) throw new Error(`Brak arkusza ${nazwa}. Są: ${arkusze.map((a) => a[1]).join(", ")}`);
  const x = readFileSync(join(kat, `x/xl/worksheets/sheet${nr}.xml`), "utf8");
  const dekoduj = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  const wiersze = (x.match(/<row[^>]*>[\s\S]*?<\/row>/g) ?? []).map((r) => {
    const w: string[] = [];
    for (const m of r.matchAll(/<c r="([A-Z]+)\d+"[^>]*?(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const v = m[2] ?? "";
      const t = [...v.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((q) => q[1]).join("");
      const vv = v.match(/<v>([\s\S]*?)<\/v>/);
      w[m[1].charCodeAt(0) - 65] = dekoduj(t || (vv ? vv[1] : ""));
    }
    return w;
  });
  return { wiersze };
}

function analizuj(wiersze: string[][]) {
  const formatki: Formatka[] = [];
  const uwagi: string[] = [];
  let material = "";
  let poRazem = false;
  for (const w of wiersze) {
    const [a, b, , d, e, f, g, h, i] = w.map((v) => (v ?? "").trim());
    if (/^\d+$/.test(a) && b && d) {
      const m = b.match(/^(N-\d+|D-\d+|G-\d+|DODATEK)-(.+)$/);
      formatki.push({ lp: +a, kod: b, modul: m?.[1] ?? "INNE", element: m?.[2] ?? b, dl: +d, sz: +e, ilosc: +f, sloje: g, okleina: h.padStart(4, "0"), gotowy: i, material });
    } else if (b && !a) {
      if (/^RAZEM/.test(b)) poRazem = true;
      if (poRazem) uwagi.push(b);
      else material = b;
    }
  }
  return { formatki, uwagi };
}

// ---------- opis elementów ----------

function nazwaElementu(el: string): string {
  const reguly: [RegExp, string][] = [
    [/^BOK/, "Bok korpusu"],
    [/^WD/, "Wieniec dolny"],
    [/^WG/, "Wieniec górny"],
    [/^POL/, "Półka"],
    [/^BLAT-BIURKO/, "Blat biurka"],
    [/^DNO-SB/, "Dno szuflady (system)"],
    [/^TYL-SB/, "Tył szuflady (system)"],
    [/^MASK-KARNISZ/, "Maskownica karnisza — połówka"],
    [/^FR-SZUF/, "Front szuflady"],
    [/^FR-DRZWI/, "Drzwi"],
    [/^OKLADZINA/, "Okładzina ścienna"],
    [/^BALUSTRADA/, "Panel balustrady"],
    [/^FR-/, "Formatka dodatkowa (Franklin)"],
    [/^BF-/, "Formatka dodatkowa (biała, obrzeże Franklin)"],
  ];
  return reguly.find(([r]) => r.test(el))?.[1] ?? el;
}

/** „biała uni 18 mm · ABS-BIALY” — płyta bez nawiasów i dopisków + kod taśmy obrzeża (nowy kod ma pierwszeństwo). */
function krotkiMaterial(m: string): string {
  const plyta = m
    .split("·")[0]
    .replace(/^DODATEK-[\d-]+ — /, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/ z obrzeżem .*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  const obrzeze = m.match(/FRANKLIN-NA-BIALEJ/)?.[0] ?? m.match(/ABS-[A-Z0-9]+(?:-[A-Z0-9]+)*/)?.[0] ?? "";
  const zalozenie = /ZALOZENIE|DO WERYFIKACJI|do potwierdzenia|SKU do ustalenia/i.test(m) ? " (SKU do potw.)" : "";
  return `${plyta}${obrzeze ? ` · ${obrzeze}${zalozenie}` : ""}`;
}

/** Korpusy odtworzone z par wieńców: szerokość = długość wieńca + 2 × grubość boku. */
function korpusy(f: Formatka[], gr = 18) {
  const bok = f.find((q) => /^BOK/.test(q.element));
  if (!bok) return [];
  const [H, D] = bok.gotowy.split("×").map((s) => parseFloat(s));
  const wd = f.filter((q) => /^WD/.test(q.element));
  return wd.map((q) => {
    const wew = parseFloat(q.gotowy);
    return { szer: wew + 2 * gr, wys: H, gl: D, ilosc: q.ilosc, wieniec: wew };
  });
}

// ---------- PDF ----------

const TEKST = "#1f1c18";
const SZARY = "#6b645b";
const LINIA = "#d8d1c6";
const AKCENT = "#9a6b3f";
const OBRZEZE = "#c0392b";

export function dokumentacjaPdf(opcje: { klient: string; zrodlo: string; arkusz: string; formatki: Formatka[]; uwagi: string[]; przypisania: Record<string, Przypisanie>; data: Date }): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 32, autoFirstPage: false, bufferPages: true, info: { Title: `Dokumentacja techniczna — ${opcje.klient}` } });
  doc.registerFont("R", join(FONTY, "DejaVuSans.ttf"));
  doc.registerFont("B", join(FONTY, "DejaVuSans-Bold.ttf"));
  doc.registerFont("C", join(FONTY, "DejaVuSansCondensed.ttf"));
  const bufory: Buffer[] = [];
  doc.on("data", (b: Buffer) => bufory.push(b));
  const koniec = new Promise<Buffer>((ok) => doc.on("end", () => ok(Buffer.concat(bufory))));
  const W = 841.89;
  const H = 595.28;
  const L = 32;
  const P = W - 32;
  const dataTxt = opcje.data.toLocaleDateString("pl-PL");

  /** Nagłówek strony; zwraca y, od którego zaczyna się treść. */
  const naglowek = (tytul: string, pod?: string): number => {
    doc.font("R").fontSize(8).fillColor(SZARY).text(`${opcje.klient} · ${dataTxt}`, P - 200, 32, { width: 200, align: "right" });
    doc.font("B").fontSize(16).fillColor(TEKST).text(tytul, L, 28, { width: P - L - 210 });
    if (pod) doc.font("R").fontSize(8.5).fillColor(SZARY).text(pod, L, doc.y + 2, { width: P - L });
    const linia = Math.max(66, doc.y + 4);
    doc.moveTo(L, linia).lineTo(P, linia).lineWidth(0.6).strokeColor(LINIA).stroke();
    return linia + 12;
  };
  /** Komórka tabeli w jednej linii — nadmiar ucięty wielokropkiem (bez zawijania i przenoszenia na nową stronę). */
  const komorka = (t: string, x: number, yy: number, szer: number) => doc.text(t, x, yy, { width: szer, height: 10, lineBreak: false, ellipsis: true });

  const moduly = [...new Set(opcje.formatki.map((f) => f.modul))];
  const sumaSzt = opcje.formatki.reduce((s, f) => s + f.ilosc, 0);

  // ---------- Strona tytułowa ----------
  doc.addPage();
  doc.rect(0, 0, W, 8).fill(AKCENT);
  doc.font("B").fontSize(26).fillColor(TEKST).text("Dokumentacja techniczna szafek", L, 60);
  doc.font("R").fontSize(13).fillColor(SZARY).text(`${opcje.klient} — piętro (ul. Główna 17, Kamień)`, L, 96);
  doc.font("R").fontSize(9).fillColor(TEKST);
  const info = [
    ["Źródło formatek", `${opcje.zrodlo}, arkusz „${opcje.arkusz}”`],
    ["Projekty pomieszczeń", "ARCH_KAMIEN_WN (MOOI Architekci) — Garderoba, Sypialnia, Łazienka w aplikacji Stolarnia"],
    ["Zakres", `${moduly.length} grup (${moduly.join(", ")}), ${opcje.formatki.length} pozycji, ${sumaSzt} formatek${(() => {
      const razem = opcje.uwagi.map((u) => u.match(/RAZEM (\d+) formatek w (\d+) pozycjach/)).find(Boolean);
      if (!razem) return "";
      const zgodne = +razem[1] === sumaSzt ? "liczba formatek zgodna" : `ARKUSZ PODAJE ${razem[1]} FORMATEK`;
      return +razem[2] !== opcje.formatki.length ? ` (podsumowanie arkusza: ${razem[2]} pozycji — nieaktualne po podziale maskownicy karnisza na A/B; ${zgodne})` : "";
    })()}`],
    ["Status", "DOKUMENT ROBOCZY — wymiary formatek jak w zamówieniu do hurtowni; przypisanie do pomieszczeń i otworowanie do potwierdzenia"],
    ["Data", dataTxt],
  ];
  let y = 140;
  for (const [k, v] of info) {
    doc.font("R").fontSize(8.5).fillColor(SZARY).text(k, L, y, { width: 140 });
    doc.font("R").fontSize(9.5).fillColor(TEKST).text(v, L + 150, y - 1, { width: P - L - 150 });
    y = doc.y + 8;
  }

  // Legenda krawędzi
  y += 10;
  doc.font("B").fontSize(11).fillColor(TEKST).text("Legenda krawędzi i kodu okleiny", L, y);
  y += 20;
  const lx = L + 10;
  doc.rect(lx, y + 14, 150, 70).lineWidth(0.8).strokeColor(TEKST).stroke();
  doc.moveTo(lx, y + 84).lineTo(lx + 150, y + 84).lineWidth(3).strokeColor(OBRZEZE).stroke();
  doc.font("R").fontSize(8).fillColor(TEKST);
  doc.text("DA (długa, przód)", lx + 35, y + 88);
  doc.text("DB (długa, tył)", lx + 40, y + 2);
  doc.text("KA", lx - 18, y + 45);
  doc.text("KB", lx + 155, y + 45);
  doc.text("Długość →", lx + 50, y + 44, { lineBreak: false });
  doc.font("R").fontSize(8.5).fillColor(TEKST).text(
    "Kod okleiny = 4 cyfry w kolejności DA-DB-KA-KB: 1 = krawędź oklejona, 0 = surowa (1111 = wszystkie). Na rysunkach formatek krawędź oklejona jest pogrubiona na czerwono. Długość formatki leży poziomo; DA to dolna długa krawędź rysunku (przód elementu). Wymiary w tabelach: CIĘCIE = przed oklejeniem (jak w zamówieniu), GOTOWY = po oklejeniu obrzeżem 0,8 mm.",
    lx + 210,
    y + 10,
    { width: P - lx - 210 },
  );
  y += 118;

  // Zestawienie materiałów
  doc.font("B").fontSize(11).fillColor(TEKST).text("Zestawienie materiałów", L, y);
  y += 18;
  const mat = new Map<string, { szt: number; m2: number; mb: number }>();
  for (const f of opcje.formatki) {
    const k = krotkiMaterial(f.material);
    const s = mat.get(k) ?? { szt: 0, m2: 0, mb: 0 };
    const [gd, gs] = f.gotowy.split("×").map((q) => parseFloat(q));
    s.szt += f.ilosc;
    s.m2 += (f.dl * f.sz * f.ilosc) / 1e6;
    s.mb += ((+f.okleina[0] + +f.okleina[1]) * gd + (+f.okleina[2] + +f.okleina[3]) * gs) * f.ilosc / 1000;
    mat.set(k, s);
  }
  doc.font("B").fontSize(8).fillColor(SZARY).text("MATERIAŁ", L, y).text("SZT.", L + 520, y, { width: 50, align: "right" }).text("PŁYTA [m²]", L + 580, y, { width: 70, align: "right" }).text("OBRZEŻE [mb]", L + 660, y, { width: 80, align: "right" });
  y += 13;
  for (const [k, s] of mat) {
    doc.font("R").fontSize(9).fillColor(TEKST).text(k, L, y, { width: 510 });
    const yy = y;
    y = Math.max(doc.y, y + 12) + 3;
    doc.text(String(s.szt), L + 520, yy, { width: 50, align: "right" }).text(s.m2.toFixed(2).replace(".", ","), L + 580, yy, { width: 70, align: "right" }).text(s.mb.toFixed(1).replace(".", ","), L + 660, yy, { width: 80, align: "right" });
  }
  doc.font("R").fontSize(7.5).fillColor(SZARY).text("Płyta netto (bez odpadu) z wymiarów cięcia; obrzeże netto z krawędzi oklejonych, bez naddatku na obróbkę.", L, y + 4);

  // ---------- Grupy / moduły ----------
  for (const mod of moduly) {
    const f = opcje.formatki.filter((q) => q.modul === mod);
    const przyp = opcje.przypisania[mod];
    doc.addPage();
    y = naglowek(`${mod}${przyp ? ` — ${przyp.pomieszczenie}` : ""}`, przyp ? `Przypisanie: ${przyp.pewnosc}. ${przyp.uzasadnienie}` : undefined);
    const kor = korpusy(f);
    if (kor.length) {
      doc.font("B").fontSize(10.5).fillColor(TEKST).text("Korpusy (odtworzone z par wieńców: szerokość = wieniec + 2 × 18 mm)", L, y);
      y += 16;
      const suma = kor.reduce((s, k) => s + k.szer * k.ilosc, 0);
      // Schemat: prostokąty korpusów w skali (kolejność wg zestawienia — kolejność w zabudowie do potwierdzenia z projektem)
      const skala = Math.min((P - L - 10) / suma, 110 / kor[0].wys);
      let x = L;
      for (const k of kor)
        for (let i = 0; i < k.ilosc; i++) {
          const w = k.szer * skala;
          const h = k.wys * skala;
          doc.rect(x, y + 110 - h, w, h).lineWidth(0.8).strokeColor(TEKST).stroke();
          doc.font("C").fontSize(7).fillColor(TEKST).text(`${k.szer}`, x, y + 110 - h / 2 - 4, { width: w, align: "center" });
          x += w;
        }
      doc.font("R").fontSize(7.5).fillColor(SZARY).text(`Razem ${suma} mm · wys. ${kor[0].wys} · gł. ${kor[0].gl} mm. Kolejność korpusów na schemacie wg arkusza, nie wg ściany — do potwierdzenia z projektem.`, L, y + 114, { width: P - L });
      y += 132;
      doc.font("B").fontSize(8).fillColor(SZARY);
      doc.text("KORPUS", L, y).text("SZER. × WYS. × GŁ. [mm]", L + 90, y).text("SZT.", L + 260, y).text("ŚWIATŁO (wieniec)", L + 310, y);
      y += 12;
      for (const k of kor) {
        doc.font("R").fontSize(8.8).fillColor(TEKST).text(`${mod}-${k.szer}`, L, y).text(`${k.szer} × ${k.wys} × ${k.gl}`, L + 90, y).text(String(k.ilosc), L + 260, y).text(`${k.wieniec} mm`, L + 310, y);
        y += 13;
      }
      y += 8;
    }
    if (przyp?.uwagi?.length) {
      doc.font("B").fontSize(10.5).fillColor(TEKST).text("Uwagi konstrukcyjne", L, y);
      y += 15;
      for (const u of przyp.uwagi) {
        doc.font("R").fontSize(8.6).fillColor(TEKST).text(`•  ${u}`, L, y, { width: P - L });
        y = doc.y + 3;
      }
      y += 6;
    }
    // Tabela formatek
    const kol = [L, L + 26, L + 172, L + 330, L + 425, L + 500, L + 530, L + 600];
    const naglTab = () => {
      doc.font("B").fontSize(7.6).fillColor(SZARY);
      ["LP", "OZNACZENIE", "ELEMENT", "CIĘCIE dł × szer", "GOTOWY", "SZT.", "OKLEINA", "MATERIAŁ · OBRZEŻE"].forEach((t, i) => komorka(t, kol[i], y, (kol[i + 1] ?? P) - kol[i] - 4));
      y += 12;
    };
    if (y > H - 80) {
      doc.addPage();
      y = naglowek(`${mod} — formatki (cd.)`);
    }
    doc.font("B").fontSize(10.5).fillColor(TEKST).text("Formatki", L, y);
    y += 15;
    naglTab();
    f.forEach((q, i) => {
      if (y > H - 40) {
        doc.addPage();
        y = naglowek(`${mod} — formatki (cd.)`);
        naglTab();
      }
      if (i % 2 === 0) doc.rect(L - 3, y - 2.5, P - L + 6, 13).fill("#f4f1ec");
      doc.font("R").fontSize(8).fillColor(TEKST);
      const kom = [String(q.lp), q.kod, nazwaElementu(q.element), `${fmt(q.dl)} × ${fmt(q.sz)}`, q.gotowy, String(q.ilosc), q.okleina, krotkiMaterial(q.material)];
      kom.forEach((t, j) => komorka(t, kol[j], y, (kol[j + 1] ?? P) - kol[j] - 4));
      y += 13;
    });

    // Rysunki formatek — 4 × 2 na stronę
    rysunkiFormatek(doc, f, mod, naglowek, P, L, H);
  }

  // ---------- Uwagi produkcyjne z arkusza ----------
  doc.addPage();
  y = naglowek("Uwagi produkcyjne z arkusza (bez zmian)", "Decyzje i założenia zapisane w pliku rozkroju — obowiązują przy cięciu i montażu.");
  for (const u of opcje.uwagi) {
    if (y > H - 60) {
      doc.addPage();
      y = naglowek("Uwagi produkcyjne z arkusza (cd.)");
    }
    doc.font("R").fontSize(8.4).fillColor(TEKST).text(`•  ${u}`, L, y, { width: P - L });
    y = doc.y + 5;
  }

  // Stopki
  const zakres = doc.bufferedPageRange();
  for (let i = 0; i < zakres.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    doc.font("R").fontSize(7).fillColor(SZARY).text(`${opcje.klient} · dokumentacja techniczna szafek · dokument roboczy`, L, H - 20, { lineBreak: false });
    doc.text(`${i + 1} / ${zakres.count}`, P - 60, H - 20, { width: 60, align: "right", lineBreak: false });
  }
  doc.end();
  return koniec;
}

function fmt(v: number) {
  return String(v).replace(".", ",");
}

function rysunkiFormatek(doc: PDFKit.PDFDocument, f: Formatka[], mod: string, naglowek: (t: string, p?: string) => number, P: number, L: number, H: number) {
  const naStrone = 8;
  for (let s = 0; s < f.length; s += naStrone) {
    doc.addPage();
    const y0 = naglowek(`${mod} — rysunki formatek`, "Wymiary gotowe (po oklejeniu) w mm; w nawiasie wymiar cięcia. Czerwona krawędź = oklejona. Otworowanie wg standardu zakładu — nie ujęte w arkuszu rozkroju.");
    const kom = f.slice(s, s + naStrone);
    const cw = (P - L) / 4;
    const ch = (H - y0 - 34) / 2;
    kom.forEach((q, i) => {
      const cx = L + (i % 4) * cw;
      const cy = y0 + Math.floor(i / 4) * ch;
      doc.rect(cx + 2, cy, cw - 4, ch - 6).lineWidth(0.4).strokeColor(LINIA).stroke();
      doc.font("B").fontSize(8.5).fillColor(TEKST).text(q.kod, cx + 8, cy + 6, { width: cw - 16, lineBreak: false, ellipsis: true });
      doc.font("R").fontSize(7.5).fillColor(SZARY).text(`${nazwaElementu(q.element)} · ${q.ilosc} szt. · okleina ${q.okleina}`, cx + 8, cy + 18, { width: cw - 16, lineBreak: false, ellipsis: true });
      const [gd, gs] = q.gotowy.split("×").map((v) => parseFloat(v));
      const maxW = cw - 60;
      const maxH = ch - 90;
      const sk = Math.min(maxW / gd, maxH / gs);
      const rw = Math.max(gd * sk, 6);
      const rh = Math.max(gs * sk, 6);
      const rx = cx + (cw - rw) / 2;
      const ry = cy + 40 + (maxH - rh) / 2;
      doc.rect(rx, ry, rw, rh).lineWidth(0.7).strokeColor(TEKST).stroke();
      const kr = (on: string, x1: number, y1: number, x2: number, y2: number) => {
        if (on === "1") doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(2.6).strokeColor(OBRZEZE).stroke();
      };
      kr(q.okleina[0], rx, ry + rh, rx + rw, ry + rh); // DA — dół (przód)
      kr(q.okleina[1], rx, ry, rx + rw, ry); // DB — góra (tył)
      kr(q.okleina[2], rx, ry, rx, ry + rh); // KA — lewa
      kr(q.okleina[3], rx + rw, ry, rx + rw, ry + rh); // KB — prawa
      doc.font("C").fontSize(7).fillColor(TEKST);
      doc.text(`${fmt(gd)} (${fmt(q.dl)})`, rx, ry + rh + 5, { width: rw, align: "center" });
      doc.save();
      doc.rotate(-90, { origin: [rx - 6, ry + rh / 2] });
      doc.text(`${fmt(gs)} (${fmt(q.sz)})`, rx - 6 - 50, ry + rh / 2 - 8, { width: 100, align: "center" });
      doc.restore();
      doc.font("C").fontSize(6).fillColor(SZARY);
      doc.text("DA", rx + rw / 2 - 5, ry + rh - 9, { lineBreak: false });
      if (rh > 20) doc.text("DB", rx + rw / 2 - 5, ry + 2, { lineBreak: false });
      if (rw > 30) {
        doc.text("KA", rx + 2, ry + rh / 2 - 3, { lineBreak: false });
        doc.text("KB", rx + rw - 12, ry + rh / 2 - 3, { lineBreak: false });
      }
      doc.font("R").fontSize(6.8).fillColor(SZARY).text(krotkiMaterial(q.material), cx + 8, cy + ch - 26, { width: cw - 16, height: 16, ellipsis: true });
    });
  }
}

// ---------- CLI ----------

if (process.argv[1]?.endsWith("dokumentacja-z-rozkroju.ts")) {
  const [xlsx, arkusz, wyjscie, przypisaniaPlik] = process.argv.slice(2);
  const { wiersze } = czytajArkusz(xlsx, arkusz);
  const { formatki, uwagi } = analizuj(wiersze);
  const przypisania = przypisaniaPlik ? (JSON.parse(readFileSync(przypisaniaPlik, "utf8")) as Record<string, Przypisanie>) : {};
  const pdf = await dokumentacjaPdf({ klient: arkusz.charAt(0) + arkusz.slice(1).toLowerCase(), zrodlo: xlsx.split(/[\\/]/).pop()!, arkusz, formatki, uwagi, przypisania, data: new Date() });
  writeFileSync(wyjscie, pdf);
  console.log(`${formatki.length} pozycji, ${formatki.reduce((s, f) => s + f.ilosc, 0)} formatek, ${new Set(formatki.map((f) => f.modul)).size} grup → ${wyjscie}`);
}
