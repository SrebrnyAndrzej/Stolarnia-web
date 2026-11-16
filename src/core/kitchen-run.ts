import {
  kitchenModules,
  kitchenWalls,
  kitchenOuterBounds,
  type KitchenGeometryInput,
  type KitchenItem,
} from "./kitchen-configuration.js";

import { fillKitchenGap, kitchenFreeGaps } from "./kitchen-runs.js";
import { kitchenPlanningEnd } from "./kitchen-collisions.js";
import { kitchenWallStart } from "./kitchen-layout.js";

export type KitchenRow = "base" | "wall";
export function kitchenRunSpace(
  d: KitchenGeometryInput,
  wall: string,
  row: KitchenRow,
) {
  if (!kitchenWalls(d).includes(wall as "a" | "b" | "c"))
    throw new Error("Wybierz ścianę należącą do układu kuchni.");
  const modules = kitchenModules(d).filter(
    (m) =>
      m.scianaId === wall &&
      (m.kategoria === "wall" || m.konstrukcja === "hood") === (row === "wall"),
  );
  const end = Math.max(
    kitchenWallStart(d, wall),
    ...modules.map((m) => kitchenOuterBounds(m).end),
  );
  const length = kitchenPlanningEnd(d, wall as KitchenItem["wall"]);
  return { end, remaining: length - end, modules };
}

/** Legacy tail action delegates to the same gap filler as the run inspector. */
export function fillKitchenRun(
  d: KitchenGeometryInput,
  wall: KitchenItem["wall"],
  row: KitchenRow,
  id: () => string,
  purpose: "storage" | "preparation" = "storage",
): KitchenItem[] {
  const length = kitchenPlanningEnd(d, wall);
  const gap = kitchenFreeGaps(d, wall, row).find((g) => g.end === length);
  if (!gap)
    throw new Error(
      "Ten rząd jest już wypełniony lub zablokowany. Wybierz inną wolną lukę.",
    );
  return fillKitchenGap(d, wall, row, gap.id, id, purpose);
}
