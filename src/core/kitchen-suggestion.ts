import {
  kitchenIssues,
  kitchenItemSchema,
  kitchenPlanningSchema,
  kitchenWalls,
  kitchenModules,
  kitchenOuterBounds,
  type KitchenInput,
  type KitchenItem,
} from "./kitchen-configuration.js";
import { kitchenFunctionalReview } from "./kitchen-functions.js";
import { trimKitchenStorage } from "./kitchen-room-layout.js";
import { kitchenPlanningEnd } from "./kitchen-collisions.js";
import { kitchenWallStart } from "./kitchen-layout.js";
import { adaptKitchenStorage } from "./kitchen-needs.js";

type Wall = KitchenItem["wall"];
type Slot = { catalogId: string; width: number; gapBefore?: number };
const permutations = <T>(values: T[]): T[][] =>
  values.length < 2
    ? [values]
    : values.flatMap((v, i) =>
        permutations(values.filter((_, j) => i !== j)).map((rest) => [
          v,
          ...rest,
        ]),
      );
const storage = (width: number): Slot[] => {
  if (!width) return [];
  if (width < 20) throw new Error("Za mało miejsca na blendę.");
  if (width < 200) return [{ catalogId: "base-filler-50", width }];
  const count = Math.ceil(width / 1200);
  return Array.from({ length: count }, (_, i) => ({
    catalogId: "base-shelves-600",
    width:
      Math.round((width * (i + 1)) / count) - Math.round((width * i) / count),
  }));
};

/** Deterministic functional groups; these planning allowances are not installation clearances. */
function findKitchenSuggestion(
  d: Omit<KitchenInput, "quote">,
  id: () => string,
  preserve = false,
  preparationWidth = 600,
): KitchenItem[] {
  const waterPoint = d.features?.find((f) => f.kind === "water");
  const p = kitchenPlanningSchema.parse({
      ...d.planning,
      ...(waterPoint
        ? { waterWall: waterPoint.wall, sinkCenter: waterPoint.x }
        : {}),
    }),
    walls = kitchenWalls(d);
  const existing = preserve ? kitchenModules(d) : [];
  const existingItems = preserve ? d.items : [];
  if (preserve && kitchenIssues(d).length) throw new Error(kitchenIssues(d)[0]);
  for (const construction of [
    "sink",
    "dishwasherFront",
    "oven",
    "hood",
    "refrigerator",
  ]) {
    if (existing.filter((m) => m.konstrukcja === construction).length > 1)
      throw new Error(
        "Najpierw uporządkuj powtarzające się strefy AGD i hydrauliki. Automatyczne uzupełnianie zachowuje istniejące elementy.",
      );
  }
  const oldSink = existing.find((m) => m.konstrukcja === "sink");
  const has = (construction: string) =>
    existing.some((m) => m.konstrukcja === construction);
  const endAt = (wall: Wall, upper: boolean) =>
    Math.max(
      kitchenWallStart(d, wall),
      ...existing
        .filter(
          (m) =>
            m.scianaId === wall &&
            (m.kategoria === "wall" || m.konstrukcja === "hood") === upper,
        )
        .map((m) => kitchenOuterBounds(m).end),
    );
  if (
    oldSink &&
    ((p.waterWall !== "auto" && p.waterWall !== oldSink.scianaId) ||
      (p.sinkCenter !== undefined &&
        (p.waterWall === "auto" ? "a" : p.waterWall) !== oldSink.scianaId) ||
      (p.sinkCenter !== undefined &&
        p.sinkCenter !== oldSink.pozycjaXMM + oldSink.szerokoscMM / 2))
  )
    throw new Error(
      "Istniejący zlew nie odpowiada założeniom hydrauliki. Popraw jego położenie albo użyj Zastąp proponowanym układem.",
    );
  if (p.waterWall !== "auto" && !walls.includes(p.waterWall))
    throw new Error("Wybierz ścianę zlewu należącą do układu kuchni.");
  const preferred: Wall[] =
    d.layout === "parallel"
      ? ["a", "c", "a"]
      : d.layout === "u"
        ? ["a", "b", "c"]
        : d.layout === "l"
          ? ["a", "a", "b"]
          : ["a", "a", "a"];
  const combinations = walls.flatMap((fridge) =>
    walls.flatMap((wet) => walls.map((cook) => ({ fridge, wet, cook }))),
  );
  combinations.sort((a, b) => {
    const powerWall = d.features?.find((f) => f.kind === "power")?.wall;
    const score = (v: typeof a) =>
      Number(v.fridge !== preferred[0]) * 2 +
      Number(v.wet !== preferred[1]) * 3 +
      Number(v.cook !== preferred[2]) * 2 +
      (powerWall ? Number(v.cook !== powerWall) * 3 : 0) +
      (walls.length - new Set([v.fridge, v.wet, v.cook]).size) * 4;
    return score(a) - score(b);
  });
  for (const choice of combinations) {
    if (oldSink && choice.wet !== oldSink.scianaId) continue;
    if (p.waterWall !== "auto" && choice.wet !== p.waterWall) continue;
    // With a measured centre and no explicit wall, use wall A rather than silently moving the point.
    if (
      p.sinkCenter !== undefined &&
      p.waterWall === "auto" &&
      choice.wet !== "a"
    )
      continue;
    for (const wetReversed of [false, true])
      for (const cookReversed of [false, true]) {
        const wet: Slot[] = [
          ...(p.dishwasher !== "none" && !has("dishwasherFront")
            ? [
                {
                  catalogId: `dishwasher-front-${p.dishwasher}`,
                  width: Number(p.dishwasher),
                },
              ]
            : []),
          ...(!oldSink ? [{ catalogId: "base-sink-600", width: 600 }] : []),
        ];
        const cook: Slot[] = [
          { catalogId: "base-drawers-600", width: preparationWidth },
          { catalogId: "base-oven-600", width: 600 },
          { catalogId: "base-shelves-600", width: 300 },
        ];
        if (wetReversed) wet.reverse();
        if (cookReversed) cook.reverse();
        const groups = [
          {
            key: "fridge",
            wall: choice.fridge,
            slots: has("refrigerator")
              ? []
              : [{ catalogId: "tall-refrigerator-600", width: 600 }],
          },
          { key: "wet", wall: choice.wet, slots: wet },
          { key: "cook", wall: choice.cook, slots: has("oven") ? [] : cook },
        ].filter((g) => g.slots.length);
        for (const order of permutations(groups)) {
          const lower: (Slot & { wall: Wall; x: number })[] = [];
          let feasible = true;
          for (const wall of walls) {
            const onWall = order.filter((g) => g.wall === wall);
            if (!onWall.length && preserve) continue;
            const fridgeIndex = onWall.findIndex((g) => g.key === "fridge");
            if (fridgeIndex > 0 && fridgeIndex < onWall.length - 1) {
              feasible = false;
              break;
            }
            const start = endAt(wall, false);
            const prior = existing
              .filter((m) => m.scianaId === wall && m.pozycjaYMM < 1000)
              .sort((a, b) => a.pozycjaXMM - b.pozycjaXMM);
            if (
              prior.length > 1 &&
              prior.at(-1)?.konstrukcja === "refrigerator"
            ) {
              feasible = false;
              break;
            }
            if (
              oldSink &&
              onWall.some((g) => g.key === "wet") &&
              (oldSink.pozycjaXMM + oldSink.szerokoscMM !== start ||
                onWall[0].key !== "wet")
            ) {
              feasible = false;
              break;
            }
            const length = kitchenPlanningEnd(d, wall);
            let slots: Slot[] = [],
              x = start;
            for (const g of onWall) {
              if (g.key === "wet" && !oldSink && p.sinkCenter !== undefined) {
                const sinkIndex = g.slots.findIndex(
                  (s) => s.catalogId === "base-sink-600",
                );
                const beforeSink = g.slots
                  .slice(0, sinkIndex)
                  .reduce((n, s) => n + s.width, 0);
                const padding = p.sinkCenter - 300 - beforeSink - x;
                if (padding < 0) {
                  feasible = false;
                  break;
                }
                if (padding > 0 && padding < 20) {
                  slots.push({ ...g.slots[0], gapBefore: padding });
                  slots.push(...g.slots.slice(1).map((s) => ({ ...s })));
                  x += padding + g.slots.reduce((n, s) => n + s.width, 0);
                  continue;
                }
                slots.push(...storage(padding));
                x += padding;
              }
              slots.push(...g.slots.map((s) => ({ ...s })));
              x += g.slots.reduce((n, s) => n + s.width, 0);
            }
            if (!feasible || x > length) {
              feasible = false;
              break;
            }
            const extra = length - x;
            // Keep the refrigerator at an end, and combine adjacent landing/storage panels where possible.
            const insertion =
              slots.at(-1)?.catalogId === "tall-refrigerator-600"
                ? slots.length - 1
                : slots.length;
            const previous = slots[insertion - 1];
            if (
              extra &&
              previous?.catalogId === "base-shelves-600" &&
              previous.width + extra <= 1200
            )
              previous.width += extra;
            else if (extra > 0 && extra < 20) {
              // A tiny measured remainder stays explicit empty space, not an invented undersized panel.
              if (insertion < slots.length)
                slots[insertion] = {
                  ...slots[insertion],
                  gapBefore: (slots[insertion].gapBefore ?? 0) + extra,
                };
            } else slots.splice(insertion, 0, ...storage(extra));
            x = start;
            for (const s of slots) {
              x += s.gapBefore ?? 0;
              lower.push({ ...s, wall, x });
              x += s.width;
            }
          }
          if (
            !feasible ||
            existingItems.length + lower.length + Number(!has("hood")) > 24
          )
            continue;
          const sink = lower.find((s) => s.catalogId === "base-sink-600")!,
            oven = lower.find((s) => s.catalogId === "base-oven-600")!,
            preparation = lower.find(
              (s) => s.catalogId === "base-drawers-600",
            )!;
          const proposedFridge = lower.find(
            (s) => s.catalogId === "tall-refrigerator-600",
          );
          if (
            proposedFridge &&
            !(
              (proposedFridge.wall === "a" && proposedFridge.x === 0) ||
              (proposedFridge.wall === walls.at(-1) &&
                proposedFridge.x + proposedFridge.width ===
                  kitchenPlanningEnd(d, proposedFridge.wall))
            )
          )
            continue;
          if (
            !preserve &&
            sink.wall === oven.wall &&
            !(
              preparation.wall === sink.wall &&
              preparation.x >=
                Math.min(sink.x + sink.width, oven.x + oven.width) &&
              preparation.x + preparation.width <= Math.max(sink.x, oven.x)
            )
          )
            continue;
          const uppers = lower
            .filter((s) => s.catalogId !== "tall-refrigerator-600")
            .map((s) => ({
              ...s,
              catalogId:
                s.catalogId === "base-oven-600"
                  ? "wall-hood-600"
                  : s.catalogId === "base-filler-50"
                    ? "wall-filler-50"
                    : "wall-shelves-600",
            }));
          if (preserve && !has("hood")) {
            const oven = existing.find((m) => m.konstrukcja === "oven");
            if (oven)
              uppers.push({
                catalogId: "wall-hood-600",
                wall: oven.scianaId as Wall,
                x: oven.pozycjaXMM,
                width: 600,
              });
          }
          if (preserve && has("hood")) {
            const hood = existing.find((m) => m.konstrukcja === "hood")!;
            const oven =
              lower.find((s) => s.catalogId === "base-oven-600") ??
              existing.find((m) => m.konstrukcja === "oven");
            if (
              oven &&
              ("x" in oven
                ? oven.wall !== hood.scianaId ||
                  oven.x + oven.width / 2 !==
                    hood.pozycjaXMM + hood.szerokoscMM / 2
                : oven.scianaId !== hood.scianaId ||
                  oven.pozycjaXMM + oven.szerokoscMM / 2 !==
                    hood.pozycjaXMM + hood.szerokoscMM / 2)
            )
              continue;
          }
          if (
            uppers.some(
              (s) =>
                s.catalogId === "wall-hood-600" && s.x < endAt(s.wall, true),
            )
          )
            continue;
          // Prioritise the extractor and useful work zones when a very long room reaches the sketch limit.
          const selectedUpper = [
            ...uppers.filter(
              (s) =>
                s.x >= endAt(s.wall, true) &&
                !(has("hood") && s.catalogId === "wall-hood-600"),
            ),
          ]
            .sort(
              (a, b) =>
                Number(b.catalogId === "wall-hood-600") -
                Number(a.catalogId === "wall-hood-600"),
            )
            .slice(0, 24 - existingItems.length - lower.length);
          let candidate: KitchenItem[] = [...existingItems];
          for (const wall of walls) {
            for (const row of [
              lower.filter((s) => s.wall === wall),
              selectedUpper
                .filter((s) => s.wall === wall)
                .sort((a, b) => a.x - b.x),
            ]) {
              const upperRow = row[0]?.catalogId.startsWith("wall-");
              let end = endAt(wall, !!upperRow);
              for (const s of row) {
                candidate.push({
                  id: `00000000-0000-4000-8000-${String(candidate.length + 1).padStart(12, "0")}`,
                  catalogId: s.catalogId,
                  wall,
                  width: s.width,
                  gapBefore: s.x - end,
                });
                end = s.x + s.width;
              }
            }
          }
          candidate = trimKitchenStorage(
            d,
            candidate,
            new Set(existingItems.map((i) => i.id)),
          );
          candidate = adaptKitchenStorage(
            candidate,
            d.needs,
            new Set(existingItems.map((i) => i.id)),
          );
          if (candidate.length > 24) continue;
          if (
            candidate.some((i) => !kitchenItemSchema.safeParse(i).success) ||
            kitchenIssues({ ...d, items: candidate }).length
          )
            continue;
          if (
            kitchenFunctionalReview({ ...d, items: candidate }).warnings.length
          )
            continue;
          if (candidate.length === existingItems.length)
            throw new Error(
              "Nie ma brakujących urządzeń do dodania. Możesz dopełnić rząd szafkami do przechowywania lub przygotowania.",
            );
          // Trial layouts do not consume IDs; existing items retain identity and every field.
          const usedIds = new Set(
            [...existingItems, ...(d.island?.items ?? [])].map((i) => i.id),
          );
          return candidate.map((i, index) => {
            if (index < existingItems.length) return i;
            let next = id(),
              attempts = 0;
            while (usedIds.has(next) && attempts++ < 100) next = id();
            if (usedIds.has(next))
              throw new Error(
                "Nie udało się nadać nowych identyfikatorów. Spróbuj ponownie.",
              );
            usedIds.add(next);
            return kitchenItemSchema.parse({ ...i, id: next });
          });
        }
      }
  }
  throw new Error(
    "Nie mieści się spójny układ z lodówką, zlewem, wybraną zmywarką, strefą przygotowania 600 mm oraz piekarnikiem z płytą i okapem. Zmień wymiary, ścianę lub środek zlewu, wybierz zmywarkę 450 mm albo bez zmywarki. Dotychczasowy projekt pozostaje bez zmian.",
  );
}

export function suggestKitchen(
  d: Omit<KitchenInput, "quote">,
  id: () => string,
  preserve = false,
): KitchenItem[] {
  if (d.needs?.priority === "worktop" && !preserve) {
    try {
      return findKitchenSuggestion(d, id, preserve, 900);
    } catch {
      /* A larger work cabinet is a preference, not permission to violate room constraints. */
    }
  }
  return findKitchenSuggestion(d, id, preserve);
}
