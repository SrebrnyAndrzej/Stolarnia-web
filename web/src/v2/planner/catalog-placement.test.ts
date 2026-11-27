import { test } from "node:test";
import assert from "node:assert/strict";
import {
  kitchenAdditionFits,
  kitchenAdditionPreview,
  planKitchenAddition,
  uniqueKitchenAdditionPreviews,
} from "./catalog-placement";
import { catalog, newDraft, toAnalysis, type Draft } from "./model";
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

test("a catalog preview promises the actual fitted dimensions, without changing the draft or catalog", () => {
  const d: Draft = {
    ...newDraft(),
    items: [
      { id: id(1), wall: "a", catalogId: "base-shelves-600" },
      { id: id(2), wall: "a", catalogId: "base-shelves-600", gapBefore: 400 },
    ],
  };
  const before = JSON.stringify({ d, catalog });
  const gap = kitchenFreeGaps(d, "a", "base").find((g) => g.width === 400)!;
  const preview = kitchenAdditionPreview(d, "a", "base-shelves-600", gap.id)!;
  const next = planKitchenAddition(d, "a", preview.id, gap.id, () => id(9));
  const actual = toAnalysis(next).projekt.moduly.find((m) => m.id === id(9))!;
  assert.equal(preview.name, actual.nazwa);
  assert.equal(preview.widthMM, 400);
  assert.deepEqual(
    [preview.widthMM, preview.heightMM, preview.depthMM],
    [actual.szerokoscMM, actual.wysokoscMM, actual.glebokoscMM],
  );
  assert.equal(JSON.stringify({ d, catalog }), before);
});

test("the preview retains standard appliance widths and cannot offer an appliance in a narrower gap", () => {
  const d: Draft = {
    ...newDraft(),
    items: [
      { id: id(1), wall: "a", catalogId: "base-shelves-600" },
      { id: id(2), wall: "a", catalogId: "base-shelves-600", gapBefore: 400 },
    ],
  };
  const gap = kitchenFreeGaps(d, "a", "base").find((g) => g.width === 400)!;
  assert.equal(
    kitchenAdditionPreview(d, "a", "dishwasher-front-600", gap.id),
    undefined,
  );
  assert.equal(
    kitchenAdditionPreview(d, "a", "base-shelves-600", "stale"),
    undefined,
  );
  const standard = kitchenAdditionPreview(
    newDraft(),
    "a",
    "dishwasher-front-600",
    "",
  )!;
  assert.equal(standard.widthMM, 600);
});

test("fitting a shelf unit previews neighboring height and depth as well as width", () => {
  const entry = catalog.find((m) => m.id === "base-shelves-600")!;
  const height =
    entry.availableHeightsMM.find((n) => n !== entry.heightMM) ??
    entry.heightMM;
  const depth =
    entry.availableDepthsMM.find((n) => n !== entry.depthMM) ?? entry.depthMM;
  const d: Draft = {
    ...newDraft(),
    items: [
      { id: id(1), wall: "a", catalogId: entry.id, height, depth },
      {
        id: id(2),
        wall: "a",
        catalogId: entry.id,
        height,
        depth,
        gapBefore: 400,
      },
    ],
  };
  const gap = kitchenFreeGaps(d, "a", "base").find((g) => g.width === 400)!;
  const preview = kitchenAdditionPreview(d, "a", entry.id, gap.id)!;
  assert.equal(preview.widthMM, 400);
  assert.equal(preview.heightMM, height);
  assert.equal(preview.depthMM, depth);
});

test("equivalent fitted choices appear once, while dimensions and future editing choices remain distinct", () => {
  const entry = catalog.find((m) => m.id === "base-shelves-600")!;
  const a = { ...entry, widthMM: 400 };
  const equivalent = {
    ...a,
    id: "another-width",
    name: "Another nominal width",
    tags: [],
  };
  const wider = { ...a, id: "wider", widthMM: 450 };
  const differentHeights = { ...a, id: "heights", availableHeightsMM: [800] };
  const before = JSON.stringify([a, equivalent, wider, differentHeights]);
  assert.deepEqual(
    uniqueKitchenAdditionPreviews([a, equivalent, wider, differentHeights]),
    [a, wider, differentHeights],
  );
  assert.equal(
    JSON.stringify([a, equivalent, wider, differentHeights]),
    before,
  );
});
