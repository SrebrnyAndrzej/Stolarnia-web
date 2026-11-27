import {
  kitchenModules,
  kitchenOuterBounds,
  type KitchenGeometryInput,
  type KitchenItem,
} from "./kitchen-configuration.js";
import { openingOverlaps } from "./kitchen-room.js";
import { kitchenWallStart } from "./kitchen-layout.js";

/** Cut only newly proposed storage around measured openings; never move existing furniture or appliances. */
export function trimKitchenStorage(
  d: KitchenGeometryInput,
  items: KitchenItem[],
  protectedIds: Set<string>,
) {
  if (!d.features?.length) return items;
  const rows: { item: KitchenItem; x: number; upper: boolean }[] = [];
  let serial = 800;
  const used = new Set(items.map((i) => i.id));
  const temporaryId = () => {
    let next: string;
    do {
      next = `00000000-0000-4000-8000-${String(++serial).padStart(12, "0")}`;
    } while (used.has(next));
    used.add(next);
    return next;
  };
  for (const m of kitchenModules({ ...d, items })) {
    if (m.scianaId === "island") continue;
    const original = items.find((i) => i.id === m.id)!;
    let intervals = [
      { start: m.pozycjaXMM, end: m.pozycjaXMM + m.szerokoscMM },
    ];
    if (
      !protectedIds.has(m.id) &&
      ["shelves", "drawers", "filler"].includes(m.konstrukcja)
    ) {
      for (const f of d.features)
        if (openingOverlaps(m, f, d.quote?.worktop === "compact" ? 12 : 38))
          intervals = intervals.flatMap((s) =>
            [
              { start: s.start, end: Math.min(s.end, f.x) },
              { start: Math.max(s.start, f.x + f.width), end: s.end },
            ].filter((p) => p.end - p.start >= 20),
          );
    }
    for (const interval of intervals) {
      const width = interval.end - interval.start;
      const unchanged =
        interval.start === m.pozycjaXMM && width === m.szerokoscMM;
      const filler = width < 200;
      rows.push({
        x: interval.start,
        upper: m.pozycjaYMM >= 1000,
        item: unchanged
          ? original
          : {
              ...original,
              id: temporaryId(),
              width,
              catalogId: filler
                ? `${m.pozycjaYMM >= 1000 ? "wall" : "base"}-filler-50`
                : original.catalogId,
              ...(filler
                ? {
                    shelves: undefined,
                    drawers: undefined,
                    drawerFronts: undefined,
                    innerDrawers: undefined,
                    appliance: undefined,
                  }
                : {}),
            },
      });
    }
  }
  const result = items.filter((i) => protectedIds.has(i.id));
  for (const wall of ["a", "b", "c"] as const)
    for (const upper of [false, true]) {
      let end = Math.max(
        kitchenWallStart(d, wall),
        ...kitchenModules({ ...d, items: result })
          .filter((m) => m.scianaId === wall && m.pozycjaYMM >= 1000 === upper)
          .map((m) => kitchenOuterBounds(m).end),
      );
      for (const r of rows
        .filter(
          (r) =>
            r.item.wall === wall &&
            r.upper === upper &&
            !protectedIds.has(r.item.id),
        )
        .sort((a, b) => a.x - b.x)) {
        result.push({ ...r.item, gapBefore: r.x - end });
        end = r.x + (r.item.width ?? 0);
      }
    }
  return result;
}
