import test from "node:test";
import assert from "node:assert/strict";
import {
  kitchenInputSchema,
  kitchenIssues,
  kitchenModules,
  suggestKitchen,
  type KitchenInput,
} from "./kitchen-configuration.js";
import { kitchenFunctionalReview } from "./kitchen-functions.js";
import { fillKitchenRun } from "./kitchen-run.js";
import { calculateKitchenEstimate } from "./kitchen-estimate.js";
import {
  brief,
  readDraft,
  toAnalysis,
} from "../../web/src/v2/planner/model.js";
const uuid = () => {
  let n = 0;
  return () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
};
const draft = (overrides: Partial<KitchenInput> = {}) =>
  kitchenInputSchema.parse({
    layout: "straight",
    width: 3600,
    depth: 2400,
    returnLength: 3600,
    height: 2600,
    items: [],
    ...overrides,
  });

test("a straight kitchen has refrigeration, adjacent washing, preparation and cooking with a centred extractor", () => {
  const d = draft();
  d.items = suggestKitchen(d, uuid());
  const lower = kitchenModules(d).filter((m) => m.pozycjaYMM < 1000);
  assert.deepEqual(
    lower.map((m) => m.konstrukcja),
    ["refrigerator", "dishwasherFront", "sink", "drawers", "oven", "shelves"],
  );
  assert.deepEqual(
    lower.map((m) => m.szerokoscMM),
    [600, 600, 600, 600, 600, 600],
  );
  const r = kitchenFunctionalReview(d);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.hoods[0].pozycjaXMM, r.ovens[0].pozycjaXMM);
  assert.equal(r.hoods[0].pozycjaYMM, 1400);
  assert.ok(
    !kitchenModules(d).some((m) => m.pozycjaYMM >= 1000 && m.pozycjaXMM < 600),
  );
});

test("L and U use the room's arms for functional groups rather than repeat appliances", () => {
  for (const layout of ["l", "u"] as const) {
    const d = draft({ layout });
    d.items = suggestKitchen(d, uuid());
    assert.deepEqual(kitchenIssues(d), []);
    const r = kitchenFunctionalReview(d);
    for (const rows of [r.sinks, r.dishwashers, r.ovens, r.hoods, r.fridges])
      assert.equal(rows.length, 1);
    assert.equal(r.ovens[0].scianaId, layout === "l" ? "b" : "c");
    assert.equal(r.sinks[0].scianaId, "a"); // 2400-mm B has only 1100 mm after reserving both corners.
    assert.deepEqual(r.warnings, []);
    assert.ok(d.items.length <= 24);
  }
});

test("measured sink centre and dishwasher width survive import, quote and geometry", () => {
  const d = draft({
    layout: "l",
    planning: { waterWall: "b", sinkCenter: 1550, dishwasher: "450" },
  });
  d.items = suggestKitchen(d, uuid());
  const r = kitchenFunctionalReview(d);
  assert.equal(r.sinks[0].scianaId, "b");
  assert.equal(r.sinks[0].pozycjaXMM + r.sinks[0].szerokoscMM / 2, 1550);
  assert.equal(r.dishwashers[0].szerokoscMM, 450);
  assert.deepEqual(r.warnings, []);
  const restored = readDraft(
    JSON.stringify({ version: 1, finish: "oak", ...d }),
  );
  assert.deepEqual(restored.planning, d.planning);
  assert.match(brief(restored), /środek zlewu 1550/);
  assert.equal(calculateKitchenEstimate(restored).estimate.status, "estimated");
  assert.deepEqual(
    toAnalysis(restored).zbudowane.map((b) => b.elementy),
    calculateKitchenEstimate(restored).built.map((b) => b.elementy),
  );
});

test("undersized kitchens and impossible water points never publish an incomplete proposal or consume IDs", () => {
  for (const d of [
    draft({ width: 1800 }),
    draft({
      planning: { waterWall: "a", sinkCenter: 3500, dishwasher: "600" },
    }),
    draft({
      layout: "l",
      planning: { waterWall: "b", sinkCenter: 500, dishwasher: "600" },
    }),
  ]) {
    const before = structuredClone(d);
    let calls = 0;
    assert.throws(
      () =>
        suggestKitchen(d, () => {
          calls++;
          return uuid()();
        }),
      /Nie mieści się/,
    );
    assert.equal(calls, 0);
    assert.deepEqual(d, before);
  }
  assert.throws(() =>
    kitchenInputSchema.parse(
      draft({ planning: { waterWall: "b", dishwasher: "600" } }),
    ),
  );
});

test("choosing no dishwasher is explicit and does not silently remove it for a smaller room", () => {
  const d = draft({
    width: 3000,
    planning: { waterWall: "auto", dishwasher: "none" },
  });
  d.items = suggestKitchen(d, uuid());
  assert.equal(kitchenFunctionalReview(d).dishwashers.length, 0);
  assert.deepEqual(kitchenFunctionalReview(d).warnings, []);
  assert.throws(() =>
    suggestKitchen(
      { ...d, planning: { ...d.planning!, dishwasher: "600" } },
      uuid(),
    ),
  );
});

test("proposal matrix preserves exact bounds and catalog identities over unequal I/L/U rooms", () => {
  for (const layout of ["straight", "l", "u"] as const)
    for (const width of [3300, 3651, 4800, 8000])
      for (const dishwasher of ["600", "450", "none"] as const) {
        const d = draft({
          layout,
          width,
          depth: 2600,
          returnLength: 3200,
          planning: { waterWall: "auto", dishwasher },
        });
        d.items = suggestKitchen(d, uuid());
        assert.ok(d.items.length <= 24);
        assert.deepEqual(kitchenIssues(d), []);
        assert.doesNotThrow(() => kitchenInputSchema.parse(d));
        assert.deepEqual(kitchenFunctionalReview(d).warnings, []);
      }
});

test("manual changes update functional warnings and autofill has an explicit preparation purpose", () => {
  const d = draft({
    planning: { waterWall: "a", sinkCenter: 1500, dishwasher: "600" },
  });
  d.items = suggestKitchen(d, uuid());
  const sink = d.items.find((i) => i.catalogId === "base-sink-600")!;
  sink.gapBefore = 50;
  const r = kitchenFunctionalReview(d);
  assert.ok(r.warnings.some((w) => w.includes("nie sąsiaduje")));
  assert.ok(r.warnings.some((w) => w.includes("nie odpowiada")));
  d.items = d.items.filter((i) => !i.catalogId.includes("hood"));
  assert.ok(
    kitchenFunctionalReview(d).warnings.some((w) => w.includes("Brak okapu")),
  );
  const empty = draft();
  empty.items = fillKitchenRun(empty, "a", "base", uuid(), "preparation");
  assert.ok(empty.items.every((i) => i.catalogId === "base-drawers-600"));
  assert.ok(
    kitchenFunctionalReview(empty).warnings.some((w) =>
      w.includes("Brak zlewu"),
    ),
  );
});

test("functional autofill preserves an existing fridge and completes missing zones without duplicate IDs", () => {
  const d = draft();
  d.items = [{ id: uuid()(), catalogId: "tall-refrigerator-600", wall: "a" }];
  const before = structuredClone(d.items[0]);
  d.items = suggestKitchen(d, uuid(), true);
  assert.deepEqual(d.items[0], before);
  assert.equal(new Set(d.items.map((i) => i.id)).size, d.items.length);
  assert.equal(kitchenFunctionalReview(d).fridges.length, 1);
  assert.deepEqual(kitchenFunctionalReview(d).warnings, []);
  assert.doesNotThrow(() => kitchenInputSchema.parse(d));
});

test("functional autofill refuses a blocked complete row without moving user furniture", () => {
  const d = draft();
  d.items = Array.from({ length: 6 }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    catalogId: "base-shelves-600",
    wall: "a",
  }));
  const before = structuredClone(d);
  assert.throws(() => suggestKitchen(d, uuid(), true), /Nie mieści się/);
  assert.deepEqual(d, before);
});
