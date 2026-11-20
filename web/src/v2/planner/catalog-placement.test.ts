import { test } from "node:test";
import assert from "node:assert/strict";
import { kitchenAdditionFits, planKitchenAddition } from "./catalog-placement";
import { newDraft, toAnalysis, type Draft } from "./model";
import { kitchenFreeGaps } from "../../../../src/core/kitchen-runs";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

test("a full base run offers upper units, but never another base unit", () => {
  const d: Draft = {
    ...newDraft(),
    width: 1800,
    items: [1, 2, 3].map((n) => ({
      id: id(n),
      wall: "a",
      catalogId: "base-shelves-600",
    })),
  };
  const before = JSON.stringify(d);
  assert.equal(kitchenAdditionFits(d, "a", "base-shelves-300", ""), false);
  assert.equal(kitchenAdditionFits(d, "a", "wall-shelves-600", ""), true);
  assert.throws(() =>
    planKitchenAddition(d, "a", "base-shelves-300", "", () => id(9)),
  );
  assert.equal(JSON.stringify(d), before);
});

test("catalog preview applies room opening and tall-unit restrictions", () => {
  const d: Draft = {
    ...newDraft(),
    items: [{ id: id(1), wall: "a", catalogId: "tall-refrigerator-600" }],
  };
  assert.equal(kitchenAdditionFits(d, "a", "wall-shelves-600", ""), false);
  d.items = [];
  d.features = [
    {
      id: id(8),
      kind: "window",
      wall: "a",
      x: 0,
      bottom: 500,
      width: 1000,
      height: 1500,
    },
  ];
  assert.equal(kitchenAdditionFits(d, "a", "base-shelves-600", ""), false);
});

test("insertion into a gap retains the neighboring cabinet position and rejects a stale gap", () => {
  const d: Draft = {
    ...newDraft(),
    items: [
      { id: id(1), wall: "a", catalogId: "base-shelves-600" },
      { id: id(2), wall: "a", catalogId: "base-shelves-600", gapBefore: 400 },
    ],
  };
  const gap = kitchenFreeGaps(d, "a", "base").find((g) => g.width === 400)!;
  assert.equal(kitchenAdditionFits(d, "a", "base-shelves-600", gap.id), true);
  const next = planKitchenAddition(d, "a", "base-shelves-600", gap.id, () =>
    id(9),
  );
  const right = (draft: Draft) =>
    toAnalysis(draft).projekt.moduly.find((m) => m.id === id(2))!.pozycjaXMM;
  assert.equal(right(next), right(d));
  assert.equal(next.items.find((i) => i.id === id(9))?.width, 400);
  assert.equal(
    kitchenAdditionFits(next, "a", "base-shelves-600", gap.id),
    false,
  );
});
