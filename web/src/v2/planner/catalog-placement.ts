import {
  fillKitchenGap,
  kitchenFreeGaps,
} from "../../../../src/core/kitchen-runs";
import {
  isKitchenUpper,
  kitchenModules,
} from "../../../../src/core/kitchen-configuration";
import { catalog, layoutIssues, type Draft } from "./model";
import type { ModulKatalogowy } from "../../../../src/core/types";

/** Preview and commit use the same placement rules; a catalog card never promises an invalid addition. */
export function planKitchenAddition(
  draft: Draft,
  wall: "a" | "b" | "c",
  catalogId: string,
  gapId: string,
  id: () => string,
): Draft {
  if (draft.items.length >= 24)
    throw new Error("Szkic może zawierać do 24 elementów: szafek i blend.");
  const entry = catalog.find((m) => m.id === catalogId);
  if (!entry) throw new Error("Wybierz szafkę z aktualnego katalogu.");
  let items = draft.items;
  if (gapId) {
    const gap = (["base", "wall"] as const)
      .flatMap((tier) => kitchenFreeGaps(draft, wall, tier))
      .find((g) => g.id === gapId);
    if (!gap)
      throw new Error("Luka zmieniła się. Wybierz aktualne wolne miejsce.");
    const tier = isKitchenUpper(entry)
      ? "wall"
      : entry.category === "tall" || entry.construction === "refrigerator"
        ? "tall"
        : "base";
    const current = kitchenFreeGaps(draft, wall, tier).find(
      (g) => g.start === gap.start && g.end === gap.end,
    );
    if (!current) throw new Error("Ta szafka nie pasuje do wskazanego rzędu.");
    items = fillKitchenGap(
      draft,
      wall,
      tier,
      current.id,
      id,
      "storage",
      catalogId,
    );
  } else items = [...draft.items, { id: id(), catalogId, wall }];
  const next = { ...draft, items };
  const problems = layoutIssues(next);
  if (problems.length) throw new Error(problems[0]);
  return next;
}

export function kitchenAdditionPreview(
  draft: Draft,
  wall: "a" | "b" | "c",
  catalogId: string,
  gapId: string,
) {
  let n = 999999;
  const id = () => {
    let value: string;
    do value = `00000000-0000-4000-8000-${String(n--).padStart(12, "0")}`;
    while (draft.items.some((i) => i.id === value));
    return value;
  };
  try {
    const next = planKitchenAddition(draft, wall, catalogId, gapId, id);
    const added = next.items.find(
      (item) => !draft.items.some((existing) => existing.id === item.id),
    );
    const module = kitchenModules(next).find((m) => m.id === added?.id);
    const entry = catalog.find((m) => m.id === catalogId);
    if (!module || !entry) return undefined;
    return {
      ...entry,
      name: module.nazwa,
      widthMM: module.szerokoscMM,
      heightMM: module.wysokoscMM,
      depthMM: module.glebokoscMM,
    };
  } catch {
    return undefined;
  }
}

export function kitchenAdditionFits(
  draft: Draft,
  wall: "a" | "b" | "c",
  catalogId: string,
  gapId: string,
) {
  return kitchenAdditionPreview(draft, wall, catalogId, gapId) !== undefined;
}

/** Several nominal widths can produce the same fitted cabinet. Show that choice once. */
export function uniqueKitchenAdditionPreviews(entries: ModulKatalogowy[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const { id, name, tags, ...configuration } = entry;
    const key = JSON.stringify(configuration);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
