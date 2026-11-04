import { technicalOpenings } from "../core/technical-openings.js";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import PDFDocument from "pdfkit";
import { obrysModulu, scianyNaRzucie, granice } from "../core/geometry.js";
import { doLokalnego } from "../core/technologia.js";
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

/**
 * Jeden schemat dokumentów warsztatu: każda strona ma kod sekcji i numer (np. „S-03”), ten sam blok rewizji
 * w prawym górnym rogu i tę samą stopkę z nazwą pakietu. Pakiety różnią się zestawem sekcji, nie wyglądem.
 */
export type RodzajPakietu = "produkcja" | "montaz";
export type SekcjaDokumentu = "T" | "R" | "E" | "I" | "S" | "C" | "M" | "Z" | "K";
export const SCHEMAT_SEKCJI: Record<SekcjaDokumentu, { nazwa: string; dla: string }> = {
  T: { nazwa: "Strona tytułowa, stan pakietu, diagnostyka", dla: "wszyscy" },
  R: { nazwa: "Rzut z góry z numerami mebli", dla: "wszyscy" },
  E: { nazwa: "Elewacje ścian z wymiarami", dla: "wszyscy" },
  I: { nazwa: "Indeks części", dla: "produkcja" },
  S: { nazwa: "Karta szafki: widoki, formatki, operacje", dla: "produkcja" },
  C: { nazwa: "Rysunek wykonawczy części", dla: "produkcja" },
  M: { nazwa: "Montaż: kolejność, wymiary montażowe, okucia", dla: "montaż" },
  Z: { nazwa: "Karta złożenia szafki: rysunek rozstrzelony, kroki", dla: "montaż" },
  K: { nazwa: "Kontrola i protokół odbioru", dla: "montaż" },
};
/** Dopuszczalna różnica przekątnych korpusu — zasada warsztatu Pan Stolarz (Mateusz, 1.11.2026). */
export const TOLERANCJA_PRZEKATNYCH_MM = 2;
const NAZWA_PAKIETU: Record<RodzajPakietu, string> = { produkcja: "PAKIET PRODUKCYJNY", montaz: "PAKIET MONTAŻOWY" };

export interface WejsciePdf {
  /** Domyślnie „produkcja”. „montaz” — rzut, elewacje z wymiarami montażowymi, kolejność, okucia i protokół odbioru. */
  rodzaj?: RodzajPakietu;
  /** Dane operacyjne montażu (z bieżącego projektu, nie z migawki): adres, kontakt, termin. */
  montaz?: { adres?: string; kontakt?: string; termin?: string; skladanie?: "warsztat" | "naMiejscu" };
  projekt: Projekt;
  zbudowane: ZbudowanyModul[];
  dokumentacja: DokumentacjaProjektu;
  firma?: string;
  /** Wydruk warsztatowy bez danych osobowych klienta. */
  ukryjDaneKlienta?: boolean;
  /** ID lub etykiety części — tylko ich rysunki zamiast pełnego pakietu. */
  tylkoCzesci?: string[];
  /** ID szafek — tylko ich strony (dokumentacja pojedynczej szafki). */
  tylkoModuly?: string[];
  /** Skrócone karty szafek bez osobnych rysunków części. Domyślnie pełny pakiet. */
  skrocony?: boolean;
  zwiezly?: boolean;
  /** PDF zamrożonego wydania produkcyjnego (numer i data wydania w nagłówku). */
  wydanie?: { numer: number; utworzono: string };
}

export function dokumentacjaPdf(w: WejsciePdf): Promise<Buffer> {
  const tytulPakietu = w.rodzaj === "montaz" ? "Pakiet montażowy" : "Dokumentacja";
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 28, autoFirstPage: false, bufferPages: true, info: { Title: `${tytulPakietu} — ${w.projekt.nazwa} (rew. ${w.dokumentacja.rewizja})`, Producer: w.dokumentacja.wersjaGeneratora } });
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
  if (w.zwiezly) {
    const modules=w.tylkoModuly?.length?w.zbudowane.filter(z=>w.tylkoModuly!.includes(z.modul.id)):w.zbudowane;
    for(const z of modules) ctx.kartaZwiezla(z);
    if(!modules.length) ctx.brak("Brak szafek w wybranym zakresie.");
  } else if (w.rodzaj === "montaz") {
    ctx.tytulMontazu();
    ctx.kuchnia();
    ctx.kolejnoscMontazu();
    for (const zm of w.zbudowane) ctx.zlozenie(zm);
    ctx.okuciaMontazu();
    ctx.protokolOdbioru();
  } else if (w.tylkoModuly?.length) {
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

  /** Sekcja schematu bieżącej strony — ustawiana na początku każdej sekcji; strony „(cd.)” dziedziczą sekcję. */
  private sekcja: SekcjaDokumentu = "T";
  private readonly licznikSekcji: Partial<Record<SekcjaDokumentu, number>> = {};
  /** Kody stron w kolejności druku (do testów i spisu). */
  readonly kodyStron: string[] = [];

  private nowaStrona(tytul: string, podtytul = "", format: "A4" | "A3" = "A4") {
    this.doc.addPage({ size: format, layout: "landscape", margin: this.m });
    this.strona += 1;
    const { doc, m } = this;
    const nr = (this.licznikSekcji[this.sekcja] ?? 0) + 1;
    this.licznikSekcji[this.sekcja] = nr;
    const kod = `${this.sekcja}-${String(nr).padStart(2, "0")}`;
    this.kodyStron.push(kod);
    // Kod strony w lewym górnym rogu — ten sam układ w pakiecie produkcyjnym i montażowym.
    doc.lineWidth(1).strokeColor("#000").rect(m, m - 4, 44, 22).stroke();
    doc.font("M").fontSize(10).fillColor("#000").text(kod, m, m + 2, { width: 44, align: "center", lineBreak: false });
    const tx = m + 52;
    doc.font("B").fontSize(13).fillColor("#000").text(tytul, tx, m, { width: this.W - 2 * m - 250 - 52 });
    if (podtytul) doc.font("R").fontSize(8.5).fillColor("#555").text(podtytul, tx, m + 17, { width: this.W - 2 * m - 250 - 52 });
    // Blok rewizji w prawym górnym rogu
    const x = this.W - m - 230;
    doc.lineWidth(0.6).strokeColor("#000").rect(x, m - 4, 230, 34).stroke();
    doc.font("R").fontSize(7).fillColor("#000");
    doc.text(`${this.w.projekt.nazwa}`, x + 5, m - 1, { width: 220, lineBreak: false, ellipsis: true });
    doc.text(
      this.w.wydanie
        ? `Wydanie ${this.w.wydanie.numer} · rew. ${this.d.rewizja} · ${new Date(this.w.wydanie.utworzono).toLocaleString("pl-PL")} · mm`
        : `Rewizja ${this.d.rewizja} · ${new Date(this.d.wygenerowano).toLocaleString("pl-PL")} · jednostki: mm`,
      x + 5,
      m + 9,
      { width: 220 },
    );
    doc.fillColor(this.d.gotowaDoProdukcji ? KOLOR_STATUSU.gotowa : KOLOR_STATUSU.brakDanych).font("B")
      .text(this.d.gotowaDoProdukcji ? "GOTOWA DO PRODUKCJI" : "DOKUMENT ROBOCZY — NIE DO PRODUKCJI", x + 5, m + 19, { width: 220 });
    doc.fillColor("#000");
  }

  brak(tekst: string) {
    this.sekcja = "T";
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
        .text(`${NAZWA_PAKIETU[this.w.rodzaj ?? "produkcja"]} · ${this.w.firma ? this.w.firma + " · " : ""}Stolarnia Online ${this.d.wersjaGeneratora} · projekt ${this.d.projektId} · strona ${i + 1}/${zakres.count}`, this.m, this.H - 20, { width: this.W - 2 * this.m, align: "center", lineBreak: false });
    }
  }

  /** Compact, dimensioned card: existing geometry and operations from the exact same revision. */
  kartaZwiezla(z: ZbudowanyModul) {
    this.sekcja = "S";
    const { doc, m } = this,
      md = z.modul;
    this.nowaStrona(
      `Karta skrócona: ${md.nazwa}`,
      `Korpus ${md.szerokoscMM} × ${md.wysokoscMM} × ${md.glebokoscMM} mm. Rysunki poglądowe, nie w skali 1:1.`,
    );
    const elements = z.elementy.filter((e) =>
      ["side", "top", "bottom", "shelf", "fixedShelf", "divider"].includes(
        e.rola,
      ),
    );
    const outline: [number, number][] = [
      [0, 0],
      [md.szerokoscMM, 0],
      [md.szerokoscMM, md.wysokoscMM],
      [0, md.wysokoscMM],
    ];
    const openings = technicalOpenings(
      outline,
      elements.map((e) => ({
        id: e.kod,
        vertical: e.wys > e.szer,
        polygon: [
          [e.x, e.y],
          [e.x + e.szer, e.y],
          [e.x + e.szer, e.y + e.wys],
          [e.x, e.y + e.wys],
        ],
      })),
    );
    const s = Math.min(300 / md.szerokoscMM, 230 / md.wysokoscMM),
      ox = m + 32,
      base = 330;
    const X = (x: number) => ox + x * s,
      Y = (y: number) => base - y * s;
    doc.font("B").fontSize(10).text("Przód bez frontów · światło półek", m, 80);
    for (const e of elements)
      doc
        .lineWidth(0.6)
        .strokeColor("#1c2b30")
        .rect(X(e.x), Y(e.y + e.wys), e.szer * s, Math.max(0.6, e.wys * s))
        .stroke();
    wymiarPoziomy(doc, X(0), X(md.szerokoscMM), base + 16, f(md.szerokoscMM));
    wymiarPionowy(doc, ox - 18, Y(md.wysokoscMM), base, f(md.wysokoscMM));
    for (const [i, o] of openings.entries()) {
      const x = X(o.probeX);
      doc
        .lineWidth(0.4)
        .strokeColor("#435058")
        .dash(2, { space: 2 })
        .moveTo(x, Y(o.y))
        .lineTo(x, Y(o.y + o.height))
        .stroke()
        .undash();
      doc
        .font("B")
        .fontSize(8)
        .fillColor("#1c2b30")
        .text(`${i + 1}: ${f(o.height)}`, x + 3, Y(o.y + o.height / 2) - 4, {
          width: 75,
          lineBreak: false,
        });
    }
    const sx = Math.min(250 / md.glebokoscMM, 230 / md.wysokoscMM),
      bx = 430,
      by = 330;
    doc.font("B").fontSize(10).text("Przekrój boczny w osi korpusu", bx, 80);
    for (const e of elements.filter(
      (e) => e.x <= md.szerokoscMM / 2 && e.x + e.szer >= md.szerokoscMM / 2,
    ))
      doc
        .lineWidth(0.6)
        .strokeColor("#1c2b30")
        .rect(
          bx + e.z * sx,
          by - (e.y + e.wys) * sx,
          e.gl * sx,
          Math.max(0.6, e.wys * sx),
        )
        .stroke();
    wymiarPoziomy(
      doc,
      bx,
      bx + md.glebokoscMM * sx,
      by + 16,
      f(md.glebokoscMM),
    );
    doc
      .font("R")
      .fontSize(8)
      .fillColor("#435058")
      .text(
        "Światło = wolny odstęp między powierzchniami płyt, bez grubości półek. Wymiary od podstawy korpusu. Tył przekroju z lewej. Skrzynki szuflad nie są pokazane.",
        m,
        360,
        { width: this.W - 2 * m },
      );
    const parts = this.d.czesci.filter((c) => c.modulId === md.id);
    const rows: string[][] = [];
    let selected = 0,
      total = 0;
    for (const c of parts) {
      const groups = new Map<string, Operacja[]>();
      for (const o of c.operacje) {
        total++;
        if (
          o.typ !== "otwor" ||
          !/zawias|prowadnic|zaczep|mocowan.*front|podpórk/i.test(
            o.przeznaczenie,
          )
        )
          continue;
        selected++;
        const key = JSON.stringify([
          o.powierzchnia,
          o.srednica,
          o.glebokosc,
          o.przelotowy,
          o.przeznaczenie,
          o.regula.status,
        ]);
        groups.set(key, [...(groups.get(key) ?? []), o]);
      }
      for (const all of groups.values())
        for (let offset = 0; offset < all.length; offset += 6) {
          const ops = all.slice(offset, offset + 6),
            o = ops[0];
          rows.push([
            `${c.etykieta} · ${c.kodElementu}`,
            o.przeznaczenie,
            `${o.powierzchnia}: ${ops.map((p) => `${f(p.x)} / ${f(p.y)}`).join("; ")}`,
            `${o.srednica == null ? "?" : f(o.srednica)} / ${o.przelotowy ? "przelot" : o.glebokosc == null ? "?" : f(o.glebokosc)}`,
            o.regula.status,
          ]);
        }
    }
    for(const q of this.d.prowadnice.filter(p=>p.modulId===md.id)) rows.push(["Boki korpusu",`${q.szuflada} · ${q.system}`,`Oś ${f(q.osOdDoluBokuMM)} od dołu boku; wkręty od przedniej krawędzi: ${q.otworyOdFrontuMM?.map(v=>f(v)).join(" / ")??"do ustalenia"}`,"? / ?","oś montażu; sprawdź profil"]);
    doc.font("B").fontSize(10).text("Najważniejsze wiercenia okuć", m, 390);
    doc
      .font("R")
      .fontSize(8)
      .text(
        `Wybrane ${selected} z ${total} operacji. Pozostałe i źródła: pełne karty techniczne. Lico A/B: x od KA, y od DA. Krawędź DA/DB: x od KA, y od lica B; KA/KB: x od DA, y od lica B. ? = brak danych. Status robocza wymaga zatwierdzenia.`,
        m,
        407,
        { width: this.W - 2 * m },
      );
    const tableY = doc.y + 8;
    this.tabela(
      "Najważniejsze wiercenia okuć",
      "",
      [
        { t: "Część", w: 110 },
        { t: "Przeznaczenie", w: 170 },
        { t: "Lico/krawędź: x / y [mm]", w: 300 },
        { t: "Ø / gł. [mm]", w: 95 },
        { t: "Status reguły", w: 110 },
      ],
      rows.length
        ? rows
        : [
            [
              "—",
              "Brak wyznaczonych wierceń okuć w tym zakresie.",
              "Sprawdź pełną dokumentację i dane systemu.",
              "—",
              "do sprawdzenia",
            ],
          ],
      undefined,
      tableY,
      8,
    );
  }

  // ---------- Strona tytułowa ----------

  stronaTytulowa() {
    const { doc, m } = this;
    const p = this.w.projekt;
    this.sekcja = "T";
    this.nowaStrona(
      "Dokumentacja produkcyjna",
      this.w.wydanie
        ? `Wydanie produkcyjne nr ${this.w.wydanie.numer} — zamrożona rewizja ${this.d.rewizja}; późniejsze zmiany projektu i katalogów nie zmieniają tego pakietu.`
        : `Wygenerowano z rewizji ${this.d.rewizja} projektu — wszystkie rysunki i zestawienia pochodzą z tej samej rewizji.`,
    );
    let y = m + 50;
    doc.font("B").fontSize(20).text(p.nazwa, m, y, { width: 380 });
    y = doc.y + 14;
    doc.font("R").fontSize(10);
    for (const [k, v] of [
      ["Klient", this.w.ukryjDaneKlienta ? "—" : p.klient.nazwa || "—"],
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
    this.legendaSchematu(m, y + 60, 380, ["T", "R", "E", "I", "S", "C"]);

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
      this.sekcja = "R";
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
    this.sekcja = "E";
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
    // Pakiet montażowy: wysokość spodu każdego mebla nad podłogą (zawieszenie szafek, nogi).
    if (this.w.rodzaj === "montaz") {
      for (const z of zb) {
        const md = z.modul;
        if (md.pozycjaYMM > 0) wymiarPionowy(doc, X(md.pozycjaXMM) + 8, Y(md.pozycjaYMM), Y(0), String(md.pozycjaYMM));
      }
    }
  }

  // ---------- Pakiet montażowy (sekcje M i K) ----------

  /** Etap montażu z kategorii mebla: najpierw dolne i słupki (poziom), potem blat, wiszące, na końcu fronty i wykończenie. */
  private etapMontazu(md: ZbudowanyModul["modul"]): { nr: number; nazwa: string } {
    if (md.kategoria === "wall" || md.pozycjaYMM >= 1000) return { nr: 3, nazwa: "3 · wiszące" };
    if (md.kategoria === "tall") return { nr: 1, nazwa: "1 · słupki" };
    return { nr: 1, nazwa: "1 · dolne" };
  }

  tytulMontazu() {
    const { doc, m } = this;
    const p = this.w.projekt;
    const mt = this.w.montaz ?? {};
    this.sekcja = "T";
    this.nowaStrona(
      "Pakiet montażowy",
      this.w.wydanie
        ? `Z wydania produkcyjnego nr ${this.w.wydanie.numer} (rew. ${this.d.rewizja}) — te same numery mebli i wymiary co w pakiecie produkcyjnym.`
        : `Z bieżącej rewizji ${this.d.rewizja} — do montażu drukuj z wydania produkcyjnego.`,
    );
    let y = m + 50;
    doc.font("B").fontSize(20).fillColor("#000").text(p.nazwa, m, y, { width: 420 });
    y = doc.y + 12;
    const wiersze: [string, string][] = [
      ["Termin montażu", mt.termin || "— (nie ustalono)"],
      ["Adres montażu", mt.adres || "— (brak w projekcie)"],
      ["Kontakt na miejscu", mt.kontakt || "—"],
      ["Ekipa montażowa", "1. ______________  2. ______________"],
      ["Mebli do zamontowania", String(this.w.zbudowane.length)],
      ["Ściany z meblami", String(new Set(this.w.zbudowane.map((z) => z.modul.scianaId)).size)],
      ["Składanie korpusów", mt.skladanie === "warsztat" ? "w warsztacie — wozimy złożone" : mt.skladanie === "naMiejscu" ? "na miejscu — formatki w paczkach" : "— nie ustalono (zapytaj właściciela)"],
    ];
    for (const [k, v] of wiersze) {
      doc.font("R").fontSize(10).fillColor("#555").text(k, m, y, { width: 160 });
      doc.font("B").fillColor("#000").text(v, m + 170, y, { width: 260 });
      y = Math.max(doc.y, y + 15) + 2;
    }
    doc.font("R").fontSize(7.5).fillColor("#8a5a00").text("Dane kontaktowe klienta służą tylko do realizacji montażu. Nie zostawiaj wydruku u osób trzecich; po odbiorze zwróć go do biura.", m, y + 4, { width: 420 });
    y = doc.y + 12;
    const gotowa = this.d.gotowaDoProdukcji;
    doc.rect(m, y, 420, 34).fillColor(gotowa ? "#e7f3ea" : "#fbe9e7").fill();
    doc.fillColor(gotowa ? KOLOR_STATUSU.gotowa : KOLOR_STATUSU.brakDanych).font("B").fontSize(11)
      .text(gotowa ? "Dokumentacja kompletna" : "Dokumentacja robocza — sprawdź braki przed wyjazdem", m + 10, y + 6, { width: 400 });
    doc.font("R").fontSize(7.5).text(gotowa ? "Wszystkie części mają zatwierdzone reguły." : `Części z brakiem danych: ${this.d.podsumowanie.brakDanych}, robocze: ${this.d.podsumowanie.robocza}. Szczegóły w pakiecie produkcyjnym (T-01).`, m + 10, y + 21, { width: 400 });
    doc.fillColor("#000");

    // Przed wyjazdem — lista kontrolna
    const x2 = 480;
    let y2 = m + 50;
    doc.font("B").fontSize(11).text("Przed wyjazdem", x2, y2);
    y2 += 16;
    for (const t of [
      mt.skladanie === "warsztat"
        ? "Korpusy złożone wg kart Z, podpisane (złożył / sprawdził), zabezpieczone do transportu"
        : mt.skladanie === "naMiejscu"
          ? `Formatki każdej szafki w osobnej paczce z numerem mebla; konfirmaty (${this.konfirmatyRazem()} szt.) i podpórki wg kart Z`
          : "Ustal z właścicielem: korpusy składamy w warsztacie czy na miejscu",
      "Fronty spakowane osobno, oznaczone numerem mebla",
      "Okucia z listy M (zawiasy, prowadnice, nogi, zawieszki) skompletowane",
      "Blaty, listwy, cokoły i panele wykończeniowe na liście załadunku",
      "Wkręty, kołki, silikon, poziomica, dalmierz, wkrętarka, piła",
      "Ten wydruk z aktualnego wydania (numer w prawym górnym rogu)",
    ]) {
      doc.lineWidth(0.6).rect(x2, y2 + 1, 7, 7).stroke();
      doc.font("R").fontSize(8.5).text(t, x2 + 12, y2, { width: this.W - m - x2 - 12 });
      y2 = doc.y + 4;
    }
    this.legendaSchematu(x2, y2 + 14, this.W - m - x2, ["T", "R", "E", "M", "Z", "K"]);
  }

  /** Spis sekcji schematu — ten sam na stronach tytułowych obu pakietów. */
  private legendaSchematu(x: number, y: number, w: number, kody: SekcjaDokumentu[]) {
    const { doc } = this;
    doc.font("B").fontSize(9).fillColor("#000").text("Schemat dokumentu", x, y);
    y += 13;
    for (const k of kody) {
      doc.font("M").fontSize(8).text(`${k}-nn`, x, y, { width: 36 });
      doc.font("R").fontSize(8).fillColor("#333").text(`${SCHEMAT_SEKCJI[k].nazwa} (${SCHEMAT_SEKCJI[k].dla})`, x + 38, y, { width: w - 38 });
      doc.fillColor("#000");
      y = doc.y + 2;
    }
  }

  kolejnoscMontazu() {
    const { doc, m } = this;
    const idx = new Map(this.w.zbudowane.map((z, i) => [z.modul.id, i + 1]));
    const sciany = this.w.projekt.pomieszczenia.flatMap((r) => r.sciany.map((s) => ({ s, pom: r.nazwa })));
    for (const { s: sc, pom } of sciany) {
      const zb = this.w.zbudowane
        .filter((z) => z.modul.scianaId === sc.id)
        .sort((a, b) => this.etapMontazu(a.modul).nr - this.etapMontazu(b.modul).nr || a.modul.pozycjaXMM - b.modul.pozycjaXMM);
      if (!zb.length) continue;
      this.sekcja = "M";
      const kol = [
        { t: "Lp.", w: 28 },
        { t: "Nr", w: 28 },
        { t: "Mebel", w: 170 },
        { t: "Etap", w: 70 },
        { t: "Od lewej", w: 60 },
        { t: "Spód nad podł.", w: 70 },
        { t: "Szer × wys × gł", w: 105 },
        { t: "Okucia i uwagi", w: 205 },
        { t: "Zrobione", w: 50 },
      ];
      const blat = zb.some((z) => z.elementy.some((e) => e.rola === "worktop"));
      const y = this.tabela(
        `Kolejność montażu — ${sc.nazwa}`,
        `${pom} · ściana ${sc.dlugoscMM} mm · wymiary od lewego końca ściany (patrz elewacja E). Jeśli narożnik jest po prawej, poziomuj od narożnika i idź w lewo.`,
        kol,
        zb.map((z, i) => [
          String(i + 1),
          String(idx.get(z.modul.id)),
          z.modul.nazwa,
          this.etapMontazu(z.modul).nazwa,
          String(z.modul.pozycjaXMM),
          String(z.modul.pozycjaYMM),
          `${z.modul.szerokoscMM} × ${z.modul.wysokoscMM} × ${z.modul.glebokoscMM}`,
          [...z.okucia.map((o) => `${o.typ} ×${o.ilosc}`), ...z.ostrzezenia.map((o) => `! ${o}`)].join("; ") || "—",
          "☐",
        ]),
        undefined,
        undefined,
        9,
      );
      let yy = y + 10;
      if (yy > this.H - 110) {
        this.nowaStrona(`Kolejność montażu — ${sc.nazwa} (cd.)`);
        yy = m + 50;
      }
      doc.font("B").fontSize(9).fillColor("#000").text("Etapy na tej ścianie", m, yy);
      yy += 13;
      for (const t of [
        "1 · Dolne i słupki: wypoziomuj nogi od najwyższego punktu podłogi, skręć korpusy ze sobą, sprawdź pion słupków.",
        blat ? "2 · Blat: przytnij i dopasuj do ścian, uszczelnij styki i wycięcia (zlew, płyta)." : "2 · Blat: brak blatu w tym projekcie na tej ścianie.",
        "3 · Wiszące: wyznacz linię spodu (kolumna „Spód nad podł.”), zamontuj listwę/zawieszki, wypoziomuj i skręć korpusy.",
        "4 · Fronty: zawieś, wyreguluj szczeliny (pion, poziom, głębokość), sprawdź domyk drzwi i szuflad.",
        "5 · Wykończenie: cokoły, listwy, panele, AGD, silikon; posprzątaj i przejdź protokół K.",
      ]) {
        doc.font("R").fontSize(8).text(t, m, yy, { width: this.W - 2 * m });
        yy = doc.y + 3;
      }
    }
  }

  /**
   * Karta złożenia szafki (Z): rysunek rozstrzelony korpusu z etykietami formatek i kroki złożenia
   * wyprowadzone z tej samej konstrukcji — połączenia i liczba konfirmatów, plecy, przekątna kontrolna,
   * podpórki, osie prowadnic, zawiasy, okucia. Bez cen. Czego nie ma w konstrukcji — pisze wprost.
   */
  zlozenie(zm: ZbudowanyModul) {
    const { doc, m } = this;
    const md = zm.modul;
    const nr = this.w.zbudowane.indexOf(zm) + 1;
    const czesci = this.d.czesci.filter((c) => c.modulId === md.id);
    const poKodzie = new Map(czesci.map((c) => [c.kodElementu, c]));
    const ety = (kod: string) => poKodzie.get(kod)?.etykieta ?? kod;
    this.sekcja = "Z";
    this.nowaStrona(
      `Złożenie szafki ${nr}: ${md.nazwa}`,
      `Korpus ${md.szerokoscMM} × ${md.wysokoscMM} × ${md.glebokoscMM} mm · ${this.w.montaz?.skladanie === "warsztat" ? "składać W WARSZTACIE przed wyjazdem" : this.w.montaz?.skladanie === "naMiejscu" ? "składać NA MIEJSCU u klienta" : "miejsce składania: nie ustalono"} · etykiety jak w pakiecie P · odhaczaj ☐`,
    );
    doc.page.margins.bottom = 0;
    const W = this.W;
    const H = this.H;
    const top = m + 44;
    const lewaW = 400;

    // --- Rysunek rozstrzelony (rzut ukośny: głębokość w górę w prawo) ---
    const KORPUS = new Set(["side", "top", "bottom", "shelf", "fixedShelf", "divider", "back", "reinforcement", "rail", "plinth"]);
    const el = zm.elementy.filter((e) => KORPUS.has(e.rola));
    const E = Math.max(70, Math.min(md.szerokoscMM, md.wysokoscMM) * 0.18); // odsunięcie rozstrzelenia [mm]
    const przes = (e: (typeof el)[number]) => {
      const lewy = e.x + e.szer / 2 < md.szerokoscMM / 2;
      switch (e.rola) {
        case "side": return { dx: lewy ? -E : E, dy: 0, dz: 0 };
        case "top": return { dx: 0, dy: E, dz: 0 };
        case "bottom": return { dx: 0, dy: -E * 0.7, dz: 0 };
        case "plinth": return { dx: 0, dy: -E * 1.4, dz: -E * 0.5 };
        case "back": return { dx: 0, dy: 0, dz: E * 1.6 };
        case "shelf": return { dx: 0, dy: 0, dz: -E * 1.2 };
        default: return { dx: 0, dy: 0, dz: -E * 0.5 };
      }
    };
    const kz = 0.45; // skrót głębokości
    const cs = Math.cos(Math.PI / 6) * kz;
    const sn = Math.sin(Math.PI / 6) * kz;
    const pts = el.flatMap((e) => {
      const o = przes(e);
      return [
        [e.x + o.dx, e.y + o.dy, e.z + o.dz],
        [e.x + e.szer + o.dx, e.y + e.wys + o.dy, e.z + e.gl + o.dz],
      ];
    });
    const rzX = (x: number, z: number) => x + z * cs;
    const rzY = (y: number, z: number) => y + z * sn;
    const minX = Math.min(...pts.map(([x, , z]) => rzX(x, Math.min(z, 0))), 0);
    const maxX = Math.max(...pts.map(([x, , z]) => rzX(x, z)), 1);
    const minY = Math.min(...pts.map(([, y, z]) => rzY(y, Math.min(z, 0))), 0);
    const maxY = Math.max(...pts.map(([, y, z]) => rzY(y, z)), 1);
    const obszarH = H - top - 150;
    const s = Math.min((lewaW - 20) / (maxX - minX), obszarH / (maxY - minY));
    const ox = m + 10 - minX * s;
    const oy = top + 14 + maxY * s;
    const P = (x: number, y: number, z: number): [number, number] => [ox + rzX(x, z) * s, oy - rzY(y, z) * s];
    doc.font("B").fontSize(7.5).fillColor("#000").text("Rysunek rozstrzelony korpusu (fronty, szuflady i blat — osobne kroki)", m, top);
    // Malarz: najpierw dalsze (większe z), niższe i bardziej z lewej.
    const kolej = [...el].sort((a, b) => {
      const g = (e: (typeof el)[number]) => { const o = przes(e); return (e.z + o.dz + e.gl / 2) - (e.y + o.dy + e.wys / 2) * 0.3 - (e.x + o.dx + e.szer / 2) * 0.3; };
      return g(b) - g(a);
    });
    const etykiety: { x: number; y: number; t: string }[] = [];
    for (const e of kolej) {
      const o = przes(e);
      const x0 = e.x + o.dx, y0 = e.y + o.dy, z0 = e.z + o.dz;
      const x1 = x0 + e.szer, y1 = y0 + e.wys, z1 = z0 + e.gl;
      const kolor = e.rola === "back" ? "#e9e4dc" : e.rola === "plinth" ? "#d9d9d9" : "#ffffff";
      const sciana = (q: [number, number][]) => {
        doc.moveTo(...q[0]);
        for (const p of q.slice(1)) doc.lineTo(...p);
        doc.closePath().lineWidth(0.5).fillColor(kolor).strokeColor("#000").fillAndStroke();
      };
      sciana([P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)]); // przód
      sciana([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)]); // góra
      sciana([P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)]); // prawy bok
      const [lx, ly] = P(x0 + e.szer / 2, y0 + e.wys / 2, z0 + (e.rola === "back" ? 0 : e.gl / 2));
      etykiety.push({ x: lx, y: ly, t: ety(e.kod) });
    }
    for (const l of etykiety) {
      doc.font("B").fontSize(6.5);
      const tw = doc.widthOfString(l.t) + 4;
      doc.rect(l.x - tw / 2, l.y - 5, tw, 10).fillColor("#fff").strokeColor("#c25400").lineWidth(0.5).fillAndStroke();
      doc.fillColor("#c25400").text(l.t, l.x - tw / 2 + 2, l.y - 3.5, { lineBreak: false });
    }
    doc.fillColor("#000");

    // Tabela formatek pod rysunkiem
    let yL = H - 132;
    doc.font("B").fontSize(7.5).text("Formatki tej szafki", m, yL);
    yL += 10;
    const listy = czesci.map((c) => `${c.etykieta} ${c.kodElementu} ${f(c.dlugoscMM)}×${f(c.szerokoscMM)}×${f(c.gruboscMM)}`);
    const kolF = 3;
    const kw = lewaW / kolF;
    const maxWierszy = Math.max(1, Math.floor((H - 36 - yL) / 9));
    const miesci = listy.length <= maxWierszy * kolF ? listy.length : (maxWierszy - 1) * kolF;
    doc.font("R").fontSize(6.5);
    listy.slice(0, miesci).forEach((t, i) => {
      let tt = t;
      while (doc.widthOfString(tt) > kw - 6 && tt.length > 4) tt = tt.slice(0, -2);
      doc.text(tt === t ? t : tt + "…", m + (i % kolF) * kw, yL + Math.floor(i / kolF) * 9, { lineBreak: false });
    });
    if (miesci < listy.length) doc.fillColor("#b3261e").text(`… i ${listy.length - miesci} kolejnych formatek — pełna lista na karcie S tej szafki w pakiecie P`, m, yL + (maxWierszy - 1) * 9, { lineBreak: false });
    doc.fillColor("#000");

    // --- Kroki złożenia (prawa kolumna) ---
    const xK = m + lewaW + 20;
    const wK = W - m - xK;
    let y = top;
    let nrK = 0;
    const krok = (_: number, tytul: string, linie: string[], brak = false) => {
      if (y > H - 62) return;
      nrK += 1;
      doc.lineWidth(0.6).strokeColor("#000").rect(xK, y + 1, 8, 8).stroke();
      doc.font("B").fontSize(8.5).fillColor(brak ? "#b3261e" : "#000").text(`${nrK}. ${tytul}`, xK + 13, y, { width: wK - 13 });
      y = doc.y + 1;
      for (const t of linie) {
        if (y > H - 54) break;
        doc.font("R").fontSize(7.5).fillColor(t.startsWith("!") ? "#b3261e" : "#222").text(t, xK + 13, y, { width: wK - 13 });
        y = doc.y + 1;
      }
      y += 5;
    };
    const ops = czesci.flatMap((c) => c.operacje);
    // 1. Przygotowanie
    const korpusowe = czesci.filter((c) => KORPUS.has(c.rola));
    krok(1, "Przygotuj formatki korpusu", [
      `${korpusowe.map((c) => c.etykieta).join(", ") || "—"} — sprawdź etykiety, wymiary i obrzeża z listy obok; lico A (od wnętrza) do środka.`,
    ]);
    // 2. Skręcenie korpusu: połączenia i konfirmaty
    const polaczenia = new Map<string, number>();
    for (const o of ops) if (o.przeznaczenie === "Konfirmat — przelot w licu") polaczenia.set(o.polaczenie ?? "?", (polaczenia.get(o.polaczenie ?? "?") ?? 0) + 1);
    const sumaK = [...polaczenia.values()].reduce((a, b) => a + b, 0);
    krok(2, `Skręć korpus — konfirmaty: ${sumaK}`, polaczenia.size
      ? [...[...polaczenia].map(([p, n]) => `${p}: ×${n}`), "Skręcaj na płaskim stole, bok leży licem B do dołu; dokręcaj bez przeciągania gwintu."]
      : ["! Brak operacji konfirmatów w konstrukcji — sposób łączenia do ustalenia z produkcją."], !polaczenia.size);
    // 3. Plecy
    const plecy = czesci.filter((c) => c.rola === "back");
    const rowek = ops.some((o) => o.typ === "rowek" && o.przeznaczenie.startsWith("Rowek pod plecy"));
    krok(3, "Plecy", plecy.length
      ? rowek
        ? [`${plecy.map((c) => c.etykieta).join(", ")} wsuń w rowek przed dokręceniem ostatniego wieńca.`]
        : [`${plecy.map((c) => c.etykieta).join(", ")} nakładane na korpus.`, "! Sposób i rozstaw mocowania pleców nie są zapisane w konstrukcji — wg zasad warsztatu."]
      : ["Szafka bez pleców w konstrukcji."]);
    // 4. Kontrola prostokątności
    const przek = Math.round(Math.hypot(md.szerokoscMM, md.wysokoscMM));
    krok(4, "Sprawdź prostokątność", [`Obie przekątne korpusu od frontu równe, nominalnie ${przek} mm (z wymiarów ${md.szerokoscMM} × ${md.wysokoscMM}); dopuszczalna różnica przekątnych ${TOLERANCJA_PRZEKATNYCH_MM} mm. Koryguj przed dobiciem pleców.`]);
    // 5. Półki
    const podporki = ops.filter((o) => o.przeznaczenie === "Podpórka półki").length;
    const polki = czesci.filter((c) => c.rola === "shelf");
    if (polki.length || podporki) krok(5, "Półki", [`${polki.map((c) => c.etykieta).join(", ") || "—"}: podpórek ${podporki} (po jednej w każdym otworze).`]);
    // 6. Prowadnice
    const pr = this.d.prowadnice.filter((q) => q.modulId === md.id);
    if (pr.length) krok(6, `Prowadnice szuflad — ${pr[0].system} NL ${pr[0].NL}`, [
      ...pr.map((q) => `${q.szuflada}${q.wewnetrzna ? " (wewn.)" : ""}: oś wkrętów ${f(q.osOdDoluBokuMM)} mm od dołu boku${q.otworyOdFrontuMM ? `, otwory od frontu ${q.otworyOdFrontuMM.join("/")}` : ", otwory wg szablonu producenta"}`),
    ]);
    else if (zm.okucia.some((o) => o.typ === "prowadnica" || o.typ === "systemSzuflad")) krok(6, "Prowadnice szuflad", [
      ...zm.okucia.filter((o) => o.typ === "prowadnica" || o.typ === "systemSzuflad").map((o) => `${o.typ} ×${o.ilosc} — ${o.opis}`),
      "! Wysokości montażu prowadnic nie są wyliczone (brak zatwierdzonego profilu systemu) — nie wierć na oko, zapytaj produkcję.",
    ], true);
    // 7. Zawiasy
    const prowadniki = ops.filter((o) => o.przeznaczenie === "Prowadnik zawiasu").length;
    const puszki = ops.filter((o) => o.przeznaczenie === "Puszka zawiasu").length;
    const drzwi = zm.elementy.filter((e) => e.rola === "front" && e.stronaZawiasow);
    if (puszki || prowadniki) krok(7, `Zawiasy — ${puszki} szt.`, [
      `Prowadniki na boku: otworów ${prowadniki}; puszki we frontach: ${puszki}.`,
      ...(drzwi.length ? [`Strona zawiasów: ${drzwi.map((e) => `${ety(e.kod)} ${e.stronaZawiasow}`).join(", ")}.`] : []),
    ]);
    // 8. Okucia i mocowanie
    const ok = zm.okucia.filter((o) => o.typ !== "zawias" && o.typ !== "prowadnica");
    krok(8, "Okucia, nogi, zawieszki", [
      ...(ok.length ? ok.map((o) => `${o.typ} ×${o.ilosc} — ${o.opis}`) : ["—"]),
      ...(md.kategoria === "wall" || md.pozycjaYMM >= 1000 ? ["! Zawieszki/listwa do ściany nie są w konstrukcji — dobierz do ściany i obciążenia."] : []),
    ]);
    // 9. Fronty i szuflady
    const fronty = czesci.filter((c) => c.rola === "front");
    const szuflady = czesci.filter((c) => c.rola.startsWith("drawer"));
    krok(9, "Fronty i szuflady (po ustawieniu na miejscu)", [
      `${fronty.length ? `Fronty: ${fronty.map((c) => c.etykieta).join(", ")}.` : "Bez frontów."}${szuflady.length ? ` Elementy szuflad: ${szuflady.length} szt.` : ""}`,
      "Wyreguluj szczeliny (pion, poziom, głębokość) i sprawdź domyk — wynik wpisz w protokole K.",
    ]);
    // Braki i ostrzeżenia
    const braki = [
      ...zm.ostrzezenia,
      ...new Set(this.d.diagnostyka.filter((dg) => dg.obiekty.some((id) => czesci.some((c) => c.id === id))).map((dg) => `[${dg.poziom}] ${dg.opis.replace(`${md.nazwa}: `, "")}`)),
    ];
    if (braki.length && y < H - 62) {
      doc.font("B").fontSize(7.5).fillColor("#b3261e").text("Uwagi z konstrukcji", xK, y);
      doc.font("R").fontSize(6.8).text(braki.join("\n"), xK, doc.y + 1, { width: wK, height: H - 48 - doc.y, ellipsis: true });
    }
    // Ekipa dwóch osób: jedna składa, druga sprawdza (przekątne, połączenia, etykiety).
    doc.font("R").fontSize(7.5).fillColor("#000").text("Złożył (inicjały): ________    Sprawdził (inicjały): ________", xK, H - 40, { lineBreak: false });
    doc.fillColor("#000");
  }


  /** Konfirmaty z operacji całego wydania (jeden przelot w licu = jeden konfirmat). */
  private konfirmatyRazem(): number {
    return this.d.czesci.reduce((a, c) => a + c.operacje.filter((o) => o.przeznaczenie === "Konfirmat — przelot w licu").length, 0);
  }

  okuciaMontazu() {
    const sumy = new Map<string, { typ: string; opis: string; ilosc: number; meble: Set<number> }>();
    this.w.zbudowane.forEach((z, i) => {
      for (const o of z.okucia) {
        const k = `${o.typ}|${o.profilID ?? ""}|${o.opis}`;
        const s = sumy.get(k) ?? { typ: o.typ, opis: o.opis + (o.profilID ? ` [${o.profilID}]` : ""), ilosc: 0, meble: new Set<number>() };
        s.ilosc += o.ilosc;
        s.meble.add(i + 1);
        sumy.set(k, s);
      }
    });
    this.sekcja = "M";
    const wiersze = [...sumy.values()].sort((a, b) => a.typ.localeCompare(b.typ, "pl")).map((s) => [s.typ, s.opis, String(s.ilosc), [...s.meble].join(", "), "☐"]);
    if (this.w.montaz?.skladanie === "naMiejscu") {
      // Składanie u klienta: łączniki korpusów jadą z ekipą — liczba z operacji, rozmiar wg technologii zakładu.
      const meble = this.w.zbudowane.map((z, i) => (this.d.czesci.some((c) => c.modulId === z.modul.id && c.operacje.some((o) => o.przeznaczenie === "Konfirmat — przelot w licu")) ? i + 1 : 0)).filter(Boolean);
      wiersze.unshift(["konfirmat", "łącznik korpusu (liczba z operacji kart Z; rozmiar wg technologii zakładu, + zapas)", String(this.konfirmatyRazem()), meble.join(", "), "☐"]);
    }
    this.tabela(
      "Okucia do zabrania na montaż",
      "Suma z wszystkich mebli tego wydania. Ilości z konstrukcji — nie obejmują zapasu ani elementów mocujących do ściany.",
      [{ t: "Typ", w: 90 }, { t: "Opis / profil", w: 420 }, { t: "Ilość", w: 50 }, { t: "Meble (nr)", w: 180 }, { t: "Spak.", w: 40 }],
      wiersze.length ? wiersze : [["—", "Brak okuć w konstrukcji", "", "", ""]],
      undefined,
      undefined,
      9,
    );
  }

  protokolOdbioru() {
    const { doc, m } = this;
    this.sekcja = "K";
    const kol = [
      { t: "Nr", w: 28 },
      { t: "Mebel", w: 200 },
      { t: "Poziom/pion", w: 70 },
      { t: "Szczeliny frontów", w: 80 },
      { t: "Domyk drzwi/szuflad", w: 90 },
      { t: "Blat/uszczelnienie", w: 85 },
      { t: "Cokół/listwy", w: 70 },
      { t: "Czysto, bez uszkodzeń", w: 90 },
    ];
    const y = this.tabela(
      "Protokół odbioru montażu",
      "Zaznacz ☑ gdy w porządku, ✗ gdy jest uwaga — każdą uwagę wpisz niżej jako osobną pozycję.",
      kol,
      this.w.zbudowane.map((z, i) => [String(i + 1), z.modul.nazwa, "☐", "☐", "☐", "☐", "☐", "☐"]),
      undefined,
      undefined,
      9,
    );
    let yy = y + 12;
    if (yy > this.H - 220) {
      this.nowaStrona("Protokół odbioru montażu — uwagi i podpisy");
      yy = m + 50;
    }
    doc.font("B").fontSize(9).fillColor("#000").text("Uwagi i usterki (jedna pozycja = jeden problem)", m, yy);
    yy += 13;
    const kolU = [28, 60, 380, 130, 100, 88];
    const nagl = ["Lp.", "Mebel nr", "Opis problemu i miejsce", "Kto usuwa", "Termin", "Zamknięte"];
    let x = m;
    doc.lineWidth(0.5).strokeColor("#000");
    nagl.forEach((t, i) => {
      doc.rect(x, yy, kolU[i], 14).stroke();
      doc.font("B").fontSize(7.5).text(t, x + 3, yy + 3, { width: kolU[i] - 6, lineBreak: false });
      x += kolU[i];
    });
    yy += 14;
    for (let r = 1; r <= 6; r++) {
      x = m;
      kolU.forEach((wd, i) => {
        doc.rect(x, yy, wd, 18).stroke();
        if (i === 0) doc.font("R").fontSize(7.5).text(String(r), x + 3, yy + 5);
        x += wd;
      });
      yy += 18;
    }
    yy += 14;
    doc.font("R").fontSize(8).text(`Wydanie: ${this.w.wydanie ? `nr ${this.w.wydanie.numer}, ` : ""}rew. ${this.d.rewizja}. Data odbioru: ____________`, m, yy);
    yy += 30;
    // Ekipa dwóch montażystów + klient (Mateusz, 1.11.2026).
    const pol = (this.W - 2 * m - 60) / 3;
    doc.lineWidth(0.5);
    ["Montażysta 1 (imię, podpis)", "Montażysta 2 (imię, podpis)", "Klient (podpis)"].forEach((t, i) => {
      const x0 = m + i * (pol + 30);
      doc.moveTo(x0, yy).lineTo(x0 + pol, yy).stroke();
      doc.font("R").fontSize(7.5).text(t, x0, yy + 3, { lineBreak: false });
    });
    doc.font("R").fontSize(7).fillColor("#555").text("Odbiór nie oznacza rezygnacji z roszczeń dotyczących wad i nie ogranicza ustawowych praw klienta.", m, yy + 18, { width: this.W - 2 * m });
    doc.fillColor("#000");
  }

  // ---------- Indeks ----------

  indeks() {
    this.sekcja = "I";
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

  private tabela(tytul: string, podtytul: string, kol: { t: string; w: number }[], wiersze: string[][], kolorOstatniej?: (i: number) => string, y0?: number, pt = 7) {
    const { doc, m } = this;
    let y = y0 ?? m + 50;
    if (y0 === undefined) this.nowaStrona(tytul, podtytul);
    const naglowek = () => {
      let x = m;
      doc.font("B").fontSize(pt).fillColor("#000");
      // Wysokość nagłówka z najdłuższego (zawiniętego) tytułu kolumny — bez nachodzenia na linię.
      const hN = Math.max(...kol.map((k) => doc.heightOfString(k.t, { width: k.w - 4 })));
      for (const k of kol) {
        doc.text(k.t, x + 2, y, { width: k.w - 4 });
        x += k.w;
      }
      y += hN + 4;
      doc.lineWidth(0.5).strokeColor("#000").moveTo(m, y - 2).lineTo(m + kol.reduce((a, k) => a + k.w, 0), y - 2).stroke();
    };
    naglowek();
    wiersze.forEach((w, i) => {
      const h = Math.max(...w.map((t, j) => doc.font("R").fontSize(pt).heightOfString(t, { width: kol[j].w - 4 }))) + 3;
      if (y + h > this.H - 34) {
        this.nowaStrona(`${tytul} (cd.)`);
        y = m + 50;
        naglowek();
      }
      let x = m;
      w.forEach((t, j) => {
        const ost = j === w.length - 1 && kolorOstatniej;
        doc.font(ost ? "B" : "R").fontSize(pt).fillColor(ost ? kolorOstatniej(i) : "#000").text(t, x + 2, y, { width: kol[j].w - 4 });
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
    this.sekcja = "S";
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
    this.sekcja = "S";
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
    // Osie prowadnic szuflad (raster 32) na przekroju: linia na długości NL i wysokość od dołu boku.
    const prowadnice = this.d.prowadnice.filter((q) => q.modulId === md.id);
    const bokY = zm.elementy.find((e) => e.kod === "BOK-L")?.y ?? 0;
    for (const q of prowadnice) {
      const yy = baseY - (bokY + q.osOdDoluBokuMM) * s;
      doc.lineWidth(0.9).strokeColor("#c25400").dash(4, { space: 1.5 }).moveTo(x1 + 30 * s, yy).lineTo(x1 + (30 + q.NL) * s, yy).stroke().undash();
      for (const z of q.otworyOdFrontuMM ?? []) doc.circle(x1 + (30 + z) * s, yy, 1.1).fillColor("#c25400").fill();
      doc.font("B").fontSize(5.8).fillColor("#c25400").text(`${q.szuflada} ${f(q.osOdDoluBokuMM)}`, x1 + (30 + md.glebokoscMM) * s + 3, yy - 3, { lineBreak: false });
    }
    doc.fillColor("#000");
    // Etykiety formatek na przekroju/widoku pomijamy — numeracja na kartach poniżej.

    // --- Siatka formatek ---
    const siatkaY = baseY + 24;
    const liniaProwadnic = this.d.prowadnice.some((q) => q.modulId === md.id) ? 11 : 0;
    const dolnyPas = 64 + liniaProwadnic;
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
    if (liniaProwadnic) {
      const pr = this.d.prowadnice.filter((q) => q.modulId === md.id);
      const osie = pr.map((q) => `${q.szuflada} ${f(q.osOdDoluBokuMM)}`).join(" · ");
      const otwory = pr[0].otworyOdFrontuMM ? `otwory od frontu ${pr[0].otworyOdFrontuMM.join("/")}` : "otwory wg szablonu";
      doc.font("B").fontSize(7).fillColor("#c25400").text("Prowadnice:", m, H - dolnyPas - 18);
      let tekst = `${osie} (oś od dołu boku, raster 32) · ${pr[0].system} NL ${pr[0].NL} · ${otwory}`;
      doc.font("R").fontSize(7);
      while (doc.widthOfString(tekst) > lewaW - 60 && tekst.length > 10) tekst = tekst.slice(0, -2);
      doc.text(tekst, m + 52, H - dolnyPas - 18, { lineBreak: false });
    }
    doc.font("B").fontSize(7).fillColor("#000").text("Okucia:", m, H - dolnyPas - 18 + liniaProwadnic);
    doc.font("R").fontSize(7).text(okucia || "—", m + 38, H - dolnyPas - 18 + liniaProwadnic, { width: lewaW - 38 });
    doc.font("R").fontSize(6.3).fillColor("#b3261e").text(braki.join("\n") || "", m, H - dolnyPas - 6 + liniaProwadnic, { width: lewaW, height: dolnyPas - 8 - liniaProwadnic, ellipsis: true });

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
    this.sekcja = "C";
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
    // Osie prowadnic szuflad na boku (raster 32): linia przez całą szerokość i wysokość od dołu boku.
    if (c.rola === "side") {
      const zm = this.w.zbudowane.find((z) => z.modul.id === c.modulId);
      const bok = zm?.elementy.find((e) => e.kod === c.kodElementu);
      for (const q of bok ? this.d.prowadnice.filter((p) => p.modulId === c.modulId) : []) {
        const lx = doLokalnego(c.uklad, [c.uklad.o[0], bok!.y + q.osOdDoluBokuMM, c.uklad.o[2]])[0];
        const [ax, ay] = P(lx, 0);
        const [, by] = P(lx, c.szerokoscMM);
        doc.lineWidth(0.7).strokeColor("#c25400").dash(4, { space: 1.5 }).moveTo(ax, ay).lineTo(ax, by).stroke().undash();
        doc.font("B").fontSize(6).fillColor("#c25400").text(`${q.szuflada} ${f(q.osOdDoluBokuMM)}`, ax + 2, by + 3, { lineBreak: false });
      }
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
          if (fragment && doc.widthOfString(fragment + znak) > szerUwagi - 8) { fragmenty.push(fragment); fragment = ""; }
          fragment += znak;
        }
        if (fragment) fragmenty.push(fragment);
        return fragmenty;
      })) {
        const kandydat = wiersz ? `${wiersz} ${slowo}` : slowo;
        if (wiersz && doc.widthOfString(kandydat) > szerUwagi - 8) { linie.push(wiersz); wiersz = slowo; }
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
