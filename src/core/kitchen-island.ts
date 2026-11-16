import type { KitchenGeometryInput } from "./kitchen-configuration.js";
import { KATALOG_MODULOW } from "./catalog/modules.js";
import type { Modul, Sciana } from "./types.js";
import { scianyNaRzucie, punktNaRzucie } from "./geometry.js";

export function islandSize(d: KitchenGeometryInput) {
  const i = d.island;
  if (!i) return null;
  const length =
    i.items.reduce(
      (s, item) =>
        s +
        (item.width ??
          KATALOG_MODULOW.find((m) => m.id === item.catalogId)!.widthMM),
      0,
    ) +
    2 * (d.quote?.front === "lacquer" ? 19 : 18);
  return {
    length,
    width: i.rotation === 0 ? length : i.depth,
    depth: i.rotation === 0 ? i.depth : length,
  };
}
export function islandWall(d: KitchenGeometryInput): Sciana[] {
  if (!d.island) return [];
  const i = d.island,
    size = islandSize(d)!,
    t = d.quote?.front === "lacquer" ? 19 : 18;
  const x = i.rotation === 0 ? i.x + t : i.x + 581;
  const y = i.rotation === 0 ? i.y + i.depth - 581 : i.y + t;
  return [
    {
      id: "island",
      nazwa: "Wyspa",
      wirtualna: true,
      dlugoscMM: size.length - 2 * t,
      wysokoscMM: d.height,
      x1: x,
      y1: y,
      x2: x + (i.rotation === 0 ? size.length - 2 * t : 0),
      y2: y + (i.rotation === 90 ? size.length - 2 * t : 0),
    },
  ];
}
export function kitchenRoomWalls(d: KitchenGeometryInput): Sciana[] {
  return [
    { id: "a", nazwa: "Ściana A", dlugoscMM: d.width, wysokoscMM: d.height },
    ...(d.layout !== "straight"
      ? [
          {
            id: "b",
            nazwa: "Ściana B",
            dlugoscMM: d.depth,
            wysokoscMM: d.height,
          },
        ]
      : []),
    ...(d.layout === "u"
      ? [
          {
            id: "c",
            nazwa: "Ściana C",
            dlugoscMM: d.returnLength,
            wysokoscMM: d.height,
          },
        ]
      : []),
    ...islandWall(d),
  ];
}
export function islandClearances(d: KitchenGeometryInput, modules: Modul[]) {
  if (!d.island) return [];
  const size = islandSize(d)!,
    i = d.island;
  const walls = scianyNaRzucie({
    sciany: kitchenRoomWalls({ ...d, island: undefined }),
  });
  return modules
    .filter((m) => m.scianaId !== "island" && m.pozycjaYMM < 1000)
    .flatMap((m) => {
      const w = walls.find((w) => w.sciana.id === m.scianaId);
      if (!w) return [];
      const points = [
        punktNaRzucie(w, m.pozycjaXMM, 0),
        punktNaRzucie(w, m.pozycjaXMM + m.szerokoscMM, 0),
        punktNaRzucie(w, m.pozycjaXMM, Math.max(600, m.glebokoscMM + 20)),
        punktNaRzucie(
          w,
          m.pozycjaXMM + m.szerokoscMM,
          Math.max(600, m.glebokoscMM + 20),
        ),
      ];
      const left = Math.min(...points.map((p) => p[0])),
        right = Math.max(...points.map((p) => p[0]));
      const top = Math.min(...points.map((p) => p[1])),
        bottom = Math.max(...points.map((p) => p[1]));
      const overlap =
        i.x < right &&
        i.x + size.width > left &&
        i.y < bottom &&
        i.y + size.depth > top;
      const dx = Math.max(left - (i.x + size.width), i.x - right, 0),
        dy = Math.max(top - (i.y + size.depth), i.y - bottom, 0);
      return [{ module: m, overlap, distance: Math.round(Math.hypot(dx, dy)) }];
    });
}
export function islandIssues(
  d: KitchenGeometryInput,
  modules: Modul[],
): string[] {
  if (!d.island) return [];
  const s = islandSize(d)!,
    i = d.island;
  const issues: string[] = [];
  if (i.x + s.width > d.width || i.y + s.depth > d.depth)
    issues.push(
      "Wyspa wychodzi poza obrys pomieszczenia. Zmień położenie, obrót lub wymiary.",
    );
  if (d.layout === "u" && d.returnLength !== d.width)
    issues.push(
      "Wyspa wymaga prostokątnego rzutu: wyrównaj długości ścian A i C.",
    );
  if (islandClearances(d, modules).some((c) => c.overlap))
    issues.push("Wyspa koliduje z zabudową przy ścianie. Przesuń wyspę.");
  return issues;
}
