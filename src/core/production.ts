import { opisMaterialu } from "./catalog/materials.js";
import type {
  Arkusz,
  Element,
  Formatka,
  KategoriaFormatki,
  KierunekDekoru,
  Material,
  PolozenieFormatki,
  RaportRozkroju,
  RodzajObrzeza,
  RolaElementu,
  UstawieniaOkleinowania,
  UstawieniaRozkroju,
  ZapotrzebowanieObrzeza,
  ZbudowanyModul,
} from "./types.js";

// ---------- Lista formatek (ListaFormatekProjektuBuilderV070) ----------

export interface MaterialyModulu {
  korpus: string;
  front: string;
  plecy: string;
  blat?: string;
}

const SKROTY: Record<RolaElementu, string> = {
  side: "BOK",
  top: "GORA",
  bottom: "DOL",
  shelf: "POLKA",
  divider: "DZIAL",
  back: "PLECY",
  front: "FRONT",
  worktop: "BLAT",
  plinth: "COKOL",
  filler: "BLENDA",
  reinforcement: "WZM",
  rail: "LISTWA",
  drawerSide: "SZ-BOK",
  drawerFrontBack: "SZ-CZT",
  drawerBottom: "SZ-DNO",
};

/** Wymiary formatki (długość × szerokość × grubość) wg roli — ListaFormatekProjektuBuilderV070.dimensions. */
function wymiary(e: Element): { dl: number; sz: number; gr: number } {
  switch (e.rola) {
    case "side":
    case "divider":
    case "drawerSide":
      return { dl: e.wys, sz: e.gl, gr: e.szer };
    case "top":
    case "bottom":
    case "shelf":
    case "worktop":
    case "reinforcement":
    case "rail":
    case "drawerBottom":
      return { dl: e.szer, sz: e.gl, gr: e.wys };
    case "back":
    case "front":
    case "plinth":
    case "filler":
    case "drawerFrontBack":
      return { dl: e.wys, sz: e.szer, gr: e.gl };
  }
}

function kategoria(rola: RolaElementu): KategoriaFormatki {
  switch (rola) {
    case "front":
    case "filler":
      return "front";
    case "back":
      return "plecy";
    case "worktop":
      return "blat";
    case "drawerSide":
    case "drawerFrontBack":
    case "drawerBottom":
      return "szuflady";
    case "plinth":
      return "pozostale";
    default:
      return "korpus";
  }
}

/** Reguła oklejania (OkleinowanieEngineV072.regula). Kolejność: długa A, długa B, krótka A, krótka B. */
export function regulaObrzeza(rola: RolaElementu): Formatka["obrzeza"] {
  switch (rola) {
    case "front":
    case "filler":
      return ["abs20", "abs20", "abs20", "abs20"];
    case "worktop":
      return ["abs20", "brak", "abs20", "abs20"];
    case "side":
    case "top":
    case "bottom":
    case "shelf":
    case "divider":
    case "reinforcement":
    case "rail":
      return ["abs08", "brak", "brak", "brak"];
    case "drawerSide":
    case "drawerFrontBack":
      return ["abs08", "brak", "brak", "brak"];
    case "plinth":
      return ["abs08", "brak", "abs08", "abs08"];
    default:
      return ["brak", "brak", "brak", "brak"];
  }
}

const GRUBOSC_OBRZEZA: Record<RodzajObrzeza, number> = { brak: 0, abs08: 0.8, abs20: 2 };

/**
 * Wymiar do cięcia. Kompensacja obrzeża wg profilu zakładu jest stosowana tylko tutaj (dokładnie raz):
 * długość − obrzeża KA+KB, szerokość − obrzeża DA+DB.
 */
export function wymiarCiecia(dl: number, sz: number, obrzeza: Formatka["obrzeza"], odejmuj: boolean): { dl: number; sz: number } {
  if (!odejmuj) return { dl, sz };
  const [da, db, ka, kb] = obrzeza.map((o) => GRUBOSC_OBRZEZA[o]);
  return { dl: r1(dl - ka - kb), sz: r1(sz - da - db) };
}

export function listaFormatek(
  zbudowane: { zm: ZbudowanyModul; materialy: MaterialyModulu }[],
  materialy: Map<string, Material>,
  opcje: { odejmujGruboscObrzeza?: boolean } = {},
): Formatka[] {
  const wynik: Formatka[] = [];
  zbudowane.forEach(({ zm, materialy: mm }, idx) => {
    const indeksModulu = idx + 1;
    zm.elementy.forEach((e, i) => {
      const { dl, sz, gr } = wymiary(e);
      if (!(dl > 0 && sz > 0 && gr > 0)) return;
      const materialId =
        e.materialRola === "front" ? mm.front
        : e.materialRola === "plecy" ? mm.plecy
        : e.materialRola === "blat" ? mm.blat ?? ""
        : mm.korpus; // korpus i skrzynki szuflad
      const mat = materialy.get(materialId);
      const kierunek: KierunekDekoru =
        e.rola === "back" || e.rola === "reinforcement" || e.rola === "rail" || e.rola === "drawerBottom" || !mat?.kierunekDekoru
          ? "dowolny"
          : "wzdluzDlugosci";
      const obrzeza = regulaObrzeza(e.rola);
      const ciecie = wymiarCiecia(dl, sz, obrzeza, !!opcje.odejmujGruboscObrzeza);
      wynik.push({
        id: `${zm.modul.id}|${e.kod}`,
        etykieta: `${pad(indeksModulu)}-${pad(i + 1)}-${SKROTY[e.rola]}`,
        indeksModulu,
        nazwaModulu: zm.modul.nazwa,
        modulId: zm.modul.id,
        kodElementu: e.kod,
        rola: e.rola,
        kategoria: kategoria(e.rola),
        materialId,
        materialOpis: opisMaterialu(mat),
        kolorHEX: mat?.kolorHEX ?? "#cccccc",
        dlugoscMM: dl,
        szerokoscMM: sz,
        // Skrzynki szuflad z płyty 16 mm; grubość z geometrii elementu.
        gruboscMM: gr,
        dlugoscCieciaMM: ciecie.dl,
        szerokoscCieciaMM: ciecie.sz,
        kierunekDekoru: kierunek,
        obrzeza,
      });
    });
  });
  return wynik;
}

// ---------- Okleinowanie (OkleinowanieEngineV072.raport) ----------

export function zapotrzebowanieObrzeza(formatki: Formatka[], u: UstawieniaOkleinowania): ZapotrzebowanieObrzeza[] {
  const grupy = new Map<string, ZapotrzebowanieObrzeza & { techMM: number }>();
  const rezerwa = 1 + u.zapasProcent / 100;
  for (const f of formatki) {
    f.obrzeza.forEach((rodzaj, i) => {
      if (rodzaj === "brak") return;
      const netto = i < 2 ? f.dlugoscMM : f.szerokoscMM;
      const klucz = `${rodzaj}|${f.materialId}`;
      const g = grupy.get(klucz) ?? {
        rodzaj,
        materialId: f.materialId,
        opis: `ABS ${rodzaj === "abs08" ? "0,8" : "2,0"} mm — ${f.materialOpis}`,
        liczbaKrawedzi: 0,
        dlugoscNettoM: 0,
        dlugoscZakupuM: 0,
        techMM: 0,
      };
      g.liczbaKrawedzi += 1;
      g.dlugoscNettoM += netto / 1000;
      g.techMM += netto + u.naddatekNaKrawedzMM;
      grupy.set(klucz, g);
    });
  }
  return [...grupy.values()]
    .map(({ techMM, ...g }) => ({
      ...g,
      dlugoscNettoM: r2(g.dlugoscNettoM),
      dlugoscZakupuM: r2((techMM / 1000) * rezerwa),
    }))
    .sort((a, b) => grubosc(a.rodzaj) - grubosc(b.rodzaj) || a.opis.localeCompare(b.opis, "pl"));
}

function grubosc(r: RodzajObrzeza): number {
  return r === "abs08" ? 0.8 : r === "abs20" ? 2 : 0;
}

// ---------- Rozkrój płyt (RozkrojPlytEngineV071 — algorytm półkowy, best-fit) ----------

interface Orientacja {
  szer: number;
  dl: number;
  obrocona: boolean;
}
interface Polka {
  y: number;
  wys: number;
  zajete: number;
  polozenia: PolozenieFormatki[];
}

export function rozkroj(formatki: Formatka[], u: UstawieniaRozkroju, materialy: Map<string, Material>): RaportRozkroju {
  // Blaty idą z osobnego materiału (mb) — nie rozkrawamy ich na arkuszach płyt.
  const doCiecia = formatki.filter((f) => f.kategoria !== "blat");
  const grupy = new Map<string, Formatka[]>();
  for (const f of doCiecia) {
    const k = `${f.materialId}|${f.gruboscMM}`;
    grupy.set(k, [...(grupy.get(k) ?? []), f]);
  }

  const arkusze: Arkusz[] = [];
  const nierozmieszczone: RaportRozkroju["nierozmieszczone"] = [];
  const podsumowanie: RaportRozkroju["podsumowanie"] = [];

  for (const [klucz, lista] of [...grupy.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const [materialId] = klucz.split("|");
    const mat = materialy.get(materialId);
    // Arkusz materiału z bazy, jeśli ma wymiary; w innym razie format z ustawień.
    const arkDl = mat && mat.szerokoscArkuszaMM > 0 ? Math.max(mat.szerokoscArkuszaMM, mat.wysokoscArkuszaMM) : u.dlugoscArkuszaMM;
    const arkSz = mat && mat.wysokoscArkuszaMM > 0 ? Math.min(mat.szerokoscArkuszaMM, mat.wysokoscArkuszaMM) : u.szerokoscArkuszaMM;
    const uzSz = arkSz - 2 * u.marginesArkuszaMM;
    const uzDl = arkDl - 2 * u.marginesArkuszaMM;
    const rzaz = u.rzazPilyMM;

    const posortowane = [...lista].sort((a, b) => {
      const la = Math.max(a.dlugoscCieciaMM, a.szerokoscCieciaMM);
      const lb = Math.max(b.dlugoscCieciaMM, b.szerokoscCieciaMM);
      if (la !== lb) return lb - la;
      const pa = a.dlugoscCieciaMM * a.szerokoscCieciaMM;
      const pb = b.dlugoscCieciaMM * b.szerokoscCieciaMM;
      return pb - pa || a.etykieta.localeCompare(b.etykieta);
    });

    const robocze: Polka[][] = [];
    for (const f of posortowane) {
      // Rozkrój na wymiarach półfabrykatu (po kompensacji obrzeża).
      const fdl = f.dlugoscCieciaMM;
      const fsz = f.szerokoscCieciaMM;
      const obrot = !u.uwzgledniajKierunekDekoru || f.kierunekDekoru === "dowolny";
      const orient: Orientacja[] = [{ szer: fsz, dl: fdl, obrocona: false }];
      if (obrot && Math.abs(fdl - fsz) > 0.001) orient.push({ szer: fdl, dl: fsz, obrocona: true });
      const pasujace = orient.filter((o) => o.szer <= uzSz && o.dl <= uzDl);
      if (!pasujace.length) {
        nierozmieszczone.push({ formatkaId: f.id, etykieta: f.etykieta, powod: `Formatka przekracza użyteczny format arkusza ${uzDl} × ${uzSz} mm.` });
        continue;
      }
      const polozenie = (o: Orientacja, x: number, y: number): PolozenieFormatki => ({
        formatkaId: f.id,
        etykieta: f.etykieta,
        xMM: x,
        yMM: y,
        szerokoscMM: o.szer,
        dlugoscMM: o.dl,
        obrocona: o.obrocona,
      });

      // 1) istniejąca półka — najmniejszy odpad
      let best: { a: number; p: number; o: Orientacja; score: number } | null = null;
      robocze.forEach((ark, ai) =>
        ark.forEach((pl, pi) => {
          for (const o of pasujace) {
            if (o.dl <= pl.wys && pl.zajete + o.szer <= uzSz) {
              const score = uzSz - pl.zajete - o.szer + (pl.wys - o.dl) * 0.25;
              if (!best || score < best.score) best = { a: ai, p: pi, o, score };
            }
          }
        }),
      );
      if (best) {
        const b = best as { a: number; p: number; o: Orientacja };
        const pl = robocze[b.a][b.p];
        pl.polozenia.push(polozenie(b.o, u.marginesArkuszaMM + pl.zajete, pl.y));
        pl.zajete += b.o.szer + rzaz;
        continue;
      }

      // 2) nowa półka na istniejącym arkuszu
      let bestNew: { a: number; o: Orientacja; score: number; y: number } | null = null;
      robocze.forEach((ark, ai) => {
        const ost = ark[ark.length - 1];
        const y = ost ? ost.y + ost.wys + rzaz : u.marginesArkuszaMM;
        const dostepne = u.marginesArkuszaMM + uzDl - y;
        for (const o of pasujace) {
          if (o.dl <= dostepne) {
            const score = dostepne - o.dl;
            if (!bestNew || score < bestNew.score) bestNew = { a: ai, o, score, y };
          }
        }
      });
      if (bestNew) {
        const b = bestNew as { a: number; o: Orientacja; y: number };
        robocze[b.a].push({ y: b.y, wys: b.o.dl, zajete: b.o.szer + rzaz, polozenia: [polozenie(b.o, u.marginesArkuszaMM, b.y)] });
        continue;
      }

      // 3) nowy arkusz — orientacja najlepiej wypełniająca szerokość
      const o = [...pasujace].sort((a, b) => uzSz - a.szer - (uzSz - b.szer) || b.dl - a.dl)[0];
      robocze.push([{ y: u.marginesArkuszaMM, wys: o.dl, zajete: o.szer + rzaz, polozenia: [polozenie(o, u.marginesArkuszaMM, u.marginesArkuszaMM)] }]);
    }

    const powArk = (arkDl * arkSz) / 1e6;
    let powForm = 0;
    for (const ark of robocze) {
      const polozenia = ark.flatMap((p) => p.polozenia);
      const pf = polozenia.reduce((s, p) => s + (p.szerokoscMM * p.dlugoscMM) / 1e6, 0);
      powForm += pf;
      arkusze.push({
        numer: arkusze.length + 1,
        materialId,
        materialOpis: opisMaterialu(mat),
        gruboscMM: lista[0].gruboscMM,
        kolorHEX: mat?.kolorHEX ?? "#cccccc",
        szerokoscMM: arkSz,
        dlugoscMM: arkDl,
        polozenia,
        wykorzystanieProcent: r2((pf / powArk) * 100),
      });
    }
    podsumowanie.push({
      materialId,
      materialOpis: opisMaterialu(mat),
      gruboscMM: lista[0].gruboscMM,
      liczbaArkuszy: robocze.length,
      powierzchniaFormatekM2: r2(powForm),
      powierzchniaArkuszyM2: r2(powArk * robocze.length),
      wykorzystanieProcent: robocze.length ? r2((powForm / (powArk * robocze.length)) * 100) : 0,
    });
  }

  return { arkusze, nierozmieszczone, podsumowanie };
}

// ---------- Eksport CSV (ListaFormatekCSVV070 / RozkrojPlytCSVV071) ----------

export function formatkiCSV(formatki: Formatka[]): string {
  const naglowek = ["ID części", "Etykieta", "Moduł", "Element", "Kategoria", "Materiał", "Długość gotowa [mm]", "Szerokość gotowa [mm]", "Długość cięcia [mm]", "Szerokość cięcia [mm]", "Grubość [mm]", "Ilość", "Kierunek dekoru", "Obrzeże DA", "Obrzeże DB", "Obrzeże KA", "Obrzeże KB"];
  const wiersze = formatki.map((f) => [
    f.id,
    f.etykieta,
    f.nazwaModulu,
    f.kodElementu,
    f.kategoria,
    f.materialOpis,
    liczba(f.dlugoscMM),
    liczba(f.szerokoscMM),
    liczba(f.dlugoscCieciaMM),
    liczba(f.szerokoscCieciaMM),
    liczba(f.gruboscMM),
    "1",
    f.kierunekDekoru === "dowolny" ? "dowolny" : "wzdłuż długości",
    ...f.obrzeza.map((o) => (o === "brak" ? "" : o === "abs08" ? "0,8" : "2,0")),
  ]);
  return [naglowek, ...wiersze].map((w) => w.map(csv).join(";")).join("\r\n");
}

function csv(v: string): string {
  return /[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function liczba(v: number): string {
  return String(Math.round(v * 10) / 10).replace(".", ",");
}

function r1(v: number): number {
  return Math.round(v * 10) / 10;
}

function r2(v: number): number {
  return Math.round(v * 100) / 100;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
