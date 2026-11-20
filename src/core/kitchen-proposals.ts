import {
  kitchenModules,
  suggestKitchen,
  type KitchenInput,
} from "./kitchen-configuration.js";
import {
  kitchenNeedsSchema,
  type KitchenNeeds,
} from "./kitchen-needs-schema.js";
import { reviewKitchenNeeds } from "./kitchen-needs.js";

export type KitchenProposal<T extends KitchenInput = KitchenInput> = {
  id: string;
  title: string;
  description: string;
  draft: T;
  alsoMatches: string[];
  stats: {
    drawerCabinets: number;
    drawers: number;
    shelfCabinets: number;
    widestWorkCabinet: number;
    pendingNeeds: number;
  };
};

/** All candidates use the same planner, constraints and materials. Previews never mutate the input. */
export function kitchenProposals<T extends KitchenInput>(
  source: T,
  id: () => string,
) {
  const needs = kitchenNeedsSchema.parse(source.needs ?? {});
  const alternatives: KitchenNeeds["priority"][] =
    needs.priority === "economy"
      ? ["storage", "worktop"]
      : needs.priority === "worktop"
        ? ["economy", "storage"]
        : ["economy", "worktop"];
  const titles = {
    balanced: "Równowaga szuflad i półek",
    economy: "Prostsze wyposażenie",
    storage: "Wygodne przechowywanie",
    worktop: "Więcej blatu do pracy",
  };
  const descriptions = {
    balanced:
      "Szuflady przy gotowaniu oraz szafki półkowe na pozostałe rzeczy.",
    economy:
      "Ograniczamy dodatkowe zestawy szuflad. Porównaj rzeczywistą cenę poniżej.",
    storage: "Preferujemy dodatkowe szuflady w dostępnych szafkach dolnych.",
    worktop:
      "Szukamy miejsca na szafkę roboczą 90 cm; gdy nie pasuje, stosujemy 60 cm.",
  };
  const options: KitchenProposal<T>[] = [];
  const unavailable: { title: string; reason: string }[] = [];
  const signatures = new Map<string, KitchenProposal<T>>();
  for (const priority of [needs.priority, ...alternatives]) {
    try {
      const candidate: T = { ...source, needs: { ...needs, priority } };
      candidate.items = suggestKitchen(candidate, id);
      const signature = JSON.stringify(
        candidate.items.map(({ id: _id, ...item }) => item),
      );
      const duplicate = signatures.get(signature);
      if (duplicate) {
        duplicate.alsoMatches.push(titles[priority]);
        continue;
      }
      const modules = kitchenModules(candidate);
      const review = reviewKitchenNeeds(candidate)!;
      const option: KitchenProposal<T> = {
        id: priority,
        title: titles[priority],
        description: descriptions[priority],
        draft: candidate,
        alsoMatches: [],
        stats: {
          drawerCabinets: modules.filter((m) => m.konstrukcja === "drawers")
            .length,
          drawers: modules.reduce(
            (n, m) => n + m.konfiguracja.liczbaSzuflad,
            0,
          ),
          shelfCabinets: modules.filter((m) => m.konstrukcja === "shelves")
            .length,
          widestWorkCabinet: review.widest,
          pendingNeeds: review.assignments.filter((row) => !row.id).length,
        },
      };
      signatures.set(signature, option);
      options.push(option);
    } catch (e) {
      unavailable.push({
        title: titles[priority],
        reason:
          e instanceof Error
            ? e.message
            : "Nie udało się przygotować tego wariantu.",
      });
    }
  }
  return { options, unavailable };
}
