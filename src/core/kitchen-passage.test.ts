import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateKitchenEstimate } from "./kitchen-estimate.js";
import { kitchenParallelPassage } from "./kitchen-passage.js";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const room = () => ({
  layout: "parallel",
  width: 2400,
  depth: 2400,
  height: 2600,
  items: [
    { id: uuid(1), wall: "a", catalogId: "base-shelves-600", width: 1200 },
    {
      id: uuid(2),
      wall: "c",
      catalogId: "base-shelves-600",
      width: 1200,
      gapBefore: 1200,
    },
  ],
});
const measure = (raw: unknown) => {
  const { input, built } = calculateKitchenEstimate(raw);
  return kitchenParallelPassage(input, built);
};
test("passage uses actual builder worktops, not wall spacing or a fixed subtraction of 120 cm", () => {
  const p = measure(room())!;
  assert.equal(p.distanceMM, 1240);
  assert.equal(p.y1, 580);
  assert.equal(p.y2, 1820);
  assert.deepEqual(p.moduleIds, [uuid(1), uuid(2)]);
  assert.ok(p.x > 0 && p.x < 1200);
});
test("a deeper cabinet and projecting side covers change the measured closed envelope", () => {
  const d = room();
  assert.equal(
    measure({ ...d, items: [{ ...d.items[0], depth: 600 }, d.items[1]] })!
      .distanceMM,
    1200,
  );
  assert.equal(
    measure({
      ...d,
      items: [
        {
          ...d.items[0],
          surround: {
            left: true,
            right: false,
            top: false,
            bottom: false,
            projection: 100,
          },
        },
        d.items[1],
      ],
    })!.distanceMM,
    1140,
  );
});
test("there is no invented measurement for rows which do not face each other, an empty row, or an island", () => {
  const d = room();
  assert.equal(
    measure({
      ...d,
      items: [
        { ...d.items[0], width: 600 },
        { ...d.items[1], width: 600, gapBefore: 0 },
      ],
    }),
    null,
  );
  assert.equal(measure({ ...d, items: [d.items[0]] }), null);
  const { input, built } = calculateKitchenEstimate(d);
  assert.equal(kitchenParallelPassage({ ...input, layout: "u" }, built), null);
  assert.equal(
    kitchenParallelPassage(
      { ...input, island: { x: 0, y: 0, rotation: 0, depth: 900, items: [] } },
      built,
    ),
    null,
  );
});
test("wall cabinets do not shrink a floor passage and a true overlap stays negative", () => {
  const d = room();
  assert.equal(
    measure({
      ...d,
      items: [
        ...d.items,
        { id: uuid(3), wall: "a", catalogId: "wall-shelves-600" },
      ],
    })!.distanceMM,
    1240,
  );
  const { input, built } = calculateKitchenEstimate(d);
  const invalid = kitchenParallelPassage({ ...input, depth: 1000 }, built)!;
  assert.equal(invalid.distanceMM, -160);
});
