import {
  kitchenIssues,
  kitchenModules,
  kitchenOuterBounds,
  isKitchenUpper,
  customerKitchenCatalog,
  type KitchenInput,
} from "./kitchen-configuration.js";
import { kitchenCollisions } from "./kitchen-collisions.js";
import { kitchenLockProblem } from "./kitchen-locks.js";
import { kitchenWallStart } from "./kitchen-layout.js";

/** Conservative, preview-only repairs. A suggestion must reduce issues without creating any new issue. */
export function kitchenRepairOptions<T extends KitchenInput>(source: T) {
  const before = kitchenIssues(source),
    modules = kitchenModules(source);
  if (!before.length) return [];
  const colliding = new Set(
    kitchenCollisions(source, modules).flatMap((c) => c.ids),
  );
  const options: {
    id: string;
    title: string;
    description: string;
    draft: T;
    fixed: number;
  }[] = [];
  for (const item of source.items) {
    if (item.locked || !colliding.has(item.id)) continue;
    const m = modules.find((m) => m.id === item.id)!;
    const entry = customerKitchenCatalog.find((e) => e.id === item.catalogId)!;
    const peers = modules.filter(
      (n) =>
        n.scianaId === m.scianaId &&
        isKitchenUpper({
          category: n.kategoria,
          construction: n.konstrukcja,
        }) === isKitchenUpper(entry),
    );
    if (peers.some((n) => n.pozycjaXMM > m.pozycjaXMM)) continue;
    const prior = Math.max(
      kitchenWallStart(source, item.wall),
      ...peers
        .filter((n) => n.id !== m.id)
        .map((n) => kitchenOuterBounds(n).end),
    );
    for (const gap of [50, 100, 150, 200, 300, 450, 600, 650]) {
      const target = prior + (item.gapBefore ?? 0) + gap;
      const draft = {
        ...source,
        items: source.items.map((i) =>
          i.id === item.id ? { ...i, gapBefore: (i.gapBefore ?? 0) + gap } : i,
        ),
      };
      const after = kitchenIssues(draft);
      if (
        after.length >= before.length ||
        after.some((p) => !before.includes(p)) ||
        kitchenLockProblem(source, draft)
      )
        continue;
      options.push({
        id: item.id,
        title: `Odsuń ${m.nazwa} o ${gap / 10} cm`,
        description: `Ściana ${item.wall.toUpperCase()}: początek korpusu z ${m.pozycjaXMM / 10} do ${(target + (item.surround?.left ? (source.quote.front === "lacquer" ? 19 : 18) : 0)) / 10} cm. Pozostałe szafki zostają na miejscu.`,
        draft: draft as T,
        fixed: before.length - after.length,
      });
      break;
    }
  }
  return options.slice(0, 3);
}
