import test from "node:test";
import assert from "node:assert/strict";
import {
  kitchenInputSchema,
  kitchenIssues,
  kitchenModules,
} from "./kitchen-configuration.js";
import { kitchenProposals } from "./kitchen-proposals.js";
import { calculateKitchenEstimate } from "./kitchen-estimate.js";
import { kitchenFunctionalReview } from "./kitchen-functions.js";
import { zbudujModul } from "./builder.js";
import { USTAWIENIA_DOMYSLNE } from "./settings.js";

const input = (extra: object = {}) =>
  kitchenInputSchema.parse({
    layout: "straight",
    width: 4200,
    depth: 3000,
    height: 2600,
    items: [],
    needs: {
      household: "3-4",
      storage: ["cutlery", "cookware"],
      priority: "storage",
    },
    ...extra,
  });
const ids = () => {
  let n = 0;
  return () => `10000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
};

test("proposals preview real distinct kitchens without changing the source or materials", () => {
  const source = input({
    finish: "cashmere",
    quote: { front: "fluted", worktop: "compact", installation: false },
  });
  const before = structuredClone(source);
  const result = kitchenProposals(source, ids());
  assert.equal(result.options.length, 3);
  assert.equal(result.options[0].id, "storage");
  assert.deepEqual(source, before);
  for (const p of result.options) {
    assert.equal(p.draft.finish, source.finish);
    assert.deepEqual(p.draft.quote, source.quote);
    assert.deepEqual(p.draft.needs?.storage, source.needs?.storage);
    assert.deepEqual(kitchenIssues(p.draft), []);
    assert.deepEqual(kitchenFunctionalReview(p.draft).warnings, []);
    const modules = kitchenModules(p.draft);
    assert.equal(
      p.stats.drawers,
      modules
        .flatMap(
          (m) => zbudujModul(m, USTAWIENIA_DOMYSLNE.konstrukcja).elementy,
        )
        .filter((e) => e.rola === "front" && e.kod.startsWith("FRONT-SZ"))
        .length,
    );
  }
  const storage = result.options.find((p) => p.id === "storage")!;
  const economy = result.options.find((p) => p.id === "economy")!;
  assert.ok(storage.stats.drawers > economy.stats.drawers);
  assert.ok(
    calculateKitchenEstimate(storage.draft).estimate.gross! >
      calculateKitchenEstimate(economy.draft).estimate.gross!,
  );
});

test("identical feasible results are shown once rather than as three invented alternatives", () => {
  const result = kitchenProposals(
    input({ width: 3300, needs: { priority: "storage" } }),
    ids(),
  );
  assert.equal(result.options.length, 1);
  assert.equal(result.options[0].alsoMatches.length, 2);
});

test("water constraints and room validation are respected by every proposed layout", () => {
  const source = input({
    layout: "l",
    width: 3600,
    depth: 3000,
    planning: { waterWall: "b", sinkCenter: 1550, dishwasher: "450" },
  });
  const result = kitchenProposals(source, ids());
  assert.ok(result.options.length);
  for (const p of result.options) {
    const sink = kitchenFunctionalReview(p.draft).sinks[0];
    assert.equal(sink.scianaId, "b");
    assert.equal(sink.pozycjaXMM + sink.szerokoscMM / 2, 1550);
    assert.deepEqual(kitchenIssues(p.draft), []);
  }
});

test("an impossible kitchen offers reasons and leaves the existing source untouched", () => {
  const source = input({ width: 1800 });
  let idsConsumed = 0;
  const result = kitchenProposals(source, () => {
    idsConsumed++;
    return "10000000-0000-4000-8000-000000000001";
  });
  assert.equal(result.options.length, 0);
  assert.equal(result.unavailable.length, 3);
  assert.equal(idsConsumed, 0);
  assert.deepEqual(source.items, []);
});
