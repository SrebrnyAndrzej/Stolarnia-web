import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import PDFDocument from "pdfkit";
import { niszaSlupka } from "../core/builder.js";
import { punktNaRzucie, scianyNaRzucie } from "../core/geometry.js";
import type { Modul, Projekt, RodzajAGD, Sciana, UrzadzenieAGD } from "../core/types.js";

// Wstępne rysunki szkieletowe dla klienta (A4 poziomo, do druku i ręcznego szkicowania):
// • ciąg dolny — rzut z numeracją szafek + widok każdej ściany z pustymi obrysami korpusów, cokołem, blatem i polem na uwagi;
// • ciąg wysoki — widok ściany ze słupkami, niszami AGD (piekarnik, mikrofala) i lodówką z odstępami + rzut z otwieraniem drzwi.
// Urządzenia rysowane są według danych AGD zapisanych w projekcie (Projekt.agd); bez nich — tylko nisze z opisem „model do ustalenia”.

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
const PROG_WYSOKICH_MM = 1400;

export interface OpcjeSzkicow {
  dolny?: boolean;
  wysoki?: boolean;
  /** Kolejność ścian ciągu dolnego (litery), domyślnie ciąg liczony od ściany po przerwie. */
  kolejnoscDolnych?: string[];
  /** Ściany ciągu wysokiego (litery), domyślnie wszystkie ze słupkami. */
  scianyWysokie?: string[];
}

const litera = (s: Sciana) => s.nazwa.trim().charAt(0).toUpperCase();
const dolneNa = (p: Projekt, s: Sciana) => p.moduly.filter((m) => m.scianaId === s.id && m.pozycjaYMM < 1000 && m.wysokoscMM < PROG_WYSOKICH_MM).sort((a, b) => a.pozycjaXMM - b.pozycjaXMM);
const slupkiNa = (p: Projekt, s: Sciana) => p.moduly.filter((m) => m.scianaId === s.id && m.wysokoscMM >= PROG_WYSOKICH_MM).sort((a, b) => a.pozycjaXMM - b.pozycjaXMM);

/** Ściany, dla których da się narysować szkic: dolne w kolejności ciągu, wysokie w kolejności pomieszczenia. */
export function scianySzkicow(p: Projekt): { dolne: string[]; wysokie: string[] } {
  const pom = p.pomieszczenia[0];
  if (!pom) return { dolne: [], wysokie: [] };
  const sc = pom.sciany;
  const z = sc.map((s) => dolneNa(p, s).length > 0);
  // Ciąg zaczyna się od ściany, przed którą (zgodnie z obiegiem) nie ma szafek dolnych — np. U: D, A, B.
  const start = z.findIndex((ma, i) => ma && !z[(i + sc.length - 1) % sc.length]);
  const kolejne = sc.map((_, i) => sc[(Math.max(0, start) + i) % sc.length]);
  return {
    dolne: kolejne.filter((s) => dolneNa(p, s).length).map(litera),
    wysokie: sc.filter((s) => slupkiNa(p, s).length).map(litera),
  };
}

export function szkicePdf(p: Projekt, o: OpcjeSzkicow = {}): Promise<Buffer> {
  const pom = p.pomieszczenia[0];
  if (!pom) throw new Error("Projekt nie ma pomieszczenia.");
  const dostepne = scianySzkicow(p);
  const dolny = o.dolny ?? true;
  const wysoki = o.wysoki ?? true;
  const poLiterach = (l: string[]) => l.map((x) => pom.sciany.find((s) => litera(s) === x.trim().toUpperCase())).filter((s): s is Sciana => !!s);
  const scDolne = dolny ? poLiterach(o.kolejnoscDolnych?.length ? o.kolejnoscDolnych : dostepne.dolne).filter((s) => dolneNa(p, s).length) : [];
  const scWysokie = wysoki ? poLiterach(o.scianyWysokie?.length ? o.scianyWysokie : dostepne.wysokie).filter((s) => slupkiNa(p, s).length) : [];
  if (!scDolne.length && !scWysokie.length) throw new Error("Brak szafek do narysowania — projekt nie ma ciągu dolnego ani słupków.");

  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: M, autoFirstPage: false, info: { Title: `Szkic zabudowy — ${p.nazwa}` } });
  doc.registerFont("R", join(FONTY, "DejaVuSans.ttf"));
  doc.registerFont("B", join(FONTY, "DejaVuSans-Bold.ttf"));
  doc.registerFont("C", join(FONTY, "DejaVuSansCondensed.ttf"));
  const bufory: Buffer[] = [];
  doc.on("data", (b: Buffer) => bufory.push(b));
  const koniec = new Promise<Buffer>((ok) => doc.on("end", () => ok(Buffer.concat(bufory))));

  const r = new Rysownik(doc, p);
  if (scDolne.length) rysujCiagDolny(r, p, scDolne);
  for (const s of scWysokie) rysujCiagWysoki(r, p, s);
  doc.end();
  return koniec;
}

// ---------- Wspólne elementy rysunku ----------

class Rysownik {
  constructor(
    readonly doc: PDFKit.PDFDocument,
    readonly p: Projekt,
  ) {}

  naglowek(tytul: string, pod: string) {
    const d = this.doc;
    d.addPage();
    d.page.margins.bottom = 0; // etykiety przy krawędzi nie mogą przenosić rysunku na nową stronę
    d.font("B").fontSize(16).fillColor(CIEMNY).text(tytul, M, M - 6, { width: W - 2 * M - 270, lineBreak: false, ellipsis: true });
    const klient = this.p.klient.nazwa && !this.p.nazwa.includes(this.p.klient.nazwa) ? ` · ${this.p.klient.nazwa}` : "";
    d.font("R").fontSize(8).fillColor(SZARY).text(`${this.p.nazwa}${klient} · szkic wstępny · data: ____________`, W - M - 300, M - 2, { width: 300, align: "right", lineBreak: false, ellipsis: true });
    d.font("R").fontSize(8.5).fillColor(SZARY).text(pod, M, M + 16, { width: W - 2 * M, lineBreak: false, ellipsis: true });
    d.moveTo(M, M + 30).lineTo(W - M, M + 30).lineWidth(0.5).strokeColor(JASNY).stroke();
  }

  tekst(t: string, x: number, y: number, w: number, o: { font?: string; size?: number; kolor?: string; align?: "left" | "center" | "right" } = {}) {
    this.doc.font(o.font ?? "C").fontSize(o.size ?? 7).fillColor(o.kolor ?? SZARY).text(t, x, y, { width: Math.max(1, w), align: o.align ?? "center", lineBreak: false });
  }

  wymiarPoziomy(x1: number, x2: number, y: number, t: string, yRef: number) {
    const d = this.doc;
    d.lineWidth(0.5).strokeColor(WYMIAR);
    d.moveTo(x1, yRef).lineTo(x1, y + 3).moveTo(x2, yRef).lineTo(x2, y + 3).moveTo(x1, y).lineTo(x2, y).stroke();
    for (const x of [x1, x2]) d.moveTo(x - 2.5, y + 2.5).lineTo(x + 2.5, y - 2.5).stroke();
    this.tekst(t, x1 - 12, y - 9, x2 - x1 + 24, { size: x2 - x1 < 22 ? 5.5 : 7.5, kolor: WYMIAR });
  }

  wymiarPionowy(y1: number, y2: number, x: number, t: string, xRef: number) {
    const d = this.doc;
    d.lineWidth(0.5).strokeColor(WYMIAR);
    d.moveTo(xRef, y1).lineTo(x - 3, y1).moveTo(xRef, y2).lineTo(x - 3, y2).moveTo(x, y1).lineTo(x, y2).stroke();
    for (const y of [y1, y2]) d.moveTo(x - 2.5, y + 2.5).lineTo(x + 2.5, y - 2.5).stroke();
    d.save().rotate(-90, { origin: [x - 5, (y1 + y2) / 2] });
    this.tekst(t, x - 45, (y1 + y2) / 2 - 9, 80, { size: 7, kolor: WYMIAR });
    d.restore();
  }

  kreskowanie(x: number, y: number, w: number, h: number, kolor = JASNY) {
    const d = this.doc;
    d.save().rect(x, y, w, h).clip();
    d.lineWidth(0.4).strokeColor(kolor);
    for (let k = -h; k < w; k += 6) d.moveTo(x + k, y + h).lineTo(x + k + h, y).stroke();
    d.restore();
    d.rect(x, y, w, h).lineWidth(0.5).dash(3, { space: 2 }).strokeColor(SZARY).stroke().undash();
  }

  przerywana(x1: number, y1: number, x2: number, y2: number, kolor = SZARY, gr = 0.5) {
    this.doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(gr).dash(4, { space: 2.5 }).strokeColor(kolor).stroke().undash();
  }

  linie(x: number, y: number, w: number, y1: number, krok = 19) {
    for (let yy = y; yy < y1; yy += krok) this.doc.moveTo(x, yy).lineTo(x + w, yy).lineWidth(0.4).strokeColor(JASNY).stroke();
  }

  agd(rodzaj: RodzajAGD): UrzadzenieAGD | undefined {
    return this.p.agd?.find((a) => a.rodzaj === rodzaj);
  }
}

const NAZWY_AGD: Record<RodzajAGD, string> = { piekarnik: "piekarnik", mikrofala: "mikrofala", plyta: "płyta grzewcza", lodowka: "lodówka", zmywarka: "zmywarka", okap: "okap", inne: "urządzenie" };

function opisDolnej(r: Rysownik, m: Modul): string {
  // Najpierw typ konstrukcji; nazwę sprawdzamy tylko dla urządzeń (uwagi mogą wspominać sąsiednie szafki).
  const cfg = m.konfiguracja;
  if (m.konstrukcja === "sink") return "zlew";
  if (/indukc|płyt[aęy] grzew|pod płytę/i.test(m.nazwa)) return r.agd("plyta") ? `płyta ${r.agd("plyta")!.model.replace(/^\S+\s/, "")}` : "płyta grzewcza";
  const drzwiN = (cfg.szerokoscDrzwiNaroznikaMM ?? 450) / 10;
  const strona = cfg.stronaDrzwiNaroznika === "lewa" ? "lewe" : "prawe";
  if (cfg.systemNarozny === "lemans") return `narożnik LeMans (drzwi ${drzwiN} ${strona})`;
  if (m.konstrukcja === "blindCorner") return `narożnik ślepy (drzwi ${drzwiN} ${strona})`;
  if (m.konstrukcja === "cargo") return "cargo";
  if (m.konstrukcja === "dishwasherFront") return "zmywarka";
  if (m.konstrukcja === "oven") return "piekarnik";
  return "";
}

// ---------- Ciąg dolny ----------

function rysujCiagDolny(r: Rysownik, p: Projekt, sciany: Sciana[]) {
  const d = r.doc;
  const pom = p.pomieszczenia[0];
  const numer = new Map<string, string>();
  for (const s of sciany) dolneNa(p, s).forEach((m, i) => numer.set(m.id, `${litera(s)}${i + 1}`));
  const rzut = scianyNaRzucie(pom);

  // Strefy narożne: fragment ściany zajęty przez głębokość ciągu na ścianie sąsiedniej
  const narozniki = (s: Sciana) => {
    const i = pom.sciany.indexOf(s);
    const poprz = pom.sciany[(i + pom.sciany.length - 1) % pom.sciany.length];
    const nast = pom.sciany[(i + 1) % pom.sciany.length];
    const wynik: { a0: number; a1: number; opis: string }[] = [];
    const gl = (sc: Sciana) => Math.max(0, ...dolneNa(p, sc).map((m) => m.glebokoscMM + 20));
    const kPoprz = dolneNa(p, poprz).find((m) => m.pozycjaXMM + m.szerokoscMM >= poprz.dlugoscMM - 5);
    const glP = poprz !== s ? gl(poprz) : 0;
    if (glP && !dolneNa(p, s).some((m) => m.pozycjaXMM < 5)) wynik.push({ a0: 0, a1: glP, opis: kPoprz ? `narożnik — szafka ${numer.get(kPoprz.id) ?? ""} ze ściany ${litera(poprz)}` : "narożnik — pusty (do ustalenia)" });
    const kNast = dolneNa(p, nast).find((m) => m.pozycjaXMM < 5);
    const glN = nast !== s ? gl(nast) : 0;
    if (glN && !dolneNa(p, s).some((m) => m.pozycjaXMM + m.szerokoscMM >= s.dlugoscMM - 5)) wynik.push({ a0: s.dlugoscMM - glN, a1: s.dlugoscMM, opis: kNast ? `narożnik — szafka ${numer.get(kNast.id) ?? ""} ze ściany ${litera(nast)}` : "narożnik — pusty (do ustalenia)" });
    return wynik;
  };

  // Wymiary typowe z projektu (pierwsza szafka dolna)
  const wzor = dolneNa(p, sciany[0])[0];
  const cokol = wzor?.pozycjaYMM ?? 100;
  const korpus = wzor?.wysokoscMM ?? 720;
  const blatG = 38;
  const gora = cokol + korpus + blatG;

  // ---------- Strona: rzut całości ----------
  r.naglowek("Ciąg dolny — rzut i numeracja szafek", "Widok z góry. Numery szafek jak na kolejnych stronach (litera ściany + numer od lewej, patrząc na ścianę z wnętrza).");
  {
    const pkt = rzut.flatMap((w) => [[w.x1, w.y1], [w.x2, w.y2]]);
    const [minX, maxX] = [Math.min(...pkt.map((q) => q[0])), Math.max(...pkt.map((q) => q[0]))];
    const [minY, maxY] = [Math.min(...pkt.map((q) => q[1])), Math.max(...pkt.map((q) => q[1]))];
    const obszar = { x: M + 40, y: M + 70, w: 400, h: H - 2 * M - 120 };
    const sk = Math.min(obszar.w / Math.max(1, maxX - minX), obszar.h / Math.max(1, maxY - minY));
    const X = (x: number) => obszar.x + (x - minX) * sk;
    const Y = (y: number) => obszar.y + (y - minY) * sk;
    for (const w of rzut) {
      d.moveTo(X(w.x1), Y(w.y1)).lineTo(X(w.x2), Y(w.y2)).lineWidth(3).strokeColor(CIEMNY).stroke();
      const [cx, cy] = punktNaRzucie(w, w.sciana.dlugoscMM / 2, -220);
      d.font("B").fontSize(10).fillColor(CIEMNY).text(litera(w.sciana), X(cx) - 10, Y(cy) - 6, { width: 20, align: "center", lineBreak: false });
    }
    for (const m of p.moduly) {
      const w = rzut.find((q) => q.sciana.id === m.scianaId);
      if (!w) continue;
      const rog = [punktNaRzucie(w, m.pozycjaXMM, 0), punktNaRzucie(w, m.pozycjaXMM + m.szerokoscMM, 0), punktNaRzucie(w, m.pozycjaXMM + m.szerokoscMM, m.glebokoscMM), punktNaRzucie(w, m.pozycjaXMM, m.glebokoscMM)];
      const dolny = numer.has(m.id);
      const wiszacy = !dolny && m.wysokoscMM < PROG_WYSOKICH_MM;
      if (wiszacy) continue; // szafki wiszące nie zasłaniają rzutu ciągu dolnego
      d.moveTo(X(rog[0][0]), Y(rog[0][1]));
      rog.slice(1).forEach((q) => d.lineTo(X(q[0]), Y(q[1])));
      d.closePath().lineWidth(dolny ? 0.9 : 0.4).fillAndStroke(dolny ? "#ffffff" : "#eeebe6", dolny ? CIEMNY : JASNY);
      const [sx, sy] = punktNaRzucie(w, m.pozycjaXMM + m.szerokoscMM / 2, m.glebokoscMM / 2);
      d.font(dolny ? "B" : "R").fontSize(dolny ? 8 : 6).fillColor(dolny ? CIEMNY : SZARY).text(dolny ? `${numer.get(m.id)}\n${m.szerokoscMM / 10}` : "słupek", X(sx) - 22, Y(sy) - (dolny ? 8 : 3), { width: 44, align: "center", lineBreak: dolny });
    }
    let ty = M + 50;
    const tx = M + 480;
    d.font("B").fontSize(10).fillColor(CIEMNY).text("Szafki ciągu dolnego", tx, ty);
    ty += 16;
    for (const s of sciany) {
      d.font("B").fontSize(8.5).fillColor(CIEMNY).text(`Ściana ${s.nazwa}`, tx, ty, { width: W - M - tx });
      ty = d.y + 2;
      for (const m of dolneNa(p, s)) {
        const staly = opisDolnej(r, m);
        d.font("R").fontSize(8).fillColor(CIEMNY).text(`${numer.get(m.id)}  ·  ${m.szerokoscMM} mm${staly ? `  ·  ${staly}` : ""}`, tx + 8, ty, { width: W - M - tx - 8 });
        ty = d.y + 2;
      }
      ty += 6;
    }
    d.font("R").fontSize(7.5).fillColor(SZARY).text(`Wys. szafek ${korpus} + nóżki ${cokol}, blat ${blatG} → ${gora} mm. Wymiary z projektu, do weryfikacji pomiarem.`, tx, ty + 6, { width: W - M - tx });
  }

  // ---------- Strony ścian ----------
  for (const s of sciany) {
    const mod = dolneNa(p, s);
    r.naglowek(`Ściana ${s.nazwa} — ciąg dolny`, "Widok z wnętrza. Wnętrze szafek puste — zaznacz: szuflady (podział i wysokości) / drzwi z półkami / inne. Wymiary w mm.");
    const obszar = { x: M + 46, y: M + 70, w: W - 2 * M - 60, h: 250 };
    const zakresH = gora + 250;
    const sk = Math.min(obszar.w / s.dlugoscMM, obszar.h / zakresH);
    const ox = obszar.x + (obszar.w - s.dlugoscMM * sk) / 2;
    const oy = obszar.y + obszar.h;
    const X = (x: number) => ox + x * sk;
    const Y = (y: number) => oy - y * sk;
    d.moveTo(X(-120), Y(0)).lineTo(X(s.dlugoscMM + 120), Y(0)).lineWidth(1.4).strokeColor(CIEMNY).stroke();
    for (const x of [0, s.dlugoscMM]) d.moveTo(X(x), Y(0)).lineTo(X(x), Y(zakresH - 60)).lineWidth(1.2).strokeColor(CIEMNY).stroke();
    for (const n of narozniki(s)) {
      r.kreskowanie(X(n.a0), Y(cokol + korpus), (n.a1 - n.a0) * sk, (cokol + korpus) * sk);
      r.doc.font("C").fontSize(6.5).fillColor(SZARY).text(n.opis, X(n.a0) + 2, Y((cokol + korpus) / 2), { width: (n.a1 - n.a0) * sk - 4, align: "center" });
    }
    let blat0 = Infinity;
    let blat1 = -Infinity;
    for (const m of mod) {
      const [x0, x1] = [X(m.pozycjaXMM), X(m.pozycjaXMM + m.szerokoscMM)];
      const [yDol, yGora] = [Y(m.pozycjaYMM), Y(m.pozycjaYMM + m.wysokoscMM)];
      d.rect(x0 + 1, yDol, x1 - x0 - 2, m.pozycjaYMM * sk).lineWidth(0.4).fillAndStroke("#e9e6e1", JASNY);
      d.rect(x0, yGora, x1 - x0, yDol - yGora).lineWidth(1.1).strokeColor(CIEMNY).stroke();
      for (let h = 100; h < m.wysokoscMM; h += 100) {
        const yy = Y(m.pozycjaYMM + h);
        d.moveTo(x0, yy).lineTo(x0 + 5, yy).moveTo(x1 - 5, yy).lineTo(x1, yy).lineWidth(0.4).strokeColor(JASNY).stroke();
      }
      d.font("B").fontSize(11).fillColor(JASNY).text(numer.get(m.id) ?? "", x0, yGora + 4, { width: x1 - x0, align: "center", lineBreak: false });
      const staly = opisDolnej(r, m);
      if (staly) r.tekst(staly, x0 + 3, yDol - 12, x1 - x0 - 6, { size: 6.5 });
      if (m.konstrukcja === "blindCorner") {
        const drzwi = m.konfiguracja.szerokoscDrzwiNaroznikaMM ?? 450;
        const lewe = m.konfiguracja.stronaDrzwiNaroznika === "lewa";
        const xd = lewe ? X(m.pozycjaXMM + drzwi) : X(m.pozycjaXMM + m.szerokoscMM - drzwi);
        d.moveTo(xd, yGora).lineTo(xd, yDol).lineWidth(0.5).dash(3, { space: 2 }).strokeColor(SZARY).stroke().undash();
      }
      if (m.konfiguracja.blat) {
        blat0 = Math.min(blat0, m.pozycjaXMM);
        blat1 = Math.max(blat1, m.pozycjaXMM + m.szerokoscMM);
      }
    }
    if (blat1 > blat0) d.rect(X(blat0), Y(gora), (blat1 - blat0) * sk, blatG * sk).lineWidth(0.6).fillAndStroke("#f1eee9", CIEMNY);
    const yw = oy + 16;
    let poprz = 0;
    for (const m of mod) {
      if (m.pozycjaXMM > poprz + 1) r.wymiarPoziomy(X(poprz), X(m.pozycjaXMM), yw, String(m.pozycjaXMM - poprz), oy);
      r.wymiarPoziomy(X(m.pozycjaXMM), X(m.pozycjaXMM + m.szerokoscMM), yw, String(m.szerokoscMM), oy);
      poprz = m.pozycjaXMM + m.szerokoscMM;
    }
    if (poprz < s.dlugoscMM - 1) r.wymiarPoziomy(X(poprz), X(s.dlugoscMM), yw, String(s.dlugoscMM - poprz), oy);
    r.wymiarPoziomy(X(0), X(s.dlugoscMM), yw + 20, `${s.dlugoscMM} (ściana)`, oy);
    r.wymiarPionowy(Y(cokol), Y(0), ox - 14, String(cokol), ox);
    r.wymiarPionowy(Y(cokol + korpus), Y(cokol), ox - 14, String(korpus), ox);
    r.wymiarPionowy(Y(gora), Y(cokol + korpus), ox - 14, String(blatG), ox);
    r.wymiarPionowy(Y(gora), Y(0), ox - 30, String(gora), ox);
    const ny = yw + 44;
    d.font("B").fontSize(9).fillColor(CIEMNY).text("Uwagi / ustalenia:", M, ny);
    r.linie(M, ny + 22, W - 2 * M, H - M - 4, 20);
  }
}

// ---------- Ciąg wysoki ----------

function rysujCiagWysoki(r: Rysownik, p: Projekt, s: Sciana) {
  const d = r.doc;
  const slupki = slupkiNa(p, s);
  const numer = new Map(slupki.map((m, i) => [m.id, `${litera(s)}${i + 1}`]));
  const gora = Math.max(...slupki.map((m) => m.pozycjaYMM + m.wysokoscMM));
  const glSlupkow = Math.max(...slupki.map((m) => m.glebokoscMM));
  const piekD = r.agd("piekarnik");
  const mikroD = r.agd("mikrofala");
  const lodD = r.agd("lodowka");
  const pk = { szer: piekD?.szerMM ?? 594, wys: piekD?.wysMM ?? 589, model: piekD?.model };
  const mk = { szer: mikroD?.szerMM ?? 594, wys: mikroD?.wysMM ?? 382, model: mikroD?.model };
  const krotko = (model?: string) => (model ? model.split(/\s+/).slice(-1)[0] : "model do ustalenia");

  // Luki między słupkami; najszersza (≥ 800 mm albo ≥ szerokość podanej lodówki) = nisza lodówki
  const luki: { x0: number; x1: number }[] = [];
  let poprz = 0;
  for (const m of slupki) {
    if (m.pozycjaXMM > poprz + 1) luki.push({ x0: poprz, x1: m.pozycjaXMM });
    poprz = Math.max(poprz, m.pozycjaXMM + m.szerokoscMM);
  }
  if (poprz < s.dlugoscMM - 1) luki.push({ x0: poprz, x1: s.dlugoscMM });
  const minNisza = lodD?.szerMM ? Math.min(800, lodD.szerMM) : 800;
  const niszaLod = luki.filter((l) => l.x1 - l.x0 >= minNisza).sort((a, b) => b.x1 - b.x0 - (a.x1 - a.x0))[0];
  const lod = lodD?.szerMM && lodD.wysMM ? { szer: lodD.szerMM, wys: lodD.wysMM, gl: lodD.glMM, glKorpus: lodD.glKorpusuMM ?? (lodD.glMM ? lodD.glMM - 100 : undefined), tyl: lodD.odstepTylMM ?? 0, bok: lodD.odstepBokMM, gora: lodD.odstepGoraMM ?? 0, glOtwarte: lodD.glOtwarteMM, model: lodD.model } : undefined;
  const lodX0 = niszaLod && lod ? niszaLod.x0 + (niszaLod.x1 - niszaLod.x0 - lod.szer) / 2 : 0;
  const bokLod = niszaLod && lod ? (niszaLod.x1 - niszaLod.x0 - lod.szer) / 2 : 0;
  const piek = slupki.find((m) => niszaSlupka(m));

  // ---------- Strona 1: widok ściany ----------
  r.naglowek(`Ściana ${s.nazwa} — ciąg wysoki`, "Widok z wnętrza. Słupki puste do zaznaczenia: szuflady / drzwi z półkami / cargo. Urządzenia w skali według danych AGD projektu. Wymiary w mm.");
  {
    const obszar = { x: M + 52, y: M + 50, w: 470, h: H - M - 50 - (M + 50) };
    const zakresH = Math.max(s.wysokoscMM, gora + 100);
    const sk = Math.min(obszar.w / (s.dlugoscMM + 200), (obszar.h - 50) / zakresH);
    const ox = obszar.x + 10;
    const oy = obszar.y + zakresH * sk + 4;
    const X = (x: number) => ox + x * sk;
    const Y = (y: number) => oy - y * sk;

    d.moveTo(X(-100), Y(0)).lineTo(X(s.dlugoscMM + 100), Y(0)).lineWidth(1.4).strokeColor(CIEMNY).stroke();
    for (const x of [0, s.dlugoscMM]) d.moveTo(X(x), Y(0)).lineTo(X(x), Y(zakresH)).lineWidth(1.2).strokeColor(CIEMNY).stroke();
    r.przerywana(X(-100), Y(s.wysokoscMM), X(s.dlugoscMM + 100), Y(s.wysokoscMM), CIEMNY, 0.8);
    r.tekst(`sufit ${s.wysokoscMM}`, X(s.dlugoscMM) - 80, Y(s.wysokoscMM) + 3, 76, { align: "right" });
    if (s.wysokoscMM - gora > 80) r.tekst(`${s.wysokoscMM - gora} do sufitu — nadstawki / blenda?`, X(0), Y((s.wysokoscMM + gora) / 2) - 4, s.dlugoscMM * sk, { size: 7 });
    r.przerywana(X(0), Y(858), X(s.dlugoscMM), Y(858), AGD_KOLOR, 0.4);
    r.przerywana(X(0), Y(820), X(s.dlugoscMM), Y(820), JASNY, 0.4);

    for (const m of slupki) {
      const [x0, x1] = [X(m.pozycjaXMM), X(m.pozycjaXMM + m.szerokoscMM)];
      const [yDol, yGora] = [Y(m.pozycjaYMM), Y(m.pozycjaYMM + m.wysokoscMM)];
      d.rect(x0 + 1, yDol, x1 - x0 - 2, m.pozycjaYMM * sk).lineWidth(0.4).fillAndStroke("#e9e6e1", JASNY);
      d.rect(x0, yGora, x1 - x0, yDol - yGora).lineWidth(1.1).strokeColor(CIEMNY).stroke();
      for (let h = 100; h < m.wysokoscMM; h += 100) {
        const yy = Y(m.pozycjaYMM + h);
        d.moveTo(x0, yy).lineTo(x0 + 4, yy).moveTo(x1 - 4, yy).lineTo(x1, yy).lineWidth(0.4).strokeColor(JASNY).stroke();
      }
      d.font("B").fontSize(11).fillColor(JASNY).text(numer.get(m.id) ?? "", x0, yGora + 4, { width: x1 - x0, align: "center", lineBreak: false });
      const n = niszaSlupka(m);
      if (n) {
        const t = 18;
        const y0 = m.pozycjaYMM + n.dol;
        const mf = n.mikrofala;
        if (mf) {
          const my0 = y0 + mf.od + (mf.wys - mk.wys) / 2;
          const mx0 = X(m.pozycjaXMM + (m.szerokoscMM - mk.szer) / 2);
          d.rect(mx0, Y(my0 + mk.wys), mk.szer * sk, mk.wys * sk).lineWidth(0.9).strokeColor(AGD_KOLOR).stroke();
          d.rect(mx0 + 40 * sk, Y(my0 + mk.wys - 50), (mk.szer - 340) * sk, (mk.wys - 100) * sk).lineWidth(0.5).strokeColor(AGD_KOLOR).stroke();
          r.tekst("mikrofala", x0 + (x1 - x0) * 0.55, Y(my0 + mk.wys / 2) - 4, (x1 - x0) * 0.43, { font: "B", size: 7, kolor: AGD_KOLOR });
          r.tekst(krotko(mk.model), x0 + (x1 - x0) * 0.55, Y(my0 + mk.wys / 2) + 5, (x1 - x0) * 0.43, { size: 6, kolor: AGD_KOLOR });
        }
        for (const yp of [y0 - t, y0 + n.wys, ...(mf ? [y0 + mf.od - t] : [])]) d.rect(x0 + 1, Y(yp + t), x1 - x0 - 2, t * sk).lineWidth(0.4).fillAndStroke("#bdb6ab", SZARY);
        const px0 = X(m.pozycjaXMM + (m.szerokoscMM - pk.szer) / 2);
        d.rect(px0, Y(y0 + pk.wys), pk.szer * sk, pk.wys * sk).lineWidth(0.9).strokeColor(AGD_KOLOR).stroke();
        d.rect(px0 + 60 * sk, Y(y0 + pk.wys - 150), (pk.szer - 120) * sk, (pk.wys - 230) * sk).lineWidth(0.5).strokeColor(AGD_KOLOR).stroke();
        d.moveTo(px0 + 60 * sk, Y(y0 + pk.wys - 90)).lineTo(px0 + (pk.szer - 60) * sk, Y(y0 + pk.wys - 90)).lineWidth(1.2).strokeColor(AGD_KOLOR).stroke();
        r.tekst("piekarnik", x0, Y(y0 + pk.wys / 2) - 4, x1 - x0, { font: "B", size: 7, kolor: AGD_KOLOR });
        r.tekst(krotko(pk.model), x0, Y(y0 + pk.wys / 2) + 5, x1 - x0, { size: 6, kolor: AGD_KOLOR });
        const ls = m.konfiguracja.liczbaSzuflad;
        for (let i = 1; i < ls; i++) r.przerywana(x0 + 3, Y(m.pozycjaYMM + (n.dol * i) / ls), x1 - 3, Y(m.pozycjaYMM + (n.dol * i) / ls), JASNY, 0.4);
        if (ls > 0) r.tekst(`${ls} szuflady (propozycja)`, x0, Y(m.pozycjaYMM + n.dol / 2) - 3, x1 - x0, { size: 6 });
      } else if (m.szerokoscMM < 400) {
        r.tekst("słupek wąski", x0 + 1, yDol - 12, x1 - x0 - 2, { size: 5 });
      }
    }

    if (niszaLod && lod) {
      const [lx0, lx1] = [X(lodX0), X(lodX0 + lod.szer)];
      if (lod.gora > 0) {
        r.kreskowanie(X(lodX0), Y(lod.wys + lod.gora), lod.szer * sk, lod.gora * sk, "#e3c7b8");
        r.tekst(`min. ${lod.gora} wolne nad lodówką`, lx0 + 4, Y(lod.wys + lod.gora / 2) - 4, lx1 - lx0 - 40, { size: 6.5, kolor: AGD_KOLOR });
        r.wymiarPionowy(Y(lod.wys + lod.gora), Y(lod.wys), lx1 - 12, String(lod.gora), lx1 - 12);
      }
      d.roundedRect(lx0, Y(lod.wys), lx1 - lx0, lod.wys * sk, 3).lineWidth(1).strokeColor(AGD_KOLOR).stroke();
      r.tekst(`lodówka ${lod.model}`, lx0, Y(lod.wys * 0.72), lx1 - lx0, { font: "B", size: 7, kolor: AGD_KOLOR });
      r.wymiarPionowy(Y(lod.wys), Y(0), lx1 - 12, String(lod.wys), lx1 - 12);
      const yb = Y(lod.wys + 60);
      r.wymiarPoziomy(X(niszaLod.x0), lx0, yb, String(Math.round(bokLod)), yb);
      r.wymiarPoziomy(lx1, X(niszaLod.x1), yb, String(Math.round(bokLod)), yb);
    } else if (niszaLod) {
      r.kreskowanie(X(niszaLod.x0), Y(1800), (niszaLod.x1 - niszaLod.x0) * sk, 1800 * sk, "#e3c7b8");
      r.tekst("nisza — lodówka?", X(niszaLod.x0), Y(1000) - 8, (niszaLod.x1 - niszaLod.x0) * sk, { font: "B", size: 7.5, kolor: AGD_KOLOR });
      r.tekst("model do ustalenia (odstępy wg producenta)", X(niszaLod.x0), Y(1000) + 3, (niszaLod.x1 - niszaLod.x0) * sk, { size: 6, kolor: AGD_KOLOR });
    }

    const oyW = Y(0);
    const yw = oyW + 14;
    let px = 0;
    for (const m of slupki) {
      if (m.pozycjaXMM > px + 1) r.wymiarPoziomy(X(px), X(m.pozycjaXMM), yw, `nisza ${m.pozycjaXMM - px}`, oyW);
      r.wymiarPoziomy(X(m.pozycjaXMM), X(m.pozycjaXMM + m.szerokoscMM), yw, String(m.szerokoscMM), oyW);
      px = m.pozycjaXMM + m.szerokoscMM;
    }
    if (px < s.dlugoscMM - 1) r.wymiarPoziomy(X(px), X(s.dlugoscMM), yw, String(s.dlugoscMM - px), oyW);
    if (niszaLod && lod) r.wymiarPoziomy(X(lodX0), X(lodX0 + lod.szer), yw + 16, String(lod.szer), oyW);
    r.wymiarPoziomy(X(0), X(s.dlugoscMM), yw + 32, `${s.dlugoscMM} (ściana)`, oyW);
    const xa = ox - 12;
    const cokol = slupki[0].pozycjaYMM;
    r.wymiarPionowy(Y(cokol), Y(0), xa, String(cokol), ox);
    if (piek) {
      const n = niszaSlupka(piek)!;
      const y0 = piek.pozycjaYMM + n.dol;
      if (n.dol > 0) r.wymiarPionowy(Y(y0), Y(cokol), xa, String(n.dol), ox);
      if (n.mikrofala) {
        r.wymiarPionowy(Y(y0 + n.mikrofala.od - 18), Y(y0), xa, String(n.mikrofala.od - 18), ox);
        r.wymiarPionowy(Y(y0 + n.wys), Y(y0 + n.mikrofala.od), xa, String(n.mikrofala.wys), ox);
      } else r.wymiarPionowy(Y(y0 + n.wys), Y(y0), xa, `nisza ${n.wys}`, ox);
      r.wymiarPionowy(Y(gora), Y(y0 + n.wys), xa, String(gora - y0 - n.wys), ox);
      r.wymiarPionowy(Y(y0), Y(0), xa - 16, `${y0} dół piek.`, ox);
    }
    r.wymiarPionowy(Y(gora), Y(0), xa - 32, String(gora), ox);
    if (s.wysokoscMM > gora) r.wymiarPionowy(Y(s.wysokoscMM), Y(gora), xa - 32, String(s.wysokoscMM - gora), ox);
    r.tekst("858 blat ciągu dolnego", X(s.dlugoscMM) + 3, Y(858) - 4, 90, { align: "left", size: 6, kolor: AGD_KOLOR });

    // prawa kolumna
    const tx = M + 560;
    const tw = W - M - tx;
    let ty = M + 44;
    d.font("B").fontSize(9.5).fillColor(CIEMNY).text("Słupki", tx, ty);
    ty += 14;
    for (const m of slupki) {
      const n = niszaSlupka(m);
      const op = n ? `piekarnik${n.mikrofala ? " + mikrofala" : ""}${m.konfiguracja.liczbaSzuflad ? `, ${m.konfiguracja.liczbaSzuflad} szuflady pod` : ""}, drzwi nad` : m.szerokoscMM < 400 ? "wąski — półki / blachy" : "do rozrysowania";
      d.font("R").fontSize(7.5).fillColor(CIEMNY).text(`${numer.get(m.id)} · ${m.szerokoscMM} × ${m.wysokoscMM} · ${op}`, tx, ty, { width: tw });
      ty = d.y + 2;
    }
    if (niszaLod) {
      d.font("R").fontSize(7.5).fillColor(AGD_KOLOR).text(lod ? `Nisza lodówki ${niszaLod.x1 - niszaLod.x0} (lodówka ${lod.szer} + ${Math.round(bokLod)} z każdej strony)` : `Nisza ${niszaLod.x1 - niszaLod.x0} — lodówka do ustalenia`, tx, ty, { width: tw });
      ty = d.y + 8;
    }
    const stale: string[] = [];
    if (piek) {
      const n = niszaSlupka(piek)!;
      stale.push(`Piekarnik: nisza w projekcie ${595} × ${piek.szerokoscMM - 36}${piekD?.nisza ? `; producent: ${piekD.nisza}` : ""}; bez pleców za AGD.`);
      if (n.mikrofala) stale.push(`Mikrofala: nisza ${n.mikrofala.wys} × ${piek.szerokoscMM - 36} nad półką stałą${mikroD?.nisza ? `; producent: ${mikroD.nisza}` : ""}.`);
      stale.push(`Dół piekarnika ${piek.pozycjaYMM + n.dol} od podłogi.`);
    }
    if (lod) {
      stale.push(`Lodówka: ${[lod.tyl ? `${lod.tyl} z tyłu` : "", lod.bok ? `min. ${lod.bok} z boku` : "", lod.gora ? `${lod.gora} nad` : ""].filter(Boolean).join(", ") || "odstępy wg producenta"}.`);
      if (lod.gl) stale.push(`Lodówka wystaje ok. ${Math.max(0, lod.gl + lod.tyl - glSlupkow - 20)} przed fronty słupków (gł. ${lod.gl} z drzwiami).`);
    }
    if (stale.length) {
      d.font("B").fontSize(8).fillColor(CIEMNY).text("Stałe z urządzeń", tx, ty);
      ty = d.y + 2;
      for (const l of stale) {
        d.font("R").fontSize(7).fillColor(SZARY).text(`• ${l}`, tx, ty, { width: tw });
        ty = d.y + 2;
      }
      ty += 6;
    }
    d.font("B").fontSize(8.5).fillColor(CIEMNY).text("Uwagi / ustalenia:", tx, ty);
    r.linie(tx, ty + 30, tw, H - M);
  }

  // ---------- Strona 2: rzut + AGD ----------
  r.naglowek(`Ściana ${litera(s)} — rzut z góry: głębokości i otwieranie`, "Rzut z góry (ściana na górze rysunku). Strefy otwarcia drzwi urządzeń muszą zostać wolne. Wymiary w mm.");
  {
    const obszar = { x: M + 30, y: M + 60, w: 480, h: 250 };
    const zakresG = Math.max(lod?.glOtwarte ? lod.glOtwarte + lod.tyl : 0, lod?.gl ? lod.gl + lod.tyl + lod.szer / 2 : 0, glSlupkow + 600) + 60;
    const sk = Math.min(obszar.w / (s.dlugoscMM + 100), obszar.h / zakresG);
    const ox = obszar.x + 20;
    const oy = obszar.y;
    const X = (x: number) => ox + x * sk;
    const Y = (g: number) => oy + g * sk;
    d.moveTo(X(-80), Y(0)).lineTo(X(s.dlugoscMM + 80), Y(0)).lineWidth(2.5).strokeColor(CIEMNY).stroke();
    for (const x of [0, s.dlugoscMM]) d.moveTo(X(x), Y(0)).lineTo(X(x), Y(zakresG - 40)).lineWidth(1.2).strokeColor(CIEMNY).stroke();
    for (const m of slupki) {
      d.rect(X(m.pozycjaXMM), Y(0), m.szerokoscMM * sk, m.glebokoscMM * sk).lineWidth(1).fillAndStroke("#ffffff", CIEMNY);
      d.rect(X(m.pozycjaXMM) + 1, Y(m.glebokoscMM), m.szerokoscMM * sk - 2, 18 * sk).lineWidth(0.4).fillAndStroke("#e9e6e1", SZARY);
      r.tekst(numer.get(m.id) ?? "", X(m.pozycjaXMM), Y(m.glebokoscMM / 2) - 5, m.szerokoscMM * sk, { font: "B", size: 9, kolor: JASNY });
      if (niszaSlupka(m)) {
        r.kreskowanie(X(m.pozycjaXMM + 3), Y(m.glebokoscMM + 18), (m.szerokoscMM - 6) * sk, 500 * sk, "#e3c7b8");
        r.tekst("drzwi piekarnika (opuszczane)", X(m.pozycjaXMM), Y(m.glebokoscMM + 270) - 4, m.szerokoscMM * sk, { size: 6, kolor: AGD_KOLOR });
      }
    }
    if (niszaLod && lod?.gl) {
      const gTyl = lod.tyl;
      const glK = lod.glKorpus ?? lod.gl - 100;
      const gFront = gTyl + glK;
      const gd = gTyl + lod.gl;
      d.rect(X(lodX0), Y(gTyl), lod.szer * sk, glK * sk).lineWidth(1).strokeColor(AGD_KOLOR).stroke();
      d.rect(X(lodX0), Y(gFront), lod.szer * sk, (lod.gl - glK) * sk).lineWidth(0.6).fillAndStroke("#f3e6de", AGD_KOLOR);
      r.tekst("lodówka", X(lodX0), Y((gTyl + gFront) / 2) - 8, lod.szer * sk, { font: "B", size: 7.5, kolor: AGD_KOLOR });
      r.tekst(krotko(lod.model), X(lodX0), Y((gTyl + gFront) / 2) + 2, lod.szer * sk, { size: 6.5, kolor: AGD_KOLOR });
      // drzwi otwarte 90°: przy szerokości > 700 dwa skrzydła (French door / side-by-side), inaczej jedno
      const skrzydla: [number, 1 | -1, number][] = lod.szer > 700 ? [[lodX0, 1, lod.szer / 2], [lodX0 + lod.szer, -1, lod.szer / 2]] : [[lodX0, 1, lod.szer]];
      for (const [xz, kier, rr] of skrzydla) {
        d.moveTo(X(xz), Y(gd)).lineTo(X(xz), Y(gd + rr)).lineWidth(0.8).strokeColor(AGD_KOLOR).stroke();
        d.moveTo(X(xz + kier * rr), Y(gd));
        for (let i = 1; i <= 16; i++) {
          const a = (Math.PI / 2) * (i / 16);
          d.lineTo(X(xz + kier * rr * Math.cos(a)), Y(gd + rr * Math.sin(a)));
        }
        d.lineWidth(0.4).dash(3, { space: 2 }).strokeColor(AGD_KOLOR).stroke().undash();
      }
      if (lod.glOtwarte) {
        r.przerywana(X(lodX0 - 60), Y(lod.glOtwarte + lod.tyl), X(lodX0 + lod.szer + 60), Y(lod.glOtwarte + lod.tyl), AGD_KOLOR, 0.6);
        r.tekst(`${lod.glOtwarte} gł. przy drzwiach otwartych + ${lod.tyl} od ściany`, X(lodX0) - 40, Y(lod.glOtwarte + lod.tyl) + 3, lod.szer * sk + 80, { size: 6, kolor: AGD_KOLOR });
      }
      const xw = X(niszaLod.x0) + 8;
      if (gTyl) r.wymiarPionowy(Y(0), Y(gTyl), xw, String(gTyl), xw);
      r.wymiarPionowy(Y(gTyl), Y(gd), xw, String(lod.gl), xw);
    }
    const xk = X(s.dlugoscMM) + 14;
    r.wymiarPionowy(Y(0), Y(glSlupkow), xk, String(glSlupkow), X(s.dlugoscMM));
    r.wymiarPionowy(Y(glSlupkow), Y(glSlupkow + 18), xk + 14, "18", X(s.dlugoscMM));

    // prawa kolumna: urządzenia AGD projektu
    const tx = M + 560;
    const tw = W - M - tx;
    let ty = M + 44;
    const lista = p.agd ?? [];
    if (!lista.length) {
      d.font("B").fontSize(8.5).fillColor(AGD_KOLOR).text("Urządzenia AGD", tx, ty, { width: tw });
      ty = d.y + 2;
      d.font("R").fontSize(7.5).fillColor(SZARY).text("Brak danych AGD w projekcie — modele i wymiary do ustalenia z klientem. Nisze narysowane w wymiarach standardowych.", tx, ty, { width: tw });
      ty = d.y + 10;
    }
    for (const a of lista) {
      d.font("B").fontSize(8.5).fillColor(AGD_KOLOR).text(`${NAZWY_AGD[a.rodzaj]}: ${a.model}`, tx, ty, { width: tw });
      ty = d.y + 2;
      const wiersze = [
        a.szerMM || a.wysMM || a.glMM ? `Urządzenie ${a.wysMM ?? "?"} × ${a.szerMM ?? "?"} × ${a.glMM ?? "?"} (wys. × szer. × gł.)` : "",
        a.nisza ? `Nisza / otwór: ${a.nisza}` : "",
        a.rodzaj === "lodowka" && (a.odstepTylMM || a.odstepBokMM || a.odstepGoraMM) ? `Odstępy: ${a.odstepTylMM ?? 0} z tyłu, ${a.odstepBokMM ?? 0} z boku, ${a.odstepGoraMM ?? 0} nad` : "",
        ...(a.uwagi ?? []),
      ].filter(Boolean);
      for (const w of wiersze) {
        d.font("R").fontSize(7).fillColor(CIEMNY).text(`• ${w}`, tx, ty, { width: tw });
        ty = d.y + 1.5;
      }
      ty += 7;
      if (ty > H - M - 80) break;
    }
    d.font("B").fontSize(8.5).fillColor(CIEMNY).text("Uwagi / ustalenia:", tx, ty);
    r.linie(tx, ty + 30, tw, H - M);
    const ny = obszar.y + obszar.h + 40;
    d.font("B").fontSize(8.5).fillColor(CIEMNY).text("Szkic / pomiary na miejscu:", M, ny);
    r.linie(M, ny + 26, tx - M - 20, H - M);
  }
}
