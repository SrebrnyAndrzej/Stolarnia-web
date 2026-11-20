import type { KitchenGeometryInput } from "./kitchen-configuration.js";
import type { ZbudowanyModul } from "./types.js";
import { kitchenRoomWalls } from "./kitchen-island.js";
import { punktNaRzucie, scianyNaRzucie } from "./geometry.js";

export interface KitchenPassage {
  distanceMM: number;
  x: number;
  y1: number;
  y2: number;
  moduleIds: [string, string];
}
/** Narrowest shared-X projection of the actual closed, floor-standing furniture.
 * Worktops, fronts and projecting decorative plates come from the builder.
 * An island splits this space: use its own clearance workflow instead.
 */
export function kitchenParallelPassage(
  d: KitchenGeometryInput,
  built: Pick<ZbudowanyModul, "modul" | "elementy">[],
): KitchenPassage | null {
  if (d.layout !== "parallel" || d.island) return null;
  const walls = scianyNaRzucie({ sciany: kitchenRoomWalls(d) });
  const boxes = built.flatMap(({ modul: m, elementy }) => {
    const wall = walls.find((w) => w.sciana.id === m.scianaId);
    if (!wall || m.pozycjaYMM >= 1000 || m.kategoria === "wall") return [];
    return elementy
      .filter((e) => e.szer > 0 && e.gl > 0)
      .map((e) => {
        const start = m.pozycjaXMM + e.x,
          end = start + e.szer;
        const near = m.glebokoscMM - e.z - e.gl,
          far = m.glebokoscMM - e.z;
        const points = [
          punktNaRzucie(wall, start, near),
          punktNaRzucie(wall, end, near),
          punktNaRzucie(wall, start, far),
          punktNaRzucie(wall, end, far),
        ];
        return {
          wall: m.scianaId,
          id: m.id,
          left: Math.min(...points.map((p) => p[0])),
          right: Math.max(...points.map((p) => p[0])),
          top: Math.min(...points.map((p) => p[1])),
          bottom: Math.max(...points.map((p) => p[1])),
        };
      });
  });
  let result: KitchenPassage | null = null,
    bestSpan = 0;
  for (const a of boxes.filter((b) => b.wall === "a"))
    for (const c of boxes.filter((b) => b.wall === "c")) {
      const left = Math.max(a.left, c.left),
        right = Math.min(a.right, c.right);
      if (right - left < 0.1) continue;
      const distance = c.top - a.bottom;
      if (
        !result ||
        distance < result.distanceMM - 0.01 ||
        (Math.abs(distance - result.distanceMM) < 0.01 &&
          right - left > bestSpan)
      ) {
        result = {
          distanceMM: distance,
          x: (left + right) / 2,
          y1: a.bottom,
          y2: c.top,
          moduleIds: [a.id, c.id],
        };
        bestSpan = right - left;
      }
    }
  return result
    ? { ...result, distanceMM: Math.round(result.distanceMM) }
    : null;
}
