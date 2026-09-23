import type { Modul, Pomieszczenie, Sciana } from "./types.js";

// Geometria rzutu: ściany jako odcinki lica, moduły ustawione tyłem do lica ściany.
// Współrzędne rzutu w mm, X w prawo, Y w dół (jak na ekranie).

export interface ScianaNaRzucie {
  sciana: Sciana;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Wektor jednostkowy wzdłuż ściany (od początku do końca). */
  dx: number;
  dy: number;
  /** Normalna jednostkowa skierowana do wnętrza pomieszczenia. */
  nx: number;
  ny: number;
}

/** Ściany pomieszczenia z uzupełnionymi współrzędnymi i normalną do wnętrza. */
export function scianyNaRzucie(p: Pick<Pomieszczenie, "sciany">): ScianaNaRzucie[] {
  // 1) Współrzędne — jawne z importu CAD albo łańcuch z obrotem o 90° zgodnie z ruchem wskazówek zegara.
  let kx = 0;
  let ky = 0;
  let kdx = 1;
  let kdy = 0;
  const odcinki = p.sciany.map((s) => {
    if (s.x1 !== undefined && s.y1 !== undefined && s.x2 !== undefined && s.y2 !== undefined) {
      const dl = Math.hypot(s.x2 - s.x1, s.y2 - s.y1) || 1;
      kx = s.x2;
      ky = s.y2;
      kdx = (s.x2 - s.x1) / dl;
      kdy = (s.y2 - s.y1) / dl;
      [kdx, kdy] = [-kdy, kdx];
      return { s, x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 };
    }
    const o = { s, x1: kx, y1: ky, x2: kx + kdx * s.dlugoscMM, y2: ky + kdy * s.dlugoscMM };
    kx = o.x2;
    ky = o.y2;
    [kdx, kdy] = [-kdy, kdx]; // obrót o 90° w prawo (Y w dół)
    return o;
  });

  // 2) Strona wnętrza z orientacji wielokąta (pole ze wzoru Gaussa, łańcuch domknięty umownie).
  let pole = 0;
  for (const o of odcinki) pole += o.x1 * o.y2 - o.x2 * o.y1;
  if (odcinki.length) pole += odcinki[odcinki.length - 1].x2 * odcinki[0].y1 - odcinki[0].x1 * odcinki[odcinki.length - 1].y2;
  const zgodnie = pole >= 0; // w układzie Y-w-dół dodatnie pole = zgodnie z ruchem wskazówek zegara

  return odcinki.map(({ s, x1, y1, x2, y2 }) => {
    const dl = Math.hypot(x2 - x1, y2 - y1) || 1;
    const dx = (x2 - x1) / dl;
    const dy = (y2 - y1) / dl;
    return { sciana: s, x1, y1, x2, y2, dx, dy, nx: zgodnie ? -dy : dy, ny: zgodnie ? dx : -dx };
  });
}

/** Punkt rzutu dla współrzędnych lokalnych modułu: wzdłuż ściany i odsunięcie od lica. */
export function punktNaRzucie(w: ScianaNaRzucie, wzdluz: number, odLica: number): [number, number] {
  return [w.x1 + w.dx * wzdluz + w.nx * odLica, w.y1 + w.dy * wzdluz + w.ny * odLica];
}

/** Obrys modułu na rzucie (4 narożniki), tył przy licu ściany. */
export function obrysModulu(w: ScianaNaRzucie, m: Modul): [number, number][] {
  const a = m.pozycjaXMM;
  const b = m.pozycjaXMM + m.szerokoscMM;
  const d = m.glebokoscMM;
  return [punktNaRzucie(w, a, 0), punktNaRzucie(w, b, 0), punktNaRzucie(w, b, d), punktNaRzucie(w, a, d)];
}

/** Prostokąt ograniczający rzut (z marginesem). */
export function granice(sciany: ScianaNaRzucie[], margines = 400): { x: number; y: number; w: number; h: number } {
  if (!sciany.length) return { x: -margines, y: -margines, w: 2 * margines, h: 2 * margines };
  const xs = sciany.flatMap((s) => [s.x1, s.x2]);
  const ys = sciany.flatMap((s) => [s.y1, s.y2]);
  const x = Math.min(...xs) - margines;
  const y = Math.min(...ys) - margines;
  return { x, y, w: Math.max(...xs) - x + margines, h: Math.max(...ys) - y + margines };
}
