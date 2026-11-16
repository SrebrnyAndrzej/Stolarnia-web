import type {
  KitchenGeometryInput,
  KitchenItem,
} from "./kitchen-configuration.js";
import type { Modul } from "./types.js";
import {
  punktNaRzucie,
  scianyNaRzucie,
  type ScianaNaRzucie,
} from "./geometry.js";
import { kitchenRoomWalls } from "./kitchen-island.js";

/** Design allowance for handles/assembly, not a hinge manufacturer's drilling rule. */
export const KITCHEN_CORNER_RESERVE = 650;
export const KITCHEN_OPENING_ALLOWANCE = 50;
export function kitchenPlanningEnd(
  d: Pick<KitchenGeometryInput, "layout" | "width" | "depth" | "returnLength">,
  wall: KitchenItem["wall"],
) {
  const length =
    wall === "a" ? d.width : wall === "b" ? d.depth : d.returnLength;
  const turns =
    (wall === "a" && d.layout !== "straight") ||
    (wall === "b" && d.layout === "u");
  return length - (turns ? KITCHEN_CORNER_RESERVE : 0);
}
interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
  low: number;
  high: number;
}
function box(
  w: ScianaNaRzucie,
  start: number,
  end: number,
  near: number,
  far: number,
  low: number,
  high: number,
): Box {
  const points = [
    punktNaRzucie(w, start, near),
    punktNaRzucie(w, end, near),
    punktNaRzucie(w, start, far),
    punktNaRzucie(w, end, far),
  ];
  return {
    left: Math.min(...points.map((p) => p[0])),
    right: Math.max(...points.map((p) => p[0])),
    top: Math.min(...points.map((p) => p[1])),
    bottom: Math.max(...points.map((p) => p[1])),
    low,
    high,
  };
}
const overlap = (a: Box, b: Box, padding = 0) =>
  a.left < b.right + padding - 0.01 &&
  a.right > b.left - padding + 0.01 &&
  a.top < b.bottom + padding - 0.01 &&
  a.bottom > b.top - padding + 0.01 &&
  a.low < b.high - 0.01 &&
  a.high > b.low + 0.01;
export interface KitchenCollision {
  kind: "body" | "opening";
  ids: [string, string];
  message: string;
}
/** Conservative 90° front/linear drawer envelope against the closed furniture on other walls. */
export function kitchenCollisions(
  d: KitchenGeometryInput,
  modules: Modul[],
): KitchenCollision[] {
  const walls = scianyNaRzucie({ sciany: kitchenRoomWalls(d) }),
    tf = d.quote?.front === "lacquer" ? 19 : 18;
  const shapes = modules.flatMap((m) => {
    const wall = walls.find((w) => w.sciana.id === m.scianaId);
    if (!wall) return [];
    const cfg = m.konfiguracja,
      s = cfg.obudowaZewnetrzna;
    let start = m.pozycjaXMM - (s?.lewy ? s.gruboscMM : 0),
      end = m.pozycjaXMM + m.szerokoscMM + (s?.prawy ? s.gruboscMM : 0);
    let near = -(cfg.plecyDekoracyjne?.gruboscMM ?? 0),
      far = m.glebokoscMM + tf;
    if (s) far = Math.max(far, m.glebokoscMM + tf + 2 + s.wysuniecieMM);
    if (cfg.blat) {
      const b = cfg.blatWymiar;
      near = Math.min(
        near,
        b
          ? m.glebokoscMM - b.zMM - b.glebokoscMM
          : m.glebokoscMM + tf + 2 - 600,
      );
      far = Math.max(far, b ? m.glebokoscMM - b.zMM : m.glebokoscMM + tf + 2);
      if (b) {
        start = Math.min(start, m.pozycjaXMM + b.xMM);
        end = Math.max(end, m.pozycjaXMM + b.xMM + b.szerokoscMM);
      }
    }
    const low =
        m.pozycjaYMM < 1000 && (s?.lewy || s?.prawy)
          ? 0
          : m.pozycjaYMM - (s?.dol ? s.gruboscMM : 0),
      high =
        m.pozycjaYMM +
        m.wysokoscMM +
        Math.max(
          cfg.blat ? (d.quote?.worktop === "compact" ? 12 : 38) : 0,
          s?.gora ? s.gruboscMM : 0,
        );
    const body = box(wall, start, end, near, far, low, high);
    const activeStart = m.pozycjaXMM,
      activeEnd =
        activeStart +
        (m.konstrukcja === "blindCorner"
          ? (cfg.szerokoscDrzwiNaroznikaMM ?? 450)
          : m.szerokoscMM);
    const doors = cfg.typFrontu !== "brak";
    // Refrigerator fronts divide vertically: each panel swings across the full cabinet width.
    const leaf =
      m.konstrukcja === "refrigerator" || m.konstrukcja === "blindCorner"
        ? activeEnd - activeStart
        : m.szerokoscMM / Math.max(1, cfg.liczbaDrzwi);
    const reach =
      cfg.typFrontu === "szuflady"
        ? Math.min(550, m.glebokoscMM)
        : m.konstrukcja === "dishwasherFront"
          ? m.wysokoscMM
          : leaf;
    const opening = doors
      ? box(
          wall,
          activeStart,
          activeEnd,
          m.glebokoscMM + tf,
          m.glebokoscMM + tf + reach,
          m.pozycjaYMM,
          m.pozycjaYMM + m.wysokoscMM,
        )
      : null;
    return [{ m, body, opening }];
  });
  const result: KitchenCollision[] = [];
  for (let i = 0; i < shapes.length; i++)
    for (let j = i + 1; j < shapes.length; j++) {
      const a = shapes[i],
        b = shapes[j];
      if (a.m.scianaId === b.m.scianaId) continue;
      const location = (m: Modul) =>
        m.scianaId === "island"
          ? "wyspa"
          : `ściana ${m.scianaId.toUpperCase()}`;
      if (overlap(a.body, b.body)) {
        result.push({
          kind: "body",
          ids: [a.m.id, b.m.id],
          message: `Kolizja zabudowy: ${a.m.nazwa} (${location(a.m)}) i ${b.m.nazwa} (${location(b.m)}). Gabaryty nakładają się w rzucie i wysokości; odsuń szafki od narożnika.`,
        });
        continue;
      }
      for (const [source, target] of [
        [a, b],
        [b, a],
      ])
        if (
          source.opening &&
          overlap(source.opening, target.body, KITCHEN_OPENING_ALLOWANCE)
        )
          result.push({
            kind: "opening",
            ids: [source.m.id, target.m.id],
            message: `Zablokowane otwieranie: ${source.m.nazwa} (${location(source.m)}) — front lub wysuw trafia na ${target.m.nazwa} (${location(target.m)}). Zostaw wolny narożnik, dodaj właściwą szafkę narożną albo przesuń słupek. Kontrola uwzględnia rezerwę ${KITCHEN_OPENING_ALLOWANCE} mm.`,
          });
    }
  return result;
}
