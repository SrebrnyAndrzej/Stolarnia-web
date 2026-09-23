// Import rzutu pomieszczenia z DXF: odcinki z LINE / LWPOLYLINE / POLYLINE na wybranej warstwie
// łączone w łańcuchy; najdłuższy łańcuch staje się obrysem ścian. Parsowanie DXF robi dxf-parser
// (w przeglądarce i w Node) — tu przyjmujemy już sparsowany obiekt, żeby kod był wspólny.

export interface DxfEncja {
  type: string;
  layer?: string;
  vertices?: { x: number; y: number }[];
  shape?: boolean;
  closed?: boolean;
}

export interface DxfDane {
  header?: Record<string, unknown>;
  entities: DxfEncja[];
}

export interface Odcinek {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  warstwa: string;
}

export interface WarstwaDxf {
  nazwa: string;
  odcinki: number;
  dlugoscM: number;
}

export type JednostkaDxf = "mm" | "cm" | "m";

const SKALA: Record<JednostkaDxf, number> = { mm: 1, cm: 10, m: 1000 };

/** Jednostka z nagłówka $INSUNITS (4 = mm, 5 = cm, 6 = m); brak → mm. */
export function jednostkaZNaglowka(d: DxfDane): JednostkaDxf {
  const u = Number(d.header?.$INSUNITS);
  return u === 5 ? "cm" : u === 6 ? "m" : "mm";
}

export function odcinkiDxf(d: DxfDane, jednostka: JednostkaDxf = jednostkaZNaglowka(d)): Odcinek[] {
  const k = SKALA[jednostka];
  const wynik: Odcinek[] = [];
  for (const e of d.entities ?? []) {
    const v = e.vertices;
    if (!v || v.length < 2) continue;
    if (!["LINE", "LWPOLYLINE", "POLYLINE"].includes(e.type)) continue;
    const punkty = e.type === "LINE" ? v.slice(0, 2) : v;
    const zamkniety = e.type !== "LINE" && (e.shape || e.closed);
    const n = zamkniety ? punkty.length : punkty.length - 1;
    for (let i = 0; i < n; i++) {
      const a = punkty[i];
      const b = punkty[(i + 1) % punkty.length];
      // Odbicie osi Y: DXF ma Y w górę, rzut w aplikacji Y w dół.
      wynik.push({ x1: a.x * k, y1: -a.y * k, x2: b.x * k, y2: -b.y * k, warstwa: e.layer ?? "0" });
    }
  }
  return wynik.filter((o) => Math.hypot(o.x2 - o.x1, o.y2 - o.y1) > 1);
}

export function warstwyDxf(odcinki: Odcinek[]): WarstwaDxf[] {
  const m = new Map<string, WarstwaDxf>();
  for (const o of odcinki) {
    const w = m.get(o.warstwa) ?? { nazwa: o.warstwa, odcinki: 0, dlugoscM: 0 };
    w.odcinki += 1;
    w.dlugoscM += Math.hypot(o.x2 - o.x1, o.y2 - o.y1) / 1000;
    m.set(o.warstwa, w);
  }
  return [...m.values()].sort((a, b) => b.dlugoscM - a.dlugoscM);
}

/**
 * Łączy odcinki w łańcuchy (końce w tolerancji) i zwraca najdłuższy jako listę ścian.
 * Odcinki krótsze niż minMM (np. ościeża, grubość ściany) są pomijane.
 */
export function scianyZDxf(odcinki: Odcinek[], opcje: { warstwa?: string; minMM?: number; tolMM?: number } = {}) {
  const tol = opcje.tolMM ?? 10;
  const min = opcje.minMM ?? 300;
  const pula = odcinki.filter((o) => (!opcje.warstwa || o.warstwa === opcje.warstwa) && Math.hypot(o.x2 - o.x1, o.y2 - o.y1) >= min);
  const blisko = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by) <= tol;

  const wolne = [...pula];
  const lancuchy: Odcinek[][] = [];
  while (wolne.length) {
    const lan = [wolne.shift()!];
    let zmiana = true;
    while (zmiana) {
      zmiana = false;
      const pierwszy = lan[0];
      const ostatni = lan[lan.length - 1];
      for (let i = 0; i < wolne.length; i++) {
        const o = wolne[i];
        if (blisko(o.x1, o.y1, ostatni.x2, ostatni.y2)) lan.push(o);
        else if (blisko(o.x2, o.y2, ostatni.x2, ostatni.y2)) lan.push(odwroc(o));
        else if (blisko(o.x2, o.y2, pierwszy.x1, pierwszy.y1)) lan.unshift(o);
        else if (blisko(o.x1, o.y1, pierwszy.x1, pierwszy.y1)) lan.unshift(odwroc(o));
        else continue;
        wolne.splice(i, 1);
        zmiana = true;
        break;
      }
    }
    lancuchy.push(scalWspolliniowe(lan));
  }

  const dlugosc = (l: Odcinek[]) => l.reduce((s, o) => s + Math.hypot(o.x2 - o.x1, o.y2 - o.y1), 0);
  lancuchy.sort((a, b) => dlugosc(b) - dlugosc(a));
  const najlepszy = lancuchy[0] ?? [];
  return {
    sciany: najlepszy.map((o, i) => ({
      nazwa: `Ściana ${String.fromCharCode(65 + (i % 26))}`,
      dlugoscMM: Math.round(Math.hypot(o.x2 - o.x1, o.y2 - o.y1)),
      x1: r(o.x1),
      y1: r(o.y1),
      x2: r(o.x2),
      y2: r(o.y2),
    })),
    liczbaLancuchow: lancuchy.length,
    pominieteOdcinki: odcinki.length - najlepszy.length,
  };
}

function odwroc(o: Odcinek): Odcinek {
  return { ...o, x1: o.x2, y1: o.y2, x2: o.x1, y2: o.y1 };
}

/** Łączy kolejne odcinki leżące na jednej prostej (np. ściana narysowana z kilku linii). */
function scalWspolliniowe(l: Odcinek[]): Odcinek[] {
  const w: Odcinek[] = [];
  for (const o of l) {
    const p = w[w.length - 1];
    if (p) {
      const k1 = Math.atan2(p.y2 - p.y1, p.x2 - p.x1);
      const k2 = Math.atan2(o.y2 - o.y1, o.x2 - o.x1);
      if (Math.abs(Math.atan2(Math.sin(k1 - k2), Math.cos(k1 - k2))) < 0.01) {
        p.x2 = o.x2;
        p.y2 = o.y2;
        continue;
      }
    }
    w.push({ ...o });
  }
  return w;
}

function r(v: number): number {
  return Math.round(v * 10) / 10;
}
