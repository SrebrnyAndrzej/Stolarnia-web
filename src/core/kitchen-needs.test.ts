import test from "node:test";
import assert from "node:assert/strict";
import {
  kitchenInputSchema,
  kitchenIssues,
  kitchenModules,
  suggestKitchen,
} from "./kitchen-configuration.js";
import { kitchenNeedsSchema } from "./kitchen-needs-schema.js";
import { adaptKitchenStorage, reviewKitchenNeeds } from "./kitchen-needs.js";
import { kitchenFunctionalReview } from "./kitchen-functions.js";
import { calculateKitchenEstimate } from "./kitchen-estimate.js";
import { brief, readDraft } from "../../web/src/v2/planner/model.js";

const ids = () => {
  let n = 0;
  return () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
};
const input = (extra: object = {}) =>
  kitchenInputSchema.parse({
    layout: "straight",
    width: 4200,
    depth: 3000,
    height: 2600,
    items: [],
    ...extra,
  });
const needs = (extra: object = {}) =>
  kitchenNeedsSchema.parse({
    household: "3-4",
    cooking: "daily",
    storage: ["cutlery", "cookware", "dishes", "pantry"],
    priority: "storage",
    ...extra,
  });

test("needs survive old/new draft imports and handoff, invalid choices are rejected", () => {
  const old = readDraft(JSON.stringify({ version: 1, ...input() }));
  assert.equal(old.needs, undefined);
  const d = readDraft(
    JSON.stringify({ version: 1, ...input({ needs: needs() }) }),
  );
  assert.deepEqual(d.needs, needs());
  assert.match(brief(d), /Potrzeby domowników:.*Garnki i patelnie/);
  for (const value of [
    { household: "20" },
    { storage: ["cutlery", "cutlery"] },
    { priority: "cheap" },
    { storage: ["unknown"] },
  ])
    assert.equal(kitchenNeedsSchema.safeParse(value).success, false);
});

test("storage needs change real drawer interiors without moving appliances or room features", () => {
  const d = input();
  const standard = suggestKitchen(d, ids());
  const personalized = suggestKitchen({ ...d, needs: needs() }, ids());
  const positions = (items: typeof standard) =>
    kitchenModules({ ...d, items }).map((m) => [
      m.id,
      m.pozycjaXMM,
      m.pozycjaYMM,
      m.szerokoscMM,
      m.wysokoscMM,
      m.glebokoscMM,
    ]);
  assert.deepEqual(positions(personalized), positions(standard));
  assert.ok(
    personalized.filter((m) => m.catalogId === "base-drawers-600").length >
      standard.filter((m) => m.catalogId === "base-drawers-600").length,
  );
  assert.ok(personalized.some((m) => m.drawers === 2));
  assert.ok(
    personalized.some(
      (m) => m.drawers === 3 && m.drawerFronts?.mode === "graduated",
    ),
  );
  assert.deepEqual(kitchenIssues({ ...d, items: personalized }), []);
});

test("worktop preference tries 90 cm but falls back safely when only 60 cm fits", () => {
  const large = input({ needs: needs({ priority: "worktop" }) });
  large.items = suggestKitchen(large, ids());
  assert.ok(
    large.items.some(
      (m) => m.catalogId === "base-drawers-600" && m.width === 900,
    ),
  );
  const small = input({ width: 3300, needs: needs({ priority: "worktop" }) });
  small.items = suggestKitchen(small, ids());
  assert.ok(
    small.items.some(
      (m) => m.catalogId === "base-drawers-600" && m.width === 600,
    ),
  );
  assert.equal(reviewKitchenNeeds(small)!.widest, 600);
  assert.deepEqual(kitchenIssues(small), []);
});

test("all layouts preserve washing/cooking, unique IDs and corner constraints for each priority", () => {
  for (const layout of ["straight", "l", "u", "parallel"] as const)
    for (const priority of [
      "balanced",
      "storage",
      "worktop",
      "economy",
    ] as const) {
      const d = input({
        layout,
        needs: needs({ priority }),
        planning: { dishwasher: "450" },
      });
      d.items = suggestKitchen(d, ids());
      assert.deepEqual(kitchenIssues(d), [], `${layout}/${priority}`);
      assert.deepEqual(
        kitchenFunctionalReview(d).warnings,
        [],
        `${layout}/${priority}`,
      );
      assert.equal(new Set(d.items.map((m) => m.id)).size, d.items.length);
      assert.equal(kitchenFunctionalReview(d).dishwashers[0].szerokoscMM, 450);
    }
});

test("economy uses the actual estimate, not a guessed discount", () => {
  const economy = input({ needs: needs({ priority: "economy" }) });
  const storage = input({ needs: needs({ priority: "storage" }) });
  economy.items = suggestKitchen(economy, ids());
  storage.items = suggestKitchen(storage, ids());
  assert.ok(
    calculateKitchenEstimate(storage).estimate.gross! >
      calculateKitchenEstimate(economy).estimate.gross!,
  );
});

test("storage adaptation never edits preserved cabinets and review follows subsequent manual removal", () => {
  const d = input({
    needs: needs({ storage: ["cutlery", "appliances", "recycling"] }),
  });
  d.items = suggestKitchen(d, ids());
  assert.deepEqual(
    adaptKitchenStorage(d.items, needs(), new Set(d.items.map((i) => i.id))),
    d.items,
  );
  const review = reviewKitchenNeeds(d)!;
  assert.ok(review.assignments.find((r) => r.need === "cutlery")!.id);
  for (const key of ["appliances", "recycling"])
    assert.equal(review.assignments.find((r) => r.need === key)!.id, undefined);
  const removed = {
    ...d,
    items: d.items.filter((i) => i.catalogId !== "base-drawers-600"),
  };
  assert.equal(
    reviewKitchenNeeds(removed)!.assignments.find((r) => r.need === "cutlery")!
      .id,
    undefined,
  );
});
